// Append-only publisher for final-game B Line snapshots.
// Reads locks + finals already in the repo. Writes data/published/finals.json.
// Pinned board rows are never rewritten. A changed lock becomes a new version
// and does not replace the row the site already shows.
//
// Usage: node data/published/build_published_lines.mjs

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { replayLine } from "./replay.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const OUT = path.join(ROOT, "data/published/finals.json");
const LOCK_DIR = path.join(ROOT, "data/postmortem/locks");

const COMPONENT_KEYS = [
  "prior", "fa", "draft", "madden", "pff", "pff_ytd", "sos", "return", "injury", "adjust", "context",
];

function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function canon(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canon).join(",") + "]";
  const keys = Object.keys(value).filter((k) => k !== "content_sha256").sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canon(value[k])).join(",") + "}";
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function readJson(fp) {
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

function normAbbr(abbr) {
  const a = String(abbr || "").toUpperCase();
  if (a === "WAS" || a === "WFT") return "WSH";
  return a;
}

function pairKey(away, home) {
  return normAbbr(away) + "@" + normAbbr(home);
}

function gameKey(row) {
  return row.season + "|" + row.week + "|" + row.game_id;
}

function qualityOf(lock) {
  const src = String(lock.model_home_spread_source || "");
  const note = [lock.note, lock.notes, src].filter(Boolean).join(" ");
  const model = num(lock.model_home_spread);
  if (model == null) {
    return { lock_quality: "null_line", lock_quality_note: src || "model_home_spread is null" };
  }
  const blob = note.toLowerCase();
  if (blob.includes("reconstruct")) {
    return { lock_quality: "reconstructed", lock_quality_note: src || note };
  }
  if (blob.includes("after final") || blob.includes("post-final") || blob.includes("post_final") || blob.includes("post final")) {
    return { lock_quality: "post_final", lock_quality_note: src || note };
  }
  if (lock.refresh && lock.refresh.confirmed_pre_kick === false) {
    return { lock_quality: "post_final", lock_quality_note: "confirmed_pre_kick is false" };
  }
  return { lock_quality: "official", lock_quality_note: src || "desk_compute" };
}

function sideBlock(stack, prefix, abbr) {
  const raw = (stack && stack[prefix + "_" + abbr]) || {};
  const out = { eff: num(raw.eff) };
  for (const key of COMPONENT_KEYS) out[key] = num(raw[key]);
  const current = num(raw.current_rating);
  if (current != null) out.current_rating = current;
  if (raw.taper && typeof raw.taper === "object") {
    out.taper = {
      N: num(raw.taper.N),
      n: num(raw.taper.n),
      wPrior: num(raw.taper.wPrior),
      wCurr: num(raw.taper.wCurr),
    };
  }
  return out;
}

function replayOf(lock) {
  const stack = lock.feature_stack;
  if (!stack || typeof stack !== "object") return { ok: false };
  const away = sideBlock(stack, "away", lock.away);
  const home = sideBlock(stack, "home", lock.home);
  const replay = {
    ok: false,
    away,
    home,
    hfa: num(stack.hfa),
    coach: num(stack.coach) ?? 0,
    prep: num(stack.prep) ?? 0,
    ats: num(stack.ats) ?? 0,
    travel: num(stack.travel) ?? num(stack.sched) ?? 0,
    matchup: num(stack.matchup) ?? 0,
  };
  if (away.eff == null || home.eff == null || replay.hfa == null) return replay;
  const identity = replayLine(Object.assign({}, replay, { ok: true }), null);
  const model = num(lock.model_home_spread);
  replay.ok = identity != null && model != null && Math.abs(identity - model) < 0.05;
  return replay;
}

function positionOf(bLine, close, homeScore, awayScore) {
  if (bLine == null || close == null || homeScore == null || awayScore == null) return "unavailable";
  const actual = homeScore - awayScore;
  const modelErr = Math.abs(-bLine - actual);
  const marketErr = Math.abs(-close - actual);
  const diff = Math.round((modelErr - marketErr) * 100) / 100;
  if (Math.abs(diff) < 0.05) return "even";
  return diff < 0 ? "b_line" : "market";
}

function atsOf(bLine, close, homeScore, awayScore, away, home) {
  if (bLine == null || close == null || homeScore == null || awayScore == null) {
    return { ats: "unavailable", ats_side: null };
  }
  const edge = close - bLine;
  let side = null;
  if (edge > 0.05) side = "home";
  else if (edge < -0.05) side = "away";
  const margin = (homeScore - awayScore) + close;
  let cover = "push";
  if (margin > 0.05) cover = "home";
  else if (margin < -0.05) cover = "away";
  if (!side || cover === "push") {
    return { ats: "P", ats_side: side === "home" ? home : side === "away" ? away : null };
  }
  return { ats: side === cover ? "W" : "L", ats_side: side === "home" ? home : away };
}

function loadFinalGames() {
  const nfl = readJson(path.join(ROOT, "data/nfl-2026.json"));
  const map = new Map();
  for (const g of nfl.games || []) {
    if (!g || String(g.status).toUpperCase() !== "FINAL") continue;
    const homeScore = num(g.home_score);
    const awayScore = num(g.away_score);
    if (homeScore == null || awayScore == null) continue;
    map.set(String(g.id), {
      espn_id: String(g.id),
      week: Number(g.week),
      away: normAbbr(g.away),
      home: normAbbr(g.home),
      kick: g.date || null,
      neutral: g.neutral === true,
      away_score: awayScore,
      home_score: homeScore,
      venue: g.venue || "",
    });
  }
  return map;
}

function loadCloses() {
  const dir = path.join(ROOT, "data/closes");
  const byEspn = new Map();
  const byPair = new Map();
  if (!fs.existsSync(dir)) return { byEspn, byPair };
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".json")) continue;
    const data = readJson(path.join(dir, name));
    const src = "data/closes/" + name;
    for (const g of data.games || []) {
      const row = {
        open_home_spread: num(g.open_spread),
        close_home_spread: num(g.close_spread),
        open_source: src,
        close_source: src,
      };
      if (g.espn_id) byEspn.set(String(g.espn_id), row);
      if (g.game) byPair.set(String(g.game).replace(/\s+/g, "").toUpperCase(), row);
    }
  }
  return { byEspn, byPair };
}

function loadResults() {
  const dir = path.join(ROOT, "data/postmortem/weeks");
  const byEspn = new Map();
  if (!fs.existsSync(dir)) return byEspn;
  for (const name of fs.readdirSync(dir)) {
    if (!/-results\.json$/.test(name)) continue;
    const data = readJson(path.join(dir, name));
    const src = "data/postmortem/weeks/" + name;
    for (const g of data.games || []) {
      if (!g || !g.espn_id) continue;
      byEspn.set(String(g.espn_id), {
        open_home_spread: num(g.open_spread),
        close_home_spread: num(g.close_spread),
        open_source: src,
        close_source: src,
      });
    }
  }
  return byEspn;
}

function loadOpeners() {
  const index = readJson(path.join(ROOT, "data/openers/index.json"));
  const byEspn = new Map();
  const byPair = new Map();
  for (const name of index.files || []) {
    const fp = path.join(ROOT, "data/openers", name);
    if (!fs.existsSync(fp)) continue;
    const data = readJson(fp);
    const src = "data/openers/" + name;
    for (const g of data.games || []) {
      const line = num(g.street_home);
      if (line == null) continue;
      const row = { open_home_spread: line, open_source: src };
      if (g.espn_id && !byEspn.has(String(g.espn_id))) byEspn.set(String(g.espn_id), row);
      const pair = pairKeyFromLabel(g.game);
      if (pair && !byPair.has(pair)) byPair.set(pair, row);
    }
  }
  return { byEspn, byPair };
}

function pairKeyFromLabel(label) {
  const s = String(label || "").toUpperCase();
  const m = s.match(/([A-Z]{2,3})\s*(?:@|VS\.?|AT)\s*([A-Z]{2,3})/);
  if (!m) return null;
  return pairKey(m[1], m[2]);
}

function loadLocks() {
  const rows = [];
  for (const name of fs.readdirSync(LOCK_DIR)) {
    if (!name.endsWith(".json")) continue;
    if (/freeze|summary|note/i.test(name)) continue;
    const lock = readJson(path.join(LOCK_DIR, name));
    if (!lock || !lock.game_id || !lock.away || !lock.home || !lock.season || !lock.week) continue;
    rows.push({ lock, file: "data/postmortem/locks/" + name });
  }
  return rows;
}

function pickMarket(espnId, pair, closes, results, openers, lock) {
  const closeHit = closes.byEspn.get(espnId) || closes.byPair.get(pair) || null;
  const resultHit = results.get(espnId) || null;
  const openHit = openers.byEspn.get(espnId) || openers.byPair.get(pair) || null;
  let open = null;
  let openSource = null;
  let close = null;
  let closeSource = null;
  if (closeHit && closeHit.open_home_spread != null) {
    open = closeHit.open_home_spread;
    openSource = closeHit.open_source;
  } else if (resultHit && resultHit.open_home_spread != null) {
    open = resultHit.open_home_spread;
    openSource = resultHit.open_source;
  } else if (openHit && openHit.open_home_spread != null) {
    open = openHit.open_home_spread;
    openSource = openHit.open_source;
  }
  if (closeHit && closeHit.close_home_spread != null) {
    close = closeHit.close_home_spread;
    closeSource = closeHit.close_source;
  } else if (resultHit && resultHit.close_home_spread != null) {
    close = resultHit.close_home_spread;
    closeSource = resultHit.close_source;
  } else if (num(lock.close_at_lock) != null) {
    close = num(lock.close_at_lock);
    closeSource = "lock.close_at_lock";
  }
  return {
    open_home_spread: open,
    open_source: openSource,
    close_home_spread: close,
    close_source: closeSource,
  };
}

function buildRow(lock, file, finalGame, market) {
  const q = qualityOf(lock);
  const bLine = num(lock.model_home_spread);
  const away = normAbbr(lock.away);
  const home = normAbbr(lock.home);
  const scores = {
    away_score: finalGame.away_score,
    home_score: finalGame.home_score,
  };
  const pos = q.lock_quality === "null_line"
    ? "unavailable"
    : positionOf(bLine, market.close_home_spread, scores.home_score, scores.away_score);
  const ats = q.lock_quality === "null_line"
    ? { ats: "unavailable", ats_side: null }
    : atsOf(bLine, market.close_home_spread, scores.home_score, scores.away_score, away, home);
  const publishedAt = typeof lock.frozen_at === "string" && lock.frozen_at.trim()
    ? lock.frozen_at.trim()
    : null;
  const row = {
    season: Number(lock.season),
    week: Number(lock.week),
    game_id: pairKey(away, home),
    espn_id: String(lock.espn_id || finalGame.espn_id),
    away,
    home,
    kick: lock.kick || finalGame.kick || null,
    neutral: lock.neutral === true || finalGame.neutral === true,
    status: "FINAL",
    away_score: scores.away_score,
    home_score: scores.home_score,
    open_home_spread: market.open_home_spread,
    open_source: market.open_source,
    close_home_spread: market.close_home_spread,
    close_source: market.close_source,
    b_line_home_spread: bLine,
    b_line_source: file + "#model_home_spread",
    published_at: publishedAt,
    window: lock.window || null,
    model_version: Number(lock.season) + "-w" + String(lock.week).padStart(2, "0") + "-" + pairKey(away, home)
      + ":" + q.lock_quality + ":" + (publishedAt || "undated"),
    lock_file: file,
    lock_quality: q.lock_quality,
    lock_quality_note: q.lock_quality_note,
    position: pos,
    ats: ats.ats,
    ats_side: ats.ats_side,
    replay: replayOf(lock),
  };
  row.version_id = [
    row.season, row.week, row.game_id, row.b_line_home_spread, row.published_at,
    row.lock_quality, row.away_score, row.home_score, row.open_home_spread, row.close_home_spread,
  ].join("|");
  return row;
}

function loadExisting() {
  if (!fs.existsSync(OUT)) {
    return { board: [], versions: [], next_seq: 1 };
  }
  const data = readJson(OUT);
  const board = Array.isArray(data.board) ? data.board : [];
  const versions = Array.isArray(data.versions) ? data.versions : [];
  let next = num(data.next_seq);
  if (next == null) {
    const seqs = board.concat(versions).map((r) => num(r.published_seq)).filter((n) => n != null);
    next = seqs.length ? Math.max(...seqs) + 1 : 1;
  }
  return { board, versions, next_seq: next };
}

function main() {
  const finals = loadFinalGames();
  const closes = loadCloses();
  const results = loadResults();
  const openers = loadOpeners();
  const locks = loadLocks();
  const existing = loadExisting();
  const board = existing.board.slice();
  const versions = existing.versions.slice();
  const boardByGame = new Map(board.map((row) => [gameKey(row), row]));
  const versionById = new Map(versions.map((row) => [row.version_id, row]));
  let nextSeq = existing.next_seq;
  const warnings = [];
  let addedBoard = 0;
  let addedVersions = 0;

  for (const item of locks) {
    const lock = item.lock;
    const espn = String(lock.espn_id || "");
    const finalGame = finals.get(espn);
    if (!finalGame) {
      warnings.push("skip not-final " + item.file + " espn=" + (espn || "none"));
      continue;
    }
    if (Number(finalGame.week) !== Number(lock.week)) {
      warnings.push("skip week mismatch " + item.file + " lock " + lock.week + " nfl " + finalGame.week);
      continue;
    }
    const pair = pairKey(lock.away, lock.home);
    if (pair !== pairKey(finalGame.away, finalGame.home)) {
      warnings.push("skip team mismatch " + item.file + " lock " + pair + " nfl " + pairKey(finalGame.away, finalGame.home));
      continue;
    }
    const market = pickMarket(espn, pair, closes, results, openers, lock);
    const row = buildRow(lock, item.file, finalGame, market);
    let stored = versionById.get(row.version_id);
    if (!stored) {
      row.published_seq = nextSeq;
      nextSeq += 1;
      row.content_sha256 = sha256(canon(row));
      versions.push(row);
      versionById.set(row.version_id, row);
      stored = row;
      addedVersions += 1;
    }
    const key = gameKey(stored);
    if (!boardByGame.has(key)) {
      board.push(stored);
      boardByGame.set(key, stored);
      addedBoard += 1;
    }
  }

  board.sort((a, b) => a.week - b.week || String(a.kick).localeCompare(String(b.kick)) || a.game_id.localeCompare(b.game_id));
  const manifest = sha256(board.map((row) => row.content_sha256).join("\n"));
  const prior = fs.existsSync(OUT) ? readJson(OUT) : null;
  const unchanged = addedBoard === 0 && addedVersions === 0 && prior && prior.manifest_sha256 === manifest;
  const doc = {
    schema: 1,
    season: 2026,
    sign_convention: "Home-centric spreads. Negative means the home team is favored. Projected home margin = -spread. Actual margin = home_score - away_score.",
    position_rule: "Better position is whichever number's projected margin finished closer to the actual margin. A gap under 0.05 points is Even. Compared with the closing line.",
    ats_rule: "ATS is the side the B Line liked against the close (close minus B Line). Home covers when actual margin + close > 0. A tie or a line gap under 0.05 is a push. This is not a ticket, a stake, or a book.",
    immutability: "Board rows are pinned the first time a final game is published and are never rewritten. Later lock edits append a version and do not change the board. Only FINAL games are written. There is no live or pre-kick row in this file.",
    built_at: unchanged && prior.built_at ? prior.built_at : new Date().toISOString(),
    next_seq: nextSeq,
    manifest_sha256: manifest,
    board,
    versions,
  };
  if (unchanged) {
    console.log("unchanged — board left as pinned");
    return;
  }
  fs.writeFileSync(OUT, JSON.stringify(doc, null, 2) + "\n");
  const byQ = {};
  for (const row of board) byQ[row.lock_quality] = (byQ[row.lock_quality] || 0) + 1;
  console.log("board", board.length, "added", addedBoard, "versions", versions.length, "new versions", addedVersions);
  console.log("quality", byQ);
  const weeks = {};
  for (const row of board) weeks[row.week] = (weeks[row.week] || 0) + 1;
  console.log("weeks", weeks);
  const replayFail = board.filter((row) => row.b_line_home_spread != null && row.replay && row.replay.ok !== true);
  console.log("replay not ok", replayFail.map((row) => row.game_id + " w" + row.week).join(", ") || "none");
  const missingOpen = board.filter((row) => row.open_home_spread == null).map((row) => row.game_id);
  const missingClose = board.filter((row) => row.close_home_spread == null).map((row) => row.game_id);
  const missingAt = board.filter((row) => !row.published_at).map((row) => row.game_id);
  if (missingOpen.length) console.log("missing open", missingOpen.join(", "));
  if (missingClose.length) console.log("missing close", missingClose.join(", "));
  if (missingAt.length) console.log("missing published_at", missingAt.join(", "));
  for (const line of warnings) console.log(line);
}

main();

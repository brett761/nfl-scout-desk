#!/usr/bin/env node
/**
 * Append-only published B$ line snapshots.
 *
 *   node data/model/append_model_snapshot.mjs --backfill
 *   node data/model/append_model_snapshot.mjs --week 4
 *   node data/model/append_model_snapshot.mjs --week 4 --now 2026-10-04T16:00:00Z   (pin the clock)
 *   node data/model/append_model_snapshot.mjs --self-test
 *   node data/model/append_model_snapshot.mjs --game-day data/model/game-day-lines-2026-w02-w03.json
 *
 * --week skips games that are already played: FINAL in data/nfl-2026.json or
 * data/published/finals.json, or past kickoff (in progress counts as played).
 * Skipped games are logged. --backfill and --game-day are unchanged: they record
 * pre-kick lines for finished games on purpose.
 *
 * A version already in the file is never edited or deleted.
 * A different line or a different market is a new version.
 * Spreads are home-centric. Negative means the home team is favored.
 */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

// Loaded on demand so --self-test and imports do not evaluate app.js.
async function init() {
  const mod = await import("../site_parity_harness.mjs");
  return mod.init();
}

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const OUT = path.join(ROOT, "data/model/bs-line-history-2026.json");
const LOCK_DIR = path.join(ROOT, "data/postmortem/locks");

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
}

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i < 0) return null;
  const next = process.argv[i + 1];
  if (next == null || next.startsWith("--")) return "";
  return next;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function r2(n) {
  if (n == null || !Number.isFinite(Number(n))) return null;
  return Math.round(Number(n) * 100) / 100;
}

function normAbbr(abbr) {
  const a = String(abbr || "").toUpperCase();
  if (a === "WAS" || a === "WFT") return "WSH";
  if (a === "LA") return "LAR";
  return a;
}

function toIso(value) {
  if (!value) return null;
  const s = String(value).trim();
  const iso = s.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})/);
  if (iso) {
    const d = new Date(iso[0]);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const m = s.match(/(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (m) {
    let h = Number(m[2]);
    if (m[4].toUpperCase() === "PM" && h < 12) h += 12;
    if (m[4].toUpperCase() === "AM" && h === 12) h = 0;
    const d = new Date(`${m[1]}T${String(h).padStart(2, "0")}:${m[3]}:00-04:00`);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

function parseHomeSpread(raw, home, away) {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const asNum = num(raw);
  if (asNum != null && /^\s*[+-]?\d+(?:\.\d+)?\s*$/.test(String(raw))) return asNum;
  const s = String(raw || "").trim();
  if (!s || s.includes("/")) return null;
  const pk = s.match(/^([A-Z]{2,3})\s*(PK|EVEN)$/i);
  if (pk) return 0;
  const m = s.match(/^([A-Z]{2,3})\s*([+-]?\d+(?:\.\d+)?)/i);
  if (!m) return null;
  const fav = normAbbr(m[1]);
  const pts = Math.abs(Number(m[2]));
  if (fav === normAbbr(home)) return -pts;
  if (fav === normAbbr(away)) return pts;
  return null;
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function blank() {
  return {
    schema: 1,
    season: 2026,
    sign_convention: "Home-centric spreads and the B$ line. Negative means the home team is favored.",
    immutability: "Each version is append-only. A correction is a new version. Existing versions are never edited or deleted.",
    games: [],
  };
}

function load() {
  if (!fs.existsSync(OUT)) return blank();
  const data = JSON.parse(fs.readFileSync(OUT, "utf8"));
  if (!Array.isArray(data.games)) data.games = [];
  return data;
}

function canon(value) {
  if (Array.isArray(value)) return "[" + value.map(canon).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map((k) => JSON.stringify(k) + ":" + canon(value[k])).join(",") + "}";
  }
  return JSON.stringify(value);
}

function guard(before, after) {
  const prior = new Map();
  for (const g of before) {
    for (const v of g.versions || []) prior.set(g.game_id + "#" + v.version, canon(v));
  }
  const next = new Map();
  for (const g of after) {
    for (const v of g.versions || []) next.set(g.game_id + "#" + v.version, canon(v));
  }
  for (const [key, fp] of prior) {
    if (!next.has(key)) throw new Error("refusing to delete " + key);
    if (next.get(key) !== fp) throw new Error("refusing to modify " + key);
  }
}

function save(data) {
  data.games.sort((a, b) => Number(a.week) - Number(b.week) || String(a.game_id).localeCompare(String(b.game_id)));
  for (const g of data.games) g.versions.sort((a, b) => a.version - b.version);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n");
}

function gitLog(rel) {
  const out = git(["log", "--follow", "--format=%H%x09%cI", "--", rel]).trim();
  if (!out) return [];
  return out.split("\n").map((line) => {
    const [hash, date] = line.split("\t");
    return { hash, date: toIso(date) || date };
  }).reverse();
}

function showJson(hash, rel) {
  const text = git(["show", hash + ":" + rel]);
  return JSON.parse(text);
}

let nflCommits = null;
const nflCache = new Map();

function nflHistory() {
  if (nflCommits) return nflCommits;
  nflCommits = gitLog("data/nfl-2026.json");
  return nflCommits;
}

function nflAt(iso) {
  const commits = nflHistory();
  if (!commits.length) return null;
  let chosen = commits[0];
  for (const c of commits) {
    if (!iso || c.date <= iso) chosen = c;
  }
  if (!nflCache.has(chosen.hash)) {
    const data = showJson(chosen.hash, "data/nfl-2026.json");
    data.__commit = chosen.hash;
    nflCache.set(chosen.hash, data);
  }
  return nflCache.get(chosen.hash);
}

function loadLineHistory() {
  const data = readJson("data/lines/line-history-2026.json");
  const byEspn = new Map();
  for (const g of data.games || []) byEspn.set(String(g.espn_id), g);
  return byEspn;
}

function latestSnap(row, iso) {
  if (!row) return null;
  const snaps = (row.snapshots || []).filter((s) => num(s.home_spread) != null && s.at && (!iso || s.at <= iso));
  snaps.sort((a, b) => String(a.at).localeCompare(String(b.at)));
  return snaps.length ? snaps[snaps.length - 1] : null;
}

function marketFor(espnId, iso, lock, history) {
  const snap = latestSnap(history.get(String(espnId)), iso);
  let market_spread = snap ? Number(snap.home_spread) : null;
  let market_spread_source = snap ? snap.source : null;
  let market_total = lock ? num(lock.ou_street) : null;
  let market_total_source = market_total != null && lock && lock.__source ? lock.__source : null;
  if (market_spread == null && lock) {
    const street = num(lock.street_home_spread);
    const close = num(lock.close_at_lock);
    if (street != null) {
      market_spread = street;
      market_spread_source = lock.__source || null;
    } else if (close != null) {
      market_spread = close;
      market_spread_source = lock.__source || null;
    }
  }
  const nfl = nflAt(iso);
  const game = nfl && (nfl.games || []).find((g) => String(g.id) === String(espnId));
  if (game) {
    if (market_spread == null) {
      const parsed = parseHomeSpread(game.odds, game.home, game.away);
      if (parsed != null) {
        market_spread = parsed;
        market_spread_source = "data/nfl-2026.json@" + nfl.__commit.slice(0, 12);
      }
    }
    if (market_total == null && num(game.ou) != null) {
      market_total = num(game.ou);
      market_total_source = "data/nfl-2026.json@" + nfl.__commit.slice(0, 12);
    }
  }
  return { market_spread, market_spread_source, market_total, market_total_source };
}

function shape(gameId, week, event, version, supersedes) {
  return {
    version,
    game_id: gameId,
    week,
    published_at: event.published_at,
    source: event.source,
    commit: event.commit,
    b_line: event.b_line,
    market_spread: event.market_spread,
    market_total: event.market_total,
    supersedes,
    backfilled: event.backfilled === true,
    market_spread_source: event.market_spread_source,
    market_total_source: event.market_total_source,
    ...(event.note ? { note: event.note } : {}),
  };
}

function lockEvents() {
  const history = loadLineHistory();
  const names = fs.readdirSync(LOCK_DIR).filter((n) => n.endsWith(".json") && !n.includes("note") && !n.includes("summary"));
  const games = [];
  for (const name of names) {
    const rel = "data/postmortem/locks/" + name;
    const commits = gitLog(rel);
    const events = [];
    for (const c of commits) {
      let row;
      try { row = showJson(c.hash, rel); } catch { continue; }
      if (!row || row.espn_id == null || row.away == null || row.home == null) continue;
      row.__source = rel;
      const line = num(row.model_home_spread);
      const frozen = toIso(row.frozen_at) || c.date;
      const lastFrozen = [...events].reverse().find((e) => !e.corrected);
      if (!lastFrozen || lastFrozen.b_line !== line) {
        events.push({
          b_line: line,
          published_at: frozen,
          commit: c.hash,
          source: rel,
          lock: row,
          corrected: false,
          backfilled: true,
          note: line == null ? "Lock has no B$ line. No number was filled in." : null,
        });
      }
      const corr = num(row.model_home_spread_corrected);
      if (corr != null && corr !== line && !events.some((e) => e.corrected && e.b_line === corr)) {
        events.push({
          b_line: corr,
          published_at: c.date,
          commit: c.hash,
          source: rel + "#model_home_spread_corrected",
          lock: row,
          corrected: true,
          backfilled: true,
          note: "Correction published as a new version. The earlier number stays.",
        });
      }
    }
    if (!events.length) continue;
    events.sort((a, b) => String(a.published_at).localeCompare(String(b.published_at)) || (a.corrected === b.corrected ? 0 : a.corrected ? 1 : -1));
    const head = events[0].lock;
    const gameId = normAbbr(head.away) + "@" + normAbbr(head.home);
    const week = Number(head.week);
    for (const event of events) {
      const m = marketFor(head.espn_id, event.published_at, event.lock, history);
      Object.assign(event, m);
    }
    games.push({
      game_id: gameId,
      espn_id: String(head.espn_id),
      season: 2026,
      week,
      away: normAbbr(head.away),
      home: normAbbr(head.home),
      events,
    });
  }
  return games;
}

async function weekEvents(week) {
  const api = await init();
  const history = loadLineHistory();
  const head = git(["rev-parse", "HEAD"]).trim();
  const nfl = readJson("data/nfl-2026.json");
  const games = [];
  for (const g of nfl.games || []) {
    if (Number(g.week) !== Number(week)) continue;
    const type = String(g.season_type || g.type || "REG").toUpperCase();
    if (type === "PRE" || type === "POST") continue;
    const raw = api.ourHomeSpread(g, 2);
    const b_line = r2(raw);
    const row = history.get(String(g.id));
    const snaps = row ? (row.snapshots || []).filter((s) => s.at && num(s.home_spread) != null) : [];
    snaps.sort((a, b) => String(a.at).localeCompare(String(b.at)));
    const snap = snaps.length ? snaps[snaps.length - 1] : null;
    const oddsAt = toIso(g.odds_updated_at);
    const published_at = [snap && snap.at, oddsAt].filter(Boolean).sort().pop() || new Date().toISOString();
    const parsed = parseHomeSpread(g.odds, g.home, g.away);
    games.push({
      game_id: normAbbr(g.away) + "@" + normAbbr(g.home),
      espn_id: String(g.id),
      season: 2026,
      week: Number(g.week),
      away: normAbbr(g.away),
      home: normAbbr(g.home),
      events: [{
        b_line,
        published_at,
        source: "site_parity_harness ourHomeSpread",
        commit: head,
        backfilled: true,
        market_spread: snap ? Number(snap.home_spread) : parsed,
        market_spread_source: snap ? snap.source : "data/nfl-2026.json",
        market_total: num(g.ou),
        market_total_source: num(g.ou) != null ? "data/nfl-2026.json" : null,
        note: "No lock file. B$ line is the desk ourHomeSpread at backfill. Market is the latest street snapshot.",
      }],
    });
  }
  return games;
}

function sameEvent(version, event) {
  return version.b_line === event.b_line
    && version.published_at === event.published_at
    && version.source === event.source
    && version.commit === event.commit
    && version.market_spread === event.market_spread
    && version.market_total === event.market_total;
}

function mergeGame(existing, built) {
  const versions = (existing && existing.versions) ? existing.versions.map((v) => v) : [];
  const events = built.events;
  if (versions.length > events.length) {
    throw new Error("refusing to delete versions of " + built.game_id);
  }
  for (let i = 0; i < versions.length; i++) {
    if (!sameEvent(versions[i], events[i])) {
      throw new Error("refusing to modify " + built.game_id + " version " + versions[i].version);
    }
  }
  for (let i = versions.length; i < events.length; i++) {
    const version = i + 1;
    versions.push(shape(built.game_id, built.week, events[i], version, version === 1 ? null : version - 1));
  }
  return {
    game_id: built.game_id,
    espn_id: built.espn_id,
    season: 2026,
    week: built.week,
    away: built.away,
    home: built.home,
    versions,
  };
}

function findGame(data, built) {
  return data.games.find((g) => g.game_id === built.game_id && Number(g.week) === Number(built.week)) || null;
}

async function backfill(data) {
  const before = JSON.parse(JSON.stringify(data.games));
  const built = lockEvents();
  const lockedWeeks = new Set(built.map((g) => g.week));
  for (const week of [1, 2, 3, 4]) {
    if (lockedWeeks.has(week) && week !== 4) continue;
    if (week === 4 || !built.some((g) => g.week === week)) {
      const extra = await weekEvents(week);
      for (const g of extra) {
        if (!built.some((x) => x.game_id === g.game_id && x.week === g.week)) built.push(g);
      }
    }
  }
  const next = [];
  const seen = new Set();
  for (const g of data.games) {
    seen.add(g.week + "|" + g.game_id);
    const match = built.find((b) => b.game_id === g.game_id && Number(b.week) === Number(g.week));
    next.push(match ? mergeGame(g, match) : g);
  }
  for (const b of built) {
    const key = b.week + "|" + b.game_id;
    if (seen.has(key)) continue;
    next.push(mergeGame(null, b));
  }
  guard(before, next);
  data.games = next;
  return data;
}

// Why a game must not get a new live version, or null when it is still upcoming.
export function playedReason(game, nowMs, finalIds = new Set()) {
  const status = String(game.status || game.state || "").toUpperCase();
  if (status === "FINAL" || status.startsWith("FINAL") || finalIds.has(String(game.id))) return "FINAL";
  if (status === "IN" || status === "IN_PROGRESS" || status === "LIVE") return "in progress";
  const kick = Date.parse(String(game.date || game.kick || "").replace(/Z?$/, "Z").replace(/([+-]\d{2}:\d{2})Z$/, "$1"));
  if (Number.isFinite(kick) && kick <= nowMs) return "kicked off " + new Date(kick).toISOString();
  return null;
}

function finalIdsFromRepo(nfl) {
  const ids = new Set();
  for (const g of nfl.games || []) if (String(g.status || "").toUpperCase() === "FINAL") ids.add(String(g.id));
  try {
    const finals = readJson("data/published/finals.json");
    for (const row of finals.board || []) if (String(row.status || "").toUpperCase() === "FINAL") ids.add(String(row.espn_id));
  } catch { /* finals file optional */ }
  return ids;
}

// deps lets the self-test run this without the site harness or the repo files.
export async function appendWeek(data, week, deps = {}) {
  const before = JSON.parse(JSON.stringify(data.games));
  const nowMs = deps.now != null ? Number(deps.now) : Date.now();
  const nfl = deps.nfl || readJson("data/nfl-2026.json");
  const history = deps.history || loadLineHistory();
  const head = deps.head || git(["rev-parse", "HEAD"]).trim();
  const finalIds = deps.finalIds || finalIdsFromRepo(nfl);
  const log = deps.log || console.log;
  let lineFor = deps.lineFor;
  if (!lineFor) {
    const api = await init();
    lineFor = (g) => api.ourHomeSpread(g, 2);
  }
  const published_at = new Date(nowMs).toISOString();
  let added = 0;
  const skipped = [];
  for (const g of nfl.games || []) {
    if (Number(g.week) !== Number(week)) continue;
    const type = String(g.season_type || g.type || "REG").toUpperCase();
    if (type === "PRE" || type === "POST") continue;
    const gameId = normAbbr(g.away) + "@" + normAbbr(g.home);
    const played = playedReason(g, nowMs, finalIds);
    if (played) {
      skipped.push(gameId + " (" + played + ")");
      continue;
    }
    const b_line = r2(lineFor(g));
    const row = history.get(String(g.id));
    const snaps = row ? [...(row.snapshots || [])].filter((s) => num(s.home_spread) != null) : [];
    snaps.sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")));
    const snap = snaps.length ? snaps[snaps.length - 1] : null;
    const parsed = parseHomeSpread(g.odds, g.home, g.away);
    const event = {
      b_line,
      published_at,
      source: "data/model/append_model_snapshot.mjs",
      commit: head,
      backfilled: false,
      market_spread: snap ? Number(snap.home_spread) : parsed,
      market_spread_source: snap ? snap.source : "data/nfl-2026.json",
      market_total: num(g.ou),
      market_total_source: num(g.ou) != null ? "data/nfl-2026.json" : null,
    };
    let game = data.games.find((x) => x.game_id === gameId && Number(x.week) === Number(week));
    if (!game) {
      game = {
        game_id: gameId,
        espn_id: String(g.id),
        season: 2026,
        week: Number(week),
        away: normAbbr(g.away),
        home: normAbbr(g.home),
        versions: [],
      };
      data.games.push(game);
    }
    const last = game.versions[game.versions.length - 1];
    if (last && last.b_line === event.b_line && last.market_spread === event.market_spread && last.market_total === event.market_total) {
      continue;
    }
    const version = (last ? last.version : 0) + 1;
    game.versions.push(shape(gameId, Number(week), event, version, version === 1 ? null : version - 1));
    added += 1;
  }
  if (skipped.length) log("week " + week + " skipped " + skipped.length + " played: " + skipped.join(", "));
  guard(before, data.games);
  return added;
}

async function selfTest() {
  const now = Date.parse("2026-10-11T18:00:00Z"); // Sunday 2:00 PM ET, Week 5
  const nfl = { games: [
    { id: "1", week: 5, away: "TB", home: "DAL", date: "2026-10-09T00:15Z", status: "FINAL", odds: "DAL -10", ou: 47.5 },
    { id: "2", week: 5, away: "NYG", home: "WSH", date: "2026-10-11T17:00Z", odds: "WSH -3", ou: 43.5 },
    { id: "3", week: 5, away: "BUF", home: "LAR", date: "2026-10-13T00:15Z", odds: "LAR -2.5", ou: 53.5 },
    { id: "4", week: 5, away: "DEN", home: "LAC", date: "2026-10-11T20:05Z", odds: "LAC -3.5", ou: 42.5 },
    { id: "9", week: 4, away: "PIT", home: "CLE", date: "2026-10-02T00:15Z", odds: "CLE -1", ou: 40 },
  ] };
  const base = (gameId, espn, b) => ({
    game_id: gameId, espn_id: espn, season: 2026, week: 5, away: gameId.split("@")[0], home: gameId.split("@")[1],
    versions: [shape(gameId, 5, { b_line: b, published_at: "2026-10-05T14:59:32.522Z", source: "t", commit: "c", market_spread: -3, market_total: 40, market_spread_source: null, market_total_source: null }, 1, null)],
  });
  const data = { games: [base("TB@DAL", "1", -9.22), base("NYG@WSH", "2", 5.29), base("BUF@LAR", "3", -3.99)] };
  const logs = [];
  const deps = { now, nfl, history: new Map(), head: "selftest", finalIds: new Set(["4"]), lineFor: () => 1.23, log: (m) => logs.push(m) };
  const added = await appendWeek(data, 5, deps);
  const count = (id) => data.games.find((g) => g.game_id === id)?.versions.length || 0;
  const fail = (m) => { throw new Error("self-test: " + m); };
  if (count("TB@DAL") !== 1) fail("FINAL game TB@DAL got a new version");
  if (count("NYG@WSH") !== 1) fail("kicked-off game NYG@WSH got a new version");
  if (count("DEN@LAC") !== 0) fail("game FINAL in finals.json got a version");
  if (count("BUF@LAR") !== 2) fail("upcoming game BUF@LAR did not get a new version");
  if (added !== 1) fail("expected 1 added, got " + added);
  if (count("PIT@CLE") !== 0) fail("--week 5 touched a week 4 game");
  const msg = logs.join("\n");
  for (const want of ["TB@DAL (FINAL)", "NYG@WSH (kicked off", "DEN@LAC (FINAL)"]) if (!msg.includes(want)) fail("skip log missing " + want);
  if (playedReason({ date: "2026-10-13T00:15Z" }, now) !== null) fail("upcoming game reported played");
  if (!playedReason({ date: "2026-10-11T17:00Z" }, now)) fail("in-progress game reported upcoming");
  const again = await appendWeek(data, 5, deps);
  if (again !== 0) fail("re-run should add nothing");
  console.log("self-test ok: FINAL / kicked-off / finals.json games skipped, upcoming game appended (" + logs[0] + ")");
}

function appendGameDay(data, rel) {
  const before = JSON.parse(JSON.stringify(data.games));
  const doc = JSON.parse(fs.readFileSync(path.resolve(ROOT, rel), "utf8"));
  const history = loadLineHistory();
  let added = 0;
  for (const ev of doc.events || []) {
    const game = data.games.find((x) => x.game_id === ev.game_id && Number(x.week) === Number(ev.week));
    if (!game) throw new Error("no history row for " + ev.game_id + " week " + ev.week);
    const short = String(ev.commit).slice(0, 7);
    const source = "game-day site compute @" + short;
    if (game.versions.some((v) => v.source === source && v.commit === ev.commit && v.b_line === ev.b_line)) continue;
    const last = game.versions[game.versions.length - 1] || null;
    const published_at = toIso(ev.commit_at);
    const m = marketFor(ev.espn_id, published_at, null, history);
    const prior = last
      ? "v" + last.version + " " + (last.b_line == null ? "null" : last.b_line) + " (" + last.source + ")"
      : "none";
    const missing = (ev.missing_at_commit || []).length
      ? " Files absent at that commit (the live site 404'd them too): " + ev.missing_at_commit.join(", ") + "."
      : "";
    const note = "Game-day line: site app.js ourHomeSpread at " + short + ", the last main commit deployed to Pages before the "
      + ev.window + " kick " + ev.kick_et + " (deploy done " + ev.pages_deploy_done + "). Clock pinned to kick minus 5 min, default profile, HFA 2."
      + " Supersedes " + prior + "." + missing;
    const version = (last ? last.version : 0) + 1;
    game.versions.push(shape(game.game_id, Number(ev.week), {
      b_line: r2(ev.b_line),
      published_at,
      source,
      commit: ev.commit,
      backfilled: true,
      market_spread: m.market_spread,
      market_spread_source: m.market_spread_source,
      market_total: m.market_total,
      market_total_source: m.market_total_source,
      note,
    }, version, last ? last.version : null));
    added += 1;
  }
  guard(before, data.games);
  return added;
}

async function main() {
  if (hasFlag("--self-test")) {
    await selfTest();
    return;
  }
  const data = load();
  if (hasFlag("--backfill")) {
    await backfill(data);
    save(data);
    const versions = data.games.reduce((n, g) => n + g.versions.length, 0);
    console.log("games " + data.games.length + " versions " + versions);
    console.log("wrote " + path.relative(ROOT, OUT));
    return;
  }
  const gameDay = arg("--game-day");
  if (gameDay) {
    const added = appendGameDay(data, gameDay);
    if (added) save(data);
    console.log("game-day appended " + added);
    return;
  }
  const week = arg("--week");
  if (!week) {
    console.error("Pass --backfill or --week N");
    process.exit(1);
  }
  const nowArg = arg("--now");
  const now = nowArg ? Date.parse(nowArg) : undefined;
  if (nowArg && !Number.isFinite(now)) {
    console.error("--now must be an ISO timestamp");
    process.exit(1);
  }
  const added = await appendWeek(data, Number(week), { now });
  if (added) save(data);
  console.log("week " + week + " appended " + added);
  if (added) console.log("wrote " + path.relative(ROOT, OUT));
}

if (process.argv[1] && process.argv[1].endsWith("append_model_snapshot.mjs")) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}

#!/usr/bin/env node
/**
 * Append one street snapshot per game to data/lines/line-history-2026.json.
 *
 * Daily line refresh (current board in data/nfl-2026.json):
 *   node data/lines/append_line_snapshot.mjs --tag mid --week 4
 *
 * Monday opener file:
 *   node data/lines/append_line_snapshot.mjs --tag open --week 4 --from data/openers/2026-09-28-week4-monday.json
 *
 * Pre-kick lock / closes file (close_spread or close_at_lock):
 *   node data/lines/append_line_snapshot.mjs --tag close --week 3 --from data/closes/2026-w03.json
 *
 * Rebuild Weeks 1–4 from files already in the repo:
 *   node data/lines/append_line_snapshot.mjs --backfill
 *
 *   node data/lines/append_line_snapshot.mjs --self-test
 *
 * Every live append records an ISO timestamp: the row's stamp, else the source file's
 * captured time (pulled, captured_at, fetched_at, then pulled_et like "2026-10-05 8:25 AM ET"),
 * else --at, else the current time. A null "at" is never written.
 *
 * A snapshot is skipped when the same tag, spread, source, and timestamp
 * are already stored. Pass --force to append anyway.
 * Spreads are home-centric. Negative means the home team is favored.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const OUT = path.join(ROOT, "data/lines/line-history-2026.json");

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

function readJson(rel) {
  const fp = path.isAbsolute(rel) ? rel : path.join(ROOT, rel);
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

function normAbbr(abbr) {
  const a = String(abbr || "").toUpperCase();
  if (a === "WAS" || a === "WFT") return "WSH";
  if (a === "LA") return "LAR";
  return a;
}

function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function relPath(fp) {
  return path.relative(ROOT, fp).split(path.sep).join("/");
}

function loadNfl() {
  return readJson("data/nfl-2026.json");
}

function regGames(week) {
  const nfl = loadNfl();
  return (nfl.games || []).filter((g) => {
    if (week != null && Number(g.week) !== Number(week)) return false;
    const t = String(g.season_type || g.type || "REG").toUpperCase();
    return t !== "PRE" && t !== "POST";
  });
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

function rowTeams(row) {
  const raw = String(row.game || row.game_id || "").toUpperCase().replace(/\s+/g, " ").trim();
  const at = raw.match(/^([A-Z]{2,3})\s*@\s*([A-Z]{2,3})/) || raw.match(/^([A-Z]{2,3})@([A-Z]{2,3})/);
  if (at) return { away: normAbbr(at[1]), home: normAbbr(at[2]) };
  const vs = raw.match(/^([A-Z]{2,3})\s+VS\.?\s+([A-Z]{2,3})/);
  if (vs) return { away: normAbbr(vs[1]), home: normAbbr(vs[2]) };
  return {
    away: row.away ? normAbbr(row.away) : null,
    home: row.home ? normAbbr(row.home) : null,
  };
}

function matchGame(games, row, week) {
  const teams = rowTeams(row);
  return games.find((g) => {
    if (week != null && Number(g.week) !== Number(week)) return false;
    if (row.espn_id != null && String(row.espn_id) === String(g.id)) return true;
    if (!teams.away || !teams.home) return false;
    const home = normAbbr(g.home);
    const away = normAbbr(g.away);
    return (teams.away === away && teams.home === home) || (teams.away === home && teams.home === away && /VS/.test(String(row.game || "").toUpperCase()));
  }) || null;
}

function blankHistory() {
  return {
    schema: 1,
    season: 2026,
    sign_convention: "Home-centric spreads. Negative means the home team is favored.",
    note: "Our own open, midweek, and close history. The B$ line is not stored here.",
    updated_at: new Date().toISOString(),
    games: [],
  };
}

function loadHistory() {
  if (!fs.existsSync(OUT)) return blankHistory();
  const data = JSON.parse(fs.readFileSync(OUT, "utf8"));
  if (!Array.isArray(data.games)) data.games = [];
  return data;
}

function saveHistory(data) {
  data.updated_at = new Date().toISOString();
  data.games.sort((a, b) => Number(a.week) - Number(b.week) || String(a.espn_id).localeCompare(String(b.espn_id)));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n");
}

function ensureGame(data, game) {
  let row = data.games.find((g) => String(g.espn_id) === String(game.id));
  if (!row) {
    row = {
      espn_id: String(game.id),
      season: 2026,
      week: Number(game.week),
      away: normAbbr(game.away),
      home: normAbbr(game.home),
      snapshots: [],
    };
    data.games.push(row);
  }
  return row;
}

// Offset of America/New_York at a given UTC instant, as "-04:00" (EDT) or "-05:00" (EST).
function nyOffset(utcMs) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const v = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(Number(v.year), Number(v.month) - 1, Number(v.day), Number(v.hour) % 24, Number(v.minute), Number(v.second));
  const mins = Math.round((asUtc - utcMs) / 60000);
  const sign = mins < 0 ? "-" : "+";
  const a = Math.abs(mins);
  return `${sign}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`;
}

// Accepts an ISO timestamp, or an Eastern wall-clock string like "2026-10-05 8:25 AM ET"
// (also "~8:50 AM ET"). Returns UTC ISO ("...Z"), the format every snapshot in the file uses,
// or null when the value cannot be read.
export function toIso(value) {
  if (!value) return null;
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const m = s.match(/(\d{4}-\d{2}-\d{2})[ T]~?\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (m) {
    let h = Number(m[2]);
    if (m[4].toUpperCase() === "PM" && h < 12) h += 12;
    if (m[4].toUpperCase() === "AM" && h === 12) h = 0;
    const wall = `${m[1]}T${String(h).padStart(2, "0")}:${m[3]}:00`;
    // Eastern wall clock: EDT or EST depending on the date (DST ends Nov 1, 2026).
    const guess = Date.parse(wall + "Z");
    const d = new Date(wall + nyOffset(guess + 5 * 3600 * 1000));
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

// Capture time for a file-sourced snapshot: the row's own stamp, then the file's
// captured/fetched time (pulled, then pulled_et), then --at.
export function captureTime(row, file, cliAt) {
  const candidates = [
    row && row.frozen_at, row && row.odds_updated_at, row && row.pulled,
    file && file.pulled, file && file.captured_at, file && file.fetched_at, file && file.pulled_et,
    cliAt,
  ];
  for (const c of candidates) {
    const iso = toIso(c);
    if (iso) return iso;
  }
  return null;
}

function addSnap(data, game, snap, force, opts = {}) {
  if (!game) return "skip";
  if (snap.home_spread == null || !Number.isFinite(Number(snap.home_spread))) return "skip";
  const row = ensureGame(data, game);
  let at = toIso(snap.at);
  if (!at && opts.nowFallback) {
    // No usable source time: stamp the moment we recorded it rather than writing null.
    at = new Date().toISOString();
    console.warn(`no source time for ${normAbbr(game.away)}@${normAbbr(game.home)} (${snap.source}); using now ${at}`);
  }
  const next = {
    tag: snap.tag,
    home_spread: Number(snap.home_spread),
    at,
    source: snap.source,
  };
  if (snap.note) next.note = snap.note;
  if (row.snapshots.some((s) => s.tag === next.tag && Number(s.home_spread) === Number(next.home_spread) && s.source === next.source && s.at === next.at)) return "dup";
  if (!force) {
    const prior = [...row.snapshots].reverse().find((s) => s.tag === next.tag);
    if (prior && Number(prior.home_spread) === next.home_spread) return "dup";
  }
  row.snapshots.push(next);
  row.snapshots.sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")));
  return "add";
}

function spreadFromBoardRow(row, game) {
  if (row.street_home != null && num(row.street_home) != null) return num(row.street_home);
  if (row.open_spread != null && num(row.open_spread) != null && typeof row.open_spread === "number") return num(row.open_spread);
  if (row.close_spread != null && num(row.close_spread) != null) return num(row.close_spread);
  if (row.close_at_lock != null && num(row.close_at_lock) != null) return num(row.close_at_lock);
  return parseHomeSpread(row.spread || row.odds, game.home, game.away);
}

function appendFromFile(data, tag, week, from, force) {
  const file = readJson(from);
  const games = regGames(week || file.week);
  const rows = Array.isArray(file.games) ? file.games : [];
  let added = 0;
  let skipped = 0;
  for (const row of rows) {
    if (row.model_home_spread != null && row.close_at_lock == null && row.street_home_spread == null && row.spread == null) {
      skipped += 1;
      continue;
    }
    const game = matchGame(games, row, week || file.week || row.week);
    if (!game) {
      skipped += 1;
      continue;
    }
    let spread = null;
    if (tag === "close") {
      spread = num(row.close_spread);
      if (spread == null) spread = num(row.close_at_lock);
      if (spread == null) spread = num(row.close_home_spread);
      if (spread == null) spread = num(row.street_home_spread);
    } else if (tag === "open") {
      spread = num(row.open_spread);
      if (spread == null) spread = num(row.street_home);
      if (spread == null) spread = num(row.open_home_spread);
      if (spread == null) spread = parseHomeSpread(row.spread, game.home, game.away);
    } else {
      spread = spreadFromBoardRow(row, game);
    }
    const at = captureTime(row, file, arg("--at"));
    const status = addSnap(data, game, {
      tag,
      home_spread: spread,
      at,
      source: relPath(path.isAbsolute(from) ? from : path.join(ROOT, from)),
      note: row.note || row.notes || file.source || null,
    }, force, { nowFallback: true });
    if (status === "add") added += 1;
    else skipped += 1;
  }
  return { added, skipped };
}

function appendFromSchedule(data, tag, week, force) {
  const nfl = loadNfl();
  const games = regGames(week);
  let added = 0;
  let skipped = 0;
  for (const game of games) {
    const spread = parseHomeSpread(game.odds, game.home, game.away);
    const status = addSnap(data, game, {
      tag,
      home_spread: spread,
      at: game.odds_updated_at || nfl.pulled || null,
      source: "data/nfl-2026.json",
      note: game.street_source || nfl.source || null,
    }, force, { nowFallback: true });
    if (status === "add") added += 1;
    else skipped += 1;
  }
  return { added, skipped };
}

function listJson(dir) {
  const fp = path.join(ROOT, dir);
  if (!fs.existsSync(fp)) return [];
  return fs.readdirSync(fp).filter((n) => n.endsWith(".json")).map((n) => path.join(dir, n));
}

function backfill(data) {
  const games = regGames(null);
  const bags = new Map();
  const bagFor = (game) => {
    const id = String(game.id);
    if (!bags.has(id)) bags.set(id, { game, ticks: [], closes: [], openFallback: [] });
    return bags.get(id);
  };
  const push = (game, list, item) => {
    if (!game || item.home_spread == null) return;
    bagFor(game)[list].push({
      home_spread: Number(item.home_spread),
      at: toIso(item.at),
      source: item.source,
      note: item.note || null,
    });
  };

  const openerIdx = readJson("data/openers/index.json");
  const openers = (openerIdx.files || []).map((name) => {
    const rel = "data/openers/" + name;
    return { rel, file: readJson(rel) };
  }).sort((a, b) => String(a.file.pulled || "").localeCompare(String(b.file.pulled || "")));
  for (const file of openers) {
    const week = Number(file.file.week);
    if (![1, 2, 3, 4].includes(week)) continue;
    for (const row of file.file.games || []) {
      const game = matchGame(games, row, week);
      if (!game) continue;
      const spread = num(row.street_home) != null ? num(row.street_home) : parseHomeSpread(row.spread, game.home, game.away);
      push(game, "ticks", { home_spread: spread, at: file.file.pulled, source: file.rel, note: file.file.pulled_et || "opener" });
    }
  }

  for (const rel of listJson("data/line-log")) {
    if (rel.endsWith("index.json")) continue;
    const file = readJson(rel);
    const week = Number(file.week);
    if (![1, 2, 3, 4].includes(week)) continue;
    for (const row of file.games || []) {
      const game = matchGame(games, row, week);
      if (!game) continue;
      for (const day of ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]) {
        const cell = row.lines && row.lines[day];
        if (!cell || num(cell.street) == null) continue;
        push(game, "ticks", { home_spread: num(cell.street), at: cell.as_of || file.pulled, source: rel + "#" + day, note: cell.note || day });
      }
    }
  }

  for (const rel of ["data/closes/2026-w01.json", "data/closes/2026-w02.json"]) {
    if (!fs.existsSync(path.join(ROOT, rel))) continue;
    const file = readJson(rel);
    for (const row of file.games || []) {
      const game = matchGame(games, row, file.week);
      if (!game) continue;
      push(game, "openFallback", { home_spread: num(row.open_spread), at: file.pulled, source: rel, note: "closes file open" });
      push(game, "closes", { home_spread: num(row.close_spread), at: file.pulled, source: rel, note: "closes file close" });
    }
  }

  for (const rel of listJson("data/postmortem/locks")) {
    const base = path.basename(rel);
    if (base.includes("note") || base.includes("summary")) continue;
    const row = readJson(rel);
    if (!row.espn_id) continue;
    const game = games.find((g) => String(g.id) === String(row.espn_id));
    if (!game || ![1, 2, 3, 4].includes(Number(game.week))) continue;
    push(game, "closes", { home_spread: num(row.close_at_lock), at: row.frozen_at, source: rel, note: "pre-kick lock" });
  }

  const finals = readJson("data/published/finals.json");
  for (const row of finals.board || []) {
    const game = games.find((g) => String(g.id) === String(row.espn_id));
    if (!game || ![1, 2, 3, 4].includes(Number(row.week))) continue;
    push(game, "openFallback", {
      home_spread: num(row.open_home_spread),
      at: finals.built_at,
      source: row.open_source || "data/published/finals.json",
      note: "finals open",
    });
    push(game, "closes", {
      home_spread: num(row.close_home_spread),
      at: finals.built_at,
      source: row.close_source || "data/published/finals.json",
      note: "finals close",
    });
  }

  for (const game of games.filter((g) => Number(g.week) === 4)) {
    push(game, "ticks", {
      home_spread: parseHomeSpread(game.odds, game.home, game.away),
      at: game.odds_updated_at,
      source: "data/nfl-2026.json",
      note: game.street_source || "current board",
    });
  }

  let added = 0;
  const take = (game, snap) => {
    if (addSnap(data, game, snap, true) === "add") added += 1;
  };
  for (const bag of bags.values()) {
    const ticks = bag.ticks.filter((t) => t.at).sort((a, b) => a.at.localeCompare(b.at));
    const open = ticks[0] || bag.openFallback.find((t) => t.home_spread != null);
    if (!open) continue;
    take(bag.game, { tag: "open", ...open });
    let close = bag.closes.find((c) => c.note === "finals close" && c.home_spread != null)
      || bag.closes.find((c) => c.note === "closes file close" && c.home_spread != null)
      || bag.closes.find((c) => c.note === "pre-kick lock" && c.home_spread != null);
    if (close) {
      const earlier = bag.closes
        .filter((c) => c.home_spread != null && Number(c.home_spread) === Number(close.home_spread) && c.at)
        .sort((a, b) => a.at.localeCompare(b.at))[0];
      if (earlier) close = { ...close, at: earlier.at, source: earlier.source.startsWith("data/") ? earlier.source : close.source };
    }
    let prev = open.home_spread;
    let mids = 0;
    for (const t of ticks.slice(ticks[0] ? 1 : 0)) {
      if (t === open) continue;
      if (close && close.at && t.at && t.at > close.at) continue;
      if (Number(t.home_spread) === Number(prev)) continue;
      take(bag.game, { tag: "mid", ...t });
      prev = t.home_spread;
      mids += 1;
    }
    if (Number(bag.game.week) === 4) {
      const current = [...ticks].reverse().find((t) => t.source === "data/nfl-2026.json");
      if (current && current.at && current.at !== open.at) {
        take(bag.game, { tag: "mid", ...current });
      }
    }
    if (close) take(bag.game, { tag: "close", ...close });
    void mids;
  }
  return added;
}

function selfTest() {
  const fail = (m) => { throw new Error("self-test: " + m); };
  const w5 = { pulled_et: "2026-10-05 8:25 AM ET", games: [{ game: "TB @ DAL", when: "2026-10-09T00:15Z", street_home: -10 }] };
  if (captureTime(w5.games[0], w5, null) !== "2026-10-05T12:25:00.000Z") fail("pulled_et-only file should give 12:25Z");
  const w4 = { pulled: "2026-09-28T12:08:29Z", pulled_et: "2026-09-28 8:05 AM ET" };
  if (captureTime({}, w4, null) !== "2026-09-28T12:08:29.000Z") fail("pulled should win over pulled_et");
  if (toIso("2026-11-09 8:05 AM ET") !== "2026-11-09T13:05:00.000Z") fail("EST offset after Nov 1");
  if (captureTime({}, {}, null) !== null) fail("no source time should be null before the now fallback");
  const data = { games: [] };
  const game = { id: "1", week: 5, away: "TB", home: "DAL" };
  const origWarn = console.warn; console.warn = () => {};
  try { addSnap(data, game, { tag: "open", home_spread: -10, at: null, source: "x" }, false, { nowFallback: true }); }
  finally { console.warn = origWarn; }
  const at = data.games[0].snapshots[0].at;
  if (!at || Math.abs(Date.parse(at) - Date.now()) > 60000) fail("missing time should fall back to now, got " + at);
  console.log("self-test ok");
}

function main() {
  if (hasFlag("--self-test")) {
    selfTest();
    return;
  }
  const back = hasFlag("--backfill");
  const force = hasFlag("--force");
  const data = back ? blankHistory() : loadHistory();
  if (back) {
    const added = backfill(data);
    saveHistory(data);
    const tags = {};
    for (const g of data.games) {
      for (const s of g.snapshots) tags[s.tag] = (tags[s.tag] || 0) + 1;
    }
    console.log(`backfill games ${data.games.length} snapshots ${data.games.reduce((n, g) => n + g.snapshots.length, 0)} added ${added}`);
    console.log(tags);
    console.log("wrote " + path.relative(ROOT, OUT));
    return;
  }
  const tag = arg("--tag") || "mid";
  if (!["open", "mid", "close"].includes(tag)) {
    console.error("--tag must be open, mid, or close");
    process.exit(1);
  }
  const week = arg("--week");
  const from = arg("--from");
  const result = from
    ? appendFromFile(data, tag, week ? Number(week) : null, from, force)
    : appendFromSchedule(data, tag, week ? Number(week) : null, force);
  saveHistory(data);
  console.log(`${tag} added ${result.added} skipped ${result.skipped}`);
  console.log("wrote " + path.relative(ROOT, OUT));
}

if (process.argv[1] && process.argv[1].endsWith("append_line_snapshot.mjs")) main();

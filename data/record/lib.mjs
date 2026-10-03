// Canonical bet record. Weeks 2–3 official B$ lines are the game-day
// snapshots already used for grading. They are not rounded. From Week 4
// the official line is the locked raw projection rounded to the nearest
// 0.5, halfway cases away from zero. Lock files are never rewritten.
import fs from "fs";
import path from "path";
import { atsGrade as gradeAts, indexGameDay, gameDayFor } from "../model/game_day_grade.mjs";

export const SPORTSBOOK = "ESPN DraftKings";
export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");

const DK_RE = /draft\s*kings|draftkings|pickcenter/i;
const EPS = 0.05;

export function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function round2(n) {
  if (n == null || !Number.isFinite(Number(n))) return null;
  return Math.round(Number(n) * 100) / 100;
}

// Nearest 0.5. Exact .25 / .75 (halfway) rounds away from zero.
export function roundHalfAwayFromZero(value) {
  const n = num(value);
  if (n == null) return null;
  const sign = n < 0 ? -1 : 1;
  const steps = Math.abs(n) / 0.5;
  const lower = Math.floor(steps + 1e-9);
  const frac = steps - lower;
  const roundedSteps = frac > 0.5 - 1e-8 ? lower + 1 : lower;
  const out = sign * roundedSteps * 0.5;
  return out === 0 ? 0 : out;
}

export function onHalfStep(value) {
  const n = num(value);
  if (n == null) return false;
  return Math.abs(n * 2 - Math.round(n * 2)) < 1e-6;
}

export function atsGrade(bLine, close, row) {
  return gradeAts(bLine, close, row);
}

export function clvOf(open, close, bLine) {
  const o = num(open);
  const c = num(close);
  const b = num(bLine);
  if (o == null || c == null || b == null) return null;
  if (Math.abs(b - o) < EPS) return 0;
  const raw = b < o ? o - c : c - o;
  return round2(raw);
}

export function beatClose(clv) {
  return clv != null && clv > EPS;
}

export function upsetOf(close, bLine, home, away, homeScore, awayScore) {
  const c = num(close);
  const b = num(bLine);
  const hs = num(homeScore);
  const as = num(awayScore);
  const empty = {
    pickem: false,
    favorite: null,
    underdog: null,
    upset: null,
    b_upset_call: null,
    b_upset_correct: null,
  };
  if (c == null || hs == null || as == null) return empty;
  if (Math.abs(c) < EPS) {
    return { ...empty, pickem: true, upset: false, b_upset_call: false, b_upset_correct: null };
  }
  const favorite = c < 0 ? home : away;
  const underdog = c < 0 ? away : home;
  const dogScore = underdog === home ? hs : as;
  const favScore = favorite === home ? hs : as;
  const upset = dogScore > favScore;
  let call = false;
  if (b != null) {
    if (underdog === home) call = b < -EPS;
    else call = b > EPS;
  }
  return {
    pickem: false,
    favorite,
    underdog,
    upset,
    b_upset_call: call,
    b_upset_correct: call ? upset : null,
  };
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

const fileCache = new Map();
function loadSourceFile(source) {
  const file = String(source || "").split("#")[0];
  if (!file.endsWith(".json")) return null;
  if (fileCache.has(file)) return fileCache.get(file);
  let doc = null;
  try {
    doc = JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
  } catch {
    doc = null;
  }
  fileCache.set(file, doc);
  return doc;
}

export function isDraftKings(snapshot) {
  if (!snapshot) return false;
  const doc = loadSourceFile(snapshot.source);
  const bits = [snapshot.source, snapshot.note, doc && doc.source, doc && doc.note, doc && doc.street_note, doc && doc.process]
    .filter(Boolean)
    .join("\n");
  return DK_RE.test(bits);
}

function parseStamp(value) {
  if (!value) return null;
  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) return direct;
  const clock = String(value).match(/(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (clock) {
    let hour = Number(clock[2]);
    const minute = Number(clock[3]);
    const ap = clock[4].toUpperCase();
    if (ap === "PM" && hour < 12) hour += 12;
    if (ap === "AM" && hour === 12) hour = 0;
    return Date.parse(`${clock[1]}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-04:00`);
  }
  const day = String(value).match(/(\d{4}-\d{2}-\d{2})/);
  if (day) return Date.parse(day[1] + "T16:00:00Z");
  return null;
}

function beforeKick(stamp, kick) {
  const a = parseStamp(stamp);
  const k = parseStamp(kick);
  if (a == null || k == null) return false;
  return a < k;
}

function lineHistoryByEspn(lineHistory) {
  const map = new Map();
  for (const game of (lineHistory && lineHistory.games) || []) {
    if (game && game.espn_id != null) map.set(String(game.espn_id), game);
  }
  return map;
}

function latestGameDay(historyGame) {
  let last = null;
  for (const version of (historyGame && historyGame.versions) || []) {
    if (!version || !String(version.source || "").startsWith("game-day site compute")) continue;
    if (num(version.b_line) == null) continue;
    if (!last || Number(version.version) >= Number(last.version)) last = version;
  }
  return last;
}

const LINE_LOG_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function lineLogFallback(week, espnId, kick) {
  const rel = "data/line-log/2026-W" + String(week).padStart(2, "0") + ".json";
  const doc = loadSourceFile(rel);
  if (!doc || !Array.isArray(doc.games)) return null;
  const game = doc.games.find((g) => g && String(g.id) === String(espnId));
  if (!game || !game.lines) return null;
  for (const day of LINE_LOG_DAYS) {
    const row = game.lines[day];
    if (!row || num(row.street) == null) continue;
    if (!DK_RE.test(String(row.note || ""))) continue;
    if (!beforeKick(row.as_of, kick)) continue;
    return {
      home_spread: num(row.street),
      source: rel + "#" + day,
      at: row.as_of || null,
      note: row.note || "",
      basis: "line-log",
    };
  }
  return null;
}

function marketFor(game, kick) {
  const snaps = (game && game.snapshots) || [];
  let close = null;
  for (const snap of snaps) {
    if (!snap || snap.tag !== "close" || num(snap.home_spread) == null) continue;
    if (!isDraftKings(snap)) continue;
    close = snap;
  }
  const opens = [];
  for (const snap of snaps) {
    if (!snap || snap === close || snap.tag === "close") continue;
    if (num(snap.home_spread) == null || !isDraftKings(snap)) continue;
    if (!beforeKick(snap.at, kick)) continue;
    opens.push(snap);
  }
  opens.sort((a, b) => parseStamp(a.at) - parseStamp(b.at));
  return { open: opens[0] || null, close };
}

function fmtRecord(w, l, p) {
  return w + "-" + l + "-" + p;
}

function pctOf(wins, losses) {
  const decided = wins + losses;
  if (!decided) return null;
  return Math.round((1000 * wins) / decided) / 10;
}

export function summarize(games) {
  const official = games.filter((g) => g.in_official_record);
  const tally = { W: 0, L: 0, P: 0 };
  const byWeek = new Map();
  let clvN = 0;
  let clvSum = 0;
  let beat = 0;
  let favorites = 0;
  let upsets = 0;
  let calls = 0;
  let callsCorrect = 0;
  for (const game of official) {
    if (tally[game.ats] != null) tally[game.ats] += 1;
    if (!byWeek.has(game.week)) byWeek.set(game.week, { W: 0, L: 0, P: 0 });
    const week = byWeek.get(game.week);
    if (week[game.ats] != null) week[game.ats] += 1;
    if (game.clv != null) {
      clvN += 1;
      clvSum += game.clv;
      if (game.beat_close) beat += 1;
    }
    if (!game.pickem && game.close_home_spread != null) favorites += 1;
    if (game.upset) upsets += 1;
    if (game.b_upset_call) {
      calls += 1;
      if (game.b_upset_correct) callsCorrect += 1;
    }
  }
  const weeks = [...byWeek.entries()].sort((a, b) => a[0] - b[0]).map(([week, rec]) => ({
    week,
    w: rec.W,
    l: rec.L,
    p: rec.P,
    n: rec.W + rec.L + rec.P,
    text: fmtRecord(rec.W, rec.L, rec.P),
    pct: pctOf(rec.W, rec.L),
  }));
  const callsWrong = calls - callsCorrect;
  return {
    games: official.length,
    ats: {
      w: tally.W,
      l: tally.L,
      p: tally.P,
      n: tally.W + tally.L + tally.P,
      text: fmtRecord(tally.W, tally.L, tally.P),
      pct: pctOf(tally.W, tally.L),
    },
    weeks,
    clv: {
      n: clvN,
      avg: clvN ? round2(clvSum / clvN) : null,
      beat,
      beat_pct: clvN ? Math.round((1000 * beat) / clvN) / 10 : null,
    },
    upset: {
      favorites,
      upsets,
      calls,
      correct: callsCorrect,
      incorrect: callsWrong,
      text: callsCorrect + "-" + callsWrong + "-" + "0",
      pct: pctOf(callsCorrect, callsWrong),
    },
  };
}

function reviewItem(field, reason) {
  return { field, reason };
}

function buildOfficial(row, historyIndex, historyGame, lineGame) {
  const review = [];
  const gd = latestGameDay(historyGame);
  const indexed = gameDayFor(historyIndex, row);
  const raw = gd ? num(gd.b_line) : null;
  if (!gd || raw == null) {
    review.push(reviewItem("b_line", "No game-day B$ line is on file. The official line was not filled in from the pinned lock or from today’s model."));
  } else if (!indexed || Math.abs(indexed.b_line - raw) > 0.001) {
    review.push(reviewItem("b_line", "The game-day lookup did not match the history file."));
  }
  const prior = atsGrade(raw, row.close_home_spread, row);
  const market = marketFor(lineGame, row.kick);
  let open = market.open;
  let openBasis = open ? "line-history" : null;
  let openFallback = false;
  if (!open) {
    const fallback = lineLogFallback(row.week, row.espn_id, row.kick);
    if (fallback) {
      open = fallback;
      openBasis = "line-log";
      openFallback = true;
    } else {
      review.push(reviewItem("open", "No ESPN DraftKings opening line before kickoff. The earlier line-history open is not DraftKings, so it was not used."));
    }
  }
  const close = market.close;
  if (!close) {
    review.push(reviewItem("close", "No ESPN DraftKings closing line is on file. None was invented."));
  }
  const official = raw;
  const grade = atsGrade(official, close ? num(close.home_spread) : null, row);
  const clv = clvOf(open && open.home_spread, close && close.home_spread, official);
  const upset = upsetOf(
    close ? num(close.home_spread) : null,
    official,
    row.home,
    row.away,
    row.home_score,
    row.away_score
  );
  const changed = prior.ats !== grade.ats;
  return {
    season: 2026,
    week: row.week,
    game_id: row.game_id,
    espn_id: String(row.espn_id),
    away: row.away,
    home: row.home,
    kick: row.kick || null,
    in_official_record: true,
    raw_b_line: raw,
    official_b_line: official,
    official_rounded: false,
    b_line_source: gd ? gd.source : null,
    b_line_version: gd ? gd.version : null,
    published_at: gd ? gd.published_at : null,
    b_line_commit: gd ? gd.commit || null : null,
    sportsbook: SPORTSBOOK,
    open_home_spread: open ? num(open.home_spread) : null,
    open_source: open ? open.source : null,
    open_at: open ? open.at || null : null,
    open_basis: openBasis,
    open_fallback: openFallback,
    close_home_spread: close ? num(close.home_spread) : null,
    close_source: close ? close.source : null,
    close_at: close ? close.at || null : null,
    away_score: row.away_score,
    home_score: row.home_score,
    ats: grade.ats,
    ats_side: grade.ats_side,
    prior_ats: prior.ats,
    prior_close_home_spread: num(row.close_home_spread),
    result_changed: changed,
    clv,
    beat_close: beatClose(clv),
    pickem: upset.pickem,
    favorite: upset.favorite,
    underdog: upset.underdog,
    upset: upset.upset,
    b_upset_call: upset.b_upset_call,
    b_upset_correct: upset.b_upset_correct,
    review,
  };
}

function buildLocked(lock, lineGame) {
  const raw = num(lock.model_home_spread);
  const official = roundHalfAwayFromZero(raw);
  const review = [];
  if (raw == null) review.push(reviewItem("b_line", "The lock has no model_home_spread. The official line was not invented."));
  const market = marketFor(lineGame, lock.kick);
  return {
    season: 2026,
    week: Number(lock.week),
    game_id: lock.game_id,
    espn_id: lock.espn_id != null ? String(lock.espn_id) : null,
    away: lock.away,
    home: lock.home,
    kick: lock.kick || null,
    in_official_record: false,
    raw_b_line: raw,
    official_b_line: official,
    official_rounded: true,
    b_line_source: lock.__source + "#model_home_spread",
    published_at: lock.frozen_at || null,
    sportsbook: SPORTSBOOK,
    open_home_spread: market.open ? num(market.open.home_spread) : null,
    open_source: market.open ? market.open.source : null,
    open_at: market.open ? market.open.at || null : null,
    close_home_spread: market.close ? num(market.close.home_spread) : null,
    close_source: market.close ? market.close.source : null,
    close_at: market.close ? market.close.at || null : null,
    lock_street_home_spread: num(lock.close_at_lock != null ? lock.close_at_lock : lock.street_home_spread),
    away_score: null,
    home_score: null,
    ats: null,
    review,
  };
}

export function buildCanonical() {
  const finals = readJson("data/published/finals.json");
  const history = readJson("data/model/bs-line-history-2026.json");
  const lineHistory = readJson("data/lines/line-history-2026.json");
  const historyIndex = indexGameDay(history);
  const historyByEspn = new Map();
  for (const game of history.games || []) {
    if (game && game.espn_id != null) historyByEspn.set(String(game.espn_id), game);
  }
  const lines = lineHistoryByEspn(lineHistory);
  const games = [];
  for (const row of finals.board || []) {
    if (!row || row.lock_quality !== "official") continue;
    if (Number(row.week) !== 2 && Number(row.week) !== 3) continue;
    games.push(buildOfficial(
      row,
      historyIndex,
      historyByEspn.get(String(row.espn_id)),
      lines.get(String(row.espn_id))
    ));
  }
  games.sort((a, b) => a.week - b.week || String(a.kick).localeCompare(String(b.kick)) || a.game_id.localeCompare(b.game_id));

  const locked = [];
  const lockDir = path.join(ROOT, "data/postmortem/locks");
  for (const name of fs.readdirSync(lockDir).sort()) {
    if (!/^2026-w04-.+\.json$/.test(name) || name.includes("summary") || name.includes("freeze")) continue;
    const rel = "data/postmortem/locks/" + name;
    const lock = readJson(rel);
    if (!lock || !lock.away || !lock.home || lock.model_home_spread == null) continue;
    lock.__source = rel;
    locked.push(buildLocked(lock, lines.get(String(lock.espn_id))));
  }
  locked.sort((a, b) => String(a.kick).localeCompare(String(b.kick)) || a.game_id.localeCompare(b.game_id));

  const summary = summarize(games);
  const gradingChanges = games.filter((g) => g.result_changed).map((g) => ({
    game_id: g.game_id,
    week: g.week,
    prior_ats: g.prior_ats,
    ats: g.ats,
    prior_close: g.prior_close_home_spread,
    close: g.close_home_spread,
    why: "The DraftKings close used here differs from the close on the pinned finals row, and the ATS result changed.",
  }));
  const flagged = games.filter((g) => g.review.length).map((g) => ({
    game_id: g.game_id,
    week: g.week,
    review: g.review,
  }));
  const fallbacks = games.filter((g) => g.open_fallback).map((g) => ({
    game_id: g.game_id,
    week: g.week,
    open_home_spread: g.open_home_spread,
    open_source: g.open_source,
    why: "Line history had no DraftKings number before the close. The open is the earliest pre-kick line-log row whose note names ESPN DraftKings.",
  }));

  const doc = {
    schema: 1,
    season: 2026,
    sportsbook_of_record: SPORTSBOOK,
    sign_convention: "Home-centric spreads. Negative means the home team is favored.",
    rules: {
      official_games: "Weeks 2 and 3 only. Week 1 is excluded from every official stat.",
      b_line_weeks_2_3: "The official B$ line is the latest game-day site compute version in bs-line-history. It is not rounded and it is not recomputed.",
      b_line_week_4_on: "The official line is the locked raw projection rounded to the nearest 0.5. Exact .25 and .75 round away from zero. The raw number is kept. The lock file is not edited.",
      open: "Earliest ESPN DraftKings snapshot in line history before kickoff, excluding the closing snapshot. If that snapshot is missing, the earliest pre-kick line-log row that names DraftKings. Otherwise the open is blank and the game is flagged.",
      close: "Latest line-history snapshot tagged close whose source is ESPN DraftKings. A missing close is flagged and left blank.",
      ats: "The side the official B$ line liked against the DraftKings close. Same rule as the game-day grade.",
      clv: "Points gained by betting the side the official B$ line liked, at the DraftKings open, against the DraftKings close. Positive means that open beat the close.",
      upset: "The DraftKings closing underdog won outright. A closing pick’em is not an upset. A B$ upset call means the official line had that underdog winning outright, not merely covering.",
    },
    summary,
    grading_changes: gradingChanges,
    flagged,
    open_fallbacks: fallbacks,
    games,
    week4_locked: locked,
  };
  doc.validation = validateDocument(doc);
  return doc;
}

export function validateDocument(doc) {
  const errors = [];
  const games = (doc && doc.games) || [];
  const locked = (doc && doc.week4_locked) || [];
  const official = games.filter((g) => g && g.in_official_record);
  if (games.some((g) => Number(g.week) === 1) || locked.some((g) => Number(g.week) === 1)) {
    errors.push("A Week 1 game is in the record.");
  }
  if (official.length !== 32) errors.push("Official games are " + official.length + ", not 32.");
  const weeks = new Set(official.map((g) => Number(g.week)));
  if ([...weeks].some((w) => w !== 2 && w !== 3)) errors.push("An official game is outside Weeks 2 and 3.");
  const ids = new Set(official.map((g) => g.season + "|" + g.week + "|" + g.game_id));
  if (ids.size !== official.length) errors.push("An official game is duplicated.");
  const tally = { W: 0, L: 0, P: 0, other: 0 };
  for (const game of official) {
    if (tally[game.ats] != null) tally[game.ats] += 1;
    else tally.other += 1;
    if (game.raw_b_line == null || game.official_b_line == null) {
      errors.push(game.game_id + " is missing an official B$ line.");
    } else if (Math.abs(game.raw_b_line - game.official_b_line) > 0.001) {
      errors.push(game.game_id + " Week " + game.week + " official line was changed from the raw game-day line.");
    }
    if (game.official_rounded) errors.push(game.game_id + " is marked rounded inside Weeks 2–3.");
    if (!game.sportsbook) errors.push(game.game_id + " has no sportsbook.");
    if (game.open_home_spread == null) {
      if (!game.review || !game.review.some((r) => r.field === "open")) {
        errors.push(game.game_id + " is missing an open and is not flagged.");
      }
    } else if (!game.open_source) {
      errors.push(game.game_id + " open has no source.");
    }
    if (game.close_home_spread == null) {
      if (!game.review || !game.review.some((r) => r.field === "close")) {
        errors.push(game.game_id + " is missing a close and is not flagged.");
      }
    } else if (!game.close_source) {
      errors.push(game.game_id + " close has no source.");
    }
    if (!game.b_line_source) errors.push(game.game_id + " B$ line has no source.");
    const again = upsetOf(game.close_home_spread, game.official_b_line, game.home, game.away, game.home_score, game.away_score);
    if (game.close_home_spread != null && game.upset !== again.upset) {
      errors.push(game.game_id + " upset flag does not match the closing line.");
    }
    if (game.close_home_spread != null && game.b_upset_call !== again.b_upset_call) {
      errors.push(game.game_id + " B$ upset call does not match the official line.");
    }
    const grade = atsGrade(game.official_b_line, game.close_home_spread, game);
    if (game.close_home_spread != null && grade.ats !== game.ats) {
      errors.push(game.game_id + " ATS does not match the official line and the close.");
    }
    const clv = clvOf(game.open_home_spread, game.close_home_spread, game.official_b_line);
    if (game.open_home_spread != null && game.close_home_spread != null && clv !== game.clv) {
      errors.push(game.game_id + " CLV does not match the open, the official line, and the close.");
    }
  }
  if (tally.other) errors.push(tally.other + " official games are not W, L, or P.");
  if (tally.W + tally.L + tally.P !== 32) {
    errors.push("ATS " + tally.W + "-" + tally.L + "-" + tally.P + " does not add to 32.");
  }
  for (const game of locked) {
    if (Number(game.week) < 4) errors.push(game.game_id + " is in the Week 4 list.");
    if (!onHalfStep(game.official_b_line)) {
      errors.push(game.game_id + " official line is not on a 0.5 step.");
    }
    const expect = roundHalfAwayFromZero(game.raw_b_line);
    if (game.raw_b_line != null && expect !== game.official_b_line) {
      errors.push(game.game_id + " official line is not the rounded raw lock.");
    }
    if (!game.b_line_source) errors.push(game.game_id + " lock line has no source.");
  }
  const fresh = summarize(official);
  const stored = doc.summary;
  if (!stored || stored.games !== 32 || !stored.ats || stored.ats.text !== fresh.ats.text) {
    errors.push("Stored summary does not match the 32 games.");
  }
  return { ok: errors.length === 0, errors, rows: { history: official.length, overall: official.length } };
}

export function roundingSelfTest() {
  const cases = [
    [2.7, 2.5],
    [2.8, 3],
    [3.2, 3],
    [3.3, 3.5],
    [2.75, 3],
    [-2.75, -3],
    [5.63, 5.5],
    [-5.63, -5.5],
    [0, 0],
    [-0.25, -0.5],
    [0.25, 0.5],
  ];
  const errors = [];
  for (const [raw, want] of cases) {
    const got = roundHalfAwayFromZero(raw);
    if (got !== want) errors.push(raw + " rounded to " + got + ", expected " + want);
  }
  return errors;
}

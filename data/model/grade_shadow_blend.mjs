#!/usr/bin/env node
/**
 * Grade the DVOA blend SHADOW line against the official B$ line and the close, Week 5 on.
 *
 *   node data/model/grade_shadow_blend.mjs              (writes data/model/shadow-dvoa-blend-grades-2026.json)
 *   node data/model/grade_shadow_blend.mjs --self-test
 *
 * Read-only on every input. Writes only the grades file. The shadow is never in the B$ line,
 * the record, Bet History, Overall Record or ATS.
 *
 * Per finished game (FINAL with a score, Week >= 5):
 *   shadow    the locked game-day shadow: shadow_dvoa_blend on the last bs-line-history version
 *             published before kick (rounded = nearest 0.5, .25/.75 away from zero; raw kept).
 *   official  the official B$ line: lock model_home_spread rounded the same way (data/record/lib.mjs
 *             rule from Week 4). No lock -> last pre-kick snapshot b_line, rounded, flagged.
 *   close     line-history "close" tag, else data/closes/2026-wNN.json close_spread, else the lock's
 *             close_at_lock / street_home_spread, else the last pre-kick street snapshot (each flagged).
 * Metrics: average absolute error vs the final margin (line = -expected home margin), ATS vs the
 * close (same rule as the game-day grade), record by gap to the close (<3, 3-8, 8+), and head-to-head
 * on games where shadow and official take different sides.
 */
import fs from "fs";
import path from "path";
import { atsGrade } from "./game_day_grade.mjs";
import { roundHalfAwayFromZero as roundHalfAway } from "../record/round_half.mjs";

export { roundHalfAway };

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const OUT_REL = "data/model/shadow-dvoa-blend-grades-2026.json";
const FROM_WEEK = 5;
const DECISION_WEEK = 8;

export function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function r2(n) {
  return n == null || !Number.isFinite(n) ? null : Math.round(n * 100) / 100;
}

function normAbbr(a) {
  a = String(a || "").toUpperCase();
  if (a === "WAS" || a === "WFT") return "WSH";
  if (a === "LA") return "LAR";
  return a;
}

function readJson(rel, fallback = null) {
  const fp = path.join(ROOT, rel);
  if (!fs.existsSync(fp)) return fallback;
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

function kickMs(g) {
  const s = String(g.date || g.kick || "");
  const t = Date.parse(s.replace(/Z?$/, "Z").replace(/([+-]\d{2}:\d{2})Z$/, "$1"));
  return Number.isFinite(t) ? t : Date.parse(s);
}

function bucketOf(gap) {
  if (gap == null) return null;
  if (gap >= 8) return "8+";
  if (gap >= 3) return "3-8";
  return "<3";
}

function emptyRec() {
  return { W: 0, L: 0, P: 0 };
}

function recStr(r) {
  return r.W + "-" + r.L + "-" + r.P;
}

function pct(r) {
  const d = r.W + r.L;
  return d ? Math.round((1000 * r.W) / d) / 10 : null;
}

/** Locked shadow + last pre-kick snapshot b_line for one history game. */
export function lockedShadow(historyGame, kick) {
  let last = null;
  let lastAny = null;
  for (const v of (historyGame && historyGame.versions) || []) {
    const at = Date.parse(v.published_at);
    if (Number.isFinite(kick) && !(at < kick)) continue;
    if (!lastAny || at >= Date.parse(lastAny.published_at)) lastAny = v;
    if (!v.shadow_dvoa_blend || num(v.shadow_dvoa_blend.raw) == null) continue;
    if (!last || at > Date.parse(last.published_at) || (at === Date.parse(last.published_at) && v.version > last.version)) last = v;
  }
  return { shadowVersion: last, lastVersion: lastAny };
}

/** Pure grading core. inputs: { games, history, locks, closes, lineHistory } (already loaded). */
export function grade(inputs) {
  const histByEspn = new Map();
  for (const g of (inputs.history && inputs.history.games) || []) histByEspn.set(String(g.espn_id), g);
  const lhByEspn = new Map();
  for (const g of (inputs.lineHistory && inputs.lineHistory.games) || []) lhByEspn.set(String(g.espn_id), g);
  const rows = [];
  const missing = [];
  for (const g of inputs.games || []) {
    const week = Number(g.week);
    if (!(week >= FROM_WEEK)) continue;
    const status = String(g.status || "").toUpperCase();
    const hs = num(g.home_score);
    const as = num(g.away_score);
    if (!status.startsWith("FINAL") || hs == null || as == null) continue;
    const id = String(g.id);
    const gameId = normAbbr(g.away) + "@" + normAbbr(g.home);
    const kick = kickMs(g);
    const { shadowVersion, lastVersion } = lockedShadow(histByEspn.get(id), kick);
    const lock = inputs.locks.get(id) || null;
    let official = null;
    let officialRaw = null;
    let officialSource = null;
    if (lock && num(lock.model_home_spread) != null) {
      officialRaw = num(lock.model_home_spread);
      official = roundHalfAway(officialRaw);
      officialSource = lock.__source + "#model_home_spread";
    } else if (lastVersion && num(lastVersion.b_line) != null) {
      officialRaw = num(lastVersion.b_line);
      official = roundHalfAway(officialRaw);
      officialSource = "bs-line-history v" + lastVersion.version + " (no lock file; flagged)";
    }
    let close = null;
    let closeSource = null;
    const lh = lhByEspn.get(id);
    const snaps = (lh && lh.snapshots) || [];
    const closeSnaps = snaps.filter((s) => s.tag === "close" && num(s.home_spread) != null);
    const closeRow = (inputs.closes.get(week) || []).find((r) => String(r.espn_id) === id);
    if (closeSnaps.length) {
      close = num(closeSnaps[closeSnaps.length - 1].home_spread);
      closeSource = "line-history close (" + closeSnaps[closeSnaps.length - 1].source + ")";
    } else if (closeRow && num(closeRow.close_spread ?? closeRow.close_home_spread) != null) {
      close = num(closeRow.close_spread ?? closeRow.close_home_spread);
      closeSource = "data/closes/2026-w" + String(week).padStart(2, "0") + ".json";
    } else if (lock && num(lock.close_at_lock ?? lock.street_home_spread) != null) {
      close = num(lock.close_at_lock ?? lock.street_home_spread);
      closeSource = "lock street at freeze (no close logged; flagged)";
    } else {
      const pre = snaps.filter((s) => num(s.home_spread) != null && Date.parse(s.at) < kick).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
      if (pre.length) {
        close = num(pre[pre.length - 1].home_spread);
        closeSource = "last pre-kick street snapshot (no close logged; flagged)";
      }
    }
    const shadow = shadowVersion ? num(shadowVersion.shadow_dvoa_blend.rounded) : null;
    if (shadow == null || official == null || close == null) {
      missing.push({ game_id: gameId, week, espn_id: id, shadow: shadow != null, official: official != null, close: close != null });
      continue;
    }
    const margin = hs - as;
    const row = { home: g.home, away: g.away, home_score: hs, away_score: as };
    const so = atsGrade(shadow, close, row);
    const oo = atsGrade(official, close, row);
    rows.push({
      week,
      game_id: gameId,
      espn_id: id,
      kick: new Date(kick).toISOString(),
      final_home_margin: margin,
      close,
      close_source: closeSource,
      official_b_line: official,
      official_raw: officialRaw,
      official_source: officialSource,
      shadow_line: shadow,
      shadow_raw: num(shadowVersion.shadow_dvoa_blend.raw),
      shadow_version: shadowVersion.version,
      shadow_published_at: shadowVersion.published_at,
      shadow_snapshot_b_line: num(shadowVersion.b_line),
      err_shadow: r2(Math.abs(-shadow - margin)),
      err_official: r2(Math.abs(-official - margin)),
      err_close: r2(Math.abs(-close - margin)),
      gap_shadow: r2(Math.abs(shadow - close)),
      gap_official: r2(Math.abs(official - close)),
      ats_shadow: so.ats,
      ats_shadow_side: so.ats_side,
      ats_official: oo.ats,
      ats_official_side: oo.ats_side,
    });
  }
  rows.sort((a, b) => a.week - b.week || a.kick.localeCompare(b.kick) || a.game_id.localeCompare(b.game_id));
  return { rows, missing };
}

export function summarize(rows) {
  const out = { n: rows.length };
  if (!rows.length) return { ...out, mae_shadow: null, mae_official: null, mae_close: null };
  const mean = (k) => r2(rows.reduce((s, r) => s + r[k], 0) / rows.length);
  out.mae_shadow = mean("err_shadow");
  out.mae_official = mean("err_official");
  out.mae_close = mean("err_close");
  out.shadow_minus_official = r2(out.mae_shadow - out.mae_official);
  out.shadow_minus_close = r2(out.mae_shadow - out.mae_close);
  for (const who of ["shadow", "official"]) {
    const ats = emptyRec();
    const byGap = { "<3": emptyRec(), "3-8": emptyRec(), "8+": emptyRec() };
    for (const r of rows) {
      const a = r["ats_" + who];
      if (!(a in ats)) continue;
      ats[a] += 1;
      byGap[bucketOf(r["gap_" + who])][a] += 1;
    }
    out["ats_" + who] = { record: recStr(ats), pct: pct(ats) };
    out["by_gap_" + who] = Object.fromEntries(Object.entries(byGap).map(([k, v]) => [k, { record: recStr(v), n: v.W + v.L + v.P, pct: pct(v) }]));
  }
  const split = rows.filter((r) => r.ats_shadow_side && r.ats_official_side && r.ats_shadow_side !== r.ats_official_side);
  const h2h = emptyRec();
  for (const r of split) if (r.ats_shadow in h2h) h2h[r.ats_shadow] += 1;
  out.sides_differ = { n: split.length, shadow_record: recStr(h2h), games: split.map((r) => "W" + r.week + " " + r.game_id) };
  const closer = rows.filter((r) => r.err_shadow < r.err_official - 1e-9).length;
  const farther = rows.filter((r) => r.err_shadow > r.err_official + 1e-9).length;
  out.shadow_closer_to_result = { closer, farther, same: rows.length - closer - farther };
  return out;
}

function loadLocks() {
  const dir = path.join(ROOT, "data/postmortem/locks");
  const map = new Map();
  if (!fs.existsSync(dir)) return map;
  for (const name of fs.readdirSync(dir)) {
    if (!/^2026-w\d{2}-.*\.json$/.test(name) || name.includes("note") || name.includes("summary")) continue;
    try {
      const row = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
      if (row && row.espn_id != null && Number(row.week) >= FROM_WEEK) {
        row.__source = "data/postmortem/locks/" + name;
        map.set(String(row.espn_id), row);
      }
    } catch { /* not a lock row */ }
  }
  return map;
}

function loadCloses() {
  const map = new Map();
  for (let w = FROM_WEEK; w <= 18; w++) {
    const doc = readJson("data/closes/2026-w" + String(w).padStart(2, "0") + ".json");
    if (doc && Array.isArray(doc.games)) map.set(w, doc.games);
  }
  return map;
}

export function buildDoc(inputs, now = new Date()) {
  const { rows, missing } = grade(inputs);
  const weeks = [...new Set(rows.map((r) => r.week))].sort((a, b) => a - b);
  const byWeek = weeks.map((w) => ({ week: w, ...summarize(rows.filter((r) => r.week === w)) }));
  const throughWeek = weeks.length ? weeks[weeks.length - 1] : null;
  const cumulative = summarize(rows);
  const decisionReady = weeks.filter((w) => w >= FROM_WEEK && w <= DECISION_WEEK).length >= 4;
  return {
    schema: 1,
    season: 2026,
    generated_at: now.toISOString(),
    what: "DVOA blend shadow line (50/50 B$ + DVOA on the 2026-performance part, from Week 5) vs the official B$ line and the close. Shadow only: not in the B$ line, the record, Bet History, Overall Record, ATS or the B$ Daily.",
    method: {
      shadow: "shadow_dvoa_blend.rounded on the last data/model/bs-line-history-2026.json version published before kick (app.js dvoaBlendShadowHomeSpread, weight DVOA_BLEND_SHADOW_WEIGHT).",
      official: "Lock model_home_spread rounded to the nearest 0.5 (.25/.75 away from zero), same as data/record/lib.mjs from Week 4. No lock: last pre-kick snapshot b_line, flagged in official_source.",
      close: "line-history close tag, else data/closes file, else lock street at freeze, else last pre-kick street snapshot (see close_source).",
      error: "Absolute error vs the final home margin; a home spread L implies an expected home margin of -L.",
      ats: "data/model/game_day_grade.mjs atsGrade vs the close. Gap buckets use |line - close|: <3, 3-8, 8+.",
    },
    tracking_window: { from_week: FROM_WEEK, decision_after_week: DECISION_WEEK, weeks_graded: weeks, decision_ready: decisionReady },
    through_week: throughWeek,
    cumulative,
    by_week: byWeek,
    sandmoney_pr5_backtest: {
      pr: "https://github.com/brett761/sandmoney-lines/pull/5",
      note: "2021-25 replica (results rating only; no PFF/Madden/injury history). Close = nflverse.",
      w5_18_mae: { b_line_replica: 10.32, blend_50_50: 10.16, narrowing_control: 10.27, market_close: 9.73 },
      w5_18_blend_vs_b: { delta: -0.16, ci95: [-0.27, -0.06] },
      w5_8_blend_vs_b: { delta: -0.34, ci95: [-0.59, -0.10] },
      w9_18_blend_vs_b: { delta: -0.09, ci95: [-0.20, 0.03] },
      blend_vs_narrowing_control: { delta: -0.11, ci95: [-0.21, -0.02], seasons_won: "4/5" },
      out_of_sample_2024_25_w5_18_vs_b: { delta: -0.06, ci95: [-0.23, 0.12], by_season: { 2024: -0.12, 2025: 0.01 } },
      ats_w5_18: { b_line_replica: "508-507", blend_50_50: "517-498" },
      caveat: "Frozen DVOA coefficients were fit on 2021-23; 2024-25 is the only out-of-sample stretch.",
    },
    games: rows,
    not_graded: missing,
  };
}

function selfTest() {
  const kick = "2026-10-11T17:00Z";
  const games = [
    { id: "1", week: 5, away: "TB", home: "DAL", date: kick, status: "FINAL", home_score: 27, away_score: 20 },
    { id: "2", week: 5, away: "CHI", home: "GB", date: kick, status: "FINAL", home_score: 17, away_score: 24 },
    { id: "3", week: 5, away: "NYG", home: "WSH", date: kick, status: "SCHEDULED" },
    { id: "9", week: 4, away: "PIT", home: "CLE", date: "2026-10-02T00:15Z", status: "FINAL", home_score: 27, away_score: 24 },
  ];
  const sh = (raw) => ({ raw, rounded: roundHalfAway(raw), weight: 0.5, in_b_line: false });
  const history = { games: [
    { espn_id: "1", game_id: "TB@DAL", week: 5, versions: [
      { version: 1, published_at: "2026-10-06T14:00:00Z", b_line: -10.11, shadow_dvoa_blend: sh(-7.73) },
      { version: 2, published_at: "2026-10-11T16:30:00Z", b_line: -10.11, shadow_dvoa_blend: sh(-6.6) },
      { version: 3, published_at: "2026-10-11T18:00:00Z", b_line: -10.11, shadow_dvoa_blend: sh(-1) }, // after kick: ignored
    ] },
    { espn_id: "2", game_id: "CHI@GB", week: 5, versions: [
      { version: 1, published_at: "2026-10-06T14:00:00Z", b_line: 11.04, shadow_dvoa_blend: sh(6.27) },
    ] },
  ] };
  const locks = new Map([["1", { espn_id: "1", week: 5, model_home_spread: -10.25, __source: "lock-1" }]]);
  const closes = new Map([[5, [{ espn_id: "2", close_spread: 3 }]]]);
  const lineHistory = { games: [{ espn_id: "1", snapshots: [{ tag: "close", home_spread: -9.5, at: "2026-10-11T16:59:00Z", source: "dk" }] }] };
  const doc = buildDoc({ games, history, locks, closes, lineHistory }, new Date("2026-10-13T12:00:00Z"));
  const fail = (m) => { throw new Error("self-test: " + m); };
  if (doc.games.length !== 2) fail("expected 2 graded games, got " + doc.games.length);
  const dal = doc.games.find((r) => r.game_id === "TB@DAL");
  if (dal.shadow_line !== -6.5 || dal.shadow_version !== 2) fail("locked shadow must be the last pre-kick version (-6.6 -> -6.5, v2)");
  if (dal.official_b_line !== -10.5) fail("official -10.25 rounds away from zero to -10.5");
  if (dal.close !== -9.5 || dal.err_shadow !== 0.5 || dal.err_official !== 3.5) fail("errors wrong");
  if (dal.ats_shadow !== "W" || dal.ats_official !== "L") fail("ATS wrong: DAL won by 7 vs close -9.5, so TB covered (shadow -6.5 took TB)");
  const gb = doc.games.find((r) => r.game_id === "CHI@GB");
  if (gb.official_source.indexOf("no lock") < 0 || gb.official_b_line !== 11) fail("no-lock fallback should use the snapshot b_line, flagged");
  if (gb.close !== 3 || !gb.close_source.includes("closes")) fail("closes-file fallback");
  if (gb.gap_official !== 8 || doc.cumulative.by_gap_official["8+"].n !== 1) fail("8+ gap bucket");
  if (doc.cumulative.sides_differ.n !== 1) fail("sides differ on TB@DAL only");
  if (doc.tracking_window.decision_ready) fail("one week is not decision-ready");
  console.log("self-test ok: locked shadow = last pre-kick version, official rounding, close fallbacks, ATS, gap buckets");
}

function main() {
  if (process.argv.includes("--self-test")) return selfTest();
  const nfl = readJson("data/nfl-2026.json", { games: [] });
  const finals = readJson("data/published/finals.json", { board: [] });
  // Scores from the live board; finals.json fills a FINAL row the board lacks.
  const byId = new Map((nfl.games || []).map((g) => [String(g.id), { ...g }]));
  for (const r of finals.board || []) {
    const g = byId.get(String(r.espn_id));
    if (g && String(r.status || "").toUpperCase() === "FINAL" && (num(g.home_score) == null || num(g.away_score) == null)) {
      g.home_score = r.home_score; g.away_score = r.away_score; g.status = "FINAL";
    }
  }
  const doc = buildDoc({
    games: [...byId.values()],
    history: readJson("data/model/bs-line-history-2026.json", { games: [] }),
    locks: loadLocks(),
    closes: loadCloses(),
    lineHistory: readJson("data/lines/line-history-2026.json", { games: [] }),
  });
  fs.writeFileSync(path.join(ROOT, OUT_REL), JSON.stringify(doc, null, 2) + "\n");
  const c = doc.cumulative;
  console.log("graded " + c.n + " games through week " + doc.through_week + (doc.not_graded.length ? " (" + doc.not_graded.length + " finished games missing an input)" : ""));
  if (c.n) console.log("MAE shadow " + c.mae_shadow + " | official " + c.mae_official + " | close " + c.mae_close + " · ATS shadow " + c.ats_shadow.record + " | official " + c.ats_official.record);
  console.log("wrote " + OUT_REL);
}

if (process.argv[1] && process.argv[1].endsWith("grade_shadow_blend.mjs")) main();

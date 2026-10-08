#!/usr/bin/env node
/**
 * Freeze Week 3 2026 MNF pre-kick model lock for PHI@CHI only.
 * LIVE desk compute: injury-2026.json 2026-09-28a WORKING-MON + pffYtd + N=3 taper n=2.
 * algorithmBase = wPrior*prior + wCurr*currentRating (matches app.js).
 * FA & PFF-preseason OFF (site parity). Retains Fri FIRE CHI +4.5 3u — no new tickets / no chase.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { officialHomeSpread } from "./record/round_half.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = __dirname;
const HFA = 2;
const LOCK_DIR = path.join(DATA, "postmortem/locks");

function load(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8"));
}

const nflData = load("nfl-2026.json");
const priorData = load("prior-2025.json");
const faData = load("fa-2026.json");
const draftData = load("draft-2026.json");
const maddenData = load("madden-2026.json");
const pffData = load("pff-2026.json");
const pffYtdData = load("pff-2026-ytd.json");
const sosData = load("sos-2025.json");
const returnData = load("return-2026.json");
const injuryScale = load("injury-scale.json");
// Frozen-week pricing: these locks were priced with DOUBTFUL 0.75. The live scale moved to 1.0 on 2026-10-06 (from Week 5).
// Pin it so a re-run cannot re-price a locked week.
injuryScale.status = { ...injuryScale.status, DOUBTFUL: 0.75 };
const injurySeed = load("injury-2026.json");
const coachData = load("coaches-2026.json");
const prepData = load("coach-prep-2026.json");
const atsData = load("coach-ats-2026.json");
const pffMatchData = load("pff-matchups-2026.json");
const ticketsData = load("tickets-2026.json");
const ratings = load("ratings-2026-w01.json"); // for prior/current algo sanity; we recompute layers live
const ytdStData = load("ytd-st-2026.json");
const ytdRankData = load("ytd-rankings-2026.json"); // site-parity: YTD takeaways/giveaways
const allProData = load("allpro-last3.json");
const streetBoard = JSON.parse(fs.readFileSync("/tmp/espn-w3-mnf.json", "utf8"));
const priorLock = JSON.parse(fs.readFileSync(path.join(LOCK_DIR, "2026-w03-phi-chi.json"), "utf8"));

function num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normAbbr(a) {
  a = String(a || "").toUpperCase();
  if (a === "WAS" || a === "WFT") return "WSH";
  if (a === "LA") return "LAR";
  return a;
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function gameScores(g) {
  const home = num(g.home_score ?? g.homeScore);
  const away = num(g.away_score ?? g.awayScore);
  if (home === null || away === null) return null;
  return { home, away };
}
function scoredGames2026(abbr) {
  const a = normAbbr(abbr);
  const out = [];
  for (const g of nflData.games || []) {
    const w = Number(g.week);
    if (!Number.isFinite(w) || w < 1 || w > 18) continue;
    if (g.home !== a && g.away !== a) continue;
    if (!gameScores(g)) continue;
    out.push(g);
  }
  return out;
}
function taperFor(abbr) {
  const N = num(priorData?.taper?.N) || 3;
  const n = Math.min(scoredGames2026(abbr).length, N);
  return { N, n, wPrior: (N - n) / N, wCurr: n / N };
}
function priorValue(abbr) {
  const t = priorData.teams?.[normAbbr(abbr)];
  return t ? num(t.prior) || 0 : 0;
}

function leagueRawPpgRange(kind) {
  let lo = Infinity, hi = -Infinity;
  const key = kind === "def" ? "def_ppg" : "off_ppg";
  for (const t of Object.values(priorData.teams || {})) {
    const v = t && t.raw ? num(t.raw[key]) : null;
    if (v === null) continue;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) {
    return kind === "def" ? { lo: 17.2, hi: 30.1 } : { lo: 14.2, hi: 30.5 };
  }
  return { lo, hi };
}
function mapPpgToPillar(ppg, kind) {
  const x = num(ppg);
  if (x === null) return 0;
  const { lo, hi } = leagueRawPpgRange(kind);
  const span = hi - lo || 1;
  const t = Math.max(0, Math.min(1, (x - lo) / span));
  const pillar = kind === "def" ? (12 - t * 24) : (-12 + t * 24);
  return Math.max(-12, Math.min(12, pillar));
}
// SITE-PARITY FIX 2026-09-27: mirror app.js exactly (leagueStScale from prior raw, not fixed anchors)
function leagueStScale() {
  let meanFg = 0, nFg = 0; const comps = [];
  for (const t of Object.values(priorData.teams || {})) { const fg = t && t.raw ? num(t.raw.st_fg_pct) : null; if (fg !== null) { meanFg += fg; nFg += 1; } }
  meanFg = nFg ? meanFg / nFg : 85.53125;
  for (const t of Object.values(priorData.teams || {})) { const ret = (t && t.raw ? num(t.raw.st_ret_td) : null) ?? 0; const fg = t && t.raw ? num(t.raw.st_fg_pct) : null; if (fg === null) continue; comps.push(2 * ret + (fg - meanFg) / 8); }
  let lo = Infinity, hi = -Infinity; for (const c of comps) { if (c < lo) lo = c; if (c > hi) hi = c; }
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) return { meanFg: 85.53125, lo: -1.76640625, hi: 7.38359375 };
  return { meanFg, lo, hi };
}
function mapStToPillar(retTd, fgPct, fga) {
  const { meanFg, lo, hi } = leagueStScale();
  const ret = num(retTd) ?? 0; const attempts = num(fga) ?? 0; let fg = num(fgPct);
  if (attempts <= 0 || fg === null) fg = meanFg;
  const comp = 2 * ret + (fg - meanFg) / 8; const span = hi - lo || 1;
  const t = Math.max(0, Math.min(1, (comp - lo) / span));
  return Math.max(-4, Math.min(4, -4 + t * 8));
}
function currentStPillar(abbr) {
  const row = ytdStData?.teams?.[normAbbr(abbr)];
  if (!row) return 0;
  return mapStToPillar(row.st_ret_td, row.st_fg_pct, row.st_fga);
}
// SITE-PARITY FIX 2026-09-27 (PR #8): 2026 YTD takeaways/giveaways are IN currentRating, same as app.js.
function leagueTurnoverScale() {
  let takeLo = Infinity, takeHi = -Infinity, giveLo = Infinity, giveHi = -Infinity;
  const games = num(priorData.games_in_prior) || 17;
  for (const t of Object.values(priorData.teams || {})) {
    const take = t && t.raw ? num(t.raw.takeaways) : null; const give = t && t.raw ? num(t.raw.giveaways) : null;
    if (take !== null) { if (take < takeLo) takeLo = take; if (take > takeHi) takeHi = take; }
    if (give !== null) { if (give < giveLo) giveLo = give; if (give > giveHi) giveHi = give; }
  }
  if (!Number.isFinite(takeLo) || !Number.isFinite(takeHi) || takeHi <= takeLo) { takeLo = 4; takeHi = 33; }
  if (!Number.isFinite(giveLo) || !Number.isFinite(giveHi) || giveHi <= giveLo) { giveLo = 11; giveHi = 30; }
  return { games, takeLo, takeHi, giveLo, giveHi };
}
function mapTurnoverToPillar(total, nGames, kind) {
  const n = num(nGames); const x = num(total);
  if (n === null || n <= 0 || x === null) return 0;
  const pg = x / n; const s = leagueTurnoverScale(); const pgames = s.games || 17;
  const lo = (kind === "give" ? s.giveLo : s.takeLo) / pgames; const hi = (kind === "give" ? s.giveHi : s.takeHi) / pgames;
  const span = hi - lo || 1; const t = Math.max(0, Math.min(1, (pg - lo) / span));
  const pillar = kind === "give" ? (5 - t * 10) : (-5 + t * 10);
  return Math.max(-5, Math.min(5, pillar));
}
function currentTurnovers(abbr) {
  const row = (ytdRankData.teams || []).find((r) => r && normAbbr(r.abbr) === normAbbr(abbr));
  const raw = row && row.raw ? row.raw : null;
  if (!raw || num(raw.takeaways) === null || num(raw.giveaways) === null) return null;
  const n = num(row.n);
  return { takeaways: num(raw.takeaways), giveaways: num(raw.giveaways), n: n === null ? 0 : n };
}
function currentPillars(abbr) {
  const rows = scoredGames2026(abbr).map((g) => {
    const a = normAbbr(abbr);
    const home = num(g.home_score ?? g.homeScore); const away = num(g.away_score ?? g.awayScore);
    const isHome = g.home === a;
    return { ptsFor: isHome ? home : away, ptsAgainst: isHome ? away : home };
  });
  let off = 0, def = 0;
  if (rows.length) {
    off = mapPpgToPillar(rows.reduce((s, r) => s + r.ptsFor, 0) / rows.length, "off");
    def = mapPpgToPillar(rows.reduce((s, r) => s + r.ptsAgainst, 0) / rows.length, "def");
  }
  const to = currentTurnovers(abbr); const nTo = to && to.n ? to.n : rows.length;
  const take = to ? mapTurnoverToPillar(to.takeaways, nTo, "take") : 0;
  const give = to ? mapTurnoverToPillar(to.giveaways, nTo, "give") : 0;
  return { off, def, st: currentStPillar(abbr), take, give, n: rows.length };
}
function currentRating(abbr) {
  const { off, def, st, take, give, n } = currentPillars(abbr);
  if (!n && !(ytdStData && ytdStData.teams && ytdStData.teams[normAbbr(abbr)])) return 0;
  const w = priorData?.weights || {};
  const wOff = num(w.off) ?? 0.3875, wDef = num(w.def) ?? 0.3875, wSt = num(w.st) ?? 0.025, wTake = num(w.take) ?? 0.075, wGive = num(w.give) ?? 0.125;
  const denom = (wOff + wDef + wSt + wTake + wGive) || 1;
  let cur = (wOff * off + wDef * def + wSt * st + wTake * take + wGive * give) / denom;
  if (Math.abs(cur) > 12) cur = Math.sign(cur) * 12;
  return cur;
}
function algorithmBase(abbr) {
  const tf = taperFor(abbr);
  return tf.wPrior * priorValue(abbr) + tf.wCurr * currentRating(abbr);
}

function teamNet(data, abbr) {
  const t = data?.teams?.[normAbbr(abbr)];
  if (!t) return 0;
  return num(t.net) || 0;
}

function faRaw(abbr) {
  const t = faData.teams[normAbbr(abbr)];
  if (!t) return 0;
  const n = num(t.net);
  if (n !== null) return n;
  const cap = num(faData.scoring?.cap_team_net) ?? 4;
  let sum = 0;
  for (const row of t.in || []) sum += num(row.pts) || 0;
  for (const row of t.out || []) sum += num(row.pts) || 0;
  return Math.max(-cap, Math.min(cap, sum));
}

// SITE-PARITY FIX 2026-09-27 (PR #7 / #9): site B$ line has INCLUDE_FA=false and INCLUDE_PFF_PRESEASON=false.
// FA and PFF 2026 preseason are display-only; they add 0 to eff. (pff_term = 2025 PFF-22 stays IN, as on the site.)
const INCLUDE_FA = false;
const INCLUDE_PFF_PRESEASON = false;
function faTerm(abbr) {
  if (!INCLUDE_FA) return 0;
  return faRaw(abbr) * taperFor(abbr).wPrior;
}

function draftRaw(abbr) {
  const t = draftData.teams[normAbbr(abbr)];
  if (!t) return 0;
  const n = num(t.net);
  if (n !== null) return n;
  const cap = num(draftData.scoring?.cap_team_net) ?? 4;
  let sum = 0;
  for (const row of t.starters || []) sum += num(row.pts) || 0;
  return Math.max(-cap, Math.min(cap, sum));
}

function draftFade(abbr) {
  const window = num(draftData.window_games) || 4;
  return Math.max(0, (window - taperFor(abbr).n) / window);
}

function draftTerm(abbr) {
  return draftRaw(abbr) * draftFade(abbr);
}

function returnRaw(abbr) {
  const t = returnData.teams[normAbbr(abbr)];
  if (!t) return 0;
  const n = num(t.net);
  if (n !== null) return n;
  const cap = num(returnData.scoring?.cap_team_net) ?? 2.5;
  let sum = 0;
  for (const row of t.players || []) sum += num(row.pts) || 0;
  return Math.max(-cap, Math.min(cap, sum));
}

function returnTerm(abbr) {
  return returnRaw(abbr) * taperFor(abbr).wPrior;
}

// --- injury Madden-first (imp3) ---
function injuryCapPlayer() { return num(injuryScale.cap_player) ?? 4.5; }
function injuryCapTeam() { return num(injuryScale.cap_team) ?? 6; }
function injuryPosBase(pos) { return num(injuryScale.positions?.[pos]) || 0; }
function _normAp(name) {
  let s = String(name || "").toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const parts = s.split(" ").filter(Boolean);
  while (parts.length && /^(jr|sr|ii|iii|iv)$/.test(parts[parts.length - 1])) parts.pop();
  return parts.join(" ");
}
const allProNameSet = (() => {
  const s = new Set();
  for (const e of allProData?.players || []) {
    if (typeof e === "string") s.add(_normAp(e));
    else if (e && typeof e === "object") {
      if (e.name) s.add(_normAp(e.name));
      for (const n of e.names || []) s.add(_normAp(n));
    }
  }
  return s;
})();
function isStartingQbPos(pos) {
  const p = String(pos || "").toUpperCase();
  return p === "QB1" || p === "QB";
}
function injuryCapForPlayer(name, pos) {
  if (isStartingQbPos(pos)) return num(injuryScale.cap_player_qb) ?? 1.5;
  if (allProNameSet.has(_normAp(name))) return num(injuryScale.cap_player_allpro) ?? 0.5;
  return num(injuryScale.cap_player_other) ?? 0.25;
}

function seedOnFlag(status, raw) {
  const st = String(status || "").toUpperCase();
  if (st === "QUESTIONABLE") return !!(raw && raw.on === true);
  return st === "IR" || st === "OUT" || st === "PUP" || st === "NFI" || st === "DOUBTFUL";
}

function injuryRowPts(pos, status, impact, opts = {}) {
  const mult = num(injuryScale.status?.[status]) || 0;
  const imp = num(impact);
  const base = imp != null ? imp : injuryPosBase(pos);
  const raw = -round2(base * mult);
  if (opts.manual) return Math.min(0, raw);
  const cap = injuryCapForPlayer(opts.name, pos);
  // pts also limited by hard player cap 4.5
  const hard = injuryCapPlayer();
  return Math.max(-Math.min(cap, hard), Math.min(0, raw));
}

const injuryPlayerByTeam = Object.create(null);
const injuryPlayerGlobal = new Map();

function normInjuryName(name) {
  let s = String(name || "").toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const parts = s.split(" ").filter(Boolean);
  while (parts.length && /^(jr|sr|ii|iii|iv)$/.test(parts[parts.length - 1])) parts.pop();
  return parts.join(" ");
}

function mergeInjuryPlayerEntry(map, name, patch) {
  const key = normInjuryName(name);
  if (!key) return;
  const cur = map.get(key) || { name: String(name || ""), sources: [] };
  if (patch.ovr != null) cur.ovr = patch.ovr;
  if (patch.grade != null) cur.grade = patch.grade;
  if (patch.source && !cur.sources.includes(patch.source)) cur.sources.push(patch.source);
  map.set(key, cur);
}

function ingest(data, source, ovrKey, gradeKey) {
  if (!data?.teams) return;
  for (const [abbrRaw, team] of Object.entries(data.teams)) {
    const abbr = normAbbr(abbrRaw);
    if (!injuryPlayerByTeam[abbr]) injuryPlayerByTeam[abbr] = new Map();
    for (const side of ["off", "def"]) {
      for (const row of team?.[side] || []) {
        if (!row?.name) continue;
        const patch = { source };
        if (ovrKey && row[ovrKey] != null) patch.ovr = num(row[ovrKey]);
        if (gradeKey && row[gradeKey] != null) patch.grade = num(row[gradeKey]);
        mergeInjuryPlayerEntry(injuryPlayerByTeam[abbr], row.name, patch);
        mergeInjuryPlayerEntry(injuryPlayerGlobal, row.name, patch);
      }
    }
  }
}
ingest(maddenData, "madden", "ovr", null);
ingest(pffData, "pff", null, "grade");

function lookupInjuryPlayer(abbr, name) {
  const key = normInjuryName(name);
  if (!key) return null;
  const a = normAbbr(abbr);
  const teamMap = injuryPlayerByTeam[a];
  if (teamMap?.has(key)) return teamMap.get(key);
  if (injuryPlayerGlobal.has(key)) return injuryPlayerGlobal.get(key);
  return null;
}

function injuryAutoImpact(abbr, name, pos) {
  const hit = lookupInjuryPlayer(abbr, name);
  if (!hit || (hit.ovr == null && hit.grade == null)) return null;
  const posBase = injuryPosBase(pos);
  const leagueOvr = num(maddenData.scoring?.league_ovr) ?? 79.93;
  const ovrPer = num(maddenData.scoring?.ovr_per_point) ?? 4;
  const leagueGrade = num(pffData.scoring?.league_grade) ?? 71.47;
  const gradePer = num(pffData.scoring?.grade_per_point) ?? 5;
  let raw = null, source = null;
  if (hit.ovr != null && ovrPer) {
    raw = posBase + (hit.ovr - leagueOvr) / ovrPer;
    source = "madden";
  } else if (hit.grade != null && gradePer) {
    raw = posBase + (hit.grade - leagueGrade) / gradePer;
    source = "pff";
  }
  if (raw == null || !source) return null;
  const cap = injuryCapForPlayer(name, pos);
  const floor = Math.min(0.2, cap);
  const impact = Math.max(floor, Math.min(cap, Math.max(floor, raw)));
  return { impact: round2(impact), source };
}

function seedInjuryRow(raw, abbr) {
  const pos = raw?.pos ? String(raw.pos) : "DEPTH";
  const status = raw?.status ? String(raw.status).toUpperCase() : "QUESTIONABLE";
  const seedImpact = raw?.impact != null && raw.impact !== "" ? num(raw.impact) : null;
  const seedManual = !!(raw && raw.impact_source === "manual");
  let impact = null, impact_source = null;
  if (seedManual) {
    impact = seedImpact;
    impact_source = "manual";
  } else {
    const auto = injuryAutoImpact(abbr, raw?.name, pos);
    if (auto) {
      impact = auto.impact;
      impact_source = auto.source;
    } else if (seedImpact != null) {
      impact = seedImpact;
    }
  }
  return {
    name: raw?.name,
    pos,
    status,
    impact,
    impact_source,
    pts: injuryRowPts(pos, status, impact, { name: raw?.name, manual: impact_source === "manual" }),
    on: seedOnFlag(status, raw),
  };
}

function injuryTerm(abbr) {
  const rows = injurySeed.teams?.[normAbbr(abbr)] || [];
  let sum = 0;
  const detail = [];
  for (const raw of rows) {
    const row = seedInjuryRow(raw, abbr);
    if (row.on) sum += row.pts || 0;
    detail.push(row);
  }
  const cap = injuryCapTeam();
  return { term: Math.max(-cap, Math.min(0, sum)), detail };
}

function pffYtdTerm(abbr) {
  const t = pffYtdData?.teams?.[normAbbr(abbr)];
  if (!t) return 0;
  return num(t.net) || 0;
}

function layers(abbr) {
  const inj = injuryTerm(abbr);
  const prior = algorithmBase(abbr);
  const fa = faTerm(abbr);
  const draft = draftTerm(abbr);
  const madden = teamNet(maddenData, abbr);
  const pff = teamNet(pffData, abbr);
  const pffYtd = pffYtdTerm(abbr);
  const sos = teamNet(sosData, abbr);
  const ret = returnTerm(abbr);
  const injury = inj.term;
  const eff =
    prior + fa + draft + madden + pff + pffYtd + sos + ret + injury;
  return {
    prior: round2(prior),
    fa: round2(fa),
    draft: round2(draft),
    madden: round2(madden),
    pff: round2(pff),
    pff_ytd: round2(pffYtd),
    sos: round2(sos),
    return: round2(ret),
    injury: round2(injury),
    adjust: 0,
    context: 0,
    eff: round2(eff),
    injury_detail: inj.detail.filter((r) => r.on),
    injury_raw: round2(inj.detail.filter((r)=>r.on).reduce((s,r)=>s+(r.pts||0),0)),
  };
}

function eff(abbr) {
  return layers(abbr).eff;
}

// --- game terms ---
function coachName(abbr) {
  const c = coachData?.coaches?.[normAbbr(abbr)];
  return c?.name || null;
}

function coachScoring() {
  const s = coachData?.scoring;
  return {
    min_n: (s && num(s.min_n)) ?? 4,
    max_pts: (s && num(s.max_pts)) ?? 1,
    dead_zone: (s && num(s.dead_zone)) ?? 0.15,
  };
}

function recomputePtsForA(row) {
  const aW = num(row?.a_wins) || 0;
  const bW = num(row?.b_wins) || 0;
  const n = num(row?.n) ?? (aW + bW);
  const { min_n, max_pts, dead_zone } = coachScoring();
  if (!n || n < min_n) return 0;
  const rate = aW / n;
  if (Math.abs(rate - 0.5) < dead_zone) return 0;
  const raw = (rate - 0.5) * 2 * Math.min(1, n / 8);
  return Math.max(-max_pts, Math.min(max_pts, raw));
}

function ptsForA(row) {
  const stored = num(row && row.pts_for_a);
  if (stored !== null) return stored;
  return recomputePtsForA(row);
}

function coachPair(home, away) {
  if (!coachData || !Array.isArray(coachData.h2h)) return null;
  const hn = coachName(home);
  const an = coachName(away);
  if (!hn || !an) return null;
  for (const row of coachData.h2h) {
    if (!row) continue;
    if ((row.a === hn && row.b === an) || (row.a === an && row.b === hn)) return row;
  }
  return null;
}

function coachTerm(game) {
  if (!coachData || !game) return 0;
  const pair = coachPair(game.home, game.away);
  if (!pair) return 0;
  const n = num(pair.n) ?? ((num(pair.a_wins) || 0) + (num(pair.b_wins) || 0));
  if (n < coachScoring().min_n) return 0;
  const rawA = ptsForA(pair);
  const home = coachName(game.home);
  if (home === pair.a) return rawA;
  if (home === pair.b) return -rawA;
  return 0;
}

function prepOf(abbr) {
  return prepData?.coaches?.[normAbbr(abbr)] || null;
}

function prepBlock(abbr, key) {
  const c = prepOf(abbr);
  const b = c && c[key];
  if (!b) return { pts: 0 };
  return b;
}

function week1Term(abbr, week) {
  if (Number(week) !== 1) return 0;
  return num(prepBlock(abbr, "week1").pts) || 0;
}

function prepNet(game) {
  if (!prepData || !game) return 0;
  const w = Number(game.week);
  return week1Term(game.home, w) - week1Term(game.away, w);
}

function atsOf(abbr) {
  return atsData?.coaches?.[normAbbr(abbr)] || null;
}

function atsScoring() {
  const s = atsData?.scoring;
  return {
    min_n: (s && num(s.min_n)) ?? 16,
    dead_zone: (s && num(s.dead_zone)) ?? 0.04,
    max_pts: (s && num(s.max_pts)) ?? 0.35,
    n_full: (s && num(s.n_full)) ?? 48,
  };
}

function atsPts(abbr) {
  const c = atsOf(abbr);
  if (!c) return 0;
  const w = num(c.wins) || 0;
  const l = num(c.losses) || 0;
  const n = num(c.n) ?? (w + l);
  const rate = n ? w / n : (num(c.rate) || 0);
  const { min_n, dead_zone } = atsScoring();
  if (n < min_n || Math.abs(rate - 0.5) < dead_zone) return 0;
  const stored = num(c.pts);
  if (stored !== null) return stored;
  const { max_pts, n_full } = atsScoring();
  const raw = (rate - 0.5) * 2 * Math.min(1, n / n_full);
  return Math.max(-max_pts, Math.min(max_pts, raw));
}

function atsNet(game) {
  if (!atsData || !game) return 0;
  return atsPts(game.home) - atsPts(game.away);
}

const SCHED_TZ = {
  SEA: 3, SF: 3, LAR: 3, LAC: 3, LV: 3,
  DEN: 2, ARI: 2,
  CHI: 1, GB: 1, MIN: 1, TEN: 1, HOU: 1, DAL: 1, NO: 1, KC: 1,
};

function schedTz(abbr) {
  return SCHED_TZ[normAbbr(abbr)] || 0;
}

function toET(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    hourCycle: "h23",
  });
  const parts = {};
  for (const p of fmt.formatToParts(d)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  return { hour: Number(parts.hour) };
}

function schedNeighbor(abbr, game, dir) {
  if (!nflData || !game || !game.date) return null;
  const a = normAbbr(abbr);
  const here = new Date(game.date);
  if (Number.isNaN(here.getTime())) return null;
  let best = null;
  let bestT = null;
  for (const g of nflData.games) {
    if (!g || !g.date) continue;
    if (g.home !== a && g.away !== a) continue;
    if (g.id && game.id && g.id === game.id) continue;
    const t = new Date(g.date);
    if (Number.isNaN(t.getTime())) continue;
    if (dir < 0 && t >= here) continue;
    if (dir > 0 && t <= here) continue;
    if (bestT == null || (dir < 0 ? t > bestT : t < bestT)) {
      best = g;
      bestT = t;
    }
  }
  return best;
}

function schedDays(prev, game) {
  if (!prev || !game || !prev.date || !game.date) return null;
  const a = new Date(prev.date);
  const b = new Date(game.date);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return (b - a) / 86400000;
}

function schedClub(abbr, game) {
  const a = normAbbr(abbr);
  let pts = 0;
  const bits = [];
  if (!game) return { pts: 0, bits };
  const isAway = game.away === a;
  const prev = schedNeighbor(a, game, -1);

  if (isAway && !game.neutral) {
    let travel = 0;
    const hop = Math.abs(schedTz(a) - schedTz(game.home));
    if (hop >= 3) {
      travel -= 0.35;
      bits.push("3-zone");
    } else if (hop >= 2) {
      travel -= 0.25;
      bits.push("2-zone");
    }
    const et = toET(game.date);
    if (schedTz(a) >= 3 && et && Number.isFinite(et.hour) && et.hour < 16) {
      travel -= 0.15;
      bits.push("early PT");
    }
    const days = schedDays(prev, game);
    if (days != null && days < 6) {
      travel -= 0.25;
      bits.push("short week");
    }
    if (travel < -0.5) travel = -0.5;
    pts += travel;
  }

  // W1: no bye / trap typically; extra rest if ≥10 days from prev (none for openers)
  return { pts, bits };
}

function schedNet(game) {
  if (!game) return 0;
  const n = schedClub(game.home, game).pts - schedClub(game.away, game).pts;
  if (n > 0.5) return 0.5;
  if (n < -0.5) return -0.5;
  return Math.round(n * 100) / 100;
}

function matchupNet(game) {
  if (!pffMatchData || !game) return 0;
  const games = pffMatchData.games || {};
  const rec = games[String(game.id)] || games[normAbbr(game.away) + "@" + normAbbr(game.home)] || null;
  if (!rec) return 0;
  const n = num(rec.net);
  return n === null ? 0 : n;
}

function matchupNote(game) {
  const games = pffMatchData.games || {};
  const rec = games[String(game.id)] || games[normAbbr(game.away) + "@" + normAbbr(game.home)] || null;
  return rec?.note || "";
}

function ourHomeSpread(game) {
  const pad = game && game.neutral ? 0 : HFA;
  const homeE = eff(game.home);
  const awayE = eff(game.away);
  const coach = coachTerm(game);
  const prep = prepNet(game);
  const ats = atsNet(game);
  const sched = schedNet(game);
  const matchup = matchupNet(game);
  const gap = homeE - awayE + pad + coach + prep + ats + sched + matchup;
  return -(gap);
}

function fmtBMoney(home, away, modelHome) {
  // Favorite form like "SEA −0.2" or "DEN −2.87" (home-centric + favorite label)
  const m = round2(modelHome);
  if (m < 0) {
    // home favored
    return `${home} −${Math.abs(m).toFixed(2).replace(/\.?0+$/, (s) => s === ".00" ? "" : s.replace(/0+$/, "").replace(/\.$/, "") || "0")}`.replace(/−0$/, "−0.0");
  }
  if (m > 0) {
    // away favored → show away as favorite with absolute line
    return `${away} −${Math.abs(m).toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}`;
  }
  return `${home} PK`;
}

function fmtSpreadFavorite(home, away, modelHome) {
  const m = Number(Number(modelHome).toFixed(2));
  if (m === 0) return `${home} PK`;
  if (m < 0) return `${home} −${Math.abs(m)}`;
  return `${away} −${Math.abs(m)}`;
}

function closeFor(gameId) {
  const row = (closes.games || []).find((g) => g.game === gameId || g.espn_id === String(gameId));
  return row || null;
}


function parseStreetHome(details, home, away) {
  const s = String(details || "").trim();
  if (!s) return null;
  const m = s.match(/^([A-Z]{2,3})\s*([+-]?\d+(?:\.\d+)?)$/i);
  if (!m) return null;
  const fav = normAbbr(m[1]);
  const pts = Math.abs(Number(m[2]));
  if (fav === normAbbr(home)) return -pts;
  if (fav === normAbbr(away)) return pts;
  return null;
}

function windowFor(kickIso) {
  const s = String(kickIso || "");
  // Week 3 2026 windows
  if (s.includes("2026-09-28T00:20")) return "SNF";
  if (s.includes("2026-09-29T00:15")) return "MNF";
  if (s.includes("T17:00")) return "SUN_AM";
  if (s.includes("T20:05") || s.includes("T20:25")) return "SUN_PM";
  if (s.includes("2026-09-25T00:15") || s.includes("2026-09-24T20:15")) return "TNF";
  return "SUN_PM";
}

function streetFromBoard(espnId) {
  for (const e of streetBoard.events || []) {
    if (String(e.id) !== String(espnId)) continue;
    const comp = e.competitions[0];
    const odds = (comp.odds || [])[0] || {};
    const a = comp.competitors.find((t) => t.homeAway === "away");
    const h = comp.competitors.find((t) => t.homeAway === "home");
    const details = odds.details;
    const homeLine = parseStreetHome(details, h.team.abbreviation, a.team.abbreviation);
    return {
      details,
      street_home_spread: homeLine,
      ou: odds.overUnder ?? null,
      provider: odds.provider?.name || null,
      venue: comp.venue?.fullName || null,
      neutral: !!(comp.neutralSite || comp.venue?.neutralSite),
    };
  }
  return null;
}

const TARGET = "PHI@CHI";
const ESPN_ID = "401872963";

function gameStatus(espnId) {
  for (const e of streetBoard.events || []) {
    if (String(e.id) !== String(espnId)) continue;
    const t = e.competitions?.[0]?.status?.type || {};
    return {
      state: t.state || null,
      name: t.name || null,
      completed: !!t.completed,
      detail: t.detail || t.shortDetail || null,
    };
  }
  return null;
}

const status = gameStatus(ESPN_ID);
if (!status) {
  console.error("PHI@CHI not found on ESPN board — abort, no overwrite");
  process.exit(2);
}
if (status.completed || String(status.state).toLowerCase() === "post" || String(status.name || "").includes("FINAL")) {
  console.error("Game already FINAL/post — stay silent, do NOT overwrite lock");
  console.error(JSON.stringify(status));
  process.exit(3);
}
console.log("pre-kick confirmed", status);

const w3 = (nflData.games || []).filter((g) => Number(g.week) === 3 && `${normAbbr(g.away)}@${normAbbr(g.home)}` === TARGET);
if (!w3.length) {
  console.error("PHI@CHI missing from nfl-2026.json week 3");
  process.exit(2);
}

const frozenAt = new Date();
const fmtEt = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
});
const parts = Object.fromEntries(fmtEt.formatToParts(frozenAt).map((p) => [p.type, p.value]));
const frozenLabel = `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} ${parts.dayPeriod} ET (America/New_York)`;

const summary = [];

for (const g of w3) {
  const away = normAbbr(g.away);
  const home = normAbbr(g.home);
  const gameId = `${away}@${home}`;
  const homeL = layers(home);
  const awayL = layers(away);
  const coach = round2(coachTerm(g));
  const prep = round2(prepNet(g));
  const ats = round2(atsNet(g));
  const travel = round2(schedNet(g));
  const matchup = round2(matchupNet(g));
  const st = streetFromBoard(g.id) || streetFromBoard(ESPN_ID) || {};
  const neutral = !!(g.neutral || st.neutral);
  const hfa = neutral ? 0 : HFA;
  const ratingDiff = round2(homeL.eff - awayL.eff);
  const gap = round2(ratingDiff + hfa + coach + prep + ats + travel + matchup);
  const model = round2(-gap);
  const street = st.street_home_spread;
  const edge = street != null ? round2(street - model) : null;
  const win = "MNF";
  const fname = `2026-w03-${away.toLowerCase()}-${home.toLowerCase()}.json`;

  let edgeNote = "";
  if (edge != null) {
    const sideTxt = edge > 0 ? `home value (${home})` : edge < 0 ? `away value (${away})` : "push";
    edgeNote = `edgeHome = street − model = ${street} − (${model}) = ${edge} → ${sideTxt}`;
    if (Math.abs(edge) >= 1.5) edgeNote += `; |edge|≥1.5`;
  }

  // Retain Friday FIRE print — do NOT invent a new ticket / no chase after a bad Sunday
  const friCall = priorLock.call || null;
  const call = friCall
    ? {
        action: friCall.action,
        side: friCall.side,
        line: friCall.line || "CHI +4.5",
        units: friCall.units ?? 3,
        price: friCall.price ?? -110,
        class: friCall.class || "INFO",
        note: `Fri FIRE retained (CHI +4.5 3u). MNF live street ${st.details || "?"} / ou ${st.ou}. Model ${model} edge_home ${edge}. No new units.`,
      }
    : {
        action: "FIRE",
        side: "LAR",
        line: "LAR -2.5",
        units: 2,
        price: -110,
        class: "INFO",
        note: `Fri FIRE retained (CHI +4.5 3u). MNF live street ${st.details || "?"} / ou ${st.ou}. Model ${model} edge_home ${edge}. No new units.`,
      };

  const amModel = priorLock.model_home_spread;
  const amStreet = priorLock.street_home_spread;
  const amOu = priorLock.ou_street;
  const amInj = priorLock.feature_stack?.injury_pulled || "2026-09-25b";
  const dm = amModel != null ? round2(model - amModel) : null;
  const ds = street != null && amStreet != null ? round2(street - amStreet) : null;
  const dou = st.ou != null && amOu != null ? round2(st.ou - amOu) : null;

  const lock = {
    week: 3,
    season: 2026,
    game_id: gameId,
    kick: String(g.date).replace("Z", "+00:00"),
    away,
    home,
    espn_id: String(g.id || ESPN_ID),
    venue: st.venue || g.venue || priorLock.venue || "Soldier Field",
    neutral,
    window: win,
    model_home_spread: model,
    official_b_line: officialHomeSpread(3, model),
    official_rounded: false,
    model_home_spread_source: "desk_compute",
    street_home_spread: street,
    close_at_lock: street,
    ou_street: st.ou ?? null,
    street_note: `MNF_PREKICK freeze ${frozenLabel}. ESPN ${st.provider || "DraftKings"} live: ${st.details} / ou ${st.ou}. vs SUN_AM street ${amStreet} / ou ${amOu} (ds=${ds}, dou=${dou}, dm=${dm}). Injury ${injurySeed.pulled} ${injurySeed.phase}.`,
    edge_home: edge,
    edge_note: edgeNote,
    feature_stack: {
      formula: `ourHomeLine = -(eff(home)-eff(away) + HFA + coach + prep + ats + sched + matchup); HFA=${hfa}${neutral ? " (neutral)" : ""}; W3 n≈2 so return at w_prior=1/3; FA & PFF-preseason OFF (site INCLUDE_FA/INCLUDE_PFF_PRESEASON=false); currentRating incl YTD take/give, draft_fade≈0.5; pff_ytd IN line; injury ${injurySeed.pulled} ${injurySeed.phase}`,
      injury_pulled: injurySeed.pulled,
      [`away_${away}`]: {
        prior: awayL.prior, fa: awayL.fa, draft: awayL.draft, madden: awayL.madden,
        pff: awayL.pff, pff_ytd: awayL.pff_ytd, sos: awayL.sos, return: awayL.return,
        injury: awayL.injury, adjust: 0, context: 0, eff: awayL.eff,
        taper: taperFor(away), current_rating: round2(currentRating(away)),
      },
      [`home_${home}`]: {
        prior: homeL.prior, fa: homeL.fa, draft: homeL.draft, madden: homeL.madden,
        pff: homeL.pff, pff_ytd: homeL.pff_ytd, sos: homeL.sos, return: homeL.return,
        injury: homeL.injury, adjust: 0, context: 0, eff: homeL.eff,
        taper: taperFor(home), current_rating: round2(currentRating(home)),
      },
      layers_home_minus_away: {
        prior: round2(homeL.prior - awayL.prior),
        fa: round2(homeL.fa - awayL.fa),
        draft: round2(homeL.draft - awayL.draft),
        madden: round2(homeL.madden - awayL.madden),
        pff: round2(homeL.pff - awayL.pff),
        pff_ytd: round2(homeL.pff_ytd - awayL.pff_ytd),
        sos: round2(homeL.sos - awayL.sos),
        return: round2(homeL.return - awayL.return),
        injury: round2(homeL.injury - awayL.injury),
        adjust: 0,
        context: 0,
      },
      rating_diff_home_minus_away: ratingDiff,
      hfa,
      coach,
      coach_note: `coachTerm desk`,
      prep,
      prep_note: "week!==1 so week1_term=0; bye check via prepNet",
      ats,
      ats_note: "atsNet desk",
      travel,
      travel_note: "schedNet desk",
      matchup,
      matchup_note: matchupNote(g) || "pff-matchups missing → 0",
      gap,
      component_sum: [
        { label: `rating_diff (${home}−${away})`, val: ratingDiff },
        { label: "HFA", val: hfa },
        { label: "coach", val: coach },
        { label: "prep (W3)", val: prep },
        { label: "ats", val: ats },
        { label: "travel/sched", val: travel },
        { label: "matchup", val: matchup },
        { label: "gap", val: gap },
        { label: "model_home_spread (−gap)", val: model },
      ],
      injuries: {
        [away]: awayL.injury_detail,
        [home]: homeL.injury_detail,
      },
      injury_terms: {
        [away]: { raw: awayL.injury_raw, term: awayL.injury, capped: awayL.injury_raw < -6, cap_team: 6 },
        [home]: { raw: homeL.injury_raw, term: homeL.injury, capped: homeL.injury_raw < -6, cap_team: 6 },
      },
    },
    frozen_at: frozenLabel,
    tickets: [],
    call,
    notes: `MNF pre-kick freeze ${frozenLabel}. Injury ${injurySeed.pulled} ${injurySeed.phase}. ${away} inj ${awayL.injury}; ${home} inj ${homeL.injury}. Street ${st.details}. Edge home ${edge}. Fri call FIRE CHI +4.5 3u retained — no new tickets.`,
    refresh: {
      phase: "MNF_PREKICK",
      vs_sunday_am: {
        dm,
        ds,
        dou,
        material: !!(
          (dm != null && Math.abs(dm) >= 0.25) ||
          (ds != null && Math.abs(ds) >= 0.5) ||
          (dou != null && Math.abs(dou) >= 1.0) ||
          amInj !== injurySeed.pulled
        ),
      },
      am_frozen_at: priorLock.frozen_at || null,
      am_model: amModel,
      am_street: amStreet,
      am_ou: amOu,
      am_injury: amInj,
      confirmed_pre_kick: true,
      espn_status: status,
    },
    lock_phase: "MNF_PREKICK",
    injury_aligned_to_imp3: true,
    injury_source_policy: "madden_first",
  };

  fs.writeFileSync(path.join(LOCK_DIR, fname), JSON.stringify(lock, null, 2) + "\n");
  summary.push({
    game: gameId,
    file: fname,
    window: win,
    model,
    street,
    edge,
    ou: st.ou,
    injury: injurySeed.pulled,
    action: call.action,
    side: call.side,
    market: call.line,
    units: call.units,
  });
  console.log(gameId.padEnd(10), win.padEnd(7), "model", String(model).padStart(7), "street", String(street).padStart(6), "edge", String(edge).padStart(7), "ou", st.ou, call.action, call.line);
}

const note = {
  frozen_at: frozenLabel,
  injury_pulled: injurySeed.pulled,
  injury_phase: injurySeed.phase,
  game: "PHI@CHI",
  n: summary.length,
  games: summary,
  am_baseline: {
    model: priorLock.model_home_spread,
    street: priorLock.street_home_spread,
    ou: priorLock.ou_street,
    injury: priorLock.feature_stack?.injury_pulled || "2026-09-25b",
  },
  mnf: summary[0]
    ? {
        model: summary[0].model,
        street: summary[0].street,
        ou: summary[0].ou,
        injury: summary[0].injury,
        edge_home: summary[0].edge,
      }
    : null,
};
fs.writeFileSync(path.join(LOCK_DIR, "2026-w03-mnf-freeze-note.json"), JSON.stringify(note, null, 2) + "\n");
console.log("Wrote", summary.length, "MNF lock(s) + freeze note");

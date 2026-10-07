#!/usr/bin/env node
/**
 * Freeze Week 5 2026 TNF TB@DAL pre-kick model lock.
 * Model line comes from the live site app.js via site_parity_harness.mjs (single source of truth),
 * injury-2026.json 2026-10-07b FINAL. Street = ESPN DraftKings pickcenter (book of record) at freeze.
 * Usage: node data/freeze_w05_tnf_tb_dal.mjs <street_home_spread> <ou> "<street_note>"
 */
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
import { init } from "./site_parity_harness.mjs";
const DATA = path.dirname(fileURLToPath(import.meta.url));
const LOCK = path.join(DATA, "postmortem/locks/2026-w05-tb-dal.json");
const [streetArg, ouArg, streetNote] = process.argv.slice(2);
const api = await init();
const g = api.getNfl().games.find((x) => String(x.id) === "401872980");
if (!g) throw new Error("TB@DAL not found");
if (Date.now() >= Date.parse(g.date)) throw new Error("past kick — refuse pre-kick lock");
const r2 = (n) => Math.round(Number(n) * 100) / 100;
const inj = JSON.parse(fs.readFileSync(path.join(DATA, "injury-2026.json"), "utf8"));
const L = { prior: "algorithmBase", fa: "faTerm", draft: "draftTerm", madden: "maddenTerm", pff: "pffTerm", pff_pre: "pffPreTerm", pff_ytd: "pffYtdTerm", sos: "sosTerm", return: "returnTerm", injury: "injuryTerm" };
function team(abbr) {
  const o = {}; for (const [k, f] of Object.entries(L)) o[k] = r2(api[f](abbr));
  o.eff = r2(api.eff(abbr)); o.taper = api.taperFor(abbr); o.current_rating = r2(api.currentRating(abbr));
  return o;
}
const away = team(g.away), home = team(g.home);
const hfa = g.neutral ? 0 : api.getHfa();
const coach = r2(api.coachTerm(g)), prep = r2(api.prepNet(g)), ats = r2(api.atsNet(g)), sched = r2(api.schedNet(g)), matchup = r2(api.matchupNet(g));
const model = api.ourHomeSpread(g, api.getHfa());
const roundHalf = (x) => { const s = Math.sign(x) || 1; return s * Math.round(Math.abs(x) * 2) / 2; };
const shadowRaw = api.dvoaBlendShadowHomeSpread ? api.dvoaBlendShadowHomeSpread(g) : null;
const street = Number(streetArg), ou = Number(ouArg);
const layers = {}; for (const k of Object.keys(L)) layers[k] = r2(home[k] - away[k]);
const now = new Date();
const etStamp = now.toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }) + " ET (America/New_York)";
const lock = {
  week: 5, season: 2026, game_id: `${g.away}@${g.home}`, kick: "2026-10-08T20:15:00-04:00",
  away: g.away, home: g.home, espn_id: String(g.id), venue: g.venue, neutral: !!g.neutral, window: "TNF",
  model_home_spread: r2(-model) === 0 ? 0 : r2(model),
  model_home_spread_rounded: roundHalf(model),
  model_home_spread_source: "desk_compute",
  model_home_spread_method: "site_parity_harness.mjs → live app.js ourHomeSpread(game, hfa) (rounded official line = nearest 0.5)",
  street_home_spread: street, close_at_lock: street, ou_street: ou, street_note: streetNote,
  edge_home: r2(street - model),
  edge_home_rounded: r2(street - roundHalf(model)),
  edge_note: `edgeHome = street − model = ${street} − (${r2(model)}) = ${r2(street - model)}; positive → home (${g.home}) value. Rounded B$ ${roundHalf(model)} vs ${street} = ${r2(street - roundHalf(model))}.`,
  shadow_dvoa_blend: shadowRaw === null ? null : { raw: r2(shadowRaw), rounded: roundHalf(shadowRaw), weight: api.DVOA_BLEND_SHADOW_WEIGHT, in_b_line: false },
  feature_stack: {
    formula: "ourHomeLine = -(eff(home) - eff(away) + HFA + coach + prep + ats + sched + matchup); eff = algorithmBase + fa + draft + madden + pff + pffPre + pffYtd + sos + return + injury (+ user adjust/context, none on default profile). 2025 prior locked at 0 from Week 5; Last-year SOS out.",
    injury_pulled: inj.pulled, injury_phase: inj.phase,
    [`away_${g.away}`]: away, [`home_${g.home}`]: home,
    layers_home_minus_away: layers,
    rating_diff_home_minus_away: r2(home.eff - away.eff),
    hfa, coach, prep, ats, travel: sched, matchup,
    gap: r2(model),
  },
  injury_valuation: "data/injury-valuation/weeks/2026-W05-tb-dal.json",
  frozen_at: now.toISOString(), frozen_at_et: etStamp,
  tickets: [],
};
fs.writeFileSync(LOCK, JSON.stringify(lock, null, 2) + "\n");
console.log(JSON.stringify({ model: lock.model_home_spread, rounded: lock.model_home_spread_rounded, street, edge: lock.edge_home, edge_r: lock.edge_home_rounded, shadow: lock.shadow_dvoa_blend, away, home, coach, prep, ats, sched, matchup }, null, 1));

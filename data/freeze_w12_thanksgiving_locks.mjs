#!/usr/bin/env node
/**
 * Freeze Week 12 2026 pre-kick model locks for Wed GB@LAR + Thanksgiving CHI@DET, PHI@DAL, KC@BUF.
 * Copy of freeze_w11_tnf_ind_hou.mjs, looped over a game table. Model line comes from the live site app.js via
 * site_parity_harness.mjs (single source of truth), injury-2026.json 2026-11-25b FINAL.
 * Street = ESPN DraftKings pickcenter (book of record) at freeze, passed in data/postmortem/freeze-inputs/2026-w12-thanksgiving-street.json
 * Usage: node data/freeze_w12_thanksgiving_locks.mjs <street.json>
 */
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
import { init } from "./site_parity_harness.mjs";
import { officialHomeSpread, roundHalfAwayFromZero } from "./record/round_half.mjs";
const DATA = path.dirname(fileURLToPath(import.meta.url));
const STREET = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const api = await init();
const r2 = (n) => Math.round(Number(n) * 100) / 100;
const inj = JSON.parse(fs.readFileSync(path.join(DATA, "injury-2026.json"), "utf8"));
const L = { prior: "algorithmBase", fa: "faTerm", draft: "draftTerm", madden: "maddenTerm", pff: "pffTerm", pff_pre: "pffPreTerm", pff_ytd: "pffYtdTerm", sos: "sosTerm", return: "returnTerm", injury: "injuryTerm" };
function team(abbr) {
  const o = {}; for (const [k, f] of Object.entries(L)) o[k] = r2(api[f](abbr));
  o.eff = r2(api.eff(abbr)); o.taper = api.taperFor(abbr); o.current_rating = r2(api.currentRating(abbr));
  return o;
}
const out = [];
for (const s of STREET.games) {
  const g = api.getNfl().games.find((x) => String(x.id) === s.espn_id);
  if (!g) throw new Error(`${s.espn_id} not found`);
  if (Date.now() >= Date.parse(g.date)) { console.log(`${g.away}@${g.home} past kick — skipped`); continue; }
  const away = team(g.away), home = team(g.home);
  const hfa = g.neutral ? 0 : api.getHfa();
  const coach = r2(api.coachTerm(g)), prep = r2(api.prepNet(g)), ats = r2(api.atsNet(g)), sched = r2(api.schedNet(g)), matchup = r2(api.matchupNet(g));
  const model = api.ourHomeSpread(g, api.getHfa());
  const rawModel = r2(-model) === 0 ? 0 : r2(model);
  const official = officialHomeSpread(12, rawModel);
  const shadowRaw = api.dvoaBlendShadowHomeSpread ? api.dvoaBlendShadowHomeSpread(g) : null;
  const street = Number(s.street_home_spread), ou = Number(s.ou);
  const layers = {}; for (const k of Object.keys(L)) layers[k] = r2(home[k] - away[k]);
  const now = new Date();
  const etStamp = now.toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }) + " ET (America/New_York)";
  const slug = `${g.away}-${g.home}`.toLowerCase();
  const lock = {
    week: 12, season: 2026, game_id: `${g.away}@${g.home}`, kick: s.kick,
    away: g.away, home: g.home, espn_id: String(g.id), venue: g.venue, neutral: !!g.neutral, window: "TNF", window_note: s.window_note,
    model_home_spread: rawModel,
    model_home_spread_rounded: official,
    official_b_line: official,
    official_rounded: true,
    model_home_spread_source: "desk_compute",
    model_home_spread_method: "site_parity_harness.mjs → live app.js ourHomeSpread(game, hfa). official_b_line is that raw number rounded with data/record/round_half.mjs (nearest 0.5, .25/.75 away from zero).",
    street_home_spread: street, close_at_lock: street, ou_street: ou, street_note: s.street_note,
    edge_home: r2(street - rawModel),
    edge_home_rounded: r2(street - official),
    edge_note: `edgeHome = street − model = ${street} − (${rawModel}) = ${r2(street - rawModel)}; positive → home (${g.home}) value. Rounded B$ ${official} vs ${street} = ${r2(street - official)}.`,
    b_total: s.b_total, total_edge_note: s.total_edge_note,
    shadow_dvoa_blend: shadowRaw === null ? null : { raw: r2(shadowRaw), rounded: roundHalfAwayFromZero(shadowRaw), weight: api.DVOA_BLEND_SHADOW_WEIGHT, in_b_line: false },
    feature_stack: {
      formula: "ourHomeLine = -(eff(home) - eff(away) + HFA + coach + prep + ats + sched + matchup); eff = algorithmBase + fa + draft + madden + pff + pffPre + pffYtd + sos + return + injury (+ user adjust/context, none on default profile). 2025 prior locked at 0 from Week 5; Last-year SOS out.",
      injury_pulled: inj.pulled, injury_phase: inj.phase,
      [`away_${g.away}`]: away, [`home_${g.home}`]: home,
      layers_home_minus_away: layers,
      rating_diff_home_minus_away: r2(home.eff - away.eff),
      hfa, coach, prep, ats, travel: sched, matchup,
      gap: r2(model),
    },
    injury_valuation: `data/injury-valuation/weeks/2026-W12-${slug}.json`,
    frozen_at: now.toISOString(), frozen_at_et: etStamp,
    tickets: [],
    call: s.call,
  };
  const fp = path.join(DATA, `postmortem/locks/2026-w12-${slug}.json`);
  fs.writeFileSync(fp, JSON.stringify(lock, null, 2) + "\n");
  out.push({ game: lock.game_id, model: rawModel, official, street, edge: lock.edge_home, edge_r: lock.edge_home_rounded, shadow: lock.shadow_dvoa_blend && lock.shadow_dvoa_blend.raw, file: path.relative(path.join(DATA, ".."), fp) });
}
console.log(JSON.stringify(out, null, 1));

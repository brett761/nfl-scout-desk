#!/usr/bin/env node
/**
 * Freeze Week 5 2026 Sunday AM (London), Sunday PM, SNF, MNF pre-kick model locks (working locks after Friday FINAL).
 * Model line from live site app.js via site_parity_harness.mjs; injury-2026.json 2026-10-09b FINAL.
 * Street = ESPN DraftKings scoreboard (book of record), fetched to /tmp/sb5.json at freeze.
 * Usage: node data/freeze_w05_sunday_locks.mjs /tmp/sb5.json
 */
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
import { init } from "./site_parity_harness.mjs";
import { officialHomeSpread, roundHalfAwayFromZero } from "./record/round_half.mjs";
const DATA = path.dirname(fileURLToPath(import.meta.url));
const LOCK_DIR = path.join(DATA, "postmortem/locks");
const sb = JSON.parse(fs.readFileSync(process.argv[2] || "/tmp/sb5.json", "utf8"));
const api = await init();
const r2 = (n) => Math.round(Number(n) * 100) / 100;
const inj = JSON.parse(fs.readFileSync(path.join(DATA, "injury-2026.json"), "utf8"));
const L = { prior: "algorithmBase", fa: "faTerm", draft: "draftTerm", madden: "maddenTerm", pff: "pffTerm", pff_pre: "pffPreTerm", pff_ytd: "pffYtdTerm", sos: "sosTerm", return: "returnTerm", injury: "injuryTerm" };
function team(abbr) {
  const o = {}; for (const [k, f] of Object.entries(L)) o[k] = r2(api[f](abbr));
  o.eff = r2(api.eff(abbr)); o.taper = api.taperFor(abbr); o.current_rating = r2(api.currentRating(abbr));
  return o;
}
function windowFor(g) {
  if (g.neutral) return "SUN_AM";
  const et = new Date(g.date).toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", hour12: false });
  if (et.startsWith("Mon")) return "MNF";
  const h = Number(et.split(" ").pop());
  return h >= 19 ? "SNF" : "SUN_PM";
}
const now = new Date();
const etStamp = now.toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }) + " ET (America/New_York)";
const summary = [];
for (const e of sb.events) {
  const c = e.competitions[0];
  if (e.status.type.name !== "STATUS_SCHEDULED") continue;
  const g = api.getNfl().games.find((x) => String(x.id) === String(e.id));
  if (!g) throw new Error("missing game " + e.id);
  if (Date.now() >= Date.parse(g.date)) { console.log("skip past kick", e.id); continue; }
  const o = (c.odds || [])[0] || {};
  const street = Number(o.spread), ou = Number(o.overUnder);
  const away = team(g.away), home = team(g.home);
  const hfa = g.neutral ? 0 : api.getHfa();
  const coach = r2(api.coachTerm(g)), prep = r2(api.prepNet(g)), ats = r2(api.atsNet(g)), sched = r2(api.schedNet(g)), matchup = r2(api.matchupNet(g));
  const model = api.ourHomeSpread(g, api.getHfa());
  const rawModel = r2(-model) === 0 ? 0 : r2(model);
  const official = officialHomeSpread(5, rawModel);
  const shadowRaw = api.dvoaBlendShadowHomeSpread ? api.dvoaBlendShadowHomeSpread(g) : null;
  const layers = {}; for (const k of Object.keys(L)) layers[k] = r2(home[k] - away[k]);
  const slug = `2026-w05-${g.away.toLowerCase()}-${g.home.toLowerCase()}`;
  const lock = {
    week: 5, season: 2026, game_id: `${g.away}@${g.home}`, kick: g.date,
    away: g.away, home: g.home, espn_id: String(g.id), venue: g.venue, neutral: !!g.neutral, window: windowFor(g),
    model_home_spread: rawModel, model_home_spread_rounded: official, official_b_line: official, official_rounded: true,
    model_home_spread_source: "desk_compute",
    model_home_spread_method: "site_parity_harness.mjs → live app.js ourHomeSpread(game, hfa). official_b_line rounded with data/record/round_half.mjs (nearest 0.5, .25/.75 away from zero).",
    street_home_spread: street, close_at_lock: street, ou_street: ou,
    street_note: `Working pre-kick freeze ${etStamp} after Friday FINAL Game Status. ESPN DraftKings scoreboard: ${o.details} / ou ${ou}. Refresh pre-kick if street or model moves materially.`,
    edge_home: r2(street - rawModel), edge_home_rounded: r2(street - official),
    edge_note: `edgeHome = street − model = ${street} − (${rawModel}) = ${r2(street - rawModel)}; positive → home (${g.home}) value. Rounded B$ ${official} vs ${street} = ${r2(street - official)}.`,
    shadow_dvoa_blend: shadowRaw === null ? null : { raw: r2(shadowRaw), rounded: roundHalfAwayFromZero(shadowRaw), weight: api.DVOA_BLEND_SHADOW_WEIGHT, in_b_line: false },
    feature_stack: {
      formula: "ourHomeLine = -(eff(home) - eff(away) + HFA + coach + prep + ats + sched + matchup); eff = algorithmBase + fa + draft + madden + pff + pffPre + pffYtd + sos + return + injury. 2025 prior locked at 0 from Week 5; Last-year SOS out.",
      injury_pulled: inj.pulled, injury_phase: inj.phase,
      [`away_${g.away}`]: away, [`home_${g.home}`]: home,
      layers_home_minus_away: layers, rating_diff_home_minus_away: r2(home.eff - away.eff),
      hfa, coach, prep, ats, travel: sched, matchup, gap: r2(model),
    },
    injury_valuation: "data/injury-valuation/weeks/2026-W05-sunday.json",
    frozen_at: now.toISOString(), frozen_at_et: etStamp, tickets: [],
  };
  fs.writeFileSync(path.join(LOCK_DIR, slug + ".json"), JSON.stringify(lock, null, 2) + "\n");
  summary.push({ slug, game: lock.game_id, window: lock.window, kick: g.date, model: rawModel, official, street, ou, edge_home: lock.edge_home, edge_home_rounded: lock.edge_home_rounded, shadow: lock.shadow_dvoa_blend && lock.shadow_dvoa_blend.rounded, inj_away: away.injury, inj_home: home.injury });
}
const summaryObj = { week: 5, season: 2026, frozen_at: now.toISOString(), frozen_at_et: etStamp, injury_pulled: inj.pulled, injury_phase: inj.phase,
  street_source: "ESPN DraftKings scoreboard site.api.espn.com week=5 year=2026", tnf: "TB@DAL FINAL TB 24, DAL 16 (lock DAL -10 vs street -8.5; not re-frozen)", n: summary.length, games: summary };
fs.writeFileSync(path.join(LOCK_DIR, "2026-w05-sunday-freeze-summary.json"), JSON.stringify(summaryObj, null, 2) + "\n");
console.log(JSON.stringify(summary, null, 1));

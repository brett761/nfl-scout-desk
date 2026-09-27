#!/usr/bin/env node
/**
 * 2026-09-27 lock compute site-parity fix.
 * Adds model_home_spread_corrected / edge_home_corrected / correction_note to Week 3 locks
 * WITHOUT touching frozen model_home_spread / edge_home. Corrected line = site B$ line
 * (ourHomeSpread from repo app.js via site_parity_harness.mjs): INCLUDE_FA=false,
 * INCLUDE_PFF_PRESEASON=false, currentRating incl. 2026 YTD take/give, N=3 taper, HFA 2,
 * injury seed data/injury-2026.json (2026-09-27a). Street = street_home_spread already in each lock.
 */
import fs from "fs"; import path from "path";
import { init } from "./site_parity_harness.mjs";
const DIR = path.join(path.dirname(new URL(import.meta.url).pathname), "postmortem/locks");
const SKIP = new Set(["2026-w03-atl-gb.json"]); // TNF final
const a = await init();
const inj = JSON.parse(fs.readFileSync(path.join(DIR, "../../injury-2026.json"), "utf8"));
const r2 = (x) => Math.round(x * 100) / 100;
const out = [];
for (const f of fs.readdirSync(DIR).filter((f) => /^2026-w03-[a-z]+-[a-z]+\.json$/.test(f)).sort()) {
  if (SKIP.has(f)) continue;
  const p = path.join(DIR, f); const lock = JSON.parse(fs.readFileSync(p, "utf8"));
  if (!lock.game_id) continue;
  const g = a.getNfl().games.find((x) => Number(x.week) === 3 && x.home === lock.home && x.away === lock.away);
  if (!g) { console.warn("no game", f); continue; }
  const model = r2(a.ourHomeSpread(g, 2));
  const street = lock.street_home_spread;
  const edge = street == null ? null : r2(street - model);
  lock.model_home_spread_corrected = model;
  lock.edge_home_corrected = edge;
  lock.correction_note = `Site-parity recompute 2026-09-27 (injury ${inj.pulled}): FA and PFF 2026 preseason removed from line per 2026-09-24 (PR #7/#9), YTD take/give in currentRating (PR #8), N=3 taper n=${a.taperFor(g.home).n}, HFA 2; = app.js B$ ourHomeSpread. Frozen model_home_spread/edge_home left untouched. eff ${lock.away} ${r2(a.eff(g.away))} / ${lock.home} ${r2(a.eff(g.home))}; edge = street ${street} − ${model}.`;
  fs.writeFileSync(p, JSON.stringify(lock, null, 2) + "\n");
  out.push({ game: lock.game_id, old: lock.model_home_spread, corrected: model, street, edge_old: lock.edge_home, edge_corrected: edge });
}
console.table(out);

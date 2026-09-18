# Injury valuation learning log — 2026

Track whether projected injury points improve margin error.

## 2026-W01 — 2026-09-15

**Games with injury stack at lock:** NE@SEA, DEN@KC (n=2).

### Findings
- **NE@SEA:** Injury net +0.18 (near wash). **Insufficient evidence.**
- **DEN@KC:** Injury net −1.24 (toward DEN). Layer used seed pulled **2026-09-09d** for Sep 14 kick.
  - Josh Simmons priced **QUESTIONABLE** (0.35×) but was **OUT** → underweighted LT miss.
  - R Mason Thomas priced **Q** but was **active** → overweighted.
  - Marvin Mims priced **Q** but no game designation → overweighted.
  - Chamarri Conner **OUT** missing from layer.
- Outcome: KC won by 21 without Simmons. Injury direction favored DEN; wrong vs margin. Dominant issue is **stale status**, not LT baseline size.

### Positional baselines
- **No `historical_adjustments` written.** Single-game (and process-contaminated) evidence only.
- LT / EDGE / WR2: **Insufficient evidence.**

### Process recommendations (not weight edits)
1. Refresh `injury-2026.json` same day before each lock freeze.
2. At freeze, reconcile Q/OUT/Doubtful to expected inactives; full OUT = 1.0× impact.
3. Log realized active/inactive in weekly `injury-valuation/weeks/` file (done for W01).

### What would confirm/falsify
- **Confirm Q over/under systematic:** ≥6 Q rows across weeks where priced status ≠ realized active/inactive and |injury pts| ≥0.4.
- **Confirm LT baseline cut:** ≥5 LT OUT games where replacement holds and model overstates injury pts vs market/margin.
- **Falsify freshness alarm:** Same-day pulls matching inactives for 4 straight weeks.

# NFL Scout YTD rankings — 2026 (same scale as 2025 O/D/ST/TAKE/GIVE)

Pulled: **Sep 24, 2026, 10:47 AM ET** · Scored games: **32** (W1 all 16 + W2 all 16).

## Scale (mirrors 2025 prior)

| Pillar | Output | Inputs | 2025 raw anchors | Weight in composite |
|---|---|---|---|---|
| Offense | −12…+12 | YTD PPG scored | 14.2…30.5 ppg | 38.75% |
| Defense | −12…+12 | YTD PPG allowed (invert) | 17.2…30.1 ppg | 38.75% |
| Special teams | −4…+4 | `2×ret TD + (FG%−85.53)/8` → 2025 comp endpoints | comp -1.766…7.384 | 2.5% |
| Takeaways | −5…+5 | YTD takeaways per game | 4…33 in 17 games | 7.5% |
| Giveaways | −5…+5 | YTD giveaways per game (fewer is better) | 11…30 in 17 games | 12.5% |

Composite = `(0.3875·off + 0.3875·def + 0.025·st + 0.075·take + 0.125·give) / 1`. Same weights as the 2025 prior. Take/give rates use the 2025 season totals divided by 17 as the per-game anchors. League even.

## Overall (by composite)

| # | Team | n | Off | Def | ST | TAKE | GIVE | Comp | Takes | Gives |
|---|------|--:|----:|----:|---:|-----:|-----:|-----:|------:|------:|
| 1 | SF | 2 | +12.00 | +12.00 | -4.00 | -0.52 | +5.00 | +9.79 | 2 | 1 |
| 2 | KC | 2 | +12.00 | +6.79 | -2.70 | +2.41 | +5.00 | +8.02 | 3 | 1 |
| 3 | CIN | 2 | +6.11 | +12.00 | -0.87 | +5.00 | +5.00 | +8.00 | 4 | 1 |
| 4 | LV | 2 | +6.11 | +12.00 | -0.87 | +5.00 | -2.63 | +7.04 | 5 | 3 |
| 5 | MIN | 2 | +2.43 | +12.00 | -0.87 | +5.00 | +5.00 | +6.57 | 4 | 1 |
| 6 | JAX | 2 | +1.69 | +12.00 | -3.06 | +2.41 | +5.00 | +6.04 | 3 | 1 |
| 7 | SEA | 2 | -0.52 | +12.00 | -0.87 | +5.00 | +5.00 | +5.43 | 4 | 1 |
| 8 | CHI | 2 | +12.00 | +1.21 | -4.00 | +2.41 | -2.63 | +4.87 | 3 | 3 |
| 9 | BAL | 2 | +9.79 | +0.28 | -3.61 | -0.52 | +1.84 | +4.00 | 2 | 2 |
| 10 | DAL | 2 | +9.06 | -0.65 | -0.87 | -0.52 | +5.00 | +3.82 | 2 | 1 |
| 11 | NYJ | 2 | -3.46 | +12.00 | -3.06 | -0.52 | +5.00 | +3.82 | 2 | 0 |
| 12 | PHI | 2 | +2.43 | +4.93 | -0.87 | -5.00 | +1.84 | +2.69 | 0 | 2 |
| 13 | NO | 2 | +6.85 | -0.65 | -3.06 | -0.52 | -2.63 | +1.96 | 2 | 3 |
| 14 | LAR | 2 | -7.14 | +12.00 | -4.00 | -0.52 | -5.00 | +1.12 | 2 | 4 |
| 15 | DET | 2 | +12.00 | -12.00 | -0.87 | +2.41 | +5.00 | +0.78 | 3 | 1 |
| 16 | BUF | 2 | +12.00 | -12.00 | -0.87 | -0.52 | +5.00 | +0.56 | 2 | 0 |
| 17 | CAR | 2 | +12.00 | -12.00 | -0.87 | +5.00 | -2.63 | +0.02 | 6 | 3 |
| 18 | PIT | 2 | -12.00 | +12.00 | -4.00 | +5.00 | -2.63 | -0.05 | 4 | 3 |
| 19 | NE | 2 | -10.82 | +12.00 | -3.61 | -0.52 | -5.00 | -0.30 | 2 | 5 |
| 20 | ARI | 2 | -8.61 | +2.14 | -3.06 | +2.41 | +5.00 | -1.78 | 3 | 1 |
| 21 | IND | 2 | +6.11 | -12.00 | -0.87 | -3.45 | -2.63 | -2.89 | 1 | 3 |
| 22 | NYG | 2 | -7.88 | -0.65 | -0.87 | +2.41 | +1.84 | -2.92 | 3 | 2 |
| 23 | DEN | 2 | -10.82 | +3.07 | -0.87 | -0.52 | -2.63 | -3.39 | 2 | 3 |
| 24 | TEN | 2 | -10.82 | +0.28 | -0.87 | -0.52 | +5.00 | -3.52 | 2 | 1 |
| 25 | TB | 2 | +0.96 | -8.09 | -0.87 | -3.45 | -5.00 | -3.67 | 1 | 5 |
| 26 | GB | 2 | -1.99 | -8.09 | -0.87 | -3.45 | -2.63 | -4.52 | 1 | 3 |
| 27 | WSH | 2 | -1.99 | -12.00 | -4.00 | -5.00 | +5.00 | -5.27 | 0 | 1 |
| 28 | CLE | 2 | -8.61 | -5.30 | -0.87 | -3.45 | +1.84 | -5.44 | 1 | 2 |
| 29 | HOU | 2 | -5.67 | -8.09 | -3.61 | -5.00 | +1.84 | -5.57 | 0 | 2 |
| 30 | LAC | 2 | -12.00 | -4.37 | -4.00 | -3.45 | -5.00 | -7.33 | 1 | 5 |
| 31 | ATL | 2 | -12.00 | -6.23 | -4.00 | -3.45 | -5.00 | -8.05 | 1 | 7 |
| 32 | MIA | 2 | -12.00 | -12.00 | -4.00 | -0.52 | +1.84 | -9.21 | 2 | 2 |

## Top / bottom overall

**Top 5:** SF +9.79, KC +8.02, CIN +8.00, LV +7.04, MIN +6.57

**Bottom 5:** MIA -9.21, ATL -8.05, LAC -7.33, HOU -5.57, CLE -5.44

## Offense

**Top 5:** BUF +12.00, CAR +12.00, CHI +12.00, DET +12.00, KC +12.00

**Bottom 5:** PIT -12.00, MIA -12.00, LAC -12.00, ATL -12.00, TEN -10.82

## Defense

**Top 5:** CIN +12.00, JAX +12.00, LAR +12.00, LV +12.00, MIN +12.00

**Bottom 5:** WSH -12.00, MIA -12.00, IND -12.00, DET -12.00, CAR -12.00

## Special teams

**Top 5:** BUF -0.87, CAR -0.87, CIN -0.87, CLE -0.87, DAL -0.87

**Bottom 5:** WSH -4.00, SF -4.00, PIT -4.00, MIA -4.00, LAR -4.00

## Takeaways

**Top 5:** CAR +5.00, CIN +5.00, LV +5.00, MIN +5.00, PIT +5.00

**Bottom 5:** WSH -5.00, PHI -5.00, HOU -5.00, TB -3.45, LAC -3.45

## Giveaways

**Top 5:** ARI +5.00, BUF +5.00, CIN +5.00, DAL +5.00, DET +5.00

**Bottom 5:** TB -5.00, NE -5.00, LAR -5.00, LAC -5.00, ATL -5.00

## Notes

- O/D PPG from `nfl-2026.json` scored finals. ST from `ytd-st-2026.json` (ESPN).
- Takeaways and giveaways from each scored final's ESPN summary. Giveaways = interceptions thrown + fumbles lost. Takeaways = the opponent's giveaways (defensive INTs + fumbles recovered).
- 0 FGA → FG% treated as 2025 league mean (neutral).
- Desk `currentRating` uses these five pillars (app.js), same weights as the 2025 prior.
- Files: `data/ytd-rankings-2026.json`, `data/ytd-rankings-2026.md`, `data/ytd-st-2026.json`, `data/_ytd-to-raw-2026.json`.


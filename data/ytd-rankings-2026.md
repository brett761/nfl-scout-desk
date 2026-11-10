# NFL Scout YTD rankings — 2026 (same scale as 2025 O/D/ST/TAKE/GIVE)

Pulled: **Nov 10, 2026, 11:19 AM ET** · Scored games: **136** (W1 all 16 + W2 all 16 + W3 all 16 + W4 all 16 + W5 all 15 + W6 all 14 + W7 all 14 + W8 all 14 + W9 all 15).

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
| 1 | JAX | 8 | +9.24 | +12.00 | -3.30 | +4.61 | +4.08 | +9.00 | 15 | 6 |
| 2 | SF | 8 | +10.34 | +7.72 | -4.00 | +2.41 | -1.51 | +6.89 | 12 | 11 |
| 3 | KC | 8 | +4.27 | +10.74 | -3.30 | +1.68 | +2.96 | +6.23 | 11 | 7 |
| 4 | CIN | 8 | +11.26 | +3.30 | -0.87 | +2.41 | -0.39 | +5.75 | 12 | 10 |
| 5 | BUF | 8 | +12.00 | +0.51 | -0.87 | +2.41 | -2.63 | +4.68 | 12 | 12 |
| 6 | PIT | 8 | +0.22 | +10.51 | -4.00 | +3.15 | +1.84 | +4.53 | 13 | 8 |
| 7 | CHI | 9 | +6.52 | +5.96 | -2.24 | +2.09 | -5.00 | +4.31 | 13 | 17 |
| 8 | SEA | 9 | +0.14 | +10.51 | -0.87 | +2.09 | -3.13 | +3.87 | 13 | 14 |
| 9 | DET | 8 | +7.95 | +0.05 | -0.87 | -0.52 | +5.00 | +3.66 | 8 | 5 |
| 10 | GB | 9 | +2.43 | +4.52 | -2.44 | +5.00 | -0.15 | +2.99 | 19 | 11 |
| 11 | LAR | 9 | +2.10 | +6.58 | -4.00 | +0.13 | -3.13 | +2.88 | 10 | 14 |
| 12 | TB | 9 | +0.14 | +7.20 | -0.87 | +5.00 | -3.13 | +2.81 | 21 | 14 |
| 13 | MIN | 8 | -6.04 | +12.00 | +0.87 | +3.15 | +1.84 | +2.80 | 13 | 8 |
| 14 | DEN | 9 | -0.52 | +5.55 | -4.00 | +1.44 | +3.83 | +2.44 | 12 | 7 |
| 15 | HOU | 8 | +5.56 | -0.65 | -2.24 | -0.52 | +5.00 | +2.43 | 8 | 4 |
| 16 | NYG | 8 | +0.59 | +4.00 | -0.87 | +0.95 | -2.63 | +1.50 | 10 | 12 |
| 17 | DAL | 9 | +7.34 | -4.79 | -3.85 | -1.17 | +1.84 | +1.04 | 8 | 9 |
| 18 | NE | 9 | +1.61 | +1.21 | -4.00 | -1.17 | -5.00 | +0.28 | 8 | 19 |
| 19 | WSH | 8 | -1.25 | -2.98 | -3.30 | +2.41 | +5.00 | -0.91 | 12 | 5 |
| 20 | CLE | 9 | -6.57 | +3.48 | -0.87 | +1.44 | -0.15 | -1.13 | 12 | 11 |
| 21 | CAR | 8 | +3.72 | -6.93 | -0.87 | +1.68 | -2.63 | -1.47 | 11 | 12 |
| 22 | NYJ | 9 | -3.13 | -2.10 | -2.24 | +0.13 | +3.83 | -1.59 | 10 | 7 |
| 23 | LV | 9 | +6.03 | -11.40 | -0.87 | +2.74 | -2.13 | -2.16 | 14 | 13 |
| 24 | ATL | 9 | -2.15 | -2.10 | -4.00 | +0.13 | -5.00 | -2.36 | 10 | 17 |
| 25 | NO | 8 | +1.14 | -6.23 | -4.00 | +0.22 | -5.00 | -2.68 | 9 | 15 |
| 26 | BAL | 9 | -1.99 | -4.79 | -3.61 | -0.52 | -0.15 | -2.77 | 9 | 11 |
| 27 | TEN | 8 | -6.40 | -2.28 | -3.06 | +1.68 | -2.63 | -3.64 | 11 | 12 |
| 28 | PHI | 9 | -8.70 | -1.68 | -0.87 | -3.12 | +1.84 | -4.05 | 5 | 9 |
| 29 | ARI | 9 | -3.79 | -8.71 | -2.09 | -1.17 | +2.84 | -4.63 | 8 | 8 |
| 30 | IND | 9 | -2.81 | -7.47 | -0.87 | -2.47 | -5.00 | -4.82 | 6 | 17 |
| 31 | MIA | 8 | -9.72 | -2.51 | -3.61 | -1.25 | -0.39 | -4.97 | 7 | 10 |
| 32 | LAC | 8 | -10.64 | -6.93 | -3.61 | +2.41 | -5.00 | -7.34 | 12 | 19 |

## Top / bottom overall

**Top 5:** JAX +9.00, SF +6.89, KC +6.23, CIN +5.75, BUF +4.68

**Bottom 5:** LAC -7.34, MIA -4.97, IND -4.82, ARI -4.63, PHI -4.05

## Offense

**Top 5:** BUF +12.00, CIN +11.26, SF +10.34, JAX +9.24, DET +7.95

**Bottom 5:** LAC -10.64, MIA -9.72, PHI -8.70, CLE -6.57, TEN -6.40

## Defense

**Top 5:** JAX +12.00, MIN +12.00, KC +10.74, PIT +10.51, SEA +10.51

**Bottom 5:** LV -11.40, ARI -8.71, IND -7.47, LAC -6.93, CAR -6.93

## Special teams

**Top 5:** MIN +0.87, BUF -0.87, CAR -0.87, CIN -0.87, CLE -0.87

**Bottom 5:** SF -4.00, PIT -4.00, NO -4.00, NE -4.00, LAR -4.00

## Takeaways

**Top 5:** GB +5.00, TB +5.00, JAX +4.61, MIN +3.15, PIT +3.15

**Bottom 5:** PHI -3.12, IND -2.47, MIA -1.25, NE -1.17, DAL -1.17

## Giveaways

**Top 5:** DET +5.00, HOU +5.00, WSH +5.00, JAX +4.08, DEN +3.83

**Bottom 5:** NO -5.00, NE -5.00, LAC -5.00, IND -5.00, CHI -5.00

## Notes

- O/D PPG from `nfl-2026.json` scored finals. ST from `ytd-st-2026.json` (ESPN).
- Takeaways and giveaways from each scored final's ESPN summary. Giveaways = interceptions thrown + fumbles lost. Takeaways = the opponent's giveaways (defensive INTs + fumbles recovered).
- 0 FGA → FG% treated as 2025 league mean (neutral).
- Desk `currentRating` uses these five pillars (app.js), same weights as the 2025 prior.
- Files: `data/ytd-rankings-2026.json`, `data/ytd-rankings-2026.md`, `data/ytd-st-2026.json`, `data/_ytd-to-raw-2026.json`.


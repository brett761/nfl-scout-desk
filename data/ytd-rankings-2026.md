# NFL Scout YTD rankings — 2026 (same scale as 2025 O/D/ST/TAKE/GIVE)

Pulled: **Nov 24, 2026, 11:28 AM ET** · Scored games: **163** (W1 all 16 + W2 all 16 + W3 all 16 + W4 all 16 + W5 all 15 + W6 all 14 + W7 all 14 + W8 all 14 + W9 all 15 + W10 all 14 + W11 all 13).

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
| 1 | JAX | 10 | +9.35 | +12.00 | -3.30 | +3.59 | +2.74 | +8.80 | 17 | 9 |
| 2 | KC | 10 | +6.99 | +12.00 | -3.30 | +1.24 | +4.53 | +7.94 | 13 | 7 |
| 3 | SF | 10 | +12.00 | +5.67 | -4.00 | +3.00 | +0.95 | +7.09 | 16 | 11 |
| 4 | BUF | 10 | +12.00 | +5.30 | -0.87 | +2.41 | -3.53 | +6.42 | 15 | 16 |
| 5 | CIN | 10 | +10.97 | +4.00 | -0.87 | +0.66 | +1.84 | +6.06 | 12 | 10 |
| 6 | DET | 10 | +9.50 | +3.07 | -0.87 | -1.10 | +4.53 | +5.33 | 9 | 7 |
| 7 | LAR | 10 | +3.61 | +9.21 | -4.00 | +0.66 | -2.63 | +4.59 | 12 | 15 |
| 8 | CHI | 10 | +5.67 | +7.35 | -2.24 | +2.41 | -5.00 | +4.54 | 15 | 19 |
| 9 | SEA | 10 | -0.07 | +11.44 | -0.87 | +1.24 | -3.53 | +4.04 | 13 | 16 |
| 10 | HOU | 10 | +5.23 | +2.70 | -2.24 | -0.52 | +5.00 | +3.60 | 10 | 6 |
| 11 | DEN | 10 | +1.84 | +4.93 | -4.00 | +1.24 | +3.63 | +3.07 | 13 | 8 |
| 12 | MIN | 10 | -5.52 | +12.00 | +0.87 | +3.59 | +0.95 | +2.92 | 17 | 11 |
| 13 | PIT | 10 | -1.40 | +6.60 | -4.00 | +1.83 | +3.63 | +2.51 | 14 | 8 |
| 14 | TB | 10 | -0.07 | +5.12 | -0.87 | +5.00 | -1.74 | +2.09 | 21 | 14 |
| 15 | NYG | 10 | +0.37 | +4.19 | -0.87 | +1.83 | -2.63 | +1.55 | 14 | 15 |
| 16 | DAL | 11 | +12.00 | -8.77 | -3.85 | -1.58 | +1.84 | +1.27 | 9 | 11 |
| 17 | GB | 10 | +0.37 | +2.88 | -2.44 | +5.00 | -2.63 | +1.25 | 20 | 15 |
| 18 | WSH | 10 | -0.81 | -1.21 | -3.30 | +1.83 | +4.53 | -0.16 | 14 | 7 |
| 19 | CAR | 10 | +4.49 | -6.05 | -0.87 | +3.59 | -0.84 | -0.46 | 17 | 13 |
| 20 | CLE | 10 | -5.23 | +3.07 | -0.87 | +1.24 | +0.05 | -0.76 | 13 | 12 |
| 21 | NE | 10 | -0.37 | -1.02 | -4.00 | -0.52 | -5.00 | -1.30 | 10 | 20 |
| 22 | NYJ | 11 | -3.33 | -3.02 | -2.24 | +0.02 | +3.47 | -2.08 | 12 | 9 |
| 23 | NO | 10 | -1.25 | -3.81 | -4.00 | +0.07 | -5.00 | -2.68 | 11 | 19 |
| 24 | LV | 11 | +3.90 | -11.31 | -0.87 | +2.68 | -0.60 | -2.76 | 17 | 14 |
| 25 | BAL | 11 | -0.52 | -5.73 | -3.61 | -1.05 | -3.04 | -2.97 | 10 | 17 |
| 26 | PHI | 10 | -8.32 | -0.09 | -0.87 | -3.45 | +1.84 | -3.31 | 5 | 10 |
| 27 | ATL | 10 | -3.31 | -4.00 | -4.00 | -0.52 | -5.00 | -3.60 | 10 | 19 |
| 28 | MIA | 10 | -9.79 | -2.51 | -3.61 | +0.07 | +0.05 | -4.85 | 11 | 12 |
| 29 | IND | 11 | -4.66 | -6.23 | -0.87 | -2.12 | -5.00 | -5.03 | 8 | 20 |
| 30 | TEN | 10 | -3.90 | -9.95 | -3.06 | +0.66 | -1.74 | -5.61 | 12 | 14 |
| 31 | LAC | 10 | -8.17 | -5.49 | -3.61 | +1.83 | -5.00 | -5.87 | 14 | 19 |
| 32 | ARI | 11 | -7.34 | -10.63 | -2.09 | -1.58 | +2.66 | -6.80 | 9 | 10 |

## Top / bottom overall

**Top 5:** JAX +8.80, KC +7.94, SF +7.09, BUF +6.42, CIN +6.06

**Bottom 5:** ARI -6.80, LAC -5.87, TEN -5.61, IND -5.03, MIA -4.85

## Offense

**Top 5:** BUF +12.00, DAL +12.00, SF +12.00, CIN +10.97, DET +9.50

**Bottom 5:** MIA -9.79, PHI -8.32, LAC -8.17, ARI -7.34, MIN -5.52

## Defense

**Top 5:** JAX +12.00, KC +12.00, MIN +12.00, SEA +11.44, LAR +9.21

**Bottom 5:** LV -11.31, ARI -10.63, TEN -9.95, DAL -8.77, IND -6.23

## Special teams

**Top 5:** MIN +0.87, BUF -0.87, CAR -0.87, CIN -0.87, CLE -0.87

**Bottom 5:** SF -4.00, PIT -4.00, NO -4.00, NE -4.00, LAR -4.00

## Takeaways

**Top 5:** GB +5.00, TB +5.00, CAR +3.59, JAX +3.59, MIN +3.59

**Bottom 5:** PHI -3.45, IND -2.12, DAL -1.58, ARI -1.58, DET -1.10

## Giveaways

**Top 5:** HOU +5.00, DET +4.53, KC +4.53, WSH +4.53, DEN +3.63

**Bottom 5:** NO -5.00, NE -5.00, LAC -5.00, IND -5.00, CHI -5.00

## Notes

- O/D PPG from `nfl-2026.json` scored finals. ST from `ytd-st-2026.json` (ESPN).
- Takeaways and giveaways from each scored final's ESPN summary. Giveaways = interceptions thrown + fumbles lost. Takeaways = the opponent's giveaways (defensive INTs + fumbles recovered).
- 0 FGA → FG% treated as 2025 league mean (neutral).
- Desk `currentRating` uses these five pillars (app.js), same weights as the 2025 prior.
- Files: `data/ytd-rankings-2026.json`, `data/ytd-rankings-2026.md`, `data/ytd-st-2026.json`, `data/_ytd-to-raw-2026.json`.


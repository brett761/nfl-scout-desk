# NFL Scout YTD rankings — 2026 (same scale as 2025 O/D/ST/TAKE/GIVE)

Pulled: **Nov 17, 2026, 11:23 AM ET** · Scored games: **150** (W1 all 16 + W2 all 16 + W3 all 16 + W4 all 16 + W5 all 15 + W6 all 14 + W7 all 14 + W8 all 14 + W9 all 15 + W10 all 14).

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
| 1 | JAX | 9 | +11.10 | +12.00 | -3.30 | +4.04 | +3.83 | +9.65 | 16 | 7 |
| 2 | KC | 9 | +5.87 | +11.75 | -3.30 | +2.09 | +3.83 | +7.38 | 13 | 7 |
| 3 | CIN | 9 | +12.00 | +4.10 | -0.87 | +1.44 | +0.85 | +6.43 | 12 | 10 |
| 4 | SF | 9 | +12.00 | +3.48 | -4.00 | +2.74 | -0.15 | +6.09 | 14 | 11 |
| 5 | BUF | 9 | +12.00 | +2.86 | -0.87 | +2.74 | -3.13 | +5.55 | 14 | 14 |
| 6 | DET | 9 | +9.14 | +2.86 | -0.87 | -0.52 | +3.83 | +5.07 | 9 | 7 |
| 7 | LAR | 10 | +3.61 | +9.21 | -4.00 | +0.66 | -2.63 | +4.59 | 12 | 15 |
| 8 | CHI | 9 | +6.52 | +5.96 | -2.24 | +2.09 | -5.00 | +4.31 | 13 | 17 |
| 9 | SEA | 10 | -0.07 | +11.44 | -0.87 | +1.24 | -3.53 | +4.04 | 13 | 16 |
| 10 | MIN | 9 | -4.11 | +12.00 | +0.87 | +4.69 | +1.84 | +3.66 | 17 | 9 |
| 11 | TB | 9 | +0.14 | +7.20 | -0.87 | +5.00 | -3.13 | +2.81 | 21 | 14 |
| 12 | PIT | 9 | -0.52 | +6.38 | -4.00 | +2.09 | +2.84 | +2.68 | 13 | 8 |
| 13 | DEN | 9 | -0.52 | +5.55 | -4.00 | +1.44 | +3.83 | +2.44 | 12 | 7 |
| 14 | HOU | 9 | +5.21 | -1.27 | -2.24 | -0.52 | +5.00 | +2.06 | 9 | 5 |
| 15 | GB | 10 | +0.37 | +2.88 | -2.44 | +5.00 | -2.63 | +1.25 | 20 | 15 |
| 16 | NYG | 9 | +0.30 | +3.48 | -0.87 | +1.44 | -3.13 | +1.16 | 12 | 14 |
| 17 | DAL | 10 | +9.20 | -8.47 | -3.85 | -1.69 | +0.95 | +0.18 | 8 | 11 |
| 18 | WSH | 9 | -0.84 | -2.10 | -3.30 | +2.74 | +3.83 | -0.54 | 14 | 7 |
| 19 | CAR | 9 | +2.92 | -4.79 | -0.87 | +2.09 | -1.14 | -0.73 | 13 | 12 |
| 20 | CLE | 10 | -5.23 | +3.07 | -0.87 | +1.24 | +0.05 | -0.76 | 13 | 12 |
| 21 | NE | 10 | -0.37 | -1.02 | -4.00 | -0.52 | -5.00 | -1.30 | 10 | 20 |
| 22 | LV | 10 | +4.05 | -9.77 | -0.87 | +3.00 | -0.84 | -2.12 | 16 | 13 |
| 23 | NO | 9 | +0.14 | -4.79 | -4.00 | -0.52 | -5.00 | -2.56 | 9 | 17 |
| 24 | NYJ | 10 | -4.34 | -3.26 | -2.24 | +0.66 | +2.74 | -2.61 | 12 | 9 |
| 25 | BAL | 10 | -2.13 | -4.19 | -3.61 | -1.10 | -0.84 | -2.73 | 9 | 13 |
| 26 | ATL | 10 | -3.31 | -4.00 | -4.00 | -0.52 | -5.00 | -3.60 | 10 | 19 |
| 27 | PHI | 9 | -8.70 | -1.68 | -0.87 | -3.12 | +1.84 | -4.05 | 5 | 9 |
| 28 | IND | 10 | -2.28 | -6.42 | -0.87 | -2.28 | -5.00 | -4.19 | 7 | 19 |
| 29 | MIA | 9 | -8.70 | -2.30 | -3.61 | -0.52 | -0.15 | -4.41 | 9 | 11 |
| 30 | TEN | 9 | -5.59 | -5.41 | -3.06 | +1.44 | -2.13 | -4.50 | 12 | 13 |
| 31 | ARI | 10 | -5.82 | -9.77 | -2.09 | -1.10 | +1.84 | -5.94 | 9 | 10 |
| 32 | LAC | 9 | -9.35 | -5.41 | -3.61 | +2.74 | -5.00 | -6.23 | 14 | 19 |

## Top / bottom overall

**Top 5:** JAX +9.65, KC +7.38, CIN +6.43, SF +6.09, BUF +5.55

**Bottom 5:** LAC -6.23, ARI -5.94, TEN -4.50, MIA -4.41, IND -4.19

## Offense

**Top 5:** BUF +12.00, CIN +12.00, SF +12.00, JAX +11.10, DAL +9.20

**Bottom 5:** LAC -9.35, PHI -8.70, MIA -8.70, ARI -5.82, TEN -5.59

## Defense

**Top 5:** JAX +12.00, MIN +12.00, KC +11.75, SEA +11.44, LAR +9.21

**Bottom 5:** LV -9.77, ARI -9.77, DAL -8.47, IND -6.42, TEN -5.41

## Special teams

**Top 5:** MIN +0.87, BUF -0.87, CAR -0.87, CIN -0.87, CLE -0.87

**Bottom 5:** SF -4.00, PIT -4.00, NO -4.00, NE -4.00, LAR -4.00

## Takeaways

**Top 5:** GB +5.00, TB +5.00, MIN +4.69, JAX +4.04, LV +3.00

**Bottom 5:** PHI -3.12, IND -2.28, DAL -1.69, BAL -1.10, ARI -1.10

## Giveaways

**Top 5:** HOU +5.00, DEN +3.83, DET +3.83, JAX +3.83, KC +3.83

**Bottom 5:** NO -5.00, NE -5.00, LAC -5.00, IND -5.00, CHI -5.00

## Notes

- O/D PPG from `nfl-2026.json` scored finals. ST from `ytd-st-2026.json` (ESPN).
- Takeaways and giveaways from each scored final's ESPN summary. Giveaways = interceptions thrown + fumbles lost. Takeaways = the opponent's giveaways (defensive INTs + fumbles recovered).
- 0 FGA → FG% treated as 2025 league mean (neutral).
- Desk `currentRating` uses these five pillars (app.js), same weights as the 2025 prior.
- Files: `data/ytd-rankings-2026.json`, `data/ytd-rankings-2026.md`, `data/ytd-st-2026.json`, `data/_ytd-to-raw-2026.json`.


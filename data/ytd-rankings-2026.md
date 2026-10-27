# NFL Scout YTD rankings — 2026 (same scale as 2025 O/D/ST/TAKE/GIVE)

Pulled: **Oct 27, 2026, 11:26 AM ET** · Scored games: **107** (W1 all 16 + W2 all 16 + W3 all 16 + W4 all 16 + W5 all 15 + W6 all 14 + W7 all 14).

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
| 1 | JAX | 6 | +4.88 | +11.75 | -3.30 | +2.41 | +4.82 | +7.15 | 9 | 4 |
| 2 | KC | 6 | +2.18 | +12.00 | -3.30 | +3.39 | +3.33 | +6.08 | 10 | 5 |
| 3 | SF | 7 | +8.53 | +7.06 | -4.00 | -0.52 | -1.99 | +5.65 | 7 | 10 |
| 4 | CIN | 6 | +7.09 | +6.17 | -0.87 | +2.41 | +1.84 | +5.53 | 9 | 6 |
| 5 | SEA | 7 | +2.43 | +10.78 | -0.87 | +3.67 | -5.00 | +4.75 | 12 | 13 |
| 6 | MIN | 6 | -2.23 | +12.00 | +0.87 | +4.37 | +4.82 | +4.74 | 11 | 4 |
| 7 | CHI | 7 | +4.95 | +5.99 | -2.24 | +2.00 | -3.27 | +3.93 | 10 | 11 |
| 8 | PIT | 7 | -0.73 | +7.32 | -4.00 | +2.83 | +1.84 | +2.90 | 11 | 7 |
| 9 | DET | 6 | +12.00 | -7.16 | -0.87 | -0.52 | +5.00 | +2.44 | 6 | 3 |
| 10 | DEN | 7 | -2.62 | +6.52 | -4.00 | +2.00 | +3.12 | +1.95 | 10 | 6 |
| 11 | NE | 7 | +0.75 | +5.99 | -4.00 | -0.52 | -5.00 | +1.85 | 7 | 14 |
| 12 | TB | 7 | +1.17 | +3.87 | -0.87 | +3.67 | -3.27 | +1.80 | 12 | 11 |
| 13 | GB | 7 | -2.62 | +5.46 | -2.44 | +4.51 | +0.56 | +1.45 | 13 | 8 |
| 14 | BAL | 7 | +2.64 | -0.39 | -3.61 | -1.35 | +4.40 | +1.23 | 6 | 5 |
| 15 | LAR | 7 | +2.85 | +1.74 | -4.00 | -1.35 | -3.27 | +1.17 | 6 | 11 |
| 16 | DAL | 7 | +6.85 | -3.84 | -3.85 | -3.03 | +1.84 | +1.07 | 4 | 7 |
| 17 | BUF | 6 | +12.00 | -9.02 | -0.87 | -0.52 | -2.63 | +0.76 | 6 | 9 |
| 18 | HOU | 7 | +1.80 | -1.18 | -2.24 | -1.35 | +5.00 | +0.71 | 6 | 3 |
| 19 | NYG | 7 | +1.38 | +1.21 | -0.87 | +1.16 | -3.27 | +0.66 | 9 | 11 |
| 20 | NYJ | 7 | -4.09 | +4.13 | -2.24 | +0.32 | +4.40 | +0.53 | 8 | 5 |
| 21 | CLE | 7 | -4.93 | +5.20 | -0.87 | +1.16 | -0.71 | +0.08 | 9 | 9 |
| 22 | ATL | 7 | +3.06 | -1.98 | -4.00 | +1.16 | -4.55 | -0.16 | 9 | 12 |
| 23 | CAR | 6 | +6.11 | -7.47 | -0.87 | +0.46 | -1.14 | -0.66 | 7 | 8 |
| 24 | LV | 7 | +5.58 | -8.36 | -0.87 | +3.67 | +0.56 | -0.75 | 12 | 8 |
| 25 | IND | 7 | -0.52 | -3.84 | -0.87 | -3.87 | -4.55 | -2.57 | 3 | 12 |
| 26 | NO | 7 | +1.17 | -7.56 | -4.00 | +1.16 | -5.00 | -3.12 | 9 | 13 |
| 27 | WSH | 6 | -0.52 | -9.33 | -3.30 | +1.44 | +5.00 | -3.17 | 8 | 2 |
| 28 | PHI | 7 | -6.19 | -2.51 | -0.87 | -3.87 | +3.12 | -3.30 | 3 | 6 |
| 29 | TEN | 7 | -10.19 | +2.54 | -3.06 | -0.52 | -1.99 | -3.33 | 7 | 10 |
| 30 | ARI | 7 | -3.04 | -11.28 | -2.09 | +0.32 | +3.12 | -5.19 | 8 | 6 |
| 31 | MIA | 6 | -8.86 | -4.68 | -3.61 | -1.49 | -1.14 | -5.59 | 5 | 8 |
| 32 | LAC | 6 | -10.82 | -2.82 | -3.61 | +3.39 | -5.00 | -5.75 | 10 | 15 |

## Top / bottom overall

**Top 5:** JAX +7.15, KC +6.08, SF +5.65, CIN +5.53, SEA +4.75

**Bottom 5:** LAC -5.75, MIA -5.59, ARI -5.19, TEN -3.33, PHI -3.30

## Offense

**Top 5:** BUF +12.00, DET +12.00, SF +8.53, CIN +7.09, DAL +6.85

**Bottom 5:** LAC -10.82, TEN -10.19, MIA -8.86, PHI -6.19, CLE -4.93

## Defense

**Top 5:** KC +12.00, MIN +12.00, JAX +11.75, SEA +10.78, PIT +7.32

**Bottom 5:** ARI -11.28, WSH -9.33, BUF -9.02, LV -8.36, NO -7.56

## Special teams

**Top 5:** MIN +0.87, BUF -0.87, CAR -0.87, CIN -0.87, CLE -0.87

**Bottom 5:** SF -4.00, PIT -4.00, NO -4.00, NE -4.00, LAR -4.00

## Takeaways

**Top 5:** GB +4.51, MIN +4.37, LV +3.67, SEA +3.67, TB +3.67

**Bottom 5:** PHI -3.87, IND -3.87, DAL -3.03, MIA -1.49, LAR -1.35

## Giveaways

**Top 5:** DET +5.00, HOU +5.00, WSH +5.00, JAX +4.82, MIN +4.82

**Bottom 5:** SEA -5.00, NO -5.00, NE -5.00, LAC -5.00, IND -4.55

## Notes

- O/D PPG from `nfl-2026.json` scored finals. ST from `ytd-st-2026.json` (ESPN).
- Takeaways and giveaways from each scored final's ESPN summary. Giveaways = interceptions thrown + fumbles lost. Takeaways = the opponent's giveaways (defensive INTs + fumbles recovered).
- 0 FGA → FG% treated as 2025 league mean (neutral).
- Desk `currentRating` uses these five pillars (app.js), same weights as the 2025 prior.
- Files: `data/ytd-rankings-2026.json`, `data/ytd-rankings-2026.md`, `data/ytd-st-2026.json`, `data/_ytd-to-raw-2026.json`.


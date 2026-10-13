# NFL Scout YTD rankings — 2026 (same scale as 2025 O/D/ST/TAKE/GIVE)

Pulled: **Oct 13, 2026, 11:32 AM ET** · Scored games: **79** (W1 all 16 + W2 all 16 + W3 all 16 + W4 all 16 + W5 all 15).

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
| 1 | SF | 5 | +12.00 | +9.40 | -4.00 | +1.83 | +1.84 | +8.56 | 7 | 5 |
| 2 | KC | 4 | +10.53 | +8.19 | -3.30 | +3.88 | +5.00 | +8.08 | 7 | 2 |
| 3 | JAX | 5 | +3.31 | +12.00 | -3.30 | +3.00 | +5.00 | +6.70 | 8 | 3 |
| 4 | MIN | 5 | -0.81 | +12.00 | +0.87 | +5.00 | +3.63 | +5.19 | 10 | 4 |
| 5 | BAL | 5 | +10.09 | -0.28 | -3.61 | +0.66 | +5.00 | +4.38 | 6 | 3 |
| 6 | SEA | 5 | +6.55 | +4.93 | -0.87 | +5.00 | -5.00 | +4.18 | 11 | 9 |
| 7 | CHI | 5 | +2.13 | +8.28 | -2.24 | +0.66 | -5.00 | +3.40 | 6 | 10 |
| 8 | CIN | 5 | +4.79 | +3.44 | -0.87 | +3.00 | +0.05 | +3.40 | 8 | 6 |
| 9 | NE | 5 | -0.52 | +9.02 | -4.00 | +0.66 | -5.00 | +2.62 | 6 | 11 |
| 10 | CAR | 4 | +11.63 | -6.70 | -0.87 | +3.88 | +1.84 | +2.41 | 7 | 4 |
| 11 | NYJ | 5 | -5.52 | +8.28 | -2.24 | +0.66 | +5.00 | +1.69 | 6 | 3 |
| 12 | NYG | 5 | -0.81 | +4.56 | -0.87 | +3.00 | -1.74 | +1.44 | 8 | 7 |
| 13 | PIT | 5 | -0.22 | +3.44 | -4.00 | +3.00 | +0.05 | +1.38 | 8 | 6 |
| 14 | HOU | 5 | -0.52 | +2.33 | -2.24 | -0.52 | +5.00 | +1.23 | 5 | 2 |
| 15 | DET | 5 | +12.00 | -11.07 | -0.87 | -0.52 | +5.00 | +0.92 | 5 | 1 |
| 16 | LV | 5 | +5.96 | -4.00 | -0.87 | +5.00 | -1.74 | +0.90 | 10 | 7 |
| 17 | BUF | 5 | +12.00 | -8.47 | -0.87 | -0.52 | -5.00 | +0.68 | 5 | 9 |
| 18 | GB | 5 | -2.28 | +2.33 | -2.44 | +4.17 | +0.05 | +0.28 | 9 | 6 |
| 19 | DAL | 5 | +7.73 | -6.60 | -3.85 | -4.03 | +1.84 | +0.27 | 2 | 5 |
| 20 | LAR | 5 | +2.13 | -0.65 | -4.00 | -0.52 | -3.53 | +0.00 | 5 | 8 |
| 21 | ATL | 5 | +2.13 | -1.40 | -4.00 | -1.69 | -5.00 | -0.57 | 4 | 9 |
| 22 | DEN | 5 | -4.34 | +2.70 | -4.00 | +1.83 | +0.05 | -0.59 | 7 | 6 |
| 23 | TB | 5 | -3.46 | +2.33 | -0.87 | +1.83 | -5.00 | -0.95 | 7 | 9 |
| 24 | PHI | 5 | -5.82 | +2.33 | -0.87 | -2.86 | +1.84 | -1.36 | 3 | 5 |
| 25 | CLE | 5 | -5.52 | +2.33 | -0.87 | +0.66 | -1.74 | -1.43 | 6 | 7 |
| 26 | IND | 5 | +3.61 | -7.35 | -0.87 | -4.03 | -3.53 | -2.22 | 2 | 8 |
| 27 | WSH | 5 | +0.96 | -11.44 | -3.30 | +1.83 | +5.00 | -3.38 | 7 | 2 |
| 28 | TEN | 5 | -12.00 | +3.44 | -3.06 | -4.03 | -1.74 | -3.91 | 2 | 7 |
| 29 | NO | 5 | +1.84 | -12.00 | -4.00 | -0.52 | -5.00 | -4.70 | 5 | 11 |
| 30 | ARI | 5 | -1.10 | -12.00 | -2.09 | +1.83 | +1.84 | -4.76 | 7 | 5 |
| 31 | LAC | 5 | -8.17 | -4.00 | -3.61 | +3.00 | -5.00 | -5.21 | 8 | 13 |
| 32 | MIA | 5 | -12.00 | -5.12 | -3.61 | -1.69 | -3.53 | -7.29 | 4 | 8 |

## Top / bottom overall

**Top 5:** SF +8.56, KC +8.08, JAX +6.70, MIN +5.19, BAL +4.38

**Bottom 5:** MIA -7.29, LAC -5.21, ARI -4.76, NO -4.70, TEN -3.91

## Offense

**Top 5:** BUF +12.00, DET +12.00, SF +12.00, CAR +11.63, KC +10.53

**Bottom 5:** TEN -12.00, MIA -12.00, LAC -8.17, PHI -5.82, NYJ -5.52

## Defense

**Top 5:** JAX +12.00, MIN +12.00, SF +9.40, NE +9.02, CHI +8.28

**Bottom 5:** NO -12.00, ARI -12.00, WSH -11.44, DET -11.07, BUF -8.47

## Special teams

**Top 5:** MIN +0.87, BUF -0.87, CAR -0.87, CIN -0.87, CLE -0.87

**Bottom 5:** SF -4.00, PIT -4.00, NO -4.00, NE -4.00, LAR -4.00

## Takeaways

**Top 5:** LV +5.00, MIN +5.00, SEA +5.00, GB +4.17, CAR +3.88

**Bottom 5:** TEN -4.03, IND -4.03, DAL -4.03, PHI -2.86, MIA -1.69

## Giveaways

**Top 5:** BAL +5.00, DET +5.00, HOU +5.00, JAX +5.00, KC +5.00

**Bottom 5:** TB -5.00, SEA -5.00, NO -5.00, NE -5.00, LAC -5.00

## Notes

- O/D PPG from `nfl-2026.json` scored finals. ST from `ytd-st-2026.json` (ESPN).
- Takeaways and giveaways from each scored final's ESPN summary. Giveaways = interceptions thrown + fumbles lost. Takeaways = the opponent's giveaways (defensive INTs + fumbles recovered).
- 0 FGA → FG% treated as 2025 league mean (neutral).
- Desk `currentRating` uses these five pillars (app.js), same weights as the 2025 prior.
- Files: `data/ytd-rankings-2026.json`, `data/ytd-rankings-2026.md`, `data/ytd-st-2026.json`, `data/_ytd-to-raw-2026.json`.


# NFL Scout YTD rankings — 2026 (same scale as 2025 O/D/ST/TAKE/GIVE)

Pulled: **Sep 29, 2026, 10:01 AM ET** · Scored games: **48** (W1 all 16 + W2 all 16 + W3 all 16).

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
| 1 | SF | 3 | +12.00 | +12.00 | -3.61 | -2.47 | +4.82 | +9.63 | 2 | 2 |
| 2 | KC | 3 | +10.28 | +12.00 | -3.61 | +3.39 | +4.82 | +9.40 | 5 | 2 |
| 3 | CHI | 3 | +10.77 | +11.13 | -3.06 | +5.00 | +1.84 | +9.02 | 6 | 3 |
| 4 | JAX | 3 | +7.34 | +12.00 | -4.00 | +5.00 | +4.82 | +8.37 | 6 | 2 |
| 5 | LV | 3 | +10.28 | +10.51 | -0.87 | +5.00 | -1.14 | +8.27 | 9 | 4 |
| 6 | MIN | 3 | +1.94 | +12.00 | +0.87 | +5.00 | +4.82 | +6.40 | 6 | 2 |
| 7 | SEA | 3 | +3.90 | +12.00 | -0.87 | +1.44 | -1.14 | +6.11 | 4 | 4 |
| 8 | CIN | 3 | +6.36 | +4.93 | -0.87 | +3.39 | +1.84 | +4.84 | 5 | 3 |
| 9 | BAL | 3 | +12.00 | -4.37 | -2.70 | -0.52 | +4.82 | +3.45 | 3 | 2 |
| 10 | BUF | 3 | +12.00 | -4.37 | -0.87 | -0.52 | -4.12 | +2.38 | 3 | 5 |
| 11 | NYJ | 3 | -1.50 | +6.17 | -2.70 | -2.47 | +5.00 | +2.18 | 2 | 1 |
| 12 | DAL | 3 | +10.28 | -6.85 | -2.44 | -2.47 | +4.82 | +1.69 | 2 | 2 |
| 13 | CAR | 3 | +10.77 | -7.47 | -0.87 | +5.00 | -1.14 | +1.49 | 7 | 4 |
| 14 | DET | 3 | +12.00 | -12.00 | -0.87 | +1.44 | +5.00 | +0.71 | 4 | 1 |
| 15 | NYG | 3 | -10.33 | +9.89 | -0.87 | +3.39 | +4.82 | +0.67 | 5 | 2 |
| 16 | PIT | 3 | -6.90 | +6.79 | -3.61 | +5.00 | -1.14 | +0.10 | 6 | 4 |
| 17 | LAR | 3 | -2.97 | +4.93 | -3.06 | -0.52 | -5.00 | +0.02 | 3 | 6 |
| 18 | NE | 3 | -12.00 | +12.00 | -4.00 | -0.52 | -5.00 | -0.76 | 3 | 8 |
| 19 | NO | 3 | +6.85 | -7.47 | -3.06 | -0.52 | -5.00 | -0.98 | 3 | 7 |
| 20 | DEN | 3 | -3.46 | +0.59 | -3.61 | +1.44 | -1.14 | -1.24 | 4 | 4 |
| 21 | TEN | 3 | -12.00 | +7.41 | -3.61 | -2.47 | +1.84 | -1.82 | 2 | 3 |
| 22 | CLE | 3 | -6.40 | -0.03 | -0.87 | -2.47 | +1.84 | -2.47 | 2 | 3 |
| 23 | ARI | 3 | -1.99 | -6.23 | -2.24 | +1.44 | +5.00 | -2.51 | 4 | 1 |
| 24 | WSH | 3 | +3.90 | -12.00 | -4.00 | -0.52 | +5.00 | -2.65 | 3 | 1 |
| 25 | PHI | 3 | -5.91 | +1.21 | -0.87 | -5.00 | -4.12 | -2.74 | 0 | 5 |
| 26 | HOU | 3 | -6.40 | -2.51 | -3.06 | -0.52 | +4.82 | -2.97 | 3 | 2 |
| 27 | ATL | 3 | -7.88 | +1.83 | -4.00 | -2.47 | -5.00 | -3.25 | 2 | 8 |
| 28 | TB | 3 | -2.48 | -4.99 | -0.87 | -2.47 | -5.00 | -3.73 | 2 | 7 |
| 29 | IND | 3 | +2.43 | -12.00 | -0.87 | -4.43 | -5.00 | -4.69 | 1 | 6 |
| 30 | LAC | 3 | -11.31 | -3.13 | -4.00 | +5.00 | -5.00 | -5.95 | 6 | 6 |
| 31 | GB | 3 | -5.42 | -12.00 | -2.70 | -2.47 | -1.14 | -7.15 | 2 | 4 |
| 32 | MIA | 3 | -12.00 | -9.33 | -4.00 | -0.52 | -1.14 | -8.55 | 3 | 4 |

## Top / bottom overall

**Top 5:** SF +9.63, KC +9.40, CHI +9.02, JAX +8.37, LV +8.27

**Bottom 5:** MIA -8.55, GB -7.15, LAC -5.95, IND -4.69, TB -3.73

## Offense

**Top 5:** BAL +12.00, BUF +12.00, DET +12.00, SF +12.00, CAR +10.77

**Bottom 5:** TEN -12.00, NE -12.00, MIA -12.00, LAC -11.31, NYG -10.33

## Defense

**Top 5:** JAX +12.00, KC +12.00, MIN +12.00, NE +12.00, SEA +12.00

**Bottom 5:** WSH -12.00, IND -12.00, GB -12.00, DET -12.00, MIA -9.33

## Special teams

**Top 5:** MIN +0.87, BUF -0.87, CAR -0.87, CIN -0.87, CLE -0.87

**Bottom 5:** WSH -4.00, NE -4.00, MIA -4.00, LAC -4.00, JAX -4.00

## Takeaways

**Top 5:** CAR +5.00, CHI +5.00, JAX +5.00, LAC +5.00, LV +5.00

**Bottom 5:** PHI -5.00, IND -4.43, TEN -2.47, TB -2.47, SF -2.47

## Giveaways

**Top 5:** ARI +5.00, DET +5.00, NYJ +5.00, WSH +5.00, BAL +4.82

**Bottom 5:** TB -5.00, NO -5.00, NE -5.00, LAR -5.00, LAC -5.00

## Notes

- O/D PPG from `nfl-2026.json` scored finals. ST from `ytd-st-2026.json` (ESPN).
- Takeaways and giveaways from each scored final's ESPN summary. Giveaways = interceptions thrown + fumbles lost. Takeaways = the opponent's giveaways (defensive INTs + fumbles recovered).
- 0 FGA → FG% treated as 2025 league mean (neutral).
- Desk `currentRating` uses these five pillars (app.js), same weights as the 2025 prior.
- Files: `data/ytd-rankings-2026.json`, `data/ytd-rankings-2026.md`, `data/ytd-st-2026.json`, `data/_ytd-to-raw-2026.json`.


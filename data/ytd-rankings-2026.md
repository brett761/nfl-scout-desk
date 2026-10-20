# NFL Scout YTD rankings — 2026 (same scale as 2025 O/D/ST/TAKE/GIVE)

Pulled: **Oct 20, 2026, 11:27 AM ET** · Scored games: **93** (W1 all 16 + W2 all 16 + W3 all 16 + W4 all 16 + W5 all 15 + W6 all 14).

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
| 1 | KC | 5 | +8.32 | +12.00 | -3.30 | +4.17 | +3.63 | +8.56 | 9 | 4 |
| 2 | SF | 6 | +10.53 | +9.89 | -4.00 | +0.46 | +1.84 | +8.08 | 7 | 6 |
| 3 | JAX | 6 | +4.88 | +11.75 | -3.30 | +2.41 | +4.82 | +7.15 | 9 | 4 |
| 4 | MIN | 5 | -0.81 | +12.00 | +0.87 | +5.00 | +3.63 | +5.19 | 10 | 4 |
| 5 | CAR | 5 | +10.09 | -1.77 | -0.87 | +1.83 | +3.63 | +3.79 | 7 | 4 |
| 6 | CHI | 6 | +3.90 | +7.10 | -2.24 | +2.41 | -5.00 | +3.76 | 9 | 11 |
| 7 | BAL | 6 | +5.37 | +3.07 | -3.61 | -0.52 | +4.82 | +3.75 | 6 | 4 |
| 8 | CIN | 5 | +4.79 | +3.44 | -0.87 | +3.00 | +0.05 | +3.40 | 8 | 6 |
| 9 | SEA | 6 | +3.41 | +6.17 | -0.87 | +4.37 | -5.00 | +3.39 | 11 | 12 |
| 10 | NE | 6 | +0.47 | +8.96 | -4.00 | +0.46 | -5.00 | +2.96 | 7 | 13 |
| 11 | PIT | 6 | +0.71 | +4.31 | -4.00 | +3.39 | +0.35 | +2.14 | 10 | 7 |
| 12 | GB | 6 | -1.74 | +5.24 | -2.44 | +4.37 | +0.35 | +1.67 | 11 | 7 |
| 13 | HOU | 6 | +2.43 | -0.34 | -2.24 | -0.52 | +5.00 | +1.34 | 6 | 3 |
| 14 | NYJ | 6 | -5.42 | +6.17 | -2.24 | +1.44 | +4.82 | +0.94 | 8 | 4 |
| 15 | DET | 5 | +12.00 | -11.07 | -0.87 | -0.52 | +5.00 | +0.92 | 5 | 1 |
| 16 | BUF | 6 | +12.00 | -9.02 | -0.87 | -0.52 | -2.63 | +0.76 | 6 | 9 |
| 17 | DEN | 6 | -4.93 | +5.24 | -4.00 | +3.39 | +1.84 | +0.50 | 10 | 6 |
| 18 | LV | 6 | +6.85 | -6.23 | -0.87 | +3.39 | -1.14 | +0.33 | 10 | 8 |
| 19 | LAR | 6 | +0.22 | +1.21 | -4.00 | -0.52 | -2.63 | +0.09 | 6 | 9 |
| 20 | NYG | 6 | +0.47 | +0.59 | -0.87 | +2.41 | -5.00 | -0.06 | 9 | 11 |
| 21 | CLE | 6 | -6.90 | +6.17 | -0.87 | +0.46 | +0.35 | -0.22 | 7 | 7 |
| 22 | DAL | 6 | +4.15 | -5.30 | -3.85 | -3.45 | +0.35 | -0.76 | 3 | 7 |
| 23 | ATL | 6 | +1.94 | -3.44 | -4.00 | -1.49 | -5.00 | -1.42 | 5 | 12 |
| 24 | TB | 6 | -3.71 | +1.21 | -0.87 | +1.44 | -5.00 | -1.51 | 8 | 11 |
| 25 | PHI | 6 | -6.90 | +1.52 | -0.87 | -3.45 | +3.33 | -1.95 | 3 | 5 |
| 26 | IND | 6 | +2.43 | -6.85 | -0.87 | -3.45 | -5.00 | -2.62 | 3 | 11 |
| 27 | WSH | 6 | -0.52 | -9.33 | -3.30 | +1.44 | +5.00 | -3.17 | 8 | 2 |
| 28 | NO | 6 | +4.39 | -11.19 | -4.00 | +2.41 | -5.00 | -3.18 | 9 | 12 |
| 29 | TEN | 6 | -12.00 | +4.00 | -3.06 | -1.49 | -1.14 | -3.43 | 5 | 8 |
| 30 | ARI | 6 | -1.99 | -11.19 | -2.09 | +1.44 | +1.84 | -4.82 | 8 | 6 |
| 31 | LAC | 6 | -10.82 | -2.82 | -3.61 | +3.39 | -5.00 | -5.75 | 10 | 15 |
| 32 | MIA | 5 | -12.00 | -5.12 | -3.61 | -1.69 | -3.53 | -7.29 | 4 | 8 |

## Top / bottom overall

**Top 5:** KC +8.56, SF +8.08, JAX +7.15, MIN +5.19, CAR +3.79

**Bottom 5:** MIA -7.29, LAC -5.75, ARI -4.82, TEN -3.43, NO -3.18

## Offense

**Top 5:** BUF +12.00, DET +12.00, SF +10.53, CAR +10.09, KC +8.32

**Bottom 5:** TEN -12.00, MIA -12.00, LAC -10.82, PHI -6.90, CLE -6.90

## Defense

**Top 5:** KC +12.00, MIN +12.00, JAX +11.75, SF +9.89, NE +8.96

**Bottom 5:** NO -11.19, ARI -11.19, DET -11.07, WSH -9.33, BUF -9.02

## Special teams

**Top 5:** MIN +0.87, BUF -0.87, CAR -0.87, CIN -0.87, CLE -0.87

**Bottom 5:** SF -4.00, PIT -4.00, NO -4.00, NE -4.00, LAR -4.00

## Takeaways

**Top 5:** MIN +5.00, GB +4.37, SEA +4.37, KC +4.17, DEN +3.39

**Bottom 5:** PHI -3.45, IND -3.45, DAL -3.45, MIA -1.69, TEN -1.49

## Giveaways

**Top 5:** DET +5.00, HOU +5.00, WSH +5.00, BAL +4.82, JAX +4.82

**Bottom 5:** TB -5.00, SEA -5.00, NYG -5.00, NO -5.00, NE -5.00

## Notes

- O/D PPG from `nfl-2026.json` scored finals. ST from `ytd-st-2026.json` (ESPN).
- Takeaways and giveaways from each scored final's ESPN summary. Giveaways = interceptions thrown + fumbles lost. Takeaways = the opponent's giveaways (defensive INTs + fumbles recovered).
- 0 FGA → FG% treated as 2025 league mean (neutral).
- Desk `currentRating` uses these five pillars (app.js), same weights as the 2025 prior.
- Files: `data/ytd-rankings-2026.json`, `data/ytd-rankings-2026.md`, `data/ytd-st-2026.json`, `data/_ytd-to-raw-2026.json`.


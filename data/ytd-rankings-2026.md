# NFL Scout YTD rankings — 2026 (same scale as 2025 O/D/ST/TAKE/GIVE)

Pulled: **Nov 3, 2026, 11:26 AM ET** · Scored games: **121** (W1 all 16 + W2 all 16 + W3 all 16 + W4 all 16 + W5 all 15 + W6 all 14 + W7 all 14 + W8 all 14).

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
| 1 | JAX | 7 | +8.32 | +12.00 | -3.30 | +3.67 | +4.40 | +8.62 | 12 | 5 |
| 2 | SF | 7 | +8.53 | +7.06 | -4.00 | -0.52 | -1.99 | +5.65 | 7 | 10 |
| 3 | KC | 7 | +2.22 | +9.18 | -3.30 | +2.00 | +4.40 | +5.04 | 10 | 5 |
| 4 | CHI | 8 | +6.48 | +6.79 | -2.24 | +1.68 | -2.63 | +4.88 | 11 | 12 |
| 5 | CIN | 7 | +10.42 | +2.01 | -0.87 | +2.83 | -1.99 | +4.76 | 11 | 10 |
| 6 | PIT | 8 | +0.22 | +10.51 | -4.00 | +3.15 | +1.84 | +4.53 | 13 | 8 |
| 7 | MIN | 7 | -3.46 | +12.00 | +0.87 | +3.67 | +4.40 | +4.16 | 12 | 5 |
| 8 | TB | 8 | -0.15 | +8.88 | -0.87 | +5.00 | -2.63 | +3.41 | 16 | 12 |
| 9 | DET | 7 | +9.79 | -3.84 | -0.87 | -0.52 | +5.00 | +2.87 | 7 | 4 |
| 10 | SEA | 8 | +1.14 | +7.02 | -0.87 | +3.15 | -4.87 | +2.77 | 13 | 14 |
| 11 | BUF | 7 | +12.00 | -4.11 | -0.87 | +1.16 | -3.27 | +2.71 | 9 | 11 |
| 12 | LAR | 8 | +2.80 | +4.93 | -4.00 | -0.52 | -2.63 | +2.53 | 8 | 12 |
| 13 | DEN | 8 | -1.25 | +5.63 | -4.00 | +0.95 | +4.08 | +2.18 | 10 | 6 |
| 14 | NE | 8 | +0.96 | +6.33 | -4.00 | -0.52 | -5.00 | +2.06 | 8 | 15 |
| 15 | GB | 8 | -1.44 | +5.86 | -2.44 | +4.61 | -1.51 | +1.81 | 15 | 11 |
| 16 | DAL | 8 | +7.40 | -5.53 | -3.85 | -1.98 | +2.96 | +0.85 | 6 | 7 |
| 17 | HOU | 7 | +1.80 | -1.18 | -2.24 | -1.35 | +5.00 | +0.71 | 6 | 3 |
| 18 | NYG | 7 | +1.38 | +1.21 | -0.87 | +1.16 | -3.27 | +0.66 | 9 | 11 |
| 19 | NYJ | 8 | -1.62 | +0.28 | -2.24 | -0.52 | +4.08 | -0.10 | 8 | 6 |
| 20 | LV | 8 | +7.77 | -9.49 | -0.87 | +3.15 | +1.84 | -0.22 | 13 | 8 |
| 21 | WSH | 7 | +0.54 | -4.37 | -3.30 | +2.00 | +5.00 | -0.79 | 10 | 3 |
| 22 | BAL | 8 | +0.04 | -3.21 | -3.61 | -0.52 | +1.84 | -1.13 | 8 | 8 |
| 23 | ATL | 8 | -1.44 | +0.05 | -4.00 | +0.95 | -5.00 | -1.19 | 10 | 16 |
| 24 | CAR | 7 | +4.53 | -7.30 | -0.87 | +2.00 | -1.99 | -1.19 | 10 | 10 |
| 25 | CLE | 8 | -7.33 | +3.77 | -0.87 | +0.95 | -1.51 | -1.52 | 10 | 11 |
| 26 | NO | 7 | +1.17 | -7.56 | -4.00 | +1.16 | -5.00 | -3.12 | 9 | 13 |
| 27 | TEN | 8 | -6.40 | -2.28 | -3.06 | +1.68 | -2.63 | -3.64 | 11 | 12 |
| 28 | PHI | 8 | -7.69 | -2.98 | -0.87 | -3.45 | +1.84 | -4.18 | 4 | 8 |
| 29 | ARI | 8 | -0.70 | -11.35 | -2.09 | -0.52 | +1.84 | -4.53 | 8 | 8 |
| 30 | MIA | 7 | -8.30 | -4.11 | -3.61 | -1.35 | -0.71 | -5.09 | 6 | 9 |
| 31 | IND | 8 | -3.28 | -7.63 | -0.87 | -3.45 | -5.00 | -5.13 | 4 | 15 |
| 32 | LAC | 7 | -12.00 | -2.51 | -3.61 | +2.83 | -5.00 | -6.13 | 11 | 17 |

## Top / bottom overall

**Top 5:** JAX +8.62, SF +5.65, KC +5.04, CHI +4.88, CIN +4.76

**Bottom 5:** LAC -6.13, IND -5.13, MIA -5.09, ARI -4.53, PHI -4.18

## Offense

**Top 5:** BUF +12.00, CIN +10.42, DET +9.79, SF +8.53, JAX +8.32

**Bottom 5:** LAC -12.00, MIA -8.30, PHI -7.69, CLE -7.33, TEN -6.40

## Defense

**Top 5:** JAX +12.00, MIN +12.00, PIT +10.51, KC +9.18, TB +8.88

**Bottom 5:** ARI -11.35, LV -9.49, IND -7.63, NO -7.56, CAR -7.30

## Special teams

**Top 5:** MIN +0.87, BUF -0.87, CAR -0.87, CIN -0.87, CLE -0.87

**Bottom 5:** SF -4.00, PIT -4.00, NO -4.00, NE -4.00, LAR -4.00

## Takeaways

**Top 5:** TB +5.00, GB +4.61, JAX +3.67, MIN +3.67, LV +3.15

**Bottom 5:** PHI -3.45, IND -3.45, DAL -1.98, MIA -1.35, HOU -1.35

## Giveaways

**Top 5:** DET +5.00, HOU +5.00, WSH +5.00, JAX +4.40, KC +4.40

**Bottom 5:** NO -5.00, NE -5.00, LAC -5.00, IND -5.00, ATL -5.00

## Notes

- O/D PPG from `nfl-2026.json` scored finals. ST from `ytd-st-2026.json` (ESPN).
- Takeaways and giveaways from each scored final's ESPN summary. Giveaways = interceptions thrown + fumbles lost. Takeaways = the opponent's giveaways (defensive INTs + fumbles recovered).
- 0 FGA → FG% treated as 2025 league mean (neutral).
- Desk `currentRating` uses these five pillars (app.js), same weights as the 2025 prior.
- Files: `data/ytd-rankings-2026.json`, `data/ytd-rankings-2026.md`, `data/ytd-st-2026.json`, `data/_ytd-to-raw-2026.json`.


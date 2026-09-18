# 2026 NFL coach career ATS

Pulled Thursday 20 August 2026 (ET). Each 2026 head coach's all-time regular-season + playoff ATS as a head coach. Follows the person across buildings. Not coordinator ATS. Not coach-vs-coach SU H2H. Not Week 1 / bye prep.

Records from [Lee Sharpe / nflverse `games.csv`](https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv) (`home_coach` / `away_coach`, completed games). game_type REG / WC / DIV / CON / SB. No preseason in the file. Rows missing `spread_line` or scores are skipped. 2026 slate rows have no scores yet, so they do not count.

nflverse `spread_line` is positive when the home club is favored (aligns with `result` = home minus away). Home covers if `(home_score - away_score) - spread_line > 0`. Away covers if the reverse. Push if equal. Pushes are stored and dropped from n and rate.

Scoring (slight): `pts = clamp((win_rate-0.5)*2*min(1,n/48), ±0.35)` when `n>=16` and `|win_rate-0.5|>=0.04`; else 0. Full weight at 48 decided games. Cap 0.35. Does not replace SU H2H (that layer stays at ±1).

**32 coaches. 14 move a line (`|pts|>0`). 12 dead zone. 0 below the 16-game floor. 6 with n=0.**

First-year HCs with **zero** prior NFL head-coaching games stay at 0: Mike LaFleur, Todd Monken, Klint Kubiak, Joe Brady, Jeff Hafley, Jesse Minter.

## Coaches that move a line (`|pts| > 0`)

Sorted by pts (then n).

1. Jim Harbaugh (LAC) 64-41-3 · n=105, pts +0.22, rate 0.610 · SF 2011-2014, LAC 2024-2025
2. Dan Campbell (DET) 60-39-2 · n=99, pts +0.21, rate 0.606 · MIA 2015, DET 2021-2025
3. Zac Taylor (CIN) 67-53-3 · n=120, pts +0.12, rate 0.558 · CIN 2019-2025
4. Liam Coen (JAX) 12-6 · n=18, pts +0.12, rate 0.667 · JAX 2025
5. Mike McCarthy (PIT) 168-134-8 · n=302, pts +0.11, rate 0.556 · GB 2006-2018, DAL 2020-2024
6. Sean McVay (LAR) 89-72-4 · n=161, pts +0.11, rate 0.553 · LAR 2017-2025
7. Mike Macdonald (SEA) 21-16 · n=37, pts +0.10, rate 0.568 · SEA 2024-2025
8. Sean Payton (DEN) 167-141-4 · n=308, pts +0.08, rate 0.542 · NO 2006-2011, NO 2013-2021, DEN 2023-2025
9. Ben Johnson (CHI) 11-7-1 · n=18, pts +0.08, rate 0.611 · CHI 2025
10. Dave Canales (CAR) 19-16 · n=35, pts +0.06, rate 0.543 · CAR 2024-2025
11. Aaron Glenn (NYJ) 7-10 · n=17, pts −0.06, rate 0.412 · NYJ 2025
12. Brian Schottenheimer (DAL) 7-10 · n=17, pts −0.06, rate 0.412 · DAL 2025
13. Kevin Stefanski (ATL) 44-58-2 · n=102, pts −0.14, rate 0.431 · CLE 2020-2025
14. Robert Saleh (TEN) 22-33-1 · n=55, pts −0.20, rate 0.400 · NYJ 2021-2024

## Dead zone (`n>=16` but still 0)

- Andy Reid (KC) 252-220-10, n=472, rate 0.534 · PHI 1999-2012, KC 2013-2025
- John Harbaugh (NYG) 161-146-10, n=307, rate 0.524 · BAL 2008-2025
- Kyle Shanahan (SF) 83-79-1, n=162, rate 0.512 · SF 2017-2025
- Todd Bowles (TB) 62-72-5, n=134, rate 0.463 · MIA 2011, NYJ 2015-2018, TB 2022-2025
- Dan Quinn (WSH) 59-68, n=127, rate 0.465 · ATL 2015-2020, WSH 2024-2025
- Matt LaFleur (GB) 67-58-1, n=125, rate 0.536 · GB 2019-2025
- Mike Vrabel (NE) 65-56-4, n=121, rate 0.537 · TEN 2018-2023, NE 2025
- Nick Sirianni (PHI) 49-43-3, n=92, rate 0.533 · PHI 2021-2025
- Kevin O'Connell (MIN) 34-31-5, n=65, rate 0.523 · MIN 2022-2025
- DeMeco Ryans (HOU) 29-27-1, n=56, rate 0.518 · HOU 2023-2025
- Shane Steichen (IND) 27-24, n=51, rate 0.529 · IND 2023-2025
- Kellen Moore (NO) 9-8, n=17, rate 0.529 · NO 2025

## Below the 16-game floor

None.

## n = 0

- Mike LaFleur (ARI) · first-year HC, no prior HC games
- Jesse Minter (BAL) · first-year HC, no prior HC games
- Joe Brady (BUF) · first-year HC, no prior HC games
- Todd Monken (CLE) · first-year HC, no prior HC games
- Klint Kubiak (LV) · first-year HC, no prior HC games
- Jeff Hafley (MIA) · first-year HC, no prior HC games

## 32-coach book

| Abbr | Coach | ATS | n | rate | pts | Seasons |
|---|---|---|---|---|---|---|
| ARI | Mike LaFleur | 0-0 | 0 | — | 0 | — |
| ATL | Kevin Stefanski | 44-58-2 | 102 | 0.431 | −0.14 | CLE 2020-2025 |
| BAL | Jesse Minter | 0-0 | 0 | — | 0 | — |
| BUF | Joe Brady | 0-0 | 0 | — | 0 | — |
| CAR | Dave Canales | 19-16 | 35 | 0.543 | +0.06 | CAR 2024-2025 |
| CHI | Ben Johnson | 11-7-1 | 18 | 0.611 | +0.08 | CHI 2025 |
| CIN | Zac Taylor | 67-53-3 | 120 | 0.558 | +0.12 | CIN 2019-2025 |
| CLE | Todd Monken | 0-0 | 0 | — | 0 | — |
| DAL | Brian Schottenheimer | 7-10 | 17 | 0.412 | −0.06 | DAL 2025 |
| DEN | Sean Payton | 167-141-4 | 308 | 0.542 | +0.08 | NO 2006-2011, NO 2013-2021, DEN 2023-2025 |
| DET | Dan Campbell | 60-39-2 | 99 | 0.606 | +0.21 | MIA 2015, DET 2021-2025 |
| GB | Matt LaFleur | 67-58-1 | 125 | 0.536 | 0 | GB 2019-2025 |
| HOU | DeMeco Ryans | 29-27-1 | 56 | 0.518 | 0 | HOU 2023-2025 |
| IND | Shane Steichen | 27-24 | 51 | 0.529 | 0 | IND 2023-2025 |
| JAX | Liam Coen | 12-6 | 18 | 0.667 | +0.12 | JAX 2025 |
| KC | Andy Reid | 252-220-10 | 472 | 0.534 | 0 | PHI 1999-2012, KC 2013-2025 |
| LV | Klint Kubiak | 0-0 | 0 | — | 0 | — |
| LAC | Jim Harbaugh | 64-41-3 | 105 | 0.610 | +0.22 | SF 2011-2014, LAC 2024-2025 |
| LAR | Sean McVay | 89-72-4 | 161 | 0.553 | +0.11 | LAR 2017-2025 |
| MIA | Jeff Hafley | 0-0 | 0 | — | 0 | — |
| MIN | Kevin O'Connell | 34-31-5 | 65 | 0.523 | 0 | MIN 2022-2025 |
| NE | Mike Vrabel | 65-56-4 | 121 | 0.537 | 0 | TEN 2018-2023, NE 2025 |
| NO | Kellen Moore | 9-8 | 17 | 0.529 | 0 | NO 2025 |
| NYG | John Harbaugh | 161-146-10 | 307 | 0.524 | 0 | BAL 2008-2025 |
| NYJ | Aaron Glenn | 7-10 | 17 | 0.412 | −0.06 | NYJ 2025 |
| PHI | Nick Sirianni | 49-43-3 | 92 | 0.533 | 0 | PHI 2021-2025 |
| PIT | Mike McCarthy | 168-134-8 | 302 | 0.556 | +0.11 | GB 2006-2018, DAL 2020-2024 |
| SF | Kyle Shanahan | 83-79-1 | 162 | 0.512 | 0 | SF 2017-2025 |
| SEA | Mike Macdonald | 21-16 | 37 | 0.568 | +0.10 | SEA 2024-2025 |
| TB | Todd Bowles | 62-72-5 | 134 | 0.463 | 0 | MIA 2011, NYJ 2015-2018, TB 2022-2025 |
| TEN | Robert Saleh | 22-33-1 | 55 | 0.400 | −0.20 | NYJ 2021-2024 |
| WSH | Dan Quinn | 59-68 | 127 | 0.465 | 0 | ATL 2015-2020, WSH 2024-2025 |

## Method notes

- Source file has 7548 rows. Used completed REG/POST games with a line and scores. Skipped 272 roster-coach rows missing spread or score (includes the entire 2026 slate).
- Name match on `home_coach` / `away_coach`. Apostrophes normalized. Mike LaFleur is not Matt LaFleur. John Harbaugh is not Jim Harbaugh. Kevin O'Connell in nflverse is `Kevin O'Connell` (straight apostrophe).
- College does not appear in this file. Jim Harbaugh's 49ers + Chargers count. Michigan does not.
- Dan Quinn Cowboys DC games are not in the coach columns. Only Falcons + Commanders HC years count.
- Campbell 2015: MIA weeks 6-17 credited (12 games, ATS 4-8). Same correction as H2H / prep. Philbin fired 5 Oct 2015. nflverse left Philbin.
- Saleh 2024: NYJ weeks 6-18 removed (12 games, ATS 4-8 not his). Same correction as H2H / prep. Fired 8 Oct 2024. Last sourced game is 2024 week 5.
- Bowles 2011 MIA interim weeks 15-17 is already tagged in nflverse and is included.
- No other mid-season credits were added. Quinn 2020 ATL is already Morris from week 6 in nflverse.
- 2026 first-year HCs with zero completed HC games are 0. That is correct. nflverse 2026 rows list Minter / Monken / Hafley / Kubliak (typo) with empty scores; those rows are skipped.
- No auto-bet. No letter grades. League even.


# 2026 NFL coach PREP — Week 1 form and post-bye form

Pulled Wednesday 19 August 2026 (ET). Coach career ATS on historical Week 1 and post-bye games. Number follows the coach (any franchise), not the 2026 club. Regular season + playoffs if a Week 1 or post-bye ever happened there. Preseason is not Week 1 and is not in the source file.

Roster from `coaches-2026.json`. Records from [Lee Sharpe / nflverse `games.csv`](https://github.com/nflverse/nfldata/blob/master/data/games.csv) (`home_coach` / `away_coach`, 1999–2025 completed games). Same two mid-season credits as H2H: Campbell’s 2015 Miami interim (weeks 6–17; nflverse left Philbin on those rows); Saleh’s 2024 Jets firing after week 5 (nflverse left Saleh on weeks 6–18).

Scoring (same board as H2H): `pts = clamp((win_rate-0.5)*2*min(1,n/8), ±1)` when `n>=4` and `|win_rate-0.5|>=0.15`; else 0. Pushes excluded from n. ATS preferred when `spread_line` is complete; cover = beat the number. If a sample is missing a line, that sample falls back to SU and `book="SU"`. This pull: every completed game has a spread, so every non-empty sample is ATS.

Week 1 = `week == 1` and `game_type == REG`. Post-bye = that club’s previous REG game that season was a bye (gap of ≥2 in week numbers, or `rest >= 13`). Week 1 is never a bye. Short week (`rest <= 6`) is never a bye. Super Bowl extra week is not a bye (previous game is the conference title, not a REG bye). Playoff first-round byes count (previous game is REG, rest ≥ 13).

2026 Week 1 has **no byes** (every club plays week 1 in `nfl-2026.json`). A club is off a bye in week W only when that file has no game for them in week W−1.

**32 coaches. Week 1: 11 move a line (`|pts|>0`), 6 dead zone, 9 small sample, 6 with n=0. Post-bye: 4 move a line.**

First-year HCs with **zero** prior NFL head-coaching games stay at 0: Mike LaFleur, Jesse Minter, Joe Brady, Todd Monken, Klint Kubiak, Jeff Hafley.

## Week 1 — pairs that move a line (`|pts| > 0`)

Sorted by pts (then n). ATS.

1. Jim Harbaugh (LAC) 6-0 — n=6, pts +0.75, rate 1.000, book ATS — SU 6-0
2. Sean McVay (LAR) 7-2 — n=9, pts +0.56, rate 0.778, book ATS — SU 7-2
3. Todd Bowles (TB) 6-2 — n=8, pts +0.5, rate 0.750, book ATS — SU 6-2
4. Dan Campbell (DET) 4-1 — n=5, pts +0.38, rate 0.800, book ATS — SU 2-3
5. John Harbaugh (NYG) 12-6 — n=18, pts +0.33, rate 0.667, book ATS — SU 12-6
6. Kevin Stefanski (ATL) 4-2 — n=6, pts +0.25, rate 0.667, book ATS — SU 2-4
7. Kevin O'Connell (MIN) 3-1 — n=4, pts +0.25, rate 0.750, book ATS — SU 3-1
8. Robert Saleh (TEN) 1-3 — n=4, pts −0.25, rate 0.250, book ATS — SU 1-3
9. Zac Taylor (CIN) 2-5 — n=7, pts −0.38, rate 0.286, book ATS — SU 2-5
10. Mike Vrabel (NE) 2-5 — n=7, pts −0.38, rate 0.286, book ATS — SU 2-5
11. Dan Quinn (WSH) 2-6 — n=8, pts −0.5, rate 0.250, book ATS — SU 3-5

## Week 1 — dead zone (`n>=4` but still 0)

- Andy Reid (KC) 15-11, n=26, rate 0.577
- Mike McCarthy (PIT) 11-7, n=18, rate 0.611
- Sean Payton (DEN) 8-10, n=18, rate 0.444
- Kyle Shanahan (SF) 4-5, n=9, rate 0.444
- Matt LaFleur (GB) 4-3, n=7, rate 0.571
- Nick Sirianni (PHI) 3-2, n=5, rate 0.600

## Week 1 — small samples (`n < 4`)

- Aaron Glenn (NYJ) 1-0, n=1 — stored, no number
- Ben Johnson (CHI) 0-1, n=1 — stored, no number
- Brian Schottenheimer (DAL) 1-0, n=1 — stored, no number
- Dave Canales (CAR) 0-2, n=2 — stored, no number
- DeMeco Ryans (HOU) 0-3, n=3 — stored, no number
- Kellen Moore (NO) 0-1, n=1 — stored, no number
- Liam Coen (JAX) 1-0, n=1 — stored, no number
- Mike Macdonald (SEA) 0-2, n=2 — stored, no number
- Shane Steichen (IND) 2-1, n=3 — stored, no number

## Week 1 — n = 0

- Jeff Hafley (MIA) — first-year HC, no prior HC games
- Jesse Minter (BAL) — first-year HC, no prior HC games
- Joe Brady (BUF) — first-year HC, no prior HC games
- Klint Kubiak (LV) — first-year HC, no prior HC games
- Mike LaFleur (ARI) — first-year HC, no prior HC games
- Todd Monken (CLE) — first-year HC, no prior HC games

## Post-bye — pairs that move a line (`|pts| > 0`)

1. Mike Vrabel (NE) 6-2 — n=8, pts +0.5, rate 0.750, book ATS — SU 6-2
2. Mike McCarthy (PIT) 14-6 — n=20, pts +0.4, rate 0.700, book ATS — SU 14-7
3. Nick Sirianni (PHI) 4-1 — n=5, pts +0.38, rate 0.800, book ATS — SU 6-0
4. Kevin Stefanski (ATL) 1-5 — n=6, pts −0.5, rate 0.167, book ATS — SU 3-3

## Post-bye — dead zone (`n>=4` but still 0)

- Andy Reid (KC) 21-16, n=37, rate 0.568
- Sean Payton (DEN) 12-10, n=22, rate 0.545
- John Harbaugh (NYG) 12-9, n=21, rate 0.571
- Kyle Shanahan (SF) 5-6, n=11, rate 0.455
- Matt LaFleur (GB) 4-6, n=10, rate 0.400
- Sean McVay (LAR) 5-5, n=10, rate 0.500
- Dan Quinn (WSH) 5-3, n=8, rate 0.625
- Jim Harbaugh (LAC) 5-3, n=8, rate 0.625
- Todd Bowles (TB) 3-5, n=8, rate 0.375
- Dan Campbell (DET) 4-3, n=7, rate 0.571
- Zac Taylor (CIN) 3-4, n=7, rate 0.429

## Post-bye — small samples (`n < 4`)

- Aaron Glenn (NYJ) 1-0, n=1 — stored, no number
- Ben Johnson (CHI) 1-0, n=1 — stored, no number
- Brian Schottenheimer (DAL) 1-0, n=1 — stored, no number
- Dave Canales (CAR) 1-1, n=2 — stored, no number
- DeMeco Ryans (HOU) 1-2, n=3 — stored, no number
- Kellen Moore (NO) 0-1, n=1 — stored, no number
- Kevin O'Connell (MIN) 1-2, n=3 — stored, no number
- Liam Coen (JAX) 0-1, n=1 — stored, no number
- Mike Macdonald (SEA) 3-0, n=3 — stored, no number
- Robert Saleh (TEN) 0-2, n=2 — stored, no number
- Shane Steichen (IND) 2-1, n=3 — stored, no number

## Post-bye — n = 0

- Jeff Hafley (MIA) — first-year HC, no prior HC games
- Jesse Minter (BAL) — first-year HC, no prior HC games
- Joe Brady (BUF) — first-year HC, no prior HC games
- Klint Kubiak (LV) — first-year HC, no prior HC games
- Mike LaFleur (ARI) — first-year HC, no prior HC games
- Todd Monken (CLE) — first-year HC, no prior HC games

## 2026 Week 1 example — NE @ SEA

Mike Vrabel (NE) Week 1 ATS 2-5 n=7 pts −0.38.
Mike Macdonald (SEA) Week 1 ATS 0-2 n=2 pts 0.
Neither club is off a bye (Week 1 2026 has no byes).

```
week1_term(SEA) = 0
week1_term(NE)  = -0.38
bye_term(*)     = 0
prep_net        = week1_term(home) - week1_term(away) = 0 - -0.38 = 0.38
ourHomeLine     = −(homeEff − awayEff + hfa + coach_h2h + prep_net)
```

Positive prep_net = home HC’s Week 1/bye number is better = home favored more (line more negative). eff() is unchanged.

## 2026 bye weeks (from nfl-2026.json, not invented)

No club byes in week 1: none.

- ARI: week 14
- ATL: week 11
- BAL: week 13
- BUF: week 7
- CAR: week 5
- CHI: week 10
- CIN: week 6
- CLE: week 11
- DAL: week 14
- DEN: week 10
- DET: week 6
- GB: week 11
- HOU: week 8
- IND: week 13
- JAX: week 7
- KC: week 5
- LV: week 13
- LAC: week 7
- LAR: week 11
- MIA: week 6
- MIN: week 6
- NE: week 11
- NO: week 8
- NYG: week 8
- NYJ: week 13
- PHI: week 10
- PIT: week 9
- SF: week 8
- SEA: week 11
- TB: week 10
- TEN: week 9
- WSH: week 7

## Method notes

- Book is **ATS** when `spread_line` is present on every game in the sample. nflverse: positive `spread_line` = home favored; `result` = home minus away. Cover = result on the correct side of the number. Pushes are stored and dropped from n.
- SU is stored on every row (`su_wins` / `su_losses`) and is the fallback book only when a line is missing. This file does not infer ATS from SU.
- Preseason is absent from the source (game_type is REG / WC / DIV / CON / SB only). Reid’s August ATS is a different market.
- Campbell 2015: MIA weeks 6–17 credited (Philbin fired 5 Oct 2015). Week 6 MIA@TEN is a post-bye game for Campbell.
- Saleh 2024: NYJ weeks 6–18 removed (fired 8 Oct 2024; Ulbrich interim). His last sourced game is 2024 week 5.
- No other mid-season credits were invented. Quinn 2020 ATL is already Morris from week 6 in nflverse. Bowles’ 2011 MIA interim (weeks 15–17) is already tagged and is included.
- Rest-days ≥ 13 after a REG game counts (bye week, playoff bye, or a long postponement). Thursday after a bye still counts via the week gap. Super Bowl rest of 14 does not (previous game is CON).


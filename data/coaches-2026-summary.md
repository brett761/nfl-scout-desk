# 2026 NFL head-coach matchups — Scout desk

Pulled Wednesday 19 August 2026 (ET). Straight-up head-coach vs head-coach only (regular season + playoffs, no preseason). ATS was not stored: no published coach-vs-coach ATS book was found, and SU was not converted into ATS.

Roster confirmed against [Wikipedia current HCs](https://en.wikipedia.org/wiki/List_of_current_National_Football_League_head_coaches), [ESPN NFL coaches](https://www.espn.com/nfl/coaches), and the [Ravens 2026 league-wide HC photo list](https://www.baltimoreravens.com/photos/every-nfl-head-coach-list-2027-new-jesse-minter), plus each club's hire story. H2H built from [Lee Sharpe / nflverse `games.csv`](https://github.com/nflverse/nfldata/blob/master/data/games.csv) (home_coach / away_coach, 1999–2025 completed games). Two mid-season credits were corrected from team/NFL sources: Campbell's 2015 Miami interim, Saleh's 2024 Jets firing.

Scoring: `pts = clamp((win_rate-0.5)*2*min(1,n/8), ±1)` when `n>=4` and `|win_rate-0.5|>=0.15`; else 0. Number follows the coach, not the 2026 club.

**32 coaches. 225 sourced H2H pairs. 23 move a line (`|pts|>0`). 24 sit in the dead zone (`n>=4` but `|rate-0.5|<0.15`). 178 are small samples (`n<4`).**

## 32 head coaches

| Abbr | Coach | With club since | First-year 2026? |
|---|---|---|---|
| ARI | Mike LaFleur | 2026 | yes — no prior HC games |
| ATL | Kevin Stefanski | 2026 | yes — prior HC elsewhere |
| BAL | Jesse Minter | 2026 | yes — no prior HC games |
| BUF | Joe Brady | 2026 | yes — no prior HC games |
| CAR | Dave Canales | 2024 | no |
| CHI | Ben Johnson | 2025 | no |
| CIN | Zac Taylor | 2019 | no |
| CLE | Todd Monken | 2026 | yes — no prior HC games |
| DAL | Brian Schottenheimer | 2025 | no |
| DEN | Sean Payton | 2023 | no |
| DET | Dan Campbell | 2021 | no |
| GB | Matt LaFleur | 2019 | no |
| HOU | DeMeco Ryans | 2023 | no |
| IND | Shane Steichen | 2023 | no |
| JAX | Liam Coen | 2025 | no |
| KC | Andy Reid | 2013 | no |
| LAC | Jim Harbaugh | 2024 | no |
| LAR | Sean McVay | 2017 | no |
| LV | Klint Kubiak | 2026 | yes — no prior HC games |
| MIA | Jeff Hafley | 2026 | yes — no prior HC games |
| MIN | Kevin O'Connell | 2022 | no |
| NE | Mike Vrabel | 2025 | no |
| NO | Kellen Moore | 2025 | no |
| NYG | John Harbaugh | 2026 | yes — prior HC elsewhere |
| NYJ | Aaron Glenn | 2025 | no |
| PHI | Nick Sirianni | 2021 | no |
| PIT | Mike McCarthy | 2026 | yes — prior HC elsewhere |
| SEA | Mike Macdonald | 2024 | no |
| SF | Kyle Shanahan | 2017 | no |
| TB | Todd Bowles | 2022 | no |
| TEN | Robert Saleh | 2026 | yes — prior HC elsewhere |
| WSH | Dan Quinn | 2024 | no |

First-year HCs with **zero** prior NFL head-coaching games (no H2H possible): Mike LaFleur, Jesse Minter, Joe Brady, Todd Monken, Klint Kubiak, Jeff Hafley.

Prior-HC newcomers (their old-club meetings still count): Kevin Stefanski (CLE 2020–25), John Harbaugh (BAL 2008–25), Mike McCarthy (GB 2006–18, DAL 2020–24), Robert Saleh (NYJ 2021–24, last game 2024 week 5).

## Pairs that move a line (`|pts| > 0`)

Sorted by |pts|. Leader is the coach who owns the number.

1. Matt LaFleur (GB) 5-0 Sean McVay (LAR) — n=5, pts +0.62 — 2020-2024 GB vs LAR; playoffs: 1 Div; includes 2020 NFC Divisional
2. Andy Reid (KC) 5-0 Kyle Shanahan (SF) — n=5, pts +0.62 — 2018-2024 KC vs SF; playoffs: 2 SB; includes Super Bowl LIV and LVIII
3. Andy Reid (KC) 8-2 John Harbaugh (NYG) — n=10, pts +0.60 — 2008-2025 BAL vs KC/PHI; playoffs: 1 CCG; includes 2023 AFC Championship
4. Jim Harbaugh (LAC) 4-0 Mike McCarthy (PIT) — n=4, pts +0.50 — 2012-2013 SF vs GB; playoffs: 1 WC, 1 Div
5. Nick Sirianni (PHI) 4-0 Matt LaFleur (GB) — n=4, pts +0.50 — 2022-2025 GB vs PHI; playoffs: 1 WC
6. Nick Sirianni (PHI) 4-0 Sean McVay (LAR) — n=4, pts +0.50 — 2023-2025 LAR vs PHI; playoffs: 1 Div
7. DeMeco Ryans (HOU) 5-1 Shane Steichen (IND) — n=6, pts +0.50 — 2023-2025 HOU vs IND
8. Jim Harbaugh (LAC) 5-2 Sean Payton (DEN) — n=7, pts +0.38 — 2011-2025 LAC/SF vs DEN/NO; playoffs: 1 Div
9. John Harbaugh (NYG) 8-4 Kevin Stefanski (ATL) — n=12, pts +0.33 — 2020-2025 BAL vs CLE
10. John Harbaugh (NYG) 10-5 Zac Taylor (CIN) — n=15, pts +0.33 — 2019-2025 BAL vs CIN; playoffs: 1 WC
11. Todd Bowles (TB) 3-1 Dave Canales (CAR) — n=4, pts +0.25 — 2024-2025 TB vs CAR
12. Andy Reid (KC) 3-1 Todd Bowles (TB) — n=4, pts +0.25 — 2016-2024 NYJ/TB vs KC
13. Kyle Shanahan (SF) 3-1 Todd Bowles (TB) — n=4, pts +0.25 — 2022-2025 TB vs SF
14. Jim Harbaugh (LAC) 4-2 Andy Reid (KC) — n=6, pts +0.25 — 2011-2025 LAC/SF vs KC/PHI
15. John Harbaugh (NYG) 3-1 Sean Payton (DEN) — n=4, pts +0.25 — 2010-2024 BAL vs DEN/NO
16. John Harbaugh (NYG) 3-1 DeMeco Ryans (HOU) — n=4, pts +0.25 — 2023-2025 BAL vs HOU; playoffs: 1 Div
17. Sean Payton (DEN) 3-1 Matt LaFleur (GB) — n=4, pts +0.25 — 2020-2025 GB vs DEN/NO
18. Sean Payton (DEN) 4-2 Mike McCarthy (PIT) — n=6, pts +0.25 — 2006-2021 DAL/GB vs NO
19. Dan Quinn (WSH) 4-2 Mike McCarthy (PIT) — n=6, pts +0.25 — 2016-2024 DAL/GB vs ATL/WSH; playoffs: 1 CCG
20. Mike McCarthy (PIT) 4-2 Andy Reid (KC) — n=6, pts +0.25 — 2006-2021 DAL/GB vs KC/PHI; playoffs: 1 WC
21. Kyle Shanahan (SF) 4-2 Mike McCarthy (PIT) — n=6, pts +0.25 — 2018-2024 DAL/GB vs SF; playoffs: 1 WC, 1 Div
22. Sean McVay (LAR) 3-1 Sean Payton (DEN) — n=4, pts +0.25 — 2017-2019 LAR vs NO; playoffs: 1 CCG
23. Kyle Shanahan (SF) 3-1 Nick Sirianni (PHI) — n=4, pts +0.25 — 2021-2025 SF vs PHI; playoffs: 1 WC, 1 CCG

## Dead zone — `n>=4` but still 0

These meetings are real and large enough to score, but the win rate sits inside ±15 points of .500.

- Sean McVay (LAR) 8-11 Kyle Shanahan (SF), n=19, rate 0.421 — 2017-2025 LAR vs SF; playoffs: 1 CCG; NFC West + 2021 NFC Championship
- Kevin Stefanski (ATL) 7-5 Zac Taylor (CIN), n=12, rate 0.583 — 2020-2025 CLE vs CIN
- Sean Payton (DEN) 7-5 Andy Reid (KC), n=12, rate 0.583 — 2006-2025 DEN/NO vs KC/PHI; playoffs: 1 Div
- Sean Payton (DEN) 7-4 Dan Quinn (WSH), n=11, rate 0.636 — 2015-2025 DEN/NO vs ATL/WSH
- Dan Campbell (DET) 6-4 Matt LaFleur (GB), n=10, rate 0.600 — 2021-2025 DET vs GB
- Dan Campbell (DET) 5-3 Kevin O'Connell (MIN), n=8, rate 0.625 — 2022-2025 DET vs MIN
- Matt LaFleur (GB) 3-5 Kevin O'Connell (MIN), n=8, rate 0.375 — 2022-2025 GB vs MIN
- Mike McCarthy (PIT) 4-4 Nick Sirianni (PHI), n=8, rate 0.500 — 2021-2024 DAL vs PHI
- Matt LaFleur (GB) 3-4 Kyle Shanahan (SF), n=7, rate 0.429 — 2019-2024 GB vs SF; playoffs: 2 Div, 1 CCG
- Andy Reid (KC) 3-3 Zac Taylor (CIN), n=6, rate 0.500 — 2021-2024 KC vs CIN; playoffs: 2 CCG
- John Harbaugh (NYG) 3-3 Mike Vrabel (NE), n=6, rate 0.500 — 2018-2025 BAL vs NE/TEN; playoffs: 1 WC, 1 Div
- Andy Reid (KC) 2-3 Nick Sirianni (PHI), n=5, rate 0.400 — 2021-2025 KC vs PHI; playoffs: 2 SB
- Dan Quinn (WSH) 2-3 Nick Sirianni (PHI), n=5, rate 0.400 — 2024-2025 WSH vs PHI; playoffs: 1 CCG
- John Harbaugh (NYG) 3-2 Mike McCarthy (PIT), n=5, rate 0.600 — 2009-2024 BAL vs DAL/GB
- Mike Macdonald (SEA) 3-2 Sean McVay (LAR), n=5, rate 0.600 — 2024-2025 SEA vs LAR; playoffs: 1 CCG
- Mike Macdonald (SEA) 3-2 Kyle Shanahan (SF), n=5, rate 0.600 — 2024-2025 SEA vs SF; playoffs: 1 Div
- Todd Bowles (TB) 2-3 Dan Campbell (DET), n=5, rate 0.400 — 2015-2025 NYJ/TB vs DET/MIA; playoffs: 1 Div; includes 2015 MIA (Campbell interim) vs NYJ
- Zac Taylor (CIN) 3-2 Mike Vrabel (NE), n=5, rate 0.600 — 2020-2025 CIN vs NE/TEN; playoffs: 1 Div
- Andy Reid (KC) 2-2 Mike Vrabel (NE), n=4, rate 0.500 — 2019-2022 KC vs TEN; playoffs: 1 CCG
- Dan Campbell (DET) 2-2 John Harbaugh (NYG), n=4, rate 0.500 — 2015-2025 DET/MIA vs BAL; includes 2015 MIA (Campbell interim) vs BAL
- Dan Campbell (DET) 2-2 Sean McVay (LAR), n=4, rate 0.500 — 2021-2025 DET vs LAR; playoffs: 1 WC
- John Harbaugh (NYG) 2-2 Sean McVay (LAR), n=4, rate 0.500 — 2019-2025 BAL vs LAR
- Mike McCarthy (PIT) 2-2 Sean McVay (LAR), n=4, rate 0.500 — 2018-2023 DAL/GB vs LAR
- Todd Bowles (TB) 2-2 Nick Sirianni (PHI), n=4, rate 0.500 — 2023-2025 TB vs PHI; playoffs: 1 WC

## Small samples kept on the sheet (`n < 4`)

178 pairs are stored so the desk can print “2-1, n=3, no number.” Not listed in full here. The JSON has every sourced meeting of at least one decided game.

Omitted (no SU winner): Matt LaFleur vs Brian Schottenheimer, 2025-09-28 GB @ DAL, 40-40 tie.

## Five “has his number” examples

- **Matt LaFleur (GB) 5-0 Sean McVay (LAR) — n=5, pts +0.62 — 2020-2024 GB vs LAR; playoffs: 1 Div; includes 2020 NFC Divisional**
- **Andy Reid (KC) 5-0 Kyle Shanahan (SF) — n=5, pts +0.62 — 2018-2024 KC vs SF; playoffs: 2 SB; includes Super Bowl LIV and LVIII**
- **Andy Reid (KC) 8-2 John Harbaugh (NYG) — n=10, pts +0.60 — 2008-2025 BAL vs KC/PHI; playoffs: 1 CCG; includes 2023 AFC Championship**
- **Jim Harbaugh (LAC) 4-0 Mike McCarthy (PIT) — n=4, pts +0.50 — 2012-2013 SF vs GB; playoffs: 1 WC, 1 Div**
- **DeMeco Ryans (HOU) 5-1 Shane Steichen (IND) — n=6, pts +0.50 — 2023-2025 HOU vs IND**

## Method notes

- Book is **SU**. Closing lines exist in the same games file; they were not turned into a coach ATS record because that would be a derived book, not a published H2H.
- `a` is alphabetical by last name, then first name (Jim Harbaugh before John Harbaugh). Each pair is stored once. Desk flips the sign when the other coach is home.
- nflverse 2026 *schedule* rows still name some fired 2025 coaches; those future games have no scores and were ignored. 2026 HCs come from Wikipedia / ESPN / club hire stories, not from the 2026 schedule file.
- Cross-checks: McVay–Shanahan 8-11 matches the [SF Chronicle 2026 tally](https://www.sfchronicle.com/sports/49ers/article/49ers-shanahan-vs-rams-mcvay-next-chapter-22244810.php) after the 2025 rematch; LaFleur–McVay 5-0 matches [SI](https://www.si.com/nfl/rams/onsi/los-angeles-sean-mcvay-training-camp-liam-coen-jacksonville-jaguars) (includes the 2020 Divisional); Reid–John Harbaugh 8-2 is the SI 7-2 plus the 2025 BAL@KC game.


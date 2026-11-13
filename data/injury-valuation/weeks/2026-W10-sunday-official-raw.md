# Week 10 Sunday card — Friday FINAL scrape notes

Pulled 2026-11-13 4:27 PM ET (America/New_York). ESPN injuries API (timestamp 2026-11-13T21:24:00Z) used as primary after the official ~4:00 p.m. ET Friday Game Status report, cross-checked against official club injury reports (<club>.com/team/injury-report via curl). NFL.com reg10 page Game Status was populated only for NE/DET/IND (+ TNF leftovers) at pull.

- Club Friday Game Status posted: NE, DET, KC, ATL, HOU, CLE, MIN, JAX, TEN, MIA, IND, CAR, NO, BUF, NYJ, PIT; CIN partial.
- UNSPECIFIED at pull (ESPN tags as-is): GB, ARI, LAR, SEA, LV, SF, DAL, BAL, LAC.
- MIN: Kyler Murray OUT (DNP x3), Hockenson/Jennings/Cashman/Ingram-Dawkins OUT; Addison/Metellus/Van Noy Q; Wentz cleared.
- HOU: Hunter, Al-Shaair, Harrison Jr., Jordan, Rutledge OUT; Anderson Jr., Trent Brown, Teller, Montgomery Q.
- TEN: Tate, Skoronski, Barton, Hill Jr., Jaylon Jones, Townsend OUT.
- NE: A.J. Brown Q (LP x3); Henderson, Ben Brown, Carlton Davis OUT. DET: Joseph, Mays, Reed OUT; St. Brown Q.
- BUF: Spencer Brown D; Dawkins/McGovern/Shavers no status. KC: Moore, Woods, Norman-Lott OUT; Mahomes FP x3.
- Official overrides applied: 55 (see 2026-W10-sunday.json).

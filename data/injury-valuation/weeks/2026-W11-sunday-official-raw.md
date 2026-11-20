# Week 11 Sunday card — Friday FINAL scrape notes

Pulled 2026-11-20 ~4:17-4:20 PM ET (America/New_York). ESPN injuries API (timestamp 2026-11-20T21:17:17Z) used as primary after the official ~4:00 p.m. ET Friday Game Status report, cross-checked against official club injury reports (<club>.com/team/injury-report via curl). NFL.com reg11 page Game Status was blank for every Sunday/SNF/MNF club at pull (only TNF IND/HOU populated), so club sites were the official fallback.

- Club Friday Game Status posted: ARI, KC, BAL, CAR, JAX, NYG, MIA, BUF, MIN, NO, CHI, NYJ, PIT, TB, DET, TEN; DAL and PHI partial.
- UNSPECIFIED at pull (ESPN tags as-is): DEN, LV, LAC, SF; CIN/WSH (MNF, Saturday report).
- QBs: MIN Kyler Murray OUT (Cousins starts); TB Baker Mayfield Q (DNP/LP/LP); ARI Carson Beck Q (back), Josh Johnson expected to start; SF Mac Jones (backup) Q illness; NYJ Geno Smith no designation; CIN Burrow illness, MNF report Saturday.
- BAL: Madubuike, Humphrey, Hawkins OUT. PHI: Baun OUT, Mondon D, Wicks OUT. KC: Trey Smith, Jaylon Moore, Kenneth Walker III OUT. BUF: Benford, D. Williams OUT, Kincaid D.
- JAX: eight Thursday Questionables carry no Friday status (cleared). NO: Justin Reid OUT (personal) added; McCoy/Fuaga/Richards/Emerson OUT.
- Official overrides applied: 34 (see 2026-W11-sunday.json).

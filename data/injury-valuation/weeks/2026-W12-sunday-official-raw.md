# Week 12 Sunday card — Friday FINAL scrape notes

Pulled 2026-11-27 ~4:20-4:35 PM ET (America/New_York). ESPN injuries API (timestamp 2026-11-27T21:34:25Z) used as primary after the official ~4:00 p.m. ET Friday Game Status report, cross-checked against official club injury reports (<club>.com/team/injury-report via curl; home club page carries both teams). NFL.com reg12 page Game Status was blank for every Sunday/SNF/MNF club at pull (only the Wed/Thanksgiving/Black Friday clubs populated), so club sites were the official fallback.

- Club Friday Game Status posted: IND, NYG, MIA, MIN, ATL, JAX, TEN, ARI, NE. Partial: CIN (Higgins Q, J. Davis D, Iosivas Q, Risner OUT), HOU (Boutte, Hunter, B. Jordan, Rutledge OUT; Hummel Q), WSH (Robertson OUT), NYJ (Cooper OUT; Onyemata, H. Phillips, Sweat Q).
- UNSPECIFIED at pull (ESPN tags as-is): CLE, LV (SNF), SF, SEA, LAC, BAL, NO; CAR/TB (MNF, Thu-Sat schedule, Saturday report).
- QBs: NE Drake Maye OUT (DeVito); ARI Carson Beck OUT, Josh Johnson starts; SF Brock Purdy Q (DNP Wed/Thu, not seen Fri); LAC Justin Herbert Q (concussion, DNP Wed/Thu, not seen Fri; DJ Uiagalelei next per ESPN); MIN Kyler Murray no Friday status (FP Fri); SEA Darnold active.
- Official overrides applied: 23 (see 2026-W12-sunday.json).
- Kick times corrected in nfl-2026.json: LV@CLE SNF 8:20 PM ET; NE@LAC 4:05 PM ET; TEN@JAX 1:00 PM ET.

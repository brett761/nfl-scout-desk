# Injury valuation learning log — 2026

Track whether projected injury points improve margin error.

## 2026-W10 — 2026-11-17

**Games with injury stack at lock:** 14/14 (injuries 11-11b TNF; 11-14a Munich + Sunday at the 7:53 AM freeze; 11-15a SNF; 11-16a MNF). Non-zero term in 13 (NE@DET netted 0). The term reduced error in **6** of 13 live and **6** under the shrunk base. W10 MAE with injury 10.14, without 10.18. Shrunk base: 12.77 with, 12.74 without. W2–W10 pool (n=134): live 10.478 with vs 10.485 without (66/132 helped); shrunk 10.05 vs 10.10. About neutral; the W9 "≥55% through W10" confirm rule was not met.

### Findings
- **QB1 OUT floor still missing: Kyler Murray (MIN) priced 0.28 again** (Madden auto) on 11-14a. This week MIN won 30–10 with Cousins, so a 1.5 floor would have added ~1.2 of error. It's still a consistency bug: fix it regardless of one result.
- **QB1 OUT backups: 2/4 vs close.** SEA (Lock for Darnold, 1.5) won by 8 and covered −6.5 (Lock 2/2). MIN (Cousins) won by 20 as a 2.5-pt dog. NYG (McCarthy for Dart, IR term 0.53) lost by 3 at −1.5; B$ had NYG −7.5. BAL (Brissett for Lamar, IR 1.5 cap) lost by 3 at −3.5; B$ had BAL −8.5. MIA (McCord, Willis IR, no live term) excluded. **W3–W10: 10/23.**
- **New multi-game pattern (n=3, same direction):** when the model is ≥5 pts more bullish than the close on a team starting a backup QB, that team is 0/3 straight-up (W9 MIN −4.7 vs +3.5; W10 NYG −7.4 vs −1.5; W10 BAL −8.7 vs −3.5). The market prices the QB loss harder than our cap plus decayed IR term. **Emerging signal**, confounded with the rating (it hasn't absorbed the backup's games).
- **Clusters ≥1.5 (live):** HOU@CLE (+2.90; HOU Hunter, Al-Shaair, MHJ OUT) helped 2.9 as CLE won outright; BUF@NYJ (−1.80; NYJ WR/EDGE/CB Qs) helped; WSH@NYG (+1.50) hurt 1.5; SEA@LV (+3.02; Darnold plus Nelson OG, L. Williams IDL) hurt 0.5. JAX@TEN (TEN OL/LB OUTs, −1.40) helped. Big terms pool 18/39. **Insufficient evidence.**
- **Q designations (0.35):** non-OL Q rows with impact ≥0.2 showed box stats in **35/44 (80%)** vs 65% implied. Two no-stat Qs (Walker KC, Montgomery HOU) went OUT on 11-15a after the freeze; others without stats: Addison, Metellus (MIN), Garrett (LAR), Nahshon Wright, Ossai, Omar Cooper Jr. (NYJ), Darrell Baker Jr. (MIA). OL Qs (5) can't be checked by box stats. W6–W10 **100/149 (67%)**: 0.35 still calibrated. **Emerging signal.**
- **Doubtful = 1.0:** 11/11 Doubtful rows recorded no stats (incl. Deablo, Zaire Franklin, Mike Jackson, Spencer Brown, Iosivas, Jalen Davis). **25/25** (W4, W6–W10). Keep.
- **Late pull after the lock, third straight week:** 11-15a (10:09 AM) after the 7:53 AM freeze.
- **Variance:** GB 4 TO, in-game QB injuries to Drake Maye (NE) and Geno Smith (NYJ).

### Positional baselines
- **No `historical_adjustments` written.** The backup-QB pattern is multi-game (3, one direction), but it's a cap/decay vs rating interaction, not a QB1 baseline shift, and it goes to a Sandmoney replay first. Q and Doubtful support the current status priors. Nothing else is multi-game in one direction. `positional-values.json` got only a `last_postmortem_review` stamp.

### Process recommendations (not weight edits)
1. Land the QB1-OUT floor (two weeks running).
2. Re-freeze Sunday locks after the late-morning pull when any priced row flips (three weeks running).
3. Sandmoney: replay the 23 QB1-OUT games at card value, with an IR hold-until-absorbed variant, and test a PASS flag for "model ≥5 above close on a backup-QB team".
4. Tag in-game QB injuries (Maye, Geno Smith) as variance.

### What would confirm/falsify
- **IR hold / cap too small:** replay beats live by ≥0.5 pts/game on the 23-game set.
- **Injury layer earns its keep:** ≥55% help in W11; falsified at <50% for a second straight week.
- **Q 0.35 too high:** >75% play rate at n≥200.

## 2026-W09 — 2026-11-10

**Games with injury stack at lock:** 15/15 (injuries 11-04b TNF; 11-07a Madrid + Sunday at the 8:10 AM refresh; 11-08a SNF; 11-09a MNF). The term reduced error in **8** games on the live line and **10** under the shrunk base. W9 MAE with injury 7.82, without 8.17. Shrunk base: 11.46 with, 11.67 without. W2–W9 pool (n=120): live 10.52 with vs 10.52 without; shrunk 9.73 vs 9.79. Third straight week ≥60% help under the shrunk base (64%, 64%, 67%).

### Findings
- **QB1 OUT valuation bug: Kyler Murray (MIN).** Ruled OUT Saturday, priced **0.28** (Madden auto: the drop to Wentz looked small on ratings). Wentz went 8/25 and BUF won 23–6. At a 1.5 QB1 value the B$ line moves ~1.2 toward BUF (MIN −3.5), still the wrong side, so it explains part of the 21.7 error. **Process fix:** QB1 OUT should never price below the QB1 baseline.
- **QB1 OUT backups: 1/3 vs close.** SEA (Lock for Darnold, 1.5 manual) won by 14 and covered −9.5. BAL (Fagnano for Lamar, 1.5) lost by 23 as a 9.5-pt dog; the model was closer than the market. MIN (above) lost by 17. NYG@PHI had backups on both sides (Dart IR 0.53, Hurts IR 0.78) and is excluded; NYG won by 8. **W3–W9: 8/19.** IR terms keep fading. **Emerging signal.**
- **Clusters ≥1.5 (live):** DET@MIA (DET defensive OUTs, +2.31) helped; NYG@PHI (PHI WR room, −2.43) helped; JAX@BAL (Lamar plus depth, −3.09) helped; LV@SF (SF Evans/CMC/Deebo Q, −2.14) hurt as SF won by 21 with LV −5 TO. Big terms pool 16/35. **Insufficient evidence.**
- **Q designations (0.35):** non-OL Q rows with impact ≥0.2 showed box stats in 19/32 (59%); three of the 13 no-stat rows (Ossai, Nahshon Wright, Haulcy) went OUT on 11-08a after the lock, so 19/29 = **66%** vs 65% implied. Pickens and McDuffie (Q) showed no stats. **Emerging signal** that 0.35 is calibrated.
- **Doubtful = 1.0:** Thompson, Awosika, Cardona, Skattebo no stats. **14/14** (W4, W6–W9). Keep.
- **Late pull after the lock, second straight week:** 11-08a (10:06 AM) flipped three priced Qs to OUT after the 8:10 AM freeze.
- **Variance:** NE 4 TO (GB@NE), LV 5 TO, CHI 5 TO in a win, MIN 3, BAL 3.

### Positional baselines
- **No `historical_adjustments` written.** The QB1 evidence is a floor/valuation bug (n=1) plus the cap/decay question (8/19), not a positional baseline shift. Q and Doubtful support current status priors. Nothing else is multi-game in one direction.

### Process recommendations (not weight edits)
1. QB1-OUT floor: a QB1 ruled OUT prices at no less than the QB1 baseline (1.5 cap or card value), whatever the Madden diff says.
2. Re-freeze Sunday locks after the late-morning pull when any priced row flips.
3. Sandmoney: replay the 19 QB1-OUT games at card value and with a hold-until-absorbed IR term.

### What would confirm/falsify
- **Injury layer earns its keep:** ≥55% help under the shrunk base through W10 (on pace).
- **Cap/decay too small:** card-value or hold-until-absorbed replay beats the live term by ≥0.5 pts/game on the 19-game set.
- **Cluster damping:** ≤35% help at n≥15.

## 2026-W08 — 2026-11-03

**Games with injury stack at lock:** 14/14 (injuries 10-28b TNF; 10-31a Sunday at the 8:01 AM refresh; 11-01a SNF; 11-02a MNF). The injury term reduced error in **8** games on the live line and **9** under the shrunk base. W8 MAE with injury 12.13, without 12.32. Under the shrunk base (rating 0.25×, pff_ytd 0): 11.33 with, 11.41 without. W2–W8 pool (n=105): live 10.90 with vs 10.86 without; shrunk 9.49 with vs 9.53 without. A small positive under the shrunk base for the second straight week (64% both weeks).

### Findings
- **QB1 OUT: one case, and it failed again.** PHI (Hurts IR, McKee's fourth start) lost 27–10 at WSH. The Hurts term is now **0.79** (1.3 in W7), and B$ had WSH −1.5 vs a −5.5 close. With McKee, PHI has lost by 11, 17 and 17. The term is fading faster than the team rating absorbs the loss. **W3–W8 backup side covered 7/16.** **Emerging signal** (stronger) that the cap and decay under-price a QB-built rating. BAL is excluded: Lamar was cleared Friday, started, and left after one throw (IR Monday). That's in-game variance.
- **Late pull after the lock:** 11-01a (10:04 AM Sunday) moved NE A.J. Brown and TreVeyon Henderson, KC Mansoor Delane and L'Jarius Sneed, and ATL Billy Bowman Jr. and Divine Deablo from Q to OUT/IR after the 8:01 AM freeze. No QB1 changed, so the W7 re-freeze rule didn't fire. Each affected team was off by about 0.3–0.5 pts. NE won anyway.
- **Non-QB clusters ≥1.5 (shrunk base):** LV@NYJ (NYJ front seven + RT) helped. NE@MIA (NE A.J. Brown/Henderson/Davis Q) hurt; NE won by 5. Terms of 1.3–1.4 also hurt in KC@DEN (DEN won) and MIN@DET (DET won). **W4–W8: 5/12 = 42%.** **Insufficient evidence.**
- **Q designations (0.35):** non-OL Q rows with impact ≥0.2 recorded box stats in **25/36 (69%)** vs 65% implied. Five of the 11 no-stat rows went OUT/IR post-lock. Skill-position Qs (Pickens, Waddle, DJ Moore, Kincaid, Meyers, McDuffie) all played. W6–W8: 46/73 (63%). **Emerging signal** that 0.35 is calibrated.
- **Doubtful = 1.0:** David Bailey (NYJ) recorded no stats. W4/W6/W7/W8 **10/10**. Supports the live rule.
- **Variance:** ATL 4 TO (ATL@TB), BAL 3 TO plus the in-game QB injury, IND 3 TO, CIN 4 TO in a win. Not injury stories.

### Positional baselines
- **No `historical_adjustments` written.** The QB1 evidence is multi-game (PHI ×3, BAL ×2 earlier), but it's a cap, decay and rating interaction rather than a positional baseline, and the 16-game set is 7/16. It goes to a Sandmoney replay first. Q and Doubtful support the current status priors. Nothing else is multi-game in one direction.

### Process recommendations (not weight edits)
1. **Re-freeze Sunday locks after the late-morning pull when any priced row flips,** not only on QB1 changes.
2. Sandmoney: replay the 16 QB1-OUT games (W3–W8) at card value vs the 1.5 cap. Add a variant that holds the IR term until the rating has absorbed the starter's loss.
3. Tag in-game QB injuries (Lamar W8) as variance in the ledger.
4. Keep Doubtful = 1.0 and Q = 0.35. Pull snap counts to check Q properly.

### What would confirm/falsify
- **Cap/decay too small:** a card-value or hold-until-absorbed replay beats the live term on the 16-game set by ≥0.5 pts/game.
- **Cluster damping:** ≤35% help at n≥15.
- **Injury layer earns its keep:** ≥55% help under the shrunk base through W10 (W7 64%, W8 64%).

## 2026-W07 — 2026-10-27

**Games with injury stack at lock:** 14/14 (injuries 10-21b TNF; 10-24a Dublin + Sunday PM at the 7:56 AM refresh; 10-25a SNF; 10-26a MNF). The injury term reduced error in **9** games and added error in **5**. W7 MAE with injury 13.16, without 13.40. Under the shrunk base (rating 0.25×, pff_ytd 0) it helped the same 9/14 (11.05 with, 11.49 without). W2–W7 pool (n=91): live 10.72 with vs 10.63 without; shrunk 9.21 with vs 9.24 without. Overall: about neutral, and this week it helped.

### Findings
- **QB1 OUT, three cases. Backups 1/3, and the same two teams failed again.** BAL: Lamar was **Q at the 7:56 AM lock** (priced 0.53). He was ruled OUT at 10:10 AM (10-25a), and the Sunday PM locks were not re-frozen. CIN won 35–13 at BAL, and the market had moved from BAL −3.5 to CIN −3. Even re-priced as OUT at the 1.5 cap, B$ would still have had BAL as a ~3-pt favorite, so the card's 4–7 range was closer. PHI (Hurts IR, McKee) lost 38–21 at home, and the 1.3 term left PHI near a pick'em vs a DAL −4.5 close. NYG (Dart IR, McCarthy) won 27–21 at HOU as a 10-pt dog. The model (HOU −6) beat the market there. **W3–W7 backup side covered 7/15.** BAL and PHI have now flopped two weeks running with team ratings built around the QB1. **Emerging signal** that the cap under-prices when the starter built the rating. Overall direction is still mixed, so no baseline edit.
- **Non-QB clusters ≥1.5 (shrunk base):** NE@CHI (NE OL + CB room) helped, IND@MIN (Gardner, Warren, Gould) helped, LAR@LV (Garrett IR, Landman, McDuffie/Nacua Q) hurt, since LAR won by 14. **W4–W7: 4/10 = 40%**, above the ≤35% damping trigger. Downgraded to **Insufficient evidence**.
- **Q designations (0.35):** non-OL Q rows with impact ≥0.2 recorded box stats in **15/28 (54%)** vs 65% implied. Defenders can play without recording a stat, so this is a floor. Skill-position Qs (Nacua, Saquon, Mayfield, Dowdle) all played. Lamar's Q turned into an OUT. **Insufficient evidence.** Needs snap counts.
- **Doubtful = 1.0:** T.J. Edwards, Theo Johnson and Robert Beal Jr. recorded no stats. W4/W6/W7 **9/9**. Supports the live rule.
- **Safeties OUT:** TB (Winfield), DEN (Hufanga) and DET (Kerby Joseph) all won. No signal at n=3.
- **Variance:** TB@CAR (CAR 4 TO, 40.8 error) and SF@ATL (SF 4 TO) were not injury stories.

### Positional baselines
- **No `historical_adjustments` written.** The QB1 read is multi-game (BAL ×2, PHI ×2), but it's a cap/rating interaction rather than a positional baseline, and the 15-game set is 7/15. It goes to a Sandmoney replay first. The cluster read weakened. Nothing else is multi-game.

### Process recommendations (not weight edits)
1. **Re-freeze any game whose QB1 status changes before kick.** CIN@BAL was graded on a lock that still had Lamar Q.
2. Sandmoney: replay the 15 QB1-OUT games (W3–W7) at card value vs the 1.5 cap, with and without the rating shrink. Add a "rating built with QB1" scaler as a variant.
3. Keep Doubtful = 1.0 and Q = 0.35. Pull snap counts to check Q properly.

### What would confirm/falsify
- **Cap too small:** the card-value replay beats the cap on the 15-game set by ≥0.5 pts/game.
- **Cluster damping:** ≤35% help at n≥15.
- **Injury layer earns its keep:** W8 helps ≥60% again (W7 was 64%).

## 2026-W06 — 2026-10-20

**Games with injury stack at lock:** 14/14 (injuries 10-14b TNF; 10-17a Sunday AM refresh; 10-18a SNF; 10-19a MNF). Injury term reduced error in **7** and added error in **7**. W6 MAE with injury 9.16, without 8.90. W2–W6 pool (n=77): removing injury lowers MAE slightly on the live line (10.27 → 10.13), but **with the rating shrunk first it's neutral** (8.87 with, 8.83 without, 8.83 at half). Big terms ≥1.5 helped 10/25 under the shrunk base.

### Findings
- **QB1 OUT, three cases — backups 0/3, injury card closer each time:** BAL (Lamar OUT, Huntley) lost 13–10 at CLE as a 3-pt fav; B$ had BAL −7.5 and the Friday card flagged it as "a cap artifact." PHI (Hurts OUT, McKee) lost 25–14 at home as a 3-pt dog. TB (Mayfield OUT, Jalon Daniels) lost 26–19 to PIT as a 2.5 dog. This reverses W5 (backups 3 of 4 fine). **W3–W6 cumulative: backup side covered 6/12.** **Insufficient evidence** either way. Mechanism to test: the team rating was built with QB1 playing, so a 1.5 cap leaves most of his value in (BAL rating edge +5.81 with Lamar out).
- **Non-QB clusters ≥1.5 (W4–W6, shrunk base): helped 2/7.** DAL@GB (GB Parsons/Hargrave/Jacobs OUT; GB won by 10) and HOU@JAX (HOU Montgomery/Pitre OUT; HOU won) went the wrong way this week; NE@BUF, LV@NE (NE CB room) and LAC@SEA earlier; DEN@LAC and LAC@KC helped. Five teams, so it's no longer an NE quirk. **Emerging signal** of over-weighting stacked non-QB outs.
- **Q designations (0.35):** box-score check 6/9 Q players played (Caleb, Evans, Henderson, Moss, Metcalf, Dowdle; no stats for Saquon, Bosa, Warren) vs 65% implied. Calibrated. Caleb Q at 0.525 against CHI was an overprice — he went 30/36 and CHI won by 8.
- **Doubtful = 1.0:** Jalyx Hunt, Benjamin Morrison, Marques Sigle recorded no stats (Freeling OT not verifiable). W4 + W6 non-OL: **6/6** sat. Supports the live rule.
- **OT cluster, CAR:** Moton and Ekwonu OUT, Freeling D (manual 0.5, unit interaction) — CAR still won by 11 at PHI. One game; the QB-out on the other side dominated. **Insufficient evidence.**

### Positional baselines
- **No `historical_adjustments` written.** The QB1-OUT evidence is now 6/12 (no direction). The non-QB cluster read is multi-game (n=7, five teams) but entangled with the rating overscale, and it's a size/stacking question rather than one position's baseline. Logged as Emerging; revisit at n≥10.

### Process recommendations (not weight edits)
1. Sandmoney: replay the 12 QB1-OUT games (W3–W6) at card value vs the 1.5 cap, with and without the rating shrink.
2. Sandmoney: test a stacking damper on non-QB team terms above ~1.5 once n≥10.
3. Keep the inactives-time Q refresh, knowing it cuts both ways (Caleb played W6).
4. Keep Doubtful = 1.0 and Q = 0.35.

### What would confirm/falsify
- **Cap too small:** card-value replay beats the cap on the 12-game set by ≥0.5 pts/game.
- **Cluster damping:** ≤35% of non-QB ≥1.5 terms help at n≥10.
- **Falsify:** W7–W8 injury term reduces error in ≥60% of games under the shrunk base.

## 2026-W05 — 2026-10-13

**Games with injury stack at lock:** 15/15 (injuries 10-07b TNF; 10-10a Sunday AM; 10-11a SNF; 10-12a MNF). |injury_home_minus_away|≥2: **2** (LV@NE −2.97, BAL@ATL +2.09), injury term added error in **both**. Across the slate the term reduced error in **5** and added error in **10**. W5 MAE with injury 11.76, without 11.20. W2–W5 pool (n=63): removing injury now **lowers** MAE slightly (10.52 → 10.40) — flipped from W4's small positive. |inj|≥2 across W2–W5: helped **5/14**.

### Findings
- **QB1 OUT, W5 four cases — market over-moved:** BAL (Lamar OUT, Huntley) won 30–23 as a 3-pt road dog; the desk's 1.5 cap kept BAL a slight favorite and was closer than the market (BAL −3.5 Monday → ATL −3) and far closer than the injury card's 4–7 pt range. TB (Mayfield OUT, Jalon Daniels) won 24–16 at DAL as an 8.5 dog — second competitive week from that backup. NYG (Dart IR, Winston) tied 27–27 as a 3.5 dog. CHI (Caleb Q, did not play) lost by 24 with 5 turnovers. **W3–W5 cumulative n=9: backup side fine in 6.** **Emerging signal** that the 1.5 cap is not too small; do not raise it toward full-valuation ranges.
- **QB Questionable at the Sunday AM freeze:** Caleb priced Q 0.35 × 1.5 = 0.525 at 7:57 AM; he sat. Second Caleb designation miss (W3 D→OUT). **Process** — refresh at inactives.
- **CB cluster, NE:** term −3.96 at lock (league-largest; CB room out). NE won 45–17. W4 NE (Gonzalez CB1 OUT cluster) also the biggest term, NE won outright at BUF. **Insufficient evidence** — one team, two games; no CB baseline change. Watch for a non-NE CB cluster case.
- **LAC (−3.93) vs DEN:** term pointed toward DEN, DEN won by 6 — injury helped (+1.98). Offsets NE as a "big term" example.
- **Doubtful = 1.0:** W5 Doubtful rows were mostly interior OL (GB Banks/Monk) — not verifiable from box score. No new evidence either way.
- **Status parsing:** a couple of rows read OUT/IR against notes that said questionable or full practice (CHI Kyler Gordon CB1, HOU Braden Smith RT). Small point values, but audit the parser.

### Positional baselines
- **No `historical_adjustments` written.** The multi-game QB1-OUT evidence (n=9) argues for *no change* (keep cap 1.5). CB cluster evidence is single-team. Nothing else is multi-game.

### Process recommendations (not weight edits)
1. Refresh QB Q/D tags at inactives for Sunday games and re-lock on a QB1 change.
2. Keep the 1.5 QB cap; when the injury card's range is far above it (Lamar 4–7), flag but don't override — W5 says the cap was right.
3. Audit status parsing for rows whose note contradicts the status.
4. Track big CB-cluster terms (≥0.75 combined) across teams to get beyond NE.

### What would confirm/falsify
- **Confirm cap OK:** market keeps over-moving on QB1 OUT through W8 (now 6/9).
- **Confirm injury overweight:** removing injury keeps lowering MAE through W8 *and* the excess is spread across teams/positions.
- **Falsify:** W6–W7 injury term reduces error in ≥60% of games.

## 2026-W04 — 2026-10-06

**Games with injury stack at lock:** 16/16. |injury_home_minus_away|≥2: **1** (LAC@SEA, lost to market); ≥1.5: **3** (IND@WSH, NE@BUF, LAC@SEA), beat market **0/3**. Per game the injury layer reduced error in 8 and added error in 7. Across W2–W4 (n=48) removing the injury layer raises MAE slightly (10.13 → 10.16): small positive value, not a reason to resize.

### Findings
- **QB1 OUT, three cases, mixed:** CHI (Caleb OUT −1.5, Bagent) won by 11 — the model was closer than the market. WSH (Daniels OUT −1.11, Kaliakmanis) lost by 17 in London — direction right, size small. TB (Mayfield OUT −1.5 cap, Jalon Daniels) lost 17–14 to GB, but the model still had TB −4.8 while the market had GB −2.5. Cumulative QB1-OUT read (W3–W4, n=5): the team lost or failed to cover in 2, was fine in 3. **Insufficient evidence** for a QB1 cap change.
- **QB1 mapping:** LAC "Trey Lance QB1 Q" was priced −0.52 but Justin Herbert played; LV "O'Connell QB1 Q" (−0.52) didn't appear and Kirk Cousins started. NE still carries A.J. Brown WR1 IR (flagged W2). **Process (seed/roster map)**, not a baseline issue.
- **Doubtful:** all 3 W4 Doubtful rows (Al-Shaair HOU, T.J. Sanders BUF, Cam Lewis CHI) recorded no box-score stats. Supports the Doubtful = 1.0 change already live from W5 (PR #21). n=3.
- **NE@BUF (+1.90):** NE term −2.72 (Gonzalez CB1 OUT, A.J. Brown IR, Q cluster); NE won outright. Injury stacked with rating/pff_ytd/sos in the same direction. **Possible oversize when stacked** — Insufficient.
- **LAC@SEA (+2.06):** direction OK (SEA won by 7) but part of a 20-pt projection; includes the Lance mapping error.
- **Freshness:** W4 pulls 09-30b (TNF), 10-03a (Sun AM refresh), 10-04a (SNF), 10-05a (MNF). Holding. The Sunday AM refresh wrote to the stale `/workspace/nsd` copy — copied into desk locks.

### Positional baselines
- **No `historical_adjustments` written.** QB1, CB1, WR1 still single-game / mixed / mapping-contaminated.

### Process recommendations (not weight edits)
1. Depth-chart audit of every team's QB1 tag before W5 freezes (LAC, LV first); fix NE A.J. Brown.
2. Keep same-day injury JSON before every freeze (holding).
3. Point the Sunday AM refresh at the desk locks folder.
4. When QB1 is OUT and the market moved ≥2 more than our term, flag the game for a manual look rather than auto-FIRE (GB@TB).

### What would confirm/falsify
- **Confirm QB1 cap too small:** ≥4 more clean (correctly mapped) QB1-OUT games where the market's move beats our term on margin.
- **Confirm Doubtful = 1.0:** Doubtful players keep sitting ≥85% through W8.
- **Falsify mapping alarm:** depth-chart audit shows LAC/LV tags were right.

## 2026-W03 — 2026-09-29

**Games with injury stack at lock:** 16/16 (full-slate freezes). Large |injury_home_minus_away|≥2: **1** game (SEA@WSH); model beat market on **0/1**.

### Findings
- **ATL@GB (−1.32):** GB OL/WR cluster (Reed/Banks/Bako/Brinson OUT; manuals). Actual ATL +21. Direction toward ATL OK; size tiny vs blowout; market also MAE 25.5. **Shared variance** — **Insufficient evidence** for RT/WR1 baseline cut.
- **SEA@WSH (−2.34):** Daniels OUT (manual 1.11). Model SEA by ~16 vs street ~8.5; WSH won 33–31. Injury contributed to falsified disagreement with prior/pff_ytd. **Possible oversize** when stacked with huge prior — still **Insufficient** for QB1 baseline cut (cap already 1.5 / manual 1.11).
- **PHI@CHI (−1.16):** Caleb priced Doubtful in Fri/WORKING-MON seeds; **OUT** at kick (Keenum started). CHI term −2.5 still left model/market on PHI; actual CHI +20. Designation process miss on full OUT; outcome also shows replacement/variance (Keenum ballgame). **Emerging process** — **no** QB1 baseline edit.
- **LAC@BUF (+1.65):** LAC IDL/OL outs. Actual BUF +8; model −14.71 vs close −7 (mkt MAE 1.0). Direction OK, **oversized** with pff_ytd +4. **Insufficient evidence.**
- **NE@JAX (+1.41):** toward JAX; JAX +29. Direction OK; both model/market undersized vs blowout.
- **Freshness:** W3 locks used same-day injury JSON (09-23b / 09-25b / 09-27a / 09-28a). Streak continues; QB D→OUT reconciliation is the remaining gap.

### Positional baselines
- **No `historical_adjustments` written.** Mixed / process-contaminated / single-game evidence only.
- QB1 / RT / WR1 / EDGE: **Insufficient evidence.**

### Process recommendations (not weight edits)
1. Keep same-day `injury-2026.json` before every freeze (holding).
2. At freeze, force QB1 Doubtful → confirm inactive/OUT (Caleb MNF lesson).
3. Align freeze scripts so FA/PFF-pre OFF matches site on all windows.
4. Continue logging material |inj_net|≥2 games (done in `injury-valuation/weeks/2026-W03.json`).

### What would confirm/falsify
- **Confirm QB D→OUT process:** ≥3 freezes where D pricing misses final OUT by ≥1.0 expected pts.
- **Confirm cluster size OK:** ≥4 more capped multi-OUT OL/DB clusters that beat market MAE.
- **Falsify freshness alarm:** Same-day pulls matching inactives for 4 straight weeks (W2–W3 holding; QB designation asterisk).

## 2026-W02 — 2026-09-22

**Games with injury stack at lock:** 16/16 (full-slate freezes). Large |injury_home_minus_away|≥2: **10** games; model beat market on **5/10** of those.

### Findings
- **DET@BUF (+5.18):** DET safety/OL cluster capped −6.0. Actual BUF +10. Model MAE **0.72** vs market 4.5. **Possible signal** for large confirmed-OUT / PUP clusters when status correct — still **n=1**.
- **PIT@NE (−4.78):** NE team term −6.0 (Davis OUT + WR1 IR seed + EDGE PUP). Actual NE +17. Disagreement falsified. **Investigate** whether AJ Brown IR on NE is a roster-map bug before any CB1/WR1 baseline cut.
- **WSH@DAL (+5.0):** Direction OK (DAL +17); model MAE 11.38 barely beat market — size maybe high, **Insufficient evidence**.
- **GB@NYJ (+2.21), CLE@TB (+2.8), LV@LAC (+2.79), PHI@TEN (+2.07), CIN@HOU (−3.56), NO@BAL (−2.76), JAX@DEN (−2.4):** Mixed; injury rarely the sole driver vs prior/FA/pff_ytd.
- **Freshness:** W2 locks used same-day injury JSON (09-16b TNF; 09-20a/b Sun; SNF/MNF). W1 stale-pull process gap largely closed.

### Positional baselines
- **No `historical_adjustments` written.** Mixed hit/miss on large swings; PIT case may be seed-contaminated; DET is single-game cluster evidence only.
- S / CB1 / WR1 / LT: **Insufficient evidence.**

### Process recommendations (not weight edits)
1. Keep same-day `injury-2026.json` before every freeze (holding).
2. Audit NE W2 lock roster mapping (AJ Brown on NE) before interpreting CB/WR baselines.
3. Continue logging material |inj_net|≥2 games in weekly injury-valuation file (done for W02).

### What would confirm/falsify
- **Confirm cluster size OK:** ≥4 more capped multi-OUT defensive-back / OL clusters that beat market MAE.
- **Confirm CB1/WR1 cut:** ≥5 clean (seed-verified) CB1 or WR1 OUT games where model overstates injury pts vs market/margin.
- **Falsify freshness alarm:** Same-day pulls matching inactives for 4 straight weeks (W2 started the streak).

## 2026-W01 — 2026-09-15

**Games with injury stack at lock:** NE@SEA, DEN@KC (n=2).

### Findings
- **NE@SEA:** Injury net +0.18 (near wash). **Insufficient evidence.**
- **DEN@KC:** Injury net −1.24 (toward DEN). Layer used seed pulled **2026-09-09d** for Sep 14 kick.
  - Josh Simmons priced **QUESTIONABLE** (0.35×) but was **OUT** → underweighted LT miss.
  - R Mason Thomas priced **Q** but was **active** → overweighted.
  - Marvin Mims priced **Q** but no game designation → overweighted.
  - Chamarri Conner **OUT** missing from layer.
- Outcome: KC won by 21 without Simmons. Injury direction favored DEN; wrong vs margin. Dominant issue is **stale status**, not LT baseline size.

### Positional baselines
- **No `historical_adjustments` written.** Single-game (and process-contaminated) evidence only.
- LT / EDGE / WR2: **Insufficient evidence.**

### Process recommendations (not weight edits)
1. Refresh `injury-2026.json` same day before each lock freeze.
2. At freeze, reconcile Q/OUT/Doubtful to expected inactives; full OUT = 1.0× impact.
3. Log realized active/inactive in weekly `injury-valuation/weeks/` file (done for W01).

### What would confirm/falsify
- **Confirm Q over/under systematic:** ≥6 Q rows across weeks where priced status ≠ realized active/inactive and |injury pts| ≥0.4.
- **Confirm LT baseline cut:** ≥5 LT OUT games where replacement holds and model overstates injury pts vs market/margin.
- **Falsify freshness alarm:** Same-day pulls matching inactives for 4 straight weeks.

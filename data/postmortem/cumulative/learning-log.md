# Cumulative model-learning log — 2026

Beliefs about each input. Updated every Tuesday postmortem.

## 2026-W11 (complete — MNF settled) — 2026-11-24

**Headline:** Model MAE **7.69** (n=13; official rounded 7.69) vs market MAE **7.92**. Beat the close by 0.23 and won **7/13** head-to-head; third straight week at or under the market. Model ATS at close 8–5. Signed bias in the home frame −6.43 (market −6.23); home teams 11–1 non-neutral. Fav-frame overprojection **−0.38**.
- Best: NYJ@LAC **0.64** (gap −6.6 confirmed), MIA@BUF 1.33, NO@CHI 1.82, ARI@KC 5.58 (gap +6.9, beat market by 6.9), TB@DET 3.95.
- Worst: MIN@SF **21.24** (Mexico City, agreement game), JAX@NYG 14.44, PIT@PHI 13.44 (gap −6.9 falsified), CIN@WSH 10.78 (MNF), TEN@DAL 10.20 (beat market).
- **Seventh blind test lost:** old standing shrink (rating 0.25×/pff_ytd 0) took W11 to **9.39** vs live 7.69. Third straight loss; seven-week net +2.0 against the shrink.
- **Injury layer:** helped 4/13 (7.69 with vs 7.03 without). Second week under 50%, so the W10 falsify rule is met. Pool W2–W11 70/145, 10.23 vs 10.18. Now a Sandmoney 0.5× decrease candidate (blind W11 0.5× 7.28). No live change.
- **Backup-QB games:** model 0/6 ATS when a QB1 is OUT/IR and |gap|≥3 (W9–W10 too bullish on the backup, W11 too bearish on PHI, NYG, BAL). Backup sides W3–W11 13/27.
- **HFA:** home 11–1 swung W2–W11 home margin to +0.40 (n=139); back to Insufficient.
- **Shadow (post-window, scratch-graded W11):** W11 7.42 vs official 7.69; W5–W11 9.92 vs 10.30 (ATS 39–51–9 vs 46–50–3). KEEP TESTING.
- **Closes:** no repo closes/2026-w11.json yet; DK pickcenter post-final closes pulled directly and saved to desk closes/2026-w11.json (matches pull_closes.mjs).
- **No numeric weight edits.**

### Belief deltas
| Feature | Prior (W10) | Now | Label |
|---|---|---|---|
| Team-rating shrink | Insufficient (two blind losses) | Third blind loss; net +2.0 against over seven | Insufficient evidence |
| pff_ytd | Insufficient (decrease withdrawn) | W11 prefers 1.0 again | Insufficient evidence |
| Extreme \|gap\|≥8 | Strong (3/17) | No W11 game; 3/17 | **Strong signal** |
| Mid-gap (3–8) | Insufficient (29/60) | 32/66 | Insufficient evidence |
| QB1 OUT / backup-QB games | Emerging (10/23; 0/3) | 13/27; model 0/6 ATS at \|gap\|≥3 | **Emerging signal** |
| Injury layer | Emerging (on watch) | 4/13; falsify rule met; pool slightly negative | **Emerging signal (decrease candidate, Sandmoney 0.5×)** |
| Stacked injury clusters | Insufficient | BAL@CAR, PIT@PHI hurt ~2.7 each; 18/42 | Emerging signal (over-weight) |
| HFA 2.0 | Emerging (−0.57, n=127) | +0.40 (n=139) | Insufficient evidence (down) |
| Q = 0.35 | Emerging (67%) | W6–W11 66% | Emerging signal |
| Doubtful = 1.0 | Emerging (25/25) | 29/29 | Emerging signal |
| DVOA blend shadow | KEEP TESTING | W5–W11 9.92 vs 10.30; ATS worse | KEEP TESTING |
| Numeric weights / baselines | No edits | **No edits** | Strong (process) |

### What would change minds
- **Injury 0.5×:** promote to a Brett decision only if the 2021–25 Sandmoney replay or W12–W13 blind shows 0.5× at least 0.1/game better; drop the idea if W12 helps ≥60% live.
- **Backup-QB flag:** confirm if deferring to the close / PASS at |gap|≥3 with a QB1 OUT/IR beats the live line by ≥0.5/game on the 27-game replay; falsify if the next three such games go the model's way.
- **HFA:** promote a cut only if home margin is <1.0 at n≥150 and the backtest agrees.

## 2026-W10 (complete — MNF settled) — 2026-11-17

**Headline:** Model MAE **10.14** (n=14; official rounded 10.18) vs market MAE **10.25**. Beat the close by 0.11 and won **8/14** head-to-head. Signed bias in the home frame +3.44 (market +3.75); home teams 3–10 non-neutral. Fav-frame overprojection **−2.30** (the model's big favorites were right again: JAX, KC, LAR).
- Best: SF@DAL **0.11**, JAX@TEN 1.24 (gap −7.7 confirmed), SEA@LV 1.77, CAR@NO 2.90, MIA@IND 3.40.
- Worst: MIN@GB **21.80** (GB 4 TO), NE@DET 20.13 (Maye hurt in game), PIT@CIN 19.15 (SNF, straight miss), LAR@ARI 15.28, KC@ATL 13.93 (last two beat market).
- **Sixth blind test lost:** standing shrink (rating 0.25×/pff_ytd 0) took W10 to **12.77** vs live 10.14. Second straight loss, so the W9 falsify rule is met. Six-week net +0.3 against the shrink.
- **Backup-QB favorites:** model ≥5 above the close on a backup-QB team is 0/3 straight-up (W9 MIN, W10 NYG, BAL).
- **Shadow (post-window, scratch-graded W10):** W10 10.64 vs official 10.18; W5–W10 10.30 vs 10.69. KEEP TESTING.
- **Closes:** no repo closes/2026-w10.json yet; DK pickcenter post-final closes pulled directly.
- **No numeric weight edits.**

### Belief deltas
| Feature | Prior (W09) | Now | Label |
|---|---|---|---|
| Team-rating shrink | Emerging (first blind loss) | Second blind loss; net +0.3 against over six | **Insufficient evidence** (downgraded) |
| pff_ytd | Insufficient (decrease on hold) | W10 prefers 1.0 again; decrease withdrawn | Insufficient evidence |
| Extreme \|gap\|≥8 | Strong (3/17) | No W10 game; 3/17 | **Strong signal** |
| Mid-gap (3–8) | Insufficient (26/53) | 29/60 | Insufficient evidence |
| QB1 OUT cap / IR decay | Emerging (8/19) | 10/23; backup-QB favorites 0/3 | **Emerging signal** |
| HFA 2.0 | Insufficient (+0.27, n=114) | −0.57 (n=127) | **Emerging signal** (up) |
| Injury layer | Emerging (keep) | 6/13; pool flat 66/132 | Emerging signal (on watch) |
| Q = 0.35 | Emerging | W6–W10 67% | Emerging signal |
| Doubtful = 1.0 | Emerging (14/14) | 25/25 | Emerging signal |
| DVOA blend shadow | KEEP TESTING | W5–W10 10.30 vs 10.69; ATS worse | KEEP TESTING |
| Numeric weights / baselines | No edits | **No edits** | Strong (process) |

### What would change minds
- **HFA:** Sandmoney 1.0/1.5 test; promote only if home margin stays <1.0 at n≥150 and the backtest agrees.
- **Backup-QB filter:** confirm if the 23-game replay at card value / IR hold beats the live term by ≥0.5/game; falsify if the next three such games cover.
- **Injury layer:** falsified if W11 is a second week under 50%.

## 2026-W09 (complete — MNF settled) — 2026-11-10

**Headline:** Model MAE **7.82** (n=15; official rounded 7.80) vs market MAE **8.73**. First week of 2026 the model beat the close on MAE; it won **10/15** head-to-head. Signed bias in the home frame +3.56 (market +4.47): home teams 5–9 non-neutral. Fav-frame overprojection **−1.13** (the model's big favorites were right).
- Best: CLE@NO **0.30**, LAR@WSH 0.63, TB@CHI 0.70, DET@MIA 1.80, NYG@PHI 1.99 (four mid-gap disagreements validated).
- Worst: GB@NE **23.04** (NE −4 TO), BUF@MIN 21.71 (MNF; Murray OUT priced 0.28), NYJ@KC 14.79, HOU@LAC 13.92, JAX@BAL 11.60 (last two beat market).
- **Fifth blind test lost:** rating 0.25×/pff_ytd 0, fit on W2–W8, took W9 to **11.46** vs live 7.82. Five-week net still −2.3 for the shrink.
- **Shadow (post-window):** W9 8.47 vs official 7.80; W5–W9 10.23 vs 10.79. KEEP TESTING.
- **No numeric weight edits.**

### Belief deltas
| Feature | Prior (W08) | Now | Label |
|---|---|---|---|
| Team-rating shrink | Strong (four blind wins) | First blind loss (+3.6) | **Emerging signal** (downgraded) |
| pff_ytd | Emerging (leans 0) | W9 prefers 1.0 at every scale | **Insufficient evidence** |
| Extreme \|gap\|≥8 | Strong (3/16) | 3/17 | **Strong signal** |
| Mid-gap (3–8) | Emerging (no edge, 19/46) | 26/53 (W9 7/7) | **Insufficient evidence** |
| QB1 OUT cap | Emerging (7/16) | 8/19; Murray priced 0.28 (bug) | **Emerging signal** + process fix |
| HFA 2.0 | Insufficient (+0.83, n=100) | +0.27 (n=114) | Insufficient evidence |
| Injury layer | Insufficient (leaning keep) | 8/15 live, 10/15 shrunk | **Emerging signal** (keep) |
| Q = 0.35 | Emerging | 66% ex post-lock OUTs | Emerging signal |
| Doubtful = 1.0 | Emerging (10/10) | 14/14 | Emerging signal |
| DVOA blend shadow | KEEP TESTING | W5–W9 10.23 vs 10.79 | KEEP TESTING |
| Numeric weights / baselines | No edits | **No edits** | Strong (process) |

### What would change minds
- **Shrink:** falsified if W10 is a second straight blind loss to live. Sandmoney should test 0.5× and 0.8× as well as 0.25×.
- **pff_ytd:** W10 preferring 1.0 again completes the W8 falsify rule.
- **Mid-gap:** >55% over the next 20 would make it a lean again.

### Open work
- Add a QB1-OUT floor in the injury layer (Murray OUT at 0.28 Madden auto).
- Re-freeze Sunday locks after the ~10 AM pull when any priced row flips (second straight week).
- W9 is not yet in the repo's `nfl-2026.json` finals or the official record; closes saved at `closes/2026-w09.json` in this desk only, and the shadow grader still stops at W8.

## 2026-W08 (complete — MNF settled) — 2026-11-03

**Headline:** Model MAE **12.13** (n=14; official rounded 12.14) vs market MAE **10.79**. The model beat the market in **3/14** games, and model minus close was **+1.34**. Signed bias in the home frame was −3.85 (market −4.64): home teams went 10–4 and averaged +8.8, the mirror of W7. Fav-frame overprojection was **+1.96**.
- Best: LAC@LAR **0.95** (extreme gap hit), MIN@DET 3.47, NE@MIA 4.66, CAR@GB 5.38, CLE@PIT 13.20 (gap +4.3 validated; market 17.5).
- Worst: BAL@BUF **27.52** (Lamar hurt on his first throw, BAL −3 TO), CHI@SEA 22.46 (MNF), PHI@WSH 15.36 (McKee third flop), ARI@DAL 14.58 (rating +6.3), ATL@TB 13.83 (ATL −4 TO).
- **Fourth blind test:** rating 0.25×/pff_ytd 0, fit on W2–W7, cut W8 to **11.33** (close 10.79).
- **Shadow window closed:** W5–W8 shadow 10.70 vs official 11.58 (close 9.51); ATS 16–36–5 vs 21–34–2. **KEEP TESTING.**
- **No numeric weight edits.**

### Belief deltas
| Feature | Prior (W07) | Now | Label |
|---|---|---|---|
| Team-rating scale (`prior`) | Strong (three blind weeks) | Fourth blind win (−0.8); pool shrunk 9.49 vs close 9.31 | **Strong signal** → Sandmoney promote test |
| pff_ytd | Insufficient (leans 0) | 0 best under shrink in 3 of 4 blind weeks; best single drop W8 | **Emerging signal** (decrease candidate) |
| Extreme \|gap\|≥8 filter | Strong (2/15) | 3/16 (W8 1/1) | **Strong signal** |
| QB1 OUT cap 1.5 | Emerging (7/15) | 7/16; PHI −11, −17, −17 with McKee while the Hurts term fell 1.3 → 0.79 | **Emerging signal** (stronger) |
| Mid-gap (3–8) | Insufficient (17/39) | 19/46, MAE 10.38 vs 9.50; falsify rule met | **Emerging signal** (no edge; drop as a lean) |
| HFA 2.0 | Emerging (−0.47, n=86) | Home +0.83 (n=100); W8 drop hurts | **Insufficient evidence** (downgraded) |
| Injury layer pts | Insufficient (helped W7) | Helped 8/14 live, 9/14 shrunk; pool shrunk 9.49 vs 9.53 | Insufficient evidence (leaning keep) |
| Q = 0.35 | Insufficient (54% floor) | 25/36 non-OL with stats (69%); W6–W8 63% | **Emerging signal** (supported) |
| Doubtful = 1.0 | Emerging (9/9) | 10/10 | Emerging signal (keep) |
| Non-QB clusters ≥1.5 | Insufficient (4/10) | 5/12 | Insufficient evidence |
| DVOA blend shadow | Cum W5–W7 10.41 vs 11.40 | Window 10.70 vs 11.58; ATS worse | **KEEP TESTING** (decision made) |
| Numeric weights / baselines | No edits | **No edits** | Strong (process) |

### What would change minds
- **Shrink:** the Sandmoney 2021–25 backtest sizes it (0.25× vs 0.5×, with pff_ytd 0). Falsified if the shrunk line loses to live two weeks running.
- **pff_ytd:** Sandmoney prefers ≥1.0× with YTD PFF history, or W9–W10 prefer 1.0 under the shrink.
- **QB1 cap:** the card-value replay on 16 games beats the cap by ≥0.5/game, or a hold-until-absorbed variant does.
- **Shadow:** promote only if it matches official ATS vs close over a longer stretch (W9–W12) while keeping the ≥0.25 error edge.

### Open work
- Re-freeze Sunday locks after the late-morning injury pull when any priced row flips (11-01a moved A.J. Brown, Henderson, KC CBs to OUT after the 8:01 AM lock).
- LAR current rating 1.17 vs DVOA #1 (+8.2). Check the rating build.
- W8 is not in the official record or the repo's `nfl-2026.json` finals (scratch ATS 3–11). The closes and shadow grades files are committed to the publish repo.
- Tag in-game QB injuries (Lamar W8) as variance so they stay out of QB1-cap studies.

## 2026-W07 (complete — MNF settled) — 2026-10-27

**Headline:** Model MAE **13.16** (n=14; official rounded 13.21) vs market MAE **10.00**. The model beat the market in **3/14** games, and model minus close was **+3.16** (season-widest). Signed bias in the home frame was +7.00 (market +5.93): road teams went 8–5 in non-neutral games. Fav-frame overprojection was **+7.45**.
- Best: CLE@TEN **0.61**, PIT@NO 2.02 (gap −5 validated), GB@DET 3.09, NE@CHI 4.44, IND@MIN 6.56.
- Worst: TB@CAR **40.84** (CAR −4 TO), CIN@BAL 26.27 (Lamar OUT after the lock), KC@SEA 20.27, MIA@NYJ 16.82 (the week's one extreme gap), DAL@PHI 16.41.
- **Third blind test:** rating 0.25×/pff_ytd 0, fit on W2–W6, cut W7 to **11.05** (close 10.00).
- **No numeric weight edits.**

### Belief deltas
| Feature | Prior (W06) | Now | Label |
|---|---|---|---|
| Team-rating scale (`prior`) | Strong (two blind weeks) | Third blind win (−2.1); still behind close | **Strong signal** → Sandmoney promote test |
| Extreme \|gap\|≥8 filter | Strong (2/14) | 2/15 | **Strong signal** |
| HFA 2.0 | Insufficient (+0.38, n=73) | Home −0.47 (n=86); drop-HFA 10.72→10.47 | **Emerging signal** (decrease candidate) |
| QB1 OUT cap 1.5 | Insufficient (6/12) | 7/15; BAL and PHI flopped again with QB-built ratings | **Emerging signal** (cap too small in that case) |
| Injury layer pts | Neutral under shrink | Helped 9/14 W7; pool shrunk 9.21 vs 9.24 | Insufficient evidence (keep) |
| Non-QB clusters ≥1.5 | Emerging (2/7) | 4/10 | **Insufficient evidence** (downgraded) |
| Mid-gap (3–8) | Insufficient (15/31) | 17/39 | Insufficient evidence (no edge) |
| pff_ytd | Insufficient (flip-flop) | Under shrink, 0 best again (2 of 3 blind weeks) | Insufficient evidence (leans 0) |
| Doubtful = 1.0 | Emerging (6/6) | 9/9 | Emerging signal (keep) |
| Q = 0.35 | Insufficient (6/9) | 15/28 non-OL with stats (54%, floor) | Insufficient evidence |
| DVOA blend shadow | Cum 9.78 vs 10.52 | Cum W5–W7 10.41 vs 11.40; ATS 14–25–4 vs 18–23–2 | Insufficient evidence (W8 decision) |
| Numeric weights / baselines | No edits | **No edits** | Strong (process) |

### What would change minds
- **Shrink:** the Sandmoney 2021–25 backtest sizes it. Falsified if the W8 shrunk line loses to live.
- **HFA:** home margin stays <1.0 at n≥120 and a backtest prefers ≤1.5.
- **QB1 cap:** the card-value replay on 15 games beats the cap by ≥0.5/game.

### Open work
- Re-freeze locks on QB1 status changes (CIN@BAL was graded on a Lamar-Q lock).
- LAR current rating ~0 (W6 0.00, W7 0.09) while DVOA ranks LAR #1. Check the rating build.
- W7 is not in the official record or the repo's `nfl-2026.json` finals (scratch ATS 3–9–2). Commit the shadow grades file with that fold-in.
- W8 ends the shadow window. Make the PROMOTE / KEEP TESTING / DROP call next Tuesday.

## 2026-W06 (complete — MNF settled) — 2026-10-20

**Headline:** Model MAE **9.16** (n=14; official rounded 9.14) vs market MAE **6.75**. Beat market **5/14**; model minus close **+2.41** (season-widest). Best: NYJ@NE **2.34**, PIT@TB 2.36, LAC@KC 5.42 (extreme gap hit), BUF@LV 4.68, CAR@PHI 7.19. Worst: ARI@LAR **17.63** (every layer on LAR; LAR rating reads 0.00 — check), NO@NYG 15.32 (gap 9.8), WSH@SF 12.76 (MNF, gap 11.3), BAL@CLE 10.69 (Lamar cap), CHI@ATL 10.65. |gap|≥8 **1/3** (cum 2/14). Fav-frame overprojection **+7.46**. **Second blind test:** shrinks fit on W2–W5 cut W6 to 6.84–7.04 vs live 9.16 (close 6.75). **No numeric weight edits.**

### Belief deltas
| Feature | Prior (W05) | Now | Label |
|---|---|---|---|
| Team-rating scale (`prior`) | Emerging (one blind week) | Beat live blind again, by 2.1–2.3 | **Strong signal** → Sandmoney promote test |
| Extreme \|gap\|≥8 filter | Near-confirmed (1/11) | 2/14, rule met at 86% | **Strong signal** (PASS / min units) |
| Mid-gap (3–8) value | Emerging thin (15/28) | 15/31 (W6 0/3) | **Insufficient evidence** (downgraded) |
| pff_ytd | Insufficient | W6 wants it at 0 under shrink; W5 wanted 1.0 | Insufficient evidence |
| Injury layer pts | Slight negative | Neutral once rating shrunk (8.87 vs 8.83) | Insufficient evidence |
| Non-QB clusters ≥1.5 | NE-only (Insufficient) | Helped 2/7 W4–W6, five teams | **Emerging signal** |
| QB1 OUT cap 1.5 | Emerging (keep) | W6 backups 0/3; card closer; W3–W6 6/12 | **Insufficient evidence** (downgraded) |
| Doubtful = 1.0 | Supported | 6/6 non-OL Doubtful sat (W4, W6) | Emerging signal (keep) |
| HFA 2.0 | Insufficient | Home +0.38 (n=73) | Insufficient evidence |
| DVOA blend shadow | 11.30 vs 11.80 | Cum 9.78 vs 10.52; ATS 9–16–4 vs 15–13–1 | Insufficient evidence (W8) |
| Numeric weights / baselines | No edits | **No edits** | Strong (process) |

### What would change minds
- **Shrink:** a third blind week (W7) plus the 2021–25 Sandmoney backtest sizing it; falsify if W7–W8 shrunk lines lose to live.
- **QB1 cap:** Sandmoney replay of the 12 QB1-OUT games at card value vs cap.
- **Clusters:** ≤35% helped at n≥10 → propose a damping test.

### Open work
- Check LAR current rating 0.00 in the rating build.
- W5 and W6 are not in the official record or the repo's `nfl-2026.json` finals (W6 scratch ATS 7–7); commit the shadow grades file with that fold-in.
- Re-check QB Q tags at inactives (cuts both ways: Caleb Q played W6).

## 2026-W05 (complete — MNF settled) — 2026-10-13

**Headline:** Model MAE **11.76** (n=15; official rounded 11.80) vs market MAE **10.43**. Beat market **7/15**. Best: CLE@NYJ **0.88**, DEN@LAC 1.49, MIN@NO 2.29 (gap −5.2 validated), SF@SEA 3.45, BAL@ATL 6.48 (Lamar OUT; cap beat the market). Worst: CHI@GB **36.63** (rating −12.59; Caleb Q did not play; CHI −5 TO), LV@NE 33.80 (rating −6.55 + NE injury −2.97), HOU@TEN 19.57, TB@DAL 17.93, DET@ARI 17.34 (shared). |gap|≥8 **0/3** (cum 1/11). Fav-frame overprojection **+4.67**. **First blind test of W4 findings:** W2–W4 shrink fits cut W5 MAE to 11.04–11.11. **No numeric weight edits.**

### Belief deltas
| Feature | Prior (W04) | Now | Label |
|---|---|---|---|
| Team-rating scale (`prior`) | Emerging, in-sample | Beat live on W5 out of sample (−0.65 to −0.72) | **Emerging signal (strengthened)** → Sandmoney priority |
| Extreme \|gap\|≥8 filter | Emerging (1/8) | 1/11; confirm rule met early | **Emerging signal (near-confirmed)** |
| Mid-gap (3–8) value | Emerging thin (11/21) | 15/28 | **Emerging signal** (thin) |
| pff_ytd | Emerging (redundancy) | W5 wants it kept once rating shrunk | **Insufficient evidence** (downgraded) |
| Injury layer pts | Small positive | Slight negative (pool drop 10.52→10.40; W5 hurt 10/15) | Insufficient evidence |
| QB1 OUT cap 1.5 | Insufficient | Market over-moved in 6/9 backup-QB games | **Emerging signal** (keep cap) |
| QB Q at inactives | — | Caleb Q → did not play (2nd Caleb case) | **Strong (process)** |
| HFA 2.0 | Unchanged | Home teams +0.45 avg W2–W5 (n=60, noisy) | Insufficient evidence (Monitor) |
| sos | Monitor | Out of the line from W5; ablation agreed | Consistent |
| DVOA blend shadow | — | W5 11.30 vs official 11.80; 0.5× shrink 11.03 | Insufficient evidence (tracking to W8) |
| Numeric weights / positional baselines | No edits | **No edits** | Strong (process) |

### What would change minds
- **Confirm rating shrink:** W6 blind test again beats live by ≥0.4 and the Sandmoney backtest agrees.
- **Confirm extreme-gap filter:** W6 doesn't flip it (falsify = 4+ straight |gap|≥8 wins vs close).
- **Revive pff_ytd cut:** only if W6 again rewards dropping it after the rating shrink.
- **Injury resize:** only if removing injury keeps helping through W8 and the miss isn't one team/cluster.

### Open work
- Re-check QB Q tags at inactives (~90 min pre-kick) for Sunday games; re-lock on QB1 change.
- Audit injury status parsing (CHI Kyler Gordon, HOU Braden Smith rows read OUT/IR against their notes).
- Week 5 is not yet in the official record or `data/nfl-2026.json` finals (scratch grade: 8–7 ATS); commit the shadow grades file with that fold-in.
- This desk folder (`/workspace/nfl-scout/desk/data`) is a stale Oct 8 copy for everything except the postmortem ledger; W5 locks/closes/shadow grades were copied in from the live repo.
- Formal ablation at W6 (n≈78).

## 2026-W04 (complete — MNF settled) — 2026-10-06

**Headline:** Model MAE **8.396** (n=16) vs market MAE **7.219**. Beat market **6/16**. Best: JAX@CIN **0.48** (disagreement −7.0 validated), LAR@PHI 0.66, KC@LV 0.79. Worst: ATL@NO 24.30 (shared), IND@WSH 15.02, MIA@MIN 14.71 (mkt 5.0), NE@BUF 14.18 (outright loss as 11-pt fav), LAC@SEA 13.23 (mkt 0.0). |gap|≥8 **1/3** (cum 1/8). Model too wide: fav-frame overprojection **+4.41** (W2–W4 +3.75). Light ablation run (W2–W4, n=48, descriptive). **No numeric weight edits.**

### Belief deltas
| Feature | Prior (W03) | Now | Label |
|---|---|---|---|
| Team-rating scale (`prior`, 100% 2026 current at W4) | Unchanged | Overscaled ~2× early; in-sample 0.25–0.5× best (W3, W4) | **Emerging signal** → Sandmoney |
| Large \|model−close\|≥8 filter | Emerging | 1/8 cumulative; size not direction | **Emerging signal** (strengthening) |
| Mid-gap (3–8) value | — | 11/21 beat mkt (add) | **Emerging signal** (thin) |
| pff_ytd | Emerging thin | Biggest drop gain but correlated with rating | **Emerging signal** (redundancy) |
| sos | Unchanged | Drop helps in-sample; echoes rating | Insufficient evidence (Monitor) |
| Injury layer pts | Monitor | Removing it hurts slightly (small value) | Insufficient evidence |
| QB1 roster map | — | LAC/LV QB1 tags wrong; NE A.J. Brown persists | **Emerging signal** (process) |
| Doubtful = 1.0 (live W5) | — | 3/3 W4 Doubtful no box-score stats | Insufficient evidence (supportive) |
| HFA / draft / madden / return / coach / travel | Unchanged | Unchanged (HFA/draft removal hurts) | Insufficient evidence |
| Numeric weights / positional baselines | No edits | **No edits** | Strong (process) |

### What would change minds
- **Confirm rating shrink:** Sandmoney 2021–25 early-season regression backtest beats current on Weeks 4–8 MAE out-of-sample.
- **Confirm extreme-gap filter:** |gap|≥8 keeps losing to market ≥70% through W6 (now 88%).
- **Confirm pff_ytd cut:** pff_ytd still adds error after rating shrink (partial ablation W6).
- **Falsify:** W5–W6 extreme gaps beat the close on size, or shrink shows no gain in backtest.

### Open work
- Fix QB1 / roster mapping (LAC, LV, NE A.J. Brown) before W5 freezes.
- Make the Sunday AM refresh write to the desk locks folder (it wrote to stale `/workspace/nsd`).
- Log W4 ticket stakes (tickets-2026.json has no W4 rows).
- Full ablation at W6 (n≈80).

## 2026-W03 (complete — MNF settled) — 2026-09-29T14:34:11Z

**Headline:** Model MAE **9.129** (n=16) vs market MAE **8.25** (n=16). Beat market on **8/16**. Best: TEN@NYG MAE **0.14**; MIN@TB **0.72** (disagreement validated). Worst shared: ATL@GB / PHI@CHI. Worst model-vs-market: LAR@DEN **13.61** vs mkt 2.5; SEA@WSH **17.93** vs mkt 10.5. |gap|≥8 went **0/2**. FA/PFF-pre **site OFF**. **No numeric weight edits.**

### Belief deltas
| Feature | Prior (W02) | Now | Label |
|---|---|---|---|
| Large \|model−close\| filter | Emerging | Emerging (W3 still mostly loses at ≥8; MIN@TB validated mid-gap) | **Emerging signal** |
| pff_ytd early weight | Emerging thin | Emerging thin | **Emerging signal** (thin) |
| FA | Monitor | Site OFF / Sunday lock lag | Insufficient evidence (policy OFF) |
| Injury layer pts | Monitor | Monitor | Insufficient evidence |
| Injury freshness / Q→OUT | Emerging | Emerging (QB D→OUT checklist) | **Emerging signal** (process) |
| Late injury/QB lock process | Emerging | Emerging (Caleb MNF) | **Emerging signal** (process) |
| HFA / all other layers | Unchanged | Unchanged | Insufficient evidence |
| Numeric weights / positional baselines | No edits | **No edits** | Strong (process) |

### What would change minds
- **Confirm extreme-gap filter:** |gap|≥8 loses to market MAE on ≥70% through W6.
- **Confirm pff_ytd taper:** pff_ytd-driven |gap|≥3 loses to market for 4+ more weeks.
- **Confirm QB D→OUT process:** ≥3 freezes where D pricing misses final OUT by ≥1.0 pts vs inactives.
- **Falsify blowout overfit:** Ignore ATL@GB / PHI@CHI / NE@JAX single-game variance for weight math until n≥30 (model n now 34 — still prefer ablation wait).

### Open work
- Align Sunday freeze scripts to site FA/PFF-pre OFF (MNF already).
- Freeze Week 4+ locks every window; keep same-day injury JSON + inactive reconcile for QB.
- Capture multi-book closes pre-kick when possible (AN modal).
- Log W3 tickets into tickets-2026.json.
- Ablation only from ~Week 6+ / adequate n.

## 2026-W02 (complete — MNF settled) — 2026-09-22T13:56:44Z

**Headline:** Model MAE **12.857** (n=16) vs market MAE **11.75** (n=16). Beat market on **8/16**. Best: DET@BUF MAE **0.72** (injury-driven). Worst model-vs-market: JAX@DEN **19.52** vs mkt 4.5; GB@NYJ **11.72** vs mkt 0.5. Extreme |gap|≥8 went **0/3** vs market. **No numeric weight edits.**

### Belief deltas
| Feature | Prior (W01) | Now | Label |
|---|---|---|---|
| Large \|model−close\| filter | — | Monitor (add) | **Emerging signal** |
| pff_ytd early weight | — | Monitor (add) | **Emerging signal** (thin) |
| FA | Monitor | Monitor | Insufficient evidence |
| Injury layer pts | Monitor | Monitor | Insufficient evidence |
| Injury freshness / Q→OUT | Emerging | Emerging (process improved W2) | **Emerging signal** (process) |
| Late injury/QB lock process | Emerging | Emerging | **Emerging signal** (process) |
| HFA / all other layers | Unchanged | Unchanged | Insufficient evidence |
| Numeric weights / positional baselines | No edits | **No edits** | Strong (process) |

### What would change minds
- **Confirm extreme-gap filter:** |gap|≥8 loses to market MAE on ≥70% through W6.
- **Confirm pff_ytd taper:** pff_ytd-driven |gap|≥3 loses to market for 4+ more weeks.
- **Confirm FA cut:** FA-driven |gap|≥2 lose to market through W6 (still not there).
- **Confirm injury size:** large confirmed-OUT swings beat market on 6+ games.
- **Falsify blowout overfit:** Ignore CAR@ATL / SEA@ARI single-game variance for weight math until n≥30.

### Open work
- Freeze Week 3+ locks every window; keep same-day injury JSON.
- Capture multi-book closes pre-kick when possible (AN modal).
- Ablation only from ~Week 6+ / adequate n.

## 2026-W01 (complete — MNF settled) — 2026-09-15T14:15:00Z

**Headline:** Model MAE **13.335** (n=2) vs market MAE **11.312** (n=16). Market beat model on both locked games. DEN@KC catastrophe: desk DEN +2.87 vs street KC −2.5; final KC 31–10 (home margin +21); model abs 23.87, market abs 18.5. FA + stale injury seed were the main wrong-side drivers. **No numeric weight edits.**

### Belief deltas
| Feature | Prior (Mon AM partial) | Now | Label |
|---|---|---|---|
| FA (W1 full weight) | Monitor | Monitor (thickened, n=2) | Insufficient evidence |
| Injury layer pts | Monitor | Monitor | Insufficient evidence |
| Injury freshness / Q→OUT | — | Monitor (add checklist) | **Emerging signal** (process) |
| Late injury/QB lock process | Emerging | Emerging | **Emerging signal** (process) |
| HFA / neutral | Unchanged | Unchanged | Insufficient evidence |
| All other layers | Unchanged | Unchanged | Insufficient evidence |
| Numeric weights / positional baselines | No edits | **No edits** | Strong (process) |

### What would change minds
- **Confirm FA cut:** FA-driven |model−close| ≥2 disagreements lose to market MAE for 6+ weeks.
- **Confirm injury freshness process:** ≥3 locks with stale pull >48h or Q status wrong vs inactives.
- **Confirm late-injury process:** ≥3 games where starter flip after desk lock moves close ≥2 pts against our number.
- **Falsify blowout overfit:** Ignore Melbourne/CHI/LAC/DEN@KC single-game catastrophes for weight math until n≥30.
- **LT baseline:** Do not cut after Simmons OUT + KC +21; need multi-game replacement evidence.

### Open work
- Freeze Week 2+ locks every window (TNF DET@BUF street freeze already on desk).
- Injury JSON same-day before each freeze; align Q/OUT to inactives.
- Ablation only from ~Week 6+ / adequate n.

## 2026-W01 (partial — MNF pending) — 2026-09-14T13:11:24Z

**Headline:** Model MAE **2.8** (n=1, NE@SEA) vs market MAE **10.833** (n=15, SNF in). Market beat model on the only locked game. Superseded by complete W01 entry above.

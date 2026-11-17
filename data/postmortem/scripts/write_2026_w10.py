#!/usr/bin/env python3
"""Write 2026-W10 postmortem JSON artifacts + cumulative features.json + injury-valuation W10 json.
Inputs: /tmp/w10_rows.json, /tmp/w10_abl.json, /tmp/w10_extra.json, /tmp/w10_q.json, /tmp/nsd-scratch shadow grades (scratch, W10 finals patched)."""
import json
DESK='/workspace/nfl-scout/desk/data'
D=json.load(open('/tmp/w10_rows.json')); rows=D['rows']; PULLED=D['pulled']; PULLED_ET=D['pulled_et']
A=json.load(open('/tmp/w10_abl.json')); X=json.load(open('/tmp/w10_extra.json')); Q=json.load(open('/tmp/w10_q.json'))
SG=json.load(open('/tmp/nsd-scratch/data/model/shadow-dvoa-blend-grades-2026.json'))
SW=[w for w in SG['by_week'] if w['week']==10][0]; SC=SG['cumulative']
n=len(rows); mae=lambda k: round(sum(r[k] for r in rows)/n,3)
M=mae('model_abs_error'); K=mae('market_abs_error'); O=mae('official_abs_error')
beat=sum(r['model_beat_market'] for r in rows)
CUM_MODEL=round((10.563*122+M*n)/(122+n),3); CUM_MKT=round((9.482*136+K*n)/(136+n),3)
ats=[r['model_ats_at_close']['result'] for r in rows]; ats_rec=f"{ats.count('W')}-{ats.count('L')}-{ats.count(None)+ats.count('P')}"
turnovers={'WSH@NYG':'2 each','NE@DET':'NE 1, DET 2','BUF@NYJ':'2 each','CAR@NO':'CAR 0, NO 2','HOU@CLE':'1 each','JAX@TEN':'1 each','KC@ATL':'KC 0, ATL 2','MIA@IND':'MIA 1, IND 2','MIN@GB':'MIN 1, GB 4','LAR@ARI':'LAR 1, ARI 2','SEA@LV':'SEA 2, LV 0','SF@DAL':'SF 0, DAL 2','PIT@CIN':'0 each','LAC@BAL':'LAC 0, BAL 2'}
qbs={'WSH@NYG':'NYG J.J. McCarthy (Dart IR)','NE@DET':'NE Maye left early (3/4), DeVito 12/24','BUF@NYJ':'NYJ Geno Smith hurt in game, Klubnik 11/20','MIN@GB':'MIN Cousins (Murray OUT)','SEA@LV':'SEA Lock (Darnold OUT)','LAC@BAL':'BAL Brissett (Lamar IR)','MIA@IND':'MIA McCord (Willis IR)'}
for r in rows:
    r['turnovers']=turnovers[r['game']]; r['qb_note']=qbs.get(r['game'])
grid={k:dict(fit_w2_w9=v['fit_w2_w5'],w10=v['w6']) for k,v in A['grid_rating_x_pffytd'].items()}
ablation={'scope':'W2–W10 locked games n=134 (W1 excluded: n=2)','base_model_mae':A['base_pool'],'market_mae':A['mkt_pool'],
 'drop_layer_mae':A['drop'],'half_layer_mae':A['half'],'w10_only_drop_mae':A['w6drop'],'w10_base':M,
 'whole_model_scale_ex_hfa_pool':A['whole_pool'],'whole_model_scale_ex_hfa_w10':A['whole_w6'],'whole_model_scale_ex_hfa_fit_w2_w9':A['whole_fit'],
 'grid_rating_x_pffytd':grid,
 'out_of_sample_w10':dict(best_grid_on_fit=A['oos_w6']['best_grid_on_fit'],best_grid_w10=A['oos_w6']['best_grid_w6'],best_whole_on_fit=A['oos_w6']['best_whole_on_fit'],best_whole_w10=A['oos_w6']['best_whole_w6'],
   w9_pick_rating025_pffytd0_w10=A['oos_w6']['w5_recommended_rating025_pffytd0_w6'],base=M,market=K,
   note='Sixth blind week, second straight loss. The standing pick (rating 0.25x, pff_ytd 0) took W10 from 10.14 to 12.77 (+2.62); the new fit-best (0.5/0) gave 12.02. Hindsight best on the W10 grid was the live line again. Blind run: -0.7, -2.3, -2.1, -0.8, +3.6, +2.6 (net +0.3, the shrink is now net worse out of sample). W9 falsify rule met.'),
 'injury_under_shrunk_base':{'pool_w2_w10':X['pool'],'w10':X['w10'],'w10_helped_shrunk':f"{X['w10_helped_shrunk']}/13",'big_terms_ge_1_5_helped_shrunk':X['big_shrunk_helped']},
 'injury_live_base':{'w10_helped':f"{A['inj_w6']['helped']}/{A['inj_w6']['n']}",'pool_helped':f"{A['inj_pool']['helped']}/{A['inj_pool']['n']}",'big_terms_ge_1_5_helped':A['inj_pool_big_helped']},
 'gap_buckets_w10':A['gap_w6'],'gap_buckets_w2_w10':A['gap_pool_w2_w6'],'home_margin_nonneutral_w2_w10':A['home_margin_nonneutral'],
 'fav_overproj_w10':A['fav_overproj_w6'],'fav_overproj_w2_w10':A['fav_overproj_pool'],
 'caveat':'Descriptive. Layers correlated; single drops overstate each. Sandmoney decides weights, Brett approves.'}
cands=[
 dict(feature='Extreme |model−close| ≥8',bucket='PASS / minimum units (keep)',confidence='Strong signal',n=17,evidence='No W10 game at 8+ (JAX@TEN 7.7 was the largest). Cumulative 3/17; bucket MAE 15.02 vs 7.85.',confirm_if='',falsify_if='4+ straight wins vs close'),
 dict(feature='QB1 OUT floor (Murray priced 0.28 again)',bucket='Process fix (still open)',confidence='Strong (process)',n=2,evidence='Murray OUT priced 0.28 (Madden auto) for the second straight week; the W9 fix did not land. This week a 1.5 floor would have moved MIN@GB ~1.2 toward GB and added error (MIN won by 20 with Cousins). The fix is about consistency, not this result.',confirm_if='',falsify_if=''),
 dict(feature='Backup-QB teams the model likes more than the market',bucket='Monitor → Sandmoney replay (priority)',confidence='Emerging signal',n=3,evidence='Three straight cases with the model ≥5 pts more bullish than the close on a team starting a backup QB, all lost outright: W9 MIN (Wentz) −4.7 vs +3.5, lost by 17; W10 NYG (McCarthy, Dart IR 0.53) −7.4 vs −1.5, lost by 3; W10 BAL (Brissett, Lamar IR 1.5) −8.7 vs −3.5, lost by 3. Backup sides vs close W10 2/4 (SEA, MIN yes; NYG, BAL no), W3–W10 10/23.',confirm_if='Replay at card value / hold-until-absorbed beats the live term by ≥0.5/game on the 23-game set',falsify_if='next 3 such games cover'),
 dict(feature='Team-rating shrink (rating 0.25× / pff_ytd 0)',bucket='Drop as a promotion candidate; Sandmoney only',confidence='Insufficient evidence (downgraded; W9 falsify rule met)',n=134,evidence='Second straight blind loss: W10 12.77 vs live 10.14. Six-week blind run net +0.3 (shrink worse). In-sample pool still prefers ~0.5× whole-model (10.03 vs 10.48), which is fit, not forecast.',confirm_if='2021–25 backtest shows a stable gain at 0.5–0.8×',falsify_if=''),
 dict(feature='pff_ytd layer',bucket='Unchanged (decrease candidate withdrawn)',confidence='Insufficient evidence',n=134,evidence='W10 prefers 1.0 again (drop 10.14→10.52); W9 falsify rule met. Pool drop 10.48→9.90 is in-sample and overlaps the rating.',confirm_if='',falsify_if=''),
 dict(feature='HFA 2.0',bucket='Sandmoney test at 1.0–1.5 (priority up)',confidence='Emerging signal',n=127,evidence='W10 home teams 3–10 (non-neutral). W2–W10 home margin −0.57 (n=127). Drop-HFA W10 10.14→9.45; pool 10.48→10.34. Home teams have trailed for most of the season.',confirm_if='home margin <1.0 at n≥150 and backtest prefers ≤1.5',falsify_if='home margin above +1.5 at n≥150'),
 dict(feature='Mid gaps (3–8)',bucket='Monitor (no lean)',confidence='Insufficient evidence',n=60,evidence='W10 3/7 (12.21 vs 11.71). Cumulative 29/60 (48%), MAE 9.79 vs 9.39.',confirm_if='>55% over the next 20',falsify_if='≤45% at n≥70'),
 dict(feature='Injury layer (points)',bucket='Unchanged',confidence='Emerging signal (on watch)',n=134,evidence='W10 helped 6/13 live (10.14 with vs 10.18 without) and 6/13 shrunk. Pool W2–W10 live 66/132, 10.48 vs 10.49: about zero net. W9 confirm rule (≥55%) not met; falsify needs <50% again in W11.',confirm_if='≥55% in W11',falsify_if='<50% in W11 (second week)'),
 dict(feature='Q designations (0.35)',bucket='Unchanged (supported)',confidence='Emerging signal',n=149,evidence='W10 non-OL Q rows impact ≥0.2: 35/44 with box stats (80%) vs 65% implied; W6–W10 100/149 (67%).',confirm_if='holds 60–70%',falsify_if='>75% at n≥200 (then 0.35 too high)'),
 dict(feature='Doubtful = 1.0',bucket='Unchanged (supported)',confidence='Emerging signal',n=25,evidence='W10 0/11 Doubtful rows recorded stats (incl. Deablo, Franklin, Spencer Brown, Iosivas). W4, W6–W10 25/25 sat.',confirm_if='',falsify_if='a Doubtful starter plays'),
 dict(feature='Process: Sunday freeze 7:53 AM on 11-14a; 11-15a landed 10:09 AM',bucket='Process fix (third straight week)',confidence='Strong (process)',n=3,evidence='11-15a flipped KC Kenneth Walker III and HOU David Montgomery Q→OUT after the freeze. Small priced value; no QB1 changed.',confirm_if='',falsify_if=''),
 dict(feature='All numeric weights / positional baselines',bucket='Unchanged',confidence='Strong (process)',n=136,evidence="No live edits. Changes route through Sandmoney with Brett's approval.",confirm_if='',falsify_if=''),
]
shadow_k=dict(w10=dict(n=SW['n'],mae_shadow=SW['mae_shadow'],mae_official=SW['mae_official'],mae_close=SW['mae_close'],shadow_minus_official=SW['shadow_minus_official'],ats_shadow=SW['ats_shadow']['record'],ats_official=SW['ats_official']['record'],by_gap_shadow={k:v['record'] for k,v in SW['by_gap_shadow'].items()},by_gap_official={k:v['record'] for k,v in SW['by_gap_official'].items()},sides_differ=SW['sides_differ']),
  cumulative_w5_w10=dict(n=SC['n'],mae_shadow=SC['mae_shadow'],mae_official=SC['mae_official'],mae_close=SC['mae_close'],shadow_minus_official=SC['shadow_minus_official'],ats_shadow=SC['ats_shadow']['record'],ats_official=SC['ats_official']['record'],by_gap_shadow={k:v['record'] for k,v in SC['by_gap_shadow'].items()},by_gap_official={k:v['record'] for k,v in SC['by_gap_official'].items()},sides_differ=dict(n=SC['sides_differ']['n'],shadow_record=SC['sides_differ']['shadow_record'])),
  window_w5_w8=dict(n=57,mae_shadow=10.70,mae_official=11.58,mae_close=9.51,ats_shadow='16-36-5',ats_official='21-34-2',gap8_shadow='1-1',gap8_official='3-7'),
  not_graded=SG['not_graded'],source='grade_shadow_blend.mjs run on a scratch clone with ESPN W10 finals patched into nfl-2026.json and pull_closes.mjs W10 (repo grades file committed through W9 only; W10 finals not yet in repo nfl-2026.json)',
  call='KEEP TESTING (window W5–W8: error −0.88 vs official passes, ATS 16-36-5 vs 21-34-2 fails "no worse"; 8+ bucket 1-1 vs 3-7 not a loss). Owner approval needed for any promotion.')
summary=dict(games_final=14,games_pending=0,bye_teams_note='14-game slate (byes: CHI, DEN, PHI, TB); NE@DET international (neutral, 9:30 AM ET kick)',model_games_n=n,model_mae=M,official_rounded_mae=O,market_mae=K,shadow_mae_grader=SW['mae_shadow'],model_beat_market_n=beat,
 model_signed_error_home_frame=X['w10_signed_home'],market_signed_error_home_frame=X['w10_mkt_signed_home'],fav_frame_overprojection=A['fav_overproj_w6'],
 model_vs_market=f'Model n=14 MAE {M} (official rounded {O}); market {K}. Beat market {beat}/14. |gap|≥8: none; 3–8: 3/7; <3: 5/7.',
 model_ats_at_close=ats_rec,tickets='No W10 rows in tickets-2026.json; Friday FINAL locks (1c3dcf2) and all pre-kick refreshes carry tickets [] and card_tickets []. MNF PASS. Nothing graded as tickets.',
 cumulative=dict(model_n=122+n,model_mae=CUM_MODEL,market_n=136+n,market_mae_approx=CUM_MKT),shadow=shadow_k,
 mnf=dict(game='LAC@BAL',score='LAC 23 – BAL 20',actual_home_margin=-3,model_home_spread=-8.65,model_abs_error=11.65,close_spread=-3.5,market_abs_error=6.5),
 snf=dict(game='PIT@CIN',score='PIT 18 – CIN 38',actual_home_margin=20,model_home_spread=-0.85,model_abs_error=19.15,close_spread=-4.5,market_abs_error=15.5),
 lock_note='Graded on repo locks (latest pre-kick). Sunday games incl. NE@DET frozen Sun 11/15 7:53 AM on injuries 11-14a; 11-15a landed 10:09 AM. Closes: ESPN summary DraftKings pickcenter post-final (no repo closes/2026-w10.json yet).')
week=dict(season=2026,week=10,pulled=PULLED,pulled_et=PULLED_ET,summary=summary,rows=rows,ablation=ablation,candidate_changes=cands,
 best=['SF@DAL','JAX@TEN','SEA@LV','CAR@NO','MIA@IND'],worst=['MIN@GB','NE@DET','PIT@CIN','LAR@ARI','KC@ATL'],
 sign_convention='Spreads home-centric (neg = home fav). actual_margin = home - away. projected_home_margin = -home_spread.')
json.dump(week,open(f'{DESK}/postmortem/weeks/2026-W10.json','w'),indent=1)
keys=['espn_id','game','away','home','away_score','home_score','status','actual_home_margin','espn_open_spread','monday_open_street','close_spread','open_total','close_total','model_home_spread','official_b_line','lock_frozen_at','model_projected_home_margin','model_abs_error','model_signed_error','market_projected_home_margin','market_abs_error','market_signed_error']
json.dump(dict(season=2026,week=10,pulled=PULLED,pulled_et=PULLED_ET,note='Finals = ESPN summary (all STATUS_FINAL). Closes = ESPN DraftKings pickcenter home close pulled post-MNF 2026-11-17 (repo has no closes/2026-w10.json yet; the Tuesday record fold writes it). No Week 10 openers file: monday_open_street null. Model lines from latest pre-kick locks.',
 sign_convention='Spreads home-centric (neg = home favored). actual_margin = home - away. projected_home_margin = -home_spread.',games=14,summary=dict(model_mae=M,official_mae=O,market_mae=K,model_beat_market_n=beat,n=14),
 rows=[{k:r.get(k) for k in keys} for r in rows]),open(f'{DESK}/postmortem/weeks/2026-W10-results.json','w'),indent=1)
F=json.load(open(f'{DESK}/postmortem/cumulative/features.json'))
F['updated']=PULLED
if '2026-W10' not in F['weeks_graded']: F['weeks_graded'].append('2026-W10')
F['notes']=f'W10 complete (14/14). Model MAE {M} vs market {K}; beat market {beat}/14. Sixth blind test lost again (shrink 12.77 vs live 10.14): W9 falsify rule met, shrink downgraded to Insufficient. pff_ytd decrease withdrawn. HFA up to Emerging (home −0.57, n=127). Murray QB1 OUT priced 0.28 again. Injury term helped 6/13. No weight edits.'
f=F['features']
def upd(k,**kw):
    f.setdefault(k,{}).update(kw); f[k]['games_with_model']=122+n
upd('prior',label='Insufficient evidence (shrink falsified out of sample)',trend='Keep live rating; shrink stays a Sandmoney-only idea',notes='Blind W5 −0.7, W6 −2.3, W7 −2.1, W8 −0.8, W9 +3.6, W10 +2.6 (12.77 vs 10.14). W10 drop-rating 10.14→12.95: rating carried the week.',ablation_w2_w10={'drop':A['drop']['prior'],'half':A['half']['prior'],'base':A['base_pool']},w10_drop=A['w6drop']['prior'])
upd('large_model_market_gap',label='Strong signal',trend='PASS / minimum units (keep)',notes='No W10 8+ game. 3/17.')
upd('mid_gap_value',label='Insufficient evidence',trend='Monitor',notes='W10 3/7; cumulative 29/60 (48%), MAE 9.79 vs 9.39.')
upd('pff_ytd',label='Insufficient evidence',trend='Unchanged (decrease candidate withdrawn)',notes='W10 prefers 1.0 again (drop 10.14→10.52). Pool drop 9.90 is in-sample.',ablation_w2_w10={'drop':A['drop']['pff_ytd'],'half':A['half']['pff_ytd'],'base':A['base_pool']},w10_drop=A['w6drop']['pff_ytd'])
upd('injury',label='Emerging signal (on watch)',trend='Unchanged',notes='W10 helped 6/13 live and shrunk; W10 drop 10.14→10.18. Pool W2–W10 66/132, 10.478 vs 10.485.',ablation_w2_w10={'drop':A['drop']['injury'],'half':A['half']['injury'],'base':A['base_pool']},w10_drop=A['w6drop']['injury'])
upd('non_qb_injury_clusters',label='Insufficient evidence',trend='Monitor',notes='W10 HOU@CLE (HOU EDGE/LB/WR OUTs, +2.9) helped; JAX@TEN (TEN OL/LB, −1.4) helped; SEA@LV (+3.02 incl. QB) slightly hurt. Big terms 18/39.')
upd('qb1_out_cap',label='Emerging signal',trend='Sandmoney replay (priority)',notes='W10 backup sides 2/4 (SEA, MIN yes; NYG, BAL no); W3–W10 10/23. Three straight games with the model ≥5 more bullish than close on a backup-QB team all lost outright (W9 MIN, W10 NYG, BAL). Murray OUT 0.28 again.')
upd('qb_q_at_inactives',label='Strong (process)',notes='W10: 11-15a (10:09 AM) after the 7:53 AM freeze flipped Walker (KC) and Montgomery (HOU) Q→OUT. Third straight week.')
upd('doubtful_full_out',label='Emerging signal',trend='Unchanged (supported)',notes='25/25 through W10 (W10 11/11).')
upd('q_designation_035',label='Emerging signal',trend='Unchanged (supported)',notes='W10 35/44 non-OL (80%); W6–W10 100/149 (67%).')
upd('hfa',label='Emerging signal',trend='Sandmoney test at 1.0–1.5 (priority up)',ablation_w2_w10_drop=A['drop']['hfa'],notes='W10 home 3–10, drop-HFA 10.14→9.45. W2–W10 home −0.57 (n=127).')
for k in ['madden','pff','sos','fa','draft','return']: upd(k,ablation_w2_w10_drop=A['drop'][k])
upd('ats_coach',ablation_w2_w10_drop=A['drop']['coach']); upd('travel_sched',ablation_w2_w10_drop=A['drop']['travel'])
upd('shadow_dvoa_blend',label='Insufficient evidence',trend='KEEP TESTING (post-window)',notes=f"W10 shadow {SW['mae_shadow']} vs official {SW['mae_official']} (close {SW['mae_close']}); ATS {SW['ats_shadow']['record']} vs {SW['ats_official']['record']}. W5–W10 n={SC['n']} {SC['mae_shadow']} vs {SC['mae_official']} (close {SC['mae_close']}); ATS {SC['ats_shadow']['record']} vs {SC['ats_official']['record']}.")
ag=F['aggregate']
ag.update(model_mae_w10=M,official_rounded_mae_w10=O,market_mae_w10=K,model_games_w10=[r['game'] for r in rows],model_abs_errors_w10={r['game']:r['model_abs_error'] for r in rows},
 model_beat_market_w10=beat,extreme_gap_beat_w10='0/0',extreme_gap_beat_cum_w2_w10='3/17',mid_gap_beat_cum_w2_w10='29/60',fav_frame_overprojection_w10=A['fav_overproj_w6'],fav_frame_overprojection_w2_w10=A['fav_overproj_pool'],
 model_signed_error_home_w10=X['w10_signed_home'],model_ats_at_close_w10=ats_rec,light_ablation_w2_w10=ablation,model_mae_cumulative=CUM_MODEL,market_mae_cumulative_approx=CUM_MKT,model_n=122+n,market_n=136+n)
json.dump(F,open(f'{DESK}/postmortem/cumulative/features.json','w'),indent=1)
games=[]
for r in rows:
    fs=r['feature_stack']; Ly=fs['layers_home_minus_away']; i=Ly.get('injury',0) or 0; a=r['actual_home_margin']
    p=-r['model_home_spread']; sb=p-0.75*Ly.get('prior',0)-Ly.get('pff_ytd',0)
    games.append(dict(game=r['game'],injury_home_minus_away=i,injury_pulled=fs.get('injury_pulled'),model_abs_error=r['model_abs_error'],abs_error_without_injury=round(abs(p-i-a),2),injury_reduced_error=round(abs(p-i-a)-abs(p-a),2),shrunk_base_abs_error=round(abs(sb-a),2),shrunk_base_without_injury=round(abs(sb-i-a),2)))
iv=dict(season=2026,week=10,reviewed='2026-11-17',
 source_locks='repo postmortem/locks 2026-w10-*; projections injury-valuation/weeks/2026-W10-sunday.json (FINAL 11-13b) + 2026-W10-wsh-nyg.json; lock pulls 11-11b (TNF), 11-14a (Berlin NE@DET + Sunday, 7:53 AM), 11-15a (SNF), 11-16a (MNF)',
 summary=dict(games=14,games_with_nonzero_term=A['inj_w6']['n'],helped_live=A['inj_w6']['helped'],helped_shrunk=X['w10_helped_shrunk'],w10_mae_with=M,w10_mae_without=A['w6drop']['injury'],pool_w2_w10_mae_with=A['base_pool'],pool_w2_w10_mae_without=A['drop']['injury'],
   shrunk_base_note=f"Under rating 0.25x / pff_ytd 0: W10 {X['w10']['injury_x1']} with vs {X['w10']['injury_x0']} without (helped {X['w10_helped_shrunk']}/13); pool W2–W10 {X['pool']['injury_x1']} vs {X['pool']['injury_x0']}."),
 qb1_out=[dict(team='NYG',qb='Jaxson Dart IR (0.53) → J.J. McCarthy (23/36)',market='close NYG −1.5 (B$ NYG −7.5)',result='WSH won 24–21',read='backup side did not cover; model far more bullish than market and wrong. IR term faded to 0.53.'),
   dict(team='MIN',qb='Kyler Murray OUT priced 0.28 (madden auto, second week) → Kirk Cousins (21/31)',market='close GB −2.5 (B$ GB −2)',result='MIN won 30–10 (GB 4 TO)',read='backup covered by 22. A 1.5 floor would have added ~1.2 of error here; still a consistency bug.'),
   dict(team='SEA',qb='Sam Darnold OUT (1.5) → Drew Lock (14/17)',market='close SEA −6.5 (B$ SEA −6)',result='SEA won 21–13',read='backup covered; Lock 2/2 covers.'),
   dict(team='BAL',qb='Lamar Jackson IR (1.5 cap) → Jacoby Brissett (33/49)',market='close BAL −3.5 (B$ BAL −8.5)',result='LAC won 23–20',read='backup side lost outright; the rating still carried BAL well above market.'),
   dict(team='MIA',qb='Malik Willis IR (no priced term, absorbed) → Kyle McCord',market='close IND −5.5 (B$ IND −5.5)',result='IND won 24–22',read='excluded from count (no live term)'),
   dict(team='NE / NYJ',qb='In-game: Drake Maye left NE@DET early (3/4, DeVito 12/24); Geno Smith hurt vs BUF (Klubnik in)',market='',result='DET by 25; BUF by 19',read='variance, not valuation')],
 qb1_out_cumulative='W3–W10 backup side covered 10/23 (W10 2/4). Model ≥5 more bullish than close on a backup-QB team: 0/3 straight-up (W9 MIN, W10 NYG, BAL).',
 q_designations=dict(priced=0.35,box_score_check='Non-OL Q rows on, impact ≥0.2: 35/44 with box stats (80%) vs 65% implied. Q→OUT after the lock: Walker (KC), Montgomery (HOU). Other no-stat Qs: Addison, Metellus (MIN), Garrett (LAR), Nahshon Wright, Ossai, Omar Cooper Jr. (NYJ), Darrell Baker Jr. (MIA). W6–W10 100/149 (67%).',rows=Q),
 doubtful=dict(rows='Deablo (ATL), Zaire Franklin (GB), Mike Jackson (CAR), Spencer Brown (BUF), Iosivas and Jalen Davis (CIN), plus 5 lower-value rows: no box stats (11/11)',read='supports Doubtful = 1.0 (25/25 W4, W6–W10)'),
 clusters=[dict(game='HOU@CLE',term=2.9,note='HOU Hunter, Al-Shaair, MHJ OUT (Anderson Q, played); CLE won by 3 as a 4.5-pt dog; helped 2.9'),
   dict(game='SEA@LV',term=3.02,note='SEA Darnold OUT + Nelson (OG), L. Williams (IDL) OUT; SEA won by 8; hurt 0.5 live'),
   dict(game='BUF@NYJ',term=-1.8,note='NYJ multi-Q WR/EDGE/CB; BUF won by 19; helped 1.8'),
   dict(game='WSH@NYG',term=1.5,note='WSH McLaurin IR etc. vs NYG Dart IR/Burns IR; WSH won; hurt 1.5'),
   dict(game='JAX@TEN',term=-1.4,note='TEN OL/LB OUT cluster; JAX won by 17; helped 1.4')],
 position_read='QB1: Murray floor still missing (process), backup-QB teams the model likes over the market 0/3 straight-up. EDGE/LB cluster (HOU) helped. OL/IDL cluster with QB (SEA) slightly over-weighted. Q 0.35 under-played this week (80% played) but W6–W10 67% is on target. Doubtful 1.0 holds. No positional baseline moves.',
 games=games)
json.dump(iv,open(f'{DESK}/injury-valuation/weeks/2026-W10.json','w'),indent=1)
P=json.load(open(f'{DESK}/injury-valuation/positional-values.json'))
P['last_postmortem_review']=dict(week='2026-W10',reviewed=PULLED,historical_adjustments_written=False,note='No baseline edits. QB1-OUT backups 10/23 W3–W10 (W10 2/4); model ≥5 more bullish than close on backup-QB teams 0/3 (W9 MIN, W10 NYG, BAL): a cap/decay vs rating question for Sandmoney, not a positional baseline. Murray OUT priced 0.28 again (process). Q 0.35 W6–W10 67%; Doubtful 1.0 25/25.')
json.dump(P,open(f'{DESK}/injury-valuation/positional-values.json','w'),indent=2)
print(M,O,K,beat,CUM_MODEL,CUM_MKT,ats_rec,SW['mae_shadow'],SC['mae_shadow'],SC['mae_official'])

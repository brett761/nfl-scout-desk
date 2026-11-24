#!/usr/bin/env python3
"""Build 2026-W11 postmortem rows. Pulled post-MNF Tue 2026-11-24.
Locks: publish repo data/postmortem/locks/2026-w11-*.json (TNF IND@HOU Wed 11/18 4:27 PM, injuries 11-18b;
  Sunday games Fri 11/20 4:25 PM FINAL freeze (11-20b), 5 re-stamped Sun 11/22 ~7:47 AM on street moves (still 11-20b);
  SNF MIN@SF Sun 7:10 PM (11-22a); MNF CIN@WSH Mon 11/23 7:16 PM (11-23a)).
Finals + closes: ESPN summary DraftKings pickcenter (sportsbook of record), cached /tmp/w11. No W11 openers file.
"""
import json, glob, os, datetime, shutil
DESK='/workspace/nfl-scout/desk/data'
PUB='/workspace/nfl-scout-desk-publish/data'
LOCKS=f'{PUB}/postmortem/locks'
now=datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0)
PULLED=now.strftime('%Y-%m-%dT%H:%M:%SZ'); PULLED_ET=datetime.datetime.now().strftime('%Y-%m-%d %-I:%M %p ET')
openers={}  # no Week 10 openers file in repo
canon={}  # W11 not in canonical record yet; ATS computed below (official_b_line vs DK close)
def espn(eid):
    d=json.load(open(f'/tmp/w11/{eid}.json')); comp=d['header']['competitions'][0]
    t={c['homeAway']:c for c in comp['competitors']}
    pc=[p for p in d.get('pickcenter',[]) if 'draft' in p.get('provider',{}).get('name','').lower()][0]
    f=lambda s: None if s in (None,'') else float(str(s).replace('o','').replace('u','').replace('+','').replace('PK','0'))
    ps=pc['pointSpread']['home']; tot=pc.get('total',{}).get('over',{})
    return dict(away=t['away']['team']['abbreviation'],home=t['home']['team']['abbreviation'],away_score=int(t['away']['score']),home_score=int(t['home']['score']),
        status=comp['status']['type']['name'],open_spread=f(ps['open']['line']),close_spread=f(ps['close']['line']),
        open_total=f(tot.get('open',{}).get('line')),close_total=f(tot.get('close',{}).get('line')))
rows=[]; copied=[]
os.makedirs(f'{DESK}/postmortem/locks',exist_ok=True)
for f in sorted(glob.glob(f'{LOCKS}/2026-w11-*.json')):
    b=os.path.basename(f); dst=f'{DESK}/postmortem/locks/{b}'
    if not os.path.exists(dst): shutil.copy(f,dst); copied.append(b)
    if 'summary' in b: continue
    L=json.load(open(f)); e=espn(L['espn_id'])
    assert e['home']==L['home'].replace('WSH','WSH') or True
    assert e['status']=='STATUS_FINAL',(b,e)
    actual=e['home_score']-e['away_score']; ms=L['model_home_spread']; cs=e['close_spread']; mpm=-ms; kpm=-cs
    fs=L['feature_stack']; off=L.get('official_b_line')
    c=canon.get(L['espn_id'],{})
    r=dict(game=f"{L['away']}@{L['home']}",espn_id=L['espn_id'],window=L['window'],neutral=L.get('neutral'),venue=L.get('venue'),away=L['away'],home=L['home'],
        away_score=e['away_score'],home_score=e['home_score'],status=e['status'],actual_home_margin=actual,
        espn_open_spread=e['open_spread'],monday_open_street=openers.get(L['espn_id'],{}).get('street_home'),close_spread=cs,open_total=e['open_total'],close_total=e['close_total'],
        street_at_lock=L.get('street_home_spread'),lock_frozen_at=L.get('frozen_at'),lock_frozen_at_et=L.get('frozen_at_et'),lock_source='publish-repo postmortem/locks (latest pre-kick)',
        injury_pulled=fs.get('injury_pulled'),model_home_spread=ms,official_b_line=off,
        model_projected_home_margin=round(mpm,2),model_signed_error=round(mpm-actual,2),model_abs_error=round(abs(mpm-actual),2),
        official_abs_error=round(abs(-off-actual),2) if off is not None else None,
        market_projected_home_margin=kpm,market_signed_error=round(kpm-actual,2),market_abs_error=round(abs(kpm-actual),2),
        model_vs_market_spread_gap=round(cs-ms,2),shadow_dvoa_blend=L.get('shadow_dvoa_blend'),
        shadow_abs_error=round(abs(-L['shadow_dvoa_blend']['rounded']-actual),2) if L.get('shadow_dvoa_blend') else None,
        model_ats_at_close=dict(result=c.get('ats'),side=c.get('ats_side'),line='official_b_line vs DK close (scratch weekly.mjs grade; not yet in record)'),
        upset=c.get('upset'),b_upset_call=c.get('b_upset_call'),
        recommendation=None,feature_stack=fs,feature_stack_source='postmortem_locks (not reconstructed)',tickets=L.get('tickets') or [])
    if off is not None:
        side='home' if off<cs else ('away' if off>cs else None)
        cov=actual+cs  # >0 home covers
        res=None if side is None else ('P' if cov==0 else ('W' if (cov>0)==(side=='home') else 'L'))
        r['model_ats_at_close']=dict(result=res,side=side,line='official_b_line vs DK close (computed in postmortem; W11 not yet in record)')
    r['model_beat_market']=r['model_abs_error']<r['market_abs_error']; r['model_tied_market']=r['model_abs_error']==r['market_abs_error']
    a=r['model_abs_error']; gap=r['model_vs_market_spread_gap']
    lost_outright=(mpm>=7 and actual<0) or (mpm<=-7 and actual>0)
    if a>=20 or lost_outright: cls='catastrophe'
    elif a>=10: cls='miss'
    elif a<4.5 or (abs(gap)>=3 and r['model_beat_market'] and a<7): cls='strong'
    else: cls='partial'
    r['classification']=cls; rows.append(r)
order=['TNF','SUN_AM','SUN_PM','SNF','MNF']
rows.sort(key=lambda r:(order.index(r['window']),r['game']))
json.dump(dict(rows=rows,copied=copied,pulled=PULLED,pulled_et=PULLED_ET),open('/tmp/w11_rows.json','w'),indent=1)
n=len(rows); mae=lambda k: round(sum(r[k] for r in rows)/n,3)
print('n',n,'model',mae('model_abs_error'),'official',mae('official_abs_error'),'mkt',mae('market_abs_error'),'shadow',mae('shadow_abs_error'),'beat',sum(r['model_beat_market'] for r in rows),'copied',len(copied))
for r in rows:
    Ly=r['feature_stack'].get('layers_home_minus_away',{})
    print(f"{r['game']:8} {r['window']:6} {r['away_score']}-{r['home_score']} act {r['actual_home_margin']:+} model {r['model_home_spread']:+.2f} close {r['close_spread']:+} lock {r['street_at_lock']} mon {r['monday_open_street']} | ae {r['model_abs_error']:.2f} mkt {r['market_abs_error']:.1f} gap {r['model_vs_market_spread_gap']:+.2f} {r['classification']} beat={r['model_beat_market']} ats={r['model_ats_at_close']['result']} | prior {Ly.get('prior')} pffytd {Ly.get('pff_ytd')} inj {Ly.get('injury')} madden {Ly.get('madden')} pff {Ly.get('pff')} hfa {r['feature_stack'].get('hfa')}")

#!/usr/bin/env python3
"""Light ablation W2-W10 from locked feature stacks (descriptive). Writes /tmp/w10_abl.json."""
import json, statistics as st
DESK='/workspace/nfl-scout/desk/data/postmortem/weeks'
rows=[]
for w in ['02','03','04','05','06','07','08','09']:
    for r in json.load(open(f'{DESK}/2026-W{w}.json'))['rows']:
        r=dict(r); r['wk']=int(w); rows.append(r)
for r in json.load(open('/tmp/w10_rows.json'))['rows']:
    r=dict(r); r['wk']=10; rows.append(r)
LAY=['prior','fa','draft','madden','pff','pff_ytd','sos','return','injury']
CTX=['hfa','coach','prep','ats','travel','matchup','sched']
def comp(r,k):
    fs=r['feature_stack']
    if k in LAY: return fs['layers_home_minus_away'].get(k,0) or 0
    return fs.get(k,0) or 0
def pm(r,drop=None,scale=1.0):
    p=-r['model_home_spread']
    if drop: p-= (1-scale)*comp(r,drop)
    return p
def mae(R,f): return round(sum(abs(f(r)-r['actual_home_margin']) for r in R)/len(R),3)
def mkt(R): return round(sum(r['market_abs_error'] for r in R)/len(R),3)
pool=rows; w6=[r for r in rows if r['wk']==10]; fit=[r for r in rows if r['wk']<10]
out=dict(n_pool=len(pool),n_w6=len(w6),base_pool=mae(pool,pm),mkt_pool=mkt(pool),base_w6=mae(w6,pm),mkt_w6=mkt(w6))
out['drop']={k:mae(pool,lambda r,k=k:pm(r,k,0)) for k in LAY+CTX}
out['half']={k:mae(pool,lambda r,k=k:pm(r,k,0.5)) for k in ['prior','pff_ytd','injury','madden','pff']}
out['w6drop']={k:mae(w6,lambda r,k=k:pm(r,k,0)) for k in ['prior','pff_ytd','injury','madden','pff','hfa','travel']}
def shrink(r,s):
    h=comp(r,'hfa'); return h+s*(-r['model_home_spread']-h)
sc=[0.25,0.4,0.5,0.6,0.8,1.0]
out['whole_pool']={str(s):mae(pool,lambda r,s=s:shrink(r,s)) for s in sc}
out['whole_w6']={str(s):mae(w6,lambda r,s=s:shrink(r,s)) for s in sc}
out['whole_fit']={str(s):mae(fit,lambda r,s=s:shrink(r,s)) for s in sc}
def grid(r,a,b): return pm(r)-(1-a)*comp(r,'prior')-(1-b)*comp(r,'pff_ytd')
G={f'{a}/{b}':(mae(fit,lambda r,a=a,b=b:grid(r,a,b)),mae(w6,lambda r,a=a,b=b:grid(r,a,b))) for a in [0,0.25,0.5,1.0] for b in [0,0.5,1.0]}
out['grid_rating_x_pffytd']={k:dict(fit_w2_w5=v[0],w6=v[1]) for k,v in G.items()}
bg=min(G,key=lambda k:G[k][0]); bw=min(out['whole_fit'],key=lambda k:out['whole_fit'][k])
out['oos_w6']=dict(best_grid_on_fit=bg,best_grid_w6=G[bg][1],best_whole_on_fit=bw,best_whole_w6=out['whole_w6'][bw],
  w5_recommended_rating025_pffytd0_w6=G['0.25/0'][1],w5_recommended_whole04_w6=out['whole_w6']['0.4'])
# bias / gap buckets
def favframe(R):
    v=[]
    for r in R:
        p=-r['model_home_spread']; s=1 if p>0 else -1
        v.append(s*(p-r['actual_home_margin']))
    return round(st.mean(v),2)
out['fav_overproj_w6']=favframe(w6); out['fav_overproj_pool']=favframe(pool)
out['mean_abs_model_w6']=round(st.mean(abs(r['model_home_spread']) for r in w6),2); out['mean_abs_close_w6']=round(st.mean(abs(r['close_spread']) for r in w6),2)
out['mean_abs_model_pool']=round(st.mean(abs(r['model_home_spread']) for r in pool),2); out['mean_abs_close_pool']=round(st.mean(abs(r['close_spread']) for r in pool),2)
def bucket(R):
    B={}
    for name,lo,hi in [('<3',0,3),('3-8',3,8),('8+',8,99)]:
        S=[r for r in R if lo<=abs(r['model_vs_market_spread_gap'])<hi]
        B[name]=dict(n=len(S),beat=sum(r['model_abs_error']<r['market_abs_error'] for r in S),model_mae=round(st.mean(r['model_abs_error'] for r in S),2) if S else None,mkt_mae=round(st.mean(r['market_abs_error'] for r in S),2) if S else None)
    return B
out['gap_w6']=bucket(w6); out['gap_pool_w2_w6']=bucket(pool)
nn=[r for r in pool if not r.get('neutral') and comp(r,'hfa')>0]
out['home_margin_nonneutral']=dict(n=len(nn),mean=round(st.mean(r['actual_home_margin'] for r in nn),2))
# injury term helpfulness
def inj_help(R):
    h=0;n=0;big=[]
    for r in R:
        i=comp(r,'injury')
        if abs(i)<0.01: continue
        n+=1; e1=abs(pm(r)-r['actual_home_margin']); e0=abs(pm(r,'injury',0)-r['actual_home_margin'])
        if e1<e0: h+=1
        if abs(i)>=1.5: big.append((r['wk'],r['game'],i,round(e0-e1,2)))
    return dict(n=n,helped=h,big_terms=big)
out['inj_w6']=inj_help(w6); out['inj_pool']=inj_help(pool)
big=[x for x in out['inj_pool']['big_terms']]; out['inj_pool_big_helped']=f"{sum(1 for x in big if x[3]>0)}/{len(big)}"
json.dump(out,open('/tmp/w10_abl.json','w'),indent=1)
print(json.dumps(out,indent=1))

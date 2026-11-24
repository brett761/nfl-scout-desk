import json
exec(open('ablation_2026_w11.py').read().split('def mae')[0])
def m(R,f): return round(sum(abs(f(r)-r['actual_home_margin']) for r in R)/len(R),3)
def sb(r,inj=1.0): return pm(r)-0.75*comp(r,'prior')-comp(r,'pff_ytd')-(1-inj)*comp(r,'injury')
w11=[r for r in rows if r['wk']==11]
out={'pool':{f'injury_x{x}':m(rows,lambda r,x=x:sb(r,x)) for x in (1,0.5,0)},'w11':{f'injury_x{x}':m(w11,lambda r,x=x:sb(r,x)) for x in (1,0.5,0)}}
big=[];
for r in rows:
    i=comp(r,'injury')
    if abs(i)>=1.5:
        e1=abs(sb(r)-r['actual_home_margin']); e0=abs(sb(r,0)-r['actual_home_margin']); big.append((r['wk'],r['game'],i,round(e0-e1,2)))
out['big_shrunk']=big; out['big_shrunk_helped']=f"{sum(b[3]>0 for b in big)}/{len(big)}"
out['w11_big_shrunk']=[b for b in big if b[0]==11]
h=sum(abs(sb(r)-r['actual_home_margin'])<abs(sb(r,0)-r['actual_home_margin']) for r in w11 if abs(comp(r,'injury'))>0.01); out['w11_helped_shrunk']=h
out['w11_rows']={r['game']:dict(inj=comp(r,'injury'),live_err=round(abs(pm(r)-r['actual_home_margin']),2),shrunk=round(sb(r),2),shrunk_err=round(abs(sb(r)-r['actual_home_margin']),2)) for r in w11}
# signed bias
import statistics as st
out['w11_signed_home']=round(st.mean(pm(r)-r['actual_home_margin'] for r in w11),2)
out['w11_mkt_signed_home']=round(st.mean(r['market_signed_error'] for r in w11),2)
json.dump(out,open('/tmp/w11_extra.json','w'),indent=1); print(json.dumps(out,indent=0))

import os; os.chdir('/workspace/nfl-scout-desk-publish')
import json,subprocess,re
pulls={"1ec7dd1": ["IND", "HOU"], "590a471": ["ARI", "KC", "BAL", "CAR", "JAX", "NYG", "LV", "DEN", "MIA", "BUF", "NO", "CHI", "NYJ", "LAC", "PIT", "PHI", "TB", "DET", "TEN", "DAL"], "33e932f": ["MIN", "SF"], "2530039": ["CIN", "WSH"]}
eid={"IND": "401873066", "HOU": "401873066", "ARI": "401873067", "KC": "401873067", "BAL": "401873068", "CAR": "401873068", "JAX": "401873069", "NYG": "401873069", "LV": "401873075", "DEN": "401873075", "MIA": "401873070", "BUF": "401873070", "NO": "401873071", "CHI": "401873071", "NYJ": "401873074", "LAC": "401873074", "PIT": "401873076", "PHI": "401873076", "TB": "401873072", "DET": "401873072", "TEN": "401873073", "DAL": "401873073", "MIN": "401873077", "SF": "401873077", "CIN": "401873078", "WSH": "401873078"}
def norm(n): return re.sub(r'[^a-z]','',re.sub(r'\b(jr|sr|ii|iii|iv)\b\.?','',n.lower()))
box={}
for e in set(eid.values()):
    d=json.load(open(f'/tmp/w11/{e}.json')); names=set()
    for t in d.get('boxscore',{}).get('players',[]):
        for s in t['statistics']:
            for a in s.get('athletes',[]): names.add(norm(a['athlete']['displayName']))
    box[e]=names
out=[]
for c,teams in pulls.items():
    d=json.loads(subprocess.check_output(['git','show',f'{c}:data/injury-2026.json']))
    for tm in teams:
        for r in d['teams'].get(tm,[]):
            st=r.get('status','').upper()
            if st in ('QUESTIONABLE','DOUBTFUL') and r.get('on'):
                out.append(dict(team=tm,name=r['name'],pos=r['pos'],status=st,impact=r.get('impact'),stamp=d.get('stamp'),box_stats=norm(r['name']) in box[eid[tm]]))
json.dump(out,open('/tmp/w11_q.json','w'),indent=1)
for o in out:
    if (o['impact'] or 0)>=0.2: print(o)
for s in ('QUESTIONABLE','DOUBTFUL'):
    R=[o for o in out if o['status']==s]; Ri=[o for o in R if (o['impact'] or 0)>=0.2]
    print(s,'all',len(R),sum(o['box_stats'] for o in R),'impact>=0.2',len(Ri),sum(o['box_stats'] for o in Ri))

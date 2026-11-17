import os; os.chdir('/workspace/nsd')
import json,subprocess,re
pulls={'1b0621f':['WSH','NYG'],'d8445f7':['DET', 'NE', 'ATL', 'KC', 'CLE', 'HOU', 'GB', 'MIN', 'TEN', 'JAX', 'IND', 'MIA', 'NO', 'CAR', 'NYJ', 'BUF', 'LV', 'SEA', 'ARI', 'LAR', 'DAL', 'SF'],'b72ac50':['PIT','CIN'],'301582e':['LAC','BAL']}
eid={"NYG": "401873052", "WSH": "401873052", "DET": "401873053", "NE": "401873053", "ATL": "401873058", "KC": "401873058", "CLE": "401873056", "HOU": "401873056", "GB": "401873060", "MIN": "401873060", "TEN": "401873057", "JAX": "401873057", "IND": "401873059", "MIA": "401873059", "NO": "401873055", "CAR": "401873055", "NYJ": "401873054", "BUF": "401873054", "LV": "401873062", "SEA": "401873062", "ARI": "401873061", "LAR": "401873061", "DAL": "401873063", "SF": "401873063", "CIN": "401873064", "PIT": "401873064", "BAL": "401873065", "LAC": "401873065"}
def norm(n): return re.sub(r'[^a-z]','',re.sub(r'\b(jr|sr|ii|iii|iv)\b\.?','',n.lower()))
box={}
for e in set(eid.values()):
    d=json.load(open(f'/tmp/w10/{e}.json')); names=set()
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
json.dump(out,open('/tmp/w10_q.json','w'),indent=1)
for o in out:
    if (o['impact'] or 0)>=0.2: print(o)
for s in ('QUESTIONABLE','DOUBTFUL'):
    R=[o for o in out if o['status']==s]; Ri=[o for o in R if (o['impact'] or 0)>=0.2]
    print(s,'all',len(R),sum(o['box_stats'] for o in R),'impact>=0.2',len(Ri),sum(o['box_stats'] for o in Ri))

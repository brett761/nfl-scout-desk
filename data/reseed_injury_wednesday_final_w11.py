#!/usr/bin/env python3
"""Wednesday FINAL for Week 11 TNF IND@HOU (2026-11-18b). Copy of reseed_injury_wednesday_final_w10.py pattern.
Official Wed Game Status: colts.com reg-11 injury report table + nfl.com Week 11 injury report article
+ nfl.com/injuries/league/2026/reg11 (practice). houstontexans.com page served the Colts table, so HOU game statuses
come from the nfl.com article. Pulled 2026-11-18 ~4:30 PM ET. Only IND and HOU rows change; other clubs stay on 2026-11-18a.
Probable/cleared off the number; Out/Doubtful on (Doubtful 1.0); Q only with expected-impact judgment. No invented injuries.
Full valuation: data/injury-valuation/weeks/2026-W11-ind-hou.json.
"""
import json
from pathlib import Path
DATA = Path(__file__).resolve().parent
P = DATA / "injury-2026.json"
seed = json.loads(P.read_text())
IND_SRC = "https://www.colts.com/team/injury-report/week/reg-11"
HOU_SRC = "https://www.nfl.com/news/nfl-week-11-injury-report-2026-season"
def find(team, name):
  for r in seed["teams"][team]:
    if r["name"] == name: return r
  raise KeyError(name)
def drop(team, name):
  n = len(seed["teams"][team]); seed["teams"][team] = [r for r in seed["teams"][team] if r["name"] != name]
  assert len(seed["teams"][team]) == n - 1, name
def add(team, row):
  assert not any(r["name"] == row["name"] for r in seed["teams"][team]), row["name"]
  seed["teams"][team].append(row)
def manual(r, v): r.update(impact=v, impact_source="manual")

# ---- IND ----
find("IND","Will Mallory").update(status="OUT", injury="Hamstring", source=IND_SRC, on=True, note="Official Wed FINAL Out (DNP/DNP/DNP). TE depth thin (Alie-Cox, Towt IR); auto.")
add("IND", {"name":"Bernhard Raimann","pos":"LT","status":"OUT","injury":"Concussion","source":IND_SRC,"on":True,
  "note":"Official Wed FINAL Out (DNP/DNP/DNP), concussion. Starting LT, Madden 86. Replacement Charlie Heck (Q, Madden 64). Manual 0.6 vs auto cap 0.25."})
manual(find("IND","Bernhard Raimann"), 0.6)
find("IND","Jalen Travis").update(status="OUT", injury="Knee", source=IND_SRC, on=True, note="Official Wed FINAL Out (DNP x3). Was Doubtful (already 1.0). Starting RT, Madden 70; with Raimann out the OL is two tackles down. Auto 0.25.")
find("IND","Jerry Tillery").update(status="OUT", injury="Calf", source=IND_SRC, on=True, note="Official Wed FINAL Out (DNP x3). Rotational DT, Madden 71; auto.")
find("IND","Charvarius Ward").update(status="OUT", injury="Knee", source=IND_SRC, on=True, note="Official Wed FINAL Out (DNP x3). CB1/2, Madden 86. Was Q auto 0.5 (capped). Manual 0.5 uncapped; Taylor-Britt on IR so CB depth thin.")
manual(find("IND","Charvarius Ward"), 0.5)
g = find("IND","Sauce Gardner"); g.update(status="QUESTIONABLE", injury="Calf", source=IND_SRC, on=True,
  note="Official Wed FINAL Questionable (DNP Mon/Tue/Wed). Madden 88. P(play) ~0.4, P(miss) ~0.6 on three DNPs; Q 0.35 mult x manual 0.85 ~ 0.30 expected.")
manual(g, 0.85)
find("IND","Anthony Gould").update(status="QUESTIONABLE", injury="Toe", source=IND_SRC, on=True, note="Official Wed FINAL Questionable (LP/LP/FP). Full Wed, P(play) ~0.85. Soft on at auto.")
add("IND", {"name":"Charlie Heck","pos":"RT","status":"QUESTIONABLE","injury":"Personal (NIR)","source":IND_SRC,"on":True,
  "note":"Official Wed FINAL Questionable (not injury related, DNP Tue/Wed). Swing tackle Madden 64; matters because Raimann and Travis are Out. Soft on at auto."})
find("IND","Luke Rhodes").update(status="QUESTIONABLE", injury="Hamstring", source=IND_SRC, on=True, note="Official Wed FINAL Questionable (DNP/LP/LP). LS, soft on at auto.")

# ---- HOU ----
find("HOU","Woody Marks").update(status="OUT", injury="Concussion", source=HOU_SRC, on=True, note="Official Wed FINAL Out. Was Doubtful (already 1.0). Montgomery full participant covers; auto.")
find("HOU","Marvin Harrison Jr.").update(status="OUT", injury="Hamstring", source=HOU_SRC, on=True, note="Official Wed FINAL Out (DNP). Was Q. WR, Madden 76; Collins healthy, Noel/Higgins on IR; auto.")
find("HOU","Brevin Jordan").update(status="OUT", injury="Foot/illness", source=HOU_SRC, on=True, note="Official Wed FINAL Out (DNP). TE, auto.")
h = find("HOU","Danielle Hunter"); h.update(status="OUT", injury="Hamstring", source=HOU_SRC, on=True,
  note="Official Wed FINAL Out (DNP). Was Q auto 0.5. EDGE1, Madden 90, elite rusher; manual 0.7 uncapped.")
manual(h, 0.7)
t = {"name":"Wyatt Teller","pos":"OG","status":"QUESTIONABLE","injury":"Back","source":HOU_SRC,"on":True,
  "note":"Official Wed FINAL Questionable (FP all week per nfl.com). P(miss) ~0.1. Manual 0.1 x 0.35 soft."}
add("HOU", t); manual(find("HOU","Wyatt Teller"), 0.1)
s = find("HOU","Jaylin Smith"); s.update(status="QUESTIONABLE", injury="Hamstring", source=HOU_SRC, on=True,
  note="Official Wed FINAL Questionable (FP). ESPN had IR; official sheet lists Q and he practiced full -> plays likely. Manual 0.1 soft.")
manual(s, 0.1)
find("HOU","Jake Hummel").update(status="QUESTIONABLE", injury="Groin", source=HOU_SRC, on=True, note="Official Wed FINAL Questionable (LP). Soft on at auto.")
drop("HOU","Kamari Lassiter")  # DNP Mon-Wed on nfl.com practice, but no game status on the official sheet -> off (watch Thursday)

seed["pulled"]="2026-11-18b"; seed["stamp"]="2026-11-18b"
seed["pulled_et"]="2026-11-18 4:30 PM ET (America/New_York)"; seed["phase"]="FINAL"
seed["sources"]=[IND_SRC,"https://www.nfl.com/news/nfl-week-11-injury-report-2026-season","https://www.nfl.com/injuries/league/2026/reg11","https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries"]
seed["note"]=("FINAL 2026-11-18b Week 11 TNF IND@HOU after official Wed Game Status (colts.com reg-11 table + nfl.com Week 11 report). "
 "IND OUT: Mallory TE, Raimann LT (manual 0.6), Travis RT, Tillery DT, C. Ward CB (manual 0.5); Q: Gardner CB (DNP x3, manual 0.85), Gould, Heck, Rhodes. "
 "HOU OUT: Marks RB, M. Harrison Jr. WR, Jordan TE, Hunter EDGE (manual 0.7); Q: Teller (manual 0.1), J. Smith (manual 0.1, ESPN IR overridden by official Q/FP), Hummel; Lassiter no status (off). "
 "IND/HOU rows TNF-protected: later ESPN reseeds must not soften them. Other clubs unchanged from 2026-11-18a WORKING-WED. Doubtful 1.0. Standing manuals preserved.")
P.write_text(json.dumps(seed, indent=2, ensure_ascii=False)+"\n"); print("ok")

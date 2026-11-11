#!/usr/bin/env python3
"""Wednesday FINAL for Week 10 TNF WSH@NYG (2026-11-11b). Copy of reseed_injury_wednesday_final_w9.py pattern.
Official Wed Game Status: giants.com / commanders.com reg-10 injury report tables + nfl.com Week 10 injury report article
+ nfl.com/injuries/league/2026/reg10. Pulled 2026-11-11 ~4:25 PM ET. Only WSH and NYG rows change; every other club stays on
2026-11-11a WORKING-WED (ESPN working tags as-is; Sunday official sheet Friday).
Probable/cleared off the number; Out/Doubtful on (Doubtful 1.0); Q only with expected-impact judgment. No invented injuries.
Full valuation: data/injury-valuation/weeks/2026-W10-wsh-nyg.json.
"""
import json
from pathlib import Path
DATA = Path(__file__).resolve().parent
P = DATA / "injury-2026.json"
seed = json.loads(P.read_text())
NYG_SRC = "https://www.giants.com/team/injury-report/week/reg-10"
WSH_SRC = "https://www.commanders.com/team/injury-report/week/reg-10"
NFL_SRC = "https://www.nfl.com/news/nfl-week-10-injury-report-2026-season"

def find(team, name):
  for r in seed["teams"][team]:
    if r["name"] == name:
      return r
  raise KeyError(name)

def drop(team, name):
  n = len(seed["teams"][team])
  seed["teams"][team] = [r for r in seed["teams"][team] if r["name"] != name]
  assert len(seed["teams"][team]) == n - 1, name

def add(team, row):
  assert not any(r["name"] == row["name"] for r in seed["teams"][team]), row["name"]
  seed["teams"][team].append(row)

# ---- WSH ----
find("WSH", "Colson Yankoff").update(status="OUT", injury="Knee", source=WSH_SRC, on=True,
  note="Official Wed FINAL Out (DNP Tue/Wed). Was Q soft on WORKING; now full at auto. TE depth (Bates/Okonkwo FP) covers.")
find("WSH", "Lucas Patrick").update(status="OUT", injury="Concussion", source=WSH_SRC, on=True,
  note="Official Wed FINAL Out (DNP Tue/Wed), concussion. Was Doubtful (already 1.0), no point change. Gulbin (FP) at C.")
drop("WSH", "Treylon Burks")  # DNP/LP, no game status -> plays, off (was ESPN OUT)
# Daniels, Bates, Gulbin, Okonkwo, Robertson, Tuttle: FP/LP->FP, no status -> off (not added). IR rows unchanged.

# ---- NYG ----
drop("NYG", "J.J. McCarthy")  # LP/FP/FP, no status -> plays, off
drop("NYG", "Cam Skattebo")   # LP/FP/FP, no status -> plays, off (was ESPN OUT)
add("NYG", {"name": "Malik Harrison", "pos": "LB", "status": "QUESTIONABLE", "injury": "Groin", "source": NYG_SRC, "on": True,
  "note": "Official Wed FINAL Questionable (LP/LP/LP). Starting MIKE with Edmunds on IR (Madden 73). P(play) ~0.6. Q soft on at auto."})
# Carter, Hood, C. Jones, Mooney, Eluemunor, T. Johnson, Nabers, A. Thomas: no status -> off. IR rows unchanged.

seed["pulled"] = "2026-11-11b"
seed["stamp"] = "2026-11-11b"
seed["pulled_et"] = "2026-11-11 4:25 PM ET (America/New_York)"
seed["phase"] = "FINAL"
seed["sources"] = [NYG_SRC, WSH_SRC, NFL_SRC, "https://www.nfl.com/injuries/league/2026/reg10", "https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries"]
seed["note"] = ("FINAL 2026-11-11b Week 10 TNF WSH@NYG after official Wed Game Status (giants.com/commanders.com reg-10 tables + nfl.com Week 10 report). "
  "WSH: Yankoff (knee) and Patrick (concussion) OUT; Burks no status (off, was ESPN OUT); Daniels FP. IR rows unchanged. "
  "NYG: Malik Harrison Q groin (soft on); Skattebo and McCarthy no status (off, Skattebo was ESPN OUT); IR rows unchanged. "
  "WSH/NYG rows are TNF-protected: later ESPN reseeds must not soften them. Other clubs unchanged from 2026-11-11a WORKING-WED (ESPN working tags as-is; official sheet Friday). "
  "Madden-first else PFF; Probable/cleared OFF; Q only with expected-impact judgment. Doubtful 1.0. Standing manuals preserved.")
P.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n")
print("ok")

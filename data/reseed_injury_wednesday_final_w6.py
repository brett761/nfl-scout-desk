#!/usr/bin/env python3
"""Wednesday FINAL for Week 6 TNF SEA@DEN (2026-10-14b).
Official Wed ~4pm ET Game Status from denverbroncos.com / seahawks.com (dual table), pulled 2026-10-14 9:20 PM ET (rerun of the interrupted 4:15 PM routine).
Only SEA and DEN rows change. Every other club stays on 2026-10-14a WORKING-WED (Sunday official sheet Friday).
Probable/cleared off the number; Out/Doubtful on; Q only with expected-impact judgment. No invented injuries.
"""
import json
from pathlib import Path
DATA = Path(__file__).resolve().parent
P = DATA / "injury-2026.json"
seed = json.loads(P.read_text())
DEN_SRC = "https://www.denverbroncos.com/team/injury-report/"
SEA_SRC = "https://www.seahawks.com/team/injury-report/"
NFL_SRC = "https://www.nfl.com/injuries/"

def find(team, name):
  for r in seed["teams"][team]:
    if r["name"] == name:
      return r
  raise KeyError(name)

def drop(team, name):
  seed["teams"][team] = [r for r in seed["teams"][team] if r["name"] != name]

# ---- SEA ----
find("SEA", "Zach Charbonnet").update(status="OUT", injury="Knee", source=SEA_SRC, on=True,
  note="Official Wed FINAL Out (LP Mon-Wed). Auto tier.")
find("SEA", "Chazz Surratt").update(status="OUT", injury="Calf", source=SEA_SRC, on=True,
  note="Official Wed FINAL Out (DNP Mon-Wed). Auto tier.")
find("SEA", "Drake Thomas").update(status="OUT", injury="Ankle", source=SEA_SRC, on=True,
  note="Official Wed FINAL Out (DNP Mon-Wed). Starting LB. Auto tier.")
for nm in ("Jaxon Smith-Njigba", "Drew Lock"):
  drop("SEA", nm)  # no game status (JSN FP Wed, Lock LP all week, backup QB) -> off the number

# ---- DEN ----
find("DEN", "Pat Surtain II").update(status="OUT", injury="Ankle", source=DEN_SRC, on=True,
  note="Official Wed FINAL Out (DNP Mon-Wed). Was Doubtful (same price).")
find("DEN", "Talanoa Hufanga").update(status="OUT", injury="Ankle", source=DEN_SRC, on=True,
  note="Official Wed FINAL Out (DNP Mon-Wed). Madden 0.5.")
find("DEN", "Riley Moss").update(status="QUESTIONABLE", injury="Ribs", source=DEN_SRC, on=True,
  note="Official Wed FINAL Questionable, LP Mon-Wed. With Surtain Out, CB room thin -> Q kept soft on (auto).")

seed["pulled"] = "2026-10-14b"
seed["stamp"] = "2026-10-14b"
seed["pulled_et"] = "2026-10-14 9:20 PM ET (America/New_York)"
seed["phase"] = "FINAL"
seed["sources"] = [DEN_SRC, SEA_SRC, NFL_SRC, "https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries"]
seed["note"] = ("FINAL 2026-10-14b Week 6 TNF SEA@DEN after official Wed ~4pm ET Game Status (denverbroncos.com / seahawks.com dual table). "
  "SEA: Charbonnet, Surratt, Drake Thomas OUT; JSN (FP Wed) and Drew Lock cleared off number; Holani/L. Williams/Stephens/Charles no status. "
  "DEN: Surtain OUT (was Doubtful), Hufanga OUT (was Q), Moss Q (LP all week, soft on); B. Jones/S. Jones/Powers cleared. "
  "SEA/DEN rows are TNF-protected: later ESPN reseeds must not soften them. Sunday/MNF clubs unchanged from 2026-10-14a WORKING-WED (official sheet Friday). "
  "Madden-first else PFF; Probable/cleared OFF; Q only with expected-impact judgment. Doubtful 1.0. Standing manuals preserved.")
P.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n")
print("ok")

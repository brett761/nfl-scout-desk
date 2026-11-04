#!/usr/bin/env python3
"""Wednesday FINAL for Week 9 TNF JAX@BAL (2026-11-04b). Copy of reseed_injury_wednesday_final_w8.py pattern.
Official Wed Game Status: jaguars.com reg-9 injury report (both clubs, Mon-Wed + game status), nfl.com Week 9 injury report
article, nfl.com/injuries. Pulled 2026-11-04 ~4:25 PM ET. Only JAX and BAL rows change; every other club stays on
2026-11-04a WORKING-WED (ESPN working tags as-is; Sunday official sheet Friday).
Probable/cleared off the number; Out/Doubtful on (Doubtful 1.0); Q only with expected-impact judgment. No invented injuries.
Full valuation: data/injury-valuation/weeks/2026-W09-jax-bal.json.
"""
import json
from pathlib import Path
DATA = Path(__file__).resolve().parent
P = DATA / "injury-2026.json"
seed = json.loads(P.read_text())
JAX_SRC = "https://www.jaguars.com/team/injury-report/week/reg-9"
BAL_SRC = "https://www.baltimoreravens.com/team/injury-report/"
NFL_SRC = "https://www.nfl.com/news/nfl-week-9-injury-report-2026-season"

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

# ---- JAX ----
find("JAX", "Travon Walker").update(status="QUESTIONABLE", injury="Rib", source=JAX_SRC, on=True,
  note="Official Wed FINAL Questionable (DNP/LP/LP). Starting EDGE1; trending to play. Q soft on at auto (0.2 x 0.35 = 0.07).")
find("JAX", "Bhayshul Tuten").update(status="QUESTIONABLE", injury="Ankle/Foot", source=JAX_SRC, on=True,
  note="Official Wed FINAL Questionable (DNP/DNP/DNP), lean miss (P(play) ~0.25). Chris Rodriguez Jr. (LP all week, no status) carries the load. Q soft on at auto 0.07; full value small with a capable RB2.")
drop("JAX", "Jakobi Meyers")        # LP x3, no game status -> plays, off
drop("JAX", "Chris Rodriguez Jr.")  # LP x3, no game status -> plays, off
drop("JAX", "Antonio Johnson")      # LP x3, no game status -> plays, off
# Hamilton / Murray / Harrison / Braswell / Ransaw / Green: IR rows stay on. Cleveland, Combs, Jarrian Jones: LP, no status -> off (not added).

# ---- BAL ----
find("BAL", "Tyler Huntley").update(status="OUT", injury="Toe", source=BAL_SRC, on=True,
  note="Official Wed FINAL Out (DNP Mon-Wed), season-ending turf toe per Schefter; IR expected. Undrafted rookie Joe Fagnano (FP) starts; Brissett trade will not be in time for TNF. Auto QB1 1.5 kept as the Huntley-to-Fagnano step (Lamar row prices Lamar-to-Huntley).")
find("BAL", "Lamar Jackson").update(status="IR", source=BAL_SRC, on=True,
  note="Official Wed FINAL Out (DNP Mon-Wed), thumb surgery, IR. Madden 1.5 kept.")
find("BAL", "Jaylinn Hawkins").update(status="OUT", injury="Knee", source=BAL_SRC, on=True,
  note="Official Wed FINAL Out (DNP Mon-Wed). Starting S. Was Q soft; now full 0.25 (pff).")
find("BAL", "Adam Randall").update(status="QUESTIONABLE", injury="Neck", source=BAL_SRC, on=True,
  note="Official Wed FINAL Questionable (FP Mon-Wed) but must be activated from IR to play. Justice Hill (FP, no status) available. Q soft on at auto.")
add("BAL", {"name": "Nate Wiggins", "pos": "CB1", "status": "QUESTIONABLE", "injury": "Stinger/Illness", "source": BAL_SRC, "on": True,
  "note": "Official Wed FINAL Questionable (FP/FP/DNP, illness added Wed). Starting CB. Illness on a short week, P(play) ~0.65. Q soft on at auto (0.25 x 0.35)."})
# Ioane, Stanley, Rosengarten, Simpson, Roquan Smith, Hendrickson, Andrews, Campbell, Jenkins, Hill, Fagnano: no status -> off.

seed["pulled"] = "2026-11-04b"
seed["stamp"] = "2026-11-04b"
seed["pulled_et"] = "2026-11-04 4:25 PM ET (America/New_York)"
seed["phase"] = "FINAL"
seed["sources"] = [JAX_SRC, BAL_SRC, NFL_SRC, "https://www.nfl.com/injuries/", "https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries"]
seed["note"] = ("FINAL 2026-11-04b Week 9 TNF JAX@BAL after official Wed Game Status (jaguars.com reg-9 table + nfl.com Week 9 report). "
  "JAX: Walker and Tuten Q (soft on); Meyers, Rodriguez Jr., A. Johnson no status (off); IR rows unchanged. "
  "BAL: Lamar (IR), Huntley, Hawkins OUT; Fagnano starts; Randall Q (IR activation needed) and Wiggins Q illness (soft on); Ioane and the OL no status (off). "
  "JAX/BAL rows are TNF-protected: later ESPN reseeds must not soften them. Other clubs unchanged from 2026-11-04a WORKING-WED (ESPN working tags as-is; official sheet Friday). "
  "Madden-first else PFF; Probable/cleared OFF; Q only with expected-impact judgment. Doubtful 1.0. Standing manuals preserved.")
P.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n")
print("ok")

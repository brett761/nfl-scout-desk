#!/usr/bin/env python3
"""Wednesday FINAL for Week 5 TNF TB@DAL (2026-10-07b).
Official Wed ~4pm ET Game Status from dallascowboys.com (dual table) + NFL.com /injuries, pulled 2026-10-07 4:22 PM ET.
Only TB and DAL rows change. Every other club stays on 2026-10-07a WORKING-WED (Sunday official sheet Friday).
Probable/cleared off the number; Out/Doubtful on; Q only with expected-impact judgment. No invented injuries.
"""
import json
from pathlib import Path
DATA = Path(__file__).resolve().parent
P = DATA / "injury-2026.json"
seed = json.loads(P.read_text())
DAL_SRC = "https://www.dallascowboys.com/team/injury-report/"
NFL_SRC = "https://www.nfl.com/injuries/"

def find(team, name):
  for r in seed["teams"][team]:
    if r["name"] == name:
      return r
  return None

def drop(team, name):
  seed["teams"][team] = [r for r in seed["teams"][team] if r["name"] != name]

# ---- TB ----
r = find("TB", "Baker Mayfield")
r.update(status="OUT", injury="Right Thumb", source=DAL_SRC, on=True,
         note="Official Wed FINAL Out (DNP Mon-Wed). Rookie Jalon Daniels makes 2nd start. QB tier 1.5 kept: TB 2026 results/PFF YTD already carry the Week 4 Daniels start.")
r = find("TB", "Antoine Winfield Jr.")
r.update(status="OUT", injury="Rib", source=DAL_SRC, on=True,
         note="Official Wed FINAL Out (DNP Mon-Wed); slight rib fracture, 2-4 weeks. All-Pro tier 0.5.")
r = find("TB", "Benjamin Morrison")
r.update(status="OUT", injury="Undisclosed (quadriceps)", source=DAL_SRC, on=True, impact=0.3, impact_source="manual",
         note="Official Wed FINAL Out (DNP Mon-Wed). Starting outside CB. Manual 0.3 (auto 0.25 + secondary cluster with Winfield Out / Hayes IR vs Lamb-Pickens).")
r = find("TB", "SirVocea Dennis")
r.update(status="OUT", injury="Ankle/Foot", source=DAL_SRC, on=True,
         note="Official Wed FINAL Out (DNP Mon-Wed). Starting ILB; Trotter (FP Wed) cleared behind him. Auto tier.")
for nm in ("Ko Kieft", "Chase McLaughlin"):
  drop("TB", nm)  # FP Wed, no game status -> off the number

# ---- DAL ----
r = find("DAL", "Drew Shelton")
r.update(status="OUT", injury="Hamstring", source=DAL_SRC, on=True,
         note="Official Wed FINAL Out (DNP Mon-Wed). Auto tier.")
r = find("DAL", "DeMarvion Overshown")
r.update(status="OUT", injury="Hamstring", source=DAL_SRC, on=True,
         note="Official Wed FINAL Out (DNP Mon-Wed). PFF 0.2.")
r = find("DAL", "Cobie Durant")
r.update(status="OUT", injury="Hamstring", source=DAL_SRC, on=True,
         note="Official Wed FINAL Out (DNP Mon-Wed). Madden 0.2.")
r = find("DAL", "Tyler Smith")
r.update(status="QUESTIONABLE", injury="Thumb", source=DAL_SRC, on=False,
         note="Official Wed FINAL Questionable but LP/LP/FP (full Wed). ESPN had him on IR (wrong). Expected to play -> OFF number.")
if not find("DAL", "Jonathan Mingo"):
  seed["teams"]["DAL"].append({
    "name": "Jonathan Mingo", "pos": "WR2", "status": "QUESTIONABLE", "injury": "Illness",
    "note": "Official Wed FINAL Questionable, illness (DNP Wed, added Wed). WR3 behind Lamb/Pickens. Q mult on; manual 0.15 (depth WR).",
    "source": DAL_SRC, "on": True, "impact": 0.15, "impact_source": "manual"})

seed["pulled"] = "2026-10-07b"
seed["stamp"] = "2026-10-07b"
seed["pulled_et"] = "2026-10-07 4:22 PM ET (America/New_York)"
seed["phase"] = "FINAL"
seed["sources"] = [DAL_SRC, NFL_SRC, "https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries",
                   "https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=401872980"]
seed["note"] = ("FINAL 2026-10-07b Week 5 TNF TB@DAL after official Wed ~4pm ET Game Status (dallascowboys.com dual table / NFL.com). "
  "TB: Mayfield OUT (QB 1.5, Jalon Daniels 2nd start), Winfield OUT 0.5, Morrison OUT (manual 0.3, secondary cluster), Dennis OUT; Kieft/McLaughlin/Bain/Trotter/Nelson cleared off number; McMillan/Hayes/Kamara IR, Sills IR manual 0. "
  "DAL: Durant/Overshown/Shelton OUT; Tyler Smith Q but full Wed (OFF number; ESPN IR tag was wrong); Mingo Q illness (manual 0.15 soft on); Lamb/Porter/Hooker/Clark/Goodson/Houston cleared; Bullard/Thompson/Locke/Davis IR. "
  "TB/DAL rows are TNF-protected: later ESPN reseeds must not soften them. Sunday/MNF clubs unchanged from 2026-10-07a WORKING-WED (official sheet Friday). "
  "Madden-first else PFF; floor 0.2x status; Probable/cleared OFF; Q only with expected-impact judgment. Doubtful 1.0 from Week 5. Tier caps QB<=1.5 / All-Pro<=0.5 / other<=0.25 on auto; Cap team 6.0. Standing manuals preserved (Sills 0).")
seed["espn_timestamp"] = "2026-10-07T20:22:00Z"
P.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n")
print("ok")

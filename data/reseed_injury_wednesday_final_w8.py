#!/usr/bin/env python3
"""Wednesday FINAL for Week 8 TNF CAR@GB (2026-10-28b). Copy of reseed_injury_wednesday_final_w7.py pattern.
Official Wed Game Status: packers.com "Packers list four questionable, rule out three vs. Panthers | Week 8 Injury Report"
(Oct 28, 1:59 PM CT, both clubs' tables incl. Wed column + game status), panthers.com injury report table (CAR Wed + game status),
nfl.com Week 8 injury report article. Pulled 2026-10-28 ~4:25 PM ET. Only CAR and GB rows change; every other club stays on
2026-10-28a WORKING-WED (ESPN working tags as-is; Sunday official sheet Friday).
Probable/cleared off the number; Out/Doubtful on (Doubtful 1.0); Q only with expected-impact judgment. No invented injuries.
Full valuation: data/injury-valuation/weeks/2026-W08-car-gb.json.
"""
import json
from pathlib import Path
DATA = Path(__file__).resolve().parent
P = DATA / "injury-2026.json"
seed = json.loads(P.read_text())
GB_SRC = "https://www.packers.com/news/packers-list-four-questionable-rule-out-three-vs-panthers-week-8-injury-report"
CAR_SRC = "https://www.panthers.com/team/injury-report/"
NFL_SRC = "https://www.nfl.com/news/nfl-week-8-injury-report-2026-season"

def find(team, name):
  for r in seed["teams"][team]:
    if r["name"] == name:
      return r
  raise KeyError(name)

def drop(team, name):
  seed["teams"][team] = [r for r in seed["teams"][team] if r["name"] != name]

def add(team, row):
  assert not any(r["name"] == row["name"] for r in seed["teams"][team]), row["name"]
  seed["teams"][team].append(row)

# ---- CAR ----
find("CAR", "Jaelan Phillips").update(status="OUT", injury="Hamstring", source=CAR_SRC, on=True,
  note="Official Wed FINAL Out (DNP Mon-Wed). Starting OLB/edge (Madden 82, PFF 74.1); missed Week 7 too. Umanmielen/Jones replace. Auto 0.25 (cap) agrees.")
find("CAR", "Akayleb Evans").update(status="OUT", injury="Triceps/Knee", source=CAR_SRC, on=True, pos="CB1",
  impact=0.4, impact_source="manual",
  note="Official Wed FINAL Out (DNP Mon-Wed). Starting LCB. With Horn and Mike Jackson on IR, CAR has two healthy 53-man CBs (Will Lee, Chau Smith-Wade PFF 58.1) plus PS elevations. Manual 0.4 = ~0.2 individual + ~0.2 CB-cluster interaction vs Love/Watson/Kraft (Horn/Jackson already priced on IR rows).")
add("CAR", {"name": "Damien Lewis", "pos": "OG", "status": "OUT", "injury": "Knee", "source": CAR_SRC, "on": True,
  "impact": 0.3, "impact_source": "manual",
  "note": "Official Wed FINAL Out (DNP Mon-Wed). Starting LG (Madden 87, PFF 75.7, 987 snaps 2025). Corey Bullock (backup, no Madden/PFF top-22 grade) starts. Manual 0.3: auto tier cap 0.25 understates drop from a top-10 guard to a reserve; OL already without RT Moton (IR) and Christensen (IR)."})
add("CAR", {"name": "Torricelli Simpkins III", "pos": "OG", "status": "OUT", "injury": "Ankle", "source": CAR_SRC, "on": True,
  "impact": 0.05, "impact_source": "manual",
  "note": "Official Wed FINAL Out (DNP Mon-Wed). Reserve OL (third on ESPN LG depth). Depth only; manual 0.05 instead of pos-base 0.25 auto."})
# Bobby Brown III: official Q but DNP/FP/FP -> expected impact ~0, kept off the number (not added).
# Jalen Coker, Bryce Young, Ryan Fitzgerald: on report, no game status (FP) -> off.

# ---- GB ----
find("GB", "Sean Rhyan").update(status="OUT", injury="Ankle", source=GB_SRC, on=True,
  note="Official Wed FINAL Out (DNP Mon-Wed est.). Starting C (PFF 58.5); John Williams finished Week 7 at C. Monk (C) on IR. Auto 0.2 kept.")
find("GB", "Zaire Franklin").update(status="OUT", injury="Shin", source=GB_SRC, on=True,
  note="Official Wed FINAL Out (DNP Mon-Wed est.). Was Doubtful (same 1.0 price). Hopper/McDuffie (Madden 78) cover; missed Week 7 too. Auto 0.2 kept.")
add("GB", {"name": "Travis Glover", "pos": "OG", "status": "OUT", "injury": "Knee", "source": GB_SRC, "on": True,
  "impact": 0.05, "impact_source": "manual",
  "note": "Official Wed FINAL Out (DNP Mon-Wed est.). Played all 67 RG snaps Week 7. Kevin Zeitler (Madden 85, PFF 74.5, healthy scratch Week 7) is the likely RG; replacement is at least as good. Manual 0.05 instead of pos-base 0.25 auto."})
find("GB", "Matthew Golden").update(status="QUESTIONABLE", injury="Shoulder/Foot", source=GB_SRC, on=True,
  note="Official Wed FINAL Questionable (DNP/DNP/LP est., walkthroughs). LaFleur 'hopeful.' WR1-type usage (team-high 36 catches). Q soft on at auto (0.2 x 0.35).")
find("GB", "Devonte Wyatt").update(status="QUESTIONABLE", injury="Ankle", source=GB_SRC, on=True,
  note="Official Wed FINAL Questionable (DNP/LP/LP est.). Starting DT; DL already without Hargrave/Ford/Brinson (IR). Q soft on at auto (0.2 x 0.35).")
drop("GB", "Aaron Banks")  # FP Wed, no game status -> off the number (available)
# Anthony Campbell (DT) / Brenton Cox Jr. (EDGE): official Q, LP/LP, rotational depth -> expected impact <0.05, kept off.
# Benjamin St-Juste: FP all week, no status -> off.

seed["pulled"] = "2026-10-28b"
seed["stamp"] = "2026-10-28b"
seed["pulled_et"] = "2026-10-28 4:25 PM ET (America/New_York)"
seed["phase"] = "FINAL"
seed["sources"] = [GB_SRC, CAR_SRC, "https://www.packers.com/team/injury-report/", NFL_SRC, "https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries"]
seed["note"] = ("FINAL 2026-10-28b Week 8 TNF CAR@GB after official Wed Game Status (packers.com game-status article + panthers.com table + nfl.com Week 8 report). "
  "CAR: Phillips, Akayleb Evans (manual 0.4 CB cluster), Damien Lewis (manual 0.3), Simpkins (manual 0.05) OUT; Bobby Brown Q FP (off); Coker/Young/Fitzgerald no status (off). "
  "GB: Rhyan, Franklin, Glover (manual 0.05, Zeitler replaces) OUT; Golden and Wyatt Q (soft on); Campbell/Cox Q depth (off); Banks/St-Juste no status (off). "
  "CAR/GB rows are TNF-protected: later ESPN reseeds must not soften them. Other clubs unchanged from 2026-10-28a WORKING-WED (ESPN working tags as-is; official sheet Friday). "
  "Madden-first else PFF; Probable/cleared OFF; Q only with expected-impact judgment. Doubtful 1.0. Standing manuals preserved.")
P.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n")
print("ok")

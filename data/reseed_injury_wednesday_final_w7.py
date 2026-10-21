#!/usr/bin/env python3
"""Wednesday FINAL for Week 7 TNF NE@CHI (2026-10-21b).
Official Wed ~4pm ET Game Status: chicagobears.com injury report (CHI Wed column + game status) and
patriots.com "Injury Report Analysis: Patriots rule out five players" (Oct 21, 3:14 PM ET; patriots.com table Wed column not yet filled),
pulled 2026-10-21 ~4:25 PM ET. Only NE and CHI rows change; every other club stays on 2026-10-21a WORKING-WED (Sunday official sheet Friday).
Probable/cleared off the number; Out/Doubtful on; Q only with expected-impact judgment. No invented injuries.
"""
import json
from pathlib import Path
DATA = Path(__file__).resolve().parent
P = DATA / "injury-2026.json"
seed = json.loads(P.read_text())
CHI_SRC = "https://www.chicagobears.com/team/injury-report/"
NE_SRC = "https://www.patriots.com/news/injury-report-analysis-patriots-rule-out-five-players-for-thursday-night-football-vs-the-bears"
NFL_SRC = "https://www.nfl.com/injuries/"

def find(team, name):
  for r in seed["teams"][team]:
    if r["name"] == name:
      return r
  raise KeyError(name)

def drop(team, name):
  seed["teams"][team] = [r for r in seed["teams"][team] if r["name"] != name]

# ---- NE ----
find("NE", "Alijah Vera-Tucker").update(status="OUT", injury="Hamstring", source=NE_SRC, on=True,
  note="Official Wed FINAL Out (DNP all week). Starting LG; Walter Rouse starts. Was Doubtful (same price).")
find("NE", "Ben Brown").update(status="OUT", injury="Knee", source=NE_SRC, on=True,
  note="Official Wed FINAL Out (DNP all week). Starting RG; Matt Pryor starts. Was Doubtful (same price).")
find("NE", "Carlton Davis III").update(status="OUT", injury="Neck", source=NE_SRC, on=True,
  note="Official Wed FINAL Out (DNP/LP). Third straight missed game; same CB group as Week 6 vs NYJ.")
find("NE", "Karon Prunty").update(status="OUT", injury="Hamstring", source=NE_SRC, on=True,
  note="Official Wed FINAL Out. Rookie depth CB. Auto tier.")
find("NE", "Channing Canada").update(status="OUT", injury="Hamstring", source=NE_SRC, on=True,
  note="Official Wed FINAL Out. Rookie depth CB. Auto tier.")
find("NE", "Morgan Moses").update(status="QUESTIONABLE", injury="Foot", source=NE_SRC, on=True,
  note="Official Wed FINAL Questionable (LP Mon/Tue). Real miss risk on short week; Caleb Lomu (59 good snaps at RT Wk6) replaces. Q kept soft on (auto).")
drop("NE", "A.J. Brown")  # off the injury report (no game status) -> off the number
# Byard / Woodson / Elliss: official Q but FP every day -> expected impact ~0, kept off the number (not added).

# ---- CHI ----
find("CHI", "Kyle Monangai").update(status="OUT", injury="Thumb/Toe", source=CHI_SRC, on=True,
  note="Official Wed FINAL Out (DNP Mon-Wed). RB1. Auto tier.")
find("CHI", "Jack Sanborn").update(status="OUT", injury="Concussion", source=CHI_SRC, on=True,
  note="Official Wed FINAL Out (DNP Mon-Wed). Auto tier.")
find("CHI", "T.J. Edwards").update(status="DOUBTFUL", injury="Hamstring", source=CHI_SRC, on=True,
  note="Official Wed FINAL Doubtful (DNP/DNP/LP) -> 1.0 out. Starting LB; LB room down Edwards + Sanborn.")
drop("CHI", "Jonah Jackson")  # DNP/LP/FP, no game status -> off
# Tyrique Stevenson Q (FP Mon-Wed) -> expected impact ~0, kept off. Keyshaun Elliott no status.

seed["pulled"] = "2026-10-21b"
seed["stamp"] = "2026-10-21b"
seed["pulled_et"] = "2026-10-21 4:25 PM ET (America/New_York)"
seed["phase"] = "FINAL"
seed["sources"] = [CHI_SRC, NE_SRC, "https://www.patriots.com/team/injury-report/", NFL_SRC, "https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries"]
seed["note"] = ("FINAL 2026-10-21b Week 7 TNF NE@CHI after official Wed ~4pm ET Game Status (chicagobears.com table; patriots.com game-status article). "
  "NE: Vera-Tucker, Ben Brown (both guards), Carlton Davis, Prunty, Canada OUT; Moses Q (soft on); Byard/Woodson/Elliss Q but FP all week (off); A.J. Brown cleared off. "
  "CHI: Monangai, Sanborn OUT; T.J. Edwards DOUBTFUL (1.0); Stevenson Q FP all week (off); Jonah Jackson cleared off. "
  "NE/CHI rows are TNF-protected: later ESPN reseeds must not soften them. Sunday/MNF clubs unchanged from 2026-10-21a WORKING-WED (official sheet Friday). "
  "Madden-first else PFF; Probable/cleared OFF; Q only with expected-impact judgment. Doubtful 1.0. Standing manuals preserved.")
P.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n")
print("ok")

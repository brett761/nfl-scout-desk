#!/usr/bin/env python3
"""Friday WORKING reseed (2026-10-09a; derived from Thursday script) for injury-2026.json (Week 5 board, 2026-10-08a).
TNF TB@DAL protected: official Wed FINAL Game Status (2026-10-07b) kept verbatim for TB/DAL.
Preserves manuals; applies tier caps. Week 4 fully FINAL (incl. MNF ATL@NO). Byes KC/CAR.
WORKING-THU after Wednesday FINAL (2026-10-07b TNF TB@DAL). ESPN working designations only — no invented rumor moves.
Protects: TB/DAL verbatim (official Wed FINAL Game Status for TNF tonight 8:15 PM ET).
Finished Week 4 clubs (all 32): drop gameday inactive / ruled-out-for-remainder / coach's-decision
noise; keep real multi-week OUT + IR/PUP/NFI; one-game Q/D leftovers clear when ESPN drops them.
Week 5 official practice sheet locks Wed ~4pm ET — not invented here. Drop Aaron Donald (retired ESPN quirk).
"""
import json, re, copy, sys
from datetime import datetime
from zoneinfo import ZoneInfo
from pathlib import Path

DATA = Path(__file__).resolve().parent
espn = json.loads((Path("/tmp/espn-injuries.json")).read_text())
seed = json.loads((DATA / "injury-2026.json").read_text())
scale = json.loads((DATA / "injury-scale.json").read_text())
madden = json.loads((DATA / "madden-2026.json").read_text())
pff = json.loads((DATA / "pff-2026.json").read_text())
allpro = json.loads((DATA / "allpro-last3.json").read_text())

# Fixed NFL displayName → abbr (fallback when athlete.team.abbreviation missing)
TEAM_NAME_TO_ABBR = {
  "Arizona Cardinals": "ARI", "Atlanta Falcons": "ATL", "Baltimore Ravens": "BAL",
  "Buffalo Bills": "BUF", "Carolina Panthers": "CAR", "Chicago Bears": "CHI",
  "Cincinnati Bengals": "CIN", "Cleveland Browns": "CLE", "Dallas Cowboys": "DAL",
  "Denver Broncos": "DEN", "Detroit Lions": "DET", "Green Bay Packers": "GB",
  "Houston Texans": "HOU", "Indianapolis Colts": "IND", "Jacksonville Jaguars": "JAX",
  "Kansas City Chiefs": "KC", "Las Vegas Raiders": "LV", "Los Angeles Chargers": "LAC",
  "Los Angeles Rams": "LAR", "Miami Dolphins": "MIA", "Minnesota Vikings": "MIN",
  "New England Patriots": "NE", "New Orleans Saints": "NO", "New York Giants": "NYG",
  "New York Jets": "NYJ", "Philadelphia Eagles": "PHI", "Pittsburgh Steelers": "PIT",
  "San Francisco 49ers": "SF", "Seattle Seahawks": "SEA", "Tampa Bay Buccaneers": "TB",
  "Tennessee Titans": "TEN", "Washington Commanders": "WSH",
}
# ESPN sometimes uses WSH vs WAS
ABBR_NORMALIZE = {"WAS": "WSH", "WFT": "WSH", "LA": "LAR"}

def _norm_ap(n):
  s = re.sub(r"[^a-z0-9\s]", " ", (n or "").lower())
  parts = [w for w in s.split() if w]
  while parts and parts[-1] in ("jr", "sr", "ii", "iii", "iv"):
    parts.pop()
  return "".join(parts)

ALLPRO = set()
for entry in (allpro.get("players") or allpro.get("names") or []):
  if isinstance(entry, str):
    ALLPRO.add(_norm_ap(entry))
  elif isinstance(entry, dict):
    for k in ("name", "player"):
      if entry.get(k):
        ALLPRO.add(_norm_ap(entry[k]))
    for n in entry.get("names") or []:
      ALLPRO.add(_norm_ap(n))
for k in ("name_keys", "keys"):
  for n in allpro.get(k) or []:
    ALLPRO.add(_norm_ap(n) if isinstance(n, str) else _norm_ap(str(n)))

STATUS_MAP = {
  "Out": "OUT", "Doubtful": "DOUBTFUL", "Questionable": "QUESTIONABLE", "Probable": "PROBABLE",
  "Injured Reserve": "IR", "Physically Unable to Perform": "PUP", "Non Football Injury": "NFI",
  "Suspension": "OUT",
}
POS_MAP = {
  "QB": "QB1", "WR": "WR2", "RB": "RB1", "TE": "TE1", "OT": "RT", "T": "RT", "G": "OG", "C": "C",
  "DE": "EDGE1", "DT": "IDL", "NT": "IDL", "LB": "LB", "ILB": "LB", "OLB": "EDGE1",
  "CB": "CB1", "S": "S", "FS": "S", "SS": "S", "K": "K", "PK": "K", "P": "DEPTH", "LS": "DEPTH",
  "FB": "DEPTH", "DB": "CB1",
}
ROLE = {
  ("SEA", "Sam Darnold"): "QB1", ("ATL", "Tua Tagovailoa"): "QB1", ("ATL", "Michael Penix Jr."): "QB1",
  ("MIN", "Kyler Murray"): "QB1", ("CIN", "Joe Burrow"): "QB1", ("HOU", "Nico Collins"): "WR1",
  ("BAL", "Zay Flowers"): "WR1", ("PIT", "Joey Porter Jr."): "CB1", ("NYJ", "Minkah Fitzpatrick"): "S",
  ("WSH", "Frankie Luvu"): "LB", ("WSH", "Chig Okonkwo"): "TE1", ("LV", "Brock Bowers"): "TE1",
  ("GB", "Javon Hargrave"): "IDL", ("HOU", "Jadeveon Clowney"): "EDGE1", ("LAR", "Myles Garrett"): "EDGE1",
  ("PHI", "Jonathan Greenard"): "EDGE1", ("SEA", "Zach Charbonnet"): "RB1",
  ("NE", "A.J. Brown"): "WR1", ("BAL", "Nnamdi Madubuike"): "IDL", ("BAL", "Ronnie Stanley"): "LT",
  ("CLE", "Jeremiah Owusu-Koramoah"): "LB", ("DET", "Blake Miller"): "RT",
  ("DET", "Brian Branch"): "S", ("DET", "Kerby Joseph"): "S",
  ("CHI", "Caleb Williams"): "QB1", ("GB", "Jayden Reed"): "WR1", ("DEN", "J.K. Dobbins"): "RB1",
  ("IND", "Alec Pierce"): "WR1", ("NE", "Mike Onwenu"): "RT", ("BUF", "Ed Oliver"): "IDL",
  ("BUF", "DJ Moore"): "WR1", ("LAR", "Puka Nacua"): "WR1", ("WSH", "Jayden Daniels"): "QB1",
  ("PHI", "Dallas Goedert"): "TE1", ("SF", "Mike Evans"): "WR1",
  ("GB", "Aaron Banks"): "OG", ("GB", "Zach Bako-Bewele"): "RT", ("GB", "Warren Brinson"): "IDL",
  ("ATL", "Samson Ebukam"): "EDGE1", ("ATL", "Billy Bowman Jr."): "CB1",
  ("SF", "Nick Bosa"): "EDGE1", ("SF", "Trent Williams"): "LT",
  ("NYJ", "Breece Hall"): "RB1", ("PHI", "Hollywood Brown"): "WR2",
  ("CLE", "Tyson Campbell"): "CB1", ("PIT", "Joey Porter Jr."): "CB1",
}

RESERVE = {"IR", "PUP", "NFI"}
WEEKLY = {"OUT", "DOUBTFUL", "QUESTIONABLE", "PROBABLE"}
TNF_PROTECT = set()  # Wednesday AM: official Week 5 sheet not out yet
VERBATIM_PROTECT = set()  # TNF TB@DAL FINAL Thu night — no protect; ESPN rules TB/DAL going forward
MNF_CLUBS = set()  # Week 4 MNF FINAL
INJURY_WORDS = [
  "knee","ankle","hamstring","hip","foot","back","shoulder","concussion","glute",
  "pectoral","achilles","groin","calf","oblique","wrist","quad","neck","ribs","illness",
  "finger","toe","elbow","thigh","abdomen","heel","ac joint","personal",
]
STARTERISH = {"QB1","WR1","RB1","TE1","LT","RT","OG","C","EDGE1","IDL","CB1","S","LB","WR2"}

def norm(n):
  return re.sub(r"[^a-z0-9]", "", (n or "").lower())

# Prior-seed name keys for carry decisions
prior_weekly = {}
for abbr, rows in (seed.get("teams") or {}).items():
  for r in rows:
    if r.get("status") in WEEKLY:
      prior_weekly[(abbr, norm(r["name"]))] = r

def noise(note, status, abbr=None, name=None, pos=None):
  """Drop coach's-decision / mid-game leftovers / finished TNF inactive depth noise.
  Week 4 Sunday FINAL; only ATL@NO MNF remains. Keep multi-week IR/PUP/NFI and MNF sheet."""
  n = (note or "").lower().strip()
  # Finished TNF clubs (TB/DAL): one-game "ruled out for Thursday's game" leftovers are not next-week injuries
  if abbr in ("TB", "DAL") and re.search(r"ruled out for thursday'?s game|out for thursday'?s game", n):
    if not re.search(r"week 6|week 7|next week|expected to miss|may miss|surgery|fracture|sprain|grade \d|multi-week|miss \d", n):
      return True
  if "coach's decision" in n or "coaches decision" in n:
    return True
  if re.search(r"questionable to return|doubtful to return|ruled out for the remainder|ruled out for remainder|ruled out for the rest|will not return|won't return|has been ruled out for the rest|exited (monday|sunday|thursday).{0,20}game|exited early", n):
    if not re.search(r"week 5|week 6|week 4|week 3|next week|day-to-day|expected to miss|may miss|imaging|undergo|ahead of schedule|fracture|sprain|surgery|grade \d|broken|dislocated|mri|optimistic|additional testing|miss \d|multi-week", n):
      return True
  # Prior-week / finished-MNF "inactive Monday" noise (Week 3 MNF FINAL)
  if abbr not in MNF_CLUBS and re.search(r"inactive monday|listed as inactive monday|monday against the giants", n):
    if not re.search(r"week 5|week 6|week 4|week 3|next week|day-to-day|expected to miss|may miss|surgery|fracture", n):
      return True
  # Post-MNF: drop Monday-only inactive when no injury word and not prior/ROLE
  if abbr not in MNF_CLUBS and status == "OUT" and re.search(r"monday'?s game|monday night|inactive for monday|inactive monday|mnf", n):
    if not any(w in n for w in INJURY_WORDS) and not re.search(r"week 5|week 6|week 4|next week|day-to-day|expected to miss|may miss|surgery|fracture|sprain|grade \d|hamstring", n):
      key = (abbr, norm(name)) if abbr and name else None
      if key and key in prior_weekly:
        return False
      if (abbr, name) in ROLE:
        return False
      return True
  if "is active for" in n and status in WEEKLY:
    return True
  # Finished Week-4 clubs: emergency-third-QB gameday inactives are roster noise (not injuries)
  if abbr not in MNF_CLUBS and status == "OUT" and re.search(r"emergency (third |no\. ?3 |3rd )?(quarterback|qb)", n):
    n_noqb = n.replace("quarterback", "")  # "back" substring quirk
    if not any(w in n_noqb for w in INJURY_WORDS):
      return True
  # Finished Week-4 clubs (everyone except MNF ATL/NO): bare inactive depth is gameday leftover noise
  FINISHED_TNF = set(TEAM_NAME_TO_ABBR.values()) - MNF_CLUBS
  if status == "OUT" and n in ("inactive", "out", ""):
    if abbr in FINISHED_TNF:
      key = (abbr, norm(name)) if abbr and name else None
      # Keep prior weekly / ROLE starters (multi-week carries still applying)
      if key and key in prior_weekly:
        return False
      if (abbr, name) in ROLE:
        return False
      return True
    key = (abbr, norm(name)) if abbr and name else None
    if key and key in prior_weekly:
      return False
    if (abbr, name) in ROLE:
      return False
    # Non-TNF clubs: bare inactive without injury context is still often noise mid-weekend
    return True
  if status == "OUT" and re.search(r"inactive (for|thursday|versus|vs|sunday|monday)", n):
    if not any(w in n for w in INJURY_WORDS):
      key = (abbr, norm(name)) if abbr and name else None
      if key and key in prior_weekly:
        return False
      if (abbr, name) in ROLE:
        return False
      return True
  # Post-TNF: drop bare Thursday/TNF gameday inactive leftovers
  if status == "OUT" and re.search(r"thursday night|thursday'?s game|tnf|inactive thursday|did not play thursday|inactive for thursday", n):
    if not any(w in n for w in INJURY_WORDS) and not re.search(r"week 5|week 6|week 4|week 3|next week|day-to-day|expected to miss|may miss|surgery|fracture|sprain", n):
      return True
  # Post-Sunday: drop Sunday-only inactive when no injury word and not prior/ROLE
  if status == "OUT" and re.search(r"sunday'?s game|sunday night|inactive for sunday|inactive sunday", n):
    if not any(w in n for w in INJURY_WORDS) and not re.search(r"week 5|week 6|week 4|next week|day-to-day|expected to miss|may miss|surgery|fracture|sprain|grade \d", n):
      key = (abbr, norm(name)) if abbr and name else None
      if key and key in prior_weekly:
        return False
      if (abbr, name) in ROLE:
        return False
      return True
  # Bare "questionable" placeholder with no injury word (often mid-game stub) — drop unless prior weekly / ROLE
  if status == "QUESTIONABLE" and n in ("questionable", "q", ""):
    key = (abbr, norm(name)) if abbr and name else None
    if key and key in prior_weekly:
      return False
    if (abbr, name) in ROLE:
      return False
    return True
  return False

def promote_reserve(status, note):
  n = (note or "").lower()
  if "reserve/pup" in n or "reserve / pup" in n or "to the reserve/pup" in n:
    return "PUP"
  # Avoid false IR on "won't be placed on injured reserve" / "not placed on IR"
  if re.search(r"\b(won'?t|will not|not)\b.{0,40}\b(injured reserve|\bir\b)", n):
    return status
  if re.search(r"placed on injured reserve|placed .{0,40} on injured reserve|to the injured reserve|to injured reserve|placed on ir\b| to the ir\b|to ir\b", n):
    return "IR"
  if "non-football injury" in n or "reserve/nfi" in n:
    return "NFI"
  return status

def resolve_abbr(ath, team_block):
  abbr = (ath.get("team") or {}).get("abbreviation")
  if not abbr:
    # try team block displayName
    dn = team_block.get("displayName") or ""
    abbr = TEAM_NAME_TO_ABBR.get(dn)
  if not abbr:
    # try athlete team displayName
    dn = (ath.get("team") or {}).get("displayName") or ""
    abbr = TEAM_NAME_TO_ABBR.get(dn)
  if abbr:
    abbr = ABBR_NORMALIZE.get(abbr, abbr)
  return abbr

espn_by = {}
abbr_missing = 0
for team in espn["injuries"]:
  for inj in team.get("injuries", []):
    ath = inj.get("athlete", {})
    abbr = resolve_abbr(ath, team)
    if not abbr:
      abbr_missing += 1
      continue
    raw_status = inj.get("status")
    if raw_status == "Active":
      continue
    st = STATUS_MAP.get(raw_status)
    if not st:
      continue
    note = inj.get("shortComment") or inj.get("longComment") or ""
    st = promote_reserve(st, note)
    pos_raw = ath.get("position", {})
    pos_abbr = pos_raw.get("abbreviation") if isinstance(pos_raw, dict) else None
    pos = POS_MAP.get(pos_abbr, "DEPTH")
    name = ath.get("displayName")
    # Retired quirk: ESPN still lists Aaron Donald — never price him
    if name and "aaron donald" in name.lower():
      continue
    if (abbr, name) in ROLE:
      pos = ROLE[(abbr, name)]
    if noise(note, st, abbr=abbr, name=name, pos=pos):
      continue
    espn_by.setdefault(abbr, []).append({
      "name": name,
      "pos": pos,
      "status": st,
      "note": (note[:280] if note else f"{name} — ESPN WORKING-FRI status {st} (Week 5 board)."),
      "source": "https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries",
      "on": True,
    })

def ingest(data, field):
  by_team, glob = {}, {}
  for abbr, t in (data.get("teams") or {}).items():
    if not isinstance(t, dict):
      continue
    for bucket in ("off", "def", "offense", "defense", "players"):
      for p in t.get(bucket) or []:
        if not isinstance(p, dict):
          continue
        name = p.get("name") or p.get("player")
        val = p.get(field) or p.get("ovr") or p.get("grade")
        if name is None or val is None:
          continue
        by_team.setdefault(abbr, {})[norm(name)] = float(val)
        glob[norm(name)] = float(val)
  return by_team, glob

mad_team, mad_glob = ingest(madden, "ovr")
pff_team, pff_glob = ingest(pff, "grade")
league_ovr = float((madden.get("scoring") or {}).get("league_ovr") or 81.53)
ovr_per = float((madden.get("scoring") or {}).get("ovr_per_point") or 4)
league_grade = float((pff.get("scoring") or {}).get("league_grade") or 71.47)
grade_per = float((pff.get("scoring") or {}).get("grade_per_point") or 5)
cap_player = float(scale.get("cap_player") or 4.5)
pos_base = scale.get("positions") or {}
status_mult = scale.get("status") or {}

def tier_cap(name, pos):
  p = (pos or "").upper()
  if p in ("QB1", "QB"):
    return float(scale.get("cap_player_qb") or 1.5)
  if _norm_ap(name) in ALLPRO or norm(name) in ALLPRO:
    return float(scale.get("cap_player_allpro") or 0.5)
  return float(scale.get("cap_player_other") or 0.25)

def auto_impact(abbr, name, pos):
  key = norm(name)
  ovr = (mad_team.get(abbr) or {}).get(key)
  if ovr is None:
    ovr = mad_glob.get(key)
  grade = (pff_team.get(abbr) or {}).get(key)
  if grade is None:
    grade = pff_glob.get(key)
  base = float(pos_base.get(pos) or 0.2)
  if ovr is not None:
    raw = base + (ovr - league_ovr) / ovr_per
    src = "madden"
  elif grade is not None:
    raw = base + (grade - league_grade) / grade_per
    src = "pff"
  else:
    return None, None
  cap = tier_cap(name, pos)
  floor = min(0.2, cap)
  impact = max(floor, min(cap, max(floor, raw)))
  if scale.get("cap_player") is not None:
    impact = min(impact, float(scale["cap_player"]))
  return round(impact, 2), src

def row_pts(pos, status, impact):
  mult = float(status_mult.get(status) or 0)
  base = impact if impact is not None else float(pos_base.get(pos) or 0.2)
  pts = -round(base * mult, 2)
  return max(-cap_player, min(0.0, pts))

SEVERITY = {"OUT": 3, "DOUBTFUL": 2, "QUESTIONABLE": 1, "PROBABLE": 0}

new_teams = {}
all_abbrs = sorted(set(list(seed.get("teams", {}).keys()) + list(espn_by.keys())))
manual_preserved = []
flips = []
cleared = []
added = []
tnf_restored = []

for abbr in all_abbrs:
  old_rows = seed.get("teams", {}).get(abbr, [])
  old_by = {norm(r["name"]): r for r in old_rows}
  espn_rows = espn_by.get(abbr, [])

  out = []
  seen = set()

  # Verbatim protect (unused this run; MNF ATL/NO use soft protect below)
  if abbr in VERBATIM_PROTECT:
    for old in old_rows:
      row = copy.deepcopy(old)
      if row.get("impact_source") == "manual":
        manual_preserved.append(f"{abbr} {row['name']} {row.get('impact')} (tnf-protect)")
      tnf_restored.append((abbr, old["name"], "TNFFINAL", "kept "+str(old.get("status"))))
      out.append(row)
      seen.add(norm(old["name"]))
    new_teams[abbr] = out
    continue

  for r in espn_rows:
    key = norm(r["name"])
    old = old_by.get(key)
    pos = r["pos"]
    if old and old.get("pos") and (old["pos"] in pos_base) and (
      r["pos"] == "DEPTH" or old["pos"].endswith("1") or old["pos"] in ("LT","RT","OG","C","IDL","EDGE1","CB1","WR1","QB1","RB1","TE1","S","LB","WR2")
    ):
      if old["pos"] != "DEPTH":
        pos = old["pos"]
    if (abbr, r["name"]) in ROLE:
      pos = ROLE[(abbr, r["name"])]

    status = r["status"]
    note = r["note"]
    source = r["source"]

    # ATL/GB: do not soften official Wed designations based on ESPN
    if abbr in TNF_PROTECT and old and old.get("status") in ("OUT", "DOUBTFUL", "QUESTIONABLE"):
      old_sev = SEVERITY.get(old["status"], 0)
      new_sev = SEVERITY.get(status, 0)
      if new_sev < old_sev or (status != old["status"] and new_sev <= old_sev):
        # keep prior official status (and impact/manual) unless ESPN is stricter
        if new_sev < old_sev:
          status = old["status"]
          note = old.get("note") or note
          source = old.get("source") or source
          tnf_restored.append((abbr, r["name"], r["status"], "kept "+status))

    # Keep prior context note when ESPN only has a bare gameday stub ("inactive"/"out")
    if old and old.get("note") and (note or "").strip().lower() in ("inactive", "out", "questionable", ""):
      note = old.get("note")
    row = {
      "name": r["name"],
      "pos": pos,
      "status": status,
      "note": note,
      "source": source,
      "on": True,
    }
    if old and old.get("injury"):
      row["injury"] = old.get("injury")
    if old and "on" in old and old.get("status") == status:
      row["on"] = old.get("on")
    if old and old.get("impact_source") == "manual":
      row["impact"] = old.get("impact")
      row["impact_source"] = "manual"
      # keep prior on flag for manuals (e.g. Echols off-number) when status unchanged
      if "on" in old and old.get("status") == status:
        row["on"] = old.get("on")
      manual_preserved.append(f"{abbr} {row['name']} {row['impact']}")
    else:
      # If we restored TNF official row and old had impact, keep old impact when auto would wipe
      if abbr in TNF_PROTECT and old and status == old.get("status") and old.get("impact") is not None and old.get("impact_source") == "manual":
        row["impact"] = old.get("impact")
        row["impact_source"] = "manual"
        manual_preserved.append(f"{abbr} {row['name']} {row['impact']}")
      else:
        imp, src = auto_impact(abbr, row["name"], pos)
        if imp is not None:
          row["impact"] = imp
          row["impact_source"] = src

    if old and old.get("status") != row["status"]:
      flips.append((abbr, row["name"], row.get("pos"), old.get("status"), row["status"], row.get("impact")))
    elif not old:
      added.append((abbr, row["name"], row.get("pos"), row["status"], row.get("impact")))

    out.append(row)
    seen.add(key)

  for old in old_rows:
    key = norm(old["name"])
    if key in seen:
      continue
    if old.get("status") in RESERVE:
      row = copy.deepcopy(old)
      row["on"] = True
      if row.get("impact_source") == "manual":
        manual_preserved.append(f"{abbr} {row['name']} {row.get('impact')} (reserve)")
      else:
        imp, src = auto_impact(abbr, row["name"], row.get("pos") or "DEPTH")
        if imp is not None:
          row["impact"] = imp
          row["impact_source"] = src
        else:
          row.pop("impact", None)
          row.pop("impact_source", None)
      out.append(row)
      seen.add(key)
    elif old.get("status") in WEEKLY:
      # ATL/GB protection: force-merge official OUT/D/Q ESPN dropped
      if abbr in TNF_PROTECT and old.get("status") in ("OUT", "DOUBTFUL", "QUESTIONABLE"):
        row = copy.deepcopy(old)
        row["on"] = True
        if row.get("impact_source") == "manual":
          manual_preserved.append(f"{abbr} {row['name']} {row.get('impact')} (tnf-protect)")
        tnf_restored.append((abbr, old["name"], "MISSING_ESPN", "restored "+old["status"]))
        out.append(row)
        seen.add(key)
      else:
        cleared.append((abbr, old["name"], old.get("pos"), old.get("status"), old.get("impact")))

  new_teams[abbr] = out

# --- QB1 depth rule (data/qb-depth-2026.json): ESPN tags every QB "QB"; only the acting starter
# (first QB on ESPN's depth chart not OUT/IR/PUP/NFI/DOUBTFUL), any injured QB above him, and a pinned
# injured_starter are QB1. Every other QB is DEPTH. Overrides ROLE. Keep this block in every reseed copy.
# W4 miss it fixes: LAC Trey Lance / LV Aidan O'Connell (backups) were priced as QB1.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from injury_qb_depth import apply_qb_depth
qb_depth_changes = apply_qb_depth(new_teams, auto_impact)
print("QB depth retags:", "; ".join(qb_depth_changes) if qb_depth_changes else "none")

def team_term(rows):
  s = 0.0
  for r in rows:
    if not r.get("on", True):
      continue
    s += row_pts(r.get("pos") or "DEPTH", r.get("status") or "QUESTIONABLE", r.get("impact"))
  cap = float(scale.get("cap_team") or 6)
  return max(-cap, min(0.0, s)), s

terms = {a: team_term(new_teams[a]) for a in new_teams}

now = datetime.now(ZoneInfo("America/New_York"))
stamp = "2026-10-09a"
out_obj = {
  "pulled": stamp,
  "pulled_et": now.strftime("%Y-%m-%d %-I:%M %p ET") + " (America/New_York)",
  "phase": "WORKING-FRI",
  "sources": [
    "https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries",
    "https://www.nfl.com/injuries/",
        "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=5&year=2026",
  ],
  "note": "WORKING-FRI Friday AM ESPN working refresh (prior seed 2026-10-08a WORKING-THU) for Week 5 Sunday/MNF clubs. TNF TB@DAL FINAL Thu night — no protect; TB/DAL Thursday gameday leftovers dropped, multi-week OUT + IR/PUP/NFI kept. Official Friday Game Status for the Sunday card ~4:00 PM ET (this AM run is WORKING, not FINAL). No rumor moves. Doubtful = 1.0 out. Preserve manuals. Tier caps QB<=1.5 / All-Pro<=0.5 / other<=0.25 on auto; Madden-first else PFF; floor 0.2x status; Cap team 6.0.",
  "espn_timestamp": espn.get("timestamp"),
  "teams": new_teams,
  "stamp": stamp,
}

path = DATA / "injury-2026.json"
path.write_text(json.dumps(out_obj, indent=2) + "\n")

def is_material(pos, st, impact):
  if st not in ("OUT", "DOUBTFUL", "QUESTIONABLE"):
    return False
  if pos in STARTERISH:
    return True
  if impact is not None and float(impact) >= 0.25:
    return True
  return False

mat_flips = [f for f in flips if is_material(f[2], f[4], f[5]) or is_material(f[2], f[3], f[5])]
mat_added = [a for a in added if is_material(a[2], a[3], a[4])]
mat_cleared = [c for c in cleared if is_material(c[2], c[3], c[4])]

# Impact swings >= 0.25 on starterish still-listed players (same status)
impact_swings = []
for abbr, rows in new_teams.items():
  old_by = {norm(r["name"]): r for r in seed.get("teams", {}).get(abbr, [])}
  for r in rows:
    old = old_by.get(norm(r["name"]))
    if not old:
      continue
    if old.get("status") != r.get("status"):
      continue
    oi, ni = old.get("impact"), r.get("impact")
    if oi is None or ni is None:
      continue
    if abs(float(ni) - float(oi)) >= 0.25 and (r.get("pos") in STARTERISH or max(float(oi), float(ni)) >= 0.5):
      impact_swings.append((abbr, r["name"], r.get("pos"), old.get("status"), float(oi), float(ni)))


md = []
md.append("# 2026 NFL injuries — Scout desk Week 5 WORKING-FRI")
md.append("")
md.append(f"Pulled {out_obj['pulled_et']}. Stamp `injury_pulled={stamp}` **WORKING-FRI** Friday AM ESPN refresh (prior seed 2026-10-08a WORKING-THU). TNF TB@DAL FINAL. Sunday-card official Game Status Friday.")
md.append("")
md.append("## Material designation flips vs 2026-10-08a WORKING-THU")
md.append("")
if not mat_flips and not mat_added and not mat_cleared:
  md.append("- None flagged as starter/impact≥0.5.")
else:
  for abbr, name, pos, old_st, new_st, impact in mat_flips:
    imp_s = f" impact={impact}" if impact is not None else ""
    md.append(f"- **{abbr} {name}** ({pos}): {old_st} → {new_st}{imp_s}")
  for abbr, name, pos, st, impact in mat_added:
    imp_s = f" impact={impact}" if impact is not None else ""
    md.append(f"- **{abbr} {name}** ({pos}): NEW {st}{imp_s}")
  for abbr, name, pos, st, impact in mat_cleared:
    imp_s = f" was impact={impact}" if impact is not None else ""
    md.append(f"- **{abbr} {name}** ({pos}): CLEARED off sheet (was {st}){imp_s}")
md.append("")
md.append("## Team injury terms (auto Madden-first, capped −6)")
md.append("")
md.append("| Team | Term | Raw | Headliners |")
md.append("|------|-----:|----:|------------|")
mat_teams = []
for a in sorted(new_teams):
  term, raw = terms[a]
  outs = [r for r in new_teams[a] if r["status"] in ("OUT", "DOUBTFUL") or (r["status"] == "QUESTIONABLE" and r.get("pos") in ("QB1", "WR1", "RB1"))]
  if abs(term) >= 0.75 or any(r.get("pos") == "QB1" and r["status"] in WEEKLY for r in new_teams[a]):
    mat_teams.append((a, term, raw, outs))
for a, term, raw, outs in sorted(mat_teams, key=lambda x: x[1]):
  heads = ", ".join(f"{r['name']} {r['status']}" for r in outs[:6])
  md.append(f"| {a} | {term:.2f} | {raw:.2f} | {heads} |")
md.append("")
md.append("## Notes")
md.append("")
md.append("- WORKING-FRI Friday AM ESPN refresh after 2026-10-08a. TNF TB@DAL FINAL (no protect). Official NFL.com Wed practice participation cross-checked (no Sunday game status until Friday). No invented rumor designations.")
md.append("- All Week 4 clubs finished: drop gameday inactive / ruled-out-for-remainder / coach's-decision noise; keep multi-week OUT + IR/PUP/NFI; one-game Q/D leftovers cleared when ESPN dropped them. Aaron Donald dropped (retired).")
md.append("- Manuals preserved when still listed: " + (", ".join(dict.fromkeys(manual_preserved)) if manual_preserved else "none") + ".")
if tnf_restored:
  md.append("- Protects applied: " + "; ".join(f"{a} {n} ({detail})" for a,n,_,detail in tnf_restored) + ".")
md.append("- ESPN API timestamp " + str(espn.get("timestamp")) + ".")
md.append("")
md.append("Sources: ESPN injuries API; nfl.com/injuries; Week 5 scoreboard.")
(DATA / "injury-2026-summary.md").write_text("\n".join(md) + "\n")

weekly_odq = 0
teams_with_weekly = 0
for a, rows in new_teams.items():
  n = sum(1 for r in rows if r["status"] in ("OUT", "DOUBTFUL", "QUESTIONABLE"))
  weekly_odq += n
  if n:
    teams_with_weekly += 1

print("Wrote", path)
print("stamp", stamp, "phase", out_obj["phase"], "pulled_et", out_obj["pulled_et"])
print("abbr_missing", abbr_missing)
print("manual", list(dict.fromkeys(manual_preserved)))
print("flips", len(flips), "material_flips", len(mat_flips))
print("added", len(added), "material_added", len(mat_added))
print("cleared", len(cleared), "material_cleared", len(mat_cleared))
print("tnf_restored", tnf_restored)
print("teams_with_weekly", teams_with_weekly, "weekly_OUT+D+Q", weekly_odq)
print("total_rows", sum(len(v) for v in new_teams.values()))
print("--- ALL FLIPS ---")
for x in flips: print(x)
print("--- MATERIAL FLIPS ---")
for x in mat_flips: print(x)
print("--- MATERIAL ADDED ---")
for x in mat_added: print(x)
print("--- MATERIAL CLEARED ---")
for x in mat_cleared: print(x)
print("--- IMPACT SWINGS >=0.25 starterish ---")
for x in impact_swings: print(x)
print("--- ALL ADDED ---")
for x in added: print(x)
print("--- ALL CLEARED ---")
for x in cleared: print(x)
print("--- ATL ---")
for r in new_teams.get("ATL", []):
  if r["status"] in WEEKLY|RESERVE:
    print(r["name"], r["status"], r.get("pos"), r.get("impact"), r.get("impact_source"), "on="+str(r.get("on")))
print("--- NO ---")
for r in new_teams.get("NO", []):
  if r["status"] in WEEKLY|RESERVE:
    print(r["name"], r["status"], r.get("pos"), r.get("impact"), r.get("impact_source"), "on="+str(r.get("on")))
for want in [("SEA","Sam Darnold"),("MIN","Kyler Murray"),("CIN","Joe Burrow"),("BAL","Zay Flowers"),("BAL","Nnamdi Madubuike"),("CHI","Caleb Williams"),("WSH","Jayden Daniels"),("LV","Brock Bowers"),("NYJ","Minkah Fitzpatrick"),("ATL","Tua Tagovailoa"),("ATL","Michael Penix Jr."),("GB","Jayden Reed"),("GB","Javon Hargrave"),("GB","Aaron Banks"),("GB","Zach Bako-Bewele"),("LAR","Puka Nacua"),("PHI","Dallas Goedert"),("IND","Alec Pierce"),("BUF","Ed Oliver"),("NE","Mike Onwenu"),("NYJ","Breece Hall"),("SF","Mike Evans"),("SF","Nick Bosa"),("SF","Trent Williams"),("PHI","Hollywood Brown"),("PHI","Jonathan Greenard")]:
  rows = new_teams.get(want[0], [])
  hit = next((r for r in rows if r["name"]==want[1]), None)
  print("check", want, hit and (hit["status"], hit.get("impact"), hit.get("impact_source")) or "MISSING")

# --- Shadow trench health index (display only; never changes the B$ line, never fails this reseed) ---
try:
  import runpy as _runpy
  from pathlib import Path as _Path
  _hook = _Path(__file__).resolve().parent / "injury-trench" / "after_reseed.py"
  if _hook.exists():
    _runpy.run_path(str(_hook), run_name="__main__")
except SystemExit:
  pass
except Exception as _err:
  print("[injury-trench] hook skipped:", _err)

#!/usr/bin/env python3
"""Map every eligible 2025 PFF-grade player (data/pff-raw, >= MIN_SNAPS) to his CURRENT 2026 club.

Writes data/pff-roster-map-2026.json, which build_pff_layer.py requires for the PFF 22 (pff-2026.json).

Sources, in order:
  1. PFF 2026 roster, joined on PFF player_id (data/pff-players-2026.sqlite; refresh with
     build_pff_players_2026.py). Exact id join, no name matching.
  2. ESPN team rosters (live): name match, position side must agree (OFF/DEF), and ESPN's group tells
     active / IR / practice squad. Used to cross-check (1) and for players (1) lacks.
     ESPN nicknames (Hollywood Brown, Chig Okonkwo, Riq Woolen...) confirm by last name + side on the PFF club.
  3. ESPN injuries feed (live): name + side, for reserve players ESPN drops from team rosters.
  4. Desk injury sheet (data/injury-2026.json): last resort for season-ending IR players (Jalon Walker, ATL).
A PFF-id match that ESPN cannot see at all must be corroborated on the same club by the ESPN injuries
feed, the desk injury sheet or Madden (madden-27-players.json); otherwise PFF's roster is stale (e.g.
Clelin Ferrell, cut from MIA's practice squad Sep 28) and the player is treated as unrostered.
If (1) and (2) disagree, ESPN wins and the player is listed under "conflicts" for review.
No source -> unrostered (free agent / retired): team_2026 null, left out of the PFF 22.
Practice squad -> roster_status "practice_squad", left out of the PFF 22 (not on the 53).

Manual fixes: add {"<pff_id>": {"team_2026": "NE" or null, "roster_status": "...", "why": "..."}} under
"overrides"; rebuilds keep them.

  python3 data/build_pff_roster_map_2026.py            # live ESPN
  python3 data/build_pff_roster_map_2026.py --check    # rebuild in memory, print diff vs committed map, write nothing
"""
from __future__ import annotations

import argparse, json, re, sqlite3, subprocess, sys
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

DATA = Path(__file__).resolve().parent
sys.path.insert(0, str(DATA))
import build_pff_layer as bpl  # noqa: E402

OUT = DATA / "pff-roster-map-2026.json"
PFF_DB = DATA / "pff-players-2026.sqlite"
SHEET = DATA / "injury-2026.json"
MADDEN = DATA / "madden-27-players.json"
SITE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl"
NORMALIZE = {"WAS": "WSH", "LA": "LAR", "JAC": "JAX"}
OFF = {"QB", "RB", "HB", "FB", "WR", "TE", "OT", "OG", "C", "G", "T", "OL"}
DEF = {"DE", "DT", "NT", "LB", "OLB", "ILB", "MLB", "CB", "S", "FS", "SS", "DB", "EDGE", "DL", "DI", "ED"}


def get(url):
  r = subprocess.run(["curl", "-sfL", "--max-time", "30", url], capture_output=True, text=True)
  if r.returncode != 0:
    raise SystemExit(f"fetch failed: {url}")
  return json.loads(r.stdout)


def key(n):
  s = re.sub(r"[^a-z0-9 ]", "", (n or "").lower().replace(".", "").replace("'", ""))
  return "".join(w for w in s.split() if w not in ("jr", "sr", "ii", "iii", "iv", "v"))


def last(n):
  w = [x for x in re.sub(r"[^a-z ]", "", (n or "").lower()).split() if x not in ("jr", "sr", "ii", "iii", "iv", "v")]
  return w[-1] if w else ""


def side(pos):
  p = (pos or "").upper()
  return "OFF" if p in OFF else "DEF" if p in DEF else None


def espn_rosters():
  teams = get(f"{SITE}/teams")["sports"][0]["leagues"][0]["teams"]
  ids = {NORMALIZE.get(t["team"]["abbreviation"], t["team"]["abbreviation"]): t["team"]["id"] for t in teams}

  def one(ab):
    d = get(f"{SITE}/teams/{ids[ab]}/roster")
    rows = []
    for g in d.get("athletes", []):
      grp = g.get("position") or ""
      for a in g.get("items", []):
        st = "practice_squad" if grp == "practiceSquad" else "reserve" if grp == "injuredReserveOrOut" else "active"
        rows.append({"team": ab, "name": a.get("displayName"), "pos": (a.get("position") or {}).get("abbreviation"), "status": st})
    return rows

  with ThreadPoolExecutor(12) as ex:
    return [r for rows in ex.map(one, sorted(ids)) for r in rows]


def espn_injured():
  out = []
  for t in get(f"{SITE}/injuries").get("injuries", []):
    for i in t.get("injuries", []):
      a = i.get("athlete") or {}
      ab = (a.get("team") or {}).get("abbreviation")
      if ab:
        out.append({"team": NORMALIZE.get(ab, ab), "name": a.get("displayName"), "pos": (a.get("position") or {}).get("abbreviation"), "status": "reserve"})
  return out


def build(espn, injured):
  pool = {pid: p for pid, p in bpl.load_pool().items() if bpl.eligible(p)}
  db = sqlite3.connect(PFF_DB)
  pff = {str(pid): (team, name) for pid, team, name in db.execute("select player_id, team, name from players")}
  pff_meta = dict(db.execute("select key, value from meta").fetchall()) if db.execute("select 1 from sqlite_master where name='meta'").fetchone() else {}
  by_name, by_last = defaultdict(list), defaultdict(list)
  for r in espn:
    by_name[key(r["name"])].append(r)
    by_last[(r["team"], last(r["name"]))].append(r)
  inj_name = defaultdict(list)
  for r in injured:
    inj_name[key(r["name"])].append(r)
  mp = json.loads(MADDEN.read_text()) if MADDEN.exists() else []
  mp = mp["players"] if isinstance(mp, dict) and "players" in mp else mp
  madden_name = defaultdict(set)
  for r in mp:
    madden_name[key(r.get("name"))].add(r.get("team_abbr"))
  sheet = json.loads(SHEET.read_text())
  sheet_name = defaultdict(list)
  for ab, rows in sheet.get("teams", {}).items():
    for r in rows:
      sheet_name[key(r["name"])].append(ab)

  players, conflicts = {}, []
  for pid, p in sorted(pool.items(), key=lambda kv: kv[1]["name"]):
    sd = p["side"]
    e = [r for r in by_name.get(key(p["name"]), []) if side(r["pos"]) in (sd, None)]
    pf = pff.get(pid)
    entry = {"name": p["name"], "pos": p["pos"], "team_2025": p["team"], "team_2026": None,
             "roster_status": "unrostered", "source": None, "pff_team": pf[0] if pf else None,
             "espn_team": None}
    if pf and not e:  # nickname: same last name + side on the PFF club
      e = [r for r in by_last.get((pf[0], last(p["name"])), []) if side(r["pos"]) in (sd, None)]
      if len(e) > 1:
        e = []
    if len(e) > 1 and pf:
      e = [r for r in e if r["team"] == pf[0]] or e
    if len(e) == 1:
      entry["espn_team"] = e[0]["team"]
    if pf and len(e) == 1:
      entry.update(team_2026=e[0]["team"], roster_status=e[0]["status"],
                   source="pff_id+espn" if e[0]["team"] == pf[0] else "espn (pff disagrees)")
      if e[0]["team"] != pf[0]:
        conflicts.append({"pff_id": pid, "name": p["name"], "pff": pf[0], "espn": e[0]["team"]})
    elif pf:
      inj_t = {r["team"] for r in inj_name.get(key(p["name"]), [])}
      corr = [n for n, teams in (("espn_injuries", inj_t), ("desk injury sheet", set(sheet_name.get(key(p["name"]), []))),
                                 ("madden", madden_name.get(key(p["name"]), set()))) if pf[0] in teams]
      if corr:
        entry.update(team_2026=pf[0], roster_status="reserve" if "madden" not in corr else "active", source="pff_id+" + corr[0])
      else:
        entry.update(source=f"pff_id {pf[0]} only, not on ESPN roster/injuries/Madden: treated as released")
    elif len(e) == 1:
      entry.update(team_2026=e[0]["team"], roster_status=e[0]["status"], source="espn_roster")
    elif len(e) > 1:
      entry.update(source="ambiguous espn name: " + ",".join(sorted(r["team"] for r in e)))
    else:
      inj = [r for r in inj_name.get(key(p["name"]), []) if side(r["pos"]) in (sd, None)]
      sh = sorted(set(sheet_name.get(key(p["name"]), [])))
      if len(inj) == 1:
        entry.update(team_2026=inj[0]["team"], roster_status="reserve", source="espn_injuries")
      elif len(sh) == 1:
        entry.update(team_2026=sh[0], roster_status="reserve", source="desk injury sheet")
    players[pid] = entry
  return players, conflicts, pff_meta


def main():
  ap = argparse.ArgumentParser()
  ap.add_argument("--check", action="store_true")
  args = ap.parse_args()
  prior = json.loads(OUT.read_text()) if OUT.exists() else {}
  players, conflicts, pff_meta = build(espn_rosters(), espn_injured())
  overrides = prior.get("overrides") or {}
  now = datetime.now(ZoneInfo("America/New_York"))
  counts = defaultdict(int)
  for pid, e in players.items():
    eff = dict(e, **overrides.get(pid, {}))
    counts[eff["roster_status"]] += 1
    if eff["team_2026"] and eff["team_2026"] != e["team_2025"] and eff["roster_status"] != "practice_squad":
      counts["moved"] += 1
  payload = {
    "season": 2026,
    "built_at": now.isoformat(timespec="seconds"),
    "built_et": now.strftime("%Y-%m-%d %-I:%M %p ET"),
    "pool": "2025 PFF REG CSVs (data/pff-raw), players with a grade and >= %d snaps" % bpl.MIN_SNAPS,
    "sources": [
      f"PFF 2026 rosters by player_id: data/pff-players-2026.sqlite (pulled {pff_meta.get('pulled') or pff_meta.get('updated_at') or 'see README'})",
      f"{SITE}/teams/<id>/roster (live)",
      f"{SITE}/injuries (live)",
      "data/injury-2026.json (season-ending reserve players ESPN drops from rosters)",
    ],
    "counts": dict(sorted(counts.items())),
    "conflicts": conflicts,
    "overrides": overrides,
    "players": players,
  }
  if prior.get("players"):
    changed = [(e["name"], prior["players"].get(pid, {}).get("team_2026"), e["team_2026"]) for pid, e in players.items()
               if prior["players"].get(pid, {}).get("team_2026") != e["team_2026"]]
    print(f"vs committed map: {len(changed)} team changes", changed[:25])
  print("counts", payload["counts"], "conflicts", len(conflicts))
  for c in conflicts:
    print("  CONFLICT", c)
  if args.check:
    return
  OUT.write_text(json.dumps(payload, indent=1, ensure_ascii=False) + "\n")
  print("wrote", OUT.relative_to(DATA.parent))


if __name__ == "__main__":
  main()

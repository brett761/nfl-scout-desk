#!/usr/bin/env python3
"""Build data/qb-depth-2026.json: each club's QB depth order from ESPN, plus who started
the most recent final game (QB with the most pass attempts in the ESPN box score).

  python3 data/build_qb_depth_2026.py              # depth charts + latest finished week
  python3 data/build_qb_depth_2026.py --week 4     # box scores from a given week

The injury reseed reads this file (data/injury_qb_depth.py) to decide which injured QB is
priced as QB1. Run it on Tuesday after the depth charts settle, and again whenever a club
names a new starter. Writes only this file.
"""
import argparse, json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

DATA = Path(__file__).resolve().parent
OUT = DATA / "qb-depth-2026.json"
SITE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl"
CORE = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2026"
NORMALIZE = {"WAS": "WSH", "WFT": "WSH", "LA": "LAR"}


def get(url):
  out = subprocess.run(["curl", "-sfL", "--max-time", "30", url.replace("http://", "https://")], capture_output=True, text=True)
  if out.returncode != 0:
    raise RuntimeError(f"fetch failed: {url}")
  return json.loads(out.stdout)


def depth_for(team_id):
  data = get(f"{CORE}/teams/{team_id}/depthcharts")
  for item in data.get("items", []):
    qb = (item.get("positions") or {}).get("qb")
    if qb:
      refs = [a["athlete"]["$ref"] for a in sorted(qb["athletes"], key=lambda a: a["rank"])]
      return [get(r).get("displayName") for r in refs]
  return []


def latest_final_week():
  sb = get(f"{SITE}/scoreboard?seasontype=2")
  wk = int((sb.get("week") or {}).get("number") or 1)
  evs = sb.get("events") or []
  if evs and all(e["status"]["type"]["name"] == "STATUS_FINAL" for e in evs):
    return wk
  return wk - 1


def starters_for(week):
  sb = get(f"{SITE}/scoreboard?seasontype=2&week={week}&dates=2026")
  out = {}
  for e in sb.get("events") or []:
    if e["status"]["type"]["name"] != "STATUS_FINAL":
      continue
    s = get(f"{SITE}/summary?event={e['id']}")
    for t in (s.get("boxscore") or {}).get("players") or []:
      ab = NORMALIZE.get(t["team"]["abbreviation"], t["team"]["abbreviation"])
      for cat in t["statistics"]:
        if cat["name"] != "passing":
          continue
        rows = []
        for a in cat["athletes"]:
          st = dict(zip(cat["keys"], a["stats"]))
          ca = st.get("completions/passingAttempts", "0/0")
          att = int(ca.split("/")[1]) if "/" in ca else 0
          rows.append((att, a["athlete"]["displayName"]))
        rows.sort(reverse=True)
        if rows:
          out[ab] = {"name": rows[0][1], "event": e["id"], "game": e.get("shortName")}
  return out


def main():
  ap = argparse.ArgumentParser()
  ap.add_argument("--week", type=int)
  args = ap.parse_args()
  teams = get(f"{SITE}/teams")["sports"][0]["leagues"][0]["teams"]
  ids = {NORMALIZE.get(t["team"]["abbreviation"], t["team"]["abbreviation"]): t["team"]["id"] for t in teams}
  with ThreadPoolExecutor(12) as ex:
    depth = dict(zip(sorted(ids), ex.map(lambda ab: depth_for(ids[ab]), sorted(ids))))
  week = args.week or latest_final_week()
  by_week = {w: starters_for(w) for w in range(1, week + 1)}
  starters = by_week[week]
  season = {}
  for w, per in by_week.items():
    for ab, v in per.items():
      season.setdefault(ab, []).append({"week": w, "name": v["name"]})
  prior = json.loads(OUT.read_text()).get("teams", {}) if OUT.exists() else {}
  now = datetime.now(ZoneInfo("America/New_York"))
  payload = {
    "season": 2026,
    "built_at": now.isoformat(timespec="seconds"),
    "built_et": now.strftime("%Y-%m-%d %-I:%M %p ET"),
    "starter_week": week,
    "sources": [f"{CORE}/teams/<id>/depthcharts", f"{SITE}/summary?event=<id> (QB with most pass attempts)"],
    "note": "ESPN depth order, first listed = designated starter when healthy. last_game_passer = QB with the most pass attempts (an injured starter can show his backup, e.g. WSH W4 Mariota started, Kaliakmanis threw most) in that club's most recent final game. season_starts = that proxy for every 2026 week (info only). injured_starter = MANUAL desk pin {name, why, source} for a starter on OUT/IR whom ESPN moved down or off the depth chart; the builder keeps it across rebuilds; clear it (null) when he returns or loses the job. The injury reseed prices a QB as QB1 only if he is at or above the first healthy QB on the depth list, or he is the sidelined injured_starter; every other QB row is DEPTH.",
    "teams": {ab: {"depth": depth[ab], "last_game_passer": starters.get(ab), "season_starts": season.get(ab, []),
                "injured_starter": (prior.get(ab) or {}).get("injured_starter")} for ab in sorted(depth)},
  }
  missing = [ab for ab, v in payload["teams"].items() if not v["depth"]]
  if missing:
    print("no QB depth for", missing, file=sys.stderr)
    sys.exit(1)
  OUT.write_text(json.dumps(payload, indent=2) + "\n")
  for ab, v in payload["teams"].items():
    ls = (v["last_game_passer"] or {}).get("name")
    flag = "" if not ls or ls == v["depth"][0] else "   <- not depth QB1"
    pin = (v.get("injured_starter") or {}).get("name")
    print(f"{ab:4} {', '.join(v['depth'])} | W{week} top passer: {ls or 'bye'}{flag}" + (f" | injured_starter pin: {pin}" if pin else ""))
  print("wrote", OUT.relative_to(DATA.parent))


if __name__ == "__main__":
  main()

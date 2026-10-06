#!/usr/bin/env python3
"""Equal-22 PFF team aggregate from 2025 REG grade CSVs. Same player count per club.

The 2025 grades stay as graded; each player is counted for his CURRENT 2026 club, read from
data/pff-roster-map-2026.json (PFF id -> 2026 team; built by build_pff_roster_map_2026.py from the
PFF 2026 rosters, ESPN rosters, ESPN injuries and the desk injury sheet). Players with no 2026 club
(free agents, retired) or on a practice squad are left out. A pool player missing from the map is
an error, so a rebuild can never silently fall back to 2025 teams.

  python3 data/build_pff_roster_map_2026.py   # refresh rosters first
  python3 data/build_pff_layer.py             # then rebuild data/pff-2026.json
"""
from __future__ import annotations

import csv
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

DATA = Path(__file__).resolve().parent
RAW = DATA / "pff-raw"
OUT = DATA / "pff-2026.json"
ROSTER_MAP = DATA / "pff-roster-map-2026.json"

N_OFF = 11
N_DEF = 11
GRADE_PER_POINT = 5.0  # 5 PFF grade ≈ 1 desk point
CAP = 1.5
MIN_SNAPS = 200

PFF_TEAM = {
    "ARZ": "ARI", "ATL": "ATL", "BLT": "BAL", "BUF": "BUF", "CAR": "CAR",
    "CHI": "CHI", "CIN": "CIN", "CLV": "CLE", "DAL": "DAL", "DEN": "DEN",
    "DET": "DET", "GB": "GB", "HST": "HOU", "IND": "IND", "JAX": "JAX",
    "JAC": "JAX", "KC": "KC", "LA": "LAR", "LAR": "LAR", "LAC": "LAC",
    "LV": "LV", "MIA": "MIA", "MIN": "MIN", "NE": "NE", "NO": "NO",
    "NYG": "NYG", "NYJ": "NYJ", "PHI": "PHI", "PIT": "PIT", "SEA": "SEA",
    "SF": "SF", "TB": "TB", "TEN": "TEN", "WAS": "WSH", "WSH": "WSH",
}

OFF_POS = {"QB", "HB", "FB", "WR", "TE", "T", "G", "C", "OL"}
DEF_POS = {"DI", "ED", "LB", "CB", "S", "DT", "DE", "NT", "ILB", "OLB", "SS", "FS", "DB"}


def fnum(v):
    if v is None or v == "":
        return None
    try:
        return float(v)
    except ValueError:
        return None


def inum(v):
    n = fnum(v)
    return int(n) if n is not None else 0


def side_of(pos: str) -> str | None:
    p = (pos or "").upper().strip()
    if p in OFF_POS:
        return "OFF"
    if p in DEF_POS:
        return "DEF"
    return None


def read_csv(name: str) -> list[dict]:
    path = RAW / name
    with path.open(newline="") as f:
        return list(csv.DictReader(f))


def snaps_of(row: dict) -> int:
    for key in (
        "snap_counts_defense",
        "snap_counts_offense",
        "passing_snaps",
        "pass_plays",
        "run_plays",
        "routes",
        "snap_counts_block",
    ):
        n = inum(row.get(key))
        if n:
            return n
    return 0


def load_pool() -> dict[str, dict]:
    """2025 PFF player pool keyed by PFF player_id, with 2025 team, side, best grade, max snaps."""
    players: dict[str, dict] = {}

    def ingest(rows, grade_key, default_side=None):
        for r in rows:
            pid = str(r.get("player_id") or "").strip()
            if not pid:
                continue
            pos = (r.get("position") or "").strip()
            side = side_of(pos) or default_side
            if side is None:
                continue
            team = PFF_TEAM.get((r.get("team_name") or "").strip())
            if not team:
                continue
            grade = fnum(r.get(grade_key))
            snaps = snaps_of(r)
            cur = players.get(pid)
            if cur is None:
                players[pid] = {
                    "id": pid,
                    "name": r.get("player") or "",
                    "pos": pos,
                    "team": team,
                    "side": side,
                    "grade": grade,
                    "snaps": snaps,
                }
                continue
            if snaps > cur["snaps"]:
                cur["snaps"] = snaps
            if grade is not None and (cur["grade"] is None or grade > cur["grade"]):
                cur["grade"] = grade
            if pos and (not cur["pos"] or side == cur["side"]):
                cur["pos"] = pos
                cur["side"] = side
            cur["team"] = team

    ingest(read_csv("nfl_2025_REG_passing_summary.csv"), "grades_offense", "OFF")
    ingest(read_csv("nfl_2025_REG_rushing_summary.csv"), "grades_offense", "OFF")
    ingest(read_csv("nfl_2025_REG_receiving_summary.csv"), "grades_offense", "OFF")
    ingest(read_csv("nfl_2025_REG_offense_blocking.csv"), "grades_offense", "OFF")
    ingest(read_csv("nfl_2025_REG_defense_summary.csv"), "grades_defense", "DEF")
    return players


def eligible(p: dict) -> bool:
    return p["grade"] is not None and p["snaps"] >= MIN_SNAPS


def apply_roster_map(players: dict[str, dict], path: Path = ROSTER_MAP) -> dict:
    """Re-team the pool in place to 2026 clubs. Returns stats. Raises if the map misses a pool player."""
    rmap = json.loads(path.read_text())
    entries = rmap["players"]
    overrides = rmap.get("overrides") or {}
    missing = [p["name"] for pid, p in players.items() if eligible(p) and pid not in entries and pid not in overrides]
    if missing:
        raise SystemExit(f"{path.name} is missing {len(missing)} eligible players (e.g. {missing[:5]}); run build_pff_roster_map_2026.py")
    moved = dropped = 0
    for pid, p in players.items():
        if not eligible(p):
            continue
        e = dict(entries.get(pid) or {})
        if pid in overrides:
            e.update(overrides[pid])
        p["team_2025"] = p["team"]
        team = e.get("team_2026") if e.get("roster_status") != "practice_squad" else None
        if not team:
            p["team"] = None
            dropped += 1
            continue
        if team != p["team"]:
            moved += 1
        p["team"] = team
    return {"map": path.name, "map_built_at": rmap.get("built_at"), "moved": moved, "dropped": dropped}


def main() -> None:
    players = load_pool()
    roster = apply_roster_map(players)

    by_team = defaultdict(lambda: {"OFF": [], "DEF": []})
    skipped = 0
    for p in players.values():
        if not eligible(p):
            skipped += 1
            continue
        if not p["team"]:
            continue
        by_team[p["team"]][p["side"]].append(p)

    clubs = sorted(set(PFF_TEAM.values()))
    picked = {}
    for abbr in clubs:
        off = sorted(by_team[abbr]["OFF"], key=lambda x: (-x["grade"], -x["snaps"]))[:N_OFF]
        deff = sorted(by_team[abbr]["DEF"], key=lambda x: (-x["grade"], -x["snaps"]))[:N_DEF]
        picked[abbr] = {"OFF": off, "DEF": deff}

    all_grades = []
    for abbr in clubs:
        all_grades.extend(p["grade"] for p in picked[abbr]["OFF"])
        all_grades.extend(p["grade"] for p in picked[abbr]["DEF"])
    league = sum(all_grades) / len(all_grades) if all_grades else 0.0

    def pack(rows):
        out = []
        for p in rows:
            row = {"name": p["name"], "pos": p["pos"], "grade": round(p["grade"], 1), "snaps": p["snaps"]}
            if p.get("team_2025") and p["team_2025"] != p["team"]:
                row["team_2025"] = p["team_2025"]
            out.append(row)
        return out

    teams = {}
    short = []
    nets = []
    for abbr in clubs:
        off = picked[abbr]["OFF"]
        deff = picked[abbr]["DEF"]
        if len(off) < N_OFF or len(deff) < N_DEF:
            short.append((abbr, len(off), len(deff)))
        unit = off + deff
        ovr = sum(p["grade"] for p in unit) / len(unit) if unit else league
        raw = (ovr - league) / GRADE_PER_POINT
        net = max(-CAP, min(CAP, round(raw, 2)))
        nets.append((abbr, net, round(ovr, 2), len(off), len(deff)))
        teams[abbr] = {
            "n": len(unit),
            "n_off": len(off),
            "n_def": len(deff),
            "grade": round(ovr, 2),
            "off_grade": round(sum(p["grade"] for p in off) / len(off), 2) if off else None,
            "def_grade": round(sum(p["grade"] for p in deff) / len(deff), 2) if deff else None,
            "off": pack(off),
            "def": pack(deff),
            "net": net,
        }

    payload = {
        "season": 2026,
        "source_season": 2025,
        "pulled": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "source": "PFF+ Premium Stats CSV export (2025 REG), official download",
        "player_pool": len(players),
        "roster": {
            "teams_as_of": roster["map_built_at"],
            "map": "data/" + roster["map"],
            "moved": roster["moved"],
            "dropped_no_2026_club": roster["dropped"],
            "note": "2025 grades, counted for each player's current 2026 club (team_2025 shown on movers). Free agents, retired players and practice-squad players are left out; IR players stay in (debited through the injury sheet).",
        },
        "scoring": {
            "n_off": N_OFF,
            "n_def": N_DEF,
            "n": N_OFF + N_DEF,
            "min_snaps": MIN_SNAPS,
            "grade_per_point": GRADE_PER_POINT,
            "cap": CAP,
            "league_grade": round(league, 2),
            "note": "Same 22 per club (11 OFF + 11 DEF by 2025 PFF grade, min snaps, on the 2026 roster). Surplus vs league mean of those 22. 5 grade ≈ 1 point, cap ±1.5. Does not rewrite the 2025 prior. Raw CSVs stay off the public desk.",
        },
        "teams": teams,
        "missing": [a for a, o, d in short],
    }
    OUT.write_text(json.dumps(payload, indent=2) + "\n")
    nets_sorted = sorted(nets, key=lambda x: -x[1])
    print("roster", roster)
    print("league", round(league, 2), "n_grades", len(all_grades), "skipped_low", skipped)
    print("short", short)
    print("top", nets_sorted[:5])
    print("bot", nets_sorted[-5:])
    print("wrote", OUT, "clubs", len(teams))


if __name__ == "__main__":
    main()

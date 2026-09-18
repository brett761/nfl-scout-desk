#!/usr/bin/env python3
"""Equal-22 PFF team aggregate from 2025 REG grade CSVs. Same player count per club."""
from __future__ import annotations

import csv
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

RAW = Path("/workspace/nfl-scout/desk/data/pff-raw")
OUT = Path("/workspace/nfl-scout/desk/data/pff-2026.json")

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


def main() -> None:
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

    by_team = defaultdict(lambda: {"OFF": [], "DEF": []})
    skipped = 0
    for p in players.values():
        if p["grade"] is None or p["snaps"] < MIN_SNAPS:
            skipped += 1
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
        return [
            {
                "name": p["name"],
                "pos": p["pos"],
                "grade": round(p["grade"], 1),
                "snaps": p["snaps"],
            }
            for p in rows
        ]

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
        "scoring": {
            "n_off": N_OFF,
            "n_def": N_DEF,
            "n": N_OFF + N_DEF,
            "min_snaps": MIN_SNAPS,
            "grade_per_point": GRADE_PER_POINT,
            "cap": CAP,
            "league_grade": round(league, 2),
            "note": "Same 22 per club (11 OFF + 11 DEF by 2025 PFF grade, min snaps). Surplus vs league mean of those 22. 5 grade ≈ 1 point, cap ±1.5. Does not rewrite the 2025 prior. Raw CSVs stay off the public desk.",
        },
        "teams": teams,
        "missing": [a for a, o, d in short],
    }
    OUT.write_text(json.dumps(payload, indent=2) + "\n")
    nets_sorted = sorted(nets, key=lambda x: -x[1])
    print("league", round(league, 2), "n_grades", len(all_grades), "skipped_low", skipped)
    print("short", short)
    print("top", nets_sorted[:5])
    print("bot", nets_sorted[-5:])
    print("wrote", OUT, "clubs", len(teams))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Build data/unit-mismatches-2026.json for the game-sheet research panel.

Display only. This script never writes B$ lines, bs-line-history, shadow DVOA
blend grades, or anything eff() reads.

Tuesday path (this PR): assemble the site JSON from the week source CSVs in
data/unit-mismatches/source/2026-wNN/. Those CSVs are the Week 5 scratch
build (PFF snap-weighted grades + nflverse per-play rates + injury-2026.json).

    python3 data/unit-mismatches/build_unit_mismatches.py
    python3 data/unit-mismatches/build_unit_mismatches.py --self-test

Full live rebuild (next Tuesday, once the facet cache exists):

    python3 data/unit-mismatches/build_units.py --week N
    python3 data/unit-mismatches/mismatches.py --week N
    python3 data/unit-mismatches/build_unit_mismatches.py --week N

TODO: build_units.py still needs the PFF facet cache and nflverse play-by-play
(not in this repo). Until that cache is checked in or fetched, do not invent
new ranks — drop the fresh CSVs in source/2026-wNN/ and re-run this script.
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # data/
REPO = ROOT.parent
SOURCE = Path(__file__).resolve().parent / "source"
OUT = ROOT / "unit-mismatches-2026.json"

FOOTNOTE = (
    "Sandmoney 2021–25 backtest found no ATS edge vs the close. "
    "Research panel only. Sandmoney lines PR #6 dropped unit mismatch as a "
    "line input; the market already prices it."
)
METHOD = (
    "10 units (OL, DL, Run O, Run D, WR, TE, DB, LB, Sacks, Sacks allowed). "
    "Score = 50% PFF snap-weighted grade + 50% nflverse per-play rate, "
    "z-scored across 32 teams. Injury Out/Doubtful/IR/PUP/NFI = out, "
    "Questionable = 0.5. A flag is a top-8 unit against a bottom-8 unit "
    "after that injury adjustment. Ranks use prior weeks only."
)

# Expected Week 5 true flags (edge, favored). Guards a bad CSV drop.
WEEK5_FLAGS = [
    ("CLE@NYJ", 2.81, "CLE"),
    ("MIN@NO", 2.67, "MIN"),
    ("NYG@WSH", 2.60, "NYG"),
    ("DEN@LAC", 2.41, "DEN"),
    ("SF@SEA", 2.32, "SEA"),
    ("BUF@LAR", 2.12, "LAR"),
    ("CHI@GB", 2.07, "CHI"),
    ("CIN@MIA", 1.88, "CIN"),
    ("LV@NE", 1.84, "LV"),
    ("HOU@TEN", 1.71, "HOU"),
]


def truthy(value: str) -> bool:
    return str(value).strip().lower() in {"true", "1", "yes"}


def num(value: str):
    text = str(value).strip()
    if text == "":
        return None
    return float(text) if "." in text else int(text)


def read_csv(path: Path) -> list[dict]:
    with path.open(newline="") as handle:
        return list(csv.DictReader(handle))


def espn_ids() -> dict[tuple, str]:
    slate = json.loads((ROOT / "nfl-2026.json").read_text())
    out = {}
    for game in slate.get("games") or []:
        out[(int(game["week"]), game["away"], game["home"])] = str(game["id"])
    return out


def flag_row(raw: dict) -> dict:
    edge = abs(float(raw["edge_z_adj"]))
    return {
        "pairing": raw["pairing"],
        "offense": raw["offense"],
        "defense": raw["defense"],
        "off_unit": raw["off_unit"],
        "def_unit": raw["def_unit"],
        "off_rank_raw": int(raw["off_rank_raw"]),
        "off_rank_adj": int(raw["off_rank_adj"]),
        "def_rank_raw": int(raw["def_rank_raw"]),
        "def_rank_adj": int(raw["def_rank_adj"]),
        "edge_z": round(edge, 2),
        "favored": raw["favored"],
        "qb_note": (raw.get("qb_note") or "").strip(),
    }


def build_week(week: int) -> dict:
    folder = SOURCE / f"2026-w{week:02d}"
    mismatches_path = folder / "mismatches.csv"
    games_path = folder / "games.csv"
    if not mismatches_path.is_file() or not games_path.is_file():
        raise SystemExit(
            f"missing {mismatches_path.name} or {games_path.name} in {folder}. "
            "Drop the week CSVs there, or run build_units.py once the PFF cache exists."
        )
    ids = espn_ids()
    grouped: dict[str, dict] = {}
    for raw in read_csv(mismatches_path):
        gid = raw["game"]
        bucket = grouped.setdefault(gid, {"flags": [], "near": []})
        row = flag_row(raw)
        if truthy(raw.get("flag", "")):
            bucket["flags"].append(row)
        elif truthy(raw.get("near_flag", "")):
            bucket["near"].append(row)
    games = []
    for raw in read_csv(games_path):
        away, home = raw["game"].split("@", 1)
        hit = grouped.get(raw["game"], {"flags": [], "near": []})
        flags = sorted(hit["flags"], key=lambda r: r["edge_z"], reverse=True)
        near = sorted(hit["near"], key=lambda r: r["edge_z"], reverse=True)
        games.append({
            "espn_id": ids.get((week, away, home), ""),
            "id": raw["game"],
            "away": away,
            "home": home,
            "kick": raw.get("kick") or "",
            "net_edge_z": round(abs(float(raw["net_unit_edge_z"])), 2),
            "net_favors": raw["net_unit_favors"],
            "flags": flags,
            "near": near,
        })
    games.sort(key=lambda g: (g["kick"], g["id"]))
    return {
        "plays_through_week": week - 1,
        "generated_et": "2026-10-06T16:20:00Z" if week == 5 else "",
        "injury_source": "data/injury-2026.json",
        "injury_note": "Out/Doubtful/IR/PUP/NFI count as out. Questionable counts as 0.5. Ranks shown are injury-adjusted; raw rank is included when it moved.",
        "flag_rule": "top-8 vs bottom-8 after injuries",
        "near_rule": "top-10 vs bottom-10 after injuries",
        "source": f"data/unit-mismatches/source/2026-w{week:02d}/",
        "games": games,
    }


def assemble(weeks: list[int]) -> dict:
    payload = {
        "season": 2026,
        "in_b_line": False,
        "tag": "Research only — not in B$ line",
        "footnote": FOOTNOTE,
        "method": METHOD,
        "does_not_feed": [
            "eff()",
            "injuryTerm()",
            "ourHomeSpread()",
            "append_model_snapshot",
            "shadow_dvoa_blend",
        ],
        "weeks": {str(week): build_week(week) for week in weeks},
    }
    return payload


def check(payload: dict) -> None:
    week = payload["weeks"].get("5")
    if not week:
        raise SystemExit("self-test: week 5 missing")
    by_id = {g["id"]: g for g in week["games"]}
    if len(by_id) != 15:
        raise SystemExit(f"self-test: expected 15 Week 5 games, got {len(by_id)}")
    flags = []
    for game in week["games"]:
        if not game["espn_id"]:
            raise SystemExit(f"self-test: no espn id for {game['id']}")
        for row in game["flags"]:
            flags.append((game["id"], row["edge_z"], row["favored"]))
    flags.sort(key=lambda item: (-item[1], item[0]))
    if len(flags) != len(WEEK5_FLAGS):
        raise SystemExit(f"self-test: expected {len(WEEK5_FLAGS)} flags, got {flags}")
    for got, exp in zip(flags, WEEK5_FLAGS):
        if got[0] != exp[0] or got[2] != exp[2] or abs(got[1] - exp[1]) > 0.011:
            raise SystemExit(f"self-test: flag table drifted:\n{flags}")
    quiet = by_id["PHI@JAX"]
    if quiet["flags"]:
        raise SystemExit("self-test: PHI@JAX should have no top-8 flags")
    if not quiet["near"] or quiet["net_favors"] != "JAX":
        raise SystemExit("self-test: PHI@JAX near/net missing")
    cle = by_id["CLE@NYJ"]["flags"][0]
    if cle["off_rank_adj"] != 30 or cle["def_rank_adj"] != 6:
        raise SystemExit("self-test: CLE@NYJ injury-adjusted ranks drifted")
    print(f"self-test ok: {len(flags)} flags, {len(by_id)} games")


def main() -> None:
    parser = argparse.ArgumentParser(description="Assemble the unit-mismatch research JSON.")
    parser.add_argument("--week", type=int, action="append", dest="weeks", help="Week to include. Repeatable. Default: every source/2026-wNN folder.")
    parser.add_argument("--self-test", action="store_true", help="Assert the Week 5 flag table, then write.")
    args = parser.parse_args()
    if args.weeks:
        weeks = args.weeks
    else:
        weeks = sorted(int(p.name.split("-w")[1]) for p in SOURCE.glob("2026-w*") if p.is_dir())
    if not weeks:
        raise SystemExit(f"no week folders in {SOURCE}")
    payload = assemble(weeks)
    if args.self_test or 5 in weeks:
        check(payload)
    OUT.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"wrote {OUT.relative_to(REPO)}")


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        sys.exit(0)

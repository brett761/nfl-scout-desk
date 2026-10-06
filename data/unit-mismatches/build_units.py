#!/usr/bin/env python3
"""Weekly unit-rank rebuild. Research only. Never writes a B$ line.

Adapted from the Week 5 scratch build (build_units.py). The scoring method
is unchanged:

  10 units. Each score = 50% PFF snap-weighted facet grade + 50% nflverse
  per-play rate. Every input is z-scored across 32 teams. Garbage time
  (win probability outside 0.10–0.90) is weighted 0.25, same as desk DVOA.
  Injury Out / Doubtful / IR / PUP / NFI = 0% available. Questionable = 50%.
  A missing player's snap share is refilled at the league 30th-percentile
  grade for that position. Sack units move by 0.5× the change in the DL
  pass-rush or OL pass-block grade z.

This does not run in CI. The PFF facet cache and the nflverse play-by-play
parquet are not in the repo (player-level facets, not the team overview in
data/pff-2026-ytd.json, and not the roster sqlite).

TODO: on a Tuesday with a PFF key, fetch the seven facets for REG weeks
1..W-1 through data/pff_api.py (always pass REG weeks — unfiltered calls
include preseason), cache them under data/unit-mismatches/cache/, and pull
nflverse play_by_play for the same window. Then this script can write
source/2026-wNN/rankings.csv and scores.json. Until that cache exists, ship
the panel from the CSVs:

    python3 data/unit-mismatches/build_unit_mismatches.py --week N

Do not feed the scores into eff(), append_model_snapshot, or the DVOA blend.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CACHE = HERE / "cache"
DESK = HERE.parent  # data/

REQUIRED = [
    CACHE / "v1_facet_offense_pass_blocking_2026.json",
    CACHE / "v1_facet_offense_run_blocking_2026.json",
    CACHE / "v1_facet_defense_pass_rush_2026.json",
    CACHE / "v1_facet_defense_run_2026.json",
    CACHE / "v1_facet_defense_coverage_2026.json",
    CACHE / "v1_facet_receiving_summary_2026.json",
    CACHE / "v1_facet_rushing_summary_2026.json",
    CACHE / "play_by_play_2026.parquet",
    DESK / "pff-players-2026.sqlite",
    DESK / "injury-2026.json",
]

UNITS = {
    "OL": (["ol_pass_block", "ol_run_block"], [("ol_press_rate_allowed", -1), ("aly", 1), ("ybc_att", 1)]),
    "DL": (["dl_pass_rush", "dl_run_def"], [("dl_press_rate", 1), ("dl_win_rate", 1), ("aly_allowed", -1)]),
    "Run O": (["rusher_run", "team_run_block"], [("rush_epa", 1), ("rush_sr", 1)]),
    "Run D": (["team_run_def"], [("rush_epa_allowed", -1), ("rush_sr_allowed", -1)]),
    "WR": (["wr_route"], [("wr_epa_tgt", 1), ("wr_yprr", 1)]),
    "TE": (["te_route"], [("te_epa_tgt", 1), ("te_yprr", 1)]),
    "DB": (["db_cov"], [("epa_db_allowed", -1), ("db_yds_cov_snap", -1)]),
    "LB": (["lb_run_def", "lb_cov", "lb_tackle"], [("lb_missed_tkl_rate", -1), ("lb_stop_rate", 1)]),
    "Sacks": ([], [("sack_rate", 1)]),
    "Sacks GU": ([], [("sack_rate_allowed", -1)]),
}
SUBS = {
    "OL pass-block": (["ol_pass_block"], [("ol_press_rate_allowed", -1)]),
    "DL pass-rush": (["dl_pass_rush"], [("dl_press_rate", 1), ("dl_win_rate", 1)]),
    "OL run-block": (["ol_run_block"], [("aly", 1), ("ybc_att", 1)]),
    "DL+LB run D": (["dl_run_def", "lb_run_def"], [("aly_allowed", -1), ("rush_sr_allowed", -1)]),
    "LB coverage": (["lb_cov"], []),
}
INJURY_AVAIL = {"OUT": 0.0, "IR": 0.0, "DOUBTFUL": 0.0, "PUP": 0.0, "NFI": 0.0, "QUESTIONABLE": 0.5}


def missing_inputs() -> list[Path]:
    return [path for path in REQUIRED if not path.is_file()]


def main() -> None:
    parser = argparse.ArgumentParser(description="Rebuild unit ranks from PFF facets + nflverse. Research only.")
    parser.add_argument("--week", type=int, default=5, help="Slate week. Ranks use weeks 1..week-1.")
    args = parser.parse_args()
    missing = missing_inputs()
    if missing:
        print("TODO: weekly unit rebuild is not runnable in this checkout.")
        print(f"Week {args.week} panel data stays on the source CSVs.")
        print("Missing:")
        for path in missing:
            print(f"  - {path}")
        print()
        print("Injury file on the desk is data/injury-2026.json (Out/D/IR = 0, Q = 0.5).")
        print("Team PFF overview (data/pff-2026-ytd.json) is not snap-weighted by position")
        print("and is not a substitute for the seven facet endpoints.")
        print("Assemble the site JSON with:")
        print("  python3 data/unit-mismatches/build_unit_mismatches.py --week", args.week)
        raise SystemExit(2)
    raise SystemExit(
        "Facet cache is present, but the numeric rebuild is still the scratch "
        "build_units.py body. Do not half-run it against a partial cache. "
        "Wire the z-score blend (UNITS / SUBS in this file) before trusting new ranks."
    )


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        sys.exit(0)

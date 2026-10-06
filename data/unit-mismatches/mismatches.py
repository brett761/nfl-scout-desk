#!/usr/bin/env python3
"""Turn unit scores into per-game flags. Research only. Never writes a B$ line.

Adapted from the Week 5 scratch mismatches.py.

Pairings (offense unit vs opposing defense unit), both directions:
  Run O vs Run D
  OL pass-block vs DL pass-rush
  Sacks allowed vs Sacks
  WR+TE (0.65 / 0.35) vs DB+LB coverage (0.75 / 0.25)
  OL run-block vs DL+LB run D

A flag is top-8 vs bottom-8 on the injury-adjusted ranks. A near-flag is
top-10 vs bottom-10 and not already a flag. Net unit edge is the sum of the
home-centric pairing edges. The with/against tag on the site is NOT taken
from this file — the game sheet compares the favored side to the current
B$ line and the current DraftKings number at render time.

TODO: this step needs scores.json from build_units.py. That rebuild is
blocked on the PFF facet cache (see build_units.py). Week 5 flags are
already in source/2026-w05/mismatches.csv and games.csv.

    python3 data/unit-mismatches/build_unit_mismatches.py
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PAIRS = [
    ("Run O vs Run D", "Run O", "Run D"),
    ("OL pass-block vs DL pass-rush", "OL pass-block", "DL pass-rush"),
    ("Sacks GU vs Sacks", "Sacks GU", "Sacks"),
    ("WR+TE vs DB+LB cov", "WR+TE", "DB+LB cov"),
    ("OL run-block vs DL+LB run D", "OL run-block", "DL+LB run D"),
]
FLAG_TOP = 8
FLAG_BOTTOM = 25  # rank >= 25 is bottom 8
NEAR_TOP = 10
NEAR_BOTTOM = 23


def main() -> None:
    parser = argparse.ArgumentParser(description="Flag unit mismatches. Research only.")
    parser.add_argument("--week", type=int, default=5)
    args = parser.parse_args()
    scores = HERE / "cache" / "scores.json"
    print("Pairings:", ", ".join(label for label, _o, _d in PAIRS))
    print(f"Flag: rank <={FLAG_TOP} vs rank >={FLAG_BOTTOM}. Near: <={NEAR_TOP} vs >={NEAR_BOTTOM}.")
    if not scores.is_file():
        print()
        print(f"TODO: {scores.name} is not in this checkout (build_units.py has not run).")
        print(f"Week {args.week} flags ship from source/2026-w{args.week:02d}/.")
        print("The site compares each favored side to the live B$ line vs DraftKings.")
        print("Assemble with:")
        print("  python3 data/unit-mismatches/build_unit_mismatches.py --week", args.week)
        raise SystemExit(2)
    raise SystemExit(
        "scores.json is present, but flag math still lives in the Week 5 CSV assembler. "
        "Do not write a second flag table until build_units.py is wired."
    )


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        sys.exit(0)

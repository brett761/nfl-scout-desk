#!/usr/bin/env python3
"""Fold a completed NFL week into the official B$ record.

Usage (from the repo root):
    python3 scripts/fold_week_record.py            # latest week whose games are all FINAL
    python3 scripts/fold_week_record.py 7          # a specific week
    python3 scripts/fold_week_record.py 7 --no-pull  # keep data/closes/2026-wNN.json on disk

Run after MNF is final and data/nfl-2026.json carries the final scores.
Steps: pull ESPN DraftKings closes -> data/closes/2026-wNN.json, append the close
snapshot to line history, rebuild canonical-2026.json (Bet History, Overall Record,
homepage outcomes read it), grade the DVOA blend shadow line, validate.
Weeks 2-4 stay locked and Week 1 stays out (enforced by validate_record.mjs).
Exits non-zero if any step or validation fails. Commits nothing.
"""
import json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def latest_complete_week():
    with open(os.path.join(ROOT, "data/nfl-2026.json")) as f:
        d = json.load(f)
    games = d["games"] if isinstance(d, dict) else d
    weeks = {}
    for g in games:
        weeks.setdefault(int(g["week"]), []).append(g)
    done = [w for w, gs in weeks.items() if w >= 4 and gs and all(
        g.get("status") == "FINAL" and g.get("home_score") is not None and g.get("away_score") is not None for g in gs)]
    return max(done) if done else None


def run(cmd):
    print("$", " ".join(cmd), flush=True)
    r = subprocess.run(cmd, cwd=ROOT)
    if r.returncode != 0:
        sys.exit(r.returncode)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = [a for a in sys.argv[1:] if a.startswith("--")]
    week = int(args[0]) if args else latest_complete_week()
    if week is None or week < 4:
        sys.exit("No completed week 4+ to fold.")
    run(["node", "data/record/weekly.mjs", "--week", str(week)] + [f for f in flags if f in ("--pull", "--no-pull")])
    run(["node", "data/model/grade_shadow_blend.mjs"])
    run(["node", "data/record/validate_record.mjs"])
    print("folded week", week)


if __name__ == "__main__":
    main()

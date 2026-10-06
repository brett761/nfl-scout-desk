#!/usr/bin/env python3
"""Hook for the daily injury refresh (data/reseed_injury_<day>_wN.py).

Rebuilds this week's shadow trench health file from the freshly written
data/injury-2026.json. Shadow only: nothing here feeds the B$ line.

It never fails the reseed. Any error, timeout, or missing download is printed
and the reseed carries on. Frozen (locked) weeks are never overwritten.

Usage from a reseed script (already in reseed_injury_monday_w5.py):

    from pathlib import Path
    import runpy
    runpy.run_path(str(Path(__file__).resolve().parent / "injury-trench" / "after_reseed.py"),
                   run_name="__main__")

Or by hand:  python3 data/injury-trench/after_reseed.py [--refresh] [--week N]
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
TIMEOUT_S = 900


def run(extra: list[str] | None = None) -> int:
    cmd = [sys.executable, str(HERE / "compute_trench_health.py"), "--rows", "seed", *(extra or [])]
    print("[injury-trench] shadow health index:", " ".join(cmd[1:]))
    try:
        res = subprocess.run(cmd, check=False, timeout=TIMEOUT_S)
        if res.returncode != 0:
            print(f"[injury-trench] skipped (exit {res.returncode}); the injury reseed itself is fine.")
        return res.returncode
    except Exception as err:  # never break the reseed
        print(f"[injury-trench] skipped ({err}); the injury reseed itself is fine.")
        return 1


if __name__ == "__main__":
    run(sys.argv[1:])
    sys.exit(0)

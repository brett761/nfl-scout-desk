#!/usr/bin/env python3
"""B$ Daily line text.

Prints the published board. Does not send email.

Week 4 and later use official_b_line when the snapshot has one. Otherwise the
raw line is rounded here with the same rule as data/record/round_half.mjs:
nearest 0.5, and exact .25/.75 round away from zero. Weeks 2 and 3 stay raw.
"""

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HISTORY = ROOT / "data" / "model" / "bs-line-history-2026.json"
MINUS = "\u2212"


def num(value):
    if value is None or value == "":
        return None
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(n):
        return None
    return n


def round_half_away_from_zero(value):
    """Nearest 0.5. Halfway cases (.25 and .75) round away from zero."""
    n = num(value)
    if n is None:
        return None
    sign = -1 if n < 0 else 1
    steps = abs(n) / 0.5
    lower = math.floor(steps + 1e-9)
    frac = steps - lower
    rounded_steps = lower + 1 if frac > 0.5 - 1e-8 else lower
    out = sign * rounded_steps * 0.5
    return 0 if out == 0 else out


def official_home_spread(week, raw):
    n = num(raw)
    if n is None:
        return None
    if int(week) < 4:
        return n
    return round_half_away_from_zero(n)


def published_home_spread(week, raw, official=None):
    if int(week) < 4:
        return num(raw)
    stored = num(official)
    if stored is not None:
        return stored
    return official_home_spread(week, raw)


def format_favorite_line(home_spread, home, away):
    n = num(home_spread)
    if n is None:
        return "—"
    if n == 0:
        return "PK"
    body = f"{abs(n):.1f}"
    if n < 0:
        return f"{home} {MINUS}{body}"
    return f"{away} {MINUS}{body}"


def daily_row(game):
    versions = [v for v in (game.get("versions") or []) if num(v.get("b_line")) is not None]
    if not versions:
        return None
    first, last = versions[0], versions[-1]
    week = int(game["week"])
    first_pub = published_home_spread(week, first.get("b_line"), first.get("official_b_line"))
    last_pub = published_home_spread(week, last.get("b_line"), last.get("official_b_line"))
    home, away = game.get("home"), game.get("away")
    label = lambda n: format_favorite_line(n, home, away)
    return {
        "game_id": game.get("game_id"),
        "site_before": label(num(last.get("b_line"))),
        "site_after": label(last_pub),
        "daily_before": "B$ " + label(num(first.get("b_line"))) + " → " + label(num(last.get("b_line"))),
        "daily_after": "B$ " + label(first_pub) + " → " + label(last_pub),
    }


def week_board(history, week):
    rows = []
    for game in history.get("games") or []:
        if int(game.get("week") or 0) != int(week):
            continue
        row = daily_row(game)
        if row:
            rows.append(row)
    rows.sort(key=lambda row: row["game_id"] or "")
    return rows


def print_week(week):
    history = json.loads(HISTORY.read_text())
    for row in week_board(history, week):
        print(
            f"{row['game_id']} | site {row['site_before']} => {row['site_after']} | "
            f"{row['daily_before']} || {row['daily_after']}"
        )


def main(argv):
    if argv[:1] == ["--round"]:
        for raw in argv[1:]:
            print(json.dumps(round_half_away_from_zero(float(raw))))
        return 0
    if argv[:1] == ["--official"]:
        args = argv[1:]
        if len(args) % 2:
            raise SystemExit("--official expects week raw pairs")
        for i in range(0, len(args), 2):
            print(json.dumps(official_home_spread(int(args[i]), float(args[i + 1]))))
        return 0
    week = 5
    if "--week" in argv:
        week = int(argv[argv.index("--week") + 1])
    # Default and --print both print the board. Nothing is emailed.
    print_week(week)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

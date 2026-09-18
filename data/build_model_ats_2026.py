#!/usr/bin/env python3
"""Build data/model-ats-2026.json — model ATS at the closing spread.

Grades every final game that has a model_home_spread (postmortem week row
or lock file). Does NOT require a ticket. Separate from ticket/process P/L.

Rule (home-centric spreads, neg = home favorite):
  edge = close_spread − model_home_spread
  edge > 0 → take home at close; edge < 0 → take away; edge == 0 → push/no play
  Home wins if actual_home_margin + close_spread > 0; loses < 0; push == 0
  Away wins if actual_home_margin + close_spread < 0; loses > 0; push == 0
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
POST = ROOT / "postmortem"
WEEKS = POST / "weeks"
LOCKS = POST / "locks"
CLOSES = ROOT / "closes"
NFL = ROOT / "nfl-2026.json"
OUT = ROOT / "model-ats-2026.json"


def num(v):
    if v is None:
        return None
    try:
        if isinstance(v, bool):
            return None
        return float(v)
    except (TypeError, ValueError):
        return None


def load_json(p: Path):
    return json.loads(p.read_text())


def fmt_spread(n: float) -> str:
    if n is None:
        return "—"
    if abs(n) < 1e-9:
        return "PK"
    sign = "−" if n < 0 else "+"
    body = f"{abs(n):.2f}".rstrip("0").rstrip(".")
    return sign + body


def grade_side(side: str, actual_home_margin: float, close_spread: float) -> str:
    cover = actual_home_margin + close_spread
    if abs(cover) < 1e-9:
        return "P"
    if side == "home":
        return "W" if cover > 0 else "L"
    if side == "away":
        return "W" if cover < 0 else "L"
    return "P"


def choose_side(edge: float) -> str | None:
    if abs(edge) < 1e-9:
        return None  # no play / push
    return "home" if edge > 0 else "away"


def tally(results: list[str]) -> dict:
    w = sum(1 for r in results if r == "W")
    l = sum(1 for r in results if r == "L")
    p = sum(1 for r in results if r == "P")
    return {"w": w, "l": l, "p": p, "text": f"{w}–{l}–{p}", "n": w + l + p}


def load_locks() -> dict:
    by_key = {}
    for f in sorted(LOCKS.glob("*.json")):
        d = load_json(f)
        game = d.get("game_id") or f"{d.get('away')}@{d.get('home')}"
        espn = str(d.get("espn_id") or "")
        key = (int(d.get("season") or 2026), int(d.get("week") or 0), game)
        entry = {
            "path": str(f.relative_to(ROOT)),
            "game": game,
            "away": d.get("away"),
            "home": d.get("home"),
            "espn_id": espn,
            "season": int(d.get("season") or 2026),
            "week": int(d.get("week") or 0),
            "model_home_spread": num(d.get("model_home_spread")),
            "model_home_spread_source": d.get("model_home_spread_source"),
            "close_at_lock": num(d.get("close_at_lock")),
            "street_home_spread": num(d.get("street_home_spread")),
            "final": d.get("final"),
        }
        by_key[key] = entry
        if espn:
            by_key[("espn", espn)] = entry
        by_key[("game", int(d.get("season") or 2026), int(d.get("week") or 0), game)] = entry
    return by_key


def load_closes() -> dict:
    """Map (season, week, game) or espn_id -> close_spread."""
    out = {}
    for f in sorted(CLOSES.glob("*.json")):
        d = load_json(f)
        season = int(d.get("season") or 2026)
        week = int(d.get("week") or 0)
        for g in d.get("games") or []:
            game = g.get("game")
            espn = str(g.get("espn_id") or "")
            cs = num(g.get("close_spread"))
            if game:
                out[(season, week, game)] = {"close_spread": cs, "source": f"closes/{f.name}"}
            if espn:
                out[("espn", espn)] = {"close_spread": cs, "source": f"closes/{f.name}"}
    return out


def load_nfl_scores() -> dict:
    if not NFL.exists():
        return {}
    d = load_json(NFL)
    out = {}
    for g in d.get("games") or []:
        espn = str(g.get("id") or "")
        away, home = g.get("away"), g.get("home")
        week = int(g.get("week") or 0)
        status = str(g.get("status") or "").upper()
        final = status in ("FINAL", "STATUS_FINAL") or (
            g.get("away_score") is not None and g.get("home_score") is not None
            and status.startswith("F")
        )
        # also treat numeric scores as final when status FINAL
        if g.get("away_score") is not None and g.get("home_score") is not None:
            if "FINAL" in status or status == "F":
                final = True
        rec = {
            "away": away,
            "home": home,
            "week": week,
            "away_score": g.get("away_score"),
            "home_score": g.get("home_score"),
            "status": g.get("status"),
            "odds": g.get("odds"),
            "game": f"{away}@{home}" if away and home else None,
            "final": bool(final),
        }
        if espn:
            out[espn] = rec
        if away and home:
            out[(2026, week, f"{away}@{home}")] = rec
    return out


def parse_home_spread_from_odds(odds: str, home: str, away: str):
    """Best-effort: 'BUF -4.5' → home-centric if BUF is home."""
    if not odds or not isinstance(odds, str):
        return None
    s = odds.strip().upper().replace("−", "-")
    parts = s.replace("/", " ").split()
    if len(parts) < 2:
        return None
    team, line_s = parts[0], parts[1]
    try:
        line = float(line_s)
    except ValueError:
        return None
    if team == (home or "").upper():
        return line
    if team == (away or "").upper():
        return -line
    return None


def main():
    locks = load_locks()
    closes = load_closes()
    nfl = load_nfl_scores()
    games = []
    coverage = {
        "weeks_scanned": [],
        "ungraded_final_no_model": [],
        "notes": [],
    }

    # --- from postmortem week files ---
    for wf in sorted(WEEKS.glob("2026-W*.json")):
        if "results" in wf.name:
            continue
        d = load_json(wf)
        season = int(d.get("season") or 2026)
        week = int(d.get("week") or 0)
        coverage["weeks_scanned"].append(wf.name)
        for row in d.get("rows") or []:
            game = row.get("game")
            espn = str(row.get("espn_id") or "")
            status = str(row.get("status") or "")
            is_final = "FINAL" in status.upper()
            away, home = row.get("away"), row.get("home")
            margin = num(row.get("actual_home_margin"))
            if margin is None and row.get("home_score") is not None and row.get("away_score") is not None:
                margin = float(row["home_score"]) - float(row["away_score"])

            model = num(row.get("model_home_spread"))
            model_src = "postmortem_week"
            lock = None
            if espn and ("espn", espn) in locks:
                lock = locks[("espn", espn)]
            elif (season, week, game) in locks:
                lock = locks[(season, week, game)]
            if model is None and lock is not None:
                model = lock.get("model_home_spread")
                if model is not None:
                    model_src = f"lock:{lock['path']}"

            close = num(row.get("close_spread"))
            close_src = "postmortem_week"
            if close is None:
                c = closes.get(("espn", espn)) or closes.get((season, week, game))
                if c and c.get("close_spread") is not None:
                    close = c["close_spread"]
                    close_src = c["source"]
            if close is None and lock is not None:
                close = lock.get("close_at_lock")
                if close is not None:
                    close_src = f"lock.close_at_lock:{lock['path']}"

            if not is_final:
                continue
            if model is None or close is None or margin is None:
                coverage["ungraded_final_no_model"].append({
                    "week": week,
                    "game": game,
                    "espn_id": espn,
                    "reason": (
                        "missing_model_home_spread" if model is None
                        else "missing_close_spread" if close is None
                        else "missing_actual_home_margin"
                    ),
                    "had_lock": lock is not None,
                    "lock_model": None if not lock else lock.get("model_home_spread"),
                })
                continue

            edge = close - model
            side = choose_side(edge)
            if side is None:
                result = "P"
                side_label = "—"
            else:
                result = grade_side(side, margin, close)
                side_label = home if side == "home" else away

            games.append({
                "season": season,
                "week": week,
                "game": game,
                "away": away,
                "home": home,
                "espn_id": espn,
                "status": "FINAL",
                "model_home_spread": model,
                "model_source": model_src,
                "close_spread": close,
                "close_source": close_src,
                "actual_home_margin": margin,
                "away_score": row.get("away_score"),
                "home_score": row.get("home_score"),
                "edge": round(edge, 4),
                "side": side or "push",
                "side_team": side_label if side else None,
                "result": result,
                "ticket_required": False,
            })

    # --- lock-only finals not already graded (e.g. W2 TNF before week file) ---
    graded_espn = {g["espn_id"] for g in games if g.get("espn_id")}
    graded_gw = {(g["season"], g["week"], g["game"]) for g in games}

    for f in sorted(LOCKS.glob("*.json")):
        lock = load_json(f)
        season = int(lock.get("season") or 2026)
        week = int(lock.get("week") or 0)
        away, home = lock.get("away"), lock.get("home")
        game = lock.get("game_id") or f"{away}@{home}"
        espn = str(lock.get("espn_id") or "")
        if espn and espn in graded_espn:
            continue
        if (season, week, game) in graded_gw:
            continue

        model = num(lock.get("model_home_spread"))
        if model is None:
            continue

        # need final score
        score = None
        if espn and espn in nfl:
            score = nfl[espn]
        elif (season, week, game) in nfl:
            score = nfl[(season, week, game)]
        fin = lock.get("final")
        margin = None
        away_score = home_score = None
        if score and score.get("final") and score.get("away_score") is not None:
            away_score = score["away_score"]
            home_score = score["home_score"]
            margin = float(home_score) - float(away_score)
        elif isinstance(fin, dict) and fin.get("home") is not None and fin.get("away") is not None:
            away_score = fin["away"]
            home_score = fin["home"]
            margin = float(home_score) - float(away_score)
        else:
            coverage["notes"].append(
                f"Lock {f.name} has model but game not final / no score yet — skipped."
            )
            continue

        close = None
        close_src = None
        c = closes.get(("espn", espn)) or closes.get((season, week, game))
        if c and c.get("close_spread") is not None:
            close = c["close_spread"]
            close_src = c["source"]
        if close is None:
            close = num(lock.get("close_at_lock"))
            if close is not None:
                close_src = f"lock.close_at_lock:{f.name}"
        if close is None:
            close = num(lock.get("street_home_spread"))
            if close is not None:
                close_src = f"lock.street_home_spread:{f.name}"
        if close is None and score and score.get("odds"):
            close = parse_home_spread_from_odds(score["odds"], home, away)
            if close is not None:
                close_src = "nfl-2026.json odds (last board)"

        if close is None or margin is None:
            coverage["ungraded_final_no_model"].append({
                "week": week,
                "game": game,
                "espn_id": espn,
                "reason": "missing_close_spread" if close is None else "missing_margin",
                "had_lock": True,
                "lock_model": model,
            })
            continue

        edge = close - model
        side = choose_side(edge)
        if side is None:
            result = "P"
            side_label = None
        else:
            result = grade_side(side, margin, close)
            side_label = home if side == "home" else away

        games.append({
            "season": season,
            "week": week,
            "game": game,
            "away": away,
            "home": home,
            "espn_id": espn,
            "status": "FINAL",
            "model_home_spread": model,
            "model_source": f"lock:{f.name}",
            "close_spread": close,
            "close_source": close_src,
            "actual_home_margin": margin,
            "away_score": away_score,
            "home_score": home_score,
            "edge": round(edge, 4),
            "side": side or "push",
            "side_team": side_label,
            "result": result,
            "ticket_required": False,
        })

    games.sort(key=lambda g: (g["week"], g["game"]))

    by_week = {}
    for g in games:
        by_week.setdefault(g["week"], []).append(g)

    weeks_out = []
    for w in sorted(by_week):
        rows = by_week[w]
        weeks_out.append({
            "week": w,
            "record": tally([r["result"] for r in rows]),
            "games": rows,
        })

    season_rec = tally([g["result"] for g in games])
    n_final_with_model = len(games)
    n_ungraded = len(coverage["ungraded_final_no_model"])

    coverage["notes"].append(
        f"W1 postmortem rows: only games with model_home_spread are graded "
        f"({n_final_with_model} graded season-wide; {n_ungraded} final games left ungraded — do not invent lines)."
    )
    coverage["notes"].append(
        "W2 TNF DET@BUF included from lock + nfl-2026 FINAL score when week postmortem file is not yet written."
    )

    payload = {
        "season": 2026,
        "pulled": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "label": "Model ATS at the closing spread (not tickets)",
        "sign_convention": "home-centric spreads (neg = home favorite); actual_home_margin = home_score − away_score",
        "formula": {
            "edge": "close_spread − model_home_spread",
            "side": "edge > 0 → home at close; edge < 0 → away at close; edge == 0 → push / no play",
            "home_grade": "WIN if actual_home_margin + close_spread > 0; LOSS if < 0; PUSH if == 0",
            "away_grade": "WIN if actual_home_margin + close_spread < 0; LOSS if > 0; PUSH if == 0",
        },
        "ticket_required": False,
        "season_record": season_rec,
        "weeks": weeks_out,
        "games": games,
        "coverage": coverage,
    }
    OUT.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"Wrote {OUT.relative_to(ROOT)} — season {season_rec['text']} · {n_final_with_model} graded · {n_ungraded} ungraded finals")
    for g in games:
        print(
            f"  W{g['week']} {g['game']}: model {fmt_spread(g['model_home_spread'])} "
            f"close {fmt_spread(g['close_spread'])} side {g['side_team'] or '—'} → {g['result']}"
        )


if __name__ == "__main__":
    main()

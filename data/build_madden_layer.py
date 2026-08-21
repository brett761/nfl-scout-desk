#!/usr/bin/env python3
"""Equal-N Madden team aggregate. Same player count on every club."""
from __future__ import annotations

import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

N_OFF = 11
N_DEF = 11
OVR_PER_POINT = 4.0  # 4 OVR ≈ 1 desk point
CAP = 2.0

OFF = {"QB", "HB", "RB", "FB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "OL"}
DEF = {"LE", "RE", "DT", "DL", "EDGE", "LOLB", "MLB", "ROLB", "LB", "CB", "FS", "SS", "S", "DB"}
ST = {"K", "P", "LS"}

NICK = {
    "Cardinals": "ARI", "Falcons": "ATL", "Ravens": "BAL", "Bills": "BUF",
    "Panthers": "CAR", "Bears": "CHI", "Bengals": "CIN", "Browns": "CLE",
    "Cowboys": "DAL", "Broncos": "DEN", "Lions": "DET", "Packers": "GB",
    "Texans": "HOU", "Colts": "IND", "Jaguars": "JAX", "Chiefs": "KC",
    "Raiders": "LV", "Chargers": "LAC", "Rams": "LAR", "Dolphins": "MIA",
    "Vikings": "MIN", "Patriots": "NE", "Saints": "NO", "Giants": "NYG",
    "Jets": "NYJ", "Eagles": "PHI", "Steelers": "PIT", "Seahawks": "SEA",
    "49ers": "SF", "Buccaneers": "TB", "Titans": "TEN", "Commanders": "WSH",
    "Arizona Cardinals": "ARI", "Atlanta Falcons": "ATL", "Baltimore Ravens": "BAL",
    "Buffalo Bills": "BUF", "Carolina Panthers": "CAR", "Chicago Bears": "CHI",
    "Cincinnati Bengals": "CIN", "Cleveland Browns": "CLE", "Dallas Cowboys": "DAL",
    "Denver Broncos": "DEN", "Detroit Lions": "DET", "Green Bay Packers": "GB",
    "Houston Texans": "HOU", "Indianapolis Colts": "IND", "Jacksonville Jaguars": "JAX",
    "Kansas City Chiefs": "KC", "Las Vegas Raiders": "LV", "Los Angeles Chargers": "LAC",
    "Los Angeles Rams": "LAR", "Miami Dolphins": "MIA", "Minnesota Vikings": "MIN",
    "New England Patriots": "NE", "New Orleans Saints": "NO", "New York Giants": "NYG",
    "New York Jets": "NYJ", "Philadelphia Eagles": "PHI", "Pittsburgh Steelers": "PIT",
    "Seattle Seahawks": "SEA", "San Francisco 49ers": "SF", "Tampa Bay Buccaneers": "TB",
    "Tennessee Titans": "TEN", "Washington Commanders": "WSH", "Washington": "WSH",
    "ARI": "ARI", "ATL": "ATL", "BAL": "BAL", "BUF": "BUF", "CAR": "CAR", "CHI": "CHI",
    "CIN": "CIN", "CLE": "CLE", "DAL": "DAL", "DEN": "DEN", "DET": "DET", "GB": "GB",
    "HOU": "HOU", "IND": "IND", "JAX": "JAX", "JAC": "JAX", "KC": "KC", "LV": "LV",
    "LAC": "LAC", "LAR": "LAR", "MIA": "MIA", "MIN": "MIN", "NE": "NE", "NO": "NO",
    "NYG": "NYG", "NYJ": "NYJ", "PHI": "PHI", "PIT": "PIT", "SEA": "SEA", "SF": "SF",
    "TB": "TB", "TEN": "TEN", "WAS": "WSH", "WSH": "WSH", "WFT": "WSH",
}

CLUBS = sorted(set(NICK.values()))


def abbr_of(raw) -> str | None:
    if raw is None:
        return None
    s = str(raw).strip()
    if s in NICK:
        return NICK[s]
    # "Los Angeles Rams" already covered; try last word
    last = s.split()[-1] if s else ""
    return NICK.get(last)


def side_of(pos: str) -> str | None:
    p = str(pos or "").upper().strip()
    if p in ST:
        return "ST"
    if p in OFF:
        return "OFF"
    if p in DEF:
        return "DEF"
    if p.endswith("B") and p not in ST:
        return "DEF" if p in {"OLB", "ILB"} else None
    return None


def load_players(path: Path) -> list[dict]:
    data = json.loads(path.read_text())
    if isinstance(data, dict):
        rows = data.get("players") or data.get("docs") or data.get("items") or []
        if not rows and isinstance(data.get("teams"), dict):
            rows = []
            for team, plist in data["teams"].items():
                for p in plist or []:
                    q = dict(p)
                    q.setdefault("team", team)
                    rows.append(q)
    else:
        rows = data
    out = []
    for r in rows:
        if not isinstance(r, dict):
            continue
        name = r.get("name") or r.get("fullNameForSearch") or (
            f"{r.get('firstName','')} {r.get('lastName','')}".strip()
        )
        pos = r.get("pos") or r.get("position") or ""
        team = r.get("team_abbr") or r.get("abbr") or r.get("team") or r.get("teamName")
        abbr = abbr_of(team)
        ovr = r.get("ovr") or r.get("overall_rating") or r.get("overall")
        try:
            ovr = float(ovr)
        except (TypeError, ValueError):
            continue
        if not abbr or not name:
            continue
        out.append({
            "name": str(name).strip(),
            "pos": str(pos).upper().strip(),
            "team": abbr,
            "ovr": ovr,
            "spd": r.get("spd") or r.get("speed_rating"),
            "str": r.get("str") or r.get("strength_rating"),
            "awr": r.get("awr") or r.get("awareness_rating"),
        })
    return out


def pick_unit(players, n):
    ranked = sorted(players, key=lambda p: (-p["ovr"], p["name"]))
    return ranked[:n]


def main():
    desk = Path("/workspace/nfl-scout/desk/data")
    src = None
    for cand in [
        desk / "madden-27-players.json",
        desk / "madden-27-raw.json",
    ]:
        if cand.exists() and cand.stat().st_size > 100:
            src = cand
            break
    if not src:
        raise SystemExit("no player dump yet")

    players = load_players(src)
    by = defaultdict(lambda: {"OFF": [], "DEF": [], "ST": [], "UNK": []})
    for p in players:
        side = side_of(p["pos"]) or "UNK"
        by[p["team"]][side].append(p)

    teams = {}
    means = []
    missing = []
    for abbr in CLUBS:
        off = pick_unit(by[abbr]["OFF"], N_OFF)
        deff = pick_unit(by[abbr]["DEF"], N_DEF)
        if len(off) < N_OFF or len(deff) < N_DEF:
            missing.append((abbr, len(off), len(deff), len(by[abbr]["UNK"])))
        used = off + deff
        mean = sum(p["ovr"] for p in used) / len(used) if used else None
        off_m = sum(p["ovr"] for p in off) / len(off) if off else None
        def_m = sum(p["ovr"] for p in deff) / len(deff) if deff else None
        teams[abbr] = {
            "n": len(used),
            "n_off": len(off),
            "n_def": len(deff),
            "ovr": round(mean, 2) if mean is not None else None,
            "off_ovr": round(off_m, 2) if off_m is not None else None,
            "def_ovr": round(def_m, 2) if def_m is not None else None,
            "off": [{"name": p["name"], "pos": p["pos"], "ovr": p["ovr"]} for p in off],
            "def": [{"name": p["name"], "pos": p["pos"], "ovr": p["ovr"]} for p in deff],
        }
        if mean is not None:
            means.append(mean)

    league = sum(means) / len(means) if means else 0
    for abbr, row in teams.items():
        if row["ovr"] is None:
            row["net"] = 0
            continue
        raw = (row["ovr"] - league) / OVR_PER_POINT
        row["net"] = round(max(-CAP, min(CAP, raw)), 2)

    payload = {
        "season": 2026,
        "game": "Madden NFL 27",
        "pulled": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "source": str(src),
        "player_count": len(players),
        "scoring": {
            "n_off": N_OFF,
            "n_def": N_DEF,
            "n": N_OFF + N_DEF,
            "exclude": sorted(ST),
            "ovr_per_point": OVR_PER_POINT,
            "cap": CAP,
            "league_ovr": round(league, 2),
            "note": "Same 22 players per club (11 OFF + 11 DEF by OVR). Surplus vs league mean of those 22. 4 OVR ≈ 1 point, cap ±2. Does not rewrite the 2025 prior.",
        },
        "teams": teams,
        "missing": [{"abbr": a, "off": o, "def": d, "unk": u} for a, o, d, u in missing],
    }
    out = desk / "madden-2026.json"
    out.write_text(json.dumps(payload, indent=2) + "\n")
    ranked = sorted(teams.items(), key=lambda kv: (-(kv[1]["ovr"] or 0), kv[0]))
    print(f"wrote {out} players={len(players)} league={league:.2f} missing={missing}")
    for a, r in ranked[:8]:
        print(f"  {a} {r['ovr']} net={r['net']} n={r['n']}")
    print("  ...")
    for a, r in ranked[-4:]:
        print(f"  {a} {r['ovr']} net={r['net']} n={r['n']}")


if __name__ == "__main__":
    main()

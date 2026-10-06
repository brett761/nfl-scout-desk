"""Shared math for the shadow trench injury index. NOT an input to eff() or the B$ line.

Source: injury/trench study 2026-10-06 (report.md §4-5). Approved by Brett for a
shadow display only. The live line keeps data/injury-scale.json.

Proposed (trench) row, front seven and OL only:
    pts = position value x snap weight x P(sits)            (quality_adj = 1.0)
    position value: DL/DT 0.9, EDGE/LB 0.7, T 1.0, G/C 0.8
    snap weight (trailing 4 team games): >=75% 1.0, 60-75% 0.75, 45-60% 0.25, <45% 0
    P(sits): OUT / DOUBTFUL / IR / PUP / NFI 1.0
             QUESTIONABLE by final practice: DNP 0.45, LP 0.24, FP 0.12, unknown 0.27
    cluster: +0.5 per unit when 3+ starters (w >= 0.75, P >= 0.5) are out
    caps: front seven 3.5, OL 3.5, team 6.0 (with non-trench rows priced as live)
Live row (what is in the B$ line today, app.js injuryRowPts / injuryTerm):
    pts = impact x status multiplier (IR/OUT/PUP/NFI 1.0, DOUBTFUL 0.75,
    QUESTIONABLE 0.35 when on), auto impact clamped (QB1 1.5, All-Pro 0.5, else 0.25,
    floor 0.2), team cap 6.0.
"""

from __future__ import annotations

import re
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE.parent
CACHE = Path("/tmp/injury-trench-cache")

RELEASE = "https://github.com/nflverse/nflverse-data/releases/download"
URLS = {
    "snap_counts": RELEASE + "/snap_counts/snap_counts_{y}.parquet",
    "injuries": RELEASE + "/injuries/injuries_{y}.parquet",
    "roster_weekly": RELEASE + "/weekly_rosters/roster_weekly_{y}.parquet",
    "play_by_play": RELEASE + "/pbp/play_by_play_{y}.parquet",
    "players": RELEASE + "/players/players.parquet",
}

POS_VALUE = {"DL": 0.9, "EDGE": 0.7, "LB": 0.7, "T": 1.0, "IOL": 0.8}
UNIT_OF = {"DL": "F7", "EDGE": "F7", "LB": "F7", "T": "OL", "IOL": "OL"}
UNIT_LABEL = {"F7": "Front seven", "OL": "Offensive line", "OTHER": "Other positions"}
GROUP_LABEL = {"DL": "DL", "EDGE": "EDGE", "LB": "LB", "T": "T", "IOL": "G/C"}
POS_GROUP = {
    "DT": "DL", "NT": "DL", "DL": "DL", "IDL": "DL",
    "DE": "EDGE", "EDGE": "EDGE", "EDGE1": "EDGE", "OLB": "EDGE",
    "LB": "LB", "ILB": "LB", "MLB": "LB",
    "T": "T", "OT": "T", "LT": "T", "RT": "T",
    "G": "IOL", "OG": "IOL", "C": "IOL", "OL": "IOL", "LG": "IOL", "RG": "IOL",
}
LIVE_MULT = {"IR": 1.0, "OUT": 1.0, "PUP": 1.0, "NFI": 1.0, "DOUBTFUL": 0.75, "QUESTIONABLE": 0.35, "PROBABLE": 0.0}
SITS = {"IR", "OUT", "PUP", "NFI", "DOUBTFUL"}
Q_BY_PRACTICE = {"DNP": 0.45, "LP": 0.24, "FP": 0.12}
Q_UNKNOWN = 0.27
UNIT_CAP = 3.5
TEAM_CAP = 6.0
CLUSTER_BONUS = 0.5
CLUSTER_MIN = 3

# §4e EPA deltas per missing starter (x P x w)
D_RUSH = {"DL": 0.042, "EDGE": 0.011, "LB": 0.001}
D_PASS_F7 = 0.024
D_OL_RUSH = 0.005
D_OL_PASS = {"T": 0.031, "IOL": 0.021}
RUSHES_PER_GAME = 26
DROPBACKS_PER_GAME = 37
SHRINK_PLAYS = 150  # rushes or dropbacks of league average mixed into each team's base

# nflverse <-> desk abbreviations
TO_DESK = {"LA": "LAR", "WAS": "WSH", "OAK": "LV", "SD": "LAC", "STL": "LAR"}
TO_NFLVERSE = {"LAR": "LA", "WSH": "WAS"}


def desk_abbr(t: str) -> str:
    t = str(t or "").upper()
    return TO_DESK.get(t, t)


def norm_name(name) -> str:
    s = re.sub(r"[^a-z ]", " ", str(name or "").lower().replace(".", "").replace("'", ""))
    parts = [p for p in s.split() if p not in {"jr", "sr", "ii", "iii", "iv", "v"}]
    return " ".join(parts)


def group_of(*positions) -> str | None:
    for pos in positions:
        if pos is None:
            continue
        g = POS_GROUP.get(str(pos).strip().upper())
        if g:
            return g
    return None


def practice_code(raw) -> str:
    s = str(raw or "").strip().lower()
    if not s or s in {"nan", "none", "unknown", "-", "—"}:
        return "unknown"
    if "did not" in s or s == "dnp":
        return "DNP"
    if "limited" in s or s in {"lp", "ltd"}:
        return "LP"
    if "full" in s or s == "fp":
        return "FP"
    return "unknown"


def snap_weight(share) -> float:
    try:
        s = round(float(share), 4)
    except (TypeError, ValueError):
        return 0.0
    if s != s:  # NaN
        return 0.0
    if s >= 0.75:
        return 1.0
    if s >= 0.60:
        return 0.75
    if s >= 0.45:
        return 0.25
    return 0.0


def p_sits(status: str, practice: str) -> float:
    st = str(status or "").upper()
    if st in SITS:
        return 1.0
    if st == "QUESTIONABLE":
        return Q_BY_PRACTICE.get(practice, Q_UNKNOWN)
    return 0.0


def proposed_row(group: str | None, status: str, practice: str, share) -> dict:
    p = p_sits(status, practice)
    w = snap_weight(share)
    v = POS_VALUE.get(group or "", 0.0)
    return {"p_sits": p, "pos_value": v, "w_snap": w, "pts": round(v * w * p, 3)}


def price_team(rows: list[dict]) -> dict:
    """rows: dicts with group, status, practice, share, live_pts (>=0), live_on.

    Returns the live and proposed breakdown for one team. Points are positive
    (points lost). eff() uses the negative.
    """
    live = {"F7": 0.0, "OL": 0.0, "OTHER": 0.0}
    prop = {"F7": 0.0, "OL": 0.0}
    starters = {"F7": 0, "OL": 0}
    for r in rows:
        unit = UNIT_OF.get(r.get("group") or "", "OTHER")
        lp = float(r.get("live_pts") or 0.0) if r.get("live_on", True) else 0.0
        live[unit] += lp
        if unit == "OTHER":
            continue
        pr = proposed_row(r.get("group"), r.get("status"), r.get("practice", "unknown"), r.get("share"))
        prop[unit] += pr["pts"]
        if pr["w_snap"] >= 0.75 and pr["p_sits"] >= 0.5:
            starters[unit] += 1
    live_raw = live["F7"] + live["OL"] + live["OTHER"]
    out_units = {}
    for unit in ("F7", "OL"):
        cluster = starters[unit] >= CLUSTER_MIN
        raw = prop[unit] + (CLUSTER_BONUS if cluster else 0.0)
        out_units[unit] = {
            "rows": round(prop[unit], 3),
            "starters_out": starters[unit],
            "cluster": cluster,
            "cluster_bonus": CLUSTER_BONUS if cluster else 0.0,
            "before_cap": round(raw, 3),
            "cap": UNIT_CAP,
            "capped": raw > UNIT_CAP,
            "total": round(min(UNIT_CAP, raw), 3),
        }
    prop_raw = live["OTHER"] + out_units["F7"]["total"] + out_units["OL"]["total"]
    return {
        "live": {
            "front_seven": round(live["F7"], 3),
            "ol": round(live["OL"], 3),
            "other": round(live["OTHER"], 3),
            "before_cap": round(live_raw, 3),
            "cap": TEAM_CAP,
            "capped": live_raw > TEAM_CAP,
            "total": round(min(TEAM_CAP, live_raw), 3),
        },
        "proposed": {
            "front_seven": out_units["F7"],
            "ol": out_units["OL"],
            "other": round(live["OTHER"], 3),
            "before_cap": round(prop_raw, 3),
            "cap": TEAM_CAP,
            "capped": prop_raw > TEAM_CAP,
            "total": round(min(TEAM_CAP, prop_raw), 3),
        },
    }


def live_row_pts(row: dict, scale: dict, allpro: set[str]) -> float:
    """Replicates app.js injuryRowPts for a seed row. Returns points lost (>= 0)."""
    if row.get("pts") is not None:
        try:
            return abs(float(row["pts"]))
        except (TypeError, ValueError):
            pass
    status = str(row.get("status") or "").upper()
    mult = float((scale.get("status") or {}).get(status, 0.0))
    pos = str(row.get("pos") or "DEPTH")
    base = row.get("impact")
    if base in (None, ""):
        base = (scale.get("positions") or {}).get(pos, 0.0)
        if pos in {"QB", "QB1"}:
            base = (scale.get("positions") or {}).get("QB1", 1.5)
    raw = round(float(base) * mult, 2)
    if row.get("impact_source") == "manual":
        return max(0.0, raw)
    if pos in {"QB", "QB1"}:
        cap = float(scale.get("cap_player_qb", 1.5))
    elif norm_name(row.get("name")) in allpro:
        cap = float(scale.get("cap_player_allpro", 0.5))
    else:
        cap = float(scale.get("cap_player_other", 0.25))
    return max(0.0, min(cap, raw))


def live_on(row: dict) -> bool:
    if "on" in row:
        return bool(row.get("on"))
    st = str(row.get("status") or "").upper()
    return st in SITS


def download(kind: str, year: int, refresh: bool = False) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    dest = CACHE / f"{kind}_{year}.parquet"
    if dest.exists() and dest.stat().st_size > 0 and not refresh:
        return dest
    url = URLS[kind].format(y=year)
    req = urllib.request.Request(url, headers={"User-Agent": "nfl-scout-desk injury-trench"})
    tmp = dest.with_suffix(".partial")
    with urllib.request.urlopen(req, timeout=180) as res:
        tmp.write_bytes(res.read())
    tmp.replace(dest)
    return dest


def trailing_shares(snap, games, season: int):
    """{(desk_team, game_id) -> {pfr_id: share}} plus each player's PFR position and name.

    Share is the player's unit snap share (max of offense / defense pct) averaged
    over the team's previous four games with snap data, continuous across seasons.
    A missed game counts as 0. The first game after the last game with snaps is
    also filled, so an upcoming week gets the latest trailing share.
    """
    import numpy as np
    import pandas as pd

    snap = snap.copy()
    snap["team"] = snap["team"].map(desk_abbr)
    snap["share"] = np.fmax(snap["offense_pct"].fillna(0.0), snap["defense_pct"].fillna(0.0))
    have = set(snap.game_id.unique())
    g = games.copy()
    g["home_team"] = g.home_team.map(desk_abbr)
    g["away_team"] = g.away_team.map(desk_abbr)
    out = {}
    pos = snap.groupby("pfr_player_id").position.agg(lambda s: s.value_counts().index[0]).to_dict()
    names = snap.drop_duplicates("pfr_player_id", keep="last").set_index("pfr_player_id").player.to_dict()
    teams = sorted(set(g.home_team) | set(g.away_team))
    for team in teams:
        tg = g[(g.home_team == team) | (g.away_team == team)].sort_values(["gameday", "game_id"])
        played = tg[tg.game_id.isin(have)]
        gids = played.game_id.tolist()
        s = snap[(snap.team == team) & snap.game_id.isin(gids)]
        if s.empty:
            continue
        mat = s.pivot_table(index="pfr_player_id", columns="game_id", values="share", aggfunc="max").reindex(columns=gids).fillna(0.0)
        arr = mat.to_numpy()
        targets = list(enumerate(gids))
        # games in `season` with no snap rows yet (upcoming, or snaps not published)
        pending = tg[(~tg.game_id.isin(have)) & (tg.season == season)]
        for _, row in pending.iterrows():
            # trailing = last four games before this one that have snap data
            prior = played[played.gameday < row.gameday]
            targets.append((len(prior), row.game_id))
        for j, gid in targets:
            if j == 0:
                continue
            lo = max(0, j - 4)
            trail = arr[:, lo:j].mean(axis=1)
            out[(team, gid)] = {pid: float(v) for pid, v in zip(mat.index, trail) if v > 0}
    return out, pos, names

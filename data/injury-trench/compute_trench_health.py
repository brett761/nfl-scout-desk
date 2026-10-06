#!/usr/bin/env python3
"""Nightly shadow trench health index. NOT an input to eff() or the B$ line.

Runs after each nightly injury reseed (data/reseed_injury_*.py calls it through
data/injury-trench/after_reseed.py). It prices every row on data/injury-2026.json
two ways, the live desk way and the proposed trench way, and writes:

    data/injury-trench/health-2026-wNN.json   per-team breakdown + RDA / PDA / ORA
    data/injury-trench/index.json             weeks on file, latest week
    data/injury-trench/players-2026.csv       pre-game columns for week NN (upsert)
    data/injury-trench/team-games-2026.csv    pre-game columns for week NN (upsert)

    python3 data/injury-trench/compute_trench_health.py            # current week
    python3 data/injury-trench/compute_trench_health.py --week 5
    python3 data/injury-trench/compute_trench_health.py --week 4 --rows locks   # frozen lock rows
    python3 data/injury-trench/compute_trench_health.py --no-epa   # skip the pbp download

Inputs: injury-2026.json (or the week's lock files), injury-scale.json,
allpro-last3.json, nfl-2026.json, and nflverse snap_counts / weekly_rosters /
injuries / pbp (downloaded to /tmp/injury-trench-cache, never committed).
Practice days typed into players-2026.csv (wed/thu/fri/sat_practice) win over
the nflverse final practice status. Nothing here edits injury-2026.json.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import trench_lib as T  # noqa: E402

SEASON = 2026
ET = ZoneInfo("America/New_York")
PLAYERS_CSV = HERE / "players-2026.csv"
TEAMS_CSV = HERE / "team-games-2026.csv"
INDEX = HERE / "index.json"

PLAYER_FIELDS = [
    "season", "week", "game_id", "espn_event_id", "team", "opp", "player", "gsis_id", "pfr_id", "espn_id",
    "pos_listed", "unit", "group", "depth_slot", "trail4_snap_pct", "starter_flag", "w_snap",
    "wed_practice", "thu_practice", "fri_practice", "sat_practice", "estimated_flag", "injury",
    "final_designation", "designation_time_et", "final_practice", "p_sits", "pos_value", "proposed_pts",
    "desk_status", "desk_on", "desk_p_miss", "desk_pts",
    "active_flag", "started", "played_flag", "snaps", "snap_pct", "in_game_exit_flag", "exit_quarter",
    "notes", "source",
]
PRACTICE_COLS = ["wed_practice", "thu_practice", "fri_practice", "sat_practice"]
GAMEDAY_COLS = ["active_flag", "started", "played_flag", "snaps", "snap_pct", "in_game_exit_flag", "exit_quarter"]

TEAM_FIELDS = [
    "season", "week", "game_id", "espn_event_id", "team", "opp", "home_away",
    "f7_starters_expected_missing", "dl_starters_expected_missing", "edge_starters_expected_missing",
    "lb_starters_expected_missing", "ol_starters_expected_missing",
    "f7_starters_missing_actual", "ol_starters_missing_actual", "f7_rotational_missing", "ol_rotational_missing",
    "f7_exits", "ol_exits", "F7HI", "OLHI", "f7_cluster", "ol_cluster", "box_shift_flag",
    "live_injury_pts", "proposed_injury_pts", "proposed_minus_live",
    "rush_att", "rush_yds", "ypc", "rush_epa", "rush_success", "rush_explosive",
    "rush_att_allowed", "rush_yds_allowed", "ypc_allowed", "rush_epa_allowed", "rush_success_allowed", "rush_explosive_allowed",
    "ybc", "pass_epa", "pass_epa_allowed", "sack_rate", "sack_rate_forced", "pressure_rate",
    "bs_line_lock_home", "bs_line_source", "model_line_home", "street_open_home", "street_close_home",
    "tickets", "team_score", "opp_score", "margin", "ats_vs_bs", "ats_vs_close", "clv_vs_bs",
    "notes",
]
PREGAME_TEAM_COLS = [
    "f7_starters_expected_missing", "dl_starters_expected_missing", "edge_starters_expected_missing",
    "lb_starters_expected_missing", "ol_starters_expected_missing", "F7HI", "OLHI", "f7_cluster", "ol_cluster",
    "live_injury_pts", "proposed_injury_pts", "proposed_minus_live",
]


def now_et() -> str:
    return datetime.now(ET).strftime("%Y-%m-%d %I:%M %p ET").replace(" 0", " ")


def load_json(path: Path):
    return json.loads(path.read_text())


def read_csv(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open(newline="") as fh:
        return list(csv.DictReader(fh))


def write_csv(path: Path, fields: list[str], rows: list[dict]) -> None:
    with path.open("w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({k: ("" if r.get(k) is None else r.get(k)) for k in fields})


def fmt(v, nd=3):
    if v is None:
        return ""
    if isinstance(v, bool):
        return "1" if v else "0"
    if isinstance(v, float):
        return f"{round(v, nd):g}"
    return v


def current_week(nfl: dict) -> int:
    """Week of the next kickoff. A game counts as played 4 hours after kick."""
    from datetime import timedelta, timezone

    now = datetime.now(timezone.utc) - timedelta(hours=4)
    upcoming = []
    for g in nfl.get("games") or []:
        if not g.get("week") or not g.get("date"):
            continue
        try:
            kick = datetime.fromisoformat(str(g["date"]).replace("Z", "+00:00"))
        except ValueError:
            continue
        if kick.tzinfo is None:
            kick = kick.replace(tzinfo=timezone.utc)
        if kick > now and str(g.get("status") or "").upper() != "FINAL":
            upcoming.append(int(g["week"]))
    if upcoming:
        return min(upcoming)
    weeks = sorted({int(g["week"]) for g in nfl.get("games") or [] if g.get("week")})
    return weeks[-1] if weeks else 1


def week_slate(nfl: dict, week: int) -> dict:
    """desk team -> game info for the week."""
    out = {}
    for g in nfl.get("games") or []:
        if int(g.get("week") or 0) != week:
            continue
        away, home = T.desk_abbr(g["away"]), T.desk_abbr(g["home"])
        base = {"espn_id": str(g.get("id") or ""), "kick": g.get("date"), "away": away, "home": home}
        out[away] = {**base, "opp": home, "home_away": "away"}
        out[home] = {**base, "opp": away, "home_away": "home"}
    return out


def nflverse_game_ids(games, week: int) -> dict:
    out = {}
    part = games[(games.season == SEASON) & (games.week == week)]
    for _, g in part.iterrows():
        out[T.desk_abbr(g.home_team)] = g.game_id
        out[T.desk_abbr(g.away_team)] = g.game_id
    return out


def lock_rows(week: int, extra_dirs: list[Path] | None = None) -> dict:
    """desk team -> (rows, lock file, injury stamp) from the week's lock files.

    data/postmortem/locks is read first. An extra directory (for example a local
    desk copy with a later game-window lock) wins only when its injury stamp is
    newer than the repo file's.
    """
    out = {}
    dirs = [(T.DATA / "postmortem" / "locks", "data/postmortem/locks/")]
    for d in extra_dirs or []:
        dirs.append((Path(d), "local lock (not in repo): "))
    for folder, label in dirs:
        for path in sorted(folder.glob(f"{SEASON}-w{week:02d}-*.json")):
            try:
                d = load_json(path)
            except Exception:  # noqa: BLE001
                continue
            fs = d.get("feature_stack") if isinstance(d.get("feature_stack"), dict) else {}
            inj = fs.get("injuries")
            if not isinstance(inj, dict):
                continue
            stamp = str(fs.get("injury_pulled") or "")
            for team, rows in inj.items():
                if not isinstance(rows, list):
                    continue
                key = T.desk_abbr(team)
                prev = out.get(key)
                if prev is None or stamp > (prev[2] or ""):
                    out[key] = (rows, label + path.name, stamp)
    return out


def load_nflverse(week: int, refresh: bool, need_epa: bool):
    import pandas as pd

    snap = pd.concat([pd.read_parquet(T.download("snap_counts", y, refresh)) for y in (SEASON - 1, SEASON)], ignore_index=True)
    roster = pd.read_parquet(T.download("roster_weekly", SEASON, refresh))
    try:
        players = pd.read_parquet(T.download("players", 0, refresh), columns=["gsis_id", "pfr_id"])
        ids = players.dropna().drop_duplicates("gsis_id").set_index("gsis_id").pfr_id
        roster["pfr_id"] = roster.pfr_id.where(roster.pfr_id.notna(), roster.gsis_id.map(ids))
    except Exception:  # noqa: BLE001
        pass
    try:
        inj = pd.read_parquet(T.download("injuries", SEASON, refresh))
    except Exception:  # noqa: BLE001
        inj = pd.DataFrame(columns=["season", "week", "team", "gsis_id", "full_name", "report_status", "practice_status", "report_primary_injury", "date_modified", "game_type"])
    games = pd.read_csv("https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv")
    games = games[games.season.isin([SEASON - 1, SEASON])].copy()
    pbp = None
    if need_epa:
        cols = ["season", "week", "season_type", "game_id", "posteam", "defteam", "rush", "pass", "qb_dropback", "qb_kneel",
                "two_point_attempt", "play_type", "epa", "yards_gained", "sack"]
        pbp = pd.read_parquet(T.download("play_by_play", SEASON, refresh), columns=cols)
        pbp = pbp[pbp.season_type == "REG"]
    return snap, roster, inj, games, pbp


def player_index(roster, snap, snap_pos: dict, snap_names: dict) -> dict:
    """(desk team, norm name) -> ids and positions. Latest week wins.

    pfr ids come from the roster, then nflverse players, then the team's snap
    sheet by normalized name.
    """
    idx = {}
    by_snap_name = {}
    for _, p in snap.sort_values(["season", "week"]).iterrows():
        by_snap_name[(T.desk_abbr(p.team), T.norm_name(p.player))] = p.pfr_player_id
    r = roster.sort_values("week")
    for _, p in r.iterrows():
        key = (T.desk_abbr(p.team), T.norm_name(p.full_name))
        idx[key] = {
            "gsis_id": p.gsis_id, "pfr_id": p.pfr_id if isinstance(p.pfr_id, str) else None,
            "espn_id": str(p.espn_id) if p.espn_id == p.espn_id and p.espn_id is not None else "",
            "pos": p.position, "depth": p.depth_chart_position if isinstance(p.depth_chart_position, str) else "",
            "status": p.status, "name": p.full_name,
        }
        if not idx[key]["pfr_id"]:
            idx[key]["pfr_id"] = by_snap_name.get(key)
    for key, pfr in by_snap_name.items():
        idx.setdefault(key, {"gsis_id": "", "pfr_id": pfr, "espn_id": "", "pos": snap_pos.get(pfr), "depth": "", "status": "", "name": snap_names.get(pfr, "")})
    return idx


def epa_base(pbp, week: int) -> dict | None:
    """Shrunk season-to-date EPA per team before `week`."""
    if pbp is None:
        return None
    part = pbp[(pbp.week < week) & pbp.epa.notna()]
    runs = part[(part.rush == 1) & (part.qb_kneel != 1) & (part.two_point_attempt != 1) & (part.play_type == "run")]
    drops = part[(part.qb_dropback == 1) & (part.two_point_attempt != 1)]
    if runs.empty or drops.empty:
        return None
    lg_run = float(runs.epa.mean())
    lg_pass = float(drops.epa.mean())
    k = T.SHRINK_PLAYS

    def shrunk(frame, key, lg):
        g = frame.groupby(key).epa.agg(["sum", "count"])
        return {T.desk_abbr(t): float((row["sum"] + k * lg) / (row["count"] + k)) for t, row in g.iterrows()}

    return {
        "through_week": week - 1,
        "league_rush_epa": round(lg_run, 4),
        "league_pass_epa": round(lg_pass, 4),
        "run_d": shrunk(runs, "defteam", lg_run),
        "pass_d": shrunk(drops, "defteam", lg_pass),
        "run_o": shrunk(runs, "posteam", lg_run),
        "pass_o": shrunk(drops, "posteam", lg_pass),
    }


def health_index(team: str, priced: list[dict], base: dict | None) -> dict:
    d_rush = d_pass = ol_rush = ol_pass = 0.0
    for r in priced:
        g = r.get("group")
        pw = r["p_sits"] * r["w_snap"]
        if g in T.D_RUSH:
            d_rush += T.D_RUSH[g] * pw
            d_pass += T.D_PASS_F7 * pw
        elif g in T.D_OL_PASS:
            ol_rush += T.D_OL_RUSH * pw
            ol_pass += T.D_OL_PASS[g] * pw
    out = {
        "f7_rush_epa_delta": round(d_rush, 4),
        "f7_pass_epa_delta": round(d_pass, 4),
        "ol_rush_epa_delta": round(-ol_rush, 4),
        "ol_pass_epa_delta": round(-ol_pass, 4),
        "f7_points_epa_form": round(d_rush * T.RUSHES_PER_GAME + d_pass * T.DROPBACKS_PER_GAME, 3),
        "ol_points_epa_form": round(ol_rush * T.RUSHES_PER_GAME + ol_pass * T.DROPBACKS_PER_GAME, 3),
    }
    if base:
        rd = base["run_d"].get(team)
        pd_ = base["pass_d"].get(team)
        ro = base["run_o"].get(team)
        po = base["pass_o"].get(team)
        out.update({
            "run_d_base": None if rd is None else round(rd, 4),
            "RDA": None if rd is None else round(rd + d_rush, 4),
            "pass_d_base": None if pd_ is None else round(pd_, 4),
            "PDA": None if pd_ is None else round(pd_ + d_pass, 4),
            "run_o_base": None if ro is None else round(ro, 4),
            "ORA": None if ro is None else round(ro - ol_rush, 4),
            "pass_o_base": None if po is None else round(po, 4),
            "OPA": None if po is None else round(po - ol_pass, 4),
        })
    return out


RESERVE_CODES = {"R01": "IR", "R48": "IR", "R04": "PUP", "R05": "NFI", "R27": "NFI"}
DESK_POS = {"QB": "QB1", "RB": "RB1", "FB": "RB1", "WR": "WR1", "TE": "TE1", "T": "RT", "OT": "RT", "G": "OG", "OG": "OG",
            "C": "C", "DT": "IDL", "NT": "IDL", "DL": "IDL", "DE": "EDGE1", "OLB": "EDGE1", "LB": "LB", "ILB": "LB",
            "MLB": "LB", "CB": "CB1", "S": "S", "FS": "S", "SS": "S", "DB": "S", "K": "K", "P": "DEPTH", "LS": "DEPTH"}


def reconstructed_rows(team, week, inj_all, roster, pidx, share_map, snap_pos) -> list[dict]:
    """Desk-style rows for a past team-week that has no lock file.

    Official final report (Out / Doubtful / Questionable) plus the reserve list
    (IR / PUP / NFI). Impact is the desk clamp: 1.5 for the QB1, 0.25 at a 60%+
    trailing snap share, 0.20 otherwise. Questionable rows are on.
    """
    rows = []
    seen = set()
    part = inj_all[(inj_all.get("week") == week)] if len(inj_all) else inj_all
    qb_best = None
    qbs = [(sh, pid) for pid, sh in share_map.items() if snap_pos.get(pid) == "QB"]
    if qbs:
        sh, pid = max(qbs)
        qb_best = pid if sh >= 0.5 else None
    for _, r in part.iterrows():
        if T.desk_abbr(r.team) != team:
            continue
        st = str(r.get("report_status") or "").strip().upper()
        if st not in {"OUT", "DOUBTFUL", "QUESTIONABLE"}:
            continue
        nk = T.norm_name(r.full_name)
        seen.add(nk)
        pid = (pidx.get((team, nk)) or {}).get("pfr_id")
        sh = share_map.get(pid, 0.0) if pid else 0.0
        pos = DESK_POS.get(str(r.position or "").upper(), "DEPTH")
        impact = 1.5 if (pid and pid == qb_best) else (0.25 if sh >= 0.6 else 0.2)
        rows.append({"name": r.full_name, "pos": "QB1" if impact == 1.5 else pos, "status": st, "impact": impact, "on": True,
                     "impact_source": "reconstructed"})
    wk = roster[(roster.week == week)]
    for _, r in wk.iterrows():
        if T.desk_abbr(r.team) != team or r.status != "RES" or r.status_description_abbr not in RESERVE_CODES:
            continue
        nk = T.norm_name(r.full_name)
        if nk in seen:
            continue
        seen.add(nk)
        pid = (pidx.get((team, nk)) or {}).get("pfr_id")
        sh = share_map.get(pid, 0.0) if pid else 0.0
        pos = DESK_POS.get(str(r.depth_chart_position or r.position or "").upper(), "DEPTH")
        rows.append({"name": r.full_name, "pos": pos, "status": RESERVE_CODES[r.status_description_abbr],
                     "impact": 0.25 if sh >= 0.6 else 0.2, "on": True, "impact_source": "reconstructed"})
    return rows


def practice_from_log(existing: dict, key) -> tuple[dict, str | None]:
    row = existing.get(key) or {}
    days = {c: row.get(c, "") for c in PRACTICE_COLS}
    final = None
    for c in reversed(PRACTICE_COLS):
        code = T.practice_code(days.get(c))
        if code != "unknown":
            final = code
            break
    return days, final


def build_week(week: int, rows_mode: str = "seed", refresh: bool = False, need_epa: bool = True, frozen: bool = False,
               extra_lock_dirs: list[Path] | None = None) -> dict:
    nfl = load_json(T.DATA / "nfl-2026.json")
    scale = load_json(T.DATA / "injury-scale.json")
    allpro = {T.norm_name(n) for p in (load_json(T.DATA / "allpro-last3.json").get("players") or [])
              for n in ([p.get("name")] + list(p.get("names") or [])) if n}
    slate = week_slate(nfl, week)
    snap, roster, inj, games, pbp = load_nflverse(week, refresh, need_epa)
    shares, snap_pos, snap_names = T.trailing_shares(snap, games, SEASON)
    gids = nflverse_game_ids(games, week)
    pidx = player_index(roster, snap, snap_pos, snap_names)
    base = epa_base(pbp, week)
    seed = load_json(T.DATA / "injury-2026.json")
    locks = lock_rows(week, extra_lock_dirs) if rows_mode == "locks" else {}

    inj_all = inj
    inj = inj[(inj.get("season") == SEASON) & (inj.get("week") == week)] if len(inj) else inj
    nfl_final = {}
    for _, r in inj.iterrows():
        status = r.get("report_status")
        stamp = r.get("date_modified")
        when = ""
        if stamp is not None and stamp == stamp:
            try:
                import pandas as pd

                when = pd.Timestamp(stamp).tz_convert(ET).strftime("%Y-%m-%d %H:%M ET")
            except Exception:  # noqa: BLE001
                when = str(stamp)[:16]
        injury = r.get("report_primary_injury")
        nfl_final[(T.desk_abbr(r.team), T.norm_name(r.full_name))] = {
            "status": str(status).strip() if isinstance(status, str) else "",
            "practice": T.practice_code(r.get("practice_status")),
            "injury": injury if isinstance(injury, str) else "",
            "time": when,
        }

    existing = {(int(r["week"]), r["team"], T.norm_name(r["player"])): r for r in read_csv(PLAYERS_CSV)}
    roster_week = min(week, int(roster.week.max())) if len(roster) else week
    on_roster = {
        (T.desk_abbr(r.team), T.norm_name(r.full_name))
        for _, r in roster[(roster.week == roster_week) & roster.status.isin(["ACT", "INA", "RES", "EXE"])].iterrows()
    }

    teams_out = {}
    player_rows = []
    for team in sorted(slate):
        info = slate[team]
        gid = gids.get(team)
        share_map = shares.get((team, gid), {}) if gid else {}
        if rows_mode == "locks" and team in locks:
            raw_rows, row_source, pulled = locks[team]
        elif rows_mode == "locks":
            # Past week with no lock file: rebuild the desk rows from the official final report.
            raw_rows = reconstructed_rows(team, week, inj_all, roster, pidx, share_map, snap_pos)
            row_source, pulled = "reconstructed from nflverse final report + reserve list (no lock file)", None
        else:
            raw_rows, row_source, pulled = (seed.get("teams") or {}).get(team, []), "data/injury-2026.json", seed.get("pulled")
        priced = []
        for raw in raw_rows:
            name = raw.get("name") or ""
            nk = T.norm_name(name)
            ident = pidx.get((team, nk)) or {}
            pfr = ident.get("pfr_id")
            share = share_map.get(pfr, 0.0) if pfr else None
            pfr_pos = snap_pos.get(pfr) if pfr else None
            group = T.group_of(pfr_pos, ident.get("depth"), ident.get("pos"), raw.get("pos"))
            status = str(raw.get("status") or "").upper()
            days, log_final = practice_from_log(existing, (week, team, nk))
            nf = nfl_final.get((team, nk)) or {}
            practice = log_final or nf.get("practice") or "unknown"
            practice_src = "daily log" if log_final else ("nflverse final" if nf.get("practice") else "none yet")
            lp = T.live_row_pts(raw, scale, allpro)
            on = T.live_on(raw)
            pr = T.proposed_row(group, status, practice, share) if group in T.UNIT_OF else None
            row = {
                "name": name,
                "pos_desk": raw.get("pos"),
                "pos_nfl": pfr_pos or ident.get("depth") or ident.get("pos") or "",
                "group": group if group in T.UNIT_OF else None,
                "unit": T.UNIT_OF.get(group or "", "OTHER"),
                "status": status,
                "nfl_final_status": nf.get("status", ""),
                "practice": practice,
                "practice_days": {k.split("_")[0]: v for k, v in days.items() if v},
                "practice_source": practice_src,
                "share": None if share is None else round(share, 4),
                "share_source": "nflverse snap_counts trailing 4" if share is not None else "no nflverse match",
                "live": {
                    "value": raw.get("impact") if raw.get("impact") not in (None, "") else None,
                    "mult": float((scale.get("status") or {}).get(status, T.LIVE_MULT.get(status, 0.0))),
                    "on": on,
                    "pts": round(lp if on else 0.0, 3),
                    "manual": raw.get("impact_source") == "manual",
                },
            }
            if pr:
                row.update({"p_sits": pr["p_sits"], "pos_value": pr["pos_value"], "w_snap": pr["w_snap"], "pts": pr["pts"]})
            else:
                row.update({"p_sits": None, "pos_value": None, "w_snap": None, "pts": round(lp if on else 0.0, 3)})
            priced.append(row)
        calc = T.price_team([
            {"group": r["group"], "status": r["status"], "practice": r["practice"], "share": r["share"] or 0.0,
             "live_pts": r["live"]["pts"], "live_on": True}
            for r in priced
        ])
        trench = [r for r in priced if r["group"]]
        idx = health_index(team, [{"group": r["group"], "p_sits": r["p_sits"], "w_snap": r["w_snap"]} for r in trench], base)
        idx["F7HI"] = calc["proposed"]["front_seven"]["total"]
        idx["OLHI"] = calc["proposed"]["ol"]["total"]
        teams_out[team] = {
            "opp": info["opp"], "home_away": info["home_away"], "espn_id": info["espn_id"], "game_id": gid,
            "rows_source": row_source, "rows_pulled": pulled,
            "rows": priced, "live": calc["live"], "proposed": calc["proposed"], "index": idx,
        }

        # players-2026.csv: designated rows + every F7/OL player at 30%+ trailing share
        seen = set()
        for r in priced:
            if not r["group"]:
                continue
            nk = T.norm_name(r["name"])
            seen.add(nk)
            ident = pidx.get((team, nk)) or {}
            prev = existing.get((week, team, nk)) or {}
            nf = nfl_final.get((team, nk)) or {}
            player_rows.append({**{c: prev.get(c, "") for c in PLAYER_FIELDS}, **{
                "season": SEASON, "week": week, "game_id": gid or "", "espn_event_id": info["espn_id"], "team": team,
                "opp": info["opp"], "player": r["name"], "gsis_id": ident.get("gsis_id") or "", "pfr_id": ident.get("pfr_id") or "",
                "espn_id": ident.get("espn_id") or "", "pos_listed": r["pos_desk"] or "", "unit": T.UNIT_OF[r["group"]],
                "group": T.GROUP_LABEL[r["group"]], "depth_slot": ident.get("depth") or "",
                "trail4_snap_pct": fmt(r["share"]), "starter_flag": fmt((r["share"] or 0) >= 0.60), "w_snap": fmt(r["w_snap"]),
                "injury": prev.get("injury") or nf.get("injury", ""),
                "final_designation": nf.get("status") or ("IR" if r["status"] == "IR" else r["status"].title()),
                "designation_time_et": prev.get("designation_time_et") or nf.get("time", ""),
                "final_practice": r["practice"], "p_sits": fmt(r["p_sits"]), "pos_value": fmt(r["pos_value"]),
                "proposed_pts": fmt(r["pts"]), "desk_status": r["status"], "desk_on": fmt(r["live"]["on"]),
                "desk_p_miss": fmt(r["live"]["mult"]), "desk_pts": fmt(r["live"]["pts"]),
                "source": row_source,
            }})
        if gid:
            for pfr, sh in share_map.items():
                pos = snap_pos.get(pfr)
                g = T.group_of(pos)
                if g not in T.UNIT_OF or sh < 0.30:
                    continue
                name = snap_names.get(pfr, "")
                nk = T.norm_name(name)
                if nk in seen or (team, nk) not in on_roster:
                    continue
                seen.add(nk)
                ident = pidx.get((team, nk)) or {}
                prev = existing.get((week, team, nk)) or {}
                nf = nfl_final.get((team, nk)) or {}
                status = (nf.get("status") or "").upper()
                practice = practice_from_log(existing, (week, team, nk))[1] or nf.get("practice") or ""
                pr = T.proposed_row(g, status, practice or "unknown", sh) if status else None
                player_rows.append({**{c: prev.get(c, "") for c in PLAYER_FIELDS}, **{
                    "season": SEASON, "week": week, "game_id": gid, "espn_event_id": info["espn_id"], "team": team,
                    "opp": info["opp"], "player": name, "gsis_id": ident.get("gsis_id") or "", "pfr_id": pfr,
                    "espn_id": ident.get("espn_id") or "", "pos_listed": pos or "", "unit": T.UNIT_OF[g], "group": T.GROUP_LABEL[g],
                    "depth_slot": ident.get("depth") or "", "trail4_snap_pct": fmt(sh), "starter_flag": fmt(sh >= 0.60),
                    "w_snap": fmt(T.snap_weight(sh)), "injury": prev.get("injury") or nf.get("injury", ""),
                    "final_designation": nf.get("status") or "none", "designation_time_et": prev.get("designation_time_et") or nf.get("time", ""),
                    "final_practice": practice, "p_sits": fmt(pr["p_sits"]) if pr else "0",
                    "pos_value": fmt(T.POS_VALUE[g]), "proposed_pts": fmt(pr["pts"]) if pr else "0",
                    "desk_status": "", "desk_on": "", "desk_p_miss": "", "desk_pts": "",
                    "source": "nflverse snap_counts (not on desk injury list)",
                }})

    payload = {
        "schema": 1,
        "season": SEASON,
        "week": week,
        "generated_et": now_et(),
        "frozen": frozen,
        "shadow": True,
        "in_b_line": False,
        "note": (
            "Shadow trench injury index. Not an input to eff() or the B$ line. 'live' is the desk's current "
            "injury pricing (injury-scale.json). 'proposed' re-prices front-seven and OL rows from the 2026-10-06 study."
        ),
        "rules": {
            "pos_value": T.POS_VALUE,
            "snap_weight": {">=0.75": 1.0, "0.60-0.75": 0.75, "0.45-0.60": 0.25, "<0.45": 0.0},
            "p_sits": {"OUT/DOUBTFUL/IR/PUP/NFI": 1.0, "Q+DNP": 0.45, "Q+LP": 0.24, "Q+FP": 0.12, "Q unknown": 0.27},
            "cluster": {"bonus": T.CLUSTER_BONUS, "min_starters": T.CLUSTER_MIN, "starter": "w_snap >= 0.75 and P(sits) >= 0.5"},
            "caps": {"front_seven": T.UNIT_CAP, "ol": T.UNIT_CAP, "team": T.TEAM_CAP},
            "live": {"status": dict(scale.get("status") or T.LIVE_MULT), "cap_player": {"QB1": 1.5, "All-Pro": 0.5, "other": 0.25}, "floor": 0.2, "team_cap": T.TEAM_CAP},
            "short_week": "no shading",
            "quality_adj": 1.0,
        },
        "epa_base": None if not base else {k: base[k] for k in ("through_week", "league_rush_epa", "league_pass_epa")},
        "teams": teams_out,
    }
    return {"payload": payload, "player_rows": player_rows}


def write_week(result: dict) -> Path:
    payload = result["payload"]
    week = payload["week"]
    path = HERE / f"health-{SEASON}-w{week:02d}.json"
    path.write_text(json.dumps(payload, indent=1, ensure_ascii=False) + "\n")

    # players CSV: replace this week's rows, keep every other week
    keep = [r for r in read_csv(PLAYERS_CSV) if int(r.get("week") or 0) != week]
    rows = keep + result["player_rows"]
    rows.sort(key=lambda r: (int(r["week"]), r["team"], r["unit"], r["player"]))
    write_csv(PLAYERS_CSV, PLAYER_FIELDS, rows)

    # team-games CSV: upsert the pre-game columns, keep post-game columns
    teams = read_csv(TEAMS_CSV)
    by_key = {(int(r["week"]), r["team"]): r for r in teams}
    prows = [r for r in result["player_rows"]]
    for team, t in payload["teams"].items():
        cur = by_key.get((week, team)) or {c: "" for c in TEAM_FIELDS}
        starters = [r for r in prows if r["team"] == team and r["starter_flag"] == "1"]

        def esum(group_labels):
            s = 0.0
            for r in starters:
                if r["group"] in group_labels and r.get("p_sits"):
                    s += float(r["p_sits"])
            return fmt(s)

        cur.update({
            "season": SEASON, "week": week, "game_id": t["game_id"] or "", "espn_event_id": t["espn_id"], "team": team,
            "opp": t["opp"], "home_away": t["home_away"],
            "f7_starters_expected_missing": esum({"DL", "EDGE", "LB"}), "dl_starters_expected_missing": esum({"DL"}),
            "edge_starters_expected_missing": esum({"EDGE"}), "lb_starters_expected_missing": esum({"LB"}),
            "ol_starters_expected_missing": esum({"T", "G/C"}),
            "F7HI": fmt(t["proposed"]["front_seven"]["total"]), "OLHI": fmt(t["proposed"]["ol"]["total"]),
            "f7_cluster": fmt(t["proposed"]["front_seven"]["cluster"]), "ol_cluster": fmt(t["proposed"]["ol"]["cluster"]),
            "live_injury_pts": fmt(t["live"]["total"]), "proposed_injury_pts": fmt(t["proposed"]["total"]),
            "proposed_minus_live": fmt(t["proposed"]["total"] - t["live"]["total"]),
        })
        by_key[(week, team)] = cur
    out = sorted(by_key.values(), key=lambda r: (int(r["week"]), r["team"]))
    write_csv(TEAMS_CSV, TEAM_FIELDS, out)

    idx = load_json(INDEX) if INDEX.exists() else {"season": SEASON, "weeks": {}}
    idx["weeks"][str(week)] = {
        "file": path.name, "generated_et": payload["generated_et"], "frozen": payload["frozen"],
    }
    idx["latest_week"] = max(int(w) for w in idx["weeks"])
    idx["updated_et"] = payload["generated_et"]
    idx["note"] = "Shadow trench injury index. Not an input to eff() or the B$ line."
    INDEX.write_text(json.dumps(idx, indent=1) + "\n")
    return path


def main() -> None:
    ap = argparse.ArgumentParser(description="Shadow trench health index (not in the B$ line).")
    ap.add_argument("--week", type=int, help="Week to build. Default: first week with a game not FINAL.")
    ap.add_argument("--rows", choices=["seed", "locks"], default="seed",
                    help="seed = data/injury-2026.json (nightly). locks = the week's lock files (frozen, past weeks).")
    ap.add_argument("--refresh", action="store_true", help="Re-download nflverse inputs.")
    ap.add_argument("--no-epa", action="store_true", help="Skip the pbp download and the RDA/PDA/ORA numbers.")
    ap.add_argument("--force", action="store_true", help="Allow overwriting a frozen (locked) week file.")
    ap.add_argument("--extra-locks", action="append", default=[], help="Another locks folder; a lock there wins when its injury stamp is newer.")
    args = ap.parse_args()
    nfl = load_json(T.DATA / "nfl-2026.json")
    week = args.week or current_week(nfl)
    frozen_file = HERE / f"health-{SEASON}-w{week:02d}.json"
    if frozen_file.exists() and args.rows == "seed" and not args.force:
        try:
            if load_json(frozen_file).get("frozen"):
                print(f"{frozen_file.name} is frozen (built from lock files). Not overwriting. Use --force to rebuild.")
                return
        except Exception:  # noqa: BLE001
            pass
    result = build_week(week, rows_mode=args.rows, refresh=args.refresh, need_epa=not args.no_epa, frozen=args.rows == "locks",
                        extra_lock_dirs=[Path(p) for p in args.extra_locks])
    path = write_week(result)
    teams = result["payload"]["teams"]
    moved = sorted(teams.items(), key=lambda kv: -abs(kv[1]["proposed"]["total"] - kv[1]["live"]["total"]))[:6]
    print(f"wrote {path.relative_to(T.DATA.parent)} ({len(teams)} teams, shadow only)")
    for team, t in moved:
        print(f"  {team}: live {t['live']['total']:.2f}  proposed {t['proposed']['total']:.2f}  "
              f"F7HI {t['index']['F7HI']:.2f}  OLHI {t['index']['OLHI']:.2f}")


if __name__ == "__main__":
    main()

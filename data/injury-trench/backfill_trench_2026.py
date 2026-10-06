#!/usr/bin/env python3
"""One-time backfill of the shadow trench logs for 2026 Weeks 1-4. NOT in the B$ line.

    python3 data/injury-trench/backfill_trench_2026.py
    python3 data/injury-trench/backfill_trench_2026.py --weeks 1 2 3 4 --extra-locks ../nfl-scout/desk/data/postmortem/locks

For each week it prices the rows the desk actually locked (data/postmortem/locks;
teams without a lock file are rebuilt from the official final report), writes
health-2026-wNN.json (frozen), then fills the post-game columns:

- players-2026.csv: active / played / snaps / snap_pct / in-game exit from nflverse
  snap_counts and weekly rosters. When nflverse has not published a game's snaps
  (ATL@NO W4 as of 2026-10-06), the ESPN game roster from the study folder is used
  for active/started, and the snap columns stay blank.
- team-games-2026.csv: run and pass outcomes from nflverse pbp, final score, the
  locked B$ line, the street open and close (data/lines/line-history-2026.json),
  ATS vs B$ and vs close, CLV, and ticket ids.

The NO Week 4 daily practice grid comes from the official Saints report compiled
in the study's atl-no-tape-notes.md. nflverse keeps only the final practice day.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import compute_trench_health as C  # noqa: E402
import trench_lib as T  # noqa: E402

STUDY = Path("/workspace/injury-trench-study")

# Official Saints MNF-week report (Thu/Fri/Sat), from atl-no-tape-notes.md.
NO_W4_PRACTICE = {
    "Carl Granderson": ("DNP", "DNP", "DNP"),
    "Kaden Elliss": ("DNP", "DNP", "DNP"),
    "Anfernee Jennings": ("DNP", "DNP", "DNP"),
    "Pete Werner": ("DNP", "DNP", "DNP"),
    "Christen Miller": ("LP", "LP", "FP"),
    "Davon Godchaux": ("", "DNP", "FP"),
}
GAME_NOTES = {
    (4, "ATL", "Jake Matthews"): ("1", "Q1", "Left after 11 snaps (groin), Michael Jerrell in. NFL.com via tape notes."),
    (4, "NO", "Davon Godchaux"): ("1", "Q4", "Started, left in Q4 (groin). Tape notes."),
}


def fnum(v):
    try:
        x = float(v)
    except (TypeError, ValueError):
        return None
    return x if x == x else None


def postgame_players(weeks: list[int]) -> None:
    import pandas as pd

    snap = pd.read_parquet(T.download("snap_counts", C.SEASON))
    snap["team"] = snap.team.map(T.desk_abbr)
    roster = pd.read_parquet(T.download("roster_weekly", C.SEASON))
    roster["team"] = roster.team.map(T.desk_abbr)
    status = {(int(r.week), r.team, T.norm_name(r.full_name)): r.status for _, r in roster.iterrows()}
    have_games = set(snap.game_id.unique())
    snaps = {}
    for _, s in snap.iterrows():
        snaps[(s.game_id, s.team, s.pfr_player_id)] = s
        snaps[(s.game_id, s.team, "name:" + T.norm_name(s.player))] = s
    espn = {}
    for team in ("ATL", "NO"):
        path = STUDY / "raw" / f"espn_gameroster_{team}.csv"
        if path.exists():
            with path.open() as fh:
                for r in csv.DictReader(fh):
                    espn[(4, team, T.norm_name(r["name"]))] = r

    rows = C.read_csv(C.PLAYERS_CSV)
    for r in rows:
        week = int(r["week"])
        if week not in weeks:
            continue
        team = r["team"]
        nk = T.norm_name(r["player"])
        if week == 4 and team == "NO" and r["player"] in NO_W4_PRACTICE:
            r["thu_practice"], r["fri_practice"], r["sat_practice"] = NO_W4_PRACTICE[r["player"]]
            r["notes"] = (r.get("notes") or "") + " Thu/Fri/Sat from the official Saints report (tape notes)."
        st = status.get((week, team, nk))
        gid = r["game_id"]
        is_ol = r["unit"] == "OL"
        if gid in have_games:
            s = snaps.get((gid, team, r.get("pfr_id")))
            if s is None:
                s = snaps.get((gid, team, "name:" + nk))
            if s is not None:
                n = fnum(s.offense_snaps if is_ol else s.defense_snaps) or 0.0
                pct = fnum(s.offense_pct if is_ol else s.defense_pct) or 0.0
            else:
                n, pct = 0.0, 0.0
            r["snaps"] = C.fmt(n)
            r["snap_pct"] = C.fmt(pct)
            r["played_flag"] = "1" if n > 0 else "0"
            r["active_flag"] = "1" if (n > 0 or st == "ACT") else ("0" if st in {"INA", "RES"} else "")
            starter = r.get("starter_flag") == "1"
            r["in_game_exit_flag"] = "1" if (starter and n > 0 and pct < 0.5) else "0"
            r["source"] = (r.get("source") or "") + " | game day: nflverse snap_counts + weekly_rosters"
        else:
            e = espn.get((week, team, nk))
            if e is not None:
                r["active_flag"] = "0" if e.get("dnp") == "True" else "1"
                r["started"] = "1" if e.get("starter") == "True" else "0"
            elif st:
                r["active_flag"] = "1" if st == "ACT" else ("0" if st in {"INA", "RES"} else "")
            r["notes"] = ((r.get("notes") or "") + " Snaps not published by nflverse yet; active/started from the ESPN game roster.").strip()
        note = GAME_NOTES.get((week, team, r["player"]))
        if note:
            r["in_game_exit_flag"], r["exit_quarter"], extra = note
            r["notes"] = ((r.get("notes") or "") + " " + extra).strip()
    C.write_csv(C.PLAYERS_CSV, C.PLAYER_FIELDS, rows)


def postgame_teams(weeks: list[int], extra_lock_dirs: list[Path]) -> None:
    import pandas as pd

    pbp = pd.read_parquet(T.download("play_by_play", C.SEASON), columns=[
        "season", "week", "season_type", "game_id", "posteam", "defteam", "rush", "qb_dropback", "qb_kneel",
        "two_point_attempt", "play_type", "epa", "yards_gained", "sack"])
    pbp = pbp[(pbp.season_type == "REG") & pbp.epa.notna()].copy()
    pbp["posteam"] = pbp.posteam.map(T.desk_abbr)
    pbp["defteam"] = pbp.defteam.map(T.desk_abbr)
    runs = pbp[(pbp.rush == 1) & (pbp.qb_kneel != 1) & (pbp.two_point_attempt != 1) & (pbp.play_type == "run")]
    drops = pbp[(pbp.qb_dropback == 1) & (pbp.two_point_attempt != 1)]
    games = pd.read_csv("https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv")
    games = games[(games.season == C.SEASON)]
    score = {}
    nfl_close = {}
    for _, g in games.iterrows():
        if g.spread_line == g.spread_line:
            nfl_close[g.game_id] = -float(g.spread_line)
        if g.home_score == g.home_score:
            score[g.game_id] = (T.desk_abbr(g.home_team), float(g.home_score), T.desk_abbr(g.away_team), float(g.away_score))

    finals = C.load_json(T.DATA / "published" / "finals.json").get("board") or []
    bs_final = {str(b.get("espn_id")): (fnum(b.get("b_line_home_spread")), "data/published/finals.json") for b in finals}
    locks = {}
    dirs = [T.DATA / "postmortem" / "locks"] + list(extra_lock_dirs)
    for folder in dirs:
        for path in sorted(Path(folder).glob(f"{C.SEASON}-w0*-*.json")):
            try:
                d = C.load_json(path)
            except Exception:  # noqa: BLE001
                continue
            if not d.get("espn_id") or d.get("model_home_spread") is None:
                continue
            stamp = str((d.get("feature_stack") or {}).get("injury_pulled") or "")
            prev = locks.get(str(d["espn_id"]))
            if prev is None or stamp > prev[2]:
                locks[str(d["espn_id"])] = (fnum(d["model_home_spread"]), path.name, stamp)
    history = {}
    for g in (C.load_json(T.DATA / "lines" / "line-history-2026.json").get("games") or []):
        snaps = g.get("snapshots") or []
        opens = [s for s in snaps if s.get("tag") == "open"]
        closes = [s for s in snaps if s.get("tag") == "close"]
        history[str(g.get("espn_id"))] = (
            fnum(opens[0]["home_spread"]) if opens else None,
            fnum(closes[-1]["home_spread"]) if closes else None,
        )
    tickets = C.load_json(T.DATA / "tickets-2026.json").get("tickets") or []

    def run_stats(frame):
        if frame.empty:
            return {}
        return {
            "att": len(frame), "yds": float(frame.yards_gained.sum()), "ypc": float(frame.yards_gained.mean()),
            "epa": float(frame.epa.mean()), "success": float((frame.epa > 0).mean()), "explosive": float((frame.yards_gained >= 10).mean()),
        }

    players = C.read_csv(C.PLAYERS_CSV)
    rows = C.read_csv(C.TEAMS_CSV)
    for r in rows:
        week = int(r["week"])
        if week not in weeks:
            continue
        team, gid, eid = r["team"], r["game_id"], r["espn_event_id"]
        o = run_stats(runs[(runs.game_id == gid) & (runs.posteam == team)])
        a = run_stats(runs[(runs.game_id == gid) & (runs.defteam == team)])
        for key, src in (("", o), ("_allowed", a)):
            if src:
                r["rush_att" + key] = src["att"]
                r["rush_yds" + key] = C.fmt(src["yds"], 0)
                r["ypc" + key] = C.fmt(src["ypc"], 2)
                r["rush_epa" + key] = C.fmt(src["epa"], 3)
                r["rush_success" + key] = C.fmt(src["success"], 3)
                r["rush_explosive" + key] = C.fmt(src["explosive"], 3)
        do = drops[(drops.game_id == gid) & (drops.posteam == team)]
        dd = drops[(drops.game_id == gid) & (drops.defteam == team)]
        if len(do):
            r["pass_epa"] = C.fmt(float(do.epa.mean()), 3)
            r["sack_rate"] = C.fmt(float(do.sack.mean()), 3)
        if len(dd):
            r["pass_epa_allowed"] = C.fmt(float(dd.epa.mean()), 3)
            r["sack_rate_forced"] = C.fmt(float(dd.sack.mean()), 3)
        r["ybc"] = ""
        r["pressure_rate"] = ""
        r["box_shift_flag"] = ""
        home = r["home_away"] == "home"
        bs, src = bs_final.get(eid, (None, ""))
        lk = locks.get(eid)
        if lk:
            r["model_line_home"] = C.fmt(lk[0], 2)
        if bs is None and lk and lk[0] is not None:
            bs = round(lk[0] * 2) / 2
            src = f"lock {lk[1]} model_home_spread rounded to 0.5 (README official rule from Week 4)"
        r["bs_line_lock_home"] = C.fmt(bs, 2) if bs is not None else ""
        r["bs_line_source"] = src
        op, cl = history.get(eid, (None, None))
        notes = []
        if cl is None and gid in nfl_close:
            cl = nfl_close[gid]
            notes.append("street close from nflverse games.csv spread_line (no close tag in line-history yet)")
        r["street_open_home"] = C.fmt(op, 2) if op is not None else ""
        r["street_close_home"] = C.fmt(cl, 2) if cl is not None else ""
        sc = score.get(gid)
        if sc:
            h, hs, aw, as_ = sc
            ts, os_ = (hs, as_) if home else (as_, hs)
            margin = ts - os_
            r["team_score"], r["opp_score"], r["margin"] = C.fmt(ts, 0), C.fmt(os_, 0), C.fmt(margin, 0)

            def ats(home_line):
                if home_line is None:
                    return ""
                line = home_line if home else -home_line
                return C.fmt(margin + line, 2)

            r["ats_vs_bs"] = ats(bs)
            r["ats_vs_close"] = ats(cl)
            if bs is not None and op is not None and cl is not None:
                if abs(op - cl) < 1e-9:
                    r["clv_vs_bs"] = "no move"
                else:
                    r["clv_vs_bs"] = "toward" if abs(cl - bs) < abs(op - bs) else "away"
        mine = [p for p in players if int(p["week"]) == week and p["team"] == team]
        def is_missing(p):
            return p.get("active_flag") == "0" or p.get("played_flag") == "0"
        starters = [p for p in mine if p.get("starter_flag") == "1"]
        rot = [p for p in mine if p.get("starter_flag") != "1" and (fnum(p.get("trail4_snap_pct")) or 0) >= 0.30]
        f7 = {"DL", "EDGE", "LB"}
        if any(p.get("active_flag") or p.get("played_flag") for p in mine):
            r["f7_starters_missing_actual"] = sum(1 for p in starters if p["group"] in f7 and is_missing(p))
            r["ol_starters_missing_actual"] = sum(1 for p in starters if p["group"] not in f7 and is_missing(p))
            r["f7_rotational_missing"] = sum(1 for p in rot if p["group"] in f7 and is_missing(p))
            r["ol_rotational_missing"] = sum(1 for p in rot if p["group"] not in f7 and is_missing(p))
            r["f7_exits"] = sum(1 for p in starters if p["group"] in f7 and p.get("in_game_exit_flag") == "1")
            r["ol_exits"] = sum(1 for p in starters if p["group"] not in f7 and p.get("in_game_exit_flag") == "1")
        if notes:
            r["notes"] = "; ".join(notes)
        ids = [t["id"] for t in tickets if int(t.get("week") or 0) == week and team in str(t.get("game") or "").replace("@", " ").split()]
        r["tickets"] = ";".join(ids)
    C.write_csv(C.TEAMS_CSV, C.TEAM_FIELDS, rows)


def main() -> None:
    ap = argparse.ArgumentParser(description="Backfill shadow trench logs for 2026 Weeks 1-4.")
    ap.add_argument("--weeks", type=int, nargs="+", default=[1, 2, 3, 4])
    ap.add_argument("--extra-locks", action="append", default=[], help="Local locks folder; newer injury stamp wins.")
    args = ap.parse_args()
    extra = [Path(p) for p in args.extra_locks]
    for week in args.weeks:
        res = C.build_week(week, rows_mode="locks", need_epa=True, frozen=True, extra_lock_dirs=extra)
        print("wrote", C.write_week(res).name)
    postgame_players(args.weeks)
    postgame_teams(args.weeks, extra)
    print("filled post-game columns in players-2026.csv and team-games-2026.csv")


if __name__ == "__main__":
    main()

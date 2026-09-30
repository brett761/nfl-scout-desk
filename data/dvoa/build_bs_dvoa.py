#!/usr/bin/env python3
"""B$ DVOA shadow ratings and ATS factor chips.

Shadow only. This script does not read or write the B$ line, eff(), or
power rankings.

Weekly (Tuesday, after the nflverse overnight update, before the 11:16 AM ET
power-rankings run):

    python3 data/dvoa/build_bs_dvoa.py --week 4

That replaces the Week 4 block in data/dvoa/bs-dvoa-2026.json and
data/dvoa/factors-2026.json. Ratings for week W use only plays from weeks
before W, plus the prior season.

Sanity check against the research headline (2024-25 MAE):

    python3 data/dvoa/build_bs_dvoa.py --backtest

Settings are frozen from the 2021-2023 fit in the Sep 29, 2026 research note.
Do not refit them on 2024-2026.
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
CACHE = Path(__file__).resolve().parent / ".cache"
DVOA_JSON = Path(__file__).resolve().parent / "bs-dvoa-2026.json"
FACTOR_JSON = Path(__file__).resolve().parent / "factors-2026.json"
FIT_JSON = Path(__file__).resolve().parent / "factor-fit.json"
BACKTEST_JSON = Path(__file__).resolve().parent / "backtest-summary.json"

# Frozen on 2021-2023. See data/dvoa/README.md.
P = dict(decay=0.9, pw=0.2, alpha=200.0, lo=0.1, hi=0.9, garbage=0.25)
B_EPA = 15.99
B_SR = 93.63
HFA = 2.12

SITE = {"LA": "LAR", "WAS": "WSH", "WFT": "WSH"}
PBP_URL = "https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_{y}.parquet"
PFR_URL = "https://github.com/nflverse/nflverse-data/releases/download/pfr_advstats/advstats_week_pass_{y}.parquet"
GAMES_URL = "https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv"

PBP_COLS = [
    "game_id", "season", "week", "season_type", "posteam", "defteam", "home_team", "away_team",
    "pass", "rush", "qb_dropback", "epa", "success", "wp", "down", "yards_gained",
    "qb_kneel", "qb_spike", "two_point_attempt", "fumble", "fumble_lost", "interception",
    "sack", "qb_hit", "special_teams_play", "play_type", "yardline_100", "fixed_drive",
    "fixed_drive_result",
]


def site_abbr(team: str) -> str:
    t = str(team or "").upper()
    return SITE.get(t, t)


def now_et() -> str:
    return datetime.now(ZoneInfo("America/New_York")).isoformat(timespec="seconds")


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return
    print(f"download {url}", flush=True)
    req = urllib.request.Request(url, headers={"User-Agent": "bmoneybets-bs-dvoa"})
    with urllib.request.urlopen(req, timeout=180) as res:
        dest.write_bytes(res.read())


def ensure_inputs(seasons: list[int]) -> None:
    CACHE.mkdir(parents=True, exist_ok=True)
    download(GAMES_URL, CACHE / "games.csv")
    for y in seasons:
        download(PBP_URL.format(y=y), CACHE / f"play_by_play_{y}.parquet")
        download(PFR_URL.format(y=y), CACHE / f"advstats_week_pass_{y}.parquet")


def load_pbp(season: int) -> pd.DataFrame:
    p = pd.read_parquet(CACHE / f"play_by_play_{season}.parquet", columns=PBP_COLS)
    return p[p.season_type == "REG"].copy()


def prep_scrimmage(p: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """EPA/success plays plus special-teams EPA, matching the research POC."""
    sc = p[(p["pass"] == 1) | (p["rush"] == 1)]
    sc = sc[sc.epa.notna() & sc.posteam.notna() & sc.defteam.notna()]
    sc = sc[(sc.qb_kneel != 1) & (sc.qb_spike != 1) & (sc.two_point_attempt != 1)].copy()
    fmean = float(sc.loc[sc.fumble == 1, "epa"].mean()) if (sc.fumble == 1).any() else 0.0
    sc["epa_adj"] = np.where(sc.fumble == 1, fmean, sc.epa)
    sc["success"] = sc["success"].astype(float)
    sc["home"] = (sc.posteam == sc.home_team).astype(float)
    db = sc.qb_dropback == 1
    sc["explosive"] = ((db & (sc.yards_gained >= 20)) | (~db & (sc.yards_gained >= 10))).astype(float)
    st = p[(p.special_teams_play == 1) & p.epa.notna() & p.posteam.notna()]
    st = st[st.play_type.isin(["kickoff", "punt", "field_goal", "extra_point"])]
    grouped = st.groupby(["game_id", "week", "posteam"], as_index=False).epa.sum()
    home_away = p.groupby("game_id", as_index=False).agg(home_team=("home_team", "first"), away_team=("away_team", "first"))
    rows = []
    for (gid, wk), grp in grouped.groupby(["game_id", "week"]):
        teams = home_away.loc[home_away.game_id == gid]
        if teams.empty:
            continue
        h, a = teams.iloc[0].home_team, teams.iloc[0].away_team
        tot = dict(zip(grp.posteam, grp.epa))
        v = tot.get(h, 0.0) - tot.get(a, 0.0)
        rows.append((gid, wk, h, v))
        rows.append((gid, wk, a, -v))
    stg = pd.DataFrame(rows, columns=["game_id", "week", "team", "st_epa"])
    return sc, stg


def ridge_ratings(df: pd.DataFrame, w: np.ndarray, ycol: str, teams: list[str], alpha: float):
    idx = {t: i for i, t in enumerate(teams)}
    use = df.posteam.isin(idx) & df.defteam.isin(idx)
    df = df.loc[use]
    w = np.asarray(w, dtype=float)[use.to_numpy()]
    n, k = len(df), len(teams)
    if n == 0 or k == 0:
        z = pd.Series(0.0, index=teams)
        return z, z.copy()
    off_i = df.posteam.map(idx).to_numpy()
    def_i = df.defteam.map(idx).to_numpy()
    X = np.zeros((n, 2 * k + 2), dtype=np.float64)
    X[:, 0] = 1.0
    X[np.arange(n), 1 + off_i] = 1.0
    X[np.arange(n), 1 + k + def_i] = 1.0
    X[:, -1] = df.home.to_numpy(dtype=float) - 0.5
    y = df[ycol].to_numpy(dtype=float)
    ok = np.isfinite(y) & np.isfinite(w) & (w > 0)
    X, y, w = X[ok], y[ok], w[ok]
    if len(y) == 0:
        z = pd.Series(0.0, index=teams)
        return z, z.copy()
    Xw = X * w[:, None]
    A = X.T @ Xw
    pen = np.full(2 * k + 2, alpha)
    pen[0] = 0.0
    pen[-1] = 0.0
    A = A + np.diag(pen)
    beta = np.linalg.solve(A, Xw.T @ y)
    off = pd.Series(beta[1:1 + k], index=teams)
    de = pd.Series(beta[1 + k:1 + 2 * k], index=teams)
    return off - off.mean(), de - de.mean()


def play_weights(df: pd.DataFrame, cur_season: int, week: int) -> np.ndarray:
    wk = df.week.to_numpy(dtype=float)
    cur = df.season.to_numpy() == cur_season
    # Prior-season plays stay at pw. The research POC multiplied a decay term by zero.
    w = np.where(cur, P["decay"] ** (week - 1 - wk), P["pw"])
    wp = df.wp.to_numpy(dtype=float)
    gt = (wp < P["lo"]) | (wp > P["hi"])
    return w * np.where(gt, P["garbage"], 1.0)


def prior_mask(df: pd.DataFrame, season: int, week: int) -> pd.Series:
    return ((df.season == season) & (df.week < week)) | (df.season == season - 1)


def ratings_frame(sc: pd.DataFrame, season: int, week: int, teams: list[str]) -> pd.DataFrame:
    sub = sc.loc[prior_mask(sc, season, week)]
    if season == int(sub.season.max()) if len(sub) else season:
        leaked = sub.loc[sub.season == season, "week"]
        if len(leaked) and float(leaked.max()) >= week:
            raise RuntimeError(f"leakage: season {season} week {week} saw week {leaked.max()}")
    w = play_weights(sub, season, week)
    oe, de = ridge_ratings(sub, w, "epa_adj", teams, P["alpha"])
    os_, ds = ridge_ratings(sub, w, "success", teams, P["alpha"])
    out = pd.DataFrame({
        "off_epa": oe, "def_epa": de, "net_epa": oe - de,
        "off_sr": os_, "def_sr": ds, "net_sr": os_ - ds,
    })
    out["off_pts"] = B_EPA * out.off_epa + B_SR * out.off_sr
    out["def_pts"] = -(B_EPA * out.def_epa + B_SR * out.def_sr)
    out["overall"] = out.off_pts + out.def_pts
    return out


def metric_nets(sc: pd.DataFrame, season: int, week: int, teams: list[str]) -> pd.DataFrame:
    """Opponent-adjusted nets. Higher is better for the team."""
    sub = sc.loc[prior_mask(sc, season, week)]
    specs = {
        "pass": sub[sub.qb_dropback == 1],
        "early_sr": sub[sub.down.isin([1, 2])],
        "explosive": sub,
    }
    ycol = {"pass": "epa_adj", "early_sr": "success", "explosive": "explosive"}
    nets = {}
    for name, frame in specs.items():
        w = play_weights(frame, season, week)
        off, de = ridge_ratings(frame, w, ycol[name], teams, P["alpha"])
        nets[name] = off - de
    return pd.DataFrame(nets)


def load_pressure(seasons: list[int]) -> pd.DataFrame:
    frames = []
    for y in seasons:
        path = CACHE / f"advstats_week_pass_{y}.parquet"
        pfr = pd.read_parquet(path, columns=["game_id", "season", "week", "game_type", "team", "opponent", "times_pressured"])
        pfr = pfr[pfr.game_type == "REG"]
        frames.append(pfr)
    pfr = pd.concat(frames, ignore_index=True)
    return pfr.groupby(["game_id", "season", "week", "team", "opponent"], as_index=False).times_pressured.sum()


def pressure_frame(pbp_sc: pd.DataFrame, seasons: list[int]) -> pd.DataFrame:
    pfr = load_pressure(seasons)
    db = pbp_sc[pbp_sc.qb_dropback == 1]
    drops = db.groupby(["game_id", "posteam"], as_index=False).size().rename(columns={"size": "dropbacks"})
    home = pbp_sc.groupby("game_id").home_team.first()
    x = pfr.merge(drops, left_on=["game_id", "team"], right_on=["game_id", "posteam"], how="inner")
    x = x[x.dropbacks > 0].copy()
    x["press_rate"] = x.times_pressured / x.dropbacks
    x["posteam"] = x.team
    x["defteam"] = x.opponent
    x["home"] = (x.team == x.game_id.map(home)).astype(float)
    return x


def pressure_net(press: pd.DataFrame, season: int, week: int, teams: list[str]) -> pd.Series:
    sub = press.loc[prior_mask(press, season, week)]
    if sub.empty:
        return pd.Series(0.0, index=teams)
    wk = sub.week.to_numpy(dtype=float)
    cur = sub.season.to_numpy() == season
    w = np.where(cur, P["decay"] ** (week - 1 - wk), P["pw"]) * sub.dropbacks.to_numpy(dtype=float)
    off, de = ridge_ratings(sub, w, "press_rate", teams, P["alpha"])
    # Defense generated (higher def coef = more pressure allowed by opponents) minus offense allowed.
    return de - off


def ytd_context(p: pd.DataFrame, sc: pd.DataFrame, season: int, week: int) -> dict:
    """Current-season flags from games before `week`. Luck badges are info only."""
    cur = p[(p.season == season) & (p.week < week) & p.posteam.notna()].copy()
    plays = sc[(sc.season == season) & (sc.week < week)]
    teams = sorted(set(plays.posteam.unique()) | set(plays.defteam.unique()))
    games = {}
    for team in teams:
        gids = set(plays.loc[plays.posteam == team, "game_id"]) | set(plays.loc[plays.defteam == team, "game_id"])
        games[team] = len(gids)

    give = cur.groupby("posteam").agg(interception=("interception", "sum"), fumble_lost=("fumble_lost", "sum"))
    take = cur.groupby("defteam").agg(interception=("interception", "sum"), fumble_lost=("fumble_lost", "sum"))

    fum = cur[cur.fumble == 1]
    rz_src = cur[cur.fixed_drive.notna()]
    if len(rz_src):
        dr = rz_src.groupby(["game_id", "posteam", "fixed_drive"], as_index=False).agg(
            minyl=("yardline_100", "min"), res=("fixed_drive_result", "first")
        )
        rz = dr[dr.minyl <= 20].copy()
        rz["td"] = (rz.res == "Touchdown").astype(float)
        rz_team = rz.groupby("posteam").agg(trips=("td", "size"), td=("td", "sum"))
    else:
        rz_team = pd.DataFrame(columns=["trips", "td"])
    league_trips = float(rz_team["trips"].sum()) if len(rz_team) else 0.0
    league_td = float(rz_team["td"].sum()) if len(rz_team) else 0.0
    league_pct = (league_td / league_trips) if league_trips else None

    out = {}
    for team in teams:
        n = games.get(team, 0)
        g = float(give.loc[team, "interception"] + give.loc[team, "fumble_lost"]) if team in give.index else 0.0
        t = float(take.loc[team, "interception"] + take.loc[team, "fumble_lost"]) if team in take.index else 0.0
        own = fum[fum.posteam == team]
        opp = fum[fum.defteam == team]
        fum_n = int(len(own) + len(opp))
        recovered = int((own.fumble_lost != 1).sum() + (opp.fumble_lost == 1).sum()) if fum_n else 0
        rate = (recovered / fum_n) if fum_n else None
        trips = float(rz_team.loc[team, "trips"]) if team in rz_team.index else 0.0
        td = float(rz_team.loc[team, "td"]) if team in rz_team.index else 0.0
        pct = (td / trips) if trips else None
        to_pg = ((t - g) / n) if n else 0.0
        to_luck = bool(n and to_pg >= 1.0 and rate is not None and rate >= 0.60 and fum_n >= 4)
        rz_luck = bool(pct is not None and league_pct is not None and trips >= 3 and (pct - league_pct) >= 0.20)
        out[site_abbr(team)] = {
            "games": n,
            "to_margin_pg": round(to_pg, 3),
            "fumble_recovery_rate": None if rate is None else round(rate, 3),
            "rz_td_pct": None if pct is None else round(pct, 3),
            "to_luck": to_luck,
            "rz_luck": rz_luck,
        }
    return {"league_rz_td_pct": None if league_pct is None else round(league_pct, 3), "teams": out}


def rank_map(series: pd.Series) -> dict:
    ordered = series.sort_values(ascending=False)
    return {site_abbr(t): i + 1 for i, t in enumerate(ordered.index)}


def points_row(R: pd.DataFrame) -> list[dict]:
    off_r = rank_map(R.off_pts)
    def_r = rank_map(R.def_pts)
    ov_r = rank_map(R.overall)
    rows = []
    for team, r in R.sort_values("overall", ascending=False).iterrows():
        abbr = site_abbr(team)
        rows.append({
            "abbr": abbr,
            "off": round(float(r.off_pts), 2),
            "def": round(float(r.def_pts), 2),
            "overall": round(float(r.overall), 2),
            "off_rank": off_r[abbr],
            "def_rank": def_r[abbr],
            "overall_rank": ov_r[abbr],
        })
    return rows


def load_site_games(week: int) -> list[dict]:
    nfl = json.loads((ROOT / "data" / "nfl-2026.json").read_text())
    games = []
    for g in nfl.get("games") or []:
        if int(g.get("week") or 0) != int(week):
            continue
        st = str(g.get("season_type") or g.get("type") or "REG").upper()
        if st in {"PRE", "POST"}:
            continue
        games.append(g)
    return games


def spread_for(R: pd.DataFrame, home: str, away: str, neutral: bool) -> float | None:
    inv = {site_abbr(t): t for t in R.index}
    h = inv.get(home)
    a = inv.get(away)
    if h is None or a is None:
        return None
    hfa = 0.0 if neutral else HFA
    margin = hfa + float(R.loc[h, "overall"] - R.loc[a, "overall"])
    return round(-margin, 2)


def edge_spread(coef: float, home_net: float, away_net: float) -> float:
    """Home-centric points. Negative means the factor favors the home team."""
    return round(-(coef * (home_net - away_net)), 2)


def fit_factor_coefs(sc: pd.DataFrame, press: pd.DataFrame, games: pd.DataFrame, teams: list[str]) -> dict:
    train = games[(games.season.isin([2021, 2022, 2023])) & games.home_score.notna() & games.spread_line.notna()]
    cache = {}
    rows = []
    for (s, wk), gg in train.groupby(["season", "week"]):
        key = (int(s), int(wk))
        if key not in cache:
            nets = metric_nets(sc, int(s), int(wk), teams)
            pr = pressure_net(press, int(s), int(wk), teams)
            cache[key] = (nets, pr)
        nets, pr = cache[key]
        for r in gg.itertuples(index=False):
            if r.home_team not in nets.index or r.away_team not in nets.index:
                continue
            h, a = nets.loc[r.home_team], nets.loc[r.away_team]
            rows.append({
                "home_flag": 0.0 if r.location == "Neutral" else 1.0,
                "margin": float(r.home_score - r.away_score),
                "pass": float(h["pass"] - a["pass"]),
                "early_sr": float(h["early_sr"] - a["early_sr"]),
                "explosive": float(h["explosive"] - a["explosive"]),
                "pressure": float(pr.get(r.home_team, 0.0) - pr.get(r.away_team, 0.0)),
            })
    F = pd.DataFrame(rows)
    fit = {"fit_seasons": [2021, 2022, 2023], "n": int(len(F)), "note": "margin ~ home + factor. Chip = -(coef * home_net_minus_away). Not in the B$ line."}
    for col in ("pass", "early_sr", "pressure", "explosive"):
        X = np.column_stack([F.home_flag.to_numpy(), F[col].to_numpy()])
        y = F.margin.to_numpy()
        b, *_ = np.linalg.lstsq(X, y, rcond=None)
        fit[col] = {"hfa": round(float(b[0]), 4), "coef": round(float(b[1]), 4)}
    return fit


def load_fit() -> dict:
    if not FIT_JSON.exists():
        raise SystemExit("Missing data/dvoa/factor-fit.json. Run: python3 data/dvoa/build_bs_dvoa.py --backtest")
    return json.loads(FIT_JSON.read_text())


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n")


def upsert_week(path: Path, shell: dict, week_row: dict) -> dict:
    if path.exists():
        data = json.loads(path.read_text())
    else:
        data = shell
    data.update({k: v for k, v in shell.items() if k != "weeks"})
    weeks = [w for w in data.get("weeks") or [] if int(w.get("week") or 0) != int(week_row["week"])]
    weeks.append(week_row)
    weeks.sort(key=lambda w: int(w["week"]))
    data["weeks"] = weeks
    data["generated_at"] = week_row["generated_at"]
    data["as_of_week"] = int(week_row["plays_through_week"])
    write_json(path, data)
    return data


def dvoa_shell(generated: str) -> dict:
    return {
        "schema": 1,
        "name": "B$ DVOA",
        "shadow": True,
        "not_in_b_line": True,
        "season": 2026,
        "sign_convention": "Team ratings are points per game against an average team on a neutral field. Positive is better for offense, defense, and overall. Game spreads are home-centric: negative means the home team is favored.",
        "settings": {
            "decay": P["decay"],
            "prior_weight": P["pw"],
            "ridge_alpha": P["alpha"],
            "garbage_wp": [P["lo"], P["hi"]],
            "garbage_weight": P["garbage"],
            "b_epa": B_EPA,
            "b_sr": B_SR,
            "hfa": HFA,
            "fit_seasons": [2021, 2022, 2023],
            "st_included": False,
        },
        "generated_at": generated,
        "as_of_week": None,
        "weeks": [],
    }


def factor_shell(generated: str) -> dict:
    return {
        "schema": 1,
        "shadow": True,
        "not_in_b_line": True,
        "season": 2026,
        "sign_convention": "Edges are home-centric points. Negative means the factor favors the home team. None of these chips are added to the B$ line.",
        "reliability": {
            "pass": "info",
            "early_sr": "info",
            "pressure": "info",
            "explosive": "low",
        },
        "luck_rules": {
            "to_luck": "YTD turnover margin >= +1 per game and fumble recovery rate >= 60% on at least 4 fumbles",
            "rz_luck": "Red-zone TD rate at least 20 points above the league, on at least 3 trips",
        },
        "generated_at": generated,
        "as_of_week": None,
        "weeks": [],
    }


def build_weeks(weeks: list[int]) -> None:
    ensure_inputs([2025, 2026])
    fit = load_fit()
    sc_l, raw_l = [], []
    for s in (2025, 2026):
        raw = load_pbp(s)
        sc, _st = prep_scrimmage(raw)
        sc["season"] = s
        raw["season"] = s
        sc_l.append(sc)
        raw_l.append(raw)
    sc = pd.concat(sc_l, ignore_index=True)
    raw = pd.concat(raw_l, ignore_index=True)
    teams = sorted(sc.posteam.dropna().unique())
    press = pressure_frame(sc, [2025, 2026])
    generated = now_et()
    for week in weeks:
        R = ratings_frame(sc, 2026, week, teams)
        nets = metric_nets(sc, 2026, week, teams)
        pr = pressure_net(press, 2026, week, teams)
        ctx = ytd_context(raw, sc, 2026, week)
        games = []
        factor_games = []
        for g in load_site_games(week):
            home, away = site_abbr(g["home"]), site_abbr(g["away"])
            neutral = bool(g.get("neutral"))
            spread = spread_for(R, home, away, neutral)
            games.append({
                "espn_id": str(g.get("id") or ""),
                "away": away,
                "home": home,
                "neutral": neutral,
                "kick": g.get("date"),
                "hfa": 0.0 if neutral else HFA,
                "bs_dvoa_home_spread": spread,
            })
            inv = {site_abbr(t): t for t in teams}
            ht, at = inv.get(home), inv.get(away)
            edges = {"pass": None, "early_sr": None, "pressure": None, "explosive": None}
            if ht and at:
                for name in ("pass", "early_sr", "explosive"):
                    edges[name] = edge_spread(fit[name]["coef"], float(nets.loc[ht, name]), float(nets.loc[at, name]))
                edges["pressure"] = edge_spread(fit["pressure"]["coef"], float(pr.get(ht, 0.0)), float(pr.get(at, 0.0)))
            ht_ctx = ctx["teams"].get(home, {})
            at_ctx = ctx["teams"].get(away, {})
            factor_games.append({
                "espn_id": str(g.get("id") or ""),
                "away": away,
                "home": home,
                "pass_edge": edges["pass"],
                "early_sr_edge": edges["early_sr"],
                "pressure_edge": edges["pressure"],
                "explosive_edge": edges["explosive"],
                "home_to_luck": bool(ht_ctx.get("to_luck")),
                "away_to_luck": bool(at_ctx.get("to_luck")),
                "home_rz_luck": bool(ht_ctx.get("rz_luck")),
                "away_rz_luck": bool(at_ctx.get("rz_luck")),
            })
        stamp = now_et()
        week_row = {
            "week": week,
            "plays_through_week": week - 1,
            "generated_at": stamp,
            "teams": points_row(R),
            "games": games,
        }
        factor_row = {
            "week": week,
            "plays_through_week": week - 1,
            "generated_at": stamp,
            "league_rz_td_pct": ctx["league_rz_td_pct"],
            "teams": ctx["teams"],
            "games": factor_games,
        }
        upsert_week(DVOA_JSON, dvoa_shell(generated), week_row)
        upsert_week(FACTOR_JSON, factor_shell(generated), factor_row)
        top = week_row["teams"][:5]
        bot = week_row["teams"][-3:]
        print(f"week {week}  plays through {week - 1}  {stamp}")
        print("  top " + ", ".join(f"{t['abbr']} {t['overall']:+.1f}" for t in top))
        print("  bot " + ", ".join(f"{t['abbr']} {t['overall']:+.1f}" for t in bot))
        print(f"  games {len(games)}")


def load_backtest_frames(seasons: list[int]):
    ensure_inputs(seasons)
    sc_l, raw_l = [], []
    for s in seasons:
        raw = load_pbp(s)
        sc, _st = prep_scrimmage(raw)
        sc_l.append(sc)
        raw_l.append(raw)
    sc = pd.concat(sc_l, ignore_index=True)
    games = pd.read_csv(CACHE / "games.csv")
    games = games[(games.season.isin(seasons)) & (games.game_type == "REG")].copy()
    games["neutral"] = (games.location == "Neutral").astype(int)
    teams = sorted(sc.posteam.dropna().unique())
    press = pressure_frame(sc, seasons)
    return sc, games, teams, press


def backtest() -> None:
    seasons = list(range(2020, 2027))
    sc, games, teams, press = load_backtest_frames(seasons)
    rows = []
    for (s, wk), gg in games.groupby(["season", "week"]):
        s, wk = int(s), int(wk)
        if s == 2026 and wk > 4:
            continue
        if s < 2021:
            continue
        R = ratings_frame(sc, s, wk, teams)
        for r in gg.itertuples(index=False):
            if r.home_team not in R.index or r.away_team not in R.index:
                continue
            h, a = R.loc[r.home_team], R.loc[r.away_team]
            d_epa = float(h.net_epa - a.net_epa)
            d_sr = float(h.net_sr - a.net_sr)
            home_flag = 0.0 if r.location == "Neutral" else 1.0
            margin = None if pd.isna(r.home_score) else float(r.home_score - r.away_score)
            mkt = None if pd.isna(r.spread_line) else float(r.spread_line)
            rows.append(dict(season=s, week=wk, home_flag=home_flag, d_epa=d_epa, d_sr=d_sr, margin=margin, mkt=mkt))
        print(f"built {s} w{wk}", flush=True)
    F = pd.DataFrame(rows)
    train = F[F.season.isin([2021, 2022, 2023]) & F.margin.notna()]
    X = np.column_stack([train.home_flag, train.d_epa, train.d_sr])
    coef, *_ = np.linalg.lstsq(X, train.margin.to_numpy(), rcond=None)
    # Frozen coefficients are what the site JSON uses. Report the refit beside them.
    F["pred_frozen"] = F.home_flag * HFA + F.d_epa * B_EPA + F.d_sr * B_SR
    F["pred_refit"] = F.home_flag * coef[0] + F.d_epa * coef[1] + F.d_sr * coef[2]

    def summarize(frame: pd.DataFrame, pred_col: str) -> dict:
        d = frame[frame.margin.notna() & frame.mkt.notna()].copy()
        model = (d[pred_col] - d.margin).abs()
        market = (d.mkt - d.margin).abs()
        side = np.sign(d[pred_col] - d.mkt)
        res = np.sign(d.margin - d.mkt)
        m = (side != 0) & (res != 0)
        wins = int((side[m] == res[m]).sum())
        losses = int(m.sum()) - wins
        return {
            "n": int(len(d)),
            "model_mae": round(float(model.mean()), 2) if len(d) else None,
            "market_mae": round(float(market.mean()), 2) if len(d) else None,
            "ats": f"{wins}-{losses}",
        }

    seasons_out = []
    for s, d in F.groupby("season"):
        row = summarize(d, "pred_frozen")
        row["season"] = int(s)
        row["set"] = "train" if s in (2021, 2022, 2023) else "test"
        seasons_out.append(row)
    test = F[F.season.isin([2024, 2025])]
    pooled = summarize(test, "pred_frozen")
    refit_pool = summarize(test, "pred_refit")
    fit = fit_factor_coefs(sc, press, games, teams)
    payload = {
        "generated_at": now_et(),
        "frozen_coefficients": {"hfa": HFA, "b_epa": B_EPA, "b_sr": B_SR},
        "refit_2021_2023": {
            "hfa": round(float(coef[0]), 2),
            "b_epa": round(float(coef[1]), 2),
            "b_sr": round(float(coef[2]), 2),
        },
        "headline": {
            "label": "2024-25",
            "frozen": pooled,
            "refit": refit_pool,
            "research": {"model_mae": 10.4, "market_mae_low": 9.61, "market_mae_high": 9.72, "note": "Report: about 10.4 vs market 9.6-9.7. Season file was 10.37 / 9.61 in 2024 and 10.41 / 9.72 in 2025."},
        },
        "seasons": seasons_out,
        "factor_fit": fit,
    }
    # Explain a gap versus the Sep 29 research snapshot if the replay moved.
    gap = None if pooled["model_mae"] is None else round(pooled["model_mae"] - 10.39, 2)
    payload["headline"]["versus_research_pooled_10_39"] = gap
    payload["headline"]["why_it_can_differ"] = (
        "Replay uses the frozen 15.99 / 93.63 / 2.12 coefficients on a fresh nflverse pull. "
        "Small MAE gaps versus the Sep 29 snapshot are stat corrections in the nightly pbp, "
        "not a retune. The weekly JSON does not refit."
    )
    write_json(FIT_JSON, fit)
    write_json(BACKTEST_JSON, payload)
    print("refit coef hfa/epa/sr", [round(float(c), 2) for c in coef])
    print("frozen 2024-25", pooled)
    print("refit  2024-25", refit_pool)
    for row in seasons_out:
        print(row)
    print("wrote", FIT_JSON.name, BACKTEST_JSON.name)


def main() -> None:
    ap = argparse.ArgumentParser(description="Build shadow B$ DVOA and ATS factor JSON.")
    ap.add_argument("--week", type=int, help="Upcoming week to rate (replaces that week).")
    ap.add_argument("--through", type=int, help="Build weeks 1 through N.")
    ap.add_argument("--backtest", action="store_true", help="Replay 2021-2026 and print MAE.")
    args = ap.parse_args()
    if args.backtest:
        backtest()
        return
    if args.through:
        weeks = list(range(1, args.through + 1))
    elif args.week:
        weeks = [args.week]
    else:
        ap.error("Pass --week N, --through N, or --backtest")
    for w in weeks:
        if w < 1 or w > 18:
            ap.error("week out of range")
    build_weeks(weeks)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)

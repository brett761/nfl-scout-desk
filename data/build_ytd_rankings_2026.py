#!/usr/bin/env python3
"""Build 2026 YTD O/D/ST/TAKE/GIVE rankings on the same scale as prior-2025.json pillars."""
from __future__ import annotations

import json
import math
import urllib.error
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

DATA = Path(__file__).resolve().parent


def num(v):
    if v is None or v == "":
        return None
    try:
        n = float(v)
        return n if math.isfinite(n) else None
    except (TypeError, ValueError):
        return None


def round2(n):
    return round(float(n) * 100) / 100


def game_scores(g):
    home = num(g.get("home_score"))
    away = num(g.get("away_score"))
    if home is None or away is None:
        return None
    return home, away


UA = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    )
}
# site.api.espn.com is the documented summary host. Akamai 403s it from some
# networks; site.web.api.espn.com serves the same summary payload.
SUMMARY_HOSTS = (
    "https://site.api.espn.com",
    "https://site.web.api.espn.com",
)


def fetch_json(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=40) as resp:
        return json.load(resp)


def stat_value(statistics, name):
    """First numeric team stat with this name. ESPN repeats interceptions."""
    for s in statistics or []:
        if s.get("name") != name:
            continue
        v = num(s.get("value"))
        if v is None:
            v = num(s.get("displayValue"))
        if v is not None:
            return v
    return None


def defensive_ints(player_side):
    """Sum of the player 'interceptions' box (defensive INTs)."""
    for group in (player_side or {}).get("statistics") or []:
        if group.get("name") != "interceptions":
            continue
        totals = group.get("totals") or []
        if totals and num(totals[0]) is not None:
            return int(num(totals[0]))
        caught = 0
        for athlete in group.get("athletes") or []:
            stats = athlete.get("stats") or []
            if stats and num(stats[0]) is not None:
                caught += int(num(stats[0]))
        return caught
    return 0


def parse_summary(game, data):
    """Giveaways = INT thrown + fumbles lost. Takeaways = the opponent's giveaways.

    That is defensive INTs + fumbles recovered by the defense. In a two-team
    final those are the same counts. The player INT box is checked against
    the opponent's interceptions thrown.
    """
    players_by_id = {}
    for side in (data.get("boxscore") or {}).get("players") or []:
        tid = str((side.get("team") or {}).get("id") or "")
        if tid:
            players_by_id[tid] = side
    sides = {}
    for team in (data.get("boxscore") or {}).get("teams") or []:
        ha = team.get("homeAway")
        if ha not in ("home", "away"):
            continue
        stats = team.get("statistics") or []
        int_thrown = int(stat_value(stats, "interceptions") or 0)
        fum_lost = int(stat_value(stats, "fumblesLost") or 0)
        turnovers = stat_value(stats, "turnovers")
        tid = str((team.get("team") or {}).get("id") or "")
        def_int = defensive_ints(players_by_id.get(tid))
        sides[ha] = {
            "abbr": game["home"] if ha == "home" else game["away"],
            "espn_abbr": (team.get("team") or {}).get("abbreviation"),
            "int_thrown": int_thrown,
            "fum_lost": fum_lost,
            "turnovers": None if turnovers is None else int(turnovers),
            "def_int": def_int,
        }
    if "home" not in sides or "away" not in sides:
        raise ValueError(f"summary {game.get('id')} missing home/away team stats")
    for ha, opp in (("home", "away"), ("away", "home")):
        own = sides[ha]
        other = sides[opp]
        own["giveaways"] = own["int_thrown"] + own["fum_lost"]
        own["takeaways"] = other["int_thrown"] + other["fum_lost"]
        own["take_int"] = other["int_thrown"]
        own["take_fum"] = other["fum_lost"]
        if own["turnovers"] is not None and own["turnovers"] != own["giveaways"]:
            raise ValueError(
                f"{game.get('id')} {own['abbr']} turnovers {own['turnovers']} "
                f"!= INT+fumblesLost {own['giveaways']}"
            )
        if own["def_int"] != other["int_thrown"]:
            raise ValueError(
                f"{game.get('id')} {own['abbr']} defensive INTs {own['def_int']} "
                f"!= opponent INT thrown {other['int_thrown']}"
            )
    return sides


def scored_finals(nfl):
    games = []
    for g in nfl["games"]:
        week = g.get("week")
        if not isinstance(week, (int, float)) or week < 1 or week > 18:
            continue
        if not game_scores(g):
            continue
        games.append(g)
    return games


def working_summary_host(sample_id):
    last = None
    for host in SUMMARY_HOSTS:
        url = f"{host}/apis/site/v2/sports/football/nfl/summary?event={sample_id}"
        try:
            fetch_json(url)
            return host
        except urllib.error.HTTPError as err:
            last = err
            continue
        except (urllib.error.URLError, TimeoutError, ValueError) as err:
            last = err
            continue
    raise RuntimeError(f"no ESPN summary host for event {sample_id}: {last}")


def pull_turnovers(games):
    """One ESPN summary per scored final. Rerunnable as new finals land."""
    if not games:
        return [], None
    host = working_summary_host(games[0]["id"])

    def pull_one(game):
        url = f"{host}/apis/site/v2/sports/football/nfl/summary?event={game['id']}"
        data = fetch_json(url)
        sides = parse_summary(game, data)
        return {
            "id": str(game["id"]),
            "week": int(game["week"]),
            "away": game["away"],
            "home": game["home"],
            "source": host,
            "home_side": sides["home"],
            "away_side": sides["away"],
        }

    pulled = []
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(pull_one, g): g for g in games}
        for fut in as_completed(futures):
            game = futures[fut]
            try:
                pulled.append(fut.result())
            except Exception as err:
                raise RuntimeError(f"event {game.get('id')}: {err}") from err
    pulled.sort(key=lambda row: (row["week"], row["id"]))
    return pulled, host


def main():
    prior = json.loads((DATA / "prior-2025.json").read_text())
    nfl = json.loads((DATA / "nfl-2026.json").read_text())
    espn = json.loads((DATA / "_ytd-espn-raw-2026.json").read_text())

    off_vals = [num(t["raw"]["off_ppg"]) for t in prior["teams"].values()]
    def_vals = [num(t["raw"]["def_ppg"]) for t in prior["teams"].values()]
    off_lo, off_hi = min(off_vals), max(off_vals)
    def_lo, def_hi = min(def_vals), max(def_vals)

    fg_2025 = [num(t["raw"]["st_fg_pct"]) for t in prior["teams"].values()]
    mean_fg_2025 = sum(fg_2025) / len(fg_2025)
    st_comps_2025 = []
    for t in prior["teams"].values():
        ret = num(t["raw"]["st_ret_td"]) or 0
        fg = num(t["raw"]["st_fg_pct"])
        st_comps_2025.append(2.0 * ret + (fg - mean_fg_2025) / 8.0)
    st_comp_lo, st_comp_hi = min(st_comps_2025), max(st_comps_2025)

    # Verify ST formula reproduces prior pillars
    for abbr, t in prior["teams"].items():
        ret = num(t["raw"]["st_ret_td"]) or 0
        fg = num(t["raw"]["st_fg_pct"])
        comp = 2.0 * ret + (fg - mean_fg_2025) / 8.0
        tt = max(0.0, min(1.0, (comp - st_comp_lo) / (st_comp_hi - st_comp_lo)))
        pred = round2(-4 + tt * 8)
        assert pred == round2(t["pillars"]["st"]), (abbr, pred, t["pillars"]["st"])

    # 2025 take/give pillars are min-max of season totals onto ±5.
    # Higher takeaways are better. Fewer giveaways are better.
    # Per-game equivalent: divide those season anchors by games_in_prior (17)
    # and map a YTD per-game rate onto the same line. Feeding a 17-game
    # season total / 17 reproduces every prior pillar.
    games_prior = num(prior.get("games_in_prior")) or 17
    take_vals = [num(t["raw"]["takeaways"]) for t in prior["teams"].values()]
    give_vals = [num(t["raw"]["giveaways"]) for t in prior["teams"].values()]
    take_lo, take_hi = min(take_vals), max(take_vals)
    give_lo, give_hi = min(give_vals), max(give_vals)

    def map_turnover(total, n_games, kind):
        n = num(n_games)
        x = num(total)
        if n is None or n <= 0 or x is None:
            return 0.0
        pg = x / n
        if kind == "give":
            lo, hi = give_lo / games_prior, give_hi / games_prior
            span = hi - lo or 1.0
            t = max(0.0, min(1.0, (pg - lo) / span))
            pillar = 5 - t * 10
        else:
            lo, hi = take_lo / games_prior, take_hi / games_prior
            span = hi - lo or 1.0
            t = max(0.0, min(1.0, (pg - lo) / span))
            pillar = -5 + t * 10
        return max(-5.0, min(5.0, pillar))

    for abbr, t in prior["teams"].items():
        pred_take = round2(map_turnover(t["raw"]["takeaways"], games_prior, "take"))
        pred_give = round2(map_turnover(t["raw"]["giveaways"], games_prior, "give"))
        assert pred_take == round2(t["pillars"]["take"]), (abbr, pred_take, t["pillars"]["take"])
        assert pred_give == round2(t["pillars"]["give"]), (abbr, pred_give, t["pillars"]["give"])

    w = prior["weights"]

    def map_ppg(ppg, kind):
        x = num(ppg)
        if x is None:
            return 0.0
        if kind == "def":
            lo, hi = def_lo, def_hi
            t = max(0.0, min(1.0, (x - lo) / (hi - lo)))
            return max(-12.0, min(12.0, 12 - t * 24))
        lo, hi = off_lo, off_hi
        t = max(0.0, min(1.0, (x - lo) / (hi - lo)))
        return max(-12.0, min(12.0, -12 + t * 24))

    def map_st(ret_td, fg_pct, fga):
        ret = num(ret_td) or 0
        fga_n = num(fga) or 0
        fg = num(fg_pct)
        if fga_n <= 0 or fg is None:
            fg = mean_fg_2025
        comp = 2.0 * ret + (fg - mean_fg_2025) / 8.0
        span = st_comp_hi - st_comp_lo or 1.0
        t = max(0.0, min(1.0, (comp - st_comp_lo) / span))
        pillar = max(-4.0, min(4.0, -4 + t * 8))
        return pillar, round2(comp), round2(fg)

    finals = scored_finals(nfl)
    turnover_rows, turnover_host = pull_turnovers(finals)
    by_event = {row["id"]: row for row in turnover_rows}
    if len(by_event) != len(finals):
        raise RuntimeError(f"turnover pull {len(by_event)} != scored finals {len(finals)}")

    def side_counts(side):
        return {
            "takeaways": side["takeaways"],
            "giveaways": side["giveaways"],
            "take_int": side["take_int"],
            "take_fum": side["take_fum"],
            "int_thrown": side["int_thrown"],
            "fum_lost": side["fum_lost"],
        }

    scored = defaultdict(list)
    for g in finals:
        week = int(g["week"])
        sc = game_scores(g)
        hs, aw = sc
        row = by_event[str(g["id"])]
        home_to = side_counts(row["home_side"])
        away_to = side_counts(row["away_side"])
        scored[g["home"]].append(
            {
                "ptsFor": hs,
                "ptsAgainst": aw,
                "week": week,
                "opp": g["away"],
                "ha": "H",
                "event": str(g["id"]),
                **home_to,
            }
        )
        scored[g["away"]].append(
            {
                "ptsFor": aw,
                "ptsAgainst": hs,
                "week": week,
                "opp": g["home"],
                "ha": "A",
                "event": str(g["id"]),
                **away_to,
            }
        )

    et = ZoneInfo("America/New_York")
    now = datetime.now(et)

    st_src = {
        "pulled": now.isoformat(),
        "source": "ESPN sports.core.api team statistics (2026 regular season YTD)",
        "note": (
            "st_ret_td = kickReturnTouchdowns + puntReturnTouchdowns + "
            "blockedFieldGoalTouchdowns + missedFieldGoalReturnTd. "
            "null st_fg_pct when FGA=0 (builder substitutes 2025 league mean)."
        ),
        "teams": {},
    }
    for abbr, r in espn.items():
        ret = (
            (num(r.get("kickReturnTouchdowns")) or 0)
            + (num(r.get("puntReturnTouchdowns")) or 0)
            + (num(r.get("blockedFieldGoalTouchdowns")) or 0)
            + (num(r.get("missedFieldGoalReturnTd")) or 0)
        )
        fga = int(num(r.get("fieldGoalAttempts")) or 0)
        st_src["teams"][abbr] = {
            "st_ret_td": int(ret),
            "st_fg_pct": None if fga <= 0 else round2(num(r.get("fieldGoalPct"))),
            "st_fgm": int(num(r.get("fieldGoalsMade")) or 0),
            "st_fga": fga,
            "espn_games": num(r.get("gamesPlayed")),
        }

    (DATA / "ytd-st-2026.json").write_text(json.dumps(st_src, indent=2) + "\n")

    teams_out = []
    for abbr in sorted(prior["teams"].keys()):
        rows = scored.get(abbr, [])
        n = len(rows)
        off_ppg = sum(r["ptsFor"] for r in rows) / n if n else None
        def_ppg = sum(r["ptsAgainst"] for r in rows) / n if n else None
        st_row = st_src["teams"][abbr]
        st_pil, st_comp, fg_used = map_st(st_row["st_ret_td"], st_row["st_fg_pct"], st_row["st_fga"])
        off = map_ppg(off_ppg, "off") if n else 0.0
        deff = map_ppg(def_ppg, "def") if n else 0.0
        take_n = sum(r["takeaways"] for r in rows) if n else 0
        give_n = sum(r["giveaways"] for r in rows) if n else 0
        take_int = sum(r["take_int"] for r in rows) if n else 0
        take_fum = sum(r["take_fum"] for r in rows) if n else 0
        int_thrown = sum(r["int_thrown"] for r in rows) if n else 0
        fum_lost = sum(r["fum_lost"] for r in rows) if n else 0
        take_pil = map_turnover(take_n, n, "take") if n else 0.0
        give_pil = map_turnover(give_n, n, "give") if n else 0.0
        w_off, w_def, w_st = w["off"], w["def"], w["st"]
        w_take, w_give = w["take"], w["give"]
        denom = w_off + w_def + w_st + w_take + w_give
        composite = (
            w_off * off + w_def * deff + w_st * st_pil + w_take * take_pil + w_give * give_pil
        ) / denom
        if abs(composite) > 12:
            composite = math.copysign(12, composite)
        od_only = (w_off * off + w_def * deff) / (w_off + w_def) if n else 0.0
        if abs(od_only) > 12:
            od_only = math.copysign(12, od_only)
        teams_out.append(
            {
                "abbr": abbr,
                "n": n,
                "raw": {
                    "off_ppg": round2(off_ppg) if off_ppg is not None else None,
                    "def_ppg": round2(def_ppg) if def_ppg is not None else None,
                    "st_ret_td": st_row["st_ret_td"],
                    "st_fg_pct": st_row["st_fg_pct"],
                    "st_fgm": st_row["st_fgm"],
                    "st_fga": st_row["st_fga"],
                    "st_fg_pct_used": fg_used,
                    "st_comp": st_comp,
                    "takeaways": take_n,
                    "giveaways": give_n,
                    "takeaways_pg": round2(take_n / n) if n else None,
                    "giveaways_pg": round2(give_n / n) if n else None,
                    "take_int": take_int,
                    "take_fum": take_fum,
                    "int_thrown": int_thrown,
                    "fum_lost": fum_lost,
                },
                "pillars": {
                    "off": round2(off),
                    "def": round2(deff),
                    "st": round2(st_pil),
                    "take": round2(take_pil),
                    "give": round2(give_pil),
                },
                "composite": round2(composite),
                "composite_od_only": round2(od_only),
                "games": rows,
            }
        )

    for key, rank_key in [
        ("composite", "rank"),
        ("off", "rank_off"),
        ("def", "rank_def"),
        ("st", "rank_st"),
        ("take", "rank_take"),
        ("give", "rank_give"),
    ]:
        if key == "composite":
            ordered = sorted(teams_out, key=lambda t: (-t["composite"], t["abbr"]))
        else:
            ordered = sorted(teams_out, key=lambda t: (-t["pillars"][key], t["abbr"]))
        for i, t in enumerate(ordered):
            t[rank_key] = i + 1

    teams_out.sort(key=lambda t: (t["rank"], t["abbr"]))
    week_scored = defaultdict(int)
    week_total = defaultdict(int)
    for g in nfl["games"]:
        week = g.get("week")
        if not isinstance(week, (int, float)) or week < 1 or week > 18:
            continue
        week_total[int(week)] += 1
        if game_scores(g):
            week_scored[int(week)] += 1
    n_scored = sum(week_scored.values())
    slate_parts = []
    for week_n in sorted(week_scored):
        sc, tot = week_scored[week_n], week_total[week_n]
        if sc == tot:
            slate_parts.append(f"W{week_n} all {sc}")
        else:
            slate_parts.append(f"W{week_n} {sc}/{tot}")
    slate = " + ".join(slate_parts) if slate_parts else "no scored games"
    as_of = f"YTD through completed regular-season games ({slate})"
    pulled_et = now.strftime("%b %d, %Y, %I:%M %p ET").replace(" 0", " ")

    raw_to = {
        "pulled": now.isoformat(),
        "source": (
            "ESPN game summary box score team stats "
            "(interceptions thrown + fumblesLost). "
            "Takeaways are the opponent's giveaways in that final "
            "(defensive INTs + fumbles recovered by the defense)."
        ),
        "host": turnover_host,
        "games": turnover_rows,
    }
    (DATA / "_ytd-to-raw-2026.json").write_text(json.dumps(raw_to, indent=2) + "\n")

    w_sum = w["off"] + w["def"] + w["st"] + w["take"] + w["give"]
    composite_formula = (
        f"({w['off']}*off + {w['def']}*def + {w['st']}*st + "
        f"{w['take']}*take + {w['give']}*give) / {w_sum}"
    )

    out = {
        "season": 2026,
        "as_of": as_of,
        "pulled": now.isoformat(),
        "pulled_et": pulled_et,
        "scored_games": n_scored,
        "scale": {
            "note": "Same units as 2025 prior pillars in prior-2025.json — lock 2025 raw endpoints.",
            "offense": {
                "stat": "points scored per game (YTD mean of scored finals)",
                "range": [-12, 12],
                "better": "higher",
                "raw_lo_2025": off_lo,
                "raw_hi_2025": off_hi,
                "map": "t=(ppg-lo)/(hi-lo) clamped 0..1; pillar=-12+t*24",
                "file_anchors": "prior-2025.json teams[*].raw.off_ppg min/max (LV 14.2 / LAR 30.5)",
            },
            "defense": {
                "stat": "points allowed per game (YTD mean)",
                "range": [-12, 12],
                "better": "lower",
                "raw_lo_2025": def_lo,
                "raw_hi_2025": def_hi,
                "map": "t=(ppg-lo)/(hi-lo) clamped 0..1; pillar=12-t*24",
                "file_anchors": "prior-2025.json teams[*].raw.def_ppg min/max (SEA 17.2 / DAL 30.1)",
            },
            "special_teams": {
                "stat": "return TDs + FG% vs 2025 league mean",
                "range": [-4, 4],
                "better": "higher",
                "formula": (
                    "comp = 2*st_ret_td + (st_fg_pct - mean_fg_2025)/8; "
                    "pillar = -4 + 8*clamp((comp-comp_lo)/(comp_hi-comp_lo),0,1)"
                ),
                "mean_fg_2025": round(mean_fg_2025, 5),
                "comp_lo_2025": round(st_comp_lo, 8),
                "comp_hi_2025": round(st_comp_hi, 8),
                "zero_fga_policy": "substitute mean_fg_2025 (neutral FG term)",
                "verified": "Reproduces all 32 prior-2025.json pillars.st exactly (round2)",
                "file": "prior-2025.json raw st_ret_td / st_fg_pct",
            },
            "takeaways": {
                "stat": "defensive interceptions + opponent fumbles recovered, per game",
                "range": [-5, 5],
                "better": "higher",
                "raw_lo_2025": take_lo,
                "raw_hi_2025": take_hi,
                "games_in_prior": games_prior,
                "map": (
                    "pg = ytd_total / games; lo = raw_lo_2025 / 17; hi = raw_hi_2025 / 17; "
                    "t=(pg-lo)/(hi-lo) clamped 0..1; pillar=-5+t*10 clamped ±5"
                ),
                "verified": "Reproduces all 32 prior-2025.json pillars.take when fed 2025 totals over 17 games",
                "file_anchors": "prior-2025.json teams[*].raw.takeaways min/max (NYJ 4 / CHI 33)",
            },
            "giveaways": {
                "stat": "interceptions thrown + fumbles lost, per game",
                "range": [-5, 5],
                "better": "lower",
                "raw_lo_2025": give_lo,
                "raw_hi_2025": give_hi,
                "games_in_prior": games_prior,
                "map": (
                    "pg = ytd_total / games; lo = raw_lo_2025 / 17; hi = raw_hi_2025 / 17; "
                    "t=(pg-lo)/(hi-lo) clamped 0..1; pillar=5-t*10 clamped ±5"
                ),
                "verified": "Reproduces all 32 prior-2025.json pillars.give when fed 2025 totals over 17 games",
                "file_anchors": "prior-2025.json teams[*].raw.giveaways min/max (CHI 11 / MIN 30)",
            },
            "composite": {
                "formula": composite_formula,
                "weights": {
                    "off": w["off"],
                    "def": w["def"],
                    "st": w["st"],
                    "take": w["take"],
                    "give": w["give"],
                },
                "cap": "composite clamped to ±12",
            },
            "prior_full_weights": w,
        },
        "sources": {
            "offense_defense_ppg": "nfl-2026.json scored finals (home_score/away_score)",
            "special_teams": "ytd-st-2026.json from ESPN core team statistics",
            "turnovers": (
                "ESPN summary box score for each scored final in nfl-2026.json. "
                "Giveaways = team interceptions + fumblesLost. "
                "Takeaways = opponent giveaways."
            ),
            "turnover_host": turnover_host,
            "turnover_raw": "_ytd-to-raw-2026.json",
            "scale_file": "prior-2025.json",
        },
        "teams": teams_out,
    }
    (DATA / "ytd-rankings-2026.json").write_text(json.dumps(out, indent=2) + "\n")

    def fmt(n):
        return ("+" if n >= 0 else "") + f"{n:.2f}"

    md = []
    md.append("# NFL Scout YTD rankings — 2026 (same scale as 2025 O/D/ST/TAKE/GIVE)\n")
    md.append(
        f"Pulled: **{pulled_et}** · Scored games: **{n_scored}** "
        f"({slate}).\n"
    )
    md.append("## Scale (mirrors 2025 prior)\n")
    md.append("| Pillar | Output | Inputs | 2025 raw anchors | Weight in composite |")
    md.append("|---|---|---|---|---|")
    md.append(f"| Offense | −12…+12 | YTD PPG scored | {off_lo}…{off_hi} ppg | 38.75% |")
    md.append(
        f"| Defense | −12…+12 | YTD PPG allowed (invert) | {def_lo}…{def_hi} ppg | 38.75% |"
    )
    md.append(
        f"| Special teams | −4…+4 | `2×ret TD + (FG%−{mean_fg_2025:.2f})/8` → 2025 comp endpoints "
        f"| comp {st_comp_lo:.3f}…{st_comp_hi:.3f} | 2.5% |"
    )
    md.append(
        f"| Takeaways | −5…+5 | YTD takeaways per game | {take_lo:g}…{take_hi:g} in {games_prior:g} games | 7.5% |"
    )
    md.append(
        f"| Giveaways | −5…+5 | YTD giveaways per game (fewer is better) | {give_lo:g}…{give_hi:g} in {games_prior:g} games | 12.5% |"
    )
    md.append("")
    md.append(
        "Composite = `(0.3875·off + 0.3875·def + 0.025·st + 0.075·take + 0.125·give) / 1`. "
        "Same weights as the 2025 prior. Take/give rates use the 2025 season totals divided by 17 "
        "as the per-game anchors. League even.\n"
    )
    md.append("## Overall (by composite)\n")
    md.append(
        "| # | Team | n | Off | Def | ST | TAKE | GIVE | Comp | Takes | Gives |"
    )
    md.append("|---|------|--:|----:|----:|---:|-----:|-----:|-----:|------:|------:|")
    for t in teams_out:
        r = t["raw"]
        p = t["pillars"]
        md.append(
            f"| {t['rank']} | {t['abbr']} | {t['n']} | {fmt(p['off'])} | {fmt(p['def'])} | "
            f"{fmt(p['st'])} | {fmt(p['take'])} | {fmt(p['give'])} | {fmt(t['composite'])} | "
            f"{r['takeaways']} | {r['giveaways']} |"
        )

    def topbot(key, label):
        md.append(f"\n## {label}\n")
        if key == "composite":
            ordered = sorted(teams_out, key=lambda t: (-t["composite"], t["abbr"]))
            top = ordered[:5]
            bot = ordered[-5:][::-1]
            md.append("**Top 5:** " + ", ".join(f"{t['abbr']} {fmt(t['composite'])}" for t in top))
            md.append(
                "\n**Bottom 5:** " + ", ".join(f"{t['abbr']} {fmt(t['composite'])}" for t in bot)
            )
        else:
            ordered = sorted(teams_out, key=lambda t: (-t["pillars"][key], t["abbr"]))
            top = ordered[:5]
            bot = ordered[-5:][::-1]
            md.append(
                "**Top 5:** " + ", ".join(f"{t['abbr']} {fmt(t['pillars'][key])}" for t in top)
            )
            md.append(
                "\n**Bottom 5:** "
                + ", ".join(f"{t['abbr']} {fmt(t['pillars'][key])}" for t in bot)
            )

    topbot("composite", "Top / bottom overall")
    for k, lab in [
        ("off", "Offense"),
        ("def", "Defense"),
        ("st", "Special teams"),
        ("take", "Takeaways"),
        ("give", "Giveaways"),
    ]:
        topbot(k, lab)

    md.append("\n## Notes\n")
    md.append("- O/D PPG from `nfl-2026.json` scored finals. ST from `ytd-st-2026.json` (ESPN).")
    md.append(
        "- Takeaways and giveaways from each scored final's ESPN summary. "
        "Giveaways = interceptions thrown + fumbles lost. "
        "Takeaways = the opponent's giveaways (defensive INTs + fumbles recovered)."
    )
    md.append("- 0 FGA → FG% treated as 2025 league mean (neutral).")
    md.append("- Desk `currentRating` uses these five pillars (app.js), same weights as the 2025 prior.")
    md.append(
        "- Files: `data/ytd-rankings-2026.json`, `data/ytd-rankings-2026.md`, "
        "`data/ytd-st-2026.json`, `data/_ytd-to-raw-2026.json`.\n"
    )
    (DATA / "ytd-rankings-2026.md").write_text("\n".join(md) + "\n")

    print("OK scored_games", n_scored)
    print("Top5", [(t["abbr"], t["composite"]) for t in teams_out[:5]])
    print("Bot5", [(t["abbr"], t["composite"]) for t in teams_out[-5:]])
    for a in ["TEN", "NYJ", "SF", "LAR", "DEN", "BUF", "DET"]:
        t = next(x for x in teams_out if x["abbr"] == a)
        print(
            a,
            "n",
            t["n"],
            "off",
            t["pillars"]["off"],
            "def",
            t["pillars"]["def"],
            "st",
            t["pillars"]["st"],
            "take",
            t["pillars"]["take"],
            t["raw"]["takeaways"],
            "give",
            t["pillars"]["give"],
            t["raw"]["giveaways"],
            "comp",
            t["composite"],
            "od_only",
            t["composite_od_only"],
        )


if __name__ == "__main__":
    main()

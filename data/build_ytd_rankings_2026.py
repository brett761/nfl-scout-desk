#!/usr/bin/env python3
"""Build 2026 YTD O/D/ST rankings on the same scale as prior-2025.json pillars."""
from __future__ import annotations

import json
import math
from collections import defaultdict
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

    scored = defaultdict(list)
    for g in nfl["games"]:
        week = g.get("week")
        if not isinstance(week, (int, float)) or week < 1 or week > 18:
            continue
        sc = game_scores(g)
        if not sc:
            continue
        hs, aw = sc
        scored[g["home"]].append(
            {"ptsFor": hs, "ptsAgainst": aw, "week": int(week), "opp": g["away"], "ha": "H"}
        )
        scored[g["away"]].append(
            {"ptsFor": aw, "ptsAgainst": hs, "week": int(week), "opp": g["home"], "ha": "A"}
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
        w_off, w_def, w_st = w["off"], w["def"], w["st"]
        denom = w_off + w_def + w_st
        composite = (w_off * off + w_def * deff + w_st * st_pil) / denom
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
                },
                "pillars": {
                    "off": round2(off),
                    "def": round2(deff),
                    "st": round2(st_pil),
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
    for w in sorted(week_scored):
        sc, tot = week_scored[w], week_total[w]
        if sc == tot:
            slate_parts.append(f"W{w} all {sc}")
        else:
            slate_parts.append(f"W{w} {sc}/{tot}")
    slate = " + ".join(slate_parts) if slate_parts else "no scored games"
    as_of = f"YTD through completed regular-season games ({slate})"
    pulled_et = now.strftime("%b %d, %Y, %I:%M %p ET").replace(" 0", " ")

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
            "composite": {
                "formula": "(0.3875*off + 0.3875*def + 0.025*st) / 0.8",
                "weights_among_rating_pillars": {"off": 0.3875, "def": 0.3875, "st": 0.025},
                "deferred": "takeaways 7.5% and giveaways 12.5% not in YTD current yet",
                "cap": "composite clamped to ±12",
            },
            "prior_full_weights": w,
        },
        "sources": {
            "offense_defense_ppg": "nfl-2026.json scored finals (home_score/away_score)",
            "special_teams": "ytd-st-2026.json from ESPN core team statistics",
            "scale_file": "prior-2025.json",
        },
        "teams": teams_out,
    }
    (DATA / "ytd-rankings-2026.json").write_text(json.dumps(out, indent=2) + "\n")

    def fmt(n):
        return ("+" if n >= 0 else "") + f"{n:.2f}"

    md = []
    md.append("# NFL Scout YTD rankings — 2026 (same scale as 2025 O/D/ST)\n")
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
    md.append("")
    md.append(
        "Composite = `(0.3875·off + 0.3875·def + 0.025·st) / 0.8` (TO deferred). League even.\n"
    )
    md.append("## Overall (by composite)\n")
    md.append(
        "| # | Team | n | Off | Def | ST | Comp | Off PPG | Def PPG | FG% | Ret TD |"
    )
    md.append("|---|------|--:|----:|----:|---:|-----:|--------:|--------:|----:|-------:|")
    for t in teams_out:
        r = t["raw"]
        p = t["pillars"]
        fg = "—" if r["st_fg_pct"] is None else f"{r['st_fg_pct']:.1f}"
        md.append(
            f"| {t['rank']} | {t['abbr']} | {t['n']} | {fmt(p['off'])} | {fmt(p['def'])} | "
            f"{fmt(p['st'])} | {fmt(t['composite'])} | {r['off_ppg']} | {r['def_ppg']} | "
            f"{fg} | {r['st_ret_td']} |"
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
    for k, lab in [("off", "Offense"), ("def", "Defense"), ("st", "Special teams")]:
        topbot(k, lab)

    md.append("\n## Notes\n")
    md.append("- O/D PPG from `nfl-2026.json` scored finals. ST from `ytd-st-2026.json` (ESPN).")
    md.append("- 0 FGA → FG% treated as 2025 league mean (neutral).")
    md.append("- Desk `currentRating` uses these pillars (app.js). Take/give still deferred.")
    md.append(
        "- Files: `data/ytd-rankings-2026.json`, `data/ytd-rankings-2026.md`, `data/ytd-st-2026.json`.\n"
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
            "comp",
            t["composite"],
            "od_only",
            t["composite_od_only"],
        )


if __name__ == "__main__":
    main()

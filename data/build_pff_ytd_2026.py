#!/usr/bin/env python3
"""Pull 2026 REG YTD team offense/defense/ST grades from PFF Pro API.

Writes:
  data/pff-2026-ytd.json
  data/pff-2026-ytd.md

Uses GET /v1/teams/overview?league=nfl&season=2026&week=<played REG weeks>.
Does NOT rewrite pff-2026.json (2025 prior / pff_term).

Scoring (pff_ytd_term → eff / ourHomeLine):
  league means μo/μd/μs from the 32 YTD grades
  grade_per_point = 5, st_weight = 0.15, cap = ±2.0
  net = clamp( (off−μo)/5 + (def−μd)/5 + 0.15*(st−μs)/5 , −2.0, +2.0 )
"""
from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pff_api import desk_abbr, load_api_key, pff_get, reg_weeks_with_stats, week_param

DATA = Path(__file__).resolve().parent
OUT_JSON = DATA / "pff-2026-ytd.json"
OUT_MD = DATA / "pff-2026-ytd.md"
SEASON = 2026
ET = ZoneInfo("America/New_York")

# Mirror 2025 pff-2026.json grade_per_point / cap; ST lightly weighted.
GRADE_PER_POINT = 5.0
CAP = 2.0
ST_WEIGHT = 0.15


def rank_map(rows: list[dict], key: str, *, higher_better: bool = True) -> dict[str, int]:
    scored = [(r["abbr"], r.get(key)) for r in rows if r.get(key) is not None]
    scored.sort(key=lambda x: (-x[1] if higher_better else x[1], x[0]))
    return {abbr: i + 1 for i, (abbr, _) in enumerate(scored)}


def round2(x: float) -> float:
    return round(float(x) + 0.0, 2)


def apply_scoring(teams: dict[str, dict]) -> dict:
    """Attach scoring + per-team net / off_pts / def_pts / st_pts. Mutates teams."""
    offs = [t["grades_offense"] for t in teams.values() if t.get("grades_offense") is not None]
    defs = [t["grades_defense"] for t in teams.values() if t.get("grades_defense") is not None]
    sts = [t["grades_st"] for t in teams.values() if t.get("grades_st") is not None]
    if len(offs) != 32 or len(defs) != 32 or len(sts) != 32:
        raise SystemExit(f"scoring needs 32 grades, got off={len(offs)} def={len(defs)} st={len(sts)}")
    mu_o = sum(offs) / 32
    mu_d = sum(defs) / 32
    mu_s = sum(sts) / 32
    for t in teams.values():
        off_pts = (float(t["grades_offense"]) - mu_o) / GRADE_PER_POINT
        def_pts = (float(t["grades_defense"]) - mu_d) / GRADE_PER_POINT
        st_pts = ST_WEIGHT * (float(t["grades_st"]) - mu_s) / GRADE_PER_POINT
        raw = off_pts + def_pts + st_pts
        net = max(-CAP, min(CAP, raw))
        t["off_pts"] = round2(off_pts)
        t["def_pts"] = round2(def_pts)
        t["st_pts"] = round2(st_pts)
        t["raw"] = round2(raw)
        t["net"] = round2(net)
    return {
        "grade_per_point": GRADE_PER_POINT,
        "cap": CAP,
        "st_weight": ST_WEIGHT,
        "league_offense": round2(mu_o),
        "league_defense": round2(mu_d),
        "league_st": round2(mu_s),
        "n_teams": 32,
        "note": (
            "pff_ytd_term = team.net. "
            "net = clamp((off−μo)/5 + (def−μd)/5 + 0.15*(st−μs)/5, −2.0, +2.0). "
            "Means from all 32 clubs. Does not replace pff_term (2025 same-22)."
        ),
    }


def main() -> None:
    load_api_key()
    weeks = reg_weeks_with_stats(SEASON)
    if not weeks:
        raise SystemExit("No REG weeks with has_stats yet")
    wp = week_param(weeks)

    overview = pff_get(
        "/v1/teams/overview",
        {"league": "nfl", "season": SEASON, "week": wp},
    )
    raw_rows = overview.get("team_overview") or []
    if len(raw_rows) < 32:
        raise SystemExit(f"expected 32 teams, got {len(raw_rows)}")

    teams: dict[str, dict] = {}
    for r in raw_rows:
        pff_ab = (r.get("abbreviation") or "").strip()
        desk = desk_abbr(pff_ab)
        if not desk:
            print("skip unmapped", pff_ab)
            continue
        wins = int(r.get("wins") or 0)
        losses = int(r.get("losses") or 0)
        ties = int(r.get("ties") or 0)
        teams[desk] = {
            "abbr": desk,
            "pff_abbr": pff_ab,
            "franchise_id": r.get("franchise_id"),
            "name": r.get("name"),
            "record": f"{wins}-{losses}" + (f"-{ties}" if ties else ""),
            "wins": wins,
            "losses": losses,
            "ties": ties,
            "points_scored": r.get("points_scored"),
            "points_allowed": r.get("points_allowed"),
            "grades_overall": r.get("grades_overall"),
            "grades_offense": r.get("grades_offense"),
            "grades_defense": r.get("grades_defense"),
            "grades_st": r.get("grades_misc_st"),
            "grades_pass": r.get("grades_pass"),
            "grades_run": r.get("grades_run"),
            "grades_pass_block": r.get("grades_pass_block"),
            "grades_run_block": r.get("grades_run_block"),
            "grades_pass_route": r.get("grades_pass_route"),
            "grades_pass_rush_defense": r.get("grades_pass_rush_defense"),
            "grades_run_defense": r.get("grades_run_defense"),
            "grades_coverage_defense": r.get("grades_coverage_defense"),
            "grades_tackle": r.get("grades_tackle"),
        }

    if len(teams) != 32:
        raise SystemExit(f"desk mapped {len(teams)} teams, need 32: {sorted(teams)}")

    row_list = list(teams.values())
    for field, out_key in [
        ("grades_offense", "rank_offense"),
        ("grades_defense", "rank_defense"),
        ("grades_st", "rank_st"),
        ("grades_overall", "rank_overall"),
    ]:
        ranks = rank_map(row_list, field)
        for abbr, rk in ranks.items():
            teams[abbr][out_key] = rk

    scoring = apply_scoring(teams)

    pulled = datetime.now(ET).strftime("%Y-%m-%d %H:%M ET")
    payload = {
        "season": SEASON,
        "season_type": "REG",
        "weeks": weeks,
        "week_param": wp,
        "pulled": pulled,
        "source": "PFF Pro API GET /v1/teams/overview",
        "endpoint": f"/v1/teams/overview?league=nfl&season={SEASON}&week={wp}",
        "note": (
            "2026 REG YTD team grades. Wired into eff() as pff_ytd_term (team.net). "
            "Does not replace pff-2026.json / pff_term (2025 same-22 prior). "
            "Unfiltered overview includes PRE — always pass REG weeks."
        ),
        "n_teams": len(teams),
        "scoring": scoring,
        "teams": teams,
    }
    OUT_JSON.write_text(json.dumps(payload, indent=2) + "\n")

    by_off = sorted(row_list, key=lambda t: (-(t.get("grades_offense") or 0), t["abbr"]))
    by_def = sorted(row_list, key=lambda t: (-(t.get("grades_defense") or 0), t["abbr"]))
    by_st = sorted(row_list, key=lambda t: (-(t.get("grades_st") or 0), t["abbr"]))
    by_ovr = sorted(row_list, key=lambda t: (-(t.get("grades_overall") or 0), t["abbr"]))
    by_net = sorted(row_list, key=lambda t: (-(t.get("net") or 0), t["abbr"]))

    lines = [
        f"# PFF 2026 REG YTD team grades",
        "",
        f"Pulled: **{pulled}**. Weeks: **{wp}** (REG games with `has_stats`).",
        f"Source: `GET /v1/teams/overview?league=nfl&season={SEASON}&week={wp}`.",
        "",
        "Desk hook: `data/pff-2026-ytd.json` → **`pff_ytd_term` in `eff()` / `ourHomeLine`**. "
        "Does **not** replace `pff-2026.json` / `pff_term` (2025 same-22 prior).",
        "",
        f"Scoring: μo={scoring['league_offense']}, μd={scoring['league_defense']}, "
        f"μs={scoring['league_st']}; grade_per_point={GRADE_PER_POINT}; "
        f"st_weight={ST_WEIGHT}; cap ±{CAP}.",
        "",
        "## Top / bottom net (in the line)",
        "",
        "| Rank | Team | NET | OFF | DEF | ST | Record |",
        "|-----:|:-----|----:|----:|----:|---:|:-------|",
    ]
    for i, t in enumerate(by_net[:5], 1):
        lines.append(
            f"| {i} | {t['abbr']} | {t['net']:+.2f} | {t['grades_offense']} | "
            f"{t['grades_defense']} | {t['grades_st']} | {t['record']} |"
        )
    lines.append("| … | | | | | | |")
    for t in by_net[-5:]:
        lines.append(
            f"| {t.get('rank_overall', '')} | {t['abbr']} | {t['net']:+.2f} | {t['grades_offense']} | "
            f"{t['grades_defense']} | {t['grades_st']} | {t['record']} |"
        )

    lines += [
        "",
        "## Top / bottom offense",
        "",
        "| Rank | Team | OFF | DEF | ST | OVR | Record |",
        "|-----:|:-----|----:|----:|---:|----:|:-------|",
    ]
    for i, t in enumerate(by_off[:5], 1):
        lines.append(
            f"| {i} | {t['abbr']} | {t['grades_offense']} | {t['grades_defense']} | "
            f"{t['grades_st']} | {t['grades_overall']} | {t['record']} |"
        )
    lines.append("| … | | | | | | |")
    for t in by_off[-5:]:
        lines.append(
            f"| {t['rank_offense']} | {t['abbr']} | {t['grades_offense']} | {t['grades_defense']} | "
            f"{t['grades_st']} | {t['grades_overall']} | {t['record']} |"
        )

    lines += ["", "## Top / bottom defense", ""]
    lines.append("| Rank | Team | DEF | OFF | ST | Record |")
    lines.append("|-----:|:-----|----:|----:|---:|:-------|")
    for t in by_def[:5]:
        lines.append(
            f"| {t['rank_defense']} | {t['abbr']} | {t['grades_defense']} | "
            f"{t['grades_offense']} | {t['grades_st']} | {t['record']} |"
        )
    lines.append("| … | | | | | |")
    for t in by_def[-5:]:
        lines.append(
            f"| {t['rank_defense']} | {t['abbr']} | {t['grades_defense']} | "
            f"{t['grades_offense']} | {t['grades_st']} | {t['record']} |"
        )

    lines += ["", "## Top ST", ""]
    lines.append("| Rank | Team | ST | OFF | DEF |")
    lines.append("|-----:|:-----|---:|----:|----:|")
    for t in by_st[:5]:
        lines.append(
            f"| {t['rank_st']} | {t['abbr']} | {t['grades_st']} | "
            f"{t['grades_offense']} | {t['grades_defense']} |"
        )

    lines += [
        "",
        "## Full table (by overall)",
        "",
        "| OVR rk | Team | OVR | OFF | OFF rk | DEF | DEF rk | ST | ST rk | NET | Record |",
        "|-------:|:-----|----:|----:|-------:|----:|-------:|---:|------:|----:|:-------|",
    ]
    for t in by_ovr:
        lines.append(
            f"| {t['rank_overall']} | {t['abbr']} | {t['grades_overall']} | "
            f"{t['grades_offense']} | {t['rank_offense']} | "
            f"{t['grades_defense']} | {t['rank_defense']} | "
            f"{t['grades_st']} | {t['rank_st']} | {t['net']:+.2f} | {t['record']} |"
        )
    lines += [
        "",
        "## Rebuild",
        "",
        "```bash",
        "cd desk/data && python3 build_pff_ytd_2026.py",
        "# needs PFF_API_KEY in env or box-secrets.json card.PFF_API_KEY",
        "```",
        "",
    ]
    OUT_MD.write_text("\n".join(lines) + "\n")

    print("weeks", weeks)
    print("wrote", OUT_JSON, "teams", len(teams))
    print("wrote", OUT_MD)
    print("scoring", scoring)
    print("top NET", [(t["abbr"], t["net"]) for t in by_net[:5]])
    print("bot NET", [(t["abbr"], t["net"]) for t in by_net[-5:]])
    print("top OFF", [(t["abbr"], t["grades_offense"]) for t in by_off[:5]])
    print("bot OFF", [(t["abbr"], t["grades_offense"]) for t in by_off[-5:]])
    print("top DEF", [(t["abbr"], t["grades_defense"]) for t in by_def[:5]])
    print("bot DEF", [(t["abbr"], t["grades_defense"]) for t in by_def[-5:]])


if __name__ == "__main__":
    main()

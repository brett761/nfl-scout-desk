#!/usr/bin/env python3
"""Pull 2026 REG YTD team offense/defense/ST grades from PFF Pro API.

Writes:
  data/pff-2026-ytd.json
  data/pff-2026-ytd.md

Uses GET /v1/teams/overview?league=nfl&season=2026&week=<played REG weeks>.
Does NOT rewrite pff-2026.json (2025 prior / pff_term). Display/current-form only.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pff_api import desk_abbr, load_api_key, pff_get, reg_weeks_with_stats, week_param

DATA = Path(__file__).resolve().parent
OUT_JSON = DATA / "pff-2026-ytd.json"
OUT_MD = DATA / "pff-2026-ytd.md"
SEASON = 2026
ET = ZoneInfo("America/New_York")


def rank_map(rows: list[dict], key: str, *, higher_better: bool = True) -> dict[str, int]:
    scored = [(r["abbr"], r.get(key)) for r in rows if r.get(key) is not None]
    scored.sort(key=lambda x: (-x[1] if higher_better else x[1], x[0]))
    return {abbr: i + 1 for i, (abbr, _) in enumerate(scored)}


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
            "2026 REG YTD team grades. Not wired into pff_term/eff(). "
            "Use for current-form display. Unfiltered overview includes PRE — always pass REG weeks."
        ),
        "n_teams": len(teams),
        "teams": teams,
    }
    OUT_JSON.write_text(json.dumps(payload, indent=2) + "\n")

    by_off = sorted(row_list, key=lambda t: (-(t.get("grades_offense") or 0), t["abbr"]))
    by_def = sorted(row_list, key=lambda t: (-(t.get("grades_defense") or 0), t["abbr"]))
    by_st = sorted(row_list, key=lambda t: (-(t.get("grades_st") or 0), t["abbr"]))
    by_ovr = sorted(row_list, key=lambda t: (-(t.get("grades_overall") or 0), t["abbr"]))

    lines = [
        f"# PFF 2026 REG YTD team grades",
        "",
        f"Pulled: **{pulled}**. Weeks: **{wp}** (REG games with `has_stats`).",
        f"Source: `GET /v1/teams/overview?league=nfl&season={SEASON}&week={wp}`.",
        "",
        "Desk hook: `data/pff-2026-ytd.json` (display / current form). "
        "Does **not** replace `pff-2026.json` / `pff_term` (2025 same-22 prior).",
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
    for i, t in enumerate(by_off[-5:], 28):
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
        "| OVR rk | Team | OVR | OFF | OFF rk | DEF | DEF rk | ST | ST rk | Record |",
        "|-------:|:-----|----:|----:|-------:|----:|-------:|---:|------:|:-------|",
    ]
    for t in by_ovr:
        lines.append(
            f"| {t['rank_overall']} | {t['abbr']} | {t['grades_overall']} | "
            f"{t['grades_offense']} | {t['rank_offense']} | "
            f"{t['grades_defense']} | {t['rank_defense']} | "
            f"{t['grades_st']} | {t['rank_st']} | {t['record']} |"
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
    print("top OFF", [(t["abbr"], t["grades_offense"]) for t in by_off[:5]])
    print("bot OFF", [(t["abbr"], t["grades_offense"]) for t in by_off[-5:]])
    print("top DEF", [(t["abbr"], t["grades_defense"]) for t in by_def[:5]])
    print("bot DEF", [(t["abbr"], t["grades_defense"]) for t in by_def[-5:]])


if __name__ == "__main__":
    main()

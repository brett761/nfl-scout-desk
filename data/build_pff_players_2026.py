#!/usr/bin/env python3
"""Build durable 2026 PFF player SQLite DB from Pro API.

Primary: GET /v2/nfl/teams/{slug}/roster?season=2026 for all 32 clubs.
Enrich: facet offense/defense/special summaries for REG YTD weeks.

Outputs:
  data/pff-players-2026.sqlite
  data/pff-players-2026-index.json
  data/pff-players-2026-README.md
"""
from __future__ import annotations

import json
import sqlite3
import sys
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pff_api import desk_abbr, load_api_key, pff_get, reg_weeks_with_stats, week_param

DATA = Path(__file__).resolve().parent
DB_PATH = DATA / "pff-players-2026.sqlite"
INDEX_PATH = DATA / "pff-players-2026-index.json"
README_PATH = DATA / "pff-players-2026-README.md"
SEASON = 2026
ET = ZoneInfo("America/New_York")

SCHEMA_SQL = """
PRAGMA journal_mode=WAL;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS meta;

CREATE TABLE meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE teams (
  franchise_id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL,
  pff_abbr TEXT NOT NULL,
  desk_abbr TEXT NOT NULL,
  name TEXT,
  city TEXT,
  nickname TEXT
);

CREATE TABLE players (
  player_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  team TEXT,              -- desk abbr
  pff_abbr TEXT,
  franchise_id INTEGER,
  position TEXT,
  alignment TEXT,
  unit TEXT,
  jersey TEXT,
  depth_order INTEGER,
  grade REAL,
  grade_rank INTEGER,
  grade_rank_of INTEGER,
  height INTEGER,
  weight INTEGER,
  birth_date TEXT,
  status TEXT,
  snap_counts INTEGER,
  snap_pct REAL,
  grades_offense REAL,
  grades_defense REAL,
  grades_special REAL,
  snaps_offense INTEGER,
  snaps_defense INTEGER,
  snaps_special INTEGER,
  player_game_count INTEGER,
  season INTEGER NOT NULL,
  name_norm TEXT,         -- lower stripped for injury/name match
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_players_team ON players(team);
CREATE INDEX idx_players_name_norm ON players(name_norm);
CREATE INDEX idx_players_pos ON players(position);
CREATE INDEX idx_players_unit ON players(unit);
"""


def norm_name(name: str | None) -> str:
    if not name:
        return ""
    return " ".join(str(name).lower().split())


def row_dict(columns: list[dict], row) -> dict:
    """Map roster row (list or dict) to key→value using columns metadata."""
    if isinstance(row, dict):
        return row
    keys = [c["key"] for c in columns]
    return {keys[i]: row[i] if i < len(row) else None for i in range(len(keys))}


def fetch_teams() -> list[dict]:
    data = pff_get("/v1/teams", {"league": "nfl", "season": SEASON})
    return data.get("teams") or []


def fetch_roster(slug: str) -> dict:
    return pff_get(f"/v2/nfl/teams/{slug}/roster", {"season": SEASON})


def facet_by_player(path: str, list_key: str, weeks: list[int]) -> dict[int, dict]:
    data = pff_get(
        path,
        {"league": "nfl", "season": SEASON, "week": week_param(weeks)},
        timeout=180,
    )
    rows = data.get(list_key) or []
    out: dict[int, dict] = {}
    for r in rows:
        pid = r.get("player_id")
        if pid is None:
            continue
        out[int(pid)] = r
    return out


def main() -> None:
    load_api_key()
    weeks = reg_weeks_with_stats(SEASON)
    if not weeks:
        raise SystemExit("No REG weeks with stats")
    pulled = datetime.now(ET).strftime("%Y-%m-%d %H:%M ET")
    print("weeks", weeks)

    team_rows = fetch_teams()
    if len(team_rows) != 32:
        raise SystemExit(f"expected 32 teams, got {len(team_rows)}")

    # Facet enrichments (league-wide YTD)
    print("facet offense…")
    off = facet_by_player("/v1/facet/offense/summary", "offense_summary", weeks)
    time.sleep(0.4)
    print("facet defense…")
    deff = facet_by_player("/v1/facet/defense/summary", "defense_summary", weeks)
    time.sleep(0.4)
    print("facet special…")
    try:
        special = facet_by_player("/v1/facet/special/summary", "special_teams_summary", weeks)
    except Exception as e:
        print("special facet skip:", type(e).__name__, str(e)[:120])
        special = {}
    print("facet counts", len(off), len(deff), len(special))

    if DB_PATH.exists():
        DB_PATH.unlink()
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA_SQL)
    cur = conn.cursor()

    cur.execute("INSERT INTO meta(key,value) VALUES(?,?)", ("season", str(SEASON)))
    cur.execute("INSERT INTO meta(key,value) VALUES(?,?)", ("weeks", week_param(weeks)))
    cur.execute("INSERT INTO meta(key,value) VALUES(?,?)", ("pulled", pulled))
    cur.execute(
        "INSERT INTO meta(key,value) VALUES(?,?)",
        ("source", "PFF Pro API roster + facet summaries"),
    )

    players_upsert: dict[int, dict] = {}
    roster_total = 0

    for i, t in enumerate(sorted(team_rows, key=lambda x: x.get("abbreviation") or "")):
        pff_ab = (t.get("abbreviation") or "").strip()
        desk = desk_abbr(pff_ab)
        if not desk:
            print("skip team", pff_ab)
            continue
        fid = int(t["franchise_id"])
        slug = t["slug"]
        cur.execute(
            "INSERT OR REPLACE INTO teams(franchise_id,slug,pff_abbr,desk_abbr,name,city,nickname) "
            "VALUES(?,?,?,?,?,?,?)",
            (
                fid,
                slug,
                pff_ab,
                desk,
                f"{t.get('city','')} {t.get('nickname','')}".strip(),
                t.get("city"),
                t.get("nickname"),
            ),
        )
        time.sleep(0.25)
        rost = fetch_roster(slug)
        cols = rost.get("columns") or []
        rows = rost.get("rows") or []
        roster_total += len(rows)
        print(f"  [{i+1}/32] {desk} {slug} n={len(rows)}")
        for raw in rows:
            r = row_dict(cols, raw)
            pid = r.get("playerId")
            if pid is None:
                continue
            pid = int(pid)
            name = r.get("name") or ""
            unit = (r.get("unit") or "").lower() or None
            entry = {
                "player_id": pid,
                "name": name,
                "team": desk,
                "pff_abbr": pff_ab,
                "franchise_id": fid,
                "position": r.get("position"),
                "alignment": r.get("alignment"),
                "unit": unit,
                "jersey": str(r.get("jersey") or "") or None,
                "depth_order": r.get("depthOrder"),
                "grade": r.get("grade"),
                "grade_rank": r.get("gradeRank"),
                "grade_rank_of": r.get("gradeRankOf"),
                "height": r.get("height"),
                "weight": r.get("weight"),
                "birth_date": r.get("birthDate"),
                "status": r.get("status"),
                "snap_counts": r.get("snapCounts"),
                "snap_pct": r.get("snapPct"),
                "grades_offense": None,
                "grades_defense": None,
                "grades_special": None,
                "snaps_offense": None,
                "snaps_defense": None,
                "snaps_special": None,
                "player_game_count": None,
                "season": SEASON,
                "name_norm": norm_name(name),
                "updated_at": pulled,
            }
            o = off.get(pid)
            if o:
                entry["grades_offense"] = o.get("grades_offense")
                entry["snaps_offense"] = o.get("snap_counts_total")
                entry["player_game_count"] = o.get("player_game_count")
                if entry["grade"] is None and o.get("grades_offense") is not None:
                    entry["grade"] = o.get("grades_offense")
            d = deff.get(pid)
            if d:
                entry["grades_defense"] = d.get("grades_defense")
                entry["snaps_defense"] = d.get("snap_counts_defense") or d.get("snap_counts_total")
                if entry["player_game_count"] is None:
                    entry["player_game_count"] = d.get("player_game_count")
                if entry["grade"] is None and d.get("grades_defense") is not None:
                    entry["grade"] = d.get("grades_defense")
            s = special.get(pid)
            if s:
                entry["grades_special"] = (
                    s.get("grades_special_teams")
                    or s.get("grades_misc_st")
                    or s.get("grades_special")
                )
                entry["snaps_special"] = s.get("snap_counts_special_teams") or s.get(
                    "snap_counts_total"
                )
            players_upsert[pid] = entry

    # Also add facet-only players not on a depth chart (rare)
    for pid, o in off.items():
        if pid in players_upsert:
            continue
        desk = desk_abbr(o.get("team"))
        players_upsert[pid] = {
            "player_id": pid,
            "name": o.get("player") or "",
            "team": desk,
            "pff_abbr": o.get("team"),
            "franchise_id": o.get("franchise_id"),
            "position": o.get("position"),
            "alignment": None,
            "unit": "offense",
            "jersey": str(o.get("jersey_number") or "") or None,
            "depth_order": None,
            "grade": o.get("grades_offense"),
            "grade_rank": None,
            "grade_rank_of": None,
            "height": None,
            "weight": None,
            "birth_date": None,
            "status": None,
            "snap_counts": o.get("snap_counts_total"),
            "snap_pct": None,
            "grades_offense": o.get("grades_offense"),
            "grades_defense": None,
            "grades_special": None,
            "snaps_offense": o.get("snap_counts_total"),
            "snaps_defense": None,
            "snaps_special": None,
            "player_game_count": o.get("player_game_count"),
            "season": SEASON,
            "name_norm": norm_name(o.get("player")),
            "updated_at": pulled,
        }
    for pid, d in deff.items():
        if pid in players_upsert:
            continue
        desk = desk_abbr(d.get("team"))
        players_upsert[pid] = {
            "player_id": pid,
            "name": d.get("player") or "",
            "team": desk,
            "pff_abbr": d.get("team"),
            "franchise_id": d.get("franchise_id"),
            "position": d.get("position"),
            "alignment": None,
            "unit": "defense",
            "jersey": str(d.get("jersey_number") or "") or None,
            "depth_order": None,
            "grade": d.get("grades_defense"),
            "grade_rank": None,
            "grade_rank_of": None,
            "height": None,
            "weight": None,
            "birth_date": None,
            "status": None,
            "snap_counts": d.get("snap_counts_defense") or d.get("snap_counts_total"),
            "snap_pct": None,
            "grades_offense": None,
            "grades_defense": d.get("grades_defense"),
            "grades_special": None,
            "snaps_offense": None,
            "snaps_defense": d.get("snap_counts_defense") or d.get("snap_counts_total"),
            "snaps_special": None,
            "player_game_count": d.get("player_game_count"),
            "season": SEASON,
            "name_norm": norm_name(d.get("player")),
            "updated_at": pulled,
        }

    cols = [
        "player_id",
        "name",
        "team",
        "pff_abbr",
        "franchise_id",
        "position",
        "alignment",
        "unit",
        "jersey",
        "depth_order",
        "grade",
        "grade_rank",
        "grade_rank_of",
        "height",
        "weight",
        "birth_date",
        "status",
        "snap_counts",
        "snap_pct",
        "grades_offense",
        "grades_defense",
        "grades_special",
        "snaps_offense",
        "snaps_defense",
        "snaps_special",
        "player_game_count",
        "season",
        "name_norm",
        "updated_at",
    ]
    placeholders = ",".join("?" * len(cols))
    sql = f"INSERT OR REPLACE INTO players({','.join(cols)}) VALUES({placeholders})"
    for p in players_upsert.values():
        cur.execute(sql, [p.get(c) for c in cols])

    conn.commit()

    n_players = cur.execute("SELECT COUNT(*) FROM players").fetchone()[0]
    n_teams = cur.execute("SELECT COUNT(*) FROM teams").fetchone()[0]
    by_team = dict(
        cur.execute(
            "SELECT team, COUNT(*) FROM players WHERE team IS NOT NULL GROUP BY team ORDER BY team"
        ).fetchall()
    )
    with_grade = cur.execute(
        "SELECT COUNT(*) FROM players WHERE grade IS NOT NULL"
    ).fetchone()[0]
    conn.close()

    index = {
        "season": SEASON,
        "weeks": weeks,
        "pulled": pulled,
        "db": "pff-players-2026.sqlite",
        "n_players": n_players,
        "n_teams": n_teams,
        "roster_rows_fetched": roster_total,
        "facet_offense": len(off),
        "facet_defense": len(deff),
        "facet_special": len(special),
        "players_with_grade": with_grade,
        "by_team": by_team,
        "endpoints": [
            "GET /v1/teams?league=nfl&season=2026",
            "GET /v2/nfl/teams/{slug}/roster?season=2026",
            f"GET /v1/facet/offense/summary?league=nfl&season=2026&week={week_param(weeks)}",
            f"GET /v1/facet/defense/summary?league=nfl&season=2026&week={week_param(weeks)}",
            f"GET /v1/facet/special/summary?league=nfl&season=2026&week={week_param(weeks)}",
        ],
        "schema": {
            "players": cols,
            "teams": [
                "franchise_id",
                "slug",
                "pff_abbr",
                "desk_abbr",
                "name",
                "city",
                "nickname",
            ],
            "meta": ["key", "value"],
        },
        "name_match": "Use name_norm (lower, collapsed whitespace) + team + position for injury matching. Key is player_id (PFF).",
    }
    INDEX_PATH.write_text(json.dumps(index, indent=2) + "\n")

    readme = f"""# PFF players 2026

Durable player store for the nfl-scout desk.

| | |
|--|--|
| DB | `pff-players-2026.sqlite` |
| Index | `pff-players-2026-index.json` |
| Season | {SEASON} REG weeks {week_param(weeks)} |
| Pulled | {pulled} |
| Players | {n_players} |
| Teams | {n_teams} |
| With unit grade | {with_grade} |

## Schema (`players`)

- `player_id` — PFF id (PK)
- `name`, `name_norm` — display + match key
- `team` — desk abbr (ARI…WSH); `pff_abbr` — PFF code (ARZ/BLT/…)
- `position`, `alignment`, `unit`, `jersey`, `depth_order`
- `grade`, `grade_rank`, `grade_rank_of` — roster unit grade
- `grades_offense` / `grades_defense` / `grades_special` + snap columns from facet YTD
- `height`, `weight`, `birth_date`, `status` — injury/name matching helpers
- `season`, `updated_at`

## Rebuild

```bash
cd desk/data
python3 build_pff_players_2026.py
# PFF_API_KEY from env or /home/box/agent-data/box-secrets.json (never commit)
```

Requires Pro tier. Rate-limits politely; retries HTTP 429.
"""
    README_PATH.write_text(readme)

    print("wrote", DB_PATH, "players", n_players, "teams", n_teams)
    print("by_team min/max", min(by_team.values()), max(by_team.values()))
    print("wrote", INDEX_PATH, README_PATH)


if __name__ == "__main__":
    main()

# PFF players 2026

Durable player store for the nfl-scout desk.

| | |
|--|--|
| DB | `pff-players-2026.sqlite` |
| Index | `pff-players-2026-index.json` |
| Season | 2026 REG weeks 1,2 |
| Pulled | 2026-09-18 11:40 ET |
| Players | 1637 |
| Teams | 32 |
| With unit grade | 1291 |

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

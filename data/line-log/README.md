# Line log — daily B$ snapshots

One JSON file per NFL week. The desk grid is **Mon → Sun**. Empty days stay `null` and render as **—**. Do not invent a B$ Line.

## Files

- `index.json` — season index (`current_week`, week file list)
- `YYYY-Www.json` — that week’s grid (`2026-W02.json`)

Sign convention matches the locks: `b_money` and `street` are **home-centric** (negative = home favorite). The site formats them the same way Games does (`NE −5.5`, not a raw signed number).

## When to append

Write a day cell only when a real desk artifact exists.

| Day | What lands | Typical source |
|-----|------------|----------------|
| **Mon** | Street openers (B$ only if the Monday routine computed one) | `data/openers/YYYY-MM-DD-weekN-monday.json` |
| **Tue** | Usually empty | Midweek working note, if we actually freeze |
| **Wed** | TNF lock after the 4pm ET report | `data/postmortem/locks/YYYY-wNN-*.json` · `window=TNF` |
| **Thu** | Thursday restamp (rare) | Same lock folder if `frozen_at` is Thursday |
| **Fri** | Friday Game Status freeze (Sunday card) | Lock `sunday_am_vs_friday.fri_model` / Friday freeze |
| **Sat** | Saturday working injury restamp | Only if a model number was actually recomputed |
| **Sun** | Sunday AM lock / public-dogs refresh | Lock `model_home_spread` + `frozen_at` Sunday |

Map TNF / Fri / Sun by `frozen_at` and `window`. A Wednesday TNF freeze goes in **wed**, not Thursday kickoff.

## Day cell

```json
{
  "b_money": 2.57,
  "street": -5.5,
  "as_of": "2026-09-18 4:38 PM ET",
  "note": "Fri Game Status"
}
```

- `b_money` may be `null` when we only have street (Monday openers). The grid still shows **—**.
- Omit the whole day (`null`) when there is no snapshot.

## Changes

When two filled B$ numbers differ, add a `changes[]` row (`from_day` → `to_day`, `from`, `to`, `delta` = to − from). `why` is sourced, not guessed:

- `injury` — designation flip or priced player (team, player, status, detail)
- `lock` — stamp / refresh note (`2026-09-20a`, Fri card retained, etc.)
- `street` — book move worth mentioning next to the model move

If the number did not move, do not invent a click. Flowers OUT with `Δm=0` stays a Sunday note, not a fake delta.

## Week 2 seed (2026)

Sparse on purpose:

- **Mon** — ESPN DraftKings board `2026-09-14-week2-monday.json` (street only)
- **Wed** — DET@BUF TNF lock (`2026-09-16b`)
- **Fri / Sun** — Sunday-card locks; Friday from `sunday_am_vs_friday`, Sunday from `model_home_spread` at `2026-09-20 10:45 AM ET` (`injury_pulled=2026-09-20a`)
- **Tue / Thu / Sat** — no model snapshot on file

Rebuild later weeks the same way. Honesty over a dense fake grid.

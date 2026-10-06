# Street line history

`line-history-2026.json` is our own open, midweek, and close record for every game. Spreads are home-centric. Negative means the home team is favored. The B$ line is not stored here.

The ATS board reads this file for open and close. Current still comes from the live board in `data/nfl-2026.json`, the same number Games shows.

## Append a snapshot

Daily line refresh, after `data/nfl-2026.json` has the new street:

```bash
node data/lines/append_line_snapshot.mjs --tag mid --week 4
```

Monday opener file:

```bash
node data/lines/append_line_snapshot.mjs --tag open --week 4 --from data/openers/2026-09-28-week4-monday.json
```

Pre-kick lock, once the close is in a closes file or a lock (`close_spread` or `close_at_lock`):

```bash
node data/lines/append_line_snapshot.mjs --tag close --week 4 --from data/closes/2026-w04.json
```

The same tag is skipped when its latest spread is unchanged. `--force` appends anyway.

Every snapshot gets a timestamp. From a file it is the row's own stamp, else the file's capture time (`pulled`, then `pulled_et` such as `2026-10-05 8:25 AM ET`), else `--at`, else the current time. A null `at` is never written, and `node data/model/check_model_history.mjs` fails if one is in this file. Self-test: `node data/lines/append_line_snapshot.mjs --self-test`.

## Backfill

Weeks 1–4 were filled from openers, the line log, closes files, pre-kick locks, and `data/published/finals.json`:

```bash
node data/lines/append_line_snapshot.mjs --backfill
```

That rewrites the file. One open (the earliest logged number), midweek moves, and one close (the published close when finals has it).

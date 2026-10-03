# Published B Lines

Append-only snapshots of the B Line the desk actually published. The Games page reads this file for a finished game. Bet History and Overall Record read `data/record/canonical-2026.json`. They do not recompute the number from today's model.

## What gets in

`build_published_lines.mjs` joins:

- `data/postmortem/locks/` — the B Line (`model_home_spread`) and the publish time (`frozen_at`)
- `data/nfl-2026.json` — final score and `status: FINAL`
- `data/closes/` and `data/postmortem/weeks/*-results.json` — opening and closing market lines when a post-final pull exists
- `data/openers/` — opening line only when it is a single `street_home` number

A game is written only when the schedule says FINAL and a per-game lock matches the same week and the same teams. Freeze notes are skipped. Unplayed games are skipped. A null, reconstructed, or post-final lock is stored with that flag. The builder does not invent a number to fill the gap.

Week 3 closes are `lock.close_at_lock` (the pre-kick street on the freeze). Weeks 1 and 2 use the post-final closes files. There is no Week 3 closes file in the repo.

## Immutability

`finals.json` has two lists:

- `board` — the row the site shows, pinned the first time that game is published
- `versions` — every snapshot, including ones that arrived later

The first run creates both. Later runs append a version only when the identity changes (line, publish time, quality, score, open, close). They never edit a pinned board row. Rebuilding with no new identity prints `unchanged` and does not touch the file.

Each row has `content_sha256` over a canonical JSON form of the row (every key except the hash itself). The fingerprint stays on these pinned fields. Bet Outcomes, Bet History, and finished games on the Games page grade a separate game-day B$ line: the latest `bs-line-history` version whose source starts with `game-day site compute`, falling back to `b_line_home_spread` when there isn’t one. That overlay is not written into this file. A future model change does not move a pinned row.

`replay` is the component points copied off that lock so the admin sandbox can adjust those stored points. Identity (no adjustment) matches `b_line_home_spread`. The sandbox does not call `ourHomeSpread`.

## Future weeks

When a week is final and its locks are in `data/postmortem/locks/`:

```bash
node data/published/build_published_lines.mjs
```

Commit the file. No page change is required. The public pages only render `status: FINAL`.

## Tuesday power ranking

`power-rankings.json` is a frozen weekly snapshot of the desk B$ team rating. Home shows the latest week's top 10. It does not call `eff()` in the browser.

```bash
node data/published/build_power_rankings.mjs
```

Run that on Tuesday, after the injury and YTD refresh, then commit the file. The script ranks all 32 clubs with the current `app.js` math (`INCLUDE_FA` false, `INCLUDE_PFF_PRESEASON` false, prior taper, YTD pillars) and replaces that week if you run it again. Ranks and records only. No rating points.

A backfill uses an older `data/` tree and the current math:

```bash
node data/published/build_power_rankings.mjs --data-root /path/to/snap --week 3 --generated-at 2026-09-23T12:02:48-04:00 --backfill
```

Week 3 in this file is that backfill: `data/` from `fbe26e2` (Week 1 and Week 2 finals on the books, Week 3 not yet scored).

## Supabase

`supabase/migrations/20260929180000_published_lines.sql` is the server copy of the same idea: append-only `published_lines` (no update, no delete), a public read limited to FINAL rows, and append-only `model_experiments` for admin sandbox saves. It is not applied by the site. Until it is applied, the git file is the record. After it is applied, a FINAL row that is not already on the board can show up; a row already pinned in git is not replaced.

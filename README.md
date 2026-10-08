# NFL Scout · The Desk · 2026

Brett Cunningham process desk. Billy Walters rules on a $1,000 week.
Not a sportsbook. Not a dashboard. The card is blank until Week 1 is real.

## Open

Double-click index.html

or, from this folder, run: python3 -m http.server 8765
Then open http://localhost:8765
Google Fonts need a network the first time.

## What it is
- Desk: week KPIs and the Tuesday Top 10. Sample tickets never count toward 2026.
- Clock: week timeline. Folklore labeled. Action in plain English.
- Playbook: COPY / ENTERTAINMENT / ADAPT / IGNORE.
- Tickets: live ledger in localStorage key nflScout.tickets.v1.

Season 2026. Default week 1. Do not invent matchups, lines, or scores.
Load SAMPLE only to see the UI move. Those rows are season EXAMPLE.

Process is scored on CLV of straights. Profit is variance. Entertainment stays on the card.
No build step. Open the HTML file directly.

## Published B Lines

Bet History and Overall Record read `data/record/canonical-2026.json`. Both stay behind sign-in. The official set starts at Week 2. Week 1 is excluded. Weeks 2 and 3 B$ lines are the game-day versions in `data/model/bs-line-history-2026.json` and are not rounded. From Week 4 the official line is the locked raw projection rounded to the nearest 0.5 (exact .25 and .75 away from zero), stored beside the raw number. The Games page and the B$ Daily publish that rounded line through `data/record/round_half.mjs`. The lock files are not rewritten. A finished week is added with `data/record/weekly.mjs` after the score and the DraftKings close are on file. See `data/record/README.md`. Rebuild and check with:

```bash
node data/record/build_canonical.mjs
node data/record/validate_record.mjs
```

The Games page still grades a finished game from the latest `game-day site compute` version, and falls back to the pinned row in `data/published/finals.json` when that version is missing. The pinned file is not rewritten. After a week is final and its locks are in `data/postmortem/locks/`:

```bash
node data/published/build_published_lines.mjs
```

See `data/published/README.md`. The Supabase migration in `supabase/migrations/` is applied by hand. It is not run by the site.

## Tuesday shadow ratings, then the power ranking

B$ DVOA is a shadow rating. It does not change the B$ line. After the nflverse overnight update (about 5:00 AM ET) and before the 11:16 AM ET power-rankings run:

```bash
python3 data/dvoa/build_bs_dvoa.py --week 4
node data/published/build_power_rankings.mjs
```

Use the week you are rating. See `data/dvoa/README.md`. Street open, midweek, and close history is `data/lines/line-history-2026.json`. The daily refresh appends with `node data/lines/append_line_snapshot.mjs --tag mid --week 4`. See `data/lines/README.md`.

Published B$ lines are append-only in `data/model/bs-line-history-2026.json`. A correction is a new version. `node data/model/append_model_snapshot.mjs --week 4` appends. `node data/model/check_model_history.mjs` fails if a published version was edited or deleted. See `data/model/README.md`.

`BET_HISTORY_PUBLIC` in `auth.js` stays false. A signed-out visitor still sees only the public home. Direct links to Bet History or Overall Record do not open those pages until sign-in.

## Tuesday power ranking

Home reads `data/published/power-rankings.json`. It does not recompute the rating. After the Tuesday injury and YTD refresh:

```bash
node data/published/build_power_rankings.mjs
```

That ranks all 32 clubs with the live desk B$ rating (`eff()` in `app.js`: PFF preseason and 2026 FA off, 2025 prior tapered, YTD pillars in) and appends the week. The file stores rank, record, and identity. It does not store rating points. Commit the JSON.

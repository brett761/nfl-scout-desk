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

Bet Outcomes, public Bet History, and the B$ Line on a finished game read `data/published/finals.json`. That file is a pinned snapshot, not a live recompute. After a week is final and its locks are in `data/postmortem/locks/`:

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

Bet History (signed in) grades the ticket ledger: ATS at the line taken, closing line value, and underdog calls. The one-line switch is `BET_HISTORY_PUBLIC` in `auth.js`. It stays false, so a signed-out visitor still sees only the public home.

## Tuesday power ranking

Home reads `data/published/power-rankings.json`. It does not recompute the rating. After the Tuesday injury and YTD refresh:

```bash
node data/published/build_power_rankings.mjs
```

That ranks all 32 clubs with the live desk B$ rating (`eff()` in `app.js`: PFF preseason and 2026 FA off, 2025 prior tapered, YTD pillars in) and appends the week. The file stores rank, record, and identity. It does not store rating points. Commit the JSON.

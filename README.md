# NFL Scout · The Desk · 2026

Brett Cunningham process desk. Billy Walters rules on a $1,000 week.
Not a sportsbook. Not a dashboard. The card is blank until Week 1 is real.

## Open

Double-click index.html

or, from this folder, run: python3 -m http.server 8765
Then open http://localhost:8765
Google Fonts need a network the first time.

## What it is
- Desk: week KPIs. Sample tickets never count toward 2026.
- Card: five windows. Straight $150 process. Parlay $50 entertainment. PASS is a result.
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

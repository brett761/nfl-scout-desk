# Published B$ line history

`bs-line-history-2026.json` is the append-only record of every published B$ line. A correction is a new version. An existing version is never edited and never deleted.

Each version has a game id, week, version number, `published_at`, source, commit, the B$ line, the market spread and total at that moment, and a `supersedes` pointer. Spreads are home-centric. Negative means the home team is favored.

Backfilled rows are marked `backfilled: true`. The timestamp is the best one on the lock (`frozen_at`), otherwise the commit time. Week 4 has no lock file yet, so that version is the desk `ourHomeSpread` from `data/site_parity_harness.mjs` at backfill, with the latest street snapshot from `data/lines/line-history-2026.json`.

Weeks 1–3 come from git history of `data/postmortem/locks/`. When a lock stores `model_home_spread_corrected` and it differs from the frozen number, that correction is the next version. The market is the line-history snapshot at or before `published_at`, then the number on the lock, then `data/nfl-2026.json` at that commit.

Street open, mid, and close ticks stay in `data/lines/line-history-2026.json`. This file does not copy every midweek move.

## Append

After a new publish, or when the desk line or the street has moved:

```bash
node data/model/append_model_snapshot.mjs --week 4
```

The same B$ line and the same market spread and total are skipped. A change is version N+1. The script throws if it would modify or delete a version already in the file.

`--week` skips games that are already played: FINAL in `data/nfl-2026.json` or `data/published/finals.json`, or past kickoff (in progress counts). It prints the skipped games. `--now <ISO>` pins the clock. `--backfill` and `--game-day` are unchanged, since they record pre-kick lines for finished games on purpose. Self-test: `node data/model/append_model_snapshot.mjs --self-test`.

Rebuild the backfill only against an empty file. Once versions exist, `--backfill` refuses to rewrite them:

```bash
node data/model/append_model_snapshot.mjs --backfill
```

## Check

Fails if any version that was in the previous commit was edited or deleted, if a version has no `published_at`, or if any street snapshot in `data/lines/line-history-2026.json` has a missing, null, or non-ISO `at`. A newly appended version is allowed. Also checks that version numbers run 1..n and `supersedes` points at the previous version.

```bash
node data/model/check_model_history.mjs
node data/model/check_model_history.mjs --self-test
```

## Game-day lines

The number a visitor saw at kickoff is the site's own `ourHomeSpread` at the main commit whose Pages deploy was live then. `game_day_harness.mjs` runs a checkout's `app.js` in a Node vm with file-backed fetch, the clock pinned to a given instant, and empty localStorage (default profile, HFA 2):

```bash
git worktree add --detach /tmp/live <commit>
node data/model/game_day_harness.mjs /tmp/live 2026-09-27T16:55:00Z 401872950
```

`game-day-lines-2026-w02-w03.json` holds those runs for every Week 2 and Week 3 game (commit, commit time, Pages deploy time, kick, line). Append them as new versions:

```bash
node data/model/append_model_snapshot.mjs --game-day data/model/game-day-lines-2026-w02-w03.json
```

Each becomes version N+1 with source `game-day site compute @<commit>`, `published_at` at the live commit's time, and `supersedes` at the prior version. Re-running is a no-op.

Finished games on the Games page grade the latest of those versions. The close stays the one on the pinned `finals.json` row. ATS and better-position use the same rules as the pinned grade. A game with no game-day version stays on the pinned lock. The pinned row is not edited. Bet History and Overall Record use that same game-day line for Weeks 2 and 3 and do not round it. The admin sandbox still compares experiments with that pinned lock, so the frozen replay stays the production baseline.

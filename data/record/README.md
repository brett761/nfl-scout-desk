# Official B$ record

Bet History and Overall Record both read `canonical-2026.json`. Week 1 is never in that file. Weeks 2 and 3 official lines are the game-day numbers already used for grading. They are not rounded, and `weeks-2-3-immutable.json` fails the check if one of them moves.

From Week 4 the official line is the locked raw projection rounded to the nearest 0.5. Halfway cases go away from zero. The raw number stays on the row. Lock files are not edited.

The sportsbook of record is ESPN DraftKings.

## Each new week

The live model is a separate step. This workflow does not recompute it.

1. Lock the official B$ line before kickoff. The freeze scripts write `data/postmortem/locks/2026-wNN-*.json`. `model_home_spread` is the raw line. Leave that file alone after it is published.
2. After the games are final, confirm `data/nfl-2026.json` has `status: "FINAL"` and both scores.
3. Pull the post-final DraftKings close, append it, grade, and rebuild:

```bash
node data/record/weekly.mjs --week 5
```

That command:

- writes `data/closes/2026-wNN.json` from the ESPN DraftKings pickcenter home open/close (same source family as Week 2)
- appends a `close` snapshot on `data/lines/line-history-2026.json`
- rebuilds `canonical-2026.json`
- runs `validate_record.mjs`

A game with a final score and a DraftKings close moves into `games` with `in_official_record: true`. Bet History and Overall Record recalculate from that list. A game missing a close stays in `pending_locks` and is named in the validation output. The lock-time street is not used as the close.

`--no-pull` keeps the closes file already on disk. `--pull` refreshes it.

Home stays the frozen Top 10. It does not grow a live lines board from this file. Pregame line and result both stay on the canonical row: `official_b_line` is the published number, and `ats` / the score are the result.

## Checks

```bash
node data/record/build_canonical.mjs
node data/record/validate_record.mjs
```

Validation fails if a Weeks 2–3 official line, close, score, or ATS result differs from `weeks-2-3-immutable.json`, if a Week 4+ official line is not the rounded lock, or if a final locked game is still waiting.

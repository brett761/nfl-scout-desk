# Injury trench health (shadow)

**Shadow only.** Nothing in this folder feeds the B$ line. The live injury term is still
`injuryTerm()` in `app.js` (impact × status, team cap 6.0). The game sheet's **Injury math**
panel reads these files to show the proposed trench weighting next to Live, labelled
"Proposed (shadow, not in line)".

## Proposed weighting

Front seven and offensive line only. Every other position stays on Live pricing.

- **Points** = position value × snap weight × P(sits)
- **Position value:** DL/DT 0.9, EDGE/LB 0.7, T 1.0, G/C 0.8
- **Snap weight** (trailing 4 team games, a missed game counts as 0): 75%+ = 1.0, 60–75% = 0.75, 45–60% = 0.25, under 45% = 0
- **P(sits):** Out, Doubtful, and IR/PUP/NFI = 1.0. Questionable depends on final practice status: DNP 0.45, limited 0.24, full 0.12, unknown 0.27. No short-week shading.
- **Cluster:** +0.5 when 3+ starters in a unit are out (starter = snap weight 1.0 and P(sits) ≥ 0.5)
- **Caps:** front seven 3.5, OL 3.5, team 6.0

Study: `injury-trench-study/report.md`. Backtest: sandmoney-lines theories `injury_trench` vs `injury_live_desk`.

## Files

| File | What |
|---|---|
| `health-2026-wNN.json` | One file per week. Per team: priced rows with both prices, unit subtotals, cluster, caps, totals, and the health index (RDA/PDA/ORA/OPA, F7HI/OLHI). `frozen: true` once the week's games are locked. |
| `index.json` | Week → file and stamp. The site reads this first. |
| `players-2026.csv` | Player-week log: designation, practice days, snap share, both prices, and after the game: snaps, active/inactive, early exits. |
| `team-games-2026.csv` | Team-game log: Live vs Proposed points, health index, plus results after the game: run/pass EPA, score, B$ lock line, open, close, ATS, CLV. |
| `trench_lib.py` | Shared constants and pricing. Mirrors the `TRENCH` block in `app.js`. |
| `compute_trench_health.py` | Builds this week (default: the week of the next kickoff). |
| `after_reseed.py` | Hook called at the end of the daily injury reseed. It never fails the reseed. |
| `backfill_trench_2026.py` | One-time W1–4 backfill from the locks, plus the post-game columns. |

## Routine

1. The daily injury reseed (`data/reseed_injury_<day>_wN.py`) writes `data/injury-2026.json`, then calls
   `after_reseed.py`. Copy the hook block at the bottom of `reseed_injury_monday_w5.py` into each new reseed script.
2. `compute_trench_health.py --rows seed` re-prices this week's rows. It pulls nflverse snaps, the injury report, and rosters, and caches them in `/tmp/injury-trench-cache`. Add `--refresh` to re-download.
3. After the locks are frozen, `compute_trench_health.py --rows locks --week N` rebuilds from the lock rows. Frozen files are not overwritten without `--force`.
4. After the games, `backfill_trench_2026.py` (or a weekly equivalent) fills in the post-game columns.

Practice status priority: daily log columns in `players-2026.csv` (`wed_practice`, `thu_practice`, `fri_practice`, `sat_practice`), then the nflverse final report, then unknown (0.27).

## Known gaps (Oct 6, 2026)

- W1 is mostly reconstructed from the nflverse final report plus the reserve list (only 4 teams had locks in the repo).
- W4 ATL/NO/DET/CAR rows come from the MNF/SNF locks on the local desk. Those locks are not in the repo yet.
- W4 ATL@NO snaps are not on nflverse yet. Active/DNP comes from the ESPN box score.
- Box-shift, YBC, and pressure columns are blank (no free source).

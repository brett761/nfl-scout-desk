# B$ DVOA (shadow)

Opponent-adjusted EPA and success ratings from free nflverse play-by-play. **Shadow only.** These files do not change `eff()`, the B$ line, injury math, or the Tuesday power ranking.

Positive team points mean better than an average club on a neutral field. Game spreads are home-centric: negative means the home team is favored. Home field in the spread is the fitted 2.12 points, and 0 at a neutral site.

## Tuesday run order (ET)

Do this after the nflverse overnight update (about 9:00 UTC, 5:00 AM ET, once Monday night is in) and **before** the 11:16 AM power-rankings run.

```bash
python3 data/dvoa/build_bs_dvoa.py --week 4
node data/published/build_power_rankings.mjs
```

Replace `4` with the week you are rating. Ratings for that week use only earlier games, plus last season at a 0.2 weight. Running the same week again replaces that week and leaves the others.

The power-rankings command is unchanged. It does not read this folder.

Optional Thursday morning, after nflverse picks up the Wed→Thu stat corrections and before the Thursday night lock:

```bash
python3 data/dvoa/build_bs_dvoa.py --week 4
```

First-time history for weeks 1 through N:

```bash
python3 data/dvoa/build_bs_dvoa.py --through 4
```

Needs Python 3 with `numpy`, `pandas`, and `pyarrow`. Downloads land in `data/dvoa/.cache/` (not committed).

## What it writes

- `bs-dvoa-2026.json` — offense, defense, and overall points per game, ranks, and the implied B$ DVOA spread for each game that week.
- `factors-2026.json` — pass, early-down success, pressure, and explosive edges in points, plus turnover and red-zone luck flags. Info only.

Frozen settings, fit on 2021–2023 and not retuned: decay 0.9, prior weight 0.2, ridge alpha 200, garbage-time weight 0.25 when win probability is outside 10–90, fumble plays replaced with the league-average fumble EPA. Points use 15.99 per net EPA and 93.63 per net success rate. Special teams stayed out of the fit.

Luck flags, as shipped: turnover luck is a margin of at least +1 per game and a fumble recovery rate of at least 60% on 4 or more fumbles. Red-zone luck is a TD rate at least 20 points above the league on at least 3 trips.

## Backtest

```bash
python3 data/dvoa/build_bs_dvoa.py --backtest
```

Replays 2021–2026 with the frozen coefficients and writes `backtest-summary.json`. The Sep 29, 2026 research headline was about **10.4 MAE** for B$ DVOA against about **9.6–9.7** for the market on 2024–25 (544 games). A fresh pull that matches that file is the sanity check. Small gaps versus the original snapshot are nflverse stat corrections, not a retune. The weekly JSON keeps the frozen coefficients either way.

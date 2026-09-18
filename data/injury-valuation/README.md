# Injury → spread valuation

Skill: NFL injury spread valuation.

- `positional-values.json` — baselines + status priors (learn over time)
- `weeks/` — per-week player cards + team rollups
- `cumulative/` — learning log vs actuals

Desk auto impact (Madden-first) is a fast prior. Full valuation here produces ranges, replacement drop-off, scheme/matchup/unit effects, and recommended desk `impact` overrides.

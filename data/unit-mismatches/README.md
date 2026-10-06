# Unit mismatch (research only)

Not an input to the B$ line. The game sheet and the Week 5+ game card read
`data/unit-mismatches-2026.json` and draw a panel tagged **Research only —
not in B$ line**. `eff()`, `injuryTerm()`, `ourHomeSpread()`,
`append_model_snapshot`, and the DVOA blend shadow do not read this folder.

Sandmoney lines PR #6 dropped unit mismatch as a line input. The 2021–25
backtest found no ATS edge versus the close. The market already prices it.
This panel is desk research, same spirit as Injury math and the DVOA blend
shadow.

## What a flag is

Ten units. Score = 50% PFF snap-weighted grade + 50% nflverse per-play rate.
Injury Out / Doubtful / IR / PUP / NFI = out, Questionable = 0.5. A flag is
top-8 vs bottom-8 after that adjustment. A near-flag is top-10 vs bottom-10.
Ranks use prior weeks only. The with / against tag is computed on the site
from the current B$ line and the current DraftKings number. It is not stored
as a line.

## Tuesday

Week 5 ships from the scratch CSVs already in `source/2026-w05/`.

```bash
python3 data/unit-mismatches/build_unit_mismatches.py --self-test
```

That rewrites `data/unit-mismatches-2026.json` and checks the ten Week 5 flags.

A live rebuild from PFF facets plus nflverse is not wired yet. Team overview
grades in `data/pff-2026-ytd.json` are not a substitute for the player facets.
`build_units.py` and `mismatches.py` exit with the missing-cache list. When
the cache exists, drop fresh CSVs in `source/2026-wNN/` and run the assembler.
Do not invent ranks in the meantime.

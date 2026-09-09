# 2026 NFL injuries — Scout desk FINAL Wed 4pm ET (NE@SEA + Melbourne)

Pulled Wednesday 9 September 2026 after the official Thursday Game Status window (~4:00 p.m. ET). Desk is **open**.

**2026-09-09b — per-player impact:** seed rows carried manual `impact` (full-Out surplus vs replacement). Scoring `pts = −(impact × status_mult)` when set; else pos×status.

**2026-09-09d — Madden-first (stop PFF max blowups):** same name-match, but if Madden ovr matched use only Madden-derived impact; else if PFF grade matched use PFF. No `Math.max` across sources. Charbonnet Madden 83 → ~1.37 (PUP −1.37), not PFF 85.2 → 3.35. Emmanwori stays Madden 86 → ~2.02 (Q −0.71). `impact_source` is `madden` or `pff` (not `madden+pff`). Cache `app.js?v=imp3` / `injury-2026.json?v=imp3`.

**2026-09-09c — auto impact from Madden/PFF:** name-match within the injury club (then global) fills `impact` from Madden OVR and/or PFF grade: `pos_base + (ovr−79.93)/4` or `(grade−71.47)/5`, take **max** of available sources, floor 0.2, cap `cap_player`. Emmanwori ≈ 2.02 (Q ≈ −0.71); Horton floors near 0.20 (Q ≈ −0.07). Seed `impact` kept only for unmatched judgment names; `impact_source: manual` (or UI edit) wins on reseed.

Sources: https://www.nfl.com/injuries; https://www.seahawks.com/news/ty-okada-out-nick-emmanwori-questionable-for-seahawks-season-opener-vs-patriots; https://sicscore.com/news/49ers-vs-rams-injury-report-key-injuries-and-player-statuses-for-week-1; https://www.espn.com/nfl/injuries

**NE @ SEA (FINAL, unchanged from morning sheet):** TreVeyon Henderson RB1 OUT (ankle) on; Harold Landry EDGE1 PUP on. SEA: Ty Okada S OUT (hamstring) on; Nick Emmanwori S QUESTIONABLE (ankle) on; Tory Horton WR2 QUESTIONABLE (hamstring) on; Zach Charbonnet RB1 PUP on. Soft Full participants stay off the number.

**Melbourne SF @ LAR (FINAL after Wed 4pm window):** Aaron Donald EDGE1 OUT on (McVay ruled out / did not travel). Cleared soft practice QUESTIONABLE with no official Game Status: Nick Bosa, George Kittle, Myles Garrett, Alaric Jackson, Tyler Higbee. Keep SF Kirk IR, Pearsall IR, Mykel Williams PUP. nfl.com still lists Melbourne practice participation only (blank Game Status) except coach Out for Donald.

**Sunday card:** practice-week rows left as working ESPN/IR/PUP seed; soft-Q Sunday names not wiped. Finalize Friday 4pm.

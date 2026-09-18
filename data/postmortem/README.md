# Model postmortem ledger (2026)

Primary DV: absolute error |desk projected margin − actual margin|.
ATS and CLV are secondary. Ablation starts after multiweek sample (~W6–8).

- `locks/` — freeze model line + feature stack at each lock window (before kick)
- `../model-ats-2026.json` — model ATS at the closing spread for every final with a model line (rebuild: `python3 data/build_model_ats_2026.py`). Not tickets.
- `weeks/YYYY-Wnn.json` + `.md` — weekly grade + full report
- `cumulative/features.json` — running feature evidence
- `cumulative/learning-log.md` — belief history

Sign convention: model/close spreads as **home points** (negative = home favorite, e.g. SEA −3.5 home → −3.5). Actual margin = home_score − away_score. Model projected margin ≈ −(home spread) when spread is home-centric… Document per file: we store `model_home_spread` (book style: negative = home favored) and `actual_home_margin` = home − away. Model projected home margin = `−model_home_spread`. Error = projected_home_margin − actual_home_margin.

Skill: Weekly NFL model postmortem.
First full week grade completed Tue Sep 15, 2026 (W01 including MNF DEN@KC).

# Cumulative model-learning log — 2026

Beliefs about each input. Updated every Tuesday postmortem.

## 2026-W01 (partial — MNF pending) — 2026-09-14T13:11:24Z

**Headline:** Model MAE **2.8** (n=1, NE@SEA) vs market MAE **10.833** (n=15, SNF in). Market beat model on the only locked game. Week market MAE high (~10.833) — W1 variance, not a license to retune. SNF DAL@NYG: NYG 28–20, close NYG +3, mkt MAE 11 — no belief change.

### Belief deltas
| Feature | Prior | Now | Label |
|---|---|---|---|
| FA (W1 full weight) | — | Monitor | Insufficient evidence |
| Injury layer pts | — | Monitor / Unchanged weights | Insufficient evidence |
| Late injury/QB lock process | — | Monitor (add checklist) | **Emerging signal** |
| HFA / neutral | — | Unchanged | Insufficient evidence |
| All other layers | — | Unchanged | Insufficient evidence |
| Numeric weights | — | **No edits** | Strong (process) |

### What would change minds
- **Confirm FA cut:** FA-driven |model−close| ≥2 disagreements lose to market MAE for 6+ weeks.
- **Confirm late-injury process:** ≥3 games where starter flip after desk lock moves close ≥2 pts against our number.
- **Falsify blowout overfit:** Ignore Melbourne/CHI single-game catastrophes for weight math until n≥30.

### Open work
- Freeze Week 2+ locks every window (TNF DET@BUF Mon AM street freeze written).
- Re-grade W01 after DEN@KC final (Tue).

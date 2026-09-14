# Cumulative model-learning log — 2026

Beliefs about each input. Updated every Tuesday postmortem.

## 2026-W01 (partial — SNF/MNF pending) — 2026-09-14T03:10:12Z

**Headline:** Model MAE **2.8** (n=1, NE@SEA) vs market MAE **10.821** (n=14). Market beat model on the only locked game. Week market MAE high (~10.8) — W1 variance, not a license to retune.

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
- Freeze Week 2+ locks every window.
- Re-grade W01 after DEN@KC final (Tue).

# Cumulative model-learning log — 2026

Beliefs about each input. Updated every Tuesday postmortem.

## 2026-W01 (complete — MNF settled) — 2026-09-15T14:15:00Z

**Headline:** Model MAE **13.335** (n=2) vs market MAE **11.312** (n=16). Market beat model on both locked games. DEN@KC catastrophe: desk DEN +2.87 vs street KC −2.5; final KC 31–10 (home margin +21); model abs 23.87, market abs 18.5. FA + stale injury seed were the main wrong-side drivers. **No numeric weight edits.**

### Belief deltas
| Feature | Prior (Mon AM partial) | Now | Label |
|---|---|---|---|
| FA (W1 full weight) | Monitor | Monitor (thickened, n=2) | Insufficient evidence |
| Injury layer pts | Monitor | Monitor | Insufficient evidence |
| Injury freshness / Q→OUT | — | Monitor (add checklist) | **Emerging signal** (process) |
| Late injury/QB lock process | Emerging | Emerging | **Emerging signal** (process) |
| HFA / neutral | Unchanged | Unchanged | Insufficient evidence |
| All other layers | Unchanged | Unchanged | Insufficient evidence |
| Numeric weights / positional baselines | No edits | **No edits** | Strong (process) |

### What would change minds
- **Confirm FA cut:** FA-driven |model−close| ≥2 disagreements lose to market MAE for 6+ weeks.
- **Confirm injury freshness process:** ≥3 locks with stale pull >48h or Q status wrong vs inactives.
- **Confirm late-injury process:** ≥3 games where starter flip after desk lock moves close ≥2 pts against our number.
- **Falsify blowout overfit:** Ignore Melbourne/CHI/LAC/DEN@KC single-game catastrophes for weight math until n≥30.
- **LT baseline:** Do not cut after Simmons OUT + KC +21; need multi-game replacement evidence.

### Open work
- Freeze Week 2+ locks every window (TNF DET@BUF street freeze already on desk).
- Injury JSON same-day before each freeze; align Q/OUT to inactives.
- Ablation only from ~Week 6+ / adequate n.

## 2026-W01 (partial — MNF pending) — 2026-09-14T13:11:24Z

**Headline:** Model MAE **2.8** (n=1, NE@SEA) vs market MAE **10.833** (n=15, SNF in). Market beat model on the only locked game. Superseded by complete W01 entry above.

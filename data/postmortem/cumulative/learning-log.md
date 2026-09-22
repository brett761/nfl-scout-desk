# Cumulative model-learning log — 2026

Beliefs about each input. Updated every Tuesday postmortem.

## 2026-W02 (complete — MNF settled) — 2026-09-22T13:56:44Z

**Headline:** Model MAE **12.857** (n=16) vs market MAE **11.75** (n=16). Beat market on **8/16**. Best: DET@BUF MAE **0.72** (injury-driven). Worst model-vs-market: JAX@DEN **19.52** vs mkt 4.5; GB@NYJ **11.72** vs mkt 0.5. Extreme |gap|≥8 went **0/3** vs market. **No numeric weight edits.**

### Belief deltas
| Feature | Prior (W01) | Now | Label |
|---|---|---|---|
| Large \|model−close\| filter | — | Monitor (add) | **Emerging signal** |
| pff_ytd early weight | — | Monitor (add) | **Emerging signal** (thin) |
| FA | Monitor | Monitor | Insufficient evidence |
| Injury layer pts | Monitor | Monitor | Insufficient evidence |
| Injury freshness / Q→OUT | Emerging | Emerging (process improved W2) | **Emerging signal** (process) |
| Late injury/QB lock process | Emerging | Emerging | **Emerging signal** (process) |
| HFA / all other layers | Unchanged | Unchanged | Insufficient evidence |
| Numeric weights / positional baselines | No edits | **No edits** | Strong (process) |

### What would change minds
- **Confirm extreme-gap filter:** |gap|≥8 loses to market MAE on ≥70% through W6.
- **Confirm pff_ytd taper:** pff_ytd-driven |gap|≥3 loses to market for 4+ more weeks.
- **Confirm FA cut:** FA-driven |gap|≥2 lose to market through W6 (still not there).
- **Confirm injury size:** large confirmed-OUT swings beat market on 6+ games.
- **Falsify blowout overfit:** Ignore CAR@ATL / SEA@ARI single-game variance for weight math until n≥30.

### Open work
- Freeze Week 3+ locks every window; keep same-day injury JSON.
- Capture multi-book closes pre-kick when possible (AN modal).
- Ablation only from ~Week 6+ / adequate n.

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

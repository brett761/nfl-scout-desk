// One rounding rule for the official B$ line.
//
// Nearest 0.5. Halfway cases (.25 and .75) round away from zero, the same
// rule PR #19 and PR #30 use when a Week 4+ lock is graded:
//   magnitude in [n, n+0.25)     → n
//   magnitude in [n+0.25, n+0.75) → n+0.5
//   magnitude in [n+0.75, n+1)   → n+1
// Examples: 1.25 → 1.5, 1.75 → 2, -1.25 → -1.5, -1.75 → -2,
// -9.93 → -10, -11.7 → -11.5.
//
// The sign is kept, so the favorite does not flip. A raw line whose
// magnitude is under 0.25 becomes a pick’em (0).
//
// Weeks before OFFICIAL_ROUND_FROM_WEEK (4) are returned unchanged.
// Weeks 2 and 3 stay the stored game-day numbers.

export const OFFICIAL_ROUND_FROM_WEEK = 4;

export function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function roundHalfAwayFromZero(value) {
  const n = num(value);
  if (n == null) return null;
  const sign = n < 0 ? -1 : 1;
  const steps = Math.abs(n) / 0.5;
  const lower = Math.floor(steps + 1e-9);
  const frac = steps - lower;
  const roundedSteps = frac > 0.5 - 1e-8 ? lower + 1 : lower;
  const out = sign * roundedSteps * 0.5;
  return out === 0 ? 0 : out;
}

export function officialHomeSpread(week, raw) {
  const n = num(raw);
  if (n == null) return null;
  if (Number(week) < OFFICIAL_ROUND_FROM_WEEK) return n;
  return roundHalfAwayFromZero(n);
}

// Favorite label, same shape as the Games page and the B$ Daily:
// "DAL −10.0", "JAX −11.5", "PK".
export function formatFavoriteLine(homeSpread, home, away) {
  const n = num(homeSpread);
  if (n == null) return "—";
  if (n === 0) return "PK";
  const body = Math.abs(n).toFixed(1);
  if (n < 0) return home + " −" + body;
  return away + " −" + body;
}

export function favoriteTeam(homeSpread, home, away) {
  const n = num(homeSpread);
  if (n == null) return null;
  if (n === 0) return "PK";
  return n < 0 ? home : away;
}

// Fill official_b_line on the latest version of each week >= fromWeek.
// Does not change b_line. Skips a version that already has an official line.
export function stampLatestOfficial(games, fromWeek = OFFICIAL_ROUND_FROM_WEEK) {
  let n = 0;
  for (const g of games || []) {
    if (!g || Number(g.week) < fromWeek) continue;
    const versions = g.versions || [];
    const last = versions[versions.length - 1];
    if (!last || num(last.b_line) == null) continue;
    if (last.official_b_line != null) continue;
    const official = officialHomeSpread(g.week, last.b_line);
    if (official == null) continue;
    last.official_b_line = official;
    last.official_rounded = true;
    n += 1;
  }
  return n;
}

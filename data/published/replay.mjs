// Replay a frozen lock from the component points stored on that lock.
// Identity (every scale = 1) must return the published B Line.
// This does not call the live desk model and does not read today's ratings.

export const COMPONENT_KEYS = [
  "prior",
  "fa",
  "draft",
  "madden",
  "pff",
  "pff_ytd",
  "sos",
  "return",
  "injury",
  "adjust",
  "context",
];

export const GAME_KEYS = ["hfa", "coach", "prep", "ats", "travel", "matchup"];

export const DEFAULT_SCALES = {
  prior: 1,
  fa: 1,
  draft: 1,
  madden: 1,
  pff: 1,
  pff_ytd: 1,
  sos: 1,
  return: 1,
  injury: 1,
  adjust: 1,
  context: 1,
  hfa: 1,
  coach: 1,
  prep: 1,
  ats: 1,
  travel: 1,
  matchup: 1,
};

export function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

export function replayLine(replay, scales) {
  if (!replay || replay.ok !== true) return null;
  const home = replay.home;
  const away = replay.away;
  if (!home || !away) return null;
  if (!Number.isFinite(home.eff) || !Number.isFinite(away.eff)) return null;
  const s = Object.assign({}, DEFAULT_SCALES, scales || {});
  const eff = (side) => {
    let e = side.eff;
    for (const key of COMPONENT_KEYS) {
      const v = side[key];
      if (!Number.isFinite(v)) continue;
      const scale = Number(s[key]);
      if (!Number.isFinite(scale)) return null;
      e += (scale - 1) * v;
    }
    return e;
  };
  const homeE = eff(home);
  const awayE = eff(away);
  if (homeE == null || awayE == null) return null;
  let extra = 0;
  for (const key of GAME_KEYS) {
    const base = Number(replay[key]);
    const scale = Number(s[key]);
    if (!Number.isFinite(scale)) return null;
    extra += (Number.isFinite(base) ? base : 0) * scale;
  }
  return round2(-((homeE - awayE) + extra));
}

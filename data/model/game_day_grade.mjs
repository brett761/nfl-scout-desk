// Latest game-day B$ line for a finished game, and the same ATS / better-position
// rules the site uses. Does not read or write data/published/finals.json.
// A missing game-day version is a null lookup. Callers fall back to the pinned lock.

export function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function atsGrade(bLine, close, row) {
  const homeScore = row && row.home_score;
  const awayScore = row && row.away_score;
  if (bLine == null || close == null || homeScore == null || awayScore == null) {
    return { ats: "unavailable", ats_side: null };
  }
  const edge = close - bLine;
  let side = null;
  if (edge > 0.05) side = "home";
  else if (edge < -0.05) side = "away";
  const margin = (homeScore - awayScore) + close;
  let cover = "push";
  if (margin > 0.05) cover = "home";
  else if (margin < -0.05) cover = "away";
  const home = row.home;
  const away = row.away;
  if (!side || cover === "push") {
    return { ats: "P", ats_side: side === "home" ? home : side === "away" ? away : null };
  }
  return { ats: side === cover ? "W" : "L", ats_side: side === "home" ? home : away };
}

export function positionOf(bLine, close, homeScore, awayScore) {
  if (bLine == null || close == null || homeScore == null || awayScore == null) return "unavailable";
  const actual = homeScore - awayScore;
  const modelErr = Math.abs(-bLine - actual);
  const marketErr = Math.abs(-close - actual);
  const diff = Math.round((modelErr - marketErr) * 100) / 100;
  if (Math.abs(diff) < 0.05) return "even";
  return diff < 0 ? "b_line" : "market";
}

export function linesDiffer(a, b) {
  const x = num(a);
  const y = num(b);
  if (x == null || y == null) return false;
  return Math.abs(x - y) >= 0.005;
}

// Latest version whose source starts with "game-day site compute".
export function indexGameDay(history) {
  const byEspn = new Map();
  const byKey = new Map();
  for (const g of (history && history.games) || []) {
    let last = null;
    for (const v of g.versions || []) {
      if (!v || !String(v.source || "").startsWith("game-day site compute")) continue;
      if (num(v.b_line) == null) continue;
      if (!last || Number(v.version) >= Number(last.version)) last = v;
    }
    if (!last) continue;
    const rec = {
      b_line: num(last.b_line),
      source: last.source,
      version: last.version,
      commit: last.commit || null,
    };
    if (g.espn_id) byEspn.set(String(g.espn_id), rec);
    byKey.set(String(g.season) + "|" + String(g.week) + "|" + String(g.game_id), rec);
  }
  return { byEspn, byKey };
}

export function gameDayFor(index, row) {
  if (!index || !row) return null;
  if (row.espn_id && index.byEspn.has(String(row.espn_id))) return index.byEspn.get(String(row.espn_id));
  const key = String(row.season) + "|" + String(row.week) + "|" + String(row.game_id);
  return index.byKey.get(key) || null;
}

export function tallyAts(rows) {
  const t = { W: 0, L: 0, P: 0 };
  for (const row of rows) {
    if (t[row] != null) t[row] += 1;
  }
  return t.W + "-" + t.L + "-" + t.P;
}

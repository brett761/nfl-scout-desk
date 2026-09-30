/**
 * Grade the existing ticket ledger against the line taken.
 * Closes: data/closes, then line-history close, then lock close_at_lock.
 * Does not invent a result. Pending stays pending.
 * An outright win is marked only when a final score says the picked team won.
 */

export function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function normAbbr(abbr) {
  const a = String(abbr || "").toUpperCase();
  if (a === "WAS" || a === "WFT") return "WSH";
  if (a === "LA") return "LAR";
  return a;
}

export function parseGame(game) {
  const m = String(game || "").toUpperCase().replace(/\s+/g, " ").match(/([A-Z]{2,3})\s*@\s*([A-Z]{2,3})/);
  if (!m) return null;
  return { away: normAbbr(m[1]), home: normAbbr(m[2]) };
}

export function parseTeamPick(pick) {
  const s = String(pick || "").replace(/−/g, "-").replace(/\s+/g, " ").trim().toUpperCase();
  const spread = s.match(/^([A-Z]{2,3})\s+(PK|EVEN|PICK(?:'EM)?|[+-]?\d+(?:\.\d+)?)$/);
  if (spread) {
    const team = normAbbr(spread[1]);
    const raw = spread[2];
    const line = /PK|EVEN|PICK/.test(raw) ? 0 : Number(raw);
    if (!Number.isFinite(line)) return null;
    return { team, line, kind: "spread" };
  }
  const ml = s.match(/^([A-Z]{2,3})\b/);
  if (ml && /\b(YES|WIN|ML|MONEYLINE)\b/.test(s)) {
    return { team: normAbbr(ml[1]), line: null, kind: "ml" };
  }
  return null;
}

export function teamLineFromHome(homeSpread, team, home) {
  if (homeSpread == null || !Number.isFinite(Number(homeSpread))) return null;
  const h = Number(homeSpread);
  return normAbbr(team) === normAbbr(home) ? h : -h;
}

export function keyCross(taken, close) {
  if (taken == null || close == null || Number(taken) === Number(close)) return [];
  const a = Number(taken);
  const b = Number(close);
  const hit = [];
  for (const k of [3, 7]) {
    for (const key of [k, -k]) {
      const crossed = (a - key) * (b - key) < 0 || (a !== b && (a === key || b === key));
      if (crossed && !hit.includes(k)) hit.push(k);
    }
  }
  return hit;
}

function gameKey(week, away, home) {
  return Number(week) + "|" + normAbbr(away) + "@" + normAbbr(home);
}

function better(prev, rank) {
  return !prev || rank < prev.rank;
}

function put(map, key, field, value, source, rank) {
  const n = num(value);
  if (n == null) return;
  let rec = map.get(key);
  if (!rec) {
    rec = {};
    map.set(key, rec);
  }
  if (better(rec[field], rank)) rec[field] = { value: n, source, rank };
}

export function indexCloses({ closes, lineHistory, locks }) {
  const map = new Map();
  for (const file of closes || []) {
    const week = file.week;
    for (const row of file.games || []) {
      const teams = parseGame(row.game) || { away: normAbbr(row.away), home: normAbbr(row.home) };
      if (!teams.away || !teams.home) continue;
      const key = gameKey(week || row.week, teams.away, teams.home);
      const src = fileSource(file, week || row.week);
      put(map, key, "spread", row.close_spread, src, 1);
      put(map, key, "total", row.close_total, src, 1);
    }
  }
  for (const g of (lineHistory && lineHistory.games) || []) {
    const key = gameKey(g.week, g.away, g.home);
    const closesSnaps = (g.snapshots || []).filter((s) => s && s.tag === "close" && num(s.home_spread) != null);
    const last = closesSnaps[closesSnaps.length - 1];
    if (last) put(map, key, "spread", last.home_spread, last.source || "data/lines/line-history-2026.json", 2);
  }
  for (const lock of locks || []) {
    if (!lock || lock.away == null || lock.home == null) continue;
    const key = gameKey(lock.week, lock.away, lock.home);
    const src = lock.__source || "data/postmortem/locks";
    put(map, key, "spread", lock.close_at_lock, src, 3);
    if (lock.close_at_lock == null) put(map, key, "spread", lock.street_home_spread, src, 4);
    put(map, key, "total", lock.ou_street, src, 3);
  }
  return map;
}

function fileSource(file, week) {
  if (file && file.__source) return file.__source;
  const w = String(week || file.week || "").padStart(2, "0");
  return "data/closes/2026-w" + w + ".json";
}

export function indexScores(games) {
  const map = new Map();
  for (const g of games || []) {
    if (g == null) continue;
    const status = String(g.status || "").toUpperCase();
    if (status && status !== "FINAL") continue;
    const homeScore = num(g.home_score);
    const awayScore = num(g.away_score);
    if (homeScore == null || awayScore == null) continue;
    map.set(gameKey(g.week, g.away, g.home), {
      home: normAbbr(g.home),
      away: normAbbr(g.away),
      home_score: homeScore,
      away_score: awayScore,
    });
  }
  return map;
}

function gradeResult(result) {
  const r = String(result || "").trim().toUpperCase();
  if (r === "WIN" || r === "W") return "W";
  if (r === "LOSS" || r === "L") return "L";
  if (r === "PUSH" || r === "P") return "P";
  if (r === "VOID") return "VOID";
  return "PENDING";
}

function outrightOf(team, home, score) {
  if (!score) return null;
  const mine = normAbbr(team) === score.home ? score.home_score : score.away_score;
  const opp = normAbbr(team) === score.home ? score.away_score : score.home_score;
  if (mine > opp) return "W";
  if (mine < opp) return "L";
  return "P";
}

function emptyRec() {
  return { w: 0, l: 0, p: 0, pending: 0 };
}

function addRec(rec, result) {
  if (result === "W") rec.w += 1;
  else if (result === "L") rec.l += 1;
  else if (result === "P") rec.p += 1;
  else if (result === "PENDING") rec.pending += 1;
}

export function recordText(rec) {
  return rec.w + "–" + rec.l + "–" + rec.p;
}

export function coverPct(rec) {
  const decided = rec.w + rec.l;
  if (!decided) return null;
  return Math.round((1000 * rec.w) / decided) / 10;
}

function unitLabel(units) {
  if (units == null) return "unset";
  const n = Number(units);
  if (Number.isInteger(n)) return n + "u";
  return String(n) + "u";
}

export function gradeBook({ tickets, games, closes, lineHistory, locks, season = 2026 }) {
  const closeMap = indexCloses({ closes, lineHistory, locks });
  const scores = indexScores(games);
  const rows = [];
  for (const t of tickets || []) {
    if (!t || t.sample === true || String(t.season) === "EXAMPLE") continue;
    if (String(t.season) !== String(season)) continue;
    if (String(t.ticket_type || "") !== "Straight") continue;
    const market = String(t.market || "");
    const isSpread = market.toLowerCase() === "spread";
    const isMl = market.toLowerCase() === "moneyline" || market.toLowerCase() === "ml";
    if (!isSpread && !isMl) continue;
    const teams = parseGame(t.game);
    const parsed = parseTeamPick(t.pick);
    if (!teams || !parsed) continue;
    if (parsed.team !== teams.home && parsed.team !== teams.away) continue;
    if (isSpread && parsed.kind !== "spread") continue;
    if (isMl && parsed.kind !== "ml") continue;
    const line = isSpread ? (num(t.bet_line) != null ? num(t.bet_line) : parsed.line) : null;
    if (isSpread && line == null) continue;
    const key = gameKey(t.week, teams.away, teams.home);
    const closeRec = closeMap.get(key);
    const closeHome = closeRec && closeRec.spread ? closeRec.spread.value : null;
    const close = closeHome == null ? null : teamLineFromHome(closeHome, parsed.team, teams.home);
    const clv = isSpread && line != null && close != null ? Math.round((line - close) * 1000) / 1000 : null;
    const where = parsed.team === teams.home ? "home" : "away";
    let side = "pk";
    if (isSpread) {
      if (line > 0) side = "dog";
      else if (line < 0) side = "fav";
    } else if (close != null) {
      if (close > 0) side = "dog";
      else if (close < 0) side = "fav";
    } else {
      side = null;
    }
    const units = num(t.units);
    const result = gradeResult(t.result);
    const score = scores.get(key) || null;
    const outright = outrightOf(parsed.team, teams.home, score);
    rows.push({
      id: t.id,
      week: Number(t.week),
      season: Number(t.season),
      game: teams.away + " @ " + teams.home,
      away: teams.away,
      home: teams.home,
      team: parsed.team,
      pick: t.pick,
      market: isSpread ? "Spread" : "Moneyline",
      kind: isSpread ? "spread" : "ml",
      line,
      side,
      where,
      units,
      result,
      close,
      closeHome,
      closeSource: closeRec && closeRec.spread ? closeRec.spread.source : null,
      clv,
      keys: isSpread ? keyCross(line, close) : [],
      outright,
      score,
    });
  }
  rows.sort((a, b) => a.week - b.week || a.game.localeCompare(b.game) || String(a.id).localeCompare(String(b.id)));
  return { rows, rollup: rollup(rows) };
}

export function rollup(rows) {
  const spreads = rows.filter((r) => r.kind === "spread");
  const season = emptyRec();
  const byWeek = new Map();
  const bySide = { fav: emptyRec(), dog: emptyRec(), pk: emptyRec(), home: emptyRec(), away: emptyRec() };
  const byUnits = new Map();
  let clvN = 0;
  let clvSum = 0;
  let beat = 0;
  const crossed = { 3: 0, 7: 0 };
  for (const row of spreads) {
    addRec(season, row.result);
    if (!byWeek.has(row.week)) byWeek.set(row.week, emptyRec());
    addRec(byWeek.get(row.week), row.result);
    if (row.side && bySide[row.side]) addRec(bySide[row.side], row.result);
    if (row.where && bySide[row.where]) addRec(bySide[row.where], row.result);
    const uk = row.units == null ? "unset" : row.units;
    if (!byUnits.has(uk)) byUnits.set(uk, emptyRec());
    addRec(byUnits.get(uk), row.result);
    if (row.clv != null) {
      clvN += 1;
      clvSum += row.clv;
      if (row.clv > 0) beat += 1;
      for (const k of row.keys) crossed[k] += 1;
    }
  }
  const dogs = rows.filter((r) => r.side === "dog");
  const spreadDogs = dogs.filter((r) => r.kind === "spread" && (r.result === "W" || r.result === "L" || r.result === "P"));
  const covered = emptyRec();
  for (const row of spreadDogs) addRec(covered, row.result);
  const known = dogs.filter((r) => r.outright === "W" || r.outright === "L" || r.outright === "P");
  const outrightWins = known.filter((r) => r.outright === "W").length;
  const weeks = [...byWeek.entries()].sort((a, b) => a[0] - b[0]).map(([week, rec]) => ({ week, ...rec, text: recordText(rec), pct: coverPct(rec) }));
  const units = [...byUnits.entries()].sort((a, b) => {
    if (a[0] === "unset") return 1;
    if (b[0] === "unset") return -1;
    return Number(a[0]) - Number(b[0]);
  }).map(([key, rec]) => ({ units: key, label: unitLabel(key === "unset" ? null : key), ...rec, text: recordText(rec), pct: coverPct(rec) }));
  const side = {};
  for (const name of ["fav", "dog", "home", "away", "pk"]) {
    side[name] = { ...bySide[name], text: recordText(bySide[name]), pct: coverPct(bySide[name]) };
  }
  return {
    season: { ...season, text: recordText(season), pct: coverPct(season) },
    byWeek: weeks,
    bySide: side,
    byUnits: units,
    clv: {
      n: clvN,
      avg: clvN ? Math.round((clvSum / clvN) * 1000) / 1000 : null,
      beat,
      beatPct: clvN ? Math.round((1000 * beat) / clvN) / 10 : null,
      crossed,
    },
    upset: {
      calls: dogs.length,
      spreadGraded: spreadDogs.length,
      covered: { ...covered, text: recordText(covered), pct: coverPct(covered) },
      outrightKnown: known.length,
      outrightWins,
    },
  };
}

export function filterRows(rows, { season, week, team } = {}) {
  return rows.filter((row) => {
    if (season && String(row.season) !== String(season)) return false;
    if (week && String(row.week) !== String(week)) return false;
    if (team && row.away !== team && row.home !== team && row.team !== team) return false;
    return true;
  });
}

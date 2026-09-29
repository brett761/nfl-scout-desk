// Tuesday power ranking.
// Ranks all 32 clubs with the live desk B$ rating (eff() in app.js) and
// appends that week to data/published/power-rankings.json.
// The file stores ranks, records, and identity. Rating points are not written.
//
// Weekly command (Tuesday, after the injury / YTD refresh, then commit):
//   node data/published/build_power_rankings.mjs
//
// Backfill an older week from a copy of the data/ tree
// (current app.js math, that week's files):
//   node data/published/build_power_rankings.mjs --data-root /path/to/snap --week 3 --generated-at 2026-09-23T12:02:48-04:00 --backfill

import fs from "fs";
import path from "path";
import vm from "vm";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const OUT = path.join(ROOT, "data/published/power-rankings.json");
const APP = path.join(ROOT, "app.js");
const INDEX = path.join(ROOT, "index.html");

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i < 0) return null;
  const next = process.argv[i + 1];
  if (next == null || next.startsWith("--")) return "";
  return next;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normAbbr(abbr) {
  const a = String(abbr || "").toUpperCase();
  if (a === "WAS" || a === "WFT") return "WSH";
  return a;
}

function etParts(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const g = (t) => parts.find((p) => p.type === t).value;
  return {
    year: g("year"),
    month: g("month"),
    day: g("day"),
    hour: g("hour"),
    minute: g("minute"),
    second: g("second"),
  };
}

function formatEtIso(date) {
  const p = etParts(date);
  const wall = `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
  const asUtc = Date.parse(wall + "Z");
  let offMin = Math.round((asUtc - date.getTime()) / 60000);
  const sign = offMin >= 0 ? "+" : "-";
  offMin = Math.abs(offMin);
  const hh = String(Math.floor(offMin / 60)).padStart(2, "0");
  const mm = String(offMin % 60).padStart(2, "0");
  return `${wall}${sign}${hh}:${mm}`;
}

function cacheStamp(date) {
  const p = etParts(date);
  return `prank${p.year}${p.month}${p.day}T${p.hour}${p.minute}${p.second}`;
}

function isReg(g) {
  const t = String(g.season_type || g.seasontype || g.seasonType || g.type || "").toUpperCase();
  if (t === "PRE" || t === "PRESEASON" || t === "POST" || t === "POSTSEASON" || t === "PRO") return false;
  if (t && t !== "REG" && t !== "REGULAR" && t !== "REGULAR_SEASON") return false;
  const w = Number(g.week);
  return Number.isFinite(w) && w >= 1 && w <= 18;
}

function recordFor(abbr, games) {
  let w = 0;
  let l = 0;
  let t = 0;
  for (const g of games) {
    if (!g || !isReg(g)) continue;
    const home = normAbbr(g.home);
    const away = normAbbr(g.away);
    if (home !== abbr && away !== abbr) continue;
    const hs = num(g.home_score);
    const as_ = num(g.away_score);
    if (hs === null || as_ === null) continue;
    const pf = home === abbr ? hs : as_;
    const pa = home === abbr ? as_ : hs;
    if (pf > pa) w += 1;
    else if (pf < pa) l += 1;
    else t += 1;
  }
  return t ? `${w}-${l}-${t}` : `${w}-${l}`;
}

function stub() {
  const f = function () { return p; };
  const p = new Proxy(f, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => "";
      if (k === "length") return 0;
      if (k === Symbol.iterator) return function* () {};
      if (k === "then") return undefined;
      return p;
    },
    set() { return true; },
    apply() { return p; },
    construct() { return p; },
  });
  return p;
}

async function loadDesk(dataRoot) {
  const src = fs.readFileSync(APP, "utf8");
  let bootIdx = src.lastIndexOf("\nwindow.bootDesk = bootDesk;");
  if (bootIdx < 0) bootIdx = src.lastIndexOf("\nload();\nloadProfiles();");
  if (bootIdx < 0) throw new Error("boot marker not found in app.js");
  const body = src.slice(0, bootIdx);
  const store = {};
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    Math, Date, JSON, Number, String, Object, Array, Set, Map, Promise, RegExp, Error,
    isNaN, parseFloat, parseInt, Intl, encodeURIComponent, decodeURIComponent, Symbol, Infinity, NaN,
    crypto: globalThis.crypto,
    localStorage: {
      getItem: (k) => store[k] ?? null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    document: stub(),
    window: stub(),
    navigator: stub(),
    location: { hash: "", search: "", href: "https://bmoneybets.com/" },
    history: stub(),
    setTimeout: () => 0,
    clearTimeout() {},
    setInterval: () => 0,
    requestAnimationFrame: () => 0,
    confirm: () => false,
    alert() {},
    matchMedia: () => stub(),
    URLSearchParams,
    URL,
    fetch: async (u) => {
      const rel = String(u).split("?")[0].replace(/^\.\//, "");
      const fp = path.join(dataRoot, rel);
      if (!fs.existsSync(fp)) return { ok: false, status: 404, json: async () => null, text: async () => "" };
      const text = fs.readFileSync(fp, "utf8");
      return { ok: true, status: 200, json: async () => JSON.parse(text), text: async () => text };
    },
  };
  vm.createContext(ctx);
  vm.runInContext(
    body + `\n;globalThis.__api={loadNfl, eff, currentNflWeek, getNfl:()=>nflData, INCLUDE_FA, INCLUDE_PFF_PRESEASON};`,
    ctx,
    { filename: "app.js" }
  );
  await ctx.__api.loadNfl();
  return ctx.__api;
}

function readBoard() {
  if (!fs.existsSync(OUT)) {
    return { season: 2026, note: "", weeks: [] };
  }
  const data = JSON.parse(fs.readFileSync(OUT, "utf8"));
  if (!data || !Array.isArray(data.weeks)) throw new Error("power-rankings.json has no weeks array");
  return data;
}

function bumpCache(stamp) {
  const pairs = [
    [APP, /(\.\/data\/published\/power-rankings\.json\?v=)[^"'\\\s]+/],
    [INDEX, /(app\.js\?v=)[^"'\\\s]+/],
  ];
  for (const [file, re] of pairs) {
    const text = fs.readFileSync(file, "utf8");
    if (!re.test(text)) throw new Error("cache token not found in " + path.relative(ROOT, file));
    fs.writeFileSync(file, text.replace(re, `$1${stamp}`));
  }
}

function teamRow(team, rank, games) {
  const abbr = normAbbr(team.abbr);
  const row = {
    rank,
    abbr,
    name: team.name || abbr,
    nick: team.nick || team.name || abbr,
    logo: team.logo || "",
    record: recordFor(abbr, games),
  };
  const banned = ["eff", "rating", "pts", "points", "net", "prior", "spread", "line"];
  for (const key of Object.keys(row)) {
    if (banned.includes(key)) throw new Error("refusing to store " + key);
  }
  return row;
}

async function main() {
  const dataRoot = path.resolve(arg("--data-root") || ROOT);
  const generatedAtArg = arg("--generated-at");
  const when = generatedAtArg ? new Date(generatedAtArg) : new Date();
  if (Number.isNaN(when.getTime())) throw new Error("bad --generated-at");
  const backfill = hasFlag("--backfill");

  const api = await loadDesk(dataRoot);
  if (api.INCLUDE_FA !== false) throw new Error("INCLUDE_FA must stay false");
  if (api.INCLUDE_PFF_PRESEASON !== false) throw new Error("INCLUDE_PFF_PRESEASON must stay false");

  const nfl = api.getNfl();
  const clubs = nfl && Array.isArray(nfl.teams) ? nfl.teams : [];
  if (clubs.length !== 32) throw new Error("expected 32 clubs, got " + clubs.length);

  const weekArg = arg("--week");
  const week = weekArg ? Number(weekArg) : Number(api.currentNflWeek());
  if (!Number.isInteger(week) || week < 1 || week > 18) throw new Error("bad week " + week);

  const scored = clubs.map((team) => {
    const abbr = normAbbr(team.abbr);
    const rating = Number(api.eff(abbr));
    if (!Number.isFinite(rating)) throw new Error("eff() was not a number for " + abbr);
    return { team, abbr, rating };
  });
  scored.sort((a, b) => (b.rating - a.rating) || a.abbr.localeCompare(b.abbr));

  const games = Array.isArray(nfl.games) ? nfl.games : [];
  const teams = scored.map((row, i) => teamRow(row.team, i + 1, games));
  const seen = new Set();
  for (const t of teams) {
    if (seen.has(t.abbr)) throw new Error("duplicate " + t.abbr);
    seen.add(t.abbr);
  }

  const generated_at = formatEtIso(when);
  const as_of = generated_at.slice(0, 10);
  const entry = {
    week,
    label: "Week " + week,
    generated_at,
    as_of,
    teams,
  };
  if (backfill) entry.backfill = true;

  const board = readBoard();
  board.season = 2026;
  board.note = "Frozen Tuesday power ranking. Ordered by the desk B$ rating. Ranks only — rating points are not stored.";
  const weeks = board.weeks.filter((w) => Number(w && w.week) !== week);
  weeks.push(entry);
  weeks.sort((a, b) => Number(a.week) - Number(b.week));
  board.weeks = weeks;

  const text = JSON.stringify(board, null, 2) + "\n";
  if (/"eff"|"rating"|"points"|"spread"/.test(text)) throw new Error("output leaked a rating field");
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const tmp = OUT + ".tmp";
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, OUT);

  const stamp = cacheStamp(when);
  bumpCache(stamp);

  console.log("week " + week + "  " + generated_at + (backfill ? "  backfill" : ""));
  for (const t of teams.slice(0, 10)) {
    console.log(String(t.rank).padStart(2, " ") + "  " + t.abbr + "  " + t.record);
  }
  console.log("wrote " + path.relative(ROOT, OUT) + "  weeks " + weeks.map((w) => w.week).join(","));
  console.log("cache " + stamp);
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});

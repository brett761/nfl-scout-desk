// Checks the pinned public snapshot and that the browser replay matches.
import fs from "fs";
import path from "path";
import crypto from "crypto";
import vm from "vm";
import { replayLine } from "./replay.mjs";
import { indexGameDay, gameDayFor, atsGrade, tallyAts } from "../model/game_day_grade.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const doc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/published/finals.json"), "utf8"));
const nfl = JSON.parse(fs.readFileSync(path.join(ROOT, "data/nfl-2026.json"), "utf8"));
const finals = new Map();
for (const g of nfl.games || []) {
  if (g && String(g.status).toUpperCase() === "FINAL") finals.set(String(g.id), g);
}

function canon(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canon).join(",") + "]";
  const keys = Object.keys(value).filter((k) => k !== "content_sha256").sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canon(value[k])).join(",") + "}";
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

const errors = [];
function fail(msg) { errors.push(msg); }

const rows = (doc.board || []).concat(doc.versions || []);
const seenGame = new Set();
for (const row of doc.board || []) {
  const key = row.season + "|" + row.week + "|" + row.game_id;
  if (seenGame.has(key)) fail("duplicate board game " + key);
  seenGame.add(key);
}

for (const row of rows) {
  if (row.status !== "FINAL") fail(row.game_id + " status " + row.status);
  if (!finals.has(String(row.espn_id))) fail(row.game_id + " not final on the schedule");
  if (Number(row.week) >= 4) fail("week 4+ leaked " + row.game_id);
  if (sha256(canon(row)) !== row.content_sha256) fail("hash mismatch " + row.game_id + " seq " + row.published_seq);
  for (const banned of ["stake", "units", "tickets", "call", "price"]) {
    if (Object.prototype.hasOwnProperty.call(row, banned)) fail("banned field " + banned + " on " + row.game_id);
  }
  if (row.b_line_home_spread != null && row.replay && row.replay.ok === true) {
    const line = replayLine(row.replay, null);
    if (line == null || Math.abs(line - row.b_line_home_spread) >= 0.05) {
      fail("replay identity " + row.game_id + " got " + line + " want " + row.b_line_home_spread);
    }
  }
  if (row.week === 3 && row.lock_quality === "official" && !row.published_at) {
    fail("week 3 official missing published_at " + row.game_id);
  }
}

const w3 = (doc.board || []).filter((r) => r.week === 3 && r.lock_quality === "official");
if (w3.length !== 16) fail("expected 16 official week 3 games, got " + w3.length);
const manifest = sha256((doc.board || []).map((r) => r.content_sha256).join("\n"));
if (manifest !== doc.manifest_sha256) fail("manifest mismatch");

const ledger = fs.readFileSync(path.join(ROOT, "ledger.js"), "utf8");
const a = ledger.indexOf("// REPLAY_START");
const b = ledger.indexOf("// REPLAY_END");
if (a < 0 || b < 0) fail("ledger replay markers missing");
else {
  const chunk = ledger.slice(a, b);
  const ctx = { exports: {} };
  vm.createContext(ctx);
  vm.runInContext(chunk + "\nexports.fn = replayLineBrowser;\n", ctx, { filename: "ledger-replay.js" });
  for (const row of doc.board || []) {
    if (!row.replay || row.replay.ok !== true) continue;
    const left = replayLine(row.replay, { prior: 0, injury: 0.5 });
    const right = ctx.exports.fn(row.replay, { prior: 0, injury: 0.5 });
    if (left !== right) fail("browser replay diverges " + row.game_id + " " + left + " vs " + right);
  }
}

if (/from\(\s*["']published_lines["']\s*\)|from\(\s*["']desk_edits["']\s*\)|pushDesk\(/.test(ledger)) {
  fail("ledger.js writes production data");
}

const app = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
const mStart = app.indexOf("function mergeTicketRows");
const mEnd = app.indexOf("function seedTicketsIfNeeded");
if (mStart < 0 || mEnd < 0) fail("mergeTicketRows missing");
else {
  const ctx = { exports: {} };
  vm.createContext(ctx);
  vm.runInContext(app.slice(mStart, mEnd) + "\nexports.merge = mergeTicketRows;\n", ctx);
  const file = [{ id: "a", stake: 1 }, { id: "b", stake: 2 }];
  const remote = [{ id: "b", stake: 9 }, { id: "c", stake: 3 }];
  const merged = ctx.exports.merge(file, remote);
  const ids = merged.map((t) => t.id).join(",");
  if (ids !== "a,b,c") fail("merge order " + ids);
  const bRow = merged.find((t) => t.id === "b");
  if (!bRow || bRow.stake !== 9) fail("supabase did not win on matching id");
}

if (!/game-day site compute/.test(ledger)) fail("ledger.js does not grade from game-day lines");
if (!/game-day site compute/.test(app)) fail("app.js does not read game-day lines");

const history = JSON.parse(fs.readFileSync(path.join(ROOT, "data/model/bs-line-history-2026.json"), "utf8"));
const gameDay = indexGameDay(history);
const expect = { 2: "11-5-0", 3: "10-6-0" };
const pinnedByWeek = {};
const dayByWeek = {};
for (const week of [2, 3]) {
  const rows = (doc.board || []).filter((r) => r.week === week && r.lock_quality === "official" && r.b_line_home_spread != null);
  pinnedByWeek[week] = tallyAts(rows.map((r) => r.ats));
  dayByWeek[week] = tallyAts(rows.map((r) => {
    const gd = gameDayFor(gameDay, r);
    const line = gd ? gd.b_line : r.b_line_home_spread;
    return atsGrade(line, r.close_home_spread, r).ats;
  }));
  if (dayByWeek[week] !== expect[week]) {
    fail("week " + week + " game-day ATS " + dayByWeek[week] + " expected " + expect[week]);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
const ats = { W: 0, L: 0, P: 0 };
for (const row of w3) if (ats[row.ats] != null) ats[row.ats] += 1;
console.log("ok", "board", doc.board.length, "week3", w3.length, "ATS", ats.W + "-" + ats.L + "-" + ats.P);
console.log(
  "game-day ATS",
  "week2", dayByWeek[2],
  "week3", dayByWeek[3],
  "| pinned",
  "week2", pinnedByWeek[2],
  "week3", pinnedByWeek[3]
);

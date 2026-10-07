// Rebuilds the canonical record and checks it against the file on disk.
import fs from "fs";
import path from "path";
import { ROOT, buildCanonical, roundingSelfTest, validateDocument } from "./lib.mjs";

const errors = [];
function fail(msg) { errors.push(msg); }

for (const msg of roundingSelfTest()) fail(msg);

const fresh = buildCanonical();
const dest = path.join(ROOT, "data/record/canonical-2026.json");
if (!fs.existsSync(dest)) fail("canonical-2026.json is missing. Run build_canonical.mjs.");
else {
  const stored = JSON.parse(fs.readFileSync(dest, "utf8"));
  const live = validateDocument(stored);
  if (!live.ok) for (const msg of live.errors) fail("file: " + msg);
  if (!fresh.validation.ok) for (const msg of fresh.validation.errors) fail("rebuild: " + msg);
  if (JSON.stringify(stored.games) !== JSON.stringify(fresh.games)) {
    fail("canonical games do not match a fresh build");
  }
  if (JSON.stringify(stored.pending_locks) !== JSON.stringify(fresh.pending_locks)) {
    fail("pending locks do not match a fresh build");
  }
  if (JSON.stringify(stored.week4_locked) !== JSON.stringify(fresh.week4_locked)) {
    fail("week 4 locked lines do not match a fresh build");
  }
  if (JSON.stringify(stored.summary) !== JSON.stringify(fresh.summary)) {
    fail("summary does not match a fresh build");
  }
}

const frozenPath = path.join(ROOT, "data/record/weeks-2-3-immutable.json");
const frozen = JSON.parse(fs.readFileSync(frozenPath, "utf8"));
const byId = new Map(fresh.games.map((g) => [g.week + "|" + g.game_id, g]));
for (const row of frozen) {
  const game = byId.get(row.week + "|" + row.game_id);
  if (!game) {
    fail("missing frozen game " + row.week + "|" + row.game_id);
    continue;
  }
  for (const key of ["official_b_line", "raw_b_line", "close_home_spread", "away_score", "home_score", "ats", "clv", "upset", "b_upset_call", "b_upset_correct"]) {
    if (game[key] !== row[key]) fail(row.game_id + " " + key + " changed from " + row[key] + " to " + game[key]);
  }
}

function expect(key, pred, label) {
  const game = byId.get(key);
  if (!game) { fail("missing " + key); return; }
  if (!pred(game)) fail(label + " (" + key + ")");
}

const week = (n) => fresh.summary.weeks.find((w) => w.week === n);
if (!week(2) || week(2).text !== "11-5-0") fail("Week 2 ATS " + (week(2) && week(2).text));
if (!week(3) || week(3).text !== "10-6-0") fail("Week 3 ATS " + (week(3) && week(3).text));
const summed = fresh.summary.weeks.reduce((acc, w) => ({
  w: acc.w + w.w,
  l: acc.l + w.l,
  p: acc.p + w.p,
}), { w: 0, l: 0, p: 0 });
if (fresh.summary.ats.w !== summed.w || fresh.summary.ats.l !== summed.l || fresh.summary.ats.p !== summed.p) {
  fail("Season ATS does not add up from the weeks");
}
if (fresh.summary.games !== fresh.games.filter((g) => g.in_official_record).length) {
  fail("Summary game count does not match the rows");
}
if (fresh.grading_changes.some((g) => g.week === 2 || g.week === 3)) {
  fail("ATS changed vs the current grade: " + fresh.grading_changes.map((g) => g.game_id).join(", "));
}

expect("2|NO@BAL", (g) => g.upset === true && g.underdog === "NO" && g.b_upset_call === false, "Week 2 NO was an upset and was not a B$ outright call");
expect("2|LV@LAC", (g) => g.upset === true && g.underdog === "LV" && g.b_upset_call === true && g.b_upset_correct === true, "Week 2 LV was an upset and a correct B$ outright call");
expect("2|MIN@CHI", (g) => g.upset === true && g.underdog === "MIN" && g.b_upset_call === false, "Week 2 MIN was an upset and was not a B$ outright call");
expect("3|CAR@CLE", (g) => g.upset === true && g.underdog === "CLE" && g.b_upset_call === false, "Week 3 CLE was an upset and was not a B$ outright call");

const week4 = fresh.games.filter((g) => g.week === 4 && g.in_official_record);
if (week4.length !== 16) fail("expected 16 official Week 4 games, got " + week4.length);
if (fresh.week4_locked.length) fail("Week 4 still has " + fresh.week4_locked.length + " ungraded locks");
if (fresh.summary.games !== 48) fail("expected 48 official games, got " + fresh.summary.games);

const pit = week4.find((g) => g.game_id === "PIT@CLE");
if (!pit) fail("Week 4 PIT@CLE missing from the official record");
else {
  if (pit.raw_b_line !== 5.63) fail("PIT@CLE raw " + pit.raw_b_line);
  if (pit.official_b_line !== 5.5) fail("PIT@CLE official " + pit.official_b_line);
  if (!pit.official_rounded) fail("PIT@CLE official line is not marked rounded");
  if (pit.close_home_spread == null) fail("PIT@CLE has no close");
  if (pit.home_score == null || pit.away_score == null) fail("PIT@CLE has no score");
}
if (fresh.games.some((g) => g.week === 1)) fail("Week 1 leaked into games");
if (week4.some((g) => g.official_b_line == null || !g.official_rounded)) fail("A Week 4 official line is missing or not rounded");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("ok", fresh.summary.ats.text, "games", fresh.summary.games, "rows", fresh.validation.rows.history);
for (const w of fresh.summary.weeks) console.log("week", w.week, w.text, w.pct + "%");

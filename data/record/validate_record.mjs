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
  if (JSON.stringify(stored.week4_locked) !== JSON.stringify(fresh.week4_locked)) {
    fail("week 4 locked lines do not match a fresh build");
  }
  if (JSON.stringify(stored.summary) !== JSON.stringify(fresh.summary)) {
    fail("summary does not match a fresh build");
  }
}

const byId = new Map(fresh.games.map((g) => [g.week + "|" + g.game_id, g]));
function expect(key, pred, label) {
  const game = byId.get(key);
  if (!game) { fail("missing " + key); return; }
  if (!pred(game)) fail(label + " (" + key + ")");
}

const week = (n) => fresh.summary.weeks.find((w) => w.week === n);
if (!week(2) || week(2).text !== "11-5-0") fail("Week 2 ATS " + (week(2) && week(2).text));
if (!week(3) || week(3).text !== "10-6-0") fail("Week 3 ATS " + (week(3) && week(3).text));
if (fresh.summary.ats.text !== "21-11-0") fail("Season ATS " + fresh.summary.ats.text);
if (fresh.grading_changes.length) fail("ATS changed vs the current grade: " + fresh.grading_changes.map((g) => g.game_id).join(", "));

expect("2|NO@BAL", (g) => g.upset === true && g.underdog === "NO" && g.b_upset_call === false, "Week 2 NO was an upset and was not a B$ outright call");
expect("2|LV@LAC", (g) => g.upset === true && g.underdog === "LV" && g.b_upset_call === true && g.b_upset_correct === true, "Week 2 LV was an upset and a correct B$ outright call");
expect("2|MIN@CHI", (g) => g.upset === true && g.underdog === "MIN" && g.b_upset_call === false, "Week 2 MIN was an upset and was not a B$ outright call");
expect("3|CAR@CLE", (g) => g.upset === true && g.underdog === "CLE" && g.b_upset_call === false, "Week 3 CLE was an upset and was not a B$ outright call");

const pit = fresh.week4_locked.find((g) => g.game_id === "PIT@CLE");
if (!pit) fail("Week 4 PIT@CLE lock missing");
else {
  if (pit.raw_b_line !== 5.63) fail("PIT@CLE raw " + pit.raw_b_line);
  if (pit.official_b_line !== 5.5) fail("PIT@CLE official " + pit.official_b_line);
  if (pit.in_official_record) fail("PIT@CLE was counted in the official 32");
}
if (fresh.week4_locked.length < 16) fail("expected 16 Week 4 locks, got " + fresh.week4_locked.length);
if (fresh.games.some((g) => g.week === 1)) fail("Week 1 leaked into games");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("ok", fresh.summary.ats.text, "games", fresh.summary.games, "rows", fresh.validation.rows.history);

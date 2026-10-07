// Weekly record update. Does not recompute the B$ line and does not edit lock files.
//
//   node data/record/weekly.mjs --week 5
//
// 1. Pull the post-final ESPN DraftKings pickcenter close into data/closes/.
// 2. Append that close onto data/lines/line-history-2026.json.
// 3. Rebuild data/record/canonical-2026.json from locks, scores, and closes.
// 4. Validate. Weeks 2–3 official lines are checked against weeks-2-3-immutable.json.
//
// Pass --no-pull to keep an existing closes file. Pass --pull to refresh it.
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { ROOT } from "./lib.mjs";

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

function run(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: ROOT, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}

const week = Number(arg("--week"));
if (!Number.isInteger(week) || week < 4) {
  console.error("Usage: node data/record/weekly.mjs --week N   (N is 4 or later)");
  process.exit(1);
}

const closesRel = "data/closes/2026-w" + String(week).padStart(2, "0") + ".json";
const closesPath = path.join(ROOT, closesRel);
const pull = hasFlag("--pull") || !fs.existsSync(closesPath);
if (hasFlag("--no-pull") && !fs.existsSync(closesPath)) {
  console.error(closesRel + " is missing. Run without --no-pull.");
  process.exit(1);
}
if (pull && !hasFlag("--no-pull")) {
  run(path.join(ROOT, "data/record/pull_closes.mjs"), ["--week", String(week)]);
} else {
  console.log("keeping", closesRel);
}

run(path.join(ROOT, "data/lines/append_line_snapshot.mjs"), [
  "--tag", "close",
  "--week", String(week),
  "--from", closesRel,
]);
run(path.join(ROOT, "data/record/build_canonical.mjs"), []);
run(path.join(ROOT, "data/record/validate_record.mjs"), []);

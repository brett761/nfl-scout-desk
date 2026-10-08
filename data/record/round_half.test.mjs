import fs from "fs";
import path from "path";
import vm from "vm";
import assert from "assert";
import { spawnSync } from "node:child_process";
import { officialHomeSpread, roundHalfAwayFromZero, formatFavoriteLine, favoriteTeam } from "./round_half.mjs";
import { publishedHomeSpread, weekBoard } from "../daily/lines.mjs";
import { api, init } from "../site_parity_harness.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");

function read(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function extractFunction(src, name) {
  const start = src.indexOf("function " + name + "(");
  assert.ok(start >= 0, "missing " + name);
  let i = src.indexOf("{", start);
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === "{") depth += 1;
    else if (src[i] === "}") {
      depth -= 1;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error("unclosed " + name);
}

const cases = [
    [-9.93, -10],
    [9.93, 10],
    [-11.7, -11.5],
    [11.7, 11.5],
    [-5.25, -5.5],
    [5.25, 5.5],
  [1.25, 1.5],
  [-1.25, -1.5],
  [1.75, 2],
  [-1.75, -2],
  [5.63, 5.5],
  [0.2, 0],
  [-0.2, 0],
  [0, 0],
];
for (const [raw, expect] of cases) {
  assert.strictEqual(roundHalfAwayFromZero(raw), expect, String(raw));
}

assert.strictEqual(officialHomeSpread(3, -6.4), -6.4);
assert.strictEqual(officialHomeSpread(2, -9.93), -9.93);
assert.strictEqual(officialHomeSpread(4, -9.93), -10);
assert.strictEqual(officialHomeSpread(4, 5.63), 5.5);
assert.strictEqual(officialHomeSpread(5, -11.7), -11.5);
assert.strictEqual(publishedHomeSpread(3, -6.4, -6.5), -6.4);
assert.strictEqual(publishedHomeSpread(5, -9.93, -10), -10);
assert.strictEqual(publishedHomeSpread(5, -11.7, null), -11.5);

assert.strictEqual(formatFavoriteLine(-10, "DAL", "TB"), "DAL −10.0");
assert.strictEqual(formatFavoriteLine(-11.5, "JAX", "PHI"), "JAX −11.5");
assert.strictEqual(formatFavoriteLine(-9.93, "DAL", "TB"), "DAL −9.9");
assert.strictEqual(formatFavoriteLine(0, "DAL", "TB"), "PK");
assert.strictEqual(favoriteTeam(-9.93, "DAL", "TB"), "DAL");
assert.strictEqual(favoriteTeam(-10, "DAL", "TB"), "DAL");

const recordSrc = fs.readFileSync(path.join(ROOT, "record.js"), "utf8");
const recordRound = vm.runInNewContext(
  extractFunction(recordSrc, "num") + "\n" + extractFunction(recordSrc, "roundHalf") + "\nroundHalf",
);
for (const [raw, expect] of cases) {
  assert.strictEqual(recordRound(raw), expect, "record.js " + raw);
}

assert.strictEqual(api.roundHalfAwayFromZero(-9.93), -10);
assert.strictEqual(api.roundHalfAwayFromZero(-11.7), -11.5);
assert.strictEqual(api.officialHomeSpread(3, -6.4), -6.4);
assert.strictEqual(api.officialHomeSpread(5, -9.93), -10);
assert.strictEqual(api.formatOurLine(-10, "DAL", "TB"), "DAL −10.0");
assert.strictEqual(api.formatOurLine(-11.5, "JAX", "PHI"), "JAX −11.5");
assert.strictEqual(api.dvoaBlendShadowRound(1.25), 1.5);
assert.strictEqual(api.dvoaBlendShadowRound(-1.75), -2);

const history = read("data/model/bs-line-history-2026.json");
for (const game of history.games || []) {
  for (const version of game.versions || []) {
    if (Number(game.week) <= 3 || Number(version.week) <= 3) {
      assert.ok(!("official_b_line" in version), game.game_id + " week " + game.week + " gained an official line");
    }
  }
}

const tb = (history.games || []).find((g) => g.game_id === "TB@DAL" && Number(g.week) === 5);
const jax = (history.games || []).find((g) => g.game_id === "PHI@JAX" && Number(g.week) === 5);
assert.ok(tb && jax);
const tbLast = tb.versions[tb.versions.length - 1];
const jaxLast = jax.versions[jax.versions.length - 1];
assert.strictEqual(tbLast.b_line, -9.93);
assert.strictEqual(tbLast.official_b_line, -10);
assert.strictEqual(tbLast.official_rounded, true);
assert.strictEqual(jaxLast.b_line, -11.2);
assert.strictEqual(jaxLast.official_b_line, -11);
assert.strictEqual(jaxLast.official_rounded, true);
const jaxSaved = jax.versions.find((v) => v.b_line === -11.7);
assert.ok(jaxSaved, "the saved -11.7 raw line should still be on an earlier version");
assert.ok(!("official_b_line" in jaxSaved), "only the latest version carries the official line");
assert.strictEqual(officialHomeSpread(5, -11.7), -11.5);

const week5 = (history.games || []).filter((g) => Number(g.week) === 5);
assert.ok(week5.length >= 15);
for (const game of week5) {
  const last = game.versions[game.versions.length - 1];
  assert.strictEqual(last.official_b_line, officialHomeSpread(5, last.b_line), game.game_id);
  assert.strictEqual(last.official_rounded, true, game.game_id);
  assert.notStrictEqual(last.b_line, last.official_b_line, game.game_id + " raw was overwritten");
  const favRaw = favoriteTeam(last.b_line, game.home, game.away);
  const favOff = favoriteTeam(last.official_b_line, game.home, game.away);
  assert.strictEqual(favOff, favRaw, game.game_id + " favorite changed");
}

const board = weekBoard(history, 5);
const byId = Object.fromEntries(board.map((row) => [row.game_id, row]));
assert.strictEqual(byId["TB@DAL"].site_before, "DAL −9.9");
assert.strictEqual(byId["TB@DAL"].site_after, "DAL −10.0");
assert.strictEqual(byId["TB@DAL"].daily_before, "B$ DAL −9.2 → DAL −9.9");
assert.strictEqual(byId["TB@DAL"].daily_after, "B$ DAL −9.0 → DAL −10.0");
assert.strictEqual(byId["PHI@JAX"].site_before, "JAX −11.2");
assert.strictEqual(byId["PHI@JAX"].site_after, "JAX −11.0");
assert.strictEqual(byId["PHI@JAX"].daily_before, "B$ JAX −13.6 → JAX −11.2");
assert.strictEqual(byId["PHI@JAX"].daily_after, "B$ JAX −13.5 → JAX −11.0");
for (const row of board) {
  assert.strictEqual(row.favorite_after, row.favorite_before, row.game_id);
}

const canonical = read("data/record/canonical-2026.json");
const pendingTb = (canonical.pending_locks || []).find((g) => g.game_id === "TB@DAL");
assert.ok(pendingTb, "TB@DAL pending lock");
assert.strictEqual(pendingTb.raw_b_line, -9.93);
assert.strictEqual(pendingTb.official_b_line, -10);
for (const game of canonical.games || []) {
  if (Number(game.week) <= 3) {
    assert.notStrictEqual(game.official_rounded, true, game.game_id);
  }
}

await init();
await api.loadPublishedLines();
await api.loadGameDayLines();
await api.loadDeskPins();
await api.loadOfficialRecord();
const nfl = api.getNfl();
const siteTb = nfl.games.find((g) => g.away === "TB" && g.home === "DAL" && Number(g.week) === 5);
const siteJax = nfl.games.find((g) => g.away === "PHI" && g.home === "JAX" && Number(g.week) === 5);
assert.strictEqual(api.deskHomeSpread(siteTb), -10);
assert.strictEqual(api.deskHomeSpread(siteJax), -11);
assert.strictEqual(api.formatOurLine(api.deskHomeSpread(siteTb), siteTb.home, siteTb.away), "DAL −10.0");
assert.strictEqual(api.formatOurLine(api.deskHomeSpread(siteJax), siteJax.home, siteJax.away), "JAX −11.0");

const week3 = nfl.games.filter((g) => Number(g.week) === 3);
assert.ok(week3.length);
let sawUnrounded = false;
for (const game of week3) {
  const shown = api.deskHomeSpread(game);
  if (shown == null) continue;
  assert.strictEqual(shown, api.officialHomeSpread(3, shown));
  const tenth = Math.abs(shown * 10 - Math.round(shown * 10)) < 1e-6;
  const half = Math.abs(shown * 2 - Math.round(shown * 2)) < 1e-6;
  if (tenth && !half) sawUnrounded = true;
}
assert.ok(sawUnrounded, "a Week 3 line should still show a tenth that is not a half point");

const pySamples = [-9.93, 9.93, -11.7, 11.7, -5.25, 5.25, 1.25, -1.25, 1.75, -1.75, 0.2, -0.2, 0, 5.63, -2.75, 2.75, -0.24];
const pyRound = spawnSync("python3", ["data/daily/render_b_daily.py", "--round", ...pySamples.map(String)], { encoding: "utf8" });
assert.strictEqual(pyRound.status, 0, pyRound.stderr);
const pyGot = pyRound.stdout.trim().split("\n").map((line) => JSON.parse(line));
pySamples.forEach((raw, i) => {
  assert.strictEqual(pyGot[i], roundHalfAwayFromZero(raw), "python round " + raw);
});
const pyOfficial = spawnSync("python3", ["data/daily/render_b_daily.py", "--official", "3", "-6.4", "2", "-9.93", "4", "-9.93", "5", "-11.7", "5", "-5.25"], { encoding: "utf8" });
assert.strictEqual(pyOfficial.status, 0, pyOfficial.stderr);
const pyOff = pyOfficial.stdout.trim().split("\n").map((line) => JSON.parse(line));
assert.deepStrictEqual(pyOff, [-6.4, -9.93, -10, -11.5, -5.5]);

const tbLock = read("data/postmortem/locks/2026-w05-tb-dal.json");
assert.strictEqual(tbLock.model_home_spread, -9.93);
assert.strictEqual(tbLock.official_b_line, -10);
assert.strictEqual(tbLock.official_rounded, true);
const w3Lock = read("data/postmortem/locks/2026-w03-ten-nyg.json");
assert.strictEqual(w3Lock.model_home_spread, -5.14);
assert.ok(!("official_b_line" in w3Lock));
const w4Lock = read("data/postmortem/locks/2026-w04-pit-cle.json");
assert.strictEqual(w4Lock.model_home_spread, 5.63);
assert.strictEqual(w4Lock.official_b_line, officialHomeSpread(4, w4Lock.model_home_spread));

console.log("round_half.test.mjs ok");

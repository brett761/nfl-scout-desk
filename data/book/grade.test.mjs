import fs from "fs";
import path from "path";
import assert from "assert";
import { gradeBook, keyCross, filterRows, parseTeamPick } from "./grade.js";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");

function read(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function locks() {
  const dir = path.join(ROOT, "data/postmortem/locks");
  return fs.readdirSync(dir).filter((n) => n.endsWith(".json") && !n.includes("note") && !n.includes("summary")).map((n) => {
    const row = read("data/postmortem/locks/" + n);
    row.__source = "data/postmortem/locks/" + n;
    return row;
  });
}

const tickets = read("data/tickets-2026.json").tickets;
const games = read("data/nfl-2026.json").games;
const lineHistory = read("data/lines/line-history-2026.json");
const closes = ["data/closes/2026-w01.json", "data/closes/2026-w02.json"].map((rel) => {
  const file = read(rel);
  file.__source = rel;
  return file;
});

assert.deepEqual(keyCross(-2.5, -3.5), [3]);
assert.deepEqual(keyCross(3.5, 2.5), [3]);
assert.deepEqual(keyCross(-6.5, -7.5), [7]);
assert.deepEqual(keyCross(-3, -3), []);
assert.deepEqual(keyCross(2.5, 10), [3, 7]);
assert.equal(parseTeamPick("No · DAL wins by over 3.5"), null);
assert.equal(parseTeamPick("DEN Yes (win)").kind, "ml");

const { rows, rollup } = gradeBook({ tickets, games, closes, lineHistory, locks: locks() });
const byId = Object.fromEntries(rows.map((r) => [r.id, r]));

const pit = byId["w3-pit-plus35"];
assert.ok(pit, "week 3 PIT ticket");
assert.equal(pit.side, "dog");
assert.equal(pit.where, "home");
assert.equal(pit.result, "W");
assert.equal(pit.outright, "W");
assert.equal(pit.clv, 0);

const bal = byId["w3-bal-minus3"];
assert.equal(bal.result, "P");
assert.equal(bal.side, "fav");

const open = byId["w4-wsh-plus3"];
assert.equal(open.result, "PENDING");
assert.equal(open.side, "dog");
assert.equal(open.clv, null);
assert.equal(open.outright, null);

assert.equal(byId["w1-km-dal-no-cover35"], undefined);

const ne = byId["w1-ne-plus35"];
assert.equal(ne.side, "dog");
assert.equal(ne.where, "away");
assert.equal(ne.result, "W");
assert.equal(ne.outright, "L");

const graded = rollup.season.w + rollup.season.l + rollup.season.p;
assert.equal(graded, 18, "week 1 and week 3 team spreads, Kalshi alt markets left out");
assert.ok(rollup.season.pending >= 13, "open tickets stay pending");
const w3 = rollup.byWeek.find((w) => w.week === 3);
assert.deepEqual({ w: w3.w, l: w3.l, p: w3.p }, { w: 6, l: 4, p: 1 });
assert.equal(filterRows(rows, { week: 4 }).every((r) => r.result === "PENDING"), true);

console.log(JSON.stringify({
  season: rollup.season,
  byWeek: rollup.byWeek,
  bySide: rollup.bySide,
  byUnits: rollup.byUnits,
  clv: rollup.clv,
  upset: rollup.upset,
  rows: rows.length,
}, null, 2));

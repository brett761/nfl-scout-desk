#!/usr/bin/env node
/**
 * Fail if a published B$ snapshot was edited or deleted.
 *
 *   node data/model/check_model_history.mjs
 *   node data/model/check_model_history.mjs --self-test
 *
 * Compares data/model/bs-line-history-2026.json with the same path in HEAD.
 * A version that already existed must match byte for byte. New versions may be appended.
 *
 * Also checks data/lines/line-history-2026.json: every street snapshot must carry an
 * "at" that is an ISO timestamp with an offset (Z or +hh:mm). A null or missing "at"
 * fails, and so does a B$ version without published_at.
 *
 * DVOA blend shadow (shadow_dvoa_blend on a version, Week 5+): it is part of the version, so a
 * past snapshot's shadow can't be edited, removed, or added after the fact ("modified ... shadow").
 * Each stored shadow must have a numeric raw, rounded = raw to the nearest 0.5 (.25/.75 away from
 * zero), and in_b_line false.
 */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const REL = "data/model/bs-line-history-2026.json";
const OUT = path.join(ROOT, REL);
const LINES_REL = "data/lines/line-history-2026.json";
const LINES = path.join(ROOT, LINES_REL);
const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;

function validStamp(value) {
  return typeof value === "string" && ISO_WITH_OFFSET.test(value) && !Number.isNaN(Date.parse(value));
}

// Every street snapshot needs a real timestamp. Returns a list of problems.
export function checkLineHistory(data) {
  const problems = [];
  for (const g of (data && data.games) || []) {
    const label = "W" + g.week + " " + g.away + "@" + g.home;
    (g.snapshots || []).forEach((s, i) => {
      if (!validStamp(s.at)) {
        problems.push("line-history " + label + " snapshot " + i + " (" + s.tag + ", " + s.source + ") has bad at: " + JSON.stringify(s.at === undefined ? "missing" : s.at));
      }
    });
  }
  return problems;
}

export function checkPublishedAt(data) {
  const problems = [];
  for (const g of (data && data.games) || []) {
    for (const v of g.versions || []) {
      if (!validStamp(v.published_at)) problems.push(g.game_id + " W" + g.week + " version " + v.version + " has bad published_at: " + JSON.stringify(v.published_at ?? null));
    }
  }
  return problems;
}

function roundHalfAway(value) {
  const n = Number(value);
  const sign = n < 0 ? -1 : 1;
  const steps = Math.abs(n) / 0.5;
  const lower = Math.floor(steps + 1e-9);
  const out = sign * (steps - lower > 0.5 - 1e-8 ? lower + 1 : lower) * 0.5;
  return out === 0 ? 0 : out;
}

// Stored shadow values must be well formed and never claim to be the B$ line.
export function checkShadow(data) {
  const problems = [];
  for (const g of (data && data.games) || []) {
    for (const v of g.versions || []) {
      if (!("shadow_dvoa_blend" in v)) continue;
      const sh = v.shadow_dvoa_blend;
      const label = g.game_id + " W" + g.week + " version " + v.version + " shadow";
      if (!sh || typeof sh !== "object") { problems.push(label + " is not an object"); continue; }
      if (typeof sh.raw !== "number" || !Number.isFinite(sh.raw)) { problems.push(label + " raw is not a number"); continue; }
      if (sh.rounded !== roundHalfAway(sh.raw)) problems.push(label + " rounded " + sh.rounded + " is not " + roundHalfAway(sh.raw) + " (raw " + sh.raw + ")");
      if (sh.in_b_line !== false) problems.push(label + " must have in_b_line false");
      if (Number(g.week) < 5) problems.push(label + " is before Week 5");
    }
  }
  return problems;
}

function canon(value) {
  if (Array.isArray(value)) return "[" + value.map(canon).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map((k) => JSON.stringify(k) + ":" + canon(value[k])).join(",") + "}";
  }
  return JSON.stringify(value);
}

function indexVersions(data) {
  const map = new Map();
  for (const g of (data && data.games) || []) {
    const versions = g.versions || [];
    for (let i = 0; i < versions.length; i++) {
      const v = versions[i];
      if (v.version !== i + 1) {
        throw new Error(g.game_id + " version numbers must be 1..n");
      }
      const expected = v.version === 1 ? null : v.version - 1;
      if (v.supersedes !== expected) {
        throw new Error(g.game_id + " version " + v.version + " supersedes " + v.supersedes + ", expected " + expected);
      }
      map.set(g.game_id + "#" + g.week + "#" + v.version, canon(v));
    }
  }
  return map;
}

export function compare(previous, current) {
  const prior = indexVersions(previous);
  const next = indexVersions(current);
  const shadowOf = (data) => {
    const m = new Map();
    for (const g of (data && data.games) || []) for (const v of g.versions || []) m.set(g.game_id + "#" + g.week + "#" + v.version, canon(v.shadow_dvoa_blend ?? null));
    return m;
  };
  const priorShadow = shadowOf(previous);
  const nextShadow = shadowOf(current);
  const problems = [];
  for (const [key, fp] of prior) {
    if (!next.has(key)) problems.push("deleted " + key);
    else if (next.get(key) !== fp) {
      problems.push("modified " + key + (priorShadow.get(key) !== nextShadow.get(key) ? " (shadow_dvoa_blend changed)" : ""));
    }
  }
  return problems;
}

function previousFromGit() {
  try {
    execFileSync("git", ["cat-file", "-e", "HEAD:" + REL], { cwd: ROOT, stdio: "ignore" });
  } catch {
    return null;
  }
  const text = execFileSync("git", ["show", "HEAD:" + REL], { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  return JSON.parse(text);
}

function selfTest() {
  const previous = {
    games: [{
      game_id: "NE@SEA",
      week: 1,
      versions: [
        { version: 1, game_id: "NE@SEA", week: 1, b_line: -0.2, supersedes: null },
        { version: 2, game_id: "NE@SEA", week: 1, b_line: -0.4, supersedes: 1 },
      ],
    }],
  };
  const ok = JSON.parse(JSON.stringify(previous));
  ok.games[0].versions.push({ version: 3, game_id: "NE@SEA", week: 1, b_line: -0.5, supersedes: 2 });
  if (compare(previous, ok).length) throw new Error("append should pass");
  const edited = JSON.parse(JSON.stringify(previous));
  edited.games[0].versions[0].b_line = -1;
  if (!compare(previous, edited).some((p) => p.startsWith("modified"))) throw new Error("edit should fail");
  const dropped = JSON.parse(JSON.stringify(previous));
  dropped.games[0].versions.pop();
  if (!compare(previous, dropped).some((p) => p.startsWith("deleted"))) throw new Error("delete should fail");

  const lines = { games: [{ week: 5, away: "TB", home: "DAL", snapshots: [
    { tag: "open", home_spread: -10, at: "2026-10-05T12:25:00.000Z", source: "x" },
    { tag: "mid", home_spread: -10, at: "2026-10-05T08:25:00-04:00", source: "x" },
  ] }] };
  if (checkLineHistory(lines).length) throw new Error("valid timestamps should pass");
  const nullAt = JSON.parse(JSON.stringify(lines));
  nullAt.games[0].snapshots[0].at = null;
  if (checkLineHistory(nullAt).length !== 1) throw new Error("null at should fail");
  const missingAt = JSON.parse(JSON.stringify(lines));
  delete missingAt.games[0].snapshots[1].at;
  if (checkLineHistory(missingAt).length !== 1) throw new Error("missing at should fail");
  const noOffset = JSON.parse(JSON.stringify(lines));
  noOffset.games[0].snapshots[0].at = "2026-10-05 8:25 AM ET";
  if (checkLineHistory(noOffset).length !== 1) throw new Error("non-ISO at should fail");
  const noPub = JSON.parse(JSON.stringify(ok));
  noPub.games[0].versions[2].published_at = null;
  noPub.games[0].versions.forEach((v) => { if (v.published_at === undefined) v.published_at = "2026-09-07T12:00:00Z"; });
  if (checkPublishedAt(noPub).length !== 1) throw new Error("null published_at should fail");

  // Shadow: append OK; edit, removal, or late addition of a stored shadow fails.
  const sh = { raw: -7.73, rounded: -7.5, weight: 0.5, dvoa_week: 5, dvoa_plays_through_week: 4, in_b_line: false };
  const prevS = { games: [{ game_id: "TB@DAL", week: 5, versions: [
    { version: 1, game_id: "TB@DAL", week: 5, b_line: -10.11, supersedes: null },
    { version: 2, game_id: "TB@DAL", week: 5, b_line: -10.11, supersedes: 1, shadow_dvoa_blend: sh },
  ] }] };
  const appendS = JSON.parse(JSON.stringify(prevS));
  appendS.games[0].versions.push({ version: 3, game_id: "TB@DAL", week: 5, b_line: -10.11, supersedes: 2, shadow_dvoa_blend: { ...sh, raw: -7.2, rounded: -7 } });
  if (compare(prevS, appendS).length || checkShadow(appendS).length) throw new Error("shadow append should pass");
  const editS = JSON.parse(JSON.stringify(prevS));
  editS.games[0].versions[1].shadow_dvoa_blend.raw = -6.9;
  if (!compare(prevS, editS).some((p) => p.includes("shadow_dvoa_blend changed"))) throw new Error("shadow edit should fail");
  const dropS = JSON.parse(JSON.stringify(prevS));
  delete dropS.games[0].versions[1].shadow_dvoa_blend;
  if (!compare(prevS, dropS).some((p) => p.includes("shadow_dvoa_blend changed"))) throw new Error("shadow removal should fail");
  const lateS = JSON.parse(JSON.stringify(prevS));
  lateS.games[0].versions[0].shadow_dvoa_blend = sh;
  if (!compare(prevS, lateS).some((p) => p.includes("shadow_dvoa_blend changed"))) throw new Error("adding a shadow to a past version should fail");
  const badRound = JSON.parse(JSON.stringify(prevS));
  badRound.games[0].versions[1].shadow_dvoa_blend.rounded = -8;
  if (checkShadow(badRound).length !== 1) throw new Error("bad shadow rounding should fail");
  const inLine = JSON.parse(JSON.stringify(prevS));
  inLine.games[0].versions[1].shadow_dvoa_blend.in_b_line = true;
  if (checkShadow(inLine).length !== 1) throw new Error("shadow claiming in_b_line should fail");
  const half = JSON.parse(JSON.stringify(prevS));
  half.games[0].versions[1].shadow_dvoa_blend = { ...sh, raw: 3.25, rounded: 3.5 };
  if (checkShadow(half).length) throw new Error(".25 away from zero should pass");
  console.log("self-test ok (incl. shadow_dvoa_blend guard)");
}

function main() {
  if (process.argv.includes("--self-test")) {
    selfTest();
    return;
  }
  if (!fs.existsSync(OUT)) {
    console.error("missing " + REL);
    process.exit(1);
  }
  const current = JSON.parse(fs.readFileSync(OUT, "utf8"));
  indexVersions(current);
  const stampProblems = checkPublishedAt(current).concat(checkShadow(current));
  if (fs.existsSync(LINES)) stampProblems.push(...checkLineHistory(JSON.parse(fs.readFileSync(LINES, "utf8"))));
  if (stampProblems.length) {
    console.error(stampProblems.join("\n"));
    process.exit(1);
  }
  const previous = previousFromGit();
  if (!previous) {
    console.log("no previous commit of " + REL + ". Structural check passed.");
    return;
  }
  const problems = compare(previous, current);
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.log("published versions match the previous commit; all timestamps present");
}

if (process.argv[1] && process.argv[1].endsWith("check_model_history.mjs")) main();

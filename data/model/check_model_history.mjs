#!/usr/bin/env node
/**
 * Fail if a published B$ snapshot was edited or deleted.
 *
 *   node data/model/check_model_history.mjs
 *   node data/model/check_model_history.mjs --self-test
 *
 * Compares data/model/bs-line-history-2026.json with the same path in HEAD.
 * A version that already existed must match byte for byte. New versions may be appended.
 */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const REL = "data/model/bs-line-history-2026.json";
const OUT = path.join(ROOT, REL);

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
  const problems = [];
  for (const [key, fp] of prior) {
    if (!next.has(key)) problems.push("deleted " + key);
    else if (next.get(key) !== fp) problems.push("modified " + key);
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
  console.log("self-test ok");
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
  console.log("published versions match the previous commit");
}

if (process.argv[1] && process.argv[1].endsWith("check_model_history.mjs")) main();

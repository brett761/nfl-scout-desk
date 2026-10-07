// Pull post-final ESPN DraftKings pickcenter open/close for one week.
// Same source family as data/closes/2026-w02.json. Does not invent a line.
// A game with no DraftKings home close is written with close_spread null.
import fs from "fs";
import path from "path";
import { ROOT } from "./lib.mjs";

const DK_RE = /draft\s*kings|draftkings/i;
const ENDPOINT = "https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=";

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i < 0) return null;
  const next = process.argv[i + 1];
  if (next == null || next.startsWith("--")) return "";
  return next;
}

function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseSigned(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().toUpperCase();
  if (!s) return null;
  if (s === "PK" || s === "EVEN" || s === "PICK" || s === "PICKEM") return 0;
  const m = s.match(/([+-]?\d+(?:\.\d+)?)/);
  if (!m) return null;
  return Number(m[1]);
}

function parseTotal(raw) {
  return parseSigned(String(raw || "").replace(/^[ou]/i, ""));
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

async function fetchSummary(id) {
  const res = await fetch(ENDPOINT + encodeURIComponent(id), {
    headers: { "user-agent": "nfl-scout-desk week close pull", accept: "application/json" },
  });
  if (!res.ok) throw new Error("ESPN " + id + " HTTP " + res.status);
  return res.json();
}

function espnScore(summary, side) {
  const comps = (((summary.header || {}).competitions || [])[0] || {}).competitors
    || (((summary.boxscore || {}).teams) || []);
  const row = (comps || []).find((c) => c && (c.homeAway === side || c.homeAway === side.toLowerCase()));
  if (!row) return null;
  return num(row.score);
}

export async function pullCloses(week) {
  const nfl = readJson("data/nfl-2026.json");
  const games = (nfl.games || []).filter((g) => {
    if (!g || Number(g.week) !== Number(week)) return false;
    const t = String(g.season_type || g.type || "REG").toUpperCase();
    return t !== "PRE" && t !== "POST";
  });
  const pulled = new Date().toISOString();
  const rows = [];
  const problems = [];
  for (const game of games) {
    const id = String(game.id);
    let summary = null;
    try {
      summary = await fetchSummary(id);
    } catch (err) {
      problems.push(game.away + "@" + game.home + ": " + err.message);
      rows.push({
        game: game.away + "@" + game.home,
        espn_id: id,
        open_spread: null,
        close_spread: null,
        open_total: null,
        close_total: null,
        status: String(game.status || ""),
        away_score: num(game.away_score),
        home_score: num(game.home_score),
        provider: null,
        close_missing: true,
        why: err.message,
      });
      continue;
    }
    const cards = Array.isArray(summary.pickcenter) ? summary.pickcenter : [];
    const card = cards.find((c) => c && c.provider && DK_RE.test(String(c.provider.name || ""))) || null;
    const home = card && card.pointSpread && card.pointSpread.home;
    const open = home ? parseSigned(home.open && home.open.line) : null;
    const close = home ? parseSigned(home.close && home.close.line) : null;
    const total = card && card.total;
    const espnAway = espnScore(summary, "away");
    const espnHome = espnScore(summary, "home");
    const schedAway = num(game.away_score);
    const schedHome = num(game.home_score);
    const scoresAgree = espnAway != null && espnHome != null && espnAway === schedAway && espnHome === schedHome;
    const status = ((((summary.header || {}).competitions || [])[0] || {}).status || {}).type || {};
    if (!card) problems.push(game.away + "@" + game.home + ": no DraftKings pickcenter card");
    else if (close == null) problems.push(game.away + "@" + game.home + ": DraftKings card has no home close");
    if (espnAway != null && schedAway != null && !scoresAgree) {
      problems.push(game.away + "@" + game.home + ": ESPN score " + espnAway + "-" + espnHome + " does not match data/nfl-2026.json " + schedAway + "-" + schedHome);
    }
    rows.push({
      game: game.away + "@" + game.home,
      espn_id: id,
      open_spread: open,
      close_spread: close,
      open_total: total ? parseTotal(total.over && total.over.open && total.over.open.line) : null,
      close_total: total ? parseTotal(total.over && total.over.close && total.over.close.line) : null,
      status: status.name || String(game.status || ""),
      away_score: schedAway,
      home_score: schedHome,
      espn_away_score: espnAway,
      espn_home_score: espnHome,
      scores_agree: scoresAgree,
      provider: card && card.provider ? card.provider.name : null,
      home_close_line: home && home.close ? home.close.line : null,
      home_open_line: home && home.open ? home.open.line : null,
    });
  }
  const doc = {
    season: 2026,
    week: Number(week),
    pulled,
    source: "ESPN DraftKings pickcenter pointSpread.home open/close (post-final)",
    endpoint: ENDPOINT + "{espn_id}",
    sign_convention: "home-centric (neg = home favored)",
    score_note: "away_score and home_score are copied from data/nfl-2026.json. espn_*_score is the summary cross-check. A mismatch is left in place and listed when this script prints problems.",
    games: rows,
  };
  return { doc, problems, games: games.length };
}

async function main() {
  const week = Number(arg("--week") || 4);
  if (!Number.isInteger(week) || week < 1) {
    console.error("--week is required");
    process.exit(1);
  }
  const { doc, problems, games } = await pullCloses(week);
  const rel = "data/closes/2026-w" + String(week).padStart(2, "0") + ".json";
  const dest = path.join(ROOT, rel);
  fs.writeFileSync(dest, JSON.stringify(doc, null, 2) + "\n");
  const withClose = doc.games.filter((g) => g.close_spread != null).length;
  console.log("wrote", rel, "games", games, "closes", withClose);
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith("pull_closes.mjs")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

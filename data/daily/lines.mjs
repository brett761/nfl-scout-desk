#!/usr/bin/env node
// Published B$ Daily lines. Prints the board. Does not send email.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { num, officialHomeSpread, formatFavoriteLine, favoriteTeam } from "../record/round_half.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// Week 4+ uses the stored official line when it is filled, otherwise the
// same rounding the grader uses. Earlier weeks stay the raw number.
export function publishedHomeSpread(week, raw, official) {
  if (Number(week) < 4) return num(raw);
  const stored = num(official);
  if (stored != null) return stored;
  return officialHomeSpread(week, raw);
}

function versionsWithLine(game) {
  return (game.versions || []).filter((v) => v && num(v.b_line) != null);
}

function edgeSide(street, line, home, away) {
  if (street == null || line == null) return null;
  const gap = street - line;
  if (Math.abs(gap) < 1e-9) return "PK";
  return gap > 0 ? home : away;
}

export function dailyRow(game) {
  const versions = versionsWithLine(game);
  if (!game || !versions.length) return null;
  const first = versions[0];
  const last = versions[versions.length - 1];
  const week = Number(game.week);
  const firstRaw = num(first.b_line);
  const lastRaw = num(last.b_line);
  const firstPub = publishedHomeSpread(week, first.b_line, first.official_b_line);
  const lastPub = publishedHomeSpread(week, last.b_line, last.official_b_line);
  const street = num(last.market_spread);
  const label = (n) => formatFavoriteLine(n, game.home, game.away);
  return {
    game_id: game.game_id,
    week,
    away: game.away,
    home: game.home,
    raw_first: firstRaw,
    raw_latest: lastRaw,
    official_first: firstPub,
    official_latest: lastPub,
    site_before: label(lastRaw),
    site_after: label(lastPub),
    daily_before: "B$ " + label(firstRaw) + " → " + label(lastRaw),
    daily_after: "B$ " + label(firstPub) + " → " + label(lastPub),
    favorite_before: favoriteTeam(lastRaw, game.home, game.away),
    favorite_after: favoriteTeam(lastPub, game.home, game.away),
    edge_before: edgeSide(street, lastRaw, game.home, game.away),
    edge_after: edgeSide(street, lastPub, game.home, game.away),
    street,
  };
}

export function weekBoard(history, week) {
  return (history.games || [])
    .filter((g) => g && Number(g.week) === Number(week))
    .map(dailyRow)
    .filter(Boolean)
    .sort((a, b) => a.game_id.localeCompare(b.game_id));
}

function main() {
  if (!process.argv.includes("--print")) return;
  const weekArg = process.argv.indexOf("--week");
  const week = weekArg >= 0 ? Number(process.argv[weekArg + 1]) : 5;
  const history = JSON.parse(fs.readFileSync(path.join(ROOT, "data/model/bs-line-history-2026.json"), "utf8"));
  for (const row of weekBoard(history, week)) {
    console.log([
      row.game_id,
      "site " + row.site_before + " => " + row.site_after,
      row.daily_before + " || " + row.daily_after,
      "fav " + row.favorite_before + " => " + row.favorite_after,
      "edge " + row.edge_before + " => " + row.edge_after,
    ].join(" | "));
  }
}

if (process.argv[1] && process.argv[1].endsWith("lines.mjs")) main();

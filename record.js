/* Bet History and Overall Record. Both read data/record/canonical-2026.json.
   Weeks 2–3 lines are the stored game-day numbers. They are not rounded here.
   Week 4 on uses the rounded lock already stored on each row. */
(function () {
  const FILE = "./data/record/canonical-2026.json?v=record1007";
  const EPS = 0.05;

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function num(v) {
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function round2(n) {
    if (n == null || !Number.isFinite(Number(n))) return null;
    return Math.round(Number(n) * 100) / 100;
  }

  function onHalf(value) {
    const n = num(value);
    if (n == null) return false;
    return Math.abs(n * 2 - Math.round(n * 2)) < 1e-6;
  }

  function roundHalf(value) {
    const n = num(value);
    if (n == null) return null;
    const sign = n < 0 ? -1 : 1;
    const steps = Math.abs(n) / 0.5;
    const lower = Math.floor(steps + 1e-9);
    const frac = steps - lower;
    const roundedSteps = frac > 0.5 - 1e-8 ? lower + 1 : lower;
    const out = sign * roundedSteps * 0.5;
    return out === 0 ? 0 : out;
  }

  function weekSpan(games) {
    const weeks = games.map((g) => Number(g.week)).filter((n) => Number.isFinite(n));
    if (!weeks.length) return "Week 2 on";
    const lo = Math.min.apply(null, weeks);
    const hi = Math.max.apply(null, weeks);
    return lo === hi ? "Week " + lo : "Weeks " + lo + "–" + hi;
  }

  function atsGrade(bLine, close, row) {
    const homeScore = row && row.home_score;
    const awayScore = row && row.away_score;
    if (bLine == null || close == null || homeScore == null || awayScore == null) {
      return { ats: "unavailable" };
    }
    const edge = close - bLine;
    let side = null;
    if (edge > EPS) side = "home";
    else if (edge < -EPS) side = "away";
    const margin = (homeScore - awayScore) + close;
    let cover = "push";
    if (margin > EPS) cover = "home";
    else if (margin < -EPS) cover = "away";
    if (!side || cover === "push") return { ats: "P" };
    return { ats: side === cover ? "W" : "L" };
  }

  function clvOf(open, close, bLine) {
    const o = num(open);
    const c = num(close);
    const b = num(bLine);
    if (o == null || c == null || b == null) return null;
    if (Math.abs(b - o) < EPS) return 0;
    return round2(b < o ? o - c : c - o);
  }

  function upsetOf(close, bLine, home, away, homeScore, awayScore) {
    const c = num(close);
    const b = num(bLine);
    const hs = num(homeScore);
    const as = num(awayScore);
    if (c == null || hs == null || as == null) return { upset: null, call: null };
    if (Math.abs(c) < EPS) return { upset: false, call: false, pickem: true };
    const underdog = c < 0 ? away : home;
    const favorite = c < 0 ? home : away;
    const upset = (underdog === home ? hs : as) > (favorite === home ? hs : as);
    let call = false;
    if (b != null) call = underdog === home ? b < -EPS : b > EPS;
    return { upset, call, pickem: false };
  }

  function pct(wins, losses) {
    const n = wins + losses;
    if (!n) return null;
    return Math.round((1000 * wins) / n) / 10;
  }

  function pctText(wins, losses) {
    const p = pct(wins, losses);
    return p == null ? "—" : p + "%";
  }

  function fmtNum(n) {
    const v = num(n);
    if (v == null) return "—";
    const abs = Math.round(Math.abs(v) * 100) / 100;
    const body = Number.isInteger(abs) ? abs.toFixed(1) : String(abs);
    if (Math.abs(v) < 0.005) return "0";
    return (v < 0 ? "−" : "+") + body;
  }

  function fmtSpread(homeLine, home, away) {
    const n = num(homeLine);
    if (n == null) return "—";
    if (Math.abs(n) < 0.005) return "PK";
    const abs = Math.round(Math.abs(n) * 100) / 100;
    const body = Number.isInteger(abs) ? abs.toFixed(1) : String(abs);
    if (n < 0) return home + " −" + body;
    return away + " −" + body;
  }

  function fmtScore(game) {
    if (game.away_score == null || game.home_score == null) return "—";
    return game.away + " " + game.away_score + " – " + game.home + " " + game.home_score;
  }

  function atsLabel(ats) {
    if (ats === "W") return "W";
    if (ats === "L") return "L";
    if (ats === "P") return "P";
    return "—";
  }

  function check(doc) {
    const errors = [];
    if (!doc || !Array.isArray(doc.games)) {
      return ["The record file has no game list."];
    }
    const games = doc.games;
    const locked = Array.isArray(doc.pending_locks)
      ? doc.pending_locks
      : (Array.isArray(doc.week4_locked) ? doc.week4_locked : []);
    if (games.some((g) => Number(g.week) === 1) || locked.some((g) => Number(g.week) === 1)) {
      errors.push("Week 1 is in the file.");
    }
    const official = games.filter((g) => g && g.in_official_record);
    if (!official.length) errors.push("The record has no official games.");
    if (official.some((g) => Number(g.week) < 2)) {
      errors.push("An official game is before Week 2.");
    }
    const ids = new Set(official.map((g) => g.week + "|" + g.game_id));
    if (ids.size !== official.length) errors.push("A game appears twice.");
    let w = 0;
    let l = 0;
    let p = 0;
    let other = 0;
    for (const game of official) {
      if (game.ats === "W") w += 1;
      else if (game.ats === "L") l += 1;
      else if (game.ats === "P") p += 1;
      else other += 1;
      if (Number(game.week) < 4) {
        if (game.raw_b_line != null && game.official_b_line != null && Math.abs(game.raw_b_line - game.official_b_line) > 0.001) {
          errors.push(game.game_id + " official line does not match the stored game-day line.");
        }
        if (game.official_rounded) errors.push(game.game_id + " is marked rounded inside Weeks 2 and 3.");
      } else if (game.official_b_line == null || !onHalf(game.official_b_line) || roundHalf(game.raw_b_line) !== game.official_b_line) {
        errors.push(game.game_id + " official line is not the rounded lock.");
      }
      if (!game.sportsbook) errors.push(game.game_id + " has no sportsbook.");
      if (game.open_home_spread == null && !(game.review || []).some((r) => r.field === "open")) {
        errors.push(game.game_id + " is missing an opening line and is not flagged.");
      }
      if (game.open_home_spread != null && !game.open_source) errors.push(game.game_id + " open has no source.");
      if (game.close_home_spread == null && !(game.review || []).some((r) => r.field === "close")) {
        errors.push(game.game_id + " is missing a closing line and is not flagged.");
      }
      if (game.close_home_spread != null && !game.close_source) errors.push(game.game_id + " close has no source.");
      if (!game.b_line_source) errors.push(game.game_id + " B$ line has no source.");
      const grade = atsGrade(game.official_b_line, game.close_home_spread, game);
      if (game.close_home_spread != null && grade.ats !== game.ats) {
        errors.push(game.game_id + " ATS does not match its official line and close.");
      }
      const clv = clvOf(game.open_home_spread, game.close_home_spread, game.official_b_line);
      if (game.open_home_spread != null && game.close_home_spread != null && clv !== game.clv) {
        errors.push(game.game_id + " CLV does not match its open, official line, and close.");
      }
      const upset = upsetOf(game.close_home_spread, game.official_b_line, game.home, game.away, game.home_score, game.away_score);
      if (game.close_home_spread != null && upset.upset !== game.upset) {
        errors.push(game.game_id + " upset flag does not match the closing line.");
      }
      if (game.close_home_spread != null && upset.call !== game.b_upset_call) {
        errors.push(game.game_id + " B$ upset call does not match the official line.");
      }
    }
    if (other) errors.push(other + " games are not a win, loss, or push.");
    if (w + l + p !== official.length) errors.push("ATS " + w + "-" + l + "-" + p + " does not add to " + official.length + ".");
    for (const game of locked) {
      if (Number(game.week) < 4) errors.push(game.game_id + " is listed with Week 4.");
      if (!onHalf(game.official_b_line)) errors.push(game.game_id + " official line is not a half-point line.");
      if (!game.b_line_source) errors.push(game.game_id + " lock has no source.");
    }
    if (doc.summary && doc.summary.ats && doc.summary.ats.w + doc.summary.ats.l + doc.summary.ats.p !== w + l + p) {
      errors.push("The stored summary does not match the rows.");
    }
    return errors;
  }

  function rollup(games) {
    const tally = { W: 0, L: 0, P: 0 };
    const weeks = new Map();
    let clvN = 0;
    let clvSum = 0;
    let beat = 0;
    let favorites = 0;
    let upsets = 0;
    let calls = 0;
    let correct = 0;
    for (const game of games) {
      if (tally[game.ats] != null) tally[game.ats] += 1;
      if (!weeks.has(game.week)) weeks.set(game.week, { W: 0, L: 0, P: 0 });
      const week = weeks.get(game.week);
      if (week[game.ats] != null) week[game.ats] += 1;
      if (game.clv != null) {
        clvN += 1;
        clvSum += game.clv;
        if (game.beat_close) beat += 1;
      }
      if (!game.pickem && game.close_home_spread != null) favorites += 1;
      if (game.upset) upsets += 1;
      if (game.b_upset_call) {
        calls += 1;
        if (game.b_upset_correct) correct += 1;
      }
    }
    return {
      n: games.length,
      ats: tally,
      weeks: [...weeks.entries()].sort((a, b) => a[0] - b[0]),
      clvN,
      clvAvg: clvN ? round2(clvSum / clvN) : null,
      beat,
      favorites,
      upsets,
      calls,
      correct,
    };
  }

  function alertHtml(errors) {
    return `<div class="record-alert" role="alert">
      <p>The record did not reconcile, so the totals are withheld.</p>
      <ul>${errors.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>
    </div>`;
  }

  function cell(label, value, extra) {
    return `<td data-label="${esc(label)}"${extra || ""}>${value}</td>`;
  }

  function historyTable(games) {
    const rows = games.map((game) => `<tr>
      ${cell("Week", esc(game.week), ' class="num"')}
      ${cell("Game", esc(game.away) + " @ " + esc(game.home))}
      ${cell("B$ Line", esc(fmtSpread(game.official_b_line, game.home, game.away)), ' class="num"')}
      ${cell("Final Score", esc(fmtScore(game)), ' class="num"')}
      ${cell("ATS", `<span class="ats-mark ats-${esc(String(game.ats).toLowerCase())}">${esc(atsLabel(game.ats))}</span>`, ' class="num"')}
    </tr>`).join("");
    return `<div class="table-wrap"><table class="ledger record-table history-table">
      <thead><tr><th>Week</th><th>Game</th><th>B$ Line</th><th>Final Score</th><th>ATS</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  }

  function overallTable(games) {
    const rows = games.map((game) => {
      const upset = game.pickem ? "—" : game.upset ? "Yes" : "No";
      let call = "No";
      if (game.b_upset_call) call = game.b_upset_correct ? "Yes · won" : "Yes · lost";
      const openNote = game.open_fallback ? `<div class="flag-note">Line log</div>` : "";
      const review = (game.review || []).map((r) => `<div class="flag-note">${esc(r.reason)}</div>`).join("");
      return `<tr>
        ${cell("Week", esc(game.week), ' class="num"')}
        ${cell("Game", esc(game.away) + " @ " + esc(game.home) + review)}
        ${cell("Opening Line", esc(fmtSpread(game.open_home_spread, game.home, game.away)) + openNote, ' class="num"')}
        ${cell("B$ Line", esc(fmtSpread(game.official_b_line, game.home, game.away)), ' class="num"')}
        ${cell("Closing Line", esc(fmtSpread(game.close_home_spread, game.home, game.away)), ' class="num"')}
        ${cell("Final", esc(fmtScore(game)), ' class="num"')}
        ${cell("ATS", `<span class="ats-mark ats-${esc(String(game.ats).toLowerCase())}">${esc(atsLabel(game.ats))}</span>`, ' class="num"')}
        ${cell("CLV", esc(game.clv == null ? "—" : fmtNum(game.clv)), ' class="num"')}
        ${cell("Upset", esc(upset))}
        ${cell("B$ Upset Call", esc(call))}
      </tr>`;
    }).join("");
    return `<div class="table-wrap"><table class="ledger record-table overall-table">
      <thead><tr>
        <th>Week</th><th>Game</th><th>Opening Line</th><th>B$ Line</th><th>Closing Line</th><th>Final</th><th>ATS</th><th>CLV</th><th>Upset</th><th>B$ Upset Call</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  }

  function names(games, pick) {
    return games.map((game) => "W" + game.week + " " + pick(game)).join(" · ");
  }

  function metric(value, label, definition) {
    return `<button type="button" class="record-metric" aria-expanded="false">
      <strong>${esc(value)}</strong>
      <span>${label}</span>
      <span class="record-def">${definition}</span>
    </button>`;
  }

  function dashboard(games, doc) {
    const s = rollup(games);
    const ats = s.ats.W + "-" + s.ats.L + "-" + s.ats.P;
    const span = weekSpan(games);
    const book = doc.sportsbook_of_record || "ESPN DraftKings";
    const rules = doc.rules || {};
    const source = "Counted from data/record/canonical-2026.json. Sportsbook of record: " + book + ".";
    const weeks = s.weeks.map(([week, rec]) => {
      const n = rec.W + rec.L + rec.P;
      return `<li>Week ${esc(week)}: ${esc(rec.W + "-" + rec.L + "-" + rec.P)} | ${esc(n)} games | ${esc(pctText(rec.W, rec.L))}</li>`;
    }).join("");
    const callsWrong = s.calls - s.correct;
    const callLine = s.calls
      ? s.correct + "-" + callsWrong + " | " + s.calls + " calls | " + pctText(s.correct, callsWrong)
      : "0 calls";
    const upsets = games.filter((g) => g.upset);
    const calls = games.filter((g) => g.b_upset_call);
    const fallbacks = doc.open_fallbacks || [];
    const fallback = fallbacks.length
      ? `<p class="prior-note">${esc(fallbacks.map((g) => "W" + g.week + " " + g.game_id).join(", "))}: the opening line is the line-log DraftKings number. Line history did not store a separate DraftKings open.</p>`
      : "";
    const cards = [
      metric(String(s.n), "Official games · " + esc(span), esc((rules.official_games || "Finished games from Week 2 on. Week 1 is excluded.") + " " + source)),
      metric(ats, "ATS: " + esc(ats) + " | " + esc(s.n) + " games | " + esc(pctText(s.ats.W, s.ats.L)), esc((rules.ats || "The side the official B$ line liked against the DraftKings close.") + " Pushes stay in the record and out of the percentage. " + source)),
      metric(fmtNum(s.clvAvg), "Avg CLV | " + esc(s.clvN) + " games", esc((rules.clv || "Points the DraftKings open beat the DraftKings close, on the side the official B$ line liked.") + " " + source)),
      metric(String(s.upsets), "Outright upsets | " + esc(s.favorites) + " games with a favorite | " + esc(s.favorites ? pctText(s.upsets, s.favorites - s.upsets) : "—"), esc("The DraftKings closing underdog won outright. A closing pick’em is not an upset. " + source)),
      metric(s.correct + "-" + callsWrong, "B$ upset calls: " + esc(callLine), esc("A B$ upset call means the official line had that closing underdog winning outright, not merely covering. The record is correct calls, then misses. " + source)),
    ].join("");
    return `<div class="record-summary record-dash" data-official-rows="${esc(s.n)}">
        ${cards}
      </div>
      <ul class="record-weeks">${weeks}</ul>
      <p class="record-names"><span>Outright upsets</span> ${esc(names(upsets, (g) => g.underdog))}</p>
      <p class="record-names"><span>B$ called the underdog to win</span> ${calls.length ? esc(names(calls, (g) => g.underdog + (g.b_upset_correct ? " won" : " lost"))) : "None"}</p>
      ${fallback}
      <p class="prior-note">CLV is the points the DraftKings open beat the DraftKings close, on the side the official B$ line liked. An upset is a closing underdog winning outright. A B$ upset call means that same underdog was the team we had winning, not just covering. Tap a card for the definition and the file it comes from.</p>`;
  }

  function week4Html(locked) {
    if (!locked || !locked.length) return "";
    const rows = locked.map((game) => {
      const why = (game.review || []).map((r) => `<div class="flag-note">${esc(r.reason)}</div>`).join("");
      return `<tr>
      <td data-label="Week">${esc(game.week)}</td>
      <td data-label="Game">${esc(game.away)} @ ${esc(game.home)}${why}</td>
      <td class="num" data-label="Raw">${esc(fmtSpread(game.raw_b_line, game.home, game.away))}</td>
      <td class="num" data-label="Official">${esc(fmtSpread(game.official_b_line, game.home, game.away))}</td>
    </tr>`;
    }).join("");
    return `<details class="record-fold">
      <summary>Locked lines not in the record yet</summary>
      <p class="prior-note">The official line is the locked raw number rounded to the nearest half point. Halfway cases go away from zero. The lock file is unchanged. A game moves into the record after its final score and DraftKings close are both on file.</p>
      <div class="table-wrap"><table class="ledger record-table">
        <thead><tr><th>Week</th><th>Game</th><th>Raw B$</th><th>Official B$</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </details>`;
  }

  function paint(doc, errors) {
    const history = document.getElementById("bet-history-root");
    const overall = document.getElementById("overall-record-root");
    const fold = document.getElementById("week4-slot");
    if (errors.length) {
      const html = alertHtml(errors);
      if (history) history.innerHTML = html;
      if (overall) overall.innerHTML = html;
      if (fold) fold.innerHTML = "";
      return;
    }
    const games = doc.games.filter((g) => g.in_official_record);
    const s = rollup(games);
    const ats = s.ats.W + "-" + s.ats.L + "-" + s.ats.P;
    const span = weekSpan(games);
    const head = `<p class="record-ats">ATS: ${esc(ats)} | ${esc(s.n)} games | ${esc(pctText(s.ats.W, s.ats.L))}</p>`;
    const historyLede = document.getElementById("history-lede");
    const recordLede = document.getElementById("record-lede");
    const historyEyebrow = document.getElementById("history-eyebrow");
    const recordEyebrow = document.getElementById("record-eyebrow");
    if (historyEyebrow) historyEyebrow.textContent = span + " · the line we published";
    if (recordEyebrow) recordEyebrow.textContent = "Same " + s.n + " games · behind sign-in";
    if (historyLede) {
      historyLede.textContent = "What the B$ line was before the game, the final score, and the against-the-spread result. " + s.n + " games. The same games as Overall Record.";
    }
    if (recordLede) {
      recordLede.textContent = "The record, the closing line value, and the outright upsets. Opening and closing lines are ESPN DraftKings. Week 1 is not in this record.";
    }
    if (history) {
      history.innerHTML = head + historyTable(games);
      history.dataset.officialRows = String(games.length);
    }
    if (overall) {
      overall.innerHTML = dashboard(games, doc) + overallTable(games);
      overall.dataset.officialRows = String(games.length);
    }
    const waiting = Array.isArray(doc.pending_locks) ? doc.pending_locks : doc.week4_locked;
    if (fold) fold.innerHTML = week4Html(waiting);
  }

  let doc = null;
  let errors = ["The record is loading."];
  let started = false;

  function render() {
    paint(doc, errors);
  }

  async function load() {
    try {
      const res = await fetch(FILE);
      if (!res.ok) throw new Error(String(res.status));
      doc = await res.json();
      errors = check(doc);
      if (doc.validation && doc.validation.ok === false && Array.isArray(doc.validation.errors)) {
        for (const msg of doc.validation.errors) {
          if (!errors.includes(msg)) errors.push(msg);
        }
      }
    } catch (err) {
      doc = null;
      errors = ["The record did not load."];
      console.warn("canonical record", err);
    }
    render();
  }

  window.BMBRecord = { render, load };

  function start() {
    if (started) return;
    started = true;
    load();
  }

  document.addEventListener("click", (event) => {
    const btn = event.target.closest(".record-metric");
    if (!btn) return;
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", open ? "false" : "true");
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

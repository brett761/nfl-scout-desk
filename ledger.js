/* Bet Outcomes, public Bet History, Methodology routing, admin sandbox.
   Numbers come from data/published/finals.json. This file does not recompute
   a production B Line and does not write production tables. */
(function () {
  const FILE = "./data/published/finals.json?v=w3pub0929";
  const EXP_KEY = "nflScout.experiments.v1";

  // REPLAY_START
  function replayLineBrowser(replay, scales) {
    if (!replay || replay.ok !== true) return null;
    const home = replay.home;
    const away = replay.away;
    if (!home || !away) return null;
    if (!Number.isFinite(home.eff) || !Number.isFinite(away.eff)) return null;
    const base = {
      prior: 1, fa: 1, draft: 1, madden: 1, pff: 1, pff_ytd: 1, sos: 1, return: 1,
      injury: 1, adjust: 1, context: 1, hfa: 1, coach: 1, prep: 1, ats: 1, travel: 1, matchup: 1,
    };
    const s = Object.assign(base, scales || {});
    const keys = ["prior", "fa", "draft", "madden", "pff", "pff_ytd", "sos", "return", "injury", "adjust", "context"];
    const gameKeys = ["hfa", "coach", "prep", "ats", "travel", "matchup"];
    const eff = (side) => {
      let e = side.eff;
      for (let i = 0; i < keys.length; i++) {
        const v = side[keys[i]];
        if (!Number.isFinite(v)) continue;
        const scale = Number(s[keys[i]]);
        if (!Number.isFinite(scale)) return null;
        e += (scale - 1) * v;
      }
      return e;
    };
    const homeE = eff(home);
    const awayE = eff(away);
    if (homeE == null || awayE == null) return null;
    let extra = 0;
    for (let i = 0; i < gameKeys.length; i++) {
      const key = gameKeys[i];
      const g = Number(replay[key]);
      const scale = Number(s[key]);
      if (!Number.isFinite(scale)) return null;
      extra += (Number.isFinite(g) ? g : 0) * scale;
    }
    return Math.round((-((homeE - awayE) + extra)) * 100) / 100;
  }
  // REPLAY_END

  const SCALE_FIELDS = [
    ["prior", "2025 prior contribution"],
    ["pff_ytd", "This-season team grades"],
    ["injury", "Injury points"],
    ["pff", "Prior-year player grades"],
    ["madden", "Madden group"],
    ["draft", "Draft points"],
    ["fa", "Free-agency points on the lock"],
    ["sos", "Schedule strength"],
    ["return", "Return from injury"],
    ["adjust", "Manual adjust"],
    ["context", "Context notes"],
    ["hfa", "Home field"],
    ["coach", "Coach"],
    ["prep", "Week 1 / bye"],
    ["ats", "Career against the spread"],
    ["travel", "Travel / rest"],
    ["matchup", "Matchup"],
  ];

  const PRESETS = [
    { id: "production", label: "Production — frozen lock", change: "none", scales: {} },
    { id: "drop2025", label: "Test — remove 2025 prior", change: "remove_2025", scales: { prior: 0 } },
    { id: "recent", label: "Test — reduce recent grades", change: "recent_weight", scales: { pff_ytd: 0.5 } },
    { id: "injuryOff", label: "Test — injury off", change: "injury", scales: { injury: 0 } },
    { id: "injuryHalf", label: "Test — injury half", change: "injury", scales: { injury: 0.5 } },
  ];

  let board = [];
  let hashWarn = "";
  let remoteNote = "";
  let scales = {};
  let presetId = "production";
  let lastRun = null;
  let viewingSaved = null;

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isAdmin() {
    return !!(window.BMB && window.BMB.role === "admin");
  }

  function gameKey(row) {
    return row.season + "|" + row.week + "|" + row.game_id;
  }

  function fmtLine(homeLine, home, away) {
    const n = Number(homeLine);
    if (homeLine == null || !Number.isFinite(n)) return "—";
    if (n === 0) return "PK";
    const abs = Math.abs(n).toFixed(1);
    if (n < 0) return home + " −" + abs;
    return away + " −" + abs;
  }

  function fmtScore(row) {
    if (row.away_score == null || row.home_score == null) return "—";
    return row.away + " " + row.away_score + " – " + row.home + " " + row.home_score;
  }

  function positionLabel(v) {
    if (v === "b_line") return "B Line";
    if (v === "market") return "House";
    if (v === "even") return "Even";
    return "—";
  }

  function positionClass(v) {
    if (v === "b_line") return "pos-b";
    if (v === "market") return "pos-mkt";
    if (v === "even") return "pos-even";
    return "pos-even";
  }

  function qualityLabel(q) {
    if (q === "reconstructed") return "Reconstructed";
    if (q === "post_final") return "After final";
    if (q === "null_line") return "No B Line";
    return "";
  }

  function canon(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return "[" + value.map(canon).join(",") + "]";
    const keys = Object.keys(value).filter((k) => k !== "content_sha256").sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + canon(value[k])).join(",") + "}";
  }

  async function digest(text) {
    if (!crypto || !crypto.subtle) return null;
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function atsGrade(bLine, close, row) {
    if (bLine == null || close == null || row.home_score == null || row.away_score == null) {
      return { ats: "unavailable", ats_side: null };
    }
    const edge = close - bLine;
    let side = null;
    if (edge > 0.05) side = "home";
    else if (edge < -0.05) side = "away";
    const margin = (row.home_score - row.away_score) + close;
    let cover = "push";
    if (margin > 0.05) cover = "home";
    else if (margin < -0.05) cover = "away";
    if (!side || cover === "push") {
      return { ats: "P", ats_side: side === "home" ? row.home : side === "away" ? row.away : null };
    }
    return { ats: side === cover ? "W" : "L", ats_side: side === "home" ? row.home : row.away };
  }

  function rank(ats) {
    if (ats === "W") return 2;
    if (ats === "P") return 1;
    if (ats === "L") return 0;
    return null;
  }

  function readSaved() {
    try {
      const raw = JSON.parse(localStorage.getItem(EXP_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function writeSaved(list) {
    try { localStorage.setItem(EXP_KEY, JSON.stringify(list.slice(0, 40))); } catch { /* ignore */ }
  }

  function currentScales() {
    const out = {};
    for (const [key] of SCALE_FIELDS) {
      const el = document.getElementById("sb-scale-" + key);
      const n = el ? Number(el.value) : 1;
      out[key] = Number.isFinite(n) ? n : 1;
    }
    return out;
  }

  function filteredRows(prefix) {
    const season = val(prefix + "-season");
    const week = val(prefix + "-week");
    const team = val(prefix + "-team");
    const game = val(prefix + "-game");
    const version = val(prefix + "-version");
    return board.filter((row) => {
      if (String(row.status).toUpperCase() !== "FINAL") return false;
      if (season && String(row.season) !== season) return false;
      if (week && String(row.week) !== week) return false;
      if (team && row.away !== team && row.home !== team) return false;
      if (game && row.game_id !== game) return false;
      if (version && row.model_version !== version) return false;
      return true;
    });
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
  }

  function fillSelect(id, html, keep) {
    const el = document.getElementById(id);
    if (!el) return;
    const current = keep ? el.value : "";
    el.innerHTML = html;
    if (current && Array.from(el.options).some((o) => o.value === current)) el.value = current;
  }

  function wireFilters(prefix, onChange) {
    for (const suffix of ["-season", "-week", "-team", "-game", "-version"]) {
      const el = document.getElementById(prefix + suffix);
      if (el) el.addEventListener("change", onChange);
    }
  }

  function summaryHtml(rows, withAts) {
    const official = rows.filter((r) => r.lock_quality === "official" && r.b_line_home_spread != null);
    const pos = { b_line: 0, market: 0, even: 0 };
    const grade = { W: 0, L: 0, P: 0 };
    for (const row of official) {
      if (pos[row.position] != null) pos[row.position] += 1;
      if (grade[row.ats] != null) grade[row.ats] += 1;
    }
    const decided = grade.W + grade.L;
    const pct = decided ? Math.round((1000 * grade.W) / decided) / 10 : 0;
    const flagged = rows.length - official.length;
    return `<div class="record-summary">
      <div><strong>${official.length}</strong><span>Official games</span></div>
      <div><strong>${pos.b_line}</strong><span>B Line closer</span></div>
      <div><strong>${pos.market}</strong><span>House closer</span></div>
      <div><strong>${pos.even}</strong><span>Even</span></div>
      ${withAts ? `<div><strong>${grade.W}–${grade.L}–${grade.P}</strong><span>ATS ${pct}%</span></div>` : ""}
      <div><strong>${flagged}</strong><span>Flagged, off the record</span></div>
    </div>`;
  }

  function rowHtml(row, withAts) {
    const flag = qualityLabel(row.lock_quality);
    const when = row.published_at || (flag ? "No publish time on the lock" : "—");
    return `<tr>
      <td class="num">${esc(row.week)}</td>
      <td>${esc(row.away)} @ ${esc(row.home)}${flag ? `<div class="flag-note">${esc(flag)}</div>` : ""}</td>
      <td class="num">${esc(fmtLine(row.open_home_spread, row.home, row.away))}</td>
      <td class="num">${esc(fmtLine(row.close_home_spread, row.home, row.away))}</td>
      <td class="num">${esc(fmtLine(row.b_line_home_spread, row.home, row.away))}</td>
      <td class="num">${esc(fmtScore(row))}</td>
      <td><span class="pos-pill ${positionClass(row.position)}">${esc(positionLabel(row.position))}</span></td>
      <td>${esc(when)}</td>
      ${withAts ? `<td class="num">${esc(row.ats === "unavailable" ? "—" : row.ats)}${row.ats_side ? " " + esc(row.ats_side) : ""}</td>` : ""}
    </tr>`;
  }

  function tableHead(withAts) {
    return `<tr>
      <th>Wk</th><th>Game</th><th>Open</th><th>Close</th><th>B Line</th><th>Final</th><th>Better position</th><th>Published</th>
      ${withAts ? "<th>ATS</th>" : ""}
    </tr>`;
  }

  let bookRows = [];
  let bookNote = "";

  function formatPts(n) {
    if (n == null || !Number.isFinite(Number(n))) return "—";
    const r = Math.round(Number(n) * 1000) / 1000;
    const body = String(Math.abs(r));
    if (r > 0) return "+" + body;
    if (r < 0) return "−" + body;
    return "0";
  }

  function pctText(pct) {
    return pct == null ? "" : " · " + pct + "%";
  }

  function pendingText(rec) {
    return rec && rec.pending ? " · " + rec.pending + " pending" : "";
  }

  function bookFilters() {
    return {
      season: val("history-season"),
      week: val("history-week"),
      team: val("history-team"),
    };
  }

  function visibleBookRows() {
    const f = bookFilters();
    return bookRows.filter((row) => {
      if (f.season && String(row.season) !== String(f.season)) return false;
      if (f.week && String(row.week) !== String(f.week)) return false;
      if (f.team && row.away !== f.team && row.home !== f.team && row.team !== f.team) return false;
      return row.kind === "spread" || row.side === "dog";
    });
  }

  function splitList(title, lines) {
    return `<section><h3>${esc(title)}</h3><ul>${lines.join("")}</ul></section>`;
  }

  function splitItem(label, rec) {
    return `<li><span>${esc(label)}</span><strong>${esc(rec.text)}${esc(pctText(rec.pct))}${esc(pendingText(rec))}</strong></li>`;
  }

  function paintBook() {
    const sum = document.getElementById("history-book-summary");
    const groups = document.getElementById("history-book-groups");
    const list = document.getElementById("history-book-list");
    const empty = document.getElementById("history-book-empty");
    if (!sum || !list) return;
    if (!window.BMBBook || !bookRows.length) {
      sum.innerHTML = "";
      if (groups) groups.innerHTML = "";
      list.innerHTML = "";
      if (empty) {
        empty.hidden = false;
        empty.textContent = bookNote || "The ticket book is loading.";
      }
      return;
    }
    const rows = visibleBookRows();
    const roll = window.BMBBook.rollup(rows.filter((row) => row.kind === "spread" || row.side === "dog"));
    const season = roll.season;
    const clv = roll.clv;
    const upset = roll.upset;
    const clvAvg = clv.avg == null ? "—" : formatPts(clv.avg);
    const beat = clv.n ? clv.beat + " of " + clv.n : "—";
    const beatPct = clv.beatPct == null ? "" : " · " + clv.beatPct + "%";
    sum.innerHTML = `<div><strong>${esc(season.text)}</strong><span>ATS ${season.pct == null ? "—" : season.pct + "%"}${esc(pendingText(season))}</span></div>
      <div><strong>${esc(clvAvg)}</strong><span>Avg CLV · beat close ${esc(beat)}${esc(beatPct)}</span></div>
      <div><strong>${esc(String(clv.crossed[3]))} / ${esc(String(clv.crossed[7]))}</strong><span>Crossed 3 / crossed 7</span></div>
      <div><strong>${esc(upset.covered.text)}</strong><span>Dogs covered${upset.covered.pct == null ? "" : " · " + upset.covered.pct + "%"}</span></div>
      <div><strong>${esc(String(upset.outrightWins))} of ${esc(String(upset.outrightKnown))}</strong><span>Dogs won outright</span></div>`;
    if (groups) {
      const weeks = roll.byWeek.map((rec) => splitItem("Week " + rec.week, rec));
      const sides = [
        splitItem("Favorite", roll.bySide.fav),
        splitItem("Dog", roll.bySide.dog),
        splitItem("Pick’em", roll.bySide.pk),
        splitItem("Home", roll.bySide.home),
        splitItem("Away", roll.bySide.away),
      ];
      const units = roll.byUnits.map((rec) => splitItem(rec.label, rec));
      groups.innerHTML = splitList("By week", weeks) + splitList("By side", sides) + splitList("By units", units);
    }
    if (empty) {
      empty.hidden = rows.length > 0;
      if (!rows.length) empty.textContent = "No spread tickets in this filter.";
    }
    list.innerHTML = rows.map((row) => {
      const res = row.kind === "ml"
        ? (row.outright === "W" || row.outright === "L" || row.outright === "P" ? "SU " + row.outright : "Pending")
        : (row.result === "PENDING" ? "Pending" : row.result);
      const resClass = (row.kind === "spread" ? row.result : row.outright) === "W" ? "profit-up" : (row.kind === "spread" ? row.result : row.outright) === "L" ? "profit-down" : "";
      const key = row.keys && row.keys.length ? `<span class="book-key">crossed ${esc(row.keys.join(" · "))}</span>` : "";
      const outright = row.side === "dog" && row.outright === "W" ? `<span class="book-key">outright</span>` : "";
      return `<button type="button" class="book-row" data-ticket="${esc(row.id)}">
        <span class="book-wk">W${esc(row.week)}</span>
        <span class="book-main"><span class="book-game">${esc(row.game)}</span><span class="book-pick">${esc(row.pick)}</span></span>
        <span class="book-extra">${row.kind === "spread" ? "CLV " + esc(formatPts(row.clv)) : "Moneyline"}${key}${outright}</span>
        <span class="book-res ${resClass}">${esc(res)}</span>
      </button>`;
    }).join("");
  }

  function openHistory(id) {
    const row = bookRows.find((r) => r.id === id);
    const sheet = document.getElementById("history-sheet");
    const body = document.getElementById("history-sheet-body");
    const title = document.getElementById("history-sheet-title");
    if (!row || !sheet || !body) return;
    if (title) title.textContent = row.game;
    const side = row.side === "dog" ? "Dog" : row.side === "fav" ? "Favorite" : row.side === "pk" ? "Pick’em" : "—";
    const where = row.where === "home" ? "Home" : "Away";
    const units = row.units == null ? "unset" : String(row.units) + "u";
    const outright = row.side !== "dog" ? "—" : row.outright === "W" ? "Won outright" : row.outright === "L" ? "Lost outright" : row.outright === "P" ? "Tied" : "No final score";
    const ats = row.kind === "spread" ? (row.result === "PENDING" ? "Pending" : row.result) : "—";
    const keys = row.keys && row.keys.length ? "Crossed " + row.keys.join(" and ") : "No 3 or 7";
    const src = row.closeSource ? String(row.closeSource).split("/").pop() : "—";
    body.innerHTML = `<dl class="book-sheet">
      <div><dt>Pick</dt><dd>${esc(row.pick)}</dd></div>
      <div><dt>Line taken</dt><dd>${row.line == null ? "—" : esc(formatPts(row.line))}</dd></div>
      <div><dt>Close</dt><dd>${row.close == null ? "—" : esc(formatPts(row.close))}</dd></div>
      <div><dt>CLV</dt><dd>${esc(formatPts(row.clv))}</dd></div>
      <div><dt>Key numbers</dt><dd>${esc(keys)}</dd></div>
      <div><dt>ATS</dt><dd>${esc(ats)}</dd></div>
      <div><dt>Side</dt><dd>${esc(side)} · ${esc(where)} · ${esc(units)}</dd></div>
      <div><dt>Outright</dt><dd>${esc(outright)}</dd></div>
      <div><dt>Close file</dt><dd>${esc(src)}</dd></div>
    </dl>`;
    sheet.hidden = false;
    const overlay = document.getElementById("overlay");
    if (overlay) overlay.hidden = false;
    const closer = document.getElementById("history-sheet-close");
    if (closer) closer.focus();
  }

  function closeHistory() {
    const sheet = document.getElementById("history-sheet");
    if (sheet) sheet.hidden = true;
    if (typeof hideOverlayIfIdle === "function") hideOverlayIfIdle();
  }

  function ensureHistory() {
    const root = document.getElementById("history-root");
    if (!root || root.dataset.ready) return;
    root.dataset.ready = "1";
    root.innerHTML = `<div class="record-filters">
        <label class="sort-field"><span>Season</span><select id="history-season" aria-label="Season"></select></label>
        <label class="sort-field"><span>Week</span><select id="history-week" aria-label="Week"></select></label>
        <label class="sort-field"><span>Team</span><select id="history-team" aria-label="Team"></select></label>
        <label class="sort-field"><span>Game</span><select id="history-game" aria-label="Game"></select></label>
        <label class="sort-field"><span>Version</span><select id="history-version" aria-label="Model version"></select></label>
      </div>
      <section class="book-panel" id="history-book" aria-labelledby="history-book-title">
        <h2 id="history-book-title">Against the number</h2>
        <p class="prior-note">Spread tickets already on the ledger, graded at the line taken. Pending stays pending. The close is the closes file, then the line history, then the pre-kick lock. A dog’s outright win is marked only from the final score.</p>
        <div class="record-summary" id="history-book-summary"></div>
        <div class="book-groups" id="history-book-groups"></div>
        <div class="book-list" id="history-book-list"></div>
        <p class="table-empty" id="history-book-empty" hidden>No spread tickets in this filter.</p>
      </section>
      <h2 class="book-published-title">Published B Line</h2>
      <p class="hash-warn" id="history-hash-warn" hidden></p>
      <div id="history-summary"></div>
      <div class="table-wrap"><table class="ledger record-table"><thead>${tableHead(true)}</thead><tbody id="history-body"></tbody></table></div>
      <p class="table-empty" id="history-empty" hidden>No final games in this filter.</p>
      <p class="prior-note">Open is the first logged market line. Close is the post-final closes file when we have one, otherwise the pre-kick lock. The B Line is the frozen publication. Flagged rows were not a clean pre-kick compute and stay off the record above. ATS on that table is the side the B Line liked against the close. It is not a ticket.</p>`;
    wireFilters("history", paintHistory);
    root.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-ticket]");
      if (!btn) return;
      openHistory(btn.getAttribute("data-ticket"));
    });
    const closer = document.getElementById("history-sheet-close");
    if (closer && !closer.dataset.bound) {
      closer.dataset.bound = "1";
      closer.addEventListener("click", closeHistory);
    }
  }

  function ensureOutcomes() {
    const root = document.getElementById("outcomes-root");
    if (!root || root.dataset.ready) return;
    root.dataset.ready = "1";
    root.innerHTML = `<div class="record-filters">
        <label class="sort-field"><span>Season</span><select id="outcomes-season" aria-label="Season"></select></label>
        <label class="sort-field"><span>Week</span><select id="outcomes-week" aria-label="Week"></select></label>
        <label class="sort-field"><span>Team</span><select id="outcomes-team" aria-label="Team"></select></label>
        <label class="sort-field"><span>Game</span><select id="outcomes-game" aria-label="Game"></select></label>
        <label class="sort-field"><span>Version</span><select id="outcomes-version" aria-label="Model version"></select></label>
      </div>
      <div id="outcomes-summary"></div>
      <div class="table-wrap"><table class="ledger record-table"><thead>${tableHead(false)}</thead><tbody id="outcomes-body"></tbody></table></div>
      <p class="table-empty" id="outcomes-empty" hidden>No final games in this filter.</p>
      <p class="prior-note">Same frozen rows as the public Bet History. A later model does not move these lines.</p>`;
    wireFilters("outcomes", paintOutcomes);
  }

  function refreshFilterChoices() {
    const teams = [];
    const seenT = new Set();
    for (const row of board) {
      for (const t of [row.away, row.home]) {
        if (!seenT.has(t)) { seenT.add(t); teams.push(t); }
      }
    }
    teams.sort();
    const seasons = [];
    const weeks = [];
    const games = [];
    const versions = [];
    const seen = { s: new Set(), w: new Set(), g: new Set(), v: new Set() };
    for (const row of board) {
      if (!seen.s.has(row.season)) { seen.s.add(row.season); seasons.push(row.season); }
      if (!seen.w.has(row.week)) { seen.w.add(row.week); weeks.push(row.week); }
      if (!seen.g.has(row.game_id)) { seen.g.add(row.game_id); games.push(row.game_id); }
      if (row.model_version && !seen.v.has(row.model_version)) { seen.v.add(row.model_version); versions.push(row.model_version); }
    }
    for (const row of bookRows) {
      if (!seen.s.has(row.season)) { seen.s.add(row.season); seasons.push(row.season); }
      if (!seen.w.has(row.week)) { seen.w.add(row.week); weeks.push(row.week); }
      for (const t of [row.away, row.home]) {
        if (!seenT.has(t)) { seenT.add(t); teams.push(t); }
      }
    }
    teams.sort();
    weeks.sort((a, b) => a - b);
    games.sort();
    const opt = (list, label) => `<option value="">${label}</option>` + list.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
    for (const prefix of ["history", "outcomes", "sb"]) {
      fillSelect(prefix + "-season", opt(seasons, "All"), true);
      fillSelect(prefix + "-week", opt(weeks, "All"), true);
      fillSelect(prefix + "-team", opt(teams, "All"), true);
      fillSelect(prefix + "-game", opt(games, "All"), true);
      fillSelect(prefix + "-version", opt(versions, "All"), true);
    }
  }

  function paintHistory() {
    ensureHistory();
    const rows = filteredRows("history");
    const body = document.getElementById("history-body");
    const empty = document.getElementById("history-empty");
    const sum = document.getElementById("history-summary");
    const warn = document.getElementById("history-hash-warn");
    if (sum) sum.innerHTML = summaryHtml(rows, true);
    if (body) body.innerHTML = rows.map((row) => rowHtml(row, true)).join("");
    if (empty) empty.hidden = rows.length > 0;
    paintBook();
    if (warn) {
      warn.hidden = !hashWarn && !remoteNote;
      warn.textContent = [hashWarn, remoteNote].filter(Boolean).join(" ");
    }
  }

  function paintOutcomes() {
    ensureOutcomes();
    const rows = filteredRows("outcomes");
    const body = document.getElementById("outcomes-body");
    const empty = document.getElementById("outcomes-empty");
    const sum = document.getElementById("outcomes-summary");
    if (sum) sum.innerHTML = summaryHtml(rows, false);
    if (body) body.innerHTML = rows.map((row) => rowHtml(row, false)).join("");
    if (empty) empty.hidden = rows.length > 0;
  }

  function scaleMarkup() {
    return SCALE_FIELDS.map(([key, label]) => {
      const current = scales[key] == null ? 1 : scales[key];
      const opts = [0, 0.5, 1].map((n) => `<option value="${n}"${Number(current) === n ? " selected" : ""}>${n === 1 ? "As locked" : n === 0 ? "Off" : "Half"}</option>`).join("");
      return `<label class="sort-field"><span>${esc(label)}</span><select id="sb-scale-${key}" data-scale="${key}">${opts}</select></label>`;
    }).join("");
  }

  function runExperiment(rows, usedScales) {
    const games = [];
    let withheld = 0;
    for (const row of rows) {
      if (row.b_line_home_spread == null || !row.replay || row.replay.ok !== true) {
        withheld += 1;
        games.push({
          game_id: row.game_id,
          week: row.week,
          season: row.season,
          away: row.away,
          home: row.home,
          away_score: row.away_score,
          home_score: row.home_score,
          open_home_spread: row.open_home_spread,
          close_home_spread: row.close_home_spread,
          production: row.b_line_home_spread,
          experimental: null,
          diff: null,
          production_ats: row.ats,
          experimental_ats: "unavailable",
          model_version: row.model_version,
          lock_quality: row.lock_quality,
          withheld: true,
        });
        continue;
      }
      const exp = replayLineBrowser(row.replay, usedScales);
      const graded = atsGrade(exp, row.close_home_spread, row);
      const diff = exp == null || row.b_line_home_spread == null ? null : Math.round((exp - row.b_line_home_spread) * 100) / 100;
      games.push({
        game_id: row.game_id,
        week: row.week,
        season: row.season,
        away: row.away,
        home: row.home,
        away_score: row.away_score,
        home_score: row.home_score,
        open_home_spread: row.open_home_spread,
        close_home_spread: row.close_home_spread,
        production: row.b_line_home_spread,
        experimental: exp,
        diff,
        production_ats: row.ats,
        experimental_ats: graded.ats,
        model_version: row.model_version,
        lock_quality: row.lock_quality,
        withheld: exp == null,
      });
    }
    const tested = games.filter((g) => !g.withheld && g.experimental != null);
    const agg = { tested: tested.length, withheld, prodW: 0, prodL: 0, prodP: 0, expW: 0, expL: 0, expP: 0, improved: 0, worsened: 0, unchanged: 0 };
    for (const g of tested) {
      if (g.production_ats === "W") agg.prodW += 1;
      else if (g.production_ats === "L") agg.prodL += 1;
      else if (g.production_ats === "P") agg.prodP += 1;
      if (g.experimental_ats === "W") agg.expW += 1;
      else if (g.experimental_ats === "L") agg.expL += 1;
      else if (g.experimental_ats === "P") agg.expP += 1;
      const a = rank(g.production_ats);
      const b = rank(g.experimental_ats);
      if (a == null || b == null || a === b) agg.unchanged += 1;
      else if (b > a) agg.improved += 1;
      else agg.worsened += 1;
    }
    const prodDec = agg.prodW + agg.prodL;
    const expDec = agg.expW + agg.expL;
    agg.prodPct = prodDec ? Math.round((1000 * agg.prodW) / prodDec) / 10 : 0;
    agg.expPct = expDec ? Math.round((1000 * agg.expW) / expDec) / 10 : 0;
    return { games, agg };
  }

  function aggHtml(agg) {
    if (!agg) return "";
    return `<div class="record-summary">
      <div><strong>${agg.tested}</strong><span>Games tested</span></div>
      <div><strong>${agg.prodW}–${agg.prodL}</strong><span>Production ${agg.prodPct}%</span></div>
      <div><strong>${agg.expW}–${agg.expL}</strong><span>Experimental ${agg.expPct}%</span></div>
      <div><strong>${agg.improved}</strong><span>Improved</span></div>
      <div><strong>${agg.worsened}</strong><span>Worsened</span></div>
      <div><strong>${agg.unchanged}</strong><span>No change</span></div>
      <div><strong>${agg.withheld}</strong><span>No replay</span></div>
    </div>`;
  }

  function sandboxTable(games) {
    if (!games || !games.length) return `<p class="table-empty">No games in this filter.</p>`;
    const body = games.map((g) => `<tr>
      <td class="num">${esc(g.week)}</td>
      <td>${esc(g.away)} @ ${esc(g.home)}${g.lock_quality && g.lock_quality !== "official" ? `<div class="flag-note">${esc(qualityLabel(g.lock_quality))}</div>` : ""}</td>
      <td class="num">${esc(fmtScore(g))}</td>
      <td class="num">${esc(fmtLine(g.open_home_spread, g.home, g.away))}</td>
      <td class="num">${esc(fmtLine(g.close_home_spread, g.home, g.away))}</td>
      <td class="num">${esc(fmtLine(g.production, g.home, g.away))}</td>
      <td class="num">${esc(fmtLine(g.experimental, g.home, g.away))}</td>
      <td class="num">${g.diff == null ? "—" : esc((g.diff > 0 ? "+" : "") + Number(g.diff).toFixed(2))}</td>
      <td class="num">${esc(g.production_ats === "unavailable" ? "—" : g.production_ats)}</td>
      <td class="num">${esc(g.experimental_ats === "unavailable" ? "—" : g.experimental_ats)}</td>
    </tr>`).join("");
    return `<div class="table-wrap"><table class="ledger record-table">
      <thead><tr><th>Wk</th><th>Game</th><th>Final</th><th>Open</th><th>Close</th><th>Production</th><th>Experimental</th><th>Diff</th><th>Prod</th><th>Test</th></tr></thead>
      <tbody>${body}</tbody>
    </table></div>`;
  }

  function savedListHtml() {
    const change = val("sb-change");
    const list = readSaved().filter((exp) => !change || exp.change === change);
    if (!list.length) return `<p class="prior-note">No saved experiments${change ? " for that change" : ""} yet.</p>`;
    return `<ul class="exp-list">${list.map((exp) => `<li>
      <button type="button" class="btn" data-exp="${esc(exp.id)}">${esc(exp.name)}</button>
      <span class="exp-meta">${esc(exp.created_at || "")} · ${esc(exp.change || "custom")} · ${esc(exp.comparison && exp.comparison.tested != null ? exp.comparison.tested + " games" : "")}</span>
    </li>`).join("")}</ul>`;
  }

  function paintSandbox() {
    const root = document.getElementById("sandbox-root");
    if (!root) return;
    if (!document.body.classList.contains("is-authed") || !isAdmin()) {
      root.innerHTML = `<p class="lede">Testing stays on the admin login. It does not change the live card, the published lines, or Bet History.</p>`;
      return;
    }
    if (!root.dataset.ready) {
      root.dataset.ready = "1";
      root.innerHTML = `<div class="sandbox-banner">This is a sandbox. A run stays here. It does not write the live Games page, current B Lines, Bet Outcomes, Bet History, or any locked number. Putting a test into production is a separate decision, outside this page.</div>
        <div class="preset-row" id="sb-presets"></div>
        <div class="record-filters" id="sb-scales"></div>
        <div class="record-filters">
          <label class="sort-field"><span>Season</span><select id="sb-season"></select></label>
          <label class="sort-field"><span>Week</span><select id="sb-week"></select></label>
          <label class="sort-field"><span>Team</span><select id="sb-team"></select></label>
          <label class="sort-field"><span>Game</span><select id="sb-game"></select></label>
          <label class="sort-field"><span>Version</span><select id="sb-version"></select></label>
          <label class="sort-field"><span>Change type</span>
            <select id="sb-change">
              <option value="">All saved</option>
              <option value="none">Production baseline</option>
              <option value="remove_2025">Remove 2025</option>
              <option value="recent_weight">Recent grades</option>
              <option value="injury">Injury</option>
              <option value="custom">Custom</option>
            </select>
          </label>
        </div>
        <div class="sandbox-actions">
          <button type="button" class="btn btn-fill" id="sb-run">Run on filtered games</button>
        </div>
        <p class="prior-note" id="sb-viewing"></p>
        <div id="sb-agg"></div>
        <div id="sb-table"></div>
        <form id="sb-save" class="sandbox-save">
          <label class="sort-field"><span>Save this run</span><input id="sb-name" type="text" maxlength="80" placeholder="Test — remove 2025 statistics" required></label>
          <button type="submit" class="btn">Save experiment</button>
          <p class="prior-note" id="sb-save-note"></p>
        </form>
        <h2 class="section-label">Saved experiments</h2>
        <div id="sb-saved"></div>`;
      document.getElementById("sb-presets").innerHTML = PRESETS.map((p) => `<button type="button" class="btn${p.id === presetId ? " btn-fill" : ""}" data-preset="${p.id}">${esc(p.label)}</button>`).join("");
      document.getElementById("sb-scales").innerHTML = scaleMarkup();
      refreshFilterChoices();
      root.addEventListener("change", (e) => {
        if (e.target && e.target.dataset && e.target.dataset.scale) {
          presetId = "custom";
          scales = currentScales();
          paintPresetButtons();
        }
        if (e.target && e.target.id && e.target.id.indexOf("sb-") === 0 && e.target.id !== "sb-name") {
          paintSandboxResults();
        }
      });
      root.addEventListener("click", (e) => {
        const preset = e.target.closest("[data-preset]");
        if (preset) {
          applyPreset(preset.getAttribute("data-preset"));
          return;
        }
        const exp = e.target.closest("[data-exp]");
        if (exp) openSaved(exp.getAttribute("data-exp"));
      });
      document.getElementById("sb-run").addEventListener("click", () => {
        viewingSaved = null;
        scales = currentScales();
        const preset = PRESETS.find((p) => p.id === presetId);
        const ran = runExperiment(filteredRows("sb"), scales);
        lastRun = {
          id: "run-" + Date.now(),
          name: preset ? preset.label : "Custom",
          change: preset ? preset.change : "custom",
          scales,
          games: ran.games,
          agg: ran.agg,
        };
        paintSandboxResults();
      });
      document.getElementById("sb-save").addEventListener("submit", (e) => {
        e.preventDefault();
        saveCurrent();
      });
    }
    paintSandboxResults();
  }

  function paintPresetButtons() {
    const row = document.getElementById("sb-presets");
    if (!row) return;
    row.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.classList.toggle("btn-fill", btn.getAttribute("data-preset") === presetId);
    });
  }

  function applyPreset(id) {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    presetId = id;
    scales = Object.assign({}, preset.scales);
    for (const [key] of SCALE_FIELDS) {
      const el = document.getElementById("sb-scale-" + key);
      if (!el) continue;
      const n = scales[key] == null ? 1 : scales[key];
      el.value = String(n);
    }
    viewingSaved = null;
    paintPresetButtons();
    const ran = runExperiment(filteredRows("sb"), currentScales());
    lastRun = { id: "run-" + Date.now(), name: preset.label, change: preset.change, scales: currentScales(), games: ran.games, agg: ran.agg };
    paintSandboxResults();
  }

  function paintSandboxResults() {
    const viewing = document.getElementById("sb-viewing");
    const agg = document.getElementById("sb-agg");
    const table = document.getElementById("sb-table");
    const saved = document.getElementById("sb-saved");
    const source = viewingSaved || lastRun;
    if (viewing) {
      viewing.textContent = source
        ? (viewingSaved ? "Viewing saved experiment “" + viewingSaved.name + "”. The lines below are the ones stored with it." : "Current run. Save it if you want to come back to these lines.")
        : "Pick a preset or run the filtered games. Production lines in the table are the frozen record.";
    }
    if (agg) agg.innerHTML = source ? aggHtml(source.agg || source.comparison) : "";
    if (table) table.innerHTML = source ? sandboxTable(source.games || (source.results && source.results.games) || []) : "";
    if (saved) saved.innerHTML = savedListHtml();
  }

  function openSaved(id) {
    const exp = readSaved().find((item) => item.id === id);
    if (!exp) return;
    viewingSaved = exp;
    lastRun = null;
    paintSandboxResults();
  }

  async function saveCurrent() {
    const note = document.getElementById("sb-save-note");
    const nameEl = document.getElementById("sb-name");
    const name = nameEl ? nameEl.value.trim() : "";
    if (!name || !lastRun) {
      if (note) note.textContent = lastRun ? "Name the experiment." : "Run it before saving.";
      return;
    }
    const preset = PRESETS.find((p) => p.id === presetId);
    const exp = {
      id: "exp-" + Date.now().toString(36),
      name,
      created_at: new Date().toISOString(),
      change: preset && presetId !== "custom" ? preset.change : "custom",
      changes: { preset: presetId, scales: lastRun.scales || currentScales(), filters: {
        season: val("sb-season"), week: val("sb-week"), team: val("sb-team"), game: val("sb-game"), version: val("sb-version"),
      } },
      results: { games: lastRun.games },
      comparison: lastRun.agg,
    };
    const list = readSaved();
    list.unshift(exp);
    writeSaved(list);
    if (nameEl) nameEl.value = "";
    let where = "Saved in this browser.";
    if (window.BMB && window.BMB.client && isAdmin()) {
      const res = await window.BMB.client.from("model_experiments").insert({
        name: exp.name,
        changes: exp.changes,
        results: exp.results,
        comparison: exp.comparison,
      });
      if (res && res.error) {
        where = "Saved in this browser. The experiments table is not available yet, so the server copy was not written. Production lines were not touched.";
      } else {
        where = "Saved in this browser and on the experiments log. Production lines were not touched.";
      }
    }
    if (note) note.textContent = where;
    viewingSaved = exp;
    paintSandboxResults();
  }

  function show(name) {
    const allowed = new Set(["history", "methodology", "outcomes", "sandbox"]);
    if (!allowed.has(name)) return;
    document.querySelectorAll(".view").forEach((v) => {
      const on = v.dataset.view === name;
      v.hidden = !on;
      v.classList.toggle("is-active", on);
    });
    document.querySelectorAll(".nav a").forEach((a) => {
      if (a.dataset.nav === name) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    renderSurfaces();
  }

  function renderSurfaces() {
    ensureHistory();
    ensureOutcomes();
    refreshFilterChoices();
    paintHistory();
    paintOutcomes();
    paintSandbox();
  }

  function mergeRemote(payloads) {
    const keys = new Set(board.map(gameKey));
    let added = 0;
    for (const row of payloads || []) {
      if (!row || String(row.status).toUpperCase() !== "FINAL") continue;
      const key = gameKey(row);
      if (keys.has(key)) continue;
      board.push(row);
      keys.add(key);
      added += 1;
    }
    if (added) {
      remoteNote = added + " final game" + (added === 1 ? "" : "s") + " came from the published-lines view and " + (added === 1 ? "is" : "are") + " not in the git snapshot yet.";
      board.sort((a, b) => a.week - b.week || String(a.game_id).localeCompare(String(b.game_id)));
      renderSurfaces();
    }
  }

  async function verify(rows) {
    for (const row of rows) {
      if (!row.content_sha256) continue;
      const hash = await digest(canon(row));
      if (hash && hash !== row.content_sha256) {
        hashWarn = "A stored row failed its content check. The page is still showing the stored snapshot, not a recomputed line.";
        paintHistory();
        return;
      }
    }
  }

  async function loadFile() {
    const res = await fetch(FILE);
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    board = (Array.isArray(data.board) ? data.board : []).filter((row) => row && String(row.status).toUpperCase() === "FINAL");
    window.BMBPublished = data;
    renderSurfaces();
    verify(board);
    if (window.BMB && window.BMB.client) {
      const q = await window.BMB.client.from("published_lines_public").select("payload, status");
      if (!q.error && Array.isArray(q.data)) {
        mergeRemote(q.data.map((r) => r && r.payload).filter(Boolean));
      }
    }
  }

  async function loadBook() {
    if (!window.BMBBook || typeof window.BMBBook.gradeBook !== "function") return;
    try {
      const get = async (rel) => {
        const res = await fetch("./" + rel);
        if (!res.ok) return null;
        return res.json();
      };
      const ticketsFile = await get("data/tickets-2026.json?v=w4tix0929");
      const nfl = await get("data/nfl-2026.json?v=book0930");
      const lineHistory = await get("data/lines/line-history-2026.json?v=book0930");
      const closes = [];
      for (const rel of ["data/closes/2026-w01.json", "data/closes/2026-w02.json"]) {
        const file = await get(rel);
        if (file) {
          file.__source = rel;
          closes.push(file);
        }
      }
      const lockPaths = new Set();
      for (const g of (lineHistory && lineHistory.games) || []) {
        for (const s of g.snapshots || []) {
          const src = String(s.source || "").split("#")[0];
          if (src.indexOf("data/postmortem/locks/") === 0 && src.endsWith(".json")) lockPaths.add(src);
        }
      }
      const locks = [];
      await Promise.all([...lockPaths].map(async (rel) => {
        const row = await get(rel);
        if (row) {
          row.__source = rel;
          locks.push(row);
        }
      }));
      const graded = window.BMBBook.gradeBook({
        tickets: ticketsFile && ticketsFile.tickets,
        games: nfl && nfl.games,
        closes,
        lineHistory,
        locks,
      });
      bookRows = graded.rows;
      bookNote = "";
      renderSurfaces();
    } catch (err) {
      console.warn("ticket book", err);
      bookNote = "The ticket book did not load.";
      paintBook();
    }
  }

  function startBook() {
    if (window.BMBBook) loadBook();
    else window.addEventListener("bmb-book", function onBook() { loadBook(); }, { once: true });
  }

  window.BMBLedger = { show, render: renderSurfaces, closeHistory, openHistory };

  startBook();

  loadFile().catch((err) => {
    console.warn("published finals", err);
    ensureHistory();
    const empty = document.getElementById("history-empty");
    if (empty) {
      empty.hidden = false;
      empty.textContent = "The published record did not load.";
    }
  });

  if (window.BMB && typeof window.BMB.syncPublic === "function") window.BMB.syncPublic();
})();

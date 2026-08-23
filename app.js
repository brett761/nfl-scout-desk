/* NFL Scout · The Desk · 2026
   Process scored on CLV of straights. Entertainment stays on the card.
   SAMPLE / season EXAMPLE tickets never count toward 2026 KPIs. */

const STORAGE_KEY = "nflScout.tickets.v1";
const PROFILES_KEY = "nflScout.profiles.v1";
const OVERRIDES_KEY = "nflScout.lineOverrides.v1";
const HFA_KEY = "nflScout.hfa";
const WEATHER_KEY = "nflScout.weather.v1";
const RESIDUALS_KEY = "nflScout.residuals.v1";
const SHARP_BOOK_KEY = "nflScout.sharpBook";
const SHARP_BOOK_DEFAULT = "Pinnacle";
const SEASON = 2026;
const HFA_DEFAULT = 2;
const TAPER_N = 17;
const WEEKLY_BUDGET = 1000;
const UNIT = 50;
const WEEKLY_UNITS = 20;
const MAX_UNITS = 4;
const DEFAULT_STRAIGHT_UNITS = 3;
const PARLAY_UNITS = 1;

const WINDOWS = [
  { id: "TNF", label: "Thursday Night", short: "TNF" },
  { id: "SUN_AM", label: "Sunday AM / London", short: "SUN AM" },
  { id: "SUN_PM", label: "Sunday PM", short: "SUN PM" },
  { id: "SNF", label: "Sunday Night", short: "SNF" },
  { id: "MNF", label: "Monday Night", short: "MNF" },
];
const ALL_WINDOWS = ["TNF", "SUN_AM", "SUN_PM", "SNF", "MNF", "THU_HOL", "FRI", "SAT"];

const CLOCK = [
  {
    when: "Sunday night",
    window: "Next week opens",
    now: false,
    happens: "Next week's card typically posts after the Sunday afternoon slate. Books are thin overnight. This is the start of the favorites/overs early window.",
    action: "Shop openers on 3+ books. Log the open. Do not fire yet unless the number is fat (~1.5 or a key). PRICE_CLV thesis starts here.",
    tags: ["MIXED"],
    tagNote: "Industry open-timing + desk early-number rule. Not a 'lines always move X' system.",
  },
  {
    when: "Monday",
    window: "TNF week starts · shop openers",
    now: false,
    happens: "TNF is the first game of the new week. Openers are still settling. Steam is noisier than it will be Tuesday.",
    action: "Start the weekly card (W24). Shop 3+ books. Log Monday numbers. Pass is allowed. Holiday extras use THU_HOL / FRI / SAT.",
    tags: ["VERIFIED", "DESK RULE"],
    tagNote: "Verified week clock (TNF exists) + start-Monday rule. Opener-settling is market convention.",
  },
  {
    when: "Tuesday",
    window: "Steam more readable",
    now: false,
    happens: "Monday noise fades. Moves against (or with) the public become easier to read. Good day to compare open vs current.",
    action: "Log Tuesday. Compare open to current. Still do not treat RLM as automatic. Fire only with a number or a key.",
    tags: ["MIXED"],
    tagNote: "Market convention that Tuesday reads cleaner. RLM is a note, not a trigger.",
  },
  {
    when: "Wednesday",
    window: "TNF decision day",
    now: true,
    happens: "NFL Game Status Report for Thursday games is due 4:00 p.m. New York time Wednesday. That is the official injury/status print for TNF.",
    action: "TNF decide after 4pm ET status. If no ~1.5 / key-number reason, PASS. Parlay (if any) locks in the same window. Do not wait for Thursday night public.",
    tags: ["VERIFIED"],
    tagNote: "NFL important dates: Game Status Wednesday 4:00 p.m. NY time for a Thursday game.",
  },
  {
    when: "Thursday",
    window: "TNF kick · Sunday practice report",
    now: false,
    happens: "TNF kicks. Clubs with Sunday games file practice reports Wed/Thu/Fri. FanDuel-style TNF folklore (always under) is not our system.",
    action: "Grade TNF. Log Thursday numbers on remaining games. No chase if TNF lost. Sunday practice report is info, not an auto-bet.",
    tags: ["VERIFIED", "FOLKLORE"],
    tagNote: "Verified clock. TNF 'always under' is FOLKLORE — ignore as a rule.",
  },
  {
    when: "Friday",
    window: "Sunday game status 4pm ET",
    now: false,
    happens: "NFL Game Status Report for Sunday games is due 4:00 p.m. New York time Friday. Main official print for the 1pm / late / SNF Sunday card.",
    action: "Main Sunday decision if betting fav/over. After Friday status, lock the number or PASS. Dogs/unders wait for a real public push (Fri–Sun AM).",
    tags: ["VERIFIED"],
    tagNote: "NFL important dates: Game Status Friday 4:00 p.m. NY time for a Sunday game.",
  },
  {
    when: "Saturday",
    window: "London / weather / circled games",
    now: false,
    happens: "International and early-Sunday spots finalize. Weather and inactives-adjacent news start to matter. Circled games do not belong in entertainment parlays.",
    action: "London lock Saturday night or wait until 7am Sunday ET. Pull circled games out of parlays. Weather is a total reason, not a vibe.",
    tags: ["DESK RULE", "VERIFIED"],
    tagNote: "Desk London lock + verified international calendar. Do not invent 2026 kick times.",
  },
  {
    when: "Sunday 7–11am",
    window: "Public · dogs/unders if pushed",
    now: false,
    happens: "Public money typically shows Sunday morning. Reverse line movement is a description (line away from the public), not a bet signal by itself.",
    action: "Dogs/unders only if public actually pushed. Shop the close. Do not fade public as a system. Five windows are still not five bets.",
    tags: ["FOLKLORE", "VERIFIED"],
    tagNote: "Public-morning timing is folklore. RLM is a definition, not a trigger. Desk filter: only if pushed.",
  },
  {
    when: "Sunday 90-min",
    window: "Inactives",
    now: false,
    happens: "90-minute officiating meeting: clubs deliver the Game Day Administration Report, which includes the inactive list. Last official personnel print before kick.",
    action: "Last INFO check. Do not reinvent the card. A late scratch can be a point-value (W18), not a chase. Pass remains legal.",
    tags: ["VERIFIED"],
    tagNote: "NFL countdown to kickoff: 90-minute meeting includes the inactive list.",
  },
  {
    when: "Sunday 1pm / late / SNF / MNF",
    window: "SUN_PM · SNF · MNF",
    now: false,
    happens: "1pm slate, late window, Sunday Night, then Monday Night. Separate tickets per window. After a losing Sunday, size does not go up.",
    action: "One process ticket per window you actually like. After a losing Sunday, do not chase SNF/MNF. Parlays stay in the same lock window. Grade close after each game.",
    tags: ["VERIFIED", "DESK RULE", "FOLKLORE"],
    tagNote: "Verified windows + no-chase. Primetime-under folklore is IGNORE.",
  },
];

const PLAYBOOK = [
  {
    id: "W01", name: "Value first", tag: "COPY",
    principle: "A bet needs a number. Fire a process straight only if your number is about 1.5 points better than the best shopped line, or you have a key-number reason (3, 6, 7, 14). Size comes after.",
    when: "Before every straight. No edge, no ticket.",
    how: "Compare our number to the best of 3+ books. Thin extra that is not a key = PASS. Process is judged on whether we took value, not whether it cashed.",
  },
  {
    id: "W02", name: "Three pillars", tag: "COPY",
    principle: "Handicap the game, then price the number, then size the bankroll. Skipping a pillar is how a card turns into a vibe.",
    when: "Every ticket, every window.",
    how: "No price without a handicap. No fire without a price. Size in units only after the first two pillars clear.",
  },
  {
    id: "W03", name: "Bankroll 1–3%", tag: "COPY",
    principle: "One unit is $50. The $1,000 week is 20 units, not a season roll. 1u is a look, 2u is standard, 3u is a full play (~1.5 or a key), 4u is the cap.",
    when: "When sizing any straight. Holiday extras still hold the week at 20 units.",
    how: "Do not invent a season bankroll to justify bigger fires. 1u parlays do not eat the process grade.",
  },
  {
    id: "W06", name: "Line shop 3+ books", tag: "COPY",
    principle: "The number you bet is the best number you can get. One book is not a market.",
    when: "Before every fire. Log the book on the ticket.",
    how: "Shop at least three. If we cannot beat the consensus by enough, pass. Book name is required on Tickets.",
  },
  {
    id: "W08", name: "Favorites early, dogs late", tag: "COPY",
    principle: "Favorites and overs are a Sunday-night-through-Wednesday idea. Dogs and unders wait until Friday through Sunday morning, and only if the public actually pushed.",
    when: "Timing thesis on every straight (PRICE_CLV vs INFO).",
    how: "Early = PRICE_CLV. Late dogs/unders need a visible public push, not a story. Not a fade-public system.",
  },
  {
    id: "W09", name: "Key numbers 3, then 6/7/14", tag: "COPY",
    principle: "NFL scoring clusters on 3, then 6/7/14. Crossing or landing on those numbers is why a half-point can be the whole bet.",
    when: "Every spread. Totals have their own keys; do not fake them.",
    how: "A 1-point edge that crosses 3 (or 7) is a fire reason. A 1-point edge in no-man's-land is often a pass.",
  },
  {
    id: "W10", name: "Buy 3 at ~22 cents", tag: "COPY",
    principle: "Buying off a key 3 is expensive. Historical shop talk puts a full point around a key near 22 cents — too rich unless the number is the bet.",
    when: "When a book offers to buy a half or full point through 3.",
    how: "We would rather pass or find the key already on our side at another book than pay a juice tax to manufacture a 3.",
  },
  {
    id: "W12", name: "No chase", tag: "COPY",
    principle: "A losing Sunday does not raise Monday's unit. Variance is not information.",
    when: "After any L, especially Sunday into SNF/MNF.",
    how: "Same units or a PASS. Never add units to get it back. Parlays stay 1u and stay in their lock window.",
  },
  {
    id: "W13", name: "Passes are a feature", tag: "COPY",
    principle: "Five windows are not five must-bets. A recorded PASS (stake 0) is process. A skipped window with no row is sloppy.",
    when: "Any window without ~1.5 or a key-number reason.",
    how: "ticket_type=PASS, stake 0, result VOID. Dashboard treats them as a feature.",
  },
  {
    id: "W14", name: "Parlays are not +EV", tag: "ENTERTAINMENT",
    principle: "Keep the 1u parlay as entertainment. Do not score it as process. CLV, pass rate, key-number discipline, and process P/L live on straights only.",
    when: "Every Parlay / SGP / Multi.",
    how: "purpose=Entertainment. Same lock window as the straight. After a losing Sunday, do not add a revenge parlay.",
  },
  {
    id: "W15", name: "Totals only with reason", tag: "COPY",
    principle: "A total needs weather, pace, or a real number — not 'it feels low.' Unders as a primetime superstition are folklore.",
    when: "Any Total market.",
    how: "If the reason cannot be written in notes, pass. Over CLV = close − bet; under CLV = bet − close.",
  },
  {
    id: "W18", name: "Injuries are point values", tag: "COPY",
    principle: "A starter out is a number, not a narrative. Wait for official status when the points are on the injury.",
    when: "TNF Wednesday 4pm ET status. Sunday Friday 4pm ET status. 90-minute inactives.",
    how: "INFO thesis when we waited. PRICE_CLV when we bet through the news. Convert the player to points or pass.",
  },
  {
    id: "W20", name: "90/10 rating update", tag: "COPY",
    principle: "Update opinions slowly. One game is 10%; the prior rating is 90%. Do not rebuild a team off a single Sunday.",
    when: "Monday handicap, every week.",
    how: "Last week's notes update the number. We do not hot-team a card.",
  },
  {
    id: "W24", name: "Start Monday", tag: "COPY",
    principle: "The week starts when the new card exists, not Saturday night. Early work is how PRICE_CLV happens.",
    when: "Monday after TNF week begins.",
    how: "Shop openers Monday. TNF decision is Wednesday. Sunday work is for public-push dogs/unders and 90-minute INFO, not first look.",
  },
  {
    id: "W25", name: "Head fakes", tag: "IGNORE",
    principle: "Stories about betting the other side to move a number. Not a tool we have, and not a process we can audit.",
    when: "Never on this desk.",
    how: "We do not dummy-bet, beard, or try to move a market. Ignore as a playbook item.",
  },
  {
    id: "W26", name: "Beards", tag: "IGNORE",
    principle: "Using other people to hide action. Illegal in places, unauditable, and not how a $1,000 weekly desk works.",
    when: "Never.",
    how: "One book name on the ticket. Our name on the account. Ignore.",
  },
  {
    id: "W27", name: "Bet late for volume", tag: "IGNORE",
    principle: "Pros who need to get down large sometimes wait for limits to rise. We are a 20-unit weekly desk. Late is for INFO, not for size.",
    when: "Do not use volume as a reason to wait.",
    how: "We bet early for PRICE_CLV or late for INFO. We do not wait for the window to 'hold more.' Ignore as a sizing rule.",
  },
  {
    id: "W29", name: "Don't be a fan", tag: "COPY",
    principle: "Every club is even. Rooting interest is a leak. League weight stays flat.",
    when: "Any time a preferred team is on the card.",
    how: "If we cannot write the number without the jersey, PASS. Notes stay about price, not hope.",
  },
  {
    id: "W30", name: "Record the close / CLV", tag: "ADAPT",
    principle: "The close is the market's last word. Recording it is how process is scored. Profit is variance.",
    when: "After every straight, when the game goes off.",
    how: "Enter close_line. CLV calculates. Dashboard avg CLV uses PROCESS straights only. We adapt Walters' close-recording into this column.",
  },
  {
    id: "W31", name: "Shop juice / ML at 3", tag: "COPY",
    principle: "Shop the price, not just the spread. At a key 3, anything better than -170 is better than laying 3 at -110; anything better than +140 is better than taking 3 at -110. -105 vs -110 is real money.",
    when: "Every fire, especially on 3.",
    how: "Log the juice. If the ML is the better way to bet the same side, take the ML. Do not pay extra juice to manufacture a number we can shop.",
  },
  {
    id: "W32", name: "Sharp close only", tag: "COPY",
    principle: "CLV is scored against Pinnacle or Circa, no-vig, not against DraftKings.",
    when: "After every process straight.",
    how: "Close book defaults to the sharp book setting. Square-book closes are notes, not the grade.",
  },
  {
    id: "W33", name: "No add into resistance", tag: "COPY",
    principle: "If the price gets worse after we like it, that is a stop, not a sale. Do not add. Sunday-night double-up is suicide.",
    when: "Any number that moved against us after we wrote it.",
    how: "One ticket or a PASS. Never a second unit on the same side because the juice got longer.",
  },
  {
    id: "W34", name: "Leftovers after a move", tag: "COPY",
    principle: "After the full-game side or total moves, look at first half, team total, or moneyline. Same opinion, market that may not have moved.",
    when: "After a visible full-game move we did not get.",
    how: "Write the leftover or pass. Do not invent a new side. 1H is a different number; it still needs ~1.5 or a key.",
  },
  {
    id: "W35", name: "Buy the hook only at 3 and 7", tag: "COPY",
    principle: "Half-points are only worth juice on 3 and 7. Buying +5.5 to +6 is a donation.",
    when: "Any offer to buy/sell a half.",
    how: "Use the Keys table. Pay only if it crosses 3 or 7 and we cannot shop the key already on our side.",
  },
  {
    id: "W36", name: "Playing-hurt and clusters", tag: "ADAPT",
    principle: "Official OUT is already a point. Playing-hurt is a haircut. Clusters stack in order: WR, DL, OL, DB, LB, RB. A small player can become large in a specific matchup.",
    when: "Injury rows, especially when two-plus on the same unit.",
    how: "Write the haircut on the ticket. Do not invent a new scale. Wait for official status before the points go on.",
  },
  {
    id: "W37", name: "Road / rest / turf checklist", tag: "ADAPT",
    principle: "Road after MNF, consecutive road, time-zone change, opposite turf, bounceback after a blowout are adjustments, not a second prior.",
    when: "Sunday card write-up.",
    how: "The travel / trap / rest flag is already a game chip (cap 0.5). Resting starters or anything it misses still goes on a context row.",
  },
  {
    id: "W38", name: "Two signatures", tag: "ADAPT",
    principle: "The computer (prior + FA + draft + injury + weather) and the qualitative read (will he play, scheme) must agree. If they fight, pass.",
    when: "Before every $150.",
    how: "If the model says fire and the film/status says no, PASS. If the story says fire and the model is dead, PASS.",
  },
  {
    id: "W39", name: "Hold and max as info", tag: "ADAPT",
    principle: "High hold and a tiny max means the book does not trust the number. A Circa/Pinnacle price that is 2–3 cents better plus a retail max of peanuts is a weak copy, not a gift.",
    when: "Shopping.",
    how: "Prefer the market-maker number. Do not treat a soft book’s leftover juice as 1.5 points of edge.",
  },
  {
    id: "W40", name: "No new ATS filters", tag: "COPY",
    principle: "An angle must survive a holdout. We do not add “division dogs off a short week in September.” Week 1 and bye stay because they are already specified and capped.",
    when: "Any urge to add a situational auto-bet.",
    how: "Write it in the graveyard. Do not encode it. Residuals decide if an old angle still lives.",
  },
];

const SAMPLES = [
  {
    season: "EXAMPLE",
    week: 0,
    window: "TNF",
    ticket_type: "Straight",
    purpose: "Process",
    game: "SAMPLE · Example A @ Example B",
    market: "Spread",
    pick: "Example B +3.5",
    bet_line: 3.5,
    juice: -110,
    units: 3,
    stake: 150,
    book: "BookAlpha",
    close_line: 3.0,
    result: "W",
    timing_thesis: "PRICE_CLV",
    notes: "SAMPLE — not a 2026 result. Early number on our side of a key.",
    rule_tag: "W01",
  },
  {
    season: "EXAMPLE",
    week: 0,
    window: "SUN_PM",
    ticket_type: "Parlay",
    purpose: "Entertainment",
    game: "SAMPLE · Example E @ Example F / Example G @ Example H",
    market: "Multi",
    pick: "Example F +7 / Example H Under 47",
    bet_line: 7,
    juice: 260,
    stake: 50,
    book: "BookBeta",
    close_line: 6.5,
    result: "L",
    timing_thesis: "INFO",
    notes: "SAMPLE — entertainment only. Not scored as process.",
    rule_tag: "W14",
  },
  {
    season: "EXAMPLE",
    week: 0,
    window: "SNF",
    ticket_type: "PASS",
    purpose: "Process",
    game: "SAMPLE · no fire",
    market: "",
    pick: "PASS",
    bet_line: null,
    juice: -110,
    stake: 0,
    book: "",
    close_line: null,
    result: "VOID",
    timing_thesis: "PRICE_CLV",
    notes: "SAMPLE — a pass is a result. Five windows ≠ five must-bets.",
    rule_tag: "W13",
  },
];

/* ---------- math ---------- */

function num(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function computeCLV(ticket) {
  const bet = num(ticket.bet_line);
  const close = num(ticket.close_line);
  if (bet === null || close === null) return null;
  const market = (ticket.market || "").toLowerCase();
  const pick = (ticket.pick || "").toLowerCase();
  if (market === "total" && pick.includes("over")) return close - bet;
  return bet - close;
}

function computeProfit(ticket) {
  const result = ticket.result;
  if (!result || result === "PENDING" || result === "PASS") return null;
  if (result === "P" || result === "VOID") return 0;
  const stake = num(ticket.stake) ?? 0;
  if (result === "L") return -stake;
  if (result === "W") {
    const juice = num(ticket.juice);
    if (juice === null) return null;
    if (juice < 0) return stake * 100 / Math.abs(juice);
    if (juice > 0) return stake * juice / 100;
    return 0;
  }
  return null;
}

function clampUnits(raw, type) {
  if (type === "PASS") return 0;
  if (type === "Parlay") return PARLAY_UNITS;
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n) || n < 1) return DEFAULT_STRAIGHT_UNITS;
  return Math.min(MAX_UNITS, n);
}

function inferUnits(ticket) {
  if (!ticket) return DEFAULT_STRAIGHT_UNITS;
  const type = ticket.ticket_type || ticket;
  if (type === "PASS") return 0;
  if (type === "Parlay") return PARLAY_UNITS;
  const u = num(ticket.units);
  if (u != null) return clampUnits(u, type);
  const s = num(ticket.stake);
  if (s != null && UNIT) return clampUnits(s / UNIT, type);
  return DEFAULT_STRAIGHT_UNITS;
}

function stakeFromUnits(units) {
  return (num(units) || 0) * UNIT;
}

function stakeFor(type, units) {
  return stakeFromUnits(clampUnits(units, type));
}

function fmtUnits(u) {
  const n = num(u);
  if (n == null) return "—";
  return n + "u";
}

function purposeFor(type) {
  return type === "Parlay" ? "Entertainment" : "Process";
}

function isSample(t) {
  return t.season === "EXAMPLE" || t.sample === true || (t.game || "").startsWith("SAMPLE");
}

function isSeasonTicket(t) {
  return String(t.season) === String(SEASON) && !isSample(t);
}

function uid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function snapHalf(n) {
  const x = num(n);
  if (x === null) return 0;
  return Math.round(x * 2) / 2;
}

function normAbbr(abbr) {
  const a = String(abbr || "").toUpperCase();
  if (a === "WAS" || a === "WFT") return "WSH";
  return a;
}

/* Walters power ratings
   0.0 = league average. Plus is better than average. Minus is worse.
   algorithm_base = blended 2025 prior (tapers off over 17 games).
   fa_raw(abbr) = fa-2026.json team net (0 if missing / failed load).
     net is already team-capped ±4. If net is missing, sum in/out pts and clamp ±4.
   fa_term(abbr) = fa_raw(abbr) * w_prior
     FA is a Week-1 correction to last year's roster. It fades with the 17-game
     taper: at n=0, fa_term = net; at n=17, fa_term = 0. Do not fold FA into
     algorithm_base — keep the prior number honest / visible.
   draft_raw(abbr) = draft-2026.json team net (0 if missing / failed load).
     net is already team-capped ±4. If net is missing, sum starters[].pts and clamp ±4.
   draft_term(abbr) = draft_raw(abbr) * draft_fade
     draft_fade = max(0, (window − n) / window) where window = window_games or 4
     and n = gamesPlayed2026(abbr). Week 1 (n=0) is 100%. Gone after 4 games.
     Do not use the 17-game FA taper. Incoming rookies only. Starters only.
     Year-1 fade is baked into pts. Does not rewrite the 2025 prior.
   madden_term(abbr) = madden-2026.json team net (0 if missing).
     Same 22 per club: top 11 OFF + top 11 DEF by OVR. K/P/LS out.
     Surplus vs league mean of those 22. 4 OVR ≈ 1 point. Cap ±2.
     Launch snapshot. Does not fade. Does not rewrite the 2025 prior.
   user_adjust = optional override on top of the algorithm (old "base").
   Injuries are a weekly point value. They do NOT taper with the 17-game prior.
   They stay until the row is off or deleted.
     row_pts = −round2(pos_base * status_mult), clamp [−cap_player, 0]
     injury_term = clamp(sum of ON rows, −cap_team, 0)
   Effective = algorithm + FA + draft + madden + injury + adjust + context
   = algorithm_base + fa_term + draft_term + madden_term + injury_term + user_adjust + sum of active (on) context.

   Taper (do not invent another formula):
     N = 17
     n = 2026 regular-season games already played (kickoff in the past)
     w_prior = (N − n) / N
     w_curr  = n / N
     blended = w_prior * prior + w_curr * current
     current starts at 0 until 2026 results exist.
     When n = 0, blended = prior.

   ourHomeLine = −(homeEff − awayEff + hfa + coach_term + prep_net + ats_net + sched_net)
     negative = home favored. Example: SEA +4, NE +1, HFA 2, SEA home
     → −(4 − 1 + 2) = −5  (SEA −5).
     coach_term is a GAME number (home-perspective SU H2H). Positive =
     home HC has the away HC’s number = home favored more (line more
     negative). min n 4, cap 1, dead zone 0.15. 0 if load fails / no pair.
     prep_net is a GAME number (Week 1 form + post-bye form). Same scoring.
     week1_term(abbr) = coaches[abbr].week1.pts  (0 if week !== 1)
     bye_term(abbr)   = coaches[abbr].bye.pts    (0 unless that club is
     coming off a bye THIS game). prep_net = week1_term(home) − week1_term(away)
     + bye_term(home) − bye_term(away). ATS preferred. 0 if load fails.
     ats_net is a GAME number (career HC ATS, slight). Follows the person
     across buildings. ats_net = ats_pts(home) − ats_pts(away). Positive =
     home coach has the better ATS book = home favored more. min n 16,
     cap 0.35, dead zone 0.04, full weight at 48. 0 if load fails /
     first-year / dead / n too small. Does not replace SU H2H.
     sched_net is a GAME number (travel / trap / extra rest). Cap ±0.5.
     Travel is the road club only (0 on neutral). 2 time zones −0.25,
     3 zones −0.35, plus −0.15 if a Pacific club kicks before 4pm ET,
     plus −0.25 if fewer than 6 days since the last game. Travel floor −0.5.
     Trap −0.25 if weeks 2–16, this club is ≥4 better than the opponent,
     and next week is a division game. Extra rest +0.25 if ≥10 days since
     the last game and this is not a post-bye week (bye already lives in prep).
     Resting starters is still a human context row. sched_net = clamp(
     home_pts − away_pts, ±0.5). Does not rewrite the prior.
     eff() stays algorithm + FA + draft + injury + adjust + context.

   Neutral site (game.neutral, e.g. Melbourne LAR vs SF): hfa = 0.

   Market string "SEA -3.5" parsed to a home-perspective line:
     SEA home → marketHomeLine = −3.5
     SEA away → marketHomeLine = +3.5

   edgeHome = marketHomeLine − ourHomeLine
     our −5, market −3.5 → −3.5 − (−5) = +1.5
     Positive edgeHome = value on the home (we have the home getting more
     points / less juice than the street). Value side = home if ≥ 1.5,
     away if ≤ −1.5. We highlight. We do not auto-bet. */
function contextSum(p) {
  return (p.context || []).reduce((s, c) => s + (c.on ? (num(c.pts) || 0) : 0), 0);
}

function currentRating(/* abbr */) {
  // In-season 2026 current. Starts at 0 until real 2026 results exist. Do not seed.
  return 0;
}

function gamesPlayed2026(abbr) {
  if (!nflData || !Array.isArray(nflData.games)) return 0;
  const a = normAbbr(abbr);
  const now = new Date();
  let n = 0;
  for (const g of nflData.games) {
    const w = Number(g.week);
    if (!Number.isFinite(w) || w < 1 || w > 18) continue;
    if (g.home !== a && g.away !== a) continue;
    if (!g.date) continue;
    const d = new Date(g.date);
    if (Number.isNaN(d.getTime())) continue;
    if (d < now) n += 1;
  }
  const N = taperN();
  return Math.min(n, N);
}

function taperN() {
  const fromTaper = priorData && priorData.taper && num(priorData.taper.N);
  if (fromTaper) return fromTaper;
  const fromGames = priorData && num(priorData.games_in_prior);
  if (fromGames) return fromGames;
  return TAPER_N;
}

function taperFor(abbr) {
  const N = taperN();
  const n = gamesPlayed2026(abbr);
  return { N, n, wPrior: (N - n) / N, wCurr: n / N };
}

function priorTeam(abbr) {
  const a = normAbbr(abbr);
  if (!priorData || !priorData.teams) return null;
  return priorData.teams[a] || null;
}

function priorValue(abbr) {
  const t = priorTeam(abbr);
  if (!t) return 0;
  return num(t.prior) || 0;
}

function algorithmBase(abbr) {
  const t = priorTeam(abbr);
  if (!t) return 0;
  const { wPrior, wCurr } = taperFor(abbr);
  return wPrior * priorValue(abbr) + wCurr * currentRating(abbr);
}

function priorRankMap() {
  const ranks = {};
  if (!nflData || !Array.isArray(nflData.teams)) return ranks;
  const rows = nflData.teams.map((t) => ({ abbr: t.abbr, v: algorithmBase(t.abbr) }));
  rows.sort((a, b) => b.v - a.v || a.abbr.localeCompare(b.abbr));
  rows.forEach((r, i) => { ranks[r.abbr] = i + 1; });
  return ranks;
}

function faTeam(abbr) {
  const a = normAbbr(abbr);
  if (!faData || !faData.teams) return null;
  return faData.teams[a] || null;
}

function faRaw(abbr) {
  const t = faTeam(abbr);
  if (!t) return 0;
  const n = num(t.net);
  if (n !== null) return n;
  const cap = (faData && faData.scoring && num(faData.scoring.cap_team_net)) ?? 4;
  let sum = 0;
  for (const row of (t.in || [])) sum += num(row.pts) || 0;
  for (const row of (t.out || [])) sum += num(row.pts) || 0;
  return Math.max(-cap, Math.min(cap, sum));
}

function faTerm(abbr) {
  const a = normAbbr(abbr);
  return faRaw(a) * taperFor(a).wPrior;
}

function draftTeam(abbr) {
  const a = normAbbr(abbr);
  if (!draftData || !draftData.teams) return null;
  return draftData.teams[a] || null;
}

function draftRaw(abbr) {
  const t = draftTeam(abbr);
  if (!t) return 0;
  const n = num(t.net);
  if (n !== null) return n;
  const cap = (draftData && draftData.scoring && num(draftData.scoring.cap_team_net)) ?? 4;
  let sum = 0;
  for (const row of (t.starters || [])) sum += num(row.pts) || 0;
  return Math.max(-cap, Math.min(cap, sum));
}

function draftWindow() {
  return (draftData && num(draftData.window_games)) || 4;
}

function draftFade(abbr) {
  const window = draftWindow();
  return Math.max(0, (window - taperFor(abbr).n) / window);
}

function draftTerm(abbr) {
  const a = normAbbr(abbr);
  return draftRaw(a) * draftFade(a);
}

function maddenTeam(abbr) {
  const a = normAbbr(abbr);
  if (!maddenData || !maddenData.teams) return null;
  return maddenData.teams[a] || null;
}

function maddenTerm(abbr) {
  const t = maddenTeam(abbr);
  if (!t) return 0;
  return num(t.net) || 0;
}

function sosTeam(abbr) {
  const a = normAbbr(abbr);
  if (!sosData || !sosData.teams) return null;
  return sosData.teams[a] || null;
}

function sosTerm(abbr) {
  const t = sosTeam(abbr);
  if (!t) return 0;
  const n = num(t.net);
  return n === null ? 0 : n;
}


function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function injuryCapPlayer() {
  return (injuryScale && num(injuryScale.cap_player)) ?? 4.5;
}

function injuryCapTeam() {
  return (injuryScale && num(injuryScale.cap_team)) ?? 6;
}

function injuryPosKeys() {
  if (injuryScale && injuryScale.positions && typeof injuryScale.positions === "object") {
    return Object.keys(injuryScale.positions);
  }
  return ["QB1", "LT", "RT", "EDGE1", "WR1", "CB1", "IDL", "C", "RB1", "TE1", "WR2", "S", "LB", "OG", "K", "DEPTH"];
}

function injuryStatusKeys() {
  if (injuryScale && injuryScale.status && typeof injuryScale.status === "object") {
    return Object.keys(injuryScale.status);
  }
  return ["IR", "OUT", "PUP", "NFI", "DOUBTFUL", "QUESTIONABLE", "PROBABLE"];
}

function injuryRowPts(pos, status) {
  const base = (injuryScale && injuryScale.positions && num(injuryScale.positions[pos])) || 0;
  const mult = (injuryScale && injuryScale.status && num(injuryScale.status[status])) || 0;
  const raw = -round2(base * mult);
  const cap = injuryCapPlayer();
  return Math.max(-cap, Math.min(0, raw));
}

function injuryTerm(abbr) {
  const p = getProfile(abbr);
  let sum = 0;
  for (const row of (p.injuries || [])) {
    if (row.on) sum += num(row.pts) || 0;
  }
  const cap = injuryCapTeam();
  return Math.max(-cap, Math.min(0, sum));
}

function seedOnFlag(status, raw) {
  const st = String(status || "").toUpperCase();
  if (st === "QUESTIONABLE") return !!(raw && raw.on === true);
  return st === "IR" || st === "OUT" || st === "PUP" || st === "NFI" || st === "DOUBTFUL";
}

function seedInjuryRow(raw) {
  const pos = raw && raw.pos ? String(raw.pos) : "DEPTH";
  const status = raw && raw.status ? String(raw.status).toUpperCase() : "QUESTIONABLE";
  return {
    id: uid(),
    name: raw && typeof raw.name === "string" ? raw.name : "",
    pos,
    status,
    pts: injuryRowPts(pos, status),
    on: seedOnFlag(status, raw),
    custom: false,
  };
}


function seedNotesIfNeeded() {
  if (!notesSeed || !notesSeed.teams || typeof notesSeed.teams !== "object") return;
  let changed = false;
  for (const [abbr, note] of Object.entries(notesSeed.teams)) {
    if (typeof note !== "string" || !note.trim()) continue;
    const a = normAbbr(abbr);
    const p = getProfile(a);
    const cur = typeof p.notes === "string" ? p.notes : "";
    if (cur.includes(note.trim())) continue;
    const next = cur.trim() ? (cur.replace(/\s+$/, "") + "\n\n" + note) : note;
    profiles[a] = { ...p, notes: next };
    changed = true;
  }
  if (changed) saveProfiles();
}

function seedInjuriesIfNeeded() {
  if (!injurySeed || !injurySeed.teams || typeof injurySeed.teams !== "object") return;
  let changed = false;
  for (const [abbr, rows] of Object.entries(injurySeed.teams)) {
    const a = normAbbr(abbr);
    const raw = profiles[a];
    if (raw && typeof raw === "object" && Object.prototype.hasOwnProperty.call(raw, "injuries")) continue;
    const list = Array.isArray(rows) ? rows.map(seedInjuryRow) : [];
    profiles[a] = { ...getProfile(a), injuries: list };
    changed = true;
  }
  if (changed) saveProfiles();
}

function eff(abbr) {
  const a = normAbbr(abbr);
  const p = getProfile(a);
  return algorithmBase(a) + faTerm(a) + draftTerm(a) + maddenTerm(a) + sosTerm(a) + injuryTerm(a) + (num(p.user_adjust) || 0) + contextSum(p);
}

function coachOf(abbr) {
  if (!coachData || !coachData.coaches) return null;
  return coachData.coaches[normAbbr(abbr)] || null;
}

function coachName(abbr) {
  const c = coachOf(abbr);
  return c && typeof c.name === "string" && c.name ? c.name : null;
}

function coachScoring() {
  const s = coachData && coachData.scoring;
  return {
    min_n: (s && num(s.min_n)) ?? 4,
    max_pts: (s && num(s.max_pts)) ?? 1,
    dead_zone: (s && num(s.dead_zone)) ?? 0.15,
  };
}

function recomputePtsForA(row) {
  const aWins = num(row && row.a_wins) || 0;
  const bWins = num(row && row.b_wins) || 0;
  const n = num(row && row.n) ?? (aWins + bWins);
  const { min_n, max_pts, dead_zone } = coachScoring();
  if (!n || n < min_n) return 0;
  const rate = aWins / n;
  if (Math.abs(rate - 0.5) < dead_zone) return 0;
  const raw = (rate - 0.5) * 2 * Math.min(1, n / 8);
  return Math.max(-max_pts, Math.min(max_pts, raw));
}

function coachPair(homeAbbr, awayAbbr) {
  if (!coachData || !Array.isArray(coachData.h2h)) return null;
  const home = coachName(homeAbbr);
  const away = coachName(awayAbbr);
  if (!home || !away) return null;
  for (const row of coachData.h2h) {
    if (!row) continue;
    if ((row.a === home && row.b === away) || (row.a === away && row.b === home)) return row;
  }
  return null;
}

function ptsForA(row) {
  const stored = num(row && row.pts_for_a);
  if (stored !== null) return stored;
  return recomputePtsForA(row);
}

function coachTerm(game) {
  if (!coachData || !game) return 0;
  const pair = coachPair(game.home, game.away);
  if (!pair) return 0;
  const n = num(pair.n) ?? ((num(pair.a_wins) || 0) + (num(pair.b_wins) || 0));
  if (n < coachScoring().min_n) return 0;
  const rawA = ptsForA(pair);
  const home = coachName(game.home);
  if (home === pair.a) return rawA;
  if (home === pair.b) return -rawA;
  return 0;
}

function lastName(name) {
  const parts = String(name || "").trim().split(/\s+/);
  return parts[parts.length - 1] || "";
}

function fmtCoachPts(n) {
  const x = Math.round(Math.abs(Number(n)) * 100) / 100;
  let s = x.toFixed(2).replace(/\.?0+$/, "");
  if (!s) s = "0";
  return (n < 0 ? "−" : "+") + s;
}

function coachChipHtml(game) {
  if (!coachData || !game) return "";
  const pair = coachPair(game.home, game.away);
  if (!pair) return "";
  const aW = num(pair.a_wins) || 0;
  const bW = num(pair.b_wins) || 0;
  const n = num(pair.n) ?? (aW + bW);
  if (n < 1) return "";
  const home = coachName(game.home);
  const homeIsA = home === pair.a;
  const hw = homeIsA ? aW : bW;
  const lw = homeIsA ? bW : aW;
  const rec = hw + "-" + lw;
  const pts = ptsForA(pair);
  if (n >= 4 && pts !== 0) {
    const owner = pts > 0 ? pair.a : pair.b;
    return tip(`<span class="hc-chip gold">HC ${esc(fmtCoachPts(Math.abs(pts)))} ${esc(lastName(owner))}</span>`, SKED_TIPS.hcGold);
  }
  if (n >= 4) {
    return tip(`<span class="hc-chip">HC ${esc(rec)} · dead</span>`, SKED_TIPS.hcDead);
  }
  return tip(`<span class="hc-chip">HC ${esc(rec)} · n=${n}</span>`, SKED_TIPS.hcN);
}

function prepOf(abbr) {
  if (!prepData || !prepData.coaches) return null;
  return prepData.coaches[normAbbr(abbr)] || null;
}

function prepBlock(abbr, key) {
  const c = prepOf(abbr);
  const b = c && c[key];
  if (!b) return { wins: 0, losses: 0, pushes: 0, n: 0, book: "ATS", pts: 0, su_wins: 0, su_losses: 0 };
  return b;
}

function week1Term(abbr, week) {
  if (Number(week) !== 1) return 0;
  return num(prepBlock(abbr, "week1").pts) || 0;
}

function clubOffBye(abbr, week) {
  const w = Number(week);
  if (!w || w <= 1) return false;
  return byeWeeks(normAbbr(abbr)).includes(w - 1);
}

function byeTerm(abbr, week) {
  if (!clubOffBye(abbr, week)) return 0;
  return num(prepBlock(abbr, "bye").pts) || 0;
}

function prepNet(game) {
  if (!prepData || !game) return 0;
  const w = Number(game.week);
  return week1Term(game.home, w) - week1Term(game.away, w)
    + byeTerm(game.home, w) - byeTerm(game.away, w);
}

const SCHED_TZ = {
  SEA: 3, SF: 3, LAR: 3, LAC: 3, LV: 3,
  DEN: 2, ARI: 2,
  CHI: 1, GB: 1, MIN: 1, TEN: 1, HOU: 1, DAL: 1, NO: 1, KC: 1
};

function schedTz(abbr) {
  return SCHED_TZ[normAbbr(abbr)] || 0;
}

function teamMeta(abbr) {
  const a = normAbbr(abbr);
  const list = (nflData && nflData.teams) || [];
  return list.find((x) => x.abbr === a) || null;
}

function schedNeighbor(abbr, game, dir) {
  if (!nflData || !game || !game.date) return null;
  const a = normAbbr(abbr);
  const here = new Date(game.date);
  if (Number.isNaN(here.getTime())) return null;
  let best = null;
  let bestT = null;
  for (const g of nflData.games) {
    if (!g || !g.date) continue;
    if (g.home !== a && g.away !== a) continue;
    if (g.id && game.id && g.id === game.id) continue;
    const t = new Date(g.date);
    if (Number.isNaN(t.getTime())) continue;
    if (dir < 0 && t >= here) continue;
    if (dir > 0 && t <= here) continue;
    if (bestT == null || (dir < 0 ? t > bestT : t < bestT)) {
      best = g;
      bestT = t;
    }
  }
  return best;
}

function schedDays(prev, game) {
  if (!prev || !game || !prev.date || !game.date) return null;
  const a = new Date(prev.date);
  const b = new Date(game.date);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return (b - a) / 86400000;
}

function sameDivision(a, b) {
  const ta = teamMeta(a);
  const tb = teamMeta(b);
  if (!ta || !tb) return false;
  return ta.conf === tb.conf && ta.div === tb.div;
}

function schedClub(abbr, game) {
  const a = normAbbr(abbr);
  let pts = 0;
  const bits = [];
  if (!game) return { pts: 0, bits };
  const isAway = game.away === a;
  const prev = schedNeighbor(a, game, -1);

  if (isAway && !game.neutral) {
    let travel = 0;
    const hop = Math.abs(schedTz(a) - schedTz(game.home));
    if (hop >= 3) {
      travel -= 0.35;
      bits.push("3-zone");
    } else if (hop >= 2) {
      travel -= 0.25;
      bits.push("2-zone");
    }
    const et = toET(game.date);
    if (schedTz(a) >= 3 && et && Number.isFinite(et.hour) && et.hour < 16) {
      travel -= 0.15;
      bits.push("early PT");
    }
    const days = schedDays(prev, game);
    if (days != null && days < 6) {
      travel -= 0.25;
      bits.push("short week");
    }
    if (travel < -0.5) travel = -0.5;
    pts += travel;
  }

  if (!clubOffBye(a, game.week)) {
    const days = schedDays(prev, game);
    if (days != null && days >= 10) {
      pts += 0.25;
      bits.push("extra rest");
    }
  }

  const w = Number(game.week);
  if (w >= 2 && w <= 16) {
    const opp = game.home === a ? game.away : game.home;
    if (eff(a) - eff(opp) >= 4) {
      const nxt = schedNeighbor(a, game, 1);
      if (nxt) {
        const nxtOpp = nxt.home === a ? nxt.away : nxt.home;
        if (sameDivision(a, nxtOpp)) {
          pts -= 0.25;
          bits.push("trap");
        }
      }
    }
  }
  return { pts, bits };
}

function schedNet(game) {
  if (!game) return 0;
  const n = schedClub(game.home, game).pts - schedClub(game.away, game).pts;
  if (n > 0.5) return 0.5;
  if (n < -0.5) return -0.5;
  return Math.round(n * 100) / 100;
}

function schedSheetNote(game) {
  if (!game) return "";
  const home = schedClub(game.home, game);
  const away = schedClub(game.away, game);
  const bits = [];
  if (away.bits.length) bits.push(game.away + " " + away.bits.join("+"));
  if (home.bits.length) bits.push(game.home + " " + home.bits.join("+"));
  if (!bits.length) return "no schedule flag";
  return bits.join(" / ");
}


function prepChipOne(kind, block, name) {
  if (!block) return "";
  const w = num(block.wins) || 0;
  const l = num(block.losses) || 0;
  const n = num(block.n) ?? (w + l);
  const pts = num(block.pts) || 0;
  if (n < 1) return "";
  if (n >= 4 && pts !== 0) {
    const goldTip = kind === "W1" ? SKED_TIPS.w1Gold : SKED_TIPS.byeGold;
    return tip(`<span class="hc-chip gold">${esc(kind)} ${esc(fmtCoachPts(pts))} ${esc(lastName(name))}</span>`, goldTip);
  }
  if (n >= 4) {
    return tip(`<span class="hc-chip">${esc(kind)} ${w}-${l} · dead</span>`, SKED_TIPS.w1Floor);
  }
  return tip(`<span class="hc-chip">${esc(kind)} ${w}-${l} · n=${n}</span>`, SKED_TIPS.w1Floor);
}

function prepChipHtml(game) {
  if (!prepData || !game) return "";
  const w = Number(game.week);
  const parts = [];
  if (w === 1) {
    for (const abbr of [game.home, game.away]) {
      const c = prepOf(abbr);
      if (!c) continue;
      parts.push(prepChipOne("W1", c.week1, c.name));
    }
  }
  for (const abbr of [game.home, game.away]) {
    if (!clubOffBye(abbr, w)) continue;
    const c = prepOf(abbr);
    if (!c) continue;
    parts.push(prepChipOne("BYE", c.bye, c.name));
  }
  return parts.join("");
}

function prepSheetLines(abbr) {
  if (!prepData) return "";
  const c = prepOf(abbr);
  if (!c) return "";
  const line = (label, block) => {
    const b = block || {};
    const w = num(b.wins) || 0;
    const l = num(b.losses) || 0;
    const n = num(b.n) ?? (w + l);
    const pts = num(b.pts) || 0;
    const book = b.book || "ATS";
    let tail = "0";
    if (n >= 4 && pts !== 0) tail = fmtCoachPts(pts);
    else if (n >= 4) tail = "0";
    else if (n > 0) tail = "n=" + n;
    return `${label} ${book} ${w}-${l} · ${tail}`;
  };
  return `<p class="team-hc-prep">${esc(line("Week 1", c.week1))}</p>
      <p class="team-hc-prep">${esc(line("Post-bye", c.bye))}</p>`;
}

function atsOf(abbr) {
  if (!atsData || !atsData.coaches) return null;
  return atsData.coaches[normAbbr(abbr)] || null;
}

function atsScoring() {
  const s = atsData && atsData.scoring;
  return {
    min_n: (s && num(s.min_n)) ?? 16,
    dead_zone: (s && num(s.dead_zone)) ?? 0.04,
    max_pts: (s && num(s.max_pts)) ?? 0.35,
    n_full: (s && num(s.n_full)) ?? 48,
  };
}

function recomputeAtsPts(c) {
  const w = num(c && c.wins) || 0;
  const l = num(c && c.losses) || 0;
  const n = num(c && c.n) ?? (w + l);
  const { min_n, dead_zone, max_pts, n_full } = atsScoring();
  if (!n || n < min_n) return 0;
  const rate = w / n;
  if (Math.abs(rate - 0.5) < dead_zone) return 0;
  const raw = (rate - 0.5) * 2 * Math.min(1, n / n_full);
  return Math.max(-max_pts, Math.min(max_pts, raw));
}

function atsPts(abbr) {
  const c = atsOf(abbr);
  if (!c) return 0;
  const w = num(c.wins) || 0;
  const l = num(c.losses) || 0;
  const n = num(c.n) ?? (w + l);
  const rate = n ? w / n : (num(c.rate) || 0);
  const { min_n, dead_zone } = atsScoring();
  if (n < min_n || Math.abs(rate - 0.5) < dead_zone) return 0;
  const stored = num(c.pts);
  if (stored !== null) return stored;
  return recomputeAtsPts(c);
}

function atsNet(game) {
  if (!atsData || !game) return 0;
  return atsPts(game.home) - atsPts(game.away);
}

function atsChipHtml(game) {
  if (!atsData || !game) return "";
  const net = atsNet(game);
  if (!net) return "";
  const owner = net > 0 ? coachName(game.home) : coachName(game.away);
  return tip(`<span class="hc-chip">${esc("ATS " + fmtCoachPts(Math.abs(net)) + " " + lastName(owner))}</span>`, SKED_TIPS.ats);
}

function atsSheetLine(abbr) {
  if (!atsData) return "";
  const c = atsOf(abbr);
  const w = c ? (num(c.wins) || 0) : 0;
  const l = c ? (num(c.losses) || 0) : 0;
  const n = c ? (num(c.n) ?? (w + l)) : 0;
  const pts = atsPts(abbr);
  const { min_n } = atsScoring();
  let tail = "0";
  if (n >= min_n && pts !== 0) tail = fmtCoachPts(pts);
  else if (n >= min_n) tail = "0";
  else if (n > 0) tail = "n=" + n;
  return `<p class="team-hc-prep">${esc("Career ATS " + w + "-" + l + " · " + tail)}</p>`;
}

function atsSheetNote(game) {
  const bit = (abbr) => {
    const c = atsOf(abbr);
    const name = (c && c.name) || coachName(abbr) || abbr;
    const last = lastName(name);
    const w = c ? (num(c.wins) || 0) : 0;
    const l = c ? (num(c.losses) || 0) : 0;
    const n = c ? (num(c.n) ?? (w + l)) : 0;
    const pts = atsPts(abbr);
    const { min_n } = atsScoring();
    if (n < 1) return last + " n=0";
    if (n < min_n) return last + " " + w + "-" + l + " · n too small";
    if (pts === 0) return last + " " + w + "-" + l + " · dead";
    return last + " " + w + "-" + l + " · " + fmtCoachPts(pts);
  };
  if (!game) return "";
  return bit(game.home) + " / " + bit(game.away);
}

function ourHomeSpread(game, hfaVal) {
  const pad = game && game.neutral ? 0 : (hfaVal ?? hfa);
  const homeE = eff(game.home);
  const awayE = eff(game.away);
  return -(homeE - awayE + pad + coachTerm(game) + prepNet(game) + atsNet(game) + schedNet(game));
}

function parseMarket(details, homeAbbr, awayAbbr) {
  const raw = typeof details === "string"
    ? details
    : (details && (details.odds || details.details)) || "";
  const s = String(raw || "").trim();
  if (!s) return { fav: null, pts: null, homeLine: null };
  const pk = s.match(/^([A-Z]{2,3})\s*(PK|EVEN)$/i);
  if (pk) {
    const fav = normAbbr(pk[1]);
    return { fav, pts: 0, homeLine: 0 };
  }
  const m = s.match(/^([A-Z]{2,3})\s*([+-]?\d+(?:\.\d+)?)$/i);
  if (!m) return { fav: null, pts: null, homeLine: null };
  const fav = normAbbr(m[1]);
  const pts = Math.abs(Number(m[2]));
  const home = normAbbr(homeAbbr);
  const away = normAbbr(awayAbbr);
  let homeLine = null;
  if (fav === home) homeLine = -pts;
  else if (fav === away) homeLine = pts;
  return { fav, pts, homeLine };
}

function edgePts(ourHomeLine, marketHomeLine) {
  if (ourHomeLine == null || marketHomeLine == null) return null;
  if (!Number.isFinite(ourHomeLine) || !Number.isFinite(marketHomeLine)) return null;
  return marketHomeLine - ourHomeLine;
}

function crossesKeys(ourLine, mktLine) {
  if (ourLine == null || mktLine == null) return [];
  const keys = [3, 7, -3, -7];
  const lo = Math.min(ourLine, mktLine);
  const hi = Math.max(ourLine, mktLine);
  return keys.filter((k) => {
    if (ourLine === mktLine) return false;
    return lo < k && hi >= k || lo <= k && hi > k;
  }).map((k) => Math.abs(k)).filter((v, i, a) => a.indexOf(v) === i);
}

function enrich(t) {
  const ticket = { ...t };
  if (!ticket.id) ticket.id = uid();
  ticket.units = inferUnits(ticket);
  ticket.stake = stakeFromUnits(ticket.units);
  if (ticket.ticket_type === "PASS") {
    ticket.purpose = "Process";
    ticket.units = 0;
    ticket.stake = 0;
    if (!ticket.result || ticket.result === "PENDING") ticket.result = "VOID";
  } else {
    ticket.purpose = purposeFor(ticket.ticket_type);
  }
  ticket.clv_pts = computeCLV(ticket);
  ticket.clv_prob = computeClvProb(ticket);
  ticket.profit = computeProfit(ticket);
  return ticket;
}

/* ---------- store ---------- */

let tickets = [];
let currentWeek = 1;
let playbookFilter = "ALL";
let lastFocus = null;

let nflData = null; // { teams, games, pulled, ... } from ./data/nfl-2026.json
let priorData = null; // { teams, ranges, weights, taper } from ./data/prior-2025.json
let faData = null; // { teams, scoring, season } from ./data/fa-2026.json; null if missing
let draftData = null; // { teams, scoring, season, window_games } from ./data/draft-2026.json; null if missing
let maddenData = null; // { teams, scoring } from ./data/madden-2026.json; null if missing
let sosData = null; // { teams } from ./data/sos-2025.json; realized SOS + record; null if missing
let injuryScale = null; // from ./data/injury-scale.json
let injurySeed = null;  // optional ./data/injury-2026.json; null if missing
let notesSeed = null;  // optional ./data/profile-notes.json; null if missing
let weatherScale = null; // from ./data/weather-scale.json
let coachData = null; // from ./data/coaches-2026.json; null if missing → coach_term 0
let prepData = null; // from ./data/coach-prep-2026.json; null if missing → prep_net 0
let atsData = null; // from ./data/coach-ats-2026.json; null if missing → ats_net 0
let keysData = null; // from ./data/keys-nfl.json; null if missing
let vibeIndex = null; // from ./data/vibe-check/index.json; null if missing
let vibeWeeksCal = null; // from ./data/vibe-check/weeks.json; null if missing
let vibeTeams = null; // from ./data/vibe-check/teams.json; null if missing
let vibeWeekId = null; // selected vibe week; default current_week_id
let vibeWeekPicked = false;
let vibeRollupCache = {}; // { [weekId]: object | null }
let vibeDayCache = {}; // { [dayKey]: object | null }
let vibeOpenDay = null;
let vibeInflight = {};
let schemeData = null; // from ./data/scheme-2025.json; null if missing
let totalsModel = null; // from ./data/totals-model.json; formula note only
let weatherByGame = {}; // { [gameId]: { wind, temp, precip, roof, note } }
let residualsByGame = {}; // { [gameId]: { close_spread, close_total } }
let sharpBook = SHARP_BOOK_DEFAULT;
let profiles = {};  // { [abbr]: { base, notes, context, user_adjust, locked_base, injuries } }
let lineOverrides = {}; // { [gameId]: { odds, ou } }
let hfa = HFA_DEFAULT;
let teamConf = null; // null | AFC | NFC
let teamDiv = null;  // null | East | North | South | West
let teamSort = "rating-desc";
let profileAbbr = null;
let pendingTeam = null;
let gameSheetId = null;
let pendingGame = null;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    tickets = Array.isArray(parsed) ? parsed.map(enrich) : [];
  } catch {
    tickets = [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function emptyProfile() {
  return { base: 0, notes: "", context: [], user_adjust: 0, locked_base: false, injuries: [], adjust_log: [] };
}

function normalizeProfile(p) {
  if (!p || typeof p !== "object") return emptyProfile();
  const hasAdjust = Object.prototype.hasOwnProperty.call(p, "user_adjust");
  const oldBase = num(p.base) ?? 0;
  let user_adjust = hasAdjust ? (num(p.user_adjust) ?? 0) : 0;
  // Pre-taper profiles stored the typed number in base. Keep that number as
  // user_adjust. Do not wipe base; do not use it as the algorithm.
  if (!hasAdjust && oldBase !== 0) user_adjust = oldBase;
  return {
    base: oldBase,
    notes: typeof p.notes === "string" ? p.notes : "",
    context: Array.isArray(p.context) ? p.context.map((c) => ({
      id: c.id || uid(),
      text: c.text || "",
      pts: num(c.pts) ?? 0,
      on: c.on !== false,
    })) : [],
    user_adjust,
    locked_base: p.locked_base === true,
    injuries: Array.isArray(p.injuries) ? p.injuries.map((r) => ({
      id: r.id || uid(),
      name: typeof r.name === "string" ? r.name : "",
      pos: r.pos || "DEPTH",
      status: r.status || "QUESTIONABLE",
      pts: num(r.pts) ?? 0,
      on: r.on !== false,
      custom: r.custom === true,
    })) : [],
    adjust_log: Array.isArray(p.adjust_log) ? p.adjust_log.map((r) => ({
      id: r.id || uid(),
      ts: typeof r.ts === "string" && r.ts ? r.ts : new Date().toISOString(),
      from: num(r.from) ?? 0,
      to: num(r.to) ?? 0,
      why: typeof r.why === "string" ? r.why : "",
    })) : [],
  };
}

function getProfile(abbr) {
  return normalizeProfile(profiles[normAbbr(abbr)]);
}

function setProfile(abbr, patch) {
  const a = normAbbr(abbr);
  profiles[a] = { ...getProfile(a), ...patch };
  saveProfiles();
}

let adjustBurstFrom = null;
let adjustLogTimer = null;

function readAdjustWhy() {
  const el = document.getElementById("tp-adjust-why");
  return el ? String(el.value || "").trim() : "";
}

function markAdjustWhyNeeded(on) {
  const el = document.getElementById("tp-adjust-why");
  if (!el) return;
  el.classList.toggle("is-needed", !!on);
}

function applyAdjust(next, opts = {}) {
  if (!profileAbbr) return;
  const cur = num(getProfile(profileAbbr).user_adjust) || 0;
  const val = opts.snap === false ? (num(next) ?? 0) : snapHalf(next);
  if (adjustBurstFrom === null) adjustBurstFrom = cur;
  setProfile(profileAbbr, { user_adjust: val });
  if (opts.writeInput !== false) {
    const inp = document.getElementById("tp-adjust");
    if (inp) inp.value = val;
  }
  refreshTeamDerived();
  clearTimeout(adjustLogTimer);
  adjustLogTimer = setTimeout(commitAdjustLog, 700);
}

function commitAdjustLog() {
  if (!profileAbbr) return;
  const why = readAdjustWhy();
  const p = getProfile(profileAbbr);
  const to = num(p.user_adjust) || 0;
  const from = adjustBurstFrom;
  if (from === null || from === to) {
    adjustBurstFrom = null;
    markAdjustWhyNeeded(false);
    return;
  }
  if (!why) {
    markAdjustWhyNeeded(true);
    const el = document.getElementById("tp-adjust-why");
    if (el && document.activeElement !== el) el.focus();
    return;
  }
  const log = (p.adjust_log || []).slice();
  log.unshift({
    id: uid(),
    ts: new Date().toISOString(),
    from,
    to,
    why,
  });
  adjustBurstFrom = null;
  markAdjustWhyNeeded(false);
  setProfile(profileAbbr, { adjust_log: log });
  renderAdjustLog();
}

function fmtAdjustWhen(ts) {
  const et = toET(ts);
  if (!et) return ts || "";
  return et.label + " · " + et.clock + " ET";
}

function adjustLogHtml(abbr) {
  const log = getProfile(abbr).adjust_log || [];
  if (!log.length) return '<p class="adjust-log-empty">No overrides logged.</p>';
  return '<ol class="adjust-log">' + log.map((r) => (
    "<li>"
    + '<span class="adjust-log-when">' + esc(fmtAdjustWhen(r.ts)) + "</span>"
    + '<span class="adjust-log-move">' + esc(fmtRtg(r.from)) + " → " + esc(fmtRtg(r.to)) + "</span>"
    + '<span class="adjust-log-why">' + esc(r.why) + "</span>"
    + "</li>"
  )).join("") + "</ol>";
}

function renderAdjustLog() {
  const box = document.getElementById("tp-adjust-log");
  if (!box || !profileAbbr) return;
  box.innerHTML = adjustLogHtml(profileAbbr);
}

function migrateAllProfiles() {
  let changed = false;
  for (const k of Object.keys(profiles)) {
    const raw = profiles[k];
    if (!raw || typeof raw !== "object") continue;
    if (Object.prototype.hasOwnProperty.call(raw, "user_adjust")) continue;
    const oldBase = num(raw.base) ?? 0;
    if (oldBase === 0) continue;
    profiles[k] = normalizeProfile(raw);
    changed = true;
  }
  if (changed) saveProfiles();
}

function loadProfiles() {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    profiles = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    migrateAllProfiles();
  } catch { profiles = {}; }
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    lineOverrides = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch { lineOverrides = {}; }
  const h = num(localStorage.getItem(HFA_KEY));
  hfa = h === null ? HFA_DEFAULT : h;
}

function saveProfiles() {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

function saveOverrides() {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(lineOverrides));
}

function saveHfa() {
  localStorage.setItem(HFA_KEY, String(hfa));
}

function emptyWx() {
  return { wind: "", temp: "", precip: "", roof: "", note: "" };
}

function loadWeather() {
  try {
    const raw = localStorage.getItem(WEATHER_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    weatherByGame = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch { weatherByGame = {}; }
}

function saveWeather() {
  localStorage.setItem(WEATHER_KEY, JSON.stringify(weatherByGame));
}

function loadResiduals() {
  try {
    const raw = localStorage.getItem(RESIDUALS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    residualsByGame = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch { residualsByGame = {}; }
}

function saveResiduals() {
  localStorage.setItem(RESIDUALS_KEY, JSON.stringify(residualsByGame));
}

function getResidual(id) {
  const row = residualsByGame[id];
  if (!row || typeof row !== "object") return { close_spread: "", close_total: "" };
  return {
    close_spread: row.close_spread === undefined || row.close_spread === null ? "" : row.close_spread,
    close_total: row.close_total === undefined || row.close_total === null ? "" : row.close_total,
  };
}

function setResidual(id, patch) {
  residualsByGame[id] = { ...getResidual(id), ...patch };
  saveResiduals();
}

function loadSharpBook() {
  try {
    const raw = localStorage.getItem(SHARP_BOOK_KEY);
    sharpBook = (typeof raw === "string" && raw.trim()) ? raw : SHARP_BOOK_DEFAULT;
  } catch { sharpBook = SHARP_BOOK_DEFAULT; }
}

function saveSharpBook() {
  localStorage.setItem(SHARP_BOOK_KEY, sharpBook);
}

function syncSharpBookInputs() {
  for (const id of ["sharp-book", "sharp-book-desk"]) {
    const el = document.getElementById(id);
    if (el && el.value !== sharpBook) el.value = sharpBook;
  }
}

function teamByAbbr(abbr) {
  if (!nflData || !nflData.teams) return null;
  const a = normAbbr(abbr);
  return nflData.teams.find((t) => t.abbr === a) || null;
}

function marketFor(game) {
  const ov = lineOverrides[game.id] || {};
  const odds = ov.odds != null && ov.odds !== "" ? ov.odds : game.odds;
  const ou = Object.prototype.hasOwnProperty.call(ov, "ou") ? ov.ou : game.ou;
  return { odds: odds || "", ou: ou ?? null, parsed: parseMarket(odds, game.home, game.away) };
}

async function loadNfl() {
  const nflReq = fetch("./data/nfl-2026.json");
  const priorReq = fetch("./data/prior-2025.json");
  const faReq = fetch("./data/fa-2026.json");
  const draftReq = fetch("./data/draft-2026.json");
  const maddenReq = fetch("./data/madden-2026.json");
  const sosReq = fetch("./data/sos-2025.json");
  const scaleReq = fetch("./data/injury-scale.json");
  const injReq = fetch("./data/injury-2026.json");
  const wxReq = fetch("./data/weather-scale.json");
  const coachReq = fetch("./data/coaches-2026.json");
  const prepReq = fetch("./data/coach-prep-2026.json");
  const atsReq = fetch("./data/coach-ats-2026.json");
  const keysReq = fetch("./data/keys-nfl.json");
  const schemeReq = fetch("./data/scheme-2025.json");
  const totalsReq = fetch("./data/totals-model.json");
  try {
    const res = await nflReq;
    if (!res.ok) throw new Error(String(res.status));
    nflData = await res.json();
    if (!nflData || !Array.isArray(nflData.teams) || !Array.isArray(nflData.games)) {
      throw new Error("bad payload");
    }
  } catch (err) {
    nflData = { teams: [], games: [], pulled: "", hfa_default: HFA_DEFAULT };
    toast("Could not load 2026 schedule. Serve this folder over http.");
    console.warn("nfl-2026.json", err);
  }
  try {
    const res = await priorReq;
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!data || !data.teams || typeof data.teams !== "object") throw new Error("bad prior");
    priorData = data;
  } catch (err) {
    priorData = null;
    console.warn("prior-2025.json", err);
  }
  try {
    const res = await faReq;
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!data || !data.teams || typeof data.teams !== "object") throw new Error("bad fa");
    faData = data;
  } catch (err) {
    faData = null;
    console.warn("fa-2026.json", err);
  }
  try {
    const res = await draftReq;
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!data || !data.teams || typeof data.teams !== "object") throw new Error("bad draft");
    draftData = data;
  } catch (err) {
    draftData = null;
    console.warn("draft-2026.json", err);
  }
  try {
    const res = await maddenReq;
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!data || !data.teams || typeof data.teams !== "object") throw new Error("bad madden");
    maddenData = data;
  } catch (err) {
    maddenData = null;
    console.warn("madden-2026.json", err);
  }
  try {
    const res = await sosReq;
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!data || !data.teams || typeof data.teams !== "object") throw new Error("bad sos");
    sosData = data;
  } catch (err) {
    sosData = null;
    console.warn("sos-2025.json", err);
  }
  try {
    const res = await scaleReq;
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!data || !data.positions || !data.status) throw new Error("bad scale");
    injuryScale = data;
  } catch (err) {
    injuryScale = {
      pulled: "2026-08-19",
      cap_player: 4.5,
      cap_team: 6.0,
      status: { IR: 1.0, OUT: 1.0, PUP: 1.0, NFI: 1.0, DOUBTFUL: 0.75, QUESTIONABLE: 0.35, PROBABLE: 0.0 },
      positions: {
        QB1: 3.5, LT: 2.0, RT: 1.0, EDGE1: 1.5, WR1: 1.2, CB1: 1.2, IDL: 0.8, C: 0.8,
        RB1: 0.6, TE1: 0.5, WR2: 0.5, S: 0.5, LB: 0.5, OG: 0.5, K: 0.2, DEPTH: 0.2,
      },
    };
    console.warn("injury-scale.json", err);
  }
  try {
    const res = await injReq;
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!data || !data.teams || typeof data.teams !== "object") throw new Error("bad injury seed");
    injurySeed = data;
  } catch (err) {
    injurySeed = null;
    console.warn("injury-2026.json", err);
  }
  seedInjuriesIfNeeded();
  try {
    const res = await fetch("./data/profile-notes.json");
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!data || !data.teams || typeof data.teams !== "object") throw new Error("bad notes seed");
    notesSeed = data;
  } catch (err) {
    notesSeed = null;
    console.warn("profile-notes.json", err);
  }
  seedNotesIfNeeded();
  try {
    const res = await wxReq;
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!data || typeof data !== "object") throw new Error("bad weather scale");
    weatherScale = data;
  } catch (err) {
    weatherScale = null;
    console.warn("weather-scale.json", err);
  }
  try {
    const res = await coachReq;
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!data || !data.coaches || !Array.isArray(data.h2h)) throw new Error("bad coaches");
    coachData = data;
  } catch (err) {
    coachData = null;
    console.warn("coaches-2026.json", err);
  }
  try {
    const res = await prepReq;
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!data || !data.coaches || typeof data.coaches !== "object") throw new Error("bad prep");
    prepData = data;
  } catch (err) {
    prepData = null;
    console.warn("coach-prep-2026.json", err);
  }
  try {
    const res = await atsReq;
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!data || !data.coaches || typeof data.coaches !== "object") throw new Error("bad ats");
    atsData = data;
  } catch (err) {
    atsData = null;
    console.warn("coach-ats-2026.json", err);
  }
  try {
    const res = await keysReq;
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!data || typeof data !== "object") throw new Error("bad keys");
    keysData = data;
  } catch (err) {
    keysData = null;
    console.warn("keys-nfl.json", err);
  }
  try {
    const res = await schemeReq;
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!data || typeof data !== "object") throw new Error("bad scheme");
    schemeData = data;
  } catch (err) {
    schemeData = null;
    console.warn("scheme-2025.json", err);
  }
  try {
    const res = await totalsReq;
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!data || typeof data !== "object") throw new Error("bad totals model");
    totalsModel = data;
  } catch (err) {
    totalsModel = null;
    console.warn("totals-model.json", err);
  }
  try {
    const res = await fetch("./data/vibe-check/index.json");
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!data || typeof data !== "object") throw new Error("bad vibe index");
    vibeIndex = data;
    if (!vibeWeekPicked && data.current_week_id) vibeWeekId = data.current_week_id;
  } catch (err) {
    vibeIndex = null;
    console.warn("vibe-check/index.json", err);
  }
  try {
    const res = await fetch("./data/vibe-check/weeks.json");
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!data || !Array.isArray(data.weeks)) throw new Error("bad vibe weeks");
    vibeWeeksCal = data;
  } catch (err) {
    vibeWeeksCal = null;
    console.warn("vibe-check/weeks.json", err);
  }
  try {
    const res = await fetch("./data/vibe-check/teams.json");
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!data || !Array.isArray(data.teams)) throw new Error("bad vibe teams");
    vibeTeams = data;
  } catch (err) {
    vibeTeams = null;
  }
}

function upsert(partial) {
  const next = enrich(partial);
  const i = tickets.findIndex((t) => t.id === next.id);
  if (i >= 0) tickets[i] = next;
  else tickets.push(next);
  save();
  render();
}

function remove(id) {
  tickets = tickets.filter((t) => t.id !== id);
  save();
  render();
}

/* ---------- formatters ---------- */

function money(n, empty = "—") {
  if (n === null || n === undefined || Number.isNaN(n)) return empty;
  const sign = n < 0 ? "−" : "";
  return sign + "$" + Math.abs(n).toFixed(2);
}

function moneyInt(n) {
  if (n === null || n === undefined) return "—";
  const sign = n < 0 ? "−" : "";
  return sign + "$" + Math.abs(Math.round(n)).toLocaleString("en-US");
}

function pts(n) {
  if (n === null || n === undefined) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "" : "";
  return sign + Number(n).toFixed(2);
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tip(html, text) {
  const t = String(text ?? "");
  return `<span class="sked-tip" data-tip="${esc(t)}" title="${esc(t)}" tabindex="0">${html}</span>`;
}

const SKED_TIPS = {
  edge: "How far our number is from the sportsbook. Plus = we like the home team more than they do. Minus = we like the visitor. Copper means the gap is about a field goal, or we sit on opposite sides of 3 or 7. Highlight is not a ticket.",
  crosses: "We sit on one side of 3 or 7 and the sportsbook sits on the other. NFL games land on field goals and touchdowns a lot, so that half-point is the bet. Still not automatic.",
  fire: "Copper when we disagree with the sportsbook by about a field goal, or we landed on opposite sides of 3 or 7. We show the disagreement. We do not auto-bet.",
  our: "The gap we expect, from the home team’s view. Minus means we think the home team is better. Built from last year, roster changes, rookies, Madden, injuries, and home field.",
  mkt: "The sportsbook number. Compare it to our line. The difference is the edge.",
  hcGold: "Coach vs coach, SU, home view. Moves the line (cap 1). n≥4 and outside the dead zone. Not ATS.",
  hcDead: "Enough games (n≥4) but the win rate is too close to .500. Number is 0.",
  hcN: "Under 4 H2H games. We will not put a number on it.",
  w1Gold: "This coach's career Week 1 ATS, capped at 1. Copper = it is on the line this week.",
  byeGold: "This coach's career post-bye ATS, capped at 1. Copper = it is on the line this week.",
  w1Floor: "Same floor as coach H2H: 4 games or the chip is dead / n= only.",
  ats: "This coach’s career record against the sportsbook, not just wins and losses. A small nudge. It does not replace head-to-head wins.",
  sched: "Road travel, a short week, looking ahead to a division game, or extra rest that is not a bye. Cap half a point. Does not replace the bye chip.",
  wx: "Weather only changes the expected combined score, not who we think wins. A dome is zero. Wind matters most.",
  ourOu: "The combined score we expect (both teams). Built from last year’s scoring, then weather.",
  totEdge: "Sportsbook total minus our total. Plus means we expect a lower-scoring game than they do. Copper if the gap is about 1.5. Not a ticket.",
  cover: "How often a home team has beaten that point gap in past NFL games. Info only.",
  hfa: "Extra points we give the home team for playing at home. Neutral sites (Melbourne) get zero.",
};

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 3200);
}

/* ---------- KPIs ---------- */

function weekTickets() {
  return tickets.filter((t) => isSeasonTicket(t) && Number(t.week) === Number(currentWeek));
}

function kpis() {
  const week = weekTickets();
  const stakes = week.reduce((s, t) => s + (num(t.stake) || 0), 0);
  const remaining = WEEKLY_BUDGET - stakes;
  const processStakes = week
    .filter((t) => t.ticket_type === "Straight")
    .reduce((s, t) => s + (num(t.stake) || 0), 0);
  const entStakes = week
    .filter((t) => t.ticket_type === "Parlay")
    .reduce((s, t) => s + (num(t.stake) || 0), 0);
  const straights = week.filter((t) => t.ticket_type === "Straight");
  const processPL = straights.reduce((s, t) => {
    const p = computeProfit(t);
    return s + (p === null ? 0 : p);
  }, 0);
  const gradedPL = straights.some((t) => computeProfit(t) !== null);
  const clvs = straights.map((t) => computeCLV(t)).filter((n) => n !== null);
  const avgCLV = clvs.length ? clvs.reduce((a, b) => a + b, 0) / clvs.length : null;
  const clvProbs = straights.map((t) => computeClvProb(t)).filter((n) => n !== null);
  const avgClvProb = clvProbs.length ? clvProbs.reduce((a, b) => a + b, 0) / clvProbs.length : null;
  const passes = week.filter((t) => t.ticket_type === "PASS").length;
  const leftover = Math.max(0, WEEKLY_BUDGET - processStakes - entStakes);
  const hasSeason = week.length > 0;
  return {
    remaining, processStakes, entStakes, leftover, processPL, gradedPL,
    avgCLV, clvCount: clvs.length, avgClvProb, clvProbCount: clvProbs.length,
    passes, stakes, hasSeason,
  };
}

function renderKPIs() {
  const k = kpis();
  const plClass = !k.gradedPL ? "" : k.processPL > 0 ? "up" : k.processPL < 0 ? "down" : "";
  const clvClass = k.avgCLV === null ? "" : k.avgCLV > 0 ? "up" : k.avgCLV < 0 ? "down" : "";
  document.getElementById("kpi-grid").innerHTML = `
    <article class="kpi gold">
      <p class="kpi-label">Money left this week</p>
      <p class="kpi-val">${esc(moneyInt(k.remaining))}<small class="kpi-units"> · ${esc(String(Math.max(0, Math.round(k.remaining / UNIT))))}u</small></p>
      <p class="kpi-note">20 units · $50 each · leftover stays unspent</p>
    </article>
    <article class="kpi process">
      <p class="kpi-label">One-game P/L</p>
      <p class="kpi-val ${plClass}">${k.gradedPL ? esc(money(k.processPL)) : "—"}</p>
      <p class="kpi-note">One-game bets only · parlays are for fun</p>
    </article>
    <article class="kpi">
      <p class="kpi-label">Beat the last number?</p>
      <p class="kpi-val ${clvClass}">${k.avgCLV === null ? "—" : esc(pts(k.avgCLV))}</p>
      <p class="kpi-note">${k.clvCount ? k.clvCount + " one-game bet" + (k.clvCount === 1 ? "" : "s") + " vs the last sportsbook number" : "Did we get a better number than the last one?"}</p>
      ${k.avgClvProb === null ? "" : `<p class="kpi-sub ${k.avgClvProb > 0 ? "up" : k.avgClvProb < 0 ? "down" : ""}">avg clv_prob ${esc(fmtClvProb(k.avgClvProb))} · ${k.clvProbCount} process</p>`}
    </article>
    <article class="kpi pass">
      <p class="kpi-label">Games we skipped</p>
      <p class="kpi-val">${k.passes}</p>
      <p class="kpi-note">A skip is a decision, not a miss</p>
    </article>`;

  const tot = WEEKLY_BUDGET || 1;
  const pPct = (k.processStakes / tot) * 100;
  const ePct = (k.entStakes / tot) * 100;
  const lPct = Math.max(0, 100 - pPct - ePct);
  document.getElementById("split-bar").innerHTML = `
    <span class="seg-process" style="width:${pPct}%" title="Process"></span>
    <span class="seg-ent" style="width:${ePct}%" title="Entertainment"></span>
    <span class="seg-left" style="width:${lPct}%" title="Leftover"></span>`;
  document.getElementById("split-bar").setAttribute(
    "aria-label",
    `Process ${moneyInt(k.processStakes)}, entertainment ${moneyInt(k.entStakes)}, leftover ${moneyInt(k.leftover)}`
  );
  document.getElementById("split-legend").innerHTML = `
    <li><i class="i-p"></i>One-game ${esc(moneyInt(k.processStakes))}</li>
    <li><i class="i-e"></i>Fun ${esc(moneyInt(k.entStakes))}</li>
    <li><i class="i-l"></i>Unspent ${esc(moneyInt(k.leftover))}</li>`;

  document.getElementById("empty-desk").hidden = k.hasSeason;
}

/* ---------- card ---------- */

function slotStatus(ticket) {
  if (!ticket) return { code: "EMPTY", label: "EMPTY" };
  if (ticket.ticket_type === "PASS") return { code: "PASS", label: "PASS" };
  const r = ticket.result;
  if (r && r !== "PENDING") return { code: "GRADED", label: "GRADED · " + r };
  return { code: "LOCKED", label: "LOCKED" };
}

function renderCard() {
  const week = weekTickets();
  const html = WINDOWS.map((w) => {
    const straight = week.find((t) => t.window === w.id && t.ticket_type === "Straight");
    const parlay = week.find((t) => t.window === w.id && t.ticket_type === "Parlay");
    const pass = week.find((t) => t.window === w.id && t.ticket_type === "PASS");
    const sTicket = straight || pass;
    const sStat = slotStatus(sTicket);
    const pStat = slotStatus(parlay);
    return `
      <article class="slip" data-window="${w.id}">
        <p class="slip-win">${esc(w.short)}</p>
        <h3>${esc(w.label)}</h3>
        <div class="slot">
          <div class="slot-kicker"><span>${sTicket && sTicket.ticket_type !== "PASS" ? esc(fmtUnits(inferUnits(sTicket)) + " straight") : "1–3u straight"}</span><span class="tag tag-process">PROCESS</span></div>
          <p class="slot-status ${sStat.code.toLowerCase()}">${sStat.label}</p>
          ${sTicket ? `
            <p class="slot-pick">${esc(sTicket.pick || sTicket.ticket_type)}</p>
            <p class="slot-meta">${esc([sTicket.market, sTicket.bet_line != null ? sTicket.bet_line : "", sTicket.book, sTicket.clv_pts != null ? "CLV " + pts(sTicket.clv_pts) : ""].filter(Boolean).join(" · "))}</p>
          ` : `<p class="slot-pick">No number yet.</p>`}
        </div>
        <div class="slot">
          <div class="slot-kicker"><span>1u parlay</span><span class="tag tag-ent">ENTERTAINMENT</span></div>
          <p class="slot-status ${pStat.code.toLowerCase()}">${pStat.label}</p>
          ${parlay ? `
            <p class="slot-pick">${esc(parlay.pick)}</p>
            <p class="slot-meta">${esc([parlay.market, parlay.book].filter(Boolean).join(" · "))} · not scored</p>
          ` : `<p class="slot-pick">Optional. Same lock window.</p>`}
        </div>
        <div class="slip-actions">
          <button type="button" class="btn btn-fill" data-log="${w.id}">Log ticket</button>
          <button type="button" class="btn" data-pass="${w.id}">Record pass</button>
        </div>
      </article>`;
  }).join("");
  document.getElementById("window-grid").innerHTML = html;
}

/* ---------- clock / playbook ---------- */

function chipClass(tag) {
  if (tag === "VERIFIED") return "chip chip-verified";
  if (tag === "MIXED") return "chip chip-mixed";
  if (tag === "FOLKLORE") return "chip chip-folklore";
  if (tag === "DESK RULE") return "chip chip-desk";
  if (tag === "IGNORE") return "chip chip-ignore";
  return "chip";
}

function renderClock() {
  document.getElementById("timeline").innerHTML = CLOCK.map((b) => `
    <li class="beat ${b.now ? "is-now" : ""}">
      <p class="beat-when">${esc(b.when)}${b.now ? " · now" : ""}</p>
      <h3>${esc(b.window)}</h3>
      <p>${b.tags.map((t) => `<span class="${chipClass(t)}">${esc(t)}</span>`).join("")}</p>
      <p class="happens">${esc(b.happens)}</p>
      <p class="action"><strong>Action for our card</strong>${esc(b.action)}</p>
      <p class="happens">${esc(b.tagNote)}</p>
    </li>
  `).join("");
}

function renderPlaybook() {
  const tags = ["ALL", "COPY", "ENTERTAINMENT", "ADAPT", "IGNORE"];
  document.getElementById("playbook-filters").innerHTML = tags.map((t) =>
    `<button type="button" data-filter="${t}" aria-pressed="${playbookFilter === t}">${t}</button>`
  ).join("");
  const rows = PLAYBOOK.filter((r) => playbookFilter === "ALL" || r.tag === playbookFilter);
  document.getElementById("playbook-grid").innerHTML = rows.map((r) => `
    <article class="rule tag-${r.tag}">
      <div class="rule-top">
        <span class="rule-id">${esc(r.id)}</span>
        <span class="tag tag-${r.tag === "COPY" ? "process" : r.tag === "ENTERTAINMENT" ? "ent" : r.tag === "ADAPT" ? "sample" : "pass"}">${esc(r.tag)}</span>
      </div>
      <h3>${esc(r.name)}</h3>
      <p class="principle">${esc(r.principle)}</p>
      <dl>
        <dt>When</dt><dd>${esc(r.when)}</dd>
        <dt>How we use it</dt><dd>${esc(r.how)}</dd>
      </dl>
    </article>
  `).join("");
}

/* ---------- ledger ---------- */

function renderLedger() {
  const body = document.getElementById("ledger-body");
  const empty = document.getElementById("table-empty");
  if (!tickets.length) {
    body.innerHTML = "";
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  const sorted = [...tickets].sort((a, b) => {
    if (isSample(a) !== isSample(b)) return isSample(a) ? 1 : -1;
    return (Number(a.week) - Number(b.week)) || String(a.window).localeCompare(String(b.window));
  });
  body.innerHTML = sorted.map((t) => {
    const clv = computeCLV(t);
    const clvProb = computeClvProb(t);
    const clvProbHtml = clvProb == null ? "" : '<div class="kpi-sub ' + (clvProb > 0 ? "up" : clvProb < 0 ? "down" : "") + '">' + esc(fmtClvProb(clvProb)) + "</div>";
    const profit = computeProfit(t);
    const pClass = profit > 0 ? "profit-up" : profit < 0 ? "profit-down" : "";
    const sample = isSample(t);
    return `<tr class="${sample ? "sample" : ""}" data-id="${esc(t.id)}">
      <td class="num">${esc(t.week)}</td>
      <td class="num">${esc(t.window)}</td>
      <td>${esc(t.ticket_type)}${sample ? ' <span class="tag tag-sample">SAMPLE</span>' : ""}</td>
      <td>${esc(t.purpose)}</td>
      <td class="game">${esc(t.game)}</td>
      <td>${esc(t.market)}</td>
      <td>${esc(t.pick)}</td>
      <td class="num">${t.bet_line == null || t.bet_line === "" ? "—" : esc(t.bet_line)}</td>
      <td class="num">${t.juice == null || t.juice === "" ? "—" : esc(t.juice)}</td>
      <td class="num">${esc(fmtUnits(inferUnits(t)))} · ${esc(money(num(t.stake) ?? 0))}</td>
      <td>${esc(t.book)}</td>
      <td class="num">${t.close_line == null || t.close_line === "" ? "—" : esc(t.close_line)}</td>
      <td class="num ${clv > 0 ? "profit-up" : clv < 0 ? "profit-down" : ""}">${esc(pts(clv))}${clvProbHtml}</td>
      <td class="num">${esc(t.result || "PENDING")}</td>
      <td class="num ${pClass}">${profit === null ? "—" : esc(money(profit))}</td>
      <td class="notes">${esc(t.notes)}</td>
      <td>
        <div class="grade-btns">
          <button type="button" data-grade="W" data-id="${esc(t.id)}">W</button>
          <button type="button" data-grade="L" data-id="${esc(t.id)}">L</button>
          <button type="button" data-grade="P" data-id="${esc(t.id)}">P</button>
          <button type="button" data-grade="VOID" data-id="${esc(t.id)}">VOID</button>
          <input type="number" step="0.5" data-close="${esc(t.id)}" value="${t.close_line ?? ""}" aria-label="Close line" placeholder="close">
        </div>
        <div class="row-actions">
          <button type="button" data-edit="${esc(t.id)}">Edit</button>
          <button type="button" data-del="${esc(t.id)}">Delete</button>
        </div>
      </td>
    </tr>`;
  }).join("");
}

function fmtRtg(n) {
  const x = num(n);
  if (x === null || x === 0) return "0.0";
  if (x > 0) return "+" + x.toFixed(1);
  return "−" + Math.abs(x).toFixed(1);
}

function fmtSpreadNum(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  if (n === 0) return "PK";
  const sign = n > 0 ? "+" : "−";
  return sign + Math.abs(n).toFixed(1);
}

function formatOurLine(homeLine, homeAbbr, awayAbbr) {
  if (homeLine == null || !Number.isFinite(homeLine)) return "—";
  if (homeLine === 0) return "PK";
  if (homeLine < 0) return homeAbbr + " −" + Math.abs(homeLine).toFixed(1);
  return awayAbbr + " −" + Math.abs(homeLine).toFixed(1);
}

function rtgClass(n) {
  const x = num(n) || 0;
  if (x > 0) return "plus";
  if (x < 0) return "minus";
  return "zero";
}

function allRatingsZero() {
  if (!nflData || !nflData.teams || !nflData.teams.length) return true;
  return nflData.teams.every((t) => eff(t.abbr) === 0);
}

function hasOurNumber(game) {
  return eff(game.home) !== 0 || eff(game.away) !== 0;
}

function toET(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = {};
  for (const p of fmt.formatToParts(d)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  const wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[parts.weekday];
  const clock = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  return {
    date: d,
    weekday: wd,
    weekdayShort: parts.weekday,
    month: parts.month,
    day: parts.day,
    hour,
    minute,
    clock,
    label: parts.weekday + " " + parts.month + " " + parts.day,
  };
}

function kickBucket(iso) {
  const et = toET(iso);
  if (!et) return { id: "unk", label: "Unscheduled", order: 99 };
  const { weekday: dow, hour } = et;
  if (dow === 3) return { id: "wed", label: "Wednesday", order: 10 };
  if (dow === 4) return { id: "thu", label: "Thursday", order: 20 };
  if (dow === 5) return { id: "fri", label: "Friday", order: 30 };
  if (dow === 6) return { id: "sat", label: "Saturday", order: 40 };
  if (dow === 1) return { id: "mnf", label: "Monday Night", order: 80 };
  if (dow === 2) return { id: "tue", label: "Tuesday", order: 90 };
  if (hour < 13) return { id: "sun-am", label: "Sunday early", order: 50 };
  if (hour < 16) return { id: "sun-1", label: "Sunday 1pm", order: 60 };
  if (hour < 19) return { id: "sun-late", label: "Sunday late", order: 70 };
  return { id: "snf", label: "Sunday Night", order: 75 };
}

function byeWeeks(abbr) {
  if (!nflData) return [];
  const played = new Set();
  for (const g of nflData.games) {
    if (g.away === abbr || g.home === abbr) played.add(Number(g.week));
  }
  const byes = [];
  for (let w = 1; w <= 18; w++) if (!played.has(w)) byes.push(w);
  return byes;
}

function teamSeasonRows(abbr) {
  if (!nflData) return [];
  const a = normAbbr(abbr);
  const games = nflData.games.filter((g) => g.home === a || g.away === a);
  const byWeek = new Map();
  for (const g of games) byWeek.set(Number(g.week), g);
  const rows = [];
  for (let w = 1; w <= 18; w++) {
    const g = byWeek.get(w);
    if (!g) rows.push({ week: w, bye: true });
    else rows.push({ week: w, bye: false, game: g });
  }
  return rows;
}

/* ---------- teams library ---------- */

function filteredTeams() {
  if (!nflData) return [];
  let rows = nflData.teams.slice();
  if (teamConf) rows = rows.filter((t) => t.conf === teamConf);
  if (teamDiv) rows = rows.filter((t) => t.div === teamDiv);
  const rating = (t) => {
    const n = eff(t.abbr);
    return Number.isFinite(n) ? n : 0;
  };
  rows.sort((a, b) => {
    if (teamSort === "rating-desc") return rating(b) - rating(a) || a.name.localeCompare(b.name);
    if (teamSort === "rating-asc") return rating(a) - rating(b) || a.name.localeCompare(b.name);
    if (teamSort === "az") return a.name.localeCompare(b.name);
    if (teamSort === "conf") {
      return (a.conf || "").localeCompare(b.conf || "")
        || (a.div || "").localeCompare(b.div || "")
        || a.name.localeCompare(b.name);
    }
    return 0;
  });
  return rows;
}

function renderTeamFilters() {
  const el = document.getElementById("team-filters");
  if (!el) return;
  const chips = [
    { id: "ALL", kind: "all" },
    { id: "AFC", kind: "conf" },
    { id: "NFC", kind: "conf" },
    { id: "East", kind: "div" },
    { id: "North", kind: "div" },
    { id: "South", kind: "div" },
    { id: "West", kind: "div" },
  ];
  el.innerHTML = chips.map((c) => {
    let on = false;
    if (c.kind === "all") on = !teamConf && !teamDiv;
    if (c.kind === "conf") on = teamConf === c.id;
    if (c.kind === "div") on = teamDiv === c.id;
    return `<button type="button" data-chip="${c.id}" data-kind="${c.kind}" aria-pressed="${on}">${c.id}</button>`;
  }).join("");
}

function renderTeams() {
  renderTeamFilters();
  const grid = document.getElementById("team-grid");
  const empty = document.getElementById("team-grid-empty");
  if (!grid) return;
  if (!nflData || !nflData.teams.length) {
    grid.innerHTML = "";
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  const sortEl = document.getElementById("team-sort");
  if (sortEl && sortEl.value !== teamSort) sortEl.value = teamSort;
  const ranks = priorRankMap();
  grid.innerHTML = filteredTeams().map((t) => {
    const blend = eff(t.abbr);
    const p = getProfile(t.abbr);
    const ctxN = (p.context || []).length;
    const adj = num(p.user_adjust) || 0;
    const open = profileAbbr === t.abbr;
    const rank = ranks[t.abbr];
    const faN = faRaw(t.abbr);
    const draftN = draftRaw(t.abbr);
    const injN = injuryTerm(t.abbr);
    const extras = [
      rank ? `<span class="club-prior">PRIOR #${rank}</span>` : "",
      Math.abs(faN) >= 0.3 ? `<span class="club-fa ${rtgClass(faN)}">FA ${esc(fmtRtg(faN))}</span>` : "",
      Math.abs(draftN) >= 0.3 ? `<span class="club-draft ${rtgClass(draftN)}">DRFT ${esc(fmtRtg(draftN))}</span>` : "",
      Math.abs(maddenTerm(t.abbr)) >= 0.3 ? `<span class="club-madden ${rtgClass(maddenTerm(t.abbr))}">MAD ${esc(fmtRtg(maddenTerm(t.abbr)))}</span>` : "",
      Math.abs(sosTerm(t.abbr)) >= 0.3 ? `<span class="club-sos ${rtgClass(sosTerm(t.abbr))}">SOS ${esc(fmtRtg(sosTerm(t.abbr)))}</span>` : "",
      injN <= -0.3 ? `<span class="club-inj minus">INJ ${esc(fmtRtg(injN))}</span>` : "",
      adj ? `<span class="club-ctx">adj ${esc(fmtRtg(adj))}</span>` : "",
      ctxN ? `<span class="club-ctx">${ctxN} ctx</span>` : "",
    ].filter(Boolean).join("");
    return `<button type="button" class="club${open ? " is-open" : ""}" data-team="${esc(t.abbr)}">
      <img class="club-logo" src="${esc(t.logo)}" alt="" width="40" height="40">
      <span class="club-meta">
        <span class="club-abbr">${esc(t.abbr)}</span>
        <span class="club-name">${esc(t.name)}</span>
        <span class="club-div">${esc(t.conf)} ${esc(t.div)}</span>
      </span>
      <span class="club-rtg-wrap">
        <span class="club-rtg ${rtgClass(blend)}">${esc(fmtRtg(blend))}</span>
        ${extras}
      </span>
    </button>`;
  }).join("");
}

function teamSkedHtml(abbr) {
  const a = normAbbr(abbr);
  const rows = teamSeasonRows(a);
  const body = rows.map((r) => {
    if (r.bye) {
      return `<tr class="bye"><td class="num">${r.week}</td><td colspan="6">BYE</td></tr>`;
    }
    const g = r.game;
    const home = g.home === a;
    const ha = g.neutral ? "N" : home ? "H" : "A";
    const opp = home ? g.away : g.home;
    const mkt = marketFor(g);
    const mktStr = mkt.odds || "—";
    let our = "—";
    let edgeStr = "—";
    let edgeClass = "";
    if (hasOurNumber(g)) {
      const ourH = ourHomeSpread(g, hfa);
      our = formatOurLine(ourH, g.home, g.away);
      const edge = edgePts(ourH, mkt.parsed.homeLine);
      if (edge != null) {
        const keys = crossesKeys(ourH, mkt.parsed.homeLine);
        const fire = Math.abs(edge) >= 1.5 || keys.length;
        edgeClass = fire ? "edge-gold" : "";
        const side = edge >= 1.5 ? " HOME" : edge <= -1.5 ? " AWAY" : "";
        const keyNote = keys.length ? " key " + keys.join("/") : "";
        edgeStr = (edge > 0 ? "+" : edge < 0 ? "−" : "") + Math.abs(edge).toFixed(1) + side + keyNote;
      }
    }
    return `<tr>
      <td class="num">${g.week}</td>
      <td class="num">${ha}</td>
      <td><button type="button" class="abbr-link" data-team="${esc(opp)}">${esc(opp)}</button></td>
      <td>${esc(g.venue || "")}${g.city ? " · " + esc(g.city) : ""}</td>
      <td class="num">${esc(mktStr)}</td>
      <td class="num">${esc(our)}</td>
      <td class="num ${edgeClass}">${esc(edgeStr)}</td>
    </tr>`;
  }).join("");
  return `<table>
    <thead><tr><th>wk</th><th>h/a</th><th>opp</th><th>venue</th><th>market</th><th>ours</th><th>edge</th></tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

function pillarWeights() {
  const w = (priorData && priorData.weights) || { off: 0.3, def: 0.35, st: 0.1, take: 0.125, give: 0.125 };
  return w;
}

function pillarRanges() {
  return (priorData && priorData.ranges) || {
    off: { lo: -10, hi: 8 },
    def: { lo: -12, hi: 12 },
    st: { lo: -4, hi: 4 },
    take: { lo: -5, hi: 5 },
    give: { lo: -5, hi: 5 },
  };
}

function pillarRawLabel(key, raw) {
  if (!raw) return "";
  if (key === "off") return (num(raw.off_ppg) ?? "—") + " ppg";
  if (key === "def") return (num(raw.def_ppg) ?? "—") + " ppg allowed";
  if (key === "st") {
    const td = num(raw.st_ret_td);
    const fg = num(raw.st_fg_pct);
    const tdStr = td === null ? "—" : String(td);
    const fgStr = fg === null ? "—" : fg.toFixed(1);
    return tdStr + " ret TD · " + fgStr + " FG%";
  }
  if (key === "take") return (num(raw.takeaways) ?? "—") + " takeaways";
  if (key === "give") return (num(raw.giveaways) ?? "—") + " giveaways";
  return "";
}

function priorWeightCopy(abbr) {
  const { N, n, wPrior } = taperFor(abbr);
  const pct = Math.round(wPrior * 100);
  if (n === 0) return { games: "0/" + N + " games", line: "Week 1 · " + pct + "% last year" };
  return { games: n + "/" + N + " games", line: n + "/" + N + " · " + pct + "% last year" };
}

function priorBlockHtml(abbr) {
  const t = priorTeam(abbr);
  if (!t) {
    return `<div class="prior-block">
      <p class="prior-kicker">2025 prior · tapers off</p>
      <p class="prior-note">No 2025 prior loaded. Algorithm sits at 0. Serve this folder over http so prior-2025.json can load.</p>
    </div>`;
  }
  const ranges = pillarRanges();
  const wts = pillarWeights();
  const pillars = [
    { key: "off", label: "OFF" },
    { key: "def", label: "DEF" },
    { key: "st", label: "ST" },
    { key: "take", label: "TAKE" },
    { key: "give", label: "GIVE" },
  ];
  const rows = pillars.map((col) => {
    const val = num(t.pillars && t.pillars[col.key]) || 0;
    const rng = ranges[col.key] || { lo: -5, hi: 5 };
    const lo = rng.lo;
    const hi = rng.hi;
    const span = (hi - lo) || 1;
    const zero = ((0 - lo) / span) * 100;
    const at = Math.max(0, Math.min(100, ((val - lo) / span) * 100));
    const left = Math.min(zero, at);
    const width = Math.abs(at - zero);
    const cls = val > 0 ? "plus" : val < 0 ? "minus" : "zero";
    const raw = pillarRawLabel(col.key, t.raw);
    return `<div class="pillar">
      <div class="pillar-head">
        <span class="pillar-lab">${col.label}</span>
        <span class="pillar-val ${cls}">${esc(fmtRtg(val))}</span>
        <span class="pillar-raw">${esc(raw)}</span>
      </div>
      <div class="pillar-track" aria-hidden="true">
        <span class="pillar-zero" style="left:${zero.toFixed(2)}%"></span>
        <span class="pillar-fill ${cls}" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%"></span>
      </div>
    </div>`;
  }).join("");
  const prior = num(t.prior) || 0;
  const copy = priorWeightCopy(abbr);
  const wLine = "OFF " + (wts.off * 100) + "% · DEF " + (wts.def * 100) + "% · ST " + (wts.st * 100)
    + "% · TAKE " + (wts.take * 100) + "% · GIVE " + (wts.give * 100) + "%";
  return `<div class="prior-block">
    <p class="prior-kicker">2025 prior · tapers off</p>
    <div class="pillar-list">${rows}</div>
    <div class="prior-combo">
      <div class="prior-combo-num">
        <small>Combined PRIOR</small>
        <em class="${rtgClass(prior)}">${esc(fmtRtg(prior))}</em>
      </div>
      <div class="prior-combo-w">
        <small>${esc(copy.games)}</small>
        <span>${esc(copy.line)}</span>
      </div>
    </div>
    <p class="prior-note">Best D is +12, worst −12. Offense +8 / −10. Those stay visible. The number on the board is the weighted blend.</p>
    <p class="prior-wts">${esc(wLine)}</p>
  </div>`;
}

function faRowHtml(row, dir) {
  const move = dir === "in"
    ? (row.from ? "from " + row.from : "")
    : (row.to ? "to " + row.to : "");
  const meta = [row.pos, move, row.tier].filter(Boolean).join(" · ");
  return `<div class="fa-row">
      <span class="fa-row-who">
        <span class="fa-row-name">${esc(row.name || "")}</span>
        <span class="fa-row-meta">${esc(meta)}</span>
      </span>
      <span class="fa-row-pts ${rtgClass(row.pts)}">${esc(fmtRtg(row.pts))}</span>
      <span class="fa-row-note">${esc(row.note || "")}</span>
    </div>`;
}

function faBlockHtml(abbr) {
  const t = faTeam(abbr);
  const ins = (t && Array.isArray(t.in)) ? t.in : [];
  const outs = (t && Array.isArray(t.out)) ? t.out : [];
  if (!t || (!ins.length && !outs.length)) {
    return `<div class="fa-block">
      <p class="prior-kicker">2026 FA · fades with prior</p>
      <p class="prior-note">No 2026 FA rows loaded for this club.</p>
    </div>`;
  }
  const net = faRaw(abbr);
  const term = faTerm(abbr);
  const pct = Math.round(taperFor(abbr).wPrior * 100);
  const off = num(t.off) || 0;
  const def = num(t.def) || 0;
  const st = num(t.st) || 0;
  const inRows = ins.map((r) => faRowHtml(r, "in")).join("");
  const outRows = outs.map((r) => faRowHtml(r, "out")).join("");
  return `<div class="fa-block">
    <p class="prior-kicker">2026 FA · fades with prior</p>
    <div class="fa-units">
      <span class="fa-unit">OFF <em class="${rtgClass(off)}">${esc(fmtRtg(off))}</em></span>
      <span class="fa-unit">DEF <em class="${rtgClass(def)}">${esc(fmtRtg(def))}</em></span>
      <span class="fa-unit">ST <em class="${rtgClass(st)}">${esc(fmtRtg(st))}</em></span>
    </div>
    <div class="fa-net">
      <small>NET</small>
      <em class="${rtgClass(net)}">${esc(fmtRtg(net))}</em>
      <span class="fa-net-note">on the board ${esc(fmtRtg(term))} · ${pct}%</span>
    </div>
    <div class="fa-lists">
      <div class="fa-in">
        <p class="fa-list-kicker">IN</p>
        ${inRows || '<p class="fa-empty">None.</p>'}
      </div>
      <div class="fa-out">
        <p class="fa-list-kicker">OUT</p>
        ${outRows || '<p class="fa-empty">None.</p>'}
      </div>
    </div>
    <p class="prior-note">Surplus vs replacement. One player capped at 2. Team net capped at 4. Re-signs of 2025 players are 0. Draft is not FA.</p>
  </div>`;
}

function draftRowHtml(row) {
  const rd = row.round != null && row.round !== "" ? "R" + row.round : "";
  const pk = row.pick != null && row.pick !== "" ? "#" + row.pick : "";
  const pick = [rd, pk].filter(Boolean).join(" ");
  const meta = [row.pos, pick].filter(Boolean).join(" · ");
  return `<div class="fa-row">
      <span class="fa-row-who">
        <span class="fa-row-name">${esc(row.name || "")}</span>
        <span class="fa-row-meta">${esc(meta)}</span>
      </span>
      <span class="fa-row-pts ${rtgClass(row.pts)}">${esc(fmtRtg(row.pts))}</span>
      <span class="fa-row-note">${esc(row.note || "")}</span>
    </div>`;
}

function draftBlockHtml(abbr) {
  const t = draftTeam(abbr);
  const starters = (t && Array.isArray(t.starters)) ? t.starters : [];
  const net = draftRaw(abbr);
  const term = draftTerm(abbr);
  const pct = Math.round(draftFade(abbr) * 100);
  const list = starters.length
    ? starters.map(draftRowHtml).join("")
    : '<p class="fa-empty">No Week 1 starter rookies scored for this club.</p>';
  return `<div class="fa-block draft-block">
    <p class="prior-kicker">2026 draft · Week 1 starters · fades over 4 games</p>
    <div class="fa-net">
      <small>NET</small>
      <em class="${rtgClass(net)}">${esc(fmtRtg(net))}</em>
      <span class="fa-net-note">on the board ${esc(fmtRtg(term))} · ${pct}%</span>
    </div>
    ${list}
    <p class="prior-note">Starters only. Surplus vs replacement. Year-1 fade already in the points. Depth is 0. Not FA.</p>
  </div>`;
}

function maddenUnitHtml(rows, label) {
  const list = (rows || []).map((row) => `<div class="fa-row">
      <span class="fa-row-who">
        <span class="fa-row-name">${esc(row.name || "")}</span>
        <span class="fa-row-meta">${esc(row.pos || "")}</span>
      </span>
      <span class="fa-row-pts">${esc(row.ovr != null ? Number(row.ovr).toFixed(0) : "")}</span>
    </div>`).join("");
  return `<div class="fa-in">
      <p class="fa-list-kicker">${esc(label)}</p>
      ${list || '<p class="fa-empty">None.</p>'}
    </div>`;
}

function maddenBlockHtml(abbr) {
  const t = maddenTeam(abbr);
  const net = maddenTerm(abbr);
  const ovr = t && t.ovr != null ? t.ovr : "—";
  const n = t && t.n != null ? t.n : 0;
  return `<div class="fa-block madden-block">
    <p class="prior-kicker">Madden 27 · same 22 (11 OFF + 11 DEF)</p>
    <div class="fa-net">
      <small>NET</small>
      <em class="${rtgClass(net)}">${esc(fmtRtg(net))}</em>
      <span class="fa-net-note">unit OVR ${esc(String(ovr))} · n=${esc(String(n))}</span>
    </div>
    <div class="fa-lists">
      ${maddenUnitHtml(t && t.off, "OFF")}
      ${maddenUnitHtml(t && t.def, "DEF")}
    </div>
    <p class="prior-note">Equal count. Top 11 per side by OVR. Kickers out. 4 OVR ≈ 1 point vs league mean, cap ±2. Launch snapshot. Not FA.</p>
  </div>`;
}

function injurySelectOptions(keys, selected) {
  const list = keys.slice();
  if (selected && !list.includes(selected)) list.push(selected);
  return list.map((k) => `<option value="${esc(k)}"${k === selected ? " selected" : ""}>${esc(k)}</option>`).join("");
}

function injRowHtml(row) {
  const posOpts = injurySelectOptions(injuryPosKeys(), row.pos);
  const stOpts = injurySelectOptions(injuryStatusKeys(), row.status);
  return `<div class="inj-row" data-inj="${esc(row.id)}">
      <input type="text" data-inj-name="${esc(row.id)}" value="${esc(row.name)}" placeholder="Name" autocomplete="off">
      <select data-inj-pos="${esc(row.id)}" aria-label="Position">${posOpts}</select>
      <select data-inj-status="${esc(row.id)}" aria-label="Status">${stOpts}</select>
      <input type="number" class="mono" step="0.01" data-inj-pts="${esc(row.id)}" value="${esc(row.pts)}" aria-label="Injury points">
      <input type="checkbox" class="ctx-on" data-inj-on="${esc(row.id)}" ${row.on ? "checked" : ""} aria-label="Injury on">
      <button type="button" class="ctx-del" data-inj-del="${esc(row.id)}" aria-label="Delete injury">×</button>
    </div>`;
}

function injBlockHtml(abbr) {
  const p = getProfile(abbr);
  const term = injuryTerm(abbr);
  const rows = (p.injuries || []).map(injRowHtml).join("");
  return `<div class="inj-block">
    <p class="prior-kicker">Injury · weekly · official status</p>
    <div class="inj-net">
      <small>NET</small>
      <em id="tp-inj-net" class="${rtgClass(term)}">${esc(fmtRtg(term))}</em>
    </div>
    <div class="inj-list" id="tp-inj">${rows || '<p class="fa-empty">No official injury rows.</p>'}</div>
    <button type="button" class="btn inj-add" id="tp-inj-add">Add injury</button>
    <p class="prior-note">A starter out is a number. Questionable is 35%. Wait for Wednesday/Friday status. Does not rewrite last year.</p>
  </div>`;
}

function renderTeamSheet() {
  const ident = document.getElementById("team-sheet-ident");
  const body = document.getElementById("team-sheet-body");
  const team = teamByAbbr(profileAbbr);
  if (!ident || !body || !team) return;
  const p = getProfile(team.abbr);
  const e = eff(team.abbr);
  ident.innerHTML = `
    <img src="${esc(team.logo)}" alt="" width="48" height="48">
    <div>
      <h2 id="team-sheet-title">${esc(team.name)}</h2>
      <p>${esc(team.abbr)} · ${esc(team.conf)} ${esc(team.div)}</p>
      ${coachName(team.abbr) ? `<p class="team-hc">2026 HC: ${esc(coachName(team.abbr))}</p>${prepSheetLines(team.abbr)}${atsSheetLine(team.abbr)}` : ""}
    </div>`;
  const ctxRows = (p.context || []).map((c) => `
    <div class="ctx-row" data-ctx="${esc(c.id)}">
      <input type="text" data-ctx-text="${esc(c.id)}" value="${esc(c.text)}" placeholder="QB questionable −1.5">
      <input type="number" class="mono" step="0.5" data-ctx-pts="${esc(c.id)}" value="${esc(c.pts)}">
      <input type="checkbox" class="ctx-on" data-ctx-on="${esc(c.id)}" ${c.on ? "checked" : ""} aria-label="Context on">
      <button type="button" class="ctx-del" data-ctx-del="${esc(c.id)}" aria-label="Delete context">×</button>
    </div>`).join("");
  const algo = algorithmBase(team.abbr);
  const adj = num(p.user_adjust) || 0;
  const ctx = contextSum(p);
  const fa = faTerm(team.abbr);
  const draft = draftTerm(team.abbr);
  body.innerHTML = `
    ${priorBlockHtml(team.abbr)}
    ${faBlockHtml(team.abbr)}
    ${draftBlockHtml(team.abbr)}
    ${maddenBlockHtml(team.abbr)}
    ${injBlockHtml(team.abbr)}
    ${schemeBlockHtml(team.abbr)}
    <div class="tp-eff-row">
      <label class="field" style="margin:0">
        <span>Adjust</span>
        <div class="tp-stepper">
          <button type="button" id="tp-adjust-minus" aria-label="Decrease adjust">−</button>
          <input id="tp-adjust" class="mono" type="number" step="0.5" value="${esc(adj)}" inputmode="decimal">
          <button type="button" id="tp-adjust-plus" aria-label="Increase adjust">+</button>
        </div>
      </label>
      <div class="tp-eff-chip">
        <small>Effective</small>
        <em id="tp-eff" class="${rtgClass(e)}">${esc(fmtRtg(e))}</em>
      </div>
    </div>
    <label class="field">
      <span>Why this override</span>
      <input id="tp-adjust-why" type="text" placeholder="Say why. It gets a timestamp." autocomplete="off">
    </label>
    <div id="tp-adjust-log" class="adjust-log-wrap">${adjustLogHtml(team.abbr)}</div>
    <p class="tp-eff-break" id="tp-eff-break">Effective = algorithm ${esc(fmtRtg(algo))} + FA ${esc(fmtRtg(fa))} + draft ${esc(fmtRtg(draft))} + madden ${esc(fmtRtg(maddenTerm(team.abbr)))} + SOS ${esc(fmtRtg(sosTerm(team.abbr)))} + injury ${esc(fmtRtg(injuryTerm(team.abbr)))} + adjust ${esc(fmtRtg(adj))} + context ${esc(fmtRtg(ctx))}</p>
    <label class="field">
      <span>Context stack</span>
    </label>
    <div class="ctx-list" id="tp-ctx">${ctxRows || '<p class="table-empty" style="margin:0 0 8px">No context yet. Add a row and give it points.</p>'}</div>
    <button type="button" class="btn ctx-add" id="tp-ctx-add">Add context</button>
    <label class="field">
      <span>Notes</span>
      <textarea id="tp-notes" rows="4" placeholder="Scheme, injuries, 90/10 update. Not the jersey.">${esc(p.notes)}</textarea>
    </label>
    <div class="tp-sked">
      <p class="section-label">2026 schedule</p>
      <div id="tp-sked">${teamSkedHtml(team.abbr)}</div>
    </div>`;
}

function refreshTeamDerived() {
  if (!profileAbbr) return;
  const e = eff(profileAbbr);
  const p = getProfile(profileAbbr);
  const chip = document.getElementById("tp-eff");
  if (chip) {
    chip.textContent = fmtRtg(e);
    chip.className = rtgClass(e);
  }
  const br = document.getElementById("tp-eff-break");
  if (br) {
    br.textContent = "Effective = algorithm " + fmtRtg(algorithmBase(profileAbbr))
      + " + FA " + fmtRtg(faTerm(profileAbbr))
      + " + draft " + fmtRtg(draftTerm(profileAbbr))
      + " + madden " + fmtRtg(maddenTerm(profileAbbr))
      + " + SOS " + fmtRtg(sosTerm(profileAbbr))
      + " + injury " + fmtRtg(injuryTerm(profileAbbr))
      + " + adjust " + fmtRtg(num(p.user_adjust) || 0)
      + " + context " + fmtRtg(contextSum(p));
  }
  const injChip = document.getElementById("tp-inj-net");
  if (injChip) {
    const term = injuryTerm(profileAbbr);
    injChip.textContent = fmtRtg(term);
    injChip.className = rtgClass(term);
  }
  const sked = document.getElementById("tp-sked");
  if (sked) sked.innerHTML = teamSkedHtml(profileAbbr);
  renderTeams();
  renderSchedule();
}

function openTeamProfile(abbr) {
  const team = teamByAbbr(abbr);
  if (!team) {
    toast("No club " + abbr + " in the 2026 library.");
    return;
  }
  lastFocus = document.activeElement;
  profileAbbr = team.abbr;
  pendingTeam = null;
  if (gameSheetId) closeGameSheet({ silent: true });
  const ticketSheet = document.getElementById("sheet");
  if (ticketSheet && !ticketSheet.hidden) {
    ticketSheet.hidden = true;
  }
  renderTeamSheet();
  const sheet = document.getElementById("team-sheet");
  document.getElementById("overlay").hidden = false;
  if (sheet) {
    sheet.hidden = false;
    sheet.scrollTop = 0;
  }
  const body = document.getElementById("team-sheet-body");
  if (body) body.scrollTop = 0;
  const closer = document.getElementById("team-sheet-close");
  if (closer) closer.focus();
  requestAnimationFrame(() => {
    if (sheet) sheet.scrollTop = 0;
    if (body) body.scrollTop = 0;
  });
  renderTeams();
}

function closeTeamSheet(opts = {}) {
  commitAdjustLog();
  const sheet = document.getElementById("team-sheet");
  if (sheet) sheet.hidden = true;
  profileAbbr = null;
  hideOverlayIfIdle();
  if (!opts.silent) {
    const raw = (location.hash || "").replace("#", "");
    if (raw.startsWith("team-") || raw.startsWith("team?") || raw.startsWith("teams?")) {
      const active = document.querySelector(".view.is-active");
      const view = (active && active.dataset.view) || "teams";
      const dest = (view === "schedule" || view === "teams") ? view : "teams";
      if (location.hash !== "#" + dest) history.replaceState(null, "", "#" + dest);
    }
  }
  renderTeams();
  if (lastFocus && lastFocus.focus) {
    try { lastFocus.focus(); } catch { /* ignore */ }
  }
}

function hideOverlayIfIdle() {
  const ticket = document.getElementById("sheet");
  const team = document.getElementById("team-sheet");
  const game = document.getElementById("game-sheet");
  if ((!ticket || ticket.hidden) && (!team || team.hidden) && (!game || game.hidden)) {
    const overlay = document.getElementById("overlay");
    if (overlay) overlay.hidden = true;
  }
}

function gameById(id) {
  if (!nflData || !Array.isArray(nflData.games)) return null;
  return nflData.games.find((g) => String(g.id) === String(id)) || null;
}

function fmtLayer(n) {
  const x = Number(n);
  const v = Number.isFinite(x) ? x : 0;
  if (v === 0) return "0.00";
  return (v > 0 ? "+" : "−") + Math.abs(v).toFixed(2);
}

function fmtEdgeNum(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n === 0) return "0.0";
  return (n > 0 ? "+" : "−") + Math.abs(n).toFixed(1);
}

function marketFavLabel(parsed) {
  if (!parsed || parsed.fav == null || parsed.pts == null) return null;
  if (parsed.pts === 0) return parsed.fav + " PK";
  return parsed.fav + " −" + Number(parsed.pts).toFixed(1);
}

function gameLeadCopy(game) {
  if (!hasOurNumber(game)) {
    return "We do not have a number yet. The ratings are still even.";
  }
  const mkt = marketFor(game);
  const parsed = mkt.parsed || {};
  const ourH = ourHomeSpread(game, hfa);
  const ourLabel = formatOurLine(ourH, game.home, game.away);
  const mktLabel = marketFavLabel(parsed);
  const marketHome = parsed.homeLine;
  const parts = [];
  if (ourH != null && Number.isFinite(ourH)) {
    parts.push("We think the gap is " + ourLabel + ".");
  }
  if (mktLabel && marketHome != null && Number.isFinite(marketHome)) {
    parts.push("The sportsbook has " + mktLabel + ".");
  } else if (mkt.odds) {
    parts.push("The sportsbook number is " + String(mkt.odds) + ".");
  } else {
    parts.push("No sportsbook number yet.");
  }
  const edge = edgePts(ourH, marketHome);
  if (edge != null) {
    if (edge === 0) parts.push("We agree with the sportsbook.");
    else parts.push("We disagree by " + Math.abs(edge).toFixed(1) + " points.");
    const mktFav = parsed.fav;
    const ourFav = ourH < 0 ? game.home : ourH > 0 ? game.away : null;
    if (mktFav && ourFav && normAbbr(mktFav) !== normAbbr(ourFav)) {
      parts.push("We even flipped who the favorite is.");
    }
    parts.push("Copper means that gap is big enough to look at — not an automatic bet.");
  }
  return parts.join(" ");
}

function coachSheetNote(game) {
  const homeC = coachName(game.home);
  const awayC = coachName(game.away);
  const names = [homeC, awayC].filter(Boolean).join(" vs ");
  const pair = coachPair(game.home, game.away);
  const bits = [];
  if (names) bits.push(names);
  if (pair) {
    const n = num(pair.n) ?? ((num(pair.a_wins) || 0) + (num(pair.b_wins) || 0));
    const { min_n } = coachScoring();
    if (n < min_n) bits.push("n=" + n);
    else if (coachTerm(game) === 0) bits.push("dead");
  } else if (names) {
    bits.push("no pair");
  }
  return bits.join(" · ");
}

function prepSheetNote(game) {
  const w = Number(game.week);
  const bits = [];
  if (w === 1) bits.push("Week 1");
  if (clubOffBye(game.home, w) || clubOffBye(game.away, w)) bits.push("bye");
  if (!bits.length) bits.push("no prep this week");
  if (prepNet(game) === 0 && bits[0] !== "no prep this week") bits.push("dead");
  return bits.join(" / ");
}

function renderGameSheet() {
  const ident = document.getElementById("game-sheet-ident");
  const body = document.getElementById("game-sheet-body");
  const game = gameById(gameSheetId);
  if (!ident || !body) return;
  if (!game) {
    ident.innerHTML = `<div><h2 id="game-sheet-title">Game</h2></div>`;
    body.innerHTML = `<p class="game-sheet-lead">That game is not on the loaded slate.</p>`;
    return;
  }
  const et = toET(game.date);
  const kick = et ? (et.label + " · " + et.clock + " ET") : "";
  const venue = [game.venue, game.city].filter(Boolean).join(" · ");
  ident.innerHTML = `
    <div>
      <h2 id="game-sheet-title">${esc(game.away)} @ ${esc(game.home)}</h2>
      <p>${esc(kick || "Kick TBA")}</p>
      ${venue || game.neutral ? `<p class="game-sheet-venue">${esc(venue || "Neutral site")}</p>` : ""}
    </div>`;

  const away = game.away;
  const home = game.home;
  const pA = getProfile(away);
  const pH = getProfile(home);
  const clubRows = [
    ["Last year", algorithmBase(away), algorithmBase(home)],
    ["Roster changes", faTerm(away), faTerm(home)],
    ["Rookies", draftTerm(away), draftTerm(home)],
    ["Madden 22", maddenTerm(away), maddenTerm(home)],
    ["Last year SOS", sosTerm(away), sosTerm(home)],
    ["Injuries", injuryTerm(away), injuryTerm(home)],
    ["Manual", num(pA.user_adjust) || 0, num(pH.user_adjust) || 0],
    ["Extra notes", contextSum(pA), contextSum(pH)],
    ["Our rating", eff(away), eff(home)],
  ];
  const table = clubRows.map((r, i) => {
    const cls = i === clubRows.length - 1 ? " is-eff" : "";
    return `<tr class="${cls}">
      <th scope="row">${esc(r[0])}</th>
      <td class="num ${rtgClass(r[1])}">${esc(fmtRtg(r[1]))}</td>
      <td class="num ${rtgClass(r[2])}">${esc(fmtRtg(r[2]))}</td>
    </tr>`;
  }).join("");

  const homeE = eff(home);
  const awayE = eff(away);
  const diff = homeE - awayE;
  const hfaUsed = game.neutral ? 0 : hfa;
  const coach = coachTerm(game);
  const prep = prepNet(game);
  const ats = atsNet(game);
  const sched = schedNet(game);
  const gap = diff + hfaUsed + coach + prep + ats + sched;
  const ourLine = ourHomeSpread(game, hfa);
  const mkt = marketFor(game);
  const marketHome = mkt.parsed && mkt.parsed.homeLine;
  const edge = hasOurNumber(game) ? edgePts(ourLine, marketHome) : null;
  const keys = (hasOurNumber(game) && ourLine != null && marketHome != null)
    ? crossesKeys(ourLine, marketHome) : [];
  const fire = edge != null && (Math.abs(edge) >= 1.5 || keys.length > 0);
  const hfaNote = game.neutral ? "neutral / Melbourne · 0" : "";

  const stack = [
    { label: "Home rating minus away", val: diff, note: "" },
    { label: "+ home field", val: hfaUsed, note: hfaNote },
    { label: "+ coaches", val: coach, note: coachSheetNote(game) },
    { label: "+ week 1 / bye", val: prep, note: prepSheetNote(game) },
    { label: "+ vs the spread (career)", val: ats, note: atsSheetNote(game) },
    { label: "+ travel / trap / rest", val: sched, note: schedSheetNote(game) },
    { label: "Combined gap", val: gap, note: "add those up", sum: true },
    { label: "Our line (flip the sign)", val: hasOurNumber(game) ? ourLine : 0, note: hasOurNumber(game) ? "" : "ratings even · no number", hideVal: !hasOurNumber(game) },
  ];
  const stackHtml = stack.map((s) => `
    <div class="game-stack-row${s.sum ? " is-sum" : ""}">
      <span class="game-stack-label">${esc(s.label)}${s.note ? `<small>${esc(s.note)}</small>` : ""}</span>
      <span class="game-stack-val mono ${s.hideVal ? "zero" : rtgClass(s.val)}">${esc(s.hideVal ? "—" : fmtLayer(s.val))}</span>
    </div>`).join("");

  let compare = "";
  if (hasOurNumber(game)) {
    const side = edge != null && edge < 0 ? " · away" : edge != null && edge > 0 ? " · home" : "";
    compare = `<div class="game-compare">
      <div class="game-stack-row">
        <span class="game-stack-label">Sportsbook</span>
        <span class="game-stack-val mono">${esc(marketHome == null ? "—" : fmtSpreadNum(marketHome))}</span>
      </div>
      <div class="game-stack-row">
        <span class="game-stack-label">Our line</span>
        <span class="game-stack-val mono">${esc(fmtSpreadNum(ourLine))}</span>
      </div>
      <div class="game-stack-row">
        <span class="game-stack-label">In English</span>
        <span class="game-stack-val mono">${esc(formatOurLine(ourLine, home, away))}</span>
      </div>
      <div class="game-stack-row${fire ? " is-copper" : ""}">
        <span class="game-stack-label">We disagree${side}</span>
        <span class="game-stack-val mono">${esc(fmtEdgeNum(edge))}</span>
      </div>
      <p class="game-sheet-keys">${keys.length ? "This sits on opposite sides of " + keys.join(" / ") + "." : "This does not sit on opposite sides of 3 or 7."} Copper is a look, not a ticket.</p>
    </div>`;
  } else {
    compare = `<p class="game-sheet-none">Ratings are even. We do not post a number yet.</p>`;
  }

  const tot = ourTotal(game);
  const totE = totalEdge(game, mkt);
  const mktOu = num(mkt.ou);
  let totHtml = "";
  if (tot != null || mktOu != null) {
    totHtml = `<p class="game-sheet-total">`;
    if (tot != null && mktOu != null) {
      totHtml += `OUR O/U ${tot.toFixed(1)} vs market ${mktOu.toFixed(1)}`;
      if (totE != null) totHtml += ` · edge ${fmtEdgeNum(totE)}`;
      totHtml += ".";
    } else if (tot != null) {
      totHtml += `OUR O/U ${tot.toFixed(1)}. No market total.`;
    } else {
      totHtml += `Market total ${mktOu.toFixed(1)}. No OUR O/U.`;
    }
    totHtml += `</p>`;
  }

  body.innerHTML = `
    <p class="game-sheet-lead">${esc(gameLeadCopy(game))}</p>
    <p class="section-label">How we built the number</p>
    <div class="table-wrap">
      <table class="game-club-table">
        <thead><tr><th></th><th>Away · ${esc(away)}</th><th>Home · ${esc(home)}</th></tr></thead>
        <tbody>${table}</tbody>
      </table>
    </div>
    <div class="game-stack">${stackHtml}</div>
    ${compare}
    ${totHtml}`;
}

function openGameSheet(id, opts = {}) {
  const game = gameById(id);
  if (!game && nflData && nflData.games && nflData.games.length) {
    toast("No game " + id + " on the 2026 slate.");
    return;
  }
  if (!game) {
    pendingGame = id;
    return;
  }
  lastFocus = document.activeElement;
  gameSheetId = String(game.id);
  pendingGame = null;
  const ticketSheet = document.getElementById("sheet");
  if (ticketSheet && !ticketSheet.hidden) ticketSheet.hidden = true;
  if (profileAbbr) closeTeamSheet({ silent: true });
  if (Number(game.week) !== Number(currentWeek)) {
    currentWeek = Number(game.week);
    const weekEl = document.getElementById("week-select");
    if (weekEl) weekEl.value = currentWeek;
    renderSchedule();
  }
  renderGameSheet();
  const sheet = document.getElementById("game-sheet");
  const overlay = document.getElementById("overlay");
  if (sheet) sheet.hidden = false;
  if (overlay) overlay.hidden = false;
  const closer = document.getElementById("game-sheet-close");
  if (closer) closer.focus();
  if (!opts.silent && location.hash !== "#game-" + gameSheetId) {
    history.replaceState(null, "", "#game-" + gameSheetId);
  }
}

function closeGameSheet(opts = {}) {
  const sheet = document.getElementById("game-sheet");
  if (sheet) sheet.hidden = true;
  gameSheetId = null;
  hideOverlayIfIdle();
  if (!opts.silent) {
    const raw = (location.hash || "").replace("#", "");
    if (raw.toLowerCase().startsWith("game-")) {
      if (location.hash !== "#schedule") history.replaceState(null, "", "#schedule");
    }
  }
  if (lastFocus && lastFocus.focus) {
    try { lastFocus.focus(); } catch { /* ignore */ }
  }
}


/* ---------- weather (totals only) ----------
   Dome / closed roof = 0. Spread weather stays 0. Do not seed forecasts.
   wx_total is 0 or negative. OUR O/U is the totals model + wx, not market + wx. */
function venueRoofMap() {
  const map = {};
  const add = (list, roof) => {
    for (const name of (list || [])) map[name] = roof;
  };
  const v = weatherScale && weatherScale.venues;
  if (v) {
    add(v.dome, "DOME");
    add(v.retract, "RETRACT");
    add(v.open, "OPEN");
    return map;
  }
  add(["Ford Field", "Caesars Superdome", "Allegiant Stadium", "U.S. Bank Stadium"], "DOME");
  add(["AT&T Stadium", "Mercedes-Benz Stadium", "NRG Stadium", "Lucas Oil Stadium", "State Farm Stadium"], "RETRACT");
  add(["SoFi Stadium", "Tottenham Hotspur Stadium", "Wembley Stadium", "Melbourne Cricket Ground"], "OPEN");
  return map;
}

function defaultRoof(game) {
  if (!game) return "";
  if (game.indoor === true || game.dome === true) return "DOME";
  const raw = String(game.roof || "").toUpperCase();
  if (raw === "DOME" || raw === "CLOSED") return "DOME";
  if (raw === "RETRACT" || raw === "RETRACTABLE") return "RETRACT";
  if (raw === "OPEN") return "OPEN";
  const venue = String(game.venue || "");
  const mapped = venueRoofMap()[venue];
  if (mapped) return mapped;
  if (/dome/i.test(venue)) return "DOME";
  if ((game.country || "") === "USA" && venue) return "OPEN";
  return "";
}

function getWx(game) {
  const stored = game && weatherByGame[game.id];
  const base = { ...emptyWx(), ...(stored && typeof stored === "object" ? stored : {}) };
  if (!base.roof) base.roof = defaultRoof(game);
  return base;
}

function wxWindPts(wind) {
  const w = num(wind);
  if (w === null) return 0;
  const bands = weatherScale && Array.isArray(weatherScale.wind) ? weatherScale.wind : null;
  if (bands) {
    for (const b of bands) {
      if (b.lt != null && w < b.lt) return num(b.pts) ?? 0;
      if (b.lo != null && b.hi != null && w >= b.lo && w <= b.hi) return num(b.pts) ?? 0;
      if (b.gte != null && w >= b.gte) return num(b.pts) ?? 0;
    }
  }
  if (w < 12) return 0;
  if (w <= 15) return -1.0;
  if (w <= 19) return -2.5;
  if (w <= 24) return -4.0;
  return -5.5;
}

function wxPrecipPts(precip) {
  const key = String(precip || "").toLowerCase();
  const table = weatherScale && weatherScale.precip;
  if (table && Object.prototype.hasOwnProperty.call(table, key)) {
    return num(table[key]) ?? 0;
  }
  if (key === "light") return -0.5;
  if (key === "rain") return -1.0;
  if (key === "snow") return -1.5;
  return 0;
}

function wxColdPts(temp) {
  const t = num(temp);
  if (t === null) return 0;
  const cut = (weatherScale && weatherScale.cold && num(weatherScale.cold.temp_f_lt)) ?? 15;
  const pts = (weatherScale && weatherScale.cold && num(weatherScale.cold.pts)) ?? -1.0;
  return t < cut ? pts : 0;
}

function wxTotal(wx) {
  const roof = String((wx && wx.roof) || "").toUpperCase();
  if (roof === "DOME" || roof === "CLOSED") return 0;
  const raw = wxWindPts(wx && wx.wind) + wxPrecipPts(wx && wx.precip) + wxColdPts(wx && wx.temp);
  const lo = (weatherScale && weatherScale.clamp && num(weatherScale.clamp.lo)) ?? -7;
  const hi = (weatherScale && weatherScale.clamp && num(weatherScale.clamp.hi)) ?? 0;
  return Math.max(lo, Math.min(hi, raw));
}

function fmtWx(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  const sign = n < 0 ? "−" : "+";
  return sign + Math.abs(n).toFixed(1);
}

function wxSelectOpts(keys, selected) {
  return keys.map((k) => {
    const label = k === "" ? "—" : k;
    return `<option value="${esc(k)}"${k === selected ? " selected" : ""}>${esc(label)}</option>`;
  }).join("");
}

function wxStripHtml(game, mkt) {
  const wx = getWx(game);
  const total = wxTotal(wx);
  const gold = Math.abs(total) >= 2.5;
  const ourOu = ourTotal(game);
  const tEdge = totalEdge(game, mkt);
  const edgeGold = tEdge != null && Math.abs(tEdge) >= 1.5;
  const roofOpts = wxSelectOpts(["", "OPEN", "DOME", "CLOSED", "RETRACT"], wx.roof || "");
  const precipOpts = wxSelectOpts(["", "none", "light", "rain", "snow"], wx.precip || "");
  const windVal = wx.wind === "" || wx.wind == null ? "" : wx.wind;
  const tempVal = wx.temp === "" || wx.temp == null ? "" : wx.temp;
  const ourHtml = ourOu === null
    ? ""
    : tip(`<span class="wx-our${edgeGold ? " gold" : ""}">OUR O/U ${esc(Number(ourOu).toFixed(1))}</span>`, SKED_TIPS.ourOu);
  const edgeHtml = tEdge == null
    ? ""
    : tip(`<span class="wx-edge${edgeGold ? " gold" : ""}">TOT EDGE ${esc((tEdge > 0 ? "+" : tEdge < 0 ? "−" : "") + Math.abs(tEdge).toFixed(1))}</span>`, SKED_TIPS.totEdge);
  return `<div class="wx-strip">
    <label>Roof <select class="mono" data-wx="${esc(game.id)}" data-wx-field="roof" aria-label="Roof">${roofOpts}</select></label>
    <label>Wind <input class="mono" type="number" min="0" step="1" data-wx="${esc(game.id)}" data-wx-field="wind" value="${esc(windVal)}" placeholder="mph" aria-label="Wind mph"></label>
    <label>Temp <input class="mono" type="number" step="1" data-wx="${esc(game.id)}" data-wx-field="temp" value="${esc(tempVal)}" placeholder="°F" aria-label="Temp F"></label>
    <label>Precip <select class="mono" data-wx="${esc(game.id)}" data-wx-field="precip" aria-label="Precip">${precipOpts}</select></label>
    <div class="wx-chips">
      ${tip(`<span class="wx-chip${gold ? " gold" : ""}">WX ${esc(fmtWx(total))}</span>`, SKED_TIPS.wx)}
      ${ourHtml}
      ${edgeHtml}
    </div>
  </div>`;
}

/* ---------- totals model (ppg + weather) ----------
   our_total = 0.5*(home.off_ppg + away.def_ppg) + 0.5*(away.off_ppg + home.def_ppg) + wx_total
   ppg from prior-2025 raw. If scored 2026 games exist later, blend like the prior taper.
   n=0 today → 100% 2025. wx_total already exists (0 if empty). Spread weather stays 0.
   OUR O/U is this number, not market + wx. Totals edge = market_ou - our_total
   (positive = we are under the street). Gold if |edge| ≥ 1.5. */
function unitProb(n) {
  const x = num(n);
  if (x === null) return null;
  if (Math.abs(x) > 1) return x / 100;
  return x;
}

function gameScores(g) {
  if (!g) return null;
  const home = num(
    g.home_score ?? g.homeScore ?? (g.score && (g.score.home ?? g.score.home_score))
      ?? (g.result && (g.result.home ?? g.result.home_score))
  );
  const away = num(
    g.away_score ?? g.awayScore ?? (g.score && (g.score.away ?? g.score.away_score))
      ?? (g.result && (g.result.away ?? g.result.away_score))
  );
  if (home === null || away === null) return null;
  return { home, away, margin: home - away };
}

function scoredGames2026(abbr) {
  if (!nflData || !Array.isArray(nflData.games)) return [];
  const a = normAbbr(abbr);
  const out = [];
  for (const g of nflData.games) {
    const w = Number(g.week);
    if (!Number.isFinite(w) || w < 1 || w > 18) continue;
    if (g.home !== a && g.away !== a) continue;
    const sc = gameScores(g);
    if (!sc) continue;
    out.push({ game: g, scores: sc, ptsFor: g.home === a ? sc.home : sc.away, ptsAgainst: g.home === a ? sc.away : sc.home });
  }
  return out;
}

function currentPpg(abbr, kind) {
  const rows = scoredGames2026(abbr);
  if (!rows.length) return null;
  const key = kind === "def" ? "ptsAgainst" : "ptsFor";
  return rows.reduce((s, r) => s + r[key], 0) / rows.length;
}

function blendedPpg(abbr, kind) {
  const t = priorTeam(abbr);
  const prior = t && t.raw ? num(kind === "def" ? t.raw.def_ppg : t.raw.off_ppg) : null;
  const curr = currentPpg(abbr, kind);
  const scored = scoredGames2026(abbr).length;
  if (scored <= 0 || curr === null) return prior;
  const N = taperN();
  const n = Math.min(scored, N);
  const wPrior = (N - n) / N;
  const wCurr = n / N;
  if (prior === null) return curr;
  return wPrior * prior + wCurr * curr;
}

function ourTotal(game) {
  if (!game) return null;
  const homeOff = blendedPpg(game.home, "off");
  const homeDef = blendedPpg(game.home, "def");
  const awayOff = blendedPpg(game.away, "off");
  const awayDef = blendedPpg(game.away, "def");
  if (homeOff === null || homeDef === null || awayOff === null || awayDef === null) return null;
  const wx = wxTotal(getWx(game));
  return 0.5 * (homeOff + awayDef) + 0.5 * (awayOff + homeDef) + wx;
}

function totalEdge(game, mkt) {
  const ours = ourTotal(game);
  const market = num(mkt && mkt.ou);
  if (ours === null || market === null) return null;
  return market - ours;
}

function isRegGame(g) {
  if (!g) return false;
  const t = String(g.season_type || g.seasontype || g.seasonType || g.type || "").toUpperCase();
  if (t === "PRE" || t === "PRESEASON" || t === "POST" || t === "POSTSEASON" || t === "PRO") return false;
  if (t && t !== "REG" && t !== "REGULAR" && t !== "REGULAR_SEASON") return false;
  const w = Number(g.week);
  return Number.isFinite(w) && w >= 1 && w <= 18;
}

function regGames() {
  if (!nflData || !Array.isArray(nflData.games)) return [];
  return nflData.games.filter(isRegGame);
}

/* ---------- keys / coverProb ---------- */
function keysRoot() {
  if (!keysData || typeof keysData !== "object") return null;
  return keysData;
}

function keysLand() {
  const root = keysRoot();
  if (!root) return null;
  const raw = root.land || root.land_rates || root.landRates || root.lands || root.keys;
  if (!raw) return null;
  const out = {};
  const take = (k, v) => {
    const kk = num(k);
    const rate = unitProb(typeof v === "object" && v ? (v.rate ?? v.pct ?? v.p ?? v.land) : v);
    if (kk !== null && rate !== null) out[kk] = rate;
  };
  if (Array.isArray(raw)) {
    for (const row of raw) {
      if (!row) continue;
      take(row.key ?? row.n ?? row.points ?? row.margin ?? row.land, row);
    }
  } else {
    for (const [k, v] of Object.entries(raw)) take(k, v);
  }
  return Object.keys(out).length ? out : null;
}

function keysPointValue() {
  const root = keysRoot();
  if (!root) return null;
  const raw = root.point_value || root.pointValue || root.point_values || root.cents;
  if (!raw) return null;
  const out = {};
  const take = (k, v) => {
    const kk = num(k);
    const val = num(typeof v === "object" && v ? (v.value ?? v.pts ?? v.cents ?? v.p) : v);
    if (kk !== null && val !== null) out[kk] = val;
  };
  if (Array.isArray(raw)) {
    for (const row of raw) {
      if (!row) continue;
      take(row.key ?? row.n ?? row.around ?? row.points, row);
    }
  } else {
    for (const [k, v] of Object.entries(raw)) take(k, v);
  }
  return Object.keys(out).length ? out : null;
}

function keysCoverTable() {
  const root = keysRoot();
  if (!root) return null;
  const raw = root.by_line || root.cover || root.covers || root.cover_table || root.lines || root.cover_by_line;
  if (!raw) return null;
  const map = new Map();
  const take = (line, row) => {
    const L = num(line);
    if (L === null || !row || typeof row !== "object") return;
    const hc = unitProb(row.home_cover ?? row.homeCover ?? row.home ?? row.cover);
    const push = unitProb(row.push ?? row.pushes ?? row.tie) || 0;
    const ac = unitProb(row.away_cover ?? row.awayCover ?? row.away);
    if (hc === null && ac === null) return;
    map.set(L, {
      home_cover: hc !== null ? hc : (ac !== null ? Math.max(0, 1 - ac - push) : null),
      push,
      away_cover: ac !== null ? ac : (hc !== null ? Math.max(0, 1 - hc - push) : null),
    });
  };
  if (Array.isArray(raw)) {
    for (const row of raw) {
      if (!row) continue;
      take(row.line ?? row.home_line ?? row.homeLine ?? row.n, row);
    }
  } else {
    for (const [k, v] of Object.entries(raw)) take(k === "PK" || k === "pk" ? 0 : k, v);
  }
  return map.size ? map : null;
}

function keysMargins() {
  const root = keysRoot();
  if (!root) return null;
  const raw = root.margins || root.margin_dist || root.marginDist || root.histogram || root.margin_counts;
  if (!raw || typeof raw !== "object") return null;
  const out = [];
  if (Array.isArray(raw)) {
    for (const row of raw) {
      const m = num(row && (row.margin ?? row.m ?? row.key));
      const p = num(row && (row.p ?? row.rate ?? row.pct ?? row.n ?? row.count));
      if (m !== null && p !== null) out.push([m, p]);
    }
  } else {
    for (const [k, v] of Object.entries(raw)) {
      const m = num(k);
      const p = num(typeof v === "object" && v ? (v.p ?? v.rate ?? v.n ?? v.count) : v);
      if (m !== null && p !== null) out.push([m, p]);
    }
  }
  if (!out.length) return null;
  const tot = out.reduce((s, row) => s + row[1], 0);
  if (tot > 1.5) return out.map(([m, c]) => [m, c / tot]);
  return out;
}

function coverProb(homeLine) {
  const line = num(homeLine);
  if (line === null) return null;
  const table = keysCoverTable();
  if (table) {
    if (table.has(line)) return table.get(line).home_cover;
    const keys = [...table.keys()].sort((a, b) => a - b);
    let lo = null;
    let hi = null;
    for (const k of keys) {
      if (k <= line) lo = k;
      if (k >= line && hi === null) hi = k;
    }
    if (lo !== null && hi !== null && lo !== hi) {
      const a = table.get(lo).home_cover;
      const b = table.get(hi).home_cover;
      if (a !== null && b !== null) {
        const t = (line - lo) / (hi - lo);
        return a + (b - a) * t;
      }
    }
    if (lo !== null) return table.get(lo).home_cover;
    if (hi !== null) return table.get(hi).home_cover;
  }
  const margins = keysMargins();
  if (margins) {
    let cover = 0;
    for (const [m, p] of margins) {
      if (m + line > 0) cover += p;
    }
    return cover;
  }
  return null;
}

function fmtCoverPct(p) {
  const x = num(p);
  if (x === null) return "—";
  return Math.round(x * 100) + "%";
}

function coverHelperHtml(ourH, mktH) {
  if (ourH == null || mktH == null) return "";
  if (!Number.isFinite(ourH) || !Number.isFinite(mktH)) return "";
  const edge = edgePts(ourH, mktH);
  const keysHit = crossesKeys(ourH, mktH);
  const fire = (edge != null && Math.abs(edge) >= 1.5) || keysHit.includes(3) || keysHit.includes(7) || keysHit.length > 0;
  if (!fire) return "";
  const ourP = coverProb(ourH);
  const mktP = coverProb(mktH);
  if (ourP === null && mktP === null) return "";
  const bit = (lab, line, p) => lab + " " + fmtSpreadNum(line) + " cover " + fmtCoverPct(p);
  return `<p class="sked-cover sked-tip" data-tip="${esc(SKED_TIPS.cover)}" title="${esc(SKED_TIPS.cover)}" tabindex="0">${esc(bit("our", ourH, ourP))} · ${esc(bit("mkt", mktH, mktP))}</p>`;
}

function pickAbbr(text) {
  const m = String(text || "").trim().match(/^([A-Z]{2,3})\b/);
  return m ? normAbbr(m[1]) : null;
}

function gameHomeAway(gameStr) {
  const s = String(gameStr || "");
  const m = s.match(/\b([A-Z]{2,3})\s*@\s*([A-Z]{2,3})\b/);
  if (!m) return { away: null, home: null };
  return { away: normAbbr(m[1]), home: normAbbr(m[2]) };
}

function ticketHomeLine(ticket, which) {
  const line = which === "close" ? num(ticket.close_line) : num(ticket.bet_line);
  if (line === null) return null;
  const market = String(ticket.market || "").toLowerCase();
  if (market === "total" || market === "sgp" || market === "multi") return null;
  const { home, away } = gameHomeAway(ticket.game);
  const side = pickAbbr(ticket.pick);
  if (home && side === home) return line;
  if (home && side === away) return -line;
  return line;
}

function computeClvProb(ticket) {
  const market = String(ticket.market || "").toLowerCase();
  if (market === "total") return null;
  const betHP = ticketHomeLine(ticket, "bet");
  const closeHP = ticketHomeLine(ticket, "close");
  if (betHP === null || closeHP === null) return null;
  const a = coverProb(betHP);
  const b = coverProb(closeHP);
  if (a === null || b === null) return null;
  return a - b;
}

function fmtClvProb(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return sign + (Math.abs(n) * 100).toFixed(1) + "%";
}

/* ---------- scheme (team sheet) ---------- */
function schemeTeam(abbr) {
  if (!schemeData) return null;
  const a = normAbbr(abbr);
  const root = schemeData.teams && typeof schemeData.teams === "object" ? schemeData.teams : schemeData;
  if (!root || typeof root !== "object") return null;
  return root[a] || root[abbr] || null;
}

function schemeVal(row, names) {
  if (!row || typeof row !== "object") return null;
  for (const k of names) {
    if (Object.prototype.hasOwnProperty.call(row, k) && row[k] !== "" && row[k] != null) return row[k];
  }
  return null;
}

function fmtSchemePct(v) {
  const n = num(v);
  if (n === null) return "—";
  if (n >= 0 && n <= 1) return (n * 100).toFixed(1) + "%";
  return n.toFixed(1) + "%";
}

function fmtBackupGap(v) {
  if (v === null || v === undefined || v === "") return "n too small";
  if (typeof v === "string") {
    const low = v.toLowerCase();
    if (!v.trim() || low === "null" || low.includes("n too") || low.includes("too small")) return "n too small";
    const n0 = num(v);
    if (n0 === null) return v;
    v = n0;
  }
  const n = num(v);
  if (n === null) return "n too small";
  return (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n).toFixed(1);
}

function schemeBlockHtml(abbr) {
  const row = schemeTeam(abbr);
  if (!row || typeof row !== "object") return "";
  const shotgun = schemeVal(row, ["shotgun_pct", "shotgun", "shotgun_rate"]);
  const under = schemeVal(row, ["under_center_pct", "under_center", "underCenter", "under_center_rate"]);
  const check = schemeVal(row, ["checkdown_pct", "checkdown", "checkdown_rate"]);
  const rb = schemeVal(row, ["rb_target_pct", "rb_targets", "rb_target", "rb_tgt_pct"]);
  const air = schemeVal(row, ["avg_air_yards", "air_yards", "avg_air"]);
  const qb = schemeVal(row, ["starter_qb", "qb", "qb1", "starter"]);
  const gap = schemeVal(row, ["backup_gap", "backup_gap_pts", "backup"]);
  const airN = num(air);
  const airStr = airN === null ? (air == null ? "—" : String(air)) : airN.toFixed(1);
  return `<div class="scheme-block">
    <p class="prior-kicker">2025 scheme · play-by-play</p>
    <div class="scheme-grid">
      <div class="scheme-item"><small>Shotgun</small><em>${esc(fmtSchemePct(shotgun))}</em></div>
      <div class="scheme-item"><small>Under center</small><em>${esc(fmtSchemePct(under))}</em></div>
      <div class="scheme-item"><small>Checkdown</small><em>${esc(fmtSchemePct(check))}</em></div>
      <div class="scheme-item"><small>RB target</small><em>${esc(fmtSchemePct(rb))}</em></div>
      <div class="scheme-item"><small>Avg air yards</small><em>${esc(airStr)}</em></div>
      <div class="scheme-item"><small>Starter QB</small><em>${esc(qb == null ? "—" : String(qb))}</em></div>
      <div class="scheme-item"><small>Backup gap</small><em>${esc(fmtBackupGap(gap))}</em></div>
    </div>
    <p class="prior-note">free nflverse, not PFF motion.</p>
  </div>`;
}

/* ---------- residuals ---------- */
function residualCloseSpread(id) {
  const row = getResidual(id);
  return num(row.close_spread);
}

function residualCloseTotal(id) {
  const row = getResidual(id);
  return num(row.close_total);
}

function residualVsClose(ourLine, closeLine) {
  if (ourLine == null || closeLine == null) return null;
  if (!Number.isFinite(ourLine) || !Number.isFinite(closeLine)) return null;
  return ourLine - closeLine;
}

function residualVsResult(ourLine, scores) {
  if (ourLine == null || !scores) return null;
  if (!Number.isFinite(ourLine)) return null;
  return scores.margin + ourLine;
}

function clubRollupRows() {
  const acc = {};
  const touch = (abbr) => {
    const a = normAbbr(abbr);
    if (!acc[a]) acc[a] = { abbr: a, sum: 0, n: 0 };
    return acc[a];
  };
  for (const g of regGames()) {
    const ourH = ourHomeSpread(g, hfa);
    if (!Number.isFinite(ourH)) continue;
    const closeH = residualCloseSpread(g.id);
    const mktH = marketFor(g).parsed.homeLine;
    const street = closeH !== null ? closeH : mktH;
    if (street == null || !Number.isFinite(street)) continue;
    const edgeHome = street - ourH;
    const home = touch(g.home);
    const away = touch(g.away);
    home.sum += edgeHome / 2;
    home.n += 1;
    away.sum += -edgeHome / 2;
    away.n += 1;
  }
  if (nflData && Array.isArray(nflData.teams)) {
    for (const t of nflData.teams) touch(t.abbr);
  }
  return Object.values(acc)
    .map((r) => ({ ...r, mean: r.n ? r.sum / r.n : 0 }))
    .sort((a, b) => b.mean - a.mean || a.abbr.localeCompare(b.abbr));
}

function renderResiduals() {
  const body = document.getElementById("residuals-body");
  const empty = document.getElementById("residuals-empty");
  const clubsBody = document.getElementById("resid-clubs-body");
  if (!body) return;
  const games = regGames().slice().sort((a, b) =>
    (Number(a.week) - Number(b.week)) || String(a.date).localeCompare(String(b.date)) || String(a.id).localeCompare(String(b.id))
  );
  if (!games.length) {
    body.innerHTML = "";
    if (empty) empty.hidden = false;
  } else if (empty) empty.hidden = true;
  body.innerHTML = games.map((g) => {
    const mkt = marketFor(g);
    const ourH = ourHomeSpread(g, hfa);
    const mktH = mkt.parsed.homeLine;
    const edge = edgePts(ourH, mktH);
    const oursTot = ourTotal(g);
    const mktTot = num(mkt.ou);
    const tEdge = (oursTot === null || mktTot === null) ? null : mktTot - oursTot;
    const res = getResidual(g.id);
    const closeSp = num(res.close_spread);
    const closeTot = num(res.close_total);
    const rClose = residualVsClose(ourH, closeSp);
    const scores = gameScores(g);
    const rResult = residualVsResult(ourH, scores);
    const resultStr = scores ? (g.home + " " + scores.home + "–" + scores.away) : "";
    const fireSp = edge != null && Math.abs(edge) >= 1.5;
    const fireTot = tEdge != null && Math.abs(tEdge) >= 1.5;
    const weekOn = Number(g.week) === Number(currentWeek);
    return `<tr class="${weekOn ? "is-week" : ""}" data-resid="${esc(g.id)}">
      <td class="num">${esc(g.week)}</td>
      <td class="game">${esc(g.away)} @ ${esc(g.home)}</td>
      <td class="num">${esc(fmtSpreadNum(ourH))}</td>
      <td class="num">${esc(mktH == null ? "—" : fmtSpreadNum(mktH))}</td>
      <td class="num ${fireSp ? "edge-gold" : ""}">${edge == null ? "—" : esc((edge > 0 ? "+" : edge < 0 ? "−" : "") + Math.abs(edge).toFixed(1))}</td>
      <td class="num">${oursTot == null ? "—" : esc(oursTot.toFixed(1))}</td>
      <td class="num">${mktTot == null ? "—" : esc(Number(mktTot).toFixed(1))}</td>
      <td class="num ${fireTot ? "edge-gold" : ""}">${tEdge == null ? "—" : esc((tEdge > 0 ? "+" : tEdge < 0 ? "−" : "") + Math.abs(tEdge).toFixed(1))}</td>
      <td class="num"><input class="mono" type="number" step="0.5" data-resid-spread="${esc(g.id)}" value="${esc(res.close_spread)}" aria-label="Close spread" placeholder=""></td>
      <td class="num"><input class="mono" type="number" step="0.5" data-resid-total="${esc(g.id)}" value="${esc(res.close_total)}" aria-label="Close total" placeholder=""></td>
      <td class="num">${esc(resultStr)}</td>
      <td class="num" data-rclose="${esc(g.id)}">${rClose == null ? "" : esc((rClose > 0 ? "+" : rClose < 0 ? "−" : "") + Math.abs(rClose).toFixed(1))}</td>
      <td class="num">${rResult == null ? "" : esc((rResult > 0 ? "+" : rResult < 0 ? "−" : "") + Math.abs(rResult).toFixed(1))}</td>
    </tr>`;
  }).join("");
  if (clubsBody) {
    clubsBody.innerHTML = clubRollupRows().map((r) => {
      const team = teamByAbbr(r.abbr);
      const name = team ? team.abbr : r.abbr;
      const mean = r.n ? r.mean : 0;
      const sign = mean > 0 ? "+" : mean < 0 ? "−" : "";
      return `<tr>
        <td>${esc(name)}</td>
        <td class="num">${r.n}</td>
        <td class="num ${rtgClass(mean)}">${r.n ? esc(sign + Math.abs(mean).toFixed(2)) : "—"}</td>
      </tr>`;
    }).join("");
  }
}

function renderKeys() {
  const board = document.getElementById("keys-board");
  if (!board) return;
  if (!keysData) {
    board.innerHTML = `<div class="empty-desk">
      <p class="empty-kicker">keys-nfl.json</p>
      <h2>No keys file loaded.</h2>
      <p>Land rates, point value, and cover table stay empty until keys-nfl.json is served from data/. Do not invent a book.</p>
    </div>`;
    return;
  }
  const land = keysLand() || {};
  const pv = keysPointValue() || {};
  const cover = keysCoverTable();
  const landKeys = [3, 6, 7, 10, 14];
  const pvKeys = [3, 7, 9];
  const coverLines = [-7, -3.5, -3, -2.5, 0, 3, 7];
  const landHtml = landKeys.map((k) => {
    const r = land[k];
    return `<span class="key-chip"><em>${k}</em><small>${r == null ? "—" : esc(fmtCoverPct(r))}</small></span>`;
  }).join("");
  const pvHtml = pvKeys.map((k) => {
    const v = pv[k];
    let shown = "—";
    if (v != null) {
      shown = Math.abs(v) <= 1 ? (v * 100).toFixed(1) + "%" : Number(v).toFixed(2);
    }
    return `<article><small>around ${k} · Δ cover</small><em>${esc(shown)}</em></article>`;
  }).join("");
  const coverRows = coverLines.map((L) => {
    const row = cover && (cover.has(L) ? cover.get(L) : null);
    const lab = L === 0 ? "PK" : fmtSpreadNum(L);
    return `<tr>
      <td class="num">${esc(lab)}</td>
      <td class="num">${row && row.home_cover != null ? esc(fmtCoverPct(row.home_cover)) : "—"}</td>
      <td class="num">${row && row.push != null ? esc(fmtCoverPct(row.push)) : "—"}</td>
      <td class="num">${row && row.away_cover != null ? esc(fmtCoverPct(row.away_cover)) : "—"}</td>
    </tr>`;
  }).join("");
  const src = [keysData.source, keysData.n_games ? ("n=" + keysData.n_games) : "", keysData.seasons || ""]
    .filter(Boolean).join(" · ");
  const edgeNote = keysData.edge_value && keysData.edge_value.two_sided_land
    ? keysData.edge_value.two_sided_land : "";
  board.innerHTML = `
    <h2 class="section-label">Land rates</h2>
    <div class="keys-land">${landHtml}</div>
    <h2 class="section-label">Point value</h2>
    <div class="keys-pv">${pvHtml}</div>
    <h2 class="section-label">Cover at the line</h2>
    <div class="table-wrap">
      <table class="ledger">
        <thead><tr><th>line</th><th>home cover</th><th>push</th><th>away cover</th></tr></thead>
        <tbody>${coverRows}</tbody>
      </table>
    </div>
    ${src ? `<p class="prior-note">${esc(src)}</p>` : ""}
    ${edgeNote ? `<p class="prior-note">${esc(edgeNote)}</p>` : ""}`;
}

/* ---------- schedule ---------- */

function renderSchedule() {
  const board = document.getElementById("sked-board");
  const sub = document.getElementById("sked-sub");
  const empty = document.getElementById("sked-empty-ratings");
  const hfaEl = document.getElementById("hfa-input");
  if (hfaEl && String(hfaEl.value) !== String(hfa)) hfaEl.value = hfa;
  const hfaCtrl = document.querySelector(".hfa-ctrl");
  if (hfaCtrl && !hfaCtrl.hasAttribute("data-tip")) {
    hfaCtrl.classList.add("sked-tip");
    hfaCtrl.setAttribute("data-tip", SKED_TIPS.hfa);
    hfaCtrl.setAttribute("title", SKED_TIPS.hfa);
    hfaCtrl.tabIndex = 0;
  }
  if (sub) {
    sub.textContent = "Week " + currentWeek + ". Tap a game. Our line is the gap we expect. Street is the sportsbook. Copper means we disagree enough to look — not an automatic bet. Weather only changes the combined score." 
  }
  if (!board) return;
  if (!nflData || !nflData.games.length) {
    board.innerHTML = "";
    if (empty) empty.hidden = true;
    return;
  }
  if (empty) empty.hidden = !allRatingsZero();
  const games = nflData.games.filter((g) => Number(g.week) === Number(currentWeek));
  const groups = new Map();
  for (const g of games) {
    const b = kickBucket(g.date);
    if (!groups.has(b.id)) groups.set(b.id, { meta: b, games: [] });
    groups.get(b.id).games.push(g);
  }
  const ordered = [...groups.values()].sort((a, b) => a.meta.order - b.meta.order);
  for (const grp of ordered) {
    grp.games.sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.id.localeCompare(b.id));
  }
  board.innerHTML = ordered.map((grp) => {
    const dayLabel = grp.games[0] ? (toET(grp.games[0].date) || {}).label : "";
    const rows = grp.games.map((g) => {
      const et = toET(g.date);
      const mkt = marketFor(g);
      const match = g.neutral
        ? `<button type="button" class="abbr-link" data-team="${esc(g.away)}">${esc(g.away)}</button>
           @ <button type="button" class="abbr-link" data-team="${esc(g.home)}">${esc(g.home)}</button>
           <span class="sked-neutral">at ${esc(g.city || "neutral")}</span>`
        : `<button type="button" class="abbr-link" data-team="${esc(g.away)}">${esc(g.away)}</button>
           @ <button type="button" class="abbr-link" data-team="${esc(g.home)}">${esc(g.home)}</button>`;
      let ourHtml = "—";
      let edgeHtml = "—";
      let fire = false;
      if (hasOurNumber(g)) {
        const ourH = ourHomeSpread(g, hfa);
        ourHtml = formatOurLine(ourH, g.home, g.away);
        const edge = edgePts(ourH, mkt.parsed.homeLine);
        if (edge != null) {
          const keys = crossesKeys(ourH, mkt.parsed.homeLine);
          fire = Math.abs(edge) >= 1.5 || keys.length > 0;
          const sign = edge > 0 ? "+" : edge < 0 ? "−" : "";
          const side = edge >= 1.5 ? "HOME" : edge <= -1.5 ? "AWAY" : "";
          const signed = sign + Math.abs(edge).toFixed(1);
          const numTip = `We disagree by ${signed}${side ? " " + side : ""}. Plus means we like the home team more than the sportsbook does.`;
          edgeHtml = tip(`<span class="val${fire ? " gold" : ""}">${signed}</span>`, fire ? numTip + " " + SKED_TIPS.fire : numTip)
            + (side ? `<span class="sked-side">${side}</span>` : "")
            + (keys.length ? tip(`<span class="note">crosses ${keys.join(" / ")}</span>`, SKED_TIPS.crosses) : "");
        }
      }
      const ouVal = mkt.ou == null ? "" : mkt.ou;
      return `<article class="sked-row${fire ? " is-fire sked-tip" : ""}"${fire ? ` data-tip="${esc(SKED_TIPS.fire)}" title="${esc(SKED_TIPS.fire)}"` : ""} data-game="${esc(g.id)}">
        <button type="button" class="sked-kick sked-open-game" data-open-game="${esc(g.id)}" aria-haspopup="dialog" aria-controls="game-sheet">${et ? esc(et.clock) + " ET" : "—"}</button>
        <div class="sked-match sked-open-game" data-open-game="${esc(g.id)}" tabindex="0" aria-haspopup="dialog" aria-controls="game-sheet">
          <p class="teams-line">${match}</p>
          <button type="button" class="sked-how" data-open-game="${esc(g.id)}" aria-haspopup="dialog" aria-controls="game-sheet">Why this number</button>
        </div>
        <div>
          <button type="button" class="sked-venue sked-open-game" data-open-game="${esc(g.id)}" aria-haspopup="dialog" aria-controls="game-sheet">${esc(g.venue || "")}${g.city ? " · " + esc(g.city) : ""}</button>
          ${g.broadcast ? `<span class="sked-bc">${esc(g.broadcast)}</span>` : ""}
        </div>
        <div class="sked-mkt sked-tip" data-tip="${esc(SKED_TIPS.mkt)}" title="${esc(SKED_TIPS.mkt)}" tabindex="0">
          <label>Street <input class="mono" data-odds="${esc(g.id)}" value="${esc(mkt.odds)}" placeholder="SEA -3.5" spellcheck="false"></label>
          <label>O/U <input class="mono" type="number" step="0.5" data-ou="${esc(g.id)}" value="${esc(ouVal)}"></label>
        </div>
        <div class="sked-our sked-tip" data-tip="${esc(SKED_TIPS.our)}" title="${esc(SKED_TIPS.our)}" tabindex="0"><span class="lbl">Our line</span><span class="val">${esc(ourHtml)}</span></div>
        <div class="sked-edge sked-tip" data-tip="${esc(SKED_TIPS.edge)}" title="${esc(SKED_TIPS.edge)}" tabindex="0"><span class="lbl">Gap</span>${edgeHtml === "—" ? '<span class="val">—</span>' : edgeHtml}${coachChipHtml(g)}${prepChipHtml(g)}${atsChipHtml(g)}</div>
        ${wxStripHtml(g, mkt)}
        ${hasOurNumber(g) ? coverHelperHtml(ourHomeSpread(g, hfa), mkt.parsed.homeLine) : ""}
      </article>`;
    }).join("");
    return `<section class="sked-group">
      <h3>${esc(grp.meta.label)}${dayLabel ? " · " + esc(dayLabel) : ""} · ${grp.games.length} game${grp.games.length === 1 ? "" : "s"}</h3>
      ${rows}
    </section>`;
  }).join("") || `<p class="table-empty">No games in the JSON for week ${esc(currentWeek)}.</p>`;
  if (gameSheetId) renderGameSheet();
}

function exportProfiles() {
  const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "nfl-scout-profiles.json";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Exported profiles for " + Object.keys(profiles).length + " club" + (Object.keys(profiles).length === 1 ? "" : "s") + ".");
}

function importProfiles(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("not an object");
      profiles = data;
      migrateAllProfiles();
      saveProfiles();
      renderTeams();
      renderSchedule();
      if (profileAbbr) renderTeamSheet();
      toast("Imported profiles.");
    } catch {
      toast("Import failed. Need a JSON object of team profiles.");
    }
  };
  reader.readAsText(file);
}


/* ---------- vibe check ---------- */

function fmtVibeDay(iso) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(iso || "");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return Number(m[3]) + " " + months[Number(m[2]) - 1];
}

function fmtVibeRange(start, end) {
  const a = String(start || "");
  const b = String(end || "");
  if (!a && !b) return "";
  if (!b || a === b) {
    const y = a.slice(0, 4);
    return fmtVibeDay(a) + (y ? " " + y : "");
  }
  const ay = a.slice(0, 4);
  const by = b.slice(0, 4);
  if (ay && by && ay !== by) return fmtVibeDay(a) + " " + ay + " – " + fmtVibeDay(b) + " " + by;
  return fmtVibeDay(a) + " – " + fmtVibeDay(b);
}

function vibeCalWeeks() {
  return vibeWeeksCal && Array.isArray(vibeWeeksCal.weeks) ? vibeWeeksCal.weeks : [];
}

function vibeIndexWeeks() {
  return vibeIndex && Array.isArray(vibeIndex.weeks) ? vibeIndex.weeks : [];
}

function vibeCalWeek(id) {
  return vibeCalWeeks().find((w) => w.id === id) || null;
}

function vibeIndexWeek(id) {
  return vibeIndexWeeks().find((w) => w.id === id) || null;
}

function vibeClubList() {
  if (vibeTeams && Array.isArray(vibeTeams.teams) && vibeTeams.teams.length) {
    return vibeTeams.teams.map((t) => ({ abbr: t.abbr, nick: t.nick || t.name || "" }));
  }
  if (nflData && Array.isArray(nflData.teams)) {
    return nflData.teams.map((t) => ({ abbr: t.abbr, nick: t.nick || t.name || "" }));
  }
  return [];
}

function vibeTopicTitle(t) {
  if (t == null) return "";
  if (typeof t === "string") return t.trim();
  if (typeof t === "object") {
    return String(t.title || t.headline || t.name || t.text || t.topic || "").trim();
  }
  return "";
}

function vibeTeamRow(entry, abbr) {
  if (!entry || typeof entry !== "object") return { abbr, volume: null, topics: [] };
  const volume = entry.volume ?? entry.count ?? entry.posts ?? entry.n ?? null;
  const raw = entry.topics || entry.items || entry.stories || entry.headlines || entry.titles || [];
  const topics = Array.isArray(raw) ? raw.map(vibeTopicTitle).filter(Boolean).slice(0, 3) : [];
  return { abbr, volume: volume === "" ? null : volume, topics };
}

function vibeTeamsFromPayload(data) {
  const map = {};
  if (!data || typeof data !== "object") return map;
  const src = data.teams || data.clubs || data.rooms;
  if (Array.isArray(src)) {
    for (const t of src) {
      const abbr = String((t && (t.abbr || t.team || t.id)) || "").toUpperCase();
      if (!abbr) continue;
      map[abbr] = vibeTeamRow(t, abbr);
    }
  } else if (src && typeof src === "object") {
    for (const [k, v] of Object.entries(src)) {
      map[String(k).toUpperCase()] = vibeTeamRow(v, String(k).toUpperCase());
    }
  }
  return map;
}

function vibeHeadline(data) {
  if (!data || typeof data !== "object") return "";
  return String(data.headline || data.title || data.lede || "").trim();
}

function vibeLoudest(data) {
  if (!data || typeof data !== "object") return [];
  const raw = data.loudest || data.loudest_rooms || data.rooms_loudest;
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => {
    if (typeof x === "string") return x;
    if (x && typeof x === "object") return x.abbr || x.team || x.id || "";
    return "";
  }).filter(Boolean);
}

function vibeFmtVolume(v) {
  if (v == null || v === "") return "";
  const n = Number(v);
  if (Number.isFinite(n)) return n.toLocaleString("en-US");
  return String(v);
}

function vibeDayRef(entry) {
  if (entry == null) return null;
  if (typeof entry === "string") {
    const raw = entry.trim();
    if (!raw) return null;
    const id = raw.replace(/^.*\//, "").replace(/\.json$/i, "");
    let path;
    if (/^https?:\/\//i.test(raw) || raw.startsWith("./") || raw.startsWith("/")) {
      path = raw;
    } else if (raw.startsWith("data/")) {
      path = "./" + raw;
    } else if (raw.includes("/") || /\.json$/i.test(raw)) {
      path = "./data/vibe-check/" + raw.replace(/^\.\//, "");
    } else {
      path = "./data/vibe-check/days/" + id + ".json";
    }
    return { id, label: id, path };
  }
  if (typeof entry === "object") {
    const id = String(entry.id || entry.date || entry.day || "").trim();
    const file = entry.path || entry.file || "";
    const path = file
      ? (String(file).startsWith("./") || String(file).startsWith("/") || String(file).startsWith("data/")
        ? (String(file).startsWith("data/") ? "./" + file : file)
        : "./data/vibe-check/" + String(file).replace(/^\.\//, ""))
      : (id ? "./data/vibe-check/days/" + id.replace(/\.json$/i, "") + ".json" : "");
    if (!id && !path) return null;
    return { id: id || path, label: String(entry.label || entry.date || id || path), path };
  }
  return null;
}

async function fetchVibeJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

function ensureVibeRollup(id) {
  if (!id || (id in vibeRollupCache) || vibeInflight["w:" + id]) return;
  vibeInflight["w:" + id] = true;
  fetchVibeJson("./data/vibe-check/weeks/" + encodeURIComponent(id) + ".json").then((data) => {
    vibeRollupCache[id] = data;
    delete vibeInflight["w:" + id];
    renderVibe();
  });
}

function ensureVibeDay(key, path) {
  if (!key || (key in vibeDayCache) || vibeInflight["d:" + key]) return;
  vibeInflight["d:" + key] = true;
  fetchVibeJson(path).then((data) => {
    vibeDayCache[key] = data;
    delete vibeInflight["d:" + key];
    renderVibe();
  });
}

function vibeDayPanelHtml(data) {
  if (data == null) {
    return `<p class="table-empty">No log for this day yet.</p>`;
  }
  const headline = vibeHeadline(data);
  const rooms = vibeLoudest(data);
  const teamMap = vibeTeamsFromPayload(data);
  const keys = Object.keys(teamMap);
  const bits = [];
  if (headline) bits.push(`<p class="vibe-headline">${esc(headline)}</p>`);
  if (rooms.length) {
    bits.push(`<p class="vibe-loudest"><span>Loudest</span> ${rooms.map((a) => `<em>${esc(a)}</em>`).join(" ")}</p>`);
  }
  if (keys.length) {
    const clubs = vibeClubList();
    const order = clubs.length ? clubs.map((c) => c.abbr) : keys;
    const seen = new Set();
    const rows = [];
    for (const abbr of order) {
      if (!teamMap[abbr] || seen.has(abbr)) continue;
      seen.add(abbr);
      const row = teamMap[abbr];
      const vol = vibeFmtVolume(row.volume);
      const quiet = !row.topics.length && (row.volume == null || row.volume === 0);
      rows.push(`<li><span class="mono">${esc(abbr)}</span>${vol ? ` <span class="vibe-club-vol">${esc(vol)}</span>` : ""}${quiet ? ` <span class="vibe-quiet">quiet</span>` : ""}${row.topics.length ? ` — ${row.topics.map((t) => esc(t)).join(" · ")}` : ""}</li>`);
    }
    for (const abbr of keys) {
      if (seen.has(abbr)) continue;
      const row = teamMap[abbr];
      const vol = vibeFmtVolume(row.volume);
      rows.push(`<li><span class="mono">${esc(abbr)}</span>${vol ? ` <span class="vibe-club-vol">${esc(vol)}</span>` : ""}${row.topics.length ? ` — ${row.topics.map((t) => esc(t)).join(" · ")}` : ""}</li>`);
    }
    bits.push(`<ul class="vibe-day-clubs">${rows.join("")}</ul>`);
  }
  if (bits.length) return bits.join("");
  return `<pre class="vibe-json">${esc(JSON.stringify(data, null, 2))}</pre>`;
}

function renderVibe() {
  const sel = document.getElementById("vibe-week-select");
  const board = document.getElementById("vibe-board");
  if (!board) return;

  const calWeeks = vibeCalWeeks();
  const indexWeeks = vibeIndexWeeks();
  if (!vibeWeekId) {
    vibeWeekId = (vibeIndex && vibeIndex.current_week_id) || (calWeeks[0] && calWeeks[0].id) || (indexWeeks[0] && indexWeeks[0].id) || null;
  }

  const picker = calWeeks.length ? calWeeks : indexWeeks;
  if (sel) {
    sel.innerHTML = picker.map((w) => `<option value="${esc(w.id)}">${esc(w.label || w.id)}</option>`).join("");
    if (vibeWeekId) sel.value = vibeWeekId;
  }

  if (!vibeIndex && !vibeWeeksCal) {
    board.innerHTML = `<p class="table-empty">Serve the desk over http so vibe-check can load (python3 -m http.server from this folder).</p>`;
    return;
  }

  const cal = vibeCalWeek(vibeWeekId) || {};
  const idx = vibeIndexWeek(vibeWeekId) || {};
  const label = cal.label || idx.label || vibeWeekId || "Vibe week";
  const status = String(idx.status || "").toLowerCase() || "upcoming";
  const range = fmtVibeRange(cal.start, cal.end);
  const rollupReady = vibeWeekId && (vibeWeekId in vibeRollupCache);
  if (vibeWeekId && !rollupReady) ensureVibeRollup(vibeWeekId);
  const rollup = rollupReady ? vibeRollupCache[vibeWeekId] : null;

  let rollupHtml;
  if (rollup) {
    const headline = vibeHeadline(rollup);
    const rooms = vibeLoudest(rollup);
    rollupHtml = `<div class="vibe-rollup">
      ${headline ? `<p class="vibe-headline">${esc(headline)}</p>` : `<p class="lede">Weekly rollup is on file. No headline in the payload.</p>`}
      ${rooms.length ? `<p class="vibe-loudest"><span>Loudest rooms</span> ${rooms.map((a) => `<em>${esc(a)}</em>`).join(" ")}</p>` : ""}
    </div>`;
  } else {
    rollupHtml = `<div class="empty-desk" id="vibe-empty">
      <p class="empty-kicker">Preseason · nothing logged yet</p>
      <h2>Nightly starts tonight. First Saturday rollup is Preseason Week 2 (Aug 22).</h2>
      <p>Daily files land under days/. Saturday 9:31pm ET writes weeks/${esc(vibeWeekId || "id")}.json. Until then the rooms stay quiet. The league is even.</p>
    </div>`;
  }

  const teamMap = vibeTeamsFromPayload(rollup);
  const clubs = vibeClubList();
  let gridHtml;
  if (!clubs.length) {
    gridHtml = `<p class="table-empty">32 clubs load with vibe-check/teams.json.</p>`;
  } else {
    gridHtml = `<div class="vibe-grid">` + clubs.map((c) => {
      const row = teamMap[c.abbr] || { abbr: c.abbr, volume: null, topics: [] };
      const vol = vibeFmtVolume(row.volume);
      const quiet = !row.topics.length && (row.volume == null || row.volume === 0);
      const topics = quiet
        ? `<p class="vibe-quiet">quiet</p>`
        : `<ul class="vibe-topics">${row.topics.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
      return `<article class="vibe-club${quiet ? " is-quiet" : ""}">
        <div class="vibe-club-top">
          <span class="vibe-club-abbr">${esc(c.abbr)}</span>
          ${vol ? `<span class="vibe-club-vol">${esc(vol)}</span>` : ""}
        </div>
        ${c.nick ? `<span class="vibe-club-nick">${esc(c.nick)}</span>` : ""}
        ${topics}
      </article>`;
    }).join("") + `</div>`;
  }

  const days = (idx.days || []).map(vibeDayRef).filter(Boolean);
  let daysHtml;
  if (!days.length) {
    daysHtml = `<p class="table-empty">No daily files attached to this week yet.</p>`;
  } else {
    const buttons = days.map((d) => {
      const on = vibeOpenDay === d.id;
      return `<button type="button" class="vibe-day${on ? " is-open" : ""}" data-vibe-day="${esc(d.id)}" data-vibe-path="${esc(d.path)}">${esc(fmtVibeDay(d.label) || d.label)}</button>`;
    }).join("");
    let panel = "";
    if (vibeOpenDay) {
      const ref = days.find((d) => d.id === vibeOpenDay);
      if (ref && !(ref.id in vibeDayCache)) ensureVibeDay(ref.id, ref.path);
      const loaded = ref && (ref.id in vibeDayCache);
      panel = `<div class="vibe-day-panel" id="vibe-day-panel">
        <p class="section-label">${esc(ref ? (fmtVibeRange(ref.label, ref.label) || ref.label) : vibeOpenDay)}</p>
        ${loaded ? vibeDayPanelHtml(vibeDayCache[ref.id]) : `<p class="table-empty">Loading…</p>`}
      </div>`;
    }
    daysHtml = `<div class="vibe-days" role="list">${buttons}</div>${panel}`;
  }

  const calNote = cal.note ? `<p class="vibe-cal-note">${esc(cal.note)}</p>` : "";
  const games = cal.games ? `<p class="vibe-cal-note">Games ${esc(cal.games)}</p>` : "";

  board.innerHTML = `
    <div class="vibe-meta">
      <h2>${esc(label)}</h2>
      ${range ? `<p class="vibe-range">${esc(range)}</p>` : ""}
      <span class="vibe-status ${esc(status)}">${esc(status)}</span>
    </div>
    ${calNote}${games}
    ${rollupHtml}
    <h2 class="section-label">32 clubs</h2>
    ${gridHtml}
    <h2 class="section-label">Daily files</h2>
    ${daysHtml}
    <p class="vibe-sent">Sentiment scores later.</p>`;
}

function render() {
  renderKPIs();
  renderCard();
  renderLedger();
  renderTeams();
  renderSchedule();
  renderResiduals();
  renderKeys();
  renderVibe();
  syncSharpBookInputs();
  if (gameSheetId) renderGameSheet();
}

/* ---------- sheet ---------- */

function fillWindowSelect() {
  const sel = document.getElementById("f-window");
  sel.innerHTML = ALL_WINDOWS.map((w) => `<option value="${w}">${w}</option>`).join("");
}

function syncStakePurpose() {
  const type = document.getElementById("f-type").value;
  const unitsEl = document.getElementById("f-units");
  let units;
  if (type === "PASS") units = 0;
  else if (type === "Parlay") units = PARLAY_UNITS;
  else units = clampUnits(unitsEl && unitsEl.value !== "" ? unitsEl.value : DEFAULT_STRAIGHT_UNITS, type);
  if (unitsEl) {
    unitsEl.value = units;
    unitsEl.readOnly = type !== "Straight";
  }
  document.getElementById("f-stake").value = stakeFromUnits(units);
  document.getElementById("f-purpose").value = purposeFor(type);
  if (type === "PASS") {
    document.getElementById("f-result").value = "VOID";
    document.getElementById("f-pick").placeholder = "PASS";
    if (!document.getElementById("f-pick").value) document.getElementById("f-pick").value = "PASS";
  }
}

function openSheet(opts = {}) {
  closeTeamSheet({ silent: true });
  closeGameSheet({ silent: true });
  lastFocus = document.activeElement;
  const sheet = document.getElementById("sheet");
  const overlay = document.getElementById("overlay");
  document.getElementById("ticket-form").reset();
  document.getElementById("f-id").value = opts.id || "";
  document.getElementById("f-week").value = opts.week ?? currentWeek;
  document.getElementById("f-window").value = opts.window || "TNF";
  document.getElementById("f-type").value = opts.ticket_type || "Straight";
  const unitsEl = document.getElementById("f-units");
  if (unitsEl) unitsEl.value = inferUnits(opts);
  document.getElementById("f-market").value = opts.market || "Spread";
  document.getElementById("f-game").value = opts.game || "";
  document.getElementById("f-pick").value = opts.pick || (opts.ticket_type === "PASS" ? "PASS" : "");
  document.getElementById("f-line").value = opts.bet_line ?? "";
  document.getElementById("f-juice").value = opts.juice ?? -110;
  document.getElementById("f-book").value = opts.book || "";
  document.getElementById("f-timing").value = opts.timing_thesis || "PRICE_CLV";
  document.getElementById("f-notes").value = opts.notes || "";
  document.getElementById("f-result").value = opts.result || (opts.ticket_type === "PASS" ? "VOID" : "PENDING");
  document.getElementById("f-close").value = opts.close_line ?? "";
  const closeBookEl = document.getElementById("f-close-book");
  if (closeBookEl) closeBookEl.value = opts.close_book || sharpBook || SHARP_BOOK_DEFAULT;
  const closeJuiceEl = document.getElementById("f-close-juice");
  if (closeJuiceEl) closeJuiceEl.value = opts.close_juice ?? -110;
  syncStakePurpose();
  document.getElementById("sheet-title").textContent =
    opts.ticket_type === "PASS" && !opts.id ? "Record pass" : opts.id ? "Edit ticket" : "Log ticket";
  sheet.hidden = false;
  overlay.hidden = false;
  document.getElementById("f-window").focus();
}

function closeSheet() {
  document.getElementById("sheet").hidden = true;
  hideOverlayIfIdle();
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

function readForm() {
  const f = document.getElementById("ticket-form");
  const data = Object.fromEntries(new FormData(f).entries());
  const type = data.ticket_type;
  const existing = data.id ? tickets.find((x) => x.id === data.id) : null;
  const sample = existing ? isSample(existing) : false;
  return enrich({
    id: data.id || uid(),
    season: sample ? "EXAMPLE" : SEASON,
    week: Number(data.week) || currentWeek,
    window: data.window,
    ticket_type: type,
    purpose: purposeFor(type),
    game: data.game,
    market: type === "PASS" ? "" : data.market,
    pick: data.pick,
    bet_line: data.bet_line === "" ? null : num(data.bet_line),
    juice: data.juice === "" ? -110 : num(data.juice),
    units: clampUnits(data.units, type),
    stake: stakeFromUnits(clampUnits(data.units, type)),
    book: data.book,
    close_line: data.close_line === "" ? null : num(data.close_line),
    close_book: data.close_book || sharpBook || SHARP_BOOK_DEFAULT,
    close_juice: data.close_juice === "" || data.close_juice == null ? -110 : num(data.close_juice),
    result: type === "PASS" ? "VOID" : data.result || "PENDING",
    timing_thesis: data.timing_thesis,
    notes: data.notes,
    sample: sample,
  });
}

/* ---------- nav ---------- */

function showView(name) {
  document.querySelectorAll(".view").forEach((v) => {
    const on = v.dataset.view === name;
    v.hidden = !on;
    v.classList.toggle("is-active", on);
  });
  document.querySelectorAll(".nav a").forEach((a) => {
    const on = a.dataset.nav === name;
    if (on) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

function parseHash() {
  const raw = (location.hash || "#desk").replace("#", "") || "desk";
  const qIdx = raw.indexOf("?");
  const pathRaw = qIdx >= 0 ? raw.slice(0, qIdx) : raw;
  const path = pathRaw.toLowerCase();
  const qs = qIdx >= 0 ? raw.slice(qIdx + 1) : "";
  const params = new URLSearchParams(qs);
  let team = (params.get("team") || params.get("abbr") || "").toUpperCase();
  if (path.startsWith("game-")) {
    return { view: "schedule", team: null, game: pathRaw.slice(5) };
  }
  if (path.startsWith("team-")) {
    team = path.slice(5).toUpperCase();
    return { view: "teams", team: normAbbr(team), game: null };
  }
  if (path === "team") {
    return { view: "teams", team: team ? normAbbr(team) : null, game: null };
  }
  if (path === "teams") {
    return { view: "teams", team: team ? normAbbr(team) : null, game: null };
  }
  return { view: path, team: team ? normAbbr(team) : null, game: null };
}

function fromHash() {
  const { view, team, game } = parseHash();
  const known = ["desk", "card", "teams", "schedule", "residuals", "keys", "vibe", "clock", "playbook", "tickets"];
  showView(known.includes(view) ? view : "desk");
  if (game) {
    if (nflData && nflData.games && nflData.games.length) openGameSheet(game, { silent: true });
    else pendingGame = game;
  } else if (team) {
    if (gameSheetId) closeGameSheet({ silent: true });
    if (nflData && nflData.teams && nflData.teams.length) openTeamProfile(team);
    else pendingTeam = team;
  } else {
    if (profileAbbr && view !== "teams" && view !== "schedule") {
      closeTeamSheet({ silent: true });
    }
    if (gameSheetId && view !== "schedule") {
      closeGameSheet({ silent: true });
    }
  }
}

/* ---------- samples / io ---------- */

function loadSamples() {
  const without = tickets.filter((t) => !isSample(t));
  const samples = SAMPLES.map((s) => enrich({ ...s, id: uid(), sample: true, season: "EXAMPLE" }));
  tickets = [...without, ...samples];
  save();
  render();
  toast("SAMPLE tickets loaded — season EXAMPLE. They are not 2026 process.");
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(tickets, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "nfl-scout-tickets.json";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Exported " + tickets.length + " ticket" + (tickets.length === 1 ? "" : "s") + ".");
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data)) throw new Error("not an array");
      tickets = data.map(enrich);
      save();
      render();
      toast("Imported " + tickets.length + " ticket" + (tickets.length === 1 ? "" : "s") + ".");
    } catch {
      toast("Import failed. Need a JSON array of tickets.");
    }
  };
  reader.readAsText(file);
}

function clearAll() {
  if (!confirm("Clear every ticket in localStorage? This cannot be undone.")) return;
  tickets = [];
  save();
  render();
  toast("Book is empty.");
}

/* ---------- events ---------- */

function bind() {
  fillWindowSelect();
  renderClock();
  renderPlaybook();

  window.addEventListener("hashchange", fromHash);
  fromHash();

  document.getElementById("week-select").addEventListener("change", (e) => {
    currentWeek = Math.min(18, Math.max(1, Number(e.target.value) || 1));
    e.target.value = currentWeek;
    render();
  });
  document.getElementById("week-prev").addEventListener("click", () => {
    currentWeek = Math.max(1, currentWeek - 1);
    document.getElementById("week-select").value = currentWeek;
    render();
  });
  document.getElementById("week-next").addEventListener("click", () => {
    currentWeek = Math.min(18, currentWeek + 1);
    document.getElementById("week-select").value = currentWeek;
    render();
  });

  const vibeSel = document.getElementById("vibe-week-select");
  if (vibeSel) {
    vibeSel.addEventListener("change", (e) => {
      vibeWeekPicked = true;
      vibeWeekId = e.target.value || null;
      vibeOpenDay = null;
      renderVibe();
    });
  }
  const vibeBoard = document.getElementById("vibe-board");
  if (vibeBoard) {
    vibeBoard.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-vibe-day]");
      if (!btn) return;
      const key = btn.dataset.vibeDay;
      if (vibeOpenDay === key) {
        vibeOpenDay = null;
        renderVibe();
        return;
      }
      vibeOpenDay = key;
      const path = btn.dataset.vibePath;
      if (key && !(key in vibeDayCache)) ensureVibeDay(key, path);
      else renderVibe();
    });
  }

  document.getElementById("btn-add").addEventListener("click", () => openSheet({ week: currentWeek }));
  document.getElementById("btn-pass").addEventListener("click", () => openSheet({ week: currentWeek, ticket_type: "PASS" }));
  document.getElementById("btn-sample").addEventListener("click", loadSamples);
  document.getElementById("btn-export").addEventListener("click", exportJSON);
  document.getElementById("btn-import").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) importJSON(file);
    e.target.value = "";
  });
  document.getElementById("btn-clear").addEventListener("click", clearAll);

  document.getElementById("window-grid").addEventListener("click", (e) => {
    const log = e.target.closest("[data-log]");
    const pass = e.target.closest("[data-pass]");
    if (log) openSheet({ week: currentWeek, window: log.dataset.log, ticket_type: "Straight" });
    if (pass) openSheet({ week: currentWeek, window: pass.dataset.pass, ticket_type: "PASS" });
  });

  document.getElementById("playbook-filters").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;
    playbookFilter = btn.dataset.filter;
    renderPlaybook();
  });

  document.getElementById("ledger-body").addEventListener("click", (e) => {
    const grade = e.target.closest("[data-grade]");
    const edit = e.target.closest("[data-edit]");
    const del = e.target.closest("[data-del]");
    if (grade) {
      const t = tickets.find((x) => x.id === grade.dataset.id);
      if (!t) return;
      upsert({ ...t, result: grade.dataset.grade });
    }
    if (edit) {
      const t = tickets.find((x) => x.id === edit.dataset.edit);
      if (t) openSheet(t);
    }
    if (del) {
      if (confirm("Delete this ticket?")) remove(del.dataset.del);
    }
  });
  document.getElementById("ledger-body").addEventListener("change", (e) => {
    const close = e.target.closest("[data-close]");
    if (!close) return;
    const t = tickets.find((x) => x.id === close.dataset.close);
    if (!t) return;
    upsert({ ...t, close_line: close.value === "" ? null : num(close.value) });
  });

  document.getElementById("f-type").addEventListener("change", syncStakePurpose);
  const unitsEl = document.getElementById("f-units");
  if (unitsEl) unitsEl.addEventListener("input", syncStakePurpose);
  document.getElementById("ticket-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const t = readForm();
    if (t.ticket_type !== "PASS" && !t.pick) {
      toast("A ticket needs a pick — or record a PASS.");
      return;
    }
    upsert(t);
    closeSheet();
    toast(t.ticket_type === "PASS" ? "Pass recorded." : "Ticket on the book.");
  });
  document.getElementById("f-cancel").addEventListener("click", closeSheet);
  document.getElementById("sheet-close").addEventListener("click", closeSheet);
  document.getElementById("overlay").addEventListener("click", () => {
    if (document.getElementById("game-sheet") && !document.getElementById("game-sheet").hidden) closeGameSheet();
    else if (!document.getElementById("team-sheet").hidden) closeTeamSheet();
    else closeSheet();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (document.getElementById("game-sheet") && !document.getElementById("game-sheet").hidden) {
      e.preventDefault();
      closeGameSheet();
    } else if (!document.getElementById("team-sheet").hidden) {
      e.preventDefault();
      closeTeamSheet();
    } else if (!document.getElementById("sheet").hidden) {
      e.preventDefault();
      closeSheet();
    }
  });

  document.getElementById("team-filters").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-chip]");
    if (!btn) return;
    const kind = btn.dataset.kind;
    const id = btn.dataset.chip;
    if (kind === "all") { teamConf = null; teamDiv = null; }
    else if (kind === "conf") teamConf = teamConf === id ? null : id;
    else if (kind === "div") teamDiv = teamDiv === id ? null : id;
    renderTeams();
  });
  document.getElementById("team-sort").addEventListener("change", (e) => {
    teamSort = e.target.value || "rating-desc";
    renderTeams();
  });
  document.getElementById("btn-export-profiles").addEventListener("click", exportProfiles);
  document.getElementById("btn-import-profiles").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) importProfiles(file);
    e.target.value = "";
  });
  document.getElementById("team-grid").addEventListener("click", (e) => {
    const card = e.target.closest("[data-team]");
    if (!card) return;
    const abbr = card.dataset.team;
    if (location.hash !== "#team-" + abbr) history.replaceState(null, "", "#team-" + abbr);
    openTeamProfile(abbr);
  });

  function setHfa(v) {
    hfa = snapHalf(v);
    saveHfa();
    const el = document.getElementById("hfa-input");
    if (el) el.value = hfa;
    renderSchedule();
    renderResiduals();
    if (profileAbbr) refreshTeamDerived();
  }
  document.getElementById("hfa-input").addEventListener("change", (e) => setHfa(e.target.value));
  document.getElementById("hfa-minus").addEventListener("click", () => setHfa(hfa - 0.5));
  document.getElementById("hfa-plus").addEventListener("click", () => setHfa(hfa + 0.5));

  document.getElementById("sked-board").addEventListener("click", (e) => {
    if (e.target.closest("input, select, textarea, .sked-mkt, .wx-strip, .hc-chip, .wx-chip, .sked-cover, .sked-our, .sked-edge")) {
      return;
    }
    const team = e.target.closest(".abbr-link[data-team]");
    if (team) {
      const abbr = team.dataset.team;
      if (location.hash !== "#team-" + abbr) history.replaceState(null, "", "#team-" + abbr);
      openTeamProfile(abbr);
      return;
    }
    const opener = e.target.closest("[data-open-game]");
    if (opener) openGameSheet(opener.dataset.openGame);
  });
  document.getElementById("sked-board").addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (e.target.closest(".abbr-link, input, select, textarea")) return;
    const opener = e.target.closest("[data-open-game]");
    if (!opener || opener.tagName === "BUTTON") return;
    e.preventDefault();
    openGameSheet(opener.dataset.openGame);
  });
  document.getElementById("sked-board").addEventListener("change", (e) => {
    const odds = e.target.closest("[data-odds]");
    const ou = e.target.closest("[data-ou]");
    if (odds || ou) {
      const id = (odds || ou).dataset.odds || (odds || ou).dataset.ou;
      const cur = lineOverrides[id] || {};
      if (odds) cur.odds = odds.value;
      if (ou) cur.ou = ou.value === "" ? null : num(ou.value);
      lineOverrides[id] = cur;
      saveOverrides();
      renderSchedule();
      renderResiduals();
      if (profileAbbr) refreshTeamDerived();
      return;
    }
    const wxEl = e.target.closest("[data-wx]");
    if (!wxEl) return;
    const id = wxEl.dataset.wx;
    const field = wxEl.dataset.wxField;
    const cur = { ...emptyWx(), ...(weatherByGame[id] || {}) };
    if (field === "wind" || field === "temp") {
      cur[field] = wxEl.value === "" ? "" : num(wxEl.value);
    } else if (field === "precip" || field === "roof" || field === "note") {
      cur[field] = wxEl.value;
    }
    weatherByGame[id] = cur;
    saveWeather();
    renderSchedule();
    renderResiduals();
  });

  const gameClose = document.getElementById("game-sheet-close");
  if (gameClose) gameClose.addEventListener("click", () => closeGameSheet());
  document.getElementById("team-sheet-close").addEventListener("click", () => closeTeamSheet());
  document.getElementById("team-sheet").addEventListener("keydown", (e) => {
    if (e.target.id === "tp-adjust-why" && e.key === "Enter") {
      e.preventDefault();
      commitAdjustLog();
    }
  });
  document.getElementById("team-sheet").addEventListener("focusout", (e) => {
    if (e.target && e.target.id === "tp-adjust-why") commitAdjustLog();
  });
  document.getElementById("team-sheet").addEventListener("click", (e) => {
    if (e.target.id === "tp-adjust-minus") {
      const inp = document.getElementById("tp-adjust");
      applyAdjust((num(inp.value) || 0) - 0.5);
      return;
    }
    if (e.target.id === "tp-adjust-plus") {
      const inp = document.getElementById("tp-adjust");
      applyAdjust((num(inp.value) || 0) + 0.5);
      return;
    }
    if (e.target.id === "tp-ctx-add") {
      const p = getProfile(profileAbbr);
      p.context.push({ id: uid(), text: "", pts: 0, on: true });
      setProfile(profileAbbr, p);
      renderTeamSheet();
      const rows = document.querySelectorAll("#tp-ctx [data-ctx-text]");
      const last = rows[rows.length - 1];
      if (last) last.focus();
      refreshTeamDerived();
      return;
    }
    if (e.target.id === "tp-inj-add") {
      const p = getProfile(profileAbbr);
      const pos = "DEPTH";
      const status = "QUESTIONABLE";
      p.injuries.push({
        id: uid(),
        name: "",
        pos,
        status,
        pts: injuryRowPts(pos, status),
        on: false,
        custom: false,
      });
      setProfile(profileAbbr, p);
      renderTeamSheet();
      const rows = document.querySelectorAll("#tp-inj [data-inj-name]");
      const last = rows[rows.length - 1];
      if (last) last.focus();
      refreshTeamDerived();
      return;
    }
    const injDel = e.target.closest("[data-inj-del]");
    if (injDel) {
      const p = getProfile(profileAbbr);
      p.injuries = p.injuries.filter((r) => r.id !== injDel.dataset.injDel);
      setProfile(profileAbbr, p);
      renderTeamSheet();
      refreshTeamDerived();
      return;
    }
    const del = e.target.closest("[data-ctx-del]");
    if (del) {
      const p = getProfile(profileAbbr);
      p.context = p.context.filter((c) => c.id !== del.dataset.ctxDel);
      setProfile(profileAbbr, p);
      renderTeamSheet();
      refreshTeamDerived();
      return;
    }
    const opp = e.target.closest("#tp-sked [data-team]");
    if (opp) {
      openTeamProfile(opp.dataset.team);
      if (location.hash !== "#team-" + opp.dataset.team) {
        history.replaceState(null, "", "#team-" + opp.dataset.team);
      }
    }
  });
  document.getElementById("team-sheet").addEventListener("input", (e) => {
    if (!profileAbbr) return;
    if (e.target.id === "tp-notes") {
      setProfile(profileAbbr, { notes: e.target.value });
      return;
    }
    if (e.target.id === "tp-adjust") {
      const next = num(e.target.value);
      applyAdjust(next === null ? 0 : next, { snap: false, writeInput: false });
      return;
    }
    const text = e.target.closest("[data-ctx-text]");
    const pts = e.target.closest("[data-ctx-pts]");
    if (text || pts) {
      const id = (text || pts).dataset.ctxText || (text || pts).dataset.ctxPts;
      const p = getProfile(profileAbbr);
      const row = p.context.find((c) => c.id === id);
      if (!row) return;
      if (text) row.text = text.value;
      if (pts) row.pts = num(pts.value) ?? 0;
      setProfile(profileAbbr, p);
      if (pts) refreshTeamDerived();
    }
    const injName = e.target.closest("[data-inj-name]");
    if (injName) {
      const p = getProfile(profileAbbr);
      const row = p.injuries.find((r) => r.id === injName.dataset.injName);
      if (!row) return;
      row.name = injName.value;
      setProfile(profileAbbr, p);
      return;
    }
    const injPts = e.target.closest("[data-inj-pts]");
    if (injPts) {
      const p = getProfile(profileAbbr);
      const row = p.injuries.find((r) => r.id === injPts.dataset.injPts);
      if (!row) return;
      row.custom = true;
      row.pts = num(injPts.value) ?? 0;
      setProfile(profileAbbr, p);
      refreshTeamDerived();
    }
  });
  document.getElementById("team-sheet").addEventListener("change", (e) => {
    if (!profileAbbr) return;
    if (e.target.id === "tp-adjust") {
      applyAdjust(e.target.value);
      return;
    }
    const on = e.target.closest("[data-ctx-on]");
    const pts = e.target.closest("[data-ctx-pts]");
    if (on || pts) {
      const id = (on || pts).dataset.ctxOn || (on || pts).dataset.ctxPts;
      const p = getProfile(profileAbbr);
      const row = p.context.find((c) => c.id === id);
      if (!row) return;
      if (on) row.on = on.checked;
      if (pts) row.pts = snapHalf(pts.value);
      setProfile(profileAbbr, p);
      refreshTeamDerived();
    }
    const injPos = e.target.closest("[data-inj-pos]");
    const injStatus = e.target.closest("[data-inj-status]");
    if (injPos || injStatus) {
      const id = (injPos || injStatus).dataset.injPos || (injPos || injStatus).dataset.injStatus;
      const p = getProfile(profileAbbr);
      const row = p.injuries.find((r) => r.id === id);
      if (!row) return;
      if (injPos) row.pos = injPos.value;
      if (injStatus) row.status = injStatus.value;
      if (!row.custom) {
        row.pts = injuryRowPts(row.pos, row.status);
        const rowEl = e.target.closest(".inj-row");
        const ptsInp = rowEl && rowEl.querySelector("[data-inj-pts]");
        if (ptsInp) ptsInp.value = row.pts;
      }
      setProfile(profileAbbr, p);
      refreshTeamDerived();
      return;
    }
    const injOn = e.target.closest("[data-inj-on]");
    if (injOn) {
      const p = getProfile(profileAbbr);
      const row = p.injuries.find((r) => r.id === injOn.dataset.injOn);
      if (!row) return;
      row.on = injOn.checked;
      setProfile(profileAbbr, p);
      refreshTeamDerived();
    }
  });

  function onSharpBook(e) {
    const v = String(e.target.value || "").trim() || SHARP_BOOK_DEFAULT;
    sharpBook = v;
    saveSharpBook();
    syncSharpBookInputs();
  }
  const sharpDesk = document.getElementById("sharp-book-desk");
  const sharpTix = document.getElementById("sharp-book");
  if (sharpDesk) sharpDesk.addEventListener("change", onSharpBook);
  if (sharpTix) sharpTix.addEventListener("change", onSharpBook);

  const residBody = document.getElementById("residuals-body");
  if (residBody) {
    residBody.addEventListener("change", (e) => {
      const sp = e.target.closest("[data-resid-spread]");
      const tot = e.target.closest("[data-resid-total]");
      if (!sp && !tot) return;
      const id = (sp || tot).dataset.residSpread || (sp || tot).dataset.residTotal;
      const cur = getResidual(id);
      if (sp) cur.close_spread = sp.value === "" ? "" : (num(sp.value) ?? "");
      if (tot) cur.close_total = tot.value === "" ? "" : (num(tot.value) ?? "");
      setResidual(id, cur);
      const g = nflData && nflData.games ? nflData.games.find((x) => x.id === id) : null;
      const cell = residBody.querySelector('[data-rclose="' + id + '"]');
      if (cell && g) {
        const ourH = ourHomeSpread(g, hfa);
        const rClose = residualVsClose(ourH, num(cur.close_spread));
        cell.textContent = rClose == null ? "" : ((rClose > 0 ? "+" : rClose < 0 ? "−" : "") + Math.abs(rClose).toFixed(1));
      }
      const clubsBody = document.getElementById("resid-clubs-body");
      if (clubsBody) {
        clubsBody.innerHTML = clubRollupRows().map((r) => {
          const mean = r.n ? r.mean : 0;
          const sign = mean > 0 ? "+" : mean < 0 ? "−" : "";
          return `<tr>
            <td>${esc(r.abbr)}</td>
            <td class="num">${r.n}</td>
            <td class="num ${rtgClass(mean)}">${r.n ? esc(sign + Math.abs(mean).toFixed(2)) : "—"}</td>
          </tr>`;
        }).join("");
      }
    });
  }
}

async function bootNfl() {
  await loadNfl();
  if (pendingTeam) openTeamProfile(pendingTeam);
  if (pendingGame) openGameSheet(pendingGame, { silent: true });
  fromHash();
  render();
}

load();
loadProfiles();
loadWeather();
loadResiduals();
loadSharpBook();
bind();
render();
bootNfl();

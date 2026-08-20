# Sharps methods — transferable process

Pulled Wednesday 19 August 2026 (ET). Sources opened with WebSearch + WebFetch. Quote or paraphrase only what is sourced below. No invented hit rates. Tags: **COPY** (do this at $150), **ADAPT** (same idea, recreational bankroll), **IGNORE** (beards, dummy bets, moving markets, illegal, or needs syndicate limits).

Desk already runs: 2025 prior + taper, FA, injury points, HFA 2, coach H2H, Week 1 / bye ATS, weather totals, residuals, key-number cover table, shotgun / checkdown, $150 straight / $50 entertainment parlay, CLV of straights, shop 3+ books, ~1.5 pts or a key 3/7, favorites early / dogs late, 90/10 ratings, no chase.

---

## 1. Billy Walters / *Gambler* (Keteyian, 2023)

Chapters 21–22 are the “Master Class” and “Advanced Master Class” (AOL / Yahoo interview, 22 Aug 2023; Covers, 30 Aug 2023). Confirmed what we already use, then the pieces we had not written down.

### Confirmed (already on the desk)

- **Bet a number, not a team.** Walters: “I never wavered from the mission: getting the best possible number and price on every game” (*Gambler*, Goodreads excerpts).
- **~1.5 points is a bet.** On Joe Rogan (Action Network, 28 Feb 2024): a 1.5-point edge is one unit; every extra point of edge is another unit. Super Bowl XLIV Saints +7 was a 7-point edge and a $4.5 million bet — scale, not process.
- **Key 3 / 7 and half-points.** “Always pay attention to the value of the numbers as the line moves.” Example he publishes: if you like the favorite, lay 6.5 immediately, because a move to 6 helps you less than a move to 7 hurts you. Hence **favorites early, dogs late** (*Gambler*, Goodreads).
- **Shop 3+ books.** AOL 2023: one book has GB +2.5, another +3; that difference is the job. Also: know whether +2.5 at −110 is better than +3 at −130 — he charts it in the book.
- **90/10 ratings.** New rating = 90% of old team rating + 10% of True Game Performance Level. TGPL = net score + opponent’s old power rating + net injuries. Worked example in the book: old rating 8, TGPL 8, new rating stays 8 (Goodreads table).
- **CLV / best number.** Mission statement above.
- **No chase.** AOL 2023: lose three or four on Sunday, then double up Sunday night or Monday with “no opinion at all” — “That’s suicide if you do that.”
- **Parlays are lottery.** AOL 2023: “at the current odds you can’t win on parlays and teasers.” Rogan: teasers and parlays often lay $1.50 to $1; you already lay $11 to win $10 on straights.

### Missed pieces (now sourced)

**Injuries as points.** Walters calls injury assessment “the second-most important factor in gaining a handicapping advantage” (Covers, 2023). He assigns a number to every key NFL player; “at least 60% of players have a value of basically zero.” Published values (Covers / *Gambler* excerpts):

- QBs ≈ a touchdown; the best ones more. Separate quarterbacks-only rating.
- Top non-QBs ≈ 2.5–3 points.
- Playing hurt cuts the value.
- Cluster injuries matter, in this order: pass catchers, defensive line, offensive line, defensive backs, linebackers, running backs.
- Situation can explode a “small” player: Tampa OT Tristan Wirfs normally ~1.3 points; in the 2022 playoff vs. the Rams (Aaron Donald, immobile Brady, backup OT also hurt, Godwin/Brown out, Gronk staying in to block) Walters re-graded Wirfs as high as ~6 and bet accordingly (*Gambler*, Goodreads).
- Watch beat writers and medical accounts (@profootballdoc, @FBInjuryDoc) to predict whether someone actually suits up (Covers).

Desk already has an injury-point scale (`injury-scale.json`: QB1 3.5, LT 2.0, caps 4.5 / 6.0, wait for official status). What we did **not** have: playing-hurt haircut, cluster order, and situational re-grade when the opponent’s pass rush or our QB mobility changes the same player’s point value.

**Computer vs opinion.** Two layers, kept apart.

- Quantitative: “several teams of experts working independently. They have never met each other… funneling their information to one common denominator: me.” More than 25 people historically; values to a tenth of a point (*Gambler*, Goodreads).
- Qualitative: “a qualitative person who knows more about those players than most” (Rogan / Action Network).
- Origin story (Rogan): first algorithm partner in the late 1960s; Walters recruited six more who worked **independent** of the first, then he combined all seven. “All of them know their edge will eventually fade.”
- 600–700 NFL contributors each have an assigned value (Rogan).

**Starting the week / Monday.** Walters could bet $25,000 on a college football game at 8:00 Monday morning and $50,000 on a pro game in 1992 at the Horseshoe (*Gambler*). That is syndicate-limit timing, not a $150 rule. What transfers: openers are softest; he still wants the favorite’s number before it moves through a key. Today he says he only bets NFL Thursday–Saturday because that is when he can get the most money down (Rogan). If he were the book, he would post the highest limits on Thursday so he could adjust before the weekend — he names Circa as the shop that already operates that way.

**Limits.** Cap any single event at 3% of bankroll; bet in half-units from 0.5 to 3.0, sized to the edge (Covers; AOL: “one to three percent”). “Start with the assumption that you’ll lose it all” (Covers). His own current week is Thu–Sat because **limits**, not because the number is better then.

**Steam / market-leading books.** Monitor Circa, MGM, Caesars, and Pinnacle; their lines show which way the market is moving (Covers). He does not publish a steam-chase recipe. He does publish the opposite of chasing: do not bet Sunday night / Monday to get even.

**Spread vs moneyline at 3.** *Gambler* (Goodreads): “If I like the favorite, anything better than −170 would be better than laying 3 at $110/$100. For the underdog, anything better than +140 is better than taking the 3 at a price of $110/$100.”

**HFA (his published numbers, not ours).** Conventional wisdom = 3. Every NFL game 1974–2022 ≈ 2.5. Last four years in the book (COVID era) < 1. “If you had made the mistake of using 3 points… over the last three years, you certainly would have lost” (*Gambler*, Goodreads). Desk already uses HFA 2.

**Game-factor list we do not already encode.** S-factors (special), W-factors (weather), E-factors (emotional), quantified from long-run stats and updated yearly (Covers):

- Turf: upgrade the visitor if home and visitor play on the same surface; upgrade the home team if surfaces differ.
- Bounceback: upgrade a team that lost last week by 19+; slightly more if 29+.
- Super Bowl: winner upgraded first four games of next season; loser downgraded first four.
- Road after Monday Night Football: “one of the biggest downgrades.”
- Also listed: divisional, coming off TNF, consecutive road weeks, time-zone change, travel distance, stadium quirks, prevent / sit-starters with a lead.

**What he will not do (and we should not copy).** Beards and concealing the source (*Gambler*: “finding that number and concealing the source”; Sierra Sports runners). Dummy / market-moving bets. Getting $20 million down on a weekend. Those are **IGNORE**.

### Tags

| Method | Tag | Why |
|---|---|---|
| Bet the number / shop juice and half-points | **COPY** | Mechanical, available at $150 |
| 1.5-pt threshold; key 3/7 | **COPY** | Already the fire rule |
| Favorites early / dogs late | **COPY** | Already the week clock |
| 90/10 ratings + TGPL | **COPY** | Already the prior/taper idea; keep the 10% cap |
| No Sunday-night chase; no parlays as process | **COPY** | Already the book |
| Spread vs ML at 3 (−170 / +140) | **COPY** | We shop books; we did not convert |
| Injuries as points; wait for status | **COPY** | Already on disk |
| Playing-hurt + cluster order + situational re-grade | **ADAPT** | Same points, extra haircut; no new scale invented |
| Independent computer vs qualitative sign-off | **ADAPT** | One model + one human veto, not 25 PhDs |
| S/W/E: road-after-MNF, turf, bounceback, timezone | **ADAPT** | Checklist, not a new prior |
| 0.5–3 units to edge, 3% cap | **ADAPT** | We are flat $150; do not size up after a win |
| Watch Circa / Pinnacle / MGM / Caesars for direction | **ADAPT** | Reference the sharp tape; bet the best rec number |
| NFL only Thu–Sat | **IGNORE** | That is a limit problem at his size |
| Beards, dummy bets, concealing source | **IGNORE** | Illegal / account fraud / market moving |
| 600–700 player values, Caltech war room | **IGNORE** | Needs the staff |

---

## 2. The Computer Group (1980s)

Founded ~1980 by Dr. Ivan Mindlin (orthopedic surgeon) and Michael Kent (mathematician; Westinghouse nuclear-sub work). Walters joined 1983 to move the money. First national write-up: *Sports Illustrated*, 10 Mar 1986, “Using Your Computer For Fun And Profit” (vault; quoted in Boyd’s Bets 19 May 2025 and Pregame / Johnny Detroit). Kent’s 1983–84 books: almost $5 million on college and, occasionally, NFL; he thought the true figure including side bets was $10–15 million (Wikipedia citing Kent; *SI* FBI source claimed $25 million in one year — treat as allegation). FBI raid 19 Jan 1985 (45 homes, 22 cities); later acquittals. Group disbanded ~1987.

### Power ratings

Kent built software that ate team performance, player statistics, home-field advantage, travel distance, “and dozens of other variables,” then spat out the group’s own predicted spread (Bettorsworld; Boyd’s Bets). Mindlin had already run 25,000 past college basketball games through computer services to test Vegas spreads vs. final scores (*SI* via Pregame). Weekend mainframe time (Walters, via Boyd’s).

Compare **their number** to the posted Vegas line. The gap is the play; bigger gap, bigger bet. *SI* (via Boyd’s / vault snippet): they also issued a 0–9 “power rating” that was a **confidence / bet-size** score at a given number, not a point spread. Example from 1985: West Texas State +9 = 7, +8½ = 6, +8 = 4. Mindlin (or someone using his name) phoned Vegas for the day’s spreads, ran them, phoned back the 0–9.

Focus was **college football and college basketball**. Mindlin: the NFL line is “too good” — pro openers were already too sharp to exploit the same way (Boyd’s; Bettorsworld). NFL was occasional, not the engine.

### Injury adjustments

**Not found as a published Computer Group scale.** Kent’s inputs included player statistics. Mindlin was an orthopedic surgeon; that is biography, not a method. The injury-as-points system that is documented is Walters 2023 (section 1), after Sierra Sports, not a 1980s Kent printout. Do not invent a Computer Group injury table.

### How they beat openers

1. Build a number before or as the opener hits.
2. Subtract: computer spread − Vegas spread = delta.
3. Size to the 0–9 confidence at **that** number (the same side is a 7 at +9 and only a 4 at +8).
4. Get down at many shops before the market copies.
5. Late coordinated money, just before kick, so books could not lay off (Bettorsworld; Boyd’s).

Roxborough later said Walters’ group “forced” oddsmakers onto computers because they “were able to keep track of all the teams better than we could” on college football and basketball (Las Vegas Review-Journal, 10 Aug 2023). That is the opener edge: **coverage**, not a mystic NFL injury model.

Tactics we do **not** copy: nationwide beards; “This is the first and last time you’ll ever see me” (Walters to a runner, Bettorsworld); dummy early money to move a line, then the real side later (Boyd’s: SMU +6 → +8, then twice as much on Texas A&M −8). Those are **IGNORE**.

### Tags

| Method | Tag | Why |
|---|---|---|
| Own number vs. opener; bet the delta | **COPY** | That is already “1.5 pts or a key” |
| Size up when the same side is better at a key | **COPY** | 0–9 idea at $150 = fire / pass, not unit ramp |
| College-soft / NFL-hard | **ADAPT** | NFL sides are the efficient market; look for leftover markets (section 3) |
| Player stats + HFA + travel in the rating | **ADAPT** | We already have HFA 2 and travel-ish residuals; do not add a fake Kent formula |
| Published Computer Group injury points | **IGNORE** | No sourced scale |
| Beards, dummy SMU-style moves, late flood | **IGNORE** | Market moving / concealment |
| 60–65% win-rate lore | **IGNORE** | Secondary blogs; not a process we can run |

---

## 3. Ed Miller & Matthew Davidow, *The Logic of Sports Betting* (2019)

Primary color: Las Vegas Review-Journal interview, 13 Jun 2020 (Jim Barnes). Mechanics also from published summaries that define the book’s terms (hold, market maker, steam, CLV, attack surface). Miller is explicit the book is **market structure**, not a handicapping model.

### Market makers vs. takers

Three sources of a line (book summaries of Miller/Davidow):

1. An analyst’s rough opener (smallest role).
2. Books copying other books.
3. **Price discovery**: a market maker posts, takes all comers, moves on action.

A market maker could theoretically open every game at pick and let action walk Alabama to −38.5. Once that number settles, retail copies it. One bet at the maker can move a dozen retail boards that never saw a customer on that side. The real market is thinner than it looks.

**Makers (sharp):** Pinnacle, historically CRIS / Bookmaker, Circa as the closest US legal shop (Walters and Circa’s own posture; WagerBird’s structural write-up matching the book). Low hold, high limits, winners allowed. They **use** informed money.

**Takers (retail):** DraftKings, FanDuel, most US apps. Higher hold, limit winners, peg to the maker after the fact.

Walters’ named tape — Circa, MGM, Caesars, Pinnacle — is the same map. MGM/Caesars are closer to “respectable retail that still posts a real number” than to Pinnacle.

### Hold and vig

Break-even = Risk ÷ (Risk + Win). −110 → 52.4%. Hold on a two-way market = both sides’ break-evens − 100%. −110 / −110 ≈ **4.5% hold** (Miller/Davidow term; BettorEdge restates vig vs. hold the same way). That hold “erases one good bet in five” if you also make ordinary mistakes (SoBrief / book takeaway). Think in **percentages**, not “cents.” A “20-cent” improvement at −130 → −110 is a bigger probability edge than a “40-cent” improvement at −380 → −340.

If every book has the same price, you pay full hold. If prices diverge, you can build a **synthetic** market (best dog at A vs. best favorite at B, or spread vs. moneyline using push rates) that approaches 0% hold. At zero hold, a real insight is profit; a dart is break-even.

### Why the close is the price

CLV = your break-even % minus the market-maker close’s break-even %. Miller: average CLV **above half the hold** means the process is probably working; failing that, the process will lose (SoBrief / Befreed summaries of the book). **Market agreement** (you took +138, it goes to +115) is confirmation. **Market resistance** (you took +138, it goes to +170) is a stop sign — “never double down on bets facing resistance” (Befreed). You do not get 17 cracks at your good bets; you get them at your stinkers.

Desk already scores CLV of straights. What we did not write: **do not add** when the maker moves against the ticket, and **score CLV against a maker close** (Pinnacle / Circa), not against DraftKings.

### Steam vs. squares

Steam chase in the book: maker moves, you race the **stale** retail number. “Wins reliably but gets you banned fastest” (SoBrief). Square money is the recreational pile that retail is happy to hold. Do not confuse a DK move with a Circa/Pinnacle move.

### Which books are sharp; limits as information

Miller/Davidow (book, via z-lib excerpt of the text): Tuesday NFL at market-making books still has **restricted limits**. The biggest bankrolls sit out until limits rise. Early limits are an information screen — only some people are allowed to speak. Later, more voices, more efficient price.

Also from the book’s “strong vs. weak market” chapter (Befreed): strong = several makers, large limits, lots of information, lower hold (NFL sides). Weak = one or no maker, small limits, thin data, or a brand-new prop. **Higher hold + lower limit** is the book telling you it feels vulnerable. Paradox: Super Bowl public money can make an otherwise strong market temporarily weak.

Wong, independently, in *Sharp Sports Betting* ch. 1 (Huntington Press excerpt): a max bet on a prop or obscure game **is** the information that moves the line. Totals maxes are lower than sides. Two maxes in a row and they move it on you.

### Related markets (side vs. total vs. first half)

RJ 2020, Miller: “If you can identify where that information applies to a different bet that didn’t move, you can 100 percent make a profit.” Davidow: the player’s advantage is the **menu**. After a spread or total moves, check player props, first quarter, first half. That is the “attack surface” idea — books add markets faster than they can price them.

NFL full-game sides are the market the Computer Group already called “too good.” First half, team total, and a lagged full-game total are where the same information is often late.

Other Miller rules worth keeping:

- **Angles, not trends.** An angle is predictable, quantifiable, and unaccounted for in the line, and it **glides** (wind > 20 mph unders still make sense at 15). “SEC 14-point favorites off a non-conference loss are 22–9” is a Mad Libs trend. “They found the trend first and then they made up a story” (RJ 2020).
- In-play: wait for a timeout; broadcast is ~18 seconds behind (book summaries). Not an NFL-desk product.
- Standard 2- and 3-team parlays can pay close to fair **if the legs are +EV**. Losing legs just die faster (RJ 2020). Does not repeal Walters on retail parlay juice; it says do not parlay bad bets. Desk already: $50 entertainment only.

### Tags

| Method | Tag | Why |
|---|---|---|
| Think in hold / break-even % | **COPY** | Required to shop juice |
| CLV vs. maker close; half-the-hold rule of thumb | **COPY** | We already score CLV; fix the benchmark |
| Never add into market resistance | **COPY** | Process, $0 cost |
| Related-market leftover after a full-game move | **COPY** | 1H / total / ML at $150 |
| Angles must glide; no new ATS filters | **COPY** | Stops us inventing Week-1-and-a-half systems |
| Limits + hold as softness signal | **ADAPT** | We cannot see Circa’s limit board; we can see juice and maxes |
| Synthetic / line-shop toward 0% hold | **ADAPT** | Shop the best number **and** the best price |
| Steam-chase stale retail | **IGNORE** | Book says it wins and gets you banned; also needs speed we do not have |
| In-play / timeout trading | **IGNORE** | Not the desk |
| Bonus-bust longshot math | **IGNORE** | Promo, not NFL process |

---

## 4. Stanford Wong, *Sharp Sports Betting* (2001; Huntington Press reprint 2021)

400 pages. First half = all sports; last half = NFL (chs. 12–17: HFA, ATS results, moneyline vs. spread, totals, teasers, Super Bowl champ). Math book, not a syndicate memoir. Excerpted chapter 1 is on disk via lasvegasadvisor.com PDF.

### Keys

Wong’s NFL chapter (SoBrief summary of the book; SportsInsights 2007 review confirms the charts): margins pile on **3, 7, 10, 14, 17**. A margin of exactly 3 happens about **10%** of the time when a team is favored around 3 (SoBrief). 0, 2, 8, 9, 12, 13 are rare. Half a point is not a fixed price: moving −3.5 → −3 or +2.5 → +3 is the buy; the same half-point near 8 is junk. SoBrief: worth paying up to **20 cents** near 3. Desk already has a 1999–2025 key-number cover table (`keys-nfl.json`, n = 6,967 REG). Use that table, not Wong’s 2001 frequencies, for 2026.

### Halves

Chapter 1 (primary excerpt): boards list first-half spreads and totals; at halftime they post the second half. SportsInsights 2007: Wong “even [has] thoughts on betting ‘half’s or quarters.’” He does **not**, in any source opened here, publish a first-half cover rate or a “bet 1H favorites” rule. The transferable idea is Miller’s: halves are a **related market**. Wong tells you they exist and that you should pick the better of two ways to bet the same team (spread vs. ML, full vs. half). He does not give a half-game ATS percentage I can cite.

### Middles

Primary: BJ21.com “Middles Sample Problems,” excerpted from the book with permission.

- NFL regular season then 16 games, four months.
- A **one-game** NFL season-wins middle hits about **19.6%** of the time (both tickets win). Wong: slightly better than a three-game baseball middle.
- A **half-game** NFL middle ≈ a two-game baseball middle.
- Construction: two −110 bets, $220 in, $200 if both win, −$10 if the result misses the window.
- Baseball season-wins (for scale, not NFL process): 1-game middle 6.3% hit / ~2% return; 2-game 12.4% / ~7%; 3-game 18.4% / ~13%. Tie-up is until the season ends; Wong would not buy a baseball middle thinner than three games.

In-week NFL middles (buy +3 at A, −2.5 at B) are the same math at a smaller window. Only fire if shopping actually produces the window. Do not invent a hit rate for a 0.5-point in-week middle.

### Poisson / totals

Wong ch. 9 is “Poisson Props” (table of contents in the excerpt). SportsInsights 2007: Poisson for events that occur one at a time. SoBrief: field goals, touchdowns, strikeouts; estimate the mean, read the table, compare to the price. Garbage-in: yards and basketball points come in bunches and **do not** fit.

NFL totals (ch. 15). SportsInsights: charts for score frequencies and push rates. SoBrief / Scribd chapter summary (secondary — flag it): most common total **37**, about **5%** of games; 41 also common; 32 and 56 rare. To beat 4.55% vig you need a real gap vs. the posted total; Scribd summary says “at least five percentage points” and discusses a two-point totals middle as the break-even window. **I did not open the printed chapter.** Do not treat 37 / 5% as a 2026 input — desk already builds `our_total` from 2025 ppg + weather (`totals-model.json`). Poisson stays available for **K / FG / sack props**, which are not the $150 book.

### Other Wong that transfers

- −110 break-even **52.4%**. SportsInsights: “bible” charts. Wong (SoBrief): documented sharps around **53.5%**, not 70%.
- Shop: “If you shop at least a dozen independent sports books… expected value of the tickets you cash will be around **2% higher**” than a random shop (ch. 1 excerpt). −105 instead of −110 is **2.2%** on action (same excerpt).
- Books do **not** always balance. They shade favorites because squares love them (SoBrief).
- Hypothesis test: 1-in-1,000 bar on a system built from past games; never test on the data that created it (SoBrief). Desk already has Week 1 / bye ATS as a **fixed** angle — do not add a third filter.
- Wong teasers: only when six points capture **both** 3 and 7 (favorites −7.5 to −8.5, dogs +1.5 to +2.5). 1999–2010 random six-point teasers 66.8% vs. ~70% break-even; the 3-and-7 slice ~73% (SoBrief). Books have since taken teasers off those numbers. **Do not add teasers to process** unless a shop still pays fair and still lands on both keys.
- Home-dog remark in SoBrief (secondary): since 1985 the underdog excess sat with home dogs, about 52.7%. Not copied into the desk; HFA 2 + “dogs late” already covers the usable part.

### Tags

| Method | Tag | Why |
|---|---|---|
| Key-number half-point is not one price | **COPY** | We have the cover table; buy/sell only at 3 and 7 |
| Spread vs. ML (same team, two prices) | **COPY** | Pairs with Walters −170 / +140 |
| Shop many books; −105 is real money | **COPY** | 2% is the most available edge at $150 |
| 52.4% is the mountain | **COPY** | Already implied |
| First-half as a listed related market | **ADAPT** | Use after a full-game move (Miller); no Wong 1H % to copy |
| In-week middle only if a window exists | **ADAPT** | Rare at rec books; do not hunt it |
| Poisson for one-at-a-time props | **ADAPT** | Not the $150 side/total book |
| Wong teasers | **IGNORE** unless terms still capture 3 and 7 | Edge was published and books adjusted |
| 2001 home-dog 52.7% as a 2026 system | **IGNORE** | Secondary, stale, HFA already 2 |
| Season-wins middles | **IGNORE** | Ties money for months; not this desk |

---

## 5. Pinnacle / Buchdahl / CLV literature

**The scoreboard is the close, not Sunday’s 1–0.** That is Buchdahl’s thesis across Pinnacle columns and Football-Data. Almost all of the **published samples are soccer (1X2)**, not NFL sides. Do not pretend we have an NFL open-vs-close hit rate from these papers.

### Published samples (year, n, result)

| Year | Source | Sample | Finding |
|---|---|---|---|
| 2016 | Buchdahl, Football-Data, “The Efficiency of the Pinnacle.com Closing Line” (posted 4 Aug 2016) | 4 seasons from 2012/13; **87,960** home/draw/away pre-close vs. close pairs | Ratio of pre-close price to close predicts level-stake return almost **1:1** (slope ≈ 1.00). Margin **not** removed, so expected yield sits a few percent above observed — that gap **is** the hold. |
| 2019 | Buchdahl, Pinnacle, “Using the closing line to test your skill in betting” (4 Apr 2019) | **162,672** soccer opening vs. closing odds from Pinnacle | 35.7% of home/away **opening** odds theoretically beat the **fair** close. Average open / fair-close ratio **0.969** → expected level-stake **−3.1%**. Being at 1.000 on 1,214 bets like this sample is ~9σ from 0.969. |
| 2020 | Buchdahl, GodsOfOdds, “How Accurate are Pinnacle’s Closing Odds?” (7 May 2020) | **57,986** matches, **173,958** H/D/A Pinnacle closes since 2012/13 | Fair (margin-removed) closes, bet every outcome: **99.73%** return; Monte Carlo SD 0.40%, so inside 1σ of 100%. Predicted vs. actual win % tracks 1:1 at 1% probability buckets. Pre-close / fair-close ratio vs. actual returns is 1:1. **Reverse** (treat pre-close as truth, bet the close) — **no** useful correlation. Information in the opener is already inside the close. |
| 2017-ish | Buchdahl, “Steamers and Drifters Revisited” (Football-Data) | Indatabet Aug 2007–Jul 2017; **158,092** matches, **474,276** H/D/A open/close pairs after cleaning | Steam vs. drift at the close remains significant (p = 0.0002 in the write-up). Original smaller sample (30,540) had the same direction. This is **soccer market-average** odds, not NFL. |

Buchdahl’s working rule (GodsOfOdds 2020; Pinnacle 2019): **Pinnacle’s fair close ≈ true price.** Your odds ÷ that fair close ≈ expected yield. He is also the one who says win-rate significance is slow (interview at SharpBetting: do not read skill before ~1,000 bets; want p < 0.001) while CLV shows up faster. Absence of CLV is debated; presence of CLV is the useful signal.

**No sourced NFL “openers cover X% vs. closes” study is in this file.** Blog posts that throw around 55–60% CLV hit rates or r² = 0.997 without a year and a sample are not cited. If we want an NFL open-vs-close number, compute it from our own book vs. Circa/Pinnacle closes after Week 1 — do not import soccer 35.7% as an NFL fact.

### Tags

| Method | Tag | Why |
|---|---|---|
| Close is the scoreboard; CLV predicts yield | **COPY** | Already the ledger rule |
| Devig the **maker** close, not DK | **COPY** | Buchdahl’s hypothesis is Pinnacle-specific |
| Do not read 8–10 straight tickets as skill | **COPY** | Variance; CLV is the early read |
| Soccer 35.7% / 0.969 as an NFL prior | **IGNORE** | Wrong sport, wrong market (3-way) |
| Steam-chase because steamers beat drifters | **IGNORE** | Soccer result; also a ban path (Miller) |

---

## 6. Oddsmaker side — Roxborough, Bob Martin

### How a line is made

**Bob Martin** (1960s–early 1980s). Sports Handle, 9 Apr 2019 (Robert Mann; Jack Franzi, Richard Saber).

- Monday morning, Churchill Downs Sports Book on the Strip (later Union Plaza with Johnny Quinn): Martin chalked the week’s football openers. That was **the** line. Illegal shops nationwide copied it.
- Method: call every big bookmaker and every big bettor in the country, especially New York. “Once he talked to all of these people… he could make a true number.” Saber: “there’s always guys out there who know more than you. You have to know what they think, too.” The number is the one that **attracts two-way action**, not Martin’s private handicap.
- Credo still quoted: **“11 for 10 will take care of everything.”**
- Super Bowl III anecdote (Dave Anderson, *NYT*, via Sports Handle): Mo Siegel asked if writing “Lombardi gives the Jets a chance” would move the 17-point line. Martin: “That would depend… how much Mr. Lombardi bet.”
- He also bet and laid off himself. Convicted 1982, Wire Act; 13 months. Hole in the market that Roxborough filled.

**Roxy Roxborough** / LVSC (1982–1999). Review-Journal 10 Aug 2023; Tahoe Daily Tribune “Cooking up the odds”; ESPN.com profile (id 13467100).

- Art **and** science. “The degree to which each ingredient appears depends on who’s stirring the pot.”
- NFL specifically (Cesar Robaina, LVSC, Tahoe): “I sort of feel the number. I then pull out the stat book and validate… power ratings, betting patterns and other hard data.” NFL is public-heavy, so feel-then-check works. College football and NBA totals are where “professional gamblers have been particularly successful” — those need more math.
- Sunday ~4:15 p.m.: five oddsmakers push desks into an octagon, argue each spread, ship to the Stardust. Stardust (Schettler) reviews, posts. **Wise guys draw straws** for first shot at the opener. They bet in turns; the book moves; they stop when the number no longer has value. “The early bird gets the number.” Dog bettors: “The patient investor will be rewarded with the extra point.”
- Stardust openers 8:00 a.m. daily, 6:00 p.m. Sunday. Lottery for place in line. “After about an hour, you’ve got a pretty solid number that people are betting both ways.” Then every other book copies. Eleven pay phones outside were “the highest 11 revenue-producing pay phones in the United States” (Richard Schuetz).
- Computers were **forced** by Walters’ group on college, plus Schettler expanding the board until humans could not track every team (RJ 2023). First they stored loose-leaf data; then programmable power ratings. LVSC at peak: ~90% of Nevada books (ESPN; RJ).
- Roxborough himself was a sharp on baseball totals before he sold the number. Deal with Chris Andrews (Cal Neva): bet first, then tell Andrews what it should be.

### What they fear

Sourced, not folklore:

1. **A number that does not get two-way action.** Martin’s whole craft. An opener that only one side wants is a losing opener.
2. **Someone who knows more than they do — and they will not know who.** Martin’s teaching point. Lombardi’s opinion is worthless unless Lombardi is betting.
3. **Computer coverage on the long board.** Roxborough: Walters’ group had better numbers on college football and basketball “where there were so many teams that we were booking.”
4. **Getting picked on the opener before the wise-guy hour is over.** Stardust built a lottery **because** first shot at a soft number is the whole game. Tahoe: “The early bird gets the number.”
5. **Inside information that beats the board.** Wong ch. 1: Nevada books’ exclusion lists are mostly “huge bets while using inside information” — “That’s the main thing sports books seem to be afraid of.” A star QB breaks an arm and you know first.
6. **Limits collapsing.** Walters (*Gambler*): if a bookie is destroyed he closes or cuts limits. “Neither scenario did me any good.” Smart books **want** the sharp’s action so they can shade and keep limits up.
7. **Taxation that makes 11–10 uneconomic** (Roxborough to ESPN): then the legal book cannot compete with the illegal one. Industry fear, not a betting rule.

### Tags

| Method | Tag | Why |
|---|---|---|
| Treat the opener as a hypothesis, not truth | **COPY** | Martin / Stardust / Miller |
| Favs / overs into the soft opener; dogs after the public | **COPY** | Tahoe’s two sentences; already our clock |
| Ask “does this number want two-way money?” | **ADAPT** | We cannot call New York bookies; we can see Circa vs. DK split |
| Feel-then-check on NFL, math-first on leftovers | **ADAPT** | Robaina’s NFL vs. college/totals split |
| Be first at the window / lottery | **IGNORE** | 1980s Stardust; we are not moving $50k at 8 a.m. |
| Selling your number after you bet it | **IGNORE** | Roxborough’s career change, not ours |

---

## Already on this desk (do not re-derive)

2025 prior + taper · FA · injury points · HFA 2 · coach H2H · Week 1 / bye ATS · weather totals · residuals · key-number cover table · shotgun / checkdown · $150 straight / $50 entertainment parlay · CLV of straights · shop 3+ books · 1.5 pts or a key · favorites early / dogs late · 90/10 · no chase.

The ten rules below are **not** in that list.

---

## 10 rules we do not already have

Ranked by likely real edge at recreational size ($150 straight, 3+ legal books, no beard, no $2M limit). Rank is judgment about **availability** of the edge at this bankroll, not a claimed ROI. No invented percentages.

1. **Shop juice, not just the spread — and convert spread vs. moneyline at 3.** Walters (AOL 2023; *Gambler* −170 / +140). Wong ch. 1: a dozen books ≈ +2% EV vs. a random shop; −105 vs. −110 is 2.2%. This is the only edge that is for sale every week at $150. **COPY.**

2. **Score CLV against a market-maker close (Pinnacle / Circa, no-vig), not against DraftKings.** Buchdahl 2016 / 2019 / 2020: the fair Pinnacle close is the price; the opener is not additional information. Miller: CLV above half the hold is the process check. We already log CLV — change the benchmark. **COPY.**

3. **Never add to a ticket that is getting market resistance.** Miller: +138 → +170 is a stop, not a sale. Walters: Sunday-night double-up is suicide. Two sources, one rule. **COPY.**

4. **After a full-game side or total moves, look at the leftover: first half, team total, moneyline.** Miller (RJ 2020): “a different bet that didn’t move.” Wong: 1H numbers exist; pick the better way to bet the same team. NFL full-game sides are the market Mindlin called too good. **COPY.**

5. **Buy or sell the half-point only at 3 and 7.** Wong key-number chapter; Walters 6.5-before-7. Our own `keys-nfl.json` is the 1999–2025 frequency table — use it. Paying juice to buy +5.5 to +6 is a donation. **COPY.**

6. **Re-price injuries for playing-hurt and for clusters, in Walters’ order (WR / DL / OL / DB / LB / RB), and explode a “small” player when the matchup says so.** We already have points and official-status waits. We did not have the haircut, the stack, or Wirfs-at-6. **ADAPT** (no new invented scale; write the haircut on the ticket).

7. **Add a Sunday S/W/E checklist we do not already encode: road after MNF, consecutive road, time-zone change, turf same vs. opposite, bounceback after a 19+ or 29+ loss.** Walters (Covers) calls road-after-MNF one of the biggest downgrades. These are adjustments, not a second prior. **ADAPT.**

8. **Two numbers must agree: the computer (prior + injuries + weather) and the qualitative read (coach, scheme, “will he play?”). If they fight, pass.** Walters kept independent teams that never met, then a qualitative specialist. We have one model and one human — require both signatures on a $150 ticket. **ADAPT.**

9. **Read hold and max-bet as information.** Miller: Tuesday NFL limits are a screen; high hold + low limit = a market the book does not trust. Wong: totals maxes < sides maxes; a max on a leftover moves the number. If Circa or Pinnacle is 2–3 cents better **and** the retail max is tiny, we are looking at a weak copy, not a gift. **ADAPT.**

10. **No new ATS trend filters. An angle must glide.** Miller (RJ 2020) + Wong ch. 7 (1-in-1,000, out of sample). Week 1 / bye ATS stays because it is already on the desk and specified. Do not add “division dogs off a short week in September.” **COPY.**

### Explicitly not in the ten

Beards · dummy SMU-style line moves · steam-chase · Walters Thu–Sat-only · 3% Kelly at this bankroll · Wong teasers (unless a shop still captures 3 and 7 at a fair price) · Poisson props as the main book · soccer 35.7% as an NFL prior · Computer Group 60–65% lore · in-play timeout trading.

---

## Source list (opened)

- Walters / Keteyian, *Gambler* (2023): Goodreads excerpts (HFA, 90/10 table, Wirfs, −170/+140, favorites early, bookmaker names, 8 a.m. Monday limits); Covers 30 Aug 2023 (Master Class); AOL / Yahoo 22 Aug 2023 (shop, chase, parlays); Action Network 28 Feb 2024 (Rogan: 1.5 pts, Thu–Sat, 600–700 players, Circa); Shortform (Computer Group / Sierra / beards).
- Computer Group: *SI* 10 Mar 1986 (via vault snippet + Boyd’s Bets 19 May 2025 + Pregame / Johnny Detroit); Wikipedia “Michael Kent”; Bettorsworld; LA Times 6 Jan 1990 (indictment).
- Miller & Davidow, *The Logic of Sports Betting* (2019): Las Vegas Review-Journal 13 Jun 2020; SoBrief / Befreed term summaries; WagerBird market-maker explainer (structure, not a new study).
- Wong, *Sharp Sports Betting*: Huntington Press / Las Vegas Advisor ch. 1 PDF (shop 2%, −105 = 2.2%, 1H listings, max bets, inside-info fear); BJ21.com middles excerpt (NFL 19.6%); SportsInsights Oct 2007 review; SoBrief on keys / Poisson / teasers (flagged where secondary).
- Buchdahl: Football-Data 4 Aug 2016 (87,960); Pinnacle 4 Apr 2019 (162,672); GodsOfOdds 7 May 2020 (57,986 / 173,958); Football-Data steamers/drifters (158,092).
- Oddsmakers: Sports Handle 9 Apr 2019 (Martin); Review-Journal 10 Aug 2023 (Roxborough / Stardust); Tahoe Daily Tribune “Cooking up the odds”; ESPN.com id 13467100 (Roxborough / Martin hole).

Pulled 19 Aug 2026. Do not edit `app.js` from this file.

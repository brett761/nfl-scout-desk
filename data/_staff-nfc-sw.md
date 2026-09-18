# 2026 NFC South + NFC West coordinators — unknowns

Pulled 2026-08-23 (ET). Companion file: `_staff-nfc-sw.json`.

Rule: no invented names, years, or schemes. `unknown` means the pages actually opened did not support a clean fill.

## 8 clubs completed

| Club | HC (from coaches-2026.json) | OC | DC | ST |
| --- | --- | --- | --- | --- |
| ATL | Kevin Stefanski (2026) | Tommy Rees | Jeff Ulbrich | Craig Aukerman |
| CAR | Dave Canales (2024) | Brad Idzik | Ejiro Evero | Tracy Smith |
| NO | Kellen Moore (2025) | Doug Nussmeier | Brandon Staley | Phil Galiano |
| TB | Todd Bowles (2022) | Zac Robinson | Todd Bowles (no separate DC) | Danny Smith |
| ARI | Mike LaFleur (2026) | Nathaniel Hackett | Nick Rallis | Michael Ghobrial |
| LAR | Sean McVay (2017) | Nate Scheelhaase | Chris Shula | Bubba Ventrone |
| SF | Kyle Shanahan (2017) | Klay Kubiak | Raheem Morris | Brant Boyer |
| SEA | Mike Macdonald (2024) | Brian Fleury | Aden Durde | Jay Harbaugh |

Primary 2026 sources used (live team pages / staff announcements):

- https://www.atlantafalcons.com/news/atlanta-falcons-2026-coaching-staff
- https://www.atlantafalcons.com/news/atlanta-falcons-front-office-coaching-staff-tracker-2026
- https://www.panthers.com/news/panthers-announce-2026-coaching-staff
- https://www.neworleanssaints.com/team/coaches-roster/
- https://www.buccaneers.com/team/coaches-roster/
- https://www.azcardinals.com/team/coaches-roster/
- https://www.therams.com/team/coaches-roster/
- https://www.49ers.com/team/coaches-roster/
- https://www.seahawks.com/news/seattle-seahawks-finalize-2026-coaching-staff

Wikipedia used for NFL job years and head coaches of record, not for inventing 2026 titles.

## Unknowns / caveats

### Scheme (most common unknown)

Official 2026 staff pages almost never name a system. Only two scheme strings were written:

- **ATL DC Jeff Ulbrich** — Falcons tracker: “attack-style defensive system” / “attack-style front” (2025 unit he still runs). No 3-4 / 4-3 on that page.
- **SEA OC Brian Fleury** — Seahawks.com hire story: West Coast offense as run by Klint Kubiak in Seattle, from the Mike Shanahan / Gary Kubiak family.

Everything else is `unknown` because the official page used did not name a scheme. Third-party lists (e.g. “3WR / 4-3”) were not used.

### Play-callers not fully stated for 2026

- **ATL OC** — Stefanski said Rees will call plays (Falcons.com).
- **CAR OC** — Canales said Idzik will call plays in 2026 (Panthers.com).
- **NO OC** — 2025 nola.com said Moore calls plays; Saints.com 2026 bios do not restate 2026 play-caller.
- **LAR OC** — McVay vs Scheelhaase play-caller not stated on Rams.com pages used.
- **SF OC** — Wikipedia (Jan. 8, 2025 promotion) said Shanahan calls plays; 49ers.com 2026 roster does not restate.

### TB defensive coordinator

**No separate DC on the official 2026 Buccaneers coaches roster.** Wikipedia’s 2026 Buccaneers season staff list also starts the defense at pass-game coordinator George Edwards / run-game coordinator Larry Foote. Equivalent recorded as **HC Todd Bowles**. Bowles’s full pre-2019 NFL résumé is not expanded in the JSON (out of scope for the 2026 TB box).

### Saints 2026 vs 2025 staff

No separate “Saints announce 2026 staff” page was found. The live coaches roster (fetched 2026-08-23) and official bios (“second season as OC/STC in 2026”) are the 2026 verification. If a later 2026 change was not posted to that roster, it is not in the file.

### Stale official bios

- **49ers.com** Kubiak bio still says “fifth season” and “first as OC.” Wikipedia: OC from Jan. 8, 2025. Live title is OC. JSON uses 2025–2026 as OC under Shanahan.
- **49ers.com** Boyer bio still says “first” as 49ers STC. Wikipedia hire date Jan. 27, 2025 → 2025–2026.

Wikipedia 2026 49ers season page also listed Chris Foerster as interim HC / OL during Shanahan’s recovery. That is not treated as a coordinator change; Shanahan remains HC on the official roster.

### History rows that are thin or conflicted

- **Craig Aukerman 2013–15** — Wikipedia infobox: Titans assistant ST. Wikipedia body text instead describes Chargers AST years then 2016 STC. Infobox used; conflict flagged in JSON notes. 2013 Titans HC recorded as Mike Munchak (Whisenhunt 2014–15).
- **Jay Harbaugh** — only NFL jobs listed (Ravens 2012–14; Seahawks 2024–26). Michigan 2015–23 omitted (college).
- **Brian Fleury 2016–18 Dolphins** — Wikipedia lists football research titles (front office), not a sideline coach title.
- **Danny Smith Washington years** — Buccaneers hire story says STC in Washington 2004–12; JSON splits that span by HC of record (Gibbs / Zorn / Shanahan). 1999–2000 Lions TE job included because the same hire story lists it; late-2000 HC is Gary Moeller interim after Bobby Ross.
- **Nathaniel Hackett** — Wikipedia: Jan. 29, 2026 Dolphins QBs hire, then Feb. 13 Cardinals OC. JSON only records the Cardinals OC job for 2026 (he did not coach a Dolphins season).
- **Raheem Morris 2006** — Kansas State DC is college; omitted from nfl_history.
- **Klay Kubiak 2013–20** — high school (Strake Jesuit); omitted.

### Not researched as coordinators (on purpose)

Associate / passing-game / run-game titles (Darrell Bevell, Harold Goodwin, Tanner Engstrand, Kliff Kingsbury, Dave Ragone, Matt Eberflus, Jake Peetz, etc.) are not treated as OC/DC/ST unless the club listed no coordinator, which only happened on TB defense.

### ESPN

ESPN coach index was not needed once official roster/news pages and Wikipedia career tables agreed. No ESPN URL is stored as a primary `source`.

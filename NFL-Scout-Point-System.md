# NFL Scout point system — 2026
Draft for review. 19 Aug 2026. 0.0 is league average. Plus is better. We bet a number, not a team.

## What we are doing
Power-rate every club, then price every game. Fire a $150 straight only if our number is about 1.5 points better than the shopped line, or the edge crosses a key (3, then 7). Pass is a result. Process is scored on closing-line value of the straights, not weekly W/L. $50 parlays stay on the card as entertainment and are not part of this grade.

The league is even. No pet teams.

## How a game number is built

**Team rating (stays with the club)**
```
effective = 2025 prior (tapered) + FA + injuries + manual adjust + weekly context
```

**Game extras (only that matchup)**
```
home-field = 2   (0 on a neutral field)
coach H2H  = one coach vs the other, career as HCs
prep       = Week 1 form and/or coming off a bye
```

**Our spread (home perspective, negative = home favored)**
```
our home line = −(home effective − away effective + home-field + coach H2H + prep)
```

Example: home +4, away +1, HFA 2, no coach/prep → our line is home −5.

Edge = market home line − our home line. Gold if |edge| ≥ 1.5 or it crosses 3 or 7. We highlight. We do not auto-bet.

Weather does **not** move the spread. It only shades the total.

---

## 1. 2025 prior (the baseline)
Last year’s 17-game stats, scaled, then blended so a +12 defense does not become a 20-point line.

| Pillar | Scale | What it is | Weight |
|---|---|---|---|
| Offense | −10 to +8 | Points scored / game | 30% |
| Defense | −12 to +12 | Points allowed / game | 35% |
| Special teams | −4 to +4 | Return TDs + FG% vs league | 10% |
| Takeaways | −5 to +5 | Takeaways | 12.5% |
| Giveaways | −5 to +5 | Giveaways (minus is sloppy) | 12.5% |

2025 endpoints we locked: offense Rams 30.5 = +8 / Raiders 14.2 = −10. Defense Seahawks 17.2 = +12 / Cowboys 30.1 = −12.

**Taper:** after n 2026 games, prior weight is (17−n)/17. Week 1 is 100% last year. After 17 games the prior is gone. In-season “current” updates 90/10 (one Sunday is 10%).

FA tapers on the same clock (it is a correction to last year’s roster). Injuries, coaches, and weather do not.

---

## 2. Free agency (roster change since the prior)
One net per club. Surplus vs replacement, not vs peak. Contract size is ignored. Own-team re-signs are 0 (already in 2025). Draft is not FA.

| Tier | Points |
|---|---|
| Star (QB, LT, EDGE1, WR1, CB1) | 1.5 to 2.0 |
| Starter swap | 0.5 to 1.0 |
| Rotational | 0.3 |
| Depth | 0.2 |

One player capped at ±2. Team net capped at ±4. Departing 2025 starters get taken off so we do not double-count them. Week 1 FA is 100%; it fades with the prior.

---

## 3. Injuries (weekly)
A starter out is a number. Official status only (Wed 4pm ET for Thursday, Fri 4pm ET for Sunday, 90-minute inactives). Unofficial DNP is not a row.

Base × status, then negative for that club.

| Position | Base | Status | Multiplier |
|---|---|---|---|
| QB1 | 3.5 | IR / OUT / PUP / NFI | 100% |
| LT | 2.0 | Doubtful | 75% |
| EDGE1 | 1.5 | Questionable | 35% |
| WR1 / CB1 | 1.2 | Probable | 0% |
| RT | 1.0 | | |
| IDL / C | 0.8 | | |
| RB1 | 0.6 | | |
| TE1 / WR2 / S / LB / OG | 0.5 | | |
| K / depth | 0.2 | | |

One player capped at 4.5. Team injury term capped at 6. Does not fade with last year. Comes off when they play.

---

## 4. Home field
+2 to the home club. Neutral (Melbourne, etc.) is 0.

---

## 5. Coach vs coach
Follows the person, not the building. Regular season + playoffs as head coaches. No preseason. Straight-up only (we could not find a clean coach ATS book, so we did not fake one).

```
n < 4                      → 0
|win rate − 0.5| < 0.15    → 0   (dead zone: 8–7, 5–5)
else pts = (rate − 0.5) × 2 × min(1, n/8), capped at ±1.0
```

So 5–0 in five meetings is +0.62. 8–2 in ten is +0.60. 8–11 in nineteen is dead. First-year HCs are 0.

Added to the **home** side of the spread (home coach has the other guy’s number → home favored more).

---

## 6. Extra prep: Week 1 and bye
Same idea: extra practice time. Career as that head coach. **ATS** when the game log has a line. Four of those games minimum, same dead zone, same ±1 cap.

- **Week 1** applies only in week 1.
- **Bye** applies only the week that club is coming off a bye. Week 1 2026 has no byes.

Net is home prep minus away prep.

Current Week 1 ATS that actually print: Jim Harbaugh 6–0 (+0.75), McVay 7–2 (+0.56), Bowles 6–2 (+0.50), Campbell 4–1 (+0.38). Fades: Quinn 2–6 (−0.50), Vrabel 2–5 (−0.38), Taylor 2–5 (−0.38).

Bye movers: Vrabel 6–2 (+0.50), McCarthy 14–6 (+0.40), Sirianni 4–1 (+0.38), Stefanski 1–5 (−0.50). Reid 21–16 after a bye is dead.

---

## 7. Weather (totals only)
Does not move the spread. Dome or a closed roof is 0 no matter the outdoor forecast.

```
our total = market O/U + weather
```

| Wind (mph) | Points |
|---|---|
| under 12 | 0 |
| 12–15 | −1.0 |
| 16–19 | −2.5 |
| 20–24 | −4.0 |
| 25+ | −5.5 |

Plus precip: light −0.5, rain −1.0, snow −1.5. Plus −1 if temp < 15°F. Floor −7. We do not invent September forecasts in August. Type the print when it exists.

---

## 8. Manual override
Adjust on a club is a human plus/minus on top of the algorithm. Context rows are weekly notes with points (scheme, travel, anything that is not already a layer). Those are the only opinion knobs.

---

## What we are not doing
- No letter grades.
- No auto-bet.
- No fading the public as a system. Dogs/unders only late if the public actually pushed the number.
- No preseason coach ATS (different market).
- No SportsDataIO/Sportradar buy for scheme. Shotgun and checkdown rates can come from free play-by-play. Pre-snap motion is a PFF/SIS purchase we have not made.

---

## Questions for you
1. Are the injury bases (QB 3.5, LT 2, EDGE 1.5) in the right neighborhood?
2. Is ±1 enough for “has his number,” or do you want a real 8–2 to be bigger?
3. Should Week 1 / bye stay ATS, or do you want a second SU look?
4. Anything we are double-counting (FA vs injury vs last year’s prior)?
5. What is missing that you would not price a Thursday without?

#!/usr/bin/env python3
"""Wednesday FINAL for Week 12 Wed/Thanksgiving slate (2026-11-25b). Copy of reseed_injury_wednesday_final_w11.py pattern.
Games: Wed GB@LAR (8:00 PM ET, Netflix; final Game Status posted Tuesday), Thu CHI@DET, PHI@DAL, KC@BUF.
Official sources: club injury-report tables (packers.com/therams.com reg-12 Sun/Mon/Tue; detroitlions.com/chicagobears.com,
dallascowboys.com/philadelphiaeagles.com, chiefs.com/buffalobills.com reg-12 Mon/Tue/Wed) + nfl.com Week 12 injury report
article (game statuses, all four games; used for BUF where the club table shows UNSPECIFIED). Pulled 2026-11-25 ~4:25 PM ET.
Only GB/LAR/CHI/DET/PHI/DAL/KC/BUF rows change; other clubs stay on 2026-11-25a (Friday routine finalizes DEN@PIT and Sunday/MNF).
Probable/no game status off the number (dropped); Out/Doubtful on (Doubtful 1.0); Q only with expected-impact judgment.
No invented injuries. Full valuation: data/injury-valuation/weeks/2026-W12-{gb-lar,chi-det,phi-dal,kc-buf}.json (+ 2026-W12-thanksgiving-official-raw.md).
"""
import json
from pathlib import Path
DATA = Path(__file__).resolve().parent
P = DATA / "injury-2026.json"
seed = json.loads(P.read_text())
NFL_ART = "https://www.nfl.com/news/nfl-week-12-injury-report-2026-season"
SRC = {
  "GB": "https://www.packers.com/team/injury-report/week/reg-12", "LAR": "https://www.therams.com/team/injury-report/week/reg-12",
  "CHI": "https://www.chicagobears.com/team/injury-report/week/reg-12", "DET": "https://www.detroitlions.com/team/injury-report/week/reg-12",
  "PHI": "https://www.philadelphiaeagles.com/team/injury-report/week/reg-12", "DAL": "https://www.dallascowboys.com/team/injury-report/week/reg-12",
  "KC": "https://www.chiefs.com/team/injury-report/week/reg-12", "BUF": NFL_ART,
}
def find(team, name):
  for r in seed["teams"][team]:
    if r["name"] == name: return r
  raise KeyError(name)
def drop(team, name):
  n = len(seed["teams"][team]); seed["teams"][team] = [r for r in seed["teams"][team] if r["name"] != name]
  assert len(seed["teams"][team]) == n - 1, name
def add(team, row):
  assert not any(r["name"] == row["name"] for r in seed["teams"][team]), row["name"]
  row.setdefault("source", SRC[team]); row.setdefault("on", True)
  seed["teams"][team].append(row)
def upd(team, name, status, injury, note, impact=None):
  r = find(team, name); r.update(status=status, injury=injury, source=SRC[team], on=True, note=note)
  if impact is not None: r.update(impact=impact, impact_source="manual")
  return r

# ---- GB (Wed game; Tue final report) ----
upd("GB","Micah Parsons","QUESTIONABLE","Knee","Official FINAL Questionable (LP/LP/LP). Was OUT on the ESPN working list. NFL Network says medically cleared/set to play (news, not priced beyond Q). Madden 98 EDGE; auto 0.5 x Q 0.35 = 0.175 expected, about P(miss) 0.1-0.15 x full ~1.0 plus limited-snap mass.")
upd("GB","Josh Jacobs","QUESTIONABLE","Finger","Official FINAL Questionable (LP x3). Finger; expected to play. Auto soft.")
upd("GB","Kevin Zeitler","QUESTIONABLE","Triceps","Official FINAL Questionable (LP x3). RG Madden 81. Auto soft.")
upd("GB","Sean Rhyan","QUESTIONABLE","Ankle","Official FINAL Questionable (LP x3). C/G Madden 70 (Monk on IR). Auto soft.")
upd("GB","Zaire Franklin","QUESTIONABLE","Shin","Official FINAL Questionable (LP x3). Auto soft.")
upd("GB","Bo Melton","QUESTIONABLE","Thigh","Official FINAL Questionable (LP x3). Auto soft.")
upd("GB","Skyy Moore","QUESTIONABLE","Ankle","Official FINAL Questionable (LP x3). Auto soft.")
add("GB", {"name":"Travis Glover","pos":"RT","status":"QUESTIONABLE","injury":"Shoulder","note":"Official FINAL Questionable (-/LP/LP). Swing T/G Madden 64; matters with Bako-Bewele on IR. Auto soft."})
# Musgrave stays OUT (reserve/PUP per ESPN; not on the active-roster practice report).

# ---- LAR ----
upd("LAR","Steve Avila","OUT","Hamstring","Official FINAL Out (DNP x3). LG Madden 83. Manual 0.3 (interior OL cluster with Shelton out, McMahon IR).", 0.3)
upd("LAR","Coleman Shelton","OUT","Hamstring","Official FINAL Out (DNP x3). Was Doubtful (already 1.0). Starting C Madden 81; backup C McMahon on IR, so the snap goes to a guard/depth (Dedich 67). Manual 0.4 vs auto 0.2.", 0.4)
upd("LAR","Terrance Ferguson","OUT","Ankle/Hamstring","Official FINAL Out (DNP x3); ESPN still IR. TE Madden 70; Higbee/Allen/Parkinson healthy. Auto.")
drop("LAR","Myles Garrett")   # official: LP/DNP/LP, no game status -> plays, off
drop("LAR","Kam Curl")        # official: DNP/LP/LP, no game status -> off
drop("LAR","Justin Dedich")   # official FP x3 no status; ESPN Active -> stale IR row
drop("LAR","Kobie Turner")    # official FP x3 no status; ESPN Active -> stale IR row

# ---- CHI ----
upd("CHI","Kyler Gordon","OUT","Shoulder","Official FINAL Out (DNP x3). Slot CB Madden 82 vs DET slot-heavy passing game (St. Brown). Stevenson Q, so CB depth thin. Manual 0.45 vs auto 0.25 cap.", 0.45)
upd("CHI","Roschon Johnson","OUT","Ankle","Official FINAL Out (DNP x3). Rotational RB Madden 72. Auto.")
add("CHI", {"name":"Elijah Hicks","pos":"S","status":"OUT","injury":"Concussion","note":"Official FINAL Out (DNP/DNP). S Madden 67, Bryant on IR. Auto."})
add("CHI", {"name":"Tyrique Stevenson","pos":"CB1","status":"QUESTIONABLE","injury":"Groin","note":"Official FINAL Questionable (LP Wed, first listing). Outside CB; matters with Gordon out. Auto soft (0.35)."})
add("CHI", {"name":"D'Marco Jackson","pos":"LB","status":"QUESTIONABLE","injury":"Elbow","note":"Official FINAL Questionable (FP x3). P(miss) ~0.1. Manual 0.1 soft."})
manual = lambda r, v: r.update(impact=v, impact_source="manual")
manual(find("CHI","D'Marco Jackson"), 0.1)

# ---- DET ----
add("DET", {"name":"Skyler Gill-Howard","pos":"IDL","status":"OUT","injury":"Knee","note":"Official FINAL Out (DNP x3). Rotational DT Madden 65. Auto."})
upd("DET","Ennis Rakestraw Jr.","OUT","Shoulder","Official FINAL Out (DNP x3). Depth/rotational CB (Maddox IR). Auto.")
upd("DET","Chuck Clark","QUESTIONABLE","Hamstring","Official FINAL Questionable (DNP/LP/LP). S Madden 79 (Harper IR). Auto soft.")
upd("DET","DJ Wonnum","QUESTIONABLE","Back","Official FINAL Questionable (DNP/DNP/LP). EDGE with Hutchinson on IR. Auto soft.")
drop("DET","Sam LaPorta")     # official LP/FP/FP, no game status -> off

# ---- PHI ----
add("PHI", {"name":"Arnold Ebiketie","pos":"EDGE1","status":"OUT","injury":"Oblique","note":"Official FINAL Out (DNP x3). OLB Madden 76, rotational edge (Greenard full). Auto."})
upd("PHI","Jonathan Jones","OUT","Ankle","Official FINAL Out (DNP x3). CB Madden 72 (Bennett IR). Auto.")
for n in ("Tanner McKee","Smael Mondon Jr.","Will Shipley","Dallas Goedert","Saquon Barkley"):
  drop("PHI", n)               # official: no game status (McKee/Barkley/Goedert FP Wed) -> off. Hurts IR row unchanged.

# ---- DAL ----
upd("DAL","Tyler Booker","OUT","Ankle","Official FINAL Out (DNP x3). RG Madden 85, high-ankle. Manual 0.35 vs auto 0.25.", 0.35)
upd("DAL","Jake Ferguson","OUT","Knee/Ankle","Official FINAL Out (DNP x3). TE1 Madden 77, Prescott's chain mover. Manual 0.3.", 0.3)
upd("DAL","P.J. Locke","OUT","Concussion","Official FINAL Out (LP x3, concussion). S Madden 74. Auto.")
upd("DAL","Jonathan Mingo","OUT","Ankle","Official FINAL Out (LP/DNP/DNP). WR Madden 71. Auto.")
upd("DAL","Jalen Thompson","QUESTIONABLE","Hamstring","Official FINAL Questionable (FP x3). ESPN had IR then Q; full practice -> likely plays. Manual 0.1 soft.", 0.1)
add("DAL", {"name":"Devin Moore","pos":"CB1","status":"QUESTIONABLE","injury":"Hip","note":"Official FINAL Questionable (FP x3). CB Madden 71 (Bland IR). Manual 0.1 soft."})
manual(find("DAL","Devin Moore"), 0.1)
drop("DAL","Jaishawn Barham")  # no game status -> off
drop("DAL","Dee Winters")      # no game status -> off

# ---- KC ----
upd("KC","Kenneth Walker III","OUT","Groin","Official FINAL Out (DNP/LP/DNP). RB1; B. Smith IR, so depth backs carry it. Auto 0.25 cap holds.")
upd("KC","Jaylon Moore","OUT","Ankle","Official FINAL Out (DNP x3). Swing/RT Madden 72 with Simmons on IR. Auto.")
upd("KC","Noah Gray","QUESTIONABLE","Rib","Official FINAL Questionable (DNP/FP/FP). Likely plays. Auto soft.")
add("KC", {"name":"Omarr Norman-Lott","pos":"IDL","status":"OUT","injury":"Knee","note":"Official FINAL Out (LP x3). Rotational DT Madden 71. Auto."})
add("KC", {"name":"Peter Woods","pos":"IDL","status":"QUESTIONABLE","injury":"Neck","note":"Official FINAL Questionable (FP x3). Manual 0.1 soft."})
manual(find("KC","Peter Woods"), 0.1)
drop("KC","Trey Smith")         # official FP x3, no game status -> off

# ---- BUF (game statuses from nfl.com article; club table shows UNSPECIFIED) ----
upd("BUF","Dalton Kincaid","QUESTIONABLE","Thumb/Ankle","Official FINAL Questionable (LP/LP). TE1 Madden 83. Auto soft.")
upd("BUF","T.J. Sanders","QUESTIONABLE","Shoulder","Official FINAL Questionable (LP/LP). Auto soft.")
upd("BUF","Dorian Williams","QUESTIONABLE","Calf","Official FINAL Questionable (LP/LP). Auto soft.")
upd("BUF","Christian Benford","QUESTIONABLE","Groin","Official FINAL Questionable (DNP/LP). CB1 Madden 80 vs KC passing game; P(miss) ~0.35. Auto soft.")
add("BUF", {"name":"O'Cyrus Torrence","pos":"OG","status":"QUESTIONABLE","injury":"Ankle","note":"Official FINAL Questionable (LP/LP). RG Madden 75. Auto soft."})
drop("BUF","Greg Rousseau")     # LP/FP, no game status -> off
drop("BUF","Damar Hamlin")      # LP/FP, no game status -> off

# ---- Full-valuation manuals on depth rows where the 0.25 pos-base default overstates (no Madden/PFF auto hit or rotational role) ----
for t,n,v,why in [
  ("CHI","Elijah Hicks",0.15,"rotational S Madden 67"),
  ("CHI","Roschon Johnson",0.1,"RB2 Madden 72, lead back healthy"),
  ("DET","Skyler Gill-Howard",0.1,"rotational DT Madden 65"),
  ("DET","Ennis Rakestraw Jr.",0.15,"depth CB"),
  ("DAL","Jonathan Mingo",0.15,"WR3 Madden 71"),
  ("DAL","P.J. Locke",0.2,"starting-ish S Madden 74"),
  ("KC","Omarr Norman-Lott",0.1,"rotational DT Madden 71"),
  ("KC","Jaylon Moore",0.3,"starting RT Madden 72 with Simmons on IR; next man is depth"),
  ("BUF","Christian Benford",0.35,"CB1 Madden 80 vs KC passing game; DNP/LP so P(miss) ~0.35 -> ~0.12 expected"),
]:
  r=find(t,n); r.update(impact=v, impact_source="manual"); r["note"]=r.get("note","")+f" Full valuation manual {v} ({why})."

seed["pulled"]="2026-11-25b"; seed["stamp"]="2026-11-25b"
seed["pulled_et"]="2026-11-25 4:25 PM ET (America/New_York)"; seed["phase"]="FINAL"
seed["sources"]=[NFL_ART]+[v for k,v in SRC.items() if v!=NFL_ART]+["https://www.nfl.com/injuries/league/2026/reg12","https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries"]
seed["note"]=("FINAL 2026-11-25b Week 12 Wed GB@LAR + Thanksgiving CHI@DET, PHI@DAL, KC@BUF after official Game Status (club reg-12 tables + nfl.com Week 12 report). "
 "GB: Parsons OUT->Q (LP x3), Jacobs/Zeitler/Rhyan/Glover/Franklin/Melton/Moore Q. LAR OUT Avila (manual 0.3), Shelton (manual 0.4), T. Ferguson; Garrett/Curl no status off; Dedich/Turner stale IR dropped. "
 "CHI OUT Gordon (manual 0.45), R. Johnson, Hicks; Q Stevenson, D. Jackson (0.1). DET OUT Gill-Howard, Rakestraw; Q Clark, Wonnum; LaPorta off. "
 "PHI OUT Ebiketie, J. Jones; McKee/Barkley/Goedert/Shipley/Mondon off (no status). DAL OUT Booker (0.35), J. Ferguson (0.3), Locke, Mingo; Q Thompson (0.1), D. Moore (0.1). "
 "KC OUT Walker, J. Moore, Norman-Lott; Q Gray, Woods (0.1); T. Smith off. BUF Q Kincaid, Torrence, Sanders, D. Williams, Benford; Rousseau/Hamlin off. "
 "GB/LAR/CHI/DET/PHI/DAL/KC/BUF rows Wed/TNF-protected: later ESPN reseeds must not soften them. Other clubs unchanged from 2026-11-25a WORKING-WED. Doubtful 1.0. Standing manuals preserved.")
P.write_text(json.dumps(seed, indent=2, ensure_ascii=False)+"\n"); print("ok")

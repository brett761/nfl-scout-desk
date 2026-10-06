#!/usr/bin/env python3
"""QB1 tagging rule for the injury sheet, driven by data/qb-depth-2026.json (ESPN depth order).

Why: ESPN's injury feed says only "QB", and the reseed maps every QB to QB1 (1.5-pt cap).
A backup on the report (Week 4: LAC Trey Lance, LV Aidan O'Connell) was then priced as the starter.

Rule, per team:
  acting starter = first QB on the depth list whose sheet status is not OUT/IR/PUP/NFI/DOUBTFUL
  a QB row at or above the acting starter -> "QB1"  (the injured starter, plus a doubtful QB2
                                                     when QB1 is also out: e.g. W5 WSH)
  the team's injured_starter pin, when sidelined -> "QB1" (manual desk pin in qb-depth-2026.json for a
                                                     starter ESPN moved down or off the chart: NYG Dart, W1 starter, IR)
  any other QB row below the acting starter -> "DEPTH" (other-tier cap 0.25)
  a row tagged QB1/QB that is not on the depth list (and not the pin) -> "DEPTH"
This overrides the ROLE table for QBs. A manual impact is kept; only the tag changes. Auto rows
get their impact recomputed with the new tag.

Reseed scripts call apply_qb_depth(new_teams, auto_impact) after building rows, before team terms.
One-off on the live sheet:  python3 data/injury_qb_depth.py [--apply]   (default is a dry run)
"""
import json, re, sys
from pathlib import Path

DATA = Path(__file__).resolve().parent
DEPTH_FILE = DATA / "qb-depth-2026.json"
SIDELINED = {"OUT", "IR", "PUP", "NFI", "DOUBTFUL"}
QB_TAGS = {"QB1", "QB"}


def _k(name):
  s = re.sub(r"[^a-z0-9 ]", "", (name or "").lower().replace(".", ""))
  return "".join(w for w in s.split() if w not in ("jr", "sr", "ii", "iii", "iv", "v"))


def load_depth(path=DEPTH_FILE):
  d = json.loads(Path(path).read_text())
  return {ab: {"order": [_k(n) for n in (v.get("depth") or [])],
               "pin": _k((v.get("injured_starter") or {}).get("name"))}
          for ab, v in d["teams"].items()}


def apply_qb_depth(teams, auto_impact=None, depth=None):
  """Retag QB rows in place. teams = {abbr: [row, ...]}. Returns list of change strings."""
  depth = depth if depth is not None else load_depth()
  changes = []
  for abbr, rows in teams.items():
    info = depth.get(abbr) or {}
    order, pin = info.get("order") or [], info.get("pin") or None
    if not order:
      continue
    status = {_k(r["name"]): (r.get("status") or "").upper() for r in rows}
    acting = next((i for i, n in enumerate(order) if status.get(n, "ACTIVE") not in SIDELINED), len(order) - 1)
    for r in rows:
      key = _k(r["name"])
      old = r.get("pos")
      sidelined = (r.get("status") or "").upper() in SIDELINED
      if key in order and order.index(key) <= acting:
        new = "QB1"
      elif sidelined and key == pin:
        new = "QB1"
      elif key in order or old in QB_TAGS:
        new = "DEPTH"
      else:
        continue
      if new == old:
        continue
      r["pos"] = new
      msg = f"{abbr} {r['name']} {old}->{new} ({r.get('status')}; acting QB: {order[acting]})"
      if auto_impact and r.get("impact_source") != "manual":
        imp, src = auto_impact(abbr, r["name"], new)
        if imp is not None:
          msg += f" impact {r.get('impact')}->{imp}"
          r["impact"], r["impact_source"] = imp, src
      changes.append(msg)
  return changes


if __name__ == "__main__" and "--self-test" not in sys.argv:
  sheet = DATA / "injury-2026.json"
  data = json.loads(sheet.read_text())
  ch = apply_qb_depth(data["teams"])
  print("\n".join(ch) or "no QB tag changes")
  if "--apply" in sys.argv and ch:
    sheet.write_text(json.dumps(data, indent=2) + "\n")
    print("wrote", sheet.relative_to(DATA.parent))


def _self_test():
  depth = {
    "LAC": {"order": [_k("Justin Herbert"), _k("Trey Lance"), _k("DJ Uiagalelei")], "pin": None},
    "LV": {"order": [_k("Kirk Cousins"), _k("Fernando Mendoza"), _k("Aidan O'Connell")], "pin": None},
    "WSH": {"order": [_k("Jayden Daniels"), _k("Marcus Mariota"), _k("Athan Kaliakmanis")], "pin": None},
    "NYG": {"order": [_k("Jameis Winston"), _k("J.J. McCarthy"), _k("Jaxson Dart")], "pin": _k("Jaxson Dart")},
    "CLE": {"order": [_k("Deshaun Watson"), _k("Dillon Gabriel")], "pin": None},
  }
  t = {
    "LAC": [{"name": "Trey Lance", "pos": "QB1", "status": "QUESTIONABLE"}],
    "LV": [{"name": "Aidan O'Connell", "pos": "QB1", "status": "OUT"}, {"name": "Kirk Cousins", "pos": "QB1", "status": "QUESTIONABLE"}],
    "WSH": [{"name": "Jayden Daniels", "pos": "QB1", "status": "OUT"}, {"name": "Marcus Mariota", "pos": "QB1", "status": "DOUBTFUL"},
            {"name": "Athan Kaliakmanis", "pos": "DEPTH", "status": "QUESTIONABLE"}],
    "NYG": [{"name": "Jaxson Dart", "pos": "QB1", "status": "IR"}, {"name": "J.J. McCarthy", "pos": "QB1", "status": "OUT"}],
    "CLE": [{"name": "Dillon Gabriel", "pos": "QB1", "status": "IR", "impact": 0, "impact_source": "manual"},
            {"name": "Myles Garrett", "pos": "EDGE1", "status": "OUT"}],
  }
  calls = []
  apply_qb_depth(t, lambda a, n, p: (calls.append((a, n, p)) or (0.25 if p == "DEPTH" else 1.5), "madden"), depth)
  want = {("LAC", "Trey Lance"): "DEPTH", ("LV", "Aidan O'Connell"): "DEPTH", ("LV", "Kirk Cousins"): "QB1",
          ("WSH", "Jayden Daniels"): "QB1", ("WSH", "Marcus Mariota"): "QB1", ("WSH", "Athan Kaliakmanis"): "QB1",
          ("NYG", "Jaxson Dart"): "QB1", ("NYG", "J.J. McCarthy"): "DEPTH", ("CLE", "Dillon Gabriel"): "DEPTH",
          ("CLE", "Myles Garrett"): "EDGE1"}
  got = {(a, r["name"]): r["pos"] for a, rows in t.items() for r in rows}
  bad = {k: (got[k], v) for k, v in want.items() if got[k] != v}
  assert not bad, f"self-test mismatches (got, want): {bad}"
  assert t["CLE"][0]["impact"] == 0, "manual impact must be kept"
  assert t["LAC"][0]["impact"] == 0.25, "auto impact must be recomputed with the new tag"
  assert ("CLE", "Dillon Gabriel", "DEPTH") not in calls
  print("injury_qb_depth self-test ok (10 cases)")


if __name__ == "__main__" and "--self-test" in sys.argv:
  _self_test()

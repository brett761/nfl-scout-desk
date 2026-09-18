#!/usr/bin/env python3
"""Filter 2026-09-09 vibe-check raw news into a candidate keep set.

Run AFTER the four raw division JSON files land. Does not call X.
Quiet clubs (0 keeps) are OK. No backfill of failed leftovers.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

DATE = "2026-09-09"
HERE = Path(__file__).resolve().parent
VIBE = HERE.parent
RAW_FILES = [
    HERE / f"{DATE}-afc-east-north.json",
    HERE / f"{DATE}-afc-south-west.json",
    HERE / f"{DATE}-nfc-east-north.json",
    HERE / f"{DATE}-nfc-south-west.json",
]
FILTERS_PATH = VIBE / "filters.json"
TEAMS_PATH = VIBE / "teams.json"
OUT_PATH = HERE / f"{DATE}-filtered-candidate.json"

KEEP_CAP = 3
NEWS_CAP = 10


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def item_text_blob(item: dict) -> str:
    """Flexible extract of human-readable story text from varying news shapes."""
    parts: list[str] = []
    for key in (
        "title",
        "name",
        "text",
        "one_line",
        "summary",
        "hook",
        "description",
        "body",
    ):
        val = item.get(key)
        if isinstance(val, str) and val.strip():
            parts.append(val.strip())
    contexts = item.get("contexts")
    if isinstance(contexts, dict):
        topics = contexts.get("topics")
        if isinstance(topics, list):
            parts.extend(str(t) for t in topics if t)
    return "\n".join(parts)


def item_title(item: dict) -> str:
    for key in ("title", "name", "headline"):
        val = item.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    text = item.get("text") or item.get("one_line") or item.get("summary") or ""
    if isinstance(text, str) and text.strip():
        return text.strip().split("\n", 1)[0][:120]
    return "(untitled)"


def item_url(item: dict) -> str | None:
    for key in ("url", "link", "permalink", "share_url"):
        val = item.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    iid = item.get("id")
    if iid is not None and str(iid).strip():
        return f"https://x.com/i/trending/{iid}"
    return None


def item_id(item: dict) -> str | None:
    for key in ("id", "story_id", "trend_id"):
        val = item.get(key)
        if val is not None and str(val).strip():
            return str(val).strip()
    url = item_url(item)
    if url:
        m = re.search(r"/(\d{10,})$", url.rstrip("/"))
        if m:
            return m.group(1)
    return None


def one_line_from(item: dict, max_len: int = 160) -> str:
    """Short paraphrase from story text/title only — no invented facts."""
    preferred = None
    for key in ("one_line", "summary", "hook", "text", "description", "title", "name"):
        val = item.get(key)
        if isinstance(val, str) and val.strip():
            preferred = val.strip()
            break
    if not preferred:
        return ""
    # First sentence-ish chunk
    chunk = re.split(r"(?<=[.!?])\s+", preferred, maxsplit=1)[0].strip()
    chunk = re.sub(r"\s+", " ", chunk)
    if len(chunk) <= max_len:
        return chunk
    cut = chunk[: max_len - 1].rsplit(" ", 1)[0]
    return (cut or chunk[: max_len - 1]).rstrip(".,;:") + "…"


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s.lower()).strip()


def contains_flag(hay: str, flag: str) -> bool:
    f = norm(flag)
    if not f:
        return False
    # word-ish match for short tokens; substring for multi-word phrases
    if " " in f or len(f) >= 5:
        return f in hay
    return re.search(rf"(?<![a-z0-9]){re.escape(f)}(?![a-z0-9])", hay) is not None


def club_identity(team: dict) -> dict[str, Any]:
    abbr = team["abbr"]
    nick = team.get("nick") or ""
    q = team.get("news_query") or team.get("count_query") or ""
    # Pull primary name phrase before OR
    primary = q.split(" OR ")[0].strip()
    # Hashtags
    tags = re.findall(r"#\w+", q)
    aliases = {abbr.lower(), nick.lower(), primary.lower()}
    # City + nick splits
    if primary:
        aliases.add(primary.lower().replace(" ", ""))
    for t in tags:
        aliases.add(t.lower())
    # Common city tokens from primary (drop stopwords)
    stop = {"the", "or", "and"}
    for tok in re.findall(r"[A-Za-z0-9']+", primary):
        if tok.lower() not in stop and len(tok) > 2:
            aliases.add(tok.lower())
    aliases.discard("")
    return {
        "abbr": abbr,
        "nick": nick,
        "primary": primary,
        "aliases": aliases,
        "exclude_key_candidates": [abbr, f"BOS_{abbr}" if abbr == "NE" else abbr],
    }


# Other NFL nicknames / abbrs for wrong-club detection
NFL_NICKS = {
    "ARI": ("Cardinals", "Arizona Cardinals"),
    "ATL": ("Falcons", "Atlanta Falcons"),
    "BAL": ("Ravens", "Baltimore Ravens"),
    "BUF": ("Bills", "Buffalo Bills"),
    "CAR": ("Panthers", "Carolina Panthers"),
    "CHI": ("Bears", "Chicago Bears"),
    "CIN": ("Bengals", "Cincinnati Bengals"),
    "CLE": ("Browns", "Cleveland Browns"),
    "DAL": ("Cowboys", "Dallas Cowboys"),
    "DEN": ("Broncos", "Denver Broncos"),
    "DET": ("Lions", "Detroit Lions"),
    "GB": ("Packers", "Green Bay Packers"),
    "HOU": ("Texans", "Houston Texans"),
    "IND": ("Colts", "Indianapolis Colts"),
    "JAX": ("Jaguars", "Jacksonville Jaguars"),
    "KC": ("Chiefs", "Kansas City Chiefs"),
    "LV": ("Raiders", "Las Vegas Raiders", "Oakland Raiders"),
    "LAC": ("Chargers", "Los Angeles Chargers"),
    "LAR": ("Rams", "Los Angeles Rams"),
    "MIA": ("Dolphins", "Miami Dolphins"),
    "MIN": ("Vikings", "Minnesota Vikings"),
    "NE": ("Patriots", "New England Patriots"),
    "NO": ("Saints", "New Orleans Saints"),
    "NYG": ("Giants", "New York Giants", "NY Giants"),
    "NYJ": ("Jets", "New York Jets", "NY Jets"),
    "PHI": ("Eagles", "Philadelphia Eagles"),
    "PIT": ("Steelers", "Pittsburgh Steelers"),
    "SEA": ("Seahawks", "Seattle Seahawks"),
    "SF": ("49ers", "San Francisco 49ers", "Niners"),
    "TB": ("Buccaneers", "Bucs", "Tampa Bay Buccaneers"),
    "TEN": ("Titans", "Tennessee Titans"),
    "WSH": ("Commanders", "Washington Commanders", "Washington Football"),
}


def mentions_club(hay: str, identity: dict) -> bool:
    for a in identity["aliases"]:
        if len(a) <= 2:
            # abbr only as standalone token
            if re.search(rf"(?<![a-z0-9]){re.escape(a)}(?![a-z0-9])", hay):
                return True
            continue
        if a.startswith("#"):
            if a in hay:
                return True
            continue
        if a in hay:
            return True
    nick = identity["nick"].lower()
    if nick and re.search(rf"(?<![a-z0-9]){re.escape(nick)}(?![a-z0-9])", hay):
        return True
    return False


def other_club_focus(hay: str, this_abbr: str) -> bool:
    """True if story clearly centers another NFL club and not this one."""
    others_hit = []
    for abbr, names in NFL_NICKS.items():
        if abbr == this_abbr:
            continue
        for name in names:
            n = name.lower()
            if n in hay or (
                len(n) <= 3
                and re.search(rf"(?<![a-z0-9]){re.escape(n)}(?![a-z0-9])", hay)
            ):
                others_hit.append(abbr)
                break
    if not others_hit:
        return False
    # If this club is also mentioned, treat as shared/league OK for keep path
    this_names = NFL_NICKS.get(this_abbr, ())
    this_hit = any(n.lower() in hay for n in this_names) or re.search(
        rf"(?<![a-z0-9]){re.escape(this_abbr.lower())}(?![a-z0-9])", hay
    )
    if this_hit:
        return False
    return True


def exclude_terms_for(abbr: str, filters: dict) -> list[str]:
    et = filters.get("exclude_terms") or {}
    terms: list[str] = []
    if abbr in et:
        terms.extend(et[abbr])
    # NE also has BOS_NE bucket in filters.json
    if abbr == "NE" and "BOS_NE" in et:
        terms.extend(et["BOS_NE"])
    return terms


def drop_reason(
    item: dict,
    identity: dict,
    filters: dict,
    kept_titles: list[str],
) -> str | None:
    """Return drop reason string, or None if keepable."""
    hay = norm(item_text_blob(item))
    title_n = norm(item_title(item))
    abbr = identity["abbr"]

    if not hay and not title_n:
        return "empty"

    # Club-specific exclude terms
    for term in exclude_terms_for(abbr, filters):
        if contains_flag(hay, term):
            return f"exclude_terms:{term}"

    for flag in filters.get("other_sport_flags") or []:
        if contains_flag(hay, flag):
            return f"other_sport:{flag}"

    for flag in filters.get("college_flags") or []:
        if contains_flag(hay, flag):
            return f"college:{flag}"

    for flag in filters.get("filler_flags") or []:
        if contains_flag(hay, flag):
            return f"filler:{flag}"

    for flag in filters.get("nostalgia_flags") or []:
        if contains_flag(hay, flag):
            return f"nostalgia:{flag}"

    # Must be about this club
    if filters.get("must_be_about_this_club", True):
        if not mentions_club(hay, identity):
            return "not_about_this_club"

    if other_club_focus(hay, abbr):
        return "wrong_club"

    # Near-duplicate of an already kept title for this club
    for prev in kept_titles:
        if _near_dup(title_n, prev):
            return "near_duplicate"

    return None


def _near_dup(a: str, b: str) -> bool:
    if not a or not b:
        return False
    if a == b:
        return True
    # Simple token overlap
    ta = set(re.findall(r"[a-z0-9]+", a))
    tb = set(re.findall(r"[a-z0-9]+", b))
    if not ta or not tb:
        return False
    inter = len(ta & tb)
    return inter / max(len(ta), len(tb)) >= 0.75


def club_stories(club: dict) -> list[dict]:
    for key in ("stories", "news", "items", "results"):
        val = club.get(key)
        if isinstance(val, list):
            return [x for x in val if isinstance(x, dict)]
    return []


def merge_raw_clubs(raw_paths: list[Path]) -> tuple[list[dict], list[str], list[str]]:
    clubs: list[dict] = []
    loaded: list[str] = []
    missing: list[str] = []
    for path in raw_paths:
        if not path.is_file():
            missing.append(path.name)
            continue
        data = load_json(path)
        loaded.append(path.name)
        if isinstance(data, dict) and isinstance(data.get("clubs"), list):
            clubs.extend(c for c in data["clubs"] if isinstance(c, dict))
        elif isinstance(data, list):
            clubs.extend(c for c in data if isinstance(c, dict))
    return clubs, loaded, missing


def main() -> int:
    if not FILTERS_PATH.is_file():
        print(f"ERROR: filters missing: {FILTERS_PATH}", file=sys.stderr)
        return 1

    filters = load_json(FILTERS_PATH)
    teams_doc = load_json(TEAMS_PATH) if TEAMS_PATH.is_file() else {"teams": []}
    teams_by_abbr = {
        t["abbr"]: t for t in teams_doc.get("teams") or [] if isinstance(t, dict) and t.get("abbr")
    }

    raw_clubs, loaded, missing = merge_raw_clubs(RAW_FILES)
    if missing and not loaded:
        print(
            "ERROR: no raw files present. Awaiting pulls:\n  - "
            + "\n  - ".join(p.name for p in RAW_FILES),
            file=sys.stderr,
        )
        return 2
    if missing:
        print(
            "WARN: missing raw files (continuing with what landed):\n  - "
            + "\n  - ".join(missing),
            file=sys.stderr,
        )

    # Deduplicate clubs by abbr (last wins if repeated)
    by_abbr: dict[str, dict] = {}
    for club in raw_clubs:
        abbr = club.get("abbr") or club.get("team") or club.get("id")
        if not abbr:
            continue
        by_abbr[str(abbr).upper()] = club

    keep_n = int((filters.get("pull") or {}).get("keep") or KEEP_CAP)
    news_n = int((filters.get("pull") or {}).get("news_per_club") or NEWS_CAP)

    out_clubs: list[dict] = []
    dropped_log: list[dict] = []
    pulled = 0
    kept_total = 0
    dropped_total = 0
    quiet: list[str] = []

    # Stable NFL order from teams.json when available
    order = [t["abbr"] for t in teams_doc.get("teams") or [] if t.get("abbr")]
    for abbr in by_abbr:
        if abbr not in order:
            order.append(abbr)

    for abbr in order:
        if abbr not in by_abbr:
            continue
        club = by_abbr[abbr]
        team = teams_by_abbr.get(abbr) or {
            "abbr": abbr,
            "nick": (NFL_NICKS.get(abbr) or (abbr,))[0],
            "news_query": " OR ".join(NFL_NICKS.get(abbr) or (abbr,)),
        }
        identity = club_identity(team)
        stories = club_stories(club)[:news_n]
        pulled += len(stories)

        kept_items: list[dict] = []
        kept_titles: list[str] = []

        for story in stories:
            reason = drop_reason(story, identity, filters, kept_titles)
            title = item_title(story)
            if reason:
                dropped_total += 1
                dropped_log.append({"abbr": abbr, "title": title, "reason": reason})
                continue
            if len(kept_items) >= keep_n:
                # Already full — do not backfill; remaining are leftovers
                dropped_total += 1
                dropped_log.append(
                    {"abbr": abbr, "title": title, "reason": "over_keep_cap"}
                )
                continue
            entry = {
                "title": title,
                "one_line": one_line_from(story),
                "url": item_url(story),
            }
            iid = item_id(story)
            if iid:
                entry["id"] = iid
            kept_items.append(entry)
            kept_titles.append(norm(title))
            kept_total += 1

        if not kept_items:
            quiet.append(abbr)

        out_clubs.append(
            {
                "abbr": abbr,
                "volume": club.get("volume"),
                "items": kept_items,
                "pulled_n": len(stories),
                "kept_n": len(kept_items),
            }
        )

    candidate = {
        "date": DATE,
        "status": "filtered-candidate",
        "source_files": loaded,
        "missing_files": missing,
        "filters": str(FILTERS_PATH),
        "rules": {
            "news_per_club": news_n,
            "keep": keep_n,
            "must_be_about_this_club": bool(filters.get("must_be_about_this_club", True)),
            "no_backfill": True,
            "quiet_ok": True,
        },
        "filter_note": {
            "pulled": pulled,
            "kept": kept_total,
            "dropped": dropped_total,
            "quiet_clubs": quiet,
        },
        "clubs": out_clubs,
        "dropped": dropped_log,
    }

    text = json.dumps(candidate, indent=2, ensure_ascii=False)
    OUT_PATH.write_text(text + "\n", encoding="utf-8")
    print(text)
    print(f"\n# wrote {OUT_PATH}", file=sys.stderr)
    print(
        f"# pulled={pulled} kept={kept_total} dropped={dropped_total} quiet={len(quiet)}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

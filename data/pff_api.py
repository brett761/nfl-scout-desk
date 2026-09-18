#!/usr/bin/env python3
"""Shared PFF API client for nfl-scout desk rebuild scripts.

Loads PFF_API_KEY from env or /home/box/agent-data/box-secrets.json.
Never prints the key. Retries 429s with backoff.
"""
from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

SECRETS = Path("/home/box/agent-data/box-secrets.json")
BASE = "https://api.pff.com"

# PFF franchise abbreviations → desk abbrs (same map as build_pff_layer.py)
PFF_TEAM = {
    "ARZ": "ARI",
    "ATL": "ATL",
    "BLT": "BAL",
    "BUF": "BUF",
    "CAR": "CAR",
    "CHI": "CHI",
    "CIN": "CIN",
    "CLV": "CLE",
    "DAL": "DAL",
    "DEN": "DEN",
    "DET": "DET",
    "GB": "GB",
    "HST": "HOU",
    "IND": "IND",
    "JAX": "JAX",
    "JAC": "JAX",
    "KC": "KC",
    "LA": "LAR",
    "LAR": "LAR",
    "LAC": "LAC",
    "LV": "LV",
    "MIA": "MIA",
    "MIN": "MIN",
    "NE": "NE",
    "NO": "NO",
    "NYG": "NYG",
    "NYJ": "NYJ",
    "PHI": "PHI",
    "PIT": "PIT",
    "SEA": "SEA",
    "SF": "SF",
    "TB": "TB",
    "TEN": "TEN",
    "WAS": "WSH",
    "WSH": "WSH",
}


def load_api_key() -> str:
    key = (os.environ.get("PFF_API_KEY") or "").strip()
    if not key and SECRETS.is_file():
        data = json.loads(SECRETS.read_text())
        card = data.get("card") if isinstance(data, dict) else None
        if isinstance(card, dict):
            key = (card.get("PFF_API_KEY") or "").strip()
        if not key and isinstance(data, dict):
            key = (data.get("PFF_API_KEY") or "").strip()
    if not key or not key.startswith("ak_"):
        raise SystemExit("PFF_API_KEY missing or malformed (set env or box-secrets card.PFF_API_KEY)")
    os.environ["PFF_API_KEY"] = key
    return key


def desk_abbr(pff_abbr: str | None) -> str | None:
    if not pff_abbr:
        return None
    return PFF_TEAM.get(str(pff_abbr).strip().upper())


def pff_get(path: str, params: dict[str, Any] | None = None, timeout: int = 120) -> Any:
    """GET JSON from api.pff.com. path like /v1/teams/overview."""
    key = load_api_key()
    q = urllib.parse.urlencode({k: v for k, v in (params or {}).items() if v is not None})
    url = f"{BASE}{path}" + (f"?{q}" if q else "")
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {key}",
            "Accept": "application/json",
            "User-Agent": "nfl-scout-desk/pff-rebuild",
        },
    )
    last_err: Exception | None = None
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw = resp.read()
                ctype = (resp.headers.get("Content-Type") or "").lower()
                if "json" in ctype or raw[:1] in (b"{", b"["):
                    return json.loads(raw.decode())
                return raw.decode()
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="replace")[:400]
            if e.code == 429:
                time.sleep(min(60, 2**attempt))
                last_err = e
                continue
            raise RuntimeError(f"PFF HTTP {e.code} {path}: {body}") from e
        except (urllib.error.URLError, TimeoutError) as e:
            time.sleep(min(30, 2**attempt))
            last_err = e
            continue
    raise RuntimeError(f"PFF request failed after retries: {path}: {last_err}")


def reg_weeks_with_stats(season: int = 2026, max_week: int = 22) -> list[int]:
    """REG weeks that have at least one charted/scored game."""
    weeks: list[int] = []
    for w in range(1, max_week + 1):
        data = pff_get("/v1/games", {"league": "nfl", "season": season, "week": w})
        games = data.get("games") or []
        if not games:
            # empty week beyond schedule end
            if w > 1 and not weeks:
                continue
            if w > (weeks[-1] + 1 if weeks else 1):
                break
            continue
        if any(g.get("has_stats") for g in games):
            weeks.append(w)
        elif weeks and w > weeks[-1] + 1:
            break
    return weeks


def week_param(weeks: list[int]) -> str:
    return ",".join(str(w) for w in weeks)

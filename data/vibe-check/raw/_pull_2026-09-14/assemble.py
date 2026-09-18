#!/usr/bin/env python3
import json, sys, os
from datetime import datetime, timezone

STAGING = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.dirname(STAGING)
START = "2026-09-14T01:22:00Z"

def volume_meta_from(payload):
    meta = (payload or {}).get("meta") or {}
    buckets = (payload or {}).get("data") or []
    total = meta.get("total_tweet_count")
    if total is None:
        total = sum((b.get("tweet_count") or 0) for b in buckets)
    total = int(total or 0)
    return total, {
        "granularity": "day",
        "start_time": START,
        "total_tweet_count": total,
        "buckets": buckets,
    }

def assemble(group, abbrs, date="2026-09-14", week="reg-2"):
    clubs, errors = [], []
    for abbr in abbrs:
        news_items, vol, vol_meta = [], 0, None
        try:
            with open(os.path.join(STAGING, f"{abbr}-news.json")) as f:
                news_payload = json.load(f)
            if isinstance(news_payload, dict) and news_payload.get("error") and "data" not in news_payload:
                errors.append({"abbr": abbr, "step": "news", "error": str(news_payload.get("error"))})
            else:
                news_items = list((news_payload.get("data") if isinstance(news_payload, dict) else news_payload) or [])
        except Exception as e:
            errors.append({"abbr": abbr, "step": "news", "error": str(e)})
        try:
            with open(os.path.join(STAGING, f"{abbr}-vol.json")) as f:
                vol_payload = json.load(f)
            if isinstance(vol_payload, dict) and vol_payload.get("error") and "data" not in vol_payload and "meta" not in vol_payload:
                errors.append({"abbr": abbr, "step": "volume", "error": str(vol_payload.get("error"))})
            else:
                vol, vol_meta = volume_meta_from(vol_payload if isinstance(vol_payload, dict) else {"data": vol_payload})
        except Exception as e:
            errors.append({"abbr": abbr, "step": "volume", "error": str(e)})
        club = {"abbr": abbr, "volume": vol, "news": news_items}
        if vol_meta is not None:
            club["volume_meta"] = vol_meta
        clubs.append(club)
    out = {
        "date": date,
        "group": group,
        "pulled": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "week": week,
        "clubs": clubs,
        "errors": errors,
    }
    path = os.path.join(RAW, f"{date}-{group}.json")
    with open(path, "w") as f:
        json.dump(out, f, indent=2)
        f.write("\n")
    print(path, "clubs", len(clubs), "errors", len(errors),
          "news", sum(len(c["news"]) for c in clubs),
          "vols", {c["abbr"]: c["volume"] for c in clubs})
    return path

if __name__ == "__main__":
    assemble(sys.argv[1], sys.argv[2].split(","), date=sys.argv[3] if len(sys.argv) > 3 else "2026-09-14", week=sys.argv[4] if len(sys.argv) > 4 else "reg-2")

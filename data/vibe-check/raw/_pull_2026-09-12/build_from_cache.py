#!/usr/bin/env python3
"""Build club *-news.json from story-cache.json + *-ids.json."""
import json, sys, os
from pathlib import Path
ST = Path(__file__).resolve().parent
cache_path = ST / "story-cache.json"
cache = json.loads(cache_path.read_text()) if cache_path.exists() else {}
missing = []
for abbr in sys.argv[1].split(","):
    ids = json.loads((ST / f"{abbr}-ids.json").read_text())
    stories = []
    for i in ids:
        if i in cache:
            stories.append(cache[i])
        else:
            missing.append((abbr, i))
    out = {"data": stories, "meta": {"result_count": len(stories)}}
    (ST / f"{abbr}-news.json").write_text(json.dumps(out) + "\n")
    print(abbr, "news", len(stories), "missing", sum(1 for a,i in missing if a==abbr))
if missing:
    print("MISSING", len(missing))
    for a,i in missing[:20]:
        print(" ", a, i)

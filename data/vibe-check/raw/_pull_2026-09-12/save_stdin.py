#!/usr/bin/env python3
import json, sys, os
STAGING = os.path.dirname(os.path.abspath(__file__))
name = sys.argv[1]  # e.g. ARI-news.json
path = os.path.join(STAGING, name)
data = json.load(sys.stdin)
with open(path, "w") as f:
    json.dump(data, f)
    f.write("\n")
print("wrote", path, "bytes", os.path.getsize(path),
      "keys", list(data.keys()) if isinstance(data, dict) else type(data).__name__)

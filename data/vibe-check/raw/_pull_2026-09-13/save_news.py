#!/usr/bin/env python3
import json,sys,os
st=os.path.dirname(os.path.abspath(__file__))
abbr=sys.argv[1]
data=json.load(sys.stdin)
path=os.path.join(st,f"{abbr}-news.json")
# ensure wrapped
if isinstance(data, list):
    data={"data":data,"meta":{"result_count":len(data)}}
with open(path,"w") as f:
    json.dump(data,f); f.write("\n")
print("wrote", path, "items", len(data.get("data") or []), "bytes", os.path.getsize(path))

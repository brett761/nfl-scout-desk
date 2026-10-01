// Game-day site-parity harness: runs a checkout's app.js (eff / ourHomeSpread) in a Node vm,
// file-backed fetch against that checkout, with the clock pinned to a given instant.
// Usage: node gd_harness.mjs <checkoutRoot> <nowISO> <espnId,...>
import fs from "fs"; import path from "path"; import vm from "vm";
const [ROOT, NOWISO, IDS] = process.argv.slice(2);
const NOW = Date.parse(NOWISO);
const src = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
let bootIdx = src.lastIndexOf("\nwindow.bootDesk = bootDesk;");
if (bootIdx < 0) bootIdx = src.lastIndexOf("\nload();\nloadProfiles();");
if (bootIdx < 0) throw new Error("boot marker not found");
const body = src.slice(0, bootIdx);
function stub(){ const f=function(){return p;}; const p=new Proxy(f,{get(t,k){ if(k===Symbol.toPrimitive) return ()=> ""; if(k==="length")return 0; if(k===Symbol.iterator) return function*(){}; if(k==="then") return undefined; return p;}, set(){return true;}, apply(){return p;}, construct(){return p;}}); return p;}
class FakeDate extends Date { constructor(...a){ if (a.length) super(...a); else super(NOW); } static now(){ return NOW; } }
const store = {}; const fetched = [];
const ctx = {console:{log(){},warn(){},error(){}}, Math, Date: FakeDate, JSON, Number, String, Object, Array, Set, Map, Promise, RegExp, Error, isNaN, parseFloat, parseInt, Intl, encodeURIComponent, decodeURIComponent, Symbol, Infinity, NaN, crypto: globalThis.crypto,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}},
 document:stub(), window:stub(), navigator:stub(), location:{hash:"",search:"",href:"https://bmoneybets.com/"}, history:stub(), setTimeout:()=>0, clearTimeout(){}, setInterval:()=>0, requestAnimationFrame:()=>0, confirm:()=>false, alert(){}, matchMedia:()=>stub(), URLSearchParams, URL,
 fetch: async (u)=>{ const rel=String(u).split("?")[0].replace(/^\.\//,""); const fp=path.join(ROOT,rel); const ok=fs.existsSync(fp); fetched.push((ok?"":"MISSING ")+String(u)); if(!ok) return {ok:false,status:404,json:async()=>null,text:async()=>""}; const t=fs.readFileSync(fp,"utf8"); return {ok:true,status:200,json:async()=>JSON.parse(t),text:async()=>t}; }};
vm.createContext(ctx);
vm.runInContext(body + `\n;globalThis.__api={loadNfl, eff, ourHomeSpread, getNfl:()=>nflData, getHfa:()=>hfa, loadProfiles: typeof loadProfiles==="function"?loadProfiles:null};`, ctx, {filename:"app.js"});
const api = ctx.__api;
if (api.loadProfiles) api.loadProfiles();
await api.loadNfl();
const ids = new Set(String(IDS||"").split(",").filter(Boolean));
const out = [];
for (const g of api.getNfl().games) {
  if (ids.size && !ids.has(String(g.id))) continue;
  const h = api.ourHomeSpread(g, api.getHfa());
  out.push({ espn_id: String(g.id), week: g.week, away: g.away, home: g.home, date: g.date, status: g.status, b_line: Math.round(h*100)/100, eff_home: api.eff(g.home), eff_away: api.eff(g.away), hfa: api.getHfa() });
}
console.log(JSON.stringify({ root: ROOT, now: NOWISO, missing: fetched.filter(f=>f.startsWith("MISSING")), rows: out }));

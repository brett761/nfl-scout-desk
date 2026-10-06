// Site-parity harness: evaluates the live site app.js (B$ line) in a Node vm with file-backed fetch.
// Single source of truth for lock model lines — added 2026-09-27 lock compute fix.
import fs from "fs"; import path from "path"; import vm from "vm";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const src = fs.readFileSync(path.join(ROOT,"app.js"),"utf8");
// Cut before boot. Post sign-in gate (2026-09-28) boot lives in bootDesk(); older app.js booted at top level.
let bootIdx = src.lastIndexOf("\nwindow.bootDesk = bootDesk;");
if (bootIdx < 0) bootIdx = src.lastIndexOf("\nload();\nloadProfiles();");
if (bootIdx < 0) throw new Error("site_parity_harness: boot marker not found in app.js");
const body = src.slice(0, bootIdx);
function stub(){ const f=function(){return p;}; const p=new Proxy(f,{get(t,k){ if(k===Symbol.toPrimitive) return ()=> ""; if(k==="length")return 0; if(k===Symbol.iterator) return function*(){}; if(k==="then") return undefined; return p;}, set(){return true;}, apply(){return p;}, construct(){return p;}}); return p;}
const store={};
const ctx={console:{log(){},warn(){},error(){}}, Math, Date, JSON, Number, String, Object, Array, Set, Map, Promise, RegExp, Error, isNaN, parseFloat, parseInt, Intl, encodeURIComponent, decodeURIComponent, Symbol, Infinity, NaN, crypto: globalThis.crypto,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}},
 document:stub(), window:stub(), navigator:stub(), location:{hash:"",search:"",href:"https://bmoneybets.com/"}, history:stub(), setTimeout:()=>0, clearTimeout(){}, setInterval:()=>0, requestAnimationFrame:()=>0, confirm:()=>false, alert(){}, matchMedia:()=>stub(), URLSearchParams, URL,
 fetch: async (u)=>{ const rel=String(u).split("?")[0].replace(/^\.\//,""); const fp=path.join(ROOT,rel); if(!fs.existsSync(fp)) return {ok:false,status:404,json:async()=>null,text:async()=>""}; const t=fs.readFileSync(fp,"utf8"); return {ok:true,status:200,json:async()=>JSON.parse(t),text:async()=>t}; }};
vm.createContext(ctx);
vm.runInContext(body + `\n;globalThis.__api={loadNfl, eff, ourHomeSpread, algorithmBase, currentRating, taperFor, faTerm, draftTerm, maddenTerm, pffTerm, pffPreTerm, pffYtdTerm, sosTerm, returnTerm, injuryTerm, coachTerm, prepNet, atsNet, schedNet, matchupNet, getNfl:()=>nflData, getHfa:()=>hfa, INCLUDE_FA, INCLUDE_PFF_PRESEASON, priorValue, dvoaBlendShadowHomeSpread: typeof dvoaBlendShadowHomeSpread==='function'?dvoaBlendShadowHomeSpread:null, dvoaBlendShadowRound: typeof dvoaBlendShadowRound==='function'?dvoaBlendShadowRound:null, dvoaBlendShadowBlock: typeof dvoaBlendShadowBlock==='function'?dvoaBlendShadowBlock:null, DVOA_BLEND_SHADOW_WEIGHT: typeof DVOA_BLEND_SHADOW_WEIGHT!=='undefined'?DVOA_BLEND_SHADOW_WEIGHT:null, DVOA_BLEND_SHADOW_FROM_WEEK: typeof DVOA_BLEND_SHADOW_FROM_WEEK!=='undefined'?DVOA_BLEND_SHADOW_FROM_WEEK:null};`, ctx, {filename:"app.js"});
export const api = ctx.__api;
export async function init(){ await api.loadNfl(); return api; }

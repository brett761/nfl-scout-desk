// Writes data/record/canonical-2026.json. Does not edit locks, finals, or line history.
import fs from "fs";
import path from "path";
import { ROOT, buildCanonical } from "./lib.mjs";

const out = buildCanonical();
const dest = path.join(ROOT, "data/record/canonical-2026.json");
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n");
const ats = out.summary.ats;
const clv = out.summary.clv;
const upset = out.summary.upset;
console.log("official", out.summary.games, "ATS", ats.text, ats.pct + "%");
for (const week of out.summary.weeks) console.log("week", week.week, week.text, week.pct + "%");
console.log("CLV avg", clv.avg, "beat", clv.beat, "of", clv.n, clv.beat_pct + "%");
console.log("upsets", upset.upsets, "of", upset.favorites, "calls", upset.correct + "-" + upset.incorrect, upset.pct + "%");
console.log("grading changes", out.grading_changes.length);
console.log("flagged", out.flagged.length);
console.log("open fallbacks", out.open_fallbacks.length);
console.log("validation", out.validation.ok ? "ok" : out.validation.errors.join("; "));
if (!out.validation.ok) process.exit(1);

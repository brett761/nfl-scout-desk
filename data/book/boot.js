import { gradeBook, rollup } from "./grade.js?v=atsclv0930";

window.BMBBook = { gradeBook, rollup };
window.dispatchEvent(new Event("bmb-book"));

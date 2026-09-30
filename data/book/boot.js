import { gradeBook, rollup } from "./grade.js";

window.BMBBook = { gradeBook, rollup };
window.dispatchEvent(new Event("bmb-book"));

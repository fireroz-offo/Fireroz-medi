import { readFileSync } from "node:fs";
const m = readFileSync("public/privacy.html", "utf8").match(/\{\{[A-Z_]+\}\}/g);
if (m) { console.error("Fill in public/privacy.html:", [...new Set(m)].join(", ")); process.exit(1); }
console.log("Privacy page: no placeholders left.");

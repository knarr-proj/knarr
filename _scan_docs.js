const fs = require("fs");
const path = require("path");
function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith(".md")) acc.push(p);
  }
  return acc;
}
const files = walk("c:/Projects/knarr/docs");
for (const f of files) {
  const t = fs.readFileSync(f, "utf8");
  const blocks = [...t.matchAll(/```(?:yaml|gotemplate)\n([\s\S]*?)```/g)];
  let missing = 0;
  for (const m of blocks) {
    const b = m[1];
    if (b.includes("Impossible") || b.includes("# $") || b.includes("$Values =") || b.includes("$Var =")) continue;
    if (b.includes("{{") && !b.includes("!")) continue; // helm-only, skip count? still want values
    missing++;
  }
  if (missing) console.log(missing, f.replace(/\\/g, "/"));
}

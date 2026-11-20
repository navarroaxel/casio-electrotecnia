// Writes every program as a .g1m (g1m/) and as plain text (listings/), straight from the listings in src/lib/.
import { mkdirSync, writeFileSync } from "node:fs";
import { buildG1m } from "../src/lib/casioG1m";
import { POLIARM_LINES, POLIARM_NAME } from "../src/lib/poliarm";

const PROGRAMS: [string, string[]][] = [[POLIARM_NAME, POLIARM_LINES]];

mkdirSync("g1m", { recursive: true });
mkdirSync("listings", { recursive: true });
for (const [name, lines] of PROGRAMS) {
  const g1m = buildG1m(name, lines);
  writeFileSync(`g1m/${name}.g1m`, g1m);
  writeFileSync(`listings/${name}.txt`, lines.join("\n") + "\n");
  console.log(`${name.padEnd(9)} ${String(lines.length).padStart(4)} lines  ${String(g1m.length).padStart(6)} bytes`);
}

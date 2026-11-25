import { newGfx, newMem, runBasic, type Gfx } from "./casioBasic";
import { POLIARM_LINES } from "../poliarm";
import { POLITRI_LINES } from "../politri";
import { TRIFAS_LINES } from "../trifas";

// Screens the user reads: the "EXE" in the corner of the last line (columns 19-21) must not sit on top of anything, and no
// text may run off the 21 columns. Every result screen of the three programs is checked, in the typical flows.
const width = (v: number | string) => (typeof v === "string" ? v.length : String(+v.toFixed(2)).length);
const check = (gfx: Gfx) => {
  let hints = 0;
  for (const sc of gfx.screens) {
    const hint = sc.find((x) => x[0] === 19 && x[1] === 7 && x[2] === "EXE");
    for (const [c, , v] of sc) expect(c + width(v) - 1).toBeLessThanOrEqual(21 + 1e-9);
    if (!hint) continue;
    hints++;
    for (const [c, r, v] of sc) if (r === 7 && !(c === 19 && v === "EXE")) expect(c + width(v) - 1).toBeLessThan(19);
  }
  return hints;
};
const run = (lines: string[], inputs: number[], keys?: number[]) => {
  const g = newGfx();
  runBasic(lines, inputs, g, newMem(), keys);
  return g;
};
const K = { TENS: 72, CARGA: 62, SOLVE: 52, BANCO: 73, FASOR: 63, VATIM: 53, EXIT: 71 };
const FIG = [0, 1, 0, 1, 1, 2, 100000, 60]; // TENSIONES default, star with neutral, symmetric, 100 kVA at 60°

describe("the result screens say EXE and nothing is under it", () => {
  test("TRIFAS: RESOLVER (5 screens, star without neutral), the bank, the wattmeters, the loads", () => {
    const flows: [number[], number[]][] = [
      [[0, 1, 0, 2, 0, 1, 10, 0, 15, 30, 10, -30], [K.TENS, K.CARGA, K.SOLVE, K.EXIT]],
      [[0, 1, 0, 3, 0, 1, 10, 0, 15, 30, 10, -30], [K.TENS, K.CARGA, K.SOLVE, K.EXIT]],
      [[...FIG, 2, 0, 1, 3, 2], [K.TENS, K.CARGA, K.SOLVE, K.BANCO, K.VATIM, K.EXIT]],
      [[0, 1, 220, 2, 10, 2193.93], [K.VATIM, K.EXIT]], // one wattmeter
      [[0, 2, 1000, 500], [K.VATIM, K.EXIT]], // Aron
      [[0, 1, 0, 1, 1, 4, 2, 40, 0.8, 1.8, 1], [K.TENS, K.CARGA, K.EXIT]], // several loads
      [[0, 1, 0, 1, 0, 5, 60, 0.85, 24, 1, 15, 1, 9, 1], [K.TENS, K.CARGA, K.SOLVE, K.EXIT]], // 615
    ];
    let hints = 0;
    for (const [inputs, keys] of flows) hints += check(run(TRIFAS_LINES, inputs, keys));
    expect(hints).toBeGreaterThan(12);
  });
  test("POLITRI: both modes", () => {
    let hints = check(run(POLITRI_LINES, [1, 2, 2, 1, 0.314, 0, 1, 5, 1, 206.4, 0, 3, 49, 0, 5, 40, 0, 7, 41.3, 0, 9, 9.8, 0, 0]));
    hints += check(run(POLITRI_LINES, [2, 2, 2, 20, 30, 20, -90, 20, 150, 12, 0, 8, 120, 4, -120, 0]));
    expect(hints).toBeGreaterThan(1);
  });
  test("POLIARM: the results screens", () => {
    const ARM = [1, 50, 3, 1, 311, 0, 42.42, 0, 2, 0, 35.35, -30, 3, 0, 14.142, 60];
    const RAM = [2, 10, 17.32, 0, 20, 0, 0];
    const g = run(POLIARM_LINES, [0, ...ARM, ...RAM, 100], [72, 62, 73, 71]);
    expect(check(g)).toBeGreaterThan(0);
  });
});

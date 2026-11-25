import { newGfx, newMem, runBasic } from "./casioBasic";
import { TRIFAS_LINES } from "../trifas";
import { POLITRI_LINES } from "../politri";
import { KEY, banco, cargaZ, exit, flow, go, nuevo, press, solve, tens, typed } from "./flows";

// The menus and submenus work like the main one: ▲ ▼ move the > marker, EXE chooses, the number key of an item chooses it at once,
// EXIT (or 0) leaves a submenu with nothing done. The tests drive them with the keys of a user.
const Z3: [number, number][] = [[10, 0], [15, 30], [10, -30]];
const base = () => flow(nuevo(), tens(), cargaZ(1, Z3), solve());
const rowOf = (g: ReturnType<typeof newGfx>, label: string) => {
  for (const sc of [...g.screens].reverse()) {
    const l = sc.find((x) => x[2] === label && x[0] === 1);
    if (l) return sc.filter((x) => x[1] === l[1]).map((x) => x[2]);
  }
  return undefined;
};
const MAIN_BANCO = 73; // the number key of item 4 of the main menu

describe("submenus: arrows + EXE, the number key, EXIT", () => {
  test("▼ then EXE on the BANCO C menu chooses its second item (COS FI OBJETIVO), as the key 2 does", () => {
    const byKey = go(TRIFAS_LINES, flow(base(), banco(2, [50, 1]), exit()));
    const byArrows = go(TRIFAS_LINES, flow(base(), press(MAIN_BANCO, KEY.DOWN, KEY.EXE), typed(50, 1), exit()));
    expect(rowOf(byArrows, "C µF")).toEqual(rowOf(byKey, "C µF"));
    expect(rowOf(byArrows, "C µF")).toBeDefined();
  });
  test("▲ from the first item wraps to the last one (QUITAR BANCO): nothing is asked and no bank screen is shown", () => {
    const g = go(TRIFAS_LINES, flow(base(), press(MAIN_BANCO, KEY.UP, KEY.EXE), exit()));
    expect(rowOf(g, "ILR")).toBeUndefined();
  });
  test("EXIT (and the key 0) leave a submenu with nothing done, back to the main menu", () => {
    for (const leave of [KEY.EXIT, 71]) {
      const g = go(TRIFAS_LINES, flow(base(), press(MAIN_BANCO, leave), exit()));
      expect(rowOf(g, "ILR")).toBeUndefined();
      // the main menu was drawn again after the submenu
      const mains = g.screens.filter((sc) => sc.some((x) => x[2] === "TENSIONES¹"));
      expect(mains.length).toBeGreaterThanOrEqual(2);
    }
  });
  test("each item of a submenu ends with the number key that chooses it, and the marker starts on the first", () => {
    const g = go(TRIFAS_LINES, flow(base(), press(MAIN_BANCO, KEY.EXIT), exit()));
    const sc = g.screens.find((s) => s.some((x) => x[2] === "BANCO C EN TRIANGULO"))!;
    const items = sc.filter((x) => x[0] === 3).map((x) => x[2]);
    expect(items).toEqual(["C CONOCIDO¹", "COS FI OBJETIVO²", "QUITAR BANCO³"]);
    expect(sc.filter((x) => x[0] === 1 && x[2] === ">").pop()![1]).toBe(2); // the first item is on line 2
  });
  test("the reference menu: EXE on the first item and EXIT are both the usual case (U_RN = 220 V at 90°)", () => {
    const run = (refKeys: number[]) => {
      const f = flow(nuevo(), press(72 /* TENSIONES */, 72 /* RST */, ...refKeys), cargaZ(1, [[10, 0], [10, 0], [10, 0]]), solve(), exit());
      return rowOf(go(TRIFAS_LINES, f), "IR")!;
    };
    const exe = run([KEY.EXE]);
    expect(exe[1]).toBeCloseTo(22, 2);
    expect(exe[2]).toBeCloseTo(90, 2);
    expect(run([KEY.EXIT])).toEqual(exe);
  });
  test("the sequence menu: ▼ then EXE is the inverse sequence RTS (S and T swapped)", () => {
    const run = (seqKeys: number[]) =>
      go(TRIFAS_LINES, flow(nuevo(), press(72 /* TENSIONES */, ...seqKeys, 72 /* usual reference */), cargaZ(1, Z3), solve(), exit()));
    const direct = rowOf(run([KEY.EXE]), "IS")!, inverse = rowOf(run([KEY.DOWN, KEY.EXE]), "IS")!;
    expect(inverse[1]).toBeCloseTo(direct[1] as number, 2); // the same modulus, 220 V / 15 Ω
    expect(direct[2]).toBeCloseTo(-60, 2); // U_S at −30° (U_R at 90°), the load at 30°
    expect(Math.abs(inverse[2] as number)).toBeCloseTo(180, 2); // U_S at 210°: the other phase order
  });
});

describe("the start menu: EXIT keeps the stored data", () => {
  test("NUEVOS clears them, EXIT / SEGUIR GUARDADOS keep them", () => {
    const mem = newMem();
    runBasic(TRIFAS_LINES, flow(nuevo(), tens(), exit()).inputs, newGfx(), mem, flow(nuevo(), tens(), exit()).keys);
    const stored = mem.L[2]?.[1]; // the imaginary part of U_R (220 V at 90°) is in List 2
    expect(Math.abs(stored as number)).toBeGreaterThan(200);
    runBasic(TRIFAS_LINES, [], newGfx(), mem, [71 /* EXIT at the start */, 71]);
    expect(mem.L[2][1]).toBe(stored);
    runBasic(TRIFAS_LINES, [], newGfx(), mem, [62 /* 2 SEGUIR GUARDADOS */, 71]);
    expect(mem.L[2][1]).toBe(stored);
    runBasic(TRIFAS_LINES, [], newGfx(), mem, [72 /* 1 NUEVOS */, 71]);
    expect(mem.L[2][1]).toBe(0);
  });
});

describe("POLITRI: its menus", () => {
  test("the main menu by arrows (▼ EXE = DESEQUILIBRADA) and 0 leaves", () => {
    const g = newGfx();
    // ▼ EXE: unbalanced; rms values (the menu key 2); one harmonic: I = 10 A at 0° on each phase; then 0 leaves
    runBasic(POLITRI_LINES, [1, 10, 0, 10, 0, 10, 0], g, newMem(), [KEY.DOWN, KEY.EXE, 62, 71]);
    expect(rowOf(g, "IR EF")![1]).toBeCloseTo(10, 2);
    expect(rowOf(g, "I NEUTRO")![1]).toBeCloseTo(30, 2); // three equal currents in phase add up in the neutral
  });
});

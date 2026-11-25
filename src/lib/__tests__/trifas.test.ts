import { newGfx, newMem, runBasic } from "./casioBasic";
import { KEY as KEYS, banco, carga, cargaZ, exit, fasor, flow, go, nuevo, solve, tens, vatim, verCarga, type Flow } from "./flows";
import { buildG1m, programBytes } from "../casioG1m";
import { TRIFAS_LINES, aron, angle, mag, oneWattmeter, solveThreePhase, type ThreePhaseInput } from "../trifas";

const EX1: ThreePhaseInput = {
  sequence: "RST", ref: "ST", value: 294.2, angle: 0, connection: "Y4",
  Z: [[10, 0], [15, 30], [10, -30]], // Z_R, Z_S, Z_T of the exercise
};
// TENSIONES + CARGA by impedance, from a model input: the sequence, the reference (with its value and angle) and the three Z
const REF = { RN: 1, SN: 2, TN: 3, RS: 4, ST: 5, TR: 6 } as const;
const fromInput = (conn: number, input: ThreePhaseInput): Flow =>
  flow(tens({ seq: input.sequence === "RST" ? 1 : 2, ref: REF[input.ref], value: input.value, angle: input.angle }), cargaZ(conn, input.Z));
const at = (c: [number, number]) => `${mag(c).toFixed(3)} ∠${angle(c).toFixed(1)}°`;

describe("solveThreePhase: exercise 1 (4 wires, U_ST = 294,2 ∠0° V, RST, unbalanced star)", () => {
  const r = solveThreePhase(EX1);
  test("phase voltages follow from U_ST (U_RN = 169,9 ∠90°) and give U_ST back", () => {
    expect(at(r.U[0])).toBe("169.856 ∠90.0°");
    expect(at(r.U[1])).toBe("169.856 ∠-30.0°");
    const ust: [number, number] = [r.U[1][0] - r.U[2][0], r.U[1][1] - r.U[2][1]];
    expect(mag(ust)).toBeCloseTo(294.2, 9);
    expect(angle(ust)).toBeCloseTo(0, 9);
  });
  test("line currents and the neutral current (I_N = I_R + I_S + I_T)", () => {
    expect(at(r.I[0])).toBe("16.986 ∠90.0°");
    expect(at(r.I[1])).toBe("11.324 ∠-60.0°");
    expect(at(r.I[2])).toBe("16.986 ∠-120.0°");
    expect(at(r.IN!)).toBe("8.046 ∠-110.6°");
  });
  test("powers: Σ U_k²/|Z_k| cos φ_k, and each phase obeys Ohm", () => {
    const P = r.U.reduce((s, u, k) => s + (mag(u) ** 2 / EX1.Z[k][0]) * Math.cos((EX1.Z[k][1] * Math.PI) / 180), 0);
    const Q = r.U.reduce((s, u, k) => s + (mag(u) ** 2 / EX1.Z[k][0]) * Math.sin((EX1.Z[k][1] * Math.PI) / 180), 0);
    expect(r.P).toBeCloseTo(P, 6);
    expect(r.Q).toBeCloseTo(Q, 6);
    r.I.forEach((i, k) => expect(mag(i) * EX1.Z[k][0]).toBeCloseTo(mag(r.U[k]), 9));
  });
  test("inverse sequence RTS swaps the phases S and T", () => {
    const inv = solveThreePhase({ ...EX1, sequence: "RTS", ref: "RN", value: 220, angle: 0 });
    expect(angle(inv.U[1])).toBeCloseTo(120, 9);
    expect(angle(inv.U[2])).toBeCloseTo(-120, 9);
    const dir = solveThreePhase({ ...EX1, sequence: "RST", ref: "RN", value: 220, angle: 0 });
    expect(angle(dir.U[1])).toBeCloseTo(-120, 9);
  });
});

describe("solveThreePhase: the circuit's own laws", () => {
  test("star without neutral: ΣI = 0, V = Z·I, and with a balanced load the neutral does not move", () => {
    const y3 = solveThreePhase({ ...EX1, connection: "Y3" });
    expect(Math.hypot(...[0, 1].map((c) => y3.I[0][c] + y3.I[1][c] + y3.I[2][c]))).toBeLessThan(1e-9);
    expect(mag(y3.UNN!)).toBeGreaterThan(1);
    y3.I.forEach((i, k) => expect(mag(i) * EX1.Z[k][0]).toBeCloseTo(mag(y3.V[k]), 9));
    const bal = solveThreePhase({ ...EX1, connection: "Y3", Z: [[10, 20], [10, 20], [10, 20]] });
    expect(mag(bal.UNN!)).toBeLessThan(1e-9);
    const bal4 = solveThreePhase({ ...EX1, connection: "Y4", Z: [[10, 20], [10, 20], [10, 20]] });
    expect(mag(bal4.IN!)).toBeLessThan(1e-9);
  });
  test("delta: ΣI = 0, balanced |I_line| = √3 |I_phase|, powers are Σ V·I*", () => {
    const bal = solveThreePhase({ ...EX1, connection: "D", Z: [[30, 25], [30, 25], [30, 25]] });
    expect(Math.hypot(...[0, 1].map((c) => bal.I[0][c] + bal.I[1][c] + bal.I[2][c]))).toBeLessThan(1e-9);
    expect(mag(bal.I[0])).toBeCloseTo(Math.sqrt(3) * mag(bal.Ielem[0]), 9);
    const UL = 294.2;
    expect(bal.P).toBeCloseTo(3 * (UL ** 2 / 30) * Math.cos((25 * Math.PI) / 180), 6);
  });
});

describe("wattmeters", () => {
  test("exercise 2: W1 = 2193,93 W, 10 A, 220 V phase → Q = √3·W1 = 3800 var, S = 6600 VA, P ≈ 5396 W", () => {
    const r = oneWattmeter(220 * Math.sqrt(3), 10, 2193.93);
    expect(r.Q).toBeCloseTo(3800, 1);
    expect(r.S).toBeCloseTo(6600, 6);
    expect(r.P).toBeCloseTo(5396.3, 1);
    expect(r.phi).toBeCloseTo(35.15, 2);
  });
  test("Aron: W1 = U·I·cos(30° − φ), W2 = U·I·cos(30° + φ) give back P, Q and φ", () => {
    for (const phi of [-50, -20, 0, 20, 60]) {
      const UL = 380, I = 12, f = (phi * Math.PI) / 180;
      const W1 = UL * I * Math.cos(Math.PI / 6 - f), W2 = UL * I * Math.cos(Math.PI / 6 + f);
      const r = aron(W1, W2);
      expect(r.P).toBeCloseTo(Math.sqrt(3) * UL * I * Math.cos(f), 6);
      expect(r.Q).toBeCloseTo(Math.sqrt(3) * UL * I * Math.sin(f), 6);
      expect(r.phi).toBeCloseTo(phi, 6);
    }
  });
});

describe("TRIFAS listing run by the interpreter", () => {
  const K = { TENS: 72, CARGA: 62, SOLVE: 52, BANCO: 73, FASOR: 63, MED: 53, EXIT: 71, ARON: 62, ONE: 72 };
  const rows = (gfx: ReturnType<typeof newGfx>, label: string) => {
    for (const sc of gfx.screens) {
      const l = sc.find((x) => x[2] === label && x[0] === 1);
      if (l) return sc.filter((x) => x[1] === l[1]).map((x) => x[2]);
    }
    return undefined;
  };
  const within = (v: unknown, ref: number, tol = 0.0051) => expect(Math.abs((v as number) - ref)).toBeLessThanOrEqual(tol);
  const run = (conn: 1 | 2 | 3, input: ThreePhaseInput) => go(TRIFAS_LINES, flow(nuevo(), fromInput(conn, input), solve(), exit()));

  test("exercise 1 (4 wires): IA, IB, IC, IN, P, Q, S as the model", () => {
    const gfx = run(1, EX1);
    const m = solveThreePhase(EX1);
    for (const [label, c] of [["IR", m.I[0]], ["IS", m.I[1]], ["IT", m.I[2]], ["IN", m.IN!]] as const) {
      const r = rows(gfx, label)!;
      within(r[1], mag(c));
      within(r[2], angle(c));
    }
    within(rows(gfx, "P W")![1], m.P);
    within(rows(gfx, "Q VAR")![1], m.Q);
    within(rows(gfx, "S VA")![1], m.S);
  });
  test("star without neutral: the displacement of the neutral and the voltages on the load", () => {
    const inp = { ...EX1, connection: "Y3" as const };
    const gfx = run(2, inp);
    const m = solveThreePhase(inp);
    within(rows(gfx, "UNN")![1], mag(m.UNN!));
    within(rows(gfx, "UNN")![2], angle(m.UNN!));
    ["UR", "US", "UT"].forEach((l, k) => { within(rows(gfx, l)![1], mag(m.V[k])); within(rows(gfx, l)![2], angle(m.V[k])); });
    within(rows(gfx, "IR")![1], mag(m.I[0]));
  });
  test("delta: line and phase currents (with an inverse sequence and a phase reference)", () => {
    const inp: ThreePhaseInput = { sequence: "RTS", ref: "TN", value: 127, angle: 15, connection: "D", Z: [[20, 40], [30, -10], [25, 0]] };
    const gfx = run(3, inp);
    const m = solveThreePhase(inp);
    ["IR", "IS", "IT"].forEach((l, k) => { within(rows(gfx, l)![1], mag(m.I[k])); within(rows(gfx, l)![2], angle(m.I[k])); });
    ["IRS", "IST", "ITR"].forEach((l, k) => { within(rows(gfx, l)![1], mag(m.Ielem[k])); within(rows(gfx, l)![2], angle(m.Ielem[k])); });
    within(rows(gfx, "P W")![1], m.P);
  });
  test("every reference (6) × sequence (2) gives the same phase voltages as the model", () => {
    for (const ref of ["RN", "SN", "TN", "RS", "ST", "TR"] as const)
      for (const sequence of ["RST", "RTS"] as const) {
        const inp: ThreePhaseInput = { sequence, ref, value: 230, angle: -40, connection: "Y3", Z: [[10, 0], [10, 0], [10, 0]] };
        const gfx = run(2, inp);
        const m = solveThreePhase(inp);
        ["UR", "US", "UT"].forEach((l, k) => { within(rows(gfx, l)![1], mag(m.V[k])); within(rows(gfx, l)![2], angle(m.V[k])); });
      }
  });
  test("the arctangent is right in every quadrant and near the axes (Aron: φ from P and Q)", () => {
    for (const [W1, W2] of [[1000, 500], [500, 1000], [-300, 900], [-900, -100], [-100, -900], [100, -900], [1000, 1000], [1000, -1000], [3, 1e-9], [0.001, 700]]) {
      const gfx = go(TRIFAS_LINES, flow(nuevo(), vatim(2, [], [W1, W2]), exit())); // VATIMETROS, 2 = ARON
      const m = aron(W1, W2);
      const r = rows(gfx, "FI GRADOS")!;
      expect(Math.abs((r[1] as number) - m.phi)).toBeLessThanOrEqual(0.0051);
      within(rows(gfx, "P W")![1], m.P);
      within(rows(gfx, "Q VAR")![1], m.Q);
    }
  });
  test("one wattmeter (exercise 2) from the listing", () => {
    const gfx = go(TRIFAS_LINES, flow(nuevo(), vatim(1, [2], [220, 10, 2193.93]), exit())); // 1 = UN VATIMETRO: U 220, 2 = FASE, I 10, W1
    const m = oneWattmeter(220 * Math.sqrt(3), 10, 2193.93);
    within(rows(gfx, "Q VAR")![1], m.Q);
    within(rows(gfx, "S VA")![1], m.S);
    within(rows(gfx, "P W")![1], m.P);
    within(rows(gfx, "FI GRADOS")![1], m.phi);
  });
  test("the file", () => {
    expect(() => programBytes(TRIFAS_LINES)).not.toThrow();
    expect(buildG1m("TRIFAS", TRIFAS_LINES).length).toBeLessThan(20000);
  });
});

describe("FASORIAL: the phasor diagram drawn by the listing", () => {
  const K = { TENS: 72, CARGA: 62, SOLVE: 52, FASOR: 63, EXIT: 71, EXE: 31, PLUS: 42, MINUS: 32, UP: 28, DOWN: 37, LEFT: 38, RIGHT: 27 };
  const draw = (conn: 1 | 2 | 3, input: ThreePhaseInput, keys: number[] = [K.EXE, K.EXE]) => {
    const gfx = go(TRIFAS_LINES, flow(nuevo(), fromInput(conn, input), solve(), fasor(keys), exit()));
    return gfx.pages.slice(1); // page 0 is what came before the first Cls (one page per drawing: a zoom or a pan draws again)
  };
  // the long segments are the phasors and edges; the barbs (two per arrow) are short
  const near = (a: number, b: number, tol: number) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);
  const hasSegment = (segs: number[][], x1: number, y1: number, x2: number, y2: number, tol: number) =>
    segs.some((s) => Math.hypot(s[0] - x1, s[1] - y1) < tol && Math.hypot(s[2] - x2, s[3] - y2) < tol);
  // what stays on the screen: every segment end inside the window, every text inside Text's range
  const inside = (p: ReturnType<typeof newGfx>["pages"][number]) => {
    const [x0, x1, , y0, y1] = p.window!;
    for (const s of p.segments) {
      expect(s[0]).toBeGreaterThanOrEqual(x0 - 1e-9); expect(s[2]).toBeLessThanOrEqual(x1 + 1e-9);
      expect(Math.min(s[1], s[3])).toBeGreaterThanOrEqual(y0 - 1e-9); expect(Math.max(s[1], s[3])).toBeLessThanOrEqual(y1 + 1e-9);
    }
    for (const [r, c] of p.texts) { expect(r).toBeGreaterThanOrEqual(1); expect(r).toBeLessThanOrEqual(57); expect(c).toBeGreaterThanOrEqual(1); expect(c).toBeLessThanOrEqual(121); }
  };

  test("4 wires: page 1 has U_R U_S U_T from O and the line-voltage triangle, page 2 the currents and I_N", () => {
    const pages = draw(1, EX1);
    expect(pages).toHaveLength(2);
    const m = solveThreePhase(EX1);
    const [v, c] = pages;
    // equal scale on both axes: the window is twice as wide as high
    for (const p of pages) { const w = p.window!; near((w[1] - w[0]) / (w[4] - w[3]), 2, 1e-9); }
    m.U.forEach((u) => expect(hasSegment(v.segments, 0, 0, u[0], u[1], 1e-6)).toBe(true));
    for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) expect(hasSegment(v.segments, m.U[a][0], m.U[a][1], m.U[b][0], m.U[b][1], 1e-6)).toBe(true);
    [...m.I, m.IN!].forEach((i) => expect(hasSegment(c.segments, 0, 0, i[0], i[1], 1e-6)).toBe(true));
    // the window is fitted to the drawing: the origin and every tip (or I_N) inside, centred on their box, 20 % margin
    const fit = (pts: [number, number][]) => {
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
      const x0 = Math.min(0, ...xs), x1 = Math.max(0, ...xs), y0 = Math.min(0, ...ys), y1 = Math.max(0, ...ys);
      return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, W: 1.2 * Math.max((y1 - y0) / 2, (x1 - x0) / 4) };
    };
    for (const [page, pts] of [[v, m.U], [c, [...m.I, m.IN!]]] as const) {
      const f = fit(pts as [number, number][]), w = page.window!;
      near((w[0] + w[1]) / 2, f.cx, 1e-6); near((w[3] + w[4]) / 2, f.cy, 1e-6); near((w[4] - w[3]) / 2, f.W, 1e-6);
    }
    expect(v.texts.map((t) => t[2])).toEqual(expect.arrayContaining(["R", "S", "T", "O", "U MAX"]));
    expect(c.texts.map((t) => t[2])).toEqual(expect.arrayContaining(["IR", "IS", "IT", "IN", "I MAX"]));
    pages.forEach(inside);
  });
  test("star without neutral: N (the load's neutral) and the voltages N → R S T", () => {
    const inp = { ...EX1, connection: "Y3" as const };
    const pages = draw(2, inp);
    const m = solveThreePhase(inp);
    const n = m.UNN!;
    m.U.forEach((u) => expect(hasSegment(pages[0].segments, n[0], n[1], u[0], u[1], 1e-6)).toBe(true));
    expect(pages[0].plots.some((p) => Math.hypot(p[0] - n[0], p[1] - n[1]) < 1e-6)).toBe(true);
    expect(pages[0].texts.map((t) => t[2])).toContain("N");
    pages.forEach(inside);
  });
  test("delta: the phase currents I_RS I_ST I_TR are drawn next to the line currents", () => {
    const inp: ThreePhaseInput = { sequence: "RTS", ref: "TN", value: 127, angle: 15, connection: "D", Z: [[20, 40], [30, -10], [25, 0]] };
    const pages = draw(3, inp);
    const m = solveThreePhase(inp);
    [...m.I, ...m.Ielem].forEach((i) => expect(hasSegment(pages[1].segments, 0, 0, i[0], i[1], 1e-6)).toBe(true));
    expect(pages[1].texts.map((t) => t[2])).toEqual(expect.arrayContaining(["RS", "ST", "TR"]));
    pages.forEach(inside);
  });
  test("it fits on the screen for every reference, sequence and connection, and for a very unbalanced load", () => {
    for (const conn of [1, 2, 3] as const)
      for (const sequence of ["RST", "RTS"] as const)
        for (const ref of ["RN", "TR"] as const) {
          const inp: ThreePhaseInput = { sequence, ref, value: 380, angle: 90, connection: (["Y4", "Y3", "D"] as const)[conn - 1], Z: [[10, 0], [10, 90], [10, -90]] };
          draw(conn, inp).forEach(inside);
        }
  });
  test("zoom: + shows half-again closer (the half-height ÷ 1,5), − farther, and the same centre", () => {
    const pages = draw(1, EX1, [K.PLUS, K.EXE, K.EXE]); // screen 1 drawn, + → drawn again, EXE; screen 2, EXE
    expect(pages).toHaveLength(3);
    const h = (q: (typeof pages)[number]) => (q.window![4] - q.window![3]) / 2;
    const cx = (q: (typeof pages)[number]) => (q.window![0] + q.window![1]) / 2;
    near(h(pages[1]), h(pages[0]) / 1.5, 1e-9);
    near(cx(pages[1]), cx(pages[0]), 1e-9);
    const out = draw(1, EX1, [K.MINUS, K.EXE, K.EXE]);
    near((out[1].window![4] - out[1].window![3]) / 2, (out[0].window![4] - out[0].window![3]) / 2 * 1.5, 1e-9);
  });
  test("pan: the arrow keys move the window (up / down by half its half-height, left / right by its half-height)", () => {
    const pages = draw(1, EX1, [K.UP, K.LEFT, K.DOWN, K.RIGHT, K.EXE, K.EXE]);
    expect(pages).toHaveLength(6); // the first drawing, four pans, screen 2
    const w0 = pages[0].window!, h = (w0[4] - w0[3]) / 2;
    near(pages[1].window![3] - w0[3], 0.5 * h, 1e-9); // up
    near(pages[2].window![0] - w0[0], -h, 1e-9); // left, from the already panned view
    near(pages[3].window![3] - w0[3], 0, 1e-9); // down again
    near(pages[4].window![0] - w0[0], 0, 1e-9); // right again
  });
  test("the zoomed view still draws every phasor, with the labels on the screen", () => {
    const pages = draw(1, EX1, [K.PLUS, K.PLUS, K.PLUS, K.EXE, K.EXE]);
    for (const q of pages) for (const [r, c] of q.texts) { expect(r).toBeGreaterThanOrEqual(1); expect(r).toBeLessThanOrEqual(57); expect(c).toBeGreaterThanOrEqual(1); expect(c).toBeLessThanOrEqual(121); }
  });
  test("the arrowheads are 25° off the shaft and a tenth of the window long", () => {
    const [v] = draw(1, EX1);
    const W = (v.window![4] - v.window![3]) / 2;
    const m = solveThreePhase(EX1);
    const tip = m.U[0];
    const barbs = v.segments.filter((s) => Math.hypot(s[0] - tip[0], s[1] - tip[1]) < 1e-6 && Math.hypot(s[2], s[3]) > 0 && Math.hypot(s[2] - 0, s[3] - 0) > 1e-6 && Math.hypot(s[2] - s[0], s[3] - s[1]) < W);
    expect(barbs.length).toBeGreaterThanOrEqual(2);
    barbs.slice(0, 2).forEach((s) => near(Math.hypot(s[2] - s[0], s[3] - s[1]), 0.1 * W, 1e-3));
  });
});

describe("BANCO C and VATIMETROS (two wattmeters on the real load) from the listing", () => {
  const src = (conn: number, input: ThreePhaseInput) => flow(nuevo(), fromInput(conn, input), solve());
  const run = (f: Flow) => go(TRIFAS_LINES, f);
  const row = (gfx: ReturnType<typeof newGfx>, label: string) => {
    for (const sc of [...gfx.screens].reverse()) { // the last screen that has it (RESOLVER shows Q VAR too, before the bank)
      const l = sc.find((x) => x[2] === label && x[0] === 1);
      if (l) return sc.filter((x) => x[1] === l[1]).map((x) => x[2]);
    }
    return undefined;
  };
  const close = (v: unknown, ref: number, tol: number) => expect(Math.abs((v as number) - ref)).toBeLessThanOrEqual(tol);
  // the exercise of the figure: 100 kVA load, φ = 60° inductive, balanced, U_R = 220∠90°, direct sequence; |Z| = 220²/(100000/3)
  const Z100: [number, number] = [(220 * 220) / (100000 / 3), 60];
  const FIG: ThreePhaseInput = { sequence: "RST", ref: "RN", value: 220, angle: 90, connection: "Y4", Z: [Z100, Z100, Z100] };
  const wattmeter = (u: [number, number], i: [number, number]) => u[0] * i[0] + u[1] * i[1];

  test("figure, bank out, common line S: W_RS = U_RS·I_R·cos(30° + 60°) = 0 and W_TS = 50 kW", () => {
    const g = run(flow(src(1, FIG), vatim(3, [2]), exit())); // 3 = VAT. CARGA REAL, common 2 = S
    close(row(g, "WRS")![1], 0, 0.01);
    close(row(g, "WTS")![1], 50000, 1);
    close(row(g, "SUMA W")![1], 50000, 1);
    close(row(g, "P W")![1], 50000, 1);
  });
  test("guide 608 (22∠0°, 38∠90°, 38∠−90°; star without neutral): W_RT = 3290 W, W_ST = −1100 W, P = 2200 W", () => {
    const inp: ThreePhaseInput = { sequence: "RST", ref: "RN", value: 220, angle: 90, connection: "Y3", Z: [[22, 0], [38, 90], [38, -90]] };
    const g = run(flow(src(2, inp), vatim(3, [3]), exit())); // common 3 = T
    // the guide rounds U_L to 380 V (the exact line voltage is 220·√3 = 381,05 V): 1 % of its values
    close(row(g, "WRT")![1], 3290, 33);
    close(row(g, "WST")![1], -1100, 11);
    close(row(g, "SUMA W")![1], 2200, 22);
    // and the listing is the model: W = Re(U·I*)
    const m = solveThreePhase(inp);
    close(row(g, "WRT")![1], wattmeter([m.U[0][0] - m.U[2][0], m.U[0][1] - m.U[2][1]], m.I[0]), 0.01);
    close(row(g, "WST")![1], wattmeter([m.U[1][0] - m.U[2][0], m.U[1][1] - m.U[2][1]], m.I[1]), 0.01);
  });
  test("figure, bank correcting to cos φ' = 1: C = Q/(3ωU_L²), line current in phase with U_R, W_RS = W_TS = 25 kW", () => {
    const g = run(flow(src(1, FIG), banco(2, [50, 1]), vatim(3, [2]), exit())); // BANCO 2 = COS FI OBJETIVO: 50 Hz, 1
    const Q = 100000 * Math.sin(Math.PI / 3);
    const C = Q / (3 * 2 * Math.PI * 50 * 3 * 220 * 220);
    close(row(g, "C µF")![1], C * 1e6, 0.01);
    close(row(g, "Q VAR")![1], 0, 0.5);
    close(row(g, "FP")![1], 1, 1e-6);
    close(row(g, "ILR")![1], 50000 / (3 * 220), 0.01); // P / (3·U_f) with cos φ' = 1
    close(row(g, "ILR")![2], 90, 0.01);
    close(row(g, "WRS")![1], 25000, 1);
    close(row(g, "WTS")![1], 25000, 1);
  });
  test("bank of 100 µF: I_RC = j·3ωC·U_R (a delta of C is a star of 3C) and I_LR = I_R + I_RC; Q and the power factor follow", () => {
    const g = run(flow(src(1, FIG), banco(1, [50, 100]), exit())); // BANCO 1 = C CONOCIDO
    const w = 2 * Math.PI * 50, c = 100e-6, Ur = 220;
    close(row(g, "IRC")![1], 3 * w * c * Ur, 0.01);
    close(row(g, "IRC")![2], 180, 0.01);
    const m = solveThreePhase(FIG);
    const ilr: [number, number] = [m.I[0][0] - 3 * w * c * Ur, m.I[0][1]]; // I_RC = j·3ωC·(j220) = −3ωC·220, real and negative
    close(row(g, "ILR")![1], mag(ilr), 0.01);
    close(row(g, "ILR")![2], angle(ilr), 0.01);
    const Qn = m.Q - 3 * w * c * 3 * Ur * Ur;
    close(row(g, "Q VAR")![1], Qn, 0.6);
    close(row(g, "FP")![1], m.P / Math.hypot(m.P, Qn), 0.0051); // shown with 2 decimals
  });
  test("with a bank, FASORIAL draws a third screen: I_L from O and the bank's current from the tip of I to the tip of I_L", () => {
    const g = run(flow(src(1, FIG), banco(1, [50, 100]), fasor([KEYS.EXE, KEYS.EXE, KEYS.EXE]), exit())); // EXE on each of the 3 screens
    const pages = g.pages.slice(1);
    expect(pages).toHaveLength(3);
    const w = 2 * Math.PI * 50, c = 100e-6;
    const m = solveThreePhase(FIG);
    const ic: [number, number] = [0, 3 * w * c * 220 * Math.sin(Math.PI)]; // j·3ωC·U_R, U_R = 220∠90°: only the sign matters here
    const seg = pages[2].segments;
    const has = (x1: number, y1: number, x2: number, y2: number) => seg.some((s) => Math.hypot(s[0] - x1, s[1] - y1) < 1e-4 && Math.hypot(s[2] - x2, s[3] - y2) < 1e-4);
    const ur: [number, number] = [0, 220];
    const irc: [number, number] = [-3 * w * c * ur[1], 0]; // j·(3ωC)·(0 + j220)
    expect(has(m.I[0][0], m.I[0][1], m.I[0][0] + irc[0], m.I[0][1] + irc[1])).toBe(true);
    expect(has(0, 0, m.I[0][0] + irc[0], m.I[0][1] + irc[1])).toBe(true);
    expect(pages[2].texts.map((t) => t[2])).toEqual(expect.arrayContaining(["ILR", "ILS", "ILT", "IRC"]));
    void ic;
    for (const [r, cc] of pages[2].texts) { expect(r).toBeGreaterThanOrEqual(1); expect(r).toBeLessThanOrEqual(57); expect(cc).toBeGreaterThanOrEqual(1); expect(cc).toBeLessThanOrEqual(121); }
  });
  test("QUITAR BANCO gives the wattmeters the load's own currents back (W_RS = 0, W_TS = 50 kW again, not 25 kW)", () => {
    // bank to cos φ' = 1 (BANCO 2: 50 Hz, 1), then BANCO 3 = QUITAR, then the two wattmeters with the common line S
    const g = run(flow(src(1, FIG), banco(2, [50, 1]), banco(3), vatim(3, [2]), exit()));
    close(row(g, "WRS")![1], 0, 0.01);
    close(row(g, "WTS")![1], 50000, 1);
  });
  test("QUITAR BANCO takes the third screen away", () => {
    const g = run(flow(src(1, FIG), banco(1, [50, 100]), banco(3), fasor([KEYS.EXE, KEYS.EXE]), exit())); // then BANCO 3 = QUITAR: 2 screens
    expect(g.pages.slice(1)).toHaveLength(2);
  });
});

describe("defaults: 0 = U_RN 220 V at 90°, a value of 0 = 220 V (phase) / 380 V (line), 0 Hz = 50 Hz", () => {
  const K = { TENS: 72, CARGA: 62, SOLVE: 52, BANCO: 73, EXIT: 71 };
  const rowOf = (g: ReturnType<typeof newGfx>, label: string) => {
    for (const sc of [...g.screens].reverse()) {
      const l = sc.find((x) => x[2] === label && x[0] === 1);
      if (l) return sc.filter((x) => x[1] === l[1]).map((x) => x[2]);
    }
    return undefined;
  };
  const Z3: [number, number][] = [[10, 0], [10, 0], [10, 0]]; // balanced 10 Ω
  const ir = (f: Flow) => rowOf(go(TRIFAS_LINES, flow(nuevo(), f, solve(), exit())), "IR")!;
  test("reference 0: U_RN = 220 ∠90° (direct sequence) with no more questions", () => {
    const r = ir(flow(tens(), cargaZ(1, Z3))); // sequence 1, reference 1 = the usual one (U_RN 220 ∠90°), connection 1, impedances
    expect(r[1]).toBeCloseTo(22, 2); // I_R = 220 / 10
    expect(r[2]).toBeCloseTo(90, 2);
  });
  test("a value of 0 is 220 V for a phase reference and 380 V for a line reference (the angle is still asked)", () => {
    const ph = ir(flow(tens({ ref: 1, value: 0, angle: 90 }), cargaZ(1, Z3)));
    expect(ph[1]).toBeCloseTo(22, 2);
    expect(ph[2]).toBeCloseTo(90, 2);
    const line = ir(flow(tens({ ref: 4, value: 0, angle: 120 }), cargaZ(1, Z3))); // U_RS = 380 ∠120° → U_RN = 380/√3 ∠90°
    expect(line[1]).toBeCloseTo(380 / Math.sqrt(3) / 10, 2);
    expect(line[2]).toBeCloseTo(90, 2);
  });
  test("a typed value still wins", () => {
    expect(ir(flow(tens({ ref: 1, value: 127, angle: 0 }), cargaZ(1, Z3)))[1]).toBeCloseTo(12.7, 2);
  });
  test("BANCO C: 0 Hz is 50 Hz", () => {
    const get = (f: number) => rowOf(go(TRIFAS_LINES, flow(nuevo(), tens(), cargaZ(1, Z3), solve(), banco(1, [f, 100]), exit())), "ILR")!;
    expect(get(0)).toEqual(get(50));
  });
});

describe("CARGA: symmetric load and the load given by Z, S or P", () => {
  const K = { TENS: 72, CARGA: 62, SOLVE: 52, EXIT: 71 };
  const line = (g: ReturnType<typeof newGfx>, label: string) => {
    for (const sc of [...g.screens].reverse()) {
      const l = sc.find((x) => x[2] === label && x[0] === 1);
      if (l) return sc.filter((x) => x[1] === l[1]).map((x) => x[2]);
    }
    return undefined;
  };
  // sequence 1, reference 0 (U_RN = 220 ∠90°), then the connection and the load's answers
  const run = (load: Flow) => go(TRIFAS_LINES, flow(nuevo(), tens(), load, solve(), exit()));
  const UL = 220 * Math.sqrt(3);
  test("symmetric: one impedance is enough and gives the same currents as the three typed", () => {
    const three = line(run(cargaZ(1, [[10, 30], [10, 30], [10, 30]])), "IS")!;
    const one = line(run(cargaZ(1, [[10, 30]], true)), "IS")!;
    expect(one).toEqual(three);
  });
  test("by S: 100 kVA total at 60° (symmetric, star) is Z = 1,452 ∠60° and I_line = 100 000 / (√3·U_L) ∠30°", () => {
    const r = line(run(carga(1, true, 2, [100000, 60])), "IR")!;
    expect(r[1] as number).toBeCloseTo(100000 / (Math.sqrt(3) * UL), 2);
    expect(r[2] as number).toBeCloseTo(30, 2);
  });
  test("by P: 50 kW total at 60° is the same load as 100 kVA at 60°", () => {
    expect(line(run(carga(1, true, 3, [50000, 60])), "IR")).toEqual(line(run(carga(1, true, 2, [100000, 60])), "IR"));
  });
  test("delta: S is shared by the three elements and the voltage is the line voltage", () => {
    const r = line(run(carga(3, true, 2, [100000, 60])), "IR")!;
    expect(r[1] as number).toBeCloseTo(100000 / (Math.sqrt(3) * UL), 2); // the line current of a balanced 100 kVA load is the same
    const phase = line(run(carga(3, true, 2, [100000, 60])), "IRS")!;
    expect(phase[1] as number).toBeCloseTo(100000 / (3 * UL), 2);
  });
  test("not symmetric: S and P are those of each phase", () => {
    const r = line(run(carga(1, false, 2, [33333.333, 60, 33333.333, 60, 33333.333, 60])), "IR")!;
    expect(r[1] as number).toBeCloseTo(100000 / (Math.sqrt(3) * UL), 2);
  });
});

describe("RESOLVER: the wattmeters page and no label glued to its value", () => {
  const K = { TENS: 72, CARGA: 62, SOLVE: 52, BANCO: 73, EXIT: 71 };
  const run = (f: Flow) => go(TRIFAS_LINES, f);
  const rowOf = (g: ReturnType<typeof newGfx>, label: string) => {
    for (const sc of [...g.screens].reverse()) {
      const l = sc.find((x) => x[2] === label && x[0] === 1);
      if (l) return sc.filter((x) => x[1] === l[1]).map((x) => x[2]);
    }
    return undefined;
  };
  const w = (u: [number, number], i: [number, number]) => u[0] * i[0] + u[1] * i[1];
  const d = (a: [number, number], b: [number, number]): [number, number] => [a[0] - b[0], a[1] - b[1]];
  const close = (v: unknown, ref: number, tol = 0.0051) => expect(Math.abs((v as number) - ref)).toBeLessThanOrEqual(tol);
  // U_RN = 220 ∠90° (0), the load by S: 100 kVA total at 60°, symmetric, star with neutral
  const FIG = flow(nuevo(), tens(), carga(1, true, 2, [100000, 60]));

  test("the six readings are Re(U·I*) of the model (guide 608, star without neutral): WRT = 3309 W, WST = −1097 W, …", () => {
    const inp: ThreePhaseInput = { sequence: "RST", ref: "RN", value: 220, angle: 90, connection: "Y3", Z: [[22, 0], [38, 90], [38, -90]] };
    const g = run(flow(nuevo(), tens({ ref: 1, value: 220, angle: 90 }), cargaZ(2, [[22, 0], [38, 90], [38, -90]]), solve(), exit()));
    const m = solveThreePhase(inp);
    const U = m.U as [number, number][], I = m.I as [number, number][];
    const expected: [string, number, number][] = [["WRT", 0, 2], ["WST", 1, 2], ["WRS", 0, 1], ["WTS", 2, 1], ["WSR", 1, 0], ["WTR", 2, 0]];
    for (const [label, a, c] of expected) close(rowOf(g, label)![1], w(d(U[a], U[c]), I[a]));
    close(rowOf(g, "P W")![1], m.P);
    close(rowOf(g, "WRT")![1], 3290, 33); // the guide, which rounds U_L to 380 V
    close(rowOf(g, "WST")![1], -1100, 11);
  });
  test("the figure: with the common line S, W_RS = 0 and W_TS = 50 kW; with the bank to cos φ' = 1 (RESOLVER again) 25 kW and 25 kW", () => {
    const g = run(flow(FIG, solve(), exit()));
    close(rowOf(g, "WRS")![1], 0, 0.01);
    close(rowOf(g, "WTS")![1], 50000, 1);
    const b = run(flow(FIG, solve(), banco(2, [0, 1]), solve(), exit()));
    close(rowOf(b, "WRS")![1], 25000, 1);
    close(rowOf(b, "WTS")![1], 25000, 1);
  });
  test("every screen: a label of up to 3 letters is followed by a space before its value (it read UNN0 as one word)", () => {
    const Z3: [number, number][] = [[10, 0], [15, 30], [10, -30]];
    const scenarios: Flow[] = [
      flow(nuevo(), tens(), cargaZ(2, Z3), solve(), exit()), // star without neutral: UNN, UR US UT
      flow(nuevo(), tens(), cargaZ(1, Z3), solve(), exit()), // 4 wires: IN
      flow(nuevo(), tens(), cargaZ(3, Z3), solve(), exit()), // delta: IRS IST ITR
      flow(FIG, solve(), banco(1, [50, 100]), exit()), // the bank: ILR ILS ILT IRC ISC ITC
    ];
    let checked = 0;
    for (const f of scenarios) {
      const g = run(f);
      for (const sc of g.screens) {
        for (const lab of sc.filter((x) => x[0] === 1 && typeof x[2] === "string" && (x[2] as string).trim() !== "")) {
          const others = sc.filter((x) => x[1] === lab[1] && x[0] > 1 && !(typeof x[2] === "string" && x[2] === " "));
          for (const o of others) {
            expect(o[0]).toBeGreaterThan(1 + (lab[2] as string).length); // at least one blank column
            checked++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(20);
  });
});

describe("VATIMETROS, one wattmeter: U and I left at 0 are the loaded ones", () => {
  test("after TENSIONES, CARGA and RESOLVER (the figure: 100 kVA, φ = 60°), W1 = Q/√3 gives S = 100 kVA, P = 50 kW, cos φ = 0,5 with no U or I typed", () => {
    const Q = 100000 * Math.sin(Math.PI / 3);
    // TENSIONES (usual), CARGA star with neutral symmetric by S, RESOLVER; then VATIMETROS 1: U 0 (the loaded one), I 0, W1
    const g = go(TRIFAS_LINES, flow(nuevo(), tens(), carga(1, true, 2, [100000, 60]), solve(), vatim(1, [], [0, 0, Q / Math.sqrt(3)]), exit()));
    const row = (l: string) => g.screens.flatMap((sc) => sc.filter((x) => x[2] === l && x[0] === 1).map((x) => sc.filter((y) => y[1] === x[1]).map((y) => y[2]))).pop()!;
    expect(Math.abs((row("S VA")[1] as number) - 100000)).toBeLessThan(1);
    expect(Math.abs((row("P W")[1] as number) - 50000)).toBeLessThan(1);
    expect(Math.abs((row("FP")[1] as number) - 0.5)).toBeLessThan(0.0051);
  });
});

describe("CARGA 4: several loads in parallel, each by P (kW) and cos φ", () => {
  const K = { TENS: 72, CARGA: 62, SOLVE: 52, EXIT: 71 };
  const rowOf = (g: ReturnType<typeof newGfx>, label: string) => {
    for (const sc of [...g.screens].reverse()) {
      const l = sc.find((x) => x[2] === label && x[0] === 1);
      if (l) return sc.filter((x) => x[1] === l[1]).map((x) => x[2]);
    }
    return undefined;
  };
  const close = (v: unknown, ref: number, tol = 0.0051) => expect(Math.abs((v as number) - ref)).toBeLessThanOrEqual(tol);
  // sequence 1, reference 0 (U_RN = 220 ∠90°), connection, symmetric answer (ignored by the option), CARGA POR 4, the loads
  const run = (conn: number, loads: number[]) => go(TRIFAS_LINES, flow(nuevo(), tens(), carga(conn, true, 4, [loads.length / 2, ...loads]), solve(), exit()));
  const UL = 220 * Math.sqrt(3);
  // a motor of 40 kW at cos φ = 0,8 and lamps of 1,8 kW at cos φ = 1
  const MOTOR_LAMPS = [40, 0.8, 1.8, 1];

  test("the totals: P = 41,8 kW, Q = 30 kvar, S = √(P² + Q²), power factor", () => {
    const g = run(1, MOTOR_LAMPS);
    const P = 41800, Q = 30000, S = Math.hypot(P, Q);
    close(rowOf(g, "P W")![1], P, 0.01);
    close(rowOf(g, "Q VAR")![1], Q, 0.01);
    close(rowOf(g, "S VA")![1], S, 0.01);
    close(rowOf(g, "FP")![1], P / S);
  });
  test("RESOLVER then gives the line current S / (√3·U_L) lagging U_R by φ = atan(Q/P)", () => {
    const g = run(1, MOTOR_LAMPS);
    const S = Math.hypot(41800, 30000), phi = (Math.atan2(30000, 41800) * 180) / Math.PI;
    const r = rowOf(g, "IR")!;
    close(r[1], S / (Math.sqrt(3) * UL));
    close(r[2], 90 - phi);
    const m = solveThreePhase({ sequence: "RST", ref: "RN", value: 220, angle: 90, connection: "Y4", Z: [[220 ** 2 / (S / 3), phi], [220 ** 2 / (S / 3), phi], [220 ** 2 / (S / 3), phi]] });
    close(r[1], mag(m.I[0]));
  });
  test("one load by P and cos φ is the same load as by S and the angle (50 kW at 0,5 = 100 kVA at 60°)", () => {
    const g4 = run(1, [50, 0.5]);
    const gs = go(TRIFAS_LINES, flow(nuevo(), tens(), carga(1, true, 2, [100000, 60]), solve(), exit()));
    const a = rowOf(g4, "IR")!, b = rowOf(gs, "IR")!;
    close(a[1], b[1] as number, 0.0051);
    close(a[2], b[2] as number, 0.0051);
  });
  test("a negative cos φ is a capacitive load: the current leads U_R", () => {
    const r = rowOf(run(1, [10, -0.8]), "IR")!;
    close(r[2], 90 + (Math.acos(0.8) * 180) / Math.PI);
  });
  test("three loads add up, in delta too (same line current: the load is the same)", () => {
    const loads = [20, 0.8, 10, 0.6, 5, 1];
    const star = rowOf(run(1, loads), "IR")!;
    const delta = rowOf(run(3, loads), "IR")!;
    close(delta[1], star[1] as number);
    close(delta[2], star[2] as number);
    const P = 35000, Q = 20000 * 0.75 + 10000 * (0.8 / 0.6);
    close(star[1], Math.hypot(P, Q) / (Math.sqrt(3) * UL));
  });
  test("more than 3 loads are cut to 3 and a cos φ above 1 is taken as 1", () => {
    const g = go(TRIFAS_LINES, flow(nuevo(), tens(), carga(1, true, 4, [9, 10, 1.5, 10, 1, 10, 1]), solve(), exit())); // 9 asked → 3 loads read
    close(rowOf(g, "P W")![1], 30000, 0.01);
    close(rowOf(g, "Q VAR")![1], 0, 0.01);
  });
});

describe("CARGA 5 (motor + loads on each phase) and the per-phase pages of RESOLVER", () => {
  const K = { TENS: 72, CARGA: 62, SOLVE: 52, EXIT: 71 };
  const rowOf = (g: ReturnType<typeof newGfx>, label: string) => {
    for (const sc of [...g.screens].reverse()) {
      const l = sc.find((x) => x[2] === label && x[0] === 1);
      if (l) return sc.filter((x) => x[1] === l[1]).map((x) => x[2]);
    }
    return undefined;
  };
  const val = (g: ReturnType<typeof newGfx>, label: string) => rowOf(g, label)![1] as number;
  const near = (v: number, ref: number, rel: number) => expect(Math.abs(v - ref)).toBeLessThanOrEqual(Math.abs(ref) * rel + 0.01);
  // the guides work with U_RN = 220 V (their I_R = 5,79 A in 611 is 220 / 38): the usual reference, U_RN = 220 ∠90°
  const run = (load: Flow) => go(TRIFAS_LINES, flow(nuevo(), tens(), load, solve(), exit()));

  test("guide 615: motor 60 kW at 0,85 + 24 kW on R, 15 kW on S, 9 kW on T (cos φ = 1): P = 108 kW, W_RN 44 kW, W_SN 35 kW, W_TN 29 kW", () => {
    const g = run(carga(1, false, 5, [60, 0.85, 24, 1, 15, 1, 9, 1]));
    near(val(g, "P TOT"), 108000, 1e-6);
    // the guide's 44 040 / 35 048 / 29 044 W: the same up to its rounding (0,2 %); the exact values are 44 000 / 35 000 / 29 000
    near(val(g, "WRN"), 44040, 2e-3);
    near(val(g, "WSN"), 35048, 2e-3);
    near(val(g, "WTN"), 29044, 2e-3);
    near(val(g, "WRN"), 44000, 1e-6);
    near(val(g, "WSN"), 35000, 1e-6);
    near(val(g, "WTN"), 29000, 1e-6);
    // each phase: P = its lamps + a third of the motor, Q = a third of the motor's
    const Qm = (60000 * Math.tan(Math.acos(0.85))) / 3;
    [["PR", 44000], ["PS", 35000], ["PT", 29000]].forEach(([l, p]) => near(val(g, l as string), p as number, 1e-6));
    ["QR", "QS", "QT"].forEach((l) => near(val(g, l), Qm, 1e-6));
    near(val(g, "SR"), Math.hypot(44000, Qm), 1e-6);
    near(val(g, "IR"), Math.hypot(44000, Qm) / 220, 1e-5);
  });
  test("a motor alone is the same load as option 4 with that motor", () => {
    const a = rowOf(run(carga(1, false, 5, [50, 0.8, 0, 0, 0])), "IR")!;
    const b = rowOf(run(carga(1, true, 4, [1, 50, 0.8])), "IR")!;
    expect(a).toEqual(b);
  });
  test("delta: the loads are those between the lines (a third of the motor on each, plus 10 kW between R and S)", () => {
    const g = run(carga(3, false, 5, [30, 0.8, 10, 1, 0, 0]));
    near(val(g, "P TOT"), 40000, 1e-6);
    near(val(g, "PR"), 20000, 1e-6); // element RS
    near(val(g, "PS"), 10000, 1e-6);
    near(val(g, "PT"), 10000, 1e-6);
  });
  test("guide 611 (4 wires, 38∠30°, 22∠45°, 33∠0°): P, Q and S of each phase", () => {
    const g = run(cargaZ(1, [[38, 30], [22, 45], [33, 0]]));
    [["PR", 1103.1], ["PS", 1555.6], ["PT", 1467.4], ["QR", 636.9], ["QS", 1555.6], ["QT", 0], ["SR", 1273.8], ["SS", 2200], ["ST", 1467.4]].forEach(([l, v]) => near(val(g, l as string), v as number, 1e-3));
    // the guide gives PTRIF = 4113,6 W, but its own PR + PS + PT = 4126,1 W (0,3 % apart): the program is the sum of the phases
    near(val(g, "P W"), 1103.1 + 1555.6 + 1467.4, 1e-3);
  });
  test("guide 612 (3 wires, 10 + j10, 20 + j20, 30 + j30): P, Q and S of each phase", () => {
    const g = run(cargaZ(2, [[Math.hypot(10, 10), 45], [Math.hypot(20, 20), 45], [Math.hypot(30, 30), 45]]));
    [["PR", 1139.3], ["PS", 1559.7], ["PT", 1259.8], ["QR", 1139.3], ["QS", 1559.7], ["QT", 1259.8], ["SR", 1611.2], ["SS", 2205.7], ["ST", 1781.7]].forEach(([l, v]) => near(val(g, l as string), v as number, 1e-3));
    near(val(g, "P TOT"), 3958.8, 1e-3);
  });
  test("an empty motor and empty phases do not break RESOLVER (an open load)", () => {
    expect(() => run(carga(1, false, 5, [0, 0, 0, 0]))).not.toThrow();
  });
});

describe("CARGA 4: VER LA GUARDADA shows the stored load without asking or changing anything", () => {
  const rowOf = (g: ReturnType<typeof newGfx>, label: string) => {
    for (const sc of [...g.screens].reverse()) {
      const l = sc.find((x) => x[2] === label && x[0] === 1);
      if (l) return sc.filter((x) => x[1] === l[1]).map((x) => x[2]);
    }
    return undefined;
  };
  const near = (v: unknown, ref: number, tol = 0.0051) => expect(Math.abs((v as number) - ref)).toBeLessThanOrEqual(tol);
  // guide 615: motor 60 kW at 0,85 + 24 / 15 / 9 kW at cos φ = 1 on R / S / T, star with neutral
  const MOTOR_AND_LAMPS = carga(1, false, 5, [60, 0.85, 24, 1, 15, 1, 9, 1]);
  const Qm = (60000 * Math.tan(Math.acos(0.85))) / 3;

  test("page 1: the impedance of each phase, U² / S ∠φ, and the connection", () => {
    const g = go(TRIFAS_LINES, flow(nuevo(), tens(), MOTOR_AND_LAMPS, verCarga(), exit()));
    for (const [label, P] of [["ZR", 44000], ["ZS", 35000], ["ZT", 29000]] as const) {
      const r = rowOf(g, label)!;
      near(r[1], 220 ** 2 / Math.hypot(P, Qm));
      near(r[2], (Math.atan2(Qm, P) * 180) / Math.PI);
    }
    expect(g.screens.some((sc) => sc.some((x) => x[2] === "ESTRELLA 4 HILOS"))).toBe(true);
  });
  test("page 2: P and Q of each phase and the total P (108 kW)", () => {
    const g = go(TRIFAS_LINES, flow(nuevo(), tens(), MOTOR_AND_LAMPS, verCarga(), exit()));
    [["PR", 44000], ["PS", 35000], ["PT", 29000]].forEach(([l, v]) => near(rowOf(g, l as string)![1], v as number, 0.05));
    ["QR", "QS", "QT"].forEach((l) => near(rowOf(g, l)![1], Qm, 0.05));
    near(rowOf(g, "P TOT")![1], 108000, 0.1);
  });
  test("in delta the labels are those of the lines and the voltage on each element is the line voltage", () => {
    const g = go(TRIFAS_LINES, flow(nuevo(), tens(), cargaZ(3, [[20, 40], [30, -10], [25, 0]]), verCarga(), exit()));
    near(rowOf(g, "ZRS")![1], 20);
    near(rowOf(g, "ZRS")![2], 40);
    near(rowOf(g, "ZST")![2], -10);
    near(rowOf(g, "PR")![1], (3 * 220 ** 2 * Math.cos((40 * Math.PI) / 180)) / 20, 0.05); // U_L² · cos φ / |Z|
  });
  test("it changes nothing: RESOLVER after the view gives the same as without it", () => {
    const base = flow(nuevo(), tens(), MOTOR_AND_LAMPS);
    const without = rowOf(go(TRIFAS_LINES, flow(base, solve(), exit())), "IR")!;
    const withView = rowOf(go(TRIFAS_LINES, flow(base, verCarga(), solve(), exit())), "IR")!;
    expect(withView).toEqual(without);
  });
  test("it is the fourth item of the first CARGA menu", () => {
    const g = go(TRIFAS_LINES, flow(nuevo(), tens(), verCarga(), exit()));
    const sc = g.screens.find((s) => s.some((x) => x[2] === "CONEXION (4 = VER)"))!;
    expect(sc.filter((x) => x[0] === 3).map((x) => x[2])).toEqual(["ESTRELLA 4 HILOS¹", "ESTRELLA 3 HILOS²", "TRIANGULO³", "VER LA GUARDADA⁴"]);
  });
});

import { newGfx, newMem, runBasic } from "./casioBasic";
import { buildG1m, programBytes } from "../casioG1m";
import { POLITRI_LINES, politriBalanced, politriUnbalanced, type BalancedHarmonic } from "../politri";

// ---- the guide's exercises ----------------------------------------------------------------------------------------
// 704: perfect source (only the fundamental, 220 V on R taken as the 0° reference), balanced nonlinear load; i_R in peaks:
const EX704: BalancedHarmonic[] = [
  { n: 1, U: 220 * Math.SQRT2, phiU: 0, I: 141.42, phiI: 60 },
  { n: 3, U: 0, phiU: 0, I: 113.13, phiI: 92 },
  { n: 5, U: 0, phiU: 0, I: 84.85, phiI: 214 },
  { n: 7, U: 0, phiU: 0, I: 56.57, phiI: 32 },
  { n: 9, U: 0, phiU: 0, I: 28.28, phiI: 60 },
];
// 705: rms and angle of the harmonics of the three phases (R S T)
const EX705: [number, number][][] = [
  [[20, 30], [20, -90], [20, 150]],
  [[12, 0], [8, 120], [4, -120]],
  [[6, 0], [4, 0], [2, 0]],
  [[2, 30], [2, 30], [2, 30]],
];
// 706: generator with harmonics (rms), R = 1 Ω and L = 1 mH per phase (XL = 0,314 Ω at 50 Hz: the guide uses ω = 314)
const EX706: BalancedHarmonic[] = [
  { n: 1, U: 206.4, phiU: 0 },
  { n: 3, U: 49, phiU: 0 },
  { n: 5, U: 40, phiU: 0 },
  { n: 7, U: 41.3, phiU: 0 },
  { n: 9, U: 9.8, phiU: 0 },
];
const LOAD706 = { R: 1, XL: 0.314, XC: 0 };
const near = (a: number, b: number, rel: number) => expect(Math.abs(a - b)).toBeLessThanOrEqual(Math.abs(b) * rel + 1e-9);

describe("politriBalanced / politriUnbalanced against the guide", () => {
  test("704: I = 148,32 A, I_N = 247 A, P per phase 11 000 W, |Q| per phase 19 052 var", () => {
    const r = politriBalanced({ peak: true, harmonics: EX704, neutral: true });
    near(r.IL, 148.32, 1e-4);
    near(r.IN, 247, 2e-3);
    near(r.P / 3, 11000, 1e-4);
    near(Math.abs(r.Q) / 3, 19052, 1e-3);
    // the guide's S = 97 621 VA uses 380/√3 = 219,39 V instead of 220 V; D follows S, P, Q
    near(r.S, 97621, 4e-3);
    near(r.D, 71910, 1e-2);
  });
  test("705: I_R = 24,16 A, I_S = 22 A, I_T = 20,6 A, I_N = 15 A", () => {
    const r = politriUnbalanced({ peak: false, harmonics: EX705 });
    near(r.I[0], 24.16, 1e-3);
    near(r.I[1], 22, 1e-3);
    near(r.I[2], 20.6, 2e-3);
    near(r.IN, 15, 1e-2);
    near(r.max, 24.16, 1e-3);
  });
  test("706: the currents of the harmonics (the guide rounds z₁ to 1,04: its I₁ = 198,5 A is 0,8 % over the exact 196,9 A)", () => {
    const r = politriBalanced({ peak: false, harmonics: EX706, load: LOAD706, neutral: true });
    [198.5, 35.8, 21.5, 17.1, 3.3].forEach((g, k) => near(r.I[k], g, 1e-2));
    near(r.IL, 203.6, 1e-2);
    near(r.P, 124348, 2e-2);
    near(r.Q, 44937, 2e-2);
    near(r.S, 134376, 2e-2);
    expect(r.IN).toBeCloseTo(3 * Math.hypot(r.I[1], r.I[4]), 9);
  });
  test("706, neutral disconnected: the triple harmonics leave the load (no I3 / I9, U_rms from 1, 5, 7 only)", () => {
    const r = politriBalanced({ peak: false, harmonics: EX706, load: LOAD706, neutral: false });
    expect(r.I[1]).toBe(0);
    expect(r.I[4]).toBe(0);
    expect(r.IN).toBe(0);
    const Ul = Math.sqrt(206.4 ** 2 + 40 ** 2 + 41.3 ** 2);
    expect(r.S).toBeCloseTo(3 * Ul * r.IL, 6);
  });
});

describe("neutral current by integrating the three waveforms (independent of the phasor algebra)", () => {
  // i_R(t) = Σ √2·I_n·sen(n·ωt + θ_n); S and T are the same wave delayed / advanced one third of a period (direct sequence)
  test("704: i_N = i_R + i_S + i_T has the rms of the model (only the triple harmonics survive, ×3)", () => {
    const N = 30000;
    const iR = (x: number) => EX704.reduce((s, h) => s + h.I! * Math.sin(h.n * x + (h.phiI! * Math.PI) / 180), 0); // peaks
    let acc = 0;
    for (let k = 0; k < N; k++) {
      const x = (2 * Math.PI * k) / N;
      const iN = iR(x) + iR(x - (2 * Math.PI) / 3) + iR(x + (2 * Math.PI) / 3);
      acc += iN * iN;
    }
    near(Math.sqrt(acc / N), politriBalanced({ peak: true, harmonics: EX704, neutral: true }).IN, 1e-6);
  });
  test("705: the same with the three given phases", () => {
    const N = 30000;
    const wave = (j: number, x: number) => EX705.reduce((s, h, k) => s + Math.SQRT2 * h[j][0] * Math.sin([1, 2, 3, 9][k] * x + (h[j][1] * Math.PI) / 180), 0);
    let acc = 0;
    for (let k = 0; k < N; k++) {
      const x = (2 * Math.PI * k) / N;
      const iN = wave(0, x) + wave(1, x) + wave(2, x);
      acc += iN * iN;
    }
    near(Math.sqrt(acc / N), politriUnbalanced({ peak: false, harmonics: EX705 }).IN, 1e-6);
  });
});

describe("POLITRI listing run by the interpreter", () => {
  const rowOf = (gfx: ReturnType<typeof newGfx>, label: string) => {
    for (const sc of [...gfx.screens].reverse()) {
      const l = sc.find((x) => x[2] === label && x[0] === 1);
      if (l) return sc.filter((x) => x[1] === l[1]).map((x) => x[2]);
    }
    return undefined;
  };
  const within = (v: unknown, ref: number, tol = 0.0051) => expect(Math.abs((v as number) - ref)).toBeLessThanOrEqual(tol);
  const run = (inputs: number[]) => {
    const gfx = newGfx();
    runBasic(POLITRI_LINES, [...inputs, 0], gfx, newMem());
    return gfx;
  };

  test("704 (balanced, currents given, peaks)", () => {
    const g = run([1, 1, 1, 5, ...EX704.flatMap((h) => [h.n, h.U, h.phiU, h.I!, h.phiI!])]);
    const m = politriBalanced({ peak: true, harmonics: EX704, neutral: true });
    within(rowOf(g, "I LINEA")![1], m.IL);
    within(rowOf(g, "I NEUTRO")![1], m.IN);
    within(rowOf(g, "P W")![1], m.P, 0.02);
    within(rowOf(g, "Q VAR")![1], m.Q, 0.02);
    within(rowOf(g, "S VA")![1], m.S, 0.02);
    within(rowOf(g, "D VA")![1], m.D, 0.05);
    within(rowOf(g, "FP")![1], m.FP);
  });
  test("706 (balanced, R and L, neutral connected and disconnected)", () => {
    for (const neutral of [1, 0]) {
      const g = run([1, 2, 2, LOAD706.R, LOAD706.XL, LOAD706.XC, neutral ? 1 : 2 /* NEUTRO menu: 1 connected, 2 disconnected */, 5, ...EX706.flatMap((h) => [h.n, h.U, h.phiU])]);
      const m = politriBalanced({ peak: false, harmonics: EX706, load: LOAD706, neutral: !!neutral });
      within(rowOf(g, "I LINEA")![1], m.IL);
      within(rowOf(g, "I NEUTRO")![1], m.IN);
      within(rowOf(g, "P W")![1], m.P, 0.02);
      within(rowOf(g, "Q VAR")![1], m.Q, 0.02);
      within(rowOf(g, "S VA")![1], m.S, 0.02);
      within(rowOf(g, "FP")![1], m.FP);
      // page 2: the current of each harmonic
      const page2 = g.screens.filter((sc) => sc.some((x) => x[0] === 6));
      expect(page2.length).toBeGreaterThan(0);
      EX706.forEach((h, k) => within(page2[page2.length - 1].find((x) => x[0] === 6 && x[1] === k + 1)![2], m.I[k], 0.0051));
    }
  });
  test("RLC mode with a capacitor: X_n = n·XL − XC/n", () => {
    const hs: BalancedHarmonic[] = [{ n: 1, U: 220, phiU: 0 }, { n: 5, U: 30, phiU: 0 }];
    const g = run([1, 2, 2, 4, 10, 6, 1, 2, ...hs.flatMap((h) => [h.n, h.U, h.phiU])]);
    const m = politriBalanced({ peak: false, harmonics: hs, load: { R: 4, XL: 10, XC: 6 }, neutral: true });
    within(rowOf(g, "I LINEA")![1], m.IL);
    within(rowOf(g, "P W")![1], m.P, 0.02);
    within(rowOf(g, "Q VAR")![1], m.Q, 0.02);
  });
  test("705 (three currents of any size): I_R, I_S, I_T, I_N and the most loaded phase", () => {
    const g = run([2, 2, 4, ...EX705.flatMap((h) => h.flat())]);
    const m = politriUnbalanced({ peak: false, harmonics: EX705 });
    within(rowOf(g, "IR EF")![1], m.I[0]);
    within(rowOf(g, "IS EF")![1], m.I[1]);
    within(rowOf(g, "IT EF")![1], m.I[2]);
    within(rowOf(g, "I NEUTRO")![1], m.IN);
    within(rowOf(g, "MAS CARGADA")![1], m.max);
  });
  test("peaks are divided by √2 (705 in peaks)", () => {
    const peaks = EX705.map((h) => h.map(([m, a]) => [m * Math.SQRT2, a] as [number, number]));
    const g = run([2, 1, 4, ...peaks.flatMap((h) => h.flat())]);
    within(rowOf(g, "IR EF")![1], politriUnbalanced({ peak: false, harmonics: EX705 }).I[0]);
  });
  test("the file", () => {
    expect(() => programBytes(POLITRI_LINES)).not.toThrow();
    expect(buildG1m("POLITRI", POLITRI_LINES).length).toBeLessThan(6000);
  });
});

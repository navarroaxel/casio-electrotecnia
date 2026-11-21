import { newGfx, newMem, runBasic } from "./casioBasic";
import { buildG1m, programBytes } from "../casioG1m";
import { TRIFAS_LINES, aron, angle, mag, oneWattmeter, solveThreePhase, type ThreePhaseInput } from "../trifas";

const EX1: ThreePhaseInput = {
  sequence: "RST", ref: "ST", value: 294.2, angle: 0, connection: "Y4",
  Z: [[10, 0], [15, 30], [10, -30]], // Z_R, Z_S, Z_T of the exercise
};
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
  const K = { TENS: 72, CARGA: 62, SOLVE: 52, MED: 73, EXIT: 71, ARON: 62, ONE: 72 };
  const rows = (gfx: ReturnType<typeof newGfx>, label: string) => {
    for (const sc of gfx.screens) {
      const l = sc.find((x) => x[2] === label && x[0] === 1);
      if (l) return sc.filter((x) => x[1] === l[1]).map((x) => x[2]);
    }
    return undefined;
  };
  const within = (v: unknown, ref: number, tol = 0.0051) => expect(Math.abs((v as number) - ref)).toBeLessThanOrEqual(tol);
  const run = (conn: 1 | 2 | 3, input: ThreePhaseInput) => {
    const gfx = newGfx();
    const refN = { RN: 1, SN: 2, TN: 3, RS: 4, ST: 5, TR: 6 }[input.ref];
    runBasic(
      TRIFAS_LINES,
      [0, input.sequence === "RST" ? 1 : 2, refN, input.value, input.angle, conn, ...input.Z.flat()],
      gfx, newMem(), [K.TENS, K.CARGA, K.SOLVE, K.EXIT],
    );
    return gfx;
  };

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
      const gfx = newGfx();
      runBasic(TRIFAS_LINES, [0, W1, W2], gfx, newMem(), [K.MED, K.ARON, K.EXIT]);
      const m = aron(W1, W2);
      const r = rows(gfx, "FI GRADOS")!;
      expect(Math.abs((r[1] as number) - m.phi)).toBeLessThanOrEqual(0.0051);
      within(rows(gfx, "P W")![1], m.P);
      within(rows(gfx, "Q VAR")![1], m.Q);
    }
  });
  test("one wattmeter (exercise 2) from the listing", () => {
    const gfx = newGfx();
    runBasic(TRIFAS_LINES, [0, 2, 220, 10, 2193.93], gfx, newMem(), [K.MED, K.ONE, K.EXIT]);
    const m = oneWattmeter(220 * Math.sqrt(3), 10, 2193.93);
    within(rows(gfx, "Q VAR")![1], m.Q);
    within(rows(gfx, "S VA")![1], m.S);
    within(rows(gfx, "P W")![1], m.P);
    within(rows(gfx, "FI GRADOS")![1], m.phi);
  });
  test("the file", () => {
    expect(() => programBytes(TRIFAS_LINES)).not.toThrow();
    expect(buildG1m("TRIFAS", TRIFAS_LINES).length).toBeLessThan(12000);
  });
});

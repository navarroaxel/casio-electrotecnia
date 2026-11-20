import { newGfx, newMem, runBasic } from "./casioBasic";
import { buildG1m, programBytes } from "../casioG1m";
import { POLIARM_LINES, poliarm, type PoliarmInput } from "../poliarm";

// The exercise: u = 311·sen(ωt), 50 Hz; branch 1 R = 10 Ω + XL = 17,32 Ω, branch 2 R = 20 Ω, a load with
// i3 = 42,42·sen(314t) + 35,35·sen(628t − 30°) + 14,142·sen(942t + 60°); "L" closes the capacitor's branch.
const EXERCISE: PoliarmInput = {
  peak: true,
  f: 50,
  harmonics: [
    { h: 1, U: 311, phiU: 0, I: 42.42, phiI: 0 },
    { h: 2, I: 35.35, phiI: -30 },
    { h: 3, I: 14.142, phiI: 60 },
  ],
  branches: [
    { R: 10, XL: 17.32, XC: 0 },
    { R: 20, XL: 0, XC: 0 },
  ],
};

// Time domain, independent of the phasor algebra: u(t) and the source current i(t) = i1 + i2 + i3 (+ iC) sampled over one
// period, rms and P by numerical integration. The branches' currents are the steady-state solution of each branch's ODE.
function timeDomain(Xc: number) {
  const w = 2 * Math.PI * 50;
  const N = 20000;
  const Um = 311;
  // (the exercise writes 314t, 628t, 942t for ω, 2ω, 3ω: here the exact multiples of 100π, so the harmonics are orthogonal over a period)
  // steady state of u = Um·sen(wt) on R + L: i = Um/|Z|·sen(wt − atan(XL/R)); on a capacitor: i = Um·w·C·sen(wt + 90°)
  const z1 = Math.hypot(10, 17.32), a1 = Math.atan2(17.32, 10);
  const i = (t: number) =>
    Um / z1 * Math.sin(w * t - a1) +
    Um / 20 * Math.sin(w * t) +
    42.42 * Math.sin(w * t) + 35.35 * Math.sin(2 * w * t - (30 * Math.PI) / 180) + 14.142 * Math.sin(3 * w * t + (60 * Math.PI) / 180) +
    (Xc > 0 ? (Um / Xc) * Math.sin(w * t + Math.PI / 2) : 0);
  let sU = 0, sI = 0, sP = 0;
  for (let k = 0; k < N; k++) {
    const t = (k / N) * 0.02;
    const u = Um * Math.sin(w * t), c = i(t);
    sU += u * u; sI += c * c; sP += u * c;
  }
  return { Urms: Math.sqrt(sU / N), Irms: Math.sqrt(sI / N), P: sP / N };
}

describe("POLIARM (phasors) against the waveform and the exercise's numbers", () => {
  const open = poliarm(EXERCISE);
  const closed = poliarm(EXERCISE, 100);

  test("L open: the ammeter, the wattmeter and the source voltage are what the waveform gives", () => {
    const td = timeDomain(0);
    expect(open.Urms).toBeCloseTo(td.Urms, 2);
    expect(open.Irms).toBeCloseTo(td.Irms, 2);
    expect(open.P).toBeCloseTo(td.P, 1);
  });

  test("the numbers of the exercise (220 V, 11 A, 11 A, 30 A, 25 A, 10 A): 54,6 A, 10 230 W, 2 096 var, 12 005 VA, THD 56,7 %", () => {
    expect(open.Irms).toBeCloseTo(54.57, 1);
    const near = (v: number, ref: number) => expect(Math.abs(v / ref - 1)).toBeLessThan(0.003); // the exam's rounded 220 V / 30 A vs 311 / 42,42 peak
    near(open.P, 10230);
    near(open.Q, 2095.7);
    near(open.S, 12005);
    near(open.D, 5921);
    expect(open.THDi).toBeCloseTo(56.7, 0);
    expect(open.S ** 2).toBeCloseTo(open.P ** 2 + open.Q ** 2 + open.D ** 2, 3);
  });

  test("L closed (100 % of Q): C ≈ 138 µF, Q = 0, P unchanged, less current, a higher THD", () => {
    expect(closed.C).toBeCloseTo(137.8, 0);
    expect(closed.Q).toBeCloseTo(0, 6);
    expect(closed.P).toBeCloseTo(open.P, 6);
    expect(closed.Irms).toBeLessThan(open.Irms);
    expect(closed.THDi).toBeGreaterThan(open.THDi);
    expect(closed.D).toBeCloseTo(open.D, 3); // the capacitor does not change the distortion power (the voltage is a pure sinusoid)
    const td = timeDomain(closed.Xc!);
    expect(closed.Irms).toBeCloseTo(td.Irms, 2);
    expect(closed.P).toBeCloseTo(td.P, 1);
  });

  test("a partial compensation takes only that share of Q", () => {
    const half = poliarm(EXERCISE, 50);
    expect(half.Q).toBeCloseTo(open.Q / 2, 6);
    expect(half.C).toBeCloseTo(closed.C! / 2, 6);
  });
});

describe("POLIARM listing run by the interpreter", () => {
  // keys: 1 ARMONICOS, 2 RAMAS, 3 SIN COMPENSAR, 4 COMPENSAR, 5 POR ARMONICO, 0 salir (number keys of the menu)
  const K = { ARM: 72, RAM: 62, OPEN: 52, COMP: 73, EACH: 63, EXIT: 71 };
  const ARM_INPUTS = [1, 50, 3, /* h1 */ 1, 311, 0, 42.42, 0, /* h2 */ 2, 0, 35.35, -30, /* h3 */ 3, 0, 14.142, 60];
  const RAM_INPUTS = [2, 10, 17.32, 0, 20, 0, 0];
  const screens = (gfx: ReturnType<typeof newGfx>) => gfx.screens.filter((sc) => sc.length > 0);
  const value = (sc: [number, number, number | string][], label: string) => {
    const l = sc.find((x) => x[2] === label)!;
    return sc.find((x) => x[1] === l[1] && x[0] === 11)![2] as number;
  };

  test("SIN COMPENSAR gives the same I, P, Q, S, D, FP, THD as the phasor model", () => {
    const gfx = newGfx();
    runBasic(POLIARM_LINES, [0, ...ARM_INPUTS, ...RAM_INPUTS], gfx, newMem(), [K.ARM, K.RAM, K.OPEN, K.EXIT]);
    const sc = screens(gfx).find((s) => s.some((x) => x[2] === "I EF A"))!;
    const m = poliarm(EXERCISE);
    expect(value(sc, "I EF A")).toBeCloseTo(m.Irms, 5);
    expect(value(sc, "P W")).toBeCloseTo(m.P, 3);
    expect(value(sc, "Q VAR")).toBeCloseTo(m.Q, 3);
    expect(value(sc, "S VA")).toBeCloseTo(m.S, 3);
    expect(value(sc, "D VAR")).toBeCloseTo(m.D, 3);
    expect(value(sc, "FP")).toBeCloseTo(m.FP, 6);
    expect(value(sc, "THD I %")).toBeCloseTo(m.THDi, 4);
    const sc2 = screens(gfx).find((s) => s.some((x) => x[2] === "U EF V"))!;
    expect(value(sc2, "U EF V")).toBeCloseTo(m.Urms, 5);
    expect(value(sc2, "I FUND A")).toBeCloseTo(m.I1, 5);
    expect(value(sc2, "THD U %")).toBeCloseTo(0, 6);
  });

  test("COMPENSAR 100 % gives the compensated values and C in µF", () => {
    const gfx = newGfx();
    runBasic(POLIARM_LINES, [0, ...ARM_INPUTS, ...RAM_INPUTS, 100], gfx, newMem(), [K.ARM, K.RAM, K.COMP, K.EXIT]);
    const sc = screens(gfx).find((s) => s.some((x) => x[2] === "I EF A"))!;
    const m = poliarm(EXERCISE, 100);
    expect(value(sc, "I EF A")).toBeCloseTo(m.Irms, 5);
    expect(value(sc, "Q VAR")).toBeCloseTo(0, 3);
    expect(value(sc, "THD I %")).toBeCloseTo(m.THDi, 4);
    const sc2 = screens(gfx).find((s) => s.some((x) => x[2] === "C UF"))!;
    expect(value(sc2, "C UF")).toBeCloseTo(m.C!, 4);
    expect(value(sc2, "XC OHM")).toBeCloseTo(m.Xc!, 4);
  });

  test("POR ARMONICO lists the rms current of each harmonic", () => {
    const gfx = newGfx();
    runBasic(POLIARM_LINES, [0, ...ARM_INPUTS, ...RAM_INPUTS], gfx, newMem(), [K.ARM, K.RAM, K.EACH, K.EXIT]);
    const sc = screens(gfx).find((s) => s.some((x) => x[0] === 5 && x[1] === 3))!;
    const m = poliarm(EXERCISE);
    m.Ih.forEach((v, k) => expect(sc.find((x) => x[0] === 5 && x[1] === k + 1)![2]).toBeCloseTo(v, 5));
  });

  test("data persist: SEGUIR keeps them, NUEVO starts again; a peak / rms choice and the frequency are kept", () => {
    const mem = newMem();
    runBasic(POLIARM_LINES, [0, ...ARM_INPUTS, ...RAM_INPUTS], newGfx(), mem, [K.ARM, K.RAM, K.EXIT]);
    const gfx = newGfx();
    runBasic(POLIARM_LINES, [1], gfx, mem, [K.OPEN, K.EXIT]); // SEGUIR, then SIN COMPENSAR with the stored data
    const sc = screens(gfx).find((s) => s.some((x) => x[2] === "I EF A"))!;
    expect(value(sc, "P W")).toBeCloseTo(poliarm(EXERCISE).P, 3);
  });

  test("the angle conversion does not use the calculator's sin / cos: phases up to ±720° give the right components", () => {
    for (const phi of [-720, -300, -30, 0, 45, 90, 179, 180, 270, 359, 720]) {
      const mem = newMem();
      // NUEVO, rms values, 50 Hz, 1 harmonic: h = 1, U = 1 V at 0°, I = 100 A at φ
      runBasic(POLIARM_LINES, [0, 2, 50, 1, 1, 1, 0, 100, phi], newGfx(), mem, [K.ARM, K.EXIT]);
      expect(mem.L[4][1]).toBeCloseTo(100 * Math.cos((phi * Math.PI) / 180), 6);
      expect(mem.L[5][1]).toBeCloseTo(100 * Math.sin((phi * Math.PI) / 180), 6);
    }
  });
});

describe("POLIARM as a file", () => {
  test("every line fits the tokenizer and the file is small", () => {
    expect(() => programBytes(POLIARM_LINES)).not.toThrow();
    expect(buildG1m("POLIARM", POLIARM_LINES).length).toBeLessThan(6000);
  });
});

// Casio fx-9860GIII program POLITRI: three-phase systems with harmonics (guide "Poliarmónicas", exercises 704 / 705 / 706).
//  1. EQUILIBRADA — a balanced star. Per harmonic: order, U (R phase) and its angle, and either the load's current I and its
//     angle (704: a nonlinear load whose current is known) or the load R + j(n·XL − XC/n) per phase (706: z_n, I_n = U_n/z_n).
//     It gives the line current (ammeter), the neutral current I_N = 3·√Σ I_n² over the harmonics that are multiples of 3 (the
//     other harmonics of the three phases cancel), P, Q, S = 3·U_rms·I_rms, D = √(S² − P² − Q²) and the power factor, plus
//     I_n of each harmonic. With the neutral disconnected (RLC mode) the triple harmonics neither drive current nor appear on
//     the load: they are left out of U_rms and I_rms.
//  2. DESEQUILIBRADA — three currents of any size: per harmonic I_R, I_S, I_T (rms or peak, angle). It gives the rms current of
//     each phase and the neutral current I_N = √Σ_n |I_R,n + I_S,n + I_T,n|² (705).
// `politriBalanced` / `politriUnbalanced` are the same arithmetic in TypeScript so the tests can compare them with the
// waveform (rms by numerical integration) and with the listing run by the interpreter.
import { PAUSE, TRIG } from "./basicKit";

export const POLITRI_NAME = "POLITRI";

// A value of the table with one decimal pair of digits at column `col`
const row = (r: number, label: string, v: string, col = 10): string[] => [
  `Locate 1,${r},"${label}"`,
  `Locate ${col},${r},Intg (${v}×100+0.5)÷100`,
];

export const POLITRI_LINES = [
  "While 1=1",
  "ClrText",
  'Locate 1,1,"POLIARMONICAS 3F"',
  'Locate 1,2,"1 EQUILIBRADA"',
  'Locate 1,3,"2 DESEQUILIBRADA"',
  '"NRO 0 SALIR"?→U',
  "If U=0:Then Stop:IfEnd",
  // ---- 1: balanced star
  "If U=1:Then",
  "ClrText",
  '"1=PICO 2=EFICAZ"?→V',
  "1→W",
  "If V=1:Then 1÷√(2)→W:IfEnd",
  '"I: 1 DADA 2 R L C"?→T',
  "1→Z",
  "If T=2:Then",
  '"R OHM"?→R',
  '"XL OHM A F1"?→L',
  '"XC OHM A F1 0=NO"?→C',
  '"NEUTRO 1=SI 0=NO"?→Z',
  "IfEnd",
  '"CANT ARMONICAS MAX 7"?→N',
  "If N>7:Then 7→N:IfEnd",
  "If N<1:Then 1→N:IfEnd",
  "{0,0,0,0,0,0,0}→List 1",
  "{0,0,0,0,0,0,0}→List 2",
  "0→P:0→Q:0→M:0→G:0→H",
  "For 1→K To N",
  "ClrText",
  'Locate 1,1,"ARMONICA"',
  "Locate 10,1,K",
  '"ORDEN"?→A',
  '"U V"?→J',
  "J×W→J",
  '"U ANGULO GRADOS"?→B',
  // a triple harmonic: 1 in S
  "0→S",
  "If Abs (A÷3–Intg (A÷3+0.5))<0.001:Then 1→S:IfEnd",
  "0→I",
  "If T=1:Then",
  '"I A"?→I',
  "I×W→I",
  '"I ANGULO GRADOS"?→Y',
  "B–Y→B",
  ...TRIG,
  "P+J×I×C→P:Q+J×I×D→Q",
  "M+J×J→M",
  "IfEnd",
  "If T=2:Then",
  "A×L→Y",
  "If C>0:Then Y–C÷A→Y:IfEnd",
  "R×R+Y×Y→X",
  "1→O",
  "If S=1:Then Z→O:IfEnd",
  "If O=1:Then",
  "J÷√(X)→I",
  "P+R×I×I→P:Q+Y×I×I→Q",
  "M+J×J→M",
  "IfEnd",
  "IfEnd",
  "G+I×I→G",
  "If S=1:Then H+I×I→H:IfEnd",
  "I→List 1[K]:A→List 2[K]",
  "Next",
  "√(G)→G",
  "3×√(H)→H",
  "3×P→P:3×Q→Q",
  "3×√(M)×G→S",
  "√(Abs (S×S–P×P–Q×Q))→D",
  "0→F",
  "If S>0:Then P÷S→F:IfEnd",
  "ClrText",
  ...row(1, "I LINEA", "G"),
  ...row(2, "I NEUTRO", "H"),
  ...row(3, "P W", "P"),
  ...row(4, "Q VAR", "Q"),
  ...row(5, "S VA", "S"),
  ...row(6, "D VA", "D"),
  ...row(7, "FP", "F"),
  ...PAUSE,
  "ClrText",
  "For 1→K To N",
  "Locate 1,K,Intg (List 2[K]×100+0.5)÷100",
  "Locate 6,K,Intg (List 1[K]×100+0.5)÷100",
  "Next",
  ...PAUSE,
  "IfEnd",
  // ---- 2: three currents of any size (neutral current)
  "If U=2:Then",
  "ClrText",
  '"1=PICO 2=EFICAZ"?→V',
  "1→W",
  "If V=1:Then 1÷√(2)→W:IfEnd",
  '"CANT ARMONICAS MAX 7"?→N',
  "If N>7:Then 7→N:IfEnd",
  "If N<1:Then 1→N:IfEnd",
  "{0,0,0}→List 3",
  "0→M",
  "For 1→K To N",
  "0→X:0→Y",
  "For 1→J To 3",
  "ClrText",
  'Locate 1,1,"ARMONICA"',
  "Locate 10,1,K",
  'If J=1:Then Locate 1,2,"FASE R":IfEnd',
  'If J=2:Then Locate 1,2,"FASE S":IfEnd',
  'If J=3:Then Locate 1,2,"FASE T":IfEnd',
  '"I A"?→A',
  "A×W→A",
  '"I ANGULO GRADOS"?→B',
  ...TRIG,
  "List 3[J]+A×A→List 3[J]",
  "X+A×C→X:Y+A×D→Y",
  "Next",
  "M+X×X+Y×Y→M",
  "Next",
  "√(List 3[1])→G:√(List 3[2])→H:√(List 3[3])→I",
  "√(M)→M",
  "G→F",
  "If H>F:Then H→F:IfEnd",
  "If I>F:Then I→F:IfEnd",
  "ClrText",
  ...row(1, "IR EF", "G"),
  ...row(2, "IS EF", "H"),
  ...row(3, "IT EF", "I"),
  ...row(4, "I NEUTRO", "M"),
  ...row(5, "MAS CARGADA", "F", 13),
  ...PAUSE,
  "IfEnd",
  "WhileEnd",
];

// ---- the same arithmetic in TypeScript ----------------------------------------------------------------------------

const deg = (d: number) => (d * Math.PI) / 180;
const isTriple = (n: number) => Math.abs(n / 3 - Math.round(n / 3)) < 1e-3;

export interface BalancedHarmonic {
  n: number;
  U: number; // of the R phase
  phiU: number; // degrees
  I?: number; // the load's current, if given
  phiI?: number;
}
export interface BalancedInput {
  peak: boolean; // the values are peaks (× 1/√2) or rms
  harmonics: BalancedHarmonic[];
  load?: { R: number; XL: number; XC: number }; // per phase, series, at the fundamental; used when I is not given
  neutral: boolean; // connected (only matters in the load mode)
}
export interface BalancedResult {
  IL: number;
  IN: number;
  P: number;
  Q: number;
  S: number;
  D: number;
  FP: number;
  I: number[]; // rms current of each harmonic
}

export function politriBalanced(inp: BalancedInput): BalancedResult {
  const k = inp.peak ? 1 / Math.SQRT2 : 1;
  let P = 0, Q = 0, U2 = 0, I2 = 0, IN2 = 0;
  const I: number[] = [];
  for (const h of inp.harmonics) {
    const U = h.U * k;
    let In = 0;
    if (h.I !== undefined) {
      In = h.I * k;
      P += U * In * Math.cos(deg(h.phiU - (h.phiI ?? 0)));
      Q += U * In * Math.sin(deg(h.phiU - (h.phiI ?? 0)));
      U2 += U * U;
    } else {
      const { R, XL, XC } = inp.load!;
      const X = h.n * XL - (XC > 0 ? XC / h.n : 0);
      if (!isTriple(h.n) || inp.neutral) {
        In = U / Math.hypot(R, X);
        P += R * In * In;
        Q += X * In * In;
        U2 += U * U;
      }
    }
    I.push(In);
    I2 += In * In;
    if (isTriple(h.n)) IN2 += In * In;
  }
  const IL = Math.sqrt(I2);
  const S = 3 * Math.sqrt(U2) * IL;
  P *= 3;
  Q *= 3;
  return { IL, IN: 3 * Math.sqrt(IN2), P, Q, S, D: Math.sqrt(Math.abs(S * S - P * P - Q * Q)), FP: S > 0 ? P / S : 0, I };
}

export interface UnbalancedInput {
  peak: boolean;
  harmonics: [number, number][][]; // per harmonic: [rms or peak, degrees] of R, S, T
}
export function politriUnbalanced(inp: UnbalancedInput) {
  const k = inp.peak ? 1 / Math.SQRT2 : 1;
  const ss = [0, 0, 0];
  let IN2 = 0;
  for (const h of inp.harmonics) {
    let x = 0, y = 0;
    h.forEach(([m, a], j) => {
      ss[j] += (m * k) ** 2;
      x += m * k * Math.cos(deg(a));
      y += m * k * Math.sin(deg(a));
    });
    IN2 += x * x + y * y;
  }
  const I = ss.map(Math.sqrt);
  return { I, IN: Math.sqrt(IN2), max: Math.max(...I) };
}


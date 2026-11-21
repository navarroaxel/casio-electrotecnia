// Casio fx-9860GIII program TRIFAS: three-phase systems (phases R S T). A symmetrical source (direct RST or inverse RTS sequence, given by
// any one of its phase or line voltages) feeding a star load with neutral (4 wires), a star load without neutral (3 wires,
// with the displacement of the neutral) or a delta load, balanced or not. It gives the line currents, the neutral current
// (4 wires) or the neutral displacement (3 wires) or the phase currents (delta), P, Q and S, and, for the balanced load
// measured with wattmeters, P, Q, S from one wattmeter (Q/√3) or from the Aron connection. `solveThreePhase` is the same
// arithmetic in TypeScript so the tests can compare it with the listing and with the circuit's own laws (KCL, Ohm).
import { PAUSE, TRIG, atan2Lines, menuLines } from "./basicKit";

export const TRIFAS_NAME = "TRIFAS";

const INIT = [
  "{0,0,0}→List 1",
  "{0,0,0}→List 2",
  "{0,0,0}→List 3",
  "{0,0,0}→List 4",
  "{0,0,0}→List 5",
  "{0,0,0}→List 6",
  "{0,0,0}→List 7",
  "{0,0,0}→List 8",
  "{0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}→List 9",
  "{1,0,0,0,0,0,0,0,0,0}→List 10",
];

// `Locate 1,row,"label"` and the polar form of (re, im) in the columns 4 and 13, rounded to 2 decimals.
const phasorRow = (row: number, label: string, re: string, im: string): string[] => [
  ...atan2Lines(re, im, "X", "Y"),
  `Locate 1,${row},"${label}"`,
  `Locate 4,${row},Intg (X×100+0.5)÷100`,
  `Locate 13,${row},Intg (Y×100+0.5)÷100`,
];
const valueRow = (row: number, label: string, v: string): string[] => [
  `Locate 1,${row},"${label}"`,
  `Locate 7,${row},Intg (${v}×100+0.5)÷100`,
];

// Data: List 1 / 2 = Re / Im of the phase voltages U_RN, U_SN, U_TN of the source (rms); 3 / 4 = Re / Im of the impedances of
// the three load elements (phases R S T, or RS ST TR in delta); 5 / 6 = line currents; 7 / 8 = voltage on each element;
// List 9 = {P, Q, S, Re / Im of I_N (4 wires) or of the displacement U_N'N (3 wires), …, element currents at 10-15};
// List 10 = {connection 1 = star 4 wires, 2 = star 3 wires, 3 = delta}. They persist: 0 = new, 1 = go on.
export const TRIFAS_LINES = [
  '"0=NUEVO 1=SEGUIR"?→A',
  "If A=0:Then",
  ...INIT,
  "IfEnd",
  "While 1=1",
  ...menuLines({
    count: 6,
    exit: "item",
    choice: "O",
    flag: "Y",
    sel: "R",
    row0: 1,
    draw: [
      'Locate 3,1,"TENSIONES"',
      'Locate 3,2,"CARGA"',
      'Locate 3,3,"RESOLVER"',
      'Locate 3,4,"MEDICION BALANC."',
      'Locate 3,5,"BORRAR TODO"',
      'Locate 3,6,"SALIR"',
    ],
  }),
  "If O=0:Then Stop:IfEnd",
  // 1: the source: sequence and one voltage as reference
  "If O=1:Then",
  "ClrText",
  '"1=RST 2=RTS"?→T',
  "ClrText",
  'Locate 1,1,"REFERENCIA:"',
  'Locate 1,2,"1 URN 2 USN 3 UTN"',
  'Locate 1,3,"4 URS 5 UST 6 UTR"',
  '"NRO"?→R',
  '"VALOR EFICAZ V"?→A',
  '"ANGULO GRADOS"?→B',
  "0→E",
  "If R=2:Then –120→E:IfEnd",
  "If R=3:Then 120→E:IfEnd",
  "If R=4:Then 30→E:IfEnd",
  "If R=5:Then –90→E:IfEnd",
  "If R=6:Then 150→E:IfEnd",
  "1→H",
  "If T=2:Then –1→H:IfEnd",
  "E×H→E",
  "If R>3:Then A÷√(3)→A:IfEnd",
  "B–E→G",
  "For 1→K To 3",
  "G→B",
  "If K=2:Then G–120×H→B:IfEnd",
  "If K=3:Then G+120×H→B:IfEnd",
  ...TRIG,
  "A×C→List 1[K]:A×D→List 2[K]",
  "Next",
  "IfEnd",
  // 2: the load
  "If O=2:Then",
  "ClrText",
  'Locate 1,1,"CONEXION:"',
  'Locate 1,2,"1 ESTRELLA 4 HILOS"',
  'Locate 1,3,"2 ESTRELLA 3 HILOS"',
  'Locate 1,4,"3 TRIANGULO"',
  '"NRO"?→T',
  "If T<1:Then 1→T:IfEnd",
  "If T>3:Then 3→T:IfEnd",
  "T→List 10[1]",
  "For 1→K To 3",
  "ClrText",
  "If T<3:Then",
  'If K=1:Then Locate 1,1,"Z DE LA FASE R":IfEnd',
  'If K=2:Then Locate 1,1,"Z DE LA FASE S":IfEnd',
  'If K=3:Then Locate 1,1,"Z DE LA FASE T":IfEnd',
  "IfEnd",
  "If T=3:Then",
  'If K=1:Then Locate 1,1,"Z ENTRE R Y S":IfEnd',
  'If K=2:Then Locate 1,1,"Z ENTRE S Y T":IfEnd',
  'If K=3:Then Locate 1,1,"Z ENTRE T Y R":IfEnd',
  "IfEnd",
  '"MODULO OHM"?→A',
  '"ANGULO GRADOS"?→B',
  ...TRIG,
  "A×C→List 3[K]:A×D→List 4[K]",
  "Next",
  "IfEnd",
  // 5: clear everything (asks first)
  "If O=5:Then",
  ...menuLines({
    count: 2,
    exit: 1,
    choice: "X",
    flag: "T",
    sel: "S",
    key: "M",
    draw: ['Locate 1,1,"BORRAR TODO?"', 'Locate 3,2,"NO"', 'Locate 3,3,"SI, BORRAR"'],
  }),
  "If X=2:Then",
  ...INIT,
  "IfEnd",
  "IfEnd",
  // 3: solve
  "If O=3:Then",
  "List 10[1]→T",
  "0→X:0→Y",
  "If T=2:Then",
  "0→P:0→Q:0→M:0→L",
  "For 1→K To 3",
  "List 3[K]→A:List 4[K]→B",
  "A×A+B×B→D",
  "If D>0:Then",
  "A÷D→E:–B÷D→F",
  "P+E×List 1[K]–F×List 2[K]→P",
  "Q+E×List 2[K]+F×List 1[K]→Q",
  "M+E→M:L+F→L",
  "IfEnd",
  "Next",
  "M×M+L×L→D",
  "If D>0:Then (P×M+Q×L)÷D→X:(Q×M–P×L)÷D→Y:IfEnd",
  "IfEnd",
  "X→List 9[4]:Y→List 9[5]",
  "For 1→K To 3",
  "If T=3:Then",
  "K+1→J",
  "If J>3:Then 1→J:IfEnd",
  "List 1[K]–List 1[J]→C:List 2[K]–List 2[J]→D",
  "IfEnd",
  "If T<3:Then List 1[K]–X→C:List 2[K]–Y→D:IfEnd",
  "C→List 7[K]:D→List 8[K]",
  "List 3[K]→A:List 4[K]→B:A×A+B×B→E",
  "0→G:0→H",
  "If E>0:Then (C×A+D×B)÷E→G:(D×A–C×B)÷E→H:IfEnd",
  "G→List 5[K]:H→List 6[K]",
  "G→List 9[8+2×K]:H→List 9[9+2×K]",
  "Next",
  "If T=3:Then",
  "List 9[10]–List 9[14]→List 5[1]:List 9[11]–List 9[15]→List 6[1]",
  "List 9[12]–List 9[10]→List 5[2]:List 9[13]–List 9[11]→List 6[2]",
  "List 9[14]–List 9[12]→List 5[3]:List 9[15]–List 9[13]→List 6[3]",
  "IfEnd",
  "If T=1:Then",
  "List 5[1]+List 5[2]+List 5[3]→List 9[4]",
  "List 6[1]+List 6[2]+List 6[3]→List 9[5]",
  "IfEnd",
  "0→P:0→Q",
  "For 1→K To 3",
  "List 7[K]→A:List 8[K]→B:List 9[8+2×K]→C:List 9[9+2×K]→D",
  "P+A×C+B×D→P",
  "Q+B×C–A×D→Q",
  "Next",
  "P→List 9[1]:Q→List 9[2]:√(P×P+Q×Q)→List 9[3]",
  // page 1: line currents, neutral current or displacement, P, Q, S
  "ClrText",
  ...phasorRow(1, "IR", "List 5[1]", "List 6[1]"),
  ...phasorRow(2, "IS", "List 5[2]", "List 6[2]"),
  ...phasorRow(3, "IT", "List 5[3]", "List 6[3]"),
  "If T=1:Then",
  ...phasorRow(4, "IN", "List 9[4]", "List 9[5]"),
  "IfEnd",
  "If T=2:Then",
  ...phasorRow(4, "UNN", "List 9[4]", "List 9[5]"),
  "IfEnd",
  ...valueRow(5, "P W", "List 9[1]"),
  ...valueRow(6, "Q VAR", "List 9[2]"),
  ...valueRow(7, "S VA", "List 9[3]"),
  ...PAUSE,
  // page 2: phase currents (delta) or the voltages on the load's phases (star)
  "If T>1:Then",
  "ClrText",
  "If T=2:Then",
  ...phasorRow(1, "UR", "List 7[1]", "List 8[1]"),
  ...phasorRow(2, "US", "List 7[2]", "List 8[2]"),
  ...phasorRow(3, "UT", "List 7[3]", "List 8[3]"),
  "IfEnd",
  "If T=3:Then",
  ...phasorRow(1, "IRS", "List 9[10]", "List 9[11]"),
  ...phasorRow(2, "IST", "List 9[12]", "List 9[13]"),
  ...phasorRow(3, "ITR", "List 9[14]", "List 9[15]"),
  "IfEnd",
  ...PAUSE,
  "IfEnd",
  "IfEnd",
  // 4: balanced load measured with wattmeters
  "If O=4:Then",
  ...menuLines({
    count: 2,
    exit: "zero",
    choice: "X",
    flag: "T",
    sel: "S",
    key: "M",
    draw: ['Locate 1,1,"MEDICION BALANCEADA"', 'Locate 3,2,"UN VATIMETRO"', 'Locate 3,3,"ARON 2 VATIMETROS"'],
  }),
  "If X=1:Then",
  "ClrText",
  '"1=LINEA 2=FASE"?→T',
  '"U EFICAZ V"?→A',
  "If T=2:Then A×√(3)→A:IfEnd",
  '"I LINEA A"?→B',
  '"W1 W"?→C',
  "√(3)×C→Q",
  "√(3)×A×B→S",
  "Abs (S×S–Q×Q)→P",
  "√(P)→P",
  "IfEnd",
  "If X=2:Then",
  "ClrText",
  '"W1 W"?→A',
  '"W2 W"?→B',
  "A+B→P",
  "√(3)×(A–B)→Q",
  "√(P×P+Q×Q)→S",
  "IfEnd",
  "If X>0:Then",
  ...atan2Lines("P", "Q", "L", "M"),
  "0→N",
  "If S>0:Then P÷S→N:IfEnd",
  "ClrText",
  ...valueRow(1, "P W", "P"),
  ...valueRow(2, "Q VAR", "Q"),
  ...valueRow(3, "S VA", "S"),
  ...valueRow(4, "FP", "N"),
  ...valueRow(5, "FI GRADOS", "M"),
  ...PAUSE,
  "IfEnd",
  "IfEnd",
  "WhileEnd",
];

// ---- the same arithmetic in phasors ------------------------------------------------------------------------------

type Cx = [number, number];
const add = (a: Cx, b: Cx): Cx => [a[0] + b[0], a[1] + b[1]];
const sub = (a: Cx, b: Cx): Cx => [a[0] - b[0], a[1] - b[1]];
const mul = (a: Cx, b: Cx): Cx => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const div = (a: Cx, b: Cx): Cx => {
  const d = b[0] * b[0] + b[1] * b[1];
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
};
const conj = (a: Cx): Cx => [a[0], -a[1]];
const polar = (amp: number, deg: number): Cx => [amp * Math.cos((deg * Math.PI) / 180), amp * Math.sin((deg * Math.PI) / 180)];
export const mag = (a: Cx) => Math.hypot(a[0], a[1]);
export const angle = (a: Cx) => (mag(a) > 0 ? (Math.atan2(a[1], a[0]) * 180) / Math.PI : 0);

export type Reference = "RN" | "SN" | "TN" | "RS" | "ST" | "TR";
export interface ThreePhaseInput {
  sequence: "RST" | "RTS";
  ref: Reference;
  value: number; // rms of the reference voltage
  angle: number; // degrees
  connection: "Y4" | "Y3" | "D";
  Z: [[number, number], [number, number], [number, number]]; // [modulus, degrees] of R S T (or RS ST TR)
}
export interface ThreePhaseResult {
  U: Cx[]; // phase voltages of the source
  V: Cx[]; // voltage on each load element
  Ielem: Cx[]; // current of each load element
  I: Cx[]; // line currents
  IN?: Cx; // I_R + I_S + I_T (4 wires)
  UNN?: Cx; // displacement of the load's neutral (3 wires)
  P: number;
  Q: number;
  S: number;
}

const OFF: Record<Reference, number> = { RN: 0, SN: -120, TN: 120, RS: 30, ST: -90, TR: 150 };

export function solveThreePhase(inp: ThreePhaseInput): ThreePhaseResult {
  const s = inp.sequence === "RST" ? 1 : -1;
  const line = inp.ref === "RS" || inp.ref === "ST" || inp.ref === "TR";
  const Uf = line ? inp.value / Math.sqrt(3) : inp.value;
  const thA = inp.angle - s * OFF[inp.ref];
  const U: Cx[] = [polar(Uf, thA), polar(Uf, thA - 120 * s), polar(Uf, thA + 120 * s)];
  const Z = inp.Z.map(([m, a]) => polar(m, a));
  let UNN: Cx | undefined;
  let V: Cx[];
  if (inp.connection === "D") V = [sub(U[0], U[1]), sub(U[1], U[2]), sub(U[2], U[0])];
  else if (inp.connection === "Y3") {
    let num: Cx = [0, 0], den: Cx = [0, 0];
    Z.forEach((z, k) => {
      const y = div([1, 0], z);
      num = add(num, mul(y, U[k]));
      den = add(den, y);
    });
    UNN = div(num, den);
    V = U.map((u) => sub(u, UNN!));
  } else V = U;
  const Ielem = V.map((v, k) => div(v, Z[k]));
  const I: Cx[] = inp.connection === "D" ? [sub(Ielem[0], Ielem[2]), sub(Ielem[1], Ielem[0]), sub(Ielem[2], Ielem[1])] : Ielem;
  let P = 0, Q = 0;
  V.forEach((v, k) => {
    const sk = mul(v, conj(Ielem[k]));
    P += sk[0];
    Q += sk[1];
  });
  return { U, V, Ielem, I, IN: inp.connection === "Y4" ? add(add(I[0], I[1]), I[2]) : undefined, UNN, P, Q, S: Math.hypot(P, Q) };
}

// Balanced load measured with wattmeters. One wattmeter in a line with its voltage coil between the other two lines reads
// U_L·I·sen φ = Q/√3 (the voltage is 90° off the line-to-neutral one). Aron: P = W1 + W2, Q = √3·(W1 − W2).
export function oneWattmeter(UL: number, I: number, W: number) {
  const Q = Math.sqrt(3) * W;
  const S = Math.sqrt(3) * UL * I;
  const P = Math.sqrt(Math.abs(S * S - Q * Q));
  return { P, Q, S, FP: P / S, phi: (Math.atan2(Q, P) * 180) / Math.PI };
}
export function aron(W1: number, W2: number) {
  const P = W1 + W2;
  const Q = Math.sqrt(3) * (W1 - W2);
  const S = Math.hypot(P, Q);
  return { P, Q, S, FP: S > 0 ? P / S : 0, phi: (Math.atan2(Q, P) * 180) / Math.PI };
}

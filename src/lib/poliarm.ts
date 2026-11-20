// Casio fx-9860GIII program POLIARM: a circuit with a sinusoidal (or distorted) source feeding linear branches R, L, C in
// parallel plus a load whose harmonic currents are known (the typical electrotecnia exercise: u = 311·sen(ωt), a nonlinear
// load with i3(t) = 42,42·sen(314t) + 35,35·sen(628t − 30°) + 14,142·sen(942t + 60°), "L" = the switch of the capacitor).
// It gives, with the capacitor out and with it compensating a percentage of Q: the rms current (ammeter), P (wattmeter),
// Q (Budeanu: Σ U_h·I_h·sen φ_h), S = U_rms·I_rms, the distortion power D = √(S² − P² − Q²), the power factor, THD_I,
// THD_U and the capacitor C. `poliarm` is the same arithmetic in TypeScript, in phasors, so the tests can compare it with
// the time-domain waveform (rms and P by numerical integration) and with the listing run by the interpreter.

// ---- the listing -------------------------------------------------------------------------------------------------

// An arrow-key menu (see casio-structural-programs): ▲ 28 ▼ 37 move a > marker, EXE 31 chooses, a number key chooses that item
// at once, 0 (71) / EXIT (47) leave. `exit`: "item" = last item is "0 SALIR", number = chooses that item (a yes / no).
const DIGIT_KEY = [71, 72, 62, 52, 73, 63, 53, 74, 64, 54]; // 0 1 2 3 4 5 6 7 8 9
function menuLines(o: {
  count: number;
  exit?: "item" | "zero" | number;
  choice: string;
  flag: string;
  draw: string[];
  sel?: string;
  key?: string;
  row0?: number;
}): string[] {
  const sel = o.sel ?? "S";
  const key = o.key ?? "W";
  const row0 = o.row0 ?? 2;
  const draw = o.draw.map((line) => {
    const m = /^Locate 3,(\d+),"(.*)"$/.exec(line);
    if (!m || +m[1] < row0 || +m[1] >= row0 + o.count) return line;
    const idx = +m[1] - row0 + 1;
    const digit = o.exit === "item" && idx === o.count ? 0 : idx;
    return `Locate 3,${m[1]},"${m[2]}${"⁰¹²³⁴⁵⁶⁷⁸⁹"[digit]}"`;
  });
  const items = o.exit === "item" ? o.count - 1 : o.count;
  const exitSel = o.exit === "item" ? o.count : o.exit === "zero" ? 0 : o.exit;
  return [
    `1→${sel}:1→${o.flag}`,
    "ClrText",
    ...draw,
    `While ${o.flag}=1`,
    Array.from({ length: o.count }, (_, k) => `Locate 1,${k + row0}," "`).join(":"),
    `Locate 1,${sel}+${row0 - 1},">"`,
    "While Getkey>0:WhileEnd",
    `0→${key}`,
    `While ${key}=0`,
    `Getkey→${key}`,
    "WhileEnd",
    `If ${key}=28:Then ${sel}–1→${sel}:IfEnd`,
    `If ${key}=37:Then ${sel}+1→${sel}:IfEnd`,
    `If ${sel}<1:Then ${o.count}→${sel}:IfEnd`,
    `If ${sel}>${o.count}:Then 1→${sel}:IfEnd`,
    `If ${key}=31:Then 0→${o.flag}:IfEnd`,
    ...Array.from({ length: items }, (_, k) => `If ${key}=${DIGIT_KEY[k + 1]}:Then ${k + 1}→${sel}:0→${o.flag}:IfEnd`),
    `If ${key}=71:Then ${exitSel}→${sel}:0→${o.flag}:IfEnd`,
    `If ${key}=47:Then ${exitSel}→${sel}:0→${o.flag}:IfEnd`,
    "WhileEnd",
    `${sel}→${o.choice}`,
    ...(o.exit === "item" ? [`If ${sel}=${o.count}:Then 0→${o.choice}:IfEnd`] : []),
  ];
}

const PAUSE = ["While Getkey>0:WhileEnd", "While Getkey=0:WhileEnd"];

const PI = "3.14159265358979";
const TWO_PI = "6.28318530717959";

// cos and sen of the angle in B (degrees) → C = cos, D = sen, with the angle in radians in E and its square in F. Taylor
// series (Horner) after bringing the angle into −π…π: it does not depend on the calculator's angle unit (Deg / Rad), which a
// program cannot rely on. Error < 1e-10 on the whole range.
const horner = (x: string, first: number, count: number): string => {
  // 1 − x/(a(a+1))·(1 − x/(b(b+1))·(…)) with a = first, first+2, …
  const den = (k: number) => (first + 2 * k) * (first + 2 * k + 1);
  let s = `1–${x}÷${den(count - 1)}`;
  for (let k = count - 2; k >= 0; k--) s = `1–${x}÷${den(k)}×(${s})`;
  return s;
};
const TRIG = [
  `B×${PI}÷180→E`,
  `E–${TWO_PI}×Intg (E÷${TWO_PI}+0.5)→E`,
  "E×E→F",
  `${horner("F", 1, 11)}→C`,
  `E×(${horner("F", 2, 10)})→D`,
];

const INIT = [
  "{0,0,0,0,0,0,0}→List 1",
  "{0,0,0,0,0,0,0}→List 2",
  "{0,0,0,0,0,0,0}→List 3",
  "{0,0,0,0,0,0,0}→List 4",
  "{0,0,0,0,0,0,0}→List 5",
  "{0,0,0}→List 6",
  "{0,0,0}→List 7",
  "{0,0,0}→List 8",
  "{0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}→List 9",
  "{0,0,50,100,1,0,0,0,0,0}→List 10",
];

export const POLIARM_NAME = "POLIARM";

// Data: List 1 = order h, 2 / 3 = Re / Im of U_h (rms), 4 / 5 = Re / Im of the load current I_h (rms), up to 7 harmonics;
// 6 / 7 / 8 = R, XL, XC at the fundamental of up to 3 linear branches; List 9 = results; List 10 = {harmonics, branches, f,
// % to compensate, factor peak→rms, …}. They persist: 0 = new the first time, 1 = go on.
export const POLIARM_LINES = [
  '"0=NUEVO 1=SEGUIR"?→A',
  "If A=0:Then",
  ...INIT,
  "IfEnd",
  "While 1=1",
  ...menuLines({
    count: 7,
    exit: "item",
    choice: "O",
    flag: "Y",
    sel: "R",
    row0: 1,
    draw: [
      'Locate 3,1,"ARMONICOS"',
      'Locate 3,2,"RAMAS R L C"',
      'Locate 3,3,"SIN COMPENSAR"',
      'Locate 3,4,"COMPENSAR C"',
      'Locate 3,5,"POR ARMONICO"',
      'Locate 3,6,"BORRAR TODO"',
      'Locate 3,7,"SALIR"',
    ],
  }),
  "If O=0:Then Stop:IfEnd",
  // 1: the harmonics of u and of the load's current
  "If O=1:Then",
  "ClrText",
  '"1=PICO 2=EFICAZ"?→T',
  "1→F",
  "If T=1:Then 0.707106781186548→F:IfEnd",
  "F→List 10[5]",
  '"F HZ (0=50)"?→A',
  "If A=0:Then 50→A:IfEnd",
  "A→List 10[3]",
  '"N ARMONICOS (1 A 7)"?→N',
  "If N<1:Then 1→N:IfEnd",
  "If N>7:Then 7→N:IfEnd",
  "N→List 10[1]",
  "List 10[5]→G",
  "For 1→K To N",
  "ClrText",
  'Locate 1,1,"ARMONICO":Locate 10,1,K:Locate 12,1,"DE":Locate 15,1,N',
  '"ORDEN H"?→H',
  "H→List 1[K]",
  '"U V (0 SI NO HAY)"?→A',
  "0→B",
  "If Abs (A)>0:Then",
  '"FASE U GRADOS"?→B',
  "IfEnd",
  ...TRIG,
  "A×G×C→List 2[K]:A×G×D→List 3[K]",
  '"I A (0 SI NO HAY)"?→A',
  "0→B",
  "If Abs (A)>0:Then",
  '"FASE I GRADOS"?→B',
  "IfEnd",
  ...TRIG,
  "A×G×C→List 4[K]:A×G×D→List 5[K]",
  "Next",
  "IfEnd",
  // 2: the linear branches
  "If O=2:Then",
  "ClrText",
  '"N RAMAS (0 A 3)"?→N',
  "If N<0:Then 0→N:IfEnd",
  "If N>3:Then 3→N:IfEnd",
  "N→List 10[2]",
  "If N>0:Then",
  "For 1→K To N",
  "ClrText",
  'Locate 1,1,"RAMA":Locate 6,1,K:Locate 8,1,"DE":Locate 11,1,N',
  '"R OHM"?→A',
  "A→List 6[K]",
  '"XL OHM (A F FUND)"?→A',
  "A→List 7[K]",
  '"XC OHM (A F FUND)"?→A',
  "A→List 8[K]",
  "Next",
  "IfEnd",
  "IfEnd",
  // 6: clear everything (asks first)
  "If O=6:Then",
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
  // 3, 4, 5: the computation (3 = capacitor out, 4 = compensating a % of Q, 5 = current of each harmonic)
  "If O>2:Then",
  "If O<6:Then",
  "List 10[1]→N",
  "1→I",
  "0→V",
  "If O=4:Then",
  '"% A COMPENSAR (0=100)"?→X',
  "If X=0:Then 100→X:IfEnd",
  "X→List 10[4]",
  "2→I",
  "IfEnd",
  "For 1→Z To I",
  "If Z=2:Then",
  "List 10[4]×G÷100→U",
  "0→V",
  "If U>0:Then",
  "E÷U→V",
  `U÷(${TWO_PI}×List 10[3]×E)×1000000→List 9[20]`,
  "IfEnd",
  "IfEnd",
  "0→P:0→Q:0→M:0→L:0→E:0→F:0→G",
  "For 1→K To N",
  "List 1[K]→H",
  "List 2[K]→A:List 3[K]→B",
  "List 4[K]→C:List 5[K]→D",
  "If List 10[2]>0:Then",
  "For 1→J To List 10[2]",
  "List 6[J]→S",
  "H×List 7[J]–List 8[J]÷H→T",
  "S×S+T×T→U",
  "If U>0:Then",
  "C+(A×S+B×T)÷U→C",
  "D+(B×S–A×T)÷U→D",
  "IfEnd",
  "Next",
  "IfEnd",
  "If V>0:Then",
  "C–H×B÷V→C",
  "D+H×A÷V→D",
  "IfEnd",
  "P+A×C+B×D→P",
  "Q+B×C–A×D→Q",
  "M+A×A+B×B→M",
  "L+C×C+D×D→L",
  "√(C×C+D×D)→List 9[K]",
  "If H=1:Then",
  "A×A+B×B→E:C×C+D×D→F:B×C–A×D→G",
  "IfEnd",
  "Next",
  "√(M×L)→T",
  "M×L–P×P–Q×Q→U",
  "If U<0:Then 0→U:IfEnd",
  "√(U)→U",
  "0→X:0→J",
  "If F>0:Then √(Abs (L–F)÷F)×100→X:IfEnd",
  "If E>0:Then √(Abs (M–E)÷E)×100→J:IfEnd",
  "Next",
  "If O=5:Then",
  "ClrText",
  "For 1→K To N",
  'Locate 1,K,List 1[K]:Locate 5,K,List 9[K]',
  "Next",
  ...PAUSE,
  "IfEnd",
  "If O<5:Then",
  "ClrText",
  'Locate 1,1,"I EF A":Locate 11,1,√(L)',
  'Locate 1,2,"P W":Locate 11,2,P',
  'Locate 1,3,"Q VAR":Locate 11,3,Q',
  'Locate 1,4,"S VA":Locate 11,4,T',
  'Locate 1,5,"D VAR":Locate 11,5,U',
  "0→W",
  "If T>0:Then P÷T→W:IfEnd",
  'Locate 1,6,"FP":Locate 11,6,W',
  'Locate 1,7,"THD I %":Locate 11,7,X',
  ...PAUSE,
  "ClrText",
  'Locate 1,1,"U EF V":Locate 11,1,√(M)',
  'Locate 1,2,"I FUND A":Locate 11,2,√(F)',
  'Locate 1,3,"THD U %":Locate 11,3,J',
  "If O=4:Then",
  'Locate 1,4,"C UF":Locate 11,4,List 9[20]',
  'Locate 1,5,"XC OHM":Locate 11,5,V',
  "IfEnd",
  ...PAUSE,
  "IfEnd",
  "IfEnd",
  "IfEnd",
  "WhileEnd",
];

// ---- the same arithmetic in phasors ------------------------------------------------------------------------------

type Cx = [number, number]; // [re, im]
const mul = (a: Cx, b: Cx): Cx => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const div = (a: Cx, b: Cx): Cx => {
  const d = b[0] * b[0] + b[1] * b[1];
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
};
const conj = (a: Cx): Cx => [a[0], -a[1]];
const polar = (amp: number, deg: number): Cx => [amp * Math.cos((deg * Math.PI) / 180), amp * Math.sin((deg * Math.PI) / 180)];

export interface Harmonic {
  h: number; // order
  U?: number; // amplitude of the voltage (peak or rms, see `peak`)
  phiU?: number; // degrees
  I?: number; // amplitude of the load's current
  phiI?: number; // degrees
}
export interface Branch {
  R: number;
  XL: number; // ohm at the fundamental
  XC: number; // ohm at the fundamental (0 = no capacitor)
}
export interface PoliarmInput {
  harmonics: Harmonic[];
  branches?: Branch[];
  peak?: boolean; // amplitudes are peak values (the exam's sen(...) form)
  f?: number;
}
export interface PoliarmResult {
  Irms: number;
  Urms: number;
  P: number;
  Q: number;
  S: number;
  D: number;
  FP: number;
  THDi: number; // %
  THDu: number; // %
  I1: number; // rms of the fundamental of the source current
  Ih: number[]; // rms of the source current of each harmonic, in the order given
  C?: number; // µF, only when compensating
  Xc?: number; // ohm at the fundamental
}

const nets = (input: PoliarmInput, Xc: number) => {
  const k = input.peak ? Math.SQRT1_2 : 1;
  return input.harmonics.map((hm) => {
    const U = polar((hm.U ?? 0) * k, hm.phiU ?? 0);
    let I = polar((hm.I ?? 0) * k, hm.phiI ?? 0);
    for (const b of input.branches ?? []) {
      const Z: Cx = [b.R, hm.h * b.XL - (b.XC > 0 ? b.XC / hm.h : 0)];
      if (Z[0] !== 0 || Z[1] !== 0) {
        const add = div(U, Z);
        I = [I[0] + add[0], I[1] + add[1]];
      }
    }
    if (Xc > 0) {
      const add = div(U, [0, -Xc / hm.h]);
      I = [I[0] + add[0], I[1] + add[1]];
    }
    return { h: hm.h, U, I };
  });
};

const measure = (input: PoliarmInput, Xc: number): PoliarmResult => {
  const hs = nets(input, Xc);
  let P = 0, Q = 0, U2 = 0, I2 = 0, U1 = 0, I1 = 0;
  for (const { h, U, I } of hs) {
    const s = mul(U, conj(I)); // U·I*: P + jQ
    P += s[0];
    Q += s[1];
    U2 += U[0] ** 2 + U[1] ** 2;
    I2 += I[0] ** 2 + I[1] ** 2;
    if (h === 1) {
      U1 = U[0] ** 2 + U[1] ** 2;
      I1 = I[0] ** 2 + I[1] ** 2;
    }
  }
  const S = Math.sqrt(U2 * I2);
  return {
    Irms: Math.sqrt(I2),
    Urms: Math.sqrt(U2),
    P,
    Q,
    S,
    D: Math.sqrt(Math.max(S * S - P * P - Q * Q, 0)),
    FP: S > 0 ? P / S : 0,
    THDi: I1 > 0 ? (Math.sqrt(Math.abs(I2 - I1)) / Math.sqrt(I1)) * 100 : 0,
    THDu: U1 > 0 ? (Math.sqrt(Math.abs(U2 - U1)) / Math.sqrt(U1)) * 100 : 0,
    I1: Math.sqrt(I1),
    Ih: hs.map(({ I }) => Math.hypot(I[0], I[1])),
  };
};

// `percent` = share of the fundamental Q that the capacitor compensates (undefined = capacitor out).
export function poliarm(input: PoliarmInput, percent?: number): PoliarmResult {
  const open = measure(input, 0);
  if (percent === undefined) return open;
  const fund = nets(input, 0).find((x) => x.h === 1);
  const U1sq = fund ? fund.U[0] ** 2 + fund.U[1] ** 2 : 0;
  const Q1 = fund ? mul(fund.U, conj(fund.I))[1] : 0;
  const Qc = (percent / 100) * Q1;
  if (!(Qc > 0)) return { ...open, C: 0, Xc: 0 };
  const Xc = U1sq / Qc;
  const omega = 2 * Math.PI * (input.f ?? 50);
  return { ...measure(input, Xc), C: (Qc / (omega * U1sq)) * 1e6, Xc };
}

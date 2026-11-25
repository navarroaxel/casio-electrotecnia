// Casio fx-9860GIII program TRIFAS: three-phase systems (phases R S T). A symmetrical source (direct RST or inverse RTS sequence, given by
// any one of its phase or line voltages) feeding a star load with neutral (4 wires), a star load without neutral (3 wires,
// with the displacement of the neutral) or a delta load, balanced or not. It gives the line currents, the neutral current
// (4 wires) or the neutral displacement (3 wires) or the phase currents (delta), P, Q and S, and, for the balanced load
// measured with wattmeters, P, Q, S from one wattmeter (Q/√3) or from the Aron connection. `solveThreePhase` is the same
// arithmetic in TypeScript so the tests can compare it with the listing and with the circuit's own laws (KCL, Ohm).
import { PAUSE, PI, TRIG, atan2Lines, menuLines } from "./basicKit";

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
  ...[15, 16, 17, 18, 19, 20].map((n) => `{0,0,0}→List ${n}`),
];

// The polar form of many phasors with ONE copy of the arctangent (it is the biggest piece of code): the phasors are put in
// Lists 21 / 22 (re / im) by the caller; this fills Lists 23 / 24 with their modulus / angle in degrees. Variables C-H, J, X, Y.
const POLAR = (n: number): string[] => [
  `For 1→J To ${n}`,
  ...atan2Lines("List 21[J]", "List 22[J]", "X", "Y"),
  "X→List 23[J]:Y→List 24[J]",
  "Next",
];
// print the polar form of entry `k` (Lists 23 / 24) at the row `row`: modulus at column 4, angle at column 13, 2 decimals
const showPolar = (row: string | number, k: string | number): string[] => [
  `Locate 4,${row},Intg (List 23[${k}]×100+0.5)÷100`,
  `Locate 13,${row},Intg (List 24[${k}]×100+0.5)÷100`,
];

// The capacitor bank in delta (equal C between R-S, S-T, T-R, across the source's line voltages). List 10[2] = 1 if it is
// connected, [3] = C in farads, [4] = ω. Lists 19 / 20: Re / Im of the capacitor currents I_RS,C = jωC·U_RS (and ST, TR);
// 15 / 16: the bank's line currents I_RC = I_RS,C − I_TR,C (…); 17 / 18: the line currents ahead of the bank,
// I_LR = I_R + I_RC (what the wattmeters and the ammeter before the bank see; the load's own currents stay in 5 / 6).
const BANK_UPDATE = [
  "For 1→K To 3",
  "K+1→J:If J>3:Then 1→J:IfEnd",
  "List 1[K]–List 1[J]→A:List 2[K]–List 2[J]→B",
  "–List 10[4]×List 10[3]×B→List 19[K]:List 10[4]×List 10[3]×A→List 20[K]",
  "Next",
  "For 1→K To 3",
  "K–1→J:If J<1:Then 3→J:IfEnd",
  "0→List 15[K]:0→List 16[K]",
  "If List 10[2]=1:Then",
  "List 19[K]–List 19[J]→List 15[K]:List 20[K]–List 20[J]→List 16[K]",
  "IfEnd",
  "List 5[K]+List 15[K]→List 17[K]:List 6[K]+List 16[K]→List 18[K]",
  "Next",
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

// BANCO C: the bank of three equal capacitors in delta, connected ahead of the load (RESOLVER first). Either C is given (µF)
// or it is the one that takes the power factor of the load's P and Q to the objective (inductive → cos φ' ≤ 1):
// Q_C = Q − P·tan φ', C = Q_C / (3·ω·U_L²). It shows the line currents ahead of the bank I_LR I_LS I_LT, C, and the Q, S and
// power factor with the bank (P does not change); page 2 the bank's line currents I_RC I_SC I_TC.
const BANK_LINES = [
  "If O=4:Then",
  "ClrText",
  'Locate 1,1,"BANCO C EN TRIANGULO"',
  'Locate 1,2,"1 C CONOCIDO"',
  'Locate 1,3,"2 COS FI OBJETIVO"',
  'Locate 1,4,"3 QUITAR BANCO"',
  '"NRO"?→X',
  "If X=3:Then 0→List 10[2]:IfEnd",
  "If X=1:Then",
  "ClrText",
  '"F HZ 0=50"?→F',
  "If F=0:Then 50→F:IfEnd",
  '"C MICROF"?→C',
  "1→List 10[2]",
  `2×${PI}×F→List 10[4]`,
  "C÷1000000→List 10[3]",
  "IfEnd",
  "If X=2:Then",
  "ClrText",
  '"F HZ 0=50"?→F',
  "If F=0:Then 50→F:IfEnd",
  '"COS FI OBJETIVO"?→C',
  "If C>1:Then 1→C:IfEnd",
  "If C<0.001:Then 0.001→C:IfEnd",
  "List 1[1]–List 1[2]→A:List 2[1]–List 2[2]→B:A×A+B×B→D",
  "√(1–C×C)÷C→E",
  "List 9[2]–List 9[1]×E→G",
  "If G<0:Then 0→G:IfEnd",
  "1→List 10[2]",
  `2×${PI}×F→List 10[4]`,
  "0→List 10[3]",
  "If D>0:Then G÷(3×List 10[4]×D)→List 10[3]:IfEnd",
  "IfEnd",
  "If X>0:Then",
  "If X<3:Then",
  ...BANK_UPDATE,
  "List 1[1]–List 1[2]→A:List 2[1]–List 2[2]→B",
  "List 9[2]–3×List 10[4]×List 10[3]×(A×A+B×B)→Q",
  "List 9[1]→P:√(P×P+Q×Q)→S",
  "0→N:If S>0:Then P÷S→N:IfEnd",
  // 1-3: line currents ahead of the bank, 4-6: the bank's line currents (one arctangent for the six)
  "For 1→K To 3",
  "List 17[K]→List 21[K]:List 18[K]→List 22[K]:List 15[K]→List 21[K+3]:List 16[K]→List 22[K+3]",
  "Next",
  ...POLAR(6),
  "ClrText",
  'Locate 1,1,"ILR":Locate 1,2,"ILS":Locate 1,3,"ILT"',
  "For 1→J To 3",
  ...showPolar("J", "J"),
  "Next",
  ...valueRow(4, "C UF", "List 10[3]×1000000"),
  ...valueRow(5, "Q VAR", "Q"),
  ...valueRow(6, "S VA", "S"),
  ...valueRow(7, "FP", "N"),
  ...PAUSE,
  "ClrText",
  'Locate 1,1,"IRC":Locate 1,2,"ISC":Locate 1,3,"ITC"',
  "For 1→J To 3",
  ...showPolar("J", "J+3"),
  "Next",
  ...PAUSE,
  "IfEnd",
  "IfEnd",
  "IfEnd",
];

// FASORIAL: the phasor diagram from what RESOLVER left in the lists, on two graph screens (EXE / any key goes on):
//  1. voltages — U_R U_S U_T from the origin O (their tips R S T), the line voltages as the triangle joining the tips and,
//     for the star without neutral, the point N' with the voltages on the load (N' → tips);
//  2. currents — I_R I_S I_T, plus I_N (4 wires) or the phase currents I_RS I_ST I_TR (delta).
// Each screen is scaled so that its longest phasor fills it (the value is printed at the bottom), with the same scale on both
// axes (the window is twice as wide as high, like the screen's 127 × 63 pixels). An arrow is stored in Lists 11-14 as
// (x1, y1, x2, y2) and drawn with two barbs 25° off the line.
const ARROWS = (z: 1 | 2 | 3): string[] => {
  // arrow k (1-9) = (x1, y1, x2, y2) in Lists 11-14; `put` writes the arrow K + `off` of a loop over K = 1 to 3
  const put = (off: number, x1: string, y1: string, x2: string, y2: string) => {
    const k = off ? `K+${off}` : "K";
    return ["For 1→K To 3", `${x1}→List 11[${k}]:${y1}→List 12[${k}]:${x2}→List 13[${k}]:${y2}→List 14[${k}]`, "Next"];
  };
  const out: string[] =
    z === 3
      ? [
          "9→N",
          ...put(0, "0", "0", "List 5[K]", "List 6[K]"), // the load's currents
          ...put(3, "List 5[K]", "List 6[K]", "List 17[K]", "List 18[K]"), // the bank's, from the tip of I to the tip of I_L
          ...put(6, "0", "0", "List 17[K]", "List 18[K]"), // the line currents
        ]
      : [...put(0, "0", "0", `List ${z === 1 ? 1 : 5}[K]`, `List ${z === 1 ? 2 : 6}[K]`)];
  if (z === 1) out.push("If T=2:Then 6→N", ...put(3, "List 9[4]", "List 9[5]", "List 1[K]", "List 2[K]"), "IfEnd");
  if (z === 2) {
    out.push("If T=1:Then 4→N", "0→List 11[4]:0→List 12[4]:List 9[4]→List 13[4]:List 9[5]→List 14[4]", "IfEnd");
    out.push("If T=3:Then 6→N", ...put(3, "0", "0", "List 9[8+2×K]", "List 9[9+2×K]"), "IfEnd");
  }
  return out;
};
// text row / column (pixels, clamped to what Text accepts) of the point (px, py) of the window → R, C
const pixelOf = (px: string, py: string): string[] => [
  `Intg ((W–${py})÷(2×W)×63)–2→R`,
  "If R<1:Then 1→R:IfEnd",
  "If R>57:Then 57→R:IfEnd",
  `Intg ((${px}+2×W)÷(4×W)×127)–2→C`,
  "If C<1:Then 1→C:IfEnd",
  "If C>115:Then 115→C:IfEnd",
];
const LABELS: Record<1 | 2 | 3, string[]> = {
  1: ["R", "S", "T"],
  2: ["IR", "IS", "IT"],
  3: ["IR", "IS", "IT", "IRC", "ISC", "ITC", "ILR", "ILS", "ILT"],
};
export const FASORIAL_LINES = [
  "If O=5:Then",
  "List 10[1]→T",
  "{0,0,0,0,0,0,0,0,0}→List 11",
  "{0,0,0,0,0,0,0,0,0}→List 12",
  "{0,0,0,0,0,0,0,0,0}→List 13",
  "{0,0,0,0,0,0,0,0,0}→List 14",
  "2→U:If List 10[2]=1:Then 3→U:IfEnd",
  "For 1→Z To U",
  "3→N",
  "If Z=1:Then",
  ...ARROWS(1),
  "IfEnd",
  "If Z=2:Then",
  ...ARROWS(2),
  "IfEnd",
  "If Z=3:Then",
  ...ARROWS(3),
  "IfEnd",
  // the longest phasor (tips and starting points) sets the scale
  "0→M",
  "For 1→K To N",
  "√(List 13[K]×List 13[K]+List 14[K]×List 14[K])→D",
  "If D>M:Then D→M:IfEnd",
  "√(List 11[K]×List 11[K]+List 12[K]×List 12[K])→D",
  "If D>M:Then D→M:IfEnd",
  "Next",
  "If M=0:Then 1→M:IfEnd",
  "1.25×M→W",
  "Cls",
  "ViewWindow –2×W,2×W,1,–W,W,1",
  "For 1→K To N",
  "List 11[K]→A:List 12[K]→B:List 13[K]→X:List 14[K]→Y",
  "F-Line A,B,X,Y",
  "X–A→C:Y–B→D:√(C×C+D×D)→E",
  "If E>0:Then",
  "0.1×W÷E→E",
  "C×E→C:D×E→D",
  "F-Line X,Y,X–(C×0.9063–D×0.4226),Y–(C×0.4226+D×0.9063)",
  "F-Line X,Y,X–(C×0.9063+D×0.4226),Y–(D×0.9063–C×0.4226)",
  "X+2.2×C→G:Y+2.2×D→H",
  // the bank's current is labelled halfway along its arrow, not at the tip it shares with I_L
  "If Z=3:Then If K>3:Then If K<7:Then (A+X)÷2→G:(B+Y)÷2→H:IfEnd:IfEnd:IfEnd",
  ...pixelOf("G", "H"),
  ...([1, 2, 3] as const).flatMap((z) => {
    const names = LABELS[z];
    return [
      `If Z=${z}:Then`,
      ...names.map((n, i) => `If K=${i + 1}:Then Text R,C,"${n}":IfEnd`),
      ...(z === 2
        ? [
            'If T=1:Then If K=4:Then Text R,C,"IN":IfEnd:IfEnd',
            'If T=3:Then If K=4:Then Text R,C,"RS":IfEnd:IfEnd',
            'If T=3:Then If K=5:Then Text R,C,"ST":IfEnd:IfEnd',
            'If T=3:Then If K=6:Then Text R,C,"TR":IfEnd:IfEnd',
          ]
        : []),
      "IfEnd",
    ];
  }),
  "IfEnd",
  "Next",
  "PlotOn 0,0",
  'Text 33,66,"O"',
  "If Z=1:Then",
  "F-Line List 1[1],List 2[1],List 1[2],List 2[2]",
  "F-Line List 1[2],List 2[2],List 1[3],List 2[3]",
  "F-Line List 1[3],List 2[3],List 1[1],List 2[1]",
  "If T=2:Then",
  "PlotOn List 9[4],List 9[5]",
  ...pixelOf("(List 9[4]+0.08×W)", "(List 9[5]–0.08×W)"),
  'Text R,C,"N"', // the load's neutral (O' in the guides: an apostrophe in a Casio string is the comment mark)
  "IfEnd",
  'Text 57,1,"U MAX"',
  "IfEnd",
  'If Z>1:Then Text 57,1,"I MAX":IfEnd',
  "Text 57,30,Intg (M×10+0.5)÷10",
  ...PAUSE,
  "Next",
  "IfEnd",
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
  ...[21, 22, 23, 24].map((n) => `{0,0,0,0,0,0,0,0}→List ${n}`),
  "While 1=1",
  ...menuLines({
    count: 7,
    exit: "zero",
    choice: "O",
    flag: "Y",
    sel: "R",
    row0: 1,
    draw: [
      'Locate 3,1,"TENSIONES"',
      'Locate 3,2,"CARGA"',
      'Locate 3,3,"RESOLVER"',
      'Locate 3,4,"BANCO C"',
      'Locate 3,5,"FASORIAL"',
      'Locate 3,6,"VATIMETROS"',
      'Locate 3,7,"BORRAR TODO"',
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
  'Locate 1,4,"0 URN 220 V 90 GRAD"',
  '"NRO"?→R',
  // the usual case in one key: 0 = U_RN = 220 V at 90° (the guides' U_R); a value of 0 = 220 V (phase) or 380 V (line)
  "0→Y",
  "If R=0:Then 1→R:220→A:90→B:1→Y:IfEnd",
  "If Y=0:Then",
  '"VALOR V 0=380 220"?→A',
  "If A=0:Then 220→A:If R>3:Then 380→A:IfEnd:IfEnd",
  '"ANGULO GRADOS"?→B',
  "IfEnd",
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
  // 7: clear everything (asks first)
  "If O=7:Then",
  "ClrText",
  'Locate 1,1,"BORRAR TODO?"',
  '"1=NO 2=SI"?→X',
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
  // the bank's currents and the line currents ahead of it (the bank is "out" until BANCO C connects one)
  ...BANK_UPDATE,
  // the phasors to show, with one arctangent: 1-3 line currents, 4 I_N or U_N'N, 5-7 the voltages on the load's phases (star
  // without neutral) or the phase currents (delta)
  ...[1, 2, 3].map((k) => `List 5[${k}]→List 21[${k}]:List 6[${k}]→List 22[${k}]`),
  "List 9[4]→List 21[4]:List 9[5]→List 22[4]",
  "For 1→K To 3",
  "If T=2:Then List 7[K]→List 21[K+4]:List 8[K]→List 22[K+4]:IfEnd",
  "If T=3:Then List 9[8+2×K]→List 21[K+4]:List 9[9+2×K]→List 22[K+4]:IfEnd",
  "Next",
  ...POLAR(7),
  // page 1: line currents, neutral current or displacement, P, Q, S
  "ClrText",
  'Locate 1,1,"IR":Locate 1,2,"IS":Locate 1,3,"IT"',
  "For 1→J To 3",
  ...showPolar("J", "J"),
  "Next",
  'If T=1:Then Locate 1,4,"IN":IfEnd',
  'If T=2:Then Locate 1,4,"UNN":IfEnd',
  "If T<3:Then",
  ...showPolar(4, 4),
  "IfEnd",
  ...valueRow(5, "P W", "List 9[1]"),
  ...valueRow(6, "Q VAR", "List 9[2]"),
  ...valueRow(7, "S VA", "List 9[3]"),
  ...PAUSE,
  // page 2: phase currents (delta) or the voltages on the load's phases (star)
  "If T>1:Then",
  "ClrText",
  'If T=2:Then Locate 1,1,"UR":Locate 1,2,"US":Locate 1,3,"UT":IfEnd',
  'If T=3:Then Locate 1,1,"IRS":Locate 1,2,"IST":Locate 1,3,"ITR":IfEnd',
  "For 1→J To 3",
  ...showPolar("J", "J+4"),
  "Next",
  ...PAUSE,
  "IfEnd",
  "IfEnd",
  // 4: capacitor bank in delta (after RESOLVER)
  ...BANK_LINES,
  // 5: phasor diagram (after RESOLVER), two or three screens, each to its own scale
  ...FASORIAL_LINES,
  // 6: wattmeters
  "If O=6:Then",
  "ClrText",
  'Locate 1,1,"VATIMETROS"',
  'Locate 1,2,"1 UN VAT. EQUILIB."',
  'Locate 1,3,"2 ARON EQUILIBRADA"',
  'Locate 1,4,"3 2 VAT. CARGA REAL"',
  '"NRO"?→X',
  // the two wattmeters of the exercises on the load as it is (and ahead of the bank if one is connected): the ones whose
  // current coils are in two lines and whose voltage coils go to the third (common) line
  "If X=3:Then",
  "ClrText",
  '"COMUN 1R 2S 3T"?→C',
  "If C=1:Then 2→A:3→B:IfEnd",
  "If C=2:Then 1→A:3→B:IfEnd",
  "If C=3:Then 1→A:2→B:IfEnd",
  "(List 1[A]–List 1[C])×List 17[A]+(List 2[A]–List 2[C])×List 18[A]→P",
  "(List 1[B]–List 1[C])×List 17[B]+(List 2[B]–List 2[C])×List 18[B]→Q",
  "ClrText",
  'If C=1:Then Locate 1,1,"WSR":Locate 1,2,"WTR":IfEnd',
  'If C=2:Then Locate 1,1,"WRS":Locate 1,2,"WTS":IfEnd',
  'If C=3:Then Locate 1,1,"WRT":Locate 1,2,"WST":IfEnd',
  "Locate 5,1,Intg (P×100+0.5)÷100",
  "Locate 5,2,Intg (Q×100+0.5)÷100",
  ...valueRow(3, "SUMA W", "(P+Q)"),
  ...valueRow(4, "P W", "List 9[1]"),
  ...PAUSE,
  "0→X",
  "IfEnd",
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

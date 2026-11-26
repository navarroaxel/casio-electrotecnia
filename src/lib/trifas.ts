// Casio fx-9860GIII program TRIFAS: three-phase systems (phases R S T). A symmetrical source (direct RST or inverse RTS sequence, given by
// any one of its phase or line voltages) feeding a star load with neutral (4 wires), a star load without neutral (3 wires,
// with the displacement of the neutral) or a delta load, balanced or not. It gives the line currents, the neutral current
// (4 wires) or the neutral displacement (3 wires) or the phase currents (delta), P, Q and S, and, for the balanced load
// measured with wattmeters, P, Q, S from one wattmeter (Q/√3) or from the Aron connection. `solveThreePhase` is the same
// arithmetic in TypeScript so the tests can compare it with the listing and with the circuit's own laws (KCL, Ohm).
import { PAUSE, PI, TRIG, atan2Lines, menuLines, pickMenu } from "./basicKit";

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
// print the polar form of entry `k` (Lists 23 / 24) at the row `row`: modulus at column 5 (after a label of up to 3 letters and a
// space), angle at column 13, 2 decimals
const showPolar = (row: string | number, k: string | number): string[] => [
  `Locate 5,${row},Intg (List 23[${k}]×100+0.5)÷100`,
  `Locate 13,${row},Intg (List 24[${k}]×100+0.5)÷100`,
  `Locate 12,${row},"∠"`,
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
  `Locate 12,${row},"∠"`,
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
  // without a solution (RESOLVER not run yet) P and Q are 0 and everything would come out 0
  "If O=4:Then If List 9[3]=0:Then",
  "ClrText",
  'Locate 1,3,"PRIMERO RESOLVER"',
  'Locate 1,4,"(OPCION 3)"',
  ...PAUSE,
  "0→O",
  "IfEnd:IfEnd",
  "If O=4:Then",
  ...pickMenu({ title: "BANCO C EN TRIANGULO", items: ["C CONOCIDO", "COS FI OBJETIVO", "QUITAR BANCO"], choice: "X" }),
  "If X=3:Then 0→List 10[2]:IfEnd",
  "If X=1:Then",
  "ClrText",
  '"C µF"?→C',
  "1→List 10[2]",
  `${2*3.14159265358979*50}→List 10[4]`,
  "C÷1000000→List 10[3]",
  "IfEnd",
  "If X=2:Then",
  "ClrText",
  '"COS FI OBJETIVO"?→C',
  "If C>1:Then 1→C:IfEnd",
  "If C<0.001:Then 0.001→C:IfEnd",
  "List 1[1]–List 1[2]→A:List 2[1]–List 2[2]→B:A×A+B×B→D",
  "√(1–C×C)÷C→E",
  "List 9[2]–List 9[1]×E→G",
  "If G<0:Then 0→G:IfEnd",
  "1→List 10[2]",
  `${2*3.14159265358979*50}→List 10[4]`,
  "0→List 10[3]",
  "If D>0:Then G÷(3×List 10[4]×D)→List 10[3]:IfEnd",
  "IfEnd",
  "If X>0:Then",
  // also after QUITAR (X = 3): with the flag cleared this puts the load's own currents back in Lists 17 / 18
  ...BANK_UPDATE,
  "If X<3:Then",
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
  ...valueRow(4, "C µF", "List 10[3]×1000000"),
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
  `Intg ((S+W–${py})÷(2×W)×63)–2→R`,
  "If R<1:Then 1→R:IfEnd",
  "If R>57:Then 57→R:IfEnd",
  `Intg ((${px}–V+2×W)÷(4×W)×127)–2→C`,
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
  // M = the longest phasor (printed at the bottom); I J = least / greatest x, L P = least / greatest y of everything that is drawn
  // (the origin, every start and every tip). The window is twice as wide as high (the screen's 127 × 63 pixels) and is fitted to
  // that box: centre (V, S), half-height W = the larger of half the height and a quarter of the width, plus 20 % for the labels
  "0→M:0→I:0→J:0→L:0→P",
  "For 1→K To N",
  "√(List 13[K]×List 13[K]+List 14[K]×List 14[K])→D",
  "If D>M:Then D→M:IfEnd",
  "√(List 11[K]×List 11[K]+List 12[K]×List 12[K])→D",
  "If D>M:Then D→M:IfEnd",
  "List 11[K]→X:List 12[K]→Y",
  "If X<I:Then X→I:IfEnd:If X>J:Then X→J:IfEnd:If Y<L:Then Y→L:IfEnd:If Y>P:Then Y→P:IfEnd",
  "List 13[K]→X:List 14[K]→Y",
  "If X<I:Then X→I:IfEnd:If X>J:Then X→J:IfEnd:If Y<L:Then Y→L:IfEnd:If Y>P:Then Y→P:IfEnd",
  "Next",
  "If M=0:Then 1→M:IfEnd",
  "(I+J)÷2→V:(L+P)÷2→S",
  "(P–L)÷2→W:(J–I)÷4→D:If D>W:Then D→W:IfEnd",
  "If W=0:Then M→W:IfEnd",
  "1.2×W→W",
  "Cls",
  "ViewWindow V–2×W,V+2×W,1000000,S–W,S+W,1000000",
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
  ...pixelOf("(0.04×W)", "(–0.04×W)"),
  'Text R,C,"O"',
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
  'Text 57,100,"EXE"',
  "While Getkey>0:WhileEnd",
  "While Getkey=0:WhileEnd",
  "Next",
  "IfEnd",
];

// Data: List 1 / 2 = Re / Im of the phase voltages U_RN, U_SN, U_TN of the source (rms); 3 / 4 = Re / Im of the impedances of
// the three load elements (phases R S T, or RS ST TR in delta); 5 / 6 = line currents; 7 / 8 = voltage on each element;
// List 9 = {P, Q, S, Re / Im of I_N (4 wires) or of the displacement U_N'N (3 wires), …, element currents at 10-15};
// List 10 = {connection 1 = star 4 wires, 2 = star 3 wires, 3 = delta}. They persist: 0 = new, 1 = go on.
// CARGA, option 4: up to 3 balanced loads in parallel (a motor and lamps, …), each by its P in W and cos φ (a negative cos φ is a
// capacitive load). P and Q add up (Q = P·tan φ) and the total is the symmetric load of the three phases: with S = P + jQ per phase
// (a third of the total) and U the voltage on the element, Z = U²/S* = U²·(P + jQ)/(P² + Q²), with no angle needed.
// A screen shows the total P, Q, S and the power factor.
const MULTI_LOADS = [
  "If V=4:Then",
  "1→S",
  "ClrText",
  '"CANT CARGAS MAX 3"?→N',
  "If N<1:Then 1→N:IfEnd",
  "If N>3:Then 3→N:IfEnd",
  "0→P:0→Q",
  "For 1→K To N",
  "ClrText",
  'Locate 1,1,"CARGA"',
  "Locate 8,1,K",
  'Locate 1,2,"TRIFASICA: P TOTAL"',
  'Locate 1,3,"DE LAS 3 FASES"',
  '"P 3F W"?→A',
  '"COS FI NEG=CAPACIT"?→B',
  "Abs (B)→C",
  "If C>1:Then 1→C:IfEnd",
  "If C<0.001:Then 0.001→C:IfEnd",
  "√(1–C×C)÷C→D",
  "If B<0:Then –D→D:IfEnd",
  "P+A→P:Q+A×D→Q",
  "Next",
  "√(P×P+Q×Q)→F",
  "0→H:If F>0:Then P÷F→H:IfEnd",
  "ClrText",
  ...valueRow(1, "P W", "P"),
  ...valueRow(2, "Q VAR", "Q"),
  ...valueRow(3, "S VA", "F"),
  ...valueRow(4, "FP", "H"),
  ...PAUSE,
  "P÷3→P:Q÷3→Q",
  "List 1[1]×List 1[1]+List 2[1]×List 2[1]→E",
  "If T=3:Then (List 1[1]–List 1[2])×(List 1[1]–List 1[2])+(List 2[1]–List 2[2])×(List 2[1]–List 2[2])→E:IfEnd",
  "P×P+Q×Q→D",
  "1000000000→List 3[1]:0→List 4[1]",
  "If D>0:Then E×P÷D→List 3[1]:E×Q÷D→List 4[1]:IfEnd",
  "IfEnd",
];

// CARGA, option 5: a balanced three-phase motor (P in kW and cos φ, a third on each phase) plus a single-phase load on each
// element (phase R S T, or RS ST TR in delta), each by its P in W and cos φ (0 kW = none; a negative cos φ is capacitive).
// Per element P = P_motor/3 + P_load and Q = P_motor/3·tan φ_m + P_load·tan φ; then Z = U²·(P + jQ)/(P² + Q²) with U the voltage
// on the element. The load is not symmetric.
const MOTOR_AND_PHASES = [
  "If V=5:Then",
  "0→S",
  "ClrText",
  'Locate 1,1,"MOTOR TRIFASICO"',
  'Locate 1,2,"SE REPARTE POR IGUAL"',
  'Locate 1,3,"EN LAS 3 FASES"',
  '"P MOTOR 3F W 0=NO"?→A',
  "A÷3→P:0→Q",
  "If A>0:Then",
  '"COS FI NEG=CAPACIT"?→B',
  "Abs (B)→C",
  "If C>1:Then 1→C:IfEnd",
  "If C<0.001:Then 0.001→C:IfEnd",
  "√(1–C×C)÷C→D",
  "If B<0:Then –D→D:IfEnd",
  "P×D→Q",
  "IfEnd",
  "For 1→K To 3",
  "ClrText",
  "If T<3:Then",
  'If K=1:Then Locate 1,1,"CARGA FASE R":IfEnd',
  'If K=2:Then Locate 1,1,"CARGA FASE S":IfEnd',
  'If K=3:Then Locate 1,1,"CARGA FASE T":IfEnd',
  "IfEnd",
  "If T=3:Then",
  'If K=1:Then Locate 1,1,"CARGA ENTRE R Y S":IfEnd',
  'If K=2:Then Locate 1,1,"CARGA ENTRE S Y T":IfEnd',
  'If K=3:Then Locate 1,1,"CARGA ENTRE T Y R":IfEnd',
  "IfEnd",
  'Locate 1,2,"SOLO ESA FASE, SIN"',
  'Locate 1,3,"CONTAR EL MOTOR"',
  ...["R", "S", "T"].flatMap((n, i) => [
    `If T<3:Then If K=${i + 1}:Then "P FASE ${n} W 0=NO"?→A:IfEnd:IfEnd`,
    `If T=3:Then If K=${i + 1}:Then "P ${["R Y S", "S Y T", "T Y R"][i]} W 0=NO"?→A:IfEnd:IfEnd`,
  ]),
  "P→G:Q→H",
  "If A>0:Then",
  ...["R", "S", "T"].flatMap((n, i) => [
    `If T<3:Then If K=${i + 1}:Then "COS FI ${n} NEG=CAPACIT"?→B:IfEnd:IfEnd`,
    `If T=3:Then If K=${i + 1}:Then "COSFI ${["RS", "ST", "TR"][i]} NEG=CAPACIT"?→B:IfEnd:IfEnd`,
  ]),
  "Abs (B)→C",
  "If C>1:Then 1→C:IfEnd",
  "If C<0.001:Then 0.001→C:IfEnd",
  "√(1–C×C)÷C→D",
  "If B<0:Then –D→D:IfEnd",
  "G+A→G:H+A×D→H",
  "IfEnd",
  "List 1[K]×List 1[K]+List 2[K]×List 2[K]→E",
  "If T=3:Then",
  "K+1→J:If J>3:Then 1→J:IfEnd",
  "(List 1[K]–List 1[J])×(List 1[K]–List 1[J])+(List 2[K]–List 2[J])×(List 2[K]–List 2[J])→E",
  "IfEnd",
  "G×G+H×H→D",
  "1000000000→List 3[K]:0→List 4[K]",
  "If D>0:Then E×G÷D→List 3[K]:E×H÷D→List 4[K]:IfEnd",
  "Next",
  "IfEnd",
];

// CARGA, option 4 of the first menu: shows the load stored (what the other options left in Lists 3 / 4), without asking anything:
// page 1 the impedance of each element as modulus and angle (phase R S T, RS ST TR in delta) and the connection; page 2 the P and
// Q of each element at the loaded voltages (P + jQ = U²·Z/|Z|²) and the total P. Nothing is changed.
const SEE_LOAD = [
  "List 10[1]→T",
  "For 1→K To 3",
  "List 3[K]→List 21[K]:List 4[K]→List 22[K]",
  "Next",
  ...POLAR(3),
  "ClrText",
  'If T<3:Then Locate 1,1,"ZR":Locate 1,2,"ZS":Locate 1,3,"ZT":IfEnd',
  'If T=3:Then Locate 1,1,"ZRS":Locate 1,2,"ZST":Locate 1,3,"ZTR":IfEnd',
  "For 1→J To 3",
  ...showPolar("J", "J"),
  "Next",
  'If T=1:Then Locate 1,5,"ESTRELLA 4 HILOS":IfEnd',
  'If T=2:Then Locate 1,5,"ESTRELLA 3 HILOS":IfEnd',
  'If T=3:Then Locate 1,5,"TRIANGULO":IfEnd',
  'Locate 1,6,"Z EN OHM Y GRADOS"',
  ...PAUSE,
  "For 1→K To 3",
  "List 1[K]×List 1[K]+List 2[K]×List 2[K]→E",
  "If T=3:Then",
  "K+1→J:If J>3:Then 1→J:IfEnd",
  "(List 1[K]–List 1[J])×(List 1[K]–List 1[J])+(List 2[K]–List 2[J])×(List 2[K]–List 2[J])→E",
  "IfEnd",
  "List 3[K]×List 3[K]+List 4[K]×List 4[K]→D",
  "0→List 21[K]:0→List 22[K]",
  "If D>0:Then E×List 3[K]÷D→List 21[K]:E×List 4[K]÷D→List 22[K]:IfEnd",
  "Next",
  "ClrText",
  'Locate 1,1,"PR":Locate 1,2,"PS":Locate 1,3,"PT":Locate 1,4,"QR":Locate 1,5,"QS":Locate 1,6,"QT"',
  "For 1→J To 3",
  "Locate 5,J,Intg (List 21[J]×100+0.5)÷100",
  "Locate 5,J+3,Intg (List 22[J]×100+0.5)÷100",
  "Next",
  ...valueRow(7, "P TOT", "(List 21[1]+List 21[2]+List 21[3])"),
  ...PAUSE,
];

export const TRIFAS_LINES = [
  ...pickMenu({ title: "DATOS", items: ["NUEVOS", "SEGUIR GUARDADOS"], choice: "A" }),
  // EXIT is "seguir": it never wipes the stored data
  "If A=1:Then",
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
  ...pickMenu({ title: "SECUENCIA", items: ["RST DIRECTA", "RTS INVERSA"], choice: "T" }),
  // the reference: item 1 is the usual case (U_RN = 220 V at 90°), then the six voltages; EXIT is the usual case too
  ...pickMenu({ items: ["URN 220V 90 USUAL", "URN", "USN", "UTN", "URS", "UST", "UTR"], choice: "R" }),
  "R–1→R:If R<0:Then 0→R:IfEnd",
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
  ...pickMenu({ title: "CARGA", items: ["ESTRELLA 4 HILOS", "ESTRELLA 3 HILOS", "TRIANGULO", "VER"], choice: "T" }),
  "If T<1:Then 1→T:IfEnd",
  "0→Z:If T=4:Then 1→Z:IfEnd",
  "If Z=1:Then",
  ...SEE_LOAD,
  "IfEnd",
  "If Z=0:Then",
  "T→List 10[1]",
  ...pickMenu({ title: "CARGA SIMETRICA?", items: ["SI", "NO"], choice: "S", sel: "L" }),
  "If S=2:Then 0→S:IfEnd",
  "3→M:If S=1:Then 1→M:IfEnd",
  // how the load is given: its impedance, its apparent power S or its active power P, with the angle φ (inductive > 0). S and P
  // are the total of the three phases when the load is symmetric, of the phase otherwise; the impedance is then
  // |Z| = U²/S_phase with U the voltage on the element (phase voltage, or the line voltage in delta): TENSIONES first
  ...pickMenu({ title: "CARGA POR", items: ["Z (OHM)", "S (VA) Y ANGULO", "P (W) Y ANGULO", "VARIAS P Y COS FI", "MOTOR Y FASES"], choice: "V", sel: "L" }),
  "If V<1:Then 1→V:IfEnd",
  ...MULTI_LOADS,
  ...MOTOR_AND_PHASES,
  "If V<4:Then",
  "For 1→K To M",
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
  'If S=1:Then Locate 1,1,"Z DE CADA FASE":IfEnd',
  'If V>1:Then Locate 1,2,"POR FASE":IfEnd',
  'If V>1:Then If S=1:Then Locate 1,2,"TOTAL TRIFASICA":IfEnd:IfEnd',
  'If V=1:Then "MODULO OHM"?→A:IfEnd',
  'If V=2:Then "S VA"?→A:IfEnd',
  'If V=3:Then "P W"?→A:IfEnd',
  '"ANGULO GRADOS"?→B',
  ...TRIG,
  "If V>1:Then",
  "If V=3:Then If C>0.000001:Then A÷C→A:IfEnd:IfEnd",
  "If S=1:Then A÷3→A:IfEnd",
  "List 1[K]×List 1[K]+List 2[K]×List 2[K]→E",
  "If T=3:Then",
  "K+1→J:If J>3:Then 1→J:IfEnd",
  "(List 1[K]–List 1[J])×(List 1[K]–List 1[J])+(List 2[K]–List 2[J])×(List 2[K]–List 2[J])→E",
  "IfEnd",
  "If A>0:Then E÷A→A:IfEnd",
  "IfEnd",
  "A×C→List 3[K]:A×D→List 4[K]",
  "Next",
  "IfEnd",
  "If S=1:Then",
  "List 3[1]→List 3[2]:List 3[1]→List 3[3]:List 4[1]→List 4[2]:List 4[1]→List 4[3]",
  "IfEnd",
  "IfEnd",
  "IfEnd",
  // 7: clear everything (asks first)
  "If O=7:Then",
  ...pickMenu({ title: "BORRAR TODO?", items: ["NO", "SI"], choice: "X" }),
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
  // page 3: the two wattmeters for each choice of the common line, on the line currents ahead of the bank (Lists 17 / 18):
  // W_ac = Re((U_a − U_c)·I_a*) in the order WRT WST WRS WTS WSR WTR (a and c from List 26), and P of the page 1
  "{0,0,0,0,0,0}→List 25",
  "{13,23,12,32,21,31}→List 26", // a·10 + c for each reading: 13 = (R, T), 23 = (S, T), 12, 32, 21, 31 (the calculator has Lists 1 to 26)
  "For 1→K To 6",
  "Intg (List 26[K]÷10)→A:List 26[K]–10×A→C",
  "(List 1[A]–List 1[C])×List 17[A]+(List 2[A]–List 2[C])×List 18[A]→List 25[K]",
  "Next",
  "ClrText",
  'Locate 1,1,"WRT":Locate 1,2,"WST":Locate 1,3,"WRS":Locate 1,4,"WTS":Locate 1,5,"WSR":Locate 1,6,"WTR"',
  "For 1→J To 6",
  "Locate 5,J,Intg (List 25[J]×100+0.5)÷100",
  "Next",
  ...valueRow(7, "P W", "List 9[1]"),
  ...PAUSE,
  // pages 4 and 5: P, Q, S of each element of the load (phase R S T, RS ST TR in delta) and the three wattmeters between each
  // line (ahead of the bank) and the neutral of the source, W_RN = Re(U_RN·I_LR*): in a star with neutral they are the powers P of the phases
  "For 1→K To 3",
  "List 7[K]→A:List 8[K]→B:List 9[8+2×K]→C:List 9[9+2×K]→D",
  "A×C+B×D→List 21[K]:B×C–A×D→List 22[K]",
  "√(List 21[K]×List 21[K]+List 22[K]×List 22[K])→List 23[K]",
  "List 1[K]×List 17[K]+List 2[K]×List 18[K]→List 24[K]",
  "Next",
  "ClrText",
  'Locate 1,1,"PR":Locate 1,2,"PS":Locate 1,3,"PT":Locate 1,4,"QR":Locate 1,5,"QS":Locate 1,6,"QT"',
  "For 1→J To 3",
  "Locate 5,J,Intg (List 21[J]×100+0.5)÷100",
  "Locate 5,J+3,Intg (List 22[J]×100+0.5)÷100",
  "Next",
  ...valueRow(7, "P TOT", "List 9[1]"),
  ...PAUSE,
  "ClrText",
  'Locate 1,1,"SR":Locate 1,2,"SS":Locate 1,3,"ST":Locate 1,4,"WRN":Locate 1,5,"WSN":Locate 1,6,"WTN"',
  "For 1→J To 3",
  "Locate 5,J,Intg (List 23[J]×100+0.5)÷100",
  "Locate 5,J+3,Intg (List 24[J]×100+0.5)÷100",
  "Next",
  ...valueRow(7, "S TOT", "List 9[3]"),
  ...PAUSE,
  "IfEnd",
  // 4: capacitor bank in delta (after RESOLVER)
  ...BANK_LINES,
  // 5: phasor diagram (after RESOLVER), two or three screens, each to its own scale
  ...FASORIAL_LINES,
  // 6: wattmeters
  "If O=6:Then",
  ...pickMenu({ title: "VATIMETROS", items: ["UN VAT. EQUILIB.", "ARON EQUILIBRADA", "VAT. CARGA REAL"], choice: "X" }),
  // the two wattmeters of the exercises on the load as it is (and ahead of the bank if one is connected): the ones whose
  // current coils are in two lines and whose voltage coils go to the third (common) line
  "If X=3:Then",
  ...pickMenu({ title: "LINEA COMUN", items: ["R", "S", "T"], choice: "C" }),
  "If C<1:Then 3→C:IfEnd",
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
  // U and I of the exercise are the ones already loaded when left at 0: the line voltage |U_R − U_S| from TENSIONES and the
  // current of the line R from RESOLVER
  '"U V 0=CARGADA"?→A',
  "0→Y",
  "If A=0:Then 1→Y:IfEnd",
  "If Y=1:Then",
  "List 1[1]–List 1[2]→D:List 2[1]–List 2[2]→E:√(D×D+E×E)→A",
  "IfEnd",
  "If Y=0:Then",
  ...pickMenu({ title: "LA TENSION ES DE", items: ["LINEA", "FASE"], choice: "T", flag: "N" }),
  "If T=2:Then A×√(3)→A:IfEnd",
  "IfEnd",
  '"I A 0=DE RESOLVER"?→B',
  "If B=0:Then √(List 5[1]×List 5[1]+List 6[1]×List 6[1])→B:IfEnd",
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

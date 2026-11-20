// Pieces shared by the programs: the arrow-key menu, the key wait, and sine / cosine / arctangent written in Basic so that
// they do not depend on the calculator's angle mode.

// An arrow-key menu (see casio-structural-programs): ▲ 28 ▼ 37 move a > marker, EXE 31 chooses, a number key chooses that item
// at once, 0 (71) / EXIT (47) leave. `exit`: "item" = last item is "0 SALIR", number = chooses that item (a yes / no).
const DIGIT_KEY = [71, 72, 62, 52, 73, 63, 53, 74, 64, 54]; // 0 1 2 3 4 5 6 7 8 9
export function menuLines(o: {
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

export const PAUSE = ["While Getkey>0:WhileEnd", "While Getkey=0:WhileEnd"];

export const PI = "3.14159265358979";
export const TWO_PI = "6.28318530717959";

// cos and sen of the angle in B (degrees) → C = cos, D = sen, with the angle in radians in E and its square in F. Taylor
// series (Horner) after bringing the angle into −π…π: it does not depend on the calculator's angle unit (Deg / Rad), which a
// program cannot rely on. Error < 1e-10 on the whole range.
export const horner = (x: string, first: number, count: number): string => {
  // 1 − x/(a(a+1))·(1 − x/(b(b+1))·(…)) with a = first, first+2, …
  const den = (k: number) => (first + 2 * k) * (first + 2 * k + 1);
  let s = `1–${x}÷${den(count - 1)}`;
  for (let k = count - 2; k >= 0; k--) s = `1–${x}÷${den(k)}×(${s})`;
  return s;
};
export const TRIG = [
  `B×${PI}÷180→E`,
  `E–${TWO_PI}×Intg (E÷${TWO_PI}+0.5)→E`,
  "E×E→F",
  `${horner("F", 1, 11)}→C`,
  `E×(${horner("F", 2, 10)})→D`,
];


// Polar form of the phasor (re, im): magnitude → `mag`, angle in degrees (−180…180] → `ang`. Arctangent by two angle halvings
// and a Taylor series, with the quadrant fixed by hand; scratch letters C D E F G H. Error < 1e-9 degrees.
export const atan2Lines = (re: string, im: string, mag: string, ang: string): string[] => {
  let series = "1÷15";
  for (const d of [13, 11, 9, 7, 5, 3]) series = `1÷${d}–H×(${series})`;
  return [
    `${re}→C:${im}→D`,
    `√(C×C+D×D)→${mag}`,
    `0→${ang}`,
    `If ${mag}>0:Then`,
    "Abs (D)→E:Abs (C)→F",
    "If E>F:Then E→G:F→E:G→F:IfEnd",
    "E÷F→G",
    "G÷(1+√(1+G×G))→G",
    "G÷(1+√(1+G×G))→G",
    "G×G→H",
    `G×(1–H×(${series}))×4→G`,
    "If Abs (D)>Abs (C):Then 1.5707963267949–G→G:IfEnd",
    `If C<0:Then ${PI}–G→G:IfEnd`,
    "If D<0:Then –G→G:IfEnd",
    `G×180÷${PI}→${ang}`,
    "IfEnd",
  ];
};

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

// a result screen waits for a key; "EXE" in the corner of the last line (columns 19-21) says so
export const PAUSE = ['Locate 19,7,"EXE"', "While Getkey>0:WhileEnd", "While Getkey=0:WhileEnd"];

export const PI = "3.14159265358979";
export const TWO_PI = "6.28318530717959";

// cos and sen of the angle in B (degrees) → C = cos, D = sen, with the angle in the calculator's own unit in E. The unit (Deg /
// Rad / Gra) is whatever the calculator is set to and a program cannot rely on it, so the angle is scaled by tan⁻¹ 1 ÷ 45 (45 in
// Deg, π/4 in Rad, 50 in Gra): the factor is 1 in Deg and the right one in the others.
export const TRIG = ["B×tan⁻¹ (1)÷45→E", "cos (E)→C", "sin (E)→D"];

// Polar form of the phasor (re, im): magnitude → `mag`, angle in degrees (−180…180] → `ang`, the quadrant fixed by hand;
// scratch letters C D E F G. tan⁻¹ answers in the calculator's unit, hence the ×45÷tan⁻¹ 1 (the same trick as above).
export const atan2Lines = (re: string, im: string, mag: string, ang: string): string[] => [
  `${re}→C:${im}→D`,
  `√(C×C+D×D)→${mag}`,
  `0→${ang}`,
  `If ${mag}>0:Then`,
  "Abs (D)→E:Abs (C)→F",
  "If E>F:Then E→G:F→E:G→F:IfEnd",
  "E÷F→G",
  "tan⁻¹ (G)×45÷tan⁻¹ (1)→G",
  "If Abs (D)>Abs (C):Then 90–G→G:IfEnd",
  "If C<0:Then 180–G→G:IfEnd",
  "If D<0:Then –G→G:IfEnd",
  `G→${ang}`,
  "IfEnd",
];

// A submenu like the main one: ▲ ▼ move the > marker, EXE chooses, the number key of an item chooses it at once, EXIT or 0 leaves
// with 0. `items` are at most 17 characters (column 3, the digit mark, 21 columns); `title` goes on the first line. Returns the
// number of the item in `choice`. Scratch variables `sel`, `key`, `flag`: pick ones that are free where the menu is used.
export const pickMenu = (o: { title?: string; items: string[]; choice: string; sel?: string; key?: string; flag?: string }): string[] => {
  const row0 = o.title ? 2 : 1;
  for (const t of o.items) if (t.length > 17) throw new Error(`menu item too long (${t.length} > 17): ${t}`);
  return menuLines({
    count: o.items.length,
    exit: "zero",
    choice: o.choice,
    flag: o.flag ?? "Y",
    sel: o.sel ?? "S",
    key: o.key ?? "W",
    row0,
    draw: [...(o.title ? [`Locate 1,1,"${o.title}"`] : []), ...o.items.map((t, i) => `Locate 3,${row0 + i},"${t}"`)],
  });
};

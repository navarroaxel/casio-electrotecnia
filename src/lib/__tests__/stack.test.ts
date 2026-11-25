import { POLIARM_LINES } from "../poliarm";
import { POLITRI_LINES } from "../politri";
import { TRIFAS_LINES } from "../trifas";
import { stackNeed, statements } from "./stackDepth";

// The calculator stops with "Stack ERROR" when an expression needs more than 10 levels of the numeric stack or 26 of the
// command stack. Keep every expression of every listing well under that (margin: the estimate is not the calculator's own).
const MAX_VALUES = 8;
const MAX_COMMANDS = 20;

describe("the estimate itself", () => {
  test("a nested Horner series (the old cos) is far over the limit, and the same series one statement at a time is tiny", () => {
    let nested = "1–F÷462";
    for (const d of [380, 306, 240, 182, 132, 90, 56, 30, 12, 2]) nested = `1–F÷${d}×(${nested})`;
    expect(stackNeed(nested).values).toBeGreaterThan(10);
    expect(stackNeed("1–F÷380×C").values).toBeLessThanOrEqual(3);
  });
  test("simple things", () => {
    expect(stackNeed("1+2×3")).toEqual({ values: 3, commands: 2 });
    expect(stackNeed("(1+2)×3").values).toBe(2);
    expect(stackNeed("–A+B").values).toBeLessThanOrEqual(2);
  });
});

describe.each([["POLIARM", POLIARM_LINES], ["TRIFAS", TRIFAS_LINES], ["POLITRI", POLITRI_LINES]] as const)("%s", (_name, lines) => {
  test(`no expression needs more than ${MAX_VALUES} values or ${MAX_COMMANDS} commands on the stacks`, () => {
    const bad = statements([...lines])
      .map((st) => ({ st: st.trim(), ...stackNeed(st) }))
      .filter((x) => x.values > MAX_VALUES || x.commands > MAX_COMMANDS);
    expect(bad.map((x) => `${x.values}v ${x.commands}c: ${x.st.slice(0, 90)}`)).toEqual([]);
  });
});

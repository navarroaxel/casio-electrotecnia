import { POLIARM_LINES } from "../poliarm";
import { POLITRI_LINES } from "../politri";
import { TRIFAS_LINES } from "../trifas";

// Limits of the calculator that the test interpreter does not enforce by itself: a program that breaks one stops on the device.
describe.each([["POLIARM", POLIARM_LINES], ["TRIFAS", TRIFAS_LINES], ["POLITRI", POLITRI_LINES]] as const)("%s", (_name, lines) => {
  test("only the Lists 1 to 26 exist (List 27 is an error on the calculator)", () => {
    const used = new Set<number>();
    for (const l of lines) for (const m of l.matchAll(/List (\d+)/g)) used.add(+m[1]);
    expect([...used].filter((n) => n < 1 || n > 26)).toEqual([]);
  });
  test("a list literal is a list of at most 999 elements and its commas are balanced", () => {
    for (const l of lines) for (const m of l.matchAll(/\{([^}]*)\}→List/g)) expect(m[1].split(",").length).toBeLessThanOrEqual(999);
  });
});

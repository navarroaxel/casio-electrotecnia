import { tokenizeLine } from "../casioG1m";

describe("the .g1m writer: special characters inside a string", () => {
  test("µ (micro sign U+00B5 or Greek mu U+03BC) is the two bytes E6 4B of Cahute's table", () => {
    const a = tokenizeLine('"C µF"?→C');
    const b = tokenizeLine('"C μF"?→C');
    expect(a).toEqual(b);
    const i = a.indexOf(0xe6);
    expect(a.slice(i, i + 3)).toEqual([0xe6, 0x4b, 0x46]); // µ then the ASCII "F"
  });
  test("the superscript digits of the menus are E5C0-E5C9", () => {
    expect(tokenizeLine('"A²"')).toContain(0xe5);
    expect(tokenizeLine('"A²"').slice(-3, -1)).toEqual([0xe5, 0xc2]);
  });
  test("a + or - inside a string is still refused (a program with it vanished on the calculator)", () => {
    expect(() => tokenizeLine('"A+B"')).toThrow();
    expect(() => tokenizeLine('"A-B"')).toThrow();
  });
});

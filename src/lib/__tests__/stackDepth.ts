// An estimate of what an expression asks of the calculator's two stacks (the manual: "Stack ERROR … keep the stacks within 10
// levels for the numeric values and 26 levels for the commands"). Two-stack evaluation by precedence: a value waits on the
// numeric stack until its operator can be applied, an operator or an opening bracket waits on the command stack. Not the
// calculator's own algorithm, so the tests keep a margin below the real limits.
const PREC: Record<string, number> = { "=": 0, "<": 0, ">": 0, "≤": 0, "≥": 0, "+": 1, "–": 1, "×": 2, "÷": 2, u: 3 };

export function stackNeed(expr: string): { values: number; commands: number } {
  const s = expr
    .replace(/"[^"]*"/g, "0") // a string is one value
    .replace(/Intg \(|Abs \(|√\(/g, "(")
    .replace(/List \d+\[/g, "(")
    .replace(/\]/g, ")")
    .replace(/[A-Za-z]{2,}/g, " "); // keywords (If, Then, Locate, …)
  const toks = s.match(/\d+(\.\d+)?|[A-Za-z]|[()+–×÷=<>≤≥]/g) ?? [];
  let vals = 0, maxV = 0, maxC = 0;
  const ops: string[] = [];
  let prevValue = false;
  const reduce = () => {
    const op = ops.pop()!;
    if (op !== "u") vals--; // a binary operator takes two values and leaves one
  };
  for (const t of toks) {
    if (/^[\d.]+$/.test(t) || /^[A-Za-z]$/.test(t)) {
      vals++;
      prevValue = true;
    } else if (t === "(") {
      ops.push("(");
      prevValue = false;
    } else if (t === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") reduce();
      ops.pop();
      prevValue = true;
    } else {
      if (t === "–" && !prevValue) ops.push("u");
      else {
        while (ops.length && ops[ops.length - 1] !== "(" && PREC[ops[ops.length - 1]] >= PREC[t]) reduce();
        ops.push(t);
      }
      prevValue = false;
    }
    maxV = Math.max(maxV, vals);
    maxC = Math.max(maxC, ops.length);
  }
  return { values: maxV, commands: maxC };
}

// every statement of a listing (lines split at the colons outside strings); the parts around → and , are separate expressions
export function statements(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    let cur = "", q = false;
    for (const ch of line) {
      if (ch === '"') q = !q;
      if (ch === ":" && !q) { out.push(cur); cur = ""; } else cur += ch;
    }
    out.push(cur);
  }
  return out.flatMap((st) => st.split(/→|,(?=(?:[^"]*"[^"]*")*[^"]*$)/));
}

# casio-electrotecnia

**Casio fx-9860GIII** Basic programs for electrotecnia (electrical engineering) exams, built with the same tooling as
[casio-structural-programs](https://github.com/navarroaxel/casio-structural-programs): the listings are data, a `.g1m` writer
turns them into files for the calculator, and a small Casio Basic interpreter runs every listing in the tests and compares it
with an independent model.

## Programs

| Program | Status | What it does |
| --- | --- | --- |
| **POLIARM** | done | Non-sinusoidal (polyharmonic) circuits: a source feeding linear R-L-C branches in parallel plus a load whose harmonic currents are known. With the capacitor out ("L abierta") and compensating a share of Q ("L cerrada"): ammeter reading (rms current), wattmeter reading (P), Q (Budeanu), S, distortion power D, power factor, THD of current and voltage, and the capacitor C. |
| TRIFASICA | planned | Three-phase systems; see `docs/trifasica-exercises.md` for the first two exercises. |

### POLIARM

Menu (arrow keys + `EXE`, or the number key shown as a small superscript; `EXIT`/`0` leave):

1. **ARMONICOS** — peak or rms values, frequency, then for each harmonic: order, U (0 if none) and its phase, I of the load and its phase. Angles in degrees.
2. **RAMAS R L C** — up to 3 linear branches: R, XL and XC **at the fundamental** (the program scales them: XL·h, XC/h; XC = 0 means no capacitor).
3. **SIN COMPENSAR** — results with the capacitor switch open.
4. **COMPENSAR C** — asks the share of Q to compensate (0 = 100 %), computes C = Q₁/(ω·U₁²) and shows the results with the switch closed.
5. **POR ARMONICO** — rms source current of each harmonic.
6. **BORRAR TODO**

Data persist in lists 1–10 (the first prompt is `0 = new`, `1 = go on`).

Definitions: P = Σ U_h·I_h·cos φ_h, Q = Σ U_h·I_h·sen φ_h (Budeanu), S = U_rms·I_rms, D = √(S² − P² − Q²), THD = √(Σ_{h≥2} X_h²)/X₁.

**Worked example** (the exam exercise: u = 311·sen ωt at 50 Hz; branch 1 R = 10 Ω, X_L = 17,32 Ω; branch 2 R = 20 Ω; load
i₃ = 42,42·sen 314t + 35,35·sen(628t − 30°) + 14,142·sen(942t + 60°)). Type, after `0` (new): `ARMONICOS` → `1` (peak), `50`, `3` harmonics:
`1, 311, 0, 42.42, 0` / `2, 0, 35.35, −30` / `3, 0, 14.142, 60`; `RAMAS` → `2` branches: `10, 17.32, 0` / `20, 0, 0`.

| | L open | L closed (100 %) |
| --- | --- | --- |
| ammeter (rms current) | 54,56 A | 53,72 A |
| P (wattmeter) | 10 223 W | 10 223 W |
| Q | 2 094 var | 0 |
| S | 11 998 VA | 11 814 VA |
| D | 5 920 var | 5 920 var |
| power factor | 0,852 | 0,865 |
| THD I | 56,7 % | 57,9 % |
| C | | 137,8 µF |

With the exam's rounded 220 V / 30 A / 25 A / 10 A (11 A and 11 A in the branches) the hand values are 54,57 A, 10 230 W, 2 096 var, 12 005 VA: the small differences come from typing 311 and 42,42 as peaks.

## Build and test

```
npm install
npm run build   # g1m/*.g1m and listings/*.txt
npm test        # POLIARM: phasor model vs waveform integration, listing vs model, angle conversion, file
```

Copy `g1m/POLIARM.g1m` into the calculator's `@MainMem` folder over USB, or type `listings/POLIARM.txt` in `PRGM` mode.

## Notes

- The program computes sines and cosines with its own Taylor series, so it does not depend on the calculator's angle mode (Deg / Rad).
- A string cannot contain `+` or `-` (the writer refuses it); the 21 × 7 text-screen limits are enforced by the interpreter.
- Same verification status as the sibling project: the listings are run by an interpreter, **not yet on a real calculator**.

## License

MIT

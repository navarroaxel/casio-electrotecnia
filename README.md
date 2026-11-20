# casio-electrotecnia

**Casio fx-9860GIII** Basic programs for electrotecnia (electrical engineering) exams, built with the same tooling as
[casio-structural-programs](https://github.com/navarroaxel/casio-structural-programs): the listings are data, a `.g1m` writer
turns them into files for the calculator, and a small Casio Basic interpreter runs every listing in the tests and compares it
with an independent model.

## Programs

| Program | Status | What it does |
| --- | --- | --- |
| **POLIARM** | done | Non-sinusoidal (polyharmonic) circuits: a source feeding linear R-L-C branches in parallel plus a load whose harmonic currents are known. With the capacitor out ("L abierta") and compensating a share of Q ("L cerrada"): ammeter reading (rms current), wattmeter reading (P), Q (Budeanu), S, distortion power D, power factor, THD of current and voltage, and the capacitor C. |
| **TRIFAS** | done | Three-phase systems: star with neutral (4 wires), star without neutral (3 wires, neutral displacement) or delta, balanced or not; line, neutral and phase currents; P, Q, S; the balanced load measured with one wattmeter (Q/√3) or the Aron connection. |

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

### TRIFAS

Menu: **TENSIONES**, **CARGA**, **RESOLVER**, **MEDICION BALANC.**, **BORRAR TODO**, **SALIR** (arrow keys + `EXE`, or the small number). Data persist (`0 = new`, `1 = go on`).

1. **TENSIONES** — sequence (1 = ABC direct, 2 = ACB inverse) and **one voltage as reference**: which one (U_AN, U_BN, U_CN or the line voltages U_AB, U_BC, U_CA), its rms value and its angle. The other five follow.
2. **CARGA** — connection (1 star with neutral, 2 star without neutral, 3 delta) and the three impedances as modulus ∠ degrees (phases A B C, or AB BC CA in delta).
3. **RESOLVER** — page 1: I_A, I_B, I_C as modulus and angle, then I_N = I_A + I_B + I_C (4 wires) or the displacement U_N'N (3 wires), and P, Q, S (S = |P + jQ|). Page 2: the voltages on the load's phases (3 wires) or the phase currents (delta).
4. **MEDICION BALANC.** — *one wattmeter* in a line with its voltage coil between the other two (it reads Q/√3: U in V as line or phase voltage, I, W1 → P, Q, S, power factor, φ) or *Aron* (W1, W2 → P = W1 + W2, Q = √3·(W1 − W2)).

Phasors are printed rounded to two decimals, the angle in degrees. The arctangent is written in Basic (two halvings and a series), like sine and cosine in POLIARM.

**Worked example 1** (4 wires, U_BC = 294,2 ∠0°, ABC, Z_A = 10 ∠0°, Z_B = 15 ∠30°, Z_C = 10 ∠−30°): `TENSIONES` → `1`, `5`, `294.2`, `0`; `CARGA` → `1`, `10, 0`, `15, 30`, `10, −30`; `RESOLVER`:
I_A = 16,99 ∠90°, I_B = 11,32 ∠−60°, I_C = 16,99 ∠−120°, I_N = 8,05 ∠−110,6°.

**Worked example 2** (one wattmeter, 220 V phase, 10 A, W1 = 2193,93 W): `MEDICION BALANC.` → `UN VATIMETRO` → `2` (phase), `220`, `10`, `2193.93`: Q = 3800 var, S = 6600 VA, P = 5396 W, cos φ = 0,818, φ = 35,15°.

## Build and test

```
npm install
npm run build   # g1m/*.g1m and listings/*.txt
npm test        # phasor models vs waveform integration / circuit laws, listings vs models, angle conversions, files
```

Copy `g1m/*.g1m` into the calculator's `@MainMem` folder over USB, or type `listings/<program>.txt` in `PRGM` mode.

## Notes

- The program computes sines and cosines with its own Taylor series, so it does not depend on the calculator's angle mode (Deg / Rad).
- A string cannot contain `+` or `-` (the writer refuses it); the 21 × 7 text-screen limits are enforced by the interpreter.
- Same verification status as the sibling project: the listings are run by an interpreter, **not yet on a real calculator**.

## License

MIT

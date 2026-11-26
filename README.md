# casio-electrotecnia

**Casio fx-9860GIII** Basic programs for electrotecnia (electrical engineering) exams, built with the same tooling as
[casio-structural-programs](https://github.com/navarroaxel/casio-structural-programs): the listings are data, a `.g1m` writer
turns them into files for the calculator, and a small Casio Basic interpreter runs every listing in the tests and compares it
with an independent model.

## Programs

| Program | Status | What it does |
| --- | --- | --- |
| **POLIARM** | done | Non-sinusoidal (polyharmonic) circuits: a source feeding linear R-L-C branches in parallel plus a load whose harmonic currents are known. With the capacitor out ("L abierta") and compensating a share of Q ("L cerrada"): ammeter reading (rms current), wattmeter reading (P), Q (Budeanu), S, distortion power D, power factor, THD of current and voltage, and the capacitor C. |
| **TRIFAS** | done | Three-phase systems: star with neutral (4 wires), star without neutral (3 wires, neutral displacement) or delta, balanced or not; line, neutral and phase currents; P, Q, S; a capacitor bank in delta (given C or a target power factor) with the line currents ahead of it; the phasor diagram on the screen; the two wattmeters on the real load (any common line, with or without the bank) and the balanced load measured with one wattmeter (Q/√3) or the Aron connection. |
| **POLITRI** | done | Three-phase systems with harmonics (guide exercises 704-706): balanced star with the load's current given or with R, XL, XC per phase, neutral connected or not (line current, **neutral current**, P, Q, S, D, power factor, current of each harmonic); and three currents of any size (rms of each phase, neutral current, most loaded phase). |

### POLIARM

Menu (arrow keys + `EXE`, or the number key shown as a small superscript; `EXIT`/`0` leave):

1. **ARMONICOS** — peak or rms values, frequency, then for each harmonic: order, U (0 if none) and its phase, I of the load and its phase. Angles in degrees.
2. **RAMAS R L C** — up to 3 linear branches: R, XL and XC **at the fundamental** (the program scales them: XL·h, XC/h; XC = 0 means no capacitor).
3. **SIN COMPENSAR** — results with the capacitor switch open.
4. **COMPENSAR C** — asks the share of Q to compensate (0 = 100 %), computes C = Q₁/(ω·U₁²) and shows the results with the switch closed.
5. **POR ARMONICO** — rms source current of each harmonic.
6. **BORRAR TODO**

Data persist in lists 1–10 (the first menu is **NUEVOS** / **SEGUIR GUARDADOS**; `EXIT` is "seguir", it never wipes the data).

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

Menu: **TENSIONES**, **CARGA**, **RESOLVER**, **BANCO C**, **FASORIAL**, **VATIMETROS**, **BORRAR TODO** (arrow keys + `EXE`, or the small number; `EXIT` or `0` leave). Data persist (the first menu is **NUEVOS** / **SEGUIR GUARDADOS**; `EXIT` keeps them). Programs saved with an older version must start with `0 = new` (the lists 15-20 of the bank are new).

1. **TENSIONES** — sequence (1 = RST direct, 2 = RTS inverse) and **one voltage as reference**: which one (U_RN, U_SN, U_TN or the line voltages U_RS, U_ST, U_TR), its rms value and its angle. The other five follow. **Defaults for the usual exercise:** the first item of the reference menu (**URN 220V 90 USUAL**, and `EXIT`) means U_RN = 220 V at 90° (the guides' U_R) and asks nothing more; a **value of 0** means 220 V for a phase reference or 380 V for a line reference (the angle is still asked).
2. **CARGA** — connection (1 star with neutral, 2 star without neutral, 3 delta, or **4 VER**: it shows the load already stored, asking nothing and changing nothing: page 1 the impedance of each phase (ZR ZS ZT, or ZRS ZST ZTR in delta) and the connection, page 2 the P and Q of each phase at the loaded voltages and the total P); **symmetric?** (`1` = yes: the load is typed once and copied to the three phases); **how the load is given**: `1` impedance (modulus Ω ∠ degrees), `2` apparent power **S** (VA) and the angle, `3` active power **P** (W) and the angle (φ > 0 inductive), or `4` **several loads in parallel** (a motor and lamps, …): how many (up to 3) and, for each, **P in W (the three-phase total of that load) and cos φ** (a **negative** cos φ is a capacitive load). P and Q add up (Q = P·tan φ), a screen shows the total P, Q, S and power factor, and the total is the symmetric load of the three phases (Z = U²·(P + jQ)/(P² + Q²) per phase, no angle needed; in delta U is the line voltage). Example, a motor of 40 kW at cos φ 0,8 and lamps of 1,8 kW at cos φ 1: `4`, `2`, `40000`, `0.8`, `1800`, `1` → P = 41 800 W, Q = 30 000 var, S = 51 451 VA, cos φ = 0,81; RESOLVER gives I_R = 77,96 ∠54,3°. S and P are the **total of the three phases** if the load is symmetric and those of each phase otherwise; the program turns them into Z = U²/S_phase ∠φ (S = P/cos φ) with U the voltage on the element: the phase voltage, or the line voltage in delta. or `5` **a three-phase motor plus a single-phase load on each phase** (guide 615): the motor by P in W and cos φ (0 = none; a third goes to each phase) and then, for each phase R, S, T (RS, ST, TR in delta), the P in W and cos φ of its own load (0 = none); the program adds them phase by phase (P = P_motor/3 + P_load, Q the same with tan φ) and the load is not symmetric. Example 615 (motor 60 kW at 0,85; lamps 24 kW on R, 15 kW on S, 9 kW on T at cos φ 1): `TENSIONES` `1` (RST), `1` (the usual one); `CARGA` `1` (star with neutral), `2` (symmetric: no), `5` (motor and phases), `60000`, `0.85`, `24000`, `1`, `15000`, `1`, `9000`, `1`; `RESOLVER` → P = 108 kW and, on page 5, **W_RN = 44 kW, W_SN = 35 kW, W_TN = 29 kW** (the guide: 44 040, 35 048, 29 044 W). **TENSIONES first** (it needs U). Phases R S T, or RS ST TR in delta.
3. **RESOLVER** — page 1: I_R, I_S, I_T as modulus and angle, then I_N = I_R + I_S + I_T (4 wires) or the displacement U_N'N (3 wires), and P, Q, S (S = |P + jQ|). Page 2: the voltages on the load's phases (3 wires) or the phase currents (delta). **Page 3: the wattmeters**, for every choice of the common line, on the line currents ahead of the bank if one is connected: WRT WST (common T, the guides' 607-612), WRS WTS (common S, the exam's figure), WSR WTR (common R), and the P of page 1 (with 4 wires the sum of two wattmeters is not P). **Pages 4 and 5: P, Q, S of each phase** (PR PS PT, QR QS QT, SR SS ST: the elements of the load, RS ST TR in delta; with the totals) **and the wattmeters against the neutral of the source** WRN WSN WTN (Re(U_RN·I_LR*): in a star with neutral they are the powers of the phases; the guide's 610-612 and 615). `UNN` is the displacement of the neutral (the guides' U_O'O): 0 for a balanced load.
4. **BANCO C** — three equal capacitors in **delta** ahead of the load (run RESOLVER first). Menu: `1` *C conocido* (C in µF), `2` *COS FI objetivo* (the power factor to reach, the load being inductive: Q_C = Q − P·tan φ', C = Q_C/(3·ω·U_L²) with U_L = |U_RS|) or `3` *quitar banco*. Page 1: the **line currents ahead of the bank** I_LR, I_LS, I_LT = I + I_bank (what an ammeter or wattmeter before the bank sees), C in µF, and Q, S and the power factor with the bank (P does not change). Page 2: the bank's line currents I_RC = I_RS,C − I_TR,C, … (a delta of C draws what a star of 3C would). The bank stays connected for FASORIAL and VATIMETROS until *quitar banco*.
5. **FASORIAL** — the phasor diagram on the graph screen, drawn from what **RESOLVER** left (run RESOLVER first; any key goes on to the next screen). Screen 1: U_R, U_S, U_T from the origin (tips R S T, angles as the voltage you entered as reference), the line voltages U_RS, U_ST, U_TR as the triangle joining the tips and, for the star without neutral, the load's neutral **N** (O' in the guides) with the voltages on the load N → R S T. Screen 2: I_R, I_S, I_T, plus I_N (4 wires) or I_RS, I_ST, I_TR (delta). Screen 3, only with a bank connected: the load's currents I_R I_S I_T, the bank's current IRC ISC ITC **drawn from the tip of I to the tip of I_L**, and the line currents ILR ILS ILT from the origin (I_L = I + I_C as on paper). Each screen has its own scale, equal on both axes (the window is twice as wide as high, like the screen), **fitted to what is drawn** (the origin and every tip, 20 % margin for the labels). **Any key goes on to the next screen** (no zoom: the view already fits everything). The value of the longest phasor is printed at the bottom; the value of that longest phasor is printed at the bottom (`U MAX` / `I MAX`). Arrowheads are 25° off the shaft.
6. **VATIMETROS** — `1` *un vatímetro equilibrada* (voltage coil between the other two lines: reads Q/√3; **U = 0 takes the line voltage already loaded in TENSIONES and I = 0 the current of RESOLVER**, otherwise U in V as line or phase voltage and I; W1 → P, Q, S, power factor, φ), `2` *Aron equilibrada* (W1, W2 → P = W1 + W2, Q = √3·(W1 − W2)) and `3` **2 VAT. CARGA REAL**: the two wattmeters on the load as it is (unbalanced allowed, ahead of the bank if one is connected), with their current coils in two lines and the voltage coils to the third, **common** line (1 R, 2 S, 3 T): W = Re(U·I*) with U the line voltage between each line and the common one (W_RT and W_ST, or W_RS and W_TS as in the figure of the exam, …); it also shows their sum and the P of RESOLVER (with 4 wires the sum is not P).

Phasors are printed rounded to two decimals, the angle in degrees. Sine, cosine and arctangent are the calculator's own (`sin`, `cos`, `tan⁻¹`); the angle is scaled by `tan⁻¹ 1 ÷ 45`, so the programs work in Deg, Rad or Gra mode. Angles are printed after the character ∠ (code 7F54, not yet seen on a real calculator).

**Worked example 1** (4 wires, U_ST = 294,2 ∠0°, RST, Z_R = 10 ∠0°, Z_S = 15 ∠30°, Z_T = 10 ∠−30°): `TENSIONES` → `1`, `5`, `294.2`, `0`; `CARGA` → `1`, `10, 0`, `15, 30`, `10, −30`; `RESOLVER`:
I_R = 16,99 ∠90°, I_S = 11,32 ∠−60°, I_T = 16,99 ∠−120°, I_N = 8,05 ∠−110,6°.

**Worked example 2** (one wattmeter, 220 V phase, 10 A, W1 = 2193,93 W): `VATIMETROS` → `UN VAT. EQUILIB.` → `2` (phase), `220`, `10`, `2193.93`: Q = 3800 var, S = 6600 VA, P = 5396 W, cos φ = 0,818, φ = 35,15°.

### POLITRI

A menu: `1` **EQUILIBRADA**, `2` **DESEQUILIBRADA**, `0` / `EXIT` leaves. Values may be **peaks** (`1`) or **rms** (`2`); up to 7 harmonics; angles in degrees; nothing is saved (everything is typed each time).

**1 EQUILIBRADA** (balanced star, only the R phase is given: S and T are the same wave one third of a period later / earlier, so the harmonic n of S is shifted −120°·n and of T +120°·n). Per harmonic: order, U and its angle (0 if the source has no such harmonic) and, if you chose `1` (**I dada**), the current I and its angle, or, if you chose `2` (**R L C**), nothing more: the load is R and X_n = n·XL − XC/n per phase (XL and XC at the fundamental; XC = 0 means no capacitor), I_n = U_n/√(R² + X_n²), P = 3·R·ΣI_n², Q = 3·Σ X_n·I_n². It shows I line (ammeter, √ΣI_n²), **I neutral = 3·√(Σ I_n²) over the harmonics that are multiples of 3** (the others cancel between the three phases), P, Q, S = 3·U_rms·I_rms, D = √(S² − P² − Q²), FP, and a second page with the order and the current of each harmonic. With the **neutral disconnected** (R L C mode) the triple harmonics neither carry current nor appear on the load: they are left out of U_rms and I_rms.

**2 DESEQUILIBRADA**: per harmonic, I and the angle of R, S and T. It shows the rms current of each phase, **I neutral = √Σ_n |I_R,n + I_S,n + I_T,n|²** (phasor sum per harmonic) and the most loaded phase.

**Worked examples** (every one checked in `politri.test.ts` against the guide, and the neutral current against an integration of the three waveforms):
- **704** (peaks, 220 V source, R taken as the 0° reference): `1`, `1` (peaks), `1` (I dada), `5` harmonics: `1, 311.127, 0, 141.42, 60` / `3, 0, 0, 113.13, 92` / `5, 0, 0, 84.85, 214` / `7, 0, 0, 56.57, 32` / `9, 0, 0, 28.28, 60`. I line = **148,32 A**, I neutral = **247,4 A**, P = 33 000 W (11 000 W per phase), Q = −57 157 var (−19 052 per phase: with U at 0° and i at +60° the current leads; the guide gives the magnitude), S = 97 891 VA (the guide's 97 621 VA uses 380/√3 = 219,4 V instead of 220 V), D ≈ 72 300 VA (guide 71 910).
- **705** (rms): `2`, `2` (rms), `4` harmonics, per harmonic `I_R, ∠, I_S, ∠, I_T, ∠`: `20,30,20,−90,20,150` / `12,0,8,120,4,−120` / `6,0,4,0,2,0` / `2,30,2,30,2,30`. I_R = **24,17 A** (guide 24,16), I_S = **22 A**, I_T = **20,59 A** (guide 20,6), I_N = **15,1 A** (guide 15); the most loaded phase is R.
- **706** (rms, R = 1 Ω, XL = 0,314 Ω): `1`, `2` (rms), `2` (R L C), `1`, `0.314`, `0`, `1` (neutral connected), `5` harmonics: `1, 206.4, 0` / `3, 49, 0` / `5, 40, 0` / `7, 41.3, 0` / `9, 9.8, 0`. I line = **202,0 A**, I neutral = 3·√(I₃² + I₉²) = **107,5 A**. The guide gets 203,6 A because it rounds z₁ to 1,04 (the exact value is √(1 + 0,314²) = 1,048): its I₁ = 198,5 A is 0,8 % above the exact 196,9 A, and its P = 124 348 W is 1,5 % above (the program gives 122 444 W). Neutral **disconnected** (`0`): no I₃ or I₉, no neutral current; the guide gives no answers for this case, the program applies the rule above.

## Build and test

**Worked example 3** (the exam's figure: 100 kVA, φ = 60° inductive, balanced, U_R = 220 ∠90°, direct sequence, wattmeters W1 and W3 with the common line S, bank in delta): `TENSIONES` → `1` (RST), `1` (the usual one: U_RN = 220 ∠90°); `CARGA` → `1` (star with neutral), `1` (symmetric: yes), `2` (by S), `100000`, `60`; `RESOLVER`; `VATIMETROS` → `3` (2 VAT. CARGA REAL) → common line `2`: **W_RS = 0**, **W_TS = 50 000 W** (their sum is P). `BANCO C` → `2` (COS FI OBJETIVO) → `0` (50 Hz), `1`: C = 632,8 µF, I_LR = 75,76 ∠90° (in phase with U_R), Q = 0; `VATIMETROS` again: **W_RS = W_TS = 25 000 W**. `FASORIAL` then draws the third screen with the bank.

```
npm install
npm run build   # g1m/*.g1m and listings/*.txt
npm test        # phasor models vs waveform integration / circuit laws, listings vs models, angle conversions, files
```

Copy `g1m/*.g1m` into the calculator's `@MainMem` folder over USB, or type `listings/<program>.txt` in `PRGM` mode.

## Notes

- **Menus**: every choice is a menu like the main one: ▲ ▼ move the `>` marker, `EXE` chooses, **the number key of an item chooses it at once** (shown after the item), `EXIT` or `0` leaves a submenu with nothing done. Only values are typed. (`pickMenu` in `basicKit.ts`; `menus.test.ts` drives them with the keys of a user.)
- **Screens**: every prompt says what it asks and its unit; a result screen shows `EXE` in the corner of its last line when it waits for a key (`ux.test.ts` checks that nothing is under it, nor past the 21 columns); the sign of a cos φ is typed as negative for a capacitive load (`NEG=CAPACIT` in the prompt).
- **Stack ERROR**: the calculator stops when one expression needs more than 10 values or 26 commands on its stacks (the manual's remedy: divide the formula). The series of the sine, cosine and arctangent are therefore written one operation per line (`hornerLines`, `atan2Lines` in `basicKit.ts`), and `stack.test.ts` estimates the stack of every expression of every listing and fails if one gets close to the limit. The interpreter cannot see this error by itself.
- **Size** (the calculator's main memory is small and the programs share it with the lists and every other program): POLIARM 4,2 KB, TRIFAS 18,3 KB, POLITRI 4,1 KB. Saving space matters more than saving lines: the arctangent is written once per block (`POLAR` in `trifas.ts`) and the rows are printed in loops, the submenus are a typed number (the arrow-key menu is only the main one), and the bank's currents are computed in RESOLVER and BANCO C only. `npm run build` prints the size of every program.

- Sines, cosines and arctangents use the calculator's functions scaled by `tan⁻¹ 1 ÷ 45`, so the angle mode (Deg / Rad / Gra) does not matter. The bank assumes 50 Hz.
- A string cannot contain `+` or `-` (the writer refuses it); the 21 × 7 text-screen limits are enforced by the interpreter.
- Same verification status as the sibling project: the listings are run by an interpreter, **not yet on a real calculator**.

## License

MIT

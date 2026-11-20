# Three-phase exercises (test cases for the next program)

Hand-derived expected results, to be checked against the program when it exists. Phase sequence ABC (direct).

## 1) Four-wire ABC system, star load

Line voltage U_BC = 294,2 ∠0° V. Loads: Z_A = 10 ∠0° Ω, Z_B = 15 ∠30° Ω, Z_C = 10 ∠−30° Ω, neutral connected.
Find line and neutral currents; phasor diagram of phase voltages, line voltages and currents.

With U_BC as the reference, U_AN = 169,9 ∠90°, U_BN = 169,9 ∠−30°, U_CN = 169,9 ∠210° (U_BC = U_BN − U_CN):

| | |
| --- | --- |
| I_A | 16,99 A ∠90° |
| I_B | 11,32 A ∠−60° |
| I_C | 16,99 A ∠−120° |
| I_N = I_A + I_B + I_C (current that returns through the neutral wire) | 8,05 A ∠−110,6° |

## 2) One wattmeter, balanced load

Phase voltages U_R = 220 ∠0°, U_S = 220 ∠−120°, U_T = 220 ∠−240° V. The ammeter in line R reads 10 A; W1 (current coil in line R,
voltage coil between S and T) reads 2193,93 W. Show that W1 represents Q/√3, and find P, Q, S of the balanced load.

W1 = U_ST · I_R · cos(90° − φ) = U_L · I · sen φ, so Q = √3 · W1 = 3800 var.
S = 3 · 220 · 10 = 6600 VA, P = √(S² − Q²) ≈ 5396 W, φ ≈ 35,15° (inductive).

Both are run by `src/lib/__tests__/trifas.test.ts` (the model and the listing). The sign of I_N depends on the convention: here it is the sum of the line currents; the opposite convention differs by 180°.

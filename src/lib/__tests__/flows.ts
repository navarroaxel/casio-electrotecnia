// What the user does, step by step, for the tests: each step gives the keys it presses in the menus (the number key of the item)
// and the values it types at the prompts. Keys and values are two separate streams, each in the order the program asks.
import { newGfx, newMem, runBasic, type Gfx } from "./casioBasic";

const DIGIT = [71, 72, 62, 52, 73, 63, 53, 74, 64, 54]; // the codes of the number keys 0-9
export const KEY = { EXE: 31, EXIT: 47, PLUS: 42, MINUS: 32, UP: 28, DOWN: 37, LEFT: 38, RIGHT: 27 };
export interface Flow {
  inputs: number[];
  keys: number[];
}
export const flow = (...parts: Flow[]): Flow => ({ inputs: parts.flatMap((p) => p.inputs), keys: parts.flatMap((p) => p.keys) });
const step = (digits: number[], inputs: number[] = [], raw: number[] = []): Flow => ({ keys: [...digits.map((d) => DIGIT[d]), ...raw], inputs });

// TRIFAS main menu: 1 TENSIONES 2 CARGA 3 RESOLVER 4 BANCO C 5 FASORIAL 6 VATIMETROS 7 BORRAR TODO, 0 / EXIT leaves
export const nuevo = (): Flow => step([1]); // the start menu: 1 NUEVOS
export const seguir = (): Flow => step([2]); // 2 SEGUIR GUARDADOS
export const exit = (): Flow => step([0]);
export const solve = (): Flow => step([3]);
// TENSIONES: the sequence (1 RST, 2 RTS) and the reference: ref 0 = the usual one (U_RN 220 V at 90°, a single key), else
// 1 URN … 6 UTR with its value (0 = 220 V / 380 V) and angle
export const tens = (o: { seq?: number; ref?: number; value?: number; angle?: number } = {}): Flow => {
  const { seq = 1, ref = 0, value = 0, angle = 0 } = o;
  return step([1, seq, ref === 0 ? 1 : ref + 1], ref === 0 ? [] : [value, angle]);
};
// CARGA: the connection (1 star with neutral, 2 star without, 3 delta), symmetric?, how it is given (1 Z, 2 S, 3 P, 4 several,
// 5 motor and phases) and the values typed
export const carga = (conn: number, symmetric: boolean, how: number, values: number[]): Flow => step([2, conn, symmetric ? 1 : 2, how], values);
// a load by impedance: [modulus, angle] of each phase (or only one if symmetric)
export const cargaZ = (conn: number, Z: [number, number][], symmetric = false): Flow => carga(conn, symmetric, 1, symmetric ? [...Z[0]] : Z.flat());
// CARGA, 4 = VER LA GUARDADA: shows the stored load and goes back to the main menu
export const verCarga = (): Flow => step([2, 4]);
export const banco = (option: number, values: number[] = []): Flow => step([4, option], values); // 1 C known, 2 cos φ, 3 remove
// FASORIAL: the keys pressed on the graph screens (EXE goes on, + − zoom, the arrows move)
export const fasor = (screens: number[]): Flow => step([5], [], screens);
// VATIMETROS: option 1 one wattmeter, 2 Aron, 3 the two wattmeters on the load; `menus` are the keys of the submenu that follows
// (the common line 1 R 2 S 3 T for option 3, 1 LINEA / 2 FASE after a typed U for option 1)
export const vatim = (option: number, menus: number[] = [], values: number[] = []): Flow => step([6, option, ...menus], values);
// raw key codes (EXE, the arrows…) and typed values, for the tests of the menus themselves
export const press = (...codes: number[]): Flow => ({ keys: codes, inputs: [] });
export const typed = (...values: number[]): Flow => ({ keys: [], inputs: values });
export const go = (lines: string[], f: Flow): Gfx => {
  const g = newGfx();
  runBasic(lines, f.inputs, g, newMem(), f.keys);
  return g;
};

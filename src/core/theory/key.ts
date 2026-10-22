// SPDX-License-Identifier: GPL-3.0-or-later
// Tonalidades, armaduras y círculo de quintas.
import { type PitchClass, pc, samePc, chroma } from "./pitch";
import { IV, transposePc } from "./interval";

export type Mode = "major" | "minor";

export interface Key {
  tonic: PitchClass;
  mode: Mode;
}

/** Orden de los sostenidos y de los bemoles en la armadura. */
export const SHARP_ORDER: PitchClass[] = [3, 0, 4, 1, 5, 2, 6].map((l) => pc(l, 1)); // F C G D A E B
export const FLAT_ORDER: PitchClass[] = [6, 2, 5, 1, 4, 0, 3].map((l) => pc(l, -1)); // B E A D G C F

/** Tónica mayor para una armadura (-7..7 alteraciones; positivo = sostenidos). */
export function majorTonicForFifths(fifths: number): PitchClass {
  let t = pc(0, 0);
  const iv = IV("P5");
  if (fifths >= 0) for (let i = 0; i < fifths; i++) t = transposePc(t, iv);
  else for (let i = 0; i < -fifths; i++) t = transposePc(t, iv, true);
  return t;
}

export function keyFromFifths(fifths: number, mode: Mode = "major"): Key {
  const major = majorTonicForFifths(fifths);
  if (mode === "major") return { tonic: major, mode };
  return { tonic: transposePc(major, IV("m3"), true), mode };
}

/** Cantidad de quintas (armadura) de una tonalidad; null si sería teórica (>7). */
export function fifthsOf(key: Key): number | null {
  const major = key.mode === "major" ? key.tonic : transposePc(key.tonic, IV("m3"));
  for (let f = -7; f <= 7; f++) {
    if (samePc(majorTonicForFifths(f), major)) return f;
  }
  return null;
}

export function signatureAccidentals(fifths: number): PitchClass[] {
  return fifths >= 0 ? SHARP_ORDER.slice(0, fifths) : FLAT_ORDER.slice(0, -fifths);
}

/** Alteración que la armadura le aplica a una letra (0 si ninguna). */
export function signatureAccFor(fifths: number, letter: number): number {
  return signatureAccidentals(fifths).find((p) => p.letter === letter)?.acc ?? 0;
}

export function relative(key: Key): Key {
  return key.mode === "major"
    ? { tonic: transposePc(key.tonic, IV("m3"), true), mode: "minor" }
    : { tonic: transposePc(key.tonic, IV("m3")), mode: "major" };
}

export function parallel(key: Key): Key {
  return { tonic: key.tonic, mode: key.mode === "major" ? "minor" : "major" };
}

/** Círculo de quintas: tonalidades mayores de 0 a 7 sostenidos y de 1 a 7 bemoles. */
export function circleOfFifths(): { fifths: number; major: PitchClass; minor: PitchClass }[] {
  const out = [];
  for (let f = -7; f <= 7; f++) {
    out.push({ fifths: f, major: keyFromFifths(f).tonic, minor: keyFromFifths(f, "minor").tonic });
  }
  return out;
}

/** ¿La armadura prefiere bemoles? (para ortografiar cromatismos) */
export function prefersFlats(key: Key): boolean {
  const f = fifthsOf(key);
  if (f === null) return chroma(key.tonic) !== 0;
  return f < 0;
}

export function sameKey(a: Key, b: Key): boolean {
  return a.mode === b.mode && samePc(a.tonic, b.tonic);
}

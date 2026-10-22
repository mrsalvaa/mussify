// SPDX-License-Identifier: GPL-3.0-or-later
// Escalas y modos, con ortografía correcta.
import { type Interval, IV, transposePc, transpose, semitones as semitonesOf } from "./interval";
import type { Pitch, PitchClass } from "./pitch";

export type ScaleType =
  | "major"
  | "minor"
  | "harmonicMinor"
  | "melodicMinor"
  | "ionian"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian"
  | "aeolian"
  | "locrian"
  | "majorPentatonic"
  | "minorPentatonic"
  | "blues"
  | "chromatic";

export const SCALE_INTERVALS: Record<ScaleType, Interval[]> = {
  major: ["P1", "M2", "M3", "P4", "P5", "M6", "M7"].map(IV),
  minor: ["P1", "M2", "m3", "P4", "P5", "m6", "m7"].map(IV),
  harmonicMinor: ["P1", "M2", "m3", "P4", "P5", "m6", "M7"].map(IV),
  melodicMinor: ["P1", "M2", "m3", "P4", "P5", "M6", "M7"].map(IV),
  ionian: ["P1", "M2", "M3", "P4", "P5", "M6", "M7"].map(IV),
  dorian: ["P1", "M2", "m3", "P4", "P5", "M6", "m7"].map(IV),
  phrygian: ["P1", "m2", "m3", "P4", "P5", "m6", "m7"].map(IV),
  lydian: ["P1", "M2", "M3", "A4", "P5", "M6", "M7"].map(IV),
  mixolydian: ["P1", "M2", "M3", "P4", "P5", "M6", "m7"].map(IV),
  aeolian: ["P1", "M2", "m3", "P4", "P5", "m6", "m7"].map(IV),
  locrian: ["P1", "m2", "m3", "P4", "d5", "m6", "m7"].map(IV),
  majorPentatonic: ["P1", "M2", "M3", "P5", "M6"].map(IV),
  minorPentatonic: ["P1", "m3", "P4", "P5", "m7"].map(IV),
  blues: ["P1", "m3", "P4", "d5", "P5", "m7"].map(IV),
  chromatic: ["P1", "m2", "M2", "m3", "M3", "P4", "A4", "P5", "m6", "M6", "m7", "M7"].map(IV),
};

export const SCALE_NAMES: Record<ScaleType, string> = {
  major: "mayor",
  minor: "menor natural",
  harmonicMinor: "menor armónica",
  melodicMinor: "menor melódica",
  ionian: "jónico",
  dorian: "dórico",
  phrygian: "frigio",
  lydian: "lidio",
  mixolydian: "mixolidio",
  aeolian: "eólico",
  locrian: "locrio",
  majorPentatonic: "pentatónica mayor",
  minorPentatonic: "pentatónica menor",
  blues: "de blues",
  chromatic: "cromática",
};

export const MODES: ScaleType[] = ["ionian", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian"];

export function scalePcs(tonic: PitchClass, type: ScaleType): PitchClass[] {
  return SCALE_INTERVALS[type].map((iv) => transposePc(tonic, iv));
}

/** Escala ascendente desde una altura concreta, incluyendo la octava. */
export function scalePitches(tonic: Pitch, type: ScaleType, includeOctave = true): Pitch[] {
  const out = SCALE_INTERVALS[type].map((iv) => transpose(tonic, iv));
  if (includeOctave) out.push(transpose(tonic, IV("P8")));
  return out;
}

/** Patrón de tonos (T) y semitonos (S) de la escala, p. ej. "T T S T T T S". */
export function stepPattern(type: ScaleType): string[] {
  const ivs = SCALE_INTERVALS[type];
  const semis = ivs.map((iv) => semitonesOf(iv));
  semis.push(12);
  const out: string[] = [];
  for (let i = 1; i < semis.length; i++) {
    const d = semis[i] - semis[i - 1];
    out.push(d === 1 ? "S" : d === 2 ? "T" : d === 3 ? "T½" : String(d));
  }
  return out;
}


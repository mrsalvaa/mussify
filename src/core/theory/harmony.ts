// SPDX-License-Identifier: GPL-3.0-or-later
// Campo armónico, números romanos, funciones tonales y análisis.
import { type Chord, type ChordQuality, chordPcs, CHORDS, sameChord } from "./chord";
import { IV, intervalBetweenPc, transposePc, semitones } from "./interval";
import { type Key, parallel } from "./key";
import { type PitchClass, chroma, mod, samePc } from "./pitch";
import { scalePcs } from "./scale";

export type HarmonicFunction = "T" | "SD" | "D";

export interface RomanNumeral {
  degree: number; // 1..7
  /** Alteración del grado respecto de la escala mayor del modo (bVII = -1). */
  acc: number;
  quality: ChordQuality;
  /** Si es secundario: grado al que resuelve (V/V -> 5). */
  of?: number;
  /** Sustituto tritonal del dominante de este grado. */
  tritoneSubOf?: number;
  /** Prestado del modo paralelo. */
  borrowed?: boolean;
  inversion?: number;
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

function keyScale(key: Key): PitchClass[] {
  return scalePcs(key.tonic, key.mode === "major" ? "major" : "minor");
}

/** Cualidad de una tríada o cuatríada construida por terceras sobre cada grado. */
function stackQuality(scale: PitchClass[], degree: number, sevenths: boolean): ChordQuality {
  const root = scale[degree];
  const third = scale[(degree + 2) % 7];
  const fifth = scale[(degree + 4) % 7];
  const t = semitones(intervalBetweenPc(root, third));
  const f = semitones(intervalBetweenPc(root, fifth));
  let triad: "maj" | "min" | "dim" | "aug";
  if (t === 4 && f === 7) triad = "maj";
  else if (t === 3 && f === 7) triad = "min";
  else if (t === 3 && f === 6) triad = "dim";
  else triad = "aug";
  if (!sevenths) return triad;
  const s = semitones(intervalBetweenPc(root, scale[(degree + 6) % 7]));
  if (triad === "maj") return s === 11 ? "maj7" : "7";
  if (triad === "min") return s === 10 ? "m7" : "mMaj7";
  if (triad === "dim") return s === 10 ? "m7b5" : "dim7";
  return "maj7";
}

/** Campo armónico: los 7 acordes diatónicos de la tonalidad. */
export function diatonicChords(key: Key, sevenths = false, harmonicMinorV = false): Chord[] {
  let scale = keyScale(key);
  const out: Chord[] = [];
  for (let i = 0; i < 7; i++) {
    out.push({ root: scale[i], quality: stackQuality(scale, i, sevenths) });
  }
  if (key.mode === "minor" && harmonicMinorV) {
    scale = scalePcs(key.tonic, "harmonicMinor");
    out[4] = { root: scale[4], quality: stackQuality(scale, 4, sevenths) };
    out[6] = { root: scale[6], quality: stackQuality(scale, 6, sevenths) };
  }
  return out;
}

export function chordOfDegree(key: Key, degree: number, sevenths = false): Chord {
  return diatonicChords(key, sevenths, key.mode === "minor" && degree === 5)[degree - 1];
}

export function functionOfDegree(degree: number): HarmonicFunction {
  if (degree === 1 || degree === 3 || degree === 6) return "T";
  if (degree === 2 || degree === 4) return "SD";
  return "D";
}

const FUNCTION_NAMES: Record<HarmonicFunction, string> = { T: "tónica", SD: "subdominante", D: "dominante" };
export function functionName(f: HarmonicFunction): string {
  return FUNCTION_NAMES[f];
}

function isMinorish(q: ChordQuality): boolean {
  return ["min", "m6", "m7", "m7b5", "dim", "dim7", "mMaj7", "m9", "m11"].includes(q);
}

export function romanString(rn: RomanNumeral): string {
  let base = ROMAN[rn.degree - 1];
  if (isMinorish(rn.quality)) base = base.toLowerCase();
  const accStr = rn.acc < 0 ? "♭".repeat(-rn.acc) : "♯".repeat(rn.acc);
  const suffixes: Partial<Record<ChordQuality, string>> = {
    maj: "",
    min: "",
    dim: "°",
    aug: "+",
    "7": "7",
    maj7: "maj7",
    m7: "7",
    m7b5: "ø7",
    dim7: "°7",
    mMaj7: "(maj7)",
    "6": "6",
    m6: "6",
    sus4: "sus4",
    sus2: "sus2",
    "7sus4": "7sus4",
    "9": "9",
    m9: "9",
    maj9: "maj9",
    add9: "add9",
    "5": "5",
  };
  let s = accStr + base + (suffixes[rn.quality] ?? CHORDS[rn.quality].us);
  if (rn.of) s = (rn.tritoneSubOf ? "subV" : s) + "/" + ROMAN[rn.of - 1];
  if (rn.tritoneSubOf && !rn.of) s = "subV/" + ROMAN[rn.tritoneSubOf - 1];
  return s;
}

/** Acorde concreto a partir de un número romano (diatónico, secundario, prestado). */
export function chordFromRoman(key: Key, rn: RomanNumeral): Chord {
  if (rn.of) {
    const target = chordOfDegree(key, rn.of).root;
    if (rn.tritoneSubOf) return { root: transposePc(target, IV("m2")), quality: rn.quality };
    return { root: transposePc(target, IV("P5")), quality: rn.quality };
  }
  const majorScale = scalePcs(key.tonic, "major");
  const minorScale = scalePcs(key.tonic, "minor");
  const ref = key.mode === "major" ? majorScale : minorScale;
  let root = ref[rn.degree - 1];
  if (rn.borrowed) root = (key.mode === "major" ? minorScale : majorScale)[rn.degree - 1];
  else if (rn.acc !== 0) root = { letter: root.letter, acc: (root.acc + rn.acc) as PitchClass["acc"] };
  return { root, quality: rn.quality };
}

export interface Analysis {
  chord: Chord;
  roman: RomanNumeral | null;
  label: string;
  kind: "diatonic" | "secondary" | "tritoneSub" | "borrowed" | "chromatic";
  fn?: HarmonicFunction;
}

/** Analiza un acorde dentro de una tonalidad. */
export function analyzeChord(chord: Chord, key: Key): Analysis {
  const base: Chord = { root: chord.root, quality: chord.quality };
  const inv = chord.bass ? chordPcs(base).findIndex((p) => samePc(p, chord.bass!)) : 0;
  const scale = keyScale(key);
  const triads = diatonicChords(key, false, key.mode === "minor");
  const sevenths = diatonicChords(key, true, key.mode === "minor");
  const naturalTriads = diatonicChords(key, false);
  const naturalSevenths = diatonicChords(key, true);
  for (let i = 0; i < 7; i++) {
    for (const cand of [triads[i], sevenths[i], naturalTriads[i], naturalSevenths[i]]) {
      if (sameChord(cand, base)) {
        const rn: RomanNumeral = { degree: i + 1, acc: 0, quality: base.quality, inversion: inv > 0 ? inv : undefined };
        return { chord, roman: rn, label: romanString(rn), kind: "diatonic", fn: functionOfDegree(i + 1) };
      }
    }
  }
  // Dominantes secundarias: acorde mayor o 7 a una 5J arriba de un grado (que no sea la tónica).
  if (base.quality === "maj" || base.quality === "7" || base.quality === "7b9" || base.quality === "9") {
    for (let i = 1; i < 7; i++) {
      const target = triads[i];
      if (target.quality === "dim") continue;
      if (chroma(transposePc(target.root, IV("P5"))) === chroma(base.root) && samePc(transposePc(target.root, IV("P5")), base.root)) {
        const rn: RomanNumeral = { degree: 5, acc: 0, quality: base.quality, of: i + 1 };
        return { chord, roman: rn, label: romanString(rn), kind: "secondary", fn: "D" };
      }
    }
  }
  // Sustitución tritonal: acorde 7 medio tono arriba del grado de destino.
  if (base.quality === "7") {
    for (let i = 0; i < 7; i++) {
      const target = triads[i];
      if (chroma(transposePc(target.root, IV("m2"))) === chroma(base.root)) {
        const rn: RomanNumeral = { degree: 2, acc: -1, quality: "7", tritoneSubOf: i + 1, of: i === 0 ? undefined : i + 1 };
        const label = i === 0 ? "subV7" : "subV7/" + ROMAN[i];
        return { chord, roman: rn, label, kind: "tritoneSub", fn: "D" };
      }
    }
  }
  // Préstamo modal del modo paralelo.
  const par = parallel(key);
  const parTriads = diatonicChords(par, false);
  const parSevenths = diatonicChords(par, true);
  const refMajor = scalePcs(key.tonic, "major");
  for (let i = 0; i < 7; i++) {
    for (const cand of [parTriads[i], parSevenths[i]]) {
      if (sameChord(cand, base)) {
        const acc = mod(chroma(cand.root) - chroma(refMajor[i]) + 6, 12) - 6;
        const rn: RomanNumeral = { degree: i + 1, acc, quality: base.quality, borrowed: true };
        return { chord, roman: rn, label: romanString(rn), kind: "borrowed", fn: functionOfDegree(i + 1) };
      }
    }
  }
  // Cromático: se nombra con el grado más cercano de la escala.
  const deg = scale.findIndex((p) => p.letter === base.root.letter);
  if (deg >= 0) {
    const acc = mod(chroma(base.root) - chroma(refMajor[deg]) + 6, 12) - 6;
    const rn: RomanNumeral = { degree: deg + 1, acc, quality: base.quality };
    return { chord, roman: rn, label: romanString(rn), kind: "chromatic" };
  }
  return { chord, roman: null, label: "?", kind: "chromatic" };
}

/** Progresiones típicas, en grados, para ejercicios y fichas. */
export const PROGRESSIONS: Record<string, { name: string; numerals: RomanNumeral[] }> = {
  "I-IV-V": { name: "I – IV – V", numerals: [1, 4, 5].map((g) => ({ degree: g, acc: 0, quality: "maj" as ChordQuality })) },
  "I-V-vi-IV": {
    name: "I – V – vi – IV",
    numerals: [
      { degree: 1, acc: 0, quality: "maj" },
      { degree: 5, acc: 0, quality: "maj" },
      { degree: 6, acc: 0, quality: "min" },
      { degree: 4, acc: 0, quality: "maj" },
    ],
  },
  "ii-V-I": {
    name: "ii – V – I",
    numerals: [
      { degree: 2, acc: 0, quality: "m7" },
      { degree: 5, acc: 0, quality: "7" },
      { degree: 1, acc: 0, quality: "maj7" },
    ],
  },
  "I-vi-IV-V": {
    name: "I – vi – IV – V",
    numerals: [
      { degree: 1, acc: 0, quality: "maj" },
      { degree: 6, acc: 0, quality: "min" },
      { degree: 4, acc: 0, quality: "maj" },
      { degree: 5, acc: 0, quality: "maj" },
    ],
  },
  "i-bVII-bVI-V": {
    name: "i – ♭VII – ♭VI – V (andaluza)",
    numerals: [
      { degree: 1, acc: 0, quality: "min" },
      { degree: 7, acc: 0, quality: "maj" },
      { degree: 6, acc: 0, quality: "maj" },
      { degree: 5, acc: 0, quality: "maj" },
    ],
  },
  blues12: {
    name: "Blues de 12 compases",
    numerals: [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5].map((g) => ({ degree: g, acc: 0, quality: "7" as ChordQuality })),
  },
};

export type CadenceType = "authentic" | "plagal" | "half" | "deceptive";
export const CADENCE_NAMES: Record<CadenceType, string> = {
  authentic: "auténtica (V → I)",
  plagal: "plagal (IV → I)",
  half: "semicadencia (→ V)",
  deceptive: "rota (V → vi)",
};

export function classifyCadence(fromDegree: number, toDegree: number): CadenceType | null {
  if (fromDegree === 5 && toDegree === 1) return "authentic";
  if (fromDegree === 4 && toDegree === 1) return "plagal";
  if (toDegree === 5) return "half";
  if (fromDegree === 5 && toDegree === 6) return "deceptive";
  return null;
}

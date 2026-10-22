// SPDX-License-Identifier: GPL-3.0-or-later
// Instrumentos de cuerda con trastes: afinaciones, posiciones y formas de acordes.
import { type Pitch, type PitchClass, P, midi, fromMidi, chroma, samePc } from "../theory/pitch";
import { type Chord, chordPcs, chordKey, C } from "../theory/chord";

export interface Tuning {
  id: string;
  name: string;
  /** Cuerdas de la 1 (aguda) a la última (grave). */
  strings: Pitch[];
}

const t = (id: string, name: string, s: string) => ({ id, name, strings: s.split(" ").map(P) });

export const GUITAR_TUNINGS: Tuning[] = [
  t("standard", "Estándar (Mi La Re Sol Si Mi)", "E4 B3 G3 D3 A2 E2"),
  t("dropD", "Drop D (Re La Re Sol Si Mi)", "E4 B3 G3 D3 A2 D2"),
  t("halfDown", "Medio tono abajo (Mi♭)", "Eb4 Bb3 Gb3 Db3 Ab2 Eb2"),
  t("openG", "Sol abierto (Re Sol Re Sol Si Re)", "D4 B3 G3 D3 G2 D2"),
  t("dadgad", "DADGAD", "D4 A3 G3 D3 A2 D2"),
  t("openE", "Mi abierto", "E4 B3 G#3 E3 B2 E2"),
];

export const BASS_TUNINGS: Tuning[] = [
  t("standard4", "4 cuerdas estándar (Mi La Re Sol)", "G2 D2 A1 E1"),
  t("standard5", "5 cuerdas (Si Mi La Re Sol)", "G2 D2 A1 E1 B0"),
  t("dropD4", "Drop D 4 cuerdas", "G2 D2 A1 D1"),
];

export function pitchAt(tuning: Tuning, string: number, fret: number, preferFlats = false): Pitch {
  return fromMidi(midi(tuning.strings[string - 1]) + fret, preferFlats);
}

/** Todas las posiciones (cuerda, traste) que suenan como esa altura. */
export function positionsOf(tuning: Tuning, p: Pitch, maxFret = 22): { string: number; fret: number }[] {
  const out = [];
  for (let s = 1; s <= tuning.strings.length; s++) {
    const f = midi(p) - midi(tuning.strings[s - 1]);
    if (f >= 0 && f <= maxFret) out.push({ string: s, fret: f });
  }
  return out;
}

/** Posiciones de una clase de altura en un rango de trastes. */
export function positionsOfPc(tuning: Tuning, p: PitchClass, minFret = 0, maxFret = 12): { string: number; fret: number }[] {
  const out = [];
  for (let s = 1; s <= tuning.strings.length; s++) {
    for (let f = minFret; f <= maxFret; f++) {
      if (chroma(fromMidi(midi(tuning.strings[s - 1]) + f)) === chroma(p)) out.push({ string: s, fret: f });
    }
  }
  return out;
}

/** Forma de acorde: trastes por cuerda de la 6 a la 1 (null = no se toca). */
export interface ChordShape {
  id: string;
  /** Concepto que enseña esta forma. */
  concept: string;
  chord: string;
  /** Trastes de la cuerda grave a la aguda (6→1 en guitarra). */
  frets: (number | null)[];
  fingers?: (number | null)[];
  barre?: { fret: number; from: number; to: number };
  /** Si es una forma móvil, el traste de la fundamental y la cuerda que la toca. */
  movable?: { rootString: number; rootFret: number };
}

const shape = (id: string, chord: string, frets: string, fingers: string, extra: Partial<ChordShape> = {}): ChordShape => ({
  id,
  concept: `gt.ch.${id}`,
  chord,
  frets: frets.split("").map((c) => (c === "x" ? null : parseInt(c, 16))),
  fingers: fingers.split("").map((c) => (c === "x" || c === "0" ? null : parseInt(c, 10))),
  ...extra,
});

/** Formas abiertas de guitarra (cuerdas 6→1). */
export const GUITAR_OPEN_SHAPES: ChordShape[] = [
  shape("Em", "Em", "022000", "023000"),
  shape("E", "E", "022100", "023100"),
  shape("Am", "Am", "x02210", "x02310"),
  shape("A", "A", "x02220", "x01230"),
  shape("D", "D", "xx0232", "xx0132"),
  shape("Dm", "Dm", "xx0231", "xx0231"),
  shape("G", "G", "320003", "210003"),
  shape("C", "C", "x32010", "x32010"),
  shape("E7", "E7", "020100", "020100"),
  shape("A7", "A7", "x02020", "x02030"),
  shape("D7", "D7", "xx0212", "xx0213"),
  shape("G7", "G7", "320001", "320001"),
  shape("B7", "B7", "x21202", "x21304"),
  shape("Am7", "Am7", "x02010", "x02010"),
  shape("Em7", "Em7", "022030", "012040"),
  shape("Dsus4", "Dsus4", "xx0233", "xx0134"),
  shape("Asus4", "Asus4", "x02230", "x01230"),
  shape("Cadd9", "Cadd9", "x32033", "x21034"),
  shape("Fmaj7", "Fmaj7", "xx3210", "xx3210"),
];

/** Formas móviles (con cejilla o de power chord). La fundamental se indica con rootFret 0 relativo. */
export interface MovableShape {
  id: string;
  concept: string;
  quality: Chord["quality"];
  rootString: number; // 6 o 5
  /** Desplazamientos de traste relativos a la fundamental, cuerdas 6→1. */
  offsets: (number | null)[];
  fingers: (number | null)[];
  barre?: boolean;
}

const mv = (id: string, quality: Chord["quality"], rootString: number, offsets: string, fingers: string, barre = true): MovableShape => ({
  id,
  concept: `gt.mv.${id}`,
  quality,
  rootString,
  offsets: offsets.split(" ").map((c) => (c === "x" ? null : parseInt(c, 10))),
  fingers: fingers.split(" ").map((c) => (c === "x" ? null : parseInt(c, 10))),
  barre,
});

export const GUITAR_MOVABLE_SHAPES: MovableShape[] = [
  mv("power6", "5", 6, "0 2 x x x x", "1 3 x x x x", false),
  mv("power5", "5", 5, "x 0 2 x x x", "x 1 3 x x x", false),
  mv("E", "maj", 6, "0 2 2 1 0 0", "1 3 4 2 1 1"),
  mv("Em", "min", 6, "0 2 2 0 0 0", "1 3 4 1 1 1"),
  mv("A", "maj", 5, "x 0 2 2 2 0", "x 1 3 3 3 1"),
  mv("Am", "min", 5, "x 0 2 2 1 0", "x 1 3 4 2 1"),
  mv("E7", "7", 6, "0 2 0 1 0 0", "1 3 1 2 1 1"),
  mv("A7", "7", 5, "x 0 2 0 2 0", "x 1 3 1 4 1"),
  mv("Am7", "m7", 5, "x 0 2 0 1 0", "x 1 3 1 2 1"),
  mv("Em7", "m7", 6, "0 2 0 0 0 0", "1 3 1 1 1 1"),
];

export const STANDARD = GUITAR_TUNINGS[0];
export const BASS4 = BASS_TUNINGS[0];
export const BASS5 = BASS_TUNINGS[1];

/** Forma concreta (trastes absolutos) de una forma móvil para un acorde. */
export function placeMovable(m: MovableShape, root: PitchClass, tuning: Tuning = STANDARD): ChordShape | null {
  const n = tuning.strings.length;
  const open = tuning.strings[m.rootString - 1];
  let fret = ((chroma(root) - chroma(open)) % 12 + 12) % 12;
  if (fret === 0) fret = 12;
  const frets = m.offsets.map((o) => (o === null ? null : o + fret));
  if (frets.length !== n) return null;
  return {
    id: `${m.id}@${fret}`,
    concept: m.concept,
    chord: chordKey({ root, quality: m.quality }),
    frets,
    fingers: m.fingers,
    barre: m.barre ? { fret, from: 1, to: m.rootString } : undefined,
    movable: { rootString: m.rootString, rootFret: fret },
  };
}

/** Formas posibles para un acorde (abiertas primero). Solo cifrados sin bajo. */
export function shapesForChord(chord: Chord): ChordShape[] {
  const out: ChordShape[] = [];
  const key = chordKey({ root: chord.root, quality: chord.quality });
  for (const s of GUITAR_OPEN_SHAPES) {
    if (chordKey(C(s.chord)) === key) out.push(s);
  }
  for (const m of GUITAR_MOVABLE_SHAPES) {
    if (m.quality === chord.quality) {
      const placed = placeMovable(m, chord.root);
      if (placed) out.push(placed);
    }
  }
  return out;
}

/** Comprueba que una forma suena como el acorde (todas sus notas pertenecen a él). */
export function shapeMatchesChord(sh: ChordShape, chord: Chord, tuning: Tuning = STANDARD): boolean {
  const pcs = chordPcs({ root: chord.root, quality: chord.quality });
  const n = tuning.strings.length;
  const sounding = sh.frets
    .map((f, i) => (f === null ? null : pitchAt(tuning, n - i, f)))
    .filter((p): p is Pitch => p !== null);
  return sounding.every((p) => pcs.some((c) => chroma(c) === chroma(p))) && pcs.every((c) => sounding.some((p) => chroma(p) === chroma(c)) || chord.quality === "9" || chord.quality === "13");
}

/** Notas que suenan con una forma, de grave a aguda. */
export function shapePitches(sh: ChordShape, tuning: Tuning = STANDARD): Pitch[] {
  const n = tuning.strings.length;
  return sh.frets.map((f, i) => (f === null ? null : pitchAt(tuning, n - i, f))).filter((p): p is Pitch => p !== null);
}

export function isNaturalAt(tuning: Tuning, string: number, fret: number): boolean {
  return pitchAt(tuning, string, fret).acc === 0;
}

export { samePc };

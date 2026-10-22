// SPDX-License-Identifier: GPL-3.0-or-later
// Acordes, cifrado americano (C, Am7, G/B) y cifrado latino/europeo (Do, Lam7, Sol/Si).
import { type Interval, IV, transposePc, transpose, intervalBetweenPc, sameInterval } from "./interval";
import { type Pitch, type PitchClass, type NamingStyle, parseNote, pcName, samePc, chroma, pitch, midi } from "./pitch";

export type ChordQuality =
  | "maj"
  | "min"
  | "dim"
  | "aug"
  | "sus2"
  | "sus4"
  | "5"
  | "6"
  | "m6"
  | "7"
  | "maj7"
  | "m7"
  | "m7b5"
  | "dim7"
  | "mMaj7"
  | "7sus4"
  | "add9"
  | "9"
  | "maj9"
  | "m9"
  | "7b9"
  | "7#9"
  | "11"
  | "m11"
  | "13";

export interface ChordDef {
  intervals: Interval[];
  /** Sufijo en cifrado americano. */
  us: string;
  /** Sufijo en cifrado latino. */
  eu: string;
  /** Alias aceptados al leer (además de us y eu). */
  aliases: string[];
  name: string;
}

const d = (ivs: string, us: string, eu: string, name: string, aliases: string[] = []): ChordDef => ({
  intervals: ivs.split(" ").map(IV),
  us,
  eu,
  name,
  aliases,
});

export const CHORDS: Record<ChordQuality, ChordDef> = {
  maj: d("P1 M3 P5", "", "", "mayor", ["M", "maj", "Maj"]),
  min: d("P1 m3 P5", "m", "m", "menor", ["-", "min", "mi"]),
  dim: d("P1 m3 d5", "dim", "dim", "disminuido", ["°", "o"]),
  aug: d("P1 M3 A5", "aug", "aum", "aumentado", ["+", "#5"]),
  sus2: d("P1 M2 P5", "sus2", "sus2", "con segunda suspendida", []),
  sus4: d("P1 P4 P5", "sus4", "sus4", "con cuarta suspendida", ["sus"]),
  "5": d("P1 P5", "5", "5", "quinta (power chord)", []),
  "6": d("P1 M3 P5 M6", "6", "6", "mayor con sexta", []),
  m6: d("P1 m3 P5 M6", "m6", "m6", "menor con sexta", ["-6"]),
  "7": d("P1 M3 P5 m7", "7", "7", "séptima de dominante", []),
  maj7: d("P1 M3 P5 M7", "maj7", "7M", "mayor con séptima mayor", ["M7", "Δ7", "Δ", "Maj7", "j7"]),
  m7: d("P1 m3 P5 m7", "m7", "m7", "menor con séptima", ["-7", "min7"]),
  m7b5: d("P1 m3 d5 m7", "m7b5", "m7(b5)", "semidisminuido", ["ø", "ø7", "m7(b5)", "-7b5"]),
  dim7: d("P1 m3 d5 d7", "dim7", "dim7", "disminuido con séptima", ["°7", "o7"]),
  mMaj7: d("P1 m3 P5 M7", "m(maj7)", "m7M", "menor con séptima mayor", ["mM7", "mmaj7", "m(M7)", "-maj7"]),
  "7sus4": d("P1 P4 P5 m7", "7sus4", "7sus4", "séptima con cuarta suspendida", ["7sus"]),
  add9: d("P1 M3 P5 M9", "add9", "add9", "mayor con novena agregada", ["(add9)", "add2"]),
  "9": d("P1 M3 P5 m7 M9", "9", "9", "novena de dominante", []),
  maj9: d("P1 M3 P5 M7 M9", "maj9", "9M", "mayor con novena (séptima mayor)", ["M9", "Δ9"]),
  m9: d("P1 m3 P5 m7 M9", "m9", "m9", "menor con novena", ["-9"]),
  "7b9": d("P1 M3 P5 m7 m9", "7b9", "7(b9)", "séptima con novena menor", ["7(b9)"]),
  "7#9": d("P1 M3 P5 m7 A9", "7#9", "7(#9)", "séptima con novena aumentada", ["7(#9)"]),
  "11": d("P1 P5 m7 M9 P11", "11", "11", "oncena", []),
  m11: d("P1 m3 P5 m7 M9 P11", "m11", "m11", "menor con oncena", ["-11"]),
  "13": d("P1 M3 P5 m7 M9 M13", "13", "13", "trecena", []),
};

export interface Chord {
  root: PitchClass;
  quality: ChordQuality;
  /** Bajo distinto de la fundamental (slash chord / inversión). */
  bass?: PitchClass;
}

export function chordPcs(c: Chord): PitchClass[] {
  return CHORDS[c.quality].intervals.map((iv) => transposePc(c.root, iv));
}

/** Alturas concretas en posición cerrada sobre una octava de partida. */
export function chordVoicing(c: Chord, octave = 4, inversion = 0): Pitch[] {
  const root: Pitch = { ...c.root, octave };
  let notes = CHORDS[c.quality].intervals.map((iv) => transpose(root, iv));
  for (let i = 0; i < inversion; i++) {
    const first = notes.shift()!;
    notes.push(transpose(first, IV("P8")));
  }
  if (c.bass && !samePc(c.bass, notes[0])) {
    let b: Pitch = { ...c.bass, octave: octave - 1 };
    while (midi(b) >= midi(notes[0])) b = pitch(b.letter, b.acc, b.octave - 1);
    while (midi(b) + 12 < midi(notes[0])) b = pitch(b.letter, b.acc, b.octave + 1);
    notes = [b, ...notes.filter((n) => !samePc(n, c.bass!))];
  }
  return notes;
}

const SUFFIX_TABLE: { suffix: string; q: ChordQuality }[] = (() => {
  const t: { suffix: string; q: ChordQuality }[] = [];
  for (const [q, def] of Object.entries(CHORDS) as [ChordQuality, ChordDef][]) {
    for (const s of new Set([def.us, def.eu, ...def.aliases])) t.push({ suffix: s, q });
  }
  // El más largo primero para que "m7b5" gane sobre "m".
  t.sort((a, b) => b.suffix.length - a.suffix.length);
  return t;
})();

function normalizeAcc(s: string): string {
  return s.replace(/♯/g, "#").replace(/♭/g, "b").replace(/\s+/g, "");
}

/** Lee un cifrado en cualquiera de las dos nomenclaturas. */
export function parseChord(input: string): Chord | null {
  const s = normalizeAcc(input);
  const slash = s.lastIndexOf("/");
  let main = s, bassStr: string | undefined;
  if (slash > 0) {
    main = s.slice(0, slash);
    bassStr = s.slice(slash + 1);
  }
  const rootM = /^(Do|Re|Mi|Fa|Sol|La|Si|[A-G])(##|bb|#|b)?/.exec(main);
  if (!rootM) return null;
  // "Sib" vs "Si" + "b"? El bemol siempre se interpreta como alteración.
  const rootParsed = parseNote(rootM[0]);
  if (!rootParsed) return null;
  let rest = main.slice(rootM[0].length);
  let quality: ChordQuality | null = null;
  if (rest === "") quality = "maj";
  else {
    for (const { suffix, q } of SUFFIX_TABLE) {
      if (suffix !== "" && rest === suffix) {
        quality = q;
        rest = "";
        break;
      }
    }
  }
  if (!quality) return null;
  const chord: Chord = { root: rootParsed.pc, quality };
  if (bassStr !== undefined) {
    const b = parseNote(bassStr);
    if (!b || b.octave !== undefined) return null;
    chord.bass = b.pc;
  }
  return chord;
}

export function C(sym: string): Chord {
  const c = parseChord(sym);
  if (!c) throw new Error(`Cifrado inválido: ${sym}`);
  return c;
}

export function chordSymbol(c: Chord, style: NamingStyle = "english"): string {
  const def = CHORDS[c.quality];
  const suffix = style === "english" ? def.us : def.eu;
  let s = pcName(c.root, style) + suffix.replace(/b(?=\d)/g, "♭").replace(/#(?=\d)/g, "♯");
  if (c.bass) s += "/" + pcName(c.bass, style);
  return s;
}

/** Clave estable: "C:maj", "F#:m7/A". */
export function chordKey(c: Chord): string {
  const r = (p: PitchClass) => "CDEFGAB"[p.letter] + (p.acc > 0 ? "#".repeat(p.acc) : "b".repeat(-p.acc));
  return `${r(c.root)}:${c.quality}${c.bass ? "/" + r(c.bass) : ""}`;
}

export function sameChord(a: Chord, b: Chord): boolean {
  return a.quality === b.quality && samePc(a.root, b.root) && ((!a.bass && !b.bass) || (!!a.bass && !!b.bass && samePc(a.bass, b.bass)));
}

/** Inversión indicada por el bajo: 0 = fundamental, 1 = 1ª, 2 = 2ª, 3 = 3ª, -1 = bajo ajeno al acorde. */
export function inversionOf(c: Chord): number {
  if (!c.bass) return 0;
  const pcs = chordPcs(c);
  const i = pcs.findIndex((p) => samePc(p, c.bass!));
  return i;
}

/** Reconoce un acorde a partir de clases de altura (la primera se toma como bajo). */
export function identifyChord(pcs: PitchClass[], qualities: ChordQuality[] = Object.keys(CHORDS) as ChordQuality[]): Chord | null {
  if (pcs.length === 0) return null;
  const bass = pcs[0];
  const set = new Set(pcs.map((p) => chroma(p)));
  for (const root of pcs) {
    for (const q of qualities) {
      const ivs = CHORDS[q].intervals;
      if (ivs.length !== set.size) continue;
      const cand = ivs.map((iv) => chroma(transposePc(root, iv)));
      if (cand.every((c) => set.has(c)) && cand.length === set.size) {
        const chord: Chord = { root, quality: q };
        if (!samePc(root, bass)) chord.bass = bass;
        return chord;
      }
    }
  }
  return null;
}

export function chordHasInterval(c: Chord, iv: Interval): boolean {
  return CHORDS[c.quality].intervals.some((x) => sameInterval(x, iv));
}

export function intervalFromRoot(c: Chord, p: PitchClass): Interval {
  return intervalBetweenPc(c.root, p);
}

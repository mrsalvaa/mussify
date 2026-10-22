// SPDX-License-Identifier: GPL-3.0-or-later
// Alturas con ortografía (letra + alteración + octava). La octava sigue la
// convención científica: Do4 = C4 = Do central = MIDI 60.

export type Letter = 0 | 1 | 2 | 3 | 4 | 5 | 6; // C D E F G A B
export type Accidental = -2 | -1 | 0 | 1 | 2;
export type NamingStyle = "latin" | "english";

export interface PitchClass {
  letter: Letter;
  acc: Accidental;
}

export interface Pitch extends PitchClass {
  octave: number;
}

export const LETTER_SEMITONES = [0, 2, 4, 5, 7, 9, 11] as const;
export const ENGLISH_LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
export const LATIN_LETTERS = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"] as const;

const ACC_SYMBOL: Record<number, string> = { [-2]: "𝄫", [-1]: "♭", 0: "", 1: "♯", 2: "𝄪" };
const ACC_ASCII: Record<number, string> = { [-2]: "bb", [-1]: "b", 0: "", 1: "#", 2: "##" };

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function pitch(letter: number, acc: number, octave: number): Pitch {
  return { letter: mod(letter, 7) as Letter, acc: acc as Accidental, octave };
}

export function pc(letter: number, acc = 0): PitchClass {
  return { letter: mod(letter, 7) as Letter, acc: acc as Accidental };
}

/** Número MIDI de una altura. */
export function midi(p: Pitch): number {
  return 12 * (p.octave + 1) + LETTER_SEMITONES[p.letter] + p.acc;
}

/** Clase de altura numérica 0..11 (C = 0). */
export function chroma(p: PitchClass): number {
  return mod(LETTER_SEMITONES[p.letter] + p.acc, 12);
}

/** Posición diatónica absoluta (C0 = 0, D0 = 1, ...). Útil para el pentagrama. */
export function diatonicIndex(p: Pitch): number {
  return p.octave * 7 + p.letter;
}

export function fromDiatonicIndex(idx: number, acc: number = 0): Pitch {
  return pitch(mod(idx, 7), acc, Math.floor(idx / 7));
}

export function samePitch(a: Pitch, b: Pitch): boolean {
  return a.letter === b.letter && a.acc === b.acc && a.octave === b.octave;
}

export function samePc(a: PitchClass, b: PitchClass): boolean {
  return a.letter === b.letter && a.acc === b.acc;
}

/** Ortografía por defecto de un número MIDI, prefiriendo sostenidos o bemoles. */
export function fromMidi(m: number, preferFlats = false): Pitch {
  const c = mod(m, 12);
  const octave = Math.floor(m / 12) - 1;
  const sharpMap: [number, number][] = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0]];
  const flatMap: [number, number][] = [[0, 0], [1, -1], [1, 0], [2, -1], [2, 0], [3, 0], [4, -1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0]];
  const [letter, acc] = (preferFlats ? flatMap : sharpMap)[c];
  return pitch(letter, acc, octave);
}

export function accidentalSymbol(acc: number, ascii = false): string {
  return (ascii ? ACC_ASCII : ACC_SYMBOL)[acc] ?? "";
}

export function pcName(p: PitchClass, style: NamingStyle = "latin", ascii = false): string {
  const base = style === "latin" ? LATIN_LETTERS[p.letter] : ENGLISH_LETTERS[p.letter];
  return base + accidentalSymbol(p.acc, ascii);
}

export function pitchName(p: Pitch, style: NamingStyle = "latin", ascii = false): string {
  return pcName(p, style, ascii) + p.octave;
}

/** Ambas nomenclaturas: "Do (C)". */
export function bothNames(p: PitchClass): string {
  return `${pcName(p, "latin")} (${pcName(p, "english")})`;
}

const LATIN_RE = /^(do|re|mi|fa|sol|la|si)/i;

/**
 * Interpreta un nombre de nota en cualquiera de las dos nomenclaturas:
 * "C#4", "Eb", "Do#4", "Solb3", "F♯", "Si𝄫".
 * Devuelve la clase y la octava si estaba presente.
 */
export function parseNote(s: string): { pc: PitchClass; octave?: number } | null {
  let str = s.trim();
  let letter: number;
  const lm = LATIN_RE.exec(str);
  if (lm) {
    letter = LATIN_LETTERS.findIndex((l) => l.toLowerCase() === lm[1].toLowerCase());
    str = str.slice(lm[1].length);
  } else {
    const ch = str.charAt(0).toUpperCase();
    letter = (ENGLISH_LETTERS as readonly string[]).indexOf(ch);
    if (letter < 0) return null;
    str = str.slice(1);
  }
  let acc = 0;
  const accRe = /^(##|bb|#|b|♯|♭|𝄪|𝄫|x)/;
  for (;;) {
    const m = accRe.exec(str);
    if (!m) break;
    const t = m[1];
    if (t === "##" || t === "𝄪" || t === "x") acc += 2;
    else if (t === "bb" || t === "𝄫") acc -= 2;
    else if (t === "#" || t === "♯") acc += 1;
    else acc -= 1;
    str = str.slice(t.length);
  }
  if (acc < -2 || acc > 2) return null;
  let octave: number | undefined;
  const om = /^(-?\d+)/.exec(str);
  if (om) {
    octave = parseInt(om[1], 10);
    str = str.slice(om[1].length);
  }
  if (str.length > 0) return null;
  return { pc: pc(letter, acc), octave };
}

export function parsePitch(s: string): Pitch | null {
  const r = parseNote(s);
  if (!r || r.octave === undefined) return null;
  return { ...r.pc, octave: r.octave };
}

/** Atajo para escribir alturas en el código: P("F#4"). Lanza si es inválida. */
export function P(s: string): Pitch {
  const p = parsePitch(s);
  if (!p) throw new Error(`Altura inválida: ${s}`);
  return p;
}

/** Frecuencia en Hz con la afinación de referencia dada (La4). */
export function frequency(m: number, a4 = 440): number {
  return a4 * Math.pow(2, (m - 69) / 12);
}

/** Identificador compacto en ASCII ("C#4"), útil como clave. */
export function pitchKey(p: Pitch): string {
  return ENGLISH_LETTERS[p.letter] + accidentalSymbol(p.acc, true) + p.octave;
}

export function pcKey(p: PitchClass): string {
  return ENGLISH_LETTERS[p.letter] + accidentalSymbol(p.acc, true);
}

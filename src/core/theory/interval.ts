// SPDX-License-Identifier: GPL-3.0-or-later
// Intervalos con tamaño diatónico y cualidad.
import { type Pitch, type PitchClass, LETTER_SEMITONES, diatonicIndex, fromDiatonicIndex, midi, mod, chroma, pc } from "./pitch";

/** P = justa, M = mayor, m = menor, A = aumentada, d = disminuida. */
export type Quality = "dd" | "d" | "m" | "P" | "M" | "A" | "AA";

export interface Interval {
  /** Tamaño diatónico: 1 = unísono, 2 = segunda, ... 8 = octava, 9 = novena... */
  size: number;
  quality: Quality;
}

/** Semitonos de los intervalos "base" (mayores o justos) para tamaños 1..7. */
const BASE_SEMIS = [0, 2, 4, 5, 7, 9, 11];
const PERFECT_SIZES = new Set([1, 4, 5]);

export function isPerfectSize(size: number): boolean {
  return PERFECT_SIZES.has(((size - 1) % 7) + 1);
}

export function semitones(iv: Interval): number {
  const simple = ((iv.size - 1) % 7) + 1;
  const octaves = Math.floor((iv.size - 1) / 7);
  let s = BASE_SEMIS[simple - 1] + 12 * octaves;
  const perfect = isPerfectSize(iv.size);
  switch (iv.quality) {
    case "P":
    case "M":
      break;
    case "m":
      s -= 1;
      break;
    case "A":
      s += 1;
      break;
    case "AA":
      s += 2;
      break;
    case "d":
      s -= perfect ? 1 : 2;
      break;
    case "dd":
      s -= perfect ? 2 : 3;
      break;
  }
  return s;
}

function qualityFromDelta(delta: number, perfect: boolean): Quality | null {
  if (perfect) {
    const map: Record<number, Quality> = { [-2]: "dd", [-1]: "d", 0: "P", 1: "A", 2: "AA" };
    return map[delta] ?? null;
  }
  const map: Record<number, Quality> = { [-3]: "dd", [-2]: "d", [-1]: "m", 0: "M", 1: "A", 2: "AA" };
  return map[delta] ?? null;
}

/** Intervalo ascendente entre dos alturas (si b < a se mide igual, en valor absoluto). */
export function intervalBetween(a: Pitch, b: Pitch): Interval {
  let lo = a, hi = b;
  if (diatonicIndex(b) < diatonicIndex(a) || (diatonicIndex(b) === diatonicIndex(a) && midi(b) < midi(a))) {
    lo = b;
    hi = a;
  }
  const size = diatonicIndex(hi) - diatonicIndex(lo) + 1;
  const actual = midi(hi) - midi(lo);
  const base = semitones({ size, quality: isPerfectSize(size) ? "P" : "M" });
  const q = qualityFromDelta(actual - base, isPerfectSize(size));
  if (!q) throw new Error("Intervalo fuera de rango");
  return { size, quality: q };
}

/** Intervalo ascendente entre dos clases de altura (dentro de una octava). */
export function intervalBetweenPc(a: PitchClass, b: PitchClass): Interval {
  const size = mod(b.letter - a.letter, 7) + 1;
  const actual = mod(chroma(b) - chroma(a), 12);
  const base = BASE_SEMIS[size - 1];
  let delta = actual - base;
  if (delta > 6) delta -= 12;
  if (delta < -6) delta += 12;
  const q = qualityFromDelta(delta, isPerfectSize(size));
  if (!q) throw new Error("Intervalo fuera de rango");
  return { size, quality: q };
}

export function transpose(p: Pitch, iv: Interval, down = false): Pitch {
  const dir = down ? -1 : 1;
  const target = diatonicIndex(p) + dir * (iv.size - 1);
  const natural = fromDiatonicIndex(target, 0);
  const wanted = midi(p) + dir * semitones(iv);
  const acc = wanted - midi(natural);
  return fromDiatonicIndex(target, acc);
}

export function transposePc(p: PitchClass, iv: Interval, down = false): PitchClass {
  const r = transpose({ ...p, octave: 4 }, iv, down);
  return pc(r.letter, r.acc);
}

/** Inversión de un intervalo simple (3M -> 6m, 4J -> 5J...). */
export function invert(iv: Interval): Interval {
  const simple = ((iv.size - 1) % 7) + 1;
  const size = simple === 1 ? 8 : simple === 8 ? 1 : 9 - simple;
  const inv: Record<Quality, Quality> = { P: "P", M: "m", m: "M", A: "d", d: "A", AA: "dd", dd: "AA" };
  return { size, quality: inv[iv.quality] };
}

export function sameInterval(a: Interval, b: Interval): boolean {
  return a.size === b.size && a.quality === b.quality;
}

// ---- Nombres en español ----

const SIZE_NAMES = ["", "unísono", "segunda", "tercera", "cuarta", "quinta", "sexta", "séptima", "octava", "novena", "décima", "oncena", "duodécima", "decimotercera", "decimocuarta", "doble octava"];
const QUALITY_NAMES: Record<Quality, string> = {
  P: "justa",
  M: "mayor",
  m: "menor",
  A: "aumentada",
  d: "disminuida",
  AA: "doble aumentada",
  dd: "doble disminuida",
};
const QUALITY_SHORT: Record<Quality, string> = { P: "J", M: "M", m: "m", A: "A", d: "d", AA: "AA", dd: "dd" };

export function intervalName(iv: Interval): string {
  const n = SIZE_NAMES[iv.size] ?? `${iv.size}ª`;
  if (iv.size === 1 && iv.quality === "P") return "unísono";
  if (iv.size === 8 && iv.quality === "P") return "octava justa";
  const q = QUALITY_NAMES[iv.quality];
  return iv.size === 1 ? `unísono ${q.replace(/a$/, "o")}` : `${n} ${q}`;
}

/** Abreviatura: "3M", "5J", "4A". */
export function intervalShort(iv: Interval): string {
  return `${iv.size}${QUALITY_SHORT[iv.quality]}`;
}

/** Clave estable para conceptos: "M3", "P5", "A4"... */
export function intervalKey(iv: Interval): string {
  return `${iv.quality}${iv.size}`;
}

export function parseIntervalKey(k: string): Interval {
  const m = /^(dd|AA|d|m|P|M|A)(\d+)$/.exec(k);
  if (!m) throw new Error(`Intervalo inválido: ${k}`);
  return { quality: m[1] as Quality, size: parseInt(m[2], 10) };
}

export const IV = (k: string): Interval => parseIntervalKey(k);

/** Los intervalos simples en el orden pedagógico usual (de semitonos). */
export const SIMPLE_INTERVALS = ["m2", "M2", "m3", "M3", "P4", "A4", "d5", "P5", "m6", "M6", "m7", "M7", "P8"].map(IV);

export function semitonesOfLetterDistance(fromLetter: number, steps: number): number {
  const to = fromLetter + steps;
  return LETTER_SEMITONES[mod(to, 7)] + 12 * Math.floor(to / 7) - LETTER_SEMITONES[fromLetter];
}

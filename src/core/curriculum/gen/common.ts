// SPDX-License-Identifier: GPL-3.0-or-later
// Utilidades compartidas por los generadores: qué material concreto habilita lo que se sabe.
import { type Pitch, type PitchClass, P, pc, midi, samePc, chroma } from "../../theory/pitch";
import { type Interval, SIMPLE_INTERVALS } from "../../theory/interval";
import { type ChordQuality, CHORDS } from "../../theory/chord";
import type { BaseDuration, Duration, TimeSignature } from "../../theory/rhythm";
import { keyFromFifths, type Key } from "../../theory/key";
import type { ScaleType } from "../../theory/scale";
import type { ConceptId, Exercise, GenContext, Label, Msg, Answer, Prompt } from "../types";
import { TREBLE_NOTES, BASS_NOTES, intervalConcept, QUALITY_CONCEPT, readingConcept } from "../extract";
import type { Rng } from "../../random";

export const msg = (key: string, params?: Msg["params"]): Msg => ({ key, params });
export const L = {
  text: (text: string): Label => ({ kind: "text", text }),
  msg: (key: string, params?: Msg["params"]): Label => ({ kind: "msg", msg: { key, params } }),
  pc: (p: PitchClass): Label => ({ kind: "pc", pc: { letter: p.letter, acc: p.acc } }),
  pitch: (p: Pitch): Label => ({ kind: "pitch", pitch: p }),
  num: (n: number): Label => ({ kind: "number", n }),
  iv: (iv: Interval, short = false): Label => ({ kind: "interval", iv, short }),
};

export interface Generator {
  /** Conceptos que siempre usa (vocabulario de la consigna, tipo de material). */
  requires: ConceptId[];
  /** ¿Hay material suficiente con lo que se sabe? */
  canRun: (ctx: GenContext, params: Record<string, unknown>) => boolean;
  make: (ctx: GenContext, params: Record<string, unknown>) => Omit<Exercise, "id" | "generator">;
}

export function has(ctx: GenContext, c: ConceptId): boolean {
  return ctx.known.has(c);
}

// ---- Material de lectura ----

const TREBLE_HIGH = ["A5", "B5", "C6"];
const TREBLE_LOW = ["B3", "A3", "G3"];
const BASS_HIGH = ["D4", "E4"];
const BASS_LOW = ["D2", "C2"];

export function readableNotes(known: ReadonlySet<ConceptId>, clef: "treble" | "bass"): Pitch[] {
  const out: Pitch[] = [];
  const base = clef === "treble" ? TREBLE_NOTES : BASS_NOTES;
  for (const n of base) if (known.has(`read.${clef}.${n}`)) out.push(P(n));
  if (known.has(`read.${clef}.high`)) for (const n of clef === "treble" ? TREBLE_HIGH : BASS_HIGH) out.push(P(n));
  if (known.has(`read.${clef}.low`)) for (const n of clef === "treble" ? TREBLE_LOW : BASS_LOW) out.push(P(n));
  return out.sort((a, b) => midi(a) - midi(b));
}

export function knownAccidentals(known: ReadonlySet<ConceptId>): number[] {
  const out = [0];
  if (known.has("acc.sharp")) out.push(1);
  if (known.has("acc.flat")) out.push(-1);
  return out;
}

/** Clases de altura nombrables (naturales y, si se saben, con alteraciones simples). */
export function nameablePcs(known: ReadonlySet<ConceptId>): PitchClass[] {
  const out: PitchClass[] = [];
  for (const acc of knownAccidentals(known)) for (let l = 0; l < 7; l++) out.push(pc(l, acc));
  return out;
}

/** Alturas legibles incluyendo alteraciones conocidas. */
export function readablePitches(known: ReadonlySet<ConceptId>, clef: "treble" | "bass"): Pitch[] {
  const nat = readableNotes(known, clef);
  const out: Pitch[] = [];
  for (const p of nat) for (const acc of knownAccidentals(known)) out.push({ ...p, acc: acc as Pitch["acc"] });
  return out;
}

export function readingClefs(known: ReadonlySet<ConceptId>): ("treble" | "bass")[] {
  const out: ("treble" | "bass")[] = [];
  if (known.has("clef.treble") && readableNotes(known, "treble").length) out.push("treble");
  if (known.has("clef.bass") && readableNotes(known, "bass").length) out.push("bass");
  return out;
}

// ---- Ritmo ----

export function knownFigures(known: ReadonlySet<ConceptId>): BaseDuration[] {
  return (["w", "h", "q", "8", "16", "32"] as BaseDuration[]).filter((b) => known.has(`rh.${b}`));
}

export function knownRests(known: ReadonlySet<ConceptId>): BaseDuration[] {
  return (["w", "h", "q", "8", "16", "32"] as BaseDuration[]).filter((b) => known.has(`rest.${b}`));
}

export const ALL_TIME_SIGS: TimeSignature[] = [
  { num: 4, den: 4 },
  { num: 3, den: 4 },
  { num: 2, den: 4 },
  { num: 6, den: 8 },
  { num: 12, den: 8 },
  { num: 9, den: 8 },
  { num: 5, den: 4 },
  { num: 7, den: 8 },
  { num: 2, den: 2 },
];

export function knownTimeSigs(known: ReadonlySet<ConceptId>): TimeSignature[] {
  return ALL_TIME_SIGS.filter((t) => known.has(`ts.${t.num}/${t.den}`));
}

/** Duraciones disponibles (con puntillo si se sabe). */
export function knownDurations(known: ReadonlySet<ConceptId>): Duration[] {
  const out: Duration[] = knownFigures(known).map((b) => ({ base: b }));
  if (known.has("rh.dot")) for (const b of knownFigures(known)) if (b !== "32" && known.has(`rh.${nextShorter(b)}`)) out.push({ base: b, dots: 1 });
  return out;
}

export function nextShorter(b: BaseDuration): BaseDuration {
  const order: BaseDuration[] = ["w", "h", "q", "8", "16", "32"];
  return order[Math.min(order.length - 1, order.indexOf(b) + 1)];
}

// ---- Intervalos, acordes, escalas, tonalidades ----

export function knownIntervals(known: ReadonlySet<ConceptId>): Interval[] {
  const out = SIMPLE_INTERVALS.filter((iv) => known.has(intervalConcept(iv)));
  // Tritono: una sola forma para no confundir (4A); 5d se suma con acc.double/ortografía avanzada.
  return out.filter((iv) => !(iv.size === 5 && iv.quality === "d"));
}

export const QUALITY_ORDER: ChordQuality[] = ["maj", "min", "dim", "aug", "sus4", "sus2", "5", "7", "maj7", "m7", "m7b5", "dim7", "6", "m6", "add9", "9", "m9", "maj9"];

export function knownQualities(known: ReadonlySet<ConceptId>): ChordQuality[] {
  return QUALITY_ORDER.filter((q) => known.has(QUALITY_CONCEPT[q]) && CHORDS[q]);
}

/** Tonalidades mayores cuya armadura se conoce (Do siempre que se sepa la escala mayor). */
export function knownMajorFifths(known: ReadonlySet<ConceptId>): number[] {
  if (!known.has("sc.major")) return [];
  const out = [0];
  for (const f of [1, -1, 2, -2, 3, -3, 4, -4]) if (known.has(`ks.${f}`)) out.push(f);
  if (known.has("ks.far")) out.push(5, -5, 6, -6, 7, -7);
  return out;
}

export function knownKeys(known: ReadonlySet<ConceptId>): Key[] {
  const out: Key[] = knownMajorFifths(known).map((f) => keyFromFifths(f, "major"));
  if (known.has("sc.minor") && known.has("t.relative")) for (const f of knownMajorFifths(known)) out.push(keyFromFifths(f, "minor"));
  return out;
}

/** Para escribir tónicas sin alteraciones desconocidas. */
export function keyIsNameable(k: Key, known: ReadonlySet<ConceptId>): boolean {
  return k.tonic.acc === 0 || (k.tonic.acc === 1 && known.has("acc.sharp")) || (k.tonic.acc === -1 && known.has("acc.flat"));
}

export const SCALE_CONCEPT: Partial<Record<ScaleType, ConceptId>> = {
  major: "sc.major",
  minor: "sc.minor",
  harmonicMinor: "sc.harmonicMinor",
  melodicMinor: "sc.melodicMinor",
  majorPentatonic: "sc.pentMajor",
  minorPentatonic: "sc.pentMinor",
  blues: "sc.blues",
  dorian: "mode.dorian",
  phrygian: "mode.phrygian",
  lydian: "mode.lydian",
  mixolydian: "mode.mixolydian",
  locrian: "mode.locrian",
  ionian: "mode.intro",
  aeolian: "mode.intro",
};

export function knownScales(known: ReadonlySet<ConceptId>): ScaleType[] {
  return (Object.keys(SCALE_CONCEPT) as ScaleType[]).filter((s) => known.has(SCALE_CONCEPT[s]!));
}

// ---- Selección ponderada con foco ----

/**
 * Elige un ítem priorizando el foco de la lección (si es uno de los ítems)
 * y luego lo que más se falla.
 */
export function pickFocused<T>(ctx: GenContext, items: readonly T[], itemConcept: (x: T) => ConceptId, focusShare = 0.5): T {
  const focusItems = items.filter((x) => itemConcept(x) === ctx.focus);
  if (focusItems.length && ctx.rng.bool(focusShare)) return ctx.rng.pick(focusItems);
  return ctx.rng.weighted(items, (x) => ctx.weight(itemConcept(x)) * (itemConcept(x) === ctx.focus ? 2 : 1));
}

/** Arma opciones de elección múltiple con la correcta en una posición al azar. */
export function choice(rng: Rng, correct: Label, distractors: Label[], max = 4): Answer & { kind: "choice" } {
  const uniq: Label[] = [];
  const seen = new Set<string>([JSON.stringify(correct)]);
  for (const d of rng.shuffle(distractors)) {
    const k = JSON.stringify(d);
    if (!seen.has(k)) {
      seen.add(k);
      uniq.push(d);
    }
  }
  const opts = uniq.slice(0, max - 1);
  const pos = rng.int(0, opts.length);
  opts.splice(pos, 0, correct);
  return { kind: "choice", options: opts, correct: pos };
}

export function pcLabelConcepts(p: PitchClass): ConceptId[] {
  const out: ConceptId[] = ["t.notes"];
  if (p.acc === 1) out.push("acc.sharp");
  if (p.acc === -1) out.push("acc.flat");
  if (Math.abs(p.acc) === 2) out.push("acc.double");
  return out;
}

export function readingUses(p: Pitch, clef: "treble" | "bass"): ConceptId[] {
  const out = [`clef.${clef}`, "t.staff", readingConcept(p, clef)];
  if (p.acc === 1) out.push("acc.sharp");
  if (p.acc === -1) out.push("acc.flat");
  return out;
}

export function uniqPcs(ps: PitchClass[]): PitchClass[] {
  const out: PitchClass[] = [];
  for (const p of ps) if (!out.some((q) => samePc(q, p))) out.push(p);
  return out;
}

export function sameChromaDifferentName(a: PitchClass, b: PitchClass): boolean {
  return chroma(a) === chroma(b) && !samePc(a, b);
}

export function basePrompt(key: string, params?: Msg["params"], extra: Partial<Prompt> = {}): Prompt {
  return { text: msg(key, params), ...extra };
}

/** Rango de teclado razonable para mostrar ciertas alturas. */
export function keyboardRange(ps: Pitch[], minSpan = 12): { from: number; to: number } {
  const ms = ps.map(midi);
  let from = Math.min(...ms, 60), to = Math.max(...ms, 71);
  from = Math.floor(from / 12) * 12;
  to = Math.max(to, from + minSpan - 1);
  to = Math.ceil((to + 1) / 12) * 12 - 1;
  return { from, to };
}

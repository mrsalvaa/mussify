// SPDX-License-Identifier: GPL-3.0-or-later
// Extracción de conceptos: qué hay que saber para entender una partitura, un acorde, etc.
// Es independiente de los generadores: los tests la usan para auditar lo que se muestra.
import { type Pitch, ENGLISH_LETTERS, diatonicIndex, P } from "../theory/pitch";
import { type Chord, type ChordQuality, parseChord } from "../theory/chord";
import { type Interval, intervalKey } from "../theory/interval";
import { DRUMS } from "../instruments/drums";
import { type Tuning, GUITAR_TUNINGS, BASS_TUNINGS, pitchAt, shapesForChord } from "../instruments/fretted";
import type { Score, Staff } from "../notation/score";
import { signatureAccFor } from "../theory/key";
import type { ConceptId, Requirement } from "./types";

// ---- Lectura de notas en el pentagrama ----

/** Notas con concepto propio en clave de Sol (el resto se agrupa en "agudas"/"graves"). */
export const TREBLE_NOTES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5"];
export const BASS_NOTES = ["E2", "F2", "G2", "A2", "B2", "C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"];

function naturalKey(p: Pitch): string {
  return ENGLISH_LETTERS[p.letter] + p.octave;
}

/** Concepto de lectura de una altura en una clave (sin contar la alteración). */
export function readingConcept(p: Pitch, clef: Staff["clef"], octaveShift = 0): ConceptId {
  const written: Pitch = { ...p, octave: p.octave + octaveShift };
  const k = naturalKey(written);
  const di = diatonicIndex({ ...written, acc: 0 });
  if (clef === "treble") {
    if (TREBLE_NOTES.includes(k)) return `read.treble.${k}`;
    return di > diatonicIndex(P("G5")) ? "read.treble.high" : "read.treble.low";
  }
  if (clef === "bass") {
    if (BASS_NOTES.includes(k)) return `read.bass.${k}`;
    return di > diatonicIndex(P("C4")) ? "read.bass.high" : "read.bass.low";
  }
  return clef === "alto" ? "clef.alto" : "clef.tenor";
}

export function accidentalConcept(acc: number): ConceptId | null {
  return acc === 1 ? "acc.sharp" : acc === -1 ? "acc.flat" : acc === 2 || acc === -2 ? "acc.double" : null;
}

export function keySigConcept(fifths: number): ConceptId | null {
  if (fifths === 0) return null;
  if (Math.abs(fifths) >= 5) return "ks.far";
  return `ks.${fifths}`;
}

export function timeSigConcept(num: number, den: number): ConceptId {
  const known = ["4/4", "3/4", "2/4", "6/8", "12/8", "9/8", "5/4", "7/8", "2/2"];
  const k = `${num}/${den}`;
  return known.includes(k) ? `ts.${k}` : "ts.odd";
}

export function figureConcept(base: string, isRest: boolean): ConceptId {
  return `${isRest ? "rest" : "rh"}.${base}`;
}

// ---- Acordes ----

/** Familia teórica de la cualidad del acorde (el concepto que la enseña). */
export const QUALITY_CONCEPT: Record<ChordQuality, ConceptId> = {
  maj: "ch.maj",
  min: "ch.min",
  dim: "ch.dim",
  aug: "ch.aug",
  sus2: "ch.sus",
  sus4: "ch.sus",
  "5": "ch.5",
  "6": "ch.6",
  m6: "ch.6",
  "7": "ch.7",
  maj7: "ch.maj7",
  m7: "ch.m7",
  m7b5: "ch.m7b5",
  dim7: "ch.dim7",
  mMaj7: "ch.ext",
  "7sus4": "ch.sus",
  add9: "ch.add9",
  "9": "ch.ext",
  maj9: "ch.ext",
  m9: "ch.ext",
  "7b9": "ch.ext",
  "7#9": "ch.ext",
  "11": "ch.ext",
  m11: "ch.ext",
  "13": "ch.ext",
};

/** Requisitos para entender un acorde en teoría (cualidad, cifrado, alteraciones, bajo). */
export function chordTheoryRequirements(c: Chord): Requirement[] {
  const req: Requirement[] = [{ anyOf: [QUALITY_CONCEPT[c.quality]] }];
  const acc = accidentalConcept(c.root.acc);
  if (acc) req.push({ anyOf: [acc] });
  if (c.bass) {
    req.push({ anyOf: ["ch.slash"] });
    const b = accidentalConcept(c.bass.acc);
    if (b) req.push({ anyOf: [b] });
  }
  return req;
}

/** Requisitos para tocar un acorde en la guitarra: alguna de sus formas. */
export function guitarChordRequirements(c: Chord): Requirement[] {
  const shapes = shapesForChord({ root: c.root, quality: c.quality });
  const req: Requirement[] = [{ anyOf: shapes.length ? [...new Set(shapes.map((s) => s.concept))] : ["gt.unsupported"], what: "chord" }];
  if (c.bass) req.push({ anyOf: ["gt.slash"] });
  return req;
}

/** Requisitos para tocar un acorde en el piano. */
export function pianoChordRequirements(c: Chord): Requirement[] {
  const req: Requirement[] = [];
  const q = c.quality;
  if (q === "maj") req.push({ anyOf: ["pn.ch.maj"] });
  else if (q === "min") req.push({ anyOf: ["pn.ch.min"] });
  else if (q === "dim" || q === "aug") req.push({ anyOf: ["pn.ch.dimaug"] });
  else if (q === "5") req.push({ anyOf: ["pn.ch.maj"] });
  else if (q === "sus2" || q === "sus4") req.push({ anyOf: ["pn.ch.sus"] });
  else req.push({ anyOf: ["pn.ch.7"] });
  req.push({ anyOf: [QUALITY_CONCEPT[q]] });
  if (c.root.acc !== 0) req.push({ anyOf: ["pn.black"] });
  if (c.bass) req.push({ anyOf: ["pn.inv"] });
  return req;
}

/** Requisitos para el bajo: tocar la fundamental (o el bajo indicado). */
export function bassChordRequirements(c: Chord): Requirement[] {
  const req: Requirement[] = [{ anyOf: ["bs.root"] }];
  const target = c.bass ?? c.root;
  if (target.acc !== 0) req.push({ anyOf: ["bs.chromatic"] });
  return req;
}

export function intervalConcept(iv: Interval): ConceptId {
  const k = intervalKey(iv);
  if (k === "A4" || k === "d5") return "iv.TT";
  if (k === "P1") return "t.notes";
  return `iv.${k}`;
}

// ---- Instrumentos con trastes ----

/** Concepto para una posición del diapasón. */
export function fretConcept(instrument: "guitar" | "bass", tuning: Tuning, string: number, fret: number): ConceptId {
  const pre = instrument === "guitar" ? "gt" : "bs";
  const p = pitchAt(tuning, string, fret);
  if (string > (instrument === "guitar" ? 6 : 4)) return `${pre}.str5`;
  if (fret === 0) return `${pre}.str.${string}`;
  if (fret <= 4) return p.acc === 0 ? `${pre}.pos.${string}.${fret}` : `${pre}.chromatic`;
  if (fret <= 9) return `${pre}.zone.5`;
  return `${pre}.zone.10`;
}

function tuningOf(staff: Staff): Tuning {
  const all = staff.instrument === "bass" ? BASS_TUNINGS : GUITAR_TUNINGS;
  if (!staff.tuning) return all[0];
  const k = staff.tuning.map((p) => p.letter * 100 + p.acc * 10 + p.octave).join(",");
  return all.find((t) => t.strings.map((p) => p.letter * 100 + p.acc * 10 + p.octave).join(",") === k) ?? { id: "custom", name: "", strings: staff.tuning };
}

// ---- Partituras completas ----

/** Todos los requisitos de una partitura, para el contexto del instrumento indicado. */
export function scoreRequirements(score: Score): Requirement[] {
  const set = new Set<ConceptId>();
  const reqs: Requirement[] = [];
  const add = (c: ConceptId | null) => {
    if (c) set.add(c);
  };
  for (const staff of score.staves) {
    const hasStaff = staff.showStaff !== false && !score.rhythmOnly;
    const rhythmLine = !!score.rhythmOnly;
    const isDrums = staff.instrument === "drums" || staff.clef === "percussion";
    const shift = staff.instrument === "guitar" || staff.instrument === "bass" ? 1 : 0;
    const tuning = staff.showTab ? tuningOf(staff) : null;
    if (hasStaff) {
      add("t.staff");
      if (!score.hideClef) add(isDrums ? "clef.percussion" : `clef.${staff.clef}`);
      if (!isDrums) add(keySigConcept(score.keyFifths));
      if (!score.hideTimeSig && !score.freeNotes) add(timeSigConcept(score.timeSig.num, score.timeSig.den));
      if (shift && !isDrums) add("t.octaveClef");
    }
    if (tuning) add(staff.instrument === "bass" ? "bs.tab" : "gt.tab");
    if (rhythmLine && !score.hideTimeSig && !score.freeNotes) add(timeSigConcept(score.timeSig.num, score.timeSig.den));
    let key = score.keyFifths;
    for (const m of staff.measures) {
      if (m.keyFifths !== undefined) {
        key = m.keyFifths;
        if (hasStaff && !isDrums) add(keySigConcept(key));
      }
      if (m.timeSig && (hasStaff || rhythmLine) && !score.hideTimeSig) add(timeSigConcept(m.timeSig.num, m.timeSig.den));
      const accState = new Map<string, number>();
      let prevTie = false;
      for (const e of m.events) {
        const isRest = e.notes.length === 0;
        // En notas sueltas, las redondas se leen como "una nota" sin valor rítmico;
        // cualquier otra figura sí muestra ritmo.
        const freeButRhythmic = !!score.freeNotes && (e.duration.base !== "w" || !!e.duration.dots || isRest);
        const showsRhythm = (!score.freeNotes || freeButRhythmic) && (hasStaff || rhythmLine || (tuning !== null && !isRest));
        if (showsRhythm && (hasStaff || rhythmLine || !isRest)) add(figureConcept(e.duration.base, isRest));
        if (showsRhythm && e.duration.dots) add(e.duration.dots === 1 ? "rh.dot" : "rh.ddot");
        if (showsRhythm && e.duration.tuplet) add(e.duration.tuplet.n === 3 ? "rh.triplet" : "rh.tuplet");
        if (e.chord) {
          const c = parseChord(e.chord);
          if (c) for (const r of chordTheoryRequirements(c)) reqs.push(r);
          else add("ch.ext");
        }
        if (e.notes.length > 1 && !isDrums && hasStaff) add("t.harmonic");
        let tieHere = false;
        for (const n of e.notes) {
          if (n.tie) tieHere = true;
          if (n.drum) {
            add("clef.percussion");
            add(DRUMS[n.drum].concept);
            continue;
          }
          if (n.pitch && hasStaff && !isDrums && !score.hideClef) {
            add(readingConcept(n.pitch, staff.clef, shift));
            const k = `${n.pitch.letter}${n.pitch.octave}`;
            const cur = accState.has(k) ? accState.get(k)! : signatureAccFor(key, n.pitch.letter);
            if (cur !== n.pitch.acc) {
              accState.set(k, n.pitch.acc);
              add(n.pitch.acc === 0 ? "acc.natural" : accidentalConcept(n.pitch.acc));
            }
          }
          if (n.tab && tuning) add(fretConcept(staff.instrument === "bass" ? "bass" : "guitar", tuning, n.tab.string, n.tab.fret));
        }
        if ((tieHere || prevTie) && showsRhythm) add("rh.tie");
        prevTie = tieHere;
      }
    }
  }
  for (const c of set) reqs.push({ anyOf: [c] });
  return dedupe(reqs);
}

export function dedupe(reqs: Requirement[]): Requirement[] {
  const seen = new Set<string>();
  return reqs.filter((r) => {
    const k = [...r.anyOf].sort().join("|");
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function satisfied(r: Requirement, known: ReadonlySet<ConceptId>): boolean {
  return r.anyOf.some((c) => known.has(c));
}

export function missing(reqs: Requirement[], known: ReadonlySet<ConceptId>): Requirement[] {
  return reqs.filter((r) => !satisfied(r, known));
}

/** Conceptos simples (sin alternativas) de una lista de requisitos. */
export function flatConcepts(reqs: Requirement[]): ConceptId[] {
  return reqs.flatMap((r) => r.anyOf);
}

// SPDX-License-Identifier: GPL-3.0-or-later
// Fichas de canciones: análisis original (sin material con derechos), disponibilidad
// progresiva por secciones y ejercicios generados a partir de la canción.
import { parseChord, type Chord, chordVoicing } from "../theory/chord";
import { IV, semitones, type Interval } from "../theory/interval";
import { fromMidi, chroma } from "../theory/pitch";
import { chordsSequence, notesSequence } from "../notation/playback";
import type { InstrumentId } from "../notation/score";
import { Rng } from "../random";
import { guitarChordRequirements, pianoChordRequirements, bassChordRequirements, intervalConcept, missing, dedupe, timeSigConcept } from "../curriculum/extract";
import { chordLabelOk } from "../curriculum/audit";
import type { ConceptId, Exercise, Label, Requirement } from "../curriculum/types";
import { L, msg, choice } from "../curriculum/gen/common";
import type { Curriculum } from "../curriculum/engine";

export interface SongSection {
  id: string;
  name: string;
  /** Progresión de acordes (cifrado americano). */
  chords: string[];
  /** Grados (texto de análisis). */
  roman?: string;
  /** Qué tiene de interesante (texto original). */
  notes?: string;
  /** Conceptos extra que hacen falta para esta sección (técnicas, grooves...). */
  requires?: ConceptId[];
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  year: number;
  instrument: InstrumentId;
  /** Nivel orientativo 1..5. */
  level: number;
  key: string;
  keyConcepts: ConceptId[];
  tempo: number;
  timeSig: string;
  structure: string[];
  sections: SongSection[];
  /** Descripción original del riff o recurso principal. */
  riff: string;
  /** Intervalos característicos del riff (para ejercicios de oído). */
  riffIntervals?: string[];
  scales: { name: string; concept: ConceptId }[];
  /** Lecciones de teoría que explican por qué suena así. */
  theory: { concept: ConceptId; why: string }[];
  curiosity?: string;
  /** Requisitos generales (ritmo, compás, técnica). */
  requires: ConceptId[];
}

export function sectionRequirements(song: Song, s: SongSection): Requirement[] {
  const reqs: Requirement[] = [];
  for (const sym of s.chords) {
    const c = parseChord(sym);
    if (!c) continue;
    if (song.instrument === "guitar") reqs.push(...guitarChordRequirements(c));
    else if (song.instrument === "piano") reqs.push(...pianoChordRequirements(c));
    else if (song.instrument === "bass") reqs.push(...bassChordRequirements(c));
  }
  for (const r of s.requires ?? []) reqs.push({ anyOf: [r] });
  return dedupe(reqs);
}

export function songRequirements(song: Song): Requirement[] {
  const reqs: Requirement[] = song.requires.map((r) => ({ anyOf: [r] }));
  reqs.push({ anyOf: [timeSigConcept(...(song.timeSig.split("/").map(Number) as [number, number]))] });
  for (const s of song.sections) reqs.push(...sectionRequirements(song, s));
  return dedupe(reqs);
}

export interface SongStatus {
  available: boolean;
  /** Secciones disponibles (todo lo que usan ya se sabe). */
  sections: { section: SongSection; available: boolean; missing: Requirement[] }[];
  missing: Requirement[];
  /** Camino de lecciones hasta poder tocarla entera. */
  path: string[];
}

/** Elige, de cada requisito con alternativas, el concepto más cercano en el camino. */
function cheapestTargets(cur: Curriculum, reqs: Requirement[], known: ReadonlySet<ConceptId>): ConceptId[] {
  return reqs.map((r) => {
    const opts = r.anyOf.filter((c) => cur.byConcept.has(c));
    if (!opts.length) return r.anyOf[0];
    return opts.sort((a, b) => cur.pathTo([a], known).length - cur.pathTo([b], known).length)[0];
  });
}

export function songStatus(cur: Curriculum, song: Song, known: ReadonlySet<ConceptId>): SongStatus {
  const sections = song.sections.map((section) => {
    const m = missing([...sectionRequirements(song, section), ...song.requires.map((r) => ({ anyOf: [r] }))], known);
    return { section, available: m.length === 0, missing: m };
  });
  const all = missing(songRequirements(song), known);
  const path = cur.pathTo(cheapestTargets(cur, all, known), known).map((l) => l.id);
  return { available: all.length === 0, sections, missing: all, path };
}

/** ¿Se puede mostrar un dato de la ficha? (solo si se conoce el concepto) */
export function canShow(concepts: ConceptId[], known: ReadonlySet<ConceptId>): boolean {
  return concepts.every((c) => known.has(c));
}

// ---------------------------------------------------------------------------
// Ejercicios a partir de la canción (solo con lo que se sabe)

function voiced(c: Chord) {
  return [fromMidi(48 + chroma(c.bass ?? c.root)), ...chordVoicing({ root: c.root, quality: c.quality }, 4)];
}

export function songExercises(song: Song, known: ReadonlySet<ConceptId>, seed: number, count = 8): Exercise[] {
  const rng = new Rng(seed);
  const out: Exercise[] = [];
  const availableSections = song.sections.filter((s) => missing([...sectionRequirements(song, s), ...song.requires.map((r) => ({ anyOf: [r] }))], known).length === 0);
  const knownChords = (s: SongSection) => s.chords.map((x) => parseChord(x)!).filter((c) => c && chordLabelOk(c, known));
  const lab = (c: Chord): Label => ({ kind: "chord", chord: c });
  for (let i = 0; i < count * 4 && out.length < count; i++) {
    const kind = rng.pick(["complete", "hear", "riff"]);
    if (kind === "riff" && song.riffIntervals?.length) {
      const ivs = song.riffIntervals.map(IV).filter((iv) => known.has(intervalConcept(iv)));
      if (!ivs.length || !known.has("t.interval")) continue;
      const iv: Interval = rng.pick(ivs);
      const root = rng.int(52, 62);
      const others = ["m2", "M2", "m3", "M3", "P4", "P5", "m6", "M6", "m7", "P8"].map(IV).filter((x) => known.has(intervalConcept(x)) && semitones(x) !== semitones(iv));
      if (!others.length) continue;
      out.push({
        id: `song:${song.id}#${i}`,
        generator: "songRiffInterval",
        prompt: { text: msg("ex.song.riffInterval", { song: L.text(song.title) }), audio: notesSequence([fromMidi(root), fromMidi(root + semitones(iv))], { instrument: song.instrument === "bass" ? "bass" : song.instrument === "guitar" ? "guitar" : "piano" }), autoplay: true },
        answer: choice(rng, L.iv(iv), others.map((x) => L.iv(x))),
        targets: [intervalConcept(iv)],
        uses: ["t.interval", ...others.map(intervalConcept), intervalConcept(iv)],
        item: `song.${song.id}.riff`,
      });
      continue;
    }
    if (!availableSections.length || song.instrument === "drums") continue;
    const sec = rng.pick(availableSections);
    const chords = knownChords(sec);
    if (chords.length < 2) continue;
    const distinct = chords.filter((c, idx) => chords.findIndex((d) => JSON.stringify(d) === JSON.stringify(c)) === idx);
    if (kind === "complete") {
      const hole = rng.int(0, chords.length - 1);
      const items: Label[] = chords.map((c, idx) => (idx === hole ? L.text("?") : lab(c)));
      const others = distinct.filter((c) => JSON.stringify(c) !== JSON.stringify(chords[hole]));
      if (!others.length) continue;
      out.push({
        id: `song:${song.id}#${i}`,
        generator: "songComplete",
        prompt: { text: msg("ex.song.complete", { section: L.text(sec.name) }), big: { kind: "names", items }, audio: chordsSequence(chords.map(voiced), { length: 1.1 }) },
        answer: choice(rng, lab(chords[hole]), others.map(lab)),
        targets: [],
        uses: [],
        item: `song.${song.id}.complete`,
      });
    } else {
      if (distinct.length < 2) continue;
      const c = rng.pick(distinct);
      out.push({
        id: `song:${song.id}#${i}`,
        generator: "songHear",
        prompt: { text: msg("ex.song.hear", { section: L.text(sec.name) }), audio: chordsSequence([voiced(c)], { length: 2 }), autoplay: true },
        answer: choice(rng, lab(c), distinct.filter((d) => d !== c).map(lab)),
        targets: [],
        uses: [],
        item: `song.${song.id}.hear`,
      });
    }
  }
  return out;
}

export function chordsOf(song: Song): Chord[] {
  return song.sections.flatMap((s) => s.chords.map((c) => parseChord(c)!)).filter(Boolean);
}

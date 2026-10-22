// SPDX-License-Identifier: GPL-3.0-or-later
// Conversión de partituras y elementos teóricos a eventos de sonido con tiempos absolutos.
import type { Pitch } from "../theory/pitch";
import { midi } from "../theory/pitch";
import { DRUMS } from "../instruments/drums";
import { type Score, eventValue } from "./score";
import { Frac } from "../theory/rhythm";

export type SoundInstrument = "piano" | "guitar" | "guitarDist" | "bass" | "drums" | "click";

export interface SoundEvent {
  /** Segundos desde el inicio. */
  time: number;
  duration: number;
  /** Nota MIDI (en batería, la nota GM). */
  note: number;
  velocity: number; // 0..1
  instrument: SoundInstrument;
}

export interface CursorMark {
  time: number;
  staff: number;
  measure: number;
  event: number;
}

export interface Sequence {
  events: SoundEvent[];
  cursor: CursorMark[];
  duration: number;
  /** Inicio (en segundos) de cada compás del primer pentagrama. */
  measureStarts: number[];
}

export function instrumentSound(instr: string): SoundInstrument {
  if (instr === "guitar") return "guitar";
  if (instr === "bass") return "bass";
  if (instr === "drums") return "drums";
  return "piano";
}

/** Convierte una partitura en eventos con tiempos, respetando ligaduras. */
export function scoreToSequence(score: Score, opts: { tempo?: number; fromMeasure?: number; toMeasure?: number } = {}): Sequence {
  const bpm = opts.tempo ?? score.tempo;
  const secPerWhole = (60 / bpm) * 4;
  const events: SoundEvent[] = [];
  const cursor: CursorMark[] = [];
  let duration = 0;
  const measureStarts: number[] = [];
  score.staves.forEach((staff, si) => {
    let t = Frac.zero;
    const from = opts.fromMeasure ?? 0;
    const to = opts.toMeasure ?? staff.measures.length - 1;
    const pendingTies = new Map<number, SoundEvent>();
    for (let mi = from; mi <= to && mi < staff.measures.length; mi++) {
      const m = staff.measures[mi];
      if (si === 0) measureStarts.push(t.value * secPerWhole);
      m.events.forEach((ev, ei) => {
        const start = t.value * secPerWhole;
        const len = eventValue(ev).value * secPerWhole;
        cursor.push({ time: start, staff: si, measure: mi, event: ei });
        const nextTies = new Map<number, SoundEvent>();
        for (const n of ev.notes) {
          let noteNum: number | null = null;
          let instr = instrumentSound(staff.instrument);
          if (n.drum) {
            noteNum = DRUMS[n.drum].gm;
            instr = "drums";
          } else if (n.pitch) noteNum = midi(n.pitch);
          if (noteNum === null) continue;
          const prev = n.drum ? undefined : pendingTies.get(noteNum);
          if (prev) {
            prev.duration += len;
            if (n.tie) nextTies.set(noteNum, prev);
            continue;
          }
          const se: SoundEvent = {
            time: start,
            duration: instr === "drums" ? Math.min(len, 0.5) : len * 0.98,
            note: noteNum,
            velocity: ev.ghost ? 0.35 : ev.accent ? 1 : 0.8,
            instrument: instr,
          };
          events.push(se);
          if (n.tie) nextTies.set(noteNum, se);
        }
        pendingTies.clear();
        nextTies.forEach((v, k) => pendingTies.set(k, v));
        t = t.add(eventValue(ev));
        duration = Math.max(duration, t.value * secPerWhole);
      });
    }
  });
  events.sort((a, b) => a.time - b.time);
  cursor.sort((a, b) => a.time - b.time || a.staff - b.staff);
  return { events, cursor, duration, measureStarts };
}

export function notesSequence(pitches: Pitch[], opts: { instrument?: SoundInstrument; gap?: number; length?: number; harmonic?: boolean } = {}): Sequence {
  const instrument = opts.instrument ?? "piano";
  const length = opts.length ?? 0.9;
  const gap = opts.gap ?? length;
  const events: SoundEvent[] = pitches.map((p, i) => ({
    time: opts.harmonic ? 0 : i * gap,
    duration: opts.harmonic ? length * 1.8 : length,
    note: midi(p),
    velocity: 0.8,
    instrument,
  }));
  const duration = opts.harmonic ? length * 1.8 : pitches.length * gap;
  return { events, cursor: [], duration, measureStarts: [] };
}

/** Varios bloques (acordes) uno detrás de otro. */
export function chordsSequence(chords: Pitch[][], opts: { instrument?: SoundInstrument; length?: number; arpeggiate?: number } = {}): Sequence {
  const instrument = opts.instrument ?? "piano";
  const length = opts.length ?? 1.2;
  const events: SoundEvent[] = [];
  chords.forEach((ch, i) =>
    ch.forEach((p, j) =>
      events.push({ time: i * length + j * (opts.arpeggiate ?? 0), duration: length * 0.95, note: midi(p), velocity: 0.75, instrument }),
    ),
  );
  return { events, cursor: [], duration: chords.length * length, measureStarts: [] };
}

/** Clicks de metrónomo como secuencia (la nota indica acento: 2 fuerte, 1 medio, 0 débil). */
export function clickSequence(beats: number, bpm: number, accents: number[], subdivision = 1): Sequence {
  const events: SoundEvent[] = [];
  const beatSec = 60 / bpm;
  for (let b = 0; b < beats; b++) {
    for (let s = 0; s < subdivision; s++) {
      const acc = s === 0 ? accents[b % accents.length] ?? 0 : -1;
      events.push({ time: b * beatSec + (s * beatSec) / subdivision, duration: 0.05, note: acc + 1, velocity: acc < 0 ? 0.4 : 0.9, instrument: "click" });
    }
  }
  return { events, cursor: [], duration: beats * beatSec, measureStarts: [] };
}

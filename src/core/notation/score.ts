// SPDX-License-Identifier: GPL-3.0-or-later
// Modelo de partitura independiente de la UI: pentagramas, tablaturas y batería.
import type { Pitch } from "../theory/pitch";
import { type Duration, type TimeSignature, Frac, durationValue, measureLength } from "../theory/rhythm";

export type Clef = "treble" | "bass" | "alto" | "tenor" | "percussion";
export type InstrumentId = "piano" | "guitar" | "bass" | "drums";

export type DrumPiece =
  | "kick"
  | "snare"
  | "sideStick"
  | "hhClosed"
  | "hhOpen"
  | "hhPedal"
  | "crash"
  | "ride"
  | "rideBell"
  | "tomHigh"
  | "tomMid"
  | "tomFloor";

export interface TabPos {
  /** 1 = cuerda más aguda. */
  string: number;
  fret: number;
}

export interface NoteHead {
  pitch?: Pitch;
  drum?: DrumPiece;
  tab?: TabPos;
  /** Ligadura de prolongación hacia la nota siguiente con la misma altura. */
  tie?: boolean;
}

export interface ScoreEvent {
  duration: Duration;
  /** Vacío = silencio. */
  notes: NoteHead[];
  /** Cifrado opcional sobre el evento. */
  chord?: string;
  accent?: boolean;
  ghost?: boolean;
  /** Marca visual (p. ej. resaltar el elemento nuevo de la lección). */
  highlight?: boolean;
}

export interface Measure {
  events: ScoreEvent[];
  timeSig?: TimeSignature;
  keyFifths?: number;
  tempo?: number;
  section?: string;
}

export interface Staff {
  id: string;
  name?: string;
  instrument: InstrumentId | "voice";
  clef: Clef;
  /** Mostrar pentagrama (por defecto sí) y/o tablatura. */
  showStaff?: boolean;
  showTab?: boolean;
  /** Afinación de cuerdas al aire (de la 1 a la última). */
  tuning?: Pitch[];
  measures: Measure[];
}

export interface Score {
  title?: string;
  composer?: string;
  tempo: number; // negras por minuto
  timeSig: TimeSignature;
  keyFifths: number;
  staves: Staff[];
  /** Agrupar los dos primeros pentagramas con llave (piano). */
  grand?: boolean;
  /** Ocultar la armadura y el compás (primeras lecciones). */
  hideTimeSig?: boolean;
  hideClef?: boolean;
  /** Sin barras de compás ni compás: notas sueltas. */
  freeNotes?: boolean;
  /** Solo ritmo: se dibuja en una sola línea y las alturas no importan. */
  rhythmOnly?: boolean;
}

export function eventValue(e: ScoreEvent): Frac {
  return durationValue(e.duration);
}

export function measureDuration(m: Measure): Frac {
  return m.events.reduce((acc, e) => acc.add(eventValue(e)), Frac.zero);
}

/** Valida que cada compás completo sume lo que indica el compás vigente. */
export function validateMeasures(staff: Staff, initial: TimeSignature, allowPickup = true): string[] {
  const errors: string[] = [];
  let ts = initial;
  staff.measures.forEach((m, i) => {
    if (m.timeSig) ts = m.timeSig;
    const len = measureDuration(m);
    const want = measureLength(ts);
    if (!len.eq(want)) {
      const isEdge = i === 0 || i === staff.measures.length - 1;
      if (!(allowPickup && isEdge && len.cmp(want) < 0)) errors.push(`compás ${i + 1}: dura ${len} y debería durar ${want}`);
    }
  });
  return errors;
}

/** Arma una partitura de un pentagrama a partir de eventos, repartiéndolos en compases. */
export function singleStaffScore(opts: {
  clef: Clef;
  instrument?: InstrumentId | "voice";
  events: ScoreEvent[];
  timeSig?: TimeSignature;
  keyFifths?: number;
  tempo?: number;
  showTab?: boolean;
  showStaff?: boolean;
  tuning?: Pitch[];
  freeNotes?: boolean;
  hideTimeSig?: boolean;
}): Score {
  const timeSig = opts.timeSig ?? { num: 4, den: 4 };
  const measures = opts.freeNotes ? [{ events: opts.events }] : splitIntoMeasures(opts.events, timeSig);
  return {
    tempo: opts.tempo ?? 80,
    timeSig,
    keyFifths: opts.keyFifths ?? 0,
    freeNotes: opts.freeNotes,
    hideTimeSig: opts.hideTimeSig ?? opts.freeNotes,
    staves: [
      {
        id: "s0",
        instrument: opts.instrument ?? "voice",
        clef: opts.clef,
        showTab: opts.showTab,
        showStaff: opts.showStaff,
        tuning: opts.tuning,
        measures,
      },
    ],
  };
}

export function splitIntoMeasures(events: ScoreEvent[], ts: TimeSignature): Measure[] {
  const len = measureLength(ts);
  const out: Measure[] = [];
  let cur: ScoreEvent[] = [];
  let acc = Frac.zero;
  for (const e of events) {
    cur.push(e);
    acc = acc.add(eventValue(e));
    if (acc.cmp(len) >= 0) {
      out.push({ events: cur });
      cur = [];
      acc = Frac.zero;
    }
  }
  if (cur.length) out.push({ events: cur });
  return out;
}

export function allEvents(score: Score): { staff: Staff; measure: Measure; event: ScoreEvent; mIndex: number; eIndex: number }[] {
  const out: { staff: Staff; measure: Measure; event: ScoreEvent; mIndex: number; eIndex: number }[] = [];
  for (const staff of score.staves)
    staff.measures.forEach((measure, mIndex) => measure.events.forEach((event, eIndex) => out.push({ staff, measure, event, mIndex, eIndex })));
  return out;
}

export const note = (p: Pitch, duration: Duration, extra: Partial<ScoreEvent> = {}): ScoreEvent => ({ duration, notes: [{ pitch: p }], ...extra });
export const rest = (duration: Duration): ScoreEvent => ({ duration, notes: [] });

// SPDX-License-Identifier: GPL-3.0-or-later
// Tipos del camino de aprendizaje: lecciones, ejercicios y requisitos.
import type { Pitch, PitchClass } from "../theory/pitch";
import type { Interval } from "../theory/interval";
import type { Chord } from "../theory/chord";
import type { Score, InstrumentId } from "../notation/score";
import type { Sequence } from "../notation/playback";
import type { Rng } from "../random";
import type { ChordShape } from "../instruments/fretted";

export type ConceptId = string;
export type Branch = "trunk" | InstrumentId;

export const BRANCHES: Branch[] = ["trunk", "piano", "guitar", "bass", "drums"];

/** Texto externalizado: clave de i18n y parámetros. */
export interface Msg {
  key: string;
  params?: Record<string, string | number | Label>;
}

/** Etiquetas que la UI formatea según la nomenclatura elegida (Do/C). */
export type Label =
  | { kind: "text"; text: string }
  | { kind: "msg"; msg: Msg }
  | { kind: "pc"; pc: PitchClass }
  | { kind: "pitch"; pitch: Pitch }
  | { kind: "interval"; iv: Interval; short?: boolean }
  | { kind: "chord"; chord: Chord }
  | { kind: "number"; n: number }
  | { kind: "score"; score: Score }
  | { kind: "diagram"; shape: ChordShape }
  | { kind: "audio"; seq: Sequence; text?: Msg }
  | { kind: "names"; items: Label[] };

export interface FretMark {
  string: number;
  fret: number;
  label?: Label;
  role?: "target" | "hint" | "root";
}

/** Lo que se muestra en la consigna. */
export interface Prompt {
  text: Msg;
  score?: Score;
  audio?: Sequence;
  /** Reproducir el audio automáticamente al mostrar. */
  autoplay?: boolean;
  keyboard?: { from: number; to: number; marks?: { midi: number; role?: "target" | "hint" | "root"; label?: Label }[] };
  fretboard?: { instrument: "guitar" | "bass"; tuning: Pitch[]; frets: number; marks?: FretMark[] };
  diagram?: ChordShape;
  big?: Label;
  /** Patrón de batería para los pads (solo escucha). */
  drumPads?: boolean;
}

export type Answer =
  | { kind: "choice"; options: Label[]; correct: number }
  /** Tocar en el teclado: exact = altura exacta; pc = cualquier octava. */
  | { kind: "keys"; mode: "single" | "set" | "sequence"; target: Pitch[]; match: "exact" | "pc"; from: number; to: number }
  | { kind: "frets"; mode: "single" | "set" | "sequence"; instrument: "guitar" | "bass"; tuning: Pitch[]; frets: number; target: { string: number; fret: number }[]; match: "position" | "pitch" | "pc" }
  /** Escribir una secuencia con botones de nombres de nota. */
  | { kind: "names"; target: PitchClass[]; choices: PitchClass[] }
  /** Armar un ritmo eligiendo figuras. */
  | { kind: "rhythm"; target: string[]; choices: string[]; total: number }
  /**
   * Tocar una línea o un espacio del pentagrama. Los pasos se cuentan desde la 1ª línea (0 = 1ª línea,
   * 1 = 1er espacio, ..., 8 = 5ª línea; negativos/mayores que 8 = líneas adicionales).
   * `target` admite varias posiciones (p. ej. Do4 y Do5 si se conocen las dos). `reveal` dice la respuesta.
   */
  | { kind: "staff"; clef: "treble" | "bass" | null; target: number[]; minStep: number; maxStep: number; reveal: Label };

export interface Exercise {
  id: string;
  generator: string;
  prompt: Prompt;
  answer: Answer;
  /** Concepto(s) evaluado(s): se usan para estadísticas y repaso. */
  targets: ConceptId[];
  /** Todo concepto que aparece en pantalla o en audio. */
  uses: ConceptId[];
  /** Ítem concreto (p. ej. "read.treble.G4"), para ponderar lo que más se falla. */
  item: string;
  explain?: Msg;
}

export interface GenContext {
  rng: Rng;
  /** Conceptos dominados más el foco de la lección. */
  known: ReadonlySet<ConceptId>;
  focus: ConceptId;
  /** Peso de un ítem según los errores previos (>= 1). */
  weight: (item: string) => number;
  /** Ajustes de preferencia (rango del piano, afinación...). */
  prefs?: { leftHanded?: boolean };
}

export interface ExerciseSpec {
  gen: string;
  /** Parámetros específicos del generador. */
  params?: Record<string, unknown>;
  /** Peso relativo dentro de la sesión. */
  weight?: number;
}

export interface Lesson {
  id: string;
  branch: Branch;
  unit: string;
  /** El único concepto nuevo que introduce la lección. */
  concept: ConceptId;
  /** Requisitos explícitos (además de la lección anterior de la misma rama). */
  requires: ConceptId[];
  exercises: ExerciseSpec[];
  /** Cantidad de ejercicios por sesión. */
  length?: number;
}

/** Requisito de contenido: alcanza con conocer uno de los conceptos. */
export type Requirement = { anyOf: ConceptId[]; what?: string };

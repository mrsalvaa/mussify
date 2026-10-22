// SPDX-License-Identifier: GPL-3.0-or-later
// Registro de generadores y preguntas de teoría (banco de preguntas por lección).
import type { ConceptId, Label } from "../types";
import { type Generator, L, msg, choice } from "./common";
import * as basics from "./basics";
import * as rhythm from "./rhythm";
import * as theory from "./theory";
import * as inst from "./instruments";

/** Pregunta de opción múltiple escrita a mano (texto ya localizado por el contenido). */
export interface QuizItem {
  q: string;
  /** La primera es la correcta. */
  a: string[];
  /** Conceptos que la pregunta menciona (además del de la lección). */
  uses?: ConceptId[];
}

const QUIZ_BANK = new Map<string, QuizItem[]>();

export function registerQuiz(lessonId: string, items: QuizItem[]): void {
  QUIZ_BANK.set(lessonId, items);
}

export function quizFor(lessonId: string): QuizItem[] {
  return QUIZ_BANK.get(lessonId) ?? [];
}

/** Preguntas de teoría de la lección (las del foco o, en repasos, de cualquier lección conocida). */
export const quiz: Generator = {
  requires: [],
  canRun: (_ctx, params) => quizFor(String(params.lesson)).length > 0,
  make(ctx, params) {
    const lessonId = String(params.lesson);
    const items = quizFor(lessonId);
    const it = ctx.rng.weighted(items, (x) => ctx.weight(`quiz.${lessonId}.${items.indexOf(x)}`));
    const idx = items.indexOf(it);
    const opts: Label[] = it.a.map((s) => L.text(s));
    return {
      prompt: { text: msg("raw", { text: it.q }) },
      answer: choice(ctx.rng, opts[0], opts.slice(1), 4),
      targets: [String(params.concept ?? ctx.focus)],
      uses: [String(params.concept ?? ctx.focus), ...(it.uses ?? [])],
      item: `quiz.${lessonId}.${idx}`,
    };
  },
};

export const GENERATORS: Record<string, Generator> = {
  quiz,
  pitchHigher: basics.pitchHigher,
  noteOrder: basics.noteOrder,
  nameConvert: basics.nameConvert,
  octaveSame: basics.octaveSame,
  octaveCount: basics.octaveCount,
  octaveName: basics.octaveName,
  staffTap: basics.staffTap,
  placeNote: basics.placeNote,
  noteLine: basics.noteLine,
  absNote: basics.absNote,
  staffPosition: basics.staffPosition,
  readNote: basics.readNote,
  findNote: basics.findNote,
  hearNote: basics.hearNote,
  pulseCount: rhythm.pulseCount,
  figureValue: rhythm.figureValue,
  figureName: rhythm.figureName,
  rhythmSum: rhythm.rhythmSum,
  measureComplete: rhythm.measureComplete,
  rhythmDictation: rhythm.rhythmDictation,
  rhythmRead: rhythm.rhythmRead,
  meterEar: rhythm.meterEar,
  rhythmBuild: rhythm.rhythmBuild,
  toneSemitone: theory.toneSemitone,
  enharmonic: theory.enharmonic,
  intervalEar: theory.intervalEar,
  intervalName: theory.intervalName,
  intervalBuild: theory.intervalBuild,
  intervalSemitones: theory.intervalSemitones,
  intervalInvert: theory.intervalInvert,
  scaleMissing: theory.scaleMissing,
  scalePattern: theory.scalePattern,
  scaleEar: theory.scaleEar,
  keySignature: theory.keySignature,
  keyAccidentals: theory.keyAccidentals,
  relativeKey: theory.relativeKey,
  modeIdentify: theory.modeIdentify,
  chordEar: theory.chordEar,
  chordSpell: theory.chordSpell,
  chordName: theory.chordName,
  chordRead: theory.chordRead,
  chordSymbolConvert: theory.chordSymbolConvert,
  chordInversion: theory.chordInversion,
  degreeChord: theory.degreeChord,
  harmonicFunction: theory.harmonicFunction,
  progressionEar: theory.progressionEar,
  cadenceIdentify: theory.cadenceIdentify,
  chordAnalysis: theory.chordAnalysis,
  keyboardFind: inst.keyboardFind,
  keyboardName: inst.keyboardName,
  staffToKey: inst.staffToKey,
  playMelody: inst.playMelody,
  playChord: inst.playChord,
  playScale: inst.playScale,
  fretName: inst.fretName,
  fretFind: inst.fretFind,
  tabRead: inst.tabRead,
  chordDiagramName: inst.chordDiagramName,
  chordShapePlay: inst.chordShapePlay,
  guitarChordEar: inst.guitarChordEar,
  bassRoot: inst.bassRoot,
  bassShape: inst.bassShape,
  fretScale: inst.fretScale,
  drumPieceRead: inst.drumPieceRead,
  drumPieceEar: inst.drumPieceEar,
  grooveEar: inst.grooveEar,
  grooveRead: inst.grooveRead,
  melodicDictation: inst.melodicDictation,
};

export { GROOVES, grooveScore } from "./instruments";
export { tokenDuration, tokensValue, rhythmScore, rhythmAudio } from "./rhythm";

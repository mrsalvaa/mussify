// SPDX-License-Identifier: GPL-3.0-or-later
// Generadores de las primeras lecciones: sonido, nombres de notas, octava, pentagrama, lectura.
import { type Pitch, pc, P, fromDiatonicIndex, diatonicIndex, samePc, chroma } from "../../theory/pitch";
import { notesSequence } from "../../notation/playback";
import { singleStaffScore, note } from "../../notation/score";
import { dur } from "../../theory/rhythm";
import { readingConcept } from "../extract";
import { type Generator, L, msg, choice, pickFocused, readableNotes, readablePitches, readingClefs, pcLabelConcepts, readingUses, nameablePcs, has } from "./common";
import type { Label } from "../types";

/** ¿Cuál suena más agudo? (sin nombres ni notación) */
export const pitchHigher: Generator = {
  requires: ["t.sound"],
  canRun: () => true,
  make(ctx) {
    const a = ctx.rng.int(52, 76);
    let gap = ctx.rng.int(2, 12);
    if (ctx.rng.bool()) gap = -gap;
    const b = a + gap;
    const seq = { events: [
      { time: 0, duration: 0.8, note: a, velocity: 0.8, instrument: "piano" as const },
      { time: 1.0, duration: 0.8, note: b, velocity: 0.8, instrument: "piano" as const },
    ], cursor: [], duration: 1.8, measureStarts: [] };
    const correct = b > a ? 1 : 0;
    return {
      prompt: { text: msg("ex.pitchHigher.prompt"), audio: seq, autoplay: true },
      answer: { kind: "choice", options: [L.msg("ex.pitchHigher.first"), L.msg("ex.pitchHigher.second")], correct },
      targets: ["t.sound"],
      uses: ["t.sound"],
      item: "t.sound",
    };
  },
};

/** Orden de las notas: ¿qué viene después/antes? */
export const noteOrder: Generator = {
  requires: ["t.notes"],
  canRun: () => true,
  make(ctx) {
    const l = ctx.rng.int(0, 6);
    const after = ctx.rng.bool();
    const target = pc((l + (after ? 1 : -1) + 7) % 7);
    const others = [0, 1, 2, 3, 4, 5, 6].filter((x) => x !== target.letter && x !== l).map((x) => L.pc(pc(x)));
    return {
      prompt: { text: msg(after ? "ex.noteOrder.after" : "ex.noteOrder.before", { note: L.pc(pc(l)) }) },
      answer: choice(ctx.rng, L.pc(target), others),
      targets: ["t.notes"],
      uses: ["t.notes"],
      item: "t.notes.order",
    };
  },
};

/** Conversión entre nomenclaturas: Do = C. */
export const nameConvert: Generator = {
  requires: ["t.notes"],
  canRun: () => true,
  make(ctx) {
    const l = ctx.rng.int(0, 6);
    const toEnglish = ctx.rng.bool();
    const correct = L.msg(toEnglish ? "name.english" : "name.latin", { l });
    const others = [0, 1, 2, 3, 4, 5, 6].filter((x) => x !== l).map((x) => L.msg(toEnglish ? "name.english" : "name.latin", { l: x }));
    return {
      prompt: { text: msg(toEnglish ? "ex.nameConvert.toEnglish" : "ex.nameConvert.toLatin", { name: L.msg(toEnglish ? "name.latin" : "name.english", { l }) }) },
      answer: choice(ctx.rng, correct, others),
      targets: ["t.notes"],
      uses: ["t.notes"],
      item: `t.notes.convert.${l}`,
    };
  },
};

/** ¿Es la misma nota en otra octava? */
export const octaveSame: Generator = {
  requires: ["t.octave"],
  canRun: () => true,
  make(ctx) {
    const a = ctx.rng.int(53, 67);
    const same = ctx.rng.bool();
    const b = same ? a + 12 : a + ctx.rng.pick([5, 7, 9, 10, 11, 13, 14]);
    const seq = { events: [
      { time: 0, duration: 0.9, note: a, velocity: 0.8, instrument: "piano" as const },
      { time: 1.0, duration: 0.9, note: b, velocity: 0.8, instrument: "piano" as const },
    ], cursor: [], duration: 2, measureStarts: [] };
    return {
      prompt: { text: msg("ex.octaveSame.prompt"), audio: seq, autoplay: true },
      answer: { kind: "choice", options: [L.msg("ex.octaveSame.yes"), L.msg("ex.octaveSame.no")], correct: same ? 0 : 1 },
      targets: ["t.octave"],
      uses: ["t.octave", "t.sound"],
      item: "t.octave",
    };
  },
};

/** Pentagrama sin clave: ¿línea o espacio? / ¿cuál está más alta? */
export const staffPosition: Generator = {
  requires: ["t.staff"],
  canRun: () => true,
  make(ctx) {
    const mode = ctx.rng.pick(["lineSpace", "higher"]);
    const base = diatonicIndex(P("E4"));
    if (mode === "lineSpace") {
      const step = ctx.rng.int(0, 8);
      const p = fromDiatonicIndex(base + step);
      const score = { ...singleStaffScore({ clef: "treble", events: [note(p, dur("w"))], freeNotes: true }), hideClef: true };
      const isLine = step % 2 === 0;
      const lineNumber = step / 2 + 1;
      const spaceNumber = (step + 1) / 2;
      return {
        prompt: { text: msg("ex.staff.lineSpace"), score },
        answer: { kind: "choice", options: [L.msg("ex.staff.line"), L.msg("ex.staff.space")], correct: isLine ? 0 : 1 },
        targets: ["t.staff"],
        uses: ["t.staff"],
        item: "t.staff.ls",
        explain: msg(isLine ? "ex.staff.isLine" : "ex.staff.isSpace", { n: isLine ? lineNumber : spaceNumber }),
      };
    }
    const s1 = ctx.rng.int(0, 8);
    let s2 = ctx.rng.int(0, 8);
    if (s2 === s1) s2 = (s1 + 3) % 9;
    const p1 = fromDiatonicIndex(base + s1), p2 = fromDiatonicIndex(base + s2);
    const score = { ...singleStaffScore({ clef: "treble", events: [note(p1, dur("w")), note(p2, dur("w"))], freeNotes: true }), hideClef: true };
    return {
      prompt: { text: msg("ex.staff.higher"), score, audio: notesSequence([p1, p2]) },
      answer: { kind: "choice", options: [L.msg("ex.pitchHigher.first"), L.msg("ex.pitchHigher.second")], correct: s2 > s1 ? 1 : 0 },
      targets: ["t.staff"],
      uses: ["t.staff"],
      item: "t.staff.hi",
    };
  },
};

/** Leer una nota en el pentagrama y elegir su nombre. */
export const readNote: Generator = {
  requires: ["t.staff", "t.notes"],
  canRun: (ctx, params) => {
    const clef = params.clef as "treble" | "bass" | undefined;
    const clefs = clef ? [clef] : readingClefs(ctx.known);
    return clefs.some((c) => ctx.known.has(`clef.${c}`) && readableNotes(ctx.known, c).length > 0);
  },
  make(ctx, params) {
    const forced = params.clef as "treble" | "bass" | undefined;
    const clefs = (forced ? [forced] : readingClefs(ctx.known)).filter((c) => ctx.known.has(`clef.${c}`) && readableNotes(ctx.known, c).length > 0);
    // Si el foco es una nota de una clave, usar esa clave.
    let clef = ctx.rng.pick(clefs);
    for (const c of clefs) if (ctx.focus.startsWith(`read.${c}.`)) clef = c;
    const withAcc = params.accidentals !== false && (has(ctx, "acc.sharp") || has(ctx, "acc.flat"));
    const pool = withAcc ? readablePitches(ctx.known, clef) : readableNotes(ctx.known, clef);
    const p = pickFocused(ctx, pool, (x) => (ctx.focus.startsWith("acc.") && x.acc !== 0 ? ctx.focus : readingConcept(x, clef)));
    const score = singleStaffScore({ clef, events: [note(p, dur("w"), { highlight: false })], freeNotes: true });
    const distract: Label[] = nameablePcs(ctx.known).filter((q) => !samePc(q, p)).sort((a, b) => {
      // Distractores cercanos primero (nota vecina o misma letra con otra alteración).
      const da = Math.min(Math.abs(a.letter - p.letter), 7 - Math.abs(a.letter - p.letter)) + (a.acc !== p.acc ? 0.5 : 0);
      const db = Math.min(Math.abs(b.letter - p.letter), 7 - Math.abs(b.letter - p.letter)) + (b.acc !== p.acc ? 0.5 : 0);
      return da - db;
    }).slice(0, 5).map(L.pc);
    return {
      prompt: { text: msg("ex.readNote.prompt"), score, audio: notesSequence([p]) },
      answer: choice(ctx.rng, L.pc(p), distract, 4),
      targets: [readingConcept(p, clef), ...(p.acc === 1 ? ["acc.sharp"] : p.acc === -1 ? ["acc.flat"] : [])],
      uses: [...readingUses(p, clef), ...pcLabelConcepts(p)],
      item: readingConcept(p, clef) + (p.acc ? `.${p.acc}` : ""),
    };
  },
};

/** Ver un nombre y elegir el pentagrama correcto. */
export const findNote: Generator = {
  requires: ["t.staff", "t.notes"],
  canRun: (ctx) => readingClefs(ctx.known).some((c) => readableNotes(ctx.known, c).length >= 2),
  make(ctx) {
    const clefs = readingClefs(ctx.known).filter((c) => readableNotes(ctx.known, c).length >= 2);
    let clef = ctx.rng.pick(clefs);
    for (const c of clefs) if (ctx.focus.startsWith(`read.${c}.`)) clef = c;
    const pool = readableNotes(ctx.known, clef);
    const p = pickFocused(ctx, pool, (x) => readingConcept(x, clef));
    const others = pool.filter((q) => q.letter !== p.letter);
    const mk = (q: Pitch): Label => ({ kind: "score", score: singleStaffScore({ clef, events: [note(q, dur("w"))], freeNotes: true }) });
    const ans = choice(ctx.rng, mk(p), ctx.rng.sample(others, 3).map(mk), 4);
    return {
      prompt: { text: msg("ex.findNote.prompt", { note: L.pc(p) }) },
      answer: ans,
      targets: [readingConcept(p, clef)],
      uses: [...readingUses(p, clef), ...others.map((o) => readingConcept(o, clef)), "t.notes"],
      item: readingConcept(p, clef),
    };
  },
};

/** ¿Qué tiene de especial esta nota? Asociar el sonido con su lugar (escuchar dos y elegir). */
export const hearNote: Generator = {
  requires: ["t.staff", "t.notes"],
  canRun: (ctx) => readingClefs(ctx.known).some((c) => readableNotes(ctx.known, c).length >= 2),
  make(ctx) {
    const clefs = readingClefs(ctx.known).filter((c) => readableNotes(ctx.known, c).length >= 2);
    const clef = ctx.rng.pick(clefs);
    const pool = readableNotes(ctx.known, clef);
    const p = pickFocused(ctx, pool, (x) => readingConcept(x, clef));
    const others = pool.filter((q) => chroma(q) !== chroma(p) || q.octave !== p.octave);
    const q = ctx.rng.pick(others);
    const first = ctx.rng.bool();
    const seq = notesSequence(first ? [p, q] : [q, p]);
    const score = singleStaffScore({ clef, events: [note(p, dur("w"))], freeNotes: true });
    return {
      prompt: { text: msg("ex.hearNote.prompt"), score, audio: seq, autoplay: true },
      answer: { kind: "choice", options: [L.msg("ex.pitchHigher.first"), L.msg("ex.pitchHigher.second")], correct: first ? 0 : 1 },
      targets: [readingConcept(p, clef)],
      uses: [...readingUses(p, clef), "t.sound"],
      item: readingConcept(p, clef) + ".ear",
    };
  },
};


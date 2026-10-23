// SPDX-License-Identifier: GPL-3.0-or-later
// Generadores de las primeras lecciones: sonido, nombres de notas, octava, pentagrama, lectura.
import { type Pitch, type PitchClass, pc, P, fromDiatonicIndex, diatonicIndex, samePc, chroma, midi, fromMidi } from "../../theory/pitch";
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
    // Comparación simple en los dos sentidos: "¿cuál es más aguda?" / "¿cuál es más grave?".
    const lower = ctx.rng.bool();
    const correct = (lower ? b < a : b > a) ? 1 : 0;
    return {
      prompt: { text: msg(lower ? "ex.pitchLower.prompt" : "ex.pitchHigher.prompt"), audio: seq, autoplay: true },
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

/** Secuencia de dos notas sueltas (sin nombre ni notación). */
function twoNotes(a: number, b: number) {
  return { events: [
    { time: 0, duration: 0.9, note: a, velocity: 0.8, instrument: "piano" as const },
    { time: 1.0, duration: 0.9, note: b, velocity: 0.8, instrument: "piano" as const },
  ], cursor: [], duration: 2, measureStarts: [] };
}

/** ¿Es la misma nota en otra octava? Varía la nota, el registro y la distancia (1 a 3 octavas). */
export const octaveSame: Generator = {
  requires: ["t.octave"],
  canRun: () => true,
  make(ctx, params) {
    // `maxOctaves` limita la distancia la primera vez que aparece (1 = solo una octava).
    const max = Math.max(1, Math.min(3, Number(params.maxOctaves ?? 3)));
    const octaves = ctx.rng.weighted([1, 2, 3].filter((k) => k <= max), (k) => (k === 1 ? 3 : k === 2 ? 2 : 1));
    const span = 12 * octaves;
    const a = ctx.rng.int(36, 84 - span);
    const same = ctx.rng.bool();
    // Las trampas suenan "casi" a octava: una octava (o más) más/menos uno o dos semitonos, o una quinta/cuarta encima.
    const off = same ? span : ctx.rng.pick([span - 1, span + 1, span - 2, span + 2, span - 5, span - 7]);
    const up = ctx.rng.bool();
    const [x, y] = up ? [a, a + off] : [a + off, a];
    return {
      prompt: { text: msg("ex.octaveSame.prompt"), audio: twoNotes(x, y), autoplay: true },
      answer: { kind: "choice", options: [L.msg("ex.octaveSame.yes"), L.msg("ex.octaveSame.no")], correct: same ? 0 : 1 },
      targets: ["t.octave"],
      uses: ["t.octave", "t.sound"],
      item: "t.octave",
    };
  },
};

/** Es la misma nota: ¿a cuántas octavas de distancia? */
export const octaveCount: Generator = {
  requires: ["t.octave"],
  canRun: () => true,
  make(ctx) {
    const k = ctx.rng.int(1, 3);
    const a = ctx.rng.int(36, 84 - 12 * k);
    const up = ctx.rng.bool();
    const [x, y] = up ? [a, a + 12 * k] : [a + 12 * k, a];
    const opt = (n: number) => L.msg(n === 1 ? "ex.octaveCount.one" : "ex.octaveCount.many", { n });
    return {
      prompt: { text: msg("ex.octaveCount.prompt"), audio: twoNotes(x, y), autoplay: true },
      answer: { kind: "choice", options: [opt(1), opt(2), opt(3)], correct: k - 1 },
      targets: ["t.octave"],
      uses: ["t.octave", "t.sound"],
      item: `t.octave.count${k}`,
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


/** "¿Qué nota está 2 octavas abajo de Re5?": nota, registro, distancia y dirección al azar. */
export const octaveName: Generator = {
  requires: ["t.octave", "t.notes"],
  canRun: () => true,
  make(ctx) {
    const k = ctx.rng.weighted([1, 2, 3], (x) => (x === 1 ? 2 : 1.5));
    const up = ctx.rng.bool();
    const letter = ctx.rng.int(0, 6) as Pitch["letter"];
    const from: Pitch = { letter, acc: 0, octave: up ? ctx.rng.int(2, 6 - k) : ctx.rng.int(2 + k, 6) };
    const to: Pitch = { ...from, octave: from.octave + (up ? k : -k) };
    const wrong: Pitch[] = [
      { ...to, octave: to.octave + 1 },
      { ...to, octave: to.octave - 1 },
      { ...from },
      { ...to, letter: ((letter + 1) % 7) as Pitch["letter"] },
      { ...from, octave: from.octave + (up ? -k : k) },
    ].filter((p) => p.octave >= 1 && p.octave <= 7);
    return {
      prompt: { text: msg(`ex.octaveName.${up ? "up" : "down"}${k === 1 ? "1" : "N"}`, { n: k, note: L.pitch(from) }) },
      answer: choice(ctx.rng, L.pitch(to), wrong.map(L.pitch), 4),
      targets: ["t.octave"],
      uses: ["t.octave", "t.notes"],
      item: `t.octave.name${k}`,
    };
  },
};

// ---------------------------------------------------------------------------
// Pentagrama interactivo: tocar líneas y espacios.

/** Paso (0 = 1ª línea) de una altura en una clave. */
export function staffStep(p: Pitch, clef: "treble" | "bass"): number {
  return diatonicIndex(p) - diatonicIndex(P(clef === "treble" ? "E4" : "G2"));
}

const lineOrSpace = (step: number): Label => (step % 2 === 0 ? L.msg("ex.staff.lineN", { n: step / 2 + 1 }) : L.msg("ex.staff.spaceN", { n: (step + 1) / 2 }));

/** Sin clave: "tocá la 2ª línea" / "tocá el 3er espacio". */
export const staffTap: Generator = {
  requires: ["t.staff"],
  canRun: () => true,
  make(ctx) {
    const step = ctx.rng.int(0, 8);
    const isLine = step % 2 === 0;
    return {
      prompt: { text: msg(isLine ? "ex.staffTap.line" : "ex.staffTap.space", { n: isLine ? step / 2 + 1 : (step + 1) / 2 }) },
      answer: { kind: "staff", clef: null, target: [step], minStep: -1, maxStep: 9, reveal: lineOrSpace(step) },
      targets: ["t.staff"],
      uses: ["t.staff"],
      item: `t.staff.tap${step}`,
    };
  },
};

/** "Tocá dónde va Sol en clave de Sol": funciona aunque se conozca una sola nota. */
export const placeNote: Generator = {
  requires: ["t.staff", "t.notes"],
  canRun: (ctx) => readingClefs(ctx.known).length > 0,
  make(ctx) {
    const clefs = readingClefs(ctx.known);
    let clef = ctx.rng.pick(clefs);
    for (const c of clefs) if (ctx.focus.startsWith(`read.${c}.`)) clef = c;
    const pool = readableNotes(ctx.known, clef);
    const p = pickFocused(ctx, pool, (x) => readingConcept(x, clef));
    // Si se conoce la misma nota en otra octava, cualquiera de las dos vale.
    const target = pool.filter((q) => q.letter === p.letter).map((q) => staffStep(q, clef));
    return {
      prompt: { text: msg(clef === "treble" ? "ex.placeNote.treble" : "ex.placeNote.bass", { note: L.pc(p) }) },
      answer: { kind: "staff", clef, target, minStep: -3, maxStep: 11, reveal: L.pc(p) },
      targets: [readingConcept(p, clef)],
      uses: [...readingUses(p, clef), ...pool.filter((q) => q.letter === p.letter).map((q) => readingConcept(q, clef)), "t.notes"],
      item: readingConcept(p, clef) + ".place",
    };
  },
};

/** Ver una nota y decir en qué línea o espacio está (otro enfoque de la misma lectura). */
export const noteLine: Generator = {
  requires: ["t.staff"],
  canRun: (ctx) => readingClefs(ctx.known).some((c) => readableNotes(ctx.known, c).some((p) => staffStep(p, c) >= 0 && staffStep(p, c) <= 8)),
  make(ctx) {
    const clefs = readingClefs(ctx.known).filter((c) => readableNotes(ctx.known, c).some((p) => staffStep(p, c) >= 0 && staffStep(p, c) <= 8));
    let clef = ctx.rng.pick(clefs);
    for (const c of clefs) if (ctx.focus.startsWith(`read.${c}.`)) clef = c;
    const pool = readableNotes(ctx.known, clef).filter((p) => staffStep(p, clef) >= 0 && staffStep(p, clef) <= 8);
    const p = pickFocused(ctx, pool, (x) => readingConcept(x, clef));
    const step = staffStep(p, clef);
    const near = [step - 2, step + 2, step - 1, step + 1, step - 4, step + 4].filter((x) => x >= 0 && x <= 8);
    const score = singleStaffScore({ clef, events: [note(p, dur("w"))], freeNotes: true });
    return {
      prompt: { text: msg("ex.noteLine.prompt"), score },
      answer: choice(ctx.rng, lineOrSpace(step), near.map(lineOrSpace), 4),
      targets: [readingConcept(p, clef)],
      uses: readingUses(p, clef),
      item: readingConcept(p, clef) + ".pos",
    };
  },
};

// ---------------------------------------------------------------------------
// Reconocer notas sin referencia (oído absoluto), integrado en las lecciones de lectura.

/** Alturas que se pueden pedir de oído: las que ya se leen (y sus alteraciones, si se saben). */
function absolutePool(known: ReadonlySet<string>): Pitch[] {
  const out: Pitch[] = [];
  for (const clef of readingClefs(known)) for (const p of known.has("acc.sharp") || known.has("acc.flat") ? readablePitches(known, clef) : readableNotes(known, clef)) if (!out.some((q) => midi(q) === midi(p) && samePc(q, p))) out.push(p);
  return out;
}

/**
 * ¿Qué nota es? Sin nota de referencia. La dificultad crece con lo aprendido:
 * con una sola nota conocida es "¿esto es Sol?"; con pocas, se elige entre dos notas lejanas;
 * después entre tres o cuatro, cada vez más cercanas, y cuando ya se conocen las alteraciones,
 * la nota suena en cualquier octava.
 */
/** Notas posibles por nivel (pocas al principio, se amplían de a poco). */
const ABS_LEVELS: Record<number, string[]> = {
  1: ["C4", "G4"],
  2: ["C4", "E4", "G4", "A4"],
  3: ["C4", "D4", "E4", "F4", "G4", "A4", "B4"],
};
/** Con referencia (se oye Do y se lo nombra): pocas notas, a intervalos ya conocidos de Do. */
const REF_POOL = ["E4", "G4", "A4"];

function chromaticPool(known: ReadonlySet<string>): Pitch[] {
  const out: Pitch[] = [];
  for (const q of nameablePcs(known)) {
    // sin Mi♯, Si♯, Fa♭ ni Do♭: se piden las notas con su nombre habitual
    if ((q.acc === 1 && (q.letter === 2 || q.letter === 6)) || (q.acc === -1 && (q.letter === 3 || q.letter === 0))) continue;
    const p = { ...q, octave: 4 } as Pitch;
    if (!out.some((x) => chroma(x) === chroma(p))) out.push(p);
  }
  return out;
}

/** Versión por niveles (y con referencia) que usan las lecciones desde 0.5.1. */
function absNoteLeveled(ctx: Parameters<Generator["make"]>[0], params: Record<string, unknown>): ReturnType<Generator["make"]> {
  const level = Math.max(1, Math.min(4, Number(params.level ?? 1)));
  const ref = params.reference ? P("C4") : null;
  const pool = ref ? REF_POOL.map(P) : level >= 4 ? chromaticPool(ctx.known) : ABS_LEVELS[level].map(P);
  const k = ref || level === 1 ? 2 : level === 2 ? 3 : 4;
  const itemOf = (x: PitchClass) => `${ref ? "ear.ref" : "ear.abs"}.${x.letter}${x.acc}`;
  const target = ctx.rng.weighted(pool, (x) => ctx.weight(itemOf(x)));
  const dist = (x: PitchClass) => {
    const d = Math.abs(chroma(x) - chroma(target)) % 12;
    return Math.min(d, 12 - d);
  };
  const others = pool.filter((x) => dist(x) > 0);
  // En los primeros niveles, las opciones son notas bien distintas entre sí.
  const far = others.filter((x) => dist(x) >= 3);
  const distract = ctx.rng.sample(ref || level <= 2 ? (far.length >= k - 1 ? far : others) : others, k - 1);
  const played: Pitch = level >= 4 && !ref ? ({ ...target, octave: ctx.rng.int(3, 5) } as Pitch) : target;
  return {
    prompt: ref
      ? { text: msg("ex.absNote.withRef", { ref: L.pc(ref) }), audio: notesSequence([ref, played], { length: 1.1, gap: 1.5 }), autoplay: true }
      : { text: msg("ex.absNote.prompt"), audio: notesSequence([played], { length: 1.2 }), autoplay: true },
    answer: choice(ctx.rng, L.pc(target), distract.map(L.pc), k),
    targets: ["t.notes"],
    uses: ["t.notes", "t.sound", ...pcLabelConcepts(target), ...distract.flatMap(pcLabelConcepts), ...(ref ? ["t.interval"] : [])],
    item: itemOf(target),
  };
}

export const absNote: Generator = {
  requires: ["t.notes", "t.sound"],
  canRun: (ctx, params) => {
    if (params.level || params.reference) return Number(params.level ?? 1) < 4 || params.reference ? true : chromaticPool(ctx.known).length > 7;
    return absolutePool(ctx.known).length > 0;
  },
  make(ctx, params) {
    if (params.level || params.reference) return absNoteLeveled(ctx, params);
    const pool = absolutePool(ctx.known);
    const pcs = uniqByChroma(pool);
    const itemOf = (x: PitchClass) => `ear.abs.${x.letter}${x.acc}`;
    if (pcs.length === 1) {
      const p = pool[0];
      const yes = ctx.rng.bool();
      const other = midi(p) + (ctx.rng.bool() ? 1 : -1) * ctx.rng.int(5, 9);
      return {
        prompt: { text: msg("ex.absNote.isIt", { note: L.pc(p) }), audio: notesSequence([yes ? p : fromMidi(other)]), autoplay: true },
        answer: { kind: "choice", options: [L.msg("ex.absNote.yes"), L.msg("ex.absNote.no")], correct: yes ? 0 : 1 },
        targets: ["t.notes"],
        uses: ["t.notes", "t.sound", ...pcLabelConcepts(p)],
        item: itemOf(p),
      };
    }
    const chromatic = pool.some((x) => x.acc !== 0);
    const k = Math.min(pcs.length, pcs.length <= 3 ? 2 : pcs.length <= 6 ? 3 : 4);
    const target = ctx.rng.weighted(pcs, (x) => ctx.weight(itemOf(x)));
    const dist = (x: PitchClass) => {
      const d = Math.abs(chroma(x) - chroma(target)) % 12;
      return Math.min(d, 12 - d);
    };
    const others = pcs.filter((x) => !samePc(x, target) && dist(x) > 0);
    // Al principio, notas bien distintas; con más práctica, también vecinas.
    const easy = pcs.length <= 4;
    const pickFrom = easy ? others.filter((x) => dist(x) >= 4) : others;
    const distract = ctx.rng.sample(pickFrom.length >= k - 1 ? pickFrom : others, k - 1);
    // Antes de las alteraciones suena en la octava en que se aprendió a leer; después, en cualquiera.
    const written = pool.filter((x) => samePc(x, target));
    let played: Pitch = ctx.rng.pick(written);
    if (chromatic) played = { ...target, octave: ctx.rng.int(3, 5) } as Pitch;
    return {
      prompt: { text: msg("ex.absNote.prompt"), audio: notesSequence([played], { length: 1.2 }), autoplay: true },
      answer: choice(ctx.rng, L.pc(target), distract.map(L.pc), k),
      targets: ["t.notes"],
      uses: ["t.notes", "t.sound", ...pcLabelConcepts(target), ...distract.flatMap(pcLabelConcepts)],
      item: itemOf(target),
    };
  },
};

function uniqByChroma(ps: Pitch[]): PitchClass[] {
  const out: PitchClass[] = [];
  for (const p of ps) if (!out.some((q) => chroma(q) === chroma(p))) out.push({ letter: p.letter, acc: p.acc });
  return out;
}

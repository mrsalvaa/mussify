// SPDX-License-Identifier: GPL-3.0-or-later
// Motor de progresión: grafo de prerrequisitos, desbloqueo por dominio, sesiones, repaso y test de nivel.
import { Rng, hashString } from "../random";
import { allLessons } from "./lessons";
import { GENERATORS, quizFor } from "./gen";
import type { Branch, ConceptId, Exercise, ExerciseSpec, GenContext, Lesson } from "./types";
import { BRANCHES } from "./types";

export interface Mastery {
  at: number;
  score: number;
  /** Desbloqueado con el test de nivel. */
  viaTest?: boolean;
}

export interface ItemStat {
  seen: number;
  wrong: number;
  last: number;
}

export class Curriculum {
  readonly lessons: Lesson[];
  readonly byConcept = new Map<ConceptId, Lesson>();
  readonly byBranch = new Map<Branch, Lesson[]>();
  private prereqCache = new Map<ConceptId, ConceptId[]>();
  private closureCache = new Map<ConceptId, Set<ConceptId>>();

  constructor(lessons: Lesson[] = allLessons()) {
    this.lessons = lessons;
    for (const b of BRANCHES) this.byBranch.set(b, []);
    for (const l of lessons) {
      if (this.byConcept.has(l.concept)) throw new Error(`Concepto duplicado: ${l.concept}`);
      this.byConcept.set(l.concept, l);
      this.byBranch.get(l.branch)!.push(l);
    }
  }

  /** Prerrequisitos directos: la lección anterior de la rama + los explícitos. */
  prereqs(concept: ConceptId): ConceptId[] {
    const cached = this.prereqCache.get(concept);
    if (cached) return cached;
    const l = this.byConcept.get(concept);
    if (!l) return [];
    const list = this.byBranch.get(l.branch)!;
    const idx = list.indexOf(l);
    const out = [...l.requires];
    if (idx > 0) out.unshift(list[idx - 1].concept);
    this.prereqCache.set(concept, out);
    return out;
  }

  /** Todos los conceptos que hay que saber antes (cierre transitivo). */
  closure(concept: ConceptId): Set<ConceptId> {
    const cached = this.closureCache.get(concept);
    if (cached) return cached;
    const out = new Set<ConceptId>();
    const stack = [...this.prereqs(concept)];
    while (stack.length) {
      const c = stack.pop()!;
      if (out.has(c)) continue;
      out.add(c);
      stack.push(...this.prereqs(c));
    }
    this.closureCache.set(concept, out);
    return out;
  }

  /** Orden topológico global (útil para el test de nivel y para validar el grafo). */
  topoOrder(): ConceptId[] {
    const visited = new Set<ConceptId>(), temp = new Set<ConceptId>(), out: ConceptId[] = [];
    const visit = (c: ConceptId) => {
      if (visited.has(c)) return;
      if (temp.has(c)) throw new Error(`Ciclo en prerrequisitos en ${c}`);
      temp.add(c);
      for (const p of this.prereqs(c)) visit(p);
      temp.delete(c);
      visited.add(c);
      out.push(c);
    };
    for (const l of this.lessons) visit(l.concept);
    return out;
  }

  isUnlocked(concept: ConceptId, mastered: ReadonlySet<ConceptId>): boolean {
    return this.prereqs(concept).every((p) => mastered.has(p));
  }

  /** La próxima lección disponible de una rama (o null si terminó o está bloqueada). */
  nextLesson(branch: Branch, mastered: ReadonlySet<ConceptId>): { lesson: Lesson | null; blockedBy: ConceptId[] } {
    for (const l of this.byBranch.get(branch)!) {
      if (mastered.has(l.concept)) continue;
      const missing = this.prereqs(l.concept).filter((p) => !mastered.has(p));
      return missing.length ? { lesson: l, blockedBy: missing } : { lesson: l, blockedBy: [] };
    }
    return { lesson: null, blockedBy: [] };
  }

  /** Camino más corto de lecciones (en orden) para dominar un conjunto de conceptos. */
  pathTo(targets: ConceptId[], mastered: ReadonlySet<ConceptId>): Lesson[] {
    const need = new Set<ConceptId>();
    for (const t of targets) {
      if (!this.byConcept.has(t) || mastered.has(t)) continue;
      need.add(t);
      for (const c of this.closure(t)) if (!mastered.has(c)) need.add(c);
    }
    return this.topoOrder().filter((c) => need.has(c)).map((c) => this.byConcept.get(c)!);
  }

  /** Conceptos para el glosario: solo lo ya visto. */
  knownGlossary(mastered: ReadonlySet<ConceptId>): Lesson[] {
    return this.lessons.filter((l) => mastered.has(l.concept));
  }
}

// ---------------------------------------------------------------------------
// Sesiones de ejercicios

export interface SessionOptions {
  seed: number;
  length?: number;
  stats?: Record<string, ItemStat>;
}

export function weightFn(stats: Record<string, ItemStat> | undefined): (item: string) => number {
  return (item: string) => {
    const s = stats?.[item];
    if (!s || s.seen === 0) return 1.2;
    const err = s.wrong / s.seen;
    return 1 + 3 * err;
  };
}

function specsFor(lesson: Lesson): ExerciseSpec[] {
  const specs = [...lesson.exercises];
  if (quizFor(lesson.id).length) specs.push({ gen: "quiz", params: { lesson: lesson.id, concept: lesson.concept }, weight: lesson.exercises.length ? 1 : 3 });
  return specs;
}

function runnable(spec: ExerciseSpec, ctx: GenContext): boolean {
  const gen = GENERATORS[spec.gen];
  if (!gen) throw new Error(`Generador desconocido: ${spec.gen}`);
  return gen.requires.every((c) => ctx.known.has(c)) && gen.canRun(ctx, spec.params ?? {});
}

export function makeExercise(spec: ExerciseSpec, ctx: GenContext, id: string): Exercise {
  const gen = GENERATORS[spec.gen];
  const ex = gen.make(ctx, spec.params ?? {});
  return { id, generator: spec.gen, ...ex };
}

/** Sesión de una lección: solo usa lo dominado + el concepto nuevo. */
export function lessonSession(cur: Curriculum, lesson: Lesson, mastered: ReadonlySet<ConceptId>, opts: SessionOptions): Exercise[] {
  const known = new Set(mastered);
  known.add(lesson.concept);
  const rng = new Rng(opts.seed ^ hashString(lesson.id));
  const ctx: GenContext = { rng, known, focus: lesson.concept, weight: weightFn(opts.stats) };
  const specs = specsFor(lesson).filter((s) => runnable(s, ctx));
  if (!specs.length) return [];
  const length = opts.length ?? lesson.length ?? 10;
  const out: Exercise[] = [];
  const seen = new Set<string>();
  for (let i = 0; out.length < length && i < length * 4; i++) {
    const spec = rng.weighted(specs, (s) => s.weight ?? 1);
    const ex = makeExercise(spec, ctx, `${lesson.id}#${i}`);
    const key = JSON.stringify([ex.prompt, ex.answer]);
    if (seen.has(key) && i < length * 3) continue;
    seen.add(key);
    out.push(ex);
  }
  void cur;
  return out;
}

/** Sesión de repaso: ejercicios centrados en los conceptos a repasar (todo con lo dominado). */
export function reviewSession(cur: Curriculum, concepts: ConceptId[], mastered: ReadonlySet<ConceptId>, opts: SessionOptions): Exercise[] {
  const rng = new Rng(opts.seed ^ 0x5eed);
  const out: Exercise[] = [];
  const length = opts.length ?? 12;
  const pool = concepts.filter((c) => mastered.has(c) && cur.byConcept.has(c));
  if (!pool.length) return out;
  for (let i = 0; out.length < length && i < length * 5; i++) {
    const focus = pool[i % pool.length];
    const lesson = cur.byConcept.get(focus)!;
    const ctx: GenContext = { rng, known: mastered, focus, weight: weightFn(opts.stats) };
    const specs = specsFor(lesson).filter((s) => runnable(s, ctx));
    if (!specs.length) continue;
    const spec = rng.weighted(specs, (s) => s.weight ?? 1);
    out.push(makeExercise(spec, ctx, `review:${focus}#${i}`));
  }
  return rng.shuffle(out);
}

/** Práctica libre de una rama: mezcla de lo dominado, ponderando lo que más se falla. */
export function practiceSession(cur: Curriculum, branch: Branch | "all", mastered: ReadonlySet<ConceptId>, opts: SessionOptions): Exercise[] {
  const concepts = cur.lessons.filter((l) => (branch === "all" || l.branch === branch) && mastered.has(l.concept)).map((l) => l.concept);
  const stats = opts.stats ?? {};
  const scored = concepts.map((c) => {
    const s = Object.entries(stats).filter(([k]) => k.startsWith(c));
    const seen = s.reduce((a, [, v]) => a + v.seen, 0), wrong = s.reduce((a, [, v]) => a + v.wrong, 0);
    return { c, w: 1 + (seen ? (3 * wrong) / seen : 0.5) };
  });
  const rng = new Rng(opts.seed);
  const picks: ConceptId[] = [];
  for (let i = 0; i < Math.min(8, scored.length); i++) picks.push(rng.weighted(scored, (x) => x.w).c);
  return reviewSession(cur, picks, mastered, opts);
}

// ---------------------------------------------------------------------------
// Test de nivel (opcional): desbloquea bloques solo si se demuestran.

export interface PlacementBlock {
  branch: Branch;
  index: number;
  lessons: Lesson[];
  /** Requisitos de otras ramas que tiene que tener dominados antes. */
  external: ConceptId[];
}

export function placementBlocks(cur: Curriculum, branch: Branch, size = 5): PlacementBlock[] {
  const list = cur.byBranch.get(branch)!;
  const blocks: PlacementBlock[] = [];
  for (let i = 0; i < list.length; i += size) {
    const lessons = list.slice(i, i + size);
    const inBlockOrBefore = new Set(list.slice(0, i + size).map((l) => l.concept));
    const external = new Set<ConceptId>();
    for (const l of lessons) for (const r of cur.prereqs(l.concept)) if (!inBlockOrBefore.has(r)) external.add(r);
    blocks.push({ branch, index: blocks.length, lessons, external: [...external] });
  }
  return blocks;
}

export function placementSession(cur: Curriculum, block: PlacementBlock, mastered: ReadonlySet<ConceptId>, seed: number, perLesson = 2): Exercise[] {
  const known = new Set(mastered);
  for (const l of block.lessons) known.add(l.concept);
  const rng = new Rng(seed ^ hashString(`${block.branch}:${block.index}`));
  const out: Exercise[] = [];
  for (const l of block.lessons) {
    const ctx: GenContext = { rng, known, focus: l.concept, weight: () => 1 };
    const specs = specsFor(l).filter((s) => runnable(s, ctx));
    for (let k = 0; k < perLesson && specs.length; k++) out.push(makeExercise(rng.weighted(specs, (s) => s.weight ?? 1), ctx, `placement:${l.id}#${k}`));
  }
  return rng.shuffle(out);
}

export const PLACEMENT_THRESHOLD = 0.9;
export const DEFAULT_MASTERY_THRESHOLD = 0.8;

/** Práctica por tipo de ejercicio (oído, lectura, ritmo): solo lecciones dominadas que usan esos generadores. */
export function practiceByGenerators(cur: Curriculum, gens: string[], mastered: ReadonlySet<ConceptId>, opts: SessionOptions): Exercise[] {
  const rng = new Rng(opts.seed ^ 0xabc);
  const length = opts.length ?? 12;
  const candidates = cur.lessons.filter((l) => mastered.has(l.concept) && l.exercises.some((e) => gens.includes(e.gen)));
  const out: Exercise[] = [];
  for (let i = 0; out.length < length && i < length * 6 && candidates.length; i++) {
    const lesson = rng.weighted(candidates, (l) => 1 + (opts.stats ? Object.entries(opts.stats).filter(([k]) => k.startsWith(l.concept)).reduce((a, [, s]) => a + s.wrong, 0) : 0));
    const ctx: GenContext = { rng, known: mastered, focus: lesson.concept, weight: weightFn(opts.stats) };
    const specs = lesson.exercises.filter((e) => gens.includes(e.gen) && runnable(e, ctx));
    if (!specs.length) continue;
    out.push(makeExercise(rng.pick(specs), ctx, `gen:${lesson.id}#${i}`));
  }
  return out;
}

export const PRACTICE_GROUPS: Record<string, string[]> = {
  intervals: ["intervalEar"],
  chords: ["chordEar", "guitarChordEar"],
  progressions: ["progressionEar", "cadenceIdentify"],
  melodic: ["melodicDictation"],
  rhythmic: ["rhythmDictation", "rhythmBuild"],
  scales: ["scaleEar", "modeIdentify"],
  reading: ["readNote", "findNote", "staffToKey", "tabRead", "drumPieceRead", "keySignature", "intervalName", "chordRead"],
  rhythm: ["figureValue", "rhythmSum", "measureComplete", "rhythmRead", "meterEar", "grooveRead", "grooveEar"],
};

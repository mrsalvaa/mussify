// SPDX-License-Identifier: GPL-3.0-or-later
// Progreso del usuario: dominio de conceptos, repaso espaciado, estadísticas e historial.
import { backend } from "../platform/bridge";
import type { ConceptId, Exercise } from "../core/curriculum/types";
import type { ItemStat, Mastery } from "../core/curriculum/engine";
import { type Card, newCard, review, qualityFromScore, dueCards } from "../core/curriculum/srs";

export interface HistoryEntry {
  ts: number;
  kind: "lesson" | "review" | "practice" | "placement" | "song" | "reading";
  id: string;
  ok: number;
  total: number;
  passed?: boolean;
}

export interface JournalEntry {
  ts: number;
  minutes: number;
  text: string;
}

export interface ProgressData {
  version: 1;
  mastered: Record<ConceptId, Mastery>;
  cards: Record<ConceptId, Card>;
  stats: Record<string, ItemStat>;
  genStats: Record<string, { seen: number; wrong: number }>;
  history: HistoryEntry[];
  days: string[];
  journal: JournalEntry[];
  /** Repaso de lo que "más se falla": conceptos con errores recientes. */
  recentMiss: Record<ConceptId, number>;
}

const empty = (): ProgressData => ({ version: 1, mastered: {}, cards: {}, stats: {}, genStats: {}, history: [], days: [], journal: [], recentMiss: {} });

export const progress = $state<ProgressData>(empty());

// Si no se pudo leer el progreso guardado, no se escribe encima (se perdería).
let loadFailed = false;

export async function loadProgress(): Promise<void> {
  try {
    const raw = await backend.kvGet("progress");
    if (raw) Object.assign(progress, { ...empty(), ...JSON.parse(raw) });
    loadFailed = false;
  } catch {
    loadFailed = true;
  }
}

let timer: ReturnType<typeof setTimeout> | undefined;
export function saveProgress(): void {
  if (loadFailed) return;
  clearTimeout(timer);
  timer = setTimeout(() => void backend.kvSet("progress", JSON.stringify($state.snapshot(progress))), 250);
}

export function resetLocalProgress(): void {
  Object.assign(progress, empty());
}

export function masteredSet(): Set<ConceptId> {
  return new Set(Object.keys(progress.mastered));
}

function today(ts = Date.now()): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function markDay() {
  const d = today();
  if (!progress.days.includes(d)) progress.days.push(d);
}

export function recordAnswer(ex: Exercise, correct: boolean): void {
  if (!progress.stats[ex.item]) progress.stats[ex.item] = { seen: 0, wrong: 0, last: 0 };
  const s = progress.stats[ex.item];
  s.seen++;
  if (!correct) s.wrong++;
  s.last = Date.now();
  if (!progress.genStats[ex.generator]) progress.genStats[ex.generator] = { seen: 0, wrong: 0 };
  const g = progress.genStats[ex.generator];
  g.seen++;
  if (!correct) g.wrong++;
  if (!correct) for (const c of ex.targets) progress.recentMiss[c] = Date.now();
  markDay();
  saveProgress();
}

/** Termina una lección: si supera el umbral, el concepto queda dominado. */
export function finishLesson(lessonId: ConceptId, concept: ConceptId, ok: number, total: number, threshold: number): boolean {
  const score = total ? ok / total : 0;
  const passed = score >= threshold;
  if (passed) {
    progress.mastered[concept] = { at: Date.now(), score };
    if (!progress.cards[concept]) progress.cards[concept] = newCard(concept, Date.now());
  }
  progress.history.unshift({ ts: Date.now(), kind: "lesson", id: lessonId, ok, total, passed });
  progress.history = progress.history.slice(0, 500);
  markDay();
  saveProgress();
  return passed;
}

/** Repaso: actualiza cada tarjeta según los aciertos de sus ejercicios. */
export function finishReview(results: { targets: ConceptId[]; correct: boolean }[], kind: HistoryEntry["kind"] = "review"): void {
  const per = new Map<ConceptId, { ok: number; total: number }>();
  for (const r of results)
    for (const c of r.targets) {
      if (!progress.mastered[c]) continue;
      const p = per.get(c) ?? { ok: 0, total: 0 };
      p.total++;
      if (r.correct) p.ok++;
      per.set(c, p);
    }
  const now = Date.now();
  for (const [c, p] of per) {
    const card = progress.cards[c] ?? newCard(c, now);
    progress.cards[c] = review(card, qualityFromScore(p.ok / p.total), now);
    if (p.ok === p.total) delete progress.recentMiss[c];
  }
  const ok = results.filter((r) => r.correct).length;
  progress.history.unshift({ ts: now, kind, id: kind, ok, total: results.length });
  markDay();
  saveProgress();
}

export function placementPass(concepts: ConceptId[]): void {
  const now = Date.now();
  for (const c of concepts) {
    if (!progress.mastered[c]) progress.mastered[c] = { at: now, score: 1, viaTest: true };
    if (!progress.cards[c]) progress.cards[c] = newCard(c, now);
  }
  saveProgress();
}

export function dueConcepts(): ConceptId[] {
  const now = Date.now();
  const due = dueCards(Object.values(progress.cards), now).map((c) => c.concept);
  const missed = Object.keys(progress.recentMiss).filter((c) => progress.mastered[c] && !due.includes(c));
  return [...due, ...missed].filter((c) => progress.mastered[c]);
}

export function streak(): number {
  const set = new Set(progress.days);
  let n = 0;
  const d = new Date();
  if (!set.has(today(d.getTime()))) d.setDate(d.getDate() - 1);
  while (set.has(today(d.getTime()))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function weeklySessions(): number {
  const now = new Date();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return progress.history.filter((h) => h.ts >= monday.getTime()).length;
}

export function weakestItems(n = 8): { item: string; seen: number; wrong: number; rate: number }[] {
  return Object.entries(progress.stats)
    .filter(([, s]) => s.seen >= 3 && s.wrong > 0)
    .map(([item, s]) => ({ item, seen: s.seen, wrong: s.wrong, rate: s.wrong / s.seen }))
    .sort((a, b) => b.rate - a.rate || b.wrong - a.wrong)
    .slice(0, n);
}

export function addJournal(minutes: number, text: string): void {
  progress.journal.unshift({ ts: Date.now(), minutes, text });
  markDay();
  saveProgress();
}

// SPDX-License-Identifier: GPL-3.0-or-later
// Repaso espaciado (variante de SM-2) por concepto dominado.

export interface Card {
  concept: string;
  /** Factor de facilidad (>= 1.3). */
  ease: number;
  /** Intervalo actual en días. */
  interval: number;
  reps: number;
  lapses: number;
  /** Próximo repaso (ms desde epoch). */
  due: number;
  last?: number;
}

const DAY = 24 * 3600 * 1000;

export function newCard(concept: string, now: number): Card {
  return { concept, ease: 2.5, interval: 1, reps: 0, lapses: 0, due: now + DAY, last: now };
}

/** Calidad 0..5 a partir de la fracción de aciertos en el repaso. */
export function qualityFromScore(fraction: number): number {
  if (fraction >= 0.95) return 5;
  if (fraction >= 0.85) return 4;
  if (fraction >= 0.7) return 3;
  if (fraction >= 0.5) return 2;
  if (fraction > 0) return 1;
  return 0;
}

export function review(card: Card, quality: number, now: number): Card {
  const c = { ...card };
  c.last = now;
  if (quality < 3) {
    c.reps = 0;
    c.lapses += 1;
    c.interval = 1;
  } else {
    c.reps += 1;
    if (c.reps === 1) c.interval = 1;
    else if (c.reps === 2) c.interval = 3;
    else c.interval = Math.round(c.interval * c.ease);
  }
  c.ease = Math.max(1.3, c.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  c.interval = Math.min(c.interval, 180);
  c.due = now + c.interval * DAY;
  return c;
}

export function dueCards(cards: Card[], now: number): Card[] {
  return cards.filter((c) => c.due <= now).sort((a, b) => a.due - b.due);
}

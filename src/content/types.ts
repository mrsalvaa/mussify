// SPDX-License-Identifier: GPL-3.0-or-later
// Formato del contenido localizado de las lecciones.
import type { Example } from "../core/curriculum/examples";
import type { QuizItem } from "../core/curriculum/gen";

/**
 * Bloques de una explicación. En el texto:
 *  - **negrita** para resaltar,
 *  - [[concepto|término]] para un término técnico (se vincula al glosario).
 */
export type Block = { p: string } | { tip: string } | { ex: Example; cap?: string };

export interface LessonContent {
  title: string;
  body: Block[];
  quiz?: QuizItem[];
}

export type LessonTexts = Record<string, LessonContent>;

export const P = (p: string): Block => ({ p });
export const TIP = (tip: string): Block => ({ tip });
export const EX = (ex: Example, cap?: string): Block => ({ ex, cap });
export const Q = (q: string, ...a: string[]): QuizItem => ({ q, a });
export const QU = (uses: string[], q: string, ...a: string[]): QuizItem => ({ q, a, uses });

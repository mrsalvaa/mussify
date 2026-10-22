// SPDX-License-Identifier: GPL-3.0-or-later
// Carga del contenido localizado (textos de lecciones y bancos de preguntas).
import { registerQuiz } from "../core/curriculum/gen";
import type { LessonContent, LessonTexts } from "./types";
import { ES_AR } from "./es-AR";

const LOCALES: Record<string, LessonTexts> = { "es-AR": ES_AR };
let current: LessonTexts = ES_AR;

export function loadContent(locale = "es-AR"): void {
  current = LOCALES[locale] ?? ES_AR;
  for (const [id, c] of Object.entries(current)) registerQuiz(id, c.quiz ?? []);
}

export function lessonContent(id: string): LessonContent | undefined {
  return current[id];
}

export function allContent(): LessonTexts {
  return current;
}

export const AVAILABLE_LOCALES = Object.keys(LOCALES);

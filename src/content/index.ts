// SPDX-License-Identifier: GPL-3.0-or-later
// Carga del contenido localizado (textos de lecciones, bancos de preguntas y fichas de canciones).
import { registerQuiz } from "../core/curriculum/gen";
import type { Song } from "../core/songs/song";
import type { LessonContent, LessonTexts } from "./types";
import { ES_AR } from "./es-AR";
import { SONGS_ES } from "./es-AR/songs";
import { EN } from "./en";
import { SONGS_EN } from "./en/songs";
import { setTermsLocale } from "./terms";

const LOCALES: Record<string, { lessons: LessonTexts; songs: Song[] }> = { en: { lessons: EN, songs: SONGS_EN }, "es-AR": { lessons: ES_AR, songs: SONGS_ES } };
let current = LOCALES.en;

export function loadContent(locale = "en"): void {
  current = LOCALES[locale] ?? LOCALES.en;
  setTermsLocale(LOCALES[locale] ? locale : "en");
  for (const [id, c] of Object.entries(current.lessons)) registerQuiz(id, c.quiz ?? []);
}

export function lessonContent(id: string): LessonContent | undefined {
  return current.lessons[id];
}

export function allContent(): LessonTexts {
  return current.lessons;
}

export function exampleSongs(): Song[] {
  return current.songs;
}

export const AVAILABLE_LOCALES = Object.keys(LOCALES);

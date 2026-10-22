// SPDX-License-Identifier: GPL-3.0-or-later
// Carga del contenido localizado (textos de lecciones, bancos de preguntas y fichas de canciones).
import { registerQuiz } from "../core/curriculum/gen";
import type { Song } from "../core/songs/song";
import type { LessonContent, LessonTexts } from "./types";
import { ES_AR } from "./es-AR";
import { SONGS_ES } from "./es-AR/songs";

const LOCALES: Record<string, { lessons: LessonTexts; songs: Song[] }> = { "es-AR": { lessons: ES_AR, songs: SONGS_ES } };
let current = LOCALES["es-AR"];

export function loadContent(locale = "es-AR"): void {
  current = LOCALES[locale] ?? LOCALES["es-AR"];
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

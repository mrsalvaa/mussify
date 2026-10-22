// SPDX-License-Identifier: GPL-3.0-or-later
// Ajustes del usuario (persistidos localmente).
import { backend } from "../platform/bridge";
import { setFormatPrefs, setLocale, DEFAULT_LOCALE, type Naming } from "../i18n";
import { loadContent } from "../content";

export interface Prefs {
  naming: Naming;
  theme: "light" | "dark" | "system";
  uiScale: number;
  highContrast: boolean;
  colorblind: boolean;
  a4: number;
  threshold: number;
  sessionLength: number;
  leftHanded: boolean;
  bass5: boolean;
  weeklyGoal: number;
  volume: number;
  locale: string;
  /** Vista del temario: índice de libro o mapa. */
  homeView: "book" | "map";
  /** Versión del formato de ajustes (para migraciones). */
  prefsVersion: number;
}

export const DEFAULT_PREFS: Prefs = {
  naming: "english",
  theme: "system",
  uiScale: 1,
  highContrast: false,
  colorblind: false,
  a4: 440,
  threshold: 0.8,
  sessionLength: 10,
  leftHanded: false,
  bass5: false,
  weeklyGoal: 5,
  volume: 0.8,
  locale: DEFAULT_LOCALE,
  homeView: "book",
  prefsVersion: 2,
};

export const prefs = $state<Prefs>({ ...DEFAULT_PREFS });

export async function loadPrefs(): Promise<void> {
  try {
    const raw = await backend.kvGet("prefs");
    if (raw) {
      const stored = JSON.parse(raw);
      Object.assign(prefs, { ...DEFAULT_PREFS, ...stored });
      // v0.4: el inglés pasa a ser el idioma por defecto
      if (!stored.prefsVersion) {
        prefs.locale = DEFAULT_LOCALE;
        prefs.naming = "english";
        prefs.prefsVersion = 2;
      }
    }
  } catch {
    /* valores por defecto */
  }
  applyPrefs();
}

/** Cambia el idioma (y la nomenclatura que le corresponde) y recarga la app. */
export async function changeLocale(l: string): Promise<void> {
  prefs.locale = l;
  prefs.naming = l === "en" ? "english" : "latin";
  await backend.kvSet("prefs", JSON.stringify(prefs));
  location.reload();
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
export function savePrefs(): void {
  applyPrefs();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void backend.kvSet("prefs", JSON.stringify(prefs)), 300);
}

export function applyPrefs(): void {
  setLocale(prefs.locale);
  loadContent(prefs.locale);
  setFormatPrefs({ naming: prefs.naming });
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const dark = prefs.theme === "dark" || (prefs.theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  root.dataset.theme = dark ? "dark" : "light";
  root.dataset.contrast = prefs.highContrast ? "high" : "normal";
  root.dataset.cb = prefs.colorblind ? "on" : "off";
  root.style.fontSize = `${Math.round(16 * prefs.uiScale)}px`;
  void backend.audioConfig(prefs.a4, prefs.volume);
}

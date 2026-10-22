// SPDX-License-Identifier: GPL-3.0-or-later
// Ajustes del usuario (persistidos localmente).
import { backend } from "../platform/bridge";
import { setFormatPrefs, type Naming } from "../i18n";

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
}

export const DEFAULT_PREFS: Prefs = {
  naming: "latin",
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
  locale: "es-AR",
};

export const prefs = $state<Prefs>({ ...DEFAULT_PREFS });

export async function loadPrefs(): Promise<void> {
  try {
    const raw = await backend.kvGet("prefs");
    if (raw) Object.assign(prefs, { ...DEFAULT_PREFS, ...JSON.parse(raw) });
  } catch {
    /* valores por defecto */
  }
  applyPrefs();
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
export function savePrefs(): void {
  applyPrefs();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void backend.kvSet("prefs", JSON.stringify(prefs)), 300);
}

export function applyPrefs(): void {
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

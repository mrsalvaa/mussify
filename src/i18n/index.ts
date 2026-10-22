// SPDX-License-Identifier: GPL-3.0-or-later
// Traducción de mensajes y formateo de etiquetas según la nomenclatura elegida.
import { ES_AR } from "./es-AR";
import { EN } from "./en";
import type { Label, Msg } from "../core/curriculum/types";
import { pcName, pitchName, LATIN_LETTERS, ENGLISH_LETTERS, type NamingStyle } from "../core/theory/pitch";
import type { Interval } from "../core/theory/interval";
import { chordSymbol, type Chord } from "../core/theory/chord";

const STRINGS: Record<string, Record<string, string>> = { en: EN, "es-AR": ES_AR };
export const DEFAULT_LOCALE = "en";
let strings = EN;
let locale = DEFAULT_LOCALE;

export type Naming = "latin" | "english" | "both";
export interface FormatPrefs {
  naming: Naming;
}
let prefs: FormatPrefs = { naming: "latin" };

export function setLocale(l: string): void {
  locale = STRINGS[l] ? l : DEFAULT_LOCALE;
  strings = STRINGS[locale];
  if (typeof document !== "undefined") document.documentElement.lang = locale;
}

export function currentLocale(): string {
  return locale;
}

export const LOCALE_NAMES: Record<string, string> = { en: "English", "es-AR": "Español (Argentina)" };

/** Nombre de un intervalo en el idioma actual ("major third" / "tercera mayor"). */
export function intervalText(iv: Interval, short = false): string {
  if (short) return t("iv.short", { n: iv.size, q: t(`ivqs.${iv.quality}`) });
  if (iv.size === 1 && iv.quality === "P") return t("iv.unison");
  if (iv.size === 8 && iv.quality === "P") return t("iv.octave");
  const size = hasKey(`ivs.${iv.size}`) ? t(`ivs.${iv.size}`) : `${iv.size}`;
  return t("iv.fmt", { size, q: t(`ivq.${iv.quality}`) });
}

/** Errores del backend: "E_CODIGO" o "E_CODIGO::detalle" se traducen; el resto se muestra tal cual. */
export function localizeError(e: unknown): string {
  const s = String(e).replace(/^Error:\s*/, "");
  const m = /^E_([A-Z_]+)(?:::([\s\S]*))?$/.exec(s);
  if (!m) return s;
  const key = "err." + m[1].toLowerCase().replace(/_([a-z])/g, (_x, c: string) => c.toUpperCase());
  return hasKey(key) ? t(key, { detail: m[2] ?? "" }) : s;
}

export function setFormatPrefs(p: FormatPrefs): void {
  prefs = p;
}

export function hasKey(key: string): boolean {
  return key in strings;
}

/** Texto plano de una clave, con parámetros simples. */
export function t(key: string, params: Record<string, string | number> = {}): string {
  let s = strings[key];
  if (s === undefined) return key;
  for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Elige una variante al azar de un texto con "|" (felicitaciones, etc.). */
export function tPick(key: string): string {
  const opts = t(key).split("|");
  return opts[Math.floor(Math.random() * opts.length)];
}

function pcText(p: { letter: number; acc: number }): string {
  const lat = pcName(p as never, "latin");
  const eng = pcName(p as never, "english");
  if (prefs.naming === "english") return eng;
  if (prefs.naming === "both") return `${lat} (${eng})`;
  return lat;
}

function chordText(c: Chord): string {
  const style: NamingStyle = prefs.naming === "english" ? "english" : "latin";
  if (prefs.naming === "both") return `${chordSymbol(c, "latin")} (${chordSymbol(c, "english")})`;
  return chordSymbol(c, style);
}

export function formatMsg(m: Msg): string {
  if (m.key === "name.latin") return LATIN_LETTERS[Number(m.params?.l)];
  if (m.key === "name.english") return ENGLISH_LETTERS[Number(m.params?.l)];
  if (m.key === "chord.latin" || m.key === "chord.english") {
    const c = m.params?.chord;
    if (c && typeof c === "object" && c.kind === "chord") return chordSymbol(c.chord, m.key === "chord.latin" ? "latin" : "english");
  }
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(m.params ?? {})) params[k] = typeof v === "object" ? formatLabel(v) : String(v);
  return t(m.key, params);
}

/** Texto de una etiqueta (las que son gráficas devuelven una descripción corta). */
export function formatLabel(l: Label): string {
  switch (l.kind) {
    case "text":
      return l.text;
    case "msg":
      return formatMsg(l.msg);
    case "pc":
      return pcText(l.pc);
    case "pitch":
      return prefs.naming === "english" ? pitchName(l.pitch, "english") : pitchName(l.pitch, "latin");
    case "interval":
      return intervalText(l.iv, l.short);
    case "chord":
      return chordText(l.chord);
    case "number":
      return String(l.n);
    case "names":
      return l.items.map(formatLabel).join(" – ");
    case "audio":
      return l.text ? formatMsg(l.text) : "♪";
    case "score":
      return "𝄞";
    case "diagram":
      return l.shape.chord;
  }
}

/** Nombre de nota corto para teclas y trastes. */
export function noteLabel(p: { letter: number; acc: number }): string {
  return prefs.naming === "english" ? pcName(p as never, "english") : pcName(p as never, "latin");
}

/** Convierte texto con **negrita**, *cursiva* y [[concepto|término]] en HTML seguro. */
export function richText(s: string): string {
  const esc = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '<span class="term" data-concept="$1">$2</span>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}

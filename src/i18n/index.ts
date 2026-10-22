// SPDX-License-Identifier: GPL-3.0-or-later
// Traducción de mensajes y formateo de etiquetas según la nomenclatura elegida.
import { ES_AR } from "./es-AR";
import type { Label, Msg } from "../core/curriculum/types";
import { pcName, pitchName, LATIN_LETTERS, ENGLISH_LETTERS, type NamingStyle } from "../core/theory/pitch";
import { intervalName, intervalShort } from "../core/theory/interval";
import { chordSymbol, type Chord } from "../core/theory/chord";

const STRINGS: Record<string, Record<string, string>> = { "es-AR": ES_AR };
let strings = ES_AR;

export type Naming = "latin" | "english" | "both";
export interface FormatPrefs {
  naming: Naming;
}
let prefs: FormatPrefs = { naming: "latin" };

export function setLocale(l: string): void {
  strings = STRINGS[l] ?? ES_AR;
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
      return l.short ? intervalShort(l.iv) : intervalName(l.iv);
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

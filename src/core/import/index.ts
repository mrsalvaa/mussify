// SPDX-License-Identifier: GPL-3.0-or-later
// Importación de archivos propios y control de contenido no aprendido.
import { midiToScore } from "./midi";
import { alphaTabToScore } from "./alphatab";
import { parseTextTab } from "./texttab";
import { midi as midiOf } from "../theory/pitch";
import { parseChord } from "../theory/chord";
import type { Score, Staff } from "../notation/score";
import { scoreRequirements, missing } from "../curriculum/extract";
import { chordLabelOk } from "../curriculum/audit";
import type { ConceptId, Requirement } from "../curriculum/types";

export type ImportKind = "midi" | "musicxml" | "guitarpro" | "texttab" | "audio" | "unknown";

const AUDIO_EXT = ["mp3", "ogg", "oga", "flac", "wav", "opus", "m4a"];

export function detectKind(name: string, head?: Uint8Array): ImportKind {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (ext === "mid" || ext === "midi" || ext === "kar") return "midi";
  if (["xml", "musicxml", "mxl"].includes(ext)) return "musicxml";
  if (["gp", "gp3", "gp4", "gp5", "gpx", "gp7"].includes(ext)) return "guitarpro";
  if (["txt", "tab", "crd"].includes(ext)) return "texttab";
  if (AUDIO_EXT.includes(ext)) return "audio";
  if (head && head.length > 4) {
    const sig = String.fromCharCode(...head.slice(0, 4));
    if (sig === "MThd") return "midi";
  }
  return "unknown";
}

export interface ImportResult {
  kind: ImportKind;
  score: Score;
  chordLines?: string[];
}

export function importScore(name: string, data: Uint8Array): ImportResult {
  const kind = detectKind(name, data);
  switch (kind) {
    case "midi":
      return { kind, score: midiToScore(data) };
    case "musicxml":
    case "guitarpro":
      return { kind, score: alphaTabToScore(data) };
    case "texttab": {
      const r = parseTextTab(new TextDecoder().decode(data));
      return { kind, score: r.score, chordLines: r.chordLines };
    }
    default:
      throw new Error("Formato no soportado para partitura");
  }
}

/** Sub-partitura de un solo compás de un pentagrama (para auditar por compás). */
function measureScore(score: Score, staff: Staff, mi: number): Score {
  let ts = score.timeSig, key = score.keyFifths;
  for (let i = 0; i <= mi; i++) {
    const m = staff.measures[i];
    if (m?.timeSig) ts = m.timeSig;
    if (m?.keyFifths !== undefined) key = m.keyFifths;
  }
  return { ...score, timeSig: ts, keyFifths: key, staves: [{ ...staff, measures: [staff.measures[mi]] }] };
}

export interface ImportReport {
  /** Requisitos que faltan en toda la partitura. */
  missing: Requirement[];
  /** Por pentagrama: compases con contenido no aprendido. */
  unknownMeasures: Record<string, number[]>;
  /** Cifrados del archivo que todavía no conocés. */
  unknownChords: string[];
  allKnown: boolean;
}

export function analyzeImport(score: Score, known: ReadonlySet<ConceptId>): ImportReport {
  const unknownMeasures: Record<string, number[]> = {};
  for (const st of score.staves) {
    const list: number[] = [];
    st.measures.forEach((_, mi) => {
      if (missing(scoreRequirements(measureScore(score, st, mi)), known).length) list.push(mi);
    });
    unknownMeasures[st.id] = list;
  }
  const chordSet = new Set<string>();
  for (const st of score.staves) for (const m of st.measures) for (const e of m.events) if (e.chord) chordSet.add(e.chord);
  const unknownChords = [...chordSet].filter((c) => {
    const p = parseChord(c);
    return !p || !chordLabelOk(p, known);
  });
  const miss = missing(scoreRequirements(score), known);
  return { missing: miss, unknownMeasures, unknownChords, allKnown: miss.length === 0 && unknownChords.length === 0 };
}

/** Versión simplificada: solo la melodía (la nota más aguda) del pentagrama elegido. */
export function melodyOnly(score: Score, staffId?: string): Score {
  const st = score.staves.find((s) => s.id === staffId) ?? score.staves.find((s) => s.instrument !== "drums") ?? score.staves[0];
  return {
    ...score,
    staves: [
      {
        ...st,
        showTab: false,
        measures: st.measures.map((m) => ({
          ...m,
          events: m.events.map((e) => {
            const ps = e.notes.filter((n) => n.pitch);
            if (!ps.length) return { ...e, notes: [], chord: undefined };
            const top = ps.reduce((a, b) => (midiOf(a.pitch!) >= midiOf(b.pitch!) ? a : b));
            return { ...e, notes: [{ pitch: top.pitch, tie: top.tie }], chord: undefined };
          }),
        })),
      },
    ],
  };
}

/** Quita los cifrados que todavía no se conocen. */
export function knownChordsOnly(score: Score, known: ReadonlySet<ConceptId>): Score {
  return {
    ...score,
    staves: score.staves.map((st) => ({
      ...st,
      measures: st.measures.map((m) => ({
        ...m,
        events: m.events.map((e) => {
          if (!e.chord) return e;
          const p = parseChord(e.chord);
          return p && chordLabelOk(p, known) ? e : { ...e, chord: undefined };
        }),
      })),
    })),
  };
}

export { midiToScore, alphaTabToScore, parseTextTab };

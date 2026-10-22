// SPDX-License-Identifier: GPL-3.0-or-later
// Corrección de respuestas (independiente de la UI).
import type { Answer } from "./types";
import { type PitchClass, chroma, midi, samePc, fromMidi } from "../theory/pitch";

export type Response =
  | { kind: "choice"; index: number }
  | { kind: "keys"; notes: number[] }
  | { kind: "frets"; positions: { string: number; fret: number }[] }
  | { kind: "names"; pcs: PitchClass[] }
  | { kind: "rhythm"; tokens: string[] }
  | { kind: "staff"; step: number };

function fretMidi(tuning: { letter: number; acc: number; octave: number }[], s: number, f: number): number {
  return midi(tuning[s - 1] as never) + f;
}

export function checkAnswer(a: Answer, r: Response): boolean {
  switch (a.kind) {
    case "choice":
      return r.kind === "choice" && r.index === a.correct;
    case "keys": {
      if (r.kind !== "keys") return false;
      const tgt = a.target.map(midi);
      if (a.mode === "single") {
        const n = r.notes[0];
        return n !== undefined && (a.match === "exact" ? n === tgt[0] : chroma(fromMidi(n)) === chroma(a.target[0]));
      }
      if (a.mode === "set") {
        if (a.match === "exact") {
          const s = new Set(r.notes);
          return s.size === tgt.length && tgt.every((x) => s.has(x));
        }
        const want = new Set(a.target.map((p) => chroma(p)));
        const got = new Set(r.notes.map((n) => ((n % 12) + 12) % 12));
        return want.size === got.size && [...want].every((x) => got.has(x));
      }
      return r.notes.length === tgt.length && r.notes.every((n, i) => (a.match === "exact" ? n === tgt[i] : ((n - tgt[i]) % 12) === 0));
    }
    case "frets": {
      if (r.kind !== "frets") return false;
      const key = (p: { string: number; fret: number }) => `${p.string}:${p.fret}`;
      if (a.mode === "single") {
        const p = r.positions[0];
        if (!p) return false;
        if (a.match === "position") return a.target.some((t) => key(t) === key(p));
        const m = fretMidi(a.tuning, p.string, p.fret);
        if (a.match === "pitch") return a.target.some((t) => fretMidi(a.tuning, t.string, t.fret) === m);
        return a.target.some((t) => (fretMidi(a.tuning, t.string, t.fret) - m) % 12 === 0);
      }
      if (a.mode === "set") {
        const s = new Set(r.positions.map(key));
        return s.size === a.target.length && a.target.every((t) => s.has(key(t)));
      }
      return r.positions.length === a.target.length && r.positions.every((p, i) => fretMidi(a.tuning, p.string, p.fret) === fretMidi(a.tuning, a.target[i].string, a.target[i].fret));
    }
    case "names":
      return r.kind === "names" && r.pcs.length === a.target.length && r.pcs.every((p, i) => samePc(p, a.target[i]));
    case "rhythm":
      return r.kind === "rhythm" && r.tokens.length === a.target.length && r.tokens.every((x, i) => x === a.target[i]);
    case "staff":
      return r.kind === "staff" && a.target.includes(r.step);
  }
}

/** Cuántos elementos espera la respuesta (para auto-comprobar secuencias). */
export function expectedLength(a: Answer): number {
  switch (a.kind) {
    case "keys":
      return a.mode === "single" ? 1 : a.target.length;
    case "frets":
      return a.mode === "single" ? 1 : a.target.length;
    case "names":
      return a.target.length;
    case "rhythm":
      return a.target.length;
    default:
      return 1;
  }
}

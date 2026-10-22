// SPDX-License-Identifier: GPL-3.0-or-later
// Batería: piezas, ubicación en el pentagrama de percusión y mapeo General MIDI.
import type { DrumPiece } from "../notation/score";
import { P, type Pitch } from "../theory/pitch";

export interface DrumPieceDef {
  id: DrumPiece;
  name: string;
  short: string;
  /** Posición en el pentagrama (se dibuja como si fuera clave de Sol). */
  staffPos: Pitch;
  head: "normal" | "x" | "circleX";
  gm: number;
  /** Concepto de lectura asociado. */
  concept: string;
}

export const DRUM_PIECES: DrumPieceDef[] = [
  { id: "kick", name: "bombo", short: "Bombo", staffPos: P("F4"), head: "normal", gm: 36, concept: "dr.read.kick" },
  { id: "snare", name: "redoblante", short: "Redo", staffPos: P("C5"), head: "normal", gm: 38, concept: "dr.read.snare" },
  { id: "sideStick", name: "aro del redoblante", short: "Aro", staffPos: P("C5"), head: "circleX", gm: 37, concept: "dr.read.sideStick" },
  { id: "hhClosed", name: "hi-hat cerrado", short: "HH", staffPos: P("G5"), head: "x", gm: 42, concept: "dr.read.hhClosed" },
  { id: "hhOpen", name: "hi-hat abierto", short: "HH ab.", staffPos: P("G5"), head: "circleX", gm: 46, concept: "dr.read.hhOpen" },
  { id: "hhPedal", name: "hi-hat con el pie", short: "Pie HH", staffPos: P("D4"), head: "x", gm: 44, concept: "dr.read.hhPedal" },
  { id: "crash", name: "platillo crash", short: "Crash", staffPos: P("A5"), head: "x", gm: 49, concept: "dr.read.crash" },
  { id: "ride", name: "platillo ride", short: "Ride", staffPos: P("F5"), head: "x", gm: 51, concept: "dr.read.ride" },
  { id: "rideBell", name: "campana del ride", short: "Campana", staffPos: P("F5"), head: "circleX", gm: 53, concept: "dr.read.rideBell" },
  { id: "tomHigh", name: "tom agudo", short: "Tom 1", staffPos: P("E5"), head: "normal", gm: 50, concept: "dr.read.tomHigh" },
  { id: "tomMid", name: "tom medio", short: "Tom 2", staffPos: P("D5"), head: "normal", gm: 47, concept: "dr.read.tomMid" },
  { id: "tomFloor", name: "tom de piso (chancha)", short: "Chancha", staffPos: P("A4"), head: "normal", gm: 43, concept: "dr.read.tomFloor" },
];

export const DRUMS: Record<DrumPiece, DrumPieceDef> = Object.fromEntries(DRUM_PIECES.map((d) => [d.id, d])) as Record<DrumPiece, DrumPieceDef>;

export function drumFromGm(note: number): DrumPiece | null {
  const exact = DRUM_PIECES.find((d) => d.gm === note);
  if (exact) return exact.id;
  // Aproximaciones para notas GM que no modelamos aparte.
  const approx: Record<number, DrumPiece> = {
    35: "kick", 40: "snare", 39: "snare", 41: "tomFloor", 45: "tomMid", 48: "tomHigh", 57: "crash", 52: "crash", 55: "crash", 59: "ride", 54: "hhClosed",
  };
  return approx[note] ?? null;
}

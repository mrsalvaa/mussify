// SPDX-License-Identifier: GPL-3.0-or-later
// Lectura rápida: compases al azar con solo notas y figuras ya aprendidas.
import type { Pitch } from "../theory/pitch";
import { Rng } from "../random";
import { singleStaffScore, type Score } from "../notation/score";
import { randomRhythm } from "./gen/rhythm";
import { readableNotes, knownTimeSigs } from "./gen/common";
import type { ConceptId, GenContext } from "./types";

export interface SightMeasure {
  score: Score;
  pitches: Pitch[];
}

export function sightMeasure(known: ReadonlySet<ConceptId>, seed: number, tempo = 60): SightMeasure | null {
  const rng = new Rng(seed);
  const clef = known.has("clef.bass") && readableNotes(known, "bass").length >= 5 && rng.bool(0.3) ? "bass" : "treble";
  const pool = readableNotes(known, clef);
  if (pool.length < 3) return null;
  const tss = knownTimeSigs(known).filter((t) => !(t.num % 3 === 0 && t.num > 3));
  if (!tss.length) return null;
  const ts = rng.pick(tss);
  const ctx: GenContext = { rng, known: new Set([...known].filter((k) => !k.startsWith("rest.") && k !== "rh.tie" && k !== "rh.16" && k !== "rh.32" && k !== "rh.triplet")), focus: "", weight: () => 1 };
  const events = randomRhythm(ctx, ts, 1, { noRestStart: true });
  if (!events) return null;
  let i = rng.int(0, pool.length - 1);
  const pitches: Pitch[] = [];
  for (const e of events) {
    i = Math.max(0, Math.min(pool.length - 1, i + rng.pick([-2, -1, 1, 2, 0, 3, -3])));
    e.notes = [{ pitch: pool[i] }];
    pitches.push(pool[i]);
  }
  return { score: singleStaffScore({ clef, events, timeSig: ts, tempo }), pitches };
}

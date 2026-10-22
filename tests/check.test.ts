// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { checkAnswer } from "../src/core/curriculum/check";
import { P, pc } from "../src/core/theory/pitch";
import { STANDARD } from "../src/core/instruments/fretted";

describe("corrección de respuestas", () => {
  it("teclado: exacto, por clase de altura, conjunto y secuencia", () => {
    expect(checkAnswer({ kind: "keys", mode: "single", target: [P("C4")], match: "exact", from: 48, to: 72 }, { kind: "keys", notes: [60] })).toBe(true);
    expect(checkAnswer({ kind: "keys", mode: "single", target: [P("C4")], match: "exact", from: 48, to: 72 }, { kind: "keys", notes: [72] })).toBe(false);
    expect(checkAnswer({ kind: "keys", mode: "single", target: [P("C4")], match: "pc", from: 48, to: 72 }, { kind: "keys", notes: [72] })).toBe(true);
    expect(checkAnswer({ kind: "keys", mode: "set", target: [P("C4"), P("E4"), P("G4")], match: "pc", from: 48, to: 72 }, { kind: "keys", notes: [67, 52, 60] })).toBe(true);
    expect(checkAnswer({ kind: "keys", mode: "sequence", target: [P("C4"), P("D4")], match: "exact", from: 48, to: 72 }, { kind: "keys", notes: [60, 62] })).toBe(true);
  });
  it("diapasón: posición, misma altura y conjunto", () => {
    const tuning = STANDARD.strings;
    expect(checkAnswer({ kind: "frets", mode: "single", instrument: "guitar", tuning, frets: 12, target: [{ string: 1, fret: 3 }], match: "position" }, { kind: "frets", positions: [{ string: 1, fret: 3 }] })).toBe(true);
    expect(checkAnswer({ kind: "frets", mode: "single", instrument: "guitar", tuning, frets: 12, target: [{ string: 2, fret: 5 }], match: "pitch" }, { kind: "frets", positions: [{ string: 1, fret: 0 }] })).toBe(true);
    expect(checkAnswer({ kind: "frets", mode: "single", instrument: "guitar", tuning, frets: 12, target: [{ string: 6, fret: 3 }], match: "pc" }, { kind: "frets", positions: [{ string: 1, fret: 3 }] })).toBe(true);
    expect(checkAnswer({ kind: "frets", mode: "set", instrument: "guitar", tuning, frets: 12, target: [{ string: 5, fret: 2 }, { string: 4, fret: 2 }], match: "position" }, { kind: "frets", positions: [{ string: 4, fret: 2 }, { string: 5, fret: 2 }] })).toBe(true);
  });
  it("nombres y ritmo", () => {
    expect(checkAnswer({ kind: "names", target: [pc(0), pc(2)], choices: [] }, { kind: "names", pcs: [pc(0), pc(2)] })).toBe(true);
    expect(checkAnswer({ kind: "rhythm", target: ["q", "8", "8", "h"], choices: [], total: 1 }, { kind: "rhythm", tokens: ["q", "8", "8", "h"] })).toBe(true);
    expect(checkAnswer({ kind: "choice", options: [], correct: 2 }, { kind: "choice", index: 1 })).toBe(false);
  });
});

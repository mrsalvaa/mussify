// SPDX-License-Identifier: GPL-3.0-or-later
// Variedad de las sesiones: sin preguntas repetidas seguidas, distintos enfoques y material variado.
import { describe, expect, it } from "vitest";
import { Curriculum, lessonSession, reviewSession, exerciseSignature } from "../src/core/curriculum/engine";
import { auditExercise } from "../src/core/curriculum/audit";
import { checkAnswer } from "../src/core/curriculum/check";
import { loadContent } from "../src/content";
import type { Exercise } from "../src/core/curriculum/types";

loadContent("en");
const cur = new Curriculum();

function sessionOf(id: string, seed: number): Exercise[] {
  const l = cur.byConcept.get(id)!;
  return lessonSession(cur, l, cur.closure(id), { seed });
}

describe("variedad de las sesiones", () => {
  it("ninguna lección repite la misma pregunta dos veces seguidas", () => {
    for (const l of cur.lessons) {
      for (let seed = 1; seed <= 4; seed++) {
        const s = lessonSession(cur, l, cur.closure(l.concept), { seed });
        for (let i = 1; i < s.length; i++) expect(exerciseSignature(s[i]), `${l.id} #${i}`).not.toBe(exerciseSignature(s[i - 1]));
      }
    }
  });

  it("el repaso tampoco repite seguido", () => {
    const all = cur.topoOrder();
    const mastered = new Set(all.slice(0, 120));
    for (let seed = 1; seed <= 6; seed++) {
      const s = reviewSession(cur, [...mastered].slice(0, 10), mastered, { seed });
      for (let i = 1; i < s.length; i++) expect(exerciseSignature(s[i])).not.toBe(exerciseSignature(s[i - 1]));
    }
  });

  it("la lección de Sol (una sola nota conocida) mezcla varios tipos de ejercicio", () => {
    for (let seed = 1; seed <= 5; seed++) {
      const s = sessionOf("read.treble.G4", seed);
      expect(s.length).toBeGreaterThanOrEqual(8);
      const kinds = new Set(s.map((e) => e.generator));
      expect(kinds.size, [...kinds].join(",")).toBeGreaterThanOrEqual(3);
      expect(kinds.has("placeNote")).toBe(true);
      const readNotes = s.filter((e) => e.generator === "readNote").length;
      expect(readNotes).toBeLessThanOrEqual(2);
    }
  });

  it("las preguntas de octava usan registros y distancias variadas", () => {
    const pairs = new Set<string>();
    const spans = new Set<number>();
    for (let seed = 1; seed <= 20; seed++) {
      for (const e of sessionOf("t.octave", seed)) {
        if (!e.prompt.audio) continue;
        const [a, b] = e.prompt.audio.events.map((x) => x.note);
        pairs.add(`${a}-${b}`);
        if ((b - a) % 12 === 0) spans.add(Math.abs(b - a) / 12);
      }
    }
    expect(pairs.size).toBeGreaterThan(40);
    expect([...spans].sort()).toEqual([1, 2, 3]);
  });

  it("tocar el pentagrama: la respuesta correcta es la posición de la nota", () => {
    for (let seed = 1; seed <= 10; seed++) {
      for (const e of sessionOf("read.treble.C4", seed).filter((x) => x.answer.kind === "staff")) {
        const a = e.answer as Extract<Exercise["answer"], { kind: "staff" }>;
        expect(checkAnswer(a, { kind: "staff", step: a.target[0] })).toBe(true);
        expect(checkAnswer(a, { kind: "staff", step: a.target[0] + 1 })).toBe(false);
        expect(auditExercise(e, new Set([...cur.closure("read.treble.C4"), "read.treble.C4"]))).toEqual([]);
      }
    }
  });
});

describe("reconocer notas de oído (progresivo)", () => {
  const absOf = (id: string) => {
    const out: Exercise[] = [];
    for (let seed = 1; seed <= 40; seed++) out.push(...sessionOf(id, seed).filter((e) => e.generator === "absNote"));
    return out;
  };

  it("con una sola nota conocida es sí/no", () => {
    const ex = absOf("read.treble.G4");
    expect(ex.length).toBeGreaterThan(0);
    for (const e of ex) expect(e.prompt.text.key).toBe("ex.absNote.isIt");
  });

  it("al principio pocas opciones y notas lejanas; después más opciones", () => {
    const early = absOf("read.treble.A4");
    for (const e of early) if (e.answer.kind === "choice") expect(e.answer.options.length).toBe(2);
    const later = absOf("read.treble.G5");
    expect(Math.max(...later.map((e) => (e.answer.kind === "choice" ? e.answer.options.length : 0)))).toBe(4);
  });

  it("con alteraciones la nota suena en distintas octavas", () => {
    const octs = new Set<number>();
    for (const e of absOf("acc.flat")) if (e.prompt.audio) octs.add(Math.floor(e.prompt.audio.events[0].note / 12));
    expect(octs.size).toBeGreaterThanOrEqual(2);
  });
});

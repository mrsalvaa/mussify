// SPDX-License-Identifier: GPL-3.0-or-later
// Tests de la regla maestra: progresión estrictamente lineal.
// Auditan, con muchas semillas, que ningún ejercicio muestre algo que no se aprendió.
import { describe, expect, it } from "vitest";
import { Curriculum, lessonSession, reviewSession, placementBlocks, placementSession } from "../src/core/curriculum/engine";
import { auditExercise } from "../src/core/curriculum/audit";
import { BRANCHES, type ConceptId } from "../src/core/curriculum/types";
import { GENERATORS } from "../src/core/curriculum/gen";
import { loadContent } from "../src/content";

loadContent("es-AR");
const cur = new Curriculum();
const SEEDS = Number(process.env.MUSSIFY_SEEDS ?? 12);

describe("grafo de prerrequisitos", () => {
  it("no tiene ciclos", () => {
    expect(() => cur.topoOrder()).not.toThrow();
  });

  it("todo requisito existe como lección", () => {
    for (const l of cur.lessons) for (const r of cur.prereqs(l.concept)) expect(cur.byConcept.has(r), `${l.concept} requiere ${r}, que no tiene lección`).toBe(true);
  });

  it("cada rama es una línea: cada lección requiere la anterior de su rama", () => {
    for (const b of BRANCHES) {
      const list = cur.byBranch.get(b)!;
      list.forEach((l, i) => {
        if (i > 0) expect(cur.prereqs(l.concept)).toContain(list[i - 1].concept);
      });
    }
  });

  it("las ramas de instrumento no requieren lecciones de otros instrumentos", () => {
    for (const l of cur.lessons) {
      if (l.branch === "trunk") continue;
      for (const r of l.requires) {
        const rb = cur.byConcept.get(r)!.branch;
        expect(rb === "trunk" || rb === l.branch, `${l.concept} requiere ${r} (${rb})`).toBe(true);
      }
    }
  });

  it("todos los generadores usados existen", () => {
    for (const l of cur.lessons) for (const e of l.exercises) expect(GENERATORS[e.gen], `${l.id}: ${e.gen}`).toBeDefined();
  });
});

describe("cada lección usa solo lo aprendido + su concepto nuevo", () => {
  for (const lesson of new Curriculum().lessons) {
    it(lesson.concept, () => {
      const mastered = cur.closure(lesson.concept);
      const known = new Set<ConceptId>([...mastered, lesson.concept]);
      let practicedFocus = 0;
      for (let seed = 1; seed <= SEEDS; seed++) {
        const session = lessonSession(cur, lesson, mastered, { seed: seed * 7919 });
        expect(session.length, `la lección ${lesson.id} no generó ejercicios`).toBeGreaterThan(0);
        for (const ex of session) {
          const problems = auditExercise(ex, known);
          expect(problems, `${lesson.id} / ${ex.generator}: ${problems.join("; ")}`).toEqual([]);
          if (ex.targets.includes(lesson.concept) || ex.uses.includes(lesson.concept)) practicedFocus++;
        }
      }
      expect(practicedFocus, `${lesson.id} nunca practica su concepto nuevo`).toBeGreaterThan(0);
    });
  }
});

describe("desde cero absoluto", () => {
  it("el primer ejercicio de cada rama solo usa lo recién enseñado", () => {
    for (const b of BRANCHES) {
      const first = cur.byBranch.get(b)![0];
      const mastered = cur.closure(first.concept);
      const known = new Set([...mastered, first.concept]);
      for (let seed = 1; seed <= 30; seed++) {
        const [ex] = lessonSession(cur, first, mastered, { seed });
        expect(auditExercise(ex, known)).toEqual([]);
        for (const u of ex.uses) expect(known.has(u), `${b}: ${u}`).toBe(true);
      }
    }
  });

  it("al empezar solo están disponibles las lecciones sin requisitos", () => {
    const none = new Set<ConceptId>();
    const available = cur.lessons.filter((l) => cur.isUnlocked(l.concept, none));
    for (const l of available) expect(cur.prereqs(l.concept)).toEqual([]);
    expect(available.map((l) => l.concept)).toEqual(["t.sound"]);
  });
});

describe("repaso y test de nivel", () => {
  it("el repaso solo usa conceptos dominados", () => {
    const order = cur.topoOrder();
    for (const cut of [10, 40, 90, 150, order.length]) {
      const mastered = new Set(order.slice(0, cut));
      for (let seed = 1; seed <= 4; seed++) {
        const ex = reviewSession(cur, [...mastered].slice(-15), mastered, { seed });
        for (const e of ex) expect(auditExercise(e, mastered), e.generator).toEqual([]);
      }
    }
  });

  it("el test de nivel de cada bloque solo usa lo del bloque y lo anterior", () => {
    for (const b of BRANCHES) {
      let mastered = new Set<ConceptId>();
      for (const block of placementBlocks(cur, b)) {
        for (const ext of block.external) for (const c of [ext, ...cur.closure(ext)]) mastered.add(c);
        const known = new Set([...mastered, ...block.lessons.map((l) => l.concept)]);
        const ex = placementSession(cur, block, mastered, 42);
        for (const e of ex) expect(auditExercise(e, known), `${b}#${block.index} ${e.generator}`).toEqual([]);
        mastered = known;
      }
    }
  });
});

import { practiceByGenerators, PRACTICE_GROUPS, practiceSession } from "../src/core/curriculum/engine";
describe("práctica por tipo", () => {
  it("solo usa lo dominado", () => {
    const order = cur.topoOrder();
    for (const cut of [30, 120, order.length]) {
      const mastered = new Set(order.slice(0, cut));
      for (const gens of Object.values(PRACTICE_GROUPS)) for (const e of practiceByGenerators(cur, gens, mastered, { seed: cut })) expect(auditExercise(e, mastered), e.generator).toEqual([]);
      for (const e of practiceSession(cur, "all", mastered, { seed: cut })) expect(auditExercise(e, mastered)).toEqual([]);
    }
  });
});

import { sightMeasure } from "../src/core/curriculum/sight";
import { scoreRequirements, missing } from "../src/core/curriculum/extract";
describe("lectura rápida", () => {
  it("solo usa notas, figuras y compases aprendidos", () => {
    const order = cur.topoOrder();
    for (const cut of [40, 70, 130, order.length]) {
      const known = new Set(order.slice(0, cut));
      for (let s = 1; s < 40; s++) {
        const m = sightMeasure(known, s);
        if (m) expect(missing(scoreRequirements(m.score), known)).toEqual([]);
      }
    }
  });
});

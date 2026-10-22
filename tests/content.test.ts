// SPDX-License-Identifier: GPL-3.0-or-later
// Tests del contenido: cada lección tiene textos, ejemplos y vocabulario controlado.
import { describe, expect, it } from "vitest";
import { Curriculum } from "../src/core/curriculum/engine";
import { auditExample, buildExample } from "../src/core/curriculum/examples";
import { allContent, loadContent } from "../src/content";
import { TERMS_ES, stripMarkers } from "../src/content/terms";
import type { ConceptId } from "../src/core/curriculum/types";

loadContent("es-AR");
const cur = new Curriculum();
const content = allContent();

function textsOf(id: string): string[] {
  const c = content[id];
  if (!c) return [];
  const out = [c.title];
  for (const b of c.body) {
    if ("p" in b) out.push(b.p);
    if ("tip" in b) out.push(b.tip);
    if ("cap" in b && b.cap) out.push(b.cap);
  }
  for (const q of c.quiz ?? []) out.push(q.q, ...q.a);
  return out;
}

describe("contenido es-AR", () => {
  it("cada lección tiene contenido y no sobra contenido", () => {
    const missing = cur.lessons.filter((l) => !content[l.id]).map((l) => l.id);
    expect(missing).toEqual([]);
    const extra = Object.keys(content).filter((id) => !cur.byConcept.has(id));
    expect(extra).toEqual([]);
  });

  it("las lecciones sin generadores tienen preguntas suficientes", () => {
    for (const l of cur.lessons) if (l.exercises.length === 0) expect((content[l.id]?.quiz ?? []).length, l.id).toBeGreaterThanOrEqual(2);
  });

  for (const l of new Curriculum().lessons) {
    it(`${l.id}: ejemplos y vocabulario solo con lo aprendido`, () => {
      const c = content[l.id];
      if (!c) return;
      const known = new Set<ConceptId>([...cur.closure(l.id), l.concept]);
      for (const b of c.body) {
        if ("ex" in b) {
          expect(() => buildExample(b.ex)).not.toThrow();
          expect(auditExample(b.ex, known), JSON.stringify(b.ex)).toEqual([]);
        }
      }
      for (const t of textsOf(l.id)) {
        const { plain, marked } = stripMarkers(t);
        for (const m of marked) expect(known.has(m), `${l.id}: término marcado ${m} sin aprender`).toBe(true);
        for (const [re, concepts] of TERMS_ES) {
          if (re.test(plain)) expect(concepts.some((x) => known.has(x)), `${l.id}: "${plain.match(re)?.[0]}" sin aprender (${concepts.join("|")}) en: ${plain}`).toBe(true);
        }
      }
      for (const q of c.quiz ?? []) {
        expect(q.a.length, `${l.id}: ${q.q}`).toBeGreaterThanOrEqual(2);
        for (const u of q.uses ?? []) expect(known.has(u), `${l.id}: pregunta usa ${u}`).toBe(true);
      }
    });
  }
});

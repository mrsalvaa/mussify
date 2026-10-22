// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { Curriculum } from "../src/core/curriculum/engine";
import { exampleSongs, loadContent } from "../src/content";
import { songRequirements, songStatus, songExercises, sectionRequirements } from "../src/core/songs/song";
import { auditExercise } from "../src/core/curriculum/audit";
import type { ConceptId } from "../src/core/curriculum/types";

loadContent("es-AR");
const cur = new Curriculum();
const songs = exampleSongs();

describe("fichas de canciones", () => {
  it("hay 3 de piano, 3 de guitarra y al menos 2 de bajo y de batería", () => {
    const count = (i: string) => songs.filter((s) => s.instrument === i).length;
    expect(count("piano")).toBe(3);
    expect(count("guitar")).toBe(3);
    expect(count("bass")).toBeGreaterThanOrEqual(2);
    expect(count("drums")).toBeGreaterThanOrEqual(2);
    for (const t of ["Let It Be", "Bohemian Rhapsody", "Muchacha ojos de papel", "Smoke on the Water", "De música ligera", "Wish You Were Here"]) expect(songs.some((s) => s.title === t), t).toBe(true);
  });

  it("todos los conceptos que usan existen y se pueden aprender", () => {
    for (const s of songs) {
      for (const r of songRequirements(s)) expect(r.anyOf.some((c) => cur.byConcept.has(c)), `${s.id}: ${r.anyOf.join("|")}`).toBe(true);
      for (const t of s.theory) expect(cur.byConcept.has(t.concept), `${s.id}: ${t.concept}`).toBe(true);
      for (const t of s.scales) expect(cur.byConcept.has(t.concept), `${s.id}: ${t.concept}`).toBe(true);
      expect(s.theory.length, `${s.id} sin vínculos a teoría`).toBeGreaterThan(0);
    }
  });

  it("desde cero ninguna está disponible y cada una tiene un camino", () => {
    for (const s of songs) {
      const st = songStatus(cur, s, new Set());
      expect(st.available).toBe(false);
      expect(st.path.length).toBeGreaterThan(0);
      // Siguiendo el camino, la canción queda disponible
      const known = new Set<ConceptId>(st.path);
      expect(songStatus(cur, s, known).available, s.id).toBe(true);
    }
  });

  it("las secciones se desbloquean por separado", () => {
    const s = songs.find((x) => x.id === "wish-you-were-here")!;
    const verse = s.sections.find((x) => x.id === "verse")!;
    const path = cur.pathTo(sectionRequirements(s, verse).map((r) => r.anyOf[0]).concat(s.requires), new Set());
    const known = new Set<ConceptId>(path.map((l) => l.id));
    const st = songStatus(cur, s, known);
    expect(st.sections.find((x) => x.section.id === "verse")!.available).toBe(true);
  });

  it("los ejercicios de una canción solo usan lo aprendido", () => {
    const order = cur.topoOrder();
    for (const cut of [60, 150, order.length]) {
      const known = new Set(order.slice(0, cut));
      for (const s of songs) for (let seed = 1; seed < 6; seed++) for (const ex of songExercises(s, known, seed)) expect(auditExercise(ex, known), `${s.id} ${ex.generator}`).toEqual([]);
    }
  });
});

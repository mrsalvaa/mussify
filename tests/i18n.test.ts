// SPDX-License-Identifier: GPL-3.0-or-later
// Todas las claves de texto que generan los ejercicios existen en es-AR.
import { describe, expect, it } from "vitest";
import { Curriculum, lessonSession } from "../src/core/curriculum/engine";
import { loadContent, exampleSongs } from "../src/content";
import { hasKey, formatLabel, formatMsg } from "../src/i18n";
import type { Label, Msg } from "../src/core/curriculum/types";
import { songExercises } from "../src/core/songs/song";

loadContent("es-AR");
const cur = new Curriculum();

function keysOfMsg(m: Msg, out: Set<string>) {
  out.add(m.key);
  for (const v of Object.values(m.params ?? {})) if (typeof v === "object") keysOfLabel(v, out);
}
function keysOfLabel(l: Label, out: Set<string>) {
  if (l.kind === "msg") keysOfMsg(l.msg, out);
  if (l.kind === "names") l.items.forEach((x) => keysOfLabel(x, out));
  if (l.kind === "audio" && l.text) keysOfMsg(l.text, out);
}

describe("i18n", () => {
  it("todas las claves usadas existen y se formatean", () => {
    const keys = new Set<string>();
    for (const l of cur.lessons) {
      const mastered = cur.closure(l.concept);
      for (let seed = 1; seed <= 6; seed++) {
        for (const ex of lessonSession(cur, l, mastered, { seed })) {
          keysOfMsg(ex.prompt.text, keys);
          if (ex.prompt.big) keysOfLabel(ex.prompt.big, keys);
          if (ex.answer.kind === "choice") ex.answer.options.forEach((o) => keysOfLabel(o, keys));
          expect(formatMsg(ex.prompt.text).includes("{"), `${l.id}: ${formatMsg(ex.prompt.text)}`).toBe(false);
          if (ex.answer.kind === "choice") for (const o of ex.answer.options) expect(formatLabel(o).length).toBeGreaterThan(0);
        }
      }
    }
    const all = new Set(cur.topoOrder());
    for (const s of exampleSongs()) for (const ex of songExercises(s, all, 3)) keysOfMsg(ex.prompt.text, keys);
    const missing = [...keys].filter((k) => !hasKey(k));
    expect(missing).toEqual([]);
  });
});

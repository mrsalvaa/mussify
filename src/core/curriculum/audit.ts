// SPDX-License-Identifier: GPL-3.0-or-later
// Auditoría independiente de un ejercicio: ¿todo lo que se ve o se pide ya se aprendió?
// Se usa en los tests y, en la app, como red de seguridad antes de mostrar un ejercicio.
import { chordKey, type Chord } from "../theory/chord";
import { shapesForChord, pitchAt, STANDARD, BASS4, BASS5, type Tuning } from "../instruments/fretted";
import { chordTheoryRequirements, intervalConcept, scoreRequirements, missing, fretConcept, figureConcept } from "./extract";
import { pcLabelConcepts } from "./gen/common";
import type { ConceptId, Exercise, Label, Msg, Requirement } from "./types";

export function chordLabelOk(c: Chord, known: ReadonlySet<ConceptId>): boolean {
  const accOk = (acc: number) => acc === 0 || (acc === 1 && known.has("acc.sharp")) || (acc === -1 && known.has("acc.flat"));
  if (!accOk(c.root.acc) || (c.bass && !accOk(c.bass.acc))) return false;
  if (missing(chordTheoryRequirements(c), known).length === 0) return true;
  if (!c.bass) {
    const shapes = shapesForChord(c);
    if (shapes.some((s) => known.has(s.concept))) return true;
    if (known.has("bs.root") && c.quality === "maj") return true;
    if (known.has("bs.minor") && c.quality === "min") return true;
  }
  return false;
}

function labelProblems(l: Label, known: ReadonlySet<ConceptId>, where: string): string[] {
  const out: string[] = [];
  const need = (cs: ConceptId[]) => {
    for (const c of cs) if (!known.has(c)) out.push(`${where}: ${c}`);
  };
  switch (l.kind) {
    case "pc":
      need(pcLabelConcepts(l.pc));
      break;
    case "pitch":
      need(pcLabelConcepts(l.pitch));
      break;
    case "interval":
      need([intervalConcept(l.iv)]);
      break;
    case "chord":
      if (!chordLabelOk(l.chord, known)) out.push(`${where}: acorde ${chordKey(l.chord)}`);
      break;
    case "score":
      for (const r of missing(scoreRequirements(l.score), known)) out.push(`${where}: partitura requiere ${r.anyOf.join("|")}`);
      break;
    case "diagram":
      need([l.shape.concept]);
      break;
    case "msg":
      out.push(...msgProblems(l.msg, known, where));
      break;
    case "audio":
      if (l.text) out.push(...msgProblems(l.text, known, where));
      break;
    case "names":
      l.items.forEach((x, i) => out.push(...labelProblems(x, known, `${where}[${i}]`)));
      break;
    default:
      break;
  }
  return out;
}

function msgProblems(m: Msg, known: ReadonlySet<ConceptId>, where: string): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(m.params ?? {})) if (typeof v === "object") out.push(...labelProblems(v, known, `${where}.${k}`));
  return out;
}

function tuningFor(instrument: "guitar" | "bass", strings: number): Tuning {
  return instrument === "guitar" ? STANDARD : strings === 5 ? BASS5 : BASS4;
}

export function auditExercise(ex: Exercise, known: ReadonlySet<ConceptId>): string[] {
  const out: string[] = [];
  for (const u of ex.uses) if (!known.has(u)) out.push(`usa ${u}`);
  for (const t of ex.targets) if (!known.has(t)) out.push(`evalúa ${t}`);
  const p = ex.prompt;
  out.push(...msgProblems(p.text, known, "consigna"));
  if (p.score) for (const r of missing(scoreRequirements(p.score), known)) out.push(`partitura requiere ${r.anyOf.join("|")}`);
  if (p.big) out.push(...labelProblems(p.big, known, "destacado"));
  if (p.diagram && !known.has(p.diagram.concept)) out.push(`diagrama ${p.diagram.concept}`);
  if (p.keyboard?.marks) for (const m of p.keyboard.marks) if (m.label) out.push(...labelProblems(m.label, known, "tecla"));
  if (p.fretboard?.marks) for (const m of p.fretboard.marks) if (m.label) out.push(...labelProblems(m.label, known, "traste"));
  const a = ex.answer;
  switch (a.kind) {
    case "choice":
      a.options.forEach((o, i) => out.push(...labelProblems(o, known, `opción ${i + 1}`)));
      break;
    case "keys":
      if (a.target.some((x) => x.acc !== 0) && !known.has("pn.black")) out.push("pide teclas negras sin pn.black");
      break;
    case "frets": {
      const tuning = tuningFor(a.instrument, a.tuning.length);
      const cs = a.target.map((t) => fretConcept(a.instrument, tuning, t.string, t.fret));
      if (a.match === "position" && a.mode !== "set") for (const c of cs) if (!known.has(c)) out.push(`posición ${c}`);
      if (a.match === "pc" && !cs.some((c) => known.has(c))) out.push(`ninguna posición conocida (${cs.join(",")})`);
      void pitchAt;
      break;
    }
    case "names":
      for (const c of a.choices) for (const r of pcLabelConcepts(c)) if (!known.has(r)) out.push(`botón ${r}`);
      break;
    case "rhythm":
      for (const t of [...a.target, ...a.choices]) {
        const c = figureConcept(t.replace(/[.r]/g, ""), t.endsWith("r"));
        if (!known.has(c)) out.push(`figura ${c}`);
        if (t.includes(".") && !known.has("rh.dot")) out.push("puntillo");
      }
      break;
  }
  return [...new Set(out)];
}

export function requirementsMissing(reqs: Requirement[], known: ReadonlySet<ConceptId>): Requirement[] {
  return missing(reqs, known);
}

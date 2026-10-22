// SPDX-License-Identifier: GPL-3.0-or-later
// Ejemplos declarativos de las explicaciones: se convierten en partitura, audio, teclado,
// diapasón o diagrama. Son independientes del idioma y se auditan igual que los ejercicios.
import { parsePitch, midi, type Pitch } from "../theory/pitch";
import { type BaseDuration, type Duration, parseTs } from "../theory/rhythm";
import { parseChord, chordVoicing, type Chord } from "../theory/chord";
import { type Score, type ScoreEvent, singleStaffScore, type DrumPiece, type Clef } from "../notation/score";
import { scoreToSequence, notesSequence, chordsSequence, type Sequence, type SoundInstrument } from "../notation/playback";
import { STANDARD, BASS4, BASS5, GUITAR_OPEN_SHAPES, GUITAR_MOVABLE_SHAPES, placeMovable, pitchAt, shapePitches, type ChordShape } from "../instruments/fretted";
import { GROOVES, grooveScore, rhythmScore } from "./gen";
import { scoreRequirements, missing, chordTheoryRequirements, fretConcept } from "./extract";
import { chordLabelOk } from "./audit";
import type { ConceptId, FretMark } from "./types";

export interface Example {
  /** Notas: "C4 D4:q [C4 E4 G4]:h r:q". Sin compás → notas sueltas. */
  notes?: string;
  clef?: Clef;
  ts?: string;
  key?: number;
  tempo?: number;
  /** Ritmo sobre una línea: "q q h | 8 8 q qr". */
  rhythm?: string;
  /** Cifrados a escuchar/mostrar: ["C", "G", "Am", "F"]. */
  chords?: string[];
  /** Escuchar notas sueltas sin mostrar partitura: "C4 E4". */
  play?: string;
  harmonic?: boolean;
  instrument?: SoundInstrument;
  /** Resaltar teclas del piano: "C4 E4 G4". */
  keyboard?: string;
  keyboardRange?: [number, number];
  /** Marcas en el diapasón: "6:0 6:3 5:2". */
  frets?: string;
  bass?: boolean;
  fiveString?: boolean;
  /** Tablatura con ritmo opcional: "6:0:q 6:3:q 5:0:h". */
  tab?: string;
  /** Diagrama de acorde: "Em" o "mv:E@1". */
  diagram?: string;
  /** Groove por concepto de la batería. */
  groove?: string;
  /** Partitura de batería libre: "hhClosed+kick:8 hhClosed:8 ..." */
  drums?: string;
  hideClef?: boolean;
  labels?: boolean;
  /** Pentagrama vacío (para mostrar una clave o una armadura). */
  emptyStaff?: boolean;
}

export interface ExampleView {
  score?: Score;
  audio?: Sequence;
  keyboard?: { from: number; to: number; marks: { midi: number; role?: "target" | "hint" | "root" }[] };
  fretboard?: { instrument: "guitar" | "bass"; tuning: Pitch[]; frets: number; marks: FretMark[] };
  diagram?: ChordShape;
  chords?: Chord[];
  labels?: boolean;
  /** Conceptos que se muestran y no se pueden deducir de la partitura. */
  uses: ConceptId[];
}

function parseDur(tok: string | undefined): Duration {
  if (!tok) return { base: "w" };
  const dots = (tok.match(/\./g) ?? []).length;
  const t3 = tok.endsWith("t");
  const base = tok.replace(/[.t]/g, "") as BaseDuration;
  const d: Duration = dots ? { base, dots } : { base };
  if (t3) d.tuplet = { n: 3, inSpaceOf: 2 };
  return d;
}

export function parseNotes(s: string, defaultDur = "w"): ScoreEvent[] {
  const out: ScoreEvent[] = [];
  const re = /\[([^\]]+)\](?::([\w.]+))?|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m[3] === "|") continue;
    if (m[1]) {
      const ps = m[1].trim().split(/\s+/).map((x) => parsePitch(x)!);
      out.push({ duration: parseDur(m[2] ?? defaultDur), notes: ps.map((p) => ({ pitch: p })) });
      continue;
    }
    const [head, durTok, tie] = m[3].split(":");
    const d = parseDur(durTok ?? defaultDur);
    if (head === "r") out.push({ duration: d, notes: [] });
    else {
      const p = parsePitch(head);
      if (!p) throw new Error(`Nota inválida en ejemplo: ${head}`);
      out.push({ duration: d, notes: [{ pitch: p, tie: tie === "~" }] });
    }
  }
  return out;
}

function parseRhythm(s: string): ScoreEvent[] {
  return s
    .split(/\s+/)
    .filter((t) => t && t !== "|")
    .map((t) => {
      const rest = t.endsWith("r");
      const tie = t.endsWith("~");
      const d = parseDur(t.replace(/[r~]/g, ""));
      return { duration: d, notes: rest ? [] : [{ pitch: parsePitch("B4")!, tie }] };
    });
}

function shapeFromSpec(spec: string): ChordShape | undefined {
  if (spec.startsWith("mv:")) {
    const [id, fretStr] = spec.slice(3).split("@");
    const m = GUITAR_MOVABLE_SHAPES.find((x) => x.id === id);
    if (!m) return undefined;
    const fret = parseInt(fretStr ?? "1", 10);
    const root = pitchAt(STANDARD, m.rootString, fret);
    return placeMovable(m, root) ?? undefined;
  }
  return GUITAR_OPEN_SHAPES.find((s) => s.id === spec);
}

export function buildExample(ex: Example): ExampleView {
  const view: ExampleView = { uses: [], labels: ex.labels };
  const instrument = ex.instrument ?? (ex.bass ? "bass" : "piano");
  if (ex.notes) {
    const events = parseNotes(ex.notes, ex.ts ? "q" : "w");
    const score = singleStaffScore({
      clef: ex.clef ?? "treble",
      events,
      freeNotes: !ex.ts,
      timeSig: ex.ts ? parseTs(ex.ts) : undefined,
      keyFifths: ex.key ?? 0,
      tempo: ex.tempo ?? 80,
    });
    if (ex.hideClef) score.hideClef = true;
    view.score = score;
    view.audio = scoreToSequence(score);
    if (instrument !== "piano") view.audio.events.forEach((e) => (e.instrument = instrument));
  }
  if (ex.emptyStaff) {
    const score = singleStaffScore({ clef: ex.clef ?? "treble", events: [], freeNotes: true, keyFifths: ex.key ?? 0 });
    if (ex.hideClef) score.hideClef = true;
    view.score = score;
  }
  if (ex.rhythm) {
    const ts = parseTs(ex.ts ?? "4/4");
    const score = rhythmScore(parseRhythm(ex.rhythm), ts, ex.tempo ?? 80, !ex.ts);
    view.score = score;
    view.audio = scoreToSequence(score);
    view.audio.events.forEach((e) => {
      e.instrument = "drums";
      e.note = 37;
    });
  }
  if (ex.play) {
    const ps = ex.play.split(/\s+/).map((x) => parsePitch(x)!);
    view.audio = notesSequence(ps, { harmonic: ex.harmonic, instrument });
  }
  if (ex.chords) {
    const chords = ex.chords.map((c) => parseChord(c)!);
    view.chords = chords;
    view.audio = chordsSequence(
      chords.map((c) => [ { ...(c.bass ?? c.root), octave: 3 } as Pitch, ...chordVoicing({ root: c.root, quality: c.quality }, 4)]),
      { instrument: instrument === "guitar" ? "guitar" : "piano", length: 1.3 },
    );
  }
  if (ex.keyboard) {
    const ps = ex.keyboard.split(/\s+/).map((x) => parsePitch(x)!);
    const ms = ps.map(midi);
    const [from, to] = ex.keyboardRange ?? [Math.min(60, Math.floor(Math.min(...ms) / 12) * 12), Math.max(71, Math.ceil((Math.max(...ms) + 1) / 12) * 12 - 1)];
    view.keyboard = { from, to, marks: ms.map((m) => ({ midi: m, role: "target" as const })) };
    if (!view.audio) view.audio = notesSequence(ps, { harmonic: ex.harmonic });
  }
  if (ex.frets) {
    const tuning = ex.bass ? (ex.fiveString ? BASS5 : BASS4) : STANDARD;
    const marks: FretMark[] = ex.frets.split(/\s+/).map((t) => {
      const [s, f] = t.split(":").map(Number);
      return { string: s, fret: f, role: "target" };
    });
    view.fretboard = { instrument: ex.bass ? "bass" : "guitar", tuning: tuning.strings, frets: 12, marks };
    for (const m of marks) view.uses.push(fretConcept(ex.bass ? "bass" : "guitar", tuning, m.string, m.fret));
    if (!view.audio) view.audio = notesSequence(marks.map((m) => pitchAt(tuning, m.string, m.fret)), { instrument: ex.bass ? "bass" : "guitar" });
  }
  if (ex.tab) {
    const tuning = ex.bass ? (ex.fiveString ? BASS5 : BASS4) : STANDARD;
    const toks = ex.tab.split(/\s+/).filter((t) => t !== "|");
    const events: ScoreEvent[] = toks.map((t) => {
      const [s, f, d] = t.split(":");
      if (s === "r") return { duration: parseDur(f), notes: [] };
      const string = Number(s), fret = Number(f);
      return { duration: parseDur(d ?? "q"), notes: [{ pitch: pitchAt(tuning, string, fret), tab: { string, fret } }] };
    });
    const hasRhythm = toks.some((t) => t.split(":").length === 3);
    const score = singleStaffScore({ clef: ex.bass ? "bass" : "treble", instrument: ex.bass ? "bass" : "guitar", events, showTab: true, showStaff: false, tuning: tuning.strings, freeNotes: !hasRhythm, hideTimeSig: !ex.ts, timeSig: ex.ts ? parseTs(ex.ts) : undefined, tempo: ex.tempo ?? 80 });
    view.score = score;
    view.audio = scoreToSequence(score);
  }
  if (ex.diagram) {
    const sh = shapeFromSpec(ex.diagram);
    if (!sh) throw new Error(`Diagrama desconocido: ${ex.diagram}`);
    view.diagram = sh;
    view.uses.push(sh.concept);
    view.audio = chordsSequence([shapePitches(sh)], { instrument: "guitar", arpeggiate: 0.05, length: 2 });
  }
  if (ex.groove) {
    const g = GROOVES.find((x) => x.concept === ex.groove);
    if (!g) throw new Error(`Groove desconocido: ${ex.groove}`);
    view.score = grooveScore(g, ex.tempo ?? 90);
    view.audio = scoreToSequence(view.score);
  }
  if (ex.drums) {
    const events: ScoreEvent[] = ex.drums.split(/\s+/).filter((t) => t !== "|").map((t) => {
      const [pieces, d] = t.split(":");
      return { duration: parseDur(d ?? "q"), notes: pieces === "r" ? [] : pieces.split("+").map((p) => ({ drum: p as DrumPiece })) };
    });
    view.score = singleStaffScore({ clef: "percussion", instrument: "drums", events, timeSig: ex.ts ? parseTs(ex.ts) : undefined, freeNotes: !ex.ts, tempo: ex.tempo ?? 90 });
    view.audio = scoreToSequence(view.score);
  }
  return view;
}

/** Problemas de un ejemplo respecto de lo que se sabe. */
export function auditExample(ex: Example, known: ReadonlySet<ConceptId>): string[] {
  const v = buildExample(ex);
  const out: string[] = [];
  if (v.score) for (const r of missing(scoreRequirements(v.score), known)) out.push(`ejemplo: partitura requiere ${r.anyOf.join("|")}`);
  for (const u of v.uses) if (!known.has(u)) out.push(`ejemplo: ${u}`);
  if (v.chords) for (const c of v.chords) if (!chordLabelOk(c, known)) out.push(`ejemplo: acorde ${JSON.stringify(c)} (${chordTheoryRequirements(c).map((r) => r.anyOf.join("|")).join(",")})`);
  if (v.keyboard && v.keyboard.marks.length && !known.has("t.keyboardMap") && !known.has("pn.keyboard")) out.push("ejemplo: teclado sin t.keyboardMap/pn.keyboard");
  if (v.diagram && !known.has(v.diagram.concept)) out.push(`ejemplo: diagrama ${v.diagram.concept}`);
  return out;
}

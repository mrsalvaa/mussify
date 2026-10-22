// SPDX-License-Identifier: GPL-3.0-or-later
// Generadores de instrumentos: piano, guitarra, bajo y batería.
import { type Pitch, type PitchClass, pc, P, midi, fromMidi, samePc, chroma } from "../../theory/pitch";
import { type Chord, chordPcs, chordVoicing, C, chordKey } from "../../theory/chord";
import { scalePitches } from "../../theory/scale";
import { singleStaffScore, note, type ScoreEvent, type DrumPiece } from "../../notation/score";
import { notesSequence, chordsSequence, scoreToSequence } from "../../notation/playback";
import { dur, type TimeSignature } from "../../theory/rhythm";
import { DRUMS, DRUM_PIECES } from "../../instruments/drums";
import { type Tuning, STANDARD, BASS4, BASS5, pitchAt, GUITAR_OPEN_SHAPES, GUITAR_MOVABLE_SHAPES, placeMovable, shapePitches, type ChordShape } from "../../instruments/fretted";
import { readingConcept, fretConcept, figureConcept, timeSigConcept, chordTheoryRequirements, flatConcepts } from "../extract";
import type { ConceptId, GenContext, Label } from "../types";
import { type Generator, L, msg, choice, has, readableNotes, readingClefs, pcLabelConcepts, readingUses, nameablePcs, knownQualities, pickFocused } from "./common";
import { randomRhythm, rhythmScore } from "./rhythm";

// ======================= PIANO =======================

const WHITE_LETTERS = [0, 1, 2, 3, 4, 5, 6];

function knownKeyLetters(ctx: GenContext): number[] {
  return WHITE_LETTERS.filter((l) => has(ctx, `pn.key.${"CDEFGAB"[l]}`));
}

/** "Tocá Re" en el teclado (cualquier octava). */
export const keyboardFind: Generator = {
  requires: ["pn.keyboard", "t.notes"],
  canRun: (ctx) => knownKeyLetters(ctx).length > 0,
  make(ctx) {
    const letters = knownKeyLetters(ctx);
    const pcs: PitchClass[] = letters.map((l) => pc(l));
    if (has(ctx, "pn.black")) for (const p of nameablePcs(ctx.known)) if (p.acc !== 0 && letters.includes(p.letter)) pcs.push(p);
    const p = pickFocused(ctx, pcs, (x) => (x.acc !== 0 ? "pn.black" : `pn.key.${"CDEFGAB"[x.letter]}`));
    return {
      prompt: { text: msg("ex.keyboardFind.prompt", { note: L.pc(p) }) },
      answer: { kind: "keys", mode: "single", target: [{ ...p, octave: 4 }], match: "pc", from: 48, to: 71 },
      targets: [p.acc !== 0 ? "pn.black" : `pn.key.${"CDEFGAB"[p.letter]}`],
      uses: ["pn.keyboard", ...pcLabelConcepts(p), p.acc !== 0 ? "pn.black" : `pn.key.${"CDEFGAB"[p.letter]}`],
      item: `pn.key.${"CDEFGAB"[p.letter]}${p.acc}`,
    };
  },
};

/** Tecla marcada: ¿qué nota es? */
export const keyboardName: Generator = {
  requires: ["pn.keyboard", "t.notes"],
  canRun: (ctx) => knownKeyLetters(ctx).length >= 2,
  make(ctx) {
    const letters = knownKeyLetters(ctx);
    const l = ctx.rng.weighted(letters, (x) => (ctx.focus === `pn.key.${"CDEFGAB"[x]}` ? 4 : 1));
    const octave = ctx.rng.pick([3, 4]);
    const p: Pitch = { letter: l as Pitch["letter"], acc: 0, octave };
    const distract = WHITE_LETTERS.filter((x) => x !== l).map((x) => L.pc(pc(x)));
    return {
      prompt: { text: msg("ex.keyboardName.prompt"), keyboard: { from: 48, to: 71, marks: [{ midi: midi(p), role: "target" }] } },
      answer: choice(ctx.rng, L.pc(p), distract),
      targets: [`pn.key.${"CDEFGAB"[l]}`],
      uses: ["pn.keyboard", "t.notes", `pn.key.${"CDEFGAB"[l]}`],
      item: `pn.key.${"CDEFGAB"[l]}.name`,
    };
  },
};

/** Ver una nota en el pentagrama y tocarla en su octava exacta. */
export const staffToKey: Generator = {
  requires: ["pn.keyboard", "pn.middleC", "t.staff"],
  canRun: (ctx) => readingClefs(ctx.known).length > 0 && knownKeyLetters(ctx).length >= 7,
  make(ctx, params) {
    const clefs = readingClefs(ctx.known).filter((c) => !params.clef || c === params.clef);
    const clef = ctx.rng.pick(clefs.length ? clefs : readingClefs(ctx.known));
    let pool = readableNotes(ctx.known, clef);
    if (params.range === "C") pool = pool.filter((p) => midi(p) >= (clef === "treble" ? 60 : 48) && midi(p) <= (clef === "treble" ? 67 : 55));
    if (!pool.length) pool = readableNotes(ctx.known, clef);
    const p = pickFocused(ctx, pool, (x) => readingConcept(x, clef));
    const score = singleStaffScore({ clef, events: [note(p, dur("w"))], freeNotes: true });
    return {
      prompt: { text: msg("ex.staffToKey.prompt"), score },
      answer: { kind: "keys", mode: "single", target: [p], match: "exact", from: clef === "treble" ? 55 : 36, to: clef === "treble" ? 84 : 64 },
      targets: [readingConcept(p, clef), "pn.middleC"],
      uses: [...readingUses(p, clef), "pn.keyboard", "pn.middleC"],
      item: `${readingConcept(p, clef)}.piano`,
    };
  },
};

/** Melodía corta en el pentagrama: tocarla nota por nota. */
export const playMelody: Generator = {
  requires: ["pn.pos.C", "rh.q", "rh.h"],
  canRun: (ctx) => readableNotes(ctx.known, "treble").filter((p) => midi(p) >= 60 && midi(p) <= 67).length >= 5,
  make(ctx, params) {
    const lh = params.hand === "left" && has(ctx, "pn.lh");
    const clef = lh ? "bass" : "treble";
    const lo = lh ? 48 : 60;
    let pool = readableNotes(ctx.known, clef).filter((p) => midi(p) >= lo && midi(p) <= lo + 7);
    if (has(ctx, "pn.extend") && !lh) pool = readableNotes(ctx.known, clef).filter((p) => midi(p) >= 60 && midi(p) <= 72);
    if (pool.length < 3) pool = readableNotes(ctx.known, "treble").filter((p) => midi(p) >= 60 && midi(p) <= 67);
    const len = ctx.rng.int(4, 6);
    const ps: Pitch[] = [];
    let i = ctx.rng.int(0, pool.length - 1);
    for (let k = 0; k < len; k++) {
      ps.push(pool[i]);
      i = Math.max(0, Math.min(pool.length - 1, i + ctx.rng.pick([-2, -1, -1, 1, 1, 2, 0])));
    }
    const figs = ["q", "h"].filter((f) => has(ctx, `rh.${f}`));
    const events: ScoreEvent[] = ps.map((p, k) => note(p, dur(k === ps.length - 1 && figs.includes("h") ? "h" : "q")));
    const score = singleStaffScore({ clef: pool[0] && midi(pool[0]) < 60 ? "bass" : clef, events, freeNotes: true });
    const usedClef = score.staves[0].clef as "treble" | "bass";
    return {
      prompt: { text: msg("ex.playMelody.prompt"), score, audio: scoreToSequence(score) },
      answer: { kind: "keys", mode: "sequence", target: ps, match: "exact", from: lo - 5, to: lo + 16 },
      targets: [lh ? "pn.lh" : "pn.pos.C", ...ps.map((p) => readingConcept(p, usedClef))],
      uses: [...ps.flatMap((p) => readingUses(p, usedClef)), "pn.pos.C", ...(lh ? ["pn.lh"] : []), ...events.map((e) => figureConcept(e.duration.base, false))],
      item: lh ? "pn.melody.lh" : "pn.melody.rh",
    };
  },
};

/** Tocar un acorde en el teclado. */
export const playChord: Generator = {
  requires: ["pn.ch.maj"],
  canRun: (ctx) => has(ctx, "pn.ch.maj"),
  make(ctx) {
    const qs = knownQualities(ctx.known).filter((q) => (q === "maj" && has(ctx, "pn.ch.maj")) || (q === "min" && has(ctx, "pn.ch.min")) || ((q === "dim" || q === "aug") && has(ctx, "pn.ch.dimaug")) || (["7", "maj7", "m7"].includes(q) && has(ctx, "pn.ch.7")));
    const q = ctx.rng.weighted(qs, (x) => (x === "min" && ctx.focus === "pn.ch.min" ? 4 : 1));
    const roots = nameablePcs(ctx.known).filter((r) => (r.acc === 0 || has(ctx, "pn.black")) && chordPcs({ root: r, quality: q }).every((p) => Math.abs(p.acc) <= 1 && (p.acc === 0 || (has(ctx, "pn.black") && has(ctx, p.acc > 0 ? "acc.sharp" : "acc.flat")))));
    const root = ctx.rng.pick(roots.length ? roots : [pc(0)]);
    const chord: Chord = { root, quality: q };
    const inv = has(ctx, "pn.inv") ? ctx.rng.int(0, 2) : 0;
    const v = chordVoicing(chord, 4, inv);
    const anyInversion = !has(ctx, "pn.inv");
    return {
      prompt: { text: msg(inv ? "ex.playChord.inv" : "ex.playChord.prompt", { chord: { kind: "chord", chord }, inv: L.msg(inv === 1 ? "inv.first" : "inv.second") }) },
      answer: { kind: "keys", mode: "set", target: v, match: anyInversion ? "pc" : "exact", from: 55, to: 84 },
      targets: [q === "maj" ? "pn.ch.maj" : q === "min" ? "pn.ch.min" : q === "dim" || q === "aug" ? "pn.ch.dimaug" : "pn.ch.7", ...(inv ? ["pn.inv"] : [])],
      uses: [...flatConcepts(chordTheoryRequirements(chord)), "pn.ch.maj", ...(q === "min" ? ["pn.ch.min"] : []), ...(root.acc ? ["pn.black"] : []), ...(inv ? ["pn.inv", "ch.inv"] : [])],
      item: `pn.chord.${q}${inv}`,
    };
  },
};

/** Tocar una escala completa. */
export const playScale: Generator = {
  requires: ["pn.scale"],
  canRun: (ctx) => has(ctx, "sc.major"),
  make(ctx) {
    const keys: PitchClass[] = [pc(0)];
    if (has(ctx, "ks.1") && has(ctx, "pn.black")) keys.push(pc(4));
    if (has(ctx, "ks.-1") && has(ctx, "pn.black")) keys.push(pc(3));
    if (has(ctx, "ks.2") && has(ctx, "pn.black")) keys.push(pc(1));
    const tonic = ctx.rng.pick(keys);
    const minor = has(ctx, "sc.minor") && ctx.rng.bool(0.3);
    const t = minor ? pc(5) : tonic;
    const ps = scalePitches({ ...t, octave: 4 }, minor ? "minor" : "major");
    return {
      prompt: { text: msg("ex.playScale.prompt", { scale: L.msg(minor ? "key.minor" : "key.major", { tonic: L.pc(t) }) }) },
      answer: { kind: "keys", mode: "sequence", target: ps, match: "exact", from: 60, to: 84 },
      targets: ["pn.scale"],
      uses: ["pn.scale", "sc.major", ...(minor ? ["sc.minor"] : []), ...ps.flatMap(pcLabelConcepts), ...(ps.some((p) => p.acc) ? ["pn.black"] : [])],
      item: `pn.scale.${t.letter}${minor ? "m" : ""}`,
    };
  },
};

// ======================= GUITARRA Y BAJO =======================

function fretPool(ctx: GenContext, instrument: "guitar" | "bass", tuning: Tuning, maxFret = 12): { string: number; fret: number }[] {
  const out: { string: number; fret: number }[] = [];
  for (let s = 1; s <= tuning.strings.length; s++) for (let f = 0; f <= maxFret; f++) if (has(ctx, fretConcept(instrument, tuning, s, f))) out.push({ string: s, fret: f });
  return out;
}

function tuningFor(ctx: GenContext, instrument: "guitar" | "bass"): Tuning {
  if (instrument === "guitar") return STANDARD;
  return has(ctx, "bs.str5") ? BASS5 : BASS4;
}

function posItem(instrument: "guitar" | "bass", tuning: Tuning, p: { string: number; fret: number }): ConceptId {
  return fretConcept(instrument, tuning, p.string, p.fret);
}

/** Nombre de la nota marcada en el diapasón. */
export const fretName: Generator = {
  requires: [],
  canRun: (ctx, params) => fretPool(ctx, params.instrument as "guitar" | "bass", tuningFor(ctx, params.instrument as "guitar" | "bass")).length >= 1,
  make(ctx, params) {
    const instrument = params.instrument as "guitar" | "bass";
    const tuning = tuningFor(ctx, instrument);
    const pool = fretPool(ctx, instrument, tuning);
    const pos = pickFocused(ctx, pool, (x) => posItem(instrument, tuning, x));
    const p = pitchAt(tuning, pos.string, pos.fret, ctx.rng.bool() && has(ctx, "acc.flat"));
    const fixed: PitchClass = p.acc === 0 || has(ctx, p.acc > 0 ? "acc.sharp" : "acc.flat") ? p : pitchAt(tuning, pos.string, pos.fret, p.acc > 0);
    const distract = nameablePcs(ctx.known).filter((q) => chroma(q) !== chroma(fixed)).sort((a, b) => Math.abs(chroma(a) - chroma(fixed)) - Math.abs(chroma(b) - chroma(fixed)));
    const pre = instrument === "guitar" ? "gt" : "bs";
    return {
      prompt: { text: msg("ex.fretName.prompt"), fretboard: { instrument, tuning: tuning.strings, frets: 12, marks: [{ ...pos, role: "target" }] }, audio: notesSequence([p], { instrument: instrument === "guitar" ? "guitar" : "bass" }) },
      answer: choice(ctx.rng, L.pc(fixed), distract.slice(0, 5).map(L.pc)),
      targets: [posItem(instrument, tuning, pos)],
      uses: [`${pre}.parts`, posItem(instrument, tuning, pos), ...pcLabelConcepts(fixed), ...distract.slice(0, 5).flatMap(pcLabelConcepts)],
      item: posItem(instrument, tuning, pos),
    };
  },
};

/** "¿Dónde está Sol?" → tocar en el diapasón. */
export const fretFind: Generator = {
  requires: [],
  canRun: (ctx, params) => fretPool(ctx, params.instrument as "guitar" | "bass", tuningFor(ctx, params.instrument as "guitar" | "bass")).length >= 1,
  make(ctx, params) {
    const instrument = params.instrument as "guitar" | "bass";
    const tuning = tuningFor(ctx, instrument);
    const pool = fretPool(ctx, instrument, tuning);
    const pos = pickFocused(ctx, pool, (x) => posItem(instrument, tuning, x));
    const p = pitchAt(tuning, pos.string, pos.fret);
    // Aceptamos cualquier posición conocida que suene igual (misma altura)
    const same = pool.filter((q) => midi(pitchAt(tuning, q.string, q.fret)) === midi(p));
    const nameAs: PitchClass = p.acc === 0 || has(ctx, "acc.sharp") ? p : pitchAt(tuning, pos.string, pos.fret, true);
    const pre = instrument === "guitar" ? "gt" : "bs";
    return {
      prompt: { text: msg("ex.fretFind.prompt", { note: L.pc(nameAs), string: L.num(pos.string) }) },
      answer: { kind: "frets", mode: "single", instrument, tuning: tuning.strings, frets: 12, target: same.filter((q) => q.string === pos.string), match: "position" },
      targets: [posItem(instrument, tuning, pos)],
      uses: [`${pre}.parts`, posItem(instrument, tuning, pos), ...pcLabelConcepts(nameAs)],
      item: posItem(instrument, tuning, pos) + ".find",
    };
  },
};

/** Leer una tablatura corta y tocarla en el diapasón. */
export const tabRead: Generator = {
  requires: [],
  canRun: (ctx, params) => has(ctx, params.instrument === "bass" ? "bs.tab" : "gt.tab") && fretPool(ctx, params.instrument as "guitar" | "bass", tuningFor(ctx, params.instrument as "guitar" | "bass"), 12).length >= 2,
  make(ctx, params) {
    const instrument = params.instrument as "guitar" | "bass";
    const tuning = tuningFor(ctx, instrument);
    const pool = fretPool(ctx, instrument, tuning);
    const len = Math.min(ctx.rng.int(3, 5), Math.max(2, pool.length));
    const seq: { string: number; fret: number }[] = [];
    for (let i = 0; i < len; i++) seq.push(i === 0 ? pickFocused(ctx, pool, (x) => posItem(instrument, tuning, x)) : ctx.rng.pick(pool));
    const withRhythm = has(ctx, "rh.q") && has(ctx, "rh.8") && params.rhythm !== false;
    const events: ScoreEvent[] = seq.map((pos) => ({ duration: dur(withRhythm ? ctx.rng.pick(["q", "8"] as const) : "q"), notes: [{ pitch: pitchAt(tuning, pos.string, pos.fret), tab: pos }] }));
    const score = { ...singleStaffScore({ clef: instrument === "bass" ? "bass" : "treble", instrument, events, showTab: true, showStaff: false, tuning: tuning.strings, freeNotes: !withRhythm, hideTimeSig: true }) };
    if (!withRhythm) score.freeNotes = true;
    const pre = instrument === "guitar" ? "gt" : "bs";
    return {
      prompt: { text: msg("ex.tabRead.prompt"), score, audio: scoreToSequence(score) },
      answer: { kind: "frets", mode: "sequence", instrument, tuning: tuning.strings, frets: 12, target: seq, match: "position" },
      targets: [`${pre}.tab`, ...seq.map((p) => posItem(instrument, tuning, p))],
      uses: [`${pre}.tab`, `${pre}.parts`, ...seq.map((p) => posItem(instrument, tuning, p)), ...(withRhythm ? events.map((e) => figureConcept(e.duration.base, false)) : [])],
      item: `${pre}.tab.read`,
    };
  },
};

function knownShapes(ctx: GenContext): ChordShape[] {
  const out: ChordShape[] = GUITAR_OPEN_SHAPES.filter((s) => has(ctx, s.concept));
  for (const m of GUITAR_MOVABLE_SHAPES) {
    if (!has(ctx, m.concept)) continue;
    for (const r of nameablePcs(ctx.known)) {
      const placed = placeMovable(m, r);
      if (placed && placed.movable!.rootFret <= 10 && placed.movable!.rootFret >= 1) out.push(placed);
    }
  }
  return out;
}

function shapeChord(s: ChordShape): Chord {
  if (s.chord.includes(":")) {
    const [root, q] = s.chord.split(":");
    return { ...C(root), quality: q as Chord["quality"] };
  }
  return C(s.chord);
}

function guitarChordUses(c: Chord, s: ChordShape): ConceptId[] {
  const out: ConceptId[] = [s.concept, "gt.parts"];
  if (c.root.acc === 1) out.push("acc.sharp");
  if (c.root.acc === -1) out.push("acc.flat");
  return out;
}

/** Ver un diagrama y decir qué acorde es. */
export const chordDiagramName: Generator = {
  requires: ["gt.parts"],
  canRun: (ctx) => knownShapes(ctx).length >= 2,
  make(ctx) {
    const shapes = knownShapes(ctx);
    const sh = pickFocused(ctx, shapes, (s) => s.concept, 0.55);
    const chord = shapeChord(sh);
    const others = shapes.filter((s) => chordKey(shapeChord(s)) !== chordKey(chord));
    const lab = (c: Chord): Label => ({ kind: "chord", chord: c });
    const picks = ctx.rng.sample(others, 3);
    return {
      prompt: { text: msg("ex.chordDiagramName.prompt"), diagram: sh, audio: chordsSequence([shapePitches(sh)], { instrument: "guitar", arpeggiate: 0.04 }) },
      answer: choice(ctx.rng, lab(chord), picks.map((s) => lab(shapeChord(s)))),
      targets: [sh.concept],
      uses: [...guitarChordUses(chord, sh), ...picks.flatMap((s) => guitarChordUses(shapeChord(s), s))],
      item: sh.concept + (sh.movable ? `@${sh.movable.rootFret}` : ""),
    };
  },
};

/** Ver el nombre y armar el acorde en el diapasón. */
export const chordShapePlay: Generator = {
  requires: ["gt.parts"],
  canRun: (ctx) => knownShapes(ctx).length >= 1,
  make(ctx) {
    const shapes = knownShapes(ctx);
    const sh = pickFocused(ctx, shapes, (s) => s.concept, 0.6);
    const chord = shapeChord(sh);
    const n = 6;
    const target = sh.frets.map((f, i) => (f === null ? null : { string: n - i, fret: f })).filter((x): x is { string: number; fret: number } => x !== null && x.fret > 0);
    return {
      prompt: { text: msg("ex.chordShapePlay.prompt", { chord: { kind: "chord", chord } }) },
      answer: { kind: "frets", mode: "set", instrument: "guitar", tuning: STANDARD.strings, frets: 12, target, match: "position" },
      targets: [sh.concept],
      uses: guitarChordUses(chord, sh),
      item: sh.concept + ".play",
    };
  },
};

/** Escuchar dos acordes conocidos y decir cuál sonó (mayor/menor). */
export const guitarChordEar: Generator = {
  requires: ["gt.parts"],
  canRun: (ctx) => knownShapes(ctx).filter((s) => !s.movable).length >= 2,
  make(ctx) {
    const shapes = knownShapes(ctx).filter((s) => !s.movable);
    const sh = pickFocused(ctx, shapes, (s) => s.concept, 0.5);
    const chord = shapeChord(sh);
    const others = shapes.filter((s) => s !== sh);
    const lab = (c: Chord): Label => ({ kind: "chord", chord: c });
    return {
      prompt: { text: msg("ex.guitarChordEar.prompt"), audio: chordsSequence([shapePitches(sh)], { instrument: "guitar", arpeggiate: 0.03, length: 2 }), autoplay: true },
      answer: choice(ctx.rng, lab(chord), others.map((s) => lab(shapeChord(s))), 3),
      targets: [sh.concept],
      uses: [...guitarChordUses(chord, sh), ...others.flatMap((s) => guitarChordUses(shapeChord(s), s))],
      item: sh.concept + ".ear",
    };
  },
};

/** Bajo: tocar la fundamental del acorde. */
export const bassRoot: Generator = {
  requires: ["bs.root"],
  canRun: (ctx) => has(ctx, "bs.root") && fretPool(ctx, "bass", tuningFor(ctx, "bass")).length >= 3,
  make(ctx) {
    const tuning = tuningFor(ctx, "bass");
    const pool = fretPool(ctx, "bass", tuning);
    const pos = ctx.rng.pick(pool);
    const p = pitchAt(tuning, pos.string, pos.fret);
    const quals = ["maj", ...(ctx.known.has("bs.minor") || ctx.known.has("ch.min") ? ["min"] : [])] as Chord["quality"][];
    const chord: Chord = { root: { letter: p.letter, acc: p.acc }, quality: ctx.rng.pick(quals) };
    const same = pool.filter((q) => chroma(pitchAt(tuning, q.string, q.fret)) === chroma(p));
    return {
      prompt: { text: msg("ex.bassRoot.prompt", { chord: { kind: "chord", chord } }) },
      answer: { kind: "frets", mode: "single", instrument: "bass", tuning: tuning.strings, frets: 12, target: same, match: "pc" },
      targets: ["bs.root"],
      uses: ["bs.root", "bs.parts", ...pcLabelConcepts(p), ...(chord.quality === "min" ? ["bs.minor"] : []), ...same.map((q) => fretConcept("bass", tuning, q.string, q.fret))],
      item: "bs.root",
    };
  },
};

/** Bajo: patrón de octava/quinta — ¿dónde está la octava / la quinta de esta nota? */
export const bassShape: Generator = {
  requires: ["bs.octave"],
  canRun: (ctx) => has(ctx, "bs.octave"),
  make(ctx) {
    const tuning = tuningFor(ctx, "bass");
    const useFifth = has(ctx, "bs.fifth") && ctx.rng.bool(ctx.focus === "bs.fifth" ? 0.75 : 0.4);
    const cands: { root: { string: number; fret: number }; target: { string: number; fret: number } }[] = [];
    for (const string of [3, 4]) {
      for (let fret = 0; fret <= 9; fret++) {
        const target = useFifth ? { string: string - 1, fret: fret + 2 } : { string: string - 2, fret: fret + 2 };
        if (has(ctx, fretConcept("bass", tuning, string, fret)) && has(ctx, fretConcept("bass", tuning, target.string, target.fret))) cands.push({ root: { string, fret }, target });
      }
    }
    const { root, target } = cands.length ? ctx.rng.pick(cands) : { root: { string: 4, fret: 0 }, target: { string: useFifth ? 3 : 2, fret: 2 } };
    const { string, fret } = root;
    const p = pitchAt(tuning, string, fret);
    return {
      prompt: { text: msg(useFifth ? "ex.bassShape.fifth" : "ex.bassShape.octave"), fretboard: { instrument: "bass", tuning: tuning.strings, frets: 12, marks: [{ ...root, role: "root" }] }, audio: notesSequence([p, pitchAt(tuning, target.string, target.fret)], { instrument: "bass" }) },
      answer: { kind: "frets", mode: "single", instrument: "bass", tuning: tuning.strings, frets: 12, target: [target], match: "position" },
      targets: [useFifth ? "bs.fifth" : "bs.octave"],
      uses: ["bs.parts", "bs.octave", ...(useFifth ? ["bs.fifth"] : [])],
      item: useFifth ? "bs.fifth" : "bs.octave",
    };
  },
};

/** Escala/patrón en el diapasón: pentatónica (guitarra o bajo), marcar sus notas. */
export const fretScale: Generator = {
  requires: ["sc.pentMinor"],
  canRun: (ctx, params) => has(ctx, params.instrument === "bass" ? "bs.pent" : "gt.pent"),
  make(ctx, params) {
    const instrument = params.instrument as "guitar" | "bass";
    const tuning = tuningFor(ctx, instrument);
    const root = ctx.rng.pick([pc(5), pc(2), pc(4)]); // La, Mi, Sol
    const pcs = [0, 3, 5, 7, 10].map((s) => (chroma(root) + s) % 12);
    const rootFret = ((chroma(root) - chroma(tuning.strings[tuning.strings.length - 1]) + 12) % 12) || 12;
    const target: { string: number; fret: number }[] = [];
    for (let s = 1; s <= tuning.strings.length; s++) for (let f = rootFret; f <= rootFret + 3; f++) if (pcs.includes(chroma(pitchAt(tuning, s, f)))) target.push({ string: s, fret: f });
    const pre = instrument === "guitar" ? "gt" : "bs";
    return {
      prompt: { text: msg("ex.fretScale.prompt", { tonic: L.pc(root) }), fretboard: { instrument, tuning: tuning.strings, frets: 15, marks: [{ string: tuning.strings.length, fret: rootFret, role: "root" }] } },
      answer: { kind: "frets", mode: "set", instrument, tuning: tuning.strings, frets: 15, target, match: "position" },
      targets: [`${pre}.pent`],
      uses: [`${pre}.pent`, "sc.pentMinor", `${pre}.parts`, "t.notes"],
      item: `${pre}.pent`,
    };
  },
};

// ======================= BATERÍA =======================

function knownPieces(ctx: GenContext): DrumPiece[] {
  return DRUM_PIECES.filter((d) => has(ctx, d.concept)).map((d) => d.id);
}

/** Pieza en el pentagrama de percusión: ¿cuál es? */
export const drumPieceRead: Generator = {
  requires: ["dr.kit", "clef.percussion"],
  canRun: (ctx) => knownPieces(ctx).length >= 1,
  make(ctx) {
    const pieces = knownPieces(ctx);
    const p = ctx.rng.weighted(pieces, (x) => (DRUMS[x].concept === ctx.focus ? 4 : ctx.weight(DRUMS[x].concept)));
    const score = singleStaffScore({ clef: "percussion", instrument: "drums", events: [{ duration: dur("q"), notes: [{ drum: p }] }], freeNotes: true });
    const all = DRUM_PIECES.filter((d) => has(ctx, d.concept) || d.id === "kick" || d.id === "snare" || d.id === "hhClosed").map((d) => d.id).filter((x) => x !== p);
    return {
      prompt: { text: msg("ex.drumPieceRead.prompt"), score, audio: scoreToSequence(score) },
      answer: choice(ctx.rng, L.msg(`drum.${p}`), all.map((x) => L.msg(`drum.${x}`))),
      targets: [DRUMS[p].concept],
      uses: ["dr.kit", "clef.percussion", DRUMS[p].concept],
      item: DRUMS[p].concept,
    };
  },
};

/** Escuchar una pieza y reconocerla. */
export const drumPieceEar: Generator = {
  requires: ["dr.kit"],
  canRun: (ctx) => knownPieces(ctx).length >= 2,
  make(ctx) {
    const pieces = knownPieces(ctx);
    const p = ctx.rng.weighted(pieces, (x) => (DRUMS[x].concept === ctx.focus ? 4 : 1));
    const seq = { events: [0, 0.5, 1].map((t) => ({ time: t, duration: 0.4, note: DRUMS[p].gm, velocity: 0.85, instrument: "drums" as const })), cursor: [], duration: 1.5, measureStarts: [] };
    return {
      prompt: { text: msg("ex.drumPieceEar.prompt"), audio: seq, autoplay: true },
      answer: choice(ctx.rng, L.msg(`drum.${p}`), pieces.filter((x) => x !== p).map((x) => L.msg(`drum.${x}`))),
      targets: [DRUMS[p].concept],
      uses: ["dr.kit", ...pieces.map((x) => DRUMS[x].concept)],
      item: DRUMS[p].concept + ".ear",
    };
  },
};

/** Grooves predefinidos por concepto (patrón por corcheas o semicorcheas). */
interface GrooveDef {
  concept: ConceptId;
  ts: TimeSignature;
  grid: "8" | "16" | "q" | "8t";
  /** Una cadena por pieza: x = golpe, o = abierto/acento, . = nada. */
  lanes: Partial<Record<DrumPiece, string>>;
  requires: ConceptId[];
}

export const GROOVES: GrooveDef[] = [
  { concept: "dr.groove.q", ts: { num: 4, den: 4 }, grid: "q", lanes: { hhClosed: "xxxx", kick: "x.x.", snare: ".x.x" }, requires: ["rh.q"] },
  { concept: "dr.groove.8", ts: { num: 4, den: 4 }, grid: "8", lanes: { hhClosed: "xxxxxxxx", kick: "x...x...", snare: "..x...x." }, requires: ["rh.8"] },
  { concept: "dr.groove.8", ts: { num: 4, den: 4 }, grid: "8", lanes: { hhClosed: "xxxxxxxx", kick: "x...xx..", snare: "..x...x." }, requires: ["rh.8"] },
  { concept: "dr.groove.kick", ts: { num: 4, den: 4 }, grid: "8", lanes: { hhClosed: "xxxxxxxx", kick: "x..xx...", snare: "..x...x." }, requires: ["rh.8"] },
  { concept: "dr.groove.kick", ts: { num: 4, den: 4 }, grid: "8", lanes: { hhClosed: "xxxxxxxx", kick: "x.x.x.x.", snare: "..x...x." }, requires: ["rh.8"] },
  { concept: "dr.groove.kick", ts: { num: 4, den: 4 }, grid: "8", lanes: { hhClosed: "xxxxxxxx", kick: "xx..x.x.", snare: "..x...x." }, requires: ["rh.8"] },
  { concept: "dr.read.hhOpen", ts: { num: 4, den: 4 }, grid: "8", lanes: { hhClosed: "xxxxxxx.", hhOpen: ".......x", kick: "x...x...", snare: "..x...x." }, requires: ["rh.8"] },
  { concept: "dr.read.ride", ts: { num: 4, den: 4 }, grid: "8", lanes: { ride: "xxxxxxxx", kick: "x...x...", snare: "..x...x." }, requires: ["rh.8"] },
  { concept: "dr.groove.16", ts: { num: 4, den: 4 }, grid: "16", lanes: { hhClosed: "xxxxxxxxxxxxxxxx", kick: "x.......x.x.....", snare: "....x.......x..." }, requires: ["rh.16"] },
  { concept: "dr.groove.16", ts: { num: 4, den: 4 }, grid: "16", lanes: { hhClosed: "xxxxxxxxxxxxxxxx", kick: "x..x..x...x.....", snare: "....x.......x..." }, requires: ["rh.16"] },
  { concept: "dr.groove.half", ts: { num: 4, den: 4 }, grid: "8", lanes: { hhClosed: "xxxxxxxx", kick: "x.......", snare: "....x..." }, requires: ["rh.8"] },
  { concept: "dr.groove.68", ts: { num: 6, den: 8 }, grid: "8", lanes: { hhClosed: "xxxxxx", kick: "x.....", snare: "...x.." }, requires: ["ts.6/8"] },
  { concept: "dr.fill", ts: { num: 4, den: 4 }, grid: "8", lanes: { crash: "x.......", kick: "x.......", snare: "..xxxxxx" }, requires: ["rh.8"] },
  { concept: "dr.fill.toms", ts: { num: 4, den: 4 }, grid: "8", lanes: { snare: "xx......", tomHigh: "..xx....", tomMid: "....xx..", tomFloor: "......xx" }, requires: ["rh.8"] },
];

function grooveEvents(g: GrooveDef): ScoreEvent[] {
  const len = Object.values(g.lanes)[0]!.length;
  const events: ScoreEvent[] = [];
  for (let i = 0; i < len; i++) {
    const notes = (Object.entries(g.lanes) as [DrumPiece, string][]).filter(([, s]) => s[i] === "x" || s[i] === "o").map(([d]) => ({ drum: d }));
    events.push({ duration: { base: g.grid === "8t" ? "8" : g.grid }, notes });
  }
  return events;
}

export function grooveScore(g: GrooveDef, tempo = 90) {
  return singleStaffScore({ clef: "percussion", instrument: "drums", events: grooveEvents(g), timeSig: g.ts, tempo });
}

function grooveUses(g: GrooveDef): ConceptId[] {
  const pieces = Object.keys(g.lanes) as DrumPiece[];
  const out = new Set<ConceptId>(["dr.kit", "clef.percussion", g.concept, ...g.requires, timeSigConcept(g.ts.num, g.ts.den), figureConcept(g.grid === "8t" ? "8" : g.grid, false)]);
  for (const p of pieces) out.add(DRUMS[p].concept);
  // Los silencios entre golpes se escriben como silencios de la grilla
  if (grooveEvents(g).some((e) => e.notes.length === 0)) out.add(figureConcept(g.grid === "8t" ? "8" : g.grid, true));
  return [...out];
}

function knownGrooves(ctx: GenContext): GrooveDef[] {
  return GROOVES.filter((g) => grooveUses(g).every((c) => has(ctx, c)));
}

/** Escuchar un groove y elegir su partitura. */
export const grooveEar: Generator = {
  requires: ["dr.kit", "clef.percussion"],
  canRun: (ctx) => knownGrooves(ctx).length >= 2,
  make(ctx) {
    const gs = knownGrooves(ctx);
    const g = ctx.rng.weighted(gs, (x) => (x.concept === ctx.focus ? 4 : 1));
    const tempo = ctx.rng.int(80, 100);
    const others = gs.filter((x) => x !== g);
    const lab = (x: GrooveDef): Label => ({ kind: "score", score: grooveScore(x, tempo) });
    const audio = scoreToSequence(grooveScore(g, tempo));
    // dos vueltas
    const twice = { ...audio, events: [...audio.events, ...audio.events.map((e) => ({ ...e, time: e.time + audio.duration }))], duration: audio.duration * 2 };
    return {
      prompt: { text: msg("ex.grooveEar.prompt"), audio: twice, autoplay: true, drumPads: true },
      answer: choice(ctx.rng, lab(g), others.map(lab), 3),
      targets: [g.concept],
      uses: [...grooveUses(g), ...others.flatMap(grooveUses)],
      item: g.concept + ".ear",
    };
  },
};

/** Leer un groove: ¿cuántos golpes de bombo tiene? / ¿en qué tiempo va el redoblante? */
export const grooveRead: Generator = {
  requires: ["dr.kit", "clef.percussion"],
  canRun: (ctx) => knownGrooves(ctx).length >= 1,
  make(ctx) {
    const gs = knownGrooves(ctx);
    const g = ctx.rng.weighted(gs, (x) => (x.concept === ctx.focus ? 4 : 1));
    const pieces = (Object.keys(g.lanes) as DrumPiece[]).filter((p) => g.lanes[p]!.includes("x"));
    const piece = ctx.rng.pick(pieces);
    const count = g.lanes[piece]!.split("").filter((c) => c === "x").length;
    return {
      prompt: { text: msg("ex.grooveRead.prompt", { piece: L.msg(`drum.${piece}`) }), score: grooveScore(g), audio: scoreToSequence(grooveScore(g)), drumPads: true },
      answer: choice(ctx.rng, L.num(count), [count - 1, count + 1, count + 2, count * 2].filter((x) => x > 0 && x !== count).map(L.num)),
      targets: [g.concept, DRUMS[piece].concept],
      uses: grooveUses(g),
      item: g.concept + ".read",
    };
  },
};

// ======================= OÍDO: DICTADO MELÓDICO =======================

/** Dictado melódico: escuchar 3-5 notas y escribirlas con los botones de nombre. */
export const melodicDictation: Generator = {
  requires: ["ear.melodic"],
  canRun: (ctx) => readableNotes(ctx.known, "treble").filter((p) => midi(p) >= 60 && midi(p) <= 67).length >= 3,
  make(ctx, params) {
    const pool = readableNotes(ctx.known, "treble").filter((p) => midi(p) >= 60 && midi(p) <= (params.wide ? 72 : 67));
    const len = ctx.rng.int(3, Math.min(5, 2 + Math.floor(pool.length / 2)));
    // empezar siempre en Do (referencia) y moverse por grados conjuntos o saltos chicos
    const ps: Pitch[] = [pool[0]];
    let i = 0;
    for (let k = 1; k < len; k++) {
      i = Math.max(0, Math.min(pool.length - 1, i + ctx.rng.pick([-2, -1, 1, 1, 2])));
      ps.push(pool[i]);
    }
    const choices = pool.map((p) => ({ letter: p.letter, acc: p.acc }) as PitchClass).filter((p, idx, arr) => arr.findIndex((q) => samePc(q, p)) === idx);
    return {
      prompt: { text: msg("ex.melodicDictation.prompt", { first: L.pc(ps[0]) }), audio: notesSequence(ps, { length: 0.7 }), autoplay: true },
      answer: { kind: "names", target: ps.map((p) => ({ letter: p.letter, acc: p.acc })), choices },
      targets: ["ear.melodic"],
      uses: ["ear.melodic", "t.notes", ...ps.map((p) => readingConcept(p, "treble"))],
      item: "ear.melodic",
    };
  },
};

void P;
void fromMidi;
void BASS4;
void randomRhythm;
void rhythmScore;
void readingClefs;

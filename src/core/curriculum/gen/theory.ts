// SPDX-License-Identifier: GPL-3.0-or-later
// Generadores de teoría y oído: semitonos, intervalos, escalas, tonalidades, acordes y armonía.
import { type Pitch, type PitchClass, pc, P, midi, fromMidi, samePc, chroma, diatonicIndex } from "../../theory/pitch";
import { type Interval, intervalBetween, transpose, transposePc, sameInterval, semitones, invert } from "../../theory/interval";
import { scalePcs, scalePitches, type ScaleType, stepPattern, MODES } from "../../theory/scale";
import { keyFromFifths, signatureAccidentals, relative, type Key } from "../../theory/key";
import { type Chord, type ChordQuality, chordPcs, chordVoicing, CHORDS } from "../../theory/chord";
import { diatonicChords, functionOfDegree, romanString, chordFromRoman, analyzeChord, type RomanNumeral, classifyCadence, type CadenceType } from "../../theory/harmony";
import { singleStaffScore, note, type ScoreEvent } from "../../notation/score";
import { notesSequence, chordsSequence } from "../../notation/playback";
import { dur } from "../../theory/rhythm";
import { intervalConcept, keySigConcept, QUALITY_CONCEPT, chordTheoryRequirements, flatConcepts, readingConcept } from "../extract";
import type { ConceptId, GenContext, Label } from "../types";
import {
  type Generator, L, msg, choice, has, knownIntervals, knownQualities, knownMajorFifths, knownKeys, knownScales, SCALE_CONCEPT,
  readableNotes, nameablePcs, pcLabelConcepts, keyIsNameable, readingUses,
} from "./common";

// ---- Tono y semitono ----

export const toneSemitone: Generator = {
  requires: ["t.semitone"],
  canRun: () => true,
  make(ctx) {
    const isSemi = ctx.rng.bool();
    const a = ctx.rng.int(60, 70);
    const b = a + (isSemi ? 1 : 2);
    const marks = [{ midi: a, role: "target" as const }, { midi: b, role: "target" as const }];
    return {
      prompt: { text: msg("ex.toneSemitone.prompt"), keyboard: { from: 60, to: 76, marks }, audio: { events: [{ time: 0, duration: 0.7, note: a, velocity: 0.8, instrument: "piano" }, { time: 0.8, duration: 0.7, note: b, velocity: 0.8, instrument: "piano" }], cursor: [], duration: 1.6, measureStarts: [] } },
      answer: { kind: "choice", options: [L.msg("term.semitone"), L.msg("term.tone")], correct: isSemi ? 0 : 1 },
      targets: ["t.semitone"],
      uses: ["t.semitone", "t.keyboardMap"],
      item: "t.semitone",
    };
  },
};

/** Enarmonía: ¿qué otro nombre tiene esta nota? */
export const enharmonic: Generator = {
  requires: ["t.enharmonic", "acc.sharp", "acc.flat"],
  canRun: (ctx) => has(ctx, "acc.sharp") && has(ctx, "acc.flat"),
  make(ctx) {
    const blacks = [pc(0, 1), pc(1, 1), pc(3, 1), pc(4, 1), pc(5, 1)];
    const p = ctx.rng.pick(blacks);
    const toFlat = ctx.rng.bool();
    const shown = toFlat ? p : pc(p.letter + 1, -1);
    const ans = toFlat ? pc(p.letter + 1, -1) : p;
    const distract = nameablePcs(ctx.known).filter((q) => chroma(q) !== chroma(ans));
    return {
      prompt: { text: msg("ex.enharmonic.prompt", { note: L.pc(shown) }) },
      answer: choice(ctx.rng, L.pc(ans), ctx.rng.sample(distract, 5).map(L.pc)),
      targets: ["t.enharmonic"],
      uses: ["t.enharmonic", "acc.sharp", "acc.flat", "t.notes"],
      item: "t.enharmonic",
    };
  },
};

// ---- Intervalos ----

function pickInterval(ctx: GenContext): Interval {
  const ivs = knownIntervals(ctx.known);
  const focus = ivs.filter((iv) => intervalConcept(iv) === ctx.focus);
  if (focus.length && ctx.rng.bool(0.45)) return ctx.rng.pick(focus);
  return ctx.rng.weighted(ivs, (iv) => ctx.weight(intervalConcept(iv)));
}

/** Escuchar un intervalo y reconocerlo. */
export const intervalEar: Generator = {
  requires: ["t.interval"],
  canRun: (ctx) => knownIntervals(ctx.known).length >= 2,
  make(ctx, params) {
    const iv = pickInterval(ctx);
    const modes = (params.modes as string[] | undefined) ?? ["asc", "desc", "harm"];
    const mode = ctx.rng.pick(modes);
    const root = ctx.rng.int(55, 67);
    const top = root + semitones(iv);
    const a = fromMidi(root), b = fromMidi(top);
    const seq = mode === "harm" ? notesSequence([a, b], { harmonic: true, length: 1.2 }) : notesSequence(mode === "asc" ? [a, b] : [b, a], { length: 0.8 });
    const options = knownIntervals(ctx.known).filter((x) => !sameInterval(x, iv));
    // Distractores cercanos en semitonos primero
    options.sort((x, y) => Math.abs(semitones(x) - semitones(iv)) - Math.abs(semitones(y) - semitones(iv)));
    return {
      prompt: { text: msg(`ex.intervalEar.${mode}`), audio: seq, autoplay: true },
      answer: choice(ctx.rng, L.iv(iv), options.slice(0, 4).map((x) => L.iv(x))),
      targets: [intervalConcept(iv)],
      uses: ["t.interval", ...knownIntervals(ctx.known).map(intervalConcept)],
      item: `${intervalConcept(iv)}.ear.${mode}`,
    };
  },
};

/** Ver dos notas en el pentagrama (o sus nombres) y nombrar el intervalo. */
export const intervalName: Generator = {
  requires: ["t.interval"],
  canRun: (ctx) => knownIntervals(ctx.known).length >= 2 && readableNotes(ctx.known, "treble").length >= 5,
  make(ctx) {
    const iv = pickInterval(ctx);
    const pool = readableNotes(ctx.known, "treble");
    const accs = [0, ...(has(ctx, "acc.sharp") ? [1] : []), ...(has(ctx, "acc.flat") ? [-1] : [])];
    // Buscar una nota base legible cuya transposición también sea legible y nombrable
    const candidates: [Pitch, Pitch][] = [];
    for (const base of pool) {
      for (const acc of accs) {
        const a: Pitch = { ...base, acc: acc as Pitch["acc"] };
        const b = transpose(a, iv);
        if (Math.abs(b.acc) > 1 || !accs.includes(b.acc)) continue;
        if (!pool.some((x) => x.letter === b.letter && x.octave === b.octave)) continue;
        candidates.push([a, b]);
      }
    }
    if (!candidates.length) return intervalEar.make(ctx, {});
    const [a, b] = ctx.rng.pick(candidates);
    const harmonic = has(ctx, "t.harmonic") && ctx.rng.bool(ctx.focus === "t.harmonic" ? 0.8 : 0.3);
    const events: ScoreEvent[] = harmonic ? [{ duration: dur("w"), notes: [{ pitch: a }, { pitch: b }] }] : [note(a, dur("w")), note(b, dur("w"))];
    const score = singleStaffScore({ clef: "treble", events, freeNotes: true });
    const options = knownIntervals(ctx.known).filter((x) => !sameInterval(x, iv));
    options.sort((x, y) => Math.abs(x.size - iv.size) - Math.abs(y.size - iv.size));
    return {
      prompt: { text: msg("ex.intervalName.prompt"), score, audio: notesSequence([a, b], { harmonic }) },
      answer: choice(ctx.rng, L.iv(iv), options.slice(0, 4).map((x) => L.iv(x))),
      targets: [intervalConcept(iv)],
      uses: ["t.interval", ...readingUses(a, "treble"), ...readingUses(b, "treble"), ...(harmonic ? ["t.harmonic"] : []), ...knownIntervals(ctx.known).map(intervalConcept)],
      item: `${intervalConcept(iv)}.read`,
    };
  },
};

/** Construir: ¿qué nota está una 3M arriba de Do? */
export const intervalBuild: Generator = {
  requires: ["t.interval", "t.notes"],
  canRun: (ctx) => knownIntervals(ctx.known).length >= 2,
  make(ctx) {
    const iv = pickInterval(ctx);
    const nameable = nameablePcs(ctx.known);
    const cands = nameable.filter((p) => nameable.some((q) => samePc(q, transposePc(p, iv))));
    const root = ctx.rng.pick(cands.length ? cands : [pc(0)]);
    const ans = transposePc(root, iv);
    const distract = nameable.filter((q) => !samePc(q, ans)).sort((x, y) => Math.abs(chroma(x) - chroma(ans)) - Math.abs(chroma(y) - chroma(ans)));
    return {
      prompt: { text: msg("ex.intervalBuild.prompt", { iv: L.iv(iv), note: L.pc(root) }) },
      answer: choice(ctx.rng, L.pc(ans), distract.slice(0, 5).map(L.pc)),
      targets: [intervalConcept(iv)],
      uses: ["t.interval", intervalConcept(iv), ...pcLabelConcepts(root), ...pcLabelConcepts(ans), ...distract.slice(0, 5).flatMap(pcLabelConcepts)],
      item: `${intervalConcept(iv)}.build`,
    };
  },
};

/** ¿Cuántos semitonos tiene el intervalo? */
export const intervalSemitones: Generator = {
  requires: ["t.interval", "t.semitone"],
  canRun: (ctx) => knownIntervals(ctx.known).length >= 1,
  make(ctx) {
    const iv = pickInterval(ctx);
    const s = semitones(iv);
    return {
      prompt: { text: msg("ex.intervalSemitones.prompt", { iv: L.iv(iv) }) },
      answer: choice(ctx.rng, L.num(s), [s - 1, s + 1, s + 2, s - 2].filter((x) => x > 0).map(L.num)),
      targets: [intervalConcept(iv)],
      uses: ["t.interval", "t.semitone", intervalConcept(iv)],
      item: `${intervalConcept(iv)}.semis`,
    };
  },
};

/** Inversión de intervalos. */
export const intervalInvert: Generator = {
  requires: ["iv.inversion"],
  canRun: (ctx) => knownIntervals(ctx.known).filter((iv) => iv.size < 8 && knownIntervals(ctx.known).some((x) => sameInterval(x, invert(iv)))).length > 0,
  make(ctx) {
    const ivs = knownIntervals(ctx.known).filter((iv) => iv.size < 8 && knownIntervals(ctx.known).some((x) => sameInterval(x, invert(iv))));
    const iv = ctx.rng.pick(ivs);
    const inv = invert(iv);
    return {
      prompt: { text: msg("ex.intervalInvert.prompt", { iv: L.iv(iv) }) },
      answer: choice(ctx.rng, L.iv(inv), knownIntervals(ctx.known).filter((x) => !sameInterval(x, inv)).map((x) => L.iv(x))),
      targets: ["iv.inversion"],
      uses: ["iv.inversion", ...knownIntervals(ctx.known).map(intervalConcept)],
      item: `iv.inversion.${intervalConcept(iv)}`,
    };
  },
};

// ---- Escalas y tonalidades ----

function nameableKey(ctx: GenContext, mode?: "major" | "minor"): Key | null {
  const keys = knownKeys(ctx.known).filter((k) => keyIsNameable(k, ctx.known) && (!mode || k.mode === mode));
  const allPcsNameable = (k: Key) => scalePcs(k.tonic, k.mode === "major" ? "major" : "minor").every((p) => Math.abs(p.acc) <= 1 && (p.acc === 0 || (p.acc === 1 ? has(ctx, "acc.sharp") : has(ctx, "acc.flat"))));
  const ok = keys.filter(allPcsNameable);
  if (!ok.length) return null;
  const focused = ok.filter((k) => keySigConcept(fifthsOfKey(k)) === ctx.focus);
  return focused.length && ctx.rng.bool(0.5) ? ctx.rng.pick(focused) : ctx.rng.pick(ok);
}

function fifthsOfKey(k: Key): number {
  for (let f = -7; f <= 7; f++) {
    const kk = keyFromFifths(f, k.mode);
    if (samePc(kk.tonic, k.tonic)) return f;
  }
  return 0;
}

function keyUses(k: Key): ConceptId[] {
  const out: ConceptId[] = ["t.key", k.mode === "major" ? "sc.major" : "sc.minor"];
  const ks = keySigConcept(fifthsOfKey(k));
  if (ks) out.push(ks);
  if (k.mode === "minor") out.push("t.relative");
  out.push(...pcLabelConcepts(k.tonic));
  return out;
}

/** Escala con una nota faltante. */
export const scaleMissing: Generator = {
  requires: ["sc.major"],
  canRun: (ctx) => knownScales(ctx.known).length > 0,
  make(ctx) {
    const scales = knownScales(ctx.known).filter((s) => !MODES.includes(s) || s === "ionian" || s === "aeolian");
    const type: ScaleType = scales.includes(ctx.focus.replace("sc.", "") as ScaleType) && ctx.rng.bool(0.5) ? (ctx.focus.replace("sc.", "") as ScaleType) : ctx.rng.pick(scales);
    // Tónica: una tonalidad conocida (para mayores/menores) o una nota natural con alteraciones conocidas
    const tonicCands = nameablePcs(ctx.known).filter((t) => {
      const pcs = scalePcs(t, type);
      return pcs.every((p) => Math.abs(p.acc) <= 1 && (p.acc === 0 || (p.acc === 1 ? has(ctx, "acc.sharp") : has(ctx, "acc.flat"))));
    });
    const keyTonics = knownKeys(ctx.known).map((k) => k.tonic);
    const preferred = tonicCands.filter((t) => keyTonics.some((k) => samePc(k, t)));
    const tonic = ctx.rng.pick(preferred.length ? preferred : tonicCands.length ? tonicCands : [pc(0)]);
    const pcs = scalePcs(tonic, type);
    const hole = ctx.rng.int(1, pcs.length - 1);
    const ans = pcs[hole];
    const shown: Label[] = pcs.map((p, i) => (i === hole ? L.text("?") : L.pc(p)));
    const distract = nameablePcs(ctx.known).filter((q) => !samePc(q, ans) && (q.letter === ans.letter || Math.abs(chroma(q) - chroma(ans)) <= 2));
    return {
      prompt: { text: msg("ex.scaleMissing.prompt", { scale: L.msg(`scale.${type}`), tonic: L.pc(tonic) }), big: { kind: "names", items: shown } },
      answer: choice(ctx.rng, L.pc(ans), distract.map(L.pc)),
      targets: [SCALE_CONCEPT[type]!],
      uses: [SCALE_CONCEPT[type]!, ...pcs.flatMap(pcLabelConcepts), ...distract.flatMap(pcLabelConcepts)],
      item: `${SCALE_CONCEPT[type]}.${tonic.letter}${tonic.acc}`,
    };
  },
};

/** Patrón de tonos y semitonos. */
export const scalePattern: Generator = {
  requires: ["t.semitone"],
  canRun: (ctx) => knownScales(ctx.known).filter((s) => s !== "majorPentatonic" && s !== "minorPentatonic" && s !== "blues").length > 0,
  make(ctx) {
    const scales = knownScales(ctx.known).filter((s) => s !== "majorPentatonic" && s !== "minorPentatonic" && s !== "blues");
    const type = ctx.rng.pick(scales);
    const pat = stepPattern(type).join(" ");
    const others = scales.filter((s) => stepPattern(s).join(" ") !== pat);
    const wrong = new Set<string>();
    for (const o of others) wrong.add(stepPattern(o).join(" "));
    // patrones falsos rotados
    const steps = stepPattern(type);
    for (let i = 1; i < steps.length && wrong.size < 4; i++) {
      const rot = [...steps.slice(i), ...steps.slice(0, i)].join(" ");
      if (rot !== pat) wrong.add(rot);
    }
    // cada paso es una clave traducible (T/S en español, W/H en inglés)
    const label = (p: string): Label => ({ kind: "names", items: p.split(" ").map((x) => L.msg(`step.${x}`)) });
    return {
      prompt: { text: msg("ex.scalePattern.prompt", { scale: L.msg(`scale.${type}`) }) },
      answer: choice(ctx.rng, label(pat), [...wrong].map(label)),
      targets: [SCALE_CONCEPT[type]!],
      uses: [SCALE_CONCEPT[type]!, "t.semitone"],
      item: `${SCALE_CONCEPT[type]}.pattern`,
    };
  },
};

/** Escuchar una escala y reconocer su tipo. */
export const scaleEar: Generator = {
  requires: ["sc.major"],
  canRun: (ctx) => knownScales(ctx.known).length >= 2,
  make(ctx) {
    const scales = knownScales(ctx.known).filter((s) => s !== "ionian" && s !== "aeolian");
    const type = ctx.rng.weighted(scales, (s) => (SCALE_CONCEPT[s] === ctx.focus ? 4 : ctx.weight(SCALE_CONCEPT[s]!)));
    const tonic = fromMidi(ctx.rng.int(57, 64));
    const ps = scalePitches({ ...tonic, acc: 0 }, type);
    const seq = notesSequence(ps, { length: 0.4 });
    return {
      prompt: { text: msg("ex.scaleEar.prompt"), audio: seq, autoplay: true },
      answer: choice(ctx.rng, L.msg(`scale.${type}`), scales.filter((s) => s !== type).map((s) => L.msg(`scale.${s}`))),
      targets: [SCALE_CONCEPT[type]!],
      uses: scales.map((s) => SCALE_CONCEPT[s]!),
      item: `${SCALE_CONCEPT[type]}.ear`,
    };
  },
};

/** Reconocer la tonalidad por la armadura. */
export const keySignature: Generator = {
  requires: ["t.key", "t.staff", "clef.treble"],
  canRun: (ctx) => knownMajorFifths(ctx.known).filter((f) => f !== 0).length >= 1,
  make(ctx) {
    const fifths = knownMajorFifths(ctx.known);
    const f = ctx.rng.weighted(fifths, (x) => (keySigConcept(x) === ctx.focus ? 5 : x === 0 ? 0.5 : ctx.weight(keySigConcept(x) ?? "sc.major")));
    const minor = has(ctx, "t.relative") && has(ctx, "sc.minor") && ctx.rng.bool(0.3);
    const key = keyFromFifths(f, minor ? "minor" : "major");
    const score = { ...singleStaffScore({ clef: "treble", events: [], keyFifths: f, freeNotes: true }), hideTimeSig: true };
    const label = (k: Key) => L.msg(k.mode === "major" ? "key.major" : "key.minor", { tonic: L.pc(k.tonic) });
    const others = fifths.filter((x) => x !== f).map((x) => keyFromFifths(x, minor ? "minor" : "major")).filter((k) => keyIsNameable(k, ctx.known));
    return {
      prompt: { text: msg(minor ? "ex.keySignature.minor" : "ex.keySignature.prompt"), score },
      answer: choice(ctx.rng, label(key), others.map(label)),
      targets: [keySigConcept(f) ?? "sc.major"],
      uses: [...keyUses(key), ...others.flatMap(keyUses), "t.staff", "clef.treble"],
      item: `ks.${f}${minor ? "m" : ""}`,
    };
  },
};

/** Alteraciones de una tonalidad. */
export const keyAccidentals: Generator = {
  requires: ["t.key"],
  canRun: (ctx) => knownMajorFifths(ctx.known).filter((f) => f !== 0).length >= 1,
  make(ctx) {
    const fifths = knownMajorFifths(ctx.known).filter((f) => f !== 0);
    const f = ctx.rng.weighted(fifths, (x) => (keySigConcept(x) === ctx.focus ? 5 : 1));
    const key = keyFromFifths(f);
    const accs = signatureAccidentals(f);
    const show = (n: number) => L.num(n);
    return {
      prompt: { text: msg(f > 0 ? "ex.keyAccidentals.sharps" : "ex.keyAccidentals.flats", { key: L.msg("key.major", { tonic: L.pc(key.tonic) }) }) },
      answer: choice(ctx.rng, show(accs.length), [accs.length - 1, accs.length + 1, accs.length + 2].filter((x) => x >= 0 && x <= 7).map(show)),
      targets: [keySigConcept(f)!],
      uses: keyUses(key),
      item: `ks.count.${f}`,
    };
  },
};

/** Tonalidad relativa. */
export const relativeKey: Generator = {
  requires: ["t.relative", "sc.minor"],
  canRun: (ctx) => knownKeys(ctx.known).some((k) => k.mode === "minor"),
  make(ctx) {
    const keys = knownKeys(ctx.known).filter((k) => keyIsNameable(k, ctx.known) && keyIsNameable(relative(k), ctx.known));
    const k = ctx.rng.pick(keys);
    const rel = relative(k);
    const label = (x: Key) => L.msg(x.mode === "major" ? "key.major" : "key.minor", { tonic: L.pc(x.tonic) });
    const others = keys.filter((x) => x.mode === rel.mode && !samePc(x.tonic, rel.tonic));
    return {
      prompt: { text: msg("ex.relativeKey.prompt", { key: label(k) }) },
      answer: choice(ctx.rng, label(rel), others.map(label)),
      targets: ["t.relative"],
      uses: [...keyUses(k), ...keyUses(rel), ...others.flatMap(keyUses)],
      item: "t.relative",
    };
  },
};

// ---- Modos ----

export const modeIdentify: Generator = {
  requires: ["mode.intro"],
  canRun: (ctx) => MODES.filter((m) => has(ctx, SCALE_CONCEPT[m]!)).length >= 2,
  make(ctx) {
    const modes = MODES.filter((m) => has(ctx, SCALE_CONCEPT[m]!));
    const type = ctx.rng.weighted(modes, (m) => (SCALE_CONCEPT[m] === ctx.focus ? 4 : 1));
    const asText = ctx.rng.bool(0.5);
    if (asText) {
      // Modo como escala de Do mayor desde otro grado ("blanco"), en nombres
      const idx = MODES.indexOf(type);
      const start = pc(idx);
      const pcs = scalePcs(start, type);
      return {
        prompt: { text: msg("ex.modeIdentify.prompt"), big: { kind: "names", items: pcs.map(L.pc) } },
        answer: choice(ctx.rng, L.msg(`scale.${type}`), modes.filter((m) => m !== type).map((m) => L.msg(`scale.${m}`))),
        targets: [SCALE_CONCEPT[type]!],
        uses: [...modes.map((m) => SCALE_CONCEPT[m]!), "t.notes"],
        item: `${SCALE_CONCEPT[type]}.id`,
      };
    }
    const tonic = fromMidi(ctx.rng.pick([57, 60, 62, 64]));
    const ps = scalePitches({ ...tonic, acc: 0 }, type);
    // Pedal de la tónica para que se escuche el color modal
    const seq = notesSequence(ps, { length: 0.42 });
    seq.events.push({ time: 0, duration: seq.duration, note: midi(tonic) - 12, velocity: 0.5, instrument: "piano" });
    return {
      prompt: { text: msg("ex.modeEar.prompt"), audio: seq, autoplay: true },
      answer: choice(ctx.rng, L.msg(`scale.${type}`), modes.filter((m) => m !== type).map((m) => L.msg(`scale.${m}`))),
      targets: [SCALE_CONCEPT[type]!],
      uses: modes.map((m) => SCALE_CONCEPT[m]!),
      item: `${SCALE_CONCEPT[type]}.ear`,
    };
  },
};

// ---- Acordes ----

function pickQuality(ctx: GenContext): ChordQuality {
  const qs = knownQualities(ctx.known);
  const focus = qs.filter((q) => QUALITY_CONCEPT[q] === ctx.focus);
  if (focus.length && ctx.rng.bool(0.45)) return ctx.rng.pick(focus);
  return ctx.rng.weighted(qs, (q) => ctx.weight(QUALITY_CONCEPT[q]));
}

function nameableChord(ctx: GenContext, q: ChordQuality): Chord {
  const roots = nameablePcs(ctx.known).filter((r) => chordPcs({ root: r, quality: q }).every((p) => Math.abs(p.acc) <= 1 && (p.acc === 0 || (p.acc === 1 ? has(ctx, "acc.sharp") : has(ctx, "acc.flat")))));
  return { root: ctx.rng.pick(roots.length ? roots : [pc(0)]), quality: q };
}

/** Escuchar un acorde y reconocer su tipo. */
export const chordEar: Generator = {
  requires: ["ch.maj"],
  canRun: (ctx) => knownQualities(ctx.known).length >= 2,
  make(ctx, params) {
    const q = pickQuality(ctx);
    const root = fromMidi(ctx.rng.int(53, 62));
    const v = chordVoicing({ root: { letter: root.letter, acc: root.acc }, quality: q }, root.octave);
    const arp = (params.arpeggio as boolean | undefined) ?? ctx.rng.bool(0.3);
    const seq = chordsSequence([v], { length: 1.8, arpeggiate: arp ? 0.25 : 0 });
    const qs = knownQualities(ctx.known);
    return {
      prompt: { text: msg("ex.chordEar.prompt"), audio: seq, autoplay: true },
      answer: choice(ctx.rng, L.msg(`quality.${q}`), qs.filter((x) => x !== q).map((x) => L.msg(`quality.${x}`))),
      targets: [QUALITY_CONCEPT[q]],
      uses: qs.map((x) => QUALITY_CONCEPT[x]),
      item: `${QUALITY_CONCEPT[q]}.ear`,
    };
  },
};

/** ¿Qué notas forman este acorde? */
export const chordSpell: Generator = {
  requires: ["ch.maj", "t.notes"],
  canRun: (ctx) => knownQualities(ctx.known).length >= 1,
  make(ctx) {
    const q = pickQuality(ctx);
    const chord = nameableChord(ctx, q);
    const pcs = chordPcs(chord);
    const fmt = (ps: PitchClass[]): Label => ({ kind: "names", items: ps.map(L.pc) });
    const wrong: PitchClass[][] = [];
    // Variaciones: cambiar la tercera o la quinta por un semitono
    for (const i of [1, 2, 3].filter((x) => x < pcs.length)) {
      for (const d of [-1, 1]) {
        const alt = pcs.slice();
        const t = alt[i];
        const na = t.acc + d;
        if (Math.abs(na) > 1) continue;
        if (na === 1 && !has(ctx, "acc.sharp")) continue;
        if (na === -1 && !has(ctx, "acc.flat")) continue;
        alt[i] = pc(t.letter, na);
        wrong.push(alt);
      }
    }
    if (wrong.length < 2) wrong.push(pcs.map((p) => pc(p.letter + 1, 0)));
    const sym: Label = { kind: "chord", chord };
    return {
      prompt: { text: msg("ex.chordSpell.prompt", { chord: sym }) },
      answer: choice(ctx.rng, fmt(pcs), wrong.map(fmt)),
      targets: [QUALITY_CONCEPT[q]],
      uses: [...flatConcepts(chordTheoryRequirements(chord)), ...wrong.flat().flatMap(pcLabelConcepts), ...pcs.flatMap(pcLabelConcepts)],
      item: `${QUALITY_CONCEPT[q]}.spell`,
    };
  },
};

/** Ver notas y nombrar el acorde. */
export const chordName: Generator = {
  requires: ["ch.maj", "t.notes"],
  canRun: (ctx) => knownQualities(ctx.known).length >= 2,
  make(ctx) {
    const q = pickQuality(ctx);
    const chord = nameableChord(ctx, q);
    const pcs = chordPcs(chord);
    const others: Chord[] = knownQualities(ctx.known).filter((x) => x !== q).map((x) => ({ root: chord.root, quality: x }));
    const lab = (c: Chord): Label => ({ kind: "chord", chord: c });
    return {
      prompt: { text: msg("ex.chordName.prompt"), big: { kind: "names", items: pcs.map(L.pc) }, audio: chordsSequence([chordVoicing(chord, 4)]) },
      answer: choice(ctx.rng, lab(chord), others.map(lab)),
      targets: [QUALITY_CONCEPT[q]],
      uses: [...flatConcepts(chordTheoryRequirements(chord)), ...others.flatMap((c) => flatConcepts(chordTheoryRequirements(c))), ...pcs.flatMap(pcLabelConcepts)],
      item: `${QUALITY_CONCEPT[q]}.name`,
    };
  },
};

/** Acorde en el pentagrama: nombrarlo. */
export const chordRead: Generator = {
  requires: ["ch.maj", "t.staff", "clef.treble", "t.harmonic"],
  canRun: (ctx) => knownQualities(ctx.known).filter((q) => CHORDS[q].intervals.length <= 4).length >= 2 && readableNotes(ctx.known, "treble").length >= 8,
  make(ctx) {
    const pool = readableNotes(ctx.known, "treble");
    const qs = knownQualities(ctx.known).filter((q) => CHORDS[q].intervals.length <= 4 && q !== "5");
    for (let t = 0; t < 40; t++) {
      const q = ctx.rng.pick(qs);
      const base = ctx.rng.pick(pool);
      const chord: Chord = { root: { letter: base.letter, acc: 0 }, quality: q };
      const v = chordVoicing(chord, base.octave);
      if (!v.every((p) => pool.some((x) => x.letter === p.letter && x.octave === p.octave))) continue;
      if (!v.every((p) => p.acc === 0 || (p.acc === 1 && has(ctx, "acc.sharp")) || (p.acc === -1 && has(ctx, "acc.flat")))) continue;
      const score = singleStaffScore({ clef: "treble", events: [{ duration: dur("w"), notes: v.map((p) => ({ pitch: p })) }], freeNotes: true });
      const others: Chord[] = qs.filter((x) => x !== q).map((x) => ({ root: chord.root, quality: x }));
      const lab = (c: Chord): Label => ({ kind: "chord", chord: c });
      return {
        prompt: { text: msg("ex.chordRead.prompt"), score, audio: chordsSequence([v]) },
        answer: choice(ctx.rng, lab(chord), others.map(lab)),
        targets: [QUALITY_CONCEPT[q]],
        uses: [...flatConcepts(chordTheoryRequirements(chord)), ...others.flatMap((c) => flatConcepts(chordTheoryRequirements(c))), ...v.flatMap((p) => readingUses(p, "treble")), "t.harmonic"],
        item: `${QUALITY_CONCEPT[q]}.read`,
      };
    }
    return chordName.make(ctx, {});
  },
};

/** Cifrado americano ↔ latino. */
export const chordSymbolConvert: Generator = {
  requires: ["t.cifrado"],
  canRun: (ctx) => knownQualities(ctx.known).length >= 1,
  make(ctx) {
    const q = pickQuality(ctx);
    const chord = nameableChord(ctx, q);
    const toLatin = ctx.rng.bool();
    const lab = (c: Chord, latin: boolean): Label => L.msg(latin ? "chord.latin" : "chord.english", { chord: { kind: "chord", chord: c } });
    const wrongRoots = nameablePcs(ctx.known).filter((r) => !samePc(r, chord.root));
    const others: Chord[] = ctx.rng.sample(wrongRoots, 3).map((r) => ({ root: r, quality: q }));
    return {
      prompt: { text: msg(toLatin ? "ex.chordConvert.toLatin" : "ex.chordConvert.toEnglish", { chord: lab(chord, !toLatin) }) },
      answer: choice(ctx.rng, lab(chord, toLatin), others.map((c) => lab(c, toLatin))),
      targets: ["t.cifrado"],
      uses: ["t.cifrado", ...flatConcepts(chordTheoryRequirements(chord)), ...others.flatMap((c) => flatConcepts(chordTheoryRequirements(c)))],
      item: "t.cifrado",
    };
  },
};

/** Inversiones: ¿en qué inversión está? */
export const chordInversion: Generator = {
  requires: ["ch.inv"],
  canRun: (ctx) => has(ctx, "ch.inv"),
  make(ctx) {
    const q = ctx.rng.pick(knownQualities(ctx.known).filter((x) => CHORDS[x].intervals.length === 3 && x !== "5"));
    const chord = nameableChord(ctx, q);
    const inv = ctx.rng.int(0, 2);
    const v = chordVoicing(chord, 4, inv);
    const names = v.map((p) => L.pc(p));
    const opts = [L.msg("inv.root"), L.msg("inv.first"), L.msg("inv.second")];
    return {
      prompt: { text: msg("ex.chordInversion.prompt"), big: { kind: "names", items: names }, audio: chordsSequence([v], { arpeggiate: 0.2 }) },
      answer: { kind: "choice", options: opts, correct: inv },
      targets: ["ch.inv"],
      uses: ["ch.inv", ...flatConcepts(chordTheoryRequirements(chord)), ...v.flatMap(pcLabelConcepts)],
      item: "ch.inv",
    };
  },
};

// ---- Armonía ----

function harmonyKey(ctx: GenContext, majorOnly = false): Key {
  const keys = knownKeys(ctx.known).filter((k) => keyIsNameable(k, ctx.known) && (!majorOnly || k.mode === "major") && diatonicChords(k).every((c) => chordPcs(c).every((p) => Math.abs(p.acc) <= 1 && (p.acc === 0 || has(ctx, p.acc > 0 ? "acc.sharp" : "acc.flat")))));
  return keys.length ? ctx.rng.pick(keys) : { tonic: pc(0), mode: "major" };
}

function chordUses(c: Chord): ConceptId[] {
  return flatConcepts(chordTheoryRequirements(c));
}

/** ¿Qué acorde es el grado X en tal tonalidad? */
export const degreeChord: Generator = {
  requires: ["h.field", "h.roman"],
  canRun: (ctx) => has(ctx, "h.roman") && knownKeys(ctx.known).length > 0,
  make(ctx) {
    const key = harmonyKey(ctx, !has(ctx, "h.field.minor"));
    const sevenths = has(ctx, "h.field7") && ctx.rng.bool(0.4);
    const chords = diatonicChords(key, sevenths);
    const deg = ctx.rng.int(1, 7);
    const chord = chords[deg - 1];
    const rn: RomanNumeral = { degree: deg, acc: 0, quality: chord.quality };
    const lab = (c: Chord): Label => ({ kind: "chord", chord: c });
    const keyLabel = L.msg(key.mode === "major" ? "key.major" : "key.minor", { tonic: L.pc(key.tonic) });
    const others = chords.filter((_, i) => i !== deg - 1);
    return {
      prompt: { text: msg("ex.degreeChord.prompt", { roman: L.text(romanString(rn)), key: keyLabel }) },
      answer: choice(ctx.rng, lab(chord), others.map(lab)),
      targets: ["h.roman"],
      uses: ["h.field", "h.roman", ...keyUses(key), ...chords.flatMap(chordUses), ...(sevenths ? ["h.field7"] : [])],
      item: `h.roman.${deg}`,
    };
  },
};

/** Función tonal de un grado. */
export const harmonicFunction: Generator = {
  requires: ["h.function"],
  canRun: (ctx) => has(ctx, "h.function"),
  make(ctx) {
    const key = harmonyKey(ctx, true);
    const deg = ctx.rng.pick([1, 2, 4, 5, 6, 7, 3]);
    const chord = diatonicChords(key)[deg - 1];
    const fn = functionOfDegree(deg);
    const opts = ["T", "SD", "D"];
    return {
      prompt: { text: msg("ex.harmonicFunction.prompt", { chord: { kind: "chord", chord }, key: L.msg("key.major", { tonic: L.pc(key.tonic) }) }) },
      answer: { kind: "choice", options: opts.map((f) => L.msg(`fn.${f}`)), correct: opts.indexOf(fn) },
      targets: ["h.function"],
      uses: ["h.function", ...keyUses(key), ...chordUses(chord)],
      item: `h.function.${deg}`,
    };
  },
};

const PROG_POOL: { id: string; degrees: number[]; requires: ConceptId[] }[] = [
  { id: "I-IV-V-I", degrees: [1, 4, 5, 1], requires: ["h.function"] },
  { id: "I-V-I", degrees: [1, 5, 1], requires: ["h.function"] },
  { id: "I-IV-I", degrees: [1, 4, 1], requires: ["h.function"] },
  { id: "I-V-vi-IV", degrees: [1, 5, 6, 4], requires: ["h.prog"] },
  { id: "I-vi-IV-V", degrees: [1, 6, 4, 5], requires: ["h.prog"] },
  { id: "vi-IV-I-V", degrees: [6, 4, 1, 5], requires: ["h.prog"] },
  { id: "ii-V-I", degrees: [2, 5, 1], requires: ["h.iiVI"] },
  { id: "I-ii-V-I", degrees: [1, 2, 5, 1], requires: ["h.iiVI"] },
];

/** Escuchar una progresión y reconocerla en grados. */
export const progressionEar: Generator = {
  requires: ["h.function", "ear.prog"],
  canRun: (ctx) => PROG_POOL.filter((p) => p.requires.every((r) => has(ctx, r))).length >= 2,
  make(ctx) {
    const pool = PROG_POOL.filter((p) => p.requires.every((r) => has(ctx, r)));
    const prog = ctx.rng.pick(pool);
    const tonic = fromMidi(ctx.rng.pick([60, 62, 55, 57, 64, 65]));
    const key: Key = { tonic: { letter: tonic.letter, acc: tonic.acc }, mode: "major" };
    const sev = prog.id.includes("ii-V") && has(ctx, "h.field7");
    const chords = prog.degrees.map((d) => diatonicChords(key, sev)[d - 1]);
    // Conducción de voces sencilla: acordes en posición cercana + bajo en la fundamental
    const voicings = chords.map((c) => {
      const v = chordVoicing({ root: c.root, quality: c.quality }, 4);
      const ms = v.map(midi);
      while (Math.max(...ms) > 74) for (let i = 0; i < ms.length; i++) ms[i] -= 12;
      const bass = fromMidi(48 + ((chroma(c.root) - 0 + 12) % 12));
      return [bass, ...ms.map((m) => fromMidi(m))];
    });
    const seq = chordsSequence(voicings, { length: 1.4 });
    const romans = (p: typeof prog) => L.text(p.degrees.map((d) => romanString({ degree: d, acc: 0, quality: diatonicChords(key)[d - 1].quality })).join(" – "));
    return {
      prompt: { text: msg("ex.progressionEar.prompt"), audio: seq, autoplay: true },
      answer: choice(ctx.rng, romans(prog), pool.filter((p) => p !== prog).map(romans)),
      targets: ["ear.prog", ...prog.requires],
      uses: ["ear.prog", "h.roman", ...pool.flatMap((p) => p.requires)],
      item: `ear.prog.${prog.id}`,
    };
  },
};

/** Cadencias: reconocer el tipo. */
export const cadenceIdentify: Generator = {
  requires: ["h.cadence"],
  canRun: (ctx) => has(ctx, "h.cadence"),
  make(ctx) {
    const types: [number, number][] = [[5, 1], [4, 1], [1, 5], [5, 6]];
    const [a, b] = ctx.rng.pick(types);
    const type = classifyCadence(a, b) as CadenceType;
    const key: Key = { tonic: pc(0), mode: "major" };
    const ch = [diatonicChords(key)[a - 1], diatonicChords(key)[b - 1]];
    const voic = ch.map((c) => [fromMidi(48 + chroma(c.root)), ...chordVoicing(c, 4)]);
    const ear = ctx.rng.bool(0.5);
    const lab = (t: CadenceType) => L.msg(`cadence.${t}`);
    const all: CadenceType[] = ["authentic", "plagal", "half", "deceptive"];
    return {
      prompt: ear
        ? { text: msg("ex.cadence.ear"), audio: chordsSequence([...diatonicChords(key).slice(0, 1).map((c) => [fromMidi(48), ...chordVoicing(c, 4)]), ...voic], { length: 1.2 }), autoplay: true }
        : { text: msg("ex.cadence.prompt", { a: L.text(romanString({ degree: a, acc: 0, quality: ch[0].quality })), b: L.text(romanString({ degree: b, acc: 0, quality: ch[1].quality })) }) },
      answer: choice(ctx.rng, lab(type), all.filter((t) => t !== type).map(lab)),
      targets: ["h.cadence"],
      uses: ["h.cadence", "h.roman"],
      item: `h.cadence.${type}${ear ? ".ear" : ""}`,
    };
  },
};

/** Analizar un acorde en una tonalidad (diatónico, dominante secundaria, préstamo, sustituto tritonal). */
export const chordAnalysis: Generator = {
  requires: ["h.roman"],
  canRun: (ctx) => has(ctx, "h.secdom") || has(ctx, "h.borrowed") || has(ctx, "h.tritone"),
  make(ctx) {
    const key: Key = harmonyKey(ctx, true);
    const cands: { rn: RomanNumeral; concept: ConceptId }[] = [];
    for (let d = 1; d <= 7; d++) cands.push({ rn: { degree: d, acc: 0, quality: diatonicChords(key)[d - 1].quality }, concept: "h.roman" });
    if (has(ctx, "h.secdom")) for (const t of [2, 3, 4, 5, 6]) cands.push({ rn: { degree: 5, acc: 0, quality: "7", of: t }, concept: "h.secdom" });
    if (has(ctx, "h.borrowed")) {
      cands.push({ rn: { degree: 4, acc: 0, quality: "min", borrowed: true }, concept: "h.borrowed" });
      cands.push({ rn: { degree: 7, acc: -1, quality: "maj", borrowed: true }, concept: "h.borrowed" });
      cands.push({ rn: { degree: 6, acc: -1, quality: "maj", borrowed: true }, concept: "h.borrowed" });
      cands.push({ rn: { degree: 3, acc: -1, quality: "maj", borrowed: true }, concept: "h.borrowed" });
    }
    if (has(ctx, "h.tritone")) for (const t of [1, 2, 5]) cands.push({ rn: { degree: 2, acc: -1, quality: "7", tritoneSubOf: t, of: t === 1 ? undefined : t }, concept: "h.tritone" });
    const usable = cands.filter((c) => {
      const ch = chordFromRoman(key, c.rn);
      return chordPcs(ch).every((p) => Math.abs(p.acc) <= 1 && (p.acc === 0 || has(ctx, p.acc > 0 ? "acc.sharp" : "acc.flat")));
    });
    const focusC = usable.filter((c) => c.concept === ctx.focus);
    const pick = focusC.length && ctx.rng.bool(0.6) ? ctx.rng.pick(focusC) : ctx.rng.pick(usable);
    const chord = chordFromRoman(key, pick.rn);
    const an = analyzeChord(chord, key);
    const others = usable.filter((c) => c !== pick).map((c) => analyzeChord(chordFromRoman(key, c.rn), key).label).filter((l) => l !== an.label);
    return {
      prompt: { text: msg("ex.chordAnalysis.prompt", { chord: { kind: "chord", chord }, key: L.msg("key.major", { tonic: L.pc(key.tonic) }) }) },
      answer: choice(ctx.rng, L.text(an.label), [...new Set(others)].map(L.text)),
      targets: [pick.concept],
      uses: ["h.roman", ...usable.map((c) => c.concept), ...keyUses(key), ...chordUses(chord)],
      item: `analysis.${pick.concept}`,
    };
  },
};

void diatonicIndex;
void readingConcept;
void P;

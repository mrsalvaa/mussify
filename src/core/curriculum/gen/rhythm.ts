// SPDX-License-Identifier: GPL-3.0-or-later
// Generadores de ritmo: pulso, figuras, compases, lectura y dictado rítmico.
import { P } from "../../theory/pitch";
import { type Duration, type TimeSignature, type BaseDuration, Frac, durationValue, measureLength, isCompound, beatsOf, defaultAccents, FIGURE_NAMES } from "../../theory/rhythm";
import { type Score, type ScoreEvent, singleStaffScore, splitIntoMeasures } from "../../notation/score";
import { scoreToSequence, clickSequence, type Sequence } from "../../notation/playback";
import { figureConcept, timeSigConcept } from "../extract";
import type { ConceptId, GenContext, Label } from "../types";
import { type Generator, L, msg, choice, knownFigures, knownRests, knownTimeSigs, has } from "./common";
import type { Rng } from "../../random";

const RHYTHM_PITCH = P("B4");

/** Celda rítmica: ocupa uno o más pulsos. */
interface Cell {
  items: { d: Duration; rest?: boolean; tie?: boolean }[];
  beats: number;
  requires: ConceptId[];
}

const c = (beats: number, requires: ConceptId[], ...items: { d: Duration; rest?: boolean; tie?: boolean }[]): Cell => ({ beats, requires, items });
const n = (base: BaseDuration, dots = 0) => ({ d: dots ? { base, dots } : { base } });
const r = (base: BaseDuration) => ({ d: { base }, rest: true });

const SIMPLE_CELLS: Cell[] = [
  c(1, ["rh.q"], n("q")),
  c(1, ["rest.q"], r("q")),
  c(2, ["rh.h"], n("h")),
  c(2, ["rest.h"], r("h")),
  c(4, ["rh.w"], n("w")),
  c(4, ["rest.w"], r("w")),
  c(3, ["rh.h", "rh.dot"], n("h", 1)),
  c(1, ["rh.8"], n("8"), n("8")),
  c(1, ["rh.8", "rest.8"], r("8"), n("8")),
  c(1, ["rh.8", "rest.8"], n("8"), r("8")),
  c(2, ["rh.q", "rh.8", "rh.dot"], n("q", 1), n("8")),
  c(2, ["rh.8", "rh.q", "rh.sync"], n("8"), n("q"), n("8")),
  c(1, ["rh.16"], n("16"), n("16"), n("16"), n("16")),
  c(1, ["rh.16", "rh.8"], n("8"), n("16"), n("16")),
  c(1, ["rh.16", "rh.8"], n("16"), n("16"), n("8")),
  c(1, ["rh.16", "rh.8", "rh.dot"], n("8", 1), n("16")),
  c(1, ["rh.triplet", "rh.8"], { d: { base: "8", tuplet: { n: 3, inSpaceOf: 2 } } }, { d: { base: "8", tuplet: { n: 3, inSpaceOf: 2 } } }, { d: { base: "8", tuplet: { n: 3, inSpaceOf: 2 } } }),
  c(2, ["rh.tie", "rh.q"], { d: { base: "q" }, tie: true }, n("q")),
  c(4, ["rh.tie", "rh.h", "rh.q"], { d: { base: "h" }, tie: true }, n("q"), n("q")),
  c(2, ["rh.tie", "rh.q", "rh.8", "rh.sync"], n("8"), { d: { base: "8" }, tie: true }, n("8"), n("q")),
];

const COMPOUND_CELLS: Cell[] = [
  c(1, ["rh.q", "rh.dot"], n("q", 1)),
  c(1, ["rh.q", "rh.8"], n("q"), n("8")),
  c(1, ["rh.8"], n("8"), n("8"), n("8")),
  c(1, ["rh.8", "rh.q"], n("8"), n("q")),
  c(2, ["rh.h", "rh.dot"], n("h", 1)),
  c(1, ["rh.8", "rest.8"], n("8"), r("8"), n("8")),
  c(1, ["rh.16", "rh.8"], n("16"), n("16"), n("8"), n("8")),
];

function cellsFor(ctx: GenContext, ts: TimeSignature): Cell[] {
  const pool = isCompound(ts) ? COMPOUND_CELLS : SIMPLE_CELLS;
  return pool.filter((cell) => cell.requires.every((x) => ctx.known.has(x)));
}

/** Genera compases al azar con figuras conocidas (en 4/4 la unidad es la negra). */
export function randomRhythm(ctx: GenContext, ts: TimeSignature, measures: number, opts: { noRestStart?: boolean; preferFocus?: boolean } = {}): ScoreEvent[] | null {
  const cells = cellsFor(ctx, ts);
  if (!cells.length) return null;
  const { count } = beatsOf(ts);
  // en 2/2 o compases de corchea simples, cada pulso de la grilla es la figura del denominador
  const beatsPerMeasure = isCompound(ts) ? count : (ts.num * 4) / ts.den;
  if (!Number.isInteger(beatsPerMeasure)) return null;
  const events: ScoreEvent[] = [];
  for (let m = 0; m < measures; m++) {
    let left = beatsPerMeasure;
    let guard = 0;
    while (left > 0 && guard++ < 50) {
      const fits = cells.filter((cell) => cell.beats <= left && !(opts.noRestStart && events.length === 0 && cell.items[0].rest));
      if (!fits.length) return null;
      const focusCells = fits.filter((cell) => cell.requires.includes(ctx.focus));
      const cell = focusCells.length && ctx.rng.bool(0.45) ? ctx.rng.pick(focusCells) : ctx.rng.pick(fits);
      for (const it of cell.items) events.push({ duration: it.d, notes: it.rest ? [] : [{ pitch: RHYTHM_PITCH, tie: it.tie }] });
      left -= cell.beats;
    }
    if (left !== 0) return null;
  }
  return events;
}

export function rhythmScore(events: ScoreEvent[], ts: TimeSignature, tempo = 80, hideTimeSig = false): Score {
  return { ...singleStaffScore({ clef: "treble", events, timeSig: ts, tempo, hideTimeSig }), rhythmOnly: true };
}

/** Audio de un ritmo con un compás de cuenta previa de metrónomo. */
export function rhythmAudio(score: Score, countIn = true): Sequence {
  const ts = score.timeSig;
  const seq = scoreToSequence(score);
  const beats = beatsOf(ts);
  const beatSec = (60 / score.tempo) * 4 * beats.beat.value;
  const offset = countIn ? beats.count * beatSec : 0;
  const clicks = countIn ? clickSequence(beats.count, 60 / beatSec, defaultAccents(ts)).events : [];
  const events = [...clicks, ...seq.events.map((e) => ({ ...e, time: e.time + offset, instrument: "drums" as const, note: 37 }))];
  return { events, cursor: seq.cursor.map((cm) => ({ ...cm, time: cm.time + offset })), duration: seq.duration + offset, measureStarts: seq.measureStarts.map((x) => x + offset) };
}

function figureOne(base: BaseDuration, rest = false, dots = 0): Score {
  const d: Duration = dots ? { base, dots } : { base };
  return { ...singleStaffScore({ clef: "treble", events: [{ duration: d, notes: rest ? [] : [{ pitch: RHYTHM_PITCH }] }], freeNotes: true }), rhythmOnly: true };
}

function rhythmUses(events: ScoreEvent[], ts: TimeSignature | null): ConceptId[] {
  const out = new Set<ConceptId>(["t.pulse"]);
  for (const e of events) {
    out.add(figureConcept(e.duration.base, e.notes.length === 0));
    if (e.duration.dots) out.add("rh.dot");
    if (e.duration.tuplet) out.add("rh.triplet");
    if (e.notes.some((x) => x.tie)) out.add("rh.tie");
  }
  if (ts) out.add(timeSigConcept(ts.num, ts.den));
  return [...out];
}

function pickTs(ctx: GenContext, params: Record<string, unknown>): TimeSignature | null {
  const known = knownTimeSigs(ctx.known);
  if (params.ts) {
    const [a, b] = String(params.ts).split("/").map(Number);
    return known.find((t) => t.num === a && t.den === b) ?? null;
  }
  if (!known.length) return null;
  const focusTs = known.find((t) => `ts.${t.num}/${t.den}` === ctx.focus);
  return focusTs && ctx.rng.bool(0.6) ? focusTs : ctx.rng.pick(known);
}

/** Contar pulsos escuchados. */
export const pulseCount: Generator = {
  requires: ["t.pulse"],
  canRun: () => true,
  make(ctx) {
    const nBeats = ctx.rng.int(3, 7);
    const bpm = ctx.rng.int(70, 110);
    return {
      prompt: { text: msg("ex.pulseCount.prompt"), audio: clickSequence(nBeats, bpm, [0]), autoplay: true },
      answer: choice(ctx.rng, L.num(nBeats), [nBeats - 1, nBeats + 1, nBeats + 2, nBeats - 2].filter((x) => x > 1).map(L.num)),
      targets: ["t.pulse"],
      uses: ["t.pulse"],
      item: "t.pulse",
    };
  },
};

/** ¿Cuántos pulsos (negras) dura una figura? */
export const figureValue: Generator = {
  requires: ["t.pulse", "rh.q"],
  canRun: (ctx) => knownFigures(ctx.known).length > 0,
  make(ctx) {
    const figs = knownFigures(ctx.known).map((b) => ({ b, rest: false }));
    for (const b of knownRests(ctx.known)) figs.push({ b, rest: true });
    const pick = ctx.rng.weighted(figs, (f) => (figureConcept(f.b, f.rest) === ctx.focus ? 4 : ctx.weight(figureConcept(f.b, f.rest))));
    const value = durationValue({ base: pick.b }).value * 4;
    const fmt = (x: number) => (x >= 1 ? L.num(x) : L.msg("frac", { n: 1, d: Math.round(1 / x) }));
    const pool = [4, 2, 1, 0.5, 0.25, 3].filter((x) => x !== value);
    return {
      prompt: { text: msg(pick.rest ? "ex.figureValue.rest" : "ex.figureValue.prompt"), score: figureOne(pick.b, pick.rest) },
      answer: choice(ctx.rng, fmt(value), pool.map(fmt)),
      targets: [figureConcept(pick.b, pick.rest)],
      uses: ["t.pulse", "rh.q", figureConcept(pick.b, pick.rest)],
      item: figureConcept(pick.b, pick.rest),
      explain: msg("ex.figureValue.explain", { fig: L.msg(`fig.${pick.b}`), n: fmt(value) }),
    };
  },
};

/** Nombre de la figura. */
export const figureName: Generator = {
  requires: ["rh.q"],
  canRun: (ctx) => knownFigures(ctx.known).length >= 2,
  make(ctx) {
    const figs = knownFigures(ctx.known);
    const b = ctx.rng.weighted(figs, (f) => (figureConcept(f, false) === ctx.focus ? 4 : ctx.weight(figureConcept(f, false))));
    return {
      prompt: { text: msg("ex.figureName.prompt"), score: figureOne(b) },
      answer: choice(ctx.rng, L.msg(`fig.${b}`), figs.filter((f) => f !== b).map((f) => L.msg(`fig.${f}`))),
      targets: [figureConcept(b, false)],
      uses: figs.map((f) => figureConcept(f, false)),
      item: figureConcept(b, false) + ".name",
    };
  },
};

/** Sumar los pulsos de un ritmo. */
export const rhythmSum: Generator = {
  requires: ["t.pulse", "rh.q", "rh.h"],
  canRun: (ctx) => knownFigures(ctx.known).length >= 2,
  make(ctx) {
    const figs = knownFigures(ctx.known).filter((b) => b !== "16" && b !== "32");
    const count = ctx.rng.int(2, 4);
    const events: ScoreEvent[] = [];
    let total = 0;
    for (let i = 0; i < count; i++) {
      const base = ctx.rng.weighted(figs, (f) => (figureConcept(f, false) === ctx.focus ? 3 : 1));
      events.push({ duration: { base }, notes: [{ pitch: RHYTHM_PITCH }] });
      total += durationValue({ base }).value * 4;
    }
    // Para que el total sea entero, completar con negras si hace falta
    if (!Number.isInteger(total) && figs.includes("8")) {
      events.push({ duration: { base: "8" }, notes: [{ pitch: RHYTHM_PITCH }] });
      total += 0.5;
    }
    const score = { ...singleStaffScore({ clef: "treble", events, freeNotes: true }), rhythmOnly: true };
    return {
      prompt: { text: msg("ex.rhythmSum.prompt"), score },
      answer: choice(ctx.rng, L.num(total), [total + 1, total - 1, total + 2, total * 2].filter((x) => x > 0 && x !== total).map(L.num)),
      targets: events.map((e) => figureConcept(e.duration.base, false)),
      uses: rhythmUses(events, null),
      item: "rhythm.sum",
    };
  },
};

/** ¿Qué figura completa el compás? */
export const measureComplete: Generator = {
  requires: ["t.pulse", "t.measure"],
  canRun: (ctx) => knownTimeSigs(ctx.known).length > 0 && knownFigures(ctx.known).length >= 2,
  make(ctx, params) {
    const ts = pickTs(ctx, params) ?? { num: 4, den: 4 };
    for (let attempt = 0; attempt < 30; attempt++) {
      const ev = randomRhythm(ctx, ts, 1);
      if (!ev || ev.length < 2) continue;
      const last = ev[ev.length - 1];
      if (last.duration.tuplet || last.notes.some((x) => x.tie)) continue;
      const missingD = last.duration;
      const prev = ev.slice(0, -1);
      if (prev.some((x) => x.notes.some((nn) => nn.tie))) continue;
      const shown = rhythmScore(prev, ts);
      const options: Label[] = [];
      const isRest = last.notes.length === 0;
      const mk = (base: BaseDuration, dots = 0): Label => ({ kind: "score", score: figureOne(base, isRest, dots) });
      const figs = (isRest ? knownRests(ctx.known) : knownFigures(ctx.known)).filter((b) => !(b === missingD.base && !missingD.dots));
      for (const b of figs) options.push(mk(b));
      return {
        prompt: { text: msg("ex.measureComplete.prompt"), score: shown },
        answer: choice(ctx.rng, mk(missingD.base, missingD.dots ?? 0), options),
        targets: [timeSigConcept(ts.num, ts.den), figureConcept(missingD.base, isRest)],
        uses: [...rhythmUses(ev, ts), "t.measure", ...figs.map((b) => figureConcept(b, isRest))],
        item: `measure.${ts.num}/${ts.den}`,
      };
    }
    return figureValue.make(ctx, {});
  },
};

/** Dictado rítmico: escuchar y elegir la escritura correcta entre varias. */
export const rhythmDictation: Generator = {
  requires: ["t.pulse", "t.measure"],
  canRun: (ctx) => knownTimeSigs(ctx.known).length > 0 && knownFigures(ctx.known).length >= 2,
  make(ctx, params) {
    const ts = pickTs(ctx, params) ?? { num: 4, den: 4 };
    const measures = Number(params.measures ?? 1);
    const tempo = ctx.rng.int(70, 96);
    let target = randomRhythm(ctx, ts, measures, { noRestStart: true });
    let guard = 0;
    while ((!target || target.length < 2) && guard++ < 20) target = randomRhythm(ctx, ts, measures, { noRestStart: true });
    if (!target) return figureValue.make(ctx, {});
    const key = (evs: ScoreEvent[]) => evs.map((e) => `${e.duration.base}${e.duration.dots ?? ""}${e.notes.length ? "" : "r"}${e.notes[0]?.tie ? "~" : ""}`).join(" ");
    const distractors: ScoreEvent[][] = [];
    const seen = new Set([key(target)]);
    guard = 0;
    while (distractors.length < 2 && guard++ < 60) {
      const d = randomRhythm(ctx, ts, measures, { noRestStart: true });
      if (d && !seen.has(key(d))) {
        seen.add(key(d));
        distractors.push(d);
      }
    }
    const score = rhythmScore(target, ts, tempo);
    const opt = (evs: ScoreEvent[]): Label => ({ kind: "score", score: { ...rhythmScore(evs, ts, tempo), staves: [{ ...rhythmScore(evs, ts, tempo).staves[0], measures: splitIntoMeasures(evs, ts) }] } });
    return {
      prompt: { text: msg("ex.rhythmDictation.prompt"), audio: rhythmAudio(score), autoplay: true },
      answer: choice(ctx.rng, opt(target), distractors.map(opt)),
      targets: [...new Set(target.map((e) => figureConcept(e.duration.base, e.notes.length === 0)))],
      uses: [...new Set([...rhythmUses(target, ts), ...distractors.flatMap((d) => rhythmUses(d, ts)), "t.measure"])],
      item: `rhythm.dictation.${ts.num}/${ts.den}`,
    };
  },
};

/** Lectura rítmica: ver la escritura y elegir el audio correcto. */
export const rhythmRead: Generator = {
  requires: ["t.pulse", "t.measure"],
  canRun: (ctx) => knownTimeSigs(ctx.known).length > 0 && knownFigures(ctx.known).length >= 2,
  make(ctx, params) {
    const ts = pickTs(ctx, params) ?? { num: 4, den: 4 };
    const tempo = ctx.rng.int(70, 96);
    let target = randomRhythm(ctx, ts, 1, { noRestStart: true });
    let guard = 0;
    while ((!target || target.length < 2) && guard++ < 20) target = randomRhythm(ctx, ts, 1, { noRestStart: true });
    if (!target) return figureValue.make(ctx, {});
    const sig = (evs: ScoreEvent[]) => evs.map((e) => durationValue(e.duration).toString() + (e.notes.length ? "" : "r")).join(" ");
    const options: ScoreEvent[][] = [];
    const seen = new Set([sig(target)]);
    guard = 0;
    while (options.length < 2 && guard++ < 60) {
      const d = randomRhythm(ctx, ts, 1, { noRestStart: true });
      if (d && !seen.has(sig(d))) {
        seen.add(sig(d));
        options.push(d);
      }
    }
    const audioOf = (evs: ScoreEvent[]): Label => ({ kind: "audio", seq: rhythmAudio(rhythmScore(evs, ts, tempo)) });
    return {
      prompt: { text: msg("ex.rhythmRead.prompt"), score: rhythmScore(target, ts, tempo) },
      answer: choice(ctx.rng, audioOf(target), options.map(audioOf)),
      targets: [...new Set(target.map((e) => figureConcept(e.duration.base, e.notes.length === 0)))],
      uses: [...rhythmUses(target, ts), "t.measure"],
      item: `rhythm.read.${ts.num}/${ts.den}`,
    };
  },
};

/** Escuchar el acento y reconocer el compás (2, 3 o 4 tiempos; simple o compuesto). */
export const meterEar: Generator = {
  requires: ["t.pulse", "t.measure"],
  canRun: (ctx) => knownTimeSigs(ctx.known).length >= 2,
  make(ctx) {
    const known = knownTimeSigs(ctx.known);
    const ts = known.find((t) => `ts.${t.num}/${t.den}` === ctx.focus && ctx.rng.bool(0.6)) ?? ctx.rng.pick(known);
    const bpm = ctx.rng.int(80, 110);
    const beats = beatsOf(ts);
    const sub = isCompound(ts) ? 3 : 1;
    const seq = clickSequence(beats.count * 3, bpm, defaultAccents(ts), sub);
    const label = (t: TimeSignature) => L.text(`${t.num}/${t.den}`);
    return {
      prompt: { text: msg("ex.meterEar.prompt"), audio: seq, autoplay: true },
      answer: choice(ctx.rng, label(ts), known.filter((t) => t !== ts).map(label)),
      targets: [timeSigConcept(ts.num, ts.den)],
      uses: known.map((t) => timeSigConcept(t.num, t.den)),
      item: `meter.${ts.num}/${ts.den}`,
    };
  },
};

/** Dictado rítmico armado: escuchar un compás y escribirlo con botones de figuras. */
export const rhythmBuild: Generator = {
  requires: ["t.pulse", "t.measure", "ear.rhythm"],
  canRun: (ctx) => knownTimeSigs(ctx.known).length > 0 && knownFigures(ctx.known).length >= 2,
  make(ctx, params) {
    const ts = pickTs(ctx, params) ?? { num: 4, den: 4 };
    const tempo = ctx.rng.int(70, 90);
    let target = randomRhythm({ ...ctx, known: new Set([...ctx.known].filter((k) => k !== "rh.tie" && k !== "rh.triplet")) }, ts, 1, { noRestStart: true });
    let guard = 0;
    while ((!target || target.length < 2) && guard++ < 20) target = randomRhythm(ctx, ts, 1, { noRestStart: true });
    if (!target) return figureValue.make(ctx, {});
    const tok = (e: ScoreEvent) => `${e.duration.base}${e.duration.dots ? "." : ""}${e.notes.length ? "" : "r"}`;
    const choices = new Set<string>();
    for (const b of knownFigures(ctx.known)) choices.add(b);
    for (const b of knownRests(ctx.known)) choices.add(b + "r");
    if (has(ctx, "rh.dot")) for (const b of knownFigures(ctx.known)) if (b === "q" || b === "h") choices.add(b + ".");
    for (const e of target) choices.add(tok(e));
    const score = rhythmScore(target, ts, tempo);
    return {
      prompt: { text: msg("ex.rhythmBuild.prompt"), audio: rhythmAudio(score), autoplay: true },
      answer: { kind: "rhythm", target: target.map(tok), choices: [...choices], total: measureLength(ts).value },
      targets: ["ear.rhythm"],
      uses: [...rhythmUses(target, ts), "t.measure", "ear.rhythm", ...[...choices].map((t) => figureConcept(t.replace(/[.r]/g, ""), t.endsWith("r")))],
      item: `rhythm.build.${ts.num}/${ts.den}`,
    };
  },
};

/** Convierte un token de figura ("q", "8r", "h.") en duración. */
export function tokenDuration(tok: string): { d: Duration; rest: boolean } {
  const rest = tok.endsWith("r");
  const dotted = tok.includes(".");
  const base = tok.replace(/[.r]/g, "") as BaseDuration;
  return { d: dotted ? { base, dots: 1 } : { base }, rest };
}

export function tokensValue(toks: string[]): number {
  return toks.reduce((a, t) => a + durationValue(tokenDuration(t).d).value, 0);
}

export const FIG_NAMES = FIGURE_NAMES;
export { Frac };
export type { Rng };

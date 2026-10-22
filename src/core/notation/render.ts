// SPDX-License-Identifier: GPL-3.0-or-later
// Motor de grabado musical propio: convierte una Score en primitivas gráficas (SVG).
// Usa glifos SMuFL (fuente Bravura). 1 em = 4 espacios de pentagrama.
import { type Pitch, diatonicIndex, P } from "../theory/pitch";
import { type Duration, Frac, durationValue, isCompound, type TimeSignature, BASE_ORDER } from "../theory/rhythm";
import { signatureAccFor } from "../theory/key";
import { DRUMS } from "../instruments/drums";
import type { Clef, Score, ScoreEvent, Staff, NoteHead } from "./score";
import { eventValue } from "./score";

export type Prim =
  | { t: "line"; x1: number; y1: number; x2: number; y2: number; w: number; cls?: string }
  | { t: "glyph"; x: number; y: number; ch: string; size: number; cls?: string }
  | { t: "text"; x: number; y: number; s: string; size: number; cls?: string; anchor?: "start" | "middle" | "end"; bold?: boolean }
  | { t: "path"; d: string; w?: number; fill?: boolean; cls?: string }
  | { t: "rect"; x: number; y: number; w: number; h: number; cls?: string; rx?: number };

export interface EventBox {
  staff: number;
  measure: number;
  event: number;
  x: number;
  y0: number;
  y1: number;
  system: number;
}

export interface RenderResult {
  width: number;
  height: number;
  prims: Prim[];
  events: EventBox[];
  measures: { index: number; x0: number; x1: number; y0: number; y1: number; system: number }[];
}

export interface RenderOptions {
  width?: number;
  /** Tamaño del espacio entre líneas en px. */
  sp?: number;
  /** Compases a resaltar (loops). */
  highlightMeasures?: number[];
  /** Compases a atenuar (contenido aún no aprendido). */
  dimMeasures?: number[];
  showMeasureNumbers?: boolean;
  /** Nombres de las notas debajo (ayuda de lectura). */
  noteLabels?: (p: Pitch) => string;
  chordStyle?: (sym: string) => string;
}

// ---- Glifos SMuFL ----
const u = (cp: number) => String.fromCodePoint(cp);
export const G = {
  gClef: u(0xe050),
  gClef8vb: u(0xe052),
  fClef: u(0xe062),
  fClef8vb: u(0xe064),
  cClef: u(0xe05c),
  percClef: u(0xe069),
  tabClef: u(0xe06d),
  noteBlack: u(0xe0a4),
  noteHalf: u(0xe0a3),
  noteWhole: u(0xe0a2),
  noteX: u(0xe0a9),
  noteCircleX: u(0xe0b3),
  sharp: u(0xe262),
  flat: u(0xe260),
  natural: u(0xe261),
  dsharp: u(0xe263),
  dflat: u(0xe264),
  restW: u(0xe4e3),
  restH: u(0xe4e4),
  restQ: u(0xe4e5),
  rest8: u(0xe4e6),
  rest16: u(0xe4e7),
  rest32: u(0xe4e8),
  flag8Up: u(0xe240),
  flag8Down: u(0xe241),
  flag16Up: u(0xe242),
  flag16Down: u(0xe243),
  flag32Up: u(0xe244),
  flag32Down: u(0xe245),
  dot: u(0xe1e7),
  accent: u(0xe4a0),
  ts: (d: number) => u(0xe080 + d),
};

/** Paso (medio espacio) de la línea inferior de cada clave, como índice diatónico. */
const BOTTOM_LINE: Record<Clef, number> = {
  treble: diatonicIndex(P("E4")),
  bass: diatonicIndex(P("G2")),
  alto: diatonicIndex(P("F3")),
  tenor: diatonicIndex(P("D3")),
  percussion: diatonicIndex(P("E4")),
};

export function staffStep(p: Pitch, clef: Clef, octaveShift = 0): number {
  return diatonicIndex(p) + 7 * octaveShift - BOTTOM_LINE[clef];
}

/** Guitarra y bajo se escriben una octava más arriba de lo que suenan. */
export function writtenOctaveShift(staff: Staff): number {
  return staff.instrument === "guitar" || staff.instrument === "bass" ? 1 : 0;
}

const SHARP_STEPS_TREBLE = [8, 5, 9, 6, 3, 7, 4];
const FLAT_STEPS_TREBLE = [4, 7, 3, 6, 2, 5, 1];
const CLEF_KEY_SHIFT: Record<Clef, number> = { treble: 0, bass: -2, alto: -1, tenor: 1, percussion: 0 };

function accGlyph(acc: number): string {
  return acc === 1 ? G.sharp : acc === -1 ? G.flat : acc === 2 ? G.dsharp : acc === -2 ? G.dflat : G.natural;
}

function accWidth(acc: number): number {
  return acc === -2 ? 1.65 : acc === 0 ? 0.7 : 1.0;
}

function baseWidth(d: Duration): number {
  const idx = BASE_ORDER.indexOf(d.base);
  const w = [5.2, 3.9, 3.0, 2.4, 2.0, 1.8][idx];
  return w + (d.dots ? 0.7 * d.dots : 0);
}

interface StaffLayout {
  staff: Staff;
  index: number;
  hasStaff: boolean;
  hasTab: boolean;
  /** Y de la línea superior del pentagrama. */
  top: number;
  tabTop: number;
  tabLines: number;
  bottom: number;
}

const TAB_SP = 1.5; // espacio entre líneas de tablatura, en sp

/** Distancia vertical requerida por encima y por debajo, según las notas presentes. */
function staffExtents(staff: Staff, measures: number[]): { above: number; below: number; hasChords: boolean } {
  let maxStep = 8, minStep = 0, hasChords = false;
  for (const mi of measures) {
    const m = staff.measures[mi];
    if (!m) continue;
    for (const e of m.events) {
      if (e.chord) hasChords = true;
      for (const n of e.notes) {
        const p = n.drum ? DRUMS[n.drum].staffPos : n.pitch;
        if (!p) continue;
        const s = staffStep(p, n.drum ? "percussion" : staff.clef, n.drum ? 0 : writtenOctaveShift(staff));
        maxStep = Math.max(maxStep, s + 7);
        minStep = Math.min(minStep, s - 7);
      }
    }
  }
  return { above: Math.max(2.5, (maxStep - 8) / 2), below: Math.max(2.5, -minStep / 2), hasChords };
}

export function renderScore(score: Score, opts: RenderOptions = {}): RenderResult {
  const sp = opts.sp ?? 10;
  const width = opts.width ?? 700;
  const prims: Prim[] = [];
  const evBoxes: EventBox[] = [];
  const measureBoxes: RenderResult["measures"] = [];
  const nMeasures = Math.max(...score.staves.map((s) => s.measures.length), 0);
  const free = !!score.freeNotes;

  // --- 1. Grilla temporal de cada compás (común a todos los pentagramas) ---
  interface MeasureGrid {
    onsets: Frac[];
    widths: number[]; // en sp, por onset
    total: number;
    ts: TimeSignature;
    key: number;
    tsChanged: boolean;
    keyChanged: boolean;
  }
  const grids: MeasureGrid[] = [];
  let curTs = score.timeSig, curKey = score.keyFifths;
  for (let mi = 0; mi < nMeasures; mi++) {
    let tsChanged = false, keyChanged = false;
    for (const st of score.staves) {
      const m = st.measures[mi];
      if (m?.timeSig && (m.timeSig.num !== curTs.num || m.timeSig.den !== curTs.den || mi === 0)) {
        tsChanged = mi > 0;
        curTs = m.timeSig;
      }
      if (m?.keyFifths !== undefined && m.keyFifths !== curKey) {
        keyChanged = mi > 0;
        curKey = m.keyFifths;
      }
    }
    const map = new Map<string, { f: Frac; w: number }>();
    for (const st of score.staves) {
      const m = st.measures[mi];
      if (!m) continue;
      let t = Frac.zero;
      for (const e of m.events) {
        const k = t.toString();
        let w = baseWidth(e.duration);
        if (free) w = 4.2;
        const accs = e.notes.filter((n) => n.pitch && n.pitch.acc !== 0).length;
        if (accs) w += 1.3;
        if (st.showStaff === false && st.showTab) w = Math.max(w * 0.85, 2.2);
        const prev = map.get(k);
        map.set(k, { f: t, w: Math.max(prev?.w ?? 0, w) });
        t = t.add(eventValue(e));
      }
    }
    const entries = [...map.values()].sort((a, b) => a.f.cmp(b.f));
    grids.push({
      onsets: entries.map((e) => e.f),
      widths: entries.map((e) => e.w),
      total: entries.reduce((a, e) => a + e.w, 0) + 1.5,
      ts: curTs,
      key: curKey,
      tsChanged,
      keyChanged,
    });
  }

  // --- 2. Cortes de sistema ---
  const keyWidth = (fifths: number) => Math.abs(fifths) * 1.1 + (fifths ? 0.8 : 0);
  const showClef = !score.hideClef && !score.rhythmOnly;
  const headerWidth = (key: number, withTs: boolean) =>
    1 + (showClef ? 3.6 : 0) + keyWidth(key) + (withTs && !score.hideTimeSig ? 2.6 : 0) + 0.8;
  const usable = width / sp - 2;
  const systems: { from: number; to: number; header: number; natural: number }[] = [];
  {
    let i = 0;
    while (i < nMeasures) {
      const header = headerWidth(grids[i].key, i === 0);
      let w = header, j = i;
      while (j < nMeasures) {
        const extra = grids[j].total + (j > i && (grids[j].tsChanged || grids[j].keyChanged) ? 3 : 0);
        if (j > i && w + extra > usable) break;
        w += extra;
        j++;
      }
      systems.push({ from: i, to: j - 1, header, natural: w });
      i = j;
    }
    if (nMeasures === 0) systems.push({ from: 0, to: -1, header: headerWidth(score.keyFifths, true), natural: 10 });
  }

  // --- 3. Dibujo sistema por sistema ---
  let y = 0.5 * sp;
  let maxX = 0;
  systems.forEach((sys, si) => {
    const measuresIdx: number[] = [];
    for (let m = sys.from; m <= sys.to; m++) measuresIdx.push(m);
    // Disposición vertical
    const layouts: StaffLayout[] = [];
    score.staves.forEach((staff, index) => {
      const hasStaff = staff.showStaff !== false;
      const hasTab = !!staff.showTab && !!staff.tuning;
      const ext = staffExtents(staff, measuresIdx);
      const above = (hasStaff ? ext.above : 1.5) + (ext.hasChords ? 2.2 : 0);
      const top = y + above * sp;
      let cursor = top + (hasStaff ? 4 * sp : 0);
      let tabTop = cursor;
      const tabLines = staff.tuning?.length ?? 6;
      if (hasTab) {
        tabTop = cursor + (hasStaff ? Math.max(3.5, ext.below) * sp : 0);
        cursor = tabTop + (tabLines - 1) * TAB_SP * sp;
      }
      const below = hasTab ? (hasStaff ? 1.5 : 4) : ext.below;
      const bottom = cursor + below * sp;
      layouts.push({ staff, index, hasStaff, hasTab, top, tabTop, tabLines, bottom });
      y = bottom + 0.8 * sp;
    });
    const sysTop = layouts[0]?.top ?? y;
    const lastL = layouts[layouts.length - 1];
    const sysBottom = lastL ? (lastL.hasTab ? lastL.tabTop + (lastL.tabLines - 1) * TAB_SP * sp : lastL.top + 4 * sp) : y;

    // Ancho: estirar para llenar (menos la última línea si quedó corta)
    const isLast = si === systems.length - 1;
    const contentNatural = sys.natural - sys.header;
    const target = usable - sys.header;
    const stretch = isLast && sys.natural < usable * 0.75 ? 1 : contentNatural > 0 ? target / contentNatural : 1;
    const x0 = 1 * sp;
    const xEnd = isLast && stretch === 1 ? x0 + sys.natural * sp : x0 + usable * sp;
    maxX = Math.max(maxX, xEnd);

    // Líneas de pentagrama y tablatura
    for (const L of layouts) {
      if (L.hasStaff && score.rhythmOnly) prims.push({ t: "line", x1: x0, y1: L.top + 2 * sp, x2: xEnd, y2: L.top + 2 * sp, w: 0.13 * sp, cls: "staff" });
      else if (L.hasStaff) for (let i = 0; i < 5; i++) prims.push({ t: "line", x1: x0, y1: L.top + i * sp, x2: xEnd, y2: L.top + i * sp, w: 0.13 * sp, cls: "staff" });
      if (L.hasTab) for (let i = 0; i < L.tabLines; i++) prims.push({ t: "line", x1: x0, y1: L.tabTop + i * TAB_SP * sp, x2: xEnd, y2: L.tabTop + i * TAB_SP * sp, w: 0.13 * sp, cls: "staff" });
    }
    // Barra inicial y llave
    if (layouts.length > 1 || !free) prims.push({ t: "line", x1: x0, y1: sysTop, x2: x0, y2: sysBottom, w: 0.16 * sp, cls: "bar" });
    if (score.grand && layouts.length >= 2) {
      const yA = layouts[0].top, yB = layouts[1].top + 4 * sp;
      const xm = x0 - 0.4 * sp, h = yB - yA;
      prims.push({
        t: "path",
        d: `M ${xm} ${yA} C ${xm - 1.4 * sp} ${yA + h * 0.2}, ${xm + 0.2 * sp} ${yA + h * 0.45}, ${xm - 1.0 * sp} ${yA + h / 2} C ${xm + 0.2 * sp} ${yA + h * 0.55}, ${xm - 1.4 * sp} ${yA + h * 0.8}, ${xm} ${yB}`,
        w: 0.35 * sp,
        cls: "brace",
      });
    }

    // Encabezado: clave, armadura, compás
    const key = grids[sys.from]?.key ?? score.keyFifths;
    for (const L of layouts) {
      let hx = x0 + 0.8 * sp;
      if (L.hasStaff && showClef) {
        const clef = L.staff.clef;
        const yLine = (step: number) => L.top + (8 - step) * (sp / 2);
        if (clef === "treble") prims.push({ t: "glyph", x: hx, y: yLine(2), ch: writtenOctaveShift(L.staff) ? G.gClef8vb : G.gClef, size: 4 * sp, cls: "clef" });
        else if (clef === "bass" && writtenOctaveShift(L.staff)) prims.push({ t: "glyph", x: hx, y: yLine(6), ch: G.fClef8vb, size: 4 * sp, cls: "clef" });
        else if (clef === "bass") prims.push({ t: "glyph", x: hx, y: yLine(6), ch: G.fClef, size: 4 * sp, cls: "clef" });
        else if (clef === "alto") prims.push({ t: "glyph", x: hx, y: yLine(4), ch: G.cClef, size: 4 * sp, cls: "clef" });
        else if (clef === "tenor") prims.push({ t: "glyph", x: hx, y: yLine(6), ch: G.cClef, size: 4 * sp, cls: "clef" });
        else prims.push({ t: "glyph", x: hx + 0.5 * sp, y: yLine(4), ch: G.percClef, size: 4 * sp, cls: "clef" });
      }
      if (L.hasTab) {
        const midY = L.tabTop + ((L.tabLines - 1) * TAB_SP * sp) / 2;
        ["T", "A", "B"].forEach((ch, i) =>
          prims.push({ t: "text", x: x0 + 1.6 * sp, y: midY + (i - 1) * 1.45 * sp + 0.5 * sp, s: ch, size: 1.5 * sp, cls: "tabclef", anchor: "middle", bold: true }),
        );
      }
      hx += showClef ? 3.6 * sp : 0;
      if (L.hasStaff && L.staff.clef !== "percussion" && key !== 0 && !score.rhythmOnly) {
        const steps = key > 0 ? SHARP_STEPS_TREBLE : FLAT_STEPS_TREBLE;
        const shift = CLEF_KEY_SHIFT[L.staff.clef];
        for (let i = 0; i < Math.abs(key); i++) {
          const step = steps[i] + shift;
          prims.push({ t: "glyph", x: hx + i * 1.1 * sp, y: L.top + (8 - step) * (sp / 2), ch: key > 0 ? G.sharp : G.flat, size: 4 * sp, cls: "keysig" });
        }
      }
      hx += keyWidth(key) * sp;
      if (si === 0 && !score.hideTimeSig && L.hasStaff) drawTimeSig(prims, hx + 0.2 * sp, L.top, sp, grids[0]?.ts ?? score.timeSig);
    }

    // Compases
    let mx = x0 + sys.header * sp;
    if (opts.showMeasureNumbers && sys.from > 0) prims.push({ t: "text", x: x0, y: sysTop - 1.2 * sp, s: String(sys.from + 1), size: 1.1 * sp, cls: "mnum" });
    for (let mi = sys.from; mi <= sys.to; mi++) {
      const g = grids[mi];
      const mStart = mx;
      if (mi > sys.from && (g.tsChanged || g.keyChanged)) {
        for (const L of layouts) if (L.hasStaff && g.tsChanged) drawTimeSig(prims, mx + 0.4 * sp, L.top, sp, g.ts);
        mx += 3 * sp;
      }
      const xs: number[] = [];
      let cx = mx + 1.0 * sp;
      g.onsets.forEach((_, i) => {
        xs.push(cx);
        cx += g.widths[i] * stretch * sp;
      });
      const mEnd = mx + g.total * stretch * sp;
      const cls = opts.highlightMeasures?.includes(mi) ? "mhl" : undefined;
      if (cls) prims.push({ t: "rect", x: mStart, y: sysTop - 1.5 * sp, w: mEnd - mStart, h: sysBottom - sysTop + 3 * sp, cls, rx: sp * 0.6 });
      for (const L of layouts) {
        const m = L.staff.measures[mi];
        if (!m) continue;
        if (m.section && L.index === 0) {
          prims.push({ t: "text", x: mStart + 0.3 * sp, y: L.top - (L.hasStaff ? 3.5 : 2) * sp, s: m.section, size: 1.2 * sp, cls: "section", bold: true });
        }
        drawMeasureEvents(prims, evBoxes, L, m.events, g, xs, sp, mi, si, score, opts, opts.dimMeasures?.includes(mi));
      }
      measureBoxes.push({ index: mi, x0: mStart, x1: mEnd, y0: sysTop, y1: sysBottom, system: si });
      // Barra de compás
      if (!free) {
        const isFinal = mi === nMeasures - 1;
        prims.push({ t: "line", x1: mEnd, y1: sysTop, x2: mEnd, y2: sysBottom, w: 0.16 * sp, cls: "bar" });
        if (isFinal) {
          prims.push({ t: "line", x1: mEnd - 0.6 * sp, y1: sysTop, x2: mEnd - 0.6 * sp, y2: sysBottom, w: 0.16 * sp, cls: "bar" });
          prims.push({ t: "line", x1: mEnd - 0.15 * sp, y1: sysTop, x2: mEnd - 0.15 * sp, y2: sysBottom, w: 0.5 * sp, cls: "bar" });
        }
      }
      mx = mEnd;
    }
    y = (layouts[layouts.length - 1]?.bottom ?? y) + 2 * sp;
  });

  return { width: Math.min(width, Math.ceil(maxX + sp)), height: y, prims, events: evBoxes, measures: measureBoxes };
}

function drawTimeSig(prims: Prim[], x: number, top: number, sp: number, ts: TimeSignature) {
  const digits = (n: number) => String(n).split("").map((c) => G.ts(parseInt(c, 10))).join("");
  const yLine = (step: number) => top + (8 - step) * (sp / 2);
  prims.push({ t: "glyph", x, y: yLine(6), ch: digits(ts.num), size: 4 * sp, cls: "timesig" });
  prims.push({ t: "glyph", x, y: yLine(2), ch: digits(ts.den), size: 4 * sp, cls: "timesig" });
}

interface PlacedHead {
  step: number;
  head: NoteHead;
  x: number;
  y: number;
  glyph: string;
  w: number;
}

function drawMeasureEvents(
  prims: Prim[],
  evBoxes: EventBox[],
  L: StaffLayout,
  events: ScoreEvent[],
  g: { onsets: Frac[]; ts: TimeSignature; key: number },
  xs: number[],
  sp: number,
  mi: number,
  si: number,
  score: Score,
  opts: RenderOptions,
  dim?: boolean,
) {
  const clef = L.staff.clef;
  const yOf = (step: number) => L.top + (8 - step) * (sp / 2);
  const accState = new Map<string, number>();
  const isDrums = L.staff.instrument === "drums" || clef === "percussion";
  let t = Frac.zero;
  interface Placed {
    ev: ScoreEvent;
    x: number;
    heads: PlacedHead[];
    onset: Frac;
    up: boolean;
    stemX: number;
    stemY0: number;
    stemY1: number;
    beamGroup?: number;
    idx: number;
  }
  const placed: Placed[] = [];
  const dimCls = dim ? " dim" : "";

  events.forEach((ev, ei) => {
    const oi = g.onsets.findIndex((o) => o.eq(t));
    const x = xs[oi >= 0 ? oi : 0];
    const hl = ev.highlight ? " hl" : "";
    const base = ev.duration.base;
    evBoxes.push({ staff: L.index, measure: mi, event: ei, x, y0: L.hasStaff ? L.top - sp : L.tabTop - sp, y1: (L.hasTab ? L.tabTop + (L.tabLines - 1) * TAB_SP * sp : L.top + 4 * sp) + sp, system: si });

    if (ev.chord) {
      const cy = (L.hasStaff ? L.top : L.tabTop) - (L.hasStaff ? 2.6 : 1.8) * sp;
      prims.push({ t: "text", x, y: cy, s: opts.chordStyle ? opts.chordStyle(ev.chord) : ev.chord, size: 1.5 * sp, cls: "chordsym" + dimCls, bold: true });
    }

    if (ev.notes.length === 0) {
      if (L.hasStaff) {
        const rg = base === "w" ? G.restW : base === "h" ? G.restH : base === "q" ? G.restQ : base === "8" ? G.rest8 : base === "16" ? G.rest16 : G.rest32;
        const ry = base === "w" ? yOf(6) : yOf(4);
        prims.push({ t: "glyph", x: x, y: ry, ch: rg, size: 4 * sp, cls: "rest" + hl + dimCls });
        if (ev.duration.dots) prims.push({ t: "glyph", x: x + 1.5 * sp, y: yOf(5), ch: G.dot, size: 4 * sp, cls: "rest" + hl + dimCls });
      }
      placed.push({ ev, x, heads: [], onset: t, up: true, stemX: x, stemY0: 0, stemY1: 0, idx: ei });
      t = t.add(eventValue(ev));
      return;
    }

    // Cabezas de nota
    const heads: PlacedHead[] = [];
    if (L.hasStaff) {
      for (const n of ev.notes) {
        let p: Pitch | undefined, glyph = base === "w" ? G.noteWhole : base === "h" ? G.noteHalf : G.noteBlack;
        let step: number;
        if (n.drum) {
          const d = DRUMS[n.drum];
          p = d.staffPos;
          step = staffStep(p, "percussion");
          if (d.head === "x") glyph = G.noteX;
          if (d.head === "circleX") glyph = G.noteCircleX;
        } else if (n.pitch) {
          p = n.pitch;
          step = score.rhythmOnly ? 4 : staffStep(p, clef, writtenOctaveShift(L.staff));
        } else continue;
        if (score.rhythmOnly && heads.length) continue;
        heads.push({ step, head: n, x, y: yOf(step), glyph, w: (glyph === G.noteWhole ? 1.69 : 1.18) * sp });
      }
      heads.sort((a, b) => a.step - b.step);
      const avg = heads.reduce((a, h) => a + h.step, 0) / Math.max(1, heads.length);
      const up = score.rhythmOnly ? true : isDrums ? !heads.every((h) => h.head.drum === "kick" || h.head.drum === "hhPedal") : avg < 4;
      // Segundas: desplazar la cabeza al otro lado de la plica.
      for (let i = 1; i < heads.length; i++) {
        if (heads[i].step - heads[i - 1].step === 1 && heads[i - 1].x === x) {
          if (up) heads[i].x = x + 1.18 * sp;
          else heads[i - 1].x = x - 1.18 * sp;
        }
      }
      // Líneas adicionales
      const minStep = heads[0]?.step ?? 0, maxStep = heads[heads.length - 1]?.step ?? 0;
      for (let s = -2; s >= minStep; s -= 2) prims.push({ t: "line", x1: x - 0.45 * sp, y1: yOf(s), x2: x + 1.65 * sp, y2: yOf(s), w: 0.16 * sp, cls: "ledger" + dimCls });
      for (let s = 10; s <= maxStep; s += 2) prims.push({ t: "line", x1: x - 0.45 * sp, y1: yOf(s), x2: x + 1.65 * sp, y2: yOf(s), w: 0.16 * sp, cls: "ledger" + dimCls });
      // Alteraciones
      let accOffset = 0;
      for (let i = heads.length - 1; i >= 0; i--) {
        const h = heads[i];
        if (!h.head.pitch) continue;
        const p = h.head.pitch;
        const k = `${p.letter}${p.octave}`;
        const current = accState.has(k) ? accState.get(k)! : signatureAccFor(g.key, p.letter);
        if (current !== p.acc) {
          accState.set(k, p.acc);
          accOffset = accOffset === 0 ? 0 : accOffset;
          const ax = x - (accWidth(p.acc) + 0.25) * sp - accOffset;
          prims.push({ t: "glyph", x: ax, y: h.y, ch: accGlyph(p.acc), size: 4 * sp, cls: "acc" + hl + dimCls });
          accOffset += heads.length > 1 ? 1.1 * sp : 0;
        }
      }
      for (const h of heads) {
        prims.push({ t: "glyph", x: h.x, y: h.y, ch: h.glyph, size: 4 * sp, cls: "head" + hl + dimCls });
        if (ev.duration.dots) {
          const dy = h.step % 2 === 0 ? -sp / 2 : 0;
          for (let d = 0; d < ev.duration.dots; d++) prims.push({ t: "glyph", x: x + (1.6 + d * 0.6) * sp, y: h.y + dy, ch: G.dot, size: 4 * sp, cls: "head" + hl + dimCls });
        }
        if (opts.noteLabels && h.head.pitch) {
          const ly = L.top + 4 * sp + 2.6 * sp + Math.max(0, -h.step - 2) * (sp / 2);
          prims.push({ t: "text", x: x + 0.6 * sp, y: ly, s: opts.noteLabels(h.head.pitch), size: 1.2 * sp, cls: "notelabel" + hl, anchor: "middle" });
        }
      }
      if (ev.accent) prims.push({ t: "glyph", x: x, y: up ? yOf(Math.min(-2, minStep - 3)) : yOf(Math.max(10, maxStep + 3)), ch: G.accent, size: 4 * sp, cls: "head" + dimCls });
      // Plica
      let stemX = x, stemY0 = 0, stemY1 = 0;
      if (base !== "w" && heads.length) {
        const ext = 3.5 * sp;
        if (up) {
          stemX = x + 1.18 * sp - 0.06 * sp;
          stemY0 = heads[0].y - 0.17 * sp;
          stemY1 = Math.min(heads[heads.length - 1].y - ext, yOf(4));
        } else {
          stemX = x + 0.06 * sp;
          stemY0 = heads[heads.length - 1].y + 0.17 * sp;
          stemY1 = Math.max(heads[0].y + ext, yOf(4));
        }
      }
      placed.push({ ev, x, heads, onset: t, up, stemX, stemY0, stemY1, idx: ei });
    } else {
      placed.push({ ev, x, heads: [], onset: t, up: false, stemX: x, stemY0: 0, stemY1: 0, idx: ei });
    }

    // Tablatura
    if (L.hasTab) {
      for (const n of ev.notes) {
        if (!n.tab) continue;
        const ty = L.tabTop + (n.tab.string - 1) * TAB_SP * sp;
        const s = String(n.tab.fret);
        const tw = (s.length * 0.75 + 0.3) * sp;
        prims.push({ t: "rect", x: x + 0.6 * sp - tw / 2, y: ty - 0.7 * sp, w: tw, h: 1.4 * sp, cls: "tabbg" });
        prims.push({ t: "text", x: x + 0.6 * sp, y: ty + 0.5 * sp, s, size: 1.45 * sp, cls: "tabnum" + hl + dimCls, anchor: "middle", bold: true });
      }
      if (!L.hasStaff) {
        // Ritmo debajo de la tablatura
        const p = placed[placed.length - 1];
        const yb = L.tabTop + (L.tabLines - 1) * TAB_SP * sp + 0.9 * sp;
        if (base !== "w" && ev.notes.length) {
          p.up = false;
          p.stemX = x + 0.6 * sp;
          p.stemY0 = yb;
          p.stemY1 = yb + (base === "h" ? 1.6 : 2.8) * sp;
        }
      }
    }
    t = t.add(eventValue(ev));
  });

  // Agrupar corcheas por pulso para las barras
  const compound = isCompound(g.ts);
  const beatLen = compound ? new Frac(3, g.ts.den) : g.ts.den >= 8 ? new Frac(2, g.ts.den) : new Frac(1, g.ts.den);
  let group = 0, lastBeat = -1, lastWasBeamable = false;
  for (const p of placed) {
    const beamable = ["8", "16", "32"].includes(p.ev.duration.base) && p.ev.notes.length > 0 && p.stemY1 !== 0;
    const beat = Math.floor(p.onset.div(beatLen).value + 1e-9);
    if (beamable) {
      if (!(lastWasBeamable && beat === lastBeat)) group++;
      p.beamGroup = group;
    }
    lastWasBeamable = beamable;
    lastBeat = beat;
  }
  const groups = new Map<number, Placed[]>();
  for (const p of placed) if (p.beamGroup !== undefined) groups.set(p.beamGroup, [...(groups.get(p.beamGroup) ?? []), p]);
  for (const [, gp] of groups) {
    if (gp.length < 2) {
      gp[0].beamGroup = undefined;
      continue;
    }
    const tabOnly = !L.hasStaff;
    let up: boolean;
    if (tabOnly) up = false;
    else {
      const steps = gp.flatMap((p) => p.heads.map((h) => h.step));
      up = score.rhythmOnly ? true : isDrums ? gp.some((p) => p.up) : steps.reduce((a, b) => a + b, 0) / steps.length < 4;
    }
    for (const p of gp) {
      if (tabOnly) continue;
      p.up = up;
      if (up) {
        p.stemX = p.x + 1.12 * sp;
        p.stemY0 = p.heads[0].y - 0.17 * sp;
      } else {
        p.stemX = p.x + 0.06 * sp;
        p.stemY0 = p.heads[p.heads.length - 1].y + 0.17 * sp;
      }
    }
    // Barra recta con pendiente limitada
    const first = gp[0], last = gp[gp.length - 1];
    const ext = 3.3 * sp;
    let yA: number, yB: number;
    if (tabOnly) {
      yA = yB = first.stemY0 + 2.8 * sp;
    } else if (up) {
      yA = Math.min(...first.heads.map((h) => h.y)) - ext;
      yB = Math.min(...last.heads.map((h) => h.y)) - ext;
    } else {
      yA = Math.max(...first.heads.map((h) => h.y)) + ext;
      yB = Math.max(...last.heads.map((h) => h.y)) + ext;
    }
    const maxSlope = 1 * sp;
    if (Math.abs(yB - yA) > maxSlope) yB = yA + Math.sign(yB - yA) * maxSlope;
    const beamY = (x: number) => yA + ((yB - yA) * (x - first.stemX)) / Math.max(1, last.stemX - first.stemX);
    // Asegurar plica mínima
    let shift = 0;
    for (const p of gp) {
      if (tabOnly) continue;
      const yy = beamY(p.stemX);
      const head = up ? Math.min(...p.heads.map((h) => h.y)) : Math.max(...p.heads.map((h) => h.y));
      const need = 2.6 * sp;
      if (up && head - (yy + shift) < need) shift = head - need - yy;
      if (!up && yy + shift - head < need) shift = head + need - yy;
    }
    for (const p of gp) p.stemY1 = beamY(p.stemX) + shift;
    const bt = 0.5 * sp, bs = 0.75 * sp * (up ? 1 : -1);
    const beamPath = (xa: number, xb: number, level: number) => {
      const ya = beamY(xa) + shift + level * bs, yb2 = beamY(xb) + shift + level * bs;
      const d = up ? bt : -bt;
      return `M ${xa} ${ya} L ${xb} ${yb2} L ${xb} ${yb2 + d} L ${xa} ${ya + d} Z`;
    };
    const cls = "beam" + (gp.some((p) => p.ev.highlight) ? " hl" : "") + dimCls;
    prims.push({ t: "path", d: beamPath(first.stemX, last.stemX, 0), fill: true, cls });
    // Barras secundarias (semicorcheas y fusas)
    for (const level of [1, 2]) {
      const minBase = level === 1 ? ["16", "32"] : ["32"];
      let i = 0;
      while (i < gp.length) {
        if (!minBase.includes(gp[i].ev.duration.base)) {
          i++;
          continue;
        }
        let j = i;
        while (j + 1 < gp.length && minBase.includes(gp[j + 1].ev.duration.base)) j++;
        if (j > i) prims.push({ t: "path", d: beamPath(gp[i].stemX, gp[j].stemX, level), fill: true, cls });
        else {
          const dir = i > 0 ? -1 : 1;
          const xa = gp[i].stemX, xb = xa + dir * 1.1 * sp;
          prims.push({ t: "path", d: beamPath(Math.min(xa, xb), Math.max(xa, xb), level), fill: true, cls });
        }
        i = j + 1;
      }
    }
  }

  // Plicas y corchetes
  for (const p of placed) {
    if (p.stemY1 === 0 || p.ev.notes.length === 0) continue;
    const hl = p.ev.highlight ? " hl" : "";
    prims.push({ t: "line", x1: p.stemX, y1: p.stemY0, x2: p.stemX, y2: p.stemY1, w: 0.12 * sp, cls: "stem" + hl + dimCls });
    if (p.beamGroup === undefined) {
      const b = p.ev.duration.base;
      const flag = b === "8" ? (p.up ? G.flag8Up : G.flag8Down) : b === "16" ? (p.up ? G.flag16Up : G.flag16Down) : b === "32" ? (p.up ? G.flag32Up : G.flag32Down) : null;
      if (flag) prims.push({ t: "glyph", x: p.stemX - 0.06 * sp, y: p.stemY1, ch: flag, size: 4 * sp, cls: "stem" + hl + dimCls });
    }
  }

  // Ligaduras de prolongación
  for (let i = 0; i < placed.length; i++) {
    const p = placed[i];
    for (const h of p.heads) {
      if (!h.head.tie || !h.head.pitch) continue;
      const next = placed[i + 1];
      const target = next?.heads.find((n) => n.head.pitch && diatonicIndex(n.head.pitch) === diatonicIndex(h.head.pitch!));
      const xa = h.x + 1.3 * sp;
      const xb = target ? target.x - 0.1 * sp : xa + 2.5 * sp;
      const dir = p.up ? 1 : -1;
      const ya = h.y + dir * 0.7 * sp;
      const mid = (xa + xb) / 2;
      prims.push({ t: "path", d: `M ${xa} ${ya} Q ${mid} ${ya + dir * 1.4 * sp} ${xb} ${ya}`, w: 0.18 * sp, cls: "tie" + dimCls });
    }
  }

  // Grupos irregulares (tresillos)
  let i = 0;
  while (i < placed.length) {
    const tp = placed[i].ev.duration.tuplet;
    if (!tp) {
      i++;
      continue;
    }
    let total = Frac.zero, j = i;
    const target = durationValue({ base: placed[i].ev.duration.base }).mul(new Frac(tp.inSpaceOf));
    while (j < placed.length && placed[j].ev.duration.tuplet) {
      total = total.add(eventValue(placed[j].ev));
      if (total.cmp(target) >= 0) break;
      j++;
    }
    const a = placed[i], b = placed[Math.min(j, placed.length - 1)];
    const allUp = a.up;
    const yy = L.hasStaff ? (allUp ? Math.min(a.stemY1 || yOf(10), b.stemY1 || yOf(10), yOf(9)) - 1.2 * sp : Math.max(a.stemY1 || yOf(-2), b.stemY1 || yOf(-2), yOf(-1)) + 1.8 * sp) : L.tabTop - 1.2 * sp;
    const xa = a.x, xb = b.x + 1.2 * sp, xm = (xa + xb) / 2;
    prims.push({ t: "path", d: `M ${xa} ${yy + 0.5 * sp} L ${xa} ${yy} L ${xm - 0.8 * sp} ${yy} M ${xm + 0.8 * sp} ${yy} L ${xb} ${yy} L ${xb} ${yy + 0.5 * sp}`, w: 0.14 * sp, cls: "tuplet" + dimCls });
    prims.push({ t: "text", x: xm, y: yy + 0.45 * sp, s: String(tp.n), size: 1.3 * sp, cls: "tuplet" + dimCls, anchor: "middle", bold: true });
    i = j + 1;
  }
  void score;
}

/** Serializa el resultado a un string SVG (útil para tests y exportar). */
export function toSvgString(r: RenderResult): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const parts = r.prims.map((p) => {
    switch (p.t) {
      case "line":
        return `<line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}" stroke-width="${p.w}" class="${p.cls ?? ""}"/>`;
      case "glyph":
        return `<text x="${p.x}" y="${p.y}" font-size="${p.size}" class="smufl ${p.cls ?? ""}">${esc(p.ch)}</text>`;
      case "text":
        return `<text x="${p.x}" y="${p.y}" font-size="${p.size}" text-anchor="${p.anchor ?? "start"}" class="${p.cls ?? ""}">${esc(p.s)}</text>`;
      case "path":
        return `<path d="${p.d}" ${p.fill ? "" : `fill="none" stroke-width="${p.w ?? 1}"`} class="${p.cls ?? ""}"/>`;
      case "rect":
        return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${p.rx ?? 0}" class="${p.cls ?? ""}"/>`;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${r.width}" height="${r.height}" viewBox="0 0 ${r.width} ${r.height}">${parts.join("")}</svg>`;
}

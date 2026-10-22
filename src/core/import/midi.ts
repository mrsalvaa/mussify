// SPDX-License-Identifier: GPL-3.0-or-later
// Lector de archivos MIDI estándar (SMF tipo 0 y 1) y cuantización a partitura.
import { fromMidi } from "../theory/pitch";
import { Frac, type TimeSignature, splitIntoFigures, measureLength } from "../theory/rhythm";
import type { Score, ScoreEvent, Staff, Measure, NoteHead } from "../notation/score";
import { drumFromGm } from "../instruments/drums";

export interface MidiNote {
  tick: number;
  dur: number;
  note: number;
  vel: number;
  channel: number;
}

export interface MidiTrack {
  name: string;
  program: number;
  notes: MidiNote[];
}

export interface MidiFile {
  format: number;
  ppq: number;
  tracks: MidiTrack[];
  tempo: number; // BPM (primer cambio de tempo)
  timeSig: TimeSignature;
  keyFifths: number;
}

class Reader {
  pos = 0;
  constructor(private d: Uint8Array) {}
  u8(): number {
    if (this.pos >= this.d.length) throw new Error("MIDI truncado");
    return this.d[this.pos++];
  }
  u16(): number {
    return (this.u8() << 8) | this.u8();
  }
  u32(): number {
    return ((this.u8() << 24) >>> 0) + (this.u8() << 16) + (this.u8() << 8) + this.u8();
  }
  str(n: number): string {
    let s = "";
    for (let i = 0; i < n; i++) s += String.fromCharCode(this.u8());
    return s;
  }
  vlq(): number {
    let v = 0;
    for (let i = 0; i < 4; i++) {
      const b = this.u8();
      v = (v << 7) | (b & 0x7f);
      if (!(b & 0x80)) return v;
    }
    throw new Error("E_MIDI_BAD");
  }
  bytes(n: number): Uint8Array {
    const out = this.d.subarray(this.pos, this.pos + n);
    this.pos += n;
    return out;
  }
  get left(): number {
    return this.d.length - this.pos;
  }
}

export function parseMidi(data: Uint8Array): MidiFile {
  const r = new Reader(data);
  if (r.str(4) !== "MThd") throw new Error("No es un archivo MIDI");
  const hlen = r.u32();
  const format = r.u16();
  const ntracks = r.u16();
  const division = r.u16();
  r.pos += hlen - 6;
  if (division & 0x8000) throw new Error("E_MIDI_SMPTE");
  const ppq = division;
  let tempo = 120;
  let tempoSet = false;
  let timeSig: TimeSignature = { num: 4, den: 4 };
  let tsSet = false;
  let keyFifths = 0;
  const tracks: MidiTrack[] = [];
  for (let t = 0; t < ntracks && r.left > 8; t++) {
    const id = r.str(4);
    const len = r.u32();
    if (id !== "MTrk") {
      r.pos += len;
      continue;
    }
    const end = r.pos + len;
    let tick = 0;
    let running = 0;
    const open = new Map<number, { tick: number; vel: number }>();
    const track: MidiTrack = { name: "", program: 0, notes: [] };
    const byChannel = new Map<number, MidiNote[]>();
    while (r.pos < end) {
      tick += r.vlq();
      let status = r.u8();
      if (status < 0x80) {
        r.pos--;
        status = running;
      } else if (status < 0xf0) running = status;
      const type = status & 0xf0;
      const ch = status & 0x0f;
      if (status === 0xff) {
        const meta = r.u8();
        const mlen = r.vlq();
        const body = r.bytes(mlen);
        if (meta === 0x03) track.name = new TextDecoder("latin1").decode(body);
        else if (meta === 0x51 && !tempoSet) {
          tempo = Math.round(60000000 / ((body[0] << 16) | (body[1] << 8) | body[2]));
          tempoSet = true;
        } else if (meta === 0x58 && !tsSet) {
          timeSig = { num: body[0], den: Math.pow(2, body[1]) };
          tsSet = true;
        } else if (meta === 0x59) keyFifths = (body[0] << 24) >> 24;
        else if (meta === 0x2f) break;
      } else if (status === 0xf0 || status === 0xf7) {
        r.pos += r.vlq();
      } else if (type === 0x90 || type === 0x80) {
        const note = r.u8();
        const vel = r.u8();
        const key = ch * 128 + note;
        if (type === 0x90 && vel > 0) {
          if (open.has(key)) {
            const o = open.get(key)!;
            push(byChannel, ch, { tick: o.tick, dur: tick - o.tick, note, vel: o.vel, channel: ch });
          }
          open.set(key, { tick, vel });
        } else if (open.has(key)) {
          const o = open.get(key)!;
          open.delete(key);
          push(byChannel, ch, { tick: o.tick, dur: Math.max(1, tick - o.tick), note, vel: o.vel, channel: ch });
        }
      } else if (type === 0xc0) {
        track.program = r.u8();
      } else if (type === 0xd0) {
        r.u8();
      } else {
        r.u8();
        r.u8();
      }
    }
    r.pos = end;
    // Separar por canal: cada canal con notas es una pista distinta.
    for (const [ch, notes] of byChannel) {
      notes.sort((a, b) => a.tick - b.tick || a.note - b.note);
      tracks.push({ name: track.name || (ch === 9 ? "Drums" : `Track ${tracks.length + 1}`), program: track.program, notes });
    }
  }
  return { format, ppq, tracks, tempo, timeSig, keyFifths };
}

function push(m: Map<number, MidiNote[]>, k: number, v: MidiNote) {
  if (!m.has(k)) m.set(k, []);
  m.get(k)!.push(v);
}

/** Cuantiza una pista a una grilla y la convierte en compases. */
export function trackToStaff(track: MidiTrack, ppq: number, ts: TimeSignature, grid = 4, id = "s"): Staff {
  const isDrums = track.notes.length > 0 && track.notes.every((n) => n.channel === 9);
  const step = ppq / grid; // grid = subdivisiones por negra (4 = semicorchea)
  const q = (t: number) => Math.round(t / step);
  // agrupar por ataque cuantizado
  const onsets = new Map<number, MidiNote[]>();
  for (const n of track.notes) {
    const k = q(n.tick);
    if (!onsets.has(k)) onsets.set(k, []);
    onsets.get(k)!.push(n);
  }
  const keys = [...onsets.keys()].sort((a, b) => a - b);
  const unitsPerMeasure = Math.round((measureLength(ts).value * 4) * grid);
  const totalUnits = keys.length ? Math.max(...track.notes.map((n) => q(n.tick + n.dur))) : 0;
  const measuresCount = Math.max(1, Math.ceil(totalUnits / unitsPerMeasure));
  const unitFrac = new Frac(1, 4 * grid);
  // Línea de tiempo: [inicio, fin, notas]
  interface Span { start: number; end: number; notes: NoteHead[] }
  const spans: Span[] = [];
  let cursor = 0;
  keys.forEach((k, i) => {
    if (k > cursor) spans.push({ start: cursor, end: k, notes: [] });
    const notes = onsets.get(k)!;
    const next = i + 1 < keys.length ? keys[i + 1] : Infinity;
    const longest = Math.max(...notes.map((n) => q(n.tick + n.dur)));
    const end = isDrums ? Math.min(next, k + grid) : Math.max(k + 1, Math.min(next, longest));
    const heads: NoteHead[] = [];
    for (const n of notes) {
      if (isDrums) {
        const d = drumFromGm(n.note);
        if (d && !heads.some((h) => h.drum === d)) heads.push({ drum: d });
      } else if (!heads.some((h) => h.pitch && h.pitch.octave === fromMidi(n.note).octave && fromMidi(n.note).letter === h.pitch.letter && fromMidi(n.note).acc === h.pitch.acc)) {
        heads.push({ pitch: fromMidi(n.note) });
      }
    }
    spans.push({ start: k, end: Math.min(end === Infinity ? k + grid : end, Number.MAX_SAFE_INTEGER), notes: heads });
    cursor = spans[spans.length - 1].end;
  });
  const lastEnd = measuresCount * unitsPerMeasure;
  if (cursor < lastEnd) spans.push({ start: cursor, end: lastEnd, notes: [] });
  // Repartir en compases, cortando con ligaduras
  const measures: Measure[] = Array.from({ length: measuresCount }, () => ({ events: [] as ScoreEvent[] }));
  for (const sp of spans) {
    let s = sp.start;
    while (s < sp.end) {
      const mi = Math.floor(s / unitsPerMeasure);
      if (mi >= measuresCount) break;
      const mEnd = (mi + 1) * unitsPerMeasure;
      const e = Math.min(sp.end, mEnd);
      const figs = splitIntoFigures(unitFrac.mul(new Frac(e - s)), true);
      figs.forEach((d, fi) => {
        const lastPiece = fi === figs.length - 1 && e === sp.end;
        measures[mi].events.push({ duration: d, notes: sp.notes.map((h) => ({ ...h, tie: sp.notes.length > 0 && !isDrums && !lastPiece ? true : undefined })) });
      });
      s = e;
    }
  }
  if (isDrums) for (const m of measures) for (const e of m.events) for (const n of e.notes) delete n.tie;
  const avg = track.notes.reduce((a, n) => a + n.note, 0) / Math.max(1, track.notes.length);
  const program = track.program;
  const instrument = isDrums ? "drums" : program >= 32 && program <= 39 ? "bass" : program >= 24 && program <= 31 ? "guitar" : "piano";
  return { id, name: track.name, instrument, clef: isDrums ? "percussion" : avg < 57 ? "bass" : "treble", measures };
}

export function midiToScore(data: Uint8Array): Score {
  const mf = parseMidi(data);
  const staves = mf.tracks.filter((t) => t.notes.length).map((t, i) => trackToStaff(t, mf.ppq, mf.timeSig, 4, `s${i}`));
  return { title: undefined, tempo: mf.tempo, timeSig: mf.timeSig, keyFifths: mf.keyFifths, staves };
}

/** Escritor MIDI mínimo (para tests y para exportar ejercicios). */
export function writeMidi(notes: { tick: number; dur: number; note: number; channel?: number }[], ppq = 480, bpm = 120, ts: TimeSignature = { num: 4, den: 4 }): Uint8Array {
  const events: { tick: number; bytes: number[] }[] = [];
  const mpq = Math.round(60000000 / bpm);
  events.push({ tick: 0, bytes: [0xff, 0x51, 3, (mpq >> 16) & 255, (mpq >> 8) & 255, mpq & 255] });
  events.push({ tick: 0, bytes: [0xff, 0x58, 4, ts.num, Math.log2(ts.den), 24, 8] });
  for (const n of notes) {
    const ch = n.channel ?? 0;
    events.push({ tick: n.tick, bytes: [0x90 | ch, n.note, 90] });
    events.push({ tick: n.tick + n.dur, bytes: [0x80 | ch, n.note, 0] });
  }
  events.sort((a, b) => a.tick - b.tick || (a.bytes[0] & 0xf0) - (b.bytes[0] & 0xf0));
  const body: number[] = [];
  let last = 0;
  const vlq = (v: number) => {
    const st = [v & 0x7f];
    while ((v >>= 7)) st.unshift((v & 0x7f) | 0x80);
    body.push(...st);
  };
  for (const e of events) {
    vlq(e.tick - last);
    last = e.tick;
    body.push(...e.bytes);
  }
  vlq(0);
  body.push(0xff, 0x2f, 0);
  const head = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, (ppq >> 8) & 255, ppq & 255];
  const len = body.length;
  return new Uint8Array([...head, 0x4d, 0x54, 0x72, 0x6b, (len >>> 24) & 255, (len >> 16) & 255, (len >> 8) & 255, len & 255, ...body]);
}

// SPDX-License-Identifier: GPL-3.0-or-later
// Tablaturas en texto (ASCII), del estilo:
//   e|---0---3---|
//   B|-1---------|
// Se convierten en notas sueltas (sin ritmo, porque la tab en texto no lo indica).
import { STANDARD, BASS4, BASS5, pitchAt, type Tuning } from "../instruments/fretted";
import type { Score, ScoreEvent } from "../notation/score";

const LINE_RE = /^\s*([A-Ga-g][#b]?)?\s*[|:]?(-*[-0-9hpb/\\~xX|()]*-[-0-9hpb/\\~xX|()]*)\s*$/;

export interface TextTabResult {
  score: Score;
  chordLines: string[];
}

export function parseTextTab(text: string): TextTabResult {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: string[][] = [];
  let cur: string[] = [];
  const chordLines: string[] = [];
  for (const l of lines) {
    const m = LINE_RE.exec(l);
    if (m && l.includes("-") && /\|/.test(l)) {
      cur.push(l.slice(l.indexOf("|") + 1));
    } else {
      if (cur.length >= 4) blocks.push(cur);
      cur = [];
      if (/^\s*([A-G][#b]?(m|maj7|m7|7|sus4|sus2|dim|aug|5|add9)?(\/[A-G][#b]?)?\s+)+[A-G]?/.test(l + " ") && l.trim().split(/\s+/).every((w) => /^[A-G][#b]?(m|maj7|m7|7|sus4|sus2|dim|aug|5|add9|6)?(\/[A-G][#b]?)?$/.test(w))) chordLines.push(l.trim());
    }
  }
  if (cur.length >= 4) blocks.push(cur);
  if (!blocks.length) throw new Error("E_NO_TAB");
  const strings = blocks[0].length;
  const tuning: Tuning = strings === 4 ? BASS4 : strings === 5 ? BASS5 : STANDARD;
  const instrument = strings <= 5 ? "bass" : "guitar";
  const events: ScoreEvent[] = [];
  for (const b of blocks) {
    const width = Math.max(...b.map((l) => l.length));
    let col = 0;
    while (col < width) {
      const notes: ScoreEvent["notes"] = [];
      let advance = 1;
      for (let s = 0; s < Math.min(b.length, tuning.strings.length); s++) {
        const line = b[s];
        const ch = line[col];
        if (ch && /[0-9]/.test(ch)) {
          let num = ch;
          if (/[0-9]/.test(line[col + 1] ?? "")) num += line[col + 1];
          const fret = parseInt(num, 10);
          if (fret <= 24) {
            notes.push({ pitch: pitchAt(tuning, s + 1, fret), tab: { string: s + 1, fret } });
            advance = Math.max(advance, num.length);
          }
        }
      }
      if (notes.length) events.push({ duration: { base: "w" }, notes });
      col += advance;
    }
  }
  const score: Score = {
    tempo: 200,
    timeSig: { num: 4, den: 4 },
    keyFifths: 0,
    freeNotes: true,
    hideTimeSig: true,
    staves: [{ id: "tab", instrument, clef: instrument === "bass" ? "bass" : "treble", showTab: true, showStaff: false, tuning: tuning.strings, measures: [{ events }] }],
  };
  return { score, chordLines };
}

// SPDX-License-Identifier: GPL-3.0-or-later
// Tests de los importadores (MIDI, MusicXML, Guitar Pro, tab en texto) y del control de contenido.
import { describe, expect, it } from "vitest";
import { parseMidi, writeMidi, midiToScore } from "../src/core/import/midi";
import { alphaTabToScore, alphaTexToGp7 } from "../src/core/import/alphatab";
import { parseTextTab } from "../src/core/import/texttab";
import { analyzeImport, melodyOnly, detectKind, importScore, knownChordsOnly } from "../src/core/import";
import { measureDuration } from "../src/core/notation/score";
import { measureLength } from "../src/core/theory/rhythm";
import { pitchName } from "../src/core/theory/pitch";
import { scoreToSequence } from "../src/core/notation/playback";
import { renderScore } from "../src/core/notation/render";

const MUSICXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions><key><fifths>1</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>2</duration><type>half</type></note>
    </measure>
    <measure number="2">
      <note><pitch><step>F</step><alter>1</alter><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>
    </measure>
  </part>
</score-partwise>`;

describe("MIDI", () => {
  it("lee y cuantiza un MIDI escrito por nosotros", () => {
    const ppq = 480;
    const data = writeMidi([
      { tick: 0, dur: 480, note: 60 },
      { tick: 480, dur: 480, note: 62 },
      { tick: 960, dur: 960, note: 64 },
      { tick: 1920, dur: 1920, note: 67 },
    ], ppq, 100);
    const mf = parseMidi(data);
    expect(mf.tempo).toBe(100);
    expect(mf.tracks[0].notes.map((n) => n.note)).toEqual([60, 62, 64, 67]);
    const score = midiToScore(data);
    const st = score.staves[0];
    expect(st.measures.length).toBe(2);
    for (const m of st.measures) expect(measureDuration(m).eq(measureLength(score.timeSig))).toBe(true);
    const evs = st.measures[0].events.map((e) => e.duration.base);
    expect(evs).toEqual(["q", "q", "h"]);
    expect(pitchName(st.measures[1].events[0].notes[0].pitch!, "english", true)).toBe("G4");
  });
  it("detecta batería en el canal 10", () => {
    const data = writeMidi([0, 240, 480, 720].map((t, i) => ({ tick: t, dur: 100, note: i % 2 ? 38 : 36, channel: 9 })));
    const score = midiToScore(data);
    expect(score.staves[0].instrument).toBe("drums");
    expect(score.staves[0].measures[0].events[0].notes[0].drum).toBe("kick");
  });
  it("corta notas largas en la barra con ligadura", () => {
    const data = writeMidi([{ tick: 1440, dur: 960, note: 60 }]);
    const st = midiToScore(data).staves[0];
    const last = st.measures[0].events[st.measures[0].events.length - 1];
    expect(last.notes[0].tie).toBe(true);
    expect(st.measures[1].events[0].notes[0].pitch).toBeDefined();
  });
  it("rechaza archivos que no son MIDI", () => {
    expect(() => parseMidi(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).toThrow();
  });
});

describe("MusicXML y Guitar Pro (vía alphaTab)", () => {
  it("importa MusicXML con armadura y alteraciones", () => {
    const score = alphaTabToScore(new TextEncoder().encode(MUSICXML));
    expect(score.keyFifths).toBe(1);
    const st = score.staves[0];
    expect(st.measures.length).toBe(2);
    expect(st.measures[0].events.map((e) => e.duration.base)).toEqual(["q", "q", "h"]);
    expect(pitchName(st.measures[1].events[0].notes[0].pitch!, "english", true)).toBe("F#4");
  });
  it("importa un Guitar Pro 7 con tablatura", () => {
    const gp = alphaTexToGp7(`\\title "Test" \\tempo 90 . :4 0.6 3.6 0.5 2.5 | 0.4 2.4 3.4 r`);
    const score = importScore("test.gp", gp).score;
    const st = score.staves[0];
    expect(st.instrument).toBe("guitar");
    expect(st.showTab).toBe(true);
    const first = st.measures[0].events[0].notes[0];
    expect(first.tab).toEqual({ string: 6, fret: 0 });
    expect(pitchName(first.pitch!, "english", true)).toBe("E2");
    expect(st.measures[0].events[1].notes[0].tab).toEqual({ string: 6, fret: 3 });
    expect(score.tempo).toBe(90);
    // Reproducción y dibujo sin errores
    expect(scoreToSequence(score).events.length).toBe(7);
    expect(renderScore(score).prims.length).toBeGreaterThan(10);
  });
});

describe("tab en texto", () => {
  it("lee una tab ASCII de 6 cuerdas", () => {
    const r = parseTextTab(["Em          G", "e|-----0---3-|", "B|---0-----0-|", "G|-0---------|", "D|-----------|", "A|-----------|", "E|-0-------3-|"].join("\n"));
    const evs = r.score.staves[0].measures[0].events;
    expect(evs.length).toBe(4);
    expect(evs[0].notes.map((n) => n.tab)).toEqual([{ string: 3, fret: 0 }, { string: 6, fret: 0 }]);
    expect(r.chordLines).toEqual(["Em          G"]);
  });
});

describe("contenido importado no aprendido", () => {
  const score = alphaTabToScore(new TextEncoder().encode(MUSICXML));
  it("avisa lo que falta y marca compases", () => {
    const known = new Set(["t.staff", "clef.treble", "read.treble.G4", "read.treble.A4", "read.treble.B4", "rh.q", "rh.h", "ts.4/4"]);
    const rep = analyzeImport(score, known);
    expect(rep.allKnown).toBe(false);
    expect(rep.missing.map((r) => r.anyOf[0])).toContain("ks.1");
  });
  it("simplifica a la melodía y quita cifrados desconocidos", () => {
    const withChords = { ...score, staves: [{ ...score.staves[0], measures: [{ events: [{ duration: { base: "w" as const }, notes: [], chord: "Cmaj7" }] }] }] };
    expect(knownChordsOnly(withChords, new Set(["ch.maj"])).staves[0].measures[0].events[0].chord).toBeUndefined();
    expect(melodyOnly(score).staves.length).toBe(1);
  });
  it("detecta el tipo de archivo", () => {
    expect(detectKind("tema.MID")).toBe("midi");
    expect(detectKind("x.gp5")).toBe("guitarpro");
    expect(detectKind("x.musicxml")).toBe("musicxml");
    expect(detectKind("x.flac")).toBe("audio");
    expect(detectKind("x.txt")).toBe("texttab");
  });
});

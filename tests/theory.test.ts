// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { P, midi, pitchName, parseNote, fromMidi, frequency, pcName, bothNames, pc } from "../src/core/theory/pitch";
import { IV, intervalBetween, intervalBetweenPc, transpose, invert, semitones, intervalName, intervalShort } from "../src/core/theory/interval";
import { scalePcs, stepPattern, scalePitches } from "../src/core/theory/scale";
import { keyFromFifths, fifthsOf, signatureAccidentals, relative, circleOfFifths } from "../src/core/theory/key";
import { C, chordPcs, chordSymbol, parseChord, identifyChord, chordVoicing, inversionOf } from "../src/core/theory/chord";
import { diatonicChords, analyzeChord, romanString, chordFromRoman, functionOfDegree, classifyCadence } from "../src/core/theory/harmony";
import { durationValue, Frac, isCompound, beatsOf, splitIntoFigures, triplet, isIrregular } from "../src/core/theory/rhythm";

const names = (ps: { letter: number; acc: number }[]) => ps.map((p) => pcName(p as never, "english", true)).join(" ");

describe("alturas", () => {
  it("MIDI y nombres", () => {
    expect(midi(P("C4"))).toBe(60);
    expect(midi(P("A4"))).toBe(69);
    expect(midi(P("Cb4"))).toBe(59);
    expect(midi(P("B#3"))).toBe(60);
    expect(pitchName(P("F#4"))).toBe("Fa♯4");
    expect(pitchName(P("Bb2"), "english")).toBe("B♭2");
    expect(bothNames(pc(4))).toBe("Sol (G)");
  });
  it("lee nomenclatura latina y americana", () => {
    expect(parseNote("Sol#3")).toEqual({ pc: { letter: 4, acc: 1 }, octave: 3 });
    expect(parseNote("Sib")).toEqual({ pc: { letter: 6, acc: -1 }, octave: undefined });
    expect(parseNote("Ebb5")?.pc).toEqual({ letter: 2, acc: -2 });
    expect(parseNote("H")).toBeNull();
  });
  it("fromMidi y frecuencia", () => {
    expect(pitchName(fromMidi(61), "english", true)).toBe("C#4");
    expect(pitchName(fromMidi(61, true), "english", true)).toBe("Db4");
    expect(frequency(69)).toBeCloseTo(440);
    expect(frequency(69, 432)).toBeCloseTo(432);
    expect(frequency(57)).toBeCloseTo(220);
  });
});

describe("intervalos", () => {
  it("calcula cualidad y tamaño", () => {
    expect(intervalBetween(P("C4"), P("E4"))).toEqual(IV("M3"));
    expect(intervalBetween(P("C4"), P("Eb4"))).toEqual(IV("m3"));
    expect(intervalBetween(P("F4"), P("B4"))).toEqual(IV("A4"));
    expect(intervalBetween(P("B3"), P("F4"))).toEqual(IV("d5"));
    expect(intervalBetween(P("C4"), P("C5"))).toEqual(IV("P8"));
    expect(intervalBetween(P("C4"), P("D5"))).toEqual(IV("M9"));
    expect(intervalBetween(P("E4"), P("C4"))).toEqual(IV("M3"));
    expect(intervalBetweenPc(pc(6), pc(1))).toEqual(IV("m3")); // B -> D
  });
  it("transpone con ortografía correcta", () => {
    expect(pitchName(transpose(P("E4"), IV("M3")), "english", true)).toBe("G#4");
    expect(pitchName(transpose(P("Bb3"), IV("P5")), "english", true)).toBe("F4");
    expect(pitchName(transpose(P("C4"), IV("A4")), "english", true)).toBe("F#4");
    expect(pitchName(transpose(P("C4"), IV("d5")), "english", true)).toBe("Gb4");
    expect(pitchName(transpose(P("C4"), IV("m3"), true), "english", true)).toBe("A3");
  });
  it("inversiones y semitonos", () => {
    expect(invert(IV("M3"))).toEqual(IV("m6"));
    expect(invert(IV("P4"))).toEqual(IV("P5"));
    expect(invert(IV("A4"))).toEqual(IV("d5"));
    expect(invert(IV("m7"))).toEqual(IV("M2"));
    expect(semitones(IV("P5"))).toBe(7);
    expect(semitones(IV("d7"))).toBe(9);
    expect(semitones(IV("M13"))).toBe(21);
  });
  it("nombres en español", () => {
    expect(intervalName(IV("M3"))).toBe("tercera mayor");
    expect(intervalName(IV("P5"))).toBe("quinta justa");
    expect(intervalName(IV("P1"))).toBe("unísono");
    expect(intervalShort(IV("P4"))).toBe("4J");
  });
});

describe("escalas", () => {
  it("mayores y menores", () => {
    expect(names(scalePcs(pc(0), "major"))).toBe("C D E F G A B");
    expect(names(scalePcs(pc(1, -1), "major"))).toBe("Db Eb F Gb Ab Bb C");
    expect(names(scalePcs(pc(5), "minor"))).toBe("A B C D E F G");
    expect(names(scalePcs(pc(5), "harmonicMinor"))).toBe("A B C D E F G#");
    expect(names(scalePcs(pc(5), "melodicMinor"))).toBe("A B C D E F# G#");
    expect(names(scalePcs(pc(3, 1), "major"))).toBe("F# G# A# B C# D# E#");
  });
  it("modos, pentatónicas y blues", () => {
    expect(names(scalePcs(pc(1), "dorian"))).toBe("D E F G A B C");
    expect(names(scalePcs(pc(3), "lydian"))).toBe("F G A B C D E");
    expect(names(scalePcs(pc(4), "mixolydian"))).toBe("G A B C D E F");
    expect(names(scalePcs(pc(2), "phrygian"))).toBe("E F G A B C D");
    expect(names(scalePcs(pc(6), "locrian"))).toBe("B C D E F G A");
    expect(names(scalePcs(pc(5), "minorPentatonic"))).toBe("A C D E G");
    expect(names(scalePcs(pc(2), "blues"))).toBe("E G A Bb B D");
    expect(names(scalePcs(pc(0), "majorPentatonic"))).toBe("C D E G A");
  });
  it("patrón de tonos y semitonos", () => {
    expect(stepPattern("major").join(" ")).toBe("T T S T T T S");
    expect(stepPattern("minor").join(" ")).toBe("T S T T S T T");
    expect(stepPattern("harmonicMinor").join(" ")).toBe("T S T T S T½ S");
    expect(scalePitches(P("G3"), "major").length).toBe(8);
  });
});

describe("armaduras", () => {
  it("círculo de quintas", () => {
    expect(names([keyFromFifths(1).tonic])).toBe("G");
    expect(names([keyFromFifths(-3).tonic])).toBe("Eb");
    expect(names([keyFromFifths(6).tonic])).toBe("F#");
    expect(names([keyFromFifths(-6).tonic])).toBe("Gb");
    expect(names([keyFromFifths(2, "minor").tonic])).toBe("B");
    expect(circleOfFifths().length).toBe(15);
  });
  it("orden de alteraciones", () => {
    expect(names(signatureAccidentals(4))).toBe("F# C# G# D#");
    expect(names(signatureAccidentals(-5))).toBe("Bb Eb Ab Db Gb");
  });
  it("armadura de una tonalidad y relativas", () => {
    expect(fifthsOf({ tonic: pc(1), mode: "major" })).toBe(2);
    expect(fifthsOf({ tonic: pc(2), mode: "minor" })).toBe(1);
    expect(fifthsOf({ tonic: pc(3), mode: "minor" })).toBe(-4);
    expect(fifthsOf({ tonic: pc(4, 1), mode: "major" })).toBeNull();
    expect(names([relative({ tonic: pc(0), mode: "major" }).tonic])).toBe("A");
    expect(names([relative({ tonic: pc(2), mode: "minor" }).tonic])).toBe("G");
  });
});

describe("acordes y cifrado", () => {
  it("notas de acordes", () => {
    expect(names(chordPcs(C("C")))).toBe("C E G");
    expect(names(chordPcs(C("F#m")))).toBe("F# A C#");
    expect(names(chordPcs(C("Bdim")))).toBe("B D F");
    expect(names(chordPcs(C("G7")))).toBe("G B D F");
    expect(names(chordPcs(C("Ebmaj7")))).toBe("Eb G Bb D");
    expect(names(chordPcs(C("Bm7b5")))).toBe("B D F A");
    expect(names(chordPcs(C("C#dim7")))).toBe("C# E G Bb");
    expect(names(chordPcs(C("Caug")))).toBe("C E G#");
    expect(names(chordPcs(C("D9")))).toBe("D F# A C E");
    expect(names(chordPcs(C("E5")))).toBe("E B");
  });
  it("lee cifrado latino", () => {
    expect(chordSymbol(C("Lam7"))).toBe("Am7");
    expect(chordSymbol(C("Do7M"))).toBe("Cmaj7");
    expect(chordSymbol(C("Sol/Si"))).toBe("G/B");
    expect(chordSymbol(C("Sibm"))).toBe("B♭m");
    expect(chordSymbol(C("Fa#m7(b5)"))).toBe("F♯m7♭5");
    expect(chordSymbol(C("Dom"))).toBe("Cm");
    expect(parseChord("Xm")).toBeNull();
    expect(parseChord("Cfoo")).toBeNull();
  });
  it("escribe en ambos cifrados", () => {
    expect(chordSymbol(C("Am7"), "latin")).toBe("Lam7");
    expect(chordSymbol(C("Cmaj7"), "latin")).toBe("Do7M");
    expect(chordSymbol(C("D/F#"), "latin")).toBe("Re/Fa♯");
  });
  it("identifica acordes e inversiones", () => {
    expect(chordSymbol(identifyChord([pc(2), pc(4), pc(0)])!)).toBe("C/E");
    expect(chordSymbol(identifyChord([pc(5), pc(0), pc(2)])!)).toBe("Am");
    expect(inversionOf(C("C/G"))).toBe(2);
    const v = chordVoicing(C("C"), 4, 1).map((p) => pitchName(p, "english", true));
    expect(v).toEqual(["E4", "G4", "C5"]);
    const s = chordVoicing(C("D/F#"), 4).map((p) => pitchName(p, "english", true));
    expect(s[0]).toBe("F#3");
  });
});

describe("armonía", () => {
  const Cmaj = { tonic: pc(0), mode: "major" as const };
  const Amin = { tonic: pc(5), mode: "minor" as const };
  it("campo armónico", () => {
    expect(diatonicChords(Cmaj).map((c) => chordSymbol(c)).join(" ")).toBe("C Dm Em F G Am Bdim");
    expect(diatonicChords(Cmaj, true).map((c) => chordSymbol(c)).join(" ")).toBe("Cmaj7 Dm7 Em7 Fmaj7 G7 Am7 Bm7♭5");
    expect(diatonicChords(Amin, false, true).map((c) => chordSymbol(c)).join(" ")).toBe("Am Bdim C Dm E F G♯dim");
  });
  it("números romanos y funciones", () => {
    expect(analyzeChord(C("G7"), Cmaj).label).toBe("V7");
    expect(analyzeChord(C("Dm"), Cmaj).label).toBe("ii");
    expect(analyzeChord(C("Bdim"), Cmaj).label).toBe("vii°");
    expect(analyzeChord(C("D7"), Cmaj).label).toBe("V7/V");
    expect(analyzeChord(C("E7"), Cmaj).kind).toBe("secondary");
    expect(analyzeChord(C("Db7"), Cmaj).kind).toBe("tritoneSub");
    expect(analyzeChord(C("Bb"), Cmaj).label).toBe("♭VII");
    expect(analyzeChord(C("Fm"), Cmaj).label).toBe("iv");
    expect(analyzeChord(C("Ab"), Cmaj).label).toBe("♭VI");
    expect(analyzeChord(C("E"), Amin).label).toBe("V");
    expect(functionOfDegree(4)).toBe("SD");
    expect(romanString({ degree: 7, acc: 0, quality: "m7b5" })).toBe("viiø7");
    expect(chordSymbol(chordFromRoman(Cmaj, { degree: 5, acc: 0, quality: "7", of: 2 }))).toBe("A7");
    expect(classifyCadence(5, 6)).toBe("deceptive");
  });
});

describe("ritmo", () => {
  it("valores exactos", () => {
    expect(durationValue({ base: "q", dots: 1 }).eq(new Frac(3, 8))).toBe(true);
    expect(durationValue({ base: "h", dots: 2 }).eq(new Frac(7, 8))).toBe(true);
    expect(durationValue(triplet("8")).eq(new Frac(1, 12))).toBe(true);
  });
  it("compases", () => {
    expect(isCompound({ num: 6, den: 8 })).toBe(true);
    expect(isCompound({ num: 3, den: 4 })).toBe(false);
    expect(isIrregular({ num: 7, den: 8 })).toBe(true);
    expect(beatsOf({ num: 12, den: 8 }).count).toBe(4);
  });
  it("divide duraciones en figuras", () => {
    expect(splitIntoFigures(new Frac(3, 4)).map((d) => d.base + (d.dots ? "." : ""))).toEqual(["h."]);
    expect(splitIntoFigures(new Frac(5, 8), false).map((d) => d.base)).toEqual(["h", "8"]);
  });
});

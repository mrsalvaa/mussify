// SPDX-License-Identifier: GPL-3.0-or-later
// Estructura del camino de aprendizaje. Cada lección introduce UN concepto.
// Dentro de cada rama el orden es lineal; los requisitos entre ramas se declaran aparte.
// Los textos (explicaciones y preguntas) viven en src/content/<idioma>/.
import type { Branch, ConceptId, ExerciseSpec, Lesson } from "./types";
import { TREBLE_NOTES, BASS_NOTES } from "./extract";

const LESSONS: Lesson[] = [];

const g = (gen: string, params?: Record<string, unknown>, weight?: number): ExerciseSpec => ({ gen, params, weight });

/**
 * Series de lecciones parecidas (una nota, un intervalo, una armadura...): cada lección de la serie
 * pone adelante otro ángulo del mismo concepto (leer, ubicar, escuchar, construir...). El ángulo
 * líder pesa 2 y el resto 1; los ejercicios habilitados no cambian.
 */
const lead = (angles: string[], i: number, gen: string, base = 1): number => (angles[i % angles.length] === gen ? 2 : base);

function add(branch: Branch, unit: string, concept: ConceptId, requires: ConceptId[], exercises: ExerciseSpec[], length?: number) {
  LESSONS.push({ id: concept, branch, unit, concept, requires, exercises, length });
}

// ============================ TRONCO: TEORÍA, LECTURA Y OÍDO ============================
const T = (unit: string, c: ConceptId, req: ConceptId[], ex: ExerciseSpec[], len?: number) => add("trunk", unit, c, req, ex, len);

// Unidad 1: el sonido
T("sound", "t.sound", [], [g("pitchHigher")], 8);
T("sound", "t.notes", [], [g("noteOrder"), g("nameConvert")]);
// El oído de octavas ("¿es la misma nota más aguda?") llega después de los intervalos (ear.reference).
T("sound", "t.octave", [], [g("octaveName", undefined, 1.5), g("pitchHigher"), g("noteOrder", undefined, 0.5)]);

// Unidad 2: pentagrama y clave de Sol
T("staff", "t.staff", [], [g("staffPosition"), g("staffTap")]);
T("staff", "clef.treble", [], [g("staffPosition", undefined, 0.5), g("staffTap")]);
const READING_ORDER_TREBLE = ["G4", "A4", "F4", "B4", "E4", "C5", "D4", "C4", "D5", "E5", "F5", "G5"];
const READ_ANGLES = ["readNote", "placeNote", "hearNote", "findNote"];
READING_ORDER_TREBLE.forEach((n, i) => {
  const w = (gen: string) => lead(READ_ANGLES, i, gen);
  // Con una sola nota conocida (Sol), una comparación simple completa la sesión.
  const simple = n === "G4" ? [g("staffPosition", undefined, 0.6), g("staffTap", undefined, 0.6)] : [];
  T("staff", `read.treble.${n}`, [], [g("readNote", { clef: "treble", accidentals: false }, w("readNote")), g("findNote", undefined, w("findNote")), g("placeNote", undefined, w("placeNote")), g("noteLine", undefined, 0.6), g("hearNote", undefined, lead(READ_ANGLES, i, "hearNote", 0.6)), ...simple]);
});

// Unidad 3: ritmo básico
T("rhythm", "t.pulse", [], [g("pulseCount")], 8);
T("rhythm", "rh.q", [], [g("figureValue")], 8);
T("rhythm", "rh.h", [], [g("figureValue"), g("figureName"), g("rhythmSum")]);
T("rhythm", "rh.w", [], [g("figureValue"), g("figureName"), g("rhythmSum")]);
T("rhythm", "rest.q", [], [g("figureValue")]);
T("rhythm", "t.measure", [], []);
// Primera lección de compás: leer y completar. El dictado rítmico empieza en 3/4.
T("rhythm", "ts.4/4", [], [g("measureComplete"), g("rhythmRead")]);
T("rhythm", "rest.h", [], [g("figureValue"), g("measureComplete"), g("rhythmRead")]);
T("rhythm", "rest.w", [], [g("figureValue"), g("measureComplete")]);
T("rhythm", "ts.3/4", [], [g("measureComplete"), g("meterEar"), g("rhythmRead"), g("rhythmDictation")]);
T("rhythm", "ts.2/4", [], [g("measureComplete"), g("meterEar"), g("rhythmRead")]);
T("rhythm", "rh.8", [], [g("figureValue"), g("figureName"), g("rhythmRead"), g("rhythmDictation"), g("measureComplete")]);
T("rhythm", "rest.8", [], [g("figureValue"), g("rhythmRead"), g("rhythmDictation")]);
T("rhythm", "rh.dot", [], [g("rhythmRead"), g("rhythmDictation"), g("measureComplete")]);
T("rhythm", "rh.tie", [], [g("rhythmRead"), g("rhythmDictation")]);
T("rhythm", "ear.rhythm", [], [g("rhythmBuild", undefined, 3), g("rhythmDictation")]);
T("rhythm", "t.tempo", [], [g("rhythmRead", undefined, 0.5)]);
T("rhythm", "t.dynamics", [], []);
T("rhythm", "rh.16", [], [g("figureValue"), g("figureName"), g("rhythmRead"), g("rhythmDictation")]);
T("rhythm", "rest.16", [], [g("figureValue"), g("rhythmRead")]);

// Unidad 4: clave de Fa
T("bass-clef", "clef.bass", [], []);
const READING_ORDER_BASS = ["F3", "G3", "E3", "A3", "D3", "C4", "B3", "C3", "B2", "A2", "G2", "F2", "E2"];
READING_ORDER_BASS.forEach((n, i) => {
  const w = (gen: string) => lead(READ_ANGLES, i, gen);
  T("bass-clef", `read.bass.${n}`, [], [g("readNote", { clef: "bass", accidentals: false }, w("readNote")), g("findNote", undefined, w("findNote")), g("placeNote", undefined, w("placeNote")), g("noteLine", undefined, 0.5), g("hearNote", undefined, lead(READ_ANGLES, i, "hearNote", 0.5))]);
});
T("bass-clef", "ear.melodic", ["read.treble.C4", "read.treble.D4", "read.treble.E4", "read.treble.F4", "read.treble.G4"], [g("melodicDictation", undefined, 3), g("hearNote")]);

// Unidad 5: tonos, semitonos y alteraciones
T("accidentals", "t.keyboardMap", [], []);
T("accidentals", "t.semitone", [], [g("toneSemitone")]);
T("accidentals", "acc.sharp", [], [g("readNote", { accidentals: true }, 2)]);
T("accidentals", "acc.flat", [], [g("readNote", { accidentals: true }, 2)]);
T("accidentals", "acc.natural", [], [g("readNote", { accidentals: true })]);
T("accidentals", "t.enharmonic", [], [g("enharmonic", undefined, 2)]);
T("accidentals", "acc.double", [], []);

// Unidad 6: intervalos
T("intervals", "t.interval", [], []);
T("intervals", "iv.P8", [], [g("intervalSemitones"), g("intervalBuild")]);
T("intervals", "iv.P5", [], [g("intervalEar"), g("intervalSemitones"), g("intervalBuild"), g("intervalName")]);
T("intervals", "t.harmonic", [], [g("intervalEar", { modes: ["harm"] }), g("intervalName")]);
const IV_ANGLES = ["intervalEar", "intervalBuild", "intervalName"];
["M3", "m3", "P4", "M2", "m2", "M6", "m6", "m7", "M7", "TT"].forEach((iv, i) => {
  const w = (gen: string) => lead(IV_ANGLES, i, gen);
  T("intervals", `iv.${iv}`, [], [g("intervalEar", undefined, w("intervalEar")), g("intervalName", undefined, w("intervalName")), g("intervalBuild", undefined, w("intervalBuild")), g("intervalSemitones", undefined, 0.5)]);
});
T("intervals", "iv.inversion", [], [g("intervalInvert", undefined, 2)]);
// Puente: reconocer notas con una referencia sonora, antes de reconocerlas sin referencia.
T("intervals", "ear.reference", [], [g("absNote", { reference: true }, 2), g("octaveSame", { maxOctaves: 1 }), g("octaveCount", undefined, 0.7)]);

// Unidad 7: escalas y tonalidades
// Notas sin referencia: pocas al principio (nivel 1) y cada vez más (hasta el nivel 4, con alteraciones).
const abs = (level: number, w = 0.5) => g("absNote", { level }, w);
T("keys", "sc.major", [], [g("scaleMissing"), g("scalePattern"), abs(1)]);
T("keys", "t.key", [], [g("scaleMissing", undefined, 0.5), abs(1)]);
const KS_ANGLES = ["keySignature", "keyAccidentals", "scaleMissing"];
[1, -1, 2, -2, 3, -3, 4, -4].forEach((f, i) => {
  const w = (gen: string) => lead(KS_ANGLES, i, gen);
  T("keys", `ks.${f}`, [], [g("keySignature", undefined, w("keySignature")), g("keyAccidentals", undefined, w("keyAccidentals")), g("scaleMissing", undefined, w("scaleMissing")), abs(Math.abs(f) <= 2 ? 2 : 3)]);
});
// El círculo de quintas (la regla para deducir armaduras) antes de las seis armaduras lejanas.
T("keys", "t.circle5", [], [g("keySignature"), g("keyAccidentals")]);
T("keys", "ks.far", [], [g("keySignature", undefined, 2), g("keyAccidentals")]);
T("keys", "sc.minor", [], [g("scaleMissing"), g("scaleEar"), g("scalePattern"), abs(3)]);
T("keys", "t.relative", [], [g("relativeKey", undefined, 2), g("keySignature")]);
T("keys", "sc.harmonicMinor", [], [g("scaleMissing"), g("scaleEar"), g("scalePattern"), abs(3)]);
T("keys", "sc.melodicMinor", [], [g("scaleMissing"), g("scaleEar"), g("scalePattern"), abs(3)]);

// Unidad 8: acordes
T("chords", "ch.maj", [], [g("chordSpell", undefined, 2)]);
T("chords", "t.cifrado", [], [g("chordSymbolConvert", undefined, 2)]);
const CH_ANGLES = ["chordEar", "chordSpell", "chordName"];
const chw = (i: number, gen: string, angles = CH_ANGLES) => g(gen, undefined, lead(angles, i, gen));
T("chords", "ch.min", [], [chw(0, "chordEar"), chw(0, "chordSpell"), chw(0, "chordName"), g("chordRead"), abs(4, 0.4)]);
T("chords", "ch.dim", [], [chw(1, "chordEar"), chw(1, "chordSpell"), chw(1, "chordName"), g("chordRead"), abs(4, 0.4)]);
T("chords", "ch.aug", [], [chw(2, "chordEar"), chw(2, "chordSpell"), chw(2, "chordName"), abs(4, 0.4)]);
T("chords", "ch.inv", [], [g("chordInversion", undefined, 2)]);
T("chords", "ch.sus", [], [g("chordEar"), g("chordSpell"), g("chordName"), abs(4, 0.4)]);
T("chords", "ch.5", [], [g("chordSpell"), g("chordEar")]);
T("chords", "ch.7", [], [chw(0, "chordEar"), chw(0, "chordSpell"), chw(0, "chordName"), g("chordRead"), abs(4, 0.4)]);
T("chords", "ch.maj7", [], [chw(1, "chordEar"), chw(1, "chordSpell"), chw(1, "chordName"), abs(4, 0.4)]);
T("chords", "ch.m7", [], [chw(2, "chordEar"), chw(2, "chordSpell"), chw(2, "chordName"), abs(4, 0.4)]);
T("chords", "ch.m7b5", [], [chw(3, "chordEar"), chw(3, "chordSpell"), chw(3, "chordName"), abs(4, 0.4)]);
const CH2 = ["chordEar", "chordSpell"];
T("chords", "ch.dim7", [], [chw(0, "chordEar", CH2), chw(0, "chordSpell", CH2)]);
T("chords", "ch.6", [], [chw(1, "chordSpell", CH2), chw(1, "chordEar", CH2)]);
T("chords", "ch.add9", [], [chw(2, "chordSpell", CH2), chw(2, "chordEar", CH2)]);
T("chords", "ch.ext", [], [g("chordSpell")]);
T("chords", "ch.slash", [], []);

// Unidad 9: armonía funcional
T("harmony", "h.field", [], [g("chordName", undefined, 0.5)]);
T("harmony", "h.roman", [], [g("degreeChord", undefined, 2)]);
T("harmony", "h.function", [], [g("harmonicFunction", undefined, 2), g("degreeChord")]);
T("harmony", "ear.prog", [], [g("progressionEar", undefined, 3)]);
T("harmony", "h.cadence", [], [g("cadenceIdentify", undefined, 2)]);
T("harmony", "h.prog", [], [g("progressionEar", undefined, 2)]);
T("harmony", "h.field7", [], [g("degreeChord", undefined, 2)]);
T("harmony", "h.iiVI", [], [g("progressionEar", undefined, 2), g("degreeChord")]);
T("harmony", "h.field.minor", [], [g("degreeChord", undefined, 2)]);
T("harmony", "h.secdom", [], [g("chordAnalysis", undefined, 2)]);
T("harmony", "h.borrowed", [], [g("chordAnalysis", undefined, 2)]);
T("harmony", "h.tritone", [], [g("chordAnalysis", undefined, 2)]);
T("harmony", "h.modulation", [], [g("chordAnalysis", undefined, 0.5)]);
T("harmony", "h.analysis", [], [g("chordAnalysis", undefined, 2), g("progressionEar")]);

// Unidad 10: el idioma del rock — pentatónicas, blues y modos
T("rock", "sc.pentMinor", [], [g("scaleMissing"), g("scaleEar")]);
T("rock", "sc.pentMajor", [], [g("scaleMissing"), g("scaleEar")]);
T("rock", "sc.blues", [], [g("scaleMissing"), g("scaleEar")]);
T("rock", "h.blues12", ["ch.7"], []);
T("rock", "mode.intro", [], []);
const MODE_ANGLES = ["modeIdentify", "scaleMissing"];
["dorian", "mixolydian", "phrygian", "lydian", "locrian"].forEach((m, i) => T("rock", `mode.${m}`, [], [g("modeIdentify", undefined, lead(MODE_ANGLES, i, "modeIdentify")), g("scaleMissing", undefined, lead(MODE_ANGLES, i, "scaleMissing"))]));

// Unidad 11: ritmo avanzado
T("rhythm2", "ts.6/8", [], [g("meterEar"), g("rhythmRead"), g("rhythmDictation"), g("measureComplete")]);
T("rhythm2", "rh.triplet", [], [g("rhythmRead"), g("rhythmDictation")]);
T("rhythm2", "rh.sync", [], [g("rhythmRead"), g("rhythmDictation")]);
T("rhythm2", "ts.12/8", [], [g("meterEar"), g("rhythmRead"), g("measureComplete")]);
T("rhythm2", "ts.9/8", [], [g("meterEar"), g("rhythmRead")]);
T("rhythm2", "rh.swing", [], [g("rhythmRead", undefined, 0.5)]);
T("rhythm2", "ts.5/4", [], [g("meterEar"), g("rhythmRead"), g("measureComplete")]);
T("rhythm2", "ts.7/8", [], [g("meterEar")]);
T("rhythm2", "ts.2/2", [], [g("meterEar")]);
T("rhythm2", "ts.odd", [], []);
T("rhythm2", "rh.tuplet", [], []);
T("rhythm2", "rh.ddot", [], []);
T("rhythm2", "rh.32", [], [g("figureValue"), g("figureName")]);
T("rhythm2", "rh.poly", [], []);

// Unidad 12: más allá del pentagrama — líneas adicionales y claves de Do
T("clefs2", "read.treble.high", [], [g("readNote", { clef: "treble" }, 2), g("findNote")]);
T("clefs2", "read.treble.low", [], [g("readNote", { clef: "treble" }, 2), g("findNote")]);
T("clefs2", "read.bass.high", [], [g("readNote", { clef: "bass" }, 2), g("findNote")]);
T("clefs2", "read.bass.low", [], [g("readNote", { clef: "bass" }, 2), g("findNote")]);
T("clefs2", "t.octaveClef", [], []);
T("clefs2", "clef.alto", [], []);
T("clefs2", "clef.tenor", [], []);

// ============================ PIANO ============================
const PN = (unit: string, c: ConceptId, req: ConceptId[], ex: ExerciseSpec[], len?: number) => add("piano", unit, c, req, ex, len);
PN("keyboard", "pn.keyboard", ["t.octave"], []);
for (const l of ["C", "D", "E", "F", "G", "A", "B"]) PN("keyboard", `pn.key.${l}`, [], [g("keyboardFind", undefined, 2), g("keyboardName")]);
PN("keyboard", "pn.middleC", ["read.treble.C4", "t.octave"], [g("staffToKey"), g("keyboardFind", undefined, 0.5)]);
PN("hands", "pn.fingers", [], [g("keyboardFind", undefined, 0.5)]);
PN("hands", "pn.pos.C", ["read.treble.D4", "read.treble.E4", "read.treble.F4", "read.treble.G4", "rh.h"], [g("playMelody", undefined, 2), g("staffToKey", { clef: "treble", range: "C" })]);
PN("hands", "pn.lh", ["read.bass.C3", "read.bass.D3", "read.bass.E3", "read.bass.F3", "read.bass.G3"], [g("playMelody", { hand: "left" }, 2), g("staffToKey", { clef: "bass", range: "C" })]);
PN("hands", "pn.extend", ["read.treble.C5", "read.treble.B4", "read.treble.A4"], [g("playMelody", undefined, 2), g("staffToKey", { clef: "treble" })]);
PN("hands", "pn.black", ["acc.sharp", "acc.flat"], [g("keyboardFind", undefined, 2), g("staffToKey")]);
PN("chords", "pn.ch.maj", ["ch.maj"], [g("playChord", undefined, 2)]);
PN("chords", "pn.ch.min", ["ch.min"], [g("playChord", undefined, 2)]);
PN("chords", "pn.inv", ["ch.inv"], [g("playChord", undefined, 2)]);
PN("chords", "pn.scale", ["sc.major", "ks.1", "ks.-1"], [g("playScale", undefined, 2)]);
PN("chords", "pn.hands", [], [g("playChord"), g("playMelody", { hand: "left" })]);
PN("chords", "pn.accomp", ["h.prog"], [g("playChord")]);
PN("chords", "pn.ch.dimaug", ["ch.dim", "ch.aug"], [g("playChord", undefined, 2)]);
PN("chords", "pn.ch.7", ["ch.7", "ch.maj7", "ch.m7"], [g("playChord", undefined, 2)]);
PN("chords", "pn.ch.sus", ["ch.sus"], [g("playChord")]);
PN("style", "pn.blues", ["h.blues12", "sc.blues"], [g("scaleMissing"), g("playChord")]);
PN("style", "pn.voicing", ["h.field7"], [g("playChord"), g("degreeChord")]);

// ============================ GUITARRA ============================
const GT = (unit: string, c: ConceptId, req: ConceptId[], ex: ExerciseSpec[], len?: number) => add("guitar", unit, c, req, ex, len);
const FRET_ANGLES = ["fretName", "fretFind", "tabRead"];
const CHORD_ANGLES = ["chordDiagramName", "chordShapePlay", "guitarChordEar"];
let gtFretN = 0, gtChordN = 0;
// Cada lección de notas o de acordes toma el siguiente ángulo de la serie.
const gtFretNext = () => { const i = gtFretN++; return FRET_ANGLES.map((gen) => g(gen, { instrument: "guitar" }, lead(FRET_ANGLES, i, gen))); };
const gtChordNext = () => { const i = gtChordN++; return CHORD_ANGLES.map((gen) => g(gen, undefined, lead(CHORD_ANGLES, i, gen))); };
GT("basics", "gt.parts", ["t.octave"], []);
GT("basics", "gt.tab", [], []);
for (const s of [6, 1, 5, 4, 3, 2]) GT("basics", `gt.str.${s}`, [], gtFretNext());
GT("first-chords", "gt.ch.Em", [], gtChordNext());
GT("first-chords", "gt.ch.E", [], gtChordNext());
GT("first-position", "gt.pos.1.1", [], gtFretNext());
GT("first-position", "gt.pos.1.3", [], gtFretNext());
GT("first-chords", "gt.ch.Am", [], gtChordNext());
GT("first-chords", "gt.ch.A", [], gtChordNext());
GT("first-position", "gt.pos.2.1", [], gtFretNext());
GT("first-position", "gt.pos.2.3", [], gtFretNext());
GT("first-chords", "gt.strum", ["rh.q", "ts.4/4"], [g("chordShapePlay"), g("rhythmRead")]);
GT("first-chords", "gt.ch.D", [], gtChordNext());
GT("first-position", "gt.pos.3.2", [], gtFretNext());
GT("first-chords", "gt.ch.G", [], gtChordNext());
GT("first-position", "gt.pos.4.2", [], gtFretNext());
GT("first-position", "gt.pos.4.3", [], gtFretNext());
GT("first-chords", "gt.ch.C", [], gtChordNext());
GT("first-position", "gt.pos.5.2", [], gtFretNext());
GT("first-position", "gt.pos.5.3", [], gtFretNext());
GT("first-chords", "gt.ch.Dm", [], gtChordNext());
GT("first-position", "gt.pos.6.1", [], gtFretNext());
GT("first-position", "gt.pos.6.3", [], gtFretNext());
GT("first-chords", "gt.change", [], [g("chordDiagramName"), g("chordShapePlay", undefined, 2)]);
for (const c of ["E7", "A7", "D7", "G7", "B7"]) GT("sevenths", `gt.ch.${c}`, [], gtChordNext());
GT("rock", "gt.strum8", ["rh.8"], [g("chordShapePlay"), g("rhythmRead")]);
GT("rock", "gt.mv.power6", [], gtChordNext());
GT("rock", "gt.mv.power5", [], gtChordNext());
GT("rock", "gt.palm", [], [g("chordShapePlay")]);
GT("rock", "gt.chromatic", ["acc.sharp", "acc.flat"], gtFretNext());
for (const c of ["Am7", "Em7", "Cadd9", "Asus4", "Dsus4", "Fmaj7"]) GT("colors", `gt.ch.${c}`, [], gtChordNext());
GT("barre", "gt.mv.E", [], gtChordNext());
GT("barre", "gt.mv.Em", [], gtChordNext());
GT("barre", "gt.mv.A", [], gtChordNext());
GT("barre", "gt.mv.Am", [], gtChordNext());
GT("barre", "gt.mv.E7", [], gtChordNext());
GT("barre", "gt.mv.A7", [], gtChordNext());
GT("barre", "gt.mv.Em7", [], gtChordNext());
GT("barre", "gt.mv.Am7", [], gtChordNext());
GT("fretboard", "gt.zone.5", [], gtFretNext());
GT("fretboard", "gt.zone.10", [], gtFretNext());
GT("solo", "gt.pent", ["sc.pentMinor"], [g("fretScale", { instrument: "guitar" }, 2)]);
GT("solo", "gt.legato", [], [g("fretScale", { instrument: "guitar" })]);
GT("solo", "gt.bend", [], [g("fretScale", { instrument: "guitar" })]);
GT("solo", "gt.caged", ["ch.maj"], [g("chordDiagramName"), g("chordShapePlay")]);
GT("solo", "gt.slash", ["ch.slash"], [g("chordDiagramName")]);

// ============================ BAJO ============================
const BS = (unit: string, c: ConceptId, req: ConceptId[], ex: ExerciseSpec[], len?: number) => add("bass", unit, c, req, ex, len);
let bsFretN = 0;
const bsFretNext = () => { const i = bsFretN++; return FRET_ANGLES.map((gen) => g(gen, { instrument: "bass" }, lead(FRET_ANGLES, i, gen))); };
BS("basics", "bs.parts", ["t.octave"], []);
BS("basics", "bs.tab", [], []);
for (const s of [4, 3, 2, 1]) BS("basics", `bs.str.${s}`, [], bsFretNext());
BS("first-position", "bs.pos.4.1", [], bsFretNext());
BS("first-position", "bs.pos.4.3", [], bsFretNext());
BS("first-position", "bs.pos.3.2", [], bsFretNext());
BS("first-position", "bs.pos.3.3", [], bsFretNext());
BS("grooves", "bs.root", [], [g("bassRoot", undefined, 2), g("fretName", { instrument: "bass" })]);
BS("first-position", "bs.pos.2.2", [], bsFretNext());
BS("first-position", "bs.pos.2.3", [], bsFretNext());
BS("first-position", "bs.pos.1.2", [], bsFretNext());
BS("first-position", "bs.pos.1.4", [], bsFretNext());
BS("grooves", "bs.eighths", ["rh.8", "ts.4/4"], [g("tabRead", { instrument: "bass" }, 2), g("bassRoot")]);
BS("grooves", "bs.minor", [], [g("bassRoot", undefined, 2)]);
BS("grooves", "bs.octave", [], [g("bassShape", undefined, 2), g("bassRoot")]);
BS("grooves", "bs.fifth", [], [g("bassShape", undefined, 2)]);
BS("fretboard", "bs.chromatic", ["acc.sharp", "acc.flat"], bsFretNext());
BS("fretboard", "bs.zone.5", [], bsFretNext());
BS("fretboard", "bs.zone.10", [], bsFretNext());
BS("lines", "bs.pent", ["sc.pentMinor"], [g("fretScale", { instrument: "bass" }, 2)]);
BS("lines", "bs.approach", ["t.semitone"], [g("bassRoot")]);
BS("lines", "bs.walk", ["h.iiVI"], [g("bassRoot"), g("progressionEar")]);
BS("lines", "bs.str5", [], bsFretNext());
BS("technique", "bs.ghost", [], [g("bassShape")]);
BS("technique", "bs.slap", [], [g("bassShape")]);

// ============================ BATERÍA ============================
const DR = (unit: string, c: ConceptId, req: ConceptId[], ex: ExerciseSpec[], len?: number) => add("drums", unit, c, req, ex, len);
DR("kit", "dr.kit", ["t.sound"], []);
DR("kit", "clef.percussion", ["t.staff"], []);
DR("kit", "dr.read.kick", ["rh.q"], [g("drumPieceRead", undefined, 2)]);
const DRUM_ANGLES = ["drumPieceRead", "drumPieceEar"];
const drw = (i: number) => DRUM_ANGLES.map((gen) => g(gen, undefined, lead(DRUM_ANGLES, i, gen)));
DR("kit", "dr.read.snare", [], drw(0));
DR("kit", "dr.read.hhClosed", [], drw(1));
DR("grooves", "dr.groove.q", ["rh.q", "ts.4/4"], [g("grooveRead", undefined, 2), g("drumPieceEar")]);
DR("grooves", "dr.groove.8", ["rh.8"], [g("grooveEar", undefined, 2), g("grooveRead")]);
DR("grooves", "dr.read.crash", [], [g("drumPieceRead"), g("drumPieceEar"), g("grooveEar")]);
DR("grooves", "dr.fill", ["rest.8"], [g("grooveEar", undefined, 2), g("grooveRead")]);
DR("toms", "dr.read.tomHigh", [], drw(0));
DR("toms", "dr.read.tomMid", [], drw(1));
DR("toms", "dr.read.tomFloor", [], drw(0));
DR("toms", "dr.fill.toms", [], [g("grooveEar", undefined, 2), g("grooveRead")]);
DR("grooves2", "dr.groove.kick", [], [g("grooveEar", undefined, 2), g("grooveRead")]);
DR("grooves2", "dr.read.hhOpen", [], [g("drumPieceRead"), g("grooveEar", undefined, 2)]);
DR("grooves2", "dr.read.ride", [], [g("drumPieceRead"), g("grooveEar", undefined, 2)]);
DR("grooves2", "dr.groove.half", [], [g("grooveEar", undefined, 2), g("grooveRead")]);
DR("grooves2", "dr.groove.16", ["rh.16"], [g("grooveEar", undefined, 2), g("grooveRead")]);
DR("grooves2", "dr.read.hhPedal", [], drw(1));
DR("grooves2", "dr.read.sideStick", [], drw(0));
DR("advanced", "dr.ghost", [], [g("grooveEar")]);
DR("advanced", "dr.shuffle", ["rh.triplet", "rh.swing"], [g("grooveEar")]);
DR("advanced", "dr.groove.68", ["ts.6/8"], [g("grooveEar", undefined, 2), g("grooveRead")]);
DR("advanced", "dr.odd", ["ts.7/8", "ts.5/4"], [g("grooveEar")]);

export function allLessons(): Lesson[] {
  return LESSONS;
}

export { TREBLE_NOTES, BASS_NOTES, READING_ORDER_TREBLE, READING_ORDER_BASS };

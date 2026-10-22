// SPDX-License-Identifier: GPL-3.0-or-later
// MusicXML y Guitar Pro (gp3/gp4/gp5/gpx/gp) usando solo el importador de alphaTab (MPL-2.0).
// El dibujo y el sonido los hace Mussify; de alphaTab solo usamos el parser.
import * as alphaTab from "@coderline/alphatab";
import { fromMidi, type Pitch } from "../theory/pitch";
import type { BaseDuration, Duration } from "../theory/rhythm";
import type { Score, Staff, Measure, ScoreEvent, NoteHead, InstrumentId } from "../notation/score";
import { drumFromGm } from "../instruments/drums";

const DUR: Record<number, BaseDuration> = { 1: "w", 2: "h", 4: "q", 8: "8", 16: "16", 32: "32", 64: "32" };

type ATScore = alphaTab.model.Score;
type ATTrack = alphaTab.model.Track;
type ATStaff = alphaTab.model.Staff;

function instrumentOf(track: ATTrack, staff: ATStaff): InstrumentId {
  if (staff.isPercussion) return "drums";
  const program = track.playbackInfo.program;
  const tunings = staff.stringTuning?.tunings ?? [];
  if (tunings.length >= 4 && tunings.length <= 5 && Math.max(...tunings) < 52) return "bass";
  if (tunings.length >= 6) return "guitar";
  if (program >= 32 && program <= 39) return "bass";
  if (program >= 24 && program <= 31) return "guitar";
  return "piano";
}

function convertStaff(score: ATScore, track: ATTrack, staff: ATStaff, id: string): Staff {
  const instrument = instrumentOf(track, staff);
  const tunings = staff.stringTuning?.tunings ?? [];
  const hasTab = (instrument === "guitar" || instrument === "bass") && tunings.length > 0;
  const tuning: Pitch[] | undefined = hasTab ? tunings.map((m) => fromMidi(m)) : undefined; // de aguda a grave
  const measures: Measure[] = [];
  let pitchSum = 0, pitchCount = 0;
  staff.bars.forEach((bar, bi) => {
    const mb = score.masterBars[bi];
    const events: ScoreEvent[] = [];
    const voice = bar.voices[0];
    for (const beat of voice?.beats ?? []) {
      if (beat.graceType) continue;
      const base = DUR[beat.duration as number] ?? "q";
      const d: Duration = { base };
      if (beat.dots) d.dots = beat.dots;
      if (beat.tupletNumerator > 0 && beat.tupletDenominator > 0 && beat.tupletNumerator !== beat.tupletDenominator) d.tuplet = { n: beat.tupletNumerator, inSpaceOf: beat.tupletDenominator };
      const notes: NoteHead[] = [];
      if (!beat.isRest) {
        for (const n of beat.notes) {
          if (staff.isPercussion) {
            const art = track.percussionArticulations?.[n.percussionArticulation];
            const gm = art ? art.outputMidiNumber : n.percussionArticulation;
            const drum = drumFromGm(gm);
            if (drum && !notes.some((x) => x.drum === drum)) notes.push({ drum });
            continue;
          }
          const midi = n.realValue;
          if (!Number.isFinite(midi) || midi <= 0) continue;
          const head: NoteHead = { pitch: fromMidi(midi, (mb.keySignature as number) < 0) };
          if (n.tieDestination) head.tie = true;
          if (hasTab && n.string > 0) head.tab = { string: tunings.length - n.string + 1, fret: n.fret };
          notes.push(head);
          pitchSum += midi;
          pitchCount++;
        }
      }
      const ev: ScoreEvent = { duration: d, notes };
      if (beat.chord?.name) ev.chord = beat.chord.name;
      events.push(ev);
    }
    const m: Measure = { events };
    if (bi === 0 || mb.timeSignatureNumerator !== score.masterBars[bi - 1].timeSignatureNumerator || mb.timeSignatureDenominator !== score.masterBars[bi - 1].timeSignatureDenominator) m.timeSig = { num: mb.timeSignatureNumerator, den: mb.timeSignatureDenominator };
    const ks = mb.keySignature as number;
    if (bi === 0 || ks !== (score.masterBars[bi - 1].keySignature as number)) m.keyFifths = ks;
    if (mb.section) m.section = mb.section.text || mb.section.marker;
    measures.push(m);
  });
  const avg = pitchCount ? pitchSum / pitchCount : 64;
  return {
    id,
    name: track.name,
    instrument,
    clef: instrument === "drums" ? "percussion" : instrument === "bass" ? "bass" : avg < 55 && instrument === "piano" ? "bass" : "treble",
    showTab: hasTab,
    tuning,
    measures,
  };
}

export function alphaTabToScore(data: Uint8Array): Score {
  const settings = new alphaTab.Settings();
  const at = alphaTab.importer.ScoreLoader.loadScoreFromBytes(data, settings);
  const staves: Staff[] = [];
  at.tracks.forEach((t, ti) => t.staves.forEach((s, si) => staves.push(convertStaff(at, t, s, `t${ti}s${si}`))));
  const mb0 = at.masterBars[0];
  return {
    title: at.title || undefined,
    composer: at.artist || undefined,
    tempo: at.tempo || 120,
    timeSig: { num: mb0?.timeSignatureNumerator ?? 4, den: mb0?.timeSignatureDenominator ?? 4 },
    keyFifths: (mb0?.keySignature as number) ?? 0,
    staves,
  };
}

/** Crea un archivo Guitar Pro 7 a partir de alphaTex (útil para tests). */
export function alphaTexToGp7(tex: string): Uint8Array {
  const score = alphaTab.importer.ScoreLoader.loadAlphaTex(tex);
  return new alphaTab.exporter.Gp7Exporter().export(score, new alphaTab.Settings());
}

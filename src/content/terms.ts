// SPDX-License-Identifier: GPL-3.0-or-later
// Vocabulario controlado por idioma: cada término técnico solo puede aparecer en un texto
// si se conoce alguno de los conceptos indicados. Lo usan los tests de contenido y las fichas.

export type Terms = [RegExp, string[]][];

export const TERMS_ES: Terms = [
  [/\bnotas?\b/i, ["t.notes"]],
  [/\boctavas?\b/i, ["t.octave"]],
  [/\bpentagramas?\b/i, ["t.staff"]],
  [/\bclave de sol\b/i, ["clef.treble"]],
  [/\bclave de fa\b/i, ["clef.bass"]],
  [/\bclaves? de do\b/i, ["clef.alto"]],
  [/\bl[íi]neas? adicional(es)?\b/i, ["read.treble.C4", "read.bass.C4", "read.bass.E2"]],
  [/\bdo central\b/i, ["read.treble.C4", "pn.middleC"]],
  [/\bpulsos?\b/i, ["t.pulse"]],
  [/\bmetr[óo]nomo\b/i, ["t.pulse"]],
  [/\bnegras?\b/i, ["rh.q", "pn.keyboard", "t.keyboardMap"]],
  [/\bblancas?\b/i, ["rh.h", "pn.keyboard", "t.keyboardMap"]],
  [/\bredondas?\b/i, ["rh.w"]],
  [/\bcorcheas?\b/i, ["rh.8"]],
  [/\bsemicorcheas?\b/i, ["rh.16"]],
  [/\bfusas?\b/i, ["rh.32"]],
  [/\bsilencios? de\b/i, ["rest.q"]],
  [/\bcompases\b|\bcompás\b/i, ["t.measure"]],
  [/\bpuntillo\b/i, ["rh.dot"]],
  [/\bligaduras?\b/i, ["rh.tie"]],
  [/\btresillos?\b/i, ["rh.triplet"]],
  [/\bs[íi]ncopas?\b/i, ["rh.sync"]],
  [/\btempo\b|\bbpm\b/i, ["t.tempo"]],
  [/\bsemitonos?\b/i, ["t.semitone"]],
  [/\bsostenidos?\b/i, ["acc.sharp"]],
  [/\bbemol(es)?\b/i, ["acc.flat"]],
  [/\bbecuadros?\b/i, ["acc.natural"]],
  [/\balteraci[óo]n(es)?\b/i, ["acc.sharp"]],
  [/\benarm[óo]ni/i, ["t.enharmonic"]],
  [/\bintervalos?\b/i, ["t.interval"]],
  [/\btritono\b/i, ["iv.TT"]],
  [/\bescalas?\b/i, ["sc.major"]],
  [/\btonalidad(es)?\b|\bt[óo]nica\b/i, ["t.key"]],
  [/\barmaduras?\b/i, ["ks.1"]],
  [/\bc[íi]rculo de quintas\b/i, ["t.circle5"]],
  [/\brelativ[ao]s?\b/i, ["t.relative"]],
  [/\bacordes?\b/i, ["ch.maj", "gt.ch.Em", "bs.root", "pn.ch.maj"]],
  [/\btr[íi]adas?\b/i, ["ch.maj"]],
  [/\binversi[óo]n(es)?\b/i, ["ch.inv", "iv.inversion", "pn.inv"]],
  [/\bcifrados?\b/i, ["ch.maj", "gt.ch.Em", "bs.root"]],
  [/\bcampo arm[óo]nico\b/i, ["h.field"]],
  [/\bsubdominante\b/i, ["h.function"]],
  [/\bcadencias?\b/i, ["h.cadence"]],
  [/\bdominantes? secundari/i, ["h.secdom"]],
  [/\bpr[ée]stamo\b|\bintercambio modal\b/i, ["h.borrowed"]],
  [/\bmodulaci[óo]n\b|\bmodular\b/i, ["h.modulation"]],
  [/\bsustituci[óo]n tritonal\b/i, ["h.tritone"]],
  [/\bpentat[óo]nicas?\b/i, ["sc.pentMinor"]],
  [/\bmodos? (griegos?|d[óo]rico|frigio|lidio|mixolidio|locrio|j[óo]nico|e[óo]lico)\b/i, ["mode.intro"]],
  [/\btablaturas?\b/i, ["gt.tab", "bs.tab"]],
  [/\btrastes?\b/i, ["gt.parts", "bs.parts"]],
  [/\bdiapas[óo]n\b/i, ["gt.parts", "bs.parts"]],
  [/\bcejilla\b/i, ["gt.mv.E"]],
  [/\bpower chords?\b/i, ["gt.mv.power6", "ch.5"]],
  [/\bbombo\b|\bredoblante\b|\bhi-?hat\b|\bplatillos?\b/i, ["dr.kit"]],
  [/\bgrooves?\b/i, ["dr.groove.q", "bs.eighths"]],
];

export const TERMS_EN: Terms = [
  [/\bnotes?\b/i, ["t.notes"]],
  [/\boctaves?\b/i, ["t.octave"]],
  [/\bstaff\b|\bstaves\b/i, ["t.staff"]],
  [/\btreble clef\b/i, ["clef.treble"]],
  [/\bbass clef\b/i, ["clef.bass"]],
  [/\bC clefs?\b|\balto clef\b|\btenor clef\b/, ["clef.alto"]],
  [/\bledger lines?\b/i, ["read.treble.C4", "read.bass.C4", "read.bass.E2"]],
  [/\bmiddle C\b/i, ["read.treble.C4", "pn.middleC"]],
  [/\bbeats?\b/i, ["t.pulse"]],
  [/\bmetronome\b/i, ["t.pulse"]],
  [/\bquarter notes?\b/i, ["rh.q"]],
  [/\bhalf notes?\b/i, ["rh.h"]],
  [/\bwhole notes?\b/i, ["rh.w"]],
  [/\beighth notes?\b|\beighths\b/i, ["rh.8"]],
  [/\bsixteenth notes?\b|\bsixteenths\b/i, ["rh.16"]],
  [/\bthirty-second notes?\b/i, ["rh.32"]],
  [/\b(quarter|half|whole|eighth|sixteenth) rests?\b/i, ["rest.q"]],
  [/\bbars?\b|\bmeasures?\b/i, ["t.measure"]],
  [/\bdotted\b/i, ["rh.dot"]],
  [/\bties?\b|\btied\b/i, ["rh.tie"]],
  [/\btriplets?\b/i, ["rh.triplet"]],
  [/\bsyncopat/i, ["rh.sync"]],
  [/\btempo\b|\bbpm\b/i, ["t.tempo"]],
  [/\bhalf steps?\b|\bwhole steps?\b|\bsemitones?\b/i, ["t.semitone"]],
  [/\bsharps?\b/i, ["acc.sharp"]],
  [/\bflats?\b(?! across)/i, ["acc.flat"]],
  [/\bnatural signs?\b/i, ["acc.natural"]],
  [/\baccidentals?\b/i, ["acc.sharp"]],
  [/\benharmonic/i, ["t.enharmonic"]],
  [/\bintervals?\b/i, ["t.interval"]],
  [/\btritone\b/i, ["iv.TT"]],
  [/\bscales?\b/i, ["sc.major"]],
  [/\bkey of\b|\b(major|minor) key\b|\bchange key\b|\bkey changes?\b|\btonic\b/i, ["t.key"]],
  [/\bkey signatures?\b/i, ["ks.1"]],
  [/\bcircle of fifths\b/i, ["t.circle5"]],
  [/\brelatives?\b/i, ["t.relative"]],
  [/\bchords?\b/i, ["ch.maj", "gt.ch.Em", "bs.root", "pn.ch.maj"]],
  [/\btriads?\b/i, ["ch.maj"]],
  [/\binversions?\b/i, ["ch.inv", "iv.inversion", "pn.inv"]],
  [/\bchord symbols?\b/i, ["ch.maj", "gt.ch.Em", "bs.root"]],
  [/\bdiatonic chords\b|\bharmonized scale\b/i, ["h.field"]],
  [/\bsubdominant\b/i, ["h.function"]],
  [/\bcadences?\b/i, ["h.cadence"]],
  [/\bsecondary dominants?\b/i, ["h.secdom"]],
  [/\bborrowed chords?\b|\bmodal interchange\b/i, ["h.borrowed"]],
  [/\bmodulat/i, ["h.modulation"]],
  [/\btritone substitution\b/i, ["h.tritone"]],
  [/\bpentatonics?\b/i, ["sc.pentMinor"]],
  [/\b(greek modes|dorian|phrygian|lydian|mixolydian|locrian|ionian|aeolian)\b/i, ["mode.intro"]],
  [/\btabs?\b|\btablature\b/i, ["gt.tab", "bs.tab"]],
  [/\bfrets?\b/i, ["gt.parts", "bs.parts"]],
  [/\bfretboard\b/i, ["gt.parts", "bs.parts"]],
  [/\bbarre\b/i, ["gt.mv.E"]],
  [/\bpower chords?\b/i, ["gt.mv.power6", "ch.5"]],
  [/\bbass drum\b|\bsnare\b|\bhi-?hat\b|\bcymbals?\b/i, ["dr.kit"]],
  [/\bgrooves?\b/i, ["dr.groove.q", "bs.eighths"]],
];

const TERMS: Record<string, Terms> = { en: TERMS_EN, "es-AR": TERMS_ES };
let active: Terms = TERMS_EN;

export function termsFor(locale: string): Terms {
  return TERMS[locale] ?? TERMS_EN;
}

/** Lo llama loadContent al cambiar de idioma. */
export function setTermsLocale(locale: string): void {
  active = termsFor(locale);
}

/** Quita los marcadores [[concepto|término]] y devuelve los conceptos marcados. */
export function stripMarkers(text: string): { plain: string; marked: string[] } {
  const marked: string[] = [];
  const plain = text.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, (_m, c: string, t: string) => {
    marked.push(c);
    return t;
  });
  return { plain, marked };
}

/** ¿Se puede mostrar este texto con lo que se sabe? (ningún término técnico sin aprender) */
export function textAllowed(text: string, known: ReadonlySet<string>): boolean {
  const { plain, marked } = stripMarkers(text);
  if (marked.some((m) => !known.has(m))) return false;
  return active.every(([re, concepts]) => !re.test(plain) || concepts.some((c) => known.has(c)));
}

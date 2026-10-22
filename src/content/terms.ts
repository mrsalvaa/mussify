// SPDX-License-Identifier: GPL-3.0-or-later
// Vocabulario controlado (español): cada término técnico solo puede aparecer en un texto
// si se conoce alguno de los conceptos indicados. Lo usan los tests de contenido.

export const TERMS_ES: [RegExp, string[]][] = [
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
  return TERMS_ES.every(([re, concepts]) => !re.test(plain) || concepts.some((c) => known.has(c)));
}

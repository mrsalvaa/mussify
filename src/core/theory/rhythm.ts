// SPDX-License-Identifier: GPL-3.0-or-later
// Figuras, puntillos, tresillos y compases, con aritmética racional exacta.

export class Frac {
  readonly n: number;
  readonly d: number;
  constructor(n: number, d = 1) {
    if (d === 0) throw new Error("División por cero");
    const g = gcd(Math.abs(n), Math.abs(d)) || 1;
    const s = d < 0 ? -1 : 1;
    this.n = (s * n) / g;
    this.d = (s * d) / g;
  }
  add(o: Frac): Frac {
    return new Frac(this.n * o.d + o.n * this.d, this.d * o.d);
  }
  sub(o: Frac): Frac {
    return new Frac(this.n * o.d - o.n * this.d, this.d * o.d);
  }
  mul(o: Frac): Frac {
    return new Frac(this.n * o.n, this.d * o.d);
  }
  div(o: Frac): Frac {
    return new Frac(this.n * o.d, this.d * o.n);
  }
  cmp(o: Frac): number {
    return this.n * o.d - o.n * this.d;
  }
  eq(o: Frac): boolean {
    return this.cmp(o) === 0;
  }
  get value(): number {
    return this.n / this.d;
  }
  toString(): string {
    return this.d === 1 ? `${this.n}` : `${this.n}/${this.d}`;
  }
  static zero = new Frac(0);
}

function gcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b];
  return a;
}

/** w = redonda, h = blanca, q = negra, 8 = corchea, 16 = semicorchea, 32 = fusa. */
export type BaseDuration = "w" | "h" | "q" | "8" | "16" | "32";

export interface Duration {
  base: BaseDuration;
  dots?: number;
  /** Grupo irregular: n figuras en el lugar de `inSpaceOf` (tresillo = 3 en 2). */
  tuplet?: { n: number; inSpaceOf: number };
}

/** Valor en redondas (fracción de redonda). */
export const BASE_VALUE: Record<BaseDuration, Frac> = {
  w: new Frac(1),
  h: new Frac(1, 2),
  q: new Frac(1, 4),
  "8": new Frac(1, 8),
  "16": new Frac(1, 16),
  "32": new Frac(1, 32),
};

export const BASE_ORDER: BaseDuration[] = ["w", "h", "q", "8", "16", "32"];

export const FIGURE_NAMES: Record<BaseDuration, string> = {
  w: "redonda",
  h: "blanca",
  q: "negra",
  "8": "corchea",
  "16": "semicorchea",
  "32": "fusa",
};

export function durationValue(d: Duration): Frac {
  let v = BASE_VALUE[d.base];
  let add = v;
  for (let i = 0; i < (d.dots ?? 0); i++) {
    add = add.mul(new Frac(1, 2));
    v = v.add(add);
  }
  if (d.tuplet) v = v.mul(new Frac(d.tuplet.inSpaceOf, d.tuplet.n));
  return v;
}

/** Duración en negras (pulsos de negra). */
export function quarterLength(d: Duration): number {
  return durationValue(d).value * 4;
}

export function dur(base: BaseDuration, dots = 0): Duration {
  return dots ? { base, dots } : { base };
}

export function triplet(base: BaseDuration): Duration {
  return { base, tuplet: { n: 3, inSpaceOf: 2 } };
}

export interface TimeSignature {
  num: number;
  den: number;
}

export function measureLength(ts: TimeSignature): Frac {
  return new Frac(ts.num, ts.den);
}

/** Compás compuesto: numerador múltiplo de 3 mayor que 3 (6/8, 9/8, 12/8). */
export function isCompound(ts: TimeSignature): boolean {
  return ts.num % 3 === 0 && ts.num > 3;
}

/** Compás irregular (amalgama): 5/4, 7/8, 5/8, 11/8... */
export function isIrregular(ts: TimeSignature): boolean {
  return !isCompound(ts) && ![1, 2, 3, 4].includes(ts.num);
}

/** Pulsos del compás y su duración (en redondas). */
export function beatsOf(ts: TimeSignature): { count: number; beat: Frac } {
  if (isCompound(ts)) return { count: ts.num / 3, beat: new Frac(3, ts.den) };
  return { count: ts.num, beat: new Frac(1, ts.den) };
}

export function tsKey(ts: TimeSignature): string {
  return `${ts.num}/${ts.den}`;
}

export function parseTs(s: string): TimeSignature {
  const [a, b] = s.split("/").map((x) => parseInt(x, 10));
  return { num: a, den: b };
}

/** Acentos por defecto del metrónomo: 2 = fuerte, 1 = semifuerte, 0 = débil (por pulso). */
export function defaultAccents(ts: TimeSignature): number[] {
  const { count } = beatsOf(ts);
  if (ts.num === 5) return [2, 0, 0, 1, 0];
  if (ts.num === 7 && ts.den === 8) return [2, 0, 1, 0, 1, 0, 0];
  const out = new Array(count).fill(0);
  out[0] = 2;
  if (count === 4) out[2] = 1;
  return out;
}

/** Divide una duración total (en redondas) en figuras simples ligables. */
export function splitIntoFigures(total: Frac, allowDots = true): Duration[] {
  const out: Duration[] = [];
  let rest = total;
  const candidates: Duration[] = [];
  for (const b of BASE_ORDER) {
    if (allowDots) candidates.push({ base: b, dots: 1 });
    candidates.push({ base: b });
  }
  while (rest.cmp(Frac.zero) > 0) {
    const c = candidates.find((d) => durationValue(d).cmp(rest) <= 0);
    if (!c) break;
    out.push(c);
    rest = rest.sub(durationValue(c));
  }
  return out;
}

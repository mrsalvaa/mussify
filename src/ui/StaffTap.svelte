<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Pentagrama interactivo: se toca una línea o un espacio (con mouse, dedo o flechas + Enter). -->
<script lang="ts">
  import { G } from "../core/notation/render";
  import { t } from "../i18n";

  interface Props {
    clef: "treble" | "bass" | null;
    minStep: number;
    maxStep: number;
    /** Paso elegido (0 = 1ª línea). */
    picked?: number | null;
    /** Posiciones correctas a mostrar después de responder. */
    reveal?: number[];
    result?: boolean | null;
    onpick: (step: number) => void;
  }
  let { clef, minStep, maxStep, picked = null, reveal = [], result = null, onpick }: Props = $props();

  const sp = 16; // distancia entre líneas
  const half = sp / 2;
  const width = 300;
  const noteX = $derived(clef ? 190 : 150);
  const top = $derived((maxStep - 8) * half + sp * 1.5); // y de la 5ª línea
  const height = $derived(top + (8 - minStep) * half + sp * 1.5);
  const y = (step: number) => top + (8 - step) * half;
  let hover = $state<number | null>(null);
  let focusStep = $state<number | null>(null);

  function stepAt(ev: PointerEvent | MouseEvent): number {
    const svg = ev.currentTarget as SVGSVGElement;
    const r = svg.getBoundingClientRect();
    const py = ((ev.clientY - r.top) / r.height) * height;
    const s = Math.round(8 - (py - top) / half);
    return Math.max(minStep, Math.min(maxStep, s));
  }
  function ledgers(step: number): number[] {
    const out: number[] = [];
    for (let s = -2; s >= step; s -= 2) out.push(s);
    for (let s = 10; s <= step; s += 2) out.push(s);
    return out;
  }
  function key(e: KeyboardEvent) {
    if (result !== null) return;
    const cur = focusStep ?? 4;
    if (e.key === "ArrowUp") focusStep = Math.min(maxStep, cur + 1);
    else if (e.key === "ArrowDown") focusStep = Math.max(minStep, cur - 1);
    else if (e.key === "Enter" || e.key === " ") onpick(cur);
    else return;
    e.preventDefault();
    e.stopPropagation();
  }
  const ghost = $derived(result === null ? (hover ?? focusStep) : null);
  const shown = $derived.by(() => {
    const out: { step: number; cls: string }[] = [];
    if (ghost !== null) out.push({ step: ghost, cls: "ghost" });
    if (picked !== null) out.push({ step: picked, cls: result === null ? "sel" : result ? "ok" : "bad" });
    if (result === false) for (const r of reveal) if (r !== picked) out.push({ step: r, cls: "ok" });
    return out;
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<svg
  class="staff-tap"
  role="slider"
  tabindex="0"
  aria-label={t("staffTap.label")}
  aria-valuemin={minStep}
  aria-valuemax={maxStep}
  aria-valuenow={focusStep ?? 4}
  viewBox="0 0 {width} {height}"
  onpointermove={(e) => result === null && (hover = stepAt(e))}
  onpointerleave={() => (hover = null)}
  onclick={(e) => result === null && onpick(stepAt(e))}
  onkeydown={key}
>
  {#each [0, 2, 4, 6, 8] as s (s)}
    <line x1="8" x2={width - 8} y1={y(s)} y2={y(s)} class="line" />
  {/each}
  {#if clef === "treble"}
    <text x="14" y={y(2)} font-size={4 * sp} class="smufl clef">{G.gClef}</text>
  {:else if clef === "bass"}
    <text x="14" y={y(6)} font-size={4 * sp} class="smufl clef">{G.fClef}</text>
  {/if}
  {#each shown as n, i (i)}
    {#each ledgers(n.step) as l (l)}
      <line x1={noteX - sp * 0.9} x2={noteX + sp * 1.9} y1={y(l)} y2={y(l)} class="line {n.cls}" />
    {/each}
    <text x={noteX} y={y(n.step)} font-size={4 * sp} class="smufl note {n.cls}">{G.noteWhole}</text>
  {/each}
</svg>

<style>
  .staff-tap {
    display: block;
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    cursor: pointer;
    touch-action: manipulation;
    /* sin el resaltado naranja que Android dibuja al tocar */
    -webkit-tap-highlight-color: transparent;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 6px;
  }
  /* el contorno de foco solo con teclado, no al tocar con el dedo o el mouse */
  .staff-tap:focus:not(:focus-visible) {
    outline: none;
  }
  .staff-tap:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .line {
    stroke: var(--ink);
    stroke-width: 1.2;
  }
  .clef,
  .note {
    fill: var(--ink);
  }
  .ghost {
    opacity: 0.3;
  }
  .note.sel {
    fill: var(--accent);
  }
  .note.ok,
  .line.ok {
    fill: var(--green);
    stroke: var(--green);
  }
  .note.bad,
  .line.bad {
    fill: var(--red);
    stroke: var(--red);
  }
</style>

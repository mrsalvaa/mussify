<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { renderScore, type EventBox } from "../core/notation/render";
  import type { Score } from "../core/notation/score";
  import { noteLabel } from "../i18n";
  import { chordSymbol, parseChord } from "../core/theory/chord";
  import { prefs } from "../state/prefs.svelte";

  interface Props {
    score: Score;
    sp?: number;
    maxWidth?: number;
    /** Índice del cursor (en la lista de eventos ordenada por tiempo). */
    cursor?: { staff: number; measure: number; event: number } | null;
    highlightMeasures?: number[];
    dimMeasures?: number[];
    labels?: boolean;
    measureNumbers?: boolean;
    onmeasure?: (index: number) => void;
    ariaLabel?: string;
  }
  let { score, sp = 10, maxWidth = 900, cursor = null, highlightMeasures = [], dimMeasures = [], labels = false, measureNumbers = false, onmeasure, ariaLabel = "Partitura" }: Props = $props();

  let width = $state(300);
  const w = $derived(Math.max(200, Math.min(maxWidth, width)));
  const chordStyle = (s: string) => {
    const c = parseChord(s);
    if (!c) return s;
    return chordSymbol(c, prefs.naming === "english" ? "english" : "latin");
  };
  const result = $derived(
    renderScore(score, {
      width: w,
      sp,
      highlightMeasures,
      dimMeasures,
      noteLabels: labels ? (p) => noteLabel(p) : undefined,
      showMeasureNumbers: measureNumbers,
      chordStyle,
    }),
  );
  const cursorBox = $derived(cursor ? result.events.find((e: EventBox) => e.staff === cursor!.staff && e.measure === cursor!.measure && e.event === cursor!.event) ?? null : null);

  function click(ev: MouseEvent) {
    if (!onmeasure) return;
    const svg = ev.currentTarget as SVGSVGElement;
    const r = svg.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / r.width) * result.width;
    const y = ((ev.clientY - r.top) / r.height) * result.height;
    const m = result.measures.find((mm) => x >= mm.x0 && x <= mm.x1 && y >= mm.y0 - 30 && y <= mm.y1 + 30);
    if (m) onmeasure(m.index);
  }
</script>

<div class="score-wrap" bind:clientWidth={width}>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <svg class="score" role="img" aria-label={ariaLabel} width={result.width} height={result.height} viewBox="0 0 {result.width} {result.height}" onclick={click}>
    {#if cursorBox}
      <rect class="cursor" x={cursorBox.x - sp * 0.6} y={cursorBox.y0} width={sp * 2.6} height={cursorBox.y1 - cursorBox.y0} rx={sp * 0.5} />
    {/if}
    {#each result.prims as p, i (i)}
      {#if p.t === "line"}
        <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke-width={p.w} class={p.cls} />
      {:else if p.t === "glyph"}
        <text x={p.x} y={p.y} font-size={p.size} class="smufl {p.cls ?? ''}">{p.ch}</text>
      {:else if p.t === "text"}
        <text x={p.x} y={p.y} font-size={p.size} text-anchor={p.anchor ?? "start"} font-weight={p.bold ? 800 : 600} class={p.cls}>{p.s}</text>
      {:else if p.t === "path"}
        <path d={p.d} fill={p.fill ? undefined : "none"} stroke-width={p.fill ? 0 : (p.w ?? 1)} class={p.cls} />
      {:else if p.t === "rect"}
        <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx ?? 0} class={p.cls} />
      {/if}
    {/each}
  </svg>
</div>

<style>
  .score-wrap {
    width: 100%;
    overflow-x: auto;
  }
  svg {
    display: block;
    margin: 0 auto;
    max-width: 100%;
    height: auto;
  }
</style>

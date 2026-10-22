<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Mapa de conocimiento: cada capítulo es una agrupación de temas conectados en orden. -->
<script lang="ts">
  import type { Lesson } from "../core/curriculum/types";
  import { lessonContent } from "../content";
  import { nav } from "../state/nav.svelte";
  import { t } from "../i18n";
  import Icon from "./Icon.svelte";

  interface Chapter {
    unit: string;
    lessons: Lesson[];
  }
  interface Props {
    chapters: Chapter[];
    status: (l: Lesson) => "done" | "next" | "locked";
  }
  let { chapters, status }: Props = $props();

  let width = $state(760);
  let selected = $state<string | null>(null);

  const GAP = 34; // distancia entre temas
  const PER_ROW = $derived(Math.max(4, Math.min(8, Math.floor((width / (width > 700 ? 2 : 1) - 40) / GAP))));
  const COLS = $derived(width > 700 ? 2 : 1);
  const CLUSTER_W = $derived(width / COLS);

  interface Node {
    lesson: Lesson;
    x: number;
    y: number;
    st: "done" | "next" | "locked";
    chapter: number;
  }
  const layout = $derived.by(() => {
    const nodes: Node[] = [];
    const boxes: { x: number; y: number; w: number; h: number; title: string; n: number; done: number; total: number; future: boolean }[] = [];
    const colY = new Array(COLS).fill(16);
    chapters.forEach((c, ci) => {
      const col = ci % COLS;
      const rows = Math.ceil(c.lessons.length / PER_ROW);
      const h = 54 + rows * GAP + 14;
      const x0 = col * CLUSTER_W + 12;
      const y0 = colY[col];
      const sts = c.lessons.map(status);
      const future = sts.every((s) => s === "locked");
      boxes.push({ x: x0, y: y0, w: CLUSTER_W - 24, h, title: t(`unit.${c.unit}`), n: ci + 1, done: sts.filter((s) => s === "done").length, total: c.lessons.length, future });
      c.lessons.forEach((l, li) => {
        const r = Math.floor(li / PER_ROW);
        // filas en zigzag (boustrophedon) para que la línea no cruce el grupo
        const k = r % 2 === 0 ? li % PER_ROW : PER_ROW - 1 - (li % PER_ROW);
        nodes.push({ lesson: l, x: x0 + 22 + k * GAP, y: y0 + 60 + r * GAP, st: sts[li], chapter: ci });
      });
      colY[col] += h + 18;
    });
    return { nodes, boxes, height: Math.max(...colY) + 10 };
  });
  const sel = $derived(layout.nodes.find((n) => n.lesson.id === selected) ?? null);
  const title = (id: string) => lessonContent(id)?.title ?? id;
</script>

<div class="map" bind:clientWidth={width}>
  <svg width={width} height={layout.height} viewBox="0 0 {width} {layout.height}" role="img" aria-label={t("home.mapAria")}>
    {#each layout.boxes as b (b.n)}
      <g class="cluster {b.future ? 'future' : ''}">
        <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="6" />
        <text x={b.x + 14} y={b.y + 24} class="ctitle">{b.n}. {b.title}</text>
        <text x={b.x + b.w - 14} y={b.y + 24} text-anchor="end" class="ccount">{b.future ? t("common.locked") : `${b.done}/${b.total}`}</text>
      </g>
    {/each}
    {#each layout.nodes as n, i (n.lesson.id)}
      {@const prev = layout.nodes[i - 1]}
      {#if prev && prev.chapter === n.chapter}
        <line x1={prev.x} y1={prev.y} x2={n.x} y2={n.y} class="edge {n.st === 'done' ? 'done' : ''}" />
      {/if}
    {/each}
    {#each layout.nodes as n (n.lesson.id)}
      {#if n.st === "locked"}
        <circle cx={n.x} cy={n.y} r="4" class="node locked" />
      {:else}
        <g
          role="button"
          tabindex="0"
          aria-label={title(n.lesson.id)}
          class="hit"
          onclick={() => (selected = n.lesson.id)}
          onkeydown={(e) => (e.key === "Enter" || e.key === " ") && (selected = n.lesson.id)}
        >
          <circle cx={n.x} cy={n.y} r="14" class="halo" />
          {#if n.st === "next"}<circle cx={n.x} cy={n.y} r="11" class="ring" />{/if}
          <circle cx={n.x} cy={n.y} r="7" class="node {n.st} {selected === n.lesson.id ? 'sel' : ''}" />
          <title>{title(n.lesson.id)}</title>
        </g>
      {/if}
    {/each}
  </svg>

  <div class="legend small muted">
    <span><i class="dot done"></i>{t("home.mastered")}</span>
    <span><i class="dot next"></i>{t("home.here")}</span>
    <span><i class="dot locked"></i>{t("common.locked")}</span>
  </div>

  {#if sel}
    <aside class="panel" aria-live="polite">
      <p class="eyebrow">{sel.chapter + 1}. {t(`unit.${chapters[sel.chapter].unit}`)}</p>
      <p class="ptitle">{title(sel.lesson.id)}</p>
      <p class="small muted">{sel.st === "done" ? t("home.mastered") : t("home.here")}</p>
      <div class="row">
        <button class="btn-primary btn-small" onclick={() => nav.go({ view: "lesson", id: sel.lesson.id })}>{t("home.open")} <Icon name="arrow" size={16} /></button>
        <button class="btn-ghost btn-small" onclick={() => (selected = null)}>{t("common.close")}</button>
      </div>
    </aside>
  {/if}
</div>

<style>
  .map {
    position: relative;
    width: 100%;
  }
  svg {
    display: block;
  }
  .cluster rect {
    fill: var(--card);
    stroke: var(--border);
  }
  .cluster.future rect {
    fill: transparent;
    stroke-dasharray: 4 4;
  }
  .ctitle {
    font-family: var(--serif);
    font-size: 15px;
    font-weight: 600;
    fill: var(--text);
  }
  .cluster.future .ctitle {
    fill: var(--muted);
    font-weight: 400;
  }
  .ccount {
    font-family: var(--sans);
    font-size: 12px;
    fill: var(--muted);
  }
  .edge {
    stroke: var(--border);
    stroke-width: 1.5;
  }
  .edge.done {
    stroke: var(--accent);
    stroke-opacity: 0.6;
  }
  .node.done {
    fill: var(--accent);
  }
  .node.next {
    fill: var(--card);
    stroke: var(--accent);
    stroke-width: 2;
  }
  .node.locked {
    fill: var(--dim);
  }
  .node.sel {
    stroke: var(--ink);
    stroke-width: 2.5;
  }
  .ring {
    fill: none;
    stroke: var(--accent);
    stroke-opacity: 0.35;
    stroke-width: 1.5;
  }
  .halo {
    fill: transparent;
  }
  .hit {
    cursor: pointer;
    outline: none;
  }
  .hit:hover .halo,
  .hit:focus-visible .halo {
    fill: var(--accent-soft);
  }
  .legend {
    display: flex;
    gap: 1.2rem;
    margin-top: 0.6rem;
  }
  .dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 0.4rem;
    vertical-align: -1px;
  }
  .dot.done {
    background: var(--accent);
  }
  .dot.next {
    border: 2px solid var(--accent);
  }
  .dot.locked {
    background: var(--dim);
    width: 7px;
    height: 7px;
  }
  .panel {
    position: sticky;
    bottom: 4.5rem;
    margin-top: 1rem;
    background: var(--card);
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: var(--radius);
    padding: 0.8rem 1rem;
    box-shadow: 0 6px 24px rgb(0 0 0 / 0.08);
  }
  .panel p {
    margin: 0;
  }
  .ptitle {
    font-family: var(--serif);
    font-size: 1.25rem;
    margin: 0.2rem 0 !important;
  }
</style>

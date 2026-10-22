<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import type { ChordShape } from "../core/instruments/fretted";
  import { prefs } from "../state/prefs.svelte";

  let { shape, size = 160, title = "" }: { shape: ChordShape; size?: number; title?: string } = $props();
  const played = $derived(shape.frets.filter((f): f is number => f !== null && f > 0));
  const minF = $derived(played.length ? Math.min(...played) : 1);
  const maxF = $derived(played.length ? Math.max(...played) : 1);
  const base = $derived(maxF <= 4 ? 1 : minF);
  const rows = 5;
  const n = $derived(shape.frets.length);
  const left = $derived(prefs.leftHanded);
  const sx = (i: number) => 20 + (left ? n - 1 - i : i) * 20;
  const fy = (f: number) => 30 + (f - base + 0.5) * 22;
</script>

<figure class="cd" style="width:{size}px">
  <svg viewBox="0 0 {40 + (n - 1) * 20} {30 + rows * 22 + 8}" role="img" aria-label={`Diagrama de acorde ${title || shape.chord}`}>
    {#if base === 1}
      <rect x={sx(0) - (left ? -1 : 1) * 0} y="27" width={(n - 1) * 20} height="5" class="nut" />
    {:else}
      <text x="4" y={fy(base) + 4} class="basefret">{base}</text>
    {/if}
    {#each Array(rows + 1) as _, r (r)}
      <line x1="20" x2={20 + (n - 1) * 20} y1={30 + r * 22} y2={30 + r * 22} class="fret" />
    {/each}
    {#each Array(n) as _, i (i)}
      <line x1={sx(i)} x2={sx(i)} y1="30" y2={30 + rows * 22} class="string" />
    {/each}
    {#if shape.barre}
      {@const from = shape.frets.length - shape.barre.to}
      <rect x={Math.min(sx(from), sx(n - 1)) - 7} y={fy(shape.barre.fret) - 7} width={Math.abs(sx(n - 1) - sx(from)) + 14} height="14" rx="7" class="barre" />
    {/if}
    {#each shape.frets as f, i (i)}
      {#if f === null}
        <text x={sx(i)} y="20" text-anchor="middle" class="mute">×</text>
      {:else if f === 0}
        <circle cx={sx(i)} cy="16" r="5" class="open" />
      {:else}
        <circle cx={sx(i)} cy={fy(f)} r="8" class="dot" />
        {#if shape.fingers?.[i]}<text x={sx(i)} y={fy(f) + 4} text-anchor="middle" class="finger">{shape.fingers[i]}</text>{/if}
      {/if}
    {/each}
  </svg>
</figure>

<style>
  .cd {
    margin: 0 auto;
  }
  svg {
    width: 100%;
    display: block;
  }
  .fret {
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .string {
    stroke: var(--ink);
    stroke-width: 1.2;
  }
  .nut {
    fill: var(--ink);
  }
  .dot,
  .barre {
    fill: var(--blue);
  }
  .open {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.6;
  }
  .mute {
    font-size: 14px;
    fill: var(--ink);
    font-weight: 900;
  }
  .finger {
    font-family: var(--sans);
    font-size: 10px;
    font-weight: 900;
    fill: #fff;
  }
  .basefret {
    font-family: var(--sans);
    font-size: 11px;
    font-weight: 900;
    fill: var(--ink);
  }
</style>

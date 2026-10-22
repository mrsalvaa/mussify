<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import type { Label } from "../core/curriculum/types";
  import { formatLabel } from "../i18n";
  import ScoreView from "./ScoreView.svelte";
  import ChordDiagram from "./ChordDiagram.svelte";
  import PlayButton from "./PlayButton.svelte";
  import { CH } from "../platform/audio";

  let { label, compact = false }: { label: Label; compact?: boolean } = $props();
</script>

{#if label.kind === "score"}
  <div class="lv-score"><ScoreView score={label.score} sp={compact ? 9 : 10} maxWidth={compact ? 300 : 520} /></div>
{:else if label.kind === "diagram"}
  <ChordDiagram shape={label.shape} size={compact ? 110 : 140} />
{:else if label.kind === "audio"}
  <PlayButton seq={label.seq} label={label.text ? formatLabel(label) : ""} channel={CH.option} />
{:else if label.kind === "names"}
  <span class="names">
    {#each label.items as it, i (i)}
      <span class="nm {it.kind === 'text' && it.text === '?' ? 'q' : ''}">{formatLabel(it)}</span>
    {/each}
  </span>
{:else}
  <span>{formatLabel(label)}</span>
{/if}

<style>
  .lv-score {
    width: 100%;
    pointer-events: none;
  }
  .names {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.4em;
    justify-content: center;
  }
  .nm {
    background: var(--bg2);
    border: 2px solid var(--border);
    border-radius: 10px;
    padding: 0.15em 0.55em;
  }
  .nm.q {
    border-color: var(--orange);
    color: var(--orange);
  }
</style>

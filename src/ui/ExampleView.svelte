<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { buildExample, type Example } from "../core/curriculum/examples";
  import ScoreView from "./ScoreView.svelte";
  import Keyboard from "./Keyboard.svelte";
  import Fretboard from "./Fretboard.svelte";
  import ChordDiagram from "./ChordDiagram.svelte";
  import PlayButton from "./PlayButton.svelte";
  import { formatLabel, richText } from "../i18n";

  let { ex, cap }: { ex: Example; cap?: string } = $props();
  const v = $derived(buildExample(ex));
  let cursorTime = $state(-1);
  const cursor = $derived.by(() => {
    if (!v.audio || !v.audio.cursor.length || cursorTime < 0) return null;
    let c = null;
    for (const m of v.audio.cursor) if (m.time <= cursorTime + 0.02) c = m;
    return c;
  });
</script>

<figure class="example card">
  {#if v.score}<ScoreView score={v.score} sp={v.score.freeNotes ? 11 : 9} maxWidth={620} labels={v.labels} cursor={cursor} />{/if}
  {#if v.keyboard}<Keyboard from={v.keyboard.from} to={v.keyboard.to} marks={v.keyboard.marks} interactive={false} />{/if}
  {#if v.fretboard}<Fretboard instrument={v.fretboard.instrument} tuning={v.fretboard.tuning} frets={v.fretboard.frets} marks={v.fretboard.marks.map((m) => ({ string: m.string, fret: m.fret, role: m.role }))} interactive={false} />{/if}
  {#if v.diagram}<ChordDiagram shape={v.diagram} size={130} />{/if}
  {#if v.chords}
    <div class="chords">{#each v.chords as c, i (i)}<span class="chip">{formatLabel({ kind: "chord", chord: c })}</span>{/each}</div>
  {/if}
  <figcaption class="row">
    {#if v.audio}<PlayButton seq={v.audio} label="" ontime={(tm) => (cursorTime = tm)} />{/if}
    {#if cap}<span>{@html richText(cap)}</span>{/if}
  </figcaption>
</figure>

<style>
  .example {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin: 0;
  }
  figcaption {
    font-size: 0.95rem;
    color: var(--muted);
  }
  .chords {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }
  .chip {
    font-size: 1.2rem;
    font-weight: 900;
    padding: 0.2em 0.7em;
    border-radius: 12px;
    background: color-mix(in srgb, var(--purple) 18%, var(--card));
    border: 2px solid var(--purple);
  }
</style>

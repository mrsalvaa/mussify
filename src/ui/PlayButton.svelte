<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import type { Sequence } from "../core/notation/playback";
  import { playSeq, stopSeq, CH } from "../platform/audio";
  import { t } from "../i18n";
  import { onDestroy, onMount } from "svelte";

  interface Props {
    seq: Sequence;
    label?: string;
    autoplay?: boolean;
    channel?: number;
    big?: boolean;
    ontime?: (t: number) => void;
  }
  let { seq, label, autoplay = false, channel = CH.main, big = false, ontime }: Props = $props();
  let playing = $state(false);

  function play() {
    playing = true;
    void playSeq(seq, channel, ontime, () => (playing = false));
  }
  onMount(() => {
    if (autoplay) setTimeout(play, 250);
  });
  onDestroy(() => {
    if (playing) void stopSeq(channel);
  });
</script>

<button class="play {big ? 'big' : ''} {playing ? 'on' : ''}" onclick={play} aria-label={label ?? t("common.play")}>
  <span class="ico" aria-hidden="true">▶</span>
  {#if label !== ""}<span>{label ?? t("common.play")}</span>{/if}
</button>

<style>
  .play {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    border-color: var(--accent);
    color: var(--accent);
    background: transparent;
  }
  .play.big {
    font-size: 1.05rem;
    min-height: 50px;
    padding: 0.5em 1.4em;
  }
  .play.on {
    background: var(--accent-soft);
  }
  .ico {
    font-size: 0.9em;
  }
</style>

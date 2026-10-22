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
  <span class="ico" aria-hidden="true">{playing ? "🔊" : "▶"}</span>
  {#if label !== ""}<span>{label ?? t("common.play")}</span>{/if}
</button>

<style>
  .play {
    background: var(--blue);
    border-color: var(--blue-dark);
    color: #fff;
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
  }
  .play.big {
    font-size: 1.15rem;
    min-height: 64px;
    padding: 0.7em 1.6em;
    border-radius: 20px;
  }
  .play.on {
    filter: brightness(1.08);
  }
  .ico {
    font-size: 1.1em;
  }
</style>

<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { onDestroy } from "svelte";
  import { clickSequence } from "../../core/notation/playback";
  import { beatsOf, isCompound, defaultAccents, type TimeSignature } from "../../core/theory/rhythm";
  import { playSeq, stopSeq, CH } from "../../platform/audio";
  import { nav } from "../../state/nav.svelte";
  import { t } from "../../i18n";

  let bpm = $state(90);
  let ts = $state<TimeSignature>({ num: 4, den: 4 });
  let sub = $state(1);
  let accents = $state<number[]>(defaultAccents({ num: 4, den: 4 }));
  let running = $state(false);
  let beat = $state(-1);
  let taps: number[] = [];
  const TS = ["2/4", "3/4", "4/4", "5/4", "6/8", "7/8", "9/8", "12/8"];
  const BARS = 64;

  function start() {
    const b = beatsOf(ts);
    const subdivision = isCompound(ts) ? 3 * sub : sub;
    const seq = clickSequence(b.count * BARS, bpm, accents.map((a) => (a === 2 ? 2 : a === 1 ? 1 : 0)), subdivision);
    running = true;
    void playSeq(seq, CH.metronome, (tm) => (beat = Math.floor(tm / (60 / bpm)) % b.count), () => {
      if (running) start();
    });
  }
  function stop() {
    running = false;
    beat = -1;
    void stopSeq(CH.metronome);
  }
  function restart() {
    if (running) {
      void stopSeq(CH.metronome).then(start);
    }
  }
  function setTs(s: string) {
    const [n, d] = s.split("/").map(Number);
    ts = { num: n, den: d };
    accents = defaultAccents(ts);
    restart();
  }
  function tap() {
    const now = performance.now();
    taps = [...taps.filter((x) => now - x < 3000), now];
    if (taps.length >= 2) {
      const diffs = taps.slice(1).map((x, i) => x - taps[i]);
      bpm = Math.round(60000 / (diffs.reduce((a, b) => a + b, 0) / diffs.length));
      bpm = Math.max(30, Math.min(260, bpm));
      restart();
    }
  }
  function cycleAccent(i: number) {
    accents = accents.map((a, j) => (j === i ? (a + 1) % 3 : a));
    restart();
  }
  onDestroy(stop);
</script>

<div class="page">
  <button class="btn-ghost" onclick={() => nav.back()}>← {t("common.back")}</button>
  <h1>{t("tools.metronome")}</h1>
  <div class="card col center">
    <div class="bpm">{bpm}<span class="small muted"> BPM</span></div>
    <input type="range" min="30" max="260" bind:value={bpm} onchange={restart} aria-label={t("metro.bpm")} />
    <div class="row">
      <button onclick={() => { bpm = Math.max(30, bpm - 5); restart(); }}>−5</button>
      <button onclick={() => { bpm = Math.max(30, bpm - 1); restart(); }}>−1</button>
      <button onclick={() => { bpm = Math.min(260, bpm + 1); restart(); }}>+1</button>
      <button onclick={() => { bpm = Math.min(260, bpm + 5); restart(); }}>+5</button>
      <button onclick={tap}>👆 {t("metro.tap")}</button>
    </div>
    <div class="beats" aria-label={t("metro.accents")}>
      {#each accents as a, i (i)}
        <button class="beat a{a} {beat === i ? 'now' : ''}" onclick={() => cycleAccent(i)} aria-label="Pulso {i + 1}">{i + 1}</button>
      {/each}
    </div>
    <p class="small muted">{t("metro.accents")}: tocá un pulso para cambiar su acento.</p>
    {#if !running}
      <button class="btn-primary big" onclick={start}>▶ {t("common.start")}</button>
    {:else}
      <button class="btn-danger big" onclick={stop}>■ {t("common.stop")}</button>
    {/if}
  </div>
  <div class="card">
    <label class="col">{t("metro.timeSig")}
      <select value={`${ts.num}/${ts.den}`} onchange={(e) => setTs((e.target as HTMLSelectElement).value)}>
        {#each TS as s (s)}<option value={s}>{s}</option>{/each}
      </select>
    </label>
    <label class="col">{t("metro.subdivision")}
      <select bind:value={sub} onchange={restart}>
        <option value={1}>—</option>
        <option value={2}>× 2</option>
        <option value={3}>× 3</option>
        <option value={4}>× 4</option>
      </select>
    </label>
  </div>
</div>

<style>
  .center {
    align-items: center;
    text-align: center;
  }
  .bpm {
    font-size: 3.5rem;
    font-weight: 900;
  }
  .beats {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
  }
  .beat {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    padding: 0;
  }
  .beat.a2 {
    border-color: var(--red);
    font-size: 1.2rem;
  }
  .beat.a1 {
    border-color: var(--orange);
  }
  .beat.now {
    background: var(--green);
    color: #fff;
  }
  .big {
    font-size: 1.3rem;
    min-width: 200px;
  }
  .card {
    margin-bottom: 1rem;
  }
</style>

<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { sightMeasure, type SightMeasure } from "../../core/curriculum/sight";
  import { masteredSet, progress, saveProgress } from "../../state/progress.svelte";
  import { scoreToSequence } from "../../core/notation/playback";
  import { type PitchClass, pc, samePc } from "../../core/theory/pitch";
  import { noteLabel, t } from "../../i18n";
  import { nav } from "../../state/nav.svelte";
  import ScoreView from "../ScoreView.svelte";
  import { playSeq } from "../../platform/audio";
  import { onDestroy } from "svelte";

  const known = masteredSet();
  let tempo = $state(50);
  let round = $state(0);
  let streak = $state(0);
  let best = $state(0);
  let m = $state<SightMeasure | null>(null);
  let typed = $state<PitchClass[]>([]);
  let status = $state<"idle" | "play" | "ok" | "bad" | "timeout">("idle");
  let timeLeft = $state(0);
  let timer: ReturnType<typeof setInterval> | undefined;
  const choices = [0, 1, 2, 3, 4, 5, 6].map((l) => pc(l));

  function newRound() {
    round++;
    m = sightMeasure(known, Date.now() % 100000 + round, tempo);
    typed = [];
    if (!m) return;
    status = "play";
    // Tiempo: lo que dura el compás a este tempo, más un margen para leer
    const secs = (m.score.timeSig.num * 4 * 60) / (m.score.timeSig.den * tempo) + 2;
    timeLeft = secs;
    clearInterval(timer);
    timer = setInterval(() => {
      timeLeft = Math.max(0, timeLeft - 0.1);
      if (timeLeft <= 0 && status === "play") end("timeout");
    }, 100);
  }
  function end(s: "ok" | "bad" | "timeout") {
    clearInterval(timer);
    status = s;
    if (s === "ok") {
      streak++;
      best = Math.max(best, streak);
      tempo = Math.min(160, tempo + 6);
    } else {
      streak = 0;
      tempo = Math.max(40, tempo - 8);
    }
    progress.history.unshift({ ts: Date.now(), kind: "reading", id: "sight", ok: s === "ok" ? 1 : 0, total: 1 });
    saveProgress();
    if (m) void playSeq(scoreToSequence(m.score));
  }
  function press(p: PitchClass) {
    if (status !== "play" || !m) return;
    const i = typed.length;
    typed = [...typed, p];
    if (!samePc({ letter: m.pitches[i].letter, acc: m.pitches[i].acc }, p)) return end("bad");
    if (typed.length === m.pitches.length) end("ok");
  }
  onDestroy(() => clearInterval(timer));
  const cursor = $derived(m && status === "play" ? { staff: 0, measure: 0, event: Math.min(typed.length, m.pitches.length - 1) } : null);
</script>

<div class="page">
  <div class="row">
    <button class="btn-ghost" onclick={() => nav.back()}>← {t("common.back")}</button>
    <h1 class="grow">{t("practice.sightReading")}</h1>
    <span class="pill">♩ = {tempo}</span>
    <span class="pill">{streak} ·  {best}</span>
  </div>
  <p class="muted">{t("practice.sightReadingDesc")}</p>
  {#if m}
    <div class="card"><ScoreView score={m.score} sp={12} {cursor} /></div>
    {#if status === "play"}
      <div class="timer"><div style="width:{Math.min(100, (timeLeft / ((m.score.timeSig.num * 4 * 60) / (m.score.timeSig.den * tempo) + 2)) * 100)}%"></div></div>
    {/if}
    <div class="row center">
      {#each choices as c (c.letter)}
        <button class="nb" onclick={() => press(c)} disabled={status !== "play"}>{noteLabel(c)}</button>
      {/each}
    </div>
    {#if status !== "play"}
      <div class="row center">
        <strong class={status === "ok" ? "good" : "bad"}>{status === "ok" ? "✓ " + t("fb.correct") : status === "timeout" ? "⏱️" : "✗ " + t("fb.wrong")}</strong>
        {#if status !== "ok"}<span class="muted">{m.pitches.map((p) => noteLabel(p)).join(" – ")}</span>{/if}
        <button class="btn-primary" onclick={newRound}>{t("common.next")}</button>
      </div>
    {/if}
  {:else}
    <button class="btn-primary wide" onclick={newRound}>{t("common.start")}</button>
  {/if}
</div>

<style>
  .grow {
    flex: 1;
  }
  .center {
    justify-content: center;
    margin-top: 0.8rem;
  }
  .nb {
    min-width: 64px;
    font-size: 1.1rem;
  }
  .timer {
    height: 10px;
    background: var(--border);
    border-radius: 99px;
    overflow: hidden;
    margin-top: 0.6rem;
  }
  .timer div {
    height: 100%;
    background: var(--orange);
    transition: width 0.1s linear;
  }
  .good {
    color: var(--ok);
  }
  .bad {
    color: var(--bad);
  }
</style>

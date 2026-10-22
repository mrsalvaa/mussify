<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import type { Exercise, Lesson } from "../core/curriculum/types";
  import { lessonSession } from "../core/curriculum/engine";
  import { lessonContent } from "../content";
  import { richText, t } from "../i18n";
  import { progress, finishLesson, masteredSet } from "../state/progress.svelte";
  import { prefs } from "../state/prefs.svelte";
  import { cur } from "../state/curriculum";
  import SessionRunner, { type SessionResult } from "./SessionRunner.svelte";
  import ExampleView from "./ExampleView.svelte";
  import { nav } from "../state/nav.svelte";
  import { stopSeq } from "../platform/audio";

  let { lesson }: { lesson: Lesson } = $props();
  const content = $derived(lessonContent(lesson.id));
  let phase = $state<"explain" | "practice" | "result">("explain");
  let seed = $state(Date.now() % 1_000_000);
  let outcome = $state<{ ok: number; total: number; passed: boolean } | null>(null);

  const known = $derived(new Set([...cur.closure(lesson.concept), lesson.concept]));
  let exercises = $state<Exercise[]>([]);

  function startPractice() {
    exercises = lessonSession(cur, lesson, cur.closure(lesson.concept), { seed, length: lesson.length ?? prefs.sessionLength, stats: $state.snapshot(progress.stats) });
    phase = "practice";
  }

  function finish(results: SessionResult[]) {
    const ok = results.filter((r) => r.correct).length;
    const passed = finishLesson(lesson.id, lesson.concept, ok, results.length, prefs.threshold);
    outcome = { ok, total: results.length, passed };
    phase = "result";
  }
  function retry() {
    seed = (seed * 7 + 13) % 1_000_000;
    outcome = null;
    startPractice();
  }
  function goNext() {
    const next = cur.nextLesson(lesson.branch, masteredSet());
    if (next.lesson && next.blockedBy.length === 0) nav.go({ view: "lesson", id: next.lesson.id });
    else nav.go({ view: "home", branch: lesson.branch });
  }
</script>

<div class="page lesson">
  {#if phase === "explain"}
    <div class="row">
      <button class="btn-ghost" onclick={() => { void stopSeq(); nav.back(); }}>← {t("common.back")}</button>
      <span class="pill">{t(`branch.${lesson.branch}`)}</span>
    </div>
    <h1>{content?.title ?? lesson.id}</h1>
    <div class="col">
      {#each content?.body ?? [] as b, i (i)}
        {#if "p" in b}
          <p>{@html richText(b.p)}</p>
        {:else if "tip" in b}
          <div class="tip">💡 {@html richText(b.tip)}</div>
        {:else if "ex" in b}
          <ExampleView ex={b.ex} cap={b.cap} />
        {/if}
      {/each}
    </div>
    <div class="cta">
      <button class="btn-primary wide" onclick={startPractice}>{t("lesson.toExercises")}</button>
    </div>
  {:else if phase === "practice"}
    {#key seed}
      <SessionRunner {exercises} {known} onfinish={finish} onquit={() => (phase = "explain")} />
    {/key}
  {:else if outcome}
    <div class="result col pop">
      <div class="big-ico" aria-hidden="true">{outcome.passed ? "🎉" : "💪"}</div>
      <h1>{outcome.passed ? t("lesson.passed") : t("lesson.failed", { threshold: Math.round(prefs.threshold * 100) })}</h1>
      <p class="score">{t("lesson.score", { ok: outcome.ok, total: outcome.total, pct: Math.round((outcome.ok / Math.max(1, outcome.total)) * 100) })}</p>
      <div class="row">
        <button onclick={() => (phase = "explain")}>{t("lesson.review")}</button>
        <button onclick={retry}>{t("common.retry")}</button>
        {#if outcome.passed}<button class="btn-primary" onclick={goNext}>{t("common.continue")}</button>{/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .lesson p {
    font-size: 1.08rem;
    margin: 0.2rem 0;
  }
  .cta {
    position: sticky;
    bottom: 0.8rem;
    margin-top: 1.5rem;
  }
  .result {
    align-items: center;
    text-align: center;
    padding-top: 3rem;
  }
  .big-ico {
    font-size: 4rem;
  }
  .score {
    font-size: 1.2rem;
  }
</style>

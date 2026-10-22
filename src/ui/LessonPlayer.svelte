<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Lección: explicación con ejercicios "Probalo" intercalados y una práctica final para dominar el tema. -->
<script lang="ts">
  import type { Exercise, Lesson } from "../core/curriculum/types";
  import { lessonSession } from "../core/curriculum/engine";
  import { auditExercise } from "../core/curriculum/audit";
  import { lessonContent } from "../content";
  import { richText, t } from "../i18n";
  import { progress, finishLesson, masteredSet, recordAnswer } from "../state/progress.svelte";
  import { prefs } from "../state/prefs.svelte";
  import { cur } from "../state/curriculum";
  import SessionRunner, { type SessionResult } from "./SessionRunner.svelte";
  import ExampleView from "./ExampleView.svelte";
  import ExerciseView from "./ExerciseView.svelte";
  import Icon from "./Icon.svelte";
  import { nav } from "../state/nav.svelte";
  import { stopSeq } from "../platform/audio";
  import type { Block } from "../content/types";

  let { lesson }: { lesson: Lesson } = $props();
  const content = $derived(lessonContent(lesson.id));
  let phase = $state<"read" | "practice" | "result">("read");
  let seed = $state(Date.now() % 1_000_000);
  let outcome = $state<{ ok: number; total: number; passed: boolean } | null>(null);

  const known = $derived(new Set([...cur.closure(lesson.concept), lesson.concept]));
  let exercises = $state<Exercise[]>([]);
  // Ejercicios de prueba intercalados en el texto (no cuentan para dominar el tema).
  const tries = $derived(lessonSession(cur, lesson, cur.closure(lesson.concept), { seed: seed ^ 0x77, length: 3 }).filter((e) => auditExercise(e, known).length === 0));

  /** Bloques del texto con los "Probalo" intercalados después de los ejemplos. */
  const items = $derived.by(() => {
    const body: Block[] = content?.body ?? [];
    const out: ({ kind: "block"; b: Block } | { kind: "try"; ex: Exercise; n: number })[] = [];
    let used = 0;
    const slots = new Set(body.map((b, i) => ("ex" in b ? i : -1)).filter((i) => i >= 0).slice(0, 2));
    body.forEach((b, i) => {
      out.push({ kind: "block", b });
      if (slots.has(i) && used < tries.length) out.push({ kind: "try", ex: tries[used], n: used++ });
    });
    if (used === 0 && tries.length) out.push({ kind: "try", ex: tries[0], n: used++ });
    return out;
  });

  function startPractice() {
    void stopSeq();
    exercises = lessonSession(cur, lesson, cur.closure(lesson.concept), { seed, length: lesson.length ?? prefs.sessionLength, stats: $state.snapshot(progress.stats) });
    phase = "practice";
    window.scrollTo(0, 0);
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
  const length = $derived(lesson.length ?? prefs.sessionLength);
</script>

<div class="page lesson">
  {#if phase === "read"}
    <div class="row top">
      <button class="btn-ghost back" onclick={() => { void stopSeq(); nav.back(); }}><Icon name="back" size={18} /> {t("common.back")}</button>
      <span class="eyebrow">{t(`branch.${lesson.branch}`)} · {t(`unit.${lesson.unit}`)}</span>
    </div>
    <h1>{content?.title ?? lesson.id}</h1>
    <article class="col text">
      {#each items as it, i (i)}
        {#if it.kind === "block"}
          {#if "p" in it.b}
            <p>{@html richText(it.b.p)}</p>
          {:else if "tip" in it.b}
            <p class="tip">{@html richText(it.b.tip)}</p>
          {:else if "ex" in it.b}
            <ExampleView ex={it.b.ex} cap={it.b.cap} />
          {/if}
        {:else}
          <aside class="try" aria-label={t("lesson.tryIt")}>
            <p class="eyebrow">{t("lesson.tryIt")}</p>
            <ExerciseView exercise={it.ex} {known} inline ondone={(ok) => recordAnswer(it.ex, ok)} />
          </aside>
        {/if}
      {/each}
    </article>

    <hr />
    <section class="final">
      <h2>{t("lesson.finalPractice")}</h2>
      <p class="muted">{t("lesson.finalHint", { n: length, pct: Math.round(prefs.threshold * 100) })}</p>
      <button class="btn-primary" onclick={startPractice}>{t("lesson.startPractice")} <Icon name="arrow" size={18} /></button>
    </section>
  {:else if phase === "practice"}
    {#key seed}
      <SessionRunner {exercises} {known} onfinish={finish} onquit={() => (phase = "read")} />
    {/key}
  {:else if outcome}
    <div class="result col">
      <p class="eyebrow">{content?.title}</p>
      <h1>{outcome.passed ? t("lesson.passed") : t("lesson.failed", { threshold: Math.round(prefs.threshold * 100) })}</h1>
      <p class="score">{t("lesson.score", { ok: outcome.ok, total: outcome.total, pct: Math.round((outcome.ok / Math.max(1, outcome.total)) * 100) })}</p>
      <div class="row">
        <button onclick={() => (phase = "read")}>{t("lesson.review")}</button>
        <button onclick={retry}>{t("common.retry")}</button>
        {#if outcome.passed}<button class="btn-primary" onclick={goNext}>{t("common.continue")} <Icon name="arrow" size={18} /></button>{/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .top {
    justify-content: space-between;
  }
  .back {
    padding-left: 0;
  }
  .text p {
    font-size: 1.1rem;
    margin: 0.1rem 0;
    max-width: 68ch;
  }
  .try {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--card);
    padding: 0.8rem 1rem 1rem;
    margin: 0.6rem 0;
  }
  .try .eyebrow {
    margin: 0 0 0.3rem;
    color: var(--accent);
  }
  .final {
    padding-bottom: 2rem;
  }
  .result {
    padding-top: 3rem;
    max-width: 640px;
  }
  .score {
    font-size: 1.15rem;
  }
</style>

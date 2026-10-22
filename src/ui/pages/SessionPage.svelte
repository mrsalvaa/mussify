<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import type { Branch } from "../../core/curriculum/types";
  import { reviewSession, practiceSession, practiceByGenerators, PRACTICE_GROUPS } from "../../core/curriculum/engine";
  import { cur } from "../../state/curriculum";
  import { progress, dueConcepts, finishReview, masteredSet, weakestItems } from "../../state/progress.svelte";
  import SessionRunner, { type SessionResult } from "../SessionRunner.svelte";
  import { nav } from "../../state/nav.svelte";
  import { t } from "../../i18n";

  let { mode, filter, branch }: { mode: "review" | "practice" | "weak" | "ear" | "reading" | "rhythm"; filter?: string; branch?: Branch | "all" } = $props();
  const mastered = masteredSet();
  const seed = Date.now() % 1_000_000;
  const exercises = (() => {
    const opts = { seed, stats: progress.stats, length: 12 };
    if (mode === "review") return reviewSession(cur, dueConcepts(), mastered, opts);
    if (mode === "weak") {
      const concepts = [...new Set(weakestItems(12).map((w) => cur.lessons.find((l) => w.item.startsWith(l.concept))?.concept).filter((c): c is string => !!c))];
      return reviewSession(cur, concepts.length ? concepts : [...mastered], mastered, opts);
    }
    if (mode === "practice") return practiceSession(cur, branch ?? "all", mastered, opts);
    const group = filter ?? (mode === "reading" ? "reading" : mode === "rhythm" ? "rhythm" : "intervals");
    return practiceByGenerators(cur, PRACTICE_GROUPS[group] ?? [], mastered, opts);
  })();
  let done = $state<SessionResult[] | null>(null);

  function finish(r: SessionResult[]) {
    finishReview(r.map((x) => ({ targets: x.exercise.targets, correct: x.correct })), mode === "review" ? "review" : "practice");
    done = r;
  }
</script>

<div class="page">
  {#if !exercises.length}
    <p>{t("practice.nothing")}</p>
    <button onclick={() => nav.back()}>{t("common.back")}</button>
  {:else if !done}
    <SessionRunner {exercises} known={mastered} onfinish={finish} onquit={() => nav.back()} />
  {:else}
    {@const ok = done.filter((x) => x.correct).length}
    <div class="col center pop">
      <div class="big">{ok === done.length ? "🏆" : "👏"}</div>
      <h1>{t("lesson.score", { ok, total: done.length, pct: Math.round((ok / done.length) * 100) })}</h1>
      <button class="btn-primary" onclick={() => nav.back()}>{t("common.continue")}</button>
    </div>
  {/if}
</div>

<style>
  .center {
    align-items: center;
    text-align: center;
    padding-top: 3rem;
  }
  .big {
    font-size: 4rem;
  }
</style>

<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import type { Exercise } from "../core/curriculum/types";
  import { auditExercise } from "../core/curriculum/audit";
  import { recordAnswer } from "../state/progress.svelte";
  import ExerciseView from "./ExerciseView.svelte";
  import { stopSeq } from "../platform/audio";
  import { t } from "../i18n";

  export interface SessionResult {
    exercise: Exercise;
    correct: boolean;
  }
  interface Props {
    exercises: Exercise[];
    known: ReadonlySet<string>;
    onfinish: (results: SessionResult[]) => void;
    onquit?: () => void;
    record?: boolean;
  }
  let { exercises, known, onfinish, onquit, record = true }: Props = $props();

  // Red de seguridad: nunca mostrar un ejercicio con algo no aprendido.
  const safe = $derived(exercises.filter((e) => auditExercise(e, known).length === 0));
  let index = $state(0);
  let results = $state<SessionResult[]>([]);
  const current = $derived(safe[index]);

  function done(correct: boolean) {
    const ex = safe[index];
    if (record) recordAnswer(ex, correct);
    results = [...results, { exercise: ex, correct }];
    void stopSeq();
    if (index + 1 >= safe.length) onfinish(results);
    else index++;
  }
</script>

<div class="runner">
  <div class="top">
    {#if onquit}<button class="btn-ghost quit" onclick={() => { void stopSeq(); onquit?.(); }} aria-label={t("common.close")}>✕</button>{/if}
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax={safe.length} aria-valuenow={index}>
      <div class="fill" style="width:{safe.length ? (index / safe.length) * 100 : 0}%"></div>
    </div>
    <span class="count muted">{Math.min(index + 1, safe.length)}/{safe.length}</span>
  </div>
  {#if current}
    {#key current.id + index}
      <ExerciseView exercise={current} {known} ondone={done} />
    {/key}
  {:else}
    <p class="muted">{t("lesson.noExercises")}</p>
  {/if}
</div>

<style>
  .runner {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
  .quit {
    min-height: 40px;
    padding: 0.2em 0.6em;
    font-size: 1.2rem;
  }
  .bar {
    flex: 1;
    height: 16px;
    background: var(--border);
    border-radius: 99px;
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--green);
    border-radius: 99px;
    transition: width 0.3s;
  }
  .count {
    font-size: 0.9rem;
  }
</style>

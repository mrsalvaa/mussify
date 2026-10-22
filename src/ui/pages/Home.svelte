<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { BRANCHES, type Branch, type Lesson } from "../../core/curriculum/types";
  import { cur } from "../../state/curriculum";
  import { progress, dueConcepts, streak, weeklySessions } from "../../state/progress.svelte";
  import { prefs } from "../../state/prefs.svelte";
  import { lessonContent } from "../../content";
  import { nav } from "../../state/nav.svelte";
  import { t } from "../../i18n";

  let { branch = "trunk" }: { branch?: Branch } = $props();
  let selected = $state<Branch>("trunk");
  $effect(() => {
    selected = branch;
  });

  const mastered = $derived(new Set(Object.keys(progress.mastered)));
  const lessons = $derived(cur.byBranch.get(selected) ?? []);
  const next = $derived(cur.nextLesson(selected, mastered));
  const units = $derived.by(() => {
    const out: { unit: string; lessons: Lesson[] }[] = [];
    for (const l of lessons) {
      const last = out[out.length - 1];
      if (last && last.unit === l.unit) last.lessons.push(l);
      else out.push({ unit: l.unit, lessons: [l] });
    }
    return out;
  });
  const due = $derived(dueConcepts());
  const doneCount = $derived(lessons.filter((l) => mastered.has(l.concept)).length);
  const blockedPath = $derived(next.lesson && next.blockedBy.length ? cur.pathTo(next.blockedBy, mastered) : []);
  const firstBlocked = $derived(blockedPath.find((l) => cur.isUnlocked(l.concept, mastered)));

  function lessonState(l: Lesson): "done" | "next" | "locked" {
    if (mastered.has(l.concept)) return "done";
    if (next.lesson?.id === l.id && next.blockedBy.length === 0) return "next";
    return "locked";
  }
  function unitVisible(u: { lessons: Lesson[] }) {
    return u.lessons.some((l) => lessonState(l) !== "locked");
  }
</script>

<div class="page">
  <div class="stats row">
    <span class="pill" title={t("progress.streak")}>🔥 {t("progress.days", { n: streak() })}</span>
    <span class="pill" title={t("progress.weekly")}>🎯 {t("progress.weeklyOf", { done: weeklySessions(), goal: prefs.weeklyGoal })}</span>
  </div>

  <div class="card review row">
    <div class="col grow">
      <strong>{t("map.review")}</strong>
      <span class="muted small">{due.length ? t("map.reviewCount", { n: due.length }) : t("map.reviewNone")}</span>
    </div>
    <button class="btn-blue" disabled={!due.length} onclick={() => nav.go({ view: "session", mode: "review" })}>{t("common.start")}</button>
  </div>

  <nav class="tabs" aria-label="Ramas">
    {#each BRANCHES as b (b)}
      <button class="tab {selected === b ? 'on' : ''}" style="--c: var(--branch-{b})" onclick={() => (selected = b)} aria-pressed={selected === b}>
        {t(`branch.${b}`)}
      </button>
    {/each}
  </nav>

  <div class="branch-head row">
    <span class="muted">{doneCount}/{lessons.length}</span>
    <div class="meter"><div style="width:{(doneCount / Math.max(1, lessons.length)) * 100}%; background: var(--branch-{selected})"></div></div>
    <button class="btn-small btn-ghost" onclick={() => nav.go({ view: "placement", branch: selected })}>{t("map.placement")}</button>
  </div>

  {#if next.lesson && next.blockedBy.length}
    <div class="card blocked">
      <p>{t("map.blocked", { branch: t(`branch.${cur.byConcept.get(next.blockedBy[0])?.branch ?? "trunk"}`) })}</p>
      {#if firstBlocked}
        <button class="btn-blue" onclick={() => nav.go({ view: "lesson", id: firstBlocked.id })}>{lessonContent(firstBlocked.id)?.title ?? firstBlocked.id} →</button>
        <span class="muted small">{blockedPath.length} lecciones</span>
      {/if}
    </div>
  {:else if !next.lesson}
    <div class="card"><p>🏆 {t("map.done")}</p></div>
  {/if}

  {#each units as u (u.unit + u.lessons[0].id)}
    <section class="unit">
      <h2 class="unit-title">{unitVisible(u) ? t(`unit.${u.unit}`) : "🔒 " + t(`unit.${u.unit}`)}</h2>
      {#if unitVisible(u)}
        <div class="path">
          {#each u.lessons as l, i (l.id)}
            {@const st = lessonState(l)}
            <div class="node-row" style="--offset: {Math.sin(i * 1.1) * 60}px">
              {#if st === "locked"}
                <div class="node locked" aria-label={t("map.lockedLesson")}>🔒</div>
              {:else}
                <button class="node {st}" style="--c: var(--branch-{selected})" onclick={() => nav.go({ view: "lesson", id: l.id })} aria-label={lessonContent(l.id)?.title ?? l.id}>
                  {st === "done" ? "✓" : "★"}
                </button>
                <span class="node-title {st}">{lessonContent(l.id)?.title ?? l.id}{#if st === "next"} <span class="pill">{i === 0 && doneCount === 0 ? t("map.startHere") : t("map.next")}</span>{/if}</span>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/each}
</div>

<style>
  .stats {
    justify-content: flex-end;
    margin-bottom: 0.6rem;
  }
  .review {
    margin-bottom: 1rem;
    border-color: var(--blue);
  }
  .grow {
    flex: 1;
    gap: 0.1rem;
  }
  .tabs {
    display: flex;
    gap: 0.4rem;
    overflow-x: auto;
    padding-bottom: 0.3rem;
  }
  .tab {
    flex: 0 0 auto;
    border-color: var(--border);
    min-height: 44px;
  }
  .tab.on {
    background: var(--c);
    border-color: color-mix(in srgb, var(--c) 75%, black);
    color: #fff;
  }
  .branch-head {
    margin: 0.8rem 0;
  }
  .meter {
    flex: 1;
    min-width: 80px;
    height: 12px;
    background: var(--border);
    border-radius: 99px;
    overflow: hidden;
  }
  .meter div {
    height: 100%;
  }
  .blocked {
    border-color: var(--orange);
    margin-bottom: 1rem;
  }
  .unit {
    margin: 1.2rem 0;
  }
  .unit-title {
    font-size: 1.1rem;
    padding: 0.5rem 0.9rem;
    border-radius: 12px;
    background: var(--bg2);
  }
  .path {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.6rem 0;
  }
  .node-row {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    transform: translateX(calc(var(--offset) * 0.5));
  }
  @media (min-width: 700px) {
    .node-row {
      transform: translateX(var(--offset));
      margin-left: 25%;
    }
  }
  .node {
    width: 64px;
    height: 58px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 1.4rem;
    flex: 0 0 auto;
    padding: 0;
  }
  .node.done {
    background: var(--c);
    border-color: color-mix(in srgb, var(--c) 70%, black);
    color: #fff;
  }
  .node.next {
    background: var(--c);
    border-color: color-mix(in srgb, var(--c) 70%, black);
    color: #fff;
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--c) 30%, transparent);
    animation: pulse 1.6s infinite;
  }
  .node.locked {
    background: var(--border);
    border: 2px solid var(--border);
    border-bottom-width: 4px;
    color: var(--muted);
    font-size: 1.1rem;
  }
  .node-title.next {
    font-weight: 900;
  }
  .node-title.done {
    color: var(--muted);
  }
  @keyframes pulse {
    50% {
      box-shadow: 0 0 0 10px color-mix(in srgb, var(--c) 15%, transparent);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .node.next {
      animation: none;
    }
  }
</style>

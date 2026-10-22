<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { progress, streak, weeklySessions, weakestItems } from "../../state/progress.svelte";
  import { prefs } from "../../state/prefs.svelte";
  import { cur } from "../../state/curriculum";
  import { lessonContent } from "../../content";
  import { BRANCHES } from "../../core/curriculum/types";
  import { nav } from "../../state/nav.svelte";
  import { t, hasKey } from "../../i18n";

  const acc = $derived(
    Object.entries(progress.genStats)
      .map(([g, s]) => ({ g, name: hasKey(`gen.${g}`) ? t(`gen.${g}`) : g, pct: s.seen ? Math.round(((s.seen - s.wrong) / s.seen) * 100) : 0, seen: s.seen }))
      .sort((a, b) => b.seen - a.seen),
  );
  function itemName(item: string): string {
    const l = cur.lessons.find((x) => item.startsWith(x.concept));
    if (l) return lessonContent(l.id)?.title ?? item;
    if (item.startsWith("quiz.")) return lessonContent(item.split(".").slice(1, -1).join("."))?.title ?? item;
    return item;
  }
</script>

<div class="page">
  <button class="btn-ghost" onclick={() => nav.back()}>← {t("common.back")}</button>
  <h1>{t("progress.title")}</h1>
  <div class="grid">
    <div class="card stat"><span class="big">🔥 {streak()}</span><span class="muted">{t("progress.streak")}</span></div>
    <div class="card stat"><span class="big">🎯 {weeklySessions()}/{prefs.weeklyGoal}</span><span class="muted">{t("progress.weekly")}</span></div>
    <div class="card stat"><span class="big">⭐ {Object.keys(progress.mastered).length}</span><span class="muted">{t("progress.mastered")}</span></div>
  </div>

  <h2>{t("progress.byBranch")}</h2>
  {#each BRANCHES as b (b)}
    {@const all = cur.byBranch.get(b) ?? []}
    {@const done = all.filter((l) => progress.mastered[l.concept]).length}
    <div class="row bar-row"><span class="label">{t(`branch.${b}`)}</span><div class="meter"><div style="width:{(done / Math.max(1, all.length)) * 100}%; background: var(--branch-{b})"></div></div><span class="muted small">{done}/{all.length}</span></div>
  {/each}

  <h2>{t("progress.accuracy")}</h2>
  {#if !acc.length}<p class="muted">{t("progress.none")}</p>{/if}
  {#each acc as a (a.g)}
    <div class="row bar-row"><span class="label">{a.name}</span><div class="meter"><div style="width:{a.pct}%; background: var(--green)"></div></div><span class="small">{a.pct}% <span class="muted">({a.seen})</span></span></div>
  {/each}

  <h2>{t("progress.weakest")}</h2>
  {#if !weakestItems().length}<p class="muted">{t("progress.none")}</p>{/if}
  <ul>
    {#each weakestItems() as w (w.item)}
      <li>{itemName(w.item)} — <span class="muted">{t("progress.errorRate", { pct: Math.round(w.rate * 100), wrong: w.wrong, seen: w.seen })}</span></li>
    {/each}
  </ul>
  {#if weakestItems().length}<button class="btn-blue" onclick={() => nav.go({ view: "session", mode: "weak" })}>{t("practice.weak")}</button>{/if}

  <h2>{t("progress.history")}</h2>
  <ul class="hist">
    {#each progress.history.slice(0, 40) as h, i (i)}
      <li><span class="muted small">{new Date(h.ts).toLocaleString("es-AR")}</span> · {h.kind === "lesson" ? lessonContent(h.id)?.title : h.kind} · {h.ok}/{h.total} {h.passed ? "✓" : ""}</li>
    {/each}
  </ul>
</div>

<style>
  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .big {
    font-size: 1.8rem;
    font-weight: 900;
  }
  .bar-row {
    flex-wrap: nowrap;
  }
  .label {
    width: 11rem;
    flex: 0 0 auto;
    font-size: 0.9rem;
  }
  .meter {
    flex: 1;
    height: 12px;
    background: var(--border);
    border-radius: 99px;
    overflow: hidden;
  }
  .meter div {
    height: 100%;
  }
  .hist {
    font-size: 0.9rem;
  }
</style>

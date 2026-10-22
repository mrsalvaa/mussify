<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Temario: la progresión presentada como el índice de un libro. -->
<script lang="ts">
  import { BRANCHES, type Branch, type Lesson } from "../../core/curriculum/types";
  import { cur } from "../../state/curriculum";
  import { progress, dueConcepts, streak, weeklySessions } from "../../state/progress.svelte";
  import { prefs } from "../../state/prefs.svelte";
  import { lessonContent } from "../../content";
  import { nav } from "../../state/nav.svelte";
  import { t } from "../../i18n";
  import Icon from "../Icon.svelte";
  import KnowledgeMap from "../KnowledgeMap.svelte";
  import { savePrefs } from "../../state/prefs.svelte";

  let { branch = "trunk" }: { branch?: Branch } = $props();
  let selected = $state<Branch>("trunk");
  $effect(() => {
    selected = branch;
  });

  const mastered = $derived(new Set(Object.keys(progress.mastered)));
  const lessons = $derived(cur.byBranch.get(selected) ?? []);
  const next = $derived(cur.nextLesson(selected, mastered));
  const chapters = $derived.by(() => {
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
  const title = (id: string) => lessonContent(id)?.title ?? id;

  function status(l: Lesson): "done" | "next" | "locked" {
    if (mastered.has(l.concept)) return "done";
    if (next.lesson?.id === l.id && next.blockedBy.length === 0) return "next";
    return "locked";
  }
  function chapterState(c: { lessons: Lesson[] }): "done" | "current" | "future" {
    if (c.lessons.every((l) => mastered.has(l.concept))) return "done";
    if (c.lessons.some((l) => status(l) !== "locked") || c.lessons.some((l) => l.id === next.lesson?.id)) return "current";
    return "future";
  }
  let open = $state<Record<string, boolean>>({});
</script>

<div class="page">
  <p class="eyebrow">{t("home.course")}</p>
  <h1>{t(`branch.${selected}`)}</h1>

  <nav class="branches" aria-label={t("home.branches")}>
    {#each BRANCHES as b (b)}
      <button class="branch {selected === b ? 'on' : ''}" onclick={() => (selected = b)} aria-pressed={selected === b}>{t(`branch.${b}`)}</button>
    {/each}
  </nav>

  <section class="continue">
    {#if next.lesson && next.blockedBy.length === 0}
      <div>
        <p class="eyebrow">{t("home.continue")}</p>
        <p class="next-title">{title(next.lesson.id)}</p>
      </div>
      <button class="btn-primary" onclick={() => nav.go({ view: "lesson", id: next.lesson!.id })}>{t("common.continue")} <Icon name="arrow" size={18} /></button>
    {:else if next.lesson}
      <div>
        <p class="eyebrow">{t("home.blockedTitle")}</p>
        <p class="small">{t("map.blocked", { branch: t(`branch.${cur.byConcept.get(next.blockedBy[0])?.branch ?? "trunk"}`) })}</p>
      </div>
      {#if firstBlocked}<button class="btn-primary" onclick={() => nav.go({ view: "lesson", id: firstBlocked.id })}>{title(firstBlocked.id)} <Icon name="arrow" size={18} /></button>{/if}
    {:else}
      <p>{t("map.done")}</p>
    {/if}
  </section>

  <div class="meta small muted">
    <span>{t("home.progressLine", { done: doneCount, total: lessons.length })}</span>
    {#if due.length}
      <button class="btn-ghost btn-small link" onclick={() => nav.go({ view: "session", mode: "review" })}><Icon name="review" size={16} />{t("map.reviewCount", { n: due.length })}</button>
    {/if}
    <span>{t("home.streakLine", { days: streak(), done: weeklySessions(), goal: prefs.weeklyGoal })}</span>
    <button class="btn-ghost btn-small link" onclick={() => nav.go({ view: "placement", branch: selected })}>{t("map.placement")}</button>
  </div>

  <div class="viewbar">
    <div class="seg" role="group" aria-label={t("home.view")}>
      <button class={prefs.homeView !== "map" ? "on" : ""} aria-pressed={prefs.homeView !== "map"} onclick={() => { prefs.homeView = "book"; savePrefs(); }}><Icon name="book" size={16} /> {t("home.viewBook")}</button>
      <button class={prefs.homeView === "map" ? "on" : ""} aria-pressed={prefs.homeView === "map"} onclick={() => { prefs.homeView = "map"; savePrefs(); }}><Icon name="map" size={16} /> {t("home.viewMap")}</button>
    </div>
  </div>

  {#if prefs.homeView === "map"}
    {#key selected}<KnowledgeMap {chapters} {status} />{/key}
  {:else}
  <ol class="toc">
    {#each chapters as c, ci (c.unit + c.lessons[0].id)}
      {@const st = chapterState(c)}
      {@const done = c.lessons.filter((l) => mastered.has(l.concept)).length}
      {@const expanded = st === "current" || open[c.unit + ci]}
      <li class="chapter {st}">
        <button class="chapter-head" disabled={st === "future"} onclick={() => (open[c.unit + ci] = !open[c.unit + ci])} aria-expanded={expanded}>
          <span class="num">{ci + 1}</span>
          <span class="ctitle">{t(`unit.${c.unit}`)}</span>
          <span class="bar" aria-hidden="true"><span style="width:{(done / c.lessons.length) * 100}%"></span></span>
          <span class="pct">{st === "future" ? t("common.locked") : `${Math.round((done / c.lessons.length) * 100)}%`}</span>
        </button>
        {#if expanded && st !== "future"}
          <ol class="sections">
            {#each c.lessons as l, li (l.id)}
              {@const s = status(l)}
              <li class="section {s}">
                <span class="snum">{ci + 1}.{li + 1}</span>
                {#if s === "locked"}
                  <span class="stitle">{st === "current" ? title(l.id) : t("map.lockedLesson")}</span>
                  <span class="sstate"><Icon name="lock" size={15} /></span>
                {:else}
                  <button class="stitle linkish" onclick={() => nav.go({ view: "lesson", id: l.id })}>{title(l.id)}</button>
                  <span class="sstate">{#if s === "done"}<Icon name="check" size={16} />{t("home.mastered")}{:else}<strong>{t("home.here")}</strong>{/if}</span>
                {/if}
              </li>
            {/each}
          </ol>
        {/if}
      </li>
    {/each}
  </ol>
  {/if}
</div>

<style>
  .viewbar {
    display: flex;
    justify-content: flex-end;
    margin: -0.8rem 0 0.8rem;
  }
  .seg {
    display: inline-flex;
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .seg button {
    border: none;
    border-radius: 0;
    min-height: 34px;
    padding: 0.25rem 0.8rem;
    font-size: 0.9rem;
    background: transparent;
    color: var(--muted);
    display: inline-flex;
    gap: 0.35rem;
    align-items: center;
  }
  .seg button + button {
    border-left: 1px solid var(--rule);
  }
  .seg button.on {
    background: var(--accent);
    color: var(--accent-ink);
  }
  .branches {
    display: flex;
    gap: 1.2rem;
    overflow-x: auto;
    border-bottom: 1px solid var(--border);
    margin-bottom: 1.4rem;
  }
  .branch {
    border: none;
    border-radius: 0;
    background: none;
    padding: 0.5rem 0;
    min-height: 40px;
    color: var(--muted);
    border-bottom: 2px solid transparent;
    flex: 0 0 auto;
  }
  .branch.on {
    color: var(--text);
    border-bottom-color: var(--accent);
  }
  .continue {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 1.1rem 1.2rem;
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    background: var(--card);
    border-radius: var(--radius);
  }
  .continue p {
    margin: 0;
  }
  .next-title {
    font-family: var(--serif);
    font-size: 1.35rem;
    margin-top: 0.2rem !important;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 1.2rem;
    align-items: center;
    margin: 0.8rem 0 1.8rem;
  }
  .link {
    padding: 0;
    min-height: 0;
    color: var(--accent);
    font-weight: 600;
  }
  .toc {
    list-style: none;
    padding: 0;
    margin: 0;
    border-top: 1px solid var(--border);
  }
  .chapter {
    border-bottom: 1px solid var(--border);
  }
  .chapter-head {
    width: 100%;
    display: grid;
    grid-template-columns: 2.2rem 1fr minmax(60px, 140px) 4.5rem;
    align-items: center;
    gap: 0.8rem;
    border: none;
    border-radius: 0;
    background: none;
    padding: 0.9rem 0;
    text-align: left;
    min-height: 54px;
  }
  .chapter-head:disabled {
    opacity: 1;
    cursor: default;
    color: var(--muted);
  }
  .num {
    font-family: var(--serif);
    font-size: 1.2rem;
    color: var(--muted);
  }
  .ctitle {
    font-family: var(--serif);
    font-size: 1.15rem;
    font-weight: 600;
  }
  .chapter.future .ctitle {
    font-weight: 400;
  }
  .bar {
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    background: var(--accent);
  }
  .pct {
    text-align: right;
    font-size: 0.85rem;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .sections {
    list-style: none;
    padding: 0 0 0.8rem 3rem;
    margin: 0;
  }
  .section {
    display: grid;
    grid-template-columns: 2.6rem 1fr auto;
    align-items: baseline;
    gap: 0.6rem;
    padding: 0.35rem 0;
    border-bottom: 1px dotted var(--border);
  }
  .section:last-child {
    border-bottom: none;
  }
  .snum {
    color: var(--muted);
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
  }
  .section.locked .stitle {
    color: var(--muted);
  }
  .linkish {
    border: none;
    background: none;
    padding: 0;
    min-height: 0;
    text-align: left;
    font-weight: 400;
    color: var(--text);
  }
  .linkish:hover {
    text-decoration: underline;
  }
  .section.next .linkish {
    font-weight: 600;
    color: var(--accent);
  }
  .sstate {
    font-size: 0.85rem;
    color: var(--muted);
    display: inline-flex;
    gap: 0.3rem;
    align-items: center;
  }
  .section.next .sstate {
    color: var(--accent);
  }
  @media (max-width: 560px) {
    .chapter-head {
      grid-template-columns: 1.8rem 1fr 3.8rem;
    }
    .bar {
      display: none;
    }
    .sections {
      padding-left: 1rem;
    }
  }
</style>

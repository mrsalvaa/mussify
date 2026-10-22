<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { cur } from "../../state/curriculum";
  import { progress } from "../../state/progress.svelte";
  import { lessonContent } from "../../content";
  import { nav } from "../../state/nav.svelte";
  import { richText, t } from "../../i18n";

  let q = $state("");
  const known = $derived(new Set(Object.keys(progress.mastered)));
  const items = $derived(
    cur
      .knownGlossary(known)
      .map((l) => ({ l, c: lessonContent(l.id) }))
      .filter((x) => x.c && (!q || x.c.title.toLowerCase().includes(q.toLowerCase())))
      .sort((a, b) => a.c!.title.localeCompare(b.c!.title, "es")),
  );
  function firstParagraph(id: string): string {
    const c = lessonContent(id);
    const p = c?.body.find((b) => "p" in b);
    return p && "p" in p ? p.p : "";
  }
</script>

<div class="page">
  <button class="btn-ghost" onclick={() => nav.back()}>← {t("common.back")}</button>
  <h1>{t("glossary.title")}</h1>
  <input type="search" bind:value={q} placeholder={t("glossary.search")} aria-label={t("glossary.search")} class="wide" />
  {#if !items.length}
    <p class="muted">{t("glossary.empty")}</p>
  {/if}
  {#each items as it (it.l.id)}
    <details class="card entry">
      <summary><strong>{it.c!.title}</strong> <span class="pill">{t(`branch.${it.l.branch}`)}</span></summary>
      <p>{@html richText(firstParagraph(it.l.id))}</p>
      <button class="btn-small" onclick={() => nav.go({ view: "lesson", id: it.l.id })}>{t("songs.openLesson")}</button>
    </details>
  {/each}
</div>

<style>
  .entry {
    margin: 0.5rem 0;
  }
  input {
    margin-bottom: 0.8rem;
  }
</style>

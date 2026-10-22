<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { BRANCHES } from "../../core/curriculum/types";
  import { PRACTICE_GROUPS } from "../../core/curriculum/engine";
  import { cur } from "../../state/curriculum";
  import { progress, dueConcepts, weakestItems } from "../../state/progress.svelte";
  import { nav } from "../../state/nav.svelte";
  import { t } from "../../i18n";

  const mastered = $derived(new Set(Object.keys(progress.mastered)));
  const has = (gens: string[]) => cur.lessons.some((l) => mastered.has(l.concept) && l.exercises.some((e) => gens.includes(e.gen)));
  const ear = [
    { key: "intervals", label: "ear.intervals", icon: "↕️" },
    { key: "chords", label: "ear.chords", icon: "🎹" },
    { key: "progressions", label: "ear.progressions", icon: "🔁" },
    { key: "melodic", label: "ear.melodic", icon: "🎼" },
    { key: "rhythmic", label: "ear.rhythmic", icon: "🥁" },
    { key: "scales", label: "ear.scales", icon: "🪜" },
  ];
</script>

<div class="page">
  <h1>{t("practice.title")}</h1>
  <div class="grid">
    <button class="tile blue" disabled={!dueConcepts().length} onclick={() => nav.go({ view: "session", mode: "review" })}>
      <span class="ti">🧠</span><strong>{t("map.review")}</strong><span class="small">{t("map.reviewCount", { n: dueConcepts().length })}</span>
    </button>
    <button class="tile green" disabled={!mastered.size} onclick={() => nav.go({ view: "session", mode: "practice", branch: "all" })}>
      <span class="ti">🎲</span><strong>{t("practice.mix")}</strong>
    </button>
    <button class="tile orange" disabled={!weakestItems().length} onclick={() => nav.go({ view: "session", mode: "weak" })}>
      <span class="ti">🎯</span><strong>{t("practice.weak")}</strong>
    </button>
  </div>

  <h2>{t("practice.ear")}</h2>
  <div class="grid">
    {#each ear as e (e.key)}
      <button class="tile" disabled={!has(PRACTICE_GROUPS[e.key])} onclick={() => nav.go({ view: "session", mode: "ear", filter: e.key })}>
        <span class="ti">{e.icon}</span><strong>{t(e.label)}</strong>
      </button>
    {/each}
  </div>

  <h2>{t("practice.reading")} · {t("practice.rhythm")}</h2>
  <div class="grid">
    <button class="tile" disabled={!has(PRACTICE_GROUPS.reading)} onclick={() => nav.go({ view: "session", mode: "reading" })}><span class="ti">👀</span><strong>{t("practice.reading")}</strong></button>
    <button class="tile purple" disabled={!mastered.has("read.treble.C5")} onclick={() => nav.go({ view: "sight" })}>
      <span class="ti">⚡</span><strong>{t("practice.sightReading")}</strong><span class="small">{t("practice.sightReadingDesc")}</span>
    </button>
    <button class="tile" disabled={!has(PRACTICE_GROUPS.rhythm)} onclick={() => nav.go({ view: "session", mode: "rhythm" })}><span class="ti">⏱️</span><strong>{t("practice.rhythm")}</strong></button>
  </div>

  <h2>{t("practice.byBranch")}</h2>
  <div class="grid">
    {#each BRANCHES as b (b)}
      {@const any = (cur.byBranch.get(b) ?? []).some((l) => mastered.has(l.concept))}
      <button class="tile" style="--c: var(--branch-{b})" disabled={!any} onclick={() => nav.go({ view: "session", mode: "practice", branch: b })}><strong>{t(`branch.${b}`)}</strong></button>
    {/each}
  </div>
  {#if !mastered.size}<p class="muted">{t("practice.nothing")}</p>{/if}
</div>

<style>
  .tile {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
    text-align: left;
    min-height: 96px;
    border-left: 8px solid var(--c, var(--border));
  }
  .tile.blue {
    --c: var(--blue);
  }
  .tile.green {
    --c: var(--green);
  }
  .tile.orange {
    --c: var(--orange);
  }
  .tile.purple {
    --c: var(--purple);
  }
  .ti {
    font-size: 1.6rem;
  }
  h2 {
    margin-top: 1.5rem;
  }
</style>

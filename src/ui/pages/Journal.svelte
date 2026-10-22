<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { progress, addJournal } from "../../state/progress.svelte";
  import { nav } from "../../state/nav.svelte";
  import { t } from "../../i18n";

  let text = $state("");
  let minutes = $state(20);
  function add() {
    if (!text.trim()) return;
    addJournal(minutes, text.trim());
    text = "";
  }
</script>

<div class="page">
  <button class="btn-ghost" onclick={() => nav.back()}>← {t("common.back")}</button>
  <h1>{t("journal.title")}</h1>
  <div class="card col">
    <textarea rows="4" bind:value={text} placeholder={t("journal.placeholder")} aria-label={t("journal.title")}></textarea>
    <div class="row">
      <label class="row">{t("journal.minutes")} <input type="number" min="1" max="600" bind:value={minutes} style="width:6rem" /></label>
      <span class="spacer"></span>
      <button class="btn-primary" onclick={add}>{t("common.save")}</button>
    </div>
  </div>
  {#if !progress.journal.length}<p class="muted">{t("journal.empty")}</p>{/if}
  {#each progress.journal as j, i (i)}
    <div class="card entry">
      <div class="muted small">{new Date(j.ts).toLocaleString("es-AR")} · {j.minutes} min</div>
      <p>{j.text}</p>
    </div>
  {/each}
</div>

<style>
  .entry {
    margin-top: 0.6rem;
  }
</style>

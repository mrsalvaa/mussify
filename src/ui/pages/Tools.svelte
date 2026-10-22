<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import Icon from "../Icon.svelte";
  import { nav } from "../../state/nav.svelte";
  import { t } from "../../i18n";
  const items = [
    { view: "metronome", icon: "metronome", label: "tools.metronome" },
    { view: "instruments", icon: "keys", label: "tools.instruments" },
    { view: "glossary", icon: "glossary", label: "tools.glossary" },
    { view: "journal", icon: "journal", label: "tools.journal" },
  ] as const;
</script>

<div class="page">
  <h1>{t("nav.tools")}</h1>
  <div class="grid">
    {#each items as it (it.view)}
      <button class="tile" onclick={() => nav.go({ view: it.view })}><Icon name={it.icon} size={28} /><strong>{t(it.label)}</strong></button>
    {/each}
  </div>
</div>

<style>
  .tile {
    min-height: 110px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-end;
    gap: 0.5rem;
    font-weight: 400;
  }
  .tile :global(.icon) {
    color: var(--accent);
  }
  .tile strong {
    font-family: var(--serif);
    font-size: 1.15rem;
  }
</style>

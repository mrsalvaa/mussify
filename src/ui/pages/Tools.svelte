<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { nav } from "../../state/nav.svelte";
  import { t } from "../../i18n";
  const items = [
    { view: "metronome", icon: "⏱️", label: "tools.metronome" },
    { view: "instruments", icon: "🎹", label: "tools.instruments" },
    { view: "glossary", icon: "📖", label: "tools.glossary" },
    { view: "journal", icon: "📝", label: "tools.journal" },
  ] as const;
</script>

<div class="page">
  <h1>{t("nav.tools")}</h1>
  <div class="grid">
    {#each items as it (it.view)}
      <button class="tile" onclick={() => nav.go({ view: it.view })}><span class="ti">{it.icon}</span><strong>{t(it.label)}</strong></button>
    {/each}
  </div>
</div>

<style>
  .tile {
    min-height: 110px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
  }
  .ti {
    font-size: 2rem;
  }
</style>

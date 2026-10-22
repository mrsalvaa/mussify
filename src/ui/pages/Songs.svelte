<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { exampleSongs } from "../../content";
  import { songStatus } from "../../core/songs/song";
  import { cur } from "../../state/curriculum";
  import { progress } from "../../state/progress.svelte";
  import { nav } from "../../state/nav.svelte";
  import { t } from "../../i18n";

  const known = $derived(new Set(Object.keys(progress.mastered)));
  const songs = exampleSongs();
  const groups = ["piano", "guitar", "bass", "drums"] as const;
</script>

<div class="page">
  <h1>{t("songs.title")}</h1>
  <p class="muted small">{t("songs.disclaimer")}</p>
  {#each groups as g (g)}
    <h2>{t(`branch.${g}`)}</h2>
    <div class="grid">
      {#each songs.filter((s) => s.instrument === g) as s (s.id)}
        {@const st = songStatus(cur, s, known)}
        {@const partial = !st.available && st.sections.some((x) => x.available)}
        <button class="song card" style="--c: var(--branch-{g})" onclick={() => nav.go({ view: "song", id: s.id })}>
          <strong class="title">{s.title}</strong>
          <span class="muted">{s.artist} · {s.year}</span>
          <span class="row">
            <span class="pill">{t("songs.level", { n: s.level })}</span>
            {#if st.available}
              <span class="pill ok">✓ {t("songs.available")}</span>
            {:else if partial}
              <span class="pill">◐ {t("songs.partial")}</span>
            {:else}
              <span class="pill">🔒 {t("songs.missing", { n: st.path.length })}</span>
            {/if}
          </span>
        </button>
      {/each}
    </div>
  {/each}
</div>

<style>
  .song {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
    text-align: left;
    border-left: 8px solid var(--c);
    min-height: 120px;
  }
  .title {
    font-size: 1.15rem;
  }
</style>

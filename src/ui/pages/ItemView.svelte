<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { onMount } from "svelte";
  import { backend, type LibraryItem } from "../../platform/bridge";
  import { nav } from "../../state/nav.svelte";
  import { t } from "../../i18n";
  import ScoreFile from "../ScoreFile.svelte";
  import AudioPlayer from "../AudioPlayer.svelte";

  let { id }: { id: string } = $props();
  let item = $state<LibraryItem | null>(null);
  onMount(async () => {
    item = (await backend.libraryList()).find((x) => x.id === id) ?? null;
  });
</script>

<div class="page">
  <button class="btn-ghost" onclick={() => nav.back()}>← {t("common.back")}</button>
  {#if item}
    <h1>{item.title}</h1>
    {#if item.kind === "audio"}
      <AudioPlayer {item} />
    {:else}
      <ScoreFile {item} />
    {/if}
  {:else}
    <p>{t("common.loading")}</p>
  {/if}
</div>

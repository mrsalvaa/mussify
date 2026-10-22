<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { onMount } from "svelte";
  import { backend, type SearchResult, type ToolInfo } from "../../platform/bridge";
  import { nav } from "../../state/nav.svelte";
  import { t } from "../../i18n";

  let allowed = $state(false);
  let tools = $state<ToolInfo | null>(null);
  let query = $state("");
  let results = $state<SearchResult[]>([]);
  let busy = $state(false);
  let msg = $state("");
  let confirmItem = $state<SearchResult | null>(null);
  let confirmSearch = $state(false);

  onMount(async () => {
    allowed = await backend.netSettings();
    tools = await backend.toolsInfo();
  });

  async function doSearch() {
    confirmSearch = false;
    busy = true;
    msg = "";
    try {
      results = await backend.ytSearch(query);
    } catch (e) {
      msg = String(e);
    } finally {
      busy = false;
    }
  }
  async function doDownload(r: SearchResult) {
    confirmItem = null;
    busy = true;
    msg = t("dl.downloading");
    try {
      const it = await backend.ytDownload(r.id, r.title);
      msg = t("dl.done");
      nav.go({ view: "item", id: it.id });
    } catch (e) {
      msg = String(e);
    } finally {
      busy = false;
    }
  }
  const fmt = (s: number | null) => (s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}` : "");
</script>

<div class="page">
  <button class="btn-ghost" onclick={() => nav.back()}>← {t("common.back")}</button>
  <h1>{t("dl.title")}</h1>
  <p class="muted small">⚠️ {t("lib.disclaimer")}</p>
  {#if tools && !tools.supported}
    <div class="card warn"><p>{tools.reason}</p><p>{t("dl.androidAlt")}</p></div>
  {:else if !allowed}
    <div class="card warn">
      <p>{t("dl.netOff")}</p>
      <button onclick={() => nav.go({ view: "settings" })}>⚙️ {t("nav.settings")}</button>
    </div>
  {:else}
    {#if tools && !tools.ytdlp}<div class="card warn"><p>No encontré yt-dlp en este sistema. Instalalo con <code>sudo pacman -S yt-dlp</code> o indicá su ruta en Ajustes.</p></div>{/if}
    <form class="row" onsubmit={(e) => { e.preventDefault(); if (query.trim()) confirmSearch = true; }}>
      <input type="search" class="grow" bind:value={query} placeholder={t("dl.query")} aria-label={t("dl.query")} />
      <button class="btn-blue" type="submit" disabled={busy || !query.trim()}>🔎</button>
    </form>
    {#if msg}<p>{msg}</p>{/if}
    <div class="list">
      {#each results as r (r.id)}
        <div class="card row">
          <div class="col grow left"><strong>{r.title}</strong><span class="muted small">{r.channel} · {fmt(r.duration)}</span></div>
          <button class="btn-primary btn-small" disabled={busy} onclick={() => (confirmItem = r)}>⬇️</button>
        </div>
      {/each}
    </div>
  {/if}

  {#if confirmSearch}
    <div class="modal" role="dialog" aria-modal="true" aria-label={t("dl.confirmTitle")}>
      <div class="card">
        <h2>{t("dl.confirmTitle")}</h2>
        <p class="pre">{t("dl.confirmSearch", { query })}</p>
        <div class="row"><button onclick={() => (confirmSearch = false)}>{t("common.cancel")}</button><button class="btn-primary" onclick={doSearch}>{t("common.continue")}</button></div>
      </div>
    </div>
  {/if}
  {#if confirmItem}
    <div class="modal" role="dialog" aria-modal="true" aria-label={t("dl.confirmTitle")}>
      <div class="card">
        <h2>{t("dl.confirmTitle")}</h2>
        <p class="pre">{t("dl.confirmBody", { title: confirmItem.title, url: confirmItem.url })}</p>
        <p class="small muted">{t("lib.disclaimer")}</p>
        <div class="row"><button onclick={() => (confirmItem = null)}>{t("common.cancel")}</button><button class="btn-primary" onclick={() => doDownload(confirmItem!)}>{t("common.continue")}</button></div>
      </div>
    </div>
  {/if}
</div>

<style>
  .warn {
    border-color: var(--orange);
  }
  .grow {
    flex: 1;
  }
  .left {
    align-items: flex-start;
    gap: 0;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  .modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: grid;
    place-items: center;
    padding: 1rem;
    z-index: 50;
  }
  .modal .card {
    max-width: 520px;
  }
  .pre {
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>

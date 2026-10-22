<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { onMount } from "svelte";
  import { backend, type LibraryItem } from "../../platform/bridge";
  import { detectKind } from "../../core/import";
  import { nav } from "../../state/nav.svelte";
  import { t } from "../../i18n";

  let items = $state<LibraryItem[]>([]);
  let error = $state("");
  let busy = $state(false);
  let input: HTMLInputElement;

  async function refresh() {
    items = await backend.libraryList();
  }
  onMount(refresh);

  async function onFiles(e: Event) {
    const files = (e.target as HTMLInputElement).files;
    if (!files) return;
    busy = true;
    error = "";
    try {
      for (const f of Array.from(files)) {
        const bytes = new Uint8Array(await f.arrayBuffer());
        const kind = detectKind(f.name, bytes.slice(0, 8));
        if (kind === "unknown") {
          error = t("lib.cannotRead", { error: f.name });
          continue;
        }
        const it = await backend.libraryAdd(f.name, kind, bytes);
        if (files.length === 1) nav.go({ view: "item", id: it.id });
      }
      await refresh();
    } catch (err) {
      error = String(err);
    } finally {
      busy = false;
      input.value = "";
    }
  }
  async function del(it: LibraryItem) {
    if (!confirm(t("lib.deleteConfirm", { title: it.title }))) return;
    await backend.libraryDelete(it.id);
    await refresh();
  }
  const icon = (k: string) => (k === "audio" ? "🎧" : k === "texttab" ? "🎸" : k === "guitarpro" ? "🎸" : "🎼");
</script>

<div class="page">
  <h1>{t("lib.title")}</h1>
  <div class="row">
    <button class="btn-primary" onclick={() => input.click()} disabled={busy}>⬆️ {t("lib.import")}</button>
    <button class="btn-blue" onclick={() => nav.go({ view: "download" })}>🔎 {t("lib.search")}</button>
    <input bind:this={input} type="file" multiple class="sr-only" onchange={onFiles}
      accept=".mid,.midi,.kar,.xml,.musicxml,.mxl,.gp,.gp3,.gp4,.gp5,.gpx,.gp7,.txt,.tab,.crd,.mp3,.ogg,.oga,.flac,.wav,.m4a,audio/*" />
  </div>
  <p class="muted small">{t("lib.importHint")}</p>
  <p class="muted small">⚠️ {t("lib.disclaimer")}</p>
  {#if error}<p class="err">{error}</p>{/if}
  {#if busy}<p>{t("common.loading")}</p>{/if}
  {#if !items.length}
    <p class="muted">{t("lib.empty")}</p>
  {:else}
    <div class="list">
      {#each items as it (it.id)}
        <div class="card item row">
          <button class="btn-ghost open" onclick={() => nav.go({ view: "item", id: it.id })}>
            <span class="ico">{icon(it.kind)}</span>
            <span class="col left">
              <strong>{it.title}</strong>
              <span class="muted small">{it.kind} · {(it.size / 1024 / 1024).toFixed(2)} MB {it.meta?.pending ? "· ⏳" : ""}</span>
            </span>
          </button>
          <button class="btn-small btn-ghost" onclick={() => del(it)} aria-label={t("common.delete")}>🗑️</button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  .item {
    padding: 0.4rem;
  }
  .open {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.7rem;
    text-align: left;
  }
  .left {
    align-items: flex-start;
    gap: 0;
  }
  .ico {
    font-size: 1.6rem;
  }
  .err {
    color: var(--bad);
  }
</style>

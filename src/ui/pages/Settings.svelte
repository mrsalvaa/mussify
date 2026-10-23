<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { onMount } from "svelte";
  import { prefs, savePrefs, changeLocale } from "../../state/prefs.svelte";
  import { loadProgress, resetLocalProgress } from "../../state/progress.svelte";
  import { backend, type NetEntry, type ToolInfo, type AudioStatus } from "../../platform/bridge";
  import { nav } from "../../state/nav.svelte";
  import { t, localizeError, LOCALE_NAMES, currentLocale } from "../../i18n";
  import { AVAILABLE_LOCALES } from "../../content";

  let netAllowed = $state(false);
  let log = $state<NetEntry[]>([]);
  let tools = $state<ToolInfo | null>(null);
  let audio = $state<AudioStatus | null>(null);
  let storage = $state<{ totalBytes: number; libraryBytes: number; items: number; dataDir: string } | null>(null);
  let password = $state("");
  let msg = $state("");
  let ytdlpPath = $state("");
  let fileInput: HTMLInputElement;

  onMount(async () => {
    netAllowed = await backend.netSettings();
    log = await backend.netLog();
    tools = await backend.toolsInfo();
    audio = await backend.status();
    storage = await backend.storageInfo();
    ytdlpPath = (await backend.kvGet("ytdlp.path")) ?? "";
  });

  async function toggleNet() {
    netAllowed = await backend.netSettings(!netAllowed);
  }
  async function clearLog() {
    log = await backend.netLog(true);
  }
  async function exportBackup() {
    msg = "";
    try {
      const bytes = await backend.backupExport(password || null);
      const d = new Date();
      const ok = await backend.saveFile(`mussify-respaldo-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.json`, bytes);
      if (ok) msg = t("settings.exported");
    } catch (e) {
      msg = localizeError(e);
    }
  }
  async function importBackup(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    msg = "";
    try {
      await backend.backupImport(new Uint8Array(await f.arrayBuffer()), password || null);
      await loadProgress();
      msg = t("settings.imported");
    } catch (err) {
      msg = localizeError(err);
    } finally {
      if (fileInput) fileInput.value = "";
    }
  }
  async function reset() {
    if (!confirm(t("settings.resetConfirm"))) return;
    await backend.resetProgress();
    resetLocalProgress();
    await backend.kvSet("prefs", JSON.stringify(prefs));
    msg = "✓";
  }
  async function saveYtdlp() {
    await backend.kvSet("ytdlp.path", ytdlpPath.trim());
    tools = await backend.toolsInfo();
  }
  const size = (b: number) => (b > 1e9 ? `${(b / 1e9).toFixed(2)} GB` : `${(b / 1e6).toFixed(1)} MB`);
</script>

<div class="page">
  <button class="btn-ghost" onclick={() => nav.back()}>← {t("common.back")}</button>
  <h1>{t("settings.title")}</h1>
  {#if msg}<p class="pill">{msg}</p>{/if}

  <section class="card col">
    <label class="col">{t("settings.notation")}
      <select bind:value={prefs.naming} onchange={savePrefs}>
        <option value="latin">{t("settings.notation.latin")}</option>
        <option value="english">{t("settings.notation.english")}</option>
        <option value="both">{t("settings.notation.both")}</option>
      </select>
    </label>
    <label class="col">{t("settings.theme")}
      <select bind:value={prefs.theme} onchange={savePrefs}>
        <option value="system">{t("settings.theme.system")}</option>
        <option value="light">{t("settings.theme.light")}</option>
        <option value="dark">{t("settings.theme.dark")}</option>
      </select>
    </label>
    <label class="col">{t("settings.uiScale")}: {Math.round(prefs.uiScale * 100)}%
      <input type="range" min="0.8" max="1.6" step="0.05" bind:value={prefs.uiScale} onchange={savePrefs} />
    </label>
    <label class="row"><input type="checkbox" bind:checked={prefs.highContrast} onchange={savePrefs} />{t("settings.contrast")}</label>
    <label class="row"><input type="checkbox" bind:checked={prefs.colorblind} onchange={savePrefs} />{t("settings.colorblind")}</label>
    <label class="col">{t("settings.language")}
      <select value={prefs.locale} onchange={(e) => changeLocale((e.target as HTMLSelectElement).value)}>{#each AVAILABLE_LOCALES as l (l)}<option value={l}>{LOCALE_NAMES[l] ?? l}</option>{/each}</select>
      <span class="small muted">{t("settings.languageHint")}</span>
    </label>
  </section>

  <h2>{t("settings.audio")}</h2>
  <section class="card col">
    {#if audio}<p class="small muted">{audio.ok ? t("settings.audioStatus", { device: audio.device, rate: audio.rate }) : t("settings.audioError", { error: audio.error ?? "" })}</p>{/if}
    <label class="col">{t("settings.a4")}: {prefs.a4} Hz
      <input type="range" min="415" max="466" step="1" bind:value={prefs.a4} onchange={savePrefs} />
    </label>
    <div class="row">{#each [432, 440, 442] as f (f)}<button class="btn-small {prefs.a4 === f ? 'btn-blue' : ''}" onclick={() => { prefs.a4 = f; savePrefs(); }}>{f} Hz</button>{/each}</div>
    <label class="col">{t("settings.volume")}: {Math.round(prefs.volume * 100)}%
      <input type="range" min="0" max="1.2" step="0.05" bind:value={prefs.volume} onchange={savePrefs} />
    </label>
  </section>

  <h2>{t("settings.learning")}</h2>
  <section class="card col">
    <label class="col">{t("settings.threshold")}: {Math.round(prefs.threshold * 100)}%
      <input type="range" min="0.6" max="1" step="0.05" bind:value={prefs.threshold} onchange={savePrefs} />
    </label>
    <label class="col">{t("settings.sessionLength")}: {prefs.sessionLength}
      <input type="range" min="5" max="20" step="1" bind:value={prefs.sessionLength} onchange={savePrefs} />
    </label>
    <label class="col">{t("settings.weeklyGoal")}: {prefs.weeklyGoal}
      <input type="range" min="1" max="21" step="1" bind:value={prefs.weeklyGoal} onchange={savePrefs} />
    </label>
    <label class="row"><input type="checkbox" bind:checked={prefs.leftHanded} onchange={savePrefs} />{t("settings.leftHanded")}</label>
    <label class="row"><input type="checkbox" bind:checked={prefs.bass5} onchange={savePrefs} />{t("settings.bass5")}</label>
  </section>

  <h2>{t("settings.network")}</h2>
  <section class="card col">
    <label class="row big-toggle"><input type="checkbox" checked={netAllowed} onchange={toggleNet} /> <strong>{t("settings.networkAllow")}</strong></label>
    <p class="small muted">{t("settings.networkDesc")}</p>
    <h3>{t("settings.networkLog")}</h3>
    {#if !log.length}<p class="muted small">{t("settings.networkLogEmpty")}</p>{/if}
    <ul class="log">
      {#each log as e (e.id)}
        <li><span class="muted">{new Date(e.ts).toLocaleString(currentLocale())}</span> · <strong>{e.destination}</strong> · {e.reason.includes("|") ? t(`netlog.${e.reason.split("|")[0]}`, { q: e.reason.slice(e.reason.indexOf("|") + 1) }) : e.reason} {e.ok ? "✓" : "✗"}</li>
      {/each}
    </ul>
    {#if log.length}<button class="btn-small" onclick={clearLog}>{t("settings.networkClear")}</button>{/if}
    <h3>{t("settings.tools")}</h3>
    {#if tools}
      {#if tools.supported}
        <p class="small">yt-dlp: {tools.ytdlp ? `${tools.ytdlp} (${tools.ytdlpVersion ?? "?"})` : "—"} · ffmpeg: {tools.ffmpeg ? "✓" : "—"}</p>
        <label class="col small">{t("settings.ytdlpPath")}<input type="text" bind:value={ytdlpPath} onchange={saveYtdlp} placeholder="/usr/bin/yt-dlp" /></label>
      {:else}
        <p class="small muted">{localizeError(tools.reason)}</p>
      {/if}
    {/if}
  </section>

  <h2>{t("settings.backup")}</h2>
  <section class="card col">
    <label class="col">{t("settings.password")}<input type="password" bind:value={password} autocomplete="new-password" /></label>
    <div class="row">
      <button class="btn-blue" onclick={exportBackup}>{t("settings.export")}</button>
      <button onclick={() => fileInput.click()}>{t("settings.import")}</button>
      <input bind:this={fileInput} type="file" accept=".json,application/json" class="sr-only" onchange={importBackup} />
    </div>
  </section>

  <h2>{t("settings.storage")}</h2>
  <section class="card col">
    {#if storage}<p>{t("settings.storageUsed", { size: size(storage.totalBytes), items: storage.items })}</p><p class="small muted">{storage.dataDir}</p>{/if}
    <button onclick={() => nav.go({ view: "library" })}>{t("lib.title")}</button>
    <button class="btn-danger" onclick={reset}>{t("settings.reset")}</button>
  </section>

  <h2>{t("settings.about")}</h2>
  <section class="card"><p>{t("settings.aboutText")}</p><p class="small muted">Mussify 0.6.0 · GPL-3.0-or-later</p></section>
</div>

<style>
  section {
    margin-bottom: 0.6rem;
  }
  .log {
    font-size: 0.85rem;
    max-height: 240px;
    overflow: auto;
  }
  .big-toggle input {
    width: 28px;
    height: 28px;
  }
</style>

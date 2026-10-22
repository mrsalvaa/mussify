<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { backend, type LibraryItem } from "../platform/bridge";
  import { importScore, analyzeImport, melodyOnly, knownChordsOnly, type ImportReport } from "../core/import";
  import type { Score } from "../core/notation/score";
  import { scoreToSequence, type CursorMark } from "../core/notation/playback";
  import { cur } from "../state/curriculum";
  import { progress } from "../state/progress.svelte";
  import { lessonContent } from "../content";
  import { playSeq, stopSeq, CH } from "../platform/audio";
  import { t } from "../i18n";
  import ScoreView from "./ScoreView.svelte";
  import { nav } from "../state/nav.svelte";

  let { item }: { item: LibraryItem } = $props();
  const known = new Set(Object.keys(progress.mastered));
  let score = $state<Score | null>(null);
  let report = $state<ImportReport | null>(null);
  let error = $state("");
  let view = $state<"ask" | "full" | "melody" | "known">("ask");
  let tempoPct = $state(100);
  let loopFrom = $state<number | null>(null);
  let loopTo = $state<number | null>(null);
  let playing = $state(false);
  let cursor = $state<CursorMark | null>(null);
  let hidden = $state<Set<string>>(new Set());

  onMount(async () => {
    try {
      const bytes = await backend.libraryRead(item.id);
      score = importScore(item.meta.originalName ? String(item.meta.originalName) : item.file, bytes).score;
      report = analyzeImport(score, known);
      view = report.allKnown ? "full" : item.meta.view ? (item.meta.view as typeof view) : "ask";
    } catch (e) {
      error = t("lib.cannotRead", { error: String(e) });
    }
  });
  onDestroy(() => void stopSeq(CH.score));

  const shown = $derived.by(() => {
    if (!score) return null;
    let s: Score = { ...score, staves: score.staves.filter((st) => !hidden.has(st.id)) };
    if (!s.staves.length) s = score;
    if (view === "melody") s = melodyOnly(s);
    if (view === "known") s = knownChordsOnly(s, known);
    return s;
  });
  const dim = $derived(view === "known" && report && shown ? [...new Set(shown.staves.flatMap((st) => report!.unknownMeasures[st.id] ?? []))] : []);
  const loopMeasures = $derived(loopFrom !== null ? Array.from({ length: (loopTo ?? loopFrom) - loopFrom + 1 }, (_, i) => loopFrom! + i) : []);

  async function setView(v: typeof view) {
    view = v;
    await backend.libraryUpdate(item.id, undefined, { ...item.meta, view: v, pending: false });
  }
  async function pending() {
    await backend.libraryUpdate(item.id, undefined, { ...item.meta, pending: true });
    nav.back();
  }
  function measureClick(i: number) {
    if (loopFrom === null || (loopTo !== null && loopTo !== loopFrom)) {
      loopFrom = i;
      loopTo = i;
    } else if (i >= loopFrom) loopTo = i;
    else {
      loopTo = loopFrom;
      loopFrom = i;
    }
  }
  function play() {
    if (!shown) return;
    const tempo = (shown.tempo * tempoPct) / 100;
    const seq = scoreToSequence(shown, { tempo, fromMeasure: loopFrom ?? undefined, toMeasure: loopTo ?? undefined });
    const loopOn = loopFrom !== null;
    // Repetir el loop varias veces
    const reps = loopOn ? 8 : 1;
    const events = [];
    const cursorAll: CursorMark[] = [];
    for (let r = 0; r < reps; r++) {
      for (const e of seq.events) events.push({ ...e, time: e.time + r * seq.duration });
      for (const c of seq.cursor) cursorAll.push({ ...c, time: c.time + r * seq.duration });
    }
    playing = true;
    void playSeq({ ...seq, events, cursor: cursorAll, duration: seq.duration * reps }, CH.score, (tm) => {
      let c: CursorMark | null = null;
      for (const m of cursorAll) if (m.time <= tm) c = m;
      cursor = c;
    }, () => {
      playing = false;
      cursor = null;
    });
  }
  function stop() {
    playing = false;
    cursor = null;
    void stopSeq(CH.score);
  }
</script>

{#if error}
  <p class="err">{error}</p>
{:else if !score || !report}
  <p>{t("common.loading")}</p>
{:else}
  {#if !report.allKnown}
    <div class="card warn">
      <p><strong>{t("lib.unknownContent")}</strong></p>
      <p class="small">{t("lib.missingList")}
        {#each report.missing.slice(0, 12) as r, i (i)}
          {@const lid = r.anyOf.find((c) => cur.byConcept.has(c))}
          <span class="pill">{lid && cur.isUnlocked(lid, known) ? lessonContent(lid)?.title : "—"}</span>
        {/each}
        {#if report.unknownChords.length}<span class="pill">{t("lib.unknownChords", { n: report.unknownChords.length })}</span>{/if}
      </p>
      <div class="row">
        <button class={view === "melody" ? "btn-blue" : ""} onclick={() => setView("melody")}>{t("lib.viewMelody")}</button>
        <button class={view === "known" ? "btn-blue" : ""} onclick={() => setView("known")}>{t("lib.viewKnown")}</button>
        <button class={view === "full" ? "btn-blue" : ""} onclick={() => setView("full")}>{t("lib.viewFull")}</button>
        <button onclick={pending}>{t("lib.pending")}</button>
      </div>
    </div>
  {:else}
    <p class="pill ok">✓ {t("lib.allKnown")}</p>
  {/if}

  {#if view !== "ask" && shown}
    {#if score.staves.length > 1}
      <div class="row small">
        {t("lib.staff")}:
        {#each score.staves as st (st.id)}
          <label class="row"><input type="checkbox" checked={!hidden.has(st.id)} onchange={() => { const n = new Set(hidden); if (n.has(st.id)) n.delete(st.id); else n.add(st.id); hidden = n; }} /> {st.name || st.instrument}</label>
        {/each}
      </div>
    {/if}
    <div class="card controls">
      <div class="row">
        {#if !playing}<button class="btn-primary" onclick={play}>▶ {t("common.play")}</button>{:else}<button onclick={stop}>■ {t("common.stop")}</button>{/if}
        <label class="col grow small">{t("lib.tempo")}: {Math.round((shown.tempo * tempoPct) / 100)} BPM ({tempoPct}%)
          <input type="range" min="25" max="150" step="5" bind:value={tempoPct} />
        </label>
      </div>
      <div class="row small">
        {t("lib.loopSection")}: {loopFrom !== null ? `${loopFrom + 1}–${(loopTo ?? loopFrom) + 1}` : "—"}
        {#if loopFrom !== null}<button class="btn-small" onclick={() => { loopFrom = null; loopTo = null; }}>{t("player.loopClear")}</button>{/if}
        <span class="muted">{t("lib.loopHint")}</span>
      </div>
    </div>
    <div class="card">
      <ScoreView score={shown} sp={9} highlightMeasures={loopMeasures} dimMeasures={dim} measureNumbers onmeasure={measureClick} cursor={cursor ? { staff: cursor.staff, measure: cursor.measure, event: cursor.event } : null} />
    </div>
  {/if}
{/if}

<style>
  .warn {
    border-color: var(--orange);
    margin-bottom: 1rem;
  }
  .controls {
    margin: 0.8rem 0;
  }
  .grow {
    flex: 1;
    min-width: 200px;
  }
  .err {
    color: var(--bad);
  }
</style>

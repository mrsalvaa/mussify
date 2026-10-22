<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { backend, type LibraryItem, type EqSettings } from "../platform/bridge";
  import { parseChord } from "../core/theory/chord";
  import { chordLabelOk } from "../core/curriculum/audit";
  import { timeSigConcept } from "../core/curriculum/extract";
  import { progress } from "../state/progress.svelte";
  import { prefs } from "../state/prefs.svelte";
  import { formatLabel, t } from "../i18n";

  interface Analysis {
    tempo: number;
    meter: number;
    keyName: string;
    keyMode: string;
    chords: { start: number; end: number; chord: string; confidence: number }[];
    sections: { start: number; end: number; label: string; name: string }[];
  }
  interface Marker {
    time: number;
    name: string;
  }
  interface Note {
    time: number;
    text: string;
  }

  let { item }: { item: LibraryItem } = $props();
  const known = new Set(Object.keys(progress.mastered));
  let duration = $state(0);
  let peaks = $state<number[]>([]);
  let pos = $state(0);
  let playing = $state(false);
  let speed = $state(1);
  let loopA = $state<number | null>(null);
  let loopB = $state<number | null>(null);
  let eq = $state<EqSettings>({ lowDb: 0, midDb: 0, highDb: 0, isolate: "off" });
  let error = $state("");
  let meta = $state<Record<string, unknown>>({ ...item.meta });
  let markers = $state<Marker[]>((item.meta.markers as Marker[]) ?? []);
  let notes = $state<Note[]>((item.meta.notes as Note[]) ?? []);
  let analysis = $state<Analysis | null>((item.meta.corrected as Analysis) ?? (item.meta.analysis as Analysis) ?? null);
  let analyzing = $state(false);
  let noteText = $state("");
  let canvas: HTMLCanvasElement;
  let timer: ReturnType<typeof setInterval> | undefined;

  onMount(async () => {
    try {
      const info = await backend.playerLoad(item.id);
      duration = info.duration;
      peaks = info.peaks;
      draw();
      timer = setInterval(async () => {
        const st = await backend.status();
        if (st.player) {
          pos = st.player[0];
          playing = st.player[2];
          draw();
        }
      }, 80);
    } catch (e) {
      error = String(e);
    }
  });
  onDestroy(() => {
    clearInterval(timer);
    void backend.playerControl({ play: false });
  });

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  function draw() {
    if (!canvas || !peaks.length) return;
    const ctx = canvas.getContext("2d")!;
    const w = (canvas.width = canvas.clientWidth * devicePixelRatio);
    const h = (canvas.height = 120 * devicePixelRatio);
    ctx.clearRect(0, 0, w, h);
    const css = getComputedStyle(document.documentElement);
    if (loopA !== null && loopB !== null) {
      ctx.fillStyle = "rgba(28,176,246,0.18)";
      ctx.fillRect((loopA / duration) * w, 0, ((loopB - loopA) / duration) * w, h);
    }
    if (analysis) {
      for (const s of analysis.sections) {
        ctx.fillStyle = "rgba(206,130,255,0.25)";
        ctx.fillRect((s.start / duration) * w, h - 8 * devicePixelRatio, 2, 8 * devicePixelRatio);
      }
    }
    const max = Math.max(...peaks, 0.001);
    const bw = w / peaks.length;
    peaks.forEach((p, i) => {
      const x = i * bw;
      const ph = (p / max) * (h * 0.85);
      ctx.fillStyle = x / w <= pos / duration ? css.getPropertyValue("--green").trim() || "#58cc02" : css.getPropertyValue("--dim").trim() || "#bbb";
      ctx.fillRect(x, (h - ph) / 2, Math.max(1, bw - 0.5), ph);
    });
    for (const m of markers) {
      ctx.fillStyle = "#ff9600";
      ctx.fillRect((m.time / duration) * w, 0, 2 * devicePixelRatio, h);
    }
  }

  function seekClick(e: MouseEvent) {
    const r = canvas.getBoundingClientRect();
    const tm = ((e.clientX - r.left) / r.width) * duration;
    void backend.playerControl({ seek: tm });
    pos = tm;
    draw();
  }
  function toggle() {
    playing = !playing;
    void backend.playerControl({ play: playing });
  }
  function setSpeed(v: number) {
    speed = v;
    void backend.playerControl({ speed: v });
  }
  function setLoop() {
    void backend.playerControl({ loopAb: loopA !== null && loopB !== null && loopB > loopA ? [loopA, loopB] : null });
    draw();
  }
  function markA() {
    loopA = pos;
    if (loopB !== null && loopB <= loopA) loopB = null;
    setLoop();
  }
  function markB() {
    if (loopA === null) loopA = 0;
    loopB = Math.max(pos, (loopA ?? 0) + 0.2);
    setLoop();
    void backend.playerControl({ seek: loopA });
  }
  function clearLoop() {
    loopA = loopB = null;
    setLoop();
  }
  function setEq() {
    void backend.playerControl({ eq: { ...eq } });
  }
  async function saveMeta(extra: Record<string, unknown>) {
    meta = { ...meta, ...extra };
    await backend.libraryUpdate(item.id, undefined, meta);
  }
  function addMarker() {
    const name = prompt(t("player.addMarker"), t("player.markerDefault", { n: markers.length + 1 }));
    if (!name) return;
    markers = [...markers, { time: pos, name }].sort((a, b) => a.time - b.time);
    void saveMeta({ markers });
    draw();
  }
  function addNote() {
    if (!noteText.trim()) return;
    notes = [...notes, { time: pos, text: noteText.trim() }].sort((a, b) => a.time - b.time);
    noteText = "";
    void saveMeta({ notes });
  }
  async function analyze() {
    analyzing = true;
    error = "";
    try {
      analysis = (await backend.analyze(item.id, prefs.a4)) as unknown as Analysis;
      meta = { ...meta, analysis };
      draw();
    } catch (e) {
      error = String(e);
    } finally {
      analyzing = false;
    }
  }
  function chordShown(sym: string): string {
    if (sym === "N") return "—";
    const c = parseChord(sym);
    return c && chordLabelOk(c, known) ? formatLabel({ kind: "chord", chord: c }) : "•";
  }
  function editChord(i: number) {
    if (!analysis) return;
    const v = prompt(t("player.edit"), analysis.chords[i].chord);
    if (v === null) return;
    if (v.trim() !== "N" && !parseChord(v.trim())) return alert(t("lib.cannotRead", { error: v }));
    const chords = analysis.chords.map((c, j) => (j === i ? { ...c, chord: v.trim(), confidence: 1 } : c));
    analysis = { ...analysis, chords };
    void saveMeta({ corrected: analysis });
  }
  function editSection(i: number) {
    if (!analysis) return;
    const v = prompt(t("player.edit"), analysis.sections[i].name);
    if (!v) return;
    analysis = { ...analysis, sections: analysis.sections.map((s, j) => (j === i ? { ...s, name: v } : s)) };
    void saveMeta({ corrected: analysis });
  }
  function editTempo() {
    if (!analysis) return;
    const v = Number(prompt(t("player.edit"), String(analysis.tempo)));
    if (!v || v < 20 || v > 320) return;
    analysis = { ...analysis, tempo: v };
    void saveMeta({ corrected: analysis });
  }
  const showKey = $derived(known.has("t.key"));
  const showTempo = $derived(known.has("t.tempo"));
  const showMeter = $derived(analysis ? known.has(timeSigConcept(analysis.meter, 4)) : false);
  const unknownChordCount = $derived(analysis ? analysis.chords.filter((c) => c.chord !== "N" && chordShown(c.chord) === "•").length : 0);
</script>

{#if error}<p class="err">{error}</p>{/if}
<div class="card">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <canvas bind:this={canvas} class="wave" onclick={seekClick} aria-label={t("player.waveform")}></canvas>
  <div class="row">
    <button class="btn-primary" onclick={toggle} disabled={!duration}>{playing ? "⏸" : "▶"}</button>
    <span class="time">{fmt(pos)} / {fmt(duration)}</span>
    <span class="spacer"></span>
    <button class="btn-small" onclick={markA}>{t("player.loopA")}</button>
    <button class="btn-small" onclick={markB}>{t("player.loopB")}</button>
    {#if loopA !== null}<button class="btn-small" onclick={clearLoop}>{t("player.loopClear")}</button>{/if}
  </div>
  {#if loopA !== null}<p class="small muted">{t("player.loop", { a: fmt(loopA), b: loopB !== null ? fmt(loopB) : "…" })}</p>{/if}
  <label class="col small">{t("player.speed")}: {Math.round(speed * 100)}%
    <input type="range" min="0.25" max="1.5" step="0.05" value={speed} oninput={(e) => setSpeed(Number((e.target as HTMLInputElement).value))} />
  </label>
  <div class="row">{#each [0.5, 0.75, 0.9, 1] as v (v)}<button class="btn-small {speed === v ? 'btn-blue' : ''}" onclick={() => setSpeed(v)}>{v * 100}%</button>{/each}</div>
</div>

<details class="card">
  <summary><strong>{t("player.eq")}</strong></summary>
  <div class="eq">
    <label class="col small">{t("player.low")} {eq.lowDb} dB<input type="range" min="-18" max="12" bind:value={eq.lowDb} onchange={setEq} /></label>
    <label class="col small">{t("player.mid")} {eq.midDb} dB<input type="range" min="-18" max="12" bind:value={eq.midDb} onchange={setEq} /></label>
    <label class="col small">{t("player.high")} {eq.highDb} dB<input type="range" min="-18" max="12" bind:value={eq.highDb} onchange={setEq} /></label>
  </div>
  <div class="row small">
    {t("player.isolate")}:
    {#each ["off", "bass", "mids", "treble"] as const as m (m)}
      <button class="btn-small {eq.isolate === m ? 'btn-blue' : ''}" onclick={() => { eq.isolate = m; setEq(); }}>{t(`player.isolate.${m}`)}</button>
    {/each}
  </div>
</details>

<div class="card">
  <div class="row"><strong>{t("player.markers")}</strong><span class="spacer"></span><button class="btn-small" onclick={addMarker}>＋ {t("player.addMarker")}</button></div>
  {#each markers as m, i (i)}
    <div class="row small">
      <button class="btn-small btn-ghost" onclick={() => backend.playerControl({ seek: m.time })}>⏩ {fmt(m.time)}</button>
      <span>{m.name}</span><span class="spacer"></span>
      <button class="btn-small btn-ghost" onclick={() => { loopA = m.time; loopB = markers[i + 1]?.time ?? duration; setLoop(); }}>🔁</button>
      <button class="btn-small btn-ghost" onclick={() => { markers = markers.filter((_, j) => j !== i); void saveMeta({ markers }); draw(); }}>✕</button>
    </div>
  {/each}
  <div class="row" style="margin-top:0.6rem"><strong>{t("player.notes")}</strong></div>
  {#each notes as n, i (i)}
    <div class="row small"><button class="btn-small btn-ghost" onclick={() => backend.playerControl({ seek: n.time })}>{fmt(n.time)}</button><span>{n.text}</span><span class="spacer"></span><button class="btn-small btn-ghost" onclick={() => { notes = notes.filter((_, j) => j !== i); void saveMeta({ notes }); }}>✕</button></div>
  {/each}
  <div class="row"><input type="text" class="grow" bind:value={noteText} placeholder={t("player.addNote", { time: fmt(pos) })} onkeydown={(e) => e.key === "Enter" && addNote()} /><button class="btn-small" onclick={addNote}>＋</button></div>
</div>

<div class="card">
  <div class="row"><strong>{t("player.analyze")}</strong><span class="spacer"></span><button class="btn-blue btn-small" onclick={analyze} disabled={analyzing || !duration}>{analyzing ? "…" : "🔍"}</button></div>
  {#if analyzing}<p class="muted">{t("player.analyzing")}</p>{/if}
  {#if analysis}
    <p class="small muted">ℹ️ {t("player.estimate")}</p>
    <div class="facts">
      <div><span class="muted small">{t("player.tempo")}</span><button class="btn-small btn-ghost" onclick={editTempo}>{showTempo ? `${analysis.tempo} BPM ✎` : "🔒"}</button></div>
      <div><span class="muted small">{t("player.meter")}</span><strong>{showMeter ? `${analysis.meter}/4` : "🔒"}</strong></div>
      <div><span class="muted small">{t("player.key")}</span><strong>{showKey ? chordShown(analysis.keyName) : "🔒"}</strong></div>
    </div>
    <h3>{t("player.sections")}</h3>
    <div class="row">
      {#each analysis.sections as s, i (i)}
        <button class="btn-small" onclick={() => backend.playerControl({ seek: s.start })} ondblclick={() => editSection(i)} title={t("player.edit")}>{s.label} · {s.name} ({fmt(s.start)})</button>
        <button class="btn-small btn-ghost" onclick={() => editSection(i)} aria-label={t("player.edit")}>✎</button>
      {/each}
    </div>
    <h3>{t("player.chords")}</h3>
    {#if unknownChordCount}<p class="small muted">⚠️ {t("lib.unknownChords", { n: unknownChordCount })}</p>{/if}
    <div class="chords">
      {#each analysis.chords as c, i (i)}
        <button class="chip {pos >= c.start && pos < c.end ? 'now' : ''}" onclick={() => backend.playerControl({ seek: c.start })} ondblclick={() => editChord(i)} title="{fmt(c.start)} · {t('player.edit')}">{chordShown(c.chord)}</button>
      {/each}
    </div>
    <p class="small muted">{t("player.editHint")}</p>
  {/if}
</div>

<style>
  .wave {
    width: 100%;
    height: 120px;
    cursor: pointer;
    display: block;
    margin-bottom: 0.6rem;
  }
  .time {
    font-variant-numeric: tabular-nums;
  }
  .card {
    margin-bottom: 0.8rem;
  }
  .eq {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.8rem;
    margin: 0.6rem 0;
  }
  .facts {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.6rem;
  }
  .facts div {
    display: flex;
    flex-direction: column;
  }
  .chords {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }
  .chip {
    min-height: 40px;
    padding: 0.2em 0.6em;
  }
  .chip.now {
    background: var(--green);
    color: #fff;
    border-color: var(--green-dark);
  }
  .grow {
    flex: 1;
  }
  .err {
    color: var(--bad);
  }
</style>

<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { exampleSongs, lessonContent } from "../../content";
  import { songStatus, songExercises, canShow } from "../../core/songs/song";
  import { parseChord } from "../../core/theory/chord";
  import { chordLabelOk } from "../../core/curriculum/audit";
  import { timeSigConcept } from "../../core/curriculum/extract";
  import { chordsSequence } from "../../core/notation/playback";
  import { chordVoicing } from "../../core/theory/chord";
  import { fromMidi, chroma } from "../../core/theory/pitch";
  import { cur } from "../../state/curriculum";
  import { progress, finishReview } from "../../state/progress.svelte";
  import { nav } from "../../state/nav.svelte";
  import { formatLabel, t } from "../../i18n";
  import PlayButton from "../PlayButton.svelte";
  import { textAllowed } from "../../content/terms";
  import SessionRunner, { type SessionResult } from "../SessionRunner.svelte";

  let { id }: { id: string } = $props();
  const song = exampleSongs().find((s) => s.id === id)!;
  const known = $derived(new Set(Object.keys(progress.mastered)));
  const st = $derived(songStatus(cur, song, known));
  let practicing = $state(false);
  let exercises = $state<ReturnType<typeof songExercises>>([]);
  function startPractice() {
    exercises = songExercises(song, new Set(known), Date.now() % 100000);
    practicing = true;
  }

  function chordText(sym: string): string | null {
    const c = parseChord(sym);
    if (!c || !chordLabelOk(c, known)) return null;
    return formatLabel({ kind: "chord", chord: c });
  }
  function sectionAudio(chords: string[]) {
    const cs = chords.map((c) => parseChord(c)!).filter(Boolean);
    return chordsSequence(cs.map((c) => [fromMidi(48 + chroma(c.bass ?? c.root)), ...chordVoicing({ root: c.root, quality: c.quality }, 4)]), { length: (60 / song.tempo) * 4 * 0.5, instrument: song.instrument === "guitar" ? "guitar" : "piano" });
  }
  function finish(r: SessionResult[]) {
    finishReview(r.map((x) => ({ targets: x.exercise.targets, correct: x.correct })), "song");
    practicing = false;
  }
</script>

<div class="page">
  {#if practicing}
    <SessionRunner {exercises} {known} onfinish={finish} onquit={() => (practicing = false)} />
  {:else}
    <button class="btn-ghost" onclick={() => nav.back()}>← {t("common.back")}</button>
    <h1>{song.title}</h1>
    <p class="muted">{song.artist} · {song.year} · {t(`branch.${song.instrument}`)} · {t("songs.level", { n: song.level })}</p>
    <p class="muted small">{t("songs.disclaimer")}</p>

    <div class="card facts">
      <div><span class="muted small">{t("songs.key")}</span><strong>{canShow(song.keyConcepts, known) ? song.key : "—"}</strong></div>
      <div><span class="muted small">{t("songs.tempo")}</span><strong>{known.has("t.tempo") ? `${song.tempo} BPM` : "—"}</strong></div>
      <div>
        <span class="muted small">{t("songs.timeSig")}</span>
        <strong>{known.has(timeSigConcept(...(song.timeSig.split("/").map(Number) as [number, number]))) ? song.timeSig : "—"}</strong>
      </div>
    </div>

    <h2>{t("songs.structure")}</h2>
    <div class="row">{#each song.structure as s, i (i)}<span class="pill">{s}</span>{/each}</div>

    <h2>{t("songs.sections")}</h2>
    {#each st.sections as sec (sec.section.id)}
      <div class="card section {sec.available ? '' : 'locked'}">
        <div class="row">
          <strong>{sec.section.name}</strong>
          <span class="spacer"></span>
          {#if sec.available}<span class="pill ok">✓</span>{:else}<span class="pill">{t("songs.hidden")}</span>{/if}
        </div>
        {#if sec.available}
          {#if sec.section.chords.length}
            <div class="chords">
              {#each sec.section.chords as c, i (i)}
                {@const txt = chordText(c)}
                <span class="chip {txt ? '' : 'dim'}">{txt ?? "•"}</span>
              {/each}
            </div>
            {#if sec.section.roman && known.has("h.roman")}<p class="muted small">{sec.section.roman}</p>{/if}
            <PlayButton seq={sectionAudio(sec.section.chords)} />
          {/if}
          {#if sec.section.notes}<p>{textAllowed(sec.section.notes, known) ? sec.section.notes : t("songs.hidden")}</p>{/if}
        {/if}
      </div>
    {/each}

    {#if !st.available}
      <div class="card path">
        <p><strong>{t("songs.missing", { n: st.path.length })}</strong></p>
        <ol>
          {#each st.path.slice(0, 8) as lid (lid)}
            {@const l = cur.byConcept.get(lid)!}
            <li>
              {#if cur.isUnlocked(lid, known)}
                <button class="btn-small btn-blue" onclick={() => nav.go({ view: "lesson", id: lid })}>{lessonContent(lid)?.title ?? lid}</button>
              {:else}
                <span class="muted">{t(`branch.${l.branch}`)} · {t("map.lockedLesson")}</span>
              {/if}
            </li>
          {/each}
          {#if st.path.length > 8}<li class="muted">… +{st.path.length - 8}</li>{/if}
        </ol>
      </div>
    {/if}

    {#if st.sections.some((s) => s.available)}
      <h2>{t("songs.riff")}</h2>
      <p>{textAllowed(song.riff, known) ? song.riff : t("songs.hidden")}</p>
      {#if song.scales.some((s) => known.has(s.concept))}
        <h3>{t("songs.scales")}</h3>
        <div class="row">{#each song.scales.filter((s) => known.has(s.concept)) as s (s.name)}<span class="pill">{s.name}</span>{/each}</div>
      {/if}
    {/if}

    <h2>{t("songs.theory")}</h2>
    <ul class="theory">
      {#each song.theory as th (th.concept)}
        <li>
          {#if known.has(th.concept)}
            <button class="btn-small" onclick={() => nav.go({ view: "lesson", id: th.concept })}>{lessonContent(th.concept)?.title}</button>
            {#if textAllowed(th.why, known)}<span>{th.why}</span>{/if}
          {:else}
            <span class="muted">{t("map.lockedLesson")}</span>
          {/if}
        </li>
      {/each}
    </ul>

    {#if song.curiosity && textAllowed(song.curiosity, known)}
      <h2>{t("songs.curiosity")}</h2>
      <p class="tip">{song.curiosity}</p>
    {/if}

    {#if st.sections.some((s) => s.available)}
      <button class="btn-primary wide" onclick={startPractice}>{t("songs.practice")}</button>
    {/if}
  {/if}
</div>

<style>
  .facts {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.6rem;
  }
  .facts div {
    display: flex;
    flex-direction: column;
  }
  .section {
    margin: 0.6rem 0;
  }
  .section.locked {
    opacity: 0.7;
  }
  .chords {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin: 0.6rem 0;
  }
  .chip {
    font-family: var(--serif);
    font-weight: 600;
    font-size: 1.1rem;
    padding: 0.15em 0.6em;
    border-radius: var(--radius);
    border: 1px solid var(--rule);
    background: var(--card);
  }
  .chip.dim {
    color: var(--muted);
  }
  .path ol {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .theory {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-left: 1rem;
  }
</style>

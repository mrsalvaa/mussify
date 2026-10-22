<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { progress } from "../../state/progress.svelte";
  import { prefs } from "../../state/prefs.svelte";
  import { nav } from "../../state/nav.svelte";
  import { t, formatLabel } from "../../i18n";
  import { knownScales, knownQualities, nameablePcs } from "../../core/curriculum/gen/common";
  import { scalePcs, type ScaleType } from "../../core/theory/scale";
  import { chordPcs, type ChordQuality } from "../../core/theory/chord";
  import { chroma, midi, pc, type PitchClass } from "../../core/theory/pitch";
  import { GUITAR_TUNINGS, BASS_TUNINGS, GUITAR_OPEN_SHAPES, GUITAR_MOVABLE_SHAPES, placeMovable } from "../../core/instruments/fretted";
  import { GROOVES, grooveScore } from "../../core/curriculum/gen";
  import { scoreToSequence } from "../../core/notation/playback";
  import { scoreRequirements, missing } from "../../core/curriculum/extract";
  import Keyboard from "../Keyboard.svelte";
  import Fretboard from "../Fretboard.svelte";
  import ChordDiagram from "../ChordDiagram.svelte";
  import DrumPads from "../DrumPads.svelte";
  import ScoreView from "../ScoreView.svelte";
  import PlayButton from "../PlayButton.svelte";

  const known = $derived(new Set(Object.keys(progress.mastered)));
  let tab = $state<"piano" | "guitar" | "bass" | "drums">("piano");
  let octaves = $state(2);
  let tuningId = $state("standard");
  let showNames = $state(false);
  let scale = $state<ScaleType | "">("");
  let quality = $state<ChordQuality | "">("");
  let rootKey = $state("0:0");
  const root = $derived(pc(Number(rootKey.split(":")[0]), Number(rootKey.split(":")[1])));

  const scales = $derived(knownScales(known));
  const qualities = $derived(knownQualities(known));
  const roots = $derived(nameablePcs(known));
  const overlayPcs = $derived.by((): PitchClass[] => {
    if (scale) return scalePcs(root, scale);
    if (quality) return chordPcs({ root, quality });
    return [];
  });
  const kbFrom = 48;
  const kbTo = $derived(kbFrom + octaves * 12);
  const kbMarks = $derived.by(() => {
    const out: { midi: number; role: "target" | "root" }[] = [];
    if (!overlayPcs.length) return out;
    const set = new Set(overlayPcs.map((p) => chroma(p)));
    for (let m = kbFrom; m <= kbTo; m++) if (set.has(m % 12)) out.push({ midi: m, role: m % 12 === chroma(root) ? "root" : "target" });
    return out;
  });
  const tunings = $derived(tab === "bass" ? BASS_TUNINGS.filter((tt) => (prefs.bass5 ? true : tt.strings.length === 4)) : GUITAR_TUNINGS);
  const tuning = $derived(tunings.find((tt) => tt.id === tuningId) ?? tunings[0]);
  const fbMarks = $derived.by(() => {
    const out: { string: number; fret: number; role: "target" | "root" }[] = [];
    if (!overlayPcs.length) return out;
    const set = new Set(overlayPcs.map((p) => chroma(p)));
    tuning.strings.forEach((open, i) => {
      for (let f = 0; f <= 12; f++) {
        const c = (midi(open) + f) % 12;
        if (set.has(c)) out.push({ string: i + 1, fret: f, role: c === chroma(root) ? "root" : "target" });
      }
    });
    return out;
  });
  const shapes = $derived([
    ...GUITAR_OPEN_SHAPES.filter((s) => known.has(s.concept)),
    ...GUITAR_MOVABLE_SHAPES.filter((m) => known.has(m.concept)).map((m) => placeMovable(m, root)).filter((s): s is NonNullable<typeof s> => !!s),
  ]);
  const grooves = $derived(GROOVES.filter((g) => missing(scoreRequirements(grooveScore(g)), known).length === 0 && known.has(g.concept)));
</script>

<div class="page">
  <button class="btn-ghost" onclick={() => nav.back()}>← {t("common.back")}</button>
  <h1>{t("tools.instruments")}</h1>
  <div class="row tabs">
    {#each ["piano", "guitar", "bass", "drums"] as const as b (b)}
      <button class={tab === b ? "btn-blue" : ""} onclick={() => { tab = b; tuningId = b === "bass" ? "standard4" : "standard"; }}>{t(`branch.${b}`)}</button>
    {/each}
  </div>

  {#if tab !== "drums"}
    <div class="card controls">
      <label class="col small">{t("inst.scale")}
        <select bind:value={scale} onchange={() => (quality = "")}>
          <option value="">{t("inst.none")}</option>
          {#each scales as s (s)}<option value={s}>{t(`scale.${s}`)}</option>{/each}
        </select>
      </label>
      <label class="col small">{t("inst.chord")}
        <select bind:value={quality} onchange={() => (scale = "")}>
          <option value="">{t("inst.none")}</option>
          {#each qualities as q (q)}<option value={q}>{t(`quality.${q}`)}</option>{/each}
        </select>
      </label>
      <label class="col small">{t("inst.root")}
        <select bind:value={rootKey}>
          {#each roots as r (r.letter + ":" + r.acc)}<option value="{r.letter}:{r.acc}">{formatLabel({ kind: "pc", pc: r })}</option>{/each}
        </select>
      </label>
      {#if tab === "piano"}
        <label class="col small">{t("inst.octaves")}<select bind:value={octaves}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option></select></label>
      {:else}
        <label class="col small">{t("inst.tuning")}
          <select bind:value={tuningId}>{#each tunings as tt (tt.id)}<option value={tt.id}>{tt.name}</option>{/each}</select>
        </label>
      {/if}
      <label class="row small"><input type="checkbox" bind:checked={showNames} />{t("inst.names")}</label>
    </div>
    <p class="muted small">{t("inst.lockedHint")}</p>
  {/if}

  {#if tab === "piano"}
    <Keyboard from={kbFrom} to={kbTo} marks={kbMarks} {showNames} computerKeys />
  {:else if tab === "guitar" || tab === "bass"}
    <Fretboard instrument={tab} tuning={tuning.strings} frets={12} marks={fbMarks} {showNames} />
    {#if tab === "guitar" && shapes.length}
      <h2>{t("inst.knownChords")}</h2>
      <div class="shapes">{#each shapes as s (s.id)}<div class="card"><ChordDiagram shape={s} size={110} /><p class="center small">{s.chord.includes(":") ? s.chord.replace(":maj", "").replace(":min", "m") : s.chord}</p></div>{/each}</div>
    {/if}
  {:else}
    <DrumPads {known} />
    {#if grooves.length}
      <h2>{t("inst.knownGrooves")}</h2>
      {#each grooves as g, i (i)}
        <div class="card groove"><ScoreView score={grooveScore(g)} sp={8} maxWidth={560} /><PlayButton seq={scoreToSequence(grooveScore(g))} /></div>
      {/each}
    {/if}
  {/if}
</div>

<style>
  .tabs {
    margin-bottom: 0.8rem;
  }
  .controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.6rem;
    margin-bottom: 0.4rem;
  }
  .shapes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 0.5rem;
  }
  .center {
    text-align: center;
    margin: 0;
  }
  .groove {
    margin-bottom: 0.6rem;
  }
</style>

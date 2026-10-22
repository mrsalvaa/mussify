<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import type { Exercise } from "../core/curriculum/types";
  import { checkAnswer, expectedLength, type Response } from "../core/curriculum/check";
  import { formatMsg, formatLabel, t, tPick, noteLabel } from "../i18n";
  import { type PitchClass, midi, fromMidi } from "../core/theory/pitch";
  import { tokenDuration, tokensValue, rhythmScore } from "../core/curriculum/gen";
  import ScoreView from "./ScoreView.svelte";
  import Keyboard from "./Keyboard.svelte";
  import Fretboard from "./Fretboard.svelte";
  import ChordDiagram from "./ChordDiagram.svelte";
  import LabelView from "./LabelView.svelte";
  import PlayButton from "./PlayButton.svelte";
  import DrumPads from "./DrumPads.svelte";
  import { CH } from "../platform/audio";
  import type { ScoreEvent } from "../core/notation/score";
  import { P } from "../core/theory/pitch";

  interface Props {
    exercise: Exercise;
    known?: ReadonlySet<string>;
    ondone: (correct: boolean) => void;
  }
  let { exercise, known, ondone }: Props = $props();

  let result = $state<null | boolean>(null);
  let picked = $state<number | null>(null);
  let notes = $state<number[]>([]);
  let positions = $state<{ string: number; fret: number }[]>([]);
  let pcs = $state<PitchClass[]>([]);
  let tokens = $state<string[]>([]);
  let praise = $state("");

  const a = $derived(exercise.answer);
  const p = $derived(exercise.prompt);

  function submit(r: Response) {
    if (result !== null) return;
    const ok = checkAnswer(a, r);
    result = ok;
    praise = ok ? tPick("fb.great") : t("fb.wrong");
  }

  function choose(i: number) {
    if (result !== null) return;
    picked = i;
    submit({ kind: "choice", index: i });
  }

  function onKey(m: number) {
    if (result !== null || a.kind !== "keys") return;
    if (a.mode === "set") {
      notes = notes.includes(m) ? notes.filter((x) => x !== m) : [...notes, m];
      return;
    }
    notes = [...notes, m];
    if (notes.length >= expectedLength(a)) submit({ kind: "keys", notes });
  }

  function onFret(s: number, f: number) {
    if (result !== null || a.kind !== "frets") return;
    if (a.mode === "set") {
      // en la misma cuerda solo puede haber un traste apretado
      const others = positions.filter((x) => x.string !== s);
      const same = positions.find((x) => x.string === s && x.fret === f);
      positions = same ? others : [...others, { string: s, fret: f }];
      return;
    }
    positions = [...positions, { string: s, fret: f }];
    if (positions.length >= expectedLength(a)) submit({ kind: "frets", positions });
  }

  function onName(pc: PitchClass) {
    if (result !== null || a.kind !== "names") return;
    pcs = [...pcs, pc];
    if (pcs.length >= a.target.length) submit({ kind: "names", pcs });
  }

  function onToken(tok: string) {
    if (result !== null || a.kind !== "rhythm") return;
    const next = [...tokens, tok];
    if (tokensValue(next) > a.total + 1e-9) return;
    tokens = next;
    if (Math.abs(tokensValue(tokens) - a.total) < 1e-9) submit({ kind: "rhythm", tokens });
  }

  function check() {
    if (a.kind === "keys") submit({ kind: "keys", notes });
    else if (a.kind === "frets") submit({ kind: "frets", positions });
  }

  function undo() {
    if (result !== null) return;
    if (a.kind === "keys") notes = notes.slice(0, -1);
    if (a.kind === "frets") positions = positions.slice(0, -1);
    if (a.kind === "names") pcs = pcs.slice(0, -1);
    if (a.kind === "rhythm") tokens = tokens.slice(0, -1);
  }

  // Estados visuales del teclado y el diapasón
  const keyStates = $derived.by(() => {
    const s: Record<number, "ok" | "bad" | "sel"> = {};
    if (a.kind !== "keys") return s;
    if (a.mode === "set" && result === null) for (const n of notes) s[n] = "sel";
    if (result !== null) {
      if (a.mode === "sequence") notes.forEach((n, i) => (s[n] = a.target[i] && (a.match === "exact" ? midi(a.target[i]) === n : (midi(a.target[i]) - n) % 12 === 0) ? "ok" : "bad"));
      else for (const n of notes) s[n] = result ? "ok" : "bad";
      if (!result) for (const tp of a.target) if (a.match === "exact" || a.mode === "sequence") s[midi(tp)] = s[midi(tp)] ?? "ok";
    }
    return s;
  });
  const fretStates = $derived.by(() => {
    const s: Record<string, "ok" | "bad" | "sel"> = {};
    if (a.kind !== "frets") return s;
    for (const q of positions) s[`${q.string}:${q.fret}`] = result === null ? "sel" : result ? "ok" : "bad";
    if (result === false) for (const tp of a.target) s[`${tp.string}:${tp.fret}`] = s[`${tp.string}:${tp.fret}`] === "bad" ? "bad" : "ok";
    return s;
  });

  const rhythmBuilt = $derived.by(() => {
    if (a.kind !== "rhythm" || !tokens.length) return null;
    const evs: ScoreEvent[] = tokens.map((tk) => {
      const { d, rest } = tokenDuration(tk);
      return { duration: d, notes: rest ? [] : [{ pitch: P("B4") }] };
    });
    return rhythmScore(evs, { num: 4, den: 4 }, 80, true);
  });

  function tokenLabel(tok: string): string {
    const { d, rest } = tokenDuration(tok);
    const name = t(`fig.${d.base}`);
    const base = rest ? t("rhythm.rest", { fig: name }) : name;
    return d.dots ? t("rhythm.dotted", { fig: base }) : base;
  }

  const correctText = $derived.by(() => {
    switch (a.kind) {
      case "choice":
        return formatLabel(a.options[a.correct]);
      case "keys":
        return a.target.map((x) => noteLabel(x) + (a.match === "exact" ? x.octave : "")).join(" – ");
      case "frets":
        return a.target.map((x) => `${x.string}ª/${x.fret}`).join(", ");
      case "names":
        return a.target.map((x) => noteLabel(x)).join(" – ");
      case "rhythm":
        return a.target.map(tokenLabel).join(", ");
    }
  });
  const isVisualChoice = $derived(a.kind === "choice" && a.options.some((o) => o.kind === "score" || o.kind === "diagram" || o.kind === "audio"));
</script>

<div class="ex fade-in">
  <h2 class="prompt">{formatMsg(p.text)}</h2>

  <div class="stage">
    {#if p.audio}
      <PlayButton seq={p.audio} autoplay={p.autoplay} big={!p.score} label={t("common.listenAgain")} channel={CH.main} />
    {/if}
    {#if p.score}
      <div class="score card"><ScoreView score={p.score} sp={p.score.freeNotes ? 12 : 10} maxWidth={640} /></div>
    {/if}
    {#if p.big}
      <div class="big"><LabelView label={p.big} /></div>
    {/if}
    {#if p.diagram}
      <ChordDiagram shape={p.diagram} />
    {/if}
    {#if p.keyboard && a.kind !== "keys"}
      <Keyboard from={p.keyboard.from} to={p.keyboard.to} marks={p.keyboard.marks?.map((m) => ({ midi: m.midi, role: m.role }))} interactive={false} />
    {/if}
    {#if p.fretboard && a.kind !== "frets"}
      <Fretboard instrument={p.fretboard.instrument} tuning={p.fretboard.tuning} frets={p.fretboard.frets} marks={p.fretboard.marks?.map((m) => ({ string: m.string, fret: m.fret, role: m.role }))} interactive={false} />
    {/if}
    {#if p.drumPads}
      <DrumPads {known} />
    {/if}
  </div>

  <div class="answer">
    {#if a.kind === "choice"}
      <div class="options {isVisualChoice ? 'visual' : ''}">
        {#each a.options as o, i (i)}
          <button
            class="opt {picked === i ? (result ? 'ok' : 'bad') : ''} {result === false && i === a.correct ? 'ok reveal' : ''}"
            onclick={() => choose(i)}
            disabled={result !== null && picked !== i && i !== a.correct}
            aria-pressed={picked === i}
          >
            <span class="num" aria-hidden="true">{i + 1}</span>
            <LabelView label={o} compact />
            {#if picked === i && result !== null}<span class="mark" aria-hidden="true">{result ? "✓" : "✗"}</span>{/if}
          </button>
        {/each}
      </div>
    {:else if a.kind === "keys"}
      <Keyboard from={a.from} to={a.to} states={keyStates} marks={p.keyboard?.marks?.map((m) => ({ midi: m.midi, role: m.role })) ?? []} onpress={onKey} computerKeys />
      {#if a.mode !== "single"}
        <div class="row center">
          <span class="muted small">{notes.map((n) => noteLabel(fromMidi(n))).join(" · ")}</span>
          <button class="btn-small" onclick={undo} disabled={!notes.length || result !== null}>{t("common.undo")}</button>
          {#if a.mode === "set"}<button class="btn-primary" onclick={check} disabled={!notes.length || result !== null}>{t("common.check")}</button>{/if}
        </div>
      {/if}
    {:else if a.kind === "frets"}
      <Fretboard instrument={a.instrument} tuning={a.tuning} frets={a.frets} states={fretStates} marks={p.fretboard?.marks?.map((m) => ({ string: m.string, fret: m.fret, role: m.role })) ?? []} onpress={onFret} />
      {#if a.mode !== "single"}
        <div class="row center">
          <button class="btn-small" onclick={undo} disabled={!positions.length || result !== null}>{t("common.undo")}</button>
          {#if a.mode === "set"}<button class="btn-primary" onclick={check} disabled={result !== null}>{t("common.check")}</button>{/if}
        </div>
      {/if}
    {:else if a.kind === "names"}
      <div class="slots" aria-live="polite">
        {#each a.target as _, i (i)}
          <span class="slot {pcs[i] ? 'filled' : ''} {result !== null && pcs[i] ? (pcs[i].letter === a.target[i].letter && pcs[i].acc === a.target[i].acc ? 'ok' : 'bad') : ''}">{pcs[i] ? noteLabel(pcs[i]) : "?"}</span>
        {/each}
      </div>
      <div class="row center">
        {#each a.choices as c, i (i)}
          <button class="name-btn" onclick={() => onName(c)} disabled={result !== null}>{noteLabel(c)}</button>
        {/each}
        <button class="btn-small" onclick={undo} disabled={!pcs.length || result !== null}>{t("common.undo")}</button>
      </div>
    {:else if a.kind === "rhythm"}
      <div class="card built">
        {#if rhythmBuilt}<ScoreView score={rhythmBuilt} sp={9} maxWidth={520} />{:else}<p class="muted center">…</p>{/if}
      </div>
      <div class="row center">
        {#each a.choices as c (c)}
          <button class="name-btn" onclick={() => onToken(c)} disabled={result !== null}>{tokenLabel(c)}</button>
        {/each}
        <button class="btn-small" onclick={undo} disabled={!tokens.length || result !== null}>{t("common.undo")}</button>
      </div>
    {/if}
  </div>

  {#if result !== null}
    <div class="feedback {result ? 'good pop' : 'bad shake'}" role="status" aria-live="assertive">
      <div class="fb-text">
        <strong>{result ? "✓ " : "✗ "}{praise}</strong>
        {#if !result}<div>{t("fb.answer")} <b>{correctText}</b></div>{/if}
        {#if exercise.explain}<div class="small">{formatMsg(exercise.explain)}</div>{/if}
      </div>
      <button class={result ? "btn-primary" : "btn-danger"} onclick={() => ondone(!!result)}>{t("common.continue")}</button>
    </div>
  {/if}
</div>

<svelte:window
  onkeydown={(e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (result !== null && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      ondone(!!result);
      return;
    }
    if (a.kind === "choice" && result === null) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= a.options.length) choose(n - 1);
    }
  }}
/>

<style>
  .ex {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-bottom: 7rem;
  }
  .prompt {
    text-align: center;
    font-size: 1.35rem;
  }
  .stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
  }
  .score {
    width: 100%;
    max-width: 680px;
  }
  .big {
    font-size: 1.4rem;
  }
  .options {
    display: grid;
    gap: 0.6rem;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }
  .options.visual {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
  .opt {
    position: relative;
    min-height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 1.05rem;
  }
  .opt .num {
    position: absolute;
    left: 8px;
    top: 6px;
    font-size: 0.7rem;
    color: var(--muted);
    border: 1.5px solid var(--border);
    border-radius: 6px;
    padding: 0 4px;
  }
  .opt.ok {
    border-color: var(--ok);
    background: color-mix(in srgb, var(--ok) 15%, var(--card));
  }
  .opt.bad {
    border-color: var(--bad);
    background: color-mix(in srgb, var(--bad) 15%, var(--card));
  }
  .opt .mark {
    font-weight: 900;
    font-size: 1.3rem;
  }
  .center {
    justify-content: center;
  }
  .slots {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  .slot {
    min-width: 56px;
    text-align: center;
    padding: 0.5rem;
    border: 2px dashed var(--border);
    border-radius: 12px;
    font-size: 1.1rem;
  }
  .slot.filled {
    border-style: solid;
  }
  .slot.ok {
    border-color: var(--ok);
    color: var(--ok);
  }
  .slot.bad {
    border-color: var(--bad);
    color: var(--bad);
  }
  .name-btn {
    min-width: 64px;
  }
  .built {
    min-height: 90px;
  }
  .feedback {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 1rem max(1rem, calc((100vw - 900px) / 2));
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    z-index: 30;
    border-top: 2px solid var(--border);
  }
  .feedback.good {
    background: color-mix(in srgb, var(--ok) 18%, var(--bg));
    color: var(--ok-dark);
  }
  .feedback.bad {
    background: color-mix(in srgb, var(--bad) 18%, var(--bg));
    color: var(--bad-dark);
  }
  :global([data-theme="dark"]) .feedback.good,
  :global([data-theme="dark"]) .feedback.bad {
    color: var(--text);
  }
  .fb-text {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 1.05rem;
  }
</style>

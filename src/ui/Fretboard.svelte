<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { type Pitch, midi, fromMidi } from "../core/theory/pitch";
  import { noteLabel, t } from "../i18n";
  import { backend } from "../platform/bridge";
  import { prefs } from "../state/prefs.svelte";

  interface Mark {
    string: number;
    fret: number;
    role?: "target" | "hint" | "root";
    label?: string;
  }
  interface Props {
    instrument?: "guitar" | "bass";
    /** Afinación de la cuerda 1 (aguda) a la última. */
    tuning: Pitch[];
    frets?: number;
    marks?: Mark[];
    states?: Record<string, "ok" | "bad" | "sel">;
    interactive?: boolean;
    showNames?: boolean;
    onpress?: (string: number, fret: number) => void;
  }
  let { instrument = "guitar", tuning, frets = 12, marks = [], states = {}, interactive = true, showNames = false, onpress }: Props = $props();

  const n = $derived(tuning.length);
  const left = $derived(prefs.leftHanded);
  const FW = 56;
  const SH = 30;
  const NUT = 40;
  const OFF = 26; // espacio para los nombres de las cuerdas
  const W = $derived(OFF + NUT + frets * FW + 10);
  const H = $derived(n * SH + 20);
  const xOf = (f: number) => {
    const x = OFF + (f === 0 ? NUT / 2 : NUT + (f - 0.5) * FW);
    return left ? W - x : x;
  };
  const lineX = (f: number) => (left ? W - (OFF + NUT + f * FW) : OFF + NUT + f * FW);
  const yOf = (s: number) => 15 + (s - 1) * SH + SH / 2;
  const DOTS = [3, 5, 7, 9, 15, 17];
  const pitchAtSF = (s: number, f: number) => fromMidi(midi(tuning[s - 1]) + f);

  function press(s: number, f: number) {
    if (!interactive) return;
    void backend.note(instrument === "bass" ? "bass" : "guitar", midi(tuning[s - 1]) + f, true);
    onpress?.(s, f);
  }
</script>

<div class="fb" role="group" aria-label={t(instrument === "bass" ? "aria.fretboardBass" : "aria.fretboardGuitar")}>
  <svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet">
    <rect x={Math.min(lineX(0), lineX(frets))} y="15" width={Math.abs(lineX(frets) - lineX(0))} height={n * SH} class="wood" />
    {#each DOTS.filter((d) => d <= frets) as d (d)}
      <circle cx={xOf(d)} cy={15 + (n * SH) / 2} r="6" class="inlay" />
    {/each}
    {#if frets >= 12}
      <circle cx={xOf(12)} cy={15 + (n * SH) / 3} r="6" class="inlay" />
      <circle cx={xOf(12)} cy={15 + (2 * n * SH) / 3} r="6" class="inlay" />
    {/if}
    {#each Array(frets + 1) as _, f (f)}
      <line x1={lineX(f)} y1="15" x2={lineX(f)} y2={15 + n * SH} class={f === 0 ? "nut" : "fret"} />
      {#if f > 0}<text x={xOf(f)} y={H - 1} text-anchor="middle" class="fnum">{f}</text>{/if}
    {/each}
    {#each tuning as p, i (i)}
      <line x1={Math.min(lineX(0), lineX(frets))} y1={yOf(i + 1)} x2={Math.max(lineX(0), lineX(frets))} y2={yOf(i + 1)} class="string" stroke-width={1 + i * (instrument === "bass" ? 0.7 : 0.4)} />
      <text x={left ? W - 4 : 4} y={yOf(i + 1) + 4} text-anchor={left ? "end" : "start"} class="sname">{noteLabel(p)}</text>
    {/each}
    {#each tuning as _, si (si)}
      {#each Array(frets + 1) as __, f (f)}
        {@const s = si + 1}
        {@const key = `${s}:${f}`}
        {@const mk = marks.find((m) => m.string === s && m.fret === f)}
        {@const st = states[key]}
        <g
          role="button"
          tabindex={interactive ? 0 : -1}
          aria-label={`Cuerda ${s}, traste ${f}`}
          onpointerdown={(e) => { e.preventDefault(); press(s, f); }}
          onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); press(s, f); } }}
        >
          <rect x={xOf(f) - (f === 0 ? NUT / 2 : FW / 2)} y={yOf(s) - SH / 2} width={f === 0 ? NUT : FW} height={SH} class="hit" />
          {#if mk || st}
            <circle cx={xOf(f)} cy={yOf(s)} r="12" class="mark {st ?? mk?.role ?? 'target'}" />
            <text x={xOf(f)} y={yOf(s) + 4} text-anchor="middle" class="mtext">{st === "ok" ? "✓" : st === "bad" ? "✗" : (mk?.label ?? (showNames ? noteLabel(pitchAtSF(s, f)) : ""))}</text>
          {:else if showNames}
            <text x={xOf(f)} y={yOf(s) + 4} text-anchor="middle" class="ghost">{noteLabel(pitchAtSF(s, f))}</text>
          {/if}
        </g>
      {/each}
    {/each}
  </svg>
</div>

<style>
  .fb {
    width: 100%;
    overflow-x: auto;
    touch-action: none;
    user-select: none;
  }
  svg {
    display: block;
    width: 100%;
    min-width: 560px;
    max-height: 260px;
  }
  .wood {
    fill: #c89a64;
  }
  :global([data-theme="dark"]) .wood {
    fill: #7a5634;
  }
  .nut {
    stroke: #f3ead8;
    stroke-width: 7;
  }
  .fret {
    stroke: #d9d9d9;
    stroke-width: 3;
  }
  .string {
    stroke: #eee;
  }
  .inlay {
    fill: #f5efe2;
    opacity: 0.8;
  }
  .fnum,
  .sname {
    font-family: var(--sans);
    font-size: 11px;
    font-weight: 800;
    fill: var(--muted);
  }
  .hit {
    fill: transparent;
    cursor: pointer;
  }
  .mark {
    stroke: #fff;
    stroke-width: 2;
  }
  .mark.target {
    fill: var(--orange);
  }
  .mark.hint {
    fill: var(--blue);
  }
  .mark.root {
    fill: var(--red);
  }
  .mark.sel {
    fill: var(--blue);
  }
  .mark.ok {
    fill: var(--ok);
  }
  .mark.bad {
    fill: var(--bad);
  }
  .mtext {
    font-family: var(--sans);
    font-size: 12px;
    font-weight: 900;
    fill: #fff;
    pointer-events: none;
  }
  .ghost {
    font-family: var(--sans);
    font-size: 10px;
    fill: rgba(255, 255, 255, 0.85);
    pointer-events: none;
  }
  g[role="button"]:focus-visible .hit {
    stroke: var(--blue);
    stroke-width: 3;
  }
</style>

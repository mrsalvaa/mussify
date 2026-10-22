<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { fromMidi } from "../core/theory/pitch";
  import { noteLabel } from "../i18n";
  import { backend } from "../platform/bridge";

  type Role = "target" | "hint" | "root";
  interface Props {
    from?: number;
    to?: number;
    marks?: { midi: number; role?: Role; label?: string }[];
    states?: Record<number, "ok" | "bad" | "sel">;
    interactive?: boolean;
    showNames?: boolean;
    sound?: boolean;
    computerKeys?: boolean;
    onpress?: (midi: number) => void;
  }
  let { from = 48, to = 72, marks = [], states = {}, interactive = true, showNames = false, sound = true, computerKeys = false, onpress }: Props = $props();

  const isBlack = (m: number) => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
  const keys = $derived.by(() => {
    const out: { midi: number; black: boolean; x: number }[] = [];
    let wi = 0;
    for (let m = from; m <= to; m++) {
      if (isBlack(m)) out.push({ midi: m, black: true, x: wi - 0.32 });
      else out.push({ midi: m, black: false, x: wi++ });
    }
    return out;
  });
  const whiteCount = $derived(keys.filter((k) => !k.black).length);
  const markOf = (m: number) => marks.find((x) => x.midi === m);
  let down = $state<Set<number>>(new Set());

  function press(m: number) {
    if (!interactive) return;
    down = new Set([...down, m]);
    if (sound) void backend.note("piano", m, true);
    onpress?.(m);
  }
  function release(m: number) {
    if (!down.has(m)) return;
    const n = new Set(down);
    n.delete(m);
    down = n;
    if (sound) void backend.note("piano", m, false);
  }

  const KEYMAP = "awsedftgyhujkolp;'";
  function onkey(e: KeyboardEvent) {
    if (!computerKeys || !interactive || e.repeat || e.ctrlKey || e.metaKey) return;
    const t = e.target as HTMLElement;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    const i = KEYMAP.indexOf(e.key.toLowerCase());
    if (i < 0) return;
    const base = Math.ceil(from / 12) * 12;
    const m = base + i;
    if (m > to) return;
    e.preventDefault();
    if (e.type === "keydown") press(m);
    else release(m);
  }
</script>

<svelte:window onkeydown={onkey} onkeyup={onkey} />

<div class="kb" role="group" aria-label="Teclado de piano">
  <svg viewBox="0 0 {whiteCount * 40} 160" preserveAspectRatio="xMidYMid meet">
    {#each keys.filter((k) => !k.black) as k (k.midi)}
      {@const mk = markOf(k.midi)}
      {@const st = states[k.midi]}
      <g
        role="button"
        tabindex={interactive ? 0 : -1}
        aria-label={noteLabel(fromMidi(k.midi)) + fromMidi(k.midi).octave}
        onpointerdown={(e) => { e.preventDefault(); (e.currentTarget as Element).setPointerCapture?.(e.pointerId); press(k.midi); }}
        onpointerup={() => release(k.midi)}
        onpointercancel={() => release(k.midi)}
        onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); press(k.midi); } }}
        onkeyup={(e) => { if (e.key === "Enter" || e.key === " ") release(k.midi); }}
      >
        <rect x={k.x * 40 + 1} y="1" width="38" height="156" rx="5" class="white {down.has(k.midi) ? 'down' : ''} {st ?? ''} {mk ? 'mark-' + (mk.role ?? 'target') : ''}" />
        {#if mk}<circle cx={k.x * 40 + 20} cy="125" r="9" class="dot {mk.role ?? 'target'}" />{/if}
        {#if showNames || k.midi % 12 === 0 || mk?.label}
          <text x={k.x * 40 + 20} y="150" text-anchor="middle" class="name">{mk?.label ?? noteLabel(fromMidi(k.midi)) + (k.midi % 12 === 0 && !showNames ? fromMidi(k.midi).octave : "")}</text>
        {/if}
        {#if st === "ok"}<text x={k.x * 40 + 20} y="100" text-anchor="middle" class="icon">✓</text>{/if}
        {#if st === "bad"}<text x={k.x * 40 + 20} y="100" text-anchor="middle" class="icon">✗</text>{/if}
      </g>
    {/each}
    {#each keys.filter((k) => k.black) as k (k.midi)}
      {@const mk = markOf(k.midi)}
      {@const st = states[k.midi]}
      <g
        role="button"
        tabindex={interactive ? 0 : -1}
        aria-label={noteLabel(fromMidi(k.midi)) + fromMidi(k.midi).octave}
        onpointerdown={(e) => { e.preventDefault(); (e.currentTarget as Element).setPointerCapture?.(e.pointerId); press(k.midi); }}
        onpointerup={() => release(k.midi)}
        onpointercancel={() => release(k.midi)}
      >
        <rect x={k.x * 40 + 13 - 12} y="1" width="26" height="98" rx="4" class="black {down.has(k.midi) ? 'down' : ''} {st ?? ''}" />
        {#if mk}<circle cx={k.x * 40 + 14} cy="80" r="7" class="dot {mk.role ?? 'target'}" />{/if}
        {#if st === "ok"}<text x={k.x * 40 + 14} y="60" text-anchor="middle" class="icon light">✓</text>{/if}
        {#if st === "bad"}<text x={k.x * 40 + 14} y="60" text-anchor="middle" class="icon light">✗</text>{/if}
      </g>
    {/each}
  </svg>
</div>

<style>
  .kb {
    width: 100%;
    overflow-x: auto;
    touch-action: none;
    user-select: none;
  }
  svg {
    display: block;
    width: 100%;
    min-width: 320px;
    max-height: 220px;
  }
  .white {
    fill: #fff;
    stroke: #9a9a9a;
    stroke-width: 1.5;
  }
  .black {
    fill: #222;
    stroke: #000;
  }
  .white.down {
    fill: #dfeffc;
  }
  .black.down {
    fill: #444;
  }
  .white.ok {
    fill: color-mix(in srgb, var(--ok) 35%, #fff);
  }
  .white.bad {
    fill: color-mix(in srgb, var(--bad) 35%, #fff);
  }
  .white.sel {
    fill: color-mix(in srgb, var(--blue) 30%, #fff);
  }
  .black.ok {
    fill: var(--ok-dark);
  }
  .black.bad {
    fill: var(--bad-dark);
  }
  .black.sel {
    fill: var(--blue-dark);
  }
  .dot.target {
    fill: var(--orange);
  }
  .dot.hint {
    fill: var(--blue);
  }
  .dot.root {
    fill: var(--red);
  }
  .name {
    font-family: "Nunito";
    font-size: 12px;
    font-weight: 800;
    fill: #555;
  }
  .icon {
    font-size: 22px;
    font-weight: 900;
    fill: #222;
  }
  .icon.light {
    fill: #fff;
    font-size: 16px;
  }
  g[role="button"] {
    cursor: pointer;
    outline: none;
  }
  g[role="button"]:focus-visible rect {
    stroke: var(--blue);
    stroke-width: 3;
  }
</style>

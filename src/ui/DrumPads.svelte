<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { DRUM_PIECES } from "../core/instruments/drums";
  import { backend } from "../platform/bridge";
  import { t } from "../i18n";

  /** Solo se muestran las piezas que ya se conocen (o todas si `known` no se pasa). */
  let { known }: { known?: ReadonlySet<string> } = $props();
  const pieces = $derived(DRUM_PIECES.filter((d) => !known || known.has(d.concept)));
  let flash = $state<string | null>(null);
  function hit(gm: number, id: string) {
    void backend.note("drums", gm, true, 0.9);
    flash = id;
    setTimeout(() => (flash = null), 120);
  }
</script>

{#if pieces.length}
  <div class="pads" role="group" aria-label={t("aria.drumPads")}>
    {#each pieces as p (p.id)}
      <button class="pad {flash === p.id ? 'hit' : ''} {p.head !== 'normal' ? 'cym' : ''}" onpointerdown={(e) => { e.preventDefault(); hit(p.gm, p.id); }}>
        {t(`drum.${p.id}`)}
      </button>
    {/each}
  </div>
{/if}

<style>
  .pads {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: 0.5rem;
  }
  .pad {
    min-height: 72px;
    border-radius: 18px;
    background: color-mix(in srgb, var(--red) 15%, var(--card));
    border-color: var(--red);
    touch-action: manipulation;
  }
  .pad.cym {
    background: color-mix(in srgb, var(--yellow) 18%, var(--card));
    border-color: var(--yellow-dark);
  }
  .pad.hit {
    filter: brightness(1.25);
    transform: scale(0.97);
  }
</style>

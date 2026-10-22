<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Íconos lineales propios (trazo de 1.6 px, 24×24). -->
<script lang="ts">
  let { name, size = 20 }: { name: string; size?: number } = $props();
  const P: Record<string, string> = {
    book: "M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 18.3 4 17.5v-12ZM13 4h5.5c.8 0 1.5.7 1.5 1.5v12c0 .8-.7 1.5-1.5 1.5H13V4Z",
    practice: "M5 12h3l2-6 4 12 2-6h3",
    songs: "M9 17.5V6l10-2v11.5M9 17.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm10-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z",
    library: "M5 4v16M9 4v16M13 5l4 14.5M3 20h18",
    tools: "M4 7h10M18 7h2M4 17h4M12 17h8M14 5v4M8 15v4",
    progress: "M4 20V10M10 20V4M16 20v-7M22 20H2",
    settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.5 7.5 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2l.4 2.6h5l.4-2.6c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
    play: "M7 5v14l11-7L7 5Z",
    pause: "M8 5v14M16 5v14",
    check: "M5 12.5 10 17 19 7",
    cross: "M6 6l12 12M18 6 6 18",
    lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6v-9Z",
    arrow: "M5 12h14M13 6l6 6-6 6",
    back: "M19 12H5M11 6l-6 6 6 6",
    close: "M6 6l12 12M18 6 6 18",
    search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4 4",
    upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
    trash: "M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13",
    metronome: "M9 3h6l4 18H5L9 3Zm3 13 5-9",
    keys: "M3 5h18v14H3V5Zm4 0v8M11 5v8M15 5v8M7 13v6M11 13v6M15 13v6",
    glossary: "M6 4h12v16H6V4Zm3 4h6M9 12h6",
    journal: "M6 3h11l2 2v16H6V3Zm3 6h7M9 13h7M9 17h4",
    review: "M4 12a8 8 0 1 0 2.3-5.7M4 4v5h5",
  };
</script>

<svg class="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d={P[name] ?? ""} />
</svg>

<style>
  .icon {
    flex: 0 0 auto;
    vertical-align: -0.2em;
  }
</style>

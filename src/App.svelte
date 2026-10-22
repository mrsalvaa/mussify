<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import { onMount } from "svelte";
  import { nav } from "./state/nav.svelte";
  import { loadPrefs } from "./state/prefs.svelte";
  import { loadProgress, progress } from "./state/progress.svelte";
  import { cur } from "./state/curriculum";
  import { t } from "./i18n";
  import Home from "./ui/pages/Home.svelte";
  import LessonPlayer from "./ui/LessonPlayer.svelte";
  import SessionPage from "./ui/pages/SessionPage.svelte";
  import Placement from "./ui/pages/Placement.svelte";
  import Practice from "./ui/pages/Practice.svelte";
  import SightReading from "./ui/pages/SightReading.svelte";
  import Songs from "./ui/pages/Songs.svelte";
  import SongDetail from "./ui/pages/SongDetail.svelte";
  import Library from "./ui/pages/Library.svelte";
  import ItemView from "./ui/pages/ItemView.svelte";
  import Download from "./ui/pages/Download.svelte";
  import Tools from "./ui/pages/Tools.svelte";
  import Metronome from "./ui/pages/Metronome.svelte";
  import Instruments from "./ui/pages/Instruments.svelte";
  import Glossary from "./ui/pages/Glossary.svelte";
  import Journal from "./ui/pages/Journal.svelte";
  import ProgressPage from "./ui/pages/ProgressPage.svelte";
  import Settings from "./ui/pages/Settings.svelte";
  import Icon from "./ui/Icon.svelte";

  let ready = $state(false);
  onMount(async () => {
    await Promise.all([loadPrefs(), loadProgress()]);
    // Solo en desarrollo: ?demo=N marca como dominados los primeros N conceptos y ?view=... abre una vista.
    if (import.meta.env.DEV) {
      const q = new URLSearchParams(location.search);
      const n = Number(q.get("demo") ?? 0);
      if (n) for (const c of cur.topoOrder().slice(0, n)) progress.mastered[c] = { at: Date.now(), score: 1 };
      const view = q.get("view");
      if (view) nav.reset({ view, id: q.get("id") ?? undefined, branch: q.get("branch") ?? undefined, mode: q.get("mode") ?? undefined, filter: q.get("filter") ?? undefined } as never);
    }
    ready = true;
  });

  const r = $derived(nav.route);
  const fullscreen = $derived(r.view === "lesson" || r.view === "session" || r.view === "placement" || r.view === "sight");
  const tabs = [
    { view: "home", icon: "book", label: "nav.learn" },
    { view: "practice", icon: "practice", label: "nav.practice" },
    { view: "songs", icon: "songs", label: "nav.songs" },
    { view: "library", icon: "library", label: "nav.library" },
    { view: "tools", icon: "tools", label: "nav.tools" },
  ] as const;
  const activeTab = $derived(
    r.view === "song" ? "songs" : r.view === "item" || r.view === "download" ? "library" : ["metronome", "instruments", "glossary", "journal"].includes(r.view) ? "tools" : r.view,
  );
</script>

{#if !ready}
  <div class="loading">{t("common.loading")}</div>
{:else}
  {#if !fullscreen}
    <header class="topbar">
      <button class="logo btn-ghost" onclick={() => nav.reset({ view: "home" })}>{t("app.name")}</button>
      <span class="spacer"></span>
      <button class="btn-ghost icon" onclick={() => nav.go({ view: "progress" })} aria-label={t("nav.progress")} title={t("nav.progress")}><Icon name="progress" /></button>
      <button class="btn-ghost icon" onclick={() => nav.go({ view: "settings" })} aria-label={t("nav.settings")} title={t("nav.settings")}><Icon name="settings" /></button>
    </header>
  {/if}
  <main class={fullscreen ? "full" : ""}>
    {#if r.view === "home"}
      <Home branch={r.branch} />
    {:else if r.view === "lesson"}
      {@const l = cur.byConcept.get(r.id)}
      {#if l}{#key r.id}<LessonPlayer lesson={l} />{/key}{/if}
    {:else if r.view === "session"}
      {#key JSON.stringify(r)}<SessionPage mode={r.mode} filter={r.filter} branch={r.branch} />{/key}
    {:else if r.view === "placement"}
      <Placement branch={r.branch} />
    {:else if r.view === "practice"}
      <Practice />
    {:else if r.view === "sight"}
      <SightReading />
    {:else if r.view === "songs"}
      <Songs />
    {:else if r.view === "song"}
      <SongDetail id={r.id} />
    {:else if r.view === "library"}
      <Library />
    {:else if r.view === "item"}
      {#key r.id}<ItemView id={r.id} />{/key}
    {:else if r.view === "download"}
      <Download />
    {:else if r.view === "tools"}
      <Tools />
    {:else if r.view === "metronome"}
      <Metronome />
    {:else if r.view === "instruments"}
      <Instruments />
    {:else if r.view === "glossary"}
      <Glossary />
    {:else if r.view === "journal"}
      <Journal />
    {:else if r.view === "progress"}
      <ProgressPage />
    {:else if r.view === "settings"}
      <Settings />
    {/if}
  </main>
  {#if !fullscreen}
    <nav class="bottombar" aria-label="Secciones">
      {#each tabs as tb (tb.view)}
        <button class="navbtn {activeTab === tb.view ? 'on' : ''}" onclick={() => nav.reset({ view: tb.view })} aria-current={activeTab === tb.view ? "page" : undefined}>
          <span class="nico"><Icon name={tb.icon} size={22} /></span>
          <span class="nlabel">{t(tb.label)}</span>
        </button>
      {/each}
    </nav>
  {/if}
{/if}

<style>
  .loading {
    display: grid;
    place-items: center;
    height: 100vh;
    font-family: var(--serif);
    font-size: 1.3rem;
  }
  .topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.35rem 1rem;
    padding-top: max(0.35rem, env(safe-area-inset-top));
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }
  .logo {
    font-family: var(--serif);
    font-size: 1.35rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    padding-left: 0;
  }
  .logo:hover {
    text-decoration: none !important;
  }
  .icon {
    padding: 0.3em 0.5em;
    color: var(--muted);
  }
  main.full {
    padding-top: max(0.5rem, env(safe-area-inset-top));
  }
  .bottombar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 20;
    display: flex;
    justify-content: center;
    background: var(--bg);
    border-top: 1px solid var(--border);
    padding: 0.2rem 0.2rem max(0.2rem, env(safe-area-inset-bottom));
  }
  .navbtn {
    flex: 1;
    max-width: 140px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    border: none;
    border-radius: 0;
    background: transparent;
    color: var(--muted);
    padding: 0.35rem 0.2rem;
    min-height: 54px;
    font-size: 0.76rem;
    font-weight: 600;
  }
  .navbtn.on {
    color: var(--accent);
  }
  @media (min-width: 900px) {
    .bottombar {
      top: 56px;
      bottom: 0;
      right: auto;
      width: 190px;
      flex-direction: column;
      justify-content: flex-start;
      border-top: none;
      border-right: 1px solid var(--border);
      padding: 1.2rem 0.6rem;
      gap: 0.1rem;
    }
    .navbtn {
      flex: 0 0 auto;
      max-width: none;
      flex-direction: row;
      gap: 0.7rem;
      min-height: 40px;
      padding: 0.4rem 0.7rem;
      font-size: 0.98rem;
      border-left: 2px solid transparent;
    }
    .navbtn.on {
      border-left-color: var(--accent);
      color: var(--text);
    }
    main:not(.full) {
      margin-left: 190px;
    }
  }
</style>

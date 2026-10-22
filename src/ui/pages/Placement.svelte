<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import type { Branch } from "../../core/curriculum/types";
  import { placementBlocks, placementSession, PLACEMENT_THRESHOLD, type PlacementBlock } from "../../core/curriculum/engine";
  import { cur } from "../../state/curriculum";
  import { masteredSet, placementPass } from "../../state/progress.svelte";
  import SessionRunner, { type SessionResult } from "../SessionRunner.svelte";
  import { nav } from "../../state/nav.svelte";
  import { t } from "../../i18n";

  let { branch }: { branch: Branch } = $props();
  const blocks = placementBlocks(cur, branch);
  let phase = $state<"intro" | "test" | "passed" | "stopped" | "needs">("intro");
  let current = $state<PlacementBlock | null>(null);
  let mastered = $state(masteredSet());
  let unlocked = $state(0);

  function nextBlock(): PlacementBlock | null {
    return blocks.find((b) => b.lessons.some((l) => !mastered.has(l.concept))) ?? null;
  }
  function start() {
    const b = nextBlock();
    if (!b) {
      phase = "stopped";
      return;
    }
    if (b.external.some((e) => !mastered.has(e))) {
      phase = "needs";
      return;
    }
    current = b;
    phase = "test";
  }
  const exercises = $derived(current ? placementSession(cur, current, mastered, Date.now() % 100000) : []);
  const known = $derived(current ? new Set([...mastered, ...current.lessons.map((l) => l.concept)]) : mastered);

  function finish(r: SessionResult[]) {
    const ok = r.filter((x) => x.correct).length;
    if (current && r.length && ok / r.length >= PLACEMENT_THRESHOLD) {
      const cs = current.lessons.map((l) => l.concept);
      placementPass(cs);
      mastered = masteredSet();
      unlocked = cs.length;
      phase = "passed";
    } else phase = "stopped";
  }
</script>

<div class="page">
  {#if phase === "intro"}
    <button class="btn-ghost" onclick={() => nav.back()}>← {t("common.back")}</button>
    <h1>{t("placement.title")} · {t(`branch.${branch}`)}</h1>
    <p>{t("placement.intro", { pct: Math.round(PLACEMENT_THRESHOLD * 100) })}</p>
    <button class="btn-primary wide" onclick={start}>{t("common.start")}</button>
  {:else if phase === "test" && current}
    {#key current.index}
      <SessionRunner {exercises} {known} onfinish={finish} onquit={() => nav.back()} record={false} />
    {/key}
  {:else if phase === "passed"}
    <div class="col center pop">
      <h1>{t("placement.passed", { n: unlocked })}</h1>
      <div class="row">
        <button onclick={() => nav.reset({ view: "home", branch })}>{t("common.done")}</button>
        <button class="btn-primary" onclick={start}>{t("common.continue")}</button>
      </div>
    </div>
  {:else if phase === "needs"}
    <p>{t("placement.needs")}</p>
    <button onclick={() => nav.reset({ view: "home", branch })}>{t("common.back")}</button>
  {:else}
    <div class="col center">
      <h1>{t("placement.failed")}</h1>
      <button class="btn-primary" onclick={() => nav.reset({ view: "home", branch })}>{t("common.continue")}</button>
    </div>
  {/if}
</div>

<style>
  .center {
    align-items: center;
    text-align: center;
    padding-top: 3rem;
  }
  .big {
    font-size: 4rem;
  }
</style>

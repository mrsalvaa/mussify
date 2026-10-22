// SPDX-License-Identifier: GPL-3.0-or-later
// Reproducción de secuencias con seguimiento de posición (para cursores).
import type { Sequence } from "../core/notation/playback";
import { backend } from "./bridge";

export const CH = { main: 0, metronome: 1, option: 2, score: 3 } as const;

let watchers = new Map<number, number>();

/** Reproduce y llama a `ontime(segundos)` mientras suena; `onend` al terminar. */
export async function playSeq(seq: Sequence, channel: number = CH.main, ontime?: (t: number) => void, onend?: () => void): Promise<void> {
  await backend.play(seq, channel);
  const id = (watchers.get(channel) ?? 0) + 1;
  watchers.set(channel, id);
  if (!ontime && !onend) return;
  const tick = async () => {
    if (watchers.get(channel) !== id) return;
    const st = await backend.status();
    const c = st.channels.find((x) => x[0] === channel);
    if (!c) {
      onend?.();
      return;
    }
    const [, pos, dur] = c;
    ontime?.(Math.max(0, pos));
    if (pos > dur + 0.3) {
      onend?.();
      return;
    }
    setTimeout(tick, 40);
  };
  setTimeout(tick, 60);
}

export async function stopSeq(channel?: number): Promise<void> {
  if (channel === undefined) watchers = new Map();
  else watchers.set(channel, (watchers.get(channel) ?? 0) + 1);
  await backend.stop(channel);
}

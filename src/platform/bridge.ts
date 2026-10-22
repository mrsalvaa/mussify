// SPDX-License-Identifier: GPL-3.0-or-later
// Puente con el backend nativo (Tauri). En un navegador común (desarrollo), usa un respaldo
// con WebAudio y localStorage para poder probar la interfaz.
import type { Sequence, SoundEvent } from "../core/notation/playback";

export interface LibraryItem {
  id: string;
  title: string;
  kind: string;
  file: string;
  size: number;
  created: number;
  meta: Record<string, unknown>;
}

export interface AudioStatus {
  rate: number;
  channels: [number, number, number][];
  player: [number, number, boolean] | null;
  device: string;
  ok: boolean;
  error: string | null;
}

export interface EqSettings {
  lowDb: number;
  midDb: number;
  highDb: number;
  isolate: "off" | "bass" | "mids" | "treble";
}

export interface NetEntry {
  id: number;
  ts: number;
  destination: string;
  reason: string;
  ok: boolean;
}

export interface ToolInfo {
  supported: boolean;
  ytdlp: string | null;
  ytdlpVersion: string | null;
  ffmpeg: boolean;
  reason: string | null;
}

export interface SearchResult {
  id: string;
  title: string;
  channel: string;
  duration: number | null;
  url: string;
}

type Invoke = <T>(cmd: string, args?: unknown, opts?: { headers?: Record<string, string> }) => Promise<T>;

let invokeFn: Invoke | null = null;
export const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

async function invoke<T>(cmd: string, args?: unknown, opts?: { headers?: Record<string, string> }): Promise<T> {
  if (!invokeFn) {
    const core = await import("@tauri-apps/api/core");
    invokeFn = core.invoke as Invoke;
  }
  return invokeFn<T>(cmd, args, opts);
}

const INST: Record<string, string> = { piano: "piano", guitar: "guitar", guitarDist: "guitarDist", bass: "bass", drums: "drums", click: "click" };

// ------------------------------------------------------------------ respaldo para navegador
class WebAudioFallback {
  ctx: AudioContext | null = null;
  starts = new Map<number, { t0: number; dur: number }>();
  nodes = new Map<number, AudioScheduledSourceNode[]>();
  a4 = 440;
  ensure() {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }
  tone(e: SoundEvent, at: number, channel: number) {
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const isDrum = e.instrument === "drums" || e.instrument === "click";
    osc.type = e.instrument === "bass" ? "triangle" : isDrum ? "square" : "triangle";
    osc.frequency.value = isDrum ? (e.instrument === "click" ? 1000 + e.note * 300 : 80 + (e.note % 12) * 40) : this.a4 * Math.pow(2, (e.note - 69) / 12);
    const dur = isDrum ? 0.06 : Math.max(0.1, e.duration);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.25 * e.velocity, at + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + dur + 0.05);
    if (!this.nodes.has(channel)) this.nodes.set(channel, []);
    this.nodes.get(channel)!.push(osc);
  }
  play(seq: SoundEvent[], channel: number, delay: number) {
    this.stop(channel);
    const ctx = this.ensure();
    const t0 = ctx.currentTime + delay;
    const dur = seq.reduce((a, e) => Math.max(a, e.time + e.duration), 0);
    this.starts.set(channel, { t0, dur });
    for (const e of seq) this.tone(e, t0 + e.time, channel);
  }
  stop(channel?: number) {
    for (const [c, ns] of this.nodes) {
      if (channel !== undefined && c !== channel) continue;
      for (const n of ns) try { n.stop(); } catch { /* ya terminó */ }
      this.nodes.delete(c);
      this.starts.delete(c);
    }
  }
  status(): AudioStatus {
    const ctx = this.ctx;
    const channels: [number, number, number][] = [];
    if (ctx) for (const [c, s] of this.starts) channels.push([c, ctx.currentTime - s.t0, s.dur]);
    return { rate: ctx?.sampleRate ?? 48000, channels, player: null, device: "WebAudio (modo navegador)", ok: true, error: null };
  }
}
const web = new WebAudioFallback();
const LS = {
  get: (k: string) => {
    try {
      return localStorage.getItem(`mussify:${k}`);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(`mussify:${k}`, v);
    } catch {
      /* sin almacenamiento */
    }
  },
};

// ------------------------------------------------------------------ API
export const backend = {
  async play(seq: Sequence, channel = 0, delay = 0.04): Promise<void> {
    const events = seq.events.map((e) => ({ time: e.time, duration: e.duration, note: e.note, velocity: e.velocity, instrument: INST[e.instrument] ?? "piano" }));
    if (!isTauri) return web.play(seq.events, channel, delay);
    await invoke("audio_play", { events, channel, delay });
  },
  async stop(channel?: number): Promise<void> {
    if (!isTauri) return web.stop(channel);
    await invoke("audio_stop", { channel: channel ?? null });
  },
  async note(instrument: string, note: number, on: boolean, velocity = 0.8): Promise<void> {
    if (!isTauri) {
      if (on) web.tone({ time: 0, duration: 0.8, note, velocity, instrument: instrument as SoundEvent["instrument"] }, web.ensure().currentTime + 0.005, 99);
      return;
    }
    await invoke("audio_note", { instrument: INST[instrument] ?? "piano", note, velocity, on });
  },
  async status(): Promise<AudioStatus> {
    if (!isTauri) return web.status();
    return invoke<AudioStatus>("audio_status");
  },
  async audioConfig(a4?: number, master?: number): Promise<void> {
    if (!isTauri) {
      if (a4) web.a4 = a4;
      return;
    }
    await invoke("audio_config", { a4: a4 ?? null, master: master ?? null });
  },
  async kvGet(key: string): Promise<string | null> {
    if (!isTauri) return LS.get(key);
    return invoke<string | null>("kv_get", { key });
  },
  async kvSet(key: string, value: string): Promise<void> {
    if (!isTauri) return LS.set(key, value);
    await invoke("kv_set", { key, value });
  },
  async libraryList(): Promise<LibraryItem[]> {
    if (!isTauri) return JSON.parse(LS.get("library") ?? "[]");
    return invoke<LibraryItem[]>("library_list");
  },
  async libraryAdd(name: string, kind: string, bytes: Uint8Array): Promise<LibraryItem> {
    if (!isTauri) {
      const items: LibraryItem[] = JSON.parse(LS.get("library") ?? "[]");
      const it: LibraryItem = { id: String(Date.now()), title: name.replace(/\.[^.]+$/, ""), kind, file: name, size: bytes.length, created: Date.now(), meta: {} };
      LS.set(`file:${it.id}`, btoa(String.fromCharCode(...bytes.slice(0, 2_000_000))));
      items.unshift(it);
      LS.set("library", JSON.stringify(items));
      return it;
    }
    return invoke<LibraryItem>("library_add", bytes, { headers: { "x-name": encodeURIComponent(name), "x-kind": encodeURIComponent(kind) } });
  },
  async libraryRead(id: string): Promise<Uint8Array> {
    if (!isTauri) {
      const b = atob(LS.get(`file:${id}`) ?? "");
      return Uint8Array.from(b, (c) => c.charCodeAt(0));
    }
    const r = await invoke<ArrayBuffer>("library_read", { id });
    return new Uint8Array(r);
  },
  async libraryUpdate(id: string, title?: string, meta?: Record<string, unknown>): Promise<LibraryItem> {
    if (!isTauri) {
      const items: LibraryItem[] = JSON.parse(LS.get("library") ?? "[]");
      const it = items.find((x) => x.id === id)!;
      if (title) it.title = title;
      if (meta) it.meta = meta;
      LS.set("library", JSON.stringify(items));
      return it;
    }
    return invoke<LibraryItem>("library_update", { id, title: title ?? null, meta: meta ?? null });
  },
  async libraryDelete(id: string): Promise<void> {
    if (!isTauri) {
      LS.set("library", JSON.stringify((JSON.parse(LS.get("library") ?? "[]") as LibraryItem[]).filter((x) => x.id !== id)));
      return;
    }
    await invoke("library_delete", { id });
  },
  async storageInfo(): Promise<{ totalBytes: number; libraryBytes: number; items: number; dataDir: string }> {
    if (!isTauri) return { totalBytes: 0, libraryBytes: 0, items: 0, dataDir: "localStorage" };
    return invoke("storage_info");
  },
  async playerLoad(id: string): Promise<{ duration: number; peaks: number[] }> {
    if (!isTauri) throw new Error("El reproductor necesita la app instalada");
    return invoke("player_load", { id });
  },
  async playerControl(ctl: { play?: boolean; seek?: number; speed?: number; loopAb?: [number, number] | null; volume?: number; eq?: EqSettings; unload?: boolean }): Promise<void> {
    if (!isTauri) return;
    await invoke("player_control", { ctl });
  },
  async analyze(id: string, a4: number): Promise<Record<string, unknown>> {
    if (!isTauri) throw new Error("El análisis necesita la app instalada");
    return invoke("analyze_audio", { id, a4 });
  },
  async backupExport(password: string | null): Promise<Uint8Array> {
    if (!isTauri) {
      const kv: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)!;
        if (k.startsWith("mussify:") && !k.startsWith("mussify:file:")) kv[k.slice(8)] = localStorage.getItem(k)!;
      }
      return new TextEncoder().encode(JSON.stringify({ format: "mussify-backup", version: 1, encrypted: false, data: { kv } }, null, 2));
    }
    const r = await invoke<ArrayBuffer>("backup_export", { password, includeScores: true });
    return new Uint8Array(r);
  },
  async backupImport(bytes: Uint8Array, password: string | null): Promise<number> {
    if (!isTauri) {
      const env = JSON.parse(new TextDecoder().decode(bytes));
      for (const [k, v] of Object.entries(env.data.kv as Record<string, string>)) if (k !== "network.allowed") LS.set(k, v);
      return Object.keys(env.data.kv).length;
    }
    return invoke<number>("backup_import", bytes, { headers: { "x-password": encodeURIComponent(password ?? "") } });
  },
  async resetProgress(): Promise<void> {
    if (!isTauri) {
      for (const k of Object.keys(localStorage)) if (k.startsWith("mussify:") && !k.startsWith("mussify:file:") && k !== "mussify:library") localStorage.removeItem(k);
      return;
    }
    await invoke("reset_progress");
  },
  async netSettings(allowed?: boolean): Promise<boolean> {
    if (!isTauri) {
      if (allowed !== undefined) LS.set("network.allowed", String(allowed));
      return LS.get("network.allowed") === "true";
    }
    return invoke<boolean>("net_settings", { allowed: allowed ?? null });
  },
  async netLog(clear = false): Promise<NetEntry[]> {
    if (!isTauri) return [];
    return invoke<NetEntry[]>("net_log", { clear });
  },
  async toolsInfo(): Promise<ToolInfo> {
    if (!isTauri) return { supported: false, ytdlp: null, ytdlpVersion: null, ffmpeg: false, reason: "Solo disponible en la app de escritorio." };
    return invoke<ToolInfo>("tools_info");
  },
  async ytSearch(query: string): Promise<SearchResult[]> {
    return invoke<SearchResult[]>("yt_search", { query });
  },
  async ytDownload(id: string, title: string): Promise<LibraryItem> {
    return invoke<LibraryItem>("yt_download", { id, title });
  },
  async platform(): Promise<string> {
    if (!isTauri) return "web";
    return invoke<string>("platform");
  },
  /** Guarda bytes en un archivo elegido por el usuario (diálogo del sistema). */
  async saveFile(defaultName: string, bytes: Uint8Array): Promise<boolean> {
    if (!isTauri) {
      const url = URL.createObjectURL(new Blob([bytes as BlobPart]));
      const a = document.createElement("a");
      a.href = url;
      a.download = defaultName;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    }
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeFile } = await import("@tauri-apps/plugin-fs");
    const path = await save({ defaultPath: defaultName, filters: [{ name: "Respaldo de Mussify", extensions: ["json"] }] });
    if (!path) return false;
    await writeFile(path, bytes);
    return true;
  },
};

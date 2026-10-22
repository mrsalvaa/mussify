// SPDX-License-Identifier: GPL-3.0-or-later
// Navegación simple por estado (SPA sin rutas de URL).
import type { Branch } from "../core/curriculum/types";

export type Route =
  | { view: "home"; branch?: Branch }
  | { view: "lesson"; id: string }
  | { view: "session"; mode: "review" | "practice" | "weak" | "ear" | "reading" | "rhythm"; filter?: string; branch?: Branch | "all" }
  | { view: "placement"; branch: Branch }
  | { view: "practice" }
  | { view: "sight" }
  | { view: "songs" }
  | { view: "song"; id: string }
  | { view: "library" }
  | { view: "item"; id: string }
  | { view: "download" }
  | { view: "tools" }
  | { view: "metronome" }
  | { view: "instruments" }
  | { view: "glossary" }
  | { view: "journal" }
  | { view: "progress" }
  | { view: "settings" };

class Nav {
  route = $state<Route>({ view: "home" });
  stack: Route[] = [];
  go(r: Route) {
    this.stack.push(this.route);
    if (this.stack.length > 30) this.stack.shift();
    this.route = r;
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }
  back() {
    this.route = this.stack.pop() ?? { view: "home" };
  }
  reset(r: Route) {
    this.stack = [];
    this.route = r;
  }
}

export const nav = new Nav();

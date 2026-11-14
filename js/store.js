/** Tiny localStorage wrapper. Storage can be unavailable (private mode, file://); everything degrades to memory. */
export class Store {
  constructor(prefix = 'aphelion.') {
    this.prefix = prefix;
    this.mem = new Map();
  }
  get(key, fallback) {
    try {
      const v = localStorage.getItem(this.prefix + key);
      if (v != null) return JSON.parse(v);
    } catch { /* ignore */ }
    return this.mem.has(key) ? this.mem.get(key) : fallback;
  }
  set(key, value) {
    this.mem.set(key, value);
    try { localStorage.setItem(this.prefix + key, JSON.stringify(value)); } catch { /* ignore */ }
  }
}

/**
 * Terrain horizons from NASA LRO LOLA topography.
 *
 *  - Curated sites: horizon profiles pre-computed from full-resolution LOLA
 *    grids (240 m/px polar, 474 m/px global) and stored in data/horizons.json.
 *  - Custom sites: computed in the browser from the down-sampled LOLA tiles
 *    in data/dem/ (480 m/px south polar cap, 960 m/px north cap, 7.6 km/px
 *    global). The UI reports which grid was used.
 *  - If nothing loads (e.g. opened from file://), the exact bare-sphere
 *    horizon is used and labelled as such. Nothing is ever invented.
 *
 * Requires tools/lola-horizon.js loaded as a classic script (global LolaHorizon).
 */

const DATA_ROOT = 'data/';

export class TerrainService {
  constructor() {
    this.sites = {};          // id -> { ground_m, elevations, source }
    this.meta = null;
    this.dems = null;         // { south, north, global }
    this.ready = false;
    this.demsReady = false;
    this._customCache = new Map();
  }

  async load() {
    try {
      const res = await fetch(DATA_ROOT + 'horizons.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      const json = await res.json();
      this.meta = json.meta;
      for (const [id, s] of Object.entries(json.sites)) {
        this.sites[id] = {
          ground_m: s.ground_m,
          elevations: s.h.map(v => v / 100),
          source: s.source || json.meta?.source,
          kind: 'lola'
        };
      }
      this.ready = true;
    } catch (err) {
      console.warn('[terrain] horizons.json unavailable — falling back to bare-sphere horizons', err);
    }
    return this.ready;
  }

  async _loadDems() {
    const L = globalThis.LolaHorizon;
    if (!L) throw new Error('LolaHorizon not loaded');
    const ok = async url => { const r = await fetch(url); if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`); return r; };
    const meta = await (await ok(DATA_ROOT + 'dem/tiles.json')).json();
    const get = async t => {
      const buf = await (await ok(DATA_ROOT + 'dem/' + t.file)).arrayBuffer();
      if (buf.byteLength !== t.lines * t.samples * 2) throw new Error(`${t.file}: unexpected size`);
      return new Int16Array(buf);
    };
    const out = {};
    for (const t of meta.tiles) {
      const data = await get(t);
      out[t.id] = t.kind === 'polar'
        ? L.polarDEM({ data, lines: t.lines, samples: t.samples, scale: t.scale, lineOffset: t.lineOffset, sampleOffset: t.sampleOffset, pole: t.pole, name: t.label })
        : L.cylDEM({ data, rows: t.lines, samples: t.samples, res: t.res, lineOffset: t.lineOffset, sampleOffset: t.sampleOffset, centerLon: t.centerLon, name: t.label });
      out[t.id].label = t.label;
      out[t.id].dnScale = meta.dnScale ?? 0.5;
    }
    this.dems = out;
    this.demsReady = true;
    return out;
  }

  /** Load the DEM tiles once, on first use (they are a few MB). Resolves to true/false. */
  loadDems() {
    if (!this._demPromise) {
      this._demPromise = this._loadDems().then(() => true).catch(err => {
        console.warn('[terrain] DEM tiles unavailable — custom sites use the bare-sphere horizon', err);
        this.demError = String(err);
        return false;
      });
    }
    return this._demPromise;
  }

  /** Horizon + ground elevation for a curated site, or null. */
  forCurated(id) { return this.sites[id] || null; }

  /**
   * Horizon for arbitrary coordinates from the bundled tiles.
   * Returns null if the tiles are not loaded yet.
   */
  forCoordinates(lat, lon) {
    if (!this.dems) return null;
    const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (this._customCache.has(key)) return this._customCache.get(key);
    const L = globalThis.LolaHorizon;
    const { south, south960, north, global } = this.dems;
    // Highest-resolution grid first; rays fall back to coarser grids where a tile ends.
    const list = [];
    if (south && lat <= -84.5) list.push(south);
    if (south960 && lat <= -75) list.push(south960);
    if (north && lat >= 75) list.push(north);
    list.push(global);
    const first = list[0];
    const base = first.kind === 'polar' ? first.scale : 7600;
    const res = L.horizonProfile(lat, lon, list, list, { azSteps: 360, maxRangeM: 400000, nearRangeM: 400000, baseStepM: base });
    const out = {
      ground_m: res.ground_m, elevations: res.elevations, kind: 'lola', coarse: first === global,
      source: `LOLA ${first.label}, computed in your browser`
    };
    this._customCache.set(key, out);
    return out;
  }

  /** Load the pre-computed 84 km terrain patches for curated sites (2.4 MB, once). */
  loadPatches() {
    if (!this._patchPromise) {
      this._patchPromise = (async () => {
        const meta = await (await fetch(DATA_ROOT + 'patches.json')).json();
        const buf = await (await fetch(DATA_ROOT + 'patches.i16')).arrayBuffer();
        const n = meta.size * meta.size;
        if (buf.byteLength !== n * 2 * meta.sites.length) throw new Error('patches.i16: unexpected size');
        this.patches = { meta, data: new Int16Array(buf), n };
        return true;
      })().catch(err => { console.warn('[terrain] 3D patches unavailable', err); return false; });
    }
    return this._patchPromise;
  }

  /**
   * Terrain patch for the 3D view: { size, halfM, heights (m), ground (m), source }.
   * Curated sites use full-resolution pre-computed patches; other coordinates are
   * sampled from the bundled tiles (coarser). Returns null if nothing is loaded.
   */
  patchFor(site) {
    const p = this.patches;
    const i = p ? p.meta.sites.indexOf(site.id) : -1;
    if (i >= 0) {
      const heights = p.data.subarray(i * p.n, (i + 1) * p.n), c = (p.meta.size - 1) / 2;
      return { size: p.meta.size, halfM: p.meta.halfM, heights, ground: heights[c * p.meta.size + c], source: 'LOLA full-resolution patch' };
    }
    if (!this.dems) return null;
    const key = `${site.lat.toFixed(4)},${site.lon.toFixed(4)}`;
    this._patchCache ||= new Map();
    if (this._patchCache.has(key)) return this._patchCache.get(key);
    const L = globalThis.LolaHorizon;
    const list = [this.dems.south, this.dems.south960, this.dems.north, this.dems.global].filter(Boolean);
    const size = 141, halfM = 42000, step = 2 * halfM / (size - 1);
    const ground = L.heightFrom(list, site.lat, site.lon);
    const heights = new Int16Array(size * size);
    for (let j = 0; j < size; j++) for (let k = 0; k < size; k++) {
      const east = -halfM + k * step, north = halfM - j * step, d = Math.hypot(east, north);
      let h = ground;
      if (d > 1e-6) { const [la, lo] = L.destination(site.lat, site.lon, Math.atan2(east, north), d / L.R_M); const v = L.heightFrom(list, la, lo); if (Number.isFinite(v)) h = v; }
      heights[j * size + k] = Math.round(h);
    }
    const out = { size, halfM, heights, ground, source: 'LOLA bundled tiles (coarser)' };
    this._patchCache.set(key, out);
    return out;
  }

  /** Ground height (m) for arbitrary coordinates, or null. */
  groundAt(lat, lon) {
    if (!this.dems) return null;
    const L = globalThis.LolaHorizon;
    const list = [this.dems.south, this.dems.south960, this.dems.north, this.dems.global].filter(Boolean);
    const h = L.heightFrom(list, lat, lon);
    return Number.isFinite(h) ? h : null;
  }
}

#!/usr/bin/env node
/**
 * Builds Aphelion's data/ folder from primary sources. No dependencies (Node ≥ 18).
 *
 *   node tools/build-data.mjs              # LOLA horizons + DEM tiles (+ Horizons reference)
 *   node tools/build-data.mjs --terrain    # only LOLA-derived files
 *   node tools/build-data.mjs --horizons   # only the JPL Horizons reference table
 *
 * Downloads (cached in .cache/lola/, ~185 MB the first time):
 *   NASA PDS Geosciences Node — LRO LOLA Gridded Data Records (LRO-L-LOLA-4-GDR-V1.0)
 *     polar/img/ldem_60s_240m.img, polar/img/ldem_75n_240m.img,
 *     cylindrical/img/ldem_16.img, cylindrical/img/ldem_4.img,
 *     cylindrical/img/ldem_64.img (HTTP range reads around non-polar sites only)
 *
 * Writes:
 *   data/horizons.json            terrain horizon (1° azimuth steps) + ground height per curated site
 *   data/patches.i16, .json       84 km LOLA terrain patch per curated site for the 3D view
 *   data/dem/*.i16, tiles.json    down-sampled LOLA grids for custom sites in the browser
 *   data/horizons-reference.json  JPL Horizons Sun/Earth AZ/EL for validation (tools/validate.mjs)
 */
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { SITES } from '../js/sites.js';
import { fetchReference } from './horizons-fetch.mjs';

const require = createRequire(import.meta.url);
const L = require('./lola-horizon.js');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = path.join(root, '.cache', 'lola');
const dataDir = path.join(root, 'data');
const PDS = 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/';

const args = new Set(process.argv.slice(2));
const doTerrain = !args.has('--horizons') || args.has('--terrain');
const doHorizons = !args.has('--terrain') || args.has('--horizons');

const log = (...a) => console.log('[build-data]', ...a);

async function exists(p) { try { await stat(p); return true; } catch { return false; } }

async function download(rel) {
  const file = path.join(cacheDir, path.basename(rel));
  if (await exists(file)) return readFile(file);
  log('downloading', rel);
  const res = await fetch(PDS + rel);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${rel}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(cacheDir, { recursive: true });
  await writeFile(file, buf);
  return buf;
}

async function label(rel) {
  const t = (await download(rel)).toString('latin1');
  const g = k => Number((t.match(new RegExp(`\\b${k}\\s*=\\s*([-\\d.]+)`)) || [])[1]);
  return {
    lines: g('LINES'), samples: g('LINE_SAMPLES'), scale: g('MAP_SCALE'), res: g('MAP_RESOLUTION'),
    L0: g('LINE_PROJECTION_OFFSET'), S0: g('SAMPLE_PROJECTION_OFFSET'), sf: g('SCALING_FACTOR'),
    centerLon: g('CENTER_LONGITUDE')
  };
}

const i16 = buf => new Int16Array(buf.buffer, buf.byteOffset, buf.byteLength / 2);

async function polar(name, pole) {
  const lb = await label(`polar/img/${name}.lbl`);
  const data = i16(await download(`polar/img/${name}.img`));
  const dem = L.polarDEM({ data, lines: lb.lines, samples: lb.samples, scale: lb.scale, lineOffset: lb.L0, sampleOffset: lb.S0, pole, dnScale: lb.sf, name });
  return { dem, lb, data };
}

async function cylFull(name) {
  const lb = await label(`cylindrical/img/${name}.lbl`);
  const data = i16(await download(`cylindrical/img/${name}.img`));
  return { dem: L.cylDEM({ data, rows: lb.lines, samples: lb.samples, res: lb.res, lineOffset: lb.L0, sampleOffset: lb.S0, centerLon: lb.centerLon, dnScale: lb.sf, name }), lb, data };
}

async function cylWindow(name, lat, padDeg) {
  const lb = await label(`cylindrical/img/${name}.lbl`);
  const r0 = Math.max(0, Math.floor(lb.L0 - (lat + padDeg) * lb.res));
  const r1 = Math.min(lb.lines - 1, Math.ceil(lb.L0 - (lat - padDeg) * lb.res));
  const rowBytes = lb.samples * 2;
  const cacheFile = path.join(cacheDir, `${name}_rows_${r0}_${r1}.img`);
  let buf;
  if (await exists(cacheFile)) buf = await readFile(cacheFile);
  else {
    log('range read', name, `rows ${r0}-${r1}`);
    const res = await fetch(PDS + `cylindrical/img/${name}.img`, { headers: { Range: `bytes=${r0 * rowBytes}-${(r1 + 1) * rowBytes - 1}` } });
    if (res.status !== 206) throw new Error(`Range request not honoured (${res.status})`);
    buf = Buffer.from(await res.arrayBuffer());
    await mkdir(cacheDir, { recursive: true });
    await writeFile(cacheFile, buf);
  }
  const data = i16(buf);
  return L.cylDEM({ data, rowStart: r0, rows: r1 - r0 + 1, samples: lb.samples, res: lb.res, lineOffset: lb.L0, sampleOffset: lb.S0, centerLon: lb.centerLon, dnScale: lb.sf, name });
}

function cropPolar(src, srcN, srcL0, latEdgeAbs, scale) {
  const half = Math.ceil(2 * L.R_M * Math.tan((90 - latEdgeAbs) / 2 * Math.PI / 180) / scale) + 2;
  const start = Math.round(srcL0 - half + 0.5);
  const n = 2 * half;
  const out = new Int16Array(n * n);
  for (let r = 0; r < n; r++) out.set(src.subarray((start + r) * srcN + start, (start + r) * srcN + start + n), r * n);
  return { data: out, n, L0: srcL0 - start };
}

async function buildTerrain() {
  const south = await polar('ldem_60s_240m', 'S');
  const north = await polar('ldem_75n_240m', 'N');
  const g16 = await cylFull('ldem_16');
  const g4 = await cylFull('ldem_4');

  const sites = {};
  const PSIZE = 181, PHALF = 42000, pstep = 2 * PHALF / (PSIZE - 1);
  const patches = new Int16Array(SITES.length * PSIZE * PSIZE);
  let pi = 0;
  for (const s of SITES) {
    let near, far, source;
    if (s.lat <= -60) { near = far = [south.dem]; source = 'LOLA LDEM_60S_240M (240 m/px)'; }
    else if (s.lat >= 75) { near = far = [north.dem, g16.dem]; source = 'LOLA LDEM_75N_240M (240 m/px)'; }
    else {
      const win = await cylWindow('ldem_64', s.lat, 1.5);
      near = [win, g16.dem]; far = [g16.dem];
      source = 'LOLA LDEM_64 (474 m/px) to 40 km, LDEM_16 (1.9 km/px) beyond';
    }
    const base = s.lat <= -60 || s.lat >= 75 ? 240 : 474;
    const r = L.horizonProfile(s.lat, s.lon, near, far, { azSteps: 360, maxRangeM: 400000, nearRangeM: 40000, baseStepM: base });
    sites[s.id] = { ground_m: Math.round(r.ground_m), h: r.elevations.map(v => Math.round(v * 100)), source };
    // 84 km terrain patch for the 3D view (local east/north offsets, metres above the sphere)
    for (let j = 0; j < PSIZE; j++) for (let i = 0; i < PSIZE; i++) {
      const east = -PHALF + i * pstep, north = PHALF - j * pstep, d = Math.hypot(east, north);
      let h = r.ground_m;
      if (d > 1e-6) { const [la, lo] = L.destination(s.lat, s.lon, Math.atan2(east, north), d / L.R_M); const v = L.heightFrom(near, la, lo); if (Number.isFinite(v)) h = v; }
      patches[pi * PSIZE * PSIZE + j * PSIZE + i] = Math.round(h);
    }
    pi++;
    log(s.id.padEnd(16), `ground ${String(Math.round(r.ground_m)).padStart(6)} m`, `max horizon ${Math.max(...r.elevations).toFixed(2)}°`);
  }
  await mkdir(path.join(dataDir, 'dem'), { recursive: true });
  await writeFile(path.join(dataDir, 'horizons.json'), JSON.stringify({
    meta: {
      generated: new Date().toISOString(),
      generator: 'tools/build-data.mjs + tools/lola-horizon.js',
      method: 'Ray-marched maximum terrain elevation angle every 1° of azimuth out to 400 km, exact spherical geometry, no refraction, observer 2 m above LOLA ground. h[] = elevation angle × 100 (deg), index = azimuth (deg from north, clockwise).',
      source: 'NASA PDS Geosciences Node, LRO-L-LOLA-4-GDR-V1.0 (Smith et al. 2010, Space Sci. Rev. 150)'
    },
    sites
  }));

  await writeFile(path.join(dataDir, 'patches.i16'), Buffer.from(patches.buffer));
  await writeFile(path.join(dataDir, 'patches.json'), JSON.stringify({ generated: new Date().toISOString(), size: PSIZE, halfM: PHALF, unit: 'LOLA height in metres above the 1737.4 km sphere; row 0 = north edge, column 0 = west edge, local tangent offsets', sites: SITES.map(x => x.id) }));

  // ---- DEM tiles for custom sites ----
  const tiles = [];
  const write = async (id, file, arr, meta) => { await writeFile(path.join(dataDir, 'dem', file), Buffer.from(arr.buffer)); tiles.push({ id, file, ...meta }); };
  const s240 = cropPolar(south.data, south.lb.lines, south.lb.L0, 84.5, south.lb.scale);
  await write('south', 'south_84s_240m.i16', s240.data, { kind: 'polar', pole: 'S', lines: s240.n, samples: s240.n, scale: south.lb.scale, lineOffset: s240.L0, sampleOffset: s240.L0, label: 'LDEM_60S_240M crop to 84.5°S (240 m/px)' });
  const ds = L.downsample(south.data, south.lb.lines, 4);
  const s960 = cropPolar(ds.data, ds.n, (south.lb.L0 + 0.5) / 4 - 0.5, 75, south.lb.scale * 4);
  await write('south960', 'south_75s_960m.i16', s960.data, { kind: 'polar', pole: 'S', lines: s960.n, samples: s960.n, scale: south.lb.scale * 4, lineOffset: s960.L0, sampleOffset: s960.L0, label: 'LDEM_60S_240M mean-binned to 960 m/px, to 75°S' });
  const dn = L.downsample(north.data, north.lb.lines, 4);
  await write('north', 'north_75n_960m.i16', dn.data, { kind: 'polar', pole: 'N', lines: dn.n, samples: dn.n, scale: north.lb.scale * 4, lineOffset: (north.lb.L0 + 0.5) / 4 - 0.5, sampleOffset: (north.lb.S0 + 0.5) / 4 - 0.5, label: 'LDEM_75N_240M mean-binned to 960 m/px' });
  await write('global', 'global_ldem4.i16', g4.data.slice(), { kind: 'cyl', lines: g4.lb.lines, samples: g4.lb.samples, res: g4.lb.res, lineOffset: g4.lb.L0, sampleOffset: g4.lb.S0, centerLon: g4.lb.centerLon, label: 'LDEM_4 global (7.6 km/px)' });
  await writeFile(path.join(dataDir, 'dem', 'tiles.json'), JSON.stringify({ generated: new Date().toISOString(), dnScale: 0.5, tiles }, null, 1));
  log('wrote data/horizons.json and', tiles.length, 'DEM tiles');
  return sites;
}

async function buildHorizons(sites) {
  let ground = {};
  if (sites) ground = Object.fromEntries(Object.entries(sites).map(([k, v]) => [k, v.ground_m]));
  else if (await exists(path.join(dataDir, 'horizons.json'))) {
    const j = JSON.parse(await readFile(path.join(dataDir, 'horizons.json'), 'utf8'));
    ground = Object.fromEntries(Object.entries(j.sites).map(([k, v]) => [k, v.ground_m]));
  }
  const ref = await fetchReference({ start: new Date(), days: 30, stepHours: 24, ground });
  await writeFile(path.join(dataDir, 'horizons-reference.json'), JSON.stringify(ref));
  log('wrote data/horizons-reference.json with', ref.cases.length, 'tables');
}

let sites = null;
if (doTerrain) sites = await buildTerrain();
if (doHorizons) await buildHorizons(sites);

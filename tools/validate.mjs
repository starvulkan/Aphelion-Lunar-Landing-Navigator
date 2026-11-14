#!/usr/bin/env node
/**
 * Compare Aphelion's ephemeris engine with NASA/JPL Horizons.
 *
 *   node tools/validate.mjs                 # uses data/horizons-reference.json
 *   node tools/validate.mjs --live          # fetches fresh values from Horizons first
 *
 * Prints per-case and overall residuals (app minus Horizons) in degrees.
 * Exit code 1 if any elevation residual exceeds the tolerance (default 0.1°).
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { EphemerisCalculator } from '../js/ephemeris.js';
import { fetchReference } from './horizons-fetch.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOL = Number(process.env.APHELION_TOL || 0.1);

const live = process.argv.includes('--live');
const ref = live
  ? await fetchReference()
  : JSON.parse(await readFile(path.join(root, 'data/horizons-reference.json'), 'utf8'));

const eph = new EphemerisCalculator();
const start = new Date(ref.meta.start).getTime();
const stepMs = ref.meta.stepHours * 3600000;
const wrap = d => ((d + 540) % 360) - 180;

let worstEl = 0, worstAz = 0, n = 0, sumEl = 0;
console.log(`Reference: ${ref.meta.source}\nRetrieved: ${ref.meta.retrieved}\n`);
console.log('site'.padEnd(16), 'body '.padEnd(6), 'max|dEl|°'.padStart(10), 'mean|dEl|°'.padStart(11), 'max|dAz|° (el>-80°)'.padStart(21));
for (const c of ref.cases) {
  const site = { lat: c.lat, lon: c.lon, elevation: c.altKm * 1000 };
  let maxEl = 0, maxAz = 0, s = 0;
  c.rows.forEach(([az, el], i) => {
    const st = eph.rawState(site, new Date(start + i * stepMs));
    const b = c.target === 'Sun' ? st.solar : st.earth;
    const dEl = Math.abs(b.elevation - el);
    // Azimuth is ill-defined near the zenith/nadir; scale by cos(el) for a fair angular error.
    const dAz = Math.abs(wrap(b.azimuth - az)) * Math.cos(el * Math.PI / 180);
    maxEl = Math.max(maxEl, dEl); s += dEl;
    if (Math.abs(el) < 80) maxAz = Math.max(maxAz, dAz);
  });
  worstEl = Math.max(worstEl, maxEl); worstAz = Math.max(worstAz, maxAz);
  sumEl += s; n += c.rows.length;
  console.log(c.site.padEnd(16), c.target.padEnd(6), maxEl.toFixed(4).padStart(10), (s / c.rows.length).toFixed(4).padStart(11), maxAz.toFixed(4).padStart(21));
}
console.log(`\nAll ${n} samples: worst |dEl| = ${worstEl.toFixed(4)}°, mean |dEl| = ${(sumEl / n).toFixed(4)}°, worst cos(el)·|dAz| = ${worstAz.toFixed(4)}°`);
console.log(`For scale: the Sun's disc is ~0.53° wide; Earth's disc seen from the Moon is ~1.9° wide.`);
if (worstEl > TOL) { console.error(`FAIL: residual above tolerance ${TOL}°`); process.exit(1); }
console.log(`PASS (tolerance ${TOL}°)`);

#!/usr/bin/env node
/**
 * Checks Aphelion's live season analysis against the team's report
 * (JPL Horizons DE441 daily series): date and value of each year's most
 * southerly sub-solar latitude, and the SAOQ >= 90 % window.
 * Tolerance: minimum within 0.005 deg and the same day; window edges within 1 day
 * (edges sit where the curve crosses the threshold very slowly).
 */
import { EphemerisCalculator } from '../js/ephemeris.js';
import { seasonYear, REPORT_WINDOWS } from '../js/season.js';

const eph = new EphemerisCalculator();
const iso = t => new Date(t).toISOString().slice(0, 10);
const dayDiff = (a, b) => Math.abs(Date.parse(a) - Date.parse(b)) / 86400000;
let ok = true;
console.log('year  minimum (app / report)                         window >= 90 % (app / report)');
for (const r of REPORT_WINDOWS) {
  const s = seasonYear(eph, r.year);
  const pass = iso(s.min.t) === r.min && Math.abs(s.min.lat - r.minLat) < 0.005 &&
    dayDiff(iso(s.window.start), r.start) <= 1 && dayDiff(iso(s.window.end), r.end) <= 1;
  ok &&= pass;
  console.log(`${r.year}  ${iso(s.min.t)} ${s.min.lat.toFixed(4)}° / ${r.min} ${r.minLat.toFixed(4)}°   ${iso(s.window.start)}…${iso(s.window.end)} / ${r.start}…${r.end}  ${pass ? 'ok' : 'MISMATCH'}`);
}
console.log(ok ? 'PASS' : 'FAIL');
process.exit(ok ? 0 : 1);

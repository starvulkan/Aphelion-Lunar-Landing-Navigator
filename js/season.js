/**
 * Season and pattern analysis.
 *
 * Follows the team's report "Lunar South Pole Mission Opportunity — Astronomical
 * Windows, Illumination Geometry, and Lunar-Cycle Timing" (JPL Horizons DE441,
 * 2010–2030), which screens landing dates with the latitude of the sub-solar
 * point and an index it defines:
 *
 *     SAOQ = 100 × min[1, max(0, −SunSubLat / 1.59°)]
 *
 * The report took SunSub-LAT from Horizons once a day. Here it is computed live
 * by js/ephemeris.js for any year; tools/validate-season.mjs checks the result
 * against the report's published minima and ≥ 90 % windows.
 *
 * SAOQ is a seasonal screening index for the SOUTH pole. It is not a sunlight
 * percentage: the app pairs it with the terrain-based sunlight of the selected
 * site so the two can be compared directly.
 */
const DAY = 86400000;
export const SAOQ_REF_DEG = 1.59;
export const saoq = subSolarLat => 100 * Math.min(1, Math.max(0, -subSolarLat / SAOQ_REF_DEG));

/** Daily sub-solar latitude and SAOQ for a calendar year (00:00 UTC, like the report). */
export function seasonYear(eph, year) {
  const days = [];
  for (let t = Date.UTC(year, 0, 1); t < Date.UTC(year + 1, 0, 1); t += DAY) {
    const lat = eph.subPoints(new Date(t)).sun.lat;
    days.push({ t, lat, saoq: saoq(lat) });
  }
  let min = days[0];
  for (const d of days) if (d.lat < min.lat) min = d;
  // Longest continuous run with SAOQ >= 90 %.
  let best = null, cur = null;
  for (const d of days) {
    if (d.saoq >= 90) { cur = cur ? { start: cur.start, end: d.t, n: cur.n + 1 } : { start: d.t, end: d.t, n: 1 }; if (!best || cur.n > best.n) best = cur; }
    else cur = null;
  }
  return { year, days, min, window: best };
}

/**
 * Terrain-based scan of one site over a year.
 * @returns per-day stay statistics plus detected patterns.
 */
export function siteYear(eph, site, year, stayDays, stepH = 2, preferFrom = 0) {
  const hz = site.horizon;
  const t0 = Date.UTC(year, 0, 1);
  const nDays = Math.round((Date.UTC(year + 1, 0, 1) - t0) / DAY);
  const perDay = 24 / stepH;
  const n = Math.ceil((nDays + stayDays) * perDay) + 1;
  const sun = new Uint8Array(n), earth = new Uint8Array(n);
  const cs = new Uint32Array(n + 1), ce = new Uint32Array(n + 1), cb = new Uint32Array(n + 1);
  for (let i = 0; i < n; i++) {
    const st = eph.rawState(site, new Date(t0 + i * stepH * 3600000));
    const v = eph.visibility(st, hz);
    sun[i] = v.solarVisible ? 1 : 0; earth[i] = v.earthVisible ? 1 : 0;
    cs[i + 1] = cs[i] + sun[i]; ce[i + 1] = ce[i] + earth[i]; cb[i + 1] = cb[i] + (sun[i] & earth[i]);
  }
  const w = Math.round(stayDays * perDay);
  const days = [];
  for (let d = 0; d < nDays; d++) {
    const a = d * perDay, b = a + w;
    days.push({ t: t0 + d * DAY, sun: (cs[b] - cs[a]) / w, earth: (ce[b] - ce[a]) / w, both: (cb[b] - cb[a]) / w });
  }
  // Longest unbroken runs inside the calendar year.
  const run = (arr, want) => {
    let best = { len: 0, start: 0 }, len = 0;
    const lim = nDays * perDay;
    for (let i = 0; i < lim; i++) {
      if (arr[i] === want) { len++; if (len > best.len) best = { len, start: i - len + 1 }; } else len = 0;
    }
    return { days: best.len * stepH / 24, t: t0 + best.start * stepH * 3600000 };
  };
  // Best landing day: most "both", then most sunlight.
  // Ties go to the first such day on or after `preferFrom` (the current landing date), else the first in the year.
  let top = days[0];
  for (const d of days) if (d.both > top.both + 1e-9 || (Math.abs(d.both - top.both) < 1e-9 && d.sun > top.sun + 1e-9)) top = d;
  const tied = days.filter(d => Math.abs(d.both - top.both) < 1e-9 && Math.abs(d.sun - top.sun) < 1e-9);
  const best = tied.find(d => d.t >= preferFrom) || tied[0];
  return {
    year, stayDays, days, best,
    longestSun: run(sun, 1), longestDark: run(sun, 0), longestNoEarth: run(earth, 0),
    yearSun: cs[nDays * perDay] / (nDays * perDay), yearEarth: ce[nDays * perDay] / (nDays * perDay)
  };
}

/** Pearson correlation between two equal-length series (null if either is constant). */
export function correlation(a, b) {
  const n = Math.min(a.length, b.length);
  let sa = 0, sb = 0;
  for (let i = 0; i < n; i++) { sa += a[i]; sb += b[i]; }
  const ma = sa / n, mb = sb / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; num += x * y; da += x * x; db += y * y; }
  if (da < 1e-12 || db < 1e-12) return null;
  return num / Math.sqrt(da * db);
}

/** Values published in the team's report (Table "High-opportunity windows"), used for validation. */
export const REPORT_WINDOWS = [
  { year: 2026, start: '2026-10-30', end: '2026-12-09', min: '2026-11-14', minLat: -1.557279 },
  { year: 2027, start: '2027-10-09', end: '2027-11-18', min: '2027-11-07', minLat: -1.552349 },
  { year: 2028, start: '2028-09-23', end: '2028-11-04', min: '2028-10-04', minLat: -1.576077 },
  { year: 2029, start: '2029-08-30', end: '2029-10-10', min: '2029-09-24', minLat: -1.587757 }
];

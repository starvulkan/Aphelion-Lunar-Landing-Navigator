/**
 * Fetch Sun/Earth topocentric AZ/EL tables from the NASA/JPL Horizons API.
 * Used by tools/validate.mjs --live and tools/build-data.mjs --horizons.
 * Horizons docs: https://ssd-api.jpl.nasa.gov/doc/horizons.html
 */
export const REFERENCE_SITES = {
  'sp-pole': [-90, 0],
  'art-malapert': [-85.9756, -2.1124],
  'art-slater': [-86.96, 126.82],
  'im2': [-84.7906, 29.1957],
  'a11': [0.67408, 23.47297],
  'ce4': [-45.4446, 177.5991],
  'ref-subearth': [0, 0]
};

const API = 'https://ssd.jpl.nasa.gov/api/horizons.api';

export function horizonsUrl({ target, lat, lon, altKm, start, stop, step }) {
  const p = new URLSearchParams({
    format: 'text', COMMAND: `'${target}'`, OBJ_DATA: 'NO', MAKE_EPHEM: 'YES', EPHEM_TYPE: 'OBSERVER',
    CENTER: "'coord@301'", COORD_TYPE: 'GEODETIC', SITE_COORD: `'${lon},${lat},${altKm}'`,
    START_TIME: `'${start}'`, STOP_TIME: `'${stop}'`, STEP_SIZE: `'${step}'`,
    QUANTITIES: "'4'", ANG_FORMAT: 'DEG', EXTRA_PREC: 'YES'
  });
  return `${API}?${p}`;
}

export function parseTable(text) {
  const rows = [];
  let on = false;
  for (const line of text.split('\n')) {
    if (line.includes('$$SOE')) { on = true; continue; }
    if (line.includes('$$EOE')) break;
    if (!on) continue;
    const m = line.match(/^\s*(\S+ \S+)\s+\S*\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)/);
    if (m) rows.push([+m[2], +m[3]]);
  }
  return rows;
}

/**
 * @param {object} opts { start: Date, days, stepHours, ground: {id: metres} }
 */
export async function fetchReference({ start = new Date(), days = 30, stepHours = 24, ground = {} } = {}) {
  const day0 = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const iso = d => d.toISOString().slice(0, 16).replace('T', ' ');
  const stop = new Date(day0.getTime() + days * 86400000);
  const cases = [];
  for (const [site, [lat, lon]] of Object.entries(REFERENCE_SITES)) {
    const altKm = +(((ground[site] ?? 0) + 2) / 1000).toFixed(4);
    for (const [target, name] of [['10', 'Sun'], ['399', 'Earth']]) {
      const url = horizonsUrl({ target, lat, lon, altKm, start: iso(day0), stop: iso(stop), step: `${stepHours}h` });
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Horizons HTTP ${res.status} for ${site}/${name}`);
      const rows = parseTable(await res.text());
      if (!rows.length) throw new Error(`Horizons returned no rows for ${site}/${name}`);
      cases.push({ site, lat, lon, altKm, target: name, rows });
      await new Promise(r => setTimeout(r, 400)); // be polite to the API
    }
  }
  return {
    meta: {
      source: 'NASA/JPL Horizons API (https://ssd.jpl.nasa.gov/api/horizons.api), observer table, QUANTITIES=4 (apparent AZ/EL, airless), CENTER=coord@301 GEODETIC, EXTRA_PREC=YES',
      retrieved: new Date().toISOString(),
      start: day0.toISOString(),
      stepHours,
      count: days / (stepHours / 24) + 1
    },
    cases
  };
}

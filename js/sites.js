/**
 * Curated landing-site catalogue.
 *
 * Coordinates: planetocentric latitude, east-positive longitude (−180…180),
 * Mean Earth / Polar Axis frame — the same frame used by LOLA and by
 * JPL Horizons' "coord@301" topocentric sites.
 *
 * Ground elevation is NOT typed in by hand: it is sampled from the LOLA DEM
 * when data/horizons.json is generated (see tools/build-data.mjs) and merged
 * in at runtime. Each entry carries `src`, a short citation for its
 * coordinates; full references are in DATA_SOURCES.md.
 *
 * `kind` says what the point is:
 *   'landed'    — an actual touchdown / impact point measured from orbit
 *   'target'    — a published target point of a planned or failed mission
 *   'region'    — a reference point inside an Artemis candidate region
 *                 (regions are ~15 × 15 km; the point is NOT an official landing site)
 *   'feature'   — an IAU-named feature centre or a geometric reference point
 */

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'artemis', label: 'Artemis regions' },
  { id: 'polar', label: 'South pole' },
  { id: 'landed', label: 'Landed' },
  { id: 'planned', label: 'Planned' },
  { id: 'apollo', label: 'Apollo' },
  { id: 'reference', label: 'Reference' },
  { id: 'custom', label: 'Custom' }
];

const S = {
  lsj: 'Davies & Colvin (2000), JGR 105(E8); NASA Apollo Lunar Surface Journal',
  lroc: 'LROC (Arizona State Univ.) post-landing NAC localisation',
  iau: 'IAU/USGS Gazetteer of Planetary Nomenclature',
  resgat: 'ResGAT-F (2025), Int. J. Digital Earth, doi:10.1080/17538947.2025.2547291, Table 4 region centre',
  esa: 'De Rosa et al. (2012) Planet. Space Sci. 74, Table 2 region centre',
  nasaClps: 'NASA CLPS AGU poster (2025), NTRS 20250011367'
};

export const SITES = [
  /* ---------------- Artemis candidate regions (NASA, Oct 2024) ------------ */
  { id: 'art-pcb', name: 'Peak near Cabeus B', cat: ['artemis', 'polar'], kind: 'region', lat: -83.54, lon: -68.15, src: S.resgat,
    note: 'Artemis candidate region. Lowest-latitude of the nine; strong Earth visibility.' },
  { id: 'art-haworth', name: 'Haworth', cat: ['artemis', 'polar'], kind: 'region', lat: -86.70, lon: -23.70, src: 'LROC NAC ROI mosaic HAWORTH (centre 86.7°S, 336.3°E)',
    note: 'Artemis candidate region between Haworth crater and the Malapert massif.' },
  { id: 'art-malapert', name: 'Malapert Massif', cat: ['artemis', 'polar'], kind: 'region', lat: -85.9756, lon: -2.1124, src: S.esa + ' ("Malapert Peak")',
    note: 'Artemis candidate region on a ~5 km-high massif almost exactly on the 0° meridian, so Earth stays high in the sky.' },
  { id: 'art-mmp', name: 'Mons Mouton Plateau', cat: ['artemis', 'polar'], kind: 'region', lat: -85.67, lon: 24.45, src: S.resgat,
    note: 'Largest and flattest Artemis candidate region.' },
  { id: 'art-mm', name: 'Mons Mouton', cat: ['artemis', 'polar'], kind: 'region', lat: -84.60, lon: 31.00, src: S.iau + ' (feature centre)',
    note: 'Flat-topped massif ~6 km high. IM-2 landed on it in March 2025; VIPER is planned to go here.' },
  { id: 'art-nr1', name: 'Nobile Rim 1', cat: ['artemis', 'polar'], kind: 'region', lat: -85.28, lon: 37.01, src: S.resgat },
  { id: 'art-nr2', name: 'Nobile Rim 2', cat: ['artemis', 'polar'], kind: 'region', lat: -84.05, lon: 57.33, src: S.resgat },
  { id: 'art-dgr2', name: 'de Gerlache Rim 2', cat: ['artemis', 'polar'], kind: 'region', lat: -88.13, lon: -74.37, src: S.resgat },
  { id: 'art-slater', name: 'Slater Plain', cat: ['artemis', 'polar'], kind: 'region', lat: -86.96, lon: 126.82, src: S.resgat,
    note: 'Far-side-facing region; Earth is often below the horizon.' },

  /* ---------------- Other south-polar points ------------------------------ */
  { id: 'sp-ridge', name: 'Shackleton–de Gerlache connecting ridge', cat: ['polar'], kind: 'region', lat: -89.4679, lon: -137.411, src: S.esa + ' ("Connecting Ridge")',
    note: 'One of the best-lit places on the Moon. Target region of Blue Origin\'s Blue Moon MK1 "Endurance".' },
  { id: 'sp-dgrim', name: 'de Gerlache rim (2022 region)', cat: ['polar'], kind: 'region', lat: -88.6952, lon: -68.2846, src: S.esa + ' ("de Gerlache Rim")' },
  { id: 'sp-pole', name: 'Geographic south pole', cat: ['polar', 'reference'], kind: 'feature', lat: -90, lon: 0, src: 'Definition (rotation axis)',
    note: 'Sits on the rim of Shackleton crater.' },
  { id: 'sp-shackleton', name: 'Shackleton crater (floor centre)', cat: ['polar', 'reference'], kind: 'feature', lat: -89.67, lon: 129.78, src: S.iau,
    note: 'A permanently shadowed crater floor: the Sun never clears the rim.' },

  /* ---------------- Landed missions -------------------------------------- */
  { id: 'im2', name: 'IM-2 Athena', org: 'Intuitive Machines / NASA CLPS', cat: ['landed', 'polar'], kind: 'landed', lat: -84.7906, lon: 29.1957, date: '2025-03-06', src: S.lroc,
    note: 'Southernmost landing so far. Tipped over on landing.' },
  { id: 'im1', name: 'IM-1 Odysseus', org: 'Intuitive Machines / NASA CLPS', cat: ['landed', 'polar'], kind: 'landed', lat: -80.13, lon: 1.44, date: '2024-02-22', src: S.nasaClps,
    note: 'First commercial soft landing; near Malapert A.' },
  { id: 'cy3', name: 'Chandrayaan-3 (Shiv Shakti Point)', org: 'ISRO', cat: ['landed'], kind: 'landed', lat: -69.3733, lon: 32.3191, date: '2023-08-23', src: S.lroc },
  { id: 'slim', name: 'SLIM', org: 'JAXA', cat: ['landed'], kind: 'landed', lat: -13.3160, lon: 25.2510, date: '2024-01-19', src: 'JAXA SLIM mission release (Jan 2024)',
    note: 'Pinpoint landing near Shioli crater.' },
  { id: 'bg1', name: 'Blue Ghost Mission 1', org: 'Firefly / NASA CLPS', cat: ['landed'], kind: 'landed', lat: 18.56, lon: 61.81, date: '2025-03-02', src: 'Firefly Aerospace / NASA (Mar 2025)',
    note: 'Mare Crisium, near Mons Latreille. First fully successful CLPS landing.' },
  { id: 'ce6', name: 'Chang\'e 6', org: 'CNSA', cat: ['landed'], kind: 'landed', lat: -41.6385, lon: -153.9852, date: '2024-06-01', src: S.lroc,
    note: 'Far side, Apollo basin — no direct Earth line of sight.' },
  { id: 'ce5', name: 'Chang\'e 5', org: 'CNSA', cat: ['landed'], kind: 'landed', lat: 43.0576, lon: -51.9161, date: '2020-12-01', src: S.lroc },
  { id: 'ce4', name: 'Chang\'e 4', org: 'CNSA', cat: ['landed'], kind: 'landed', lat: -45.4446, lon: 177.5991, date: '2019-01-03', src: S.lroc,
    note: 'First far-side landing, relayed via Queqiao.' },
  { id: 'ce3', name: 'Chang\'e 3', org: 'CNSA', cat: ['landed'], kind: 'landed', lat: 44.1214, lon: -19.5116, date: '2013-12-14', src: S.lroc },
  { id: 'hakuto1', name: 'HAKUTO-R M1 (impact site)', org: 'ispace', cat: ['landed'], kind: 'landed', lat: 47.581, lon: 44.094, date: '2023-04-25', src: S.lroc,
    note: 'Crashed during descent near Atlas crater.' },

  /* ---------------- Planned / failed targets ------------------------------ */
  { id: 'ce7', name: 'Chang\'e 7 (target)', org: 'CNSA', cat: ['planned', 'polar'], kind: 'target', lat: -88.8, lon: 123.4, date: '2027', src: 'Wang C. et al. (2024) Natl. Sci. Rev.; launch delayed to 2027 (CNSA, Aug 2026)',
    note: 'Ridge on the illuminated rim of Shackleton crater.' },
  { id: 'im3', name: 'IM-3 Reiner Gamma (target)', org: 'Intuitive Machines / NASA CLPS', cat: ['planned'], kind: 'target', lat: 7.5, lon: -59.0, date: '2027', src: S.iau + ' (Reiner Gamma swirl centre)' },
  { id: 'luna25', name: 'Luna 25 (intended site)', org: 'Roscosmos', cat: ['planned'], kind: 'target', lat: -69.545, lon: 43.544, date: '2023 (lost)', src: 'Roscosmos / IKI (2023)',
    note: 'Spacecraft crashed before landing.' },

  /* ---------------- Apollo ----------------------------------------------- */
  { id: 'a11', name: 'Apollo 11 · Tranquility Base', cat: ['apollo', 'landed'], kind: 'landed', lat: 0.67408, lon: 23.47297, date: '1969-07-20', src: S.lsj },
  { id: 'a12', name: 'Apollo 12 · Ocean of Storms', cat: ['apollo', 'landed'], kind: 'landed', lat: -3.01239, lon: -23.42157, date: '1969-11-19', src: S.lsj },
  { id: 'a14', name: 'Apollo 14 · Fra Mauro', cat: ['apollo', 'landed'], kind: 'landed', lat: -3.64530, lon: -17.47136, date: '1971-02-05', src: S.lsj },
  { id: 'a15', name: 'Apollo 15 · Hadley–Apennine', cat: ['apollo', 'landed'], kind: 'landed', lat: 26.13222, lon: 3.63386, date: '1971-07-30', src: S.lsj },
  { id: 'a16', name: 'Apollo 16 · Descartes', cat: ['apollo', 'landed'], kind: 'landed', lat: -8.97301, lon: 15.50019, date: '1972-04-21', src: S.lsj },
  { id: 'a17', name: 'Apollo 17 · Taurus–Littrow', cat: ['apollo', 'landed'], kind: 'landed', lat: 20.19080, lon: 30.77168, date: '1972-12-11', src: S.lsj },

  /* ---------------- Reference points ------------------------------------- */
  { id: 'ref-subearth', name: 'Mean sub-Earth point (0°, 0°)', cat: ['reference'], kind: 'feature', lat: 0, lon: 0, src: 'Definition (ME frame)',
    note: 'Earth hangs almost straight overhead and never sets.' },
  { id: 'ref-farside', name: 'Far-side centre (0°, 180°)', cat: ['reference'], kind: 'feature', lat: 0, lon: 180, src: 'Definition (ME frame)',
    note: 'Earth is always below the horizon — no direct communication ever.' },
  { id: 'np-peary', name: 'Peary crater (north pole)', cat: ['reference'], kind: 'feature', lat: 88.63, lon: 24.4, src: S.iau },
  { id: 'np-pole', name: 'Geographic north pole', cat: ['reference'], kind: 'feature', lat: 90, lon: 0, src: 'Definition (rotation axis)' }
];

export function categoryOf(site) { return site.cat?.[0] || 'custom'; }

export function searchSites(list, query, category) {
  const q = query.trim().toLowerCase();
  return list.filter(s => {
    if (category && category !== 'all' && !(s.cat || ['custom']).includes(category)) return false;
    if (!q) return true;
    return [s.name, s.org, s.note, s.id].filter(Boolean).some(t => t.toLowerCase().includes(q));
  });
}

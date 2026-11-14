/**
 * Overall landing score, 0–100, for one site + landing time + surface stay.
 *
 * It extends the SELENE prototype's "balance score" (geometric mean of
 * sunlit % and Earth-visible %) with two more factors a planner checks first.
 * Everything is computed from the same LOLA terrain and ephemeris as the rest
 * of the app; nothing is hand-assigned per site.
 *
 *   Power     share of the stay with the Sun above the terrain
 *   Comms     share of the stay with Earth above the terrain (direct-to-Earth)
 *   Night     1 − (longest spell without sunlight ÷ stay length)
 *   Terrain   ground slope at the site from LOLA: 1 at ≤ 5°, 0 at ≥ 20°
 *
 *   score = 100 × Power^wP × Comms^wC × Night^wN × Terrain^wT     (weights sum to 1)
 *
 * A weighted geometric mean, as in SELENE: a site cannot score well unless it
 * has BOTH power and a link, and a zero in either gives zero. Night and
 * Terrain are floored at 0.05 so they lower the score without erasing it.
 * It is a screening aid for comparing options, not a safety certification.
 */
export const PRIORITIES = {
  balanced: { label: 'Balanced', w: { power: 0.35, comms: 0.35, night: 0.15, terrain: 0.15 } },
  power: { label: 'Power first', w: { power: 0.50, comms: 0.20, night: 0.15, terrain: 0.15 } },
  comms: { label: 'Comms first', w: { power: 0.20, comms: 0.50, night: 0.15, terrain: 0.15 } }
};

/** Slope (deg) at the centre of a terrain patch, central differences over two grid steps. */
export function slopeAtCentre(patch) {
  if (!patch) return null;
  const n = patch.size, c = (n - 1) / 2, s = 2 * patch.halfM / (n - 1), h = patch.heights;
  const dzdx = (h[c * n + c + 1] - h[c * n + c - 1]) / (2 * s);
  const dzdy = (h[(c - 1) * n + c] - h[(c + 1) * n + c]) / (2 * s);
  return { deg: Math.atan(Math.hypot(dzdx, dzdy)) * 180 / Math.PI, baselineM: 2 * s };
}

export function landingScore({ sunFraction, earthFraction, longestDarkH, stayDays, slopeDeg }, priority = 'balanced') {
  const base = (PRIORITIES[priority] || PRIORITIES.balanced).w;
  const f = {
    power: sunFraction,
    comms: earthFraction,
    night: Math.max(0.05, 1 - Math.min(1, longestDarkH / (stayDays * 24))),
    terrain: slopeDeg == null ? null : Math.max(0.05, Math.min(1, (20 - slopeDeg) / 15))
  };
  const keys = Object.keys(f).filter(k => f[k] != null);
  const wsum = keys.reduce((a, k) => a + base[k], 0);
  let log = 0, zero = false;
  for (const k of keys) { if (f[k] <= 0) zero = true; else log += base[k] / wsum * Math.log(f[k]); }
  const score = zero ? 0 : 100 * Math.exp(log);
  const grade = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Marginal' : 'Poor';
  return { score, grade, factors: f, weights: Object.fromEntries(keys.map(k => [k, base[k] / wsum])) };
}

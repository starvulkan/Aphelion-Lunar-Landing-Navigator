/**
 * LOLA horizon toolkit (shared by the browser app, the Node build script and
 * the one-off generation run).  No dependencies, no DOM.
 *
 * DEM sources: NASA PDS Geosciences Node, LRO LOLA Gridded Data Records
 *   https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/
 *   - polar/img/ldem_60s_240m.img, ldem_60n_240m.img (polar stereographic, 240 m/px)
 *   - cylindrical/img/ldem_64.img (simple cylindrical, 64 px/deg, ~474 m/px)
 *   - cylindrical/img/ldem_16.img (simple cylindrical, 16 px/deg, ~1.9 km/px)
 * All products: signed 16-bit little-endian, HEIGHT(m) = DN * 0.5, relative to
 * a 1737.4 km sphere, Mean Earth/Polar Axis frame (DE421), east-positive longitude.
 *
 * Geometry: the Moon has no atmosphere, so no refraction term is used.  The
 * elevation angle of a terrain point is computed exactly on the reference
 * sphere (curvature included) from an observer standing OBSERVER_HEIGHT_M
 * above the local DEM surface.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LolaHorizon = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  const R_M = 1737400;           // LOLA reference radius (m)
  const D2R = Math.PI / 180;
  const R2D = 180 / Math.PI;
  const OBSERVER_HEIGHT_M = 2;   // lander deck / mast height above ground

  /* ------------------------------------------------------------------ */
  /* DEM wrappers                                                        */
  /* ------------------------------------------------------------------ */

  /** Polar stereographic (spherical) DEM, PDS LOLA convention. */
  function polarDEM({ data, lines, samples, scale, lineOffset, sampleOffset, pole, dnScale = 0.5, name }) {
    const south = pole === 'S';
    return {
      kind: 'polar', name, pole, data, lines, samples, scale, lineOffset, sampleOffset, dnScale,
      /** lat/lon (deg) -> fractional 0-based (row, col) */
      toPixel(lat, lon) {
        const rho = south
          ? 2 * R_M * Math.tan((90 + lat) * D2R / 2)
          : 2 * R_M * Math.tan((90 - lat) * D2R / 2);
        const x = rho * Math.sin(lon * D2R);
        const y = south ? rho * Math.cos(lon * D2R) : -rho * Math.cos(lon * D2R);
        return { row: lineOffset - y / scale, col: sampleOffset + x / scale };
      },
      contains(lat) { return south ? lat <= -this.minAbsLat : lat >= this.minAbsLat; },
      minAbsLat: 0
    };
  }

  /** Simple cylindrical DEM covering a window of rows (for HTTP range reads). */
  function cylDEM({ data, rowStart = 0, rows, samples, res, lineOffset, sampleOffset, centerLon = 180, dnScale = 0.5, name }) {
    return {
      kind: 'cyl', name, data, rowStart, rows, samples, res, dnScale,
      toPixel(lat, lon) {
        let dl = lon - centerLon;
        dl = ((dl + 540) % 360) - 180;
        return { row: lineOffset - lat * res - rowStart, col: sampleOffset + dl * res, wrap: true };
      }
    };
  }

  /** Bilinear height (m) or NaN if outside the grid. */
  function heightAt(dem, lat, lon) {
    const p = dem.toPixel(lat, lon);
    const nr = dem.kind === 'polar' ? dem.lines : dem.rows;
    const nc = dem.samples;
    let r = p.row, c = p.col;
    if (r < 0 || r > nr - 1) return NaN;
    if (p.wrap) c = ((c % nc) + nc) % nc;
    else if (c < 0 || c > nc - 1) return NaN;
    const r0 = Math.floor(r), c0 = Math.floor(c);
    const r1 = Math.min(r0 + 1, nr - 1);
    const c1 = p.wrap ? (c0 + 1) % nc : Math.min(c0 + 1, nc - 1);
    const fr = r - r0, fc = c - c0;
    const d = dem.data;
    const v00 = d[r0 * nc + c0], v01 = d[r0 * nc + c1];
    const v10 = d[r1 * nc + c0], v11 = d[r1 * nc + c1];
    const v = (v00 * (1 - fc) + v01 * fc) * (1 - fr) + (v10 * (1 - fc) + v11 * fc) * fr;
    return v * dem.dnScale;
  }

  /** First DEM in the list that covers (lat, lon). */
  function heightFrom(dems, lat, lon) {
    for (const dem of dems) {
      const h = heightAt(dem, lat, lon);
      if (Number.isFinite(h)) return h;
    }
    return NaN;
  }

  /* ------------------------------------------------------------------ */
  /* Geodesy on the reference sphere                                     */
  /* ------------------------------------------------------------------ */

  /** Destination point after central angle delta (rad) along azimuth az (rad, from north, clockwise). */
  function destination(latDeg, lonDeg, az, delta) {
    // At an exact pole every direction is "north"; nudge ~1 cm so azimuth 0
    // points along the site's meridian (same convention as js/ephemeris.js).
    const lat = Math.max(-89.9999997, Math.min(89.9999997, latDeg));
    const p1 = lat * D2R, l1 = lonDeg * D2R;
    const sp = Math.sin(p1) * Math.cos(delta) + Math.cos(p1) * Math.sin(delta) * Math.cos(az);
    const p2 = Math.asin(Math.max(-1, Math.min(1, sp)));
    const l2 = l1 + Math.atan2(Math.sin(az) * Math.sin(delta) * Math.cos(p1), Math.cos(delta) - Math.sin(p1) * sp);
    return [p2 * R2D, ((l2 * R2D + 540) % 360) - 180];
  }

  /**
   * Terrain horizon profile.
   * @param {Array} demsNear  DEMs tried first (high resolution)
   * @param {Array} demsFar   DEMs used beyond nearRangeM (may be the same list)
   * @param {object} opts { azSteps=360, maxRangeM=400000, nearRangeM=40000, baseStepM=240 }
   * @returns {{ ground_m:number, elevations:number[] (deg, length azSteps, az = i*360/azSteps) }}
   */
  function horizonProfile(lat, lon, demsNear, demsFar, opts = {}) {
    const azSteps = opts.azSteps || 360;
    const maxRange = opts.maxRangeM || 400000;
    const nearRange = opts.nearRangeM || 40000;
    const base = opts.baseStepM || 240;
    const ground = heightFrom(demsNear, lat, lon);
    if (!Number.isFinite(ground)) throw new Error(`No DEM coverage at ${lat}, ${lon}`);
    const r1 = R_M + ground + OBSERVER_HEIGHT_M;

    // Pre-compute the sample distances (fine near the site, coarser far away).
    const dists = [];
    for (let d = base; d <= maxRange; d += Math.max(base, d * 0.01)) dists.push(d);

    const out = new Array(azSteps);
    for (let i = 0; i < azSteps; i++) {
      const az = (i * 360 / azSteps) * D2R;
      let best = -90;
      for (const d of dists) {
        const delta = d / R_M;
        const [la, lo] = destination(lat, lon, az, delta);
        const h = heightFrom(d <= nearRange ? demsNear : demsFar, la, lo);
        if (!Number.isFinite(h)) break; // ran off the DEM
        const r2 = R_M + h;
        const x = r2 * Math.sin(delta);
        const z = r2 * Math.cos(delta) - r1;
        const el = Math.atan2(z, x) * R2D;
        if (el > best) best = el;
      }
      out[i] = best;
    }
    return { ground_m: ground, elevations: out };
  }

  /** Depression of the bare-sphere horizon for an observer h metres above the sphere (deg, negative). */
  function sphereDip(hMeters) {
    const h = Math.max(0, hMeters);
    return -Math.acos(R_M / (R_M + h)) * R2D;
  }

  /** Downsample an Int16 polar DEM by integer factor (block mean) -> Int16Array. */
  function downsample(data, n, factor) {
    const m = Math.floor(n / factor);
    const out = new Int16Array(m * m);
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < m; c++) {
        let s = 0;
        for (let i = 0; i < factor; i++) {
          const row = (r * factor + i) * n + c * factor;
          for (let j = 0; j < factor; j++) s += data[row + j];
        }
        out[r * m + c] = Math.round(s / (factor * factor));
      }
    }
    return { data: out, n: m };
  }

  return { R_M, OBSERVER_HEIGHT_M, polarDEM, cylDEM, heightAt, heightFrom, destination, horizonProfile, sphereDip, downsample };
});

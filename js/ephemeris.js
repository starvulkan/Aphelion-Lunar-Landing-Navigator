/**
 * Aphelion ephemeris engine
 * =========================
 * Sun and Earth azimuth / elevation as seen from any point on the Moon, plus
 * terrain-aware sunlight and direct-to-Earth (DTE) visibility windows.
 *
 * Method (all formulas are public and independently checkable):
 *  - Sun:   Meeus, Astronomical Algorithms 2nd ed., ch. 25 (apparent place,
 *           ~0.01° accuracy).
 *  - Moon:  Meeus ch. 47 (truncated ELP-2000/82: 60 + 60 periodic terms,
 *           ~10" in longitude, ~4" in latitude).
 *  - Lunar orientation incl. physical libration: IAU WGCCRE 2009 model
 *           (Archinal et al. 2011, Celest. Mech. Dyn. Astr. 109, 101).
 *  - Precession J2000 -> date: IAU 1976 (Meeus ch. 21).
 *  - No refraction: the Moon has no atmosphere.
 *  - Terrain horizon: real LOLA topography (see js/terrain.js and
 *           tools/lola-horizon.js). If no terrain data is available for a
 *           point, the exact bare-sphere horizon is used and the UI says so.
 *
 * Validation: compared against NASA/JPL Horizons (DE440, high-precision
 * MEAN_ME frame) in tools/validate.mjs and in data/horizons-reference.json.
 * Typical residuals are a few hundredths of a degree (see DATA_SOURCES.md).
 * Elevations refer to the CENTRE of the Sun / Earth disc, as in Horizons.
 */


const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const AU_KM = 149597870.7;
const R_MOON = 1737.4;
const J2000 = 2451545.0;
const DAY_MS = 86400000;

const norm360 = x => { x %= 360; return x < 0 ? x + 360 : x; };
const sinD = x => Math.sin(x * RAD);
const cosD = x => Math.cos(x * RAD);

/* ---------------------------------------------------------------------------
 * Meeus ch. 47 lunar periodic terms
 * ------------------------------------------------------------------------ */
// [D, M, M', F, SigmaL(1e-6 deg), SigmaR(1e-3 km)]
const MOON_LR = [
  [0,0,1,0,6288774,-20905355],[2,0,-1,0,1274027,-3699111],[2,0,0,0,658314,-2955968],
  [0,0,2,0,213618,-569925],[0,1,0,0,-185116,48888],[0,0,0,2,-114332,-3149],
  [2,0,-2,0,58793,246158],[2,-1,-1,0,57066,-152138],[2,0,1,0,53322,-170733],
  [2,-1,0,0,45758,-204586],[0,1,-1,0,-40923,-129620],[1,0,0,0,-34720,108743],
  [0,1,1,0,-30383,104755],[2,0,0,-2,15327,10321],[0,0,1,2,-12528,0],
  [0,0,1,-2,10980,79661],[4,0,-1,0,10675,-34782],[0,0,3,0,10034,-23210],
  [4,0,-2,0,8548,-21636],[2,1,-1,0,-7888,24208],[2,1,0,0,-6766,30824],
  [1,0,-1,0,-5163,-8379],[1,1,0,0,4987,-16675],[2,-1,1,0,4036,-12831],
  [2,0,2,0,3994,-10445],[4,0,0,0,3861,-11650],[2,0,-3,0,3665,14403],
  [0,1,-2,0,-2689,-7003],[2,0,-1,2,-2602,0],[2,-1,-2,0,2390,10056],
  [1,0,1,0,-2348,6322],[2,-2,0,0,2236,-9884],[0,1,2,0,-2120,5751],
  [0,2,0,0,-2069,0],[2,-2,-1,0,2048,-4950],[2,0,1,-2,-1773,4130],
  [2,0,0,2,-1595,0],[4,-1,-1,0,1215,-3958],[0,0,2,2,-1110,0],
  [3,0,-1,0,-892,3258],[2,1,1,0,-810,2616],[4,-1,-2,0,759,-1897],
  [0,2,-1,0,-713,-2117],[2,2,-1,0,-700,2354],[2,1,-2,0,691,0],
  [2,-1,0,-2,596,0],[4,0,1,0,549,-1423],[0,0,4,0,537,-1117],
  [4,-1,0,0,520,-1571],[1,0,-2,0,-487,-1739],[2,1,0,-2,-399,0],
  [0,0,2,-2,-381,-4421],[1,1,1,0,351,0],[3,0,-2,0,-340,0],
  [4,0,-3,0,330,0],[2,-1,2,0,327,0],[0,2,1,0,-323,1165],
  [1,1,-1,0,299,0],[2,0,3,0,294,0],[2,0,-1,-2,0,8752]
];
// [D, M, M', F, SigmaB(1e-6 deg)]
const MOON_B = [
  [0,0,0,1,5128122],[0,0,1,1,280602],[0,0,1,-1,277693],[2,0,0,-1,173237],
  [2,0,-1,1,55413],[2,0,-1,-1,46271],[2,0,0,1,32573],[0,0,2,1,17198],
  [2,0,1,-1,9266],[0,0,2,-1,8822],[2,-1,0,-1,8216],[2,0,-2,-1,4324],
  [2,0,1,1,4200],[2,1,0,-1,-3359],[2,-1,-1,1,2463],[2,-1,0,1,2211],
  [2,-1,-1,-1,2065],[0,1,-1,-1,-1870],[4,0,-1,-1,1828],[0,1,0,1,-1794],
  [0,0,0,3,-1749],[0,1,-1,1,-1565],[1,0,0,1,-1491],[0,1,1,1,-1475],
  [0,1,1,-1,-1410],[0,1,0,-1,-1344],[1,0,0,-1,-1335],[0,0,3,1,1107],
  [4,0,0,-1,1021],[4,0,-1,1,833],[0,0,1,-3,777],[4,0,-2,1,671],
  [2,0,0,-3,607],[2,0,2,-1,596],[2,-1,1,-1,491],[2,0,-2,1,-451],
  [0,0,3,-1,439],[2,0,2,1,422],[2,0,-3,-1,421],[2,1,-1,1,-366],
  [2,1,0,1,-351],[4,0,0,1,331],[2,-1,1,1,315],[2,-2,0,-1,302],
  [0,0,1,3,-283],[2,1,1,-1,-229],[1,1,0,-1,223],[1,1,0,1,223],
  [0,1,-2,-1,-220],[2,1,-1,-1,-220],[1,0,1,1,-185],[2,-1,-2,-1,181],
  [0,1,2,1,-177],[4,0,-2,-1,176],[4,-1,-1,-1,166],[1,0,1,-1,-164],
  [4,0,1,-1,132],[1,0,-1,-1,-119],[4,-1,0,-1,115],[2,-2,0,1,107]
];


export class EphemerisCalculator {
  constructor() { this.cache = new Map(); }
  /* ----------------------------- time ----------------------------- */
  toJulian(date) {
    return date.getTime() / DAY_MS + 2440587.5;
  }
  centuries(date) { return (this.toJulian(date) - J2000) / 36525; }
  daysSinceJ2000(date) { return this.toJulian(date) - J2000; }

  /* ------------------------- Sun (Meeus 25) ----------------------- */
  sunEquatorial(date) {
    const T = this.centuries(date);
    const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
    const M  = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
    const e  = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
    const C  = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sinD(M)
             + (0.019993 - 0.000101 * T) * sinD(2 * M)
             + 0.000289 * sinD(3 * M);
    const trueLong = L0 + C;
    const v = M + C;
    const R = 1.000001018 * (1 - e * e) / (1 + e * cosD(v)); // AU

    const omega = 125.04 - 1934.136 * T;
    const lambda = trueLong - 0.00569 - 0.00478 * sinD(omega);
    const eps0 = 23.43929111 - 0.013004167 * T - 1.64e-7 * T * T + 5.04e-7 * T * T * T;
    const eps = eps0 + 0.00256 * cosD(omega);

    const l = lambda * RAD, ep = eps * RAD;
    const x = R * AU_KM * Math.cos(l);
    const y = R * AU_KM * Math.cos(ep) * Math.sin(l);
    const z = R * AU_KM * Math.sin(ep) * Math.sin(l);
    return { x, y, z, distanceAU: R, lambda, beta: 0 };
  }

  /* ------------------- Moon (Meeus 47 / ELP-2000) ----------------- */
  moonEquatorial(date) {
    const T = this.centuries(date);
    const T2 = T * T, T3 = T2 * T, T4 = T3 * T;

    const Lp = norm360(218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000);
    const D  = norm360(297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000);
    const M  = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000);
    const Mp = norm360(134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000);
    const F  = norm360(93.2720950 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000);

    const A1 = norm360(119.75 + 131.849 * T);
    const A2 = norm360(53.09 + 479264.290 * T);
    const A3 = norm360(313.45 + 481266.484 * T);
    const E = 1 - 0.002516 * T - 0.0000074 * T2;

    let sumL = 0, sumR = 0, sumB = 0;
    const useE = (m) => (m === 0 ? 1 : m === 1 || m === -1 ? E : E * E);

    for (const [d, m, mp, f, cl, cr] of MOON_LR) {
      const arg = d * D + m * M + mp * Mp + f * F;
      const e = useE(m);
      sumL += cl * e * sinD(arg);
      sumR += cr * e * cosD(arg);
    }
    for (const [d, m, mp, f, cb] of MOON_B) {
      const arg = d * D + m * M + mp * Mp + f * F;
      sumB += cb * useE(m) * sinD(arg);
    }

    sumL += 3958 * sinD(A1) + 1962 * sinD(Lp - F) + 318 * sinD(A2);
    sumB += -2235 * sinD(Lp) + 382 * sinD(A3) + 175 * sinD(A1 - F)
          + 175 * sinD(A1 + F) + 127 * sinD(Lp - Mp) - 115 * sinD(Lp + Mp);

    const lambda = norm360(Lp + sumL / 1e6);
    const beta = sumB / 1e6;
    const dist = 385000.56 + sumR / 1000; // km

    const eps = (23.43929111 - 0.013004167 * T) * RAD;
    const l = lambda * RAD, b = beta * RAD;
    const x = dist * Math.cos(b) * Math.cos(l);
    const y = dist * (Math.cos(b) * Math.sin(l) * Math.cos(eps) - Math.sin(b) * Math.sin(eps));
    const z = dist * (Math.cos(b) * Math.sin(l) * Math.sin(eps) + Math.sin(b) * Math.cos(eps));
    return { x, y, z, distance: dist, lambda, beta };
  }

  /* --------------- Lunar orientation (IAU WGCCRE) ----------------- */
  moonOrientation(date) {
    const d = this.daysSinceJ2000(date);
    const T = d / 36525;

    // Arguments E1..E14 (degrees)
    const E = [
      125.045 - 0.0529921 * d,
      250.089 - 0.1059842 * d,
      260.008 + 13.0120009 * d,
      176.625 + 13.3407154 * d,
      357.529 + 0.9856003 * d,
      311.589 + 26.4057084 * d,
      134.963 + 13.0649930 * d,
      276.617 + 0.3287146 * d,
      34.226 + 1.7484877 * d,
      15.134 - 0.1589763 * d,
      119.743 + 0.0036096 * d,
      239.961 + 0.1643573 * d,
      25.053 + 12.9590088 * d,
      349.773 + 0.0029961 * d
    ].map(norm360);

    let a0 = 269.9949 + 0.0031 * T - 0.0019 * T * T;
    let d0 = 66.5392 + 0.0130 * T - 0.0001 * T * T;
    let W  = norm360(38.3213 + 13.17635815 * d - 1.4e-12 * d * d);

    // Physical libration corrections (deg)
    a0 += -3.8787 * sinD(E[0]) - 0.1204 * sinD(E[1]) + 0.0700 * sinD(E[2])
        - 0.0172 * sinD(E[3]) + 0.0072 * sinD(E[5]) - 0.0052 * sinD(E[9])
        + 0.0043 * sinD(E[12]);
    d0 +=  1.5419 * cosD(E[0]) + 0.0239 * cosD(E[1]) - 0.0278 * cosD(E[2])
        + 0.0068 * cosD(E[3]) - 0.0029 * cosD(E[5]) + 0.0009 * cosD(E[6])
        + 0.0008 * cosD(E[9]) - 0.0009 * cosD(E[12]);
    W  +=  3.5610 * sinD(E[0]) + 0.1208 * sinD(E[1]) - 0.0642 * sinD(E[2])
        + 0.0158 * sinD(E[3]) + 0.0252 * sinD(E[4]) - 0.0066 * sinD(E[5])
        - 0.0047 * sinD(E[6]) - 0.0046 * sinD(E[7]) + 0.0028 * sinD(E[8])
        + 0.0052 * sinD(E[9]) + 0.0040 * sinD(E[10]) + 0.0019 * sinD(E[11])
        - 0.0044 * sinD(E[12]) - 0.0008 * sinD(E[13]);

    return {
      alpha0: norm360(a0),
      delta0: d0,
      W: norm360(W),
      pole: [cosD(d0) * cosD(a0), cosD(d0) * sinD(a0), sinD(d0)]
    };
  }

  /** Body-fixed (ME: +X at lon 0, +Z north) -> inertial equatorial unit vector */
  bodyToInertial(latDeg, lonDeg, orient) {
    const lat = latDeg * RAD, lon = lonDeg * RAD, W = orient.W * RAD;
    return this._bodyFrame(lat, lon, W, orient);
  }

  _bodyFrame(lat, lon, W, orient) {
    // body vector
    const bx = Math.cos(lat) * Math.cos(lon);
    const by = Math.cos(lat) * Math.sin(lon);
    const bz = Math.sin(lat);

    // Rz(W)
    const cW = Math.cos(W), sW = Math.sin(W);
    const x1 = cW * bx - sW * by;
    const y1 = sW * bx + cW * by;
    const z1 = bz;

    // Rx(90 - delta0)
    const ax = (90 - orient.delta0) * RAD;
    const ca = Math.cos(ax), sa = Math.sin(ax);
    const x2 = x1;
    const y2 = ca * y1 - sa * z1;
    const z2 = sa * y1 + ca * z1;

    // Rz(alpha0 + 90)
    const az = (orient.alpha0 + 90) * RAD;
    const cz = Math.cos(az), sz = Math.sin(az);
    return [cz * x2 - sz * y2, sz * x2 + cz * y2, z2];
  }

  siteFrame(site, date) {
    const orient = this.moonOrientation(date);
    // Azimuth is undefined exactly at a pole; nudge by ~1 cm so "north" points along the 0° meridian (same convention as Horizons).
    const lat = Math.max(-89.9999997, Math.min(89.9999997, site.lat)), lon = site.lon;
    const zenith = this.bodyToInertial(lat, lon, orient);

    const pole = orient.pole;
    // East = normalize(pole x zenith)
    let east = [
      pole[1] * zenith[2] - pole[2] * zenith[1],
      pole[2] * zenith[0] - pole[0] * zenith[2],
      pole[0] * zenith[1] - pole[1] * zenith[0]
    ];
    const el = Math.hypot(...east) || 1;
    east = east.map(v => v / el);

    // North = zenith x east
    const north = [
      zenith[1] * east[2] - zenith[2] * east[1],
      zenith[2] * east[0] - zenith[0] * east[2],
      zenith[0] * east[1] - zenith[1] * east[0]
    ];
    const nl = Math.hypot(...north) || 1;

    const radius = R_MOON + (site.elevation || 0) / 1000;
    const pos = zenith.map(v => v * radius);
    return { orient, zenith, east, north: north.map(v => v / nl), pos, radius };
  }

  horizontal(targetVec, siteFrame) {
    const v = targetVec;
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    const u = [v[0] / len, v[1] / len, v[2] / len];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const elevation = Math.asin(Math.max(-1, Math.min(1, dot(u, siteFrame.zenith)))) * DEG;
    const azimuth = norm360(Math.atan2(dot(u, siteFrame.east), dot(u, siteFrame.north)) * DEG);
    return { azimuth, elevation, distance: len };
  }

  /**
   * Precession J2000 -> mean equator/equinox of date (IAU 1976, Meeus 21.2).
   * Horizons reports AZ/EL in the true frame of date; without this the azimuth
   * carries a ~0.014 deg/yr bias (~0.38 deg by 2026).
   */
  precess(vec, T) {
    const as = Math.PI / (180 * 3600);
    const zeta  = (2306.2181 * T + 0.30188 * T * T + 0.017998 * T * T * T) * as;
    const z     = (2306.2181 * T + 1.09468 * T * T + 0.018203 * T * T * T) * as;
    const theta = (2004.3109 * T - 0.42665 * T * T - 0.041833 * T * T * T) * as;

    // Rz(zeta)
    const cz = Math.cos(zeta), sz = Math.sin(zeta);
    let x = cz * vec[0] - sz * vec[1];
    let y = sz * vec[0] + cz * vec[1];
    let zz = vec[2];
    // Ry(-theta)
    const ct = Math.cos(theta), st = Math.sin(theta);
    const x2 = x * ct - zz * st;
    const z2 = x * st + zz * ct;
    x = x2; zz = z2;
    // Rz(z)
    const cz2 = Math.cos(z), sz2 = Math.sin(z);
    return [cz2 * x - sz2 * y, sz2 * x + cz2 * y, zz];
  }

  /* ----------------------- core state ----------------------------- */
  rawState(site, date) {
    const T = this.centuries(date);
    const sun = this.sunEquatorial(date);
    const moon = this.moonEquatorial(date);
    const frame = this.siteFrame(site, date);

    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const rot = v => this.precess(v, T);

    // Meeus Sun/Moon places are already referred to the mean equinox of date;
    // the IAU lunar orientation is J2000. Rotate the *site frame* to date and
    // leave the targets in their native of-date frame.
    const sunI = [sun.x, sun.y, sun.z];
    const moonI = [moon.x, moon.y, moon.z];
    const posI = rot(frame.pos);
    const frameI = {
      ...frame,
      pos: posI,
      zenith: rot(frame.zenith),
      east: rot(frame.east),
      north: rot(frame.north)
    };

    // Sun relative to Moon centre, then relative to the site.
    const sunTopo = sub(sub(sunI, moonI), posI);
    // Earth relative to Moon centre is -moon; then relative to site.
    const earthTopo = sub([-moonI[0], -moonI[1], -moonI[2]], posI);

    const solar = this.horizontal(sunTopo, frameI);
    const earth = this.horizontal(earthTopo, frameI);

    return {
      timestamp: date.getTime(),
      solar,
      earth,
      sunDistanceAU: sun.distanceAU,
      earthDistanceKm: earth.distance,
      moonDistanceKm: moon.distance,
      sunEclipticLon: sun.lambda,
      moonEclipticLon: moon.lambda,
      libration: { W: frame.orient.W, alpha0: frame.orient.alpha0, delta0: frame.orient.delta0 }
    };
  }


  /* ---------------------- horizon handling ------------------------- */
  /**
   * A horizon is { elevations: number[] (deg, evenly spaced in azimuth from
   * north, clockwise), source: string, kind: 'lola' | 'sphere' }.
   * sphereHorizon() is the exact horizon of a bare airless sphere.
   */
  sphereHorizon(observerHeightM = 2) {
    const dip = -Math.acos(R_MOON / (R_MOON + observerHeightM / 1000)) * DEG;
    return { elevations: new Array(360).fill(dip), source: 'Bare sphere (no terrain)', kind: 'sphere' };
  }

  horizonAt(horizon, azimuth) {
    const e = horizon?.elevations;
    if (!e?.length) return 0;
    const n = e.length;
    const x = (((azimuth % 360) + 360) % 360) / 360 * n;
    const i0 = Math.floor(x) % n, i1 = (i0 + 1) % n, t = x - Math.floor(x);
    return e[i0] * (1 - t) + e[i1] * t;
  }

  visibility(state, horizon) {
    const sh = this.horizonAt(horizon, state.solar.azimuth);
    const eh = this.horizonAt(horizon, state.earth.azimuth);
    return {
      solarVisible: state.solar.elevation > sh,
      earthVisible: state.earth.elevation > eh,
      solarHorizon: sh,
      earthHorizon: eh,
      solarMargin: state.solar.elevation - sh,
      earthMargin: state.earth.elevation - eh
    };
  }

  _visibleAt(site, t, horizon, body) {
    const st = this.rawState(site, new Date(t));
    const v = this.visibility(st, horizon);
    return body === 'sun' ? v.solarVisible : v.earthVisible;
  }

  /**
   * Next change of visibility for 'sun' or 'earth' after `date`, searched up
   * to `maxDays`, refined by bisection to ~1 s. Returns { time, rising } or null.
   */
  nextTransition(site, date, body, horizon, maxDays = 30) {
    const t0 = date.getTime();
    const stepMs = 10 * 60000;
    let prev = this._visibleAt(site, t0, horizon, body);
    for (let t = t0 + stepMs; t <= t0 + maxDays * DAY_MS; t += stepMs) {
      const now = this._visibleAt(site, t, horizon, body);
      if (now !== prev) {
        let lo = t - stepMs, hi = t;
        while (hi - lo > 1000) {
          const mid = (lo + hi) / 2;
          if (this._visibleAt(site, mid, horizon, body) === prev) lo = mid; else hi = mid;
        }
        return { time: new Date(hi), rising: !prev, seconds: (hi - t0) / 1000 };
      }
      prev = now;
    }
    return null;
  }

  /** Visibility timeline sampled every stepMin minutes for `days` days. */
  timeline(site, date, days, horizon, stepMin = 30) {
    const samples = [];
    const n = Math.ceil(days * 1440 / stepMin);
    let sun = 0, earth = 0, both = 0;
    for (let i = 0; i <= n; i++) {
      const t = new Date(date.getTime() + i * stepMin * 60000);
      const st = this.rawState(site, t);
      const v = this.visibility(st, horizon);
      if (i < n) {
        if (v.solarVisible) sun++;
        if (v.earthVisible) earth++;
        if (v.solarVisible && v.earthVisible) both++;
      }
      samples.push({
        t: t.getTime(),
        sunEl: st.solar.elevation, sunAz: st.solar.azimuth,
        earthEl: st.earth.elevation, earthAz: st.earth.azimuth,
        sunHz: v.solarHorizon, earthHz: v.earthHorizon,
        sun: v.solarVisible, earth: v.earthVisible
      });
    }
    return {
      samples, stepMin, days,
      sunFraction: sun / n, earthFraction: earth / n, bothFraction: both / n,
      sunHours: sun * stepMin / 60, earthHours: earth * stepMin / 60, bothHours: both * stepMin / 60
    };
  }

  /**
   * Everything the UI needs for one site + epoch.
   * @param {object} site  { lat, lon, elevation (m), horizon }
   */
  calculate(site, date, { missionDays = 14, stepMin = 30 } = {}) {
    const horizon = site.horizon || this.sphereHorizon();
    const key = `${site.id || ''}|${site.lat}|${site.lon}|${horizon.kind}|${Math.floor(date.getTime() / 60000)}|${missionDays}|${stepMin}`;
    const hit = this.cache.get(key);
    if (hit) return hit;

    const state = this.rawState(site, date);
    const vis = this.visibility(state, horizon);
    const tl = this.timeline(site, date, missionDays, horizon, stepMin);
    const value = {
      site, date, horizon,
      julianDate: this.toJulian(date),
      sun: { ...state.solar, visible: vis.solarVisible, horizon: vis.solarHorizon, margin: vis.solarMargin, distanceKm: state.sunDistanceAU * AU_KM },
      earth: { ...state.earth, visible: vis.earthVisible, horizon: vis.earthHorizon, margin: vis.earthMargin },
      nextSun: this.nextTransition(site, date, 'sun', horizon),
      nextEarth: this.nextTransition(site, date, 'earth', horizon),
      timeline: tl,
      phase: this.lunarPhase(date),
      sub: this.subPoints(date),
      libration: state.libration
    };
    this.cache.set(key, value);
    if (this.cache.size > 60) this.cache.delete(this.cache.keys().next().value);
    return value;
  }

  /* ------------------------- lunar phase -------------------------- */
  lunarPhase(date) {
    const sun = this.sunEquatorial(date);
    const moon = this.moonEquatorial(date);
    const dot = (sun.x * moon.x + sun.y * moon.y + sun.z * moon.z) /
      (Math.hypot(sun.x, sun.y, sun.z) * Math.hypot(moon.x, moon.y, moon.z));
    const elong = Math.acos(Math.max(-1, Math.min(1, dot))) * DEG;
    const illumination = (1 - Math.cos(elong * RAD)) / 2 * 100;
    // Waxing vs waning via ecliptic longitude difference
    let diff = norm360(moon.lambda - sun.lambda);
    const waxing = diff < 180;

    let name;
    if (elong < 7) name = 'New Moon';
    else if (elong < 90) name = waxing ? 'Waxing Crescent' : 'Waning Crescent';
    else if (elong < 97) name = waxing ? 'First Quarter' : 'Last Quarter';
    else if (elong < 173) name = waxing ? 'Waxing Gibbous' : 'Waning Gibbous';
    else name = 'Full Moon';

    return { name, angle: diff, elongation: elong, illumination, age: (diff / 360) * 29.530588853, waxing };
  }


  /**
   * Rotation from J2000 equatorial unit vectors to local (east, north, up) at a
   * site: [ex,ey,ez, nx,ny,nz, ux,uy,uz]. Used to place catalogue stars.
   */
  skyFrame(site, date) {
    const f = this.siteFrame(site, date);
    return [...f.east, ...f.north, ...f.zenith];
  }

  /* --------------------- sub-solar / sub-Earth points ---------------- */
  /** Selenographic lat/lon (deg) of the point where the Sun / Earth is at the zenith. */
  subPoints(date) {
    const T = this.centuries(date);
    const sun = this.sunEquatorial(date);
    const moon = this.moonEquatorial(date);
    const orient = this.moonOrientation(date);
    // Body axes in J2000, rotated to the frame of date (same as rawState).
    const ex = this.precess(this.bodyToInertial(0, 0, orient), T);
    const ey = this.precess(this.bodyToInertial(0, 90, orient), T);
    const ez = this.precess(this.bodyToInertial(90, 0, orient), T);
    const toBody = v => {
      const n = Math.hypot(v[0], v[1], v[2]);
      const u = v.map(c => c / n);
      const x = u[0] * ex[0] + u[1] * ex[1] + u[2] * ex[2];
      const y = u[0] * ey[0] + u[1] * ey[1] + u[2] * ey[2];
      const z = u[0] * ez[0] + u[1] * ez[1] + u[2] * ez[2];
      return { lat: Math.asin(Math.max(-1, Math.min(1, z))) * DEG, lon: ((Math.atan2(y, x) * DEG) + 540) % 360 - 180 };
    };
    // Earth's orientation, for drawing it: its north pole and the direction of the Greenwich
    // meridian, both expressed as Moon-fixed directions. Greenwich mean sidereal time from
    // Meeus eq. 12.4 (nutation, under 0.005°, is ignored).
    const JD = this.toJulian(date);
    const gmst = norm360(280.46061837 + 360.98564736629 * (JD - J2000) + 0.000387933 * T * T - T * T * T / 38710000);
    return {
      sun: toBody([sun.x - moon.x, sun.y - moon.y, sun.z - moon.z]),
      earth: toBody([-moon.x, -moon.y, -moon.z]),
      earthPole: toBody([0, 0, 1]),
      greenwich: toBody([cosD(gmst), sinD(gmst), 0]),
      gmst,
      earthKm: Math.hypot(moon.x, moon.y, moon.z),
      sunKm: Math.hypot(sun.x - moon.x, sun.y - moon.y, sun.z - moon.z)
    };
  }

  /* --------------------- JPL Horizons helpers ---------------------- */
  /**
   * Build the exact JPL Horizons API query that reproduces a value shown in
   * the app (target '10' = Sun, '399' = Earth). Open the URL in a browser to
   * check the app independently. CENTER coord@301 = topocentric on the Moon;
   * SITE_COORD = E-longitude, latitude, altitude (km) on the 1737.4 km sphere.
   */
  horizonsQuery(site, date, target = '10', { hours = 24, step = '1h' } = {}) {
    const fmt = d => d.toISOString().slice(0, 16).replace('T', ' ');
    const stop = new Date(date.getTime() + hours * 3600000);
    const altKm = ((site.elevation || 0) + 2) / 1000; // +2 m observer, same as the app
    const params = new URLSearchParams({
      format: 'text',
      COMMAND: `'${target}'`,
      OBJ_DATA: 'NO',
      MAKE_EPHEM: 'YES',
      EPHEM_TYPE: 'OBSERVER',
      CENTER: "'coord@301'",
      COORD_TYPE: 'GEODETIC',
      SITE_COORD: `'${site.lon.toFixed(5)},${site.lat.toFixed(5)},${altKm.toFixed(4)}'`,
      START_TIME: `'${fmt(date)}'`,
      STOP_TIME: `'${fmt(stop)}'`,
      STEP_SIZE: `'${step}'`,
      QUANTITIES: "'4'",
      ANG_FORMAT: 'DEG',
      EXTRA_PREC: 'YES',
      CSV_FORMAT: 'NO'
    });
    return `https://ssd.jpl.nasa.gov/api/horizons.api?${params.toString()}`;
  }

  /** Parse the $$SOE..$$EOE table of a QUANTITIES=4 text reply. */
  parseHorizons(text) {
    const rows = [];
    let inTable = false;
    for (const line of String(text).split('\n')) {
      if (line.includes('$$SOE')) { inTable = true; continue; }
      if (line.includes('$$EOE')) break;
      if (!inTable) continue;
      const m = line.match(/^\s*(\d{4}-[A-Za-z]{3}-\d{2} \d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)\s+\S*\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)/);
      if (m) rows.push({ time: m[1], azimuth: parseFloat(m[2]), elevation: parseFloat(m[3]) });
    }
    return rows;
  }
}

export { R_MOON, AU_KM };
export default EphemerisCalculator;

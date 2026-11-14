/**
 * Canvas renderers: horizon panorama, visibility track, sky dome, small charts.
 * Colour meaning is fixed: rose = Sun, ice = Earth, indigo = terrain / UI.
 */
export const C = {
  void: '#000000', indigo: '#4350ce', rose: '#e888a0', ice: '#bfedf8', mist: '#c9c7db',
  mist2: 'rgba(201,199,219,0.68)', mist3: 'rgba(201,199,219,0.40)', line: 'rgba(201,199,219,0.12)'
};
const FONT = '"Archivo", system-ui, sans-serif';
const DEG = Math.PI / 180;

export function setupCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

function font(ctx, size, weight = 400, width = 100) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  try { ctx.fontStretch = width < 90 ? 'condensed' : width > 110 ? 'expanded' : 'normal'; } catch { /* older browsers */ }
}

const wrap360 = a => ((a % 360) + 360) % 360;

/* ====================================================================== */
/* Panorama                                                                */
/* ====================================================================== */
export class Panorama {
  constructor(canvas) {
    this.canvas = canvas;
    this.hover = null;
    canvas.addEventListener('mousemove', e => { const r = canvas.getBoundingClientRect(); this.hover = { x: e.clientX - r.left, y: e.clientY - r.top }; this.draw(); });
    canvas.addEventListener('mouseleave', () => { this.hover = null; this.draw(); });
  }

  /**
   * @param {object} d { horizon, samples, cursorIndex, centerAz, phase, sunNow, earthNow }
   */
  set(d) { this.d = d; this.draw(); }

  draw() {
    const d = this.d;
    if (!d) return;
    const { ctx, w, h } = setupCanvas(this.canvas);
    if (w < 60 || h < 60) return; // hidden
    const top = 34, bottom = h - 34, left = 0, right = w;
    const center = d.centerAz;
    const X = az => left + wrap360(az - center + 180) / 360 * (right - left);

    // --- vertical range (stretched near the horizon so terrain detail stays readable)
    const hz = d.horizon.elevations;
    let eMin = Math.min(-2, ...hz) - 1;
    let eMax = Math.max(8, ...hz.map(v => v + 2));
    for (const s of d.samples) { eMax = Math.max(eMax, s.sunEl + 2, s.earthEl + 2); }
    eMax = Math.min(90, Math.ceil(eMax));
    eMin = Math.max(-20, Math.floor(eMin));
    const k = 4;
    const f = e => Math.asinh(e / k);
    const f0 = f(eMin), f1 = f(eMax);
    const Y = e => bottom - (f(Math.max(eMin, Math.min(eMax, e))) - f0) / (f1 - f0) * (bottom - top);
    this.X = X; this.Y = Y; this.center = center;

    // --- sky
    const sky = ctx.createLinearGradient(0, top, 0, bottom);
    sky.addColorStop(0, '#000');
    sky.addColorStop(1, 'rgba(67,80,206,0.10)');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // --- grid
    const ticks = [-15, -10, -5, -2, 0, 2, 5, 10, 20, 30, 45, 60, 90].filter(t => t >= eMin && t <= eMax);
    font(ctx, 11, 400, 78);
    ctx.textBaseline = 'middle';
    for (const t of ticks) {
      const y = Y(t);
      ctx.strokeStyle = t === 0 ? 'rgba(201,199,219,0.35)' : C.line;
      ctx.setLineDash(t === 0 ? [4, 4] : []);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.mist3;
      ctx.textAlign = 'right';
      ctx.fillText(`${t > 0 ? '+' : ''}${t}°`, w - 8, y - 7);
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = C.mist3;
    ctx.fillText('0° = horizon of a smooth sphere', 10, Y(0) - 8);

    // azimuth ticks
    const names = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    for (let a = 0; a < 360; a += 15) {
      const x = X(a);
      const major = a % 45 === 0;
      ctx.strokeStyle = major ? 'rgba(201,199,219,0.18)' : 'rgba(201,199,219,0.07)';
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
      if (major) {
        font(ctx, 12, 500, 110);
        ctx.fillStyle = C.mist2;
        ctx.fillText(names[a / 45], x, h - 6);
        font(ctx, 10, 400, 78);
        ctx.fillStyle = C.mist3;
        ctx.fillText(`${a}°`, x, h - 20);
      }
    }

    // --- terrain silhouette
    const n = hz.length;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const az = center - 180 + i * 360 / n;
      pts.push([X(az + 1e-6) , Y(sampleHz(hz, az))]);
    }
    pts.sort((a, b) => a[0] - b[0]);
    const grd = ctx.createLinearGradient(0, top, 0, bottom);
    grd.addColorStop(0, 'rgba(67,80,206,0.75)');
    grd.addColorStop(1, 'rgba(67,80,206,0.22)');
    ctx.beginPath();
    ctx.moveTo(0, bottom + 30);
    ctx.lineTo(0, pts[0][1]);
    for (const [x, y] of pts) ctx.lineTo(x, y);
    ctx.lineTo(w, pts[pts.length - 1][1]);
    ctx.lineTo(w, bottom + 30);
    ctx.closePath();
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.strokeStyle = 'rgba(201,199,219,0.75)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();

    // --- tracks over the stay
    this._track(ctx, d.samples, 'sunAz', 'sunEl', 'sun', C.rose);
    this._track(ctx, d.samples, 'earthAz', 'earthEl', 'earth', C.ice);

    // --- bodies at cursor
    const s = d.samples[d.cursorIndex] || d.samples[0];
    if (s) {
      const pxPerDeg = Math.abs(Y(s.earthEl + 0.5) - Y(s.earthEl - 0.5));
      this._earth(ctx, X(s.earthAz), Y(s.earthEl), Math.max(6, 0.95 * pxPerDeg), d.earthLit ?? 0.5, X(s.sunAz) - X(s.earthAz), Y(s.sunEl) - Y(s.earthEl), s.earth);
      const pxSun = Math.abs(Y(s.sunEl + 0.5) - Y(s.sunEl - 0.5));
      this._sun(ctx, X(s.sunAz), Y(s.sunEl), Math.max(5, 0.267 * pxSun), s.sun);
      this._label(ctx, X(s.sunAz), Y(s.sunEl), `Sun ${fmtDeg(s.sunEl)}`, C.rose, s.sun, w, top, bottom);
      this._label(ctx, X(s.earthAz), Y(s.earthEl), `Earth ${fmtDeg(s.earthEl)}`, C.ice, s.earth, w, top, bottom);
    }

    // --- hover read-out
    if (this.hover && this.hover.y < bottom) {
      const az = wrap360(center - 180 + this.hover.x / w * 360);
      const t = sampleHz(hz, az);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.moveTo(this.hover.x, top); ctx.lineTo(this.hover.x, bottom); ctx.stroke();
      const txt = `az ${az.toFixed(0)}°  terrain ${fmtDeg(t)}`;
      font(ctx, 12, 500, 78);
      const tw = ctx.measureText(txt).width + 14;
      const bx = Math.min(w - tw - 4, Math.max(4, this.hover.x + 8));
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(bx, top + 2, tw, 22);
      ctx.fillStyle = C.mist;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(txt, bx + 7, top + 13);
    }
  }

  _track(ctx, samples, azKey, elKey, visKey, color) {
    const X = this.X, Y = this.Y;
    let prev = null;
    for (const s of samples) {
      const p = [X(s[azKey]), Y(s[elKey]), s[visKey]];
      if (prev && Math.abs(p[0] - prev[0]) < this.canvas.clientWidth / 2) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = prev[2] && p[2] ? 1 : 0.32;
        ctx.lineWidth = prev[2] && p[2] ? 2 : 1.2;
        ctx.setLineDash(prev[2] && p[2] ? [] : [3, 4]);
        ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
      }
      prev = p;
    }
    ctx.globalAlpha = 1; ctx.setLineDash([]); ctx.lineWidth = 1;
    // day ticks
    const t0 = samples[0]?.t;
    ctx.fillStyle = color;
    for (const s of samples) {
      if (((s.t - t0) / 86400000) % 1 === 0 && s.t !== t0) {
        ctx.globalAlpha = s[visKey] ? 0.9 : 0.35;
        ctx.beginPath(); ctx.arc(X(s[azKey]), Y(s[elKey]), 2.2, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  _sun(ctx, x, y, r, visible) {
    ctx.save();
    if (visible) { ctx.shadowColor = C.rose; ctx.shadowBlur = 24; }
    ctx.fillStyle = visible ? '#ffd9e2' : 'rgba(232,136,160,0.25)';
    ctx.strokeStyle = C.rose;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  _earth(ctx, x, y, r, lit, dx, dy, visible) {
    ctx.save();
    ctx.globalAlpha = visible ? 1 : 0.35;
    if (visible) { ctx.shadowColor = C.ice; ctx.shadowBlur = 16; }
    ctx.fillStyle = '#0d2a33';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // lit part toward the Sun
    const ang = Math.atan2(dy, dx);
    ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = C.ice;
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
    const kx = r * (1 - 2 * lit);
    ctx.ellipse(0, 0, Math.abs(kx), r, 0, Math.PI / 2, -Math.PI / 2, kx > 0);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = visible ? C.ice : 'rgba(191,237,248,0.35)';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  }

  _label(ctx, x, y, text, color, visible, w, top, bottom) {
    font(ctx, 13, 600, 90);
    const tw = ctx.measureText(text).width;
    let lx = x + 14, ly = y - 14;
    if (lx + tw > w - 40) lx = x - 14 - tw;
    ly = Math.max(top + 12, Math.min(bottom - 6, ly));
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(lx - 4, ly - 10, tw + 8, 20);
    ctx.fillStyle = visible ? color : C.mist3;
    ctx.fillText(text, lx, ly);
  }
}

export function sampleHz(hz, az) {
  const n = hz.length;
  const x = wrap360(az) / 360 * n;
  const i0 = Math.floor(x) % n, i1 = (i0 + 1) % n, t = x - Math.floor(x);
  return hz[i0] * (1 - t) + hz[i1] * t;
}

export const fmtDeg = v => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}°`;

/* ====================================================================== */
/* Visibility track (time on x)                                           */
/* ====================================================================== */
export class Track {
  constructor(canvas, onScrub) {
    this.canvas = canvas;
    this.onScrub = onScrub;
    let dragging = false;
    const pick = e => {
      if (!this.d) return;
      const r = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      const frac = Math.max(0, Math.min(1, (x - this.x0) / (this.x1 - this.x0)));
      this.onScrub(Math.round(frac * (this.d.samples.length - 1)));
    };
    canvas.addEventListener('pointerdown', e => { dragging = true; canvas.setPointerCapture(e.pointerId); pick(e); });
    canvas.addEventListener('pointermove', e => dragging && pick(e));
    canvas.addEventListener('pointerup', () => { dragging = false; });
    canvas.addEventListener('keydown', e => {
      if (!this.d) return;
      const step = e.shiftKey ? Math.round(1440 / this.d.stepMin) : 1;
      if (e.key === 'ArrowRight') { this.onScrub(Math.min(this.d.samples.length - 1, this.d.cursorIndex + step)); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { this.onScrub(Math.max(0, this.d.cursorIndex - step)); e.preventDefault(); }
    });
  }

  set(d) { this.d = d; this.draw(); }

  draw() {
    const d = this.d;
    if (!d) return;
    const { ctx, w, h } = setupCanvas(this.canvas);
    if (w < 60) return; // hidden
    const labelW = 70;
    this.x0 = labelW; this.x1 = w - 4;
    const rows = [['Sun', 'sun', C.rose], ['Earth', 'earth', C.ice], ['Both', 'both', C.indigo]];
    const rowH = 18, gap = 6, y0 = 4;
    const n = d.samples.length;
    const X = i => this.x0 + i / (n - 1) * (this.x1 - this.x0);
    font(ctx, 12, 500, 100);
    ctx.textBaseline = 'middle';
    rows.forEach(([label, key, color], r) => {
      const y = y0 + r * (rowH + gap);
      ctx.fillStyle = C.mist2; ctx.textAlign = 'left';
      ctx.fillText(label, 0, y + rowH / 2);
      ctx.fillStyle = 'rgba(201,199,219,0.07)';
      ctx.fillRect(this.x0, y, this.x1 - this.x0, rowH);
      ctx.fillStyle = color;
      let start = null;
      for (let i = 0; i < n; i++) {
        const s = d.samples[i];
        const on = key === 'both' ? s.sun && s.earth : s[key];
        if (on && start === null) start = i;
        if ((!on || i === n - 1) && start !== null) {
          const end = on ? i : i;
          ctx.fillRect(X(start), y + 2, Math.max(1, X(end) - X(start)), rowH - 4);
          start = null;
        }
      }
    });
    // day ticks
    const t0 = d.samples[0].t, t1 = d.samples[n - 1].t;
    const bottomY = y0 + 3 * (rowH + gap);
    font(ctx, 10, 400, 78);
    ctx.fillStyle = C.mist3; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const dayMs = 86400000;
    const span = (t1 - t0) / dayMs;
    const pxPerDay = (this.x1 - this.x0) / Math.max(span, 1e-6);
    const every = pxPerDay * 0.25 >= 60 ? 0.25 : Math.max(1, Math.ceil(60 / pxPerDay));
    for (let t = t0; t <= t1 + 1; t += every * dayMs) {
      const x = this.x0 + (t - t0) / (t1 - t0) * (this.x1 - this.x0);
      ctx.strokeStyle = 'rgba(201,199,219,0.12)';
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, bottomY - 4); ctx.stroke();
      const dt = new Date(t);
      const lab = every < 1 ? `${String(dt.getUTCHours()).padStart(2, '0')}:00` : `${dt.toLocaleString('en', { month: 'short', timeZone: 'UTC' })} ${dt.getUTCDate()}`;
      ctx.fillText(lab, Math.min(w - 20, Math.max(this.x0 + 14, x)), bottomY - 2);
    }
    // cursor
    const cx = X(d.cursorIndex);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, y0 - 2); ctx.lineTo(cx, bottomY - 4); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(cx - 5, y0 - 4); ctx.lineTo(cx + 5, y0 - 4); ctx.lineTo(cx, y0 + 3); ctx.fill();
    ctx.lineWidth = 1;
  }
}

/* ====================================================================== */
/* Sky dome                                                                */
/* ====================================================================== */
export function drawSky(canvas, d) {
  const { ctx, w, h } = setupCanvas(canvas);
  if (w < 60 || h < 60) return; // hidden
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 18;
  const eOuter = -6;
  const rad = e => (90 - Math.max(eOuter, e)) / (90 - eOuter) * R;
  const P = (az, e) => [cx + rad(e) * Math.sin(az * DEG), cy - rad(e) * Math.cos(az * DEG)];

  // terrain band between the rim and the horizon curve
  const hz = d.horizon.elevations;
  ctx.beginPath();
  for (let i = 0; i <= 360; i++) { const [x, y] = P(i, eOuter); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  for (let i = 360; i >= 0; i--) { const [x, y] = P(i, sampleHz(hz, i)); ctx.lineTo(x, y); }
  ctx.closePath();
  ctx.fillStyle = 'rgba(67,80,206,0.6)';
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i <= 360; i++) { const [x, y] = P(i, sampleHz(hz, i)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.strokeStyle = 'rgba(201,199,219,0.7)'; ctx.stroke();

  // rings
  ctx.strokeStyle = C.line;
  for (const e of [0, 30, 60]) {
    ctx.setLineDash(e === 0 ? [3, 4] : []);
    ctx.beginPath(); ctx.arc(cx, cy, rad(e), 0, Math.PI * 2); ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
  font(ctx, 11, 600, 110);
  ctx.fillStyle = C.mist2; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('N', cx, cy - R - 10); ctx.fillText('S', cx, cy + R + 10);
  ctx.fillText('E', cx + R + 10, cy); ctx.fillText('W', cx - R - 10, cy);
  font(ctx, 10, 400, 78);
  ctx.fillStyle = C.mist3;
  ctx.fillText('30°', cx + 4, cy - rad(30) + 8); ctx.fillText('60°', cx + 4, cy - rad(60) + 8);

  // tracks
  const track = (azK, elK, visK, color) => {
    let prev = null;
    for (const s of d.samples) {
      const p = P(s[azK], s[elK]);
      if (prev) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = s[visK] ? 1 : 0.3;
        ctx.lineWidth = s[visK] ? 1.8 : 1;
        ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
      }
      prev = s[elK] < eOuter ? null : p;
    }
    ctx.globalAlpha = 1; ctx.lineWidth = 1;
  };
  track('sunAz', 'sunEl', 'sun', C.rose);
  track('earthAz', 'earthEl', 'earth', C.ice);
  const s = d.samples[d.cursorIndex];
  if (s) {
    for (const [az, el, vis, color, r] of [[s.sunAz, s.sunEl, s.sun, C.rose, 6], [s.earthAz, s.earthEl, s.earth, C.ice, 7]]) {
      if (el < eOuter) continue;
      const [x, y] = P(az, el);
      ctx.save();
      if (vis) { ctx.shadowColor = color; ctx.shadowBlur = 14; }
      ctx.fillStyle = vis ? color : 'rgba(0,0,0,1)';
      ctx.strokeStyle = color;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }
}

/* ====================================================================== */
/* Small line chart for lessons                                           */
/* ====================================================================== */
export function lineChart(canvas, { series, xLabel = '', yLabel = '', yMin, yMax, xTicks = [], zero = true, marker }) {
  const { ctx, w, h } = setupCanvas(canvas);
  if (w < 60) return; // hidden
  const L = 44, R = 10, T = 12, B = 30;
  const xs = series.flatMap(s => s.points.map(p => p[0]));
  const ys = series.flatMap(s => s.points.map(p => p[1]));
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = yMin ?? Math.min(...ys), y1 = yMax ?? Math.max(...ys);
  const X = x => L + (x - x0) / (x1 - x0 || 1) * (w - L - R);
  const Y = y => h - B - (y - y0) / (y1 - y0 || 1) * (h - T - B);
  font(ctx, 10, 400, 78);
  ctx.fillStyle = C.mist3; ctx.strokeStyle = C.line;
  const step = niceStep((y1 - y0) / 4);
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let y = Math.ceil(y0 / step) * step; y <= y1 + 1e-9; y += step) {
    ctx.beginPath(); ctx.moveTo(L, Y(y)); ctx.lineTo(w - R, Y(y)); ctx.stroke();
    ctx.fillText(`${+y.toFixed(2)}`, L - 6, Y(y));
  }
  if (zero && y0 < 0 && y1 > 0) { ctx.strokeStyle = 'rgba(201,199,219,0.4)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(L, Y(0)); ctx.lineTo(w - R, Y(0)); ctx.stroke(); ctx.setLineDash([]); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const [x, lab] of xTicks) ctx.fillText(lab, X(x), h - B + 6);
  ctx.fillText(xLabel, (L + w - R) / 2, h - 12);
  ctx.save(); ctx.translate(10, (T + h - B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(yLabel, 0, -4); ctx.restore();
  for (const s of series) {
    ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 2; ctx.setLineDash(s.dash || []);
    if (s.fill) {
      ctx.fillStyle = s.fill;
      ctx.beginPath(); ctx.moveTo(X(s.points[0][0]), Y(y0));
      s.points.forEach(([x, y]) => ctx.lineTo(X(x), Y(y)));
      ctx.lineTo(X(s.points[s.points.length - 1][0]), Y(y0)); ctx.closePath(); ctx.fill();
    }
    ctx.beginPath();
    s.points.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))));
    ctx.stroke();
  }
  ctx.setLineDash([]); ctx.lineWidth = 1;
  if (marker) {
    ctx.strokeStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(X(marker), T); ctx.lineTo(X(marker), h - B); ctx.stroke();
  }
}

function niceStep(raw) {
  const p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
}

/* ====================================================================== */
/* Season chart: SAOQ band + per-landing-day sunlight / Earth curves       */
/* ====================================================================== */
export class SeasonChart {
  constructor(canvas, onPick) {
    this.canvas = canvas;
    const pick = e => {
      if (!this.d) return;
      const r = canvas.getBoundingClientRect();
      const f = (e.clientX - r.left - this.x0) / (this.x1 - this.x0);
      if (f < 0 || f > 1) return;
      onPick(this.d.season.days[Math.min(this.d.season.days.length - 1, Math.floor(f * this.d.season.days.length))].t);
    };
    canvas.addEventListener('click', pick);
    canvas.addEventListener('mousemove', e => { const r = canvas.getBoundingClientRect(); this.hoverX = e.clientX - r.left; this.draw(); });
    canvas.addEventListener('mouseleave', () => { this.hoverX = null; this.draw(); });
  }
  set(d) { this.d = d; this.draw(); }
  draw() {
    const d = this.d;
    if (!d) return;
    const { ctx, w, h } = setupCanvas(this.canvas);
    if (w < 60) return;
    const L = 44, R = 12, bandT = 8, bandH = 34, T = bandT + bandH + 22, B = 26;
    this.x0 = L; this.x1 = w - R;
    const days = d.season.days, n = days.length;
    const X = i => L + i / (n - 1) * (w - L - R);
    const Y = f => h - B - f * (h - T - B);
    // --- SAOQ band
    font(ctx, 11, 500, 100); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(201,199,219,0.07)'; ctx.fillRect(L, bandT, w - L - R, bandH);
    ctx.beginPath(); ctx.moveTo(X(0), bandT + bandH);
    days.forEach((p, i) => ctx.lineTo(X(i), bandT + bandH - p.saoq / 100 * bandH));
    ctx.lineTo(X(n - 1), bandT + bandH); ctx.closePath();
    ctx.fillStyle = 'rgba(67,80,206,0.75)'; ctx.fill();
    const win = d.season.window;
    if (win) {
      const a = X(Math.round((win.start - days[0].t) / 86400000)), b = X(Math.round((win.end - days[0].t) / 86400000));
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(a, bandT, Math.max(2, b - a), bandH);
      ctx.fillStyle = '#fff';
      const label = 'southern summer';
      const tw = ctx.measureText(label).width;
      ctx.fillText(label, Math.min(w - R - tw - 4, Math.max(L + 2, (a + b) / 2 - tw / 2)), bandT + bandH + 10);
      ctx.fillStyle = 'rgba(67,80,206,0.10)'; ctx.fillRect(a, T, Math.max(2, b - a), h - T - B);
    }
    ctx.fillStyle = C.mist2; ctx.textAlign = 'right';
    ctx.fillText('SAOQ', L - 6, bandT + bandH / 2);
    // --- axes
    font(ctx, 10, 400, 78);
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(L, Y(f)); ctx.lineTo(w - R, Y(f)); ctx.stroke();
      ctx.fillStyle = C.mist3; ctx.fillText(`${f * 100}%`, L - 6, Y(f));
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const y0 = new Date(days[0].t).getUTCFullYear();
    for (let m = 0; m < 12; m++) {
      const i = Math.round((Date.UTC(y0, m, 1) - days[0].t) / 86400000);
      ctx.strokeStyle = 'rgba(201,199,219,0.10)'; ctx.beginPath(); ctx.moveTo(X(i), bandT); ctx.lineTo(X(i), h - B); ctx.stroke();
      ctx.fillStyle = C.mist3;
      ctx.fillText(new Date(Date.UTC(y0, m, 15)).toLocaleString('en', { month: 'short', timeZone: 'UTC' }), X(i + 15), h - B + 6);
    }
    // --- site curves
    const line = (key, color, width) => {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
      d.site.days.forEach((p, i) => (i ? ctx.lineTo(X(i), Y(p[key])) : ctx.moveTo(X(i), Y(p[key]))));
      ctx.stroke();
    };
    line('earth', C.ice, 1.6); line('sun', C.rose, 2.2); ctx.lineWidth = 1;
    // --- best day + cursor
    const mark = (t, color, lbl) => {
      const i = (t - days[0].t) / 86400000;
      if (i < 0 || i > n - 1) return;
      ctx.strokeStyle = color; ctx.setLineDash(lbl ? [3, 3] : []); ctx.beginPath(); ctx.moveTo(X(i), bandT); ctx.lineTo(X(i), h - B); ctx.stroke(); ctx.setLineDash([]);
      if (lbl) { font(ctx, 11, 600, 100); ctx.fillStyle = color; ctx.textAlign = X(i) > w - 120 ? 'right' : 'left'; ctx.textBaseline = 'top'; ctx.fillText(lbl, X(i) + (X(i) > w - 120 ? -5 : 5), T + 2); }
    };
    mark(d.site.best.t, '#fff', 'best day');
    mark(d.epoch, C.mist, '');
    if (this.hoverX != null && this.hoverX >= L && this.hoverX <= w - R) {
      const i = Math.min(n - 1, Math.round((this.hoverX - L) / (w - L - R) * (n - 1)));
      const p = d.site.days[i], s = days[i];
      const txt = `${new Date(s.t).toLocaleString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' })}  sunlight ${Math.round(p.sun * 100)}%  Earth ${Math.round(p.earth * 100)}%  SAOQ ${Math.round(s.saoq)}%`;
      font(ctx, 12, 500, 78);
      const tw = ctx.measureText(txt).width + 14, bx = Math.min(w - tw - 4, Math.max(4, this.hoverX + 8));
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.moveTo(this.hoverX, bandT); ctx.lineTo(this.hoverX, h - B); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(bx, h - B - 26, tw, 22);
      ctx.fillStyle = C.mist; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(txt, bx + 7, h - B - 15);
    }
  }
}

/**
 * Aphelion — app shell and Mission mode.
 */
import { EphemerisCalculator } from './ephemeris.js';
import { TerrainService } from './terrain.js';
import { SITES, CATEGORIES, searchSites } from './sites.js';
import { Panorama, Track, SeasonChart, drawSky, fmtDeg } from './viz.js';
import { seasonYear, siteYear, correlation, saoq } from './season.js';
import { landingScore, slopeAtCentre, PRIORITIES } from './score.js';
import { Store } from './store.js';
import { Learn } from './learn.js';

const DAY = 86400000;
const OBSERVER_M = 2;
// NASA SVS 14959 moon_small.glb with its texture re-encoded as JPEG (14 MB → 4 MB). See DATA_SOURCES.md.
const MOON_MODEL = 'graphics/models/moon_web.glb';

const $ = sel => document.querySelector(sel);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) n.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null) n.append(k.nodeType ? k : document.createTextNode(k));
  return n;
};

/* ------------------------------------------------------------ formatting */
const fmtDur = sec => {
  if (sec == null) return '—';
  const s = Math.max(0, Math.round(sec));
  const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
  if (d) return `${d} d ${String(h).padStart(2, '0')} h`;
  if (h) return `${h} h ${String(m).padStart(2, '0')} m`;
  return `${m} min`;
};
const fmtUTC = d => `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)}`;
const fmtShort = d => `${d.toLocaleString('en', { month: 'short', timeZone: 'UTC' })} ${d.getUTCDate()}, ${d.toISOString().slice(11, 16)}`;
const pct = f => `${Math.round(f * 100)} %`;
const fmtLat = v => `${Math.abs(v).toFixed(v === Math.round(v) ? 0 : 3)}°${v < 0 ? 'S' : 'N'}`;
const fmtLon = v => { const w = ((v + 540) % 360) - 180; return `${Math.abs(w).toFixed(w === Math.round(w) ? 0 : 3)}°${w < 0 ? 'W' : 'E'}`; };
const toLocalInput = d => d.toISOString().slice(0, 16);

/* ------------------------------------------------------------------- app */
class App {
  constructor() {
    this.eph = new EphemerisCalculator();
    this.terrain = new TerrainService();
    this.store = new Store();
    this.state = {
      siteId: 'im2',
      epoch: new Date(Math.floor(Date.now() / 60000) * 60000),
      followNow: true,
      days: 14,
      cursor: 0,
      sweepMetric: 'sun',
      view: this.store.get('view', 'site3d'),
      seasonYear: null,
      level: this.store.get('level', 'pro'),
      priority: this.store.get('priority', 'balanced')
    };
    this.custom = this.store.get('customSites', []);
    this.pins = this.store.get('pins', []);
    this.playing = false;
    this._sweepToken = 0;
  }

  get allSites() { return [...SITES, ...this.custom]; }
  siteById(id) { return this.allSites.find(s => s.id === id); }

  async init() {
    this.readHash();
    this.pano = new Panorama($('#pano-canvas'));
    this.track = new Track($('#track-canvas'), i => this.scrub(i));
    this.seasonChart = new SeasonChart($('#season-canvas'), t => { const e = this.state.epoch; this.state.epoch = new Date(t + (e.getTime() % DAY)); this.state.followNow = false; this.refresh(); });
    this.bindViews();
    this.bindLevel();
    this.bindHeader();
    this.bindMission();
    this.buildSiteDialog();
    this.buildInfo();
    await this.terrain.load();
    this.terrain.loadPatches().then(ok => { if (ok && this.result) { this._listScores = null; this.renderScore(this.evaluateFromTimeline(this.result.timeline)); this.renderCompare(); } });
    this.initScene();
    this.learn = new Learn(this);
    this.learn.init();
    this.setMode(this.state.mode || 'mission', false);
    this.refresh();
    setInterval(() => {
      if (this.state.followNow) { this.state.epoch = new Date(Math.floor(Date.now() / 60000) * 60000); this.refresh({ keepCursor: false }); }
    }, 60000);
    window.addEventListener('resize', () => this.redraw());
    window.addEventListener('hashchange', () => { if (this._writingHash) return; this.readHash(); this.setMode(this.state.mode || 'mission', false); this.refresh(); });
  }

  /* ---------------------------------------------------------- site model */
  /** Site object ready for the engine: adds LOLA horizon + ground height. */
  prepare(site) {
    const cur = this.terrain.forCurated(site.id);
    if (cur) return { ...site, ground: cur.ground_m, elevation: cur.ground_m + OBSERVER_M, horizon: { elevations: cur.elevations, source: cur.source, kind: 'lola' } };
    const custom = this.terrain.forCoordinates(site.lat, site.lon);
    if (custom) return { ...site, ground: custom.ground_m, elevation: custom.ground_m + OBSERVER_M, horizon: { elevations: custom.elevations, source: custom.source, kind: 'lola', coarse: custom.coarse } };
    const sph = this.eph.sphereHorizon(OBSERVER_M);
    return { ...site, ground: null, elevation: OBSERVER_M, horizon: { ...sph, source: 'Bare sphere — LOLA tiles not loaded for this point' } };
  }

  stepFor(days) { return days <= 1 ? 5 : days <= 3 ? 10 : days <= 7 ? 15 : days <= 14 ? 20 : 30; }

  /** Full scenario evaluation used by the comparison table and Learn mode. */
  evaluate(siteRaw, epoch, days) {
    const site = this.prepare(siteRaw);
    const tl = this.eph.timeline(site, epoch, days, site.horizon, this.stepFor(days));
    let longest = 0, run = 0;
    for (const s of tl.samples) { if (!s.sun) { run += tl.stepMin; longest = Math.max(longest, run); } else run = 0; }
    const st = this.eph.rawState(site, epoch);
    const slope = slopeAtCentre(this.terrain.patchFor(site));
    const score = landingScore({ sunFraction: tl.sunFraction, earthFraction: tl.earthFraction, longestDarkH: longest / 60, stayDays: days, slopeDeg: slope?.deg }, this.state.priority);
    return { site, tl, longestDarkH: longest / 60, sunAtLanding: st.solar.elevation, slope, score };
  }

  /* ------------------------------------------------------------ refresh */
  refresh({ keepCursor = false } = {}) {
    let raw = this.siteById(this.state.siteId) || SITES[0];
    this.state.siteId = raw.id;
    if (!this.terrain.forCurated(raw.id) && !this.terrain.demsReady) {
      this.terrain.loadDems().then(ok => { if (ok && this.siteById(this.state.siteId) === raw) this.refresh({ keepCursor: true }); });
    }
    const site = this.prepare(raw);
    this.site = site;
    const days = this.state.days;
    const result = this.eph.calculate(site, this.state.epoch, { missionDays: days, stepMin: this.stepFor(days) });
    this.result = result;
    if (!keepCursor) this.state.cursor = 0;
    this.state.cursor = Math.min(this.state.cursor, result.timeline.samples.length - 1);
    this.renderHeader();
    this.renderMission();
    this.renderSweep();
    this.renderSeason();
    this.syncScene(true);
    this.renderCompare();
    this.writeHash();
    this.learn?.onScenarioChange();
  }

  redraw() {
    if (!this.result) return;
    this.pano.draw(); this.track.draw(); this.seasonChart.draw();
    drawSky($('#sky-canvas'), { horizon: this.site.horizon, samples: this.result.timeline.samples, cursorIndex: this.state.cursor });
    this.learn?.redraw();
  }

  /* ------------------------------------------------------------- header */
  bindHeader() {
    $('#site-btn').addEventListener('click', () => this.openSites());
    $('#epoch').addEventListener('change', e => {
      const v = e.target.value;
      if (!v) return;
      this.state.epoch = new Date(v + ':00Z');
      this.state.followNow = false;
      this.refresh();
    });
    document.querySelectorAll('.steppers [data-step]').forEach(b => b.addEventListener('click', () => {
      this.state.epoch = new Date(this.state.epoch.getTime() + Number(b.dataset.step) * 1000);
      this.state.followNow = false;
      this.refresh();
    }));
    $('#now-btn').addEventListener('click', () => {
      this.state.followNow = true;
      this.state.epoch = new Date(Math.floor(Date.now() / 60000) * 60000);
      this.refresh();
    });
    $('#window-days').addEventListener('change', e => { this.state.days = Number(e.target.value); this.refresh(); });
    document.querySelectorAll('.modes button').forEach(b => b.addEventListener('click', () => this.setMode(b.dataset.mode)));
    $('#info-btn').addEventListener('click', () => $('#info-dialog').showModal());
  }

  renderHeader() {
    const s = this.site;
    $('#site-name').textContent = s.name;
    $('#site-coords').textContent = `${fmtLat(s.lat)} ${fmtLon(s.lon)}${s.ground != null ? `, ${Math.round(s.ground).toLocaleString('en')} m` : ''}`;
    $('#epoch').value = toLocalInput(this.state.epoch);
    $('#now-btn').setAttribute('aria-pressed', String(this.state.followNow));
    const sel = $('#window-days');
    if ([...sel.options].some(o => Number(o.value) === this.state.days)) sel.value = String(this.state.days);
  }

  setMode(mode, write = true) {
    this.state.mode = mode;
    document.body.dataset.mode = mode;
    document.querySelectorAll('.modes button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === mode)));
    document.querySelector('main.mission').hidden = mode !== 'mission';
    document.querySelector('main.learn').hidden = mode !== 'learn';
    this.scene3d?.setActive(mode === 'mission' && this.state.view !== 'pano');
    if (mode === 'mission') requestAnimationFrame(() => this.redraw());
    else this.learn?.show();
    if (write) this.writeHash();
  }

  /* ------------------------------------------------------------ mission */
  bindMission() {
    $('#play-btn').addEventListener('click', () => this.togglePlay());
    $('#pin-btn').addEventListener('click', () => this.pinCurrent());
    $('#share-btn').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(location.href); this.toast('Link copied'); } catch { this.toast('Copy the address bar to share this scenario'); }
    });
    $('#export-csv').addEventListener('click', () => this.exportCSV());
    $('#clear-compare').addEventListener('click', () => { this.pins = []; this.store.set('pins', this.pins); this.renderCompare(); });
    document.querySelectorAll('input[name="sweep-metric"]').forEach(r => r.addEventListener('change', e => { this.state.sweepMetric = e.target.value; this.renderSweep(); }));
  }

  scrub(i) {
    this.state.cursor = i;
    this.renderCursor();
  }

  togglePlay() {
    this.playing = !this.playing;
    const btn = $('#play-btn');
    btn.setAttribute('aria-pressed', String(this.playing));
    btn.setAttribute('aria-label', this.playing ? 'Pause' : 'Play');
    btn.innerHTML = this.playing
      ? '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 5l12 7-12 7z" fill="currentColor"/></svg>';
    let last = 0;
    const tick = t => {
      if (!this.playing) return;
      if (t - last > 70) {
        last = t;
        const n = this.result.timeline.samples.length;
        this.state.cursor = (this.state.cursor + 1) % n;
        this.renderCursor(false);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  renderMission() {
    const r = this.result, s = this.site, tl = r.timeline;
    const lit = (1 + Math.cos(r.phase.elongation * Math.PI / 180)) / 2;
    this._earthLit = lit;
    this.renderCursor();

    // stay summary
    const setBar = (id, f) => { $(`#bar-${id}`).style.width = `${(f * 100).toFixed(1)}%`; $(`#pct-${id}`).textContent = pct(f); };
    setBar('sun', tl.sunFraction); setBar('earth', tl.earthFraction); setBar('both', tl.bothFraction);
    const ev = this.evaluateFromTimeline(tl);
    const sunTxt = ev.longestDarkH > 0 ? `Longest time without sunlight: ${fmtDur(ev.longestDarkH * 3600)}.` : 'The Sun stays above the terrain for the whole stay.';
    const earthTxt = ev.longestNoEarthH === 0 ? 'Earth stays in view throughout.'
      : tl.earthFraction === 0 ? 'Earth never comes into view — a relay is required.'
      : `Longest time without Earth: ${fmtDur(ev.longestNoEarthH * 3600)}.`;
    $('#dark-gap').textContent = `${sunTxt} ${earthTxt}`;

    this.renderScore(ev);
    this.renderSlip();
    this.renderFacts();
    this.renderProvenance();
  }

  evaluateFromTimeline(tl) {
    let ld = 0, le = 0, rd = 0, re = 0;
    for (const x of tl.samples) {
      rd = x.sun ? 0 : rd + tl.stepMin; ld = Math.max(ld, rd);
      re = x.earth ? 0 : re + tl.stepMin; le = Math.max(le, re);
    }
    return { longestDarkH: ld / 60, longestNoEarthH: le / 60 };
  }

  renderCursor(full = true) {
    const r = this.result, s = this.site, tl = r.timeline;
    const i = this.state.cursor;
    const smp = tl.samples[i];
    const centerAz = s.lat < 0 ? 0 : 180;
    this.pano.set({ horizon: s.horizon, samples: tl.samples, cursorIndex: i, centerAz, earthLit: this._earthLit });
    this.track.set({ samples: tl.samples, cursorIndex: i, stepMin: tl.stepMin });
    drawSky($('#sky-canvas'), { horizon: s.horizon, samples: tl.samples, cursorIndex: i });
    const t = new Date(smp.t);
    this.syncScene(false);
    $('#cursor-time').textContent = i === 0 ? `Landing · ${fmtShort(t)} UTC` : `+${fmtDur((smp.t - tl.samples[0].t) / 1000)} · ${fmtShort(t)} UTC`;

    // readouts at the cursor
    $('#sun-el').textContent = fmtDeg(smp.sunEl);
    $('#sun-sub').innerHTML = `Azimuth ${smp.sunAz.toFixed(1)}°. Terrain in that direction ${fmtDeg(smp.sunHz)}. ${smp.sun ? '<span class="state">in sunlight</span>' : '<span class="state off">behind terrain</span>'}`;
    $('#earth-el').textContent = fmtDeg(smp.earthEl);
    $('#earth-sub').innerHTML = `Azimuth ${smp.earthAz.toFixed(1)}°. Terrain in that direction ${fmtDeg(smp.earthHz)}. ${smp.earth ? '<span class="state">in view</span>' : '<span class="state off">hidden</span>'}`;

    // next transitions from the cursor time (throttled while scrubbing)
    cancelAnimationFrame(this._nextRaf);
    this._nextRaf = requestAnimationFrame(() => {
      const ns = i === 0 ? r.nextSun : this.eph.nextTransition(s, t, 'sun', s.horizon);
      const ne = i === 0 ? r.nextEarth : this.eph.nextTransition(s, t, 'earth', s.horizon);
      const txt = (n, setWord, riseWord, visible) => n
        ? `${n.rising ? riseWord : setWord} in <strong>${fmtDur(n.seconds)}</strong><br><span class="ro-sub">${fmtShort(n.time)} UTC</span>`
        : `${visible ? `No ${setWord.toLowerCase()}` : `No ${riseWord.toLowerCase()}`} in the next 30 days`;
      $('#sun-next').innerHTML = txt(ns, 'Sunset', 'Sunrise', smp.sun);
      $('#earth-next').innerHTML = txt(ne, 'Earthset', 'Earthrise', smp.earth);
    });
  }

  renderSlip() {
    const s = this.site, days = this.state.days;
    const step = Math.max(30, this.stepFor(days));
    const rows = [-2, -1, 0, 1, 2].map(off => {
      const t = new Date(this.state.epoch.getTime() + off * DAY);
      const tl = off === 0 ? this.result.timeline : this.eph.timeline(s, t, days, s.horizon, step);
      return { off, sun: tl.sunFraction, earth: tl.earthFraction };
    });
    const base = rows[2];
    const delta = (v, b) => { const d = Math.round((v - b) * 100); return d === 0 ? '' : ` <span class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : '−'}${Math.abs(d)}</span>`; };
    const tb = $('#slip-table tbody');
    tb.innerHTML = '<tr><th></th><th>Sunlight</th><th>Earth</th></tr>' + rows.map(r => `
      <tr class="${r.off === 0 ? 'current' : ''}"><th scope="row">${r.off === 0 ? 'As planned' : `${r.off > 0 ? '+' : '−'}${Math.abs(r.off)} day${Math.abs(r.off) > 1 ? 's' : ''}`}</th>
      <td>${pct(r.sun)}${r.off ? delta(r.sun, base.sun) : ''}</td><td>${pct(r.earth)}${r.off ? delta(r.earth, base.earth) : ''}</td></tr>`).join('');
  }

  renderFacts() {
    const s = this.site, r = this.result;
    $('#facts-title').textContent = s.name;
    const rows = [
      ['Coordinates', `${fmtLat(s.lat)}, ${fmtLon(s.lon)}`],
      ['Ground (LOLA)', s.ground != null ? `${Math.round(s.ground).toLocaleString('en')} m` : 'not loaded'],
      ['Highest terrain', `${fmtDeg(Math.max(...s.horizon.elevations))} at ${s.horizon.elevations.indexOf(Math.max(...s.horizon.elevations))}°`],
      ['Sub-Earth point', `${fmtLat(+r.sub.earth.lat.toFixed(2))}, ${fmtLon(+r.sub.earth.lon.toFixed(2))}`],
      ['Sub-solar point', `${fmtLat(+r.sub.sun.lat.toFixed(2))}, ${fmtLon(+r.sub.sun.lon.toFixed(2))}`],
      ['Earth phase', `${Math.round(this._earthLit * 100)} % lit`],
      ['Sun distance', `${(r.sun.distanceKm / 149597870.7).toFixed(4)} AU`]
    ];
    if (s.org) rows.unshift(['Mission', s.org]);
    if (s.date) rows.unshift(['Date', s.date]);
    $('#facts').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    const kind = { landed: 'Measured landing point.', target: 'Published target point.', region: 'Reference point inside a ~15 km candidate region — not an official landing site.', feature: 'Named feature or geometric reference point.', custom: 'Your custom point.' }[s.kind || 'custom'];
    $('#facts-note').textContent = [s.note, kind, s.src ? `Coordinates: ${s.src}.` : ''].filter(Boolean).join(' ');
    const t = new Date(r.timeline.samples[0].t);
    $('#horizons-link').href = this.eph.horizonsQuery(s, t, '10', { hours: 24, step: '1h' });
  }

  renderProvenance() {
    const s = this.site;
    const p = this.terrain.meta;
    $('#provenance').innerHTML = `
      <span><b>Sun & Earth:</b> computed in your browser (Meeus 2nd ed. ch. 25 & 47, IAU 2009 lunar orientation), checked against NASA/JPL Horizons — typical difference under 0.02°.</span>
      <span><b>Terrain:</b> ${s.horizon.source}${s.horizon.coarse ? ' — coarse grid, treat ridges within a few km as approximate' : ''}. Observer ${OBSERVER_M} m above ground, no atmosphere, angles refer to the centre of the Sun's and Earth's discs.</span>
      ${p ? `<span><b>Horizon data generated:</b> ${p.generated.slice(0, 10)}.</span>` : ''}`;
  }

  /* --------------------------------------------------------- score, level */
  bindLevel() {
    document.querySelectorAll('.level button').forEach(b => b.addEventListener('click', () => this.setLevel(b.dataset.level)));
    const sel = $('#priority');
    sel.value = this.state.priority;
    sel.addEventListener('change', () => { this.state.priority = sel.value; this.store.set('priority', sel.value); this.refresh({ keepCursor: true }); });
    this.setLevel(this.state.level, false);
  }

  setLevel(level, redraw = true) {
    this.state.level = level;
    this.store.set('level', level);
    document.body.dataset.level = level;
    document.querySelectorAll('.level button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.level === level)));
    $('#level-hint').textContent = level === 'pro' ? 'Every number at a glance, for mission teams.' : 'The key points in plain words. Switch to Professional for all the data.';
    if (redraw && this.result) requestAnimationFrame(() => this.redraw());
  }

  renderScore(ev) {
    const s = this.site, tl = this.result.timeline, days = this.state.days;
    const slope = slopeAtCentre(this.terrain.patchFor(s));
    const sc = landingScore({ sunFraction: tl.sunFraction, earthFraction: tl.earthFraction, longestDarkH: ev.longestDarkH, stayDays: days, slopeDeg: slope?.deg }, this.state.priority);
    this.score = sc; this.slope = slope;
    const num = $('#score-num');
    num.textContent = String(Math.round(sc.score));
    num.dataset.grade = sc.grade.toLowerCase();
    $('#score-grade').textContent = sc.grade;
    const stay = days === 29.53 ? 'lunar-day' : `${days}-day`;
    let verdict;
    if (tl.earthFraction === 0) verdict = `Earth never comes into view from here during this stay, so there is no direct radio link. A relay satellite would be required.`;
    else if (tl.sunFraction === 0) verdict = `No sunlight reaches this spot during this stay, so there is no solar power.`;
    else {
      const weakest = Object.entries(sc.factors).filter(([, v]) => v != null).sort((a, b) => a[1] - b[1])[0][0];
      const why = { power: 'limited sunlight', comms: 'limited time with Earth in view', night: 'a long spell without sunlight', terrain: 'sloping ground' }[weakest];
      verdict = sc.score >= 80 ? `A strong choice for a ${stay} stay starting now: plenty of sunlight and a steady link to Earth.`
        : sc.score >= 60 ? `A workable choice for a ${stay} stay. The main thing holding it back is ${why}.`
        : sc.score >= 40 ? `Marginal for a ${stay} stay, mostly because of ${why}. Try another landing day below.`
        : `A poor match for a ${stay} stay starting now, mostly because of ${why}. Try another day or another site.`;
    }
    $('#score-verdict').textContent = verdict;
    const names = { power: 'Power', comms: 'Comms', night: 'Night survival', terrain: 'Terrain' };
    const cls = { power: 'sun', comms: 'earth', night: 'both', terrain: 'both' };
    $('#score-factors').innerHTML = Object.keys(names).map(k => sc.factors[k] == null
      ? `<div><dt>${names[k]}</dt><dd><span class="bar"><i></i></span><b>n/a</b></dd></div>`
      : `<div title="Weight ${Math.round(sc.weights[k] * 100)} %"><dt>${names[k]}</dt><dd><span class="bar ${cls[k]}"><i style="width:${(sc.factors[k] * 100).toFixed(1)}%"></i></span><b>${Math.round(sc.factors[k] * 100)}</b></dd></div>`).join('');
    this.renderEdu(ev, sc, slope);
  }

  renderEdu(ev, sc, slope) {
    const r = this.result, s = this.site, tl = r.timeline;
    const sunP = Math.round(tl.sunFraction * 100), earthP = Math.round(tl.earthFraction * 100);
    const sunW = Math.abs(r.sun.elevation) / 0.533;
    const sunNow = r.sun.visible
      ? `Right now the Sun is ${r.sun.elevation.toFixed(1)}° above a level horizon${r.sun.elevation < 5 ? ` — only about ${sunW < 1.5 ? 'one' : Math.round(sunW)} Sun-width${sunW < 1.5 ? '' : 's'} up, so shadows are very long` : ''}.`
      : (r.sun.elevation > 0 ? `Right now the Sun is ${r.sun.elevation.toFixed(1)}° up but hidden behind higher ground.` : 'Right now the Sun is below the horizon.');
    const power = sunP >= 99 ? 'Solar panels would have light for the whole stay.'
      : sunP >= 70 ? `Solar panels would have light most of the time. Batteries must cover up to ${fmtDur(ev.longestDarkH * 3600)} of darkness.`
      : sunP > 0 ? `Sunlight comes and goes. The longest dark spell lasts ${fmtDur(ev.longestDarkH * 3600)}, which is hard on batteries and heaters.`
      : 'No sunlight reaches this spot during the stay. A lander here needs another power source.';
    const comms = earthP >= 99 ? 'The lander could talk directly to Earth the whole time.'
      : earthP > 0 ? `Radio contact works only while Earth is above the ground around the site. The longest gap is ${fmtDur(ev.longestNoEarthH * 3600)}.`
      : 'Earth never rises here during the stay. Messages would have to go through a relay satellite.';
    const ev2 = (n, set, rise) => n ? `${n.rising ? rise : set} in <b>${fmtDur(n.seconds)}</b>` : `No ${set.toLowerCase()} or ${rise.toLowerCase()} for 30 days`;
    const ground = slope ? `${slope.deg < 8 ? 'Gentle ground' : slope.deg < 15 ? 'Sloping ground' : 'Steep ground'}: about ${slope.deg.toFixed(0)}° of slope${slope.deg >= 15 ? ', too steep for most landers' : slope.deg >= 8 ? ', near the limit for landers' : ''}.` : 'Slope is not available for this point yet.';
    const cards = [
      ['sun', 'Power', `${sunP} %`, 'of the stay in sunlight', `${power} ${sunNow}`, 5],
      ['earth', 'Radio link to Earth', `${earthP} %`, 'of the stay with Earth in view', comms, 6],
      ['', 'What happens next', '', '', `${ev2(r.nextSun, 'Sunset', 'Sunrise')}.<br>${ev2(r.nextEarth, 'Earthset', 'Earthrise')}.<br>On the Moon a full day lasts 29.5 Earth days, so these events are far apart.`, 2],
      ['', 'The ground', s.ground != null ? `${Math.round(s.ground).toLocaleString('en')} m` : '—', 'height of the site', `${ground} Measured by NASA's LOLA laser altimeter.`, 7]
    ];
    const host = $('#edu-panel');
    host.innerHTML = cards.map(([c, title, big, unit, text, lesson]) => `
      <article class="edu-card ${c}">
        <h3>${title}</h3>
        ${big ? `<p class="edu-big">${big}</p><p class="edu-unit">${unit}</p>` : ''}
        <p class="edu-text">${text}</p>
        <button class="link-btn" data-lesson="${lesson}">Learn why</button>
      </article>`).join('');
    host.querySelectorAll('[data-lesson]').forEach(b => b.addEventListener('click', () => { this.setMode('learn'); this.learn.go({ type: 'lesson', index: Number(b.dataset.lesson) }); }));
  }

  /* ------------------------------------------------------------ 3D views */
  bindViews() {
    document.querySelectorAll('.view-tabs button').forEach(b => b.addEventListener('click', () => this.setView(b.dataset.view)));
    $('#exag').addEventListener('change', e => { this.scene3d?.setExaggeration(Number(e.target.value)); this.sceneTags(); });
    $('#zoom-in').addEventListener('click', () => this.scene3d?.zoom(0.8));
    $('#zoom-out').addEventListener('click', () => this.scene3d?.zoom(1.25));
    $('#reset-view').addEventListener('click', () => this.scene3d?.resetView());
  }

  async initScene() {
    try {
      const mod = await import('./scene3d.js');
      if (!mod.webglAvailable()) throw new Error('WebGL is not available in this browser');
      this.scene3d = new mod.Scene3D($('#scene-canvas'));
      this.scene3d.setExaggeration(Number($('#exag').value));
      fetch('data/stars.json').then(r => r.json()).then(st => this.scene3d.setStars(st)).catch(() => {});
      this.terrain.loadPatches().then(() => this.syncScene(true));
    } catch (err) {
      console.warn('[3D] unavailable', err);
      this.sceneError = '3D views need WebGL, which this browser or device has switched off. The panorama shows the same data.';
      if (this.state.view !== 'pano') this.state.view = 'pano';
    }
    this.setView(this.state.view);
    // Fetch the Moon model quietly once the page has settled, so the globe tab opens instantly.
    if (this.scene3d && !navigator.connection?.saveData) {
      const idle = window.requestIdleCallback || (f => setTimeout(f, 1500));
      setTimeout(() => idle(() => this.scene3d.loadMoonModel(MOON_MODEL), { timeout: 4000 }), 3000);
    }
  }

  setView(view) {
    if (this.sceneError && view !== 'pano') { this.toast(this.sceneError); view = 'pano'; }
    this.state.view = view;
    this.store.set('view', view);
    document.querySelectorAll('.view-tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.view === view)));
    $('#pano-canvas').hidden = view !== 'pano';
    $('#scene-canvas').hidden = view === 'pano';
    $('#scene-tools').hidden = view === 'pano';
    document.querySelector('#scene-tools label').hidden = view !== 'site3d';
    this.scene3d?.setActive(view !== 'pano' && this.state.mode !== 'learn');
    if (view === 'globe') {
      this.scene3d?.setMode('globe');
      // Shade the stand-in sphere from LOLA straight away, so it is never a blank ball while the NASA model downloads.
      this.terrain.loadDems().then(d => { if (d) this.scene3d?.setGlobeRelief(this.terrain.dems.global); });
      if (!this.scene3d?.moonModel) $('#scene-tags').textContent = "Loading NASA's Moon model…";
      this.scene3d?.loadMoonModel(MOON_MODEL, f => {
        if (this.state.view === 'globe') $('#scene-tags').textContent = `Loading NASA's Moon model… ${Math.round(f * 100)} %`;
      }).then(() => { if (this.state.view === 'globe') this.sceneTags(); });
    } else if (view === 'site3d') this.scene3d?.setMode('site');
    this._sceneSite = null;
    if (this.result) { this.syncScene(true); this.redraw(); }
  }

  sceneTags() {
    const v = this.state.view, el3 = $('#scene-tags'), msg = $('#scene-msg');
    msg.hidden = true;
    if (v === 'pano') { el3.textContent = ''; return; }
    if (v === 'globe') { el3.textContent = this.scene3d?.moonModel ? "Drag to turn the Moon. NASA's Moon model (LRO imagery), lit from the true direction of the Sun." : (this.scene3d?.modelError ? "NASA's Moon model could not load, showing LOLA relief instead. " : '') + 'Drag to turn the Moon. Lit from the true direction of the Sun; relief from LOLA, exaggerated ×6.'; return; }
    const p = this._scenePatch;
    if (!p) { msg.hidden = false; msg.textContent = this.terrain.patches || this.terrain.demsReady ? 'No terrain for this point.' : 'Loading LOLA terrain…'; el3.textContent = ''; return; }
    el3.textContent = `84 km across, rings every 10 km. Relief ${$('#exag').value === '1' ? 'at true scale' : '×' + $('#exag').value}. ${p.source}. Drag to orbit, Ctrl + scroll to zoom.`;
  }

  /** Push the current site / time into the 3D scene. */
  syncScene(siteChanged) {
    const sc = this.scene3d;
    if (!sc || !this.result || this.state.view === 'pano') return;
    const s = this.site, tl = this.result.timeline, smp = tl.samples[this.state.cursor], t = new Date(smp.t);
    if (this.state.view === 'globe') {
      const key = `g|${s.id}|${s.lat}|${s.lon}`;
      sc.setGlobeState({ lat: s.lat, lon: s.lon, ...this.eph.subPoints(t) }, this._sceneSite !== key);
      this._sceneSite = key;
      this.sceneTags();
      return;
    }
    const key = `${s.id}|${s.lat}|${s.lon}|${s.horizon.kind}|${!!this.terrain.patches}|${this.terrain.demsReady}`;
    if (this._sceneSite !== key) {
      this._sceneSite = key;
      this._scenePatch = this.terrain.patchFor(s);
      sc.setTerrain(this._scenePatch);
      sc.setHorizon(s.horizon.elevations);
      sc.lookToward(tl.samples[0].sunAz);
      this._scenePaths = null;
    }
    if (this._scenePaths !== tl) { sc.setPaths(tl.samples); this._scenePaths = tl; }
    sc.setState(smp, this.eph.skyFrame(s, t));
    this.sceneTags();
  }

  /* -------------------------------------------------------------- season */
  renderSeason() {
    const s = this.site, days = this.state.days;
    if (this._epochYear !== this.state.epoch.getUTCFullYear()) { this._epochYear = this.state.epoch.getUTCFullYear(); this.state.seasonYear = null; }
    const year = this.state.seasonYear ?? this._epochYear;
    $('#season-year').textContent = String(year);
    if (!this._seasonBound) {
      this._seasonBound = true;
      $('#year-prev').addEventListener('click', () => { this.state.seasonYear = (this.state.seasonYear ?? this.state.epoch.getUTCFullYear()) - 1; this.renderSeason(); });
      $('#year-next').addEventListener('click', () => { this.state.seasonYear = (this.state.seasonYear ?? this.state.epoch.getUTCFullYear()) + 1; this.renderSeason(); });
    }
    const key = `${s.id}|${s.lat}|${s.lon}|${s.horizon.kind}|${year}|${days}|${Math.floor(this.state.epoch.getTime() / DAY)}`;
    this._seasonToken = (this._seasonToken || 0) + 1;
    const token = this._seasonToken;
    const finish = () => {
      const { season, site } = this._season;
      this.seasonChart.set({ season, site, epoch: this.state.epoch.getTime() });
      this.renderFindings(season, site, year);
    };
    if (this._seasonKey === key) return finish();
    clearTimeout(this._seasonT);
    this._seasonT = setTimeout(() => {
      if (token !== this._seasonToken) return;
      this._seasonCache ||= new Map();
      const season = this._seasonCache.get(year) || seasonYear(this.eph, year);
      this._seasonCache.set(year, season);
      this._season = { season, site: siteYear(this.eph, s, year, days, 2, Math.floor(this.state.epoch.getTime() / DAY) * DAY) };
      this._seasonKey = key;
      finish();
    }, 60);
  }

  renderFindings(season, site, year) {
    const d = t => new Date(t).toLocaleString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    const now = this.eph.subPoints(this.state.epoch).sun.lat, q = saoq(now);
    const r = correlation(season.days.map(x => x.saoq), site.days.map(x => x.sun));
    const south = this.site.lat < -60;
    let pattern;
    if (r == null) pattern = site.yearSun > 0.99 ? 'Sunlight never drops here in this year, whatever the season.' : site.yearSun < 0.01 ? 'This point gets no sunlight all year. Season makes no difference: the terrain always wins.' : 'Sunlight here does not change with the season.';
    else if (r > 0.6) pattern = `Sunlight here rises and falls with the southern summer (correlation ${r.toFixed(2)}). The season index is a good first filter for this site.`;
    else if (r < -0.6) pattern = `Sunlight here runs opposite to the southern summer (correlation ${r.toFixed(2)}): this site is at its best in the other half of the year.`;
    else pattern = `Sunlight here follows the season only weakly (correlation ${r.toFixed(2)}). ${Math.abs(this.site.lat) < 60 ? 'Away from the poles the two-week day and night dominate.' : 'Local ridges decide more than the season does, so check dates one by one.'}`;
    const best = site.best;
    const inWin = season.window && best.t >= season.window.start && best.t <= season.window.end;
    const years = [0, 1, 2, 3].map(k => { const y = year + k; this._seasonCache.has(y) || this._seasonCache.set(y, seasonYear(this.eph, y)); return this._seasonCache.get(y); });
    const shifts = years.slice(1).map((y, i) => Math.round((years[i].min.t - Date.UTC(years[i].year, 0, 1) - (y.min.t - Date.UTC(y.year, 0, 1))) / DAY));
    const items = [
      ['Season at landing', `SAOQ <b>${q.toFixed(0)} %</b>. The sub-solar point is ${Math.abs(now).toFixed(2)}° ${now < 0 ? 'south' : 'north'} of the lunar equator${south ? (q >= 90 ? ' — deep in southern summer.' : q > 0 ? '.' : ' — southern winter.') : '.'}`],
      [`Southern summer ${year}`, season.window ? `SAOQ stays at 90 % or more from <b>${d(season.window.start)} to ${d(season.window.end)}</b>, peaking on ${d(season.min.t)}.` : 'SAOQ never reaches 90 % in this year.'],
      ['Best landing day', `<b>${d(best.t)}</b>: ${Math.round(best.sun * 100)} % sunlight and ${Math.round(best.earth * 100)} % Earth in view over the ${this.state.days === 29.53 ? 'lunar-day' : this.state.days + '-day'} stay${season.window ? (inWin ? ', inside the southern-summer window.' : ', outside the southern-summer window — terrain matters more than season here.') : '.'} <button class="link-btn" data-t="${best.t}">Land then</button>`],
      ['Longest runs', `Unbroken sunlight: <b>${site.longestSun.days.toFixed(1)} days</b> from ${d(site.longestSun.t)}. Longest darkness: <b>${site.longestDark.days.toFixed(1)} days</b>${site.longestDark.days > 0 ? ` from ${d(site.longestDark.t)}` : ''}. Longest without Earth: ${site.longestNoEarth.days.toFixed(1)} days.`],
      ['Pattern', pattern],
      ['Drift', `The summer peak arrives earlier each year: ${years.map(y => `${d(y.min.t)} ${y.year}`).join(', ')} (${shifts.map(x => `${x > 0 ? '−' : '+'}${Math.abs(x)} d`).join(', ')}). Recompute for each mission year.`]
    ];
    const ul = $('#findings');
    ul.innerHTML = items.map(([k, v]) => `<li><h3>${k}</h3><p>${v}</p></li>`).join('');
    ul.querySelector('.link-btn')?.addEventListener('click', e => { const ep = this.state.epoch; this.state.epoch = new Date(Number(e.target.dataset.t) + (ep.getTime() % DAY)); this.state.followNow = false; this.refresh(); });
  }

  /* --------------------------------------------------------------- sweep */
  renderSweep() {
    const token = ++this._sweepToken;
    const grid = $('#sweep-grid');
    const s = this.site, days = this.state.days;
    const N = 45;
    const step = days <= 3 ? 30 : 60;
    const metric = this.state.sweepMetric;
    const color = { sun: [232, 136, 160], earth: [191, 237, 248], both: [67, 80, 206] }[metric];
    grid.innerHTML = '';
    const cells = [];
    for (let k = 0; k < N; k++) {
      const t = new Date(this.state.epoch.getTime() + k * DAY);
      const b = el('button', { class: 'sweep-cell', 'aria-current': k === 0 ? 'true' : 'false', title: fmtShort(t), onclick: () => { this.state.epoch = t; this.state.followNow = false; this.refresh(); } }, el('span', { class: 'd', text: t.getUTCDate() }));
      grid.append(b); cells.push([b, t]);
    }
    let k = 0;
    const work = () => {
      if (token !== this._sweepToken) return;
      const until = performance.now() + 12;
      while (k < N && performance.now() < until) {
        const [b, t] = cells[k];
        const tl = k === 0 && step === this.result.timeline.stepMin ? this.result.timeline : this.eph.timeline(s, t, days, s.horizon, step);
        const f = metric === 'sun' ? tl.sunFraction : metric === 'earth' ? tl.earthFraction : tl.bothFraction;
        b.style.background = `rgba(${color.join(',')},${(0.08 + 0.92 * f).toFixed(3)})`;
        b.style.color = f > 0.55 ? 'rgba(0,0,0,0.75)' : 'rgba(201,199,219,0.8)';
        b.title = `${fmtShort(t)} UTC — ${Math.round(f * 100)} % ${metric === 'sun' ? 'sunlight' : metric === 'earth' ? 'Earth in view' : 'both'}`;
        b.setAttribute('aria-label', b.title);
        k++;
      }
      if (k < N) setTimeout(work, 0);
    };
    setTimeout(work, 30);
  }

  /* ------------------------------------------------------------- compare */
  pinCurrent() {
    const s = this.site;
    this.pins.push({ siteId: s.id, epoch: this.state.epoch.toISOString(), days: this.state.days });
    this.store.set('pins', this.pins);
    this.renderCompare();
    this.toast(`Pinned ${s.name}`);
  }

  renderCompare() {
    const tb = $('#compare-table tbody');
    if (!this.pins.length) {
      tb.innerHTML = '<tr class="empty"><td colspan="11">Nothing pinned yet. Use "Pin to comparison" on any site and date.</td></tr>';
      return;
    }
    const rows = this.pins.map((p, idx) => {
      const raw = this.siteById(p.siteId);
      if (!raw) return null;
      const ev = this.evaluate(raw, new Date(p.epoch), p.days);
      const extra = this.evaluateFromTimeline(ev.tl);
      return { idx, p, raw, ev, score: ev.score.score, sunAt: ev.sunAtLanding, sun: ev.tl.sunFraction, dark: extra.longestDarkH, earth: ev.tl.earthFraction, both: ev.tl.bothFraction, ground: ev.site.ground };
    }).filter(Boolean);
    this._compareRows = rows;
    const best = (key, dir) => rows.length > 1 ? Math.max(...rows.map(r => dir * r[key])) * dir : null;
    const b = { score: best('score', 1), sun: best('sun', 1), dark: best('dark', -1), earth: best('earth', 1), both: best('both', 1) };
    const cls = (k, v) => (b[k] != null && Math.abs(v - b[k]) < 1e-9 ? 'num best' : 'num');
    tb.innerHTML = '';
    for (const r of rows) {
      const tr = el('tr', {},
        el('td', {}, el('button', { class: 'row-btn', title: 'Open this scenario', onclick: () => { this.state.siteId = r.p.siteId; this.state.epoch = new Date(r.p.epoch); this.state.days = r.p.days; this.state.followNow = false; this.refresh(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }, r.raw.name)),
        el('td', { class: cls('score', r.score), text: String(Math.round(r.score)) }),
        el('td', { class: 'num', text: fmtUTC(new Date(r.p.epoch)) }),
        el('td', { class: 'num', text: `${r.p.days === 29.53 ? '29.5' : r.p.days} d` }),
        el('td', { class: 'num', text: fmtDeg(r.sunAt) }),
        el('td', { class: cls('sun', r.sun), text: pct(r.sun) }),
        el('td', { class: cls('dark', r.dark), text: fmtDur(r.dark * 3600) }),
        el('td', { class: cls('earth', r.earth), text: pct(r.earth) }),
        el('td', { class: cls('both', r.both), text: pct(r.both) }),
        el('td', { class: 'num', text: r.ground != null ? `${Math.round(r.ground).toLocaleString('en')} m` : '—' }),
        el('td', {}, el('button', { class: 'row-btn', 'aria-label': `Remove ${r.raw.name}`, onclick: () => { this.pins.splice(r.idx, 1); this.store.set('pins', this.pins); this.renderCompare(); } }, '✕'))
      );
      tb.append(tr);
    }
  }

  exportCSV() {
    const rows = this._compareRows || [];
    const head = ['site', 'overall_score', 'lat', 'lon', 'ground_m', 'landing_utc', 'stay_days', 'sun_el_at_landing_deg', 'sunlight_pct', 'longest_dark_h', 'earth_in_view_pct', 'both_pct', 'terrain_source'];
    const lines = [head.join(',')].concat(rows.map(r => [
      `"${r.raw.name.replace(/"/g, '""')}"`, r.score.toFixed(0), r.raw.lat, r.raw.lon, r.ground ?? '', r.p.epoch, r.p.days,
      r.sunAt.toFixed(3), (r.sun * 100).toFixed(1), r.dark.toFixed(1), (r.earth * 100).toFixed(1), (r.both * 100).toFixed(1), `"${r.ev.site.horizon.source}"`
    ].join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = el('a', { href: URL.createObjectURL(blob), download: 'aphelion-comparison.csv' });
    document.body.append(a); a.click(); a.remove();
  }

  /* --------------------------------------------------------- site dialog */
  buildSiteDialog() {
    this.siteCat = 'all';
    const cats = $('#site-cats');
    for (const c of CATEGORIES) {
      cats.append(el('button', { role: 'tab', 'aria-selected': String(c.id === 'all'), 'data-cat': c.id, onclick: e => {
        this.siteCat = c.id;
        cats.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b === e.currentTarget)));
        this.renderSiteList();
      } }, c.label));
    }
    $('#site-search').addEventListener('input', () => this.renderSiteList());
    $('#custom-form').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const lat = Number(f.get('lat')), lon = ((Number(f.get('lon')) + 540) % 360) - 180;
      if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon)) { this.toast('Latitude must be between −90 and 90'); return; }
      const site = { id: `custom-${Date.now().toString(36)}`, name: String(f.get('name')).trim() || 'Custom site', lat, lon, cat: ['custom'], kind: 'custom' };
      this.custom.push(site);
      this.store.set('customSites', this.custom);
      e.target.reset();
      $('#site-dialog').close();
      this.selectSite(site.id);
      this.toast('Loading LOLA terrain for your site…');
    });
  }

  openSites() {
    $('#site-search').value = '';
    this.renderSiteList();
    $('#site-dialog').showModal();
    $('#site-search').focus();
  }

  renderSiteList() {
    const list = $('#site-list');
    const items = searchSites(this.allSites.map(s => ({ ...s, cat: s.cat || ['custom'] })), $('#site-search').value, this.siteCat);
    list.innerHTML = '';
    if (!items.length) { list.append(el('li', { class: 'hint', style: 'padding:16px' }, 'No sites match. Try another word, or add one by coordinates below.')); return; }
    for (const s of items) {
      const meta = [s.org, s.date, s.kind === 'region' ? 'candidate region' : null].filter(Boolean).join(', ');
      const li = el('li', {}, el('button', { 'aria-current': String(s.id === this.state.siteId), onclick: () => { $('#site-dialog').close(); this.selectSite(s.id); } },
        el('span', { class: 'n' }, s.name, this.listScore(s)),
        el('span', { class: 'c', text: `${fmtLat(s.lat)} ${fmtLon(s.lon)}` }),
        meta ? el('span', { class: 'm', text: meta }) : null));
      if (s.kind === 'custom') {
        li.append(el('button', { class: 'del', style: 'width:auto;padding:4px 12px', onclick: () => {
          this.custom = this.custom.filter(c => c.id !== s.id);
          this.store.set('customSites', this.custom);
          if (this.state.siteId === s.id) this.selectSite(SITES[0].id);
          this.renderSiteList();
        } }, `Remove ${s.name}`));
      }
      list.append(li);
    }
  }

  /** Score chip for the site picker, for the current landing time and stay. */
  listScore(raw) {
    try {
      this._listScores ||= new Map();
      const key = `${raw.id}|${this.state.epoch.getTime()}|${this.state.days}|${this.state.priority}|${!!this.terrain.patches}`;
      if (!this._listScores.has(key)) this._listScores.set(key, Math.round(this.evaluate(raw, this.state.epoch, this.state.days).score.score));
      const v = this._listScores.get(key);
      return el('span', { class: 'chip-score', 'data-grade': v >= 80 ? 'excellent' : v >= 60 ? 'good' : v >= 40 ? 'marginal' : 'poor', title: 'Overall score for the current landing time and stay' }, String(v));
    } catch { return null; }
  }

  selectSite(id) { this.state.siteId = id; this.refresh(); }

  /* ------------------------------------------------------------ info */
  buildInfo() {
    $('#info-body').innerHTML = `
      <section>
        <h3>What is computed, and how</h3>
        <ul>
          <li><b>Sun and Earth positions</b> are computed live in your browser for any date: the Sun from Meeus (Astronomical Algorithms, 2nd ed., ch. 25), the Moon's orbit from Meeus ch. 47 (truncated ELP-2000/82), and the Moon's orientation including physical libration from the IAU WGCCRE 2009 model. No refraction is applied because the Moon has no atmosphere. Elevations refer to the centre of each disc, exactly as JPL Horizons reports them.</li>
          <li><b>Terrain horizons</b> come from NASA LRO LOLA laser-altimetry grids (PDS Geosciences Node). For every curated site we trace the highest terrain every 1° of azimuth out to 400 km on a curved Moon, from 2 m above the ground.</li>
          <li><b>Sunlight and Earth-in-view</b> mean the centre of the disc is above that terrain line.</li>
          <li><b>Overall score</b> (0–100) multiplies four factors, each raised to its weight: power (share of the stay in sunlight), comms (share with Earth in view), night survival (how short the longest dark spell is) and terrain (LOLA slope at the site). A site needs both power and a link to score well. It is a screening aid, not a certification.</li>
        </ul>
      </section>
      <section>
        <h3>How accurate is it?</h3>
        <p>Against NASA/JPL Horizons (DE440, 434 samples across 7 sites, 30 days): largest elevation difference 0.014°, mean 0.003°; largest azimuth difference 0.014°. For scale, the Sun's disc is 0.53° wide. Terrain: 240 m/px LOLA grids near the poles (474 m/px elsewhere), so features smaller than a few hundred metres — boulders, small craters right next to a lander — are not resolved.</p>
      </section>
      <section>
        <h3>Check it yourself, outside this app</h3>
        <ol>
          <li>Use <b>Check in JPL Horizons</b> under the site details. It opens the official Horizons API with the same site, time and altitude; compare the "Azimuth" and "Elevation" columns with the panorama labels (Sun: target 10; change <code>COMMAND='10'</code> to <code>'399'</code> for Earth).</li>
          <li>Or build the query by hand in the <a href="https://ssd.jpl.nasa.gov/horizons/app.html" target="_blank" rel="noopener">Horizons web app</a>: Ephemeris type <i>Observer</i>, Target <i>Sun</i>, Observer location <i>coord@301</i> with your longitude (east), latitude and altitude in km, Quantities <i>4</i>.</li>
          <li>Run <code>node tools/validate.mjs --live</code> from the project folder to compare the engine with fresh Horizons values for seven sites.</li>
          <li>Check terrain against <a href="https://quickmap.lroc.asu.edu/" target="_blank" rel="noopener">LROC QuickMap</a> (layer "LOLA elevation", then the elevation profile tool) or <a href="https://trek.nasa.gov/moon/" target="_blank" rel="noopener">NASA Moon Trek</a>.</li>
          <li>For sunlight statistics, compare with NASA GSFC's LOLA illumination maps at <a href="https://pgda.gsfc.nasa.gov/" target="_blank" rel="noopener">pgda.gsfc.nasa.gov</a>.</li>
        </ol>
      </section>
      <section>
        <h3>Limits</h3>
        <ul>
          <li>Planning aid and teaching tool, not flight software. Use official mission products for operational decisions.</li>
          <li>Artemis "regions" are ~15 km wide; the points listed are published reference points inside them, not landing sites.</li>
          <li>Custom sites use down-sampled LOLA tiles bundled with the app (240 m/px south of 84.5°S, 960 m/px to 75°, 7.6 km/px elsewhere).</li>
        </ul>
      </section>
      <section>
        <h3>Sources</h3>
        <p>Full list with citations: <a href="DATA_SOURCES.md" target="_blank" rel="noopener">DATA_SOURCES.md</a>. Step-by-step external checks: <a href="VERIFY.md" target="_blank" rel="noopener">VERIFY.md</a>.</p>
      </section>`;
  }

  /* ---------------------------------------------------------- url state */
  readHash() {
    const h = new URLSearchParams(location.hash.slice(1));
    if (h.has('site')) {
      const id = h.get('site');
      if (id.startsWith('@')) {
        const [lat, lon, ...name] = id.slice(1).split(',');
        const site = { id: `custom-${(+lat).toFixed(4)}_${(+lon).toFixed(4)}`, name: decodeURIComponent(name.join(',') || 'Shared site'), lat: +lat, lon: +lon, cat: ['custom'], kind: 'custom' };
        if (!this.siteById(site.id) && Number.isFinite(site.lat) && Number.isFinite(site.lon)) { this.custom.push(site); this.store.set('customSites', this.custom); }
        this.state.siteId = site.id;
      } else this.state.siteId = id;
    }
    if (h.has('t')) { const t = new Date(h.get('t')); if (!isNaN(t)) { this.state.epoch = t; this.state.followNow = false; } }
    if (h.has('d')) { const d = Number(h.get('d')); if (d > 0 && d <= 30) this.state.days = d; }
    if (h.has('m')) this.state.mode = h.get('m') === 'learn' ? 'learn' : 'mission';
  }

  writeHash() {
    const s = this.siteById(this.state.siteId);
    if (!s) return;
    const p = new URLSearchParams();
    p.set('site', s.kind === 'custom' ? `@${s.lat},${s.lon},${encodeURIComponent(s.name)}` : s.id);
    if (!this.state.followNow) p.set('t', this.state.epoch.toISOString().slice(0, 16) + 'Z');
    p.set('d', String(this.state.days));
    if (this.state.mode === 'learn') p.set('m', 'learn');
    const next = '#' + p.toString();
    if (location.hash !== next) { this._writingHash = true; history.replaceState(null, '', next); setTimeout(() => { this._writingHash = false; }, 0); }
  }

  toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => { t.hidden = true; }, 2600);
  }
}

const app = new App();
window.aphelion = app; // handy for debugging in the console
app.init().catch(err => {
  console.error(err);
  document.body.prepend(el('p', { class: 'toast', role: 'alert' }, `Aphelion failed to start: ${err.message}`));
});

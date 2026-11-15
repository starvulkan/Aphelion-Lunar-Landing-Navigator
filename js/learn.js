/**
 * Learn mode: lessons, live labs, quizzes, missions, XP and badges.
 * Labs and missions use the same engine and LOLA data as Mission mode.
 */
import { content } from './lessons.js?v=202611150104';
import { t, getLang, locale, onLang } from './i18n.js?v=202611150104';
import { lineChart, C } from './viz.js?v=202611150104';
import { SITES } from './sites.js?v=202611150104';
import { seasonYear } from './season.js?v=202611150104';

const $ = s => document.querySelector(s);
const DAY = 86400000;
// Content in the current language (English or Spanish); reloaded when the language changes.
let LESSONS, CHALLENGES, RANKS, BADGES;
const loadContent = () => ({ LESSONS, CHALLENGES, RANKS, BADGES } = content(getLang()));
loadContent();

export class Learn {
  constructor(app) {
    this.app = app;
    this.p = app.store.get('learn', { xp: 0, done: {}, answers: {}, badges: {}, challenges: {}, current: 0 });
    this.p.done ||= {}; this.p.answers ||= {}; this.p.badges ||= {}; this.p.challenges ||= {};
    this.view = { type: 'hub' };
    this.labs = [];
  }

  save() { this.app.store.set('learn', this.p); }

  init() {
    loadContent();   // the language is set by the app before Learn starts
    this.applyStatic();
    this.bindHub();
    onLang(() => {
      loadContent();
      this.applyStatic();
      this.wrapStatement();
      this.renderPath(); this.renderRank(); this.renderBadges(); this.renderView();
    });
    this.renderPath();
    this.renderRank();
    this.renderBadges();
    this.renderView();
  }

  show() { this.renderView(); }

  go(view) {
    this.view = view;
    if (view.type === 'lesson') { this.p.current = view.index; this.save(); }
    this.renderPath(); this.renderView();
    scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  /* -------------------------------------------------------------- hub */
  bindHub() {
    $('#learn-back').addEventListener('click', () => this.go({ type: 'hub' }));
    $('#hub-start').addEventListener('click', () => this.go({ type: 'lesson', index: this.nextLesson() }));
    $('#hub-missions').addEventListener('click', () => document.getElementById('missions-section').scrollIntoView({ behavior: 'smooth' }));
    this.wrapStatement();
    const st = $('#statement-text');
    const onScroll = () => {
      if (document.querySelector('main.learn').hidden || $('#learn-hub').hidden) return;
      const r = st.getBoundingClientRect(), vh = innerHeight;
      const f = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      const k = Math.round(f * this.words.length);
      this.words.forEach((w, i) => w.classList.toggle('on', i < k));
    };
    addEventListener('scroll', onScroll, { passive: true });
    this._onScroll = onScroll;
    this._bindRest();
  }

  /** Statement: split into words that light up as the block scrolls through the viewport. */
  wrapStatement() {
    const st = $('#statement-text');
    st.innerHTML = t('hub.statement');
    const wrap = node => {
      for (const ch of [...node.childNodes]) {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(w => { if (!w.trim()) frag.append(w); else { const sp = document.createElement('span'); sp.className = 'w'; sp.textContent = w; frag.append(sp); } });
          ch.replaceWith(frag);
        } else { ch.classList.add('w'); }
      }
    };
    wrap(st);
    this.words = [...st.querySelectorAll('.w')];
    this._onScroll?.();
  }

  /** Static texts of the Learn hub and lesson page, in the current language. */
  applyStatic() {
    const set = (sel, html) => { const e = $(sel); if (e) e.innerHTML = html; };
    set('#hub-tag', t('hub.tag'));
    $('#learn-hub h1.mega').setAttribute('aria-label', t('hub.h1'));
    set('#hub-l1', t('hub.l1')); set('#hub-l2', t('hub.l2')); set('#hub-l3', t('hub.l3'));
    set('#hub-missions-label', t('hub.jump'));
    const words = [...t('hub.marquee1'), ...t('hub.marquee1')].map(w => `<span>${w}</span>`).join('');
    const words2 = [...t('hub.marquee2'), ...t('hub.marquee2')].map(w => `<span>${w}</span>`).join('');
    set('#marquee-1', words); set('#marquee-2', words2);
    set('#why-tag', t('hub.whyTag'));
    set('#plan-1', t('hub.plan1')); set('#plan-2', `<em>${t('hub.plan2')}</em>`);
    set('#miss-1', t('hub.miss1')); set('#miss-2', `<em>${t('hub.miss2')}</em>`);
    set('#miss-note', t('hub.missNote'));
    $('#badges').setAttribute('aria-label', t('hub.badges'));
    set('#learn-back-label', t('page.back'));
    set('#path-plan', t('page.plan')); set('#path-missions', t('page.missions'));
    document.querySelectorAll('.learn .roll > span').forEach(el => { el.dataset.t = el.textContent; });
  }

  _bindRest() {
    // Line / block reveals
    // Liquid-glass highlight follows the pointer on whichever glass surface it is over.
    document.querySelector('main.learn').addEventListener('pointermove', e => {
      const t = e.target.closest('.card button, .next-card, .hub-rank, .lab, .q, .challenge-card');
      if (!t) return;
      const r = t.getBoundingClientRect();
      t.style.setProperty('--mx', `${e.clientX - r.left}px`); t.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, { passive: true });
    document.querySelectorAll('.roll > span').forEach(el => { el.dataset.t = el.textContent; });
    this.io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); this.io.unobserve(e.target); } }), { threshold: 0.2 });
  }

  nextLesson() { const i = LESSONS.findIndex(l => !this.p.done[l.id]); return i < 0 ? 0 : i; }

  renderHub() {
    const n = this.nextLesson(), started = Object.keys(this.p.done).length > 0;
    const lbl = $('#hub-start-label'); lbl.textContent = started ? t('hub.continue', { n: n + 1 }) : t('hub.start'); lbl.dataset.t = lbl.textContent;
    const ol = $('#lesson-cards');
    ol.innerHTML = '';
    LESSONS.forEach((l, i) => {
      const li = document.createElement('li');
      li.className = 'card reveal' + (this.p.done[l.id] ? ' done' : '');
      li.style.setProperty('--i', i % 3);
      li.innerHTML = `<button aria-label="${t('card.lesson', { n: i + 1, title: l.title })}">
        <span class="card-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="card-img"><img src="${l.image}" alt="" loading="lazy"></span>
        <span class="card-title">${l.title}</span>
        <span class="card-foot"><span>${this.p.done[l.id] ? t('card.done') : t('card.meta', { q: l.quiz.length, xp: l.quiz.length * 10 + 20 })}</span><span class="card-arrow" aria-hidden="true">↗</span></span>
      </button>`;
      li.querySelector('button').addEventListener('click', () => this.go({ type: 'lesson', index: i }));
      ol.append(li);
    });
    const ul = $('#mission-cards');
    ul.innerHTML = '';
    CHALLENGES.forEach((c, i) => {
      const li = document.createElement('li');
      li.className = 'card mission reveal' + (this.p.challenges[c.id] ? ' done' : '');
      li.style.setProperty('--i', i % 4);
      li.innerHTML = `<button aria-label="${t('card.mission', { title: c.title })}">
        <span class="card-img badge"><img src="${c.badge}" alt="" loading="lazy"></span>
        <span class="card-title">${c.title}</span>
        <span class="card-foot"><span>${this.p.challenges[c.id] ? t('card.accomplished') : `${c.xp} XP`}</span><span class="card-arrow" aria-hidden="true">↗</span></span>
      </button>`;
      li.querySelector('button').addEventListener('click', () => this.go({ type: 'challenge', index: i }));
      ul.append(li);
    });
    document.querySelectorAll('#learn-hub .reveal, #learn-hub .line').forEach(el => this.io.observe(el));
    this.renderNextCard();
    this._onScroll();
  }

  renderNextCard() {
    const r = this.app.result, s = this.app.site;
    if (!r) return;
    const dur = sec => { const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60); return d ? `${d} d ${h} h` : h ? `${h} h ${m} m` : `${m} min`; };
    const n = r.nextSun;
    $('#next-card').innerHTML = `<p class="nc-k">${n ? t(n.rising ? 'next.sunrise' : 'next.sunset') : t('next.sunlight')}</p>
      <p class="nc-v">${n ? dur(n.seconds) : t(r.sun.visible ? 'next.noSunset' : 'next.noSunrise')}</p>
      <p class="nc-s">${s.name}</p>`;
  }
  redraw() { if (!document.querySelector('main.learn').hidden) this.labs.forEach(fn => fn()); }

  onScenarioChange() {
    this.renderNextCard();
    if (this.view.type === 'challenge' && !document.querySelector('main.learn').hidden) this.renderView();
  }

  /* ------------------------------------------------------------ path */
  renderPath() {
    const ol = $('#lesson-list');
    ol.innerHTML = '';
    LESSONS.forEach((l, i) => {
      const li = document.createElement('li');
      if (this.p.done[l.id]) li.className = 'done';
      const b = document.createElement('button');
      b.innerHTML = `<span class="dot">${this.p.done[l.id] ? '✓' : i + 1}</span><span>${l.title}</span>`;
      b.setAttribute('aria-current', String(this.view.type === 'lesson' && this.view.index === i));
      b.addEventListener('click', () => this.go({ type: 'lesson', index: i }));
      li.append(b); ol.append(li);
    });
    const ul = $('#challenge-list');
    ul.innerHTML = '';
    CHALLENGES.forEach((c, i) => {
      const li = document.createElement('li');
      if (this.p.challenges[c.id]) li.className = 'done';
      const b = document.createElement('button');
      b.innerHTML = `<span class="dot">${this.p.challenges[c.id] ? '✓' : '★'}</span><span>${c.title}</span>`;
      b.setAttribute('aria-current', String(this.view.type === 'challenge' && this.view.index === i));
      b.addEventListener('click', () => this.go({ type: 'challenge', index: i }));
      li.append(b); ul.append(li);
    });
  }

  renderRank() {
    const xp = this.p.xp;
    let i = 0;
    while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
    const cur = RANKS[i], next = RANKS[i + 1];
    $('#rank-title').textContent = cur.title;
    $('#rank-xp').textContent = next ? t('rank.to', { xp, left: next.xp - xp, next: next.title }) : t('rank.top', { xp });
    const frac = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
    $('#rank-arc').style.strokeDashoffset = String(176 * (1 - frac));
  }

  renderBadges() {
    const ul = $('#badges');
    ul.innerHTML = '';
    for (const b of BADGES) {
      const li = document.createElement('li');
      if (this.p.badges[b.id]) li.className = 'got';
      li.title = `${b.name}: ${b.how}`;
      li.innerHTML = `<img src="${b.img}" alt="">${b.name}`;
      ul.append(li);
    }
  }

  award(xp, anchor) {
    this.p.xp += xp;
    this.save();
    this.renderRank();
    if (anchor && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const r = anchor.getBoundingClientRect();
      const pop = document.createElement('div');
      pop.className = 'xp-pop';
      pop.textContent = `+${xp} XP`;
      pop.style.left = `${r.left + r.width / 2 - 24}px`;
      pop.style.top = `${r.top - 8}px`;
      document.body.append(pop);
      setTimeout(() => pop.remove(), 1200);
    }
  }

  badge(id) {
    if (this.p.badges[id]) return;
    this.p.badges[id] = Date.now();
    this.save();
    this.renderBadges();
    const b = BADGES.find(x => x.id === id);
    if (b) this.app.toast(t('badge.earned', { name: b.name }));
  }

  /* ------------------------------------------------------------ views */
  renderView() {
    this.labs = [];
    const hub = this.view.type === 'hub';
    $('#learn-hub').hidden = !hub; $('#learn-page').hidden = hub;
    if (hub) return this.renderHub();
    const host = $('#lesson');
    if (this.view.type === 'challenge') return this.renderChallenge(host, CHALLENGES[this.view.index]);
    const i = this.view.index, L = LESSONS[i];
    host.innerHTML = `
      <div class="lesson-hero">
        <div>
          <p class="lesson-kicker">${t('lesson.kicker', { n: i + 1, total: LESSONS.length })}</p>
          <h1>${L.title}</h1>
          <p class="lesson-lede">${L.lede}</p>
        </div>
        <img src="${L.image}" alt="" width="520" height="360">
      </div>
      <div class="lesson-text">${L.body}</div>
      <div id="lab-host"></div>
      <section class="quiz" aria-label="Quiz">
        <h2>${t('lesson.check')}</h2>
        <div id="quiz-host"></div>
      </section>
      <nav class="lesson-nav">
        ${i > 0 ? `<button class="btn ghost" data-go="${i - 1}">${t('lesson.prev', { title: LESSONS[i - 1].title })}</button>` : '<span></span>'}
        ${i < LESSONS.length - 1 ? `<button class="btn" data-go="${i + 1}">${t('lesson.next', { title: LESSONS[i + 1].title })}</button>` : `<button class="btn" data-go="missions">${t('lesson.toMissions')}</button>`}
      </nav>`;
    host.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
      this.go(b.dataset.go === 'missions' ? { type: 'challenge', index: 0 } : { type: 'lesson', index: Number(b.dataset.go) });
    }));
    if (L.lab) this.renderLab(L.lab, $('#lab-host'));
    this.renderQuiz(L, $('#quiz-host'));
  }

  renderQuiz(L, host) {
    const answers = this.p.answers[L.id] ||= {};
    host.innerHTML = '';
    L.quiz.forEach((q, qi) => {
      const box = document.createElement('div');
      box.className = 'q';
      box.innerHTML = `<p>${q.q}</p><div class="opts"></div><p class="why" hidden></p>`;
      const opts = box.querySelector('.opts'), why = box.querySelector('.why');
      const show = (picked, animateFrom) => {
        opts.querySelectorAll('button').forEach((b, oi) => {
          b.disabled = true;
          if (oi === q.answer) b.classList.add('right');
          else if (oi === picked) b.classList.add('wrong');
        });
        why.hidden = false;
        why.className = `why ${picked === q.answer ? 'ok' : 'no'}`;
        why.textContent = q.why;
      };
      q.options.forEach((o, oi) => {
        const b = document.createElement('button');
        b.textContent = o;
        b.addEventListener('click', () => {
          answers[qi] = oi;
          this.save();
          show(oi);
          if (oi === q.answer) this.award(10, b);
          this.checkLessonDone(L);
        });
        opts.append(b);
      });
      if (answers[qi] != null) show(answers[qi]);
      host.append(box);
    });
    const reset = document.createElement('button');
    reset.className = 'btn ghost';
    reset.textContent = t('quiz.retry');
    reset.addEventListener('click', () => { this.p.answers[L.id] = { retry: true }; this.save(); this.renderQuiz(L, host); });
    if (Object.keys(answers).filter(k => k !== 'retry').length === L.quiz.length) host.append(reset);
  }

  checkLessonDone(L) {
    const a = this.p.answers[L.id];
    const n = L.quiz.filter((_, i) => a[i] != null).length;
    if (n < L.quiz.length) return;
    if (!this.p.done[L.id]) {
      this.p.done[L.id] = Date.now();
      this.award(20);
      this.badge('first-light');
      if (!a.retry && L.quiz.every((q, i) => a[i] === q.answer)) this.badge('sharp');
      if (LESSONS.every(x => this.p.done[x.id])) this.badge('flight-plan');
      this.save();
      this.renderPath();
    }
    this.renderQuiz(L, document.getElementById('quiz-host'));
  }

  /* ------------------------------------------------------------- labs */
  labFrame(host, title, note) {
    host.innerHTML = `<section class="lab"><div class="lab-head"><h3>${title}</h3><span class="hint">${note}</span></div><div class="lab-body"></div></section>`;
    return host.querySelector('.lab-body');
  }

  site(id) { return SITES.find(s => s.id === id); }

  renderLab(kind, host) {
    const app = this.app, eph = app.eph;
    const open = (id, label) => {
      const b = document.createElement('button');
      b.className = 'btn ghost';
      b.textContent = label;
      b.addEventListener('click', () => { app.state.siteId = id; app.state.followNow = true; app.state.epoch = new Date(Math.floor(Date.now() / 60000) * 60000); app.setMode('mission'); app.refresh(); scrollTo({ top: 0 }); });
      return b;
    };

    if (kind === 'pole-pair') {
      const body = this.labFrame(host, t('lab.see'), t('lab.realLola'));
      const row = document.createElement('div');
      row.className = 'lab-controls';
      row.append(open('sp-ridge', t('lab.openRidge')), open('sp-shackleton', t('lab.openShack')), open('art-malapert', t('lab.openMalapert')));
      body.append(row);
      return;
    }

    if (kind === 'horizon-dip') {
      const body = this.labFrame(host, t('lab.dipTitle'), t('lab.dipNote'));
      body.innerHTML += `
        <div class="lab-controls"><label for="dip-h">${t('lab.eye')}</label><input id="dip-h" type="range" min="0" max="100" value="12"><span class="lab-out" id="dip-hv"></span></div>
        <p class="lab-out" id="dip-out"></p>`;
      const R = 1737400, RE = 6371000;
      const upd = () => {
        const f = Number($('#dip-h').value) / 100;
        const h = Math.round(Math.pow(10, f * 4)); // 1 m … 10 km
        const d = Math.sqrt((R + h) ** 2 - R ** 2), dip = Math.acos(R / (R + h)) * 180 / Math.PI;
        const dE = Math.sqrt((RE + h) ** 2 - RE ** 2);
        $('#dip-hv').textContent = h >= 1000 ? `${(h / 1000).toFixed(1)} km` : `${h} m`;
        $('#dip-out').innerHTML = t('lab.dipOut', { d: (d / 1000).toFixed(1), dip: dip.toFixed(2), dE: (dE / 1000).toFixed(1) });
      };
      $('#dip-h').addEventListener('input', upd); upd();
      return;
    }

    if (kind === 'day-compare') {
      const body = this.labFrame(host, t('lab.dayTitle'), t('lab.live'));
      const cv = document.createElement('canvas'); body.append(cv);
      const legend = document.createElement('p'); legend.className = 'hint';
      legend.innerHTML = t('lab.dayLegend', { rose: C.rose, ice: C.ice });
      body.append(legend);
      const t0 = Date.now();
      const pts = id => { const s = this.site(id); const out = []; for (let h = 0; h <= 30 * 24; h += 3) out.push([h / 24, eph.rawState(s, new Date(t0 + h * 3600000)).solar.elevation]); return out; };
      const a = pts('a11'), p = pts('sp-pole');
      const draw = () => lineChart(cv, { series: [{ points: a, color: C.rose }, { points: p, color: C.ice }], xLabel: t('lab.daysFromNow'), yLabel: t('lab.sunEl'), xTicks: [0, 5, 10, 15, 20, 25, 30].map(d => [d, String(d)]) });
      draw(); this.labs.push(draw);
      return;
    }

    if (kind === 'pole-year') {
      const body = this.labFrame(host, t('lab.yearTitle'), t('lab.yearNote'));
      const cv = document.createElement('canvas'); body.append(cv);
      const s = this.site('sp-pole');
      const t0 = new Date(); t0.setUTCHours(0, 0, 0, 0);
      const pts = [];
      for (let d = 0; d <= 365; d++) pts.push([d, eph.rawState(s, new Date(t0.getTime() + d * DAY)).solar.elevation]);
      const max = Math.max(...pts.map(p => p[1])), min = Math.min(...pts.map(p => p[1]));
      const out = document.createElement('p'); out.className = 'lab-out';
      out.textContent = t('lab.yearOut', { max: max.toFixed(2), min: min.toFixed(2) });
      body.append(out);
      const draw = () => lineChart(cv, { series: [{ points: pts, color: C.rose, fill: 'rgba(232,136,160,0.12)' }], yMin: -2, yMax: 2, xLabel: t('lab.daysFromToday'), yLabel: t('lab.sunEl'), xTicks: [0, 60, 120, 180, 240, 300, 360].map(d => [d, String(d)]) });
      draw(); this.labs.push(draw);
      return;
    }

    if (kind === 'earth-month') {
      const body = this.labFrame(host, t('lab.earthTitle'), t('lab.earthNote'));
      const cv = document.createElement('canvas'); body.append(cv);
      const t0 = Date.now();
      const sites = [['sp-pole', C.ice], ['art-slater', C.rose]];
      const series = [], notes = [];
      for (const [id, color] of sites) {
        const s = app.prepare(this.site(id));
        const tl = eph.timeline(s, new Date(t0), 60, s.horizon, 360);
        series.push({ points: tl.samples.map(x => [(x.t - t0) / DAY, x.earthEl]), color });
        notes.push(t('lab.earthRow', { site: s.name, p: Math.round(tl.earthFraction * 100) }));
      }
      const out = document.createElement('p'); out.className = 'lab-out';
      out.innerHTML = `<span style="color:${C.ice}">${notes[0]}</span><br><span style="color:${C.rose}">${notes[1]}</span>`;
      body.append(out);
      const draw = () => lineChart(cv, { series, xLabel: t('lab.daysFromNow'), yLabel: t('lab.earthEl'), xTicks: [0, 10, 20, 30, 40, 50, 60].map(d => [d, String(d)]) });
      draw(); this.labs.push(draw);
      return;
    }

    if (kind === 'panel') {
      const body = this.labFrame(host, t('lab.panelTitle'), t('lab.panelNote'));
      body.innerHTML += `
        <div class="lab-controls"><label for="pn-el">${t('lab.sunElShort')}</label><input id="pn-el" type="range" min="0" max="90" step="0.5" value="1.5"><span class="lab-out" id="pn-ev"></span></div>
        <dl class="bars" style="max-width:520px">
          <div><dt>${t('lab.flat')}</dt><dd><span class="bar sun"><i id="pn-flat"></i></span><b id="pn-flat-v"></b></dd></div>
          <div><dt>${t('lab.upright')}</dt><dd><span class="bar earth"><i id="pn-vert"></i></span><b id="pn-vert-v"></b></dd></div>
        </dl>`;
      const upd = () => {
        const e = Number($('#pn-el').value) * Math.PI / 180;
        const f = Math.sin(e), v = Math.cos(e);
        $('#pn-ev').textContent = `${Number($('#pn-el').value).toFixed(1)}°`;
        $('#pn-flat').style.width = `${f * 100}%`; $('#pn-flat-v').textContent = `${Math.round(1361 * f)} W`;
        $('#pn-vert').style.width = `${v * 100}%`; $('#pn-vert-v').textContent = `${Math.round(1361 * v)} W`;
      };
      $('#pn-el').addEventListener('input', upd); upd();
      return;
    }

    if (kind === 'season') {
      const body = this.labFrame(host, t('lab.seasonTitle'), t('lab.seasonNote'));
      const cv = document.createElement('canvas'); body.append(cv);
      const y0 = new Date().getUTCFullYear();
      const colors = [C.rose, C.ice, C.mist, C.indigo];
      const years = [0, 1, 2, 3].map(k => seasonYear(eph, y0 + k));
      const series = years.map((y, k) => ({ points: y.days.map((d, i) => [i, d.saoq]), color: colors[k], width: k === 0 ? 2.4 : 1.6 }));
      const d = ms => new Date(ms).toLocaleString(locale(), { month: 'short', day: 'numeric', timeZone: 'UTC' });
      const out = document.createElement('p'); out.className = 'lab-out';
      out.innerHTML = years.map((y, k) => `<span style="color:${colors[k] === C.indigo ? '#8f98ee' : colors[k]}">${t('lab.seasonRow', { year: y.year, a: d(y.window.start), b: d(y.window.end), peak: d(y.min.t) })}</span>`).join('<br>');
      body.append(out);
      const draw = () => lineChart(cv, { series, yMin: 0, yMax: 100, xLabel: t('lab.month'), yLabel: 'SAOQ (%)', xTicks: [0, 59, 120, 181, 243, 304].map((x, i) => [x, t('months')[i]]) });
      draw(); this.labs.push(draw);
      return;
    }

    if (kind === 'three-sites') {
      const body = this.labFrame(host, t('lab.threeTitle'), t('lab.threeNote'));
      const t0 = new Date();
      const rows = [['sp-ridge'], ['sp-pole'], ['sp-shackleton']].map(([id]) => {
        const s = app.prepare(this.site(id));
        const tl = eph.timeline(s, t0, 29.53, s.horizon, 60);
        return { s, tl, top: Math.max(...s.horizon.elevations) };
      });
      const dl = document.createElement('dl');
      dl.className = 'bars';
      dl.style.maxWidth = '640px';
      dl.innerHTML = rows.map(r => `<div style="grid-template-columns:200px 1fr"><dt>${r.s.name}<br><span class="hint">${t('lab.highest', { v: r.top.toFixed(1) })}</span></dt><dd><span class="bar sun"><i style="width:${(r.tl.sunFraction * 100).toFixed(1)}%"></i></span><b>${Math.round(r.tl.sunFraction * 100)} %</b></dd></div>`).join('');
      body.append(dl);
      const p = document.createElement('p'); p.className = 'hint'; p.textContent = t('lab.threeFoot');
      body.append(p);
      const row = document.createElement('div'); row.className = 'lab-controls';
      row.append(open('sp-ridge', t('lab.openRidgeShort')), open('sp-shackleton', t('lab.openShack')));
      body.append(row);
    }
  }

  /* -------------------------------------------------------- challenges */
  renderChallenge(host, c) {
    const app = this.app;
    const raw = app.siteById(app.state.siteId);
    const ev = app.evaluate(raw, app.state.epoch, c.days);
    const res = c.check({ site: { ...ev.site, id: raw.id }, tl: ev.tl, eph: app.eph, epoch: app.state.epoch });
    const done = !!this.p.challenges[c.id];
    host.innerHTML = `
      <div class="lesson-hero">
        <div>
          <p class="lesson-kicker">${t('ch.kicker', { xp: c.xp })}</p>
          <h1>${c.title}</h1>
          <p class="lesson-lede">${c.task}</p>
        </div>
        <img src="${c.badge}" alt="" width="200" height="200" style="max-width:200px;justify-self:center;border:0">
      </div>
      <div class="challenge-card">
        <h3>${t('ch.current')}</h3>
        <p>${t('ch.scenario', { site: raw.name, time: app.state.epoch.toISOString().slice(0, 16).replace('T', ' '), span: c.days === 29.53 ? t('ch.lunarDay') : t('ch.days', { n: c.days }) })}</p>
        <p class="challenge-status ${res.ok ? 'ok' : 'no'}">${res.ok ? t('ch.ok') : t('ch.no')}${res.detail}</p>
        <p class="hint">${done ? t('ch.again') : t('ch.hint', { hint: c.hint })}</p>
        <div class="lab-controls">
          <button class="btn" id="ch-go">${t('ch.change')}</button>
          <button class="btn ghost" id="ch-check">${t('ch.recheck')}</button>
        </div>
      </div>`;
    $('#ch-go').addEventListener('click', () => { app.setMode('mission'); scrollTo({ top: 0 }); });
    $('#ch-check').addEventListener('click', () => this.renderView());
    if (res.ok && !done) {
      this.p.challenges[c.id] = Date.now();
      this.save();
      this.award(c.xp, host.querySelector('.challenge-status'));
      this.badge(c.id);
      this.renderPath();
    }
  }
}

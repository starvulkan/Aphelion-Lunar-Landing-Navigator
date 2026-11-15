/**
 * Guided tour of the whole app, for everyone. A spotlight moves from one part
 * of the page to the next while a card explains it, in English or Spanish.
 * Starts from the Tour button; first-time visitors get a small invitation.
 */
import { t, getLang, onLang } from './i18n.js?v=202611150104';

const STEPS = [
  { center: true,
    en: ['Welcome to Aphelion', 'Aphelion shows where the Sun and Earth are from any spot on the Moon, against the real terrain around it. That tells you whether a lander gets power and can talk to Earth. This tour takes about a minute.'],
    es: ['Bienvenido a Aphelion', 'Aphelion muestra dónde están el Sol y la Tierra vistos desde cualquier punto de la Luna, frente al terreno real que lo rodea. Así sabes si un módulo de aterrizaje tiene energía y puede comunicarse con la Tierra. Este recorrido dura un minuto.'] },
  { sel: '#site-btn', mode: 'mission',
    en: ['Pick a place', 'Choose from 36 real sites (Artemis candidate regions, Apollo, Chang\'e, IM-2 and more), or type any coordinates on the Moon.'],
    es: ['Elige un lugar', 'Escoge entre 36 lugares reales (regiones candidatas de Artemis, Apollo, Chang\'e, IM-2 y más) o escribe cualquier coordenada de la Luna.'] },
  { sel: '.epoch', mode: 'mission',
    en: ['Pick the landing time', 'Set the date and time in UTC. The small buttons move it by an hour or a day, and Now follows the current time live.'],
    es: ['Elige el momento del aterrizaje', 'Pon la fecha y la hora en UTC. Los botones pequeños la mueven una hora o un día, y Ahora sigue la hora actual en vivo.'] },
  { sel: '.window', mode: 'mission',
    en: ['How long you stay', 'Every number in the app is worked out over this surface stay, from one day to a whole lunar day.'],
    es: ['Cuánto tiempo te quedas', 'Todos los números de la aplicación se calculan para esta estadía en la superficie, desde un día hasta un día lunar completo.'] },
  { sel: '.modes', mode: 'mission',
    en: ['Two modes', 'Mission is for exploring landing scenarios. Learn is a short course with lessons, quizzes and missions.'],
    es: ['Dos modos', 'Misión sirve para explorar escenarios de aterrizaje. Aprender es un curso corto con lecciones, preguntas y misiones.'] },
  { sel: '.stage-top .level', mode: 'mission', level: 'pro', top: true,
    en: ['Professional or Educational', 'Professional shows every number at a glance, for mission teams. Educational tells the same story in plain words and pictures.'],
    es: ['Profesional o Educativo', 'Profesional muestra todos los números de un vistazo, para equipos de misión. Educativo cuenta lo mismo con palabras sencillas y dibujos.'] },
  { sel: '.stage-top .view-tabs', mode: 'mission', top: true,
    en: ['Three views', '3D terrain with real shadows, a 360° panorama of the horizon, and the whole Moon with Earth and the Sun in their true directions.'],
    es: ['Tres vistas', 'Terreno 3D con sombras reales, un panorama de 360° del horizonte y la Luna completa con la Tierra y el Sol en sus direcciones reales.'] },
  { sel: '.console .stage', mode: 'mission', top: true,
    en: ['Real terrain', 'The ground comes from NASA\'s LOLA laser altimeter. Drag to look around. Pink is always the Sun, light blue is always Earth.'],
    es: ['Terreno real', 'El suelo viene del altímetro láser LOLA de la NASA. Arrastra para mirar alrededor. El rosa siempre es el Sol y el celeste siempre es la Tierra.'] },
  { sel: '.track', mode: 'mission',
    en: ['Travel through time', 'The timeline shows when the Sun (top) and Earth (bottom) are above the terrain during your stay. Press play, or drag along it.'],
    es: ['Viaja en el tiempo', 'La línea de tiempo muestra cuándo el Sol (arriba) y la Tierra (abajo) están por encima del terreno durante tu estadía. Dale play o arrástrala.'] },
  { sel: '.rail .scoreband', mode: 'mission', level: 'pro', top: true,
    en: ['One score from 0 to 100', 'It combines power, radio contact, how long the longest night lasts, and how steep the ground is. A spot with no sunlight or no Earth scores 0.'],
    es: ['Una nota de 0 a 100', 'Combina energía, contacto por radio, cuánto dura la noche más larga y qué tan inclinado está el suelo. Un lugar sin luz solar o sin Tierra saca 0.'] },
  { sel: '.rail .now', mode: 'mission', level: 'pro',
    en: ['Where the Sun and Earth are', 'Height, direction and the terrain in that direction. If the clearance is above zero, you can see it. Below are the next sunset and Earthset.'],
    es: ['Dónde están el Sol y la Tierra', 'Altura, dirección y el terreno en esa dirección. Si el margen es mayor que cero, se ve. Abajo están la próxima puesta de sol y de Tierra.'] },
  { sel: '.lower .sweep', mode: 'mission', level: 'pro',
    en: ['Find the best day', 'A calendar of landing days, shaded by how good each one is. Tap any day to land then.'],
    es: ['Encuentra el mejor día', 'Un calendario de días de aterrizaje, coloreado según qué tan bueno es cada uno. Toca cualquier día para aterrizar ese día.'] },
  { sel: '.season', mode: 'mission', level: 'pro',
    en: ['The Moon has seasons', 'The whole year for this site. The top band is the southern-summer index from our team\'s report.'],
    es: ['La Luna tiene estaciones', 'El año completo para este lugar. La franja de arriba es el índice del verano del sur del informe de nuestro equipo.'] },
  { sel: '.compare', mode: 'mission', level: 'pro',
    en: ['Compare options', 'Pin scenarios to see them side by side, then download them as a spreadsheet.'],
    es: ['Compara opciones', 'Fija escenarios para verlos lado a lado y descárgalos como hoja de cálculo.'] },
  { sel: '#edu-panel .edu-hero', mode: 'mission', level: 'edu',
    en: ['The Educational level', 'The same scenario as a friendly landing report, with a challenge: can you find a better spot?'],
    es: ['El nivel Educativo', 'El mismo escenario como un informe de aterrizaje fácil de leer, con un reto: ¿puedes encontrar un lugar mejor?'] },
  { sel: '.hub-hero', mode: 'learn', top: true,
    en: ['Learn mode', 'Ten short lessons about light, shadow and radio on the Moon, each with a live lab and a quiz. Earn XP and climb the ranks.'],
    es: ['Modo Aprender', 'Diez lecciones cortas sobre luz, sombra y radio en la Luna, cada una con un laboratorio en vivo y preguntas. Gana XP y sube de rango.'] },
  { sel: '#mission-cards', mode: 'learn', top: true,
    en: ['Missions and badges', 'Find real scenarios, like a spot that stays lit or a crater in eternal night. The app checks your answer, and you earn a badge designed by our team.'],
    es: ['Misiones e insignias', 'Encuentra escenarios reales, como un lugar siempre iluminado o un cráter en noche eterna. La aplicación revisa tu respuesta y ganas una insignia diseñada por nuestro equipo.'] },
  { sel: '.lang', mode: 'learn',
    en: ['English or Spanish', 'Learn mode and this tour are available in Spanish too.'],
    es: ['Inglés o español', 'El modo Aprender y este recorrido también están en inglés.'] },
  { sel: '#info-btn', mode: 'mission',
    en: ['Check our work', 'Every data source is listed here, with steps to check the numbers yourself against NASA/JPL Horizons. Replay this tour any time from the Tour button.'],
    es: ['Revisa nuestro trabajo', 'Aquí están todas las fuentes de datos, con pasos para comprobar los números tú mismo con NASA/JPL Horizons. Repite este recorrido cuando quieras con el botón Recorrido.'] }
];

export class Tour {
  constructor(app) {
    this.app = app;
    this.i = 0;
    this.open = false;
  }

  init() {
    const btn = document.getElementById('tour-btn');
    btn.addEventListener('click', () => this.start());
    const label = () => { document.getElementById('tour-btn-label').textContent = t('tour.btn'); };
    label();
    onLang(() => { label(); if (this.open) this.show(); if (this.invite) this.renderInvite(); });
    this.reposition = () => this.place();
    // First visit: a small invitation instead of starting on its own.
    if (location.hash.includes('tour')) setTimeout(() => this.start(), 800);
    else if (!this.app.store.get('tourSeen', false)) setTimeout(() => this.showInvite(), 2200);
  }

  showInvite() {
    if (this.open || this.app.store.get('tourSeen', false)) return;
    this.invite = document.createElement('div');
    this.invite.className = 'tour-invite';
    this.invite.setAttribute('role', 'status');
    document.body.append(this.invite);
    this.renderInvite();
  }

  renderInvite() {
    this.invite.innerHTML = `<p>${t('tour.invite')}</p><div><button class="btn" data-a="go">${t('tour.start')}</button><button class="btn ghost" data-a="no">${t('tour.later')}</button></div>`;
    this.invite.querySelector('[data-a=go]').addEventListener('click', () => this.start());
    this.invite.querySelector('[data-a=no]').addEventListener('click', () => this.closeInvite());
  }

  closeInvite() {
    this.app.store.set('tourSeen', true);
    this.invite?.remove(); this.invite = null;
  }

  start() {
    this.closeInvite();
    const s = this.app.state;
    this.saved = { mode: s.mode || 'mission', level: s.level, scroll: scrollY };
    this.open = true;
    this.root = document.createElement('div');
    this.root.className = 'tour';
    this.root.innerHTML = `<div class="tour-spot"></div>
      <div class="tour-card glass" role="dialog" aria-modal="true" aria-labelledby="tour-title" tabindex="-1">
        <div class="tour-bar"><i></i></div>
        <p class="tour-count"></p>
        <h2 id="tour-title"></h2>
        <p class="tour-text"></p>
        <div class="tour-actions">
          <button class="tour-skip"></button>
          <span></span>
          <button class="btn ghost tour-back"></button>
          <button class="btn tour-next"></button>
        </div>
      </div>`;
    document.body.append(this.root);
    this.spot = this.root.querySelector('.tour-spot');
    this.card = this.root.querySelector('.tour-card');
    this.root.querySelector('.tour-next').addEventListener('click', () => this.go(1));
    this.root.querySelector('.tour-back').addEventListener('click', () => this.go(-1));
    this.root.querySelector('.tour-skip').addEventListener('click', () => this.end());
    this.onKey = e => {
      if (e.key === 'Escape') this.end();
      else if (e.key === 'ArrowRight') this.go(1);
      else if (e.key === 'ArrowLeft') this.go(-1);
    };
    addEventListener('keydown', this.onKey);
    addEventListener('resize', this.reposition);
    addEventListener('scroll', this.reposition, { passive: true });
    this.i = 0;
    this.show();
    requestAnimationFrame(() => this.card.focus());
  }

  go(d) {
    const n = this.i + d;
    if (n < 0) return;
    if (n >= STEPS.length) return this.end();
    this.i = n;
    this.show();
  }

  show() {
    const st = STEPS[this.i], [title, text] = st[getLang()] || st.en, app = this.app;
    if (st.mode && app.state.mode !== st.mode) app.setMode(st.mode);
    if (st.level && app.state.level !== st.level) app.setLevel(st.level);
    if (st.mode === 'learn' && app.learn?.view?.type !== 'hub') app.learn.go({ type: 'hub' });
    this.root.querySelector('.tour-count').textContent = t('tour.step', { n: this.i + 1, total: STEPS.length });
    this.root.querySelector('#tour-title').textContent = title;
    this.root.querySelector('.tour-text').textContent = text;
    this.root.querySelector('.tour-bar i').style.width = `${((this.i + 1) / STEPS.length) * 100}%`;
    const back = this.root.querySelector('.tour-back');
    back.textContent = t('tour.back'); back.hidden = this.i === 0;
    this.root.querySelector('.tour-next').textContent = this.i === STEPS.length - 1 ? t('tour.done') : t('tour.next');
    this.root.querySelector('.tour-skip').textContent = t('tour.skip');
    this.target = st.center ? null : document.querySelector(st.sel);
    this.target?.querySelectorAll('.reveal, .line').forEach(e => e.classList.add('in'));
    this.target?.classList.add('in');
    if (this.target) {
      const r = this.target.getBoundingClientRect();
      const fixed = !!this.target.closest('.topbar');
      if (!fixed && (st.top || r.top < 70 || r.bottom > innerHeight - 20)) {
        const bar = (document.querySelector('.topbar')?.offsetHeight || 64) + 16;
        const y = scrollY + r.top - (st.top ? bar : Math.max(bar, (innerHeight - Math.min(r.height, innerHeight * 0.6)) / 2 - 80));
        const far = Math.abs(y - scrollY) > innerHeight * 1.5;   // long jumps happen at once, short ones glide
        scrollTo({ top: Math.max(0, y), behavior: far || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
    }
    this.place();
    clearTimeout(this._pt); this._pt = setTimeout(() => this.place(), 450);
  }

  /** Move the spotlight onto the target and put the card next to it, inside the window. */
  place() {
    if (!this.open) return;
    const pad = 8, gap = 14, vw = innerWidth, vh = innerHeight;
    const card = this.card, cw = Math.min(380, vw - 24);
    card.style.width = `${cw}px`;
    const ch = card.offsetHeight;
    if (!this.target) {
      Object.assign(this.spot.style, { left: `${vw / 2}px`, top: `${vh / 2}px`, width: '0px', height: '0px' });
      Object.assign(card.style, { left: `${(vw - cw) / 2}px`, top: `${Math.max(12, (vh - ch) / 2)}px` });
      return;
    }
    const r = this.target.getBoundingClientRect();
    const box = { left: r.left - pad, top: Math.max(4, r.top - pad), width: r.width + pad * 2, height: Math.min(r.height + pad * 2, vh - 8) };
    Object.assign(this.spot.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
    let left = Math.min(Math.max(12, box.left), vw - cw - 12), top;
    if (vw < 640) top = vh - ch - 12;                                       // phones: card docked at the bottom
    else if (box.top + box.height + gap + ch < vh) top = box.top + box.height + gap;  // below
    else if (box.top - gap - ch > 0) top = box.top - gap - ch;               // above
    else {                                                                    // beside, or inside the target as a last resort
      top = Math.min(Math.max(12, box.top + 12), vh - ch - 12);
      left = box.left + box.width + gap + cw < vw ? box.left + box.width + gap : box.left - gap - cw > 0 ? box.left - gap - cw : vw - cw - 24;
    }
    Object.assign(card.style, { left: `${left}px`, top: `${top}px` });
  }

  end() {
    if (!this.open) return;
    this.open = false;
    this.app.store.set('tourSeen', true);
    removeEventListener('keydown', this.onKey);
    removeEventListener('resize', this.reposition);
    removeEventListener('scroll', this.reposition);
    this.root.remove();
    const s = this.saved;
    if (s) {
      if (this.app.state.level !== s.level) this.app.setLevel(s.level);
      if (this.app.state.mode !== s.mode) this.app.setMode(s.mode);
      scrollTo({ top: s.mode === 'mission' ? 0 : s.scroll });
    }
    document.getElementById('tour-btn').focus();
  }
}

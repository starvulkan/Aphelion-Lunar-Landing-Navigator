/**
 * Language for Learn mode and the guided tour: English (en) or Spanish (es).
 * Mission mode stays in English. t(key, vars) returns the string for the
 * current language, falling back to English; {name} placeholders are filled
 * from vars.
 */
const S = {
  en: {
    // hub
    'hub.tag': 'mission academy · lunar south pole',
    'hub.h1': 'Land where the Sun never sets',
    'hub.l1': 'Land where', 'hub.l2': 'the <em class="sun-word">Sun</em> never', 'hub.l3': '<em class="earth-word">sets</em>',
    'hub.start': 'Start lesson 1', 'hub.continue': 'Continue: lesson {n}', 'hub.jump': 'Jump to missions',
    'hub.marquee1': ['Sunlight', 'Earthrise', 'Shadow', 'Ice', 'Horizon'],
    'hub.marquee2': ['Ridge', 'Crater', 'Libration', 'Season', 'Signal'],
    'hub.whyTag': 'why it is hard',
    'hub.statement': 'At the Moon\'s south pole the <em class="sun-word">Sun</em> skims the horizon, never more than a degree or two up. One <em>ridge</em> gets months of light. The <em>crater</em> beside it has been dark for billions of years. <em class="earth-word">Earth</em> bobs up and down twice a month, and with it your radio link. Pick the right place and the right day, and a lander <em>lives</em>.',
    'hub.plan1': 'Flight', 'hub.plan2': 'plan', 'hub.miss1': 'Your', 'hub.miss2': 'missions',
    'hub.missNote': 'Missions are checked against your real scenario in Mission mode, with the same terrain and ephemeris.',
    'hub.badges': 'Badges',
    'card.lesson': 'Lesson {n}: {title}', 'card.done': 'Completed', 'card.meta': '{q} questions · up to {xp} XP',
    'card.mission': 'Mission: {title}', 'card.accomplished': 'Accomplished',
    'next.sunrise': 'next sunrise', 'next.sunset': 'next sunset', 'next.sunlight': 'sunlight',
    'next.noSunset': 'no sunset for 30 days', 'next.noSunrise': 'no sunrise for 30 days',
    'rank.to': '{xp} XP · {left} to {next}', 'rank.top': '{xp} XP · top rank',
    'badge.earned': 'Badge earned: {name}',
    // pages
    'page.back': 'All lessons', 'page.plan': 'Flight plan', 'page.missions': 'Missions',
    'lesson.kicker': 'Lesson {n} of {total}', 'lesson.check': 'Check yourself',
    'lesson.prev': 'Previous: {title}', 'lesson.next': 'Next: {title}', 'lesson.toMissions': 'Go to the missions',
    'quiz.retry': 'Try the questions again (no extra XP)',
    'ch.kicker': 'Mission · {xp} XP', 'ch.current': 'Your current scenario',
    'ch.scenario': '{site}, landing {time} UTC, checked over {span}.', 'ch.lunarDay': 'one lunar day', 'ch.days': '{n} days',
    'ch.ok': 'Mission accomplished. ', 'ch.no': 'Not yet. ', 'ch.again': 'Already completed. Try to find another answer.', 'ch.hint': 'Hint: {hint}',
    'ch.change': 'Change the scenario in Mission mode', 'ch.recheck': 'Check again',
    'ch.lightsOn': '{site}: sunlight {s} %, Earth in view {e} % over 7 days', 'ch.north80': '. This site is north of 80°S',
    'ch.blackout': '{site}: Earth in view {e} % of a lunar day.', 'ch.night': '{site}: sunlight {s} % of a lunar day.',
    'ch.apollo': '{site}: Sun at {el}° and {dir}', 'ch.rising': 'rising', 'ch.setting': 'setting', 'ch.notApollo': ', but not an Apollo site',
    // labs
    'lab.see': 'See it in Mission mode', 'lab.realLola': 'Real LOLA terrain',
    'lab.openRidge': 'Open the connecting ridge', 'lab.openShack': 'Open Shackleton\'s floor', 'lab.openMalapert': 'Open Malapert Massif', 'lab.openRidgeShort': 'Open the ridge',
    'lab.dipTitle': 'How far is the horizon?', 'lab.dipNote': 'Smooth Moon, no terrain', 'lab.eye': 'Eye height',
    'lab.dipOut': 'On the Moon the smooth horizon is <strong>{d} km</strong> away and sits <strong>{dip}°</strong> below level. On Earth, from the same height, it would be {dE} km away.',
    'lab.dayTitle': 'Sun height over the next 30 days', 'lab.live': 'Live ephemeris',
    'lab.dayLegend': '<span style="color:{rose}">Pink</span>: Apollo 11 site, near the equator. <span style="color:{ice}">Light blue</span>: geographic south pole.',
    'lab.daysFromNow': 'days from now', 'lab.daysFromToday': 'days from today', 'lab.sunEl': 'Sun elevation (°)', 'lab.earthEl': 'Earth elevation (°)', 'lab.month': 'month',
    'lab.yearTitle': 'The Sun at the south pole for one year', 'lab.yearNote': 'Live ephemeris, daily at 00:00 UTC',
    'lab.yearOut': 'Highest: {max}°, lowest: {min}° over the next 365 days.',
    'lab.earthTitle': 'Earth\'s height over the next 60 days', 'lab.earthNote': 'Live ephemeris + LOLA terrain',
    'lab.earthRow': '{site}: Earth above the terrain {p} % of the time',
    'lab.panelTitle': 'Flat panel or upright panel?', 'lab.panelNote': 'Geometry only, 1361 W/m²', 'lab.sunElShort': 'Sun elevation',
    'lab.flat': 'Flat on the ground', 'lab.upright': 'Upright, facing the Sun',
    'lab.seasonTitle': 'Southern summer, year by year', 'lab.seasonNote': 'Live ephemeris, checked against the team report',
    'lab.seasonRow': '{year}: 90 % or more from {a} to {b}, peak {peak}',
    'lab.threeTitle': 'Three places, one lunar day', 'lab.threeNote': 'LOLA terrain + live ephemeris, starting now',
    'lab.highest': 'highest terrain {v}°', 'lab.threeFoot': 'Bars show the share of the next 29.5 days with the Sun above the local terrain.',
    'months': ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
    // language switch
    'lang.label': 'Language',
    // tour
    'tour.btn': 'Tour', 'tour.next': 'Next', 'tour.back': 'Back', 'tour.skip': 'Skip', 'tour.done': 'Start exploring', 'tour.start': 'Take the tour', 'tour.later': 'Not now',
    'tour.step': '{n} of {total}',
    'tour.invite': 'New here? A one-minute tour shows you around.'
  },
  es: {
    'hub.tag': 'academia de misiones · polo sur lunar',
    'hub.h1': 'Aterriza donde el Sol nunca se pone',
    'hub.l1': 'Aterriza donde', 'hub.l2': 'el <em class="sun-word">Sol</em> nunca', 'hub.l3': '<em class="earth-word">se pone</em>',
    'hub.start': 'Empezar la lección 1', 'hub.continue': 'Seguir: lección {n}', 'hub.jump': 'Ir a las misiones',
    'hub.marquee1': ['Luz solar', 'Salida de la Tierra', 'Sombra', 'Hielo', 'Horizonte'],
    'hub.marquee2': ['Cresta', 'Cráter', 'Libración', 'Estación', 'Señal'],
    'hub.whyTag': 'por qué es difícil',
    'hub.statement': 'En el polo sur de la Luna, el <em class="sun-word">Sol</em> roza el horizonte y nunca sube más de uno o dos grados. Una <em>cresta</em> recibe meses de luz. El <em>cráter</em> de al lado lleva miles de millones de años a oscuras. La <em class="earth-word">Tierra</em> sube y baja dos veces al mes, y con ella tu comunicación por radio. Elige el lugar y el día correctos, y el módulo <em>sobrevive</em>.',
    'hub.plan1': 'Plan de', 'hub.plan2': 'vuelo', 'hub.miss1': 'Tus', 'hub.miss2': 'misiones',
    'hub.missNote': 'Las misiones se revisan con tu escenario real del modo Misión, con el mismo terreno y las mismas efemérides.',
    'hub.badges': 'Insignias',
    'card.lesson': 'Lección {n}: {title}', 'card.done': 'Completada', 'card.meta': '{q} preguntas · hasta {xp} XP',
    'card.mission': 'Misión: {title}', 'card.accomplished': 'Cumplida',
    'next.sunrise': 'próximo amanecer', 'next.sunset': 'próxima puesta de sol', 'next.sunlight': 'luz solar',
    'next.noSunset': 'sin puesta de sol en 30 días', 'next.noSunrise': 'sin amanecer en 30 días',
    'rank.to': '{xp} XP · faltan {left} para {next}', 'rank.top': '{xp} XP · rango máximo',
    'badge.earned': 'Insignia ganada: {name}',
    'page.back': 'Todas las lecciones', 'page.plan': 'Plan de vuelo', 'page.missions': 'Misiones',
    'lesson.kicker': 'Lección {n} de {total}', 'lesson.check': 'Ponte a prueba',
    'lesson.prev': 'Anterior: {title}', 'lesson.next': 'Siguiente: {title}', 'lesson.toMissions': 'Ir a las misiones',
    'quiz.retry': 'Volver a intentar las preguntas (sin XP extra)',
    'ch.kicker': 'Misión · {xp} XP', 'ch.current': 'Tu escenario actual',
    'ch.scenario': '{site}, aterrizaje el {time} UTC, revisado durante {span}.', 'ch.lunarDay': 'un día lunar', 'ch.days': '{n} días',
    'ch.ok': 'Misión cumplida. ', 'ch.no': 'Todavía no. ', 'ch.again': 'Ya la completaste. Intenta encontrar otra respuesta.', 'ch.hint': 'Pista: {hint}',
    'ch.change': 'Cambiar el escenario en el modo Misión', 'ch.recheck': 'Revisar de nuevo',
    'ch.lightsOn': '{site}: luz solar {s} %, Tierra visible {e} % durante 7 días', 'ch.north80': '. Este lugar está al norte de 80°S',
    'ch.blackout': '{site}: Tierra visible {e} % de un día lunar.', 'ch.night': '{site}: luz solar {s} % de un día lunar.',
    'ch.apollo': '{site}: Sol a {el}° y {dir}', 'ch.rising': 'subiendo', 'ch.setting': 'bajando', 'ch.notApollo': ', pero no es un lugar de Apollo',
    'lab.see': 'Míralo en el modo Misión', 'lab.realLola': 'Terreno real de LOLA',
    'lab.openRidge': 'Abrir la cresta de conexión', 'lab.openShack': 'Abrir el fondo de Shackleton', 'lab.openMalapert': 'Abrir el Macizo Malapert', 'lab.openRidgeShort': 'Abrir la cresta',
    'lab.dipTitle': '¿A qué distancia está el horizonte?', 'lab.dipNote': 'Luna lisa, sin terreno', 'lab.eye': 'Altura de los ojos',
    'lab.dipOut': 'En la Luna, el horizonte liso está a <strong>{d} km</strong> y queda <strong>{dip}°</strong> por debajo del nivel. En la Tierra, desde la misma altura, estaría a {dE} km.',
    'lab.dayTitle': 'Altura del Sol en los próximos 30 días', 'lab.live': 'Efemérides en vivo',
    'lab.dayLegend': '<span style="color:{rose}">Rosa</span>: lugar del Apollo 11, cerca del ecuador. <span style="color:{ice}">Celeste</span>: polo sur geográfico.',
    'lab.daysFromNow': 'días desde ahora', 'lab.daysFromToday': 'días desde hoy', 'lab.sunEl': 'Elevación del Sol (°)', 'lab.earthEl': 'Elevación de la Tierra (°)', 'lab.month': 'mes',
    'lab.yearTitle': 'El Sol en el polo sur durante un año', 'lab.yearNote': 'Efemérides en vivo, cada día a las 00:00 UTC',
    'lab.yearOut': 'Máxima: {max}°, mínima: {min}° en los próximos 365 días.',
    'lab.earthTitle': 'Altura de la Tierra en los próximos 60 días', 'lab.earthNote': 'Efemérides en vivo + terreno LOLA',
    'lab.earthRow': '{site}: Tierra sobre el terreno el {p} % del tiempo',
    'lab.panelTitle': '¿Panel acostado o panel de pie?', 'lab.panelNote': 'Solo geometría, 1361 W/m²', 'lab.sunElShort': 'Elevación del Sol',
    'lab.flat': 'Acostado en el suelo', 'lab.upright': 'De pie, mirando al Sol',
    'lab.seasonTitle': 'El verano del sur, año por año', 'lab.seasonNote': 'Efemérides en vivo, comparadas con el informe del equipo',
    'lab.seasonRow': '{year}: 90 % o más del {a} al {b}, máximo el {peak}',
    'lab.threeTitle': 'Tres lugares, un día lunar', 'lab.threeNote': 'Terreno LOLA + efemérides en vivo, desde ahora',
    'lab.highest': 'terreno más alto {v}°', 'lab.threeFoot': 'Las barras muestran qué parte de los próximos 29.5 días tiene el Sol por encima del terreno local.',
    'months': ['ene', 'mar', 'may', 'jul', 'sep', 'nov'],
    'lang.label': 'Idioma',
    'tour.btn': 'Recorrido', 'tour.next': 'Siguiente', 'tour.back': 'Atrás', 'tour.skip': 'Saltar', 'tour.done': 'Empezar a explorar', 'tour.start': 'Hacer el recorrido', 'tour.later': 'Ahora no',
    'tour.step': '{n} de {total}',
    'tour.invite': '¿Primera vez aquí? Un recorrido de un minuto te muestra todo.'
  }
};

let lang = 'en';
const listeners = new Set();

export const getLang = () => lang;
export const locale = () => (lang === 'es' ? 'es' : 'en');
export function setLang(l) {
  lang = l === 'es' ? 'es' : 'en';
  document.documentElement.lang = lang;
  listeners.forEach(fn => fn(lang));
}
export const onLang = fn => listeners.add(fn);

export function t(key, vars) {
  let v = S[lang][key] ?? S.en[key] ?? key;
  if (typeof v === 'string' && vars) v = v.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return v;
}

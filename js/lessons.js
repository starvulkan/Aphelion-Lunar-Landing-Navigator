/**
 * Learn-mode content. Every number here is either a textbook constant or is
 * computed live by the same engine the Mission mode uses. References are in
 * DATA_SOURCES.md (section "Lesson facts").
 */
export const LESSONS = [
  {
    id: 'why-pole',
    title: 'Why everyone wants the south pole',
    lede: 'The Moon barely tilts, so near its poles the Sun never climbs high. That makes some places almost always lit and others never lit at all.',
    image: 'graphics/lesson-01-south-pole.svg',
    body: `
      <p>The Moon's spin axis is tilted only <strong>1.54°</strong> from the plane of Earth's orbit around the Sun (Earth's is tilted 23.4°). Stand near a lunar pole and the <span class="sun-word">Sun</span> just skims around the horizon, never rising more than a degree or two.</p>
      <p>That produces two kinds of extreme places only a few kilometres apart:</p>
      <ul>
        <li><strong>High ridges and crater rims</strong> that stay in sunlight for most of the year; the best spots on the connecting ridge between Shackleton and de Gerlache craters are lit for more than 80 % of the time (LOLA illumination studies).</li>
        <li><strong>Crater floors that have not seen the Sun in billions of years.</strong> These permanently shadowed regions are among the coldest places measured in the Solar System, some below 40 K (−233 °C), cold enough to trap water ice.</li>
      </ul>
      <div class="fact-box"><p>In 2009 NASA's LCROSS probe crashed into the permanently shadowed floor of Cabeus crater and measured water in the debris plume: about 5.6 % by mass.</p></div>
      <p>Sunlight for power, ice for water and rocket fuel, all within driving distance: that is why the Artemis candidate regions and China's Chang'e 7 all cluster within a few degrees of the south pole.</p>`,
    lab: 'pole-pair',
    quiz: [
      { q: 'How far is the Moon\'s spin axis tilted relative to the plane of Earth\'s orbit?', options: ['About 1.5°', 'About 6.7°', 'About 23.4°', 'About 45°'], answer: 0,
        why: 'The tilt is 1.54°. 23.4° is Earth\'s tilt, and 6.7° is the Moon\'s tilt relative to its own orbit around Earth.' },
      { q: 'Why can water ice survive at the lunar south pole?', options: ['The pole is far from the Sun', 'Some crater floors never receive sunlight and stay extremely cold', 'Earth\'s shadow covers the pole', 'The pole has a thin atmosphere'], answer: 1,
        why: 'Permanently shadowed crater floors never see direct sunlight and can stay below 40 K, so ice does not sublimate.' },
      { q: 'What did LCROSS find in Cabeus crater in 2009?', options: ['Liquid water', 'Water in the impact plume', 'Signs of past life', 'A buried lander'], answer: 1,
        why: 'The impact plume contained water (about 5.6 % by mass), confirming ice in a permanently shadowed region.' }
    ]
  },
  {
    id: 'horizon',
    title: 'How to read the horizon view',
    lede: 'Azimuth says which way to look. Elevation says how high. The terrain line decides whether you can actually see it.',
    image: 'graphics/lesson-02-horizon.svg',
    body: `
      <p>Every point in the sky has two numbers. <strong>Azimuth</strong> is the compass direction, measured clockwise from north (east is 90°, south 180°, west 270°). <strong>Elevation</strong> is the angle above the horizon: 0° is level, 90° is straight overhead.</p>
      <p>On a perfectly smooth Moon, the horizon of someone standing 2 m tall would be only <strong>2.6 km</strong> away, about half the distance on Earth, because the Moon is smaller and curves away faster. Real terrain changes everything: a mountain 100 km away can rise above that line and block the <span class="sun-word">Sun</span>.</p>
      <div class="fact-box"><p>There is no air on the Moon, so light travels in straight lines. On Earth, the atmosphere bends sunlight and lets you see the Sun for a couple of minutes after it is geometrically below the horizon. On the Moon, the horizon you calculate is the horizon you get.</p></div>
      <p>In Mission mode, the panorama spreads the full 360° around you. The blue silhouette is the real terrain measured by the laser altimeter LOLA on NASA's Lunar Reconnaissance Orbiter. The pink and light blue tracks are where the Sun and Earth travel during your stay; dashed parts are hidden behind terrain.</p>`,
    lab: 'horizon-dip',
    quiz: [
      { q: 'A body at azimuth 270° is in which direction?', options: ['North', 'East', 'South', 'West'], answer: 3, why: 'Azimuth is measured clockwise from north: 90° east, 180° south, 270° west.' },
      { q: 'Why is the smooth-sphere horizon closer on the Moon than on Earth?', options: ['The Moon has no air', 'The Moon is smaller, so its surface curves away sooner', 'Lunar dust blocks the view', 'The Moon rotates slowly'], answer: 1,
        why: 'Horizon distance is about √(2Rh). The Moon\'s radius R is 1,737 km versus Earth\'s 6,371 km.' },
      { q: 'What does the dashed part of the Sun\'s track in the panorama mean?', options: ['The Sun is eclipsed by Earth', 'The Sun is below the terrain horizon at that time', 'The data is missing', 'The Sun is behind a cloud'], answer: 1,
        why: 'Dashed segments mark times when the Sun\'s centre is below the local LOLA terrain line.' }
    ]
  },
  {
    id: 'lunar-day',
    title: 'One lunar day lasts a month',
    lede: 'The Moon turns once for every trip around Earth, so the Sun takes 29.5 Earth days to come back to the same spot in its sky.',
    image: 'graphics/lesson-03-lunar-day.svg',
    body: `
      <p>The Moon is <strong>tidally locked</strong>: it spins exactly once per orbit, which is why we always see the same face. Measured against the stars, one turn takes 27.3 days. Measured against the Sun (sunrise to sunrise), it takes <strong>29.53 days</strong>, because the Earth–Moon pair is also moving around the Sun.</p>
      <p>Near the equator that means roughly two weeks of daylight followed by two weeks of night. The <span class="sun-word">Sun</span> moves only about 12° across the sky per Earth day.</p>
      <p>Apollo crews landed in the lunar morning, with the Sun low in the east (roughly 5° to 15° up), so long shadows would reveal boulders and craters, and so the surface would not yet be at full midday heat.</p>
      <div class="myth-box"><p><strong>Myth:</strong> "The far side is the dark side." The far side gets exactly as much sunlight as the near side. It is only hidden from <em>Earth</em>.</p></div>`,
    lab: 'day-compare',
    quiz: [
      { q: 'How long is a full lunar day, sunrise to sunrise?', options: ['24 hours', 'About 14.8 Earth days', 'About 29.5 Earth days', 'About 365 Earth days'], answer: 2,
        why: 'The synodic period is 29.53 days: about two weeks of light and two of darkness near the equator.' },
      { q: 'Why does the far side get as much sunlight as the near side?', options: ['It doesn\'t; it is always dark', 'The Moon rotates, so every side faces the Sun in turn', 'Earth reflects light onto it', 'It faces the Sun permanently'], answer: 1,
        why: 'The Moon rotates once a month relative to the Sun, so the far side has day and night like everywhere else.' },
      { q: 'Roughly how far does the Sun move across the lunar sky in one Earth day?', options: ['About 1°', 'About 12°', 'About 45°', 'About 360°'], answer: 1, why: '360° divided by 29.5 days is about 12° per day.' }
    ]
  },
  {
    id: 'polar-sun',
    title: 'The Sun at the pole: a year-long wobble',
    lede: 'At the pole the Sun circles the horizon once a lunar day, while its height drifts between about −1.5° and +1.5° over the year.',
    image: 'graphics/lesson-04-polar-sun.svg',
    body: `
      <p>Exactly at the pole, the <span class="sun-word">Sun</span> goes all the way around the horizon once every 29.5 days. Its elevation hardly changes during that loop. Over a longer cycle of about <strong>346.6 days</strong> it slowly rises to about <strong>+1.5°</strong> and sinks to about <strong>−1.5°</strong>, because of the 1.54° tilt.</p>
      <p>So the south pole has seasons. In southern lunar "summer" the Sun is slightly above a smooth horizon; in "winter" it is slightly below. A difference of 1–2° sounds tiny, but with ridges on the horizon that small change decides whether a solar panel gets light or not.</p>
      <p>The chart below is computed live by the same ephemeris engine as Mission mode, for the geographic south pole over the next year.</p>`,
    lab: 'pole-year',
    quiz: [
      { q: 'At the geographic south pole, the Sun\'s elevation over a year stays roughly within…', options: ['±0.1°', '±1.5°', '±6.7°', '±23°'], answer: 1,
        why: 'With a 1.54° axial tilt, the solar elevation at the pole swings between about −1.5° and +1.5°.' },
      { q: 'At the pole, how long does the Sun take to circle the whole horizon?', options: ['About 24 hours', 'About 29.5 days', 'About 346 days', 'It never circles'], answer: 1, why: 'One full circle per lunar day (29.53 days).' },
      { q: 'Why does a 1° change in solar elevation matter so much at the pole?', options: ['Panels stop working below 1°', 'Nearby ridges sit about that high, so 1° decides sunlight or shadow', 'The Sun gets hotter', 'It changes the length of the lunar day'], answer: 1,
        why: 'Polar horizons are often 0.5–5° high, so a small change in solar elevation moves the Sun in or out of view.' }
    ]
  },
  {
    id: 'earth',
    title: 'Where is Earth in the lunar sky?',
    lede: 'Earth barely moves, but it does wobble. Near the poles that wobble makes Earth rise and set about twice a month.',
    image: 'graphics/lesson-05-earth.svg',
    body: `
      <p>Because the Moon is tidally locked, <span class="earth-word">Earth</span> hangs in nearly the same place in the sky as seen from any spot on the near side. It does not rise and set every day the way the Sun does.</p>
      <p>It does wobble. This is called <strong>libration</strong>. The Moon's orbit is an ellipse, so its spin and its orbital motion drift in and out of step, swinging Earth up to about <strong>±7.9°</strong> east–west. The Moon's equator is tilted to its orbit, nodding Earth about <strong>±6.7°</strong> north–south over 27.2 days.</p>
      <p>At the south pole the "average" Earth sits right on the horizon, so the north–south nod lifts it up to about +6.7° and pushes it down to −6.7°. Earth is visible for roughly half of each month, and less if terrain blocks the north. On the far side, Earth is never visible: missions there need a relay satellite such as China's Queqiao.</p>
      <div class="fact-box"><p>Seen from the Moon, Earth's disc is about 1.9° wide, almost four times as wide as the full Moon looks from Earth.</p></div>`,
    lab: 'earth-month',
    quiz: [
      { q: 'What is libration?', options: ['Earth\'s rotation', 'The apparent wobble of the Moon (and Earth in the lunar sky) caused by its orbit and tilt', 'A type of radio signal', 'Moonquakes'], answer: 1,
        why: 'Libration comes from the elliptical orbit (east–west) and the tilt of the lunar equator to the orbit (north–south).' },
      { q: 'Why did Chang\'e 4 need a relay satellite?', options: ['It landed on the far side, where Earth is never in view', 'Its antenna was too small', 'Earth\'s atmosphere blocked the signal', 'It landed at night'], answer: 0, why: 'From the far side, Earth is always below the horizon, so signals were relayed via Queqiao.' },
      { q: 'At the south pole, Earth\'s elevation ranges roughly between…', options: ['0° and 90°', '−6.7° and +6.7°', '−1.5° and +1.5°', 'It is always overhead'], answer: 1, why: 'The north–south libration of about 6.7° moves Earth above and below the polar horizon.' }
    ]
  },
  {
    id: 'power',
    title: 'Solar power: angle is everything',
    lede: 'At the pole, a flat solar panel on the ground gets almost nothing. Stand it upright and it gets almost everything.',
    image: 'graphics/lesson-06-power.svg',
    body: `
      <p>Sunlight near the Moon carries about <strong>1,361 W per square metre</strong>. How much of that lands on a panel depends on the angle between the panel and the rays:</p>
      <ul>
        <li>A <strong>flat panel lying on the ground</strong> catches sunlight in proportion to <strong>sin(elevation)</strong>. With the Sun at 1.5°, that is only 2.6 %.</li>
        <li>A <strong>vertical panel turned to face the Sun</strong> catches light in proportion to <strong>cos(elevation)</strong>: about 100 % when the Sun is low.</li>
      </ul>
      <p>That is why polar rovers and landers use vertical solar arrays that rotate to follow the Sun around the horizon, and why NASA is developing tall vertical arrays for a south-pole base. Height helps too: a mast 10 m tall can see over nearby boulders and small ridges.</p>
      <div class="fact-box"><p>Real panels convert roughly 30 % of that light into electricity, and output also drops when the panel is hot. The lab ignores efficiency so you can see the geometry alone.</p></div>`,
    lab: 'panel',
    quiz: [
      { q: 'With the Sun 30° above the horizon, a flat horizontal panel receives what fraction of full sunlight?', options: ['About 13 %', 'About 50 %', 'About 87 %', '100 %'], answer: 1, why: 'Horizontal panel: sin(30°) = 0.5, so 50 %.' },
      { q: 'At the south pole, which panel orientation collects the most light?', options: ['Flat on the ground', 'Vertical, turned to face the Sun', 'Pointing straight up', 'Facing north'], answer: 1, why: 'With the Sun near the horizon, a vertical Sun-facing panel gets cos(elevation) ≈ 100 %.' },
      { q: 'What is the approximate solar power per square metre near the Moon?', options: ['136 W', '1,361 W', '13,610 W', '6 W'], answer: 1, why: 'The total solar irradiance at 1 AU is about 1,361 W/m² (Kopp & Lean, 2011).' }
    ]
  },
  {
    id: 'comms',
    title: 'Talking to Earth',
    lede: 'Direct-to-Earth radio needs a straight line from the antenna to Earth. Terrain in the way means silence.',
    image: 'graphics/lesson-07-comms.svg',
    body: `
      <p>A lander sends data <strong>direct to Earth (DTE)</strong> to big dishes such as NASA's Deep Space Network. Radio signals travel in straight lines here, so the antenna needs a clear view of <span class="earth-word">Earth</span> above the local terrain. Light takes about <strong>1.3 seconds</strong> each way.</p>
      <p>At the pole Earth is low, so a ridge only a few degrees high can block it for days. Mission planners look for sites and dates where Earth stays up during the critical moments (especially landing) and plan around the times when it is down.</p>
      <p>When DTE is impossible, a <strong>relay satellite</strong> in lunar orbit passes data along. China uses Queqiao and Queqiao-2; ESA and SSTL are building Lunar Pathfinder; NASA's LunaNet is a set of standards so relays from different countries can work together.</p>`,
    lab: null,
    quiz: [
      { q: 'What does DTE stand for?', options: ['Direct-to-Earth', 'Deep Terrain Estimate', 'Daily Transmission Event', 'Dual Telemetry Encoder'], answer: 0, why: 'Direct-to-Earth: the lander talks straight to antennas on Earth.' },
      { q: 'About how long does a radio signal take to travel from the Moon to Earth?', options: ['1.3 milliseconds', '1.3 seconds', '13 seconds', '8 minutes'], answer: 1, why: 'The Moon is about 384,000 km away; at the speed of light that is about 1.3 s.' },
      { q: 'What can a mission do when Earth is below the terrain horizon?', options: ['Nothing, just wait', 'Use a relay satellite in lunar orbit', 'Bounce signals off the Sun', 'Increase transmitter power until it passes through rock'], answer: 1, why: 'Relay satellites (e.g. Queqiao) pass data on when there is no direct line of sight.' }
    ]
  },
  {
    id: 'terrain',
    title: 'Small moves, big changes',
    lede: 'Near the pole, moving a few kilometres can turn months of sunlight into permanent darkness.',
    image: 'graphics/lesson-08-terrain.svg',
    body: `
      <p>The lab below loads three real places from the same LOLA terrain map and runs a full lunar day for each one, starting now. They are only a few tens of kilometres apart.</p>
      <ul>
        <li>The <strong>connecting ridge</strong> sits high, with a horizon that rarely rises above half a degree.</li>
        <li>The <strong>geographic pole</strong> sits on Shackleton's rim, with ridges a few degrees high in some directions.</li>
        <li>The <strong>floor of Shackleton</strong> is surrounded by walls about 20° high. The Sun, never more than about 1.5° up, can never clear them.</li>
      </ul>
      <p>That is why landing accuracy matters so much at the pole. Modern landers aim for ellipses only about 100 m across.</p>`,
    lab: 'three-sites',
    quiz: [
      { q: 'Why is Shackleton\'s floor permanently dark?', options: ['It is on the far side', 'Its walls rise far higher than the Sun ever gets at the pole', 'Earth blocks the Sun', 'It is always in lunar night'], answer: 1, why: 'The crater walls stand about 20° above the floor; the polar Sun never exceeds about 1.5°.' },
      { q: 'What makes the connecting ridge such a good place for solar power?', options: ['Its horizon is very low in almost every direction', 'It is closer to the Sun', 'It has a thinner atmosphere', 'It faces Earth'], answer: 0, why: 'Being high, its terrain horizon rarely blocks the low Sun.' },
      { q: 'Why do polar landers need precise landing?', options: ['Fuel is cheaper', 'A few hundred metres can change lighting and Earth visibility dramatically', 'The pole moves', 'Radio works better'], answer: 1, why: 'Rugged polar terrain means conditions change over short distances.' }
    ]
  },
  {
    id: 'planning',
    title: 'Planning a landing',
    lede: 'Pick the site, pick the day, check the light and the link, then ask what happens if the launch slips.',
    image: 'graphics/lesson-09-planning.svg',
    body: `
      <p>Mission planners ask the same questions this app answers:</p>
      <ul>
        <li>Is the <span class="sun-word">Sun</span> above the terrain at touchdown, and how long until it sets?</li>
        <li>Is <span class="earth-word">Earth</span> in view during descent, so engineers can watch the landing live?</li>
        <li>Over the whole surface stay, how many hours of power and of radio contact will there be, and how long is the longest dark spell the batteries must survive?</li>
      </ul>
      <p>Rockets do not always launch on time. A one-day slip moves the Sun about 12° around the polar horizon, which can put it behind a ridge for the whole mission. That is why the Mission view shows "If the landing slips" and a grid of the best landing days.</p>
      <p>Your turn: the Missions on the left ask you to find real scenarios in Mission mode. The app checks your answer with the same calculations.</p>`,
    lab: null,
    quiz: [
      { q: 'If a polar landing slips by one Earth day, roughly how far does the Sun move around the horizon?', options: ['About 1°', 'About 12°', 'About 90°', 'It does not move'], answer: 1, why: 'At the pole the Sun circles the horizon in 29.5 days: 360° / 29.5 ≈ 12° per day.' },
      { q: 'Why do engineers want Earth in view during landing?', options: ['For gravity assist', 'To receive live telemetry while the lander descends', 'To light up the surface', 'It is not important'], answer: 1, why: 'Live telemetry during descent lets the team monitor (and later diagnose) the landing.' },
      { q: 'What does "longest dark" mean for a lander?', options: ['The longest time without sunlight, which batteries and heaters must survive', 'The deepest crater nearby', 'The longest radio blackout', 'Night on Earth'], answer: 0, why: 'Without sunlight there is no solar power; the longest gap sets battery and heater sizing.' }
    ]
  },
  {
    id: 'seasons',
    title: 'The Moon has seasons too',
    lede: 'The Sun drifts 1.5° north and south of the lunar equator. At the south pole that small drift is the difference between summer light and winter dark.',
    image: 'graphics/lesson-10-seasons.svg',
    body: `
      <p>Mission planners track the <strong>sub-solar point</strong>: the spot on the Moon where the <span class="sun-word">Sun</span> is exactly overhead. Over about 347 days it wanders from roughly 1.5° north of the lunar equator to 1.5° south and back. When it is south, the south pole is tilted toward the Sun: <strong>southern summer</strong>.</p>
      <p>Our team's study of 20 years of NASA/JPL Horizons data turns this into a simple index, the <strong>Southern Astronomical Opportunity Quotient (SAOQ)</strong>: 0 % when the sub-solar point is on or north of the equator, 100 % when it is about 1.59° south. Dates with SAOQ of 90 % or more are the first ones worth checking.</p>
      <div class="fact-box"><p>The lab recomputes the study live. In 2026 the 90 % window runs from 30 October to early December and peaks on 14 November. Each year it arrives a few weeks earlier, because the lunar "year" of seasons is about 18 days shorter than ours.</p></div>
      <div class="myth-box"><p><strong>Careful:</strong> SAOQ is not a percentage of sunlight and not a chance of success. It only says the season is right. A crater floor stays dark in midsummer, and a high ridge can be lit in winter. That is why Mission mode always pairs the index with real terrain.</p></div>`,
    lab: 'season',
    quiz: [
      { q: 'What is the sub-solar point?', options: ['The darkest point on the Moon', 'The place where the Sun is exactly overhead', 'The centre of the far side', 'The south pole'], answer: 1, why: 'It is the point on the surface directly beneath the Sun.' },
      { q: 'An SAOQ of 95 % means…', options: ['95 % of the south pole is lit', 'The mission has a 95 % chance of success', 'The season is strongly favourable for the south pole, so check terrain next', 'The Moon is 95 % full'], answer: 2, why: 'SAOQ is a seasonal screening index, not a sunlight percentage or a probability.' },
      { q: 'Why does southern summer arrive earlier every calendar year?', options: ['The Moon is speeding up', 'The lunar seasonal cycle (about 347 days) is shorter than an Earth year', 'Earth\'s orbit is shrinking', 'It does not; it is always in November'], answer: 1, why: 'The cycle is about 346.6 days, so the pattern slips roughly 18 days earlier per year.' }
    ]
  }
];

/**
 * Missions are checked against the live Mission-mode scenario.
 * `check(ctx)` receives { site, result, eph, horizon, epoch } and returns
 * { ok, detail }.
 */
export const CHALLENGES = [
  {
    id: 'lights-on', title: 'Keep the lights on', badge: 'graphics/badge-lights-on.svg', xp: 60,
    task: 'Find a south-polar site (south of 80°S) and a landing time where, over a 7-day stay, the Sun is up at least 95 % of the time AND Earth is in view at least 50 % of the time.',
    hint: 'Try high ground (Malapert Massif or the connecting ridge), then use the "Best landing days" grid.',
    days: 7,
    check: ({ site, tl }) => {
      const s = tl.sunFraction * 100, e = tl.earthFraction * 100;
      const ok = site.lat <= -80 && s >= 95 && e >= 50;
      return { ok, detail: `${site.name}: sunlight ${s.toFixed(0)} %, Earth in view ${e.toFixed(0)} % over 7 days${site.lat > -80 ? '. This site is north of 80°S' : ''}.` };
    }
  },
  {
    id: 'blackout', title: 'Radio silence', badge: 'graphics/badge-blackout.svg', xp: 40,
    task: 'Find any site where Earth is never in view during a whole lunar day (29.5 days).',
    hint: 'Where on the Moon does Earth never rise?',
    days: 29.53,
    check: ({ site, tl }) => ({ ok: tl.earthFraction === 0, detail: `${site.name}: Earth in view ${(tl.earthFraction * 100).toFixed(1)} % of a lunar day.` })
  },
  {
    id: 'eternal-night', title: 'Eternal night', badge: 'graphics/badge-eternal-night.svg', xp: 50,
    task: 'Find a site where the Sun never clears the terrain during a whole lunar day.',
    hint: 'Look inside a polar crater.',
    days: 29.53,
    check: ({ site, tl }) => ({ ok: tl.sunFraction === 0, detail: `${site.name}: sunlight ${(tl.sunFraction * 100).toFixed(1)} % of a lunar day.` })
  },
  {
    id: 'apollo-morning', title: 'Apollo morning', badge: 'graphics/badge-apollo-morning.svg', xp: 50,
    task: 'Pick an Apollo landing site and set a landing time when the Sun is between 5° and 15° above the horizon and still rising, like the Apollo crews had.',
    hint: 'Use the −1 d / +1 d buttons; the Sun rises about 12° per Earth day near the equator.',
    days: 1,
    check: ({ site, eph, epoch }) => {
      const now = eph.rawState(site, epoch).solar.elevation;
      const later = eph.rawState(site, new Date(epoch.getTime() + 3600000)).solar.elevation;
      const apollo = /^a1\d$/.test(site.id);
      const ok = apollo && now >= 5 && now <= 15 && later > now;
      return { ok, detail: `${site.name}: Sun at ${now.toFixed(1)}° and ${later > now ? 'rising' : 'setting'}${apollo ? '' : ', but not an Apollo site'}.` };
    }
  }
];

export const RANKS = [
  { xp: 0, title: 'Cadet' },
  { xp: 150, title: 'Navigator' },
  { xp: 350, title: 'Flight controller' },
  { xp: 600, title: 'Mission planner' },
  { xp: 900, title: 'Lunar pathfinder' }
];

export const BADGES = [
  { id: 'first-light', name: 'First light', img: 'graphics/badge-first-light.svg', how: 'Finish your first lesson' },
  { id: 'sharp', name: 'Sharp eye', img: 'graphics/badge-sharp-eye.svg', how: 'Answer every question in a quiz right first time' },
  { id: 'flight-plan', name: 'Flight plan', img: 'graphics/badge-flight-plan.svg', how: 'Finish all lessons' },
  { id: 'lights-on', name: 'Lights on', img: 'graphics/badge-lights-on.svg', how: 'Mission: Keep the lights on' },
  { id: 'blackout', name: 'Radio silence', img: 'graphics/badge-blackout.svg', how: 'Mission: Radio silence' },
  { id: 'eternal-night', name: 'Eternal night', img: 'graphics/badge-eternal-night.svg', how: 'Mission: Eternal night' },
  { id: 'apollo-morning', name: 'Apollo morning', img: 'graphics/badge-apollo-morning.svg', how: 'Mission: Apollo morning' }
];

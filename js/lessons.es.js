/**
 * Contenido del modo Aprender en español. Mismos datos, cifras y respuestas que
 * lessons.js: solo cambian los textos. Las imágenes, los laboratorios y las
 * respuestas correctas se toman de la versión en inglés, por id.
 */
export const LESSONS_ES = {
  'why-pole': {
    title: 'Por qué todos quieren ir al polo sur',
    lede: 'La Luna casi no está inclinada, así que cerca de sus polos el Sol nunca sube mucho. Por eso hay lugares casi siempre iluminados y otros que nunca reciben luz.',
    body: `
      <p>El eje de giro de la Luna está inclinado solo <strong>1.54°</strong> respecto al plano de la órbita de la Tierra alrededor del Sol (el de la Tierra está inclinado 23.4°). Si estás cerca de un polo lunar, el <span class="sun-word">Sol</span> apenas roza el horizonte y nunca sube más de uno o dos grados.</p>
      <p>Eso crea dos tipos de lugares extremos a solo unos kilómetros de distancia:</p>
      <ul>
        <li><strong>Crestas altas y bordes de cráteres</strong> que reciben luz solar la mayor parte del año; los mejores puntos de la cresta que une los cráteres Shackleton y de Gerlache están iluminados más del 80 % del tiempo (estudios de iluminación con LOLA).</li>
        <li><strong>Fondos de cráteres que no han visto el Sol en miles de millones de años.</strong> Estas regiones en sombra permanente están entre los lugares más fríos medidos en el sistema solar, algunos por debajo de 40 K (−233 °C), lo bastante fríos para atrapar hielo de agua.</li>
      </ul>
      <div class="fact-box"><p>En 2009, la sonda LCROSS de la NASA se estrelló contra el fondo en sombra permanente del cráter Cabeus y midió agua en la nube de escombros: alrededor del 5.6 % de su masa.</p></div>
      <p>Luz solar para obtener energía, hielo para agua y combustible de cohete, todo a poca distancia: por eso las regiones candidatas de Artemis y la misión china Chang'e 7 se concentran a pocos grados del polo sur.</p>`,
    quiz: [
      { q: '¿Cuánto está inclinado el eje de giro de la Luna respecto al plano de la órbita de la Tierra?', options: ['Unos 1.5°', 'Unos 6.7°', 'Unos 23.4°', 'Unos 45°'],
        why: 'La inclinación es de 1.54°. 23.4° es la inclinación de la Tierra, y 6.7° es la inclinación de la Luna respecto a su propia órbita alrededor de la Tierra.' },
      { q: '¿Por qué puede sobrevivir el hielo de agua en el polo sur lunar?', options: ['El polo está lejos del Sol', 'Algunos fondos de cráteres nunca reciben luz solar y se mantienen extremadamente fríos', 'La sombra de la Tierra cubre el polo', 'El polo tiene una atmósfera delgada'],
        why: 'Los fondos de cráteres en sombra permanente nunca reciben luz solar directa y pueden estar por debajo de 40 K, así que el hielo no se sublima.' },
      { q: '¿Qué encontró LCROSS en el cráter Cabeus en 2009?', options: ['Agua líquida', 'Agua en la nube del impacto', 'Señales de vida pasada', 'Un módulo de aterrizaje enterrado'],
        why: 'La nube del impacto contenía agua (alrededor del 5.6 % de su masa), lo que confirmó que hay hielo en una región en sombra permanente.' }
    ]
  },
  'horizon': {
    title: 'Cómo leer la vista del horizonte',
    lede: 'El acimut dice hacia dónde mirar. La elevación dice qué tan alto. La línea del terreno decide si de verdad se puede ver.',
    body: `
      <p>Cada punto del cielo tiene dos números. El <strong>acimut</strong> es la dirección de la brújula, medida en el sentido de las agujas del reloj desde el norte (el este es 90°, el sur 180°, el oeste 270°). La <strong>elevación</strong> es el ángulo sobre el horizonte: 0° es a nivel y 90° es justo encima de tu cabeza.</p>
      <p>En una Luna perfectamente lisa, el horizonte de alguien de 2 m de altura estaría a solo <strong>2.6 km</strong>, más o menos la mitad que en la Tierra, porque la Luna es más pequeña y su superficie se curva antes. El terreno real lo cambia todo: una montaña a 100 km puede asomarse por encima de esa línea y tapar el <span class="sun-word">Sol</span>.</p>
      <div class="fact-box"><p>En la Luna no hay aire, así que la luz viaja en línea recta. En la Tierra, la atmósfera desvía la luz del Sol y permite verlo un par de minutos después de que geométricamente ya está bajo el horizonte. En la Luna, el horizonte que calculas es el horizonte que tienes.</p></div>
      <p>En el modo Misión, el panorama extiende los 360° a tu alrededor. La silueta azul es el terreno real medido por el altímetro láser LOLA del Lunar Reconnaissance Orbiter de la NASA. Las trayectorias rosa y celeste son por donde pasan el Sol y la Tierra durante tu estadía; las partes punteadas quedan ocultas detrás del terreno.</p>`,
    quiz: [
      { q: '¿En qué dirección está un objeto con acimut de 270°?', options: ['Norte', 'Este', 'Sur', 'Oeste'], why: 'El acimut se mide en el sentido de las agujas del reloj desde el norte: 90° este, 180° sur, 270° oeste.' },
      { q: '¿Por qué el horizonte de una esfera lisa está más cerca en la Luna que en la Tierra?', options: ['La Luna no tiene aire', 'La Luna es más pequeña, así que su superficie se curva antes', 'El polvo lunar tapa la vista', 'La Luna gira despacio'],
        why: 'La distancia al horizonte es aproximadamente √(2Rh). El radio R de la Luna es de 1,737 km, frente a los 6,371 km de la Tierra.' },
      { q: '¿Qué significa la parte punteada de la trayectoria del Sol en el panorama?', options: ['La Tierra eclipsa al Sol', 'En ese momento el Sol está por debajo del horizonte del terreno', 'Faltan datos', 'El Sol está detrás de una nube'],
        why: 'Los tramos punteados marcan los momentos en que el centro del Sol está por debajo de la línea del terreno LOLA local.' }
    ]
  },
  'lunar-day': {
    title: 'Un día lunar dura un mes',
    lede: 'La Luna gira una vez por cada vuelta alrededor de la Tierra, así que el Sol tarda 29.5 días terrestres en volver al mismo punto de su cielo.',
    body: `
      <p>La Luna tiene <strong>rotación sincrónica</strong>: gira exactamente una vez por órbita, y por eso siempre vemos la misma cara. Medido respecto a las estrellas, un giro dura 27.3 días. Medido respecto al Sol (de un amanecer al siguiente), dura <strong>29.53 días</strong>, porque el par Tierra–Luna también se mueve alrededor del Sol.</p>
      <p>Cerca del ecuador, eso significa unas dos semanas de luz seguidas de dos semanas de noche. El <span class="sun-word">Sol</span> se mueve solo unos 12° por el cielo en cada día terrestre.</p>
      <p>Las tripulaciones Apollo alunizaron en la mañana lunar, con el Sol bajo en el este (entre unos 5° y 15° de altura), para que las sombras largas revelaran rocas y cráteres, y para que la superficie todavía no estuviera al calor del mediodía.</p>
      <div class="myth-box"><p><strong>Mito:</strong> "La cara oculta es el lado oscuro". La cara oculta recibe exactamente la misma luz solar que la cara visible. Solo está oculta para la <em>Tierra</em>.</p></div>`,
    quiz: [
      { q: '¿Cuánto dura un día lunar completo, de un amanecer al siguiente?', options: ['24 horas', 'Unos 14.8 días terrestres', 'Unos 29.5 días terrestres', 'Unos 365 días terrestres'],
        why: 'El periodo sinódico es de 29.53 días: unas dos semanas de luz y dos de oscuridad cerca del ecuador.' },
      { q: '¿Por qué la cara oculta recibe tanta luz solar como la cara visible?', options: ['No es cierto; siempre está oscura', 'La Luna gira, así que cada lado mira al Sol por turnos', 'La Tierra le refleja luz', 'Mira al Sol de forma permanente'],
        why: 'La Luna gira una vez al mes respecto al Sol, así que la cara oculta tiene día y noche como cualquier otro lugar.' },
      { q: 'Aproximadamente, ¿cuánto se mueve el Sol por el cielo lunar en un día terrestre?', options: ['Unos 1°', 'Unos 12°', 'Unos 45°', 'Unos 360°'], why: '360° divididos entre 29.5 días dan unos 12° por día.' }
    ]
  },
  'polar-sun': {
    title: 'El Sol en el polo: un vaivén de todo el año',
    lede: 'En el polo, el Sol da una vuelta al horizonte en cada día lunar, mientras su altura cambia entre unos −1.5° y +1.5° a lo largo del año.',
    body: `
      <p>Justo en el polo, el <span class="sun-word">Sol</span> da la vuelta completa al horizonte cada 29.5 días. Su elevación casi no cambia durante esa vuelta. En un ciclo más largo, de unos <strong>346.6 días</strong>, sube lentamente hasta unos <strong>+1.5°</strong> y baja hasta unos <strong>−1.5°</strong>, por la inclinación de 1.54°.</p>
      <p>Así que el polo sur tiene estaciones. En el "verano" del sur lunar, el Sol queda un poco por encima de un horizonte liso; en "invierno", un poco por debajo. Una diferencia de 1–2° parece mínima, pero con crestas en el horizonte ese pequeño cambio decide si un panel solar recibe luz o no.</p>
      <p>La gráfica de abajo la calcula en vivo el mismo motor de efemérides del modo Misión, para el polo sur geográfico durante el próximo año.</p>`,
    quiz: [
      { q: 'En el polo sur geográfico, la elevación del Sol a lo largo de un año se mantiene aproximadamente dentro de…', options: ['±0.1°', '±1.5°', '±6.7°', '±23°'],
        why: 'Con una inclinación del eje de 1.54°, la elevación del Sol en el polo oscila entre unos −1.5° y +1.5°.' },
      { q: 'En el polo, ¿cuánto tarda el Sol en dar la vuelta completa al horizonte?', options: ['Unas 24 horas', 'Unos 29.5 días', 'Unos 346 días', 'Nunca da la vuelta'], why: 'Una vuelta completa por día lunar (29.53 días).' },
      { q: '¿Por qué importa tanto un cambio de 1° en la elevación del Sol en el polo?', options: ['Los paneles dejan de funcionar por debajo de 1°', 'Las crestas cercanas tienen más o menos esa altura, así que 1° decide entre luz y sombra', 'El Sol se calienta más', 'Cambia la duración del día lunar'],
        why: 'Los horizontes polares suelen tener entre 0.5° y 5° de altura, así que un pequeño cambio en la elevación del Sol lo mete o lo saca de la vista.' }
    ]
  },
  'earth': {
    title: '¿Dónde está la Tierra en el cielo lunar?',
    lede: 'La Tierra casi no se mueve, pero sí se balancea. Cerca de los polos, ese balanceo hace que la Tierra salga y se ponga unas dos veces al mes.',
    body: `
      <p>Como la Luna tiene rotación sincrónica, la <span class="earth-word">Tierra</span> queda casi en el mismo lugar del cielo vista desde cualquier punto de la cara visible. No sale ni se pone cada día como el Sol.</p>
      <p>Sí se balancea. A esto se le llama <strong>libración</strong>. La órbita de la Luna es una elipse, así que su giro y su movimiento orbital se adelantan y se atrasan entre sí, y la Tierra se desplaza hasta unos <strong>±7.9°</strong> de este a oeste. El ecuador de la Luna está inclinado respecto a su órbita, lo que hace que la Tierra suba y baje unos <strong>±6.7°</strong> de norte a sur en 27.2 días.</p>
      <p>En el polo sur, la Tierra "promedio" queda justo sobre el horizonte, así que ese vaivén de norte a sur la sube hasta unos +6.7° y la baja hasta −6.7°. La Tierra es visible más o menos la mitad de cada mes, y menos si el terreno tapa el norte. Desde la cara oculta, la Tierra nunca es visible: las misiones allí necesitan un satélite de retransmisión, como el Queqiao de China.</p>
      <div class="fact-box"><p>Vista desde la Luna, la Tierra mide unos 1.9° de ancho, casi cuatro veces lo que mide la Luna llena vista desde la Tierra.</p></div>`,
    quiz: [
      { q: '¿Qué es la libración?', options: ['La rotación de la Tierra', 'El balanceo aparente de la Luna (y de la Tierra en el cielo lunar) causado por su órbita y su inclinación', 'Un tipo de señal de radio', 'Los sismos lunares'],
        why: 'La libración se debe a la órbita elíptica (este–oeste) y a la inclinación del ecuador lunar respecto a la órbita (norte–sur).' },
      { q: '¿Por qué Chang\'e 4 necesitó un satélite de retransmisión?', options: ['Aterrizó en la cara oculta, donde la Tierra nunca se ve', 'Su antena era demasiado pequeña', 'La atmósfera de la Tierra bloqueaba la señal', 'Aterrizó de noche'], why: 'Desde la cara oculta, la Tierra siempre está bajo el horizonte, así que las señales se retransmitieron a través de Queqiao.' },
      { q: 'En el polo sur, la elevación de la Tierra va aproximadamente entre…', options: ['0° y 90°', '−6.7° y +6.7°', '−1.5° y +1.5°', 'Siempre está justo encima'], why: 'La libración norte–sur de unos 6.7° mueve la Tierra por encima y por debajo del horizonte polar.' }
    ]
  },
  'power': {
    title: 'Energía solar: el ángulo lo es todo',
    lede: 'En el polo, un panel solar acostado en el suelo casi no recibe nada. Si lo pones de pie, recibe casi todo.',
    body: `
      <p>La luz del Sol cerca de la Luna lleva unos <strong>1,361 W por metro cuadrado</strong>. Cuánto de eso llega a un panel depende del ángulo entre el panel y los rayos:</p>
      <ul>
        <li>Un <strong>panel acostado en el suelo</strong> recibe luz en proporción al <strong>sen(elevación)</strong>. Con el Sol a 1.5°, eso es solo un 2.6 %.</li>
        <li>Un <strong>panel vertical que mira hacia el Sol</strong> recibe luz en proporción al <strong>cos(elevación)</strong>: casi el 100 % cuando el Sol está bajo.</li>
      </ul>
      <p>Por eso los vehículos y módulos polares usan paneles solares verticales que giran para seguir al Sol alrededor del horizonte, y por eso la NASA está desarrollando paneles verticales altos para una base en el polo sur. La altura también ayuda: un mástil de 10 m puede ver por encima de rocas y crestas pequeñas cercanas.</p>
      <div class="fact-box"><p>Los paneles reales convierten en electricidad alrededor del 30 % de esa luz, y rinden menos cuando se calientan. El laboratorio ignora la eficiencia para que veas solo el efecto del ángulo.</p></div>`,
    quiz: [
      { q: 'Con el Sol a 30° sobre el horizonte, ¿qué fracción de la luz solar completa recibe un panel horizontal?', options: ['Alrededor del 13 %', 'Alrededor del 50 %', 'Alrededor del 87 %', '100 %'], why: 'Panel horizontal: sen(30°) = 0.5, es decir, 50 %.' },
      { q: 'En el polo sur, ¿qué orientación del panel recoge más luz?', options: ['Acostado en el suelo', 'Vertical, mirando hacia el Sol', 'Apuntando hacia arriba', 'Mirando al norte'], why: 'Con el Sol cerca del horizonte, un panel vertical que mira al Sol recibe cos(elevación) ≈ 100 %.' },
      { q: '¿Cuál es la potencia solar aproximada por metro cuadrado cerca de la Luna?', options: ['136 W', '1,361 W', '13,610 W', '6 W'], why: 'La irradiancia solar total a 1 UA es de unos 1,361 W/m² (Kopp y Lean, 2011).' }
    ]
  },
  'comms': {
    title: 'Hablar con la Tierra',
    lede: 'La comunicación directa por radio con la Tierra necesita una línea recta desde la antena hasta la Tierra. Si el terreno se interpone, hay silencio.',
    body: `
      <p>Un módulo de aterrizaje envía datos <strong>directo a la Tierra (DTE, por sus siglas en inglés)</strong> a grandes antenas como las de la Red de Espacio Profundo (Deep Space Network) de la NASA. Aquí las señales de radio viajan en línea recta, así que la antena necesita ver la <span class="earth-word">Tierra</span> por encima del terreno local. La luz tarda unos <strong>1.3 segundos</strong> en cada sentido.</p>
      <p>En el polo la Tierra está baja, así que una cresta de solo unos grados puede taparla durante días. Quienes planifican misiones buscan lugares y fechas en que la Tierra se mantenga visible en los momentos críticos (sobre todo el aterrizaje) y se organizan para los periodos en que no se ve.</p>
      <p>Cuando la comunicación directa es imposible, un <strong>satélite de retransmisión</strong> en órbita lunar pasa los datos. China usa Queqiao y Queqiao-2; la ESA y SSTL construyen Lunar Pathfinder; LunaNet de la NASA es un conjunto de estándares para que los satélites de distintos países puedan trabajar juntos.</p>`,
    quiz: [
      { q: '¿Qué significa DTE?', options: ['Directo a la Tierra (Direct-to-Earth)', 'Estimación de terreno profundo', 'Evento diario de transmisión', 'Codificador de telemetría doble'], why: 'Direct-to-Earth: el módulo habla directamente con las antenas en la Tierra.' },
      { q: 'Aproximadamente, ¿cuánto tarda una señal de radio en ir de la Luna a la Tierra?', options: ['1.3 milisegundos', '1.3 segundos', '13 segundos', '8 minutos'], why: 'La Luna está a unos 384,000 km; a la velocidad de la luz son unos 1.3 s.' },
      { q: '¿Qué puede hacer una misión cuando la Tierra está por debajo del horizonte del terreno?', options: ['Nada, solo esperar', 'Usar un satélite de retransmisión en órbita lunar', 'Rebotar señales en el Sol', 'Subir la potencia del transmisor hasta que atraviese la roca'], why: 'Los satélites de retransmisión (como Queqiao) pasan los datos cuando no hay línea de vista directa.' }
    ]
  },
  'terrain': {
    title: 'Pequeños movimientos, grandes cambios',
    lede: 'Cerca del polo, moverse unos pocos kilómetros puede convertir meses de luz solar en oscuridad permanente.',
    body: `
      <p>El laboratorio de abajo carga tres lugares reales del mismo mapa de terreno LOLA y simula un día lunar completo para cada uno, empezando ahora. Están a solo unas decenas de kilómetros entre sí.</p>
      <ul>
        <li>La <strong>cresta de conexión</strong> está en lo alto, con un horizonte que rara vez sube más de medio grado.</li>
        <li>El <strong>polo geográfico</strong> está en el borde de Shackleton, con crestas de unos pocos grados en algunas direcciones.</li>
        <li>El <strong>fondo de Shackleton</strong> está rodeado de paredes de unos 20° de altura. El Sol, que nunca sube más de unos 1.5°, jamás puede superarlas.</li>
      </ul>
      <p>Por eso la precisión del aterrizaje importa tanto en el polo. Los módulos modernos apuntan a zonas de aterrizaje de solo unos 100 m de ancho.</p>`,
    quiz: [
      { q: '¿Por qué el fondo de Shackleton está siempre a oscuras?', options: ['Está en la cara oculta', 'Sus paredes son mucho más altas de lo que el Sol llega a subir en el polo', 'La Tierra tapa el Sol', 'Siempre es de noche lunar allí'], why: 'Las paredes del cráter se elevan unos 20° sobre el fondo; el Sol polar nunca pasa de unos 1.5°.' },
      { q: '¿Qué hace que la cresta de conexión sea tan buena para la energía solar?', options: ['Su horizonte es muy bajo en casi todas las direcciones', 'Está más cerca del Sol', 'Tiene una atmósfera más delgada', 'Mira hacia la Tierra'], why: 'Como está en lo alto, el horizonte del terreno rara vez tapa al Sol bajo.' },
      { q: '¿Por qué los módulos polares necesitan aterrizar con precisión?', options: ['El combustible es más barato', 'Unos cientos de metros pueden cambiar mucho la iluminación y la visibilidad de la Tierra', 'El polo se mueve', 'La radio funciona mejor'], why: 'El terreno polar es tan accidentado que las condiciones cambian en distancias cortas.' }
    ]
  },
  'planning': {
    title: 'Planificar un aterrizaje',
    lede: 'Elige el lugar, elige el día, revisa la luz y la comunicación, y luego pregúntate qué pasa si el lanzamiento se retrasa.',
    body: `
      <p>Quienes planifican misiones se hacen las mismas preguntas que responde esta aplicación:</p>
      <ul>
        <li>¿Está el <span class="sun-word">Sol</span> por encima del terreno en el momento del aterrizaje, y cuánto falta para que se ponga?</li>
        <li>¿Se ve la <span class="earth-word">Tierra</span> durante el descenso, para que el equipo pueda seguir el aterrizaje en vivo?</li>
        <li>Durante toda la estadía en la superficie, ¿cuántas horas habrá de energía y de contacto por radio, y cuánto dura el periodo oscuro más largo que deben aguantar las baterías?</li>
      </ul>
      <p>Los cohetes no siempre despegan a tiempo. Un día de retraso mueve el Sol unos 12° alrededor del horizonte polar, lo que puede dejarlo detrás de una cresta durante toda la misión. Por eso la vista de Misión muestra "Si el aterrizaje se retrasa" y un calendario con los mejores días para aterrizar.</p>
      <p>Te toca: las Misiones de la izquierda te piden encontrar escenarios reales en el modo Misión. La aplicación revisa tu respuesta con los mismos cálculos.</p>`,
    quiz: [
      { q: 'Si un aterrizaje polar se retrasa un día terrestre, ¿cuánto se mueve el Sol alrededor del horizonte, aproximadamente?', options: ['Unos 1°', 'Unos 12°', 'Unos 90°', 'No se mueve'], why: 'En el polo, el Sol da la vuelta al horizonte en 29.5 días: 360° / 29.5 ≈ 12° por día.' },
      { q: '¿Por qué los ingenieros quieren ver la Tierra durante el aterrizaje?', options: ['Para una asistencia gravitatoria', 'Para recibir la telemetría en vivo mientras el módulo desciende', 'Para iluminar la superficie', 'No es importante'], why: 'La telemetría en vivo durante el descenso permite al equipo vigilar (y después analizar) el aterrizaje.' },
      { q: '¿Qué significa "periodo oscuro más largo" para un módulo de aterrizaje?', options: ['El tiempo más largo sin luz solar, que las baterías y los calentadores deben aguantar', 'El cráter más profundo cercano', 'El corte de radio más largo', 'La noche en la Tierra'], why: 'Sin luz solar no hay energía solar; el periodo más largo sin luz define el tamaño de las baterías y los calentadores.' }
    ]
  },
  'seasons': {
    title: 'La Luna también tiene estaciones',
    lede: 'El Sol se desplaza 1.5° al norte y al sur del ecuador lunar. En el polo sur, ese pequeño desplazamiento marca la diferencia entre la luz del verano y la oscuridad del invierno.',
    body: `
      <p>Quienes planifican misiones siguen el <strong>punto subsolar</strong>: el lugar de la Luna donde el <span class="sun-word">Sol</span> está justo encima. En unos 347 días va de unos 1.5° al norte del ecuador lunar a 1.5° al sur, y vuelve. Cuando está al sur, el polo sur está inclinado hacia el Sol: es el <strong>verano del sur</strong>.</p>
      <p>El estudio de nuestro equipo con 20 años de datos de NASA/JPL Horizons convierte esto en un índice sencillo, el <strong>Cociente de Oportunidad Astronómica Austral (SAOQ, por sus siglas en inglés)</strong>: 0 % cuando el punto subsolar está en el ecuador o al norte, 100 % cuando está unos 1.59° al sur. Las fechas con un SAOQ de 90 % o más son las primeras que vale la pena revisar.</p>
      <div class="fact-box"><p>El laboratorio vuelve a calcular el estudio en vivo. En 2026, la ventana del 90 % va del 30 de octubre a principios de diciembre, con el máximo el 14 de noviembre. Cada año llega unas semanas antes, porque el "año" de estaciones lunares es unos 18 días más corto que el nuestro.</p></div>
      <div class="myth-box"><p><strong>Cuidado:</strong> el SAOQ no es un porcentaje de luz solar ni una probabilidad de éxito. Solo dice que la estación es favorable. El fondo de un cráter sigue oscuro en pleno verano, y una cresta alta puede estar iluminada en invierno. Por eso el modo Misión siempre combina el índice con el terreno real.</p></div>`,
    quiz: [
      { q: '¿Qué es el punto subsolar?', options: ['El punto más oscuro de la Luna', 'El lugar donde el Sol está justo encima', 'El centro de la cara oculta', 'El polo sur'], why: 'Es el punto de la superficie que está directamente debajo del Sol.' },
      { q: 'Un SAOQ de 95 % significa que…', options: ['El 95 % del polo sur está iluminado', 'La misión tiene un 95 % de probabilidad de éxito', 'La estación es muy favorable para el polo sur, así que lo siguiente es revisar el terreno', 'La Luna está llena en un 95 %'], why: 'El SAOQ es un índice para filtrar por estación, no un porcentaje de luz solar ni una probabilidad.' },
      { q: '¿Por qué el verano del sur llega antes cada año calendario?', options: ['La Luna está acelerando', 'El ciclo de estaciones lunares (unos 347 días) es más corto que un año terrestre', 'La órbita de la Tierra se está achicando', 'No es así; siempre es en noviembre'], why: 'El ciclo dura unos 346.6 días, así que el patrón se adelanta unos 18 días por año.' }
    ]
  }
};

export const CHALLENGES_ES = {
  'lights-on': {
    title: 'Mantén las luces encendidas',
    task: 'Encuentra un lugar del polo sur (al sur de 80°S) y un momento de aterrizaje en que, durante una estadía de 7 días, el Sol esté arriba al menos el 95 % del tiempo Y la Tierra se vea al menos el 50 % del tiempo.',
    hint: 'Prueba en terreno alto (Macizo Malapert o la cresta de conexión) y luego usa el calendario de días de aterrizaje.'
  },
  'blackout': {
    title: 'Silencio de radio',
    task: 'Encuentra cualquier lugar donde la Tierra no se vea en ningún momento durante un día lunar completo (29.5 días).',
    hint: '¿En qué parte de la Luna nunca sale la Tierra?'
  },
  'eternal-night': {
    title: 'Noche eterna',
    task: 'Encuentra un lugar donde el Sol nunca supere el terreno durante un día lunar completo.',
    hint: 'Busca dentro de un cráter polar.'
  },
  'apollo-morning': {
    title: 'Mañana Apollo',
    task: 'Elige un lugar de aterrizaje de Apollo y un momento en que el Sol esté entre 5° y 15° sobre el horizonte y todavía subiendo, como lo tuvieron las tripulaciones Apollo.',
    hint: 'Usa los botones −1 d / +1 d; cerca del ecuador el Sol sube unos 12° por día terrestre.'
  }
};

export const RANKS_ES = ['Cadete', 'Navegante', 'Controlador de vuelo', 'Planificador de misiones', 'Pionero lunar'];

export const BADGES_ES = {
  'first-light': 'Termina tu primera lección',
  'sharp': 'Responde bien todas las preguntas de un quiz al primer intento',
  'flight-plan': 'Termina todas las lecciones',
  'lights-on': 'Misión: Mantén las luces encendidas',
  'blackout': 'Misión: Silencio de radio',
  'eternal-night': 'Misión: Noche eterna',
  'apollo-morning': 'Misión: Mañana Apollo'
};

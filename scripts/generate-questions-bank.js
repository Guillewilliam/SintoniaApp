import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_PER_CATEGORY = 520;

// Helper to expand templates with prefixes/suffixes or variations if needed
function buildCategoryBank(catId, config) {
  const seenTexts = new Set();
  const catQuestions = [];

  // 1. Add curated
  for (const q of config.curated) {
    let text = q.text.trim();
    if (!text.startsWith('¿')) text = '¿' + text;
    if (!text.endsWith('?')) text = text + '?';
    if (!seenTexts.has(text)) {
      seenTexts.add(text);
      catQuestions.push({
        id: `${catId}_${catQuestions.length + 1}`,
        categoryId: catId,
        intensity: q.intensity,
        text
      });
    }
  }

  const templates = config.templates;
  const lexicon = config.lexicon;
  const lexiconKeys = Object.keys(lexicon);
  const intensities = ['suave', 'normal', 'profunda'];

  // Additional intros/frames to multiply variations naturally
  const intros = [
    '',
    'Sinceramente, ',
    'Si lo piensas bien, ',
    'En confianza, ',
    'Siendo totalmente honesto, ',
    'Mirando hacia atrás, ',
    'Entre nosotros, '
  ];

  let guard = 0;
  while (catQuestions.length < TARGET_PER_CATEGORY && guard < 200000) {
    guard++;
    const tmplObj = templates[Math.floor(Math.random() * templates.length)];
    let text = tmplObj.pattern;

    for (const key of lexiconKeys) {
      const placeholder = `{${key}}`;
      while (text.includes(placeholder)) {
        const arr = lexicon[key];
        const chosen = arr[Math.floor(Math.random() * arr.length)];
        text = text.replace(placeholder, chosen);
      }
    }

    text = text.trim();
    // Occasionally add an intro for variety if combinations are needed
    if (guard > 20000 && Math.random() < 0.3) {
      const intro = intros[Math.floor(Math.random() * intros.length)];
      if (intro && text.startsWith('¿')) {
        text = `¿${intro}${text.slice(1, 2).toLowerCase()}${text.slice(2)}`;
      }
    }

    if (!text.startsWith('¿')) text = '¿' + text;
    if (!text.endsWith('?')) text = text + '?';

    if (!seenTexts.has(text)) {
      seenTexts.add(text);
      const intensity = tmplObj.intensity || intensities[catQuestions.length % 3];
      catQuestions.push({
        id: `${catId}_${catQuestions.length + 1}`,
        categoryId: catId,
        intensity,
        text
      });
    }
  }

  return catQuestions;
}

// Complete rich datasets for ALL 10 categories
const CATEGORIES_DATA = {
  pareja: {
    curated: [
      { intensity: 'suave', text: '¿Cuál es el primer detalle o gesto mío que te llamó la atención cuando nos conocimos?' },
      { intensity: 'suave', text: 'Si tuviéramos un fin de semana libre sin planes ni pantallas, ¿qué sería lo primero que propondrías hacer juntos?' },
      { intensity: 'suave', text: '¿Cuál es la comida o plan casero que más te gusta que compartamos en días tranquilos?' },
      { intensity: 'suave', text: '¿Qué apodo cariñoso o broma interna nuestra te hace sonreír siempre?' },
      { intensity: 'suave', text: '¿Qué canción o tipo de música te recuerda automáticamente a nosotros?' },
      { intensity: 'normal', text: '¿Qué hábito o costumbre mía al principio te parecía curioso y ahora te resulta adorable?' },
      { intensity: 'normal', text: '¿En qué momento de la semana o del día sientes mayor complicidad y calma conmigo?' },
      { intensity: 'normal', text: '¿Qué viaje o escapada juntos repetirías una y otra vez con los ojos cerrados?' },
      { intensity: 'profunda', text: '¿Qué conversación pendiente o sueño futuro te gustaría que construyéramos con más dedicación este año?' },
      { intensity: 'profunda', text: '¿Cuándo fue la última vez que sentiste que realmente te escuché y apoyé en un momento vulnerable?' }
    ],
    templates: [
      { intensity: 'suave', pattern: '¿Cuál es tu recuerdo favorito de cuando {accion} en {lugar}?' },
      { intensity: 'suave', pattern: 'Si tuviéramos que elegir {cosa} para compartir siempre durante {contexto}, ¿cuál sería?' },
      { intensity: 'suave', pattern: '¿Qué detalle sobre mí te hizo sonreír cuando {accion} por primera vez?' },
      { intensity: 'suave', pattern: '¿Qué plan improvisado te gustaría que hiciéramos en {lugar} para desconectar de {contexto}?' },
      { intensity: 'suave', pattern: '¿Qué pequeña costumbre nuestra disfrutas más cuando nos encontramos en {lugar}?' },
      { intensity: 'suave', pattern: '¿Qué canción o melodía describe mejor la química que tenemos al {accion}?' },
      { intensity: 'normal', pattern: '¿Cómo cambió tu perspectiva sobre nosotros cuando tuvimos que {accion} durante {contexto}?' },
      { intensity: 'normal', pattern: '¿En qué instante concreto sentiste que éramos un verdadero equipo al afrontar {desafio}?' },
      { intensity: 'normal', pattern: '¿Qué cualidad mía te aporta mayor tranquilidad emocional cuando {accion}?' },
      { intensity: 'normal', pattern: '¿Qué hábito o costumbre hemos construido juntos en {lugar} que consideras imprescindible?' },
      { intensity: 'profunda', pattern: '¿Qué conversación sincera sobre {emocion} crees que fortaleció nuestro vínculo al superar {desafio}?' },
      { intensity: 'profunda', pattern: '¿Qué parte de tu vulnerabilidad sientes que puedes mostrar conmigo sin miedo ante {desafio}?' },
      { intensity: 'profunda', pattern: '¿Cuál es la lección de amor más madura que hemos aprendido juntos a través de {contexto}?' },
      { intensity: 'profunda', pattern: '¿Qué promesa íntima sobre {emocion} te gustaría que renováramos siempre que estemos en {lugar}?' }
    ],
    lexicon: {
      accion: [
        'cocinamos juntos sin prisas', 'viajamos por carretera sin rumbo fijo', 'nos quedamos despiertos charlando de madrugada',
        'caminamos bajo la lluvia o la brisa marina', 'despertamos un domingo por la mañana', 'desayunamos en la cama',
        'nos abrazamos tras un día agotador', 'bailamos en el salón de casa', 'hacemos una escapada sorpresa',
        'miramos las estrellas en silencio', 'recordamos anécdotas del inicio', 'organizamos un rincón de nuestro hogar',
        'nos reímos por una tontería compartida', 'nos miramos en medio de una reunión social', 'planeamos nuestras próximas vacaciones',
        'compartimos una taza de café caliente', 'leemos o vemos una película abrazados', 'nos preparamos para un evento especial',
        'superamos un malentendido con cariño', 'nos damos un beso de despedida antes de salir'
      ],
      lugar: [
        'el salón de nuestra casa', 'una playa desierta al atardecer', 'un mirador con vistas a la ciudad',
        'una cafetería tranquila y acogedora', 'una cabaña en plena naturaleza', 'las calles de una ciudad desconocida',
        'el coche durante un viaje largo', 'nuestra habitación en penumbra', 'un parque bajo los árboles',
        'el tren mientras vemos pasar el paisaje', 'un rincón especial que solo nosotros conocemos', 'un restaurante con velas',
        'el balcón en una noche fresca', 'la cocina mientras preparamos la cena', 'la orilla de un lago en calma'
      ],
      cosa: [
        'un ritual matutino de café y besos', 'un destino anual de escapada secreta', 'una cena temática mensual hecha por nosotros',
        'un código de señas cómplice', 'una lista de canciones que sea solo nuestra', 'un álbum de fotos en papel reveladas',
        'un mensaje cariñoso antes de dormir', 'un paseo de desconexión los domingos', 'una tradición de celebrar los pequeños logros'
      ],
      contexto: [
        'las épocas de mayor cambio y crecimiento', 'los días en que el trabajo o la rutina pesan más',
        'los primeros meses de nuestra historia', 'las vacaciones de verano y descanso', 'los inviernos fríos en casa',
        'los momentos en que necesitamos paz', 'nuestros proyectos y metas de vida', 'las reuniones y celebraciones familiares'
      ],
      desafio: [
        'la distancia temporal o los viajes de trabajo', 'la incertidumbre laboral y profesional',
        'la convivencia diaria y el reparto de tareas', 'los momentos de bajón anímico o estrés',
        'las decisiones económicas importantes', 'la pérdida o duelo de personas queridas'
      ],
      emocion: [
        'nuestros miedos más profundos sobre el futuro', 'la gratitud por tenernos cerca',
        'la necesidad de sentirnos apoyados', 'el deseo de construir un hogar feliz',
        'la alegría de vernos crecer y cumplir metas', 'la tranquilidad de saber que no estamos solos'
      ]
    }
  },

  amistad: {
    curated: [
      { intensity: 'suave', text: '¿Cuál es la anécdota más cómica o absurda que hemos vivido juntos?' },
      { intensity: 'suave', text: 'Si tuviéramos que participar en un reality show por parejas de amigos, ¿en cuál ganaríamos con ventaja?' },
      { intensity: 'suave', text: '¿Qué habilidad inútil o meme compartimos que nadie más entendería de la misma manera?' },
      { intensity: 'normal', text: '¿En qué aspecto de tu vida crees que mi opinión o consejo tiene un peso sincero?' },
      { intensity: 'normal', text: '¿Qué es lo que más valoras de nuestra amistad comparada con otras personas de tu entorno?' },
      { intensity: 'profunda', text: '¿Hubo alguna etapa difícil en tu vida en la que sentiste alivio sabiendo que podías contar conmigo?' },
      { intensity: 'profunda', text: '¿Qué cambio o evolución personal has notado en mí a lo largo del tiempo de conocernos?' }
    ],
    templates: [
      { intensity: 'suave', pattern: '¿Cuál es el recuerdo más divertido de cuando {accion} en {lugar} con {compania}?' },
      { intensity: 'suave', pattern: 'Si tuviéramos que inventar {cosa_amistad} para celebrar nuestra amistad en {lugar}, ¿cuál sería?' },
      { intensity: 'suave', pattern: '¿Qué apodo, frase o broma interna nos define mejor cuando {accion}?' },
      { intensity: 'suave', pattern: '¿Qué comida, bebida o plan asocias automáticamente a nuestras tardes en {lugar}?' },
      { intensity: 'suave', pattern: 'Si pudiéramos teletransportarnos ahora mismo a {lugar} para {accion}, ¿vendrías?' },
      { intensity: 'normal', pattern: '¿En qué momento de {etapa} te diste cuenta de que podías confiar ciegamente en mí ante {situacion}?' },
      { intensity: 'normal', pattern: '¿Qué consejo sincero sobre {tema_amigo} me darías hoy si tuvieras que aconsejarme en {lugar}?' },
      { intensity: 'normal', pattern: '¿Cómo crees que nos complementamos cuando nos toca resolver {situacion} juntos?' },
      { intensity: 'normal', pattern: '¿Qué cualidad o talento mío crees que debería explotar más en {etapa}?' },
      { intensity: 'normal', pattern: '¿Cómo ha cambiado nuestra dinámica desde que éramos más jóvenes al afrontar {situacion}?' },
      { intensity: 'profunda', pattern: '¿Qué conversación difícil o vulnerable que tuvimos durante {etapa} marcó un antes y un después en nuestra lealtad?' },
      { intensity: 'profunda', pattern: '¿Qué significa para ti saber que estamos el uno para el otro pase lo que pase ante {situacion}?' },
      { intensity: 'profunda', pattern: '¿Cuál es la lección de vida más sincera que has aprendido a través de nuestra amistad en {etapa}?' },
      { intensity: 'profunda', pattern: '¿Qué herida o decepción del pasado sentiste que sanó un poco gracias a nuestro apoyo en {lugar}?' }
    ],
    lexicon: {
      accion: [
        'salimos de fiesta sin rumbo', 'nos perdimos buscando un sitio', 'nos pusimos a recordar anécdotas absurdas',
        'viajamos con poco presupuesto', 'nos quedamos charlando de madrugada', 'intentamos cocinar algo raro',
        'nos reímos a carcajadas de una tontería', 'hicimos una ruta por la naturaleza', 'nos cubrimos las espaldas',
        'improvisamos un plan de fin de semana', 'vimos series comiendo comida basura', 'organizamos un evento loco'
      ],
      lugar: [
        'nuestro rincón favorito de la ciudad', 'un coche en medio de un viaje', 'la terraza de un bar soleado',
        'el sofá de casa comiendo pizza', 'un festival de música en verano', 'la playa a deshora',
        'el banco de aquel parque', 'una casa rural apartada', 'un tren de largo recorrido'
      ],
      compania: [
        'todo nuestro grupo de amigos', 'un grupo de desconocidos curiosos', 'nuestros mejores cómplices',
        'gente que acabábamos de conocer', 'nuestro círculo más cercano'
      ],
      cosa_amistad: [
        'un brindis o tradición anual sagrada', 'un pacto secreto para la vejez', 'un premio simbólico al amigo del año',
        'un viaje obligatorio cada cinco años', 'un lema que nadie más entienda', 'un amuleto de nuestras aventuras'
      ],
      etapa: [
        'nuestra época de estudiantes', 'los años en que empezamos a trabajar', 'el último año que hemos compartido',
        'nuestra juventud más despreocupada', 'los momentos de mayores cambios vitales', 'nuestra etapa de madurez actual'
      ],
      situacion: [
        'una ruptura o mal de amores', 'un problema familiar delicado', 'una época de dudas e incertidumbre profesional',
        'un malentendido que supimos arreglar', 'un cambio drástico de ciudad o rutina', 'un momento de bajón anímico'
      ],
      tema_amigo: [
        'mi manera de cuidar de mí mismo', 'cómo gestiono el estrés y el trabajo', 'mis relaciones y vida amorosa',
        'mis sueños que he dejado aparcados', 'mi paciencia y cómo reacciono a las dificultades'
      ]
    }
  },

  diversion: {
    curated: [
      { intensity: 'suave', text: 'Si nos encontráramos un maletín con 50.000 € y tuviéramos que gastarlo en 24 horas sin invertirlo, ¿qué locura haríamos?' },
      { intensity: 'suave', text: '¿Qué harías si un día te despiertas y descubres que te has convertido en mí por 24 horas?' },
      { intensity: 'suave', text: '¿Cuál es el meme o vídeo absurdo de internet que no puedes ver sin soltar una carcajada?' },
      { intensity: 'normal', text: '¿Qué teoría de la conspiración completamente disparatada te divierte pensar que podría ser real?' },
      { intensity: 'normal', text: 'Si pudiéramos teletransportarnos ahora mismo a cualquier fiesta o evento del planeta, ¿dónde aterrizaríamos?' },
      { intensity: 'profunda', text: '¿Qué juego o actividad infantil recuerdas que te hacía sentir una libertad absoluta y que hoy echas de menos?' }
    ],
    templates: [
      { intensity: 'suave', pattern: 'Si tuvieras que sobrevivir a {apocalipsis} armado con {objeto_loco} en {sitio_comico}, ¿cuál sería tu estrategia?' },
      { intensity: 'suave', pattern: '¿Qué harías si de pronto te nombraran rey de {sitio_comico} y tu primera orden fuera sobre {objeto_loco}?' },
      { intensity: 'suave', pattern: 'Si pudieras contratar a {personaje_comico} para que te ayude a {travesura}, ¿qué plan tramaríais?' },
      { intensity: 'suave', pattern: '¿Cuál es la compra absurda con {objeto_loco} que harías si tuvieras dinero infinito para gastar en {sitio_comico}?' },
      { intensity: 'suave', pattern: 'Si un extraterrestre te exigiera una demostración de {talento_inutil} para salvar la Tierra, ¿qué harías?' },
      { intensity: 'normal', pattern: 'Si tuviéramos que ganar un reality show sobre {travesura} compitiendo contra {personaje_comico}, ¿cómo ganaríamos?' },
      { intensity: 'normal', pattern: '¿Qué superpoder completamente inútil pero divertido te gustaría tener al enfrentarte a {apocalipsis}?' },
      { intensity: 'normal', pattern: '¿Cuál ha sido la situación más ridícula o de tierra trágame que has vivido en {sitio_comico}?' },
      { intensity: 'normal', pattern: 'Si pudieras cambiar una regla social de etiqueta en {sitio_comico} por una costumbre ridícula, ¿cuál sería?' },
      { intensity: 'profunda', pattern: '¿En qué momentos de tu vida el humor y las risas sobre {apocalipsis} han sido tu mejor salvavidas?' },
      { intensity: 'profunda', pattern: '¿Qué aspecto de tu niño interior sientes que revive cada vez que nos divertimos haciendo {travesura}?' }
    ],
    lexicon: {
      apocalipsis: [
        'un apocalipsis zombi despistado', 'una invasión de patos gigantes', 'un apagón global de internet por un mes',
        'un virus que hace que todos canten ópera', 'un mundo donde el suelo es lava tres horas al día',
        'una tormenta eterna de albóndigas', 'un día donde las mascotas gobiernan el mundo',
        'un bucle temporal donde siempre es lunes', 'un hechizo que hace que digamos todo lo que pensamos'
      ],
      objeto_loco: [
        'una sartén antiadherente con bluetooth', 'un disfraz inflable de tiranosaurio', 'un rollo de cinta americana infinita',
        'un patito de goma parlante', 'un megáfono que desafina', 'un peluche gigante con gafas de sol',
        'un paraguas de lunares fosforitos', 'una chancla voladora teledirigida', 'una varita mágica que solo hace burbujas'
      ],
      sitio_comico: [
        'un supermercado un sábado a las 20:00', 'la cola de un parque de atracciones en agosto',
        'una reunión solemne de vecinos', 'un ascensor lleno de desconocidos serios', 'una boda de la alta sociedad',
        'un gimnasio abarrotado de gente postureando', 'una biblioteca en absoluto silencio', 'la sala de espera del dentista'
      ],
      personaje_comico: [
        'un detective de película de comedia', 'un concursante desquiciado de reality', 'un loro sabiondo y quejica',
        'un mayordomo aristocrático y sarcástico', 'un pirata que se marea en los barcos', 'un científico loco y despistado'
      ],
      travesura: [
        'colarnos en una fiesta vip con disfraces falsos', 'hacer creer a todos que somos campeones de un deporte inventado',
        'ganar un concurso de comida picante sin pestañear', 'organizar un flashmob sorpresa con gente mayor',
        'convencer a un camarero de que somos inspectores de postres'
      ],
      talento_inutil: [
        'doblar la lengua en tres partes', 'adivinar el final de series malas en diez minutos',
        'abrir envases difíciles al primer golpe', 'imitar el sonido de animales enfadados',
        'tropezar de forma elegante sin caerte', 'memorizar canciones tontas de anuncios'
      ]
    }
  },

  personalidad: {
    curated: [
      { intensity: 'suave', text: '¿Cuál es tu ritual sagrado de las mañanas que no perdonas por nada del mundo?' },
      { intensity: 'suave', text: '¿Eres una persona de tomar decisiones con la cabeza o de dejarte llevar por el impulso del estómago?' },
      { intensity: 'suave', text: '¿Cuál es tu manía u obsesión cotidiana más inofensiva?' },
      { intensity: 'normal', text: '¿Qué rasgo de tu carácter consideras que la gente suele malinterpretar cuando no te conocen a fondo?' },
      { intensity: 'normal', text: '¿En qué situaciones sientes que brillas y te sientes completamente en tu elemento?' },
      { intensity: 'profunda', text: '¿Qué parte de tu personalidad te ha costado más aceptar y reconciliar contigo mismo?' },
      { intensity: 'profunda', text: '¿Qué herida o lección del pasado transformó de forma definitiva tu manera de confiar en los demás?' }
    ],
    templates: [
      { intensity: 'suave', pattern: '¿Cómo reacciona tu temperamento cuando te encuentras con {situacion_personal} en {ambiente_personal}?' },
      { intensity: 'suave', pattern: '¿Qué manía, gusto o rutina tienes respecto a {habito_personal} que casi nadie conoce?' },
      { intensity: 'suave', pattern: '¿En qué tipo de plan o entorno social te sientes más lleno de energía vital al {actitud}?' },
      { intensity: 'suave', pattern: '¿Cuál es tu reacción típica cuando un plan se tuerce y tienes que {actitud} en {ambiente_personal}?' },
      { intensity: 'normal', pattern: '¿Qué virtud interna has tenido que trabajar más duro para lidiar con {situacion_personal}?' },
      { intensity: 'normal', pattern: '¿Cómo gestionas tus silencios y tu necesidad de espacio cuando estás en {ambiente_personal}?' },
      { intensity: 'normal', pattern: '¿Qué rasgo de tu forma de ser crees que admiran las personas que te tratan a diario en {ambiente_personal}?' },
      { intensity: 'normal', pattern: '¿Qué tan fácil o difícil te resulta pedir ayuda cuando te sientes desbordado por {situacion_personal}?' },
      { intensity: 'profunda', pattern: '¿Qué creencia limitante sobre {creencia} tuviste que derribar para madurar al {actitud}?' },
      { intensity: 'profunda', pattern: '¿Cuál es la coraza o máscara que tiendes a ponerte cuando te sientes juzgado en {ambiente_personal}?' },
      { intensity: 'profunda', pattern: '¿Cómo ha evolucionado tu amor propio y autoexigencia frente a {situacion_personal} con los años?' },
      { intensity: 'profunda', pattern: '¿Qué parte de tu esencia sientes que permanece intacta desde tu infancia respecto a {creencia}?' }
    ],
    lexicon: {
      situacion_personal: [
        'un imprevisto que altera tus planes', 'una crítica injusta o fuera de lugar', 'la sensación de no llegar a todo',
        'un desacuerdo con alguien testarudo', 'el cansancio tras una semana intensa', 'tener que decir que no a un compromiso',
        'un momento de incertidumbre económica', 'enfrentarte a una decisión sin marcha atrás', 'un cambio brusco de rutina'
      ],
      ambiente_personal: [
        'el trabajo o tus estudios', 'tus relaciones familiares cercanas', 'tus momentos de soledad en casa',
        'reuniones sociales concurridas', 'tus viajes y escapadas', 'tus proyectos personales y creativos'
      ],
      habito_personal: [
        'la organización de tu espacio y ropa', 'tus horarios de sueño y descanso', 'la forma en que consumes información',
        'tu manera de comprar o gastar', 'el cuidado de tu cuerpo y alimentación', 'cómo gestionas tus listas de pendientes'
      ],
      actitud: [
        'mantener la calma bajo presión', 'escuchar tu intuición interior', 'defender tus límites con asertividad',
        'tomarte las cosas con sentido del humor', 'abrirte a aprender de los errores', 'soltar la necesidad de control'
      ],
      creencia: [
        'el perfeccionismo y el éxito', 'el merecimiento de afecto y respeto', 'el miedo al rechazo o abandono',
        'la necesidad de complacer a los demás', 'tu propia capacidad de resiliencia', 'el valor de tu tiempo personal'
      ]
    }
  },

  profundas: {
    curated: [
      { intensity: 'suave', text: '¿Qué pequeño momento de paz cotidiano te hace sentir agradecido por la vida?' },
      { intensity: 'suave', text: 'Si pudieras pedirle un consejo sabio a tu yo de dentro de 30 años, ¿sobre qué le preguntarías?' },
      { intensity: 'normal', text: '¿Cuál es el valor no negociable que guía tus decisiones más importantes?' },
      { intensity: 'normal', text: '¿Qué crees que le dirías hoy a tu yo de la adolescencia si pudieras abrazarlo durante 2 minutos?' },
      { intensity: 'profunda', text: '¿Cuál es el miedo más íntimo que rara vez verbalizas en voz alta?' },
      { intensity: 'profunda', text: '¿Qué emoción o sentimiento te resulta más difícil de expresar a las personas que quieres?' },
      { intensity: 'profunda', text: '¿Cuándo fue la última vez que lloraste de verdad y qué necesitabas escuchar en ese momento?' }
    ],
    templates: [
      { intensity: 'suave', pattern: '¿Qué rincón, recuerdo o paisaje te transmite una sensación de serenidad profunda sobre {tema_alma}?' },
      { intensity: 'suave', pattern: 'Si pudieras regalar una palabra de aliento a alguien que vive {crisis_existencial}, ¿cuál sería?' },
      { intensity: 'suave', pattern: '¿Qué pequeña victoria interna de este último tiempo te hace sentir en paz con {tema_alma}?' },
      { intensity: 'normal', pattern: '¿Cómo ha madurado tu forma de entender {tema_alma} tras superar {crisis_existencial}?' },
      { intensity: 'normal', pattern: '¿Qué despedida, cierre de etapa o renuncia te costó lágrimas pero te hizo más fuerte ante {horizonte}?' },
      { intensity: 'normal', pattern: '¿Qué significa para ti ser una persona honesta y fiel a tus principios frente a {horizonte}?' },
      { intensity: 'normal', pattern: '¿Cuál es la lección sobre la empatía humana que más te marcó al vivir {crisis_existencial}?' },
      { intensity: 'profunda', pattern: '¿Cuál es el duelo o herida del pasado que más te enseñó sobre el perdón y {tema_alma}?' },
      { intensity: 'profunda', pattern: '¿Qué carga emocional sientes que estás preparado para soltar definitivamente hacia {horizonte}?' },
      { intensity: 'profunda', pattern: 'Si supieras que tu tiempo en este mundo es limitado, ¿a qué le restarías importancia inmediata en {horizonte}?' },
      { intensity: 'profunda', pattern: '¿Cómo te gustaría que las personas que amas resuman tu huella en sus vidas al hablar de {tema_alma}?' },
      { intensity: 'profunda', pattern: '¿Qué verdad dolorosa sobre la vida tuviste que aceptar para poder encontrar serenidad ante {crisis_existencial}?' }
    ],
    lexicon: {
      tema_alma: [
        'el valor del amor incondicional', 'el paso fugaz del tiempo', 'el significado de la auténtica libertad interior',
        'la belleza de los momentos sencillos', 'la reconciliación con las propias sombras', 'la importancia de estar presente',
        'el misterio de la existencia y el destino', 'la gratitud silenciosa de cada amanecer'
      ],
      crisis_existencial: [
        'un momento de soledad no deseada', 'una etapa de fracaso y reinvención', 'la pérdida de alguien fundamental',
        'una desilusión profunda con un proyecto de vida', 'una crisis de fe o de rumbo personal', 'el miedo a la vejez o el olvido'
      ],
      horizonte: [
        'el futuro que aún te queda por construir', 'las personas que dependerán de tu cariño',
        'el camino hacia tu madurez plena', 'el legado que dejas a tu alrededor', 'el propósito que guía tus pasos cada día'
      ]
    }
  },

  picante: {
    curated: [
      { intensity: 'suave', text: '¿Qué tipo de mirada, caricia sutil o tono de voz capta al instante tu atención seductora?' },
      { intensity: 'suave', text: '¿Cuál es la prenda de vestir o estilo que te parece irresistiblemente atractivo en la otra persona?' },
      { intensity: 'normal', text: '¿Qué escenario o ambiente despierta más fácilmente tu lado romántico y seductor?' },
      { intensity: 'normal', text: '¿Qué recuerdo de complicidad física o caricia compartida se te ha quedado grabado en la memoria?' },
      { intensity: 'profunda', text: '¿Qué fantasía de confianza o nueva experiencia íntima te gustaría explorar con cariño y sin prisas?' },
      { intensity: 'profunda', text: '¿Hasta qué punto sientes que la conexión emocional profunda intensifica el deseo físico para ti?' }
    ],
    templates: [
      { intensity: 'suave', pattern: '¿Qué detalle sensual en {momento_sensual} enciende de inmediato tu chispa en {lugar_picante}?' },
      { intensity: 'suave', pattern: '¿Prefieres la sutileza de {roce_sutil} o el atrevimiento de {roce_directo} en {lugar_picante}?' },
      { intensity: 'suave', pattern: '¿Qué fragancia, aroma o música crea la atmósfera más tentadora para ti en {momento_sensual}?' },
      { intensity: 'suave', pattern: '¿Cuál es el cumplido sugerente que más te ruboriza y agrada a la vez en {lugar_picante}?' },
      { intensity: 'normal', pattern: '¿Qué juego previo de miradas y caricias te parece indispensable para {fantasia} en {lugar_picante}?' },
      { intensity: 'normal', pattern: '¿Qué fantasía romántica o pícara te gustaría cumplir sin prisas durante {momento_sensual}?' },
      { intensity: 'normal', pattern: '¿Cómo influye la tensión acumulada a lo largo del día en tus ganas de entregarte al {momento_sensual}?' },
      { intensity: 'normal', pattern: '¿Qué papel juega la iniciativa y el atrevimiento a la hora de disfrutar de {fantasia}?' },
      { intensity: 'profunda', pattern: '¿De qué forma sientes que la confianza total y la vulnerabilidad física potencian {fantasia}?' },
      { intensity: 'profunda', pattern: '¿Qué deseo inconfesable sobre la intimidad física te gustaría compartir con tu persona especial en {lugar_picante}?' },
      { intensity: 'profunda', pattern: '¿Cómo ha evolucionado tu forma de entender el placer compartido y la seducción en {momento_sensual}?' }
    ],
    lexicon: {
      momento_sensual: [
        'una noche lluviosa de fin de semana', 'un despertar lento entre las sábanas', 'un reencuentro tras varios días lejos',
        'una escapada secreta sin horarios', 'una sobremesa a la luz de las velas', 'una noche de confidencias en penumbra'
      ],
      lugar_picante: [
        'un dormitorio con luces cálidas y tenues', 'una cabaña de madera con chimenea encendida',
        'un baño relajante con espuma y sales', 'un rincón apartado frente al mar nocturno', 'un hotel con vistas a la ciudad iluminada'
      ],
      roce_sutil: [
        'una caricia con la yema de los dedos en la nuca', 'un susurro travieso al oído',
        'una mirada fija desde el otro lado de la habitación', 'un roce accidental de manos bajo la mesa'
      ],
      roce_directo: [
        'un beso apasionado que corta la respiración', 'un abrazo firme contra la pared',
        'desabrochar el primer botón despacio', 'tomar la iniciativa con una caricia atrevida'
      ],
      fantasia: [
        'una noche entera de masajes sensoriales', 'un juego de preguntas íntimas y confesiones',
        'probar algo completamente nuevo y excitante juntos', 'dejarse llevar por la pasión sin límites ni prejuicios'
      ]
    }
  },

  secretos: {
    curated: [
      { intensity: 'suave', text: '¿Cuál es tu placer culpable en cuanto a comida chatarra o programa de televisión?' },
      { intensity: 'suave', text: '¿Qué mentira piadosa o excusa inocente has usado alguna vez para quedarte en casa sin salir?' },
      { intensity: 'normal', text: '¿Qué talento o afición secreta tienes que muy poca gente de tu círculo diario conoce?' },
      { intensity: 'normal', text: '¿Cuál es una opinión impopular que defiendes a capa y espada pero te callas para no discutir?' },
      { intensity: 'profunda', text: '¿Qué pensamiento recurrente sobre tu vida te cuesta admitir incluso ante ti mismo?' },
      { intensity: 'profunda', text: '¿Hay algún arrepentimiento silencioso del que nunca hayas hablado con nadie?' }
    ],
    templates: [
      { intensity: 'suave', pattern: '¿Qué manía, hábito u obsesión inocente ocultas al {accion_secreta} en {espacio_privado}?' },
      { intensity: 'suave', pattern: '¿Cuál es el placer culpable más vergonzoso que disfrutas cuando nadie te ve en {espacio_privado}?' },
      { intensity: 'suave', pattern: '¿Qué pequeña mentira inocente dijiste en {ocasion_social} para salir del paso?' },
      { intensity: 'suave', pattern: '¿Qué cosa ridícula has buscado en internet recientemente que borrarías de tu historial de {espacio_privado}?' },
      { intensity: 'normal', pattern: '¿Qué opinión sincera pero impopular tienes sobre {asunto_social} que callas en {ocasion_social}?' },
      { intensity: 'normal', pattern: '¿Qué compra, gasto o capricho material has ocultado o minimizado ante los demás en {espacio_privado}?' },
      { intensity: 'normal', pattern: '¿Qué pensamiento sobre tu trayectoria profesional o personal te da pudor admitir frente a {asunto_social}?' },
      { intensity: 'normal', pattern: '¿Qué anécdota bochornosa de tu pasado juraste que jamás le contarías a nadie en {ocasion_social}?' },
      { intensity: 'profunda', pattern: '¿Cuál es la inseguridad íntima que más te esfuerzas en ocultar bajo una fachada de seguridad en {ocasion_social}?' },
      { intensity: 'profunda', pattern: '¿Qué herida o culpa silenciosa llevas en el corazón respecto a {asunto_social} que nunca has verbalizado?' },
      { intensity: 'profunda', pattern: '¿Qué sueño o deseo auténtico sientes que reprimes por miedo a defraudar las expectativas de los demás en {asunto_social}?' }
    ],
    lexicon: {
      accion_secreta: [
        'comer algo calórico a altas horas de la noche', 'cantar a pleno pulmón temas que dices detestar',
        'stalkear perfiles viejos en redes sociales', 'ensayar discursos frente al espejo',
        'ver realities o vídeos absurdos durante horas', 'deshacerte de regalos que no te gustaban'
      ],
      espacio_privado: [
        'tu cuarto a puerta cerrada', 'el coche a solas con música', 'el baño de tu casa',
        'el sofá en tus tardes libres', 'la cocina en plena madrugada'
      ],
      ocasion_social: [
        'una cena familiar con conversaciones tensas', 'un evento de trabajo o networking',
        'una cita donde querías dar una imagen perfecta', 'una reunión con amigos de toda la vida'
      ],
      asunto_social: [
        'el postureo y la falsedad en redes sociales', 'el concepto tradicional de éxito y estatus',
        'las dinámicas de compromiso social forzado', 'lo que de verdad piensas del dinero y el poder'
      ]
    }
  },

  dilemas: {
    curated: [
      { intensity: 'suave', text: '¿Preferirías poder hablar con los animales o dominar todos los idiomas del mundo al instante?' },
      { intensity: 'suave', text: '¿Preferirías saber la fecha exacta de tu muerte o la causa exacta de tu muerte?' },
      { intensity: 'normal', text: '¿Preferirías tener un trabajo que te apasiona ganando lo justo o un trabajo que odias pero haciéndote multimillonario?' },
      { intensity: 'profunda', text: '¿Preferirías vivir una vida corta de emociones intensas o una vida muy larga, pacífica y sin sobresaltos?' }
    ],
    templates: [
      { intensity: 'suave', pattern: '¿Preferirías {opcionA} o {opcionB} durante el resto de tu vida cotidiana?' },
      { intensity: 'suave', pattern: 'Frente al dilema en {contexto}, ¿elegirías antes {opcionA} o {opcionB}?' },
      { intensity: 'normal', pattern: '¿Qué disyuntiva moral te resultaría más dolorosa: {opcionA} o {opcionB}?' },
      { intensity: 'normal', pattern: 'Si te obligaran a renunciar para siempre a {opcionA} o a {opcionB}, ¿cuál sacrificarías con dolor?' },
      { intensity: 'profunda', pattern: 'Al plantearte el sentido de tu existencia, ¿preferirías {opcionA} o {opcionB} al final del camino?' },
      { intensity: 'profunda', pattern: '¿Qué principio ético priorizarías si te encontraras en la disyuntiva entre {opcionA} o {opcionB}?' }
    ],
    lexicon: {
      opcionA: [
        'tener la capacidad de teletransportarte a cualquier rincón del mundo',
        'poder leer la mente de las personas cuando te miran directamente a los ojos',
        'vivir en una cabaña frente al mar en una isla virgen y solitaria',
        'tener tiempo libre infinito pero un presupuesto económico muy ajustado',
        'recordar cada detalle visual y emocional de cada día vivido',
        'ser completamente inmune a las enfermedades físicas pero sentir el dolor ajeno',
        'decir siempre la verdad absoluta sin ningún filtro diplomático',
        'recibir un premio de 1.000.000 € hoy mismo',
        'poder comunicarte fluidamente con cualquier animal terrestre',
        'no volver a sentir sueño ni cansancio físico jamás',
        'poder borrar un recuerdo doloroso de tu memoria para siempre',
        'ser reconocido mundialmente por un descubrimiento genial',
        'tener la certeza de que tu destino está completamente escrito y asegurado'
      ],
      opcionB: [
        'tener la capacidad de detener el tiempo durante 1 hora cada día',
        'poder transmitir una calma y serenidad inmediata con solo dar la mano',
        'vivir en un ático luminoso en el centro de la metrópoli más vibrante',
        'tener recursos económicos ilimitados pero una jornada de trabajo exigente',
        'olvidar instantáneamente cualquier momento incómodo o doloroso',
        'tener una resiliencia mental inquebrantable ante cualquier revés de la vida',
        'saber cuándo alguien te está mintiendo con un 100% de precisión infalible',
        'recibir 8.000 € al mes de por vida con la condición de no poder salir de tu país',
        'dominar todos los instrumentos musicales del mundo de manera virtuosa',
        'no volver a tener que preocuparte por el dinero ni las cuentas jamás',
        'poder revivir un día perfecto de tu infancia una vez al año',
        'vivir en un anonimato absoluto pero con una familia y amigos entrañables',
        'tener la libertad absoluta de reinventarte desde cero en cualquier momento'
      ],
      contexto: [
        'un futuro transformado por la tecnología', 'una encrucijada vital de cambio de rumbo',
        'un pacto hipotético con el destino', 'una decisión que afectara a las próximas generaciones'
      ]
    }
  },

  cultura_pop: {
    curated: [
      { intensity: 'suave', text: '¿Qué serie de televisión podrías ver en bucle infinito sin cansarte nunca?' },
      { intensity: 'suave', text: '¿A qué concierto o festival de música irías mañana mismo sin pensarlo dos veces?' },
      { intensity: 'normal', text: '¿Qué canción es tu himno de resiliencia cuando necesitas recargar energía anímica?' },
      { intensity: 'profunda', text: '¿Qué libro, película o canción marcó un antes y un después en tu forma de ver el mundo?' }
    ],
    templates: [
      { intensity: 'suave', pattern: '¿Qué película, canción o serie sobre {tema_cultura} te parece una obra maestra en {formato}?' },
      { intensity: 'suave', pattern: 'Si tuvieras que pasar un fin de semana maratonenando {formato} sobre {tema_cultura}, ¿cuál elegirías para {ocasion_pop}?' },
      { intensity: 'suave', pattern: '¿Qué personaje de ficción en {formato} te parece que tenía los mejores valores al luchar por {tema_cultura}?' },
      { intensity: 'suave', pattern: '¿A qué artista o banda de {formato} pagarías cualquier entrada por ver en directo durante {ocasion_pop}?' },
      { intensity: 'normal', pattern: '¿Qué banda sonora o álbum musical consideras que captura a la perfección la emoción de {tema_cultura} en {ocasion_pop}?' },
      { intensity: 'normal', pattern: '¿Cuál es la obra de ficción en {formato} más incomprendida o infravalorada que defenderías a muerte?' },
      { intensity: 'normal', pattern: '¿Cómo ha influido la cultura pop de {epoca_pop} en tu forma de vestir, hablar o pensar sobre {tema_cultura}?' },
      { intensity: 'normal', pattern: '¿Qué villano de {formato} te parece que en el fondo tenía motivos justificados al defender {tema_cultura}?' },
      { intensity: 'profunda', pattern: '¿Qué historia o escena en {formato} te hizo llorar o replantearte tu propia vida respecto a {tema_cultura}?' },
      { intensity: 'profunda', pattern: '¿Qué mensaje filosófico transmitido por el arte o la música en {epoca_pop} se ha convertido en tu mantra vital?' },
      { intensity: 'profunda', pattern: '¿De qué manera el cine, la literatura o la música te ayudaron a atravesar momentos de dolor sobre {tema_cultura}?' }
    ],
    lexicon: {
      tema_cultura: [
        'el amor verdadero contra todas las adversidades', 'la superación de los propios límites y miedos',
        'la lealtad inquebrantable de una amistad', 'la rebelión contra un sistema opresor',
        'la búsqueda de identidad y redención personal', 'el viaje del héroe y la aventura épica',
        'la soledad y la belleza melancólica de la vida', 'la nostalgia por los tiempos que no volverán'
      ],
      formato: [
        'el cine clásico y de culto', 'las series de televisión contemporáneas', 'la música rock, pop o acústica',
        'las novelas y sagas literarias', 'los videojuegos con historias emotivas', 'los documentales y biografías'
      ],
      ocasion_pop: [
        'una tarde lluviosa de domingo bajo la manta', 'un viaje por carretera con ventanillas bajadas',
        'una noche de relax con auriculares y luces apagadas', 'una quedada con amigos para compartir gustos'
      ],
      epoca_pop: [
        'los inolvidables años 90 y 2000', 'la época dorada de nuestra adolescencia',
        'la explosión creativa de las décadas pasadas', 'la era de internet y las plataformas actuales'
      ]
    }
  },

  aleatorias: {
    curated: [
      { intensity: 'suave', text: 'Si los extraterrestres llegaran mañana y tuviéramos que regalarles un solo objeto terrenal, ¿cuál elegirías?' },
      { intensity: 'suave', text: '¿Qué olor te transporta inmediatamente a tu infancia?' },
      { intensity: 'normal', text: '¿Qué misterio del universo o de la historia de la humanidad te gustaría resolver antes de morir?' },
      { intensity: 'profunda', text: '¿Cómo te gustaría que te recordaran las tres personas que más te importan en esta vida?' }
    ],
    templates: [
      { intensity: 'suave', pattern: 'Si pudieras descubrir la verdad oculta sobre {curiosidad} durante {escenario_aleatorio}, ¿qué harías con ese saber?' },
      { intensity: 'suave', pattern: '¿Qué objeto cotidiano te parece una maravilla de la ingeniería cuando lo usas en {escenario_aleatorio}?' },
      { intensity: 'suave', pattern: 'Si pudieras renombrar {concepto} con una palabra inventada que suene mágica, ¿cómo la llamarías?' },
      { intensity: 'suave', pattern: '¿Qué experiencia sensorial en {escenario_aleatorio} consideras uno de los mayores placeres de la vida?' },
      { intensity: 'suave', pattern: '¿Qué harías si descubrieras que {curiosidad} guarda relación directa con {concepto}?' },
      { intensity: 'normal', pattern: 'Si tuvieras la oportunidad de viajar en el tiempo a {escenario_aleatorio} para presenciar {curiosidad}, ¿te atreverías?' },
      { intensity: 'normal', pattern: '¿Qué pregunta sin respuesta científica sobre {curiosidad} te fascina más al reflexionar sobre {concepto}?' },
      { intensity: 'normal', pattern: '¿Qué teoría o hipótesis sobre el universo te parece tan asombrosa que parece ciencia ficción?' },
      { intensity: 'normal', pattern: 'Si pudieras dejar grabada una sola frase en la luna visible desde la Tierra sobre {concepto}, ¿cuál sería?' },
      { intensity: 'normal', pattern: '¿Cuál es la coincidencia más curiosa o sincrónica que has vivido en {escenario_aleatorio} respecto a {concepto}?' },
      { intensity: 'profunda', pattern: '¿Qué misterio sobre la conciencia humana y {concepto} te hace sentir una profunda humildad frente al cosmos?' },
      { intensity: 'profunda', pattern: 'Si pudieras enviar un mensaje a los seres humanos de dentro de dos mil años sobre {curiosidad}, ¿qué advertencia les darías?' },
      { intensity: 'profunda', pattern: '¿Qué certeza sobre la vida y {concepto} te da paz cuando contemplas la inmensidad de las estrellas?' },
      { intensity: 'profunda', pattern: 'Si pudieras presenciar el nacimiento o el final de {curiosidad} desde {escenario_aleatorio}, ¿qué emoción sentirías?' }
    ],
    lexicon: {
      curiosidad: [
        'el origen exacto de los sueños y la memoria', 'los secretos que esconden las profundidades del océano',
        'la posibilidad de vida inteligente en otras galaxias', 'la construcción de monumentos milenarios inexplicables',
        'la naturaleza cuántica del tiempo y el espacio', 'el origen del lenguaje y las emociones humanas',
        'la materia oscura y los agujeros negros', 'la posibilidad de universos paralelos y multiversos'
      ],
      escenario_aleatorio: [
        'un eclipse total en medio de un desierto estrellado', 'una cabaña en un bosque nevado durante una aurora boreal',
        'un paseo en barco por un mar en absoluta calma', 'la cima de una montaña al amanecer',
        'las calles vacías de una ciudad histórica a medianoche', 'un observatorio astronómico en una cumbre solitaria',
        'las ruinas de un templo antiguo iluminado por la luna'
      ],
      concepto: [
        'el destino y las casualidades', 'la belleza de las cosas efímeras',
        'la fuerza invisible del afecto humano', 'el infinito y la nada en el universo',
        'la esperanza de un mundo más empático', 'la búsqueda del sentido de la existencia'
      ]
    }
  }
};

const fullBank = [];
const summary = {};

for (const [catId, config] of Object.entries(CATEGORIES_DATA)) {
  const catQuestions = buildCategoryBank(catId, config);
  summary[catId] = catQuestions.length;
  fullBank.push(...catQuestions);
}

console.log('=== Generación completada con éxito ===');
console.log('Total preguntas generadas:', fullBank.length);
console.log('Desglose por categoría:');
for (const [cat, count] of Object.entries(summary)) {
  console.log(`- ${cat.padEnd(14)}: ${count} preguntas`);
}

// Write to src/data/questionsBank.json
const outputPath = path.resolve(__dirname, '../src/data/questionsBank.json');
fs.writeFileSync(outputPath, JSON.stringify(fullBank, null, 2), 'utf-8');
console.log(`Archivo escrito en: ${outputPath}`);

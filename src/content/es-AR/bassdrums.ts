// SPDX-License-Identifier: GPL-3.0-or-later
// Contenido (es-AR): ramas de bajo y batería.
import { type LessonTexts, P, TIP, EX, Q } from "../types";

const BSTR: Record<number, string> = { 1: "1ª", 2: "2ª", 3: "3ª", 4: "4ª", 5: "5ª" };

function bassString(n: number, name: string, tip: string): LessonTexts[string] {
  return {
    title: `${BSTR[n]} cuerda del bajo: ${name}`,
    body: [
      P(`La **${BSTR[n]} cuerda** del bajo, al aire, suena **${name}**.`),
      EX({ frets: `${n}:0`, bass: true }, `${BSTR[n]} cuerda al aire.`),
      TIP(tip),
    ],
  };
}

function bassFret(s: number, f: number, name: string, tip: string): LessonTexts[string] {
  return {
    title: `${name} en la ${BSTR[s]} cuerda del bajo`,
    body: [
      P(`**${BSTR[s]} cuerda, traste ${f}**: suena **${name}**.`),
      EX({ frets: `${s}:${f}`, bass: true }, `${name}.`),
      EX({ tab: `${s}:${f}`, bass: true }, "En la tablatura del bajo."),
      TIP(tip),
    ],
  };
}

function drumPiece(id: string, name: string, desc: string, where: string): LessonTexts[string] {
  return {
    title: name[0].toUpperCase() + name.slice(1),
    body: [
      P(desc),
      EX({ drums: `${id}:q ${id}:q ${id}:q ${id}:q` }, `${name[0].toUpperCase() + name.slice(1)}: ${where}`),
    ],
  };
}

export const BASS: LessonTexts = {
  "bs.parts": {
    title: "Conocé el bajo",
    body: [
      P("El bajo eléctrico tiene **4 cuerdas** (algunos tienen 5). Suena **una octava más grave** que las cuatro cuerdas graves de la guitarra."),
      P("Igual que en la guitarra, el mango tiene **[[bs.parts|trastes]]** y la parte donde apoyás los dedos es el **[[bs.parts|diapasón]]**. Cada traste sube el sonido al siguiente más cercano."),
      P("La cuerda **1ª es la más fina** (aguda) y la **4ª la más gruesa** (grave)."),
      TIP("Mano derecha: alterná índice y mayor pulsando las cuerdas, apoyando el pulgar en la pastilla o en la cuerda de arriba."),
    ],
    quiz: [
      Q("¿Cuántas cuerdas tiene el bajo más común?", "4", "6", "5", "3"),
      Q("¿Cuál es la 4ª cuerda?", "La más gruesa y grave", "La más fina", "La del medio", "No existe"),
      Q("Con la mano derecha conviene...", "alternar índice y mayor", "usar solo el pulgar", "usar un solo dedo", "rasguear"),
    ],
  },
  "bs.tab": {
    title: "Tablatura de bajo",
    body: [
      P("La **[[bs.tab|tablatura]]** de bajo tiene **4 líneas**: la de **arriba es la 1ª cuerda** (la más aguda) y la de abajo, la 4ª. Los números son los **trastes**; 0 es cuerda al aire."),
      TIP("Es como mirar el mango del bajo desde arriba."),
    ],
    quiz: [
      Q("¿Cuántas líneas tiene la tablatura de bajo de 4 cuerdas?", "4", "6", "5", "3"),
      Q("En la tablatura de bajo, la línea de abajo es...", "la 4ª cuerda (la más grave)", "la 1ª cuerda", "la afinación", "la 2ª cuerda"),
      Q("¿Qué significa un 3 sobre la línea de abajo?", "4ª cuerda, traste 3", "3ª cuerda, traste 4", "Tocar 3 veces", "La tercera vez"),
    ],
  },
  "bs.str.4": bassString(4, "Mi", "Es el Mi más grave del bajo: el piso de casi todo el rock."),
  "bs.str.3": bassString(3, "La", "Mi, **La**... las cuerdas del bajo van como las 4 graves de la guitarra."),
  "bs.str.2": bassString(2, "Re", "Mi, La, **Re**..."),
  "bs.str.1": bassString(1, "Sol", "Mi, La, Re, **Sol**: ya tenés las cuatro."),
  "bs.pos.4.1": bassFret(4, 1, "Fa", "Mi y Fa están pegadas: entre ellas no hay otra nota."),
  "bs.pos.4.3": bassFret(4, 3, "Sol", "4ª cuerda: Mi (0), Fa (1), Sol (3)."),
  "bs.pos.3.2": bassFret(3, 2, "Si", "3ª cuerda: La (0), Si (2)."),
  "bs.pos.3.3": bassFret(3, 3, "Do", "Si y Do están pegadas: trastes 2 y 3."),
  "bs.root": {
    title: "Tocar la fundamental de un acorde",
    body: [
      P("Las canciones tienen **[[bs.root|acordes]]**: grupos de notas que tocan la guitarra o el teclado. Se escriben con letras (**[[bs.root|cifrado]]**): **C** = Do, **G** = Sol, **A** = La, **E** = Mi..."),
      P("El trabajo más básico (¡y más importante!) del bajo es tocar la nota que le da nombre al acorde: la **fundamental**. Si dice **G**, tocás **Sol**."),
      EX({ frets: "4:3 3:3", bass: true }, "Sol (G) y Do (C)."),
      TIP("Una línea con solo fundamentales ya suena a banda. Pensá en *Let It Be*."),
    ],
  },
  "bs.pos.2.2": bassFret(2, 2, "Mi", "2ª cuerda: Re (0), Mi (2)."),
  "bs.pos.2.3": bassFret(2, 3, "Fa", "Mi y Fa pegadas: trastes 2 y 3."),
  "bs.pos.1.2": bassFret(1, 2, "La", "1ª cuerda: Sol (0), La (2)."),
  "bs.pos.1.4": bassFret(1, 4, "Si", "1ª cuerda: Sol (0), La (2), Si (4). ¡Primera posición completa!"),
  "bs.eighths": {
    title: "Corcheas constantes: el motor del rock",
    body: [
      P("La línea de bajo más típica del rock: la **fundamental en corcheas**, sin parar, ocho por compás."),
      EX({ tab: "3:0:8 3:0:8 3:0:8 3:0:8 3:0:8 3:0:8 3:0:8 3:0:8", bass: true, ts: "4/4" }, "La en corcheas."),
      P("AC/DC, Ramones, Los Redondos: el bajo en corcheas \"empuja\" toda la banda."),
      TIP("Alterná dedos (índice-mayor) y mantené todas las notas parejas en volumen y duración."),
    ],
    quiz: [
      Q("¿Cuántas corcheas hay en un compás de 4/4?", "8", "4", "16", "6"),
      Q("Para tocar corcheas parejas conviene...", "alternar índice y mayor", "usar un solo dedo", "tocar cada vez más fuerte", "usar el pulgar"),
    ],
  },
  "bs.minor": {
    title: "Acordes menores en el bajo",
    body: [
      P("Si el acorde es **Am** (La menor), la fundamental sigue siendo **La**. La \"m\" cambia el acorde de la guitarra, pero tu nota es la misma."),
      EX({ frets: "3:0", bass: true }, "Am → tocás La."),
    ],
  },
  "bs.octave": {
    title: "La forma de octava",
    body: [
      P("La misma nota **una octava más aguda** está siempre **dos cuerdas más arriba y dos trastes más adelante**. Fundamental + octava es un patrón clásico de la música disco y del rock."),
      EX({ frets: "4:1 2:3", bass: true }, "Fa (4ª, traste 1) y su octava (2ª, traste 3)."),
      TIP("Dedo 1 en la fundamental, dedo 3 o 4 en la octava."),
    ],
  },
  "bs.fifth": {
    title: "Fundamental y quinta",
    body: [
      P("La **quinta** de una nota está **una cuerda más arriba y dos trastes más adelante**. Alternar fundamental y quinta es la base del country, del folk y de muchos rocks."),
      EX({ frets: "4:1 3:3", bass: true }, "Fa y su quinta, Do."),
    ],
  },
  "bs.chromatic": {
    title: "Notas alteradas en el bajo",
    body: [
      P("Cada traste es un **semitono**. Entre dos naturales a un tono (dos trastes) hay una nota alterada: en la 4ª cuerda, traste 2 = Fa♯/Sol♭; traste 4 = Sol♯/La♭."),
      EX({ frets: "4:2 4:4 3:1 3:4", bass: true }, "Fa♯, Sol♯, La♯ y Do♯."),
    ],
  },
  "bs.zone.5": {
    title: "El bajo entre los trastes 5 y 9",
    body: [
      P("El traste 5 de cada cuerda suena igual que la cuerda siguiente al aire: 4ª traste 5 = La, 3ª traste 5 = Re, 2ª traste 5 = Sol."),
      EX({ frets: "4:5 3:5 2:5", bass: true }, "Traste 5."),
      TIP("Tocar en el traste 5 en vez de al aire te da más control del sonido."),
    ],
  },
  "bs.zone.10": {
    title: "Del traste 10 en adelante",
    body: [
      P("En el **traste 12** cada cuerda suena una octava arriba del aire. De ahí en adelante se repite todo."),
      EX({ frets: "4:12 1:12", bass: true }, "Traste 12."),
    ],
  },
  "bs.pent": {
    title: "La pentatónica menor en el bajo",
    body: [
      P("La pentatónica menor es la fuente de los riffs de bajo de rock. En La: La, Do, Re, Mi, Sol, con la fundamental en la 4ª cuerda traste 5."),
      EX({ frets: "4:5 4:8 3:5 3:7 2:5 2:7", bass: true }, "La pentatónica menor."),
      TIP("El riff de *Another One Bites the Dust* sale de la pentatónica de Mi menor."),
    ],
  },
  "bs.approach": {
    title: "Notas de aproximación",
    body: [
      P("Para llegar al acorde siguiente con estilo, tocá **un semitono antes** (o después) de su fundamental justo antes del cambio. Es una **nota de aproximación cromática**."),
      P("Si vas de C a G, en el último pulso de C tocá **Fa♯** y caés en **Sol**."),
    ],
    quiz: [
      Q("Una nota de aproximación cromática está...", "un semitono antes o después de la nota de destino", "una octava arriba", "en otra tonalidad", "siempre en Do"),
      Q("Para ir a Sol, ¿qué nota de aproximación desde abajo usarías?", "Fa♯", "Mi", "La", "Do"),
    ],
  },
  "bs.walk": {
    title: "Walking bass",
    body: [
      P("En el **walking bass** tocás una nota por pulso, **caminando** hacia el próximo acorde: fundamental, notas del acorde o de la escala, y una aproximación al final."),
      P("Sobre un ii–V–I (Dm7 G7 Cmaj7): Re Fa La Do♯ | Sol Si Re Re♯ | Mi..."),
    ],
    quiz: [
      Q("En el walking bass se toca...", "una nota por pulso caminando al próximo acorde", "solo la fundamental en redondas", "acordes completos", "solo en el último pulso"),
      Q("¿Qué nota suele ir en el primer pulso de cada acorde?", "La fundamental", "La séptima", "Cualquiera", "Un silencio"),
    ],
  },
  "bs.str5": {
    title: "El bajo de 5 cuerdas",
    body: [
      P("El bajo de 5 cuerdas suma una **5ª cuerda grave: Si**. Permite notas más graves que el Mi y tocar más cosas sin mover la mano."),
      EX({ frets: "5:0 5:3", bass: true, fiveString: true }, "Si y Re graves en la 5ª cuerda."),
    ],
  },
  "bs.ghost": {
    title: "Ghost notes",
    body: [
      P("Las **ghost notes** son notas \"fantasma\": apoyás el dedo sin apretar del todo y pulsás, sale un golpe percusivo sin altura. Se escriben con una **x**."),
      P("Le dan swing a las líneas de funk: Flea (RHCP) las usa todo el tiempo."),
    ],
    quiz: [
      Q("Una ghost note suena...", "como un golpe sin altura definida", "muy aguda", "muy larga", "más fuerte"),
      Q("¿Cómo se escriben las ghost notes en tablatura?", "Con una x", "Con un 0", "Con una h", "No se escriben"),
    ],
  },
  "bs.slap": {
    title: "Slap y pop",
    body: [
      P("**Slap**: golpeás la cuerda con el costado del pulgar contra los trastes. **Pop**: enganchás una cuerda aguda con el índice y la soltás para que golpee."),
      P("Es el sonido del funk: *Higher Ground* o *Can't Stop* de Red Hot Chili Peppers."),
    ],
    quiz: [
      Q("¿Con qué se hace el slap?", "Con el costado del pulgar", "Con la púa", "Con el meñique", "Con la mano izquierda"),
      Q("El pop consiste en...", "enganchar y soltar una cuerda aguda", "golpear el cuerpo del bajo", "apretar más fuerte", "tocar acordes"),
    ],
  },
};

export const DRUMS: LessonTexts = {
  "dr.kit": {
    title: "Conocé la batería",
    body: [
      P("La batería tiene varias piezas: el **[[dr.kit|bombo]]** (el grande del piso, con pedal), el **[[dr.kit|redoblante]]** (el tambor del medio, con sonido seco), el **[[dr.kit|hi-hat]]** (dos platillos que se abren y cierran con un pedal), los **toms** y los **[[dr.kit|platillos]]** (crash y ride)."),
      P("El ritmo básico del rock usa tres: **bombo, redoblante y hi-hat**."),
      TIP("En la app tenés pads para escuchar cada pieza. No hace falta tocar perfecto: el objetivo es entender y leer."),
    ],
    quiz: [
      Q("¿Qué pieza se toca con un pedal y suena muy grave?", "El bombo", "El hi-hat", "El crash", "El tom agudo"),
      Q("¿Qué tres piezas usa el ritmo básico de rock?", "Bombo, redoblante y hi-hat", "Toms, crash y ride", "Solo el bombo", "Ride, crash y bombo"),
      Q("El hi-hat es...", "dos platillos que se abren y cierran con un pedal", "un tambor grande", "un tom", "un pedal de bombo"),
    ],
  },
  "clef.percussion": {
    title: "El pentagrama de batería",
    body: [
      P("La batería se escribe en un pentagrama con **clave de percusión** (dos barritas verticales). Cada **línea o espacio es una pieza**, no una nota."),
      P("Los **tambores** se escriben con cabeza normal; los **platillos**, con una **x**."),
      EX({ emptyStaff: true, clef: "percussion" }, "Clave de percusión."),
    ],
    quiz: [
      Q("En el pentagrama de batería, cada línea o espacio indica...", "una pieza de la batería", "una nota", "una velocidad", "una dinámica"),
      Q("¿Con qué cabeza se escriben los platillos?", "Con una x", "Con un círculo vacío", "Con un triángulo", "Sin cabeza"),
    ],
  },
  "dr.read.kick": drumPiece("kick", "el bombo", "El **bombo** se escribe en el **1er espacio** (abajo del pentagrama). Se toca con el pie derecho.", "1er espacio."),
  "dr.read.snare": drumPiece("snare", "el redoblante", "El **redoblante** se escribe en el **3er espacio**. Es el golpe seco que marca los tiempos 2 y 4 en el rock.", "3er espacio."),
  "dr.read.hhClosed": drumPiece("hhClosed", "el hi-hat cerrado", "El **hi-hat cerrado** se escribe con una **x** arriba del pentagrama. Se toca con la baqueta mientras el pie lo mantiene cerrado.", "x arriba de todo."),
  "dr.groove.q": {
    title: "Tu primer groove (en negras)",
    body: [
      P("Un **[[dr.groove.q|groove]]** es un patrón que se repite. El primero: **hi-hat en los 4 pulsos**, **bombo en 1 y 3**, **redoblante en 2 y 4**."),
      EX({ groove: "dr.groove.q" }, "Bombo-redo, bombo-redo, con el hi-hat marcando el pulso."),
      P("Así suena el corazón de *We Will Rock You* (que en realidad son pisadas y aplausos) y de cientos de temas."),
    ],
  },
  "dr.groove.8": {
    title: "El ritmo de rock: hi-hat en corcheas",
    body: [
      P("El **beat de rock** por excelencia: hi-hat en **corcheas** (\"1 y 2 y 3 y 4 y\"), bombo en **1 y 3**, redoblante en **2 y 4**."),
      EX({ groove: "dr.groove.8" }, "El beat de rock."),
      P("*Back in Black*, *Highway to Hell*, *De música ligera*: todos parten de acá."),
    ],
  },
  "dr.read.crash": drumPiece("crash", "el crash", "El **crash** es el platillo que \"explota\": se escribe con **x en la línea adicional de arriba**. Se usa para marcar comienzos de sección, casi siempre junto con el bombo.", "x sobre la línea adicional."),
  "dr.fill": {
    title: "Tu primer fill",
    body: [
      P("Un **fill** es un pequeño \"redoble\" que anuncia que cambia la sección. El más simple: **corcheas en el redoblante** en el último compás, y **crash + bombo** al empezar la sección nueva."),
      EX({ groove: "dr.fill" }, "Crash + bombo y fill de corcheas en el redoblante."),
    ],
  },
  "dr.read.tomHigh": drumPiece("tomHigh", "el tom agudo", "El **tom agudo** (tom 1) se escribe en el **4º espacio**.", "4º espacio."),
  "dr.read.tomMid": drumPiece("tomMid", "el tom medio", "El **tom medio** (tom 2) se escribe sobre la **4ª línea**.", "4ª línea."),
  "dr.read.tomFloor": drumPiece("tomFloor", "el tom de piso", "El **tom de piso** (la \"chancha\") se escribe en el **2º espacio**. Es el tom más grave.", "2º espacio."),
  "dr.fill.toms": {
    title: "Fills por los toms",
    body: [
      P("El fill clásico de rock baja por los toms: **redo → tom agudo → tom medio → tom de piso**, dos corcheas en cada uno."),
      EX({ groove: "dr.fill.toms" }, "De agudo a grave."),
      TIP("Pensá el fill como una frase que cae hacia el primer tiempo del compás siguiente."),
    ],
  },
  "dr.groove.kick": {
    title: "Variaciones de bombo",
    body: [
      P("Manteniendo hi-hat en corcheas y redo en 2 y 4, podés mover el **bombo** a las \"y\". Eso cambia todo el carácter del groove."),
      EX({ groove: "dr.groove.kick" }, "Bombo en 1, la \"y\" del 2 y 3."),
    ],
  },
  "dr.read.hhOpen": drumPiece("hhOpen", "el hi-hat abierto", "El **hi-hat abierto** se escribe como el cerrado pero con un **circulito**: el pie afloja y los platillos suenan largos.", "x con círculo."),
  "dr.read.ride": drumPiece("ride", "el ride", "El **ride** es el platillo grande que marca el ritmo con un sonido más brillante y largo. Se escribe con **x sobre la 5ª línea**.", "x en la 5ª línea."),
  "dr.groove.half": {
    title: "Half-time",
    body: [
      P("En **half-time** el redoblante cae solo en el **3**, y la sensación es de \"medio tiempo\", pesado, aunque el pulso sea el mismo."),
      EX({ groove: "dr.groove.half" }, "Half-time."),
      TIP("Muy usado en los estribillos de baladas pesadas y en el metal."),
    ],
  },
  "dr.groove.16": {
    title: "Hi-hat en semicorcheas",
    body: [
      P("Con el hi-hat en **semicorcheas** (\"1 e y a\") el groove se vuelve más denso y funky."),
      EX({ groove: "dr.groove.16" }, "Hi-hat en semicorcheas."),
      TIP("Para semicorcheas rápidas alterná manos en el hi-hat (derecha-izquierda)."),
    ],
  },
  "dr.read.hhPedal": drumPiece("hhPedal", "el hi-hat con el pie", "El **hi-hat con el pie** (cerrarlo pisando el pedal) se escribe con una **x debajo** del pentagrama.", "x debajo."),
  "dr.read.sideStick": drumPiece("sideStick", "el aro (side stick)", "El **aro** o *side stick*: apoyás la baqueta sobre el parche y golpeás el aro. Suena como un \"toc\" de madera. Se escribe en el **3er espacio** con una cabeza especial.", "3er espacio, cabeza especial."),
  "dr.ghost": {
    title: "Ghost notes en el redoblante",
    body: [
      P("Las **ghost notes** son golpes **muy suaves** en el redoblante entre los golpes fuertes. Se escriben entre paréntesis."),
      P("Le dan swing al groove: escuchá a Chad Smith (RHCP) o a John Bonham."),
    ],
    quiz: [
      Q("Una ghost note en el redoblante es...", "un golpe muy suave entre los fuertes", "un golpe en el aro", "un golpe en el crash", "un silencio"),
      Q("¿Cómo se suelen escribir las ghost notes?", "Entre paréntesis", "Con una x", "Con un círculo", "En otro color"),
    ],
  },
  "dr.shuffle": {
    title: "El shuffle",
    body: [
      P("El **shuffle** toca el hi-hat (o el ride) con la división de **tresillo**: largo-corto, largo-corto. Es el ritmo del blues y del boogie."),
      P("El *Purdie shuffle* (Bernard Purdie) y el que usa Jeff Porcaro en *Rosanna* son los más famosos; en Led Zeppelin, *Fool in the Rain*."),
    ],
    quiz: [
      Q("El shuffle usa una división de...", "tresillo (largo-corto)", "semicorcheas parejas", "redondas", "corcheas parejas"),
      Q("¿En qué estilos es típico el shuffle?", "Blues y boogie", "Marcha militar", "Música electrónica", "Vals"),
    ],
  },
  "dr.groove.68": {
    title: "Groove en 6/8",
    body: [
      P("En **6/8**: hi-hat en las seis corcheas, bombo en el **1** y redoblante en el **4** (el comienzo del segundo grupo)."),
      EX({ groove: "dr.groove.68" }, "Groove en 6/8."),
    ],
  },
  "dr.odd": {
    title: "Grooves en compases irregulares",
    body: [
      P("En **7/8** o **5/4** el groove se arma por **grupos** (2 + 2 + 3, 3 + 2...). El redoblante suele marcar el comienzo del último grupo."),
      P("*Money* de Pink Floyd tiene la batería en 7/4; el rock progresivo está lleno de ejemplos."),
    ],
    quiz: [
      Q("Para tocar en 7/8 conviene...", "pensar en grupos como 2 + 2 + 3", "tocar como en 4/4", "no usar el bombo", "contar hasta 8"),
      Q("¿En qué compás está la batería de *Money*?", "7/4", "4/4", "3/4", "6/8"),
    ],
  },
};

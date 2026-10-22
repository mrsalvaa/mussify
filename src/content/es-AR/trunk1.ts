// SPDX-License-Identifier: GPL-3.0-or-later
// Contenido (es-AR): sonido, pentagrama, clave de Sol y ritmo básico.
import { type LessonTexts, P, TIP, EX, Q } from "../types";

const NOTE_NAMES: Record<string, [string, string]> = {
  C: ["Do", "C"], D: ["Re", "D"], E: ["Mi", "E"], F: ["Fa", "F"], G: ["Sol", "G"], A: ["La", "A"], B: ["Si", "B"],
};

/** Texto de lección para leer una nota en clave de Sol. */
function trebleNote(n: string, where: string, tip: string, extraKnown: string): LessonTexts[string] {
  const [lat, eng] = NOTE_NAMES[n[0]];
  return {
    title: `${lat}${n[1]} en clave de Sol`,
    body: [
      P(`Esta es **${lat}** (${eng}${n[1]}). ${where}`),
      EX({ notes: `${extraKnown} ${n}`.trim(), clef: "treble", labels: true }, `Las notas que ya conocés y la nueva: ${lat}.`),
      TIP(tip),
    ],
  };
}

export const TRUNK1: LessonTexts = {
  "t.sound": {
    title: "¿Agudo o grave?",
    body: [
      P("Todo sonido musical tiene una **altura**: puede ser **agudo** (finito, como un pajarito) o **grave** (grueso, como un trueno o un bajo eléctrico)."),
      EX({ play: "C6 C3" }, "Primero un sonido agudo, después uno grave."),
      P("Entrenar el oído empieza por acá: escuchar dos sonidos y darte cuenta cuál está **más arriba**. Cuando escuchás el solo de guitarra de *Comfortably Numb* subiendo, lo que sube es la altura."),
      EX({ play: "C4 E4 G4 C5" }, "Estos sonidos van subiendo: cada uno es más agudo que el anterior."),
      TIP("No te preocupes por los nombres todavía: solo escuchá si sube o baja."),
    ],
  },
  "t.notes": {
    title: "Las siete notas",
    body: [
      P("En la música occidental usamos **siete nombres** para las alturas: **Do, Re, Mi, Fa, Sol, La, Si**. A cada una se le dice **[[t.notes|nota]]**."),
      EX({ play: "C4 D4 E4 F4 G4 A4 B4" }, "Do, Re, Mi, Fa, Sol, La, Si."),
      P("En inglés se usan letras: **C D E F G A B**. Do = C, Re = D, Mi = E, Fa = F, Sol = G, La = A, Si = B."),
      TIP("Truco: la nomenclatura en inglés empieza en La = A. Contá desde ahí: A (La), B (Si), C (Do)..."),
      P("Después de Si vuelve a empezar Do. Podés elegir en Ajustes si querés ver los nombres como Do Re Mi o como C D E."),
    ],
    quiz: [
      Q("¿Cuántos nombres de notas hay?", "Siete", "Cinco", "Doce", "Ocho"),
      Q("¿Cómo se escribe Sol en inglés?", "G", "S", "F", "A"),
      Q("¿Qué letra es La?", "A", "L", "E", "B"),
    ],
  },
  "t.octave": {
    title: "La octava",
    body: [
      P("Si después de Si seguís subiendo, vuelve a aparecer Do, pero **más agudo**. La distancia entre un Do y el siguiente Do se llama **[[t.octave|octava]]**."),
      EX({ play: "C4 C5" }, "Dos Do: el segundo está una octava más arriba."),
      P("Dos notas a una octava de distancia suenan **muy parecidas**, como si fueran la misma nota en otro registro. Por eso llevan el mismo nombre."),
      P("Para distinguirlas les ponemos un número: **Do4** es el Do del medio del piano; **Do5** es el de una octava más arriba; **Do3**, el de una octava más abajo."),
      EX({ play: "A3 A4 A5" }, "La3, La4 y La5: tres La en distintas octavas."),
    ],
    quiz: [
      Q("Do4 y Do5 están a una distancia de...", "una octava", "una nota", "dos octavas", "siete octavas"),
      Q("¿Qué nota está una octava arriba de Mi4?", "Mi5", "Fa4", "Mi3", "Mi4"),
    ],
  },
  "t.staff": {
    title: "El pentagrama",
    body: [
      P("Para escribir notas usamos el **[[t.staff|pentagrama]]**: cinco líneas horizontales con cuatro espacios entre ellas."),
      EX({ notes: "E4 F4 G4 A4 B4 C5 D5 E5 F5", hideClef: true }, "Notas en líneas y en espacios, de abajo hacia arriba."),
      P("Las líneas y los espacios se cuentan **de abajo hacia arriba**: la línea de abajo es la 1ª, la de arriba es la 5ª."),
      P("Cuanto **más arriba** está una nota en el pentagrama, **más aguda** suena."),
      TIP("Una nota está **en una línea** si la línea la cruza por el medio; está **en un espacio** si queda entre dos líneas."),
    ],
    quiz: [
      Q("¿Cuántas líneas tiene el pentagrama?", "Cinco", "Cuatro", "Seis", "Siete"),
      Q("¿Cuántos espacios hay entre las líneas?", "Cuatro", "Cinco", "Tres", "Seis"),
      Q("Si una nota está más arriba en el pentagrama...", "suena más aguda", "suena más grave", "suena más fuerte", "dura más"),
    ],
  },
  "clef.treble": {
    title: "La clave de Sol",
    body: [
      P("El pentagrama solo no dice qué nota es cada línea. Para eso está la **clave**. La **[[clef.treble|clave de Sol]]** se dibuja al principio y su ruloide envuelve la **2ª línea**."),
      EX({ emptyStaff: true, clef: "treble" }, "La clave de Sol se enrosca alrededor de la 2ª línea."),
      P("Esa línea pasa a llamarse **Sol** (el Sol del medio, Sol4). A partir de ahí, cada línea y cada espacio es la nota siguiente, hacia arriba o hacia abajo."),
      TIP("La clave de Sol se usa para la mano derecha del piano, la guitarra, la voz y la mayoría de los instrumentos agudos."),
    ],
    quiz: [
      Q("¿Qué línea marca la clave de Sol?", "La 2ª", "La 1ª", "La 3ª", "La 4ª"),
      Q("En clave de Sol, la nota sobre la 2ª línea es...", "Sol", "Do", "Fa", "La"),
      Q("¿Para qué sirve la clave?", "Para saber qué nota es cada línea y espacio", "Para saber qué tan fuerte tocar", "Para saber el tempo", "Para nada, es decorativa"),
    ],
  },
  "read.treble.G4": {
    title: "Sol4 en clave de Sol",
    body: [
      P("Empezamos por la nota que nos regala la clave: **Sol** (G4), sobre la **2ª línea**."),
      EX({ notes: "G4", clef: "treble", labels: true }, "Sol."),
      TIP("Mirá dónde se enrosca la clave: ahí está Sol."),
    ],
  },
  "read.treble.A4": trebleNote("A4", "Está en el **2º espacio**, justo arriba de Sol.", "Subir de una línea al espacio de arriba es subir a la nota siguiente: Sol → La.", "G4"),
  "read.treble.F4": trebleNote("F4", "Está en el **1er espacio**, justo debajo de Sol.", "Bajar de una línea al espacio de abajo es ir a la nota anterior: Sol → Fa.", "G4 A4"),
  "read.treble.B4": trebleNote("B4", "Está sobre la **3ª línea**, la del medio.", "Si queda justo en el centro del pentagrama.", "F4 G4 A4"),
  "read.treble.E4": trebleNote("E4", "Está sobre la **1ª línea**, la de abajo de todo.", "Mi, Sol, Si: las tres primeras líneas saltean una nota cada vez.", "F4 G4 A4 B4"),
  "read.treble.C5": trebleNote("C5", "Está en el **3er espacio**, arriba de Si.", "Los espacios de abajo hacia arriba dicen Fa, La, Do... y falta uno.", "E4 F4 G4 A4 B4"),
  "read.treble.D4": trebleNote("D4", "Está **debajo** de la 1ª línea, colgando del pentagrama.", "Re queda justo abajo de Mi, sin línea propia.", "E4 F4 G4 A4 B4 C5"),
  "read.treble.C4": {
    title: "Do central (Do4)",
    body: [
      P("Debajo de Re hay una nota que necesita una rayita propia: es **Do4**, el **[[read.treble.C4|Do central]]**. Esa rayita corta se llama **[[read.treble.C4|línea adicional]]**: alarga el pentagrama solo para esa nota."),
      EX({ notes: "C4 D4 E4 F4 G4", clef: "treble", labels: true }, "Do, Re, Mi, Fa, Sol: cinco notas seguidas."),
      P("Se llama Do central porque está en el medio del teclado del piano. Desde acá vas a poder leer melodías enteras."),
    ],
    quiz: [
      Q("¿Cómo se llama la rayita corta que cruza a Do4?", "Línea adicional", "Barra", "Clave", "Plica"),
      Q("¿Dónde está Do4 en clave de Sol?", "Sobre una línea adicional debajo del pentagrama", "En la 1ª línea", "En el 3er espacio", "Sobre la 5ª línea"),
    ],
  },
  "read.treble.D5": trebleNote("D5", "Está sobre la **4ª línea**.", "Las líneas, de abajo hacia arriba: Mi, Sol, Si, Re... (falta la última).", "C4 D4 E4 F4 G4 A4 B4 C5"),
  "read.treble.E5": trebleNote("E5", "Está en el **4º espacio**, el último.", "Los espacios de abajo hacia arriba forman la palabra **FA-LA-DO-MI**.", "G4 A4 B4 C5 D5"),
  "read.treble.F5": trebleNote("F5", "Está sobre la **5ª línea**, la de arriba de todo.", "Las líneas, de abajo hacia arriba: **Mi, Sol, Si, Re, Fa**.", "A4 B4 C5 D5 E5"),
  "read.treble.G5": trebleNote("G5", "Está **arriba** de la 5ª línea, apoyado sobre el pentagrama.", "Sol4 y Sol5 están a una octava: uno en la 2ª línea y el otro arriba de todo.", "G4 B4 D5 E5 F5"),

  // ---------------- Ritmo ----------------
  "t.pulse": {
    title: "El pulso",
    body: [
      P("Cuando movés el pie al escuchar una canción, estás siguiendo el **[[t.pulse|pulso]]**: un golpe parejo, regular, que no se detiene."),
      EX({ play: "C5 C5 C5 C5", instrument: "drums" }, "Cuatro pulsos parejos."),
      P("En *We Will Rock You* de Queen el pulso se escucha clarito: pisada, pisada, aplauso... siempre a la misma distancia."),
      P("El aparato que marca el pulso se llama **[[t.pulse|metrónomo]]**. En la app tenés uno en la sección Ritmo."),
    ],
    quiz: [
      Q("El pulso es...", "un golpe regular y parejo", "un sonido agudo", "el nombre de una nota", "el volumen de la música"),
    ],
  },
  "rh.q": {
    title: "La negra",
    body: [
      P("Para escribir cuánto **dura** un sonido usamos **figuras**. La primera es la **[[rh.q|negra]]**: una cabeza rellena con una rayita vertical (la *plica*)."),
      EX({ rhythm: "q q q q" }, "Cuatro negras: una por pulso."),
      P("La negra dura **un pulso**. Si el pulso va a 60 golpes por minuto, cada negra dura un segundo."),
      TIP("Para leer ritmo, por ahora todas las notas se escriben sobre una sola línea: lo que importa es cuánto duran."),
    ],
    quiz: [Q("¿Cuántos pulsos dura una negra?", "1", "2", "4", "Medio")],
  },
  "rh.h": {
    title: "La blanca",
    body: [
      P("La **[[rh.h|blanca]]** tiene la cabeza vacía y plica. Dura **dos pulsos**: lo mismo que dos negras."),
      EX({ rhythm: "h h q q h" }, "Blanca, blanca, negra, negra, blanca."),
      TIP("Mientras suena una blanca, contá en voz alta \"uno-dos\" y mantené el sonido."),
    ],
    quiz: [Q("Una blanca dura lo mismo que...", "dos negras", "una negra", "cuatro negras", "media negra")],
  },
  "rh.w": {
    title: "La redonda",
    body: [
      P("La **[[rh.w|redonda]]** es una cabeza vacía sin plica. Dura **cuatro pulsos**: dos blancas o cuatro negras."),
      EX({ rhythm: "w h h q q q q" }, "Redonda, dos blancas y cuatro negras: cada grupo dura lo mismo."),
    ],
    quiz: [
      Q("¿Cuántas negras entran en una redonda?", "4", "2", "3", "8"),
      Q("¿Cuántas blancas entran en una redonda?", "2", "4", "1", "3"),
    ],
  },
  "rest.q": {
    title: "El silencio de negra",
    body: [
      P("La música también está hecha de **silencios**. El **[[rest.q|silencio de negra]]** es un garabato en zigzag y vale **un pulso sin sonido**."),
      EX({ rhythm: "q qr q qr" }, "Negra, silencio, negra, silencio."),
      TIP("Durante un silencio el pulso sigue: contalo igual, en silencio."),
    ],
    quiz: [Q("El silencio de negra dura...", "un pulso", "dos pulsos", "nada", "cuatro pulsos")],
  },
  "t.measure": {
    title: "Barras y compases",
    body: [
      P("Para leer más fácil, la música se divide en grupos de pulsos separados por **barras verticales**. Cada grupo se llama **[[t.measure|compás]]**."),
      EX({ rhythm: "q q q q | h h | w" }, "Tres compases de cuatro pulsos cada uno."),
      P("En un mismo tema todos los compases suelen tener la **misma cantidad de pulsos**. Al final de la pieza va una barra doble."),
      P("El primer pulso de cada compás suele sentirse **más fuerte**: es el que marcás con más ganas con el pie."),
    ],
    quiz: [
      Q("¿Qué separa un compás de otro?", "Una barra vertical", "Una clave", "Un silencio", "Una nota"),
      Q("¿Qué pulso del compás suele sentirse más fuerte?", "El primero", "El último", "Todos iguales", "El segundo"),
    ],
  },
  "ts.4/4": {
    title: "El compás de 4/4",
    body: [
      P("Al principio de la partitura hay dos números, uno arriba del otro: el **compás**. En **4/4** el número de arriba dice que hay **cuatro pulsos** por compás y el de abajo, que cada pulso es una **negra**."),
      EX({ rhythm: "q q q q | h q q | w", ts: "4/4" }, "4/4: cuatro negras por compás."),
      P("Es el compás más común del rock: *Back in Black*, *Let It Be* o *De música ligera* están en 4/4."),
    ],
    quiz: [
      Q("En 4/4, ¿cuántos pulsos hay en cada compás?", "4", "3", "2", "8"),
      Q("En 4/4, ¿qué figura vale un pulso?", "La negra", "La blanca", "La redonda", "Ninguna"),
    ],
  },
  "rest.h": {
    title: "El silencio de blanca",
    body: [
      P("El **silencio de blanca** es un rectangulito **apoyado sobre** la línea (como un sombrero). Vale **dos pulsos** de silencio."),
      EX({ rhythm: "q q hr | hr h", ts: "4/4" }, "Silencios de blanca."),
    ],
    quiz: [Q("El silencio de blanca vale...", "dos pulsos", "un pulso", "cuatro pulsos", "medio pulso")],
  },
  "rest.w": {
    title: "El silencio de redonda",
    body: [
      P("El **silencio de redonda** es un rectangulito **colgado debajo** de la línea. Se usa para un compás entero en silencio."),
      EX({ rhythm: "w | wr | h h", ts: "4/4" }, "Un compás completo de silencio en el medio."),
      TIP("Para no confundirlos: la redonda pesa más, por eso cuelga; la blanca es más liviana y se apoya."),
    ],
    quiz: [Q("¿Cuál cuelga de la línea?", "El silencio de redonda", "El silencio de blanca", "El silencio de negra", "Ninguno")],
  },
  "ts.3/4": {
    title: "El compás de 3/4",
    body: [
      P("En **3/4** hay **tres pulsos** de negra por compás: **FUER-te, dé-bil, dé-bil**. Es el compás del vals."),
      EX({ rhythm: "q q q | h q | h q", ts: "3/4" }, "3/4: tres negras por compás."),
      P("Muchas baladas de rock usan esta sensación de vaivén. Escuchá cómo el acento cae cada tres pulsos."),
    ],
    quiz: [Q("En 3/4, ¿cuántas negras entran en un compás?", "3", "4", "2", "6")],
  },
  "ts.2/4": {
    title: "El compás de 2/4",
    body: [
      P("En **2/4** hay **dos pulsos** de negra por compás: **FUER-te, dé-bil**. Es el compás de las marchas y de muchos ritmos bailables."),
      EX({ rhythm: "q q | h | q q", ts: "2/4" }, "2/4: dos negras por compás."),
    ],
    quiz: [Q("¿Qué figura sola llena un compás de 2/4?", "Una blanca", "Una redonda", "Una negra", "Dos blancas")],
  },
  "rh.8": {
    title: "La corchea",
    body: [
      P("La **[[rh.8|corchea]]** es como una negra con una banderita (el *corchete*). Dura **medio pulso**: entran dos corcheas en una negra."),
      EX({ rhythm: "8 8 8 8 q q | 8 8 q h", ts: "4/4" }, "Cuando van juntas, las corcheas se unen con una barra."),
      P("Para contarlas decí **\"1 y 2 y 3 y 4 y\"**: el número cae en el pulso y la **y** en el medio. La batería de casi cualquier tema de rock marca corcheas."),
    ],
    quiz: [
      Q("¿Cuántas corcheas entran en una negra?", "2", "1", "4", "3"),
      Q("¿Cuántas corcheas entran en un compás de 4/4?", "8", "4", "6", "16"),
    ],
  },
  "rest.8": {
    title: "El silencio de corchea",
    body: [
      P("El **silencio de corchea** parece un 7 con una bolita. Vale **medio pulso** de silencio."),
      EX({ rhythm: "8r 8 8r 8 q q", ts: "4/4" }, "Silencio en el pulso y nota en la \"y\": suena a contratiempo."),
      TIP("Tocar en la \"y\" (entre pulsos) es lo que hace que un ritmo suene con onda."),
    ],
    quiz: [Q("El silencio de corchea dura...", "medio pulso", "un pulso", "dos pulsos", "un cuarto de pulso")],
  },
  "rh.dot": {
    title: "El puntillo",
    body: [
      P("Un **[[rh.dot|puntillo]]** a la derecha de una figura le **suma la mitad** de su valor."),
      P("Blanca con puntillo = 2 + 1 = **3 pulsos**. Negra con puntillo = 1 + ½ = **un pulso y medio**."),
      EX({ rhythm: "h. q | q. 8 h", ts: "4/4" }, "Blanca con puntillo y negra con puntillo."),
      TIP("La negra con puntillo casi siempre va seguida de una corchea, que completa los dos pulsos."),
    ],
    quiz: [
      Q("¿Cuánto dura una blanca con puntillo?", "3 pulsos", "2 pulsos", "2 pulsos y medio", "4 pulsos"),
      Q("¿Cuánto dura una negra con puntillo?", "Un pulso y medio", "Dos pulsos", "Un pulso", "Medio pulso"),
    ],
  },
  "rh.tie": {
    title: "La ligadura",
    body: [
      P("La **[[rh.tie|ligadura]]** es una curva que une dos notas **de la misma altura**: la segunda no se vuelve a tocar, solo se **suma** su duración a la primera."),
      EX({ rhythm: "q~ q h | h~ q q", ts: "4/4" }, "Negra ligada a negra = suena como una blanca."),
      P("Sirve sobre todo para sostener un sonido más allá de una barra de compás, algo que no se puede escribir con una sola figura."),
    ],
    quiz: [Q("Dos negras ligadas duran...", "dos pulsos, sin volver a tocar", "un pulso", "dos pulsos, tocando dos veces", "cuatro pulsos")],
  },
  "ear.rhythm": {
    title: "Dictado rítmico",
    body: [
      P("Ahora vas a **escribir** lo que escuchás. Primero suena un compás de metrónomo para contar; después el ritmo."),
      P("Armalo eligiendo figuras en orden. Contá los pulsos en voz baja mientras escuchás: \"1 y 2 y 3 y 4 y\"."),
      EX({ rhythm: "q 8 8 h", ts: "4/4" }, "Ejemplo: negra, dos corcheas, blanca."),
      TIP("Podés escucharlo todas las veces que quieras."),
    ],
  },
  "t.tempo": {
    title: "El tempo",
    body: [
      P("El **[[t.tempo|tempo]]** es la velocidad del pulso. Se mide en **BPM**: pulsos por minuto. 60 BPM = un pulso por segundo."),
      P("También se usan palabras en italiano: **Largo** (muy lento), **Adagio** (lento), **Andante** (al paso), **Moderato**, **Allegro** (rápido) y **Presto** (muy rápido)."),
      EX({ rhythm: "q q q q", ts: "4/4", tempo: 60 }, "60 BPM."),
      EX({ rhythm: "q q q q", ts: "4/4", tempo: 140 }, "140 BPM."),
      P("*Wish You Were Here* anda cerca de 60 BPM; *Highway to Hell* de AC/DC, cerca de 116."),
    ],
    quiz: [
      Q("¿Qué significa 120 BPM?", "120 pulsos por minuto", "120 notas por compás", "120 compases", "120 segundos"),
      Q("¿Cuál de estos tempos es más rápido?", "Allegro", "Adagio", "Largo", "Andante"),
      Q("A 60 BPM, ¿cuánto dura cada pulso?", "Un segundo", "Medio segundo", "Dos segundos", "Un minuto"),
    ],
  },
  "t.dynamics": {
    title: "Fuerte y suave (matices)",
    body: [
      P("Los **matices** indican la intensidad: **p** (piano, suave), **f** (forte, fuerte), **mf** (mezzoforte, medio fuerte), **pp** y **ff** (muy suave, muy fuerte)."),
      P("Un **crescendo** (<) va de suave a fuerte; un **decrescendo** (>) va de fuerte a suave. *Stairway to Heaven* es un gran crescendo de ocho minutos."),
    ],
    quiz: [
      Q("¿Qué significa f?", "Fuerte", "Fino", "Final", "Fa"),
      Q("¿Qué significa p?", "Suave", "Pausa", "Pulso", "Pronto"),
      Q("Un crescendo es...", "ir de suave a fuerte", "ir de rápido a lento", "ir de agudo a grave", "un silencio largo"),
    ],
  },
  "rh.16": {
    title: "La semicorchea",
    body: [
      P("La **[[rh.16|semicorchea]]** tiene dos corchetes (o dos barras cuando van juntas). Dura **un cuarto de pulso**: entran cuatro en una negra."),
      EX({ rhythm: "16 16 16 16 q 8 16 16 q", ts: "4/4" }, "Grupos de semicorcheas."),
      P("Se cuentan **\"1 e y a, 2 e y a...\"**. El funk de Red Hot Chili Peppers vive de las semicorcheas."),
    ],
    quiz: [
      Q("¿Cuántas semicorcheas entran en una negra?", "4", "2", "8", "3"),
      Q("¿Cuántas semicorcheas entran en una corchea?", "2", "4", "1", "3"),
    ],
  },
  "rest.16": {
    title: "El silencio de semicorchea",
    body: [
      P("El **silencio de semicorchea** es como el de corchea pero con **dos** bolitas. Vale un cuarto de pulso."),
      EX({ rhythm: "16 16r 16 16 8 8 q h", ts: "4/4" }, "Seguimos contando \"1 e y a\" aunque haya silencios."),
    ],
    quiz: [Q("El silencio de semicorchea vale...", "un cuarto de pulso", "medio pulso", "un pulso", "dos pulsos")],
  },
};

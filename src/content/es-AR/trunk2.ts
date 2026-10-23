// SPDX-License-Identifier: GPL-3.0-or-later
// Contenido (es-AR): clave de Fa, dictado melódico, alteraciones e intervalos.
import { type LessonTexts, P, TIP, EX, Q } from "../types";

const NAMES: Record<string, string> = { C: "Do", D: "Re", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si" };

function bassNote(n: string, where: string, tip: string, known: string): LessonTexts[string] {
  const lat = NAMES[n[0]];
  return {
    title: `${lat}${n[1]} en clave de Fa`,
    body: [
      P(`Esta es **${lat}${n[1]}** (${n}). ${where}`),
      EX({ notes: `${known} ${n}`.trim(), clef: "bass", labels: true }, `Lo que ya leés en clave de Fa y la nueva: ${lat}.`),
      TIP(tip),
    ],
  };
}

function interval(id: string, title: string, semis: number, desc: string, ref: string, ex: string, art = "una"): LessonTexts[string] {
  void id;
  return {
    title,
    body: [
      P(`**${title}**: ${semis} [[t.semitone|semitonos]]. ${desc}`),
      EX({ play: ex }, "Escuchala subiendo."),
      EX({ play: ex, harmonic: true }, "Y las dos notas juntas."),
      TIP(ref),
    ],
    quiz: [Q(`¿Cuántos semitonos tiene ${art} ${title.toLowerCase()}?`, String(semis), String(semis + 1), String(semis - 1), String(semis + 2))],
  };
}

export const TRUNK2: LessonTexts = {
  "clef.bass": {
    title: "La clave de Fa",
    body: [
      P("Para las notas graves (la mano izquierda del piano, el bajo, el violonchelo) se usa la **[[clef.bass|clave de Fa]]**. Sus dos puntitos encierran la **4ª línea**, que pasa a llamarse **Fa** (Fa3)."),
      EX({ emptyStaff: true, clef: "bass" }, "Clave de Fa: los dos puntos rodean la 4ª línea."),
      P("Ese Fa3 está apenas abajo del Do central. Todo se lee igual que en clave de Sol: solo cambia el punto de partida."),
      TIP("Clave de Sol para lo agudo, clave de Fa para lo grave. En el piano se usan las dos a la vez."),
    ],
    quiz: [
      Q("¿Qué línea marca la clave de Fa?", "La 4ª", "La 2ª", "La 3ª", "La 1ª"),
      Q("La clave de Fa se usa para...", "notas graves", "notas agudas", "el ritmo", "la batería"),
      Q("En clave de Fa, la 4ª línea es...", "Fa", "Sol", "Do", "Re"),
    ],
  },
  "read.bass.F3": bassNote("F3", "Está sobre la **4ª línea**, la que marca la clave.", "Los dos puntos de la clave te señalan esta nota.", ""),
  "read.bass.G3": bassNote("G3", "Está en el **4º espacio**, arriba de Fa.", "Subir un lugar (de línea a espacio) es subir una nota.", "F3"),
  "read.bass.E3": bassNote("E3", "Está en el **3er espacio**, debajo de Fa.", "Mi, Fa, Sol: tres lugares seguidos.", "F3 G3"),
  "read.bass.A3": bassNote("A3", "Está sobre la **5ª línea**, la de arriba de todo.", "Las líneas de arriba en clave de Fa: Fa y La.", "E3 F3 G3"),
  "read.bass.D3": bassNote("D3", "Está sobre la **3ª línea**, la del medio.", "Re queda justo en el centro del pentagrama en clave de Fa.", "E3 F3 G3 A3"),
  "read.bass.C4": bassNote("C4", "¡Es el **Do central**! En clave de Fa se escribe en una **línea adicional** arriba del pentagrama.", "Es el mismo Do4 que leíste en clave de Sol abajo de todo: es el punto de encuentro de las dos claves.", "D3 E3 F3 G3 A3"),
  "read.bass.B3": bassNote("B3", "Está **arriba** de la 5ª línea, colgando del pentagrama.", "Si3 queda entre La3 (5ª línea) y Do4 (línea adicional).", "D3 E3 F3 G3 A3 C4"),
  "read.bass.C3": bassNote("C3", "Está en el **2º espacio**.", "Do3 está una octava abajo del Do central.", "D3 E3 F3 G3 A3 B3 C4"),
  "read.bass.B2": bassNote("B2", "Está sobre la **2ª línea**.", "Las líneas de abajo hacia arriba: Sol, Si, Re, Fa, La (falta la 1ª).", "C3 D3 E3 F3 G3"),
  "read.bass.A2": bassNote("A2", "Está en el **1er espacio**.", "Los espacios de abajo hacia arriba en clave de Fa: **La, Do, Mi, Sol**.", "B2 C3 D3 E3"),
  "read.bass.G2": bassNote("G2", "Está sobre la **1ª línea**, la de abajo de todo.", "Líneas en clave de Fa: **Sol, Si, Re, Fa, La**.", "A2 B2 C3 D3"),
  "read.bass.F2": bassNote("F2", "Está **debajo** de la 1ª línea.", "Fa2 y Fa3 están a una octava: uno abajo de todo y el otro en la línea de la clave.", "G2 A2 B2 C3 F3"),
  "read.bass.E2": bassNote("E2", "Está sobre una **línea adicional** debajo del pentagrama.", "Mi2 es el sonido de la cuerda más grave de la guitarra.", "F2 G2 A2 B2"),
  "ear.melodic": {
    title: "Dictado melódico",
    body: [
      P("Vas a escuchar una melodía corta que **empieza siempre en Do**. Tu tarea: escribir qué notas sonaron, en orden."),
      EX({ notes: "C4 D4 E4 D4 C4", clef: "treble", labels: true }, "Ejemplo: Do, Re, Mi, Re, Do."),
      TIP("Cantá por dentro: ¿la nota siguiente sube o baja? ¿Un paso o un salto?"),
    ],
  },

  // ---------------- Alteraciones ----------------
  "t.keyboardMap": {
    title: "El teclado como mapa",
    body: [
      P("El teclado del piano es el mejor mapa para entender las notas. Tiene teclas **blancas** y **negras**; las negras están agrupadas de a **dos** y de a **tres**."),
      EX({ keyboard: "C4 D4 E4 F4 G4 A4 B4" }, "Las teclas blancas son las siete notas: Do Re Mi Fa Sol La Si."),
      P("**Do** es la tecla blanca justo a la izquierda del grupo de **dos** negras. Desde ahí, las blancas siguen Re, Mi, Fa, Sol, La, Si y vuelve Do."),
      TIP("No hace falta tocar el piano para usar este mapa: lo vas a usar para entender distancias entre notas."),
    ],
    quiz: [
      Q("¿Dónde está Do en el teclado?", "A la izquierda del grupo de dos teclas negras", "A la izquierda del grupo de tres teclas negras", "En cualquier tecla negra", "Siempre en el medio"),
      Q("¿Cómo están agrupadas las teclas negras?", "De a dos y de a tres", "De a cuatro", "Todas juntas", "De a una"),
      Q("¿Qué notas son las teclas blancas?", "Do Re Mi Fa Sol La Si", "Solo Do", "Las notas agudas", "Ninguna"),
    ],
  },
  "t.semitone": {
    title: "Tono y semitono",
    body: [
      P("La distancia más chica entre dos teclas vecinas (sin saltear ninguna, blanca o negra) se llama **[[t.semitone|semitono]]**. Dos semitonos forman un **tono**."),
      EX({ keyboard: "C4 C#4" }, "Do y la tecla negra de al lado: un semitono."),
      EX({ keyboard: "C4 D4" }, "Do y Re: un tono (hay una tecla negra en el medio)."),
      P("Ojo: entre **Mi y Fa** y entre **Si y Do** no hay tecla negra. Esas notas están a **un semitono**; todas las otras blancas vecinas están a un tono."),
    ],
    quiz: [
      Q("¿Cuántos semitonos tiene un tono?", "2", "1", "3", "12"),
      Q("¿Qué distancia hay entre Mi y Fa?", "Un semitono", "Un tono", "Dos tonos", "Ninguna"),
      Q("¿Qué distancia hay entre Fa y Sol?", "Un tono", "Un semitono", "Tres semitonos", "Una octava"),
      Q("¿Cuántos semitonos hay en una octava?", "12", "7", "8", "10"),
    ],
  },
  "acc.sharp": {
    title: "El sostenido ♯",
    body: [
      P("El **[[acc.sharp|sostenido]]** (♯) **sube** una nota un semitono. Fa♯ es la tecla negra justo a la derecha de Fa."),
      EX({ notes: "F4 F#4 C5 C#5", clef: "treble", labels: true }, "Fa y Fa♯, Do y Do♯."),
      P("En el pentagrama el ♯ se escribe **a la izquierda** de la nota, en su misma línea o espacio. Vale para **todo el compás**: si vuelve a aparecer esa nota antes de la barra, sigue siendo sostenido."),
      TIP("En el teclado, el sostenido de una nota casi siempre es la tecla negra de la derecha. Las excepciones son Mi♯ y Si♯, que caen en teclas blancas (Fa y Do)."),
    ],
    quiz: [
      Q("El sostenido...", "sube la nota un semitono", "baja la nota un semitono", "la sube un tono", "la deja igual"),
      Q("¿Dónde se escribe el sostenido?", "A la izquierda de la nota", "A la derecha de la nota", "Arriba del pentagrama", "Al final del compás"),
      Q("Un sostenido escrito al principio del compás vale...", "hasta la próxima barra de compás", "solo para esa nota", "para toda la obra", "para todas las notas"),
    ],
  },
  "acc.flat": {
    title: "El bemol ♭",
    body: [
      P("El **[[acc.flat|bemol]]** (♭) **baja** una nota un semitono. Si♭ es la tecla negra justo a la izquierda de Si."),
      EX({ notes: "B4 Bb4 E4 Eb4", clef: "treble", labels: true }, "Si y Si♭, Mi y Mi♭."),
      P("Igual que el sostenido: va a la izquierda de la nota y dura hasta la barra de compás."),
      TIP("Si♭ y Mi♭ aparecen todo el tiempo en el rock: *Smoke on the Water* tiene un Si♭ en su riff."),
    ],
    quiz: [
      Q("El bemol...", "baja la nota un semitono", "sube la nota un semitono", "la baja un tono", "la hace más fuerte"),
      Q("¿Qué tecla es Si♭?", "La negra a la izquierda de Si", "La negra a la derecha de Si", "Do", "La blanca a la izquierda de Si"),
    ],
  },
  "acc.natural": {
    title: "El becuadro ♮",
    body: [
      P("El **[[acc.natural|becuadro]]** (♮) **anula** un sostenido o un bemol anterior: la nota vuelve a ser natural (tecla blanca)."),
      EX({ notes: "F#4:q F4:q G4:h", clef: "treble", ts: "4/4" }, "Fa♯, después Fa natural con becuadro, y Sol."),
      TIP("Después de la barra de compás, las alteraciones se borran solas; no hace falta becuadro."),
    ],
    quiz: [Q("El becuadro...", "anula la alteración anterior", "sube un semitono", "baja un semitono", "alarga la nota")],
  },
  "t.enharmonic": {
    title: "Enarmonía: dos nombres, un sonido",
    body: [
      P("Do♯ y Re♭ son **la misma tecla** y suenan igual. Dos nombres distintos para el mismo sonido se llaman **[[t.enharmonic|enarmónicos]]**."),
      EX({ notes: "C#4 Db4", clef: "treble", labels: true }, "Do♯ y Re♭: mismo sonido, distinto nombre."),
      P("¿Por qué existen los dos? Porque según el contexto conviene uno u otro nombre; ya lo vas a ver."),
      TIP("También Mi♯ = Fa y Si♯ = Do, aunque se usan poco."),
    ],
    quiz: [
      Q("¿Qué nota es enarmónica de Fa♯?", "Sol♭", "Fa♭", "Sol♯", "Mi"),
      Q("Dos notas enarmónicas...", "suenan igual y se escriben distinto", "suenan distinto y se escriben igual", "están a una octava", "son siempre teclas blancas"),
    ],
  },
  "acc.double": {
    title: "Dobles alteraciones",
    body: [
      P("A veces una nota ya alterada necesita otra alteración. El **doble sostenido** (𝄪) sube **dos** semitonos y el **doble bemol** (𝄫) baja **dos**."),
      EX({ notes: "F##4 G4", clef: "treble", labels: true }, "Fa𝄪 suena igual que Sol."),
      P("Aparecen en obras con muchas alteraciones. Por ahora alcanza con reconocerlas."),
    ],
    quiz: [
      Q("El doble sostenido sube...", "dos semitonos", "un semitono", "una octava", "tres semitonos"),
      Q("Fa𝄪 suena igual que...", "Sol", "Fa♯", "Mi", "La"),
      Q("Si𝄫 suena igual que...", "La", "Si♭", "Do", "Sol"),
    ],
  },

  // ---------------- Intervalos ----------------
  "t.interval": {
    title: "¿Qué es un intervalo?",
    body: [
      P("Un **[[t.interval|intervalo]]** es la distancia entre dos notas. Se mide primero contando **nombres de notas, incluyendo las dos puntas**: de Do a Mi hay Do-Re-Mi, tres nombres → **tercera**."),
      EX({ notes: "C4 E4", clef: "treble" }, "Do–Mi: una tercera."),
      P("Así: Do–Re es una **segunda**, Do–Fa una **cuarta**, Do–Sol una **quinta**, Do–La una **sexta**, Do–Si una **séptima** y Do–Do una **octava**."),
      P("Después se le agrega un apellido (**mayor, menor, justa**...) según cuántos semitonos tiene. Eso lo vemos de a uno."),
    ],
    quiz: [
      Q("¿Qué intervalo hay de Re a Fa?", "Una tercera", "Una segunda", "Una cuarta", "Una quinta"),
      Q("¿Qué intervalo hay de Do a Sol?", "Una quinta", "Una cuarta", "Una sexta", "Una tercera"),
      Q("¿Qué intervalo hay de Mi a Mi (una octava arriba)?", "Una octava", "Una séptima", "Una sexta", "Una novena"),
      Q("Para nombrar un intervalo, las dos notas de las puntas...", "se cuentan", "no se cuentan", "se cuenta solo la primera", "da igual"),
    ],
  },
  "iv.P8": {
    title: "Octava justa",
    body: [
      P("Ya la conocés: la **octava justa** va de una nota a la siguiente con el mismo nombre. Tiene **12 semitonos**."),
      EX({ play: "C4 C5" }, "Do4 → Do5."),
      TIP("Para recordarla: el comienzo de *Somewhere Over the Rainbow* (\"Some-where\") salta una octava."),
    ],
    quiz: [Q("¿Cuántos semitonos tiene la octava justa?", "12", "8", "7", "10")],
  },
  "iv.P5": interval("iv.P5", "Quinta justa", 7, "Suena firme, abierta, estable: es la base de muchísimos riffs de rock (Do–Sol, Mi–Si, La–Mi).", "Referencia: el comienzo del tema de *Star Wars* sube una quinta justa.", "C4 G4"),
  "t.harmonic": {
    title: "Intervalos melódicos y armónicos",
    body: [
      P("Un intervalo puede sonar de dos formas: **melódico** (una nota después de la otra) o **armónico** (las dos **a la vez**)."),
      EX({ notes: "C4 G4 [C4 G4]", clef: "treble" }, "Do–Sol melódico, y después armónico: en el pentagrama, las notas a la vez se escriben una arriba de la otra."),
      TIP("Para reconocer un intervalo armónico, tratá de escuchar la nota de arriba y la de abajo por separado."),
    ],
    quiz: [
      Q("Un intervalo armónico es...", "dos notas a la vez", "dos notas seguidas", "una nota sola", "un ritmo"),
      Q("En el pentagrama, dos notas a la vez se escriben...", "una arriba de la otra", "una al lado de la otra", "en pentagramas distintos", "no se pueden escribir"),
    ],
  },
  "iv.M3": interval("iv.M3", "Tercera mayor", 4, "Suena luminosa, alegre. Do–Mi, Fa–La, Sol–Si son terceras mayores.", "Referencia: *Oh When the Saints* empieza con una tercera mayor (Do–Mi).", "C4 E4"),
  "iv.m3": interval("iv.m3", "Tercera menor", 3, "Suena más oscura, melancólica. Re–Fa, Mi–Sol, La–Do son terceras menores.", "Referencia: el riff de *Smoke on the Water* arranca con una tercera menor.", "A3 C4"),
  "iv.P4": interval("iv.P4", "Cuarta justa", 5, "Suena abierta y un poco \"en suspenso\". Do–Fa, Re–Sol, Mi–La.", "Referencia: la *Marcha nupcial* (\"Aquí viene la novia\") empieza con una cuarta justa.", "C4 F4"),
  "iv.M2": interval("iv.M2", "Segunda mayor", 2, "Es un **tono**: Do–Re, Re–Mi, Fa–Sol.", "Referencia: cantá Do-Re y lo tenés.", "C4 D4"),
  "iv.m2": interval("iv.m2", "Segunda menor", 1, "Es un **semitono**: Mi–Fa, Si–Do. Suena tenso, inquietante.", "Referencia: el tema de *Tiburón* alterna dos notas a una segunda menor. Y *Para Elisa* empieza bajando una.", "E4 F4"),
  "iv.M6": interval("iv.M6", "Sexta mayor", 9, "Suena dulce y amplia. Do–La, Fa–Re, Sol–Mi.", "Truco: es una octava menos una tercera menor.", "C4 A4"),
  "iv.m6": interval("iv.m6", "Sexta menor", 8, "Suena nostálgica. Mi–Do, La–Fa, Si–Sol.", "Truco: es una octava menos una tercera mayor.", "E4 C5"),
  "iv.m7": interval("iv.m7", "Séptima menor", 10, "Suena abierta pero inquieta, pide moverse. Sol–Fa, Re–Do, La–Sol.", "Referencia: el tema original de *Star Trek* empieza con una séptima menor.", "G3 F4"),
  "iv.M7": interval("iv.M7", "Séptima mayor", 11, "Suena muy tensa, casi una octava pero \"medio tono antes\". Do–Si, Fa–Mi.", "Truco: pensá en la octava y bajá un semitono.", "C4 B4"),
  "iv.TT": interval("iv.TT", "Tritono", 6, "Son **tres tonos** (cuarta aumentada o quinta disminuida). Fa–Si, Do–Fa♯. Es el intervalo más tenso: en la Edad Media lo llamaban *diabolus in musica*.", "Referencia: el riff de *Black Sabbath* (la canción) se basa en un tritono. También *Purple Haze* y el tema de *Los Simpson*.", "F4 B4", "un"),
  "iv.inversion": {
    title: "Inversión de intervalos",
    body: [
      P("**Invertir** un intervalo es pasar la nota de abajo una octava arriba. Do–Mi (tercera) invertido es Mi–Do (sexta)."),
      EX({ notes: "C4 E4 E4 C5", clef: "treble" }, "Do–Mi y Mi–Do: tercera mayor y sexta menor."),
      P("Dos reglas: los **números suman 9** (3ª ↔ 6ª, 2ª ↔ 7ª, 4ª ↔ 5ª) y la **cualidad se da vuelta**: mayor ↔ menor, aumentada ↔ disminuida; las **justas siguen justas**."),
    ],
    quiz: [
      Q("¿Qué da invertir una cuarta justa?", "Una quinta justa", "Una quinta disminuida", "Una cuarta justa", "Una sexta mayor"),
      Q("Al invertir un intervalo, los números suman...", "9", "8", "7", "12"),
      Q("Una segunda mayor invertida es...", "una séptima menor", "una séptima mayor", "una segunda menor", "una sexta mayor"),
    ],
  },
  "ear.reference": {
    title: "Notas con una referencia",
    body: [
      P("Nombrar una nota de oído sin nada con qué compararla es difícil. Con una **referencia** es mucho más fácil: primero escuchás una nota de la que sabés el nombre (acá, siempre **Do**), después otra, y la deducís con los **intervalos** que ya reconocés."),
      EX({ notes: "C4 G4", clef: "treble", labels: true }, "Do y después Sol: una quinta justa arriba. Si escuchás una quinta, es Sol."),
      EX({ notes: "C4 E4", clef: "treble", labels: true }, "Do y después Mi: una tercera mayor."),
      P("La misma idea sirve con la **octava**: una nota y la misma nota más aguda suenan \"del mismo color\". Vas a empezar con notas a una octava de distancia."),
      TIP("No adivines: cantá la referencia por dentro y después el intervalo hasta la segunda nota."),
    ],
    quiz: [
      Q("¿Para qué sirve la nota de referencia?", "Para deducir la otra nota con intervalos", "Para afinar el instrumento", "Para saber el tempo", "Para nada, es un adorno"),
      Q("Escuchás Do y después una nota una quinta justa más aguda. ¿Cuál es?", "Sol", "Fa", "La", "Mi"),
    ],
  },
};

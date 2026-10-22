// SPDX-License-Identifier: GPL-3.0-or-later
// Contenido (es-AR): rama de piano.
import { type LessonTexts, P, TIP, EX, Q } from "../types";

function keyLesson(letter: string, lat: string, where: string, prev: string): LessonTexts[string] {
  return {
    title: `${lat} en el teclado`,
    body: [
      P(`**${lat}** (${letter}) ${where}`),
      EX({ keyboard: `${letter}3 ${letter}4 ${letter}5`, keyboardRange: [48, 83] }, `Todos los ${lat} del teclado: se repiten cada octava.`),
      TIP(prev),
    ],
  };
}

export const PIANO: LessonTexts = {
  "pn.keyboard": {
    title: "Conocé el teclado",
    body: [
      P("El piano tiene teclas **blancas** y **negras**. Las negras están en grupos de **dos** y de **tres**, y ese dibujo se repite a lo largo de todo el teclado: es tu mapa."),
      EX({ keyboard: "C#4 D#4 F#4 G#4 A#4", keyboardRange: [60, 71] }, "Un grupo de dos negras y uno de tres."),
      P("Hacia la **derecha** el sonido es más **agudo**; hacia la **izquierda**, más **grave**."),
      TIP("Sentate frente al centro del teclado, con la espalda derecha y los codos un poco más arriba que las teclas."),
    ],
    quiz: [
      Q("¿Cómo están agrupadas las teclas negras?", "De a dos y de a tres", "De a cuatro", "Todas seguidas", "De a una"),
      Q("Hacia la derecha del teclado, el sonido es más...", "agudo", "grave", "fuerte", "suave"),
      Q("¿Cada cuánto se repite el dibujo de teclas negras?", "Cada siete teclas blancas", "Cada tres teclas", "Nunca", "Cada dos teclas"),
    ],
  },
  "pn.key.C": keyLesson("C", "Do", "es la tecla blanca **justo a la izquierda del grupo de dos negras**.", "Buscá todos los grupos de dos negras: a la izquierda de cada uno hay un Do."),
  "pn.key.D": keyLesson("D", "Re", "es la tecla blanca **en el medio del grupo de dos negras**.", "Re queda \"encerrada\" entre las dos negras."),
  "pn.key.E": keyLesson("E", "Mi", "es la tecla blanca **justo a la derecha del grupo de dos negras**.", "Do, Re, Mi: las tres blancas que rodean al grupo de dos."),
  "pn.key.F": keyLesson("F", "Fa", "es la tecla blanca **justo a la izquierda del grupo de tres negras**.", "Fa es al grupo de tres lo que Do es al grupo de dos."),
  "pn.key.G": keyLesson("G", "Sol", "es la tecla blanca **entre la 1ª y la 2ª negra del grupo de tres**.", "Fa, Sol, La, Si rodean al grupo de tres."),
  "pn.key.A": keyLesson("A", "La", "es la tecla blanca **entre la 2ª y la 3ª negra del grupo de tres**.", "El La de la mitad del teclado (La4) es el que se usa para afinar: 440 Hz."),
  "pn.key.B": keyLesson("B", "Si", "es la tecla blanca **justo a la derecha del grupo de tres negras**.", "Después de Si viene Do otra vez: arranca una nueva octava."),
  "pn.middleC": {
    title: "El Do central",
    body: [
      P("El **[[pn.middleC|Do central]]** (Do4) es el Do que está más o menos en el medio del teclado, frente a tu ombligo. Es el que se escribe con una línea adicional abajo del pentagrama en clave de Sol."),
      EX({ keyboard: "C4" }, "Do4: el Do central."),
      P("A partir de ahora, cuando veas una nota en el pentagrama vas a tocarla **en su octava exacta**."),
    ],
  },
  "pn.fingers": {
    title: "Los números de los dedos",
    body: [
      P("En piano los dedos se numeran del **1 al 5** en cada mano: **1 = pulgar**, 2 = índice, 3 = mayor, 4 = anular, 5 = meñique."),
      P("Las partituras de piano a veces traen numeritos arriba de las notas: es la **digitación**, qué dedo usar."),
      TIP("Curvá los dedos como si tuvieras una pelotita en la mano; tocá con la yema, no con la uña."),
    ],
    quiz: [
      Q("¿Qué número es el pulgar?", "1", "5", "0", "2"),
      Q("¿Qué número es el meñique?", "5", "1", "4", "6"),
      Q("¿Qué indican los numeritos sobre las notas en una partitura de piano?", "Qué dedo usar", "Cuánto dura la nota", "Qué tan fuerte tocar", "La octava"),
    ],
  },
  "pn.pos.C": {
    title: "Posición de Do (mano derecha)",
    body: [
      P("Apoyá la mano derecha con el **pulgar (1) en Do4** y cada dedo en la tecla blanca siguiente: 2 en Re, 3 en Mi, 4 en Fa, 5 en Sol. Es la **posición de Do**."),
      EX({ notes: "C4 D4 E4 F4 G4", clef: "treble", labels: true }, "Las cinco notas de la posición de Do."),
      P("Sin mover la mano podés tocar un montón de melodías. Leé la nota, buscá el dedo y tocá."),
      EX({ notes: "E4:q D4:q C4:q D4:q E4:q E4:q E4:h", clef: "treble" }, "Una melodía en posición de Do."),
    ],
  },
  "pn.lh": {
    title: "La mano izquierda en posición de Do",
    body: [
      P("La mano izquierda va una octava abajo: **meñique (5) en Do3**, 4 en Re, 3 en Mi, 2 en Fa y **pulgar (1) en Sol3**. Se lee en **clave de Fa**."),
      EX({ notes: "C3 D3 E3 F3 G3", clef: "bass", labels: true }, "La posición de Do de la mano izquierda."),
      TIP("Ojo: en la mano izquierda los números van al revés que en la derecha: el pulgar queda a la derecha."),
    ],
  },
  "pn.extend": {
    title: "Más allá de la posición de Do",
    body: [
      P("Para llegar a La, Si y Do5 con la mano derecha, la mano se **mueve**: podés estirar el meñique o correr toda la mano."),
      EX({ notes: "C4 E4 G4 A4 B4 C5", clef: "treble", labels: true }, "De Do4 a Do5."),
      TIP("Antes de tocar, mirá la melodía entera y fijate cuál es la nota más alta y la más baja: así elegís dónde poner la mano."),
    ],
    quiz: [
      Q("Si una melodía va de Do4 a Do5, ¿qué conviene?", "Mirar el rango antes y ubicar la mano", "Tocar todo con un dedo", "Tocar solo las primeras notas", "Saltear las notas altas"),
      Q("En posición de Do, ¿qué dedo toca Sol4?", "El 5", "El 1", "El 3", "El 4"),
    ],
  },
  "pn.black": {
    title: "Las teclas negras",
    body: [
      P("Ahora que conocés sostenidos y bemoles: cada tecla negra tiene **dos nombres**. La que está entre Do y Re es **Do♯** o **Re♭**."),
      EX({ keyboard: "C#4 D#4 F#4 G#4 A#4" }, "Las cinco teclas negras de una octava."),
      TIP("Para tocar teclas negras, acercá la mano un poco hacia el fondo del teclado."),
    ],
  },
  "pn.ch.maj": {
    title: "Acordes mayores en el piano",
    body: [
      P("Para tocar un acorde mayor con la mano derecha usá los dedos **1, 3 y 5**: fundamental, tercera y quinta. C = Do-Mi-Sol."),
      EX({ keyboard: "C4 E4 G4", harmonic: true }, "C: Do, Mi, Sol."),
      EX({ keyboard: "F4 A4 C5", harmonic: true }, "F: Fa, La, Do."),
      TIP("Forma rápida: desde la fundamental contá **4 semitonos** hasta la tercera y **3 más** hasta la quinta."),
    ],
  },
  "pn.ch.min": {
    title: "Acordes menores en el piano",
    body: [
      P("El acorde menor es igual al mayor pero con la **tercera un semitono más abajo**. Am = La-Do-Mi."),
      EX({ keyboard: "A4 C5 E5", harmonic: true }, "Am."),
      EX({ keyboard: "C4 Eb4 G4", harmonic: true }, "Cm: el Mi baja a Mi♭."),
      TIP("Desde la fundamental: **3 semitonos** hasta la tercera y **4** hasta la quinta (al revés que el mayor)."),
    ],
  },
  "pn.inv": {
    title: "Inversiones en el piano",
    body: [
      P("Tocar acordes en inversión te ahorra saltos. C – F – G en estado fundamental obliga a mover toda la mano; con inversiones casi no te movés:"),
      EX({ keyboard: "C4 E4 G4", harmonic: true }, "C en estado fundamental (Do-Mi-Sol)."),
      EX({ keyboard: "C4 F4 A4", harmonic: true }, "F en 2ª inversión (Do-Fa-La): el pulgar se queda en Do."),
      EX({ keyboard: "B3 D4 G4", harmonic: true }, "G en 1ª inversión (Si-Re-Sol)."),
    ],
  },
  "pn.scale": {
    title: "Escalas con paso del pulgar",
    body: [
      P("Para tocar una escala de 8 notas con 5 dedos, el **pulgar pasa por debajo**: en Do mayor con la derecha, 1-2-3 (Do Re Mi), el pulgar pasa a Fa, y 1-2-3-4-5 (Fa Sol La Si Do)."),
      EX({ notes: "C4 D4 E4 F4 G4 A4 B4 C5", clef: "treble", labels: true }, "Digitación: 1 2 3 1 2 3 4 5."),
      TIP("El pulgar se prepara antes: mientras tocás Mi con el 3, el pulgar ya viaja hacia Fa."),
    ],
  },
  "pn.hands": {
    title: "Manos juntas",
    body: [
      P("El esquema más simple de acompañamiento: la **mano izquierda toca la fundamental** (una nota grave) y la **derecha el acorde**."),
      EX({ chords: ["C", "F", "G", "C"] }, "Izquierda: Do, Fa, Sol, Do. Derecha: los acordes."),
      TIP("Practicá primero cada mano sola, después juntas y lento. La velocidad viene sola."),
    ],
    quiz: [
      Q("En el acompañamiento básico, ¿qué toca la mano izquierda?", "La fundamental del acorde", "La melodía", "Nada", "El acorde completo"),
      Q("¿Cómo conviene practicar con manos juntas?", "Primero cada mano sola, después juntas y lento", "Directo rápido", "Solo la derecha", "Sin mirar la partitura"),
    ],
  },
  "pn.accomp": {
    title: "Patrones de acompañamiento",
    body: [
      P("Con los mismos acordes podés tocar de muchas formas: **en bloque** (todas las notas a la vez), **arpegiado** (una por una) o **rítmico** (repitiendo el acorde en negras o corcheas)."),
      EX({ chords: ["C", "G", "Am", "F"] }, "I – V – vi – IV en bloque: la base de *Let It Be*."),
      P("Para baladas como *Let It Be* funciona muy bien el bloque en negras; para algo más suave, arpegios."),
    ],
    quiz: [
      Q("Tocar un acorde arpegiado es...", "tocar sus notas una por una", "tocarlas todas juntas", "tocar solo la fundamental", "tocarlo más fuerte"),
      Q("¿Qué patrón suena más suave para una balada lenta?", "Arpegios", "Acordes rápidos en corcheas", "Solo bajo", "Silencio"),
    ],
  },
  "pn.ch.dimaug": {
    title: "Disminuidos y aumentados en el piano",
    body: [
      P("**Disminuido**: dos terceras menores (3 + 3 semitonos). **Aumentado**: dos terceras mayores (4 + 4)."),
      EX({ keyboard: "B4 D5 F5", harmonic: true }, "B°: Si-Re-Fa."),
      EX({ keyboard: "C4 E4 G#4", harmonic: true }, "C+: Do-Mi-Sol♯."),
    ],
  },
  "pn.ch.7": {
    title: "Acordes de séptima en el piano",
    body: [
      P("Cuatro notas: necesitás los dedos **1, 2, 3 y 5** o, más común, tocar la fundamental con la izquierda y las otras tres con la derecha."),
      EX({ keyboard: "G4 B4 D5 F5", harmonic: true }, "G7."),
      EX({ keyboard: "C4 E4 G4 B4", harmonic: true }, "Cmaj7."),
      EX({ keyboard: "D4 F4 A4 C5", harmonic: true }, "Dm7."),
    ],
  },
  "pn.ch.sus": {
    title: "Acordes suspendidos en el piano",
    body: [
      P("Movés **un solo dedo**: el de la tercera sube a la cuarta (sus4) o baja a la segunda (sus2)."),
      EX({ keyboard: "D4 G4 A4", harmonic: true }, "Dsus4."),
      EX({ keyboard: "D4 E4 A4", harmonic: true }, "Dsus2."),
      TIP("Probá D → Dsus4 → D: ese movimiento está en cientos de canciones de rock."),
    ],
  },
  "pn.blues": {
    title: "Blues en el piano",
    body: [
      P("Mano izquierda: el **boogie** (fundamental y quinta, después fundamental y sexta, alternando). Mano derecha: la **escala de blues** o los acordes con séptima."),
      EX({ chords: ["C7", "F7", "C7", "G7"] }, "Los cuatro momentos de un blues en Do."),
      TIP("Para el boogie en Do: Do-Sol, Do-La, Do-Sol, Do-La..."),
    ],
    quiz: [
      Q("El boogie de la mano izquierda alterna...", "quinta y sexta sobre la fundamental", "terceras mayores y menores", "octavas", "acordes completos"),
      Q("En un blues en Do, el IV7 es...", "F7", "G7", "C7", "D7"),
    ],
  },
  "pn.voicing": {
    title: "Voicings: acordes que suenan bien",
    body: [
      P("Un **voicing** es cómo distribuís las notas de un acorde. El truco profesional: **la izquierda toca fundamental y séptima**, la **derecha tercera y novena/quinta**."),
      EX({ chords: ["Dm7", "G7", "Cmaj7"] }, "ii – V – I con voicings cercanos."),
      P("Al pasar de un acorde a otro, mové cada voz **lo menos posible**: eso se llama **conducción de voces**."),
    ],
    quiz: [
      Q("¿Qué es la conducción de voces?", "Mover cada nota lo menos posible entre acordes", "Cantar mientras se toca", "Tocar más fuerte la melodía", "Tocar en octavas"),
      Q("En un voicing típico de mano izquierda se tocan...", "fundamental y séptima", "solo la quinta", "todas las notas", "tercera y quinta"),
    ],
  },
};

// SPDX-License-Identifier: GPL-3.0-or-later
// Contenido (es-AR): escalas, tonalidades, armaduras y acordes.
import { type LessonTexts, P, TIP, EX, Q } from "../types";

function keyLesson(fifths: number, name: string, accs: string, scale: string, extra: string): LessonTexts[string] {
  const kind = fifths > 0 ? "sostenidos" : "bemoles";
  const n = Math.abs(fifths);
  return {
    title: `${name} mayor (${n} ${n === 1 ? kind.replace(/es$|s$/, "") : kind})`,
    body: [
      P(`La escala de **${name} mayor** necesita **${accs}** para respetar el patrón T T S T T T S: ${scale}.`),
      EX({ emptyStaff: true, clef: "treble", key: fifths }, `Armadura de ${name} mayor.`),
      P(`En vez de escribir esas alteraciones en cada nota, se ponen **una sola vez** al principio de cada renglón: es la **[[ks.1|armadura]]**. Valen para **todas** las notas de ese nombre, en cualquier octava.`),
      TIP(extra),
    ],
    quiz: [
      Q(`¿Cuántos ${kind} tiene la armadura de ${name} mayor?`, String(n), String(n + 1), String(Math.max(0, n - 1)), String(n + 2)),
    ],
  };
}

export const TRUNK3: LessonTexts = {
  "sc.major": {
    title: "La escala mayor",
    body: [
      P("Una **[[sc.major|escala]]** es una serie de notas ordenadas que suben (o bajan) de a pasos. La más importante es la **escala mayor**. La de **Do mayor** son las teclas blancas de Do a Do."),
      EX({ notes: "C4 D4 E4 F4 G4 A4 B4 C5", clef: "treble", labels: true }, "Escala de Do mayor."),
      P("Su secreto está en las distancias: **T T S T T T S** (tono, tono, semitono, tono, tono, tono, semitono). Cualquier escala que respete ese patrón suena \"mayor\", empiece donde empiece."),
      P("A cada nota de la escala se le dice **grado**: Do es el 1º, Re el 2º... hasta Si, el 7º."),
      TIP("Cantá Do-Re-Mi-Fa-Sol-La-Si-Do: esa sensación de \"llegar a casa\" al final es la escala mayor."),
    ],
    quiz: [
      Q("¿Cuál es el patrón de la escala mayor?", "T T S T T T S", "T S T T S T T", "T T T S T T S", "S T T T S T T"),
      Q("¿Entre qué grados de la escala mayor hay semitonos?", "3º-4º y 7º-8º", "1º-2º y 5º-6º", "2º-3º y 6º-7º", "Entre todos"),
    ],
  },
  "t.key": {
    title: "Tonalidad y tónica",
    body: [
      P("Cuando una canción usa las notas de una escala mayor y siente que su \"casa\" es una nota, decimos que está en esa **[[t.key|tonalidad]]**. La nota casa se llama **[[t.key|tónica]]**."),
      EX({ notes: "E4 D4 C4 D4 E4 E4 E4", clef: "treble" }, "Esta melodía usa notas de Do mayor y descansa en Do: está en Do mayor."),
      P("*Let It Be* está en Do mayor: todo el tema gira alrededor de Do y termina ahí. *Wish You Were Here* está en Sol mayor."),
      TIP("Para encontrar la tónica, cantá la nota en la que la melodía parece \"terminar\" o descansar."),
    ],
    quiz: [
      Q("La tónica es...", "la nota \"casa\" de la tonalidad", "la nota más aguda", "la última nota de la escala", "una nota con sostenido"),
      Q("Una canción en Do mayor usa principalmente...", "las notas de la escala de Do mayor", "solo la nota Do", "teclas negras", "notas al azar"),
    ],
  },
  "ks.1": keyLesson(1, "Sol", "Fa♯", "Sol La Si Do Re Mi **Fa♯** Sol", "Truco: el último sostenido de la armadura está un semitono abajo de la tónica (Fa♯ → Sol)."),
  "ks.-1": keyLesson(-1, "Fa", "Si♭", "Fa Sol La **Si♭** Do Re Mi Fa", "Truco: con un solo bemol, la tonalidad es Fa mayor. Memorizalo."),
  "ks.2": keyLesson(2, "Re", "Fa♯ y Do♯", "Re Mi **Fa♯** Sol La Si **Do♯** Re", "El último sostenido es Do♯: un semitono abajo está Re, la tónica."),
  "ks.-2": keyLesson(-2, "Si♭", "Si♭ y Mi♭", "**Si♭** Do Re **Mi♭** Fa Sol La Si♭", "Truco: con dos o más bemoles, el **anteúltimo** bemol es la tónica (Si♭, Mi♭ → Si♭ mayor)."),
  "ks.3": keyLesson(3, "La", "Fa♯, Do♯ y Sol♯", "La Si **Do♯** Re Mi **Fa♯** **Sol♯** La", "Último sostenido Sol♯ → tónica La."),
  "ks.-3": keyLesson(-3, "Mi♭", "Si♭, Mi♭ y La♭", "**Mi♭** Fa Sol **La♭** **Si♭** Do Re Mi♭", "Anteúltimo bemol: Mi♭ → Mi♭ mayor."),
  "ks.4": keyLesson(4, "Mi", "Fa♯, Do♯, Sol♯ y Re♯", "Mi **Fa♯** **Sol♯** La Si **Do♯** **Re♯** Mi", "Mucho rock de guitarra está en Mi: aprovecha las cuerdas al aire de Mi y La."),
  "ks.-4": keyLesson(-4, "La♭", "Si♭, Mi♭, La♭ y Re♭", "**La♭** **Si♭** Do **Re♭** **Mi♭** Fa Sol La♭", "Anteúltimo bemol: La♭ → La♭ mayor."),
  "ks.far": {
    title: "Armaduras de 5, 6 y 7 alteraciones",
    body: [
      P("Las tonalidades más lejanas usan muchas alteraciones: **Si mayor** (5♯), **Fa♯ mayor** (6♯), **Do♯ mayor** (7♯), **Re♭ mayor** (5♭), **Sol♭ mayor** (6♭) y **Do♭ mayor** (7♭)."),
      EX({ emptyStaff: true, clef: "treble", key: 5 }, "Si mayor: cinco sostenidos."),
      EX({ emptyStaff: true, clef: "treble", key: -5 }, "Re♭ mayor: cinco bemoles."),
      P("Los trucos de siempre funcionan: último sostenido + un semitono = tónica; anteúltimo bemol = tónica."),
      TIP("Fa♯ mayor (6♯) y Sol♭ mayor (6♭) suenan igual: son tonalidades enarmónicas."),
    ],
    quiz: [
      Q("¿Cuántos sostenidos tiene Si mayor?", "5", "4", "6", "2"),
      Q("¿Cuántos bemoles tiene Re♭ mayor?", "5", "3", "6", "4"),
    ],
  },
  "t.circle5": {
    title: "El círculo de quintas",
    body: [
      P("Si ordenás las tonalidades subiendo de a **quintas justas** (Do → Sol → Re → La → Mi...), cada una tiene **un sostenido más**. Bajando de a quintas (Do → Fa → Si♭ → Mi♭...), cada una suma **un bemol**. Ese ciclo se llama **[[t.circle5|círculo de quintas]]**."),
      P("El orden de los sostenidos es **Fa Do Sol Re La Mi Si**; el de los bemoles, al revés: **Si Mi La Re Sol Do Fa**."),
      EX({ emptyStaff: true, clef: "treble", key: 4 }, "Mi mayor: Fa♯ Do♯ Sol♯ Re♯, siempre en ese orden."),
      TIP("Las tonalidades vecinas en el círculo comparten casi todas sus notas: por eso es fácil pasar de una a otra."),
    ],
    quiz: [
      Q("¿Cuál es el orden de los sostenidos?", "Fa Do Sol Re La Mi Si", "Do Re Mi Fa Sol La Si", "Si Mi La Re Sol Do Fa", "Sol Re La Mi Si Fa Do"),
      Q("Subiendo una quinta desde Re mayor llegás a...", "La mayor (3♯)", "Sol mayor (1♯)", "Mi mayor (4♯)", "Fa mayor (1♭)"),
      Q("¿Cuál es el primer bemol que aparece en una armadura?", "Si♭", "Fa♭", "Mi♭", "La♭"),
    ],
  },
  "sc.minor": {
    title: "La escala menor natural",
    body: [
      P("La **escala menor natural** tiene otro patrón: **T S T T S T T**. Suena más oscura, melancólica. La de **La menor** son las teclas blancas de La a La."),
      EX({ notes: "A4 B4 C5 D5 E5 F5 G5", clef: "treble", labels: true }, "Escala de La menor natural."),
      P("La diferencia clave con la mayor está en la **tercera**: en menor, el 3er grado está a una tercera menor de la tónica."),
      TIP("*Stairway to Heaven* está en La menor."),
    ],
    quiz: [
      Q("¿Cuál es el patrón de la escala menor natural?", "T S T T S T T", "T T S T T T S", "T T T S T T S", "S T T S T T T"),
      Q("La escala de La menor natural usa...", "solo teclas blancas", "un sostenido", "un bemol", "todas teclas negras"),
    ],
  },
  "t.relative": {
    title: "Tonalidades relativas",
    body: [
      P("Do mayor y La menor usan **exactamente las mismas notas** y la misma armadura (sin alteraciones). Son tonalidades **[[t.relative|relativas]]**."),
      P("La relativa menor está **una tercera menor abajo** de la mayor: Sol mayor ↔ Mi menor (1♯), Fa mayor ↔ Re menor (1♭)."),
      EX({ emptyStaff: true, clef: "treble", key: 1 }, "Una armadura, dos tonalidades posibles: Sol mayor o Mi menor."),
      TIP("Para saber cuál de las dos es, fijate en qué nota descansa la melodía, sobre todo al final."),
    ],
    quiz: [
      Q("¿Cuál es la relativa menor de Do mayor?", "La menor", "Do menor", "Mi menor", "Re menor"),
      Q("¿Cuál es la relativa mayor de Mi menor?", "Sol mayor", "Mi mayor", "Do mayor", "La mayor"),
    ],
  },
  "sc.harmonicMinor": {
    title: "La escala menor armónica",
    body: [
      P("La **menor armónica** es la menor natural con el **7º grado subido** un semitono. En Re menor: Re Mi Fa Sol La Si♭ **Do♯** Re."),
      EX({ notes: "D4 E4 F4 G4 A4 Bb4 C#5 D5", clef: "treble", labels: true }, "Re menor armónica."),
      P("Ese salto entre Si♭ y Do♯ (un tono y medio) le da un color \"árabe\" o \"español\", muy usado en el metal neoclásico."),
    ],
    quiz: [Q("¿Qué cambia la menor armónica respecto de la natural?", "Sube el 7º grado", "Baja el 3er grado", "Sube el 3er grado", "Saca el 7º grado")],
  },
  "sc.melodicMinor": {
    title: "La escala menor melódica",
    body: [
      P("La **menor melódica** sube el **6º y el 7º** grados. En Re menor: Re Mi Fa Sol La **Si Do♯** Re. Así se suaviza el salto de la armónica."),
      EX({ notes: "D4 E4 F4 G4 A4 B4 C#5 D5", clef: "treble", labels: true }, "Re menor melódica (subiendo)."),
      TIP("En la música clásica, al bajar se vuelve a la menor natural; en el jazz se usa igual para los dos lados."),
    ],
    quiz: [Q("¿Qué grados sube la menor melódica?", "El 6º y el 7º", "Solo el 7º", "El 3º y el 7º", "El 2º y el 6º")],
  },

  // ---------------- Acordes ----------------
  "ch.maj": {
    title: "El acorde mayor",
    body: [
      P("Un **[[ch.maj|acorde]]** son tres o más notas que suenan a la vez. El más básico es la **[[ch.maj|tríada]] mayor**: una nota (la **fundamental**), su **tercera mayor** y su **quinta justa**."),
      EX({ notes: "[C4 E4 G4] [F4 A4 C5] [G4 B4 D5]", clef: "treble" }, "Do mayor (Do-Mi-Sol), Fa mayor (Fa-La-Do) y Sol mayor (Sol-Si-Re)."),
      P("En las canciones se escribe con el nombre de la fundamental en letra: **C** = Do mayor, **F** = Fa mayor, **G** = Sol mayor. A esa forma de escribir acordes se le dice **[[ch.maj|cifrado]]**."),
      EX({ chords: ["C", "F", "G", "C"] }, "C – F – G – C."),
      TIP("Truco: un acorde mayor salteando notas de la escala: Do-(Re)-Mi-(Fa)-Sol."),
    ],
    quiz: [
      Q("¿Qué notas forman el acorde de Do mayor?", "Do Mi Sol", "Do Re Mi", "Do Fa La", "Do Mi♭ Sol"),
      Q("Una tríada mayor tiene...", "fundamental, 3ª mayor y 5ª justa", "fundamental, 3ª menor y 5ª justa", "fundamental y 5ª", "cuatro notas"),
    ],
  },
  "t.cifrado": {
    title: "Cifrado americano y latino",
    body: [
      P("Hay dos formas de escribir acordes: el **cifrado americano** usa letras (**C D E F G A B**) y el **latino** usa los nombres (**Do Re Mi Fa Sol La Si**)."),
      EX({ chords: ["G", "D", "C"] }, "G – D – C = Sol – Re – Do."),
      P("En Argentina vas a ver los dos: el americano en casi todos los cancioneros de internet, el latino en muchos libros. Podés elegir cuál ver en Ajustes."),
    ],
    quiz: [
      Q("¿Cómo se escribe Sol mayor en cifrado americano?", "G", "S", "Sol", "D"),
      Q("¿Qué acorde es A en cifrado latino?", "La", "Re", "Do", "Mi"),
    ],
  },
  "ch.min": {
    title: "El acorde menor",
    body: [
      P("La **tríada menor** cambia una sola cosa: la tercera es **menor**. Fundamental + 3ª menor + 5ª justa. La menor = La-Do-Mi."),
      EX({ notes: "[A4 C5 E5] [D4 F4 A4] [E4 G4 B4]", clef: "treble" }, "La menor, Re menor y Mi menor."),
      P("En cifrado se agrega una **m** minúscula: **Am** (Lam), **Dm** (Rem), **Em** (Mim)."),
      EX({ chords: ["C", "Am", "C", "Am"] }, "Mayor y menor: escuchá el cambio de color."),
      TIP("Mayor suena luminoso, menor suena melancólico. Es la primera diferencia que el oído aprende."),
    ],
  },
  "ch.dim": {
    title: "El acorde disminuido",
    body: [
      P("El **acorde disminuido** apila dos terceras menores: fundamental + 3ª menor + **5ª disminuida**. Si disminuido = Si-Re-Fa."),
      EX({ notes: "[B4 D5 F5]", clef: "treble" }, "Si disminuido."),
      P("Se escribe **dim** o **°**: B° o Bdim. Suena tenso, inestable; pide resolver en otro acorde."),
    ],
  },
  "ch.aug": {
    title: "El acorde aumentado",
    body: [
      P("El **acorde aumentado** apila dos terceras mayores: fundamental + 3ª mayor + **5ª aumentada**. Do aumentado = Do-Mi-Sol♯."),
      EX({ notes: "[C4 E4 G#4]", clef: "treble" }, "Do aumentado."),
      P("Se escribe **aug** o **+**: C+ o Caug. Suena misterioso, como de sueño o de suspenso."),
    ],
  },
  "ch.inv": {
    title: "Inversiones de acordes",
    body: [
      P("Las notas de un acorde se pueden ordenar de distintas formas. Lo que cambia la **[[ch.inv|inversión]]** es **qué nota queda abajo** (en el bajo):"),
      EX({ notes: "[C4 E4 G4] [E4 G4 C5] [G4 C5 E5]", clef: "treble" }, "Do mayor en estado fundamental, 1ª inversión y 2ª inversión."),
      P("**Estado fundamental**: la fundamental abajo. **1ª inversión**: la tercera abajo. **2ª inversión**: la quinta abajo."),
      TIP("Las inversiones permiten pasar de un acorde a otro moviendo poco los dedos, y cambian sutilmente el color."),
    ],
  },
  "ch.sus": {
    title: "Acordes suspendidos (sus2 y sus4)",
    body: [
      P("En un acorde **suspendido** la tercera se reemplaza: **sus4** usa la cuarta justa y **sus2** la segunda mayor. Al no tener tercera, no es ni mayor ni menor."),
      EX({ notes: "[D4 G4 A4] [D4 F#4 A4] [D4 E4 A4]", clef: "treble" }, "Dsus4, D y Dsus2."),
      P("Suenan abiertos, \"en el aire\". En el rock es muy común adornar un acorde pasando por sus4 y volviendo."),
    ],
  },
  "ch.5": {
    title: "El power chord (acorde de quinta)",
    body: [
      P("El **[[ch.5|power chord]]** es solo la fundamental y la **quinta justa** (a veces con la octava). Se escribe con un **5**: E5, A5, G5."),
      EX({ notes: "[E4 B4] [G4 D5] [A4 E5]", clef: "treble" }, "E5, G5 y A5."),
      P("Sin tercera, no es mayor ni menor: por eso suena tan bien con distorsión. AC/DC, Metallica y La Renga lo usan todo el tiempo."),
    ],
  },
  "ch.7": {
    title: "El acorde de séptima (dominante)",
    body: [
      P("Al acorde mayor se le puede agregar una **séptima menor**: Sol-Si-Re-**Fa**. Es el **séptima de dominante** y se escribe **G7**."),
      EX({ notes: "[G4 B4 D5 F5]", clef: "treble" }, "G7."),
      EX({ chords: ["G7", "C"] }, "G7 pide resolver en C: escuchá la tensión y el descanso."),
      TIP("Es el sonido del blues y del rock and roll: muchos temas usan solo acordes de séptima."),
    ],
  },
  "ch.maj7": {
    title: "El acorde mayor con séptima mayor (maj7)",
    body: [
      P("Mayor + **séptima mayor**: Do-Mi-Sol-**Si**. Se escribe **Cmaj7** (o **C7M**, Do7M en cifrado latino)."),
      EX({ notes: "[C4 E4 G4 B4]", clef: "treble" }, "Cmaj7."),
      P("Suena suave, soñador, sofisticado. Muy usado en el rock nacional más armónico (Spinetta, Charly) y en la bossa nova."),
    ],
  },
  "ch.m7": {
    title: "El acorde menor con séptima (m7)",
    body: [
      P("Menor + **séptima menor**: La-Do-Mi-**Sol**. Se escribe **Am7** (Lam7)."),
      EX({ notes: "[A4 C5 E5 G5]", clef: "treble" }, "Am7."),
      P("Más suave y \"jazzero\" que el menor solo. Es uno de los acordes más usados en baladas."),
    ],
  },
  "ch.m7b5": {
    title: "El semidisminuido (m7♭5)",
    body: [
      P("Disminuido + **séptima menor**: Mi-Sol-Si♭-**Re**. Se escribe **Em7♭5** o **Eø**."),
      EX({ notes: "[E4 G4 Bb4 D5]", clef: "treble" }, "Em7♭5."),
      P("Aparece en el 7º grado de la escala mayor y es clave en las progresiones menores del jazz."),
    ],
  },
  "ch.dim7": {
    title: "El disminuido con séptima (dim7)",
    body: [
      P("Tres terceras menores apiladas: Do♯-Mi-Sol-**Si♭**. Se escribe **C♯°7** o **C♯dim7**. Todas sus notas están a la misma distancia (3 semitonos)."),
      EX({ notes: "[C#4 E4 G4 Bb4]", clef: "treble" }, "C♯°7."),
      TIP("Es el acorde de las películas de terror antiguas: simétrico, tenso y ambiguo."),
    ],
  },
  "ch.6": {
    title: "Acordes con sexta (6 y m6)",
    body: [
      P("A una tríada se le puede agregar la **sexta mayor**: Do-Mi-Sol-**La** = **C6**. En menor: La-Do-Mi-**Fa♯** = **Am6**."),
      EX({ notes: "[C4 E4 G4 A4] [A4 C5 E5 F#5]", clef: "treble" }, "C6 y Am6."),
      P("C6 tiene un sabor retro, de rock and roll de los 50 y de los Beatles."),
    ],
  },
  "ch.add9": {
    title: "Acordes add9",
    body: [
      P("**add9** agrega la **novena** (la segunda una octava arriba) a una tríada, sin séptima: Do-Mi-Sol-**Re** = **Cadd9**."),
      EX({ notes: "[C4 E4 G4 D5]", clef: "treble" }, "Cadd9."),
      P("Suena brillante y moderno; es un clásico de la guitarra acústica en el pop-rock."),
    ],
  },
  "ch.ext": {
    title: "Extensiones: 9, 11 y 13",
    body: [
      P("Sobre un acorde de séptima podés seguir apilando terceras: la **novena (9)**, la **oncena (11)** y la **trecena (13)**. C9 = Do-Mi-Sol-Si♭-**Re**."),
      EX({ notes: "[C4 E4 G4 Bb4 D5]", clef: "treble" }, "C9."),
      P("En la práctica no se tocan todas las notas: se suele omitir la quinta (y a veces la fundamental, que la toca el bajo)."),
      TIP("7♭9 y 7♯9 alteran la novena: el 7♯9 es el famoso \"acorde de Hendrix\" de *Purple Haze*."),
    ],
  },
  "ch.slash": {
    title: "Acordes con bajo (slash chords)",
    body: [
      P("**G/B** se lee \"Sol con bajo en Si\": el acorde de G con la nota Si en el bajo. La barra indica **qué nota va abajo**."),
      EX({ chords: ["C", "G/B", "Am"] }, "C – G/B – Am: el bajo baja Do–Si–La, muy prolijo."),
      P("Sirve para escribir inversiones (G/B es la 1ª inversión de G) o bajos que no son del acorde (C/D)."),
    ],
    quiz: [
      Q("¿Qué significa D/F♯?", "Acorde de D con Fa♯ en el bajo", "Acorde de D y después F♯", "D menor", "D con séptima"),
      Q("C/E es...", "Do mayor en 1ª inversión", "Do mayor en estado fundamental", "Mi menor", "Do mayor en 2ª inversión"),
      Q("En G/B, ¿qué nota toca el bajo?", "Si", "Sol", "Re", "La"),
    ],
  },
};

// SPDX-License-Identifier: GPL-3.0-or-later
// Contenido (es-AR): rama de guitarra.
import { type LessonTexts, P, TIP, EX, Q } from "../types";

const STR_NAMES: Record<number, string> = { 1: "1ª", 2: "2ª", 3: "3ª", 4: "4ª", 5: "5ª", 6: "6ª" };

function openString(n: number, name: string, desc: string, tip: string): LessonTexts[string] {
  return {
    title: `${STR_NAMES[n]} cuerda: ${name}`,
    body: [
      P(`La **${STR_NAMES[n]} cuerda** ${desc} Al aire (sin apretar nada) suena **${name}**.`),
      EX({ frets: `${n}:0` }, `${STR_NAMES[n]} cuerda al aire: ${name}.`),
      TIP(tip),
    ],
  };
}

function fretNote(s: number, f: number, name: string, tip: string): LessonTexts[string] {
  return {
    title: `${name} en la ${STR_NAMES[s]} cuerda`,
    body: [
      P(`Apretando la **${STR_NAMES[s]} cuerda** en el **traste ${f}** suena **${name}**. Usá el dedo ${f} de la mano izquierda (1 = índice).`),
      EX({ frets: `${s}:${f}` }, `${STR_NAMES[s]} cuerda, traste ${f}: ${name}.`),
      EX({ tab: `${s}:${f}` }, "En tablatura se escribe así: el número es el traste, la línea es la cuerda."),
      TIP(tip),
    ],
  };
}

function chord(id: string, name: string, how: string, tip: string, extra?: string): LessonTexts[string] {
  const body = [
    P(`**${name}** (${id}): ${how}`),
    EX({ diagram: id }, `Diagrama de ${id}. Los números son los dedos; la \"x\" es una cuerda que no se toca y el \"o\", cuerda al aire.`),
    TIP(tip),
  ];
  if (extra) body.splice(2, 0, P(extra));
  return { title: `Acorde de ${name}`, body };
}

function movable(id: string, title: string, how: string, diagramFret: number, tip: string): LessonTexts[string] {
  return {
    title,
    body: [
      P(how),
      EX({ diagram: `mv:${id}@${diagramFret}` }, "Forma móvil: se puede correr por todo el mástil."),
      TIP(tip),
    ],
  };
}

export const GUITAR: LessonTexts = {
  "gt.parts": {
    title: "Conocé la guitarra",
    body: [
      P("La guitarra tiene **6 cuerdas**. Se numeran desde la más **fina** (la 1ª, la más aguda, la que queda abajo cuando la tenés en brazos) hasta la más **gruesa** (la 6ª, la más grave)."),
      P("El mango tiene **[[gt.parts|trastes]]**: las barritas de metal. Apretando una cuerda **justo antes** de un traste, la cuerda se acorta y suena más aguda. Cada traste sube el sonido al siguiente más cercano."),
      P("La parte del mango donde apoyás los dedos se llama **[[gt.parts|diapasón]]**. Los trastes se cuentan desde la cabeza de la guitarra: 1, 2, 3..."),
      TIP("La mano izquierda aprieta las cuerdas (dedos 1 índice, 2 mayor, 3 anular, 4 meñique) y la derecha las toca. Si sos zurdo, al revés: activá el modo zurdo en Ajustes."),
    ],
    quiz: [
      Q("¿Cuál es la 1ª cuerda?", "La más fina y aguda", "La más gruesa y grave", "La del medio", "Cualquiera"),
      Q("¿Cuántas cuerdas tiene la guitarra?", "6", "4", "5", "7"),
      Q("Al apretar una cuerda en un traste más alto, el sonido...", "sube", "baja", "queda igual", "se apaga"),
      Q("¿Qué dedo es el 1 de la mano izquierda?", "El índice", "El pulgar", "El meñique", "El mayor"),
    ],
  },
  "gt.tab": {
    title: "Cómo leer tablatura",
    body: [
      P("La **[[gt.tab|tablatura]]** es la forma más usada de escribir música para guitarra. Tiene **6 líneas**, una por cuerda: la de **arriba es la 1ª** (la más aguda) y la de abajo la 6ª."),
      P("Sobre cada línea se escribe un **número**: el **traste** que hay que apretar. **0** quiere decir cuerda al aire."),
      TIP("Es como mirar el mango desde arriba, con la guitarra apoyada en las piernas."),
    ],
    quiz: [
      Q("En tablatura, la línea de arriba es...", "la 1ª cuerda (la más aguda)", "la 6ª cuerda (la más grave)", "la 3ª cuerda", "la afinación"),
      Q("¿Qué significa un 0 en la tablatura?", "Cuerda al aire", "No tocar", "Silencio", "Traste 10"),
      Q("¿Qué significa un 3 sobre la 2ª línea?", "2ª cuerda, traste 3", "3ª cuerda, traste 2", "Tocar 3 veces", "La tercera vez"),
    ],
  },
  "gt.str.6": openString(6, "Mi", "es la más gruesa.", "Es el **Mi grave**, la base de un montón de riffs de rock."),
  "gt.str.1": openString(1, "Mi", "es la más fina.", "Mi agudo: dos octavas arriba de la 6ª. Las dos cuerdas de las puntas son Mi."),
  "gt.str.5": openString(5, "La", "es la que sigue a la 6ª.", "Truco para recordar las seis cuerdas, de la 6ª a la 1ª: **Mi La Re Sol Si Mi**."),
  "gt.str.4": openString(4, "Re", "está en el medio, del lado grave.", "Mi, La, **Re**... ya vas por la mitad."),
  "gt.str.3": openString(3, "Sol", "está en el medio, del lado agudo.", "Mi, La, Re, **Sol**..."),
  "gt.str.2": openString(2, "Si", "es la segunda más fina.", "Ya tenés las seis: **Mi La Re Sol Si Mi**."),
  "gt.ch.Em": {
    title: "Tu primer acorde: Mi menor (Em)",
    body: [
      P("Un **[[gt.ch.Em|acorde]]** son varias notas que suenan a la vez. Los acordes tienen nombres como **Em** (\"Mi menor\"). A esa forma de nombrarlos se le dice **[[gt.ch.Em|cifrado]]**."),
      P("**Em** es el más fácil: dedo 2 en la 5ª cuerda traste 2, dedo 3 en la 4ª cuerda traste 2. Tocás las **6 cuerdas**."),
      EX({ diagram: "Em" }, "Em. \"o\" = cuerda al aire."),
      P("\"Menor\" es un tipo de acorde que suena más **melancólico**. Escuchalo."),
      TIP("Apretá con la punta de los dedos, bien cerca del traste. Si alguna cuerda suena apagada, arqueá un poco más los dedos."),
    ],
  },
  "gt.ch.E": chord("E", "Mi mayor", "como Em pero agregando el **dedo 1 en la 3ª cuerda, traste 1**. Se tocan las 6 cuerdas.", "Pasá de Em a E y escuchá: con un solo dedo el acorde se vuelve **mayor**, más luminoso.", "\"Mayor\" es el otro gran tipo de acorde: suena alegre, abierto."),
  "gt.pos.1.1": fretNote(1, 1, "Fa", "Mi (al aire) y Fa (traste 1) están pegadas: entre ellas no hay otra nota."),
  "gt.pos.1.3": fretNote(1, 3, "Sol", "Mi, Fa, Sol en la 1ª cuerda: aire, traste 1, traste 3."),
  "gt.ch.Am": chord("Am", "La menor", "dedo 1 en la 2ª cuerda traste 1, dedo 2 en la 4ª traste 2, dedo 3 en la 3ª traste 2. **No toques la 6ª**.", "Es la misma forma que E, un hilo más abajo."),
  "gt.ch.A": chord("A", "La mayor", "dedos 1, 2 y 3 en el traste 2 de las cuerdas 4, 3 y 2. **No toques la 6ª**.", "Los tres dedos quedan apretados en fila: si no entran, inclinalos un poco."),
  "gt.pos.2.1": fretNote(2, 1, "Do", "Si (al aire) y Do (traste 1) están pegadas, como Mi y Fa."),
  "gt.pos.2.3": fretNote(2, 3, "Re", "2ª cuerda: Si, Do, Re → aire, traste 1, traste 3."),
  "gt.strum": {
    title: "Rasguido en negras",
    body: [
      P("Para acompañar una canción, la mano derecha **rasguea** las cuerdas con la púa o los dedos, **hacia abajo**, una vez por **pulso** (en negras)."),
      EX({ rhythm: "q q q q | q q q q", ts: "4/4" }, "Un rasguido por pulso: 1, 2, 3, 4."),
      P("Probá Em durante un compás y A en el siguiente, sin cortar el pulso. Si tardás en cambiar, no frenes: tocá las cuerdas al aire hasta llegar."),
      TIP("Mové el brazo desde el codo, relajado, como sacudiendo agua de la mano."),
    ],
    quiz: [
      Q("En un rasguido en negras de 4/4, ¿cuántos rasguidos hay por compás?", "4", "8", "2", "1"),
      Q("Si no llegás a cambiar de acorde a tiempo...", "no frenes el pulso", "pará y empezá de nuevo", "tocá más rápido", "saltá el compás"),
    ],
  },
  "gt.ch.D": chord("D", "Re mayor", "dedo 1 en la 3ª cuerda traste 2, dedo 2 en la 1ª traste 2, dedo 3 en la 2ª traste 3. Tocá solo las **4 cuerdas agudas**.", "Forma de triángulo. Es el acorde de cientos de temas de folk y rock."),
  "gt.pos.3.2": fretNote(3, 2, "La", "3ª cuerda: Sol al aire, La en el traste 2."),
  "gt.ch.G": chord("G", "Sol mayor", "dedo 2 en la 6ª traste 3, dedo 1 en la 5ª traste 2, dedo 3 en la 1ª traste 3. Se tocan las 6.", "Abarca todo el mango: es normal que al principio cueste."),
  "gt.pos.4.2": fretNote(4, 2, "Mi", "4ª cuerda: Re al aire, Mi en el traste 2."),
  "gt.pos.4.3": fretNote(4, 3, "Fa", "Re, Mi, Fa: aire, traste 2, traste 3. Mi y Fa están pegadas."),
  "gt.ch.C": chord("C", "Do mayor", "dedo 3 en la 5ª traste 3, dedo 2 en la 4ª traste 2, dedo 1 en la 2ª traste 1. **No toques la 6ª**.", "La escalerita: 3-2-1 bajando. Con G, D, Em y C ya podés tocar muchísimas canciones."),
  "gt.pos.5.2": fretNote(5, 2, "Si", "5ª cuerda: La al aire, Si en el traste 2."),
  "gt.pos.5.3": fretNote(5, 3, "Do", "Si y Do están pegadas: traste 2 y traste 3."),
  "gt.ch.Dm": chord("Dm", "Re menor", "dedo 2 en la 3ª traste 2, dedo 3 en la 2ª traste 3, dedo 1 en la 1ª traste 1. Solo las 4 agudas.", "Comparalo con D: cambia la 1ª cuerda y el acorde se vuelve menor."),
  "gt.pos.6.1": fretNote(6, 1, "Fa", "Igual que en la 1ª cuerda: Mi al aire, Fa en el traste 1."),
  "gt.pos.6.3": fretNote(6, 3, "Sol", "6ª cuerda: Mi, Fa, Sol → aire, 1, 3. ¡Ya conocés la primera posición entera!"),
  "gt.change": {
    title: "Cambios de acorde fluidos",
    body: [
      P("El secreto de los cambios rápidos: **dedos ancla** (que no se mueven entre dos acordes) y **dedos guía** (que se deslizan por la misma cuerda)."),
      EX({ diagram: "Am" }, "Am..."),
      EX({ diagram: "C" }, "...y C: los dedos 1 y 2 quedan en el mismo lugar."),
      TIP("Practicá cada cambio de a pares durante un minuto: Am ↔ C, G ↔ D, Em ↔ C."),
    ],
    quiz: [
      Q("Un dedo ancla es...", "un dedo que no se mueve entre dos acordes", "el meñique", "un dedo que aprieta más fuerte", "la púa"),
      Q("Entre Am y C, ¿qué dedos se quedan quietos?", "El 1 y el 2", "El 3 y el 4", "Ninguno", "Todos"),
    ],
  },
  "gt.ch.E7": chord("E7", "Mi séptima", "como E pero levantando el dedo 3: queda la 4ª cuerda al aire.", "El \"7\" le agrega tensión: pide ir a otro acorde. Es el sonido del blues."),
  "gt.ch.A7": chord("A7", "La séptima", "como A pero con la 3ª cuerda al aire.", "Ideal para blues en La: A7, D7, E7."),
  "gt.ch.D7": chord("D7", "Re séptima", "dedo 2 en la 3ª traste 2, dedo 1 en la 2ª traste 1, dedo 3 en la 1ª traste 2.", "Es un D \"al revés\": el triángulo se da vuelta."),
  "gt.ch.G7": chord("G7", "Sol séptima", "como G pero con el dedo 1 en la 1ª cuerda, traste 1.", "G7 pide resolver en C: probá G7 → C."),
  "gt.ch.B7": chord("B7", "Si séptima", "dedo 2 en la 5ª traste 2, dedo 1 en la 4ª traste 1, dedo 3 en la 3ª traste 2, dedo 4 en la 1ª traste 2.", "Es el acorde que lleva a Em: B7 → Em suena muy español."),
  "gt.strum8": {
    title: "Rasguido en corcheas (abajo-arriba)",
    body: [
      P("En corcheas, la mano derecha va **abajo** en cada pulso y **arriba** en cada \"y\": abajo-arriba-abajo-arriba."),
      EX({ rhythm: "8 8 8 8 8 8 8 8", ts: "4/4" }, "1 y 2 y 3 y 4 y: ↓ ↑ ↓ ↑ ↓ ↑ ↓ ↑."),
      P("El patrón más famoso del folk-rock: **↓ ↓↑ ↑↓ ↑** (abajo, abajo-arriba, arriba-abajo-arriba). La mano no deja de moverse: a veces pasa sin tocar."),
      TIP("La mano funciona como un péndulo: siempre baja en los números y sube en las \"y\"."),
    ],
    quiz: [
      Q("En el rasguido en corcheas, la mano va hacia abajo...", "en cada pulso (los números)", "en cada \"y\"", "solo al principio", "nunca"),
      Q("¿Cuántos rasguidos hay en un compás de 4/4 en corcheas?", "8", "4", "16", "6"),
    ],
  },
  "gt.mv.power6": movable("power6", "Power chords en la 6ª cuerda", "Un **[[gt.mv.power6|power chord]]** son dos notas: la fundamental en la **6ª cuerda** (dedo 1) y dos trastes más arriba en la **5ª** (dedo 3). Se nombra con un 5: G5, A5...", 3, "Es la forma del rock con distorsión: AC/DC, Metallica, La Renga. El dedo 1 sobre la 6ª cuerda te dice el nombre."),
  "gt.mv.power5": movable("power5", "Power chords en la 5ª cuerda", "La misma forma, pero con la fundamental en la **5ª cuerda** (dedo 1) y dos trastes más arriba en la **4ª** (dedo 3).", 3, "Combinando 6ª y 5ª cuerda podés tocar casi cualquier riff sin mover la mano: el de *Smoke on the Water* sale así."),
  "gt.palm": {
    title: "Palm mute (apagado con la palma)",
    body: [
      P("Apoyá el costado de la palma derecha **sobre las cuerdas, justo encima del puente**, y tocá: el sonido queda corto y \"chug-chug\". Es el **palm mute**."),
      P("Con power chords en corcheas y palm mute tenés el motor rítmico del metal y del punk."),
      TIP("Si apoyás muy adentro, las cuerdas no suenan; si apoyás muy afuera, no se apagan. Buscá el punto justo."),
    ],
    quiz: [
      Q("¿Dónde se apoya la palma para hacer palm mute?", "Sobre las cuerdas, cerca del puente", "Sobre los trastes", "En la cabeza de la guitarra", "En la boca de la guitarra"),
      Q("¿Cómo suena el palm mute?", "Corto y apagado", "Largo y brillante", "Más agudo", "No suena"),
    ],
  },
  "gt.chromatic": {
    title: "Las notas alteradas de la primera posición",
    body: [
      P("Entre las notas naturales que ya conocés están las alteradas: cada traste sube un **semitono**. En la 6ª cuerda: Mi (0), Fa (1), **Fa♯/Sol♭ (2)**, Sol (3), **Sol♯/La♭ (4)**."),
      EX({ frets: "6:2 6:4 5:1 5:4" }, "Fa♯, Sol♯, La♯ y Do♯ en la 6ª y 5ª cuerdas."),
      TIP("Regla: entre dos naturales que están a un tono (dos trastes) hay una nota alterada en el medio."),
    ],
  },
  "gt.ch.Am7": chord("Am7", "La menor séptima", "como Am pero levantando el dedo 3: la 3ª cuerda queda al aire.", "Más suave que Am; muy usado en baladas."),
  "gt.ch.Em7": chord("Em7", "Mi menor séptima", "dedo 1 en la 5ª traste 2, dedo 2 en la 4ª traste 2, dedo 4 en la 2ª traste 3.", "Un clásico de la guitarra acústica."),
  "gt.ch.Cadd9": chord("Cadd9", "Do con novena", "como C pero con el dedo 3 en la 5ª y el 4 en la 2ª traste 3; la 1ª, también traste 3.", "Pasar de G a Cadd9 casi sin mover la mano es un truco de cientos de canciones acústicas."),
  "gt.ch.Asus4": chord("Asus4", "La con cuarta suspendida", "como A pero con el dedo 4 en la 2ª cuerda traste 3.", "A → Asus4 → A: el adorno más rockero que existe."),
  "gt.ch.Dsus4": chord("Dsus4", "Re con cuarta suspendida", "como D pero con el dedo 4 en la 1ª cuerda traste 3.", "D → Dsus4 → D: probalo y vas a reconocer decenas de temas."),
  "gt.ch.Fmaj7": chord("Fmaj7", "Fa mayor séptima", "dedo 3 en la 4ª traste 3, dedo 2 en la 3ª traste 2, dedo 1 en la 2ª traste 1; 1ª al aire.", "Un \"Fa fácil\" que suena soñador."),
  "gt.mv.E": movable("E", "La cejilla: forma de Mi", "Con el **dedo 1 acostado** sobre todas las cuerdas (la **[[gt.mv.E|cejilla]]**) y la forma de E con los otros dedos, armás un acorde mayor **en cualquier traste**. En el traste 1 es **F**; en el 3, **G**; en el 5, **A**.", 1, "La cejilla cuesta a todo el mundo. Apretá con el costado del índice, no con la yema, y acercá el codo al cuerpo."),
  "gt.mv.Em": movable("Em", "Cejilla forma de Mi menor", "Igual que la cejilla mayor pero levantando el dedo de la 3ª cuerda: acorde **menor**. Traste 1 = Fm, traste 2 = F♯m, traste 5 = Am.", 2, "La nota de la 6ª cuerda te da el nombre del acorde."),
  "gt.mv.A": movable("A", "Cejilla forma de La", "Cejilla en la **5ª cuerda** y forma de A: acorde mayor con la fundamental en la 5ª cuerda. Traste 2 = B, traste 3 = C.", 2, "Muchos guitarristas usan solo el dedo 3 acostado para las tres cuerdas del medio."),
  "gt.mv.Am": movable("Am", "Cejilla forma de La menor", "Cejilla en la 5ª cuerda con forma de Am: acorde menor. Traste 2 = Bm, traste 5 = Dm.", 2, "Bm con cejilla es la llave de muchísimas canciones en Re y en Sol."),
  "gt.mv.E7": movable("E7", "Cejilla forma de Mi séptima", "La forma de E7 con cejilla: acordes de séptima con la fundamental en la 6ª cuerda.", 1, "Traste 5 = A7, traste 7 = B7: ideal para blues."),
  "gt.mv.A7": movable("A7", "Cejilla forma de La séptima", "Forma de A7 con cejilla en la 5ª cuerda: séptimas con la fundamental en la 5ª.", 2, "Traste 3 = C7, traste 5 = D7."),
  "gt.mv.Em7": movable("Em7", "Cejilla forma de Mi menor séptima", "Forma de Em7 con cejilla: menores con séptima desde la 6ª cuerda.", 5, "Traste 5 = Am7. Suena muy funk tocado corto."),
  "gt.mv.Am7": movable("Am7", "Cejilla forma de La menor séptima", "Forma de Am7 con cejilla: menores con séptima desde la 5ª cuerda.", 5, "Traste 5 = Dm7. Con estas formas ya podés tocar un ii–V–I."),
  "gt.zone.5": {
    title: "Las notas entre los trastes 5 y 9",
    body: [
      P("Más arriba del mango se repiten las notas. Un truco: el **traste 5** de cada cuerda suena igual que la **cuerda siguiente al aire** (salvo la 3ª, que es en el traste 4). Así se afina la guitarra."),
      EX({ frets: "6:5 5:5 4:5" }, "6ª traste 5 = La, 5ª traste 5 = Re, 4ª traste 5 = Sol."),
      TIP("Los puntitos del mango (trastes 3, 5, 7, 9, 12) son tus marcas de referencia."),
    ],
  },
  "gt.zone.10": {
    title: "Del traste 10 en adelante",
    body: [
      P("En el **traste 12** todo vuelve a empezar: cada cuerda suena **una octava más aguda** que al aire. Del 12 para arriba, es la primera posición repetida."),
      EX({ frets: "6:12 1:12" }, "Traste 12: Mi una octava arriba."),
    ],
  },
  "gt.pent": {
    title: "La pentatónica menor en el mástil",
    body: [
      P("La **caja** de la pentatónica menor es la forma más famosa de la guitarra rock. En La menor arranca en el **traste 5**: dos notas por cuerda, todas dentro de 4 trastes."),
      EX({ frets: "6:5 6:8 5:5 5:7 4:5 4:7 3:5 3:7 2:5 2:8 1:5 1:8" }, "Pentatónica de La menor, primera caja."),
      TIP("Corrés la caja entera y cambiás de tonalidad: traste 3 = Sol menor, traste 12 = Mi menor."),
    ],
  },
  "gt.legato": {
    title: "Ligados: hammer-on y pull-off",
    body: [
      P("**Hammer-on**: tocás una nota y \"martillás\" otra más aguda en la misma cuerda sin volver a pulsar. **Pull-off**: al revés, sacás el dedo tirando un poquito de la cuerda para que suene la nota más grave."),
      P("En tablatura se escriben con **h** y **p**: 5h7 = traste 5 y hammer-on al 7."),
      TIP("Son la base de los solos fluidos: probalos dentro de la caja pentatónica."),
    ],
    quiz: [
      Q("¿Qué es un hammer-on?", "Hacer sonar una nota más aguda martillando sin pulsar de nuevo", "Tocar muy fuerte", "Apagar la cuerda", "Tocar con la púa hacia arriba"),
      Q("En tablatura, 7p5 significa...", "pull-off del traste 7 al 5", "tocar el 7 y el 5 juntos", "hammer-on del 7 al 5", "traste 75"),
    ],
  },
  "gt.bend": {
    title: "Bends y vibrato",
    body: [
      P("En un **bend** empujás la cuerda hacia arriba (o abajo) mientras suena, para que la nota **suba**: medio tono o un tono entero. El **vibrato** es oscilarla rápido."),
      P("Es la voz de la guitarra: Gilmour en *Comfortably Numb* y Pappo en cualquier blues."),
      TIP("Usá varios dedos juntos para empujar y chequeá con el oído que llegás a la nota justa."),
    ],
    quiz: [
      Q("Un bend hace que la nota...", "suba", "baje", "se apague", "suene más fuerte"),
      Q("Un bend de un tono sube...", "un tono (dos trastes)", "un traste", "una octava", "nada"),
    ],
  },
  "gt.caged": {
    title: "El sistema CAGED",
    body: [
      P("Las formas abiertas **C, A, G, E y D** se pueden convertir en formas móviles. Encadenadas, cubren todo el mástil para **un mismo acorde**: es el sistema **CAGED**."),
      P("Por ejemplo, Do mayor: forma de C en el traste 0, forma de A en el 3, de G en el 5, de E en el 8, de D en el 10."),
      TIP("Cada forma tiene su fundamental en una cuerda distinta: aprendé a ubicarla y vas a encontrar cualquier acorde en cualquier lugar."),
    ],
    quiz: [
      Q("¿Qué formas forman el sistema CAGED?", "C, A, G, E y D", "A, B, C, D y E", "Las cejillas", "Solo E y A"),
      Q("¿Para qué sirve el sistema CAGED?", "Para tocar el mismo acorde en todo el mástil", "Para afinar", "Para leer partitura", "Para el ritmo"),
    ],
  },
  "gt.slash": {
    title: "Acordes con bajo en la guitarra",
    body: [
      P("Un acorde como **G/B** se toca armando G pero con **Si** como nota más grave. En guitarra: dedo 1 en la 5ª cuerda traste 2 (Si) y no tocás la 6ª."),
      P("Las líneas de bajo que bajan (C – G/B – Am) se escuchan en un montón de baladas."),
    ],
    quiz: [
      Q("En G/B, ¿cuál tiene que ser la nota más grave?", "Si", "Sol", "Re", "Mi"),
      Q("¿Qué hacés con la 6ª cuerda en G/B?", "No la tocás", "La tocás al aire", "La apretás en el 3", "La afinás más grave"),
    ],
  },
};

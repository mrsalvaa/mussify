# Auditoría de la curva de aprendizaje (0.5.0 → 0.5.1)

Ajuste chico y conservador del tronco (*Teoría y oído*) y de qué ejercicios habilita cada lección. No cambia ningún id existente, ni el formato de los datos guardados, ni la lógica de progresión.

Datos: sesiones generadas con 8 semillas por lección (tipos de ejercicio, preguntas distintas, longitud). Numeración = posición en el tronco (1 = `t.sound`).

## 1. Oído avanzado demasiado temprano

| Lección | Problema | Cambio |
|---|---|---|
| 3 `t.octave` | En la 3ª lección ya hay `octaveSame` ("¿es la misma nota más aguda?", hasta 3 octavas) y `octaveCount`. | Se quitan. La lección queda con `octaveName` (nombrar la octava, teoría), `noteOrder` y `pitchHigher` (comparación simple). |
| 1 `t.sound` | Solo se pregunta "¿cuál es más aguda?". | `pitchHigher` pregunta también "¿cuál es más grave?" (misma comparación simple, en los dos sentidos). |
| 6–17 `read.treble.*`, 39–51 `read.bass.*` | `absNote` (reconocer notas sin referencia) aparece desde la lección 6. | Se quita de todas las lecciones de lectura. En `read.treble.G4` (una sola nota conocida) lo reemplaza `staffPosition` ("¿cuál está más alta?", con sonido), una comparación simple. |
| 52 `ear.melodic`, 55 `acc.sharp`, 56 `acc.flat`, 58 `t.enharmonic` | `absNote` antes de los intervalos. | Se quita. |
| — | No hay ningún paso con **referencia sonora** entre los intervalos y el reconocimiento sin referencia. | **Lección puente nueva `ear.reference`** ("Notas con una referencia"), justo después de `iv.inversion` (fin de intervalos). Enfoque propio: se oye un Do que se nombra y después otra nota; se la identifica usando los intervalos. Ejercicios: `absNote` con referencia (2 opciones, notas lejanas), `octaveSame` limitado a 1 octava y `octaveCount`. |
| 75+ | Reconocer notas **sin** referencia. | Vuelve después de la puente y se amplía de a poco con un nivel fijo por lección: nivel 1 (Do o Sol, 2 opciones) en `sc.major` y `t.key`; nivel 2 (Do Mi Sol La, 3 opciones) en `ks.1`, `ks.-1`, `ks.2`, `ks.-2`; nivel 3 (las 7 naturales, 4 opciones) en `ks.3` … `ks.-4`, `sc.minor`, `sc.harmonicMinor`, `sc.melodicMinor`; nivel 4 (con alteraciones, en cualquier octava) en las lecciones de acordes con oído (`ch.min` … `ch.m7b5`). Peso bajo (≈1 pregunta por sesión), para no cargar esas lecciones. |

## 2. Saltos y desbalances

| Lección | Motivo | Cambio |
|---|---|---|
| 24 `ts.4/4` | La primera lección de compás trae tres actividades nuevas a la vez, incluido el primer dictado rítmico (`rhythmDictation`). La anterior (`t.measure`) es solo teoría. | Se quita `rhythmDictation` de `ts.4/4`: el dictado empieza en `ts.3/4`. |
| 85 `ks.far` | Seis armaduras nuevas de golpe (5, 6 y 7 alteraciones) cuando antes era una por lección. El círculo de quintas, que es la herramienta para deducirlas, viene **después**. | **Reordenar**: `t.circle5` pasa antes de `ks.far`. El texto del círculo solo usa armaduras de hasta 4 alteraciones, así que no depende de `ks.far`. |
| 52 `ear.melodic` | Primer dictado melódico: sin `absNote` queda una sola actividad, con peso 3. | Se suma `hearNote` (relacionar el sonido con la nota escrita) como paso intermedio. |
| 6 `read.treble.G4` | Ver punto 1: sin `absNote` solo quedaban 3 preguntas distintas. | `staffPosition` (comparar alturas en el pentagrama, con sonido). |

## 3. Un concepto por lección

Se mantiene. La puente `ear.reference` introduce un único concepto (identificar una nota a partir de una referencia) y no cambia el lugar de ninguna otra lección, salvo `t.circle5` ↔ `ks.far`.

## 4. Lecciones repetitivas (misma actividad, distinto material)

Series consecutivas que hoy habilitan exactamente los mismos ejercicios con los mismos pesos, y el cambio. **Solo** cambia qué actividad lidera cada lección (pesos de ejercicios ya habilitados). No cambia el concepto ni el lugar. El ángulo líder rota dentro de la serie:

| Serie | Ángulos que rotan (líder con peso 2, el resto 1) |
|---|---|
| 12 notas de clave de Sol (`read.treble.*`) y 13 de clave de Fa (`read.bass.*`) | leer en el pentagrama (`readNote`) → ubicarla tocando el pentagrama (`placeNote`) → escucharla entre dos sonidos (`hearNote`) → encontrarla entre otras (`findNote`) |
| 10 intervalos `iv.M3` … `iv.TT` | escucharlo (`intervalEar`) → construirlo (`intervalBuild`) → leerlo en el pentagrama (`intervalName`) |
| 8 armaduras `ks.1` … `ks.-4` | leer la armadura (`keySignature`) → decir sus alteraciones (`keyAccidentals`) → completar la escala (`scaleMissing`) |
| Acordes `ch.min`, `ch.dim`, `ch.aug` / `ch.7`, `ch.maj7`, `ch.m7`, `ch.m7b5` | escucharlo (`chordEar`) → escribir sus notas (`chordSpell`) → nombrarlo (`chordName`) |
| Acordes `ch.dim7`, `ch.6`, `ch.add9` (solo tienen oído y escritura) | escucharlo (`chordEar`) ↔ escribirlo (`chordSpell`) |
| 5 modos `mode.*` | escucharlo (`modeIdentify`) ↔ escribirlo (`scaleMissing`) |
| Guitarra: cuerdas `gt.str.*` y notas `gt.pos.*` / bajo: `bs.str.*`, `bs.pos.*` | nombrar la nota en el diapasón (`fretName`) → encontrarla (`fretFind`) → leerla en tablatura (`tabRead`) |
| Guitarra: acordes (`gt.ch.*`, `gt.mv.*`) | leer el diagrama (`chordDiagramName`) → armarlo (`chordShapePlay`) → escucharlo (`guitarChordEar`) |
| Batería: piezas `dr.read.*` con lectura y oído | leer (`drumPieceRead`) ↔ escuchar (`drumPieceEar`) |

En `read.treble.G4` (una sola nota conocida) se suman `staffPosition` y `staffTap` con peso bajo: dos ángulos de comparación y ubicación que evitan rachas del mismo ejercicio cuando se acaban las preguntas distintas.

Dentro de cada lección, el armado de sesiones (0.5.0) ya impide más de dos ejercicios seguidos del mismo tipo cuando hay más de un tipo disponible.

## Lo que dejo como está (y por qué)

- **`h.secdom`, `h.borrowed`, `h.tritone`**: tres lecciones seguidas que solo usan `chordAnalysis`. Para variar el enfoque haría falta otro tipo de ejercicio (por ejemplo escucharlas en una progresión). No estoy seguro de que `progressionEar` cubra esos casos sin cambiar el generador. Propuesta: sumar en el futuro una variante de oído o de "reconocerlo en una canción".
- **Lecciones con un solo tipo de ejercicio** (`t.sound`, `ch.inv`, `ch.ext`, `ear.prog`, `h.cadence`) y **solo cuestionario** (`t.measure`, `t.dynamics`, `clef.bass`, `t.keyboardMap`, `acc.double`, `t.interval`, `ch.slash`, `h.blues12`, `mode.intro`, `ts.odd`, `rh.tuplet`, `rh.ddot`, `rh.poly`, `t.octaveClef`, `clef.alto`, `clef.tenor`): no hay otro generador adecuado sin escribir uno nuevo. Son lecciones livianas, no saltos de dificultad.
- **`iv.P8` muy liviana (4 ejercicios) frente a `iv.P5` (4 tipos, con oído)**: con un solo intervalo conocido no hay más material. El salto es moderado y la lección siguiente (`t.harmonic`) consolida.
- **`ch.min`**: primer acorde con oído (la calidad mayor/menor necesita dos acordes). El oído pesa poco (≈1,6 de 10). Lo dejo.
- **Textos de las series**: no reescribo los textos de cada lección de la serie (ya son propios de cada nota, intervalo o armadura). El cambio de enfoque es en los ejercicios.
- **Usuarios existentes**: la lección nueva `ear.reference` aparece como la próxima del tronco para quien ya pasó los intervalos. No se pierde nada guardado: es una lección más, con id nuevo.

## Tests

Los tests de progresión, contenido, canciones e i18n no se tocan. En `tests/variety.test.ts` (agregado en 0.5.0) hay dos bloques que fijaban **dónde** aparecían los ejercicios que este ajuste mueve a propósito: "las preguntas de octava…" (miraba `t.octave`) y "reconocer notas de oído (progresivo)" (esperaba `absNote` desde `read.treble.G4`). Se actualizan para describir la nueva ubicación y la rampa por niveles. Los tests de no repetición y de variedad de la lección de Sol quedan igual.

## Verificación después de aplicar

Sesiones generadas con 20 semillas por lección:

- La rotación funciona donde hay material: en lectura, intervalos, acordes y modos la actividad líder cambia de una lección a la siguiente, y el resto sigue presente.
- **En las primeras armaduras (`ks.1` … `ks.-3`) y en las cuerdas de guitarra y bajo, la rotación casi no se nota.** Con pocas armaduras o notas conocidas, `keySignature`, `fretName` y `fretFind` tienen pocas preguntas distintas. El armado de sesiones no las repite, así que domina el ejercicio que más variantes tiene (`scaleMissing`, `tabRead`). Lo dejo así: forzarlo exigiría repetir preguntas.
- **Rachas de más de dos ejercicios iguales seguidos**: no aparecen en ninguna de las lecciones tocadas. Siguen apareciendo, como antes de este ajuste, en lecciones con un solo tipo de ejercicio más un cuestionario corto. Cuando se agotan las preguntas distintas, el armado de sesiones (en `engine.ts`) relaja esa regla para completar la sesión: `t.pulse`, `rh.h`, `rest.q`, `t.tempo`, `t.semitone`, `acc.*`, `t.enharmonic`, `iv.inversion`, `sc.major`, `t.key`, `ch.maj`, `t.cifrado`, `h.field`, `h.roman`, `h.prog`, `h.field7`, `h.field.minor`, `h.modulation`, `rh.swing`, `ts.7/8`, `ts.2/2` y varias de piano, guitarra, bajo y batería. **No lo cambio**: hacerlo exige tocar el armado de sesiones del motor (fuera del alcance de este ajuste) o inventar un segundo tipo de actividad para cada una de esas lecciones. Propuesta para más adelante: que el armado termine la sesión antes en lugar de repetir, o sumar una segunda actividad a esas lecciones.

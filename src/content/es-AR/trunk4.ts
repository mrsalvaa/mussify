// SPDX-License-Identifier: GPL-3.0-or-later
// Contenido (es-AR): armonía, pentatónicas, blues, modos, ritmo avanzado y claves.
import { type LessonTexts, P, TIP, EX, Q } from "../types";

function mode(name: string, formula: string, notes: string, color: string, ref: string): LessonTexts[string] {
  return {
    title: `Modo ${name}`,
    body: [
      P(`El **modo ${name}**: ${formula}`),
      EX({ notes, clef: "treble", labels: true }, `Modo ${name}.`),
      P(color),
      TIP(ref),
    ],
  };
}

export const TRUNK4: LessonTexts = {
  // ---------------- Armonía ----------------
  "h.field": {
    title: "El campo armónico",
    body: [
      P("Si armás una tríada sobre **cada nota** de una escala mayor, usando solo notas de esa escala, obtenés siete acordes: el **[[h.field|campo armónico]]**."),
      EX({ chords: ["C", "Dm", "Em", "F", "G", "Am", "Bdim"] }, "Campo armónico de Do mayor: C Dm Em F G Am B°."),
      P("El patrón siempre es el mismo en cualquier tonalidad mayor: **mayor, menor, menor, mayor, mayor, menor, disminuido**."),
      TIP("Casi todas las canciones de rock usan sobre todo acordes del campo armónico de su tonalidad."),
    ],
    quiz: [
      Q("¿Cuál es el patrón de acordes del campo armónico mayor?", "Mayor, menor, menor, mayor, mayor, menor, disminuido", "Mayor, mayor, menor, menor, mayor, menor, disminuido", "Todos mayores", "Menor, mayor, mayor, menor, menor, mayor, aumentado"),
      Q("En Do mayor, ¿qué acorde se arma sobre La?", "Am", "A", "Adim", "A7"),
      Q("En Sol mayor, ¿qué acorde se arma sobre Re?", "D", "Dm", "Ddim", "D+"),
    ],
  },
  "h.roman": {
    title: "Grados con números romanos",
    body: [
      P("Para hablar de acordes sin depender de la tonalidad, se numeran con **números romanos**: **I ii iii IV V vi vii°**. Mayúscula = mayor, minúscula = menor, ° = disminuido."),
      EX({ chords: ["G", "C", "D", "G"] }, "En Sol mayor: I – IV – V – I."),
      P("Así, \"I – V – vi – IV\" describe la misma progresión en Do (C G Am F), en Sol (G D Em C) o en cualquier tonalidad."),
    ],
    quiz: [Q("En Do mayor, ¿qué acorde es el V?", "G", "F", "Am", "Dm")],
  },
  "h.function": {
    title: "Funciones: tónica, subdominante y dominante",
    body: [
      P("Los acordes cumplen **funciones**: **tónica** (T, reposo: I, vi, iii), **[[h.function|subdominante]]** (SD, se aleja: IV, ii) y **dominante** (D, tensión que pide volver: V, vii°)."),
      EX({ chords: ["C", "F", "G", "C"] }, "T – SD – D – T: el viaje básico de la música tonal."),
      P("El V es el acorde de dominante: tiene la sensible (el 7º grado, a un semitono de la tónica), que tira con fuerza hacia el I."),
    ],
    quiz: [
      Q("¿Qué función tiene el V?", "Dominante", "Tónica", "Subdominante", "Ninguna"),
      Q("¿Qué función tiene el IV?", "Subdominante", "Dominante", "Tónica", "Sensible"),
      Q("El vi puede reemplazar al I porque...", "comparte función de tónica", "es dominante", "es disminuido", "tiene la sensible"),
    ],
  },
  "ear.prog": {
    title: "Reconocer progresiones de oído",
    body: [
      P("Vas a escuchar progresiones cortas y decir qué grados son. Empezá ubicando el **I** (el reposo), después el **V** (la tensión) y por último el **IV** (que se siente \"alejándose\")."),
      EX({ chords: ["C", "G", "C"] }, "I – V – I."),
      EX({ chords: ["C", "F", "C"] }, "I – IV – I."),
      TIP("Cantá la nota más grave de cada acorde: Do-Sol-Do o Do-Fa-Do. Esa línea de bajo te da la respuesta."),
    ],
  },
  "h.cadence": {
    title: "Cadencias",
    body: [
      P("Una **[[h.cadence|cadencia]]** es la forma en que termina una frase. Las cuatro básicas:"),
      P("**Auténtica** (V → I): cierre total. **Plagal** (IV → I): cierre suave, el \"amén\". **Semicadencia** (algo → V): queda en suspenso. **Rota** (V → vi): parece que cierra y te engaña."),
      EX({ chords: ["C", "F", "G", "C"] }, "Cadencia auténtica."),
      EX({ chords: ["C", "F", "G", "Am"] }, "Cadencia rota."),
    ],
  },
  "h.prog": {
    title: "Progresiones famosas",
    body: [
      P("Algunas secuencias de acordes se usan en cientos de canciones. **I – V – vi – IV** (C G Am F) es la más famosa del pop-rock: *Let It Be* la usa en su verso."),
      EX({ chords: ["C", "G", "Am", "F"] }, "I – V – vi – IV."),
      P("**I – vi – IV – V** (C Am F G) es la de los 50, la del doo-wop. **I – IV – V** es la base del rock and roll."),
      EX({ chords: ["C", "Am", "F", "G"] }, "I – vi – IV – V."),
    ],
    quiz: [Q("En Sol mayor, I – V – vi – IV es...", "G D Em C", "G C D G", "G Em C D", "G D C Em")],
  },
  "h.field7": {
    title: "El campo armónico con séptimas",
    body: [
      P("Si a cada tríada del campo armónico le sumás la séptima de la escala, obtenés: **Imaj7 – ii7 – iii7 – IVmaj7 – V7 – vi7 – viiø7**."),
      EX({ chords: ["Cmaj7", "Dm7", "Em7", "Fmaj7", "G7", "Am7", "Bm7b5"] }, "En Do mayor."),
      P("Solo el **V** tiene séptima de dominante (7): por eso es el acorde con más tensión."),
    ],
    quiz: [Q("¿Qué grado del campo armónico mayor es un acorde 7 (dominante)?", "El V", "El I", "El IV", "El ii")],
  },
  "h.iiVI": {
    title: "El ii – V – I",
    body: [
      P("La progresión **ii7 – V7 – Imaj7** es el corazón del jazz y de la bossa: Dm7 – G7 – Cmaj7. El ii prepara al V, que resuelve en el I."),
      EX({ chords: ["Dm7", "G7", "Cmaj7"] }, "ii – V – I en Do."),
      TIP("Fijate cómo el bajo se mueve por quintas: Re → Sol → Do."),
    ],
  },
  "h.field.minor": {
    title: "El campo armónico menor",
    body: [
      P("En menor natural el patrón es: **i – ii° – III – iv – v – VI – VII** (Am Bdim C Dm Em F G en La menor)."),
      EX({ chords: ["Am", "Dm", "Em", "Am"] }, "i – iv – v – i: suena modal, sin tensión fuerte."),
      P("Para tener una dominante con fuerza se usa la menor armónica: el v pasa a **V** mayor (E en vez de Em)."),
      EX({ chords: ["Am", "Dm", "E", "Am"] }, "i – iv – V – i: ahora sí, tensión y resolución."),
    ],
    quiz: [
      Q("En La menor natural, ¿qué acorde es el VI?", "F", "Fm", "D", "G"),
      Q("¿Por qué en menor se usa muchas veces un V mayor?", "Para tener sensible y más tensión hacia la tónica", "Porque suena más triste", "Porque el v no existe", "Por la armadura"),
    ],
  },
  "h.secdom": {
    title: "Dominantes secundarias",
    body: [
      P("Podés \"pedir prestado\" el poder del V para llegar a **cualquier** acorde del campo armónico: el **V7 de ese acorde**. En Do, para ir a Dm se usa **A7** (V7/ii)."),
      EX({ chords: ["C", "A7", "Dm", "G7", "C"] }, "C – A7 (V7/ii) – Dm – G7 – C."),
      P("Se llaman **[[h.secdom|dominantes secundarias]]** y aparecen muchísimo en Beatles y en el rock nacional."),
    ],
  },
  "h.borrowed": {
    title: "Intercambio modal (acordes prestados)",
    body: [
      P("En una tonalidad mayor se pueden tomar acordes de la **menor paralela** (misma tónica): en Do mayor, **Fm** (iv), **B♭** (♭VII) o **A♭** (♭VI). Es el **[[h.borrowed|intercambio modal]]**."),
      EX({ chords: ["C", "F", "Fm", "C"] }, "IV – iv: el famoso cambio a menor que da nostalgia."),
      EX({ chords: ["C", "Bb", "F", "C"] }, "♭VII – IV – I: puro rock (Beatles, Stones, AC/DC)."),
    ],
  },
  "h.tritone": {
    title: "Sustitución tritonal",
    body: [
      P("Un acorde 7 se puede reemplazar por otro 7 que está a un **tritono** de distancia: en vez de G7, **D♭7**. Comparten el tritono interno (Si–Fa)."),
      EX({ chords: ["Dm7", "Db7", "Cmaj7"] }, "ii – subV – I: el bajo baja cromático Re–Re♭–Do."),
      P("Es un recurso del jazz que se escucha en la música de Spinetta y de Charly García."),
    ],
  },
  "h.modulation": {
    title: "Modulación",
    body: [
      P("**[[h.modulation|Modular]]** es cambiar de tonalidad dentro de una canción. Lo más común: subir un tono o un semitono para el último estribillo, o pasar a una tonalidad vecina en el círculo de quintas."),
      EX({ chords: ["C", "G", "C", "D7", "G"] }, "De Do mayor a Sol mayor usando D7 (el V de Sol)."),
      P("La forma clásica: usar el V7 de la nueva tonalidad como puente."),
    ],
    quiz: [
      Q("Modular es...", "cambiar de tonalidad", "cambiar de compás", "cambiar de tempo", "cambiar de instrumento"),
      Q("Para modular de Do a Sol, ¿qué acorde funciona como puente?", "D7", "F", "Am", "Bdim"),
    ],
  },
  "h.analysis": {
    title: "Análisis armónico",
    body: [
      P("Analizar es ponerle número romano y función a cada acorde, y detectar lo que **no** es del campo armónico (dominantes secundarias, préstamos, sustitutos)."),
      EX({ chords: ["C", "E7", "Am", "F", "Fm", "C"] }, "I – V7/vi – vi – IV – iv (prestado) – I."),
      P("Con este análisis entendés **por qué** suena como suena una canción y podés tocarla en cualquier tonalidad."),
    ],
    quiz: [
      Q("En Do mayor, E7 es...", "V7/vi (dominante secundaria)", "iii", "un acorde prestado", "el I"),
      Q("En Do mayor, Fm es...", "iv prestado de Do menor", "IV", "V/V", "vii°"),
    ],
  },

  // ---------------- Rock: pentatónicas, blues y modos ----------------
  "sc.pentMinor": {
    title: "La escala pentatónica menor",
    body: [
      P("La **[[sc.pentMinor|pentatónica]] menor** tiene **cinco notas**: la escala menor sin el 2º ni el 6º grado. La menor pentatónica: La Do Re Mi Sol."),
      EX({ notes: "A4 C5 D5 E5 G5", clef: "treble", labels: true }, "La pentatónica menor."),
      P("Es LA escala de los solos de rock: Jimmy Page, Angus Young, Pappo, Gilmour. Casi imposible que suene mal sobre un rock en La."),
    ],
  },
  "sc.pentMajor": {
    title: "La escala pentatónica mayor",
    body: [
      P("La **pentatónica mayor** es la escala mayor sin el 4º ni el 7º grado: Do Re Mi Sol La."),
      EX({ notes: "C4 D4 E4 G4 A4", clef: "treble", labels: true }, "Do pentatónica mayor."),
      P("Suena luminosa, country, folk. Tiene las mismas notas que La pentatónica menor: son relativas."),
    ],
  },
  "sc.blues": {
    title: "La escala de blues",
    body: [
      P("La **escala de blues** es la pentatónica menor con una nota extra: la **quinta disminuida** (la *blue note*). En La: La Do Re **Mi♭** Mi Sol."),
      EX({ notes: "A4 C5 D5 Eb5 E5 G5", clef: "treble", labels: true }, "La blues."),
      P("Esa nota de paso cromática es el sonido de Hendrix, de Pappo y de *Rock and Roll* de Led Zeppelin."),
    ],
  },
  "h.blues12": {
    title: "El blues de 12 compases",
    body: [
      P("La forma más famosa del blues y del rock and roll: **12 compases** con tres acordes (I, IV y V), todos con séptima."),
      P("**I7 I7 I7 I7 | IV7 IV7 I7 I7 | V7 IV7 I7 V7**."),
      EX({ chords: ["A7", "D7", "A7", "E7"] }, "En La: A7 – D7 – A7 – E7, los cuatro momentos clave."),
      TIP("*Rock and Roll* de Led Zeppelin y miles de temas de Pappo usan esta forma."),
    ],
    quiz: [
      Q("¿Cuántos compases tiene la forma de blues clásica?", "12", "8", "16", "4"),
      Q("¿Qué grados usa el blues de 12 compases?", "I, IV y V", "I, ii y V", "I, vi y IV", "Solo I"),
      Q("En un blues en La, ¿qué acorde es el IV7?", "D7", "E7", "A7", "G7"),
    ],
  },
  "mode.intro": {
    title: "Los modos griegos",
    body: [
      P("Si tocás las notas de Do mayor pero tomás **otra nota como tónica**, aparecen nuevos colores: los **[[mode.intro|modos griegos]]**. Desde Do es **jónico** (la escala mayor), desde Re **dórico**, desde Mi **frigio**, desde Fa **lidio**, desde Sol **mixolidio**, desde La **eólico** (la menor natural) y desde Si **locrio**."),
      EX({ notes: "D4 E4 F4 G4 A4 B4 C5 D5", clef: "treble", labels: true }, "Mismas teclas blancas, pero desde Re: modo dórico."),
      P("Cada modo tiene una **nota característica** que lo distingue. Los vas a conocer uno por uno."),
    ],
    quiz: [
      Q("El modo jónico es lo mismo que...", "la escala mayor", "la menor natural", "la pentatónica", "la escala de blues"),
      Q("El modo eólico es lo mismo que...", "la escala menor natural", "la escala mayor", "la menor armónica", "el modo dórico"),
      Q("Si tocás las teclas blancas de Sol a Sol, ¿qué modo es?", "Mixolidio", "Lidio", "Dórico", "Frigio"),
    ],
  },
  "mode.dorian": mode("dórico", "menor con la **6ª mayor**. Re dórico: Re Mi Fa Sol La **Si** Do.", "D4 E4 F4 G4 A4 B4 C5 D5", "Es menor pero no tan oscuro: tiene un toque luminoso y \"cool\".", "Referencia: *Oye como va* (Santana) y muchos solos de Gilmour suenan dóricos."),
  "mode.mixolydian": mode("mixolidio", "mayor con la **7ª menor**. Sol mixolidio: Sol La Si Do Re Mi **Fa**.", "G4 A4 B4 C5 D5 E5 F5 G5", "Es el sonido del rock clásico: mayor pero sin sensible, con la cancha de un acorde 7.", "Referencia: *Norwegian Wood* (Beatles) y un montón de riffs de AC/DC."),
  "mode.phrygian": mode("frigio", "menor con la **2ª menor**. Mi frigio: Mi **Fa** Sol La Si Do Re.", "E4 F4 G4 A4 B4 C5 D5 E5", "Oscuro y \"español\": ese semitono arriba de la tónica es su firma. Muy usado en metal.", "Referencia: muchos riffs de Metallica juegan con Mi–Fa sobre la cuerda grave."),
  "mode.lydian": mode("lidio", "mayor con la **4ª aumentada**. Fa lidio: Fa Sol La **Si** Do Re Mi.", "F4 G4 A4 B4 C5 D5 E5 F5", "Mágico, flotante, de película. El más brillante de los modos.", "Referencia: el tema de *Los Simpson* y muchas bandas de sonido de ciencia ficción."),
  "mode.locrian": mode("locrio", "con **2ª menor y 5ª disminuida**. Mi locrio: Mi **Fa** Sol La **Si♭** Do Re.", "E4 F4 G4 A4 Bb4 C5 D5 E5", "Inestable: su acorde de tónica es disminuido. Se usa poco y casi siempre en metal.", "Es el modo que se arma desde el 7º grado de la escala mayor."),

  // ---------------- Ritmo avanzado ----------------
  "ts.6/8": {
    title: "Compás de 6/8",
    body: [
      P("En **6/8** hay seis corcheas por compás, agrupadas de a **tres**: se siente en **dos pulsos** de negra con puntillo. Es un **compás compuesto**."),
      EX({ rhythm: "8 8 8 8 8 8 | q 8 q 8 | q. q.", ts: "6/8" }, "Contá: UNO-dos-tres, DOS-dos-tres."),
      P("Tiene un balanceo característico: *We Are the Champions* (Queen) y muchas baladas lo usan."),
    ],
    quiz: [
      Q("En 6/8, ¿cuántos pulsos se sienten por compás?", "2", "6", "3", "4"),
      Q("En 6/8, ¿qué figura dura un pulso?", "Negra con puntillo", "Negra", "Corchea", "Blanca"),
    ],
  },
  "rh.triplet": {
    title: "El tresillo",
    body: [
      P("Un **[[rh.triplet|tresillo]]** son **tres** figuras en el lugar de **dos**. Tres corcheas de tresillo ocupan un pulso de negra (en vez de dos corcheas)."),
      EX({ rhythm: "8t 8t 8t 8t 8t 8t q q", ts: "4/4" }, "Dos grupos de tresillos y dos negras."),
      TIP("Contá \"tri-pu-lo, tri-pu-lo\": tres sílabas por pulso."),
    ],
    quiz: [Q("Un tresillo de corcheas ocupa...", "un pulso de negra", "medio pulso", "dos pulsos", "un pulso y medio")],
  },
  "rh.sync": {
    title: "La síncopa",
    body: [
      P("Una **[[rh.sync|síncopa]]** es un acento en un lugar **débil** (por ejemplo, en la \"y\") que se prolonga hacia el tiempo fuerte. Hace que el ritmo \"empuje\"."),
      EX({ rhythm: "8 q 8 q q", ts: "4/4" }, "Corchea – negra – corchea: la negra empieza en la \"y\" del 1."),
      P("Está en todo el funk, el reggae y el rock: el riff de *Back in Black* vive de síncopas."),
    ],
    quiz: [
      Q("Una síncopa es...", "un acento en un tiempo débil que se prolonga", "un silencio largo", "un compás de 3 tiempos", "una nota muy aguda"),
      Q("En corchea–negra–corchea, ¿dónde empieza la negra?", "En la \"y\" del primer pulso", "En el segundo pulso", "En el primer pulso", "En el tercer pulso"),
    ],
  },
  "ts.12/8": {
    title: "Compás de 12/8",
    body: [
      P("**12/8**: doce corcheas en **cuatro grupos de tres**. Se siente como un 4/4 donde cada pulso se divide en tres."),
      EX({ rhythm: "q. q. q. q. | 8 8 8 8 8 8 8 8 8 8 8 8", ts: "12/8" }, "Cuatro pulsos de negra con puntillo."),
      P("Es el compás del blues lento: *Since I've Been Loving You* de Led Zeppelin está en 12/8."),
    ],
    quiz: [Q("¿Cuántos pulsos se sienten en 12/8?", "4", "12", "6", "3")],
  },
  "ts.9/8": {
    title: "Compás de 9/8",
    body: [
      P("**9/8**: nueve corcheas en **tres grupos de tres**. Se siente en tres pulsos de negra con puntillo."),
      EX({ rhythm: "q. q. q. | 8 8 8 8 8 8 8 8 8", ts: "9/8" }, "Tres pulsos compuestos."),
    ],
    quiz: [Q("¿Cuántos pulsos se sienten en 9/8?", "3", "9", "4", "2")],
  },
  "rh.swing": {
    title: "Swing y shuffle",
    body: [
      P("En el **swing** (o **shuffle**) las corcheas no se tocan iguales: la primera dura más que la segunda, como un tresillo de negra + corchea. Se escribe en corcheas normales con la indicación *swing*."),
      EX({ rhythm: "qt 8t qt 8t qt 8t qt 8t", ts: "4/4" }, "Así suena: largo-corto, largo-corto."),
      P("Es el balanceo del blues y del boogie, y de muchos temas de Pappo."),
    ],
    quiz: [
      Q("En swing, dos corcheas suenan...", "largo-corto", "iguales", "corto-largo", "como semicorcheas"),
      Q("¿A qué se parece la división del swing?", "A un tresillo", "A un puntillo doble", "A dos semicorcheas", "A una redonda"),
    ],
  },
  "ts.5/4": {
    title: "Compás de 5/4",
    body: [
      P("**5/4**: cinco negras por compás. Se siente como **3 + 2** (o 2 + 3). Es un **compás irregular**."),
      EX({ rhythm: "q q q q q | q q q h", ts: "5/4" }, "UNO-dos-tres CUA-tro: 3 + 2."),
      P("*Take Five* (Dave Brubeck) es el clásico; en el rock, *Living in the Past* de Jethro Tull."),
    ],
    quiz: [Q("¿Cómo se suele agrupar un 5/4?", "3 + 2 o 2 + 3", "5 + 0", "4 + 1", "Siempre 1 + 1 + 1 + 1 + 1")],
  },
  "ts.7/8": {
    title: "Compás de 7/8",
    body: [
      P("**7/8**: siete corcheas, en grupos como **2 + 2 + 3** o **3 + 2 + 2**. Suena \"cojo\", con un pulso que se adelanta."),
      EX({ rhythm: "8 8 8 8 8 8 8 | q q q.", ts: "7/8" }, "2 + 2 + 3."),
      P("Muy usado en el rock progresivo y en la música de los Balcanes. Spinetta lo usó en varios temas."),
    ],
    quiz: [Q("Una agrupación posible de 7/8 es...", "2 + 2 + 3", "4 + 4", "3 + 3", "2 + 2 + 2")],
  },
  "ts.2/2": {
    title: "Compás de 2/2 (alla breve)",
    body: [
      P("**2/2**: dos pulsos de **blanca** por compás. Se escribe igual que un 4/4 pero se siente en dos. A veces se marca con una C cruzada."),
      EX({ rhythm: "h h | q q q q", ts: "2/2" }, "Dos pulsos de blanca."),
      P("Se usa para música rápida: es más fácil leer dos pulsos largos que cuatro cortos."),
    ],
    quiz: [Q("En 2/2, ¿qué figura dura un pulso?", "La blanca", "La negra", "La redonda", "La corchea")],
  },
  "ts.odd": {
    title: "Otros compases irregulares",
    body: [
      P("Existen muchos más: **7/4**, **11/8**, **13/8**... Siempre se leen agrupando en bloques de 2 y 3."),
      EX({ rhythm: "q q q q q q q", ts: "7/4" }, "7/4: el compás del riff de bajo de *Money* (Pink Floyd)."),
      P("El truco es encontrar la agrupación (por ejemplo 4 + 3) y contar en voz alta."),
    ],
    quiz: [
      Q("*Money* de Pink Floyd está en...", "7/4", "4/4", "6/8", "3/4"),
      Q("Para leer un compás irregular conviene...", "agruparlo en bloques de 2 y 3", "contar todo de corrido", "ignorar el compás", "tocar más rápido"),
    ],
  },
  "rh.tuplet": {
    title: "Grupos irregulares (cinquillos, seisillos)",
    body: [
      P("Igual que el tresillo, existen el **cinquillo** (5 en el lugar de 4), el **seisillo** (6 en el lugar de 4) y otros. Se marcan con un número sobre el grupo."),
      P("Son comunes en solos rápidos de guitarra y en fills de batería."),
    ],
    quiz: [
      Q("Un cinquillo de semicorcheas son...", "5 semicorcheas en el lugar de 4", "5 corcheas en un compás", "5 pulsos", "un compás de 5/4"),
      Q("¿Cómo se indica un grupo irregular?", "Con un número sobre el grupo", "Con un puntillo", "Con una ligadura", "Con una clave"),
    ],
  },
  "rh.ddot": {
    title: "El doble puntillo",
    body: [
      P("Dos puntillos suman la mitad **y** la cuarta parte del valor: blanca con doble puntillo = 2 + 1 + ½ = **3 pulsos y medio**."),
      EX({ rhythm: "h.. 8 | w", ts: "4/4" }, "Blanca con doble puntillo + corchea."),
    ],
    quiz: [
      Q("¿Cuánto dura una negra con doble puntillo?", "1 pulso y tres cuartos", "1 pulso y medio", "2 pulsos", "3 pulsos"),
      Q("¿Cuánto dura una blanca con doble puntillo?", "3 pulsos y medio", "3 pulsos", "4 pulsos", "2 pulsos y medio"),
    ],
  },
  "rh.32": {
    title: "La fusa",
    body: [
      P("La **[[rh.32|fusa]]** tiene tres corchetes (o tres barras). Dura **un octavo de pulso**: ocho fusas en una negra."),
      EX({ rhythm: "32 32 32 32 32 32 32 32 q h", ts: "4/4" }, "Ocho fusas = una negra."),
    ],
    quiz: [Q("¿Cuántas fusas entran en una corchea?", "4", "2", "8", "3")],
  },
  "rh.poly": {
    title: "Polirritmia",
    body: [
      P("Una **polirritmia** son dos divisiones distintas del mismo tiempo sonando juntas. La más común: **3 contra 2** (un tresillo en una mano y dos corcheas en la otra)."),
      P("Frase para practicarla: \"*pa-sa la ma-ma*\" encaja 3 contra 2. En el rock la usan Tool, Meshuggah... y Charly García en sus etapas más experimentales."),
    ],
    quiz: [
      Q("Una polirritmia 3 contra 2 es...", "tres notas contra dos en el mismo tiempo", "un compás de 3/2", "tres compases y dos silencios", "un tresillo solo"),
      Q("¿Qué hace falta para tocar una polirritmia?", "Independencia entre manos o voces", "Tocar más fuerte", "Un compás irregular", "Solo un metrónomo"),
    ],
  },

  // ---------------- Claves y registros ----------------
  "read.treble.high": {
    title: "Notas agudas con líneas adicionales",
    body: [
      P("Arriba de Sol5 el pentagrama se alarga con **líneas adicionales**: **La5** (sobre la 1ª adicional), **Si5** (arriba de ella), **Do6** (sobre la 2ª adicional)."),
      EX({ notes: "G5 A5 B5 C6", clef: "treble", labels: true }, "Sol5, La5, Si5 y Do6."),
      TIP("Contá las líneas adicionales de abajo hacia arriba igual que las del pentagrama."),
    ],
  },
  "read.treble.low": {
    title: "Notas graves en clave de Sol",
    body: [
      P("Debajo del Do central siguen **Si3**, **La3** (sobre su propia línea adicional, la 2ª) y **Sol3**."),
      EX({ notes: "C4 B3 A3 G3", clef: "treble", labels: true }, "Do4, Si3, La3 y Sol3."),
    ],
  },
  "read.bass.high": {
    title: "Notas agudas en clave de Fa",
    body: [
      P("Arriba del Do central, en clave de Fa, siguen **Re4** y **Mi4** (sobre la 2ª línea adicional)."),
      EX({ notes: "C4 D4 E4", clef: "bass", labels: true }, "Do4, Re4 y Mi4 en clave de Fa."),
    ],
  },
  "read.bass.low": {
    title: "Notas graves en clave de Fa",
    body: [
      P("Debajo de Mi2 siguen **Re2** y **Do2** (sobre la 2ª línea adicional). Son notas del registro del bajo eléctrico."),
      EX({ notes: "E2 D2 C2", clef: "bass", labels: true }, "Mi2, Re2 y Do2."),
    ],
  },
  "t.octaveClef": {
    title: "La clave de Sol con 8 (guitarra)",
    body: [
      P("La guitarra suena **una octava más grave** de lo que se escribe. Para indicarlo, se usa una clave de Sol con un **8 chiquito abajo**."),
      P("Lo mismo pasa con el bajo eléctrico en clave de Fa: suena una octava más abajo. Así se evitan montones de líneas adicionales."),
    ],
    quiz: [
      Q("Una clave de Sol con un 8 abajo indica que...", "suena una octava más grave", "suena una octava más aguda", "hay que tocar 8 veces", "es un compás de 8"),
      Q("¿Qué instrumento se escribe así?", "La guitarra", "La batería", "El piano", "La flauta"),
    ],
  },
  "clef.alto": {
    title: "La clave de Do en 3ª (contralto)",
    body: [
      P("La **clave de Do** marca dónde está el **Do central**. En **3ª línea** (clave de contralto) la usa la viola."),
      EX({ notes: "C4 D4 E4 F4 G4", clef: "alto", labels: true }, "Do4 en la línea del medio."),
      P("Leerla es un gran ejercicio mental: todo se corre respecto de las claves que ya conocés."),
    ],
    quiz: [
      Q("En clave de Do en 3ª, ¿qué nota está en la 3ª línea?", "Do4", "Sol4", "Fa3", "La4"),
      Q("¿Qué instrumento usa la clave de Do en 3ª?", "La viola", "El piano", "La guitarra", "La batería"),
    ],
  },
  "clef.tenor": {
    title: "La clave de Do en 4ª (tenor)",
    body: [
      P("En **4ª línea** la clave de Do (clave de tenor) se usa para los pasajes agudos del violonchelo, el fagot y el trombón."),
      EX({ notes: "C4 D4 E4", clef: "tenor", labels: true }, "Do4 en la 4ª línea."),
    ],
    quiz: [
      Q("En clave de Do en 4ª, ¿dónde está Do4?", "En la 4ª línea", "En la 3ª línea", "En la 1ª línea", "Arriba del pentagrama"),
      Q("La clave de Do siempre indica...", "dónde está Do4", "dónde está Sol4", "dónde está Fa3", "el compás"),
    ],
  },
};

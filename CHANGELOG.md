# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versionado [SemVer](https://semver.org/lang/es/).

## [0.6.0] - 2026-10-22

Ajuste de la curva de aprendizaje (detalle en `docs/learning-curve-audit.md`). No cambia ningún id ni el formato de los datos guardados.

### Cambiado
- **El oído avanzado llega más tarde.** "¿Es la misma nota más aguda?" y "¿a cuántas octavas?" salen de la lección de octava (3ª del curso). Reconocer notas sin referencia sale de las lecciones de lectura y de alteraciones. Al inicio solo queda la comparación simple: "¿cuál es más aguda?" y, ahora también, "¿cuál es más grave?".
- **Lección puente nueva, "Notas con una referencia"**, al final de los intervalos: se oye un Do y después otra nota, y se la deduce por el intervalo (dos opciones). Ahí aparecen también las octavas por oído, primero a una octava de distancia.
- **Notas sin referencia, de a poco**, después de la puente: Do o Sol (escala mayor), luego Do Mi Sol La (primeras armaduras), luego las 7 naturales (armaduras de 3–4 alteraciones y escalas menores) y, desde los acordes, con alteraciones en cualquier octava.
- El círculo de quintas va antes de las armaduras de 5, 6 y 7 alteraciones.
- La primera lección de compás (4/4) ya no trae dictado rítmico: empieza en 3/4. El primer dictado melódico suma un paso intermedio (relacionar el sonido con la nota escrita).
- **Menos repetición entre lecciones parecidas**: en las series de notas, intervalos, armaduras, acordes, modos, notas de guitarra y bajo y piezas de batería, cada lección pone adelante otro enfoque (leer, ubicar, escuchar, construir, encontrar…).

## [0.5.0] - 2026-10-22

### Agregado
- **Reconocer notas de oído, sin referencia**, integrado en las lecciones de lectura (no es una lección aparte). Crece con lo aprendido: con una sola nota conocida es "¿esto es Sol?"; con pocas, se elige entre dos notas bien distintas; después entre tres o cuatro, cada vez más cercanas; y cuando ya se conocen las alteraciones, la nota suena en cualquier octava. Las notas que más se fallan aparecen más. También hay una práctica "Notas de oído".
- **Tocar el pentagrama**: ejercicios nuevos donde se toca una línea o un espacio ("Tocá dónde va Sol en clave de Sol", "Tocá la línea 2"). Funcionan con el mouse, el dedo o las flechas + Enter. Si te equivocás, se ve dónde tocaste y dónde iba.
- "¿En qué línea o espacio está esta nota?", otro enfoque para las lecciones de lectura.
- Octavas: "¿a cuántas octavas de distancia?" y "¿qué nota está 2 octavas abajo de Re5?", con notas, registros y distancias de 1 a 3 octavas al azar.

### Cambiado
- **Más variedad en las sesiones**: una pregunta no se repite nunca dos veces seguidas, cada pregunta aparece una sola vez por sesión (dos, solo si no hay material suficiente), no hay más de dos ejercicios seguidos del mismo tipo y no se repiten los mismos sonidos en preguntas cercanas. Vale para lecciones, repasos y prácticas.
- Las preguntas de octava ya no son siempre entre las octavas 4 y 5: varían la nota, el registro y la distancia.
- La lección "Sol en clave de Sol" (la primera nota) ya no son diez veces la misma pregunta: mezcla leer, ubicar en el pentagrama, decir la línea y reconocerla de oído.

### Corregido
- **"Volver" en una lección lleva al temario**, no a la lección anterior.

## [0.4.2] - 2026-10-22

### Agregado
- **Miniaturas en la búsqueda de canciones**: cada resultado muestra la miniatura del video. Primero aparece la lista y las miniaturas se completan enseguida. Las trae el backend desde `i.ytimg.com` (con la dirección armada solo a partir del id del video, con límite de tamaño y de tiempo) y se las pasa a la interfaz como datos, así que la interfaz sigue sin poder conectarse a nada. Respetan el interruptor de red y quedan en el registro de conexiones; el diálogo de confirmación lo avisa.

### Corregido
- El botón de buscar de "Buscar y descargar audio" estaba vacío; ahora dice "Buscar" con su ícono. También se muestra "Buscando…" y "Sin resultados".

## [0.4.1] - 2026-10-22

### Corregido
- **Android: los ajustes y el progreso no se cargaban al abrir la app en frío.** El WebView pedía los datos antes de que el backend terminara de arrancar (el motor de audio tarda), la lectura fallaba y la app arrancaba con los valores por defecto (por ejemplo, en inglés aunque se hubiera elegido español). Ahora esas llamadas se reintentan hasta que el backend está listo, y el progreso nunca se guarda encima si no se pudo leer.
- "Racha de 1 días" → "Racha de 1 día" (y "1-day streak" en inglés).

## [0.4.0] - 2026-10-22

### Agregado
- **Inglés**: toda la interfaz, las 289 lecciones con sus preguntas y las 12 fichas de canciones están en inglés, que pasa a ser el **idioma por defecto**. El español rioplatense sigue disponible en *Settings → Language* (la app se recarga al cambiarlo). Las instalaciones existentes pasan a inglés una sola vez; después se respeta lo que elijas.
- Vocabulario controlado en inglés: los tests verifican, en ambos idiomas, que ningún término técnico aparezca antes de aprenderse.
- README en inglés (`README.md`) y en español (`README.es.md`), cada uno con sus capturas.

### Cambiado
- **Ícono nuevo**: una clave de sol (glifo de Bravura) sobre un pentagrama, en el bordó de la app. Reemplaza al ícono verde anterior en escritorio y Android.
- En inglés, los nombres de notas usan C D E por defecto y los patrones de escala usan W/H (whole/half step).
- Los errores del backend (red, yt-dlp, respaldo, audio) se envían como códigos y se traducen en la interfaz; las secciones del análisis de audio también.
- Fechas formateadas según el idioma elegido.

## [0.3.0] - 2026-10-22

### Agregado
- **Vista de mapa del temario**: además del índice tipo libro, se puede ver cada rama como un mapa de los temas. Cada capítulo es un grupo de puntos conectados en orden (lleno = dominado, con anillo = el que sigue, tenue = bloqueado y sin nombre). Al tocar un punto se ve su ficha y se puede abrir. La vista elegida se recuerda.

### Corregido
- **Buscar y descargar con yt-dlp desde la AppImage** fallaba con `yt-dlp falló: <no Python frame>`. La AppImage exporta variables propias (`PYTHONHOME`, `PYTHONPATH`, `LD_LIBRARY_PATH`…) que el Python del sistema heredaba y lo hacían caerse al arrancar. Ahora yt-dlp y ffmpeg se ejecutan con un entorno limpio.
- Los errores de yt-dlp muestran la línea relevante (la que dice `ERROR`) en vez de la última línea del mensaje.

## [0.2.0] - 2026-10-22

Rediseño de la interfaz: se mantiene el método de aprendizaje, pero ya no se parece a Duolingo.

### Cambiado
- La progresión se muestra como el **temario de un libro**: capítulos numerados con su porcentaje de dominio y temas numerados (3.1, 3.2…). El capítulo actual marca "seguir acá"; los futuros aparecen bloqueados. Se eliminó el camino de nodos.
- **Estética editorial**: fondo papel (o gris cálido en modo oscuro), un único color de acento, tipografías Source Serif 4 y Source Sans 3, controles finos e íconos lineales propios. Sin emojis.
- **Gamificación discreta**: racha y meta semanal como una línea de texto; el feedback dice "Correcto" / "Incorrecto".
- **Lecciones integradas**: ejercicios "Probalo" intercalados en la explicación (no cuentan para dominar) y una práctica final para dominar el tema.

### Corregido
- Error al importar un archivo desde la biblioteca (el formulario se desmontaba antes de limpiarse).

## [0.1.0] - 2026-10-22

Primera versión.

### Agregado
- Camino de aprendizaje con 289 lecciones en 5 ramas: Teoría y oído (152), Piano (25), Guitarra (60), Bajo (28) y Batería (24), en español rioplatense.
- Progresión estrictamente lineal: un concepto por lección, grafo de prerrequisitos, auditoría de cada ejercicio y vocabulario controlado en los textos.
- Ejercicios generados al azar (con semilla) que ponderan lo que más se falla: lectura de notas, teclado, diapasón, tablatura, intervalos, acordes, escalas, armaduras, grados y funciones, progresiones de oído, dictado melódico y rítmico, grooves de batería.
- Repaso espaciado (SM-2), práctica de "lo que más fallás" y test de nivel opcional por rama.
- Motor propio de partituras: pentagrama (claves de Sol, Fa, Do y percusión), tablatura y batería, con reproducción, cursor, tempo y loop por compases.
- Instrumentos en pantalla (piano, guitarra con afinaciones alternativas y modo zurdo, bajo de 4 y 5 cuerdas, pads de batería) con samples libres derivados de FluidR3_GM (MIT).
- Metrónomo con compases simples, compuestos e irregulares, subdivisiones, acentos y tap tempo.
- Biblioteca: importación de MIDI, MusicXML, Guitar Pro (gp3/gp4/gp5/gpx/gp7), tablaturas en texto y audio (mp3, ogg, flac, wav, m4a), con aviso y vistas simplificadas para contenido no aprendido.
- Reproductor para sacar temas de oído: loop A-B, velocidad sin cambiar el tono (WSOLA), ecualizador y aislamiento de graves/medios/agudos, marcadores y notas.
- Análisis local de audio: tempo, compás, tonalidad, acordes y secciones, corregible a mano.
- Búsqueda y descarga de audio con yt-dlp (Linux), solo a pedido, con confirmación y registro.
- 12 fichas de canciones con análisis originales, que se desbloquean por secciones.
- Progreso: racha, meta semanal, precisión por tipo de ejercicio, historial y diario de práctica.
- Ajustes: Do Re Mi / C D E, tema claro/oscuro, tamaño, alto contraste, paleta para daltonismo, afinación de referencia, red, respaldo cifrado (AES-256-GCM + Argon2id).
- Privacidad: sin cuentas, sin nube, sin telemetría; red apagada por defecto con registro visible de conexiones.

### Limitaciones conocidas
- En Android no está disponible la descarga con yt-dlp (se importan archivos con el selector del sistema).
- De los archivos importados con varias voces por pentagrama se muestra la primera voz.
- El APK es solo para arm64-v8a.

[0.3.0]: https://github.com/mrsalvaa/mussify/releases/tag/v0.3.0
[0.2.0]: https://github.com/mrsalvaa/mussify/releases/tag/v0.2.0
[0.1.0]: https://github.com/mrsalvaa/mussify/releases/tag/v0.1.0

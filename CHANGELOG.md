# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versionado [SemVer](https://semver.org/lang/es/).

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

# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versionado [SemVer](https://semver.org/lang/es/).

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

[0.1.0]: https://github.com/mrsalvaa/mussify/releases/tag/v0.1.0

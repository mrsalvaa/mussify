# Decisiones técnicas

Registro de las decisiones importantes de Mussify, con su justificación. Formato: contexto → decisión → consecuencias.

## 1. Stack: Tauri 2 + Svelte 5 + Rust

**Opciones evaluadas** (criterios en orden: licencias/telemetría, audio, renderizado, mantenibilidad, peso):

| | Licencias y telemetría | Audio baja latencia (Linux + Android) | Partituras y diapasones | Mantenibilidad | Peso |
|---|---|---|---|---|---|
| **Flutter** | BSD; el SDK y las herramientas recolectan analytics por defecto (se pueden desactivar). F-Droid lo acepta pero exige compilar el SDK. | Sin audio nativo propio: depende de plugins de terceros, varios con código nativo por plataforma. | Bueno (CustomPainter). | Dart, un solo lenguaje. | APK ~15-20 MB. |
| **Tauri 2 + UI web** | MIT/Apache, sin telemetría. Usa el WebView del sistema (WebKitGTK / Android System WebView). | El backend es Rust: audio nativo con **cpal** (ALSA/PipeWire en Linux, **AAudio** en Android) y DSP propio. | SVG en la web: excelente para notación (fuentes SMuFL) y diapasones. | Rust para lo crítico, TypeScript para la UI y el núcleo. | Binario Linux ~10 MB; APK chico. |
| **Qt/QML** | Qt LGPL/GPL (mezcla de módulos comerciales/LGPL; cuidado con licencias de módulos). | Qt Multimedia es limitado para síntesis en tiempo real; habría que integrar otra librería. | Bueno con QML/QPainter. | C++/QML; empaquetado para Android más trabajoso. | Pesado (~30+ MB). |
| **Kotlin Multiplatform + Compose** | Apache-2.0. Compose Desktop en Linux corre sobre la JVM. | Sin API común de audio: dos implementaciones (JVM Sound / Oboe). | Bueno (Canvas). | Bueno, pero desktop Linux menos maduro. | JVM en escritorio: pesado. |

**Decisión:** Tauri 2. Es la opción con mejor audio real en ambas plataformas (Rust + cpal, mismo código), sin telemetría, con licencias permisivas y el mejor medio para dibujar notación (SVG + fuente SMuFL). El entorno de desarrollo ya tenía Rust, NDK y WebKitGTK; no había Flutter instalado.

**Consecuencias:** la UI depende del WebView del sistema (en Android, el *Android System WebView*, que se actualiza aparte; en F-Droid se acepta). Hay que mantener la CSP estricta para garantizar que la UI no pueda conectarse a ningún lado.

## 2. Núcleo musical en TypeScript, audio y análisis en Rust

- **Teoría, currículo, generadores, repaso espaciado, importadores de partitura y grabado** viven en `src/core/` (TypeScript puro, sin DOM): se testean con Vitest en milisegundos, y la UI los usa sin IPC.
- **Audio** (`crates/engine`) y **análisis** (`crates/analysis`) están en Rust: necesitan tiempo real y cálculo intensivo.
- El núcleo no conoce la UI ni el audio: produce *secuencias* (`SoundEvent[]`) y *etiquetas* (`Label`) que la UI formatea. Esto deja la puerta abierta a nuevas entradas (MIDI, micrófono) y a un módulo de composición sin reescribir nada (ver `ARCHITECTURE.md`).

## 3. Renderizado de partituras propio (sin VexFlow/OSMD/alphaTab renderer)

**Contexto:** VexFlow (MIT) y OSMD (BSD) son buenos, pero la regla de progresión exige *controlar exactamente* qué se dibuja (ocultar clave, atenuar compases, dibujar ritmo en una línea, marcar lo nuevo). VexFlow 5 además carga fuentes desde CDN por defecto.

**Decisión:** motor de grabado propio (`src/core/notation/render.ts`) que produce primitivas SVG con glifos **Bravura** (SMuFL, OFL), empaquetada localmente. Soporta claves de Sol/Fa/Do/percusión, armaduras, compases, figuras, puntillos, ligaduras, tresillos, barras, acordes, líneas adicionales, cifrados, tablatura (sola o con pentagrama) y batería.

**Consecuencias:** cubre muy bien el material del currículo y archivos simples/medios. Partituras complejas importadas (varias voces por pentagrama, ornamentos) se muestran simplificadas (primera voz).

## 4. Importación: alphaTab solo como *parser*

MusicXML y Guitar Pro (gp3/gp4/gp5/gpx/gp7) se leen con el importador de **alphaTab** (MPL-2.0, compatible con GPL-3.0) y se convierten al modelo propio. No usamos su renderizador ni su sintetizador (que cargarían fuentes/soundfonts). Revisé el bundle: las únicas URLs son de documentación y sus `fetch/XHR` solo se ejecutan si se le pide cargar archivos remotos (nunca lo hacemos; además, la CSP lo bloquearía).

MIDI y tablaturas en texto usan parsers propios (`src/core/import/midi.ts`, `texttab.ts`) con cuantización a semicorcheas.

## 5. Samples propios a partir de FluidR3_GM (MIT)

**Opciones:** SoundFont completo (FluidR3 ~141 MB, MuseScore General ~40 MB), Salamander Piano (CC-BY, cientos de MB), sintetizar todo.

**Decisión:** `scripts/render_samples.py` renderiza con fluidsynth notas sueltas de FluidR3_GM (licencia MIT) cada 3 semitonos (piano, guitarra acústica, guitarra distorsionada, bajo) y las piezas de batería, y las codifica en Ogg Vorbis mono. Resultado: **89 archivos, 1,8 MB**, embebidos en el binario (`include_bytes!`), así no hace falta manejar recursos distintos en Android. El sampler transpone ±1,5 semitonos por re-muestreo. El click del metrónomo se sintetiza.

## 6. Cambio de tempo sin cambiar el tono: WSOLA propio

`crates/engine/src/stretch.rs` implementa WSOLA en tiempo real (ventana Hann de ~46 ms, solapamiento 50 %, búsqueda ±10 ms por correlación). Es simple, sin dependencias, y funciona bien con material musical de 0,5× a 1,5×. Tests verifican que la frecuencia se mantiene (440 Hz a media velocidad) y que el avance es el esperado. Alternativas evaluadas: Rubber Band (GPL, C++: compilación cruzada para Android más compleja), SoundTouch (LGPL, C++). Si en el futuro se quiere más calidad, `signalsmith-stretch` (MIT) es la mejor candidata.

## 7. Análisis de audio local

Implementado desde cero en Rust con `rustfft` (MIT/Apache): flujo espectral → tempo (autocorrelación con prior ~110 BPM) → pulsos (programación dinámica de Ellis) → compás (periodicidad de acentos 3 vs 4) → croma sincronizado al pulso → tonalidad (Krumhansl–Kessler) → acordes (plantillas mayor/menor/7 + Viterbi) → secciones (novedad sobre auto-similitud + agrupamiento). Se evaluaron Essentia (AGPL, C++ pesado) y aubio (GPL, C): agregaban dependencias nativas difíciles de compilar para Android. La UI aclara que es una **estimación** y permite **corregir** acordes, secciones y tempo; las correcciones se guardan aparte del análisis original.

## 8. Progresión lineal: grafo de conceptos + auditoría independiente

- Cada lección introduce **un** concepto (`ConceptId`) y declara requisitos; además requiere la lección anterior de su rama. El grafo se valida (sin ciclos, sin requisitos inexistentes, ramas lineales).
- Los **generadores** reciben el conjunto de conceptos dominados + el foco y solo producen material de ahí.
- Una **auditoría independiente** (`src/core/curriculum/audit.ts` + `extract.ts`) analiza cada ejercicio *ya generado* (partituras, etiquetas, acordes, posiciones, teclas, figuras) y verifica que todo esté aprendido. Los tests la corren sobre todas las lecciones con decenas de semillas (`MUSSIFY_SEEDS=60` para más), y la app la usa como red de seguridad antes de mostrar cada ejercicio.
- **Vocabulario controlado:** `src/content/terms.ts` mapea términos técnicos del español (p. ej. "semitono", "armadura", "acorde") a conceptos. Los tests verifican cada texto de cada lección, y la ficha de canciones oculta en tiempo real los textos que mencionan algo no aprendido.
- **Requisitos con alternativas:** un acorde en guitarra se puede tocar con varias formas (abierta, cejilla); los requisitos se expresan como `anyOf`.
- Las ramas de instrumentos dependen solo del tronco (teoría/oído), nunca entre sí.

## 9. Repaso espaciado: SM-2 adaptado

Una tarjeta por concepto dominado; la calidad sale del porcentaje de aciertos de los ejercicios de ese concepto en el repaso. Se eligió SM-2 por simplicidad y transparencia; FSRS sería una mejora futura (requiere más datos para ajustar). Además se repasan conceptos con errores recientes ("lo que más fallás").

## 10. Almacenamiento: SQLite embebido

`rusqlite` con SQLite *bundled* (dominio público). Tablas: `kv` (progreso, ajustes), `library` (archivos importados/descargados + metadatos: marcadores, notas, análisis y correcciones) y `netlog` (registro de red). Los archivos viven en el directorio de datos de la app. El progreso se guarda como documento JSON (cambia de forma con frecuencia y simplifica exportar/importar).

## 11. Respaldo cifrado

Exportación JSON; con contraseña se cifra con **AES-256-GCM** y clave derivada con **Argon2id** (RustCrypto, MIT/Apache). La preferencia de red **nunca** se importa: siempre arranca apagada.

## 12. Red: interruptor, registro y yt-dlp

- La UI no puede conectarse: CSP `connect-src ipc: http://ipc.localhost` y `default-src 'self'`.
- Solo el backend usa la red y **solo** a través de `yt-dlp` (Unlicense), lanzado como proceso cuando el usuario busca o descarga, previa confirmación que muestra qué y desde dónde. Si el interruptor está apagado (por defecto) se rechaza sin ejecutar nada. Cada uso queda en el registro visible.
- **Android:** no es viable ejecutar yt-dlp (necesita un intérprete de Python empaquetado). Se evaluó NewPipeExtractor (GPL-3.0, Java), que sería una alternativa FOSS real, pero agrega una dependencia vía JitPack (problemática para F-Droid) y un mantenimiento constante frente a cambios de YouTube. **Limitación documentada:** en Android la búsqueda/descarga no está disponible; se ofrece descargar con otra app FOSS (p. ej. NewPipe) e importar el archivo con el selector del sistema.
- Verificación: `scripts/net-audit/` intercepta `connect()` con `LD_PRELOAD` (en la app y en todos los procesos hijos de WebKit) y lista cada destino.

## 13. Permisos de Android

Solo `INTERNET` (necesario para la descarga, aunque en Android esa función no esté activa, se deja para un futuro extractor FOSS; se podría quitar). Sin micrófono, ubicación, contactos ni almacenamiento: la importación usa `<input type=file>`, que abre el selector del sistema (Storage Access Framework), y la exportación usa el diálogo de guardado del sistema. `usesCleartextTraffic=false` también en debug.

## 14. Licencia: GPL-3.0-or-later

Copyleft fuerte, preferida en el pedido. Todas las dependencias son compatibles: MIT, Apache-2.0, BSD, Zlib, ISC, Unicode-3.0, MPL-2.0 (sección 3.3 permite combinar con GPL). Fuentes OFL-1.1 y samples MIT. Ver `THIRD_PARTY.md` y `docs/dependencies.md`.

## 15. Idioma y textos

UI en español rioplatense con voseo. Textos de UI en `src/i18n/es-AR.ts`; contenido de lecciones y fichas en `src/content/es-AR/`. Agregar un idioma = agregar esos dos archivos. Hay un test que verifica que toda clave usada por los ejercicios existe.

## 16. Fichas de canciones sin material protegido

Solo análisis originales: estructura, progresiones (no protegibles), tonalidad, tempo aproximado, descripción del recurso principal, escalas y teoría vinculada. Sin letras, partituras ni tablaturas. Donde las fuentes no coinciden (p. ej. la tonalidad de *Muchacha ojos de papel*), la ficha lo dice y presenta la progresión por grados, transportada para practicar.

## 17. Rediseño 0.2: temario de libro y estética editorial

**Contexto:** la primera versión copiaba demasiado la interfaz de Duolingo (camino serpenteante de nodos, colores saturados, emojis, felicitaciones).

**Decisión:**
- La progresión se muestra como el **índice de un libro**: capítulos numerados (las unidades) con su porcentaje de dominio, y temas numerados (2.3, 2.4…). El capítulo actual se despliega y marca "seguir acá"; los dominados se pueden desplegar; los futuros se muestran solo por su nombre, bloqueados. La progresión sigue siendo estrictamente lineal: solo cambia la presentación.
- **Estética sobria y editorial:** papel claro (o gris cálido oscuro), tinta, un único color de acento (bordó), Source Serif 4 para títulos y Source Sans 3 para texto (ambas OFL), controles finos, íconos lineales propios, sin emojis.
- **Gamificación discreta:** racha y meta semanal quedan como una línea de texto; el feedback dice "Correcto"/"Incorrecto".
- **Lecciones integradas:** la explicación incluye ejercicios "Probalo" intercalados después de los ejemplos (no cuentan para dominar), y al final una práctica para dominar el tema.

## 18. Mapa del temario y entorno limpio para herramientas externas

- El temario ofrece dos vistas de la misma progresión: **libro** (índice) y **mapa** (cada capítulo como grupo de temas conectados). Los temas bloqueados del mapa no muestran nombre.
- Las AppImage exportan `PYTHONHOME`, `PYTHONPATH`, `LD_LIBRARY_PATH` y otras variables apuntando a su montaje. Los procesos del sistema que lanzamos (yt-dlp, ffmpeg) se ejecutan con esas variables quitadas y sin las entradas del montaje en `PATH`/`XDG_DATA_DIRS` (`net::system_command`).

## 19. Inglés como idioma por defecto (0.4)

- El contenido de lecciones vive en `src/content/<idioma>/` con **los mismos ids y ejemplos** en cada idioma; solo cambia el texto. Así la progresión y las auditorías no dependen del idioma.
- Cada idioma tiene su vocabulario controlado (`TERMS_EN`, `TERMS_ES` en `src/content/terms.ts`); los tests de contenido corren para los dos.
- El backend no devuelve frases: devuelve códigos (`E_NET_DISABLED`, `E_YTDLP::detalle`…) que la UI traduce con `localizeError`. El registro de red guarda el motivo como `search|consulta` / `download|título`.
- Cambiar de idioma recarga la app: es más simple y seguro que re-renderizar todo el contenido cargado en memoria.
- Las preferencias guardadas por versiones anteriores (sin `prefsVersion`) pasan una vez a inglés con nombres C D E.

## 20. Miniaturas de la búsqueda (0.4.2)

- La CSP de la interfaz no permite conexiones, y así se queda: las miniaturas las descarga el backend y llegan como `data:` URLs.
- Cliente HTTP: `ureq` 2 con rustls (Rust puro, MIT/Apache), solo en escritorio (`cfg(not(target_os = "android"))`), porque en Android no hay búsqueda.
- No se usa la URL de miniatura que devuelve yt-dlp: se arma `https://i.ytimg.com/vi/<id>/mqdefault.jpg` con el id validado (solo `[A-Za-z0-9_-]`), sin redirecciones, con 10 s de tiempo máximo y 256 KB por imagen. Así un resultado manipulado no puede hacer que la app se conecte a otro lado.
- Un comando aparte (`yt_thumbs`) en lugar de incluirlas en `yt_search`, para que la lista aparezca sin esperar las imágenes. Se registra una entrada por búsqueda (`thumbs|N`).


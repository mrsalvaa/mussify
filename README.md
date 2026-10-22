# 🎵 Mussify

**App libre y offline para aprender música**: leer partitura, entender cómo suenan las notas, entrenar el oído, teoría de cero a armonía avanzada y canciones de rock en **piano, guitarra, bajo y batería**.

Para Linux (CachyOS/Arch y cualquier distro) y Android, desde un mismo código. **Sin cuentas, sin nube, sin telemetría.** Licencia GPL-3.0-or-later.

## Qué tiene

- **Temario en forma de libro** (capítulos y temas numerados, con su porcentaje de dominio) con cinco ramas: *Teoría y oído* (tronco común, 152 lecciones), *Piano*, *Guitarra*, *Bajo* y *Batería* (289 lecciones en total).
- **Progresión estrictamente lineal**: cada lección enseña **un** concepto; nada aparece antes de aprenderse (ni notas, ni figuras, ni acordes, ni términos en los textos). Esto se verifica con tests sobre cada lección y con una auditoría que corre en la app antes de cada ejercicio.
- **Ejercicios generados al azar** (con semilla) que ponderan lo que más fallás: lectura de notas, ubicar en el teclado o el diapasón, intervalos, acordes, escalas, armaduras, grados y funciones, progresiones de oído, dictado melódico y rítmico, tablatura, diagramas de acordes, grooves de batería, y más.
- **Repaso espaciado** (SM-2) y práctica de "lo que más fallás".
- **Test de nivel opcional** por rama: desbloquea solo lo que demostrás.
- **Partituras propias**: pentagrama (claves de Sol, Fa, Do y percusión), tablatura y batería, con reproducción, cursor, tempo ajustable y loop por compases.
- **Instrumentos en pantalla** con sonido de samples libres: piano (teclado táctil, mouse o teclado de compu), guitarra (afinaciones alternativas, zurdo), bajo de 4 y 5 cuerdas, pads de batería.
- **Metrónomo** (compases simples, compuestos e irregulares, subdivisiones, acentos, tap tempo).
- **Biblioteca**: importá MIDI, MusicXML, Guitar Pro (.gp3/.gp4/.gp5/.gpx/.gp), tablaturas en texto y audio (mp3, ogg, flac, wav, m4a). Si un archivo tiene contenido que todavía no aprendiste, la app avisa y ofrece verlo simplificado (solo la melodía, atenuar lo desconocido) o dejarlo pendiente.
- **Sacar canciones de oído**: reproductor con loop A-B, **cambio de velocidad sin cambiar el tono**, ecualizador y filtros para aislar graves/medios/agudos, marcadores y notas personales por marca de tiempo.
- **Análisis local de audio**: tempo, compás aproximado, tonalidad, acordes y secciones, todo en tu dispositivo; corregible a mano.
- **Buscar y descargar audio con yt-dlp** (Linux), solo si lo pedís, con confirmación, con el interruptor de red y quedando en el registro.
- **12 fichas de canciones** con análisis originales (estructura, progresiones, tonalidad, recurso principal, teoría vinculada): *Let It Be*, *Bohemian Rhapsody*, *Muchacha ojos de papel*, *Smoke on the Water*, *De música ligera*, *Wish You Were Here*, *Another One Bites the Dust*, *Come Together*, *Money*, *We Will Rock You*, *Back in Black*, *Rock and Roll*. Se habilitan por partes a medida que aprendés lo necesario.
- **Progreso discreto**: racha, meta semanal, precisión por tipo de ejercicio, historial, "qué fallás más" y diario de práctica. Sin vidas, ligas ni monedas.
- **Ajustes**: Do Re Mi / C D E / ambos, tema claro/oscuro, tamaño de interfaz, alto contraste, paleta para daltonismo, afinación de referencia (La4 = 440 Hz por defecto), red, respaldo cifrado, espacio usado.
- Interfaz en **español rioplatense**, con todos los textos externalizados.

## Instalación

### Linux (CachyOS / Arch)

```bash
sudo pacman -S --needed rust nodejs npm webkit2gtk-4.1 alsa-lib base-devel
# opcional, para descargar audio:
sudo pacman -S yt-dlp ffmpeg
git clone <este repositorio> mussify && cd mussify
scripts/build-linux.sh            # compila, corre los tests y arma deb/rpm/AppImage
./target/release/mussify          # o instalá el paquete de target/release/bundle/
```

Solo el binario, sin paquetes: `npm ci && npx tauri build --no-bundle`.

### Android

Requiere Android SDK + NDK y JDK 17.

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android
scripts/build-android.sh --debug  # APK de depuración
adb install src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk
```

El APK solo pide el permiso `INTERNET` (en Android la descarga con yt-dlp no está disponible; se importan archivos con el selector del sistema).

## Desarrollo

```bash
npm ci
npm run tauri dev        # app de escritorio con recarga en caliente
npm run dev              # solo la UI en el navegador (audio por WebAudio, datos en localStorage)
npm test                 # tests del núcleo, la progresión, el contenido y los importadores
MUSSIFY_SEEDS=60 npm test   # más semillas para la auditoría de progresión
cargo test --workspace   # audio, DSP, análisis, base de datos, respaldo
npm run check            # tipos de TypeScript y Svelte
```

En modo desarrollo en el navegador, `?demo=N` marca como dominados los primeros N conceptos y `?view=lesson&id=read.treble.C4` abre una vista directamente.

## Privacidad y red

Ver [`PRIVACY.md`](PRIVACY.md). Para auditar vos mismo que no haya conexiones: `scripts/net-audit/run.sh target/release/mussify` (intercepta `connect()` en la app y en todos sus procesos hijos).

## Documentación

- [`ARCHITECTURE.md`](ARCHITECTURE.md): módulos, flujo de datos y puntos de extensión (MIDI, micrófono, composición).
- [`DECISIONS.md`](DECISIONS.md): elección de stack y demás decisiones técnicas.
- [`THIRD_PARTY.md`](THIRD_PARTY.md) y [`docs/dependencies.md`](docs/dependencies.md): licencias.
- [`PRIVACY.md`](PRIVACY.md), [`CONTRIBUTING.md`](CONTRIBUTING.md), [`packaging/README.md`](packaging/README.md).

## Aviso sobre material de terceros

Mussify no incluye partituras, tablaturas completas, letras ni grabaciones con derechos de autor. Las fichas de canciones son análisis originales. La descarga y el uso de material de terceros es responsabilidad de quien lo hace y es para práctica personal.

## Licencia

GPL-3.0-or-later. Ver [`LICENSE`](LICENSE).

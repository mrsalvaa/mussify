# Arquitectura

```
┌───────────────────────────── UI (Svelte 5, WebView) ─────────────────────────────┐
│ src/App.svelte, src/ui/**   mapa · lecciones · ejercicios · práctica · canciones  │
│                             biblioteca · reproductor · herramientas · ajustes     │
│ src/i18n/       textos de interfaz (es-AR) y formateo Do/C                        │
│ src/state/      ajustes, progreso, navegación (persistidos vía backend)           │
│ src/platform/   puente con el backend (Tauri invoke) + modo navegador para dev    │
└──────────────┬──────────────────────────────────────────────┬────────────────────┘
               │ usa (sin IPC)                                 │ IPC Tauri
┌──────────────▼──────────── Núcleo (TypeScript puro) ─────┐ ┌─▼──────── Backend (Rust) ───────────────┐
│ src/core/theory/      alturas, intervalos, escalas,      │ │ src-tauri/src/lib.rs   comandos          │
│                       armaduras, acordes, armonía, ritmo │ │ src-tauri/src/db.rs    SQLite local      │
│ src/core/notation/    modelo de partitura, grabado SVG,  │ │ src-tauri/src/backup.rs JSON + AES-GCM   │
│                       conversión a secuencias de sonido  │ │ src-tauri/src/net.rs   yt-dlp + registro │
│ src/core/instruments/ diapasón, afinaciones, formas de   │ │ crates/engine/   audio: cpal, sampler,   │
│                       acordes, batería                   │ │                  metrónomo, WSOLA, EQ    │
│ src/core/curriculum/  lecciones, grafo de conceptos,     │ │ crates/analysis/ tempo, compás, tonali-  │
│                       generadores, auditoría, repaso,    │ │                  dad, acordes, secciones │
│                       test de nivel, corrección          │ └──────────────────────────────────────────┘
│ src/core/songs/       fichas: disponibilidad y ejercicios│
│ src/core/import/      MIDI, MusicXML/GP (alphaTab), tab  │
│ src/content/es-AR/    textos de lecciones, preguntas,    │
│                       fichas de canciones                │
└──────────────────────────────────────────────────────────┘
```

## Principios

1. **El núcleo no conoce la UI ni el audio.** Los generadores devuelven `Exercise` con `Prompt` (texto como `Msg`, partitura como `Score`, audio como `Sequence`) y `Answer` (opciones, teclas, trastes, nombres, ritmo). La UI decide cómo mostrarlo y el backend cómo sonarlo.
2. **Todo lo que se muestra es auditable.** `extract.ts` traduce cualquier `Score`, acorde o etiqueta a requisitos (`Requirement = { anyOf: ConceptId[] }`); `audit.ts` compara con lo aprendido.
3. **Una sola fuente de verdad del avance:** `progress.mastered`. Lo que está desbloqueado se calcula (`Curriculum.isUnlocked`), nunca se guarda.

## Flujo de una lección

1. `Curriculum.nextLesson(rama, dominados)` → lección disponible si todos sus requisitos están dominados.
2. `LessonPlayer` muestra el contenido (`src/content/es-AR/*`) con ejemplos declarativos (`examples.ts` → partitura/teclado/diapasón/audio).
3. `lessonSession()` arma N ejercicios con los generadores de la lección, sobre `conocidos = cierre(requisitos) ∪ {concepto}`, ponderando lo que más se falló (`ItemStat`).
4. `SessionRunner` vuelve a auditar cada ejercicio antes de mostrarlo, registra aciertos (`recordAnswer`) y al final `finishLesson()` marca el concepto como dominado si se supera el umbral (80 % por defecto) y crea su tarjeta de repaso (SM-2).

## Audio

- `src/core/notation/playback.ts` convierte partituras y elementos teóricos en `SoundEvent { time, duration, note, velocity, instrument }`.
- El frontend llama `audio_play(events, channel)`; el motor programa cada evento con precisión de muestra. Canales: principal, metrónomo, opciones, partitura. La posición de cada canal se publica para los cursores.
- El reproductor de canciones decodifica el archivo (Symphonia), lo re-muestrea a la frecuencia del dispositivo y lo reproduce con WSOLA (velocidad 0,25×–2× sin cambiar la altura), loop A-B y ecualizador de 3 bandas + filtros de aislamiento.

## Puntos de extensión (lo que queda preparado)

| Extensión | Dónde se engancha |
|---|---|
| **Entrada MIDI / teclado externo** | `Keyboard.svelte` ya emite `onpress(midi)`; `checkAnswer()` recibe una `Response` independiente del dispositivo. Un módulo `src/platform/midi-input.ts` (Web MIDI o comando Rust con `midir`) solo tiene que producir las mismas `Response`. |
| **Micrófono / interfaz de audio** | `crates/engine` ya tiene el stream de cpal; agregar un stream de entrada + detección de altura (YIN) en `crates/analysis`, y mapear notas detectadas a `Response { kind: "keys" }`. Los ejercicios no cambian. |
| **Composición / edición** | El modelo `Score` es editable (eventos por compás); el renderizador devuelve `EventBox` y `measures` para mapear clics a eventos; `midi.ts` ya incluye `writeMidi()` para exportar. |
| **Nuevos instrumentos** | `InstrumentId` + modelo en `src/core/instruments/` + rama en `lessons.ts` + banco de samples en `crates/engine/samples/` (`scripts/render_samples.py`). |
| **Nuevo idioma** | `src/i18n/<loc>.ts` + `src/content/<loc>/` + entrada en `LOCALES`. Un test verifica que no falte ninguna clave. |
| **Sincronización opcional** | El respaldo ya es un documento JSON cifrable; una sincronización contra un servidor propio podría reutilizar `backup_export/backup_import` (apagada por defecto y sujeta al interruptor de red). |

## Datos en disco

Directorio de datos de la app (Linux: `~/.local/share/org.mussify.app/`; Android: almacenamiento interno de la app):

- `mussify.sqlite3`: tablas `kv` (ajustes `prefs`, progreso `progress`), `library`, `netlog`.
- `library/`: archivos importados o descargados.

## Tests

- `tests/*.test.ts` (Vitest): teoría, progresión lineal (todas las lecciones × semillas), contenido y vocabulario, i18n, fichas, importadores, corrección de respuestas.
- `cargo test --workspace`: DSP (filtros, WSOLA), mezclador/secuenciador, análisis sobre audio sintético, base de datos y respaldo cifrado.

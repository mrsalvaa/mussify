# Software y recursos de terceros

Mussify se distribuye bajo **GPL-3.0-or-later**. Todo lo que incluye es software o contenido libre con licencia compatible. El inventario completo y generado automáticamente de dependencias (con versión exacta) está en [`docs/dependencies.md`](docs/dependencies.md) (`python3 scripts/third_party.py`).

## Recursos empaquetados

| Recurso | Versión | Licencia | Origen | Uso |
|---|---|---|---|---|
| **FluidR3_GM** (Frank Wen) | 3.1 (paquete `soundfont-fluid` de Arch) | MIT | https://member.keymusician.com/Member/FluidR3_GM/ | Fuente de los 89 samples de `crates/engine/samples/` (piano, guitarra acústica, guitarra distorsionada, bajo, batería), renderizados con `scripts/render_samples.py`. Aviso de copyright y permiso reproducidos abajo. |
| **Bravura** (Steinberg) | 1.48 (woff2, rama master) | SIL OFL 1.1 | https://github.com/steinbergmedia/bravura | Glifos musicales SMuFL del grabado de partituras. `assets/fonts/Bravura-OFL.txt` |
| **Source Serif 4** (Adobe) | 4.004 (variable) | SIL OFL 1.1 | https://github.com/adobe-fonts/source-serif | Tipografía de títulos. `assets/fonts/SourceSerif4-OFL.txt` |
| **Source Sans 3** (Adobe) | 3.052 (variable) | SIL OFL 1.1 | https://github.com/adobe-fonts/source-sans | Tipografía de texto. `assets/fonts/SourceSans3-OFL.txt` |
| Ícono de la app | — | GPL-3.0-or-later | Este proyecto (`public/icon.svg`) | — |

### Aviso de FluidR3_GM

```
Copyright (c) 2000-2002, 2008 Frank Wen <getfrank@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.
```

## Dependencias principales (Rust)

| Crate | Licencia | Uso |
|---|---|---|
| tauri, tauri-build, tauri-plugin-dialog, tauri-plugin-fs, wry, tao | MIT OR Apache-2.0 | Marco de la aplicación |
| cpal | Apache-2.0 | Salida de audio (ALSA en Linux, AAudio en Android) |
| symphonia | MPL-2.0 | Decodificación de mp3/ogg/flac/wav/m4a |
| rustfft | MIT OR Apache-2.0 | FFT del análisis |
| rusqlite (+ SQLite bundled) | MIT (SQLite: dominio público) | Base de datos local |
| aes-gcm, argon2 (RustCrypto) | MIT OR Apache-2.0 | Cifrado del respaldo |
| serde, serde_json, base64, getrandom, log | MIT OR Apache-2.0 | Utilidades |

## Dependencias principales (JavaScript, incluidas en la app)

| Paquete | Licencia | Uso |
|---|---|---|
| svelte | MIT | Interfaz |
| @coderline/alphatab | MPL-2.0 | Solo el *importador* de MusicXML y Guitar Pro |
| @tauri-apps/api, @tauri-apps/plugin-dialog, @tauri-apps/plugin-fs | MIT OR Apache-2.0 | Puente con el backend |

Herramientas de desarrollo (no se distribuyen): vite, vitest, typescript, svelte-check, @tauri-apps/cli (todas MIT/Apache-2.0).

## Android

AndroidX, Material Components, Kotlin stdlib, Jackson, Guava (Apache-2.0), que agrega la plantilla de Tauri. **No** hay Google Play Services, Firebase ni SDKs propietarios (verificado con `./gradlew app:dependencies` y revisando el APK).

## Herramientas externas opcionales (no incluidas)

| Herramienta | Licencia | Uso |
|---|---|---|
| yt-dlp | Unlicense | Búsqueda y descarga de audio a pedido (Linux). Se usa la instalada en el sistema. |
| ffmpeg | LGPL/GPL | Si está instalado, yt-dlp lo usa para convertir el audio a mp3. |

## Compatibilidad con GPL-3.0

- MIT, BSD, ISC, Zlib, Unicode-3.0, Apache-2.0: compatibles con GPLv3.
- MPL-2.0 (Symphonia, alphaTab): compatible con GPL por su sección 3.3 (archivos MPL quedan bajo MPL; el conjunto se distribuye bajo GPL).
- OFL 1.1 (fuentes): se distribuyen junto con el programa sin restricción; no afecta la licencia del código.

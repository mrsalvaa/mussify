# Empaquetado

- **deb / rpm / AppImage**: `scripts/build-linux.sh` (usa `tauri build`). Los paquetes quedan en `target/release/bundle/`. Generar el AppImage descarga `linuxdeploy` la primera vez.
- **Flatpak**: `flatpak-builder --user --install build-dir packaging/flatpak/org.mussify.app.yml` luego de compilar. Para Flathub hace falta compilar desde fuente generando las fuentes offline con `flatpak-cargo-generator.py` y `flatpak-node-generator` (flatpak-builder-tools).
- **Arch / CachyOS (local)**: `scripts/build-linux.sh` y luego `sudo pacman -U target/release/bundle/...` o simplemente copiar `target/release/mussify` y los archivos de `packaging/linux/`.
- **Android / F-Droid**: `scripts/build-android.sh`. `packaging/fdroid/org.mussify.app.yml` es una plantilla para `fdroiddata`. El build no usa binarios propietarios: Rust, Node, Gradle y AndroidX (Apache-2.0). Los samples se generan a partir de un SoundFont MIT con `scripts/render_samples.py` (están versionados en `crates/engine/samples/`).

Para builds reproducibles: `npm ci` (usa `package-lock.json`), `cargo build --locked` (usa `Cargo.lock`), y `SOURCE_DATE_EPOCH` fijo.

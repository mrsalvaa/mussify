#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# Compila Mussify para Linux. Paquetes: deb, rpm y AppImage (target/release/bundle/).
# Requisitos (Arch/CachyOS): sudo pacman -S --needed rust nodejs npm webkit2gtk-4.1 alsa-lib base-devel
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci
npm test
cargo test --workspace --release
npx tauri build "$@"
echo "Binario: target/release/mussify"
ls -1 target/release/bundle/*/* 2>/dev/null || true

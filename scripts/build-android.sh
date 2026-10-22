#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# Compila el APK de Android. Uso: scripts/build-android.sh [--debug]
# Requisitos: Android SDK (build-tools, platform 35+), NDK, JDK 17 y los targets de Rust:
#   rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android
set -euo pipefail
cd "$(dirname "$0")/.."
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk}"
export ANDROID_HOME="${ANDROID_HOME:-/opt/android-sdk}"
export NDK_HOME="${NDK_HOME:-$(ls -d "$ANDROID_HOME"/ndk/* | sort -V | tail -1)}"
npm ci
[ -d src-tauri/gen/android ] || npx tauri android init --ci
npx tauri android build --apk "$@"
find src-tauri/gen/android/app/build/outputs/apk -name '*.apk' -print

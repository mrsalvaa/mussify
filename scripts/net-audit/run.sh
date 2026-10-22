#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# Ejecuta Mussify registrando toda conexión de red (de la app y de sus procesos hijos).
# Uso: scripts/net-audit/run.sh [ruta/al/binario] [segundos]
# Al cerrar la app (o al vencer el tiempo) imprime un resumen. Las conexiones UNIX
# (D-Bus, PipeWire, Wayland) son locales; cualquier INET/INET6 es tráfico de red.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
bin="${1:-$here/../../target/release/mussify}"
secs="${2:-0}"
work="$(mktemp -d)"
gcc -shared -fPIC -O2 -o "$work/netlog.so" "$here/netlog.c" -ldl
export NETLOG_FILE="$work/net.log"
if [ "$secs" -gt 0 ]; then
  LD_PRELOAD="$work/netlog.so" timeout "$secs" "$bin" || true
else
  LD_PRELOAD="$work/netlog.so" "$bin" || true
fi
echo "== Conexiones registradas (proceso / tipo / destino) =="
touch "$NETLOG_FILE"
awk '{ $1=""; print }' "$NETLOG_FILE" | sort | uniq -c
if grep -qE " INET6? " "$NETLOG_FILE"; then
  echo "!! Hubo conexiones de red (ver arriba)."
else
  echo "OK: ninguna conexión de red (solo sockets locales)."
fi

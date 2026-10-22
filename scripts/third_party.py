#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Lista las dependencias (Rust y JS de producción) con su licencia, para THIRD_PARTY.md.
Uso: python3 scripts/third_party.py > docs/dependencies.md"""
import json, subprocess, os, sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
meta = json.loads(subprocess.check_output(["cargo", "metadata", "--format-version", "1", "--locked"], cwd=root))
# solo paquetes que efectivamente entran en el binario de Linux o Android (resueltos)
resolved = {n["id"] for n in meta["resolve"]["nodes"]}
rows = sorted({(p["name"], p["version"], p.get("license") or "?", p.get("repository") or "") for p in meta["packages"] if p["id"] in resolved and not p["name"].startswith("mussify")})
print("# Dependencias (inventario generado)\n")
print("Generado con `python3 scripts/third_party.py`. Incluye todas las dependencias resueltas del workspace de Rust (para todos los destinos) y las dependencias de producción de JavaScript.\n")
print("## Rust (crates)\n\n| Crate | Versión | Licencia |\n|---|---|---|")
for n, v, l, r in rows:
    print(f"| {n} | {v} | {l} |")
lock = json.load(open(os.path.join(root, "package-lock.json")))
print("\n## JavaScript (producción)\n\n| Paquete | Versión | Licencia |\n|---|---|---|")
for path, info in sorted(lock["packages"].items()):
    if not path or info.get("dev") or info.get("devOptional"):
        continue
    name = path.split("node_modules/")[-1]
    print(f"| {name} | {info.get('version','')} | {info.get('license','?')} |")

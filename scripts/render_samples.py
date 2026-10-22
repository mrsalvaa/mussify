#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Genera el banco de samples de Mussify a partir de FluidR3_GM (licencia MIT).

Uso: scripts/render_samples.py /ruta/a/FluidR3_GM.sf2 src-tauri/samples
Requiere: fluidsynth y ffmpeg (con libvorbis).
"""
import os, struct, subprocess, sys, tempfile

SF2, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

def vlq(v):
    out = [v & 0x7F]
    v >>= 7
    while v:
        out.insert(0, (v & 0x7F) | 0x80)
        v >>= 7
    return bytes(out)

def midi_file(path, program, channel, note, vel, dur_ticks, ppq=480):
    ev = b""
    if channel != 9:
        ev += vlq(0) + bytes([0xC0 | channel, program])
    ev += vlq(0) + bytes([0x90 | channel, note, vel])
    ev += vlq(dur_ticks) + bytes([0x80 | channel, note, 0])
    ev += vlq(ppq * 4) + bytes([0xFF, 0x2F, 0])
    trk = b"MTrk" + struct.pack(">I", len(ev)) + ev
    hdr = b"MThd" + struct.pack(">IHHH", 6, 0, 1, ppq)
    open(path, "wb").write(hdr + trk)

def render(name, program, channel, note, seconds, vel=100):
    with tempfile.TemporaryDirectory() as td:
        mid, wav = os.path.join(td, "n.mid"), os.path.join(td, "n.wav")
        midi_file(mid, program, channel, note, vel, int(480 * 2 * seconds))  # 120 bpm: 960 ticks/s
        subprocess.run(["fluidsynth", "-ni", "-g", "0.9", "-R", "0", "-C", "0", "-r", "44100", "-F", wav, SF2, mid], check=True, capture_output=True)
        out = os.path.join(OUT, f"{name}.ogg")
        fade = max(0.05, seconds * 0.25)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-ac", "1", "-af",
                        f"silenceremove=start_periods=1:start_threshold=-60dB,atrim=0:{seconds + 0.6},afade=t=out:st={seconds + 0.6 - fade}:d={fade}",
                        "-c:a", "libvorbis", "-q:a", "3", out], check=True)

BANKS = {
    # nombre: (programa GM, nota baja, nota alta, paso, duración)
    "piano": (0, 21, 108, 3, 2.6),
    "guitar": (25, 40, 88, 3, 2.2),
    "guitarDist": (30, 40, 84, 3, 1.8),
    "bass": (33, 23, 67, 3, 1.8),
}
for bank, (prog, lo, hi, step, dur) in BANKS.items():
    for n in range(lo, hi + 1, step):
        render(f"{bank}_{n}", prog, 0, n, dur if n < 84 else dur * 0.6)
        print(bank, n, flush=True)

for gm in [36, 37, 38, 42, 43, 44, 46, 47, 49, 50, 51, 53]:
    render(f"drums_{gm}", 0, 9, gm, 1.4 if gm in (49, 51, 53, 46) else 0.7, vel=110)
    print("drums", gm, flush=True)

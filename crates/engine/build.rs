// SPDX-License-Identifier: GPL-3.0-or-later
// Genera la tabla de samples embebidos (include_bytes!) a partir de la carpeta samples/.
use std::{env, fs, path::Path};

fn main() {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("samples");
    println!("cargo:rerun-if-changed={}", dir.display());
    let mut entries: Vec<_> = fs::read_dir(&dir).expect("samples/").filter_map(|e| e.ok()).map(|e| e.path()).filter(|p| p.extension().map(|x| x == "ogg").unwrap_or(false)).collect();
    entries.sort();
    let mut out = String::from("pub static SAMPLES: &[(&str, &[u8])] = &[\n");
    for p in entries {
        let name = p.file_stem().unwrap().to_string_lossy().to_string();
        out.push_str(&format!("    ({:?}, include_bytes!({:?})),\n", name, p.display().to_string()));
    }
    out.push_str("];\n");
    fs::write(Path::new(&env::var("OUT_DIR").unwrap()).join("samples.rs"), out).unwrap();
}

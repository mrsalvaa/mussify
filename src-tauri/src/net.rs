// SPDX-License-Identifier: GPL-3.0-or-later
//! Única parte de la app que usa la red: buscar y descargar audio con yt-dlp (herramienta FOSS),
//! siempre a pedido explícito del usuario, respetando el interruptor general y dejando registro.

use crate::db::Db;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub channel: String,
    pub duration: Option<f64>,
    pub url: String,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ToolInfo {
    pub supported: bool,
    pub ytdlp: Option<String>,
    pub ytdlp_version: Option<String>,
    pub ffmpeg: bool,
    pub reason: Option<String>,
}

fn which(bin: &str) -> Option<PathBuf> {
    let path = std::env::var_os("PATH")?;
    for dir in std::env::split_paths(&path) {
        let p = dir.join(bin);
        if p.is_file() {
            return Some(p);
        }
    }
    None
}

pub fn ytdlp_path(db: &Db) -> Option<PathBuf> {
    if let Ok(Some(custom)) = db.kv_get("ytdlp.path") {
        let p = PathBuf::from(custom.trim_matches('"'));
        if p.is_file() {
            return Some(p);
        }
    }
    which("yt-dlp")
}

pub fn tool_info(db: &Db) -> ToolInfo {
    if cfg!(target_os = "android") {
        return ToolInfo {
            supported: false,
            ytdlp: None,
            ytdlp_version: None,
            ffmpeg: false,
            reason: Some("En Android no se puede ejecutar yt-dlp dentro de la app. Descargá el audio con otra app FOSS (por ejemplo NewPipe) y compartilo o importalo en Mussify.".into()),
        };
    }
    let p = ytdlp_path(db);
    let version = p.as_ref().and_then(|p| Command::new(p).arg("--version").output().ok()).map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string());
    ToolInfo {
        supported: true,
        ytdlp: p.map(|x| x.display().to_string()),
        ytdlp_version: version,
        ffmpeg: which("ffmpeg").is_some(),
        reason: None,
    }
}

fn guard(db: &Db, reason: &str) -> Result<PathBuf, String> {
    if !db.network_allowed() {
        return Err("Las conexiones de red están desactivadas. Activalas en Ajustes → Red para buscar y descargar.".into());
    }
    if cfg!(target_os = "android") {
        return Err(tool_info(db).reason.unwrap_or_default());
    }
    let _ = reason;
    ytdlp_path(db).ok_or_else(|| "No encontré yt-dlp. Instalalo (en Arch/CachyOS: sudo pacman -S yt-dlp) o indicá su ruta en Ajustes.".into())
}

pub fn search(db: &Db, query: &str) -> Result<Vec<SearchResult>, String> {
    let q = query.trim();
    if q.is_empty() {
        return Err("Escribí qué querés buscar".into());
    }
    let bin = guard(db, "búsqueda")?;
    let out = Command::new(bin)
        .args(["--flat-playlist", "--dump-json", "--no-warnings", "--ignore-config"])
        .arg(format!("ytsearch10:{q}"))
        .output();
    let out = match out {
        Ok(o) => o,
        Err(e) => {
            db.net_log("www.youtube.com (yt-dlp)", &format!("Búsqueda: {q}"), false);
            return Err(format!("No pude ejecutar yt-dlp: {e}"));
        }
    };
    let ok = out.status.success();
    db.net_log("www.youtube.com (yt-dlp)", &format!("Búsqueda: {q}"), ok);
    if !ok {
        return Err(format!("yt-dlp falló: {}", String::from_utf8_lossy(&out.stderr).lines().last().unwrap_or("")));
    }
    let mut res = Vec::new();
    for line in String::from_utf8_lossy(&out.stdout).lines() {
        let Ok(v) = serde_json::from_str::<serde_json::Value>(line) else { continue };
        let id = v["id"].as_str().unwrap_or_default().to_string();
        if id.is_empty() {
            continue;
        }
        res.push(SearchResult {
            title: v["title"].as_str().unwrap_or("(sin título)").to_string(),
            channel: v["channel"].as_str().or(v["uploader"].as_str()).unwrap_or("").to_string(),
            duration: v["duration"].as_f64(),
            url: v["url"].as_str().map(|s| s.to_string()).unwrap_or_else(|| format!("https://www.youtube.com/watch?v={id}")),
            id,
        });
    }
    Ok(res)
}

/// Descarga solo el audio a la carpeta de la biblioteca. Devuelve la ruta del archivo.
pub fn download(db: &Db, id: &str, title: &str, dir: &Path) -> Result<PathBuf, String> {
    if !id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_') {
        return Err("Identificador inválido".into());
    }
    let bin = guard(db, "descarga")?;
    let url = format!("https://www.youtube.com/watch?v={id}");
    let template = dir.join(format!("yt-{id}.%(ext)s"));
    let mut cmd = Command::new(bin);
    cmd.args(["--no-playlist", "--no-warnings", "--ignore-config", "--no-mtime", "--print", "after_move:filepath", "-o"]).arg(&template);
    if which("ffmpeg").is_some() {
        // con ffmpeg se puede convertir a un formato que el motor decodifica siempre
        cmd.args(["-x", "--audio-format", "mp3", "--audio-quality", "2"]);
    } else {
        cmd.args(["-f", "bestaudio[ext=m4a]/bestaudio[acodec^=mp4a]/bestaudio[ext=mp3]"]);
    }
    cmd.arg(&url);
    let out = cmd.output().map_err(|e| format!("No pude ejecutar yt-dlp: {e}"))?;
    let ok = out.status.success();
    db.net_log("www.youtube.com (yt-dlp)", &format!("Descarga de audio: {title}"), ok);
    if !ok {
        return Err(format!("La descarga falló: {}", String::from_utf8_lossy(&out.stderr).lines().last().unwrap_or("")));
    }
    let path = String::from_utf8_lossy(&out.stdout).lines().last().map(|s| PathBuf::from(s.trim())).filter(|p| p.is_file());
    path.ok_or_else(|| "yt-dlp terminó pero no encontré el archivo descargado".into())
}

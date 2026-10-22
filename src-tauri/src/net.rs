// SPDX-License-Identifier: GPL-3.0-or-later
//! Única parte de la app que usa la red: buscar y descargar audio con yt-dlp (herramienta FOSS)
//! y traer las miniaturas de los resultados de búsqueda, siempre a pedido explícito del usuario,
//! respetando el interruptor general y dejando registro.

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

/// Variables que las AppImage (y otros empaquetados) exportan para sus propias librerías.
/// Si las hereda un programa del sistema como yt-dlp (Python) o ffmpeg, se rompe
/// ("Fatal Python error ... <no Python frame>"), así que se limpian antes de lanzarlo.
const BUNDLE_VARS: &[&str] = &[
    "PYTHONHOME", "PYTHONPATH", "PYTHONDONTWRITEBYTECODE", "LD_LIBRARY_PATH", "LD_PRELOAD", "PERLLIB",
    "GST_PLUGIN_SYSTEM_PATH", "GST_PLUGIN_SYSTEM_PATH_1_0", "GST_PLUGIN_PATH", "GIO_MODULE_DIR",
    "GDK_PIXBUF_MODULE_FILE", "GTK_PATH", "GTK_DATA_PREFIX", "GTK_EXE_PREFIX", "GTK_IM_MODULE_FILE",
    "GSETTINGS_SCHEMA_DIR", "QT_PLUGIN_PATH",
];

/// Quita de una lista tipo PATH las entradas que apuntan dentro del paquete montado.
fn strip_bundle_entries(value: &std::ffi::OsStr, appdir: Option<&std::ffi::OsStr>) -> std::ffi::OsString {
    let Some(appdir) = appdir.filter(|a| !a.is_empty()) else { return value.to_os_string() };
    let appdir = Path::new(appdir);
    let kept: Vec<PathBuf> = std::env::split_paths(value).filter(|p| !p.starts_with(appdir)).collect();
    std::env::join_paths(kept).unwrap_or_else(|_| value.to_os_string())
}

/// Comando para una herramienta del sistema, con el entorno limpio de variables del empaquetado.
pub fn system_command(bin: &Path) -> Command {
    let mut cmd = Command::new(bin);
    for v in BUNDLE_VARS {
        cmd.env_remove(v);
    }
    let appdir = std::env::var_os("APPDIR");
    for v in ["PATH", "XDG_DATA_DIRS"] {
        if let Some(val) = std::env::var_os(v) {
            cmd.env(v, strip_bundle_entries(&val, appdir.as_deref()));
        }
    }
    cmd
}

fn which(bin: &str) -> Option<PathBuf> {
    let path = std::env::var_os("PATH")?;
    let path = strip_bundle_entries(&path, std::env::var_os("APPDIR").as_deref());
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
            reason: Some("E_ANDROID".into()),
        };
    }
    let p = ytdlp_path(db);
    let version = p.as_ref().and_then(|p| system_command(p).arg("--version").output().ok()).map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string());
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
        return Err("E_NET_DISABLED".into());
    }
    if cfg!(target_os = "android") {
        return Err(tool_info(db).reason.unwrap_or_default());
    }
    let _ = reason;
    ytdlp_path(db).ok_or_else(|| "E_NO_YTDLP".into())
}

pub fn search(db: &Db, query: &str) -> Result<Vec<SearchResult>, String> {
    let q = query.trim();
    if q.is_empty() {
        return Err("E_EMPTY_QUERY".into());
    }
    let bin = guard(db, "búsqueda")?;
    let out = system_command(&bin)
        .args(["--flat-playlist", "--dump-json", "--no-warnings", "--ignore-config"])
        .arg(format!("ytsearch10:{q}"))
        .output();
    let out = match out {
        Ok(o) => o,
        Err(e) => {
            db.net_log("www.youtube.com (yt-dlp)", &format!("search|{q}"), false);
            return Err(format!("E_YTDLP::{e}"));
        }
    };
    let ok = out.status.success();
    db.net_log("www.youtube.com (yt-dlp)", &format!("search|{q}"), ok);
    if !ok {
        return Err(format!("E_YTDLP::{}", error_summary(&out.stderr)));
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

fn valid_id(id: &str) -> bool {
    !id.is_empty() && id.len() <= 32 && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

/// Tamaño máximo aceptado por miniatura (las de 320×180 pesan ~10–30 KB).
const THUMB_MAX: u64 = 256 * 1024;

/// Miniaturas de los resultados de búsqueda como `data:image/jpeg;base64,…` (la interfaz no tiene red).
/// La URL se arma solo a partir del id validado, siempre en i.ytimg.com. Las que fallan quedan en `None`.
#[cfg(not(target_os = "android"))]
pub fn thumbnails(db: &Db, ids: &[String]) -> Result<Vec<Option<String>>, String> {
    use base64::Engine as _;
    use std::io::Read;
    if !db.network_allowed() {
        return Err("E_NET_DISABLED".into());
    }
    let ids: Vec<String> = ids.iter().take(20).cloned().collect();
    if ids.iter().any(|id| !valid_id(id)) {
        return Err("E_BAD_ID".into());
    }
    let agent = ureq::AgentBuilder::new().timeout(std::time::Duration::from_secs(10)).redirects(0).build();
    let handles: Vec<_> = ids
        .iter()
        .map(|id| {
            let agent = agent.clone();
            let url = format!("https://i.ytimg.com/vi/{id}/mqdefault.jpg");
            std::thread::spawn(move || -> Option<String> {
                let resp = agent.get(&url).call().ok()?;
                if !resp.content_type().starts_with("image/") {
                    return None;
                }
                let mut buf = Vec::new();
                resp.into_reader().take(THUMB_MAX + 1).read_to_end(&mut buf).ok()?;
                if buf.is_empty() || buf.len() as u64 > THUMB_MAX {
                    return None;
                }
                Some(format!("data:image/jpeg;base64,{}", base64::engine::general_purpose::STANDARD.encode(&buf)))
            })
        })
        .collect();
    let out: Vec<Option<String>> = handles.into_iter().map(|h| h.join().ok().flatten()).collect();
    db.net_log("i.ytimg.com", &format!("thumbs|{}", ids.len()), out.iter().any(Option::is_some));
    Ok(out)
}

#[cfg(target_os = "android")]
pub fn thumbnails(_db: &Db, _ids: &[String]) -> Result<Vec<Option<String>>, String> {
    Err("E_ANDROID".into())
}

/// Descarga solo el audio a la carpeta de la biblioteca. Devuelve la ruta del archivo.
pub fn download(db: &Db, id: &str, title: &str, dir: &Path) -> Result<PathBuf, String> {
    if !valid_id(id) {
        return Err("E_BAD_ID".into());
    }
    let bin = guard(db, "descarga")?;
    let url = format!("https://www.youtube.com/watch?v={id}");
    let template = dir.join(format!("yt-{id}.%(ext)s"));
    let mut cmd = system_command(&bin);
    cmd.args(["--no-playlist", "--no-warnings", "--ignore-config", "--no-mtime", "--print", "after_move:filepath", "-o"]).arg(&template);
    if which("ffmpeg").is_some() {
        // con ffmpeg se puede convertir a un formato que el motor decodifica siempre
        cmd.args(["-x", "--audio-format", "mp3", "--audio-quality", "2"]);
    } else {
        cmd.args(["-f", "bestaudio[ext=m4a]/bestaudio[acodec^=mp4a]/bestaudio[ext=mp3]"]);
    }
    cmd.arg(&url);
    let out = cmd.output().map_err(|e| format!("E_YTDLP::{e}"))?;
    let ok = out.status.success();
    db.net_log("www.youtube.com (yt-dlp)", &format!("download|{title}"), ok);
    if !ok {
        return Err(format!("E_DOWNLOAD::{}", error_summary(&out.stderr)));
    }
    let path = String::from_utf8_lossy(&out.stdout).lines().last().map(|s| PathBuf::from(s.trim())).filter(|p| p.is_file());
    path.ok_or_else(|| "E_DOWNLOAD::no output file".into())
}

/// La línea más útil del error de yt-dlp (la que dice ERROR, o la primera no vacía).
fn error_summary(stderr: &[u8]) -> String {
    let text = String::from_utf8_lossy(stderr);
    let lines: Vec<&str> = text.lines().map(str::trim).filter(|l| !l.is_empty()).collect();
    lines
        .iter()
        .find(|l| l.starts_with("ERROR") || l.starts_with("Fatal Python error"))
        .or_else(|| lines.first())
        .map(|l| l.to_string())
        .unwrap_or_else(|| "unknown error".into())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cleans_bundle_environment() {
        let joined = std::env::join_paths(["/tmp/.mount_X/usr/bin", "/usr/bin", "/tmp/.mount_X/bin"]).unwrap();
        let out = strip_bundle_entries(&joined, Some(std::ffi::OsStr::new("/tmp/.mount_X")));
        assert_eq!(out, std::ffi::OsString::from("/usr/bin"));
        let cmd = system_command(Path::new("/bin/true"));
        let removed: Vec<_> = cmd.get_envs().filter(|(_, v)| v.is_none()).map(|(k, _)| k.to_string_lossy().to_string()).collect();
        assert!(removed.contains(&"PYTHONHOME".to_string()));
        assert!(removed.contains(&"LD_LIBRARY_PATH".to_string()));
    }

    #[test]
    fn validates_video_ids() {
        assert!(valid_id("dQw4w9WgXcQ"));
        assert!(!valid_id(""));
        assert!(!valid_id("../etc/passwd"));
        assert!(!valid_id("abc?x=1"));
        assert!(!valid_id("a/b"));
    }

    #[test]
    fn picks_useful_error_line() {
        let e = b"Fatal Python error: init_fs_encoding: failed to get the Python codec\nPython runtime state: core initialized\n\nCurrent thread (most recent call first):\n  <no Python frame>\n";
        assert!(error_summary(e).starts_with("Fatal Python error"));
        assert_eq!(error_summary(b"WARNING: x\nERROR: [youtube] abc: Video unavailable\n"), "ERROR: [youtube] abc: Video unavailable");
    }
}

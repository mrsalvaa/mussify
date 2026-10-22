// SPDX-License-Identifier: GPL-3.0-or-later
//! Backend de Mussify (Tauri 2): audio nativo, análisis, almacenamiento local, respaldo y red controlada.

mod backup;
mod db;
mod net;

use db::{Db, LibraryItem};
use mussify_engine::mixer::{Inst, SeqEvent};
use mussify_engine::{decode, Cmd, EqSettings, Engine};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::ipc::{InvokeBody, Request, Response};
use tauri::{Manager, State};

pub struct AppState {
    engine: Arc<Engine>,
    db: Arc<Db>,
    loaded: Mutex<Option<String>>,
}

type Res<T> = Result<T, String>;

// ------------------------------------------------------------------ audio

#[tauri::command]
fn audio_play(state: State<AppState>, events: Vec<SeqEvent>, channel: u8, delay: Option<f64>) {
    state.engine.send(Cmd::PlaySeq { channel, events, delay: delay.unwrap_or(0.04) });
}

#[tauri::command]
fn audio_stop(state: State<AppState>, channel: Option<u8>) {
    state.engine.send(match channel {
        Some(c) => Cmd::StopChannel(c),
        None => Cmd::StopAll,
    });
}

#[tauri::command]
fn audio_note(state: State<AppState>, instrument: Inst, note: u8, velocity: Option<f32>, on: bool) {
    state.engine.send(if on { Cmd::NoteOn { inst: instrument, note, vel: velocity.unwrap_or(0.8) } } else { Cmd::NoteOff { inst: instrument, note } });
}

#[tauri::command]
fn audio_status(state: State<AppState>) -> mussify_engine::Status {
    state.engine.status()
}

#[tauri::command]
fn audio_config(state: State<AppState>, a4: Option<f32>, master: Option<f32>) {
    if let Some(f) = a4 {
        state.engine.send(Cmd::SetA4(f.clamp(400.0, 480.0)));
    }
    if let Some(v) = master {
        state.engine.send(Cmd::SetMaster(v.clamp(0.0, 1.5)));
    }
}

// ------------------------------------------------------------------ reproductor

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LoadedInfo {
    duration: f64,
    peaks: Vec<f32>,
}

#[tauri::command]
async fn player_load(state: State<'_, AppState>, id: String) -> Res<LoadedInfo> {
    let item = state.db.library_get(&id)?;
    let path = state.db.library_dir().join(&item.file);
    let rate = state.engine.rate;
    let (pcm, peaks) = tauri::async_runtime::spawn_blocking(move || -> Res<_> {
        let pcm = decode::decode_file(&path)?;
        let peaks = decode::peaks(&pcm, 1200);
        Ok((pcm.to_stereo_rate(rate), peaks))
    })
    .await
    .map_err(|e| e.to_string())??;
    let duration = pcm.duration();
    state.engine.send(Cmd::PlayerLoad(Arc::new(pcm.data)));
    *state.loaded.lock().map_err(|e| e.to_string())? = Some(id);
    Ok(LoadedInfo { duration, peaks })
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PlayerCtl {
    play: Option<bool>,
    seek: Option<f64>,
    speed: Option<f64>,
    loop_ab: Option<Option<(f64, f64)>>,
    volume: Option<f32>,
    eq: Option<EqSettings>,
    unload: Option<bool>,
}

#[tauri::command]
fn player_control(state: State<AppState>, ctl: PlayerCtl) {
    let e = &state.engine;
    if let Some(s) = ctl.speed {
        e.send(Cmd::PlayerSpeed(s));
    }
    if let Some(s) = ctl.seek {
        e.send(Cmd::PlayerSeek(s));
    }
    if let Some(l) = ctl.loop_ab {
        e.send(Cmd::PlayerLoop(l));
    }
    if let Some(v) = ctl.volume {
        e.send(Cmd::PlayerVolume(v));
    }
    if let Some(eq) = ctl.eq {
        e.send(Cmd::SetEq(eq));
    }
    if let Some(p) = ctl.play {
        e.send(Cmd::PlayerPlay(p));
    }
    if ctl.unload == Some(true) {
        e.send(Cmd::PlayerUnload);
        if let Ok(mut l) = state.loaded.lock() {
            *l = None;
        }
    }
}

// ------------------------------------------------------------------ análisis

#[tauri::command]
async fn analyze_audio(state: State<'_, AppState>, id: String, a4: Option<f32>) -> Res<serde_json::Value> {
    let item = state.db.library_get(&id)?;
    let path = state.db.library_dir().join(&item.file);
    let a4 = a4.unwrap_or(440.0);
    let result = tauri::async_runtime::spawn_blocking(move || -> Res<_> {
        let pcm = decode::decode_file(&path)?;
        Ok(mussify_analysis::analyze(&pcm.mono(), pcm.rate, a4))
    })
    .await
    .map_err(|e| e.to_string())??;
    let value = serde_json::to_value(&result).map_err(|e| e.to_string())?;
    let mut meta = item.meta.clone();
    meta["analysis"] = value.clone();
    state.db.library_update(&id, None, Some(meta))?;
    Ok(value)
}

// ------------------------------------------------------------------ almacenamiento

#[tauri::command]
fn kv_get(state: State<AppState>, key: String) -> Res<Option<String>> {
    state.db.kv_get(&key)
}

#[tauri::command]
fn kv_set(state: State<AppState>, key: String, value: String) -> Res<()> {
    state.db.kv_set(&key, &value)
}

fn new_id() -> String {
    let mut b = [0u8; 8];
    let _ = getrandom::getrandom(&mut b);
    format!("{:x}{:016x}", db::now(), u64::from_le_bytes(b))
}

fn safe_ext(name: &str) -> String {
    let ext = name.rsplit('.').next().unwrap_or("bin").to_lowercase();
    if ext.len() <= 8 && ext.chars().all(|c| c.is_ascii_alphanumeric()) { ext } else { "bin".into() }
}

/// Agrega un archivo a la biblioteca. Cuerpo: bytes crudos; encabezados: x-name, x-kind.
#[tauri::command]
fn library_add(state: State<AppState>, request: Request<'_>) -> Res<LibraryItem> {
    let InvokeBody::Raw(bytes) = request.body() else { return Err("E_BAD_REQUEST".into()) };
    let h = request.headers();
    let get = |k: &str| h.get(k).and_then(|v| v.to_str().ok()).map(|s| percent_decode(s)).unwrap_or_default();
    let name = get("x-name");
    let kind = get("x-kind");
    if bytes.len() > 400 * 1024 * 1024 {
        return Err("E_TOO_BIG".into());
    }
    let id = new_id();
    let file = format!("{id}.{}", safe_ext(&name));
    std::fs::write(state.db.library_dir().join(&file), bytes).map_err(|e| e.to_string())?;
    let title = name.rsplit_once('.').map(|(a, _)| a.to_string()).unwrap_or(name.clone());
    let item = LibraryItem { id, title, kind, file, size: bytes.len() as u64, created: db::now(), meta: serde_json::json!({ "source": "import", "originalName": name }) };
    state.db.library_insert(&item)?;
    Ok(item)
}

fn percent_decode(s: &str) -> String {
    let b = s.as_bytes();
    let mut out = Vec::with_capacity(b.len());
    let mut i = 0;
    while i < b.len() {
        if b[i] == b'%' && i + 2 < b.len() {
            if let Ok(v) = u8::from_str_radix(&s[i + 1..i + 3], 16) {
                out.push(v);
                i += 3;
                continue;
            }
        }
        out.push(b[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).to_string()
}

#[tauri::command]
fn library_list(state: State<AppState>) -> Res<Vec<LibraryItem>> {
    state.db.library_list()
}

#[tauri::command]
fn library_read(state: State<AppState>, id: String) -> Res<Response> {
    let item = state.db.library_get(&id)?;
    let bytes = std::fs::read(state.db.library_dir().join(&item.file)).map_err(|e| e.to_string())?;
    Ok(Response::new(bytes))
}

#[tauri::command]
fn library_update(state: State<AppState>, id: String, title: Option<String>, meta: Option<serde_json::Value>) -> Res<LibraryItem> {
    state.db.library_update(&id, title, meta)
}

#[tauri::command]
fn library_delete(state: State<AppState>, id: String) -> Res<()> {
    if state.loaded.lock().map(|l| l.as_deref() == Some(id.as_str())).unwrap_or(false) {
        state.engine.send(Cmd::PlayerUnload);
    }
    state.db.library_delete(&id)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct StorageInfo {
    total_bytes: u64,
    library_bytes: u64,
    items: usize,
    data_dir: String,
}

#[tauri::command]
fn storage_info(state: State<AppState>) -> Res<StorageInfo> {
    let items = state.db.library_list()?;
    Ok(StorageInfo {
        total_bytes: state.db.usage(),
        library_bytes: items.iter().map(|i| i.size).sum(),
        items: items.len(),
        data_dir: state.db.dir.display().to_string(),
    })
}

// ------------------------------------------------------------------ respaldo

#[tauri::command]
fn backup_export(state: State<AppState>, password: Option<String>, include_scores: Option<bool>) -> Res<Response> {
    let kv: serde_json::Map<String, serde_json::Value> = state.db.kv_all()?.into_iter().map(|(k, v)| (k, serde_json::Value::String(v))).collect();
    let mut library = Vec::new();
    for it in state.db.library_list()? {
        let mut entry = serde_json::to_value(&it).map_err(|e| e.to_string())?;
        if include_scores.unwrap_or(true) && it.kind != "audio" {
            if let Ok(bytes) = std::fs::read(state.db.library_dir().join(&it.file)) {
                use base64::Engine as _;
                entry["content"] = serde_json::Value::String(base64::engine::general_purpose::STANDARD.encode(bytes));
            }
        }
        library.push(entry);
    }
    let payload = serde_json::json!({ "app": "mussify", "exported": db::now(), "kv": kv, "library": library });
    Ok(Response::new(backup::seal(&payload, password.as_deref())?))
}

#[tauri::command]
fn backup_import(state: State<AppState>, request: Request<'_>) -> Res<usize> {
    let InvokeBody::Raw(bytes) = request.body() else { return Err("E_BAD_REQUEST".into()) };
    let pw = request.headers().get("x-password").and_then(|v| v.to_str().ok()).map(percent_decode);
    let payload = backup::open(bytes, pw.as_deref())?;
    let kv = payload["kv"].as_object().ok_or("E_NOT_BACKUP")?;
    let mut n = 0;
    for (k, v) in kv {
        // la configuración de red no se importa: siempre arranca apagada
        if k == "network.allowed" {
            continue;
        }
        if let Some(s) = v.as_str() {
            state.db.kv_set(k, s)?;
            n += 1;
        }
    }
    if let Some(items) = payload["library"].as_array() {
        for it in items {
            let Some(content) = it["content"].as_str() else { continue };
            use base64::Engine as _;
            let Ok(bytes) = base64::engine::general_purpose::STANDARD.decode(content) else { continue };
            let Ok(mut item) = serde_json::from_value::<LibraryItem>(it.clone()) else { continue };
            item.file = format!("{}.{}", item.id, safe_ext(&item.file));
            std::fs::write(state.db.library_dir().join(&item.file), bytes).map_err(|e| e.to_string())?;
            state.db.library_insert(&item)?;
        }
    }
    Ok(n)
}

#[tauri::command]
fn reset_progress(state: State<AppState>) -> Res<()> {
    let allowed = state.db.network_allowed();
    state.db.kv_clear()?;
    state.db.kv_set("network.allowed", if allowed { "true" } else { "false" })
}

// ------------------------------------------------------------------ red

#[tauri::command]
fn net_settings(state: State<AppState>, allowed: Option<bool>) -> Res<bool> {
    if let Some(a) = allowed {
        state.db.kv_set("network.allowed", if a { "true" } else { "false" })?;
    }
    Ok(state.db.network_allowed())
}

#[tauri::command]
fn net_log(state: State<AppState>, clear: Option<bool>) -> Res<Vec<db::NetEntry>> {
    if clear == Some(true) {
        state.db.net_clear()?;
    }
    state.db.net_entries()
}

#[tauri::command]
fn tools_info(state: State<AppState>) -> net::ToolInfo {
    net::tool_info(&state.db)
}

#[tauri::command]
async fn yt_search(state: State<'_, AppState>, query: String) -> Res<Vec<net::SearchResult>> {
    let db = state.db.clone();
    tauri::async_runtime::spawn_blocking(move || net::search(&db, &query)).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn yt_thumbs(state: State<'_, AppState>, ids: Vec<String>) -> Res<Vec<Option<String>>> {
    let db = state.db.clone();
    tauri::async_runtime::spawn_blocking(move || net::thumbnails(&db, &ids)).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn yt_download(state: State<'_, AppState>, id: String, title: String) -> Res<LibraryItem> {
    let db = state.db.clone();
    tauri::async_runtime::spawn_blocking(move || -> Res<LibraryItem> {
        let path = net::download(&db, &id, &title, &db.library_dir())?;
        let size = std::fs::metadata(&path).map(|m| m.len()).unwrap_or(0);
        let item = LibraryItem {
            id: new_id(),
            title: title.clone(),
            kind: "audio".into(),
            file: path.file_name().map(|f| f.to_string_lossy().to_string()).unwrap_or_default(),
            size,
            created: db::now(),
            meta: serde_json::json!({ "source": "youtube", "youtubeId": id }),
        };
        db.library_insert(&item)?;
        Ok(item)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
fn platform() -> &'static str {
    if cfg!(target_os = "android") { "android" } else if cfg!(target_os = "linux") { "linux" } else { "other" }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
            let db = Arc::new(Db::open(&dir)?);
            let engine = Engine::start();
            app.manage(AppState { engine, db, loaded: Mutex::new(None) });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            audio_play, audio_stop, audio_note, audio_status, audio_config,
            player_load, player_control, analyze_audio,
            kv_get, kv_set, library_add, library_list, library_read, library_update, library_delete, storage_info,
            backup_export, backup_import, reset_progress,
            net_settings, net_log, tools_info, yt_search, yt_thumbs, yt_download, platform
        ])
        .run(tauri::generate_context!())
        .expect("error al iniciar Mussify");
}

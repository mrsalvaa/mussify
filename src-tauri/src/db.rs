// SPDX-License-Identifier: GPL-3.0-or-later
//! Almacenamiento local en SQLite: clave-valor (progreso, ajustes), biblioteca y registro de red.

use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::Mutex;

pub struct Db {
    pub conn: Mutex<Connection>,
    pub dir: PathBuf,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LibraryItem {
    pub id: String,
    pub title: String,
    /// midi | musicxml | guitarpro | texttab | audio
    pub kind: String,
    pub file: String,
    pub size: u64,
    pub created: i64,
    /// Metadatos libres (JSON): marcadores, notas, análisis, correcciones, origen.
    pub meta: serde_json::Value,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NetEntry {
    pub id: i64,
    pub ts: i64,
    pub destination: String,
    pub reason: String,
    pub ok: bool,
}

pub fn now() -> i64 {
    std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_millis() as i64).unwrap_or(0)
}

impl Db {
    pub fn open(dir: &Path) -> Result<Db, String> {
        std::fs::create_dir_all(dir.join("library")).map_err(|e| e.to_string())?;
        let conn = Connection::open(dir.join("mussify.sqlite3")).map_err(|e| e.to_string())?;
        conn.execute_batch(
            "PRAGMA journal_mode=WAL;
             CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated INTEGER NOT NULL);
             CREATE TABLE IF NOT EXISTS library (id TEXT PRIMARY KEY, title TEXT NOT NULL, kind TEXT NOT NULL, file TEXT NOT NULL,
                 size INTEGER NOT NULL, created INTEGER NOT NULL, meta TEXT NOT NULL DEFAULT '{}');
             CREATE TABLE IF NOT EXISTS netlog (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, destination TEXT NOT NULL,
                 reason TEXT NOT NULL, ok INTEGER NOT NULL);",
        )
        .map_err(|e| e.to_string())?;
        Ok(Db { conn: Mutex::new(conn), dir: dir.to_path_buf() })
    }

    pub fn library_dir(&self) -> PathBuf {
        self.dir.join("library")
    }

    pub fn kv_get(&self, key: &str) -> Result<Option<String>, String> {
        let c = self.conn.lock().map_err(|e| e.to_string())?;
        c.query_row("SELECT value FROM kv WHERE key=?1", params![key], |r| r.get(0)).optional().map_err(|e| e.to_string())
    }

    pub fn kv_set(&self, key: &str, value: &str) -> Result<(), String> {
        let c = self.conn.lock().map_err(|e| e.to_string())?;
        c.execute("INSERT INTO kv(key,value,updated) VALUES(?1,?2,?3) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated=excluded.updated", params![key, value, now()])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn kv_all(&self) -> Result<Vec<(String, String)>, String> {
        let c = self.conn.lock().map_err(|e| e.to_string())?;
        let mut st = c.prepare("SELECT key, value FROM kv ORDER BY key").map_err(|e| e.to_string())?;
        let rows = st.query_map([], |r| Ok((r.get(0)?, r.get(1)?))).map_err(|e| e.to_string())?;
        rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
    }

    pub fn kv_clear(&self) -> Result<(), String> {
        let c = self.conn.lock().map_err(|e| e.to_string())?;
        c.execute("DELETE FROM kv", []).map_err(|e| e.to_string())?;
        Ok(())
    }

    fn row(r: &rusqlite::Row) -> rusqlite::Result<LibraryItem> {
        let meta: String = r.get(6)?;
        Ok(LibraryItem {
            id: r.get(0)?,
            title: r.get(1)?,
            kind: r.get(2)?,
            file: r.get(3)?,
            size: r.get::<_, i64>(4)? as u64,
            created: r.get(5)?,
            meta: serde_json::from_str(&meta).unwrap_or(serde_json::json!({})),
        })
    }

    pub fn library_list(&self) -> Result<Vec<LibraryItem>, String> {
        let c = self.conn.lock().map_err(|e| e.to_string())?;
        let mut st = c.prepare("SELECT id,title,kind,file,size,created,meta FROM library ORDER BY created DESC").map_err(|e| e.to_string())?;
        let rows = st.query_map([], Self::row).map_err(|e| e.to_string())?;
        rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
    }

    pub fn library_get(&self, id: &str) -> Result<LibraryItem, String> {
        let c = self.conn.lock().map_err(|e| e.to_string())?;
        c.query_row("SELECT id,title,kind,file,size,created,meta FROM library WHERE id=?1", params![id], Self::row).map_err(|_| "No existe ese elemento de la biblioteca".to_string())
    }

    pub fn library_insert(&self, it: &LibraryItem) -> Result<(), String> {
        let c = self.conn.lock().map_err(|e| e.to_string())?;
        c.execute(
            "INSERT OR REPLACE INTO library(id,title,kind,file,size,created,meta) VALUES(?1,?2,?3,?4,?5,?6,?7)",
            params![it.id, it.title, it.kind, it.file, it.size as i64, it.created, it.meta.to_string()],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn library_update(&self, id: &str, title: Option<String>, meta: Option<serde_json::Value>) -> Result<LibraryItem, String> {
        {
            let c = self.conn.lock().map_err(|e| e.to_string())?;
            if let Some(t) = title {
                c.execute("UPDATE library SET title=?2 WHERE id=?1", params![id, t]).map_err(|e| e.to_string())?;
            }
            if let Some(m) = meta {
                c.execute("UPDATE library SET meta=?2 WHERE id=?1", params![id, m.to_string()]).map_err(|e| e.to_string())?;
            }
        }
        self.library_get(id)
    }

    pub fn library_delete(&self, id: &str) -> Result<(), String> {
        let it = self.library_get(id)?;
        let _ = std::fs::remove_file(self.library_dir().join(&it.file));
        let c = self.conn.lock().map_err(|e| e.to_string())?;
        c.execute("DELETE FROM library WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn net_log(&self, destination: &str, reason: &str, ok: bool) {
        if let Ok(c) = self.conn.lock() {
            let _ = c.execute("INSERT INTO netlog(ts,destination,reason,ok) VALUES(?1,?2,?3,?4)", params![now(), destination, reason, ok as i32]);
        }
    }

    pub fn net_entries(&self) -> Result<Vec<NetEntry>, String> {
        let c = self.conn.lock().map_err(|e| e.to_string())?;
        let mut st = c.prepare("SELECT id,ts,destination,reason,ok FROM netlog ORDER BY id DESC LIMIT 500").map_err(|e| e.to_string())?;
        let rows = st
            .query_map([], |r| Ok(NetEntry { id: r.get(0)?, ts: r.get(1)?, destination: r.get(2)?, reason: r.get(3)?, ok: r.get::<_, i32>(4)? != 0 }))
            .map_err(|e| e.to_string())?;
        rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
    }

    pub fn net_clear(&self) -> Result<(), String> {
        let c = self.conn.lock().map_err(|e| e.to_string())?;
        c.execute("DELETE FROM netlog", []).map_err(|e| e.to_string())?;
        Ok(())
    }

    /// ¿El usuario permitió conexiones de red? (apagado por defecto)
    pub fn network_allowed(&self) -> bool {
        self.kv_get("network.allowed").ok().flatten().map(|v| v == "true").unwrap_or(false)
    }

    pub fn usage(&self) -> u64 {
        fn walk(p: &Path) -> u64 {
            std::fs::read_dir(p)
                .map(|rd| rd.filter_map(|e| e.ok()).map(|e| {
                    let m = e.metadata().ok();
                    if m.as_ref().map(|m| m.is_dir()).unwrap_or(false) { walk(&e.path()) } else { m.map(|m| m.len()).unwrap_or(0) }
                }).sum())
                .unwrap_or(0)
        }
        walk(&self.dir)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tmp() -> PathBuf {
        let mut b = [0u8; 8];
        getrandom::getrandom(&mut b).unwrap();
        let d = std::env::temp_dir().join(format!("mussify-test-{:x}", u64::from_le_bytes(b)));
        std::fs::create_dir_all(&d).unwrap();
        d
    }

    #[test]
    fn kv_library_netlog() {
        let d = tmp();
        let db = Db::open(&d).unwrap();
        assert!(!db.network_allowed());
        db.kv_set("network.allowed", "true").unwrap();
        assert!(db.network_allowed());
        db.kv_set("a", "1").unwrap();
        db.kv_set("a", "2").unwrap();
        assert_eq!(db.kv_get("a").unwrap().as_deref(), Some("2"));
        let it = LibraryItem { id: "x".into(), title: "Tema".into(), kind: "audio".into(), file: "x.mp3".into(), size: 3, created: 1, meta: serde_json::json!({"a": 1}) };
        db.library_insert(&it).unwrap();
        let up = db.library_update("x", Some("Otro".into()), Some(serde_json::json!({"markers": []}))).unwrap();
        assert_eq!(up.title, "Otro");
        assert_eq!(db.library_list().unwrap().len(), 1);
        db.net_log("youtube.com", "búsqueda", true);
        assert_eq!(db.net_entries().unwrap()[0].destination, "youtube.com");
        db.library_delete("x").unwrap();
        assert!(db.library_list().unwrap().is_empty());
        std::fs::remove_dir_all(d).ok();
    }
}

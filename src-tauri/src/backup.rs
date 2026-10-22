// SPDX-License-Identifier: GPL-3.0-or-later
//! Exportar / importar el progreso en un archivo JSON, con cifrado opcional por contraseña
//! (Argon2id para derivar la clave + AES-256-GCM).

use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use argon2::Argon2;
use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Envelope {
    pub format: String,
    pub version: u32,
    pub encrypted: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub salt: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nonce: Option<String>,
    /// JSON en claro (si no está cifrado) o base64 del texto cifrado.
    pub data: serde_json::Value,
}

const FORMAT: &str = "mussify-backup";

fn derive(password: &str, salt: &[u8]) -> Result<[u8; 32], String> {
    let mut key = [0u8; 32];
    Argon2::default().hash_password_into(password.as_bytes(), salt, &mut key).map_err(|e| e.to_string())?;
    Ok(key)
}

pub fn seal(payload: &serde_json::Value, password: Option<&str>) -> Result<Vec<u8>, String> {
    let env = match password.filter(|p| !p.is_empty()) {
        None => Envelope { format: FORMAT.into(), version: 1, encrypted: false, salt: None, nonce: None, data: payload.clone() },
        Some(pw) => {
            let mut salt = [0u8; 16];
            let mut nonce = [0u8; 12];
            getrandom::getrandom(&mut salt).map_err(|e| e.to_string())?;
            getrandom::getrandom(&mut nonce).map_err(|e| e.to_string())?;
            let key = derive(pw, &salt)?;
            let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| e.to_string())?;
            let ct = cipher.encrypt(Nonce::from_slice(&nonce), payload.to_string().as_bytes()).map_err(|_| "No se pudo cifrar".to_string())?;
            Envelope { format: FORMAT.into(), version: 1, encrypted: true, salt: Some(B64.encode(salt)), nonce: Some(B64.encode(nonce)), data: serde_json::Value::String(B64.encode(ct)) }
        }
    };
    serde_json::to_vec_pretty(&env).map_err(|e| e.to_string())
}

pub fn open(bytes: &[u8], password: Option<&str>) -> Result<serde_json::Value, String> {
    let env: Envelope = serde_json::from_slice(bytes).map_err(|_| "El archivo no es un respaldo de Mussify".to_string())?;
    if env.format != FORMAT {
        return Err("El archivo no es un respaldo de Mussify".into());
    }
    if !env.encrypted {
        return Ok(env.data);
    }
    let pw = password.filter(|p| !p.is_empty()).ok_or("Este respaldo está cifrado: ingresá la contraseña")?;
    let salt = B64.decode(env.salt.unwrap_or_default()).map_err(|e| e.to_string())?;
    let nonce = B64.decode(env.nonce.unwrap_or_default()).map_err(|e| e.to_string())?;
    let ct = B64.decode(env.data.as_str().unwrap_or_default()).map_err(|e| e.to_string())?;
    let key = derive(pw, &salt)?;
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| e.to_string())?;
    let pt = cipher.decrypt(Nonce::from_slice(&nonce), ct.as_ref()).map_err(|_| "Contraseña incorrecta o archivo dañado".to_string())?;
    serde_json::from_slice(&pt).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_plain_and_encrypted() {
        let v = serde_json::json!({"progress": {"mastered": ["t.sound"]}});
        let plain = seal(&v, None).unwrap();
        assert_eq!(open(&plain, None).unwrap(), v);
        let enc = seal(&v, Some("secreta")).unwrap();
        assert!(!String::from_utf8_lossy(&enc).contains("t.sound"));
        assert_eq!(open(&enc, Some("secreta")).unwrap(), v);
        assert!(open(&enc, Some("otra")).is_err());
        assert!(open(&enc, None).is_err());
        assert!(open(b"{}", None).is_err());
    }
}

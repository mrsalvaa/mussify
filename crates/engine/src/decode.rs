// SPDX-License-Identifier: GPL-3.0-or-later
//! Decodificación de audio (mp3, ogg/vorbis, flac, wav, m4a/aac) con Symphonia, todo local.

use std::io::Cursor;
use symphonia::core::audio::SampleBuffer;
use symphonia::core::codecs::DecoderOptions;
use symphonia::core::errors::Error as SymError;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::{MediaSourceStream, MediaSource};
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;

/// Audio decodificado, intercalado.
#[derive(Clone, Debug)]
pub struct Pcm {
    pub rate: u32,
    pub channels: usize,
    pub data: Vec<f32>,
}

impl Pcm {
    pub fn frames(&self) -> usize {
        self.data.len() / self.channels.max(1)
    }
    pub fn duration(&self) -> f64 {
        self.frames() as f64 / self.rate as f64
    }
    /// Mezcla a mono.
    pub fn mono(&self) -> Vec<f32> {
        let c = self.channels.max(1);
        self.data.chunks(c).map(|f| f.iter().sum::<f32>() / c as f32).collect()
    }
    /// Convierte a estéreo y re-muestrea (interpolación lineal) a la frecuencia dada.
    pub fn to_stereo_rate(&self, rate: u32) -> Pcm {
        let c = self.channels.max(1);
        let frames = self.frames();
        let ratio = self.rate as f64 / rate as f64;
        let out_frames = ((frames as f64) / ratio).floor() as usize;
        let mut data = Vec::with_capacity(out_frames * 2);
        let get = |i: usize, ch: usize| -> f32 {
            if i >= frames {
                return 0.0;
            }
            let base = i * c;
            if c == 1 { self.data[base] } else { self.data[base + ch.min(c - 1)] }
        };
        for o in 0..out_frames {
            let pos = o as f64 * ratio;
            let i = pos.floor() as usize;
            let t = (pos - i as f64) as f32;
            for ch in 0..2 {
                let a = get(i, ch);
                let b = get(i + 1, ch);
                data.push(a + (b - a) * t);
            }
        }
        Pcm { rate, channels: 2, data }
    }
}

pub fn decode_bytes(bytes: Vec<u8>, ext_hint: Option<&str>) -> Result<Pcm, String> {
    decode_source(Box::new(Cursor::new(bytes)), ext_hint)
}

pub fn decode_file(path: &std::path::Path) -> Result<Pcm, String> {
    let f = std::fs::File::open(path).map_err(|e| format!("No pude abrir el archivo: {e}"))?;
    let ext = path.extension().and_then(|e| e.to_str()).map(|s| s.to_lowercase());
    decode_source(Box::new(f), ext.as_deref())
}

fn decode_source(src: Box<dyn MediaSource>, ext_hint: Option<&str>) -> Result<Pcm, String> {
    let mss = MediaSourceStream::new(src, Default::default());
    let mut hint = Hint::new();
    if let Some(e) = ext_hint {
        hint.with_extension(e);
    }
    let probed = symphonia::default::get_probe()
        .format(&hint, mss, &FormatOptions::default(), &MetadataOptions::default())
        .map_err(|e| format!("Formato de audio no reconocido: {e}"))?;
    let mut format = probed.format;
    let track = format.default_track().ok_or("El archivo no tiene pistas de audio")?.clone();
    let mut decoder = symphonia::default::get_codecs()
        .make(&track.codec_params, &DecoderOptions::default())
        .map_err(|e| format!("Códec no soportado: {e}"))?;
    let mut rate = track.codec_params.sample_rate.unwrap_or(44100);
    let mut channels = track.codec_params.channels.map(|c| c.count()).unwrap_or(2);
    let mut data: Vec<f32> = Vec::new();
    let mut sbuf: Option<SampleBuffer<f32>> = None;
    loop {
        let packet = match format.next_packet() {
            Ok(p) => p,
            Err(SymError::IoError(_)) => break,
            Err(SymError::ResetRequired) => break,
            Err(e) => return Err(format!("Error leyendo audio: {e}")),
        };
        if packet.track_id() != track.id {
            continue;
        }
        match decoder.decode(&packet) {
            Ok(buf) => {
                let spec = *buf.spec();
                rate = spec.rate;
                channels = spec.channels.count();
                if sbuf.as_ref().map(|b| b.capacity() < buf.capacity() * channels).unwrap_or(true) {
                    sbuf = Some(SampleBuffer::<f32>::new(buf.capacity() as u64, spec));
                }
                let sb = sbuf.as_mut().unwrap();
                sb.copy_interleaved_ref(buf);
                data.extend_from_slice(sb.samples());
            }
            Err(SymError::DecodeError(_)) => continue,
            Err(e) => return Err(format!("Error decodificando: {e}")),
        }
    }
    if data.is_empty() {
        return Err("El archivo de audio está vacío".into());
    }
    Ok(Pcm { rate, channels, data })
}

/// Picos para dibujar la forma de onda (máximo absoluto por bloque).
pub fn peaks(pcm: &Pcm, buckets: usize) -> Vec<f32> {
    let frames = pcm.frames();
    let c = pcm.channels.max(1);
    let per = (frames / buckets.max(1)).max(1);
    let mut out = Vec::with_capacity(buckets);
    for b in 0..buckets {
        let start = b * per;
        if start >= frames {
            out.push(0.0);
            continue;
        }
        let end = ((b + 1) * per).min(frames);
        let mut m = 0f32;
        for i in start..end {
            for ch in 0..c {
                m = m.max(pcm.data[i * c + ch].abs());
            }
        }
        out.push(m);
    }
    out
}

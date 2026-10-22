// SPDX-License-Identifier: GPL-3.0-or-later
//! Motor de audio de Mussify.
//!
//! Un hilo dueño del stream de cpal (ALSA/PipeWire en Linux, AAudio en Android) renderiza el
//! [`mixer::Mixer`]. La app le habla por un canal de comandos; las posiciones se leen de un
//! estado compartido. No hay red ni dependencias propietarias.

pub mod decode;
pub mod dsp;
pub mod mixer;
pub mod stretch;

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use mixer::{Banks, Inst, Mixer, Sample, SeqEvent};
use std::sync::mpsc::{channel, Receiver, Sender};
use std::sync::{Arc, Mutex};

mod embedded {
    include!(concat!(env!("OUT_DIR"), "/samples.rs"));
}

pub use dsp::{EqSettings, IsolateMode};

/// Comandos que se mandan al hilo de audio.
pub enum Cmd {
    PlaySeq { channel: u8, events: Vec<SeqEvent>, delay: f64 },
    StopChannel(u8),
    StopAll,
    NoteOn { inst: Inst, note: u8, vel: f32 },
    NoteOff { inst: Inst, note: u8 },
    SetA4(f32),
    SetMaster(f32),
    PlayerLoad(Arc<Vec<f32>>),
    PlayerUnload,
    PlayerPlay(bool),
    PlayerSeek(f64),
    PlayerSpeed(f64),
    PlayerLoop(Option<(f64, f64)>),
    PlayerVolume(f32),
    SetEq(EqSettings),
}

/// Estado que el hilo de audio publica para la UI.
#[derive(Clone, Debug, Default, serde::Serialize)]
pub struct Status {
    pub rate: u32,
    pub channels: Vec<(u8, f64, f64)>,
    pub player: Option<(f64, f64, bool)>,
    pub device: String,
    pub ok: bool,
    pub error: Option<String>,
}

pub struct Engine {
    tx: Mutex<Sender<Cmd>>,
    status: Arc<Mutex<Status>>,
    pub rate: u32,
}

/// Carga y normaliza los samples embebidos.
pub fn load_banks() -> Banks {
    let mut banks = Banks::default();
    for (name, bytes) in embedded::SAMPLES {
        let Some((bank, note)) = name.rsplit_once('_') else { continue };
        let Ok(note) = note.parse::<u8>() else { continue };
        let Ok(pcm) = decode::decode_bytes(bytes.to_vec(), Some("ogg")) else { continue };
        let mut mono = pcm.mono();
        let peak = mono.iter().fold(0f32, |a, x| a.max(x.abs()));
        if peak > 0.0 {
            let g = 0.6 / peak;
            mono.iter_mut().for_each(|x| *x *= g);
        }
        let key: &'static str = match bank {
            "piano" => "piano",
            "guitar" => "guitar",
            "guitarDist" => "guitarDist",
            "bass" => "bass",
            "drums" => "drums",
            _ => continue,
        };
        banks.banks.entry(key).or_default().push(Sample { note, data: Arc::new(mono), rate: pcm.rate });
    }
    for b in banks.banks.values_mut() {
        b.sort_by_key(|s| s.note);
    }
    banks
}

impl Engine {
    /// Arranca el hilo de audio. Si no hay dispositivo, el motor funciona "en silencio"
    /// (la app no se rompe) e informa el error en [`Status`].
    pub fn start() -> Arc<Engine> {
        let (tx, rx) = channel::<Cmd>();
        let status = Arc::new(Mutex::new(Status::default()));
        let st = status.clone();
        let (rate_tx, rate_rx) = channel::<u32>();
        std::thread::Builder::new()
            .name("mussify-audio".into())
            .spawn(move || audio_thread(rx, st, rate_tx))
            .expect("hilo de audio");
        let rate = rate_rx.recv_timeout(std::time::Duration::from_secs(5)).unwrap_or(48000);
        Arc::new(Engine { tx: Mutex::new(tx), status, rate })
    }

    pub fn send(&self, cmd: Cmd) {
        if let Ok(tx) = self.tx.lock() {
            let _ = tx.send(cmd);
        }
    }

    pub fn status(&self) -> Status {
        self.status.lock().map(|s| s.clone()).unwrap_or_default()
    }
}

fn apply(m: &mut Mixer, cmd: Cmd) {
    match cmd {
        Cmd::PlaySeq { channel, events, delay } => m.play_sequence(channel, events, delay),
        Cmd::StopChannel(c) => m.stop_channel(c),
        Cmd::StopAll => m.stop_all(),
        Cmd::NoteOn { inst, note, vel } => m.note_on(inst, note, vel, 255, None),
        Cmd::NoteOff { inst, note } => m.note_off(inst, note, 255),
        Cmd::SetA4(f) => m.a4 = f,
        Cmd::SetMaster(v) => m.master = v,
        Cmd::PlayerLoad(d) => m.player_load(d),
        Cmd::PlayerUnload => m.player = None,
        Cmd::PlayerPlay(p) => {
            if let Some(pl) = m.player.as_mut() {
                pl.playing = p;
            }
        }
        Cmd::PlayerSeek(s) => m.player_seek(s),
        Cmd::PlayerSpeed(s) => {
            let pos = m.player_position().map(|p| p.0);
            if let Some(pl) = m.player.as_mut() {
                pl.speed = s.clamp(0.25, 2.0);
            }
            if let Some(p) = pos {
                m.player_seek(p);
            }
        }
        Cmd::PlayerLoop(l) => {
            if let Some(pl) = m.player.as_mut() {
                pl.loop_ab = l;
            }
        }
        Cmd::PlayerVolume(v) => {
            if let Some(pl) = m.player.as_mut() {
                pl.volume = v;
            }
        }
        Cmd::SetEq(e) => m.set_eq(e),
    }
}

fn publish(m: &Mixer, st: &Arc<Mutex<Status>>) {
    if let Ok(mut s) = st.try_lock() {
        s.channels = (0u8..8).filter_map(|c| m.channel_position(c).map(|(p, d)| (c, p, d))).collect();
        s.player = m.player_position();
    }
}

fn audio_thread(rx: Receiver<Cmd>, st: Arc<Mutex<Status>>, rate_tx: Sender<u32>) {
    let banks = Arc::new(load_banks());
    let host = cpal::default_host();
    let device = host.default_output_device();
    let fail = |msg: String, st: &Arc<Mutex<Status>>| {
        log::warn!("audio: {msg}");
        if let Ok(mut s) = st.lock() {
            s.ok = false;
            s.error = Some(msg);
        }
    };
    let Some(device) = device else {
        fail("No hay dispositivo de salida de audio".into(), &st);
        let _ = rate_tx.send(48000);
        // Seguimos consumiendo comandos para no bloquear a nadie.
        let mut m = Mixer::new(48000, banks);
        while let Ok(c) = rx.recv() {
            apply(&mut m, c);
        }
        return;
    };
    let cfg = match device.default_output_config() {
        Ok(c) => c,
        Err(e) => {
            fail(format!("Sin configuración de salida: {e}"), &st);
            let _ = rate_tx.send(48000);
            return;
        }
    };
    let rate = cfg.sample_rate();
    let channels = cfg.channels() as usize;
    let _ = rate_tx.send(rate);
    let mixer = Arc::new(Mutex::new(Mixer::new(rate, banks)));
    let mut config: cpal::StreamConfig = cfg.config();
    config.buffer_size = cpal::BufferSize::Fixed(512);
    let build = |config: cpal::StreamConfig| {
        let m = mixer.clone();
        let st2 = st.clone();
        let mut counter = 0u32;
        device.build_output_stream::<f32, _, _>(
            config,
            move |out: &mut [f32], _| {
                if let Ok(mut mx) = m.try_lock() {
                    mx.render(out, channels);
                    counter = counter.wrapping_add(1);
                    if counter % 4 == 0 {
                        publish(&mx, &st2);
                    }
                } else {
                    out.iter_mut().for_each(|x| *x = 0.0);
                }
            },
            |e| log::warn!("error de stream: {e}"),
            None,
        )
    };
    let stream = match build(config.clone()) {
        Ok(s) => s,
        Err(_) => {
            config.buffer_size = cpal::BufferSize::Default;
            match build(config) {
                Ok(s) => s,
                Err(e) => {
                    fail(format!("No pude abrir la salida de audio: {e}"), &st);
                    return;
                }
            }
        }
    };
    if let Err(e) = stream.play() {
        fail(format!("No pude iniciar el audio: {e}"), &st);
    } else if let Ok(mut s) = st.lock() {
        s.ok = true;
        s.rate = rate;
        s.device = device.description().map(|d| d.to_string()).unwrap_or_default();
    }
    // Bucle de comandos: se aplican con el mutex del mezclador (secciones cortas).
    while let Ok(cmd) = rx.recv() {
        if let Ok(mut mx) = mixer.lock() {
            apply(&mut mx, cmd);
            while let Ok(c) = rx.try_recv() {
                apply(&mut mx, c);
            }
            publish(&mx, &st);
        }
    }
    drop(stream);
}

// SPDX-License-Identifier: GPL-3.0-or-later
//! Mezclador: sampler multi-instrumento, secuenciador con tiempos exactos, metrónomo
//! sintetizado y reproductor de canciones. Es independiente del dispositivo de audio
//! (se puede renderizar en tests).

use crate::dsp::{EqSettings, Equalizer};
use crate::stretch::Wsola;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Inst {
    Piano,
    Guitar,
    GuitarDist,
    Bass,
    Drums,
    Click,
}

impl Inst {
    pub fn bank_name(self) -> &'static str {
        match self {
            Inst::Piano => "piano",
            Inst::Guitar => "guitar",
            Inst::GuitarDist => "guitarDist",
            Inst::Bass => "bass",
            Inst::Drums => "drums",
            Inst::Click => "click",
        }
    }
}

/// Evento de una secuencia (tiempos en segundos desde el inicio).
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SeqEvent {
    pub time: f64,
    pub duration: f64,
    pub note: u8,
    pub velocity: f32,
    pub instrument: Inst,
}

pub struct Sample {
    pub note: u8,
    pub data: Arc<Vec<f32>>,
    pub rate: u32,
}

#[derive(Default)]
pub struct Banks {
    pub banks: HashMap<&'static str, Vec<Sample>>,
}

impl Banks {
    fn nearest(&self, inst: Inst, note: u8) -> Option<&Sample> {
        let bank = self.banks.get(inst.bank_name())?;
        if inst == Inst::Drums {
            return bank.iter().find(|s| s.note == note).or_else(|| bank.iter().min_by_key(|s| (s.note as i32 - note as i32).abs()));
        }
        bank.iter().min_by_key(|s| (s.note as i32 - note as i32).abs())
    }
}

struct Voice {
    data: Arc<Vec<f32>>,
    pos: f64,
    step: f64,
    gain: f32,
    /// Frames que faltan para soltar la nota (None = sostener hasta note-off).
    hold: Option<u64>,
    release: f32,
    releasing: bool,
    env: f32,
    channel: u8,
    note: u8,
    inst: Inst,
    // click sintetizado
    click_freq: f32,
    click_len: u32,
    click_t: u32,
}

struct Scheduled {
    frame: u64,
    ev: SeqEvent,
    channel: u8,
}

pub struct SongPlayer {
    pub data: Arc<Vec<f32>>,
    pub frames: usize,
    pub playing: bool,
    pub speed: f64,
    pub loop_ab: Option<(f64, f64)>,
    pub volume: f32,
    wsola: Wsola,
    pos: f64,
}

pub struct Mixer {
    pub rate: u32,
    pub frame: u64,
    banks: Arc<Banks>,
    voices: Vec<Voice>,
    queue: Vec<Scheduled>,
    /// Inicio (en frames) y duración de la secuencia de cada canal.
    channel_start: HashMap<u8, (u64, f64)>,
    pub a4: f32,
    pub master: f32,
    pub player: Option<SongPlayer>,
    eq: Equalizer,
    scratch: Vec<f32>,
}

const MAX_VOICES: usize = 96;

impl Mixer {
    pub fn new(rate: u32, banks: Arc<Banks>) -> Self {
        Mixer {
            rate,
            frame: 0,
            banks,
            voices: Vec::with_capacity(MAX_VOICES),
            queue: Vec::new(),
            channel_start: HashMap::new(),
            a4: 440.0,
            master: 0.8,
            player: None,
            eq: Equalizer::new(rate as f32),
            scratch: Vec::new(),
        }
    }

    // ------------------------------------------------------------ secuencias
    pub fn play_sequence(&mut self, channel: u8, events: Vec<SeqEvent>, delay: f64) {
        self.stop_channel(channel);
        let start = self.frame + (delay * self.rate as f64) as u64;
        let dur = events.iter().map(|e| e.time + e.duration).fold(0.0, f64::max);
        self.channel_start.insert(channel, (start, dur));
        for ev in events {
            let frame = start + (ev.time * self.rate as f64).max(0.0) as u64;
            self.queue.push(Scheduled { frame, ev, channel });
        }
        self.queue.sort_by_key(|s| std::cmp::Reverse(s.frame));
    }

    pub fn stop_channel(&mut self, channel: u8) {
        self.queue.retain(|s| s.channel != channel);
        for v in self.voices.iter_mut().filter(|v| v.channel == channel) {
            v.releasing = true;
        }
        self.channel_start.remove(&channel);
    }

    pub fn stop_all(&mut self) {
        self.queue.clear();
        for v in self.voices.iter_mut() {
            v.releasing = true;
        }
        self.channel_start.clear();
    }

    /// Posición (s) de la secuencia de un canal; negativa antes de empezar, None si no hay.
    pub fn channel_position(&self, channel: u8) -> Option<(f64, f64)> {
        self.channel_start.get(&channel).map(|(start, dur)| ((self.frame as f64 - *start as f64) / self.rate as f64, *dur))
    }

    pub fn note_on(&mut self, inst: Inst, note: u8, vel: f32, channel: u8, hold_secs: Option<f64>) {
        if inst == Inst::Click {
            let (freq, gain) = match note {
                3 => (1760.0, 1.0),
                2 => (1320.0, 0.85),
                1 => (880.0, 0.7),
                _ => (1100.0, 0.45),
            };
            self.push_voice(Voice {
                data: Arc::new(Vec::new()),
                pos: 0.0,
                step: 0.0,
                gain: gain * vel,
                hold: None,
                release: 0.0,
                releasing: false,
                env: 1.0,
                channel,
                note,
                inst,
                click_freq: freq,
                click_len: (self.rate as f32 * 0.045) as u32,
                click_t: 0,
            });
            return;
        }
        let Some(s) = self.banks.nearest(inst, note) else { return };
        let tuning = (self.a4 / 440.0) as f64;
        let semis = if inst == Inst::Drums { 0.0 } else { note as f64 - s.note as f64 };
        let step = 2f64.powf(semis / 12.0) * (s.rate as f64 / self.rate as f64) * if inst == Inst::Drums { 1.0 } else { tuning };
        let release = match inst {
            Inst::Drums => 0.6,
            Inst::Piano => 0.35,
            _ => 0.18,
        };
        let data = s.data.clone();
        self.push_voice(Voice {
            data,
            pos: 0.0,
            step,
            gain: vel.clamp(0.0, 1.0) * if inst == Inst::Drums { 0.9 } else { 0.7 },
            hold: hold_secs.map(|h| (h * self.rate as f64) as u64),
            release: release * self.rate as f32,
            releasing: false,
            env: 1.0,
            channel,
            note,
            inst,
            click_freq: 0.0,
            click_len: 0,
            click_t: 0,
        });
    }

    pub fn note_off(&mut self, inst: Inst, note: u8, channel: u8) {
        for v in self.voices.iter_mut().filter(|v| v.inst == inst && v.note == note && v.channel == channel && v.hold.is_none()) {
            v.releasing = true;
        }
    }

    fn push_voice(&mut self, v: Voice) {
        if self.voices.len() >= MAX_VOICES {
            // robar la voz más vieja
            self.voices.remove(0);
        }
        self.voices.push(v);
    }

    // ------------------------------------------------------------ reproductor
    pub fn player_load(&mut self, data: Arc<Vec<f32>>) {
        let frames = data.len() / 2;
        self.player = Some(SongPlayer { data, frames, playing: false, speed: 1.0, loop_ab: None, volume: 1.0, wsola: Wsola::new(self.rate), pos: 0.0 });
    }

    pub fn player_seek(&mut self, secs: f64) {
        let rate = self.rate as f64;
        if let Some(p) = self.player.as_mut() {
            p.pos = (secs * rate).clamp(0.0, p.frames as f64);
            p.wsola.reset(p.pos);
        }
    }

    pub fn player_position(&self) -> Option<(f64, f64, bool)> {
        self.player.as_ref().map(|p| {
            let pos = if (p.speed - 1.0).abs() < 1e-6 { p.pos } else { p.wsola.audible_pos(p.speed) };
            (pos / self.rate as f64, p.frames as f64 / self.rate as f64, p.playing)
        })
    }

    pub fn set_eq(&mut self, s: EqSettings) {
        self.eq.set(s);
    }

    pub fn eq_settings(&self) -> EqSettings {
        self.eq.settings()
    }

    // ------------------------------------------------------------ render
    /// Renderiza `out.len()/channels` frames intercalados.
    pub fn render(&mut self, out: &mut [f32], channels: usize) {
        let frames = out.len() / channels.max(1);
        out.iter_mut().for_each(|x| *x = 0.0);
        // Reproductor de canción (estéreo, con WSOLA y EQ)
        if self.scratch.len() < frames * 2 {
            self.scratch.resize(frames * 2, 0.0);
        }
        let mut have_song = false;
        if let Some(p) = self.player.as_mut() {
            if p.playing {
                have_song = true;
                let buf = &mut self.scratch[..frames * 2];
                if (p.speed - 1.0).abs() < 1e-6 {
                    for i in 0..frames {
                        let f = p.pos as usize;
                        if f < p.frames {
                            buf[i * 2] = p.data[f * 2];
                            buf[i * 2 + 1] = p.data[f * 2 + 1];
                        } else {
                            buf[i * 2] = 0.0;
                            buf[i * 2 + 1] = 0.0;
                        }
                        p.pos += 1.0;
                        if let Some((a, b)) = p.loop_ab {
                            if p.pos >= b * self.rate as f64 {
                                p.pos = a * self.rate as f64;
                            }
                        }
                    }
                    p.wsola.reset(p.pos);
                } else {
                    // De a bloques cortos para poder respetar el loop A-B
                    let block = 256;
                    let mut i = 0;
                    while i < frames {
                        let n = block.min(frames - i);
                        p.wsola.render(&p.data, p.speed, &mut buf[i * 2..(i + n) * 2]);
                        i += n;
                        if let Some((a, b)) = p.loop_ab {
                            if p.wsola.pos >= b * self.rate as f64 {
                                p.wsola.reset(a * self.rate as f64);
                            }
                        }
                    }
                    p.pos = p.wsola.pos;
                }
                if p.pos as usize >= p.frames && p.loop_ab.is_none() {
                    p.playing = false;
                }
                let vol = p.volume;
                for i in 0..frames {
                    for ch in 0..2 {
                        buf[i * 2 + ch] = self.eq.process(ch, buf[i * 2 + ch]) * vol;
                    }
                }
            }
        }
        for i in 0..frames {
            // Disparar eventos programados para este frame
            while let Some(s) = self.queue.last() {
                if s.frame > self.frame {
                    break;
                }
                let s = self.queue.pop().unwrap();
                let hold = if s.ev.instrument == Inst::Drums || s.ev.instrument == Inst::Click { Some(10.0) } else { Some(s.ev.duration) };
                self.note_on(s.ev.instrument, s.ev.note, s.ev.velocity, s.channel, hold);
            }
            let mut l = 0.0f32;
            for v in self.voices.iter_mut() {
                let x = if v.inst == Inst::Click {
                    if v.click_t >= v.click_len {
                        v.env = 0.0;
                        0.0
                    } else {
                        let t = v.click_t as f32 / self.rate as f32;
                        let e = (-(v.click_t as f32) / (v.click_len as f32 * 0.25)).exp();
                        v.click_t += 1;
                        (2.0 * std::f32::consts::PI * v.click_freq * t).sin() * e * v.gain
                    }
                } else {
                    let idx = v.pos as usize;
                    if idx + 1 >= v.data.len() {
                        v.env = 0.0;
                        0.0
                    } else {
                        let t = (v.pos - idx as f64) as f32;
                        let s = v.data[idx] + (v.data[idx + 1] - v.data[idx]) * t;
                        v.pos += v.step;
                        if let Some(h) = v.hold.as_mut() {
                            if *h == 0 {
                                v.releasing = true;
                            } else {
                                *h -= 1;
                            }
                        }
                        if v.releasing {
                            v.env -= 1.0 / v.release.max(1.0);
                        }
                        s * v.gain * v.env.max(0.0)
                    }
                };
                l += x;
            }
            let mut left = l * self.master;
            let mut right = left;
            if have_song {
                left += self.scratch[i * 2] * self.master;
                right += self.scratch[i * 2 + 1] * self.master;
            }
            // limitador suave
            let soft = |x: f32| if x.abs() < 0.8 { x } else { x.signum() * (0.8 + (1.0 - (-(x.abs() - 0.8) * 4.0).exp()) * 0.2) };
            if channels >= 2 {
                out[i * channels] = soft(left);
                out[i * channels + 1] = soft(right);
            } else if channels == 1 {
                out[i] = soft((left + right) * 0.5);
            }
            self.voices.retain(|v| v.env > 0.0);
            self.frame += 1;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn banks() -> Arc<Banks> {
        let mut b = Banks::default();
        let sine: Vec<f32> = (0..44100).map(|i| (2.0 * std::f32::consts::PI * 261.63 * i as f32 / 44100.0).sin() * 0.5).collect();
        b.banks.insert("piano", vec![Sample { note: 60, data: Arc::new(sine), rate: 44100 }]);
        Arc::new(b)
    }

    #[test]
    fn sequence_plays_at_exact_time() {
        let mut m = Mixer::new(48000, banks());
        m.play_sequence(0, vec![SeqEvent { time: 0.5, duration: 0.2, note: 60, velocity: 1.0, instrument: Inst::Piano }], 0.0);
        let mut out = vec![0.0; 48000 * 2];
        m.render(&mut out, 2);
        let first = out.chunks(2).position(|f| f[0].abs() > 1e-4).unwrap();
        assert_eq!(first, 24000 + 1);
        let (pos, dur) = m.channel_position(0).unwrap();
        assert!((pos - 1.0).abs() < 1e-6 && (dur - 0.7).abs() < 1e-9);
    }

    #[test]
    fn clicks_and_stop() {
        let mut m = Mixer::new(48000, banks());
        m.play_sequence(1, (0..4).map(|i| SeqEvent { time: i as f64 * 0.25, duration: 0.05, note: 2, velocity: 1.0, instrument: Inst::Click }).collect(), 0.0);
        let mut out = vec![0.0; 4800 * 2];
        m.render(&mut out, 2);
        assert!(out.iter().any(|x| x.abs() > 0.1));
        m.stop_channel(1);
        assert!(m.channel_position(1).is_none());
    }

    #[test]
    fn song_player_loops_ab() {
        let mut m = Mixer::new(1000, banks());
        let data: Vec<f32> = (0..10000).flat_map(|i| [i as f32 / 10000.0, i as f32 / 10000.0]).collect();
        m.player_load(Arc::new(data));
        let p = m.player.as_mut().unwrap();
        p.playing = true;
        p.loop_ab = Some((2.0, 3.0));
        m.player_seek(2.5);
        let mut out = vec![0.0; 1000 * 2];
        m.render(&mut out, 2);
        let (pos, _, playing) = m.player_position().unwrap();
        assert!(playing);
        assert!((2.0..3.0).contains(&pos), "pos {pos}");
    }
}

// SPDX-License-Identifier: GPL-3.0-or-later
//! Cambio de tempo sin cambiar la altura: WSOLA (Waveform Similarity Overlap-Add) en tiempo real.
//!
//! Trabaja sobre audio estéreo intercalado ya cargado en memoria. En cada paso toma un segmento
//! ventaneado (Hann) cerca de la posición nominal de lectura, eligiendo el desplazamiento cuya
//! forma de onda mejor continúa al segmento anterior, y lo superpone con 50 % de solapamiento.

pub struct Wsola {
    win: usize,
    hop: usize,
    search: usize,
    window: Vec<f32>,
    /// Cola pendiente de sumar (hop frames estéreo).
    tail: Vec<f32>,
    /// Salida lista para entregar.
    ready: Vec<f32>,
    ready_pos: usize,
    /// Posición nominal de análisis (en frames del original).
    pub pos: f64,
    prev_start: Option<isize>,
}

impl Wsola {
    pub fn new(rate: u32) -> Self {
        // ~40 ms de ventana, ±10 ms de búsqueda.
        let win = ((rate as f32 * 0.04) as usize).next_power_of_two().max(512);
        let hop = win / 2;
        let search = (rate as f32 * 0.010) as usize;
        let window = (0..win).map(|i| 0.5 - 0.5 * (2.0 * std::f32::consts::PI * i as f32 / win as f32).cos()).collect();
        Wsola { win, hop, search, window, tail: vec![0.0; hop * 2], ready: Vec::new(), ready_pos: 0, pos: 0.0, prev_start: None }
    }

    pub fn reset(&mut self, pos: f64) {
        self.pos = pos;
        self.prev_start = None;
        self.tail.iter_mut().for_each(|x| *x = 0.0);
        self.ready.clear();
        self.ready_pos = 0;
    }

    fn sample(data: &[f32], frame: isize, ch: usize) -> f32 {
        if frame < 0 {
            return 0.0;
        }
        let i = frame as usize * 2 + ch;
        if i < data.len() { data[i] } else { 0.0 }
    }

    /// Correlación (mono) entre dos tramos, sub-muestreada para que sea barata.
    fn similarity(data: &[f32], a: isize, b: isize, len: usize) -> f32 {
        let mut acc = 0.0f32;
        let mut i = 0;
        while i < len {
            let x = Self::sample(data, a + i as isize, 0) + Self::sample(data, a + i as isize, 1);
            let y = Self::sample(data, b + i as isize, 0) + Self::sample(data, b + i as isize, 1);
            acc += x * y;
            i += 4;
        }
        acc
    }

    fn step(&mut self, data: &[f32], rate: f64) {
        let target = self.pos.round() as isize;
        let start = match self.prev_start {
            None => target,
            Some(prev) => {
                let natural = prev + self.hop as isize;
                let mut best = target;
                let mut best_v = f32::MIN;
                let s = self.search as isize;
                let mut k = -s;
                while k <= s {
                    let cand = target + k;
                    let v = Self::similarity(data, cand, natural, self.hop);
                    if v > best_v {
                        best_v = v;
                        best = cand;
                    }
                    k += 2;
                }
                best
            }
        };
        self.prev_start = Some(start);
        // superponer
        self.ready.resize(self.hop * 2, 0.0);
        for i in 0..self.hop {
            for ch in 0..2 {
                self.ready[i * 2 + ch] = self.tail[i * 2 + ch] + Self::sample(data, start + i as isize, ch) * self.window[i];
            }
        }
        for i in 0..self.hop {
            for ch in 0..2 {
                let j = i + self.hop;
                self.tail[i * 2 + ch] = Self::sample(data, start + j as isize, ch) * self.window[j];
            }
        }
        self.ready_pos = 0;
        self.pos += self.hop as f64 * rate;
    }

    /// Escribe `out.len()/2` frames estéreo a velocidad `rate` (0.5 = mitad de tempo).
    pub fn render(&mut self, data: &[f32], rate: f64, out: &mut [f32]) {
        let mut o = 0;
        while o < out.len() {
            if self.ready_pos >= self.ready.len() {
                self.step(data, rate);
            }
            let n = (self.ready.len() - self.ready_pos).min(out.len() - o);
            out[o..o + n].copy_from_slice(&self.ready[self.ready_pos..self.ready_pos + n]);
            self.ready_pos += n;
            o += n;
        }
    }

    /// Posición audible aproximada (descontando lo que está en el búfer).
    pub fn audible_pos(&self, rate: f64) -> f64 {
        let pending = (self.ready.len() - self.ready_pos) as f64 / 2.0;
        (self.pos - pending * rate - self.hop as f64 * rate).max(0.0)
    }

    pub fn window(&self) -> usize {
        self.win
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sine(rate: u32, f: f32, secs: f32) -> Vec<f32> {
        let n = (rate as f32 * secs) as usize;
        let mut v = Vec::with_capacity(n * 2);
        for i in 0..n {
            let x = (2.0 * std::f32::consts::PI * f * i as f32 / rate as f32).sin() * 0.5;
            v.push(x);
            v.push(x);
        }
        v
    }

    /// Frecuencia estimada contando cruces por cero.
    fn zero_cross_freq(x: &[f32], rate: u32) -> f32 {
        let mono: Vec<f32> = x.chunks(2).map(|c| c[0]).collect();
        let mut n = 0;
        for i in 1..mono.len() {
            if mono[i - 1] <= 0.0 && mono[i] > 0.0 {
                n += 1;
            }
        }
        n as f32 / (mono.len() as f32 / rate as f32)
    }

    #[test]
    fn half_speed_keeps_pitch_and_doubles_length() {
        let rate = 44100;
        let input = sine(rate, 440.0, 2.0);
        let mut w = Wsola::new(rate);
        let mut out = vec![0.0; rate as usize * 2 * 3]; // 3 s de salida
        w.render(&input, 0.5, &mut out);
        // 3 s de salida a mitad de velocidad consumen ~1.5 s de entrada
        assert!((w.pos / rate as f64 - 1.5).abs() < 0.1, "pos {}", w.pos);
        let f = zero_cross_freq(&out[(rate as usize) * 2..(rate as usize) * 4], rate);
        assert!((f - 440.0).abs() < 8.0, "frecuencia {f}");
    }

    #[test]
    fn faster_keeps_pitch() {
        let rate = 44100;
        let input = sine(rate, 220.0, 3.0);
        let mut w = Wsola::new(rate);
        let mut out = vec![0.0; rate as usize * 2];
        w.render(&input, 1.5, &mut out);
        let f = zero_cross_freq(&out[(rate as usize / 4) * 2..], rate);
        assert!((f - 220.0).abs() < 6.0, "frecuencia {f}");
        assert!((w.pos / rate as f64 - 1.5).abs() < 0.1);
    }
}

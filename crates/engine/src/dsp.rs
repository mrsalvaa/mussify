// SPDX-License-Identifier: GPL-3.0-or-later
//! Filtros biquad (fórmulas de R. Bristow-Johnson) y ecualizador de 3 bandas con modos de aislamiento.

use std::f32::consts::PI;

#[derive(Clone, Copy, Debug, Default)]
pub struct Biquad {
    b0: f32,
    b1: f32,
    b2: f32,
    a1: f32,
    a2: f32,
    z1: f32,
    z2: f32,
}

impl Biquad {
    fn from(b0: f32, b1: f32, b2: f32, a0: f32, a1: f32, a2: f32) -> Self {
        Biquad { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0, z1: 0.0, z2: 0.0 }
    }
    pub fn identity() -> Self {
        Biquad { b0: 1.0, ..Default::default() }
    }
    pub fn lowpass(rate: f32, f: f32, q: f32) -> Self {
        let w = 2.0 * PI * f / rate;
        let (s, c) = w.sin_cos();
        let alpha = s / (2.0 * q);
        Self::from((1.0 - c) / 2.0, 1.0 - c, (1.0 - c) / 2.0, 1.0 + alpha, -2.0 * c, 1.0 - alpha)
    }
    pub fn highpass(rate: f32, f: f32, q: f32) -> Self {
        let w = 2.0 * PI * f / rate;
        let (s, c) = w.sin_cos();
        let alpha = s / (2.0 * q);
        Self::from((1.0 + c) / 2.0, -(1.0 + c), (1.0 + c) / 2.0, 1.0 + alpha, -2.0 * c, 1.0 - alpha)
    }
    pub fn peaking(rate: f32, f: f32, q: f32, gain_db: f32) -> Self {
        let a = 10f32.powf(gain_db / 40.0);
        let w = 2.0 * PI * f / rate;
        let (s, c) = w.sin_cos();
        let alpha = s / (2.0 * q);
        Self::from(1.0 + alpha * a, -2.0 * c, 1.0 - alpha * a, 1.0 + alpha / a, -2.0 * c, 1.0 - alpha / a)
    }
    pub fn low_shelf(rate: f32, f: f32, gain_db: f32) -> Self {
        let a = 10f32.powf(gain_db / 40.0);
        let w = 2.0 * PI * f / rate;
        let (s, c) = w.sin_cos();
        let alpha = s / 2.0 * (2.0f32).sqrt();
        let sa = 2.0 * a.sqrt() * alpha;
        Self::from(
            a * ((a + 1.0) - (a - 1.0) * c + sa),
            2.0 * a * ((a - 1.0) - (a + 1.0) * c),
            a * ((a + 1.0) - (a - 1.0) * c - sa),
            (a + 1.0) + (a - 1.0) * c + sa,
            -2.0 * ((a - 1.0) + (a + 1.0) * c),
            (a + 1.0) + (a - 1.0) * c - sa,
        )
    }
    pub fn high_shelf(rate: f32, f: f32, gain_db: f32) -> Self {
        let a = 10f32.powf(gain_db / 40.0);
        let w = 2.0 * PI * f / rate;
        let (s, c) = w.sin_cos();
        let alpha = s / 2.0 * (2.0f32).sqrt();
        let sa = 2.0 * a.sqrt() * alpha;
        Self::from(
            a * ((a + 1.0) + (a - 1.0) * c + sa),
            -2.0 * a * ((a - 1.0) + (a + 1.0) * c),
            a * ((a + 1.0) + (a - 1.0) * c - sa),
            (a + 1.0) - (a - 1.0) * c + sa,
            2.0 * ((a - 1.0) - (a + 1.0) * c),
            (a + 1.0) - (a - 1.0) * c - sa,
        )
    }
    #[inline]
    pub fn process(&mut self, x: f32) -> f32 {
        let y = self.b0 * x + self.z1;
        self.z1 = self.b1 * x - self.a1 * y + self.z2;
        self.z2 = self.b2 * x - self.a2 * y;
        y
    }
    /// Copia coeficientes manteniendo el estado (cambios sin clics).
    pub fn set_coeffs(&mut self, o: &Biquad) {
        self.b0 = o.b0;
        self.b1 = o.b1;
        self.b2 = o.b2;
        self.a1 = o.a1;
        self.a2 = o.a2;
    }
}

#[derive(Clone, Copy, Debug, PartialEq, serde::Serialize, serde::Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub enum IsolateMode {
    #[default]
    Off,
    /// Solo graves (bajo, bombo): pasa-bajos.
    Bass,
    /// Solo medios (voces, guitarras): pasa-banda.
    Mids,
    /// Solo agudos (platillos, brillo): pasa-altos.
    Treble,
}

#[derive(Clone, Copy, Debug, PartialEq, serde::Serialize, serde::Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct EqSettings {
    pub low_db: f32,
    pub mid_db: f32,
    pub high_db: f32,
    pub isolate: IsolateMode,
}

/// Ecualizador estéreo: 3 bandas + filtro de aislamiento.
pub struct Equalizer {
    rate: f32,
    bands: [[Biquad; 3]; 2],
    iso: [[Biquad; 2]; 2],
    settings: EqSettings,
}

impl Equalizer {
    pub fn new(rate: f32) -> Self {
        let mut e = Equalizer { rate, bands: [[Biquad::identity(); 3]; 2], iso: [[Biquad::identity(); 2]; 2], settings: EqSettings::default() };
        e.set(EqSettings::default());
        e
    }
    pub fn set(&mut self, s: EqSettings) {
        self.settings = s;
        let low = Biquad::low_shelf(self.rate, 220.0, s.low_db);
        let mid = Biquad::peaking(self.rate, 1000.0, 0.8, s.mid_db);
        let high = Biquad::high_shelf(self.rate, 4000.0, s.high_db);
        let (i1, i2) = match s.isolate {
            IsolateMode::Off => (Biquad::identity(), Biquad::identity()),
            IsolateMode::Bass => (Biquad::lowpass(self.rate, 250.0, 0.707), Biquad::lowpass(self.rate, 250.0, 0.707)),
            IsolateMode::Mids => (Biquad::highpass(self.rate, 300.0, 0.707), Biquad::lowpass(self.rate, 3000.0, 0.707)),
            IsolateMode::Treble => (Biquad::highpass(self.rate, 2500.0, 0.707), Biquad::highpass(self.rate, 2500.0, 0.707)),
        };
        for ch in 0..2 {
            self.bands[ch][0].set_coeffs(&low);
            self.bands[ch][1].set_coeffs(&mid);
            self.bands[ch][2].set_coeffs(&high);
            self.iso[ch][0].set_coeffs(&i1);
            self.iso[ch][1].set_coeffs(&i2);
        }
    }
    pub fn settings(&self) -> EqSettings {
        self.settings
    }
    #[inline]
    pub fn process(&mut self, ch: usize, x: f32) -> f32 {
        let mut y = x;
        for b in self.bands[ch].iter_mut() {
            y = b.process(y);
        }
        for b in self.iso[ch].iter_mut() {
            y = b.process(y);
        }
        y
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn rms_through(mut f: Biquad, freq: f32, rate: f32) -> f32 {
        let n = (rate * 0.5) as usize;
        let mut acc = 0.0;
        for i in 0..n {
            let x = (2.0 * PI * freq * i as f32 / rate).sin();
            let y = f.process(x);
            if i > n / 2 {
                acc += y * y;
            }
        }
        (acc / (n / 2) as f32).sqrt()
    }

    #[test]
    fn lowpass_attenuates_highs() {
        let lp = Biquad::lowpass(48000.0, 250.0, 0.707);
        assert!(rms_through(lp, 100.0, 48000.0) > 0.6);
        assert!(rms_through(lp, 5000.0, 48000.0) < 0.02);
    }

    #[test]
    fn highpass_attenuates_lows() {
        let hp = Biquad::highpass(48000.0, 2500.0, 0.707);
        assert!(rms_through(hp, 100.0, 48000.0) < 0.01);
        assert!(rms_through(hp, 8000.0, 48000.0) > 0.6);
    }

    #[test]
    fn shelf_boosts() {
        let ls = Biquad::low_shelf(48000.0, 220.0, 12.0);
        assert!(rms_through(ls, 60.0, 48000.0) > 2.0);
        let flat = Biquad::peaking(48000.0, 1000.0, 0.8, 0.0);
        assert!((rms_through(flat, 1000.0, 48000.0) - 0.707).abs() < 0.02);
    }
}

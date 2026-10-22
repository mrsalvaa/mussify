// SPDX-License-Identifier: GPL-3.0-or-later
//! Análisis local de audio (todo en el dispositivo, nada se envía a ningún lado).
//!
//! - Tempo: envolvente de ataques (flujo espectral) + autocorrelación con preferencia por ~110 BPM.
//! - Pulsos: programación dinámica (Ellis, 2007).
//! - Compás aproximado: comparación de periodicidad de acentos cada 3 y cada 4 pulsos.
//! - Tonalidad: perfiles de Krumhansl–Kessler sobre el croma global.
//! - Acordes: croma sincronizado al pulso, plantillas mayor/menor/7 y suavizado Viterbi.
//! - Secciones: novedad sobre la matriz de auto-similitud y agrupamiento de segmentos.
//!
//! Los resultados son estimaciones: la app permite corregirlos a mano.

use rustfft::{num_complex::Complex, FftPlanner};
use serde::{Deserialize, Serialize};

pub const PC_NAMES: [&str; 12] = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ChordSeg {
    pub start: f64,
    pub end: f64,
    /// Cifrado americano ("Am", "G7") o "N" (sin acorde).
    pub chord: String,
    pub confidence: f32,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SectionSeg {
    pub start: f64,
    pub end: f64,
    /// Letra de agrupamiento (A, B, C...): segmentos con la misma letra se parecen.
    pub label: String,
    /// Nombre sugerido: intro, verso, estribillo, solo, final.
    pub name: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Analysis {
    pub duration: f64,
    pub tempo: f64,
    pub tempo_confidence: f32,
    pub beats: Vec<f64>,
    pub meter: u32,
    pub key_tonic: usize,
    pub key_mode: String,
    pub key_name: String,
    pub key_confidence: f32,
    pub chords: Vec<ChordSeg>,
    pub sections: Vec<SectionSeg>,
}

const SR: u32 = 22050;
const WIN: usize = 4096;
const HOP: usize = 512;

/// Re-muestreo simple a 22050 Hz (promedio por bloques + interpolación lineal).
fn resample(x: &[f32], rate: u32) -> Vec<f32> {
    if rate == SR {
        return x.to_vec();
    }
    let ratio = rate as f64 / SR as f64;
    // pre-filtro de caja para atenuar aliasing al bajar
    let k = ratio.floor().max(1.0) as usize;
    let smoothed: Vec<f32> = if k > 1 {
        let mut acc = 0f32;
        let mut out = Vec::with_capacity(x.len());
        for i in 0..x.len() {
            acc += x[i];
            if i >= k {
                acc -= x[i - k];
            }
            out.push(acc / k as f32);
        }
        out
    } else {
        x.to_vec()
    };
    let n = (x.len() as f64 / ratio) as usize;
    (0..n)
        .map(|i| {
            let p = i as f64 * ratio;
            let j = p as usize;
            let t = (p - j as f64) as f32;
            let a = smoothed.get(j).copied().unwrap_or(0.0);
            let b = smoothed.get(j + 1).copied().unwrap_or(a);
            a + (b - a) * t
        })
        .collect()
}

struct Spectro {
    mags: Vec<Vec<f32>>, // frames × (WIN/2)
}

fn stft(x: &[f32]) -> Spectro {
    let mut planner = FftPlanner::<f32>::new();
    let fft = planner.plan_fft_forward(WIN);
    let window: Vec<f32> = (0..WIN).map(|i| 0.5 - 0.5 * (2.0 * std::f32::consts::PI * i as f32 / WIN as f32).cos()).collect();
    let frames = if x.len() > WIN { (x.len() - WIN) / HOP + 1 } else { 1 };
    let mut mags = Vec::with_capacity(frames);
    let mut buf = vec![Complex::new(0.0f32, 0.0); WIN];
    for f in 0..frames {
        let off = f * HOP;
        for i in 0..WIN {
            let s = x.get(off + i).copied().unwrap_or(0.0);
            buf[i] = Complex::new(s * window[i], 0.0);
        }
        fft.process(&mut buf);
        mags.push(buf[..WIN / 2].iter().map(|c| c.norm()).collect());
    }
    Spectro { mags }
}

fn frame_time(f: usize) -> f64 {
    (f * HOP + WIN / 2) as f64 / SR as f64
}

/// Envolvente de ataques: flujo espectral en escala logarítmica, normalizada.
fn onset_envelope(sp: &Spectro) -> Vec<f32> {
    let mut env = vec![0f32; sp.mags.len()];
    for f in 1..sp.mags.len() {
        let mut s = 0.0;
        for b in 1..(WIN / 2).min(700) {
            let d = (1.0 + 100.0 * sp.mags[f][b]).ln() - (1.0 + 100.0 * sp.mags[f - 1][b]).ln();
            if d > 0.0 {
                s += d;
            }
        }
        env[f] = s;
    }
    // quitar tendencia (media móvil) y normalizar
    let w = 16;
    let mut out = vec![0f32; env.len()];
    for i in 0..env.len() {
        let a = i.saturating_sub(w);
        let b = (i + w).min(env.len());
        let mean = env[a..b].iter().sum::<f32>() / (b - a) as f32;
        out[i] = (env[i] - mean).max(0.0);
    }
    let sd = (out.iter().map(|x| x * x).sum::<f32>() / out.len().max(1) as f32).sqrt().max(1e-9);
    out.iter().map(|x| x / sd).collect()
}

fn estimate_tempo(env: &[f32]) -> (f64, f32) {
    let fps = SR as f64 / HOP as f64;
    let min_lag = (fps * 60.0 / 200.0) as usize;
    let max_lag = (fps * 60.0 / 55.0) as usize;
    let mut best = (120.0, 0.0f32);
    let mut scores = Vec::new();
    for lag in min_lag..=max_lag.min(env.len().saturating_sub(1)) {
        let mut ac = 0.0;
        for i in lag..env.len() {
            ac += env[i] * env[i - lag];
        }
        ac /= (env.len() - lag) as f32;
        let bpm = 60.0 * fps / lag as f64;
        // preferencia log-gaussiana centrada en 110 BPM
        let prior = (-0.5 * ((bpm / 110.0).log2() / 0.9).powi(2)).exp() as f32;
        let s = ac * prior;
        scores.push(s);
        if s > best.1 {
            best = (bpm, s);
        }
    }
    let mean = scores.iter().sum::<f32>() / scores.len().max(1) as f32;
    let conf = if mean > 0.0 { ((best.1 / mean) - 1.0).clamp(0.0, 3.0) / 3.0 } else { 0.0 };
    (best.0, conf)
}

/// Seguimiento de pulsos por programación dinámica.
fn track_beats(env: &[f32], bpm: f64) -> Vec<usize> {
    let fps = SR as f64 / HOP as f64;
    let period = fps * 60.0 / bpm;
    let n = env.len();
    if n == 0 {
        return vec![];
    }
    let alpha = 100.0f32;
    let mut score = env.to_vec();
    let mut back = vec![usize::MAX; n];
    let lo = (period * 0.5) as usize;
    let hi = (period * 2.0) as usize;
    for i in 0..n {
        let mut best = f32::MIN;
        let mut arg = usize::MAX;
        for d in lo.max(1)..=hi {
            if d > i {
                break;
            }
            let j = i - d;
            let pen = -alpha * ((d as f64 / period).ln().powi(2) as f32);
            let v = score[j] + pen;
            if v > best {
                best = v;
                arg = j;
            }
        }
        if arg != usize::MAX {
            score[i] = env[i] + best;
            back[i] = arg;
        }
    }
    // final: el mejor de la última ventana
    let start = n.saturating_sub(period as usize + 1);
    let mut i = (start..n).max_by(|a, b| score[*a].partial_cmp(&score[*b]).unwrap()).unwrap_or(n - 1);
    let mut beats = vec![i];
    while back[i] != usize::MAX {
        i = back[i];
        beats.push(i);
    }
    beats.reverse();
    beats
}

fn estimate_meter(env: &[f32], beats: &[usize]) -> u32 {
    if beats.len() < 16 {
        return 4;
    }
    let acc: Vec<f32> = beats.iter().map(|&b| env[b.saturating_sub(1)..(b + 2).min(env.len())].iter().cloned().fold(0.0, f32::max)).collect();
    let score = |m: usize| -> f32 {
        // máxima diferencia entre la fase más acentuada y el promedio
        let mut best = 0.0;
        for phase in 0..m {
            let on: Vec<f32> = acc.iter().enumerate().filter(|(i, _)| i % m == phase).map(|(_, v)| *v).collect();
            let mean_on = on.iter().sum::<f32>() / on.len().max(1) as f32;
            let mean_all = acc.iter().sum::<f32>() / acc.len() as f32;
            best = f32::max(best, mean_on - mean_all);
        }
        best
    };
    if score(3) > score(4) * 1.25 && score(3) > score(2) * 1.1 { 3 } else { 4 }
}

/// Croma (12 bins) por cuadro, con afinación de referencia A4.
fn chroma(sp: &Spectro, a4: f32) -> Vec<[f32; 12]> {
    let bin_hz = SR as f32 / WIN as f32;
    let mut map: Vec<Option<(usize, f32)>> = vec![None; WIN / 2];
    for (b, m) in map.iter_mut().enumerate() {
        let f = b as f32 * bin_hz;
        if !(55.0..=2000.0).contains(&f) {
            continue;
        }
        let midi = 69.0 + 12.0 * (f / a4).log2();
        let pc = ((midi.round() as i32 % 12) + 12) % 12;
        // más peso a los graves medios (fundamentales de acordes)
        let w = if f < 400.0 { 1.3 } else { 1.0 };
        *m = Some((pc as usize, w));
    }
    sp.mags
        .iter()
        .map(|frame| {
            let mut c = [0f32; 12];
            for (b, m) in map.iter().enumerate() {
                if let Some((pc, w)) = m {
                    c[*pc] += frame[b] * frame[b] * w;
                }
            }
            for x in c.iter_mut() {
                *x = x.sqrt();
            }
            c
        })
        .collect()
}

fn normalize(c: &[f32; 12]) -> [f32; 12] {
    let n = c.iter().map(|x| x * x).sum::<f32>().sqrt();
    if n < 1e-9 {
        return [0.0; 12];
    }
    let mut o = [0f32; 12];
    for i in 0..12 {
        o[i] = c[i] / n;
    }
    o
}

const MAJOR_PROFILE: [f32; 12] = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE: [f32; 12] = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

fn pearson(a: &[f32], b: &[f32]) -> f32 {
    let n = a.len() as f32;
    let ma = a.iter().sum::<f32>() / n;
    let mb = b.iter().sum::<f32>() / n;
    let mut num = 0.0;
    let mut da = 0.0;
    let mut db = 0.0;
    for i in 0..a.len() {
        num += (a[i] - ma) * (b[i] - mb);
        da += (a[i] - ma).powi(2);
        db += (b[i] - mb).powi(2);
    }
    num / (da.sqrt() * db.sqrt()).max(1e-9)
}

fn estimate_key(global: &[f32; 12]) -> (usize, bool, f32) {
    let mut best = (0, true, f32::MIN);
    let mut second = f32::MIN;
    for t in 0..12 {
        for (major, prof) in [(true, MAJOR_PROFILE), (false, MINOR_PROFILE)] {
            let rot: Vec<f32> = (0..12).map(|i| prof[(i + 12 - t) % 12]).collect();
            let r = pearson(global, &rot);
            if r > best.2 {
                second = best.2;
                best = (t, major, r);
            } else if r > second {
                second = r;
            }
        }
    }
    (best.0, best.1, (best.2 - second).clamp(0.0, 0.3) / 0.3)
}

struct Template {
    name: String,
    vec: [f32; 12],
}

fn templates() -> Vec<Template> {
    let mut t = Vec::new();
    let mk = |root: usize, ivs: &[usize], suffix: &str| {
        let mut v = [0f32; 12];
        for (k, iv) in ivs.iter().enumerate() {
            v[(root + iv) % 12] = if k == 0 { 1.2 } else { 1.0 };
        }
        Template { name: format!("{}{}", PC_NAMES[root], suffix), vec: normalize(&v) }
    };
    for r in 0..12 {
        t.push(mk(r, &[0, 4, 7], ""));
        t.push(mk(r, &[0, 3, 7], "m"));
        t.push(mk(r, &[0, 4, 7, 10], "7"));
    }
    t
}

fn beat_sync(ch: &[[f32; 12]], beats: &[usize]) -> Vec<[f32; 12]> {
    let mut out = Vec::new();
    for w in beats.windows(2) {
        let (a, b) = (w[0], w[1].max(w[0] + 1));
        let mut acc = [0f32; 12];
        for f in a..b.min(ch.len()) {
            for i in 0..12 {
                acc[i] += ch[f][i];
            }
        }
        out.push(acc);
    }
    out
}

/// Viterbi sobre plantillas de acordes con alta probabilidad de quedarse en el mismo.
fn chords_viterbi(feats: &[[f32; 12]], energy: &[f32]) -> Vec<(usize, f32)> {
    let tpl = templates();
    let n_states = tpl.len() + 1; // + "N"
    let stay = 0.0f32;
    let change = -2.2f32;
    let mut score = vec![0f32; n_states];
    let mut back: Vec<Vec<usize>> = Vec::with_capacity(feats.len());
    let mut emis_all = Vec::with_capacity(feats.len());
    let emax = energy.iter().cloned().fold(0.0, f32::max).max(1e-9);
    for (k, f) in feats.iter().enumerate() {
        let nf = normalize(f);
        let mut emis: Vec<f32> = tpl.iter().map(|t| {
            let sim: f32 = (0..12).map(|i| nf[i] * t.vec[i]).sum();
            // los acordes 7 necesitan más evidencia
            let bias = if t.name.ends_with('7') { -0.06 } else { 0.0 };
            8.0 * (sim + bias)
        }).collect();
        let quiet = energy[k] / emax < 0.05;
        emis.push(if quiet { 8.0 } else { 3.0 });
        emis_all.push(emis);
    }
    for (k, emis) in emis_all.iter().enumerate() {
        if k == 0 {
            score = emis.clone();
            back.push(vec![0; n_states]);
            continue;
        }
        let (best_prev, best_v) = score.iter().enumerate().fold((0, f32::MIN), |acc, (i, v)| if *v > acc.1 { (i, *v) } else { acc });
        let mut ns = vec![0f32; n_states];
        let mut bk = vec![0usize; n_states];
        for s in 0..n_states {
            let a = score[s] + stay;
            let b = best_v + change;
            if a >= b {
                ns[s] = a + emis[s];
                bk[s] = s;
            } else {
                ns[s] = b + emis[s];
                bk[s] = best_prev;
            }
        }
        score = ns;
        back.push(bk);
    }
    let mut s = score.iter().enumerate().fold((0, f32::MIN), |acc, (i, v)| if *v > acc.1 { (i, *v) } else { acc }).0;
    let mut path = vec![0usize; feats.len()];
    for k in (0..feats.len()).rev() {
        path[k] = s;
        s = back[k][s];
    }
    path.iter().enumerate().map(|(k, &st)| {
        let e = &emis_all[k];
        let mut sorted = e.clone();
        sorted.sort_by(|a, b| b.partial_cmp(a).unwrap());
        let conf = ((e[st] - sorted.get(1).copied().unwrap_or(0.0)) / 2.0).clamp(0.0, 1.0);
        (st, conf)
    }).collect()
}

fn sections(feats: &[[f32; 12]], energy: &[f32], beat_times: &[f64], beats_per_bar: usize) -> Vec<SectionSeg> {
    let n = feats.len();
    if n < 16 {
        return vec![SectionSeg { start: *beat_times.first().unwrap_or(&0.0), end: *beat_times.last().unwrap_or(&0.0), label: "A".into(), name: "tema".into() }];
    }
    let emax = energy.iter().cloned().fold(0.0, f32::max).max(1e-9);
    let fv: Vec<Vec<f32>> = feats.iter().zip(energy).map(|(f, e)| {
        let mut v: Vec<f32> = normalize(f).to_vec();
        v.push(2.0 * e / emax);
        v
    }).collect();
    let sim = |a: usize, b: usize| -> f32 {
        let (x, y) = (&fv[a], &fv[b]);
        let dot: f32 = x.iter().zip(y).map(|(p, q)| p * q).sum();
        let nx = x.iter().map(|p| p * p).sum::<f32>().sqrt();
        let ny = y.iter().map(|p| p * p).sum::<f32>().sqrt();
        dot / (nx * ny).max(1e-9)
    };
    // novedad con núcleo de tablero de ajedrez
    let k = (beats_per_bar * 4).min(n / 4).max(4);
    let mut nov = vec![0f32; n];
    for i in k..n.saturating_sub(k) {
        let mut s = 0.0;
        for a in 0..k {
            for b in 0..k {
                s += sim(i - 1 - a, i - 1 - b) + sim(i + a, i + b) - sim(i - 1 - a, i + b) - sim(i + a, i - 1 - b);
            }
        }
        nov[i] = s / (k * k) as f32;
    }
    let min_gap = beats_per_bar * 8;
    let mean = nov.iter().sum::<f32>() / n as f32;
    let mut cand: Vec<usize> = (1..n - 1).filter(|&i| nov[i] > nov[i - 1] && nov[i] >= nov[i + 1] && nov[i] > mean * 1.5).collect();
    cand.sort_by(|a, b| nov[*b].partial_cmp(&nov[*a]).unwrap());
    let mut bounds: Vec<usize> = Vec::new();
    for c in cand {
        if bounds.iter().all(|b| (*b as i64 - c as i64).unsigned_abs() as usize >= min_gap) && c >= min_gap / 2 && n - c >= min_gap / 2 {
            bounds.push(c);
        }
    }
    bounds.sort();
    let mut segs: Vec<(usize, usize)> = Vec::new();
    let mut prev = 0;
    for b in bounds {
        segs.push((prev, b));
        prev = b;
    }
    segs.push((prev, n));
    // representar cada segmento por su croma medio y agrupar
    let means: Vec<Vec<f32>> = segs.iter().map(|(a, b)| {
        let mut m = vec![0f32; 13];
        for i in *a..*b {
            for j in 0..13 {
                m[j] += fv[i][j];
            }
        }
        m.iter().map(|x| x / (*b - *a).max(1) as f32).collect()
    }).collect();
    let cos = |x: &Vec<f32>, y: &Vec<f32>| -> f32 {
        let d: f32 = x.iter().zip(y).map(|(p, q)| p * q).sum();
        d / (x.iter().map(|p| p * p).sum::<f32>().sqrt() * y.iter().map(|p| p * p).sum::<f32>().sqrt()).max(1e-9)
    };
    let mut labels: Vec<usize> = Vec::new();
    let mut reps: Vec<Vec<f32>> = Vec::new();
    for m in &means {
        if let Some((li, _)) = reps.iter().enumerate().map(|(i, r)| (i, cos(m, r))).filter(|(_, c)| *c > 0.97).max_by(|a, b| a.1.partial_cmp(&b.1).unwrap()) {
            labels.push(li);
        } else {
            reps.push(m.clone());
            labels.push(reps.len() - 1);
        }
    }
    // nombres sugeridos
    let counts: Vec<usize> = (0..reps.len()).map(|l| labels.iter().filter(|x| **x == l).count()).collect();
    let seg_energy: Vec<f32> = segs.iter().map(|(a, b)| energy[*a..*b].iter().sum::<f32>() / (*b - *a).max(1) as f32).collect();
    let max_e = seg_energy.iter().cloned().fold(0.0, f32::max).max(1e-9);
    // estribillo: el grupo repetido con más energía
    let chorus = (0..reps.len()).filter(|l| counts[*l] >= 2).max_by(|a, b| {
        let ea: f32 = segs.iter().zip(&labels).filter(|(_, l)| *l == a).map(|((s, e), _)| energy[*s..*e].iter().sum::<f32>() / (*e - *s) as f32).sum();
        let eb: f32 = segs.iter().zip(&labels).filter(|(_, l)| *l == b).map(|((s, e), _)| energy[*s..*e].iter().sum::<f32>() / (*e - *s) as f32).sum();
        (ea / counts[*a] as f32).partial_cmp(&(eb / counts[*b] as f32)).unwrap()
    });
    let last = segs.len() - 1;
    segs.iter().enumerate().map(|(i, (a, b))| {
        let l = labels[i];
        let short = (*b - *a) <= beats_per_bar * 8;
        let name = if i == 0 && short && segs.len() > 2 {
            "intro"
        } else if i == last && short && segs.len() > 2 {
            "final"
        } else if Some(l) == chorus {
            "estribillo"
        } else if counts[l] == 1 && seg_energy[i] / max_e > 0.85 && i > 1 {
            "solo"
        } else if counts[l] == 1 {
            "puente"
        } else {
            "verso"
        };
        SectionSeg {
            start: beat_times[*a],
            end: beat_times[(*b).min(beat_times.len() - 1)],
            label: ((b'A' + (l as u8 % 26)) as char).to_string(),
            name: name.into(),
        }
    }).collect()
}

/// Analiza audio mono en memoria.
pub fn analyze(samples: &[f32], rate: u32, a4: f32) -> Analysis {
    let x = resample(samples, rate);
    let duration = x.len() as f64 / SR as f64;
    let sp = stft(&x);
    let env = onset_envelope(&sp);
    let (tempo, tempo_conf) = estimate_tempo(&env);
    let mut beats = track_beats(&env, tempo);
    if beats.len() < 2 {
        beats = (0..sp.mags.len()).step_by(((SR as f64 / HOP as f64) * 60.0 / tempo).max(1.0) as usize).collect();
    }
    let meter = estimate_meter(&env, &beats);
    let ch = chroma(&sp, a4);
    let mut global = [0f32; 12];
    for c in &ch {
        for i in 0..12 {
            global[i] += c[i];
        }
    }
    let (tonic, major, key_conf) = estimate_key(&global);
    let feats = beat_sync(&ch, &beats);
    let energy: Vec<f32> = beats.windows(2).map(|w| {
        let (a, b) = (w[0], w[1].max(w[0] + 1).min(sp.mags.len()));
        sp.mags[a..b].iter().map(|f| f.iter().take(600).map(|m| m * m).sum::<f32>()).sum::<f32>() / (b - a).max(1) as f32
    }).collect();
    let beat_times: Vec<f64> = beats.iter().map(|b| frame_time(*b)).collect();
    let path = chords_viterbi(&feats, &energy);
    let tpl = templates();
    let mut chords: Vec<ChordSeg> = Vec::new();
    for (k, (st, conf)) in path.iter().enumerate() {
        let name = if *st >= tpl.len() { "N".to_string() } else { tpl[*st].name.clone() };
        let (s, e) = (beat_times[k], beat_times[k + 1]);
        if let Some(last) = chords.last_mut() {
            if last.chord == name {
                last.end = e;
                last.confidence = (last.confidence + conf) / 2.0;
                continue;
            }
        }
        chords.push(ChordSeg { start: s, end: e, chord: name, confidence: *conf });
    }
    let secs = sections(&feats, &energy, &beat_times, meter as usize);
    Analysis {
        duration,
        tempo: (tempo * 10.0).round() / 10.0,
        tempo_confidence: tempo_conf,
        beats: beat_times,
        meter,
        key_tonic: tonic,
        key_mode: if major { "major" } else { "minor" }.into(),
        key_name: format!("{}{}", PC_NAMES[tonic], if major { "" } else { "m" }),
        key_confidence: key_conf,
        chords,
        sections: secs,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Audio sintético: acordes sostenidos + bombo en cada pulso.
    fn synth(bpm: f64, chords: &[(usize, bool)], beats_per_chord: usize, rate: u32) -> Vec<f32> {
        let beat = 60.0 / bpm;
        let total = chords.len() * beats_per_chord;
        let n = (total as f64 * beat * rate as f64) as usize;
        let mut x = vec![0f32; n];
        for (ci, (root, major)) in chords.iter().enumerate() {
            let ivs = if *major { [0, 4, 7] } else { [0, 3, 7] };
            let s0 = (ci * beats_per_chord) as f64 * beat;
            let s1 = s0 + beats_per_chord as f64 * beat;
            for (k, iv) in ivs.iter().enumerate() {
                let midi = 48 + root + iv + if k == 0 { 0 } else { 12 };
                let f = 440.0 * 2f64.powf((midi as f64 - 69.0) / 12.0);
                for i in (s0 * rate as f64) as usize..((s1 * rate as f64) as usize).min(n) {
                    let t = i as f64 / rate as f64;
                    x[i] += (0.15 * (2.0 * std::f64::consts::PI * f * t).sin() + 0.05 * (4.0 * std::f64::consts::PI * f * t).sin()) as f32;
                }
            }
        }
        for b in 0..total {
            let start = (b as f64 * beat * rate as f64) as usize;
            for i in 0..(rate as usize / 12) {
                if start + i < n {
                    let t = i as f32 / rate as f32;
                    x[start + i] += 0.8 * (2.0 * std::f32::consts::PI * 60.0 * t).sin() * (-t * 30.0).exp() + 0.3 * (((start + i) * 7919 % 1000) as f32 / 1000.0 - 0.5) * (-t * 60.0).exp();
                }
            }
        }
        x
    }

    #[test]
    fn detects_tempo_key_and_chords() {
        let rate = 22050;
        // I – V – vi – IV en Do, dos vueltas, 4 pulsos por acorde
        let prog = [(0, true), (7, true), (9, false), (5, true), (0, true), (7, true), (9, false), (5, true)];
        let x = synth(100.0, &prog, 4, rate);
        let a = analyze(&x, rate, 440.0);
        assert!((a.tempo - 100.0).abs() < 4.0 || (a.tempo - 200.0).abs() < 6.0 || (a.tempo - 50.0).abs() < 3.0, "tempo {}", a.tempo);
        assert!(a.key_name == "C" || a.key_name == "Am", "tonalidad {}", a.key_name);
        let names: Vec<&str> = a.chords.iter().map(|c| c.chord.as_str()).collect();
        for want in ["C", "G", "Am", "F"] {
            assert!(names.contains(&want), "falta {want} en {names:?}");
        }
    }

    #[test]
    fn minor_key() {
        let rate = 22050;
        let prog = [(9, false), (2, false), (4, true), (9, false), (9, false), (5, true), (4, true), (9, false)];
        let x = synth(90.0, &prog, 4, rate);
        let a = analyze(&x, rate, 440.0);
        assert_eq!(a.key_name, "Am", "tonalidad {}", a.key_name);
    }
}

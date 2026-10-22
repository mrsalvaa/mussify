// SPDX-License-Identifier: GPL-3.0-or-later
//! Prueba rápida del motor en el dispositivo real: toca un arpegio y un metrónomo.
use mussify_engine::{mixer::{Inst, SeqEvent}, Cmd, Engine};

fn main() {
    let e = Engine::start();
    let t0 = std::time::Instant::now();
    let mut ev: Vec<SeqEvent> = [60u8, 64, 67, 72].iter().enumerate().map(|(i, n)| SeqEvent { time: i as f64 * 0.3, duration: 0.5, note: *n, velocity: 0.8, instrument: Inst::Piano }).collect();
    ev.extend((0..4).map(|i| SeqEvent { time: i as f64 * 0.3, duration: 0.05, note: if i == 0 { 2 } else { 0 }, velocity: 0.6, instrument: Inst::Click }));
    e.send(Cmd::PlaySeq { channel: 0, events: ev, delay: 0.05 });
    std::thread::sleep(std::time::Duration::from_millis(1500));
    println!("rate={} status={:?} t={:?}", e.rate, e.status(), t0.elapsed());
}

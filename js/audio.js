'use strict';
// Âm thanh tổng hợp bằng Web Audio (không cần tệp âm thanh). Nhạc nền theo thang ngũ cung.
(function () {
  const G = window.G;
  class Sound {
    constructor() { this.ctx = null; this.sfxOn = true; this.musicOn = true; this.step = 0; this.timer = null; }
    init() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      try {
        const C = window.AudioContext || window.webkitAudioContext;
        this.ctx = new C();
        this.master = this.ctx.createGain(); this.master.gain.value = 0.55; this.master.connect(this.ctx.destination);
        this.sfxBus = this.ctx.createGain(); this.sfxBus.connect(this.master);
        this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = 0.22; this.musicBus.connect(this.master);
        const len = this.ctx.sampleRate * 1.0;
        this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noise.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) { this.ctx = null; }
    }
    env(g, t, a, peak, dec) {
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
    }
    tone(type, f0, f1, dur, vol, bus, delay = 0) {
      const c = this.ctx, t = c.currentTime + delay;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      this.env(g, t, 0.005, vol, dur);
      o.connect(g); g.connect(bus || this.sfxBus); o.start(t); o.stop(t + dur + 0.05);
    }
    noiseHit(dur, vol, type, f0, f1, delay = 0) {
      const c = this.ctx, t = c.currentTime + delay;
      const s = c.createBufferSource(); s.buffer = this.noise;
      const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f0, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = c.createGain(); this.env(g, t, 0.004, vol, dur);
      s.connect(fl); fl.connect(g); g.connect(this.sfxBus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
    }
    gong(base, vol, dur) {
      for (const [k, v] of [[1, 1], [1.42, 0.6], [2.03, 0.4], [2.81, 0.25]]) this.tone('sine', base * k, base * k * 0.98, dur, vol * v);
    }
    play(name, v = 1) {
      if (!this.ctx || !this.sfxOn) return;
      switch (name) {
        case 'hit': this.noiseHit(0.09, 0.5 * (0.5 + v), 'lowpass', 2200, 400); this.tone('sine', 150, 45, 0.14, 0.6 * (0.5 + v)); break;
        case 'block': this.tone('square', 1100, 700, 0.04, 0.12); this.noiseHit(0.05, 0.2, 'highpass', 3000); break;
        case 'whoosh': this.noiseHit(0.13, 0.12 * v, 'bandpass', 500, 1800); break;
        case 'thud': this.tone('sine', 90, 35, 0.3, 0.7); this.noiseHit(0.2, 0.3, 'lowpass', 600, 100); break;
        case 'cast': this.tone('triangle', 300, 900, 0.18, 0.25); this.noiseHit(0.15, 0.1, 'bandpass', 800, 3000); break;
        case 'super': this.gong(180, 0.35, 1.4); this.tone('sawtooth', 110, 440, 0.6, 0.12); break;
        case 'super2': this.noiseHit(0.6, 0.35, 'lowpass', 300, 2500); this.tone('sine', 70, 140, 0.6, 0.4); break;
        case 'gong': this.gong(220, 0.3, 1.6); break;
        case 'ko': this.gong(120, 0.5, 2.4); this.noiseHit(0.5, 0.4, 'lowpass', 900, 80); break;
        case 'grab': this.tone('square', 220, 110, 0.12, 0.15); break;
        case 'counter': this.tone('sine', 1500, 1500, 0.4, 0.25); this.tone('sine', 2250, 2250, 0.3, 0.12); break;
        case 'armor': this.tone('sine', 640, 600, 0.3, 0.3); this.tone('sine', 960, 900, 0.25, 0.2); break;
        case 'power': [523, 587, 698, 784, 880].forEach((f, i) => this.tone('triangle', f, f, 0.18, 0.18, null, i * 0.05)); break;
        case 'roar': this.noiseHit(0.7, 0.45, 'lowpass', 500, 150); this.tone('sawtooth', 90, 60, 0.6, 0.15); break;
        case 'bite': this.tone('square', 900, 400, 0.05, 0.12); break;
        case 'ui': this.tone('triangle', 660, 660, 0.06, 0.12); break;
        case 'select': this.tone('sine', 440, 520, 0.35, 0.25); this.tone('sine', 880, 1040, 0.25, 0.08); break;
      }
    }
    // Nhạc nền: trống + đàn gảy theo ngũ cung (Hò – Xự – Xang – Xê – Cống)
    startMusic() {
      if (!this.ctx || this.timer) return;
      const scale = [261.6, 293.7, 349.2, 392.0, 440.0, 523.3, 587.3, 698.5];
      const motif = [0, 2, 3, 4, 3, 2, 5, 4, 3, 2, 0, 1, 2, 4, 3, -1];
      this.timer = setInterval(() => {
        if (!this.musicOn || !this.ctx) return;
        const s = this.step++ % 64;
        if (s % 8 === 0) { this.tone('sine', 80, 45, 0.35, 0.8, this.musicBus); }
        if (s % 8 === 4) { this.tone('sine', 110, 60, 0.2, 0.4, this.musicBus); }
        if (s % 4 === 2) this.tone('triangle', 1800, 1700, 0.03, 0.08, this.musicBus);
        if (s % 2 === 0) {
          const n = motif[(s / 2 + Math.floor(this.step / 64) * 3) % motif.length];
          if (n >= 0) { const f = scale[n] * (s >= 32 ? 1 : 0.5) * 2; this.tone('triangle', f * 1.02, f, 0.5, 0.25, this.musicBus); }
        }
      }, 140);
    }
  }
  G.Sound = Sound;
})();

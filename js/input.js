'use strict';
// Điều khiển: bàn phím, tay cầm, cảm ứng. Mỗi người chơi có một "Pad" ghi nhớ nút vừa bấm.
(function () {
  const G = window.G;
  const KEYS = ['l', 'r', 'u', 'd', 'L', 'M', 'H', 'S', 'B', 'U'];
  const BTN = ['L', 'M', 'H', 'S', 'B', 'U'];

  class Pad {
    constructor() { this.h = {}; this.prev = {}; this.age = {}; this.lastTap = { l: -99, r: -99 }; this.f = 0; this.tap2 = null; this.mash = 0; }
    feed(held, freeze) {
      this.f++; this.tap2 = null; this.mash = 0;
      for (const k of KEYS) {
        const now = !!held[k];
        if (now && !this.prev[k]) {
          this.age[k] = 0;
          if (BTN.includes(k)) this.mash++;
          if (k === 'l' || k === 'r') {
            if (this.f - this.lastTap[k] <= 12) { this.tap2 = k; this.lastTap[k] = -99; }
            else this.lastTap[k] = this.f;
            const other = k === 'l' ? 'r' : 'l';
            this.lastTap[other] = -99;
          }
        } else if (!freeze) this.age[k] = (this.age[k] == null ? 99 : this.age[k]) + 1;
        this.prev[k] = now; this.h[k] = now;
      }
    }
    p(k, win = 6) { return (this.age[k] == null ? 99 : this.age[k]) < win; }
    use(k) { this.age[k] = 99; }
  }

  // ----- Bàn phím -----
  const down = new Set();
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    down.add(e.code);
  });
  window.addEventListener('keyup', (e) => down.delete(e.code));
  window.addEventListener('blur', () => down.clear());

  const MAP_P1 = { KeyA: 'l', KeyD: 'r', KeyW: 'u', KeyS: 'd', KeyJ: 'L', KeyK: 'M', KeyL: 'H', KeyU: 'S', KeyI: 'B', KeyO: 'U', KeyH: 'T' };
  const MAP_P2 = { ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'u', ArrowDown: 'd', Numpad1: 'L', Numpad2: 'M', Numpad3: 'H',
    Numpad4: 'S', Numpad5: 'B', Numpad6: 'U', Numpad0: 'T' };
  const MAP_SOLO_EXTRA = { ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'u', ArrowDown: 'd', KeyZ: 'L', KeyX: 'M', KeyC: 'H', KeyV: 'S' };

  // ----- Cảm ứng -----
  const touch = { held: {}, active: false };
  G.touch = touch;

  function readGamepad(idx, out) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = pads && pads[idx];
    if (!gp) return;
    const b = (i) => gp.buttons[i] && gp.buttons[i].pressed;
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    if (b(14) || ax < -0.45) out.l = true;
    if (b(15) || ax > 0.45) out.r = true;
    if (b(12) || ay < -0.55) out.u = true;
    if (b(13) || ay > 0.55) out.d = true;
    if (b(2)) out.L = true;
    if (b(3)) out.M = true;
    if (b(5)) out.H = true;
    if (b(0)) out.S = true;
    if (b(1)) out.B = true;
    if (b(7) || b(6)) out.U = true;
    if (b(4)) out.T = true;
  }

  class HumanSource {
    constructor(player, solo) { this.player = player; this.solo = solo; }
    read() {
      const out = {};
      const maps = this.player === 0 ? [MAP_P1].concat(this.solo ? [MAP_SOLO_EXTRA] : []) : [MAP_P2];
      for (const m of maps) for (const code in m) if (down.has(code)) out[m[code]] = true;
      readGamepad(this.player, out);
      if (this.player === 0 && touch.active) for (const k in touch.held) if (touch.held[k]) out[k] = true;
      if (out.T) { out.L = true; out.M = true; }
      if (out.l && out.r) { out.l = false; out.r = false; }
      return out;
    }
  }

  class NullSource { read() { return {}; } }

  G.Pad = Pad;
  G.HumanSource = HumanSource;
  G.NullSource = NullSource;
  G.keyDown = (code) => down.has(code);
})();

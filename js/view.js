'use strict';
// Hiển thị: tư thế võ sĩ, đạn, hiệu ứng, máy quay.
(function () {
  const G = window.G, T = THREE;
  const TURN = Math.PI / 2 - 0.3;
  const TAU = Math.PI * 2;

  // ---------------- Tư thế ----------------
  const BASE = { hy: 0, lean: 0, twist: 0, side: 0, hx: 0, hyaw: -0.5, sl: [0, 0.12], el: -0.1, sr: [0, -0.12], er: -0.1,
    ll: [0, 0.05], kl: 0, lr: [0, -0.05], kr: 0, tz: 0, ty: 0, tx: 0, spin: 0 };
  const P = (o) => Object.assign({}, BASE, o);
  const STANCE = P({ hy: -0.06, lean: 0.12, twist: 0.3, sl: [-0.75, 0.3], el: -1.45, sr: [-1.0, -0.25], er: -1.35,
    ll: [-0.35, 0.12], kl: 0.45, lr: [0.3, -0.08], kr: 0.35, hx: -0.05 });
  const CROUCH = P({ hy: -0.36, lean: 0.38, twist: 0.3, sl: [-0.6, 0.3], el: -1.9, sr: [-0.9, -0.2], er: -1.8,
    ll: [-1.25, 0.25], kl: 1.95, lr: [-0.75, -0.2], kr: 1.8, hx: -0.2 });
  const AIR = P({ lean: 0.1, sl: [-0.8, 0.4], el: -1.6, sr: [-1.0, -0.3], er: -1.6, ll: [-1.2, 0.15], kl: 1.9, lr: [-0.4, -0.1], kr: 1.4 });
  const BLOCK = P(Object.assign({}, STANCE, { sl: [-1.15, 0.35], el: -2.3, sr: [-1.2, -0.35], er: -2.3, hx: 0.25, lean: 0.15, hy: -0.08 }));
  const CBLOCK = P(Object.assign({}, CROUCH, { sl: [-1.2, 0.35], el: -2.3, sr: [-1.25, -0.35], er: -2.3, hx: 0.3 }));
  const HIT = P(Object.assign({}, STANCE, { lean: -0.35, hx: -0.45, sl: [0.2, 0.6], el: -0.6, sr: [0.3, -0.6], er: -0.6, hy: -0.04 }));
  const AIRHIT = P({ tz: 0.7, lean: -0.4, hx: -0.5, sl: [0.4, 1.0], el: -0.3, sr: [0.4, -1.0], er: -0.3, ll: [-0.6, 0.2], kl: 0.6, lr: [-0.2, -0.2], kr: 0.4 });
  const DOWN = P({ tz: 1.5, ty: -0.62, sl: [-0.3, 1.2], el: -0.2, sr: [-0.3, -1.2], er: -0.2, ll: [-0.2, 0.3], kl: 0.2, lr: [0.1, -0.3], kr: 0.3, hx: -0.3 });
  const BOW = P({ hy: -0.02, lean: 0.55, hx: 0.35, sl: [-1.25, -0.45], el: -1.35, sr: [-1.25, 0.45], er: -1.35, ll: [0, 0.08], lr: [0, -0.08] });
  const WIN = P({ hy: 0, lean: -0.15, hx: -0.35, sl: [-2.9, 0.35], el: -0.2, sr: [-0.4, -0.3], er: -1.9, ll: [-0.2, 0.15], lr: [0.1, -0.15], kr: 0.1 });
  const LOSE = P({ hy: -0.42, lean: 0.7, hx: 0.55, sl: [-0.3, 0.2], el: -0.3, sr: [-0.3, -0.2], er: -0.3, ll: [-1.5, 0.2], kl: 1.7, lr: [-0.2, -0.1], kr: 1.9 });
  const GRABBED = P({ lean: -0.35, hx: -0.4, sl: [-0.5, 0.9], el: -0.4, sr: [-0.5, -0.9], er: -0.4, ll: [-0.3, 0.1], kl: 0.4, lr: [0.2, -0.1], kr: 0.3 });
  const HOLD = P(Object.assign({}, STANCE, { sl: [-1.4, 0.2], el: -0.6, sr: [-1.4, -0.2], er: -0.6, lean: 0.3 }));
  const RIDE = P({ hy: -0.3, lean: 0.6, hx: 0.5, ll: [-1.5, 0.5], kl: 1.8, lr: [-1.5, -0.5], kr: 1.8, sl: [-1.3, 0.4], sr: [-1.3, -0.4], el: -1, er: -1 });

  const A = {
    jab: { wind: { sr: [-1.0, -0.25], er: -1.9, twist: 0.25 }, hit: { sr: [-1.6, -0.05], er: -0.05, twist: 0.6, lean: 0.2 } },
    kick: { wind: { lr: [-1.3, 0], kr: 1.9, lean: -0.1, ll: [0, 0.1], kl: 0.3 }, hit: { lr: [-1.55, 0], kr: 0.05, lean: -0.3, ll: [0.15, 0.1], kl: 0.15, twist: 0.6 } },
    heavy: { wind: { sl: [-0.3, 0.5], el: -2.2, twist: -0.3, ll: [-0.2, 0.2] },
      hit: { sl: [-1.65, 0.05], el: -0.05, twist: -0.6, lean: 0.35, sr: [-0.3, -0.3], er: -1.6, ll: [-0.7, 0.2], kl: 0.5, lr: [0.5, -0.1], kr: 0.2 } },
    lowjab: { base: 'crouch', wind: { sr: [-1.0, -0.2], er: -1.9 }, hit: { sr: [-1.5, 0], er: 0, twist: 0.6 } },
    lowkick: { base: 'crouch', wind: { lr: [-0.5, 0], kr: 1.6 }, hit: { lr: [-1.45, -0.1], kr: 0, hy: -0.42, lean: 0, twist: 0.4 } },
    uppercut: { base: 'crouch', wind: { sl: [-0.4, 0.3], el: -2.0, hy: -0.4 },
      hit: { hy: 0.05, lean: -0.25, sl: [-2.9, 0.1], el: -0.25, ll: [-0.3, 0.1], kl: 0.3, lr: [0.2, -0.1], kr: 0.1, twist: -0.4 } },
    airpunch: { base: 'air', wind: { sr: [-0.8, -0.3], er: -2 }, hit: { sr: [-1.3, -0.1], er: 0, lean: 0.3 } },
    airkick: { base: 'air', wind: { lr: [-0.6, 0], kr: 1.8 }, hit: { lr: [-0.9, 0], kr: 0, ll: [-1.3, 0.1], kl: 2.0, lean: -0.2 } },
    airheavy: { base: 'air', wind: { ll: [-1.4, 0.1], kl: 2.2, lr: [-1.4, -0.1], kr: 2.2, lean: 0.2 },
      hit: { ll: [-0.5, 0.1], kl: 0.05, lr: [-0.6, -0.1], kr: 0.05, lean: -0.4 } },
    throw: { wind: { sl: [-1.4, 0.1], el: -0.4, sr: [-1.4, -0.1], er: -0.4, lean: 0.3 }, hit: { sl: [-1.5, 0], el: -0.6, sr: [-1.5, 0], er: -0.6, lean: 0.4, twist: -0.6 } },
    cast: { wind: { sl: [-0.4, 0.5], el: -2.1, sr: [-0.4, -0.5], er: -2.1, twist: -0.4, hy: -0.12, lean: -0.1 },
      hit: { sl: [-1.55, 0.15], el: -0.05, sr: [-1.55, -0.15], er: -0.05, twist: 0.2, lean: 0.35, ll: [-0.6, 0.2], kl: 0.6, lr: [0.5, -0.1], kr: 0.2 } },
    spit: { wind: { lean: -0.3, hx: -0.5 }, hit: { lean: 0.45, hx: 0.1, sl: [-0.2, 0.6], sr: [-0.2, -0.6], el: -0.4, er: -0.4 } },
    rush: { wind: { lean: -0.1, hy: -0.15 }, hit: { lean: 0.85, hx: -0.5, sl: [0.7, 0.3], el: -0.6, sr: [0.7, -0.3], er: -0.6 },
      fn: (f, cf, ph) => ph === 'wind' ? null : { ll: [-0.6 + 0.8 * Math.sin(cf * 0.6), 0.1], kl: 0.6 + 0.5 * Math.max(0, Math.sin(cf * 0.6)), lr: [-0.6 - 0.8 * Math.sin(cf * 0.6), -0.1], kr: 0.6 + 0.5 * Math.max(0, -Math.sin(cf * 0.6)) } },
    roll: { base: 'crouch', wind: { hy: -0.3, lean: 0.8 },
      hit: { hy: -0.3, lean: 1.2, hx: 0.6, sl: [-1.6, 0.3], el: -2.2, sr: [-1.6, -0.3], er: -2.2, ll: [-1.8, 0.1], kl: 2.3, lr: [-1.8, -0.1], kr: 2.3 },
      fn: (f, cf, ph) => ph === 'hit' ? { tz: -(cf - f.move.hitStart) * 0.42 } : null },
    claw: { wind: { sl: [-0.6, 0.4], el: -2.0, sr: [-0.6, -0.4], er: -2.0 },
      fn: (f, cf, ph) => {
        if (ph !== 'hit') return null;
        const k = Math.floor((cf - f.move.hitStart) / Math.max(2, f.move.hitEvery || 4)) % 2;
        return k ? { sl: [-1.6, 0.2], el: -0.2, sr: [-0.6, -0.3], er: -1.9, twist: -0.4, lean: 0.3 } : { sr: [-1.6, -0.2], er: -0.2, sl: [-0.6, 0.3], el: -1.9, twist: 0.5, lean: 0.3 };
      } },
    peck: { wind: { lean: -0.2, hx: -0.4 },
      fn: (f, cf, ph) => {
        if (ph !== 'hit') return null;
        const k = Math.floor((cf - f.move.hitStart) / 2) % 2;
        return { lean: 0.55 + 0.3 * k, hx: 0.1 + 0.4 * k, sl: [0.4, 0.7], sr: [0.4, -0.7], el: -0.3, er: -0.3 };
      } },
    dive: { base: 'crouch', wind: { hy: -0.3, lean: 0.4 },
      hit: { tz: -0.5, lean: 0.6, sl: [-2.7, 0.3], el: -0.2, sr: [-2.7, -0.3], er: -0.2, ll: [0.4, 0.1], kl: 0.6, lr: [0.5, -0.1], kr: 0.8 } },
    flykick: { base: 'crouch', wind: { hy: -0.3 },
      hit: { ll: [-1.5, 0.1], kl: 0, lr: [-1.2, -0.1], kr: 0.2, lean: -0.5, sl: [0.3, 1.3], sr: [0.3, -1.3], el: -0.2, er: -0.2 } },
    flip: { base: 'air',
      fn: (f, cf) => {
        const dir = f.move.jump && f.move.jump.vx > 0 ? -1 : 1;
        return { tz: dir * Math.min(1, cf / 26) * TAU };
      } },
    burrow: { base: 'crouch', wind: {}, hit: { hy: 0.05, lean: -0.25, sl: [-2.9, 0.3], el: -0.1, sr: [-2.9, -0.3], er: -0.1 },
      fn: (f, cf) => {
        const tp = f.move.teleport;
        if (cf < tp.hide[0]) return { ty: -1.3 * cf / tp.hide[0] };
        if (cf < tp.hide[1] + 4) return { ty: -1.3 + 1.3 * Math.max(0, (cf - tp.hide[1] + 4) / 4) };
        return null;
      } },
    tailwhip: { base: 'crouch', wind: { lean: 0.5, hy: -0.3 }, hit: { lean: 0.6, hy: -0.35 },
      fn: (f, cf) => {
        const m = f.move; const p = Math.max(0, Math.min(1, (cf - m.startup + 5) / (m.active + 12)));
        return { spin: -p * TAU };
      } },
    rise: { base: 'crouch', wind: { hy: -0.35 },
      hit: { sl: [-2.9, 0.3], el: -0.1, sr: [-2.9, -0.3], er: -0.1, lean: -0.3, ll: [-1.0, 0.1], kl: 1.2, lr: [0.2, -0.1], kr: 0.2, hx: -0.4 },
      fn: (f, cf, ph) => (ph === 'hit' && f.def.id === 'thin' ? { spin: cf * 0.55 } : null) },
    ambush: { wind: { hy: -0.5, lean: 0.8, hx: -0.6, sl: [-0.3, 0.4], sr: [-0.3, -0.4], ll: [-1.5, 0.3], kl: 2.2, lr: [-1.0, -0.3], kr: 2.0 },
      hit: { sl: [-2.8, 0.4], el: -0.4, sr: [-2.6, -0.4], er: -0.4, hy: 0.05, lean: -0.3 } },
    stance: { wind: { hy: -0.15, sl: [-1.3, 0.7], el: -1.3, sr: [-1.3, -0.7], er: -1.3, lean: 0.1, twist: 0, ll: [-0.5, 0.3], kl: 0.7, lr: [0.4, -0.3], kr: 0.5 },
      hit: { hy: -0.15, sl: [-1.3, 0.7], el: -1.3, sr: [-1.3, -0.7], er: -1.3, lean: 0.25, hx: 0.4, twist: 0, ll: [-0.5, 0.3], kl: 0.7, lr: [0.4, -0.3], kr: 0.5 } },
    sleep: { wind: { hy: -0.2 }, hit: { hy: -0.45, lean: 0.25, hx: 0.75, sl: [0, 0.2], el: -0.3, sr: [0, -0.2], er: -0.3, ll: [-1.4, 0.3], kl: 1.6, lr: [-1.4, -0.3], kr: 1.6 },
      fn: (f, cf, ph) => (ph === 'hit' ? { hy: -0.45 + 0.02 * Math.sin(cf * 0.1) } : null) },
    eat: { wind: {}, hit: { hy: -0.3, lean: 1.0, hx: 0.4, sl: [-1.2, 0.3], el: -0.6, sr: [-1.2, -0.3], er: -0.6, ll: [-0.9, 0.2], kl: 1.2, lr: [-0.6, -0.2], kr: 1.0 },
      fn: (f, cf, ph) => (ph === 'hit' ? { hx: 0.4 + 0.25 * Math.sin(cf * 0.5) } : null) },
    roar: { wind: { lean: 0.3, hx: 0.3, sl: [-0.6, 0.3], sr: [-0.6, -0.3], el: -2, er: -2 },
      hit: { lean: -0.45, hx: -0.7, sl: [-0.6, 1.3], el: -0.6, sr: [-0.6, -1.3], er: -0.6, hy: -0.05 } },
    pose: { wind: { sl: [-0.3, 1.0], el: -1.8, sr: [-0.3, -1.0], er: -1.8, hy: -0.12, lean: -0.1, hx: -0.2, ll: [-0.4, 0.35], lr: [0.3, -0.35], kl: 0.5, kr: 0.4 },
      hit: { sl: [-0.3, 1.0], el: -1.8, sr: [-0.3, -1.0], er: -1.8, hy: -0.12, lean: -0.1, hx: -0.2, ll: [-0.4, 0.35], lr: [0.3, -0.35], kl: 0.5, kr: 0.4 } },
    backkick: { wind: { spin: Math.PI * 0.6, lean: 0.3 },
      hit: { spin: Math.PI * 0.95, lean: 0.75, hx: 0.3, lr: [1.5, 0], kr: 0.1, ll: [-0.2, 0.1], kl: 0.4, sl: [-0.4, 0.3], sr: [-0.4, -0.3] } },
    rear: { wind: { lean: -0.2 },
      hit: { lean: -0.75, hx: -0.5, sl: [-2.2, 0.25], el: -1.4, sr: [-2.0, -0.25], er: -1.0, ll: [-0.2, 0.1], kl: 0.3, lr: [-0.9, 0], kr: 1.4, hy: 0.1 } },
    pole: { wind: { sl: [-0.9, 0.2], el: -1.2, sr: [-0.9, -0.2], er: -1.2, twist: -0.5 },
      hit: { sl: [-1.55, 0.1], el: 0, sr: [-1.5, -0.1], er: 0, twist: 0.6, lean: 0.35, ll: [-0.7, 0.2], kl: 0.6, lr: [0.6, -0.1], kr: 0.1 } },
    wing: { wind: { sl: [0.2, 0.3], sr: [0.2, -0.3] }, hit: { sl: [-0.4, 1.5], el: -0.1, sr: [-0.4, -1.5], er: -0.1, lean: -0.2, hx: -0.2 } },
    stomp: { wind: { lr: [-1.5, 0], kr: 1.7, lean: -0.2, hy: 0.05 }, hit: { lr: [-0.2, 0], kr: 0.1, hy: -0.15, lean: 0.2, ll: [0.2, 0.1] } },
    slam: { base: 'air', wind: { hy: -0.3 }, hit: { sl: [-2.8, 0.6], sr: [-2.8, -0.6], el: -0.3, er: -0.3, ll: [-1.6, 0.4], kl: 1.8, lr: [-1.6, -0.4], kr: 1.8, lean: 0.3 } },
    hop: { base: 'air', wind: { hy: -0.2 }, hit: { lean: 0.6, sl: [-1.6, 0.3], el: -0.3, sr: [-1.6, -0.3], er: -0.3 } },
    counterhit: { wind: { sl: [-1.65, 0.05], el: -0.05, twist: -0.7, lean: 0.4 }, hit: { sl: [-1.65, 0.05], el: -0.05, twist: -0.7, lean: 0.4 } },
  };

  function compose(a, b) {
    const o = Object.assign({}, a);
    if (b) for (const k in b) o[k] = Array.isArray(b[k]) ? b[k].slice() : b[k];
    return o;
  }

  // ---------------- Kết cấu dùng chung ----------------
  function radialTex(inner, outer) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, inner); g.addColorStop(0.35, inner); g.addColorStop(1, outer);
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
  }
  let GLOW = null, SHADOW = null;
  function glowTex() { return GLOW || (GLOW = radialTex('rgba(255,255,255,1)', 'rgba(255,255,255,0)')); }
  function shadowTex() { return SHADOW || (SHADOW = radialTex('rgba(0,0,0,0.55)', 'rgba(0,0,0,0)')); }
  G.glowTex = glowTex;

  const PALETTE_ALT = (def) => ({
    cloth: G.shade(def.look.cloth, 0.6), cloth2: G.shade(def.look.cloth2, 0.9), accent: '#f4f0e6',
  });

  // ---------------- Một võ sĩ trên màn hình ----------------
  class FighterView {
    constructor(f, scene, alt) {
      this.f = f;
      this.J = G.buildFighterModel(f.def, alt ? PALETTE_ALT(f.def) : null);
      scene.add(this.J.root);
      this.cur = compose(STANCE, {});
      this.face = f.facing;
      this.hipH = 0.88 * f.def.scale;
      this.J.tilt.position.y = this.hipH;
      this.J.body.position.y = -this.hipH;
      const sh = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false }));
      sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012; scene.add(sh); this.shadow = sh;
      const aura = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color: 0xffffff, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
      aura.scale.set(2.4, 3, 1); scene.add(aura); this.aura = aura;
      this.walkPhase = 0; this.t = 0;
    }

    dispose(scene) { scene.remove(this.J.root); scene.remove(this.shadow); scene.remove(this.aura); }

    targetPose() {
      const f = this.f, st = f.state, t = this.t;
      if (f.inSeq) {
        if (st === 'grabbed') return f.seqKind === 'ride' ? compose(HIT, { hx: 0.3 + 0.2 * Math.sin(t * 20) }) : GRABBED;
        if (f.seqKind === 'ride') return compose(RIDE, { hx: 0.5 + 0.3 * Math.sin(t * 25) });
        if (f.seqKind === 'cine') {
          const k = (f.cineHit || 0) % 3;
          return compose(STANCE, k === 0 ? A.jab.hit : k === 1 ? A.heavy.hit : A.kick.hit);
        }
        return HOLD;
      }
      switch (st) {
        case 'intro': return this.f.game.phaseT < 50 ? BOW : STANCE;
        case 'idle': return compose(STANCE, { hy: -0.06 + 0.018 * Math.sin(t * 4.5) });
        case 'guard': return BLOCK;
        case 'walk': {
          const s = Math.sin(this.walkPhase), c = Math.cos(this.walkPhase);
          return compose(STANCE, { ll: [-0.35 + 0.55 * s, 0.12], kl: 0.45 + 0.45 * Math.max(0, c), lr: [0.3 - 0.55 * s, -0.08], kr: 0.35 + 0.45 * Math.max(0, -c), hy: -0.06 + 0.03 * Math.abs(c) });
        }
        case 'crouch': return f.guarding ? CBLOCK : CROUCH;
        case 'prejump': case 'land': return compose(CROUCH, { hy: -0.2 });
        case 'jump': return compose(AIR, { tz: f.vx * f.facing > 0.02 && f.def.stats.cd >= 4 ? -Math.min(1, (f.jumpVy - f.vy) / (2 * f.jumpVy)) * TAU : 0 });
        case 'dash': return f.vx * f.facing > 0 ? compose(STANCE, { lean: 0.55, ll: [-1.0, 0.1], kl: 0.6, lr: [0.7, -0.1], kr: 0.9 }) : compose(STANCE, { lean: -0.3, ll: [0.2, 0.1], lr: [-0.6, -0.1], kr: 0.6 });
        case 'hitstun': return f.air ? AIRHIT : HIT;
        case 'blockstun': return f.cblock ? CBLOCK : BLOCK;
        case 'knockdown': return DOWN;
        case 'getup': return compose(CROUCH, {});
        case 'ko': return f.air ? AIRHIT : DOWN;
        case 'win': return compose(WIN, { hy: 0.04 * Math.abs(Math.sin(t * 5)), sl: [-2.9 + 0.2 * Math.sin(t * 5), 0.35] });
        case 'lose': return LOSE;
        case 'attack': return this.attackPose();
      }
      return STANCE;
    }

    attackPose() {
      const f = this.f, m = f.move, a = A[m.anim] || A.jab, cf = f.cf;
      let ph, p;
      if (cf < m.hitStart) { ph = 'wind'; p = cf / Math.max(1, m.hitStart); }
      else if (m.endOnLand || cf < m.hitEnd) { ph = 'hit'; p = 0; }
      else { ph = 'rec'; p = (cf - m.hitEnd) / Math.max(1, f.moveTotal - m.hitEnd); }
      const base = a.base === 'crouch' ? CROUCH : a.base === 'air' || (f.air && m.id && m.id[0] === 'j') ? AIR : STANCE;
      let pose;
      if (ph === 'wind') pose = compose(base, a.wind);
      else if (ph === 'hit' || p < 0.45) pose = compose(base, a.hit || a.wind);
      else pose = base;
      if (a.fn) { const extra = a.fn(f, cf, ph, p); if (extra) pose = compose(pose, extra); }
      this.snap = ph === 'hit';
      return pose;
    }

    update(dt, time) {
      const f = this.f, J = this.J;
      this.t = time;
      this.walkPhase += f.vx * f.facing * 9 * (f.state === 'walk' ? 1 : 0);
      J.root.position.set(f.x, f.y, 0);
      this.face += (f.facing - this.face) * Math.min(1, dt * 22);
      J.root.scale.x = Math.abs(this.face) < 0.15 ? Math.sign(this.face || 1) * 0.15 : this.face;
      const tgt = this.targetPose();
      const c = this.cur;
      const k = 1 - Math.pow(this.snap ? 0.25 : 0.55, dt * 60);
      this.snap = false;
      for (const key in tgt) {
        const v = tgt[key];
        if (Array.isArray(v)) { c[key][0] += (v[0] - c[key][0]) * k; c[key][1] += (v[1] - c[key][1]) * k; }
        else {
          if (key === 'tz' || key === 'spin') {
            let d = v - c[key];
            if (Math.abs(v) < 1e-6 && Math.abs(d) > Math.PI) { c[key] = ((c[key] % TAU) + TAU + Math.PI) % TAU - Math.PI; d = v - c[key]; }
            c[key] += d * (key === 'tz' && Math.abs(d) > 1.5 ? 1 : k);
          } else c[key] += (v - c[key]) * k;
        }
      }
      // gán vào khớp
      J.hips.position.y = 0.88 + c.hy;
      J.spine.rotation.set(c.lean, c.twist, c.side);
      J.neck.rotation.set(c.hx, c.hyaw, 0);
      J.shL.rotation.set(c.sl[0], 0, c.sl[1]); J.elL.rotation.x = c.el;
      J.shR.rotation.set(c.sr[0], 0, c.sr[1]); J.elR.rotation.x = c.er;
      J.legL.rotation.set(c.ll[0], 0, c.ll[1]); J.knL.rotation.x = c.kl;
      J.legR.rotation.set(c.lr[0], 0, c.lr[1]); J.knR.rotation.x = c.kr;
      J.tilt.rotation.set(c.tx, 0, c.tz);
      J.tilt.position.y = this.hipH + c.ty * f.def.scale;
      J.body.rotation.y = TURN + c.spin;
      const fullK = 1 + 0.07 * (f.full || 0);
      J.body.scale.set(f.def.scale * fullK, f.def.scale, f.def.scale * fullK);
      // đuôi
      const amp = f.state === 'walk' || f.state === 'dash' ? 0.35 : 0.18;
      J.tail.forEach((s, i) => { s.rotation.y = Math.sin(time * 4 + i * 0.7) * amp * (i === 0 ? 0.5 : 1); });
      J.root.visible = !f.hidden;
      // nháy sáng khi trúng đòn / buff
      let em = 0x000000;
      if (f.flash > 0) em = 0x5a3020;
      else if (f.counterFx > 0) { em = 0x666666; f.counterFx--; }
      else if (f.buffs.endure) em = 0x2a1a00;
      else if (f.poison.stacks > 0 && Math.floor(time * 6) % 2 === 0) em = 0x0f2a00;
      if (em !== this.lastEm) { for (const m of J.mats) m.emissive.setHex(em); this.lastEm = em; }
      // bóng
      const sc = Math.max(0.3, 1 - f.y * 0.25) * f.def.scale * (f.def.look.bulk || 1);
      this.shadow.position.x = f.x; this.shadow.scale.set(1.5 * sc, 0.75 * sc, 1);
      this.shadow.visible = !f.hidden;
      // hào quang
      const buffColor = f.buffs.roar ? 0xff8a2a : f.buffs.rain ? 0x4fb8ff : f.buffs.nine ? 0xd8e04a : f.buffs.venom ? 0x8be03a
        : f.buffs.gallop ? 0xff6a3a : f.buffs.mark ? 0xffe08a : f.buffs.endure ? 0xe8b84e : 0;
      const superOn = f.state === 'attack' && f.move && f.move.type === 'super';
      this.aura.position.set(f.x, f.y + 1.0 * f.def.scale, -0.3);
      const target = superOn ? 0.75 : buffColor ? 0.35 + 0.1 * Math.sin(time * 8) : 0;
      if (superOn) this.aura.material.color.set(G.ELEMENTS[f.def.element].color);
      else if (buffColor) this.aura.material.color.setHex(buffColor);
      this.aura.material.opacity += (target - this.aura.material.opacity) * 0.2;
      this.aura.visible = this.aura.material.opacity > 0.02 && !f.hidden;
    }
  }
  G.FighterView = FighterView;

  // ---------------- Hiệu ứng hạt ----------------
  class FX {
    constructor(scene) {
      this.scene = scene; this.list = [];
      this.sprMats = {};
      this.boxGeo = new T.BoxGeometry(1, 1, 1);
      this.sphGeo = new T.SphereGeometry(1, 10, 8);
    }
    sprite(color, add = true) {
      const m = new T.SpriteMaterial({ map: glowTex(), color: new T.Color(color), transparent: true, blending: add ? T.AdditiveBlending : T.NormalBlending, depthWrite: false });
      return new T.Sprite(m);
    }
    add(obj, o) {
      this.scene.add(obj);
      this.list.push(Object.assign({ obj, vx: 0, vy: 0, vz: 0, life: 20, max: 20, grow: 1, g: 0, fade: true, spin: 0 }, o));
    }
    spark(x, y, type, color) {
      const col = type === 'block' ? '#7fd0ff' : type === 'armor' ? '#ffd27a' : type === 'clash' ? '#ffffff' : type === 'splash' ? (color || '#ff9a3a') : '#ffe7a0';
      const big = type === 'big';
      const fl = this.sprite(type === 'block' ? '#4fa8ff' : big ? '#ff7a2a' : '#ffb347');
      fl.position.set(x, y, 0.4); fl.scale.setScalar(big ? 1.6 : 1.0);
      this.add(fl, { life: big ? 12 : 8, max: big ? 12 : 8, grow: 1.12 });
      const n = big ? 14 : type === 'splash' ? 8 : 8;
      for (let i = 0; i < n; i++) {
        const m = new T.Mesh(this.boxGeo, new T.MeshBasicMaterial({ color: col, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
        const a = Math.random() * TAU, sp = (big ? 0.12 : 0.08) * (0.5 + Math.random());
        m.position.set(x, y, 0.45); m.scale.set(0.22, 0.035, 0.035); m.rotation.z = a;
        this.add(m, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 12, max: 12, grow: 0.9, g: type === 'splash' ? 0.006 : 0 });
      }
      if (big) this.ring(x, y, '#ffd27a');
    }
    ring(x, y, color) {
      const m = new T.Mesh(new T.RingGeometry(0.8, 1, 32), new T.MeshBasicMaterial({ color, transparent: true, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false }));
      m.position.set(x, y, 0.3); m.scale.setScalar(0.3);
      this.add(m, { life: 16, max: 16, grow: 1.16 });
    }
    dust(x, y, size = 1) {
      for (let i = 0; i < 5; i++) {
        const s = this.sprite('#d8c8a8', false); s.material.userData.base = 0.5;
        s.position.set(x + (Math.random() - 0.5) * 0.4, y + 0.1, 0.2); s.scale.setScalar(0.35 * size);
        this.add(s, { vx: (Math.random() - 0.5) * 0.04 * size, vy: 0.008 + Math.random() * 0.01, life: 24, max: 24, grow: 1.04 });
      }
    }
    smoke(x, y) {
      for (let i = 0; i < 8; i++) {
        const s = this.sprite('#cfc6e0', false); s.material.userData.base = 0.7;
        s.position.set(x + (Math.random() - 0.5) * 0.6, y + Math.random(), 0.3); s.scale.setScalar(0.5);
        this.add(s, { vx: (Math.random() - 0.5) * 0.03, vy: 0.01, life: 22, max: 22, grow: 1.05 });
      }
    }
    heal(f) {
      for (let i = 0; i < 4; i++) {
        const s = this.sprite('#7dff8a');
        s.position.set(f.x + (Math.random() - 0.5) * 0.8, f.y + 0.4 + Math.random() * 1.2, 0.3); s.scale.setScalar(0.25);
        this.add(s, { vy: 0.02, life: 30, max: 30, grow: 1 });
      }
    }
    eruption(x, color) {
      for (let i = 0; i < 6; i++) {
        const m = new T.Mesh(new T.ConeGeometry(0.12, 2.2, 8), new T.MeshToonMaterial({ color, gradientMap: G.gradientMap() }));
        m.position.set(x + (i - 2.5) * 0.25, -1.1, (Math.random() - 0.5) * 0.6);
        this.add(m, { vy: 0.12, life: 26, max: 26, grow: 1, g: 0.008, fade: false });
      }
      this.dust(x, 0, 2.5);
    }
    shock(x) {
      for (const d of [1, -1]) {
        const m = new T.Mesh(new T.TorusGeometry(0.5, 0.12, 6, 20), new T.MeshBasicMaterial({ color: '#d8b070', transparent: true, depthWrite: false }));
        m.rotation.x = Math.PI / 2; m.position.set(x, 0.1, 0); m.scale.set(1, 1, 0.4);
        this.add(m, { life: 30, max: 30, grow: 1.12 });
      }
      this.dust(x, 0, 3);
    }
    update() {
      for (const p of this.list) {
        p.life--;
        p.vy -= p.g;
        p.obj.position.x += p.vx; p.obj.position.y += p.vy; p.obj.position.z += p.vz;
        if (p.grow !== 1) p.obj.scale.multiplyScalar(p.grow);
        if (p.fade && p.obj.material) p.obj.material.opacity = Math.max(0, p.life / p.max) * (p.obj.material.userData.base || 1);
        if (p.life <= 0) { this.scene.remove(p.obj); if (p.obj.material) p.obj.material.dispose(); }
      }
      this.list = this.list.filter((p) => p.life > 0);
    }
  }
  G.FX = FX;

  // ---------------- Đạn ----------------
  G.makeProjMesh = function (pr, scene) {
    const grp = new T.Group();
    const col = new T.Color(pr.color || '#ffffff');
    const toon = (c) => new T.MeshToonMaterial({ color: c, gradientMap: G.gradientMap() });
    const glow = (c, s) => { const sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color: c, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); sp.scale.setScalar(s); grp.add(sp); return sp; };
    const sph = (c, r, x = 0, y = 0, z = 0, basic) => { const m = new T.Mesh(new T.SphereGeometry(r, 12, 10), basic ? new T.MeshBasicMaterial({ color: c }) : toon(c)); m.position.set(x, y, z); grp.add(m); return m; };
    const k = pr.kind, f = pr.facing;
    grp.userData.spin = 0;
    switch (k) {
      case 'orb': sph('#d8f4ff', 0.2, 0, 0, 0, true); glow(col, 1.6 * (pr.big ? 1.4 : 1)); glow('#ffffff', 0.7); break;
      case 'grain': for (let i = 0; i < 6; i++) sph('#e8c35a', 0.06, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.3); grp.userData.spin = 0.4; break;
      case 'wave': for (let i = 0; i < 4; i++) { const m = new T.Mesh(new T.ConeGeometry(0.12, 0.5, 6), toon('#8a6a3a')); m.position.set(-f * i * 0.18, 0.05 - i * 0.05, (i % 2 - 0.5) * 0.3); grp.add(m); } break;
      case 'venom': sph('#9be03a', 0.16, 0, 0, 0); sph('#c8ff6a', 0.08, -f * 0.18, 0.03, 0); glow('#7dff3a', 0.9); break;
      case 'fruit': { sph('#ff8a2a', 0.17); const l = new T.Mesh(new T.ConeGeometry(0.05, 0.14, 5), toon('#3a8a2a')); l.position.y = 0.18; grp.add(l); grp.userData.spin = 0.25; break; }
      case 'sonic': for (let i = 0; i < 3; i++) { const m = new T.Mesh(new T.TorusGeometry(0.25 + i * 0.12, 0.03, 6, 20), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8 - i * 0.2 })); m.rotation.y = Math.PI / 2; m.position.x = -f * i * 0.15; grp.add(m); } break;
      case 'gust': for (let i = 0; i < 3; i++) { const m = new T.Mesh(new T.TorusGeometry(0.5, 0.04, 6, 16, Math.PI), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 })); m.rotation.set(0, Math.PI / 2, Math.PI / 2); m.position.set(-f * i * 0.2, (i - 1) * 0.3, 0); grp.add(m); } break;
      case 'swarm': for (let i = 0; i < 16; i++) { const r = new T.Group(); const b = new T.Mesh(new T.SphereGeometry(1, 8, 6), toon('#8f8c93')); b.scale.set(0.14, 0.09, 0.08); r.add(b); const e = new T.Mesh(new T.SphereGeometry(0.04, 6, 4), toon('#e8a3b5')); e.position.set(f * 0.1, 0.07, 0); r.add(e); r.position.set((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 0.4 - 0.1, (Math.random() - 0.5) * 1.2); r.userData.ph = Math.random() * 6; grp.add(r); } grp.userData.jitter = true; break;
      case 'dragon': { const c2 = toon('#3f9a7a'); for (let i = 0; i < 9; i++) { const m = new T.Mesh(new T.SphereGeometry(0.32 - i * 0.025, 10, 8), c2); m.position.set(-f * i * 0.32, 0, 0); m.userData.i = i; grp.add(m); } const head = new T.Mesh(new T.SphereGeometry(0.42, 12, 10), toon('#f0dc8c')); head.scale.set(1.3, 0.8, 0.8); head.position.x = f * 0.3; grp.add(head); glow('#4fb8ff', 3); grp.userData.snake = true; break; }
      case 'stampede': for (let i = 0; i < 5; i++) { const h = new T.Group(); const b = new T.Mesh(new T.SphereGeometry(1, 10, 8), toon('#8a5430')); b.scale.set(0.45, 0.25, 0.2); h.add(b); const hd = new T.Mesh(new T.SphereGeometry(1, 8, 6), toon('#7a4a2a')); hd.scale.set(0.18, 0.12, 0.1); hd.position.set(f * 0.45, 0.2, 0); h.add(hd); h.position.set(-f * (i % 3) * 0.6, (i % 2) * 0.5 - 0.3, (i - 2) * 0.3); h.userData.ph = i; grp.add(h); } grp.userData.bob = true; glow('#ff9a5a', 2.5); break;
      case 'clone': for (let i = 0; i < 5; i++) { const h = new T.Group(); const b = new T.Mesh(new T.SphereGeometry(1, 8, 6), toon('#f2c94c')); b.scale.set(0.16, 0.24, 0.14); h.add(b); const hd = new T.Mesh(new T.SphereGeometry(0.12, 8, 6), toon('#b8732e')); hd.position.y = 0.3; h.add(hd); h.position.set(-f * (i % 3) * 0.4, (i % 2) * 0.6 - 0.3, (i - 2) * 0.35); h.userData.ph = i; grp.add(h); } grp.userData.bob = true; glow('#f2c94c', 2.4); break;
      case 'trio': for (const [c, i] of [['#efe9dc', 0], ['#b8732e', 1], ['#c2401f', 2]]) { const m = sph(c, 0.26); m.userData.i = i; } grp.userData.orbit = true; glow('#f2c94c', 2.4); break;
      case 'shout': for (let i = 0; i < 4; i++) { const m = new T.Mesh(new T.TorusGeometry(0.5 + i * 0.25, 0.05, 6, 24), new T.MeshBasicMaterial({ color: '#ffd23a', transparent: true, opacity: 0.9 - i * 0.18 })); m.rotation.y = Math.PI / 2; m.position.x = -f * i * 0.2; grp.add(m); } break;
      default: sph(col, 0.2); glow(col, 1.2);
    }
    grp.position.set(pr.x, pr.y, 0);
    scene.add(grp);
    return grp;
  };

  G.updateProjMesh = function (g, pr, time) {
    g.position.set(pr.x, pr.y, 0);
    if (g.userData.spin) g.rotation.z -= g.userData.spin * pr.facing;
    if (g.userData.jitter) g.children.forEach((c) => { c.position.y = -0.1 + Math.abs(Math.sin(time * 18 + c.userData.ph)) * 0.12; });
    if (g.userData.bob) g.children.forEach((c) => { if (c.userData.ph != null) c.position.y += Math.sin(time * 14 + c.userData.ph) * 0.01; });
    if (g.userData.snake) g.children.forEach((c) => { if (c.userData.i != null) c.position.y = Math.sin(time * 8 - c.userData.i * 0.7) * 0.25; });
    if (g.userData.orbit) g.children.forEach((c) => { if (c.userData.i != null) { const a = time * 9 + c.userData.i * 2.1; c.position.set(Math.cos(a) * 0.15, Math.sin(a) * 0.4, Math.cos(a) * 0.4); } });
  };

  G.makeTrapMesh = function (tr, scene) {
    const g = new T.Group();
    const m = new T.Mesh(new T.TorusGeometry(0.3, 0.09, 8, 18), new T.MeshToonMaterial({ color: '#8fbf6a', gradientMap: G.gradientMap(), transparent: true, opacity: 0.85 }));
    m.rotation.x = Math.PI / 2; m.scale.set(1.2, 1, 0.6); g.add(m);
    const h = new T.Mesh(new T.SphereGeometry(0.1, 8, 6), new T.MeshToonMaterial({ color: '#8fbf6a', gradientMap: G.gradientMap() }));
    h.position.set(0.3, 0.1, 0); g.add(h);
    g.position.set(tr.x, 0.08, 0.1);
    scene.add(g); return g;
  };
  G.makeTargetMesh = function (tg, scene) {
    const m = new T.Mesh(new T.RingGeometry(0.5, 0.75, 28), new T.MeshBasicMaterial({ color: '#9be03a', transparent: true, opacity: 0.8, side: T.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(tg.x, 0.03, 0);
    scene.add(m); return m;
  };

  // ---------------- Cảnh 3D tổng ----------------
  class View {
    constructor(canvas) {
      this.renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      this.renderer.outputEncoding = T.sRGBEncoding;
      this.camera = new T.PerspectiveCamera(32, 16 / 9, 0.1, 400);
      this.camPos = new T.Vector3(0, 2.2, 12); this.camLook = new T.Vector3(0, 1.25, 0);
      this.shake = 0; this.time = 0;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
    resize() {
      const w = this.renderer.domElement.clientWidth || window.innerWidth, h = this.renderer.domElement.clientHeight || window.innerHeight;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
    setGame(game) {
      if (this.scene) this.disposeScene();
      this.game = game;
      const scene = this.scene = new T.Scene();
      this.stage = G.buildStage(game.stage, scene);
      this.fx = new FX(scene);
      game.fx = this.fx;
      const same = game.fighters[0].def.id === game.fighters[1].def.id;
      this.fviews = game.fighters.map((f, i) => new FighterView(f, scene, same && i === 1));
      this.objs = new Map();
      game.on((type, d) => {
        if (type === 'proj') this.objs.set(d, G.makeProjMesh(d, scene));
        else if (type === 'trap') this.objs.set(d, G.makeTrapMesh(d, scene));
        else if (type === 'target') this.objs.set(d, G.makeTargetMesh(d, scene));
        else if (type === 'remove') { const o = this.objs.get(d); if (o) { scene.remove(o); this.objs.delete(d); } }
        else if (type === 'shake') this.shake = Math.max(this.shake, d.power);
        else if (type === 'super') this.superSide = d.side;
      });
      // mưa khi Rồng hô mưa
      const n = 600, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 30; pos[i * 3 + 1] = Math.random() * 12; pos[i * 3 + 2] = (Math.random() - 0.5) * 10; }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      this.rain = new T.Points(geo, new T.PointsMaterial({ color: 0x9fd0ff, size: 0.06, transparent: true, opacity: 0.7 }));
      this.rain.visible = false; scene.add(this.rain);
      const [a, b] = game.fighters;
      const mid = (a.x + b.x) / 2;
      this.camPos.set(mid, 2.2, 12); this.camLook.set(mid, 1.25, 0);
    }
    disposeScene() {
      this.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      this.scene = null;
    }
    render(dt) {
      if (!this.scene) return;
      this.time += dt;
      const g = this.game, [a, b] = g.fighters;
      for (const v of this.fviews) v.update(dt, this.time);
      for (const [o, m] of this.objs) {
        if (o.kind === 'trap') m.rotation.y += 0.01;
        else if (o.kind === 'target') { m.material.opacity = 0.4 + 0.4 * Math.sin(this.time * 30); }
        else G.updateProjMesh(m, o, this.time);
      }
      if (g.hitstop === 0 && g.flashT === 0) this.fx.update();
      this.stage.update(dt, this.time);
      // mưa
      const raining = a.buffs.rain || b.buffs.rain || g.stage.props === 'sea';
      this.rain.visible = !!raining;
      if (raining) {
        const p = this.rain.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) { let y = p.getY(i) - 0.25; if (y < 0) y += 12; p.setY(i, y); }
        p.needsUpdate = true;
        this.rain.position.x = this.camLook.x;
      }
      // máy quay
      const d = Math.abs(a.x - b.x);
      let mid = (a.x + b.x) / 2, z = Math.max(8.6, Math.min(13.5, 7.4 + d * 0.62)), y = 2.15 + Math.max(a.y, b.y) * 0.3, ly = 1.25 + Math.max(a.y, b.y) * 0.25;
      if (g.flashT > 0 && this.superSide != null) {
        const f = g.fighters[this.superSide];
        mid = f.x; z = 6.2; y = 1.7; ly = 1.2;
      }
      const lim = G.C.HALF - 3.2;
      mid = Math.max(-lim, Math.min(lim, mid));
      const k = 1 - Math.pow(0.88, dt * 60);
      this.camPos.x += (mid - this.camPos.x) * k; this.camPos.y += (y - this.camPos.y) * k; this.camPos.z += (z - this.camPos.z) * k;
      this.camLook.x += (mid - this.camLook.x) * k; this.camLook.y += (ly - this.camLook.y) * k;
      if (g.hitstop > 6) this.shake = Math.max(this.shake, 0.08);
      const sx = (Math.random() - 0.5) * this.shake, sy = (Math.random() - 0.5) * this.shake;
      this.shake *= 0.85;
      this.camera.position.set(this.camPos.x + sx, this.camPos.y + sy, this.camPos.z);
      this.camera.lookAt(this.camLook.x + sx * 0.5, this.camLook.y, 0);
      this.renderer.render(this.scene, this.camera);
    }
  }
  G.View = View;
})();

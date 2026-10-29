'use strict';
// Logic một võ sĩ: trạng thái, di chuyển, ra chiêu. Chạy cố định 60 khung hình/giây.
(function () {
  const G = window.G;
  const C = G.C = { GRAV: 0.0105, HALF: 8.4, MAXD: 8.0, KHI: 300, BN: 100 };

  function mk(base, extra) {
    const m = Object.assign({}, G.moveDefaults, base, extra || {});
    m.hitStart = m.activeFrom != null ? m.activeFrom : m.startup;
    m.hitEnd = m.hitStart + m.active;
    m.total = Math.max(m.startup + m.active, m.hitEnd) + m.recovery;
    return m;
  }
  G.mkMove = mk;

  // Chiêu dùng cho Bản Năng
  const INSTINCT_MOVES = {
    ty:   { anim: 'hop', startup: 6, active: 2, recovery: 22, type: 'instinct', grab: { at: 6, range: 1.35, ride: true } },
    suu:  { anim: 'roar', startup: 24, active: 1, recovery: 6, type: 'instinct', instinctAt: 12 },
    dan:  { anim: 'roar', startup: 20, active: 1, recovery: 14, type: 'instinct', instinctAt: 18 },
    mao:  { anim: 'pose', startup: 12, active: 1, recovery: 2, type: 'instinct', instinctAt: 4 },
    thin: { anim: 'roar', startup: 24, active: 1, recovery: 6, type: 'instinct', instinctAt: 12 },
    ti:   { anim: 'pose', startup: 18, active: 1, recovery: 4, type: 'instinct', instinctAt: 8 },
    ngo:  { anim: 'rear', startup: 14, active: 1, recovery: 4, type: 'instinct', instinctAt: 6 },
    mui:  { anim: 'eat', startup: 1, active: 120, recovery: 10, type: 'instinct', graze: true },
    than: { anim: 'pose', startup: 1, active: 1, recovery: 1, type: 'instinct' },
    dau:  { anim: 'stance', startup: 2, active: 42, recovery: 12, type: 'instinct', counter: { from: 2, to: 44, mult: 2, min: 70, proj: true } },
    tuat: { anim: 'roar', startup: 16, active: 1, recovery: 6, type: 'instinct', instinctAt: 8 },
    hoi:  { anim: 'eat', startup: 1, active: 60, recovery: 8, type: 'instinct', instinctAt: 50 },
  };
  const COUNTER_STRIKE = mk({ anim: 'counterhit', startup: 1, active: 1, recovery: 20, type: 'instinct' });

  G.buildMoves = function (def, f) {
    const m = {};
    for (const k in G.NORMALS) {
      const n = mk(G.NORMALS[k], { id: k });
      if (n.type === 'normal') {
        n.startup = Math.max(3, n.startup + f.startAdj + (def.normalAdj || 0));
        n.recovery = Math.max(5, n.recovery + f.startAdj);
        n.dmg *= def.normalDmg || 1;
        n.hb = { x: n.hb.x * f.rangeMul, y: n.hb.y, w: n.hb.w * f.rangeMul, h: n.hb.h };
        n.hitStart = n.startup; n.hitEnd = n.startup + n.active; n.total = n.hitEnd + n.recovery;
      }
      m[k] = n;
    }
    for (const k in def.specials) m[k] = mk(def.specials[k], { id: k });
    m.super = mk(def.super, { id: 'super' });
    m.instinct = mk(INSTINCT_MOVES[def.id], { id: 'instinct' });
    return m;
  };

  class Fighter {
    constructor(def, side, game) {
      this.def = def; this.side = side; this.game = game;
      const s = def.stats;
      this.maxHp = 800 + 80 * s.mau;
      this.dmgMul = 0.8 + 0.08 * s.st;
      this.walkSpd = 0.025 + 0.01 * s.toc;
      this.startAdj = 3 - s.toc;
      this.rangeMul = 0.95 + 0.05 * s.tam;
      this.jumpVy = 0.165 + 0.012 * s.cd;
      this.airVx = 0.035 + 0.008 * s.cd;
      this.dashVx = 0.11 + 0.012 * s.cd;
      this.scale = def.scale;
      this.bodyW = 0.72 * def.scale * (def.look.bulk || 1);
      this.moves = G.buildMoves(def, this);
      this.khi = 0; this.wins = 0;
      this.resetRound(side === 0 ? -2.2 : 2.2);
    }

    resetRound(x) {
      this.x = x; this.y = 0; this.vx = 0; this.vy = 0; this.kb = 0; this.air = false;
      this.facing = this.side === 0 ? 1 : -1;
      this.hp = this.maxHp; this.state = 'intro'; this.timer = 0; this.move = null; this.mf = 0; this.cf = 0;
      this.stun = 0; this.combo = 0; this.comboDmg = 0; this.juggle = 0; this.airHit = false;
      this.buffs = {}; this.poison = { stacks: 0, t: 0, tick: 0, fast: false }; this.momentum = 0; this.full = 0;
      this.inv = 0; this.hidden = false; this.lastSpecial = null; this.airAttackUsed = false;
      this.hitsDone = 0; this.lastHitF = -99; this.connected = false; this.copying = false;
      this.inSeq = false; this.cblock = false; this.flash = 0; this.t = 0; this.walkPhase = 0;
      this.bn = 20; this.armorUsed = false; this.momUsed = 0; this.moveTotal = 0; this.counterFx = 0;
    }

    get opp() { return this.game.fighters[1 - this.side]; }

    actionable() { return ['idle', 'walk', 'crouch', 'guard'].includes(this.state); }

    faceOpp() {
      const o = this.opp;
      if (Math.abs(o.x - this.x) > 0.05) this.facing = o.x > this.x ? 1 : -1;
    }

    spdMul() {
      let k = 1;
      if (this.buffs.gallop) k *= 1.3;
      k *= 1 - 0.1 * this.full;
      return k;
    }

    momLevel() { return Math.min(3, Math.floor(this.momentum / 60)); }

    dmgOut(isSuper) {
      let k = this.dmgMul;
      if (this.buffs.roar) k *= 1.15;
      if (this.buffs.mark) k *= 1.15;
      if (this.copying) k *= 0.7;
      if (this.def.id === 'ngo') k *= [1, 1.1, 1.2, 1.35][this.momUsed];
      if (isSuper && this.game.elementOn && G.KHAC[this.def.element] === this.opp.def.element) k *= 1.05;
      return k;
    }

    dmgIn() {
      let k = 1;
      if (this.buffs.endure) k *= 0.85;
      if (this.def.id === 'ty') k *= 0.85;
      k *= 1 - 0.08 * this.full;
      if (this.state === 'attack' && this.move && this.move.graze) k *= 1.25;
      return k;
    }

    invulnerable() {
      if (this.inv > 0 || this.hidden) return true;
      if (['knockdown', 'getup', 'ko', 'intro', 'win', 'lose'].includes(this.state)) return true;
      if (this.state === 'attack' && this.move && this.move.inv) {
        const [a, b] = this.move.inv;
        if (this.cf >= a && this.cf < b) return true;
      }
      if (this.airHit && this.juggle >= 4) return true;
      return false;
    }

    hasArmor() {
      if (this.state !== 'attack' || !this.move || this.armorUsed) return false;
      const m = this.move;
      if (m.armor && this.cf >= m.armor[0] && this.cf < m.armor[1]) return true;
      if (this.buffs.endure && (m.id === 'sH' || m.type === 'special') && this.cf < m.hitEnd) return true;
      return false;
    }

    counterActive(isProj) {
      if (this.state !== 'attack' || !this.move || !this.move.counter) return false;
      const c = this.move.counter;
      if (isProj && !c.proj) return false;
      return this.cf >= c.from && this.cf < c.to;
    }

    crouching() {
      if (this.state === 'crouch') return true;
      if (this.state === 'blockstun') return this.cblock;
      if (this.state === 'attack' && this.move) {
        if (this.move.id && this.move.id[0] === 'c' && this.move.type === 'normal') return true;
      }
      return false;
    }

    hurtbox() {
      const s = this.scale;
      let h = 1.75 * s;
      if (this.crouching()) h = 1.1 * s;
      if (this.state === 'attack' && this.move && this.move.lowProfile) {
        const [a, b] = this.move.lowProfile;
        if (this.cf >= a && this.cf < b) h = 0.75 * s;
      }
      if (this.air) h = 1.45 * s;
      const w = this.bodyW;
      return { x1: this.x - w / 2, x2: this.x + w / 2, y1: this.y, y2: this.y + h };
    }

    hitbox(m) {
      const s = this.scale, hb = m.hb, sx = 0.5 + 0.5 * s;
      const cx = this.x + this.facing * hb.x * sx;
      return { x1: cx - hb.w * sx / 2, x2: cx + hb.w * sx / 2, y1: this.y + (hb.y - hb.h / 2) * s, y2: this.y + (hb.y + hb.h / 2) * s };
    }

    hitActive() {
      if (this.state !== 'attack' || !this.move || !this.move.hb || this.hidden) return false;
      const m = this.move;
      if (this.hitsDone >= m.hits) return false;
      if (this.cf < m.hitStart) return false;
      if (!m.endOnLand && this.cf >= m.hitEnd) return false;
      if (this.hitsDone > 0 && this.cf - this.lastHitF < (m.hitEvery || 999)) return false;
      return true;
    }

    // ---------------- Cập nhật mỗi khung hình ----------------
    update(inp) {
      this.inp = inp; this.t++;
      this.tickBuffs();
      if (this.inSeq) return;
      if (this.inv > 0) this.inv--;
      if (this.flash > 0) this.flash--;
      switch (this.state) {
        case 'intro': case 'win': case 'lose': this.vx = 0; break;
        case 'ko': break;
        case 'grabbed': return;
        case 'hitstun':
          if (!this.air && --this.stun <= 0) this.toNeutral();
          break;
        case 'blockstun':
          if (--this.stun <= 0) this.toNeutral();
          break;
        case 'knockdown':
          if (--this.timer <= 0) { this.state = 'getup'; this.timer = this.def.id === 'mao' ? 6 : 16; }
          break;
        case 'getup':
          if (--this.timer <= 0) { this.toNeutral(); this.inv = 4; }
          break;
        case 'land':
          this.vx *= 0.5;
          if (--this.timer <= 0) this.toNeutral();
          break;
        case 'prejump':
          if (--this.timer <= 0) this.doJump();
          break;
        case 'dash':
          if (--this.timer <= 0) this.toNeutral();
          else this.vx *= 0.94;
          break;
        case 'jump': this.airActions(inp); break;
        case 'attack': this.updateMove(inp); break;
        default: this.neutral(inp);
      }
      this.physics();
    }

    tickBuffs() {
      for (const k in this.buffs) {
        if (this.buffs[k] > 0) { this.buffs[k]--; if (this.buffs[k] <= 0) delete this.buffs[k]; }
      }
      if (this.game.phase === 'fight') {
        this.bn = Math.min(C.BN, this.bn + 0.06);
        // độc
        const p = this.poison;
        if (p.stacks > 0) {
          p.t--; p.tick++;
          const every = p.fast ? 10 : 20;
          if (p.tick >= every) {
            p.tick = 0;
            if (this.hp > 1) { const d = Math.min(this.hp - 1, p.stacks * 1.0); this.hp -= d; if (G.onDmg) G.onDmg(this.opp.def.id, 'poison', d, this.def.id); }
          }
          if (p.t <= 0) { p.stacks = 0; p.fast = false; }
        }
        if (this.def.id === 'ngo') {
          if (this.buffs.gallop) this.momentum = 180;
          else if (!(this.state === 'walk' && this.vx * this.facing > 0) && this.state !== 'dash') this.momentum = Math.max(0, this.momentum - 0.5);
        }
      }
    }

    addPoison(n, fast) {
      const p = this.poison;
      p.stacks = Math.min(5, p.stacks + n); p.t = 240;
      if (fast) p.fast = true;
    }

    toNeutral() {
      this.state = this.inp && this.inp.h.d ? 'crouch' : 'idle';
      this.move = null; this.juggle = 0; this.airHit = false; this.copying = false; this.hidden = false;
    }

    neutral(inp) {
      this.faceOpp();
      if (this.tryAction(inp, null)) return;
      const fwd = this.facing > 0 ? inp.h.r : inp.h.l;
      const back = this.facing > 0 ? inp.h.l : inp.h.r;
      if (inp.h.u) {
        this.state = 'prejump'; this.timer = 3; this.jdir = fwd ? 1 : back ? -1 : 0; this.vx = 0;
        return;
      }
      if (inp.tap2 && !inp.h.d) {
        const dir = (inp.tap2 === 'r') === (this.facing > 0) ? 1 : -1;
        this.state = 'dash'; this.timer = dir > 0 ? 16 : 14;
        this.vx = dir * this.dashVx * this.spdMul() * this.facing * (dir < 0 ? 0.9 : 1);
        if (dir > 0 && this.def.id === 'ngo') this.momentum = Math.min(180, this.momentum + 25);
        this.game.fx.dust(this.x, 0);
        return;
      }
      const threat = this.game.threatNear(this);
      if (inp.h.d) { this.state = 'crouch'; this.vx = 0; this.guarding = back && threat; return; }
      if (back && threat) { this.state = 'guard'; this.vx = 0; return; }
      if (fwd) {
        this.state = 'walk'; this.vx = this.walkSpd * this.spdMul() * this.facing;
        if (this.def.id === 'ngo') this.momentum = Math.min(180, this.momentum + 1);
      } else if (back) {
        this.state = 'walk'; this.vx = -this.walkSpd * 0.8 * this.spdMul() * this.facing;
      } else { this.state = 'idle'; this.vx = 0; }
    }

    doJump() {
      this.air = true; this.vy = this.jumpVy; this.state = 'jump'; this.airAttackUsed = false;
      this.vx = this.jdir * this.airVx * this.spdMul() * this.facing;
      this.game.fx.dust(this.x, 0);
    }

    airActions(inp) {
      if (this.airAttackUsed) return;
      for (const b of ['H', 'M', 'L']) {
        if (inp.p(b)) { inp.use(b); this.airAttackUsed = true; this.startMove('j' + b); return; }
      }
    }

    canCancel(id, from) {
      if (!from) return true;
      if (id === 'super') return from.type === 'normal' || from.type === 'special';
      const mv = this.moves[id];
      if (mv.type === 'special') return from.type === 'normal' && from.id[0] !== 'j';
      return !!(from.chain && from.chain.includes(id));
    }

    tryAction(inp, from) {
      const d = inp.h.d;
      const fwd = this.facing > 0 ? inp.h.r : inp.h.l;
      if (inp.p('U') && this.khi >= C.KHI && this.canCancel('super', from)) {
        inp.use('U'); this.doSuper(); return true;
      }
      if (!from && inp.p('B') && this.bn >= C.BN) { inp.use('B'); this.doInstinct(); return true; }
      if (!from && inp.p('L', 3) && inp.p('M', 3)) { inp.use('L'); inp.use('M'); this.startMove('throw'); return true; }
      if (inp.p('S')) {
        const id = d ? 'dS' : fwd ? 'fS' : 'nS';
        const busy = this.moves[id].proj && this.game.projs.some((p) => p.owner === this && !p.dead && p.m.type !== 'super');
        if (!busy && this.canCancel(id, from)) { inp.use('S'); this.startMove(id); return true; }
      }
      for (const b of ['H', 'M', 'L']) {
        if (inp.p(b)) {
          const id = (d ? 'c' : 's') + b;
          if (this.canCancel(id, from)) { inp.use(b); this.startMove(id); return true; }
        }
      }
      return false;
    }

    startMove(id) {
      const m = typeof id === 'string' ? this.moves[id] : id;
      this.move = m; this.mf = 0; this.cf = 0; this.state = 'attack'; this.connected = false;
      this.hitsDone = 0; this.lastHitF = -99; this.armorUsed = false;
      this.moveTotal = m.total;
      if (m.id === 'nS' && this.buffs.rain) this.moveTotal -= 8;
      if (m.type === 'special' && !this.copying) this.lastSpecial = m;
      if (!this.air) this.vx = 0;
      this.momUsed = 0;
      if (this.def.id === 'ngo' && m.type !== 'throw' && m.type !== 'instinct') {
        this.momUsed = this.momLevel();
        if (!this.buffs.gallop && this.momUsed > 0) this.momentum = 0;
      }
    }

    endMove() {
      const m = this.move;
      this.copying = false; this.hidden = false;
      if (this.air) {
        this.state = 'jump'; this.move = null;
        this.airAttackUsed = !(m && m.airEnd);
      } else this.toNeutral();
    }

    updateMove(inp) {
      const m = this.move, f = this.mf;
      this.cf = f;
      if (m.motion) {
        let set = false;
        for (const seg of m.motion) {
          if (f >= seg.from && f < seg.to) { this.vx = seg.vx * this.facing * (m.type === 'super' ? 1 : this.spdMul()); set = true; }
        }
        if (!set && !this.air) this.vx *= 0.6;
      } else if (!this.air) this.vx *= 0.6;
      if (m.jump && f === m.jump.at) {
        this.air = true; this.vy = m.jump.vy; this.vx = m.jump.vx * this.facing;
        if (m.id === 'fS' && this.def.id === 'dan') {
          // vồ mồi: canh khoảng cách tới đối thủ
          const dx = Math.abs(this.opp.x - this.x);
          this.vx = Math.min(0.17, Math.max(0.07, dx / 26)) * this.facing;
        }
        this.game.fx.dust(this.x, 0);
      }
      if (m.proj && f === m.proj.at) this.game.spawnProj(this, m.proj, m);
      if (m.grab && !m.grab.onHit && f === m.grab.at) this.game.tryGrab(this, m);
      if (m.teleport) {
        const tp = m.teleport;
        if (f === tp.hide[0]) { this.hidden = true; this.game.fx.dust(this.x, 0, 1.6); }
        if (f === tp.at) this.game.teleport(this, tp);
        if (f === tp.hide[1]) { this.hidden = false; this.game.fx.dust(this.x, 0, 1.6); }
      }
      if (m.trap && f === m.trap.at) this.game.spawnTrap(this, m.trap);
      if (m.target && f === m.target.at) this.game.spawnTarget(this, m.target);
      if (m.instinctAt != null && f === m.instinctAt) this.instinctEffect();
      if (m.graze && f >= m.startup && f < m.hitEnd) {
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.15 / m.active);
        if (f % 20 === 0) this.game.fx.heal(this);
      }
      if (f === m.hitStart && m.hb) this.game.sfx('whoosh', m.type === 'normal' ? 0.5 : 0.8);

      // Nhấn Nhẹ + Trung gần như cùng lúc => vật
      if ((m.id === 'sL' || m.id === 'cL') && f <= 3 && !this.connected && inp.p('M', 2)) {
        inp.use('M'); this.startMove('throw'); return;
      }
      if ((m.id === 'sM' || m.id === 'cM') && f <= 3 && !this.connected && inp.p('L', 2)) {
        inp.use('L'); this.startMove('throw'); return;
      }
      // Hủy chiêu (combo)
      if (this.connected && (m.type === 'normal' || m.type === 'special') && f >= m.hitStart && f < m.hitEnd + 10) {
        if (!this.air || m.type === 'normal') {
          if (!this.air && this.tryAction(inp, m)) return;
        }
      }
      this.mf++;
      if (m.endOnLand) { if (this.mf > 240) this.endMove(); }
      else if (this.mf >= this.moveTotal) this.endMove();
    }

    physics() {
      if (this.state === 'grabbed' || this.inSeq) return;
      if (this.air) {
        this.vy -= C.GRAV;
        this.y += this.vy;
        this.x += this.vx + this.kb;
        if (this.y <= 0 && this.vy <= 0) this.land();
      } else {
        this.x += this.vx + this.kb;
      }
      this.kb *= 0.82;
      if (Math.abs(this.kb) < 0.002) this.kb = 0;
    }

    land() {
      this.y = 0; this.vy = 0; this.air = false;
      const st = this.state;
      if (st === 'ko') { this.vx = 0; this.game.fx.dust(this.x, 0, 2); this.game.sfx('thud'); return; }
      if (st === 'hitstun' && this.airHit) {
        this.state = 'knockdown'; this.timer = this.def.id === 'mao' ? 10 : 36; this.vx = 0;
        this.game.fx.dust(this.x, 0, 2); this.game.sfx('thud');
        return;
      }
      if (st === 'hitstun') { this.vx = 0; return; }
      if (st === 'attack' && this.move) {
        const m = this.move;
        if (m.quake) this.game.quake(this, m.quake);
        if (m.endOnLand) { this.move = null; this.state = 'land'; this.timer = m.landRec; this.vx = 0; this.game.fx.dust(this.x, 0, 1.4); return; }
        if (m.id[0] === 'j') { this.move = null; this.state = 'land'; this.timer = 4; this.vx = 0; return; }
        this.vx = 0;
        return;
      }
      if (st === 'jump') { this.state = 'land'; this.timer = 3; this.vx = 0; this.game.fx.dust(this.x, 0); }
    }

    // ---------------- Tuyệt kỹ và Bản Năng ----------------
    doSuper() {
      this.khi -= C.KHI;
      this.startMove('super');
      this.game.superFlash(this);
    }

    doInstinct() {
      this.bn = 0;
      const id = this.def.id;
      if (id === 'than') {
        const mv = this.opp.lastSpecial;
        this.game.text(this, 'HỌC LỎM' + (mv ? ': ' + mv.name : ''));
        if (mv) { this.copying = true; this.startMove(mv); this.copying = true; }
        else { this.startMove('nS'); }
        return;
      }
      this.startMove('instinct');
      this.game.text(this, this.def.instinct.name.toUpperCase());
      this.game.sfx('power');
    }

    instinctEffect() {
      const id = this.def.id, o = this.opp;
      switch (id) {
        case 'suu': this.buffs.endure = 480; break;
        case 'dan': {
          this.buffs.roar = 300;
          this.game.fx.ring(this.x, 1.4, '#ffb347');
          this.game.sfx('roar');
          if (Math.abs(o.x - this.x) < 4.6 && !o.invulnerable()) {
            o.khi = Math.max(0, o.khi - 50);
            if (!o.air && (o.actionable() || o.state === 'blockstun')) {
              o.state = 'hitstun'; o.stun = 30; o.move = null; o.kb = this.facing * 0.06;
              this.game.text(o, 'KHỰNG!');
            }
          }
          break;
        }
        case 'mao': this.buffs.nine = 300; break;
        case 'thin': this.buffs.rain = 480; break;
        case 'ti': this.buffs.venom = 360; break;
        case 'ngo': this.buffs.gallop = 300; this.momentum = 180; break;
        case 'tuat': this.buffs.mark = 600; break;
        case 'hoi':
          this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.08);
          this.full = Math.min(3, this.full + 1);
          this.game.fx.heal(this); this.game.text(this, 'NO CẤP ' + this.full);
          break;
      }
    }

    counterStrike() { this.startMove(COUNTER_STRIKE); }
  }

  G.Fighter = Fighter;
})();

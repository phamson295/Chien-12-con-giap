'use strict';
// Luật trận đấu: va chạm, trúng đòn, đạn, hiệp đấu.
(function () {
  const G = window.G, C = G.C, mk = G.mkMove;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const overlap = (a, b) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
  const NOOP_FX = new Proxy({}, { get: () => () => {} });

  class Game {
    // opts: { defs:[def,def], stage, mode:'cpu'|'pvp'|'train'|'demo', pads:[Pad,Pad], sources:[src,src] }
    constructor(opts) {
      this.mode = opts.mode;
      this.stage = opts.stage;
      this.pads = opts.pads;
      this.sources = opts.sources;
      this.fx = NOOP_FX;
      this.audio = null;
      this.listeners = [];
      this.elementOn = true;
      this.fighters = [new G.Fighter(opts.defs[0], 0, this), new G.Fighter(opts.defs[1], 1, this)];
      this.projs = []; this.traps = []; this.targets = []; this.seqs = [];
      this.round = 1; this.frame = 0;
      this.hitstop = 0; this.flashT = 0; this.slow = 0;
      this.startRound();
    }

    on(fn) { this.listeners.push(fn); }
    emit(type, data) { for (const fn of this.listeners) fn(type, data || {}); }
    sfx(name, v) { if (this.audio) this.audio.play(name, v); }
    text(f, str) { this.emit('text', { side: f.side, str }); }
    track(A, key, dmg) { if (G.onDmg) G.onDmg(A.def.id, key, dmg, A.opp.def.id); }

    startRound() {
      const [a, b] = this.fighters;
      a.resetRound(-2.2); b.resetRound(2.2);
      for (const o of [...this.projs, ...this.traps, ...this.targets]) o.dead = true;
      this.cleanup();
      this.projs = []; this.traps = []; this.targets = []; this.seqs = [];
      this.phase = 'intro'; this.phaseT = 0;
      this.timer = this.mode === 'train' ? Infinity : 99; this.timerF = 0;
      if (this.mode === 'train') { a.bn = C.BN; b.bn = C.BN; a.khi = C.KHI; b.khi = C.KHI; }
      this.emit('round', { round: this.round });
    }

    step() {
      this.frame++;
      const freeze = this.flashT > 0 || this.hitstop > 0;
      const inputs = [0, 1].map((i) => {
        const pad = this.pads[i];
        pad.feed(this.sources[i].read(this, i), freeze);
        return pad;
      });
      if (this.flashT > 0) { this.flashT--; return; }
      if (this.hitstop > 0) { this.hitstop--; return; }
      if (this.slow > 0) { this.slow--; if (this.slow % 2) return; }

      this.phaseT++;
      this.updatePhase();
      this.updateSeqs();
      this.fighters[0].update(inputs[0]);
      this.fighters[1].update(inputs[1]);
      this.resolvePush();
      this.checkHits();
      this.updateProjs();
      this.updateTraps();
      this.updateTargets();
      this.comboReset();
      if (this.mode === 'train') this.trainingAssist();
      this.cleanup();
    }

    updatePhase() {
      const [a, b] = this.fighters;
      if (this.phase === 'intro') {
        if (this.phaseT === 1) this.emit('banner', { text: 'HIỆP ' + this.round, sub: this.stage.name });
        if (this.phaseT === 70) { this.emit('banner', { text: 'ĐẤU!' }); this.sfx('gong'); }
        if (this.phaseT >= 80) { this.phase = 'fight'; this.phaseT = 0; a.state = 'idle'; b.state = 'idle'; }
      } else if (this.phase === 'fight') {
        if (this.timer !== Infinity && ++this.timerF >= 60) {
          this.timerF = 0; this.timer--;
          if (this.timer <= 0) this.timeOver();
        }
      } else if (this.phase === 'ko' || this.phase === 'time') {
        if (this.phaseT === 110) {
          for (const f of this.fighters) {
            if (f === this.winner) { if (!f.air && !f.inSeq) { f.state = 'win'; f.move = null; } }
            else if (this.winner && f.state !== 'ko') { f.state = 'lose'; f.move = null; }
          }
          if (this.winner) this.emit('banner', { text: this.winner.def.name.toUpperCase() + ' THẮNG HIỆP' });
          else this.emit('banner', { text: 'HÒA' });
        }
        if (this.phaseT === 240) {
          const done = a.wins >= 2 || b.wins >= 2;
          if (done) {
            this.phase = 'end';
            const w = a.wins >= 2 && b.wins >= 2 ? -1 : a.wins >= 2 ? 0 : 1;
            this.emit('matchEnd', { winner: w });
          } else { this.round++; this.startRound(); }
        }
      }
    }

    timeOver() {
      const [a, b] = this.fighters;
      this.phase = 'time'; this.phaseT = 0;
      const ra = a.hp / a.maxHp, rb = b.hp / b.maxHp;
      this.winner = Math.abs(ra - rb) < 0.001 ? null : ra > rb ? a : b;
      if (this.winner) this.winner.wins++; else { a.wins++; b.wins++; }
      this.emit('banner', { text: 'HẾT GIỜ' });
      this.sfx('gong');
    }

    checkKO(D, A) {
      if (D.hp > 0) return;
      if (this.mode === 'train') { D.hp = 1; return; }
      if (this.phase !== 'fight') { D.hp = Math.max(D.hp, 1); return; }
      D.hp = 0;
      for (const s of this.seqs) if (s.A === D || s.D === D) this.finishSeq(s, true);
      D.state = 'ko'; D.move = null; D.air = true; D.airHit = true; D.inSeq = false;
      D.vy = 0.16; D.y = Math.max(D.y, 0.05); D.vx = (D.x > A.x ? 1 : -1) * 0.07;
      this.phase = 'ko'; this.phaseT = 0; this.slow = 70; this.winner = A;
      A.wins++;
      this.emit('banner', { text: 'K.O.', big: true });
      this.sfx('ko');
    }

    trainingAssist() {
      const [a, b] = this.fighters;
      for (const f of [a, b]) {
        if (f.actionable()) {
          f.idleT = (f.idleT || 0) + 1;
          if (f.idleT > 60) { f.hp = f.maxHp; f.khi = C.KHI; f.bn = C.BN; f.poison.stacks = 0; }
        } else f.idleT = 0;
      }
    }

    // ---------------- Đẩy nhau, biên sàn ----------------
    resolvePush() {
      const [a, b] = this.fighters;
      const lim = C.HALF - 0.3;
      for (const f of this.fighters) f.x = clamp(f.x, -lim, lim);
      const d = b.x - a.x;
      if (Math.abs(d) > C.MAXD && a.state !== 'grabbed' && b.state !== 'grabbed') {
        const ex = (Math.abs(d) - C.MAXD) / 2 * Math.sign(d);
        a.x += ex; b.x -= ex;
      }
      const pass = (f) => f.state === 'attack' && f.move && (f.move.passThrough || f.move.anim === 'flip');
      if (a.hidden || b.hidden || pass(a) || pass(b) || a.inSeq || b.inSeq) return;
      if (a.state === 'ko' || b.state === 'ko') return;
      const ha = a.hurtbox(), hb = b.hurtbox();
      if (!(ha.y1 < hb.y2 && hb.y1 < ha.y2)) return;
      const minD = (a.bodyW + b.bodyW) / 2 * 0.92;
      const dx = b.x - a.x;
      const ov = minD - Math.abs(dx);
      if (ov <= 0) return;
      const s = Math.abs(dx) < 1e-4 ? (a.facing || 1) : Math.sign(dx);
      a.x -= s * ov / 2; b.x += s * ov / 2;
      a.x = clamp(a.x, -lim, lim); b.x = clamp(b.x, -lim, lim);
      const ov2 = minD - Math.abs(b.x - a.x);
      if (ov2 > 0) {
        if (Math.abs(a.x) >= lim - 1e-3) b.x += s * ov2; else a.x -= s * ov2;
      }
    }

    threatNear(f) {
      const o = f.opp;
      if (o.state === 'attack' && o.move && o.move.type !== 'instinct' && Math.abs(o.x - f.x) < 3.2) return true;
      for (const p of this.projs) {
        if (p.owner === o && !p.dead && Math.sign(f.x - p.x) === Math.sign(p.vx) && Math.abs(f.x - p.x) < 4) return true;
      }
      for (const t of this.targets) if (t.owner === o) return true;
      return false;
    }

    canBlock(D, m, srcX) {
      if (m.unblockable || D.air) return false;
      if (!['idle', 'walk', 'crouch', 'guard', 'blockstun'].includes(D.state)) return false;
      const inp = D.inp; if (!inp) return false;
      const back = srcX < D.x ? inp.h.r : inp.h.l;
      if (!back) return false;
      const crouch = !!inp.h.d;
      if (m.level === 'low' && !crouch) return false;
      if (m.level === 'high' && crouch) return false;
      return true;
    }

    // ---------------- Trúng đòn ----------------
    checkHits() {
      const hits = [];
      for (const A of this.fighters) {
        const D = A.opp;
        if (!A.hitActive() || A.inSeq) continue;
        if (overlap(A.hitbox(A.move), D.hurtbox())) hits.push([A, D, A.move]);
      }
      for (const [A, D, m] of hits) {
        if (D.state === 'grabbed' || D.inSeq || A.inSeq) continue;
        if (D.invulnerable()) continue;
        if (m.grab && m.grab.onHit) {
          if (D.air && !m.grab.airOk) continue;
          if (D.counterActive(false)) { this.doCounter(D, A, m, null); continue; }
          A.hitsDone = m.hits; A.connected = true;
          if (this.canBlock(D, m, A.x)) { this.applyHit(A, D, m, null); continue; }
          this.startGrab(A, D, m.grab);
          continue;
        }
        const r = this.applyHit(A, D, m, null);
        if (r !== 'miss') { A.hitsDone++; A.lastHitF = A.cf; A.connected = true; }
        if (r === 'dodged') A.hitsDone = m.hits;
      }
    }

    applyHit(A, D, m, proj) {
      const isProj = !!proj, isSuper = m.type === 'super';
      if (D.invulnerable()) return 'miss';
      if (D.counterActive(isProj)) { this.doCounter(D, A, m, proj); return 'countered'; }
      if (D.buffs.nine && !isSuper) { delete D.buffs.nine; this.catDodge(D, A, isProj); return 'dodged'; }
      const srcX = proj ? proj.x - (proj.vx || 0) * 10 : A.x;
      const dirX = srcX < D.x ? 1 : -1;
      let dmg = m.dmg * (proj ? proj.dmgK : A.dmgOut(isSuper)) * D.dmgIn();
      const hx = D.x - dirX * D.bodyW * 0.4, hy = D.y + 1.1 * D.scale;

      if (this.canBlock(D, m, srcX)) {
        const chip = dmg * (m.chip || (m.type === 'normal' ? 0 : 0.1));
        D.hp -= chip;
        this.track(A, 'chip', chip);
        if (!isSuper) D.hp = Math.max(1, D.hp);
        D.state = 'blockstun'; D.stun = m.blockstun; D.cblock = !!D.inp.h.d; D.move = null; D.vx = 0;
        D.kb = dirX * m.pushBlock;
        A.khi = Math.min(C.KHI, A.khi + m.kgain * 0.5 * (A.buffs.rain ? 0 : 1));
        D.khi = Math.min(C.KHI, D.khi + 5);
        this.hitstop = 5;
        this.fx.spark(hx, hy, 'block');
        this.sfx('block');
        this.checkKO(D, A);
        return 'block';
      }
      if (D.hasArmor()) {
        D.armorUsed = true; D.hp -= dmg * 0.8; D.flash = 10;
        this.hitstop = 7;
        this.fx.spark(hx, hy, 'armor');
        this.sfx('armor');
        this.text(D, 'GIÁP CỨNG');
        this.checkKO(D, A);
        return 'armor';
      }
      dmg *= Math.max(isSuper ? 0.5 : 0.3, 1 - 0.1 * A.combo);
      const cine = m.cine || (proj && proj.p && proj.p.cine);
      if (cine && !D.air) {
        const per = cine.dmg * (proj ? proj.dmgK : A.dmgOut(true)) * D.dmgIn() * Math.max(0.5, 1 - 0.1 * A.combo);
        if (proj) { A.x = clamp(D.x - dirX * 0.9, -C.HALF + 0.3, C.HALF - 0.3); A.facing = dirX; A.state = 'attack'; A.move = A.moves.super; A.air = false; A.y = 0; }
        this.startCine(A, D, cine, per);
        A.combo++;
        return 'hit';
      }
      D.hp -= dmg;
      this.track(A, m.id || m.type, dmg);
      A.combo++; A.comboDmg += dmg;
      let pz = (m.effect && m.effect.poison) || 0;
      if (A.def.id === 'ti' && (m.type !== 'normal' || A.buffs.venom)) pz += 1 + (A.buffs.venom ? 1 : 0);
      if (pz) D.addPoison(pz, !!A.buffs.venom);
      D.move = null; D.hidden = false; D.copying = false;
      if (D.air || m.kd || m.launch) {
        D.state = 'hitstun'; D.air = true; D.airHit = true; D.juggle++;
        D.vy = m.launch || (D.y > 0.05 ? 0.09 : 0.11);
        D.vx = dirX * (m.kd ? 0.06 : 0.04);
        D.y = Math.max(D.y, 0.02);
      } else {
        D.state = 'hitstun'; D.stun = m.hitstun; D.kb = dirX * m.pushHit; D.vx = 0;
        if (Math.abs(D.x) > C.HALF - 0.5 && !proj) A.kb = -dirX * m.pushHit * 0.8;
      }
      D.flash = 6;
      A.khi = Math.min(C.KHI, A.khi + m.kgain * (A.buffs.rain ? 0 : 1) * (A.buffs.mark ? 1.3 : 1));
      D.khi = Math.min(C.KHI, D.khi + dmg * 0.12);
      A.bn = Math.min(C.BN, A.bn + 1.5); D.bn = Math.min(C.BN, D.bn + 2.5);
      if (D.def.id === 'ngo' && !D.buffs.gallop) D.momentum = 0;
      this.hitstop = m.hitstop || (dmg > 70 ? 8 : dmg > 40 ? 6 : 5);
      this.fx.spark(hx, hy, dmg > 70 || isSuper ? 'big' : 'hit');
      this.sfx('hit', Math.min(1, dmg / 100));
      this.checkKO(D, A);
      return 'hit';
    }

    doCounter(D, A, m, proj) {
      const c = D.move.counter;
      D.counterFx = 20;
      this.text(D, 'PHẢN ĐÒN!');
      this.sfx('counter');
      this.fx.ring(D.x, 1.2 * D.scale, '#ffffff');
      if (proj) { proj.dead = true; D.khi = Math.min(C.KHI, D.khi + 20); D.counterStrike(); return; }
      const base = c.mult
        ? Math.max(c.min || 0, m.dmg * A.dmgOut(m.type === 'super') * c.mult)
        : c.dmg * D.dmgOut();
      A.hp -= base * A.dmgIn();
      this.track(D, 'counter', base * A.dmgIn());
      A.state = 'hitstun'; A.move = null; A.air = true; A.airHit = true; A.juggle++;
      A.vy = 0.14; A.y = Math.max(A.y, 0.02); A.vx = (A.x > D.x ? 1 : -1) * 0.07;
      D.facing = A.x > D.x ? 1 : -1;
      D.counterStrike();
      D.khi = Math.min(C.KHI, D.khi + 20);
      this.hitstop = 12;
      this.fx.spark(A.x, A.y + 1.1 * A.scale, 'big');
      this.checkKO(A, D);
    }

    catDodge(D, A, isProj) {
      D.inv = 16;
      this.fx.smoke(D.x, 1);
      if (!isProj) {
        D.x = clamp(A.x - A.facing * 0.95, -C.HALF + 0.3, C.HALF - 0.3);
        D.facing = A.x > D.x ? 1 : -1;
        if (!D.air) { D.state = 'idle'; D.move = null; }
        this.fx.smoke(D.x, 1);
      }
      this.text(D, 'CHÍN MẠNG!');
      this.sfx('whoosh', 1);
    }

    // ---------------- Vật / chuỗi đòn điện ảnh ----------------
    tryGrab(A, m) {
      const D = A.opp, g = m.grab;
      const range = g.range * A.scale * 0.5 + D.bodyW * 0.5 + 0.35;
      if (Math.abs(D.x - A.x) > range) return;
      if (D.air || D.hidden || D.inSeq || D.invulnerable()) return;
      if (['hitstun', 'blockstun', 'grabbed', 'ko'].includes(D.state)) return;
      if (D.counterActive(false)) { this.doCounter(D, A, m, null); return; }
      if (g.techable && D.actionable() && D.inp && D.inp.p('L', 8) && D.inp.p('M', 8)) {
        A.kb = -A.facing * 0.2; D.kb = A.facing * 0.2;
        this.text(D, 'THOÁT VẬT');
        this.sfx('block');
        return;
      }
      if (D.buffs.nine) { delete D.buffs.nine; this.catDodge(D, A, false); return; }
      A.connected = true;
      this.startGrab(A, D, g);
    }

    startGrab(A, D, g) {
      let s;
      if (g.ride) s = { kind: 'ride', A, D, t: 0, dur: 180, every: 12, dmg: 9 * A.dmgOut() * D.dmgIn() };
      else s = { kind: 'grab', A, D, t: 0, dur: g.hold, dmg: g.dmg * A.dmgOut() * D.dmgIn() * Math.max(0.3, 1 - 0.1 * A.combo), vx: g.throwVx || 0.1, effect: g.effect };
      this.beginSeq(s);
      this.sfx('grab');
    }

    startCine(A, D, cine, per) {
      this.beginSeq({ kind: 'cine', A, D, t: 0, every: cine.every, hits: cine.hits, done: 0, dmgPer: per, dur: cine.hits * cine.every + 12 });
    }

    beginSeq(s) {
      const { A, D } = s;
      A.inSeq = true; D.inSeq = true; A.seqKind = s.kind; D.seqKind = s.kind;
      D.state = 'grabbed'; D.move = null; D.vx = 0; D.kb = 0; A.vx = 0; A.kb = 0;
      if (s.kind !== 'ride') { A.air = false; A.y = 0; D.air = false; D.y = 0; }
      D.facing = A.x > D.x ? 1 : -1;
      this.seqs.push(s);
    }

    updateSeqs() {
      for (const s of this.seqs.slice()) {
        const { A, D } = s;
        s.t++;
        if (s.kind === 'grab') {
          D.x = A.x + A.facing * (A.bodyW + D.bodyW) * 0.5;
          D.y = Math.min(0.35, s.t * 0.03);
          if (s.t >= s.dur) this.finishSeq(s);
        } else if (s.kind === 'cine') {
          D.x = A.x + A.facing * (A.bodyW + D.bodyW) * 0.55;
          if (s.t % s.every === 0 && s.done < s.hits) {
            s.done++;
            D.hp -= s.dmgPer; D.flash = 4; this.track(A, 'cine', s.dmgPer);
            A.cineHit = s.done;
            this.fx.spark(D.x - A.facing * 0.3, D.y + 0.8 + Math.random() * 0.7, s.done === s.hits ? 'big' : 'hit');
            this.sfx('hit', 0.6);
            this.hitstop = s.done === s.hits ? 10 : 2;
            if (D.hp <= 0) { this.finishSeq(s); this.checkKO(D, A); continue; }
          }
          if (s.t >= s.dur) this.finishSeq(s);
        } else if (s.kind === 'ride') {
          A.x = D.x - D.facing * 0.05; A.y = D.y + 1.6 * D.scale; A.facing = D.facing;
          s.dur -= (D.inp ? D.inp.mash : 0) * 3;
          if (s.t % s.every === 0) {
            D.hp -= s.dmg; D.flash = 3; this.track(A, 'ride', s.dmg);
            this.fx.spark(D.x, D.y + 1.5 * D.scale, 'hit');
            this.sfx('bite');
            if (D.hp <= 0) { this.finishSeq(s); this.checkKO(D, A); continue; }
          }
          if (s.t >= s.dur) this.finishSeq(s);
        }
      }
    }

    finishSeq(s, silent) {
      const i = this.seqs.indexOf(s);
      if (i < 0) return;
      this.seqs.splice(i, 1);
      const { A, D } = s;
      A.inSeq = false; D.inSeq = false; A.cineHit = 0;
      if (s.kind === 'ride') {
        A.state = 'jump'; A.move = null; A.air = true; A.vy = 0.15; A.vx = -A.facing * 0.06; A.airAttackUsed = false;
        if (D.state === 'grabbed') D.toNeutral();
        return;
      }
      A.move = null; A.state = 'land'; A.timer = s.kind === 'cine' ? 18 : 12;
      if (silent) return;
      if (s.kind === 'grab') {
        D.hp -= s.dmg;
        this.track(A, 'grab', s.dmg);
        A.combo++;
        if (s.effect && s.effect.poison) D.addPoison(s.effect.poison, !!A.buffs.venom);
        this.fx.spark(D.x, 0.6, 'big');
        this.sfx('thud');
        this.hitstop = 8;
        A.khi = Math.min(C.KHI, A.khi + 15); D.khi = Math.min(C.KHI, D.khi + 12);
      }
      D.state = 'hitstun'; D.air = true; D.airHit = true; D.juggle = 2;
      D.y = Math.max(D.y, 0.2); D.vy = s.kind === 'cine' ? 0.17 : 0.12;
      D.vx = A.facing * (s.kind === 'cine' ? 0.08 : s.vx);
      this.checkKO(D, A);
    }

    teleport(F, tp) {
      const o = F.opp, lim = C.HALF - 0.3;
      if (tp.mode === 'behind') {
        const side = o.x >= F.x ? 1 : -1;
        let nx = o.x + side * tp.dist;
        if (Math.abs(nx) > lim) nx = o.x - side * tp.dist;
        F.x = clamp(nx, -lim, lim);
      } else F.x = clamp(F.x - F.facing * tp.dist, -lim, lim);
      F.facing = o.x > F.x ? 1 : -1;
    }

    // ---------------- Đạn, bẫy, đòn diện rộng ----------------
    spawnProj(F, p, m) {
      const rain = !!F.buffs.rain && p.kind === 'orb';
      const pm = mk({
        id: m.id, type: m.type, dmg: p.dmg, hitstun: p.hitstun || 18, blockstun: p.blockstun || 14, level: p.level || 'mid',
        kd: !!p.kd, launch: p.kd ? 0.12 : 0, pushHit: p.pushHit || 0.12, pushBlock: p.pushHit || 0.12,
        effect: p.effect, chip: m.type === 'super' ? 0.15 : 0.1, kgain: m.kgain || 10,
      });
      const pr = {
        owner: F, p, m: pm, kind: p.kind, color: p.color,
        x: F.x + F.facing * 0.6 * F.scale, y: F.y + p.y * F.scale,
        vx: p.speed * F.facing * (rain ? 1.45 : 1), vy: p.vy || 0, grav: p.grav || 0,
        w: p.w * (rain ? 1.3 : 1), h: p.h * (rain ? 1.3 : 1), life: p.life, hits: p.hits || 1, every: p.every || 0,
        cd: 0, strength: p.strength || 1, facing: F.facing, t: 0, dead: false, big: rain,
        dmgK: F.dmgOut(m.type === 'super') * (rain ? 1.35 : 1),
      };
      this.projs.push(pr);
      this.emit('proj', pr);
      this.sfx(m.type === 'super' ? 'super2' : 'cast');
    }

    projBox(p) { return { x1: p.x - p.w / 2, x2: p.x + p.w / 2, y1: p.y - p.h / 2, y2: p.y + p.h / 2 }; }

    updateProjs() {
      for (const pr of this.projs) {
        if (pr.dead) continue;
        pr.t++; pr.x += pr.vx; pr.vy -= pr.grav; pr.y += pr.vy; pr.life--;
        if (pr.cd > 0) pr.cd--;
        if (pr.grav && pr.y < 0.15) { pr.dead = true; this.fx.spark(pr.x, 0.2, 'splash', pr.color); continue; }
        if (pr.life <= 0 || Math.abs(pr.x) > C.HALF + 2) { pr.dead = true; continue; }
        const box = this.projBox(pr);
        for (const q of this.projs) {
          if (q === pr || q.dead || q.owner === pr.owner) continue;
          if (overlap(box, this.projBox(q))) {
            const s1 = pr.strength, s2 = q.strength;
            pr.strength -= s2; q.strength -= s1;
            if (pr.strength <= 0) pr.dead = true;
            if (q.strength <= 0) q.dead = true;
            this.fx.spark((pr.x + q.x) / 2, pr.y, 'clash');
            this.sfx('block');
          }
        }
        if (pr.dead) continue;
        const D = pr.owner.opp;
        if (pr.cd === 0 && !D.inSeq && D.state !== 'grabbed' && overlap(box, D.hurtbox())) {
          const r = this.applyHit(pr.owner, D, pr.m, pr);
          if (r === 'miss') continue;
          if (r === 'dodged') { pr.cd = 40; continue; }
          pr.hits--; pr.cd = pr.every || 99;
          if (pr.hits <= 0 || r === 'countered' || (pr.p.cine && r === 'hit')) pr.dead = true;
        }
      }
    }

    spawnTrap(F, t) {
      for (const tr of this.traps) if (tr.owner === F) tr.dead = true;
      const tr = {
        owner: F, x: F.x, w: t.w, h: t.h, life: t.life, dead: false, kind: 'trap', color: F.def.look.fur,
        m: mk({ type: 'special', dmg: t.dmg, level: t.level, kd: t.kd, launch: 0.1, effect: t.effect, hitstun: 20, kgain: 10 }),
      };
      this.traps.push(tr);
      this.emit('trap', tr);
    }

    updateTraps() {
      for (const tr of this.traps) {
        if (tr.dead) continue;
        if (--tr.life <= 0) { tr.dead = true; continue; }
        const D = tr.owner.opp;
        if (D.air || D.inSeq || D.invulnerable()) continue;
        const box = { x1: tr.x - tr.w / 2, x2: tr.x + tr.w / 2, y1: 0, y2: tr.h };
        if (overlap(box, D.hurtbox())) {
          const r = this.applyHit(tr.owner, D, tr.m, { x: tr.x, vx: 0, dmgK: tr.owner.dmgOut(false) });
          if (r !== 'miss') tr.dead = true;
        }
      }
    }

    spawnTarget(F, t) {
      const tg = { owner: F, x: F.opp.x, t: 0, delay: 20, w: t.w, h: t.h, dmg: t.dmg, detonate: t.detonate, dead: false, kind: 'target' };
      this.targets.push(tg);
      this.emit('target', tg);
    }

    updateTargets() {
      for (const tg of this.targets) {
        if (tg.dead) continue;
        tg.t++;
        if (tg.t === tg.delay) {
          const D = tg.owner.opp;
          this.fx.eruption(tg.x, tg.owner.def.look.fur);
          this.sfx('thud');
          const box = { x1: tg.x - tg.w / 2, x2: tg.x + tg.w / 2, y1: 0, y2: tg.h };
          if (!D.inSeq && overlap(box, D.hurtbox())) {
            const stacks = D.poison.stacks;
            const m = mk({ type: 'super', dmg: tg.dmg + stacks * tg.detonate, hitstun: 30, kd: true, launch: 0.2, chip: 0.15, kgain: 0 });
            const r = this.applyHit(tg.owner, D, m, { x: tg.x - tg.owner.facing * 0.01, vx: tg.owner.facing, dmgK: tg.owner.dmgOut(true) });
            if (r === 'hit') { D.poison.stacks = 0; if (stacks) this.text(D, 'ĐỘC PHÁT TÁC x' + stacks); }
          }
        }
        if (tg.t > tg.delay + 30) tg.dead = true;
      }
    }

    quake(F, q) {
      const D = F.opp;
      this.fx.shock(F.x);
      this.sfx('thud', 1);
      this.emit('shake', { power: 0.35 });
      if (D.y < 0.15 && !D.inSeq) {
        const m = mk({ type: 'super', dmg: q.dmg, hitstun: 30, kd: true, launch: 0.18, chip: 0.15, pushBlock: 0.2, kgain: 0 });
        this.applyHit(F, D, m, { x: F.x, vx: 0, dmgK: F.dmgOut(true) });
      }
    }

    superFlash(F) {
      this.flashT = 42;
      this.emit('super', { side: F.side, name: F.def.super.name });
      this.sfx('super');
    }

    comboReset() {
      for (const A of this.fighters) {
        const D = A.opp;
        if (!(D.state === 'hitstun' || D.state === 'grabbed' || D.inSeq)) {
          if (A.combo >= 2) this.emit('combo', { side: A.side, n: A.combo });
          A.combo = 0; A.comboDmg = 0;
        }
      }
    }

    cleanup() {
      const gone = (o) => { if (o.dead) { this.emit('remove', o); return false; } return true; };
      this.projs = this.projs.filter(gone);
      this.traps = this.traps.filter(gone);
      this.targets = this.targets.filter(gone);
    }
  }

  G.Game = Game;
})();

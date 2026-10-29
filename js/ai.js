'use strict';
// Máy tự đánh: quyết định theo khoảng cách, trạng thái đối thủ và độ khó.
(function () {
  const G = window.G, C = G.C;
  const LV = {
    de:    { think: 16, block: 0.2, aa: 0.15, punish: 0.2, combo: 0.25, super: 0.25 },
    thuong:{ think: 10, block: 0.5, aa: 0.45, punish: 0.5, combo: 0.55, super: 0.5 },
    kho:   { think: 5,  block: 0.82, aa: 0.75, punish: 0.85, combo: 0.85, super: 0.8 },
  };
  const ANTI_AIR = { thin: 'dS', ngo: 'dS', tuat: 'dS', dan: 'dS' };

  class AISource {
    constructor(level) { this.lv = LV[level] || LV.thuong; this.q = []; this.cool = 0; }

    read(game, side) {
      const me = game.fighters[side];
      if (game.phase !== 'fight') { this.q = []; return {}; }
      if (me.state === 'grabbed' || me.inSeq) {
        // bị cưỡi lưng / bị vật: bấm loạn để thoát
        return game.frame % 8 < 4 && Math.random() < 0.5 * this.lv.block + 0.3 ? { L: game.frame % 8 < 2, M: game.frame % 8 >= 2 } : {};
      }
      if (this.q.length === 0) {
        if (--this.cool <= 0) { this.think(game, me); this.cool = this.lv.think + ((Math.random() * 6) | 0); }
        if (this.q.length === 0) return this.hold || {};
      }
      const step = this.q[0];
      step.n--;
      if (step.n <= 0) this.q.shift();
      return step.h;
    }

    rel(me, dir) { return dir > 0 ? (me.facing > 0 ? 'r' : 'l') : (me.facing > 0 ? 'l' : 'r'); }

    push(h, n) { this.q.push({ h, n }); }
    press(btn, extra) {
      const h = Object.assign({}, extra || {}); h[btn] = true;
      this.push(h, 2); this.push(Object.assign({}, extra || {}), 1);
    }

    combo(me, low) {
      const d = low ? { d: true } : {};
      const r = Math.random();
      if (r < 0.35) { this.press('L', d); this.push(d, 4); this.press('M', d); this.push(d, 6); this.press('S', d.d ? {} : {}); }
      else if (r < 0.65) { this.press('M', d); this.push(d, 8); this.press('H'); this.push({}, 10); this.press('S'); }
      else { this.press('L', d); this.push(d, 4); this.press('L', d); this.push(d, 4); this.press('H', d); }
      if (me.khi >= C.KHI && Math.random() < this.lv.super) { this.push({}, 6); this.press('U'); }
    }

    think(game, me) {
      const o = me.opp, lv = this.lv;
      const dx = o.x - me.x, dist = Math.abs(dx);
      const fwd = this.rel(me, 1), back = this.rel(me, -1);
      const ai = me.def.ai;
      this.hold = {};
      if (!(me.actionable() || me.state === 'jump' || me.state === 'blockstun')) return;

      // 1. Phòng thủ khi đối thủ ra đòn
      const incoming = game.projs.find((p) => p.owner === o && !p.dead && Math.sign(me.x - p.x) === Math.sign(p.vx) && Math.abs(me.x - p.x) < 3.5);
      const oAtk = o.state === 'attack' && o.move && o.move.hb && o.move.type !== 'instinct' && o.cf < o.move.hitEnd &&
        dist < (o.move.hb.x + o.move.hb.w / 2) * o.scale + 1.2 + Math.abs(o.vx) * 12;
      if ((oAtk || incoming) && Math.random() < lv.block) {
        const m = incoming ? incoming.m : o.move;
        if (incoming && dist > 2.2 && Math.abs(me.x - incoming.x) > 1.2 && Math.random() < 0.25 + 0.4 * lv.block) { this.push({ u: true, [fwd]: true }, 3); return; }
        const low = m.level === 'low' || (m.level === 'mid' && Math.random() < 0.5);
        const h = { [back]: true }; if (low && m.level !== 'high') h.d = true;
        this.push(h, 16); this.hold = h;
        return;
      }
      if (me.state === 'jump') {
        if (dist < 1.6 && Math.random() < 0.7) this.press(Math.random() < 0.5 ? 'H' : 'M');
        return;
      }
      // 2. Chống nhảy vào
      if (o.air && o.state === 'jump' && dist < 2.6 && Math.random() < lv.aa) {
        const aa = ANTI_AIR[me.def.id];
        if (aa) this.press('S', { d: true }); else this.press('H', { d: true });
        return;
      }
      // 3. Trừng phạt khi đối thủ hở
      const recovering = (o.state === 'attack' && o.move && o.cf >= o.move.hitEnd && o.move.recovery > 12) || o.state === 'land';
      if (recovering && dist < 2.0 && Math.random() < lv.punish) { this.combo(me, false); return; }

      // 4. Tuyệt kỹ, Bản Năng
      if (me.khi >= C.KHI && dist < (ai.zoner ? 6 : 2.2) && Math.random() < lv.super * 0.25) { this.press('U'); return; }
      if (me.bn >= C.BN && Math.random() < 0.15 && this.instinctGood(me, o, dist)) { this.press('B'); return; }

      // 5. Đứng gần: tấn công (chỉ khi đòn với tới)
      const reach = (id) => { const m = me.moves[id]; return (m.hb.x + m.hb.w / 2) * (0.5 + 0.5 * me.scale) + o.bodyW / 2; };
      const range = Math.max(reach('sM'), reach('cM'));
      if (dist < 1.05 && Math.random() < 0.18) { this.press('L', { M: true }); return; }
      if (dist < range + 0.05) {
        const r = Math.random();
        if (r < lv.combo * 0.6) this.combo(me, Math.random() < 0.4);
        else if (r < 0.7) this.press(Math.random() < 0.5 ? 'M' : 'L', Math.random() < 0.5 ? { d: true } : {});
        else if (r < 0.82) this.press('S', Math.random() < 0.5 ? { [fwd]: true } : {});
        else if (ai.zoner && dist < ai.range) this.push({ [back]: true }, 18);
        else this.push({ [back]: true, d: Math.random() < 0.5 }, 12);
        return;
      }
      // 6. Tầm xa
      if (ai.zoner && dist > 2.6 && Math.random() < 0.55) { this.press('S'); return; }
      const r = Math.random();
      if (o.def.ai.zoner && dist > 2.4 && r < 0.45) {
        if (r < 0.2) this.push({ u: true, [fwd]: true }, 3);
        else { this.push({ [fwd]: true }, 2); this.push({}, 2); this.push({ [fwd]: true }, 2); }
        return;
      }
      if (r < 0.12 * ai.aggro) { this.push({ u: true, [fwd]: true }, 3); }
      else if (r < 0.22 && dist > 3) { this.push({ [fwd]: true }, 2); this.push({}, 2); this.push({ [fwd]: true }, 2); }
      else if (r < 0.32 && dist < 3.5) this.press('S', { [fwd]: true });
      else if (r < 0.4 && dist > 3 && (me.def.id === 'suu' || me.def.id === 'than' || me.def.id === 'tuat')) this.press('S');
      else this.push({ [fwd]: true }, 10 + ((Math.random() * 14) | 0));
    }

    instinctGood(me, o, dist) {
      switch (me.def.id) {
        case 'ty': return dist < 1.3;
        case 'dan': return dist < 4;
        case 'mui': case 'hoi': return dist > 4;
        case 'dau': return dist < 2.2;
        case 'than': return !!o.lastSpecial;
        default: return true;
      }
    }
  }

  G.AISource = AISource;
})();

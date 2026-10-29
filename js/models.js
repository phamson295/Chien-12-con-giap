'use strict';
// Dựng mô hình 3D kiểu hoạt hình (cel-shading + viền mực) cho 12 con giáp từ khối cơ bản.
(function () {
  const G = window.G, T = THREE;
  const SPH = new T.SphereGeometry(1, 18, 14);
  const CONE = new T.ConeGeometry(1, 1, 14);
  const CYL = new T.CylinderGeometry(1, 1, 1, 12);
  const BOX = new T.BoxGeometry(1, 1, 1);
  const OUTLINE = new T.MeshBasicMaterial({ color: 0x1a120c, side: T.BackSide });
  const OUT_T = 0.022;

  let grad = null;
  G.gradientMap = function () {
    if (grad) return grad;
    const d = new Uint8Array([70, 70, 70, 255, 150, 150, 150, 255, 225, 225, 225, 255, 255, 255, 255, 255]);
    grad = new T.DataTexture(d, 4, 1, T.RGBAFormat);
    grad.minFilter = grad.magFilter = T.NearestFilter; grad.generateMipmaps = false; grad.needsUpdate = true;
    return grad;
  };

  function stripeTex(base, stripe, vertical) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = base; x.fillRect(0, 0, 128, 128);
    x.fillStyle = stripe;
    for (let i = 0; i < 9; i++) {
      const y = i * 15 + (i % 2) * 4;
      x.beginPath();
      x.moveTo(0, y); x.quadraticCurveTo(64, y + 6 + (i % 3) * 3, 128, y); x.lineTo(128, y + 4); x.quadraticCurveTo(64, y + 10, 0, y + 5);
      x.fill();
    }
    const t = new T.CanvasTexture(c);
    if (vertical) { t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; }
    return t;
  }

  class ModelBuilder {
    constructor(def, palette) {
      this.def = def; this.L = Object.assign({}, def.look, palette || {});
      this.mats = []; this.cache = {};
    }
    mat(color, tex) {
      const key = color + (tex ? '_t' : '');
      if (this.cache[key]) return this.cache[key];
      const m = new T.MeshToonMaterial({ color: new T.Color(color), gradientMap: G.gradientMap() });
      if (tex) m.map = tex;
      m.emissive = new T.Color(0x000000);
      this.mats.push(m); this.cache[key] = m;
      return m;
    }
    furMat() {
      const L = this.L;
      if (L.stripes) {
        if (!this._fur) this._fur = this.mat(L.fur, stripeTex(L.fur, L.stripes));
        return this._fur;
      }
      return this.mat(L.fur);
    }
    // Khối elip có viền
    ell(parent, mat, pos, r, rot, outline = true) {
      const m = new T.Mesh(SPH, mat);
      m.position.set(pos[0], pos[1], pos[2]); m.scale.set(r[0], r[1], r[2]);
      if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
      parent.add(m);
      if (outline) {
        const o = new T.Mesh(SPH, OUTLINE);
        o.scale.set(1 + OUT_T / r[0], 1 + OUT_T / r[1], 1 + OUT_T / r[2]);
        m.add(o);
      }
      return m;
    }
    cone(parent, mat, pos, r, h, rot, outline = true) {
      const m = new T.Mesh(CONE, mat);
      m.position.set(pos[0], pos[1], pos[2]); m.scale.set(r, h, r);
      if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
      parent.add(m);
      if (outline) { const o = new T.Mesh(CONE, OUTLINE); o.scale.set(1 + OUT_T / r, 1 + OUT_T / h, 1 + OUT_T / r); m.add(o); }
      return m;
    }
    cyl(parent, mat, pos, r, h, rot, outline = true) {
      const m = new T.Mesh(CYL, mat);
      m.position.set(pos[0], pos[1], pos[2]); m.scale.set(r, h, r);
      if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
      parent.add(m);
      if (outline) { const o = new T.Mesh(CYL, OUTLINE); o.scale.set(1 + OUT_T / r, 1 + OUT_T / h, 1 + OUT_T / r); m.add(o); }
      return m;
    }
    box(parent, mat, pos, s, rot) {
      const m = new T.Mesh(BOX, mat);
      m.position.set(pos[0], pos[1], pos[2]); m.scale.set(s[0], s[1], s[2]);
      if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
      parent.add(m); return m;
    }
    torus(parent, mat, pos, R, r, arc, rot) {
      const g = new T.TorusGeometry(R, r, 8, 24, arc || Math.PI * 2);
      const m = new T.Mesh(g, mat);
      m.position.set(pos[0], pos[1], pos[2]);
      if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
      parent.add(m);
      const o = new T.Mesh(g, OUTLINE); o.scale.setScalar(1 + OUT_T / R); m.add(o);
      return m;
    }
    group(parent, pos) { const g = new T.Group(); if (pos) g.position.set(pos[0], pos[1], pos[2]); parent.add(g); return g; }

    build() {
      const L = this.L, def = this.def, bulk = L.bulk || 1;
      const root = new T.Group();
      const tilt = this.group(root);
      const body = this.group(tilt);
      body.scale.setScalar(def.scale);
      const J = { root, tilt, body };
      const fur = this.furMat(), fur2 = this.mat(L.fur2), cloth = this.mat(L.cloth), cloth2 = this.mat(L.cloth2), acc = this.mat(L.accent);
      const ex = L.extras || [];

      J.hips = this.group(body, [0, 0.88, 0]);
      this.ell(J.hips, cloth2, [0, 0, 0], [0.25 * bulk, 0.17, 0.2 * bulk]);
      J.spine = this.group(J.hips, [0, 0.08, 0]);
      this.ell(J.spine, cloth, [0, 0.33, 0], [0.3 * bulk, 0.36, 0.23 * bulk]);
      this.ell(J.spine, ex.includes('wings') ? fur : fur2, [0, 0.42, 0.13 * bulk], [0.15 * bulk, 0.21, 0.11], null, false);
      this.torus(J.spine, acc, [0, 0.06, 0], 0.285 * bulk, 0.032, null, [Math.PI / 2, 0, 0]).scale.set(1, 0.8, 1);
      this.box(J.spine, acc, [0.12 * bulk, 0.02, 0.24 * bulk], [0.07, 0.16, 0.04], [0, 0, 0.3]);
      if (ex.includes('ridge')) this.ell(J.spine, this.mat('#8a5a2a'), [0, 0.38, -0.2 * bulk], [0.06, 0.3, 0.05], null, false);
      if (L.mane && ex.includes('mane')) {
        const mm = this.mat(L.mane);
        for (let i = 0; i < 4; i++) this.cone(J.spine, mm, [0, 0.62 - i * 0.14, -0.2 * bulk - 0.02], 0.06, 0.18, [-2.3, 0, 0]);
      }
      if (ex.includes('robe')) {
        this.cone(J.hips, cloth, [0, -0.38, 0], 0.42, 0.85, [0, 0, 0]);
        this.torus(J.hips, acc, [0, -0.78, 0], 0.4, 0.03, null, [Math.PI / 2, 0, 0]);
      }

      // Đầu
      J.neck = this.group(J.spine, [0, 0.7, 0.02]);
      J.head = this.group(J.neck, [0, 0.14, 0.02]);
      this.buildHead(J.head, fur, fur2);

      // Tay
      const armMat = ex.includes('wings') ? fur : fur;
      for (const s of [1, -1]) {
        const sh = this.group(J.spine, [s * 0.34 * bulk, 0.58, 0]);
        this.ell(sh, cloth, [0, -0.04, 0], [0.13 * bulk, 0.12, 0.13 * bulk]);
        this.ell(sh, armMat, [0, -0.17, 0], [0.09 * bulk, 0.17, 0.09 * bulk]);
        const el = this.group(sh, [0, -0.32, 0]);
        this.ell(el, armMat, [0, -0.14, 0], [0.08 * bulk, 0.16, 0.08 * bulk]);
        this.torus(el, acc, [0, -0.22, 0], 0.07 * bulk, 0.018, null, [Math.PI / 2, 0, 0]);
        const hand = this.group(el, [0, -0.31, 0]);
        this.ell(hand, fur2, [0, 0, 0.01], [0.085 * bulk, 0.08, 0.085 * bulk]);
        if (ex.includes('wings')) {
          for (let i = 0; i < 3; i++) this.ell(el, this.mat(i % 2 ? L.fur2 : L.fur), [s * 0.02, -0.08 - i * 0.07, -0.09], [0.03, 0.12, 0.09], [0.3, 0, 0], true);
        }
        if (s === 1) { J.shL = sh; J.elL = el; J.handL = hand; } else { J.shR = sh; J.elR = el; J.handR = hand; }
      }
      if (ex.includes('staff')) {
        const st = this.group(J.handR, [0, 0, 0]);
        this.cyl(st, this.mat('#a8281c'), [0, -0.35, 0], 0.035, 1.7);
        this.cyl(st, this.mat('#f2c94c'), [0, 0.45, 0], 0.045, 0.14);
        this.cyl(st, this.mat('#f2c94c'), [0, -1.15, 0], 0.045, 0.14);
        J.staff = st;
      }
      // Chân
      const footMat = this.mat(L.foot || shade(L.fur, -0.35));
      for (const s of [1, -1]) {
        const lg = this.group(J.hips, [s * 0.14 * bulk, -0.05, 0]);
        this.ell(lg, cloth2, [0, -0.2, 0], [0.12 * bulk, 0.24, 0.12 * bulk]);
        const kn = this.group(lg, [0, -0.42, 0]);
        this.ell(kn, fur, [0, -0.19, 0], [0.09 * bulk, 0.22, 0.09 * bulk]);
        this.ell(kn, footMat, [0, -0.41, 0.06], [0.1 * bulk, 0.06, 0.15]);
        if (s === 1) { J.legL = lg; J.knL = kn; } else { J.legR = lg; J.knR = kn; }
      }
      J.tail = this.buildTail(J.hips, fur);
      J.mats = this.mats;
      return J;
    }

    buildHead(h, fur, fur2) {
      const L = this.L, [hx, hy, hz] = L.head, ex = L.extras || [];
      this.ell(h, L.plainHead ? this.mat(L.fur) : fur, [0, 0, 0], [hx, hy, hz]);
      if (ex.includes('facepatch')) this.ell(h, fur2, [0, -0.02, hz * 0.45], [hx * 0.82, hy * 0.78, hz * 0.6], null, false);
      if (ex.includes('blaze')) this.ell(h, fur2, [0, 0.02, hz * 0.6], [hx * 0.25, hy * 0.7, hz * 0.45], null, false);
      if (ex.includes('hood')) this.ell(h, fur, [0, -0.08, -0.1], [hx * 1.75, hy * 1.5, 0.06]);
      const sn = L.snout, snMat = this.mat(sn.color), nose = this.mat(L.nose || '#2a1e16');
      let tip;
      if (sn.beak) {
        this.cone(h, snMat, [0, -0.03, hz + sn.len * 0.35], sn.w, sn.len, [Math.PI / 2, 0, 0]);
        tip = [0, -0.03, hz + sn.len * 0.8];
      } else if (sn.disc) {
        this.ell(h, fur, [0, -0.06, hz * 0.8], [sn.w * 1.05, sn.w * 0.9, sn.len], null, true);
        this.cyl(h, snMat, [0, -0.06, hz * 0.8 + sn.len * 0.9], sn.w, 0.06, [Math.PI / 2, 0, 0]);
        for (const s of [1, -1]) this.ell(h, nose, [s * sn.w * 0.4, -0.06, hz * 0.8 + sn.len * 0.9 + 0.03], [0.03, 0.04, 0.01], null, false);
        tip = [0, -0.06, hz * 0.8 + sn.len];
      } else {
        const y = sn.long ? -0.1 : -0.06, z = sn.long ? hz * 0.62 : hz * 0.72;
        const r = sn.pointy ? [sn.w * 0.8, sn.w * 0.65, sn.len] : sn.flat ? [sn.w, sn.w * 0.45, sn.len] : [sn.w, sn.w * 0.8, sn.len];
        this.ell(h, snMat, [0, y, z], r);
        tip = [0, y + r[1] * 0.3, z + sn.len * 0.92];
        if (!sn.flat) this.ell(h, nose, tip, [0.045, 0.035, 0.03], null, false);
      }
      this.snoutTip = tip;
      // Mắt
      const eyeW = this.mat('#fbf7ea'), pupil = this.mat(L.eye || '#1a120c');
      const ez = Math.sqrt(Math.max(0.01, 1 - 0.45 * 0.45 - 0.04)) * hz * 0.92;
      for (const s of [1, -1]) {
        this.ell(h, eyeW, [s * hx * 0.42, hy * 0.22, ez], [0.055, 0.065, 0.035], null, false);
        this.ell(h, pupil, [s * hx * 0.42, hy * 0.2, ez + 0.03], [0.03, 0.042, 0.015], null, false);
        if (L.eye) this.ell(h, this.mat('#120c08'), [s * hx * 0.42, hy * 0.2, ez + 0.042], [0.012, 0.035, 0.008], null, false);
        this.box(h, this.mat('#1a120c'), [s * hx * 0.42, hy * 0.52, ez - 0.01], [0.12, 0.025, 0.03], [0, 0, s * 0.35]);
      }
      // Tai
      const e = L.ears || {}, inner = this.mat(e.inner || L.fur2), sz = e.size || 0.1;
      for (const s of [1, -1]) {
        if (e.type === 'round') {
          this.ell(h, fur, [s * hx * 0.72, hy * 0.85, -0.02], [sz, sz, sz * 0.35], [0, 0, s * -0.3]);
          this.ell(h, inner, [s * hx * 0.72, hy * 0.85, 0.02], [sz * 0.65, sz * 0.65, sz * 0.15], [0, 0, s * -0.3], false);
        } else if (e.type === 'pointy') {
          this.cone(h, fur, [s * hx * 0.58, hy * 0.98, -0.02], sz * 0.6, sz * 1.7, [0, 0, s * -0.32]);
          this.cone(h, inner, [s * hx * 0.58, hy * 0.96, 0.02], sz * 0.35, sz * 1.2, [0, 0, s * -0.32], false);
        } else if (e.type === 'side') {
          this.ell(h, fur, [s * (hx + 0.04), hy * 0.32, -0.03], [sz * 1.25, sz * 0.42, sz * 0.6], [0, 0, s * -0.35]);
        } else if (e.type === 'fin') {
          this.cone(h, this.mat(e.inner), [s * hx * 0.95, hy * 0.25, -0.06], sz * 0.5, sz * 2, [0.3, 0, s * -1.2]);
        } else if (e.type === 'monkey') {
          this.ell(h, fur, [s * (hx + 0.01), 0.0, -0.01], [0.035, sz, sz]);
          this.ell(h, inner, [s * (hx + 0.03), 0.0, 0.0], [0.01, sz * 0.6, sz * 0.6], null, false);
        } else if (e.type === 'small') {
          this.cone(h, fur, [s * hx * 0.62, hy * 0.85, 0.02], sz * 0.7, sz * 1.4, [0.5, 0, s * -0.4]);
        }
      }
      // Sừng
      const hn = L.horns;
      if (hn) {
        const hm = this.mat(hn.color);
        for (const s of [1, -1]) {
          if (hn.type === 'ox') {
            this.cone(h, hm, [s * (hx * 0.75 + 0.1), hy * 0.62, 0], 0.055, 0.26, [0, 0, s * -Math.PI / 2 + s * 0.2]);
            this.cone(h, hm, [s * (hx * 0.75 + 0.26), hy * 0.62 + 0.1, 0.02], 0.04, 0.22, [0.2, 0, s * -0.35]);
          } else if (hn.type === 'goat') {
            this.torus(h, hm, [s * hx * 0.7, hy * 0.85, -0.1], 0.13, 0.04, Math.PI * 1.5, [0, s * Math.PI / 2, 0.9]);
          } else if (hn.type === 'dragon') {
            this.cone(h, hm, [s * hx * 0.45, hy * 1.05, -0.1], 0.035, 0.38, [-0.7, 0, s * -0.25]);
            this.cone(h, hm, [s * hx * 0.62, hy * 1.12, -0.05], 0.025, 0.16, [-0.2, 0, s * -0.9]);
          }
        }
      }
      // Phụ kiện
      const t = tip;
      if (ex.includes('whiskers')) {
        const wm = this.mat('#f4ead8');
        for (const s of [1, -1]) for (let i = 0; i < 3; i++) {
          this.box(h, wm, [s * 0.11, t[1] - 0.01 - i * 0.02, t[2] - 0.05], [0.18, 0.008, 0.008], [0, s * 0.25, s * (0.15 - i * 0.15)]);
        }
      }
      if (ex.includes('longwhiskers')) {
        const wm = this.mat('#f2c94c');
        for (const s of [1, -1]) {
          this.cyl(h, wm, [s * 0.16, t[1] - 0.04, t[2] - 0.06], 0.012, 0.32, [0, 0, s * 1.1], false);
          this.cyl(h, wm, [s * 0.32, t[1] - 0.16, t[2] - 0.06], 0.01, 0.22, [0, 0, s * 0.2], false);
        }
      }
      if (ex.includes('teeth')) {
        for (const s of [1, -1]) this.box(h, this.mat('#ffffff'), [s * 0.018, t[1] - 0.08, t[2] - 0.04], [0.03, 0.05, 0.015]);
      }
      if (ex.includes('nosering')) this.torus(h, this.mat('#f2c94c'), [0, t[1] - 0.05, t[2] + 0.01], 0.05, 0.012, null, [0, 0, 0]);
      if (ex.includes('mane') && this.L.mane) {
        const mm = this.mat(this.L.mane);
        for (let i = 0; i < 4; i++) this.cone(h, mm, [0, hy * 0.9 - i * 0.09, -hz * 0.4 - i * 0.07], 0.05, 0.16, [-1.6 - i * 0.2, 0, 0]);
      }
      if (ex.includes('tongue')) {
        const tm = this.mat('#d8304a');
        this.box(h, tm, [0.015, t[1] - 0.05, t[2] + 0.06], [0.012, 0.008, 0.1], [0, 0.25, 0]);
        this.box(h, tm, [-0.015, t[1] - 0.05, t[2] + 0.06], [0.012, 0.008, 0.1], [0, -0.25, 0]);
      }
      if (ex.includes('beard')) this.cone(h, this.mat(this.L.fur2), [0, -hy * 0.95, hz * 0.55], 0.05, 0.2, [Math.PI, 0, 0]);
      if (ex.includes('headband')) this.torus(h, this.mat('#f2c94c'), [0, hy * 0.42, 0], hx * 1.02, 0.025, null, [Math.PI / 2 - 0.15, 0, 0]);
      if (ex.includes('comb')) {
        const cm = this.mat('#e0242a');
        for (let i = 0; i < 4; i++) this.ell(h, cm, [0, hy * 0.95 + (i === 1 || i === 2 ? 0.05 : 0), hz * 0.5 - i * 0.1], [0.035, 0.08, 0.05]);
        this.ell(h, cm, [0, t[1] - 0.1, t[2] - 0.08], [0.035, 0.07, 0.04]);
      }
      if (ex.includes('tusks')) {
        const tm = this.mat('#fbf4dc');
        for (const s of [1, -1]) this.cone(h, tm, [s * 0.13, t[1] - 0.02, t[2] - 0.08], 0.022, 0.13, [0.3, 0, s * -0.4]);
      }
    }

    buildTail(hips, fur) {
      const L = this.L, tl = L.tail; if (!tl) return [];
      const base = this.group(hips, tl.type === 'snake' ? [0, -0.78, -0.25] : [0, 0.02, -0.18 * (L.bulk || 1)]);
      const segs = [];
      const col = tl.type === 'tiger' || tl.type === 'cat' ? fur : this.mat(tl.color);
      const chain = (n, r0, r1, len, rx, mat, spikes) => {
        let parent = base;
        for (let i = 0; i < n; i++) {
          const g = this.group(parent, i === 0 ? [0, 0, 0] : [0, 0, -len]);
          g.rotation.x = typeof rx === 'function' ? rx(i) : rx;
          const r = r0 + (r1 - r0) * (i / (n - 1));
          this.ell(g, mat, [0, 0, -len / 2], [r, r, len * 0.62]);
          if (spikes && i % 2 === 0 && i < n - 1) this.cone(g, this.mat(L.mane || '#d8492f'), [0, r * 0.9, -len / 2], r * 0.5, r * 1.6, [-0.4, 0, 0]);
          g.userData.rx = g.rotation.x;
          segs.push(g); parent = g;
        }
        return parent;
      };
      switch (tl.type) {
        case 'thin': chain(10, 0.03, 0.014, 0.13, (i) => (i === 0 ? -0.5 : i < 3 ? -0.15 : 0.16), col); break;
        case 'cat': chain(8, 0.05, 0.035, 0.12, (i) => (i === 0 ? -0.3 : i < 3 ? 0.3 : 0.2), col); break;
        case 'tiger': { const end = chain(8, 0.06, 0.045, 0.12, (i) => (i === 0 ? -0.7 : i < 4 ? 0.12 : 0.22), col); this.ell(end, this.mat('#24160d'), [0, 0, -0.14], [0.05, 0.05, 0.06]); break; }
        case 'dragon': { const end = chain(10, 0.12, 0.03, 0.16, (i) => (i === 0 ? -0.75 : i < 5 ? 0.1 : 0.16), col, true); this.cone(end, this.mat(L.mane), [0, 0, -0.2], 0.08, 0.2, [-Math.PI / 2, 0, 0]); break; }
        case 'snake': chain(12, 0.13, 0.03, 0.17, (i) => (i === 0 ? -0.05 : i > 8 ? 0.3 : 0.02), col); break;
        case 'monkey': chain(10, 0.04, 0.03, 0.13, (i) => (i === 0 ? -0.6 : i < 4 ? 0.1 : 0.35), col); break;
        case 'curl': chain(5, 0.06, 0.05, 0.1, (i) => (i === 0 ? 0.5 : 0.7), col); break;
        case 'tuft': { const end = chain(6, 0.03, 0.025, 0.12, (i) => (i === 0 ? -1.1 : -0.08), col); this.ell(end, this.mat('#2a2421'), [0, 0, -0.15], [0.05, 0.05, 0.09]); break; }
        case 'hair': this.cone(base, col, [0, -0.3, -0.12], 0.1, 0.7, [-0.5, 0, 0]); segs.push(base); break;
        case 'short': this.ell(base, col, [0, 0.02, -0.04], [0.05, 0.07, 0.05]); segs.push(base); break;
        case 'pig': this.torus(base, col, [0, 0.03, -0.05], 0.05, 0.018, Math.PI * 1.7, [0, Math.PI / 2, 0]); segs.push(base); break;
        case 'rooster': {
          const cols = [tl.color, '#0f2a22', '#f2b23a', '#0f2a22', tl.color];
          for (let i = 0; i < 5; i++) {
            const g = this.group(base, [0, 0.05, 0]);
            g.rotation.set(0.7 - Math.abs(i - 2) * 0.12, (i - 2) * 0.32, 0);
            this.ell(g, this.mat(cols[i]), [0, 0, -0.32], [0.04, 0.09, 0.34]);
            g.userData.rx = g.rotation.x; segs.push(g);
          }
          break;
        }
      }
      return segs;
    }
  }

  function shade(hex, k) {
    const c = new T.Color(hex);
    const hsl = {}; c.getHSL(hsl);
    c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + k * hsl.l)));
    return '#' + c.getHexString();
  }
  G.shade = shade;

  G.buildFighterModel = function (def, palette) {
    return new ModelBuilder(def, palette).build();
  };
  G.ModelBuilder = ModelBuilder;
})();

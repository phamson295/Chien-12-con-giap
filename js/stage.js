'use strict';
// Dựng 6 sàn đấu mang cảnh sắc Việt Nam.
(function () {
  const G = window.G, T = THREE;

  function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  const toon = (c) => new T.MeshToonMaterial({ color: new T.Color(c), gradientMap: G.gradientMap() });
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }

  function skyTex(top, bottom) {
    return canvasTex(4, 256, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bottom);
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    });
  }

  function groundTex(c1, c2, lane) {
    const t = canvasTex(512, 512, (x, w, h) => {
      x.fillStyle = c1; x.fillRect(0, 0, w, h);
      const r = rng(7);
      for (let i = 0; i < 2600; i++) {
        x.fillStyle = r() < 0.5 ? c2 : G.shade(c1, (r() - 0.5) * 0.5);
        x.globalAlpha = 0.25 + r() * 0.35;
        const s = 2 + r() * 6;
        x.fillRect(r() * w, r() * h, s, s * 0.6);
      }
      x.globalAlpha = 1;
      if (lane) {
        x.fillStyle = lane; x.globalAlpha = 0.55;
        x.fillRect(0, h * 0.42, w, h * 0.16);
        x.globalAlpha = 1;
      }
    });
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(6, 4);
    return t;
  }

  function ridgeTex(color, seed, peaky, hh) {
    return canvasTex(1024, 256, (x, w, h) => {
      const r = rng(seed);
      x.fillStyle = color;
      x.beginPath(); x.moveTo(0, h);
      let y = h * (0.5 + r() * 0.2);
      for (let i = 0; i <= 64; i++) {
        const px = (i / 64) * w;
        if (peaky) y = h * (0.15 + r() * 0.65) * (hh || 1) + h * (1 - (hh || 1)) * 0.6;
        else y += (r() - 0.5) * h * 0.12, y = Math.max(h * 0.25, Math.min(h * 0.85, y));
        if (peaky) x.quadraticCurveTo(px - w / 128, y - h * 0.15, px, y);
        else x.lineTo(px, y);
      }
      x.lineTo(w, h); x.closePath(); x.fill();
    });
  }

  G.buildStage = function (st, scene) {
    const anim = [];
    const R = rng(st.id.length * 131 + 17);
    scene.background = skyTex(st.sky[0], st.sky[1]);
    scene.fog = new T.Fog(st.fog, 24, 110);
    const hemi = new T.HemisphereLight(new T.Color(st.sky[0]), new T.Color(st.ground), st.amb);
    scene.add(hemi);
    const sun = new T.DirectionalLight(new T.Color(st.light), 0.9);
    sun.position.set(-6, 12, 10); scene.add(sun);
    scene.add(new T.AmbientLight(0xffffff, 0.12));

    const laneCol = { river: '#b8a070', forest: '#6a5a3a', sea: '#8a8a80', grass: '#b8a050', mountain: '#a8a090', village: '#c09a6a' }[st.props];
    const ground = new T.Mesh(new T.PlaneGeometry(90, 60), toon('#ffffff'));
    ground.material.map = groundTex(st.ground, st.ground2, laneCol);
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, -15);
    scene.add(ground);

    const add = (m, x, y, z) => { m.position.set(x, y, z); scene.add(m); return m; };
    const ridge = (color, z, w, h, seed, peaky, hh) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: ridgeTex(color, seed, peaky, hh), transparent: true, fog: true }));
      return add(m, 0, h / 2 - 1.5, z);
    };
    const tree = (x, z, s, kind, col) => {
      const g = new T.Group();
      const trunk = new T.Mesh(new T.CylinderGeometry(0.12 * s, 0.18 * s, 1.6 * s, 7), toon('#5a3a22'));
      trunk.position.y = 0.8 * s; g.add(trunk);
      if (kind === 'pine') {
        for (let i = 0; i < 3; i++) { const c = new T.Mesh(new T.ConeGeometry((1.0 - i * 0.25) * s, 1.2 * s, 8), toon(col || '#2f5a3a')); c.position.y = (1.6 + i * 0.7) * s; g.add(c); }
      } else {
        for (let i = 0; i < 4; i++) { const b = new T.Mesh(new T.SphereGeometry((0.8 - i * 0.08) * s, 10, 8), toon(col || '#3f7a3a')); b.position.set((R() - 0.5) * 0.9 * s, (1.8 + R() * 0.8) * s, (R() - 0.5) * 0.6 * s); g.add(b); }
      }
      g.userData.ph = R() * 6;
      anim.push((dt, t) => { g.rotation.z = Math.sin(t * 0.8 + g.userData.ph) * 0.02; });
      return add(g, x, 0, z);
    };
    const roof = (w, d, h, color) => {
      const g = new T.Group();
      const r = new T.Mesh(new T.ConeGeometry(0.72, 1, 4), toon(color)); r.rotation.y = Math.PI / 4; r.scale.set(w, h, d); g.add(r);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const tip = new T.Mesh(new T.ConeGeometry(0.06 * w, 0.35 * h, 5), toon(color));
        tip.position.set(sx * w * 0.5, -h * 0.35, sz * d * 0.5); tip.rotation.set(sz * 0.6, 0, -sx * 0.6); g.add(tip);
      }
      return g;
    };
    const pagoda = (x, z, levels, s) => {
      const g = new T.Group();
      for (let i = 0; i < levels; i++) {
        const w = (2.2 - i * 0.3) * s;
        const body = new T.Mesh(new T.BoxGeometry(w * 0.7, 0.9 * s, w * 0.7), toon('#e8dcc0')); body.position.y = (0.45 + i * 1.2) * s; g.add(body);
        const rf = roof(w * 1.35, w * 1.35, 0.6 * s, '#7a2a1e'); rf.position.y = (1.05 + i * 1.2) * s; g.add(rf);
      }
      const sp = new T.Mesh(new T.ConeGeometry(0.1 * s, 0.9 * s, 6), toon('#e3b448')); sp.position.y = (levels * 1.2 + 0.5) * s; g.add(sp);
      return add(g, x, 0, z);
    };
    const lantern = (x, y, z) => {
      const g = new T.Group();
      const b = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), new T.MeshBasicMaterial({ color: '#e8402a' })); b.scale.y = 1.25; g.add(b);
      const cap = new T.Mesh(new T.CylinderGeometry(0.1, 0.12, 0.08, 8), toon('#e3b448')); cap.position.y = 0.3; g.add(cap);
      const gl = new T.Sprite(new T.SpriteMaterial({ map: G.glowTex(), color: '#ffb347', transparent: true, opacity: 0.6, blending: T.AdditiveBlending, depthWrite: false }));
      gl.scale.setScalar(1.3); g.add(gl);
      const ph = R() * 6;
      anim.push((dt, t) => { g.rotation.z = Math.sin(t * 1.6 + ph) * 0.12; });
      return add(g, x, y, z);
    };
    const bamboo = (x, z, n) => {
      for (let i = 0; i < n; i++) {
        const h = 4 + R() * 3, g = new T.Group();
        const c = new T.Mesh(new T.CylinderGeometry(0.06, 0.08, h, 6), toon('#6a9a3a')); c.position.y = h / 2; g.add(c);
        for (let k = 0; k < 5; k++) { const l = new T.Mesh(new T.ConeGeometry(0.15, 0.9, 4), toon('#4f8a2a')); l.position.set((R() - 0.5) * 0.6, h * (0.6 + k * 0.08), (R() - 0.5) * 0.4); l.rotation.z = (R() - 0.5) * 2; g.add(l); }
        g.rotation.z = (R() - 0.5) * 0.15;
        const ph = R() * 6;
        anim.push((dt, t) => { g.rotation.x = Math.sin(t * 0.9 + ph) * 0.03; });
        add(g, x + (R() - 0.5) * 1.2, 0, z + (R() - 0.5) * 1.2);
      }
    };
    const rock = (x, z, s, col) => {
      const m = new T.Mesh(new T.DodecahedronGeometry(s, 0), toon(col || '#7a7a72'));
      m.rotation.set(R(), R(), R()); m.scale.y = 0.7; return add(m, x, s * 0.35, z);
    };
    const clouds = (n, y, col) => {
      for (let i = 0; i < n; i++) {
        const s = new T.Sprite(new T.SpriteMaterial({ map: G.glowTex(), color: col || '#ffffff', transparent: true, opacity: 0.55, depthWrite: false, fog: false }));
        s.scale.set(8 + R() * 8, 2.5 + R() * 2, 1);
        const x0 = (R() - 0.5) * 80, sp = 0.2 + R() * 0.4;
        add(s, x0, y + R() * 6, -45 - R() * 20);
        anim.push((dt, t) => { s.position.x = ((x0 + t * sp + 40) % 80 + 80) % 80 - 40; });
      }
    };
    const water = (z0, z1, col, speed) => {
      const tex = canvasTex(256, 256, (x, w, h) => {
        x.fillStyle = col; x.fillRect(0, 0, w, h);
        const r = rng(3);
        x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 2;
        for (let i = 0; i < 40; i++) { const px = r() * w, py = r() * h; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + 10, py - 4, px + 22, py); x.stroke(); }
      });
      tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.repeat.set(10, 3);
      const m = new T.Mesh(new T.PlaneGeometry(120, z0 - z1), new T.MeshToonMaterial({ color: '#ffffff', map: tex, gradientMap: G.gradientMap() }));
      m.rotation.x = -Math.PI / 2; add(m, 0, 0.02, (z0 + z1) / 2);
      anim.push((dt) => { tex.offset.x += dt * speed; tex.offset.y += dt * speed * 0.3; });
      return m;
    };
    const particles = (n, color, size, area, fall, sway) => {
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { pos[i * 3] = (R() - 0.5) * area[0]; pos[i * 3 + 1] = R() * area[1]; pos[i * 3 + 2] = -R() * area[2] + 3; }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      const pts = new T.Points(geo, new T.PointsMaterial({ color, size, map: G.glowTex(), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      scene.add(pts);
      anim.push((dt, t) => {
        const p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) {
          let y = p.getY(i) - fall * dt * 60;
          if (y < 0) y += area[1];
          if (y > area[1]) y -= area[1];
          p.setY(i, y);
          p.setX(i, p.getX(i) + Math.sin(t * 1.3 + i) * sway);
        }
        p.needsUpdate = true;
      });
    };
    const grassTufts = (n, col, zmin, zmax) => {
      const mat = toon(col);
      for (let i = 0; i < n; i++) {
        const g = new T.Group();
        for (let k = 0; k < 3; k++) { const c = new T.Mesh(new T.ConeGeometry(0.05, 0.35 + R() * 0.25, 4), mat); c.position.set((R() - 0.5) * 0.2, 0.18, (R() - 0.5) * 0.2); c.rotation.z = (R() - 0.5) * 0.6; g.add(c); }
        const x = (R() - 0.5) * 40, z = zmin + R() * (zmax - zmin);
        if (Math.abs(z) < 1.2) continue;
        add(g, x, 0, z);
      }
    };

    switch (st.props) {
      case 'river': {
        ridge('#9ab8a8', -70, 220, 30, 3, true, 0.7);
        ridge('#6f9a6a', -48, 180, 14, 5, false);
        water(-3.5, -30, '#4f8ab8', 0.03);
        const bank = new T.Mesh(new T.PlaneGeometry(120, 14), toon('#6f9a4a')); bank.rotation.x = -Math.PI / 2; add(bank, 0, 0.03, -37);
        // Cổng tam quan
        const gate = new T.Group();
        for (const sx of [-3, -1.2, 1.2, 3]) { const p = new T.Mesh(new T.CylinderGeometry(0.22, 0.25, 4.2, 10), toon('#b8281c')); p.position.set(sx, 2.1, 0); gate.add(p); }
        const beam = new T.Mesh(new T.BoxGeometry(7.2, 0.4, 0.5), toon('#8a1e14')); beam.position.y = 4.0; gate.add(beam);
        const rf = roof(8.6, 2.4, 1.3, '#7a3a24'); rf.position.y = 4.85; gate.add(rf);
        const rf2 = roof(4.2, 1.8, 0.9, '#7a3a24'); rf2.position.y = 5.9; gate.add(rf2);
        for (const sx of [-1, 1]) { const side = roof(2.6, 1.6, 0.8, '#7a3a24'); side.position.set(sx * 5, 3.2, 0); gate.add(side); const sp = new T.Mesh(new T.CylinderGeometry(0.2, 0.22, 2.8, 10), toon('#b8281c')); sp.position.set(sx * 5, 1.4, 0); gate.add(sp); }
        const plaque = new T.Mesh(new T.BoxGeometry(1.6, 0.6, 0.1), toon('#e3b448')); plaque.position.set(0, 3.4, 0.3); gate.add(plaque);
        add(gate, 0, 0, -36);
        for (let i = 0; i < 14; i++) tree((R() - 0.5) * 70, -34 - R() * 8, 1.4 + R(), 'round', '#3f7a3a');
        for (let i = 0; i < 8; i++) tree((i < 4 ? -1 : 1) * (9 + R() * 8), -1.8 - R() * 1.5, 0.9 + R() * 0.4, 'round', '#4f8a3a');
        grassTufts(60, '#5a8a3a', -3.4, 4);
        clouds(10, 14);
        for (let i = 0; i < 3; i++) { const boat = new T.Group(); const hull = new T.Mesh(new T.SphereGeometry(1, 10, 6), toon('#6a4a2a')); hull.scale.set(1.4, 0.25, 0.4); boat.add(hull); const hat = new T.Mesh(new T.ConeGeometry(0.3, 0.25, 10), toon('#e8d8a0')); hat.position.set(0.3, 0.45, 0); boat.add(hat); const bx = (R() - 0.5) * 40, bz = -10 - R() * 14; add(boat, bx, 0.05, bz); anim.push((dt, t) => { boat.position.x = bx + Math.sin(t * 0.1 + bz) * 4; boat.rotation.z = Math.sin(t * 1.4 + bz) * 0.05; }); }
        break;
      }
      case 'forest': {
        ridge('#3f6a55', -60, 220, 26, 11, true, 0.8);
        ridge('#2f5242', -40, 180, 16, 13, true, 0.6);
        for (let i = 0; i < 40; i++) tree((R() - 0.5) * 70, -6 - R() * 28, 1.6 + R() * 1.4, R() < 0.5 ? 'pine' : 'round', R() < 0.5 ? '#2f5a3a' : '#3a6a32');
        for (let i = 0; i < 6; i++) tree((i < 3 ? -1 : 1) * (10 + R() * 6), -2.5, 1.8, 'round', '#2f5a2a');
        for (let i = 0; i < 6; i++) {
          const ray = new T.Mesh(new T.PlaneGeometry(2.5, 26), new T.MeshBasicMaterial({ color: '#fff6c0', transparent: true, opacity: 0.07, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
          ray.rotation.z = 0.35; add(ray, -14 + i * 6 + R() * 2, 10, -12 - R() * 8);
        }
        for (let i = 0; i < 10; i++) rock((R() - 0.5) * 40, -3 - R() * 6, 0.4 + R() * 0.6, '#5a6a5a');
        grassTufts(90, '#3f7a35', -6, 4);
        particles(70, '#d8ff7a', 0.14, [36, 6, 10], -0.002, 0.004);
        break;
      }
      case 'sea': {
        ridge('#2a3445', -70, 220, 20, 17, true, 0.5);
        water(-4, -80, '#2f4a68', 0.08);
        for (let i = 0; i < 9; i++) rock((R() - 0.5) * 50, -6 - R() * 20, 1.2 + R() * 2.5, '#3f4650');
        for (let i = 0; i < 12; i++) rock((R() - 0.5) * 40, -2.8 - R() * 1.2, 0.3 + R() * 0.5, '#5a5a55');
        // ngọn hải đăng
        const lh = new T.Group();
        const tw = new T.Mesh(new T.CylinderGeometry(0.6, 0.9, 7, 10), toon('#e8e4dc')); tw.position.y = 3.5; lh.add(tw);
        for (let k = 0; k < 3; k++) { const band = new T.Mesh(new T.CylinderGeometry(0.72 - k * 0.08, 0.76 - k * 0.08, 0.6, 10), toon('#b8281c')); band.position.y = 1.5 + k * 2; lh.add(band); }
        const lamp = new T.Sprite(new T.SpriteMaterial({ map: G.glowTex(), color: '#fff2b0', transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
        lamp.scale.setScalar(4); lamp.position.y = 7.4; lh.add(lamp);
        add(lh, -16, 0, -26);
        anim.push((dt, t) => { lamp.material.opacity = 0.5 + 0.5 * Math.max(0, Math.sin(t * 2)); });
        clouds(12, 10, '#5a6475');
        let flash = 0;
        anim.push((dt) => {
          if (Math.random() < 0.004) flash = 1;
          flash = Math.max(0, flash - dt * 3);
          hemi.intensity = st.amb + flash * 1.4;
        });
        break;
      }
      case 'grass': {
        ridge('#b86a4a', -80, 220, 24, 21, true, 0.45);
        ridge('#a8783a', -50, 180, 10, 23, false);
        for (let i = 0; i < 6; i++) { const hill = new T.Mesh(new T.SphereGeometry(1, 16, 10), toon(i % 2 ? '#a8903a' : '#b89a40')); hill.scale.set(12 + R() * 8, 2 + R() * 2, 6); add(hill, (R() - 0.5) * 80, -0.5, -25 - R() * 15); }
        const sunS = new T.Sprite(new T.SpriteMaterial({ map: G.glowTex(), color: '#ffcf6a', transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
        sunS.scale.setScalar(16); add(sunS, 10, 9, -75);
        for (let i = 0; i < 5; i++) tree((R() - 0.5) * 60, -12 - R() * 10, 1.4, 'round', '#6a7a2a');
        grassTufts(150, '#b8a040', -10, 4);
        const fl = toon('#f2e05a');
        for (let i = 0; i < 40; i++) { const f = new T.Mesh(new T.SphereGeometry(0.06, 6, 4), fl); add(f, (R() - 0.5) * 30, 0.15, -1.5 - R() * 6); }
        for (let i = 0; i < 6; i++) {
          const b = new T.Group(); const w1 = new T.Mesh(new T.BoxGeometry(0.4, 0.03, 0.1), new T.MeshBasicMaterial({ color: '#3a2a2a' })); b.add(w1);
          const bx = (R() - 0.5) * 30, by = 8 + R() * 4, bz = -30 - R() * 10; add(b, bx, by, bz);
          anim.push((dt, t) => { b.position.x = bx + ((t * 0.8 + bx) % 40) - 20; w1.rotation.z = Math.sin(t * 8 + bx) * 0.5; });
        }
        particles(50, '#ffd890', 0.08, [36, 5, 8], 0.003, 0.006);
        break;
      }
      case 'mountain': {
        for (let i = 0; i < 16; i++) {
          const h = 10 + R() * 18, peak = new T.Mesh(new T.CylinderGeometry(0.6 + R(), 3 + R() * 2, h, 10), toon(R() < 0.5 ? '#7a8a8a' : '#6a7a7a'));
          const cap = new T.Mesh(new T.SphereGeometry(1, 10, 8), toon('#4f6a4a')); cap.scale.set(1.6, 1.2, 1.6); cap.position.y = h / 2; peak.add(cap);
          add(peak, (R() - 0.5) * 120, h / 2 - 1, -40 - R() * 40);
        }
        ridge('#9fb0ba', -85, 240, 30, 29, true, 0.8);
        pagoda(-9, -14, 5, 1.1);
        for (let i = 0; i < 18; i++) tree((R() - 0.5) * 50, -6 - R() * 14, 1.2 + R(), 'pine', '#3a5a3a');
        // bậc đá và đèn đá
        for (let i = 0; i < 6; i++) { const step = new T.Mesh(new T.BoxGeometry(3, 0.25, 0.8), toon('#9a948a')); add(step, -9, 0.12 + i * 0.25, -10 - i * 0.8); }
        for (const sx of [-6, 6]) { const l = new T.Group(); const base = new T.Mesh(new T.BoxGeometry(0.4, 1.2, 0.4), toon('#8a8478')); base.position.y = 0.6; l.add(base); const top = roof(0.9, 0.9, 0.4, '#6a655c'); top.position.y = 1.4; l.add(top); add(l, sx, 0, -3); }
        // hoa mai rơi
        particles(80, '#ffd23a', 0.12, [36, 8, 10], 0.012, 0.008);
        clouds(8, 6, '#eef2f4');
        break;
      }
      case 'village': {
        ridge('#8fb8a8', -80, 220, 22, 31, true, 0.6);
        // ruộng bậc thang
        for (let i = 0; i < 10; i++) {
          const t = new T.Mesh(new T.BoxGeometry(110, 0.5 + i * 0.6, 3), toon(i % 3 === 0 ? '#c8b04a' : i % 3 === 1 ? '#8ab04a' : '#6a9a3a'));
          add(t, 0, (0.5 + i * 0.6) / 2, -14 - i * 3);
        }
        // đình làng
        const dinh = new T.Group();
        const wall = new T.Mesh(new T.BoxGeometry(6, 2, 3), toon('#c8a070')); wall.position.y = 1; dinh.add(wall);
        for (const px of [-2.6, -0.9, 0.9, 2.6]) { const p = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 2.2, 8), toon('#7a2a1e')); p.position.set(px, 1.1, 1.6); dinh.add(p); }
        const rf = roof(8.4, 5, 2.2, '#8a3a24'); rf.position.y = 2.9; dinh.add(rf);
        add(dinh, 9, 0, -9);
        // cây đa
        const banyan = new T.Group();
        const trunk = new T.Mesh(new T.CylinderGeometry(0.6, 1.0, 4, 10), toon('#5a4030')); trunk.position.y = 2; banyan.add(trunk);
        for (let i = 0; i < 7; i++) { const c = new T.Mesh(new T.SphereGeometry(2 + R(), 12, 10), toon('#3a6a2a')); c.position.set((R() - 0.5) * 5, 4.5 + R() * 1.5, (R() - 0.5) * 2); banyan.add(c); }
        for (let i = 0; i < 6; i++) { const root = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 3, 4), toon('#6a5040')); root.position.set((R() - 0.5) * 4, 2, (R() - 0.5) * 1.5); banyan.add(root); }
        add(banyan, -10, 0, -8);
        bamboo(-17, -5, 7); bamboo(16, -4, 6); bamboo(-4, -11, 5);
        for (let i = 0; i < 7; i++) lantern(-4 + i * 1.6, 3.6 + Math.sin(i) * 0.15, -6.5);
        const rope = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 11, 4), toon('#3a2a1a')); rope.rotation.z = Math.PI / 2; add(rope, 0.8, 3.95, -6.5);
        // diều
        for (let i = 0; i < 3; i++) {
          const k = new T.Mesh(new T.PlaneGeometry(0.9, 1.2), new T.MeshBasicMaterial({ color: ['#e8402a', '#f2c94c', '#3f86c6'][i], side: T.DoubleSide })); k.rotation.z = Math.PI / 4;
          const kx = -8 + i * 8, ky = 12 + i, kz = -30; add(k, kx, ky, kz);
          anim.push((dt, t) => { k.position.y = ky + Math.sin(t * 0.7 + i) * 0.6; k.rotation.z = Math.PI / 4 + Math.sin(t * 1.1 + i) * 0.15; });
        }
        grassTufts(60, '#6a9a3a', -4, 4);
        clouds(9, 13);
        break;
      }
    }
    return { update(dt, t) { for (const f of anim) f(dt, t); } };
  };
})();

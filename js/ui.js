'use strict';
// Điều phối màn hình, thanh máu, điều khiển cảm ứng và vòng lặp chính.
(function () {
  const G = window.G;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const STAT_NAMES = [['mau', 'Máu'], ['st', 'Sát thương'], ['toc', 'Tốc độ'], ['tam', 'Tầm đánh'], ['cd', 'Cơ động']];
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  const view = new G.View($('#cv'));
  const sound = new G.Sound();
  const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  document.body.classList.toggle('touch', isTouch);

  let game = null, cfg = null, paused = false, isDemo = true;
  const sel = { mode: 'cpu', diff: 'thuong', stage: 'rand', picks: [null, null], slot: 0, kb: 0 };

  // ---------------- Màn hình ----------------
  const SCREENS = ['title', 'select', 'pause', 'moves', 'result', 'help'];
  let current = 'title';
  function show(name) {
    current = name;
    for (const s of SCREENS) $('#scr-' + s).hidden = s !== name;
    document.body.classList.toggle('fighting', !name && !isDemo);
    $('#touch').hidden = !(isTouch && !name && !isDemo);
    G.touch.active = isTouch && !name && !isDemo;
  }

  $('#strip').innerHTML = G.CHARS.map((c) => `<span title="${c.chi} – ${c.name}">${c.icon}</span>`).join('');

  // ---------------- Chọn nhân vật ----------------
  function renderGrid() {
    $('#grid').innerHTML = G.CHARS.map((c, i) => {
      const tags = sel.picks.map((p, s) => (p === c.id ? `<span class="tag p${s + 1}">${s === 0 ? 'P1' : sel.mode === 'cpu' ? 'MÁY' : sel.mode === 'train' ? 'BAO CÁT' : 'P2'}</span>` : '')).join('');
      return `<button class="card${i === sel.kb ? ' kb' : ''}" data-id="${c.id}" style="--el:${G.ELEMENTS[c.element].color}" aria-label="${c.chi} ${c.name}">
        ${tags}<span class="em">${c.icon}</span><span class="chi">${c.chi.toUpperCase()}</span><span class="nm">${c.name}</span></button>`;
    }).join('');
    $$('#grid .card').forEach((el, i) => {
      el.addEventListener('mouseenter', () => { sel.kb = i; renderDetail(G.CHARS[i]); markKb(); });
      el.addEventListener('click', () => { sel.kb = i; choose(G.CHARS[i].id); });
    });
  }
  function markKb() { $$('#grid .card').forEach((el, i) => el.classList.toggle('kb', i === sel.kb)); }

  function moveRows(c) {
    const s = c.specials;
    const rows = [
      ['ĐB', s.nS.name, ''], ['→ + ĐB', s.fS.name, ''], ['↓ + ĐB', s.dS.name, ''],
      ['Bản Năng', c.instinct.name, c.instinct.desc], ['Tuyệt kỹ', c.super.name, 'Cần đủ 3 vạch Khí'],
    ];
    if (c.passive) rows.push(['Nội tại', '', c.passive]);
    return rows.map(([k, n, d]) => `<li><kbd>${k}</kbd><span><b>${n}</b>${d ? `<em>${d}</em>` : ''}</span></li>`).join('');
  }

  function renderDetail(c) {
    const el = G.ELEMENTS[c.element];
    const stars = '★'.repeat(c.diff) + '☆'.repeat(5 - c.diff);
    $('#detail').innerHTML = `
      <div class="eyebrow">${c.chi} · ${c.title}</div>
      <h3>${c.icon} ${c.name}</h3>
      <div class="sub">${c.style}</div>
      <div class="badges"><span class="badge" style="border-color:${el.color};color:${el.color}">Hành ${el.name}</span><span class="badge">Độ khó ${stars}</span></div>
      <div class="stats">${STAT_NAMES.map(([k, n]) => `<span>${n}</span><span class="pips">${[1, 2, 3, 4, 5].map((v) => `<i class="${v <= c.stats[k] ? 'on' : ''}"></i>`).join('')}</span><span class="n">${c.stats[k]}/5</span>`).join('')}</div>
      <p class="lore">${c.lore}</p>
      <ul class="moves">${moveRows(c)}</ul>`;
  }

  function renderSlots() {
    $$('.slot').forEach((el) => {
      const s = +el.dataset.slot, id = sel.picks[s], c = id && G.charById(id);
      el.classList.toggle('active', s === sel.slot);
      el.querySelector('.ic').textContent = c ? c.icon : '?';
      el.querySelector('small').textContent = c ? `${c.chi} – ${c.name}` : 'Chưa chọn';
    });
    $('.p2t').textContent = sel.mode === 'cpu' ? 'Máy' : sel.mode === 'train' ? 'Bao cát' : 'Người chơi 2';
    $('#sel-go').disabled = !(sel.picks[0] && sel.picks[1]);
    $('#opt-diff').hidden = sel.mode !== 'cpu';
  }

  function choose(id) {
    sound.play('select');
    sel.picks[sel.slot] = id;
    if (sel.slot === 0 && !sel.picks[1]) sel.slot = 1;
    else if (sel.slot === 0) sel.slot = 1;
    renderGrid(); renderSlots();
  }

  function openSelect(mode) {
    sel.mode = mode;
    if (!sel.picks[0]) sel.slot = 0;
    renderGrid(); renderSlots(); renderDetail(G.CHARS[sel.kb]);
    $('#opt-stage').innerHTML = '<label>Sàn đấu</label>' + [['rand', 'Ngẫu nhiên']].concat(G.STAGES.map((s) => [s.id, s.name]))
      .map(([v, n]) => `<button class="chip${sel.stage === v ? ' on' : ''}" data-v="${v}">${n}</button>`).join('');
    $$('#opt-stage .chip').forEach((b) => b.addEventListener('click', () => { sel.stage = b.dataset.v; $$('#opt-stage .chip').forEach((x) => x.classList.toggle('on', x === b)); sound.play('ui'); }));
    show('select');
  }

  $$('.slot').forEach((el) => el.addEventListener('click', () => { sel.slot = +el.dataset.slot; renderSlots(); }));
  $$('#opt-diff .chip').forEach((b) => b.addEventListener('click', () => { sel.diff = b.dataset.v; $$('#opt-diff .chip').forEach((x) => x.classList.toggle('on', x === b)); sound.play('ui'); }));
  $('#sel-back').addEventListener('click', () => { show('title'); });
  $('#sel-rand').addEventListener('click', () => { choose(pick(G.CHARS).id); });
  $('#sel-go').addEventListener('click', () => {
    const stage = sel.stage === 'rand' ? pick(G.STAGES) : G.STAGES.find((s) => s.id === sel.stage);
    startMatch({ mode: sel.mode, diff: sel.diff, defs: sel.picks.map(G.charById), stage });
  });

  // ---------------- Bắt đầu trận ----------------
  function makeGame(c) {
    const pads = [new G.Pad(), new G.Pad()];
    let sources;
    if (c.mode === 'demo') sources = [new G.AISource('kho'), new G.AISource('thuong')];
    else if (c.mode === 'cpu') sources = [new G.HumanSource(0, true), new G.AISource(c.diff)];
    else if (c.mode === 'pvp') sources = [new G.HumanSource(0, false), new G.HumanSource(1, false)];
    else sources = [new G.HumanSource(0, true), new G.NullSource()];
    const g = new G.Game({ defs: c.defs, stage: c.stage, mode: c.mode === 'demo' ? 'cpu' : c.mode, pads, sources });
    g.audio = c.mode === 'demo' ? null : sound;
    view.setGame(g);
    g.on(onEvent);
    return g;
  }

  function startDemo() {
    isDemo = true;
    const a = pick(G.CHARS); let b = pick(G.CHARS); while (b === a) b = pick(G.CHARS);
    cfg = { mode: 'demo', defs: [a, b], stage: pick(G.STAGES) };
    game = makeGame(cfg);
    $('#hud').hidden = true;
  }

  function startMatch(c) {
    isDemo = false; cfg = c; paused = false;
    game = makeGame(c);
    hud.bind(game);
    $('#hud').hidden = false;
    $('.train-tip').hidden = c.mode !== 'train';
    show(null);
  }

  // ---------------- Thanh máu, sự kiện ----------------
  const hud = {
    bind(g) {
      this.g = g;
      this.sides = [0, 1].map((i) => {
        const root = $('.side.p' + (i + 1)), m = $('.m.p' + (i + 1)), f = g.fighters[i];
        root.querySelector('.ic').textContent = f.def.icon;
        root.querySelector('.name').textContent = f.def.name.toUpperCase();
        const el = G.ELEMENTS[f.def.element];
        const elb = root.querySelector('.el'); elb.textContent = el.name; elb.style.background = el.color; elb.style.color = '#120d0a';
        return { root, m, f, trail: 1, fill: root.querySelector('.fill'), tr: root.querySelector('.trail'), wins: $$('.wins s', root),
          status: root.querySelector('.status'), khi: $$('.khi span', m), khiL: m.querySelector('.khi-label b'), bn: m.querySelector('.bn'), bnI: m.querySelector('.bn i'), lastStatus: '' };
      });
      $('#banner').classList.remove('show');
    },
    update() {
      const g = this.g; if (!g || isDemo) return;
      $('.timer').textContent = g.timer === Infinity ? '∞' : Math.max(0, g.timer);
      for (const s of this.sides) {
        const f = s.f, r = Math.max(0, f.hp / f.maxHp);
        s.fill.style.width = (r * 100) + '%';
        s.fill.classList.toggle('low', r < 0.25);
        if (f.state !== 'hitstun' && f.state !== 'grabbed' && !f.inSeq) s.trail += (r - s.trail) * 0.06;
        if (s.trail < r) s.trail = r;
        s.tr.style.width = (s.trail * 100) + '%';
        s.wins.forEach((w, i) => w.classList.toggle('on', f.wins > i));
        const bars = f.khi / 100;
        s.khi.forEach((k, i) => { const v = Math.max(0, Math.min(1, bars - i)); k.firstChild.style.width = (v * 100) + '%'; k.classList.toggle('full', v >= 1); });
        s.khiL.textContent = Math.floor(f.khi / 100);
        s.bnI.style.width = (f.bn) + '%';
        s.bn.classList.toggle('full', f.bn >= 100);
        const st = [];
        if (f.poison.stacks) st.push('Độc ×' + f.poison.stacks);
        if (f.def.id === 'ngo' && f.momLevel()) st.push('Đà ' + f.momLevel());
        if (f.full) st.push('No ' + f.full);
        const B = { roar: 'Hổ Gầm', rain: 'Mưa', nine: 'Chín Mạng', venom: 'Cực Độc', gallop: 'Phi Nước Đại', mark: 'Đánh Hơi', endure: 'Bền Bỉ' };
        for (const k in f.buffs) if (B[k]) st.push(B[k] + ' ' + Math.ceil(f.buffs[k] / 60) + 's');
        const html = st.map((x) => `<span>${x}</span>`).join('');
        if (html !== s.lastStatus) { s.status.innerHTML = html; s.lastStatus = html; }
        const cb = $('.combo.p' + (f.side + 1));
        if (f.combo >= 2) { cb.innerHTML = `${f.combo} ĐÒN<small>${Math.round(f.comboDmg)} sát thương</small>`; cb.classList.add('show'); this['ct' + f.side] = 50; }
        else if ((this['ct' + f.side] = (this['ct' + f.side] || 0) - 1) <= 0) cb.classList.remove('show');
      }
    },
  };

  let bannerT = null;
  function banner(text, sub, keep) {
    const b = $('#banner');
    b.innerHTML = text + (sub ? `<small>${sub}</small>` : '');
    b.classList.add('show');
    clearTimeout(bannerT);
    if (!keep) bannerT = setTimeout(() => b.classList.remove('show'), 1100);
  }

  function onEvent(type, d) {
    if (isDemo) { if (type === 'matchEnd') setTimeout(() => { if (isDemo) startDemo(); }, 1200); return; }
    if (type === 'banner') banner(d.text, d.sub);
    else if (type === 'text') {
      const box = $('.ftext.p' + (d.side + 1));
      const el = document.createElement('div'); el.textContent = d.str; box.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    } else if (type === 'super') {
      const bar = $('#superbar');
      bar.innerHTML = `<div>${d.name.toUpperCase()}</div>`;
      $('#dim').classList.add('on');
      setTimeout(() => { $('#dim').classList.remove('on'); bar.innerHTML = ''; }, 720);
    } else if (type === 'matchEnd') {
      setTimeout(() => showResult(d.winner), 900);
    }
  }

  function showResult(w) {
    const g = game; if (!g || isDemo) return;
    let big, eyebrow = 'Kết thúc trận', line;
    if (w < 0) { big = 'HÒA'; line = 'Hai bên ngang tài ngang sức.'; }
    else {
      const f = g.fighters[w];
      if (cfg.mode === 'cpu') big = w === 0 ? 'BẠN THẮNG' : 'MÁY THẮNG';
      else big = `NGƯỜI ${w + 1} THẮNG`;
      eyebrow = `${f.def.chi} · ${f.def.title}`;
      line = `${f.def.icon} ${f.def.name} thắng ${f.wins}–${g.fighters[1 - w].wins}. ${f.def.lore}`;
    }
    $('#res-eyebrow').textContent = eyebrow; $('#res-big').textContent = big; $('#res-line').textContent = line;
    show('result');
    focusFirst('#scr-result');
  }

  // ---------------- Menu ----------------
  function setPause(on) {
    if (isDemo || !game || game.phase === 'end') return;
    paused = on;
    if (on) { show('pause'); focusFirst('#scr-pause'); } else show(null);
  }
  function renderMoves() {
    const defs = game ? game.fighters.map((f) => f.def) : [G.CHARS[0]];
    $('#movelist').innerHTML = defs.map((c, i) => `<div class="helpbox"><h3>${i === 0 ? 'Người chơi 1' : sel.mode === 'cpu' ? 'Máy' : 'Đối thủ'} · ${c.icon} ${c.name}</h3><ul class="moves">${moveRows(c)}</ul></div>`).join('');
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    sound.play('ui');
    const a = b.dataset.act;
    if (a === 'cpu' || a === 'pvp' || a === 'train') openSelect(a);
    else if (a === 'help') show('help');
    else if (a === 'help-back') show(game && !isDemo ? 'pause' : 'title');
    else if (a === 'resume') setPause(false);
    else if (a === 'moves') { renderMoves(); show('moves'); }
    else if (a === 'moves-back') show('pause');
    else if (a === 'sfx') { sound.sfxOn = !sound.sfxOn; b.querySelector('b').textContent = sound.sfxOn ? 'Bật' : 'Tắt'; }
    else if (a === 'music') { sound.musicOn = !sound.musicOn; b.querySelector('b').textContent = sound.musicOn ? 'Bật' : 'Tắt'; }
    else if (a === 'rematch') startMatch(Object.assign({}, cfg));
    else if (a === 'reselect') { paused = false; startDemo(); openSelect(sel.mode); }
    else if (a === 'home') { paused = false; startDemo(); show('title'); }
  });
  function focusFirst(sc) { const b = $(sc + ' .btn'); if (b) b.focus({ preventScroll: true }); }

  // Bàn phím trong menu
  window.addEventListener('keydown', (e) => {
    unlockAudio();
    if (current === null) {
      if (e.code === 'Escape' || e.code === 'KeyP') setPause(true);
      return;
    }
    if (current === 'pause' && (e.code === 'Escape' || e.code === 'KeyP')) { setPause(false); return; }
    if (current === 'select') {
      const cols = window.innerWidth <= 480 ? 4 : 6;
      const n = G.CHARS.length;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') sel.kb = (sel.kb + 1) % n;
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') sel.kb = (sel.kb + n - 1) % n;
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') sel.kb = (sel.kb + cols) % n;
      else if (e.code === 'ArrowUp' || e.code === 'KeyW') sel.kb = (sel.kb + n - cols) % n;
      else if (e.code === 'Enter' || e.code === 'KeyJ' || e.code === 'Space') {
        e.preventDefault();
        if (sel.picks[0] && sel.picks[1] && document.activeElement === $('#sel-go')) return;
        choose(G.CHARS[sel.kb].id);
        if (sel.picks[0] && sel.picks[1]) $('#sel-go').focus();
        return;
      } else if (e.code === 'Escape') { show('title'); return; }
      else return;
      e.preventDefault();
      markKb(); renderDetail(G.CHARS[sel.kb]);
      return;
    }
    if (e.code === 'Escape') {
      if (current === 'help') show(game && !isDemo ? 'pause' : 'title');
      else if (current === 'moves') show('pause');
    }
  });

  // ---------------- Âm thanh mở khóa ----------------
  let audioReady = false;
  function unlockAudio() {
    if (audioReady) return;
    audioReady = true;
    sound.init(); sound.startMusic();
  }
  window.addEventListener('pointerdown', unlockAudio, { once: false });

  // ---------------- Cảm ứng ----------------
  (function touchSetup() {
    const stick = $('#stick'), knob = $('#knob'), held = G.touch.held;
    let sid = null;
    const setDir = (dx, dy) => {
      const r = stick.clientWidth / 2, len = Math.hypot(dx, dy), k = len > r ? r / len : 1;
      knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
      const dz = r * 0.35;
      held.l = dx < -dz; held.r = dx > dz; held.u = dy < -dz * 1.3; held.d = dy > dz * 1.1;
    };
    const center = () => { const b = stick.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; };
    stick.addEventListener('pointerdown', (e) => { sid = e.pointerId; stick.setPointerCapture(sid); const [cx, cy] = center(); setDir(e.clientX - cx, e.clientY - cy); e.preventDefault(); });
    stick.addEventListener('pointermove', (e) => { if (e.pointerId !== sid) return; const [cx, cy] = center(); setDir(e.clientX - cx, e.clientY - cy); });
    const release = (e) => { if (e.pointerId !== sid) return; sid = null; setDir(0, 0); };
    stick.addEventListener('pointerup', release); stick.addEventListener('pointercancel', release);
    $$('#tbtns button').forEach((b) => {
      const k = b.dataset.k;
      const on = (e) => { held[k] = true; b.classList.add('on'); e.preventDefault(); b.setPointerCapture && b.setPointerCapture(e.pointerId); };
      const off = () => { held[k] = false; b.classList.remove('on'); };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
    });
  })();
  $('#btn-pause').addEventListener('click', () => setPause(true));

  document.addEventListener('visibilitychange', () => { if (document.hidden && current === null) setPause(true); });

  // ---------------- Vòng lặp ----------------
  let last = performance.now(), acc = 0, padStart = [false, false];
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    // nút Start của tay cầm
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < 2; i++) {
      const p = pads && pads[i], st = !!(p && p.buttons[9] && p.buttons[9].pressed);
      if (st && !padStart[i]) { if (current === null) setPause(true); else if (current === 'pause') setPause(false); }
      padStart[i] = st;
    }
    const frozen = paused || (!isDemo && current !== null);
    if (game && !frozen) {
      acc += dt;
      let n = 0;
      while (acc >= 1 / 60 && n < 5) { game.step(); acc -= 1 / 60; n++; }
      if (n >= 5) acc = 0;
    }
    view.render(frozen ? 0 : dt);
    hud.update();
    requestAnimationFrame(frame);
  }

  startDemo();
  show('title');
  focusFirst('#scr-title');
  requestAnimationFrame(frame);
  G.debug = { get game() { return game; }, startMatch, view };
})();

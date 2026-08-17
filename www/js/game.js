/* 羊村消消乐 - 游戏会话:渲染、动画、粒子、输入 */
window.YXXL = window.YXXL || {};
(function (N) {
  const ROWS = 9, COLS = 9;
  const Board = N.Board;

  let canvas, ctx, W = 0, cell = 0;
  let session = null;
  let rafId = null, lastT = 0;
  const tweens = [], particles = [], floaters = [], flashes = [];
  let flashId = 0;
  /* 调试追踪(自测用):记录视觉对象的创建/移动/销毁 */
  const trace = [];
  function tr(msg) {
    if (!window.__YXXL_TRACE) return;
    trace.push({ t: performance.now(), msg: msg });
    if (trace.length > 600) trace.shift();
  }
  N.__traceGet = function () { return trace.slice(); };

  const delay = function (ms) { return new Promise(function (res) { setTimeout(res, ms); }); };

  function easeOutQuad(t) { return t * (2 - t); }
  function easeInQuad(t) { return t * t; }
  function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function easeOutBack(t) { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

  function tweenObj(obj, props, dur, ease, onDone) {
    return new Promise(function (resolve) {
      const from = {};
      for (const k in props) from[k] = obj[k];
      tweens.push({
        obj: obj, props: props, from: from, dur: dur,
        ease: ease || easeOutQuad, start: performance.now(),
        done: function () { if (onDone) onDone(); resolve(); }
      });
    });
  }

  function updateTweens(now) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      const t = Math.min(1, (now - tw.start) / tw.dur);
      const e = tw.ease(t);
      for (const k in tw.props) tw.obj[k] = tw.from[k] + (tw.props[k] - tw.from[k]) * e;
      if (t >= 1) { tweens.splice(i, 1); tw.done(); }
    }
  }

  /* ---- 画布工具 ---- */
  function rr(x, y, w, h, r) {
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function iconFor(tile) {
    const A = N.Assets;
    if (tile.ingredient === 'wolf') return A.img(A.wolfURL());
    if (tile.ingredient === 'cake') return A.img(A.cakeIngURL());
    if (tile.special) return A.img(A.specialURL(tile.c, tile.special));
    return A.img(A.faceURL(tile.c));
  }

  /* 新手引导完成(首次成功交换后) */
  function finishTutorial() {
    if (!session.tutorial || session.tutorial.kind !== 'swap') return;
    session.tutorial = null;
    N.Store.markTutorialDone();
    N.UI.hideTutorialTip();
  }

  /* 机制首见引导完成 */
  function finishMechTutorial(key) {
    if (!session.tutorial || session.tutorial.kind === 'swap') return;
    const storeKey = session.tutorial.kind === 'collect' ? 'tutCollect' : 'tutJelly';
    session.tutorial = null;
    N.Store.markTutSeen(storeKey);
    N.UI.hideTutorialTip();
    void key;
  }

  /* ---- 视觉对象 ---- */
  function visualByTile(tile) {
    if (!session) return null;
    for (const v of session.visuals) if (v.tile === tile && !v.dying) return v;
    return null;
  }
  function visualAt(r, c) {
    if (!session) return null;
    for (const v of session.visuals) {
      if (!v.dying && Math.round(v.x) === c && Math.round(v.y) === r) return v;
    }
    return null;
  }
  function killVisual(v) {
    v.dying = true;
    tr('KILL #' + v.tile.id + ' 位置' + Math.round(v.x) + ',' + Math.round(v.y) + ' 目标格中棋子#' + (session.board.grid[Math.round(v.y)] && session.board.grid[Math.round(v.y)][Math.round(v.x)] ? session.board.grid[Math.round(v.y)][Math.round(v.x)].id : 'null'));
    tweenObj(v, { scale: 0.1, alpha: 0 }, 240, easeInQuad, function () {
      const i = session.visuals.indexOf(v);
      if (i >= 0) session.visuals.splice(i, 1);
    });
  }
  function rebuildVisuals() {
    session.visuals = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = session.board.grid[r][c];
      if (t) session.visuals.push({ tile: t, x: c, y: r, scale: 1, alpha: 1, dying: false });
    }
  }

  /* 视觉对账:以棋盘模型为准,清除多余视觉、补齐缺失视觉、对齐位置 */
  function reconcileVisuals() {
    if (!session || !session.board) return;
    const g = session.board.grid;
    const gridTiles = new Set();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (g[r][c]) gridTiles.add(g[r][c]);
    }
    session.visuals = session.visuals.filter(function (v) { return gridTiles.has(v.tile); });
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = g[r][c];
      if (!t) continue;
      let v = null;
      for (const vv of session.visuals) {
        if (vv.tile === t && !vv.dying) { v = vv; break; }
      }
      if (!v) {
        v = { tile: t, x: c, y: r, scale: 1, alpha: 1, dying: false };
        session.visuals.push(v);
      } else {
        v.x = c;
        v.y = r;
        v.alpha = 1;
      }
    }
  }

  /* ---- 粒子与特效 ---- */
  function perfScale() {
    let k = 1;
    if ((window.devicePixelRatio || 1) > 1.5) k *= 0.7;
    if (W > 0 && W < 420) k *= 0.8;
    return k;
  }
  function burst(r, c, color, n) {
    n = Math.max(5, Math.round(n * perfScale()));
    const cx = (c + 0.5) * cell, cy = (r + 0.5) * cell;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 120;
      particles.push({
        x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
        life: 0.5 + Math.random() * 0.4, t: 0, size: 3 + Math.random() * 4,
        color: color, grav: 260, shape: Math.random() < 0.3 ? 'star' : 'circle'
      });
    }
  }
  function sparkle(r, c, color, n) {
    n = Math.max(4, Math.round(n * perfScale()));
    const cx = (c + 0.5) * cell, cy = (r + 0.5) * cell;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 30 + Math.random() * 90;
      particles.push({
        x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0.8, t: 0, size: 3 + Math.random() * 3, color: color, grav: 60, shape: 'star'
      });
    }
  }
  function addFlash(cellPos, color, dur) {
    flashes.push({ cell: cellPos, color: color, dur: dur, t: 0, id: ++flashId });
  }
  function floater(text, r, c, color) {
    floaters.push({
      x: (c + 0.5) * cell, y: (r + 0.3) * cell, text: text,
      color: color || '#fff', t: 0, dur: 0.9
    });
  }

  /* ---- 得分与 HUD ---- */
  function addScore(n, r, c) {
    session.score += n;
    if (r != null && c != null) floater('+' + n, r, c, '#ffe066');
  }
  function updateHUD() {
    const s = session;
    const el = function (id) { return document.getElementById(id); };
    el('hud-score').textContent = s.score;
    const movesEl = el('hud-moves-num');
    movesEl.textContent = s.moves;
    movesEl.classList.toggle('low', s.moves <= 5);
    /* 状态镜像:便于自动化测试与调试 */
    canvas.dataset.moves = String(s.moves);
    canvas.dataset.score = String(s.score);
    canvas.dataset.board = JSON.stringify(s.board.grid.map(function (row) {
      return row.map(function (t) {
        if (!t) return '.';
        if (t.ingredient) return 'I';
        if (t.special) return 'S';
        return String(t.c);
      });
    }));
    const obj = el('hud-objective');
    const o = s.cfg.objective;
    if (o.type === 'score') {
      const pct = Math.min(100, Math.round(s.score / o.target * 100));
      obj.innerHTML = '<div class="obj-row">目标 ' + o.target + ' 分</div>' +
        '<div class="obj-bar"><div class="obj-fill" style="width:' + pct + '%"></div></div>';
    } else if (o.type === 'collect') {
      const img = o.item === 'wolf' ? N.Assets.wolfURL() : N.Assets.cakeIngURL();
      obj.innerHTML = '<div class="obj-row">' +
        '<img class="obj-icon" src="' + img + '" alt="">' +
        '<span>' + s.board.collected + ' / ' + o.target + '</span></div>' +
        '<div class="obj-bar"><div class="obj-fill" style="width:' + Math.min(100, Math.round(s.board.collected / o.target * 100)) + '%"></div></div>';
    } else if (o.type === 'both') {
      const img2 = o.item === 'wolf' ? N.Assets.wolfURL() : N.Assets.cakeIngURL();
      const pct = Math.min(100, Math.round(s.score / o.target * 100));
      obj.innerHTML = '<div class="obj-row">' +
        '<img class="obj-icon" src="' + img2 + '" alt="">' +
        '<span>' + s.board.collected + ' / ' + o.count + '</span><span> · ' + s.score + ' / ' + o.target + '分</span></div>' +
        '<div class="obj-bar"><div class="obj-fill" style="width:' + pct + '%"></div></div>';
    } else if (o.type === 'jelly') {
      const left = Board.jellyTotal(s.board);
      const pct = Math.min(100, Math.round((1 - left / o.target) * 100));
      obj.innerHTML = '<div class="obj-row">清除果冻 ' + left + '</div>' +
        '<div class="obj-bar"><div class="obj-fill" style="width:' + pct + '%"></div></div>';
    } else {
      obj.innerHTML = '<div class="obj-row">无尽模式 · 冲击高分</div>';
    }
    /* 目标玩法提示条 */
    const tip = el('obj-tip');
    if (tip) {
      if (o.type === 'collect' && s.board.collected < o.target) {
        tip.style.display = 'block';
        tip.textContent = o.item === 'wolf'
          ? '💡 消除灰太狼下方的棋子,让它掉落到棋盘底部出口!'
          : '💡 消除蛋糕下方的棋子,让它掉落到棋盘底部出口!';
      } else if (o.type === 'jelly' && Board.jellyTotal(s.board) > 0) {
        tip.style.display = 'block';
        tip.textContent = '💡 消除覆盖果冻的棋子,清完所有果冻过关!';
      } else {
        tip.style.display = 'none';
      }
    }
    renderBoosterBar();
  }

  function renderBoosterBar() {
    const bar = document.getElementById('booster-bar');
    const s = session;
    bar.innerHTML = '';
    const tip = document.getElementById('booster-mode-tip');
    const activeInfo = s.activeBooster ? N.Store.BOOSTERS.find(function (b) { return b.key === s.activeBooster; }) : null;
    if (tip) {
      if (activeInfo) {
        tip.style.display = 'block';
        tip.textContent = '👆 点击棋盘格子使用「' + activeInfo.name + '」' + (s.activeBooster === 'pan' ? '(清除一整行)' : s.activeBooster === 'cake' ? '(消除同色)' : s.activeBooster === 'bomb' ? '(3×3 爆炸)' : '(敲碎目标)') + ',再点一次道具按钮取消';
      } else {
        tip.style.display = 'none';
      }
    }
    let totalEquipped = 0;
    N.Store.BOOSTERS.forEach(function (b) {
      const count = s.boosters[b.key] || 0;
      totalEquipped += count;
      const btn = document.createElement('button');
      btn.className = 'boost-btn' + (s.activeBooster === b.key ? ' active' : '') + (count <= 0 ? ' empty' : '');
      btn.innerHTML = '<img src="' + N.Assets.boosterIconURL(b.key) + '" alt="' + b.name + '">' +
        '<span class="boost-count">' + count + '</span>';
      btn.title = b.name + ':' + b.desc;
      btn.addEventListener('click', function (e) { e.stopPropagation(); onBoosterTap(b.key); });
      bar.appendChild(btn);
    });
    if (totalEquipped === 0) {
      const hint = document.createElement('div');
      hint.className = 'boost-empty-hint';
      hint.textContent = '未携带道具:开局前在准备界面点选道具卡即可携带(最多 3 个)';
      bar.appendChild(hint);
    }
  }

  /* ---- 目标判断 ---- */
  function isWin() {
    const o = session.cfg.objective;
    if (o.type === 'score') return session.score >= o.target;
    if (o.type === 'collect') return session.board.collected >= o.target;
    if (o.type === 'jelly') return Board.jellyTotal(session.board) === 0;
    if (o.type === 'both') return session.score >= o.target && session.board.collected >= o.count;
    return false;
  }

  /* ---- 特殊交换种子 ---- */
  function specialSwapSeeds(a, b) {
    const g = session.board.grid;
    const ta = g[a.r][a.c], tb = g[b.r][b.c];
    const sa = ta.special, sb = tb.special;
    const seeds = [];
    if (sa === 'cake' && sb === 'cake') {
      seeds.push(
        { r: a.r, c: a.c, kind: 'special' }, { r: a.r, c: a.c, kind: 'cell' },
        { r: b.r, c: b.c, kind: 'special' }, { r: b.r, c: b.c, kind: 'cell' },
        { kind: 'all' }
      );
    } else if (sa === 'cake' && sb) {
      seeds.push(
        { r: a.r, c: a.c, kind: 'special', preferColor: tb.c >= 0 ? tb.c : null },
        { r: a.r, c: a.c, kind: 'cell' },
        { r: b.r, c: b.c, kind: 'cell' }
      );
    } else if (sb === 'cake' && sa) {
      seeds.push(
        { r: b.r, c: b.c, kind: 'special', preferColor: ta.c >= 0 ? ta.c : null },
        { r: b.r, c: b.c, kind: 'cell' },
        { r: a.r, c: a.c, kind: 'cell' }
      );
    } else {
      seeds.push({ r: a.r, c: a.c, kind: 'cell' }, { r: b.r, c: b.c, kind: 'cell' });
    }
    return seeds;
  }

  /* ---- 动画序列 ---- */
  async function animateSwapTiles(a, b, dur) {
    const g = session.board.grid;
    const va = visualByTile(g[a.r][a.c]), vb = visualByTile(g[b.r][b.c]);
    const d = dur || 300;
    const tasks = [];
    if (va) tasks.push(tweenObj(va, { x: b.c, y: b.r }, d, easeInOutQuad));
    if (vb) tasks.push(tweenObj(vb, { x: a.c, y: a.r }, d, easeInOutQuad));
    await Promise.all(tasks);
  }

  async function animateMatch(res) {
    tr('MATCH 消除 ' + res.destroyed.length + ' 格');
    for (const cellPos of res.destroyed) {
      const v = visualAt(cellPos[0], cellPos[1]);
      if (!v) { tr('  KILLMISS 格' + cellPos[0] + ',' + cellPos[1] + ' 无视觉'); continue; }
      const color = v.tile.c >= 0 ? N.Assets.colorOf(v.tile.c) : '#fff';
      tr('  消除格' + cellPos[0] + ',' + cellPos[1] + ' → 视觉#' + v.tile.id);
      killVisual(v);
      burst(cellPos[0], cellPos[1], color, 10);
      addFlash(cellPos, 'rgba(255,255,230,0.45)', 0.22);
    }
    for (const s of res.spawns) {
      const t = session.board.grid[s.r][s.c];
      const v = { tile: t, x: s.c, y: s.r, scale: 0.2, alpha: 1, dying: false };
      session.visuals.push(v);
      tr('  ADD特殊 格' + s.r + ',' + s.c + ' 新棋子#' + t.id);
      tweenObj(v, { scale: 1 }, 320, easeOutBack);
      floater(s.type === 'pan' ? '平底锅!' : s.type === 'cake' ? '青草蛋糕!' : '羊角爆竹!', s.r, s.c, '#fff');
      addFlash([s.r, s.c], 'rgba(255,255,255,0.85)', 0.35);
      /* 特殊棋子首见提示 */
      if (!N.Store.tutSeen('tutSpecial')) {
        N.Store.markTutSeen('tutSpecial');
        N.UI.toast('特殊棋子诞生!把它和任意棋子交换,就能发动大招!');
      }
    }
    await delay(260);
  }

  async function animateExplosion(ex) {
    tr('EXPLOSION 消除 ' + ex.destroyed.length + ' 格');
    for (const cellPos of ex.destroyed) {
      const v = visualAt(cellPos[0], cellPos[1]);
      if (!v) { tr('  KILLMISS 格' + cellPos[0] + ',' + cellPos[1] + ' 无视觉'); continue; }
      const color = v.tile.c >= 0 ? N.Assets.colorOf(v.tile.c) : '#fff';
      tr('  爆炸格' + cellPos[0] + ',' + cellPos[1] + ' → 视觉#' + v.tile.id);
      killVisual(v);
      burst(cellPos[0], cellPos[1], color, 12);
      addFlash(cellPos, 'rgba(255,190,110,0.55)', 0.3);
    }
    await delay(260);
  }

  async function animateGravity(ev) {
    tr('GRAVITY 下落 ' + ev.falls.length + ' 补充 ' + ev.fills.length);
    for (const f of ev.falls) {
      const v = visualByTile(f.tile);
      if (v) {
        tr('  FALL #' + f.tile.id + ' ' + f.from[0] + ',' + f.from[1] + '→' + f.to[0] + ',' + f.to[1]);
        tweenObj(v, { x: f.to[1], y: f.to[0] }, 280, easeInQuad);
      } else {
        tr('  FALLMISS #' + f.tile.id + ' 无视觉');
      }
    }
    for (const f of ev.fills) {
      const v = { tile: f.tile, x: f.to[1], y: f.fromAbove ? -1.4 : f.to[0] - 1.6, scale: 1, alpha: 1, dying: false };
      session.visuals.push(v);
      tr('  ADDFILL 格' + f.to[0] + ',' + f.to[1] + ' 新棋子#' + f.tile.id);
      tweenObj(v, { y: f.to[0] }, 280, easeInQuad);
    }
    await delay(300);
  }

  async function animateCollect(got) {
    for (const g of got) {
      const v = visualAt(g.r, g.c);
      if (v) {
        v.dying = true;
        tweenObj(v, { y: ROWS + 0.8, alpha: 0.2 }, 360, easeInQuad, function () {
          const i = session.visuals.indexOf(v);
          if (i >= 0) session.visuals.splice(i, 1);
        });
      }
      sparkle(g.r, g.c, '#ffd24a', 10);
      addFlash([g.r, g.c], 'rgba(255,210,90,0.6)', 0.35);
    }
    await delay(380);
  }

  /* ---- 连消主循环 ---- */
  async function resolveCascades() {
    let idx = 0;
    let activity = true;
    while (activity) {
      activity = false;
      /* 1. 收集到达底部的收集物 */
      const got = Board.collectBottom(session.board);
      if (got.length) {
        activity = true;
        addScore(got.length * 500);
        N.Audio.sfx.collect();
        await animateCollect(got);
        updateHUD();
        if (session.tutorial && session.tutorial.kind === 'collect') finishMechTutorial('collect');
      }
      /* 2. 消除 */
      const groups = Board.findMatches(session.board);
      if (groups.length) {
        activity = true;
        idx++;
        if (idx >= 2) {
          floater('连击 ×' + idx, 4, 4, '#ffd24a');
          N.Audio.sfx.match(idx - 1);
        }
        const res = Board.applyMatch(session.board, groups);
        addScore(res.destroyed.length * 10 * idx);
        if (res.spawns.length) addScore(res.spawns.length * 40);
        if (res.iceBroken) { addScore(res.iceBroken * 20); N.Audio.sfx.ice(); }
        if (res.chainBroken) { addScore(res.chainBroken * 30); N.Audio.sfx.chain(); }
        if (res.vineBroken) { addScore(res.vineBroken * 30); N.Audio.sfx.chain(); }
        if (res.jellyCleared) {
          addScore(res.jellyCleared * 10);
          if (session.tutorial && session.tutorial.kind === 'jelly') finishMechTutorial('jelly');
        }
        await animateMatch(res);
        if (res.triggered.length) {
          const ex = Board.resolveExplosions(session.board, res.triggered.map(function (t) {
            return { r: t.r, c: t.c, kind: 'special' };
          }));
          addScore(ex.destroyed.length * 10 * idx + ex.triggered.length * 60);
          if (ex.iceBroken) { addScore(ex.iceBroken * 20); N.Audio.sfx.ice(); }
          if (ex.chainBroken) { addScore(ex.chainBroken * 30); N.Audio.sfx.chain(); }
          if (ex.vineBroken) { addScore(ex.vineBroken * 30); N.Audio.sfx.chain(); }
          if (ex.jellyCleared) {
            addScore(ex.jellyCleared * 10);
            if (session.tutorial && session.tutorial.kind === 'jelly') finishMechTutorial('jelly');
          }
          N.Audio.sfx.special();
          await animateExplosion(ex);
        }
        await runGravity();
      } else if (got.length) {
        /* 只收集没消除:仍要填充棋盘,不能留下空洞 */
        await runGravity();
      }
      updateHUD();
      if (isWin()) { endGame(true); return; }
      if (session.moves <= 0) { endGame(false); return; }
    }
    if (!Board.findPossibleMove(session.board)) {
      N.Audio.sfx.shuffle();
      await delay(250);
      Board.shuffle(session.board);
      rebuildVisuals();
      session.visuals.forEach(function (v) { v.scale = 0.3; tweenObj(v, { scale: 1 }, 300, easeOutBack); });
      N.UI.toast('棋盘太乱啦,重新洗牌!');
      await delay(320);
    }
    reconcileVisuals();
    session.state = 'idle';
  }

  async function runGravity() {
    const ev = Board.gravityAndFill(session.board);
    if (ev.falls.length || ev.fills.length) {
      await animateGravity(ev);
      /* 停顿一拍,让玩家看清掉落后再进行下一轮连消 */
      await delay(160);
    }
  }

  /* ---- 交换 ---- */
  function swapModel(a, b) {
    const g = session.board.grid;
    const t = g[a.r][a.c];
    g[a.r][a.c] = g[b.r][b.c];
    g[b.r][b.c] = t;
  }

  async function trySwap(a, b) {
    if (!Board.canSwap(session.board, a, b)) {
      N.Audio.sfx.invalid();
      session.selected = { r: b.r, c: b.c };
      return;
    }
    session.state = 'anim';
    session.selected = null;
    session.hint = null;
    const ta = session.board.grid[a.r][a.c], tb = session.board.grid[b.r][b.c];
    tr('SWAPSTART');
    swapModel(a, b);
    await animateSwapTiles(a, b);
    tr('SWAPEND');
    if (ta.special || tb.special) {
      session.moves--;
      finishTutorial();
      N.Audio.sfx.special();
      await delay(220);
      const ex = Board.resolveExplosions(session.board, specialSwapSeeds(a, b));
      addScore(ex.destroyed.length * 10 + ex.triggered.length * 60);
      if (ex.iceBroken) { addScore(ex.iceBroken * 20); N.Audio.sfx.ice(); }
      if (ex.chainBroken) { addScore(ex.chainBroken * 30); N.Audio.sfx.chain(); }
      if (ex.vineBroken) { addScore(ex.vineBroken * 30); N.Audio.sfx.chain(); }
      if (ex.jellyCleared) addScore(ex.jellyCleared * 10);
      await animateExplosion(ex);
      updateHUD();
      await resolveCascades();
      return;
    }
    if (Board.matchAt(session.board, a.r, a.c) || Board.matchAt(session.board, b.r, b.c)) {
      session.moves--;
      finishTutorial();
      N.Audio.sfx.swap();
      updateHUD();
      tr('MATCHWAIT');
      await delay(220);
      await resolveCascades();
    } else {
      N.Audio.sfx.invalid();
      swapModel(a, b);
      await animateSwapTiles(a, b, 200);
      session.state = 'idle';
    }
  }

  /* ---- 道具 ---- */
  function onBoosterTap(key) {
    const s = session;
    if (s.state !== 'idle') return;
    N.Audio.sfx.click();
    if (key === 'moves5') {
      if (!N.Store.useBooster(key)) { N.UI.toast('道具不足,去商店看看吧'); return; }
      s.boosters[key] = (s.boosters[key] || 0) - 1;
      s.moves += 5;
      N.Audio.sfx.booster();
      floater('+5 步', 0, 4, '#5BA8E8');
      updateHUD();
      return;
    }
    if (key === 'shuffle') {
      if (!N.Store.useBooster(key)) { N.UI.toast('道具不足,去商店看看吧'); return; }
      s.boosters[key] = (s.boosters[key] || 0) - 1;
      Board.shuffle(s.board);
      rebuildVisuals();
      s.visuals.forEach(function (v) { v.scale = 0.3; tweenObj(v, { scale: 1 }, 300, easeOutBack); });
      N.Audio.sfx.shuffle();
      N.UI.toast('棋盘重新洗牌啦!');
      updateHUD();
      return;
    }
    s.activeBooster = s.activeBooster === key ? null : key;
    s.hoverCell = null;
    renderBoosterBar();
  }

  async function applyBoosterAt(r, c) {
    const s = session;
    const key = s.activeBooster;
    s.activeBooster = null;
    if (!N.Store.useBooster(key)) { N.UI.toast('道具不足'); renderBoosterBar(); return; }
    s.boosters[key] = (s.boosters[key] || 0) - 1;
    N.Audio.sfx.booster();
    const seeds = [];
    const t = s.board.grid[r][c];
    if (key === 'hammer') {
      seeds.push({ r: r, c: c, kind: 'cell' });
    } else if (key === 'pan') {
      for (let cc = 0; cc < COLS; cc++) seeds.push({ r: r, c: cc, kind: 'cell' });
    } else if (key === 'cake') {
      seeds.push({ r: r, c: c, kind: 'special', preferColor: (t && t.c >= 0) ? t.c : null });
      seeds.push({ r: r, c: c, kind: 'cell' });
    } else if (key === 'bomb') {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (Board.inBounds(r + dr, c + dc)) seeds.push({ r: r + dr, c: c + dc, kind: 'cell' });
      }
    }
    s.state = 'anim';
    const ex = Board.resolveExplosions(s.board, seeds);
    addScore(ex.destroyed.length * 10 + ex.triggered.length * 60);
    await animateExplosion(ex);
    updateHUD();
    await resolveCascades();
  }

  /* ---- 胜利奖励时间:剩余步数转化为特殊棋子连爆 ---- */
  async function playRewardSequence(count) {
    const s = session;
    const kinds = ['pan', 'bomb', 'cake'];
    for (let i = 0; i < count; i++) {
      let r = -1, c = -1;
      for (let tries = 0; tries < 24; tries++) {
        const rr = Math.floor(Math.random() * ROWS), cc = Math.floor(Math.random() * COLS);
        const t = s.board.grid[rr][cc];
        if (t && !t.ingredient && !t.special) { r = rr; c = cc; break; }
      }
      if (r < 0) break;
      const kind = kinds[i % kinds.length];
      s.board.grid[r][c] = Board.makeTile(s.board.grid[r][c].c, kind);
      const v = { tile: s.board.grid[r][c], x: c, y: r, scale: 0.2, alpha: 1, dying: false };
      s.visuals.push(v);
      tweenObj(v, { scale: 1 }, 250, easeOutBack);
      addFlash([r, c], 'rgba(255,255,255,0.85)', 0.3);
      floater('奖励!', r, c, '#ffd24a');
      N.Audio.sfx.reward();
      await delay(300);
      const ex = Board.resolveExplosions(s.board, [{ r: r, c: c, kind: 'cell' }]);
      addScore(ex.destroyed.length * 20 + ex.triggered.length * 60);
      await animateExplosion(ex);
      const ev = Board.gravityAndFill(s.board);
      if (ev.falls.length || ev.fills.length) await animateGravity(ev);
      updateHUD();
    }
    floater('奖励时间!', 4, 4, '#ffd24a');
    await delay(500);
  }

  /* ---- 结束 ---- */
  async function endGame(win) {
    const s = session;
    s.hint = null;
    s.win = win;
    N.Audio.stopMusic();
    let stars = 0, bells = 0;
    if (win && (s.mode === 'level' || s.mode === 'daily')) {
      s.score += s.moves * 200;
      const st = s.cfg.stars;
      stars = 1 + (s.score >= st[1] ? 1 : 0) + (s.score >= st[2] ? 1 : 0);
      bells = 10 + stars * 5 + Math.min(20, Math.floor(s.score / 2000));
      if (s.mode === 'level') {
        N.Store.setStars(s.cfg.id, stars);
        N.Store.clearFails(s.cfg.id);
      } else {
        N.Store.setDailyBest(N.Levels.todayKey(), s.score);
      }
      N.Store.addBells(bells);
      N.Audio.sfx.star(0);
      setTimeout(function () { N.Audio.sfx.star(1); }, 300);
      setTimeout(function () { N.Audio.sfx.star(2); }, 600);
    } else if (s.mode === 'endless') {
      stars = 1 + (s.score >= 8000 ? 1 : 0) + (s.score >= 15000 ? 1 : 0);
      bells = Math.min(30, Math.floor(s.score / 1500));
      N.Store.setEndlessBest(s.score);
      N.Store.addBells(bells);
      N.Audio.sfx.star(0);
    } else {
      N.Audio.sfx.lose();
      /* 难度保护:连续失败 3 次,村长送一个加步器 */
      if (s.mode === 'level') {
        N.Store.addFail(s.cfg.id);
        if (N.Store.failCount(s.cfg.id) >= 3) {
          N.Store.clearFails(s.cfg.id);
          N.Store.addBooster('moves5', 1);
          N.UI.toast('村长心疼大家,送来了一个加步器!');
        }
      }
    }
    updateHUD();
    /* 胜利奖励时间 */
    if (win && s.mode === 'level' && s.moves > 0) {
      s.state = 'reward';
      await playRewardSequence(Math.min(s.moves, 8));
    }
    s.state = 'over';
    reconcileVisuals();
    setTimeout(function () {
      N.UI.showResult({
        mode: s.mode,
        win: s.mode === 'endless' ? null : win,
        score: s.score,
        stars: stars,
        bells: bells,
        cfg: s.cfg,
        best: s.mode === 'endless' ? N.Store.get().endlessBest : (s.mode === 'daily' ? N.Store.dailyBest(N.Levels.todayKey()) : null),
        canResume: s.mode === 'level' && !win && N.Store.get().bells >= 30
      });
    }, win ? 600 : 700);
  }

  /* ---- 输入 ---- */
  function cellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * COLS;
    const y = (e.clientY - rect.top) / rect.height * ROWS;
    return { r: Math.floor(y), c: Math.floor(x) };
  }

  function onPointerDown(e) {
    e.preventDefault();
    N.Audio.resume();
    N.Audio.ensure();
    const s = session;
    if (!s || s.state !== 'idle') return;
    s.lastInput = performance.now();
    const p = cellFromEvent(e);
    if (p.r < 0 || p.r >= ROWS || p.c < 0 || p.c >= COLS) return;
    const t = s.board.grid[p.r][p.c];
    s.dragStart = { r: p.r, c: p.c };
    if (s.activeBooster) {
      applyBoosterAt(p.r, p.c);
      renderBoosterBar();
      return;
    }
    if (!t || t.ingredient) { s.selected = null; return; }
    if (s.selected) {
      const a = s.selected;
      const dist = Math.abs(a.r - p.r) + Math.abs(a.c - p.c);
      if (dist === 0) { s.selected = null; N.Audio.sfx.click(); }
      else if (dist === 1) { trySwap(a, p); }
      else { s.selected = { r: p.r, c: p.c }; N.Audio.sfx.select(); }
    } else {
      s.selected = { r: p.r, c: p.c };
      N.Audio.sfx.select();
    }
  }

  function onPointerUp() {
    if (session) session.dragStart = null;
  }

  function onPointerMove(e) {
    const s = session;
    if (!s) return;
    const p = cellFromEvent(e);
    if (p.r >= 0 && p.r < ROWS && p.c >= 0 && p.c < COLS) s.hoverCell = p; else s.hoverCell = null;
    /* 拖动交换:按住滑到相邻格子立即触发 */
    if (s.dragStart && s.state === 'idle' && !s.activeBooster && s.selected) {
      const a = s.selected;
      const dist = Math.abs(a.r - p.r) + Math.abs(a.c - p.c);
      if (dist === 1 && !(s.dragStart.r === p.r && s.dragStart.c === p.c)) {
        s.dragStart = null;
        trySwap(a, p);
      }
    }
  }

  /* ---- 绘制 ---- */
  function drawVisual(v, lift, size) {
    let x = (v.x + 0.5) * cell, y = (v.y + 0.5) * cell;
    let s = size * (v.scale || 1);
    if (lift) {
      /* 浮起效果:轻微放大 + 投影 + 上移,让交换动画清晰可见 */
      s *= 1.1;
      ctx.beginPath();
      ctx.ellipse(x, y + cell * 0.32, s * 0.44, s * 0.15, 0, 0, 7);
      ctx.fillStyle = 'rgba(40,40,28,0.3)';
      ctx.fill();
      y -= cell * 0.08;
    }
    ctx.globalAlpha = v.alpha == null ? 1 : v.alpha;
    ctx.drawImage(iconFor(v.tile), x - s / 2, y - s / 2, s, s);
    if (v.tile.ice > 0) ctx.drawImage(N.Assets.img(N.Assets.iceURL()), x - s / 2, y - s / 2, s, s);
    if (v.tile.chain) ctx.drawImage(N.Assets.img(N.Assets.chainURL()), x - s / 2, y - s / 2, s, s);
    if (v.tile.vine) ctx.drawImage(N.Assets.img(N.Assets.vineURL()), x - s / 2, y - s / 2, s, s);
    ctx.globalAlpha = 1;
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, W);
    rr(0, 0, W, W, 12);
    ctx.fillStyle = '#c9e6b5';
    ctx.fill();
    /* 格子 */
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      rr(c * cell + 2, r * cell + 2, cell - 4, cell - 4, 10);
      ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(255,255,255,0.34)' : 'rgba(255,255,255,0.2)';
      ctx.fill();
    }
    /* 果冻 */
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const j = session.board.jelly[r][c];
      if (j <= 0) continue;
      rr(c * cell + 3, r * cell + 3, cell - 6, cell - 6, 10);
      ctx.fillStyle = j >= 2 ? 'rgba(255,96,160,0.6)' : 'rgba(255,150,200,0.45)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(c * cell + cell * 0.32, r * cell + cell * 0.35, cell * 0.09, 0, 7);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();
    }
    /* 收集出口箭头 */
    if (session.cfg.ingredient) {
      const pulse = 0.45 + 0.35 * Math.sin(now / 260);
      ctx.strokeStyle = 'rgba(255,180,60,' + pulse.toFixed(3) + ')';
      ctx.lineWidth = Math.max(3, cell * 0.08);
      ctx.lineCap = 'round';
      for (const col of session.cfg.spawnCols) {
        const x = (col + 0.5) * cell, y = (ROWS - 0.62) * cell;
        ctx.beginPath();
        ctx.moveTo(x - cell * 0.18, y - cell * 0.1);
        ctx.lineTo(x, y + cell * 0.1);
        ctx.lineTo(x + cell * 0.18, y - cell * 0.1);
        ctx.stroke();
      }
    }
    /* 棋子(滑动中的棋子最后绘制,浮在其它棋子之上;选中棋子同样浮起) */
    const size = cell * 0.9;
    const selTile = session.selected ? session.board.grid[session.selected.r][session.selected.c] : null;
    const moving = [];
    for (const v of session.visuals) {
      const isMoving = Math.abs(v.x - Math.round(v.x)) > 0.03 ||
        Math.abs(v.y - Math.round(v.y)) > 0.03 ||
        Math.abs((v.scale || 1) - 1) > 0.03 ||
        (selTile && v.tile === selTile);
      if (isMoving) { moving.push(v); continue; }
      drawVisual(v, false, size);
    }
    for (const v of moving) drawVisual(v, true, size);
    /* 选中与提示 */
    if (session.selected) {
      const pulse = 0.55 + 0.4 * Math.sin(now / 180);
      drawCellOutline(session.selected.r, session.selected.c, 'rgba(255,220,80,' + pulse.toFixed(3) + ')', 5);
      drawCellOutline(session.selected.r, session.selected.c, 'rgba(255,255,255,0.95)', 2.5);
    }
    if (session.hint && !session.activeBooster && !session.tutorial) {
      const pulse = 0.35 + 0.3 * Math.sin(now / 240);
      drawCellOutline(session.hint[0].r, session.hint[0].c, 'rgba(255,230,80,' + pulse.toFixed(3) + ')', 3);
      drawCellOutline(session.hint[1].r, session.hint[1].c, 'rgba(255,230,80,' + pulse.toFixed(3) + ')', 3);
    }
    /* 新手引导与机制引导 */
    if (session.tutorial && session.tutorial.cells && session.state === 'idle') {
      const pulse = 0.55 + 0.4 * Math.sin(now / 220);
      if (session.tutorial.kind === 'swap') {
        const a = session.tutorial.cells[0], b = session.tutorial.cells[1];
        if (a && b) {
          drawCellOutline(a.r, a.c, 'rgba(255,240,120,' + pulse.toFixed(3) + ')', 4);
          drawCellOutline(b.r, b.c, 'rgba(255,240,120,' + pulse.toFixed(3) + ')', 4);
          const x1 = (a.c + 0.5) * cell, y1 = (a.r + 0.5) * cell;
          const x2 = (b.c + 0.5) * cell, y2 = (b.r + 0.5) * cell;
          const dx = x2 - x1, dy = y2 - y1;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len, uy = dy / len;
          const sx = x1 + ux * cell * 0.45, sy = y1 + uy * cell * 0.45;
          const ex = x2 - ux * cell * 0.45, ey = y2 - uy * cell * 0.45;
          ctx.strokeStyle = 'rgba(255,235,120,' + pulse.toFixed(3) + ')';
          ctx.lineWidth = Math.max(4, cell * 0.09);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
          const ah = cell * 0.18;
          const ang = Math.atan2(uy, ux);
          ctx.fillStyle = 'rgba(255,235,120,' + pulse.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - ah * Math.cos(ang - 0.45), ey - ah * Math.sin(ang - 0.45));
          ctx.lineTo(ex - ah * Math.cos(ang + 0.45), ey - ah * Math.sin(ang + 0.45));
          ctx.closePath();
          ctx.fill();
        }
      } else {
        for (const t of session.tutorial.cells) {
          drawCellOutline(t.r, t.c, 'rgba(255,240,120,' + pulse.toFixed(3) + ')', 4.5);
        }
        if (session.tutorial.kind === 'collect') {
          /* 指向底部出口的下落箭头 */
          const cols = {};
          for (const t of session.tutorial.cells) cols[t.c] = true;
          ctx.strokeStyle = 'rgba(255,210,90,' + pulse.toFixed(3) + ')';
          ctx.lineWidth = Math.max(4, cell * 0.1);
          ctx.lineCap = 'round';
          for (const cc in cols) {
            const c = parseInt(cc, 10);
            const x = (c + 0.5) * cell;
            const y0 = (session.tutorial.cells[0].r + 1.2) * cell;
            const y1 = (ROWS - 0.35) * cell;
            ctx.beginPath();
            ctx.moveTo(x, Math.min(y0, y1 - cell * 0.3));
            ctx.lineTo(x, y1);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x - cell * 0.16, y1 - cell * 0.14);
            ctx.lineTo(x, y1);
            ctx.lineTo(x + cell * 0.16, y1 - cell * 0.14);
            ctx.stroke();
          }
        }
      }
    }
    if (session.activeBooster && session.hoverCell) {
      drawCellOutline(session.hoverCell.r, session.hoverCell.c, 'rgba(255,120,80,0.9)', 3);
    }
    /* 闪光 */
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      f.t += 0.016;
      const a = Math.max(0, 1 - f.t / f.dur);
      rr(f.cell[1] * cell + 2, f.cell[0] * cell + 2, cell - 4, cell - 4, 10);
      ctx.fillStyle = f.color;
      ctx.globalAlpha = a;
      ctx.fill();
      ctx.globalAlpha = 1;
      if (a <= 0) flashes.splice(i, 1);
    }
    /* 粒子 */
    const dt = 0.016;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.t >= p.life) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = 1 - p.t / p.life;
      ctx.fillStyle = p.color;
      if (p.shape === 'star') {
        ctx.beginPath();
        const r1 = p.size * 1.8, r2 = p.size * 0.7;
        for (let k = 0; k < 10; k++) {
          const rr2 = k % 2 === 0 ? r1 : r2;
          const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
          if (k === 0) ctx.moveTo(p.x + Math.cos(a) * rr2, p.y + Math.sin(a) * rr2);
          else ctx.lineTo(p.x + Math.cos(a) * rr2, p.y + Math.sin(a) * rr2);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, 7);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    /* 飘字 */
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.t += dt;
      const a = 1 - f.t / f.dur;
      const y = f.y - f.t * 40;
      ctx.globalAlpha = Math.max(0, a);
      ctx.font = 'bold ' + Math.round(cell * 0.32) + 'px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(60,40,0,0.55)';
      ctx.strokeText(f.text, f.x, y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, y);
      ctx.globalAlpha = 1;
      if (f.t >= f.dur) floaters.splice(i, 1);
    }
  }

  function drawCellOutline(r, c, color, lw) {
    const x = c * cell, y = r * cell;
    rr(x + lw / 2, y + lw / 2, cell - lw, cell - lw, 12);
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.stroke();
  }

  function loop() {
    const now = performance.now();
    updateTweens(now);
    if (!session || session.state === 'over') return;
    /* 页面隐藏时只推进动画,不绘制(省电) */
    if (document.hidden) return;
    if (session.state === 'idle' && !session.activeBooster) {
      if (session.tutorial) {
        /* 引导期间持续刷新建议格 */
        session.tutorial.timer += 33;
        if (session.tutorial.timer > 1200) {
          session.tutorial.timer = 0;
          const cells = tutorialCells(session.board, session.tutorial.kind);
          if (cells) session.tutorial.cells = cells;
        }
      } else if (session.mode === 'level') {
        if (performance.now() - session.lastInput > 3500) {
          if (!session.hint) session.hint = Board.findPossibleMove(session.board);
        }
      }
    }
    draw(now);
  }

  function resize() {
    const wrap = canvas.parentElement;
    const availH = window.innerHeight || 800;
    /* 棋盘尺寸自动适配:横屏/矮视口时压缩,始终给 HUD 与道具栏留出空间 */
    const hudSpace = availH < 500 ? 128 : 208;
    const w = Math.max(240, Math.min(wrap.clientWidth || 360, 560, availH - hudSpace));
    canvas.style.width = w + 'px';
    canvas.style.height = w + 'px';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(w * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w;
    cell = w / COLS;
  }

  /* 引导目标格计算 */
  function tutorialCells(board, kind) {
    if (kind === 'swap') {
      const mv = Board.findPossibleMove(board);
      return mv;
    }
    const cells = [];
    if (kind === 'collect') {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const t = board.grid[r][c];
        if (t && t.ingredient) cells.push({ r: r, c: c });
      }
    } else if (kind === 'jelly') {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (board.jelly[r][c] > 0 && cells.length < 6) cells.push({ r: r, c: c });
      }
    }
    return cells.length ? cells : null;
  }

  /* ---- 对外接口 ---- */
  N.Game = {
    init: function () {
      canvas = document.getElementById('board-canvas');
      ctx = canvas.getContext('2d');
      window.addEventListener('resize', resize);
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointercancel', onPointerUp);
      canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      /* setInterval 驱动:页面隐藏时动画照常推进,避免 rAF 停摆 */
      if (!rafId) { lastT = performance.now(); rafId = setInterval(loop, 33); }
    },
    start: function (cfg, mode, equippedBoosters) {
      session = {
        mode: mode,
        cfg: cfg,
        board: null,
        score: 0,
        moves: cfg.moves,
        state: 'idle',
        selected: null,
        dragStart: null,
        activeBooster: null,
        hoverCell: null,
        boosters: equippedBoosters || {},
        visuals: [],
        win: false,
        lastInput: performance.now(),
        hint: null
      };
      session.board = Board.create(cfg);
      Board.generate(session.board);
      rebuildVisuals();
      resize();
      /* 新手引导与机制首见引导 */
      session.tutorial = null;
      const o = cfg.objective || {};
      if (mode === 'level' && cfg.id === 1 && !N.Store.tutorialDone()) {
        session.tutorial = { kind: 'swap', cells: tutorialCells(session.board, 'swap'), timer: 0 };
        N.UI.showTutorialTip('👆 先点一个棋子选中,再点相邻棋子交换;三个相同连成一线就消除!');
      } else if (mode === 'level' && o.type === 'collect' && !N.Store.tutSeen('tutCollect')) {
        session.tutorial = { kind: 'collect', cells: tutorialCells(session.board, 'collect'), timer: 0 };
        N.UI.showTutorialTip('💡 消除灰太狼下方的棋子,让它掉落到棋盘底部出口!');
      } else if (mode === 'level' && o.type === 'jelly' && !N.Store.tutSeen('tutJelly')) {
        session.tutorial = { kind: 'jelly', cells: tutorialCells(session.board, 'jelly'), timer: 0 };
        N.UI.showTutorialTip('💡 消除覆盖果冻的棋子,清完所有果冻就能过关!');
      }
      updateHUD();
      N.Audio.startMusic(cfg.isBoss ? 'boss' : (cfg.chapter >= 5 ? 'boss' : 'normal'));
      N.Game.setPaused(false);
    },
    setPaused: function (p) {
      if (!session) return;
      session.state = p ? 'paused' : 'idle';
    },
    /* 调试/自测接口:执行一次交换(等同玩家点击两个格子) */
    debugSwap: async function (a, b) {
      if (!session || session.state !== 'idle') return false;
      await trySwap(a, b);
      return true;
    },
    /* 失败续命:补充步数并继续对局 */
    resume: function (extraMoves) {
      if (!session) return false;
      session.moves += extraMoves || 0;
      session.state = 'idle';
      session.win = false;
      session.lastInput = performance.now();
      updateHUD();
      N.Audio.startMusic(session.cfg.isBoss ? 'boss' : (session.cfg.chapter >= 5 ? 'boss' : 'normal'));
      return true;
    },
    getSession: function () { return session; },
    /* 自测钩子:强制渲染一帧(验证画布绘制管线) */
    __renderTest: function () {
      if (!session) return false;
      draw(performance.now());
      ctx.fillStyle = '#ff0044';
      ctx.fillRect(5, 5, 20, 20);
      return true;
    },
    resize: resize
  };
})(window.YXXL);

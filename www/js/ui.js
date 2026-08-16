/* 羊村消消乐 - 界面:主菜单/选关/商店/设置/结算/剧情/道具 */
window.YXXL = window.YXXL || {};
(function (N) {
  const CHAR_NAMES = {
    xiyangyang: '喜羊羊', meiyangyang: '美羊羊', lanyangyang: '懒羊羊', feiyangyang: '沸羊羊',
    nuanyangyang: '暖羊羊', jiaotailang: '蕉太狼', xiaohuihui: '小灰灰', manyangyang: '慢羊羊',
    huitailang: '灰太狼', hongtailang: '红太狼'
  };

  function avatarURL(who) {
    if (who === 'huitailang') return N.Assets.wolfHeadURL();
    if (who === 'hongtailang') return N.Assets.redwolfURL();
    const idx = N.Assets.CHAR_IDS.indexOf(who);
    return N.Assets.headURL(idx >= 0 ? idx : 0);
  }

  function $(id) { return document.getElementById(id); }

  function showScreen(id) {
    const screens = document.querySelectorAll('.screen');
    for (const s of screens) s.classList.remove('active');
    const el = $(id);
    if (el) el.classList.add('active');
    window.scrollTo(0, 0);
  }

  function updateBells() {
    const n = N.Store.get().bells;
    const chips = document.querySelectorAll('.bells-chip b');
    for (const c of chips) c.textContent = n;
  }

  /* ---- 主菜单 ---- */
  function initMenu() {
    const strip = $('menu-chars');
    strip.innerHTML = '';
    const ids = N.Assets.CHAR_IDS.concat(['huitailang', 'hongtailang']);
    ids.forEach(function (who, i) {
      const img = document.createElement('img');
      img.src = avatarURL(who);
      img.className = 'menu-char';
      img.style.animationDelay = (i * 0.15) + 's';
      img.title = CHAR_NAMES[who];
      strip.appendChild(img);
    });
    $('btn-levels').addEventListener('click', function () {
      N.Audio.sfx.click(); buildLevels(); showScreen('screen-levels');
    });
    $('btn-endless').addEventListener('click', function () {
      N.Audio.sfx.click(); showPrelevel(N.Levels.ENDLESS, 'endless');
    });
    $('btn-shop').addEventListener('click', function () {
      N.Audio.sfx.click(); buildShop(); showScreen('screen-shop');
    });
    $('btn-settings').addEventListener('click', function () {
      N.Audio.sfx.click(); refreshSettingsUI(); showScreen('screen-settings');
    });
  }

  /* ---- 选关 ---- */
  let currentChapter = 1;

  function buildLevels() {
    const store = N.Store;
    const tabs = $('chapter-tabs');
    tabs.innerHTML = '';
    N.Levels.CHAPTERS.forEach(function (ch) {
      const btn = document.createElement('button');
      const unlocked = store.chapterUnlocked(ch.id);
      btn.className = 'chapter-tab' + (ch.id === currentChapter ? ' active' : '') + (unlocked ? '' : ' locked');
      btn.textContent = unlocked ? ch.name : ch.name + ' 🔒';
      btn.addEventListener('click', function () {
        if (!store.chapterUnlocked(ch.id)) { N.UI.toast('通过前一章的 Boss 关解锁!'); return; }
        N.Audio.sfx.click();
        currentChapter = ch.id;
        buildLevels();
      });
      tabs.appendChild(btn);
    });
    if (!store.chapterUnlocked(currentChapter)) currentChapter = 1;
    const grid = $('level-grid');
    grid.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const id = (currentChapter - 1) * 5 + i;
      const cfg = N.Levels.get(id);
      const unlocked = store.levelUnlocked(id);
      const stars = store.starsFor(id);
      const card = document.createElement('div');
      card.className = 'level-card' + (unlocked ? '' : ' locked') + (cfg.isBoss ? ' boss' : '');
      let starsHtml = '';
      for (let s2 = 1; s2 <= 3; s2++) starsHtml += '<span class="star' + (stars >= s2 ? ' on' : '') + '">★</span>';
      card.innerHTML = '<div class="level-num">' + id + '</div>' +
        '<div class="level-name">' + cfg.name + '</div>' +
        '<div class="level-stars">' + starsHtml + '</div>' +
        (cfg.isBoss ? '<img class="boss-icon" src="' + N.Assets.wolfURL() + '" alt="Boss">' : '');
      card.addEventListener('click', function () {
        if (!unlocked) { N.UI.toast('先通过上一关!'); return; }
        N.Audio.sfx.click();
        openLevel(id);
      });
      grid.appendChild(card);
    }
  }

  /* ---- 进入关卡 ---- */
  function openLevel(id) {
    const cfg = N.Levels.get(id);
    if (!N.Store.introSeen(id)) {
      N.Store.markIntroSeen(id);
      const story = N.Levels.storyForLevelIntro(id);
      if (story) { showStory(story, function () { showPrelevel(cfg, 'level'); }); return; }
    }
    showPrelevel(cfg, 'level');
  }

  /* ---- 关卡前准备 ---- */
  let pending = null;
  let equipped = {};

  function objectiveDesc(cfg) {
    const o = cfg.objective;
    if (o.type === 'score') return '在 ' + cfg.moves + ' 步内获得 ' + o.target + ' 分';
    if (o.type === 'collect') return o.item === 'wolf'
      ? '让 ' + o.target + ' 只灰太狼掉落到棋盘底部出口'
      : '收集 ' + o.target + ' 个青草蛋糕(掉落到棋盘底部)';
    if (o.type === 'jelly') return '清除棋盘上所有果冻(共 ' + o.target + ' 层)';
    return '60 步内冲击最高分!';
  }

  function showPrelevel(cfg, mode) {
    pending = { cfg: cfg, mode: mode };
    equipped = {};
    $('prelevel-title').textContent = mode === 'endless' ? '无尽挑战' : ('第 ' + cfg.id + ' 关 · ' + cfg.name);
    $('prelevel-desc').textContent = objectiveDesc(cfg);
    $('prelevel-meta').textContent = '步数:' + cfg.moves + ' 步' + (cfg.isBoss ? ' · BOSS 关' : '') + (mode === 'endless' ? ' · 历史最高 ' + N.Store.get().endlessBest + ' 分' : '');
    const box = $('prelevel-boosters');
    box.innerHTML = '';
    N.Store.BOOSTERS.forEach(function (b) {
      const owned = N.Store.boosterCount(b.key);
      const card = document.createElement('div');
      card.className = 'equip-card' + (equipped[b.key] ? ' equipped' : '');
      card.innerHTML = '<img src="' + N.Assets.boosterIconURL(b.key) + '" alt=""><div class="equip-name">' + b.name + '</div>' +
        '<div class="equip-count">持有 ' + owned + (equipped[b.key] ? ' · 已带 ' + equipped[b.key] : '') + '</div>';
      card.addEventListener('click', function () {
        const total = Object.keys(equipped).reduce(function (s, k) { return s + equipped[k]; }, 0);
        if (equipped[b.key] >= owned) { N.UI.toast('没有更多了'); return; }
        if (total >= 3) { N.UI.toast('最多携带 3 个道具'); return; }
        N.Audio.sfx.click();
        equipped[b.key] = (equipped[b.key] || 0) + 1;
        showPrelevel(cfg, mode);
      });
      box.appendChild(card);
    });
    $('btn-start-level').onclick = function () {
      N.Audio.sfx.click();
      N.Audio.stopMusic();
      pending = null;
      N.Game.start(cfg, mode, equipped);
      showScreen('screen-game');
    };
    $('btn-prelevel-back').onclick = function () {
      N.Audio.sfx.click();
      pending = null;
      showScreen(mode === 'endless' ? 'screen-menu' : 'screen-levels');
    };
    showScreen('screen-prelevel');
  }

  /* ---- 结算 ---- */
  function showResult(data) {
    const panel = $('result-panel');
    let starsHtml = '';
    for (let i = 1; i <= 3; i++) {
      starsHtml += '<span class="result-star' + (data.stars >= i ? ' on' : '') + '" style="animation-delay:' + (i * 0.25) + 's">★</span>';
    }
    let inner = '';
    if (data.mode === 'level') {
      if (data.win) {
        inner = '<h2 class="result-title win">过关啦!</h2>' +
          '<div class="result-stars">' + starsHtml + '</div>';
        if (data.cfg.isBoss) inner += '<div class="result-boss">' +
          '<img src="' + N.Assets.wolfURL() + '"> 灰太狼被打退啦!</div>';
      } else {
        const taunt = N.Levels.loseTaunt();
        inner = '<h2 class="result-title lose">失败啦…</h2>' +
          '<div class="result-taunt"><img src="' + avatarURL(taunt.who) + '"><div><b>' + CHAR_NAMES[taunt.who] + ':</b>' + taunt.text + '</div></div>';
      }
    } else {
      inner = '<h2 class="result-title win">挑战结束</h2>' +
        '<div class="result-stars">' + starsHtml + '</div>' +
        '<div class="result-best">历史最高:' + data.best + ' 分' +
        (data.score >= data.best && data.score > 0 ? ' (新纪录!)' : '') + '</div>';
    }
    inner += '<div class="result-score">得分 ' + data.score + '</div>';
    if (data.bells > 0) inner += '<div class="result-bells">获得铃铛 ×' + data.bells + '</div>';
    let btns = '';
    if (data.mode === 'level') {
      btns += '<button class="btn btn-primary" id="btn-result-next">' + (data.win ? '下一关' : '再试一次') + '</button>';
      btns += '<button class="btn" id="btn-result-back">返回选关</button>';
    } else {
      btns += '<button class="btn btn-primary" id="btn-result-next">再来一局</button>';
      btns += '<button class="btn" id="btn-result-back">返回主菜单</button>';
    }
    inner += '<div class="result-btns">' + btns + '</div>';
    panel.innerHTML = inner;
    showScreen('screen-result');
    updateBells();
    $('btn-result-next').addEventListener('click', function () {
      N.Audio.sfx.click();
      if (data.mode === 'endless') { showPrelevel(N.Levels.ENDLESS, 'endless'); return; }
      if (data.win && data.cfg.id < N.Levels.total()) {
        const story = N.Levels.storyForClear(data.cfg.id);
        if (story) { showStory(story, function () { openLevel(data.cfg.id + 1); }); return; }
        openLevel(data.cfg.id + 1);
      } else if (data.win) {
        const story = N.Levels.storyForClear(data.cfg.id);
        if (story) { showStory(story, function () { buildLevels(); showScreen('screen-levels'); }); return; }
        buildLevels(); showScreen('screen-levels');
      } else {
        openLevel(data.cfg.id);
      }
    });
    $('btn-result-back').addEventListener('click', function () {
      N.Audio.sfx.click();
      N.Audio.stopMusic();
      if (data.mode === 'level') { buildLevels(); showScreen('screen-levels'); }
      else { showScreen('screen-menu'); N.Audio.startMusic('menu'); }
    });
  }

  /* ---- 商店 ---- */
  function buildShop() {
    const store = N.Store;
    const list = $('shop-list');
    list.innerHTML = '';
    store.BOOSTERS.forEach(function (b) {
      const owned = store.boosterCount(b.key);
      const afford = store.get().bells >= b.price;
      const card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = '<img src="' + N.Assets.boosterIconURL(b.key) + '" alt="">' +
        '<div class="shop-info"><div class="shop-name">' + b.name + '</div>' +
        '<div class="shop-desc">' + b.desc + '</div>' +
        '<div class="shop-bottom"><span class="shop-owned">持有 ' + owned + '</span>' +
        '<button class="btn btn-small ' + (afford ? '' : 'disabled') + '">🔔 ' + b.price + ' 购买</button></div></div>';
      const btn = card.querySelector('button');
      btn.addEventListener('click', function () {
        if (!store.spendBells(b.price)) { N.UI.toast('铃铛不够啦,去闯关赚铃铛吧!'); return; }
        store.addBooster(b.key, 1);
        N.Audio.sfx.coin();
        N.UI.toast('购买成功!');
        buildShop();
        updateBells();
      });
      list.appendChild(card);
    });
    updateBells();
  }

  /* ---- 设置 ---- */
  function refreshSettingsUI() {
    const s = N.Store.get().settings;
    $('set-music').classList.toggle('on', !!s.music);
    $('set-music').textContent = '背景音乐:' + (s.music ? '开' : '关');
    $('set-sfx').classList.toggle('on', !!s.sfx);
    $('set-sfx').textContent = '游戏音效:' + (s.sfx ? '开' : '关');
  }

  function initSettings() {
    $('set-music').addEventListener('click', function () {
      const s = N.Store.get().settings;
      s.music = !s.music;
      N.Store.saveSettings(s);
      N.Audio.setVolumes(s.music, s.sfx);
      if (s.music) N.Audio.startMusic('menu'); else N.Audio.stopMusic();
      N.Audio.sfx.click();
      refreshSettingsUI();
    });
    $('set-sfx').addEventListener('click', function () {
      const s = N.Store.get().settings;
      s.sfx = !s.sfx;
      N.Store.saveSettings(s);
      N.Audio.setVolumes(s.music, s.sfx);
      N.Audio.sfx.click();
      refreshSettingsUI();
    });
    let confirmReset = false;
    $('btn-reset').addEventListener('click', function () {
      if (!confirmReset) {
        confirmReset = true;
        $('btn-reset').textContent = '再点一次确认重置!';
        $('btn-reset').classList.add('danger');
        setTimeout(function () { confirmReset = false; $('btn-reset').textContent = '重置全部进度'; $('btn-reset').classList.remove('danger'); }, 3000);
        return;
      }
      N.Store.reset();
      N.UI.toast('进度已重置');
      refreshSettingsUI();
      updateBells();
      $('btn-reset').textContent = '重置全部进度';
      $('btn-reset').classList.remove('danger');
      confirmReset = false;
    });
    $('btn-settings-back').addEventListener('click', function () {
      N.Audio.sfx.click();
      N.Audio.stopMusic();
      N.Audio.startMusic('menu');
      showScreen('screen-menu');
    });
  }

  /* ---- 剧情对话 ---- */
  function showStory(lines, onDone) {
    if (!lines || !lines.length) { if (onDone) onDone(); return; }
    let idx = 0, charIdx = 0, timer = null, finished = false;
    const avatar = $('story-avatar'), name = $('story-name'), text = $('story-text');
    function renderLine() {
      const line = lines[idx];
      avatar.src = avatarURL(line.who);
      name.textContent = CHAR_NAMES[line.who] || '';
      charIdx = 0;
      text.textContent = '';
      clearInterval(timer);
      timer = setInterval(function () {
        charIdx++;
        text.textContent = line.text.slice(0, charIdx);
        if (charIdx >= line.text.length) clearInterval(timer);
      }, 42);
    }
    function finish() {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      if (onDone) onDone();
    }
    function next() {
      if (finished) return;
      if (charIdx < lines[idx].text.length) {
        clearInterval(timer);
        text.textContent = lines[idx].text;
        charIdx = lines[idx].text.length;
        return;
      }
      idx++;
      if (idx >= lines.length) { finish(); return; }
      renderLine();
    }
    $('story-skip').onclick = function (e) {
      e.stopPropagation();
      finish();
    };
    $('screen-story').onclick = function (e) {
      if (e.target.id === 'story-skip') return;
      N.Audio.sfx.click();
      next();
    };
    renderLine();
    showScreen('screen-story');
  }

  /* ---- 暂停 ---- */
  function showPause() {
    const s = N.Game.getSession();
    if (!s || s.state !== 'idle') return;
    N.Game.setPaused(true);
    showScreen('screen-pause');
  }
  function hidePause() {
    N.Game.setPaused(false);
    const s = N.Game.getSession();
    showScreen('screen-game');
    s.lastInput = performance.now();
  }
  function initPause() {
    $('btn-pause').addEventListener('click', function () { N.Audio.sfx.click(); showPause(); });
    $('btn-resume').addEventListener('click', function () { N.Audio.sfx.click(); hidePause(); });
    $('btn-restart').addEventListener('click', function () {
      N.Audio.sfx.click();
      const s = N.Game.getSession();
      if (!s) return;
      const cfg = s.cfg, mode = s.mode, boosters = s.boosters;
      hidePause();
      N.Game.start(cfg, mode, boosters);
    });
    $('btn-quit').addEventListener('click', function () {
      N.Audio.sfx.click();
      N.Audio.stopMusic();
      const s = N.Game.getSession();
      if (s && s.mode === 'level') { buildLevels(); showScreen('screen-levels'); }
      else { showScreen('screen-menu'); N.Audio.startMusic('menu'); }
    });
  }

  /* ---- 提示气泡 ---- */
  function toast(msg) {
    const wrap = $('toast-wrap');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(function () { el.classList.add('out'); }, 1600);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2000);
  }

  /* ---- 新手引导提示条 ---- */
  function showTutorialTip() {
    const tip = $('tutorial-tip');
    if (tip) tip.style.display = 'flex';
  }
  function hideTutorialTip() {
    const tip = $('tutorial-tip');
    if (tip) tip.style.display = 'none';
  }
  function skipTutorial() {
    hideTutorialTip();
    N.Store.markTutorialDone();
    const s = N.Game.getSession();
    if (s) s.tutorial = null;
  }

  /* ---- 玩法说明 ---- */
  function buildHelp() {
    const A = N.Assets;
    const names = ['喜羊羊', '美羊羊', '懒羊羊', '沸羊羊', '暖羊羊', '蕉太狼', '小灰灰', '慢羊羊'];
    const rows = [];
    function sec(title, html) {
      return '<div class="help-sec"><h3>' + title + '</h3>' + html + '</div>';
    }
    let faces = '';
    for (let i = 0; i < names.length; i++) {
      faces += '<div class="help-item"><img src="' + A.faceURL(i) + '"><span>' + names[i] + '</span></div>';
    }
    rows.push(sec('① 基本玩法', '<p>先点击一个棋子选中,再点击它相邻的棋子交换位置。三个及以上相同的棋子连成一线就会消除得分,上方棋子掉落补齐,连续消除有"连击"加成!</p>' + faces));
    rows.push(sec('② 特殊棋子(大消除)', '<div class="help-item"><img src="' + A.specialURL(0, 'pan') + '"><span>4 个连成一线 → 平底锅:清除整行/整列</span></div>' +
      '<div class="help-item"><img src="' + A.specialURL(0, 'cake') + '"><span>5 个连成一线 → 青草蛋糕:消除全场同色</span></div>' +
      '<div class="help-item"><img src="' + A.specialURL(0, 'bomb') + '"><span>L/T 形交叉 → 羊角爆竹:3×3 爆炸</span></div>' +
      '<p>特殊棋子可以和任意棋子交换触发,两个特殊棋子交换还有组合大招!</p>'));
    rows.push(sec('③ 三种关卡目标', '<div class="help-item"><span class="help-big">🎯</span><span>分数关:步数内达到目标分</span></div>' +
      '<div class="help-item"><img src="' + A.wolfURL() + '"><span>收集关:消除灰太狼/蛋糕下方的棋子,让它掉落到棋盘底部出口</span></div>' +
      '<div class="help-item"><span class="help-big">🍮</span><span>果冻关:消除覆盖果冻的棋子,清完所有果冻</span></div>'));
    rows.push(sec('④ 障碍', '<div class="help-item"><img src="' + A.iceURL() + '"><span>冰层:被冻住的棋子要消除两次才能打碎</span></div>' +
      '<div class="help-item"><img src="' + A.chainURL() + '"><span>锁链:被锁住的棋子不能随便移动,只有交换后能形成消除才行</span></div>'));
    let boost = '';
    N.Store.BOOSTERS.forEach(function (b) {
      boost += '<div class="help-item"><img src="' + A.boosterIconURL(b.key) + '"><span><b>' + b.name + '</b>:' + b.desc + '</span></div>';
    });
    rows.push(sec('⑤ 道具(关卡开始前可携带 3 个)', boost));
    rows.push('<div class="help-tip">过关获得铃铛,可在羊村商店购买更多道具;卡住时等 3 秒,棋盘上会出现黄色箭头提示!</div>');
    $('help-content').innerHTML = rows.join('');
  }

  N.UI = {
    init: function () {
      initMenu();
      initSettings();
      initPause();
      $('btn-back-menu').addEventListener('click', function () {
        N.Audio.sfx.click();
        showScreen('screen-menu');
      });
      $('btn-shop-back').addEventListener('click', function () {
        N.Audio.sfx.click();
        showScreen('screen-menu');
      });
      $('btn-help').addEventListener('click', function () {
        N.Audio.sfx.click();
        buildHelp();
        showScreen('screen-help');
      });
      $('btn-help-back').addEventListener('click', function () {
        N.Audio.sfx.click();
        showScreen('screen-menu');
      });
      $('tutorial-skip').addEventListener('click', function () {
        N.Audio.sfx.click();
        skipTutorial();
      });
      updateBells();
    },
    showScreen: showScreen,
    updateBells: updateBells,
    buildLevels: buildLevels,
    buildShop: buildShop,
    openLevel: openLevel,
    showPrelevel: showPrelevel,
    showResult: showResult,
    showStory: showStory,
    showTutorialTip: showTutorialTip,
    hideTutorialTip: hideTutorialTip,
    toast: toast,
    CHAR_NAMES: CHAR_NAMES,
    avatarURL: avatarURL
  };
})(window.YXXL);

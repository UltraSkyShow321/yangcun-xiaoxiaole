/* 羊村消消乐 - 存档与经济系统 */
window.YXXL = window.YXXL || {};
(function (N) {
  const SAVE_KEY = 'yxxl_save_v1';

  const BOOSTERS = [
    { key: 'hammer', name: '慢羊羊小锤', desc: '敲碎任意一个棋子或障碍', price: 20 },
    { key: 'shuffle', name: '洗牌', desc: '重新排列整个棋盘', price: 15 },
    { key: 'moves5', name: '加步器', desc: '立即增加 5 步', price: 30 },
    { key: 'pan', name: '平底锅', desc: '清除一整行棋子', price: 40 },
    { key: 'cake', name: '青草蛋糕', desc: '消除全场同色棋子', price: 60 },
    { key: 'bomb', name: '羊角爆竹', desc: '引爆 3×3 范围', price: 25 }
  ];

  function defaults() {
    return {
      unlocked: 1,
      stars: {},
      seenIntro: {},
      tutorialDone: false,
      musicPrefSet: false,
      bells: 120,
      boosters: { hammer: 3, shuffle: 2, moves5: 2, pan: 1, cake: 1, bomb: 1 },
      endlessBest: 0,
      settings: { music: false, sfx: true }
    };
  }

  let save = null;

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      save = raw ? Object.assign(defaults(), JSON.parse(raw)) : defaults();
    } catch (e) {
      save = defaults();
    }
    // 兜底:补全新字段
    const d = defaults();
    for (const k in d) if (!(k in save)) save[k] = d[k];
    for (const k in d.boosters) if (!(k in save.boosters)) save.boosters[k] = 0;
    for (const k in d.settings) if (!(k in save.settings)) save.settings[k] = d.settings[k];
    // 迁移:老存档默认开启的背景音乐改为关闭(后续在设置里可手动开启)
    if (!save.musicPrefSet) {
      save.settings.music = false;
      save.musicPrefSet = true;
      persist();
    }
    return save;
  }

  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* 存储不可用时忽略 */ }
  }

  function levelUnlocked(id) {
    if (id <= 1) return true;
    return !!(save.stars[id - 1] && save.stars[id - 1] > 0);
  }

  function chapterUnlocked(ch) {
    if (ch <= 1) return true;
    const bossId = (ch - 1) * 5;
    return !!(save.stars[bossId] && save.stars[bossId] > 0);
  }

  N.Store = {
    BOOSTERS: BOOSTERS,
    get: function () { return save || load(); },
    load: load,
    save: persist,
    reset: function () { save = defaults(); persist(); },
    levelUnlocked: levelUnlocked,
    chapterUnlocked: chapterUnlocked,
    starsFor: function (id) { return save.stars[id] || 0; },
    setStars: function (id, stars) {
      save.stars[id] = Math.max(save.stars[id] || 0, stars);
      if (id === 30) { /* 通关后仍解锁全部 */ }
      persist();
    },
    addBells: function (n) { save.bells += n; persist(); },
    spendBells: function (n) {
      if (save.bells < n) return false;
      save.bells -= n; persist(); return true;
    },
    boosterCount: function (key) { return save.boosters[key] || 0; },
    addBooster: function (key, n) { save.boosters[key] = (save.boosters[key] || 0) + n; persist(); },
    useBooster: function (key) {
      if ((save.boosters[key] || 0) <= 0) return false;
      save.boosters[key]--; persist(); return true;
    },
    setEndlessBest: function (score) {
      if (score > save.endlessBest) { save.endlessBest = score; persist(); }
      return save.endlessBest;
    },
    introSeen: function (id) { return !!save.seenIntro[id]; },
    markIntroSeen: function (id) { save.seenIntro[id] = true; persist(); },
    tutorialDone: function () { return !!save.tutorialDone; },
    markTutorialDone: function () { save.tutorialDone = true; persist(); },
    settings: function () { return save.settings; },
    saveSettings: function (s) { save.settings = s; persist(); }
  };
})(window.YXXL);

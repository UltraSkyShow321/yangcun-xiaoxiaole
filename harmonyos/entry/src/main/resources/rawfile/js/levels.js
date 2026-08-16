/* 羊村消消乐 - 30 关配置 + 章节 + 剧情台词 */
window.YXXL = window.YXXL || {};
(function (N) {
  const CHAPTERS = [
    { id: 1, name: '青青草原' },
    { id: 2, name: '羊村大门' },
    { id: 3, name: '狼堡外围' },
    { id: 4, name: '狼堡内部' },
    { id: 5, name: '森林深处' },
    { id: 6, name: '狼堡之巅' }
  ];

  /* 关卡基础模板 */
  function L(id, name, opts) {
    const isBoss = id % 5 === 0;
    const base = {
      id: id,
      name: name,
      chapter: Math.ceil(id / 5),
      isBoss: isBoss,
      colors: 5,
      moves: 22,
      objective: { type: 'score', target: 1500 },
      stars: [1500, 2600, 4000],
      obstacles: {},
      spawnCols: [0, 4, 8],
      concurrent: 1
    };
    return Object.assign(base, opts);
  }

  function scoreLv(id, name, target, moves, colors, obstacles) {
    return L(id, name, {
      moves: moves, colors: colors,
      objective: { type: 'score', target: target },
      stars: [target, Math.round(target * 1.6), Math.round(target * 2.3)],
      obstacles: obstacles || {}
    });
  }

  function collectLv(id, name, type, target, moves, colors, stars, obstacles, concurrent, spawnCols) {
    return L(id, name, {
      moves: moves, colors: colors,
      objective: { type: 'collect', item: type, target: target },
      stars: stars,
      ingredient: { type: type, target: target },
      concurrent: concurrent || 1,
      spawnCols: spawnCols || [0, 4, 8],
      obstacles: obstacles || {}
    });
  }

  function jellyLv(id, name, rows, doubleRows, moves, colors, stars, obstacles) {
    const target = rows * 9 + (doubleRows || 0) * 9;
    return L(id, name, {
      moves: moves, colors: colors,
      objective: { type: 'jelly', target: target },
      stars: stars,
      obstacles: Object.assign({ jelly: { rows: rows, doubleRows: doubleRows || 0 } }, obstacles || {})
    });
  }

  const LEVELS = [
    scoreLv(1, '初入草原', 1200, 22, 5),
    scoreLv(2, '草地热身', 2500, 22, 5),
    scoreLv(3, '铃铛小试', 4000, 24, 5),
    scoreLv(4, '伙伴集结', 5500, 25, 6),
    collectLv(5, '灰太狼现身!', 'wolf', 2, 30, 5, [3000, 6000, 9000], null, 2, [0, 2, 4, 6, 8]),
    collectLv(6, '冰封之路', 'wolf', 3, 32, 6, [4000, 7500, 11000], { ice: { density: 0.08, layers: 1 } }, 2, [0, 2, 4, 6, 8]),
    scoreLv(7, '破冰先锋', 7000, 24, 6, { ice: { density: 0.12, layers: 1 } }),
    jellyLv(8, '果冻大餐', 2, 0, 32, 6, [6000, 11000, 16000], { ice: { density: 0.06, layers: 1 } }),
    collectLv(9, '狼踪初现', 'wolf', 4, 34, 6, [6000, 11000, 16000], { ice: { density: 0.1, layers: 1 } }, 2, [0, 2, 4, 6, 8]),
    collectLv(10, '冰原追击', 'wolf', 5, 36, 6, [7000, 13000, 19000], { ice: { density: 0.15, layers: 2 } }, 2, [0, 2, 4, 6, 8]),
    scoreLv(11, '狼堡大门', 9000, 26, 7, { ice: { density: 0.08, layers: 1 }, chain: { density: 0.05 } }),
    jellyLv(12, '锁链机关', 3, 0, 38, 6, [8000, 14000, 20000], { chain: { density: 0.06 } }),
    collectLv(13, '狼影重重', 'wolf', 4, 34, 7, [8000, 14000, 20000], { ice: { density: 0.1, layers: 1 } }, 2, [0, 2, 4, 6, 8]),
    collectLv(14, '蛋糕寻踪', 'cake', 3, 34, 6, [8000, 14000, 20000], { chain: { density: 0.04 } }, 2, [0, 2, 4, 6, 8]),
    collectLv(15, '红太狼驾到', 'wolf', 6, 36, 7, [9000, 16000, 23000], { ice: { density: 0.12, layers: 1 }, chain: { density: 0.05 } }, 2, [0, 2, 4, 6, 8]),
    jellyLv(16, '果冻迷宫', 3, 1, 42, 7, [10000, 17000, 24000], { ice: { density: 0.08, layers: 1 } }),
    scoreLv(17, '城堡深院', 12000, 28, 7, { chain: { density: 0.1 } }),
    collectLv(18, '狼群围堵', 'wolf', 5, 36, 7, [10000, 17000, 24000], { ice: { density: 0.12, layers: 1 }, chain: { density: 0.06 } }, 2, [0, 2, 4, 6, 8]),
    collectLv(19, '甜品仓库', 'cake', 4, 36, 7, [10000, 17000, 24000], { ice: { density: 0.08, layers: 1 } }, 2, [0, 2, 4, 6, 8]),
    collectLv(20, '机关重重', 'wolf', 6, 38, 7, [11000, 19000, 27000], { ice: { density: 0.15, layers: 2 }, chain: { density: 0.06 } }, 2, [0, 2, 4, 6, 8]),
    jellyLv(21, '迷雾森林', 4, 0, 44, 8, [13000, 21000, 29000], { ice: { density: 0.08, layers: 1 }, vine: { density: 0.05 } }),
    scoreLv(22, '森林夜行', 15000, 30, 8, { chain: { density: 0.12 } }),
    /* 双目标:分数 + 收集 */
    L(23, '狼嚎山谷', {
      moves: 40, colors: 8,
      objective: { type: 'both', target: 10000, item: 'wolf', count: 4 },
      stars: [13000, 21000, 29000],
      ingredient: { type: 'wolf', target: 5 },
      concurrent: 2, spawnCols: [0, 2, 4, 6, 8],
      obstacles: { ice: { density: 0.1, layers: 1 }, vine: { density: 0.05 } }
    }),
    collectLv(24, '蛋糕大盗', 'cake', 4, 38, 8, [13000, 21000, 29000], { ice: { density: 0.12, layers: 1 }, chain: { density: 0.06 } }, 2, [0, 2, 4, 6, 8]),
    collectLv(25, '蕉太狼的请求', 'wolf', 7, 40, 8, [15000, 24000, 33000], { ice: { density: 0.15, layers: 1 }, chain: { density: 0.08 } }, 2, [0, 2, 4, 6, 8]),
    jellyLv(26, '狼堡之巅', 4, 1, 46, 8, [16000, 25000, 34000], { ice: { density: 0.1, layers: 1 }, vine: { density: 0.06 } }),
    scoreLv(27, '决战前夕', 18000, 36, 8, { ice: { density: 0.12, layers: 1 }, chain: { density: 0.12 } }),
    /* 双目标:分数 + 收集 */
    L(28, '群狼乱舞', {
      moves: 44, colors: 8,
      objective: { type: 'both', target: 10000, item: 'wolf', count: 4 },
      stars: [16000, 25000, 34000],
      ingredient: { type: 'wolf', target: 5 },
      concurrent: 2, spawnCols: [0, 2, 4, 6, 8],
      obstacles: { ice: { density: 0.15, layers: 1 }, chain: { density: 0.08 }, vine: { density: 0.06 } }
    }),
    collectLv(29, '最后的蛋糕', 'cake', 4, 42, 8, [16000, 25000, 34000], { ice: { density: 0.18, layers: 1 }, chain: { density: 0.08 } }, 2, [0, 2, 4, 6, 8]),
    collectLv(30, '决战灰太狼!', 'wolf', 8, 48, 8, [18000, 28000, 38000], { ice: { density: 0.15, layers: 2 }, chain: { density: 0.08 }, vine: { density: 0.06 } }, 2, [0, 2, 4, 6, 8])
  ];

  /* ---- 剧情台词 ---- */
  const STORY = {
    chapterIntro: {
      1: [
        { who: 'lanyangyang', text: '呜哇——！灰太狼把我的青草蛋糕全抢走啦！' },
        { who: 'xiyangyang', text: '别哭啦懒羊羊，我们一起去把蛋糕夺回来！' },
        { who: 'manyangyang', text: '孩子们，出发前先热热身：把三个相同的羊羊头像连成一线，就能消除得分！' }
      ],
      2: [
        { who: 'meiyangyang', text: '咦？草原上怎么结冰了？' },
        { who: 'manyangyang', text: '是灰太狼的冰冻陷阱！冰块里的棋子要消除两次才能打碎哦。' },
        { who: 'lanyangyang', text: '好冷呀……我的蛋糕会不会也被冻住了……' }
      ],
      3: [
        { who: 'nuanyangyang', text: '前面就是狼堡了，大家小心！' },
        { who: 'feiyangyang', text: '哈哈，狼堡大门上的锁链机关就交给我！' },
        { who: 'manyangyang', text: '被锁链锁住的棋子不能随便移动，除非交换后能形成消除。' }
      ],
      4: [
        { who: 'huitailang', text: '嘿嘿，狼堡机关重重，看你们怎么办！' },
        { who: 'xiyangyang', text: '大家团结起来，没有我们过不去的关！' }
      ],
      5: [
        { who: 'manyangyang', text: '穿过这片森林就能追上灰太狼了。森林里地形复杂，多加小心。' },
        { who: 'nuanyangyang', text: '我会照顾好大家的。' }
      ],
      6: [
        { who: 'feiyangyang', text: '狼堡顶层！灰太狼就在前面！' },
        { who: 'huitailang', text: '来得好！这次我要让你们有来无回！' }
      ]
    },
    bossIntro: {
      5: [
        { who: 'huitailang', text: '哈哈哈哈哈！想追上我灰太狼？没门！' },
        { who: 'xiyangyang', text: '灰太狼！把蛋糕还给我们！' },
        { who: 'feiyangyang', text: '跟他废什么话，直接上！' }
      ],
      10: [
        { who: 'huitailang', text: '别以为过了冰原就了不起，我还有更厉害的招！' },
        { who: 'meiyangyang', text: '不管什么招，我们都不会怕的！' }
      ],
      15: [
        { who: 'hongtailang', text: '灰太狼！蛋糕呢？！我数到三——平底锅可不长眼！' },
        { who: 'huitailang', text: '老婆大人息怒！我这就把羊村的蛋糕抢回来……哦不，是还没抢回来！' }
      ],
      20: [
        { who: 'huitailang', text: '可恶……那就尝尝我新发明的终极机关！' },
        { who: 'lanyangyang', text: '怕什么，我们人多！' }
      ],
      25: [
        { who: 'jiaotailang', text: '咩……表哥，你别再干坏事了，把蛋糕还给羊村的朋友们吧！' },
        { who: 'huitailang', text: '蕉太狼你懂什么！这是灰太狼大人的尊严之战！' }
      ],
      30: [
        { who: 'huitailang', text: '这是最后的对决！我绝不会输！' },
        { who: 'xiyangyang', text: '灰太狼，你的计划就到此为止了！' },
        { who: 'feiyangyang', text: '大家一起上——冲啊！' }
      ]
    },
    chapterClear: {
      5: [{ who: 'xiyangyang', text: '第一回合胜利！继续追！' }],
      10: [{ who: 'meiyangyang', text: '穿过了冰原，离狼堡更近啦！' }],
      15: [{ who: 'hongtailang', text: '没用的家伙！……喂，你们别得意，平底锅还没出手呢！' }],
      20: [{ who: 'huitailang', text: '我的机关……！站住，你们给我等着！' }],
      25: [{ who: 'jiaotailang', text: '谢谢你们原谅表哥……我会劝他改好的！' }]
    },
    ending: [
      { who: 'huitailang', text: '可恶的喜羊羊……我还会回来的——！！' },
      { who: 'hongtailang', text: '灰！太！狼！今晚没蛋糕吃！' },
      { who: 'lanyangyang', text: '青草蛋糕真好吃~我们回家吧！' },
      { who: 'xiyangyang', text: '青青草原又恢复和平啦！谢谢大家一起战斗！' },
      { who: 'meiyangyang', text: '这是属于我们羊村的胜利！' }
    ],
    loseTaunts: [
      { who: 'huitailang', text: '哈哈!羊羊们,认输吧!' },
      { who: 'huitailang', text: '就这点本事还想夺回蛋糕?' },
      { who: 'hongtailang', text: '连他们都打不过,灰太狼你晚上别吃饭了!' },
      { who: 'huitailang', text: '我灰太狼大王是无敌的!' },
      { who: 'huitailang', text: '羊村的小鬼们,回家喝青草汁去吧!' },
      { who: 'huitailang', text: '再来一百次,结果也一样!' },
      { who: 'hongtailang', text: '哼!看来今晚的晚餐又没着落了。' },
      { who: 'xiaohuihui', text: '爸爸别笑了,我们一起想办法…' }
    ]
  };

  /* 每日挑战:按日期生成固定种子 */
  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  N.Levels = {
    CHAPTERS: CHAPTERS,
    LEVELS: LEVELS,
    todayKey: todayKey,
    getDaily: function () {
      return {
        id: 0, name: '每日挑战', chapter: 0, isBoss: false,
        colors: 6, moves: 30,
        objective: { type: 'score', target: 12000 },
        obstacles: {}, spawnCols: [], concurrent: 1,
        stars: [12000, 20000, 30000],
        seed: hashStr(todayKey())
      };
    },
    ENDLESS: {
      id: 0, name: '无尽挑战', chapter: 0, isBoss: false,
      colors: 6, moves: 60,
      objective: { type: 'endless' },
      obstacles: {}, spawnCols: [], concurrent: 1,
      stars: [8000, 15000, 25000]
    },
    get: function (id) { return LEVELS[id - 1]; },
    total: function () { return LEVELS.length; },
    storyForLevelIntro: function (id) {
      const cfg = this.get(id);
      if (cfg.isBoss && STORY.bossIntro[id]) return STORY.bossIntro[id];
      if ((id - 1) % 5 === 0 && STORY.chapterIntro[cfg.chapter]) return STORY.chapterIntro[cfg.chapter];
      return null;
    },
    storyForClear: function (id) {
      if (id === 30) return STORY.ending;
      if (id % 5 === 0 && STORY.chapterClear[id]) return STORY.chapterClear[id];
      return null;
    },
    loseTaunt: function () {
      const list = STORY.loseTaunts;
      return list[Math.floor(Math.random() * list.length)];
    }
  };
})(window.YXXL);

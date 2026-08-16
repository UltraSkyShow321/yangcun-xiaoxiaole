/* 羊村消消乐 - 自绘 Q 版素材(原创绘制,贴合原动画形象特征) */
window.YXXL = window.YXXL || {};
(function (N) {
  function svgUrl(inner) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' + inner + '</svg>'
    );
  }

  /* 棋子底板:圆角方块 + 渐变 + 高光 */
  function tile(cA, cB, inner) {
    return svgUrl(
      '<defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + cA + '"/><stop offset="1" stop-color="' + cB + '"/>' +
      '</linearGradient></defs>' +
      '<rect x="4" y="4" width="112" height="112" rx="26" fill="url(#tg)" stroke="' + cB + '" stroke-width="4"/>' +
      '<rect x="13" y="13" width="94" height="94" rx="19" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="3"/>' +
      '<ellipse cx="44" cy="32" rx="28" ry="12" fill="rgba(255,255,255,0.22)"/>' +
      inner
    );
  }

  const EYES = (
    '<ellipse cx="48" cy="62" rx="7.5" ry="9.5" fill="#2b2320"/>' +
    '<circle cx="50.5" cy="58" r="2.6" fill="#fff"/>' +
    '<ellipse cx="72" cy="62" rx="7.5" ry="9.5" fill="#2b2320"/>' +
    '<circle cx="69.5" cy="58" r="2.6" fill="#fff"/>'
  );
  const LASHES = (
    '<path d="M37 55 l-4 -6 M35 60 l-6 -2 M37 65 l-4 6" stroke="#5a4636" stroke-width="2" stroke-linecap="round" fill="none"/>' +
    '<path d="M83 55 l4 -6 M85 60 l6 -2 M83 65 l4 6" stroke="#5a4636" stroke-width="2" stroke-linecap="round" fill="none"/>'
  );
  const MOUTH = '<path d="M54 76 Q60 81 66 76" stroke="#6b5240" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  const BLUSH = '<ellipse cx="36" cy="72" rx="6" ry="4" fill="#ffb8c8" opacity="0.75"/>' +
    '<ellipse cx="84" cy="72" rx="6" ry="4" fill="#ffb8c8" opacity="0.75"/>';

  /* 绵羊头:羊毛云朵 + 脸 + 角/配件 */
  function sheepHead(o) {
    const woolEdge = o.woolEdge || '#e0d8c2';
    return (
      (o.horns || '') +
      '<circle cx="60" cy="58" r="37" fill="' + o.wool + '" stroke="' + woolEdge + '" stroke-width="2.5"/>' +
      '<circle cx="33" cy="42" r="23" fill="' + o.wool + '" stroke="' + woolEdge + '" stroke-width="2.5"/>' +
      '<circle cx="87" cy="42" r="23" fill="' + o.wool + '" stroke="' + woolEdge + '" stroke-width="2.5"/>' +
      '<circle cx="60" cy="33" r="21" fill="' + o.wool + '" stroke="' + woolEdge + '" stroke-width="2.5"/>' +
      '<circle cx="45" cy="29" r="14" fill="' + o.wool + '" stroke="' + woolEdge + '" stroke-width="2.5"/>' +
      '<circle cx="75" cy="29" r="14" fill="' + o.wool + '" stroke="' + woolEdge + '" stroke-width="2.5"/>' +
      '<ellipse cx="60" cy="66" rx="23" ry="21" fill="' + (o.skin || '#fffaf0') + '" stroke="' + (o.skinEdge || '#e2d6c0') + '" stroke-width="2"/>' +
      (o.eyes || EYES) +
      (o.mouth || MOUTH) +
      (o.acc || '')
    );
  }

  function horns(fill, edge) {
    return (
      '<path d="M40 30 Q22 26 25 6 Q38 16 48 25 Z" fill="' + fill + '" stroke="' + edge + '" stroke-width="2.5"/>' +
      '<path d="M80 30 Q98 26 95 6 Q82 16 72 25 Z" fill="' + fill + '" stroke="' + edge + '" stroke-width="2.5"/>'
    );
  }

  /* 狼头:尖耳 + 吻部 + 獠牙 */
  function wolfHead(o) {
    return (
      '<path d="M28 34 L15 2 L50 17 Z" fill="' + o.fur + '" stroke="' + o.edge + '" stroke-width="3"/>' +
      '<path d="M92 34 L105 2 L70 17 Z" fill="' + o.fur + '" stroke="' + o.edge + '" stroke-width="3"/>' +
      '<path d="M26 28 L19 9 L44 18 Z" fill="' + o.inner + '"/>' +
      '<path d="M94 28 L101 9 L76 18 Z" fill="' + o.inner + '"/>' +
      '<circle cx="60" cy="58" r="37" fill="' + o.fur + '" stroke="' + o.edge + '" stroke-width="3"/>' +
      '<ellipse cx="60" cy="70" rx="19" ry="14" fill="' + o.muzzle + '" stroke="' + o.edge + '" stroke-width="2.5"/>' +
      '<ellipse cx="60" cy="63.5" rx="6.5" ry="4.5" fill="#2c2c34"/>' +
      (o.eyes || '') +
      (o.mouth || '') +
      (o.acc || '')
    );
  }

  const FANGS = '<path d="M51 75 l6 9 6 -9 z" fill="#fff" stroke="#3c3c44" stroke-width="1.5"/>' +
    '<path d="M61 75 l6 9 6 -9 z" fill="#fff" stroke="#3c3c44" stroke-width="1.5"/>';

  /* ---- 8 个消除棋子(头像内容,不含底板) ---- */
  const FACES = {
    /* 喜羊羊:白羊毛 + 浅蓝羊角 + 蓝色铃铛 */
    xiyangyang: function () {
      return sheepHead({
        wool: '#ffffff',
        horns: horns('#a8d8f5', '#6ba8d8'),
        acc:
          '<path d="M44 90 Q60 97 76 90" stroke="#4a90c8" stroke-width="4.5" fill="none"/>' +
          '<circle cx="60" cy="98" r="11" fill="#5ba8e8" stroke="#3a7ab0" stroke-width="2.5"/>' +
          '<path d="M54.5 98 h11" stroke="#2c5f85" stroke-width="3" stroke-linecap="round"/>' +
          '<circle cx="60" cy="103.5" r="2.8" fill="#2c5f85"/>'
      });
    },
    /* 美羊羊:白羊毛 + 粉色大蝴蝶结 + 长睫毛 */
    meiyangyang: function () {
      return sheepHead({
        wool: '#ffffff',
        eyes: EYES + LASHES,
        acc: BLUSH +
          '<g transform="translate(88 24)">' +
          '<path d="M0 0 Q-17 -15 -12 -31 Q4 -18 0 0 Z" fill="#f57fa8" stroke="#c8557e" stroke-width="2.5"/>' +
          '<path d="M0 0 Q17 -15 12 -31 Q-4 -18 0 0 Z" fill="#f57fa8" stroke="#c8557e" stroke-width="2.5"/>' +
          '<circle cx="0" cy="0" r="7" fill="#e0608e" stroke="#c8557e" stroke-width="2.5"/>' +
          '</g>'
      });
    },
    /* 懒羊羊:白羊毛 + 黄色冰激凌卷发 + 睡眼 + 口水 + 围兜 */
    lanyangyang: function () {
      return sheepHead({
        wool: '#ffffff',
        acc:
          '<circle cx="60" cy="26" r="13" fill="#f9d24a" stroke="#d9a92c" stroke-width="2.5"/>' +
          '<circle cx="47" cy="32" r="11" fill="#f9d24a" stroke="#d9a92c" stroke-width="2.5"/>' +
          '<circle cx="73" cy="32" r="11" fill="#f9d24a" stroke="#d9a92c" stroke-width="2.5"/>' +
          '<circle cx="60" cy="36" r="12" fill="#fbe08a" stroke="#d9a92c" stroke-width="2.5"/>' +
          '<path d="M72 78 q7 8 2 14 q-2.5 -4 0 -14" fill="#8fd0f5" stroke="#5ba8e0" stroke-width="1.5"/>' +
          '<path d="M40 88 Q60 98 80 88 L80 98 Q60 108 40 98 Z" fill="#f9d24a" stroke="#d9a92c" stroke-width="2.5"/>',
        eyes:
          '<path d="M40 62 Q48 56 56 62" stroke="#4a3a2a" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
          '<path d="M64 62 Q72 56 80 62" stroke="#4a3a2a" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
      });
    },
    /* 沸羊羊:枣红色羊毛 + 深色羊角 + 红色发带 + 浓眉 */
    feiyangyang: function () {
      return sheepHead({
        wool: '#d97a58', woolEdge: '#b05a3c',
        skin: '#f8e0d0', skinEdge: '#d8b898',
        horns: horns('#8a5a3c', '#6a4028'),
        eyes: EYES +
          '<path d="M36 50 L56 57 M64 57 L84 50" stroke="#5a2c18" stroke-width="4.5" stroke-linecap="round"/>',
        mouth: '<path d="M51 77 Q60 85 69 77" stroke="#6b3a20" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
        acc:
          '<path d="M26 45 Q60 34 94 45 L94 53 Q60 42 26 53 Z" fill="#e23b3b" stroke="#b02a2a" stroke-width="2.5"/>' +
          '<path d="M91 45 q17 -2 12 13 l-10 3 q5 -11 -7 -14" fill="#e23b3b" stroke="#b02a2a" stroke-width="2.5"/>'
      });
    },
    /* 暖羊羊:玫红羊毛 + 紫色羊角 + 蓝色围巾 */
    nuanyangyang: function () {
      return sheepHead({
        wool: '#ef9ab0', woolEdge: '#d07a94',
        skin: '#fff5f0', skinEdge: '#e8c8c0',
        horns: horns('#c9a8e8', '#a07ac8'),
        acc: BLUSH +
          '<path d="M38 86 Q60 96 82 86 L82 96 Q60 106 38 96 Z" fill="#6db8f0" stroke="#4a90c8" stroke-width="2.5"/>' +
          '<rect x="48" y="94" width="14" height="15" rx="7" fill="#6db8f0" stroke="#4a90c8" stroke-width="2.5"/>'
      });
    },
    /* 蕉太狼:橙色狼 + 头顶香蕉 */
    jiaotailang: function () {
      return wolfHead({
        fur: '#f0a04c', edge: '#b86a24', inner: '#f7c078', muzzle: '#f8e0c0',
        eyes: EYES,
        mouth: '<path d="M48 74 Q60 80 72 74" stroke="#6b4020" stroke-width="3" fill="none" stroke-linecap="round"/>' + FANGS,
        acc: '<path d="M47 26 Q60 6 74 20 Q60 30 47 26 Z" fill="#ffe066" stroke="#d9b62c" stroke-width="2.5"/>' +
          '<path d="M46 25 Q40 30 44 30" stroke="#b8860b" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
          '<path d="M75 20 Q81 22 78 27" stroke="#b8860b" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
      });
    },
    /* 小灰灰:浅灰小狼 + 星星眼 + 小獠牙 */
    xiaohuihui: function () {
      return wolfHead({
        fur: '#b8c0c8', edge: '#7f8b96', inner: '#d8dde2', muzzle: '#f0f2f4',
        eyes:
          '<ellipse cx="46" cy="60" rx="9" ry="11" fill="#fff" stroke="#7f8b96" stroke-width="2"/>' +
          '<circle cx="47" cy="62" r="5.5" fill="#2b2320"/>' +
          '<path d="M47 58 l1.5 3 3 1.5 -3 1.5 -1.5 3 -1.5 -3 -3 -1.5 3 -1.5 z" fill="#fff"/>' +
          '<ellipse cx="74" cy="60" rx="9" ry="11" fill="#fff" stroke="#7f8b96" stroke-width="2"/>' +
          '<circle cx="73" cy="62" r="5.5" fill="#2b2320"/>' +
          '<path d="M73 58 l1.5 3 3 1.5 -3 1.5 -1.5 3 -1.5 -3 -3 -1.5 3 -1.5 z" fill="#fff"/>',
        mouth: '<path d="M54 73 Q60 77 66 73" stroke="#5a6670" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
          '<path d="M57 73 l5 7 5 -7 z" fill="#fff" stroke="#5a6670" stroke-width="1.5"/>',
        acc: BLUSH
      });
    },
    /* 慢羊羊:米白羊毛 + 圆眼镜 + 白胡子 + 绿嫩芽 */
    manyangyang: function () {
      return sheepHead({
        wool: '#f2efe8', woolEdge: '#d4cdbc',
        skin: '#fffaf0', skinEdge: '#e0d4c0',
        horns: horns('#cfc9bc', '#a8a090'),
        eyes:
          '<circle cx="46" cy="62" r="11.5" fill="rgba(255,255,255,0.55)" stroke="#4a4638" stroke-width="3"/>' +
          '<circle cx="74" cy="62" r="11.5" fill="rgba(255,255,255,0.55)" stroke="#4a4638" stroke-width="3"/>' +
          '<path d="M57.5 62 h5" stroke="#4a4638" stroke-width="3"/>' +
          '<circle cx="46" cy="63.5" r="2.8" fill="#2b2320"/><circle cx="74" cy="63.5" r="2.8" fill="#2b2320"/>',
        mouth: '<path d="M54 77 Q60 81 66 77" stroke="#6b5a48" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
        acc:
          '<path d="M60 12 Q68 2 78 7 Q70 15 60 12 Z" fill="#6fbf5e" stroke="#4a8f3e" stroke-width="2"/>' +
          '<path d="M60 12 Q53 3 47 8 Q55 15 60 12 Z" fill="#8fd47e" stroke="#4a8f3e" stroke-width="2"/>' +
          '<path d="M60 13 l0 8" stroke="#4a8f3e" stroke-width="2.5"/>' +
          '<path d="M38 82 Q48 95 60 95 Q72 95 82 82 Q72 90 60 90 Q48 90 38 82 Z" fill="#fff" stroke="#d4cdbc" stroke-width="2"/>'
      });
    }
  };

  /* ---- 狼族头像 ---- */
  /* 灰太狼:刀疤 + 邪恶笑容 + 獠牙 */
  function huitailangHead() {
    return wolfHead({
      fur: '#8d949c', edge: '#5f666e', inner: '#b8bec4', muzzle: '#d8dce0',
      eyes:
        '<ellipse cx="45" cy="58" rx="7" ry="8.5" fill="#fff" stroke="#5f666e" stroke-width="2"/>' +
        '<circle cx="45" cy="60" r="3.5" fill="#2b2320"/>' +
        '<ellipse cx="75" cy="58" rx="7" ry="8.5" fill="#fff" stroke="#5f666e" stroke-width="2"/>' +
        '<circle cx="75" cy="60" r="3.5" fill="#2b2320"/>' +
        '<path d="M32 45 L49 50 M35 40 L53 45 M29 50 L47 55" stroke="#3f464e" stroke-width="2.5" stroke-linecap="round"/>' +
        '<path d="M63 50 L82 43 M66 55 L85 48" stroke="#3f464e" stroke-width="3.5" stroke-linecap="round"/>',
      mouth: '<path d="M46 76 Q60 66 74 76" stroke="#3a4046" stroke-width="3" fill="none" stroke-linecap="round"/>' + FANGS,
      acc: '<path d="M46 22 Q43 8 53 15 Q50 23 46 22" fill="#8d949c" stroke="#5f666e" stroke-width="2.5"/>' +
        '<path d="M74 22 Q77 8 67 15 Q70 23 74 22" fill="#8d949c" stroke="#5f666e" stroke-width="2.5"/>'
    });
  }

  /* 红太狼:金色皇冠 + 睫毛 + 红唇 */
  function hongtailangHead() {
    return wolfHead({
      fur: '#e05060', edge: '#a83042', inner: '#f090a0', muzzle: '#f8d8dc',
      eyes:
        '<ellipse cx="45" cy="58" rx="7" ry="8.5" fill="#fff" stroke="#a83042" stroke-width="2"/>' +
        '<circle cx="45" cy="60" r="3.5" fill="#2b2320"/>' +
        '<ellipse cx="75" cy="58" rx="7" ry="8.5" fill="#fff" stroke="#a83042" stroke-width="2"/>' +
        '<circle cx="75" cy="60" r="3.5" fill="#2b2320"/>' + LASHES,
      mouth: '<path d="M54 78 Q60 82 66 78 Q60 87 54 78 Z" fill="#c02838"/>',
      acc: '<path d="M44 22 L48 3 L58 14 L66 3 L72 14 L82 3 L84 24 L44 24 Z" fill="#ffd24a" stroke="#c79a1f" stroke-width="2.5"/>' +
        '<circle cx="52" cy="17" r="2.2" fill="#e23b3b"/><circle cx="66" cy="17" r="2.2" fill="#e23b3b"/><circle cx="78" cy="11" r="2.2" fill="#e23b3b"/>' +
        '<ellipse cx="36" cy="72" rx="6" ry="4" fill="#ffb8c8" opacity="0.75"/><ellipse cx="84" cy="72" rx="6" ry="4" fill="#ffb8c8" opacity="0.75"/>'
    });
  }

  /* ---- 特殊棋子图案 ---- */
  const GLYPHS = {
    pan: '<circle cx="60" cy="66" r="32" fill="#5a5a68" stroke="#3c3c48" stroke-width="4"/>' +
         '<path d="M38 54 Q47 46 58 48" stroke="#9c9caa" stroke-width="5" fill="none" stroke-linecap="round"/>' +
         '<path d="M50 62 L55 47 L61 57 L67 47 L70 62 Z" fill="#ffd24a" stroke="#c79a1f" stroke-width="1.5"/>' +
         '<rect x="88" y="40" width="34" height="13" rx="6.5" transform="rotate(42 88 40)" fill="#e85050" stroke="#a83030" stroke-width="3"/>',
    cake: '<rect x="30" y="62" width="60" height="36" rx="9" fill="#f7e3c8" stroke="#d9b98c" stroke-width="3"/>' +
          '<rect x="30" y="70" width="60" height="9" fill="#ffd9a8"/>' +
          '<path d="M26 62 Q34 46 42 62 Q50 46 58 62 Q66 46 74 62 Q82 46 94 62 Z" fill="#63c05c" stroke="#4a9a46" stroke-width="3"/>' +
          '<circle cx="60" cy="46" r="7.5" fill="#e23b3b" stroke="#a82828" stroke-width="2"/>' +
          '<circle cx="42" cy="58" r="2" fill="#fff"/><circle cx="58" cy="60" r="2" fill="#fff"/><circle cx="76" cy="57" r="2" fill="#fff"/>',
    bomb: '<rect x="40" y="48" width="40" height="46" rx="12" fill="#e23b3b" stroke="#a82828" stroke-width="3.5"/>' +
          '<rect x="40" y="62" width="40" height="10" fill="#ffd24a" stroke="#c79a1f" stroke-width="2"/>' +
          '<path d="M60 48 Q62 36 74 32" stroke="#8a6d3b" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
          '<circle cx="76" cy="30" r="6.5" fill="#ffd24a"/>' +
          '<path d="M76 17 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 z" fill="#ffe680"/>'
  };

  const CHAR_IDS = ['xiyangyang', 'meiyangyang', 'lanyangyang', 'feiyangyang', 'nuanyangyang', 'jiaotailang', 'xiaohuihui', 'manyangyang'];
  /* 底板配色:[亮色, 暗色] */
  const CHAR_TILES = {
    xiyangyang: ['#8fd0f5', '#4a9edc'],
    meiyangyang: ['#f9a8c8', '#d85c98'],
    lanyangyang: ['#f7ce58', '#d9a82c'],
    feiyangyang: ['#e88a62', '#b8512f'],
    nuanyangyang: ['#f09ab0', '#cc5f86'],
    jiaotailang: ['#f2a85c', '#c87028'],
    xiaohuihui: ['#c2ccd4', '#8a9aa6'],
    manyangyang: ['#9ad67e', '#5fae4a']
  };

  const urlCache = {};
  const imgCache = {};

  N.Assets = {
    CHAR_IDS: CHAR_IDS,
    colorOf: function (i) { return CHAR_TILES[CHAR_IDS[i]][0]; },
    /* 棋子版(带底板) */
    faceURL: function (i) {
      const key = CHAR_IDS[i];
      if (!urlCache[key]) {
        const c = CHAR_TILES[key];
        urlCache[key] = tile(c[0], c[1], FACES[key]());
      }
      return urlCache[key];
    },
    /* 头像版(不带底板) */
    headURL: function (i) {
      const key = 'head_' + CHAR_IDS[i];
      if (!urlCache[key]) urlCache[key] = svgUrl(FACES[CHAR_IDS[i]]());
      return urlCache[key];
    },
    wolfURL: function () {
      if (!urlCache.wolf) urlCache.wolf = tile('#9aa2aa', '#666e76', huitailangHead());
      return urlCache.wolf;
    },
    wolfHeadURL: function () {
      if (!urlCache.wolfHead) urlCache.wolfHead = svgUrl(huitailangHead());
      return urlCache.wolfHead;
    },
    redwolfURL: function () {
      if (!urlCache.redwolf) urlCache.redwolf = svgUrl(hongtailangHead());
      return urlCache.redwolf;
    },
    specialURL: function (colorIdx, type) {
      const key = 'sp_' + colorIdx + '_' + type;
      if (!urlCache[key]) {
        const c = CHAR_TILES[CHAR_IDS[colorIdx]];
        urlCache[key] = tile(c[0], c[1], GLYPHS[type]);
      }
      return urlCache[key];
    },
    cakeIngURL: function () {
      if (!urlCache.cakeIng) urlCache.cakeIng = tile('#f7e3c8', '#d9b98c', GLYPHS.cake);
      return urlCache.cakeIng;
    },
    iceURL: function () {
      if (!urlCache.ice) urlCache.ice = svgUrl(
        '<rect x="6" y="6" width="108" height="108" rx="20" fill="rgba(170,220,255,0.5)" stroke="rgba(255,255,255,0.95)" stroke-width="5"/>' +
        '<path d="M30 42 l16 -11 M30 42 l11 17 M68 72 l18 -9 M68 72 l7 15 M38 92 l16 11" stroke="rgba(255,255,255,0.95)" stroke-width="4.5" stroke-linecap="round" fill="none"/>' +
        '<path d="M16 30 Q38 16 60 22" stroke="rgba(255,255,255,0.85)" stroke-width="6" fill="none" stroke-linecap="round"/>'
      );
      return urlCache.ice;
    },
    chainURL: function () {
      if (!urlCache.chain) urlCache.chain = svgUrl(
        '<circle cx="38" cy="42" r="13" fill="none" stroke="#7a828c" stroke-width="6"/>' +
        '<circle cx="82" cy="78" r="13" fill="none" stroke="#7a828c" stroke-width="6"/>' +
        '<rect x="44" y="46" width="34" height="26" rx="5" transform="rotate(45 61 59)" fill="none" stroke="#7a828c" stroke-width="6"/>'
      );
      return urlCache.chain;
    },
    vineURL: function () {
      if (!urlCache.vine) urlCache.vine = svgUrl(
        '<path d="M14 30 Q34 16 54 30 T94 30" fill="none" stroke="#5f9e3e" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M20 52 Q44 38 66 52 T100 52" fill="none" stroke="#4a8f3e" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M14 74 Q36 60 58 74 T94 74" fill="none" stroke="#5f9e3e" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M26 92 Q46 80 68 92" fill="none" stroke="#4a8f3e" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M54 30 q6 -8 12 2 q-6 4 -12 -2" fill="#7dbb5e" stroke="#4a8f3e" stroke-width="3"/>' +
        '<path d="M66 52 q8 -8 14 2 q-7 4 -14 -2" fill="#7dbb5e" stroke="#4a8f3e" stroke-width="3"/>' +
        '<path d="M30 74 q6 -8 12 2 q-6 4 -12 -2" fill="#7dbb5e" stroke="#4a8f3e" stroke-width="3"/>' +
        '<path d="M80 74 q6 -8 12 2 q-6 4 -12 -2" fill="#7dbb5e" stroke="#4a8f3e" stroke-width="3"/>'
      );
      return urlCache.vine;
    },
    boosterIconURL: function (key) {
      if (!urlCache['b_' + key]) {
        const map = {
          hammer: '<rect x="38" y="30" width="18" height="62" rx="8" fill="#b07a3c" stroke="#7a5222" stroke-width="3" transform="rotate(-32 47 61)"/>' +
                  '<rect x="32" y="26" width="58" height="28" rx="9" fill="#8a8a96" stroke="#5a5a66" stroke-width="3" transform="rotate(-32 47 61)"/>',
          shuffle: '<path d="M30 34 a26 26 0 1 1 -10 40" fill="none" stroke="#4a9a46" stroke-width="7" stroke-linecap="round"/>' +
                   '<path d="M12 76 l18 -2 -6 14 z" fill="#4a9a46"/>' +
                   '<path d="M90 86 a26 26 0 1 1 10 -40" fill="none" stroke="#4a9a46" stroke-width="7" stroke-linecap="round"/>' +
                   '<path d="M108 44 l-18 2 6 -14 z" fill="#4a9a46"/>',
          moves5: '<circle cx="60" cy="60" r="46" fill="#5BA8E8" stroke="#3a7ab8" stroke-width="5"/>' +
                  '<text x="60" y="76" text-anchor="middle" font-size="52" font-weight="bold" fill="#fff" font-family="Arial">+5</text>',
          pan: '<circle cx="60" cy="60" r="46" fill="#e8c8a0" stroke="#c79a6b" stroke-width="5"/>' + GLYPHS.pan,
          cake: '<circle cx="60" cy="60" r="46" fill="#e8c8a0" stroke="#c79a6b" stroke-width="5"/>' + GLYPHS.cake,
          bomb: '<circle cx="60" cy="60" r="46" fill="#e8c8a0" stroke="#c79a6b" stroke-width="5"/>' + GLYPHS.bomb
        };
        urlCache['b_' + key] = svgUrl(map[key] || '');
      }
      return urlCache['b_' + key];
    },
    img: function (url) {
      if (!imgCache[url]) {
        const im = new Image();
        im.src = url;
        imgCache[url] = im;
      }
      return imgCache[url];
    },
    preload: function () {
      const urls = [];
      for (let i = 0; i < CHAR_IDS.length; i++) {
        urls.push(this.faceURL(i));
        urls.push(this.headURL(i));
      }
      urls.push(this.wolfURL(), this.wolfHeadURL(), this.redwolfURL(), this.cakeIngURL(), this.iceURL(), this.chainURL(), this.vineURL());
      for (let i = 0; i < CHAR_IDS.length; i++) {
        urls.push(this.specialURL(i, 'pan'), this.specialURL(i, 'cake'), this.specialURL(i, 'bomb'));
      }
      ['hammer', 'shuffle', 'moves5', 'pan', 'cake', 'bomb'].forEach(function (k) { urls.push(N.Assets.boosterIconURL(k)); });
      return Promise.all(urls.map(function (u) {
        return new Promise(function (res) {
          const im = N.Assets.img(u);
          if (im.complete) res(); else { im.onload = res; im.onerror = res; }
        });
      }));
    }
  };
})(window.YXXL);

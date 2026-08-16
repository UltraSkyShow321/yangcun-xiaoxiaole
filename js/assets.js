/* 羊村消消乐 - 自绘 Q 版素材(全部原创 SVG,避免版权问题) */
window.YXXL = window.YXXL || {};
(function (N) {
  function svgUrl(inner) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' + inner + '</svg>'
    );
  }
  function dk(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, Math.round(r * (f || 0.55)));
    g = Math.max(0, Math.round(g * (f || 0.55)));
    b = Math.max(0, Math.round(b * (f || 0.55)));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function lite(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const mix = (v) => Math.min(255, Math.round(v + (255 - v) * 0.55));
    return 'rgb(' + mix(r) + ',' + mix(g) + ',' + mix(b) + ')';
  }

  const EYES = (dark) => (
    '<ellipse cx="45" cy="52" rx="10" ry="12" fill="#fff" stroke="' + dark + '" stroke-width="2.5"/>' +
    '<circle cx="46" cy="55" r="4.5" fill="#33251f"/>' +
    '<circle cx="48" cy="52.5" r="1.8" fill="#fff"/>' +
    '<ellipse cx="75" cy="52" rx="10" ry="12" fill="#fff" stroke="' + dark + '" stroke-width="2.5"/>' +
    '<circle cx="74" cy="55" r="4.5" fill="#33251f"/>' +
    '<circle cx="72" cy="52.5" r="1.8" fill="#fff"/>'
  );
  const MOUTH = (dark) => (
    '<path d="M52 73 Q60 80 68 73" stroke="' + dark + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
  );

  function head(color, acc, opts) {
    opts = opts || {};
    const dark = dk(color);
    const behind = opts.behind || '';
    const eyes = opts.eyes !== undefined ? opts.eyes : EYES(dark);
    const mouth = opts.mouth !== undefined ? opts.mouth : MOUTH(dark);
    return svgUrl(
      behind +
      '<circle cx="60" cy="62" r="52" fill="' + color + '" stroke="' + dark + '" stroke-width="4"/>' +
      '<ellipse cx="44" cy="33" rx="20" ry="9" fill="rgba(255,255,255,0.35)"/>' +
      eyes + mouth + (acc || '')
    );
  }

  const WOLF_EARS = (color, dark, inner) => (
    '<path d="M22 34 L9 2 L47 18 Z" fill="' + color + '" stroke="' + dark + '" stroke-width="3"/>' +
    '<path d="M98 34 L111 2 L73 18 Z" fill="' + color + '" stroke="' + dark + '" stroke-width="3"/>' +
    '<path d="M20 27 L13 9 L37 19 Z" fill="' + inner + '"/>' +
    '<path d="M100 27 L107 9 L83 19 Z" fill="' + inner + '"/>'
  );

  const FACES = {
    xiyangyang: {
      color: '#5BA8E8',
      acc: '<path d="M34 26 Q25 8 44 16 Q35 22 42 32 Z" fill="#fff" stroke="#c9d8e6" stroke-width="2.5"/>' +
           '<path d="M86 26 Q95 8 76 16 Q85 22 78 32 Z" fill="#fff" stroke="#c9d8e6" stroke-width="2.5"/>' +
           '<circle cx="60" cy="91" r="9.5" fill="#FFD24A" stroke="#c79a1f" stroke-width="2.5"/>' +
           '<path d="M55.5 91 h9" stroke="#8a6d12" stroke-width="2.5" stroke-linecap="round"/>' +
           '<circle cx="60" cy="95" r="2.2" fill="#8a6d12"/>'
    },
    meiyangyang: {
      color: '#F38FC0',
      eyes: EYES(dk('#F38FC0')) +
        '<path d="M34 41 l-5 -4 M35 45 l-6 1" stroke="' + dk('#F38FC0') + '" stroke-width="2.5" stroke-linecap="round"/>' +
        '<path d="M86 41 l5 -4 M85 45 l6 1" stroke="' + dk('#F38FC0') + '" stroke-width="2.5" stroke-linecap="round"/>',
      acc: '<path d="M78 18 L62 6 L78 34 Z" fill="#E85D8C" stroke="#b03a62" stroke-width="2.5"/>' +
           '<path d="M78 18 L94 6 L78 34 Z" fill="#E85D8C" stroke="#b03a62" stroke-width="2.5"/>' +
           '<circle cx="78" cy="19" r="6.5" fill="#D24A78" stroke="#b03a62" stroke-width="2.5"/>'
    },
    lanyangyang: {
      color: '#F5C843',
      acc: '<circle cx="60" cy="16" r="11" fill="#F5C843" stroke="' + dk('#F5C843') + '" stroke-width="2.5"/>' +
           '<circle cx="47" cy="22" r="9.5" fill="#F5C843" stroke="' + dk('#F5C843') + '" stroke-width="2.5"/>' +
           '<circle cx="73" cy="22" r="9.5" fill="#F5C843" stroke="' + dk('#F5C843') + '" stroke-width="2.5"/>' +
           '<circle cx="60" cy="26" r="10" fill="#fff8e8" stroke="' + dk('#F5C843') + '" stroke-width="2.5"/>' +
           '<path d="M71 74 q7 9 1 16 q-3 -5 0 -16" fill="#8fd0f5"/>',
      eyes: '<path d="M37 52 Q46 45 55 52" stroke="#7a5c10" stroke-width="4" fill="none" stroke-linecap="round"/>' +
            '<path d="M65 52 Q74 45 83 52" stroke="#7a5c10" stroke-width="4" fill="none" stroke-linecap="round"/>'
    },
    feiyangyang: {
      color: '#E2594C',
      eyes: EYES(dk('#E2594C')) +
        '<path d="M35 41 L56 47 M64 47 L85 41" stroke="#6e1a1a" stroke-width="4.5" stroke-linecap="round"/>',
      mouth: '<path d="M50 71 Q60 82 70 71" stroke="' + dk('#E2594C') + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
      acc: '<path d="M30 40 Q60 30 90 40 L90 47 Q60 37 30 47 Z" fill="#a83232" stroke="#7c2020" stroke-width="2"/>' +
           '<path d="M89 41 q13 0 10 11 l-8 3 q3 -9 -5 -13" fill="#a83232" stroke="#7c2020" stroke-width="2"/>'
    },
    nuanyangyang: {
      color: '#A678DB',
      eyes: EYES(dk('#A678DB')),
      acc: '<ellipse cx="33" cy="66" rx="7" ry="4.5" fill="#f0a8c4" opacity="0.85"/>' +
           '<ellipse cx="87" cy="66" rx="7" ry="4.5" fill="#f0a8c4" opacity="0.85"/>' +
           '<path d="M33 80 Q60 92 87 80 L87 92 Q60 104 33 92 Z" fill="#e05050" stroke="#a83232" stroke-width="2.5"/>' +
           '<rect x="47" y="90" width="13" height="17" rx="6" fill="#e05050" stroke="#a83232" stroke-width="2"/>'
    },
    jiaotailang: {
      color: '#F08C3C',
      behind: WOLF_EARS('#F08C3C', dk('#F08C3C'), '#f7b070'),
      mouth: '<path d="M52 74 Q60 80 68 74" stroke="' + dk('#F08C3C') + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
      acc: '<path d="M51 74 l6 9 6 -9 z" fill="#fff" stroke="' + dk('#F08C3C') + '" stroke-width="1.5"/>' +
           '<path d="M63 74 l6 9 6 -9 z" fill="#fff" stroke="' + dk('#F08C3C') + '" stroke-width="1.5"/>' +
           '<path d="M91 60 Q106 48 100 77 Q88 83 91 60 Z" fill="#ffe066" stroke="#d9b62c" stroke-width="2.5"/>'
    },
    xiaohuihui: {
      color: '#AEB9C4',
      behind: WOLF_EARS('#AEB9C4', dk('#AEB9C4'), '#cfd8e0'),
      eyes: '<ellipse cx="45" cy="52" rx="10" ry="12" fill="#fff" stroke="' + dk('#AEB9C4') + '" stroke-width="2.5"/>' +
            '<circle cx="46" cy="54" r="6" fill="#33251f"/>' +
            '<path d="M46 50 l1.5 3.2 3.2 1.5 -3.2 1.5 -1.5 3.2 -1.5 -3.2 -3.2 -1.5 3.2 -1.5 z" fill="#fff"/>' +
            '<ellipse cx="75" cy="52" rx="10" ry="12" fill="#fff" stroke="' + dk('#AEB9C4') + '" stroke-width="2.5"/>' +
            '<circle cx="74" cy="54" r="6" fill="#33251f"/>' +
            '<path d="M74 50 l1.5 3.2 3.2 1.5 -3.2 1.5 -1.5 3.2 -1.5 -3.2 -3.2 -1.5 3.2 -1.5 z" fill="#fff"/>',
      mouth: '<path d="M53 74 Q60 79 67 74" stroke="' + dk('#AEB9C4') + '" stroke-width="3" fill="none" stroke-linecap="round"/>',
      acc: '<path d="M57 74 l6 9 6 -9 z" fill="#fff" stroke="' + dk('#AEB9C4') + '" stroke-width="1.5"/>'
    },
    manyangyang: {
      color: '#74C465',
      eyes: '<circle cx="45" cy="52" r="12.5" fill="rgba(255,255,255,0.35)" stroke="#4c5c2e" stroke-width="3"/>' +
            '<circle cx="75" cy="52" r="12.5" fill="rgba(255,255,255,0.35)" stroke="#4c5c2e" stroke-width="3"/>' +
            '<path d="M57.5 52 h5" stroke="#4c5c2e" stroke-width="3"/>' +
            '<circle cx="45" cy="54" r="3.2" fill="#33251f"/><circle cx="75" cy="54" r="3.2" fill="#33251f"/>',
      acc: '<path d="M60 8 Q70 0 77 9 Q67 14 60 8 Z" fill="#4f9c3e" stroke="#3a7a2c" stroke-width="2"/>' +
           '<path d="M60 10 l0 6" stroke="#3a7a2c" stroke-width="2.5"/>' +
           '<path d="M36 86 Q60 104 84 86 Q60 96 36 86 Z" fill="#fff" stroke="#d8d8d8" stroke-width="2"/>'
    },
    huitailang: {
      color: '#7F8A94',
      behind: WOLF_EARS('#7F8A94', dk('#7F8A94'), '#a8b2ba'),
      eyes: EYES(dk('#7F8A94')) +
        '<path d="M31 39 L52 46" stroke="#434b52" stroke-width="4.5" stroke-linecap="round"/>',
      mouth: '<path d="M48 76 Q60 66 72 76" stroke="#3a4046" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
      acc: '<path d="M51 75 l6 9 6 -9 z" fill="#fff" stroke="#3a4046" stroke-width="1.5"/>' +
           '<path d="M63 75 l6 9 6 -9 z" fill="#fff" stroke="#3a4046" stroke-width="1.5"/>'
    },
    hongtailang: {
      color: '#D8596B',
      behind: WOLF_EARS('#D8596B', dk('#D8596B'), '#ef9aa8'),
      eyes: EYES(dk('#D8596B')) +
        '<path d="M34 41 l-5 -4 M35 45 l-6 1" stroke="' + dk('#D8596B') + '" stroke-width="2.5" stroke-linecap="round"/>' +
        '<path d="M86 41 l5 -4 M85 45 l6 1" stroke="' + dk('#D8596B') + '" stroke-width="2.5" stroke-linecap="round"/>',
      mouth: '<path d="M53 76 Q60 82 67 76 Q60 88 53 76 Z" fill="#a82828"/>',
      acc: '<path d="M42 22 L48 6 L58 15 L66 6 L72 15 L82 6 L86 24 L42 24 Z" fill="#ffd24a" stroke="#c79a1f" stroke-width="2.5"/>' +
           '<ellipse cx="33" cy="66" rx="7" ry="4.5" fill="#f0a8c4" opacity="0.85"/><ellipse cx="87" cy="66" rx="7" ry="4.5" fill="#f0a8c4" opacity="0.85"/>'
    }
  };

  const GLYPHS = {
    pan: '<circle cx="60" cy="66" r="33" fill="#5a5a68" stroke="#3c3c48" stroke-width="4"/>' +
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

  function specialURL(color, type) {
    return svgUrl(
      '<circle cx="60" cy="60" r="54" fill="' + color + '" stroke="' + dk(color) + '" stroke-width="4"/>' +
      GLYPHS[type]
    );
  }

  const CHAR_IDS = ['xiyangyang', 'meiyangyang', 'lanyangyang', 'feiyangyang', 'nuanyangyang', 'jiaotailang', 'xiaohuihui', 'manyangyang'];

  const urlCache = {};
  const imgCache = {};

  N.Assets = {
    CHAR_IDS: CHAR_IDS,
    colorOf: function (i) { return FACES[CHAR_IDS[i]].color; },
    faceURL: function (i) {
      const key = CHAR_IDS[i];
      if (!urlCache[key]) urlCache[key] = head(FACES[key].color, FACES[key].acc, FACES[key]);
      return urlCache[key];
    },
    wolfURL: function () {
      if (!urlCache.wolf) urlCache.wolf = head(FACES.huitailang.color, FACES.huitailang.acc, FACES.huitailang);
      return urlCache.wolf;
    },
    redwolfURL: function () {
      if (!urlCache.redwolf) urlCache.redwolf = head(FACES.hongtailang.color, FACES.hongtailang.acc, FACES.hongtailang);
      return urlCache.redwolf;
    },
    specialURL: function (colorIdx, type) {
      const key = 'sp_' + colorIdx + '_' + type;
      if (!urlCache[key]) urlCache[key] = specialURL(FACES[CHAR_IDS[colorIdx]].color, type);
      return urlCache[key];
    },
    cakeIngURL: function () {
      if (!urlCache.cakeIng) urlCache.cakeIng = svgUrl(
        '<circle cx="60" cy="60" r="54" fill="#f7e3c8" stroke="' + dk('#f7e3c8') + '" stroke-width="4"/>' + GLYPHS.cake
      );
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
      for (let i = 0; i < CHAR_IDS.length; i++) urls.push(this.faceURL(i));
      urls.push(this.wolfURL(), this.redwolfURL(), this.cakeIngURL(), this.iceURL(), this.chainURL());
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

/* 羊村消消乐 - Web Audio 合成原创音效与音乐(不涉及官方主题曲) */
window.YXXL = window.YXXL || {};
(function (N) {
  let ctx = null, master = null, musicGain = null, sfxGain = null;
  let musicTimer = null, step = 0, nextTime = 0, curTrack = null;
  const settings = { music: true, sfx: true };

  function ensure() {
    if (ctx) return true;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return false; }
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.5; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.9; sfxGain.connect(master);
    return true;
  }
  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

  function tone(o) {
    if (!ctx) return;
    const t0 = o.t == null ? ctx.currentTime : o.t;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, o.slide), t0 + o.dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.3, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    osc.connect(g); g.connect(o.dest || sfxGain);
    osc.start(t0); osc.stop(t0 + o.dur + 0.05);
  }

  let noiseBuf = null;
  function noise(o) {
    if (!ctx) return;
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t0 = o.t == null ? ctx.currentTime : o.t;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = o.filter || 'bandpass'; f.frequency.value = o.freq || 2000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.25, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    src.connect(f); f.connect(g); g.connect(o.dest || sfxGain);
    src.start(t0); src.stop(t0 + o.dur + 0.05);
  }

  const midi = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };

  const SFX = {
    click: function () { if (!settings.sfx) return; tone({ f: 660, dur: 0.06, vol: 0.18, type: 'square' }); },
    select: function () { if (!settings.sfx) return; tone({ f: 880, dur: 0.07, vol: 0.22, type: 'square' }); },
    swap: function () { if (!settings.sfx) return; tone({ f: 500, dur: 0.05, vol: 0.2, type: 'triangle' }); tone({ f: 760, dur: 0.06, vol: 0.2, type: 'triangle', t: ctx ? ctx.currentTime + 0.05 : 0 }); },
    invalid: function () { if (!settings.sfx) return; tone({ f: 170, dur: 0.16, vol: 0.28, type: 'sawtooth', slide: 110 }); },
    match: function (combo) {
      if (!settings.sfx) return;
      const base = 523 * Math.pow(1.12, Math.min(combo || 0, 10));
      tone({ f: base, dur: 0.12, vol: 0.25, type: 'triangle' });
      tone({ f: base * 1.5, dur: 0.14, vol: 0.18, type: 'triangle', t: ctx ? ctx.currentTime + 0.04 : 0 });
    },
    special: function () { if (!settings.sfx) return; tone({ f: 320, dur: 0.28, vol: 0.3, type: 'square', slide: 1250 }); },
    booster: function () { if (!settings.sfx) return; tone({ f: 1046, dur: 0.1, vol: 0.25, type: 'sine' }); tone({ f: 1568, dur: 0.15, vol: 0.2, type: 'sine', t: ctx ? ctx.currentTime + 0.07 : 0 }); },
    collect: function () { if (!settings.sfx) return; tone({ f: 1568, dur: 0.16, vol: 0.25, type: 'sine' }); tone({ f: 2093, dur: 0.2, vol: 0.2, type: 'sine', t: ctx ? ctx.currentTime + 0.08 : 0 }); },
    ice: function () { if (!settings.sfx) return; noise({ dur: 0.12, vol: 0.3, freq: 3200, filter: 'highpass' }); },
    chain: function () { if (!settings.sfx) return; tone({ f: 1250, dur: 0.05, vol: 0.2, type: 'square' }); tone({ f: 900, dur: 0.06, vol: 0.18, type: 'square', t: ctx ? ctx.currentTime + 0.05 : 0 }); },
    star: function (i) { if (!settings.sfx) return; tone({ f: 784 * Math.pow(1.26, i || 0), dur: 0.22, vol: 0.25, type: 'triangle', t: ctx ? ctx.currentTime + (i || 0) * 0.15 : 0 }); },
    coin: function () { if (!settings.sfx) return; tone({ f: 987, dur: 0.09, vol: 0.22, type: 'square' }); tone({ f: 1319, dur: 0.16, vol: 0.22, type: 'square', t: ctx ? ctx.currentTime + 0.08 : 0 }); },
    lose: function () { if (!settings.sfx) return; tone({ f: 392, dur: 0.2, vol: 0.25, type: 'triangle' }); tone({ f: 311, dur: 0.2, vol: 0.25, type: 'triangle', t: ctx ? ctx.currentTime + 0.2 : 0 }); tone({ f: 233, dur: 0.4, vol: 0.25, type: 'triangle', t: ctx ? ctx.currentTime + 0.4 : 0 }); },
    shuffle: function () { if (!settings.sfx) return; for (let i = 0; i < 4; i++) tone({ f: 500 + i * 160, dur: 0.08, vol: 0.18, type: 'square', t: ctx ? ctx.currentTime + i * 0.06 : 0 }); }
  };

  const TRACKS = {
    menu: {
      bpm: 110, bars: 2,
      lead: [
        [76, 2], [79, 2], [81, 2], [79, 2], [76, 2], [72, 2], [74, 2], [0, 2],
        [74, 2], [77, 2], [79, 2], [77, 2], [74, 2], [71, 2], [72, 4]
      ],
      bass: [[48, 8], [57, 8], [53, 8], [55, 8]],
      hat: 4
    },
    normal: {
      bpm: 126, bars: 2,
      lead: [
        [72, 1], [72, 1], [76, 1], [79, 1], [76, 1], [79, 1], [81, 2], [79, 1], [76, 1],
        [72, 1], [74, 1], [76, 1], [74, 1], [0, 2],
        [74, 1], [74, 1], [77, 1], [81, 1], [77, 1], [81, 1], [84, 2], [81, 1], [77, 1],
        [74, 1], [72, 1], [74, 1], [72, 1], [0, 2]
      ],
      bass: [[48, 8], [45, 8], [53, 8], [55, 8]],
      hat: 2
    },
    boss: {
      bpm: 150, bars: 2,
      lead: [
        [69, 2], [72, 2], [76, 2], [72, 2], [69, 2], [72, 2], [77, 2], [76, 2],
        [69, 2], [72, 2], [76, 2], [79, 2], [81, 2], [79, 2], [76, 2], [72, 2]
      ],
      bass: [[45, 2], [45, 2], [45, 2], [45, 2], [48, 2], [48, 2], [48, 2], [48, 2],
             [45, 2], [45, 2], [45, 2], [45, 2], [43, 2], [43, 2], [44, 2], [47, 2]],
      hat: 1
    },
    victory: {
      bpm: 120, bars: 1, once: true,
      lead: [[72, 2], [76, 2], [79, 2], [84, 4], [79, 2], [84, 4], [88, 4]],
      bass: [[48, 8], [55, 8]],
      hat: 0
    }
  };

  function noteOn(track, t, idx) {
    if (!ctx) return;
    const total = track.bars * 16;
    const s = idx % total;
    let pos = 0;
    let done = false;
    for (const [m, len] of track.lead) {
      if (!done && s >= pos && s < pos + len) {
        if (m > 0) tone({ f: midi(m), dur: Math.min(len, 3) * stepDur(track) * 0.9, vol: 0.16, type: 'square', t: t, dest: musicGain });
        done = true;
      }
      pos += len;
    }
    let bpos = 0;
    for (const [m, len] of track.bass) {
      if (s >= bpos && s < bpos + len) {
        if (m > 0) tone({ f: midi(m), dur: len * stepDur(track) * 0.9, vol: 0.14, type: 'triangle', t: t, dest: musicGain });
      }
      bpos += len;
    }
    if (track.hat && s % track.hat === 0) noise({ dur: 0.03, vol: 0.05, freq: 6000, filter: 'highpass', t: t, dest: musicGain });
  }

  function stepDur(track) { return 60 / track.bpm / 4; }

  function startMusic(name) {
    if (!settings.music) return;
    if (!ensure()) return;
    stopMusic();
    curTrack = name;
    const track = TRACKS[name];
    if (!track) return;
    nextTime = ctx.currentTime + 0.06;
    step = 0;
    const lookahead = 0.15;
    musicTimer = setInterval(function () {
      while (nextTime < ctx.currentTime + lookahead) {
        noteOn(track, nextTime, step);
        nextTime += stepDur(track);
        step++;
        if (track.once && step >= track.bars * 16) { stopMusic(); break; }
      }
    }, 40);
  }

  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    curTrack = null;
  }

  N.Audio = {
    ensure: ensure,
    resume: resume,
    sfx: SFX,
    startMusic: startMusic,
    stopMusic: stopMusic,
    setVolumes: function (music, sfx) {
      settings.music = !!music;
      settings.sfx = !!sfx;
      if (!music) stopMusic();
      if (ctx) {
        if (musicGain) musicGain.gain.value = music ? 0.5 : 0;
        if (sfxGain) sfxGain.gain.value = sfx ? 0.9 : 0;
      }
    },
    getSettings: function () { return { music: settings.music, sfx: settings.sfx }; }
  };
})(window.YXXL);

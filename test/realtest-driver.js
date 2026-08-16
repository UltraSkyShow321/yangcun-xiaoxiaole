/* realtest 驱动:在真实页面结构上自动对局,捕获页面错误并校验棋盘一致性 */
(function () {
  var N = window.YXXL;
  var errors = [];
  window.onerror = function (msg, src, line) {
    errors.push('ERR: ' + msg + ' @' + line);
    return false;
  };
  var origError = console.error;
  console.error = function () {
    errors.push('CONSOLE: ' + String(Array.prototype.join.call(arguments, ' ')).slice(0, 200));
    origError.apply(console, arguments);
  };
  var lines = [];
  var logEl = document.getElementById('realtest-log');
  if (!logEl) {
    logEl = document.createElement('div');
    logEl.id = 'realtest-log';
    logEl.style.cssText = 'display:none;position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:99999;background:rgba(20,26,36,0.96);color:#d8e0ea;padding:14px;overflow:auto;font-size:13px;line-height:1.75;white-space:pre-wrap;font-family:Consolas,monospace;';
    document.body.appendChild(logEl);
  }
  function log(msg, ok) {
    lines.push((ok === false ? '❌ ' : (ok === true ? '✅ ' : '· ')) + msg);
    logEl.textContent = lines.join('\n');
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* 棋盘一致性:81 个棋子,每格棋子位置匹配,无空洞 */
  function checkVisuals(s) {
    var problems = [];
    if (s.visuals.length !== 81) problems.push('棋子数量=' + s.visuals.length);
    for (var r = 0; r < 9; r++) for (var c = 0; c < 9; c++) {
      var t = s.board.grid[r][c];
      if (!t) { problems.push('空洞@' + r + ',' + c); continue; }
      var found = false;
      for (var i = 0; i < s.visuals.length; i++) {
        var v = s.visuals[i];
        if (v.tile === t && !v.dying && Math.round(v.x) === c && Math.round(v.y) === r) { found = true; break; }
      }
      if (!found) {
        var where = '丢失';
        for (var j = 0; j < s.visuals.length; j++) {
          var v2 = s.visuals[j];
          if (v2.tile === t) {
            where = '在' + Math.round(v2.x) + ',' + Math.round(v2.y) + (v2.dying ? '(dying)' : '');
            break;
          }
        }
        var who = '空';
        for (var k = 0; k < s.visuals.length; k++) {
          var v3 = s.visuals[k];
          if (!v3.dying && Math.round(v3.x) === c && Math.round(v3.y) === r) {
            var gr = '无对应格子棋子';
            for (var rr = 0; rr < 9; rr++) for (var cc = 0; cc < 9; cc++) {
              if (s.board.grid[rr][cc] === v3.tile) gr = '属于' + rr + ',' + cc;
            }
            who = '被#' + v3.tile.id + '(' + gr + ')占据';
            break;
          }
        }
        problems.push('错位@' + r + ',' + c + '(格子#t' + t.id + where + ',' + who + ')');
      }
    }
    return problems;
  }

  /* 找消除规模最大的步 */
  function runLen(g, r, c, dr, dc) {
    var col = g[r][c].c;
    var n = 1;
    for (var d = 1; d < 9; d++) {
      var rr = r + dr * d, cc = c + dc * d;
      if (rr < 0 || rr > 8 || cc < 0 || cc > 8 || !g[rr][cc] || g[rr][cc].ingredient || g[rr][cc].c !== col) break;
      n++;
    }
    for (var d2 = 1; d2 < 9; d2++) {
      var rr2 = r - dr * d2, cc2 = c - dc * d2;
      if (rr2 < 0 || rr2 > 8 || cc2 < 0 || cc2 > 8 || !g[rr2][cc2] || g[rr2][cc2].ingredient || g[rr2][cc2].c !== col) break;
      n++;
    }
    return n;
  }
  function bestMove(board) {
    var g = board.grid;
    var best = null, bestScore = 0;
    for (var r = 0; r < 9; r++) for (var c = 0; c < 9; c++) {
      var t = g[r][c];
      if (!t || t.ingredient) continue;
      for (var i = 0; i < 2; i++) {
        var nr = r + (i === 0 ? 0 : 1), nc = c + (i === 0 ? 1 : 0);
        if (nr > 8 || nc > 8) continue;
        var tn = g[nr][nc];
        if (!tn || tn.ingredient) continue;
        var tmp = g[r][c];
        g[r][c] = g[nr][nc];
        g[nr][nc] = tmp;
        var h1 = runLen(g, r, c, 0, 1), v1 = runLen(g, r, c, 1, 0);
        var h2 = runLen(g, nr, nc, 0, 1), v2 = runLen(g, nr, nc, 1, 0);
        var score = (h1 >= 3 ? h1 : 0) + (v1 >= 3 ? v1 : 0) + (h2 >= 3 ? h2 : 0) + (v2 >= 3 ? v2 : 0);
        var tmp2 = g[r][c];
        g[r][c] = g[nr][nc];
        g[nr][nc] = tmp2;
        if (score > bestScore) { bestScore = score; best = [{ r: r, c: c }, { r: nr, c: nc }]; }
      }
    }
    return best;
  }
  /* 收集关专用:优先收集物所在列 */
  function collectMove(board) {
    var g = board.grid;
    var w = null;
    for (var r = 0; r < 9; r++) for (var c = 0; c < 9; c++) {
      var t = g[r][c];
      if (t && t.ingredient) { w = { r: r, c: c }; break; }
    }
    var best = null, bestScore = -1;
    for (var r = 0; r < 9; r++) for (var c = 0; c < 9; c++) {
      var t2 = g[r][c];
      if (!t2 || t2.ingredient) continue;
      for (var i = 0; i < 2; i++) {
        var nr = r + (i === 0 ? 0 : 1), nc = c + (i === 0 ? 1 : 0);
        if (nr > 8 || nc > 8) continue;
        var tn = g[nr][nc];
        if (!tn || tn.ingredient) continue;
        if (!(t2.special || tn.special) && !N.Board.swapCreatesMatch(board, r, c, nr, nc)) continue;
        var score = 0;
        if (t2.special || tn.special) score += 12;
        if (w) {
          if (c === w.c && r >= w.r) score += 10;
          if (nc === w.c && nr >= w.r) score += 10;
          if (c === w.c || nc === w.c) score += 3;
        }
        if (score > bestScore) { bestScore = score; best = [{ r: r, c: c }, { r: nr, c: nc }]; }
      }
    }
    return best;
  }

  async function playLevel(cfg, label, moveFn) {
    var errBefore = errors.length;
    N.Game.start(cfg, 'level', {});
    N.UI.showScreen('screen-game');
    await sleep(900);
    var s = N.Game.getSession();
    var guard = 0, problemsTotal = 0, maxAnim = 0;
    /* 渲染冒烟测试:强制渲染一帧,确认画布绘制管线正常(非纯背景色) */
    if (label.indexOf('L1') === 0) {
      var cv = document.getElementById('board-canvas');
      N.Game.__renderTest();
      await sleep(150);
      if (cv) {
        var ctx2 = cv.getContext('2d');
        var w2 = cv.width, h2 = cv.height;
        var d = ctx2.getImageData(0, 0, w2, h2).data;
        var colored = 0, opaque = 0;
        for (var pi = 20; pi < d.length; pi += 160) {
          if (d[pi + 3] > 0) opaque++;
          if (d[pi + 3] > 0 && !(d[pi] === 201 && d[pi + 1] === 230 && d[pi + 2] === 181)) colored++;
        }
        var imgsOk = true;
        for (var ii = 0; ii < N.Assets.CHAR_IDS.length; ii++) {
          var im = N.Assets.img(N.Assets.faceURL(ii));
          if (!im.complete || im.naturalWidth === 0) imgsOk = false;
        }
        var probe = ctx2.getImageData(15, 15, 1, 1).data;
        var tileProbe = ctx2.getImageData(Math.round(40 * 0.5 + 2), Math.round(40 * 0.5 + 2), 1, 1).data;
        log('渲染诊断: 画布' + w2 + 'x' + h2 + ' dpr=' + (window.devicePixelRatio || 1) +
          ' 视觉对象=' + s.visuals.length + ' 图标已加载=' + imgsOk + ' 不透明采样=' + opaque + ' 彩色采样=' + colored +
          ' 红色探针=(' + probe[0] + ',' + probe[1] + ',' + probe[2] + ') 格点=(' + tileProbe[0] + ',' + tileProbe[1] + ',' + tileProbe[2] + ')');
        log('渲染冒烟测试: ' + (colored > 50 ? '通过' : '失败'), colored > 50);
      } else {
        log('渲染冒烟测试: 未找到画布', false);
      }
    }
    while (s.state !== 'over' && guard < 70) {
      guard++;
      if (s.state !== 'idle') { await sleep(350); continue; }
      var p = checkVisuals(s);
      if (p.length) {
        problemsTotal += p.length;
        if (problemsTotal <= 3) {
          log(label + ' 对局中状态异常: ' + p.join(', '), false);
          /* 棋盘全景对照:模型 vs 视觉 */
          var gm = [];
          for (var gr = 0; gr < 9; gr++) {
            var row = [];
            for (var gc = 0; gc < 9; gc++) {
              var gt = s.board.grid[gr][gc];
              row.push(gt ? (gt.ingredient ? 'I' : '#' + gt.id) : '·');
            }
            gm.push(row.join(' '));
          }
          log('模型棋盘:\n' + gm.join('\n'));
          var vm = [];
          for (var vr = 0; vr < 9; vr++) vm.push(new Array(9).fill('·'));
          for (var vi = 0; vi < s.visuals.length; vi++) {
            var vv = s.visuals[vi];
            var rr2 = Math.round(vv.y), cc2 = Math.round(vv.x);
            if (rr2 >= 0 && rr2 < 9 && cc2 >= 0 && cc2 < 9) {
              vm[rr2][cc2] = (vv.tile.ingredient ? 'I' : '#' + vv.tile.id) + (vv.dying ? 'd' : '');
            }
          }
          log('视觉棋盘:\n' + vm.map(function (r) { return r.join(' '); }).join('\n'));
          if (window.__YXXL_TRACE && N.__traceGet) {
            log('---- 视觉追踪(最后' + N.__traceGet().length + '条) ----');
            log(N.__traceGet().map(function (m) { return Math.round(m.t) + ' ' + m.msg; }).join('\n'));
            log('---- 追踪结束 ----');
          }
          log('--- 检测到异常,终止本局 ---');
          return;
        }
      }
      var mv = moveFn(s.board) || N.Board.findPossibleMove(s.board);
      if (!mv) { await sleep(1200); continue; }
      var t0 = Date.now();
      await N.Game.debugSwap({ r: mv[0].r, c: mv[0].c }, { r: mv[1].r, c: mv[1].c });
      maxAnim = Math.max(maxAnim, Date.now() - t0);
      await sleep(120);
    }
    await sleep(1300);
    var p2 = checkVisuals(s);
    var extra = (cfg.objective && cfg.objective.type === 'collect') ? ', 收集=' + s.board.collected + '/' + cfg.objective.target : '';
    if (cfg.objective && cfg.objective.type === 'jelly') extra = ', 果冻剩余=' + N.Board.jellyTotal(s.board);
    log(label + ' 对局结束: 胜利=' + s.win + ', 分数=' + s.score + ', 剩余步=' + s.moves + extra + ', 最长动画' + maxAnim + 'ms');
    log(label + ' 终局棋盘一致性: ' + (p2.length ? p2.join(', ') : '完美无空洞无错位'), p2.length === 0);
    log(label + ' 本局新增页面错误: ' + (errors.length - errBefore), errors.length === errBefore);
    /* 交换动画时序校验:每次交换的滑行时长必须 ≥ 250ms(先交换,再消除) */
    var trList = N.__traceGet();
    var lastStart = -1, seqBad = 0;
    for (var ti = 0; ti < trList.length; ti++) {
      if (trList[ti].msg === 'SWAPSTART') lastStart = trList[ti].t;
      else if (trList[ti].msg === 'SWAPEND' && lastStart >= 0) {
        if (trList[ti].t - lastStart < 250) seqBad++;
        lastStart = -1;
      }
    }
    log(label + ' 交换动画时序(先滑行交换再消除,滑行≥250ms): ' + (seqBad ? seqBad + ' 次过快' : '全部合格'), seqBad === 0);
  }

  async function run() {
    logEl.style.display = 'block';
    log('真实页面结构测试开始(与 index.html 完全一致,含页面错误捕获与棋盘一致性校验)');
    window.__YXXL_TRACE = true;
    N.Store.load();
    N.Game.init();
    N.UI.init();
    await N.Assets.preload();
    await playLevel(N.Levels.get(1), 'L1分数关', bestMove);
    var cfg5 = JSON.parse(JSON.stringify(N.Levels.get(5)));
    cfg5.moves = 60;
    await playLevel(cfg5, 'L5收集关', collectMove);
    var cfg8 = JSON.parse(JSON.stringify(N.Levels.get(8)));
    cfg8.moves = 40;
    await playLevel(cfg8, 'L8果冻关', bestMove);
    var cfg30 = JSON.parse(JSON.stringify(N.Levels.get(30)));
    cfg30.moves = 40;
    await playLevel(cfg30, 'L30终章关(冰+锁+收集)', collectMove);
    log('页面错误汇总: ' + (errors.length ? errors.join(' || ') : '无'));
    log('真实页面完整测试完成', errors.length === 0);
  }
  run().catch(function (e) { log('测试异常: ' + e.message, false); });
})();

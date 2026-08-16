/* 羊村消消乐 - 棋盘核心逻辑(纯逻辑,不含渲染) */
window.YXXL = window.YXXL || {};
(function (N) {
  const ROWS = 9, COLS = 9;
  const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  const ADJ = [[0, 1], [1, 0], [0, -1], [-1, 0]];

  function makeTile(color, special) {
    return { c: color, special: special || null, ice: 0, chain: false, ingredient: null };
  }
  function emptyGrid() {
    const g = [];
    for (let r = 0; r < ROWS; r++) g.push(new Array(COLS).fill(null));
    return g;
  }
  function inBounds(r, c) { return r >= 0 && r < ROWS && c >= 0 && c < COLS; }
  function sameColor(t, col) { return t && !t.ingredient && t.c === col; }
  function countIngredients(board) {
    let n = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = board.grid[r][c];
      if (t && t.ingredient) n++;
    }
    return n;
  }
  function jellyTotal(board) {
    let n = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) n += board.jelly[r][c];
    return n;
  }
  function randColorFor(board, r, c) {
    const n = board.cfg.colors;
    for (let tries = 0; tries < 16; tries++) {
      const col = Math.floor(Math.random() * n);
      if (c >= 2 && sameColor(board.grid[r][c - 1], col) && sameColor(board.grid[r][c - 2], col)) continue;
      if (r >= 2 && sameColor(board.grid[r - 1][c], col) && sameColor(board.grid[r - 2][c], col)) continue;
      return col;
    }
    return Math.floor(Math.random() * n);
  }

  function applyObstacles(board) {
    const obs = board.cfg.obstacles || {};
    const spawnCols = board.cfg.spawnCols || [];
    if (obs.ice && obs.ice.density > 0) {
      const layers = obs.ice.layers || 1;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (spawnCols.indexOf(c) >= 0) continue;
        if (Math.random() < obs.ice.density) board.grid[r][c].ice = layers;
      }
    }
    if (obs.chain && obs.chain.density > 0) {
      for (let r = 1; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (spawnCols.indexOf(c) >= 0) continue;
        if (Math.random() < obs.chain.density) board.grid[r][c].chain = true;
      }
    }
  }

  function applyJelly(board) {
    board.jelly = emptyGrid().map(function (row) { return row.map(function () { return 0; }); });
    const obs = board.cfg.obstacles || {};
    if (!obs.jelly) return;
    const rows = obs.jelly.rows || 0;
    const doubleRows = obs.jelly.doubleRows || 0;
    for (let r = ROWS - rows; r < ROWS; r++) for (let c = 0; c < COLS; c++) board.jelly[r][c] = 1;
    for (let r = ROWS - doubleRows; r < ROWS; r++) for (let c = 0; c < COLS; c++) board.jelly[r][c] = 2;
  }

  function placeInitialIngredient(board) {
    const cols = board.cfg.spawnCols || [0, 4, 8];
    const col = cols[Math.floor(Math.random() * cols.length)];
    const row = (board.cfg.ingredient && board.cfg.ingredient.startRow) || 3;
    board.grid[row][col] = { c: -1, special: null, ice: 0, chain: false, ingredient: board.cfg.ingredient.type };
  }

  function forceMoveableBoard(board) {
    /* 兜底:直接构造一个三连 */
    const r = 1, c = 1;
    const col = Math.floor(Math.random() * board.cfg.colors);
    board.grid[r][c] = makeTile(col);
    board.grid[r][c + 1] = makeTile((col + 1) % board.cfg.colors);
    board.grid[r][c + 2] = makeTile(col);
    board.grid[r + 1][c + 1] = makeTile(col);
  }

  function generate(board, attempts) {
    attempts = attempts || 0;
    board.grid = emptyGrid();
    board.collected = 0;
    board.pendingIngredient = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      board.grid[r][c] = makeTile(randColorFor(board, r, c));
    }
    applyObstacles(board);
    applyJelly(board);
    if (board.cfg.ingredient) {
      board.pendingIngredient = board.cfg.ingredient.target - 1;
      placeInitialIngredient(board);
    }
    if (!findPossibleMove(board)) {
      if (attempts < 10) { generate(board, attempts + 1); return; }
      forceMoveableBoard(board);
    }
  }

  /* ---- 消除检测 ---- */
  function findRuns(board) {
    const runs = [];
    for (let r = 0; r < ROWS; r++) {
      let c = 0;
      while (c < COLS) {
        const t = board.grid[r][c];
        if (!t || t.ingredient) { c++; continue; }
        let c2 = c;
        while (c2 + 1 < COLS) {
          const t2 = board.grid[r][c2 + 1];
          if (t2 && !t2.ingredient && t2.c === t.c) c2++; else break;
        }
        if (c2 - c + 1 >= 3) {
          const cells = [];
          for (let i = c; i <= c2; i++) cells.push([r, i]);
          runs.push({ cells: cells, dir: 'h', len: c2 - c + 1, color: t.c });
        }
        c = c2 + 1;
      }
    }
    for (let c = 0; c < COLS; c++) {
      let r = 0;
      while (r < ROWS) {
        const t = board.grid[r][c];
        if (!t || t.ingredient) { r++; continue; }
        let r2 = r;
        while (r2 + 1 < ROWS) {
          const t2 = board.grid[r2 + 1][c];
          if (t2 && !t2.ingredient && t2.c === t.c) r2++; else break;
        }
        if (r2 - r + 1 >= 3) {
          const cells = [];
          for (let i = r; i <= r2; i++) cells.push([i, c]);
          runs.push({ cells: cells, dir: 'v', len: r2 - r + 1, color: t.c });
        }
        r = r2 + 1;
      }
    }
    return runs;
  }

  function groupRuns(runs) {
    const groups = [];
    const cellMap = new Map();
    const k = function (r, c) { return r * COLS + c; };
    for (const run of runs) {
      const seen = new Set();
      for (const cell of run.cells) {
        const key = k(cell[0], cell[1]);
        if (cellMap.has(key)) seen.add(cellMap.get(key));
      }
      let g;
      if (seen.size === 0) {
        g = { cells: [], hRuns: [], vRuns: [] };
        groups.push(g);
      } else {
        const arr = Array.from(seen);
        g = groups[arr[0]];
        for (let i = 1; i < arr.length; i++) {
          const og = groups[arr[i]];
          if (!og) continue;
          for (const cell of og.cells) {
            g.cells.push(cell);
            cellMap.set(k(cell[0], cell[1]), groups.indexOf(g));
          }
          g.hRuns = g.hRuns.concat(og.hRuns);
          g.vRuns = g.vRuns.concat(og.vRuns);
          groups[arr[i]] = null;
        }
      }
      for (const cell of run.cells) {
        g.cells.push(cell);
        cellMap.set(k(cell[0], cell[1]), groups.indexOf(g));
      }
      (run.dir === 'h' ? g.hRuns : g.vRuns).push(run);
    }
    return groups.filter(Boolean);
  }

  function cellEq(a, b) { return a[0] === b[0] && a[1] === b[1]; }

  function computeSpawn(group) {
    let maxH = 0, maxV = 0;
    for (const run of group.hRuns) maxH = Math.max(maxH, run.len);
    for (const run of group.vRuns) maxV = Math.max(maxV, run.len);
    let type = null;
    if (maxH >= 5 || maxV >= 5) type = 'cake';
    else if (maxH >= 4 || maxV >= 4) type = 'pan';
    else if (maxH >= 3 && maxV >= 3) type = 'bomb';
    if (!type) return { type: null, pos: null };
    let pos = null;
    if (type === 'bomb') {
      outer:
      for (const hr of group.hRuns) {
        for (const vr of group.vRuns) {
          for (const cell of hr.cells) {
            if (vr.cells.some(function (c2) { return cellEq(cell, c2); })) { pos = cell; break outer; }
          }
        }
      }
      if (!pos) {
        let best = null;
        for (const run of group.hRuns.concat(group.vRuns)) if (!best || run.len > best.len) best = run;
        pos = best.cells[Math.floor(best.len / 2)];
      }
    } else {
      let best = null;
      for (const run of group.hRuns.concat(group.vRuns)) if (!best || run.len > best.len) best = run;
      pos = best.cells[Math.floor(best.len / 2)];
    }
    return { type: type, pos: pos };
  }

  function findMatches(board) {
    const groups = groupRuns(findRuns(board));
    return groups.map(function (g) {
      const sp = computeSpawn(g);
      return { cells: g.cells, color: g.hRuns[0] ? g.hRuns[0].color : g.vRuns[0].color, spawn: sp.type, spawnPos: sp.pos };
    });
  }

  /* ---- 消除应用 ---- */
  function applyMatch(board, groups) {
    const destroyed = [];
    const triggered = [];
    const spawns = [];
    let iceBroken = 0, chainBroken = 0, jellyCleared = 0;
    for (const g of groups) {
      for (const cell of g.cells) {
        const r = cell[0], c = cell[1];
        const t = board.grid[r][c];
        if (!t) continue;
        if (t.chain) chainBroken++;
        if (t.ice > 0) {
          iceBroken++;
          t.ice--;
          if (t.ice === 0) destroyed.push([r, c]);
          continue;
        }
        destroyed.push([r, c]);
      }
      if (g.spawn) {
        spawns.push({ r: g.spawnPos[0], c: g.spawnPos[1], type: g.spawn, color: g.color });
      }
    }
    for (const cell of destroyed) {
      const t = board.grid[cell[0]][cell[1]];
      if (t && t.special) triggered.push({ r: cell[0], c: cell[1], special: t.special });
      board.grid[cell[0]][cell[1]] = null;
      if (board.jelly[cell[0]][cell[1]] > 0) { board.jelly[cell[0]][cell[1]]--; jellyCleared++; }
    }
    for (const s of spawns) {
      board.grid[s.r][s.c] = makeTile(s.color, s.type);
    }
    return { destroyed: destroyed, triggered: triggered, spawns: spawns, iceBroken: iceBroken, chainBroken: chainBroken, jellyCleared: jellyCleared };
  }

  /* ---- 爆炸扩散 ---- */
  function mostCommonColor(board) {
    const cnt = {};
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = board.grid[r][c];
      if (t && !t.ingredient && t.c >= 0) cnt[t.c] = (cnt[t.c] || 0) + 1;
    }
    let best = -1, bestN = -1;
    for (const k in cnt) if (cnt[k] > bestN) { bestN = cnt[k]; best = parseInt(k, 10); }
    return best;
  }

  function expandSpecial(board, t, r, c, queue, preferColor) {
    const push = function (rr, cc) {
      if (inBounds(rr, cc)) queue.push({ r: rr, c: cc, kind: 'cell' });
    };
    if (t.special === 'bomb') {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) push(r + dr, c + dc);
    } else if (t.special === 'pan') {
      for (let cc = 0; cc < COLS; cc++) push(r, cc);
      for (let rr = 0; rr < ROWS; rr++) push(rr, c);
    } else if (t.special === 'cake') {
      const col = (preferColor != null && preferColor >= 0) ? preferColor : mostCommonColor(board);
      if (col >= 0) queue.push({ kind: 'color', color: col });
    }
  }

  function resolveExplosions(board, seeds) {
    const destroyed = [];
    const triggered = [];
    const queue = seeds.slice();
    const seen = new Set();
    let iceBroken = 0, chainBroken = 0, jellyCleared = 0;
    const push = function (s) { queue.push(s); };

    while (queue.length) {
      const s = queue.shift();
      const r = s.r, c = s.c;
      if (s.kind === 'color') {
        const key = 'color_' + s.color;
        if (seen.has(key)) continue;
        seen.add(key);
        for (let rr = 0; rr < ROWS; rr++) for (let cc = 0; cc < COLS; cc++) {
          const t = board.grid[rr][cc];
          if (t && !t.ingredient && t.c === s.color) push({ r: rr, c: cc, kind: 'cell' });
        }
        continue;
      }
      if (s.kind === 'all') {
        const key = 'all';
        if (seen.has(key)) continue;
        seen.add(key);
        for (let rr = 0; rr < ROWS; rr++) for (let cc = 0; cc < COLS; cc++) {
          const t = board.grid[rr][cc];
          if (t && !t.ingredient) push({ r: rr, c: cc, kind: 'cell' });
        }
        continue;
      }
      if (!inBounds(r, c)) continue;
      const key = r + ',' + c + ',' + s.kind;
      if (seen.has(key)) continue;
      seen.add(key);
      const t = board.grid[r][c];
      if (!t || t.ingredient) continue;
      if (s.kind === 'special') {
        if (!t.special) continue;
        triggered.push({ r: r, c: c, special: t.special });
        expandSpecial(board, t, r, c, queue, s.preferColor);
        continue;
      }
      /* kind === 'cell' */
      if (t.special && !seen.has(r + ',' + c + ',special')) {
        seen.add(r + ',' + c + ',special');
        triggered.push({ r: r, c: c, special: t.special });
        expandSpecial(board, t, r, c, queue, s.preferColor);
      }
      if (t.ice > 0) {
        iceBroken++;
        t.ice--;
        if (t.ice === 0) {
          if (t.chain) chainBroken++;
          destroyed.push([r, c]);
          if (board.jelly[r][c] > 0) { board.jelly[r][c]--; jellyCleared++; }
          board.grid[r][c] = null;
        }
      } else {
        if (t.chain) chainBroken++;
        destroyed.push([r, c]);
        if (board.jelly[r][c] > 0) { board.jelly[r][c]--; jellyCleared++; }
        board.grid[r][c] = null;
      }
    }
    return { destroyed: destroyed, triggered: triggered, iceBroken: iceBroken, chainBroken: chainBroken, jellyCleared: jellyCleared };
  }

  /* ---- 重力与填充 ---- */
  function gravityAndFill(board) {
    const falls = [], fills = [];
    const cfg = board.cfg;
    let onBoard = countIngredients(board);
    for (let c = 0; c < COLS; c++) {
      let write = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        const t = board.grid[r][c];
        if (t) {
          if (write !== r) {
            board.grid[write][c] = t;
            board.grid[r][c] = null;
            falls.push({ from: [r, c], to: [write, c], tile: t });
          }
          write--;
        }
      }
      const empties = [];
      for (let r = write; r >= 0; r--) empties.push(r);
      if (!empties.length) continue;
      const wantIng = cfg.ingredient && board.pendingIngredient > 0 && onBoard < (cfg.concurrent || 1) && cfg.spawnCols.indexOf(c) >= 0;
      if (wantIng) {
        board.pendingIngredient--;
        onBoard++;
        const top = empties[0];
        const ing = { c: -1, special: null, ice: 0, chain: false, ingredient: cfg.ingredient.type };
        board.grid[top][c] = ing;
        fills.push({ to: [top, c], tile: ing, fromAbove: true });
        for (let i = 1; i < empties.length; i++) {
          const t = makeTile(randColorFor(board, empties[i], c));
          board.grid[empties[i]][c] = t;
          fills.push({ to: [empties[i], c], tile: t });
        }
      } else {
        for (const r of empties) {
          const t = makeTile(randColorFor(board, r, c));
          board.grid[r][c] = t;
          fills.push({ to: [r, c], tile: t });
        }
      }
    }
    return { falls: falls, fills: fills };
  }

  function collectBottom(board) {
    const got = [];
    for (let c = 0; c < COLS; c++) {
      const t = board.grid[ROWS - 1][c];
      if (t && t.ingredient) {
        got.push({ r: ROWS - 1, c: c, type: t.ingredient });
        board.grid[ROWS - 1][c] = null;
        board.collected++;
      }
    }
    return got;
  }

  /* ---- 可行步检测 ---- */
  function runLen(board, r, c, dr, dc) {
    const t = board.grid[r][c];
    if (!t || t.ingredient) return 0;
    let len = 1;
    for (let d = 1; d < 10; d++) {
      const rr = r + dr * d, cc = c + dc * d;
      if (inBounds(rr, cc) && sameColor(board.grid[rr][cc], t.c)) len++; else break;
    }
    for (let d = 1; d < 10; d++) {
      const rr = r - dr * d, cc = c - dc * d;
      if (inBounds(rr, cc) && sameColor(board.grid[rr][cc], t.c)) len++; else break;
    }
    return len;
  }

  function matchAt(board, r, c) {
    return runLen(board, r, c, 0, 1) >= 3 || runLen(board, r, c, 1, 0) >= 3;
  }

  function swapCreatesMatch(board, ar, ac, br, bc) {
    const g = board.grid;
    const t = g[ar][ac];
    g[ar][ac] = g[br][bc];
    g[br][bc] = t;
    const ok = matchAt(board, ar, ac) || matchAt(board, br, bc);
    const t2 = g[ar][ac];
    g[ar][ac] = g[br][bc];
    g[br][bc] = t2;
    return ok;
  }

  function findPossibleMove(board) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = board.grid[r][c];
        if (!t || t.ingredient) continue;
        if (t.special) {
          for (const d of ADJ) {
            const nr = r + d[0], nc = c + d[1];
            if (inBounds(nr, nc) && board.grid[nr][nc] && !board.grid[nr][nc].ingredient) {
              return [{ r: r, c: c }, { r: nr, c: nc }];
            }
          }
          continue;
        }
        for (const d of [[0, 1], [1, 0]]) {
          const nr = r + d[0], nc = c + d[1];
          if (!inBounds(nr, nc)) continue;
          const tn = board.grid[nr][nc];
          if (!tn || tn.ingredient) continue;
          if (swapCreatesMatch(board, r, c, nr, nc)) return [{ r: r, c: c }, { r: nr, c: nc }];
        }
      }
    }
    return null;
  }

  function canSwap(board, a, b) {
    const ar = a.r, ac = a.c, br = b.r, bc = b.c;
    if (Math.abs(ar - br) + Math.abs(ac - bc) !== 1) return false;
    const ta = board.grid[ar][ac], tb = board.grid[br][bc];
    if (!ta || !tb || ta.ingredient || tb.ingredient) return false;
    if (ta.special || tb.special) return true;
    if (ta.chain || tb.chain) return swapCreatesMatch(board, ar, ac, br, bc);
    return true;
  }

  function shuffle(board) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const tiles = [], cells = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const t = board.grid[r][c];
        if (t && !t.ingredient && !t.chain && t.ice === 0 && !t.special) {
          tiles.push(t);
          cells.push([r, c]);
        }
      }
      for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = tiles[i]; tiles[i] = tiles[j]; tiles[j] = tmp;
      }
      for (let i = 0; i < cells.length; i++) board.grid[cells[i][0]][cells[i][1]] = tiles[i];
      if (!findMatches(board).length && findPossibleMove(board)) return;
    }
    generate(board, 5);
  }

  N.Board = {
    ROWS: ROWS,
    COLS: COLS,
    makeTile: makeTile,
    create: function (cfg) { return { cfg: cfg, grid: null, jelly: null, collected: 0, pendingIngredient: 0 }; },
    generate: generate,
    findMatches: findMatches,
    applyMatch: applyMatch,
    resolveExplosions: resolveExplosions,
    gravityAndFill: gravityAndFill,
    collectBottom: collectBottom,
    findPossibleMove: findPossibleMove,
    canSwap: canSwap,
    swapCreatesMatch: swapCreatesMatch,
    matchAt: matchAt,
    shuffle: shuffle,
    jellyTotal: jellyTotal,
    countIngredients: countIngredients,
    inBounds: inBounds,
    runLen: runLen,
    DIRS: DIRS
  };
})(window.YXXL);

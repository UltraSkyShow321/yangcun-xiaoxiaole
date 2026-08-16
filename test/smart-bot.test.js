/* 羊村消消乐 - 智能机器人通关测试:模拟会针对目标下手的玩家(两段式策略) */
global.window = global;
require('../js/board.js');
require('../js/levels.js');
const N = global.YXXL;

function smartMove(board, cfg) {
  const o = cfg.objective;
  let ingPos = null;
  if (o.type === 'collect') {
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      const t = board.grid[r][c];
      if (t && t.ingredient) { ingPos = { r: r, c: c }; break; }
    }
  }
  const moves = [];
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    const t = board.grid[r][c];
    if (!t || t.ingredient) continue;
    for (const d of dirs) {
      const nr = r + d[0], nc = c + d[1];
      if (!N.Board.inBounds(nr, nc)) continue;
      const tn = board.grid[nr][nc];
      if (!tn || tn.ingredient) continue;
      if (!N.Board.canSwap(board, { r: r, c: c }, { r: nr, c: nc })) continue;
      if (!(t.special || tn.special) && !N.Board.swapCreatesMatch(board, r, c, nr, nc)) continue;
      let power = 0, colScore = 0, jellyScore = 0;
      if (t.special || tn.special) {
        power += 15;
      } else {
        const g = board.grid;
        const tmp = g[r][c];
        g[r][c] = g[nr][nc];
        g[nr][nc] = tmp;
        power = N.Board.runLen(board, r, c, 0, 1) + N.Board.runLen(board, r, c, 1, 0) +
          N.Board.runLen(board, nr, nc, 0, 1) + N.Board.runLen(board, nr, nc, 1, 0);
        const tmp2 = g[r][c];
        g[r][c] = g[nr][nc];
        g[nr][nc] = tmp2;
      }
      if (ingPos) {
        const col = ingPos.c;
        if (c === col && r >= ingPos.r) colScore += 8;
        if (nc === col && nr >= ingPos.r) colScore += 8;
        if (c === col || nc === col) colScore += 2;
        if (Math.abs(c - col) === 1) colScore += 1;
        if (Math.abs(nc - col) === 1) colScore += 1;
      }
      if (o.type === 'jelly') {
        if (board.jelly[r][c] > 0) jellyScore += 4;
        if (board.jelly[nr][nc] > 0) jellyScore += 4;
        if (board.jelly[Math.min(8, r + 1)][c] > 0) jellyScore += 1;
        if (board.jelly[Math.min(8, nr + 1)][nc] > 0) jellyScore += 1;
      }
      moves.push({
        a: { r: r, c: c }, b: { r: nr, c: nc },
        power: power, colScore: colScore, jellyScore: jellyScore,
        score: Math.random() * 0.3
      });
    }
  }
  if (!moves.length) return null;
  /* 两段式:目标相关步优先 */
  let pool = moves;
  if (ingPos) pool = moves.filter(function (m) { return m.colScore >= 8; });
  if (ingPos && pool.length < 3) pool = moves.filter(function (m) { return m.colScore >= 2; });
  if (!ingPos && o.type === 'jelly') pool = moves.filter(function (m) { return m.jellyScore >= 4; });
  const best = pool.sort(function (x, y) {
    return (y.colScore + y.jellyScore + y.power * 0.3) - (x.colScore + x.jellyScore + x.power * 0.3);
  }).slice(0, 3);
  return best[Math.floor(Math.random() * best.length)];
}

function playGame(cfg) {
  const board = N.Board.create(cfg);
  N.Board.generate(board);
  let moves = 0, guard = 0;
  const o = cfg.objective;
  while (moves < cfg.moves && guard < 300) {
    guard++;
    const mv = smartMove(board, cfg);
    if (!mv) { N.Board.shuffle(board); continue; }
    const g = board.grid;
    const t = g[mv.a.r][mv.a.c];
    g[mv.a.r][mv.a.c] = g[mv.b.r][mv.b.c];
    g[mv.b.r][mv.b.c] = t;
    const ta = g[mv.a.r][mv.a.c], tb = g[mv.b.r][mv.b.c];
    if (ta.special || tb.special) {
      N.Board.resolveExplosions(board, [{ r: mv.a.r, c: mv.a.c, kind: 'cell' }, { r: mv.b.r, c: mv.b.c, kind: 'cell' }]);
    }
    moves++;
    let ci = 0;
    while (ci < 80) {
      N.Board.collectBottom(board);
      const groups = N.Board.findMatches(board);
      if (!groups.length) break;
      const res = N.Board.applyMatch(board, groups);
      if (res.triggered.length) {
        N.Board.resolveExplosions(board, res.triggered.map(function (x) { return { r: x.r, c: x.c, kind: 'special' }; }));
      }
      N.Board.gravityAndFill(board);
      ci++;
    }
    const win = (o.type === 'collect' && board.collected >= o.target) ||
      (o.type === 'jelly' && N.Board.jellyTotal(board) === 0) ||
      (o.type === 'score');
    if (win) break;
  }
  const win = (o.type === 'collect' && board.collected >= o.target) ||
    (o.type === 'jelly' && N.Board.jellyTotal(board) === 0) ||
    (o.type === 'score');
  return { win: win, moves: moves, collected: board.collected, jelly: N.Board.jellyTotal(board) };
}

let allPass = true;
const rows = [];
for (const cfg of N.Levels.LEVELS) {
  let wins = 0;
  const total = 15;
  for (let t = 0; t < total; t++) {
    const r = playGame(cfg);
    if (r.win) wins++;
  }
  const rate = wins / total * 100;
  const hard = cfg.id >= 28;
  const mark = rate >= 60 ? '✅' : (rate >= 40 || (hard && rate >= 30)) ? '⚠️' : '❌';
  if (rate < (hard ? 30 : 60)) allPass = false;
  rows.push(mark + ' 关卡 ' + String(cfg.id).padStart(2) + ' ' + cfg.name.padEnd(9) + ' 通关率 ' + rate.toFixed(0) + '% (' + wins + '/' + total + ')');
}
console.log(rows.join('\n'));
console.log(allPass ? '全部关卡合理(普通≥60%,终章≥30%)' : '部分关卡对策略玩家过难,需要调参');

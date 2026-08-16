/* 羊村消消乐 - 棋盘引擎压力测试(随机自动对局) */
global.window = global;
require('../js/board.js');
require('../js/levels.js');

const N = global.YXXL;
let failures = 0;

function randomMove(board) {
  const cells = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    const t = board.grid[r][c];
    if (t && !t.ingredient) cells.push([r, c]);
  }
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = cells[i]; cells[i] = cells[j]; cells[j] = tmp;
  }
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  for (const cellPos of cells) {
    const r = cellPos[0], c = cellPos[1];
    const t = board.grid[r][c];
    for (const d of dirs) {
      const nr = r + d[0], nc = c + d[1];
      if (!N.Board.inBounds(nr, nc)) continue;
      const tn = board.grid[nr][nc];
      if (!tn || tn.ingredient) continue;
      const a = { r: r, c: c }, b = { r: nr, c: nc };
      if (!N.Board.canSwap(board, a, b)) continue;
      if (t.special || tn.special || N.Board.swapCreatesMatch(board, r, c, nr, nc)) return [a, b];
    }
  }
  return null;
}

function playOneGame(cfg, maxMoves) {
  const board = N.Board.create(cfg);
  N.Board.generate(board);
  let moves = 0, guard = 0;
  while (moves < maxMoves && guard < 600) {
    guard++;
    const mv = randomMove(board);
    if (!mv) { N.Board.shuffle(board); continue; }
    const a = mv[0], b = mv[1];
    const g = board.grid;
    const t = g[a.r][a.c];
    g[a.r][a.c] = g[b.r][b.c];
    g[b.r][b.c] = t;
    const ta = g[a.r][a.c], tb = g[b.r][b.c];
    if (ta.special || tb.special) {
      N.Board.resolveExplosions(board, [{ r: a.r, c: a.c, kind: 'cell' }, { r: b.r, c: b.c, kind: 'cell' }]);
    }
    moves++;
    let ci = 0;
    while (ci < 80) {
      N.Board.collectBottom(board);
      const groups = N.Board.findMatches(board);
      if (!groups.length) break;
      const res = N.Board.applyMatch(board, groups);
      if (res.triggered.length) {
        N.Board.resolveExplosions(board, res.triggered.map(function (t2) {
          return { r: t2.r, c: t2.c, kind: 'special' };
        }));
      }
      N.Board.gravityAndFill(board);
      ci++;
    }
    if (ci >= 80) {
      console.log('!! 疑似死循环 level', cfg.id, '第', moves, '步,连消', ci, '轮');
      failures++;
      return board;
    }
    if (cfg.objective.type === 'collect' && board.collected >= cfg.objective.target) break;
    if (cfg.objective.type === 'jelly' && N.Board.jellyTotal(board) === 0) break;
  }
  if (guard >= 600) {
    console.log('!! 步数守卫触发 level', cfg.id);
    failures++;
  }
  return board;
}

/* 1. 全部 30 关 + 无尽随机对局 */
const all = N.Levels.LEVELS.concat([N.Levels.ENDLESS]);
for (const cfg of all) {
  const results = [];
  for (let trial = 0; trial < 15; trial++) {
    const board = playOneGame(cfg, Math.max(40, cfg.moves * 2));
    results.push({
      collected: board.collected,
      jelly: N.Board.jellyTotal(board),
      movesUsed: 0
    });
  }
  const reached = results.filter(function (r) {
    if (cfg.objective.type === 'collect') return r.collected >= cfg.objective.target;
    if (cfg.objective.type === 'jelly') return r.jelly === 0;
    return true;
  }).length;
  console.log('关卡', String(cfg.id).padStart(2), cfg.name.padEnd(8),
    '随机通关率', (reached / results.length * 100).toFixed(0) + '%',
    '收集达标', reached, '/15');
}

/* 2. 特殊棋子生成规则 */
function testSpecials() {
  const board = N.Board.create({ colors: 5, spawnCols: [], obstacles: {} });
  board.grid = [];
  for (let r = 0; r < 9; r++) { board.grid.push(new Array(9).fill(null)); }
  board.jelly = [];
  for (let r = 0; r < 9; r++) { board.jelly.push(new Array(9).fill(0)); }
  /* 四连 → 平底锅 */
  for (let c = 0; c < 4; c++) board.grid[3][c] = N.Board.makeTile(1);
  let groups = N.Board.findMatches(board);
  if (groups.length !== 1 || groups[0].spawn !== 'pan') { console.log('!! 四连判定错误'); failures++; }
  N.Board.applyMatch(board, groups);
  if (!board.grid[3][2] || board.grid[3][2].special !== 'pan') { console.log('!! 平底锅生成位置错误'); failures++; }
  /* 五连 → 青草蛋糕 */
  for (let c = 0; c < 9; c++) board.grid[5][c] = null;
  for (let c = 0; c < 5; c++) board.grid[5][c] = N.Board.makeTile(2);
  groups = N.Board.findMatches(board);
  if (groups.length !== 1 || groups[0].spawn !== 'cake') { console.log('!! 五连判定错误'); failures++; }
  N.Board.applyMatch(board, groups);
  if (!board.grid[5][2] || board.grid[5][2].special !== 'cake') { console.log('!! 蛋糕生成位置错误'); failures++; }
  /* L 形 → 爆竹 */
  board.grid[7][0] = N.Board.makeTile(3);
  board.grid[7][1] = N.Board.makeTile(3);
  board.grid[7][2] = N.Board.makeTile(3);
  board.grid[6][2] = N.Board.makeTile(3);
  board.grid[8][2] = N.Board.makeTile(3);
  groups = N.Board.findMatches(board);
  const bombGroup = groups.find(function (g) { return g.spawn === 'bomb'; });
  if (!bombGroup) { console.log('!! L形判定错误'); failures++; }
  else {
    N.Board.applyMatch(board, [bombGroup]);
    if (!board.grid[7][2] || board.grid[7][2].special !== 'bomb') { console.log('!! 爆竹生成位置错误'); failures++; }
  }
  console.log('特殊棋子生成测试完成');
}

/* 3. 爆炸与连锁 */
function testExplosions() {
  const board = N.Board.create({ colors: 5, spawnCols: [], obstacles: {} });
  board.grid = [];
  for (let r = 0; r < 9; r++) { board.grid.push(new Array(9).fill(null)); }
  board.jelly = [];
  for (let r = 0; r < 9; r++) { board.jelly.push(new Array(9).fill(0)); }
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) board.grid[r][c] = N.Board.makeTile((r + c) % 4);
  board.grid[4][4] = N.Board.makeTile(0, 'pan');
  board.grid[4][2] = N.Board.makeTile(1, 'bomb');
  const ex = N.Board.resolveExplosions(board, [{ r: 4, c: 4, kind: 'cell' }]);
  /* 平底锅十字 17 格 + 爆竹 3x3 波及(去重 6 格)= 20 格 */
  if (ex.destroyed.length < 19) { console.log('!! 爆炸范围不足', ex.destroyed.length); failures++; }
  /* 平底锅自身 + 被波及的爆竹 各触发一次 */
  if (ex.triggered.length !== 2) { console.log('!! 连锁触发数量错误', ex.triggered.length); failures++; }
  /* 冰块:一格冰被爆炸命中一次应仅破冰 */
  const b2 = N.Board.create({ colors: 5, spawnCols: [], obstacles: {} });
  b2.grid = board.grid.map(function (row) { return row.map(function (t) { return t ? N.Board.makeTile(t.c) : null; }); });
  b2.jelly = [];
  for (let r = 0; r < 9; r++) { b2.jelly.push(new Array(9).fill(0)); }
  b2.grid[0][0].ice = 2;
  const ex2 = N.Board.resolveExplosions(b2, [{ r: 0, c: 0, kind: 'cell' }]);
  if (b2.grid[0][0] === null || b2.grid[0][0].ice !== 1) { console.log('!! 双层冰处理错误'); failures++; }
  void ex2;
  console.log('爆炸连锁测试完成');
}

/* 4. 收集掉落 */
function testIngredients() {
  const cfg = {
    colors: 5, moves: 25, spawnCols: [0, 4, 8], concurrent: 2,
    objective: { type: 'collect', item: 'wolf', target: 10 },
    ingredient: { type: 'wolf', target: 10 }, obstacles: {}
  };
  const board = N.Board.create(cfg);
  N.Board.generate(board);
  const cnt = N.Board.countIngredients(board);
  if (cnt !== 1) { console.log('!! 初始收集物数量错误', cnt); failures++; }
  let totalCollected = 0;
  let guard = 0;
  while (guard < 300) {
    guard++;
    /* 先收集,再清空最底行(不删除收集物自身)来让收集物下落 */
    const got = N.Board.collectBottom(board);
    totalCollected += got.length;
    for (let c = 0; c < 9; c++) {
      const t = board.grid[8][c];
      if (!t || !t.ingredient) board.grid[8][c] = null;
    }
    N.Board.gravityAndFill(board);
    if (totalCollected >= 10) break;
  }
  console.log('收集掉落测试完成,共收集', totalCollected, '只灰太狼');
  if (totalCollected < 10) { console.log('!! 收集物无法全部掉落'); failures++; }
}

testSpecials();
testExplosions();
testIngredients();

console.log(failures === 0 ? '✅ 全部引擎测试通过' : '❌ 存在 ' + failures + ' 处失败');
process.exit(failures === 0 ? 0 : 1);

(function () {
  var SIZE = 4;
  var boardEl = document.getElementById('board');
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var msgEl = document.getElementById('msg');
  var grid, score, won, over, startBest, rnd;

  function emptyCells() {
    var cells = [];
    for (var r = 0; r < SIZE; r++)
      for (var c = 0; c < SIZE; c++)
        if (!grid[r][c]) cells.push([r, c]);
    return cells;
  }

  function addTile() {
    var cells = emptyCells();
    if (!cells.length) return;
    var p = cells[Math.floor(rnd() * cells.length)];
    grid[p[0]][p[1]] = rnd() < 0.9 ? 2 : 4;
  }

  function render() {
    boardEl.innerHTML = '';
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var v = grid[r][c];
        var cell = document.createElement('div');
        cell.className = 'cell' + (v ? ' ' + (v > 2048 ? 'vbig' : 'v' + v) : '');
        cell.textContent = v || '';
        boardEl.appendChild(cell);
      }
    }
    scoreEl.textContent = score;
    MiniOyun.setBest('2048', score);
    bestEl.textContent = MiniOyun.getBest('2048');
  }

  // Bir satırı sola kaydırıp birleştirir; yeni satırı ve kazanılan puanı döner.
  function slideRow(row) {
    var vals = row.filter(function (v) { return v; });
    var out = [], gained = 0;
    for (var i = 0; i < vals.length; i++) {
      if (vals[i] === vals[i + 1]) {
        out.push(vals[i] * 2);
        gained += vals[i] * 2;
        i++;
      } else {
        out.push(vals[i]);
      }
    }
    while (out.length < SIZE) out.push(0);
    return { row: out, gained: gained };
  }

  function getLine(dir, i) {
    var line = [];
    for (var j = 0; j < SIZE; j++) {
      if (dir === 'left') line.push(grid[i][j]);
      else if (dir === 'right') line.push(grid[i][SIZE - 1 - j]);
      else if (dir === 'up') line.push(grid[j][i]);
      else line.push(grid[SIZE - 1 - j][i]);
    }
    return line;
  }

  function setLine(dir, i, line) {
    for (var j = 0; j < SIZE; j++) {
      if (dir === 'left') grid[i][j] = line[j];
      else if (dir === 'right') grid[i][SIZE - 1 - j] = line[j];
      else if (dir === 'up') grid[j][i] = line[j];
      else grid[SIZE - 1 - j][i] = line[j];
    }
  }

  function canMove() {
    if (emptyCells().length) return true;
    for (var r = 0; r < SIZE; r++)
      for (var c = 0; c < SIZE; c++) {
        if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return true;
        if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return true;
      }
    return false;
  }

  function move(dir) {
    if (over || MiniOyun.duraklatildi()) return;
    var moved = false, merged = false;
    for (var i = 0; i < SIZE; i++) {
      var before = getLine(dir, i);
      var res = slideRow(before);
      if (res.row.join() !== before.join()) moved = true;
      setLine(dir, i, res.row);
      score += res.gained;
      if (res.gained) merged = true;
    }
    if (!moved) return;
    MiniOyun.ses(merged ? 'puan' : 'tik');
    addTile();
    render();
    if (!won && grid.some(function (row) { return row.indexOf(2048) !== -1; })) {
      won = true;
      msgEl.textContent = 'Tebrikler, 2048! Devam edebilirsin.';
      MiniOyun.ses('kazan');
    }
    if (!canMove()) {
      over = true;
      msgEl.textContent = 'Oyun bitti! Skorun: ' + score;
      MiniOyun.bitti({ baslik: 'Oyun bitti!', metin: 'Skorun: ' + score, rekor: score > startBest, kaybetti: score <= startBest, sonuc: score + ' puan', paylas: '2048\'de ' + score + ' puan yaptım! Sen kaç yaparsın?' });
    }
  }

  function start() {
    grid = [];
    for (var r = 0; r < SIZE; r++) grid.push([0, 0, 0, 0]);
    score = 0; won = false; over = false;
    startBest = MiniOyun.getBest('2048');
    rnd = MiniOyun.rastgele();
    msgEl.textContent = '';
    addTile(); addTile();
    render();
  }

  var keys = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' };
  document.addEventListener('keydown', function (e) {
    var dir = keys[e.key] || keys[e.key.toLowerCase()];
    if (dir) { e.preventDefault(); move(dir); }
  });

  var sx = 0, sy = 0;
  boardEl.addEventListener('touchstart', function (e) {
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  boardEl.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - sx;
    var dy = e.changedTouches[0].clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
    else move(dy > 0 ? 'down' : 'up');
  });

  document.getElementById('restart').addEventListener('click', start);
  MiniOyun.oyun({ restart: start });
  start();
})();

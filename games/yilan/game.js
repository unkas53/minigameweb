(function () {
  var CELLS = 21;
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var cell = canvas.width / CELLS;
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var msgEl = document.getElementById('msg');
  var btn = document.getElementById('restart');

  var snake, dir, nextDir, food, score, timer, running;
  var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  bestEl.textContent = MiniOyun.getBest('yilan');

  function placeFood() {
    var free = [];
    for (var x = 0; x < CELLS; x++)
      for (var y = 0; y < CELLS; y++)
        if (!snake.some(function (s) { return s[0] === x && s[1] === y; })) free.push([x, y]);
    food = free[Math.floor(Math.random() * free.length)];
  }

  function draw() {
    ctx.fillStyle = '#11152b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (food) {
      ctx.fillStyle = '#ff5d6c';
      ctx.beginPath();
      ctx.arc(food[0] * cell + cell / 2, food[1] * cell + cell / 2, cell / 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    snake.forEach(function (s, i) {
      ctx.fillStyle = i === 0 ? '#ffb547' : '#5ee0b8';
      ctx.fillRect(s[0] * cell + 1, s[1] * cell + 1, cell - 2, cell - 2);
    });
  }

  function speed() { return Math.max(60, 140 - Math.floor(score / 50) * 10); }

  function tick() {
    dir = nextDir;
    var head = [snake[0][0] + DIRS[dir][0], snake[0][1] + DIRS[dir][1]];
    var ate = food && head[0] === food[0] && head[1] === food[1];
    // Yem yenmediyse kuyruk bu adımda boşalacağı için çarpışma kontrolüne dahil edilmez.
    var body = ate ? snake : snake.slice(0, -1);
    var hitWall = head[0] < 0 || head[1] < 0 || head[0] >= CELLS || head[1] >= CELLS;
    var hitSelf = body.some(function (s) { return s[0] === head[0] && s[1] === head[1]; });
    if (hitWall || hitSelf) return gameOver();

    snake.unshift(head);
    if (ate) {
      score += 10;
      scoreEl.textContent = score;
      placeFood();
      clearInterval(timer);
      timer = setInterval(tick, speed());
    } else {
      snake.pop();
    }
    draw();
  }

  function gameOver() {
    clearInterval(timer);
    running = false;
    MiniOyun.setBest('yilan', score);
    bestEl.textContent = MiniOyun.getBest('yilan');
    msgEl.textContent = 'Oyun bitti! Skorun: ' + score;
    btn.textContent = 'Tekrar oyna';
  }

  function start() {
    clearInterval(timer);
    snake = [[10, 10], [9, 10], [8, 10]];
    dir = nextDir = 'right';
    score = 0;
    scoreEl.textContent = 0;
    msgEl.textContent = '';
    placeFood();
    draw();
    running = true;
    btn.textContent = 'Yeniden başla';
    timer = setInterval(tick, speed());
  }

  function turn(d) {
    if (!running) { start(); }
    var cur = DIRS[dir];
    // Ters yöne anında dönüşü engelle
    if (DIRS[d][0] === -cur[0] && DIRS[d][1] === -cur[1]) return;
    nextDir = d;
  }

  var keys = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
  document.addEventListener('keydown', function (e) {
    var d = keys[e.key] || keys[e.key.toLowerCase()];
    if (d) { e.preventDefault(); turn(d); }
  });

  document.querySelectorAll('.touch-controls button').forEach(function (b) {
    b.addEventListener('click', function () { turn(b.getAttribute('data-dir')); });
  });

  var sx = 0, sy = 0;
  canvas.addEventListener('touchstart', function (e) {
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  canvas.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - sx;
    var dy = e.changedTouches[0].clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 'right' : 'left');
    else turn(dy > 0 ? 'down' : 'up');
  });

  btn.addEventListener('click', start);

  snake = [[10, 10], [9, 10], [8, 10]];
  dir = nextDir = 'right';
  draw();
})();

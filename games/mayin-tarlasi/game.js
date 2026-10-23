(function () {
  var LEVELS = {
    kolay: { size: 9, mines: 10 },
    orta: { size: 12, mines: 24 },
    zor: { size: 16, mines: 45 }
  };
  var LONG_PRESS = 400;

  var boardEl = document.getElementById('board');
  var minesEl = document.getElementById('mines');
  var timeEl = document.getElementById('time');
  var bestEl = document.getElementById('best');
  var faceEl = document.getElementById('face');
  var levelEl = document.getElementById('level');
  var modeEl = document.getElementById('mode');
  var msgEl = document.getElementById('msg');
  var againEl = document.getElementById('again');

  var level, size, total, cells, els, placed, over, flags, opened, seconds, timer, cursor, flagMode = false;
  var pressTimer = null, suppressClick = false, lastTouch = 0, paused = false;

  // Süre en iyisi en küçük değerdir; MiniOyun.setBest büyük skoru tuttuğu için ayrı anahtar kullanılır.
  function bestKey() { return 'mayin-tarlasi-en-iyi-' + level; }
  function getBest() {
    // Kayıt yoksa null döner; 0 sn geçerli bir rekordur.
    try {
      var v = parseInt(localStorage.getItem(bestKey()), 10);
      return isNaN(v) ? null : v;
    } catch (e) { return null; }
  }
  function saveBest(t) {
    var b = getBest();
    if (b !== null && t >= b) return;
    try { localStorage.setItem(bestKey(), String(t)); } catch (e) {}
  }
  function showBest() {
    var b = getBest();
    bestEl.textContent = b !== null ? b + ' sn' : '-';
  }

  function neighbors(i) {
    var r = Math.floor(i / size), c = i % size, out = [];
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        var nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) out.push(nr * size + nc);
      }
    }
    return out;
  }

  function placeMines(safe) {
    var banned = {};
    banned[safe] = true;
    neighbors(safe).forEach(function (n) { banned[n] = true; });
    var pool = [];
    for (var i = 0; i < total; i++) if (!banned[i]) pool.push(i);
    for (var k = 0; k < LEVELS[level].mines; k++) {
      var j = k + Math.floor(Math.random() * (pool.length - k));
      var t = pool[k]; pool[k] = pool[j]; pool[j] = t;
      cells[pool[k]].mine = true;
    }
    cells.forEach(function (cell, idx) {
      cell.count = neighbors(idx).filter(function (n) { return cells[n].mine; }).length;
    });
    placed = true;
  }

  function startTimer() {
    if (timer) return;
    timer = setInterval(function () {
      if (seconds < 999) timeEl.textContent = ++seconds;
    }, 1000);
  }
  function stopTimer() { clearInterval(timer); timer = null; }

  function updateCounter() { minesEl.textContent = LEVELS[level].mines - flags; }

  function draw(i) {
    var cell = cells[i], el = els[i];
    el.className = 'cell' + (i === cursor ? ' cur' : '');
    el.textContent = '';
    if (cell.open) {
      el.classList.add('open');
      if (cell.mine) {
        el.textContent = '💣';
        if (cell.boom) el.classList.add('boom');
      } else if (cell.count) {
        el.textContent = cell.count;
        el.classList.add('n' + cell.count);
      }
    } else if (cell.wrong) {
      el.textContent = '❌';
    } else if (cell.flag) {
      el.textContent = '🚩';
    }
  }

  function open(i) {
    var cell = cells[i];
    if (over || cell.open || cell.flag) return;
    if (!placed) { placeMines(i); startTimer(); }
    if (cell.mine) { cell.boom = true; lose(); return; }
    var queue = [i];
    cell.open = true;
    while (queue.length) {
      var cur = queue.shift();
      opened++;
      draw(cur);
      if (cells[cur].count) continue;
      neighbors(cur).forEach(function (n) {
        var nc = cells[n];
        if (!nc.open && !nc.flag && !nc.mine) { nc.open = true; queue.push(n); }
      });
    }
    if (opened === total - LEVELS[level].mines) win();
  }

  function chord(i) {
    var cell = cells[i];
    if (over || !cell.open || !cell.count) return;
    var around = neighbors(i);
    var flagged = around.filter(function (n) { return cells[n].flag; }).length;
    if (flagged !== cell.count) return;
    around.forEach(function (n) { if (!over) open(n); });
  }

  function toggleFlag(i) {
    var cell = cells[i];
    if (over || paused || MiniOyun.duraklatildi() || cell.open) return;
    cell.flag = !cell.flag;
    flags += cell.flag ? 1 : -1;
    updateCounter();
    draw(i);
  }

  function act(i, wantFlag) {
    if (paused || MiniOyun.duraklatildi()) return;
    setCursor(i);
    if (cells[i].open) { chord(i); return; }
    if (wantFlag) toggleFlag(i); else open(i);
  }

  function end(text) {
    over = true;
    stopTimer();
    msgEl.textContent = text;
    againEl.classList.add('show');
  }

  function lose() {
    cells.forEach(function (cell, i) {
      if (cell.mine && !cell.flag) cell.open = true;
      if (!cell.mine && cell.flag) cell.wrong = true;
      draw(i);
    });
    faceEl.textContent = '😵';
    end('Mayına bastın! Tekrar dene.');
    MiniOyun.bitti({ baslik: 'Mayına bastın!', metin: 'Bir dahakine daha dikkatli ol.', kaybetti: true, paylas: 'Mayın Tarlası\'nda şansını dene!' });
  }

  function win() {
    cells.forEach(function (cell, i) {
      if (cell.mine && !cell.flag) { cell.flag = true; draw(i); }
    });
    flags = LEVELS[level].mines;
    updateCounter();
    faceEl.textContent = '😎';
    var prev = getBest();
    saveBest(seconds);
    showBest();
    var rekor = prev === null || seconds < prev;
    end('Tebrikler! ' + seconds + ' saniyede temizledin.' + (rekor ? ' Yeni rekor!' : ''));
    MiniOyun.bitti({ baslik: 'Tebrikler!', metin: seconds + ' saniyede temizledin.', rekor: rekor, skor: seconds, sonuc: seconds + ' sn', paylas: 'Mayın Tarlası\'nı ' + seconds + ' saniyede temizledim! Sen kaç saniyede bitirirsin?' });
  }

  function setCursor(i) {
    var old = cursor;
    cursor = i;
    if (old !== undefined && old !== i && els[old]) draw(old);
    draw(i);
  }

  function start() {
    stopTimer();
    paused = false;
    level = levelEl.value;
    size = LEVELS[level].size;
    total = size * size;
    cells = [];
    els = [];
    placed = over = false;
    flags = opened = seconds = 0;
    cursor = Math.floor(size / 2) * size + Math.floor(size / 2);
    timeEl.textContent = 0;
    msgEl.textContent = '';
    faceEl.textContent = '🙂';
    againEl.classList.remove('show');
    updateCounter();
    showBest();
    boardEl.style.setProperty('--cols', size);
    boardEl.innerHTML = '';
    for (var i = 0; i < total; i++) {
      cells.push({ mine: false, open: false, flag: false, count: 0 });
      var el = document.createElement('div');
      el.dataset.i = i;
      el.setAttribute('role', 'gridcell');
      els.push(el);
      boardEl.appendChild(el);
      draw(i);
    }
  }

  function indexOf(target) {
    var el = target.closest ? target.closest('.cell') : null;
    return el ? parseInt(el.dataset.i, 10) : -1;
  }

  boardEl.addEventListener('click', function (e) {
    var i = indexOf(e.target);
    if (suppressClick) { suppressClick = false; return; }
    if (i < 0) return;
    boardEl.classList.remove('kb');
    act(i, flagMode);
  });

  boardEl.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    // Mobilde uzun basma da contextmenu tetikler; onu uzun basma işleyicisi zaten ele alır.
    if (Date.now() - lastTouch < 1000) return;
    var i = indexOf(e.target);
    if (i >= 0) { setCursor(i); if (!cells[i].open) toggleFlag(i); }
  });

  boardEl.addEventListener('touchstart', function (e) {
    lastTouch = Date.now();
    suppressClick = false;
    var i = indexOf(e.target);
    if (i < 0 || e.touches.length > 1) return;
    clearTimeout(pressTimer);
    pressTimer = setTimeout(function () {
      pressTimer = null;
      suppressClick = true;
      setCursor(i);
      if (!cells[i].open) {
        toggleFlag(i);
        if (navigator.vibrate) navigator.vibrate(30);
      }
    }, LONG_PRESS);
  }, { passive: true });

  function cancelPress() { clearTimeout(pressTimer); pressTimer = null; lastTouch = Date.now(); }
  boardEl.addEventListener('touchmove', cancelPress, { passive: true });
  boardEl.addEventListener('touchcancel', cancelPress, { passive: true });
  boardEl.addEventListener('touchend', function (e) {
    cancelPress();
    if (suppressClick) e.preventDefault();
  });

  boardEl.addEventListener('keydown', function (e) {
    var r = Math.floor(cursor / size), c = cursor % size, handled = true;
    switch (e.key) {
      case 'ArrowUp': r = Math.max(0, r - 1); break;
      case 'ArrowDown': r = Math.min(size - 1, r + 1); break;
      case 'ArrowLeft': c = Math.max(0, c - 1); break;
      case 'ArrowRight': c = Math.min(size - 1, c + 1); break;
      case ' ': case 'Enter': act(cursor, false); break;
      case 'f': case 'F': if (cells[cursor].open) handled = false; else toggleFlag(cursor); break;
      case 'n': case 'N': start(); break;
      default: handled = false;
    }
    if (!handled) return;
    e.preventDefault();
    boardEl.classList.add('kb');
    if (e.key.indexOf('Arrow') === 0) setCursor(r * size + c);
  });

  modeEl.addEventListener('click', function () {
    flagMode = !flagMode;
    modeEl.textContent = flagMode ? '🚩 Bayrak' : '⛏️ Kaz';
    modeEl.classList.toggle('flag', flagMode);
  });
  faceEl.addEventListener('click', start);
  againEl.addEventListener('click', start);
  levelEl.addEventListener('change', start);
  MiniOyun.oyun({
    restart: start,
    seviye: function () { return level; },
    canPause: function () { return placed && !over; },
    pause: function () { paused = true; stopTimer(); },
    resume: function () { paused = false; if (placed && !over) startTimer(); }
  });

  start();
})();

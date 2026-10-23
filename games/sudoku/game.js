(function () {
  // İpucu (verilen rakam) aralıkları
  var LEVELS = {
    kolay: { min: 40, max: 45, ad: 'Kolay' },
    orta: { min: 32, max: 36, ad: 'Orta' },
    zor: { min: 26, max: 30, ad: 'Zor' }
  };
  var SAVE_KEY = 'sudoku-kayit';
  var MAX_MISTAKES = 3;
  var HINTS = 3;
  var HISTORY = 100;
  var ALL = 0x3fe; // 1-9 rakamlarının bit maskesi

  var gridEl = document.getElementById('grid');
  var padEl = document.getElementById('pad');
  var levelEl = document.getElementById('level');
  var timeEl = document.getElementById('time');
  var mistakesEl = document.getElementById('mistakes');
  var bestEl = document.getElementById('best');
  var msgEl = document.getElementById('msg');
  var noteBtn = document.getElementById('note');
  var hintBtn = document.getElementById('hint');
  var endEl = document.getElementById('end');
  var daily = /[?&]gunluk=\d{4}-\d{2}-\d{2}/.test(location.search);

  var level, puzzle, solution, vals, notes, mistakes, seconds, hintsLeft, history;
  var sel = 40, over = false, paused = false, noteMode = false, timer = null, rnd, els = [], padBtns = [];

  // ---------- Bulmaca üretici ve çözücü ----------
  function boxOf(i) { return Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3); }
  var PEERS = [];
  for (var p = 0; p < 81; p++) {
    var list = [];
    for (var q = 0; q < 81; q++) {
      if (q !== p && (Math.floor(q / 9) === Math.floor(p / 9) || q % 9 === p % 9 || boxOf(q) === boxOf(p))) list.push(q);
    }
    PEERS.push(list);
  }
  function bits(m) { var n = 0; while (m) { m &= m - 1; n++; } return n; }

  // Çözüm sayısını en fazla limit kadar sayar; random verilirse rakamları karıştırarak ilk çözümü grid'e yazar.
  function solve(grid, limit, random) {
    var rows = [0, 0, 0, 0, 0, 0, 0, 0, 0], cols = rows.slice(), boxes = rows.slice(), count = 0, i;
    for (i = 0; i < 81; i++) {
      if (!grid[i]) continue;
      var b = 1 << grid[i];
      rows[Math.floor(i / 9)] |= b; cols[i % 9] |= b; boxes[boxOf(i)] |= b;
    }
    function step() {
      // En az adaylı boş kareyi seç
      var best = -1, bestMask = 0, bestN = 10;
      for (var k = 0; k < 81; k++) {
        if (grid[k]) continue;
        var m = ALL & ~(rows[Math.floor(k / 9)] | cols[k % 9] | boxes[boxOf(k)]);
        var n = bits(m);
        if (n < bestN) { best = k; bestMask = m; bestN = n; if (n < 2) break; }
      }
      if (best < 0) { count++; return count >= limit; }
      if (!bestN) return false;
      var digits = [];
      for (var d = 1; d <= 9; d++) if (bestMask & (1 << d)) digits.push(d);
      if (random) shuffle(digits, random);
      var r = Math.floor(best / 9), c = best % 9, x = boxOf(best);
      for (var j = 0; j < digits.length; j++) {
        var bit = 1 << digits[j];
        grid[best] = digits[j];
        rows[r] |= bit; cols[c] |= bit; boxes[x] |= bit;
        if (step()) { if (!random) grid[best] = 0; return true; }
        rows[r] &= ~bit; cols[c] &= ~bit; boxes[x] &= ~bit;
      }
      grid[best] = 0;
      return false;
    }
    step();
    return count;
  }

  function shuffle(a, random) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Tam çözüm üretir, sonra tek çözüm korunduğu sürece kareleri boşaltır.
  function generate(lv, random) {
    var full = new Array(81).fill(0);
    solve(full, 1, random);
    var grid = full.slice();
    var target = LEVELS[lv].min + Math.floor(random() * (LEVELS[lv].max - LEVELS[lv].min + 1));
    var order = shuffle(Array.from({ length: 81 }, function (_, i) { return i; }), random);
    var clues = 81;
    for (var k = 0; k < 81 && clues > target; k++) {
      var i = order[k], v = grid[i];
      grid[i] = 0;
      if (solve(grid.slice(), 2) !== 1) grid[i] = v; else clues--;
    }
    return { puzzle: grid, solution: full };
  }

  // ---------- Kayıt ve rekor ----------
  // Süre en iyisi en küçük değerdir; seviye başına ayrı anahtar (profil sayfası da okur).
  function bestKey() { return 'sudoku-en-iyi-' + level; }
  function getBest() {
    try { return parseInt(localStorage.getItem(bestKey()), 10) || 0; } catch (e) { return 0; }
  }
  function showBest() { var b = getBest(); bestEl.textContent = b ? fmt(b) : '-'; }
  function fmt(s) { return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }

  function save() {
    if (daily) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ level: level, puzzle: puzzle, solution: solution, vals: vals, notes: notes, mistakes: mistakes, seconds: seconds, hints: hintsLeft }));
    } catch (e) {}
  }
  function clearSave() {
    if (daily) return;
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  }
  function loadSave() {
    if (daily) return null;
    try {
      var s = JSON.parse(localStorage.getItem(SAVE_KEY));
      return s && LEVELS[s.level] && s.puzzle && s.puzzle.length === 81 ? s : null;
    } catch (e) { return null; }
  }

  // ---------- Süre ----------
  function startTimer() {
    if (timer || over || paused) return;
    timer = setInterval(function () {
      seconds++;
      timeEl.textContent = fmt(seconds);
      if (seconds % 5 === 0) save();
    }, 1000);
  }
  function stopTimer() { clearInterval(timer); timer = null; }

  // ---------- Çizim ----------
  function value(i) { return puzzle[i] || vals[i]; }

  function build() {
    gridEl.innerHTML = '';
    els = [];
    for (var i = 0; i < 81; i++) {
      var el = document.createElement('div');
      el.dataset.i = i;
      el.setAttribute('role', 'gridcell');
      var r = Math.floor(i / 9), c = i % 9;
      el.className = 'cell' + (c % 3 === 2 && c < 8 ? ' br' : '') + (r % 3 === 2 && r < 8 ? ' bb' : '');
      els.push(el);
      gridEl.appendChild(el);
    }
  }

  function draw() {
    var sv = value(sel), sr = Math.floor(sel / 9), sc = sel % 9, sb = boxOf(sel);
    for (var i = 0; i < 81; i++) {
      var el = els[i], v = value(i), cl = el.classList;
      cl.toggle('given', !!puzzle[i]);
      cl.toggle('user', !puzzle[i] && !!vals[i]);
      cl.toggle('wrong', !puzzle[i] && !!vals[i] && vals[i] !== solution[i]);
      cl.toggle('sel', i === sel);
      cl.toggle('peer', i !== sel && (Math.floor(i / 9) === sr || i % 9 === sc || boxOf(i) === sb));
      cl.toggle('same', i !== sel && !!sv && v === sv);
      if (v) {
        el.textContent = v;
      } else if (notes[i]) {
        var html = '';
        for (var d = 1; d <= 9; d++) html += '<span>' + (notes[i] & (1 << d) ? d : '') + '</span>';
        el.innerHTML = '<div class="notes">' + html + '</div>';
      } else {
        el.textContent = '';
      }
    }
    var counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (var k = 0; k < 81; k++) if (value(k) && value(k) === solution[k]) counts[value(k)]++;
    padBtns.forEach(function (b, idx) {
      var left = 9 - counts[idx + 1];
      b.querySelector('small').textContent = left;
      b.classList.toggle('done', left === 0);
    });
    mistakesEl.textContent = mistakes + '/' + MAX_MISTAKES;
    hintBtn.querySelector('b').textContent = hintsLeft;
    hintBtn.disabled = !hintsLeft;
    timeEl.textContent = fmt(seconds);
  }

  // ---------- Hamleler ----------
  function blocked() { return over || paused || MiniOyun.duraklatildi(); }

  function snapshot(cellsList) {
    return cellsList.map(function (i) { return [i, vals[i], notes[i]]; });
  }
  function remember(entry) {
    history.push(entry);
    if (history.length > HISTORY) history.shift();
  }

  // Doğru rakam yerleşince aynı satır, sütun ve kutudaki notlardan silinir
  function place(i, n) {
    var touched = [i].concat(PEERS[i].filter(function (q) { return notes[q] & (1 << n); }));
    remember(snapshot(touched));
    vals[i] = n;
    notes[i] = 0;
    if (n === solution[i]) {
      touched.slice(1).forEach(function (q) { notes[q] &= ~(1 << n); });
    }
  }

  function input(n) {
    if (blocked() || puzzle[sel]) return;
    if (noteMode) {
      if (vals[sel]) return;
      remember(snapshot([sel]));
      notes[sel] ^= 1 << n;
      MiniOyun.ses('tik');
      after();
      return;
    }
    if (vals[sel] === n) return;
    place(sel, n);
    if (n === solution[sel]) {
      MiniOyun.ses('puan');
    } else {
      mistakes++;
      MiniOyun.ses('tik');
      if (navigator.vibrate) navigator.vibrate(60);
    }
    after();
  }

  function erase() {
    if (blocked() || puzzle[sel] || (!vals[sel] && !notes[sel])) return;
    remember(snapshot([sel]));
    vals[sel] = 0;
    notes[sel] = 0;
    after();
  }

  function undo() {
    if (blocked() || !history.length) return;
    history.pop().forEach(function (s) { vals[s[0]] = s[1]; notes[s[0]] = s[2]; });
    MiniOyun.ses('tik');
    after();
  }

  function hint() {
    if (blocked() || !hintsLeft) return;
    var target = sel;
    if (puzzle[target] || vals[target] === solution[target]) {
      var open = [];
      for (var i = 0; i < 81; i++) if (!puzzle[i] && vals[i] !== solution[i]) open.push(i);
      if (!open.length) return;
      target = open[Math.floor(rnd() * open.length)];
    }
    hintsLeft--;
    sel = target;
    place(target, solution[target]);
    MiniOyun.ses('puan');
    after();
  }

  function after() {
    if (mistakes >= MAX_MISTAKES) { draw(); lose(); return; }
    for (var i = 0; i < 81; i++) if (value(i) !== solution[i]) { save(); draw(); return; }
    draw();
    win();
  }

  function select(i) {
    if (paused || MiniOyun.duraklatildi()) return;
    sel = i;
    draw();
  }

  // ---------- Oyun sonu ----------
  function finish(text) {
    over = true;
    stopTimer();
    clearSave();
    msgEl.textContent = text;
    endEl.hidden = false;
  }

  function win() {
    var prev = getBest(), rekor = !prev || seconds < prev;
    if (rekor) { try { localStorage.setItem(bestKey(), String(seconds)); } catch (e) {} }
    showBest();
    gridEl.classList.add('wave');
    var t = fmt(seconds), detail = t + ' sürede, ' + mistakes + ' hatayla çözdün.';
    finish('Tebrikler! ' + detail + (rekor ? ' Yeni rekor!' : ''));
    MiniOyun.bitti({ baslik: 'Tebrikler!', metin: LEVELS[level].ad + ' Sudoku\'yu ' + detail, rekor: rekor, sonuc: t + ' (' + LEVELS[level].ad + ')', paylas: LEVELS[level].ad + ' Sudoku\'yu ' + t + ' sürede çözdüm! Sen ne kadar sürede çözersin?' });
  }

  function lose() {
    finish('Oyun bitti: ' + MAX_MISTAKES + ' hata yaptın.');
    MiniOyun.bitti({ baslik: 'Oyun bitti', metin: MAX_MISTAKES + ' hata hakkın doldu. Aynı bulmacayı yeniden dene ya da yeni bir oyun başlat.', kaybetti: true, sonuc: 'Çözülemedi', paylas: 'MiniOyun\'da Sudoku oynuyorum, sen de dene!' });
  }

  // ---------- Başlatma ----------
  function reset(state) {
    stopTimer();
    over = false;
    paused = false;
    history = [];
    vals = state ? state.vals.slice() : new Array(81).fill(0);
    notes = state ? state.notes.slice() : new Array(81).fill(0);
    mistakes = state ? state.mistakes : 0;
    seconds = state ? state.seconds : 0;
    hintsLeft = state ? state.hints : HINTS;
    msgEl.textContent = '';
    endEl.hidden = true;
    gridEl.classList.remove('wave');
    sel = 40;
    showBest();
    draw();
    save();
    startTimer();
  }

  function newGame() {
    level = levelEl.value;
    rnd = MiniOyun.rastgele();
    var g = generate(level, rnd);
    puzzle = g.puzzle;
    solution = g.solution;
    reset();
  }

  // Aynı bulmacayı baştan başlatır
  function retry() { reset(); }

  function init() {
    build();
    padEl.innerHTML = '';
    for (var d = 1; d <= 9; d++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'num';
      b.dataset.n = d;
      b.setAttribute('aria-label', 'Rakam ' + d);
      b.innerHTML = d + '<small></small>';
      padEl.appendChild(b);
      padBtns.push(b);
    }
    if (daily) {
      // Günlük bulmaca herkes için aynı zorlukta
      levelEl.value = 'orta';
      levelEl.disabled = true;
    }
    var s = loadSave();
    if (s) {
      levelEl.value = s.level;
      level = s.level;
      rnd = MiniOyun.rastgele();
      puzzle = s.puzzle;
      solution = s.solution;
      reset(s);
    } else {
      newGame();
    }
  }

  gridEl.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('.cell') : null;
    if (!el) return;
    gridEl.classList.remove('kb');
    select(parseInt(el.dataset.i, 10));
  });
  padEl.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.num') : null;
    if (b) input(parseInt(b.dataset.n, 10));
  });
  function toggleNotes() {
    noteMode = !noteMode;
    noteBtn.classList.toggle('on', noteMode);
    noteBtn.setAttribute('aria-pressed', String(noteMode));
    noteBtn.querySelector('b').textContent = noteMode ? 'Açık' : 'Kapalı';
  }
  noteBtn.addEventListener('click', toggleNotes);
  document.getElementById('undo').addEventListener('click', undo);
  document.getElementById('erase').addEventListener('click', erase);
  hintBtn.addEventListener('click', hint);
  document.getElementById('new').addEventListener('click', newGame);
  document.getElementById('new2').addEventListener('click', newGame);
  document.getElementById('retry').addEventListener('click', retry);
  levelEl.addEventListener('change', newGame);

  document.querySelector('.game-box').addEventListener('keydown', function (e) {
    var tag = e.target.tagName;
    if (tag === 'SELECT' || tag === 'INPUT' || e.altKey) return;
    var k = e.key, r = Math.floor(sel / 9), c = sel % 9, handled = true;
    if ((e.ctrlKey || e.metaKey) && (k === 'z' || k === 'Z')) { undo(); e.preventDefault(); return; }
    if (e.ctrlKey || e.metaKey) return;
    if (/^[1-9]$/.test(k)) input(parseInt(k, 10));
    else if (k === 'ArrowUp') r = (r + 8) % 9;
    else if (k === 'ArrowDown') r = (r + 1) % 9;
    else if (k === 'ArrowLeft') c = (c + 8) % 9;
    else if (k === 'ArrowRight') c = (c + 1) % 9;
    else if (k === 'Backspace' || k === 'Delete' || k === '0') erase();
    else if (k === 'n' || k === 'N') toggleNotes();
    else if (k === 'z' || k === 'Z') undo();
    else if (k === 'h' || k === 'H') hint();
    else handled = false;
    if (!handled) return;
    e.preventDefault();
    if (k.indexOf('Arrow') === 0) {
      gridEl.classList.add('kb');
      if (tag !== 'DIV') gridEl.focus();
      select(r * 9 + c);
    }
  });

  MiniOyun.oyun({
    restart: newGame,
    canPause: function () { return !over; },
    pause: function () { paused = true; stopTimer(); save(); },
    resume: function () { paused = false; startTimer(); }
  });

  init();
})();

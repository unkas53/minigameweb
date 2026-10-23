(function () {
  var LEVELS = { normal: 'Normal', zor: 'Zor mod' };
  var SAVE_KEY = 'kelime-tahmin-kayit';
  var STATS_KEY = 'kelime-tahmin-istatistik';
  var RECENT_KEY = 'kelime-tahmin-son';
  var CONTRAST_KEY = 'kelime-tahmin-kontrast';
  var ROWS = 6, LEN = 5, RECENT = 30, FLIP = 250;
  var ALPHABET = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ';
  var KEYS = [
    ['E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
    ['ENTER', 'Z', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç', 'SIL']
  ];
  var RANK = { gri: 1, sari: 2, yesil: 3 };

  var liste = window.KelimeTahminListe;
  var ANSWERS = liste.CEVAPLAR;
  var VALID = {};
  liste.GECERLI.concat(ANSWERS).forEach(function (w) { VALID[w] = true; });

  var gridEl = document.getElementById('grid');
  var kbEl = document.getElementById('klavye');
  var levelEl = document.getElementById('level');
  var triesEl = document.getElementById('tries');
  var streakEl = document.getElementById('streak');
  var bestEl = document.getElementById('best');
  var msgEl = document.getElementById('msg');
  var warnEl = document.getElementById('uyari');
  var wrapEl = document.getElementById('wrap');
  var contrastBtn = document.getElementById('kontrast');
  var statsDlg = document.getElementById('ist-dlg');
  var dailyMatch = location.search.match(/[?&]gunluk=(\d{4}-\d{2}-\d{2})/);
  var daily = dailyMatch ? dailyMatch[1] : '';

  var level = 'normal', answer = '', answerIdx = 0, guesses = [], current = '', over = false, busy = false;
  var rows = [], keyEls = {}, warnTimer = null;

  function load(key, def) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v === null ? def : v; } catch (e) { return def; }
  }
  function store(key, v) {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {}
  }
  function reduced() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function chars(w) { return Array.from(w); }

  // ---------- Renk mantığı ----------
  // Önce yeşiller işaretlenir, sonra gizli kelimede kalan harf adedi kadar sarı verilir; fazlası gri.
  function score(guess, target) {
    var g = chars(guess), t = chars(target), res = [], left = {}, i;
    for (i = 0; i < LEN; i++) {
      if (g[i] === t[i]) res[i] = 'yesil';
      else left[t[i]] = (left[t[i]] || 0) + 1;
    }
    for (i = 0; i < LEN; i++) {
      if (res[i]) continue;
      if (left[g[i]]) { res[i] = 'sari'; left[g[i]]--; } else res[i] = 'gri';
    }
    return res;
  }

  // Zor mod: önceki ipuçlarına uymayan tahmin için uyarı metni, uyuyorsa boş
  function hardError(guess) {
    var g = chars(guess);
    for (var k = 0; k < guesses.length; k++) {
      var prev = chars(guesses[k]), res = score(guesses[k], answer), need = {}, i;
      for (i = 0; i < LEN; i++) {
        if (res[i] === 'yesil' && g[i] !== prev[i]) return (i + 1) + '. harf ' + prev[i] + ' olmalı';
      }
      for (i = 0; i < LEN; i++) if (res[i] !== 'gri') need[prev[i]] = (need[prev[i]] || 0) + 1;
      for (var ch in need) {
        var have = g.filter(function (c) { return c === ch; }).length;
        if (have < need[ch]) return 'Tahmin ' + ch + ' harfini içermeli';
      }
    }
    return '';
  }

  // ---------- Çizim ----------
  function buildGrid() {
    gridEl.innerHTML = '';
    rows = [];
    for (var r = 0; r < ROWS; r++) {
      var row = document.createElement('div');
      row.className = 'kt-row';
      row.setAttribute('role', 'row');
      var tiles = [];
      for (var c = 0; c < LEN; c++) {
        var t = document.createElement('div');
        t.className = 'kt-tile';
        t.setAttribute('role', 'gridcell');
        t.style.setProperty('--i', c);
        row.appendChild(t);
        tiles.push(t);
      }
      gridEl.appendChild(row);
      rows.push({ el: row, tiles: tiles });
    }
  }

  function buildKeyboard() {
    KEYS.forEach(function (line) {
      var row = document.createElement('div');
      row.className = 'kt-sira';
      line.forEach(function (k) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'kt-key' + (k.length > 1 ? ' genis' : '');
        b.dataset.key = k;
        b.textContent = k === 'SIL' ? '⌫' : k;
        if (k === 'SIL') b.setAttribute('aria-label', 'Sil');
        if (k === 'ENTER') b.setAttribute('aria-label', 'Gönder');
        b.addEventListener('click', function () { press(k); b.blur(); });
        row.appendChild(b);
        if (k.length === 1) keyEls[k] = b;
      });
      kbEl.appendChild(row);
    });
  }

  function paintRow(r, word, res, animate) {
    var w = chars(word);
    rows[r].tiles.forEach(function (t, i) {
      t.textContent = w[i] || '';
      t.className = 'kt-tile' + (res ? ' ' + res[i] : (w[i] ? ' dolu' : ''));
      if (res && !animate) t.style.animation = 'none';
      else t.style.animation = '';
    });
  }

  function paintKeys() {
    var best = {};
    guesses.forEach(function (g) {
      var res = score(g, answer);
      chars(g).forEach(function (ch, i) {
        if (!best[ch] || RANK[res[i]] > RANK[best[ch]]) best[ch] = res[i];
      });
    });
    for (var k in keyEls) keyEls[k].className = 'kt-key' + (best[k] ? ' ' + best[k] : '');
  }

  function drawAll() {
    for (var r = 0; r < ROWS; r++) {
      if (r < guesses.length) paintRow(r, guesses[r], score(guesses[r], answer), false);
      else paintRow(r, r === guesses.length && !over ? current : '', null);
    }
    paintKeys();
    triesEl.textContent = guesses.length + '/' + ROWS;
    levelEl.value = level;
    levelEl.disabled = guesses.length > 0 && !over;
    streakEl.textContent = stats().seri;
    showBest();
  }

  function warn(text, shake) {
    warnEl.textContent = text;
    warnEl.classList.add('show');
    clearTimeout(warnTimer);
    warnTimer = setTimeout(function () { warnEl.classList.remove('show'); }, 1600);
    if (shake) {
      var row = rows[guesses.length].el;
      row.classList.remove('salla');
      void row.offsetWidth;
      row.classList.add('salla');
    }
  }

  // ---------- Rekor ve istatistik ----------
  function bestKey() { return 'kelime-tahmin-en-iyi-' + level; }
  function getBest() {
    try { return parseInt(localStorage.getItem(bestKey()), 10) || 0; } catch (e) { return 0; }
  }
  function showBest() {
    var b = getBest();
    bestEl.textContent = b ? b + '/6' : '-';
  }

  function stats() {
    var s = load(STATS_KEY, {});
    return {
      oynanan: s.oynanan || 0, kazanilan: s.kazanilan || 0, seri: s.seri || 0, enUzun: s.enUzun || 0,
      dagilim: s.dagilim && s.dagilim.length === ROWS ? s.dagilim : [0, 0, 0, 0, 0, 0], son: s.son || 0
    };
  }

  function recordStats(won) {
    var s = stats();
    s.oynanan++;
    if (won) {
      s.kazanilan++;
      s.seri++;
      s.enUzun = Math.max(s.enUzun, s.seri);
      s.dagilim[guesses.length - 1]++;
      s.son = guesses.length;
    } else {
      s.seri = 0;
      s.son = 0;
    }
    store(STATS_KEY, s);
    return s;
  }

  function drawStats() {
    var s = stats(), max = Math.max.apply(null, s.dagilim.concat(1));
    var box = document.getElementById('ist');
    box.innerHTML = '';
    [[s.oynanan, 'Oynanan'], [s.oynanan ? Math.round(s.kazanilan * 100 / s.oynanan) : 0, 'Kazanma %'], [s.seri, 'Seri'], [s.enUzun, 'En uzun seri']].forEach(function (x) {
      var d = document.createElement('div');
      d.innerHTML = '<b></b><small></small>';
      d.querySelector('b').textContent = x[0];
      d.querySelector('small').textContent = x[1];
      box.appendChild(d);
    });
    var dist = document.getElementById('dagilim');
    dist.innerHTML = '';
    s.dagilim.forEach(function (n, i) {
      var line = document.createElement('div'), bar = document.createElement('span');
      line.appendChild(document.createTextNode(i + 1));
      bar.textContent = n;
      bar.style.width = Math.max(8, Math.round(n * 100 / max)) + '%';
      if (s.son === i + 1) bar.className = 'son';
      line.appendChild(bar);
      dist.appendChild(line);
    });
  }

  function openStats() {
    drawStats();
    if (!statsDlg.open) statsDlg.showModal();
  }

  // ---------- Kayıt ----------
  function saveGame() {
    store(SAVE_KEY, { idx: answerIdx, guesses: guesses, level: level, daily: daily });
  }
  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  }
  function restore() {
    var s = load(SAVE_KEY, null);
    if (!s || s.daily !== daily || !ANSWERS[s.idx] || !LEVELS[s.level] || !Array.isArray(s.guesses)) return false;
    if (s.guesses.length >= ROWS || s.guesses.some(function (g) { return !VALID[g]; })) return false;
    answerIdx = s.idx;
    answer = ANSWERS[s.idx];
    level = s.level;
    guesses = s.guesses;
    if (guesses.indexOf(answer) !== -1) return false;
    return true;
  }

  // ---------- Oyun akışı ----------
  function pickAnswer() {
    var rnd = MiniOyun.rastgele();
    if (daily) return Math.floor(rnd() * ANSWERS.length);
    var recent = load(RECENT_KEY, []), idx;
    for (var tries = 0; tries < 50; tries++) {
      idx = Math.floor(rnd() * ANSWERS.length);
      if (recent.indexOf(ANSWERS[idx]) === -1) break;
    }
    store(RECENT_KEY, [ANSWERS[idx]].concat(recent.filter(function (w) { return w !== ANSWERS[idx]; })).slice(0, RECENT));
    return idx;
  }

  function newGame() {
    answerIdx = pickAnswer();
    answer = ANSWERS[answerIdx];
    guesses = [];
    current = '';
    over = false;
    busy = false;
    msgEl.textContent = '';
    saveGame();
    drawAll();
  }

  function blocked() { return over || busy || MiniOyun.duraklatildi() || statsDlg.open; }

  function press(k) {
    if (blocked()) return;
    if (k === 'ENTER') return submit();
    if (k === 'SIL') {
      if (!current) return;
      current = chars(current).slice(0, -1).join('');
    } else {
      if (chars(current).length >= LEN || ALPHABET.indexOf(k) === -1) return;
      current += k;
      MiniOyun.ses('tik');
    }
    paintRow(guesses.length, current, null);
  }

  function submit() {
    if (chars(current).length < LEN) return warn('Yeterli harf yok', true);
    if (!VALID[current]) return warn('Listede yok', true);
    if (level === 'zor') {
      var err = hardError(current);
      if (err) return warn(err, true);
    }
    var r = guesses.length, word = current;
    guesses.push(word);
    current = '';
    var res = score(word, answer);
    var won = word === answer, lost = !won && guesses.length >= ROWS;
    if (won || lost) { over = true; clearSave(); } else saveGame();
    paintRow(r, word, res, true);
    triesEl.textContent = guesses.length + '/' + ROWS;
    levelEl.disabled = !over;
    var wait = reduced() ? 0 : FLIP * (LEN - 1) + 500;
    busy = true;
    setTimeout(function () {
      busy = false;
      paintKeys();
      if (won) win(r); else if (lost) lose(); else MiniOyun.ses('puan');
    }, wait);
  }

  function shareText(won) {
    var lines = guesses.map(function (g) {
      return score(g, answer).map(function (c) { return c === 'yesil' ? '🟩' : c === 'sari' ? '🟨' : '⬛'; }).join('');
    });
    return 'Kelime Tahmin ' + (won ? guesses.length : 'X') + '/6' + (level === 'zor' ? '*' : '') + '\n' + lines.join('\n');
  }

  function win(r) {
    var n = guesses.length, rekor = false;
    var b = getBest();
    if (!b || n < b) {
      rekor = true;
      try { localStorage.setItem(bestKey(), String(n)); } catch (e) {}
    }
    var s = recordStats(true);
    drawAll();
    if (!reduced()) rows[r].tiles.forEach(function (t) { t.style.animation = ''; t.classList.add('zipla'); });
    var praise = ['Muhteşem!', 'Harika!', 'Çok iyi!', 'Güzel!', 'Tebrikler!', 'Son anda!'][n - 1];
    msgEl.textContent = praise + ' Kelimeyi ' + n + '. denemede buldun.';
    MiniOyun.bitti({
      baslik: praise,
      metin: 'Gizli kelime ' + answer + '. ' + n + '/6 denemede buldun (' + LEVELS[level] + '). Seri: ' + s.seri + ', kazanma oranı %' + Math.round(s.kazanilan * 100 / s.oynanan) + '.',
      rekor: rekor, skor: n, seviye: level, sonuc: n + '/6' + (level === 'zor' ? ' (Zor)' : ''), paylas: shareText(true)
    });
  }

  function lose() {
    var s = recordStats(false);
    drawAll();
    msgEl.textContent = 'Gizli kelime: ' + answer;
    MiniOyun.bitti({
      baslik: 'Bulamadın', metin: 'Gizli kelime ' + answer + ' idi. Seri sıfırlandı; oynanan ' + s.oynanan + ', kazanılan ' + s.kazanilan + '.',
      kaybetti: true, seviye: level, sonuc: 'X/6', paylas: shareText(false)
    });
  }

  // ---------- Girişler ----------
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'SELECT' || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.key === 'Enter') {
      if (t && t.tagName === 'BUTTON' && !t.classList.contains('kt-key')) return;
      e.preventDefault();
      press('ENTER');
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      press('SIL');
    } else if (e.key && e.key.length === 1) {
      var k = e.key.toLocaleUpperCase('tr-TR');
      if (ALPHABET.indexOf(k) !== -1) press(k);
    }
  });

  levelEl.addEventListener('change', function () {
    if (guesses.length && !over) { levelEl.value = level; return; }
    level = levelEl.value;
    if (over) newGame(); else { saveGame(); drawAll(); }
    levelEl.blur();
  });
  document.getElementById('new').addEventListener('click', function (e) { newGame(); e.currentTarget.blur(); });
  document.getElementById('stats').addEventListener('click', openStats);
  document.getElementById('ist-kapat').addEventListener('click', function () { statsDlg.close(); });
  statsDlg.addEventListener('click', function (e) { if (e.target === statsDlg) statsDlg.close(); });

  function drawContrast() {
    var on = load(CONTRAST_KEY, false) === true;
    wrapEl.classList.toggle('kontrast', on);
    contrastBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    contrastBtn.querySelector('b').textContent = on ? 'Açık' : 'Kapalı';
  }
  contrastBtn.addEventListener('click', function () { store(CONTRAST_KEY, !(load(CONTRAST_KEY, false) === true)); drawContrast(); });

  buildGrid();
  buildKeyboard();
  drawContrast();
  if (restore()) drawAll(); else newGame();

  MiniOyun.oyun({
    restart: newGame,
    seviye: function () { return level; }
  });
})();

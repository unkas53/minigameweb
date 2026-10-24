(function () {
  var ICONS = ['🍎', '🚀', '🐱', '⚽', '🎸', '🌵', '🍕', '💎'];
  // Kart temaları: her destede 18 emoji, 6x6 tahta tek desteyle dolar. Karışık'ın ilk 8'i klasik tahtadır.
  var THEMES = [
    { id: 'karisik', ad: 'Karışık', yildiz: 0, kartlar: ICONS.concat(['🎈', '🧩', '🌈', '🍩', '🎲', '🔑', '⏰', '🎁', '🌻', '🏀']) },
    { id: 'meyve', ad: 'Meyve', yildiz: 10, kartlar: ['🍎', '🍌', '🍇', '🍓', '🍉', '🍒', '🥝', '🍑', '🍍', '🥭', '🍅', '🥑', '🍋', '🥥', '🍈', '🍏', '🍐', '🍊'] },
    { id: 'uzay', ad: 'Uzay', yildiz: 20, kartlar: ['🚀', '🪐', '🌕', '🌍', '☄️', '🛸', '🌟', '🔭', '👽', '🛰️', '🌌', '⭐', '🌑', '🌞', '💫', '🌠', '🌙', '🌛'] },
    { id: 'hayvan', ad: 'Hayvan', yildiz: 30, kartlar: ['🐱', '🐶', '🦊', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🐧', '🦉', '🐙', '🦋', '🐢', '🦀', '🐝', '🐬', '🦄'] }
  ];
  // Sefer bölümleri: sütun, satır, 3 ve 2 yıldız hamle eşiği; süreli bölümlerde süre sınırı (sn) ve 3 yıldız süresi.
  var LEVELS = [
    [4, 4, 12, 16], [4, 4, 12, 16],
    [5, 4, 15, 20], [5, 4, 15, 20],
    [6, 4, 18, 24], [6, 4, 18, 24],
    [6, 5, 23, 30], [6, 5, 23, 30],
    [6, 6, 27, 36], [6, 6, 27, 36],
    [6, 6, 27, 0, 120, 90], [6, 6, 27, 0, 100, 75]
  ].map(function (a, i) { return { no: i + 1, sutun: a[0], satir: a[1], uc: a[2], iki: a[3], sinir: a[4] || 0, ucSure: a[5] || 0 }; });
  var SAVE_KEY = 'mo_hafiza';

  var cardsEl = document.getElementById('cards');
  var movesEl = document.getElementById('moves');
  var timeEl = document.getElementById('time');
  var timeLbl = document.getElementById('time-lbl');
  var msgEl = document.getElementById('msg');
  var bestEl = document.getElementById('best');
  var bestStat = document.getElementById('best-stat');
  var levelStat = document.getElementById('level-stat');
  var levelEl = document.getElementById('level');
  var mapBtn = document.getElementById('harita-btn');
  var nextBtn = document.getElementById('sonraki');
  var modesEl = document.getElementById('modlar');
  var mapEl = document.getElementById('harita');
  var levelsEl = document.getElementById('bolumler');
  var starsEl = document.getElementById('yildiz-sayac');
  var themesEl = document.getElementById('temalar');
  var daily = !!(MiniOyun.gunluk && MiniOyun.gunluk.tarih);
  var first, second, locked, moves, matched, pairs, seconds, timer, flipBack, paused, rnd, over;
  var L = null; // oynanan sefer bölümü; klasik modda null
  var progress = loadProgress();
  bestEl.textContent = MiniOyun.getBest('hafiza') || '-';

  // ---------- Kayıt ----------
  function loadProgress() {
    var p;
    try { p = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) {}
    if (!p || typeof p !== 'object') p = {};
    if (!p.yildiz || typeof p.yildiz !== 'object') p.yildiz = {};
    if (!Array.isArray(p.temalar)) p.temalar = [];
    if (p.mod !== 'sefer') p.mod = 'klasik';
    p.bolum = Math.min(Math.max(parseInt(p.bolum, 10) || 1, 1), LEVELS.length);
    return p;
  }
  function saveProgress() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch (e) {}
  }
  function stars(no) { return Math.min(Math.max(parseInt(progress.yildiz[no], 10) || 0, 0), 3); }
  function totalStars() {
    var n = 0;
    LEVELS.forEach(function (l) { n += stars(l.no); });
    return n;
  }
  function unlocked(no) { return no === 1 || stars(no - 1) > 0; }
  function themeOpen(t) { return totalStars() >= t.yildiz || progress.temalar.indexOf(t.id) >= 0; }
  function theme() {
    if (daily) return THEMES[0];
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === progress.tema && themeOpen(THEMES[i])) return THEMES[i];
    return THEMES[0];
  }
  function starText(n) { return '★★★'.slice(0, n) + '☆☆☆'.slice(n); }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // ---------- Süre ----------
  function showTime() { timeEl.textContent = L && L.sinir ? Math.max(L.sinir - seconds, 0) : seconds; }
  function startTimer() {
    if (timer || over) return;
    timer = setInterval(function () {
      seconds++;
      showTime();
      if (L && L.sinir && seconds >= L.sinir) timeUp();
    }, 1000);
  }
  function stopTimer() { clearInterval(timer); timer = null; }
  function timeUp() {
    stopTimer();
    over = locked = true;
    msgEl.textContent = 'Süre doldu, tekrar dene.';
    MiniOyun.bitti({ baslik: 'Süre doldu', metin: 'Süre doldu, tekrar dene. Bölüm ' + L.no + ' için yıldız kazanılmadı.', kaybetti: true, sonuc: 'Bölüm ' + L.no + ': süre doldu', seviye: 'bolum-' + L.no });
  }

  // ---------- Oyun ----------
  function flip(card) {
    if (locked || paused || over || MiniOyun.duraklatildi() || card === first || card.classList.contains('done')) return;
    startTimer();
    MiniOyun.ses('tik');
    card.classList.add('open');
    card.setAttribute('aria-label', card.dataset.icon);
    if (!first) { first = card; return; }

    second = card;
    moves++;
    movesEl.textContent = moves;

    if (first.dataset.icon === second.dataset.icon) {
      first.classList.add('done');
      second.classList.add('done');
      first = second = null;
      matched++;
      if (matched === pairs) finish(); else MiniOyun.ses('puan');
    } else {
      locked = true;
      flipBack = setTimeout(function () {
        flipBack = null;
        first.classList.remove('open');
        second.classList.remove('open');
        first.setAttribute('aria-label', 'Kapalı kart');
        second.setAttribute('aria-label', 'Kapalı kart');
        first = second = null;
        locked = false;
      }, 800);
    }
  }

  function finish() {
    stopTimer();
    over = true;
    if (L) return finishLevel();
    var rekor = MiniOyun.setBest('hafiza', moves, true);
    bestEl.textContent = MiniOyun.getBest('hafiza');
    msgEl.textContent = 'Tebrikler! ' + moves + ' hamlede, ' + seconds + ' saniyede bitirdin.';
    MiniOyun.bitti({ baslik: 'Tebrikler!', metin: moves + ' hamlede, ' + seconds + ' saniyede bitirdin.', rekor: rekor, skor: moves, sonuc: moves + ' hamle, ' + seconds + ' sn', paylas: 'Hafıza Kartları\'nı ' + moves + ' hamlede bitirdim! Sen kaç hamlede bitirirsin?' });
  }

  function finishLevel() {
    var n = L.sinir ? (moves <= L.uc && seconds <= L.ucSure ? 3 : 2) : (moves <= L.uc ? 3 : moves <= L.iki ? 2 : 1);
    var old = stars(L.no), before = totalStars();
    if (n > old) progress.yildiz[L.no] = n;
    THEMES.forEach(function (t) { if (themeOpen(t) && t.yildiz && progress.temalar.indexOf(t.id) < 0) progress.temalar.push(t.id); });
    var newTheme = THEMES.filter(function (t) { return t.yildiz > before && t.yildiz <= totalStars(); })[0];
    if (L.no < LEVELS.length) progress.bolum = L.no + 1;
    saveProgress();
    var done = L.no === LEVELS.length && n === 3;
    var text = 'Bölüm ' + L.no + ': ' + moves + ' hamle, ' + seconds + ' sn. ' + starText(n) + (n > old && old ? ' (yeni en iyi)' : '') +
      (newTheme ? ' Yeni kart teması açıldı: ' + newTheme.ad + '!' : '') + (done ? ' 12 bölümün hepsi bitti, tüm bölümleri istediğin gibi tekrar oynayabilirsin.' : '');
    msgEl.textContent = text;
    nextBtn.hidden = L.no >= LEVELS.length;
    MiniOyun.bitti({
      baslik: done ? 'Sefer tamamlandı!' : 'Bölüm ' + L.no + ' bitti!',
      metin: text, rekor: n > old && old > 0, skor: moves, seviye: 'bolum-' + L.no,
      sonuc: 'Bölüm ' + L.no + ': ' + moves + ' hamle, ' + starText(n),
      paylas: 'Hafıza Kartları Sefer modunda ' + L.no + '. bölümü ' + moves + ' hamlede ' + starText(n) + ' ile bitirdim!'
    });
  }

  function start() {
    clearTimeout(flipBack);
    flipBack = null;
    stopTimer();
    paused = over = false;
    rnd = MiniOyun.rastgele();
    first = second = null;
    locked = false;
    moves = matched = seconds = 0;
    movesEl.textContent = 0;
    showTime();
    msgEl.textContent = '';
    nextBtn.hidden = true;
    mapEl.hidden = true;
    cardsEl.hidden = false;
    var cols = L ? L.sutun : 4;
    pairs = L ? L.sutun * L.satir / 2 : ICONS.length;
    cardsEl.style.setProperty('--cols', cols);
    var t = theme(), deck = t.id === 'karisik' ? t.kartlar.slice(0, pairs) : shuffle(t.kartlar.slice()).slice(0, pairs);
    timeLbl.textContent = L && L.sinir ? 'Kalan' : 'Süre';
    levelEl.textContent = L ? L.no + '/' + LEVELS.length : '';
    cardsEl.innerHTML = '';
    shuffle(deck.concat(deck)).forEach(function (icon) {
      var card = document.createElement('button');
      card.className = 'card';
      card.dataset.icon = icon;
      card.textContent = icon;
      card.setAttribute('aria-label', 'Kapalı kart');
      card.addEventListener('click', function () { flip(card); });
      cardsEl.appendChild(card);
    });
  }

  function playLevel(no) {
    if (!unlocked(no)) return;
    L = LEVELS[no - 1];
    progress.bolum = no;
    saveProgress();
    start();
  }

  // ---------- Mod, harita ve temalar ----------
  function setMode(m) {
    progress.mod = m;
    saveProgress();
    Array.prototype.forEach.call(modesEl.children, function (b) { b.setAttribute('aria-pressed', b.dataset.mod === m ? 'true' : 'false'); });
    mapBtn.hidden = levelStat.hidden = m !== 'sefer';
    bestStat.hidden = m === 'sefer';
    if (m === 'sefer') showMap();
    else { L = null; start(); }
  }

  function showMap() {
    clearTimeout(flipBack);
    flipBack = null;
    stopTimer();
    L = null;
    over = true;
    seconds = moves = 0;
    movesEl.textContent = 0;
    timeLbl.textContent = 'Süre';
    showTime();
    levelEl.textContent = '-';
    msgEl.textContent = '';
    nextBtn.hidden = true;
    cardsEl.hidden = true;
    mapEl.hidden = false;
    starsEl.textContent = 'Yıldız: ' + totalStars() + '/' + LEVELS.length * 3;
    levelsEl.innerHTML = '';
    LEVELS.forEach(function (l) {
      var b = document.createElement('button');
      var open = unlocked(l.no);
      b.type = 'button';
      b.className = 'hf-bolum' + (open ? '' : ' kilitli') + (l.no === progress.bolum && open ? ' sirada' : '');
      b.dataset.bolum = l.no;
      b.disabled = !open;
      b.innerHTML = '<b>' + l.no + '</b><small>' + l.sutun + 'x' + l.satir + (l.sinir ? ' ⏱️' : '') + '</small><span>' + (open ? starText(stars(l.no)) : '🔒') + '</span>';
      b.setAttribute('aria-label', 'Bölüm ' + l.no + (open ? ', ' + stars(l.no) + ' yıldız' : ', kilitli'));
      b.addEventListener('click', function () { if (!MiniOyun.duraklatildi()) playLevel(l.no); });
      levelsEl.appendChild(b);
    });
    drawThemes();
  }

  function drawThemes() {
    themesEl.innerHTML = '';
    var cur = theme();
    THEMES.forEach(function (t) {
      var b = document.createElement('button');
      var open = themeOpen(t);
      b.type = 'button';
      b.className = 'hf-tema' + (open ? '' : ' kilitli');
      b.dataset.tema = t.id;
      b.disabled = !open;
      b.setAttribute('aria-pressed', t === cur ? 'true' : 'false');
      b.innerHTML = '<span aria-hidden="true">' + t.kartlar[0] + '</span> ' + t.ad + (open ? '' : '<small>' + t.yildiz + ' yıldızda açılır</small>');
      b.addEventListener('click', function () {
        if (!themeOpen(t) || MiniOyun.duraklatildi()) return;
        progress.tema = t.id;
        saveProgress();
        drawThemes();
        // Başlamamış tahta yeni temayla yeniden kurulur; süren oyun bozulmaz
        if (!cardsEl.hidden && !moves && !first && !over) start();
        else if (!cardsEl.hidden && !over) msgEl.textContent = t.ad + ' teması bir sonraki oyunda kullanılacak.';
      });
      themesEl.appendChild(b);
    });
  }

  Array.prototype.forEach.call(modesEl.children, function (b) {
    b.addEventListener('click', function () { if (!MiniOyun.duraklatildi()) setMode(b.dataset.mod); });
  });
  mapBtn.addEventListener('click', function () { if (!MiniOyun.duraklatildi()) showMap(); });
  nextBtn.addEventListener('click', function () { if (L && L.no < LEVELS.length) playLevel(L.no + 1); });
  function restart() {
    if (progress.mod === 'sefer' && !daily) playLevel(L ? L.no : (unlocked(progress.bolum) ? progress.bolum : 1));
    else start();
  }
  document.getElementById('restart').addEventListener('click', restart);
  MiniOyun.oyun({
    restart: restart,
    canPause: function () { return !!timer; },
    pause: function () { paused = true; stopTimer(); },
    resume: function () { paused = false; startTimer(); },
    seviye: function () { return L ? 'bolum-' + L.no : ''; }
  });

  if (daily) {
    // Günlük meydan okuma her zaman klasik 4x4 ve Karışık temadır
    modesEl.hidden = themesEl.hidden = true;
    start();
  } else {
    drawThemes();
    setMode(progress.mod);
  }
})();

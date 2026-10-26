(function () {
  var LEVELS = {
    kolay: { size: 9, mines: 10 },
    orta: { size: 12, mines: 24 },
    zor: { size: 16, mines: 45 }
  };
  var LONG_PRESS = 400;
  var M = window.MayinMotor;
  var BOLUMLER = M.BOLUMLER, BOLGELER = M.BOLGELER, TEMALAR = M.TEMALAR;
  var KAYIT = 'mo_mayin';

  var boardEl = document.getElementById('board');
  var minesEl = document.getElementById('mines');
  var timeEl = document.getElementById('time');
  var bestEl = document.getElementById('best');
  var faceEl = document.getElementById('face');
  var levelEl = document.getElementById('level');
  var modeEl = document.getElementById('mode');
  var msgEl = document.getElementById('msg');
  var againEl = document.getElementById('again');
  var sekmeEl = document.getElementById('mod-sekme');
  var haritaEl = document.getElementById('harita');
  var oyunEl = document.getElementById('ms-oyun');
  var bolumStat = document.getElementById('ms-bolum-stat');
  var bolumEl = document.getElementById('ms-bolum');
  var hedefEl = document.getElementById('ms-hedef');
  var haritaBtn = document.getElementById('ms-harita');
  var temalarEl = document.getElementById('temalar');

  // R x C ızgara; aktif[i] false olan kareler "kapalı"dır (Sefer biçimleri), klasikte hepsi aktif.
  var level, R, C, aktif, aktifSay, mineCount, cells, els, placed, over, flags, opened, seconds, timer, cursor, flagMode = false;
  var pressTimer = null, suppressClick = false, lastTouch = 0, paused = false;
  var bayrakIz; // Sefer: bayrak konan tüm kareler (sonradan kaldırılsa da yanlış bayrak sayılır)

  // ---------- Kalıcı kayıt ----------
  function yukle() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KAYIT)); } catch (e) { s = null; }
    if (!s || typeof s !== 'object') s = {};
    var bolumler = {};
    if (s.bolumler && typeof s.bolumler === 'object') {
      for (var k in s.bolumler) {
        var b = s.bolumler[k], n = parseInt(k, 10);
        if (n >= 1 && n <= BOLUMLER.length && b && b.yildiz >= 1 && b.yildiz <= 3) {
          bolumler[n] = { yildiz: Math.floor(b.yildiz), enIyiSn: typeof b.enIyiSn === 'number' ? b.enIyiSn : null };
        }
      }
    }
    var acik = Array.isArray(s.acikTemalar) ? s.acikTemalar.filter(function (t) { return temaBul(t); }) : [];
    if (acik.indexOf('klasik') === -1) acik.unshift('klasik');
    return {
      mod: s.mod === 'sefer' ? 'sefer' : 'klasik',
      bolumler: bolumler,
      tema: temaBul(s.tema) && acik.indexOf(s.tema) !== -1 ? s.tema : 'klasik',
      acikTemalar: acik
    };
  }
  function kaydet() { try { localStorage.setItem(KAYIT, JSON.stringify(kayit)); } catch (e) {} }
  function temaBul(id) { for (var i = 0; i < TEMALAR.length; i++) if (TEMALAR[i].id === id) return TEMALAR[i]; return null; }
  function tema() { return temaBul(kayit.tema) || TEMALAR[0]; }
  function toplamYildiz() { var n = 0; for (var k in kayit.bolumler) n += kayit.bolumler[k].yildiz; return n; }
  function acikMi(n) { return n === 1 || !!kayit.bolumler[n - 1]; }
  function temalariGuncelle() {
    var t = toplamYildiz(), yeni = [];
    TEMALAR.forEach(function (tm) {
      if (tm.esik <= t && kayit.acikTemalar.indexOf(tm.id) === -1) { kayit.acikTemalar.push(tm.id); yeni.push(tm); }
    });
    return yeni;
  }

  var kayit = yukle();
  temalariGuncelle();
  var mod = kayit.mod;
  var ekran = 'oyun'; // Sefer'de 'harita' veya 'oyun'
  var bolum = 0, B = null;

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
    if (mod === 'sefer') {
      var kb = kayit.bolumler[bolum];
      bestEl.textContent = kb && kb.enIyiSn !== null ? kb.enIyiSn + ' sn' : '-';
      return;
    }
    var b = getBest();
    bestEl.textContent = b !== null ? b + ' sn' : '-';
  }

  function neighbors(i) { return M.komsular(R, C, aktif, i); }

  function placeMines(safe) {
    if (mod === 'sefer') {
      var u = M.uret(B, safe, MiniOyun.rastgele());
      u.mayinlar.forEach(function (m, i) { cells[i].mine = m; });
    } else {
      var banned = {};
      banned[safe] = true;
      neighbors(safe).forEach(function (n) { banned[n] = true; });
      var pool = [];
      for (var i = 0; i < R * C; i++) if (!banned[i]) pool.push(i);
      for (var k = 0; k < mineCount; k++) {
        var j = k + Math.floor(Math.random() * (pool.length - k));
        var t = pool[k]; pool[k] = pool[j]; pool[j] = t;
        cells[pool[k]].mine = true;
      }
    }
    cells.forEach(function (cell, idx) {
      cell.count = aktif[idx] ? neighbors(idx).filter(function (n) { return cells[n].mine; }).length : 0;
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

  function updateCounter() { minesEl.textContent = mineCount - flags; }

  function draw(i) {
    var cell = cells[i], el = els[i], tm = tema();
    if (!aktif[i]) { el.className = 'cell bos' + (i === cursor ? ' cur' : ''); return; }
    el.className = 'cell' + (i === cursor ? ' cur' : '');
    el.textContent = '';
    if (cell.open) {
      el.classList.add('open');
      if (cell.mine) {
        el.textContent = tm.mayin;
        if (cell.boom) el.classList.add('boom');
      } else if (cell.count) {
        el.textContent = cell.count;
        el.classList.add('n' + cell.count);
      }
    } else if (cell.wrong) {
      el.textContent = '❌';
    } else if (cell.flag) {
      el.textContent = tm.bayrak;
      el.classList.add('bayrak');
    }
  }

  function open(i) {
    var cell = cells[i];
    if (over || !aktif[i] || cell.open || cell.flag) return;
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
    if (opened === aktifSay - mineCount) win();
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
    if (over || paused || MiniOyun.duraklatildi() || !aktif[i] || cell.open) return;
    cell.flag = !cell.flag;
    flags += cell.flag ? 1 : -1;
    if (cell.flag) bayrakIz[i] = true;
    updateCounter();
    draw(i);
  }

  function act(i, wantFlag) {
    if (paused || MiniOyun.duraklatildi()) return;
    setCursor(i);
    if (!aktif[i]) return;
    if (cells[i].open) { chord(i); return; }
    if (wantFlag) toggleFlag(i); else open(i);
  }

  function end(text) {
    over = true;
    stopTimer();
    msgEl.textContent = text;
  }

  function dugme(metin, sinif, fn) {
    var b = document.createElement('button');
    b.className = sinif; b.type = 'button';
    b.textContent = metin;
    b.addEventListener('click', fn);
    msgEl.appendChild(document.createTextNode(' '));
    msgEl.appendChild(b);
  }

  function lose() {
    cells.forEach(function (cell, i) {
      if (!aktif[i]) return;
      if (cell.mine && !cell.flag) cell.open = true;
      if (!cell.mine && cell.flag) cell.wrong = true;
      draw(i);
    });
    faceEl.textContent = '😵';
    if (mod === 'sefer') {
      end('Mayına bastın! Bu tahta tahmin gerektirmiyordu, sayılara tekrar bak.');
      dugme('Tekrar dene', 'btn', function () { bolumBaslat(bolum); });
      dugme('🗺️ Harita', 'btn btn-ghost', haritaGoster);
      MiniOyun.bitti({ baslik: 'Bölüm ' + bolum + ' olmadı', metin: 'Mayına bastın. Sefer tahtaları her zaman mantıkla çözülebilir; tekrar dene!', kaybetti: true });
      return;
    }
    end('Mayına bastın! Tekrar dene.');
    againEl.classList.add('show');
    MiniOyun.bitti({ baslik: 'Mayına bastın!', metin: 'Bir dahakine daha dikkatli ol.', kaybetti: true, paylas: 'Mayın Tarlası\'nda şansını dene!' });
  }

  function win() {
    cells.forEach(function (cell, i) {
      if (cell.mine && !cell.flag) { cell.flag = true; draw(i); }
    });
    flags = mineCount;
    updateCounter();
    faceEl.textContent = '😎';
    if (mod === 'sefer') return seferKazandi();
    var prev = getBest();
    saveBest(seconds);
    showBest();
    var rekor = prev === null || seconds < prev;
    end('Tebrikler! ' + seconds + ' saniyede temizledin.' + (rekor ? ' Yeni rekor!' : ''));
    againEl.classList.add('show');
    MiniOyun.bitti({ baslik: 'Tebrikler!', metin: seconds + ' saniyede temizledin.', rekor: rekor, skor: seconds, sonuc: seconds + ' sn', paylas: 'Mayın Tarlası\'nı ' + seconds + ' saniyede temizledim! Sen kaç saniyede bitirirsin?' });
  }

  function seferKazandi() {
    var yanlis = false;
    for (var k in bayrakIz) if (!cells[k].mine) yanlis = true;
    var y = M.yildiz(B, seconds, yanlis), onceki = kayit.bolumler[bolum];
    var kb = onceki || { yildiz: 0, enIyiSn: null };
    kb.yildiz = Math.max(kb.yildiz, y);
    if (kb.enIyiSn === null || seconds < kb.enIyiSn) kb.enIyiSn = seconds;
    kayit.bolumler[bolum] = kb;
    var yeniTema = temalariGuncelle();
    kaydet();
    showBest();
    var eksik = [];
    if (seconds > B.hedef) eksik.push(B.hedef + ' sn içinde bitir');
    if (yanlis) eksik.push('yanlış bayrak koymadan bitir');
    var metin = y + ' ⭐ · ' + seconds + ' sn. ';
    if (eksik.length) metin += 'Eksik yıldız için: ' + eksik.join(', ') + '. ';
    var sonraki = bolum < BOLUMLER.length ? bolum + 1 : 0;
    if (sonraki) metin += onceki ? 'Sonraki bölüm açık.' : 'Sonraki bölüm açıldı.';
    else metin += 'Seferin tamamını bitirdin!';
    if (yeniTema.length) metin += ' Yeni tema açıldı: ' + yeniTema.map(function (t) { return t.ad; }).join(', ') + '.';
    end('Bölüm ' + bolum + ' temizlendi! ' + metin);
    if (sonraki) dugme('Sonraki bölüm →', 'btn', function () { bolumBaslat(sonraki); });
    dugme('🗺️ Harita', 'btn btn-ghost', haritaGoster);
    temaCiz();
    MiniOyun.bitti({ baslik: 'Bölüm ' + bolum + ' temizlendi!', metin: metin, sonuc: 'Bölüm ' + bolum + ': ' + y + ' yıldız', paylas: 'Mayın Seferi Bölüm ' + bolum + '\'i ' + seconds + ' saniyede ' + y + ' yıldızla bitirdim!' });
  }

  function setCursor(i) {
    var old = cursor;
    cursor = i;
    if (old !== undefined && old !== i && els[old]) draw(old);
    draw(i);
  }

  // Tahtayı kurar: klasikte seçili zorluk, Sefer'de bölüm tanımı
  function tahtaKur() {
    stopTimer();
    paused = false;
    if (mod === 'sefer') {
      R = B.R; C = B.C; aktif = B.aktif; mineCount = B.mayin;
    } else {
      level = levelEl.value;
      R = C = LEVELS[level].size;
      aktif = [];
      for (var a = 0; a < R * C; a++) aktif.push(true);
      mineCount = LEVELS[level].mines;
    }
    aktifSay = aktif.filter(Boolean).length;
    cells = [];
    els = [];
    bayrakIz = {};
    placed = over = false;
    flags = opened = seconds = 0;
    cursor = Math.floor(R / 2) * C + Math.floor(C / 2);
    timeEl.textContent = 0;
    msgEl.textContent = '';
    faceEl.textContent = '🙂';
    againEl.classList.remove('show');
    updateCounter();
    showBest();
    boardEl.style.setProperty('--cols', C);
    boardEl.dataset.tema = tema().id;
    boardEl.innerHTML = '';
    for (var i = 0; i < R * C; i++) {
      cells.push({ mine: false, open: false, flag: false, count: 0 });
      var el = document.createElement('div');
      el.dataset.i = i;
      el.setAttribute('role', 'gridcell');
      els.push(el);
      boardEl.appendChild(el);
      draw(i);
    }
  }

  function start() {
    if (mod === 'sefer') { if (ekran === 'oyun' && bolum) bolumBaslat(bolum); return; }
    tahtaKur();
  }

  // ---------- Sefer ----------
  function bolumBaslat(n) {
    if (!acikMi(n)) return;
    bolum = n; B = BOLUMLER[n - 1];
    ekran = 'oyun';
    gorunum();
    tahtaKur();
    var g = BOLGELER[B.bolge];
    bolumEl.textContent = n;
    hedefEl.textContent = g.ikon + ' ' + g.ad + ' · ' + M.BICIMLER[B.bicim].ad + ' · ' + B.mayin + ' mayın · ⭐ hedef: ' + B.hedef + ' sn, yanlış bayrak yok';
    if (boardEl.scrollIntoView) boardEl.scrollIntoView({ block: 'nearest' });
  }

  function yildizYaz(y) { return '★★★'.slice(0, y) + '☆☆☆'.slice(0, 3 - y); }

  function haritaCiz() {
    var html = '<p class="mt-toplam">⭐ <b id="ms-toplam">' + toplamYildiz() + '</b>/' + BOLUMLER.length * 3 + '</p>';
    BOLGELER.forEach(function (g, gi) {
      html += '<h2>' + g.ikon + ' Bölge ' + (gi + 1) + ': ' + g.ad + '</h2><div class="mt-bolumler">';
      BOLUMLER.forEach(function (b) {
        if (b.bolge !== gi) return;
        var acik = acikMi(b.n), kb = kayit.bolumler[b.n], y = kb ? kb.yildiz : 0;
        html += '<button type="button" class="mt-bolum' + (acik ? '' : ' kilitli') + '" data-bolum="' + b.n + '"' + (acik ? '' : ' disabled') +
          ' aria-label="Bölüm ' + b.n + (acik ? ', ' + y + ' yıldız' : ', kilitli') + '"><b>' + (acik ? b.n : '🔒') + '</b>' +
          '<small>' + M.BICIMLER[b.bicim].ad + '</small><span>' + yildizYaz(y) + '</span></button>';
      });
      html += '</div>';
    });
    html += '<p>Bir bölümden en az 1 yıldız almak sonrakini açar. Yıldızlar: bitir, süre hedefini tut, hiç yanlış bayrak koyma.</p>';
    haritaEl.innerHTML = html;
  }

  function haritaGoster() {
    stopTimer();
    over = true;
    placed = false;
    ekran = 'harita';
    msgEl.textContent = '';
    haritaCiz();
    gorunum();
  }

  function temaCiz() {
    var t = toplamYildiz(), html = '<span class="mt-tema-baslik">Tema:</span>';
    TEMALAR.forEach(function (tm) {
      var acik = kayit.acikTemalar.indexOf(tm.id) !== -1, sec = kayit.tema === tm.id;
      html += '<button type="button" class="mt-tema' + (sec ? ' secili' : '') + '" data-tema="' + tm.id + '"' + (acik ? '' : ' disabled') +
        ' aria-pressed="' + sec + '">' + (acik ? tm.mayin + ' ' + tm.ad : '🔒 ' + tm.ad + ' · ' + tm.esik + ' ⭐') + '</button>';
    });
    temalarEl.innerHTML = html;
    temalarEl.title = 'Toplam ' + t + ' yıldız';
  }

  function gorunum() {
    sekmeEl.querySelectorAll('button').forEach(function (b) {
      var sec = b.getAttribute('data-mod') === mod;
      b.classList.toggle('secili', sec);
      b.setAttribute('aria-selected', sec);
    });
    var harita = mod === 'sefer' && ekran === 'harita';
    haritaEl.hidden = !harita;
    oyunEl.hidden = harita;
    levelEl.hidden = mod === 'sefer';
    bolumStat.hidden = mod !== 'sefer';
    haritaBtn.hidden = mod !== 'sefer';
    hedefEl.hidden = mod !== 'sefer';
  }

  function modSec(m) {
    if (m === mod) return;
    mod = m; kayit.mod = m; kaydet();
    if (m === 'sefer') haritaGoster();
    else { ekran = 'oyun'; gorunum(); tahtaKur(); }
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
      if (!cells[i].open && aktif[i]) {
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
    var r = Math.floor(cursor / C), c = cursor % C, handled = true;
    switch (e.key) {
      case 'ArrowUp': r = Math.max(0, r - 1); break;
      case 'ArrowDown': r = Math.min(R - 1, r + 1); break;
      case 'ArrowLeft': c = Math.max(0, c - 1); break;
      case 'ArrowRight': c = Math.min(C - 1, c + 1); break;
      case ' ': case 'Enter': act(cursor, false); break;
      case 'f': case 'F': if (cells[cursor].open) handled = false; else toggleFlag(cursor); break;
      case 'n': case 'N': if (mod === 'sefer') bolumBaslat(bolum); else start(); break;
      default: handled = false;
    }
    if (!handled) return;
    e.preventDefault();
    boardEl.classList.add('kb');
    if (e.key.indexOf('Arrow') === 0) setCursor(r * C + c);
  });

  modeEl.addEventListener('click', function () {
    flagMode = !flagMode;
    modeEl.textContent = flagMode ? '🚩 Bayrak' : '⛏️ Kaz';
    modeEl.classList.toggle('flag', flagMode);
  });
  faceEl.addEventListener('click', start);
  againEl.addEventListener('click', start);
  levelEl.addEventListener('change', start);
  haritaBtn.addEventListener('click', haritaGoster);
  sekmeEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-mod]');
    if (b) modSec(b.getAttribute('data-mod'));
  });
  haritaEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-bolum]');
    if (b && !b.disabled) bolumBaslat(parseInt(b.getAttribute('data-bolum'), 10));
  });
  temalarEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-tema]');
    if (!b || b.disabled) return;
    kayit.tema = b.getAttribute('data-tema');
    kaydet();
    temaCiz();
    boardEl.dataset.tema = kayit.tema;
    if (cells) cells.forEach(function (cell, i) { draw(i); });
  });

  MiniOyun.oyun({
    restart: start,
    // Liderlik tablosu yalnızca klasik moddan beslenir; Sefer'de skor gönderilmez
    seviye: function () { return levelEl.value; },
    canPause: function () { return placed && !over; },
    pause: function () { paused = true; stopTimer(); },
    resume: function () { paused = false; if (placed && !over) startTimer(); }
  });

  temaCiz();
  if (mod === 'sefer') {
    // Haritanın arkasında boş bir tahta dursun ki tema/klavye işleyicileri hazır olsun
    B = BOLUMLER[0]; bolum = 1; tahtaKur(); haritaGoster();
  } else {
    gorunum();
    tahtaKur();
  }
})();

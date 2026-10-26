(function () {
  var M = window.MayinMotor, BOLUMLER = M.BOLUMLER, DUNYALAR = M.DUNYALAR, TEMALAR = M.TEMALAR;
  var LEVELS = {
    kolay: { size: 9, mines: 10 },
    orta: { size: 12, mines: 24 },
    zor: { size: 16, mines: 45 }
  };
  var LONG_PRESS = 400;
  var SAVE_KEY = 'mo_mayin';
  var gunlukMod = !!MiniOyun.gunluk.tarih;

  var boardEl = document.getElementById('board');
  var minesEl = document.getElementById('mines');
  var timeEl = document.getElementById('time');
  var bestEl = document.getElementById('best');
  var faceEl = document.getElementById('face');
  var levelEl = document.getElementById('level');
  var temaEl = document.getElementById('tema');
  var modeEl = document.getElementById('mode');
  var msgEl = document.getElementById('msg');
  var againEl = document.getElementById('again');
  var sekmeEl = document.getElementById('mod-sekme');
  var haritaEl = document.getElementById('harita');
  var oyunEl = document.getElementById('ms-oyun');
  var bestStat = document.getElementById('best-stat');
  var bolumStat = document.getElementById('bolum-stat');
  var bolumEl = document.getElementById('ms-bolum');
  var ipucuEl = document.getElementById('ms-ipucu');
  var haritaBtn = document.getElementById('ms-harita');

  // ---------- Kayıt ----------
  function yukle() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) {}
    if (!s || typeof s !== 'object') s = {};
    var bolumler = {};
    if (s.bolumler && typeof s.bolumler === 'object') {
      Object.keys(s.bolumler).forEach(function (k) {
        var b = s.bolumler[k], y = b && Number(b.yildiz), sn = b && Number(b.enIyiSn);
        if (BOLUMLER[Number(k) - 1] && y >= 1 && y <= 3) bolumler[k] = { yildiz: Math.floor(y), enIyiSn: sn >= 0 ? Math.floor(sn) : null };
      });
    }
    var tema = TEMALAR.some(function (t) { return t.id === s.tema; }) ? s.tema : 'klasik';
    return { mod: s.mod === 'sefer' ? 'sefer' : 'klasik', bolumler: bolumler, tema: tema, acikTemalar: [] };
  }
  var kayit = yukle();
  function kaydet() {
    kayit.acikTemalar = TEMALAR.filter(temaAcik).map(function (t) { return t.id; });
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(kayit)); } catch (e) {}
  }
  function toplamYildiz() {
    var t = 0;
    Object.keys(kayit.bolumler).forEach(function (k) { t += kayit.bolumler[k].yildiz; });
    return t;
  }
  function acikMi(n) { return n === 1 || !!kayit.bolumler[n - 1]; }
  function temaAcik(t) { return toplamYildiz() >= t.esik; }
  function tema() {
    var t = TEMALAR.filter(function (x) { return x.id === kayit.tema; })[0];
    return t && temaAcik(t) ? t : TEMALAR[0];
  }
  function yildizYaz(y) { return '★'.repeat(y) + '☆'.repeat(3 - y); }

  // ---------- Durum ----------
  var mod = gunlukMod ? 'klasik' : kayit.mod;
  var ekran = 'oyun'; // Sefer'de 'harita' veya 'oyun'
  var bolum = 0, B = null;
  var level, cols, rows, total, maske, mineCount, playable;
  var cells, els, placed, over, flags, opened, seconds, timer, cursor, flagMode = false, yanlisBayrak;
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

  function neighbors(i) { return M.komsular(cols, rows, maske, i); }

  function placeMines(safe) {
    if (mod === 'sefer') {
      // Tohumlu üreteç: aynı tohum aynı tahtayı verir; çözücü tahminsiz bitirebilmeli
      var tohum = Math.floor(MiniOyun.rastgele()() * 1e9);
      var sonuc = M.uret(B, safe, MiniOyun.gunluk.rastgele('mayin-sefer/' + bolum + '/' + safe + '/' + tohum));
      Object.keys(sonuc.mayinlar).forEach(function (k) { cells[k].mine = true; });
    } else {
      var banned = {};
      banned[safe] = true;
      neighbors(safe).forEach(function (n) { banned[n] = true; });
      var pool = [];
      for (var i = 0; i < total; i++) if (!banned[i]) pool.push(i);
      for (var k = 0; k < mineCount; k++) {
        var j = k + Math.floor(Math.random() * (pool.length - k));
        var t = pool[k]; pool[k] = pool[j]; pool[j] = t;
        cells[pool[k]].mine = true;
      }
    }
    cells.forEach(function (cell, idx) {
      cell.count = neighbors(idx).filter(function (n) { return cells[n].mine; }).length;
      // İlk tıklamadan önce konan bayraklar da sayılır
      if (cell.flag && !cell.mine) yanlisBayrak = true;
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
    var cell = cells[i], el = els[i], T = tema();
    if (!maske[i]) { el.className = 'cell bos'; return; }
    el.className = 'cell' + (i === cursor ? ' cur' : '');
    el.textContent = '';
    if (cell.open) {
      el.classList.add('open');
      if (cell.mine) {
        el.textContent = T.mayin;
        if (cell.boom) el.classList.add('boom');
      } else if (cell.count) {
        el.textContent = cell.count;
        el.classList.add('n' + cell.count);
      }
    } else if (cell.wrong) {
      el.textContent = '❌';
    } else if (cell.flag) {
      el.textContent = T.bayrak;
    }
  }

  function open(i) {
    var cell = cells[i];
    if (over || !maske[i] || cell.open || cell.flag) return;
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
    if (opened === playable - mineCount) win();
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
    if (over || paused || MiniOyun.duraklatildi() || !maske[i] || cell.open) return;
    cell.flag = !cell.flag;
    if (cell.flag && placed && !cell.mine) yanlisBayrak = true;
    flags += cell.flag ? 1 : -1;
    updateCounter();
    draw(i);
  }

  function act(i, wantFlag) {
    if (paused || MiniOyun.duraklatildi() || !maske[i]) return;
    setCursor(i);
    if (cells[i].open) { chord(i); return; }
    if (wantFlag) toggleFlag(i); else open(i);
  }

  function end(text) {
    over = true;
    stopTimer();
    msgEl.textContent = text;
    if (mod === 'klasik') againEl.classList.add('show');
  }

  function dugme(id, metin, sinif, fn) {
    var b = document.createElement('button');
    b.className = sinif; b.type = 'button'; b.id = id;
    b.textContent = metin;
    b.addEventListener('click', fn);
    msgEl.appendChild(document.createTextNode(' '));
    msgEl.appendChild(b);
  }

  function lose() {
    cells.forEach(function (cell, i) {
      if (!maske[i]) return;
      if (cell.mine && !cell.flag) cell.open = true;
      if (!cell.mine && cell.flag) cell.wrong = true;
      draw(i);
    });
    faceEl.textContent = '😵';
    if (mod === 'sefer') {
      end('Mayına bastın! Bölümü yeniden dene.');
      dugme('ms-tekrar', 'Tekrar dene', 'btn', function () { bolumBaslat(bolum); });
      dugme('ms-harita2', '🗺️ Harita', 'btn btn-ghost', haritaGoster);
      MiniOyun.bitti({ baslik: 'Bölüm ' + bolum + ' olmadı', metin: 'Mayına bastın! Sefer tahtaları tahmin gerektirmez; sayılara bakarak yeniden dene.', kaybetti: true });
      return;
    }
    end('Mayına bastın! Tekrar dene.');
    MiniOyun.bitti({ baslik: 'Mayına bastın!', metin: 'Bir dahakine daha dikkatli ol.', kaybetti: true, paylas: 'Mayın Tarlası\'nda şansını dene!' });
  }

  function win() {
    cells.forEach(function (cell, i) {
      if (cell.mine && !cell.flag) { cell.flag = true; draw(i); }
    });
    flags = mineCount;
    updateCounter();
    faceEl.textContent = '😎';
    if (mod === 'sefer') { bolumKazandi(); return; }
    var prev = getBest();
    saveBest(seconds);
    showBest();
    var rekor = prev === null || seconds < prev;
    end('Tebrikler! ' + seconds + ' saniyede temizledin.' + (rekor ? ' Yeni rekor!' : ''));
    MiniOyun.bitti({ baslik: 'Tebrikler!', metin: seconds + ' saniyede temizledin.', rekor: rekor, skor: seconds, sonuc: seconds + ' sn', paylas: 'Mayın Tarlası\'nı ' + seconds + ' saniyede temizledim! Sen kaç saniyede bitirirsin?' });
  }

  // ---------- Sefer ----------
  function bolumKazandi() {
    var y = M.yildiz(B, seconds, yanlisBayrak), onceki = kayit.bolumler[bolum], eskiToplam = toplamYildiz();
    var kayitli = { yildiz: Math.max(y, onceki ? onceki.yildiz : 0), enIyiSn: onceki && onceki.enIyiSn !== null && onceki.enIyiSn <= seconds ? onceki.enIyiSn : seconds };
    kayit.bolumler[bolum] = kayitli;
    kaydet();
    var yeniTema = TEMALAR.filter(function (t) { return t.esik > eskiToplam && t.esik <= toplamYildiz(); })[0];
    var sonraki = BOLUMLER[bolum] ? bolum + 1 : 0;
    var eksik = [];
    if (seconds > B.hedef) eksik.push(B.hedef + ' sn altında bitir');
    if (yanlisBayrak) eksik.push('yanlış bayrak koymadan bitir');
    var metin = y + ' ⭐ · ' + seconds + ' sn. ';
    if (eksik.length) metin += 'Eksik yıldız için: ' + eksik.join(', ') + '. ';
    if (sonraki) metin += onceki ? 'Sonraki bölüm açık.' : 'Sonraki bölüm açıldı.';
    else metin += 'Seferin tamamını bitirdin!';
    if (yeniTema) metin += ' Yeni tema açıldı: ' + yeniTema.ad + '.';
    end('Bölüm ' + bolum + ' temizlendi! ' + yildizYaz(y));
    if (sonraki) dugme('ms-sonraki', 'Sonraki bölüm →', 'btn', function () { bolumBaslat(sonraki); });
    dugme('ms-harita2', '🗺️ Harita', 'btn btn-ghost', haritaGoster);
    temaListesi();
    MiniOyun.bitti({ baslik: 'Bölüm ' + bolum + ' tamam!', metin: metin, sonuc: 'Bölüm ' + bolum + ': ' + y + ' yıldız', paylas: 'Mayın Seferi Bölüm ' + bolum + '\'i ' + seconds + ' saniyede ' + y + ' yıldızla bitirdim!' });
  }

  function bolumBaslat(n) {
    bolum = n; B = BOLUMLER[n - 1];
    ekran = 'oyun';
    start();
    gorunum();
    if (boardEl.scrollIntoView) boardEl.scrollIntoView({ block: 'nearest' });
  }

  function haritaCiz() {
    var toplam = toplamYildiz();
    var html = '<p>Toplam: <b id="ms-toplam">⭐ ' + toplam + '/' + BOLUMLER.length * 3 + '</b></p>';
    DUNYALAR.forEach(function (d, di) {
      html += '<h2>' + d.ikon + ' ' + d.ad + ' <small>' + d.alt + '</small></h2><div class="ms-bolumler">';
      BOLUMLER.forEach(function (b) {
        if (b.dunya !== di) return;
        var acik = acikMi(b.n), k = kayit.bolumler[b.n], y = k ? k.yildiz : 0;
        html += '<button type="button" class="ms-bolum' + (acik ? '' : ' kilitli') + '" data-bolum="' + b.n + '"' + (acik ? '' : ' disabled') +
          ' aria-label="Bölüm ' + b.n + (acik ? ', ' + y + ' yıldız' : ', kilitli') + '"><b>' + (acik ? b.n : '🔒') + '</b>' +
          '<small>' + b.mayin + ' mayın</small><span>' + yildizYaz(y) + '</span></button>';
      });
      html += '</div>';
    });
    html += '<p>Yıldızlarla yeni temalar açılır: ' + TEMALAR.slice(1).map(function (t) {
      return t.mayin + ' ' + t.ad + (temaAcik(t) ? ' ✓' : ' (' + t.esik + ' ⭐)');
    }).join(' · ') + '. Temayı üstteki listeden seç.</p>';
    haritaEl.innerHTML = html;
  }

  function haritaGoster() {
    stopTimer();
    over = true;
    ekran = 'harita';
    msgEl.textContent = '';
    haritaCiz();
    gorunum();
  }

  function gorunum() {
    sekmeEl.hidden = gunlukMod;
    sekmeEl.querySelectorAll('button').forEach(function (b) {
      var sec = b.getAttribute('data-mod') === mod;
      b.classList.toggle('secili', sec);
      b.setAttribute('aria-selected', sec);
    });
    var harita = mod === 'sefer' && ekran === 'harita';
    haritaEl.hidden = !harita;
    oyunEl.hidden = harita;
    levelEl.hidden = mod !== 'klasik';
    bestStat.hidden = mod !== 'klasik';
    bolumStat.hidden = mod !== 'sefer';
    haritaBtn.hidden = mod !== 'sefer';
    ipucuEl.hidden = mod !== 'sefer' || harita;
    if (mod === 'sefer' && B) {
      bolumEl.textContent = bolum;
      ipucuEl.textContent = DUNYALAR[B.dunya].ikon + ' ' + DUNYALAR[B.dunya].ad + ' · ⭐ hedef: ' + B.hedef + ' sn · yanlış bayrak koyma';
    }
  }

  function modSec(m) {
    if (gunlukMod || m === mod) return;
    mod = m; kayit.mod = m; kaydet();
    if (m === 'sefer') haritaGoster();
    else { ekran = 'oyun'; start(); gorunum(); }
  }

  function temaListesi() {
    var secili = tema().id;
    temaEl.innerHTML = '';
    TEMALAR.forEach(function (t) {
      var o = document.createElement('option');
      o.value = t.id;
      o.disabled = !temaAcik(t);
      o.textContent = t.mayin + ' ' + t.ad + (temaAcik(t) ? '' : ' 🔒 ' + t.esik + ' ⭐');
      o.selected = t.id === secili;
      temaEl.appendChild(o);
    });
    boardEl.setAttribute('data-tema', secili);
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
    if (mod === 'sefer' && B) {
      level = 'bölüm ' + bolum;
      cols = B.w; rows = B.h; maske = B.maske; mineCount = B.mayin; playable = B.oynanir;
    } else {
      level = levelEl.value;
      cols = rows = LEVELS[level].size;
      maske = [];
      for (var m = 0; m < cols * rows; m++) maske.push(true);
      mineCount = LEVELS[level].mines; playable = cols * rows;
    }
    total = cols * rows;
    cells = [];
    els = [];
    placed = over = yanlisBayrak = false;
    flags = opened = seconds = 0;
    cursor = Math.floor(rows / 2) * cols + Math.floor(cols / 2);
    if (!maske[cursor]) cursor = maske.indexOf(true);
    timeEl.textContent = 0;
    msgEl.textContent = '';
    faceEl.textContent = '🙂';
    againEl.classList.remove('show');
    updateCounter();
    if (mod === 'klasik') showBest();
    boardEl.style.setProperty('--cols', cols);
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

  function restart() {
    if (mod === 'sefer') { if (bolum) bolumBaslat(bolum); }
    else start();
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
    if (i >= 0 && maske[i]) { setCursor(i); if (!cells[i].open) toggleFlag(i); }
  });

  boardEl.addEventListener('touchstart', function (e) {
    lastTouch = Date.now();
    suppressClick = false;
    var i = indexOf(e.target);
    if (i < 0 || !maske[i] || e.touches.length > 1) return;
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
    var r = Math.floor(cursor / cols), c = cursor % cols, handled = true;
    // Kapalı (oynanmayan) karelerin üstünden atlanır
    function adim(dr, dc) {
      var nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        if (maske[nr * cols + nc]) { r = nr; c = nc; return; }
        nr += dr; nc += dc;
      }
    }
    switch (e.key) {
      case 'ArrowUp': adim(-1, 0); break;
      case 'ArrowDown': adim(1, 0); break;
      case 'ArrowLeft': adim(0, -1); break;
      case 'ArrowRight': adim(0, 1); break;
      case ' ': case 'Enter': act(cursor, false); break;
      case 'f': case 'F': if (cells[cursor].open) handled = false; else toggleFlag(cursor); break;
      case 'n': case 'N': restart(); break;
      default: handled = false;
    }
    if (!handled) return;
    e.preventDefault();
    boardEl.classList.add('kb');
    if (e.key.indexOf('Arrow') === 0) setCursor(r * cols + c);
  });

  modeEl.addEventListener('click', function () {
    flagMode = !flagMode;
    modeEl.textContent = flagMode ? '🚩 Bayrak' : '⛏️ Kaz';
    modeEl.classList.toggle('flag', flagMode);
  });
  faceEl.addEventListener('click', restart);
  againEl.addEventListener('click', restart);
  levelEl.addEventListener('change', start);
  temaEl.addEventListener('change', function () {
    kayit.tema = temaEl.value; kaydet();
    temaListesi();
    if (els) els.forEach(function (el, i) { draw(i); });
  });
  sekmeEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-mod]');
    if (b) modSec(b.getAttribute('data-mod'));
  });
  haritaEl.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b && !b.disabled && b.hasAttribute('data-bolum')) bolumBaslat(Number(b.getAttribute('data-bolum')));
  });
  haritaBtn.addEventListener('click', haritaGoster);

  MiniOyun.oyun({
    restart: restart,
    seviye: function () { return level; },
    canPause: function () { return placed && !over; },
    pause: function () { paused = true; stopTimer(); },
    resume: function () { paused = false; if (placed && !over) startTimer(); }
  });

  // Oynanış testi ve hata ayıklama için anlık durum (yalnızca okuma)
  M.durum = function () { return { mod: mod, ekran: ekran, bolum: bolum, cols: cols, maske: maske, cells: cells, yanlisBayrak: yanlisBayrak, seconds: seconds }; };

  temaListesi();
  if (mod === 'sefer') haritaGoster();
  else { start(); gorunum(); }
})();

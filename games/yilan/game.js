(function () {
  var M = window.YilanMotor, N = M.N, BOLUMLER = M.BOLUMLER, DUNYALAR = M.DUNYALAR, DESENLER = M.DESENLER;
  var SAVE_KEY = 'mo_yilan';
  var gunlukMod = !!MiniOyun.gunluk.tarih;
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var cell = canvas.width / N;
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var msgEl = document.getElementById('msg');
  var btn = document.getElementById('restart');
  var sekmeEl = document.getElementById('mod-sekme');
  var klasikStats = document.getElementById('klasik-stats');
  var maceraStats = document.getElementById('macera-stats');
  var haritaEl = document.getElementById('harita');
  var ipucuEl = document.getElementById('ym-ipucu');
  var kontrolEl = document.querySelector('.touch-controls');
  var ILK_MESAJ = msgEl.textContent;

  // ---------- Kayıt ----------
  function yukle() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) {}
    if (!s || typeof s !== 'object') s = {};
    var yildiz = {};
    if (s.yildiz && typeof s.yildiz === 'object') {
      Object.keys(s.yildiz).forEach(function (k) {
        var y = Number(s.yildiz[k]);
        if (BOLUMLER[Number(k) - 1] && y >= 1 && y <= 3) yildiz[k] = Math.floor(y);
      });
    }
    var desenOk = DESENLER.some(function (d) { return d.id === s.desen; });
    return { mod: s.mod === 'macera' ? 'macera' : 'klasik', desen: desenOk ? s.desen : 'nane', yildiz: yildiz };
  }
  var kayit = yukle();
  function kaydet() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(kayit)); } catch (e) {} }

  function toplamYildiz() {
    var t = 0;
    Object.keys(kayit.yildiz).forEach(function (k) { t += kayit.yildiz[k]; });
    return t;
  }
  function acikMi(n) { return n === 1 || !!kayit.yildiz[n - 1]; }
  function desenAcik(d) { return toplamYildiz() >= d.esik; }
  function desen() {
    var d = DESENLER.filter(function (x) { return x.id === kayit.desen; })[0];
    return d && desenAcik(d) ? d.id : 'nane';
  }
  function yildizYaz(y) { return '★'.repeat(y) + '☆'.repeat(3 - y); }

  // ---------- Durum ----------
  var s, score, timer, running, paused, bekliyor;
  var mod = gunlukMod ? 'klasik' : kayit.mod;
  var ekran = 'oyun'; // Macera'da 'harita' veya 'oyun'
  var bolum = 0, B = null;
  bestEl.textContent = MiniOyun.getBest('yilan');

  // ---------- Çizim ----------
  function kare(x, y, pay) { ctx.fillRect(x * cell + pay, y * cell + pay, cell - 2 * pay, cell - 2 * pay); }
  function daire(x, y, r) { ctx.beginPath(); ctx.arc(x * cell + cell / 2, y * cell + cell / 2, r, 0, Math.PI * 2); ctx.fill(); }

  function draw() {
    var dunya = s.b ? DUNYALAR[s.b.dunya] : null;
    ctx.fillStyle = dunya ? dunya.zemin : '#11152b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (s.b) {
      for (var i = 0; i < N * N; i++) {
        if (!s.engel[i]) continue;
        var x = i % N, y = (i - x) / N;
        ctx.fillStyle = s.engel[i] === 2 ? '#f97316' : dunya.duvar;
        kare(x, y, 0.5);
        if (s.engel[i] === 2) { ctx.fillStyle = '#fde047'; daire(x, y, cell / 6); }
      }
      if (s.sarma) {
        // Kenardan geçiş: kenarlar kesik çizgiyle gösterilir
        ctx.save();
        ctx.strokeStyle = 'rgba(125, 211, 252, .6)';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 3;
        ctx.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3);
        ctx.restore();
      }
    }
    if (s.food) { ctx.fillStyle = '#ff5d6c'; daire(s.food[0], s.food[1], cell / 2.4); }
    s.ozel.forEach(function (o) {
      // Altın yem son 2 saniyesinde yanıp söner
      if (o.tur === 'altin' && o.kalan < 2000 && Math.floor(o.kalan / 250) % 2) return;
      ctx.fillStyle = o.tur === 'altin' ? '#facc15' : '#7dd3fc';
      if (o.tur === 'altin') { daire(o.x, o.y, cell / 2.1); ctx.fillStyle = '#fff7cc'; daire(o.x, o.y, cell / 5); }
      else {
        var cx = o.x * cell + cell / 2, cy = o.y * cell + cell / 2, r = cell / 2.1;
        ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath(); ctx.fill();
      }
    });
    var d = desen();
    s.snake.forEach(function (c, i) {
      ctx.fillStyle = M.desenRenk(d, i);
      kare(c[0], c[1], 1);
    });
    if (d === 'gece') {
      ctx.fillStyle = '#fde047';
      ctx.shadowColor = '#fde047'; ctx.shadowBlur = 8;
      daire(s.snake[0][0], s.snake[0][1], cell / 6);
      ctx.shadowBlur = 0;
    }
  }

  function zamanla() {
    clearInterval(timer);
    timer = setInterval(tick, M.adimMs(s));
  }

  function tick() {
    var ms = M.adimMs(s);
    var olay = M.adim(s, ms);
    if (olay.carpti) return s.b ? bolumBitti(false) : gameOver();
    if (s.b) {
      if (olay.altin || olay.buz) MiniOyun.ses('kazan');
      else if (olay.yem) MiniOyun.ses('puan');
      if (olay.lav) MiniOyun.ses('tik');
      maceraYaz();
      if (olay.bitti) { draw(); return bolumBitti(true); }
    } else if (olay.yem) {
      score = s.yenen * 10;
      scoreEl.textContent = score;
      MiniOyun.ses('puan');
    }
    if (M.adimMs(s) !== ms) zamanla();
    draw();
  }

  // ---------- Klasik ----------
  function gameOver() {
    clearInterval(timer);
    running = false;
    var rekor = MiniOyun.setBest('yilan', score);
    bestEl.textContent = MiniOyun.getBest('yilan');
    msgEl.textContent = 'Oyun bitti! Skorun: ' + score;
    btn.textContent = 'Tekrar oyna';
    MiniOyun.bitti({ baslik: 'Oyun bitti!', metin: 'Skorun: ' + score, rekor: rekor, kaybetti: !rekor, skor: score, sonuc: score + ' puan', paylas: 'Yılan oyununda ' + score + ' puan yaptım! Sen kaç yaparsın?' });
  }

  function start() {
    clearInterval(timer);
    paused = false;
    s = M.yeniDurum(null, MiniOyun.rastgele());
    score = 0;
    scoreEl.textContent = 0;
    msgEl.textContent = '';
    draw();
    running = true;
    btn.textContent = 'Yeniden başla';
    zamanla();
  }

  function klasikHazirla() {
    clearInterval(timer);
    running = false;
    s = M.yeniDurum(null);
    s.food = null;
    score = 0;
    scoreEl.textContent = 0;
    msgEl.textContent = ILK_MESAJ;
    btn.textContent = 'Başla';
    draw();
  }

  // ---------- Macera ----------
  function sure(ms) { return Math.floor(ms / 1000) + ' sn'; }
  function maceraYaz() {
    document.getElementById('ym-bolum').textContent = bolum;
    document.getElementById('ym-yem').textContent = Math.min(s.ilerleme, B.hedef) + '/' + B.hedef;
    document.getElementById('ym-sure').textContent = sure(s.sure);
  }

  function bolumBaslat(n) {
    clearInterval(timer);
    bolum = n; B = BOLUMLER[n - 1];
    ekran = 'oyun';
    paused = false; running = false; bekliyor = true;
    s = M.yeniDurum(B, MiniOyun.rastgele());
    var notlar = [];
    if (B.sarma) notlar.push('Kenarlardan karşıya geçebilirsin.');
    if (B.lav) notlar.push('Her 5 yemde bir lav çıkar.');
    if (B.ozelYem) notlar.push('⭐ altın yem +2 sayar, 🧊 buz yemi yavaşlatır.');
    ipucuEl.textContent = DUNYALAR[B.dunya].ikon + ' ' + DUNYALAR[B.dunya].ad + ' · 3★: ' + B.t3 + ' sn · 2★: ' + B.t2 + ' sn' + (notlar.length ? ' · ' + notlar.join(' ') : '');
    msgEl.textContent = 'Bölüm ' + n + ': ' + B.hedef + ' yem ye. Başlamak için bir yön tuşuna bas.';
    maceraYaz();
    gorunum();
    draw();
    if (canvas.scrollIntoView) canvas.scrollIntoView({ block: 'nearest' });
  }

  function dugme(id, metin, sinif, fn) {
    var b = document.createElement('button');
    b.className = sinif; b.type = 'button'; b.id = id;
    b.textContent = metin;
    b.addEventListener('click', fn);
    msgEl.appendChild(b);
  }

  function bolumBitti(kazandi) {
    clearInterval(timer);
    running = false;
    msgEl.innerHTML = '';
    var sonraki = BOLUMLER[bolum] ? bolum + 1 : 0;
    if (!kazandi) {
      dugme('ym-tekrar', 'Tekrar dene', 'btn', function () { bolumBaslat(bolum); });
      dugme('ym-harita2', '🗺️ Harita', 'btn btn-ghost', haritaGoster);
      MiniOyun.bitti({ baslik: 'Bölüm ' + bolum + ' olmadı', metin: 'Çarptın! Yem: ' + Math.min(s.ilerleme, B.hedef) + '/' + B.hedef + '. Tekrar dene!', kaybetti: true });
      return;
    }
    var y = M.yildiz(B, s.sure), onceki = kayit.yildiz[bolum] || 0, eskiToplam = toplamYildiz();
    if (y > onceki) { kayit.yildiz[bolum] = y; kaydet(); }
    var yeniDesen = DESENLER.filter(function (d) { return d.esik > eskiToplam && d.esik <= toplamYildiz(); })[0];
    var metin = y + ' ⭐ · ' + sure(s.sure) + '. ';
    if (y < 3) metin += (y + 1) + ' yıldız için ' + (y === 1 ? B.t2 : B.t3) + ' sn altında bitir. ';
    if (sonraki) metin += onceki ? 'Sonraki bölüm açık.' : 'Sonraki bölüm açıldı.';
    else metin += 'Macera\'nın tamamını bitirdin!';
    if (yeniDesen) metin += ' Yeni desen açıldı: ' + yeniDesen.ad + '.';
    if (sonraki) dugme('ym-sonraki', 'Sonraki bölüm →', 'btn', function () { bolumBaslat(sonraki); });
    dugme('ym-harita2', '🗺️ Harita', 'btn btn-ghost', haritaGoster);
    MiniOyun.bitti({ baslik: 'Bölüm ' + bolum + ' tamam!', metin: metin, sonuc: 'Bölüm ' + bolum + ': ' + y + ' yıldız', paylas: 'Yılan Macerası Bölüm ' + bolum + '\'i ' + sure(s.sure) + 'de ' + y + ' yıldızla bitirdim!' });
  }

  function haritaCiz() {
    var toplam = toplamYildiz();
    var html = '<p>Toplam: <b id="ym-toplam">' + toplam + '</b> / ' + BOLUMLER.length * 3 + ' ★</p>';
    DUNYALAR.forEach(function (d, di) {
      html += '<h2>' + d.ikon + ' Dünya ' + (di + 1) + ': ' + d.ad + ' <small>' + d.alt + '</small></h2><div class="ym-bolumler">';
      BOLUMLER.forEach(function (b) {
        if (b.dunya !== di) return;
        var acik = acikMi(b.n), y = kayit.yildiz[b.n] || 0;
        html += '<button type="button" class="ym-bolum' + (acik ? '' : ' kilitli') + '" data-bolum="' + b.n + '"' + (acik ? '' : ' disabled') +
          ' aria-label="Bölüm ' + b.n + (acik ? ', ' + y + ' yıldız' : ', kilitli') + '"><b>' + (acik ? b.n : '🔒') + '</b>' +
          '<small>' + b.hedef + ' yem</small><span>' + yildizYaz(y) + '</span></button>';
      });
      html += '</div>';
    });
    html += '<h2>Yılan deseni</h2><div class="ym-desenler">';
    var secili = desen();
    DESENLER.forEach(function (d) {
      var acik = desenAcik(d);
      html += '<button type="button" class="ym-desen' + (secili === d.id ? ' secili' : '') + '" data-desen="' + d.id + '"' + (acik ? '' : ' disabled') +
        ' aria-pressed="' + (secili === d.id) + '"><i aria-hidden="true" style="background:linear-gradient(135deg,' + d.ornek[0] + ',' + d.ornek[1] + ')"></i>' +
        (acik ? d.ad : '🔒 ' + d.esik + ' ★') + '</button>';
    });
    html += '</div><p>Desen hem Klasik hem Macera\'da geçerlidir, puanı etkilemez.</p>';
    haritaEl.innerHTML = html;
  }

  function haritaGoster() {
    clearInterval(timer);
    running = false;
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
    var harita = mod === 'macera' && ekran === 'harita';
    klasikStats.hidden = mod !== 'klasik';
    maceraStats.hidden = mod !== 'macera' || harita;
    ipucuEl.hidden = mod !== 'macera' || harita;
    haritaEl.hidden = !harita;
    canvas.hidden = harita;
    kontrolEl.hidden = harita;
    msgEl.hidden = harita;
  }

  function modSec(m) {
    if (gunlukMod || m === mod) return;
    mod = m; kayit.mod = m; kaydet();
    if (m === 'macera') haritaGoster();
    else { gorunum(); klasikHazirla(); }
  }

  function restart() {
    if (mod === 'klasik') start();
    else if (ekran === 'oyun' && bolum) bolumBaslat(bolum);
  }

  // ---------- Kontroller ----------
  function turn(d) {
    if (paused || MiniOyun.duraklatildi()) return;
    if (mod === 'macera') {
      if (ekran !== 'oyun' || !s.b) return;
      if (!running) {
        if (!bekliyor) return;
        bekliyor = false; running = true;
        msgEl.textContent = '';
        zamanla();
      }
    } else if (!running) { start(); }
    var cur = M.DIRS[s.dir];
    // Ters yöne anında dönüşü engelle
    if (M.DIRS[d][0] === -cur[0] && M.DIRS[d][1] === -cur[1]) return;
    s.nextDir = d;
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

  sekmeEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-mod]');
    if (b) modSec(b.getAttribute('data-mod'));
  });
  haritaEl.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.hasAttribute('data-bolum')) bolumBaslat(Number(b.getAttribute('data-bolum')));
    else if (b.hasAttribute('data-desen')) { kayit.desen = b.getAttribute('data-desen'); kaydet(); haritaCiz(); }
  });
  document.getElementById('ym-harita').addEventListener('click', haritaGoster);
  document.getElementById('ym-yeniden').addEventListener('click', restart);

  btn.addEventListener('click', start);
  MiniOyun.oyun({
    restart: restart,
    canPause: function () { return running; },
    pause: function () { paused = true; clearInterval(timer); },
    resume: function () { paused = false; if (running) zamanla(); }
  });

  // Oynanış testi ve hata ayıklama için anlık durum (yalnızca okuma)
  M.durum = function () { return s; };

  klasikHazirla();
  gorunum();
  if (mod === 'macera') haritaGoster();
})();

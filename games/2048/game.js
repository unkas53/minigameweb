(function () {
  var TAS = -1; // Taş kare: kaymaz, birleşmez, kareler içinden geçemez
  var SAVE_KEY = 'mo_2048';
  var boardEl = document.getElementById('board');
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var msgEl = document.getElementById('msg');
  var gunlukMod = !!MiniOyun.gunluk.tarih;

  // ---------- Motor (kurallar; testler window.Oyun2048Motor ile kullanır) ----------
  function yeniTahta(boyut, taslar, baslangic) {
    var g = [];
    for (var r = 0; r < boyut; r++) { g.push([]); for (var c = 0; c < boyut; c++) g[r].push(0); }
    (taslar || []).forEach(function (p) { g[p[0]][p[1]] = TAS; });
    (baslangic || []).forEach(function (p) { g[p[0]][p[1]] = p[2]; });
    return g;
  }

  function bosHucreler(g) {
    var cells = [];
    for (var r = 0; r < g.length; r++)
      for (var c = 0; c < g.length; c++)
        if (!g[r][c]) cells.push([r, c]);
    return cells;
  }

  function kareEkle(g, rnd) {
    var cells = bosHucreler(g);
    if (!cells.length) return;
    var p = cells[Math.floor(rnd() * cells.length)];
    g[p[0]][p[1]] = rnd() < 0.9 ? 2 : 4;
  }

  // Bir parçayı sola kaydırıp birleştirir; kazanılan puanı da döner.
  function parcaKaydir(vals, uzunluk) {
    vals = vals.filter(function (v) { return v; });
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
    while (out.length < uzunluk) out.push(0);
    return { row: out, gained: gained };
  }

  // Bir satırı sola kaydırır; taş kareler satırı bağımsız parçalara böler.
  function satirKaydir(line) {
    var out = [], gained = 0, parca = [];
    function bitir() {
      var res = parcaKaydir(parca, parca.length);
      out = out.concat(res.row);
      gained += res.gained;
      parca = [];
    }
    for (var i = 0; i < line.length; i++) {
      if (line[i] === TAS) { bitir(); out.push(TAS); } else parca.push(line[i]);
    }
    bitir();
    return { row: out, gained: gained };
  }

  function getLine(g, dir, i) {
    var n = g.length, line = [];
    for (var j = 0; j < n; j++) {
      if (dir === 'left') line.push(g[i][j]);
      else if (dir === 'right') line.push(g[i][n - 1 - j]);
      else if (dir === 'up') line.push(g[j][i]);
      else line.push(g[n - 1 - j][i]);
    }
    return line;
  }

  function setLine(g, dir, i, line) {
    var n = g.length;
    for (var j = 0; j < n; j++) {
      if (dir === 'left') g[i][j] = line[j];
      else if (dir === 'right') g[i][n - 1 - j] = line[j];
      else if (dir === 'up') g[j][i] = line[j];
      else g[n - 1 - j][i] = line[j];
    }
  }

  // Tahtayı yerinde kaydırır: { oynadi, kazanc, birlesti }
  function kaydir(g, dir) {
    var moved = false, gained = 0;
    for (var i = 0; i < g.length; i++) {
      var before = getLine(g, dir, i);
      var res = satirKaydir(before);
      if (res.row.join() !== before.join()) moved = true;
      setLine(g, dir, i, res.row);
      gained += res.gained;
    }
    return { oynadi: moved, kazanc: gained, birlesti: gained > 0 };
  }

  function hareketVar(g) {
    var n = g.length;
    if (bosHucreler(g).length) return true;
    for (var r = 0; r < n; r++)
      for (var c = 0; c < n; c++) {
        var v = g[r][c];
        if (v <= 0) continue;
        if (c + 1 < n && v === g[r][c + 1]) return true;
        if (r + 1 < n && v === g[r + 1][c]) return true;
      }
    return false;
  }

  function enBuyuk(g) {
    var m = 0;
    g.forEach(function (row) { row.forEach(function (v) { if (v > m) m = v; }); });
    return m;
  }

  // ---------- Görev Yolu bölümleri ----------
  // { boyut, hedef, hamle, taslar: [[r,c]], baslangic: [[r,c,deger]] }
  var BOLUMLER = [
    // Dünya 1: Isınma (4x4)
    { boyut: 4, hedef: 64, hamle: 80, ipucu: 'Aynı sayıları kaydırıp birleştir, 64\'e ulaş.' },
    { boyut: 4, hedef: 64, hamle: 80 },
    { boyut: 4, hedef: 128, hamle: 140 },
    { boyut: 4, hedef: 128, hamle: 90, baslangic: [[3, 0, 32], [3, 1, 16]] },
    { boyut: 4, hedef: 256, hamle: 240 },
    { boyut: 4, hedef: 256, hamle: 150, baslangic: [[3, 0, 64], [3, 1, 32], [3, 2, 16]] },
    { boyut: 4, hedef: 256, hamle: 250 },
    { boyut: 4, hedef: 512, hamle: 500 },
    { boyut: 4, hedef: 512, hamle: 290, baslangic: [[0, 0, 128], [0, 1, 64], [0, 2, 32]] },
    { boyut: 4, hedef: 512, hamle: 400, baslangic: [[3, 3, 128]] },
    // Dünya 2: Dar Alan (3x3 ve 4x4, taş kareler)
    { boyut: 3, hedef: 64, hamle: 80, ipucu: 'Küçük tahtada yer çok değerli: büyük kareyi bir köşede tut.' },
    { boyut: 4, hedef: 128, hamle: 130, taslar: [[1, 1]], ipucu: 'Taş kare hiç kaymaz; kareler onun içinden geçemez.' },
    { boyut: 3, hedef: 128, hamle: 150 },
    { boyut: 4, hedef: 128, hamle: 160, taslar: [[1, 2], [2, 1]] },
    { boyut: 3, hedef: 128, hamle: 110, baslangic: [[2, 0, 32], [2, 1, 16]] },
    { boyut: 4, hedef: 256, hamle: 270, taslar: [[0, 3]] },
    { boyut: 3, hedef: 256, hamle: 80, baslangic: [[2, 0, 128], [2, 1, 64], [1, 0, 16]] },
    { boyut: 4, hedef: 256, hamle: 250, taslar: [[1, 0], [2, 3]] },
    { boyut: 3, hedef: 64, hamle: 80, taslar: [[0, 0]] },
    { boyut: 4, hedef: 512, hamle: 370, taslar: [[0, 1], [0, 2]], baslangic: [[3, 0, 64], [3, 1, 64]] },
    // Dünya 3: Usta (4x4 ve 5x5)
    { boyut: 5, hedef: 512, hamle: 480, ipucu: 'Geniş tahta rahat görünür ama hamle sınırı sıkı.' },
    { boyut: 4, hedef: 1024, hamle: 560, baslangic: [[3, 0, 256], [3, 1, 128], [3, 2, 64]] },
    { boyut: 5, hedef: 512, hamle: 490, taslar: [[2, 2]] },
    { boyut: 4, hedef: 1024, hamle: 510, baslangic: [[0, 0, 4], [3, 0, 256], [3, 1, 256], [3, 3, 2]], ipucu: 'Köşesi bozulmuş tahtayı kurtar.' },
    { boyut: 5, hedef: 1024, hamle: 630, baslangic: [[4, 0, 256], [4, 1, 128]] },
    { boyut: 4, hedef: 512, hamle: 500, taslar: [[0, 0]] },
    { boyut: 5, hedef: 1024, hamle: 730, taslar: [[1, 3], [3, 1]], baslangic: [[4, 0, 256], [4, 1, 64]] },
    { boyut: 4, hedef: 1024, hamle: 380, baslangic: [[0, 3, 2], [3, 0, 2], [3, 1, 256], [2, 0, 256], [3, 3, 128]] },
    { boyut: 5, hedef: 2048, hamle: 1050, baslangic: [[4, 0, 512], [4, 1, 256], [4, 2, 128], [4, 3, 64]] },
    { boyut: 4, hedef: 2048, hamle: 600, baslangic: [[3, 0, 1024], [3, 1, 256], [3, 2, 128], [3, 3, 64]], ipucu: 'Son sınav: 1024 hazır, eşini kur.' }
  ];
  var DUNYALAR = [
    { ad: 'Isınma', alt: '4x4', ilk: 1, esik: 0 },
    { ad: 'Dar Alan', alt: '3x3 ve 4x4, taş kareler', ilk: 11, esik: 15 },
    { ad: 'Usta', alt: '4x4 ve 5x5', ilk: 21, esik: 40 }
  ];
  var TEMALAR = [
    { id: 'varsayilan', ad: 'Klasik', esik: 0 },
    { id: 'okyanus', ad: 'Okyanus', esik: 10 },
    { id: 'orman', ad: 'Orman', esik: 30 },
    { id: 'gece', ad: 'Gece', esik: 60 },
    { id: 'altin', ad: 'Altın', esik: 90 }
  ];

  // 3 yıldız: sınırın yarısından az hamle; 2 yıldız: dörtte üçünden az; 1 yıldız: hedefe ulaşmak.
  function yildizHesapla(hamle, sinir) {
    if (hamle < sinir * 0.5) return 3;
    if (hamle < sinir * 0.75) return 2;
    return 1;
  }
  function esikHamle(sinir, oran) { return Math.ceil(sinir * oran) - 1; }

  window.Oyun2048Motor = {
    TAS: TAS, BOLUMLER: BOLUMLER, TEMALAR: TEMALAR, yeniTahta: yeniTahta, kaydir: kaydir, kareEkle: kareEkle,
    hareketVar: hareketVar, enBuyuk: enBuyuk, yildizHesapla: yildizHesapla,
    tohum: function (n) { return MiniOyun.gunluk.rastgele('2048/bolum-' + n); }
  };

  // ---------- Kayıt ----------
  function yukle() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) {}
    if (!s || typeof s !== 'object' || s.v !== 1) s = {};
    var yildiz = {};
    if (s.yildiz && typeof s.yildiz === 'object') {
      Object.keys(s.yildiz).forEach(function (k) {
        var y = Number(s.yildiz[k]);
        if (BOLUMLER[Number(k) - 1] && y >= 1 && y <= 3) yildiz[k] = Math.floor(y);
      });
    }
    var temaOk = TEMALAR.some(function (t) { return t.id === s.tema; });
    return { v: 1, mod: s.mod === 'gorev' ? 'gorev' : 'klasik', yildiz: yildiz, tema: temaOk ? s.tema : 'varsayilan' };
  }
  var kayit = yukle();
  function kaydet() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(kayit)); } catch (e) {} }

  function toplamYildiz() {
    var t = 0;
    Object.keys(kayit.yildiz).forEach(function (k) { t += kayit.yildiz[k]; });
    return t;
  }
  function dunyaOf(n) { return n >= 21 ? 2 : n >= 11 ? 1 : 0; }
  function acikMi(n) {
    if (n === 1) return true;
    if (!kayit.yildiz[n - 1]) return false;
    return toplamYildiz() >= DUNYALAR[dunyaOf(n)].esik;
  }
  function temaAcik(t) { return toplamYildiz() >= t.esik; }

  // ---------- Oyun durumu ----------
  var grid, score, won, over, startBest, rnd;
  var mod = gunlukMod ? 'klasik' : kayit.mod;
  var ekran = 'oyun'; // Görev Yolu'nda 'harita' veya 'oyun'
  var bolum = 0, hamle = 0, B = null;

  var sekmeEl = document.getElementById('mod-sekme');
  var klasikStats = document.getElementById('klasik-stats');
  var gorevStats = document.getElementById('gorev-stats');
  var haritaEl = document.getElementById('harita');
  var ipucuEl = document.getElementById('gy-ipucu');

  function temaUygula() { boardEl.className = 'board tema-' + kayit.tema; }

  function render() {
    var n = grid.length;
    boardEl.style.setProperty('--n', n);
    boardEl.innerHTML = '';
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        var v = grid[r][c];
        var cell = document.createElement('div');
        if (v === TAS) {
          cell.className = 'cell tas';
          cell.setAttribute('aria-label', 'Taş');
        } else {
          cell.className = 'cell' + (v ? ' ' + (v > 2048 ? 'vbig' : 'v' + v) : '');
          cell.textContent = v || '';
        }
        boardEl.appendChild(cell);
      }
    }
    if (mod === 'klasik') {
      scoreEl.textContent = score;
      MiniOyun.setBest('2048', score);
      bestEl.textContent = MiniOyun.getBest('2048');
    } else {
      document.getElementById('gy-bolum').textContent = bolum;
      document.getElementById('gy-hedef').textContent = B.hedef;
      document.getElementById('gy-kalan').textContent = B.hamle - hamle;
      boardEl.setAttribute('data-hamle', hamle);
    }
  }

  function move(dir) {
    if (over || MiniOyun.duraklatildi()) return;
    if (mod === 'gorev' && ekran !== 'oyun') return;
    var res = kaydir(grid, dir);
    if (!res.oynadi) return;
    MiniOyun.ses(res.birlesti ? 'puan' : 'tik');
    kareEkle(grid, rnd);
    if (mod === 'gorev') { hamle++; render(); bolumKontrol(); return; }
    score += res.kazanc;
    render();
    if (!won && grid.some(function (row) { return row.indexOf(2048) !== -1; })) {
      won = true;
      msgEl.textContent = 'Tebrikler, 2048! Devam edebilirsin.';
      MiniOyun.ses('kazan');
    }
    if (!hareketVar(grid)) {
      over = true;
      msgEl.textContent = 'Oyun bitti! Skorun: ' + score;
      MiniOyun.bitti({ baslik: 'Oyun bitti!', metin: 'Skorun: ' + score, rekor: score > startBest, kaybetti: score <= startBest, skor: score, sonuc: score + ' puan', paylas: '2048\'de ' + score + ' puan yaptım! Sen kaç yaparsın?' });
    }
  }

  function startKlasik() {
    grid = yeniTahta(4);
    score = 0; won = false; over = false;
    startBest = MiniOyun.getBest('2048');
    rnd = MiniOyun.rastgele();
    msgEl.textContent = '';
    kareEkle(grid, rnd); kareEkle(grid, rnd);
    render();
  }

  // ---------- Görev Yolu ----------
  function bolumBaslat(n) {
    if (!BOLUMLER[n - 1] || !acikMi(n)) return;
    bolum = n; B = BOLUMLER[n - 1]; hamle = 0; over = false;
    ekran = 'oyun';
    grid = yeniTahta(B.boyut, B.taslar, B.baslangic);
    rnd = window.Oyun2048Motor.tohum(n);
    while (grid.reduce(function (t, row) { return t + row.filter(function (v) { return v > 0; }).length; }, 0) < 2) kareEkle(grid, rnd);
    msgEl.textContent = '';
    ipucuEl.textContent = (B.ipucu ? B.ipucu + ' ' : '') + '3★: en fazla ' + esikHamle(B.hamle, 0.5) + ' hamle · 2★: en fazla ' + esikHamle(B.hamle, 0.75) + ' hamle';
    gorunum();
    render();
    // Tahta görünür alanda kalsın (ipucu satırı onu aşağı itiyor)
    if (boardEl.scrollIntoView) boardEl.scrollIntoView({ block: 'nearest' });
  }

  function sonrakiDugmeleri(kazandi) {
    msgEl.innerHTML = '';
    var sonraki = bolum + 1;
    if (kazandi && BOLUMLER[sonraki - 1] && acikMi(sonraki)) {
      var b = document.createElement('button');
      b.className = 'btn'; b.type = 'button'; b.id = 'gy-sonraki';
      b.textContent = 'Sıradaki: Bölüm ' + sonraki + ' →';
      b.addEventListener('click', function () { bolumBaslat(sonraki); });
      msgEl.appendChild(b);
    }
    var h = document.createElement('button');
    h.className = 'btn btn-ghost'; h.type = 'button';
    h.textContent = '🗺️ Harita';
    h.addEventListener('click', haritaGoster);
    msgEl.appendChild(h);
  }

  function bolumKontrol() {
    if (enBuyuk(grid) >= B.hedef) {
      over = true;
      var y = yildizHesapla(hamle, B.hamle);
      var onceki = kayit.yildiz[bolum] || 0;
      if (y > onceki) { kayit.yildiz[bolum] = y; kaydet(); }
      var sonraki = BOLUMLER[bolum] ? bolum + 1 : 0;
      var yeniTema = TEMALAR.filter(function (t) { return t.esik > 0 && toplamYildiz() >= t.esik && toplamYildiz() - (y > onceki ? y - onceki : 0) < t.esik; })[0];
      var metin = '★'.repeat(y) + '☆'.repeat(3 - y) + ' · ' + hamle + ' hamlede ' + B.hedef + ' karesine ulaştın.';
      if (y > onceki && onceki) metin += ' Yeni yıldız rekoru!';
      if (yeniTema) metin += ' Yeni tahta teması açıldı: ' + yeniTema.ad + '.';
      if (sonraki && acikMi(sonraki)) metin += ' Sıradaki: Bölüm ' + sonraki + '.';
      else if (sonraki) metin += ' Bölüm ' + sonraki + ' için toplam ' + DUNYALAR[dunyaOf(sonraki)].esik + ' yıldız gerekiyor.';
      else metin += ' Görev Yolu\'nun tamamını bitirdin!';
      sonrakiDugmeleri(true);
      MiniOyun.bitti({ baslik: 'Bölüm ' + bolum + ' tamam!', metin: metin, sonuc: 'Bölüm ' + bolum + ': ' + y + ' yıldız', paylas: '2048 Görev Yolu Bölüm ' + bolum + '\'i ' + hamle + ' hamlede ' + y + ' yıldızla bitirdim!' });
    } else if (hamle >= B.hamle || !hareketVar(grid)) {
      over = true;
      sonrakiDugmeleri(false);
      MiniOyun.bitti({ baslik: 'Bölüm ' + bolum + ' olmadı', metin: (hamle >= B.hamle ? 'Hamlelerin bitti.' : 'Hamle yapacak yer kalmadı.') + ' Hedef ' + B.hedef + ', en büyük karen ' + enBuyuk(grid) + '. Tekrar dene!', kaybetti: true });
    }
  }

  function haritaCiz() {
    var toplam = toplamYildiz();
    var html = '<p class="gy-toplam">Toplam: <b id="gy-toplam">' + toplam + '</b> / ' + BOLUMLER.length * 3 + ' ★</p>';
    DUNYALAR.forEach(function (d, di) {
      html += '<h2>Dünya ' + (di + 1) + ': ' + d.ad + ' <small>' + d.alt + '</small></h2>';
      if (d.esik && toplam < d.esik) html += '<p>🔒 Açmak için toplam ' + d.esik + ' yıldız gerekiyor.</p>';
      html += '<div class="gy-bolumler">';
      for (var n = d.ilk; n < d.ilk + 10; n++) {
        var acik = acikMi(n), y = kayit.yildiz[n] || 0, b = BOLUMLER[n - 1];
        html += '<button type="button" class="gy-bolum' + (acik ? '' : ' kilitli') + '" data-bolum="' + n + '"' + (acik ? '' : ' disabled') +
          ' aria-label="Bölüm ' + n + (acik ? ', ' + y + ' yıldız' : ', kilitli') + '"><b>' + (acik ? n : '🔒') + '</b>' +
          '<small>' + b.boyut + 'x' + b.boyut + ' · ' + b.hedef + '</small><span>' + '★'.repeat(y) + '☆'.repeat(3 - y) + '</span></button>';
      }
      html += '</div>';
    });
    html += '<h2>Tahta teması</h2><div class="gy-temalar">';
    TEMALAR.forEach(function (t) {
      var acik = temaAcik(t);
      html += '<button type="button" class="gy-tema tema-' + t.id + (kayit.tema === t.id ? ' secili' : '') + '" data-tema="' + t.id + '"' + (acik ? '' : ' disabled') +
        ' aria-pressed="' + (kayit.tema === t.id) + '"><i aria-hidden="true"></i>' + (acik ? t.ad : '🔒 ' + t.esik + ' ★') + '</button>';
    });
    html += '</div><p>Tema hem Klasik hem Görev Yolu\'nda geçerlidir.</p>';
    haritaEl.innerHTML = html;
  }

  function haritaGoster() {
    ekran = 'harita'; over = true;
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
    var harita = mod === 'gorev' && ekran === 'harita';
    klasikStats.hidden = mod !== 'klasik';
    gorevStats.hidden = mod !== 'gorev' || harita;
    ipucuEl.hidden = mod !== 'gorev' || harita;
    haritaEl.hidden = !harita;
    boardEl.hidden = harita;
  }

  function modSec(m) {
    if (gunlukMod || m === mod) return;
    mod = m; kayit.mod = m; kaydet();
    if (m === 'gorev') haritaGoster();
    else { gorunum(); startKlasik(); }
  }

  function restart() {
    if (mod === 'klasik') startKlasik();
    else if (ekran === 'oyun' && bolum) bolumBaslat(bolum);
  }

  sekmeEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-mod]');
    if (b) modSec(b.getAttribute('data-mod'));
  });
  haritaEl.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.hasAttribute('data-bolum')) bolumBaslat(Number(b.getAttribute('data-bolum')));
    else if (b.hasAttribute('data-tema')) { kayit.tema = b.getAttribute('data-tema'); kaydet(); temaUygula(); haritaCiz(); }
  });
  document.getElementById('gy-harita').addEventListener('click', haritaGoster);
  document.getElementById('gy-yeniden').addEventListener('click', restart);

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

  document.getElementById('restart').addEventListener('click', startKlasik);
  MiniOyun.oyun({ restart: restart });
  temaUygula();
  if (mod === 'gorev') haritaGoster();
  else { gorunum(); startKlasik(); }
})();

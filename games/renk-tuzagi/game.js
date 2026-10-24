// Renk Tuzağı: kelimeyi değil yazının rengini seç. Hızlı oyun (Kolay/Normal/Zor, 60 sn),
// 12 bölümlük kampanya (yıldızlar, mo_renk kaydı) ve günlük meydan okuma (Normal).
(function () {
  var KAYIT = 'mo_renk';
  var RENKLER = [
    { ad: 'KIRMIZI', kod: '#ef4444', tus: 'k', sekil: '●' },
    { ad: 'MAVİ', kod: '#3b82f6', tus: 'm', sekil: '■' },
    { ad: 'YEŞİL', kod: '#22c55e', tus: 'y', sekil: '▲' },
    { ad: 'SARI', kod: '#eab308', tus: 's', sekil: '◆' },
    { ad: 'MOR', kod: '#a855f7', tus: '', sekil: '★' },
    { ad: 'TURUNCU', kod: '#f97316', tus: 't', sekil: '✚' }
  ];
  var SEVIYELER = {
    kolay: { renk: 4, dugme: 'renkli', sure: 60 },
    normal: { renk: 6, dugme: 'beyaz', sure: 60 },
    zor: { renk: 6, dugme: 'tuzak', karis: true, kelime: true, sure: 60 }
  };
  // Bölümler: kurallar sırayla eklenir, son bölümlerde süre kısalır
  var BOLUMLER = [
    { renk: 4, dugme: 'renkli', sure: 45, hedef: 250 },
    { renk: 4, dugme: 'renkli', sure: 60, hedef: 350 },
    { renk: 4, dugme: 'beyaz', sure: 60, hedef: 350 },
    { renk: 6, dugme: 'renkli', sure: 60, hedef: 350 },
    { renk: 6, dugme: 'beyaz', sure: 60, hedef: 350 },
    { renk: 6, dugme: 'beyaz', karis: true, sure: 60, hedef: 350 },
    { renk: 6, dugme: 'tuzak', sure: 60, hedef: 300 },
    { renk: 6, dugme: 'beyaz', kelime: true, sure: 60, hedef: 300 },
    { renk: 6, dugme: 'tuzak', karis: true, sure: 60, hedef: 300 },
    { renk: 6, dugme: 'tuzak', karis: true, kelime: true, sure: 60, hedef: 300 },
    { renk: 6, dugme: 'tuzak', karis: true, kelime: true, sure: 45, hedef: 250 },
    { renk: 6, dugme: 'tuzak', karis: true, kelime: true, sure: 40, hedef: 250 }
  ];
  var SORU_SAYISI = 200;

  var $ = function (id) { return document.getElementById(id); };
  var menuEl = $('menu'), oyunEl = $('oyun'), soruEl = $('soru'), kelimeEl = $('kelime'), kuralEl = $('kural'),
    sekilEl = $('sekil'), dugmelerEl = $('dugmeler'), desenEl = $('desen');
  var daily = !!(MiniOyun.gunluk && MiniOyun.gunluk.tarih);

  var kayit = yukle();
  var ayar = null;   // { ad, seviye, bolum, ...kurallar }
  var durum = 'menu'; // menu | oyun | bitti
  var sorular, sira, kalan, sonZaman, zamanlayici, puan, seri, dogru, yanlis, tepkiler, soruBasi, duzen, tuzakRenk;

  function yukle() {
    try {
      var k = JSON.parse(localStorage.getItem(KAYIT));
      if (k && typeof k === 'object' && k.yildiz && typeof k.yildiz === 'object') return { yildiz: k.yildiz, desen: !!k.desen };
    } catch (e) {}
    return { yildiz: {}, desen: false };
  }
  function kaydet() {
    try { localStorage.setItem(KAYIT, JSON.stringify(kayit)); } catch (e) {}
  }
  function toplamYildiz() {
    var n = 0;
    for (var k in kayit.yildiz) n += kayit.yildiz[k] || 0;
    return n;
  }
  function acikMi(n) { return n === 1 || (kayit.yildiz[n - 1] || 0) > 0; }
  function rekorAnahtar() { return 'renk-tuzagi-' + (ayar.bolum ? 'b' + ayar.bolum : ayar.seviye); }

  // ---------- Menü ----------
  function menuCiz() {
    var hizli = $('hizli');
    Array.prototype.forEach.call(hizli.querySelectorAll('[data-seviye]'), function (b) {
      b.hidden = daily && b.getAttribute('data-seviye') !== 'normal';
    });
    hizli.querySelector('[data-seviye="normal"] small').textContent = daily ? 'günlük tur' : '6 renk';
    $('yildiz-ozet').textContent = '⭐ ' + toplamYildiz() + ' / ' + BOLUMLER.length * 3 + ' yıldız';
    var html = '';
    BOLUMLER.forEach(function (b, i) {
      var n = i + 1, y = kayit.yildiz[n] || 0, acik = acikMi(n);
      html += '<button type="button" class="rt-bolum' + (acik ? '' : ' kilitli') + '" data-bolum="' + n + '"' + (acik ? '' : ' disabled') +
        ' aria-label="Bölüm ' + n + (acik ? ', ' + y + ' yıldız' : ', kilitli') + '"><b>' + (acik ? n : '🔒') + '</b><span class="y">' +
        (acik ? '★★★'.slice(0, y) + '☆☆☆'.slice(y) : '') + '</span></button>';
    });
    $('bolumler').innerHTML = html;
    desenEl.checked = kayit.desen;
  }
  function menuGoster() {
    durum = 'menu';
    durdur();
    menuCiz();
    menuEl.hidden = false;
    oyunEl.hidden = true;
  }

  $('hizli').addEventListener('click', function (e) {
    var b = e.target.closest('[data-seviye]');
    if (b && !MiniOyun.duraklatildi()) baslat({ seviye: b.getAttribute('data-seviye') });
  });
  $('bolumler').addEventListener('click', function (e) {
    var b = e.target.closest('[data-bolum]');
    if (b && !b.disabled && !MiniOyun.duraklatildi()) baslat({ bolum: Number(b.getAttribute('data-bolum')) });
  });
  desenEl.addEventListener('change', function () {
    kayit.desen = desenEl.checked;
    kaydet();
  });

  // ---------- Soru dizisi ----------
  // Tuzak oranı %75, aynı doğru renk art arda en fazla 2 kez; zor kurallarda her 5 soruda düğme sırası karışır.
  function diziUret(a, rnd) {
    var list = [], n = a.renk;
    function farkli(c) { var x = Math.floor(rnd() * (n - 1)); return x >= c ? x + 1 : x; }
    for (var i = 0; i < SORU_SAYISI; i++) {
      var c;
      do { c = Math.floor(rnd() * n); } while (i >= 2 && list[i - 1].cevap === c && list[i - 2].cevap === c);
      var kelimeTur = !!a.kelime && rnd() < 0.3;
      var tuzak = rnd() < 0.75;
      var q = { cevap: c, kelimeTur: kelimeTur };
      if (kelimeTur) { q.kelime = c; q.renk = tuzak ? farkli(c) : c; }
      else { q.renk = c; q.kelime = tuzak ? farkli(c) : c; }
      if (i % 5 === 0) {
        q.duzen = karistir(sirali(n), a.karis ? rnd : null);
        // Tuzaklı düğmelerde her düğmenin yazı rengi kendi adından farklı
        if (a.dugme === 'tuzak') q.tuzakRenk = q.duzen.map(function (c2) { return farkli(c2); });
      }
      list.push(q);
    }
    return list;
  }
  function sirali(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
  function karistir(a, rnd) {
    if (!rnd) return a;
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // ---------- Oyun ----------
  function baslat(secim) {
    if (secim) {
      var kural = secim.bolum ? BOLUMLER[secim.bolum - 1] : SEVIYELER[daily ? 'normal' : secim.seviye];
      ayar = {};
      for (var k in kural) ayar[k] = kural[k];
      ayar.bolum = secim.bolum || 0;
      ayar.seviye = secim.bolum ? 'bölüm ' + secim.bolum : (daily ? 'normal' : secim.seviye);
    }
    if (!ayar) { menuGoster(); return; }
    // Günlük dizi yalnızca günlük Normal turda tarihe bağlı; bölümler her seferinde rastgele
    var rnd = MiniOyun.rastgele();
    if (daily && ayar.bolum) rnd = Math.random;
    sorular = diziUret(ayar, rnd);
    sira = -1; puan = 0; seri = 0; dogru = 0; yanlis = 0; tepkiler = [];
    kalan = ayar.sure * 1000;
    menuEl.hidden = true;
    oyunEl.hidden = false;
    soruEl.classList.remove('gizli', 'dogru', 'yanlis');
    $('hedef-ad').textContent = ayar.bolum ? 'Hedef' : 'Rekor';
    $('rekor').textContent = ayar.bolum ? ayar.hedef : MiniOyun.getBest(rekorAnahtar());
    durum = 'oyun';
    sonraki();
    gostergeler();
    devam();
  }

  function devam() {
    durdur();
    sonZaman = performance.now();
    zamanlayici = setInterval(tik, 100);
  }
  function durdur() {
    clearInterval(zamanlayici);
    zamanlayici = null;
  }
  function tik() {
    var simdi = performance.now();
    kalan -= simdi - sonZaman;
    sonZaman = simdi;
    if (kalan <= 0) { kalan = 0; gostergeler(); bitir(); return; }
    gostergeler();
  }

  function sonraki() {
    sira++;
    if (sira >= sorular.length) sira = 0;
    var q = sorular[sira];
    if (q.duzen) { duzen = q.duzen; tuzakRenk = q.tuzakRenk; dugmeCiz(); }
    kuralEl.className = 'rt-kural' + (ayar.kelime ? (q.kelimeTur ? ' kelime' : ' renk') : '');
    kuralEl.textContent = ayar.kelime ? (q.kelimeTur ? 'KELİME' : 'RENK') : '';
    var r = RENKLER[q.renk];
    kelimeEl.textContent = RENKLER[q.kelime].ad;
    kelimeEl.style.color = r.kod;
    kelimeEl.setAttribute('data-renk', r.ad);
    sekilEl.textContent = kayit.desen ? r.sekil : '';
    kelimeEl.classList.remove('pop');
    void kelimeEl.offsetWidth;
    kelimeEl.classList.add('pop');
    soruBasi = performance.now();
  }

  function dugmeCiz() {
    dugmelerEl.className = 'rt-dugmeler' + (ayar.renk === 4 ? ' iki' : '');
    dugmelerEl.innerHTML = '';
    duzen.forEach(function (c, i) {
      var r = RENKLER[c], b = document.createElement('button');
      b.type = 'button';
      b.className = 'rt-dugme';
      b.setAttribute('data-renk', r.ad);
      b.setAttribute('aria-label', r.ad);
      if (ayar.dugme === 'renkli') {
        var nokta = document.createElement('span');
        nokta.className = 'nokta';
        nokta.style.background = r.kod;
        b.appendChild(nokta);
      }
      if (ayar.dugme === 'tuzak') b.style.color = RENKLER[tuzakRenk[i]].kod;
      b.appendChild(document.createTextNode((kayit.desen ? r.sekil + ' ' : '') + r.ad));
      var kisa = document.createElement('span');
      kisa.className = 'kisa';
      kisa.textContent = (i + 1) + (r.tus ? ' · ' + r.tus.toLocaleUpperCase('tr') : '');
      b.appendChild(kisa);
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); cevapla(c, b); });
      // Klavyeyle odaklanıp Enter/Boşluk ile seçim (pointerdown sonrası gelen tıklama yok sayılır)
      b.addEventListener('click', function (e) { if (e.detail === 0) cevapla(c, b); });
      dugmelerEl.appendChild(b);
    });
  }

  function cevapla(c, btn) {
    if (durum !== 'oyun' || MiniOyun.duraklatildi()) return;
    var q = sorular[sira];
    tepkiler.push(performance.now() - soruBasi);
    soruEl.classList.remove('dogru', 'yanlis');
    void soruEl.offsetWidth;
    if (c === q.cevap) {
      dogru++;
      seri++;
      puan += seri > 10 ? 20 : seri > 5 ? 15 : 10;
      soruEl.classList.add('dogru');
      MiniOyun.ses('puan');
    } else {
      yanlis++;
      seri = 0;
      kalan = Math.max(0, kalan - 2000);
      soruEl.classList.add('yanlis');
      if (btn) { btn.classList.remove('yanlis'); void btn.offsetWidth; btn.classList.add('yanlis'); }
      MiniOyun.ses('tik');
    }
    gostergeler();
    if (kalan <= 0) { bitir(); return; }
    sonraki();
  }

  function gostergeler() {
    $('puan').textContent = puan;
    $('seri').textContent = '🔥 x' + seri;
    $('sure').textContent = Math.ceil(kalan / 1000);
    $('sure-dolu').style.width = (kalan / (ayar.sure * 1000) * 100) + '%';
    $('sure-cubuk').classList.toggle('az', kalan <= 10000);
  }

  function bitir() {
    if (durum !== 'oyun') return;
    durum = 'bitti';
    durdur();
    var toplam = dogru + yanlis;
    var isabet = toplam ? Math.round(dogru / toplam * 100) : 0;
    var ort = tepkiler.length ? Math.round(tepkiler.reduce(function (a, b) { return a + b; }, 0) / tepkiler.length) : 0;
    var ozet = puan + ' puan · ' + dogru + ' doğru, ' + yanlis + ' yanlış · isabet %' + isabet + ' · ortalama ' + ort + ' ms';
    var rekor = MiniOyun.setBest(rekorAnahtar(), puan);
    var opts = { metin: ozet, rekor: rekor, skor: puan, seviye: ayar.seviye, sonuc: puan + ' puan' };
    if (ayar.bolum) {
      var y = puan >= ayar.hedef * 2 ? 3 : puan >= ayar.hedef * 1.5 ? 2 : puan >= ayar.hedef ? 1 : 0;
      var once = kayit.yildiz[ayar.bolum] || 0;
      if (y > once) { kayit.yildiz[ayar.bolum] = y; kaydet(); }
      opts.kaybetti = y === 0;
      opts.baslik = y ? 'Bölüm ' + ayar.bolum + ' geçildi! ' + Array(y + 1).join('⭐') : 'Hedefe ulaşamadın';
      opts.metin = ozet + ' · hedef ' + ayar.hedef + (y && ayar.bolum < BOLUMLER.length && once === 0 ? ' · Bölüm ' + (ayar.bolum + 1) + ' açıldı!' : '');
      opts.paylas = 'Renk Tuzağı Bölüm ' + ayar.bolum + ': ' + puan + ' puan, ' + y + ' yıldız!';
    } else {
      opts.kaybetti = !rekor;
      opts.baslik = rekor ? 'Yeni rekor!' : 'Süre doldu!';
      opts.paylas = 'Renk Tuzağı (' + ayar.seviye + '): ' + puan + ' puan, isabet %' + isabet + '. Sen kaç yaparsın?';
    }
    MiniOyun.bitti(opts);
    // Pencere kapanınca menü (bölüm haritası) görünür; "Tekrar oyna" aynı turu yeniden başlatır
    menuCiz();
    menuEl.hidden = false;
    oyunEl.hidden = true;
  }

  // ---------- Klavye ----------
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === ' ' && durum === 'bitti' && !MiniOyun.duraklatildi()) { e.preventDefault(); baslat(); return; }
    if (durum !== 'oyun' || MiniOyun.duraklatildi()) return;
    var i = '123456'.indexOf(e.key);
    var c = -1;
    if (i !== -1 && i < duzen.length) c = duzen[i];
    else {
      var harf = e.key.toLocaleLowerCase('tr');
      duzen.forEach(function (x) { if (RENKLER[x].tus && RENKLER[x].tus === harf) c = x; });
    }
    if (c === -1) return;
    e.preventDefault();
    cevapla(c, dugmelerEl.children[duzen.indexOf(c)]);
  });

  MiniOyun.oyun({
    restart: function () { baslat(); },
    pause: function () { durdur(); soruEl.classList.add('gizli'); },
    resume: function () { soruEl.classList.remove('gizli'); devam(); soruBasi = performance.now(); },
    canPause: function () { return durum === 'oyun'; },
    seviye: function () { return ayar ? ayar.seviye : 'normal'; }
  });

  menuGoster();
})();

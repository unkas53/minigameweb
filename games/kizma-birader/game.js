// Kızma Birader: zar at, 4 piyonunu tahtayı dolaştırıp eve sok, rakip piyonları kır.
// Turnuva (4 lig × 6 maç, yıldızlar, açılan temalar/piyonlar/kural varyantları, günlük görevler; kayıt mo_kizma),
// serbest oyun (2 veya 4 oyuncu, Kolay/Orta/Usta, varyantlar), aynı cihazda yerel mod ve günlük maç (tohumlu zar).
(function () {
  var KAYIT = 'mo_kizma';
  // 11x11 tahta. YOL: 40 karelik ortak yol [x, y]; her oyuncu kendi çıkış karesinden (CIKIS) başlar.
  var YOL = [[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [4, 3], [4, 2], [4, 1], [4, 0], [5, 0],
    [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [10, 5],
    [10, 6], [9, 6], [8, 6], [7, 6], [6, 6], [6, 7], [6, 8], [6, 9], [6, 10], [5, 10],
    [4, 10], [4, 9], [4, 8], [4, 7], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 5]];
  var CIKIS = [0, 10, 20, 30];
  var EV = [[[1, 5], [2, 5], [3, 5], [4, 5]], [[5, 1], [5, 2], [5, 3], [5, 4]], [[9, 5], [8, 5], [7, 5], [6, 5]], [[5, 9], [5, 8], [5, 7], [5, 6]]];
  var BAHCE = [[[0, 0], [1, 0], [0, 1], [1, 1]], [[9, 0], [10, 0], [9, 1], [10, 1]], [[9, 9], [10, 9], [9, 10], [10, 10]], [[0, 9], [1, 9], [0, 10], [1, 10]]];
  var GUVENLI = [0, 8, 10, 18, 20, 28, 30, 38];
  var RENKLER = [
    { ad: 'Kırmızı', renk: '#ef4444' }, { ad: 'Mavi', renk: '#3b82f6' },
    { ad: 'Yeşil', renk: '#22c55e' }, { ad: 'Sarı', renk: '#eab308' }
  ];
  // Rakip karakterleri: kir (kırma), cikis (başlangıçtan çıkma), eve (eve girme), kac (tehlikeden kaçma),
  // risk (tehlikeye girme cezası), ilerle (öndeki piyonu sürme), denge (geridekini sürme)
  var KARAKTER = [
    { ad: 'Temkinli Tülay', avatar: '👩‍🦳', w: { kir: 3, cikis: 4, eve: 6, kac: 9, risk: 8, ilerle: 0.1, denge: 0 },
      laf: { bas: 'Yavaş ama emin adımlarla…', kir: 'Kusura bakma, mecburdum!', kirildi: 'Ah, piyoncuğum!' } },
    { ad: 'Saldırgan Selim', avatar: '🧔', w: { kir: 15, cikis: 5, eve: 4, kac: 1, risk: 1, ilerle: 0.15, denge: 0 },
      laf: { bas: 'Kimseyi sağ bırakmam!', kir: 'Kızma birader!', kirildi: 'Bunun hesabını soracağım!' } },
    { ad: 'Hesapçı Hikmet', avatar: '👨', w: { kir: 8, cikis: 6, eve: 7, kac: 6, risk: 5, ilerle: 0.1, denge: 0 },
      laf: { bas: 'Olasılıklar benden yana.', kir: 'Hesapta vardı.', kirildi: 'Bu ihtimali kaçırmışım.' } },
    { ad: 'Usta Ümran', avatar: '🧓', w: { kir: 9, cikis: 6, eve: 8, kac: 7, risk: 6, ilerle: 0.04, denge: 0.08 },
      laf: { bas: 'Bu masada çok zar attım evlat.', kir: 'Kızma birader, oyun bu!', kirildi: 'Hmm, fena değil.' } }
  ];
  var LIGLER = [
    { ad: 'Mahalle Kahvesi', ikon: '☕', rakip: 0, zeka: 0.45 },
    { ad: 'Semt Turnuvası', ikon: '🏘️', rakip: 1, zeka: 0.62 },
    { ad: 'Şehir Kupası', ikon: '🏙️', rakip: 2, zeka: 0.8 },
    { ad: 'Usta Masası', ikon: '🎩', rakip: 3, zeka: 0.95 }
  ];
  var SERBEST = { kolay: { rakip: 0, zeka: 0.4 }, orta: { rakip: 2, zeka: 0.75 }, usta: { rakip: 3, zeka: 1 } };
  var VARYANTLAR = [
    { id: 'hizli', ad: 'Hızlı oyun', aciklama: 'Her oyuncu 2 piyonla oynar', lig: 0 },
    { id: 'guvenli', ad: 'Güvenli kareler', aciklama: 'Yıldızlı karelerde kırma yok', lig: 1 },
    { id: 'cift', ad: 'Çift zar', aciklama: 'İki zar atılır, birini seçersin', lig: 2 }
  ];
  var TEMALAR = [
    { id: 'klasik', ad: 'Klasik', y: 0 }, { id: 'gece', ad: 'Gece', y: 6 }, { id: 'ahsap', ad: 'Ahşap', y: 15 },
    { id: 'deniz', ad: 'Deniz', y: 28 }, { id: 'bahce', ad: 'Bahçe', y: 42 }, { id: 'altin', ad: 'Altın', y: 60 }
  ];
  var PIYONLAR = [
    { id: 'duz', ad: 'Düz', ikon: '', y: 0 }, { id: 'kedi', ad: 'Kedi', ikon: '🐱', y: 10 }, { id: 'araba', ad: 'Araba', ikon: '🚗', y: 22 },
    { id: 'yildiz', ad: 'Yıldız', ikon: '⭐', y: 35 }, { id: 'tac', ad: 'Taç', ikon: '👑', y: 50 }
  ];
  var GOREVLER = [
    { id: 'kir3', ad: 'Bir maçta 3 piyon kır', hedef: 1 },
    { id: 'kirma', ad: 'Toplam 5 piyon kır', hedef: 5 },
    { id: 'seri6', ad: 'Üst üste iki kez 6 at', hedef: 1 },
    { id: 'kazan2', ad: '2 maç kazan', hedef: 2 },
    { id: 'usta', ad: 'Usta zorlukta veya Usta Masası\'nda bir maç kazan', hedef: 1 },
    { id: 'eve', ad: '8 piyonu eve sok', hedef: 8 },
    { id: 'temiz', ad: 'Hiç piyonun kırılmadan bir maç kazan', hedef: 1 },
    { id: 'dortlu', ad: '4 kişilik bir maç kazan', hedef: 1 }
  ];
  var ADIM = 110, ZAR_SURE = 380;

  var $ = function (id) { return document.getElementById(id); };
  var menuEl = $('menu'), oyunEl = $('oyun'), tahtaEl = $('tahta'), bilgiEl = $('bilgi'), zarBtn = $('zar-at');
  var daily = !!(MiniOyun.gunluk && MiniOyun.gunluk.tarih);
  var kayit = yukle();
  var oyun = null, sonSecim = null, ekran = 'menu';
  var zaman = 0, son = 0, duraklat = false, isler = [], balonSure = 0;

  // ---------- Kayıt ----------
  function bosKayit() {
    return { yildiz: {}, bonus: 0, tema: 'klasik', piyon: 'duz', otomatik: true, gorev: null, ist: { mac: 0, galibiyet: 0, kirma: 0, seri: 0, enSeri: 0 } };
  }
  function yukle() {
    var k = bosKayit();
    try {
      var s = JSON.parse(localStorage.getItem(KAYIT));
      if (!s || typeof s !== 'object') return k;
      if (s.yildiz && typeof s.yildiz === 'object') for (var m in s.yildiz) { var y = Math.floor(Number(s.yildiz[m])); if (m >= 1 && m <= 24 && y >= 1 && y <= 3) k.yildiz[m] = y; }
      k.bonus = Math.max(0, Math.floor(Number(s.bonus)) || 0);
      if (typeof s.tema === 'string') k.tema = s.tema;
      if (typeof s.piyon === 'string') k.piyon = s.piyon;
      if (s.otomatik === false) k.otomatik = false;
      if (s.ist && typeof s.ist === 'object') for (var a in k.ist) k.ist[a] = Math.max(0, Math.floor(Number(s.ist[a])) || 0);
      var g = s.gorev;
      if (g && typeof g.tarih === 'string' && Array.isArray(g.liste) && g.ilerleme && typeof g.ilerleme === 'object') {
        k.gorev = { tarih: g.tarih, liste: g.liste.filter(gorevBul).slice(0, 3), ilerleme: {}, tamam: Array.isArray(g.tamam) ? g.tamam.filter(gorevBul) : [] };
        k.gorev.liste.forEach(function (id) { k.gorev.ilerleme[id] = Math.max(0, Number(g.ilerleme[id]) || 0); });
      }
    } catch (e) { return bosKayit(); }
    return k;
  }
  function kaydet() { try { localStorage.setItem(KAYIT, JSON.stringify(kayit)); } catch (e) {} }
  function gorevBul(id) { for (var i = 0; i < GOREVLER.length; i++) if (GOREVLER[i].id === id) return GOREVLER[i]; return null; }
  function macYildiz() { var n = 0; for (var m in kayit.yildiz) n += kayit.yildiz[m]; return n; }
  function toplamYildiz() { return macYildiz() + kayit.bonus; }
  function ligBitti(l) { for (var i = 1; i <= 6; i++) if (!kayit.yildiz[l * 6 + i]) return false; return true; }
  function macAcik(no) { return no === 1 || !!kayit.yildiz[no - 1]; }
  function varyantAcik(v) { return ligBitti(v.lig); }
  function temaAcik(t) { return toplamYildiz() >= t.y; }
  function seciliTema() { for (var i = 0; i < TEMALAR.length; i++) if (TEMALAR[i].id === kayit.tema && temaAcik(TEMALAR[i])) return TEMALAR[i]; return TEMALAR[0]; }
  function seciliPiyon() { for (var i = 0; i < PIYONLAR.length; i++) if (PIYONLAR[i].id === kayit.piyon && toplamYildiz() >= PIYONLAR[i].y) return PIYONLAR[i]; return PIYONLAR[0]; }

  // ---------- Günlük görevler ----------
  function gorevHazirla() {
    var bugun = MiniOyun.gunluk.bugun();
    if (kayit.gorev && kayit.gorev.tarih === bugun && kayit.gorev.liste.length === 3) return;
    var rnd = MiniOyun.gunluk.rastgele(bugun + '/kizma-gorev');
    var havuz = GOREVLER.map(function (g) { return g.id; }), liste = [];
    while (liste.length < 3) liste.push(havuz.splice(Math.floor(rnd() * havuz.length), 1)[0]);
    kayit.gorev = { tarih: bugun, liste: liste, ilerleme: {}, tamam: [] };
    liste.forEach(function (id) { kayit.gorev.ilerleme[id] = 0; });
    kaydet();
  }
  function gorevIlerlet(olay) {
    gorevHazirla();
    var biten = [];
    kayit.gorev.liste.forEach(function (id) {
      if (kayit.gorev.tamam.indexOf(id) !== -1 || !olay[id]) return;
      var g = gorevBul(id);
      kayit.gorev.ilerleme[id] = Math.min(g.hedef, kayit.gorev.ilerleme[id] + olay[id]);
      if (kayit.gorev.ilerleme[id] >= g.hedef) { kayit.gorev.tamam.push(id); kayit.bonus++; biten.push(g.ad); }
    });
    return biten;
  }

  // ---------- Menü ----------
  function yildizlar(y) { return '★★★'.slice(0, y) + '☆☆☆'.slice(y); }
  function menuCiz() {
    gorevHazirla();
    $('gunluk-alan').hidden = !daily;
    $('kampanya-alan').hidden = daily;
    $('yildiz-ozet').textContent = '⭐ ' + toplamYildiz();
    $('galibiyet-ozet').textContent = '🏆 ' + kayit.ist.galibiyet;
    var html = '';
    LIGLER.forEach(function (lig, l) {
      var acik = l === 0 || ligBitti(l - 1), ly = 0;
      for (var i = 1; i <= 6; i++) ly += kayit.yildiz[l * 6 + i] || 0;
      html += '<div class="kb-lig' + (acik ? '' : ' kilitli') + '"><h3>' + (acik ? lig.ikon : '🔒') + ' ' + lig.ad + ' <small>' + ly + '/18 ⭐ · ' + KARAKTER[lig.rakip].ad + '</small></h3><div class="kb-maclar">';
      for (var n = 1; n <= 6; n++) {
        var no = l * 6 + n, a = acik && macAcik(no), y = kayit.yildiz[no] || 0;
        html += '<button type="button" class="kb-mac' + (n === 6 ? ' final' : '') + (a ? '' : ' kilitli') + '" data-mac="' + no + '"' + (a ? '' : ' disabled') +
          ' aria-label="Maç ' + no + (n === 6 ? ' (4 kişilik final)' : '') + (a ? ', ' + y + ' yıldız' : ', kilitli') + '"><b>' + (a ? (n === 6 ? '🏆' : no) : '🔒') + '</b><span>' + (a ? yildizlar(y) : '') + '</span></button>';
      }
      html += '</div></div>';
    });
    $('ligler').innerHTML = html;
    $('varyantlar').innerHTML = VARYANTLAR.map(function (v) {
      var a = varyantAcik(v);
      return '<label class="kb-varyant' + (a ? '' : ' kilitli') + '"><input type="checkbox" data-varyant="' + v.id + '"' + (a ? '' : ' disabled') + '> ' +
        v.ad + ' <small>' + (a ? v.aciklama : '🔒 ' + LIGLER[v.lig].ad + '\'ni bitir') + '</small></label>';
    }).join('');
    $('gorevler').innerHTML = kayit.gorev.liste.map(function (id) {
      var g = gorevBul(id), bitti = kayit.gorev.tamam.indexOf(id) !== -1;
      return '<li class="' + (bitti ? 'tamam' : '') + '" data-gorev="' + id + '">' + (bitti ? '✅ ' : '🎲 ') + g.ad + ' <small>' + kayit.gorev.ilerleme[id] + '/' + g.hedef + ' · +1 ⭐</small></li>';
    }).join('');
    var tema = seciliTema(), piyon = seciliPiyon(), ty = toplamYildiz();
    $('temalar').innerHTML = TEMALAR.map(function (t) {
      var a = temaAcik(t);
      return '<button type="button" class="kb-sec tema-' + t.id + (t === tema ? ' secili' : '') + '" data-tema="' + t.id + '"' + (a ? '' : ' disabled') + '>' + (a ? t.ad : '🔒 ' + t.y + '⭐') + '</button>';
    }).join('');
    $('piyonlar').innerHTML = PIYONLAR.map(function (p) {
      var a = ty >= p.y;
      return '<button type="button" class="kb-sec' + (p === piyon ? ' secili' : '') + '" data-piyon="' + p.id + '"' + (a ? '' : ' disabled') + '>' + (a ? (p.ikon || '⚪') + ' ' + p.ad : '🔒 ' + p.y + '⭐') + '</button>';
    }).join('');
    $('otomatik').checked = kayit.otomatik;
    var ist = kayit.ist;
    $('istatistik').textContent = ist.mac + ' maç · ' + ist.galibiyet + ' galibiyet · ' + ist.kirma + ' piyon kırdın · en uzun seri ' + ist.enSeri;
  }
  function menuGoster() {
    ekran = 'menu';
    menuCiz();
    menuEl.hidden = false;
    oyunEl.hidden = true;
  }
  function seciliDeger(ad) { var e = menuEl.querySelector('[name="' + ad + '"]:checked'); return e ? e.value : null; }
  function varyantSecimi() {
    var v = {};
    Array.prototype.forEach.call(menuEl.querySelectorAll('[data-varyant]'), function (c) { v[c.getAttribute('data-varyant')] = c.checked && !c.disabled; });
    return v;
  }

  menuEl.addEventListener('click', function (e) {
    if (MiniOyun.duraklatildi()) return;
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.hasAttribute('data-mac')) macBaslat({ mod: 'kampanya', no: Number(b.getAttribute('data-mac')) });
    else if (b.id === 'serbest-basla') macBaslat({ mod: 'serbest', kisi: Number(seciliDeger('kisi')), zorluk: seciliDeger('zorluk'), varyant: varyantSecimi() });
    else if (b.id === 'yerel-basla') macBaslat({ mod: 'yerel', kisi: Number(seciliDeger('yerel-kisi')), varyant: varyantSecimi() });
    else if (b.id === 'gunluk-basla') macBaslat({ mod: 'gunluk' });
    else if (b.hasAttribute('data-tema')) { kayit.tema = b.getAttribute('data-tema'); kaydet(); menuCiz(); }
    else if (b.hasAttribute('data-piyon')) { kayit.piyon = b.getAttribute('data-piyon'); kaydet(); menuCiz(); }
  });
  $('otomatik').addEventListener('change', function () { kayit.otomatik = this.checked; kaydet(); });
  $('menuye-don').addEventListener('click', function () { if (!MiniOyun.duraklatildi()) menuGoster(); });

  // ---------- Tahta ----------
  var hucreler = {};
  (function tahtaKur() {
    var tur = {};
    YOL.forEach(function (c, i) { tur[c[0] + ',' + c[1]] = { sinif: 'yol' + (CIKIS.indexOf(i) !== -1 ? ' cikis r' + CIKIS.indexOf(i) : '') + (GUVENLI.indexOf(i) !== -1 ? ' guv' : '') }; });
    EV.forEach(function (ev, r) { ev.forEach(function (c) { tur[c[0] + ',' + c[1]] = { sinif: 'ev r' + r }; }); });
    BAHCE.forEach(function (b, r) { b.forEach(function (c) { tur[c[0] + ',' + c[1]] = { sinif: 'bahce r' + r }; }); });
    tur['5,5'] = { sinif: 'orta' };
    var html = '';
    for (var y = 0; y < 11; y++) for (var x = 0; x < 11; x++) {
      var t = tur[x + ',' + y];
      html += '<div class="kb-h' + (t ? ' ' + t.sinif : ' bos') + '" data-x="' + x + '" data-y="' + y + '">' + (t && t.sinif === 'orta' ? '🎲' : '') + '</div>';
    }
    tahtaEl.innerHTML = html;
    Array.prototype.forEach.call(tahtaEl.children, function (h) { hucreler[h.dataset.x + ',' + h.dataset.y] = h; });
  })();

  function hucre(o, i) {
    var p = oyun.oyuncular[o].piyon[i], r = oyun.oyuncular[o].renk;
    if (p < 0) return BAHCE[r][i];
    if (p >= 40) return EV[r][p - 40];
    return YOL[(CIKIS[r] + p) % 40];
  }
  function mutlak(o, p) { return (CIKIS[oyun.oyuncular[o].renk] + p) % 40; }
  // Yoldaki bir karede duran piyon: { o, i } veya null
  function kareda(abs) {
    for (var o = 0; o < oyun.oyuncular.length; o++) {
      var ps = oyun.oyuncular[o].piyon;
      for (var i = 0; i < ps.length; i++) if (ps[i] >= 0 && ps[i] < 40 && mutlak(o, ps[i]) === abs) return { o: o, i: i };
    }
    return null;
  }
  function hamle(o, i, d) {
    var ps = oyun.oyuncular[o].piyon, p = ps[i], q;
    if (p >= 40 && p + d > 43) return null;
    if (p < 0) { if (d !== 6) return null; q = 0; } else q = p + d;
    if (q > 43) return null;
    if (q >= 40) {
      // Ev yolunda kendi piyonunun üstüne konamaz ve onun üstünden atlayamaz
      for (var r = Math.max(p + 1, 40); r <= q; r++) if (ps.indexOf(r) !== -1) return null;
      return { o: o, i: i, p: p, q: q, kir: null };
    }
    var abs = mutlak(o, q), k = kareda(abs);
    if (k && k.o === o) return null;
    if (k && oyun.varyant.guvenli && GUVENLI.indexOf(abs) !== -1) return null;
    return { o: o, i: i, p: p, q: q, kir: k };
  }
  function hamleler(o, d) {
    var h = [];
    for (var i = 0; i < oyun.oyuncular[o].piyon.length; i++) { var m = hamle(o, i, d); if (m) h.push(m); }
    return h;
  }
  function tumHamleler(o) {
    if (oyun.zarlar.length === 1) return hamleler(o, oyun.zarlar[0]);
    return hamleler(o, oyun.zarlar[oyun.secZar]);
  }
  function yoldaPiyonVar(o) { return oyun.oyuncular[o].piyon.some(function (p) { return p >= 0 && p < 40; }); }
  function bitirdi(o) { return oyun.oyuncular[o].piyon.every(function (p) { return p >= 40; }); }

  // ---------- Bilgisayar ----------
  // abs karesindeki bir piyon için tehdit sayısı: 1-6 kare gerisindeki rakipler (+ rakip çıkış karesiyse bahçedekiler)
  function tehdit(o, abs, haric) {
    var n = 0;
    oyun.oyuncular.forEach(function (pl, r) {
      if (r === o) return;
      if (oyun.varyant.guvenli && GUVENLI.indexOf(abs) !== -1) return;
      pl.piyon.forEach(function (p, j) {
        if (haric && haric.o === r && haric.i === j) return;
        if (p >= 0 && p < 40) {
          var dist = (abs - mutlak(r, p) + 40) % 40;
          if (dist >= 1 && dist <= 6 && p + dist <= 39) n++;
        } else if (p < 0 && CIKIS[pl.renk] === abs) n += 0.5;
      });
    });
    return n;
  }
  function puanla(m, w) {
    var s = 0;
    if (m.kir) s += w.kir + oyun.oyuncular[m.kir.o].piyon[m.kir.i] * 0.05;
    if (m.p < 0) s += w.cikis;
    if (m.q >= 40 && m.p < 40) s += w.eve;
    if (m.q >= 40 && m.p >= 40) s += 0.5;
    var once = m.p >= 0 && m.p < 40 ? tehdit(m.o, mutlak(m.o, m.p)) : 0;
    var sonra = m.q < 40 ? tehdit(m.o, mutlak(m.o, m.q), m.kir) : 0;
    if (once > 0 && sonra === 0) s += w.kac;
    s -= w.risk * sonra;
    s += w.ilerle * Math.max(m.p, 0) - w.denge * Math.max(m.p, 0);
    return s;
  }
  function bilgisayarSec(o, list) {
    var pl = oyun.oyuncular[o], k = KARAKTER[pl.karakter];
    if (pl.zeka < 1 && oyun.aiRnd() > pl.zeka) return list[Math.floor(oyun.aiRnd() * list.length)];
    var en = list[0], ep = -Infinity;
    list.forEach(function (m) { var s = puanla(m, k.w); if (s > ep + 1e-9) { ep = s; en = m; } });
    return en;
  }
  // Çift zarda bilgisayar iki zar için de en iyi hamleyi seçer
  function bilgisayarZarSec(o) {
    if (oyun.zarlar.length === 1) return;
    var k = KARAKTER[oyun.oyuncular[o].karakter], en = 0, ep = -Infinity;
    oyun.zarlar.forEach(function (d, z) {
      hamleler(o, d).forEach(function (m) { var s = puanla(m, k.w) + (d === 6 ? 2 : 0); if (s > ep) { ep = s; en = z; } });
    });
    oyun.secZar = en;
  }

  // ---------- Maç ----------
  function macBaslat(secim) {
    if (secim) sonSecim = secim;
    secim = sonSecim;
    if (!secim) { menuGoster(); return; }
    var kisi = 2, rakipler = [], zeka = 1, varyant = { hizli: false, guvenli: false, cift: false }, seviye, baslik, insanSay = 1;
    if (secim.mod === 'kampanya') {
      var l = Math.floor((secim.no - 1) / 6), n = (secim.no - 1) % 6 + 1, lig = LIGLER[l];
      zeka = Math.min(1, lig.zeka + (n - 1) * 0.02);
      if (n === 6) { kisi = 4; rakipler = [lig.rakip, (lig.rakip + 1) % 4, (lig.rakip + 2) % 4]; }
      else rakipler = [lig.rakip];
      seviye = 'maç ' + secim.no;
      baslik = lig.ikon + ' ' + lig.ad + ' · ' + (n === 6 ? 'Final' : 'Maç ' + n);
    } else if (secim.mod === 'serbest') {
      var z = SERBEST[secim.zorluk] ? secim.zorluk : 'orta';
      kisi = secim.kisi === 4 ? 4 : 2;
      zeka = SERBEST[z].zeka;
      rakipler = kisi === 4 ? [1, 2, SERBEST[z].rakip === 3 ? 3 : 0] : [SERBEST[z].rakip];
      varyant = secim.varyant || varyant;
      seviye = z;
      baslik = 'Serbest oyun · ' + { kolay: 'Kolay', orta: 'Orta', usta: 'Usta' }[z] + ' · ' + kisi + ' kişi';
    } else if (secim.mod === 'yerel') {
      kisi = Math.min(4, Math.max(2, secim.kisi || 2));
      insanSay = kisi;
      varyant = secim.varyant || varyant;
      seviye = 'yerel';
      baslik = 'Aynı cihazda · ' + kisi + ' kişi';
    } else {
      rakipler = [2];
      seviye = 'orta';
      baslik = 'Günlük maç · ' + MiniOyun.gunluk.tarih;
    }
    var renkler = kisi === 2 ? [0, 2] : kisi === 3 ? [0, 1, 2] : [0, 1, 2, 3];
    var piyonSay = varyant.hizli ? 2 : 4;
    oyun = {
      mod: secim.mod, secim: secim, seviye: seviye, varyant: varyant,
      oyuncular: renkler.map(function (r, j) {
        var insan = j < insanSay;
        return { renk: r, insan: insan, karakter: insan ? -1 : rakipler[j - 1], zeka: zeka, piyon: Array(piyonSay).fill(-1), kirdi: 0, kirildi: 0, eve: 0 };
      }),
      // Zar dizisi oyunun tohumundan; günlük modda herkese aynı
      zarRnd: MiniOyun.rastgele(),
      aiRnd: daily ? MiniOyun.gunluk.rastgele(MiniOyun.gunluk.tarih + '/kizma-ai') : Math.random,
      sira: 0, zarlar: [], secZar: 0, altiSay: 0, deneme: 0, faz: 'zar', tur: 0, adim: 0, gecmis: [], seri6: false, sonAlti: false,
      secim2: 0, bitti: false
    };
    isler = [];
    ekran = 'mac';
    menuEl.hidden = true;
    oyunEl.hidden = false;
    $('mac-ad').textContent = baslik;
    tahtaEl.className = 'kb-tahta tema-' + seciliTema().id + (varyant.guvenli ? ' guvenli' : '');
    $('zar2').hidden = !varyant.cift;
    oyuncuKartlari();
    var ilkRakip = oyun.oyuncular[1];
    if (!ilkRakip.insan) balon(ilkRakip, KARAKTER[ilkRakip.karakter].laf.bas);
    else balonGizle();
    siraBasla();
    if (oyunEl.scrollIntoView) oyunEl.scrollIntoView({ block: 'nearest' });
  }

  function oyuncuKartlari() {
    $('oyuncular').innerHTML = oyun.oyuncular.map(function (pl, o) {
      var ad = pl.insan ? (oyun.mod === 'yerel' ? RENKLER[pl.renk].ad : 'Sen') : KARAKTER[pl.karakter].ad;
      var av = pl.insan ? '🙂' : KARAKTER[pl.karakter].avatar;
      return '<div class="kb-oyuncu r' + pl.renk + (o === oyun.sira ? ' aktif' : '') + '" data-o="' + o + '"><span class="av" aria-hidden="true">' + av + '</span><span class="ad">' + ad +
        '</span><span class="evde">' + pl.piyon.filter(function (p) { return p >= 40; }).length + '/' + pl.piyon.length + ' 🏠</span></div>';
    }).join('');
  }
  function balon(pl, metin) {
    var e = $('balon');
    e.textContent = KARAKTER[pl.karakter].avatar + ' ' + KARAKTER[pl.karakter].ad + ': “' + metin + '”';
    e.hidden = false;
    balonSure = 2200;
  }
  function balonGizle() { $('balon').hidden = true; balonSure = 0; }

  function zarCiz(el, d, donuyor) {
    el.dataset.deger = d || '';
    el.classList.toggle('donuyor', !!donuyor);
    var html = '';
    var NOK = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }[d] || [];
    for (var i = 0; i < 9; i++) html += '<i' + (NOK.indexOf(i) !== -1 ? ' class="n"' : '') + '></i>';
    el.innerHTML = html;
  }

  function ciz() {
    Array.prototype.forEach.call(tahtaEl.querySelectorAll('.kb-piyon'), function (e) { e.remove(); });
    var hs = oyun.faz === 'sec' ? tumHamleler(oyun.sira) : [];
    var ikon = seciliPiyon().ikon;
    oyun.oyuncular.forEach(function (pl, o) {
      pl.piyon.forEach(function (p, i) {
        var c = hucre(o, i), m = null;
        hs.forEach(function (h) { if (h.o === o && h.i === i) m = h; });
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'kb-piyon r' + pl.renk + (m ? ' oynar' : '') + (m && oyun.secim2 === i ? ' secili' : '');
        b.dataset.o = o; b.dataset.i = i; b.dataset.p = p;
        if (m) { b.dataset.hedef = m.q; b.dataset.kir = m.kir ? '1' : '0'; }
        b.tabIndex = m ? 0 : -1;
        b.setAttribute('aria-label', RENKLER[pl.renk].ad + ' piyon ' + (i + 1) + (p < 0 ? ', başlangıçta' : p >= 40 ? ', evde' : ', ' + (p + 1) + '. karede') + (m ? ', oynatılabilir' : ''));
        b.textContent = ikon;
        hucreler[c[0] + ',' + c[1]].appendChild(b);
      });
    });
    var durum = oyun.oyuncular.map(function (pl, o) { return o + ':' + pl.piyon.join(','); }).join('|');
    tahtaEl.dataset.durum = durum;
    tahtaEl.dataset.faz = oyun.faz;
    tahtaEl.dataset.sira = oyun.sira;
    tahtaEl.dataset.zar = oyun.zarlar.join(',');
    tahtaEl.dataset.adim = oyun.adim;
    tahtaEl.dataset.gecmis = oyun.gecmis.slice(0, 30).join('');
    tahtaEl.dataset.kirma = oyun.oyuncular.reduce(function (s, p) { return s + p.kirdi; }, 0);
    var insanSira = oyun.oyuncular[oyun.sira].insan;
    zarBtn.disabled = !(oyun.faz === 'zar' && insanSira);
    Array.prototype.forEach.call(document.querySelectorAll('#oyuncular .kb-oyuncu'), function (e, o) {
      e.classList.toggle('aktif', o === oyun.sira);
      e.querySelector('.evde').textContent = oyun.oyuncular[o].piyon.filter(function (p) { return p >= 40; }).length + '/' + oyun.oyuncular[o].piyon.length + ' 🏠';
    });
    $('zar1').classList.toggle('secili', oyun.zarlar.length > 1 && oyun.secZar === 0);
    $('zar2').classList.toggle('secili', oyun.zarlar.length > 1 && oyun.secZar === 1);
  }

  function oyuncuAdi(o) {
    var pl = oyun.oyuncular[o];
    if (pl.insan) return oyun.mod === 'yerel' ? RENKLER[pl.renk].ad : 'Sen';
    return KARAKTER[pl.karakter].ad;
  }
  function bekle(ms, fn) { isler.push({ t: zaman + ms, fn: fn }); }

  function siraBasla() {
    var pl = oyun.oyuncular[oyun.sira];
    oyun.faz = 'zar';
    oyun.zarlar = [];
    if (pl.insan && oyun.altiSay === 0 && oyun.deneme === 0 && (oyun.mod === 'yerel' || oyun.sira === 0)) oyun.tur++;
    if (pl.insan) bilgiEl.textContent = (oyun.mod === 'yerel' ? RENKLER[pl.renk].ad + ' oynuyor: ' : 'Sıra sende: ') + 'zarı at (Boşluk / Enter).';
    else { bilgiEl.textContent = oyuncuAdi(oyun.sira) + ' zar atıyor…'; bekle(450, zarAt); }
    ciz();
  }

  function zarAt() {
    if (!oyun || oyun.faz !== 'zar') return;
    oyun.faz = 'donuyor';
    var n = oyun.varyant.cift ? 2 : 1;
    oyun.zarlar = [];
    for (var i = 0; i < n; i++) oyun.zarlar.push(1 + Math.floor(oyun.zarRnd() * 6));
    oyun.gecmis = oyun.gecmis.concat(oyun.zarlar);
    oyun.secZar = 0;
    MiniOyun.ses('tik');
    zarCiz($('zar1'), oyun.zarlar[0], true);
    if (n === 2) zarCiz($('zar2'), oyun.zarlar[1], true);
    ciz();
    bekle(ZAR_SURE, zarSonrasi);
  }

  function zarSonrasi() {
    zarCiz($('zar1'), oyun.zarlar[0], false);
    if (oyun.zarlar.length > 1) zarCiz($('zar2'), oyun.zarlar[1], false);
    var o = oyun.sira, pl = oyun.oyuncular[o];
    var alti = oyun.zarlar.indexOf(6) !== -1;
    if (alti) {
      oyun.altiSay++;
      if (pl.insan && o === 0 && oyun.sonAlti) oyun.seri6 = true;
      if (oyun.altiSay >= 3) {
        bilgiEl.textContent = oyuncuAdi(o) + ': üst üste üç 6! Sıra yandı.';
        oyun.faz = 'bekle';
        ciz();
        bekle(900, siradaki);
        return;
      }
    }
    if (pl.insan && o === 0) oyun.sonAlti = alti;
    // Çift zarda seçili zarla hamle yoksa diğerine geç
    if (oyun.zarlar.length > 1 && !hamleler(o, oyun.zarlar[0]).length) oyun.secZar = 1;
    if (!pl.insan) bilgisayarZarSec(o);
    var list = tumHamleler(o);
    if (!list.length) {
      oyun.faz = 'bekle';
      if (!alti && !yoldaPiyonVar(o) && oyun.deneme < 2) {
        oyun.deneme++;
        bilgiEl.textContent = oyuncuAdi(o) + ': oynatılacak piyon yok, ' + (oyun.deneme + 1) + '. deneme.';
        ciz();
        bekle(600, function () { siraBasla(); });
      } else {
        bilgiEl.textContent = oyuncuAdi(o) + ': oynatılacak piyon yok.';
        ciz();
        bekle(700, alti ? siraBasla : siradaki);
      }
      return;
    }
    if (pl.insan) {
      if (list.length === 1 && kayit.otomatik && oyun.zarlar.length === 1) { oyun.faz = 'bekle'; ciz(); bekle(250, function () { oyna(list[0]); }); return; }
      oyun.faz = 'sec';
      oyun.secim2 = list[0].i;
      bilgiEl.textContent = 'Parlayan piyonlardan birini seç (dokun, ←/→ ve Enter veya 1-4)' + (oyun.zarlar.length > 1 ? '; D ile zarı değiştir.' : '.');
      ciz();
      return;
    }
    oyun.faz = 'bekle';
    ciz();
    var m = bilgisayarSec(o, list);
    bekle(300, function () { oyna(m); });
  }

  function oyna(m) {
    oyun.faz = 'hareket';
    oyun.deneme = 0;
    var pl = oyun.oyuncular[m.o];
    var adimlar = m.p < 0 ? [0] : [];
    for (var s = m.p + 1; m.p >= 0 && s <= m.q; s++) adimlar.push(s);
    var k = 0;
    (function adim() {
      pl.piyon[m.i] = adimlar[k++];
      oyun.adim++;
      ciz();
      if (k < adimlar.length) { bekle(ADIM, adim); return; }
      bitir();
    })();
    function bitir() {
      if (m.kir) {
        var hedef = oyun.oyuncular[m.kir.o];
        hedef.piyon[m.kir.i] = -1;
        pl.kirdi++; hedef.kirildi++;
        MiniOyun.ses('puan');
        if (!pl.insan) balon(pl, KARAKTER[pl.karakter].laf.kir);
        else if (!hedef.insan) balon(hedef, KARAKTER[hedef.karakter].laf.kirildi);
        bilgiEl.textContent = oyuncuAdi(m.o) + ', ' + oyuncuAdi(m.kir.o) + ' piyonunu kırdı!';
      } else MiniOyun.ses('tik');
      if (m.q >= 40 && m.p < 40) pl.eve++;
      ciz();
      if (bitirdi(m.o)) { bekle(500, function () { macBitti(m.o); }); return; }
      var alti = oyun.zarlar[oyun.secZar] === 6;
      bekle(320, alti ? siraBasla : siradaki);
    }
  }

  function siradaki() {
    oyun.altiSay = 0;
    oyun.deneme = 0;
    oyun.sira = (oyun.sira + 1) % oyun.oyuncular.length;
    if (oyun.sira !== 0) oyun.sonAlti = false;
    siraBasla();
  }

  // ---------- Maç sonu ----------
  function ilerleme(pl) { return pl.piyon.reduce(function (s, p) { return s + p + 1; }, 0); }
  function macBitti(kazanan) {
    oyun.faz = 'bitti';
    oyun.bitti = true;
    ekran = 'bitti';
    ciz();
    var sira = oyun.oyuncular.map(function (pl, o) { return o; }).sort(function (a, b) {
      if (a === kazanan) return -1;
      if (b === kazanan) return 1;
      return ilerleme(oyun.oyuncular[b]) - ilerleme(oyun.oyuncular[a]);
    });
    if (oyun.mod === 'yerel') {
      MiniOyun.bitti({
        baslik: RENKLER[oyun.oyuncular[kazanan].renk].ad + ' kazandı! 🎉',
        metin: 'Sıralama: ' + sira.map(function (o, j) { return (j + 1) + '. ' + RENKLER[oyun.oyuncular[o].renk].ad; }).join(', '),
        paylas: 'Kızma Birader\'de arkadaşlarımla oynadık, ' + RENKLER[oyun.oyuncular[kazanan].renk].ad + ' kazandı!'
      });
      return;
    }
    var ben = oyun.oyuncular[0], kazandi = kazanan === 0, notlar = [];
    var puan = kazandi ? Math.max(100, 1000 + ben.kirdi * 50 - oyun.tur * 5) : 0;
    var yildiz = 0;
    var ist = kayit.ist;
    ist.mac++;
    ist.kirma += ben.kirdi;
    if (kazandi) { ist.galibiyet++; ist.seri++; ist.enSeri = Math.max(ist.enSeri, ist.seri); } else ist.seri = 0;
    if (oyun.mod === 'kampanya' && kazandi) {
      var no = oyun.secim.no, n = (no - 1) % 6 + 1;
      yildiz = 1 + (ben.kirdi >= 2 ? 1 : 0) + ((n === 6 ? oyun.tur <= 30 : ben.kirildi === 0) ? 1 : 0);
      var once = kayit.yildiz[no] || 0;
      if (yildiz > once) kayit.yildiz[no] = yildiz;
      if (!once) {
        if (n === 6) {
          var l = (no - 1) / 6 | 0;
          notlar.push(l < 3 ? LIGLER[l + 1].ad + ' açıldı!' : 'Turnuvanın şampiyonu sensin!');
          VARYANTLAR.forEach(function (v) { if (v.lig === l) notlar.push('Yeni kural: ' + v.ad + '.'); });
        } else notlar.push('Sıradaki maç açıldı.');
      }
    }
    var onceY = toplamYildiz();
    if (oyun.mod !== 'gunluk') {
      var biten = gorevIlerlet({
        kir3: ben.kirdi >= 3 ? 1 : 0, kirma: ben.kirdi, seri6: oyun.seri6 ? 1 : 0, kazan2: kazandi ? 1 : 0,
        usta: kazandi && (oyun.seviye === 'usta' || (oyun.mod === 'kampanya' && oyun.secim.no > 18)) ? 1 : 0,
        eve: ben.eve, temiz: kazandi && ben.kirildi === 0 ? 1 : 0, dortlu: kazandi && oyun.oyuncular.length === 4 ? 1 : 0
      });
      if (biten.length) notlar.push('Görev tamam: ' + biten.join(', ') + ' (+' + biten.length + ' ⭐)');
    }
    var yeniAcilan = TEMALAR.filter(function (t) { return t.y > onceY && t.y <= toplamYildiz(); }).map(function (t) { return t.ad + ' teması'; })
      .concat(PIYONLAR.filter(function (p) { return p.y > onceY && p.y <= toplamYildiz(); }).map(function (p) { return p.ad + ' piyonu'; }));
    if (yeniAcilan.length) notlar.push('Açıldı: ' + yeniAcilan.join(', ') + '.');
    kaydet();
    var rekor = kazandi ? MiniOyun.setBest('kizma-birader', puan) : false;
    var yer = sira.indexOf(0) + 1;
    var metin = (kazandi ? puan + ' puan · ' + ben.kirdi + ' piyon kırdın · ' + oyun.tur + ' tur' + (yildiz ? ' · ' + yildizlar(yildiz) : '')
      : oyuncuAdi(kazanan) + ' önce bitirdi' + (oyun.oyuncular.length > 2 ? ' · ' + yer + '. oldun' : '') + ' · ' + ben.kirdi + ' piyon kırdın') +
      (notlar.length ? ' · ' + notlar.join(' ') : '');
    var opts = {
      baslik: kazandi ? 'Kazandın! ' + (yildiz ? Array(yildiz + 1).join('⭐') : '🎉') : 'Kaybettin, kızma birader!',
      metin: metin, rekor: rekor, kaybetti: !kazandi, seviye: oyun.seviye,
      sonuc: kazandi ? puan + ' puan, ' + oyun.tur + ' tur' : yer + '. sıra',
      paylas: kazandi ? 'Kızma Birader\'de ' + oyun.tur + ' turda kazandım, ' + puan + ' puan!' : 'Kızma Birader\'de bu sefer kızdım!'
    };
    if (kazandi) opts.skor = puan;
    MiniOyun.bitti(opts);
  }

  // ---------- Girişler ----------
  function insanSirasi() { return oyun && ekran === 'mac' && oyun.oyuncular[oyun.sira].insan; }
  zarBtn.addEventListener('click', function () {
    if (MiniOyun.duraklatildi() || !insanSirasi() || oyun.faz !== 'zar') return;
    zarAt();
  });
  function zarDegistir(z) {
    if (oyun.zarlar.length < 2 || z === oyun.secZar || !hamleler(oyun.sira, oyun.zarlar[z]).length) return;
    oyun.secZar = z;
    var l = tumHamleler(oyun.sira);
    oyun.secim2 = l[0].i;
    ciz();
  }
  $('zar1').addEventListener('click', function () { if (!MiniOyun.duraklatildi() && insanSirasi() && oyun.faz === 'sec') zarDegistir(0); });
  $('zar2').addEventListener('click', function () { if (!MiniOyun.duraklatildi() && insanSirasi() && oyun.faz === 'sec') zarDegistir(1); });
  function piyonSec(i) {
    var m = null;
    tumHamleler(oyun.sira).forEach(function (h) { if (h.i === i) m = h; });
    if (m) oyna(m);
  }
  tahtaEl.addEventListener('click', function (e) {
    if (MiniOyun.duraklatildi() || !insanSirasi() || oyun.faz !== 'sec') return;
    var b = e.target.closest('.kb-piyon');
    if (b && b.classList.contains('oynar')) piyonSec(Number(b.dataset.i));
  });
  document.addEventListener('keydown', function (e) {
    if (ekran !== 'mac' || MiniOyun.duraklatildi() || e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    var k = e.key;
    if (!insanSirasi()) { if (k === ' ' || k.indexOf('Arrow') === 0) e.preventDefault(); return; }
    if (oyun.faz === 'zar') {
      if (k === ' ' || k === 'Enter') { e.preventDefault(); zarAt(); }
      return;
    }
    if (oyun.faz !== 'sec') { if (k === ' ' || k.indexOf('Arrow') === 0) e.preventDefault(); return; }
    var list = tumHamleler(oyun.sira).map(function (h) { return h.i; });
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown') {
      e.preventDefault();
      var j = list.indexOf(oyun.secim2), yon = k === 'ArrowLeft' || k === 'ArrowUp' ? -1 : 1;
      oyun.secim2 = list[((j < 0 ? 0 : j + yon) + list.length) % list.length];
      ciz();
    } else if (k === ' ' || k === 'Enter') { e.preventDefault(); piyonSec(oyun.secim2); }
    else if (k >= '1' && k <= '4') piyonSec(Number(k) - 1);
    else if (k === 'd' || k === 'D') zarDegistir(1 - oyun.secZar);
  });

  // ---------- Döngü ----------
  function dongu(t) {
    var dt = Math.min(100, Math.max(0, t - son));
    son = t;
    if (!duraklat && ekran !== 'menu') {
      zaman += dt;
      if (balonSure > 0 && (balonSure -= dt) <= 0) balonGizle();
      // Sırası gelen işleri çalıştır; iş yeni iş ekleyebilir
      for (var g = 0; g < 20; g++) {
        var hazir = isler.filter(function (x) { return x.t <= zaman; });
        if (!hazir.length) break;
        isler = isler.filter(function (x) { return x.t > zaman; });
        hazir.forEach(function (x) { if (ekran === 'mac') x.fn(); });
      }
    }
    requestAnimationFrame(dongu);
  }

  MiniOyun.oyun({
    restart: function () { macBaslat(); },
    pause: function () { duraklat = true; },
    resume: function () { duraklat = false; son = performance.now(); },
    canPause: function () { return ekran === 'mac'; },
    seviye: function () { return oyun ? oyun.seviye : 'orta'; }
  });

  zarCiz($('zar1'), 6, false);
  zarCiz($('zar2'), 6, false);
  menuGoster();
  son = performance.now();
  requestAnimationFrame(dongu);
})();

// Penaltı Ligi: penaltı at, kaleyi koru. Kariyer (4 lig × 6 maç + Kupa Finali, yıldızlar, para,
// 4 yükseltme, açılan formalar ve toplar, günlük görevler; kayıt mo_penalti), Hızlı Maç
// (Kolay/Normal/Zor) ve günlük meydan okuma (Normal, yükseltmesiz, tarihe bağlı rakip davranışı).
(function () {
  var KAYIT = 'mo_penalti';
  var W = 480, H = 560;
  // Kale: üst direk y=110, zemin y=260, direkler x=60 ve x=420. u ∈ [-1, 1] yatay, v ∈ [0, 1] yükseklik.
  var KALE = { x: 60, y: 110, w: 360, h: 150 };
  var NOKTA = { x: 240, y: 430 };
  var BAR = { x: 60, y: 518, w: 360, h: 20 };

  var LIGLER = [
    { ad: 'Mahalle Ligi', takimlar: ['Çınaraltı Gençlik', 'Bahçeli Sokak', 'Dereboyu Spor', 'Fırınarkası', 'Yokuşbaşı', 'Pazaryeri Gücü'] },
    { ad: 'Amatör Lig', takimlar: ['Ege Yıldızları', 'Toros Kartalları', 'Kızılırmak Spor', 'Lodos Gücü', 'Meşe Gençlik', 'Sahil Dalgaları'] },
    { ad: 'Bölge Ligi', takimlar: ['Boğaziçi Kartalları', 'Kapadokya Balonları', 'Karadeniz Fırtınası', 'Yayla Kurtları', 'Liman Denizcileri', 'Bozkır Atları'] },
    { ad: 'Elit Lig', takimlar: ['Altın Şahinler', 'Demirkapı Spor', 'Mavi Yunuslar', 'Kuzey Yıldızı', 'Volkan Gücü', 'Şimşek Spor'] }
  ];
  var FINAL_RAKIP = 'Efsaneler Karması';
  // Zorluk: 0-3 ligler, 4 Kupa Finali. hiz: güç çubuğunun saniyedeki tarama sayısı; yesil: yeşil bölge genişliği;
  // refleks: rakip kalecinin uzanma mesafesi; okuma: doğru tarafa atlama olasılığı; ipucu: atıcının yönünü
  // belli ettiği süre (ms); yalan: yanıltıcı ipucu oranı; kose: rakibin köşeye vurma oranı; kacir: rakibin auta atma oranı.
  var ZORLUK = [
    { hiz: 0.7, yesil: 0.22, refleks: 0.38, okuma: 0.3, ipucu: 900, yalan: 0, kose: 0.3, kacir: 0.18 },
    { hiz: 0.85, yesil: 0.18, refleks: 0.43, okuma: 0.4, ipucu: 760, yalan: 0.12, kose: 0.45, kacir: 0.14 },
    { hiz: 1.0, yesil: 0.15, refleks: 0.48, okuma: 0.5, ipucu: 620, yalan: 0.22, kose: 0.6, kacir: 0.1 },
    { hiz: 1.15, yesil: 0.13, refleks: 0.53, okuma: 0.58, ipucu: 520, yalan: 0.3, kose: 0.7, kacir: 0.07 },
    { hiz: 1.3, yesil: 0.12, refleks: 0.57, okuma: 0.65, ipucu: 460, yalan: 0.35, kose: 0.8, kacir: 0.05 }
  ];
  var HIZLI = { kolay: 0, normal: 1, zor: 3 };
  var YUKSELTMELER = [
    { id: 'isabet', ikon: '🎯', ad: 'Şut İsabeti', aciklama: 'Yeşil bölge genişler' },
    { id: 'guc', ikon: '💥', ad: 'Şut Gücü', aciklama: 'Daha az sapma, kaleci zor uzanır' },
    { id: 'refleks', ikon: '🧤', ad: 'Kaleci Refleksi', aciklama: 'Atlamak için daha çok zaman' },
    { id: 'okuma', ikon: '👀', ad: 'Kaleci Okuma', aciklama: 'Atıcının yönü daha erken belli olur' }
  ];
  var BEDEL = [40, 80, 140, 220, 320];
  // Her lig bitince bir forma ve bir top deseni açılır; Kupa Finali sonuncuları açar.
  var FORMALAR = [
    { id: 'mavi', ad: 'Mavi', renk: '#2563eb' }, { id: 'kirmizi', ad: 'Kırmızı', renk: '#dc2626' },
    { id: 'turuncu', ad: 'Turuncu', renk: '#f97316' }, { id: 'mor', ad: 'Mor', renk: '#7c3aed' },
    { id: 'siyah', ad: 'Gece', renk: '#1f2937' }, { id: 'altin', ad: 'Altın', renk: '#d4a017' }
  ];
  var TOPLAR = [
    { id: 'klasik', ad: 'Klasik', renk: '' }, { id: 'ates', ad: 'Ateş', renk: '#ef4444' },
    { id: 'buz', ad: 'Buz', renk: '#38bdf8' }, { id: 'zumrut', ad: 'Zümrüt', renk: '#22c55e' },
    { id: 'yildiz', ad: 'Yıldız', renk: '#facc15' }, { id: 'kupa', ad: 'Kupa', renk: '#e879f9' }
  ];
  var GOREVLER = [
    { id: 'kose', ad: '3 köşe golü at', hedef: 3, para: 30 },
    { id: 'temiz', ad: 'Bir maçı gol yemeden kazan', hedef: 1, para: 40 },
    { id: 'panenka', ad: 'Ortaya vuruşla (panenka) gol at', hedef: 1, para: 30 },
    { id: 'kurtaris', ad: '4 penaltı kurtar', hedef: 4, para: 35 },
    { id: 'galibiyet', ad: '2 maç kazan', hedef: 2, para: 40 },
    { id: 'gol', ad: '10 gol at', hedef: 10, para: 30 },
    { id: 'ucyildiz', ad: 'Bir kariyer maçında 3 yıldız al', hedef: 1, para: 50 }
  ];
  var RAKIP_RENK = ['#16a34a', '#e11d48', '#0891b2', '#ca8a04', '#9333ea', '#ea580c', '#475569'];

  var $ = function (id) { return document.getElementById(id); };
  var cv = $('alan'), ctx = cv.getContext('2d');
  var menuEl = $('menu'), oyunEl = $('oyun'), bilgiEl = $('bilgi');
  var daily = !!(MiniOyun.gunluk && MiniOyun.gunluk.tarih);
  var azHareket = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var kayit = yukle();
  var ayar = null, sonSecim = null, mac = null;
  var ekran = 'menu'; // menu | mac | bitti
  var zaman = 0, son = 0, duraklat = false;

  // ---------- Kayıt ----------
  function bosKayit() {
    return { lig: 0, maclar: {}, para: 0, yukseltme: { isabet: 0, guc: 0, refleks: 0, okuma: 0 }, acilan: [], secim: { forma: 'mavi', top: 'klasik' }, gorev: null };
  }
  function yukle() {
    var k = bosKayit();
    try {
      var s = JSON.parse(localStorage.getItem(KAYIT));
      if (!s || typeof s !== 'object' || !s.maclar || typeof s.maclar !== 'object') return k;
      for (var m in s.maclar) { var y = Number(s.maclar[m]); if (y >= 1 && y <= 3) k.maclar[m] = Math.floor(y); }
      k.para = Math.max(0, Math.floor(Number(s.para)) || 0);
      YUKSELTMELER.forEach(function (u) { k.yukseltme[u.id] = Math.min(5, Math.max(0, Math.floor(Number(s.yukseltme && s.yukseltme[u.id])) || 0)); });
      if (Array.isArray(s.acilan)) k.acilan = s.acilan.filter(function (x) { return typeof x === 'string'; });
      if (s.secim && typeof s.secim === 'object') { k.secim.forma = String(s.secim.forma || 'mavi'); k.secim.top = String(s.secim.top || 'klasik'); }
      var g = s.gorev;
      if (g && typeof g.tarih === 'string' && Array.isArray(g.liste) && g.ilerleme && typeof g.ilerleme === 'object') {
        k.gorev = { tarih: g.tarih, liste: g.liste.filter(gorevBul).slice(0, 3), ilerleme: {}, tamam: Array.isArray(g.tamam) ? g.tamam.slice(0, 3) : [] };
        k.gorev.liste.forEach(function (id) { k.gorev.ilerleme[id] = Math.max(0, Number(g.ilerleme[id]) || 0); });
      }
    } catch (e) { return bosKayit(); }
    k.lig = acikLig(k);
    return k;
  }
  function kaydet() {
    try { localStorage.setItem(KAYIT, JSON.stringify(kayit)); } catch (e) {}
  }
  function gorevBul(id) { for (var i = 0; i < GOREVLER.length; i++) if (GOREVLER[i].id === id) return GOREVLER[i]; return null; }
  function ligBitti(k, l) { for (var i = 1; i <= 6; i++) if (!k.maclar[(l + 1) + '-' + i]) return false; return true; }
  function acikLig(k) { var l = 0; while (l < 3 && ligBitti(k, l)) l++; return l; }
  function macAcik(l, n) {
    if (l > kayit.lig) return false;
    return n === 1 || !!kayit.maclar[(l + 1) + '-' + (n - 1)];
  }
  function finalAcik() { return ligBitti(kayit, 3); }
  function ligYildiz(l) { var n = 0; for (var i = 1; i <= 6; i++) n += kayit.maclar[(l + 1) + '-' + i] || 0; return n; }
  function toplamYildiz() { var n = 0; for (var k in kayit.maclar) n += kayit.maclar[k]; return n; }
  // Açılan içerik: lig bitince formalar[l+1] ve toplar[l+1], final kazanılınca sonuncular
  function acilanGuncelle() {
    var yeni = [];
    for (var l = 0; l <= 4; l++) {
      var bitti = l < 4 ? ligBitti(kayit, l) : !!kayit.maclar.final;
      if (!bitti) continue;
      ['forma:' + FORMALAR[l + 1].id, 'top:' + TOPLAR[l + 1].id].forEach(function (id) {
        if (kayit.acilan.indexOf(id) === -1) { kayit.acilan.push(id); yeni.push(id); }
      });
    }
    return yeni;
  }
  function acikMi(tur, id, i) { return i === 0 || kayit.acilan.indexOf(tur + ':' + id) !== -1; }
  function forma() { for (var i = 0; i < FORMALAR.length; i++) if (FORMALAR[i].id === kayit.secim.forma && acikMi('forma', FORMALAR[i].id, i)) return FORMALAR[i]; return FORMALAR[0]; }
  function topDeseni() { for (var i = 0; i < TOPLAR.length; i++) if (TOPLAR[i].id === kayit.secim.top && acikMi('top', TOPLAR[i].id, i)) return TOPLAR[i]; return TOPLAR[0]; }

  // ---------- Günlük görevler ----------
  function gorevHazirla() {
    var bugun = MiniOyun.gunluk.bugun();
    if (kayit.gorev && kayit.gorev.tarih === bugun && kayit.gorev.liste.length === 3) return;
    var rnd = MiniOyun.gunluk.rastgele(bugun + '/penalti-gorev');
    var havuz = GOREVLER.map(function (g) { return g.id; }), liste = [];
    while (liste.length < 3) liste.push(havuz.splice(Math.floor(rnd() * havuz.length), 1)[0]);
    kayit.gorev = { tarih: bugun, liste: liste, ilerleme: {}, tamam: [] };
    liste.forEach(function (id) { kayit.gorev.ilerleme[id] = 0; });
    kaydet();
  }
  function gorevIlerlet(olay) {
    gorevHazirla();
    var kazanc = 0, biten = [];
    kayit.gorev.liste.forEach(function (id) {
      if (kayit.gorev.tamam.indexOf(id) !== -1 || !olay[id]) return;
      var g = gorevBul(id);
      kayit.gorev.ilerleme[id] = Math.min(g.hedef, kayit.gorev.ilerleme[id] + olay[id]);
      if (kayit.gorev.ilerleme[id] >= g.hedef) { kayit.gorev.tamam.push(id); kazanc += g.para; biten.push(g.ad); }
    });
    kayit.para += kazanc;
    return { para: kazanc, biten: biten };
  }

  // ---------- Menü ----------
  function yildizlar(y) { return '★★★'.slice(0, y) + '☆☆☆'.slice(y); }
  function menuCiz() {
    gorevHazirla();
    Array.prototype.forEach.call(document.querySelectorAll('#hizli [data-seviye]'), function (b) {
      b.hidden = daily && b.getAttribute('data-seviye') !== 'normal';
    });
    document.querySelector('#hizli [data-seviye="normal"] small').textContent = daily ? 'günlük maç' : 'orta';
    $('kariyer-alan').hidden = daily;
    $('para').textContent = '🪙 ' + kayit.para;
    $('yildiz-ozet').textContent = '⭐ ' + toplamYildiz() + ' / ' + (LIGLER.length * 18 + 3);
    var html = '';
    LIGLER.forEach(function (lig, l) {
      var acik = l <= kayit.lig, ly = ligYildiz(l);
      html += '<div class="pl-lig' + (acik ? '' : ' kilitli') + '"><h3>' + (acik ? '' : '🔒 ') + lig.ad +
        ' <small>' + ly + '/18 ⭐' + (ly >= 12 ? ' 🏆' : '') + '</small></h3><div class="pl-maclar">';
      lig.takimlar.forEach(function (t, i) {
        var n = i + 1, y = kayit.maclar[(l + 1) + '-' + n] || 0, a = macAcik(l, n);
        html += '<button type="button" class="pl-mac' + (a ? '' : ' kilitli') + '" data-lig="' + l + '" data-no="' + n + '"' + (a ? '' : ' disabled') +
          ' aria-label="' + lig.ad + ' maç ' + n + ': ' + t + (a ? ', ' + y + ' yıldız' : ', kilitli') + '"><b>' + (a ? n : '🔒') + '</b><span class="pl-takim">' + t +
          '</span><span class="pl-y">' + (a ? yildizlar(y) : '') + '</span></button>';
      });
      html += '</div></div>';
    });
    var fa = finalAcik(), fy = kayit.maclar.final || 0;
    html += '<button type="button" class="pl-final" id="final-btn"' + (fa ? '' : ' disabled') + '>🏆 Kupa Finali: ' + FINAL_RAKIP +
      (fa ? ' <span class="pl-y">' + yildizlar(fy) + '</span>' : ' 🔒') + '</button>';
    $('ligler').innerHTML = html;

    $('yukseltmeler').innerHTML = YUKSELTMELER.map(function (u) {
      var s = kayit.yukseltme[u.id], b = BEDEL[s];
      return '<button type="button" class="pl-yuk" data-yuk="' + u.id + '"' + (s >= 5 || kayit.para < b ? ' disabled' : '') + '>' +
        '<span class="pl-y-ikon" aria-hidden="true">' + u.ikon + '</span><span><b>' + u.ad + ' ' + s + '/5</b><small>' + u.aciklama + '</small></span>' +
        '<span class="pl-y-bedel">' + (s >= 5 ? 'Tam' : '🪙 ' + b) + '</span></button>';
    }).join('');

    $('gorevler').innerHTML = kayit.gorev.liste.map(function (id) {
      var g = gorevBul(id), bitti = kayit.gorev.tamam.indexOf(id) !== -1;
      return '<li class="' + (bitti ? 'tamam' : '') + '" data-gorev="' + id + '">' + (bitti ? '✅ ' : '⚽ ') + g.ad +
        ' <small>' + kayit.gorev.ilerleme[id] + '/' + g.hedef + ' · 🪙 ' + g.para + '</small></li>';
    }).join('');

    $('formalar').innerHTML = FORMALAR.map(function (f, i) {
      var a = acikMi('forma', f.id, i);
      return '<button type="button" class="pl-renk' + (forma().id === f.id ? ' secili' : '') + '" data-forma="' + f.id + '"' + (a ? '' : ' disabled') +
        ' style="--r:' + f.renk + '" aria-label="Forma: ' + f.ad + (a ? '' : ', kilitli') + '">' + (a ? '' : '🔒') + '</button>';
    }).join('');
    $('toplar').innerHTML = TOPLAR.map(function (t, i) {
      var a = acikMi('top', t.id, i);
      return '<button type="button" class="pl-renk pl-top' + (topDeseni().id === t.id ? ' secili' : '') + '" data-top="' + t.id + '"' + (a ? '' : ' disabled') +
        ' style="--r:' + (t.renk || '#ffffff') + '" aria-label="Top: ' + t.ad + (a ? '' : ', kilitli') + '">' + (a ? '⚽' : '🔒') + '</button>';
    }).join('');
  }
  function menuGoster() {
    ekran = 'menu';
    menuCiz();
    menuEl.hidden = false;
    oyunEl.hidden = true;
  }

  menuEl.addEventListener('click', function (e) {
    if (MiniOyun.duraklatildi()) return;
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.hasAttribute('data-seviye')) macBaslat({ mod: daily ? 'gunluk' : 'hizli', seviye: b.getAttribute('data-seviye') });
    else if (b.hasAttribute('data-lig')) macBaslat({ mod: 'kariyer', lig: Number(b.getAttribute('data-lig')), no: Number(b.getAttribute('data-no')) });
    else if (b.id === 'final-btn') macBaslat({ mod: 'final' });
    else if (b.hasAttribute('data-yuk')) {
      var id = b.getAttribute('data-yuk'), s = kayit.yukseltme[id];
      if (s < 5 && kayit.para >= BEDEL[s]) { kayit.para -= BEDEL[s]; kayit.yukseltme[id] = s + 1; kaydet(); MiniOyun.ses('puan'); menuCiz(); }
    } else if (b.hasAttribute('data-forma')) { kayit.secim.forma = b.getAttribute('data-forma'); kaydet(); menuCiz(); }
    else if (b.hasAttribute('data-top')) { kayit.secim.top = b.getAttribute('data-top'); kaydet(); menuCiz(); }
  });

  // ---------- Maç ----------
  function macBaslat(secim) {
    if (secim) sonSecim = secim;
    secim = sonSecim;
    if (!secim) { menuGoster(); return; }
    var zi, rakip, anahtar, etiket;
    if (secim.mod === 'kariyer') {
      zi = secim.lig; rakip = LIGLER[secim.lig].takimlar[secim.no - 1];
      anahtar = (secim.lig + 1) + '-' + secim.no; etiket = 'maç ' + (secim.lig * 6 + secim.no);
    } else if (secim.mod === 'final') {
      zi = 4; rakip = FINAL_RAKIP; anahtar = 'final'; etiket = 'final';
    } else {
      var sv = secim.mod === 'gunluk' ? 'normal' : secim.seviye;
      zi = HIZLI[sv]; rakip = ['Rüzgar Spor', 'Kartal Gençlik', 'Yıldırım FK', 'Dalga Spor'][Math.floor(Math.random() * 4)];
      anahtar = sv; etiket = sv;
    }
    var z = ZORLUK[zi], yk = secim.mod === 'gunluk' ? { isabet: 0, guc: 0, refleks: 0, okuma: 0 } : kayit.yukseltme;
    var ek = secim.mod === 'kariyer' ? (secim.no - 1) * 0.01 : 0;
    ayar = {
      mod: secim.mod, secim: secim, anahtar: anahtar, seviye: etiket, rakip: rakip, zi: zi,
      seri: secim.mod === 'final' ? 7 : 5,
      hiz: z.hiz, yesil: z.yesil + 0.025 * yk.isabet, sapma: 0.34 * (1 - 0.1 * yk.guc),
      refleks: z.refleks + ek - 0.012 * yk.guc, okuma: Math.min(0.9, z.okuma + ek * 2),
      ipucu: z.ipucu + 70 * yk.okuma, gec: 80 + 40 * yk.refleks,
      yalan: z.yalan, kose: z.kose, kacir: z.kacir,
      rakipRenk: RAKIP_RENK[(rakip.length + zi) % RAKIP_RENK.length]
    };
    // Rakip davranışı maç başında üretilir: günlük modda tarihe bağlı, herkes aynı maçı oynar
    var rnd = MiniOyun.rastgele();
    if (secim.mod !== 'gunluk') rnd = Math.random;
    var kararlar = { biz: [], onlar: [] };
    for (var i = 0; i < ayar.seri + 5; i++) {
      kararlar.biz.push({ okur: rnd(), yon: rnd(), aci: rnd(), uzak: rnd() });
      kararlar.onlar.push({ kose: rnd(), taraf: rnd(), yuk: rnd(), yalan: rnd(), kacir: rnd() });
    }
    mac = { biz: [], onlar: [], kararlar: kararlar, puan: 0, kose: 0, panenka: 0, kurtaris: 0, hedef: null, imlec: { c: 0, r: 0 }, faz: '', yazi: null, top: null, kaleci: null, sallanma: 0 };
    cv.dataset.yesil = ayar.yesil.toFixed(3);
    cv.dataset.sonuc = '';
    menuEl.hidden = true;
    oyunEl.hidden = false;
    ekran = 'mac';
    $('rakip-ad').textContent = ayar.rakip;
    $('mac-ad').textContent = secim.mod === 'kariyer' ? LIGLER[secim.lig].ad + ' · Maç ' + secim.no :
      secim.mod === 'final' ? 'Kupa Finali · 7 atış' : secim.mod === 'gunluk' ? 'Günlük maç · ' + MiniOyun.gunluk.tarih : 'Hızlı maç · ' + ayar.seviye;
    tabloCiz();
    atisBaslat();
    // Maç alanı (güç çubuğu ve VUR dahil) görünür alanda kalsın
    if (oyunEl.scrollIntoView) oyunEl.scrollIntoView({ block: 'nearest' });
  }

  function gol(dizi) { return dizi.filter(function (x) { return x; }).length; }
  function tabloCiz() {
    var n = Math.max(ayar.seri, mac.biz.length, mac.onlar.length);
    function satir(dizi) {
      var s = '';
      for (var i = 0; i < n; i++) s += '<span class="pl-top-d ' + (i < dizi.length ? (dizi[i] ? 'gol' : 'kacti') : '') + '">' + (i < dizi.length ? (dizi[i] ? '✅' : '❌') : '⚪') + '</span>';
      return s;
    }
    $('biz-dizi').innerHTML = satir(mac.biz);
    $('onlar-dizi').innerHTML = satir(mac.onlar);
    $('biz-skor').textContent = gol(mac.biz);
    $('onlar-skor').textContent = gol(mac.onlar);
    $('mac-puan').textContent = mac.puan;
  }

  function fazAyarla(f) {
    mac.faz = f;
    mac.fazBasi = zaman;
    cv.dataset.faz = f;
  }
  function atisBaslat() {
    mac.hedef = null;
    mac.kaleci = null;
    mac.top = null;
    mac.yazi = null;
    fazAyarla('nisan');
    cv.dataset.ipucu = '';
    $('vur').hidden = false;
    bilgiEl.textContent = 'Atış sende: kalede hedefe dokun (veya ok tuşları), sonra güç çubuğunu yeşilde durdur.';
  }
  function kurtarisBaslat() {
    var k = mac.kararlar.onlar[mac.onlar.length];
    var kose = k.kose < ayar.kose;
    var col = kose ? (k.taraf < 0.5 ? -1 : 1) : (k.taraf < 0.3 ? 0 : k.taraf < 0.65 ? -1 : 1);
    var yalan = k.yalan < ayar.yalan;
    mac.rakipAtis = {
      col: col, u: col * (kose ? 0.82 : 0.5), v: 0.12 + k.yuk * 0.75, kacir: k.kacir < ayar.kacir,
      yalan: yalan ? (col === 0 ? (k.taraf < 0.5 ? -1 : 1) : -col) : null,
      vurus: 1500 // koşu başladıktan sonra vuruş anı (ms)
    };
    mac.dalis = null;
    mac.kaleci = null;
    mac.top = null;
    mac.yazi = null;
    fazAyarla('kosu');
    $('vur').hidden = true;
    bilgiEl.textContent = 'Kaleci sensin: atıcının yönünü izle, top vurulmadan hemen önce ← ↑ → ile (veya kalenin o tarafına dokunarak) atla.';
  }

  function barDeger() {
    var x = ((zaman - mac.fazBasi) / 1000) * ayar.hiz % 2;
    return x <= 1 ? x : 2 - x;
  }
  function bolge(p) {
    var d = Math.abs(p - 0.5);
    return d <= ayar.yesil / 2 ? 'yesil' : d <= ayar.yesil / 2 + 0.18 ? 'sari' : 'kirmizi';
  }
  function izgara(c, r) { return { u: c * 0.72, v: r ? 0.75 : 0.28 }; }

  function vur() {
    if (mac.faz !== 'nisan') return;
    if (!mac.hedef) mac.hedef = izgara(mac.imlec.c, mac.imlec.r);
    var p = barDeger(), b = bolge(p), k = mac.kararlar.biz[mac.biz.length];
    var u = mac.hedef.u, v = mac.hedef.v, aut = false;
    if (b === 'kirmizi') { aut = true; u = u * 1.1 + (k.aci - 0.5) * 0.3; v = 1.3; }
    else {
      var s = b === 'yesil' ? 0.04 : ayar.sapma, a = k.aci * Math.PI * 2, r = s * (0.4 + 0.6 * k.uzak);
      u += Math.cos(a) * r; v += Math.sin(a) * r;
      if (v < 0.04) v = 0.04;
      if (Math.abs(u) > 1 || v > 1) aut = true;
    }
    cv.dataset.sapma = Math.hypot(u - mac.hedef.u, v - mac.hedef.v).toFixed(3);
    // Rakip kaleci: okuma olasılığıyla topun tarafına, yoksa rastgele bir yöne atlar
    var taraf = u < -0.25 ? -1 : u > 0.25 ? 1 : 0, yon;
    if (k.okur < ayar.okuma) yon = taraf;
    else yon = k.yon < 0.4 ? -1 : k.yon < 0.8 ? 1 : 0;
    var kp = { u: yon * 0.55, v: yon ? 0.35 : 0.5 };
    var uzanma = ayar.refleks - (b === 'yesil' ? 0.03 : 0);
    var kurtardi = !aut && Math.hypot(u - kp.u, (v - kp.v) * 1.2) < uzanma;
    var sonuc = aut ? 'aut' : kurtardi ? 'kurtaris' : 'gol';
    mac.kaleci = { yon: yon, hedef: kurtardi ? { u: u, v: v } : kp, renk: ayar.rakipRenk };
    mac.top = { u: u, v: v, aut: aut };
    mac.sonuc = { kim: 'biz', sonuc: sonuc, kose: !aut && !kurtardi && Math.abs(u) >= 0.6, panenka: sonuc === 'gol' && Math.abs(u) < 0.25 };
    $('vur').hidden = true;
    MiniOyun.ses('tik');
    fazAyarla('ucus');
  }

  function dal(yon) {
    if (mac.faz !== 'kosu' || mac.dalis) return;
    mac.dalis = { yon: yon, t: zaman - mac.fazBasi };
  }
  function rakipVurdu() {
    var a = mac.rakipAtis, d = mac.dalis, ipucuBasi = a.vurus - ayar.ipucu;
    var sonuc, erken = false;
    if (a.kacir) sonuc = 'aut';
    else if (d && d.t < ipucuBasi) { sonuc = 'gol'; erken = true; }
    else if (d && d.yon === a.col) sonuc = 'kurtaris';
    else sonuc = 'gol';
    var hu = a.u, hv = a.v;
    // Erken atlayan kaleciyi gören atıcı topu boş tarafa gönderir
    if (erken && d.yon !== 0 && Math.sign(hu) === d.yon) hu = -hu;
    if (erken && d.yon === 0 && Math.abs(hu) < 0.3) hu = 0.7;
    if (sonuc === 'aut') hv = 1.25;
    var kyon = d ? d.yon : 0;
    mac.kaleci = { yon: kyon, hedef: sonuc === 'kurtaris' ? { u: hu, v: hv } : { u: kyon * 0.55, v: kyon ? 0.35 : 0.5 }, renk: forma().renk };
    mac.top = { u: hu, v: hv, aut: sonuc === 'aut' };
    mac.sonuc = { kim: 'onlar', sonuc: sonuc, erken: erken };
    fazAyarla('ucus');
  }

  function sonucIsle() {
    var s = mac.sonuc;
    cv.dataset.sonuc = s.sonuc;
    if (s.kim === 'biz') {
      var g = s.sonuc === 'gol';
      mac.biz.push(g);
      if (g) {
        mac.puan += 100 + (s.kose ? 50 : 0);
        if (s.kose) mac.kose++;
        if (s.panenka) mac.panenka++;
        mac.yazi = s.kose ? 'KÖŞEYE GOL!' : s.panenka ? 'PANENKA!' : 'GOL!';
        mac.sallanma = 500;
        MiniOyun.ses('puan');
      } else {
        mac.yazi = s.sonuc === 'aut' ? 'DIŞARI!' : 'KURTARDI!';
        MiniOyun.ses('kaybet');
      }
    } else {
      var yedi = s.sonuc === 'gol';
      mac.onlar.push(yedi);
      if (yedi) {
        mac.yazi = s.erken ? 'ERKEN ATLADIN!' : 'GOL YEDİN';
        mac.sallanma = 500;
        MiniOyun.ses('tik');
      } else if (s.sonuc === 'kurtaris') {
        mac.puan += 150;
        mac.kurtaris++;
        mac.yazi = 'KURTARDIN!';
        MiniOyun.ses('puan');
      } else {
        mac.yazi = 'DIŞARI!';
        MiniOyun.ses('puan');
      }
    }
    tabloCiz();
    fazAyarla('sonuc');
  }

  // Bir tur = biz atarız, sonra onlar atar. Normal turlar bitince eşitse ani ölüm (en fazla 5 tur).
  function sonraki() {
    if (mac.biz.length > mac.onlar.length) { kurtarisBaslat(); return; }
    var n = mac.biz.length;
    if (n >= ayar.seri) {
      var a = gol(mac.biz), b = gol(mac.onlar);
      if (a !== b || n >= ayar.seri + 5) { bitir(); return; }
    }
    atisBaslat();
  }

  function bitir() {
    ekran = 'bitti';
    fazAyarla('bitti');
    var a = gol(mac.biz), b = gol(mac.onlar), kazandi = a > b, berabere = a === b;
    var aniOlum = mac.biz.length > ayar.seri;
    if (kazandi && b === 0) mac.puan += 300;
    var yildiz = 0;
    if (kazandi) yildiz = (b <= 1 ? (a >= 4 && !aniOlum ? 3 : 2) : 1);
    var para = 0, notlar = [];
    if (ayar.mod === 'kariyer' || ayar.mod === 'final') {
      var once = kayit.maclar[ayar.anahtar] || 0;
      if (yildiz > once) kayit.maclar[ayar.anahtar] = yildiz;
      para = kazandi ? (ayar.mod === 'final' ? 120 : 15 + 10 * ayar.zi + 5 * yildiz) : 5;
      if (kazandi && !once) {
        if (ayar.mod === 'kariyer' && ayar.secim.no === 6 && ligBitti(kayit, ayar.secim.lig)) notlar.push(ayar.secim.lig < 3 ? LIGLER[ayar.secim.lig + 1].ad + ' açıldı!' : 'Kupa Finali açıldı!');
        else if (ayar.mod === 'kariyer') notlar.push('Sıradaki maç açıldı.');
      }
      kayit.lig = acikLig(kayit);
      if (acilanGuncelle().length) notlar.push('Yeni forma ve top deseni açıldı!');
    } else {
      para = kazandi ? 10 : 3;
    }
    kayit.para += para;
    var gorev = gorevIlerlet({
      kose: mac.kose, panenka: mac.panenka, kurtaris: mac.kurtaris, gol: a,
      galibiyet: kazandi ? 1 : 0, temiz: kazandi && b === 0 ? 1 : 0, ucyildiz: ayar.mod === 'kariyer' && yildiz === 3 ? 1 : 0
    });
    if (gorev.biten.length) notlar.push('Görev tamam: ' + gorev.biten.join(', ') + ' (+🪙 ' + gorev.para + ')');
    kaydet();
    tabloCiz();
    var rekor = MiniOyun.setBest('penalti-ligi-' + ayar.anahtar, mac.puan);
    var ozet = a + '-' + b + ' · ' + mac.puan + ' puan' + (yildiz ? ' · ' + yildizlar(yildiz) : '') + ' · +🪙 ' + para + (notlar.length ? ' · ' + notlar.join(' ') : '');
    var baslik = berabere ? 'Berabere! Maç tekrar oynanacak' : kazandi ? (ayar.mod === 'final' ? 'Kupa senin! 🏆' : 'Kazandın! ' + Array(yildiz + 1).join('⭐')) : 'Kaybettin';
    MiniOyun.bitti({
      baslik: baslik, metin: ozet, rekor: rekor, kaybetti: !kazandi, skor: mac.puan, seviye: ayar.seviye,
      sonuc: a + '-' + b + ', ' + mac.puan + ' puan',
      paylas: 'Penaltı Ligi: ' + ayar.rakip + ' maçını ' + a + '-' + b + ' ' + (kazandi ? 'kazandım' : 'bitirdim') + ', ' + mac.puan + ' puan!'
    });
    menuCiz();
    menuEl.hidden = false;
    oyunEl.hidden = true;
  }

  // ---------- Döngü ----------
  function guncelle() {
    if (!mac || ekran !== 'mac') return;
    var t = zaman - mac.fazBasi;
    if (mac.sallanma > 0) mac.sallanma = Math.max(0, mac.sallanma - 16);
    if (mac.faz === 'nisan') {
      var p = barDeger();
      cv.dataset.guc = p.toFixed(3);
      cv.dataset.bolge = bolge(p);
    } else if (mac.faz === 'kosu') {
      var a = mac.rakipAtis, ip = a.vurus - ayar.ipucu;
      var yon = t < ip ? null : (a.yalan !== null && t < a.vurus - 200 ? a.yalan : a.col);
      cv.dataset.ipucu = yon === null ? '' : String(yon);
      if (t >= a.vurus + ayar.gec) rakipVurdu();
    } else if (mac.faz === 'ucus') {
      if (t >= 420) sonucIsle();
    } else if (mac.faz === 'sonuc') {
      if (t >= 900) sonraki();
    }
  }

  function kx(u) { return KALE.x + KALE.w / 2 + u * KALE.w / 2; }
  function ky(v) { return KALE.y + KALE.h - v * KALE.h; }

  function ciz() {
    // Çim
    ctx.fillStyle = '#0c2e1a';
    ctx.fillRect(0, 0, W, 100);
    for (var i = 0; i * 40 + 100 < H; i++) {
      ctx.fillStyle = i % 2 ? '#1f7a3a' : '#238443';
      ctx.fillRect(0, 100 + i * 40, W, 40);
    }
    // Tribün noktaları
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    for (var tx = 8; tx < W; tx += 16) for (var ty = 10; ty < 90; ty += 16) ctx.fillRect(tx + (ty % 32 ? 6 : 0), ty, 4, 4);
    // Saha çizgileri
    ctx.strokeStyle = 'rgba(255,255,255,.75)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 260); ctx.lineTo(W, 260);
    ctx.rect(120, 260, 240, 60);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(NOKTA.x, NOKTA.y, 4, 0, Math.PI * 2); ctx.fill();
    // File
    var sx = mac && mac.sallanma && !azHareket ? Math.sin(mac.sallanma / 25) * 3 : 0;
    ctx.strokeStyle = 'rgba(255,255,255,.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var nx = KALE.x; nx <= KALE.x + KALE.w; nx += 18) { ctx.moveTo(nx + sx, KALE.y); ctx.lineTo(nx + sx * 0.5, 260); }
    for (var ny = KALE.y; ny <= 260; ny += 18) { ctx.moveTo(KALE.x, ny + sx * 0.5); ctx.lineTo(KALE.x + KALE.w, ny + sx * 0.5); }
    ctx.stroke();
    // Direkler
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(KALE.x, 262); ctx.lineTo(KALE.x, KALE.y); ctx.lineTo(KALE.x + KALE.w, KALE.y); ctx.lineTo(KALE.x + KALE.w, 262);
    ctx.stroke();
    if (!mac || !ayar) return;

    var t = zaman - mac.fazBasi;
    var bizAtiyor = mac.faz === 'nisan' || (mac.sonuc && mac.sonuc.kim === 'biz' && (mac.faz === 'ucus' || mac.faz === 'sonuc'));
    // Kaleci
    var kr = bizAtiyor ? ayar.rakipRenk : forma().renk, k = 0;
    var kk = { u: 0, v: 0.5 }, don = 0;
    if (mac.kaleci) {
      k = mac.faz === 'ucus' ? Math.min(1, t / 300) : 1;
      kk = { u: mac.kaleci.hedef.u * k, v: 0.5 + (mac.kaleci.hedef.v - 0.5) * k };
      don = mac.kaleci.yon * 1.15 * k;
    } else if (mac.faz === 'kosu' && mac.dalis) {
      k = Math.min(1, (t - mac.dalis.t) / 300);
      kk = { u: mac.dalis.yon * 0.55 * k, v: 0.5 - (mac.dalis.yon ? 0.15 * k : 0) };
      don = mac.dalis.yon * 1.15 * k;
    }
    adam(kx(kk.u), ky(kk.v) + 10, kr, don, true);
    // Atıcı
    if (!bizAtiyor && mac.faz === 'kosu') {
      var a = mac.rakipAtis, ilerle = Math.min(1, t / a.vurus);
      adam(180 + 40 * ilerle, 520 - 50 * ilerle, ayar.rakipRenk, 0, false);
      var ip = cv.dataset.ipucu;
      if (ip !== '') {
        ctx.font = '700 30px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffe066';
        ctx.fillText(ip === '-1' ? '⬅' : ip === '1' ? '➡' : '⬆', 180 + 40 * ilerle, 440 - 50 * ilerle);
      }
    } else if (mac.faz === 'nisan') {
      adam(200, 486, forma().renk, 0, false);
    }
    // Top
    var top = { x: NOKTA.x, y: NOKTA.y - 8, r: 11 };
    if (mac.top && (mac.faz === 'ucus' || mac.faz === 'sonuc')) {
      var f = mac.faz === 'ucus' ? Math.min(1, t / 420) : 1;
      var hx = kx(mac.top.u), hy = mac.top.aut ? KALE.y - 40 : ky(mac.top.v);
      top.x = NOKTA.x + (hx - NOKTA.x) * f;
      top.y = NOKTA.y - 8 + (hy - NOKTA.y + 8) * f - Math.sin(f * Math.PI) * 40;
      top.r = 11 - 4 * f;
    }
    var desen = topDeseni();
    if (desen.renk) { ctx.fillStyle = desen.renk; ctx.beginPath(); ctx.arc(top.x, top.y, top.r + 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(top.x, top.y, top.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(top.x, top.y, top.r * 0.38, 0, Math.PI * 2); ctx.fill();

    if (mac.faz === 'nisan') {
      // Hedef imleci
      var h = mac.hedef || izgara(mac.imlec.c, mac.imlec.r);
      ctx.strokeStyle = mac.hedef ? '#ffe066' : 'rgba(255,224,102,.55)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(kx(h.u), ky(h.v), 14, 0, Math.PI * 2);
      ctx.moveTo(kx(h.u) - 20, ky(h.v)); ctx.lineTo(kx(h.u) + 20, ky(h.v));
      ctx.moveTo(kx(h.u), ky(h.v) - 20); ctx.lineTo(kx(h.u), ky(h.v) + 20);
      ctx.stroke();
      // Güç çubuğu
      var g = ayar.yesil, y2 = g + 0.36;
      ctx.fillStyle = '#ef4444'; ctx.fillRect(BAR.x, BAR.y, BAR.w, BAR.h);
      ctx.fillStyle = '#facc15'; ctx.fillRect(BAR.x + BAR.w * (0.5 - y2 / 2), BAR.y, BAR.w * y2, BAR.h);
      ctx.fillStyle = '#22c55e'; ctx.fillRect(BAR.x + BAR.w * (0.5 - g / 2), BAR.y, BAR.w * g, BAR.h);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(BAR.x, BAR.y, BAR.w, BAR.h);
      var px = BAR.x + BAR.w * barDeger();
      ctx.fillStyle = '#fff';
      ctx.fillRect(px - 3, BAR.y - 6, 6, BAR.h + 12);
    }
    if (mac.yazi && mac.faz === 'sonuc') {
      ctx.font = '900 44px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(0,0,0,.6)';
      ctx.strokeText(mac.yazi, W / 2, 360);
      var iyi = mac.sonuc.kim === 'biz' ? mac.sonuc.sonuc === 'gol' : mac.sonuc.sonuc !== 'gol';
      ctx.fillStyle = iyi ? '#ffe066' : '#fca5a5';
      ctx.fillText(mac.yazi, W / 2, 360);
    }
  }

  // Basit oyuncu çizimi: daire kafa, dikdörtgen gövde; kaleci kollarını açar
  function adam(x, y, renk, don, kaleci) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(don);
    ctx.fillStyle = renk;
    ctx.fillRect(-13, -22, 26, 40);
    ctx.fillStyle = '#111827';
    ctx.fillRect(-12, 18, 10, 18); ctx.fillRect(2, 18, 10, 18);
    ctx.strokeStyle = renk;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (kaleci) { ctx.moveTo(-12, -16); ctx.lineTo(-34, -40); ctx.moveTo(12, -16); ctx.lineTo(34, -40); }
    else { ctx.moveTo(-12, -14); ctx.lineTo(-20, 8); ctx.moveTo(12, -14); ctx.lineTo(20, 8); }
    ctx.stroke();
    ctx.fillStyle = '#f2c9a0';
    ctx.beginPath(); ctx.arc(0, -34, 11, 0, Math.PI * 2); ctx.fill();
    if (kaleci) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-34, -40, 6, 0, Math.PI * 2); ctx.arc(34, -40, 6, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  function dongu() {
    var simdi = performance.now(), dt = Math.min(50, simdi - son);
    son = simdi;
    if (!duraklat && ekran === 'mac') { zaman += dt; guncelle(); }
    ciz();
    requestAnimationFrame(dongu);
  }

  // ---------- Girişler ----------
  function tuvalNokta(e) {
    var r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  }
  cv.addEventListener('pointerdown', function (e) {
    if (ekran !== 'mac' || MiniOyun.duraklatildi()) return;
    e.preventDefault();
    var p = tuvalNokta(e);
    if (mac.faz === 'nisan') {
      var icinde = p.x >= KALE.x - 30 && p.x <= KALE.x + KALE.w + 30 && p.y >= KALE.y - 30 && p.y <= 275;
      if (!mac.hedef && icinde) {
        mac.hedef = { u: Math.max(-1.05, Math.min(1.05, (p.x - KALE.x - KALE.w / 2) / (KALE.w / 2))), v: Math.max(0.04, Math.min(1.05, (260 - p.y) / KALE.h)) };
        MiniOyun.ses('tik');
      } else if (mac.hedef) vur();
    } else if (mac.faz === 'kosu') {
      dal(p.x < W / 3 ? -1 : p.x > W * 2 / 3 ? 1 : 0);
    }
  });
  $('vur').addEventListener('click', function () {
    if (ekran === 'mac' && !MiniOyun.duraklatildi()) vur();
  });
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || ekran !== 'mac' || MiniOyun.duraklatildi()) return;
    var k = e.key;
    if (mac.faz === 'nisan') {
      if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown') {
        e.preventDefault();
        var im = mac.imlec;
        if (mac.hedef) { im.c = mac.hedef.u < -0.36 ? -1 : mac.hedef.u > 0.36 ? 1 : 0; im.r = mac.hedef.v > 0.5 ? 1 : 0; }
        if (k === 'ArrowLeft') im.c = Math.max(-1, im.c - 1);
        if (k === 'ArrowRight') im.c = Math.min(1, im.c + 1);
        if (k === 'ArrowUp') im.r = 1;
        if (k === 'ArrowDown') im.r = 0;
        mac.hedef = izgara(im.c, im.r);
      } else if (k === ' ' || k === 'Enter') {
        e.preventDefault();
        vur();
      }
    } else if (mac.faz === 'kosu') {
      var yon = k === 'ArrowLeft' ? -1 : k === 'ArrowRight' ? 1 : (k === 'ArrowUp' || k === 'ArrowDown' || k === ' ') ? 0 : null;
      if (yon !== null) { e.preventDefault(); dal(yon); }
    } else if (k === ' ' || k.indexOf('Arrow') === 0) e.preventDefault();
  });

  MiniOyun.oyun({
    restart: function () { macBaslat(); },
    pause: function () { duraklat = true; },
    resume: function () { duraklat = false; son = performance.now(); },
    canPause: function () { return ekran === 'mac'; },
    seviye: function () { return ayar ? ayar.seviye : 'normal'; }
  });

  menuGoster();
  son = performance.now();
  requestAnimationFrame(dongu);
})();

// Lokanta Telaşı motoru: malzemeler, tarifler, 40 günün ayarı (semt, menü, müşteri sayısı, süre, sabır),
// tohumlu müşteri ve sipariş üretimi, tabak-sipariş eşleştirmesi (sırasız, eksiksiz), ödeme/bahşiş/kombo,
// yıldız kuralları ve yükseltme tablosu. Hem oyun hem oynanış testi hem de denge simülasyonu kullanır.
(function () {
  var GUN_SAYI = 40;

  var MALZEMELER = [
    { id: 'lavas', ikon: '🫓', ad: 'Lavaş' },
    { id: 'et', ikon: '🥩', ad: 'Et', izgara: 5, pismis: '🍖' },
    { id: 'domates', ikon: '🍅', ad: 'Domates' },
    { id: 'sogan', ikon: '🧅', ad: 'Soğan' },
    { id: 'sis', ikon: '🍢', ad: 'Şiş', izgara: 4, pismis: '🍢' },
    { id: 'ayran', ikon: '🥛', ad: 'Ayran' },
    { id: 'cay', ikon: '🍵', ad: 'Çay', demlik: true },
    { id: 'corba', ikon: '🍲', ad: 'Çorba' },
    { id: 'limon', ikon: '🍋', ad: 'Limon' },
    { id: 'salatalik', ikon: '🥒', ad: 'Salatalık' },
    { id: 'sutlac', ikon: '🍮', ad: 'Sütlaç' },
    { id: 'tarcin', ikon: '🟤', ad: 'Tarçın' }
  ];
  var YEMEKLER = [
    { id: 'durum', ikon: '🥙', ad: 'Dürüm', fiyat: 12, tarif: ['lavas', 'et', 'domates', 'sogan'] },
    { id: 'ayran', ikon: '🥛', ad: 'Ayran', fiyat: 4, tarif: ['ayran'] },
    { id: 'sis', ikon: '🍢', ad: 'Şiş', fiyat: 9, tarif: ['sis'] },
    { id: 'corba', ikon: '🍲', ad: 'Mercimek çorbası', fiyat: 8, tarif: ['corba', 'limon'] },
    { id: 'cay', ikon: '🍵', ad: 'Çay', fiyat: 3, tarif: ['cay'] },
    { id: 'salata', ikon: '🥗', ad: 'Çoban salatası', fiyat: 7, tarif: ['domates', 'salatalik', 'sogan'] },
    { id: 'sutlac', ikon: '🍮', ad: 'Sütlaç', fiyat: 6, tarif: ['sutlac', 'tarcin'] }
  ];
  // Yemeğin açıldığı gün
  var ACILIS = { durum: 1, ayran: 1, sis: 3, corba: 11, cay: 11, salata: 21, sutlac: 21 };

  var SEMTLER = [
    { id: 'bufe', ad: 'Mahalle Büfesi', ikon: '🏪', renk: '#fcd34d', esik: 0 },
    { id: 'sahil', ad: 'Sahil Lokantası', ikon: '🌉', renk: '#7dd3fc', esik: 18 },
    { id: 'carsi', ad: 'Çarşı Lokantası', ikon: '🏛️', renk: '#fca5a5', esik: 42 },
    { id: 'meydan', ad: 'Meydan Restoranı', ikon: '🌃', renk: '#a78bfa', esik: 70 }
  ];

  // Müşteri tipleri: sabır çarpanı, bahşiş çarpanı
  var TIPLER = {
    normal: { ikon: '🧑', ad: 'Müşteri', sabir: 1, bahsis: 1 },
    yasli: { ikon: '👵', ad: 'Teyze', sabir: 1.4, bahsis: 0.5 },
    aceleci: { ikon: '🧑‍💼', ad: 'Aceleci', sabir: 0.65, bahsis: 2 },
    cocuk: { ikon: '🧒', ad: 'Çocuk', sabir: 1.6, bahsis: 0.8 },
    elestirmen: { ikon: '🧑‍🍳', ad: 'Eleştirmen', sabir: 0.75, bahsis: 1.5 }
  };

  // Yükseltmeler: fiyatlar seviye başına
  var YUKSELTMELER = [
    { id: 'izgara', ikon: '🔥', ad: 'Izgara', aciklama: 'Izgara yeri 2→4, pişme hızı', fiyat: [120, 300, 650, 1200] },
    { id: 'tezgah', ikon: '🪑', ad: 'Tezgâh', aciklama: 'Müşteri yeri 3→4', fiyat: [900] },
    { id: 'tabak', ikon: '🍽️', ad: 'İkinci tabak', aciklama: 'Aynı anda 2 tabak hazırla', fiyat: [500] },
    { id: 'cay', ikon: '🫖', ad: 'Çay ocağı', aciklama: 'Demleme 4→1 sn', fiyat: [160, 400, 800] },
    { id: 'dekor', ikon: '🪴', ad: 'Dekor', aciklama: 'Tüm müşterilerin sabrı +%8', fiyat: [100, 240, 500, 950, 1600] },
    { id: 'zil', ikon: '🛎️', ad: 'Garson zili', aciklama: 'Sabrı kırmızıya düşene bir kez ek süre', fiyat: [200, 500, 1000] },
    { id: 'kasa', ikon: '💵', ad: 'Kasa', aciklama: 'Bahşiş +%10', fiyat: [160, 360, 700, 1300, 2100] }
  ];

  function tohum(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = h << 13 | h >>> 19;
    }
    return function () {
      h = h + 0x6D2B79F5 | 0;
      var t = Math.imul(h ^ h >>> 15, 1 | h);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function malzeme(id) { for (var i = 0; i < MALZEMELER.length; i++) if (MALZEMELER[i].id === id) return MALZEMELER[i]; }
  function yemek(id) { for (var i = 0; i < YEMEKLER.length; i++) if (YEMEKLER[i].id === id) return YEMEKLER[i]; }

  // Yükseltme seviyesinden oyun değerleri
  function degerler(y) {
    y = y || {};
    var iz = Math.min(4, y.izgara || 0);
    return {
      izgaraYer: [2, 3, 3, 4, 4][iz],
      pisme: [1, 1, 0.8, 0.8, 0.6][iz],
      musteriYer: 3 + Math.min(1, y.tezgah || 0),
      tabak: 1 + Math.min(1, y.tabak || 0),
      demleme: [4, 3, 2, 1][Math.min(3, y.cay || 0)],
      sabir: 1 + 0.08 * Math.min(5, y.dekor || 0),
      zil: [0, 3, 4, 5][Math.min(3, y.zil || 0)],
      bahsis: 1 + 0.1 * Math.min(5, y.kasa || 0)
    };
  }

  // n. günün ayarı (n = 1..40). Günlük mod Çarşı düzeyinde sabit bir gündür.
  function ayar(n) {
    var semt = Math.floor((n - 1) / 10), f = (n - 1) / (GUN_SAYI - 1);
    var menu = YEMEKLER.filter(function (y) { return ACILIS[y.id] <= n; }).map(function (y) { return y.id; });
    var a = {
      no: n, semt: semt, menu: menu,
      musteri: n === GUN_SAYI ? 30 : Math.round(8 + f * 20),
      sure: Math.round(90 + f * 60),
      sabir: 30 - f * 12,
      kalem2: n < 6 ? 0 : Math.min(0.6, (n - 5) * 0.04),
      kalem3: n < 26 ? 0 : Math.min(0.4, (n - 25) * 0.03),
      aceleci: n < 4 ? 0 : Math.min(0.3, 0.08 + semt * 0.07),
      elestirmen: n < 8 ? 0 : semt >= 2 ? 0.14 : 0.07,
      yagmur: n >= 13 && n % 4 === 1,
      aksam: n >= 31 && n % 2 === 1,
      acilis: n === GUN_SAYI
    };
    if (n === 1) { a.musteri = 6; a.sabir = 40; }
    return a;
  }
  function gunlukAyar() {
    var a = ayar(25);
    a.no = 0; a.gunluk = true; a.musteri = 20; a.sure = 120; a.yagmur = false; a.aksam = false; a.elestirmen = 0.1;
    return a;
  }

  function sec(rnd, liste, agirlik) {
    var top = 0, i;
    for (i = 0; i < liste.length; i++) top += agirlik(liste[i]);
    var r = rnd() * top;
    for (i = 0; i < liste.length; i++) { r -= agirlik(liste[i]); if (r <= 0) return liste[i]; }
    return liste[liste.length - 1];
  }

  // Tek müşteri: tip ve sipariş (1-3 farklı yemek)
  function musteri(a, rnd) {
    var tip = 'normal', r = rnd();
    var cocukMenu = a.menu.filter(function (m) { return m === 'ayran' || m === 'sutlac'; });
    if (r < a.elestirmen) tip = 'elestirmen';
    else if (r < a.elestirmen + a.aceleci) tip = 'aceleci';
    else if (r < a.elestirmen + a.aceleci + 0.12) tip = 'yasli';
    else if (r < a.elestirmen + a.aceleci + 0.2 && a.no !== 1) tip = 'cocuk';
    var siparis;
    if (tip === 'cocuk') siparis = [cocukMenu[Math.floor(rnd() * cocukMenu.length)]];
    else {
      var k = 1 + (rnd() < a.kalem2 ? 1 : 0) + (rnd() < a.kalem3 ? 1 : 0);
      if (tip === 'elestirmen') k = Math.max(2, k);
      siparis = [];
      var havuz = a.menu.slice();
      while (siparis.length < Math.min(k, havuz.length + siparis.length) && havuz.length) {
        var y = sec(rnd, havuz, function (m) {
          if (m === 'corba' && a.yagmur) return 4;
          if (m === 'durum') return 2;
          if (m === 'ayran' || m === 'cay') return siparis.length ? 1.6 : 0.7;
          return 1;
        });
        havuz.splice(havuz.indexOf(y), 1);
        siparis.push(y);
      }
    }
    return { tip: tip, siparis: siparis, sabir: a.sabir * TIPLER[tip].sabir * (0.9 + rnd() * 0.2) };
  }

  // Günün müşteri dizisi: geliş zamanları (sn) ve siparişler
  function gun(a, rnd) {
    var list = [], son = a.sure * 0.72, ara = son / a.musteri;
    for (var i = 0; i < a.musteri; i++) {
      var m = musteri(a, rnd);
      var t = i === 0 ? 1.5 : 1.5 + i * ara + (rnd() - 0.5) * ara * 0.6;
      if (a.aksam && t > a.sure - 45) t = a.sure - 45 + (t - (a.sure - 45)) * 0.5;
      m.gelis = Math.round(t * 10) / 10;
      list.push(m);
    }
    list.sort(function (x, y) { return x.gelis - y.gelis; });
    return list;
  }

  // Siparişlerin fiyat toplamı (yıldız hedefleri bunun üstüne kurulur)
  function taban(list) {
    var s = 0;
    list.forEach(function (m) { m.siparis.forEach(function (y) { s += yemek(y).fiyat; }); });
    return s;
  }
  function hedefler(list) {
    var t = taban(list);
    return { iki: Math.round(t * 1.05), uc: Math.round(t * 1.5) };
  }

  // Tabak, kalan siparişin bir alt kümesinin tariflerinin toplamına birebir eşitse o alt kümeyi döner, değilse null.
  function eslestir(tabak, kalan) {
    var hedef = sayim(tabak), n = kalan.length;
    if (!tabak.length) return null;
    for (var mask = 1; mask < (1 << n); mask++) {
      var parca = [], s = {};
      for (var i = 0; i < n; i++) if (mask & (1 << i)) {
        parca.push(i);
        yemek(kalan[i]).tarif.forEach(function (m) { s[m] = (s[m] || 0) + 1; });
      }
      if (esit(s, hedef)) return parca;
    }
    return null;
  }
  function sayim(l) { var s = {}; l.forEach(function (m) { s[m] = (s[m] || 0) + 1; }); return s; }
  function esit(a, b) {
    var k;
    for (k in a) if (a[k] !== b[k]) return false;
    for (k in b) if (a[k] !== b[k]) return false;
    return true;
  }
  // Tabak bir yemeğin tarifi olabilir mi (fazla malzeme yok)? Arayüzde ipucu için.
  function tabakYemek(tabak) {
    for (var i = 0; i < YEMEKLER.length; i++) if (esit(sayim(YEMEKLER[i].tarif), sayim(tabak))) return YEMEKLER[i];
    return null;
  }

  function komboCarpan(k) { return k >= 8 ? 2 : k >= 5 ? 1.5 : k >= 2 ? 1.2 : 1; }
  // Servis ödemesi: fiyat + kalan sabırla orantılı bahşiş, kombo çarpanıyla
  function odeme(yemekler, oran, tip, bahsisCarpan, kombo) {
    var fiyat = 0;
    yemekler.forEach(function (y) { fiyat += yemek(y).fiyat; });
    var bahsis = fiyat * Math.max(0, Math.min(1, oran)) * 0.5 * TIPLER[tip].bahsis * (bahsisCarpan || 1);
    return { fiyat: fiyat, bahsis: Math.round(bahsis), toplam: Math.round((fiyat + bahsis) * komboCarpan(kombo)) };
  }

  // Gün sonu yıldızları: 1 bitir, 2 hedef, 3 yüksek hedef ve en fazla 1 kaçan; mutlu eleştirmen +1 (en fazla 3)
  function yildiz(kazanc, h, kacan, elestirmen) {
    var y = 1;
    if (kazanc >= h.iki) y = 2;
    if (kazanc >= h.uc && kacan <= 1) y = 3;
    if (elestirmen) y = Math.min(3, y + 1);
    return y;
  }

  var M = {
    GUN_SAYI: GUN_SAYI, MALZEMELER: MALZEMELER, YEMEKLER: YEMEKLER, ACILIS: ACILIS, SEMTLER: SEMTLER,
    TIPLER: TIPLER, YUKSELTMELER: YUKSELTMELER, YANMA: 4,
    tohum: tohum, malzeme: malzeme, yemek: yemek, degerler: degerler, ayar: ayar, gunlukAyar: gunlukAyar,
    musteri: musteri, gun: gun, taban: taban, hedefler: hedefler, eslestir: eslestir, tabakYemek: tabakYemek,
    komboCarpan: komboCarpan, odeme: odeme, yildiz: yildiz
  };
  if (typeof window !== 'undefined') window.LokantaMotor = M;
  if (typeof module !== 'undefined' && module.exports) module.exports = M;
})();

// Meyve Patlat motoru: 8x8 tahta, yer değiştirme ve 3+ eşleşme kuralları, özel meyveler (roket, bomba, gökkuşağı)
// ve birleşimleri, engeller (buz, kutu, zincir, ceviz), zincirleme patlamalar ve puan çarpanı, otomatik karıştırma,
// 60 bölümün ayarı ve açgözlü bir bot (bölüm dengesini ölçmek ve oynanış testinde bölüm kazanmak için).
// Hem oyun hem oynanış testi hem de denge benzetimi (node) kullanır.
(function () {
  var N = 8, NN = N * N;
  var CEVIZ = 6, RENKSIZ = 7;
  var ROKET_Y = 1, ROKET_D = 2, BOMBA = 3, GOKKUSAGI = 4;
  var BOLUM_SAYI = 60;
  // yildiz: dünyanın açılması için gereken toplam yıldız (önceki dünyanın son bölümü de bitmiş olmalı)
  var DUNYALAR = [
    { ad: 'Bahçe', ikon: '🌳', yildiz: 0 },
    { ad: 'Buzul', ikon: '❄️', yildiz: 25 },
    { ad: 'Çöl Pazarı', ikon: '🏜️', yildiz: 55 },
    { ad: 'Volkan', ikon: '🌋', yildiz: 90 }
  ];
  // Şekilli tahtalar: '#' oynanır hücre, '.' boşluk
  var SEKILLER = {
    kose: ['..####..', '.######.', '########', '########', '########', '########', '.######.', '..####..'],
    kalp: ['.##..##.', '########', '########', '########', '########', '.######.', '..####..', '...##...'],
    arti: ['..####..', '..####..', '########', '########', '########', '########', '..####..', '..####..'],
    cerceve: ['########', '########', '########', '###..###', '###..###', '########', '########', '########'],
    ada: ['###..###', '###..###', '###..###', '###..###', '###..###', '###..###', '###..###', '###..###'],
    kum: ['########', '.######.', '..####..', '..####..', '..####..', '..####..', '.######.', '########']
  };
  // Buz ve kutu desenleri; 'r12' gibi değerler bölüm tohumuyla seçilen 12 rastgele hücredir
  var DESEN = {
    alt2: function (r) { return r >= 6; },
    alt3: function (r) { return r >= 5; },
    yarim: function (r) { return r >= 4; },
    orta: function (r, c) { return r >= 2 && r <= 5 && c >= 2 && c <= 5; },
    capraz: function (r, c) { return r === c || r + c === N - 1; },
    kenar: function (r, c) { return r === 0 || r === N - 1 || c === 0 || c === N - 1; },
    satir3: function (r) { return r === 3 || r === 4; },
    orta2: function (r, c) { return r >= 3 && r <= 4 && c >= 3 && c <= 4; },
    yan: function (r, c) { return r === 4 && (c <= 1 || c >= 6); },
    kose4: function (r, c) { return (r <= 1 || r >= 6) && (c <= 1 || c >= 6); },
    ikiSira: function (r, c) { return (r === 3 && c % 2 === 0) || (r === 5 && c % 2 === 1); }
  };
  // 60 bölüm. h: hedefler { puan, meyve: [tür, adet], buz, kutu, ceviz }; sekil; buz/bk: buz deseni ve kat;
  // kutu/kc: kutu deseni ve dayanıklılık; zin: zincirli meyve sayısı
  var BOLUMLER = [
    // 🌳 Bahçe: 5 tür meyve, puan ve toplama hedefleri
    { h: { puan: 1500 } },
    { h: { meyve: [0, 15] } },
    { h: { puan: 2500 } },
    { h: { meyve: [1, 22] } },
    { h: { puan: 3500 } },
    { h: { puan: 4000 } },
    { h: { meyve: [2, 30] } },
    { h: { puan: 4500 }, sekil: 'kose' },
    { h: { meyve: [3, 35], puan: 4000 } },
    { h: { meyve: [4, 35] }, sekil: 'kose' },
    { h: { puan: 6000 } },
    { h: { meyve: [0, 25] }, sekil: 'cerceve' },
    { h: { meyve: [1, 45], puan: 5500 } },
    { h: { puan: 4000 }, sekil: 'kalp' },
    { h: { meyve: [2, 55], puan: 7000 } },
    // ❄️ Buzul: 6 tür, buz ve şekilli tahtalar
    { h: { buz: 1 }, buz: 'orta', bk: 1 },
    { h: { buz: 1 }, buz: 'satir3', bk: 1 },
    { h: { buz: 1 }, buz: 'capraz', bk: 1, sekil: 'kalp' },
    { h: { buz: 1, puan: 2500 }, buz: 'r12', bk: 1 },
    { h: { buz: 1 }, buz: 'satir3', bk: 2 },
    { h: { buz: 1, meyve: [5, 15] }, buz: 'r10', bk: 1 },
    { h: { buz: 1 }, buz: 'r10', bk: 1, sekil: 'kose' },
    { h: { buz: 1 }, buz: 'orta', bk: 2, sekil: 'arti' },
    { h: { buz: 1, puan: 4000 }, buz: 'r16', bk: 1 },
    { h: { buz: 1 }, buz: 'satir3', bk: 1, sekil: 'kum' },
    { h: { buz: 1, puan: 2500 }, buz: 'orta', bk: 1 },
    { h: { buz: 1 }, buz: 'satir3', bk: 1, sekil: 'cerceve' },
    { h: { buz: 1, meyve: [3, 25] }, buz: 'orta', bk: 2 },
    { h: { buz: 1 }, buz: 'orta', bk: 1, sekil: 'kalp' },
    { h: { buz: 1, puan: 3000 }, buz: 'orta', bk: 2 },
    // 🏜️ Çöl Pazarı: kutu, zincir ve ceviz indirme
    { h: { kutu: 1 }, kutu: 'ikiSira', kc: 1 },
    { h: { kutu: 1 }, kutu: 'yan', kc: 2 },
    { h: { meyve: [0, 25] }, zin: 8 },
    { h: { ceviz: 2 } },
    { h: { kutu: 1 }, kutu: 'r10', kc: 2 },
    { h: { ceviz: 3 }, zin: 6 },
    { h: { kutu: 1, puan: 3000 }, kutu: 'orta2', kc: 3 },
    { h: { meyve: [5, 30] }, zin: 12 },
    { h: { ceviz: 3 }, kutu: 'yan', kc: 1 },
    { h: { kutu: 1 }, kutu: 'r10', kc: 1, sekil: 'cerceve' },
    { h: { ceviz: 4 } },
    { h: { kutu: 1 }, kutu: 'r12', kc: 1, zin: 6 },
    { h: { ceviz: 3, puan: 3000 }, sekil: 'kose' },
    { h: { kutu: 1 }, kutu: 'kose4', kc: 1 },
    { h: { kutu: 1, ceviz: 3 }, kutu: 'ikiSira', kc: 1 },
    // 🌋 Volkan: engellerin karışımı, iki hedefli bölümler
    { h: { buz: 1, kutu: 1 }, buz: 'orta', bk: 1, kutu: 'yan', kc: 1 },
    { h: { ceviz: 3, buz: 1 }, buz: 'orta', bk: 1 },
    { h: { meyve: [1, 30], kutu: 1 }, kutu: 'yan', kc: 2 },
    { h: { buz: 1 }, buz: 'satir3', bk: 2, zin: 10 },
    { h: { kutu: 1, puan: 2500 }, kutu: 'r8', kc: 1 },
    { h: { ceviz: 3, meyve: [2, 20] } },
    { h: { buz: 1, kutu: 1 }, buz: 'r10', bk: 1, kutu: 'orta2', kc: 1, sekil: 'kalp' },
    { h: { buz: 1 }, buz: 'satir3', bk: 2, kutu: 'yan', kc: 1 },
    { h: { ceviz: 3, kutu: 1 }, kutu: 'yan', kc: 1 },
    { h: { meyve: [4, 30], buz: 1 }, buz: 'r12', bk: 1 },
    { h: { kutu: 1 }, kutu: 'r8', kc: 1, zin: 8 },
    { h: { buz: 1, ceviz: 3 }, buz: 'orta', bk: 1 },
    { h: { kutu: 1, buz: 1 }, buz: 'orta', bk: 2, kutu: 'yan', kc: 2, sekil: 'arti' },
    { h: { meyve: [0, 30], kutu: 1 }, kutu: 'ikiSira', kc: 2, zin: 8 },
    { h: { buz: 1, ceviz: 3 }, buz: 'satir3', bk: 1, kutu: 'yan', kc: 1 }
  ];
  // Bölüm başına hamle sınırı ve 2/3 yıldız puan eşikleri: bot benzetimiyle (bölüm başına 40 deneme) ayarlandı.
  // Hamle sınırı botun hedefi bitirdiği medyan hamlenin ~1.5 katı (ilk 5 bölümde 2 kat ve en az 15, dünya sonlarında 1.3),
  // en az 80. yüzdelik, en fazla 40. 2 yıldız botun medyan puanı (bonus dahil), 3 yıldız 80. yüzdeliğin 1.1 katı.
  var HAMLE = [15, 15, 15, 15, 20, 17, 15, 20, 17, 20, 21, 18, 24, 20, 24, 17, 21, 19, 24, 34, 28, 29, 24, 35, 14, 20, 33, 30, 16, 22, 12, 18, 27, 14, 32, 21, 29, 30, 20, 36, 26, 28, 40, 38, 27, 20, 27, 32, 33, 26, 33, 37, 25, 27, 36, 25, 24, 27, 38, 29];
  var Y2 = [5000, 4300, 5000, 4850, 6950, 6450, 5650, 7000, 6650, 6150, 8500, 4000, 8500, 5650, 9900, 3400, 4200, 3000, 5000, 7950, 6350, 5000, 4700, 7300, 1900, 4600, 5200, 6750, 2700, 5300, 2300, 3600, 4850, 1700, 6150, 3050, 5350, 6450, 2850, 5800, 4200, 5900, 5700, 7800, 4200, 4150, 5000, 5950, 7100, 4850, 4900, 5900, 6200, 3800, 6850, 5100, 4600, 5100, 7050, 5250];
  var Y3 = [6950, 5850, 6500, 7500, 9600, 8200, 8300, 8450, 8950, 7950, 11300, 5600, 11000, 7100, 12350, 4850, 5800, 4450, 7250, 9650, 8300, 6850, 6300, 10100, 2500, 6000, 6550, 8450, 3650, 7350, 3250, 4750, 6700, 2750, 7800, 4400, 7250, 8050, 4250, 7150, 5550, 7600, 7450, 9800, 5900, 5600, 6550, 8150, 9050, 6800, 6700, 7550, 7800, 5350, 9500, 6050, 6000, 6650, 9750, 7250];

  // js/oyun.js ile aynı tohumlu üreteç (motor tarayıcı dışında da çalışsın diye kopyası)
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

  function dunyaOf(no) { return Math.floor((no - 1) / 15); }
  // Bölüm ayarı (no 1-60)
  function ayar(no) {
    var B = BOLUMLER[no - 1], h = {};
    for (var k in B.h) h[k] = B.h[k];
    return {
      no: no, dunya: dunyaOf(no), tur: no <= 15 ? 5 : 6, sekil: B.sekil || '', hedef: h,
      buz: B.buz || '', bk: B.bk || 1, kutu: B.kutu || '', kc: B.kc || 1, zin: B.zin || 0,
      hamle: HAMLE[no - 1] || 30, y2: Y2[no - 1] || 3000, y3: Y3[no - 1] || 6000
    };
  }

  // ---------- Tahta ----------
  // t: meyve türü (-1 boş, 0-5 meyve, 6 ceviz, 7 gökkuşağı), s: özel (0, 1 yatay roket, 2 dikey roket, 3 bomba, 4 gökkuşağı)
  // buz: kat, kutu: kalan vuruş, zin: zincir, yok: tahtada olmayan hücre, cevizBekle: daha düşecek ceviz sayısı
  function bos(tur) {
    var b = { t: [], s: [], buz: [], kutu: [], zin: [], yok: [], tur: tur || 6, cevizBekle: 0 };
    for (var i = 0; i < NN; i++) { b.t.push(-1); b.s.push(0); b.buz.push(0); b.kutu.push(0); b.zin.push(0); b.yok.push(0); }
    return b;
  }
  function kopya(b) {
    return { t: b.t.slice(), s: b.s.slice(), buz: b.buz.slice(), kutu: b.kutu.slice(), zin: b.zin.slice(), yok: b.yok.slice(), tur: b.tur, cevizBekle: b.cevizBekle };
  }
  // Eşleşebilir tür (meyve değilse -1)
  function tip(b, i) { var t = b.t[i]; return t >= 0 && t < CEVIZ && !b.yok[i] && !b.kutu[i] ? t : -1; }
  // Yer değiştirebilir hücre
  function oynar(b, i) { return !b.yok[i] && !b.kutu[i] && !b.zin[i] && b.t[i] >= 0; }
  function komsu(a, c) {
    if (a < 0 || c < 0 || a >= NN || c >= NN) return false;
    var d = Math.abs(a - c);
    return d === N || (d === 1 && Math.floor(a / N) === Math.floor(c / N));
  }
  // Hücre i'den geçen 3+ dizi var mı (yer değiştirme denemesi için hızlı kontrol)
  function diziVar(b, i) {
    var t = tip(b, i);
    if (t < 0) return false;
    var r = Math.floor(i / N), c = i % N, n = 1, k;
    for (k = c - 1; k >= 0 && tip(b, r * N + k) === t; k--) n++;
    for (k = c + 1; k < N && tip(b, r * N + k) === t; k++) n++;
    if (n >= 3) return true;
    n = 1;
    for (k = r - 1; k >= 0 && tip(b, k * N + c) === t; k--) n++;
    for (k = r + 1; k < N && tip(b, k * N + c) === t; k++) n++;
    return n >= 3;
  }
  function degistir(b, a, c) {
    var t = b.t[a], s = b.s[a];
    b.t[a] = b.t[c]; b.s[a] = b.s[c];
    b.t[c] = t; b.s[c] = s;
  }
  // Geçerli yer değiştirmeler: [a, c] çiftleri
  function hamleler(b) {
    var l = [];
    for (var i = 0; i < NN; i++) {
      if (!oynar(b, i)) continue;
      var kom = [];
      if (i % N < N - 1) kom.push(i + 1);
      if (i + N < NN) kom.push(i + N);
      for (var k = 0; k < kom.length; k++) {
        var j = kom[k];
        if (!oynar(b, j)) continue;
        if (gecerliMi(b, i, j)) l.push([i, j]);
      }
    }
    return l;
  }
  function gecerliMi(b, a, c) {
    if (!komsu(a, c) || !oynar(b, a) || !oynar(b, c)) return false;
    if (b.s[a] && b.s[c]) return true;
    if ((b.s[a] === GOKKUSAGI && b.t[c] < CEVIZ) || (b.s[c] === GOKKUSAGI && b.t[a] < CEVIZ)) return true;
    // Ceviz alttaki meyveyle eşleşme olmadan da yer değiştirebilir (bir satır iner)
    if ((b.t[a] === CEVIZ && c === a + N && b.t[c] !== CEVIZ) || (b.t[c] === CEVIZ && a === c + N && b.t[a] !== CEVIZ)) return true;
    degistir(b, a, c);
    var ok = diziVar(b, a) || diziVar(b, c);
    degistir(b, a, c);
    return ok;
  }
  // Rastgele meyve (hazır 3'lü oluşturmadan)
  function meyveSec(b, i, rnd) {
    var r = Math.floor(i / N), c = i % N, t, dene = 0;
    do {
      t = Math.floor(rnd() * b.tur);
      dene++;
    } while (dene < 20 && ((c >= 2 && tip(b, i - 1) === t && tip(b, i - 2) === t) || (r >= 2 && tip(b, i - N) === t && tip(b, i - 2 * N) === t) ||
      (c < N - 2 && tip(b, i + 1) === t && tip(b, i + 2) === t) || (r < N - 2 && tip(b, i + N) === t && tip(b, i + 2 * N) === t) ||
      (c >= 1 && c < N - 1 && tip(b, i - 1) === t && tip(b, i + 1) === t) || (r >= 1 && r < N - 1 && tip(b, i - N) === t && tip(b, i + N) === t)));
    return t;
  }
  function cevizSayisi(b) { var n = 0; for (var i = 0; i < NN; i++) if (b.t[i] === CEVIZ) n++; return n; }

  // Düz tahta (serbest ve günlük mod)
  function duzTahta(rnd, tur) {
    var b = bos(tur || 6);
    for (var i = 0; i < NN; i++) b.t[i] = meyveSec(b, i, rnd);
    if (!hamleler(b).length) karistir(b, rnd);
    return b;
  }
  // Bölüm tahtası: şekil ve engeller bölüm tohumuyla herkese aynı, meyveler rnd ile
  function bolumTahta(L, rnd) {
    var b = bos(L.tur), sr = tohum('meyve-patlat/bolum/' + L.no), i, r, c;
    if (L.sekil) for (i = 0; i < NN; i++) b.yok[i] = SEKILLER[L.sekil][Math.floor(i / N)].charAt(i % N) === '.' ? 1 : 0;
    function hucreler(desen, olmasin) {
      var l = [];
      if (!desen) return l;
      if (desen.charAt(0) === 'r') {
        var aday = [];
        for (i = 0; i < NN; i++) if (!b.yok[i] && !olmasin(i)) aday.push(i);
        var n = Math.min(aday.length, Number(desen.slice(1)));
        for (var k = 0; k < n; k++) l.push(aday.splice(Math.floor(sr() * aday.length), 1)[0]);
        return l;
      }
      for (i = 0; i < NN; i++) {
        r = Math.floor(i / N); c = i % N;
        if (!b.yok[i] && !olmasin(i) && DESEN[desen](r, c)) l.push(i);
      }
      return l;
    }
    // Kutular üst satırlarda olmaz (meyveler yukarıdan düşebilsin)
    hucreler(L.kutu, function (x) { return x < N; }).forEach(function (x) { b.kutu[x] = L.kc; });
    hucreler(L.buz, function (x) { return b.kutu[x] > 0; }).forEach(function (x) { b.buz[x] = L.bk; });
    for (i = 0; i < NN; i++) if (!b.yok[i] && !b.kutu[i]) b.t[i] = meyveSec(b, i, rnd);
    if (L.zin) {
      var ad = [];
      for (i = N; i < NN; i++) if (b.t[i] >= 0 && b.t[i] < CEVIZ) ad.push(i);
      for (var z = 0; z < L.zin && ad.length; z++) b.zin[ad.splice(Math.floor(sr() * ad.length), 1)[0]] = 1;
    }
    if (L.hedef.ceviz) {
      var ilk = Math.min(2, L.hedef.ceviz), sut = [];
      // İlk cevizler 3. satırdan başlar
      for (c = 0; c < N; c++) if (!b.yok[2 * N + c] && !b.zin[2 * N + c] && !b.kutu[2 * N + c]) sut.push(2 * N + c);
      for (var j = 0; j < ilk && sut.length; j++) b.t[sut.splice(Math.floor(sr() * sut.length), 1)[0]] = CEVIZ;
      b.cevizBekle = L.hedef.ceviz - cevizSayisi(b);
    }
    if (!hamleler(b).length) karistir(b, rnd);
    return b;
  }

  // Meyveleri karıştırır (engeller ve özel meyveler yerinde kalır); hazır dizi kalmaz, en az bir hamle olur
  function karistir(b, rnd) {
    var yer = [], i;
    for (i = 0; i < NN; i++) if (oynar(b, i) && b.t[i] < CEVIZ && !b.s[i]) yer.push(i);
    var turler = yer.map(function (x) { return b.t[x]; });
    for (var dene = 0; dene < 60; dene++) {
      for (var k = turler.length - 1; k > 0; k--) {
        var j = Math.floor(rnd() * (k + 1)), g = turler[k];
        turler[k] = turler[j]; turler[j] = g;
      }
      if (dene >= 30) turler = yer.map(function () { return Math.floor(rnd() * b.tur); });
      yer.forEach(function (x, n) { b.t[x] = turler[n]; });
      var hazir = false;
      for (i = 0; i < NN && !hazir; i++) if (diziVar(b, i)) hazir = true;
      if (!hazir && hamleler(b).length) return true;
    }
    // Son çare: hazır dizi olmadan baştan doldur
    yer.forEach(function (x) { b.t[x] = -1; });
    yer.forEach(function (x) { b.t[x] = meyveSec(b, x, rnd); });
    return hamleler(b).length > 0;
  }

  // ---------- Eşleşme ve patlama ----------
  // 3+ diziler; aynı hücreyi paylaşan diziler tek grup olur (L/T şekilleri)
  function eslesmeler(b) {
    var diziler = [], r, c, k, t;
    for (r = 0; r < N; r++) {
      for (c = 0; c < N;) {
        t = tip(b, r * N + c);
        if (t < 0) { c++; continue; }
        for (k = c + 1; k < N && tip(b, r * N + k) === t; k++);
        if (k - c >= 3) { var h = []; for (var x = c; x < k; x++) h.push(r * N + x); diziler.push({ h: h, yon: 'y', t: t }); }
        c = k;
      }
    }
    for (c = 0; c < N; c++) {
      for (r = 0; r < N;) {
        t = tip(b, r * N + c);
        if (t < 0) { r++; continue; }
        for (k = r + 1; k < N && tip(b, k * N + c) === t; k++);
        if (k - r >= 3) { var v = []; for (var y = r; y < k; y++) v.push(y * N + c); diziler.push({ h: v, yon: 'd', t: t }); }
        r = k;
      }
    }
    if (!diziler.length) return [];
    var ata = diziler.map(function (d, i) { return i; });
    function bul(i) { while (ata[i] !== i) i = ata[i] = ata[ata[i]]; return i; }
    var sahip = {};
    diziler.forEach(function (d, i) {
      d.h.forEach(function (x) {
        if (sahip[x] !== undefined) ata[bul(i)] = bul(sahip[x]);
        else sahip[x] = i;
      });
    });
    var gruplar = {};
    diziler.forEach(function (d, i) {
      var a = bul(i);
      if (!gruplar[a]) gruplar[a] = { diziler: [], h: [], t: d.t };
      gruplar[a].diziler.push(d);
    });
    return Object.keys(gruplar).map(function (a) {
      var g = gruplar[a], gor = {};
      g.diziler.forEach(function (d) { d.h.forEach(function (x) { if (!gor[x]) { gor[x] = 1; g.h.push(x); } }); });
      return g;
    });
  }
  // Grubun oluşturacağı özel meyve: 5'li düz → gökkuşağı, L/T → bomba, 4'lü → roket (dizinin yönünde)
  function ozelTur(g) {
    var enUzun = 0, y = false, d = false, uzunYon = 'y';
    g.diziler.forEach(function (x) {
      if (x.h.length > enUzun) { enUzun = x.h.length; uzunYon = x.yon; }
      if (x.yon === 'y') y = true; else d = true;
    });
    if (enUzun >= 5) return GOKKUSAGI;
    if (y && d) return BOMBA;
    if (enUzun === 4) return uzunYon === 'y' ? ROKET_Y : ROKET_D;
    return 0;
  }
  function grupPuan(n) { return n <= 3 ? 30 : n === 4 ? 60 : 100 + (n - 5) * 20; }
  function yeniSonuc() {
    return { gecerli: false, puan: 0, adimlar: [], toplanan: [0, 0, 0, 0, 0, 0], buz: 0, kutu: 0, kutuVur: 0, zincir: 0, ceviz: 0, olusan: { roket: 0, bomba: 0, gokkusagi: 0 }, kaskad: 0, karisti: false };
  }
  function enCokTur(b) {
    var say = [0, 0, 0, 0, 0, 0], en = 0;
    for (var i = 0; i < NN; i++) if (tip(b, i) >= 0) say[b.t[i]]++;
    for (var t = 1; t < 6; t++) if (say[t] > say[en]) en = t;
    return en;
  }
  // Tek hücreye vuruş: kutu bir kat kırılır, zincir çözülür, meyve patlar (özel ise etkisi tetiklenir); ceviz patlamaz
  function vur(x, i, eslesme) {
    var b = x.b;
    if (i < 0 || i >= NN || b.yok[i] || x.vuruldu[i]) return;
    if (b.kutu[i]) {
      x.vuruldu[i] = 1;
      b.kutu[i]--;
      x.puan += 20;
      x.sonuc.kutuVur++;
      if (!b.kutu[i]) x.sonuc.kutu++;
      x.temiz.push(i);
      return;
    }
    if (b.t[i] < 0 || b.t[i] === CEVIZ) return;
    x.vuruldu[i] = 1;
    if (b.zin[i]) {
      b.zin[i] = 0;
      x.puan += 20;
      x.sonuc.zincir++;
      x.temiz.push(i);
      return;
    }
    var s = b.s[i], t = b.t[i];
    sil(x, i);
    if (t < CEVIZ) x.sonuc.toplanan[t]++;
    if (!eslesme) x.puan += 10;
    if (s) patlat(x, i, s);
  }
  // Hücreyi etkisini tetiklemeden boşaltır (altındaki buz bir kat kırılır)
  function sil(x, i) {
    var b = x.b;
    x.vuruldu[i] = 1;
    if (b.buz[i]) { b.buz[i]--; x.puan += 20; x.sonuc.buz++; }
    b.t[i] = -1;
    b.s[i] = 0;
    x.temiz.push(i);
  }
  function satir(x, r) { for (var c = 0; c < N; c++) vur(x, r * N + c); }
  function sutun(x, c) { for (var r = 0; r < N; r++) vur(x, r * N + c); }
  function alan(x, i, yaricap) {
    var r = Math.floor(i / N), c = i % N;
    for (var dr = -yaricap; dr <= yaricap; dr++) for (var dc = -yaricap; dc <= yaricap; dc++) {
      var rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < N && cc >= 0 && cc < N) vur(x, rr * N + cc);
    }
  }
  function patlat(x, i, s) {
    var r = Math.floor(i / N), c = i % N;
    if (s === ROKET_Y) satir(x, r);
    else if (s === ROKET_D) sutun(x, c);
    else if (s === BOMBA) alan(x, i, 1);
    else if (s === GOKKUSAGI) {
      var t = enCokTur(x.b);
      for (var j = 0; j < NN; j++) if (tip(x.b, j) === t) vur(x, j);
    }
  }
  function baglam(b, sonuc) { return { b: b, puan: 0, temiz: [], vuruldu: {}, sonuc: sonuc, yeni: [] }; }

  // Yerçekimi: meyveler boşluklara düşer (tahta dışı hücrelerden geçer, kutu ve zincirde durur); boşluklara yeni meyve gelir
  function dusur(b, rnd) {
    var r, c, i, k, j;
    for (c = 0; c < N; c++) {
      for (r = N - 1; r >= 0; r--) {
        i = r * N + c;
        if (b.yok[i] || b.kutu[i] || b.t[i] >= 0) continue;
        for (k = r - 1; k >= 0; k--) {
          j = k * N + c;
          if (b.yok[j]) continue;
          if (b.kutu[j] || b.zin[j]) break;
          if (b.t[j] >= 0) {
            b.t[i] = b.t[j]; b.s[i] = b.s[j];
            b.t[j] = -1; b.s[j] = 0;
            break;
          }
        }
      }
    }
    var yeni = [];
    for (i = 0; i < NN; i++) {
      if (b.yok[i] || b.kutu[i] || b.t[i] >= 0) continue;
      if (b.cevizBekle > 0 && i < 2 * N && cevizSayisi(b) < 2) { b.t[i] = CEVIZ; b.cevizBekle--; }
      else b.t[i] = Math.floor(rnd() * b.tur);
      b.s[i] = 0;
      yeni.push(i);
    }
    return yeni;
  }
  // Sütununun en alt hücresine inen cevizleri toplar
  function cevizTopla(b, sonuc) {
    var n = 0;
    for (var c = 0; c < N; c++) {
      for (var r = N - 1; r >= 0; r--) {
        var i = r * N + c;
        if (b.yok[i]) continue;
        if (b.t[i] === CEVIZ && !b.kutu[i]) { b.t[i] = -1; n++; }
        break;
      }
    }
    sonuc.ceviz += n;
    sonuc.puan += n * 100;
    return n;
  }
  // Bir patlama adımından sonra: düşür, cevizleri topla, adımı kaydet
  function yerlestir(b, rnd, sonuc, x, k) {
    var yeni = dusur(b, rnd);
    while (cevizTopla(b, sonuc)) yeni = yeni.concat(dusur(b, rnd));
    sonuc.adimlar.push({ temiz: x.temiz, yeni: yeni, tahta: kopya(b), k: k, puan: x.puan * k });
    sonuc.puan += x.puan * k;
    if (k > sonuc.kaskad) sonuc.kaskad = k;
  }
  // Zincirleme patlamalar; k: başlangıç çarpanı. tercih: yeni özel meyvenin konacağı hücreler (yer değiştirenler)
  function coz(b, rnd, sonuc, k, tercih) {
    for (var dongu = 0; dongu < 60; dongu++) {
      var gruplar = eslesmeler(b);
      if (!gruplar.length) break;
      var x = baglam(b, sonuc), ozel = [];
      gruplar.forEach(function (g) {
        x.puan += grupPuan(g.h.length);
        var oz = ozelTur(g);
        if (!oz) return;
        var aday = g.h.filter(function (i) { return !b.zin[i]; }), p = -1;
        if (tercih) tercih.forEach(function (i) { if (p < 0 && aday.indexOf(i) !== -1) p = i; });
        if (p < 0 && oz === BOMBA) {
          var say = {};
          g.diziler.forEach(function (d) { d.h.forEach(function (i) { say[i] = (say[i] || 0) + 1; }); });
          aday.forEach(function (i) { if (p < 0 && say[i] > 1) p = i; });
        }
        if (p < 0 && aday.length) p = aday[Math.floor(aday.length / 2)];
        if (p >= 0) ozel.push({ i: p, s: oz, t: oz === GOKKUSAGI ? RENKSIZ : g.t });
      });
      var engel = [];
      gruplar.forEach(function (g) {
        g.h.forEach(function (i) {
          vur(x, i, true);
          var r = Math.floor(i / N), c = i % N;
          if (r > 0) engel.push(i - N);
          if (r < N - 1) engel.push(i + N);
          if (c > 0) engel.push(i - 1);
          if (c < N - 1) engel.push(i + 1);
        });
      });
      // Eşleşmenin yanındaki kutular kırılır, zincirler çözülür
      engel.forEach(function (i) { if (b.kutu[i] || b.zin[i]) vur(x, i, true); });
      ozel.forEach(function (o) {
        if (b.t[o.i] >= 0 || b.kutu[o.i] || b.yok[o.i]) return;
        b.t[o.i] = o.t;
        b.s[o.i] = o.s;
        sonuc.olusan[o.s === GOKKUSAGI ? 'gokkusagi' : o.s === BOMBA ? 'bomba' : 'roket']++;
      });
      x.ozel = ozel.map(function (o) { return o.i; });
      yerlestir(b, rnd, sonuc, x, k);
      sonuc.adimlar[sonuc.adimlar.length - 1].ozel = x.ozel;
      k++;
      tercih = null;
    }
  }
  // Hamle sonrası geçerli hamle yoksa karıştırır
  function sonrasi(b, rnd, sonuc) {
    if (!hamleler(b).length) { karistir(b, rnd); sonuc.karisti = true; sonuc.tahta = kopya(b); }
  }

  // Yer değiştirme. Döner: sonuc { gecerli, puan, adimlar, toplanan, buz, kutu, zincir, ceviz, olusan, kaskad }
  function hamle(b, a, c, rnd) {
    var sonuc = yeniSonuc();
    if (!gecerliMi(b, a, c)) return sonuc;
    sonuc.gecerli = true;
    var sa = b.s[a], sc = b.s[c], x;
    if (sa && sc) {
      // Özel + özel birleşimi; etki hedef hücrede (c) olur
      x = baglam(b, sonuc);
      var ta = b.t[a], tc = b.t[c];
      sil(x, a); sil(x, c);
      var roketA = sa === ROKET_Y || sa === ROKET_D, roketC = sc === ROKET_Y || sc === ROKET_D, r = Math.floor(c / N), cc = c % N, d;
      if (sa === GOKKUSAGI && sc === GOKKUSAGI) {
        for (var j = 0; j < NN; j++) vur(x, j);
      } else if (sa === GOKKUSAGI || sc === GOKKUSAGI) {
        var oz = sa === GOKKUSAGI ? sc : sa, tt = sa === GOKKUSAGI ? tc : ta, sira = 0;
        for (var q = 0; q < NN; q++) {
          if (tip(b, q) === tt && !b.zin[q]) { b.s[q] = oz === BOMBA ? BOMBA : (sira++ % 2 ? ROKET_D : ROKET_Y); }
        }
        for (var q2 = 0; q2 < NN; q2++) if (tip(b, q2) === tt) vur(x, q2);
      } else if (roketA && roketC) {
        satir(x, r); sutun(x, cc);
      } else if (roketA || roketC) {
        for (d = -1; d <= 1; d++) { if (r + d >= 0 && r + d < N) satir(x, r + d); if (cc + d >= 0 && cc + d < N) sutun(x, cc + d); }
      } else {
        alan(x, c, 2);
      }
      x.puan += 200;
      yerlestir(b, rnd, sonuc, x, 1);
      coz(b, rnd, sonuc, 2, null);
    } else if (sa === GOKKUSAGI || sc === GOKKUSAGI) {
      // Gökkuşağı + meyve: o türün tahtadaki tamamı patlar
      var g = sa === GOKKUSAGI ? a : c, m = g === a ? c : a, tur = b.t[m];
      x = baglam(b, sonuc);
      sil(x, g);
      for (var y = 0; y < NN; y++) if (tip(b, y) === tur) vur(x, y);
      x.puan += 100;
      yerlestir(b, rnd, sonuc, x, 1);
      coz(b, rnd, sonuc, 2, null);
    } else {
      degistir(b, a, c);
      if (cevizTopla(b, sonuc)) yerlestir(b, rnd, sonuc, baglam(b, sonuc), 1);
      coz(b, rnd, sonuc, 1, [c, a]);
    }
    sonrasi(b, rnd, sonuc);
    return sonuc;
  }
  // Çekiç güçlendiricisi: tek hücreye vurur (meyve, kutu veya zincir); ceviz ve boş hücre olmaz
  function cekic(b, i, rnd) {
    var sonuc = yeniSonuc();
    if (i < 0 || i >= NN || b.yok[i] || (!b.kutu[i] && (b.t[i] < 0 || b.t[i] === CEVIZ))) return sonuc;
    sonuc.gecerli = true;
    var x = baglam(b, sonuc);
    vur(x, i);
    yerlestir(b, rnd, sonuc, x, 1);
    coz(b, rnd, sonuc, 2, null);
    sonrasi(b, rnd, sonuc);
    return sonuc;
  }
  // Hedef tamamlanınca kalan her hamle rastgele bir meyveyi rokete çevirip patlatır
  function bonus(b, kalan, rnd) {
    var sonuc = yeniSonuc();
    for (var n = 0; n < kalan; n++) {
      var aday = [];
      for (var i = 0; i < NN; i++) if (tip(b, i) >= 0 && !b.s[i] && !b.zin[i]) aday.push(i);
      if (!aday.length) break;
      var p = aday[Math.floor(rnd() * aday.length)], x = baglam(b, sonuc);
      b.s[p] = rnd() < 0.5 ? ROKET_Y : ROKET_D;
      vur(x, p);
      x.puan += 50;
      yerlestir(b, rnd, sonuc, x, 1);
      coz(b, rnd, sonuc, 2, null);
    }
    sonrasi(b, rnd, sonuc);
    sonuc.gecerli = true;
    return sonuc;
  }

  // ---------- Hedefler ----------
  // ilerleme: { puan, toplanan[6], ceviz }
  function kalanBuz(b) { var n = 0; for (var i = 0; i < NN; i++) if (b.buz[i] && !b.yok[i]) n++; return n; }
  function kalanKutu(b) { var n = 0; for (var i = 0; i < NN; i++) if (b.kutu[i]) n++; return n; }
  function hedefTamam(L, b, il) {
    var h = L.hedef;
    if (h.puan && il.puan < h.puan) return false;
    if (h.meyve && il.toplanan[h.meyve[0]] < h.meyve[1]) return false;
    if (h.buz && kalanBuz(b)) return false;
    if (h.kutu && kalanKutu(b)) return false;
    if (h.ceviz && il.ceviz < h.ceviz) return false;
    return true;
  }
  function ilerlemeEkle(il, s) {
    il.puan += s.puan;
    for (var t = 0; t < 6; t++) il.toplanan[t] += s.toplanan[t];
    il.ceviz += s.ceviz;
  }
  function yeniIlerleme() { return { puan: 0, toplanan: [0, 0, 0, 0, 0, 0], ceviz: 0 }; }

  // ---------- Bot ----------
  // Açgözlü bot: her geçerli hamleyi sabit tohumla dener, puan ve hedef ilerlemesine göre en iyisini seçer
  function cevizDerinlik(b) { var n = 0; for (var i = 0; i < NN; i++) if (b.t[i] === CEVIZ) n += Math.floor(i / N); return n; }
  function enIyi(b, L, il) {
    var l = hamleler(b), en = null, h = L ? L.hedef : {};
    var cd0 = h.ceviz ? cevizDerinlik(b) : 0;
    l.forEach(function (m) {
      var d = kopya(b), s = hamle(d, m[0], m[1], tohum('bot'));
      var v = s.puan / (h.puan && il.puan < h.puan ? 8 : 25);
      if (h.meyve) v += Math.min(Math.max(0, h.meyve[1] - il.toplanan[h.meyve[0]]), s.toplanan[h.meyve[0]]) * 10;
      if (h.buz) v += s.buz * 14;
      if (h.kutu) v += s.kutuVur * 14;
      if (h.ceviz) v += s.ceviz * 150 + (cevizDerinlik(d) - cd0) * 14;
      v += s.zincir * 4 + s.olusan.roket * 6 + s.olusan.bomba * 9 + s.olusan.gokkusagi * 14;
      if (!en || v > en.v) en = { a: m[0], c: m[1], v: v };
    });
    return en;
  }

  var api = {
    N: N, CEVIZ: CEVIZ, RENKSIZ: RENKSIZ, ROKET_Y: ROKET_Y, ROKET_D: ROKET_D, BOMBA: BOMBA, GOKKUSAGI: GOKKUSAGI,
    BOLUM_SAYI: BOLUM_SAYI, DUNYALAR: DUNYALAR, BOLUMLER: BOLUMLER, HAMLE: HAMLE, Y2: Y2, Y3: Y3,
    tohum: tohum, ayar: ayar, dunyaOf: dunyaOf, bos: bos, kopya: kopya, duzTahta: duzTahta, bolumTahta: bolumTahta,
    komsu: komsu, hamleler: hamleler, gecerliMi: gecerliMi, eslesmeler: eslesmeler, karistir: karistir, hamle: hamle, cekic: cekic, bonus: bonus,
    kalanBuz: kalanBuz, kalanKutu: kalanKutu, hedefTamam: hedefTamam, ilerlemeEkle: ilerlemeEkle, yeniIlerleme: yeniIlerleme, enIyi: enIyi
  };
  if (typeof window !== 'undefined') window.MeyvePatlatMotor = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();

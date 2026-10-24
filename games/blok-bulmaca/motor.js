// Blok Bulmaca motoru: parça şekilleri, yerleştirme ve satır/sütun temizleme kuralları, puanlama,
// 45 macera bölümünün ayarı ve tohumlu başlangıç ızgarası, parça dizisi üretici ve açgözlü bir bot
// (bölüm dengesini ölçmek ve oynanış testinde bölüm kazanmak için). Hem oyun hem oynanış testi kullanır.
(function () {
  var N = 8;
  // Şekiller: [satır, sütun] hücreleri. z: zorluk sınıfı (0 küçük, 1 orta, 2 büyük)
  var SEKILLER = [
    { h: [[0, 0]], z: 0 },
    { h: [[0, 0], [0, 1]], z: 0 },
    { h: [[0, 0], [1, 0]], z: 0 },
    { h: [[0, 0], [0, 1], [0, 2]], z: 0 },
    { h: [[0, 0], [1, 0], [2, 0]], z: 0 },
    { h: [[0, 0], [0, 1], [1, 0]], z: 0 },
    { h: [[0, 0], [0, 1], [1, 1]], z: 0 },
    { h: [[0, 0], [1, 0], [1, 1]], z: 0 },
    { h: [[0, 1], [1, 0], [1, 1]], z: 0 },
    { h: [[0, 0], [0, 1], [1, 0], [1, 1]], z: 1 },
    { h: [[0, 0], [0, 1], [0, 2], [0, 3]], z: 1 },
    { h: [[0, 0], [1, 0], [2, 0], [3, 0]], z: 1 },
    { h: [[0, 0], [0, 1], [0, 2], [1, 1]], z: 1 },
    { h: [[1, 0], [1, 1], [1, 2], [0, 1]], z: 1 },
    { h: [[0, 0], [1, 0], [2, 0], [1, 1]], z: 1 },
    { h: [[0, 1], [1, 1], [2, 1], [1, 0]], z: 1 },
    { h: [[0, 0], [1, 0], [2, 0], [2, 1]], z: 1 },
    { h: [[0, 1], [1, 1], [2, 1], [2, 0]], z: 1 },
    { h: [[0, 0], [0, 1], [0, 2], [1, 0]], z: 1 },
    { h: [[0, 0], [0, 1], [0, 2], [1, 2]], z: 1 },
    { h: [[0, 1], [0, 2], [1, 0], [1, 1]], z: 1 },
    { h: [[0, 0], [0, 1], [1, 1], [1, 2]], z: 1 },
    { h: [[0, 0], [1, 0], [1, 1], [2, 1]], z: 1 },
    { h: [[0, 1], [1, 1], [1, 0], [2, 0]], z: 1 },
    { h: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], z: 2 },
    { h: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], z: 2 },
    { h: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], z: 2 },
    { h: [[0, 2], [1, 2], [2, 2], [2, 1], [2, 0]], z: 2 },
    { h: [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]], z: 2 },
    { h: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]], z: 2 },
    { h: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]], z: 2 },
    { h: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]], z: 2 },
    { h: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]], z: 2 }
  ];
  SEKILLER.forEach(function (s) {
    s.y = 1 + Math.max.apply(null, s.h.map(function (x) { return x[0]; }));
    s.g = 1 + Math.max.apply(null, s.h.map(function (x) { return x[1]; }));
  });
  var RENK_SAYI = 7;
  var DUNYALAR = [
    { ad: 'Bahçe', ikon: '🌱' },
    { ad: 'Maden', ikon: '⛏️' },
    { ad: 'Buz Kalesi', ikon: '🏰' }
  ];
  var BOLUM_SAYI = 45;
  // Bölüm başına başlangıç ızgarası tohum varyantı ve hamle sınırı: bot benzetimiyle (80 deneme) dengelendi.
  // Hamle sınırı, botun hedefe ulaştığı medyan hamlenin 1.45 (1. bölüm) ile 1.2 (45. bölüm) katı, en az medyan + 4.
  var VARYANT = [0, 0, 0, 0, 0, 0, 3, 5, 1, 4, 5, 0, 5, 5, 3, 2, 2, 1, 4, 5, 3, 0, 4, 3, 3, 2, 3, 5, 5, 4, 4, 3, 5, 1, 4, 1, 2, 4, 2, 5, 4, 0, 5, 0, 4];
  var HAMLE = [19, 21, 24, 26, 29, 28, 27, 30, 33, 33, 37, 38, 38, 42, 43, 12, 13, 12, 37, 26, 18, 22, 42, 14, 22, 21, 46, 26, 25, 17, 18, 20, 21, 21, 26, 36, 18, 20, 25, 28, 31, 38, 36, 45, 46];

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

  // Bölüm ayarı (no 1-45). hedef: { puan } veya { elmas, kilit }; hamle: sınır; y2/y3: yıldız için kalan hamle
  function ayar(no) {
    var w = Math.floor((no - 1) / 15), i = (no - 1) % 15, L = { no: no, dunya: w, desen: 0, elmas: 0, kilit: 0 };
    if (w === 0) {
      L.hedef = { puan: 60 + i * 16 };
      L.desen = i < 6 ? 0 : 0.14 + (i - 6) * 0.015;
      L.kolay = i < 5;
    } else if (w === 1) {
      if (i % 4 === 3) {
        L.hedef = { puan: 200 + i * 12 };
        L.desen = 0.2;
      } else {
        L.elmas = 2 + Math.floor(i / 4);
        L.hedef = { elmas: L.elmas };
        L.desen = 0.12 + i * 0.006;
      }
    } else {
      L.kilit = 1 + Math.floor(i / 4);
      if (i % 3 === 2) L.elmas = 1 + Math.floor(i / 6);
      L.hedef = L.elmas ? { elmas: L.elmas, kilit: L.kilit } : { kilit: L.kilit };
      L.desen = 0.14 + i * 0.005;
    }
    L.hamle = HAMLE[no - 1];
    L.y3 = Math.ceil(L.hamle * 0.3);
    L.y2 = Math.ceil(L.hamle * 0.15);
    return L;
  }

  function bosIzgara() {
    var h = [], e = [], k = [];
    for (var i = 0; i < N * N; i++) { h.push(0); e.push(0); k.push(0); }
    return { h: h, e: e, k: k };
  }
  function kopya(iz) { return { h: iz.h.slice(), e: iz.e.slice(), k: iz.k.slice() }; }

  // Tohumlu başlangıç ızgarası: yoğunluk kadar dolu hücre, dolu satır/sütun yok; elmas ve kilitler dolu hücrelerde
  function izgaraUret(o, rnd) {
    var iz = bosIzgara(), i;
    if (o.desen) {
      for (i = 0; i < N * N; i++) if (rnd() < o.desen) iz.h[i] = 1 + Math.floor(rnd() * RENK_SAYI);
    }
    var yerlestir = function (n, alan) {
      for (var j = 0; j < n; j++) {
        var aday = [];
        for (var x = 0; x < N * N; x++) if (!iz.e[x] && !iz.k[x]) aday.push(x);
        var p = aday[Math.floor(rnd() * aday.length)];
        if (!iz.h[p]) iz.h[p] = 1 + Math.floor(rnd() * RENK_SAYI);
        iz[alan][p] = alan === 'k' ? 2 : 1;
      }
    };
    yerlestir(o.elmas || 0, 'e');
    yerlestir(o.kilit || 0, 'k');
    // Başta dolu hat olmasın: her dolu hattan özel olmayan bir hücre boşalt
    for (var t = 0; t < 2 * N; t++) {
      var hat = hatHucreleri(t), dolu = hat.every(function (x) { return iz.h[x]; });
      if (!dolu) continue;
      var ac = hat.filter(function (x) { return !iz.e[x] && !iz.k[x]; });
      iz.h[ac[Math.floor(rnd() * ac.length)]] = 0;
    }
    return iz;
  }
  // Bölümün başlangıç ızgarası (herkese aynı)
  function bolumIzgara(no, varyant) {
    var v = varyant === undefined ? VARYANT[no - 1] || 0 : varyant;
    return izgaraUret(ayar(no), tohum('blok-bulmaca/bolum/' + no + (v ? '/' + v : '')));
  }
  // t < 8: satır t; t >= 8: sütun t-8
  function hatHucreleri(t) {
    var l = [];
    for (var j = 0; j < N; j++) l.push(t < N ? t * N + j : j * N + (t - N));
    return l;
  }

  // Parça dizisi: her parça tek rnd() çağrısıyla seçilir (günlük modda herkese aynı dizi).
  // zor: 0..1 büyük şekillerin ağırlığı; kolay: büyük şekiller hiç gelmez
  function parcaSec(rnd, zor, kolay) {
    var agirlik = kolay ? [3, 1.4, 0] : [2, 2, 0.6 + zor * 1.6];
    var toplam = 0, liste = [];
    SEKILLER.forEach(function (s, i) {
      var a = agirlik[s.z] / (s.z === 0 ? 9 : s.z === 1 ? 15 : 9) * 10;
      if (a > 0) { liste.push([i, a]); toplam += a; }
    });
    var r = rnd() * toplam;
    for (var j = 0; j < liste.length; j++) { r -= liste[j][1]; if (r < 0) return liste[j][0]; }
    return liste[liste.length - 1][0];
  }
  function parca(rnd, zor, kolay) {
    var s = parcaSec(rnd, zor, kolay);
    return { s: s, r: 1 + (s % RENK_SAYI) };
  }

  function sigar(iz, s, r, c) {
    var S = SEKILLER[s];
    if (r < 0 || c < 0 || r + S.y > N || c + S.g > N) return false;
    for (var i = 0; i < S.h.length; i++) if (iz.h[(r + S.h[i][0]) * N + c + S.h[i][1]]) return false;
    return true;
  }
  function sigarMi(iz, s) {
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) if (sigar(iz, s, r, c)) return true;
    return false;
  }
  // Yerleşince temizlenecek hatlar (önizleme için)
  function temizlenecek(iz, s, r, c) {
    var S = SEKILLER[s], h = iz.h.slice();
    S.h.forEach(function (x) { h[(r + x[0]) * N + c + x[1]] = 1; });
    var l = [];
    for (var t = 0; t < 2 * N; t++) if (hatHucreleri(t).every(function (x) { return h[x]; })) l.push(t);
    return l;
  }
  // Parçayı yerleştirir, hatları temizler. seri: önceki ardışık temizleme sayısı.
  // Döner: { puan, hat, seri, elmas, kilit, hucreler (temizlenen), kirik (kilidi kırılan) }
  function yerlestir(iz, p, r, c, seri) {
    var S = SEKILLER[p.s];
    S.h.forEach(function (x) { iz.h[(r + x[0]) * N + c + x[1]] = p.r; });
    var hatlar = [];
    for (var t = 0; t < 2 * N; t++) if (hatHucreleri(t).every(function (x) { return iz.h[x]; })) hatlar.push(t);
    var gorulen = {}, sonuc = { puan: S.h.length, hat: hatlar.length, seri: 0, elmas: 0, kilit: 0, hucreler: [], kirik: [] };
    hatlar.forEach(function (t) {
      hatHucreleri(t).forEach(function (x) {
        if (gorulen[x]) return;
        gorulen[x] = 1;
        if (iz.k[x] === 2) { iz.k[x] = 1; sonuc.kirik.push(x); return; }
        if (iz.k[x] === 1) { iz.k[x] = 0; sonuc.kilit++; }
        if (iz.e[x]) { iz.e[x] = 0; sonuc.elmas++; }
        iz.h[x] = 0;
        sonuc.hucreler.push(x);
      });
    });
    if (hatlar.length) {
      sonuc.seri = (seri || 0) + 1;
      sonuc.puan += hatlar.length * 10 * hatlar.length;
      if (sonuc.seri >= 2) sonuc.puan += sonuc.seri * 5;
    }
    return sonuc;
  }

  // Açgözlü bot: elindeki parçalardan en iyi (parça, konum) seçimi. Izgarayı pürüzlülük, sıkışmış boş hücreler,
  // büyük parçalara yer kalması ve elmas/kilit hatlarındaki doluluğa göre değerlendirir.
  function degerlendir(iz) {
    var h = iz.h, v = 0, r, c, i;
    for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
      i = r * N + c;
      var dolu = !!h[i];
      if ((c === N - 1 ? 1 : !!h[i + 1]) !== dolu && c < N - 1) v -= 1;
      if ((r === N - 1 ? 1 : !!h[i + N]) !== dolu && r < N - 1) v -= 1;
      if (!dolu) {
        var kom = 0;
        if (r === 0 || h[i - N]) kom++;
        if (r === N - 1 || h[i + N]) kom++;
        if (c === 0 || h[i - 1]) kom++;
        if (c === N - 1 || h[i + 1]) kom++;
        if (kom === 4) v -= 6; else if (kom === 3) v -= 2;
      } else v -= 0.3;
    }
    if (sigarMi(iz, 30)) v += 8;
    if (sigarMi(iz, 24)) v += 3;
    if (sigarMi(iz, 25)) v += 3;
    for (var t = 0; t < 2 * N; t++) {
      var hat = hatHucreleri(t), ozel = 0, doluN = 0;
      hat.forEach(function (x) { if (iz.e[x] || iz.k[x]) ozel += iz.k[x] || 1; if (h[x]) doluN++; });
      if (ozel) v += ozel * doluN * 0.9;
    }
    return v;
  }
  function enIyi(iz, parcalar, seri) {
    var en = null;
    parcalar.forEach(function (p, pi) {
      if (!p) return;
      for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
        if (!sigar(iz, p.s, r, c)) continue;
        var dene = kopya(iz), s = yerlestir(dene, p, r, c, seri);
        var kalan = parcalar.filter(function (q, qi) { return q && qi !== pi; });
        var hepsi = kalan.every(function (q) { return sigarMi(dene, q.s); });
        var puan = s.hat * 12 + s.elmas * 40 + s.kilit * 40 + s.kirik.length * 20 + degerlendir(dene) + (hepsi ? 30 : 0);
        if (!en || puan > en.puan) en = { i: pi, r: r, c: c, puan: puan };
      }
    });
    return en;
  }

  window.BlokBulmacaMotor = {
    N: N, SEKILLER: SEKILLER, RENK_SAYI: RENK_SAYI, DUNYALAR: DUNYALAR, BOLUM_SAYI: BOLUM_SAYI,
    ayar: ayar, tohum: tohum, bolumIzgara: bolumIzgara, bosIzgara: bosIzgara, kopya: kopya, izgaraUret: izgaraUret, hatHucreleri: hatHucreleri,
    parca: parca, sigar: sigar, sigarMi: sigarMi, temizlenecek: temizlenecek, yerlestir: yerlestir, enIyi: enIyi
  };
})();

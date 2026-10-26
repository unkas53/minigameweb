// Mayın Tarlası motoru: Sefer modunun 30 bölümü (tahta biçimi maskeleri, mayın yoğunluğu, süre hedefi),
// tahmin gerektirmeyen tahta üretimi, görünen tahtadan kesin sonuç çıkaran çözücü, yıldız hesabı ve temalar.
// Hem oyun hem oynanış testi kullanır.
(function () {
  // Maskeler: x, y hücre merkezinin [-1, 1] aralığındaki konumu; false dönen kare "kapalı"dır (oynanmaz).
  var BICIMLER = {
    kare: { ad: 'Kare', f: function () { return true; } },
    arti: { ad: 'Artı', f: function (x, y) { return Math.abs(x) < 0.45 || Math.abs(y) < 0.45; } },
    elmas: { ad: 'Elmas', f: function (x, y) { return Math.abs(x) + Math.abs(y) <= 1.2; } },
    cerceve: { ad: 'Çerçeve', f: function (x, y) { return !(Math.abs(x) < 0.35 && Math.abs(y) < 0.35); } },
    delik: { ad: 'Ortası delik', f: function (x, y) { return x * x + y * y > 0.2; } },
    ada: { ad: 'İki ada', yogKat: 0.9, f: function (x, y) { return Math.abs(x) > 0.2 || Math.abs(y) < 0.25; } },
    L: { ad: 'L', f: function (x, y) { return !(x > 0.1 && y < -0.1); } },
    merdiven: { ad: 'Merdiven', f: function (x, y) { return Math.abs(x - y) <= 1.05; } },
    yildiz: { ad: 'Yıldız', yogKat: 0.85, f: function (x, y) {
      var r = Math.sqrt(x * x + y * y), a = Math.atan2(y, x) + Math.PI / 2;
      return r <= 0.74 + 0.3 * Math.cos(5 * a);
    } },
    labirent: { ad: 'Labirent', yogKat: 0.8, izgara: function (r, c, R, C) {
      var d1 = Math.floor(R / 3), d2 = Math.floor(2 * R / 3);
      if (r === d1) return c >= C - 4;
      if (r === d2) return c < 4;
      return true;
    } },
    kalp: { ad: 'Kalp', f: function (x, y) {
      // İki yuvarlak tepe ve aşağı doğru daralan üçgen
      var ust = (x + 0.48) * (x + 0.48) + (y + 0.4) * (y + 0.4) <= 0.3 || (x - 0.48) * (x - 0.48) + (y + 0.4) * (y + 0.4) <= 0.3;
      return ust || (y >= -0.4 && Math.abs(x) <= 1.02 * (1 - y) / 1.4);
    } },
    halka: { ad: 'Halka', f: function (x, y) { var r = x * x + y * y; return r <= 1.12 && r >= 0.16; } }
  };

  var BOLGELER = [
    { ad: 'Çayır', ikon: '🌾', bicimler: ['kare', 'arti', 'elmas', 'cerceve'], boy: [8, 8, 8, 9, 9, 9, 9, 10, 10, 10], yog: [0.12, 0.15] },
    { ad: 'Kanyon', ikon: '🏜️', bicimler: ['delik', 'ada', 'L', 'merdiven'], boy: [10, 10, 10, 11, 11, 11, 11, 12, 12, 12], yog: [0.15, 0.18] },
    { ad: 'Volkan', ikon: '🌋', bicimler: ['yildiz', 'labirent', 'kalp', 'halka'], boy: [12, 12, 12, 12, 12, 13, 13, 13, 13, 13], yog: [0.18, 0.2] }
  ];

  function maske(bicim, R, C) {
    var b = BICIMLER[bicim], a = [];
    for (var r = 0; r < R; r++) {
      for (var c = 0; c < C; c++) {
        a.push(b.izgara ? b.izgara(r, c, R, C) : b.f((c + 0.5) / C * 2 - 1, (r + 0.5) / R * 2 - 1));
      }
    }
    return a;
  }

  var BOLUMLER = [];
  BOLGELER.forEach(function (g, gi) {
    for (var k = 0; k < 10; k++) {
      var n = gi * 10 + k + 1, boy = g.boy[k], bicim = g.bicimler[k % 4];
      var aktif = maske(bicim, boy, boy), say = aktif.filter(Boolean).length;
      // Dar geçitli biçimlerde tahmin gerektirmeyen tahta bulmak zor; yoğunluk biraz düşürülür
      var yog = (g.yog[0] + (g.yog[1] - g.yog[0]) * k / 9) * (BICIMLER[bicim].yogKat || 1);
      var mayin = Math.round(say * yog);
      // Süre hedefi: açılacak kare başına ~0,6 sn, 5'e yuvarlanır
      var hedef = Math.max(30, Math.round((say - mayin) * 0.6 / 5) * 5);
      BOLUMLER.push({ n: n, bolge: gi, bicim: bicim, R: boy, C: boy, aktif: aktif, mayin: mayin, hedef: hedef });
    }
  });

  function komsular(R, C, aktif, i) {
    var r = Math.floor(i / C), c = i % C, out = [];
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        var nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < R && nc >= 0 && nc < C && aktif[nr * C + nc]) out.push(nr * C + nc);
      }
    }
    return out;
  }

  // Görünen tahtadan kesin sonuç çıkarır. gorunen[i]: null = kapalı kare (oynanmaz), -1 = açılmamış,
  // -2 = mayın olduğu bilinen (bayrak), 0-8 = açık sayı. toplamMayin verilirse sayaç kuralı da kullanılır.
  // Döner: { guvenli: [...], mayin: [...] } (yalnızca kesin olanlar).
  function cikar(R, C, aktif, gorunen, toplamMayin) {
    var guvenli = {}, mayin = {}, kis = [];
    for (var i = 0; i < gorunen.length; i++) {
      var g = gorunen[i];
      if (g === null || g === undefined || g < 0) continue;
      var bilin = [], m = g;
      komsular(R, C, aktif, i).forEach(function (n) {
        if (gorunen[n] === -1) bilin.push(n);
        else if (gorunen[n] === -2) m--;
      });
      if (!bilin.length) continue;
      if (m === 0) bilin.forEach(function (n) { guvenli[n] = true; });
      else if (m === bilin.length) bilin.forEach(function (n) { mayin[n] = true; });
      else kis.push({ h: bilin, m: m, s: {} });
    }
    // İki kısıt kuralı: A'nın B'de olmayan kareleri kadar fazla mayını varsa onlar mayın, B'nin fazlası güvenli
    kis.forEach(function (k) { k.h.forEach(function (n) { k.s[n] = true; }); });
    for (var a = 0; a < kis.length; a++) {
      for (var b = 0; b < kis.length; b++) {
        if (a === b) continue;
        var A = kis[a], B = kis[b], ortak = 0;
        var sadeceA = A.h.filter(function (n) { if (B.s[n]) { ortak++; return false; } return true; });
        if (!ortak) continue;
        var sadeceB = B.h.filter(function (n) { return !A.s[n]; });
        if (A.m - B.m === sadeceA.length) {
          sadeceA.forEach(function (n) { mayin[n] = true; });
          sadeceB.forEach(function (n) { guvenli[n] = true; });
        }
      }
    }
    if (toplamMayin !== undefined && !Object.keys(guvenli).length && !Object.keys(mayin).length) {
      var kalan = toplamMayin, acilmamis = [];
      gorunen.forEach(function (g, i) { if (g === -2) kalan--; else if (g === -1) acilmamis.push(i); });
      if (kalan === 0) acilmamis.forEach(function (n) { guvenli[n] = true; });
      else if (kalan === acilmamis.length) acilmamis.forEach(function (n) { mayin[n] = true; });
    }
    return {
      guvenli: Object.keys(guvenli).map(Number),
      mayin: Object.keys(mayin).map(Number).filter(function (n) { return !guvenli[n]; })
    };
  }

  function sayilar(R, C, aktif, mayinlar) {
    return mayinlar.map(function (m, i) {
      if (!aktif[i]) return 0;
      return komsular(R, C, aktif, i).filter(function (n) { return mayinlar[n]; }).length;
    });
  }

  // Bir kareyi açar; sıfırlar oyundaki gibi taşar. gorunen dizisini günceller, açılan kare sayısını döner.
  function ac(R, C, aktif, mayinlar, sayi, gorunen, i) {
    if (gorunen[i] !== -1) return 0;
    var kuyruk = [i], acilan = 0;
    gorunen[i] = sayi[i];
    while (kuyruk.length) {
      var cur = kuyruk.shift();
      acilan++;
      if (sayi[cur]) continue;
      komsular(R, C, aktif, cur).forEach(function (n) {
        if (gorunen[n] === -1 && !mayinlar[n]) { gorunen[n] = sayi[n]; kuyruk.push(n); }
      });
    }
    return acilan;
  }

  function bosGorunum(aktif) { return aktif.map(function (a) { return a ? -1 : null; }); }

  // İlk tıklamadan başlayıp yalnızca kesin çıkarımla tahtanın tamamı açılabiliyor mu?
  function cozulurMu(R, C, aktif, mayinlar, ilk, toplam) {
    var sayi = sayilar(R, C, aktif, mayinlar), gorunen = bosGorunum(aktif);
    var guvenliSay = aktif.filter(Boolean).length - toplam;
    var acik = ac(R, C, aktif, mayinlar, sayi, gorunen, ilk);
    for (var tur = 0; tur < 2000 && acik < guvenliSay; tur++) {
      var s = cikar(R, C, aktif, gorunen, toplam);
      if (!s.guvenli.length && !s.mayin.length) return false;
      s.mayin.forEach(function (n) { gorunen[n] = -2; });
      s.guvenli.forEach(function (n) { if (gorunen[n] === -1) acik += ac(R, C, aktif, mayinlar, sayi, gorunen, n); });
    }
    return acik >= guvenliSay;
  }

  // Tahmin gerektirmeyen tahta: ilk tıklanan kare ve komşuları boş; en fazla 200 deneme, olmazsa son deneme.
  function uret(B, ilk, rnd) {
    var R = B.R, C = B.C, aktif = B.aktif, yasak = {}, havuz = [];
    yasak[ilk] = true;
    komsular(R, C, aktif, ilk).forEach(function (n) { yasak[n] = true; });
    for (var i = 0; i < aktif.length; i++) if (aktif[i] && !yasak[i]) havuz.push(i);
    var adet = Math.min(B.mayin, havuz.length), mayinlar, deneme;
    for (deneme = 1; deneme <= 200; deneme++) {
      mayinlar = aktif.map(function () { return false; });
      for (var k = 0; k < adet; k++) {
        var j = k + Math.floor(rnd() * (havuz.length - k));
        var t = havuz[k]; havuz[k] = havuz[j]; havuz[j] = t;
        mayinlar[havuz[k]] = true;
      }
      if (cozulurMu(R, C, aktif, mayinlar, ilk, adet)) return { mayinlar: mayinlar, deneme: deneme, cozulur: true };
    }
    return { mayinlar: mayinlar, deneme: deneme - 1, cozulur: false };
  }

  // Yıldız: bitirmek 1, süre hedefinin altında +1, hiç yanlış bayrak koymadan +1
  function yildiz(B, sn, yanlisBayrak) {
    return 1 + (sn <= B.hedef ? 1 : 0) + (yanlisBayrak ? 0 : 1);
  }

  var TEMALAR = [
    { id: 'klasik', ad: 'Klasik', esik: 0, mayin: '💣', bayrak: '🚩' },
    { id: 'col', ad: 'Çöl', esik: 15, mayin: '🦂', bayrak: '🌵' },
    { id: 'deniz', ad: 'Deniz', esik: 35, mayin: '🐡', bayrak: '⚓' },
    { id: 'uzay', ad: 'Uzay', esik: 60, mayin: '☄️', bayrak: '🛸' }
  ];

  window.MayinMotor = {
    BICIMLER: BICIMLER, BOLGELER: BOLGELER, BOLUMLER: BOLUMLER, TEMALAR: TEMALAR,
    maske: maske, komsular: komsular, cikar: cikar, sayilar: sayilar, cozulurMu: cozulurMu, uret: uret, yildiz: yildiz
  };
})();

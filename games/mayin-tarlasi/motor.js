// Mayın Tarlası Sefer motoru: bölüm tablosu, tahta biçimleri (maskeler), tahmin gerektirmeyen tahta üretimi ve çözücü.
// DOM'a dokunmaz; game.js ve oynanış testi kullanır.
(function () {
  // Biçimler: (w, h, r, c) → kare oynanır mı. Kapalı kareler mayın içermez, sayılmaz, tıklanmaz.
  var BICIMLER = {
    kare: function () { return true; },
    arti: function (w, h, r, c) {
      var kr = Math.floor(h / 4), kc = Math.floor(w / 4);
      return !((r < kr || r >= h - kr) && (c < kc || c >= w - kc));
    },
    elmas: function (w, h, r, c) {
      var cr = (h - 1) / 2, cc = (w - 1) / 2;
      return Math.abs(r - cr) + Math.abs(c - cc) <= (w + h) / 4 + 1;
    },
    cerceve: function (w, h, r, c) {
      // Köşeleri kesik sekizgen
      var k = Math.floor(w / 4);
      return Math.min(r, h - 1 - r) + Math.min(c, w - 1 - c) >= k;
    },
    delik: function (w, h, r, c) {
      var d = Math.floor(w / 3);
      var r0 = Math.floor((h - d) / 2), c0 = Math.floor((w - d) / 2);
      return !(r >= r0 && r < r0 + d && c >= c0 && c < c0 + d);
    },
    adalar: function (w, h, r, c) {
      // Ortada iki satırlık köprüyle bağlı iki ada
      var c0 = Math.floor(w / 2) - 1;
      if (c !== c0 && c !== c0 + 1) return true;
      var r0 = Math.floor(h / 2) - 1;
      return r >= r0 - 1 && r <= r0 + 2;
    },
    L: function (w, h, r, c) {
      return !(r < Math.floor(h / 2) && c >= Math.ceil(w / 2));
    },
    merdiven: function (w, h, r, c) {
      // Üç karelik basamaklarla sol üstten sağ alta inen bant
      var s = Math.floor(r / 3) - Math.floor(c / 3);
      return s >= -1 && s <= 1;
    },
    yildiz: function (w, h, r, c) {
      var cr = (h - 1) / 2, cc = (w - 1) / 2, dr = Math.abs(r - cr), dc = Math.abs(c - cc);
      return dr + dc <= (w + h) / 4 || dr <= h / 7 + .5 || dc <= w / 7 + .5;
    },
    labirent: function (w, h, r, c) {
      // Üç satırlık koridorlar; aralarındaki duvarın bir ucunda geçit var
      if (r % 4 !== 3 || r > h - 4) return true;
      var k = Math.floor(r / 4);
      return k % 2 ? c < 5 : c >= w - 5;
    },
    kalp: function (w, h, r, c) {
      var x = (c - (w - 1) / 2) / (w / 2.2), y = ((h - 1) / 2 - r) / (h / 2.2) + .15;
      var t = x * x + y * y - 1;
      return t * t * t - x * x * y * y * y <= 0;
    },
    halka: function (w, h, r, c) {
      var cr = (h - 1) / 2, cc = (w - 1) / 2, d = Math.sqrt((r - cr) * (r - cr) + (c - cc) * (c - cc));
      return d <= w / 2 + .3 && d >= w / 5;
    }
  };

  var DUNYALAR = [
    { ad: 'Çayır', ikon: '🌿', alt: 'bölüm 1-10' },
    { ad: 'Kanyon', ikon: '🏜️', alt: 'bölüm 11-20' },
    { ad: 'Volkan', ikon: '🌋', alt: 'bölüm 21-30' }
  ];

  // [boyut, yoğunluk, biçim] — her bölge dört biçimi dolaşır
  var TABLO = [
    [8, .12, 'kare'], [8, .12, 'arti'], [9, .12, 'elmas'], [9, .13, 'cerceve'], [9, .13, 'kare'],
    [9, .14, 'arti'], [10, .14, 'elmas'], [10, .14, 'cerceve'], [10, .15, 'arti'], [10, .15, 'kare'],
    [10, .15, 'delik'], [10, .15, 'adalar'], [11, .16, 'L'], [11, .16, 'merdiven'], [11, .16, 'delik'],
    [11, .17, 'adalar'], [12, .17, 'L'], [12, .17, 'merdiven'], [12, .18, 'delik'], [12, .18, 'adalar'],
    [12, .18, 'yildiz'], [12, .16, 'labirent'], [12, .19, 'kalp'], [12, .19, 'halka'], [13, .19, 'yildiz'],
    [13, .16, 'labirent'], [13, .2, 'kalp'], [13, .2, 'halka'], [13, .2, 'yildiz'], [13, .2, 'kare']
  ];

  var BOLUMLER = TABLO.map(function (t, i) {
    var w = t[0], h = t[0], f = BICIMLER[t[2]], maske = [], oyn = 0;
    for (var r = 0; r < h; r++) for (var c = 0; c < w; c++) { var ok = !!f(w, h, r, c); maske.push(ok); if (ok) oyn++; }
    var mayin = Math.round(oyn * t[1]);
    // Süre hedefi: güvenli kare sayısıyla büyür, 5'in katına yuvarlanır
    var hedef = Math.round(((oyn - mayin) * .55 + 10) / 5) * 5;
    return { n: i + 1, dunya: Math.floor(i / 10), w: w, h: h, bicim: t[2], maske: maske, oynanir: oyn, mayin: mayin, hedef: hedef };
  });

  var TEMALAR = [
    { id: 'klasik', ad: 'Klasik', esik: 0, mayin: '💣', bayrak: '🚩' },
    { id: 'col', ad: 'Çöl', esik: 15, mayin: '🦂', bayrak: '🌵' },
    { id: 'deniz', ad: 'Deniz', esik: 35, mayin: '🐡', bayrak: '⚓' },
    { id: 'uzay', ad: 'Uzay', esik: 60, mayin: '☄️', bayrak: '🛸' }
  ];

  function komsular(w, h, maske, i) {
    var r = Math.floor(i / w), c = i % w, out = [];
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        var nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < h && nc >= 0 && nc < w && maske[nr * w + nc]) out.push(nr * w + nc);
      }
    }
    return out;
  }

  function komsuTablosu(B) {
    var t = [];
    for (var i = 0; i < B.w * B.h; i++) t.push(B.maske[i] ? komsular(B.w, B.h, B.maske, i) : []);
    return t;
  }

  // Tahmin yapmadan çözer: tek sayı kuralları, alt küme kuralı ve kalan mayın sayısı.
  // mayinlar: kare → true. Tahta sonuna kadar açılırsa true döner.
  function coz(B, mayinlar, ilk, kt) {
    kt = kt || komsuTablosu(B);
    var n = B.w * B.h, acik = [], isaret = [], sayi = [], guvenliKalan = B.oynanir - B.mayin, mayinKalan = B.mayin;
    for (var i = 0; i < n; i++) {
      acik.push(false); isaret.push(false);
      var s = 0;
      for (var k = 0; k < kt[i].length; k++) if (mayinlar[kt[i][k]]) s++;
      sayi.push(s);
    }
    function ac(i) {
      if (acik[i] || isaret[i]) return;
      if (mayinlar[i]) throw new Error('çözücü mayına bastı');
      var q = [i]; acik[i] = true;
      while (q.length) {
        var cur = q.pop(); guvenliKalan--;
        if (sayi[cur]) continue;
        kt[cur].forEach(function (m) { if (!acik[m] && !isaret[m]) { acik[m] = true; q.push(m); } });
      }
    }
    function isaretle(i) { if (!isaret[i]) { isaret[i] = true; mayinKalan--; } }
    ac(ilk);
    var degisti = true;
    while (degisti && guvenliKalan > 0) {
      degisti = false;
      // Sınırdaki her sayı için kapalı komşular ve gereken mayın
      var kisit = [];
      for (var j = 0; j < n; j++) {
        if (!acik[j] || !sayi[j]) continue;
        var u = [], f = 0;
        kt[j].forEach(function (m) { if (isaret[m]) f++; else if (!acik[m]) u.push(m); });
        if (!u.length) continue;
        var gerek = sayi[j] - f;
        if (gerek === 0) { u.forEach(ac); degisti = true; }
        else if (gerek === u.length) { u.forEach(isaretle); degisti = true; }
        else kisit.push({ u: u, g: gerek });
      }
      if (degisti) continue;
      // Alt küme kuralı
      for (var a = 0; a < kisit.length && !degisti; a++) {
        for (var b = 0; b < kisit.length && !degisti; b++) {
          if (a === b) continue;
          var A = kisit[a], Bk = kisit[b];
          if (A.u.length >= Bk.u.length) continue;
          if (!A.u.every(function (x) { return Bk.u.indexOf(x) >= 0; })) continue;
          var fark = Bk.u.filter(function (x) { return A.u.indexOf(x) < 0; }), g = Bk.g - A.g;
          if (g === 0) { fark.forEach(ac); degisti = true; }
          else if (g === fark.length) { fark.forEach(isaretle); degisti = true; }
        }
      }
      if (degisti) continue;
      // Kalan mayın sayısı: hiç kalmadıysa her şey güvenli, kapalı kare kadar kaldıysa hepsi mayın
      var kapali = [];
      for (var z = 0; z < n; z++) if (B.maske[z] && !acik[z] && !isaret[z]) kapali.push(z);
      if (mayinKalan === 0) { kapali.forEach(ac); degisti = true; }
      else if (mayinKalan === kapali.length) { kapali.forEach(isaretle); degisti = true; }
    }
    return guvenliKalan === 0;
  }

  // İlk tıklamadan sonra çözücünün tahmin yapmadan bitirebildiği bir tahta üretir.
  // Döner: { mayinlar, deneme, cozulur }. En fazla 200 deneme; olmazsa son deneme kullanılır.
  function uret(B, ilk, rnd) {
    var kt = komsuTablosu(B), yasak = {};
    yasak[ilk] = true;
    kt[ilk].forEach(function (m) { yasak[m] = true; });
    var havuz = [];
    for (var i = 0; i < B.w * B.h; i++) if (B.maske[i] && !yasak[i]) havuz.push(i);
    var adet = Math.min(B.mayin, havuz.length), mayinlar, deneme = 0, cozulur = false;
    while (deneme < 200 && !cozulur) {
      deneme++;
      mayinlar = {};
      for (var k = 0; k < adet; k++) {
        var j = k + Math.floor(rnd() * (havuz.length - k));
        var t = havuz[k]; havuz[k] = havuz[j]; havuz[j] = t;
        mayinlar[havuz[k]] = true;
      }
      cozulur = coz(B, mayinlar, ilk, kt);
    }
    return { mayinlar: mayinlar, deneme: deneme, cozulur: cozulur };
  }

  // Yıldız: bitirmek 1, süre hedefi +1, hiç yanlış bayrak koymamak +1
  function yildiz(B, sn, yanlisBayrak) { return 1 + (sn <= B.hedef ? 1 : 0) + (yanlisBayrak ? 0 : 1); }

  var M = { BOLUMLER: BOLUMLER, DUNYALAR: DUNYALAR, TEMALAR: TEMALAR, BICIMLER: BICIMLER, komsular: komsular, coz: coz, uret: uret, yildiz: yildiz };
  if (typeof module !== 'undefined' && module.exports) module.exports = M;
  else window.MayinMotor = M;
})();

// Top Sıralama motoru: bölüm ayarları, tohumlu bölüm üretici (çözülmüş durumdan ters hamlelerle karıştırma,
// böylece her bölüm çözülebilir) ve hedef hamle için küçük bir çözücü. Hem oyun hem oynanış testi kullanır.
(function () {
  var KAP = 4;
  var DUNYALAR = [
    { ad: 'Bahçe', ikon: '🌱', renk: [3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5], bos: 2, kisa: 0 },
    { ad: 'Deniz', ikon: '🌊', renk: [6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7], bos: 2, kisa: 0, gizli: true },
    { ad: 'Dağ', ikon: '🏔️', renk: [8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9], bos: 1, kisa: 2 },
    { ad: 'Şehir', ikon: '🏙️', renk: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10], bos: 1, kisa: 0, kilit: true },
    { ad: 'Uzay', ikon: '🌌', renk: [11, 11, 11, 11, 11, 11, 12, 12, 12, 12, 12, 12], bos: 1, kisa: 0, gizli: true, kilit: true }
  ];

  // Bölüm ayarı: no 1-60
  function ayar(no) {
    var w = Math.floor((no - 1) / 12), i = (no - 1) % 12, d = DUNYALAR[w];
    return { no: no, dunya: w, renk: d.renk[i], bos: d.bos, kisa: d.kisa, gizli: !!d.gizli, kilit: !!d.kilit, usta: i === 11 };
  }

  function tamam(t) {
    if (t.b.length !== KAP) return false;
    for (var i = 1; i < KAP; i++) if (t.b[i] !== t.b[0]) return false;
    return true;
  }
  function kazandi(tuplar) {
    for (var i = 0; i < tuplar.length; i++) if (tuplar[i].b.length && !tamam(tuplar[i])) return false;
    return true;
  }
  // Üstteki aynı renk grubun boyu
  function grup(t) {
    var n = t.b.length;
    if (!n) return 0;
    var c = t.b[n - 1], g = 1;
    while (g < n && t.b[n - 1 - g] === c) g++;
    return g;
  }
  // a'dan b'ye taşınacak top sayısı (0 = geçersiz). kilitli: kilidi açılmamış tüp dizini (-1 yok)
  function tasinir(tuplar, a, b, kilitli) {
    if (a === b || a === kilitli || b === kilitli) return 0;
    var A = tuplar[a], B = tuplar[b];
    if (!A.b.length || B.b.length >= B.k) return 0;
    var c = A.b[A.b.length - 1];
    if (B.b.length && B.b[B.b.length - 1] !== c) return 0;
    return Math.min(grup(A), B.k - B.b.length);
  }
  function tasi(tuplar, a, b, n) {
    for (var i = 0; i < n; i++) tuplar[b].b.push(tuplar[a].b.pop());
  }
  function kopya(tuplar) { return tuplar.map(function (t) { return { k: t.k, b: t.b.slice() }; }); }
  function renkTamam(tuplar, c) {
    for (var i = 0; i < tuplar.length; i++) if (tamam(tuplar[i]) && tuplar[i].b[0] === c) return true;
    return false;
  }

  function karisiklik(tuplar) {
    var p = 0;
    tuplar.forEach(function (t) {
      for (var i = 1; i < t.b.length; i++) if (t.b[i] === t.b[i - 1]) p++;
      if (tamam(t)) p += 10;
    });
    return p;
  }

  // Bölüm üret. o: { renk, bos, kisa, kilit } ; rnd: tohumlu üreteç. Toplar karıştırılıp tüplere dağıtılır,
  // çözücü çözemezse (veya dizilim fazla kolaysa) aynı üreteçle yeniden dağıtılır; böylece her bölüm çözülebilir.
  function uret(o, rnd) {
    var yedek = null;
    for (var deneme = 0; deneme < 40; deneme++) {
      var toplar = [], c, i;
      for (c = 0; c < o.renk; c++) toplar.push(c, c, c, c);
      for (i = toplar.length - 1; i > 0; i--) {
        var j = Math.floor(rnd() * (i + 1)), x = toplar[i];
        toplar[i] = toplar[j]; toplar[j] = x;
      }
      var tuplar = [], kilit = -1, kilitRenk = -1;
      for (c = 0; c < o.renk + o.bos; c++) tuplar.push({ k: KAP, b: [] });
      for (c = 0; c < o.kisa; c++) tuplar.push({ k: KAP - 1, b: [] });
      if (o.kilit) { kilit = tuplar.length; tuplar.push({ k: KAP, b: toplar.splice(0, KAP) }); }
      for (i = 0; toplar.length; i++) tuplar[i].b = toplar.splice(0, KAP);
      if (o.kilit) {
        // Kilidi açan renk: kilitli tüpte olmayan bir renk
        var adaylar = [];
        for (c = 0; c < o.renk; c++) if (tuplar[kilit].b.indexOf(c) === -1) adaylar.push(c);
        kilitRenk = adaylar[Math.floor(rnd() * adaylar.length)];
      }
      if (karisiklik(tuplar) > Math.ceil(o.renk / 3)) continue;
      var yol = coz(tuplar, kilit, kilitRenk, o.sinir || 25000);
      if (yol) return { tuplar: tuplar, kilit: kilit, kilitRenk: kilitRenk, cozum: yol };
      if (!yedek) yedek = { tuplar: tuplar, kilit: kilit, kilitRenk: kilitRenk };
    }
    // Çok nadir: hiçbir dağıtım çözülemedi, en kolay ayara düş
    return uret({ renk: o.renk, bos: o.bos + 1, kisa: o.kisa, kilit: false }, rnd);
  }

  // Derinlik öncelikli çözücü (sınırlı düğüm). Hamle listesi [a, b] veya null döner.
  function coz(tuplar, kilit, kilitRenk, sinir) {
    sinir = sinir || 60000;
    var gorulen = {}, dugum = 0, yol = [];
    function anahtar(T, acik) {
      return (acik ? '1' : '0') + T.map(function (t, i) { return (i === kilit ? 'L' : t.k) + t.b.join(','); }).join('|');
    }
    function hamleler(T, acik) {
      var list = [], kil = acik ? -1 : kilit;
      for (var a = 0; a < T.length; a++) {
        var A = T[a];
        if (!A.b.length || tamam(A) || a === kil) continue;
        var g = grup(A), tekRenk = g === A.b.length, bosGordum = {};
        for (var b = 0; b < T.length; b++) {
          var n = tasinir(T, a, b, kil);
          if (!n) continue;
          var B = T[b];
          if (!B.b.length) {
            if (tekRenk) continue;
            if (bosGordum[B.k]) continue;
            bosGordum[B.k] = true;
          }
          // Öncelik: tüp tamamlayan, grubu bütün taşıyan, boş olmayana koyan
          var p = 0;
          if (B.b.length + n === KAP && B.b.length && B.k === KAP && B.b.every(function (x) { return x === A.b[A.b.length - 1]; })) p += 10;
          if (n === g) p += 4;
          if (B.b.length) p += 3;
          if (g === A.b.length - 0 && n === g) p += 1;
          list.push([a, b, n, p]);
        }
      }
      list.sort(function (x, y) { return y[3] - x[3]; });
      return list;
    }
    function ara(T, acik) {
      if (kazandi(T)) return true;
      if (++dugum > sinir) return false;
      var k = anahtar(T, acik);
      if (gorulen[k]) return false;
      gorulen[k] = true;
      var list = hamleler(T, acik);
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        tasi(T, m[0], m[1], m[2]);
        var yeniAcik = acik || (kilit >= 0 && renkTamam(T, kilitRenk));
        yol.push([m[0], m[1]]);
        if (ara(T, yeniAcik)) return true;
        yol.pop();
        tasi(T, m[1], m[0], m[2]);
        if (dugum > sinir) return false;
      }
      return false;
    }
    var T = kopya(tuplar);
    return ara(T, kilit < 0) ? yol : null;
  }

  var api = { KAP: KAP, DUNYALAR: DUNYALAR, ayar: ayar, uret: uret, coz: coz, tasinir: tasinir, tasi: tasi, grup: grup, tamam: tamam, kazandi: kazandi, kopya: kopya, renkTamam: renkTamam };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.TopSiralamaMotor = api;
})();

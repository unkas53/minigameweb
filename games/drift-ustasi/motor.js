// Drift Ustası motoru: pist üretici (parça dizisi → örneklenmiş orta çizgi), 40 bölümün ayarı, günlük pist,
// araba modeli (sabit 1/120 sn adımlarla, kare hızından bağımsız), yoldan çıkma ve engeller, puan/yıldız
// kuralları ve pisti takip eden basit bir otomatik sürücü (bölüm dengesini ölçmek ve oynanış testinde
// bölüm bitirmek için). Hem oyun hem oynanış testi kullanır.
(function () {
  var ADIM = 4;          // orta çizgi örnek aralığı (px)
  var DT = 1 / 120;      // fizik adımı (sn)
  var DUNYA_SAYI = 4, BOLUM_SAYI = 40;
  var DUZELME = 0.7;     // bırakınca yön toparlama hızı (rad/sn)

  var DUNYALAR = [
    { id: 'orman', ad: 'Orman Yolu', ikon: '🌳', zemin: '#4ade80', koyu: '#166534', esik: 0, kurtarma: true },
    { id: 'col', ad: 'Çöl Kanyonu', ikon: '🏜️', zemin: '#fcd34d', koyu: '#b45309', esik: 15, kurtarma: true },
    { id: 'kar', ad: 'Karlı Dağ', ikon: '🏔️', zemin: '#e0f2fe', koyu: '#7dd3fc', esik: 40, kurtarma: false },
    { id: 'gece', ad: 'Gece Şehri', ikon: '🌃', zemin: '#1e1b4b', koyu: '#6366f1', esik: 70, kurtarma: false }
  ];

  // Arabalar: v hız (px/sn), tutus kayma toparlama (1/sn), donus dönüş hızı (rad/sn)
  var ARABALAR = [
    { id: 'serce', ad: 'Serçe', ikon: '🚗', renk: '#ef4444', v: 210, tutus: 5.5, donus: 3.2, acilis: 'Başlangıç arabası, dengeli' },
    { id: 'kaya', ad: 'Kaya', ikon: '🚙', renk: '#65a30d', v: 196, tutus: 7.5, donus: 3.2, yildiz: 15, acilis: '15 ⭐ ile açılır, tutuşu yüksek' },
    { id: 'simsek', ad: 'Şimşek', ikon: '🏎️', renk: '#facc15', v: 238, tutus: 5.0, donus: 3.4, yildiz: 40, acilis: '40 ⭐ ile açılır, hızlı ama kaygan' },
    { id: 'taksi', ad: 'Taksi', ikon: '🚕', renk: '#f59e0b', v: 210, tutus: 5.5, donus: 3.7, altin: 600, acilis: '600 🪙, keskin döner' },
    { id: 'gecekusu', ad: 'Gece Kuşu', ikon: '🚓', renk: '#3b82f6', v: 240, tutus: 7.2, donus: 3.8, bolum: 40, acilis: 'Gece Şehri\'ni bitirince açılır' }
  ];
  var YUKSELTMELER = [
    { id: 'motor', ikon: '🔧', ad: 'Motor', aciklama: 'En yüksek hız +%4', oran: 0.04, alan: 'v' },
    { id: 'lastik', ikon: '🛞', ad: 'Lastik', aciklama: 'Tutuş +%6', oran: 0.06, alan: 'tutus' },
    { id: 'direksiyon', ikon: '🎯', ad: 'Direksiyon', aciklama: 'Dönüş hızı +%4', oran: 0.04, alan: 'donus' }
  ];
  var BEDEL = [50, 120, 250, 450, 800];

  // mulberry32
  function tohum(s) {
    var h = 1779033703 ^ s.length;
    for (var i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
    var a = h >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function aralik(rnd, a, b) { return a + Math.round(rnd() * (b - a)); }
  function sec(rnd, l) { return l[Math.floor(rnd() * l.length)]; }

  // Pist parçası dizisi üretir: "D200 V45 D120 V-60 ...". Toplam yön ±90° içinde kalır, pist yukarı ilerler
  // ve kendi üstüne kapanmaz.
  function parcaUret(rnd, o) {
    var p = ['D' + 200], yon = 0;
    for (var i = 0; i < o.viraj; i++) {
      var aci = sec(rnd, o.acilar), isaret;
      if (Math.abs(yon + aci) > 90 && Math.abs(yon - aci) > 90) aci = 45;
      if (yon + aci > 90) isaret = -1;
      else if (yon - aci < -90) isaret = 1;
      else isaret = yon === 0 ? (rnd() < 0.5 ? 1 : -1) : (rnd() < 0.7 ? -Math.sign(yon) : Math.sign(yon));
      yon += isaret * aci;
      p.push('V' + isaret * aci);
      p.push('D' + (i === o.viraj - 1 ? 180 : aralik(rnd, o.duz[0], o.duz[1])));
    }
    return p.join(' ');
  }

  function ayar(n) {
    var w = Math.floor((n - 1) / 10), i = (n - 1) % 10;
    var rnd = tohum('drift-bolum-' + n);
    var o = {
      no: n, dunya: w,
      R: [135, 112, 104, 96][w] - i * 1.6,
      gen: [112, 100, 96, 90][w] - i * 1.2,
      hiz: 1 + w * 0.05 + i * 0.005,
      viraj: (n === 1 ? 8 : 12 + Math.floor(i * 1.2) + w * 2),
      acilar: [[30, 45, 60], [45, 60, 75, 90], [45, 60, 90], [60, 75, 90]][w],
      duz: [[180, 300], [150, 260], [140, 240], [130, 220]][w].map(function (x) { return x - i * 4; }),
      yag: w === 1 ? 2 + Math.floor(i / 2) : w === 3 ? 2 + Math.floor(i / 3) : 0,
      bariyer: w === 1 ? 1 + Math.floor(i / 2) : w >= 2 ? 2 + Math.floor(i / 3) : 0,
      buz: w === 2 ? 3 + Math.floor(i / 2) : 0,
      kopru: w === 2 ? 1 + Math.floor(i / 3) : w === 3 ? 1 + Math.floor(i / 4) : 0,
      kapi: w === 3 ? 2 + Math.floor(i / 2) : 0,
      kurtarma: DUNYALAR[w].kurtarma
    };
    o.parcalar = parcaUret(rnd, o);
    o.rnd = rnd;
    return o;
  }

  function gunlukAyar(rnd) {
    var o = {
      no: 0, dunya: 1, gunluk: true, R: 110, gen: 98, hiz: 1.05,
      viraj: 10 + Math.floor(rnd() * 5), acilar: [45, 60, 75, 90], duz: [150, 250],
      yag: 2, bariyer: 1, buz: 0, kopru: 1, kapi: 0, kurtarma: false
    };
    o.parcalar = parcaUret(rnd, o);
    o.rnd = rnd;
    return o;
  }

  // Parça dizisinden pist: örneklenmiş orta çizgi ve engeller
  function pist(o) {
    var rnd = o.rnd || tohum('drift-pist-' + o.no);
    var parcalar = o.parcalar.split(' ').map(function (s) { return { tip: s[0], d: Number(s.slice(1)) }; });
    var noktalar = [], x = 0, y = 0, h = -Math.PI / 2;
    // Her parçaya dar köprü / buz atanır (ilk ve son düzlük hariç)
    var duzler = [], virajlar = [];
    parcalar.forEach(function (p, i) { if (i > 0 && i < parcalar.length - 1) (p.tip === 'D' ? duzler : virajlar).push(i); });
    function karistir(l) { l = l.slice(); for (var i = l.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = l[i]; l[i] = l[j]; l[j] = t; } return l; }
    karistir(duzler).slice(0, o.kopru).forEach(function (i) { parcalar[i].kopru = true; });
    karistir(parcalar.map(function (p, i) { return i; }).filter(function (i) { return i > 0 && i < parcalar.length - 1; })).slice(0, o.buz).forEach(function (i) { parcalar[i].buz = true; });
    parcalar.forEach(function (p, pi) {
      var uz = p.tip === 'D' ? p.d : o.R * Math.abs(p.d) * Math.PI / 180;
      var adet = Math.max(1, Math.round(uz / ADIM)), s = p.tip === 'V' ? Math.sign(p.d) : 0;
      p.bas = noktalar.length;
      for (var k = 0; k < adet; k++) {
        if (s) h -= s * (uz / adet) / o.R;
        x += Math.cos(h) * uz / adet;
        y += Math.sin(h) * uz / adet;
        var kopru = p.kopru && k > adet * 0.45 && k < adet * 0.9;
        noktalar.push({ x: x, y: y, h: h, p: pi, s: s, w: kopru ? o.gen * 0.74 : o.gen, buz: !!p.buz, kopru: kopru, ic: k / adet });
      }
      p.son = noktalar.length - 1;
    });
    // Düzlüklerde basınca dönülecek yön: sıradaki virajın yönü (yoksa öncekininki)
    var sonraki = 1;
    for (var i = noktalar.length - 1; i >= 0; i--) { if (noktalar[i].s) sonraki = noktalar[i].s; noktalar[i].yon = noktalar[i].s || sonraki; }
    // Kopru giriş ve çıkışında genişlik yumuşak değişir
    for (i = 1; i < noktalar.length; i++) {
      var a = noktalar[i - 1], b = noktalar[i];
      if (b.w < a.w - 3) b.w = a.w - 3;
    }
    for (i = noktalar.length - 2; i >= 0; i--) {
      if (noktalar[i].w < noktalar[i + 1].w - 3) noktalar[i].w = noktalar[i + 1].w - 3;
    }
    var N = noktalar.length;
    // Engeller ve altınlar: ilk 50 ve son 30 örnekte yok
    var engeller = [];
    function bos(i, ara) { return engeller.every(function (e) { return Math.abs(e.i - i) > ara; }); }
    function yer(i, lat) { var q = noktalar[i]; return { x: q.x + Math.sin(q.h) * lat, y: q.y - Math.cos(q.h) * lat }; }
    function ekle(tip, i, lat, ek) {
      var e = yer(i, lat); e.tip = tip; e.i = i; e.lat = lat;
      for (var k in ek) e[k] = ek[k];
      engeller.push(e);
    }
    function rastNokta(kosul, ara) {
      for (var d = 0; d < 60; d++) {
        var i = 60 + Math.floor(rnd() * (N - 110));
        if (kosul(noktalar[i]) && bos(i, ara)) return i;
      }
      return -1;
    }
    var k;
    for (k = 0; k < o.bariyer; k++) {
      var bi = rastNokta(function (q) { return !q.s && !q.kopru && q.ic > 0.4 && q.ic < 0.85; }, 30);
      if (bi >= 0) ekle('bariyer', bi, (rnd() < 0.5 ? 1 : -1) * (o.gen / 2 - 12));
    }
    for (k = 0; k < o.yag; k++) {
      var yi = rastNokta(function (q) { return !q.s && q.ic > 0.3 && !parcalar[q.p].kopru; }, 14);
      if (yi >= 0) ekle('yag', yi, (rnd() - 0.5) * o.gen * 0.4);
    }
    for (k = 0; k < o.kapi; k++) {
      var ki = rastNokta(function (q) { return !q.s && q.ic > 0.3 && q.ic < 0.8; }, 25);
      if (ki >= 0) ekle('kapi', ki, 0, { faz: rnd() * 2 });
    }
    // Altınlar: her parçada üçlü dizi (virajda iç tarafta)
    parcalar.forEach(function (p, pi) {
      if (pi === 0 || pi === parcalar.length - 1) return;
      var orta = Math.round((p.bas + p.son) / 2), lat = p.tip === 'V' ? Math.sign(p.d) * o.gen * 0.12 : (rnd() - 0.5) * o.gen * 0.3;
      for (var j = -1; j <= 1; j++) {
        var ai = orta + j * 6;
        if (ai > 50 && ai < N - 30 && bos(ai, 4)) ekle('altin', ai, lat);
      }
    });
    var uzunluk = N * ADIM;
    return {
      ayar: o, noktalar: noktalar, engeller: engeller, uzunluk: uzunluk, parcalar: o.parcalar,
      altinSayi: engeller.filter(function (e) { return e.tip === 'altin'; }).length,
      // Hedef süre: pist uzunluğu, en yüksek hızın %88'iyle
      hedef: Math.ceil(uzunluk / (ARABALAR[0].v * o.hiz * 0.88) + 1)
    };
  }

  function arabaDeger(arabaId, yuk) {
    var a = ARABALAR.filter(function (x) { return x.id === arabaId; })[0] || ARABALAR[0], d = { v: a.v, tutus: a.tutus, donus: a.donus };
    yuk = yuk || {};
    YUKSELTMELER.forEach(function (u) { d[u.alan] *= 1 + u.oran * (Number(yuk[u.id]) || 0); });
    return d;
  }

  function aciFark(a, b) { var d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }

  function yeni(P, araba) {
    var q = P.noktalar[0];
    return {
      P: P, araba: araba, x: q.x, y: q.y, a: q.h, k: q.h, v: 0, i: 0, t: 0, lat: 0, yon: q.yon,
      basili: false, driftT: 0, driftPuan: 0, kilpayi: 0, kilpayiCd: 0, altin: 0, alinan: {},
      yagT: 0, hizT: 0, kurtarma: P.ayar.kurtarma ? 1 : 0, kurtarmaKullandi: false, dokunulmaz: 0,
      bitti: false, kaybetti: false, olaylar: [], gecilenKapi: {}, iz: 0, toplamDrift: 0
    };
  }

  function enYakin(st) {
    var N = st.P.noktalar, en = st.i, ed = Infinity;
    for (var j = Math.max(0, st.i - 12); j < Math.min(N.length, st.i + 40); j++) {
      var dx = N[j].x - st.x, dy = N[j].y - st.y, d = dx * dx + dy * dy;
      if (d < ed) { ed = d; en = j; }
    }
    return en;
  }

  function kaza(st, neden) {
    if (st.dokunulmaz > 0) return;
    if (st.kurtarma > 0) {
      st.kurtarma--;
      st.kurtarmaKullandi = true;
      var j = Math.max(0, st.i - 15), q = st.P.noktalar[j];
      st.x = q.x; st.y = q.y; st.a = st.k = q.h; st.i = j; st.v *= 0.6; st.dokunulmaz = 1; st.driftT = 0;
      st.olaylar.push({ tip: 'kurtarma', neden: neden });
      return;
    }
    st.bitti = true; st.kaybetti = true;
    st.olaylar.push({ tip: 'kaza', neden: neden });
  }

  function tekAdim(st, basili) {
    var P = st.P, N = P.noktalar, d = st.araba, o = P.ayar;
    var q = N[st.i];
    st.yon = q.yon;
    var tutus = d.tutus * (q.buz ? 0.45 : 1) * (st.yagT > 0 ? 0.6 : 1);
    var vmax = d.v * o.hiz * (st.hizT > 0 ? 1.22 : 1);
    if (basili) {
      st.a -= q.yon * d.donus * DT;
      st.driftT += DT;
      var carpan = st.driftT >= 2 ? 3 : st.driftT >= 1 ? 2 : 1;
      st.driftPuan += 50 * carpan * DT;
      st.toplamDrift += DT;
    } else {
      // Bırakınca araba düzelir: küçük yön hataları 70 px önündeki yol ortasına doğru yavaşça toparlanır
      st.driftT = 0;
      var on = N[Math.min(N.length - 1, st.i + 18)];
      var hata = aciFark(Math.atan2(on.y - st.y, on.x - st.x), st.a);
      if (Math.abs(hata) < 0.5) st.a += Math.max(-DUZELME * DT, Math.min(DUZELME * DT, hata));
    }
    st.k += aciFark(st.a, st.k) * Math.min(1, tutus * DT);
    var hedefV = basili ? vmax * 0.92 : vmax;
    st.v += Math.max(-300 * DT, Math.min(150 * DT, hedefV - st.v));
    st.x += Math.cos(st.k) * st.v * DT;
    st.y += Math.sin(st.k) * st.v * DT;
    st.t += DT;
    st.yagT = Math.max(0, st.yagT - DT);
    st.hizT = Math.max(0, st.hizT - DT);
    st.dokunulmaz = Math.max(0, st.dokunulmaz - DT);
    st.kilpayiCd = Math.max(0, st.kilpayiCd - DT);
    st.i = enYakin(st);
    q = N[st.i];
    st.lat = (st.x - q.x) * Math.sin(q.h) - (st.y - q.y) * Math.cos(q.h);
    if (st.i >= N.length - 2) {
      st.bitti = true;
      st.olaylar.push({ tip: 'bitis' });
      return;
    }
    if (Math.abs(st.lat) > q.w / 2) return kaza(st, 'yol');
    if (basili && Math.abs(st.lat) > q.w / 2 - 6 && st.kilpayiCd <= 0 && st.dokunulmaz <= 0) {
      st.kilpayi++; st.kilpayiCd = 1.5;
      st.olaylar.push({ tip: 'kilpayi' });
    }
    for (var e = 0; e < P.engeller.length; e++) {
      var g = P.engeller[e];
      if (Math.abs(g.i - st.i) > 12) continue;
      var dx = g.x - st.x, dy = g.y - st.y, r2 = dx * dx + dy * dy;
      if (g.tip === 'altin' && !st.alinan[e] && r2 < 18 * 18) { st.alinan[e] = true; st.altin++; st.olaylar.push({ tip: 'altin' }); }
      else if (g.tip === 'yag' && r2 < 17 * 17) { if (st.yagT <= 0) st.olaylar.push({ tip: 'yag' }); st.yagT = 1; }
      else if (g.tip === 'bariyer' && r2 < 15 * 15) return kaza(st, 'bariyer');
      else if (g.tip === 'kapi' && !st.gecilenKapi[e] && st.i >= g.i) {
        st.gecilenKapi[e] = true;
        if (kapiAcik(g, st.t)) { st.hizT = 1.5; st.olaylar.push({ tip: 'hiz' }); }
        else { st.v *= 0.7; st.olaylar.push({ tip: 'kapali' }); }
      }
    }
  }
  function kapiAcik(g, t) { return (t + g.faz) % 2 < 1.2; }

  // dt kadar ilerletir (sabit adımlarla); st.birikim kalan zamanı tutar
  function ilerlet(st, basili, dt) {
    st.birikim = (st.birikim || 0) + dt;
    while (st.birikim >= DT && !st.bitti) { st.birikim -= DT; tekAdim(st, basili); }
  }

  // Otomatik sürücü: önündeki orta çizgi noktasına (bariyerden kaçarak) bakar, bölümün yönüne dönmesi
  // gerekiyorsa basar.
  function bot(st, ek) {
    ek = ek || {};
    var N = st.P.noktalar, ileri = Math.round((ek.bakis || 70 + st.v * 0.12) / ADIM);
    var j = Math.min(N.length - 1, st.i + ileri), q = N[j], kay = ek.kayma || 0;
    st.P.engeller.forEach(function (g) {
      if (g.tip === 'bariyer' && g.i > st.i - 4 && g.i < st.i + 45) kay = -Math.sign(g.lat) * q.w * 0.22;
    });
    var tx = q.x + Math.sin(q.h) * kay, ty = q.y - Math.cos(q.h) * kay;
    var istek = Math.atan2(ty - st.y, tx - st.x);
    return -N[st.i].yon * aciFark(istek, st.a) > (ek.esik || 0.02);
  }

  function puan(st) {
    return Math.round(st.driftPuan) + st.kilpayi * 100 + st.altin * 20 + Math.max(0, Math.round((st.P.hedef - st.t) * 30));
  }
  function yildiz(st) {
    if (!st.bitti || st.kaybetti) return 0;
    if (st.t > st.P.hedef) return 1;
    if (st.altin >= Math.ceil(st.P.altinSayi * 0.8) && !st.kurtarmaKullandi) return 3;
    return 2;
  }

  var M = {
    ADIM: ADIM, DT: DT, DUNYALAR: DUNYALAR, ARABALAR: ARABALAR, YUKSELTMELER: YUKSELTMELER, BEDEL: BEDEL,
    DUNYA_SAYI: DUNYA_SAYI, BOLUM_SAYI: BOLUM_SAYI,
    tohum: tohum, ayar: ayar, gunlukAyar: gunlukAyar, pist: pist, arabaDeger: arabaDeger, yeni: yeni,
    ilerlet: ilerlet, bot: bot, puan: puan, yildiz: yildiz, kapiAcik: kapiAcik, aciFark: aciFark
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = M;
  else window.DriftMotor = M;
})();

// Mahjong motoru: 16 katmanlı dizilim, serbest taş kuralı, "tersten kurma" ile her zaman çözülebilir tahta üretimi,
// karıştırma (kalan taşlarla yeniden çözülebilir dağıtım), kilitli taş seçimi, olası hamleler ve 48 bölümün ayarı.
// Hem oyun hem oynanış testi (çözüm yolunu doğrulamak için) kullanır.
(function () {
  // Konumlar yarım taş birimindedir: taş (x, y) ile (x+2, y+2) arasını kaplar, z katmandır.
  // Dizilim katmanları: d = [dx, dy] yarım birim kaydırma, s = satırlar ('#' taş, '.' boş).
  var DIZILIMLER = [
    { id: 'kare', ad: 'Kare', k: [{ s: ['######', '######', '######', '######', '######', '######'] }] },
    { id: 'merdiven', ad: 'Merdiven', k: [{ s: ['####........', '######......', '########....', '..########..', '....########', '......######'] }] },
    { id: 'kopru', ad: 'Köprü', k: [
      { s: ['###......###', '############', '############', '###......###'] },
      { s: ['............', '.##########.', '.##########.'] }] },
    { id: 'kalp', ad: 'Kalp', k: [
      { s: ['.###..###.', '##########', '##########', '.########.', '..######..', '...####...', '....##....'] },
      { d: [1, 1], s: ['.##...##.', '.###.###.', '..#####..', '...###...'] }] },
    { id: 'kule', ad: 'Kule', k: [
      { s: ['..####..', '.######.', '########', '########', '########', '.######.', '..####..'] },
      { s: ['........', '..####..', '.######.', '.######.', '.######.', '..####..'] },
      { s: ['........', '........', '...##...', '..####..', '...##...'] }] },
    { id: 'piramit', ad: 'Piramit', k: [
      { s: ['########', '########', '########', '########', '########'] },
      { d: [1, 1], s: ['#######', '#######', '#######', '#######'] },
      { d: [2, 2], s: ['######', '######', '######'] }] },
    { id: 'kelebek', ad: 'Kelebek', k: [
      { s: ['###......###', '####....####', '#####..#####', '############', '#####..#####', '####....####', '###......###'] },
      { s: ['............', '.##......##.', '.###....###.', '.##########.', '.###....###.', '.##......##.'] },
      { s: ['............', '............', '............', '....####....'] }] },
    { id: 'surlar', ad: 'Kale Surları', k: [
      { s: ['##..####..##', '############', '##........##', '##........##', '##........##', '############', '##..####..##'] },
      { s: ['##........##', '############', '##........##', '............', '##........##', '############', '##........##'] },
      { s: ['##........##', '............', '............', '............', '............', '............', '##........##'] }] },
    { id: 'dag', ad: 'Dağ', k: [
      { s: ['....####....', '..########..', '.##########.', '############', '############', '############'] },
      { d: [1, 1], s: ['....###....', '..#######..', '.#########.', '.#########.'] },
      { d: [2, 2], s: ['....##....', '..######..', '.########.'] },
      { d: [3, 3], s: ['....##...', '...####..'] }] },
    { id: 'yelpaze', ad: 'Yelpaze', k: [
      { s: ['.##########.', '############', '############', '.##########.', '..########..', '...######...', '....####....', '.....##.....'] },
      { d: [1, 0], s: ['...........', '.#########.', '.#########.', '..#######..', '...#####...', '....###....', '.....#.....'] },
      { s: ['............', '............', '..########..', '...######...', '....####....', '.....##.....'] },
      { d: [1, 0], s: ['...........', '...........', '...........', '...#####...', '....###....'] }] },
    { id: 'ejder', ad: 'Ejder', k: [
      { s: ['##########..', '##########..', '........##..', '..##########', '..##########', '..##........', '############', '############'] },
      { s: ['.########...', '............', '............', '...########.', '............', '............', '.##########.'] },
      { s: ['..######....', '............', '............', '....######..', '............', '............', '..########..'] },
      { s: ['...####.....', '............', '............', '.....####...', '............', '............', '...######...'] }] },
    { id: 'kaplumbaga', ad: 'Kaplumbağa', k: [
      { s: ['.##########.', '..########..', '############', '############', '############', '############', '..########..', '.##########.'] },
      { s: ['............', '....####....', '...######...', '...######...', '...######...', '...######...', '....####....'] },
      { s: ['............', '............', '....####....', '....####....', '....####....'] },
      { d: [1, 1], s: ['...........', '...........', '....##.....', '....##.....'] }] },
    { id: 'fener', ad: 'Fener', k: [
      { s: ['...##...', '..####..', '.######.', '########', '########', '########', '########', '.######.', '..####..', '...##...'] },
      { s: ['........', '...##...', '..####..', '.######.', '.######.', '.######.', '.######.', '..####..', '...##...'] },
      { s: ['........', '........', '...##...', '..####..', '..####..', '..####..', '..####..', '...##...'] },
      { s: ['........', '........', '........', '...##...', '...##...', '...##...', '...##...'] },
      { d: [1, 1], s: ['.......', '.......', '.......', '...#...', '...#...'] }] },
    { id: 'yildiz', ad: 'Yıldız', k: [
      { s: ['.....##.....', '.....##.....', '....####....', '############', '.##########.', '..########..', '.####..####.', '###......###', '##........##'] },
      { s: ['............', '.....##.....', '....####....', '.##########.', '..########..', '...######...', '..###..###..', '.##......##.'] },
      { s: ['............', '............', '.....##.....', '...######...', '...######...', '....####....', '...##..##...'] },
      { s: ['............', '............', '............', '....####....', '....####....', '.....##.....'] },
      { s: ['............', '............', '............', '.....##.....', '.....##.....'] }] },
    { id: 'labirent', ad: 'Labirent', k: [
      { s: ['############', '#..........#', '#.########.#', '#.#......#.#', '#.#.####.#.#', '#.#......#.#', '#.########.#', '#..........#', '############'] },
      { s: ['############', '#..........#', '#..........#', '#..........#', '#...####...#', '#..........#', '#..........#', '#..........#', '############'] },
      { s: ['##........##', '#..........#', '............', '............', '....####....', '............', '............', '#..........#', '##........##'] },
      { s: ['#..........#', '............', '............', '............', '....####....', '............', '............', '............', '#..........#'] },
      { s: ['#..........#', '............', '............', '............', '.....##.....', '............', '............', '............', '#..........#'] }] },
    { id: 'buyuk-kaplumbaga', ad: 'Büyük Kaplumbağa', k: [
      { s: ['..########..', '.##########.', '############', '############', '############', '############', '.##########.', '..########..'] },
      { s: ['............', '...######...', '...######...', '...######...', '...######...', '...######...', '...######...'] },
      { s: ['............', '............', '....####....', '....####....', '....####....', '....####....'] },
      { s: ['............', '............', '............', '.....##.....', '.....##.....'] },
      { d: [1, 0], s: ['...........', '...........', '...........', '.....#.....', '.....#.....'] }] }
  ];

  var DUNYALAR = [
    { ad: 'Çay Bahçesi', ikon: '🍵', yildiz: 0, dizilim: ['kare', 'merdiven', 'kopru', 'kalp'] },
    { ad: 'Kale', ikon: '🏯', yildiz: 20, dizilim: ['kule', 'piramit', 'kelebek', 'surlar'] },
    { ad: 'Ejder Dağı', ikon: '🐉', yildiz: 45, dizilim: ['dag', 'yelpaze', 'ejder', 'kaplumbaga'] },
    { ad: 'Gece Pazarı', ikon: '🌙', yildiz: 75, dizilim: ['fener', 'yildiz', 'labirent', 'buyuk-kaplumbaga'] }
  ];
  var BOLUM_SAYI = 48, DESEN_SAYI = 34;
  // Desen kodları: 0-33 normal desen, 100-103 mevsim, 200-203 çiçek (grup içinde desen farkı olmadan eşleşir)
  var MEVSIM = 100, CICEK = 200;

  function dizilimBul(id) {
    for (var i = 0; i < DIZILIMLER.length; i++) if (DIZILIMLER[i].id === id) return DIZILIMLER[i];
    return null;
  }

  // Dizilimin taş konumları (z, y, x sıralı) ve komşulukları
  var onbellek = {};
  function konumlar(id) {
    if (onbellek[id]) return onbellek[id];
    var D = dizilimBul(id), poz = [];
    D.k.forEach(function (kat, z) {
      var d = kat.d || [0, 0];
      kat.s.forEach(function (satir, r) {
        for (var c = 0; c < satir.length; c++) if (satir[c] === '#') poz.push({ x: c * 2 + d[0], y: r * 2 + d[1], z: z });
      });
    });
    var n = poz.length, gen = 0, yuk = 0;
    poz.forEach(function (p, i) {
      p.i = i; p.ust = []; p.alt = []; p.sol = -1; p.sag = -1;
      gen = Math.max(gen, p.x + 2); yuk = Math.max(yuk, p.y + 2);
    });
    for (var a = 0; a < n; a++) {
      for (var b = 0; b < n; b++) {
        if (a === b) continue;
        var A = poz[a], B = poz[b], ort = Math.abs(A.x - B.x) < 2 && Math.abs(A.y - B.y) < 2;
        if (B.z === A.z + 1 && ort) A.ust.push(b);
        if (B.z === A.z - 1 && ort) A.alt.push(b);
        if (B.z === A.z && B.y === A.y && B.x === A.x - 2) A.sol = b;
        if (B.z === A.z && B.y === A.y && B.x === A.x + 2) A.sag = b;
      }
    }
    var sonuc = { id: id, ad: D.ad, poz: poz, gen: gen, yuk: yuk, kat: D.k.length };
    onbellek[id] = sonuc;
    return sonuc;
  }

  // var: taşın tahtada olup olmadığı (dizi). Serbest: üstü tamamen açık ve sol ya da sağ yanı boş.
  function serbest(L, v, i) {
    var p = L.poz[i];
    if (!v[i]) return false;
    for (var k = 0; k < p.ust.length; k++) if (v[p.ust[k]]) return false;
    return !(p.sol >= 0 && v[p.sol]) || !(p.sag >= 0 && v[p.sag]);
  }
  function grup(c) { return c >= CICEK ? CICEK : c >= MEVSIM ? MEVSIM : c; }
  function eslesir(a, b) { return grup(a) === grup(b); }

  // Serbest ve eşleşen tüm çiftler. kilit: seçilemeyen taşlar (dizi, isteğe bağlı)
  function hamleler(L, v, desen, kilit) {
    var acik = [], liste = [];
    for (var i = 0; i < L.poz.length; i++) if (serbest(L, v, i) && !(kilit && kilit[i])) acik.push(i);
    for (var a = 0; a < acik.length; a++) for (var b = a + 1; b < acik.length; b++) {
      if (eslesir(desen[acik[a]], desen[acik[b]])) liste.push([acik[a], acik[b]]);
    }
    return liste;
  }

  // Satır parçasında (aynı z ve y, yan yana taşlar) dolu taşlar bitişik kalmalı; yoksa aradaki boşluk hiç dolamaz.
  function parcaDolu(L, f, i) {
    var p = L.poz[i], j = p.sol;
    while (j >= 0) { if (f[j]) return true; j = L.poz[j].sol; }
    j = p.sag;
    while (j >= 0) { if (f[j]) return true; j = L.poz[j].sag; }
    return false;
  }
  function konabilir(L, v, f, i) {
    if (!v[i] || f[i]) return false;
    var p = L.poz[i];
    for (var k = 0; k < p.alt.length; k++) if (v[p.alt[k]] && !f[p.alt[k]]) return false;
    var sol = p.sol >= 0 && f[p.sol], sag = p.sag >= 0 && f[p.sag];
    if (sol && sag) return false;
    if (!sol && !sag && parcaDolu(L, f, i)) return false;
    return true;
  }

  // Tersten kurma: tahtadaki (v) konumlar boşken, o an serbest kalacak iki konum seçilip doldurulur.
  // Doldurma sırasının tersi bir çözüm yoludur. Döner: { sira: [[a,b], ...] (kaldırma sırası) } ya da null.
  function tersten(L, v, rnd) {
    var n = L.poz.length, f = [], dolan = 0, toplam = 0, ciftler = [];
    for (var i = 0; i < n; i++) { f.push(false); if (v[i]) toplam++; }
    while (dolan < toplam) {
      var aday = [];
      for (var a = 0; a < n; a++) if (konabilir(L, v, f, a)) aday.push(a);
      if (aday.length < 2) return null;
      var p = aday[Math.floor(rnd() * aday.length)];
      f[p] = true;
      var aday2 = [];
      for (var b = 0; b < n; b++) {
        if (!konabilir(L, v, f, b)) continue;
        f[b] = true;
        var ok = serbest(L, f, p) && serbest(L, f, b);
        f[b] = false;
        if (ok) aday2.push(b);
      }
      if (!aday2.length) return null;
      var q = aday2[Math.floor(rnd() * aday2.length)];
      f[q] = true;
      dolan += 2;
      ciftler.push([p, q]);
    }
    return { sira: ciftler.reverse() };
  }

  function karistirDizi(a, rnd) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // Desen çiftleri: her desenden 2 çift (4 taş); taş sayısı yetmezse son desen 1 çift alır.
  function desenCiftleri(tasSayi, mevsim, desenSayi) {
    var ciftler = [];
    if (mevsim) {
      ciftler.push([MEVSIM, MEVSIM + 1], [MEVSIM + 2, MEVSIM + 3], [CICEK, CICEK + 1], [CICEK + 2, CICEK + 3]);
      tasSayi -= 8;
    }
    var cift = tasSayi / 2, P = Math.min(desenSayi || DESEN_SAYI, Math.ceil(cift / 2));
    for (var k = 0; k < cift; k++) { var d = k % P; ciftler.push([d, d]); }
    return ciftler;
  }

  // Tahtaya desen yerleştirir. ciftler: [[desen, desen], ...]. En fazla 50 deneme.
  function yerlestir(L, v, ciftler, rnd) {
    for (var deneme = 0; deneme < 50; deneme++) {
      var t = tersten(L, v, rnd);
      if (!t) continue;
      var desen = [], cs = karistirDizi(ciftler.slice(), rnd);
      for (var i = 0; i < L.poz.length; i++) desen.push(-1);
      t.sira.forEach(function (c, k) { desen[c[0]] = cs[k][0]; desen[c[1]] = cs[k][1]; });
      return { desen: desen, cozum: t.sira, deneme: deneme + 1 };
    }
    return null;
  }

  // 48 bölümün ayarı
  function ayar(no) {
    var w = Math.floor((no - 1) / 12), i = (no - 1) % 12;
    var diz = DUNYALAR[w].dizilim[Math.floor(i / 3)], L = konumlar(diz), n = L.poz.length;
    var kilit = w === 2 ? 2 + Math.floor(i / 3) : w === 3 ? 4 + Math.floor(i / 3) : 0;
    return {
      no: no, dunya: w, sira: i, dizilim: diz, tas: n, kat: L.kat,
      mevsim: no >= 3,
      // Dünyalar ilerledikçe desen çeşidi artar (eş bulmak zorlaşır)
      desen: Math.min(DESEN_SAYI, [12, 20, 28, 34][w] + (i % 3) * 2),
      hedef: Math.round(n * 2.5 / 5) * 5,
      kilit: kilit,
      karartma: w < 3
    };
  }

  // Tahtayı kurar: { L, v, desen, cozum, kilit }
  function kur(o, rnd) {
    var L = konumlar(o.dizilim), v = L.poz.map(function () { return true; });
    var y = yerlestir(L, v, desenCiftleri(L.poz.length, o.mevsim, o.desen), rnd);
    var kilit = L.poz.map(function () { return false; });
    if (o.kilit) {
      // Kilitli taş, çözüm yolunda kendisinden önce bir komşusu (yanı ya da üstü) kalkan taşlardan seçilir;
      // böylece çözüm yolu izlenirken her kilit zamanında açılır.
      var sira = [];
      y.cozum.forEach(function (c, k) { sira[c[0]] = k; sira[c[1]] = k; });
      var uygun = [];
      L.poz.forEach(function (p, i) {
        var kom = komsular(L, i);
        for (var k = 0; k < kom.length; k++) if (sira[kom[k]] < sira[i]) { uygun.push(i); return; }
      });
      karistirDizi(uygun, rnd).slice(0, o.kilit).forEach(function (i) { kilit[i] = true; });
    }
    return { L: L, v: v, desen: y.desen, cozum: y.cozum, kilit: kilit };
  }
  function komsular(L, i) {
    var p = L.poz[i], k = p.ust.slice();
    if (p.sol >= 0) k.push(p.sol);
    if (p.sag >= 0) k.push(p.sag);
    return k;
  }

  // Kalan taşları aynı konumlarda yeniden dağıtır; sonuç yine çözülebilir. Döner: { desen, cozum } ya da null.
  function karistir(L, v, desen, rnd) {
    var gruplar = {};
    for (var i = 0; i < L.poz.length; i++) if (v[i]) (gruplar[grup(desen[i])] = gruplar[grup(desen[i])] || []).push(desen[i]);
    var ciftler = [];
    Object.keys(gruplar).forEach(function (g) {
      var l = karistirDizi(gruplar[g], rnd);
      for (var k = 0; k + 1 < l.length; k += 2) ciftler.push([l[k], l[k + 1]]);
    });
    var y = yerlestir(L, v, ciftler, rnd);
    if (!y) return null;
    var yeni = desen.slice();
    for (var j = 0; j < L.poz.length; j++) if (v[j]) yeni[j] = y.desen[j];
    return { desen: yeni, cozum: y.cozum };
  }

  // Çözüm yolunu kurallarla oynatır (test ve denetim için)
  function dogrula(L, v, desen, cozum, kilit) {
    v = v.slice(); kilit = kilit ? kilit.slice() : null;
    for (var k = 0; k < cozum.length; k++) {
      var a = cozum[k][0], b = cozum[k][1];
      if (!serbest(L, v, a) || !serbest(L, v, b) || !eslesir(desen[a], desen[b])) return false;
      if (kilit && (kilit[a] || kilit[b])) return false;
      v[a] = v[b] = false;
      if (kilit) kilitAc(L, kilit, [a, b]);
    }
    return v.every(function (x) { return !x; });
  }
  // Kalkan taşların komşusu olan kilitli taşlar açılır. Açılanları döner.
  function kilitAc(L, kilit, kalkan) {
    var acilan = [];
    for (var i = 0; i < L.poz.length; i++) {
      if (!kilit[i]) continue;
      var kom = komsular(L, i);
      if (kalkan.some(function (x) { return kom.indexOf(x) !== -1; })) { kilit[i] = false; acilan.push(i); }
    }
    return acilan;
  }

  var api = {
    DIZILIMLER: DIZILIMLER, DUNYALAR: DUNYALAR, BOLUM_SAYI: BOLUM_SAYI, DESEN_SAYI: DESEN_SAYI, MEVSIM: MEVSIM, CICEK: CICEK,
    dizilimBul: dizilimBul, konumlar: konumlar, serbest: serbest, grup: grup, eslesir: eslesir, hamleler: hamleler,
    tersten: tersten, desenCiftleri: desenCiftleri, yerlestir: yerlestir, ayar: ayar, kur: kur, karistir: karistir,
    dogrula: dogrula, kilitAc: kilitAc, komsular: komsular
  };
  if (typeof window !== 'undefined') window.MahjongMotor = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();

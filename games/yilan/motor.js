// Yılan motoru: tahta durumu, adım kuralları (yem, özel yemler, lav, kenardan geçiş), 24 Macera bölümünün
// düzenleri ve ayarları, yıldız hesabı, yılan desenleri ve basit bir yol bulan bot (bölüm sürelerini ölçmek
// ve oynanış testinde bölüm kazanmak için). Hem oyun hem oynanış testi kullanır.
(function () {
  var N = 21;
  var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  var DIR_ADLARI = ['up', 'down', 'left', 'right'];

  // ---------- Bölüm düzenleri ----------
  // Her düzen dikdörtgen duvarlardan kurulur: [x, y, genişlik, yükseklik]. m4 dört köşeye, mh sağa-sola aynalar.
  function r(x, y, w, h) { return [[x, y, w, h]]; }
  function mh(x, y, w, h) { return [[x, y, w, h], [N - x - w, y, w, h]]; }
  function m4(x, y, w, h) { return mh(x, y, w, h).concat(mh(x, N - y - h, w, h)); }
  function L() { return [].concat.apply([], arguments); }
  function izgaraDuz(xs, ys, w, h) {
    var out = [];
    xs.forEach(function (x) { ys.forEach(function (y) { out.push([x, y, w, h]); }); });
    return out;
  }

  var DUNYALAR = [
    { ad: 'Bahçe', ikon: '🌿', alt: 'engeller, çitler', zemin: '#10241c', duvar: '#4d7c4a', hiz: [140, 120] },
    { ad: 'Mağara', ikon: '🪨', alt: 'labirent, kenardan geçiş', zemin: '#141826', duvar: '#64748b', hiz: [120, 100] },
    { ad: 'Yanardağ', ikon: '🌋', alt: 'yoğun duvarlar, lav', zemin: '#26120f', duvar: '#7c2d12', hiz: [100, 80] }
  ];

  // ap: aşağıda yıldız süreleri. bas: yılanın başı ve yönü (gövde arkaya doğru 2 hücre). Belirtilmezse (3, 10) sağa.
  var DUZENLER = [
    // Dünya 1: Bahçe
    { hedef: 8, ap: 13.3, duvar: [] },
    { hedef: 9, ap: 13.6, duvar: r(9, 9, 3, 3) },
    { hedef: 10, ap: 14.8, duvar: m4(2, 2, 3, 3) },
    { hedef: 11, ap: 15.5, duvar: L(r(4, 5, 13, 1), r(4, 15, 13, 1)) },
    { hedef: 12, ap: 16.5, duvar: L(r(10, 5, 1, 11), r(5, 10, 11, 1)), bas: [3, 3, 'right'] },
    { hedef: 13, ap: 14.5, duvar: L(m4(4, 4, 4, 1), m4(4, 4, 1, 4), r(10, 10, 1, 1)) },
    { hedef: 14, ap: 15.3, duvar: L(mh(6, 3, 1, 6), mh(6, 12, 1, 6), r(9, 10, 3, 1)) },
    { hedef: 15, ap: 17.2, duvar: L(r(3, 3, 15, 1), r(3, 17, 15, 1), r(9, 7, 3, 7)) },
    // Dünya 2: Mağara (13-16 kenardan geçişli)
    { hedef: 12, ap: 16.1, duvar: L(r(4, 4, 6, 1), r(4, 4, 1, 5), r(11, 16, 6, 1), r(16, 12, 1, 5), r(10, 7, 1, 7)) },
    { hedef: 13, ap: 20.5, duvar: L(r(0, 6, 15, 1), r(6, 14, 15, 1)) },
    { hedef: 14, ap: 16.4, duvar: L(r(4, 0, 1, 8), r(8, 0, 1, 8), r(12, 0, 1, 8), r(16, 0, 1, 8), r(6, 13, 1, 8), r(10, 13, 1, 8), r(14, 13, 1, 8)) },
    { hedef: 15, ap: 28.2, duvar: L(r(3, 3, 15, 1), r(17, 3, 1, 15), r(5, 17, 13, 1), r(5, 7, 1, 10), r(5, 7, 9, 1), r(13, 7, 1, 7)), bas: [3, 1, 'right'] },
    { hedef: 16, ap: 13.0, duvar: L(mh(0, 5, 8, 1), mh(0, 15, 8, 1), r(10, 8, 1, 5)), sarma: true },
    { hedef: 17, ap: 12.0, duvar: L(m4(3, 3, 5, 1), m4(3, 3, 1, 5), r(10, 7, 1, 7)), sarma: true },
    { hedef: 18, ap: 10.6, duvar: L(r(6, 6, 9, 1), r(6, 14, 9, 1), mh(6, 6, 1, 3), mh(6, 12, 1, 3)), sarma: true },
    { hedef: 20, ap: 10.9, duvar: izgaraDuz([3, 8, 13, 18], [3, 7, 13, 17], 2, 2), sarma: true },
    // Dünya 3: Yanardağ (her 5 yemde bir lav)
    { hedef: 15, ap: 17.3, duvar: L(mh(3, 3, 6, 1), mh(3, 17, 6, 1), mh(3, 3, 1, 5), mh(3, 13, 1, 5), r(10, 6, 1, 9)) },
    { hedef: 16, ap: 24.6, duvar: L(r(0, 5, 15, 1), r(7, 10, 14, 1), r(0, 15, 15, 1), r(17, 2, 1, 3), r(3, 16, 1, 3)) },
    { hedef: 18, ap: 30.1, duvar: L(r(5, 0, 1, 17), r(10, 4, 1, 17), r(15, 0, 1, 17)), bas: [1, 15, 'up'] },
    { hedef: 19, ap: 19.7, duvar: L(r(7, 0, 1, 3), r(7, 5, 1, 11), r(7, 18, 1, 3), r(13, 0, 1, 9), r(13, 12, 1, 9), r(1, 6, 4, 1), r(16, 14, 4, 1)) },
    { hedef: 20, ap: 16.9, duvar: L(m4(2, 2, 6, 1), m4(2, 6, 6, 1), r(10, 2, 1, 6), r(10, 13, 1, 6)) },
    { hedef: 22, ap: 19.8, duvar: L(r(2, 2, 17, 1), r(2, 18, 17, 1), mh(2, 2, 1, 7), mh(2, 12, 1, 7), r(6, 6, 9, 1), r(6, 14, 9, 1), r(10, 6, 1, 3), r(10, 12, 1, 3)) },
    { hedef: 23, ap: 15.0, duvar: izgaraDuz([2, 6, 10, 14, 18], [2, 6, 13, 17], 1, 2).concat(r(8, 9, 5, 1)) },
    { hedef: 25, ap: 19.0, duvar: L(r(4, 4, 13, 1), r(4, 16, 13, 1), mh(4, 4, 1, 5), mh(4, 12, 1, 5), r(8, 8, 5, 1), r(8, 12, 5, 1), m4(1, 1, 2, 1)) }
  ];

  // ap: yol bulan botun bu düzende yem başına harcadığı adım sayısının ortancası (30 oyunla ölçüldü).
  // Yıldız süreleri: 3 yıldız botun 1,5 katı, 2 yıldız 2,4 katı süre.
  var BOLUMLER = DUZENLER.map(function (d, i) {
    var dunya = Math.floor(i / 8), k = i % 8, H = DUNYALAR[dunya].hiz;
    var hiz = Math.round(H[0] - (H[0] - H[1]) * k / 7);
    var b = { n: i + 1, dunya: dunya, hiz: hiz, hedef: d.hedef, sarma: !!d.sarma, ozelYem: dunya >= 1, lav: dunya === 2, duvar: d.duvar, bas: d.bas || [3, 10, 'right'] };
    b.t3 = Math.ceil(b.hedef * d.ap * 1.5 * hiz / 1000);
    b.t2 = Math.ceil(b.hedef * d.ap * 2.4 * hiz / 1000);
    return b;
  });

  function engelIzgara(b) {
    var g = new Uint8Array(N * N);
    if (!b) return g;
    b.duvar.forEach(function (d) {
      for (var x = d[0]; x < d[0] + d[2]; x++)
        for (var y = d[1]; y < d[1] + d[3]; y++)
          if (x >= 0 && y >= 0 && x < N && y < N) g[y * N + x] = 1;
    });
    return g;
  }

  function basYilan(b) {
    var bas = b ? b.bas : [10, 10, 'right'];
    var v = DIRS[bas[2]];
    return [[bas[0], bas[1]], [bas[0] - v[0], bas[1] - v[1]], [bas[0] - 2 * v[0], bas[1] - 2 * v[1]]];
  }

  function yildiz(b, sureMs) {
    var sn = sureMs / 1000;
    return sn <= b.t3 ? 3 : sn <= b.t2 ? 2 : 1;
  }

  // ---------- Durum ve adım ----------
  function yilandaMi(s, x, y) {
    for (var i = 0; i < s.snake.length; i++) if (s.snake[i][0] === x && s.snake[i][1] === y) return true;
    return false;
  }
  function ozelAt(s, x, y) {
    for (var i = 0; i < s.ozel.length; i++) if (s.ozel[i].x === x && s.ozel[i].y === y) return i;
    return -1;
  }
  function bosMu(s, x, y) {
    return !s.engel[y * N + x] && !yilandaMi(s, x, y) && !(s.food && s.food[0] === x && s.food[1] === y) && ozelAt(s, x, y) < 0;
  }
  function bosHucreler(s) {
    var free = [];
    for (var x = 0; x < N; x++)
      for (var y = 0; y < N; y++)
        if (!s.engel[y * N + x] && !yilandaMi(s, x, y) && ozelAt(s, x, y) < 0) free.push([x, y]);
    return free;
  }
  function yemKoy(s) {
    var free = bosHucreler(s);
    s.food = free.length ? free[Math.floor(s.rnd() * free.length)] : null;
  }
  function ozelKoy(s, tur) {
    var free = bosHucreler(s).filter(function (c) { return !(s.food && c[0] === s.food[0] && c[1] === s.food[1]); });
    if (!free.length) return;
    var c = free[Math.floor(s.rnd() * free.length)];
    s.ozel.push({ x: c[0], y: c[1], tur: tur, kalan: tur === 'altin' ? 6000 : 0 });
  }

  // Duvar olmayan tüm hücreler tek parça mı (yem hiçbir zaman kapalı bir cebe düşmesin)
  function bagliMi(engel, sarma) {
    var start = -1, toplam = 0;
    for (var i = 0; i < N * N; i++) if (!engel[i]) { toplam++; if (start < 0) start = i; }
    if (start < 0) return false;
    var gor = new Uint8Array(N * N), q = [start], say = 1;
    gor[start] = 1;
    while (q.length) {
      var c = q.pop(), cx = c % N, cy = (c - cx) / N;
      for (var d = 0; d < 4; d++) {
        var v = DIRS[DIR_ADLARI[d]], nx = cx + v[0], ny = cy + v[1];
        if (sarma) { nx = (nx + N) % N; ny = (ny + N) % N; } else if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
        var j = ny * N + nx;
        if (!engel[j] && !gor[j]) { gor[j] = 1; say++; q.push(j); }
      }
    }
    return say === toplam;
  }

  // Lav: başa uzak, boş, 3 hücrelik düz bir parça; tahtayı ikiye bölüyorsa başka yer denenir
  function lavKoy(s) {
    var bas = s.snake[0];
    for (var deneme = 0; deneme < 80; deneme++) {
      var yatay = s.rnd() < 0.5, x = Math.floor(s.rnd() * N), y = Math.floor(s.rnd() * N), hucreler = [], ok = true;
      for (var k = 0; k < 3 && ok; k++) {
        var hx = x + (yatay ? k : 0), hy = y + (yatay ? 0 : k);
        if (hx >= N || hy >= N || !bosMu(s, hx, hy) || Math.abs(hx - bas[0]) + Math.abs(hy - bas[1]) < 4) ok = false;
        else hucreler.push([hx, hy]);
      }
      if (!ok) continue;
      hucreler.forEach(function (c) { s.engel[c[1] * N + c[0]] = 2; });
      if (bagliMi(s.engel, s.sarma)) return hucreler;
      hucreler.forEach(function (c) { s.engel[c[1] * N + c[0]] = 0; });
    }
    return null;
  }

  // b yoksa klasik tahta (boş, duvarlı kenar, başlangıç ortada)
  function yeniDurum(b, rnd) {
    var bas = b ? b.bas : [10, 10, 'right'];
    var s = {
      b: b || null, snake: basYilan(b), dir: bas[2], nextDir: bas[2], engel: engelIzgara(b), sarma: !!(b && b.sarma),
      rnd: rnd || Math.random, food: null, ozel: [], yenen: 0, ilerleme: 0, buz: 0, sure: 0, bitti: false
    };
    yemKoy(s);
    return s;
  }

  // Bir sonraki adımın süresi (ms): klasikte skorla hızlanır, Macera'da bölüm hızı; buz yemi %30 yavaşlatır
  function adimMs(s) {
    if (!s.b) return Math.max(60, 140 - Math.floor(s.yenen * 10 / 50) * 10);
    return s.buz > 0 ? Math.round(s.b.hiz / 0.7) : s.b.hiz;
  }

  // Yılanı bir adım ilerletir. ms: bu adımın süresi (süre sayaçları oyun zamanıyla işler, duraklatınca durur).
  // Dönen olaylar: { carpti, yem, altin, buz, lav, kayboldu, bitti }
  function adim(s, ms) {
    var olay = {};
    s.sure += ms;
    if (s.buz > 0) s.buz = Math.max(0, s.buz - ms);
    for (var i = s.ozel.length - 1; i >= 0; i--) {
      var o = s.ozel[i];
      if (o.tur === 'altin') { o.kalan -= ms; if (o.kalan <= 0) { s.ozel.splice(i, 1); olay.kayboldu = true; } }
    }
    s.dir = s.nextDir;
    var v = DIRS[s.dir], head = [s.snake[0][0] + v[0], s.snake[0][1] + v[1]];
    var disari = head[0] < 0 || head[1] < 0 || head[0] >= N || head[1] >= N;
    if (disari && s.sarma) { head[0] = (head[0] + N) % N; head[1] = (head[1] + N) % N; disari = false; }
    var yem = !disari && s.food && head[0] === s.food[0] && head[1] === s.food[1];
    var oi = disari ? -1 : ozelAt(s, head[0], head[1]);
    var buyur = yem || oi >= 0;
    // Yem yenmediyse kuyruk bu adımda boşalacağı için çarpışma kontrolüne dahil edilmez.
    var body = buyur ? s.snake : s.snake.slice(0, -1);
    var carpti = disari || s.engel[head[1] * N + head[0]] || body.some(function (c) { return c[0] === head[0] && c[1] === head[1]; });
    if (carpti) { s.bitti = true; olay.carpti = true; return olay; }
    s.snake.unshift(head);
    if (!buyur) s.snake.pop();
    if (yem) {
      s.yenen++; s.ilerleme++; olay.yem = true;
      yemKoy(s);
      if (s.b && s.b.lav && s.yenen % 5 === 0 && s.ilerleme < s.b.hedef) olay.lav = lavKoy(s);
      if (s.b && s.b.ozelYem && s.rnd() < 0.15) {
        var tur = s.rnd() < 0.5 ? 'altin' : 'buz';
        if (!s.ozel.some(function (o) { return o.tur === tur; })) ozelKoy(s, tur);
      }
    }
    if (oi >= 0) {
      var oz = s.ozel.splice(oi, 1)[0];
      if (oz.tur === 'altin') { s.ilerleme += 2; olay.altin = true; } else { s.buz = 5000; olay.buz = true; }
    }
    if (s.b && s.ilerleme >= s.b.hedef) { s.bitti = true; olay.bitti = true; }
    return olay;
  }

  // ---------- Bot ----------
  // En yakın yeme (veya özel yeme) BFS ile gider; yol yoksa en geniş boş alana döner.
  function botYon(s) {
    var engel = new Uint8Array(N * N), i;
    for (i = 0; i < N * N; i++) engel[i] = s.engel[i] ? 1 : 0;
    for (i = 0; i < s.snake.length - 1; i++) engel[s.snake[i][1] * N + s.snake[i][0]] = 1;
    var hedefler = {};
    if (s.food) hedefler[s.food[1] * N + s.food[0]] = 1;
    s.ozel.forEach(function (o) { hedefler[o.y * N + o.x] = 1; });
    var cur = DIRS[s.dir];
    function komsu(x, y, d) {
      var v = DIRS[d], nx = x + v[0], ny = y + v[1];
      if (s.sarma) { nx = (nx + N) % N; ny = (ny + N) % N; } else if (nx < 0 || ny < 0 || nx >= N || ny >= N) return -1;
      return ny * N + nx;
    }
    var h = s.snake[0], ilk = new Int8Array(N * N).fill(-1), gor = new Uint8Array(N * N), q = [];
    gor[h[1] * N + h[0]] = 1;
    DIR_ADLARI.forEach(function (d, di) {
      var v = DIRS[d];
      if (v[0] === -cur[0] && v[1] === -cur[1]) return;
      var j = komsu(h[0], h[1], d);
      if (j < 0 || engel[j] || gor[j]) return;
      gor[j] = 1; ilk[j] = di; q.push(j);
    });
    for (var qi = 0; qi < q.length; qi++) {
      var c = q[qi];
      if (hedefler[c]) return DIR_ADLARI[ilk[c]];
      var cx = c % N, cy = (c - cx) / N;
      for (var d = 0; d < 4; d++) {
        var j2 = komsu(cx, cy, DIR_ADLARI[d]);
        if (j2 < 0 || engel[j2] || gor[j2]) continue;
        gor[j2] = 1; ilk[j2] = ilk[c]; q.push(j2);
      }
    }
    // Yol yok: en çok boş hücreye ulaşan yön
    var enIyi = s.dir, enCok = -1;
    DIR_ADLARI.forEach(function (d) {
      var v = DIRS[d];
      if (v[0] === -cur[0] && v[1] === -cur[1]) return;
      var j = komsu(h[0], h[1], d);
      if (j < 0 || engel[j]) return;
      var g = new Uint8Array(N * N), st = [j], n = 0;
      g[j] = 1;
      while (st.length) {
        var k = st.pop(); n++;
        var kx = k % N, ky = (k - kx) / N;
        for (var e = 0; e < 4; e++) { var m = komsu(kx, ky, DIR_ADLARI[e]); if (m >= 0 && !engel[m] && !g[m]) { g[m] = 1; st.push(m); } }
      }
      if (n > enCok) { enCok = n; enIyi = d; }
    });
    return enIyi;
  }

  // ---------- Desenler ----------
  // Yalnızca görünüm: toplam yıldızla açılır, puanı etkilemez.
  var DESENLER = [
    { id: 'nane', ad: 'Nane', esik: 0, ornek: ['#5ee0b8', '#ffb547'] },
    { id: 'gokkusagi', ad: 'Gökkuşağı', esik: 12, ornek: ['#f43f5e', '#3b82f6'] },
    { id: 'mercan', ad: 'Mercan', esik: 30, ornek: ['#fb7185', '#fb923c'] },
    { id: 'gece', ad: 'Gece', esik: 50, ornek: ['#1e3a8a', '#facc15'] },
    { id: 'altin', ad: 'Altın', esik: 72, ornek: ['#facc15', '#b45309'] }
  ];
  var GOKKUSAGI = ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#818cf8', '#c084fc'];
  // i. hücrenin rengi (0 baş)
  function desenRenk(id, i) {
    if (id === 'gokkusagi') return i === 0 ? '#ffffff' : GOKKUSAGI[(i - 1) % GOKKUSAGI.length];
    if (id === 'mercan') return i === 0 ? '#fde68a' : (i % 2 ? '#fb7185' : '#fb923c');
    if (id === 'gece') return i === 0 ? '#1e40af' : (i % 2 ? '#1e3a8a' : '#172554');
    if (id === 'altin') return i === 0 ? '#fff7cc' : (i % 2 ? '#facc15' : '#eab308');
    return i === 0 ? '#ffb547' : '#5ee0b8';
  }

  window.YilanMotor = {
    N: N, DIRS: DIRS, DUNYALAR: DUNYALAR, BOLUMLER: BOLUMLER, DESENLER: DESENLER,
    engelIzgara: engelIzgara, basYilan: basYilan, bagliMi: bagliMi, yildiz: yildiz,
    yeniDurum: yeniDurum, adim: adim, adimMs: adimMs, botYon: botYon, desenRenk: desenRenk
  };
})();

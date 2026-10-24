(function () {
  // Tuğla Kırma: raketle topu sektirip tuğla kırılan, 3 dünya x 10 bölümlük kampanya. Bölüm başına 1-3 yıldız,
  // yıldızlardan gelen elmasla kalıcı yükseltmeler, patronlar, açılan raket/iz görünümleri, günlük görevler,
  // 30 bölüm sonrası Sonsuz Mod ve günlük modda (?gunluk=) herkese aynı 3 bölümlük seri. Kayıt: mo_tugla.
  var W = 480, H = 640, COLS = 12, BW = 40, BH = 20, TOP = 56;
  var PAD_Y = 596, PAD_H = 12, PAD_W = 84, R = 7;
  var SAVE_KEY = 'mo_tugla';
  var reducedMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var WORLDS = [
    { ad: 'Orman', ikon: '🌳', zemin: ['#0f2a1d', '#0a1a12'], renk: ['#4ade80', '#a3e635', '#facc15', '#fb923c'] },
    { ad: 'Çöl', ikon: '🏜️', zemin: ['#3a2a14', '#1f160b'], renk: ['#fbbf24', '#fb923c', '#f87171', '#e879f9'] },
    { ad: 'Uzay', ikon: '🌌', zemin: ['#111a3d', '#070b1f'], renk: ['#60a5fa', '#a78bfa', '#f472b6', '#22d3ee'] }
  ];
  var CAPS = {
    genis: { ikon: '↔️', ad: 'Geniş Raket', renk: '#22c55e' },
    coklu: { ikon: '⚪', ad: 'Çoklu Top', renk: '#3b82f6' },
    yavas: { ikon: '🐢', ad: 'Yavaş Top', renk: '#14b8a6' },
    lazer: { ikon: '🔫', ad: 'Lazer', renk: '#ef4444' },
    yapiskan: { ikon: '🍯', ad: 'Yapışkan Raket', renk: '#f59e0b' },
    dar: { ikon: '🤏', ad: 'Dar Raket', renk: '#6b7280' }
  };
  var GOOD = ['genis', 'coklu', 'yavas', 'lazer', 'yapiskan'];
  // Elmasla alınan kalıcı yükseltmeler; k. seviyenin bedeli bedel[k-1] elmas.
  var UPGRADES = [
    { id: 'raket', ikon: '📏', ad: 'Raket Genişliği', aciklama: 'Raket her seviyede %8 geniş', bedel: [2, 4, 6, 8, 10] },
    { id: 'can', ikon: '❤️', ad: 'Başlangıç Canı', aciklama: 'Bölüme +1 canla başla', bedel: [6, 10] },
    { id: 'sure', ikon: '⏱️', ad: 'Güçlendirme Süresi', aciklama: 'Kapsüller +2 sn uzun sürer', bedel: [2, 4, 6, 8, 10] },
    { id: 'sans', ikon: '🍀', ad: 'Kapsül Şansı', aciklama: 'Tuğlalardan daha sık kapsül düşer', bedel: [3, 5, 7, 9, 11] },
    { id: 'lazer', ikon: '🔫', ad: 'Lazer Gücü', aciklama: 'Lazer daha sık ateş eder', bedel: [3, 6, 9] }
  ];
  // Patron bölümleriyle açılan görünümler (acilis: geçilmesi gereken bölüm)
  var SKINS = [
    { id: 'klasik', ad: 'Klasik', renk: ['#e5e7eb', '#9ca3af'], iz: null, acilis: 0 },
    { id: 'orman', ad: 'Yaprak', renk: ['#86efac', '#16a34a'], iz: '#4ade80', acilis: 10 },
    { id: 'col', ad: 'Kum fırtınası', renk: ['#fde68a', '#d97706'], iz: '#fb923c', acilis: 20 },
    { id: 'uzay', ad: 'Nebula', renk: ['#c4b5fd', '#7c3aed'], iz: '#f472b6', acilis: 30 }
  ];
  var MISSIONS = [
    { id: 'kombo5', ad: 'Raket dokunmadan 5 tuğla kır (5x kombo)', hedef: 1, odul: 2 },
    { id: 'coklu3', ad: '3 Çoklu Top kapsülü yakala', hedef: 3, odul: 2 },
    { id: 'kayipsiz', ad: 'Bir bölümü can kaybetmeden bitir', hedef: 1, odul: 3 },
    { id: 'tugla150', ad: '150 tuğla kır', hedef: 150, odul: 2 },
    { id: 'kapsul8', ad: '8 kapsül yakala', hedef: 8, odul: 2 },
    { id: 'yildiz3', ad: 'Bir bölümden 3 yıldız al', hedef: 1, odul: 3 },
    { id: 'patlat5', ad: '5 patlayan tuğla patlat', hedef: 5, odul: 2 }
  ];

  var canvas = document.getElementById('alan');
  var ctx = canvas.getContext('2d');
  var mapEl = document.getElementById('harita');
  var hudEl = document.getElementById('ust');
  var lvlEl = document.getElementById('bolum');
  var scoreEl = document.getElementById('puan');
  var livesEl = document.getElementById('can');
  var bestEl = document.getElementById('rekor');
  var mapBtn = document.getElementById('harita-btn');

  var daily = !!(MiniOyun.gunluk && MiniOyun.gunluk.tarih);
  var save = load();
  var mode = 'kampanya', lvNo = 1, run, keys = { sol: false, sag: false }, pointerUsed = false;
  var paused = false, last = 0, deco = [];

  // ---------- Kayıt ----------
  function load() {
    var p = null;
    try { p = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) {}
    if (!p || typeof p !== 'object') p = {};
    if (!p.bolumler || typeof p.bolumler !== 'object') p.bolumler = {};
    if (!p.yukseltme || typeof p.yukseltme !== 'object') p.yukseltme = {};
    if (!p.secili || typeof p.secili !== 'object') p.secili = {};
    p.elmas = Number(p.elmas) || 0;
    p.sonsuzRekor = Number(p.sonsuzRekor) || 0;
    if (!Array.isArray(p.patron)) p.patron = [];
    return p;
  }
  function store() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
  }
  function up(id) { return daily || mode === 'gunluk' ? 0 : Number(save.yukseltme[id]) || 0; }
  function stars(n) { return Number(save.bolumler[n]) || 0; }
  function worldStars(w) { var s = 0; for (var i = w * 10 + 1; i <= w * 10 + 10; i++) s += stars(i); return s; }
  function totalStars() { var s = 0; for (var i = 1; i <= 30; i++) s += stars(i); return s; }
  function open(n) {
    if (n === 1) return true;
    if (!stars(n - 1)) return false;
    return (n - 1) % 10 !== 0 || worldStars((n - 1) / 10 - 1) >= 15;
  }
  function skinOpen(s) { return !s.acilis || stars(s.acilis) > 0; }
  function skin() {
    for (var i = 0; i < SKINS.length; i++) if (SKINS[i].id === save.secili.raket && skinOpen(SKINS[i])) return SKINS[i];
    return SKINS[0];
  }
  function endlessOpen() { return stars(30) > 0; }

  // ---------- Günlük görevler ----------
  function missionsReady() {
    var today = MiniOyun.gunluk.bugun();
    var g = save.gorev;
    if (g && g.tarih === today && Array.isArray(g.liste) && g.liste.length === 3 && g.ilerleme && Array.isArray(g.tamam)) return;
    var rnd = MiniOyun.gunluk.rastgele(today + '/tugla-gorev');
    var pool = MISSIONS.map(function (m) { return m.id; }), list = [];
    while (list.length < 3) list.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    save.gorev = { tarih: today, liste: list, ilerleme: {}, tamam: [] };
    list.forEach(function (id) { save.gorev.ilerleme[id] = 0; });
    store();
  }
  function mission(id) { for (var i = 0; i < MISSIONS.length; i++) if (MISSIONS[i].id === id) return MISSIONS[i]; }
  // Görev ilerlemesi; "en az" türündekiler (kombo) için set=true
  function progressMission(id, n, set) {
    if (mode === 'gunluk') return;
    missionsReady();
    var g = save.gorev;
    if (g.liste.indexOf(id) === -1 || g.tamam.indexOf(id) !== -1) return;
    var m = mission(id);
    g.ilerleme[id] = set ? Math.max(g.ilerleme[id] || 0, n) : (g.ilerleme[id] || 0) + n;
    if (g.ilerleme[id] >= m.hedef) {
      g.tamam.push(id);
      save.elmas += m.odul;
      run.mesaj = { yazi: '✅ Görev: +' + m.odul + ' 💎', t: 2 };
      MiniOyun.ses('puan');
    }
    store();
  }

  // ---------- Bölüm üretimi ----------
  // Desenler: satır r, sütun c, satır sayısı n için tuğla olup olmadığı
  var SHAPES = [
    function () { return true; },
    function (r, c, n) { var w = Math.floor((r + 1) * 6 / n); return c >= 6 - w && c < 6 + w; },
    function (r, c) { return (r + c) % 2 === 0 || r % 3 === 0; },
    function (r, c, n) { var m = (n - 1) / 2; return Math.abs(c - 5.5) + Math.abs(r - m) * 1.4 <= 6; },
    function (r, c) { return c % 3 !== 1; },
    function (r, c, n) { return r === 0 || r === n - 1 || c < 2 || c > 9 || (r % 2 === 0 && c > 3 && c < 8); },
    function (r, c) { return (c + r) % 4 !== 0; },
    function (r, c) { return r % 2 === 0 || c === 0 || c === 11 || c === 5 || c === 6; },
    function (r, c, n) { return Math.abs(c - 5.5) <= 1.5 + r * 0.8 || r === n - 1; },
    function (r, c, n) { var a = Math.abs(c - 5.5), m = r / Math.max(1, n - 1) * 5.5; return Math.abs(a - m) < 1.6 || Math.abs(a - (5.5 - m)) < 1.6; }
  ];

  function brick(c, r, tip, hp, w, h) {
    return { c: c, r: r, x: c * BW, y: TOP + r * BH, w: (w || 1) * BW, h: (h || 1) * BH, tip: tip, hp: hp, max: hp, satir: r, kapsul: null, canli: true, dogus: 0 };
  }

  // n: bölüm (1-30); opt: { rnd, patron, sonsuz }
  function makeLevel(n, opt) {
    var rnd = opt.rnd, w = Math.min(2, Math.floor((n - 1) / 10));
    var boss = opt.patron !== false && n % 10 === 0;
    var bricks = [], moving = {};
    var rows = n === 1 ? 3 : Math.min(4 + Math.floor(n / 3), 11);
    var shape = n === 1 ? SHAPES[0] : SHAPES[opt.sekil != null ? opt.sekil : (n - 1) % SHAPES.length];
    var pSturdy = n < 3 ? 0 : Math.min(0.08 + n * 0.014, 0.45);
    var pMetal = n < 6 ? 0 : w === 2 ? 0.12 : 0.05;
    var pBoom = n < 4 ? 0 : w === 1 ? 0.08 : 0.05;
    var pSurprise = n < 2 ? 0 : 0.09;
    if (n >= 11 && !boss) for (var mr = 1; mr < rows; mr += 3) moving[mr] = true;
    if (boss) {
      var b = brick(4, 2, 'patron', 14 + w * 10, 4, 3);
      bricks.push(b);
      for (var c = 3; c <= 8; c++) { bricks.push(brick(c, 1, 'kalkan', 1)); bricks.push(brick(c, 5, 'kalkan', 1)); }
      for (var rr = 2; rr <= 4; rr++) { bricks.push(brick(3, rr, 'kalkan', 1)); bricks.push(brick(8, rr, 'kalkan', 1)); }
      for (var bc = 0; bc < COLS; bc++) {
        if (bc < 2 || bc > 9) for (var br = 0; br < 6; br++) bricks.push(brick(bc, br, w === 2 && br % 2 ? 'metal' : 'normal', 1 + (br % 3 === 0 ? 1 : 0)));
        bricks.push(brick(bc, 8, rnd() < 0.2 ? 'surpriz' : 'normal', 1 + w));
      }
    } else {
      for (var r = 0; r < rows; r++) {
        for (var cc = 0; cc < COLS; cc++) {
          if (!shape(r, cc, rows)) continue;
          if (moving[r] && (cc === 0 || cc === COLS - 1)) continue;
          var x = rnd(), tip = 'normal', hp = 1;
          if (x < pMetal && r > 0) tip = 'metal';
          else if ((x -= pMetal) < pBoom) tip = 'patlayan';
          else if ((x -= pBoom) < pSurprise) tip = 'surpriz';
          else if ((x -= pSurprise) < pSturdy) hp = rnd() < n / 40 ? 3 : 2;
          bricks.push(brick(cc, r, tip, tip === 'metal' ? 0 : hp));
        }
      }
    }
    bricks.forEach(function (k) {
      if (k.tip === 'surpriz') k.kapsul = n >= 16 && rnd() < 0.22 ? 'dar' : GOOD[Math.floor(rnd() * GOOD.length)];
      if (moving[k.satir]) k.hareket = true;
    });
    var count = bricks.filter(counts).length;
    if (!count) bricks.push(brick(5, 0, 'normal', 1));
    return {
      no: n, dunya: w, patron: boss, tuglalar: bricks,
      hiz: 300 + (n - 1) * 9 + (opt.sonsuz ? opt.sonsuz * 6 : 0),
      hedef: Math.round(25 + count * 1.6 + (boss ? 40 : 0))
    };
  }
  function counts(k) { return k.tip !== 'metal' && k.tip !== 'kalkan'; }
  function campaignLevel(n) { return makeLevel(n, { rnd: MiniOyun.gunluk.rastgele('tugla-bolum-' + n) }); }

  // ---------- Oyun başlatma ----------
  function newRun(m) {
    mode = m;
    var lives = 3 + up('can');
    run = { puan: 0, can: lives, baslangicCan: lives, seri: 0, rnd: m === 'kampanya' ? Math.random : MiniOyun.rastgele(), bitti: false };
  }
  function startLevel(L) {
    run.L = L;
    run.kayip = 0; run.t = 0; run.kombo = 0; run.enKombo = 0;
    run.bricks = L.tuglalar;
    run.kapsuller = []; run.mermiler = []; run.parca = [];
    run.gecis = 0; run.mesaj = null; run.sarsinti = 0;
    run.etki = { genis: 0, dar: 0, yavas: 0, lazer: 0, yapiskan: 0 };
    run.atesBekle = 0;
    run.raketX = W / 2;
    resetBall();
    mapEl.hidden = true;
    canvas.hidden = false;
    hudEl.hidden = false;
    paused = false;
    canvas.dataset.dizilim = L.tuglalar.map(function (k) { return k.c + ',' + k.r + k.tip.charAt(0) + k.hp + (k.kapsul || ''); }).join(';');
    hud();
    // Raket ve top görünür alanda kalsın
    if (canvas.scrollIntoView) canvas.scrollIntoView({ block: 'nearest' });
    setTimeout(function () { try { canvas.focus({ preventScroll: true }); } catch (e) {} }, 0);
  }
  function startCampaign(n) {
    lvNo = n;
    newRun('kampanya');
    startLevel(campaignLevel(n));
  }
  function startEndless() {
    newRun('sonsuz');
    run.seri = 1;
    startLevel(makeLevel(15 + Math.floor(Math.random() * 14), { rnd: Math.random, patron: false, sonsuz: 1, sekil: Math.floor(Math.random() * SHAPES.length) }));
  }
  function startDaily() {
    newRun('gunluk');
    run.seri = 1;
    startLevel(dailyLevel(1));
  }
  function dailyLevel(i) { return makeLevel([6, 14, 23][i - 1], { rnd: run.rnd, patron: false, sekil: Math.floor(run.rnd() * SHAPES.length) }); }
  function nextInRun() {
    run.seri++;
    if (mode === 'gunluk') startLevel(dailyLevel(run.seri));
    else startLevel(makeLevel(15 + Math.floor(Math.random() * 14), { rnd: Math.random, patron: false, sonsuz: run.seri, sekil: Math.floor(Math.random() * SHAPES.length) }));
    run.mesaj = { yazi: (mode === 'gunluk' ? 'Bölüm ' + run.seri + ' / 3' : 'Seri ' + run.seri), t: 2 };
  }

  function padW() {
    var w = PAD_W * (1 + 0.08 * up('raket'));
    if (run.etki.genis > 0) w *= 1.5;
    if (run.etki.dar > 0) w *= 0.62;
    return w;
  }
  function speed() { return run.L.hiz * (run.etki.yavas > 0 ? 0.7 : 1); }
  function resetBall() {
    run.toplar = [{ x: run.raketX, y: PAD_Y - R - 1, dx: 0.35, dy: -1, yapisik: 0 }];
    norm(run.toplar[0]);
  }
  function norm(b) {
    var l = Math.hypot(b.dx, b.dy) || 1;
    b.dx /= l; b.dy /= l;
    // Top hiçbir zaman neredeyse yatay sekmesin
    if (Math.abs(b.dy) < 0.32) { b.dy = b.dy < 0 ? -0.32 : 0.32; b.dx = (b.dx < 0 ? -1 : 1) * Math.sqrt(1 - 0.32 * 0.32); }
  }
  function launch() {
    var any = false;
    run.toplar.forEach(function (b) {
      if (b.yapisik !== undefined && b.yapisik !== null) {
        b.yapisik = null;
        b.dx = b.dx || 0.35; b.dy = -Math.abs(b.dy || 1);
        norm(b);
        any = true;
      }
    });
    if (any) MiniOyun.ses('tik');
    return any;
  }
  function stuck() { return run.toplar.some(function (b) { return b.yapisik !== null; }); }

  // ---------- Güncelleme ----------
  function update(dt) {
    if (run.bitti) return;
    if (run.gecis > 0) { run.gecis -= dt; if (run.gecis <= 0) nextInRun(); return; }
    var stuckNow = stuck();
    if (!stuckNow || run.toplar.length > 1) run.t += dt;
    if (run.mesaj && (run.mesaj.t -= dt) <= 0) run.mesaj = null;
    for (var k in run.etki) if (run.etki[k] > 0) run.etki[k] = Math.max(0, run.etki[k] - dt);
    if (run.sarsinti > 0) run.sarsinti = Math.max(0, run.sarsinti - dt);

    // Raket
    var pw = padW(), mv = (keys.sag ? 1 : 0) - (keys.sol ? 1 : 0);
    if (mv) run.raketX += mv * 520 * dt;
    run.raketX = Math.max(pw / 2, Math.min(W - pw / 2, run.raketX));

    // Hareketli sıralar
    run.bricks.forEach(function (k) {
      if (k.hareket) k.x = k.c * BW + Math.sin(run.t * 0.9 + k.satir) * 34;
      if (!k.canli && k.tip === 'kalkan' && k.dogus && run.t >= k.dogus && !ballIn(k)) { k.canli = true; k.hp = k.max; k.dogus = 0; }
    });

    // Lazer
    if (run.etki.lazer > 0) {
      run.atesBekle -= dt;
      if (pointerUsed && run.atesBekle <= 0) fire();
    }
    run.mermiler = run.mermiler.filter(function (m) {
      m.y -= 640 * dt;
      var hit = hitBrickAt(m.x, m.y);
      if (hit) { if (hit.tip !== 'metal') damage(hit, 1); return false; }
      return m.y > 0;
    });

    // Toplar (alt adımlarla, hızlıyken tuğla içinden geçmez)
    var sp = speed(), steps = Math.max(1, Math.ceil(sp * dt / 4)), h = dt / steps;
    for (var s = 0; s < steps; s++) {
      for (var i = run.toplar.length - 1; i >= 0; i--) {
        var b = run.toplar[i];
        if (b.yapisik !== null) { b.x = run.raketX + b.yapisik; b.y = PAD_Y - R - 1; continue; }
        b.x += b.dx * sp * h; b.y += b.dy * sp * h;
        if (b.x < R) { b.x = R; b.dx = Math.abs(b.dx); }
        if (b.x > W - R) { b.x = W - R; b.dx = -Math.abs(b.dx); }
        if (b.y < R) { b.y = R; b.dy = Math.abs(b.dy); }
        if (b.dy > 0 && b.y + R >= PAD_Y && b.y - R <= PAD_Y + PAD_H && Math.abs(b.x - run.raketX) <= pw / 2 + R) {
          var off = Math.max(-1, Math.min(1, (b.x - run.raketX) / (pw / 2)));
          var a = off * 1.05;
          b.dx = Math.sin(a); b.dy = -Math.cos(a);
          norm(b);
          b.y = PAD_Y - R - 0.5;
          run.kombo = 0;
          if (run.etki.yapiskan > 0) b.yapisik = b.x - run.raketX;
          MiniOyun.ses('tik');
        }
        collide(b);
        if (b.y - R > H) run.toplar.splice(i, 1);
      }
      if (!run.toplar.length) break;
    }
    if (!run.toplar.length) { loseLife(); return; }

    // Kapsüller
    run.kapsuller = run.kapsuller.filter(function (c) {
      c.y += 150 * dt;
      if (c.y + 9 >= PAD_Y && c.y - 9 <= PAD_Y + PAD_H && Math.abs(c.x - run.raketX) <= pw / 2 + 12) { catchCap(c.tip); return false; }
      return c.y < H + 20;
    });

    run.parca = run.parca.filter(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; return (p.t -= dt) > 0; });

    if (!run.bricks.some(function (k) { return k.canli && counts(k); })) winLevel();
  }

  function ballIn(k) { return run.toplar.some(function (b) { return b.x + R > k.x && b.x - R < k.x + k.w && b.y + R > k.y && b.y - R < k.y + k.h; }); }
  function hitBrickAt(x, y) {
    for (var i = 0; i < run.bricks.length; i++) {
      var k = run.bricks[i];
      if (k.canli && x >= k.x && x <= k.x + k.w && y >= k.y && y <= k.y + k.h) return k;
    }
    return null;
  }
  // Daire-dikdörtgen çarpışması: en az örtüşen eksende geri yansıt; alt adım başına tek tuğla
  function collide(b) {
    for (var i = 0; i < run.bricks.length; i++) {
      var k = run.bricks[i];
      if (!k.canli) continue;
      var nx = Math.max(k.x, Math.min(b.x, k.x + k.w)), ny = Math.max(k.y, Math.min(b.y, k.y + k.h));
      var ddx = b.x - nx, ddy = b.y - ny;
      if (ddx * ddx + ddy * ddy > R * R) continue;
      var ox = Math.min(b.x + R - k.x, k.x + k.w - (b.x - R));
      var oy = Math.min(b.y + R - k.y, k.y + k.h - (b.y - R));
      if (ox < oy) { b.dx = b.x < k.x + k.w / 2 ? -Math.abs(b.dx) : Math.abs(b.dx); b.x += b.dx > 0 ? ox : -ox; }
      else { b.dy = b.y < k.y + k.h / 2 ? -Math.abs(b.dy) : Math.abs(b.dy); b.y += b.dy > 0 ? oy : -oy; }
      norm(b);
      if (k.tip === 'metal') MiniOyun.ses('tik');
      else damage(k, 1, true);
      return;
    }
  }
  function damage(k, n, byBall) {
    k.hp -= n;
    if (k.tip === 'patron') { run.puan += 50; burst(k.x + k.w / 2, k.y + k.h, '#f87171', 4); if (k.hp > 0) { MiniOyun.ses('tik'); hud(); return; } }
    if (k.hp > 0) { MiniOyun.ses('tik'); return; }
    destroy(k, byBall);
  }
  function destroy(k, byBall) {
    if (!k.canli) return;
    k.canli = false;
    if (k.tip === 'kalkan') { k.dogus = run.t + 7; return; }
    if (byBall) run.kombo++;
    var mult = Math.max(1, Math.min(run.kombo, 5));
    run.enKombo = Math.max(run.enKombo, run.kombo);
    run.puan += 10 * Math.max(1, k.max) * mult;
    if (run.kombo >= 5) progressMission('kombo5', 1, true);
    progressMission('tugla150', 1);
    burst(k.x + k.w / 2, k.y + k.h / 2, brickColor(k), 8);
    MiniOyun.ses('puan');
    if (k.tip === 'patron') { run.puan += 1000; run.sarsinti = 0.5; }
    var cap = k.kapsul;
    if (!cap && mode !== 'gunluk' && counts(k) && Math.random() < 0.03 + 0.02 * up('sans')) cap = GOOD[Math.floor(Math.random() * GOOD.length)];
    if (cap) run.kapsuller.push({ x: k.x + k.w / 2, y: k.y + k.h / 2, tip: cap });
    if (k.tip === 'patlayan') {
      progressMission('patlat5', 1);
      run.sarsinti = 0.25;
      run.bricks.forEach(function (o) {
        if (o.canli && o.tip !== 'metal' && o.tip !== 'patron' && Math.abs(o.x + o.w / 2 - k.x - k.w / 2) < BW * 1.6 && Math.abs(o.y + o.h / 2 - k.y - k.h / 2) < BH * 1.6) destroy(o, false);
      });
    }
    hud();
  }
  function catchCap(t) {
    var d = 12 + 2 * up('sure');
    progressMission('kapsul8', 1);
    if (t === 'coklu') {
      progressMission('coklu3', 1);
      var src = run.toplar[0];
      if (src) {
        if (src.yapisik !== null) launch();
        [-0.5, 0.5].forEach(function (a) {
          var c = Math.cos(a), s = Math.sin(a);
          var nb = { x: src.x, y: src.y, dx: src.dx * c - src.dy * s, dy: src.dx * s + src.dy * c, yapisik: null };
          if (nb.dy > 0) nb.dy = -nb.dy;
          norm(nb);
          run.toplar.push(nb);
        });
      }
    } else {
      if (t === 'genis') run.etki.dar = 0;
      if (t === 'dar') run.etki.genis = 0;
      run.etki[t] = d;
    }
    run.mesaj = { yazi: CAPS[t].ikon + ' ' + CAPS[t].ad, t: 1.4 };
    MiniOyun.ses(t === 'dar' ? 'kaybet' : 'puan');
  }
  function fire() {
    if (run.etki.lazer <= 0 || run.atesBekle > 0 || stuck()) return;
    var pw = padW();
    run.mermiler.push({ x: run.raketX - pw / 2 + 6, y: PAD_Y - 2 }, { x: run.raketX + pw / 2 - 6, y: PAD_Y - 2 });
    run.atesBekle = 0.5 - 0.08 * up('lazer');
    MiniOyun.ses('tik');
  }
  function burst(x, y, col, n) {
    if (reducedMotion) return;
    for (var i = 0; i < n; i++) run.parca.push({ x: x, y: y, vx: (Math.random() - 0.5) * 260, vy: (Math.random() - 0.8) * 200, t: 0.5, renk: col });
  }

  function loseLife() {
    run.can--;
    run.kayip++;
    run.kombo = 0;
    run.kapsuller = []; run.mermiler = [];
    for (var k in run.etki) run.etki[k] = 0;
    MiniOyun.ses('kaybet');
    if (run.can <= 0) { hud(); return endRun(false); }
    resetBall();
    run.mesaj = { yazi: '💔 Can gitti', t: 1.2 };
    hud();
  }

  function winLevel() {
    var L = run.L;
    var bonus = run.can * 500 + Math.max(0, Math.round(L.hedef - run.t)) * 10;
    run.puan += bonus;
    if (run.kayip === 0) progressMission('kayipsiz', 1);
    MiniOyun.ses('kazan');
    if (mode !== 'kampanya') {
      if (mode === 'gunluk' && run.seri >= 3) return endRun(true);
      run.gecis = 1.6;
      run.mesaj = { yazi: '🎉 Bölüm geçildi! +' + bonus, t: 1.6 };
      run.kapsuller = []; run.mermiler = [];
      hud();
      return;
    }
    var st = run.kayip === 0 && run.t <= L.hedef ? 3 : run.kayip <= 1 ? 2 : 1;
    if (st === 3) progressMission('yildiz3', 1);
    var old = stars(L.no), starGem = Math.max(0, st - old), gem = starGem, extra = '';
    if (st > old) save.bolumler[L.no] = st;
    if (L.patron && save.patron.indexOf(L.no) === -1) { save.patron.push(L.no); gem += 5; extra = ' Patron yenildi: +5 💎.'; }
    save.elmas += gem;
    store();
    var unlocked = [];
    if (L.no % 10 === 0) SKINS.forEach(function (s) { if (s.acilis === L.no) unlocked.push('yeni görünüm: ' + s.ad); });
    if (L.no === 30) unlocked.push('Sonsuz Mod açıldı');
    var rec = MiniOyun.setBest('tugla-kirma-' + L.no, run.puan);
    MiniOyun.setBest('tugla-kirma', run.puan);
    run.bitti = true;
    hud();
    MiniOyun.bitti({
      baslik: 'Bölüm ' + L.no + ' geçildi! ' + '★★★'.slice(0, st) + '☆☆☆'.slice(st),
      metin: run.puan + ' puan, ' + Math.round(run.t) + ' sn, ' + run.kayip + ' can kaybı. ' + (starGem ? '+' + starGem + ' 💎.' : '') + extra + (unlocked.length ? ' Açıldı: ' + unlocked.join(', ') + '.' : '') +
        (st < 3 ? ' 3 yıldız için can kaybetmeden ' + L.hedef + ' sn içinde bitir.' : ''),
      rekor: rec, skor: run.puan, sonuc: run.puan + ' puan',
      paylas: 'Tuğla Kırma ' + L.no + '. bölümü ' + st + ' yıldızla geçtim: ' + run.puan + ' puan!'
    });
    showMap();
  }

  function endRun(won) {
    run.bitti = true;
    var L = run.L;
    if (mode === 'kampanya') {
      MiniOyun.bitti({ baslik: 'Toplar bitti!', metin: 'Bölüm ' + L.no + ' kaybedildi. Kalan tuğla: ' + run.bricks.filter(function (k) { return k.canli && counts(k); }).length + '. Yükseltmelerle tekrar dene!', kaybetti: true });
      showMap();
      return;
    }
    var key = mode === 'gunluk' ? 'tugla-kirma-gunluk' : 'tugla-kirma-sonsuz';
    var rec = MiniOyun.setBest(key, run.puan);
    MiniOyun.setBest('tugla-kirma', run.puan);
    if (mode === 'sonsuz') { save.sonsuzRekor = Math.max(save.sonsuzRekor, run.puan); store(); }
    MiniOyun.bitti({
      baslik: mode === 'gunluk' ? (won ? 'Günlük seri tamam!' : 'Günlük seri bitti') : 'Sonsuz Mod bitti',
      metin: run.puan + ' puan' + (mode === 'sonsuz' ? ', ' + run.seri + '. bölüme kadar geldin.' : ', ' + (won ? 3 : run.seri - 1) + ' / 3 bölüm.'),
      rekor: rec, kaybetti: !won, skor: run.puan, sonuc: run.puan + ' puan',
      paylas: 'Tuğla Kırma ' + (mode === 'gunluk' ? 'günlük serisinde' : 'Sonsuz Mod\'da') + ' ' + run.puan + ' puan yaptım!'
    });
    hud();
    if (!daily) showMap();
  }

  // ---------- Çizim ----------
  function brickColor(k) {
    if (k.tip === 'metal') return '#9ca3af';
    if (k.tip === 'kalkan') return '#22d3ee';
    if (k.tip === 'patron') return '#dc2626';
    var pal = WORLDS[run.L.dunya].renk;
    return pal[k.satir % pal.length];
  }
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function draw() {
    if (!run || canvas.hidden) return;
    var L = run.L, world = WORLDS[L.dunya];
    ctx.save();
    if (run.sarsinti > 0 && !reducedMotion) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, world.zemin[0]); g.addColorStop(1, world.zemin[1]);
    ctx.fillStyle = g; ctx.fillRect(-10, -10, W + 20, H + 20);
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    deco.forEach(function (d) { ctx.fillRect(d.x, d.y, d.s, d.s); });
    if (L.dunya === 2) { ctx.fillStyle = 'rgba(255,255,255,.35)'; deco.forEach(function (d, i) { if (i % 3 === 0) ctx.fillRect(d.x, d.y, 1.5, 1.5); }); }

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    run.bricks.forEach(function (k) {
      if (!k.canli) return;
      var col = brickColor(k);
      ctx.globalAlpha = k.max > 1 && k.tip !== 'patron' ? 0.45 + 0.55 * k.hp / k.max : 1;
      ctx.fillStyle = col;
      rr(k.x + 1.5, k.y + 1.5, k.w - 3, k.h - 3, 5); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(k.x + 5, k.y + 3, k.w - 10, 3);
      if (k.tip === 'metal') { ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1; rr(k.x + 3, k.y + 3, k.w - 6, k.h - 6, 3); ctx.stroke(); }
      if (k.max > 1 && k.hp < k.max && k.tip !== 'patron') {
        ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1.5; ctx.beginPath();
        ctx.moveTo(k.x + 10, k.y + 4); ctx.lineTo(k.x + 18, k.y + 11); ctx.lineTo(k.x + 14, k.y + 17);
        if (k.hp < k.max - 1) { ctx.moveTo(k.x + 28, k.y + 3); ctx.lineTo(k.x + 24, k.y + 12); }
        ctx.stroke();
      }
      if (k.tip === 'patlayan' || k.tip === 'surpriz') { ctx.font = '13px sans-serif'; ctx.fillText(k.tip === 'patlayan' ? '💥' : '❓', k.x + k.w / 2, k.y + k.h / 2 + 1); }
      if (k.tip === 'patron') {
        ctx.font = '34px sans-serif'; ctx.fillText('🏰', k.x + k.w / 2, k.y + k.h / 2 - 4);
        ctx.fillStyle = '#111'; ctx.fillRect(k.x + 10, k.y + k.h - 12, k.w - 20, 7);
        ctx.fillStyle = '#4ade80'; ctx.fillRect(k.x + 10, k.y + k.h - 12, (k.w - 20) * k.hp / k.max, 7);
      }
    });

    run.kapsuller.forEach(function (c) {
      ctx.fillStyle = CAPS[c.tip].renk; rr(c.x - 18, c.y - 9, 36, 18, 9); ctx.fill();
      ctx.font = '12px sans-serif'; ctx.fillText(CAPS[c.tip].ikon, c.x, c.y + 1);
    });
    ctx.fillStyle = '#f87171';
    run.mermiler.forEach(function (m) { ctx.fillRect(m.x - 1.5, m.y - 8, 3, 10); });
    run.parca.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.t * 2); ctx.fillStyle = p.renk; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); });
    ctx.globalAlpha = 1;

    // Raket
    var sk = skin(), pw = padW();
    var pg = ctx.createLinearGradient(0, PAD_Y, 0, PAD_Y + PAD_H);
    pg.addColorStop(0, run.etki.dar > 0 ? '#9ca3af' : sk.renk[0]); pg.addColorStop(1, sk.renk[1]);
    ctx.fillStyle = pg; rr(run.raketX - pw / 2, PAD_Y, pw, PAD_H, 6); ctx.fill();
    if (run.etki.lazer > 0) { ctx.fillStyle = '#ef4444'; ctx.fillRect(run.raketX - pw / 2 + 3, PAD_Y - 5, 6, 6); ctx.fillRect(run.raketX + pw / 2 - 9, PAD_Y - 5, 6, 6); }
    if (run.etki.yapiskan > 0) { ctx.fillStyle = 'rgba(245,158,11,.8)'; ctx.fillRect(run.raketX - pw / 2 + 8, PAD_Y - 2, pw - 16, 3); }

    // Toplar ve izleri
    run.toplar.forEach(function (b) {
      if (sk.iz && b.yapisik === null) {
        for (var i = 1; i <= 4; i++) { ctx.globalAlpha = 0.25 - i * 0.05; ctx.fillStyle = sk.iz; ctx.beginPath(); ctx.arc(b.x - b.dx * i * 7, b.y - b.dy * i * 7, R - i, 0, 7); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, 7); ctx.fill();
    });

    // Üst bilgi: kombo, etkiler, mesaj
    ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#fde047';
    if (run.kombo >= 2) ctx.fillText('Kombo x' + Math.min(run.kombo, 5) + (run.kombo > 5 ? ' (' + run.kombo + ')' : ''), 10, 22);
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,.75)';
    var fx = [];
    for (var e in run.etki) if (run.etki[e] > 0) fx.push(CAPS[e].ikon + Math.ceil(run.etki[e]));
    ctx.fillText(fx.join(' ') + '  ⏱️' + Math.floor(run.t), W - 10, 22);
    ctx.textAlign = 'center';
    if (run.mesaj) { ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(run.mesaj.yazi, W / 2, H * 0.62); }
    else if (stuck() && !run.bitti) { ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText('Fırlatmak için dokun veya Boşluk', W / 2, H * 0.72); }
    ctx.restore();

    var b0 = run.toplar[0];
    canvas.dataset.topx = b0 ? Math.round(b0.x) : '';
    canvas.dataset.topy = b0 ? Math.round(b0.y) : '';
    canvas.dataset.raketx = Math.round(run.raketX);
    canvas.dataset.raketw = Math.round(pw);
    canvas.dataset.kalan = run.bricks.filter(function (k) { return k.canli && counts(k); }).length;
  }

  function setText(el, v) { v = String(v); if (el.textContent !== v) el.textContent = v; }
  function hud() {
    if (!run) return;
    setText(lvlEl, mode === 'kampanya' ? run.L.no : mode === 'gunluk' ? run.seri + '/3' : '∞' + run.seri);
    setText(scoreEl, run.puan);
    setText(livesEl, run.can > 0 ? '❤️'.repeat(Math.min(run.can, 5)) : '0');
    livesEl.dataset.can = run.can;
    var key = mode === 'kampanya' ? 'tugla-kirma-' + run.L.no : mode === 'gunluk' ? 'tugla-kirma-gunluk' : 'tugla-kirma-sonsuz';
    setText(bestEl, MiniOyun.getBest(key));
    canvas.dataset.durum = run.bitti ? 'bitti' : stuck() ? 'hazir' : 'oyun';
  }

  // ---------- Harita ----------
  function showMap() {
    mapEl.hidden = false;
    canvas.hidden = true;
    hudEl.hidden = true;
    canvas.dataset.durum = 'harita';
    missionsReady();
    var h = '';
    if (daily) {
      h += '<h2>📅 Günlük meydan okuma · ' + MiniOyun.gunluk.tarih + '</h2><p>Herkese aynı 3 bölüm. Yükseltmeler kapalı, 3 can, en yüksek puanı yap.</p>' +
        '<button class="btn" type="button" data-gunluk="1">Günlük seriyi başlat ▶</button>' +
        '<p class="tk-not">Rekor: ' + MiniOyun.getBest('tugla-kirma-gunluk') + ' puan</p>';
      mapEl.innerHTML = h;
      return;
    }
    h += '<div class="tk-ozet"><span>⭐ ' + totalStars() + ' / 90</span><span class="tk-elmas">💎 ' + save.elmas + '</span></div>';
    WORLDS.forEach(function (w, wi) {
      var lockedWorld = wi > 0 && !open(wi * 10 + 1);
      h += '<h2>' + w.ikon + ' ' + w.ad + ' <small>⭐ ' + worldStars(wi) + ' / 30' + (wi < 2 ? ' · sonraki dünya için 15 ⭐' : '') + '</small></h2><div class="tk-bolumler">';
      for (var n = wi * 10 + 1; n <= wi * 10 + 10; n++) {
        var o = open(n), s = stars(n);
        h += '<button type="button" class="tk-bolum' + (o ? '' : ' kilitli') + (n % 10 === 0 ? ' patron' : '') + '" data-bolum="' + n + '"' + (o ? '' : ' disabled') +
          ' aria-label="Bölüm ' + n + (o ? ', ' + s + ' yıldız' : ', kilitli') + '"><b>' + (n % 10 === 0 ? '🏰' : n) + '</b><span>' + (o ? '★★★'.slice(0, s) + '☆☆☆'.slice(s) : '🔒') + '</span></button>';
      }
      h += '</div>';
      if (lockedWorld && wi === 1 && stars(10)) h += '<p class="tk-not">Çöl için Orman\'da 15 yıldız gerekiyor.</p>';
    });
    h += '<button type="button" class="btn tk-sonsuz" data-sonsuz="1"' + (endlessOpen() ? '' : ' disabled') + '>♾️ Sonsuz Mod' + (endlessOpen() ? ' · rekor ' + save.sonsuzRekor : ' (30. bölümden sonra)') + '</button>';
    h += '<h2>🛠️ Yükseltmeler</h2><div class="tk-yukseltmeler">';
    UPGRADES.forEach(function (u) {
      var l = Number(save.yukseltme[u.id]) || 0, max = u.bedel.length, cost = u.bedel[l];
      h += '<button type="button" class="tk-yuk" data-yuk="' + u.id + '"' + (l >= max || save.elmas < cost ? ' disabled' : '') + '><span class="tk-y-ikon" aria-hidden="true">' + u.ikon + '</span><span><b>' + u.ad + ' ' + '●'.repeat(l) + '○'.repeat(max - l) + '</b><small>' + u.aciklama + '</small></span><span class="tk-y-bedel">' + (l >= max ? 'Tam' : cost + ' 💎') + '</span></button>';
    });
    h += '</div><h2>🎨 Raket ve top izi</h2><div class="tk-gorunum">';
    SKINS.forEach(function (s) {
      var o = skinOpen(s);
      h += '<button type="button" class="tk-skin' + (skin().id === s.id ? ' secili' : '') + '" data-skin="' + s.id + '"' + (o ? '' : ' disabled') + ' style="--s1:' + s.renk[0] + ';--s2:' + s.renk[1] + '"><i></i>' + s.ad + (o ? '' : ' 🔒 ' + s.acilis + '. bölüm') + '</button>';
    });
    h += '</div><h2>📋 Günlük görevler</h2><ul class="tk-gorevler">';
    save.gorev.liste.forEach(function (id) {
      var m = mission(id), done = save.gorev.tamam.indexOf(id) !== -1;
      h += '<li class="tk-gorev' + (done ? ' tamam' : '') + '">' + (done ? '✅ ' : '🎯 ') + m.ad + ' <small>' + Math.min(save.gorev.ilerleme[id] || 0, m.hedef) + '/' + m.hedef + ' · +' + m.odul + ' 💎</small></li>';
    });
    h += '</ul>';
    mapEl.innerHTML = h;
  }
  mapEl.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled || MiniOyun.duraklatildi()) return;
    if (b.dataset.bolum) startCampaign(Number(b.dataset.bolum));
    else if (b.dataset.gunluk) startDaily();
    else if (b.dataset.sonsuz) startEndless();
    else if (b.dataset.yuk) {
      var u = UPGRADES.filter(function (x) { return x.id === b.dataset.yuk; })[0], l = Number(save.yukseltme[u.id]) || 0;
      if (l < u.bedel.length && save.elmas >= u.bedel[l]) { save.elmas -= u.bedel[l]; save.yukseltme[u.id] = l + 1; store(); MiniOyun.ses('puan'); showMap(); }
    } else if (b.dataset.skin) { save.secili.raket = b.dataset.skin; store(); showMap(); }
  });
  mapBtn.addEventListener('click', function () {
    if (MiniOyun.duraklatildi()) return;
    if (run) run.bitti = true;
    showMap();
  });

  // ---------- Girişler ----------
  function playing() { return run && !run.bitti && !canvas.hidden && !MiniOyun.duraklatildi(); }
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.sol = true;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.sag = true;
    else if (k === ' ' || k === 'Spacebar') { if (!playing()) return; if (!launch()) fire(); hud(); }
    else return;
    if (playing()) { pointerUsed = false; e.preventDefault(); }
  });
  document.addEventListener('keyup', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.sol = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.sag = false;
  });
  function pointerX(e) {
    var r = canvas.getBoundingClientRect();
    return (e.clientX - r.left) * W / r.width;
  }
  var downAt = null;
  var lastPointer = '';
  canvas.addEventListener('pointermove', function (e) {
    // Tarayıcının yerleşim değişince gönderdiği yerinde duran fare olaylarını yok say (klavyeyle oynayana karışmasın)
    var at = e.clientX + ',' + e.clientY;
    if (!playing() || at === lastPointer) return;
    lastPointer = at;
    pointerUsed = true;
    run.raketX = pointerX(e);
  });
  canvas.addEventListener('pointerdown', function (e) {
    if (!playing()) return;
    pointerUsed = true;
    downAt = Date.now();
    run.raketX = pointerX(e);
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  });
  canvas.addEventListener('pointerup', function () {
    if (!playing() || downAt === null) return;
    downAt = null;
    launch();
    hud();
  });

  // ---------- Döngü ----------
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function frame(t) {
    var dt = Math.min(0.033, Math.max(0, (t - last) / 1000));
    last = t;
    if (run && !run.bitti && !canvas.hidden && !paused && !MiniOyun.duraklatildi()) { update(dt); hud(); }
    draw();
    requestAnimationFrame(frame);
  }
  for (var i = 0; i < 60; i++) deco.push({ x: Math.random() * W, y: Math.random() * H, s: 2 + Math.random() * 10 });
  window.addEventListener('resize', resize);

  MiniOyun.oyun({
    restart: function () {
      if (mode === 'gunluk' || daily) startDaily();
      else if (mode === 'sonsuz') startEndless();
      else startCampaign(lvNo);
    },
    pause: function () { paused = true; },
    resume: function () { paused = false; },
    canPause: function () { return !!run && !run.bitti && !canvas.hidden; },
    seviye: function () { return mode === 'kampanya' ? 'bölüm ' + lvNo : mode === 'gunluk' ? 'günlük' : 'sonsuz'; }
  });

  showMap();
  resize();
  requestAnimationFrame(function (t) { last = t; frame(t); });
})();

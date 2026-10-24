(function () {
  // Drift Ustası: tek tuşla drift edilen kuşbakışı yarış. 4 dünya x 10 bölüm, bölüm başına 1-3 yıldız,
  // altınla garajda yükseltme, yıldızla açılan arabalar, boya ve lastik izi renkleri, günlük görevler ve
  // günlük modda (?gunluk=) herkese aynı pist. Pist ve araba kuralları motor.js'de. Kayıt: mo_drift.
  var M = window.DriftMotor;
  var W = 480, H = 640;
  var SAVE_KEY = 'mo_drift';
  var reducedMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var BOYALAR = [
    { id: 'kendi', ad: 'Fabrika', renk: null, kosul: 'Başlangıçta açık' },
    { id: 'beyaz', ad: 'Kar beyazı', renk: '#f8fafc', yildiz: 5 },
    { id: 'siyah', ad: 'Gece siyahı', renk: '#27272a', yildiz: 20 },
    { id: 'yesil', ad: 'Zehir yeşili', renk: '#22c55e', yildiz: 45 },
    { id: 'mor', ad: 'Mor şimşek', renk: '#a855f7', yildiz: 75 },
    { id: 'altin', ad: 'Altın', renk: '#eab308', yildiz: 110 },
    { id: 'pembe', ad: 'Seri pembesi', renk: '#ec4899', seri: 7 }
  ];
  var IZLER = [
    { id: 'beyaz', ad: 'Beyaz', renk: 'rgba(255,255,255,.55)' },
    { id: 'gokkusagi', ad: 'Gökkuşağı', renk: 'gokkusagi', yildiz: 30 },
    { id: 'ates', ad: 'Ateş', renk: 'rgba(249,115,22,.75)', yildiz: 60 },
    { id: 'neon', ad: 'Neon', renk: 'rgba(34,211,238,.8)', seri: 7 }
  ];
  var GOREVLER = [
    { id: 'drift20', ad: 'Toplam 20 saniye drift yap', hedef: 20 },
    { id: 'kesintisiz3', ad: '3 saniye kesintisiz drift yap', hedef: 3 },
    { id: 'kilpayi3', ad: '3 Kılpayı! bonusu al', hedef: 3 },
    { id: 'kurtarmasiz2', ad: '2 bölümü kurtarma kullanmadan bitir', hedef: 2 },
    { id: 'altin60', ad: '60 altın topla', hedef: 60 },
    { id: 'yildiz3', ad: 'Bir bölümden 3 yıldız al', hedef: 1 },
    { id: 'bolum3', ad: '3 bölüm bitir', hedef: 3 }
  ];
  var GOREV_ODUL = 100;

  var canvas = document.getElementById('alan');
  var ctx = canvas.getContext('2d');
  var mapEl = document.getElementById('harita');
  var hudEl = document.getElementById('ust');
  var lvlEl = document.getElementById('bolum');
  var timeEl = document.getElementById('sure');
  var coinEl = document.getElementById('altin');
  var multEl = document.getElementById('carpan');
  var mapBtn = document.getElementById('harita-btn');

  var daily = !!(MiniOyun.gunluk && MiniOyun.gunluk.tarih);
  var save = load();
  var run = null, lvNo = 1, held = false, paused = false, last = 0;

  // ---------- Kayıt ----------
  function load() {
    var p = null;
    try { p = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) {}
    if (!p || typeof p !== 'object') p = {};
    if (!p.bolumler || typeof p.bolumler !== 'object') p.bolumler = {};
    if (!p.arabalar || typeof p.arabalar !== 'object') p.arabalar = {};
    if (!Array.isArray(p.alinan)) p.alinan = [];
    p.altin = Math.max(0, Number(p.altin) || 0);
    p.seri = Number(p.seri) || 0;
    if (typeof p.secili !== 'string') p.secili = 'serce';
    if (typeof p.boya !== 'string') p.boya = 'kendi';
    if (typeof p.iz !== 'string') p.iz = 'beyaz';
    return p;
  }
  function store() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
  }
  function stars(n) { var b = save.bolumler[n]; return b ? Number(b.yildiz) || 0 : 0; }
  function worldStars(w) { var s = 0; for (var i = w * 10 + 1; i <= w * 10 + 10; i++) s += stars(i); return s; }
  function totalStars() { var s = 0; for (var i = 1; i <= M.BOLUM_SAYI; i++) s += stars(i); return s; }
  function worldOpen(w) { return w === 0 || (stars(w * 10) > 0 && totalStars() >= M.DUNYALAR[w].esik); }
  function open(n) {
    var w = Math.floor((n - 1) / 10);
    if (!worldOpen(w)) return false;
    return n % 10 === 1 || stars(n - 1) > 0;
  }
  function carById(id) { return M.ARABALAR.filter(function (a) { return a.id === id; })[0]; }
  function carOpen(a) {
    if (a.yildiz) return totalStars() >= a.yildiz;
    if (a.altin) return save.alinan.indexOf(a.id) !== -1;
    if (a.bolum) return stars(a.bolum) > 0;
    return true;
  }
  function selectedCar() { var a = carById(save.secili); return a && carOpen(a) ? a : M.ARABALAR[0]; }
  function upgrades(id) {
    var u = save.arabalar[id];
    if (!u || typeof u !== 'object') u = save.arabalar[id] = { motor: 0, lastik: 0, direksiyon: 0 };
    return u;
  }
  function itemOpen(x) {
    if (x.yildiz) return totalStars() >= x.yildiz;
    if (x.seri) return save.seri >= x.seri;
    return true;
  }
  function pick(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id && itemOpen(list[i])) return list[i]; return list[0]; }

  // ---------- Günlük görevler ----------
  function today() { return MiniOyun.gunluk.bugun(); }
  function missionsReady() {
    var g = save.gorev, d = today();
    if (g && g.gun === d && Array.isArray(g.liste) && g.liste.length === 3 && g.ilerleme && Array.isArray(g.tamam)) return;
    var rnd = MiniOyun.gunluk.rastgele(d + '/drift-gorev');
    var pool = GOREVLER.map(function (m) { return m.id; }), list = [];
    while (list.length < 3) list.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    save.gorev = { gun: d, liste: list, ilerleme: {}, tamam: [], odul: false };
    list.forEach(function (id) { save.gorev.ilerleme[id] = 0; });
    store();
  }
  function mission(id) { for (var i = 0; i < GOREVLER.length; i++) if (GOREVLER[i].id === id) return GOREVLER[i]; }
  function dayBefore(d) { var t = new Date(d + 'T12:00:00'); t.setDate(t.getDate() - 1); return iso(t); }
  function iso(t) { return t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2); }
  // Görev ilerlemesi; "en az" türündekiler için set=true
  function progressMission(id, n, set) {
    if (!run || run.mod !== 'kampanya') return;
    missionsReady();
    var g = save.gorev;
    if (g.liste.indexOf(id) === -1 || g.tamam.indexOf(id) !== -1) return;
    var m = mission(id);
    g.ilerleme[id] = set ? Math.max(g.ilerleme[id] || 0, n) : (g.ilerleme[id] || 0) + n;
    if (g.ilerleme[id] >= m.hedef) {
      g.tamam.push(id);
      flash('✅ Görev tamam: ' + m.ad);
      MiniOyun.ses('puan');
      if (g.tamam.length === 3 && !g.odul) {
        g.odul = true;
        save.altin += GOREV_ODUL;
        save.seri = save.sonGun === dayBefore(g.gun) ? save.seri + 1 : save.sonGun === g.gun ? save.seri : 1;
        save.sonGun = g.gun;
        flash('🎁 Günlük görevler bitti: +' + GOREV_ODUL + ' 🪙, seri ' + save.seri);
      }
    }
    store();
  }

  // ---------- Bölüm başlatma ----------
  function startLevel(n) {
    lvNo = n;
    var P = M.pist(M.ayar(n)), car = selectedCar();
    begin(P, 'kampanya', car, M.arabaDeger(car.id, upgrades(car.id)));
  }
  function startDaily() {
    var P = M.pist(M.gunlukAyar(MiniOyun.rastgele()));
    begin(P, 'gunluk', M.ARABALAR[0], M.arabaDeger('serce', {}));
  }
  function begin(P, mod, car, stats) {
    held = false;
    var boya = pick(BOYALAR, save.boya), iz = pick(IZLER, save.iz);
    run = {
      P: P, mod: mod, st: M.yeni(P, stats), car: car, renk: mod === 'gunluk' || !boya.renk ? car.renk : boya.renk,
      izRenk: mod === 'gunluk' ? IZLER[0].renk : iz.renk, geri: 1.2, izler: [], duman: [], yazilar: [],
      sarsinti: 0, okParla: 0, yon: P.noktalar[0].yon, egitim: P.ayar.no === 1 ? 1 : 0, bitti: false, bitis: 0, konfeti: []
    };
    deco(P);
    canvas.hidden = false; hudEl.hidden = false; mapEl.hidden = true;
    canvas.dataset.pist = P.parcalar + '|' + P.engeller.filter(function (e) { return e.tip === 'altin'; }).map(function (e) { return e.i + ':' + Math.round(e.lat); }).join(',');
    canvas.dataset.n = P.noktalar.length;
    canvas.dataset.hedef = P.hedef;
    try { canvas.focus({ preventScroll: true }); } catch (e) {}
    if (canvas.scrollIntoView) canvas.scrollIntoView({ block: 'nearest' });
    hud();
  }

  // Pist çevresi süsleri (ağaç, kaya, buz, bina): pist numarasına bağlı sabit
  var decos = [];
  function deco(P) {
    decos = [];
    var rnd = M.tohum('drift-sus-' + P.ayar.no + '-' + P.parcalar.length), N = P.noktalar;
    for (var i = 0; i < N.length; i += 6) {
      for (var s = -1; s <= 1; s += 2) {
        if (rnd() < 0.45) continue;
        var q = N[i], d = q.w / 2 + 22 + rnd() * 110;
        var x = q.x + Math.sin(q.h) * d * s, y = q.y - Math.cos(q.h) * d * s;
        // Pistin başka bir yerine denk gelen süsleri atla
        var ok = true;
        for (var j = Math.max(0, i - 120); j < Math.min(N.length, i + 120) && ok; j += 3) {
          var dx = N[j].x - x, dy = N[j].y - y;
          if (dx * dx + dy * dy < Math.pow(N[j].w / 2 + 16, 2)) ok = false;
        }
        if (ok) decos.push({ x: x, y: y, r: 8 + rnd() * 12, t: rnd() });
      }
    }
  }

  function flash(text, x, y) {
    if (!run) return;
    run.yazilar.push({ yazi: text, x: x, y: y, t: x === undefined ? 2.2 : 1 });
  }

  // ---------- Güncelleme ----------
  function update(dt) {
    var st = run.st;
    if (run.geri > 0) { run.geri -= dt; if (run.geri <= 0) MiniOyun.ses('tik'); return; }
    var wasDrift = st.driftT;
    M.ilerlet(st, held, dt);
    if (held) progressMission('kesintisiz3', st.driftT, true);
    if (wasDrift > 0 && !held) progressMission('drift20', wasDrift);
    if (run.egitim === 1 && held) run.egitim = 2;
    else if (run.egitim === 2 && !held) run.egitim = 3;
    if (st.yon !== run.yon) { run.yon = st.yon; run.okParla = 1; }
    run.okParla = Math.max(0, run.okParla - dt);
    run.sarsinti = Math.max(0, run.sarsinti - dt);
    st.olaylar.forEach(function (e) {
      if (e.tip === 'altin') { MiniOyun.ses('tik'); progressMission('altin60', 1); if (run.egitim === 3) run.egitim = 0; }
      else if (e.tip === 'kilpayi') { MiniOyun.ses('puan'); flash('Kılpayı! +100', st.x, st.y - 20); progressMission('kilpayi3', 1); }
      else if (e.tip === 'yag') flash('🛢️ Kaygan!', st.x, st.y - 20);
      else if (e.tip === 'hiz') { MiniOyun.ses('puan'); flash('🚦 Hız!', st.x, st.y - 20); }
      else if (e.tip === 'kapali') flash('Kapı kapalı', st.x, st.y - 20);
      else if (e.tip === 'kurtarma') { MiniOyun.ses('kaybet'); run.sarsinti = 0.2; flash('🛟 Kurtarma hakkı kullanıldı'); held = false; }
      else if (e.tip === 'kaza') { MiniOyun.ses('kaybet'); run.sarsinti = 0.2; }
    });
    st.olaylar = [];
    // Lastik izi ve duman
    if (held && st.v > 40) {
      var bx = -Math.cos(st.a) * 9, by = -Math.sin(st.a) * 9, sx = Math.sin(st.a) * 5, sy = -Math.cos(st.a) * 5;
      run.izler.push({ x1: st.x + bx + sx, y1: st.y + by + sy, x2: st.x + bx - sx, y2: st.y + by - sy, t: 0, h: run.izler.length });
      if (!reducedMotion && Math.random() < 0.5) run.duman.push({ x: st.x + bx, y: st.y + by, r: 3, t: 0.6 });
    }
    if (run.izler.length > 500) run.izler.splice(0, run.izler.length - 500);
    run.duman = run.duman.filter(function (d) { d.t -= dt; d.r += dt * 14; return d.t > 0; });
    run.yazilar = run.yazilar.filter(function (y) { y.t -= dt; return y.t > 0; });
    if (st.bitti && !run.bitti) finish();
  }

  function finish() {
    var st = run.st, P = run.P;
    run.bitti = true;
    held = false;
    if (run.mod === 'gunluk') return finishDaily();
    var L = P.ayar, n = L.no, sn = Math.round(st.t * 10) / 10, snTxt = String(sn.toFixed(1)).replace('.', ',');
    var coinGain = st.altin;
    if (st.kaybetti) {
      save.altin += coinGain;
      store();
      hud();
      MiniOyun.bitti({
        baslik: 'Yoldan çıktın!',
        metin: 'Bölüm ' + n + ' kaybedildi. Pistin %' + Math.round(st.i / P.noktalar.length * 100) + '\'ini geçtin' + (coinGain ? ', ' + coinGain + ' 🪙 topladın' : '') + '. Virajdan hemen önce basmaya başla, yön tamamlanınca bırak.',
        kaybetti: true
      });
      showMap();
      return;
    }
    run.konfeti = makeConfetti();
    var y = M.yildiz(st), old = stars(n), pts = M.puan(st), before = totalStars();
    var b = save.bolumler[n] || (save.bolumler[n] = { yildiz: 0 });
    b.yildiz = Math.max(old, y);
    b.enIyiSn = b.enIyiSn ? Math.min(b.enIyiSn, sn) : sn;
    b.enIyiPuan = Math.max(Number(b.enIyiPuan) || 0, pts);
    var newStars = Math.max(0, y - old), bonus = 10 + newStars * 15;
    save.altin += coinGain + bonus;
    progressMission('bolum3', 1);
    if (!st.kurtarmaKullandi) progressMission('kurtarmasiz2', 1);
    if (y === 3) progressMission('yildiz3', 1);
    store();
    var unlocked = unlocks(before, totalStars(), n);
    var rec = MiniOyun.setBest('drift-ustasi-' + n, Math.max(1, Math.round(sn)), true);
    hud();
    MiniOyun.bitti({
      baslik: 'Bölüm ' + n + ' bitti! ' + '★★★'.slice(0, y) + '☆☆☆'.slice(y),
      metin: snTxt + ' sn (hedef ' + P.hedef + ' sn), ' + pts + ' puan, ' + st.altin + '/' + P.altinSayi + ' altın. +' + (coinGain + bonus) + ' 🪙.' +
        (unlocked.length ? ' Açıldı: ' + unlocked.join(', ') + '.' : '') +
        (y < 2 ? ' 2 yıldız için ' + P.hedef + ' sn altında bitir.' : y < 3 ? ' 3 yıldız için altınların %80\'ini topla ve kurtarma kullanma.' : ''),
      rekor: rec, skor: Math.max(1, Math.round(sn)), sonuc: snTxt + ' sn', seviye: 'bölüm ' + n,
      paylas: 'Drift Ustası ' + n + '. bölümü ' + y + ' yıldızla ' + snTxt + ' saniyede bitirdim!'
    });
    showMap();
  }
  function unlocks(before, after, n) {
    var list = [];
    M.ARABALAR.forEach(function (a) {
      if (a.yildiz && before < a.yildiz && after >= a.yildiz) list.push(a.ikon + ' ' + a.ad);
      if (a.bolum === n && stars(n) && list.indexOf(a.ikon + ' ' + a.ad) === -1 && before !== after) list.push(a.ikon + ' ' + a.ad);
    });
    BOYALAR.concat(IZLER).forEach(function (x) { if (x.yildiz && before < x.yildiz && after >= x.yildiz) list.push(x.ad + ' rengi'); });
    for (var w = 1; w < M.DUNYA_SAYI; w++) if (n === w * 10 && worldOpen(w) && before !== after) list.push(M.DUNYALAR[w].ikon + ' ' + M.DUNYALAR[w].ad);
    return list;
  }
  function finishDaily() {
    var st = run.st;
    hud();
    if (st.kaybetti) {
      MiniOyun.bitti({ baslik: 'Yoldan çıktın!', metin: 'Günlük pistte kurtarma hakkı yok. Tekrar dene, süren ancak bitirince sayılır.', kaybetti: true });
      return;
    }
    run.konfeti = makeConfetti();
    var sure = Math.max(1, Math.round((st.t - st.altin * 0.2) * 10) / 10), txt = sure.toFixed(1).replace('.', ',');
    var rec = MiniOyun.setBest('drift-ustasi-gunluk', Math.max(1, Math.round(sure)), true);
    MiniOyun.setBest('drift-ustasi', Math.max(1, Math.round(sure)), true);
    MiniOyun.bitti({
      baslik: 'Günlük pist bitti!',
      metin: st.t.toFixed(1).replace('.', ',') + ' sn sürüş, ' + st.altin + ' altın (her biri -0,2 sn). Süren: ' + txt + ' sn.',
      rekor: rec, skor: Math.max(1, Math.round(sure)), sonuc: txt + ' sn', seviye: 'günlük',
      paylas: 'Drift Ustası günlük pistini ' + txt + ' saniyede bitirdim!'
    });
  }
  function makeConfetti() {
    if (reducedMotion) return [];
    var l = [], cols = ['#facc15', '#ef4444', '#22c55e', '#3b82f6', '#f472b6'];
    for (var i = 0; i < 60; i++) l.push({ x: Math.random() * W, y: -Math.random() * 200, v: 80 + Math.random() * 120, c: cols[i % cols.length], r: Math.random() * 6 });
    return l;
  }

  // ---------- Çizim ----------
  function draw() {
    ctx.save();
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    if (!run) { ctx.fillStyle = '#0d0b1f'; ctx.fillRect(0, 0, W, H); ctx.restore(); return; }
    var st = run.st, P = run.P, D = M.DUNYALAR[P.ayar.dunya], N = P.noktalar;
    ctx.fillStyle = D.zemin;
    ctx.fillRect(0, 0, W, H);
    var camX = st.x + Math.cos(st.k) * 70, camY = st.y + Math.sin(st.k) * 70;
    var shake = run.sarsinti > 0 && !reducedMotion ? (Math.random() - 0.5) * 8 : 0;
    ctx.translate(W / 2 - camX + shake, H * 0.46 - camY + shake);
    var vx0 = camX - W / 2 - 60, vx1 = camX + W / 2 + 60, vy0 = camY - H * 0.46 - 60, vy1 = camY + H * 0.54 + 60;
    function inView(x, y) { return x > vx0 && x < vx1 && y > vy0 && y < vy1; }
    // Süsler
    decos.forEach(function (d) {
      if (!inView(d.x, d.y)) return;
      ctx.beginPath();
      if (D.id === 'orman') { ctx.fillStyle = d.t < 0.5 ? '#15803d' : '#166534'; ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fill(); }
      else if (D.id === 'col') { ctx.fillStyle = d.t < 0.5 ? '#d97706' : '#b45309'; ctx.ellipse(d.x, d.y, d.r, d.r * 0.6, d.t * 3, 0, 7); ctx.fill(); }
      else if (D.id === 'kar') { ctx.fillStyle = d.t < 0.5 ? 'rgba(125,211,252,.55)' : '#cbd5e1'; ctx.moveTo(d.x, d.y - d.r); ctx.lineTo(d.x + d.r, d.y + d.r * 0.7); ctx.lineTo(d.x - d.r, d.y + d.r * 0.7); ctx.fill(); }
      else { ctx.fillStyle = '#312e81'; ctx.fillRect(d.x - d.r, d.y - d.r, d.r * 2, d.r * 2); ctx.fillStyle = d.t < 0.5 ? '#f472b6' : '#22d3ee'; ctx.fillRect(d.x - d.r + 3, d.y - 2, d.r * 2 - 6, 3); }
    });
    // Pist: görünür örnekleri genişliği aynı olan parçalar halinde çiz
    var i0 = Math.max(0, st.i - 160), i1 = Math.min(N.length - 1, st.i + 220);
    function path(a, b) { ctx.beginPath(); ctx.moveTo(N[a].x, N[a].y); for (var j = a + 1; j <= b; j++) ctx.lineTo(N[j].x, N[j].y); }
    function runs(fn) {
      var a = i0;
      for (var j = i0 + 1; j <= i1; j++) {
        if (j === i1 || Math.round(N[j].w) !== Math.round(N[a].w) || N[j].buz !== N[a].buz) { fn(a, j, N[a]); a = j; }
      }
    }
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    runs(function (a, b, q) { path(a, b); ctx.strokeStyle = q.kopru ? '#78350f' : '#f8fafc'; ctx.lineWidth = q.w + 10; ctx.stroke(); });
    ctx.setLineDash([14, 14]);
    runs(function (a, b, q) { if (q.kopru) return; path(a, b); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = q.w + 10; ctx.stroke(); });
    ctx.setLineDash([]);
    runs(function (a, b, q) { path(a, b); ctx.strokeStyle = q.buz ? '#93c5fd' : q.kopru ? '#a16207' : '#3f3f46'; ctx.lineWidth = q.w; ctx.stroke(); });
    ctx.setLineDash([12, 16]);
    path(i0, i1); ctx.strokeStyle = 'rgba(250,204,21,.8)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineCap = 'butt';
    // Başlangıç ve bitiş çizgisi
    [8, N.length - 2].forEach(function (j, k) {
      var q = N[j];
      if (!inView(q.x, q.y)) return;
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.h + Math.PI / 2);
      for (var c = 0; c < 10; c++) for (var r = 0; r < 2; r++) {
        ctx.fillStyle = (c + r) % 2 ? '#111' : '#fff';
        if (k === 0 && (c + r) % 2) ctx.fillStyle = '#52525b';
        ctx.fillRect(-q.w / 2 + c * q.w / 10, -6 + r * 6, q.w / 10, 6);
      }
      ctx.restore();
    });
    // Engeller ve altınlar
    P.engeller.forEach(function (g, e) {
      if (!inView(g.x, g.y)) return;
      if (g.tip === 'altin') {
        if (st.alinan[e]) return;
        ctx.beginPath(); ctx.arc(g.x, g.y, 7, 0, 7); ctx.fillStyle = '#facc15'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#a16207'; ctx.stroke();
      } else if (g.tip === 'yag') {
        ctx.beginPath(); ctx.ellipse(g.x, g.y, 17, 11, g.i, 0, 7); ctx.fillStyle = 'rgba(17,17,17,.85)'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(g.x - 4, g.y - 3, 5, 3, 0, 0, 7); ctx.fillStyle = 'rgba(147,51,234,.5)'; ctx.fill();
      } else if (g.tip === 'bariyer') {
        var q = N[g.i];
        ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(q.h + Math.PI / 2);
        for (var s = 0; s < 4; s++) { ctx.fillStyle = s % 2 ? '#f8fafc' : '#f97316'; ctx.fillRect(-14 + s * 7, -6, 7, 12); }
        ctx.restore();
      } else if (g.tip === 'kapi') {
        var qq = N[g.i], acik = M.kapiAcik(g, st.t);
        ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(qq.h + Math.PI / 2);
        ctx.fillStyle = acik ? 'rgba(34,197,94,.45)' : 'rgba(239,68,68,.55)';
        ctx.fillRect(-qq.w / 2, -5, qq.w, 10);
        ctx.fillStyle = '#18181b'; ctx.fillRect(-qq.w / 2 - 6, -7, 6, 14); ctx.fillRect(qq.w / 2, -7, 6, 14);
        ctx.restore();
      }
    });
    // Lastik izleri
    var n = run.izler.length;
    run.izler.forEach(function (z, k) {
      var alpha = k / n;
      ctx.strokeStyle = run.izRenk === 'gokkusagi' ? 'hsla(' + (z.h * 7 % 360) + ',90%,60%,' + alpha * 0.8 + ')' : run.izRenk;
      ctx.globalAlpha = run.izRenk === 'gokkusagi' ? 1 : alpha;
      ctx.lineWidth = 3;
      if (k > 0 && Math.abs(run.izler[k - 1].x1 - z.x1) + Math.abs(run.izler[k - 1].y1 - z.y1) < 12) {
        var p = run.izler[k - 1];
        ctx.beginPath(); ctx.moveTo(p.x1, p.y1); ctx.lineTo(z.x1, z.y1); ctx.moveTo(p.x2, p.y2); ctx.lineTo(z.x2, z.y2); ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
    run.duman.forEach(function (d) { ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fillStyle = 'rgba(203,213,225,' + d.t * 0.6 + ')'; ctx.fill(); });
    // Araba
    ctx.save();
    ctx.translate(st.x, st.y);
    ctx.rotate(st.a + Math.PI / 2 + (st.kaybetti ? run.st.t * 6 : 0));
    if (st.dokunulmaz > 0 && Math.floor(st.dokunulmaz * 10) % 2) ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#111';
    [[-9, -9], [5, -9], [-9, 4], [5, 4]].forEach(function (t) { ctx.fillRect(t[0], t[1], 4, 7); });
    ctx.fillStyle = run.renk;
    roundRect(-7, -12, 14, 24, 4); ctx.fill();
    ctx.fillStyle = 'rgba(15,23,42,.85)';
    roundRect(-5, -6, 10, 7, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-1, -12, 2, 24);
    ctx.restore();
    // Uçan yazılar (dünyada)
    ctx.font = 'bold 15px system-ui, sans-serif'; ctx.textAlign = 'center';
    run.yazilar.forEach(function (y) {
      if (y.x === undefined) return;
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillText(y.yazi, y.x + 1, y.y - (1 - y.t) * 30 + 1);
      ctx.fillStyle = '#fde047'; ctx.fillText(y.yazi, y.x, y.y - (1 - y.t) * 30);
    });
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    // Yön oku
    var ok = run.yon > 0 ? '↺' : '↻';
    ctx.beginPath(); ctx.arc(W / 2, 34, 24, 0, 7);
    ctx.fillStyle = run.okParla > 0 && Math.floor(run.okParla * 8) % 2 ? '#facc15' : 'rgba(13,11,31,.75)'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 30px system-ui, sans-serif'; ctx.textBaseline = 'middle';
    ctx.fillText(ok, W / 2, 36);
    ctx.font = 'bold 12px system-ui, sans-serif'; ctx.fillText(T(run.yon > 0 ? 'SOL' : 'SAĞ'), W / 2, 70);
    // Ekran yazıları
    ctx.font = 'bold 18px system-ui, sans-serif';
    var msgs = run.yazilar.filter(function (y) { return y.x === undefined; });
    msgs.slice(-2).forEach(function (y, k) { banner(y.yazi, H - 40 - k * 36); });
    if (run.geri > 0) { ctx.font = 'bold 54px system-ui, sans-serif'; banner(run.geri > 0.5 ? 'Hazır…' : 'Başla!', H / 2 - 40); }
    else if (run.egitim) {
      ctx.font = 'bold 17px system-ui, sans-serif';
      banner(run.egitim === 1 ? '1/3 · Basılı tut = drift (oktaki yöne)' : run.egitim === 2 ? '2/3 · Bırak = araba düzelir' : '3/3 · Sarı altınları topla 🪙', 110);
    }
    if (st.dokunulmaz > 0 && !st.bitti) { ctx.font = 'bold 16px system-ui, sans-serif'; banner('🛟 Kurtarıldın!', 150); }
    run.konfeti.forEach(function (c) { ctx.fillStyle = c.c; ctx.fillRect(c.x, c.y, 6, 9); });
    if (paused) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  }
  // Canvas metinleri DOM'da olmadığından çeviri sözlüğünden geçirilir
  function T(s) { return window.MO_DIL && MO_DIL.t ? MO_DIL.t(s) : s; }
  function banner(text, y) {
    text = T(text);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var w = ctx.measureText(text).width + 28;
    ctx.fillStyle = 'rgba(13,11,31,.78)';
    roundRect(W / 2 - w / 2, y - 20, w, 40, 12); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(text, W / 2, y + 1);
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function setText(el, v) { v = String(v); if (el.textContent !== v) el.textContent = v; }
  function hud() {
    if (!run) return;
    var st = run.st;
    setText(lvlEl, run.mod === 'gunluk' ? 'Günlük' : run.P.ayar.no);
    setText(timeEl, st.t.toFixed(1).replace('.', ','));
    timeEl.style.color = st.t <= run.P.hedef ? '#4ade80' : '#f87171';
    setText(coinEl, st.altin + '/' + run.P.altinSayi);
    var c = st.driftT >= 2 ? 3 : st.driftT >= 1 ? 2 : held ? 1 : 0;
    setText(multEl, c ? 'x' + c : '-');
    multEl.style.fontSize = c ? (0.9 + c * 0.15) + 'rem' : '';
    canvas.dataset.durum = run.bitti ? (st.kaybetti ? 'kaybetti' : 'bitti') : run.geri > 0 ? 'hazir' : 'oyun';
    canvas.dataset.i = st.i;
    canvas.dataset.yon = st.yon;
    canvas.dataset.altin = st.altin;
    canvas.dataset.kurtarma = st.kurtarmaKullandi ? '1' : '0';
    canvas.dataset.basili = held ? '1' : '0';
    canvas.dataset.v = Math.round(st.v);
    canvas.dataset.t = st.t.toFixed(2);
    canvas.dataset.bot = !run.bitti && M.bot(st) ? '1' : '0';
  }

  // ---------- Harita ve garaj ----------
  function stars3(s) { return '★★★'.slice(0, s) + '☆☆☆'.slice(s); }
  function showMap() {
    mapEl.hidden = false;
    canvas.hidden = true;
    hudEl.hidden = true;
    canvas.dataset.durum = 'harita';
    missionsReady();
    var h = '';
    if (daily) {
      h += '<h2>📅 Günlük pist · ' + MiniOyun.gunluk.tarih + '</h2><p>Herkese aynı pist ve yükseltmesiz Serçe. Kurtarma hakkı yok; her altın süreni 0,2 sn azaltır.</p>' +
        '<button class="btn" type="button" data-gunluk="1">Günlük pisti başlat ▶</button>' +
        '<p>En iyi süren: ' + (MiniOyun.getBest('drift-ustasi-gunluk') || '-') + ' sn</p>';
      mapEl.innerHTML = h;
      return;
    }
    var car = selectedCar(), u = upgrades(car.id);
    h += '<div class="du-ozet"><span>⭐ ' + totalStars() + ' / 120</span><span class="du-altin">🪙 ' + save.altin + '</span><span>🔥 Seri ' + save.seri + '</span></div>';
    M.DUNYALAR.forEach(function (w, wi) {
      var wo = worldOpen(wi);
      h += '<h2>' + w.ikon + ' ' + w.ad + ' <small>⭐ ' + worldStars(wi) + ' / 30' + (!wo ? ' · 🔒 ' + M.DUNYALAR[wi - 1].ad + '\'nu bitir + ' + w.esik + ' ⭐' : '') + '</small></h2><div class="du-bolumler">';
      for (var n = wi * 10 + 1; n <= wi * 10 + 10; n++) {
        var o = open(n), s = stars(n), b = save.bolumler[n];
        h += '<button type="button" class="du-bolum d' + wi + (o ? '' : ' kilitli') + '" data-bolum="' + n + '"' + (o ? '' : ' disabled') +
          ' aria-label="Bölüm ' + n + (o ? ', ' + s + ' yıldız' : ', kilitli') + '"><b>' + n + '</b><span>' + (o ? stars3(s) : '🔒') + '</span>' +
          (b && b.enIyiSn ? '<small>' + String(b.enIyiSn.toFixed(1)).replace('.', ',') + ' sn</small>' : '') + '</button>';
      }
      h += '</div>';
    });
    h += '<h2>🏁 Garaj</h2><div class="du-arabalar">';
    M.ARABALAR.forEach(function (a) {
      var o = carOpen(a), sel = car.id === a.id, buy = !o && a.altin;
      h += '<button type="button" class="du-araba' + (sel ? ' secili' : '') + '" data-araba="' + a.id + '"' + (o || (buy && save.altin >= a.altin) ? '' : ' disabled') + '>' +
        '<span class="du-a-ikon" aria-hidden="true">' + a.ikon + '</span><span><b>' + a.ad + (sel ? ' ✓' : '') + '</b><small>' + (o ? statLine(a) : (buy ? 'Satın al: ' + a.altin + ' 🪙' : '🔒 ' + a.acilis)) + '</small></span></button>';
    });
    h += '</div><h3>' + car.ikon + ' ' + car.ad + ' yükseltmeleri</h3><div class="du-yukseltmeler">';
    M.YUKSELTMELER.forEach(function (y) {
      var l = Number(u[y.id]) || 0, max = M.BEDEL.length, cost = M.BEDEL[l];
      h += '<button type="button" class="du-yuk" data-yuk="' + y.id + '"' + (l >= max || save.altin < cost ? ' disabled' : '') + '><span class="du-a-ikon" aria-hidden="true">' + y.ikon + '</span><span><b>' + y.ad + ' ' + '●'.repeat(l) + '○'.repeat(max - l) + '</b><small>' + y.aciklama + ' / seviye</small></span><span class="du-bedel">' + (l >= max ? 'Tam' : cost + ' 🪙') + '</span></button>';
    });
    h += '</div><h3>🎨 Boya</h3><div class="du-renkler">';
    BOYALAR.forEach(function (b) {
      var o = itemOpen(b), sel = pick(BOYALAR, save.boya).id === b.id;
      h += '<button type="button" class="du-renk' + (sel ? ' secili' : '') + '" data-boya="' + b.id + '"' + (o ? '' : ' disabled') + '><i style="background:' + (b.renk || car.renk) + '"></i>' + b.ad + (o ? '' : ' 🔒 ' + (b.yildiz ? b.yildiz + ' ⭐' : b.seri + ' gün seri')) + '</button>';
    });
    h += '</div><h3>〰️ Lastik izi</h3><div class="du-renkler">';
    IZLER.forEach(function (z) {
      var o = itemOpen(z), sel = pick(IZLER, save.iz).id === z.id;
      h += '<button type="button" class="du-renk' + (sel ? ' secili' : '') + '" data-iz="' + z.id + '"' + (o ? '' : ' disabled') + '><i style="background:' + (z.renk === 'gokkusagi' ? 'linear-gradient(90deg,#ef4444,#facc15,#22c55e,#3b82f6,#a855f7)' : z.renk) + '"></i>' + z.ad + (o ? '' : ' 🔒 ' + (z.yildiz ? z.yildiz + ' ⭐' : z.seri + ' gün seri')) + '</button>';
    });
    h += '</div><h2>📋 Günlük görevler <small>üçü bitince +' + GOREV_ODUL + ' 🪙</small></h2><ul class="du-gorevler">';
    save.gorev.liste.forEach(function (id) {
      var m = mission(id), done = save.gorev.tamam.indexOf(id) !== -1, p = Math.min(save.gorev.ilerleme[id] || 0, m.hedef);
      h += '<li class="du-gorev' + (done ? ' tamam' : '') + '">' + (done ? '✅ ' : '🎯 ') + m.ad + ' <small>' + (m.hedef >= 10 || id === 'kesintisiz3' ? Math.floor(p) : p) + '/' + m.hedef + '</small></li>';
    });
    h += '</ul>';
    mapEl.innerHTML = h;
  }
  function statLine(a) {
    var d = M.arabaDeger(a.id, upgrades(a.id));
    return 'Hız ' + Math.round(d.v) + ' · Tutuş ' + d.tutus.toFixed(1) + ' · Dönüş ' + Math.round(d.donus * 57) + '°/sn';
  }
  mapEl.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled || MiniOyun.duraklatildi()) return;
    if (b.dataset.bolum) startLevel(Number(b.dataset.bolum));
    else if (b.dataset.gunluk) startDaily();
    else if (b.dataset.araba) {
      var a = carById(b.dataset.araba);
      if (!carOpen(a) && a.altin && save.altin >= a.altin) { save.altin -= a.altin; save.alinan.push(a.id); MiniOyun.ses('puan'); }
      if (carOpen(a)) save.secili = a.id;
      store(); showMap();
    } else if (b.dataset.yuk) {
      var car = selectedCar(), u = upgrades(car.id), l = Number(u[b.dataset.yuk]) || 0;
      if (l < M.BEDEL.length && save.altin >= M.BEDEL[l]) { save.altin -= M.BEDEL[l]; u[b.dataset.yuk] = l + 1; store(); MiniOyun.ses('puan'); showMap(); }
    } else if (b.dataset.boya) { save.boya = b.dataset.boya; store(); showMap(); }
    else if (b.dataset.iz) { save.iz = b.dataset.iz; store(); showMap(); }
  });
  // Haritada ok tuşlarıyla bölümler arasında gezinme
  mapEl.addEventListener('keydown', function (e) {
    var b = e.target.closest && e.target.closest('.du-bolum');
    if (!b) return;
    var all = Array.prototype.slice.call(mapEl.querySelectorAll('.du-bolum:not(.kilitli)')), i = all.indexOf(b), d = 0;
    if (e.key === 'ArrowRight') d = 1; else if (e.key === 'ArrowLeft') d = -1; else if (e.key === 'ArrowDown') d = 5; else if (e.key === 'ArrowUp') d = -5;
    if (!d) return;
    e.preventDefault();
    var t = all[Math.max(0, Math.min(all.length - 1, i + d))];
    if (t) t.focus();
  });
  mapBtn.addEventListener('click', function () {
    if (MiniOyun.duraklatildi()) return;
    if (run) run.bitti = true;
    held = false;
    showMap();
  });

  // ---------- Girişler ----------
  function playing() { return run && !run.bitti && !canvas.hidden && !MiniOyun.duraklatildi(); }
  var DRIFT_KEYS = { ' ': 1, Spacebar: 1, ArrowUp: 1, ArrowLeft: 1, ArrowRight: 1 };
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (DRIFT_KEYS[e.key]) {
      if (!playing()) return;
      e.preventDefault();
      if (!e.repeat) held = true;
    } else if ((e.key === 'r' || e.key === 'R') && run && !canvas.hidden && !MiniOyun.duraklatildi()) {
      restart();
    }
  });
  document.addEventListener('keyup', function (e) { if (DRIFT_KEYS[e.key]) held = false; });
  window.addEventListener('blur', function () { held = false; });
  canvas.addEventListener('pointerdown', function (e) {
    if (!playing()) return;
    e.preventDefault();
    held = true;
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { canvas.addEventListener(t, function () { held = false; }); });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  // ---------- Döngü ----------
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    draw();
  }
  function frame(t) {
    var dt = Math.min(0.05, Math.max(0, (t - last) / 1000));
    last = t;
    if (run && !canvas.hidden && !paused && !MiniOyun.duraklatildi()) {
      if (!run.bitti) { update(dt); hud(); }
      run.konfeti.forEach(function (c) { c.y += c.v * dt; c.x += Math.sin(c.y / 30 + c.r) * 0.6; });
    }
    if (!canvas.hidden) draw();
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize', resize);

  function restart() {
    if (run && run.mod === 'gunluk' || daily) startDaily();
    else startLevel(lvNo);
  }
  MiniOyun.oyun({
    restart: restart,
    pause: function () { paused = true; held = false; },
    resume: function () { paused = false; },
    canPause: function () { return !!run && !run.bitti && !canvas.hidden; },
    seviye: function () { return run && run.mod === 'gunluk' || daily ? 'günlük' : 'bölüm ' + lvNo; }
  });

  showMap();
  resize();
  requestAnimationFrame(function (t) { last = t; frame(t); });
})();

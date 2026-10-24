(function () {
  // Olta Ustası: oltayı atıp inişte balıklardan kaçılan, çıkışta balık toplanan, yüzeyde havaya fırlayan balıkların
  // yakalandığı yükseltmeli balıkçılık oyunu. 5 deniz (hedef derinlikle sırayla açılır, her birinde 3 yıldız),
  // altınla 7 yükseltme, kapalıyken altın biriktiren tekne, akvaryum koleksiyonu, günlük görevler ve incilerle
  // açılan kanca görünümleri. Günlük modda (?gunluk=) herkes aynı dizilim ve sabit ekipmanla tek tur oynar. Kayıt: mo_olta.
  var W = 360, H = 640, PX = 6, HOOK_R = 7;
  var SAVE_KEY = 'mo_olta';
  var IDLE_CAP_MIN = 8 * 60;
  var reducedMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // boy: çizim boyu (px), hiz: yüzme hızı (px/sn), agirlik: denizdeki görülme sıklığı
  var TURLER = {
    hamsi: { ikon: '🐟', ad: 'Hamsi', deger: 1, min: 0, max: 140, boy: 26, hiz: 40, agirlik: 10 },
    tropik: { ikon: '🐠', ad: 'Tropik balık', deger: 2, min: 0, max: 180, boy: 28, hiz: 50, agirlik: 8 },
    yengec: { ikon: '🦀', ad: 'Yengeç', deger: 3, min: 15, max: 260, boy: 26, hiz: 25, agirlik: 5 },
    istiridye: { ikon: '🦪', ad: 'İstiridye', deger: 4, min: 40, max: 260, boy: 24, hiz: 0, agirlik: 3 },
    balon: { ikon: '🐡', ad: 'Balon balığı', deger: 5, min: 50, max: 320, boy: 30, hiz: 35, agirlik: 6 },
    kalamar: { ikon: '🦑', ad: 'Kalamar', deger: 8, min: 60, max: 600, boy: 30, hiz: 55, agirlik: 5 },
    kaplumbaga: { ikon: '🐢', ad: 'Kaplumbağa', deger: 12, min: 80, max: 360, boy: 32, hiz: 30, agirlik: 3 },
    ahtapot: { ikon: '🐙', ad: 'Ahtapot', deger: 15, min: 150, max: 9999, boy: 34, hiz: 35, agirlik: 4 },
    kopekbaligi: { ikon: '🦈', ad: 'Köpekbalığı', deger: 20, min: 150, max: 9999, boy: 46, hiz: 110, agirlik: 3 },
    istakoz: { ikon: '🦞', ad: 'Istakoz', deger: 30, min: 300, max: 9999, boy: 32, hiz: 30, agirlik: 3 },
    balina: { ikon: '🐋', ad: 'Balina', deger: 60, min: 300, max: 9999, boy: 62, hiz: 22, agirlik: 1.5 },
    altin: { ikon: '🐟', ad: 'Altın balık', deger: 25, boy: 28, hiz: 70, parilti: '#facc15', ozel: true },
    yunus: { ikon: '🐬', ad: 'Yunus', deger: 40, boy: 40, hiz: 90, ozel: true },
    fok: { ikon: '🦭', ad: 'Fok', deger: 70, boy: 40, hiz: 60, ozel: true },
    karides: { ikon: '🦐', ad: 'Kızıl karides', deger: 90, boy: 28, hiz: 80, parilti: '#f87171', ozel: true },
    isikli: { ikon: '🐳', ad: 'Işıklı balina', deger: 200, boy: 60, hiz: 30, parilti: '#67e8f9', ozel: true }
  };
  var TUR_SIRA = Object.keys(TURLER);
  // Tehlikeler: sert olanlar inişi bitirir, denizanası çıkışta son balığı düşürür
  var ENGELLER = {
    kaya: { ikon: '🪨', boy: 34, hiz: 0, sert: true },
    capa: { ikon: '⚓', boy: 34, hiz: 0, sert: true },
    buz: { ikon: '🧊', boy: 36, hiz: 8, sert: true },
    denizanasi: { ikon: '🪼', boy: 30, hiz: 18, sert: false }
  };
  var DENIZLER = [
    { id: 'koy', ad: 'Koy', ikon: '🏖️', hedef: 150, carpan: 1, altinHedef: 40, renk: ['#5eead4', '#0e7490', '#082f49'],
      turler: ['hamsi', 'tropik', 'yengec', 'istiridye', 'balon', 'kalamar'], ozel: 'altin', engel: ['kaya'], yogunluk: 0 },
    { id: 'acik', ad: 'Açık Deniz', ikon: '🌊', hedef: 300, carpan: 2, altinHedef: 250, renk: ['#38bdf8', '#1d4ed8', '#0b1442'],
      turler: ['hamsi', 'tropik', 'balon', 'kaplumbaga', 'kalamar', 'ahtapot', 'kopekbaligi'], ozel: 'yunus', engel: ['kaya', 'denizanasi'], yogunluk: 1 },
    { id: 'buzul', ad: 'Buzul Denizi', ikon: '🧊', hedef: 450, carpan: 4, altinHedef: 900, renk: ['#cbd5e1', '#64748b', '#111827'],
      turler: ['balon', 'kalamar', 'ahtapot', 'kopekbaligi', 'istakoz', 'balina'], ozel: 'fok', engel: ['buz', 'denizanasi'], yogunluk: 1.5 },
    { id: 'volkan', ad: 'Volkanik Yarık', ikon: '🌋', hedef: 600, carpan: 7, altinHedef: 2500, renk: ['#e11d48', '#581c87', '#14051a'],
      turler: ['yengec', 'kalamar', 'ahtapot', 'kopekbaligi', 'istakoz', 'balina'], ozel: 'karides', engel: ['kaya', 'capa', 'denizanasi'], yogunluk: 2, kabarcik: true },
    { id: 'ucurum', ad: 'Derin Uçurum', ikon: '🌌', hedef: 800, carpan: 12, altinHedef: 6000, renk: ['#1e3a8a', '#0b1023', '#010104'],
      turler: ['kalamar', 'ahtapot', 'kopekbaligi', 'istakoz', 'balina'], ozel: 'isikli', engel: ['capa', 'denizanasi'], yogunluk: 2.5, karanlik: true }
  ];
  // k. seviyenin bedeli round(taban * 1.5^k) altın
  var YUKSELTMELER = [
    { id: 'misina', ikon: '🧵', ad: 'Misina uzunluğu', taban: 15, max: 20, etki: function (l) { return sinir(l) + ' m'; } },
    { id: 'kanca', ikon: '🪝', ad: 'Kanca kapasitesi', taban: 20, max: 17, etki: function (l) { return (3 + l) + ' balık'; } },
    { id: 'makara', ikon: '⚡', ad: 'Makara hızı', taban: 25, max: 10, etki: function (l) { return (35 + l * 12) + ' m/sn çıkış'; } },
    { id: 'miknatis', ikon: '🧲', ad: 'Mıknatıs', taban: 30, max: 10, etki: function (l) { return '+' + l * 5 + ' px yakalama'; } },
    { id: 'kalkan', ikon: '🛡️', ad: 'Kalkan', taban: 150, max: 3, etki: function (l) { return l + ' çarpma yok sayılır'; } },
    { id: 'nisan', ikon: '🎯', ad: 'Oto nişan', taban: 80, max: 5, etki: function (l) { return '%' + l * 15 + ' kendiliğinden yakalanır'; } },
    { id: 'tekne', ikon: '🚤', ad: 'Tekne', taban: 60, max: 10, etki: function (l) { return idleRate(l) + ' altın/dk (kapalıyken)'; } }
  ];
  var KANCALAR = [
    { id: 'klasik', ikon: '🪝', ad: 'Klasik', bedel: 0 },
    { id: 'capa', ikon: '⚓', ad: 'Çapa', bedel: 3 },
    { id: 'elmas', ikon: '💎', ad: 'Elmas', bedel: 6 },
    { id: 'ordek', ikon: '🦆', ad: 'Ördek şamandıra', bedel: 10 }
  ];
  // hedef: function (enUstDeniz) -> sayı
  var GOREVLER = [
    { id: 'tur', ad: function (h) { return h + ' tur oyna'; }, hedef: function () { return 4; } },
    { id: 'balik', ad: function (h) { return 'Toplam ' + h + ' balık yakala'; }, hedef: function () { return 20; } },
    { id: 'derin', ad: function (h) { return 'Bir turda ' + h + ' m\'ye in'; }, hedef: function (d) { return Math.round(d.hedef * 0.5); }, enAz: true },
    { id: 'kazanc', ad: function (h) { return 'Tek turda ' + h + ' altın kazan'; }, hedef: function (d) { return Math.round(d.altinHedef * 0.5); }, enAz: true },
    { id: 'dolu', ad: function () { return 'Kancayı tamamen doldur'; }, hedef: function () { return 1; } },
    { id: 'dokun', ad: function (h) { return 'Yüzeyde ' + h + ' balığı dokunarak yakala'; }, hedef: function () { return 10; } }
  ];
  // Günlük modda herkesin kullandığı sabit ekipman
  var GUNLUK_EKIPMAN = { misina: 250, kanca: 6, makara: 3, miknatis: 2, kalkan: 0, nisan: 0 };

  var canvas = document.getElementById('alan');
  var ctx = canvas.getContext('2d');
  var panel = document.getElementById('panel');
  var depthEl = document.getElementById('derinlik');
  var hookEl = document.getElementById('kanca');
  var goldEl = document.getElementById('altin');
  var bestEl = document.getElementById('rekor');

  var daily = !!(MiniOyun.gunluk && MiniOyun.gunluk.tarih);
  var save = load();
  var tab = 'balik', note = '';
  var run = null, state = 'menu', keys = { sol: false, sag: false }, targetX = null;
  var paused = false, last = 0, camY = -H * 0.35, deco = [], bubbles = [], t0 = 0;

  // ---------- Kayıt ----------
  function load() {
    var p = null;
    try { p = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) {}
    if (!p || typeof p !== 'object' || Array.isArray(p)) p = {};
    p.altin = Math.max(0, Number(p.altin) || 0);
    p.inci = Math.max(0, Number(p.inci) || 0);
    if (!p.yukseltme || typeof p.yukseltme !== 'object') p.yukseltme = {};
    if (!Array.isArray(p.acikDenizler)) p.acikDenizler = [];
    p.acikDenizler = p.acikDenizler.filter(seaById);
    if (p.acikDenizler.indexOf('koy') === -1) p.acikDenizler.unshift('koy');
    if (!seaById(p.deniz) || p.acikDenizler.indexOf(p.deniz) === -1) p.deniz = 'koy';
    if (!p.yildizlar || typeof p.yildizlar !== 'object') p.yildizlar = {};
    if (!p.denizDerin || typeof p.denizDerin !== 'object') p.denizDerin = {};
    if (!p.akvaryum || typeof p.akvaryum !== 'object') p.akvaryum = {};
    if (!p.kozmetik || typeof p.kozmetik !== 'object') p.kozmetik = {};
    if (!Array.isArray(p.kozmetik.sahip)) p.kozmetik.sahip = ['klasik'];
    if (typeof p.kozmetik.secili !== 'string') p.kozmetik.secili = 'klasik';
    p.sonGiris = Number(p.sonGiris) || 0;
    p.enDerin = Number(p.enDerin) || 0;
    p.enIyiTur = Number(p.enIyiTur) || 0;
    return p;
  }
  function store() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
  }
  function seaById(id) { for (var i = 0; i < DENIZLER.length; i++) if (DENIZLER[i].id === id) return DENIZLER[i]; return null; }
  function seaIndex(s) { return DENIZLER.indexOf(s); }
  function topSea() {
    var top = DENIZLER[0];
    DENIZLER.forEach(function (d) { if (save.acikDenizler.indexOf(d.id) !== -1) top = d; });
    return top;
  }
  function lvl(id) { return Math.max(0, Math.floor(Number(save.yukseltme[id]) || 0)); }
  function cost(u) { return Math.round(u.taban * Math.pow(1.5, lvl(u.id))); }
  function sinir(l) { return 30 + 15 * l + Math.round(1.5 * l * l); }
  function idleRate(l) { return l * 2 * topSea().carpan; }
  function seaStars(id) {
    var y = save.yildizlar[id];
    return Array.isArray(y) ? [!!y[0], !!y[1], !!y[2]] : [false, false, false];
  }
  function starCount(id) { return seaStars(id).filter(Boolean).length; }
  function bonusRate() {
    var n = 0;
    for (var k in save.akvaryum) if (TURLER[k] && save.akvaryum[k] >= 10) n++;
    return 1 + n * 0.02;
  }
  function hookIcon() {
    var id = save.kozmetik.secili;
    for (var i = 0; i < KANCALAR.length; i++) if (KANCALAR[i].id === id && save.kozmetik.sahip.indexOf(id) !== -1) return KANCALAR[i].ikon;
    return '🪝';
  }
  function gear() {
    if (daily) return GUNLUK_EKIPMAN;
    return { misina: sinir(lvl('misina')), kanca: 3 + lvl('kanca'), makara: lvl('makara'), miknatis: lvl('miknatis'), kalkan: lvl('kalkan'), nisan: lvl('nisan') };
  }

  // Tekne geliri: son girişten bu yana geçen süre (en fazla 8 saat). Saat geri alındıysa gelir yok.
  function collectIdle(onLoad) {
    var now = Date.now(), gain = 0, rate = idleRate(lvl('tekne'));
    if (save.sonGiris && now > save.sonGiris && rate > 0) {
      var mins = Math.min(IDLE_CAP_MIN, (now - save.sonGiris) / 60000);
      gain = Math.floor(mins * rate);
    }
    save.sonGiris = now;
    if (gain > 0) {
      save.altin += gain;
      if (onLoad) note = '🚤 Sen yokken teknen ' + gain + ' altın kazandı!';
    }
    store();
    return gain;
  }

  // ---------- Günlük görevler ----------
  function missionsReady() {
    var today = MiniOyun.gunluk.bugun();
    var g = save.gorev;
    if (g && g.tarih === today && Array.isArray(g.liste) && g.liste.length === 3 && g.hedef && g.ilerleme && Array.isArray(g.tamam)) return;
    var rnd = MiniOyun.gunluk.rastgele(today + '/olta-gorev');
    var pool = GOREVLER.slice(), list = [], top = topSea();
    while (list.length < 3) list.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    save.gorev = { tarih: today, liste: [], hedef: {}, ilerleme: {}, tamam: [] };
    list.forEach(function (m) { save.gorev.liste.push(m.id); save.gorev.hedef[m.id] = m.hedef(top); save.gorev.ilerleme[m.id] = 0; });
    store();
  }
  function mission(id) { for (var i = 0; i < GOREVLER.length; i++) if (GOREVLER[i].id === id) return GOREVLER[i]; }
  function missionReward() { return Math.round(15 * topSea().carpan); }
  function progressMission(id, n) {
    if (daily) return [];
    missionsReady();
    var g = save.gorev, m = mission(id);
    if (g.liste.indexOf(id) === -1 || g.tamam.indexOf(id) !== -1) return [];
    g.ilerleme[id] = m.enAz ? Math.max(g.ilerleme[id] || 0, n) : (g.ilerleme[id] || 0) + n;
    if (g.ilerleme[id] < g.hedef[id]) return [];
    g.tamam.push(id);
    var odul = missionReward();
    save.altin += odul;
    save.inci += 1;
    return ['görev tamam: +' + odul + ' altın, +1 inci'];
  }

  // ---------- Deniz üretimi ----------
  function pickType(sea, d, rnd) {
    var c = sea.turler.filter(function (id) { return TURLER[id].min <= d && TURLER[id].max >= d; });
    if (!c.length) c = sea.turler;
    var sum = 0;
    c.forEach(function (id) { sum += TURLER[id].agirlik; });
    var x = rnd() * sum;
    for (var i = 0; i < c.length; i++) { x -= TURLER[c[i]].agirlik; if (x <= 0) return c[i]; }
    return c[c.length - 1];
  }
  function makeFish(tip, d, rnd, sea) {
    var def = TURLER[tip] || ENGELLER[tip];
    var dir = rnd() < 0.5 ? -1 : 1, r = def.boy * 0.4;
    var speed = def.hiz * (0.7 + rnd() * 0.6) * (1 + d / 700) * (1 + sea.yogunluk * 0.08);
    return { tip: tip, engel: !TURLER[tip], x: r + rnd() * (W - 2 * r), y: d * PX, vx: dir * speed, r: r, boy: def.boy, canli: true };
  }
  function makeSea(sea, maxD, rnd) {
    var fish = [], zones = [], d = 9 + rnd() * 5, specials = 0;
    while (d < maxD + 40) {
      var x = rnd(), tip;
      var pHaz = d < 35 ? 0 : Math.min(0.06 + d / 4000 + sea.yogunluk * 0.015, 0.2);
      if (x < pHaz) tip = sea.engel[Math.floor(rnd() * sea.engel.length)];
      else if (x < pHaz + 0.035 && d > sea.hedef * 0.35 && specials < 2) { tip = sea.ozel; specials++; }
      else tip = pickType(sea, d, rnd);
      fish.push(makeFish(tip, d, rnd, sea));
      d += Math.max(4.5, 11 - d * 0.006 - sea.yogunluk * 0.8) * (0.6 + rnd() * 0.8);
    }
    if (sea.kabarcik) for (var z = 90 + rnd() * 30; z < maxD; z += 50 + rnd() * 40) zones.push({ y0: z * PX, y1: (z + 18 + rnd() * 10) * PX, yon: rnd() < 0.5 ? -1 : 1 });
    return { fish: fish, zones: zones };
  }

  // ---------- Tur ----------
  function startRound() {
    if (state !== 'menu' && state !== 'bitti') return;
    var sea = daily ? DENIZLER[1] : seaById(save.deniz);
    var g = gear();
    var rnd = daily ? MiniOyun.rastgele() : Math.random;
    var world = makeSea(sea, g.misina, rnd);
    run = {
      sea: sea, g: g, fish: world.fish, zones: world.zones, hx: W / 2, hy: 0, derin: 0,
      takili: [], kalkan: g.kalkan, ucan: [], yakalanan: [], kaybolan: 0, dokunma: 0, dolu: false, yuzeyT: 0, popups: []
    };
    canvas.dataset.dizilim = world.fish.slice(0, 14).map(function (f) { return f.tip + Math.round(f.x) + ':' + Math.round(f.y / PX); }).join(';');
    canvas.dataset.sinir = g.misina;
    targetX = null;
    state = 'inis';
    panel.hidden = true;
    MiniOyun.ses('tik');
    if (canvas.scrollIntoView) canvas.scrollIntoView({ block: 'nearest' });
    try { canvas.focus({ preventScroll: true }); } catch (e) {}
    hud();
  }

  function hit(f, extra) {
    var dx = f.x - run.hx, dy = f.y - run.hy, rr = f.r + HOOK_R + (extra || 0);
    return dx * dx + dy * dy < rr * rr;
  }
  function popup(x, y, yazi, renk) { run.popups.push({ x: x, y: y, yazi: yazi, renk: renk || '#fde047', t: 1 }); }

  function hook(f) {
    f.canli = false;
    run.takili.push(f.tip);
    if (run.takili.length >= run.g.kanca) run.dolu = true;
    popup(run.hx, run.hy, TURLER[f.tip].ikon, '#fff');
    MiniOyun.ses('tik');
  }

  function updateDescent(dt) {
    var speed = (45 + run.derin * 0.03) * PX;
    run.hy += speed * dt;
    run.zones.forEach(function (z) { if (run.hy > z.y0 && run.hy < z.y1) run.hx += z.yon * 75 * dt; });
    run.hx = Math.max(10, Math.min(W - 10, run.hx));
    var maxY = run.g.misina * PX;
    for (var i = 0; i < run.fish.length; i++) {
      var f = run.fish[i];
      if (!f.canli || f.itildi || Math.abs(f.y - run.hy) > 50 || !hit(f)) continue;
      if (f.engel && ENGELLER[f.tip].sert) { popup(run.hx, run.hy, '💥', '#fca5a5'); return startAscent(); }
      if (f.engel || run.kalkan <= 0) {
        if (!f.engel) hook(f);
        else { f.itildi = true; popup(run.hx, run.hy, '⚡', '#f0abfc'); }
        return startAscent();
      }
      run.kalkan--;
      f.itildi = true;
      f.vx = (f.x < run.hx ? -1 : 1) * Math.abs(f.vx || 60) * 2.5;
      popup(run.hx, run.hy, '🛡️', '#93c5fd');
    }
    if (run.hy >= maxY) { run.hy = maxY; startAscent(); }
    run.derin = run.hy / PX;
  }
  function startAscent() {
    run.derin = run.hy / PX;
    state = 'cikis';
    MiniOyun.ses('tik');
  }
  function updateAscent(dt) {
    var speed = (35 + run.g.makara * 12) * PX * (run.dolu ? 2.2 : 1);
    run.hy -= speed * dt;
    run.zones.forEach(function (z) { if (run.hy > z.y0 && run.hy < z.y1) run.hx += z.yon * 75 * dt; });
    run.hx = Math.max(10, Math.min(W - 10, run.hx));
    for (var i = 0; i < run.fish.length; i++) {
      var f = run.fish[i];
      if (!f.canli || Math.abs(f.y - run.hy) > 60) continue;
      if (f.engel) {
        if (f.tip === 'denizanasi' && !f.itildi && hit(f) && run.takili.length) {
          f.itildi = true;
          var lost = run.takili.pop();
          run.dolu = false;
          popup(run.hx, run.hy, '-' + TURLER[lost].ikon, '#f472b6');
          MiniOyun.ses('kaybet');
        }
        continue;
      }
      if (!run.dolu && hit(f, run.g.miknatis * 5)) hook(f);
    }
    if (run.hy <= 0) { run.hy = 0; launch(); }
  }
  // Yüzey: takılan balıklar havaya fırlar; oto nişan bir kısmını kendiliğinden yakalar
  function launch() {
    state = 'yuzey';
    run.yuzeyT = 0;
    var n = run.takili.length, auto = Math.floor(n * run.g.nisan * 0.15);
    run.takili.forEach(function (tip, i) {
      run.ucan.push({ tip: tip, x: W / 2 + (i - (n - 1) / 2) * 14, y: -4, vx: (i % 2 ? 1 : -1) * (15 + (i * 37) % 55), vy: -(330 + (i * 53) % 150) * 1.0, oto: i < auto, canli: true });
    });
    run.takili = [];
    if (n) MiniOyun.ses('puan');
  }
  function value(tip) { return TURLER[tip].deger * run.sea.carpan; }
  function catchFish(f, byTouch) {
    f.canli = false;
    run.yakalanan.push(f.tip);
    if (byTouch) run.dokunma++;
    popup(f.x, f.y, '+' + Math.round(value(f.tip) * (daily ? 1 : bonusRate())), '#fde047');
    MiniOyun.ses('puan');
  }
  function updateSurface(dt) {
    run.yuzeyT += dt;
    var alive = 0;
    run.ucan.forEach(function (f) {
      if (!f.canli) return;
      f.vy += 360 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (f.x < 14 || f.x > W - 14) { f.vx = -f.vx; f.x = Math.max(14, Math.min(W - 14, f.x)); }
      if (f.oto && f.vy > 0) { catchFish(f, false); return; }
      if (f.vy > 0 && f.y > 0) { f.canli = false; run.kaybolan++; popup(f.x, -6, '💦', '#7dd3fc'); return; }
      alive++;
    });
    if (!alive && run.yuzeyT > 0.6) finishRound();
  }
  // Boşluk: en alçaktaki (düşmek üzere olan) balığı yakala
  function catchNearest() {
    var best = null;
    run.ucan.forEach(function (f) { if (f.canli && (!best || f.y > best.y)) best = f; });
    if (best) catchFish(best, true);
  }
  function catchAt(x, y) {
    var best = null, bd = 34 * 34;
    run.ucan.forEach(function (f) {
      if (!f.canli) return;
      var d = (f.x - x) * (f.x - x) + (f.y - y) * (f.y - y);
      if (d < bd) { bd = d; best = f; }
    });
    if (best) catchFish(best, true);
  }

  function finishRound() {
    state = 'bitti';
    var sea = run.sea, sum = 0, msgs = [], yeni = [];
    run.yakalanan.forEach(function (tip) { sum += value(tip); });
    var gold = Math.round(sum * (daily ? 1 : bonusRate()));
    var depth = Math.round(run.derin);
    if (!daily) {
      save.altin += gold;
      save.enDerin = Math.max(save.enDerin, depth);
      save.enIyiTur = Math.max(save.enIyiTur, gold);
      save.denizDerin[sea.id] = Math.max(Number(save.denizDerin[sea.id]) || 0, depth);
      run.yakalanan.forEach(function (tip) {
        var before = Number(save.akvaryum[tip]) || 0;
        if (!before && yeni.indexOf(TURLER[tip].ikon + ' ' + TURLER[tip].ad) === -1) yeni.push(TURLER[tip].ikon + ' ' + TURLER[tip].ad);
        save.akvaryum[tip] = before + 1;
        if (before + 1 === 10) msgs.push(TURLER[tip].ad + ' 10 kez yakalandı: kalıcı +%2 altın bonusu');
      });
      var st = seaStars(sea.id), had = st.slice();
      if (save.denizDerin[sea.id] >= sea.hedef) st[0] = true;
      if (gold >= sea.altinHedef) st[1] = true;
      if (run.yakalanan.indexOf(sea.ozel) !== -1) st[2] = true;
      save.yildizlar[sea.id] = st;
      for (var i = 0; i < 3; i++) if (st[i] && !had[i]) msgs.push('yeni yıldız ⭐');
      var next = DENIZLER[seaIndex(sea) + 1];
      if (st[0] && next && save.acikDenizler.indexOf(next.id) === -1) {
        save.acikDenizler.push(next.id);
        msgs.push(next.ikon + ' ' + next.ad + ' açıldı');
      }
      msgs = msgs.concat(progressMission('tur', 1), progressMission('balik', run.yakalanan.length), progressMission('derin', depth),
        progressMission('kazanc', gold), progressMission('dokun', run.dokunma));
      if (run.dolu || run.doluOldu) msgs = msgs.concat(progressMission('dolu', 1));
      collectIdle(false);
      store();
    }
    var key = daily ? 'olta-ustasi-gunluk' : 'olta-ustasi-' + sea.id;
    var rec = MiniOyun.setBest(key, gold);
    if (!daily) MiniOyun.setBest('olta-ustasi', gold);
    hud();
    MiniOyun.bitti({
      baslik: (daily ? 'Günlük tur bitti' : sea.ikon + ' Tur bitti') + ': ' + gold + ' altın',
      metin: 'En derin nokta: ' + depth + ' m. Yakalanan: ' + run.yakalanan.length + ' balık' + (run.kaybolan ? ', suya düşen: ' + run.kaybolan : '') + '.' +
        (yeni.length ? ' Akvaryuma yeni: ' + yeni.join(', ') + '.' : '') + (msgs.length ? ' ' + msgs.join(', ') + '.' : ''),
      rekor: rec, skor: gold, sonuc: gold + ' altın',
      paylas: 'Olta Ustası\'nda ' + (daily ? 'günlük turda' : sea.ad + '\'de') + ' ' + depth + ' m\'ye inip ' + gold + ' altınlık balık tuttum!'
    });
    toMenu();
  }

  function toMenu() {
    state = state === 'bitti' ? 'bitti' : 'menu';
    panel.hidden = false;
    renderPanel();
  }

  // ---------- Panel (sekmeler) ----------
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function renderPanel() {
    var h = '';
    if (daily) {
      var g = GUNLUK_EKIPMAN;
      h += '<h2>📅 Günlük meydan okuma · ' + MiniOyun.gunluk.tarih + '</h2>' +
        '<p>Herkes Açık Deniz\'de aynı balık dizilimiyle ve aynı ekipmanla oynar: ' + g.misina + ' m misina, ' + g.kanca + ' balıklık kanca, kalkan yok. Yükseltmelerin bu turda etkisizdir.</p>' +
        '<button class="btn ou-at" type="button" data-at="1">🎣 Oltayı At</button>' +
        '<p>Günlük rekor: ' + MiniOyun.getBest('olta-ustasi-gunluk') + ' altın</p>';
      panel.innerHTML = h;
      return;
    }
    var tabs = [['balik', '🎣 Balık Tut'], ['yukselt', '⬆️ Yükselt'], ['deniz', '🗺️ Denizler'], ['akvaryum', '🐠 Akvaryum'], ['gorev', '📋 Görevler']];
    h += '<div class="ou-bildirim" id="bildirim"' + (note ? '' : ' hidden') + '>' + esc(note) + '</div>';
    h += '<div class="ou-cuzdan"><span>🪙 <span id="cuzdan-altin">' + save.altin + '</span></span><span>🦪 ' + save.inci + ' inci</span></div>';
    h += '<div class="ou-sekmeler" role="tablist">' + tabs.map(function (t) {
      return '<button class="ou-sekme' + (tab === t[0] ? ' secili' : '') + '" type="button" role="tab" aria-selected="' + (tab === t[0]) + '" data-sekme="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div>';
    if (tab === 'balik') {
      var sea = seaById(save.deniz), g2 = gear();
      h += '<h2>' + sea.ikon + ' ' + sea.ad + ' ' + stars(sea.id) + '</h2>' +
        '<p>Hedef derinlik ' + sea.hedef + ' m · misinan ' + g2.misina + ' m · kanca ' + g2.kanca + ' balık' + (g2.kalkan ? ' · kalkan ' + g2.kalkan : '') + '</p>' +
        '<button class="btn ou-at" type="button" data-at="1">🎣 Oltayı At</button>' +
        '<p>En derin: ' + (Number(save.denizDerin[sea.id]) || 0) + ' m · Bu denizdeki rekor: ' + MiniOyun.getBest('olta-ustasi-' + sea.id) + ' altın' +
        (lvl('tekne') ? ' · Tekne: ' + idleRate(lvl('tekne')) + ' altın/dk' : '') + '</p>';
    } else if (tab === 'yukselt') {
      h += '<div class="ou-liste">' + YUKSELTMELER.map(function (u) {
        var l = lvl(u.id), full = l >= u.max, c = cost(u);
        return '<button class="ou-satir" type="button" data-yuk="' + u.id + '"' + (full || save.altin < c ? ' disabled' : '') + '>' +
          '<span class="ou-ikon" aria-hidden="true">' + u.ikon + '</span><span>' + u.ad + ' <b>' + l + '/' + u.max + '</b><small>Şu an: ' + u.etki(l) +
          (full ? '' : ' → ' + u.etki(l + 1)) + '</small></span><span class="ou-bedel">' + (full ? 'TAM' : '🪙 ' + c) + '</span></button>';
      }).join('') + '</div>';
      h += '<h2>Kanca görünümleri</h2><div class="ou-liste">' + KANCALAR.map(function (k) {
        var own = save.kozmetik.sahip.indexOf(k.id) !== -1, sel = save.kozmetik.secili === k.id;
        return '<button class="ou-satir' + (sel ? ' secili' : '') + '" type="button" data-kanca="' + k.id + '"' + (!own && save.inci < k.bedel ? ' disabled' : '') + '>' +
          '<span class="ou-ikon" aria-hidden="true">' + k.ikon + '</span><span>' + k.ad + '</span><span class="ou-bedel">' + (sel ? 'Seçili' : own ? 'Seç' : '🦪 ' + k.bedel) + '</span></button>';
      }).join('') + '</div>';
    } else if (tab === 'deniz') {
      h += '<div class="ou-liste">' + DENIZLER.map(function (d, i) {
        var open = save.acikDenizler.indexOf(d.id) !== -1, prev = DENIZLER[i - 1];
        return '<button class="ou-satir' + (save.deniz === d.id ? ' secili' : '') + '" type="button" data-deniz="' + d.id + '"' + (open ? '' : ' disabled') + '>' +
          '<span class="ou-ikon" aria-hidden="true">' + (open ? d.ikon : '🔒') + '</span><span>' + d.ad + ' ' + stars(d.id) +
          '<small>' + (open ? '⭐ ' + d.hedef + ' m\'ye in · ⭐ tek turda ' + d.altinHedef + ' altın · ⭐ ' + TURLER[d.ozel].ikon + ' ' + TURLER[d.ozel].ad + ' yakala'
            : prev.ad + '\'de ' + prev.hedef + ' m\'ye inince açılır') + '</small></span></button>';
      }).join('') + '</div>';
    } else if (tab === 'akvaryum') {
      var have = TUR_SIRA.filter(function (k) { return save.akvaryum[k] > 0; }).length;
      h += '<p>' + have + ' / ' + TUR_SIRA.length + ' tür · altın bonusu %' + Math.round((bonusRate() - 1) * 100) + ' (10 kez yakalanan her tür +%2)</p>';
      h += '<div class="ou-akvaryum">' + TUR_SIRA.map(function (k) {
        var n = Number(save.akvaryum[k]) || 0, t = TURLER[k];
        return '<div class="ou-tur' + (n ? '' : ' yok') + (n >= 10 ? ' bonus' : '') + '"><b aria-hidden="true">' + t.ikon + '</b>' + (n ? t.ad + '<br>×' + n : '???') + '</div>';
      }).join('') + '</div>';
    } else {
      missionsReady();
      var gr = save.gorev;
      h += '<p>Her gün 3 yeni görev. Ödül: ' + missionReward() + ' altın + 1 🦪 inci.</p>' + gr.liste.map(function (id) {
        var done = gr.tamam.indexOf(id) !== -1, hd = gr.hedef[id];
        return '<div class="ou-gorev' + (done ? ' tamam' : '') + '">' + (done ? '✅ ' : '⬜ ') + mission(id).ad(hd) + ' <small>(' + Math.min(hd, gr.ilerleme[id] || 0) + '/' + hd + ')</small></div>';
      }).join('');
    }
    panel.innerHTML = h;
  }
  function stars(id) { var n = starCount(id); return '★★★'.slice(0, n) + '☆☆☆'.slice(n); }

  panel.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled || MiniOyun.duraklatildi()) return;
    if (b.dataset.at) { note = ''; state = 'menu'; startRound(); return; }
    if (b.dataset.sekme) { tab = b.dataset.sekme; note = ''; }
    else if (b.dataset.yuk) {
      var u = YUKSELTMELER.filter(function (x) { return x.id === b.dataset.yuk; })[0], c = cost(u);
      if (lvl(u.id) < u.max && save.altin >= c) {
        if (u.id === 'tekne') collectIdle(false);
        save.altin -= c; save.yukseltme[u.id] = lvl(u.id) + 1; store(); MiniOyun.ses('puan');
      }
    } else if (b.dataset.kanca) {
      var k = KANCALAR.filter(function (x) { return x.id === b.dataset.kanca; })[0];
      if (save.kozmetik.sahip.indexOf(k.id) === -1) {
        if (save.inci < k.bedel) return;
        save.inci -= k.bedel; save.kozmetik.sahip.push(k.id); MiniOyun.ses('puan');
      }
      save.kozmetik.secili = k.id; store();
    } else if (b.dataset.deniz) { save.deniz = b.dataset.deniz; store(); tab = 'balik'; }
    renderPanel();
    hud();
  });

  // ---------- Girişler ----------
  function playing() { return (state === 'inis' || state === 'cikis' || state === 'yuzey') && !MiniOyun.duraklatildi(); }
  function logical(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  }
  document.addEventListener('keydown', function (e) {
    var k = e.key;
    if (MiniOyun.duraklatildi()) return;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { if (playing()) { keys.sol = true; targetX = null; e.preventDefault(); } }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { if (playing()) { keys.sag = true; targetX = null; e.preventDefault(); } }
    else if (k === ' ' || k === 'Enter') {
      if (state === 'yuzey') { catchNearest(); e.preventDefault(); }
      else if (playing()) e.preventDefault();
      else if ((state === 'menu' || state === 'bitti') && !panel.hidden && !(e.target && e.target.closest && e.target.closest('button, a, input'))) { note = ''; state = 'menu'; startRound(); e.preventDefault(); }
    }
  });
  document.addEventListener('keyup', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.sol = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.sag = false;
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!playing() || state === 'yuzey') return;
    if (e.pointerType === 'mouse' || e.buttons || e.pointerType === 'touch' || e.pointerType === 'pen') targetX = logical(e).x;
  });
  canvas.addEventListener('pointerdown', function (e) {
    if (MiniOyun.duraklatildi()) return;
    var p = logical(e);
    if (state === 'yuzey') { catchAt(p.x, p.y + camY); e.preventDefault(); return; }
    if (state === 'menu' || state === 'bitti') { note = ''; state = 'menu'; startRound(); e.preventDefault(); return; }
    targetX = p.x;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  });

  // ---------- Döngü ----------
  function update(dt) {
    if (!run) return;
    var dir = (keys.sag ? 1 : 0) - (keys.sol ? 1 : 0);
    if (state === 'inis' || state === 'cikis') {
      if (dir) run.hx += dir * 240 * dt;
      else if (targetX != null) run.hx += Math.max(-420 * dt, Math.min(420 * dt, targetX - run.hx));
      run.fish.forEach(function (f) {
        if (!f.canli || !f.vx || Math.abs(f.y - run.hy) > H * 1.5) return;
        f.x += f.vx * dt;
        if (f.x < f.r) { f.x = f.r; f.vx = Math.abs(f.vx); }
        if (f.x > W - f.r) { f.x = W - f.r; f.vx = -Math.abs(f.vx); }
      });
      if (state === 'inis') updateDescent(dt); else updateAscent(dt);
      if (run.dolu) run.doluOldu = true;
    } else if (state === 'yuzey') updateSurface(dt);
    run.popups.forEach(function (p) { p.t -= dt; p.y -= 40 * dt; });
    run.popups = run.popups.filter(function (p) { return p.t > 0; });
  }
  function cameraTarget() {
    if (!run || state === 'menu' || state === 'bitti') return -H * 0.35;
    if (state === 'inis') return run.hy - H * 0.38;
    if (state === 'cikis') return Math.max(-H * 0.45, run.hy - H * 0.58);
    return -H * 0.62;
  }
  function hud() {
    var g = run ? run.g : gear();
    depthEl.textContent = (run && state !== 'menu' && state !== 'bitti' ? Math.max(0, Math.round(run.hy / PX)) : 0) + ' m';
    hookEl.textContent = (run && (state === 'inis' || state === 'cikis') ? run.takili.length : 0) + '/' + g.kanca;
    goldEl.textContent = save.altin;
    var sea = daily ? null : seaById(save.deniz);
    bestEl.textContent = MiniOyun.getBest(daily ? 'olta-ustasi-gunluk' : 'olta-ustasi-' + sea.id);
    canvas.dataset.durum = state;
    canvas.dataset.derinlik = run ? Math.round(run.hy / PX) : 0;
    canvas.dataset.kancax = run ? Math.round(run.hx) : W / 2;
    canvas.dataset.takili = run ? run.takili.length : 0;
    canvas.dataset.yakinx = nearestAhead();
  }
  // Çıkışta kancanın üstündeki en yakın balığın x'i (testteki "bot" bunu izler)
  function nearestAhead() {
    if (!run || state !== 'cikis') return '';
    var best = null;
    run.fish.forEach(function (f) {
      if (!f.canli || f.engel || f.y > run.hy + 4 || f.y < run.hy - 260) return;
      if (!best || f.y > best.y) best = f;
    });
    return best ? Math.round(best.x) : '';
  }

  function hexRgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function waterColor(sea, d) {
    var t = Math.max(0, Math.min(1, d / (sea.hedef * 1.25))), a, b, u;
    if (t < 0.5) { a = hexRgb(sea.renk[0]); b = hexRgb(sea.renk[1]); u = t * 2; } else { a = hexRgb(sea.renk[1]); b = hexRgb(sea.renk[2]); u = (t - 0.5) * 2; }
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * u) + ',' + Math.round(a[1] + (b[1] - a[1]) * u) + ',' + Math.round(a[2] + (b[2] - a[2]) * u) + ')';
  }
  function emoji(ch, x, y, size, flip) {
    ctx.font = size + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    if (flip) { ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1); ctx.fillText(ch, 0, 0); ctx.restore(); }
    else ctx.fillText(ch, x, y);
  }
  function draw() {
    var sea = run ? run.sea : daily ? DENIZLER[1] : seaById(save.deniz);
    var top = camY, wy = -top; // su çizgisinin ekran y'si
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Gökyüzü
    if (wy > 0) {
      var sky = ctx.createLinearGradient(0, 0, 0, wy);
      sky.addColorStop(0, '#1e1b4b'); sky.addColorStop(1, '#7dd3fc');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, Math.min(H, wy));
    }
    // Su (derinliğe göre koyulaşır)
    var y0 = Math.max(0, wy);
    if (y0 < H) {
      var gr = ctx.createLinearGradient(0, y0, 0, H);
      gr.addColorStop(0, waterColor(sea, Math.max(0, top) / PX));
      gr.addColorStop(1, waterColor(sea, (top + H) / PX));
      ctx.fillStyle = gr; ctx.fillRect(0, y0, W, H - y0);
    }
    // Derinlik çizgileri
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    for (var m = Math.max(50, Math.ceil(top / PX / 50) * 50); m * PX < top + H; m += 50) {
      var ly = m * PX - top;
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(0, ly, W, 1);
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillText(m + ' m', 4, ly - 7);
    }
    ctx.textAlign = 'center';
    // Kabarcık akıntıları
    if (run) run.zones.forEach(function (z) {
      if (z.y1 < top || z.y0 > top + H) return;
      ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(0, z.y0 - top, W, z.y1 - z.y0);
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      for (var i = 0; i < 9; i++) {
        var bx = ((i * 41 + t0 * 60 * z.yon) % W + W) % W, by = z.y0 - top + ((i * 29 + t0 * 30) % (z.y1 - z.y0));
        ctx.beginPath(); ctx.arc(bx, by, 2 + (i % 3), 0, 7); ctx.fill();
      }
    });
    // Süs balıkları (menüde)
    if (!run || state === 'menu' || state === 'bitti') deco.forEach(function (f) {
      var dx = ((f.x + t0 * f.v) % (W + 60) + W + 60) % (W + 60) - 30;
      ctx.globalAlpha = 0.7; emoji(f.ch, dx, f.y - top, f.s, f.v > 0); ctx.globalAlpha = 1;
    });
    // Balıklar ve engeller
    if (run && state !== 'yuzey' && state !== 'bitti') run.fish.forEach(function (f) {
      var sy = f.y - top;
      if (!f.canli || sy < -50 || sy > H + 50) return;
      var def = TURLER[f.tip] || ENGELLER[f.tip];
      if (def.parilti) {
        ctx.fillStyle = def.parilti; ctx.globalAlpha = reducedMotion ? 0.35 : 0.25 + 0.15 * Math.sin(t0 * 6);
        ctx.beginPath(); ctx.arc(f.x, sy, f.r + 8, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      }
      if (f.itildi) ctx.globalAlpha = 0.5;
      emoji(def.ikon, f.x, sy, f.boy, f.vx > 0);
      ctx.globalAlpha = 1;
    });
    // Tekne ve dalga
    if (wy > -40 && wy < H + 40) {
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.beginPath();
      for (var x = 0; x <= W; x += 6) ctx.lineTo(x, wy + Math.sin(x / 18 + t0 * 2) * 2);
      ctx.stroke();
      emoji('🚤', W / 2 - 18, wy - 14, 34, true);
    }
    // Misina ve kanca
    var hx = run && state !== 'menu' && state !== 'bitti' && state !== 'yuzey' ? run.hx : W / 2;
    var hy = run && state !== 'menu' && state !== 'bitti' && state !== 'yuzey' ? run.hy - top : wy + 30;
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W / 2, wy - 18); ctx.lineTo(hx, hy); ctx.stroke();
    if (run && (state === 'inis' || state === 'cikis')) run.takili.forEach(function (tip, i) {
      emoji(TURLER[tip].ikon, hx + (i % 2 ? 9 : -9), hy + 16 + Math.floor(i / 2) * 9, 20);
    });
    emoji(hookIcon(), hx, hy, 22);
    if (run && state === 'inis' && run.kalkan > 0) {
      ctx.strokeStyle = 'rgba(147,197,253,.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(hx, hy, 16, 0, 7); ctx.stroke();
    }
    // Karanlık (Derin Uçurum): yalnızca kancanın çevresi görünür
    if (sea.karanlik && run && (state === 'inis' || state === 'cikis') && run.hy > 150 * PX) {
      var dark = Math.min(0.94, (run.hy / PX - 150) / 150);
      var rg = ctx.createRadialGradient(hx, hy, 40, hx, hy, 170);
      rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,' + dark + ')');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
      run.fish.forEach(function (f) {
        var d = TURLER[f.tip];
        if (f.canli && d && d.parilti && f.y - top > -50 && f.y - top < H + 50) emoji(d.ikon, f.x, f.y - top, f.boy, f.vx > 0);
      });
    }
    // Yüzeyde uçan balıklar
    if (run && state === 'yuzey') run.ucan.forEach(function (f) {
      if (f.canli) emoji(TURLER[f.tip].ikon, f.x, f.y - top, 32, f.vx > 0);
    });
    if (run) run.popups.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.t * 1.5));
      ctx.fillStyle = p.renk; ctx.font = 'bold 18px sans-serif';
      ctx.fillText(p.yazi, p.x, p.y - top - 20);
      ctx.globalAlpha = 1;
    });
    if (state === 'yuzey') {
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif';
      ctx.fillText('Balıklara dokun! (Boşluk)', W / 2, 26);
    } else if (state === 'menu' || state === 'bitti') {
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif';
      ctx.fillText(daily ? '📅 Günlük tur' : sea.ikon + ' ' + sea.ad, W / 2, 26);
      ctx.font = '13px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.8)';
      ctx.fillText('Dokun veya Boşluk: oltayı at', W / 2, H - 24);
    }
  }
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function frame(t) {
    var dt = Math.min(0.033, Math.max(0, (t - last) / 1000));
    last = t;
    if (!paused && !MiniOyun.duraklatildi()) {
      t0 += dt;
      if (playing()) { update(dt); hud(); }
      var ct = cameraTarget();
      camY += (ct - camY) * Math.min(1, dt * 8);
    }
    draw();
    requestAnimationFrame(frame);
  }

  var DECO = ['🐟', '🐠', '🐡', '🦀'];
  for (var i = 0; i < 9; i++) deco.push({ ch: DECO[i % 4], x: Math.random() * W, y: 30 + Math.random() * 380, s: 18 + Math.random() * 10, v: (Math.random() < 0.5 ? -1 : 1) * (12 + Math.random() * 25) });
  window.addEventListener('resize', resize);

  MiniOyun.oyun({
    restart: function () { note = ''; state = 'menu'; startRound(); },
    pause: function () { paused = true; keys.sol = keys.sag = false; },
    resume: function () { paused = false; },
    canPause: function () { return state === 'inis' || state === 'cikis' || state === 'yuzey'; },
    seviye: function () { return daily ? 'günlük' : seaById(save.deniz).ad.toLocaleLowerCase('tr'); }
  });

  if (!daily) { collectIdle(true); missionsReady(); }
  renderPanel();
  hud();
  resize();
  requestAnimationFrame(function (t) { last = t; frame(t); });
})();

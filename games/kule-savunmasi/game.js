(function () {
  // Kule Savunması: 10 bölümlük harita, bölüm başına 1-3 yıldız, yıldızlarla alınan kalıcı yetenekler,
  // bölüm geçtikçe açılan kuleler ve 3 seviyeli kule yükseltmeleri. İlerleme localStorage'da tutulur.
  var COLS = 12, ROWS = 8, T = 48, W = COLS * T, H = ROWS * T;
  var SAVE_KEY = 'mo_kule';
  var SPEEDS = [1, 2, 3];

  // acilis: kulenin açıldığı bölüm. sev: seviye başına [hasar, menzil (kare), atış/sn]; yuk: yükseltme bedelleri.
  var TOWERS = {
    okcu: { ad: 'Okçu', ikon: '🏹', bedel: 50, yuk: [60, 110], acilis: 1, renk: '#ffd166', sev: [[10, 2.6, 1.4], [17, 2.9, 1.6], [28, 3.2, 1.8]], aciklama: 'Ucuz ve hızlı, tek hedef.' },
    buz: { ad: 'Buz', ikon: '❄️', bedel: 70, yuk: [70, 120], acilis: 2, renk: '#8fd3ff', sev: [[4, 2.2, 1], [7, 2.4, 1.1], [11, 2.7, 1.2]], yavas: [0.45, 0.55, 0.65], aciklama: 'Düşmanı yavaşlatır.' },
    top: { ad: 'Top', ikon: '💣', bedel: 110, yuk: [100, 170], acilis: 4, renk: '#ff8c69', sev: [[26, 2.4, 0.55], [42, 2.6, 0.6], [66, 2.8, 0.65]], alan: 0.95, aciklama: 'Alan hasarı, kalabalığa karşı.' },
    buyu: { ad: 'Büyü', ikon: '🔮', bedel: 160, yuk: [150, 240], acilis: 7, renk: '#c77dff', sev: [[42, 3.2, 1.1], [70, 3.5, 1.2], [110, 3.9, 1.3]], aciklama: 'Yüksek hasar, uzun menzil.' }
  };
  var ORDER = ['okcu', 'buz', 'top', 'buyu'];

  // hiz: kare/sn, odul: altın
  var ENEMIES = {
    g: { ad: 'Goblin', ikon: '👺', can: 30, hiz: 1.2, odul: 5, aralik: 0.8, boy: 26 },
    k: { ad: 'Kurt', ikon: '🐺', can: 18, hiz: 2.2, odul: 4, aralik: 0.5, boy: 26 },
    o: { ad: 'Ork', ikon: '👹', can: 110, hiz: 0.7, odul: 12, aralik: 1.4, boy: 30 },
    b: { ad: 'Ejder', ikon: '🐉', can: 900, hiz: 0.5, odul: 80, aralik: 2, boy: 40 }
  };

  // Yol köşeleri (sütun, satır); ilk ve son nokta tahtanın dışında
  var LEVELS = [
    { ad: 'Yeşil Vadi', yol: [[-1, 2], [5, 2], [5, 5], [12, 5]], para: 120, dalga: 4 },
    { ad: 'Dere Kenarı', yol: [[-1, 1], [3, 1], [3, 6], [8, 6], [8, 2], [12, 2]], para: 130, dalga: 5 },
    { ad: 'Eski Köprü', yol: [[2, -1], [2, 5], [6, 5], [6, 1], [10, 1], [10, 8]], para: 140, dalga: 6 },
    { ad: 'Kayalık Geçit', yol: [[-1, 6], [2, 6], [2, 1], [6, 1], [6, 6], [9, 6], [9, 2], [12, 2]], para: 150, dalga: 6 },
    { ad: 'Sisli Orman', yol: [[-1, 4], [3, 4], [3, 1], [9, 1], [9, 6], [12, 6]], para: 160, dalga: 7 },
    { ad: 'Kum Tepeleri', yol: [[11, -1], [11, 2], [1, 2], [1, 5], [10, 5], [10, 8]], para: 170, dalga: 7 },
    { ad: 'Yılan Yolu', yol: [[-1, 1], [10, 1], [10, 3], [1, 3], [1, 5], [10, 5], [10, 7], [-1, 7]], para: 180, dalga: 8 },
    { ad: 'Buzul Ovası', yol: [[5, -1], [5, 2], [1, 2], [1, 6], [5, 6], [5, 4], [9, 4], [9, 1], [12, 1]], para: 190, dalga: 8 },
    { ad: 'Volkan Ağzı', yol: [[-1, 6], [3, 6], [3, 1], [7, 1], [7, 6], [10, 6], [10, 1], [12, 1]], para: 200, dalga: 9 },
    { ad: 'Ejder Kalesi', yol: [[-1, 3], [2, 3], [2, 0], [6, 0], [6, 7], [9, 7], [9, 3], [12, 3]], para: 220, dalga: 10 }
  ];

  // Yıldızlarla alınan kalıcı yetenekler; r. kademe r yıldız tutar.
  var TALENTS = [
    { id: 'altin', ikon: '💰', ad: 'Hazine', aciklama: 'Bölüme +40 altınla başla', max: 3 },
    { id: 'guc', ikon: '⚔️', ad: 'Keskin silahlar', aciklama: 'Kulelere +10% hasar', max: 3 },
    { id: 'menzil', ikon: '🔭', ad: 'Gözcü', aciklama: 'Kulelere +8% menzil', max: 3 },
    { id: 'sur', ikon: '🧱', ad: 'Sağlam surlar', aciklama: 'Bölüme +3 canla başla', max: 3 }
  ];
  var BASE_LIVES = 20;

  var canvas = document.getElementById('alan');
  var ctx = canvas.getContext('2d');
  var mapEl = document.getElementById('harita');
  var levelsEl = document.getElementById('bolumler');
  var talentsEl = document.getElementById('yetenekler');
  var starsEl = document.getElementById('yildiz');
  var paletteEl = document.getElementById('kuleler');
  var infoEl = document.getElementById('secim');
  var livesEl = document.getElementById('can');
  var goldEl = document.getElementById('altin');
  var waveEl = document.getElementById('dalga');
  var waveBtn = document.getElementById('dalga-btn');
  var speedBtn = document.getElementById('hiz');
  var msgEl = document.getElementById('msg');
  var mapBtn = document.getElementById('harita-btn');
  var hudEl = document.getElementById('ust');

  var progress = loadProgress();
  var lv = 0, L, path, pathSet, segs, pathLen, towers, enemies, shots, booms, spawnQ, spawnT;
  var lives, maxLives, gold, wave, waveOn, countdown, earned, running = false, paused = false, over = false;
  var speedIdx = 0, buildType = 'okcu', selTower = null, cursor = { c: 0, r: 0 }, hover = null, rnd = Math.random;
  var last = 0, deco = [];

  // ---------- Kayıt ----------
  function loadProgress() {
    var p;
    try { p = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) {}
    p = p || {};
    p.yildiz = p.yildiz || {};
    p.yetenek = p.yetenek || {};
    return p;
  }
  function saveProgress() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch (e) {}
  }
  function totalStars() {
    var n = 0;
    for (var k in progress.yildiz) n += progress.yildiz[k];
    return n;
  }
  function spentStars() {
    var n = 0;
    TALENTS.forEach(function (t) { var r = progress.yetenek[t.id] || 0; n += r * (r + 1) / 2; });
    return n;
  }
  function rank(id) { return progress.yetenek[id] || 0; }
  function unlocked(i) { return i === 0 || !!progress.yildiz[i]; }
  function towerOpen(type) { return TOWERS[type].acilis === 1 || !!progress.yildiz[TOWERS[type].acilis - 1]; }

  // ---------- Harita ekranı ----------
  function showMap() {
    running = false;
    mapEl.hidden = false;
    canvas.hidden = true;
    setPlayUi(false);
    var free = totalStars() - spentStars();
    starsEl.textContent = '⭐ ' + totalStars() + ' / ' + LEVELS.length * 3 + ' · Harcanabilir: ' + free;
    levelsEl.innerHTML = '';
    LEVELS.forEach(function (lvl, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ks-bolum' + (unlocked(i) ? '' : ' kilitli');
      b.disabled = !unlocked(i);
      var s = progress.yildiz[i + 1] || 0;
      b.innerHTML = '<b>' + (i + 1) + '</b><span class="ks-ad"></span><span class="ks-yildiz">' + (unlocked(i) ? '★★★'.slice(0, s) + '☆☆☆'.slice(s) : '🔒') + '</span>';
      b.querySelector('.ks-ad').textContent = lvl.ad;
      b.setAttribute('aria-label', 'Bölüm ' + (i + 1) + ': ' + lvl.ad + (unlocked(i) ? ', ' + s + ' yıldız' : ', kilitli'));
      b.addEventListener('click', function () { startLevel(i); });
      levelsEl.appendChild(b);
    });
    talentsEl.innerHTML = '';
    TALENTS.forEach(function (t) {
      var r = rank(t.id), cost = r + 1;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ks-yetenek';
      b.disabled = r >= t.max || free < cost;
      b.innerHTML = '<span class="ks-y-ikon" aria-hidden="true">' + t.ikon + '</span><span><b></b><small></small></span><span class="ks-y-bedel"></span>';
      b.querySelector('b').textContent = t.ad + ' ' + '●●●'.slice(0, r) + '○○○'.slice(r, t.max);
      b.querySelector('small').textContent = t.aciklama;
      b.querySelector('.ks-y-bedel').textContent = r >= t.max ? 'Tam' : cost + ' ⭐';
      b.addEventListener('click', function () {
        progress.yetenek[t.id] = r + 1;
        saveProgress();
        MiniOyun.ses('puan');
        showMap();
      });
      talentsEl.appendChild(b);
    });
    var reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'btn btn-ghost ks-sifirla';
    reset.textContent = 'Yetenekleri sıfırla';
    reset.disabled = !spentStars();
    reset.addEventListener('click', function () { progress.yetenek = {}; saveProgress(); showMap(); });
    talentsEl.appendChild(reset);
    msgEl.textContent = '';
    draw();
  }

  // Harita açıkken oyun içi göstergeler gizlenir
  function setPlayUi(on) {
    [hudEl, paletteEl, infoEl].forEach(function (el) { el.hidden = !on; });
  }

  // ---------- Bölüm ----------
  function buildPath() {
    path = L.yol.map(function (p) { return { x: (p[0] + 0.5) * T, y: (p[1] + 0.5) * T }; });
    pathSet = {};
    segs = [];
    pathLen = 0;
    for (var i = 1; i < L.yol.length; i++) {
      var a = L.yol[i - 1], b = L.yol[i];
      var dc = Math.sign(b[0] - a[0]), dr = Math.sign(b[1] - a[1]);
      for (var c = a[0], r = a[1]; ; c += dc, r += dr) {
        pathSet[c + ',' + r] = true;
        if (c === b[0] && r === b[1]) break;
      }
      var len = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
      segs.push({ a: path[i - 1], b: path[i], len: len, from: pathLen });
      pathLen += len;
    }
  }

  function startLevel(i) {
    lv = i;
    L = LEVELS[i];
    rnd = MiniOyun.rastgele();
    buildPath();
    deco = [];
    for (var n = 0; n < 14; n++) deco.push({ c: Math.floor(rnd() * COLS), r: Math.floor(rnd() * ROWS), s: rnd() });
    towers = [];
    enemies = [];
    shots = [];
    booms = [];
    spawnQ = [];
    spawnT = 0;
    maxLives = BASE_LIVES + rank('sur') * 3;
    lives = maxLives;
    gold = L.para + rank('altin') * 40;
    wave = 0;
    waveOn = false;
    countdown = -1;
    earned = 0;
    over = false;
    paused = false;
    selTower = null;
    if (!towerOpen(buildType)) buildType = 'okcu';
    mapEl.hidden = true;
    canvas.hidden = false;
    setPlayUi(true);
    resize();
    running = true;
    msgEl.textContent = 'Bölüm ' + (i + 1) + ': ' + L.ad + '. Kuleleri yerleştir, sonra dalgayı başlat.';
    drawPalette();
    hud();
    canvas.focus();
  }

  function waveList(w) {
    var n = lv + 1, list = [], i;
    var mult = (1 + 0.1 * (n - 1)) * (1 + 0.15 * (w - 1));
    function add(type, count) { for (i = 0; i < count; i++) list.push(type); }
    add('g', 5 + w * 2);
    if (w >= 2 && n >= 2) add('k', w + Math.floor(n / 2));
    if (w >= 3 && n >= 3) add('o', Math.floor((w - 1) / 2) + Math.floor(n / 3));
    if (w === L.dalga && n >= 5) add('b', n === 10 ? 2 : 1);
    return list.map(function (t) { return { tip: t, carpan: mult }; });
  }

  function startWave() {
    if (!running || over || waveOn || wave >= L.dalga) return;
    // Erken çağırma ödülü: kalan geri sayım saniyesi başına 2 altın
    if (countdown > 0) { gold += Math.ceil(countdown) * 2; }
    wave++;
    waveOn = true;
    countdown = -1;
    spawnQ = waveList(wave);
    spawnT = 0;
    MiniOyun.ses('tik');
    msgEl.textContent = wave === L.dalga ? 'Son dalga!' : '';
    hud();
  }

  function spawn(item) {
    var e = ENEMIES[item.tip];
    enemies.push({ tip: item.tip, d: 0, can: e.can * item.carpan, max: e.can * item.carpan, yavas: 0, yavasT: 0, x: path[0].x, y: path[0].y });
  }

  function posAt(d) {
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      if (d <= s.from + s.len || i === segs.length - 1) {
        var t = Math.min(1, (d - s.from) / s.len);
        return { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t };
      }
    }
  }

  function stats(t) {
    var s = TOWERS[t.tip].sev[t.sev];
    return { hasar: s[0] * (1 + 0.1 * rank('guc')), menzil: s[1] * T * (1 + 0.08 * rank('menzil')), hiz: s[2] };
  }

  function step(dt) {
    var i, e;
    // Doğma
    if (spawnQ.length) {
      spawnT -= dt;
      if (spawnT <= 0) {
        var item = spawnQ.shift();
        spawn(item);
        spawnT = ENEMIES[item.tip].aralik;
      }
    }
    // Hareket
    for (i = enemies.length - 1; i >= 0; i--) {
      e = enemies[i];
      if (e.yavasT > 0) { e.yavasT -= dt; if (e.yavasT <= 0) e.yavas = 0; }
      e.d += ENEMIES[e.tip].hiz * T * (1 - e.yavas) * dt;
      if (e.d >= pathLen) {
        enemies.splice(i, 1);
        lives -= e.tip === 'b' ? 5 : e.tip === 'o' ? 2 : 1;
        MiniOyun.ses('kaybet');
        if (lives <= 0) { lives = 0; return end(false); }
        continue;
      }
      var p = posAt(e.d);
      e.x = p.x; e.y = p.y;
    }
    // Kuleler: menzildeki en ilerideki düşmana ateş
    towers.forEach(function (t) {
      t.bekle -= dt;
      if (t.bekle > 0) return;
      var s = stats(t), target = null;
      enemies.forEach(function (en) {
        if (Math.hypot(en.x - t.x, en.y - t.y) <= s.menzil && (!target || en.d > target.d)) target = en;
      });
      if (!target) return;
      t.bekle = 1 / s.hiz;
      t.aci = Math.atan2(target.y - t.y, target.x - t.x);
      shots.push({ tip: t.tip, sev: t.sev, x: t.x, y: t.y, hedef: target, hasar: s.hasar, hiz: t.tip === 'top' ? 260 : 420 });
    });
    // Mermiler
    for (i = shots.length - 1; i >= 0; i--) {
      var sh = shots[i], tg = sh.hedef;
      var dx = tg.x - sh.x, dy = tg.y - sh.y, dist = Math.hypot(dx, dy), mv = sh.hiz * dt;
      if (dist > mv) { sh.x += dx / dist * mv; sh.y += dy / dist * mv; continue; }
      shots.splice(i, 1);
      hit(sh, tg);
    }
    for (i = booms.length - 1; i >= 0; i--) { booms[i].t -= dt; if (booms[i].t <= 0) booms.splice(i, 1); }
    // Ölüler
    for (i = enemies.length - 1; i >= 0; i--) {
      e = enemies[i];
      if (e.can > 0) continue;
      enemies.splice(i, 1);
      gold += ENEMIES[e.tip].odul;
      earned += ENEMIES[e.tip].odul;
    }
    // Dalga sonu
    if (waveOn && !spawnQ.length && !enemies.length) {
      waveOn = false;
      shots = [];
      if (wave >= L.dalga) return end(true);
      gold += 10 + wave * 2;
      countdown = 10;
      MiniOyun.ses('puan');
    } else if (countdown > 0) {
      countdown -= dt;
      if (countdown <= 0) startWave();
    }
  }

  function hit(sh, tg) {
    var def = TOWERS[sh.tip];
    if (def.alan) {
      var r = def.alan * T;
      booms.push({ x: tg.x, y: tg.y, r: r, t: 0.25 });
      enemies.forEach(function (en) { if (Math.hypot(en.x - tg.x, en.y - tg.y) <= r) en.can -= sh.hasar; });
      return;
    }
    if (tg.can <= 0 || enemies.indexOf(tg) === -1) return;
    tg.can -= sh.hasar;
    if (def.yavas) { tg.yavas = Math.max(tg.yavas, def.yavas[sh.sev]); tg.yavasT = 1.5; }
  }

  function end(won) {
    over = true;
    running = false;
    waveOn = false;
    var n = lv + 1;
    if (!won) {
      msgEl.textContent = 'Kale düştü! ' + wave + '. dalgada yenildin.';
      MiniOyun.bitti({ baslik: 'Kale düştü!', metin: 'Bölüm ' + n + ', ' + wave + '/' + L.dalga + '. dalga. Kuleleri yükseltip tekrar dene.', kaybetti: true, sonuc: wave + '/' + L.dalga + ' dalga', seviye: 'bölüm ' + n });
      setTimeout(showMap, 700);
      hud();
      return;
    }
    var stars = lives >= maxLives * 0.9 ? 3 : lives >= maxLives * 0.5 ? 2 : 1;
    var prev = progress.yildiz[n] || 0;
    var firstClear = !prev;
    if (stars > prev) progress.yildiz[n] = stars;
    saveProgress();
    var score = earned + lives * 25 + n * 100;
    var rec = MiniOyun.setBest('kule-savunmasi-' + n, score);
    var unlock = ORDER.filter(function (k) { return TOWERS[k].acilis === n + 1; })[0];
    var extra = firstClear && unlock ? ' Yeni kule açıldı: ' + TOWERS[unlock].ikon + ' ' + TOWERS[unlock].ad + '!' : '';
    if (firstClear && n < LEVELS.length) extra += ' Bölüm ' + (n + 1) + ' açıldı.';
    if (stars > prev) extra += ' +' + (stars - prev) + ' ⭐ yetenek puanı.';
    msgEl.textContent = 'Bölüm ' + n + ' geçildi! ' + '★★★'.slice(0, stars) + '☆☆☆'.slice(stars);
    MiniOyun.bitti({
      baslik: 'Bölüm ' + n + ' geçildi! ' + '⭐'.repeat(stars),
      metin: score + ' puan, ' + lives + '/' + maxLives + ' can kaldı.' + extra,
      rekor: rec,
      sonuc: score + ' puan',
      skor: score,
      seviye: 'bölüm ' + n,
      paylas: 'MiniOyun Kule Savunması: Bölüm ' + n + ' ' + '⭐'.repeat(stars) + ' (' + score + ' puan)'
    });
    setTimeout(showMap, 700);
    hud();
  }

  // ---------- İnşa ----------
  function towerAt(c, r) {
    for (var i = 0; i < towers.length; i++) if (towers[i].c === c && towers[i].r === r) return towers[i];
    return null;
  }

  function act(c, r) {
    if (!running || over || MiniOyun.duraklatildi()) return;
    cursor = { c: c, r: r };
    var t = towerAt(c, r);
    if (t) { selTower = t === selTower ? null : t; drawInfo(); return; }
    selTower = null;
    if (pathSet[c + ',' + r]) { msgEl.textContent = 'Yolun üstüne kule kurulamaz.'; drawInfo(); return; }
    var def = TOWERS[buildType];
    if (gold < def.bedel) { msgEl.textContent = def.ad + ' için ' + (def.bedel - gold) + ' altın daha lazım.'; drawInfo(); return; }
    gold -= def.bedel;
    towers.push({ tip: buildType, c: c, r: r, x: (c + 0.5) * T, y: (r + 0.5) * T, sev: 0, harcanan: def.bedel, bekle: 0, aci: -Math.PI / 2 });
    MiniOyun.ses('tik');
    msgEl.textContent = '';
    drawInfo();
    hud();
  }

  function upgrade() {
    var t = selTower;
    if (!t || !running || over || MiniOyun.duraklatildi()) return;
    var cost = TOWERS[t.tip].yuk[t.sev];
    if (cost === undefined || gold < cost) return;
    gold -= cost;
    t.harcanan += cost;
    t.sev++;
    MiniOyun.ses('puan');
    drawInfo();
    hud();
  }

  function sell() {
    var t = selTower;
    if (!t || !running || over || MiniOyun.duraklatildi()) return;
    gold += Math.floor(t.harcanan * 0.7);
    towers.splice(towers.indexOf(t), 1);
    selTower = null;
    MiniOyun.ses('tik');
    drawInfo();
    hud();
  }

  // ---------- Arayüz ----------
  function hud() {
    livesEl.textContent = lives === undefined ? '-' : lives;
    goldEl.textContent = gold === undefined ? '-' : gold;
    waveEl.textContent = L ? wave + '/' + L.dalga : '-';
    waveBtn.disabled = !running || over || waveOn || (L && wave >= L.dalga);
    waveBtn.textContent = countdown > 0 ? 'Dalga ▶ (+' + Math.ceil(countdown) * 2 + ')' : 'Dalga ▶';
    speedBtn.textContent = SPEEDS[speedIdx] + 'x';
    Array.prototype.forEach.call(paletteEl.children, function (b) {
      var def = TOWERS[b.dataset.tip];
      b.classList.toggle('pahali', running && gold < def.bedel);
    });
    if (selTower) drawInfoButtons();
  }

  function drawPalette() {
    paletteEl.innerHTML = '';
    ORDER.forEach(function (k, i) {
      var def = TOWERS[k], open = towerOpen(k);
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ks-kule' + (k === buildType ? ' secili' : '');
      b.dataset.tip = k;
      b.disabled = !open;
      b.setAttribute('aria-pressed', k === buildType ? 'true' : 'false');
      b.innerHTML = '<span class="ks-k-ikon" aria-hidden="true">' + (open ? def.ikon : '🔒') + '</span><span class="ks-k-ad"></span><span class="ks-k-bedel"></span>';
      b.querySelector('.ks-k-ad').textContent = (i + 1) + '. ' + def.ad;
      b.querySelector('.ks-k-bedel').textContent = open ? def.bedel + ' 💰' : 'Bölüm ' + def.acilis;
      b.title = open ? def.aciklama : (def.acilis - 1) + '. bölümü geçince açılır';
      b.addEventListener('click', function () { choose(k); });
      paletteEl.appendChild(b);
    });
  }

  function choose(k) {
    if (!towerOpen(k)) return;
    buildType = k;
    selTower = null;
    Array.prototype.forEach.call(paletteEl.children, function (b) {
      b.classList.toggle('secili', b.dataset.tip === k);
      b.setAttribute('aria-pressed', b.dataset.tip === k ? 'true' : 'false');
    });
    drawInfo();
  }

  function drawInfo() {
    if (!selTower) {
      var def = TOWERS[buildType];
      infoEl.innerHTML = '';
      infoEl.textContent = def.ikon + ' ' + def.ad + ': ' + def.aciklama + ' Boş bir kareye dokunarak kur.';
      return;
    }
    var t = selTower, d = TOWERS[t.tip];
    infoEl.innerHTML = '<span class="ks-s-ad"></span><button type="button" class="btn" data-a="yukselt"></button><button type="button" class="btn btn-ghost" data-a="sat"></button>';
    infoEl.querySelector('.ks-s-ad').textContent = d.ikon + ' ' + d.ad + ' · Seviye ' + (t.sev + 1) + '/3';
    infoEl.querySelector('[data-a="yukselt"]').addEventListener('click', upgrade);
    infoEl.querySelector('[data-a="sat"]').addEventListener('click', sell);
    drawInfoButtons();
  }

  function drawInfoButtons() {
    var t = selTower, d = TOWERS[t.tip], up = infoEl.querySelector('[data-a="yukselt"]'), sl = infoEl.querySelector('[data-a="sat"]');
    if (!up) return;
    var cost = d.yuk[t.sev];
    up.textContent = cost === undefined ? 'En üst seviye' : 'Yükselt (' + cost + ' 💰)';
    up.disabled = cost === undefined || gold < cost;
    sl.textContent = 'Sat (+' + Math.floor(t.harcanan * 0.7) + ')';
  }

  // ---------- Çizim ----------
  function draw() {
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    ctx.fillStyle = '#2f6b3a';
    ctx.fillRect(0, 0, W, H);
    for (var c = 0; c < COLS; c++) for (var r = 0; r < ROWS; r++) {
      if ((c + r) % 2) { ctx.fillStyle = '#2b6336'; ctx.fillRect(c * T, r * T, T, T); }
    }
    if (!L) return;
    deco.forEach(function (d) {
      if (pathSet[d.c + ',' + d.r] || towerAt(d.c, d.r)) return;
      ctx.fillStyle = d.s > 0.5 ? '#3b8048' : '#24552e';
      ctx.beginPath();
      ctx.arc(d.c * T + 10 + d.s * 28, d.r * T + 12 + (1 - d.s) * 24, 3 + d.s * 3, 0, Math.PI * 2);
      ctx.fill();
    });
    // Yol
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.strokeStyle = '#8a6a3f';
    ctx.lineWidth = T * 0.92;
    ctx.beginPath();
    path.forEach(function (p, i) { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
    ctx.stroke();
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = T * 0.72;
    ctx.stroke();
    var endP = path[path.length - 1];
    emoji('🏰', clamp(endP.x, W), clamp(endP.y, H), 34);
    // Menzil önizlemesi
    var focus = selTower || (hover && running && !towerAt(hover.c, hover.r) && !pathSet[hover.c + ',' + hover.r] ? { tip: buildType, sev: 0, x: (hover.c + 0.5) * T, y: (hover.r + 0.5) * T, hayal: true } : null);
    if (focus) {
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      ctx.strokeStyle = 'rgba(255,255,255,.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(focus.x, focus.y, stats(focus).menzil, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    // Kuleler
    towers.forEach(function (t) {
      ctx.fillStyle = t === selTower ? '#fff3c4' : '#5a5f80';
      roundRect(t.c * T + 5, t.r * T + 5, T - 10, T - 10, 9);
      ctx.fillStyle = TOWERS[t.tip].renk;
      roundRect(t.c * T + 9, t.r * T + 9, T - 18, T - 18, 7);
      emoji(TOWERS[t.tip].ikon, t.x, t.y + 1, 22);
      for (var s = 0; s <= t.sev; s++) {
        ctx.fillStyle = '#ffd43b';
        ctx.beginPath();
        ctx.arc(t.c * T + 12 + s * 8, t.r * T + T - 8, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    if (focus && focus.hayal) {
      ctx.globalAlpha = 0.55;
      emoji(TOWERS[buildType].ikon, focus.x, focus.y, 22);
      ctx.globalAlpha = 1;
    }
    // Düşmanlar
    enemies.forEach(function (e) {
      var def = ENEMIES[e.tip];
      if (e.yavas) {
        ctx.fillStyle = 'rgba(143,211,255,.45)';
        ctx.beginPath();
        ctx.arc(e.x, e.y, def.boy * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      emoji(def.ikon, e.x, e.y, def.boy);
      var w = def.boy;
      ctx.fillStyle = '#2b0d0d';
      ctx.fillRect(e.x - w / 2, e.y - def.boy / 2 - 8, w, 5);
      ctx.fillStyle = e.can / e.max > 0.5 ? '#51cf66' : e.can / e.max > 0.25 ? '#fcc419' : '#ff6b6b';
      ctx.fillRect(e.x - w / 2, e.y - def.boy / 2 - 8, w * Math.max(0, e.can / e.max), 5);
    });
    shots.forEach(function (s) {
      ctx.fillStyle = TOWERS[s.tip].renk;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.tip === 'top' ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
    });
    booms.forEach(function (b) {
      ctx.fillStyle = 'rgba(255,140,105,' + (b.t * 2.4) + ')';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * (1.2 - b.t * 2), 0, Math.PI * 2);
      ctx.fill();
    });
    // Klavye imleci
    if (running && document.activeElement === canvas) {
      ctx.strokeStyle = '#ffc23d';
      ctx.lineWidth = 3;
      ctx.strokeRect(cursor.c * T + 2, cursor.r * T + 2, T - 4, T - 4);
    }
    if (running && countdown > 0) {
      ctx.fillStyle = 'rgba(13,11,31,.7)';
      roundRect(W / 2 - 110, 8, 220, 32, 10);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Sonraki dalga: ' + Math.ceil(countdown) + ' sn', W / 2, 24);
    }
  }

  // Tahta dışındaki yol ucunu kenardaki kareye çeker (kale simgesi için)
  function clamp(v, max) { return v < 0 ? T * 0.5 : v > max ? max - T * 0.5 : v; }

  function emoji(ch, x, y, size) {
    ctx.font = size + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, x, y);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.fill();
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth || W;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(w * H / W * dpr);
    draw();
  }

  // ---------- Döngü ----------
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (running && !paused && !over) {
      var total = dt * SPEEDS[speedIdx];
      while (total > 0 && running) {
        var d = Math.min(total, 1 / 30);
        step(d);
        total -= d;
      }
      hud();
    }
    draw();
    requestAnimationFrame(frame);
  }

  // ---------- Girişler ----------
  function cellFromEvent(e) {
    var rect = canvas.getBoundingClientRect();
    var c = Math.floor((e.clientX - rect.left) / rect.width * COLS), r = Math.floor((e.clientY - rect.top) / rect.height * ROWS);
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return null;
    return { c: c, r: r };
  }
  canvas.addEventListener('click', function (e) {
    var cell = cellFromEvent(e);
    if (cell) act(cell.c, cell.r);
  });
  canvas.addEventListener('mousemove', function (e) { hover = cellFromEvent(e); });
  canvas.addEventListener('mouseleave', function () { hover = null; });
  canvas.addEventListener('keydown', function (e) {
    if (!running || MiniOyun.duraklatildi()) return;
    var k = e.key, moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (moves[k]) {
      cursor.c = Math.max(0, Math.min(COLS - 1, cursor.c + moves[k][0]));
      cursor.r = Math.max(0, Math.min(ROWS - 1, cursor.r + moves[k][1]));
      hover = { c: cursor.c, r: cursor.r };
    } else if (k === 'Enter') act(cursor.c, cursor.r);
    else if (k === ' ') startWave();
    else if (k === 'u' || k === 'U') upgrade();
    else if (k === 'x' || k === 'X') sell();
    else if (k === 'f' || k === 'F') speedBtn.click();
    else if (k >= '1' && k <= '4') choose(ORDER[+k - 1]);
    else return;
    e.preventDefault();
  });
  waveBtn.addEventListener('click', function () { if (!MiniOyun.duraklatildi()) startWave(); });
  speedBtn.addEventListener('click', function () { speedIdx = (speedIdx + 1) % SPEEDS.length; hud(); });
  mapBtn.addEventListener('click', function () {
    if (running && wave > 0 && !over) msgEl.textContent = 'Bölüm yarıda bırakıldı.';
    showMap();
  });
  window.addEventListener('resize', resize);

  MiniOyun.oyun({
    restart: function () { if (L && (running || over)) startLevel(lv); else showMap(); },
    pause: function () { paused = true; },
    resume: function () { paused = false; last = performance.now(); },
    canPause: function () { return running && !over; },
    seviye: function () { return L ? 'bölüm ' + (lv + 1) : ''; }
  });

  drawPalette();
  drawInfo();
  hud();
  showMap();
  resize();
  requestAnimationFrame(function (t) { last = t; frame(t); });
})();

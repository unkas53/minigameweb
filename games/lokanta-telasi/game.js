(function () {
  // Lokanta Telaşı: müşterilerin siparişlerini sabırları bitmeden hazırlayıp servis edilen restoran oyunu.
  // 4 semt x 10 gün kariyer, gün başına 1-3 yıldız, parayla kalıcı yükseltmeler, yıldızla açılan tezgâh
  // örtüleri, tabela adı, günlük görevler, serbest vardiya ve günlük modda (?gunluk=) herkese aynı vardiya.
  // Kayıt: mo_lokanta.
  var SAVE_KEY = 'mo_lokanta';
  var GUN_SAYI = 40, KALP = 3, TICK = 0.1, YANMA = 4;

  var MALZ = {
    lavas: { ikon: '🫓', ad: 'Lavaş' },
    et: { ikon: '🥩', ad: 'Et', izgara: true },
    domates: { ikon: '🍅', ad: 'Domates' },
    sogan: { ikon: '🧅', ad: 'Soğan' },
    ayran: { ikon: '🥛', ad: 'Ayran' },
    sis: { ikon: '🍢', ad: 'Şiş', izgara: true },
    biber: { ikon: '🌶️', ad: 'Biber' },
    corba: { ikon: '🍲', ad: 'Çorba kâsesi', hazirlik: 1.5 },
    limon: { ikon: '🍋', ad: 'Limon' },
    cay: { ikon: '🍵', ad: 'Çay', hazirlik: 'cay' },
    salatalik: { ikon: '🥒', ad: 'Salatalık' },
    sutlac: { ikon: '🍮', ad: 'Sütlaç' },
    tarcin: { ikon: '🟤', ad: 'Tarçın' }
  };
  var YEMEK = {
    durum: { ikon: '🥙', ad: 'Dürüm', tarif: ['lavas', 'et', 'domates', 'sogan'], fiyat: 12, gun: 1 },
    ayran: { ikon: '🥛', ad: 'Ayran', tarif: ['ayran'], fiyat: 4, gun: 1, icecek: true },
    sis: { ikon: '🍢', ad: 'Şiş', tarif: ['sis'], fiyat: 9, gun: 3 },
    acili: { ikon: '🍢🌶️', ad: 'Acılı şiş', tarif: ['sis', 'biber'], fiyat: 11, gun: 6 },
    corba: { ikon: '🍲🍋', ad: 'Mercimek çorbası', tarif: ['corba', 'limon'], fiyat: 9, gun: 11 },
    cay: { ikon: '🍵', ad: 'Çay', tarif: ['cay'], fiyat: 3, gun: 11, icecek: true },
    salata: { ikon: '🥗', ad: 'Çoban salatası', tarif: ['domates', 'salatalik', 'sogan'], fiyat: 8, gun: 21 },
    sutlac: { ikon: '🍮', ad: 'Sütlaç', tarif: ['sutlac', 'tarcin'], fiyat: 7, gun: 21 }
  };
  var TIP = {
    normal: { ikon: '🧑', sabir: 1, bahsis: 1 },
    yasli: { ikon: '👵', sabir: 1.4, bahsis: 0.5 },
    aceleci: { ikon: '🧑‍💼', sabir: 0.6, bahsis: 2 },
    cocuk: { ikon: '🧒', sabir: 1.6, bahsis: 1 },
    elestirmen: { ikon: '🧑‍🍳', sabir: 0.8, bahsis: 1.5 }
  };
  var SEMT = [
    { ad: 'Mahalle Büfesi', ikon: '🏪', renk: '#fcd34d', esik: 0 },
    { ad: 'Sahil Lokantası', ikon: '🌉', renk: '#7dd3fc', esik: 18 },
    { ad: 'Çarşı Lokantası', ikon: '🏛️', renk: '#fca5a5', esik: 42 },
    { ad: 'Meydan Restoranı', ikon: '🌃', renk: '#a78bfa', esik: 70 }
  ];
  var YUK = [
    { id: 'izgara', ikon: '🔥', ad: 'Izgara', bedel: [120, 400, 900, 1800], bilgi: 'Seviye 1 ve 3: +1 ızgara yeri, seviye 2 ve 4: daha hızlı pişirme' },
    { id: 'dekor', ikon: '🪴', ad: 'Dekor', bedel: [100, 300, 700, 1400, 2500], bilgi: 'Tüm müşterilerin sabrı seviye başına +%8' },
    { id: 'cay', ikon: '🫖', ad: 'Çay ocağı', bedel: [150, 500, 1200], bilgi: 'Çay demleme süresi 4 sn → 1 sn' },
    { id: 'kasa', ikon: '💵', ad: 'Kasa', bedel: [200, 500, 1000, 1800, 2800], bilgi: 'Bahşiş seviye başına +%10' },
    { id: 'zil', ikon: '🛎️', ad: 'Garson zili', bedel: [250, 800, 1600], bilgi: 'Sabrı kırmızıya düşen müşteriye bir kez ek süre' },
    { id: 'tabak', ikon: '🍽️', ad: 'İkinci tabak', bedel: [600], bilgi: 'Aynı anda iki tabak hazırla (Tab ile geç)' },
    { id: 'tezgah', ikon: '🪑', ad: 'Tezgâh', bedel: [1500], bilgi: 'Tezgâhta 4. müşteri yeri' }
  ];
  var ORTU = [
    { id: 'sade', ad: 'Sade ahşap', css: 'linear-gradient(#b45309, #78350f)' },
    { id: 'kareli', ad: 'Kareli örtü', yildiz: 10, css: 'repeating-conic-gradient(#b91c1c 0 25%, #fef3c7 0 50%) 0 0 / 24px 24px' },
    { id: 'cicekli', ad: 'Çiçekli örtü', yildiz: 30, css: 'radial-gradient(circle, #f472b6 3px, transparent 4px) 0 0 / 18px 18px, #fde68a' },
    { id: 'cini', ad: 'Çini desen', yildiz: 60, css: 'radial-gradient(circle, #1d4ed8 4px, #e0f2fe 5px) 0 0 / 20px 20px' },
    { id: 'altin', ad: 'Altın işlemeli', yildiz: 100, css: 'linear-gradient(135deg, #facc15, #b45309, #facc15)' },
    { id: 'cadilar', ad: '🎃 Cadılar Bayramı', seri: 7, css: 'repeating-linear-gradient(45deg, #f97316 0 12px, #1f2937 12px 24px)' }
  ];
  var GOREVLER = [
    { id: 'durum15', ad: '15 dürüm servis et', hedef: 15 },
    { id: 'icecek12', ad: '12 içecek servis et', hedef: 12 },
    { id: 'musteri25', ad: '25 müşteriyi mutlu gönder', hedef: 25 },
    { id: 'kombo5', ad: '5\'li kombo yap', hedef: 5 },
    { id: 'para400', ad: 'Toplam 400 💰 kazan', hedef: 400 },
    { id: 'yaniksiz', ad: 'Bir günü hiç yanık yapmadan bitir', hedef: 1 },
    { id: 'yildiz3', ad: 'Bir günden 3 yıldız al', hedef: 1 }
  ];
  var GOREV_ODUL = 150;
  var IPUCU = [
    'Eğitim 1/5: 🥩 Et\'e dokun, ızgaraya gitsin.',
    'Eğitim 2/5: 🫓 Lavaş, 🍅 domates ve 🧅 soğanı tabağa ekle.',
    'Eğitim 3/5: Et kahverengi olup yeşil halka çıkınca ızgaradaki ete dokun, tabağa geçer.',
    'Eğitim 4/5: Tabak hazır! Dürüm isteyen müşteriye dokunarak servis et.',
    'Eğitim 5/5: Sabır çubuklarına dikkat et. Yanan eti ızgarada ona dokunarak çöpe at, yanlış tabağı 🗑️ ile boşalt.'
  ];

  var mapEl = document.getElementById('harita');
  var gameEl = document.getElementById('lt-oyun');
  var daily = !!(MiniOyun.gunluk && MiniOyun.gunluk.tarih);
  var save = load();
  var run = null, gunNo = 1, mod = 'kampanya', paused = false;
  var el = {};

  // ---------- Kayıt ----------
  function load() {
    var p = null;
    try { p = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) {}
    if (!p || typeof p !== 'object' || Array.isArray(p)) p = {};
    if (!p.gunler || typeof p.gunler !== 'object') p.gunler = {};
    if (!p.yukseltme || typeof p.yukseltme !== 'object') p.yukseltme = {};
    YUK.forEach(function (u) { p.yukseltme[u.id] = Math.max(0, Math.min(u.bedel.length, Math.floor(Number(p.yukseltme[u.id]) || 0))); });
    if (!p.susleme || typeof p.susleme !== 'object') p.susleme = {};
    if (typeof p.susleme.secili !== 'string') p.susleme.secili = 'sade';
    if (!Array.isArray(p.susleme.acik)) p.susleme.acik = [];
    p.para = Math.max(0, Math.floor(Number(p.para) || 0));
    p.seri = Math.max(0, Number(p.seri) || 0);
    p.serbestRekor = Math.max(0, Number(p.serbestRekor) || 0);
    p.tabela = typeof p.tabela === 'string' ? p.tabela.slice(0, 16) : '';
    return p;
  }
  function store() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }
  function stars(n) { var g = save.gunler[n]; return g ? Math.max(0, Math.min(3, Number(g.yildiz) || 0)) : 0; }
  function totalStars() { var s = 0; for (var i = 1; i <= GUN_SAYI; i++) s += stars(i); return s; }
  function semtOpen(w) { return w === 0 || (stars(w * 10) > 0 && totalStars() >= SEMT[w].esik); }
  function dayOpen(n) { return semtOpen(Math.floor((n - 1) / 10)) && (n % 10 === 1 || stars(n - 1) > 0); }
  function lastOpenDay() { var n = 1; for (var i = 1; i <= GUN_SAYI; i++) if (dayOpen(i)) n = i; return n; }
  function ortuOpen(o) {
    if (o.yildiz) return totalStars() >= o.yildiz;
    if (o.seri) return save.susleme.acik.indexOf(o.id) !== -1 || save.seri >= o.seri;
    return true;
  }
  function lvl(id) { return run && run.mod === 'gunluk' ? 0 : save.yukseltme[id] || 0; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }

  // ---------- Günlük görevler ----------
  function today() { return MiniOyun.gunluk.bugun(); }
  function iso(t) { return t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2); }
  function dayBefore(d) { var t = new Date(d + 'T12:00:00'); t.setDate(t.getDate() - 1); return iso(t); }
  function missionsReady() {
    var g = save.gorev, d = today();
    if (g && g.gun === d && Array.isArray(g.liste) && g.liste.length === 3 && g.ilerleme && Array.isArray(g.tamam)) return;
    var rnd = MiniOyun.gunluk.rastgele(d + '/lokanta-gorev');
    var pool = GOREVLER.map(function (m) { return m.id; }), list = [];
    while (list.length < 3) list.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    save.gorev = { gun: d, liste: list, ilerleme: {}, tamam: [], odul: false };
    list.forEach(function (id) { save.gorev.ilerleme[id] = 0; });
    store();
  }
  function mission(id) { for (var i = 0; i < GOREVLER.length; i++) if (GOREVLER[i].id === id) return GOREVLER[i]; }
  // "en az" türündeki görevler için set=true
  function progressMission(id, n, set) {
    if (!run || run.mod === 'gunluk') return;
    missionsReady();
    var g = save.gorev;
    if (g.liste.indexOf(id) === -1 || g.tamam.indexOf(id) !== -1) return;
    g.ilerleme[id] = set ? Math.max(g.ilerleme[id] || 0, n) : (g.ilerleme[id] || 0) + n;
    if (g.ilerleme[id] >= mission(id).hedef) {
      g.tamam.push(id);
      say('✅ Görev tamam: ' + mission(id).ad);
      if (g.tamam.length === 3 && !g.odul) {
        g.odul = true;
        save.para += GOREV_ODUL;
        save.seri = save.sonGun === dayBefore(g.gun) ? save.seri + 1 : save.sonGun === g.gun ? save.seri : 1;
        save.sonGun = g.gun;
        ORTU.forEach(function (o) { if (o.seri && save.seri >= o.seri && save.susleme.acik.indexOf(o.id) === -1) save.susleme.acik.push(o.id); });
        say('🎁 Günlük görevler bitti: +' + GOREV_ODUL + ' 💰, seri ' + save.seri);
      }
    }
    store();
  }

  // ---------- Gün tanımı ve müşteri üretimi ----------
  function gunAyar(n) {
    var w = Math.floor((n - 1) / 10);
    return {
      no: n, semt: w,
      musteri: n === 40 ? 30 : Math.round(8 + (n - 1) * 20 / 38),
      aralik: Math.max(2.6, 6.6 - n * 0.09),
      sabir: Math.max(13, 30 - n * 0.42),
      kalem: n <= 5 ? 1 : n <= 20 ? 2 : 3,
      menu: Object.keys(YEMEK).filter(function (k) { return YEMEK[k].gun <= n; }),
      yagmur: w >= 1 && n % 4 === 2,
      aksam: w === 3,
      elestirmen: n >= 8 ? (w >= 2 ? 0.14 : 0.07) : 0
    };
  }
  function gunlukAyar() {
    var a = gunAyar(25);
    a.no = 0; a.musteri = 20; a.menu = Object.keys(YEMEK);
    return a;
  }
  function serbestAyar() {
    var a = gunAyar(Math.max(10, lastOpenDay()));
    a.no = 0; a.musteri = 400; a.serbest = true;
    return a;
  }
  function pickW(rnd, list) {
    var sum = 0, i;
    for (i = 0; i < list.length; i++) sum += list[i][1];
    var r = rnd() * sum;
    for (i = 0; i < list.length; i++) { r -= list[i][1]; if (r < 0) return list[i][0]; }
    return list[list.length - 1][0];
  }
  function uret(ay, rnd) {
    var list = [], t = 1;
    for (var i = 0; i < ay.musteri; i++) {
      var tip = pickW(rnd, [['normal', 5], ['yasli', 2], ['aceleci', 1.2 + ay.semt * 0.6], ['cocuk', 1.2], ['elestirmen', ay.elestirmen * 12]]);
      var sip = [];
      if (tip === 'cocuk') sip.push(ay.menu.indexOf('sutlac') !== -1 && rnd() < 0.5 ? 'sutlac' : 'ayran');
      else {
        var adet = 1 + Math.floor(rnd() * ay.kalem);
        for (var k = 0; k < adet; k++) {
          sip.push(pickW(rnd, ay.menu.map(function (m) { return [m, m === 'corba' && ay.yagmur ? 4 : YEMEK[m].icecek ? 0.8 : 1]; })));
        }
      }
      var aralik = ay.aralik;
      if (ay.aksam && i > ay.musteri * 0.7) aralik /= 2;
      if (ay.serbest) aralik = Math.max(1.8, 6 - i * 0.03);
      list.push({ tip: tip, siparis: sip, gelis: t });
      t += aralik * (0.7 + rnd() * 0.6);
    }
    return list;
  }
  function hedefler(list) {
    var base = 0;
    list.forEach(function (c) { c.siparis.forEach(function (s) { base += YEMEK[s].fiyat; }); });
    return [Math.round(base * 0.85), Math.round(base * 1.2)];
  }

  // ---------- Gün başlatma ----------
  function startDay(n) { mod = 'kampanya'; gunNo = n; begin(gunAyar(n), MiniOyun.gunluk.rastgele('lokanta/gun' + n)); }
  function startDaily() { mod = 'gunluk'; begin(gunlukAyar(), MiniOyun.rastgele()); }
  function startFree() { mod = 'serbest'; begin(serbestAyar(), MiniOyun.rastgele()); }
  function begin(ay, rnd) {
    run = {
      mod: mod, ay: ay, sira: uret(ay, rnd), t: 0, sonraki: 0, kazanc: 0, kalp: KALP, kombo: 0, enKombo: 0,
      kacan: 0, yanik: 0, mutlu: 0, elestirmenMutlu: 0, bitti: false, musteri: [], izgara: [], tabak: [], aktif: 0,
      ocak: { cay: { hal: 'bos', t: 0 }, corba: { hal: 'bos', t: 0 } }, egitim: mod === 'kampanya' && ay.no === 1 && !stars(1) ? 0 : -1
    };
    run.hedef = mod === 'serbest' ? [0, 0] : hedefler(run.sira);
    var yer = 3 + lvl('tezgah'), izg = 2 + (lvl('izgara') >= 1 ? 1 : 0) + (lvl('izgara') >= 3 ? 1 : 0), tab = 1 + lvl('tabak');
    for (var i = 0; i < yer; i++) run.musteri.push(null);
    for (i = 0; i < izg; i++) run.izgara.push(null);
    for (i = 0; i < tab; i++) run.tabak.push([]);
    paused = false;
    mapEl.hidden = true;
    gameEl.hidden = false;
    build();
    say(ay.yagmur ? '🌧️ Yağmurlu gün: müşteriler çorbaya yöneliyor.' : ay.aksam ? '🌆 Akşam yoğunluğu: günün sonunda müşteriler iki kat hızlı gelir.' : '');
    render();
  }
  function pismeSuresi() { return 3.2 - (lvl('izgara') >= 2 ? 0.4 : 0) - (lvl('izgara') >= 4 ? 0.4 : 0); }
  function hazirlikSuresi(m) { return MALZ[m].hazirlik === 'cay' ? 4 - lvl('cay') : MALZ[m].hazirlik; }
  function komboCarpan(k) { return k >= 8 ? 2 : k >= 5 ? 1.5 : k >= 2 ? 1.2 : 1; }

  // ---------- Oyun döngüsü ----------
  function tick() {
    if (!run || run.bitti || paused || gameEl.hidden || MiniOyun.duraklatildi()) return;
    var dt = TICK;
    run.t += dt;
    // Müşteri gelişi
    if (run.sonraki < run.sira.length && run.t >= run.sira[run.sonraki].gelis) {
      var bos = run.musteri.indexOf(null);
      if (bos !== -1) {
        var c = run.sira[run.sonraki++], tip = TIP[c.tip];
        var max = run.ay.sabir * tip.sabir * (1 + 0.08 * lvl('dekor')) * (1 + 0.25 * (c.siparis.length - 1));
        run.musteri[bos] = { tip: c.tip, kalan: c.siparis.slice(), sabir: max, max: max, zil: false, hata: false, ilk: c.siparis.length };
      }
    }
    // Izgara
    var pis = pismeSuresi();
    run.izgara.forEach(function (g) {
      if (!g) return;
      g.t += dt;
      var eski = g.hal;
      g.hal = g.t < pis ? 'cig' : g.t < pis + YANMA ? 'pismis' : 'yanik';
      if (eski !== g.hal && g.hal === 'pismis') MiniOyun.ses('tik');
      if (eski !== g.hal && g.hal === 'yanik') { run.yanik++; run.kombo = 0; say('💨 ' + MALZ[g.m].ad + ' yandı! Izgaraya dokunup çöpe at.'); }
    });
    // Çay ve çorba
    Object.keys(run.ocak).forEach(function (m) {
      var o = run.ocak[m];
      if (o.hal === 'haz') { o.t += dt; if (o.t >= hazirlikSuresi(m)) o.hal = 'hazir'; }
    });
    // Sabır
    var zil = lvl('zil');
    run.musteri.forEach(function (c, i) {
      if (!c) return;
      c.sabir -= dt;
      if (zil && !c.zil && c.sabir < c.max * 0.25) { c.zil = true; c.sabir += 2 + zil; say('🛎️ Zil çaldı: ' + TIP[c.tip].ikon + ' biraz daha bekleyecek.'); }
      if (c.sabir <= 0) {
        run.musteri[i] = null;
        run.kacan++; run.kalp--; run.kombo = 0;
        MiniOyun.ses('kaybet');
        say('💢 ' + TIP[c.tip].ikon + ' kızgın gitti! ❤️ -1');
      }
    });
    if (run.kalp <= 0) return finish(false);
    if (run.sonraki >= run.sira.length && run.musteri.every(function (c) { return !c; })) return finish(true);
    render();
  }

  // ---------- Girişler ----------
  function plate() { return run.tabak[run.aktif]; }
  function addToPlate(m) {
    var p = plate();
    if (p.length >= 4) { say('Tabak dolu. 🗑️ ile boşalt veya servis et.'); return; }
    p.push(m);
    MiniOyun.ses('tik');
    if (run.egitim === 1 && ['lavas', 'domates', 'sogan'].every(function (x) { return p.indexOf(x) !== -1; })) run.egitim = 2;
    if (run.egitim === 2 && p.indexOf('et') !== -1) run.egitim = p.length === 4 ? 3 : 1;
    if (run.egitim === 1 && p.length === 4) run.egitim = 3;
  }
  function pressIngredient(m) {
    if (!MALZ[m] || (el.raf[m] && el.raf[m].hidden)) return;
    if (MALZ[m].izgara) {
      var i = run.izgara.indexOf(null);
      if (i === -1) { say('Izgara dolu! Pişeni tabağa al.'); return; }
      run.izgara[i] = { m: m, t: 0, hal: 'cig' };
      MiniOyun.ses('tik');
      if (run.egitim === 0) run.egitim = 1;
    } else if (MALZ[m].hazirlik) {
      var o = run.ocak[m];
      if (o.hal === 'bos') { o.hal = 'haz'; o.t = 0; MiniOyun.ses('tik'); }
      else if (o.hal === 'hazir') { o.hal = 'bos'; addToPlate(m); }
    } else addToPlate(m);
    render();
  }
  function pressGrill(i) {
    var g = run.izgara[i];
    if (!g) return;
    if (g.hal === 'pismis') { run.izgara[i] = null; addToPlate(g.m); }
    else if (g.hal === 'yanik') { run.izgara[i] = null; MiniOyun.ses('tik'); say('🗑️ Yanık ' + MALZ[g.m].ad.toLocaleLowerCase('tr') + ' çöpe atıldı.'); }
    else say('Henüz pişmedi, yeşil halkayı bekle.');
    render();
  }
  function sameSet(a, b) {
    if (a.length !== b.length) return false;
    var x = a.slice().sort(), y = b.slice().sort();
    for (var i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
    return true;
  }
  function serve(i) {
    var c = run.musteri[i], p = plate();
    if (!c || !p.length) return;
    var k = -1;
    for (var j = 0; j < c.kalan.length; j++) if (sameSet(YEMEK[c.kalan[j]].tarif, p)) { k = j; break; }
    if (k === -1) {
      c.sabir = Math.max(0.1, c.sabir - c.max * 0.15);
      c.hata = true; run.kombo = 0;
      MiniOyun.ses('kaybet');
      say('🙅 "Bu değil!" ' + TIP[c.tip].ikon + ' sabrı azaldı. Siparişi balondan kontrol et.');
      render();
      return;
    }
    var y = YEMEK[c.kalan.splice(k, 1)[0]], tip = TIP[c.tip], oran = Math.max(0, c.sabir / c.max);
    run.tabak[run.aktif] = [];
    run.kombo++;
    run.enKombo = Math.max(run.enKombo, run.kombo);
    var kazanc = Math.round((y.fiyat + y.fiyat * oran * 0.5 * tip.bahsis * (1 + 0.1 * lvl('kasa'))) * komboCarpan(run.kombo));
    run.kazanc += kazanc;
    MiniOyun.ses('puan');
    say('💰 +' + kazanc + ' ' + y.ad + (run.kombo >= 2 ? ' · kombo x' + komboCarpan(run.kombo) : ''));
    if (y === YEMEK.durum) progressMission('durum15', 1);
    if (y.icecek) progressMission('icecek12', 1);
    progressMission('kombo5', run.kombo, true);
    if (run.egitim === 3) run.egitim = 4;
    if (!c.kalan.length) {
      run.musteri[i] = null;
      run.mutlu++;
      progressMission('musteri25', 1);
      if (c.tip === 'elestirmen' && !c.hata && oran > 0.4) { run.elestirmenMutlu++; say('⭐ Eleştirmen çok memnun kaldı! Gün sonunda ek yıldız.'); }
    }
    render();
  }
  function clearPlate() { if (run.tabak[run.aktif].length) { run.tabak[run.aktif] = []; MiniOyun.ses('tik'); render(); } }
  function switchPlate(i) { run.aktif = typeof i === 'number' ? i : (run.aktif + 1) % run.tabak.length; render(); }

  // ---------- Gün sonu ----------
  function yildizHesap() {
    var y = 1;
    if (run.kazanc >= run.hedef[0]) y = 2;
    if (run.kazanc >= run.hedef[1] && run.kacan <= 1) y = 3;
    return Math.min(3, y + (run.elestirmenMutlu ? 1 : 0));
  }
  function finish(won) {
    run.bitti = true;
    render();
    var kz = run.kazanc;
    if (run.mod === 'gunluk') {
      if (!won) { MiniOyun.bitti({ baslik: 'Kalpler bitti!', metin: 'Günlük vardiyada 3 müşteri kızgın gitti. Tekrar dene; kazancın ancak vardiyayı bitirince sayılır.', kaybetti: true }); return; }
      var recG = MiniOyun.setBest('lokanta-telasi-gunluk', kz);
      MiniOyun.setBest('lokanta-telasi', kz);
      MiniOyun.ses('kazan');
      MiniOyun.bitti({
        baslik: 'Günlük vardiya bitti!', metin: run.mutlu + ' müşteri mutlu gitti, en uzun kombo ' + run.enKombo + '. Kazanç: ' + kz + ' 💰.',
        rekor: recG, skor: kz, sonuc: kz + ' 💰', seviye: 'günlük', paylas: 'Lokanta Telaşı günlük vardiyasında ' + kz + ' 💰 kazandım!'
      });
      return;
    }
    save.para += kz;
    progressMission('para400', kz);
    if (run.mod === 'serbest') {
      var eski = save.serbestRekor;
      save.serbestRekor = Math.max(eski, kz);
      store();
      var recS = MiniOyun.setBest('lokanta-telasi-serbest', kz);
      MiniOyun.setBest('lokanta-telasi', kz);
      MiniOyun.ses(kz > eski ? 'kazan' : 'kaybet');
      MiniOyun.bitti({
        baslik: 'Vardiya bitti!', metin: run.mutlu + ' müşteri mutlu gitti. Kazanç: ' + kz + ' 💰 (kasana eklendi). Serbest vardiya rekoru: ' + save.serbestRekor + ' 💰.',
        rekor: recS, skor: kz, sonuc: kz + ' 💰', seviye: 'serbest', paylas: 'Lokanta Telaşı serbest vardiyasında ' + kz + ' 💰 kazandım!'
      });
      showMap();
      return;
    }
    var n = run.ay.no;
    if (!won) {
      store();
      MiniOyun.ses('kaybet');
      MiniOyun.bitti({
        baslik: 'Kalpler bitti!', metin: 'Gün ' + n + ' kaybedildi; 3 müşteri kızgın gitti. Kazandığın ' + kz + ' 💰 yine de kasana eklendi. Önce sabrı en az kalan müşteriye bak, eti siparişten önce ızgaraya koy.',
        kaybetti: true
      });
      showMap();
      return;
    }
    var before = totalStars(), y = yildizHesap(), g = save.gunler[n] || (save.gunler[n] = { yildiz: 0, enIyiKazanc: 0 });
    g.yildiz = Math.max(stars(n), y);
    g.enIyiKazanc = Math.max(Number(g.enIyiKazanc) || 0, kz);
    if (!run.yanik) progressMission('yaniksiz', 1);
    if (y === 3) progressMission('yildiz3', 1);
    store();
    var acilan = unlocks(before, totalStars(), n);
    var rec = MiniOyun.setBest('lokanta-telasi', kz);
    MiniOyun.ses('kazan');
    MiniOyun.bitti({
      baslik: 'Gün ' + n + ' bitti! ' + '★★★'.slice(0, y) + '☆☆☆'.slice(y),
      metin: kz + ' 💰 kazandın (hedefler ' + run.hedef[0] + ' / ' + run.hedef[1] + '), ' + run.mutlu + ' mutlu müşteri, ' + run.kacan + ' kaçan, en uzun kombo ' + run.enKombo + '.' +
        (run.elestirmenMutlu ? ' Eleştirmen memnun: +1 yıldız.' : '') + (acilan.length ? ' Açıldı: ' + acilan.join(', ') + '.' : '') +
        (y < 2 ? ' 2 yıldız için ' + run.hedef[0] + ' 💰 kazan.' : y < 3 ? ' 3 yıldız için ' + run.hedef[1] + ' 💰 kazan ve en fazla 1 müşteri kaçır.' : ''),
      rekor: rec, skor: kz, sonuc: kz + ' 💰', seviye: 'gün ' + n,
      paylas: 'Lokanta Telaşı ' + n + '. günü ' + y + ' yıldızla ' + kz + ' 💰 kazanarak bitirdim!'
    });
    showMap();
  }
  function unlocks(before, after, n) {
    var list = [];
    for (var w = 1; w < SEMT.length; w++) if (n === w * 10 && semtOpen(w) && !(before >= SEMT[w].esik && stars(n) && before === after)) list.push(SEMT[w].ikon + ' ' + SEMT[w].ad);
    ORTU.forEach(function (o) { if (o.yildiz && before < o.yildiz && after >= o.yildiz) list.push(o.ad); });
    Object.keys(YEMEK).forEach(function (k) { if (YEMEK[k].gun === n + 1 && YEMEK[k].gun > 1) list.push(YEMEK[k].ikon + ' ' + YEMEK[k].ad); });
    return list;
  }

  // ---------- Çizim ----------
  function say(t) { if (el.mesaj) el.mesaj.textContent = t; }
  function setText(e, t) { t = String(t); if (e.textContent !== t) e.textContent = t; }
  function build() {
    var ay = run.ay, h = '';
    h += '<div class="lt-ust">' +
      '<div class="stat"><small>' + (run.mod === 'gunluk' ? 'Günlük' : run.mod === 'serbest' ? 'Serbest' : 'Gün') + '</small><span data-x="gun">-</span></div>' +
      '<div class="stat"><small>Kazanç</small><span data-x="kazanc">0</span></div>' +
      '<div class="stat"><small>Hedef</small><span data-x="hedef">-</span></div>' +
      '<div class="stat"><small>Kalp</small><span data-x="kalp">-</span></div>' +
      '<div class="stat"><small>Kombo</small><span data-x="kombo">-</span></div>' +
      (daily ? '' : '<button class="btn btn-ghost" type="button" data-harita="1">🗺️ Harita</button>') + '</div>';
    h += '<div class="lt-tabela" style="--semt:' + SEMT[ay.semt].renk + '"><span translate="no" data-x="tabela"></span><small data-x="musteri"></small></div>';
    h += '<div class="lt-tezgah" style="grid-template-columns:repeat(' + run.musteri.length + ',1fr)">';
    run.musteri.forEach(function (_, i) {
      h += '<button class="lt-mus" type="button" data-musteri="' + i + '" aria-label="Müşteri ' + (i + 1) + ' (' + 'ASDF'[i] + ')"><span class="lt-balon"></span><span class="lt-kisi"></span><span class="lt-sabir"><i></i></span><small class="lt-tus">' + 'ASDF'[i] + '</small></button>';
    });
    h += '</div><div class="lt-orta"><div class="lt-izgara">';
    run.izgara.forEach(function (_, i) {
      h += '<button class="lt-izg" type="button" data-izgara="' + i + '" aria-label="Izgara ' + (i + 1) + ' (' + 'QWER'[i] + ')"><span></span><small class="lt-tus">' + 'QWER'[i] + '</small></button>';
    });
    h += '</div><div class="lt-tabaklar">';
    run.tabak.forEach(function (_, i) { h += '<button class="lt-tabak" type="button" data-tabak="' + i + '" aria-label="Tabak ' + (i + 1) + '"></button>'; });
    h += '<button class="lt-cop" type="button" data-cop="1" aria-label="Tabağı boşalt (X)">🗑️</button></div></div>';
    h += '<p class="lt-mesaj" aria-live="polite"></p><div class="lt-raf">';
    var gerek = {}, no = 0;
    ay.menu.forEach(function (k) { YEMEK[k].tarif.forEach(function (m) { gerek[m] = true; }); });
    Object.keys(MALZ).forEach(function (m) {
      if (!gerek[m]) return;
      no++;
      h += '<button class="lt-malz" type="button" data-m="' + m + '" aria-label="' + MALZ[m].ad + '"><span>' + MALZ[m].ikon + '</span><small>' + MALZ[m].ad + '</small>' + (no <= 9 ? '<b class="lt-tus">' + no + '</b>' : '') + '</button>';
    });
    h += '</div>';
    gameEl.innerHTML = h;
    el = { mesaj: gameEl.querySelector('.lt-mesaj'), x: {}, raf: {}, mus: [], izg: [], tab: [] };
    gameEl.querySelectorAll('[data-x]').forEach(function (e) { el.x[e.dataset.x] = e; });
    gameEl.querySelectorAll('[data-m]').forEach(function (e) { el.raf[e.dataset.m] = e; });
    el.rafSira = Array.prototype.map.call(gameEl.querySelectorAll('[data-m]'), function (e) { return e.dataset.m; });
    el.mus = gameEl.querySelectorAll('[data-musteri]');
    el.izg = gameEl.querySelectorAll('[data-izgara]');
    el.tab = gameEl.querySelectorAll('[data-tabak]');
    gameEl.querySelector('.lt-tezgah').style.background = (ORTU.filter(function (o) { return o.id === save.susleme.secili && ortuOpen(o); })[0] || ORTU[0]).css;
    setText(el.x.tabela, SEMT[ay.semt].ikon + ' ' + (save.tabela || SEMT[ay.semt].ad));
    gameEl.dataset.sira = run.sira.map(function (c) { return c.tip + ':' + c.siparis.join('+'); }).join(',');
  }
  function render() {
    if (!run || !el.x) return;
    var gelen = run.sonraki, kalan = run.sira.length - gelen;
    setText(el.x.gun, run.mod === 'kampanya' ? run.ay.no : run.mod === 'gunluk' ? '📅' : '♾️');
    setText(el.x.kazanc, run.kazanc);
    setText(el.x.hedef, run.mod === 'serbest' ? 'Rekor ' + save.serbestRekor : run.hedef[0] + '/' + run.hedef[1]);
    setText(el.x.kalp, '❤️'.repeat(Math.max(0, run.kalp)) + '🖤'.repeat(KALP - Math.max(0, run.kalp)));
    setText(el.x.kombo, run.kombo >= 2 ? run.kombo + ' (x' + komboCarpan(run.kombo) + ')' : run.kombo);
    setText(el.x.musteri, run.mod === 'serbest' ? run.mutlu + ' mutlu müşteri' : 'Sırada ' + kalan + ' müşteri');
    run.musteri.forEach(function (c, i) {
      var b = el.mus[i], oran = c ? Math.max(0, c.sabir / c.max) : 0;
      b.dataset.kalan = c ? c.kalan.join(',') : '';
      b.dataset.sabir = c ? oran.toFixed(2) : '';
      setText(b.children[0], c ? c.kalan.map(function (k) { return YEMEK[k].ikon; }).join(' ') : '');
      setText(b.children[1], c ? TIP[c.tip].ikon : '');
      b.classList.toggle('bos', !c);
      var bar = b.children[2].firstChild;
      bar.style.width = Math.round(oran * 100) + '%';
      bar.style.background = oran > 0.5 ? '#22c55e' : oran > 0.25 ? '#facc15' : '#ef4444';
    });
    run.izgara.forEach(function (g, i) {
      var b = el.izg[i];
      b.dataset.hal = g ? g.hal : 'bos';
      b.dataset.m = '';
      b.dataset.urun = g ? g.m : '';
      var pis = pismeSuresi();
      b.style.setProperty('--p', g ? Math.min(100, Math.round((g.hal === 'cig' ? g.t / pis : g.hal === 'pismis' ? (g.t - pis) / YANMA : 1) * 100)) + '%' : '0%');
      setText(b.children[0], g ? (g.hal === 'yanik' ? '💨' : '') + MALZ[g.m].ikon : '');
    });
    run.tabak.forEach(function (p, i) {
      var b = el.tab[i];
      b.dataset.icerik = p.join(',');
      b.classList.toggle('aktif', i === run.aktif);
      setText(b, p.length ? p.map(function (m) { return MALZ[m].ikon; }).join('') : '🍽️');
    });
    Object.keys(run.ocak).forEach(function (m) {
      var b = el.raf[m];
      if (!b) return;
      var o = run.ocak[m];
      b.dataset.hal = o.hal;
      setText(b.firstChild, o.hal === 'haz' ? '⏳' : o.hal === 'hazir' ? '✅' + MALZ[m].ikon : MALZ[m].ikon);
    });
    if (run.egitim >= 0 && !run.bitti) say(IPUCU[run.egitim]);
    gameEl.dataset.durum = run.bitti ? 'bitti' : 'oyun';
    gameEl.dataset.kazanc = run.kazanc;
    gameEl.dataset.kalp = run.kalp;
    gameEl.dataset.kombo = run.kombo;
    gameEl.dataset.t = run.t.toFixed(1);
  }

  // ---------- Harita ----------
  function showMap() {
    mapEl.hidden = false;
    if (!daily) gameEl.hidden = true;
    missionsReady();
    var tot = totalStars(), h = '';
    if (daily) {
      h += '<h2>📅 Günlük vardiya · ' + esc(MiniOyun.gunluk.tarih) + '</h2><p>Herkese aynı müşteri sırası, tüm menü ve yükseltmesiz temel lokanta. 20 müşteriyi 3 kalp bitmeden ağırla.</p>' +
        '<button class="btn" type="button" data-gunluk="1">Vardiyayı başlat ▶</button><p>En iyi kazancın: ' + (MiniOyun.getBest('lokanta-telasi-gunluk') || '-') + ' 💰</p>';
      mapEl.innerHTML = h;
      return;
    }
    h += '<h2 class="lt-ad" translate="no"></h2>';
    h += '<div class="lt-ozet"><span>⭐ ' + tot + '/120</span><span>💰 ' + save.para + '</span><span>🔥 Seri ' + save.seri + '</span></div>';
    h += '<label class="lt-isim">Lokantanın adı: <input id="lt-tabela" type="text" maxlength="16" autocomplete="off" placeholder="Adını yaz"></label>';
    SEMT.forEach(function (s, w) {
      var acik = semtOpen(w);
      h += '<h3>' + s.ikon + ' ' + s.ad + ' <small>' + (acik ? 'Gün ' + (w * 10 + 1) + '-' + (w * 10 + 10) : '🔒 ' + s.esik + ' ⭐ ve ' + (w * 10) + '. gün') + '</small></h3><div class="lt-gunler">';
      for (var n = w * 10 + 1; n <= w * 10 + 10; n++) {
        var o = dayOpen(n), y = stars(n);
        h += '<button class="lt-gun' + (o ? '' : ' kilitli') + '" type="button" data-gun="' + n + '" style="--semt:' + s.renk + '"' + (o ? '' : ' disabled aria-disabled="true"') + '><b>' + n + '</b><span>' + (o ? '★★★'.slice(0, y) + '☆☆☆'.slice(y) : '🔒') + '</span></button>';
      }
      h += '</div>';
    });
    var serbestAcik = stars(5) > 0;
    h += '<h3>♾️ Serbest vardiya</h3><p>' + (serbestAcik ? 'Açtığın menüyle müşteriler durmadan gelir; 3 kalp bitene kadar kazan. Rekor: ' + save.serbestRekor + ' 💰' : '5. günü bitirince açılır.') + '</p>' +
      '<button class="btn btn-ghost" type="button" data-serbest="1"' + (serbestAcik ? '' : ' disabled') + '>Serbest vardiya ▶</button>';
    h += '<h3>🛠️ Yükseltmeler</h3><div class="lt-yukler">';
    YUK.forEach(function (u) {
      var l = save.yukseltme[u.id], max = l >= u.bedel.length, bedel = u.bedel[l];
      h += '<button class="lt-yuk" type="button" data-yuk="' + u.id + '"' + (max || save.para < bedel ? ' disabled' : '') + '><span class="lt-y-ikon">' + u.ikon + '</span><span>' + u.ad + ' ' +
        '●'.repeat(l) + '○'.repeat(u.bedel.length - l) + '<small>' + u.bilgi + '</small></span><span class="lt-bedel">' + (max ? 'Tam' : bedel + ' 💰') + '</span></button>';
    });
    h += '</div><h3>🎨 Tezgâh örtüsü</h3><div class="lt-ortuler">';
    ORTU.forEach(function (o) {
      var a = ortuOpen(o);
      h += '<button class="lt-ortu' + (save.susleme.secili === o.id ? ' secili' : '') + '" type="button" data-ortu="' + o.id + '"' + (a ? '' : ' disabled') + '><i style="background:' + o.css + '"></i>' + o.ad +
        (a ? '' : ' <small>' + (o.yildiz ? o.yildiz + ' ⭐' : o.seri + ' günlük seri') + '</small>') + '</button>';
    });
    h += '</div><h3>📋 Günlük görevler <small>(üçü bitince +' + GOREV_ODUL + ' 💰)</small></h3><ul class="lt-gorevler">';
    save.gorev.liste.forEach(function (id) {
      var m = mission(id), t = save.gorev.tamam.indexOf(id) !== -1;
      h += '<li class="lt-gorev' + (t ? ' tamam' : '') + '">' + (t ? '✅ ' : '▫️ ') + m.ad + ' <small>' + Math.min(m.hedef, save.gorev.ilerleme[id] || 0) + '/' + m.hedef + '</small></li>';
    });
    h += '</ul>';
    mapEl.innerHTML = h;
    setText(mapEl.querySelector('.lt-ad'), '🍽️ ' + (save.tabela || 'Lokantam'));
    mapEl.querySelector('#lt-tabela').value = save.tabela;
  }

  mapEl.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled || MiniOyun.duraklatildi()) return;
    if (b.dataset.gun) { if (dayOpen(+b.dataset.gun)) startDay(+b.dataset.gun); }
    else if (b.dataset.gunluk) startDaily();
    else if (b.dataset.serbest) startFree();
    else if (b.dataset.yuk) {
      var u = YUK.filter(function (x) { return x.id === b.dataset.yuk; })[0], l = save.yukseltme[u.id];
      if (l < u.bedel.length && save.para >= u.bedel[l]) { save.para -= u.bedel[l]; save.yukseltme[u.id] = l + 1; store(); MiniOyun.ses('puan'); showMap(); }
    } else if (b.dataset.ortu) { save.susleme.secili = b.dataset.ortu; store(); MiniOyun.ses('tik'); showMap(); }
  });
  mapEl.addEventListener('input', function (e) {
    if (e.target.id !== 'lt-tabela') return;
    save.tabela = e.target.value.replace(/[\u0000-\u001f]/g, '').slice(0, 16);
    store();
    setText(mapEl.querySelector('.lt-ad'), '🍽️ ' + (save.tabela || 'Lokantam'));
  });
  gameEl.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || !run || run.bitti || MiniOyun.duraklatildi()) return;
    if (b.dataset.harita) { run = null; showMap(); return; }
    if (b.dataset.m) pressIngredient(b.dataset.m);
    else if (b.dataset.izgara) pressGrill(+b.dataset.izgara);
    else if (b.dataset.musteri) serve(+b.dataset.musteri);
    else if (b.dataset.tabak) switchPlate(+b.dataset.tabak);
    else if (b.dataset.cop) clearPlate();
  });
  // Tabağa uzun basınca boşalır
  var uzun = null;
  gameEl.addEventListener('pointerdown', function (e) {
    var b = e.target.closest('[data-tabak]');
    if (!b) return;
    clearTimeout(uzun);
    uzun = setTimeout(function () { if (run && !run.bitti && !MiniOyun.duraklatildi()) { switchPlate(+b.dataset.tabak); clearPlate(); } }, 600);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { gameEl.addEventListener(t, function () { clearTimeout(uzun); }); });
  document.addEventListener('keydown', function (e) {
    if (!run || run.bitti || gameEl.hidden || MiniOyun.duraklatildi() || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    var k = e.key.toLowerCase(), i;
    if (/^[1-9]$/.test(k)) { if (el.rafSira[+k - 1]) pressIngredient(el.rafSira[+k - 1]); }
    else if ((i = 'qwer'.indexOf(k)) !== -1 && k) { if (i < run.izgara.length) pressGrill(i); }
    else if ((i = 'asdf'.indexOf(k)) !== -1 && k) { if (i < run.musteri.length) serve(i); }
    else if (k === 'tab') switchPlate();
    else if (k === 'x') clearPlate();
    else return;
    e.preventDefault();
  });

  setInterval(tick, TICK * 1000);
  function restart() {
    if (daily || mod === 'gunluk') startDaily();
    else if (mod === 'serbest') startFree();
    else startDay(gunNo);
  }
  MiniOyun.oyun({
    restart: restart,
    pause: function () { paused = true; },
    resume: function () { paused = false; },
    canPause: function () { return !!run && !run.bitti && !gameEl.hidden; },
    seviye: function () { return daily || mod === 'gunluk' ? 'günlük' : mod === 'serbest' ? 'serbest' : 'gün ' + gunNo; }
  });

  showMap();
})();

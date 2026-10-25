(function () {
  // Lokanta Telaşı: müşterilerin siparişlerini sabırları bitmeden hazırlayıp servis ettiğin sipariş yetiştirme oyunu.
  // 40 günlük kariyer (4 semt × 10 gün, gün başına 1-3 yıldız, yıldızla açılan semtler), para ile 7 kalıcı yükseltme,
  // yıldız ve görev serisiyle açılan süslemeler, tabela adı, günlük görevler ve sonsuz serbest vardiya.
  // Günlük modda (?gunluk=) herkes aynı müşteri sırasıyla, yükseltmesiz temel lokantada oynar. Kayıt: mo_lokanta.
  var SAVE_KEY = 'mo_lokanta';
  var GUN_SAYISI = 40;

  // Raftaki malzemeler. izgara: ızgarada pişer; kazan: kâseye dolar; ocak: demlenir
  var MALZEMELER = {
    lavas: { ikon: '🫓', ad: 'Lavaş' },
    et: { ikon: '🥩', ad: 'Et', izgara: true },
    sis: { ikon: '🍢', ad: 'Şiş', izgara: true },
    domates: { ikon: '🍅', ad: 'Domates' },
    sogan: { ikon: '🧅', ad: 'Soğan' },
    biber: { ikon: '🌶️', ad: 'Biber' },
    corba: { ikon: '🍲', ad: 'Çorba', kazan: true },
    limon: { ikon: '🍋', ad: 'Limon' },
    salatalik: { ikon: '🥒', ad: 'Salatalık' },
    ayran: { ikon: '🥛', ad: 'Ayran' },
    cay: { ikon: '🍵', ad: 'Çay', ocak: true },
    sutlac: { ikon: '🍮', ad: 'Sütlaç' },
    tarcin: { ikon: '🟤', ad: 'Tarçın' }
  };
  // Yemekler: tarif (sırasız, eksiksiz), fiyat ve sipariş ağırlığı
  var YEMEKLER = {
    durum: { ikon: '🥙', ad: 'Dürüm', tarif: ['lavas', 'et', 'domates', 'sogan'], fiyat: 12, agirlik: 4 },
    sis: { ikon: '🍢', ad: 'Şiş', tarif: ['sis'], fiyat: 9, agirlik: 3 },
    acili: { ikon: '🍢', ad: 'Acılı şiş', tarif: ['sis', 'biber'], fiyat: 10, agirlik: 2, ek: '🌶️' },
    corba: { ikon: '🍲', ad: 'Mercimek çorbası', tarif: ['corba', 'limon'], fiyat: 8, agirlik: 3 },
    salata: { ikon: '🥗', ad: 'Çoban salatası', tarif: ['domates', 'salatalik', 'sogan'], fiyat: 7, agirlik: 2 },
    ayran: { ikon: '🥛', ad: 'Ayran', tarif: ['ayran'], fiyat: 3, agirlik: 3 },
    cay: { ikon: '🍵', ad: 'Çay', tarif: ['cay'], fiyat: 2, agirlik: 2 },
    sutlac: { ikon: '🍮', ad: 'Sütlaç', tarif: ['sutlac', 'tarcin'], fiyat: 6, agirlik: 2 }
  };
  var RAF_SIRA = ['lavas', 'et', 'sis', 'domates', 'sogan', 'biber', 'corba', 'limon', 'salatalik', 'ayran', 'cay', 'sutlac', 'tarcin'];
  var RAF_TUS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'z', 'c', 'v'];
  // sabir: saniye, bahsis: bahşiş çarpanı
  var TIPLER = {
    normal: { ikon: '🧑', ad: 'Müşteri', sabir: 24, bahsis: 1 },
    yasli: { ikon: '👵', ad: 'Teyze', sabir: 32, bahsis: 0.6 },
    aceleci: { ikon: '🧑‍💼', ad: 'Aceleci', sabir: 15, bahsis: 1.8 },
    cocuk: { ikon: '🧒', ad: 'Çocuk', sabir: 34, bahsis: 1 },
    elestirmen: { ikon: '🧑‍🍳', ad: 'Eleştirmen', sabir: 17, bahsis: 1.5 }
  };
  var SEMTLER = [
    { ad: 'Mahalle Büfesi', ikon: '🏪', renk: '#fcd34d', kilit: 0 },
    { ad: 'Sahil Lokantası', ikon: '🌉', renk: '#7dd3fc', kilit: 18 },
    { ad: 'Çarşı Lokantası', ikon: '🏛️', renk: '#fca5a5', kilit: 42 },
    { ad: 'Meydan Restoranı', ikon: '🌃', renk: '#a78bfa', kilit: 70 }
  ];
  // bedel[k]: k. seviyeden k+1'e çıkma bedeli
  var YUKSELTMELER = [
    { id: 'izgara', ikon: '🔥', ad: 'Izgara', bedel: [45, 120, 270, 525, 900], etki: function (l) { return izgaraYer(l) + ' yer, ' + pismeSure(l).toFixed(1) + ' sn pişme'; } },
    { id: 'tezgah', ikon: '🪑', ad: 'Tezgâh', bedel: [340, 675, 1125], etki: function (l) { return tezgahYer(l) + ' müşteri yeri' + (l > 1 ? ', fiyat +%' + (l - 1) * 5 : ''); } },
    { id: 'tabak', ikon: '🍽️', ad: 'İkinci tabak', bedel: [225, 490, 825], etki: function (l) { return tabakSayi(l) + ' tabak, yanlış servis cezası %' + Math.round(yanlisCeza(l) * 100); } },
    { id: 'cay', ikon: '🫖', ad: 'Çay ocağı', bedel: [60, 165, 360], etki: function (l) { return (4 - l) + ' sn demleme'; } },
    { id: 'dekor', ikon: '🪴', ad: 'Dekor', bedel: [75, 195, 390, 675, 1090], etki: function (l) { return 'sabır +%' + l * 8; } },
    { id: 'zil', ikon: '🛎️', ad: 'Garson zili', bedel: [110, 300, 600], etki: function (l) { return l ? 'kırmızıda bir kez +' + (2 + l) + ' sn' : 'yok'; } },
    { id: 'kasa', ikon: '💰', ad: 'Kasa', bedel: [90, 240, 465, 750, 1160], etki: function (l) { return 'bahşiş +%' + l * 10; } }
  ];
  var SUSLEMELER = [
    { id: 'klasik', ad: 'Klasik', ikon: '🟫', kosul: 'Başlangıç', yildiz: 0 },
    { id: 'nane', ad: 'Nane yeşili', ikon: '🟩', kosul: '10 ⭐', yildiz: 10 },
    { id: 'deniz', ad: 'Deniz mavisi', ikon: '🟦', kosul: '30 ⭐', yildiz: 30 },
    { id: 'bordo', ad: 'Bordo kareli', ikon: '🟥', kosul: '60 ⭐', yildiz: 60 },
    { id: 'altin', ad: 'Altın varak', ikon: '🟨', kosul: '100 ⭐', yildiz: 100 },
    { id: 'cadi', ad: 'Cadılar Bayramı', ikon: '🎃', kosul: '7 günlük görev serisi', seri: 7 }
  ];
  var GOREVLER = [
    { id: 'servis', ad: function (h) { return h + ' yemek servis et'; }, hedef: 15 },
    { id: 'durum', ad: function (h) { return h + ' dürüm servis et'; }, hedef: 8 },
    { id: 'kombo', ad: function (h) { return h + '\'li kombo yap'; }, hedef: 5, enAz: true },
    { id: 'yaniksiz', ad: function () { return 'Hiç yanık yapmadan bir gün bitir'; }, hedef: 1 },
    { id: 'yildiz3', ad: function () { return 'Bir günü 3 yıldızla bitir'; }, hedef: 1 },
    { id: 'bahsis', ad: function (h) { return 'Toplam ' + h + ' bahşiş topla'; }, hedef: 60 },
    { id: 'gun', ad: function (h) { return h + ' gün tamamla'; }, hedef: 3 }
  ];
  var IPUCLARI = [
    'Dürüm için rafta 🫓 lavaşa, 🍅 domatese ve 🧅 soğana dokun; malzemeler tabağa eklenir.',
    'Şimdi 🥩 ete dokun: et ızgaraya gider ve pişmeye başlar.',
    'Et kahverengiye dönüp yeşil halka çıkınca ızgaradaki ete dokun, tabağa geçsin. Bekletirsen yanar!',
    'Tabak hazır: müşteriye dokunarak servis et. Eksik ya da fazla malzeme olursa müşteri kabul etmez.',
    'Sabır çubuğunu izle: biterse müşteri kızgın gider ve bir ❤️ kaybedersin. Yanık eti ızgarada dokunarak çöpe at.'
  ];

  var alan = document.getElementById('alan');
  var panel = document.getElementById('panel');
  var ekran = document.getElementById('oyun-ekrani');
  var tezgahEl = document.getElementById('tezgah');
  var izgaraEl = document.getElementById('izgara');
  var istasyonEl = document.getElementById('istasyon');
  var tabakEl = document.getElementById('tabaklar');
  var rafEl = document.getElementById('raf');
  var bilgiEl = document.getElementById('bilgi');
  var ipucuEl = document.getElementById('ipucu');
  var paraEl = document.getElementById('para');
  var yildizEl = document.getElementById('yildiz');
  var rekorEl = document.getElementById('rekor');
  var gunEl = document.getElementById('gun');

  var daily = !!(MiniOyun.gunluk && MiniOyun.gunluk.tarih);
  var save = load();
  var tab = 'harita', note = '';
  var run = null, state = 'menu', paused = false, last = 0;

  // ---------- Kayıt ----------
  function load() {
    var p = null;
    try { p = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) {}
    if (!p || typeof p !== 'object' || Array.isArray(p)) p = {};
    if (!p.gunler || typeof p.gunler !== 'object' || Array.isArray(p.gunler)) p.gunler = {};
    p.para = Math.max(0, Math.floor(Number(p.para) || 0));
    if (!p.yukseltme || typeof p.yukseltme !== 'object') p.yukseltme = {};
    if (!p.susleme || typeof p.susleme !== 'object') p.susleme = {};
    if (!Array.isArray(p.susleme.acik)) p.susleme.acik = ['klasik'];
    if (p.susleme.acik.indexOf('klasik') === -1) p.susleme.acik.unshift('klasik');
    if (p.susleme.acik.indexOf(p.susleme.secili) === -1) p.susleme.secili = 'klasik';
    p.tabela = typeof p.tabela === 'string' ? p.tabela.slice(0, 16) : '';
    if (!p.gorev || typeof p.gorev !== 'object') p.gorev = {};
    p.seri = Math.max(0, Math.floor(Number(p.seri) || 0));
    p.sonGun = typeof p.sonGun === 'string' ? p.sonGun : '';
    p.serbestRekor = Math.max(0, Number(p.serbestRekor) || 0);
    p.itibar = Math.max(0, Math.floor(Number(p.itibar) || 0));
    return p;
  }
  function store() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
  }
  function gunKaydi(d) { var g = save.gunler[d]; return g && typeof g === 'object' ? g : null; }
  function gunYildiz(d) { var g = gunKaydi(d); return g ? Math.max(0, Math.min(3, Math.floor(Number(g.yildiz) || 0))) : 0; }
  function toplamYildiz() { var n = save.itibar; for (var d = 1; d <= GUN_SAYISI; d++) n += gunYildiz(d); return n; }
  function semtAcik(s) { return toplamYildiz() >= SEMTLER[s].kilit; }
  function gunAcik(d) {
    if (d === 1) return true;
    return gunYildiz(d - 1) > 0 && semtAcik(Math.floor((d - 1) / 10));
  }
  function enUstGun() { var n = 1; for (var d = 1; d <= GUN_SAYISI; d++) if (gunAcik(d)) n = d; return n; }
  function lvl(id) {
    if (run && run.mod === 'gunluk') return 0;
    var u = upgrade(id);
    return Math.max(0, Math.min(u.bedel.length, Math.floor(Number(save.yukseltme[id]) || 0)));
  }
  function upgrade(id) { for (var i = 0; i < YUKSELTMELER.length; i++) if (YUKSELTMELER[i].id === id) return YUKSELTMELER[i]; }
  function izgaraYer(l) { return 2 + (l >= 2 ? 1 : 0) + (l >= 4 ? 1 : 0); }
  function pismeSure(l) { return 5 * (1 - 0.08 * l); }
  function tezgahYer(l) { return l >= 1 ? 4 : 3; }
  function tabakSayi(l) { return l >= 1 ? 2 : 1; }
  function yanlisCeza(l) { return 0.15 - 0.05 * Math.max(0, l - 1); }

  // ---------- Günlük görevler ----------
  function bugun() { return MiniOyun.gunluk.bugun(); }
  function gorevHazirla() {
    var g = save.gorev, today = bugun();
    if (g.gun === today && Array.isArray(g.liste) && g.liste.length === 3 && g.ilerleme && typeof g.ilerleme === 'object') return;
    var rnd = MiniOyun.gunluk.rastgele(today + '/lokanta-gorev');
    var havuz = GOREVLER.slice(), liste = [];
    while (liste.length < 3) liste.push(havuz.splice(Math.floor(rnd() * havuz.length), 1)[0].id);
    save.gorev = { gun: today, liste: liste, ilerleme: {}, odul: false };
    liste.forEach(function (id) { save.gorev.ilerleme[id] = 0; });
    store();
  }
  function gorevTanim(id) { for (var i = 0; i < GOREVLER.length; i++) if (GOREVLER[i].id === id) return GOREVLER[i]; }
  function gorevOdul() { return 40 + 30 * Math.floor((enUstGun() - 1) / 10); }
  function gorevIlerle(id, n) {
    if (!run || run.mod === 'gunluk') return;
    var g = save.gorev, m = gorevTanim(id);
    if (!g.ilerleme || g.liste.indexOf(id) === -1) return;
    var v = Number(g.ilerleme[id]) || 0;
    g.ilerleme[id] = Math.min(m.hedef, m.enAz ? Math.max(v, n) : v + n);
    if (!g.odul && g.liste.every(function (k) { return (Number(g.ilerleme[k]) || 0) >= gorevTanim(k).hedef; })) {
      g.odul = true;
      save.para += gorevOdul();
      var dun = new Date(Date.parse(g.gun + 'T12:00:00') - 864e5).toISOString().slice(0, 10);
      save.seri = save.sonGun === dun ? save.seri + 1 : (save.sonGun === g.gun ? save.seri : 1);
      save.sonGun = g.gun;
      note = '✅ Günlük görevler tamam: +' + gorevOdul() + ' 💰 · seri ' + save.seri + ' gün';
      suslemeKontrol();
    }
    store();
  }
  function suslemeKontrol() {
    var y = toplamYildiz();
    SUSLEMELER.forEach(function (s) {
      if (save.susleme.acik.indexOf(s.id) !== -1) return;
      if ((s.seri && save.seri >= s.seri) || (!s.seri && y >= s.yildiz)) {
        save.susleme.acik.push(s.id);
        note = (note ? note + ' · ' : '') + '🎁 Yeni süsleme: ' + s.ad;
      }
    });
  }

  // ---------- Gün üretimi ----------
  function menuGun(d) {
    var m = ['durum', 'ayran'];
    if (d >= 3) m.push('sis');
    if (d >= 6) m.push('acili');
    if (d >= 11) m.push('corba', 'cay');
    if (d >= 21) m.push('salata', 'sutlac');
    return m;
  }
  function gunTanimi(d) {
    var s = Math.floor((d - 1) / 10), k = (d - 1) / (GUN_SAYISI - 1);
    return uret({
      gun: d, semt: s, menu: menuGun(d), n: Math.round(8 + 22 * k), sure: Math.round(90 + 60 * k),
      maxKalem: d <= 4 ? 1 : (d <= 20 ? 2 : 3), sabir: 1 - 0.3 * k, aceleci: 0.08 + 0.05 * s,
      elestirmen: d >= 8 ? (s >= 2 ? 0.14 : 0.07) : 0, yagmur: s >= 1 && d % 4 === 2, aksam: s >= 3
    }, MiniOyun.gunluk.rastgele('lokanta/gun' + d));
  }
  function gunlukTanim() {
    return uret({
      gun: 0, semt: 2, menu: menuGun(GUN_SAYISI), n: 20, sure: 120, maxKalem: 3, sabir: 0.85, aceleci: 0.15,
      elestirmen: 0.12, yagmur: false, aksam: false
    }, MiniOyun.rastgele());
  }
  function agirlikliSec(liste, w, rnd) {
    var top = 0, i;
    for (i = 0; i < liste.length; i++) top += w(liste[i]);
    var r = rnd() * top;
    for (i = 0; i < liste.length; i++) { r -= w(liste[i]); if (r <= 0) return liste[i]; }
    return liste[liste.length - 1];
  }
  function musteriUret(t, rnd, menu, maxKalem, sabirCarpan, aceleci, elestirmen, yagmur) {
    var r = rnd(), tip = 'normal';
    if (r < elestirmen) tip = 'elestirmen';
    else if (r < elestirmen + aceleci) tip = 'aceleci';
    else if (r < elestirmen + aceleci + 0.12) tip = 'yasli';
    else if (r < elestirmen + aceleci + 0.2) tip = 'cocuk';
    var siparis = [];
    if (tip === 'cocuk') {
      var c = menu.filter(function (y) { return y === 'sutlac' || y === 'ayran'; });
      siparis.push(c[Math.floor(rnd() * c.length)]);
    } else {
      var kalem = 1, q = rnd();
      if (maxKalem >= 2 && q < 0.45) kalem = 2;
      if (maxKalem >= 3 && q < 0.2) kalem = 3;
      if (tip === 'elestirmen') kalem = Math.min(maxKalem, 2);
      for (var i = 0; i < kalem; i++) {
        siparis.push(agirlikliSec(menu, function (y) { return YEMEKLER[y].agirlik * (yagmur && (y === 'corba' || y === 'cay') ? 3 : 1); }, rnd));
      }
    }
    return { t: t, tip: tip, siparis: siparis, sabir: TIPLER[tip].sabir * sabirCarpan * (1 + 0.2 * (siparis.length - 1)) };
  }
  function uret(o, rnd) {
    var liste = [], t = 1, aralik = o.sure * 0.85 / o.n, taban = 0;
    for (var i = 0; i < o.n; i++) {
      var m = musteriUret(t, rnd, o.menu, o.maxKalem, o.sabir, o.aceleci, o.elestirmen, o.yagmur);
      liste.push(m);
      m.siparis.forEach(function (y) { taban += YEMEKLER[y].fiyat; });
      var ak = o.aksam && i >= o.n * 0.7 ? 0.5 : 1;
      t += aralik * ak * (0.6 + rnd() * 0.8);
    }
    if (o.gun === 1) liste[0].siparis = ['durum'];
    o.liste = liste;
    o.taban = taban;
    o.hedef2 = Math.round(taban * 0.95);
    o.hedef3 = Math.round(taban * 1.2);
    return o;
  }

  // ---------- Oyun ----------
  function gunBaslat(mod, d) {
    run = {
      mod: mod, gun: d, zaman: 0, sira: 0, kalp: 3, kazanc: 0, kombo: 0, enKombo: 0, kacan: 0, yanik: 0, servis: 0,
      bahsis: 0, elestirmenMutlu: 0, ipucu: mod === 'kariyer' && d === 1 && !gunKaydi(1) ? 0 : -1, ipucuT: 0, sonraki: 2
    };
    run.tanim = mod === 'kariyer' ? gunTanimi(d) : (mod === 'gunluk' ? gunlukTanim() : null);
    if (mod === 'serbest') { run.rnd = MiniOyun.rastgele(); run.menu = menuGun(enUstGun()); }
    else run.menu = run.tanim.menu;
    run.musteriler = []; for (var i = 0; i < tezgahYer(lvl('tezgah')); i++) run.musteriler.push(null);
    run.izgara = []; for (i = 0; i < izgaraYer(lvl('izgara')); i++) run.izgara.push(null);
    run.tabaklar = []; for (i = 0; i < tabakSayi(lvl('tabak')); i++) run.tabaklar.push([]);
    run.aktif = 0;
    run.kazan = -1;
    run.cay = { durum: 'bos', t: 0 };
    state = 'oyun';
    paused = false;
    note = '';
    alan.dataset.durum = 'oyun';
    alan.dataset.gun = mod === 'kariyer' ? d : mod;
    ekran.hidden = false;
    panel.hidden = true;
    renderOyun();
    hud();
    MiniOyun.ses('tik');
  }
  function malzemeVar(id) {
    return run.menu.some(function (y) { return YEMEKLER[y].tarif.indexOf(id) !== -1; });
  }
  function aktifTabak() { return run.tabaklar[run.aktif]; }
  function ipucuIlerle(adim) {
    if (run.ipucu === adim) { run.ipucu = adim + 1; run.ipucuT = 0; renderIpucu(); }
  }
  function malzemeBas(id) {
    var m = MALZEMELER[id];
    if (!m || !malzemeVar(id)) return;
    if (m.izgara) {
      var bos = run.izgara.indexOf(null);
      if (bos === -1) { kisaMesaj('Izgara dolu!'); return; }
      run.izgara[bos] = { tur: id, t: 0, durum: 'cig' };
      MiniOyun.ses('tik');
      ipucuIlerle(1);
      renderIzgara();
      return;
    }
    if (m.kazan) {
      if (run.kazan >= 0) return;
      run.kazan = 0;
      MiniOyun.ses('tik');
      renderIstasyon();
      return;
    }
    if (m.ocak) {
      if (run.cay.durum === 'bos') { run.cay = { durum: 'demleniyor', t: 0 }; MiniOyun.ses('tik'); renderIstasyon(); return; }
      if (run.cay.durum === 'demleniyor') return;
      if (aktifTabak().length >= 5) { kisaMesaj('Tabak dolu!'); return; }
      run.cay = { durum: 'bos', t: 0 };
      renderIstasyon();
    }
    tabagaEkle(id);
  }
  function tabagaEkle(id) {
    var p = aktifTabak();
    if (p.length >= 5) { kisaMesaj('Tabak dolu!'); return; }
    p.push(id);
    MiniOyun.ses('tik');
    if (id !== 'et') ipucuIlerle(0);
    renderTabaklar();
  }
  function izgaraBas(i) {
    var g = run.izgara[i];
    if (!g) return;
    if (g.durum === 'yanik') {
      run.izgara[i] = null;
      kisaMesaj('🗑️ Yanık çöpe atıldı');
      renderIzgara();
      return;
    }
    if (g.durum !== 'pismis') { kisaMesaj('Daha pişmedi'); return; }
    if (aktifTabak().length >= 5) { kisaMesaj('Tabak dolu!'); return; }
    run.izgara[i] = null;
    ipucuIlerle(2);
    renderIzgara();
    tabagaEkle(g.tur);
  }
  function tabakBosalt() {
    if (!aktifTabak().length) return;
    run.tabaklar[run.aktif] = [];
    MiniOyun.ses('tik');
    renderTabaklar();
  }
  function tabakSec(i) {
    if (i < 0 || i >= run.tabaklar.length) return;
    run.aktif = i;
    renderTabaklar();
  }
  function ayni(tarif, tabak) {
    if (tarif.length !== tabak.length) return false;
    var a = tarif.slice().sort(), b = tabak.slice().sort();
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  function komboCarpan(k) { return k >= 8 ? 2 : (k >= 5 ? 1.5 : (k >= 2 ? 1.2 : 1)); }
  function servisEt(i) {
    var c = run.musteriler[i], p = aktifTabak();
    if (!c || !p.length) return;
    var j = -1;
    for (var k = 0; k < c.siparis.length; k++) if (!c.verildi[k] && ayni(YEMEKLER[c.siparis[k]].tarif, p)) { j = k; break; }
    if (j === -1) {
      c.kalan = Math.max(0, c.kalan - c.max * yanlisCeza(lvl('tabak')));
      c.hata = true;
      run.kombo = 0;
      c.mesaj = 'Bu değil!';
      c.mesajT = 1.2;
      MiniOyun.ses('kaybet');
      renderMusteri(i);
      hud();
      return;
    }
    c.verildi[j] = true;
    run.tabaklar[run.aktif] = [];
    var y = YEMEKLER[c.siparis[j]];
    run.kombo++;
    run.enKombo = Math.max(run.enKombo, run.kombo);
    var bahsis = y.fiyat * (c.kalan / c.max) * 0.5 * TIPLER[c.tip].bahsis * (1 + 0.1 * lvl('kasa'));
    var fiyat = y.fiyat * (1 + 0.05 * Math.max(0, lvl('tezgah') - 1));
    var kazanc = Math.round((fiyat + bahsis) * komboCarpan(run.kombo));
    run.kazanc += kazanc;
    run.bahsis += bahsis;
    run.servis++;
    c.mesaj = '+' + kazanc + ' 💰';
    c.mesajT = 1;
    MiniOyun.ses('puan');
    ipucuIlerle(3);
    gorevIlerle('servis', 1);
    if (c.siparis[j] === 'durum') gorevIlerle('durum', 1);
    gorevIlerle('kombo', run.kombo);
    gorevIlerle('bahsis', Math.round(bahsis));
    if (c.verildi.every(Boolean)) {
      if (c.tip === 'elestirmen' && !c.hata && c.kalan / c.max >= 0.4) { run.elestirmenMutlu++; c.mesaj = '⭐ Harika!'; }
      run.musteriler[i] = null;
      renderMusteri(i);
      ucanYazi(i, c.mesaj);
    } else renderMusteri(i);
    renderTabaklar();
    hud();
  }
  function musteriGelir() {
    var bos = run.musteriler.indexOf(null);
    if (bos === -1) return false;
    var m;
    if (run.mod === 'serbest') {
      var dk = run.zaman / 60;
      if (run.zaman < run.sonraki) return false;
      m = musteriUret(run.zaman, run.rnd, run.menu, enUstGun() > 20 ? 3 : 2, Math.max(0.6, 1 - dk * 0.08), 0.12, enUstGun() >= 8 ? 0.08 : 0, false);
      run.sonraki = run.zaman + Math.max(2.2, 6.5 - dk * 0.9) * (0.6 + run.rnd() * 0.8);
    } else {
      if (run.sira >= run.tanim.liste.length || run.tanim.liste[run.sira].t > run.zaman) return false;
      m = run.tanim.liste[run.sira++];
    }
    var max = m.sabir * (1 + 0.08 * lvl('dekor'));
    run.musteriler[bos] = { tip: m.tip, siparis: m.siparis.slice(), verildi: m.siparis.map(function () { return false; }), max: max, kalan: max, zil: false, hata: false, mesaj: '', mesajT: 0 };
    renderMusteri(bos);
    hud();
    return true;
  }
  function update(dt) {
    run.zaman += dt;
    while (musteriGelir()) { /* sıradaki boş yerler dolar */ }
    var degisti = false;
    run.musteriler.forEach(function (c, i) {
      if (!c) return;
      c.kalan -= dt;
      if (c.mesajT > 0) { c.mesajT -= dt; if (c.mesajT <= 0) { c.mesaj = ''; renderMusteri(i); } }
      var zil = lvl('zil');
      if (zil && !c.zil && c.kalan < c.max * 0.25) { c.zil = true; c.kalan += 2 + zil; c.mesaj = '🛎️ +' + (2 + zil) + ' sn'; c.mesajT = 1; renderMusteri(i); }
      if (c.kalan <= 0) {
        run.musteriler[i] = null;
        run.kalp--;
        run.kacan++;
        run.kombo = 0;
        renderMusteri(i);
        ucanYazi(i, '💢');
        MiniOyun.ses('kaybet');
        degisti = true;
      }
    });
    if (degisti) hud();
    if (run.kalp <= 0) { gunBitti(false); return; }
    var pis = pismeSure(lvl('izgara'));
    run.izgara.forEach(function (g) {
      if (!g) return;
      g.t += dt;
      var d = g.t >= pis + 4 ? 'yanik' : (g.t >= pis ? 'pismis' : 'cig');
      if (d !== g.durum) {
        g.durum = d;
        if (d === 'yanik') { run.yanik++; run.kombo = 0; MiniOyun.ses('kaybet'); hud(); }
        renderIzgara();
      }
    });
    if (run.kazan >= 0) {
      run.kazan += dt;
      if (run.kazan >= 1.2) {
        if (aktifTabak().length < 5) { run.kazan = -1; tabagaEkle('corba'); }
        else run.kazan = 1.2;
        renderIstasyon();
      }
    }
    if (run.cay.durum === 'demleniyor') {
      run.cay.t += dt;
      if (run.cay.t >= 4 - lvl('cay')) { run.cay.durum = 'hazir'; MiniOyun.ses('tik'); renderIstasyon(); }
    }
    if (run.ipucu === 4) { run.ipucuT += dt; if (run.ipucuT > 8) { run.ipucu = 5; renderIpucu(); } }
    if (run.mod !== 'serbest' && run.sira >= run.tanim.liste.length && run.musteriler.every(function (c) { return !c; })) gunBitti(true);
  }
  function yildizHesap() {
    if (run.mod !== 'kariyer') return 0;
    var y = 1;
    if (run.kazanc >= run.tanim.hedef2) y = 2;
    if (run.kazanc >= run.tanim.hedef3 && run.kacan <= 1) y = 3;
    return y;
  }
  function gunBitti(kazandi) {
    state = 'bitti';
    alan.dataset.durum = 'bitti';
    var r = run, metin, baslik, rekor = false, opts;
    if (r.mod === 'serbest') {
      var yeni = r.kazanc > save.serbestRekor;
      if (yeni) save.serbestRekor = r.kazanc;
      save.para += r.kazanc;
      store();
      rekor = MiniOyun.setBest('lokanta-telasi-serbest', r.kazanc);
      opts = { baslik: 'Vardiya bitti: ' + r.kazanc + ' 💰', metin: r.servis + ' servis, en uzun kombo ' + r.enKombo + '. Kazanç kasaya eklendi.' + (yeni ? ' Yeni serbest vardiya rekoru!' : ''), rekor: rekor, skor: r.kazanc, sonuc: r.kazanc + ' 💰', paylas: 'Lokanta Telaşı serbest vardiyada ' + r.kazanc + ' 💰 kazandım!' };
    } else if (!kazandi) {
      opts = { baslik: 'Gün kaybedildi', metin: 'Üç müşteri kızgın gitti. Sabrı az kalan müşterilere öncelik ver ve tekrar dene.', kaybetti: true, sonuc: 'kaybedildi' };
    } else if (r.mod === 'gunluk') {
      rekor = MiniOyun.setBest('lokanta-telasi-gunluk', r.kazanc);
      opts = { baslik: 'Günlük vardiya bitti: ' + r.kazanc + ' 💰', metin: r.servis + ' servis, ' + r.kacan + ' kaçan müşteri, en uzun kombo ' + r.enKombo + '.', rekor: rekor, skor: r.kazanc, sonuc: r.kazanc + ' 💰', paylas: 'Günlük Lokanta Telaşı: ' + r.kazanc + ' 💰 kazandım!' };
    } else {
      var y = yildizHesap(), g = gunKaydi(r.gun) || {};
      save.gunler[r.gun] = { yildiz: Math.max(y, Number(g.yildiz) || 0), enIyiKazanc: Math.max(r.kazanc, Number(g.enIyiKazanc) || 0) };
      save.para += r.kazanc;
      save.itibar += r.elestirmenMutlu;
      gorevIlerle('gun', 1);
      if (!r.yanik) gorevIlerle('yaniksiz', 1);
      if (y === 3) gorevIlerle('yildiz3', 1);
      suslemeKontrol();
      store();
      rekor = MiniOyun.setBest('lokanta-telasi', r.kazanc);
      metin = '⭐'.repeat(y) + '☆'.repeat(3 - y) + ' · ' + r.servis + ' servis, ' + r.kacan + ' kaçan müşteri. Hedefler: ' + r.tanim.hedef2 + ' / ' + r.tanim.hedef3 + ' 💰.';
      if (r.elestirmenMutlu) metin += ' Eleştirmen memnun kaldı: +' + r.elestirmenMutlu + ' itibar yıldızı!';
      baslik = (r.gun === GUN_SAYISI ? 'Büyük Açılış tamam! ' : r.gun + '. gün bitti: ') + r.kazanc + ' 💰';
      opts = { baslik: baslik, metin: metin, rekor: rekor, skor: r.kazanc, sonuc: r.kazanc + ' 💰', paylas: 'Lokanta Telaşı ' + r.gun + '. günde ' + r.kazanc + ' 💰 kazandım!' };
    }
    MiniOyun.bitti(opts);
    ekran.hidden = true;
    panel.hidden = false;
    if (r.mod === 'kariyer') tab = 'harita';
    renderPanel();
    hud();
  }
  function menuyeDon() {
    state = 'menu';
    run = null;
    alan.dataset.durum = 'menu';
    ekran.hidden = true;
    panel.hidden = false;
    renderPanel();
    hud();
  }

  // ---------- Çizim ----------
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hud() {
    paraEl.textContent = save.para;
    yildizEl.textContent = toplamYildiz() + '/120';
    rekorEl.textContent = MiniOyun.getBest(daily ? 'lokanta-telasi-gunluk' : 'lokanta-telasi');
    alan.dataset.tema = save.susleme.secili;
    if (!run || state !== 'oyun') { gunEl.textContent = daily ? 'Günlük' : enUstGun(); return; }
    gunEl.textContent = run.mod === 'kariyer' ? run.gun : (run.mod === 'gunluk' ? 'Günlük' : 'Serbest');
    var kalan = run.mod === 'serbest' ? '∞' : (run.tanim.liste.length - run.sira + run.musteriler.filter(Boolean).length);
    bilgiEl.innerHTML = '<span class="lt-kalp" aria-label="' + run.kalp + ' can">' + '❤️'.repeat(Math.max(0, run.kalp)) + '🖤'.repeat(Math.max(0, 3 - run.kalp)) + '</span>' +
      '<span>💰 <b id="kazanc">' + run.kazanc + '</b></span>' +
      '<span>Kombo <b>x' + komboCarpan(run.kombo) + '</b> (' + run.kombo + ')</span>' +
      '<span>👥 ' + kalan + '</span>';
    alan.dataset.kazanc = run.kazanc;
    alan.dataset.kalp = run.kalp;
    alan.dataset.kombo = run.kombo;
  }
  function renderOyun() {
    var tabela = save.tabela || 'Lokantam';
    var semt = run.mod === 'kariyer' ? SEMTLER[run.tanim.semt] : (run.mod === 'gunluk' ? SEMTLER[2] : SEMTLER[Math.floor((enUstGun() - 1) / 10)]);
    document.getElementById('tabela').textContent = semt.ikon + ' ' + tabela;
    ekran.style.setProperty('--semt', semt.renk);
    renderIpucu();
    renderTezgah();
    renderIzgara();
    renderIstasyon();
    renderTabaklar();
    renderRaf();
  }
  function renderIpucu() {
    var i = run ? run.ipucu : -1;
    ipucuEl.hidden = !(i >= 0 && i < IPUCLARI.length);
    if (!ipucuEl.hidden) ipucuEl.textContent = (i + 1) + '/5 · ' + IPUCLARI[i];
  }
  var TUS_MUSTERI = ['A', 'S', 'D', 'F'], TUS_IZGARA = ['Q', 'W', 'E', 'R'];
  function renderTezgah() {
    tezgahEl.style.gridTemplateColumns = 'repeat(' + run.musteriler.length + ', 1fr)';
    tezgahEl.innerHTML = run.musteriler.map(function (c, i) { return '<div class="lt-yer" data-yer="' + i + '"></div>'; }).join('');
    run.musteriler.forEach(function (c, i) { renderMusteri(i); });
  }
  function renderMusteri(i) {
    var el = tezgahEl.children[i], c = run.musteriler[i];
    if (!el) return;
    if (!c) {
      el.className = 'lt-yer bos';
      el.removeAttribute('data-musteri');
      el.removeAttribute('data-tarif');
      el.innerHTML = '<span class="lt-tus">' + TUS_MUSTERI[i] + '</span>';
      return;
    }
    var sonraki = null;
    for (var k = 0; k < c.siparis.length; k++) if (!c.verildi[k]) { sonraki = c.siparis[k]; break; }
    el.className = 'lt-yer' + (c.mesaj === 'Bu değil!' ? ' red' : '');
    el.setAttribute('data-musteri', i);
    el.setAttribute('data-tarif', sonraki ? YEMEKLER[sonraki].tarif.join(',') : '');
    el.setAttribute('aria-label', TIPLER[c.tip].ad + ': ' + c.siparis.map(function (y) { return YEMEKLER[y].ad; }).join(', '));
    el.innerHTML = '<div class="lt-balon">' + c.siparis.map(function (y, k) {
      var Y = YEMEKLER[y];
      return '<span class="lt-kalem' + (c.verildi[k] ? ' verildi' : '') + '" title="' + Y.ad + ': ' + Y.tarif.map(function (m) { return MALZEMELER[m].ad; }).join(', ') + '">' + Y.ikon + (Y.ek ? '<small>' + Y.ek + '</small>' : '') + '</span>';
    }).join('') + '</div>' +
      '<div class="lt-kisi" aria-hidden="true">' + TIPLER[c.tip].ikon + '</div>' +
      '<div class="lt-sabir"><i></i></div>' +
      (c.mesaj ? '<div class="lt-mesaj">' + esc(c.mesaj) + '</div>' : '') +
      '<span class="lt-tus">' + TUS_MUSTERI[i] + '</span>';
    sabirCiz(el, c);
  }
  function sabirCiz(el, c) {
    var bar = el.querySelector('.lt-sabir i');
    if (!bar) return;
    var o = Math.max(0, c.kalan / c.max);
    bar.style.width = (o * 100).toFixed(1) + '%';
    bar.style.background = o > 0.5 ? '#22c55e' : (o > 0.25 ? '#facc15' : '#ef4444');
  }
  function ucanYazi(i, yazi) {
    var el = tezgahEl.children[i];
    if (!el) return;
    var s = document.createElement('div');
    s.className = 'lt-ucan';
    s.textContent = yazi;
    tezgahEl.appendChild(s);
    s.style.left = (el.offsetLeft + el.offsetWidth / 2) + 'px';
    setTimeout(function () { s.remove(); }, 900);
  }
  function renderIzgara() {
    izgaraEl.innerHTML = run.izgara.map(function (g, i) {
      var d = g ? g.durum : 'bos';
      return '<button type="button" class="lt-izgara ' + d + '" data-izgara="' + i + '" data-durum="' + d + '"' + (g ? ' data-tur="' + g.tur + '"' : '') +
        ' aria-label="Izgara ' + (i + 1) + ': ' + (g ? MALZEMELER[g.tur].ad + ' ' + ({ cig: 'çiğ', pismis: 'pişmiş', yanik: 'yanık' })[d] : 'boş') + '">' +
        (g ? '<span class="lt-halka"></span>' + MALZEMELER[g.tur].ikon + (d === 'yanik' ? '<b>💨</b>' : '') : '') +
        '<span class="lt-tus">' + TUS_IZGARA[i] + '</span></button>';
    }).join('');
    izgaraHalka();
  }
  function izgaraHalka() {
    var pis = pismeSure(lvl('izgara'));
    run.izgara.forEach(function (g, i) {
      if (!g || g.durum !== 'cig') return;
      var h = izgaraEl.children[i] && izgaraEl.children[i].querySelector('.lt-halka');
      if (h) h.style.setProperty('--p', Math.min(100, g.t / pis * 100).toFixed(0) + '%');
    });
  }
  function renderIstasyon() {
    var h = '';
    if (malzemeVar('corba')) h += '<div class="lt-istasyon" data-kazan="' + (run.kazan >= 0 ? 'doluyor' : 'bos') + '">🍲 Kazan<small>' + (run.kazan >= 0 ? 'Doluyor…' : 'Hazır') + '</small></div>';
    if (malzemeVar('cay')) h += '<div class="lt-istasyon" data-cay="' + run.cay.durum + '">🫖 Ocak<small>' + ({ bos: 'Boş', demleniyor: 'Demleniyor…', hazir: 'Çay hazır!' })[run.cay.durum] + '</small></div>';
    istasyonEl.innerHTML = h;
    istasyonEl.hidden = !h;
  }
  function renderTabaklar() {
    tabakEl.innerHTML = run.tabaklar.map(function (p, i) {
      return '<button type="button" class="lt-tabak' + (i === run.aktif ? ' aktif' : '') + '" data-tabak="' + i + '" data-icerik="' + p.join(',') + '" aria-label="Tabak ' + (i + 1) + (i === run.aktif ? ' (seçili)' : '') + ': ' + (p.length ? p.map(function (m) { return MALZEMELER[m].ad; }).join(', ') : 'boş') + '">' +
        (p.length ? p.map(function (m) { return MALZEMELER[m].ikon; }).join('') : '<small>Boş tabak</small>') + '</button>';
    }).join('') + '<button type="button" class="lt-cop" data-cop aria-label="Tabağı boşalt (X)">🗑️<span class="lt-tus">X</span></button>';
  }
  function renderRaf() {
    var n = 0;
    rafEl.innerHTML = RAF_SIRA.map(function (id) {
      if (!malzemeVar(id)) return '';
      var m = MALZEMELER[id], tus = RAF_TUS[n++];
      return '<button type="button" class="lt-malz" data-malz="' + id + '" data-tus="' + tus + '" aria-label="' + m.ad + '">' + m.ikon + '<small>' + m.ad + '</small><span class="lt-tus">' + tus.toUpperCase() + '</span></button>';
    }).join('');
  }
  function kisaMesaj(t) {
    ipucuEl.hidden = false;
    ipucuEl.textContent = t;
    clearTimeout(kisaMesaj.z);
    kisaMesaj.z = setTimeout(function () { if (run) renderIpucu(); }, 1200);
  }
  function tick() {
    run.musteriler.forEach(function (c, i) { if (c && tezgahEl.children[i]) sabirCiz(tezgahEl.children[i], c); });
    izgaraHalka();
    alan.dataset.zaman = run.zaman.toFixed(1);
  }

  function renderPanel() {
    var h = '';
    if (note) h += '<p class="lt-bildirim">' + esc(note) + '</p>';
    if (daily) {
      var t = gunlukTanim();
      h += '<h2>📅 Günlük Lokanta · ' + MiniOyun.gunluk.tarih + '</h2>' +
        '<p>Herkese aynı 20 müşteri gelir, tüm menü açık, yükseltmeler kullanılmaz. Kazancın liderlik tablosuna gider.</p>' +
        '<p>Sıra: ' + t.liste.slice(0, 6).map(function (m) { return TIPLER[m.tip].ikon; }).join(' ') + ' …</p>' +
        '<button type="button" class="btn lt-basla" data-gunluk>Vardiyayı başlat</button>' +
        '<p>Günlük rekor: ' + MiniOyun.getBest('lokanta-telasi-gunluk') + ' 💰</p>';
      panel.innerHTML = h;
      return;
    }
    var tabs = [['harita', '🗺️ Günler'], ['yukselt', '🔧 Yükselt'], ['lokanta', '🎨 Lokanta'], ['gorev', '📋 Görevler']];
    h += '<div class="lt-sekmeler" role="tablist">' + tabs.map(function (t) {
      return '<button type="button" role="tab" class="lt-sekme' + (tab === t[0] ? ' secili' : '') + '" aria-selected="' + (tab === t[0]) + '" data-sekme="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div>';
    if (tab === 'harita') {
      SEMTLER.forEach(function (s, si) {
        var acik = semtAcik(si);
        h += '<div class="lt-semt" style="--semt:' + s.renk + '"><h3>' + s.ikon + ' ' + s.ad + (acik ? '' : ' · 🔒 ' + s.kilit + ' ⭐') + '</h3><div class="lt-gunler">';
        for (var d = si * 10 + 1; d <= si * 10 + 10; d++) {
          var a = gunAcik(d), y = gunYildiz(d);
          h += '<button type="button" class="lt-gun' + (a ? '' : ' kilitli') + '" data-gun-sec="' + d + '"' + (a ? '' : ' disabled') + ' aria-label="' + d + '. gün' + (a ? ', ' + y + ' yıldız' : ', kilitli') + '">' + d + '<small>' + (a ? '★★★'.slice(0, y) + '☆☆☆'.slice(y) : '🔒') + '</small></button>';
        }
        h += '</div></div>';
      });
      var serbestAcik = gunYildiz(5) > 0;
      h += '<div class="lt-serbest"><b>♾️ Serbest vardiya</b><p>' + (serbestAcik ? 'Açılmış tüm menüyle müşteriler hiç bitmez; 3 kalp bitene kadar kazan. Rekor: ' + save.serbestRekor + ' 💰' : '5. günü bitirince açılır.') + '</p>' +
        '<button type="button" class="btn btn-ghost" data-serbest' + (serbestAcik ? '' : ' disabled') + '>Serbest vardiya</button></div>';
    } else if (tab === 'yukselt') {
      h += '<p>Kasada <b>' + save.para + ' 💰</b> var. Yükseltmeler kalıcıdır (günlük modda kullanılmaz).</p><div class="lt-liste">' + YUKSELTMELER.map(function (u) {
        var l = lvl(u.id), max = l >= u.bedel.length, bedel = max ? 0 : u.bedel[l];
        return '<button type="button" class="lt-satir" data-yuk="' + u.id + '"' + (max || save.para < bedel ? ' disabled' : '') + '><span class="lt-ikon">' + u.ikon + '</span><span>' + u.ad + ' ' + l + '/' + u.bedel.length +
          '<small>' + u.etki(l) + (max ? '' : ' → ' + u.etki(l + 1)) + '</small></span><span class="lt-bedel">' + (max ? 'Tam' : bedel + ' 💰') + '</span></button>';
      }).join('') + '</div>';
    } else if (tab === 'lokanta') {
      h += '<label class="lt-tabela-form">Tabela adı <input id="tabela-gir" maxlength="16" value="' + esc(save.tabela) + '" placeholder="Lokantam" autocomplete="off" translate="no"></label>' +
        '<button type="button" class="btn btn-ghost" data-tabela-kaydet>Kaydet</button>' +
        '<h3>Süslemeler</h3><div class="lt-liste">' + SUSLEMELER.map(function (s) {
          var acik = save.susleme.acik.indexOf(s.id) !== -1;
          return '<button type="button" class="lt-satir' + (save.susleme.secili === s.id ? ' secili' : '') + '" data-susleme="' + s.id + '"' + (acik ? '' : ' disabled') + '><span class="lt-ikon">' + s.ikon + '</span><span>' + s.ad + '<small>' + (acik ? (save.susleme.secili === s.id ? 'Seçili' : 'Seç') : '🔒 ' + s.kosul) + '</small></span></button>';
        }).join('') + '</div><p>İtibar yıldızı (eleştirmen): ' + save.itibar + ' ⭐</p>';
    } else if (tab === 'gorev') {
      var g = save.gorev;
      h += '<p>Her gün 3 yeni görev. Üçü bitince +' + gorevOdul() + ' 💰. Görev serisi: ' + save.seri + ' gün (7 günde 🎃 süsleme).</p>' + g.liste.map(function (id) {
        var m = gorevTanim(id), v = Number(g.ilerleme[id]) || 0;
        return '<div class="lt-gorev' + (v >= m.hedef ? ' tamam' : '') + '">' + (v >= m.hedef ? '✅ ' : '⬜ ') + m.ad(m.hedef) + ' · ' + v + '/' + m.hedef + '</div>';
      }).join('');
    }
    panel.innerHTML = h;
  }

  // ---------- Girişler ----------
  function oynuyor() { return state === 'oyun' && !paused && !MiniOyun.duraklatildi(); }
  alan.addEventListener('click', function (e) {
    var b = e.target.closest('button, .lt-yer, .lt-istasyon');
    if (!b) return;
    if (state === 'oyun') {
      if (!oynuyor()) return;
      if (b.dataset.malz) malzemeBas(b.dataset.malz);
      else if (b.dataset.izgara) izgaraBas(Number(b.dataset.izgara));
      else if (b.dataset.tabak) tabakSec(Number(b.dataset.tabak));
      else if (b.hasAttribute('data-cop')) tabakBosalt();
      else if (b.dataset.yer) servisEt(Number(b.dataset.yer));
      else if (b.dataset.cay === 'hazir') malzemeBas('cay');
      else if (b.dataset.kazan === 'bos') malzemeBas('corba');
      return;
    }
    if (b.disabled || MiniOyun.duraklatildi()) return;
    if (b.dataset.sekme) { tab = b.dataset.sekme; note = ''; renderPanel(); }
    else if (b.dataset.gunSec) gunBaslat('kariyer', Number(b.dataset.gunSec));
    else if (b.hasAttribute('data-serbest')) gunBaslat('serbest', 0);
    else if (b.hasAttribute('data-gunluk')) gunBaslat('gunluk', 0);
    else if (b.dataset.yuk) {
      var u = upgrade(b.dataset.yuk), l = lvl(u.id);
      if (l < u.bedel.length && save.para >= u.bedel[l]) {
        save.para -= u.bedel[l]; save.yukseltme[u.id] = l + 1; store(); MiniOyun.ses('puan'); renderPanel(); hud();
      }
    } else if (b.dataset.susleme) { save.susleme.secili = b.dataset.susleme; store(); renderPanel(); hud(); }
    else if (b.hasAttribute('data-tabela-kaydet')) {
      save.tabela = document.getElementById('tabela-gir').value.replace(/\s+/g, ' ').trim().slice(0, 16);
      store();
      note = '🪧 Tabela kaydedildi: ' + (save.tabela || 'Lokantam');
      renderPanel();
    }
  });
  // Uzun basış tabağı boşaltır
  var basTimer = null;
  alan.addEventListener('pointerdown', function (e) {
    var b = e.target.closest('[data-tabak]');
    if (!b || !oynuyor()) return;
    basTimer = setTimeout(function () { basTimer = null; tabakSec(Number(b.dataset.tabak)); tabakBosalt(); }, 600);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (t) { alan.addEventListener(t, function () { clearTimeout(basTimer); }); });
  document.addEventListener('keydown', function (e) {
    if (state !== 'oyun' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    var k = e.key.toLowerCase(), i;
    if (k === 'tab') e.preventDefault();
    if (!oynuyor()) return;
    var malz = rafEl.querySelector('[data-tus="' + k + '"]');
    if (malz) { malzemeBas(malz.dataset.malz); return; }
    if ((i = TUS_IZGARA.indexOf(e.key.toUpperCase())) !== -1) izgaraBas(i);
    else if ((i = TUS_MUSTERI.indexOf(e.key.toUpperCase())) !== -1) servisEt(i);
    else if (k === 'tab') tabakSec((run.aktif + 1) % run.tabaklar.length);
    else if (k === 'x') tabakBosalt();
  });

  // ---------- Döngü ----------
  function frame(t) {
    var dt = Math.min(0.1, Math.max(0, (t - last) / 1000));
    last = t;
    if (oynuyor()) {
      update(dt);
      if (state === 'oyun') tick();
    }
    requestAnimationFrame(frame);
  }

  MiniOyun.oyun({
    restart: function () {
      var r = run;
      if (r && r.mod === 'kariyer') gunBaslat('kariyer', r.gun);
      else if (r) gunBaslat(r.mod, 0);
      else menuyeDon();
    },
    pause: function () { paused = true; },
    resume: function () { paused = false; },
    canPause: function () { return state === 'oyun'; },
    seviye: function () {
      if (daily) return 'günlük';
      if (run && run.mod === 'serbest') return 'serbest';
      return 'gün ' + (run ? run.gun : enUstGun());
    }
  });

  gorevHazirla();
  suslemeKontrol();
  store();
  note = '';
  menuyeDon();
  requestAnimationFrame(function (t) { last = t; frame(t); });
})();

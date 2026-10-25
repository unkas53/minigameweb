(function () {
  // Lokanta Telaşı: müşterilerin siparişlerini sabırları bitmeden hazırlayıp servis edilen restoran oyunu.
  // 4 semt x 10 gün, gün başına 1-3 yıldız, parayla kalıcı yükseltmeler, yıldız ve seriyle açılan tezgâh
  // temaları, tabela adı, günlük görevler, serbest vardiya ve günlük modda (?gunluk=) herkese aynı müşteriler.
  // Tarif, müşteri üretimi ve ödeme kuralları motor.js'de. Kayıt: mo_lokanta.
  var M = window.LokantaMotor;
  var SAVE_KEY = 'mo_lokanta';
  var RAF_TUSLARI = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'y', 'u'];
  var IZGARA_TUSLARI = ['q', 'w', 'e', 'r'];
  var MUSTERI_TUSLARI = ['a', 's', 'd', 'f'];

  var TEMALAR = [
    { id: 'sade', ad: 'Sade ahşap', onluk: '🤍', kosul: 'Başlangıçta açık' },
    { id: 'kareli', ad: 'Kareli örtü', onluk: '❤️', yildiz: 10 },
    { id: 'cini', ad: 'Çini mavisi', onluk: '💙', yildiz: 30 },
    { id: 'bakir', ad: 'Bakır tezgâh', onluk: '🧡', yildiz: 60 },
    { id: 'gece', ad: 'Gece lambaları', onluk: '💜', yildiz: 100 },
    { id: 'cadilar', ad: 'Cadılar Bayramı', onluk: '🎃', seri: 7 }
  ];
  var GOREVLER = [
    { id: 'durum15', ad: '15 dürüm servis et', hedef: 15 },
    { id: 'mutlu25', ad: '25 müşteriyi mutlu gönder', hedef: 25 },
    { id: 'kombo5', ad: '5\'li kombo yap', hedef: 5 },
    { id: 'yaniksiz', ad: 'Bir günü hiç yanık yapmadan bitir', hedef: 1 },
    { id: 'gun3', ad: '3 gün bitir', hedef: 3 },
    { id: 'yildiz3', ad: 'Bir günden 3 yıldız al', hedef: 1 },
    { id: 'para250', ad: 'Bir günde 250 💰 kazan', hedef: 250 },
    { id: 'icecek10', ad: '10 içecek (ayran veya çay) servis et', hedef: 10 }
  ];
  var GOREV_ODUL = 150;

  var oyunEl = document.getElementById('lt-oyun');
  var haritaEl = document.getElementById('lt-harita');
  var tezgahEl = document.getElementById('lt-tezgah');
  var ocakEl = document.getElementById('lt-ocak');
  var tabakEl = document.getElementById('lt-tabaklar');
  var rafEl = document.getElementById('lt-raf');
  var ipucuEl = document.getElementById('lt-ipucu');
  var tabelaEl = document.getElementById('lt-tabela');
  var hud = {
    gun: document.getElementById('lt-gun'), kalp: document.getElementById('lt-kalp'),
    kazanc: document.getElementById('lt-kazanc'), sure: document.getElementById('lt-sure'), kombo: document.getElementById('lt-kombo')
  };

  var daily = !!(MiniOyun.gunluk && MiniOyun.gunluk.tarih);
  var save = load();
  var run = null, paused = false, last = 0, sekme = 'gunler', gunNo = 1, ipucuT = 0;

  // ---------- Kayıt ----------
  function load() {
    var p = null;
    try { p = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) {}
    if (!p || typeof p !== 'object' || Array.isArray(p)) p = {};
    if (!p.gunler || typeof p.gunler !== 'object') p.gunler = {};
    if (!p.yukseltme || typeof p.yukseltme !== 'object') p.yukseltme = {};
    M.YUKSELTMELER.forEach(function (u) { p.yukseltme[u.id] = Math.max(0, Math.min(u.fiyat.length, Number(p.yukseltme[u.id]) || 0)); });
    if (!p.susleme || typeof p.susleme !== 'object') p.susleme = {};
    if (typeof p.susleme.secili !== 'string') p.susleme.secili = 'sade';
    if (!Array.isArray(p.susleme.acik)) p.susleme.acik = ['sade'];
    p.para = Math.max(0, Math.floor(Number(p.para) || 0));
    p.seri = Math.max(0, Number(p.seri) || 0);
    p.serbestRekor = Math.max(0, Number(p.serbestRekor) || 0);
    if (typeof p.tabela !== 'string') p.tabela = 'Benim Lokantam';
    p.tabela = p.tabela.slice(0, 16);
    return p;
  }
  function store() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
  }
  function stars(n) { var g = save.gunler[n]; return g ? Math.max(0, Math.min(3, Number(g.yildiz) || 0)) : 0; }
  function totalStars() { var s = 0; for (var i = 1; i <= M.GUN_SAYI; i++) s += stars(i); return s; }
  function semtStars(w) { var s = 0; for (var i = w * 10 + 1; i <= w * 10 + 10; i++) s += stars(i); return s; }
  function semtOpen(w) { return w === 0 || (stars(w * 10) > 0 && totalStars() >= M.SEMTLER[w].esik); }
  function dayOpen(n) {
    if (!semtOpen(Math.floor((n - 1) / 10))) return false;
    return n % 10 === 1 || stars(n - 1) > 0;
  }
  function serbestOpen() { return stars(10) > 0; }
  function temaOpen(t) {
    if (t.yildiz) return totalStars() >= t.yildiz;
    if (t.seri) return save.seri >= t.seri;
    return true;
  }
  function refreshThemes() {
    var yeni = [];
    TEMALAR.forEach(function (t) { if (temaOpen(t) && save.susleme.acik.indexOf(t.id) === -1) { save.susleme.acik.push(t.id); yeni.push(t.ad); } });
    return yeni;
  }
  function tema() {
    for (var i = 0; i < TEMALAR.length; i++) if (TEMALAR[i].id === save.susleme.secili && save.susleme.acik.indexOf(TEMALAR[i].id) !== -1) return TEMALAR[i];
    return TEMALAR[0];
  }

  // ---------- Günlük görevler ----------
  function today() { return MiniOyun.gunluk.bugun(); }
  function missionsReady() {
    var g = save.gorev, d = today();
    if (g && g.gun === d && Array.isArray(g.liste) && g.liste.length === 3 && g.ilerleme && typeof g.ilerleme === 'object' && Array.isArray(g.tamam)) return;
    var rnd = MiniOyun.gunluk.rastgele(d + '/lokanta-gorev');
    var pool = GOREVLER.map(function (m) { return m.id; }), list = [];
    while (list.length < 3) list.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    save.gorev = { gun: d, liste: list, ilerleme: {}, tamam: [], odul: false };
    list.forEach(function (id) { save.gorev.ilerleme[id] = 0; });
    store();
  }
  function mission(id) { for (var i = 0; i < GOREVLER.length; i++) if (GOREVLER[i].id === id) return GOREVLER[i]; }
  function iso(t) { return t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2); }
  function dayBefore(d) { var t = new Date(d + 'T12:00:00'); t.setDate(t.getDate() - 1); return iso(t); }
  // Görev ilerlemesi; "en az" türündekiler için set=true. Günlük modda görev ilerlemez.
  function progressMission(id, n, set) {
    if (!run || run.mod === 'gunluk') return;
    missionsReady();
    var g = save.gorev;
    if (g.liste.indexOf(id) === -1 || g.tamam.indexOf(id) !== -1) return;
    var m = mission(id);
    g.ilerleme[id] = set ? Math.max(g.ilerleme[id] || 0, n) : (g.ilerleme[id] || 0) + n;
    if (g.ilerleme[id] >= m.hedef) {
      g.tamam.push(id);
      say('✅ Görev tamam: ' + m.ad);
      MiniOyun.ses('puan');
      if (g.tamam.length === 3 && !g.odul) {
        g.odul = true;
        save.para += GOREV_ODUL;
        save.seri = save.sonGun === dayBefore(g.gun) ? save.seri + 1 : save.sonGun === g.gun ? save.seri : 1;
        save.sonGun = g.gun;
        refreshThemes();
        say('🎁 Günlük görevler bitti: +' + GOREV_ODUL + ' 💰, seri ' + save.seri);
      }
    }
    store();
  }

  // ---------- Gün başlatma ----------
  function startDay(n) {
    gunNo = n;
    var a = M.ayar(n);
    begin(a, 'kampanya', M.gun(a, MiniOyun.gunluk.rastgele('lokanta-gun-' + n)), M.degerler(save.yukseltme));
  }
  function startDaily() {
    var a = M.gunlukAyar();
    begin(a, 'gunluk', M.gun(a, MiniOyun.rastgele()), M.degerler({}));
  }
  function startFree() {
    var a = M.ayar(Math.min(M.GUN_SAYI, highestDay()));
    a.musteri = 0; a.sure = 0; a.yagmur = false; a.aksam = false;
    begin(a, 'serbest', [], M.degerler(save.yukseltme));
    run.rnd = Math.random;
    run.sonraki = 1.5;
  }
  function highestDay() { var h = 1; for (var i = 1; i <= M.GUN_SAYI; i++) if (stars(i) > 0) h = i; return h; }

  function begin(a, mod, musteriler, D) {
    run = {
      a: a, mod: mod, D: D, kuyruk: musteriler, hedef: musteriler.length ? M.hedefler(musteriler) : null,
      t: 0, kalp: 3, kazanc: 0, kombo: 0, enKombo: 0, kacan: 0, gelen: 0, yanik: 0, bitti: false,
      yerler: [], izgara: [], tabaklar: [], aktif: 0, demlik: { durum: 'bos', t: 0 },
      elestirmenMutlu: false, egitim: a.no === 1 && mod === 'kampanya' ? 0 : -1, sayilar: { durum: 0, icecek: 0, mutlu: 0 }
    };
    var i;
    for (i = 0; i < D.musteriYer; i++) run.yerler.push(null);
    for (i = 0; i < D.izgaraYer; i++) run.izgara.push(null);
    for (i = 0; i < D.tabak; i++) run.tabaklar.push([]);
    oyunEl.dataset.sira = musteriler.map(function (m) { return m.tip[0] + m.siparis.join('+') + '@' + m.gelis; }).join(',');
    oyunEl.dataset.mod = mod;
    build();
    haritaEl.hidden = true; oyunEl.hidden = false;
    var semt = M.SEMTLER[a.semt];
    oyunEl.style.setProperty('--semt', semt.renk);
    if (mod === 'kampanya') {
      var olay = a.acilis ? ' 🎉 Büyük Açılış!' : a.yagmur ? ' 🌧️ Yağmurlu gün: çorba çok istenir.' : a.aksam ? ' 🌆 Akşam yoğunluğu: son dakikalar kalabalık.' : '';
      say(semt.ikon + ' Gün ' + a.no + ': ' + a.musteri + ' müşteri. 2⭐ ' + run.hedef.iki + ' 💰, 3⭐ ' + run.hedef.uc + ' 💰.' + olay, 4);
    } else if (mod === 'gunluk') say('📅 Günlük lokanta: herkese aynı 20 müşteri, yükseltmesiz temel lokanta.', 4);
    else say('♾️ Serbest vardiya: müşteriler bitmez, 3 kalp bitene kadar kazan!', 4);
    if (run.egitim === 0) egitim();
    try { oyunEl.focus({ preventScroll: true }); } catch (e) {}
    if (oyunEl.scrollIntoView) oyunEl.scrollIntoView({ block: 'nearest' });
    render();
  }

  // Oyun alanının sabit parçaları her gün bir kez kurulur; sonra yalnızca içerikleri güncellenir.
  function build() {
    tabelaEl.textContent = save.tabela || 'Benim Lokantam';
    oyunEl.dataset.tema = run.mod === 'gunluk' ? 'sade' : tema().id;
    tezgahEl.innerHTML = '';
    run.yerler.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'lt-musteri'; b.dataset.yer = i;
      b.innerHTML = '<span class="lt-balon" translate="no"></span><span class="lt-yuz"></span><span class="lt-sabir"><i></i></span><small class="lt-tus">' + MUSTERI_TUSLARI[i].toUpperCase() + '</small>';
      b.setAttribute('aria-label', 'Müşteri yeri ' + (i + 1));
      tezgahEl.appendChild(b);
    });
    ocakEl.innerHTML = '';
    run.izgara.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'lt-izgara'; b.dataset.izgara = i;
      b.innerHTML = '<span class="lt-et"></span><small class="lt-tus">' + IZGARA_TUSLARI[i].toUpperCase() + '</small>';
      b.setAttribute('aria-label', 'Izgara yeri ' + (i + 1));
      ocakEl.appendChild(b);
    });
    var dm = document.createElement('div');
    dm.className = 'lt-demlik'; dm.id = 'lt-demlik';
    dm.hidden = run.a.menu.indexOf('cay') === -1;
    dm.innerHTML = '<span>🫖</span><small></small>';
    ocakEl.appendChild(dm);
    tabakEl.innerHTML = '';
    run.tabaklar.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'lt-tabak'; b.dataset.tabak = i;
      b.innerHTML = '<span class="lt-icerik" translate="no"></span><small class="lt-hazir"></small>';
      b.setAttribute('aria-label', 'Tabak ' + (i + 1));
      tabakEl.appendChild(b);
    });
    var cop = document.createElement('button');
    cop.type = 'button'; cop.className = 'lt-cop'; cop.dataset.cop = '1';
    cop.innerHTML = '🗑️<small class="lt-tus">X</small>';
    cop.setAttribute('aria-label', 'Tabağı boşalt');
    tabakEl.appendChild(cop);
    rafEl.innerHTML = '';
    rafList().forEach(function (m, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'lt-malz'; b.dataset.malz = m.id;
      b.innerHTML = '<span>' + m.ikon + '</span><small>' + m.ad + '</small><b class="lt-tus">' + RAF_TUSLARI[i].toUpperCase() + '</b>';
      b.setAttribute('aria-label', m.ad);
      rafEl.appendChild(b);
    });
  }
  // Raftaki malzemeler: açık menünün tariflerindeki malzemeler, sabit sırayla
  function rafList() {
    var need = {};
    run.a.menu.forEach(function (y) { M.yemek(y).tarif.forEach(function (m) { need[m] = true; }); });
    return M.MALZEMELER.filter(function (m) { return need[m.id]; });
  }

  // ---------- Eğitim (1. gün) ----------
  var EGITIM = [
    '1/5 Eti 🥩 ızgaraya koy: raftaki ete dokun.',
    '2/5 Et pişerken tabağa lavaş 🫓, domates 🍅 ve soğan 🧅 ekle.',
    '3/5 Et kahverengiye dönüp yeşil halka çıkınca ızgaraya dokun, tabağa al.',
    '4/5 Tabak hazır! Dürüm isteyen müşteriye dokunarak servis et.',
    '5/5 Sabır çubuğu bitmeden servis et. Yanan eti ızgarada dokunarak çöpe at. Bol kazançlar!'
  ];
  function egitim(adim) {
    if (!run || run.egitim < 0) return;
    if (adim !== undefined) { if (adim !== run.egitim + 1) return; run.egitim = adim; }
    say('🎓 ' + EGITIM[run.egitim], run.egitim === 4 ? 5 : 999);
    if (run.egitim === 4) run.egitim = -1;
  }

  function say(text, sn) {
    ipucuEl.textContent = text;
    ipucuT = sn || 2.5;
  }

  // ---------- Girişler ----------
  function blocked() { return !run || run.bitti || paused || MiniOyun.duraklatildi() || oyunEl.hidden; }
  function plate() { return run.tabaklar[run.aktif]; }

  function addIngredient(id) {
    if (blocked()) return;
    var m = M.malzeme(id);
    if (!m) return;
    if (m.izgara) {
      var bos = run.izgara.indexOf(null);
      if (bos === -1) { say('Izgarada boş yer yok!'); return; }
      run.izgara[bos] = { tur: id, t: 0 };
      MiniOyun.ses('tik');
      if (id === 'et') egitim(1);
    } else if (m.demlik) {
      var d = run.demlik;
      if (d.durum === 'bos') { d.durum = 'demleniyor'; d.t = 0; MiniOyun.ses('tik'); say('🫖 Çay demleniyor...'); }
      else if (d.durum === 'hazir') { d.durum = 'bos'; put('cay'); }
      else say('Çay henüz demlenmedi.');
    } else put(id);
    render();
  }
  function put(id) {
    var p = plate();
    if (p.length >= 8) { say('Tabak dolu!'); return; }
    p.push(id);
    MiniOyun.ses('tik');
    if (run.egitim === 1 && ['lavas', 'domates', 'sogan'].every(function (x) { return p.indexOf(x) !== -1; })) egitim(2);
    if (run.egitim === 2 && M.tabakYemek(p) && M.tabakYemek(p).id === 'durum') egitim(3);
  }
  function grill(i) {
    if (blocked()) return;
    var g = run.izgara[i];
    if (!g) return;
    var st = grillState(g);
    if (st === 'cig') { say('Henüz pişmedi, biraz bekle.'); return; }
    run.izgara[i] = null;
    if (st === 'yanik') {
      run.yanik++;
      run.kombo = 0;
      say('💨 Yanık ' + M.malzeme(g.tur).ad.toLowerCase() + ' çöpe gitti, kombo sıfırlandı.');
      MiniOyun.ses('kaybet');
    } else put(g.tur);
    render();
  }
  function grillState(g) {
    var cook = M.malzeme(g.tur).izgara * run.D.pisme;
    return g.t < cook ? 'cig' : g.t < cook + M.YANMA ? 'pismis' : 'yanik';
  }
  function emptyPlate(i) {
    if (blocked()) return;
    var p = run.tabaklar[i === undefined ? run.aktif : i];
    if (!p.length) return;
    p.length = 0;
    MiniOyun.ses('tik');
    render();
  }
  function selectPlate(i) {
    if (blocked() || i >= run.tabaklar.length) return;
    run.aktif = i;
    render();
  }

  function serve(i) {
    if (blocked()) return;
    var c = run.yerler[i];
    if (!c) return;
    var p = plate();
    if (!p.length) { say('Önce tabağı hazırla.'); return; }
    var parca = M.eslestir(p, c.kalan);
    if (!parca) {
      c.kalanSabir = Math.max(0.5, c.kalanSabir - c.sabir * 0.15);
      c.hata = true; c.yazi = 'Bu değil!'; c.yaziT = 1.2;
      run.kombo = 0;
      say('❌ Bu değil! Sipariş: ' + c.kalan.map(function (y) { return M.yemek(y).ikon; }).join(' ') + '. Sabrı azaldı.');
      MiniOyun.ses('kaybet');
      render();
      return;
    }
    var yemekler = parca.map(function (k) { return c.kalan[k]; });
    c.kalan = c.kalan.filter(function (_, k) { return parca.indexOf(k) === -1; });
    p.length = 0;
    run.kombo++;
    run.enKombo = Math.max(run.enKombo, run.kombo);
    var o = M.odeme(yemekler, c.kalanSabir / c.sabir, c.tip, run.D.bahsis, run.kombo);
    run.kazanc += o.toplam;
    c.yazi = '+' + o.toplam + ' 💰'; c.yaziT = 1.2;
    yemekler.forEach(function (y) {
      if (y === 'durum') { run.sayilar.durum++; progressMission('durum15', 1); }
      if (y === 'ayran' || y === 'cay') { run.sayilar.icecek++; progressMission('icecek10', 1); }
    });
    progressMission('kombo5', run.kombo, true);
    MiniOyun.ses('puan');
    if (run.egitim === 3) egitim(4);
    say('😋 +' + o.toplam + ' 💰 (bahşiş ' + o.bahsis + (run.kombo >= 2 ? ', kombo x' + M.komboCarpan(run.kombo) : '') + ')', 1.6);
    if (!c.kalan.length) leave(i, true);
    render();
  }

  // Müşteri gider: mutlu (tüm sipariş servis edildi) ya da kızgın (sabır bitti)
  function leave(i, mutlu) {
    var c = run.yerler[i];
    run.yerler[i] = null;
    var el = tezgahEl.children[i];
    if (el) {
      var y = document.createElement('span');
      y.className = 'lt-gidis' + (mutlu ? '' : ' kizgin');
      y.textContent = mutlu ? '💰' : '💢';
      el.appendChild(y);
      setTimeout(function () { if (y.parentNode) y.parentNode.removeChild(y); }, 900);
    }
    if (mutlu) {
      run.sayilar.mutlu++;
      progressMission('mutlu25', 1);
      if (c.tip === 'elestirmen' && !c.hata && c.kalanSabir / c.sabir >= 0.4) {
        run.elestirmenMutlu = true;
        say('🧑‍🍳 Eleştirmen çok memnun kaldı: gün sonunda +1 ⭐!', 2.5);
      }
      return;
    }
    run.kalp--;
    run.kacan++;
    run.kombo = 0;
    MiniOyun.ses('kaybet');
    say('💢 Bir müşteri kızgın gitti! Kalan kalp: ' + Math.max(0, run.kalp), 2);
    if (run.kalp <= 0) end(false);
  }

  // ---------- Güncelleme ----------
  function update(dt) {
    run.t += dt;
    var D = run.D, a = run.a, i;
    // Yeni müşteriler: sırası gelen ve boş yer bulan oturur; sabır oturunca işlemeye başlar
    if (run.mod === 'serbest') {
      if (run.t >= run.sonraki && run.yerler.indexOf(null) !== -1) {
        var sa = M.ayar(Math.min(M.GUN_SAYI, 10 + Math.floor(run.t / 20)));
        sa.menu = run.a.menu; sa.yagmur = false;
        sa.sabir = Math.max(14, 28 - run.t / 25);
        run.kuyruk.push(M.musteri(sa, run.rnd));
        run.kuyruk[run.kuyruk.length - 1].gelis = run.t;
        run.sonraki = run.t + Math.max(2.4, 7 - run.t / 35);
      }
    }
    while (run.gelen < run.kuyruk.length && run.kuyruk[run.gelen].gelis <= run.t && run.yerler.indexOf(null) !== -1) {
      var m = run.kuyruk[run.gelen++], bos = run.yerler.indexOf(null), sabir = m.sabir * D.sabir;
      run.yerler[bos] = { tip: m.tip, kalan: m.siparis.slice(), sabir: sabir, kalanSabir: sabir, zil: false, hata: false, yazi: '', yaziT: 0 };
    }
    for (i = 0; i < run.yerler.length; i++) {
      var c = run.yerler[i];
      if (!c) continue;
      c.kalanSabir -= dt;
      if (c.yaziT > 0) c.yaziT -= dt;
      if (D.zil && !c.zil && c.kalanSabir / c.sabir < 0.25) { c.zil = true; c.kalanSabir += D.zil; c.yazi = '🛎️ +' + D.zil + ' sn'; c.yaziT = 1; }
      if (c.kalanSabir <= 0) { leave(i, false); if (run.bitti) return; }
    }
    run.izgara.forEach(function (g) {
      if (!g) return;
      var once = grillState(g);
      g.t += dt;
      if (once === 'pismis' && grillState(g) === 'yanik') { run.kombo = 0; say('💨 Izgaradaki ' + M.malzeme(g.tur).ad.toLowerCase() + ' yandı! Dokunup çöpe at.'); }
    });
    if (run.demlik.durum === 'demleniyor') {
      run.demlik.t += dt;
      if (run.demlik.t >= D.demleme) { run.demlik.durum = 'hazir'; say('🍵 Çay hazır! Çay düğmesiyle tabağa koy.'); }
    }
    if (ipucuT < 900) { ipucuT -= dt; if (ipucuT <= 0) ipucuEl.textContent = ''; }
    if (run.mod !== 'serbest') {
      // Süre bitince yeni müşteri gelmez; oturanlar servis edilince ya da gidince gün biter
      if (run.t >= a.sure && run.gelen < run.kuyruk.length) { run.gelen = run.kuyruk.length; say('🔔 Kapanış saati: yeni müşteri gelmiyor.'); }
      if (run.gelen >= run.kuyruk.length && run.yerler.every(function (x) { return !x; })) end(true);
    }
  }

  // ---------- Gün sonu ----------
  function end(tamam) {
    if (run.bitti) return;
    run.bitti = true;
    render();
    if (run.mod === 'gunluk') return endDaily(tamam);
    if (run.mod === 'serbest') return endFree();
    var n = run.a.no, k = run.kazanc;
    save.para += k;
    if (!tamam) {
      store();
      MiniOyun.bitti({
        baslik: 'Lokanta kapandı!',
        metin: 'Gün ' + n + ' kaybedildi: üç müşteri kızgın gitti. Yine de ' + k + ' 💰 kazandın. Önce sabrı en az kalan müşteriye bak, eti siparişten önce ızgaraya koy.',
        kaybetti: true
      });
      showMap();
      return;
    }
    var y = M.yildiz(k, run.hedef, run.kacan, run.elestirmenMutlu), old = stars(n);
    var g = save.gunler[n] || (save.gunler[n] = { yildiz: 0, enIyiKazanc: 0 });
    g.yildiz = Math.max(old, y);
    g.enIyiKazanc = Math.max(Number(g.enIyiKazanc) || 0, k);
    var bonus = Math.max(0, y - old) * 20;
    save.para += bonus;
    progressMission('gun3', 1);
    if (!run.yanik) progressMission('yaniksiz', 1);
    if (y === 3) progressMission('yildiz3', 1);
    progressMission('para250', k, true);
    var acilan = refreshThemes();
    var semtYeni = [];
    for (var w = 1; w < M.SEMTLER.length; w++) if (n === w * 10 && semtOpen(w) && old === 0) semtYeni.push(M.SEMTLER[w].ikon + ' ' + M.SEMTLER[w].ad);
    store();
    var rec = MiniOyun.setBest('lokanta-telasi-' + n, k);
    MiniOyun.setBest('lokanta-telasi', k);
    MiniOyun.bitti({
      baslik: 'Gün ' + n + ' bitti! ' + '★★★'.slice(0, y) + '☆☆☆'.slice(y),
      metin: k + ' 💰 kazandın (2⭐ ' + run.hedef.iki + ', 3⭐ ' + run.hedef.uc + '), ' + run.kacan + ' müşteri kaçtı, en iyi kombo ' + run.enKombo + '.' +
        (bonus ? ' Yıldız bonusu +' + bonus + ' 💰.' : '') + (run.elestirmenMutlu ? ' Eleştirmen memnundu: +1 ⭐.' : '') +
        (acilan.concat(semtYeni).length ? ' Açıldı: ' + acilan.concat(semtYeni).join(', ') + '.' : '') +
        (y < 2 ? ' 2 yıldız için ' + run.hedef.iki + ' 💰 kazan.' : y < 3 ? ' 3 yıldız için ' + run.hedef.uc + ' 💰 kazan ve en fazla 1 müşteri kaçır.' : ''),
      rekor: rec, skor: k, sonuc: k + ' 💰', seviye: 'gün ' + n,
      paylas: 'Lokanta Telaşı ' + n + '. günü ' + y + ' yıldızla ' + k + ' 💰 kazançla bitirdim!'
    });
    showMap();
  }
  function endDaily(tamam) {
    var k = run.kazanc;
    if (!tamam) {
      MiniOyun.bitti({ baslik: 'Lokanta kapandı!', metin: 'Günlük lokantada üç müşteri kızgın gitti. Tekrar dene; kazancın ancak günü bitirince sayılır.', kaybetti: true });
      return;
    }
    var rec = MiniOyun.setBest('lokanta-telasi-gunluk', k);
    MiniOyun.setBest('lokanta-telasi', k);
    MiniOyun.bitti({
      baslik: 'Günlük lokanta bitti!',
      metin: k + ' 💰 kazandın, ' + run.kacan + ' müşteri kaçtı, en iyi kombo ' + run.enKombo + '.',
      rekor: rec, skor: k, sonuc: k + ' 💰', seviye: 'günlük',
      paylas: 'Lokanta Telaşı günlük vardiyasında ' + k + ' 💰 kazandım!'
    });
  }
  function endFree() {
    var k = run.kazanc, rec = k > save.serbestRekor;
    save.para += k;
    save.serbestRekor = Math.max(save.serbestRekor, k);
    store();
    MiniOyun.setBest('lokanta-telasi-serbest', k);
    MiniOyun.bitti({
      baslik: 'Vardiya bitti: ' + k + ' 💰',
      metin: run.sayilar.mutlu + ' müşteriyi mutlu gönderdin, en iyi kombo ' + run.enKombo + '. Serbest vardiya rekorun: ' + save.serbestRekor + ' 💰.',
      rekor: rec, skor: k, sonuc: k + ' 💰', seviye: 'serbest',
      paylas: 'Lokanta Telaşı serbest vardiyasında ' + k + ' 💰 kazandım!'
    });
    showMap();
  }

  // ---------- Çizim ----------
  function render() {
    if (!run) return;
    var D = run.D;
    hud.gun.textContent = run.mod === 'gunluk' ? 'Günlük' : run.mod === 'serbest' ? 'Serbest' : String(run.a.no);
    hud.kalp.textContent = '❤️'.repeat(Math.max(0, run.kalp)) + '🖤'.repeat(3 - Math.max(0, run.kalp));
    hud.kazanc.textContent = run.kazanc + ' 💰';
    hud.sure.textContent = run.mod === 'serbest' ? Math.floor(run.t) + ' sn' : Math.max(0, Math.ceil(run.a.sure - run.t)) + ' sn';
    hud.kombo.textContent = run.kombo >= 2 ? 'x' + M.komboCarpan(run.kombo) + ' (' + run.kombo + ')' : '-';
    run.yerler.forEach(function (c, i) {
      var el = tezgahEl.children[i];
      if (!el) return;
      var balon = el.children[0], yuz = el.children[1], bar = el.children[2].firstChild;
      el.classList.toggle('bos', !c);
      el.dataset.siparis = c ? c.kalan.join(',') : '';
      el.dataset.tip = c ? c.tip : '';
      if (!c) { balon.textContent = ''; yuz.textContent = ''; bar.style.width = '0'; return; }
      balon.textContent = c.yaziT > 0 ? c.yazi : c.kalan.map(function (y) { return M.yemek(y).ikon; }).join('');
      yuz.textContent = M.TIPLER[c.tip].ikon;
      var o = Math.max(0, c.kalanSabir / c.sabir);
      bar.style.width = Math.round(o * 100) + '%';
      bar.style.background = o > 0.5 ? '#22c55e' : o > 0.25 ? '#eab308' : '#ef4444';
      el.setAttribute('aria-label', M.TIPLER[c.tip].ad + ': ' + c.kalan.map(function (y) { return M.yemek(y).ad; }).join(', '));
    });
    run.izgara.forEach(function (g, i) {
      var el = ocakEl.children[i];
      if (!el) return;
      var st = g ? grillState(g) : 'bos';
      el.dataset.durum = st;
      el.dataset.tur = g ? g.tur : '';
      var m = g && M.malzeme(g.tur);
      el.firstChild.textContent = !g ? '' : st === 'cig' ? m.ikon : st === 'pismis' ? m.pismis : '💨';
      var cook = g ? m.izgara * D.pisme : 1;
      el.style.setProperty('--p', g ? Math.min(100, Math.round(st === 'cig' ? g.t / cook * 100 : st === 'pismis' ? 100 - (g.t - cook) / M.YANMA * 100 : 0)) : 0);
    });
    var dm = document.getElementById('lt-demlik');
    if (dm) {
      dm.dataset.durum = run.demlik.durum;
      dm.lastChild.textContent = run.demlik.durum === 'bos' ? 'boş' : run.demlik.durum === 'hazir' ? 'hazır!' : Math.max(0, D.demleme - run.demlik.t).toFixed(1) + ' sn';
    }
    run.tabaklar.forEach(function (p, i) {
      var el = tabakEl.children[i];
      if (!el) return;
      el.classList.toggle('aktif', i === run.aktif);
      el.dataset.icerik = p.join(',');
      el.firstChild.textContent = p.length ? p.map(function (x) { var m = M.malzeme(x); return m.pismis || m.ikon; }).join('') : '🍽️';
      var y = M.tabakYemek(p);
      el.lastChild.textContent = y ? y.ikon + ' ' + y.ad : p.length ? '...' : 'boş tabak';
    });
    oyunEl.dataset.durum = run.bitti ? 'bitti' : 'oyun';
    oyunEl.dataset.kalp = run.kalp;
    oyunEl.dataset.kazanc = run.kazanc;
    oyunEl.dataset.kombo = run.kombo;
    oyunEl.dataset.kacan = run.kacan;
    oyunEl.dataset.t = run.t.toFixed(2);
    oyunEl.dataset.aktif = run.aktif;
    oyunEl.dataset.demleme = D.demleme;
  }

  // ---------- Harita ve menüler ----------
  function showMap() {
    if (daily) { renderDailyIntro(); return; }
    missionsReady();
    refreshThemes();
    oyunEl.hidden = !run || !run.bitti ? true : oyunEl.hidden;
    if (run && run.bitti) oyunEl.hidden = true;
    haritaEl.hidden = false;
    oyunEl.dataset.durum = 'harita';
    var h = '<div class="lt-cuzdan"><span>💰 <b id="lt-para">' + save.para + '</b></span><span>⭐ ' + totalStars() + '/120</span><span>🔥 seri ' + save.seri + '</span></div>';
    h += '<p class="lt-tabela-kucuk" translate="no"></p>';
    h += '<div class="lt-sekmeler" role="tablist">' + [['gunler', '🗺️ Günler'], ['yukselt', '🛠️ Yükseltmeler'], ['lokanta', '🎨 Lokanta'], ['gorev', '📋 Görevler']].map(function (s) {
      return '<button type="button" class="lt-sekme' + (sekme === s[0] ? ' secili' : '') + '" data-sekme="' + s[0] + '" role="tab" aria-selected="' + (sekme === s[0]) + '">' + s[1] + '</button>';
    }).join('') + '</div>';
    if (sekme === 'gunler') {
      M.SEMTLER.forEach(function (s, w) {
        var acik = semtOpen(w);
        h += '<section class="lt-semt' + (acik ? '' : ' kilitli') + '" style="--semt:' + s.renk + '"><h3>' + s.ikon + ' ' + s.ad + ' <small>' + semtStars(w) + '/30 ⭐' +
          (acik ? '' : ' · 🔒 ' + s.esik + ' ⭐ ve ' + (w * 10) + '. gün') + '</small></h3><div class="lt-gunler">';
        for (var n = w * 10 + 1; n <= w * 10 + 10; n++) {
          var y = stars(n), op = dayOpen(n);
          h += '<button type="button" class="lt-gun' + (op ? '' : ' kilitli') + '" data-gun="' + n + '"' + (op ? '' : ' disabled') + ' aria-label="Gün ' + n + (op ? ', ' + y + ' yıldız' : ', kilitli') + '"><b>' + n + '</b><small>' + (op ? '★★★'.slice(0, y) + '☆☆☆'.slice(y) : '🔒') + '</small></button>';
        }
        h += '</div></section>';
      });
      h += '<button type="button" class="btn lt-serbest" data-serbest="1"' + (serbestOpen() ? '' : ' disabled') + '>♾️ Serbest vardiya' + (serbestOpen() ? ' · rekor ' + save.serbestRekor + ' 💰' : ' · 🔒 10. günü bitir') + '</button>';
    } else if (sekme === 'yukselt') {
      h += '<div class="lt-liste">';
      M.YUKSELTMELER.forEach(function (u) {
        var sv = save.yukseltme[u.id], max = sv >= u.fiyat.length, f = u.fiyat[sv];
        h += '<button type="button" class="lt-satir" data-yuk="' + u.id + '"' + (max || save.para < f ? ' disabled' : '') + '><span class="lt-ikon">' + u.ikon + '</span><span>' + u.ad + ' <small>' + u.aciklama + ' · seviye ' + sv + '/' + u.fiyat.length + '</small></span><span class="lt-bedel">' + (max ? 'TAM' : f + ' 💰') + '</span></button>';
      });
      h += '</div>';
    } else if (sekme === 'lokanta') {
      h += '<label class="lt-tabela-giris">Tabela adı <input id="lt-tabela-ad" type="text" maxlength="16" autocomplete="off" translate="no"></label>';
      h += '<div class="lt-liste">';
      TEMALAR.forEach(function (t) {
        var acik = save.susleme.acik.indexOf(t.id) !== -1;
        h += '<button type="button" class="lt-satir' + (tema().id === t.id ? ' secili' : '') + '" data-tema="' + t.id + '"' + (acik ? '' : ' disabled') + '><span class="lt-ornek" data-tema="' + t.id + '"></span><span>' + t.ad + ' ' + t.onluk + ' <small>' + (acik ? (tema().id === t.id ? 'Seçili' : 'Seçmek için dokun') : t.yildiz ? '🔒 ' + t.yildiz + ' ⭐' : '🔒 ' + t.seri + ' günlük görev serisi') + '</small></span></button>';
      });
      h += '</div>';
    } else {
      var g = save.gorev;
      h += '<p>Her gün 3 yeni görev. Üçünü bitirince +' + GOREV_ODUL + ' 💰 ve seri artar; 7 günlük seri Cadılar Bayramı temasını açar.</p>';
      g.liste.forEach(function (id) {
        var m = mission(id), v = Math.min(m.hedef, g.ilerleme[id] || 0), ok = g.tamam.indexOf(id) !== -1;
        h += '<div class="lt-gorev' + (ok ? ' tamam' : '') + '">' + (ok ? '✅ ' : '⬜ ') + m.ad + ' <small>(' + v + '/' + m.hedef + ')</small></div>';
      });
    }
    haritaEl.innerHTML = h;
    haritaEl.querySelector('.lt-tabela-kucuk').textContent = '🏮 ' + save.tabela;
    var inp = document.getElementById('lt-tabela-ad');
    if (inp) inp.value = save.tabela;
  }
  function renderDailyIntro() {
    haritaEl.hidden = false;
    oyunEl.hidden = true;
    oyunEl.dataset.durum = 'harita';
    haritaEl.innerHTML = '<h2>📅 Günlük lokanta · ' + MiniOyun.gunluk.tarih + '</h2><p>Herkese aynı 20 müşteri, tüm menü ve yükseltmesiz temel lokanta. Kazancın liderlik tablosuna gider.</p>' +
      '<p>En iyi kazancın: ' + (MiniOyun.getBest('lokanta-telasi-gunluk') || '-') + ' 💰</p><button type="button" class="btn" data-gunluk-basla="1">▶ Vardiyayı başlat</button>';
  }

  haritaEl.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.sekme) { sekme = b.dataset.sekme; showMap(); return; }
    if (b.dataset.gun) { startDay(Number(b.dataset.gun)); return; }
    if (b.dataset.serbest) { startFree(); return; }
    if (b.dataset.gunlukBasla) { startDaily(); return; }
    if (b.dataset.yuk) {
      var u = M.YUKSELTMELER.filter(function (x) { return x.id === b.dataset.yuk; })[0], sv = save.yukseltme[u.id], f = u.fiyat[sv];
      if (f === undefined || save.para < f) return;
      save.para -= f;
      save.yukseltme[u.id] = sv + 1;
      store();
      MiniOyun.ses('puan');
      showMap();
      return;
    }
    if (b.dataset.tema) { save.susleme.secili = b.dataset.tema; store(); MiniOyun.ses('tik'); showMap(); }
  });
  haritaEl.addEventListener('input', function (e) {
    if (e.target.id !== 'lt-tabela-ad') return;
    var v = String(e.target.value || '').replace(/\s+/g, ' ').trim().slice(0, 16);
    save.tabela = v || 'Benim Lokantam';
    store();
    var k = haritaEl.querySelector('.lt-tabela-kucuk');
    if (k) k.textContent = '🏮 ' + save.tabela;
  });

  tezgahEl.addEventListener('click', function (e) { var b = e.target.closest('[data-yer]'); if (b) serve(Number(b.dataset.yer)); });
  ocakEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-izgara]');
    if (b) grill(Number(b.dataset.izgara));
    else if (e.target.closest('#lt-demlik')) addIngredient('cay');
  });
  rafEl.addEventListener('click', function (e) { var b = e.target.closest('[data-malz]'); if (b) addIngredient(b.dataset.malz); });
  var basili = null;
  tabakEl.addEventListener('click', function (e) {
    if (e.target.closest('[data-cop]')) { emptyPlate(); return; }
    var b = e.target.closest('[data-tabak]');
    if (b && !b.dataset.uzun) selectPlate(Number(b.dataset.tabak));
    if (b) delete b.dataset.uzun;
  });
  // Tabağa uzun basınca boşalır
  tabakEl.addEventListener('pointerdown', function (e) {
    var b = e.target.closest('[data-tabak]');
    if (!b) return;
    clearTimeout(basili);
    basili = setTimeout(function () { b.dataset.uzun = '1'; emptyPlate(Number(b.dataset.tabak)); }, 650);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { tabakEl.addEventListener(t, function () { clearTimeout(basili); }); });

  document.addEventListener('keydown', function (e) {
    if (!run || oyunEl.hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    var k = e.key.toLocaleLowerCase('tr'), i;
    if (k === 'tab') {
      e.preventDefault();
      if (run.tabaklar.length > 1) selectPlate((run.aktif + 1) % run.tabaklar.length);
      return;
    }
    if (k === 'x') { emptyPlate(); return; }
    if ((i = IZGARA_TUSLARI.indexOf(k)) !== -1) { grill(i); return; }
    if ((i = MUSTERI_TUSLARI.indexOf(k)) !== -1) { serve(i); return; }
    if ((i = RAF_TUSLARI.indexOf(k)) !== -1) {
      var b = rafEl.children[i];
      if (b) addIngredient(b.dataset.malz);
    }
  });

  // ---------- Döngü ----------
  function frame(t) {
    var dt = Math.min(0.05, Math.max(0, (t - last) / 1000));
    last = t;
    if (run && !run.bitti && !oyunEl.hidden && !paused && !MiniOyun.duraklatildi()) {
      update(dt);
      render();
    }
    requestAnimationFrame(frame);
  }

  function restart() {
    if (daily || run && run.mod === 'gunluk') startDaily();
    else if (run && run.mod === 'serbest') startFree();
    else startDay(gunNo);
  }
  MiniOyun.oyun({
    restart: restart,
    pause: function () { paused = true; },
    resume: function () { paused = false; },
    canPause: function () { return !!run && !run.bitti && !oyunEl.hidden; },
    seviye: function () { return daily || run && run.mod === 'gunluk' ? 'günlük' : run && run.mod === 'serbest' ? 'serbest' : 'gün ' + gunNo; }
  });

  showMap();
  requestAnimationFrame(function (t) { last = t; frame(t); });
})();

(function () {
  // Meyve Patlat: yan yana iki meyveyi değiştir, 3+ aynı meyveyi diz ve patlat.
  // 60 bölümlük harita (4 dünya, hedefler, hamle sınırı, 1-3 yıldız), kalıcı güçlendiriciler (çekiç, karıştır, +5 hamle),
  // tohumlu günlük görevler ve seri, yıldız/seriyle açılan meyve temaları, 25 hamlelik serbest mod ve günlük modda (?gunluk=)
  // herkese aynı tahta ile düşen meyve dizisi. Kayıt: mo_meyve.
  var KEY = 'mo_meyve';
  var M = window.MeyvePatlatMotor;
  var N = M.N, NN = N * N, BOLUM_SAYI = M.BOLUM_SAYI, SERBEST_HAMLE = 25, GUC_UST = 9;
  var TEMALAR = {
    meyve: { ad: 'Meyveler', ikon: '🍓', set: ['🍎', '🍊', '🍋', '🍇', '🍓', '🍉'], kosul: '' },
    seker: { ad: 'Şeker', ikon: '🍬', set: ['🍬', '🍭', '🍫', '🧁', '🍩', '🍪'], yildiz: 30 },
    mucevher: { ad: 'Mücevher', ikon: '💎', set: ['💎', '🔷', '🔶', '🟣', '🟢', '🔴'], yildiz: 80 },
    urkunc: { ad: 'Ürkünç', ikon: '🎃', set: ['🎃', '👻', '🦇', '🕸️', '🍬', '🕯️'], seri: 7 }
  };
  var ALTIN_YILDIZ = BOLUM_SAYI * 3;
  var GUCLER = { cekic: { ad: 'Çekiç', ikon: '🔨' }, karistir: { ad: 'Karıştır', ikon: '🔀' }, hamle5: { ad: '+5 Hamle', ikon: '➕' } };
  var GOREVLER = [
    { id: 'roket', metin: '{n} roket oluştur', min: 5, max: 8 },
    { id: 'bomba', metin: '{n} bomba oluştur', min: 3, max: 5 },
    { id: 'gokkusagi', metin: '{n} gökkuşağı oluştur', min: 1, max: 2 },
    { id: 'yildizli', metin: '{n} bölümü yıldızla bitir', min: 2, max: 3 },
    { id: 'meyve', metin: '{n} {e} patlat', min: 6, max: 12, kat: 10 },
    { id: 'kaskad', metin: '{n} kez x3 zincirleme yap', min: 3, max: 5 },
    { id: 'puan', metin: 'Toplam {n} puan topla', min: 16, max: 30, kat: 500 }
  ];

  var ustEl = document.getElementById('ust');
  var oyunEl = document.getElementById('oyun');
  var haritaEl = document.getElementById('harita');
  var tahtaEl = document.getElementById('tahta');
  var hedefEl = document.getElementById('hedefler');
  var cubukEl = document.getElementById('cubuk');
  var uyariEl = document.getElementById('uyari');
  var gucEl = document.getElementById('guclar');
  var bolumEl = document.getElementById('bolum');
  var puanEl = document.getElementById('puan');
  var hamleEl = document.getElementById('hamle');
  var rekorEl = document.getElementById('rekor');

  var daily = !!(MiniOyun.gunluk && MiniOyun.gunluk.tarih);
  var save = load();
  var run = null, secili = -1, imlec = 0, klavye = false, basla0 = null, haritaDunya = null, uyariT = null, ipucuT = null;

  // ---------- Kayıt ----------
  function sayi(v, d) { v = Number(v); return isFinite(v) && v >= 0 ? Math.floor(v) : d; }
  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
    if (!s || typeof s !== 'object' || Array.isArray(s)) s = {};
    var b = {};
    if (s.bolumler && typeof s.bolumler === 'object') {
      for (var k in s.bolumler) {
        var no = Number(k), x = s.bolumler[k];
        if (no >= 1 && no <= BOLUM_SAYI && x && typeof x === 'object' && sayi(x.yildiz, 0) > 0) b[no] = { yildiz: Math.min(3, sayi(x.yildiz, 1)), enIyi: sayi(x.enIyi, 0) };
      }
    }
    var g = s.guc && typeof s.guc === 'object' ? s.guc : {};
    var gr = s.gorev && typeof s.gorev === 'object' && Array.isArray(s.gorev.liste) ? s.gorev : null;
    var acik = Array.isArray(s.acikTemalar) ? s.acikTemalar.filter(function (t) { return TEMALAR[t]; }) : [];
    if (acik.indexOf('meyve') === -1) acik.unshift('meyve');
    return {
      v: 1,
      bolumler: b,
      guc: { cekic: Math.min(GUC_UST, sayi(g.cekic, 1)), karistir: Math.min(GUC_UST, sayi(g.karistir, 1)), hamle5: Math.min(GUC_UST, sayi(g.hamle5, 1)) },
      tema: TEMALAR[s.tema] && acik.indexOf(s.tema) !== -1 ? s.tema : 'meyve',
      acikTemalar: acik,
      gorev: gr ? { gun: String(gr.gun || ''), liste: gr.liste.filter(function (x) { return x && typeof x === 'object' && x.id; }), tamam: !!gr.tamam } : { gun: '', liste: [], tamam: false },
      seri: sayi(s.seri, 0),
      sonGun: typeof s.sonGun === 'string' ? s.sonGun : ''
    };
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} }

  function yildizYazi(y) { return '⭐'.repeat(y) + '☆'.repeat(3 - y); }
  function yildizOf(no) { return save.bolumler[no] ? save.bolumler[no].yildiz : 0; }
  function dunyaYildiz(w) { var n = 0; for (var i = w * 15 + 1; i <= w * 15 + 15; i++) n += yildizOf(i); return n; }
  function toplamYildiz() { var n = 0; for (var k in save.bolumler) n += save.bolumler[k].yildiz; return n; }
  function dunyaAcik(w) { return w === 0 || (yildizOf(w * 15) > 0 && toplamYildiz() >= M.DUNYALAR[w].yildiz); }
  function bolumAcik(no) {
    if (no < 1 || no > BOLUM_SAYI || !dunyaAcik(M.dunyaOf(no))) return false;
    return no % 15 === 1 || yildizOf(no - 1) > 0;
  }
  // Şartı sağlanan temaları açar, yeni açılanların adlarını döner
  function temaKontrol() {
    var yeni = [], t = toplamYildiz();
    for (var id in TEMALAR) {
      var tm = TEMALAR[id], ok = tm.yildiz ? t >= tm.yildiz : tm.seri ? save.seri >= tm.seri : true;
      if (ok && save.acikTemalar.indexOf(id) === -1) { save.acikTemalar.push(id); yeni.push(tm.ad); }
    }
    return yeni;
  }
  function emoji(t) { return t === M.CEVIZ ? '🌰' : t === M.RENKSIZ ? '🌈' : t >= 0 ? TEMALAR[save.tema].set[t] : ''; }
  function gucVer(tur, n) { save.guc[tur] = Math.min(GUC_UST, save.guc[tur] + n); }
  function rastgeleGuc(rnd) {
    var l = Object.keys(GUCLER), t = l[Math.floor(rnd() * l.length)];
    gucVer(t, 1);
    return GUCLER[t].ikon + ' ' + GUCLER[t].ad;
  }

  function uyar(t, kalici) {
    uyariEl.textContent = t;
    clearTimeout(uyariT);
    if (!kalici) uyariT = setTimeout(function () { uyariEl.textContent = ''; }, 3000);
  }

  // ---------- Günlük görevler ----------
  function gunKaydir(gun, d) {
    var p = gun.split('-').map(Number), t = new Date(p[0], p[1] - 1, p[2] + d);
    return t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2);
  }
  function gorevYenile() {
    var bugun = MiniOyun.gunluk.bugun();
    if (save.gorev.gun === bugun && save.gorev.liste.length === 3) return;
    var rnd = MiniOyun.gunluk.rastgele('meyve-patlat/gorev/' + bugun), havuz = GOREVLER.slice(), liste = [];
    for (var i = 0; i < 3; i++) {
      var g = havuz.splice(Math.floor(rnd() * havuz.length), 1)[0];
      var n = (g.min + Math.floor(rnd() * (g.max - g.min + 1))) * (g.kat || 1);
      liste.push({ id: g.id, n: n, i: 0, t: g.id === 'meyve' ? Math.floor(rnd() * 5) : 0 });
    }
    save.gorev = { gun: bugun, liste: liste, tamam: false };
    persist();
  }
  function gorevMetin(g) {
    var d = GOREVLER.filter(function (x) { return x.id === g.id; })[0];
    return d ? d.metin.replace('{n}', g.n).replace('{e}', TEMALAR[save.tema].set[g.t]) : g.id;
  }
  // Hamle sonucuna göre görev ilerlemesi; hepsi bitince ödül ve seri
  function gorevIlerle(s, yildizli) {
    if (daily) return;
    gorevYenile();
    var gr = save.gorev, degisti = false;
    gr.liste.forEach(function (g) {
      var once = g.i, ek = 0;
      if (s) {
        if (g.id === 'roket') ek = s.olusan.roket;
        else if (g.id === 'bomba') ek = s.olusan.bomba;
        else if (g.id === 'gokkusagi') ek = s.olusan.gokkusagi;
        else if (g.id === 'meyve') ek = s.toplanan[g.t];
        else if (g.id === 'kaskad') ek = s.kaskad >= 3 ? 1 : 0;
        else if (g.id === 'puan') ek = s.puan;
      }
      if (yildizli && g.id === 'yildizli') ek = 1;
      g.i = Math.min(g.n, g.i + ek);
      if (g.i !== once) degisti = true;
    });
    if (!gr.tamam && gr.liste.length && gr.liste.every(function (g) { return g.i >= g.n; })) {
      gr.tamam = true;
      save.seri = save.sonGun === gunKaydir(gr.gun, -1) ? save.seri + 1 : 1;
      save.sonGun = gr.gun;
      var odul = rastgeleGuc(MiniOyun.gunluk.rastgele('meyve-patlat/odul/' + gr.gun)), yeni = temaKontrol();
      uyar('✅ Günlük görevler tamam! ' + odul + ' kazandın · 🔥 ' + save.seri + ' gün seri' + (yeni.length ? ' · 🎨 ' + yeni.join(', ') + ' teması açıldı' : ''));
      MiniOyun.ses('kazan');
      degisti = true;
    }
    if (degisti) persist();
  }

  // ---------- Oyun kurma ----------
  // mod: 'bolum' (no), 'serbest', 'gunluk'
  function basla(mod, no) {
    var rnd = MiniOyun.rastgele(), L, b;
    if (mod === 'bolum') {
      L = M.ayar(no);
      b = M.bolumTahta(L, rnd);
    } else {
      L = { no: 0, dunya: 0, hedef: {}, hamle: SERBEST_HAMLE, tur: 6 };
      b = M.duzTahta(rnd, 6);
    }
    run = { mod: mod, L: L, b: b, rnd: rnd, il: M.yeniIlerleme(), hamle: 0, limit: L.hamle, bitti: false, mesgul: false, cekicModu: false };
    secili = -1;
    imlec = 0;
    haritaEl.hidden = true;
    oyunEl.hidden = false;
    ustEl.hidden = false;
    oyunEl.className = 'mp-oyun dunya-' + L.dunya + (toplamYildiz() >= ALTIN_YILDIZ ? ' altin' : '');
    if (mod === 'bolum') {
      var d = M.DUNYALAR[L.dunya], not = [d.ikon + ' ' + d.ad + ' · Bölüm ' + L.no];
      if (L.no === 1) not.push('İki meyveyi kaydırarak yer değiştir, 3 aynı meyveyi diz');
      if (L.no === 6) not.push('4\'lü dizi 🚀 roket, L/T şekli 💣 bomba, 5\'li dizi 🌈 gökkuşağı yapar');
      if (L.no === 16) not.push('Yeni: 🧊 buzun üstündeki meyveyi patlat, buz kırılır');
      if (L.no === 31) not.push('Yeni: 📦 kutunun yanında eşleşme yap, kutu kırılır');
      if (L.no === 33) not.push('Yeni: ⛓️ zincirli meyve yer değiştiremez; yanında patlat');
      if (L.no === 34) not.push('Yeni: 🌰 cevizi en alt satıra indir; altındaki meyveyle de değiştirebilirsin');
      uyar(not.join(' · '), true);
    } else if (mod === 'gunluk') {
      uyar('📅 Günlük meydan okuma · ' + MiniOyun.gunluk.tarih + ' · herkese aynı tahta, ' + SERBEST_HAMLE + ' hamlede en yüksek puan', true);
    } else {
      uyar('♾️ Serbest mod · ' + SERBEST_HAMLE + ' hamlede en yüksek puanı yap', true);
    }
    ciz();
    ipucuKur();
    if (gucEl.scrollIntoView) gucEl.scrollIntoView({ block: 'nearest' });
    if (tahtaEl.scrollIntoView) tahtaEl.scrollIntoView({ block: 'nearest' });
  }
  function seviye() {
    if (!run) return '';
    if (run.mod === 'gunluk') return 'gunluk';
    if (run.mod === 'serbest') return 'serbest';
    return 'bölüm ' + run.L.no;
  }
  function kalanHamle() { return Math.max(0, run.limit - run.hamle); }

  // ---------- Çizim ----------
  function hucreHtml(b, i, ek) {
    var cls = 'mp-h', ic = '', t = b.t[i];
    if (b.yok[i]) return '<div class="mp-h yok" data-i="' + i + '"></div>';
    if ((Math.floor(i / N) + i) % 2) cls += ' koyu';
    if (b.buz[i]) cls += ' buz buz' + b.buz[i];
    if (b.kutu[i]) { cls += ' kutu'; ic = '📦<small>' + b.kutu[i] + '</small>'; }
    else if (t >= 0) {
      ic = '<span>' + emoji(t) + '</span>';
      var s = b.s[i];
      if (s === M.ROKET_Y) { cls += ' roket'; ic += '<b class="oz">⇆</b>'; }
      else if (s === M.ROKET_D) { cls += ' roket'; ic += '<b class="oz">⇅</b>'; }
      else if (s === M.BOMBA) { cls += ' bomba'; ic += '<b class="oz">💣</b>'; }
      else if (s === M.GOKKUSAGI) cls += ' gok';
      if (t === M.CEVIZ) cls += ' ceviz';
    }
    if (b.zin[i]) { cls += ' zin'; ic += '<b class="zn">⛓️</b>'; }
    if (ek) cls += ek;
    return '<div class="' + cls + '" data-i="' + i + '" data-t="' + t + '" data-s="' + b.s[i] + '"' +
      (b.buz[i] ? ' data-buz="' + b.buz[i] + '"' : '') + (b.kutu[i] ? ' data-kutu="' + b.kutu[i] + '"' : '') + (b.zin[i] ? ' data-zin="1"' : '') + '>' + ic + '</div>';
  }
  function tahtaCiz(b, isaret) {
    var h = '';
    for (var i = 0; i < NN; i++) {
      var ek = '';
      if (isaret && isaret[i]) ek += isaret[i];
      if (i === secili) ek += ' secili';
      if (klavye && i === imlec && !run.bitti) ek += ' imlec';
      h += hucreHtml(b, i, ek);
    }
    tahtaEl.innerHTML = h;
    tahtaEl.classList.toggle('cekic-modu', !!run.cekicModu);
  }
  function ciz() {
    tahtaCiz(run.b);
    hud();
  }
  function hedefKartlari() {
    var g = run.L.hedef, il = run.il, b = run.b, l = [];
    if (g.meyve) l.push(['meyve', emoji(g.meyve[0]), Math.max(0, g.meyve[1] - il.toplanan[g.meyve[0]])]);
    if (g.buz) l.push(['buz', '🧊', M.kalanBuz(b)]);
    if (g.kutu) l.push(['kutu', '📦', M.kalanKutu(b)]);
    if (g.ceviz) l.push(['ceviz', '🌰', Math.max(0, g.ceviz - il.ceviz)]);
    if (g.puan) l.push(['puan', '🎯', Math.max(0, g.puan - il.puan)]);
    return l;
  }
  function hud() {
    if (!run) return;
    var L = run.L;
    puanEl.textContent = run.il.puan;
    puanEl.setAttribute('data-puan', run.il.puan);
    var k = kalanHamle();
    hamleEl.textContent = k;
    hamleEl.setAttribute('data-kalan', k);
    hamleEl.parentNode.classList.toggle('az', k <= 5);
    hamleEl.setAttribute('data-hamle', run.hamle);
    if (run.mod === 'bolum') {
      bolumEl.textContent = L.no;
      var en = save.bolumler[L.no] ? save.bolumler[L.no].enIyi : 0;
      rekorEl.textContent = en || '-';
      hedefEl.innerHTML = hedefKartlari().map(function (h) {
        return '<span class="mp-hedef' + (h[2] ? '' : ' tamam') + '" data-hedef="' + h[0] + '" data-kalan="' + h[2] + '">' + h[1] + ' <b>' + (h[2] ? h[2] : '✓') + '</b></span>';
      }).join('');
      // Puan çubuğu: 2 ve 3 yıldız eşikleri işaretli
      var ust = Math.round(L.y3 * 1.15);
      cubukEl.hidden = false;
      cubukEl.innerHTML = '<i style="width:' + Math.min(100, run.il.puan / ust * 100) + '%"></i>' +
        '<em style="left:' + (L.y2 / ust * 100) + '%">⭐</em><em style="left:' + (L.y3 / ust * 100) + '%">⭐</em>';
    } else {
      bolumEl.textContent = run.mod === 'gunluk' ? '📅' : '♾️';
      rekorEl.textContent = MiniOyun.getBest(run.mod === 'gunluk' ? 'meyve-patlat-gunluk' : 'meyve-patlat') || '-';
      hedefEl.innerHTML = '<span class="mp-hedef">' + (run.mod === 'gunluk' ? '📅 Günlük: ' : '♾️ Serbest: ') + SERBEST_HAMLE + ' hamlede en yüksek puan</span>';
      cubukEl.hidden = true;
    }
    var bolum = run.mod === 'bolum';
    gucEl.hidden = !bolum;
    if (bolum) {
      var h = '';
      for (var t in GUCLER) {
        var n = save.guc[t], aktif = t === 'cekic' && run.cekicModu;
        h += '<button type="button" class="btn btn-ghost mp-guc' + (aktif ? ' aktif' : '') + '" data-guc="' + t + '" data-adet="' + n + '"' + (n || aktif ? '' : ' disabled') +
          ' title="' + GUCLER[t].ad + '">' + (aktif ? '✖' : GUCLER[t].ikon) + ' ' + (t === 'hamle5' ? '+5' : GUCLER[t].ad) + ' <small>' + n + '</small></button>';
      }
      h += '<button type="button" class="btn btn-ghost mp-guc" data-guc="ipucu" title="İpucu (H)">💡</button>';
      gucEl.innerHTML = h;
    }
  }

  // ---------- Oynanış ----------
  function bekle(ms, f) { setTimeout(f, ms); }
  function oynayabilir() { return run && !run.bitti && !run.mesgul && !MiniOyun.duraklatildi(); }
  function degistir(a, c) {
    if (!oynayabilir()) return false;
    secili = -1;
    ipucuKur();
    if (!M.komsu(a, c)) return false;
    if (!M.gecerliMi(run.b, a, c)) {
      // Geçersiz: meyveler sallanıp yerinde kalır, hamle düşmez
      var is = {};
      is[a] = ' gecersiz';
      is[c] = ' gecersiz';
      tahtaCiz(run.b, is);
      tahtaEl.setAttribute('data-son', 'gecersiz');
      MiniOyun.ses('tik');
      bekle(260, function () { if (run && !run.mesgul) tahtaCiz(run.b); });
      return false;
    }
    var once = M.kopya(run.b);
    var s = M.hamle(run.b, a, c, run.rnd);
    run.hamle++;
    // Yer değiştirmiş hali göster, sonra adımları oynat
    var gor = M.kopya(once);
    if (!(once.s[a] && once.s[c]) && once.s[a] !== M.GOKKUSAGI && once.s[c] !== M.GOKKUSAGI) {
      var tt = gor.t[a], ss = gor.s[a];
      gor.t[a] = gor.t[c]; gor.s[a] = gor.s[c]; gor.t[c] = tt; gor.s[c] = ss;
    }
    sonucOynat(s, gor, function () { hamleBitti(s); });
    return true;
  }
  // Patlama adımlarını sırayla canlandırır; bitince run.b çizilir
  function sonucOynat(s, gor, bitince) {
    run.mesgul = true;
    tahtaEl.setAttribute('data-mesgul', '1');
    tahtaCiz(gor);
    var adimlar = s.adimlar, k = 0;
    function sonraki() {
      if (k >= adimlar.length) {
        run.mesgul = false;
        tahtaEl.removeAttribute('data-mesgul');
        if (s.karisti) uyar('🔀 Hamle kalmadı, tahta karıştırıldı');
        ciz();
        bitince();
        return;
      }
      var a = adimlar[k], is = {};
      a.temiz.forEach(function (i) { is[i] = ' patla'; });
      tahtaCiz(k ? adimlar[k - 1].tahta : gor, is);
      MiniOyun.ses(a.k >= 2 || (a.ozel && a.ozel.length) ? 'puan' : 'tik');
      if (a.k >= 2) parlat('x' + a.k + '!');
      bekle(200, function () {
        var is2 = {};
        a.yeni.forEach(function (i) { is2[i] = ' yeni'; });
        if (a.ozel) a.ozel.forEach(function (i) { is2[i] = ' parla'; });
        tahtaCiz(a.tahta, is2);
        k++;
        bekle(170, sonraki);
      });
    }
    bekle(adimlar.length ? 120 : 0, sonraki);
  }
  function parlat(t) {
    var el = document.getElementById('yazi');
    el.textContent = t;
    el.classList.remove('goster');
    void el.offsetWidth;
    el.classList.add('goster');
  }
  function hamleBitti(s) {
    M.ilerlemeEkle(run.il, s);
    gorevIlerle(s, false);
    tahtaEl.setAttribute('data-son', 'hamle-' + run.hamle);
    hud();
    sonKontrol();
  }
  function sonKontrol() {
    if (run.bitti) return;
    if (run.mod === 'bolum') {
      if (M.hedefTamam(run.L, run.b, run.il)) return bonusVeKazan();
      if (run.hamle >= run.limit) return kaybet();
    } else if (run.hamle >= run.limit) serbestBitti();
  }
  function bonusVeKazan() {
    run.bitti = true;
    var kalan = kalanHamle();
    if (!kalan) return kazan(0);
    var once = M.kopya(run.b), s = M.bonus(run.b, kalan, run.rnd);
    parlat('Bonus! +' + s.puan);
    MiniOyun.ses('puan');
    run.il.puan += s.puan;
    sonucOynat({ adimlar: s.adimlar.slice(0, 6), karisti: false }, once, function () { kazan(s.puan); });
  }

  function kazan(bonusPuan) {
    run.bitti = true;
    var L = run.L, puan = run.il.puan, w = L.dunya, notlar = [];
    var y = puan >= L.y3 ? 3 : puan >= L.y2 ? 2 : 1;
    var onceki = save.bolumler[L.no] || { yildiz: 0, enIyi: 0 };
    var acikOnce = w < 3 && dunyaAcik(w + 1);
    var rec = puan > onceki.enIyi;
    save.bolumler[L.no] = { yildiz: Math.max(onceki.yildiz, y), enIyi: Math.max(onceki.enIyi, puan) };
    if (y === 3 && onceki.yildiz < 3) notlar.push('🎁 ' + rastgeleGuc(run.rnd));
    if (L.no % 15 === 0 && !onceki.yildiz) {
      for (var t in GUCLER) gucVer(t, 2);
      notlar.push('🎁 Dünya sonu: her güçlendiriciden +2');
    }
    temaKontrol().forEach(function (ad) { notlar.push('🎨 ' + ad + ' teması açıldı'); });
    if (w < 3 && !acikOnce && dunyaAcik(w + 1)) notlar.push(M.DUNYALAR[w + 1].ikon + ' ' + M.DUNYALAR[w + 1].ad + ' açıldı');
    if (toplamYildiz() >= ALTIN_YILDIZ && onceki.yildiz < 3) notlar.push('🌟 Altın çerçeve rozeti!');
    persist();
    gorevIlerle(null, true);
    hud();
    MiniOyun.bitti({
      baslik: 'Bölüm ' + L.no + ' tamam!',
      metin: yildizYazi(y) + ' · ' + puan + ' puan' + (bonusPuan ? ' (bonus +' + bonusPuan + ')' : '') + (notlar.length ? ' · ' + notlar.join(' · ') : ''),
      rekor: rec && onceki.enIyi > 0,
      sonuc: puan + ' puan',
      skor: puan,
      seviye: 'bölüm ' + L.no,
      paylas: 'Meyve Patlat ' + L.no + '. bölümü ' + yildizYazi(y) + ' ile bitirdim!'
    });
    var sonraki = L.no < BOLUM_SAYI && bolumAcik(L.no + 1) ? L.no + 1 : 0, not = '';
    if (!sonraki && L.no % 15 === 0 && L.no < BOLUM_SAYI) not = M.DUNYALAR[w + 1].ad + ' için toplam ' + M.DUNYALAR[w + 1].yildiz + ' ⭐ gerekli (şu an ' + toplamYildiz() + ')';
    sonuDugmeleri(sonraki, not, false);
  }
  function kaybet() {
    run.bitti = true;
    hud();
    MiniOyun.bitti({
      baslik: 'Bölüm ' + run.L.no + ' olmadı',
      metin: 'Hamlelerin bitti. Kalan hedef: ' + hedefKartlari().filter(function (h) { return h[2]; }).map(function (h) { return h[1] + ' ' + h[2]; }).join(' · ') + '. Tekrar dene!',
      kaybetti: true,
      sonuc: 'kaybedildi'
    });
    sonuDugmeleri(0, '', save.guc.hamle5 > 0);
  }
  function serbestBitti() {
    run.bitti = true;
    var puan = run.il.puan, rec;
    if (run.mod === 'gunluk') {
      rec = MiniOyun.setBest('meyve-patlat-gunluk', puan);
      MiniOyun.setBest('meyve-patlat', puan);
    } else rec = MiniOyun.setBest('meyve-patlat', puan);
    hud();
    MiniOyun.bitti({
      baslik: run.mod === 'gunluk' ? 'Günlük meydan okuma bitti!' : 'Hamleler bitti!',
      metin: SERBEST_HAMLE + ' hamlede ' + puan + ' puan',
      rekor: rec,
      kaybetti: !rec,
      sonuc: puan + ' puan',
      skor: puan,
      paylas: 'Meyve Patlat' + (run.mod === 'gunluk' ? ' günlük meydan okumasında ' : '\'ta ') + puan + ' puan yaptım! Sen kaç yaparsın?'
    });
    sonuDugmeleri(0, '', false);
  }
  // Oyun sonu penceresine "Sonraki bölüm" ve "+5 hamle ile devam" düğmeleri
  function sonuDugmeleri(no, not, devam) {
    var dlg = document.querySelector('.oyun-sonu');
    if (!dlg) return;
    var eylem = dlg.querySelector('.oyun-dlg-actions');
    var b = dlg.querySelector('#mp-sonraki');
    if (!b) {
      b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.id = 'mp-sonraki';
      b.textContent = 'Sonraki bölüm ▶';
      b.addEventListener('click', function () { dlg.close(); basla('bolum', Number(b.dataset.no)); });
      eylem.prepend(b);
    }
    b.hidden = !no;
    b.dataset.no = no || '';
    var d = dlg.querySelector('#mp-devam');
    if (!d) {
      d = document.createElement('button');
      d.type = 'button';
      d.className = 'btn';
      d.id = 'mp-devam';
      d.addEventListener('click', function () { dlg.close(); ekHamle(true); });
      eylem.prepend(d);
    }
    d.hidden = !devam;
    d.textContent = '➕5 hamle ile devam (' + save.guc.hamle5 + ')';
    var p = dlg.querySelector('.mp-sonu-not');
    if (!p) { p = document.createElement('p'); p.className = 'mp-sonu-not'; eylem.insertAdjacentElement('beforebegin', p); }
    p.textContent = not;
    p.hidden = !not;
  }

  // ---------- Güçlendiriciler ----------
  function ekHamle(devam) {
    if (!run || run.mod !== 'bolum' || !save.guc.hamle5 || run.mesgul) return;
    if (run.bitti && !devam) return;
    save.guc.hamle5--;
    persist();
    run.limit += 5;
    run.bitti = false;
    MiniOyun.ses('puan');
    uyar('➕ 5 hamle eklendi');
    ciz();
  }
  function karistir() {
    if (!oynayabilir() || run.mod !== 'bolum' || !save.guc.karistir) return;
    save.guc.karistir--;
    persist();
    M.karistir(run.b, run.rnd);
    MiniOyun.ses('puan');
    uyar('🔀 Tahta karıştırıldı');
    ciz();
  }
  function cekicModu() {
    if (!oynayabilir() || run.mod !== 'bolum') return;
    if (!run.cekicModu && !save.guc.cekic) return;
    run.cekicModu = !run.cekicModu;
    secili = -1;
    uyar(run.cekicModu ? '🔨 Kırmak istediğin meyveye, kutuya veya zincire dokun' : '');
    ciz();
  }
  function cekicVur(i) {
    var once = M.kopya(run.b), s = M.cekic(run.b, i, run.rnd);
    if (!s.gecerli) { uyar('Çekiç buraya vuramaz'); return; }
    run.cekicModu = false;
    save.guc.cekic--;
    persist();
    MiniOyun.ses('puan');
    sonucOynat(s, once, function () {
      M.ilerlemeEkle(run.il, s);
      gorevIlerle(s, false);
      hud();
      sonKontrol();
    });
  }
  function ipucu(goster) {
    clearTimeout(ipucuT);
    if (!run || run.bitti || run.mesgul) return;
    var h = M.enIyi(run.b, run.mod === 'bolum' ? run.L : null, run.il);
    if (!h || !goster) return;
    var a = tahtaEl.querySelector('[data-i="' + h.a + '"]'), c = tahtaEl.querySelector('[data-i="' + h.c + '"]');
    if (a) a.classList.add('ipucu');
    if (c) c.classList.add('ipucu');
    tahtaEl.setAttribute('data-ipucu', h.a + ',' + h.c);
  }
  // 5 saniye hareketsiz kalınca geçerli bir hamle titrer
  function ipucuKur() {
    clearTimeout(ipucuT);
    tahtaEl.removeAttribute('data-ipucu');
    var eski = tahtaEl.querySelectorAll('.ipucu');
    for (var i = 0; i < eski.length; i++) eski[i].classList.remove('ipucu');
    ipucuT = setTimeout(function () { if (oynayabilir()) ipucu(true); else ipucuKur(); }, 5000);
  }
  function bastan() {
    if (!run) return;
    basla(run.mod, run.L.no);
  }

  // ---------- Harita ----------
  function haritaGoster() {
    if (run && run.bitti) run = null;
    secili = -1;
    clearTimeout(ipucuT);
    oyunEl.hidden = true;
    ustEl.hidden = true;
    haritaEl.hidden = false;
    gorevYenile();
    if (temaKontrol().length) persist();
    if (haritaDunya === null) {
      haritaDunya = 0;
      for (var w = 0; w < M.DUNYALAR.length; w++) if (dunyaAcik(w)) haritaDunya = w;
    }
    var ty = toplamYildiz();
    var h = '<div class="mp-ozet"><span id="h-yildiz">⭐ ' + ty + ' / ' + ALTIN_YILDIZ + '</span>' +
      '<span id="h-guc">🔨 ' + save.guc.cekic + ' · 🔀 ' + save.guc.karistir + ' · ➕ ' + save.guc.hamle5 + '</span>' +
      '<span id="h-seri">🔥 ' + save.seri + ' gün</span>' + (ty >= ALTIN_YILDIZ ? '<span class="mp-altin">🌟 Altın çerçeve</span>' : '') + '</div>';
    h += '<h2>✅ Günlük görevler <small>' + save.gorev.gun.split('-').reverse().join('.') + '</small></h2><ul class="mp-gorevler" id="gorevler">';
    save.gorev.liste.forEach(function (g) {
      h += '<li class="' + (g.i >= g.n ? 'tamam' : '') + '" data-gorev="' + g.id + '"><span>' + (g.i >= g.n ? '✅' : '▫️') + ' ' + gorevMetin(g) + '</span><b>' + g.i + '/' + g.n + '</b></li>';
    });
    h += '</ul><p>' + (save.gorev.tamam ? 'Bugünün ödülü alındı. Yarın yeni görevler gelir.' : 'Üçünü de bitir: 1 güçlendirici ve seri. 7 günlük seri 🎃 Ürkünç temasını açar.') + '</p>';
    h += '<h2>♾️ Serbest oyun <small>' + SERBEST_HAMLE + ' hamle, en yüksek puan</small></h2><div class="mp-ekstra">';
    var en = MiniOyun.getBest('meyve-patlat');
    h += '<button type="button" class="btn" data-serbest="1">Serbest oyna' + (en ? ' <small>🏆 ' + en + '</small>' : '') + '</button>';
    h += '<a class="btn btn-ghost" href="?gunluk=' + MiniOyun.gunluk.bugun() + '">📅 Günlük meydan okuma</a></div>';
    h += '<h2>🗺️ Harita</h2><div class="mp-dunyalar">';
    M.DUNYALAR.forEach(function (d, w) {
      var acik = dunyaAcik(w);
      h += '<button type="button" class="mp-dunya d' + w + (w === haritaDunya ? ' secili' : '') + (acik ? '' : ' kilitli') + '" data-dunya="' + w + '">' + (acik ? d.ikon : '🔒') + ' ' + d.ad + '</button>';
    });
    h += '</div>';
    var d = M.DUNYALAR[haritaDunya];
    h += '<h2>' + d.ikon + ' ' + d.ad + ' <small>⭐ ' + dunyaYildiz(haritaDunya) + ' / 45</small></h2>';
    if (!dunyaAcik(haritaDunya)) {
      var onc = M.DUNYALAR[haritaDunya - 1];
      h += '<p>🔒 Açmak için ' + onc.ad + ' dünyasının son bölümünü bitir ve toplam ' + d.yildiz + ' ⭐ topla (şu an ' + ty + ').</p>';
    }
    h += '<div class="mp-bolumler mp-d' + haritaDunya + '">';
    for (var i = haritaDunya * 15 + 1; i <= haritaDunya * 15 + 15; i++) {
      var y = yildizOf(i), acikB = bolumAcik(i), L = M.ayar(i), g = L.hedef;
      var ikon = g.ceviz ? '🌰' : g.kutu ? '📦' : g.buz ? '🧊' : g.meyve ? emoji(g.meyve[0]) : '🎯';
      h += '<button type="button" class="mp-bolum' + (acikB ? '' : ' kilitli') + (i % 15 === 0 ? ' son' : '') + '" data-bolum="' + i + '"' + (acikB ? '' : ' disabled') + ' aria-label="Bölüm ' + i + (acikB ? ', ' + y + ' yıldız' : ', kilitli') + '">' +
        '<b>' + i + '</b><em>' + (acikB ? ikon : '') + '</em><span>' + (acikB ? (y ? '⭐'.repeat(y) : '·') : '🔒') + '</span></button>';
    }
    h += '</div>';
    h += '<h2>🎨 Meyve temaları</h2><div class="mp-temalar">';
    for (var t in TEMALAR) {
      var tm = TEMALAR[t], acikT = save.acikTemalar.indexOf(t) !== -1;
      var kosul = tm.yildiz ? tm.yildiz + ' ⭐' : tm.seri ? tm.seri + ' gün seri' : '';
      h += '<button type="button" class="mp-tema' + (save.tema === t ? ' secili' : '') + (acikT ? '' : ' kilitli') + '" data-tema="' + t + '"' + (acikT ? '' : ' disabled') + '>' +
        (acikT ? tm.set.slice(0, 3).join('') : '🔒') + ' ' + tm.ad + (acikT ? '' : ' <small>(' + kosul + ')</small>') + '</button>';
    }
    h += '</div>';
    if (ty < ALTIN_YILDIZ) h += '<p>🌟 Tüm ' + ALTIN_YILDIZ + ' yıldızı topla, altın çerçeve rozetini kazan.</p>';
    haritaEl.innerHTML = h;
  }

  haritaEl.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.hasAttribute('data-dunya')) {
      haritaDunya = Number(b.getAttribute('data-dunya'));
      haritaGoster();
    } else if (b.hasAttribute('data-bolum')) {
      var no = Number(b.getAttribute('data-bolum'));
      if (run && run.mod === 'bolum' && run.L.no === no && !run.bitti) {
        haritaEl.hidden = true; oyunEl.hidden = false; ustEl.hidden = false; ciz();
      } else basla('bolum', no);
    } else if (b.hasAttribute('data-serbest')) {
      basla('serbest');
    } else if (b.hasAttribute('data-tema')) {
      save.tema = b.getAttribute('data-tema');
      persist();
      haritaGoster();
    }
  });
  document.getElementById('harita-btn').addEventListener('click', function () {
    if (daily) { location.href = location.pathname; return; }
    haritaGoster();
  });
  gucEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-guc]');
    if (!b || b.disabled) return;
    var g = b.getAttribute('data-guc');
    if (g === 'cekic') cekicModu();
    else if (g === 'karistir') karistir();
    else if (g === 'hamle5') ekHamle(false);
    else if (g === 'ipucu') ipucu(true);
  });

  // ---------- Dokunma, fare ----------
  // Kaydırma (20 px eşik) komşuyla değiştirir; dokunup bırakmak seçer, ardından komşuya dokunmak değiştirir
  tahtaEl.addEventListener('pointerdown', function (e) {
    var h = e.target.closest('.mp-h');
    if (!h || !oynayabilir()) return;
    e.preventDefault();
    klavye = false;
    basla0 = { i: Number(h.getAttribute('data-i')), x: e.clientX, y: e.clientY };
    try { tahtaEl.setPointerCapture(e.pointerId); } catch (er) {}
  });
  tahtaEl.addEventListener('pointermove', function (e) {
    if (!basla0 || run.cekicModu) return;
    var dx = e.clientX - basla0.x, dy = e.clientY - basla0.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    var i = basla0.i, hedef = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? i + 1 : i - 1) : (dy > 0 ? i + N : i - N);
    basla0 = null;
    if (M.komsu(i, hedef)) degistir(i, hedef);
  });
  tahtaEl.addEventListener('pointerup', function () {
    if (!basla0) return;
    var i = basla0.i;
    basla0 = null;
    dokun(i);
  });
  tahtaEl.addEventListener('pointercancel', function () { basla0 = null; });
  function dokun(i) {
    if (!oynayabilir()) return;
    ipucuKur();
    if (run.cekicModu) return cekicVur(i);
    if (secili === -1 || secili === i) {
      var b = run.b;
      secili = secili === i || b.yok[i] || b.kutu[i] || b.zin[i] || b.t[i] < 0 ? -1 : i;
      MiniOyun.ses('tik');
      tahtaCiz(run.b);
      return;
    }
    if (M.komsu(secili, i)) { degistir(secili, i); return; }
    secili = i;
    tahtaCiz(run.b);
  }

  // ---------- Klavye ----------
  document.addEventListener('keydown', function (e) {
    if (!run || oyunEl.hidden || e.altKey || e.metaKey || e.ctrlKey) return;
    var k = e.key;
    if (k === 'p' || k === 'P') {
      var pb = document.querySelector('.oyun-arac button[aria-label="Duraklat"], .oyun-arac button[aria-label="Devam et"]');
      if (pb && (!run.bitti || MiniOyun.duraklatildi())) { e.preventDefault(); pb.click(); }
      return;
    }
    if (!oynayabilir()) return;
    var yon = { ArrowUp: -N, ArrowDown: N, ArrowLeft: -1, ArrowRight: 1 }[k];
    if (yon) {
      e.preventDefault();
      ipucuKur();
      if (secili !== -1 && klavye) {
        var h = secili + yon;
        if (M.komsu(secili, h)) { imlec = h; degistir(secili, h); }
        return;
      }
      klavye = true;
      var n = imlec + yon;
      if (M.komsu(imlec, n)) imlec = n;
      tahtaEl.setAttribute('data-imlec', imlec);
      tahtaCiz(run.b);
      return;
    }
    if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      klavye = true;
      ipucuKur();
      if (run.cekicModu) return cekicVur(imlec);
      secili = secili === imlec ? -1 : imlec;
      MiniOyun.ses('tik');
      tahtaCiz(run.b);
      return;
    }
    if (k === 'Escape') {
      if (secili !== -1 || run.cekicModu) { secili = -1; run.cekicModu = false; ciz(); }
      return;
    }
    if (k === 'h' || k === 'H') { e.preventDefault(); ipucu(true); return; }
    if (run.mod === 'bolum') {
      if (k === '1') { e.preventDefault(); cekicModu(); }
      else if (k === '2') { e.preventDefault(); karistir(); }
      else if (k === '3') { e.preventDefault(); ekHamle(false); }
    }
  });

  MiniOyun.oyun({
    restart: function () {
      if (!run) return haritaGoster();
      bastan();
    },
    pause: function () { clearTimeout(ipucuT); },
    resume: function () { ipucuKur(); },
    canPause: function () { return !!run && !run.bitti && !oyunEl.hidden; },
    seviye: seviye
  });

  if (daily) basla('gunluk');
  else haritaGoster();
})();

(function () {
  // Top Sıralama: tüplerdeki renkli topları her tüp tek renk olacak şekilde sırala.
  // 5 dünya x 12 bölüm (tohumlu üretici, her bölüm herkese aynı ve çözülebilir), yıldızlar, jeton, Geri Al / +1 Tüp,
  // gizli toplar, kısa tüpler, kilitli tüpler, açılan top/tüp temaları, günlük görevler, sonsuz mod ve
  // günlük modda (?gunluk=) herkese aynı bulmaca. Kayıt: mo_top.
  var KEY = 'mo_top';
  var M = window.TopSiralamaMotor;
  var BOLUM_SAYI = 60, DUNYA_YILDIZ = 24, GERI_HAK = 5, GERI_BEDEL = 3, TUP_BEDEL = 5, GOREV_ODUL = 2;
  var RENKLER = ['#ef4444', '#f97316', '#facc15', '#a3e635', '#15803d', '#2dd4bf', '#3b82f6', '#1e3a8a', '#a855f7', '#f472b6', '#92400e', '#9ca3af'];
  var TUSLAR = '1234567890QWETY';
  var TOP_TEMA = {
    duz: { ad: 'Düz renk', ikon: '🔴', dunya: -1, isaret: null },
    sekil: { ad: 'Şekilli', ikon: '🔷', dunya: -1, isaret: ['●', '▲', '■', '◆', '★', '✚', '♥', '♠', '♣', '⬟', '✖', '☾'] },
    meyve: { ad: 'Meyveler', ikon: '🍎', dunya: 0, isaret: ['🍓', '🍊', '🍋', '🍐', '🥝', '🍈', '🫐', '🍇', '🍍', '🍑', '🥥', '🍒'] },
    hayvan: { ad: 'Hayvanlar', ikon: '🐯', dunya: 1, isaret: ['🦊', '🐯', '🐥', '🐸', '🐢', '🐬', '🐳', '🐧', '🦄', '🐷', '🐻', '🐨'] },
    gezegen: { ad: 'Gezegenler', ikon: '🪐', dunya: 2, isaret: ['☀️', '🪐', '🌕', '🌍', '🌎', '🌏', '🌑', '🌒', '🌓', '☄️', '🌙', '⭐'] },
    tas: { ad: 'Değerli taşlar', ikon: '💎', dunya: 3, isaret: ['💎', '🔶', '🌟', '🍀', '🌿', '🧊', '🔷', '💠', '🔮', '🌸', '🪵', '🪨'] }
  };
  var TUP_TEMA = {
    cam: { ad: 'Cam', dunya: -1 },
    ahsap: { ad: 'Ahşap', dunya: 0 },
    neon: { ad: 'Neon', dunya: 2 },
    altin: { ad: 'Altın', dunya: 4 }
  };
  var GOREVLER = [
    { id: 'geriAlsiz3', ad: '3 bölümü Geri Al kullanmadan bitir', hedef: 3 },
    { id: 'hedefAlti', ad: 'Bir bölümü hedef hamlede veya altında bitir', hedef: 1 },
    { id: 'gunluk', ad: 'Günlük bulmacayı çöz', hedef: 1 },
    { id: 'bolum3', ad: '3 bölüm bitir', hedef: 3 },
    { id: 'yildiz3', ad: 'Bir bölümü 3 yıldızla bitir', hedef: 1 },
    { id: 'tup10', ad: '10 tüp tamamla', hedef: 10 }
  ];
  var SONSUZ = {
    kolay: { ad: 'Kolay', renk: 5, bos: 2, kisa: 0 },
    orta: { ad: 'Orta', renk: 8, bos: 2, kisa: 0, gizli: true },
    zor: { ad: 'Zor', renk: 10, bos: 1, kisa: 2, gizli: true }
  };

  var ustEl = document.getElementById('ust');
  var oyunEl = document.getElementById('oyun');
  var haritaEl = document.getElementById('harita');
  var tuplerEl = document.getElementById('tupler');
  var uyariEl = document.getElementById('uyari');
  var bolumEl = document.getElementById('bolum');
  var hamleEl = document.getElementById('hamle');
  var jetonEl = document.getElementById('jeton');
  var rekorEl = document.getElementById('rekor');
  var geriBtn = document.getElementById('geri');
  var tupBtn = document.getElementById('tup-ekle');
  var bastanBtn = document.getElementById('bastan');

  var daily = !!(MiniOyun.gunluk && MiniOyun.gunluk.tarih);
  var save = load();
  var run = null, secili = -1, imlec = 0, haritaDunya = null, uyariT = null, sonsuzSeri = 0;

  // ---------- Kayıt ----------
  function sayi(v, d) { v = Number(v); return isFinite(v) && v >= 0 ? Math.floor(v) : d; }
  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
    if (!s || typeof s !== 'object' || Array.isArray(s)) s = {};
    var b = {};
    if (s.bolumler && typeof s.bolumler === 'object') {
      for (var k in s.bolumler) {
        var n = Number(k), y = sayi(s.bolumler[k], 0);
        if (n >= 1 && n <= BOLUM_SAYI && y > 0) b[n] = Math.min(3, y);
      }
    }
    var acilan = Array.isArray(s.acilan) ? s.acilan.filter(function (x) { return TOP_TEMA[x] || TUP_TEMA[x]; }) : [];
    var tema = s.tema && typeof s.tema === 'object' ? s.tema : {};
    var g = s.gorev && typeof s.gorev === 'object' && Array.isArray(s.gorev.liste) && Array.isArray(s.gorev.tamam) ? s.gorev : null;
    if (g && (!g.ilerleme || typeof g.ilerleme !== 'object')) g.ilerleme = {};
    return {
      bolumler: b,
      jeton: sayi(s.jeton, 0),
      tema: { top: TOP_TEMA[tema.top] ? tema.top : 'duz', tup: TUP_TEMA[tema.tup] ? tema.tup : 'cam' },
      acilan: acilan,
      gorev: g,
      sonsuzSeri: sayi(s.sonsuzSeri, 0),
      usta: Array.isArray(s.usta) ? s.usta.filter(function (x) { return typeof x === 'number'; }) : [],
      gunluk: typeof s.gunluk === 'string' ? s.gunluk : ''
    };
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} }

  function yildizYazi(y) { return '⭐'.repeat(y) + '☆'.repeat(3 - y); }
  function dunyaOf(no) { return Math.floor((no - 1) / 12); }
  function dunyaYildiz(w) { var n = 0; for (var i = w * 12 + 1; i <= w * 12 + 12; i++) n += save.bolumler[i] || 0; return n; }
  function toplamYildiz() { var n = 0; for (var k in save.bolumler) n += save.bolumler[k]; return n; }
  function bitenSayisi() { return Object.keys(save.bolumler).length; }
  function dunyaBitti(w) { for (var i = w * 12 + 1; i <= w * 12 + 12; i++) if (!save.bolumler[i]) return false; return true; }
  function dunyaAcik(w) { return w === 0 || (!!save.bolumler[w * 12] && dunyaYildiz(w - 1) >= DUNYA_YILDIZ); }
  function bolumAcik(no) {
    if (no < 1 || no > BOLUM_SAYI) return false;
    if (!dunyaAcik(dunyaOf(no))) return false;
    return no % 12 === 1 || !!save.bolumler[no - 1];
  }
  function temaAcik(id) {
    var t = TOP_TEMA[id] || TUP_TEMA[id];
    return t.dunya < 0 || save.acilan.indexOf(id) !== -1;
  }

  function uyar(t, kalici) {
    uyariEl.textContent = t;
    clearTimeout(uyariT);
    if (!kalici) uyariT = setTimeout(function () { uyariEl.textContent = ''; }, 2800);
  }

  // ---------- Günlük görevler ----------
  function gorevHazirla() {
    var bugun = MiniOyun.gunluk.bugun();
    if (save.gorev && save.gorev.tarih === bugun) return;
    var rnd = MiniOyun.gunluk.rastgele(bugun + '/top-gorev'), havuz = GOREVLER.slice(), liste = [];
    while (liste.length < 3) liste.push(havuz.splice(Math.floor(rnd() * havuz.length), 1)[0].id);
    save.gorev = { tarih: bugun, liste: liste, ilerleme: {}, tamam: [] };
    persist();
  }
  function gorevBul(id) { for (var i = 0; i < GOREVLER.length; i++) if (GOREVLER[i].id === id) return GOREVLER[i]; return null; }
  function gorevIlerle(id, n) {
    gorevHazirla();
    var g = save.gorev;
    if (g.liste.indexOf(id) === -1 || g.tamam.indexOf(id) !== -1) return;
    var m = gorevBul(id);
    g.ilerleme[id] = (g.ilerleme[id] || 0) + n;
    if (g.ilerleme[id] >= m.hedef) {
      g.tamam.push(id);
      save.jeton += GOREV_ODUL;
      uyar('🎯 Görev tamam: ' + m.ad + ' (+' + GOREV_ODUL + ' 🪙)');
    }
    persist();
  }

  // ---------- Bölüm kurma ----------
  // mod: 'kampanya' (no), 'gunluk', 'sonsuz' (zorluk)
  function basla(mod, arg) {
    var o, rnd, L = null;
    if (mod === 'kampanya') {
      L = M.ayar(arg);
      o = L;
      rnd = MiniOyun.gunluk.rastgele('top-siralama/bolum/' + arg);
    } else if (mod === 'gunluk') {
      o = { renk: 8, bos: 2, kisa: 0, gizli: true };
      rnd = MiniOyun.rastgele();
    } else {
      o = SONSUZ[arg];
      rnd = MiniOyun.rastgele();
    }
    var u = M.uret(o, rnd);
    var tuplar = u.tuplar.map(function (t) {
      return { k: t.k, b: t.b.slice(), g: t.b.map(function (x, i) { return !!o.gizli && i < t.b.length - 1; }) };
    });
    run = {
      mod: mod, L: L, zorluk: mod === 'sonsuz' ? arg : '', tuplar: tuplar,
      kilit: u.kilit, kilitRenk: u.kilitRenk, acik: u.kilit < 0,
      hedef: u.cozum ? u.cozum.length : 40, hamle: 0, gecmis: [],
      geriHak: L && L.usta ? 0 : GERI_HAK, geriKullan: 0, ekTup: false, bitti: false, sayilan: {}
    };
    secili = -1;
    imlec = 0;
    haritaEl.hidden = true;
    oyunEl.hidden = false;
    ustEl.hidden = false;
    var tema = save.tema;
    oyunEl.className = 'ts-oyun tup-' + tema.tup + ' top-' + tema.top + (L ? ' dunya-' + L.dunya : '');
    if (mod === 'kampanya') {
      var d = M.DUNYALAR[L.dunya];
      var notlar = [d.ikon + ' ' + d.ad + ' · Bölüm ' + L.no + (L.usta ? ' · 👑 Usta bölümü: Geri Al kapalı' : '')];
      if (L.no === 13) notlar.push('Yeni: gizli toplar ❔ üstleri kalkınca açılır');
      if (L.no === 25) notlar.push('Yeni: kısa tüpler yalnızca 3 top alır');
      if (L.no === 37) notlar.push('Yeni: 🔒 kilitli tüp, üstündeki renk tamamlanınca açılır');
      uyar(notlar.join(' · '), true);
    } else if (mod === 'gunluk') {
      uyar('📅 Günlük bulmaca · ' + MiniOyun.gunluk.tarih + ' · herkes aynı dizilimi çözer', true);
    } else {
      uyar('♾️ Sonsuz mod · ' + SONSUZ[arg].ad + ' · seri: ' + sonsuzSeri, true);
    }
    onerHesapla();
    ciz();
  }

  function kilitliIndis() { return run.acik ? -1 : run.kilit; }
  function seviye() {
    if (!run) return '';
    if (run.mod === 'gunluk') return 'gunluk';
    if (run.mod === 'sonsuz') return 'sonsuz-' + run.zorluk;
    return 'bölüm ' + run.L.no;
  }
  function hamleVar() {
    var T = run.tuplar, kil = kilitliIndis();
    for (var a = 0; a < T.length; a++) {
      if (M.tamam(T[a])) continue;
      for (var b = 0; b < T.length; b++) if (M.tasinir(T, a, b, kil)) return true;
    }
    return false;
  }

  // ---------- Çizim ----------
  function topHtml(c, gizli, kalk) {
    var tm = TOP_TEMA[save.tema.top];
    if (gizli) return '<span class="ts-top gizli" data-r="?">❔</span>';
    var isaret = tm.isaret ? tm.isaret[c] : '';
    return '<span class="ts-top' + (kalk ? ' kalk' : '') + '" data-r="' + c + '" style="--r:' + RENKLER[c] + '">' + isaret + '</span>';
  }
  function ciz() {
    var T = run.tuplar, n = T.length, cols = n <= 7 ? n : Math.ceil(n / 2);
    tuplerEl.style.setProperty('--cols', cols);
    var oner = run.oner || null;
    var h = '';
    T.forEach(function (t, i) {
      var tam = M.tamam(t), kilitli = i === kilitliIndis();
      var grupN = i === secili ? M.grup(t) : 0;
      var cls = 'ts-tup' + (t.k < M.KAP ? ' kisa' : '') + (tam ? ' tamam' : '') + (kilitli ? ' kilitli' : '') +
        (i === secili ? ' secili' : '') + (i === imlec && run.klavye ? ' imlec' : '') +
        (oner && (oner[0] === i || oner[1] === i) ? ' oner' : '');
      var etiket = TUSLAR[i] || '';
      h += '<button type="button" class="' + cls + '" data-i="' + i + '" data-toplar="' + t.b.join(',') + '" aria-label="Tüp ' + (i + 1) + (kilitli ? ', kilitli' : '') + (tam ? ', tamamlandı' : '') + '">';
      h += '<span class="ts-ic">';
      t.b.forEach(function (c, j) { h += topHtml(c, t.g[j], j >= t.b.length - grupN); });
      h += '</span>';
      if (kilitli) h += '<span class="ts-kilit">🔒<i style="--r:' + RENKLER[run.kilitRenk] + '"></i></span>';
      if (tam) h += '<span class="ts-kapak">✓</span>';
      h += '<small>' + etiket + '</small></button>';
    });
    tuplerEl.innerHTML = h;
    tuplerEl.setAttribute('data-hamle', run.hamle);
    tuplerEl.setAttribute('data-tup', n);
    hud();
  }
  function hud() {
    if (run) {
      bolumEl.textContent = run.mod === 'kampanya' ? run.L.no : run.mod === 'gunluk' ? '📅' : '♾️';
      hamleEl.textContent = run.hamle + ' / ' + run.hedef;
      hamleEl.setAttribute('data-hamle', run.hamle);
      hamleEl.setAttribute('data-hedef', run.hedef);
      var usta = run.L && run.L.usta;
      geriBtn.textContent = usta ? '↶ Geri Al 🔒' : run.geriHak > 0 || run.mod === 'gunluk' ? '↶ Geri Al (' + run.geriHak + ')' : '↶ +' + GERI_HAK + ' Geri Al (' + GERI_BEDEL + ' 🪙)';
      geriBtn.disabled = usta || (run.geriHak === 0 && (run.mod === 'gunluk' || save.jeton < GERI_BEDEL)) || run.bitti;
      geriBtn.setAttribute('data-hak', run.geriHak);
      tupBtn.hidden = run.mod === 'gunluk';
      tupBtn.disabled = run.ekTup || save.jeton < TUP_BEDEL || run.bitti;
      var rk = rekorKey();
      rekorEl.textContent = rk ? (MiniOyun.getBest(rk) || '-') : sonsuzSeri + ' seri';
    }
    jetonEl.textContent = '🪙 ' + save.jeton;
    jetonEl.setAttribute('data-jeton', save.jeton);
  }
  function rekorKey() {
    if (!run) return '';
    if (run.mod === 'kampanya') return 'top-siralama-' + run.L.no;
    if (run.mod === 'gunluk') return 'top-siralama-gunluk';
    return '';
  }

  // Öğretici bölümlerde (1-3) sıradaki iyi hamleyi göster
  function onerHesapla() {
    run.oner = null;
    if (!run.L || run.L.no > 3 || run.bitti) return;
    var yol = M.coz(run.tuplar, run.kilit, run.kilitRenk, 4000);
    if (yol && yol.length) run.oner = yol[0];
  }

  // ---------- Oynanış ----------
  function sec(i) {
    if (!run || run.bitti || MiniOyun.duraklatildi()) return;
    var T = run.tuplar;
    if (i < 0 || i >= T.length) return;
    if (secili === -1) {
      if (i === kilitliIndis()) { salla(i); uyar('🔒 Bu tüp, ' + renkAdi(run.kilitRenk) + ' tüp tamamlanınca açılır'); return; }
      if (!T[i].b.length || M.tamam(T[i])) { salla(i); return; }
      secili = i;
      MiniOyun.ses('tik');
      ciz();
      return;
    }
    if (i === secili) { secili = -1; ciz(); return; }
    var n = M.tasinir(T, secili, i, kilitliIndis());
    if (!n) { salla(i); return; }
    hamleYap(secili, i, n);
  }
  function renkAdi(c) { return ['kırmızı', 'turuncu', 'sarı', 'açık yeşil', 'koyu yeşil', 'turkuaz', 'mavi', 'lacivert', 'mor', 'pembe', 'kahverengi', 'gri'][c]; }
  function salla(i) {
    var el = tuplerEl.querySelector('[data-i="' + i + '"]');
    if (!el) return;
    el.classList.remove('salla');
    void el.offsetWidth;
    el.classList.add('salla');
    tuplerEl.setAttribute('data-son', 'gecersiz');
  }
  function anlik() {
    return { t: run.tuplar.map(function (t) { return { k: t.k, b: t.b.slice(), g: t.g.slice() }; }), acik: run.acik };
  }
  function hamleYap(a, b, n) {
    var T = run.tuplar;
    run.gecmis.push(anlik());
    for (var j = 0; j < n; j++) {
      T[b].b.push(T[a].b.pop());
      T[b].g.push(false);
      T[a].g.pop();
    }
    // Üste çıkan gizli top açılır
    if (T[a].g.length) T[a].g[T[a].g.length - 1] = false;
    run.hamle++;
    secili = -1;
    tuplerEl.setAttribute('data-son', 'tasindi');
    var ses = 'tik';
    if (M.tamam(T[b])) {
      ses = 'puan';
      var c = T[b].b[0];
      if (!run.sayilan[c]) { run.sayilan[c] = true; if (run.mod !== 'gunluk') gorevIlerle('tup10', 1); }
    }
    if (!run.acik && M.renkTamam(T, run.kilitRenk)) {
      run.acik = true;
      ses = 'puan';
      uyar('🔓 Kilitli tüp açıldı!');
    }
    MiniOyun.ses(ses);
    if (M.kazandi(T)) return kazan();
    onerHesapla();
    ciz();
    var gelen = tuplerEl.querySelectorAll('[data-i="' + b + '"] .ts-top');
    for (var k = gelen.length - n; k < gelen.length; k++) if (gelen[k]) gelen[k].classList.add('gel');
    if (!hamleVar()) uyar('Hamle kalmadı! Geri Al, +1 Tüp veya Baştan ile devam et.', true);
  }
  function geriAl() {
    if (!run || run.bitti || MiniOyun.duraklatildi()) return;
    if (run.L && run.L.usta) { uyar('👑 Usta bölümünde Geri Al kapalı'); return; }
    if (run.geriHak === 0) {
      if (run.mod === 'gunluk') { uyar('Geri Al hakkın bitti'); return; }
      if (save.jeton < GERI_BEDEL) { uyar('Yeterli jeton yok'); return; }
      save.jeton -= GERI_BEDEL;
      run.geriHak = GERI_HAK;
      persist();
      uyar('+' + GERI_HAK + ' Geri Al hakkı alındı (−' + GERI_BEDEL + ' 🪙)');
      hud();
      return;
    }
    if (!run.gecmis.length) { uyar('Geri alınacak hamle yok'); return; }
    var s = run.gecmis.pop();
    run.tuplar = s.t;
    run.acik = s.acik;
    run.hamle--;
    run.geriHak--;
    run.geriKullan++;
    secili = -1;
    MiniOyun.ses('tik');
    uyariEl.textContent = '';
    onerHesapla();
    ciz();
  }
  function tupEkle() {
    if (!run || run.bitti || run.ekTup || run.mod === 'gunluk' || MiniOyun.duraklatildi()) return;
    if (save.jeton < TUP_BEDEL) { uyar('Yeterli jeton yok'); return; }
    save.jeton -= TUP_BEDEL;
    run.ekTup = true;
    persist();
    var bos = function () { return { k: M.KAP, b: [], g: [] }; };
    run.tuplar.push(bos());
    run.gecmis.forEach(function (s) { s.t.push(bos()); });
    uyar('➕ Boş tüp eklendi (−' + TUP_BEDEL + ' 🪙). Bu bölümde en fazla 1 yıldız alınır.');
    MiniOyun.ses('puan');
    ciz();
  }
  function bastan() {
    if (!run) return;
    if (run.mod === 'sonsuz' && !run.bitti) sonsuzSeri = 0;
    basla(run.mod, run.mod === 'kampanya' ? run.L.no : run.zorluk);
  }

  function kazan() {
    run.bitti = true;
    run.oner = null;
    ciz();
    if (run.mod === 'gunluk') return gunlukBitti();
    if (run.mod === 'sonsuz') return sonsuzBitti();
    var L = run.L, hamle = run.hamle;
    var y = run.ekTup ? 1 : hamle <= run.hedef && run.geriKullan === 0 ? 3 : hamle <= Math.ceil(run.hedef * 1.3) ? 2 : 1;
    var onceki = save.bolumler[L.no] || 0, notlar = [];
    if (y > onceki) {
      save.bolumler[L.no] = y;
      save.jeton += y - onceki;
      notlar.push('+' + (y - onceki) + ' 🪙');
    }
    if (L.usta && save.usta.indexOf(L.dunya) === -1) {
      save.usta.push(L.dunya);
      save.jeton += 5;
      notlar.push('👑 Usta bölümü: +5 🪙');
    }
    if (dunyaBitti(L.dunya)) {
      for (var id in TOP_TEMA) if (TOP_TEMA[id].dunya === L.dunya && save.acilan.indexOf(id) === -1) { save.acilan.push(id); notlar.push(TOP_TEMA[id].ad + ' top teması açıldı'); }
      for (var id2 in TUP_TEMA) if (TUP_TEMA[id2].dunya === L.dunya && save.acilan.indexOf(id2) === -1) { save.acilan.push(id2); notlar.push(TUP_TEMA[id2].ad + ' tüp görünümü açıldı'); }
    }
    if (bitenSayisi() === BOLUM_SAYI && onceki === 0) notlar.push('♾️ Sonsuz mod açıldı');
    persist();
    gorevIlerle('bolum3', 1);
    if (run.geriKullan === 0) gorevIlerle('geriAlsiz3', 1);
    if (hamle <= run.hedef) gorevIlerle('hedefAlti', 1);
    if (y === 3) gorevIlerle('yildiz3', 1);
    var rec = MiniOyun.setBest('top-siralama-' + L.no, hamle, true);
    hud();
    MiniOyun.bitti({
      baslik: 'Bölüm ' + L.no + ' tamam!',
      metin: yildizYazi(y) + ' · ' + hamle + ' hamle (hedef ' + run.hedef + ')' + (run.geriKullan ? ' · ' + run.geriKullan + ' geri alma' : '') + (run.ekTup ? ' · +1 tüp kullanıldı' : '') + (notlar.length ? ' · ' + notlar.join(' · ') : ''),
      rekor: rec,
      sonuc: hamle + ' hamle',
      skor: hamle,
      seviye: 'bölüm ' + L.no,
      paylas: 'Top Sıralama ' + L.no + '. bölümü ' + hamle + ' hamlede ' + yildizYazi(y) + ' ile bitirdim!'
    });
    var sonraki = L.no < BOLUM_SAYI && bolumAcik(L.no + 1) ? L.no + 1 : 0;
    var not = '';
    if (!sonraki && L.no < BOLUM_SAYI && L.no % 12 === 0) not = M.DUNYALAR[L.dunya + 1].ad + ' dünyası için ' + M.DUNYALAR[L.dunya].ad + ' dünyasında ' + DUNYA_YILDIZ + ' ⭐ gerekli (şu an ' + dunyaYildiz(L.dunya) + ')';
    sonrakiDugme(sonraki ? 'kampanya' : '', sonraki, not);
  }
  function gunlukBitti() {
    var hamle = run.hamle, not = '', bugun = MiniOyun.gunluk.bugun();
    if (MiniOyun.gunluk.tarih === bugun && save.gunluk !== bugun) {
      save.gunluk = bugun;
      save.jeton += 3;
      not = ' · +3 🪙';
      persist();
      gorevIlerle('gunluk', 1);
    }
    var rec = MiniOyun.setBest('top-siralama-gunluk', hamle, true);
    MiniOyun.setBest('top-siralama', hamle, true);
    hud();
    MiniOyun.bitti({
      baslik: 'Günlük bulmaca tamam!',
      metin: hamle + ' hamle (hedef ' + run.hedef + ')' + not,
      rekor: rec,
      sonuc: hamle + ' hamle',
      skor: hamle,
      seviye: 'gunluk',
      paylas: 'Top Sıralama günlük bulmacasını ' + hamle + ' hamlede çözdüm!'
    });
    sonrakiDugme('', 0, '');
  }
  function sonsuzBitti() {
    sonsuzSeri++;
    var rec = false;
    if (sonsuzSeri > save.sonsuzSeri) { save.sonsuzSeri = sonsuzSeri; rec = true; }
    MiniOyun.setBest('top-siralama-sonsuz', save.sonsuzSeri);
    persist();
    gorevIlerle('bolum3', 1);
    if (run.geriKullan === 0) gorevIlerle('geriAlsiz3', 1);
    hud();
    MiniOyun.bitti({
      baslik: 'Çözüldü! Seri: ' + sonsuzSeri,
      metin: SONSUZ[run.zorluk].ad + ' · ' + run.hamle + ' hamle · en iyi seri ' + save.sonsuzSeri,
      rekor: rec,
      sonuc: sonsuzSeri + ' seri',
      paylas: 'Top Sıralama sonsuz modda ' + sonsuzSeri + ' bulmacalık seri yaptım!'
    });
    sonrakiDugme('sonsuz', run.zorluk, '');
  }
  // Oyun sonu penceresine "Sonraki bölüm" düğmesi
  function sonrakiDugme(mod, arg, not) {
    var dlg = document.querySelector('.oyun-sonu');
    if (!dlg) return;
    var b = dlg.querySelector('#ts-sonraki');
    if (!b) {
      b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.id = 'ts-sonraki';
      b.addEventListener('click', function () {
        dlg.close();
        if (b.dataset.mod === 'kampanya') basla('kampanya', Number(b.dataset.arg));
        else if (b.dataset.mod === 'sonsuz') basla('sonsuz', b.dataset.arg);
      });
      dlg.querySelector('.oyun-dlg-actions').prepend(b);
    }
    b.textContent = mod === 'sonsuz' ? 'Sonraki bulmaca ▶' : 'Sonraki bölüm ▶';
    b.hidden = !mod;
    b.dataset.mod = mod;
    b.dataset.arg = arg || '';
    var p = dlg.querySelector('.ts-sonu-not');
    if (!p) { p = document.createElement('p'); p.className = 'ts-sonu-not'; dlg.querySelector('.oyun-dlg-actions').insertAdjacentElement('beforebegin', p); }
    p.textContent = not;
    p.hidden = !not;
  }

  // ---------- Harita ----------
  function haritaGoster() {
    if (run && run.mod === 'sonsuz' && !run.bitti) sonsuzSeri = 0;
    if (run && run.bitti) run = null;
    secili = -1;
    oyunEl.hidden = true;
    ustEl.hidden = true;
    haritaEl.hidden = false;
    gorevHazirla();
    if (haritaDunya === null) {
      haritaDunya = 0;
      for (var w = 0; w < M.DUNYALAR.length; w++) if (dunyaAcik(w)) haritaDunya = w;
    }
    var h = '<div class="ts-ozet"><span id="h-jeton">🪙 ' + save.jeton + '</span><span id="h-yildiz">⭐ ' + toplamYildiz() + ' / 180</span><span>✅ ' + bitenSayisi() + ' / ' + BOLUM_SAYI + ' bölüm</span></div>';
    if (run && run.mod === 'kampanya') h += '<p>Yarım kalan bölüm: ' + run.L.no + ' (kaldığın yerden devam eder)</p>';
    h += '<div class="ts-dunyalar">';
    M.DUNYALAR.forEach(function (d, w) {
      var acik = dunyaAcik(w);
      h += '<button type="button" class="ts-dunya' + (w === haritaDunya ? ' secili' : '') + (acik ? '' : ' kilitli') + '" data-dunya="' + w + '">' + (acik ? d.ikon : '🔒') + ' ' + d.ad + '</button>';
    });
    h += '</div>';
    var d = M.DUNYALAR[haritaDunya];
    h += '<h2>' + d.ikon + ' ' + d.ad + ' <small>⭐ ' + dunyaYildiz(haritaDunya) + ' / 36</small></h2>';
    if (!dunyaAcik(haritaDunya)) {
      var onc = M.DUNYALAR[haritaDunya - 1];
      h += '<p>🔒 Açmak için ' + onc.ad + ' dünyasının 12. bölümünü bitir ve orada ' + DUNYA_YILDIZ + ' ⭐ topla (şu an ' + dunyaYildiz(haritaDunya - 1) + ').</p>';
    }
    h += '<div class="ts-bolumler">';
    for (var i = haritaDunya * 12 + 1; i <= haritaDunya * 12 + 12; i++) {
      var y = save.bolumler[i] || 0, acikB = bolumAcik(i), usta = i % 12 === 0;
      h += '<button type="button" class="ts-bolum' + (acikB ? '' : ' kilitli') + (usta ? ' usta' : '') + '" data-bolum="' + i + '"' + (acikB ? '' : ' disabled') + ' aria-label="Bölüm ' + i + (acikB ? ', ' + y + ' yıldız' : ', kilitli') + '">' +
        '<b>' + (usta ? '👑' : '') + i + '</b><span>' + (acikB ? (y ? '⭐'.repeat(y) : '·') : '🔒') + '</span></button>';
    }
    h += '</div>';
    h += '<div class="ts-ekstra"><a class="btn btn-ghost" href="?gunluk=' + MiniOyun.gunluk.bugun() + '">📅 Günlük bulmaca' + (save.gunluk === MiniOyun.gunluk.bugun() ? ' ✓' : '') + '</a></div>';
    var sonsuzAcik = bitenSayisi() >= BOLUM_SAYI;
    h += '<h2>♾️ Sonsuz mod <small>' + (sonsuzAcik ? 'en iyi seri ' + save.sonsuzSeri : '60 bölümün hepsini bitirince açılır') + '</small></h2><div class="ts-ekstra">';
    for (var z in SONSUZ) h += '<button type="button" class="btn btn-ghost" data-sonsuz="' + z + '"' + (sonsuzAcik ? '' : ' disabled') + '>' + (sonsuzAcik ? '' : '🔒 ') + SONSUZ[z].ad + '</button>';
    h += '</div>';
    h += '<h2>🎨 Temalar</h2><div class="ts-temalar">';
    for (var t in TOP_TEMA) h += temaDugme('top', t, TOP_TEMA[t]);
    h += '</div><div class="ts-temalar">';
    for (var t2 in TUP_TEMA) h += temaDugme('tup', t2, TUP_TEMA[t2]);
    h += '</div>';
    h += '<h2>🎯 Bugünün görevleri <small>her biri ' + GOREV_ODUL + ' 🪙</small></h2><ul class="ts-gorevler">';
    save.gorev.liste.forEach(function (id) {
      var m = gorevBul(id), tamam = save.gorev.tamam.indexOf(id) !== -1, il = Math.min(m.hedef, save.gorev.ilerleme[id] || 0);
      h += '<li class="ts-gorev' + (tamam ? ' tamam' : '') + '" data-gorev="' + id + '">' + (tamam ? '✅ ' : '▫️ ') + m.ad + ' <small>' + (tamam ? 'tamamlandı' : il + '/' + m.hedef) + '</small></li>';
    });
    h += '</ul>';
    haritaEl.innerHTML = h;
    hud();
  }
  function temaDugme(tur, id, tm) {
    var acik = temaAcik(id), secim = save.tema[tur] === id;
    var kosul = tm.dunya >= 0 ? M.DUNYALAR[tm.dunya].ad + ' dünyasını bitir' : '';
    return '<button type="button" class="ts-tema' + (secim ? ' secili' : '') + (acik ? '' : ' kilitli') + '" data-tur="' + tur + '" data-tema="' + id + '"' + (acik ? '' : ' disabled title="' + kosul + '"') + '>' +
      (acik ? (tm.ikon || (tur === 'tup' ? '🧪' : '')) : '🔒') + ' ' + tm.ad + (acik ? '' : ' <small>(' + kosul + ')</small>') + '</button>';
  }

  haritaEl.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.hasAttribute('data-dunya')) {
      haritaDunya = Number(b.getAttribute('data-dunya'));
      haritaGoster();
    } else if (b.hasAttribute('data-bolum')) {
      var no = Number(b.getAttribute('data-bolum'));
      if (run && run.mod === 'kampanya' && run.L.no === no && !run.bitti) {
        haritaEl.hidden = true; oyunEl.hidden = false; ustEl.hidden = false; ciz();
      } else basla('kampanya', no);
    } else if (b.hasAttribute('data-sonsuz')) {
      sonsuzSeri = 0;
      basla('sonsuz', b.getAttribute('data-sonsuz'));
    } else if (b.hasAttribute('data-tema')) {
      save.tema[b.getAttribute('data-tur')] = b.getAttribute('data-tema');
      persist();
      haritaGoster();
    }
  });

  document.getElementById('harita-btn').addEventListener('click', function () {
    if (daily) { location.href = location.pathname; return; }
    haritaGoster();
  });
  tuplerEl.addEventListener('click', function (e) {
    var b = e.target.closest('.ts-tup');
    if (!b) return;
    run.klavye = false;
    sec(Number(b.getAttribute('data-i')));
  });
  geriBtn.addEventListener('click', geriAl);
  tupBtn.addEventListener('click', tupEkle);
  bastanBtn.addEventListener('click', function () { if (!MiniOyun.duraklatildi()) bastan(); });

  document.addEventListener('keydown', function (e) {
    if (!run || oyunEl.hidden || MiniOyun.duraklatildi() || e.altKey || e.metaKey) return;
    var k = (e.key || '').toUpperCase();
    if (k === 'Z' || (e.ctrlKey && k === 'Z')) { e.preventDefault(); geriAl(); return; }
    if (e.ctrlKey) return;
    if (k === 'R') { e.preventDefault(); bastan(); return; }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      run.klavye = true;
      var n = run.tuplar.length;
      imlec = (imlec + (e.key === 'ArrowLeft' ? n - 1 : 1)) % n;
      ciz();
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && run.klavye) { e.preventDefault(); sec(imlec); return; }
    var i = TUSLAR.indexOf(k);
    if (k.length === 1 && i !== -1 && i < run.tuplar.length) { e.preventDefault(); imlec = i; sec(i); }
  });

  MiniOyun.oyun({
    restart: function () {
      if (!run) return haritaGoster();
      bastan();
    },
    canPause: function () { return false; },
    seviye: seviye
  });

  if (daily) basla('gunluk');
  else haritaGoster();
})();

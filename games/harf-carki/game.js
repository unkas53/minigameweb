(function () {
  // Harf Çarkı: çarktaki harflerden kelime kurup küçük çapraz bulmacayı doldur.
  // 6 tema x 10 bölüm, yıldızlar, jetonla ipucu, bonus kelimeler, günlük görevler, çark görünümleri,
  // 30 bölüm sonrası Uzun Kelime modu ve günlük modda (?gunluk=) herkese aynı bulmaca. Kayıt: mo_harf.
  var KEY = 'mo_harf';
  var VERI = window.HarfCarkiVeri;
  var BOLUMLER = VERI.BOLUMLER;
  var SOZLUK = {};
  VERI.SOZLUK.forEach(function (w) { SOZLUK[w] = true; });
  var TEMALAR = [
    { ad: 'Sabah', ikon: '🌅', renk: ['#fb923c', '#ec4899'], gorunum: 'gunes' },
    { ad: 'Deniz', ikon: '🌊', renk: ['#06b6d4', '#0e7490'], gorunum: 'mercan' },
    { ad: 'Dağ', ikon: '🏔️', renk: ['#4ade80', '#64748b'], gorunum: 'zumrut' },
    { ad: 'Şehir', ikon: '🏙️', renk: ['#a855f7', '#6d28d9'], gorunum: 'neon' },
    { ad: 'Gece', ikon: '🌙', renk: ['#3b82f6', '#1e3a8a'], gorunum: 'yildiz' },
    { ad: 'Uzay', ikon: '🌌', renk: ['#8b5cf6', '#312e81'], gorunum: 'galaksi' }
  ];
  var GORUNUMLER = {
    klasik: { ad: 'Klasik', renk: ['#f4f2ff', '#aaa6d4'] },
    gunes: { ad: 'Güneş', renk: ['#facc15', '#f97316'] },
    mercan: { ad: 'Mercan', renk: ['#fb7185', '#22d3ee'] },
    zumrut: { ad: 'Zümrüt', renk: ['#34d399', '#065f46'] },
    neon: { ad: 'Neon', renk: ['#e879f9', '#22d3ee'] },
    yildiz: { ad: 'Yıldız', renk: ['#fde68a', '#6366f1'] },
    galaksi: { ad: 'Galaksi', renk: ['#c084fc', '#0f172a'] }
  };
  var GOREVLER = [
    { id: 'bonus5', ad: '5 bonus kelime bul', hedef: 5, odul: 1 },
    { id: 'ipucusuz2', ad: 'İpucu kullanmadan 2 bölüm bitir', hedef: 2, odul: 2 },
    { id: 'uzun6', ad: '6 harfli bir kelime bul', hedef: 1, odul: 1 },
    { id: 'bolum3', ad: '3 bölüm bitir', hedef: 3, odul: 1 },
    { id: 'yildiz3', ad: 'Bir bölümü 3 yıldızla bitir', hedef: 1, odul: 2 },
    { id: 'kelime20', ad: '20 kelime bul', hedef: 20, odul: 1 }
  ];
  var KOLEKSIYON = [[100, 3], [250, 5], [500, 10]];
  var SN_KELIME = 20, TEMA_YILDIZ = 20, UZUN_ACILIS = 30, HARF_BEDEL = 1, KELIME_BEDEL = 3, GUNLUK_CEZA = 30;

  var ustEl = document.getElementById('ust');
  var oyunEl = document.getElementById('oyun');
  var haritaEl = document.getElementById('harita');
  var izgaraEl = document.getElementById('izgara');
  var kelimeEl = document.getElementById('kelime');
  var uyariEl = document.getElementById('uyari');
  var carkEl = document.getElementById('cark');
  var cizgiEl = document.getElementById('cizgi');
  var bilgiEl = document.getElementById('bilgi');
  var bolumEl = document.getElementById('bolum');
  var jetonEl = document.getElementById('jeton');
  var sureEl = document.getElementById('sure');
  var kumbaraEl = document.getElementById('kumbara');
  var rekorEl = document.getElementById('rekor');
  var harfBtn = document.getElementById('ipucu-harf');
  var kelimeBtn = document.getElementById('ipucu-kelime');

  var daily = !!(MiniOyun.gunluk && MiniOyun.gunluk.tarih);
  var save = load();
  var run = null, paused = false, secim = [], harfEls = [], surukle = null, haritaTema = null, uyariT = null;

  // ---------- Kayıt ----------
  function sayi(v, d) { v = Number(v); return isFinite(v) && v >= 0 ? Math.floor(v) : d; }
  function dizi(v) { return Array.isArray(v) ? v.filter(function (x) { return typeof x === 'string'; }) : []; }
  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
    if (!s || typeof s !== 'object' || Array.isArray(s)) s = {};
    var b = {};
    if (s.bolumler && typeof s.bolumler === 'object') for (var k in s.bolumler) { var y = sayi(s.bolumler[k], 0); if (y > 0 && k >= 1 && k <= BOLUMLER.length) b[k] = Math.min(3, y); }
    var acilan = dizi(s.acilan).filter(function (g) { return GORUNUMLER[g]; });
    if (acilan.indexOf('klasik') === -1) acilan.unshift('klasik');
    return {
      bolumler: b,
      jeton: sayi(s.jeton, 5),
      bonus: sayi(s.bonus, 0),
      kelimeler: dizi(s.kelimeler),
      acilan: acilan,
      secili: acilan.indexOf(s.secili) !== -1 ? s.secili : 'klasik',
      uzunRekor: sayi(s.uzunRekor, 0),
      temaOdul: Array.isArray(s.temaOdul) ? s.temaOdul.filter(function (x) { return typeof x === 'number'; }) : [],
      koleksiyonOdul: Array.isArray(s.koleksiyonOdul) ? s.koleksiyonOdul.filter(function (x) { return typeof x === 'number'; }) : [],
      gorev: s.gorev && typeof s.gorev === 'object' && Array.isArray(s.gorev.liste) && s.gorev.liste.length === 3 && s.gorev.liste.every(gorev) && s.gorev.ilerleme && typeof s.gorev.ilerleme === 'object' && Array.isArray(s.gorev.tamam) ? s.gorev : null,
      gunluk: s.gunluk && typeof s.gunluk === 'object' ? { tarih: String(s.gunluk.tarih || ''), bitti: !!s.gunluk.bitti } : { tarih: '', bitti: false },
      devam: s.devam && typeof s.devam === 'object' && BOLUMLER[s.devam.bolum - 1] ? s.devam : null
    };
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} }

  function tr(s) { return String(s).toLocaleUpperCase('tr'); }
  function harfler(w) { return Array.from(w); }
  function temaOf(no) { return Math.floor((no - 1) / 10); }
  function temaYildiz(t) { var n = 0; for (var i = t * 10 + 1; i <= t * 10 + 10; i++) n += save.bolumler[i] || 0; return n; }
  function temaAcik(t) { return t === 0 || temaYildiz(t - 1) >= TEMA_YILDIZ; }
  function bolumAcik(no) { var t = temaOf(no); return temaAcik(t) && (no === t * 10 + 1 || (save.bolumler[no - 1] || 0) > 0); }
  function bitenSayisi() { var n = 0; for (var k in save.bolumler) if (save.bolumler[k] > 0) n++; return n; }
  function toplamYildiz() { var n = 0; for (var k in save.bolumler) n += save.bolumler[k]; return n; }
  function yildizYazi(y) { return '⭐'.repeat(y) + '☆'.repeat(3 - y); }

  function uyar(t) {
    uyariEl.textContent = t;
    clearTimeout(uyariT);
    uyariT = setTimeout(function () { uyariEl.textContent = ''; }, 2600);
  }

  // ---------- Günlük görevler ----------
  function gorevHazirla() {
    var bugun = MiniOyun.gunluk.bugun();
    if (save.gorev && save.gorev.tarih === bugun) return;
    var rnd = MiniOyun.gunluk.rastgele(bugun + '/harf-gorev'), havuz = GOREVLER.slice(), liste = [];
    while (liste.length < 3) liste.push(havuz.splice(Math.floor(rnd() * havuz.length), 1)[0].id);
    save.gorev = { tarih: bugun, liste: liste, ilerleme: {}, tamam: [] };
    persist();
  }
  function gorev(id) { for (var i = 0; i < GOREVLER.length; i++) if (GOREVLER[i].id === id) return GOREVLER[i]; return null; }
  function gorevIlerle(id, n) {
    if (!run || run.mod === 'gunluk') return;
    gorevHazirla();
    var g = save.gorev;
    if (g.liste.indexOf(id) === -1 || g.tamam.indexOf(id) !== -1) return;
    var m = gorev(id);
    g.ilerleme[id] = (g.ilerleme[id] || 0) + n;
    if (g.ilerleme[id] >= m.hedef) {
      g.tamam.push(id);
      save.jeton += m.odul;
      uyar('🎯 Görev tamam: ' + m.ad + ' (+' + m.odul + ' 🪙)');
    }
  }

  // ---------- Bölüm kurma ----------
  function kur(def, no) {
    var R = 0, C = 0, hucre = {};
    var kel = def.k.map(function (k) {
      var ch = harfler(k[0]), cells = [];
      for (var i = 0; i < ch.length; i++) {
        var r = k[3] === 'y' ? k[1] : k[1] + i, c = k[3] === 'y' ? k[2] + i : k[2];
        cells.push(r + ',' + c);
        hucre[r + ',' + c] = ch[i];
        R = Math.max(R, r + 1); C = Math.max(C, c + 1);
      }
      return { w: k[0], cells: cells };
    });
    return { no: no, harfler: harfler(def.h), kelimeler: kel, hucre: hucre, R: R, C: C, hedef: kel.length * SN_KELIME };
  }

  // Uzun Kelime: 7 harfli bir kelime ve harflerinden kurulabilen tüm sözlük kelimeleri
  var UZUN_HAVUZ = null;
  function kurulur(w, sayac) {
    var m = {};
    var ch = harfler(w);
    for (var i = 0; i < ch.length; i++) { m[ch[i]] = (m[ch[i]] || 0) + 1; if (m[ch[i]] > (sayac[ch[i]] || 0)) return false; }
    return true;
  }
  function sayacOf(w) { var s = {}; harfler(w).forEach(function (c) { s[c] = (s[c] || 0) + 1; }); return s; }
  function altKelimeler(w) { var s = sayacOf(w); return VERI.SOZLUK.filter(function (x) { return x !== w && kurulur(x, s); }); }
  function uzunKur(rnd) {
    if (!UZUN_HAVUZ) UZUN_HAVUZ = VERI.SOZLUK.filter(function (w) { return harfler(w).length === 7 && altKelimeler(w).length >= 6; });
    var w = UZUN_HAVUZ[Math.floor(rnd() * UZUN_HAVUZ.length)];
    var h = harfler(w);
    for (var i = h.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = h[i]; h[i] = h[j]; h[j] = t; }
    var L = kur({ h: h.join(''), k: [[w, 0, 0, 'y']] }, 0);
    L.alt = altKelimeler(w);
    return L;
  }

  function seviye() {
    if (!run) return 'bölüm 1';
    return run.mod === 'gunluk' ? 'gunluk' : run.mod === 'uzun' ? 'uzun' : 'bölüm ' + run.L.no;
  }
  function rekorKey() { return run.mod === 'gunluk' ? 'harf-carki-gunluk' : run.mod === 'uzun' ? 'harf-carki-uzun' : 'harf-carki-' + run.L.no; }

  function basla(mod, no, devam) {
    var L, rnd = Math.random, tema;
    if (mod === 'gunluk') {
      rnd = MiniOyun.rastgele();
      var idx = 20 + Math.floor(rnd() * (BOLUMLER.length - 20));
      L = kur(BOLUMLER[idx], idx + 1);
      tema = TEMALAR[Math.floor(rnd() * TEMALAR.length)];
    } else if (mod === 'uzun') {
      L = uzunKur(rnd);
      tema = TEMALAR[5];
    } else {
      L = kur(BOLUMLER[no - 1], no);
      tema = TEMALAR[temaOf(no)];
    }
    run = { mod: mod, L: L, tema: tema, bulunan: {}, bonus: {}, acik: {}, ipucu: 0, sure: 0, puan: 0, bitti: false, secKelime: -1, sira: L.harfler.map(function (_, i) { return i; }) };
    if (mod === 'gunluk') karistir(rnd, true);
    if (devam && devam.bolum === no) {
      dizi(devam.bulunan).forEach(function (w) { if (L.kelimeler.some(function (k) { return k.w === w; })) run.bulunan[w] = true; });
      dizi(devam.bonus).forEach(function (w) { run.bonus[w] = true; });
      dizi(devam.acik).forEach(function (c) { if (L.hucre[c]) run.acik[c] = true; });
      run.ipucu = sayi(devam.ipucu, 0);
      run.sure = sayi(devam.sure, 0);
      run.puan = sayi(devam.puan, 0);
    }
    secim = [];
    paused = false;
    haritaEl.hidden = true;
    oyunEl.hidden = false;
    ustEl.hidden = false;
    oyunEl.style.setProperty('--t1', tema.renk[0]);
    oyunEl.style.setProperty('--t2', tema.renk[1]);
    carkEl.className = 'hc-cark' + (save.secili !== 'klasik' ? ' g-' + save.secili : '');
    cizIzgara();
    cizCark();
    secimGoster();
    kelimeEl.className = 'hc-kelime';
    uyariEl.textContent = mod === 'gunluk' ? '📅 Günlük bulmaca · ' + MiniOyun.gunluk.tarih : mod === 'uzun' ? '🔤 7 harfli gizli kelimeyi bulana kadar en çok kelimeyi topla' : tema.ikon + ' ' + tema.ad + ' · Bölüm ' + L.no;
    devamKaydet();
    hud();
    try { window.scrollTo({ top: Math.max(0, ustEl.getBoundingClientRect().top + window.scrollY - 140) }); } catch (e) {}
  }

  function devamKaydet() {
    if (!run) return;
    if (run.mod !== 'kampanya') return persist();
    save.devam = run.bitti ? null : { bolum: run.L.no, bulunan: Object.keys(run.bulunan), bonus: Object.keys(run.bonus), acik: Object.keys(run.acik), ipucu: run.ipucu, sure: run.sure, puan: run.puan };
    persist();
  }

  // ---------- Çizim ----------
  function gorunur(c) {
    if (run.acik[c]) return true;
    return run.L.kelimeler.some(function (k) { return run.bulunan[k.w] && k.cells.indexOf(c) !== -1; });
  }
  function cizIzgara() {
    var L = run.L;
    izgaraEl.style.setProperty('--c', L.C);
    izgaraEl.innerHTML = '';
    for (var r = 0; r < L.R; r++) for (var c = 0; c < L.C; c++) {
      var k = r + ',' + c, d = document.createElement('div');
      if (L.hucre[k]) { d.className = 'hc-kare'; d.dataset.k = k; }
      else d.className = 'hc-yok';
      izgaraEl.appendChild(d);
    }
    guncelleIzgara();
  }
  function guncelleIzgara(yeni) {
    var sec = run.secKelime >= 0 ? run.L.kelimeler[run.secKelime].cells : [];
    izgaraEl.querySelectorAll('.hc-kare').forEach(function (d) {
      var k = d.dataset.k, bul = run.L.kelimeler.some(function (w) { return run.bulunan[w.w] && w.cells.indexOf(k) !== -1; });
      var vis = bul || run.acik[k];
      d.textContent = vis ? run.L.hucre[k] : '';
      d.classList.toggle('dolu', !!bul);
      d.classList.toggle('ipucu', !bul && !!run.acik[k]);
      d.classList.toggle('secili', sec.indexOf(k) !== -1);
      if (yeni && yeni.indexOf(k) !== -1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) { d.style.animation = 'none'; void d.offsetWidth; d.style.animation = ''; }
    });
    var n = run.L.kelimeler.filter(function (k) { return run.bulunan[k.w]; }).length;
    izgaraEl.dataset.bulunan = n;
    izgaraEl.dataset.toplam = run.L.kelimeler.length;
    if (run.mod === 'uzun') {
      var b = Object.keys(run.bonus);
      bilgiEl.textContent = 'Bulunan kelime: ' + b.length + ' / ' + run.L.alt.length + (b.length ? ' · ' + b.join(', ') : '');
    } else {
      var bon = Object.keys(run.bonus);
      bilgiEl.textContent = 'Kelime: ' + n + ' / ' + run.L.kelimeler.length + ' · Hedef süre: ' + run.L.hedef + ' sn' + (bon.length ? ' · Bonus: ' + bon.join(', ') : '');
    }
  }
  function cizCark() {
    harfEls.forEach(function (b) { b.remove(); });
    harfEls = [];
    var n = run.L.harfler.length;
    run.L.harfler.forEach(function (h, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'hc-harf';
      b.textContent = h;
      b.dataset.i = i;
      b.tabIndex = -1;
      b.setAttribute('aria-label', h + ' harfi');
      carkEl.appendChild(b);
      harfEls.push(b);
    });
    yerlestir(n);
  }
  function yerlestir(n) {
    run.sira.forEach(function (harf, slot) {
      var a = -Math.PI / 2 + slot * 2 * Math.PI / n, el = harfEls[harf];
      el.style.left = (50 + 36 * Math.cos(a)) + '%';
      el.style.top = (50 + 36 * Math.sin(a)) + '%';
      el.dataset.x = 50 + 36 * Math.cos(a);
      el.dataset.y = 50 + 36 * Math.sin(a);
    });
  }
  function secimGoster() {
    harfEls.forEach(function (b, i) { b.classList.toggle('secili', secim.indexOf(i) !== -1); });
    if (secim.length) kelimeEl.className = 'hc-kelime';
    kelimeEl.textContent = secim.map(function (i) { return run.L.harfler[i]; }).join('');
    cizgiEl.setAttribute('points', secim.map(function (i) { return harfEls[i].dataset.x + ',' + harfEls[i].dataset.y; }).join(' '));
  }
  function hud() {
    if (!run) return;
    bolumEl.textContent = run.mod === 'gunluk' ? '📅' : run.mod === 'uzun' ? 'Uzun' : run.L.no;
    jetonEl.textContent = run.mod === 'gunluk' ? '—' : '🪙 ' + save.jeton;
    jetonEl.dataset.jeton = save.jeton;
    var sn = run.sure + (run.mod === 'gunluk' ? run.ipucu * GUNLUK_CEZA : 0);
    sureEl.textContent = Math.floor(sn / 60) + ':' + String(sn % 60).padStart(2, '0');
    sureEl.dataset.sn = run.sure;
    kumbaraEl.textContent = (save.bonus % 10) + '/10';
    rekorEl.textContent = MiniOyun.getBest(rekorKey());
    harfBtn.textContent = '💡 Harf aç (' + (run.mod === 'gunluk' ? '+30 sn' : HARF_BEDEL + ' 🪙') + ')';
    kelimeBtn.textContent = '🔎 Kelime aç (' + (run.mod === 'gunluk' ? '+90 sn' : KELIME_BEDEL + ' 🪙') + ')';
    harfBtn.disabled = run.bitti || (run.mod !== 'gunluk' && save.jeton < HARF_BEDEL);
    kelimeBtn.disabled = run.bitti || run.mod === 'uzun' || (run.mod !== 'gunluk' && save.jeton < KELIME_BEDEL);
  }

  // ---------- Kelime kurma ----------
  function oynuyor() { return run && !run.bitti && !oyunEl.hidden && !paused && !MiniOyun.duraklatildi(); }
  function ekle(i) {
    if (secim.indexOf(i) !== -1) return false;
    secim.push(i);
    MiniOyun.ses('tik');
    secimGoster();
    return true;
  }
  function geri() { if (secim.length) { secim.pop(); secimGoster(); } }
  function karistir(rnd, sessiz) {
    rnd = rnd || Math.random;
    var s = run.sira, eski = s.join();
    for (var tur = 0; tur < 5 && s.join() === eski; tur++) {
      for (var i = s.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = s[i]; s[i] = s[j]; s[j] = t; }
    }
    if (harfEls.length) { yerlestir(s.length); secim = []; secimGoster(); }
    if (!sessiz) MiniOyun.ses('tik');
  }
  function kelimeSay(w, puanli) {
    if (save.kelimeler.indexOf(w) === -1 && run.mod !== 'gunluk') {
      save.kelimeler.push(w);
      KOLEKSIYON.forEach(function (k) {
        if (save.kelimeler.length >= k[0] && save.koleksiyonOdul.indexOf(k[0]) === -1) {
          save.koleksiyonOdul.push(k[0]);
          save.jeton += k[1];
          uyar('📖 Sözlüğünde ' + k[0] + ' kelime! +' + k[1] + ' 🪙');
        }
      });
    }
    if (puanli) {
      gorevIlerle('kelime20', 1);
      if (harfler(w).length >= 6) gorevIlerle('uzun6', 1);
    }
  }
  function gonder() {
    if (!oynuyor()) return;
    var w = secim.map(function (i) { return run.L.harfler[i]; }).join('');
    secim = [];
    secimGoster();
    if (harfler(w).length < 2) return;
    var hedef = null;
    run.L.kelimeler.forEach(function (k, i) { if (k.w === w) hedef = { k: k, i: i }; });
    kelimeEl.textContent = w;
    if (hedef && !run.bulunan[w]) {
      run.bulunan[w] = true;
      if (run.secKelime === hedef.i) run.secKelime = -1;
      if (run.mod === 'uzun') run.puan += harfler(w).length * 10 + 50;
      else run.puan += harfler(w).length * 10;
      kelimeSay(w, true);
      MiniOyun.ses('puan');
      isaretle('iyi');
      guncelleIzgara(hedef.k.cells);
      kontrol();
    } else if (hedef || run.bonus[w]) {
      uyar(hedef ? w + ' zaten bulundu' : w + ' bonusunu zaten buldun');
      isaretle('salla');
      MiniOyun.ses('tik');
    } else if (SOZLUK[w]) {
      run.bonus[w] = true;
      run.puan += run.mod === 'uzun' ? harfler(w).length * 10 : 5;
      kelimeSay(w, true);
      if (run.mod !== 'gunluk') {
        save.bonus++;
        gorevIlerle('bonus5', 1);
        if (save.bonus % 10 === 0) { save.jeton++; uyar('⭐ Kumbara doldu! +1 🪙'); }
        else uyar('⭐ Bonus kelime: ' + w);
      } else uyar('⭐ Bonus kelime: ' + w);
      MiniOyun.ses('puan');
      isaretle('iyi');
      guncelleIzgara();
    } else {
      isaretle('salla');
      MiniOyun.ses('kaybet');
    }
    devamKaydet();
    hud();
  }
  function isaretle(sinif) {
    kelimeEl.className = 'hc-kelime';
    void kelimeEl.offsetWidth;
    kelimeEl.className = 'hc-kelime ' + sinif;
    kelimeEl.dataset.son = sinif;
  }

  // ---------- İpuçları ----------
  function ipucuOde(bedel) {
    if (run.mod === 'gunluk') { run.ipucu += bedel; return true; }
    if (save.jeton < bedel) { uyar('Yeterli jeton yok'); MiniOyun.ses('tik'); return false; }
    save.jeton -= bedel;
    run.ipucu++;
    return true;
  }
  function harfAc() {
    if (!oynuyor()) return;
    var bos = Object.keys(run.L.hucre).filter(function (c) { return !gorunur(c); }).sort();
    if (!bos.length) return;
    if (!ipucuOde(HARF_BEDEL)) return;
    var c = bos[Math.floor(Math.random() * bos.length)];
    run.acik[c] = true;
    MiniOyun.ses('puan');
    tamamlananlar();
    guncelleIzgara([c]);
    devamKaydet();
    hud();
    kontrol();
  }
  function kelimeAc() {
    if (!oynuyor() || run.mod === 'uzun') return;
    var k = run.secKelime >= 0 ? run.L.kelimeler[run.secKelime] : null;
    if (!k || run.bulunan[k.w]) k = run.L.kelimeler.filter(function (x) { return !run.bulunan[x.w]; })[0];
    if (!k) return;
    if (!ipucuOde(run.mod === 'gunluk' ? 3 : KELIME_BEDEL)) return;
    k.cells.forEach(function (c) { run.acik[c] = true; });
    run.secKelime = -1;
    MiniOyun.ses('puan');
    tamamlananlar();
    guncelleIzgara(k.cells);
    devamKaydet();
    hud();
    kontrol();
  }
  // Tüm kareleri ipucuyla açılan kelimeler bulunmuş sayılır (puansız)
  function tamamlananlar() {
    run.L.kelimeler.forEach(function (k) {
      if (!run.bulunan[k.w] && k.cells.every(gorunur)) { run.bulunan[k.w] = true; kelimeSay(k.w, false); }
    });
  }
  function kontrol() {
    if (run.bitti) return;
    if (run.L.kelimeler.every(function (k) { return run.bulunan[k.w]; })) bitir();
  }

  // ---------- Bölüm sonu ----------
  function bitir() {
    run.bitti = true;
    var L = run.L;
    if (run.mod === 'gunluk') return gunlukBitti();
    if (run.mod === 'uzun') return uzunBitti();
    var ipucusuz = run.ipucu === 0, hizli = run.sure <= L.hedef;
    var ek = (ipucusuz ? 50 : 0) + (ipucusuz && hizli ? 50 : 0);
    run.puan += ek;
    var y = 1 + (ipucusuz ? 1 : 0) + (ipucusuz && hizli ? 1 : 0);
    var onceki = save.bolumler[L.no] || 0, notlar = [];
    if (y > onceki) save.bolumler[L.no] = y;
    if (!onceki) { save.jeton++; notlar.push('+1 🪙'); }
    var t = temaOf(L.no);
    var temaBitti = true;
    for (var i = t * 10 + 1; i <= t * 10 + 10; i++) if (!save.bolumler[i]) temaBitti = false;
    if (temaBitti && save.temaOdul.indexOf(t) === -1) {
      save.temaOdul.push(t);
      save.jeton += 5;
      var g = TEMALAR[t].gorunum;
      if (save.acilan.indexOf(g) === -1) save.acilan.push(g);
      notlar.push(TEMALAR[t].ad + ' teması tamam: +5 🪙, ' + GORUNUMLER[g].ad + ' çarkı açıldı');
    }
    if (bitenSayisi() >= UZUN_ACILIS && onceki === 0 && bitenSayisi() === UZUN_ACILIS) notlar.push('Uzun Kelime modu açıldı');
    gorevIlerle('bolum3', 1);
    if (ipucusuz) gorevIlerle('ipucusuz2', 1);
    if (y === 3) gorevIlerle('yildiz3', 1);
    save.devam = null;
    persist();
    var rec = MiniOyun.setBest('harf-carki-' + L.no, run.puan);
    MiniOyun.setBest('harf-carki', run.puan);
    hud();
    MiniOyun.bitti({
      baslik: 'Bölüm ' + L.no + ' tamam!',
      metin: yildizYazi(y) + ' · ' + run.puan + ' puan · ' + run.sure + ' sn' + (ipucusuz ? '' : ' · ' + run.ipucu + ' ipucu') + (notlar.length ? ' · ' + notlar.join(' · ') : ''),
      rekor: rec,
      sonuc: run.puan + ' puan',
      skor: run.puan,
      seviye: 'bölüm ' + L.no,
      paylas: 'Harf Çarkı ' + L.no + '. bölümü ' + yildizYazi(y) + ' ile bitirdim, ' + run.puan + ' puan!'
    });
    var sonraki = L.no < BOLUMLER.length && bolumAcik(L.no + 1) ? L.no + 1 : 0;
    sonrakiDugme(sonraki, sonraki ? '' : (L.no < BOLUMLER.length ? 'Sonraki tema için ' + TEMALAR[temaOf(L.no + 1) - 1].ad + ' temasında ' + TEMA_YILDIZ + ' ⭐ gerekli' : ''));
  }
  function gunlukBitti() {
    var sn = run.sure + run.ipucu * GUNLUK_CEZA, skor = Math.max(1, 1000 - sn), not = '';
    var bugun = MiniOyun.gunluk.bugun();
    if (MiniOyun.gunluk.tarih === bugun && save.gunluk.tarih !== bugun) {
      save.gunluk = { tarih: bugun, bitti: true };
      save.jeton += 2;
      not = ' · +2 🪙';
      persist();
    }
    var rec = MiniOyun.setBest('harf-carki-gunluk', skor);
    hud();
    MiniOyun.bitti({
      baslik: 'Günlük bulmaca tamam!',
      metin: sn + ' sn' + (run.ipucu ? ' (ipucu cezası dahil)' : '') + ' · ' + skor + ' puan' + not,
      rekor: rec,
      sonuc: sn + ' sn',
      skor: skor,
      seviye: 'gunluk',
      paylas: 'Harf Çarkı günlük bulmacasını ' + sn + ' saniyede çözdüm!'
    });
    sonrakiDugme(0, '');
  }
  function uzunBitti() {
    var rec = MiniOyun.setBest('harf-carki-uzun', run.puan);
    if (run.puan > save.uzunRekor) save.uzunRekor = run.puan;
    persist();
    hud();
    var w = run.L.kelimeler[0].w;
    MiniOyun.bitti({
      baslik: w + ' bulundu!',
      metin: Object.keys(run.bonus).length + ' kelime topladın · ' + run.puan + ' puan',
      rekor: rec,
      sonuc: run.puan + ' puan',
      skor: run.puan,
      seviye: 'uzun',
      paylas: 'Harf Çarkı Uzun Kelime modunda ' + run.puan + ' puan yaptım!'
    });
    sonrakiDugme(0, '');
  }
  // Oyun sonu penceresine "Sonraki bölüm" düğmesi
  function sonrakiDugme(no, not) {
    var dlg = document.querySelector('.oyun-sonu');
    if (!dlg) return;
    var b = dlg.querySelector('#hc-sonraki');
    if (!b) {
      b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.id = 'hc-sonraki';
      b.textContent = 'Sonraki bölüm ▶';
      b.addEventListener('click', function () { dlg.close(); if (b.dataset.no) basla('kampanya', Number(b.dataset.no), save.devam); });
      dlg.querySelector('.oyun-dlg-actions').prepend(b);
    }
    b.hidden = !no;
    b.dataset.no = no || '';
    var p = dlg.querySelector('.hc-sonu-not');
    if (!p) { p = document.createElement('p'); p.className = 'hc-sonu-not'; dlg.querySelector('.oyun-dlg-actions').insertAdjacentElement('beforebegin', p); }
    p.textContent = not;
    p.hidden = !not;
  }

  // ---------- Harita ----------
  function haritaGoster() {
    if (run && !run.bitti) devamKaydet();
    run = null;
    secim = [];
    oyunEl.hidden = true;
    ustEl.hidden = true;
    haritaEl.hidden = false;
    gorevHazirla();
    if (haritaTema === null) {
      haritaTema = 0;
      for (var t = 0; t < TEMALAR.length; t++) if (temaAcik(t)) haritaTema = t;
    }
    var h = '<div class="hc-ozet"><span id="h-jeton">🪙 ' + save.jeton + '</span><span>⭐ ' + toplamYildiz() + ' / 180</span><span id="h-sozluk">📖 Sözlüğüm: ' + save.kelimeler.length + ' kelime</span></div>';
    h += '<div class="hc-temalar">';
    TEMALAR.forEach(function (tm, t) {
      h += '<button type="button" class="hc-tema' + (t === haritaTema ? ' secili' : '') + (temaAcik(t) ? '' : ' kilitli') + '" data-tema="' + t + '">' + (temaAcik(t) ? tm.ikon : '🔒') + ' ' + tm.ad + '</button>';
    });
    h += '</div>';
    var tm = TEMALAR[haritaTema];
    h += '<h2>' + tm.ikon + ' ' + tm.ad + ' <small>⭐ ' + temaYildiz(haritaTema) + ' / 30' + (haritaTema < 5 ? ' · sonraki tema için ' + TEMA_YILDIZ + ' ⭐' : '') + '</small></h2>';
    if (!temaAcik(haritaTema)) h += '<p>🔒 Bu temayı açmak için ' + TEMALAR[haritaTema - 1].ad + ' temasında ' + TEMA_YILDIZ + ' yıldız topla.</p>';
    h += '<div class="hc-bolumler">';
    for (var n = haritaTema * 10 + 1; n <= haritaTema * 10 + 10; n++) {
      var acik = bolumAcik(n), y = save.bolumler[n] || 0;
      h += '<button type="button" class="hc-bolum' + (acik ? '' : ' kilitli') + '" data-bolum="' + n + '" style="--b1:' + tm.renk[0] + ';--b2:' + tm.renk[1] + '"' + (acik ? '' : ' disabled') + ' aria-label="Bölüm ' + n + (acik ? ', ' + y + ' yıldız' : ', kilitli') + '"><b>' + (acik ? n : '🔒') + '</b><span>' + (acik ? yildizYazi(y) : '&nbsp;') + '</span></button>';
    }
    h += '</div>';
    if (save.devam) h += '<p>⏸️ Yarım kalan bölüm: ' + save.devam.bolum + ' (kaldığın yerden devam eder)</p>';
    var bugun = MiniOyun.gunluk.bugun(), uzunAcik = bitenSayisi() >= UZUN_ACILIS;
    h += '<div class="hc-ekstra"><a class="btn" href="?gunluk=' + bugun + '">📅 Günlük bulmaca' + (save.gunluk.tarih === bugun ? ' ✅' : ' (+2 🪙)') + '</a>' +
      '<button type="button" class="btn btn-ghost" data-uzun="1"' + (uzunAcik ? '' : ' disabled') + '>🔤 Uzun Kelime' + (uzunAcik ? ' · rekor ' + MiniOyun.getBest('harf-carki-uzun') : ' (🔒 ' + UZUN_ACILIS + ' bölüm)') + '</button></div>';
    h += '<h2>📋 Günlük görevler</h2><ul class="hc-gorevler">';
    save.gorev.liste.forEach(function (id) {
      var m = gorev(id), tamam = save.gorev.tamam.indexOf(id) !== -1;
      h += '<li class="hc-gorev' + (tamam ? ' tamam' : '') + '">' + (tamam ? '✅ ' : '🎯 ') + m.ad + ' <small>' + Math.min(save.gorev.ilerleme[id] || 0, m.hedef) + '/' + m.hedef + ' · +' + m.odul + ' 🪙</small></li>';
    });
    h += '</ul><h2>🎡 Çark görünümü</h2><div class="hc-gorunumler">';
    Object.keys(GORUNUMLER).forEach(function (g) {
      var gr = GORUNUMLER[g], acik = save.acilan.indexOf(g) !== -1;
      h += '<button type="button" class="hc-gorunum' + (save.secili === g ? ' secili' : '') + '" data-gorunum="' + g + '" style="--s1:' + gr.renk[0] + ';--s2:' + gr.renk[1] + '"' + (acik ? '' : ' disabled title="Bir temayı tamamlayınca açılır"') + '><i></i>' + (acik ? '' : '🔒 ') + gr.ad + '</button>';
    });
    var sonraki = KOLEKSIYON.filter(function (k) { return save.koleksiyonOdul.indexOf(k[0]) === -1; })[0];
    h += '</div>' + (sonraki ? '<p>📖 Sözlüğünde ' + sonraki[0] + ' kelimeye ulaşınca +' + sonraki[1] + ' 🪙</p>' : '');
    haritaEl.innerHTML = h;
  }

  haritaEl.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.tema !== undefined) { haritaTema = Number(b.dataset.tema); haritaGoster(); }
    else if (b.dataset.bolum) basla('kampanya', Number(b.dataset.bolum), save.devam);
    else if (b.dataset.uzun) basla('uzun');
    else if (b.dataset.gorunum) { save.secili = b.dataset.gorunum; persist(); haritaGoster(); }
  });
  document.getElementById('harita-btn').addEventListener('click', function () {
    if (daily) { location.href = location.pathname; return; }
    haritaGoster();
  });

  // ---------- Girişler ----------
  function harfAt(x, y) {
    var el = document.elementFromPoint(x, y);
    if (el && el.classList && el.classList.contains('hc-harf')) return Number(el.dataset.i);
    // Harfin yakınındaysa (merkezden uzaklık) yine say
    var best = -1, bd = Infinity;
    harfEls.forEach(function (b, i) {
      var r = b.getBoundingClientRect(), dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2), d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    });
    var rr = harfEls[0] ? harfEls[0].getBoundingClientRect().width * 0.6 : 0;
    return bd <= rr * rr ? best : -1;
  }
  carkEl.addEventListener('pointerdown', function (e) {
    if (!oynuyor()) return;
    var t = e.target.closest('.hc-harf');
    if (!t) return;
    e.preventDefault();
    var i = Number(t.dataset.i);
    if (secim.indexOf(i) !== -1) {
      // Dokunma modu: son harfe tekrar dokunmak onu siler
      if (secim[secim.length - 1] === i) geri();
      return;
    }
    ekle(i);
    surukle = { id: e.pointerId, hareket: false };
    try { carkEl.setPointerCapture(e.pointerId); } catch (er) {}
  });
  carkEl.addEventListener('pointermove', function (e) {
    if (!surukle || e.pointerId !== surukle.id || !oynuyor()) return;
    var i = harfAt(e.clientX, e.clientY);
    if (i < 0) return;
    if (secim.length >= 2 && secim[secim.length - 2] === i) { geri(); surukle.hareket = true; }
    else if (secim.indexOf(i) === -1) { ekle(i); surukle.hareket = true; }
  });
  function birak(e) {
    if (!surukle || e.pointerId !== surukle.id) return;
    var h = surukle.hareket;
    surukle = null;
    if (h) gonder();
  }
  carkEl.addEventListener('pointerup', birak);
  carkEl.addEventListener('pointercancel', function (e) { if (surukle && e.pointerId === surukle.id) { surukle = null; secim = []; secimGoster(); } });
  document.getElementById('karistir').addEventListener('click', function () { this.blur(); if (oynuyor()) karistir(); });
  document.getElementById('karistir').addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  document.getElementById('sil').addEventListener('click', function () { if (oynuyor()) geri(); });
  document.getElementById('gonder').addEventListener('click', gonder);
  harfBtn.addEventListener('click', harfAc);
  kelimeBtn.addEventListener('click', kelimeAc);
  izgaraEl.addEventListener('click', function (e) {
    var d = e.target.closest('.hc-kare');
    if (!d || !oynuyor()) return;
    var adaylar = [];
    run.L.kelimeler.forEach(function (k, i) { if (!run.bulunan[k.w] && k.cells.indexOf(d.dataset.k) !== -1) adaylar.push(i); });
    if (!adaylar.length) { run.secKelime = -1; }
    else {
      var p = adaylar.indexOf(run.secKelime);
      run.secKelime = adaylar[(p + 1) % adaylar.length];
    }
    guncelleIzgara();
  });

  // Klavye: yakalama aşamasında dinlenir, böylece çarktaki P harfi duraklatma kısayoluna gitmez
  document.addEventListener('keydown', function (e) {
    if (!oynuyor() || e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'Enter') { e.preventDefault(); gonder(); return; }
    if (e.key === 'Backspace') { e.preventDefault(); geri(); return; }
    if (e.key === ' ') { e.preventDefault(); karistir(); return; }
    if (!e.key || e.key.length !== 1) return;
    var k = tr(e.key);
    var i = -1;
    run.L.harfler.forEach(function (h, j) { if (i === -1 && h === k && secim.indexOf(j) === -1) i = j; });
    if (i !== -1) { e.preventDefault(); e.stopPropagation(); ekle(i); return; }
    if (k === 'H' && run.L.harfler.indexOf('H') === -1) { e.preventDefault(); harfAc(); return; }
    if (run.L.harfler.indexOf(k) !== -1) { e.stopPropagation(); uyar(k + ' harflerinin hepsi kullanıldı'); }
  }, true);

  // Süre: oyun açıkken ve duraklatılmamışken saniye saniye artar
  setInterval(function () {
    if (!run || run.bitti || oyunEl.hidden || paused || document.hidden || MiniOyun.duraklatildi()) return;
    run.sure++;
    if (run.sure % 5 === 0) devamKaydet();
    hud();
  }, 1000);

  MiniOyun.oyun({
    restart: function () {
      if (!run) return haritaGoster();
      if (run.mod === 'kampanya') { save.devam = null; persist(); basla('kampanya', run.L.no); }
      else basla(run.mod);
    },
    pause: function () { paused = true; },
    resume: function () { paused = false; },
    canPause: function () { return !!run && !run.bitti && !oyunEl.hidden; },
    seviye: seviye
  });

  if (daily) basla('gunluk');
  else haritaGoster();
})();

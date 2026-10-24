(function () {
  // Mahjong: serbest ve aynı desenli iki taşı eşleştirip kaldır.
  // 4 dünya x 12 bölüm (her bölüm herkese aynı ve tersten kurulduğu için çözülebilir), yıldızlar, kalıcı araç stoğu
  // (ipucu, karıştır, geri al), kilitli taşlar, açılan taş setleri, serbest mod, günlük görevler ve
  // günlük modda (?gunluk=) herkese aynı tahta. Kayıt: mo_mahjong.
  var KEY = 'mo_mahjong';
  var M = window.MahjongMotor;
  var BOLUM_SAYI = M.BOLUM_SAYI;
  var BASLANGIC_ARAC = { ipucu: 3, karistir: 2, geri: 3 };
  var ARAC_AD = { ipucu: '💡 İpucu', karistir: '🔀 Karıştır', geri: '↩️ Geri al' };
  var CEZA = { ipucu: 15, karistir: 30, geri: 10 };
  var KOMBO_MS = 3000;
  var MEVSIM_IKON = ['🌸', '🌞', '🍂', '❄️'], CICEK_IKON = ['🌷', '🌻', '🌹', '🌼'];
  var SETLER = {
    meyve: { ad: 'Meyve', ikon: '🍎', yildiz: 0, d: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖'] },
    hayvan: { ad: 'Hayvan', ikon: '🐾', yildiz: 15, d: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦉', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐢', '🐍', '🦎', '🐙'] },
    rakam: { ad: 'Rakam ve Nokta', ikon: '🔢', yildiz: 40, d: null },
    dunya: { ad: 'Dünya', ikon: '🌍', yildiz: 70, d: ['🗼', '🗽', '🏰', '🕌', '⛩️', '🏯', '🗿', '🎡', '🎢', '🏛️', '⛲', '🌋', '🗻', '🏝️', '🏜️', '🏞️', '🌉', '🌁', '⛪', '🕍', '🛕', '🏟️', '🎠', '⛺', '🏕️', '🚂', '🚢', '✈️', '🚀', '🛸', '🚁', '⛵', '🚲', '🛶'] },
    urkunc: { ad: 'Ürkünç', ikon: '🎃', seri: 7, d: ['🎃', '👻', '💀', '🦇', '🕷️', '🕸️', '🧙', '🧛', '🧟', '🍬', '🍭', '🕯️', '🔮', '🌙', '⚰️', '🪦', '🦂', '🐺', '🍫', '🧹', '🗝️', '⚗️', '📜', '🌕', '🍄', '🐀', '🦴', '🐈', '👁️', '🧪', '🩸', '🪄', '🐛', '🦉'] }
  };
  var ALTIN_YILDIZ = 144;
  var SEMBOL = ['★', '♦', '♣', '♠', '♥', '◆', '●'];
  var NOKTA_RENK = ['#0f766e', '#b91c1c', '#1d4ed8'];
  var GOREVLER = [
    { id: 'kombo5', ad: '5 kombo yap', hedef: 5 },
    { id: 'ipucusuz2', ad: '2 bölümü ipucusuz bitir', hedef: 2 },
    { id: 'tas100', ad: '100 taş kaldır', hedef: 100 },
    { id: 'bolum3', ad: '3 bölüm bitir', hedef: 3 },
    { id: 'yildiz3', ad: 'Bir bölümü 3 yıldızla bitir', hedef: 1 },
    { id: 'gunluk', ad: 'Günlük Mahjong\'u çöz', hedef: 1 }
  ];
  var GOREV_ODUL = ['ipucu', 'karistir', 'geri'];

  var ustEl = document.getElementById('ust');
  var oyunEl = document.getElementById('oyun');
  var haritaEl = document.getElementById('harita');
  var sahneEl = document.getElementById('sahne');
  var tahtaEl = document.getElementById('tahta');
  var uyariEl = document.getElementById('uyari');
  var bandEl = document.getElementById('band');
  var bolumEl = document.getElementById('bolum');
  var sureEl = document.getElementById('sure');
  var kalanEl = document.getElementById('kalan');
  var olasiEl = document.getElementById('olasi');
  var olasiKutu = document.getElementById('olasi-kutu');
  var puanEl = document.getElementById('puan');
  var btn = { ipucu: document.getElementById('ipucu'), karistir: document.getElementById('karistir'), geri: document.getElementById('geri') };
  var karartmaBtn = document.getElementById('karartma');

  var daily = !!(MiniOyun.gunluk && MiniOyun.gunluk.tarih);
  var save = load();
  var run = null, haritaDunya = null, uyariT = null, ipucuT = null, olcek = 1;

  // ---------- Kayıt ----------
  function sayi(v, d) { v = Number(v); return isFinite(v) && v >= 0 ? Math.floor(v) : d; }
  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
    if (!s || typeof s !== 'object' || Array.isArray(s)) s = {};
    var b = {};
    if (s.bolumler && typeof s.bolumler === 'object') {
      for (var k in s.bolumler) {
        var n = Number(k), x = s.bolumler[k];
        if (n >= 1 && n <= BOLUM_SAYI && x && typeof x === 'object' && sayi(x.yildiz, 0) > 0) {
          b[n] = { yildiz: Math.min(3, sayi(x.yildiz, 1)), enIyiSn: sayi(x.enIyiSn, 0), enIyiPuan: sayi(x.enIyiPuan, 0) };
        }
      }
    }
    var a = s.arac && typeof s.arac === 'object' ? s.arac : BASLANGIC_ARAC;
    var serbest = {};
    if (s.serbest && typeof s.serbest === 'object') for (var d in s.serbest) if (M.dizilimBul(d) && sayi(s.serbest[d], 0) > 0) serbest[d] = sayi(s.serbest[d], 0);
    var g = s.gorev && typeof s.gorev === 'object' && Array.isArray(s.gorev.liste) && Array.isArray(s.gorev.tamam) ? s.gorev : null;
    if (g && (!g.ilerleme || typeof g.ilerleme !== 'object')) g.ilerleme = {};
    return {
      bolumler: b,
      arac: { ipucu: sayi(a.ipucu, 3), karistir: sayi(a.karistir, 2), geri: sayi(a.geri, 3) },
      set: SETLER[s.set] ? s.set : 'meyve',
      acikSetler: Array.isArray(s.acikSetler) ? s.acikSetler.filter(function (x) { return SETLER[x] || x === 'altin'; }) : ['meyve'],
      altin: s.altin === true,
      serbest: serbest,
      gorev: g,
      seri: sayi(s.seri, 0),
      sonGun: typeof s.sonGun === 'string' ? s.sonGun : '',
      karartma: s.karartma !== false,
      olasi: s.olasi !== false,
      gunluk: typeof s.gunluk === 'string' ? s.gunluk : ''
    };
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} }

  function yildizYazi(y) { return '⭐'.repeat(y) + '☆'.repeat(3 - y); }
  function sureYazi(sn) { return Math.floor(sn / 60) + ':' + ('0' + sn % 60).slice(-2); }
  function sureUzun(sn) { return sn >= 60 ? Math.floor(sn / 60) + ' dk ' + sn % 60 + ' sn' : sn + ' sn'; }
  function dunyaOf(no) { return Math.floor((no - 1) / 12); }
  function yildizOf(no) { return save.bolumler[no] ? save.bolumler[no].yildiz : 0; }
  function toplamYildiz() { var n = 0; for (var k in save.bolumler) n += save.bolumler[k].yildiz; return n; }
  function dunyaYildiz(w) { var n = 0; for (var i = w * 12 + 1; i <= w * 12 + 12; i++) n += yildizOf(i); return n; }
  function bitenSayisi() { return Object.keys(save.bolumler).length; }
  function dunyaAcik(w) { return w === 0 || (!!save.bolumler[w * 12] && toplamYildiz() >= M.DUNYALAR[w].yildiz); }
  function bolumAcik(no) {
    if (no < 1 || no > BOLUM_SAYI || !dunyaAcik(dunyaOf(no))) return false;
    return no % 12 === 1 || !!save.bolumler[no - 1];
  }
  function setAcik(id) { return save.acikSetler.indexOf(id) !== -1; }
  // Yıldız ve seri eşiklerini geçen setleri açar; açılanların adlarını döner
  function setleriGuncelle() {
    var yeni = [], y = toplamYildiz();
    for (var id in SETLER) {
      var s = SETLER[id];
      if (setAcik(id)) continue;
      if ((s.yildiz !== undefined && y >= s.yildiz) || (s.seri && save.seri >= s.seri)) { save.acikSetler.push(id); yeni.push(s.ikon + ' ' + s.ad + ' seti açıldı'); }
    }
    if (y >= ALTIN_YILDIZ && !setAcik('altin')) { save.acikSetler.push('altin'); yeni.push('✨ Altın taş kenarı açıldı'); }
    return yeni;
  }

  function uyar(t, kalici) {
    uyariEl.textContent = t;
    clearTimeout(uyariT);
    if (!kalici) uyariT = setTimeout(function () { uyariEl.textContent = ''; }, 2800);
  }

  // ---------- Günlük görevler ----------
  function gorevHazirla() {
    var bugun = MiniOyun.gunluk.bugun();
    if (save.gorev && save.gorev.gun === bugun) return;
    var rnd = MiniOyun.gunluk.rastgele(bugun + '/mahjong-gorev'), havuz = GOREVLER.slice(), liste = [];
    while (liste.length < 3) liste.push(havuz.splice(Math.floor(rnd() * havuz.length), 1)[0].id);
    save.gorev = { gun: bugun, liste: liste, ilerleme: {}, tamam: [], odul: false };
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
      var not = '🎯 Görev tamam: ' + m.ad;
      if (g.tamam.length === 3 && !g.odul) {
        g.odul = true;
        var tur = GOREV_ODUL[MiniOyun.gunluk.no(g.gun) % 3];
        save.arac[tur]++;
        // Seri: dün de üç görev bittiyse artar
        var dun = new Date(g.gun + 'T12:00:00');
        dun.setDate(dun.getDate() - 1);
        var dunS = dun.getFullYear() + '-' + ('0' + (dun.getMonth() + 1)).slice(-2) + '-' + ('0' + dun.getDate()).slice(-2);
        save.seri = save.sonGun === dunS ? save.seri + 1 : 1;
        save.sonGun = g.gun;
        not += ' · üç görev bitti: ' + ARAC_AD[tur] + ' +1 · seri ' + save.seri;
        setleriGuncelle().forEach(function (x) { not += ' · ' + x; });
      }
      uyar(not);
    }
    persist();
  }

  // ---------- Bölüm kurma ----------
  // mod: 'kampanya' (no), 'gunluk', 'serbest' (dizilim)
  function basla(mod, arg) {
    var o, rnd, ayar = null;
    if (mod === 'kampanya') {
      ayar = M.ayar(arg);
      o = ayar;
      rnd = MiniOyun.gunluk.rastgele('mahjong/bolum/' + arg);
    } else {
      rnd = MiniOyun.rastgele();
      var diz = arg;
      if (mod === 'gunluk') diz = M.DUNYALAR[1].dizilim[Math.floor(rnd() * 4)];
      var n = M.konumlar(diz).poz.length;
      o = { dizilim: diz, mevsim: true, desen: 30, kilit: 0, hedef: Math.round(n * 2.5 / 5) * 5 };
    }
    var k = M.kur(o, rnd);
    run = {
      mod: mod, ayar: ayar, o: o, rnd: rnd, L: k.L, v: k.v.slice(), desen: k.desen.slice(), kilit: k.kilit.slice(),
      bas: { desen: k.desen.slice(), kilit: k.kilit.slice() },
      sn: 0, ceza: 0, puan: 0, kombo: 0, sonEslesme: 0, secili: -1, imlec: -1, gecmis: [],
      kullan: { ipucu: 0, karistir: 0, geri: 0 }, gunlukKaristir: 1, bitti: false, ipucu: null, egitim: mod === 'kampanya' && arg === 1 ? 0 : -1,
      karartma: ayar ? (ayar.karartma ? save.karartma : false) : save.karartma, kaldirilan: 0
    };
    haritaEl.hidden = true;
    oyunEl.hidden = false;
    ustEl.hidden = false;
    bandEl.hidden = true;
    oyunEl.className = 'mj-oyun' + (ayar ? ' dunya-' + ayar.dunya : mod === 'gunluk' ? ' dunya-1' : '');
    if (mod === 'kampanya') {
      var d = M.DUNYALAR[ayar.dunya];
      var notlar = [d.ikon + ' ' + d.ad + ' · Bölüm ' + ayar.no + ' · ' + run.L.ad];
      if (ayar.no === 25) notlar.push('Yeni: 🔒 kilitli taşlar, yanındaki ya da üstündeki taş kalkınca açılır');
      if (ayar.no === 37) notlar.push('Gece Pazarı: karartma kapalı başlar');
      uyar(notlar.join(' · '), true);
      if (run.egitim === 0) egitimGoster();
    } else if (mod === 'gunluk') {
      uyar('📅 Günlük Mahjong · ' + MiniOyun.gunluk.tarih + ' · herkes aynı tahtayı çözer. İpucu +' + CEZA.ipucu + ' sn, tek karıştırma +' + CEZA.karistir + ' sn.', true);
    } else {
      uyar('🧩 Serbest oyun · ' + run.L.ad + ' · ipucu +' + CEZA.ipucu + ' sn, tek karıştırma +' + CEZA.karistir + ' sn', true);
    }
    ciz();
  }

  var EGITIM = [
    '1/4 · Yalnızca serbest taşlar seçilir: üstü boş ve sol ya da sağ yanı açık olan taşlar parlak görünür.',
    '2/4 · Şimdi aynı desenli başka bir serbest taşa dokun; ikisi birlikte kalkar.',
    '3/4 · Harika! Takılırsan 💡 İpucu eşleşen bir çifti gösterir.',
    '4/4 · Hamle kalmazsa 🔀 Karıştır kalan taşları çözülebilir biçimde yeniden dağıtır. Başarılar!'
  ];
  function egitimGoster() { if (run.egitim >= 0 && run.egitim < EGITIM.length) uyar('🎓 ' + EGITIM[run.egitim], true); }
  function egitimIlerle(adim) {
    if (run.egitim < 0 || run.egitim >= adim) return;
    run.egitim = adim;
    egitimGoster();
  }

  function seviye() {
    if (!run) return '';
    if (run.mod === 'gunluk') return 'günlük';
    if (run.mod === 'serbest') return 'serbest ' + run.L.id;
    return 'bölüm ' + run.ayar.no;
  }
  function serbestMi(i) { return M.serbest(run.L, run.v, i); }
  function secilebilir(i) { return serbestMi(i) && !run.kilit[i]; }
  function olasilar() { return M.hamleler(run.L, run.v, run.desen, run.kilit); }
  function kalan() { var n = 0; for (var i = 0; i < run.v.length; i++) if (run.v[i]) n++; return n; }
  function toplamSure() { return run.sn + run.ceza; }

  // ---------- Çizim ----------
  function desenHtml(c) {
    if (c >= M.CICEK) return CICEK_IKON[c - M.CICEK];
    if (c >= M.MEVSIM) return MEVSIM_IKON[c - M.MEVSIM];
    var s = SETLER[save.set];
    if (s.d) return s.d[c % s.d.length];
    // Rakam ve Nokta seti: 1-9 nokta, 1-9 çubuk, 1-9 rakam ve 7 sembol (CSS ile çizilir)
    if (c < 9) return '<span class="mj-nokta" style="--r:' + NOKTA_RENK[c % 3] + '">' + '<i></i>'.repeat(c + 1) + '</span>';
    if (c < 18) return '<span class="mj-cubuk">' + '<i></i>'.repeat(c - 8) + '</span>';
    if (c < 27) return '<span class="mj-rakam">' + (c - 17) + '</span>';
    return '<span class="mj-sembol">' + SEMBOL[(c - 27) % SEMBOL.length] + '</span>';
  }
  function olcu() {
    var L = run.L, kayma = 3, kolon = L.gen / 2;
    var gen = Math.max(200, sahneEl.clientWidth - 8);
    var tw = Math.max(16, Math.min(52, Math.floor((gen - L.kat * kayma - 4) / kolon)));
    tw = Math.round(tw * olcek);
    return { tw: tw, th: Math.round(tw * 4 / 3), kayma: kayma };
  }
  function ciz() {
    var L = run.L, o = olcu(), h = '';
    var ust = L.kat * o.kayma;
    tahtaEl.style.width = (L.gen / 2 * o.tw + ust + 6) + 'px';
    tahtaEl.style.height = (L.yuk / 2 * o.th + ust + 8) + 'px';
    tahtaEl.style.setProperty('--tw', o.tw + 'px');
    tahtaEl.classList.toggle('altin', save.altin && setAcik('altin'));
    L.poz.forEach(function (p, i) {
      if (!run.v[i]) return;
      var serb = serbestMi(i), kil = run.kilit[i];
      var cls = 'mj-tas' + (serb ? ' serbest' : '') + (!serb && run.karartma ? ' kapali' : '') + (kil ? ' kilitli' : '') +
        (i === run.secili ? ' secili' : '') + (i === run.imlec ? ' imlec' : '') + (run.ipucu && run.ipucu.indexOf(i) !== -1 ? ' ipucu' : '');
      h += '<button type="button" tabindex="-1" class="' + cls + '" data-i="' + i + '" data-d="' + run.desen[i] + '" data-z="' + p.z + '"' +
        ' style="left:' + (p.x / 2 * o.tw - p.z * o.kayma + ust) + 'px;top:' + (p.y / 2 * o.th - p.z * o.kayma + ust) + 'px;width:' + o.tw + 'px;height:' + o.th + 'px;z-index:' + (p.z * 1000 + p.y * 30 + p.x) + '"' +
        ' aria-label="Taş ' + (i + 1) + (serb ? '' : ', serbest değil') + (kil ? ', kilitli' : '') + '">' + desenHtml(run.desen[i]) + (kil ? '<span class="kilit">🔒</span>' : '') + '</button>';
    });
    tahtaEl.innerHTML = h;
    var ol = olasilar().length;
    tahtaEl.setAttribute('data-dizilim', L.id);
    tahtaEl.setAttribute('data-kalan', kalan());
    tahtaEl.setAttribute('data-olasi', ol);
    hud(ol);
  }
  function hud(ol) {
    if (!run) return;
    bolumEl.textContent = run.mod === 'kampanya' ? run.ayar.no : run.mod === 'gunluk' ? '📅' : '🧩';
    var t = toplamSure();
    sureEl.textContent = sureYazi(t) + ' / ' + sureYazi(run.o.hedef);
    sureEl.setAttribute('data-sn', t);
    sureEl.className = 'mj-sure ' + (t <= run.o.hedef ? 'iyi' : 'gec');
    kalanEl.textContent = kalan();
    if (ol !== undefined) olasiEl.textContent = ol;
    olasiKutu.hidden = !save.olasi;
    puanEl.textContent = run.puan;
    var kamp = run.mod === 'kampanya';
    ['ipucu', 'karistir', 'geri'].forEach(function (a) {
      var b = btn[a], stok = kamp ? save.arac[a] : a === 'karistir' ? run.gunlukKaristir : -1;
      b.textContent = ARAC_AD[a] + (stok >= 0 ? ' (' + stok + ')' : ' (+' + CEZA[a] + ' sn)');
      b.setAttribute('data-stok', stok);
      b.disabled = run.bitti || stok === 0 || (a === 'geri' && !run.gecmis.length);
    });
    karartmaBtn.textContent = '🌓 Karartma: ' + (run.karartma ? 'açık' : 'kapalı');
  }

  // ---------- Oynanış ----------
  function dokun(i) {
    if (!run || run.bitti || MiniOyun.duraklatildi() || !run.v[i]) return;
    if (!secilebilir(i)) { salla(i); if (run.kilit[i] && serbestMi(i)) uyar('🔒 Bu taş, yanındaki ya da üstündeki bir taş kalkınca açılır'); return; }
    run.imlec = i;
    if (run.secili === -1 || run.secili === i) {
      run.secili = run.secili === i ? -1 : i;
      MiniOyun.ses('tik');
      if (run.secili !== -1) egitimIlerle(1);
      ciz();
      return;
    }
    if (!M.eslesir(run.desen[run.secili], run.desen[i])) { run.secili = i; MiniOyun.ses('tik'); ciz(); return; }
    eslestir(run.secili, i);
  }
  function salla(i) {
    var el = tahtaEl.querySelector('[data-i="' + i + '"]');
    if (!el) return;
    el.classList.remove('salla');
    void el.offsetWidth;
    el.classList.add('salla');
  }
  function eslestir(a, b) {
    var simdi = Date.now();
    run.kombo = run.sonEslesme && simdi - run.sonEslesme <= KOMBO_MS ? Math.min(5, run.kombo + 1) : 1;
    run.sonEslesme = simdi;
    var kazanc = 10 * run.kombo;
    run.puan += kazanc;
    hayalet([a, b]);
    run.v[a] = run.v[b] = false;
    var acilan = M.kilitAc(run.L, run.kilit, [a, b]);
    run.gecmis.push({ a: a, b: b, acilan: acilan, puan: kazanc });
    run.secili = -1;
    if (run.imlec === a || run.imlec === b) run.imlec = -1;
    run.ipucu = null;
    run.kaldirilan += 2;
    egitimIlerle(run.kaldirilan >= 6 ? 3 : 2);
    if (run.kombo >= 2) {
      MiniOyun.ses('puan');
      uyar('🔥 Kombo x' + run.kombo + ' (+' + kazanc + ')');
      if (run.mod !== 'gunluk') gorevIlerle('kombo5', 1);
    } else MiniOyun.ses('tik');
    if (acilan.length) uyar('🔓 Kilitli taş açıldı!');
    if (run.mod !== 'gunluk') gorevIlerle('tas100', 2);
    if (!kalan()) return kazan();
    ciz();
    kilitlenmeKontrol();
  }
  // Kalkan taşların kısa solma animasyonu (tıklamaları engellemez)
  function hayalet(liste) {
    liste.forEach(function (i) {
      var el = tahtaEl.querySelector('[data-i="' + i + '"]');
      if (!el) return;
      var c = el.cloneNode(true);
      c.removeAttribute('data-i');
      c.className = 'mj-tas gidiyor';
      tahtaEl.appendChild(c);
      setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 230);
    });
  }
  function kilitlenmeKontrol() {
    if (olasilar().length) { bandEl.hidden = true; return; }
    var kamp = run.mod === 'kampanya';
    var karistirVar = kamp ? save.arac.karistir > 0 : run.gunlukKaristir > 0;
    var geriVar = run.gecmis.length > 0 && (!kamp || save.arac.geri > 0);
    if (!karistirVar && !geriVar) return kaybet();
    bandEl.hidden = false;
    document.getElementById('band-karistir').disabled = !karistirVar;
    document.getElementById('band-geri').disabled = !geriVar;
    MiniOyun.ses('kaybet');
    uyar('Hamle kalmadı! Karıştır, geri al ya da baştan başla.', true);
  }

  // Araç kullanımı: kampanyada stoktan düşer, günlük ve serbest modda süre cezası ekler.
  function aracKullan(a) {
    if (run.mod === 'kampanya') {
      if (save.arac[a] <= 0) { uyar(ARAC_AD[a] + ' stoğun bitti'); return false; }
      save.arac[a]--;
      persist();
    } else {
      if (a === 'karistir') {
        if (run.gunlukKaristir <= 0) { uyar('Karıştırma hakkın bitti'); return false; }
        run.gunlukKaristir--;
      }
      run.ceza += CEZA[a];
    }
    run.kullan[a]++;
    return true;
  }
  function ipucu() {
    if (!run || run.bitti || MiniOyun.duraklatildi()) return;
    var h = olasilar();
    if (!h.length) { kilitlenmeKontrol(); return; }
    if (!aracKullan('ipucu')) return;
    run.ipucu = h[Math.floor(Math.random() * h.length)];
    MiniOyun.ses('tik');
    clearTimeout(ipucuT);
    ipucuT = setTimeout(function () { if (run) { run.ipucu = null; if (!run.bitti && !oyunEl.hidden) ciz(); } }, 1500);
    ciz();
  }
  function karistir() {
    if (!run || run.bitti || MiniOyun.duraklatildi()) return;
    var k = M.karistir(run.L, run.v, run.desen, run.rnd);
    if (!k) { uyar('Karıştırılamadı, tekrar dene'); return; }
    if (!aracKullan('karistir')) return;
    run.desen = k.desen;
    run.kilit = run.kilit.map(function () { return false; });
    run.gecmis = [];
    run.secili = -1;
    run.ipucu = null;
    bandEl.hidden = true;
    MiniOyun.ses('puan');
    uyar('🔀 Taşlar karıştırıldı, kilitler açıldı');
    ciz();
    kilitlenmeKontrol();
  }
  function geriAl() {
    if (!run || run.bitti || MiniOyun.duraklatildi()) return;
    if (!run.gecmis.length) { uyar('Geri alınacak eşleşme yok'); return; }
    if (!aracKullan('geri')) return;
    var g = run.gecmis.pop();
    run.v[g.a] = run.v[g.b] = true;
    g.acilan.forEach(function (i) { run.kilit[i] = true; });
    run.puan -= g.puan;
    run.kaldirilan -= 2;
    run.kombo = 0;
    run.sonEslesme = 0;
    run.secili = -1;
    bandEl.hidden = true;
    MiniOyun.ses('tik');
    uyariEl.textContent = '';
    ciz();
    kilitlenmeKontrol();
  }
  function bastan() {
    if (!run) return;
    if (run.mod === 'kampanya') basla('kampanya', run.ayar.no);
    else if (run.mod === 'gunluk') basla('gunluk');
    else basla('serbest', run.L.id);
  }

  function kaybet() {
    run.bitti = true;
    bandEl.hidden = true;
    ciz();
    MiniOyun.bitti({
      baslik: 'Hamle kalmadı',
      metin: 'Eşleşecek serbest taş kalmadı ve karıştırma ya da geri alma hakkın yok. ' + kalan() + ' taş kaldı.',
      kaybetti: true,
      sonuc: 'çözülemedi',
      paylas: 'Mahjong\'da ' + seviye() + ' beni zorladı!'
    });
    sonrakiDugme(0, '');
  }

  function kazan() {
    run.bitti = true;
    bandEl.hidden = true;
    clearTimeout(ipucuT);
    run.ipucu = null;
    ciz();
    var sn = toplamSure();
    if (run.mod === 'gunluk') return gunlukBitti(sn);
    if (run.mod === 'serbest') return serbestBitti(sn);
    var A = run.ayar, no = A.no, araclar = run.kullan.ipucu + run.kullan.karistir + run.kullan.geri;
    var bonus = Math.max(0, A.hedef - sn) * 5;
    run.puan += bonus;
    var y = sn <= A.hedef ? (araclar === 0 ? 3 : 2) : 1;
    var eski = save.bolumler[no], notlar = [];
    var ilk3 = y === 3 && (!eski || eski.yildiz < 3);
    var ilkBitis = !eski;
    save.bolumler[no] = {
      yildiz: Math.max(y, eski ? eski.yildiz : 0),
      enIyiSn: eski && eski.enIyiSn ? Math.min(eski.enIyiSn, sn) : sn,
      enIyiPuan: Math.max(run.puan, eski ? eski.enIyiPuan : 0)
    };
    if (ilk3) { save.arac.ipucu++; notlar.push('3 yıldız ödülü: 💡 +1'); }
    if (ilkBitis && no % 12 === 0) {
      save.arac.ipucu += 2; save.arac.karistir += 2; save.arac.geri += 2;
      notlar.push('🏁 Dünya sonu ödülü: her araçtan +2');
    }
    notlar = notlar.concat(setleriGuncelle());
    persist();
    gorevIlerle('bolum3', 1);
    if (!run.kullan.ipucu) gorevIlerle('ipucusuz2', 1);
    if (y === 3) gorevIlerle('yildiz3', 1);
    var rec = MiniOyun.setBest('mahjong-' + no, sn, true);
    MiniOyun.bitti({
      baslik: 'Bölüm ' + no + ' tamam!',
      metin: yildizYazi(y) + ' · ' + sureUzun(sn) + ' (hedef ' + sureUzun(A.hedef) + ') · ' + run.puan + ' puan' + (bonus ? ' (süre bonusu +' + bonus + ')' : '') + (araclar ? ' · ' + araclar + ' araç kullanıldı' : '') + (notlar.length ? ' · ' + notlar.join(' · ') : ''),
      rekor: rec,
      sonuc: sureUzun(sn),
      skor: sn,
      paylas: 'Mahjong ' + no + '. bölümü ' + sureUzun(sn) + ' içinde ' + yildizYazi(y) + ' ile bitirdim!'
    });
    var sonraki = no < BOLUM_SAYI && bolumAcik(no + 1) ? no + 1 : 0, not = '';
    if (!sonraki && no < BOLUM_SAYI && no % 12 === 0) {
      var w = dunyaOf(no) + 1;
      not = M.DUNYALAR[w].ad + ' için toplam ' + M.DUNYALAR[w].yildiz + ' ⭐ gerekli (şu an ' + toplamYildiz() + ')';
    }
    sonrakiDugme(sonraki, not);
  }
  function gunlukBitti(sn) {
    var bugun = MiniOyun.gunluk.bugun(), not = '';
    if (MiniOyun.gunluk.tarih === bugun && save.gunluk !== bugun) {
      save.gunluk = bugun;
      persist();
      gorevIlerle('gunluk', 1);
    }
    var rec = MiniOyun.setBest('mahjong-gunluk', sn, true);
    MiniOyun.setBest('mahjong', sn, true);
    if (run.ceza) not = ' (' + run.ceza + ' sn ceza dahil)';
    MiniOyun.bitti({
      baslik: 'Günlük Mahjong tamam!',
      metin: run.L.ad + ' · ' + sureUzun(sn) + not + ' · ' + run.puan + ' puan',
      rekor: rec,
      sonuc: sureUzun(sn),
      skor: sn,
      paylas: 'Günlük Mahjong\'u ' + sureUzun(sn) + ' içinde çözdüm!'
    });
    sonrakiDugme(0, '');
  }
  function serbestBitti(sn) {
    var id = run.L.id, eski = save.serbest[id], rec = !eski || sn < eski;
    if (rec) save.serbest[id] = sn;
    persist();
    gorevIlerle('bolum3', 1);
    if (!run.kullan.ipucu) gorevIlerle('ipucusuz2', 1);
    MiniOyun.bitti({
      baslik: run.L.ad + ' çözüldü!',
      metin: sureUzun(sn) + (run.ceza ? ' (' + run.ceza + ' sn ceza dahil)' : '') + ' · en iyi ' + sureUzun(save.serbest[id]),
      rekor: rec,
      sonuc: sureUzun(sn),
      skor: sn,
      paylas: 'Mahjong ' + run.L.ad + ' dizilimini ' + sureUzun(sn) + ' içinde çözdüm!'
    });
    sonrakiDugme(0, '');
  }
  // Oyun sonu penceresine "Sonraki bölüm" düğmesi
  function sonrakiDugme(sonraki, not) {
    var dlg = document.querySelector('.oyun-sonu');
    if (!dlg) return;
    var b = dlg.querySelector('#mj-sonraki');
    if (!b) {
      b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.id = 'mj-sonraki';
      b.textContent = 'Sonraki bölüm ▶';
      b.addEventListener('click', function () { dlg.close(); basla('kampanya', Number(b.dataset.no)); });
      dlg.querySelector('.oyun-dlg-actions').prepend(b);
    }
    b.hidden = !sonraki;
    b.dataset.no = sonraki || '';
    var p = dlg.querySelector('.mj-sonu-not');
    if (!p) { p = document.createElement('p'); p.className = 'mj-sonu-not'; dlg.querySelector('.oyun-dlg-actions').insertAdjacentElement('beforebegin', p); }
    p.textContent = not;
    p.hidden = !not;
  }

  // ---------- Harita ----------
  function acikDizilimler() {
    var l = [];
    for (var no = 1; no <= BOLUM_SAYI; no++) {
      if (!save.bolumler[no]) continue;
      var d = M.ayar(no).dizilim;
      if (l.indexOf(d) === -1) l.push(d);
    }
    return l;
  }
  function haritaGoster() {
    if (run && run.bitti) run = null;
    if (run) run.secili = -1;
    oyunEl.hidden = true;
    ustEl.hidden = true;
    haritaEl.hidden = false;
    gorevHazirla();
    if (setleriGuncelle().length) persist();
    if (haritaDunya === null) {
      haritaDunya = 0;
      for (var w = 0; w < M.DUNYALAR.length; w++) if (dunyaAcik(w)) haritaDunya = w;
    }
    var h = '<div class="mj-ozet"><span id="h-yildiz">⭐ ' + toplamYildiz() + ' / 144</span><span>✅ ' + bitenSayisi() + ' / ' + BOLUM_SAYI + ' bölüm</span></div>';
    h += '<div class="mj-ozet" id="h-arac"><span>💡 ' + save.arac.ipucu + '</span><span>🔀 ' + save.arac.karistir + '</span><span>↩️ ' + save.arac.geri + '</span></div>';
    if (run && run.mod === 'kampanya') h += '<p>Yarım kalan bölüm: ' + run.ayar.no + ' (dokununca kaldığın yerden devam eder)</p>';
    h += '<div class="mj-dunyalar">';
    M.DUNYALAR.forEach(function (d, w) {
      var acik = dunyaAcik(w);
      h += '<button type="button" class="mj-dunya' + (w === haritaDunya ? ' secili' : '') + (acik ? '' : ' kilitli') + '" data-dunya="' + w + '">' + (acik ? d.ikon : '🔒') + ' ' + d.ad + '</button>';
    });
    h += '</div>';
    var D = M.DUNYALAR[haritaDunya];
    h += '<h2>' + D.ikon + ' ' + D.ad + ' <small>⭐ ' + dunyaYildiz(haritaDunya) + ' / 36</small></h2>';
    if (!dunyaAcik(haritaDunya)) {
      h += '<p>🔒 Açmak için ' + M.DUNYALAR[haritaDunya - 1].ad + ' dünyasının 12. bölümünü bitir ve toplam ' + D.yildiz + ' ⭐ topla (şu an ' + toplamYildiz() + ').</p>';
    }
    h += '<div class="mj-bolumler">';
    for (var i = haritaDunya * 12 + 1; i <= haritaDunya * 12 + 12; i++) {
      var y = yildizOf(i), acikB = bolumAcik(i);
      h += '<button type="button" class="mj-bolum' + (acikB ? '' : ' kilitli') + '" data-bolum="' + i + '"' + (acikB ? '' : ' disabled') + ' aria-label="Bölüm ' + i + (acikB ? ', ' + y + ' yıldız' : ', kilitli') + '">' +
        '<b>' + i + '</b><span>' + (acikB ? (y ? '⭐'.repeat(y) : '·') : '🔒') + '</span></button>';
    }
    h += '</div>';
    h += '<div class="mj-ekstra"><a class="btn btn-ghost" href="?gunluk=' + MiniOyun.gunluk.bugun() + '">📅 Günlük Mahjong' + (save.gunluk === MiniOyun.gunluk.bugun() ? ' ✓' : '') + '</a></div>';
    var diz = acikDizilimler();
    h += '<h2>🧩 Serbest oyun <small>' + (diz.length ? 'bitirdiğin bölümlerin dizilimleri' : 'bir bölüm bitirince açılır') + '</small></h2><div class="mj-ekstra" id="h-serbest">';
    diz.forEach(function (d) {
      var en = save.serbest[d];
      h += '<button type="button" class="btn btn-ghost" data-serbest="' + d + '">' + M.konumlar(d).ad + (en ? ' · ' + sureYazi(en) : '') + '</button>';
    });
    h += '</div>';
    h += '<h2>🀄 Taş setleri</h2><div class="mj-setler">';
    for (var id in SETLER) {
      var s = SETLER[id], acikS = setAcik(id), kosul = s.seri ? s.seri + ' günlük görev serisi' : s.yildiz + ' ⭐';
      h += '<button type="button" class="mj-set' + (save.set === id ? ' secili' : '') + (acikS ? '' : ' kilitli') + '" data-set="' + id + '"' + (acikS ? '' : ' disabled') + '>' +
        (acikS ? s.ikon : '🔒') + ' ' + s.ad + (acikS ? '' : ' <small>(' + kosul + ')</small>') + '</button>';
    }
    h += '</div><div class="mj-ayar">';
    h += '<label><input type="checkbox" id="ayar-karartma"' + (save.karartma ? ' checked' : '') + '> Serbest olmayan taşları karart</label>';
    h += '<label><input type="checkbox" id="ayar-olasi"' + (save.olasi ? ' checked' : '') + '> Olası eşleşme sayısını göster</label>';
    h += '<label' + (setAcik('altin') ? '' : ' title="' + ALTIN_YILDIZ + ' ⭐ ile açılır"') + '><input type="checkbox" id="ayar-altin"' + (save.altin ? ' checked' : '') + (setAcik('altin') ? '' : ' disabled') + '> ✨ Altın taş kenarı' + (setAcik('altin') ? '' : ' (144 ⭐)') + '</label>';
    h += '</div>';
    h += '<h2>🎯 Bugünün görevleri <small>üçü bitince bir araç · seri ' + save.seri + ' gün</small></h2><ul class="mj-gorevler">';
    save.gorev.liste.forEach(function (gid) {
      var m = gorevBul(gid), tamam = save.gorev.tamam.indexOf(gid) !== -1, il = Math.min(m.hedef, save.gorev.ilerleme[gid] || 0);
      h += '<li class="mj-gorev' + (tamam ? ' tamam' : '') + '" data-gorev="' + gid + '">' + (tamam ? '✅ ' : '▫️ ') + m.ad + ' <small>' + (tamam ? 'tamamlandı' : il + '/' + m.hedef) + '</small></li>';
    });
    h += '</ul>';
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
      if (run && run.mod === 'kampanya' && run.ayar.no === no && !run.bitti) {
        haritaEl.hidden = true; oyunEl.hidden = false; ustEl.hidden = false; ciz();
      } else basla('kampanya', no);
    } else if (b.hasAttribute('data-serbest')) {
      basla('serbest', b.getAttribute('data-serbest'));
    } else if (b.hasAttribute('data-set')) {
      save.set = b.getAttribute('data-set');
      persist();
      haritaGoster();
    }
  });
  haritaEl.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'ayar-karartma') save.karartma = t.checked;
    else if (t.id === 'ayar-olasi') save.olasi = t.checked;
    else if (t.id === 'ayar-altin') save.altin = t.checked;
    else return;
    persist();
  });

  document.getElementById('harita-btn').addEventListener('click', function () {
    if (daily) { location.href = location.pathname; return; }
    haritaGoster();
  });
  tahtaEl.addEventListener('click', function (e) {
    var b = e.target.closest('.mj-tas');
    if (!b || !b.hasAttribute('data-i')) return;
    dokun(Number(b.getAttribute('data-i')));
  });
  btn.ipucu.addEventListener('click', ipucu);
  btn.karistir.addEventListener('click', karistir);
  btn.geri.addEventListener('click', geriAl);
  document.getElementById('band-karistir').addEventListener('click', karistir);
  document.getElementById('band-geri').addEventListener('click', geriAl);
  document.getElementById('band-bastan').addEventListener('click', function () { if (!MiniOyun.duraklatildi()) bastan(); });
  document.getElementById('kucult').addEventListener('click', function () { olcek = Math.max(0.7, Math.round((olcek - 0.1) * 10) / 10); if (run) ciz(); });
  document.getElementById('buyut').addEventListener('click', function () { olcek = Math.min(1.4, Math.round((olcek + 0.1) * 10) / 10); if (run) ciz(); });
  karartmaBtn.addEventListener('click', function () {
    if (!run) return;
    run.karartma = !run.karartma;
    if (run.mod !== 'kampanya' || run.ayar.karartma) { save.karartma = run.karartma; persist(); }
    ciz();
  });
  var boyutT = null;
  window.addEventListener('resize', function () { clearTimeout(boyutT); boyutT = setTimeout(function () { if (run && !oyunEl.hidden) ciz(); }, 150); });

  // Klavye: oklar imleci serbest taşlar arasında en yakın yöne taşır
  function imlecTasi(dx, dy) {
    var L = run.L, adaylar = [];
    for (var i = 0; i < L.poz.length; i++) if (run.v[i] && secilebilir(i)) adaylar.push(i);
    if (!adaylar.length) return;
    if (run.imlec < 0 || !run.v[run.imlec] || !secilebilir(run.imlec)) { run.imlec = adaylar[0]; ciz(); return; }
    var p = L.poz[run.imlec], en = -1, enP = Infinity;
    adaylar.forEach(function (j) {
      if (j === run.imlec) return;
      var q = L.poz[j], ax = q.x - p.x, ay = (q.y - p.y) * 4 / 3;
      var ileri = ax * dx + ay * dy, yan = Math.abs(ax * dy) + Math.abs(ay * dx);
      if (ileri <= 0) return;
      var puan = ileri + yan * 2 + Math.abs(q.z - p.z) * 0.1;
      if (puan < enP) { enP = puan; en = j; }
    });
    if (en >= 0) { run.imlec = en; MiniOyun.ses('tik'); }
    ciz();
  }
  var YON = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  document.addEventListener('keydown', function (e) {
    if (!run || oyunEl.hidden || MiniOyun.duraklatildi() || e.altKey || e.metaKey) return;
    var k = (e.key || '').toUpperCase();
    if (k === 'Z') { e.preventDefault(); geriAl(); return; }
    if (e.ctrlKey) return;
    if (YON[e.key]) { e.preventDefault(); imlecTasi(YON[e.key][0], YON[e.key][1]); return; }
    if ((e.key === 'Enter' || e.key === ' ') && run.imlec >= 0 && !(e.target && e.target.closest && e.target.closest('button, a, input'))) { e.preventDefault(); dokun(run.imlec); return; }
    if (k === 'H') { e.preventDefault(); ipucu(); return; }
    if (k === 'S') { e.preventDefault(); karistir(); }
  });

  // Süre: oyun açıkken ve duraklatılmamışken her saniye ilerler
  setInterval(function () {
    if (!run || run.bitti || oyunEl.hidden || MiniOyun.duraklatildi()) return;
    run.sn++;
    hud();
  }, 1000);

  MiniOyun.oyun({
    restart: function () {
      if (!run) return haritaGoster();
      bastan();
    },
    pause: function () {},
    resume: function () {},
    canPause: function () { return !!run && !run.bitti && !oyunEl.hidden; },
    seviye: seviye
  });

  if (daily) basla('gunluk');
  else haritaGoster();
})();

(function () {
  // Blok Bulmaca: alttaki üç parçayı 8x8 ızgaraya yerleştir, dolan satır ve sütunları patlat.
  // Klasik (Kolay/Normal, sonsuz), 45 bölümlük macera (3 dünya, puan/💎/🔒 hedefleri, hamle sınırı, 1-3 yıldız),
  // yıldızla açılan blok temaları, yardımcı haklar (Yenile, Sil), klasik puan rozetleri ve günlük modda (?gunluk=)
  // herkese aynı başlangıç ızgarası ile parça dizisi. Kayıt: mo_blok.
  var KEY = 'mo_blok';
  var M = window.BlokBulmacaMotor;
  var N = M.N, BOLUM_SAYI = M.BOLUM_SAYI, DUNYA_YILDIZ = 30, HAK_UST = 5, GUNLUK_DESEN = 0.12;
  var TEMALAR = {
    klasik: { ad: 'Klasik', ikon: '🟦', yildiz: 0, renk: ['#ef4444', '#f97316', '#facc15', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7'] },
    seker: { ad: 'Şeker', ikon: '🍬', yildiz: 15, renk: ['#fb7185', '#f9a8d4', '#fde68a', '#86efac', '#7dd3fc', '#c4b5fd', '#fdba74'] },
    ahsap: { ad: 'Ahşap', ikon: '🪵', yildiz: 40, renk: ['#92400e', '#b45309', '#d97706', '#a16207', '#78350f', '#c2410c', '#854d0e'] },
    neon: { ad: 'Neon', ikon: '💡', yildiz: 70, renk: ['#f0abfc', '#22d3ee', '#a3e635', '#facc15', '#fb7185', '#818cf8', '#2dd4bf'] },
    gece: { ad: 'Gece', ikon: '🌙', yildiz: 100, renk: ['#1e3a8a', '#312e81', '#4c1d95', '#0f766e', '#1e40af', '#5b21b6', '#155e75'] }
  };
  var ROZETLER = [1000, 2500, 5000, 10000];
  var ZORLUK = { kolay: 'Kolay', normal: 'Normal' };

  var ustEl = document.getElementById('ust');
  var oyunEl = document.getElementById('oyun');
  var haritaEl = document.getElementById('harita');
  var izEl = document.getElementById('izgara');
  var yuvaEl = document.getElementById('yuvalar');
  var uyariEl = document.getElementById('uyari');
  var hedefEl = document.getElementById('hedef');
  var puanEl = document.getElementById('puan');
  var hamleEl = document.getElementById('hamle');
  var rekorEl = document.getElementById('rekor');
  var yenileBtn = document.getElementById('yenile');
  var silBtn = document.getElementById('sil');
  var bastanBtn = document.getElementById('bastan');

  var daily = !!(MiniOyun.gunluk && MiniOyun.gunluk.tarih);
  var save = load();
  var run = null, secili = -1, imlec = [0, 0], klavye = false, suruk = null, haritaDunya = null, uyariT = null;

  // ---------- Kayıt ----------
  function sayi(v, d) { v = Number(v); return isFinite(v) && v >= 0 ? Math.floor(v) : d; }
  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
    if (!s || typeof s !== 'object' || Array.isArray(s)) s = {};
    var y = {};
    if (s.yildiz && typeof s.yildiz === 'object') {
      for (var k in s.yildiz) {
        var n = Number(k), v = sayi(s.yildiz[k], 0);
        if (n >= 1 && n <= BOLUM_SAYI && v > 0) y[n] = Math.min(3, v);
      }
    }
    var hak = s.hak && typeof s.hak === 'object' ? s.hak : {};
    return {
      v: 1,
      yildiz: y,
      tema: TEMALAR[s.tema] ? s.tema : 'klasik',
      acikTemalar: Array.isArray(s.acikTemalar) ? s.acikTemalar.filter(function (t) { return TEMALAR[t]; }) : ['klasik'],
      hak: { yenile: Math.min(HAK_UST, sayi(hak.yenile, 1)), sil: Math.min(HAK_UST, sayi(hak.sil, 1)) },
      rozetler: Array.isArray(s.rozetler) ? s.rozetler.filter(function (r) { return ROZETLER.indexOf(r) !== -1; }) : []
    };
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} }

  function yildizYazi(y) { return '⭐'.repeat(y) + '☆'.repeat(3 - y); }
  function dunyaOf(no) { return Math.floor((no - 1) / 15); }
  function dunyaYildiz(w) { var n = 0; for (var i = w * 15 + 1; i <= w * 15 + 15; i++) n += save.yildiz[i] || 0; return n; }
  function toplamYildiz() { var n = 0; for (var k in save.yildiz) n += save.yildiz[k]; return n; }
  function dunyaAcik(w) { return w === 0 || dunyaYildiz(w - 1) >= DUNYA_YILDIZ; }
  function bolumAcik(no) {
    if (no < 1 || no > BOLUM_SAYI || !dunyaAcik(dunyaOf(no))) return false;
    return no % 15 === 1 || !!save.yildiz[no - 1];
  }
  // Toplam yıldızla açılan temaları kaydeder, yeni açılanların adlarını döner
  function temaKontrol() {
    var yeni = [], t = toplamYildiz();
    for (var id in TEMALAR) {
      if (t >= TEMALAR[id].yildiz && save.acikTemalar.indexOf(id) === -1) { save.acikTemalar.push(id); yeni.push(TEMALAR[id].ad); }
    }
    return yeni;
  }
  function renk(r) { return TEMALAR[save.tema].renk[(r - 1) % 7]; }

  function uyar(t, kalici) {
    uyariEl.textContent = t;
    clearTimeout(uyariT);
    if (!kalici) uyariT = setTimeout(function () { uyariEl.textContent = ''; }, 2800);
  }

  // ---------- Oyun kurma ----------
  // mod: 'macera' (bölüm no), 'klasik' (zorluk), 'gunluk'
  function basla(mod, arg) {
    var L = null, iz, rnd = MiniOyun.rastgele();
    if (mod === 'macera') {
      L = M.ayar(arg);
      iz = M.bolumIzgara(arg);
    } else if (mod === 'gunluk') {
      iz = M.izgaraUret({ desen: GUNLUK_DESEN }, rnd);
    } else {
      iz = M.bosIzgara();
    }
    run = {
      mod: mod, L: L, zorluk: mod === 'klasik' ? arg : 'normal', iz: iz, rnd: rnd, parcalar: [null, null, null],
      puan: 0, seri: 0, hamle: 0, elmas: 0, kilit: 0, bitti: false, silModu: false
    };
    secili = -1;
    suruk = null;
    yeniUclu();
    haritaEl.hidden = true;
    oyunEl.hidden = false;
    ustEl.hidden = false;
    oyunEl.className = 'bb-oyun tema-' + save.tema + (L ? ' dunya-' + L.dunya : '');
    if (mod === 'macera') {
      var d = M.DUNYALAR[L.dunya], notlar = [d.ikon + ' ' + d.ad + ' · Bölüm ' + L.no + ' · ' + hedefYazi(true)];
      if (L.no === 1) notlar.push('Parçayı sürükleyip ızgaraya bırak; dolan satır ve sütun patlar');
      if (L.no === 16) notlar.push('Yeni: 💎 bulunduğu hattı doldurup patlatınca toplanır');
      if (L.no === 31) notlar.push('Yeni: 🔒 kilitli hücre iki kez temizlenince kaybolur');
      uyar(notlar.join(' · '), true);
    } else if (mod === 'gunluk') {
      uyar('📅 Günlük bulmaca · ' + MiniOyun.gunluk.tarih + ' · herkese aynı ızgara ve parçalar', true);
    } else {
      uyar('♾️ Klasik mod · ' + ZORLUK[arg] + ' · parça sığmayana kadar devam', true);
    }
    ciz();
    // Izgara altındaki parça yuvaları görünür alanda kalsın
    var yuvalar = document.getElementById('yuvalar');
    if (yuvalar.scrollIntoView) yuvalar.scrollIntoView({ block: 'nearest' });
  }
  function yeniUclu() {
    var zor = run.mod === 'macera' ? Math.min(1, run.L.dunya * 0.35) : Math.min(1, run.puan / 2500);
    var kolay = run.mod === 'macera' ? !!run.L.kolay : run.zorluk === 'kolay';
    run.parcalar = [0, 1, 2].map(function () { return M.parca(run.rnd, zor, kolay); });
  }
  function seviye() {
    if (!run) return '';
    if (run.mod === 'gunluk') return 'gunluk';
    if (run.mod === 'klasik') return 'klasik-' + run.zorluk;
    return 'bölüm ' + run.L.no;
  }
  function rekorKey() {
    if (!run) return '';
    if (run.mod === 'macera') return 'blok-bulmaca-' + run.L.no;
    if (run.mod === 'gunluk') return 'blok-bulmaca-gunluk';
    return run.zorluk === 'kolay' ? 'blok-bulmaca-kolay' : 'blok-bulmaca';
  }
  function hedefYazi(kisa) {
    var g = run.L.hedef, p = [];
    if (g.puan) p.push(kisa ? g.puan + ' puan' : Math.min(run.puan, g.puan) + '/' + g.puan + ' puan');
    if (g.elmas) p.push('💎 ' + (kisa ? g.elmas : Math.min(run.elmas, g.elmas) + '/' + g.elmas));
    if (g.kilit) p.push('🔒 ' + (kisa ? g.kilit : Math.min(run.kilit, g.kilit) + '/' + g.kilit));
    return (kisa ? 'Hedef: ' : '') + p.join(' · ') + (kisa ? ' · ' + run.L.hamle + ' hamle' : '');
  }
  function hedefTamam() {
    var g = run.L.hedef;
    return (!g.puan || run.puan >= g.puan) && (!g.elmas || run.elmas >= g.elmas) && (!g.kilit || run.kilit >= g.kilit);
  }
  function sigan() {
    return run.parcalar.some(function (p) { return p && M.sigarMi(run.iz, p.s); });
  }

  // ---------- Çizim ----------
  function parcaHtml(p, cls) {
    var S = M.SEKILLER[p.s], h = '<span class="bb-parca' + (cls || '') + '" style="--py:' + S.y + ';--px:' + S.g + '">';
    S.h.forEach(function (x) { h += '<i style="grid-row:' + (x[0] + 1) + ';grid-column:' + (x[1] + 1) + ';--c:' + renk(p.r) + '"></i>'; });
    return h + '</span>';
  }
  function ciz() {
    var iz = run.iz, h = '';
    for (var i = 0; i < N * N; i++) {
      var r = iz.h[i];
      h += '<div class="bb-h' + (r ? ' d' : '') + (iz.e[i] ? ' elmas' : '') + (iz.k[i] ? ' kilit k' + iz.k[i] : '') + '" data-i="' + i + '"' + (r ? ' style="--c:' + renk(r) + '"' : '') + '>' +
        (iz.e[i] ? '💎' : iz.k[i] === 2 ? '🔒' : iz.k[i] === 1 ? '🔓' : '') + '</div>';
    }
    izEl.innerHTML = h;
    izEl.classList.toggle('sil-modu', run.silModu);
    izEl.setAttribute('data-dolu', iz.h.filter(Boolean).length);
    var y = '';
    run.parcalar.forEach(function (p, i) {
      var ok = p && M.sigarMi(iz, p.s);
      y += '<button type="button" class="bb-yuva' + (i === secili ? ' secili' : '') + (p && !ok ? ' sigmaz' : '') + '" data-i="' + i + '"' + (p ? ' data-s="' + p.s + '"' : ' disabled') +
        ' aria-label="Parça ' + (i + 1) + (p ? '' : ', yerleştirildi') + '">' + (p ? parcaHtml(p) : '') + '<small>' + (i + 1) + '</small></button>';
    });
    yuvaEl.innerHTML = y;
    onizle();
    hud();
  }
  function hud() {
    if (!run) return;
    puanEl.textContent = run.puan;
    puanEl.setAttribute('data-puan', run.puan);
    if (run.mod === 'macera') {
      hamleEl.textContent = Math.max(0, run.L.hamle - run.hamle);
      hedefEl.textContent = hedefYazi(false);
    } else {
      hamleEl.textContent = run.hamle;
      hedefEl.textContent = run.mod === 'gunluk' ? '📅 Günlük' : '♾️ ' + ZORLUK[run.zorluk];
    }
    hamleEl.setAttribute('data-hamle', run.hamle);
    document.getElementById('hamle-etiket').textContent = run.mod === 'macera' ? 'Kalan hamle' : 'Hamle';
    var rk = rekorKey();
    rekorEl.textContent = MiniOyun.getBest(rk) || '-';
    var macera = run.mod === 'macera';
    yenileBtn.hidden = silBtn.hidden = !macera;
    yenileBtn.textContent = '🔀 Yenile (' + save.hak.yenile + ')';
    silBtn.textContent = (run.silModu ? '✖ Vazgeç' : '🧹 Sil') + ' (' + save.hak.sil + ')';
    yenileBtn.disabled = !save.hak.yenile || run.bitti;
    silBtn.disabled = (!save.hak.sil && !run.silModu) || run.bitti;
    yenileBtn.setAttribute('data-hak', save.hak.yenile);
    silBtn.setAttribute('data-hak', save.hak.sil);
  }

  // Seçili/sürüklenen parçanın yerleşeceği hücreleri ve temizlenecek hatları gösterir
  function onizle(pi, r, c) {
    var eski = izEl.querySelectorAll('.oz, .oz-hat, .imlec');
    for (var k = 0; k < eski.length; k++) eski[k].classList.remove('oz', 'oz-hat', 'imlec');
    izEl.removeAttribute('data-onizle');
    if (pi === undefined) {
      if (secili === -1 || !klavye) return;
      pi = secili; r = imlec[0]; c = imlec[1];
    }
    var p = run.parcalar[pi];
    if (!p || !M.sigar(run.iz, p.s, r, c)) {
      if (klavye && pi === secili) { var hc = izEl.children[r * N + c]; if (hc) hc.classList.add('imlec'); }
      return;
    }
    var hucre = izEl.children;
    M.temizlenecek(run.iz, p.s, r, c).forEach(function (t) {
      M.hatHucreleri(t).forEach(function (x) { hucre[x].classList.add('oz-hat'); });
    });
    M.SEKILLER[p.s].h.forEach(function (x) {
      var el = hucre[(r + x[0]) * N + c + x[1]];
      el.classList.add('oz');
      el.style.setProperty('--oc', renk(p.r));
    });
    izEl.setAttribute('data-onizle', r + ',' + c);
  }

  // ---------- Oynanış ----------
  function yerlestir(pi, r, c) {
    if (!run || run.bitti || MiniOyun.duraklatildi()) return false;
    var p = run.parcalar[pi];
    if (!p || !M.sigar(run.iz, p.s, r, c)) return false;
    var renkler = run.iz.h.slice();
    var s = M.yerlestir(run.iz, p, r, c, run.seri);
    run.seri = s.seri;
    run.puan += s.puan;
    run.elmas += s.elmas;
    run.kilit += s.kilit;
    run.hamle++;
    run.parcalar[pi] = null;
    secili = -1;
    if (!run.parcalar.some(Boolean)) yeniUclu();
    ciz();
    izEl.setAttribute('data-son', s.hat ? 'hat-' + s.hat : 'yerlesti');
    if (s.hat) {
      patlat(s.hucreler, renkler, p);
      MiniOyun.ses('puan');
      var yazi = s.hat >= 4 ? 'İnanılmaz!' : s.hat === 3 ? 'Muhteşem!' : s.hat === 2 ? 'Harika!' : '';
      if (s.seri >= 2) yazi += (yazi ? ' ' : '') + 'Seri x' + s.seri;
      if (yazi) parlat(yazi + ' +' + s.puan);
    } else MiniOyun.ses('tik');
    if (s.elmas) uyar('💎 +' + s.elmas + ' elmas');
    if (s.kilit) uyar('🔓 +' + s.kilit + ' kilit kırıldı');
    sonKontrol();
    return true;
  }
  function patlat(hucreler, renkler, p) {
    hucreler.forEach(function (x) {
      var el = izEl.children[x];
      el.classList.add('patla');
      el.style.setProperty('--c', renk(renkler[x] || p.r));
    });
    setTimeout(function () {
      for (var i = 0; i < hucreler.length; i++) {
        var el = izEl.children[hucreler[i]];
        if (el && el.classList.contains('patla')) { el.classList.remove('patla'); if (!run.iz.h[hucreler[i]]) el.style.removeProperty('--c'); }
      }
    }, 380);
  }
  function parlat(t) {
    var el = document.getElementById('yazi');
    el.textContent = t;
    el.classList.remove('goster');
    void el.offsetWidth;
    el.classList.add('goster');
  }
  function sonKontrol() {
    if (run.mod === 'macera') {
      if (hedefTamam()) return kazan();
      if (run.hamle >= run.L.hamle) return kaybet('Hamlelerin bitti.');
      if (!sigan()) {
        if (save.hak.yenile || save.hak.sil) uyar('Sığan parça yok! 🔀 Yenile veya 🧹 Sil hakkını kullan.', true);
        else kaybet('Sığan parça kalmadı.');
      }
      return;
    }
    if (!sigan()) klasikBitti();
  }

  function yenile() {
    if (!run || run.bitti || run.mod !== 'macera' || !save.hak.yenile || MiniOyun.duraklatildi()) return;
    var kalan = [];
    run.parcalar.forEach(function (p, i) { if (p) kalan.push(i); });
    var zor = Math.min(1, run.L.dunya * 0.35);
    kalan.forEach(function (i) { run.parcalar[i] = M.parca(run.rnd, zor, !!run.L.kolay); });
    save.hak.yenile--;
    persist();
    secili = -1;
    MiniOyun.ses('puan');
    uyar('🔀 Parçalar yenilendi');
    ciz();
    sonKontrol();
  }
  function silModu() {
    if (!run || run.bitti || run.mod !== 'macera' || MiniOyun.duraklatildi()) return;
    if (!run.silModu && !save.hak.sil) return;
    run.silModu = !run.silModu;
    if (run.silModu) uyar('🧹 Silmek istediğin dolu hücreye dokun (💎 ve 🔒 hücreler silinmez)', true);
    else uyar('');
    ciz();
  }
  function hucreSil(i) {
    var iz = run.iz;
    if (!iz.h[i] || iz.e[i] || iz.k[i]) { uyar('Bu hücre silinemez'); return; }
    iz.h[i] = 0;
    save.hak.sil--;
    run.silModu = false;
    persist();
    MiniOyun.ses('tik');
    uyar('🧹 Hücre silindi');
    ciz();
  }
  function bastan() {
    if (!run) return;
    basla(run.mod, run.mod === 'macera' ? run.L.no : run.zorluk);
  }

  function kazan() {
    run.bitti = true;
    var L = run.L, kalan = L.hamle - run.hamle;
    var y = kalan >= L.y3 ? 3 : kalan >= L.y2 ? 2 : 1;
    var onceki = save.yildiz[L.no] || 0, notlar = [], w = L.dunya;
    var sonrakiAcikti = w < 2 && dunyaAcik(w + 1);
    if (y > onceki) save.yildiz[L.no] = y;
    if (y === 3 && onceki < 3) {
      var tur = save.hak.yenile <= save.hak.sil ? 'yenile' : 'sil';
      if (save.hak[tur] >= HAK_UST) tur = tur === 'yenile' ? 'sil' : 'yenile';
      if (save.hak[tur] < HAK_UST) { save.hak[tur]++; notlar.push(tur === 'yenile' ? '+1 🔀 Yenile hakkı' : '+1 🧹 Sil hakkı'); }
    }
    temaKontrol().forEach(function (ad) { notlar.push('🎨 ' + ad + ' teması açıldı'); });
    if (w < 2 && !sonrakiAcikti && dunyaAcik(w + 1)) notlar.push(M.DUNYALAR[w + 1].ikon + ' ' + M.DUNYALAR[w + 1].ad + ' açıldı');
    persist();
    var rec = MiniOyun.setBest('blok-bulmaca-' + L.no, run.puan);
    hud();
    MiniOyun.bitti({
      baslik: 'Bölüm ' + L.no + ' tamam!',
      metin: yildizYazi(y) + ' · ' + run.puan + ' puan · ' + kalan + ' hamle arttı' + (notlar.length ? ' · ' + notlar.join(' · ') : ''),
      rekor: rec,
      sonuc: run.puan + ' puan',
      skor: run.puan,
      seviye: 'bölüm ' + L.no,
      paylas: 'Blok Bulmaca ' + L.no + '. bölümü ' + yildizYazi(y) + ' ile bitirdim!'
    });
    var sonraki = L.no < BOLUM_SAYI && bolumAcik(L.no + 1) ? L.no + 1 : 0, not = '';
    if (!sonraki && L.no % 15 === 0 && L.no < BOLUM_SAYI) not = M.DUNYALAR[w + 1].ad + ' için ' + M.DUNYALAR[w].ad + ' dünyasında ' + DUNYA_YILDIZ + ' ⭐ gerekli (şu an ' + dunyaYildiz(w) + ')';
    sonrakiDugme(sonraki, not);
  }
  function kaybet(neden) {
    run.bitti = true;
    hud();
    MiniOyun.bitti({
      baslik: 'Bölüm ' + run.L.no + ' olmadı',
      metin: neden + ' ' + hedefYazi(false) + '. Tekrar dene!',
      kaybetti: true,
      sonuc: 'kaybedildi'
    });
    sonrakiDugme(0, '');
  }
  function klasikBitti() {
    run.bitti = true;
    var puan = run.puan, notlar = [], rec;
    if (run.mod === 'gunluk') {
      rec = MiniOyun.setBest('blok-bulmaca-gunluk', puan);
      MiniOyun.setBest('blok-bulmaca', puan);
    } else {
      rec = MiniOyun.setBest(rekorKey(), puan);
    }
    ROZETLER.forEach(function (r) {
      if (puan >= r && save.rozetler.indexOf(r) === -1) { save.rozetler.push(r); notlar.push('🏅 ' + r + ' puan rozeti'); }
    });
    persist();
    hud();
    MiniOyun.bitti({
      baslik: run.mod === 'gunluk' ? 'Günlük bulmaca bitti!' : 'Oyun bitti!',
      metin: 'Sığan parça kalmadı. ' + puan + ' puan · ' + run.hamle + ' hamle' + (notlar.length ? ' · ' + notlar.join(' · ') : ''),
      rekor: rec,
      kaybetti: !rec,
      sonuc: puan + ' puan',
      skor: puan,
      paylas: 'Blok Bulmaca' + (run.mod === 'gunluk' ? ' günlük bulmacasında ' : '\'da ') + puan + ' puan yaptım! Sen kaç yaparsın?'
    });
    sonrakiDugme(0, '');
  }
  // Oyun sonu penceresine "Sonraki bölüm" düğmesi
  function sonrakiDugme(no, not) {
    var dlg = document.querySelector('.oyun-sonu');
    if (!dlg) return;
    var b = dlg.querySelector('#bb-sonraki');
    if (!b) {
      b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.id = 'bb-sonraki';
      b.textContent = 'Sonraki bölüm ▶';
      b.addEventListener('click', function () { dlg.close(); basla('macera', Number(b.dataset.no)); });
      dlg.querySelector('.oyun-dlg-actions').prepend(b);
    }
    b.hidden = !no;
    b.dataset.no = no || '';
    var p = dlg.querySelector('.bb-sonu-not');
    if (!p) { p = document.createElement('p'); p.className = 'bb-sonu-not'; dlg.querySelector('.oyun-dlg-actions').insertAdjacentElement('beforebegin', p); }
    p.textContent = not;
    p.hidden = !not;
  }

  // ---------- Harita ----------
  function haritaGoster() {
    if (run && run.bitti) run = null;
    secili = -1;
    oyunEl.hidden = true;
    ustEl.hidden = true;
    haritaEl.hidden = false;
    if (temaKontrol().length) persist();
    if (haritaDunya === null) {
      haritaDunya = 0;
      for (var w = 0; w < M.DUNYALAR.length; w++) if (dunyaAcik(w)) haritaDunya = w;
    }
    var h = '<div class="bb-ozet"><span id="h-yildiz">⭐ ' + toplamYildiz() + ' / ' + BOLUM_SAYI * 3 + '</span><span id="h-hak">🔀 ' + save.hak.yenile + ' · 🧹 ' + save.hak.sil + '</span></div>';
    h += '<h2>♾️ Klasik mod <small>parça sığmayana kadar</small></h2><div class="bb-ekstra">';
    for (var z in ZORLUK) {
      var en = MiniOyun.getBest(z === 'kolay' ? 'blok-bulmaca-kolay' : 'blok-bulmaca');
      h += '<button type="button" class="btn" data-klasik="' + z + '">' + ZORLUK[z] + (en ? ' <small>🏆 ' + en + '</small>' : '') + '</button>';
    }
    h += '<a class="btn btn-ghost" href="?gunluk=' + MiniOyun.gunluk.bugun() + '">📅 Günlük bulmaca</a></div>';
    h += '<div class="bb-rozetler">' + ROZETLER.map(function (r) {
      var kazanildi = save.rozetler.indexOf(r) !== -1;
      return '<span class="bb-rozet' + (kazanildi ? ' var' : '') + '" data-rozet="' + r + '">' + (kazanildi ? '🏅' : '🔒') + ' ' + r + '</span>';
    }).join('') + '</div>';
    h += '<h2>🗺️ Macera</h2><div class="bb-dunyalar">';
    M.DUNYALAR.forEach(function (d, w) {
      var acik = dunyaAcik(w);
      h += '<button type="button" class="bb-dunya' + (w === haritaDunya ? ' secili' : '') + (acik ? '' : ' kilitli') + '" data-dunya="' + w + '">' + (acik ? d.ikon : '🔒') + ' ' + d.ad + '</button>';
    });
    h += '</div>';
    var d = M.DUNYALAR[haritaDunya];
    h += '<h2>' + d.ikon + ' ' + d.ad + ' <small>⭐ ' + dunyaYildiz(haritaDunya) + ' / 45</small></h2>';
    if (!dunyaAcik(haritaDunya)) h += '<p>🔒 Açmak için ' + M.DUNYALAR[haritaDunya - 1].ad + ' dünyasında ' + DUNYA_YILDIZ + ' ⭐ topla (şu an ' + dunyaYildiz(haritaDunya - 1) + ').</p>';
    h += '<div class="bb-bolumler">';
    for (var i = haritaDunya * 15 + 1; i <= haritaDunya * 15 + 15; i++) {
      var y = save.yildiz[i] || 0, acikB = bolumAcik(i), L = M.ayar(i);
      var ikon = L.hedef.kilit ? '🔒' : L.hedef.elmas ? '💎' : '🎯';
      h += '<button type="button" class="bb-bolum' + (acikB ? '' : ' kilitli') + '" data-bolum="' + i + '"' + (acikB ? '' : ' disabled') + ' aria-label="Bölüm ' + i + (acikB ? ', ' + y + ' yıldız' : ', kilitli') + '">' +
        '<b>' + i + '</b><em>' + (acikB ? ikon : '') + '</em><span>' + (acikB ? (y ? '⭐'.repeat(y) : '·') : '🔒') + '</span></button>';
    }
    h += '</div>';
    h += '<h2>🎨 Blok temaları</h2><div class="bb-temalar">';
    for (var t in TEMALAR) {
      var tm = TEMALAR[t], acikT = save.acikTemalar.indexOf(t) !== -1;
      h += '<button type="button" class="bb-tema' + (save.tema === t ? ' secili' : '') + (acikT ? '' : ' kilitli') + '" data-tema="' + t + '"' + (acikT ? '' : ' disabled') + '>' +
        (acikT ? tm.ikon : '🔒') + ' ' + tm.ad + (acikT ? '' : ' <small>(' + tm.yildiz + ' ⭐)</small>') + '</button>';
    }
    h += '</div>';
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
      if (run && run.mod === 'macera' && run.L.no === no && !run.bitti) {
        haritaEl.hidden = true; oyunEl.hidden = false; ustEl.hidden = false; ciz();
      } else basla('macera', no);
    } else if (b.hasAttribute('data-klasik')) {
      basla('klasik', b.getAttribute('data-klasik'));
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
  yenileBtn.addEventListener('click', yenile);
  silBtn.addEventListener('click', silModu);
  bastanBtn.addEventListener('click', function () { if (!MiniOyun.duraklatildi()) bastan(); });

  // ---------- Dokunma, fare ve sürükleme ----------
  function hucreBoyu() { var r = izEl.getBoundingClientRect(); return { r: r, b: r.width / N }; }
  // Sürüklenen parçanın sol üst hücresi
  function surukHucre(x, y) {
    var g = hucreBoyu(), S = M.SEKILLER[run.parcalar[suruk.i].s];
    var sol = x - S.g * g.b / 2, ust = y - suruk.kaldir - S.y * g.b / 2;
    return [Math.round((ust - g.r.top) / g.b), Math.round((sol - g.r.left) / g.b)];
  }
  yuvaEl.addEventListener('pointerdown', function (e) {
    var b = e.target.closest('.bb-yuva');
    if (!run || run.bitti || !b || b.disabled || MiniOyun.duraklatildi()) return;
    e.preventDefault();
    var i = Number(b.getAttribute('data-i'));
    var g = hucreBoyu(), p = run.parcalar[i], S = M.SEKILLER[p.s];
    run.silModu = false;
    suruk = { i: i, x0: e.clientX, y0: e.clientY, tasindi: false, kaldir: e.pointerType === 'touch' ? S.y * g.b / 2 + g.b * 1.2 : 0, el: null, hucre: null };
    try { b.setPointerCapture(e.pointerId); } catch (er) {}
  });
  yuvaEl.addEventListener('pointermove', function (e) {
    if (!suruk) return;
    if (!suruk.tasindi && Math.abs(e.clientX - suruk.x0) + Math.abs(e.clientY - suruk.y0) < 8) return;
    var g = hucreBoyu(), p = run.parcalar[suruk.i], S = M.SEKILLER[p.s];
    if (!suruk.tasindi) {
      suruk.tasindi = true;
      klavye = false;
      secili = suruk.i;
      var el = document.createElement('div');
      el.className = 'bb-surukle';
      el.innerHTML = parcaHtml(p);
      el.style.setProperty('--hb', g.b + 'px');
      document.body.appendChild(el);
      suruk.el = el;
      var y = yuvaEl.querySelector('[data-i="' + suruk.i + '"]');
      if (y) y.classList.add('suruklenen');
    }
    suruk.el.style.transform = 'translate(' + (e.clientX - S.g * g.b / 2) + 'px,' + (e.clientY - suruk.kaldir - S.y * g.b / 2) + 'px)';
    suruk.hucre = surukHucre(e.clientX, e.clientY);
    onizle(suruk.i, suruk.hucre[0], suruk.hucre[1]);
  });
  function surukBitir(e, iptal) {
    if (!suruk) return;
    var s = suruk;
    suruk = null;
    if (s.el) s.el.remove();
    if (!s.tasindi) {
      // Dokunup bırakmak parçayı seçer; ardından ızgarada bir hücreye dokunmak parçayı oraya koyar
      if (iptal) return;
      secili = secili === s.i ? -1 : s.i;
      MiniOyun.ses('tik');
      ciz();
      return;
    }
    secili = -1;
    if (iptal || !s.hucre || !yerlestir(s.i, s.hucre[0], s.hucre[1])) ciz();
  }
  yuvaEl.addEventListener('pointerup', function (e) { surukBitir(e, false); });
  yuvaEl.addEventListener('pointercancel', function (e) { surukBitir(e, true); });
  yuvaEl.addEventListener('click', function (e) {
    // Klavyeyle (Enter/Boşluk) düğmeye basılınca seçim
    if (e.detail !== 0) return;
    var b = e.target.closest('.bb-yuva');
    if (!b || b.disabled || !run || run.bitti) return;
    secili = Number(b.getAttribute('data-i'));
    klavye = true;
    ciz();
  });
  izEl.addEventListener('click', function (e) {
    var h = e.target.closest('.bb-h');
    if (!h || !run || run.bitti || MiniOyun.duraklatildi()) return;
    var i = Number(h.getAttribute('data-i'));
    if (run.silModu) return hucreSil(i);
    if (secili === -1) return;
    // Dokunulan hücre parçanın sol üst köşesi olur; sığmazsa parça o hücreyi kaplayacak şekilde kaydırılır
    var S = M.SEKILLER[run.parcalar[secili].s], r = Math.floor(i / N), c = i % N;
    if (!M.sigar(run.iz, run.parcalar[secili].s, r, c)) {
      var bulundu = false;
      for (var dr = 0; dr < S.y && !bulundu; dr++) for (var dc = 0; dc < S.g && !bulundu; dc++) {
        if (M.sigar(run.iz, run.parcalar[secili].s, r - dr, c - dc) && S.h.some(function (x) { return x[0] === dr && x[1] === dc; })) { r -= dr; c -= dc; bulundu = true; }
      }
    }
    if (!yerlestir(secili, r, c)) { uyar('Parça oraya sığmıyor'); MiniOyun.ses('kaybet'); }
  });

  // ---------- Klavye ----------
  document.addEventListener('keydown', function (e) {
    if (!run || oyunEl.hidden || run.bitti || MiniOyun.duraklatildi() || e.altKey || e.metaKey || e.ctrlKey) return;
    var k = e.key;
    if (k === '1' || k === '2' || k === '3') {
      var i = Number(k) - 1;
      if (!run.parcalar[i]) return;
      e.preventDefault();
      secili = i;
      klavye = true;
      imlecSinirla();
      MiniOyun.ses('tik');
      ciz();
      return;
    }
    if (k === 'Escape') { if (secili !== -1 || run.silModu) { secili = -1; run.silModu = false; ciz(); } return; }
    if (secili === -1) {
      if (k === 'r' || k === 'R') { e.preventDefault(); bastan(); }
      return;
    }
    var yon = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[k];
    if (yon) {
      e.preventDefault();
      klavye = true;
      imlec = [imlec[0] + yon[0], imlec[1] + yon[1]];
      imlecSinirla();
      onizle();
      izEl.setAttribute('data-imlec', imlec.join(','));
      return;
    }
    if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      if (!yerlestir(secili, imlec[0], imlec[1])) { uyar('Parça oraya sığmıyor'); MiniOyun.ses('kaybet'); }
    }
  });
  function imlecSinirla() {
    var S = M.SEKILLER[run.parcalar[secili].s];
    imlec = [Math.max(0, Math.min(N - S.y, imlec[0])), Math.max(0, Math.min(N - S.g, imlec[1]))];
    izEl.setAttribute('data-imlec', imlec.join(','));
  }

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

// Ortak oyun çerçevesi: her oyun sayfasına araç çubuğu (duraklat, yeniden başlat, ses, tam ekran,
// nasıl oynanır, favori, paylaş), oyun sonu penceresi, ses efektleri, "son oynananlar" kaydı,
// oyun istatistikleri, rozetler ve günlük meydan okuma modu (?gunluk=YYYY-AA-GG) ekler.
// Profil ve günlük sayfaları da istatistik, rozet ve günlük verisi için bu dosyayı yükler.
// Oyunlar MiniOyun.oyun({...}) ile kaydolur; kaydolmayan oyunda yalnızca genel düğmeler görünür.
(function () {
  var SOUND_KEY = 'mo_ses';
  var FAV_KEY = 'mo_favoriler';
  var RECENT_KEY = 'mo_son_oynanan';
  var STATS_KEY = 'mo_istatistik';
  var DAILY_KEY = 'mo_gunluk';
  // Günlük meydan okumanın 1 numaralı günü
  var DAILY_START = '2026-10-23';
  var match = location.pathname.match(/\/games\/([^/]+)\//);
  var slug = match ? match[1] : '';
  var dailyMatch = location.search.match(/[?&]gunluk=(\d{4}-\d{2}-\d{2})/);
  var dailyDate = slug && dailyMatch ? dailyMatch[1] : '';
  var box, bar, pauseBtn, pauseLayer, endDlg, helpDlg, toastEl, toastTimer;
  var hooks = {}, paused = false, audio;

  function load(key, def) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v === null ? def : v; } catch (e) { return def; }
  }
  function save(key, v) {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {}
  }

  function soundOn() { return load(SOUND_KEY, true) !== false; }

  // Web Audio ile üretilen kısa efektler; ses dosyası gerekmez.
  var TONES = {
    tik: [[660, 0.04]],
    puan: [[880, 0.06], [1320, 0.08]],
    kazan: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.2]],
    kaybet: [[392, 0.15], [311, 0.15], [233, 0.3]]
  };
  function play(name) {
    var notes = TONES[name];
    if (!notes || !soundOn()) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var t = audio.currentTime;
      notes.forEach(function (n) {
        var osc = audio.createOscillator(), gain = audio.createGain();
        osc.type = 'triangle';
        osc.frequency.value = n[0];
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + n[1]);
        osc.connect(gain).connect(audio.destination);
        osc.start(t);
        osc.stop(t + n[1]);
        t += n[1] * 0.9;
      });
    } catch (e) {}
  }

  function toast(text) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'oyun-toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  function share(text, link) {
    var url = link || location.href.split('#')[0];
    var title = document.querySelector('.game-box h1');
    var data = { title: (title ? title.textContent : 'MiniOyun') + ' | MiniOyun', text: text || 'Bu oyunu MiniOyun\'da oyna!', url: url };
    if (navigator.share) {
      navigator.share(data).then(function () { count('paylasim'); }, function () {});
      return;
    }
    count('paylasim');
    var full = data.text + ' ' + url;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(full).then(function () { toast('Bağlantı kopyalandı'); }, function () { toast(full); });
    } else {
      toast(full);
    }
  }

  function button(icon, label, onClick, cls) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'oyun-btn' + (cls ? ' ' + cls : '');
    b.textContent = icon;
    b.title = label;
    b.setAttribute('aria-label', label);
    b.addEventListener('click', onClick);
    bar.appendChild(b);
    return b;
  }

  function setPaused(p) {
    if (!hooks.pause || paused === p) return;
    if (p && hooks.canPause && !hooks.canPause()) return;
    paused = p;
    if (p) hooks.pause(); else hooks.resume();
    pauseLayer.hidden = !p;
    pauseBtn.textContent = p ? '▶️' : '⏸️';
    pauseBtn.setAttribute('aria-label', p ? 'Devam et' : 'Duraklat');
    pauseBtn.title = pauseBtn.getAttribute('aria-label');
    if (!p) pauseBtn.focus();
  }

  function isFav() { return load(FAV_KEY, []).indexOf(slug) !== -1; }
  function toggleFav(btn) {
    var list = load(FAV_KEY, []).filter(function (s) { return s !== slug; });
    var on = !isFav();
    if (on) list.unshift(slug);
    save(FAV_KEY, list);
    drawFav(btn);
    toast(on ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı');
    checkBadges();
  }
  function drawFav(btn) {
    var on = isFav();
    btn.textContent = on ? '❤️' : '🤍';
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function drawSound(btn) {
    var on = soundOn();
    btn.textContent = on ? '🔊' : '🔇';
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function dialog(cls) {
    var d = document.createElement('dialog');
    d.className = 'oyun-dlg ' + cls;
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    document.body.appendChild(d);
    return d;
  }

  function openHelp() {
    if (!helpDlg) {
      helpDlg = dialog('oyun-yardim');
      var desc = document.querySelector('.game-desc');
      helpDlg.innerHTML = '<div class="oyun-dlg-body"></div><div class="oyun-dlg-actions"><button type="button" class="btn">Anladım</button></div>';
      var body = helpDlg.querySelector('.oyun-dlg-body');
      if (desc) body.innerHTML = desc.innerHTML;
      else body.textContent = 'Bu oyun için açıklama yok.';
      helpDlg.querySelector('.btn').addEventListener('click', function () { helpDlg.close(); });
      helpDlg.addEventListener('close', function () { setPaused(false); });
    }
    setPaused(true);
    helpDlg.showModal();
  }

  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else box.requestFullscreen().catch(function () { toast('Tam ekran açılamadı'); });
  }

  function buildBar() {
    box = document.querySelector('.game-box');
    if (!box || bar) return;
    bar = document.createElement('div');
    bar.className = 'oyun-arac';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'Oyun araçları');
    var h1 = box.querySelector('h1');
    if (h1) h1.insertAdjacentElement('afterend', bar); else box.insertBefore(bar, box.firstChild);

    if (hooks.pause) {
      pauseBtn = button('⏸️', 'Duraklat', function () { setPaused(!paused); });
      pauseLayer = document.createElement('div');
      pauseLayer.className = 'oyun-duraklat';
      pauseLayer.hidden = true;
      pauseLayer.innerHTML = '<p>Duraklatıldı</p>';
      var resume = document.createElement('button');
      resume.type = 'button';
      resume.className = 'btn';
      resume.textContent = 'Devam et ▶';
      resume.addEventListener('click', function () { setPaused(false); });
      pauseLayer.appendChild(resume);
      box.appendChild(pauseLayer);
    }
    if (hooks.restart) button('🔄', 'Yeniden başlat', function () { setPaused(false); hooks.restart(); });
    var snd = button('🔊', 'Ses', function () { save(SOUND_KEY, !soundOn()); drawSound(snd); });
    drawSound(snd);
    if (box.requestFullscreen) button('⛶', 'Tam ekran', fullscreen);
    button('❓', 'Nasıl oynanır', openHelp);
    if (slug) {
      var fav = button('🤍', 'Favori', function () { toggleFav(fav); });
      drawFav(fav);
    }
    button('🔗', 'Paylaş', function () { share(); });
    dailyBanner();
  }

  // Oyun sonu penceresi. opts: { baslik, metin, rekor, paylas }
  function finish(opts) {
    play(opts.kaybetti ? 'kaybet' : 'kazan');
    recordFinish(!opts.kaybetti);
    var daily = recordDaily(opts);
    // Analitik: biten oyunlar olay olarak sayılır (kişisel veri yok)
    try { if (window.goatcounter && goatcounter.count) goatcounter.count({ path: 'oyun-bitti/' + slug + (daily ? '/gunluk' : ''), title: 'Oyun bitti', event: true }); } catch (e) {}
    if (!endDlg) {
      endDlg = dialog('oyun-sonu');
      endDlg.innerHTML = '<div class="oyun-sonu-ikon" aria-hidden="true"></div><h2></h2><p class="oyun-sonu-metin"></p><p class="oyun-sonu-rekor">🏆 Yeni rekor!</p>' +
        '<div class="oyun-dlg-actions"><button type="button" class="btn" data-a="tekrar">Tekrar oyna</button>' +
        '<button type="button" class="btn btn-ghost" data-a="paylas">Paylaş</button>' +
        '<button type="button" class="btn btn-ghost" data-a="kapat">Kapat</button></div>';
      endDlg.addEventListener('click', function (e) {
        var a = e.target.getAttribute && e.target.getAttribute('data-a');
        if (a === 'tekrar') { endDlg.close(); if (hooks.restart) hooks.restart(); }
        else if (a === 'paylas') share(endDlg.dataset.paylas, endDlg.dataset.url);
        else if (a === 'kapat') endDlg.close();
      });
    }
    endDlg.querySelector('.oyun-sonu-ikon').textContent = opts.kaybetti ? '😵' : (opts.rekor ? '🏆' : '🎉');
    endDlg.querySelector('h2').textContent = opts.baslik || 'Oyun bitti!';
    endDlg.querySelector('.oyun-sonu-metin').textContent = opts.metin || '';
    endDlg.querySelector('.oyun-sonu-rekor').hidden = !opts.rekor;
    endDlg.querySelector('[data-a="tekrar"]').hidden = !hooks.restart;
    endDlg.dataset.paylas = daily ? daily.paylas : (opts.paylas || opts.metin || '');
    endDlg.dataset.url = daily ? daily.url : '';
    var note = endDlg.querySelector('.oyun-sonu-gunluk');
    if (!note) {
      note = document.createElement('p');
      note.className = 'oyun-sonu-gunluk';
      endDlg.querySelector('.oyun-dlg-actions').insertAdjacentElement('beforebegin', note);
    }
    note.hidden = !daily;
    if (daily) note.textContent = daily.yeni ? '📅 Günlük sonucun kaydedildi: ' + daily.sonuc.sonuc : '📅 Bugünkü sonucun zaten kayıtlı: ' + daily.sonuc.sonuc;
    // Oyuncunun son hamleyi görmesi için kısa bir gecikme
    setTimeout(function () { if (!endDlg.open) endDlg.showModal(); }, 600);
  }

  function rememberPlay() {
    if (!slug) return;
    var list = load(RECENT_KEY, []).filter(function (s) { return s !== slug; });
    list.unshift(slug);
    save(RECENT_KEY, list.slice(0, 12));
    var st = stats();
    st.oynama[slug] = (st.oynama[slug] || 0) + 1;
    var today = day(new Date());
    if (st.gunler.indexOf(today) === -1) st.gunler = st.gunler.concat(today).slice(-60);
    save(STATS_KEY, st);
    checkBadges();
  }

  // ---------- Günlük meydan okuma ----------
  // Tarih ve oyuna göre her gün aynı sayıları üreten rastgele sayı üreteci (mulberry32)
  function seeded(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = h << 13 | h >>> 19;
    }
    return function () {
      h = h + 0x6D2B79F5 | 0;
      var t = Math.imul(h ^ h >>> 15, 1 | h);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function dayNumber(date) {
    return Math.round((Date.parse(date) - Date.parse(DAILY_START)) / 864e5) + 1;
  }

  function dailyStreak(results) {
    var n = 0, d = new Date();
    if (!results[day(d)]) d.setDate(d.getDate() - 1);
    while (results[day(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  // Bugünün bulmacasıysa ilk sonucu kaydeder; paylaşım metnini döner.
  function recordDaily(opts) {
    if (!dailyDate || dailyDate !== day(new Date())) return null;
    var results = load(DAILY_KEY, {}), isNew = !results[dailyDate];
    if (isNew) {
      results[dailyDate] = { oyun: slug, sonuc: opts.sonuc || opts.metin || '', kazandi: !opts.kaybetti };
      save(DAILY_KEY, results);
      checkBadges();
    }
    var r = results[dailyDate], title = document.querySelector('.game-box h1');
    var base = location.href.split('/games/')[0] + '/gunluk.html';
    var text = 'MiniOyun Günlük #' + dayNumber(dailyDate) + ' · ' + (title ? title.textContent : slug) + ': ' + r.sonuc + ' · 🔥 ' + dailyStreak(results) + ' gün seri';
    return { yeni: isNew, sonuc: r, paylas: text, url: base };
  }

  function dailyBanner() {
    if (!dailyDate || !box) return;
    var b = document.createElement('div');
    b.className = 'gunluk-bant';
    var today = dailyDate === day(new Date());
    var r = load(DAILY_KEY, {})[dailyDate];
    b.textContent = '📅 Günün meydan okuması #' + dayNumber(dailyDate) + ' · ' + dailyDate.split('-').reverse().join('.') +
      (!today ? ' (geçmiş gün, sonuç kaydedilmez)' : r ? ' · Sonucun: ' + r.sonuc + ' (tekrar oynayabilirsin, sonuç değişmez)' : ' · İlk denemen sayılır!');
    bar.insertAdjacentElement('afterend', b);
  }

  // ---------- İstatistik ve rozetler ----------
  function day(d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  function stats() {
    var st = load(STATS_KEY, {});
    st.oynama = st.oynama || {};
    st.bitirme = st.bitirme || {};
    st.kazanma = st.kazanma || {};
    st.gunler = st.gunler || [];
    st.rozetler = st.rozetler || {};
    st.paylasim = st.paylasim || 0;
    st.gece = st.gece || 0;
    return st;
  }

  function count(field) {
    var st = stats();
    st[field]++;
    save(STATS_KEY, st);
    checkBadges();
  }

  function recordFinish(won) {
    if (!slug) return;
    var st = stats();
    st.bitirme[slug] = (st.bitirme[slug] || 0) + 1;
    if (won) st.kazanma[slug] = (st.kazanma[slug] || 0) + 1;
    if (new Date().getHours() < 5) st.gece++;
    save(STATS_KEY, st);
    checkBadges();
  }

  function sum(obj) {
    var n = 0;
    for (var k in obj) n += obj[k];
    return n;
  }

  // Bugün veya dün biten, art arda ziyaret edilen gün sayısı
  function streak(days) {
    var set = {}, n = 0, d = new Date();
    days.forEach(function (x) { set[x] = true; });
    if (!set[day(d)]) d.setDate(d.getDate() - 1);
    while (set[day(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  function best(game) { return MiniOyun.getBest ? MiniOyun.getBest(game) : 0; }

  // Yeni rozetler buraya eklenir; kosul istatistik nesnesini alır.
  var BADGES = [
    { id: 'ilk-adim', ikon: '👣', ad: 'İlk adım', aciklama: 'İlk oyununu bitir.', kosul: function (s) { return sum(s.bitirme) >= 1; } },
    { id: 'kasif', ikon: '🧭', ad: 'Kaşif', aciklama: '3 farklı oyun oyna.', kosul: function (s) { return Object.keys(s.oynama).length >= 3; } },
    { id: 'gezgin', ikon: '🗺️', ad: 'Gezgin', aciklama: '5 farklı oyun oyna.', kosul: function (s) { return Object.keys(s.oynama).length >= 5; } },
    { id: 'azimli', ikon: '💪', ad: 'Azimli', aciklama: 'Toplam 10 oyun bitir.', kosul: function (s) { return sum(s.bitirme) >= 10; } },
    { id: 'tutkun', ikon: '🔥', ad: 'Oyun tutkunu', aciklama: 'Toplam 50 oyun bitir.', kosul: function (s) { return sum(s.bitirme) >= 50; } },
    { id: 'kazanan', ikon: '🥇', ad: 'Kazanan', aciklama: 'Toplam 5 oyunu kazanarak veya rekorla bitir.', kosul: function (s) { return sum(s.kazanma) >= 5; } },
    { id: 'sadik', ikon: '📅', ad: 'Sadık oyuncu', aciklama: '3 gün üst üste gel.', kosul: function (s) { return streak(s.gunler) >= 3; } },
    { id: 'haftalik', ikon: '🗓️', ad: 'Haftanın oyuncusu', aciklama: '7 gün üst üste gel.', kosul: function (s) { return streak(s.gunler) >= 7; } },
    { id: 'kalp', ikon: '❤️', ad: 'Gönül verdim', aciklama: 'Bir oyunu favorilerine ekle.', kosul: function () { return load(FAV_KEY, []).length >= 1; } },
    { id: 'paylasimci', ikon: '📣', ad: 'Paylaşımcı', aciklama: 'Bir oyunu veya skorunu paylaş.', kosul: function (s) { return s.paylasim >= 1; } },
    { id: 'gece-kusu', ikon: '🦉', ad: 'Gece kuşu', aciklama: 'Gece 00:00 ile 05:00 arasında bir oyun bitir.', kosul: function (s) { return s.gece >= 1; } },
    { id: '2048-usta', ikon: '🔢', ad: '2048 ustası', aciklama: '2048\'de 5000 puanı geç.', kosul: function () { return best('2048') >= 5000; } },
    { id: 'yilan-terbiyecisi', ikon: '🐍', ad: 'Yılan terbiyecisi', aciklama: 'Yılan\'da 150 puan yap.', kosul: function () { return best('yilan') >= 150; } },
    { id: 'fil-hafizasi', ikon: '🐘', ad: 'Fil hafızası', aciklama: 'Hafıza Kartları\'nı 12 hamle veya daha azında bitir.', kosul: function () { var b = best('hafiza'); return b > 0 && b <= 12; } },
    { id: 'gunluk-ilk', ikon: '📅', ad: 'Günlükçü', aciklama: 'İlk günlük meydan okumanı tamamla.', kosul: function () { return Object.keys(load(DAILY_KEY, {})).length >= 1; } },
    { id: 'gunluk-seri', ikon: '🏅', ad: 'Günlük seri', aciklama: 'Günlük meydan okumayı 5 gün üst üste tamamla.', kosul: function () { return dailyStreak(load(DAILY_KEY, {})) >= 5; } },
    { id: 'mayin-avcisi', ikon: '🚩', ad: 'Mayın avcısı', aciklama: 'Mayın Tarlası\'nda bir oyun kazan.', kosul: function (s) { return (s.kazanma['mayin-tarlasi'] || 0) >= 1; } }
  ];

  function checkBadges() {
    var st = stats(), earned = [];
    BADGES.forEach(function (b) {
      if (!st.rozetler[b.id] && b.kosul(st)) { st.rozetler[b.id] = day(new Date()); earned.push(b); }
    });
    if (!earned.length) return;
    save(STATS_KEY, st);
    // Oyun sonu penceresiyle çakışmasın diye kısa gecikme
    earned.forEach(function (b, i) {
      setTimeout(function () { toast('🏅 Yeni rozet: ' + b.ikon + ' ' + b.ad); }, 900 + i * 2400);
    });
  }

  // Sekme gizlenince oyunu duraklat
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) setPaused(true);
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && hooks.pause && !(endDlg && endDlg.open) && !(helpDlg && helpDlg.open)) {
      if (e.key === 'Escape' && !paused) return;
      setPaused(!paused);
    }
  });

  window.MiniOyun = window.MiniOyun || {};
  // hooks: { restart, pause, resume, canPause }. pause/resume birlikte verilmelidir.
  MiniOyun.oyun = function (h) {
    hooks = h || {};
    if (bar) { bar.remove(); bar = null; }
    if (pauseLayer) { pauseLayer.remove(); pauseLayer = null; }
    if (document.readyState !== 'loading') buildBar();
  };
  MiniOyun.ses = play;
  MiniOyun.bitti = finish;
  MiniOyun.paylas = share;
  MiniOyun.istatistik = function () { var s = stats(); s.seri = streak(s.gunler); return s; };
  MiniOyun.rozetler = BADGES;
  // Oyunlar her yeni oyunda bir üreteç alır: günlük modda tarih+oyuna göre sabit, normalde Math.random.
  MiniOyun.rastgele = function () { return dailyDate ? seeded(dailyDate + '/' + slug) : Math.random; };
  MiniOyun.gunluk = {
    tarih: dailyDate,
    bugun: function () { return day(new Date()); },
    no: dayNumber,
    sonuclar: function () { return load(DAILY_KEY, {}); },
    seri: function () { return dailyStreak(load(DAILY_KEY, {})); },
    rastgele: seeded
  };
  // Duraklatıldıysa veya bir pencere açıksa true; oyunlar girişleri bu sırada yok saymalı.
  MiniOyun.duraklatildi = function () { return paused || !!(endDlg && endDlg.open) || !!(helpDlg && helpDlg.open); };

  rememberPlay();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildBar);
  else buildBar();
})();

// Ortak site betiği: çerez onayı, oyun arama ve filtre çipleri, YENİ rozeti, favori/son oynanan sıraları ve en yüksek skor yardımcıları.
(function () {
  var CONSENT_KEY = 'mo_cookie_consent';

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }

  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
  }

  function initCookieBanner() {
    var banner = document.getElementById('cookie-banner');
    if (!banner || getConsent()) return;
    banner.classList.add('show');
    banner.querySelector('[data-consent="accept"]').addEventListener('click', function () {
      setConsent('accepted');
      banner.classList.remove('show');
    });
    banner.querySelector('[data-consent="reject"]').addEventListener('click', function () {
      setConsent('rejected');
      banner.classList.remove('show');
    });
  }

  // En yeni 4 oyuna "YENİ" rozeti (build, kartlara data-yeni yazar)
  function markNewGames() {
    var cards = document.querySelectorAll('.game-card[data-yeni]');
    for (var i = 0; i < cards.length; i++) cards[i].classList.add('is-new');
  }

  function readList(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; }
  }

  // Ana sayfadaki oyun arama kutusu ve filtre çipleri: görünen kart = seçili çip ∩ arama sonucu
  function initSearch() {
    var input = document.getElementById('oyun-ara');
    var grid = document.getElementById('oyun-izgarasi');
    if (!grid) return;
    var empty = document.getElementById('sonuc-yok');
    var row = document.getElementById('filtre-cipleri');
    var cards = grid.querySelectorAll('.game-card');
    var slugOf = function (c) { return (c.getAttribute('href') || '').replace(/^games\/|\/$/g, ''); };
    var played = readList('mo_son_oynanan'), favs = readList('mo_favoriler');
    var tests = {
      tumu: function () { return true; },
      yeni: function (c) { return c.hasAttribute('data-yeni'); },
      denemediklerin: function (c) { return played.indexOf(slugOf(c)) === -1; },
      favoriler: function (c) { return favs.indexOf(slugOf(c)) !== -1; }
    };
    var current = 'tumu';
    try { if (tests[sessionStorage.getItem('mo_filtre')]) current = sessionStorage.getItem('mo_filtre'); } catch (e) {}

    function apply() {
      var q = input ? input.value.trim().toLocaleLowerCase('tr') : '';
      var shown = 0;
      for (var i = 0; i < cards.length; i++) {
        var hit = tests[current](cards[i]) && (!q || cards[i].textContent.toLocaleLowerCase('tr').indexOf(q) !== -1);
        cards[i].hidden = !hit;
        if (hit) shown++;
      }
      if (empty) empty.hidden = shown > 0;
    }

    if (row) {
      var chips = row.querySelectorAll('.filtre-cip');
      for (var i = 0; i < chips.length; i++) {
        var f = chips[i].getAttribute('data-filtre'), n = 0;
        for (var j = 0; j < cards.length; j++) if (tests[f](cards[j])) n++;
        chips[i].querySelector('.cip-sayi').textContent = n;
        // Boş veya "Tümü" ile aynı sonucu veren kişisel çip gösterilmez
        if (f === 'denemediklerin') chips[i].hidden = !played.length || !n;
        if (f === 'favoriler') chips[i].hidden = !n;
        if (f === current && chips[i].hidden) current = 'tumu';
      }
      var mark = function () {
        for (var k = 0; k < chips.length; k++) chips[k].setAttribute('aria-pressed', chips[k].getAttribute('data-filtre') === current ? 'true' : 'false');
      };
      row.addEventListener('click', function (e) {
        var chip = e.target.closest('.filtre-cip');
        if (!chip) return;
        current = chip.getAttribute('data-filtre');
        try { sessionStorage.setItem('mo_filtre', current); } catch (err) {}
        try { if (window.goatcounter && goatcounter.count) goatcounter.count({ path: 'filtre/' + (current === 'favoriler' ? 'favoriler' : current), title: 'Oyun filtresi', event: true }); } catch (err) {}
        mark();
        apply();
      });
      mark();
      row.hidden = false;
    }
    if (input) input.addEventListener('input', apply);
    apply();
  }

  // Ana sayfada "Favorilerin" ve "Son oynadıkların" sıraları (veri js/oyun.js tarafından yazılır)
  function initPersonal() {
    var grid = document.getElementById('oyun-izgarasi');
    var holder = document.getElementById('kisisel');
    if (!grid || !holder) return;
    var list = readList;
    var rows = [['mo_favoriler', '❤️ Favorilerin'], ['mo_son_oynanan', '🕹️ Son oynadıkların']];
    rows.forEach(function (r) {
      var cards = list(r[0]).map(function (slug) {
        return grid.querySelector('.game-card[href="games/' + slug + '/"]');
      }).filter(Boolean);
      if (!cards.length) return;
      var h = document.createElement('h2');
      h.className = 'section-title';
      h.textContent = r[1];
      var row = document.createElement('div');
      row.className = 'kisisel-sira';
      cards.forEach(function (c) { row.appendChild(c.cloneNode(true)); });
      holder.appendChild(h);
      holder.appendChild(row);
      holder.hidden = false;
    });
  }

  // Üst menüdeki "Profilim" bağlantısında seçilen avatarı göster
  function drawHeaderAvatar() {
    var avatar = '👤';
    try { avatar = (JSON.parse(localStorage.getItem('mo_profil')) || {}).avatar || avatar; } catch (e) {}
    var els = document.querySelectorAll('.nav-avatar');
    for (var i = 0; i < els.length; i++) els[i].textContent = avatar;
  }

  // Ana sayfadaki günlük afişinde bugünkü meydan okuma bittiyse belirt
  function markDailyDone() {
    var btn = document.getElementById('gunluk-afis-dugme');
    if (!btn) return;
    var d = new Date(), key = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    try { if ((JSON.parse(localStorage.getItem('mo_gunluk')) || {})[key]) btn.textContent = '✅ Sonucun'; } catch (e) {}
  }

  // Mobil ☰ menüsü: dışarı dokununca veya Esc ile kapanır
  function initMobileMenu() {
    var menu = document.querySelector('.mobil-menu');
    if (!menu) return;
    document.addEventListener('click', function (e) {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.open) {
        menu.open = false;
        menu.querySelector('summary').focus();
      }
    });
  }

  // PWA: çevrimdışı önbellek (sw.js) ve "Uygulamayı yükle" düğmesi
  var installPrompt = null;
  function initPwa() {
    var buttons = document.querySelectorAll('.pwa-yukle');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function () {
        if (!installPrompt) return;
        installPrompt.prompt();
        installPrompt = null;
        showInstall(false);
      });
    }
    if (!('serviceWorker' in navigator)) return;
    var script = document.querySelector('script[src$="js/main.js"]');
    var root = script ? script.src.replace(/js\/main\.js.*$/, '') : '';
    navigator.serviceWorker.register(root + 'sw.js').catch(function () {});
  }
  function showInstall(on) {
    var buttons = document.querySelectorAll('.pwa-yukle');
    for (var i = 0; i < buttons.length; i++) buttons[i].hidden = !on;
  }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    installPrompt = e;
    showInstall(true);
  });
  window.addEventListener('appinstalled', function () { showInstall(false); });

  window.MiniOyun = {
    getBest: function (game) {
      try { return parseInt(localStorage.getItem('mo_best_' + game), 10) || 0; } catch (e) { return 0; }
    },
    // lowerIsBetter: hamle/süre gibi küçük değerin daha iyi olduğu oyunlar için. Yeni rekorsa true döner.
    setBest: function (game, score, lowerIsBetter) {
      try {
        var best = this.getBest(game);
        if (lowerIsBetter ? (!best || score < best) : score > best) {
          localStorage.setItem('mo_best_' + game, String(score));
          return true;
        }
      } catch (e) {}
      return false;
    },
    hasAdConsent: function () { return getConsent() === 'accepted'; },
    ustAvatar: drawHeaderAvatar
  };

  document.addEventListener('DOMContentLoaded', function () {
    initCookieBanner();
    markNewGames();
    initPersonal();
    drawHeaderAvatar();
    markDailyDone();
    initPwa();
    initMobileMenu();
    initSearch();
  });
})();

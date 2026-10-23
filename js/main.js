// Ortak site betiği: çerez onayı, oyun arama, YENİ rozeti, favori/son oynanan sıraları ve en yüksek skor yardımcıları.
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

  // Son 14 günde eklenen oyunlara "YENİ" rozeti
  function markNewGames() {
    var now = Date.now();
    var cards = document.querySelectorAll('.game-card[data-added]');
    for (var i = 0; i < cards.length; i++) {
      var t = Date.parse(cards[i].getAttribute('data-added'));
      if (t && now - t < 14 * 864e5) cards[i].classList.add('is-new');
    }
  }

  // Ana sayfadaki oyun arama kutusu
  function initSearch() {
    var input = document.getElementById('oyun-ara');
    var grid = document.getElementById('oyun-izgarasi');
    if (!input || !grid) return;
    var empty = document.getElementById('sonuc-yok');
    input.addEventListener('input', function () {
      var q = input.value.trim().toLocaleLowerCase('tr');
      var cards = grid.querySelectorAll('.game-card');
      var shown = 0;
      for (var i = 0; i < cards.length; i++) {
        var hit = !q || cards[i].textContent.toLocaleLowerCase('tr').indexOf(q) !== -1;
        cards[i].hidden = !hit;
        if (hit) shown++;
      }
      if (empty) empty.hidden = shown > 0;
    });
  }

  // Ana sayfada "Favorilerin" ve "Son oynadıkların" sıraları (veri js/oyun.js tarafından yazılır)
  function initPersonal() {
    var grid = document.getElementById('oyun-izgarasi');
    var holder = document.getElementById('kisisel');
    if (!grid || !holder) return;
    function list(key) {
      try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; }
    }
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
    initSearch();
  });
})();

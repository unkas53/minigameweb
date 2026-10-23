// Ortak site betiği: çerez onayı, oyun arama, YENİ rozeti ve en yüksek skor yardımcıları.
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

  window.MiniOyun = {
    getBest: function (game) {
      try { return parseInt(localStorage.getItem('mo_best_' + game), 10) || 0; } catch (e) { return 0; }
    },
    setBest: function (game, score) {
      try {
        if (score > this.getBest(game)) localStorage.setItem('mo_best_' + game, String(score));
      } catch (e) {}
    },
    hasAdConsent: function () { return getConsent() === 'accepted'; }
  };

  document.addEventListener('DOMContentLoaded', function () {
    initCookieBanner();
    markNewGames();
    initSearch();
  });
})();

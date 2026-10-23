// Ortak site betiği: çerez onayı ve en yüksek skor yardımcıları.
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

  document.addEventListener('DOMContentLoaded', initCookieBanner);
})();

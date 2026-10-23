(function () {
  var ICONS = ['🍎', '🚀', '🐱', '⚽', '🎸', '🌵', '🍕', '💎'];
  var cardsEl = document.getElementById('cards');
  var movesEl = document.getElementById('moves');
  var timeEl = document.getElementById('time');
  var msgEl = document.getElementById('msg');
  var bestEl = document.getElementById('best');
  var first, second, locked, moves, matched, seconds, timer, flipBack, paused, rnd;
  bestEl.textContent = MiniOyun.getBest('hafiza') || '-';

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function startTimer() {
    if (timer) return;
    timer = setInterval(function () { timeEl.textContent = ++seconds; }, 1000);
  }

  function flip(card) {
    if (locked || paused || MiniOyun.duraklatildi() || card === first || card.classList.contains('done')) return;
    startTimer();
    MiniOyun.ses('tik');
    card.classList.add('open');
    card.setAttribute('aria-label', card.dataset.icon);
    if (!first) { first = card; return; }

    second = card;
    moves++;
    movesEl.textContent = moves;

    if (first.dataset.icon === second.dataset.icon) {
      first.classList.add('done');
      second.classList.add('done');
      first = second = null;
      matched++;
      if (matched === ICONS.length) finish(); else MiniOyun.ses('puan');
    } else {
      locked = true;
      flipBack = setTimeout(function () {
        flipBack = null;
        first.classList.remove('open');
        second.classList.remove('open');
        first.setAttribute('aria-label', 'Kapalı kart');
        second.setAttribute('aria-label', 'Kapalı kart');
        first = second = null;
        locked = false;
      }, 800);
    }
  }

  function finish() {
    clearInterval(timer);
    timer = null;
    var rekor = MiniOyun.setBest('hafiza', moves, true);
    bestEl.textContent = MiniOyun.getBest('hafiza');
    msgEl.textContent = 'Tebrikler! ' + moves + ' hamlede, ' + seconds + ' saniyede bitirdin.';
    MiniOyun.bitti({ baslik: 'Tebrikler!', metin: moves + ' hamlede, ' + seconds + ' saniyede bitirdin.', rekor: rekor, sonuc: moves + ' hamle, ' + seconds + ' sn', paylas: 'Hafıza Kartları\'nı ' + moves + ' hamlede bitirdim! Sen kaç hamlede bitirirsin?' });
  }

  function start() {
    clearTimeout(flipBack);
    flipBack = null;
    clearInterval(timer);
    timer = null;
    paused = false;
    rnd = MiniOyun.rastgele();
    first = second = null;
    locked = false;
    moves = matched = seconds = 0;
    movesEl.textContent = 0;
    timeEl.textContent = 0;
    msgEl.textContent = '';
    cardsEl.innerHTML = '';
    shuffle(ICONS.concat(ICONS)).forEach(function (icon) {
      var card = document.createElement('button');
      card.className = 'card';
      card.dataset.icon = icon;
      card.textContent = icon;
      card.setAttribute('aria-label', 'Kapalı kart');
      card.addEventListener('click', function () { flip(card); });
      cardsEl.appendChild(card);
    });
  }

  document.getElementById('restart').addEventListener('click', start);
  MiniOyun.oyun({
    restart: start,
    canPause: function () { return !!timer; },
    pause: function () { paused = true; clearInterval(timer); timer = null; },
    resume: function () { paused = false; startTimer(); }
  });
  start();
})();

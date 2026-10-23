(function () {
  var ICONS = ['🍎', '🚀', '🐱', '⚽', '🎸', '🌵', '🍕', '💎'];
  var cardsEl = document.getElementById('cards');
  var movesEl = document.getElementById('moves');
  var timeEl = document.getElementById('time');
  var msgEl = document.getElementById('msg');
  var first, second, locked, moves, matched, seconds, timer;

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function startTimer() {
    if (timer) return;
    timer = setInterval(function () { timeEl.textContent = ++seconds; }, 1000);
  }

  function flip(card) {
    if (locked || card === first || card.classList.contains('done')) return;
    startTimer();
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
      if (matched === ICONS.length) finish();
    } else {
      locked = true;
      setTimeout(function () {
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
    msgEl.textContent = 'Tebrikler! ' + moves + ' hamlede, ' + seconds + ' saniyede bitirdin.';
  }

  function start() {
    clearInterval(timer);
    timer = null;
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
  start();
})();

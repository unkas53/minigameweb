// Günlük meydan okuma sayfası: günün oyunu, sonuç, seri ve son 7 gün.
// Oyun listesi (window.MO_OYUNLAR) tools/build-pages.js tarafından sayfaya yazılır;
// games.json'da "gunluk": true olan oyunlar sırayla günün oyunu olur.
(function () {
  var G = MiniOyun.gunluk;
  var eligible = (window.MO_OYUNLAR || []).filter(function (g) { return g.gunluk; })
    .sort(function (a, b) { return a.slug < b.slug ? -1 : 1; });
  if (!eligible.length) return;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function gameOf(date) {
    var n = G.no(date) - 1;
    return eligible[((n % eligible.length) + eligible.length) % eligible.length];
  }
  function trDate(date) { return date.split('-').reverse().join('.'); }
  function shift(date, days) {
    var d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function link(g, date) { return 'games/' + g.slug + '/?gunluk=' + date; }

  var today = G.bugun();
  var results = G.sonuclar();
  var game = gameOf(today);
  var mine = results[today];

  document.getElementById('gunluk-no').textContent = '📅 #' + G.no(today) + ' · ' + trDate(today);

  // Günün oyunu kartı
  var box = document.getElementById('bugun');
  box.style.setProperty('--c1', game.colors[0]);
  box.style.setProperty('--c2', game.colors[1]);
  var icon = el('span', 'gunluk-ikon', game.icon);
  icon.setAttribute('aria-hidden', 'true');
  if (game.icon.length > 2 && /^[\w]+$/.test(game.icon)) icon.classList.add('metin');
  box.appendChild(icon);
  box.appendChild(el('span', 'gunluk-baslik', 'Bugün: ' + game.title));
  box.appendChild(el('span', 'gunluk-aciklama', game.description));
  if (mine) {
    box.appendChild(el('span', 'gunluk-sonuc', '✅ Sonucun: ' + mine.sonuc));
    var actions = el('div', 'gunluk-dugmeler');
    var share = el('button', 'btn btn-play', 'Sonucu paylaş');
    share.type = 'button';
    share.addEventListener('click', function () {
      MiniOyun.paylas('MiniOyun Günlük #' + G.no(today) + ' · ' + game.title + ': ' + mine.sonuc + ' · 🔥 ' + G.seri() + ' gün seri', location.href.split('?')[0].split('#')[0]);
    });
    actions.appendChild(share);
    var again = el('a', 'btn btn-ghost', 'Tekrar oyna');
    again.href = link(game, today);
    actions.appendChild(again);
    box.appendChild(actions);
    var next = el('span', 'gunluk-geri-sayim');
    box.appendChild(next);
    var tick = function () {
      var now = new Date(), end = new Date(now);
      end.setHours(24, 0, 0, 0);
      var s = Math.max(0, Math.floor((end - now) / 1000));
      next.textContent = 'Yeni meydan okuma: ' + ('0' + Math.floor(s / 3600)).slice(-2) + ':' + ('0' + Math.floor(s / 60) % 60).slice(-2) + ':' + ('0' + s % 60).slice(-2);
      if (!s) location.reload();
    };
    tick();
    setInterval(tick, 1000);
  } else {
    var play = el('a', 'btn btn-play', 'Hemen oyna ▶');
    play.href = link(game, today);
    box.appendChild(play);
  }

  // Sayılar
  var stats = [[G.seri(), 'gün seri'], [Object.keys(results).length, 'tamamlanan gün'], ['#' + G.no(today), 'bugünkü bulmaca']];
  var ul = document.getElementById('gunluk-sayilar');
  stats.forEach(function (s) {
    var li = el('li');
    li.appendChild(el('b', '', String(s[0])));
    li.appendChild(el('span', '', s[1]));
    ul.appendChild(li);
  });

  // Son 7 gün: tamamlananlar işaretli, geçmiş günler alıştırma olarak oynanabilir
  var cal = document.getElementById('takvim');
  for (var i = 6; i >= 0; i--) {
    var date = shift(today, -i);
    if (G.no(date) < 1) continue;
    var g = gameOf(date), r = results[date];
    var cell = el('a', 'gunluk-gun' + (r ? ' tamam' : '') + (i === 0 ? ' bugun' : ''));
    cell.href = link(g, date);
    cell.appendChild(el('span', 'gunluk-gun-tarih', i === 0 ? 'Bugün' : trDate(date).slice(0, 5)));
    cell.appendChild(el('span', 'gunluk-gun-ikon', r ? '✅' : g.icon.length > 2 && /^[\w]+$/.test(g.icon) ? '🔢' : g.icon));
    cell.appendChild(el('span', 'gunluk-gun-sonuc', r ? r.sonuc : (i === 0 ? 'Oynanmadı' : 'Alıştırma')));
    cell.setAttribute('aria-label', trDate(date) + ' ' + g.title + (r ? ', sonuç ' + r.sonuc : ''));
    cal.appendChild(cell);
  }

  // Bugünün liderlik tablosu (sunucu ayarlıysa)
  var sv = MiniOyun.sunucu && MiniOyun.sunucu.hazir ? MiniOyun.sunucu : null;
  if (sv) {
    document.getElementById('gunluk-lider').hidden = false;
    sv.tabloCiz(document.getElementById('gunluk-lider-kutu'), { oyun: game.slug, seviye: null, gun: today, birim: game.rekor, limit: 10 });
  }
})();

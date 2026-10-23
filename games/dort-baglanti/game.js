// Dört Bağlantı: bilgisayara karşı (3 zorluk), aynı cihazda iki kişi veya çevrim içi oda.
// Çevrim içi mod MiniOyun.sunucu.kanal (Supabase Realtime broadcast) ile çalışır; sunucu ayarlı değilse gizlidir.
(function () {
  var COLS = 7, ROWS = 6, KIRMIZI = 1, SARI = 2;
  var ORDER = [3, 2, 4, 1, 5, 0, 6];
  var DEPTH = { kolay: 2, orta: 4, zor: 7 };
  var LEVEL_AD = { kolay: 'Kolay', orta: 'Orta', zor: 'Zor' };
  var RENK = { 1: 'Kırmızı', 2: 'Sarı' };
  var WIN_KEY = 'mo_db_galibiyet';

  var boardEl = document.getElementById('tahta');
  var statusEl = document.getElementById('durum');
  var modeEl = document.getElementById('mod');
  var levelEl = document.getElementById('level');
  var roomEl = document.getElementById('oda');
  var winsEl = document.getElementById('galibiyet');
  var bestEl = document.getElementById('best');
  var sv = MiniOyun.sunucu && MiniOyun.sunucu.hazir ? MiniOyun.sunucu : null;

  var board, heights, moves, over, starter, thinking = false, cursor = 3, rnd, cells = [];
  var mode = 'pc', level = 'orta';
  var room = null;

  function load(key, def) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v === null ? def : v; } catch (e) { return def; }
  }
  function bestKey() { return 'dort-baglanti-en-iyi-' + level; }
  function getBest() { var v = parseInt(localStorage.getItem(bestKey()), 10); return v > 0 ? v : 0; }
  function showStats() {
    winsEl.textContent = load(WIN_KEY, 0);
    var b = getBest();
    bestEl.textContent = b ? b + ' hamle' : '-';
  }

  // ---------- Kurallar ----------
  function turn() { return moves.length % 2 === 0 ? starter : 3 - starter; }

  // Son taşın oluşturduğu dörtlü (veya daha uzun) çizgi; yoksa null
  function winLine(b, idx) {
    var color = b[idx], r = Math.floor(idx / COLS), c = idx % COLS;
    var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (var d = 0; d < 4; d++) {
      var line = [idx];
      for (var s = -1; s <= 1; s += 2) {
        var rr = r + dirs[d][0] * s, cc = c + dirs[d][1] * s;
        while (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && b[rr * COLS + cc] === color) {
          line.push(rr * COLS + cc);
          rr += dirs[d][0] * s;
          cc += dirs[d][1] * s;
        }
      }
      if (line.length >= 4) return line;
    }
    return null;
  }

  // ---------- Bilgisayar (alfa-beta budamalı negamax) ----------
  function windowScore(b, color) {
    var score = 0, opp = 3 - color, r, c, k;
    for (r = 0; r < ROWS; r++) if (b[r * COLS + 3] === color) score += 3;
    var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (r = 0; r < ROWS; r++) {
      for (c = 0; c < COLS; c++) {
        for (var d = 0; d < 4; d++) {
          var er = r + dirs[d][0] * 3, ec = c + dirs[d][1] * 3;
          if (er < 0 || er >= ROWS || ec < 0 || ec >= COLS) continue;
          var mine = 0, theirs = 0;
          for (k = 0; k < 4; k++) {
            var v = b[(r + dirs[d][0] * k) * COLS + c + dirs[d][1] * k];
            if (v === color) mine++; else if (v === opp) theirs++;
          }
          if (mine && theirs) continue;
          if (mine === 3) score += 5; else if (mine === 2) score += 2;
          if (theirs === 3) score -= 4; else if (theirs === 2) score -= 1;
        }
      }
    }
    return score;
  }

  function negamax(b, h, depth, alpha, beta, color, filled) {
    if (filled === COLS * ROWS) return 0;
    if (depth === 0) return windowScore(b, color);
    var best = -Infinity;
    for (var i = 0; i < COLS; i++) {
      var c = ORDER[i];
      if (h[c] >= ROWS) continue;
      var idx = (ROWS - 1 - h[c]) * COLS + c;
      b[idx] = color; h[c]++;
      var v = winLine(b, idx) ? 1000 + depth : -negamax(b, h, depth - 1, -beta, -alpha, 3 - color, filled + 1);
      b[idx] = 0; h[c]--;
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    return best;
  }

  function legal() { var out = []; for (var c = 0; c < COLS; c++) if (heights[c] < ROWS) out.push(c); return out; }

  function aiChoice(color) {
    var cols = legal();
    if (level === 'kolay' && rnd() < 0.35) return cols[Math.floor(rnd() * cols.length)];
    var b = board.slice(), h = heights.slice(), best = -Infinity, choices = [];
    for (var i = 0; i < COLS; i++) {
      var c = ORDER[i];
      if (h[c] >= ROWS) continue;
      var idx = (ROWS - 1 - h[c]) * COLS + c;
      b[idx] = color; h[c]++;
      var v = winLine(b, idx) ? 100000 : -negamax(b, h, DEPTH[level] - 1, -Infinity, Infinity, 3 - color, moves.length + 1);
      b[idx] = 0; h[c]--;
      if (v > best) { best = v; choices = [c]; } else if (v === best) choices.push(c);
    }
    return choices[Math.floor(rnd() * choices.length)];
  }

  function aiTurn() {
    thinking = true;
    boardEl.classList.add('kilit');
    draw();
    setTimeout(function () {
      if (over || mode !== 'pc') { thinking = false; return; }
      var c = aiChoice(SARI);
      thinking = false;
      drop(c);
    }, 450);
  }

  // ---------- Tahta ----------
  function build() {
    boardEl.innerHTML = '';
    cells = [];
    for (var i = 0; i < COLS * ROWS; i++) {
      var d = document.createElement('div');
      d.className = 'db-hucre';
      d.dataset.c = i % COLS;
      d.setAttribute('role', 'gridcell');
      boardEl.appendChild(d);
      cells.push(d);
    }
  }

  function canPlay() {
    if (over || thinking || MiniOyun.duraklatildi()) return false;
    if (mode === 'pc') return turn() === KIRMIZI;
    if (mode === 'cevrimici') return !!(room && room.rakip && turn() === room.ben);
    return true;
  }

  function draw() {
    for (var i = 0; i < cells.length; i++) {
      var v = board[i];
      cells[i].classList.toggle('k', v === KIRMIZI);
      cells[i].classList.toggle('s', v === SARI);
      cells[i].classList.toggle('secili', !v && i % COLS === cursor && canPlay());
    }
    boardEl.classList.toggle('kilit', !canPlay());
    drawStatus();
  }

  function piece(color) { return '<span class="db-tas-ornek ' + (color === KIRMIZI ? 'k' : 's') + '" aria-hidden="true"></span>'; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }

  function drawStatus() {
    var t = turn(), html;
    if (over) return;
    if (mode === 'pc') html = thinking ? piece(SARI) + 'Bilgisayar düşünüyor…' : piece(KIRMIZI) + 'Sıra sende';
    else if (mode === 'iki') html = piece(t) + 'Sıra: ' + RENK[t];
    else if (!room) html = 'Bir oda kur ya da arkadaşının oda koduyla katıl.';
    else if (room.dolu) html = 'Bu oda dolu. Başka bir oda kurabilirsin.';
    else if (!room.bagli) html = 'Odaya bağlanılıyor…';
    else if (!room.rakip) html = 'Rakip bekleniyor… Bağlantıyı arkadaşına gönder.';
    else {
      var me = room.ben, opp = 3 - me;
      html = piece(me) + 'Sen' + ' vs ' + piece(opp) + esc(room.rakip.avatar + ' ' + room.rakip.ad) + ' · ' + (t === me ? '<b>Sıra sende</b>' : 'Rakip düşünüyor…');
    }
    statusEl.innerHTML = html;
  }

  function reset(first) {
    board = []; heights = []; moves = [];
    for (var i = 0; i < COLS * ROWS; i++) board.push(0);
    for (var c = 0; c < COLS; c++) heights.push(0);
    over = false;
    thinking = false;
    starter = first || KIRMIZI;
    rnd = MiniOyun.rastgele();
    cells.forEach(function (el) { el.classList.remove('yeni', 'dort'); });
    draw();
  }

  function place(c, animate) {
    var idx = (ROWS - 1 - heights[c]) * COLS + c;
    board[idx] = turn();
    heights[c]++;
    moves.push(c);
    var el = cells[idx];
    el.classList.remove('yeni');
    if (animate) {
      el.style.setProperty('--d', Math.floor(idx / COLS) + 1);
      void el.offsetWidth;
      el.classList.add('yeni');
    }
    return idx;
  }

  // Sütuna taş bırakır. net: hamle rakipten geldi
  function drop(c, net) {
    if (over || c < 0 || c >= COLS || heights[c] >= ROWS) return false;
    var color = turn();
    var idx = place(c, true);
    MiniOyun.ses('tik');
    if (mode === 'cevrimici' && !net && room) send('hamle', { oyunNo: room.oyunNo, n: moves.length - 1, col: c });
    var line = winLine(board, idx);
    if (line || moves.length === COLS * ROWS) {
      over = true;
      draw();
      if (line) line.forEach(function (i) { cells[i].classList.add('dort'); });
      finish(line ? color : 0);
      return true;
    }
    draw();
    if (mode === 'pc' && turn() === SARI) aiTurn();
    return true;
  }

  function finish(winner) {
    var levelAd = LEVEL_AD[level];
    if (mode === 'pc') {
      if (winner === KIRMIZI) {
        var n = Math.ceil(moves.length / 2), prev = getBest(), rekor = !prev || n < prev;
        if (rekor) { try { localStorage.setItem(bestKey(), String(n)); } catch (e) {} }
        try { localStorage.setItem(WIN_KEY, JSON.stringify(load(WIN_KEY, 0) + 1)); } catch (e) {}
        showStats();
        statusEl.innerHTML = piece(KIRMIZI) + 'Kazandın!';
        MiniOyun.bitti({ baslik: 'Kazandın! 🎉', metin: levelAd + ' bilgisayarı ' + n + ' hamlede yendin.', rekor: rekor, skor: n, seviye: level, sonuc: n + ' hamle (' + levelAd + ')', paylas: 'Dört Bağlantı\'da ' + levelAd + ' bilgisayarı ' + n + ' hamlede yendim! Sen de dene.' });
      } else if (winner === SARI) {
        statusEl.innerHTML = piece(SARI) + 'Bilgisayar kazandı';
        MiniOyun.bitti({ baslik: 'Bilgisayar kazandı', metin: 'Dört taşı önce bilgisayar birleştirdi. Bir daha dene!', kaybetti: true, paylas: 'Dört Bağlantı\'da bilgisayarı yenebilir misin?' });
      } else {
        statusEl.textContent = 'Berabere';
        MiniOyun.bitti({ baslik: 'Berabere', metin: 'Tahta doldu, kimse dört taşı birleştiremedi.', paylas: 'Dört Bağlantı\'da bilgisayarla berabere kaldım!' });
      }
      return;
    }
    if (mode === 'iki') {
      statusEl.innerHTML = winner ? piece(winner) + RENK[winner] + ' kazandı!' : 'Berabere';
      MiniOyun.bitti({ baslik: winner ? RENK[winner] + ' kazandı!' : 'Berabere', metin: winner ? moves.length + ' hamlede dört taş birleşti.' : 'Tahta doldu.', paylas: 'MiniOyun\'da arkadaşımla Dört Bağlantı oynadık, sen de dene!' });
      return;
    }
    var won = winner && room && winner === room.ben;
    statusEl.innerHTML = winner ? piece(winner) + (won ? 'Kazandın!' : 'Rakibin kazandı') : 'Berabere';
    MiniOyun.bitti({ baslik: !winner ? 'Berabere' : won ? 'Kazandın! 🎉' : 'Rakibin kazandı', metin: 'Yeni oyun için "Tekrar oyna"ya bas; rakibin de aynı odada yeni oyuna geçer.', kaybetti: !!winner && !won, paylas: 'MiniOyun\'da çevrim içi Dört Bağlantı oynuyorum, sen de gel!' });
  }

  function humanDrop(c) {
    if (!canPlay()) return;
    cursor = c;
    drop(c);
  }

  boardEl.addEventListener('click', function (e) {
    var cell = e.target.closest('.db-hucre');
    if (cell) humanDrop(+cell.dataset.c);
  });
  boardEl.addEventListener('mousemove', function (e) {
    var cell = e.target.closest('.db-hucre');
    if (cell && +cell.dataset.c !== cursor) { cursor = +cell.dataset.c; draw(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('input, select, textarea, dialog')) return;
    var k = e.key;
    if (k === 'ArrowLeft' || k === 'ArrowRight') {
      cursor = (cursor + (k === 'ArrowLeft' ? COLS - 1 : 1)) % COLS;
      draw();
      e.preventDefault();
    } else if ((k === 'Enter' || k === ' ' || k === 'ArrowDown') && document.activeElement === boardEl) {
      humanDrop(cursor);
      e.preventDefault();
    } else if (/^[1-7]$/.test(k)) {
      humanDrop(+k - 1);
    }
  });

  // ---------- Çevrim içi oda ----------
  var KOD_HARF = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function newCode() { var s = ''; for (var i = 0; i < 5; i++) s += KOD_HARF[Math.floor(Math.random() * KOD_HARF.length)]; return s; }
  function cleanCode(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8); }
  function roomUrl(kod) { return location.href.split('?')[0].split('#')[0] + '?oda=' + kod; }
  function profile() { var p = load('mo_profil', {}); return { ad: (p.ad || 'Oyuncu').slice(0, 20), avatar: p.avatar || '🙂' }; }

  function send(event, payload) {
    if (!room || !room.ch) return;
    try { room.ch.send({ type: 'broadcast', event: event, payload: payload }); } catch (e) {}
  }

  // Odadaki ilk iki kişi oynar; erken gelen Kırmızı olur
  function settleRoles() {
    var all = [{ id: room.id, t: room.t }].concat(Object.keys(room.peers).map(function (k) { return room.peers[k]; }));
    all.sort(function (a, b) { return a.t - b.t || (a.id < b.id ? -1 : 1); });
    var players = all.slice(0, 2), mineIdx = -1;
    players.forEach(function (p, i) { if (p.id === room.id) mineIdx = i; });
    if (mineIdx === -1) { room.dolu = true; leaveChannel(); drawRoom(); draw(); return; }
    room.ben = mineIdx === 0 ? KIRMIZI : SARI;
    var had = !!room.rakip;
    room.rakip = players[1 - mineIdx] || null;
    if (room.rakip && !had) MiniOyun.ses('puan');
    draw();
  }

  function hello(reply) {
    var p = profile();
    send('merhaba', { id: room.id, t: room.t, ad: p.ad, avatar: p.avatar, cevap: !!reply });
  }

  function onHello(p) {
    if (!room || !p || p.id === room.id) return;
    room.peers[p.id] = { id: p.id, t: p.t, ad: String(p.ad || 'Oyuncu').slice(0, 20), avatar: String(p.avatar || '🙂').slice(0, 8) };
    if (!p.cevap) hello(true);
    settleRoles();
    send('durum', { oyunNo: room.oyunNo, moves: moves.slice() });
  }

  function loadMoves(list) {
    reset(room.oyunNo % 2 === 0 ? KIRMIZI : SARI);
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c < 0 || c >= COLS || heights[c] >= ROWS) break;
      var idx = place(c, false);
      var line = winLine(board, idx);
      if (line || moves.length === COLS * ROWS) {
        over = true;
        draw();
        if (line) line.forEach(function (j) { cells[j].classList.add('dort'); });
        statusEl.innerHTML = line ? piece(board[idx]) + (board[idx] === room.ben ? 'Kazandın!' : 'Rakibin kazandı') : 'Berabere';
        return;
      }
    }
    draw();
  }

  function onState(p) {
    if (!room || !p || !Array.isArray(p.moves)) return;
    var same = p.oyunNo === room.oyunNo && p.moves.length > moves.length && moves.every(function (c, i) { return p.moves[i] === c; });
    if (p.oyunNo > room.oyunNo || same) {
      room.oyunNo = p.oyunNo;
      loadMoves(p.moves);
    }
  }

  function onMove(p) {
    if (!room || !room.rakip || !p || p.oyunNo !== room.oyunNo || p.n !== moves.length || turn() === room.ben) return;
    drop(+p.col, true);
  }

  function onRematch(p) {
    if (!room || !p || p.oyunNo !== room.oyunNo + 1) return;
    room.oyunNo = p.oyunNo;
    reset(room.oyunNo % 2 === 0 ? KIRMIZI : SARI);
  }

  function onBye(p) {
    if (!room || !p || !room.peers[p.id]) return;
    delete room.peers[p.id];
    var was = room.rakip && room.rakip.id === p.id;
    settleRoles();
    if (was && !over) statusEl.textContent = 'Rakibin odadan ayrıldı. Bağlantıyı tekrar gönderebilirsin.';
  }

  function joinRoom(kod) {
    leaveRoom(true);
    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem('mo_oda_' + kod)); } catch (e) {}
    if (!saved || !saved.id) {
      saved = { id: Math.random().toString(36).slice(2, 10), t: Date.now() };
      try { sessionStorage.setItem('mo_oda_' + kod, JSON.stringify(saved)); } catch (e) {}
    }
    room = { kod: kod, id: saved.id, t: saved.t, peers: {}, rakip: null, ben: KIRMIZI, oyunNo: 0, bagli: false, dolu: false, ch: null };
    try { history.replaceState(null, '', roomUrl(kod)); } catch (e) {}
    reset(KIRMIZI);
    drawRoom();
    var r = room;
    sv.kanal('dort-baglanti-' + kod, r.id).then(function (ch) {
      if (room !== r) { sv.kanalBirak(ch); return; }
      r.ch = ch;
      ch.on('broadcast', { event: 'merhaba' }, function (m) { onHello(m.payload); });
      ch.on('broadcast', { event: 'durum' }, function (m) { onState(m.payload); });
      ch.on('broadcast', { event: 'hamle' }, function (m) { onMove(m.payload); });
      ch.on('broadcast', { event: 'yeniden' }, function (m) { onRematch(m.payload); });
      ch.on('broadcast', { event: 'gule' }, function (m) { onBye(m.payload); });
      ch.subscribe(function (status) {
        if (status === 'SUBSCRIBED' && room === r) {
          r.bagli = true;
          hello(false);
          draw();
        }
      });
    }, function () {
      if (room === r) statusEl.textContent = 'Odaya bağlanılamadı. İnternet bağlantını kontrol edip tekrar dene.';
    });
  }

  function leaveChannel() {
    if (room && room.ch) {
      send('gule', { id: room.id });
      sv.kanalBirak(room.ch);
      room.ch = null;
    }
  }

  function leaveRoom(silent) {
    if (!room) return;
    leaveChannel();
    room = null;
    try { history.replaceState(null, '', location.href.split('?')[0]); } catch (e) {}
    if (!silent) { reset(KIRMIZI); drawRoom(); }
  }

  function button(text, cls, fn) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn' + (cls ? ' ' + cls : '');
    b.textContent = text;
    b.addEventListener('click', fn);
    return b;
  }

  function drawRoom() {
    roomEl.hidden = mode !== 'cevrimici';
    roomEl.innerHTML = '';
    if (mode !== 'cevrimici') return;
    var row = document.createElement('div');
    row.className = 'db-oda-satir';
    var p = document.createElement('p');
    if (!sv) {
      p.textContent = 'Çevrim içi oyun şu an kullanılamıyor.';
      roomEl.appendChild(p);
      return;
    }
    if (!room || room.dolu) {
      p.textContent = 'Arkadaşınla oynamak için bir oda kur ve bağlantıyı gönder ya da onun oda koduyla katıl.';
      var input = document.createElement('input');
      input.id = 'oda-kod';
      input.placeholder = 'KOD';
      input.maxLength = 8;
      input.setAttribute('aria-label', 'Oda kodu');
      var join = function () { var k = cleanCode(input.value); if (k.length >= 4) joinRoom(k); else input.focus(); };
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') join(); });
      row.appendChild(button('Oda kur', '', function () { joinRoom(newCode()); }));
      row.appendChild(input);
      row.appendChild(button('Katıl', 'btn-ghost', join));
    } else {
      p.textContent = 'Oda kodu';
      var kod = document.createElement('div');
      kod.className = 'db-oda-kod';
      kod.textContent = room.kod;
      roomEl.appendChild(p);
      roomEl.appendChild(kod);
      p = null;
      row.appendChild(button('Bağlantıyı gönder', '', function () { MiniOyun.paylas('MiniOyun\'da Dört Bağlantı oynayalım! Oda kodu: ' + room.kod, roomUrl(room.kod)); }));
      row.appendChild(button('Odadan çık', 'btn-ghost', function () { leaveRoom(); }));
    }
    if (p) roomEl.appendChild(p);
    roomEl.appendChild(row);
  }

  window.addEventListener('pagehide', function () { if (room) send('gule', { id: room.id }); });

  // ---------- Mod ve seviye ----------
  function setMode(m) {
    if (m === 'cevrimici' && !sv) m = 'pc';
    if (mode === 'cevrimici' && m !== 'cevrimici') leaveRoom(true);
    mode = m;
    modeEl.value = m;
    levelEl.hidden = m !== 'pc';
    reset(KIRMIZI);
    drawRoom();
  }

  function restart() {
    if (mode === 'cevrimici') {
      if (!room || !room.rakip) { reset(KIRMIZI); return; }
      if (!over && moves.length) { statusEl.textContent = 'Çevrim içi oyunda yeni oyun, bu oyun bitince başlar.'; return; }
      room.oyunNo++;
      reset(room.oyunNo % 2 === 0 ? KIRMIZI : SARI);
      send('yeniden', { oyunNo: room.oyunNo });
      return;
    }
    reset(KIRMIZI);
  }

  modeEl.addEventListener('change', function () { setMode(modeEl.value); });
  levelEl.addEventListener('change', function () { level = levelEl.value; showStats(); reset(KIRMIZI); });
  document.getElementById('restart').addEventListener('click', restart);

  MiniOyun.oyun({
    restart: restart,
    seviye: function () { return mode === 'pc' ? level : ''; }
  });

  build();
  if (sv) modeEl.querySelector('[value="cevrimici"]').hidden = false;
  level = levelEl.value;
  showStats();
  var odaMatch = location.search.match(/[?&]oda=([A-Za-z0-9]+)/);
  if (odaMatch && sv) { setMode('cevrimici'); joinRoom(cleanCode(odaMatch[1])); }
  else setMode(odaMatch ? 'pc' : 'pc');
})();

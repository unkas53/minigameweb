// Profil sayfası: takma ad ve avatar, istatistikler, rozetler, rekorlar ve veri aktarma.
// Oyun listesi (window.MO_OYUNLAR) tools/build-pages.js tarafından sayfaya yazılır.
(function () {
  var PROFILE_KEY = 'mo_profil';
  var AVATARS = ['🙂', '😎', '🤓', '🥳', '🤖', '👾', '🦊', '🐼', '🐯', '🐸', '🦄', '🐙', '🚀', '⚡', '🌟', '🍕'];
  var games = window.MO_OYUNLAR || [];

  function load(key, def) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v === null ? def : v; } catch (e) { return def; }
  }
  function save(key, v) {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {}
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function sum(obj) {
    var n = 0;
    for (var k in obj) n += obj[k];
    return n;
  }

  var profile = load(PROFILE_KEY, {});
  var avatarBtn = document.getElementById('avatar');
  var picker = document.getElementById('avatar-secici');
  var nameInput = document.getElementById('takma-ad');

  function drawProfile() {
    avatarBtn.textContent = profile.avatar || AVATARS[0];
    nameInput.value = profile.ad || '';
  }

  AVATARS.forEach(function (a) {
    var b = el('button', 'avatar-sec', a);
    b.type = 'button';
    b.setAttribute('aria-label', 'Avatar ' + a);
    b.addEventListener('click', function () {
      profile.avatar = a;
      save(PROFILE_KEY, profile);
      picker.hidden = true;
      avatarBtn.setAttribute('aria-expanded', 'false');
      drawProfile();
      if (MiniOyun.ustAvatar) MiniOyun.ustAvatar();
    });
    picker.appendChild(b);
  });
  avatarBtn.addEventListener('click', function () {
    picker.hidden = !picker.hidden;
    avatarBtn.setAttribute('aria-expanded', picker.hidden ? 'false' : 'true');
  });
  nameInput.addEventListener('input', function () {
    profile.ad = nameInput.value.trim().slice(0, 20);
    save(PROFILE_KEY, profile);
  });

  function drawStats(st) {
    var earned = MiniOyun.rozetler.filter(function (b) { return st.rozetler[b.id]; }).length;
    var items = [
      [Object.keys(st.oynama).length, 'farklı oyun'],
      [sum(st.oynama), 'oynama'],
      [sum(st.bitirme), 'biten oyun'],
      [st.seri, 'gün seri'],
      [earned + '/' + MiniOyun.rozetler.length, 'rozet']
    ];
    var ul = document.getElementById('sayilar');
    ul.innerHTML = '';
    items.forEach(function (it) {
      var li = el('li');
      li.appendChild(el('b', '', String(it[0])));
      li.appendChild(el('span', '', it[1]));
      ul.appendChild(li);
    });
    document.getElementById('rozet-sayac').textContent = earned + '/' + MiniOyun.rozetler.length;
  }

  function drawBadges(st) {
    var grid = document.getElementById('rozetler');
    grid.innerHTML = '';
    // Kazanılanlar önce
    var list = MiniOyun.rozetler.slice().sort(function (a, b) { return (st.rozetler[b.id] ? 1 : 0) - (st.rozetler[a.id] ? 1 : 0); });
    list.forEach(function (b) {
      var got = st.rozetler[b.id];
      var card = el('div', 'rozet' + (got ? ' kazanildi' : ''));
      card.appendChild(el('span', 'rozet-ikon', got ? b.ikon : '🔒'));
      card.appendChild(el('strong', '', b.ad));
      card.appendChild(el('small', '', b.aciklama));
      if (got) card.appendChild(el('span', 'rozet-tarih', got.split('-').reverse().join('.')));
      card.setAttribute('aria-label', b.ad + (got ? ', kazanıldı' : ', kilitli') + ': ' + b.aciklama);
      grid.appendChild(card);
    });
  }

  // Bir oyunun rekorları: mo_best_<slug> veya seviye başına <slug>-en-iyi-<seviye> anahtarları
  function records(slug) {
    var out = [];
    try {
      var main = localStorage.getItem('mo_best_' + slug);
      if (main && main !== '0') out.push(['', main]);
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k.indexOf(slug + '-en-iyi-') === 0) out.push([k.slice(slug.length + 8), localStorage.getItem(k)]);
      }
    } catch (e) {}
    return out;
  }

  function drawRecords(st) {
    var box = document.getElementById('rekorlar');
    box.innerHTML = '';
    games.forEach(function (g) {
      var row = el('a', 'rekor');
      row.href = 'games/' + g.slug + '/';
      var icon = el('span', 'rekor-ikon', g.icon);
      icon.style.setProperty('--c1', g.colors[0]);
      icon.style.setProperty('--c2', g.colors[1]);
      icon.setAttribute('aria-hidden', 'true');
      if (g.icon.length > 2 && /^[\w]+$/.test(g.icon)) icon.classList.add('metin');
      row.appendChild(icon);
      var info = el('span', 'rekor-bilgi');
      info.appendChild(el('strong', '', g.title));
      var plays = st.oynama[g.slug] || 0;
      info.appendChild(el('small', '', plays ? plays + ' kez oynandı' : 'Henüz oynamadın'));
      row.appendChild(info);
      var recs = records(g.slug);
      var val = el('span', 'rekor-deger');
      if (!recs.length) val.textContent = '—';
      recs.forEach(function (r) {
        var line = el('span', '', (r[0] ? r[0].charAt(0).toLocaleUpperCase('tr') + r[0].slice(1) + ': ' : '') + r[1] + ' ' + (g.rekor || 'puan'));
        val.appendChild(line);
      });
      row.appendChild(val);
      box.appendChild(row);
    });
  }

  function drawAll() {
    var st = MiniOyun.istatistik();
    drawProfile();
    drawStats(st);
    drawBadges(st);
    drawRecords(st);
  }

  // ---------- Veri aktarma ----------
  function myKeys() {
    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k.indexOf('mo_') === 0 || k.indexOf('-en-iyi-') !== -1) keys.push(k);
      }
    } catch (e) {}
    return keys;
  }

  document.getElementById('disa-aktar').addEventListener('click', function () {
    var data = {};
    myKeys().forEach(function (k) { data[k] = localStorage.getItem(k); });
    var code = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    var ta = document.getElementById('kod');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(function () { alertBox('Kod kopyalandı. Diğer cihazda "Kod yapıştır" ile yükle.'); }, show);
    } else {
      show();
    }
    function show() {
      document.getElementById('ice-aktar-kutu').hidden = false;
      ta.value = code;
      ta.select();
      alertBox('Kodu seçip kopyala.');
    }
  });

  document.getElementById('ice-aktar').addEventListener('click', function () {
    var box = document.getElementById('ice-aktar-kutu');
    box.hidden = !box.hidden;
    if (!box.hidden) document.getElementById('kod').focus();
  });

  document.getElementById('kod-uygula').addEventListener('click', function () {
    try {
      var data = JSON.parse(decodeURIComponent(escape(atob(document.getElementById('kod').value.trim()))));
      Object.keys(data).forEach(function (k) {
        if (typeof data[k] === 'string' && (k.indexOf('mo_') === 0 || k.indexOf('-en-iyi-') !== -1)) localStorage.setItem(k, data[k]);
      });
      profile = load(PROFILE_KEY, {});
      document.getElementById('kod').value = '';
      document.getElementById('ice-aktar-kutu').hidden = true;
      drawAll();
      if (MiniOyun.ustAvatar) MiniOyun.ustAvatar();
      alertBox('Verilerin yüklendi.');
    } catch (e) {
      alertBox('Kod geçersiz. Tamamını kopyaladığından emin ol.');
    }
  });

  var delBtn = document.getElementById('sil');
  var delArmed = null;
  // Onay penceresi yerine iki aşamalı düğme
  delBtn.addEventListener('click', function () {
    if (!delArmed) {
      delBtn.textContent = 'Emin misin? Tekrar bas';
      delArmed = setTimeout(function () { delArmed = null; delBtn.textContent = 'Tüm verilerimi sil'; }, 4000);
      return;
    }
    clearTimeout(delArmed);
    delArmed = null;
    myKeys().forEach(function (k) { if (k !== 'mo_cookie_consent') localStorage.removeItem(k); });
    profile = {};
    delBtn.textContent = 'Tüm verilerimi sil';
    drawAll();
    if (MiniOyun.ustAvatar) MiniOyun.ustAvatar();
    alertBox('Tüm verilerin silindi.');
  });

  var statusEl;
  function alertBox(text) {
    if (!statusEl) {
      statusEl = el('p', 'veri-durum');
      statusEl.setAttribute('role', 'status');
      document.querySelector('.veri-kutu').appendChild(statusEl);
    }
    statusEl.textContent = text;
  }

  drawAll();
})();

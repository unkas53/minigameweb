// Sunucu arayüzü testi: gerçek Supabase yerine sahte bir istemciyle liderlik tablosu, skor gönderme,
// hesap formu ve günlük liderler bölümü denenir. smoke-test.js tüm oyunlar test edilirken çalıştırır.
module.exports.sahte = function () {
  if (location.hash === '#sunucusuz') { window.MO_SUNUCU_KAPALI = true; return; }
  var calls = window.__sunucuCagri = [];
  var session = null;
  var rows = [
    { sira: 1, takma_ad: 'Ayşe', avatar: '🦊', skor: 12, ben: false },
    { sira: 2, takma_ad: 'Test', avatar: '🙂', skor: 14, ben: true }
  ];
  function ok(data) { return Promise.resolve({ data: data, error: null }); }
  function query(table) {
    var q = {
      upsert: function (v) { calls.push(['upsert', table, v]); return ok(null); },
      select: function () { return q; },
      eq: function () { return q; },
      maybeSingle: function () { calls.push(['select', table]); return ok(null); }
    };
    return q;
  }
  window.MO_SUNUCU_TEST = {
    auth: {
      getSession: function () { return ok({ session: session }); },
      signInAnonymously: function () {
        session = { user: { id: 'u1', is_anonymous: true } };
        calls.push(['anonim']);
        return ok(session);
      },
      updateUser: function (v) {
        calls.push(['updateUser', v.email]);
        return Promise.resolve({ data: null, error: { code: 'email_exists', message: 'already registered' } });
      },
      signInWithOtp: function (v) { calls.push(['otp', v.email]); return ok({}); },
      signOut: function () { session = null; calls.push(['cikis']); return ok(null); }
    },
    from: query,
    rpc: function (name, args) {
      calls.push(['rpc', name, args]);
      if (name === 'skor_gonder') return ok(2);
      if (name === 'liderler') return ok(rows);
      return ok(null);
    },
    // Oda kanalı: aynı tarayıcıdaki sekmeler arasında BroadcastChannel ile yayın
    channel: function (name) {
      var bc = new BroadcastChannel('sahte-' + name), handlers = {};
      calls.push(['kanal', name]);
      return {
        on: function (type, filter, cb) { handlers[filter.event] = cb; return this; },
        subscribe: function (cb) {
          bc.onmessage = function (e) { var h = handlers[e.data.event]; if (h) h({ payload: e.data.payload }); };
          setTimeout(function () { cb('SUBSCRIBED'); }, 20);
          return this;
        },
        send: function (m) { bc.postMessage({ event: m.event, payload: m.payload }); return Promise.resolve('ok'); },
        _kapat: function () { bc.close(); }
      };
    },
    removeChannel: function (ch) { if (ch && ch._kapat) ch._kapat(); return ok(null); }
  };
};

module.exports.test = async function (page, { git, beklenen, origin, yeniSayfa }) {
  const calls = () => page.evaluate(() => window.__sunucuCagri);

  // Sunucu yokken liderlik düğmesi görünmemeli
  await git('games/hafiza/#sunucusuz');
  beklenen(await page.locator('.oyun-btn[aria-label="Liderlik tablosu"]').count() === 0, 'sunucu ayarlı değilken liderlik düğmesi görünüyor');

  await git('games/hafiza/');
  beklenen(await page.locator('.oyun-btn[aria-label="Liderlik tablosu"]').count() === 1, 'liderlik tablosu düğmesi yok');

  // Skor gönderme ve oyun sonu penceresindeki sıra
  await page.evaluate(() => MiniOyun.bitti({ baslik: 'Tebrikler!', metin: 'test', skor: 14, sonuc: '14 hamle' }));
  await page.waitForSelector('.oyun-sonu-sira .lider-ac', { timeout: 3000 });
  const rank = await page.textContent('.oyun-sonu-sira');
  beklenen(rank.includes('#2'), 'oyun sonunda sıra yazmıyor: ' + rank);
  const sent = (await calls()).find(c => c[0] === 'rpc' && c[1] === 'skor_gonder');
  beklenen(sent && sent[2].p_oyun === 'hafiza' && sent[2].p_skor === 14 && sent[2].p_kucuk_iyi === true, 'skor yanlış gönderildi: ' + JSON.stringify(sent));
  beklenen((await calls()).some(c => c[0] === 'anonim'), 'anonim oturum açılmadı');
  const prof = (await calls()).find(c => c[0] === 'upsert' && c[1] === 'profiller');
  beklenen(prof && /^Oyuncu\d{4}$/.test(prof[2].takma_ad), 'varsayılan takma ad gönderilmedi');

  // Tabloyu aç
  await page.click('.oyun-sonu-sira .lider-ac');
  await page.waitForSelector('.oyun-lider[open] .lider-liste li', { timeout: 3000 });
  beklenen(await page.locator('.oyun-lider .lider-liste li').count() === 2, 'liderlik tablosu satırları eksik');
  beklenen((await page.textContent('.oyun-lider li.ben')).includes('(sen)'), 'oyuncunun kendi satırı işaretli değil');
  beklenen((await page.textContent('.oyun-lider .lider-skor')).includes('12 hamle'), 'skor birimi yanlış');
  await page.click('.oyun-lider .oyun-dlg-actions .btn');

  // Seviyeli oyunda seviye gider; sn biriminde süre biçimlenir
  await git('games/sudoku/');
  await page.evaluate(() => MiniOyun.bitti({ baslik: 'x', skor: 75 }));
  await page.waitForSelector('.oyun-sonu-sira .lider-ac', { timeout: 3000 });
  const sudoku = (await calls()).find(c => c[0] === 'rpc' && c[1] === 'skor_gonder');
  beklenen(sudoku && sudoku[2].p_seviye && sudoku[2].p_kucuk_iyi === true, 'sudoku seviyesi gönderilmedi: ' + JSON.stringify(sudoku));

  // Profil: hesap bölümü ve e-posta formu
  await git('profil.html');
  beklenen(await page.isVisible('#hesap'), 'profilde hesap bölümü görünmüyor');
  await page.fill('#eposta', 'test@example.com');
  await page.click('#hesap-form button');
  await page.waitForFunction(() => /hesap var/.test(document.getElementById('hesap-mesaj').textContent), null, { timeout: 3000 });
  beklenen((await calls()).some(c => c[0] === 'otp' && c[1] === 'test@example.com'), 'mevcut hesaba giriş bağlantısı gönderilmedi');
  await page.click('#hesap-sil');
  await page.click('#hesap-sil');
  await page.waitForFunction(() => /silindi/.test(document.getElementById('hesap-mesaj').textContent), null, { timeout: 3000 });

  // Günlük sayfası: bugünün liderleri
  await git('gunluk.html');
  await page.waitForSelector('#gunluk-lider-kutu .lider-liste li', { timeout: 3000 });
  const daily = (await calls()).find(c => c[0] === 'rpc' && c[1] === 'liderler');
  beklenen(daily && daily[2].p_seviye === null && daily[2].p_gun, 'günlük liderler yanlış sorgulandı: ' + JSON.stringify(daily));

  // Dört Bağlantı çevrim içi oda: iki sekme aynı odada sırayla oynar
  await git('games/dort-baglanti/');
  await page.selectOption('#mod', 'cevrimici');
  await page.click('#oda button:has-text("Oda kur")');
  await page.waitForSelector('.db-oda-kod');
  const kod = await page.textContent('.db-oda-kod');
  beklenen(page.url().includes('?oda=' + kod), 'oda bağlantısı adres çubuğunda yok');
  const p2 = await yeniSayfa();
  await p2.goto(origin + 'games/dort-baglanti/?oda=' + kod);
  await page.waitForFunction(() => /Sıra sende/.test(document.getElementById('durum').textContent), null, { timeout: 4000 });
  await p2.waitForFunction(() => /Rakip düşünüyor/.test(document.getElementById('durum').textContent), null, { timeout: 4000 });
  const col = (pg, c) => pg.click(`.db-hucre[data-c="${c}"] >> nth=0`);
  const both = async (fn) => { await page.waitForFunction(fn, null, { timeout: 3000 }); await p2.waitForFunction(fn, null, { timeout: 3000 }); };
  // Kırmızı (oda kuran) 0. sütunda dikey dörtlü yapar
  for (let i = 0; i < 3; i++) {
    await col(page, 0);
    await both(`document.querySelectorAll('.db-hucre.k').length === ${i + 1}`);
    await col(p2, 1);
    await both(`document.querySelectorAll('.db-hucre.s').length === ${i + 1}`);
  }
  await col(p2, 2); // sırası olmayan oyuncunun hamlesi yok sayılmalı
  await page.waitForTimeout(200);
  beklenen(await p2.$$eval('.db-hucre.s', c => c.length) === 3, 'sırası olmayan oyuncu taş bırakabildi');
  await col(page, 0);
  await page.waitForSelector('.oyun-sonu[open]', { timeout: 3000 });
  await p2.waitForSelector('.oyun-sonu[open]', { timeout: 3000 });
  beklenen((await page.textContent('.oyun-sonu h2')).includes('Kazandın'), 'kazanan tarafta "Kazandın" yazmıyor');
  beklenen((await p2.textContent('.oyun-sonu h2')).includes('Rakibin kazandı'), 'kaybeden tarafta sonuç yanlış');
  // Rövanş: yeni oyunda Sarı başlar
  await page.click('.oyun-sonu [data-a="tekrar"]');
  await p2.waitForFunction(() => document.querySelectorAll('.db-hucre.k, .db-hucre.s').length === 0 && /Sıra sende/.test(document.getElementById('durum').textContent), null, { timeout: 3000 });
  await p2.close();
};

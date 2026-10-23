// Sunucu arayüzü testi: gerçek Supabase yerine sahte bir istemciyle liderlik tablosu, skor gönderme,
// hesap formu ve günlük liderler bölümü denenir. smoke-test.js tüm oyunlar test edilirken çalıştırır.
module.exports.sahte = function () {
  if (location.hash === '#sunucusuz') return;
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
    channel: function () { return {}; },
    removeChannel: function () { return ok(null); }
  };
};

module.exports.test = async function (page, { git, beklenen }) {
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
};

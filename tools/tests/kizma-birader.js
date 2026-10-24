// Kızma Birader oynanış testi: turnuva haritası, zar atma (klavye ve dokunma), piyon seçimi, kırma ve eve giriş,
// duraklatma, maçı kazanıp yıldızın/en iyi skorun kaydı, sonraki maçın açılması, günlük görev ödülü, "Tekrar oyna",
// tema seçiminin kalıcılığı, bozuk kayıt ve günlük modda iki açılışta aynı zar dizisi.
// Math.random tohumlanır (maçlar tekrarlanabilir) ve saat sahtedir (page.clock); animasyonlar beklemeden ileri sarılır.
module.exports = async function (page, { git, beklenen }) {
  await page.addInitScript(() => {
    let h = 20261024;
    Math.random = function () {
      h = h + 0x6D2B79F5 | 0;
      let t = Math.imul(h ^ h >>> 15, 1 | h);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  });
  await page.clock.install({ time: new Date('2026-10-24T10:00:00') });
  const ileri = ms => page.clock.runFor(ms);
  const veri = ad => page.getAttribute('#tahta', 'data-' + ad);
  const kayit = () => page.evaluate(() => JSON.parse(localStorage.getItem('mo_kizma')));
  const durum = async () => (await veri('durum')).split('|').map(s => s.split(':')[1].split(',').map(Number));

  // İnsan oyuncu (kırmızı, 0. oyuncu) için basit strateji: kır > eve gir > çık > en öndeki piyon.
  // Zarı bazen düğmeyle, bazen klavyeyle atar; piyonu bazen dokunarak, bazen klavyeyle seçer.
  let sayac = 0, kirmaGoruldu = false, eveGirdi = false;
  const macOyna = async () => {
    for (let i = 0; i < 4000; i++) {
      if (await page.isVisible('.oyun-sonu[open]')) return (await page.textContent('.oyun-sonu h2')).includes('Kazandın');
      const faz = await veri('faz'), sira = await veri('sira');
      if (Number(await veri('kirma')) > 0) kirmaGoruldu = true;
      if ((await durum())[0].some(p => p >= 40)) eveGirdi = true;
      if (sira === '0' && faz === 'zar') {
        if (sayac++ % 2) await page.click('#zar-at'); else await page.keyboard.press('Space');
      } else if (sira === '0' && faz === 'sec') {
        const ps = await page.$$eval('.kb-piyon.oynar', l => l.map(b => ({ i: Number(b.dataset.i), p: Number(b.dataset.p), q: Number(b.dataset.hedef), kir: b.dataset.kir === '1' })));
        ps.sort((a, b) => (b.kir - a.kir) || ((b.q >= 40) - (a.q >= 40)) || ((a.p < 0) ? -1 : (b.p < 0) ? 1 : b.p - a.p));
        const sec = ps[0];
        if (sayac++ % 2) await page.click(`.kb-piyon.oynar[data-o="0"][data-i="${sec.i}"]`);
        else await page.keyboard.press(String(sec.i + 1));
      }
      await ileri(150);
    }
    throw new Error('Maç bitmedi');
  };

  await git('games/kizma-birader/');
  beklenen(await page.isVisible('#menu'), 'Açılışta menü görünmeli');
  beklenen(await page.locator('.kb-mac:not(.kilitli)').count() === 1, 'Başta yalnızca ilk maç açık olmalı');
  beklenen(await page.locator('#gorevler li').count() === 3, '3 günlük görev olmalı');
  beklenen(await page.locator('[data-varyant]:disabled').count() === 3, 'Kural varyantları başta kilitli olmalı');
  beklenen(await page.locator('[data-tema]:disabled').count() === 5, 'Klasik dışındaki temalar kilitli olmalı');

  // Günlük görev: 'kazan2' bir adım kala; maçı kazanınca bonus yıldız
  await page.evaluate(() => localStorage.setItem('mo_kizma', JSON.stringify({ gorev: { tarih: '2026-10-24', liste: ['kazan2', 'eve', 'usta'], ilerleme: { kazan2: 1, eve: 0, usta: 0 }, tamam: [] } })));
  await git('games/kizma-birader/');

  // Maç 1: tahta, zar ve ilk sıra
  await page.click('.kb-mac >> nth=0');
  beklenen(await page.isVisible('#tahta'), 'Maç açılmalı');
  beklenen(await page.locator('.kb-h').count() === 121, 'Tahta 11x11 olmalı');
  beklenen(await page.locator('.kb-piyon').count() === 8, '2 oyunculu maçta 8 piyon olmalı');
  beklenen(await veri('faz') === 'zar' && await veri('sira') === '0', 'İlk sıra oyuncuda olmalı');
  beklenen((await durum()).every(ps => ps.every(p => p === -1)), 'Tüm piyonlar başlangıçta olmalı');

  // Duraklatma: bilgisayarın sırasında zaman durur, girişler yok sayılır
  await page.keyboard.press('Space');
  for (let i = 0; i < 100 && await veri('sira') === '0'; i++) {
    if (await veri('faz') === 'zar') await page.keyboard.press('Space');
    if (await veri('faz') === 'sec') await page.keyboard.press('Enter');
    await ileri(150);
  }
  beklenen(await veri('sira') === '1', 'Sıra bilgisayara geçmeli');
  await page.keyboard.press('p');
  const adim0 = await veri('adim') + await veri('zar') + await veri('faz');
  await ileri(5000);
  beklenen(await veri('adim') + await veri('zar') + await veri('faz') === adim0, 'Duraklatınca bilgisayar oynamamalı');
  await page.keyboard.press('p');

  // Maçı (gerekirse birkaç kez) oyna; en az bir kırma ve eve giriş görülmeli
  let kazandi = await macOyna(), deneme = 1, galibiyet = kazandi ? 1 : 0;
  while ((!kazandi || !kirmaGoruldu || !eveGirdi) && deneme < 8) {
    await page.click('.oyun-sonu [data-a="tekrar"]');
    deneme++;
    kazandi = await macOyna();
    if (kazandi) galibiyet++;
  }
  beklenen(kazandi, '8 denemede maç kazanılmalıydı');
  beklenen(kirmaGoruldu, 'Maçlarda en az bir piyon kırılmalı');
  beklenen(eveGirdi, 'Oyuncunun piyonu eve girmeli');
  let k = await kayit();
  beklenen(k.yildiz['1'] >= 1 && k.yildiz['1'] <= 3, 'Yıldız mo_kizma içine yazılmalı, gelen: ' + JSON.stringify(k.yildiz));
  beklenen(k.ist.galibiyet === galibiyet && k.ist.mac === deneme, 'İstatistik kaydedilmeli: ' + JSON.stringify(k.ist));
  const best = await page.evaluate(() => MiniOyun.getBest('kizma-birader'));
  beklenen(best >= 100, 'En iyi skor kaydedilmeli, gelen: ' + best);
  beklenen(k.gorev.tamam.includes('kazan2') && k.bonus === 1 + (k.gorev.tamam.length - 1), 'Görev tamamlanınca bonus yıldız verilmeli: ' + JSON.stringify(k.gorev) + ' bonus ' + k.bonus);
  if (galibiyet === 1) beklenen((await page.textContent('.oyun-sonu-metin')).includes('Görev tamam'), 'Görev ödülü maç sonunda yazmalı');

  // Tekrar oyna: tahta sıfırlanır
  await page.click('.oyun-sonu [data-a="tekrar"]');
  beklenen((await durum()).every(ps => ps.every(p => p === -1)) && await veri('faz') === 'zar', 'Tekrar oyna tahtayı sıfırlamalı');

  // Menüde 2. maç açık, ilerleme kalıcı
  await git('games/kizma-birader/');
  beklenen(await page.locator('.kb-mac:not(.kilitli)').count() === 2, '2. maç açılmalı ve ilerleme kalıcı olmalı');
  beklenen(await page.locator('#gorevler li.tamam').count() >= 1, 'Tamamlanan görev menüde işaretlenmeli');

  // Tema: 6 yıldızla Gece teması açılır, seçim kalıcı
  await page.evaluate(() => { const k = JSON.parse(localStorage.getItem('mo_kizma')); k.bonus = 6; localStorage.setItem('mo_kizma', JSON.stringify(k)); });
  await git('games/kizma-birader/');
  beklenen(await page.isEnabled('[data-tema="gece"]'), '6 yıldızla Gece teması açılmalı');
  await page.click('[data-tema="gece"]');
  await git('games/kizma-birader/');
  beklenen((await kayit()).tema === 'gece' && await page.locator('[data-tema="gece"].secili').count() === 1, 'Tema seçimi kalıcı olmalı');
  await page.click('.kb-mac >> nth=0');
  beklenen((await page.getAttribute('#tahta', 'class')).includes('tema-gece'), 'Seçilen tema tahtaya uygulanmalı');

  // 4 kişilik serbest oyun: 16 piyon
  await git('games/kizma-birader/');
  await page.check('input[name="kisi"][value="4"]');
  await page.click('#serbest-basla');
  beklenen(await page.locator('.kb-piyon').count() === 16 && await page.locator('.kb-oyuncu').count() === 4, '4 kişilik maçta 16 piyon ve 4 oyuncu olmalı');

  // Günlük mod: iki açılışta aynı zar dizisi
  const gunluk = async () => {
    await git('games/kizma-birader/?gunluk=2026-10-24');
    beklenen(await page.isVisible('#gunluk-basla') && !(await page.isVisible('#kampanya-alan')), 'Günlük modda yalnızca günlük maç olmalı');
    await page.click('#gunluk-basla');
    for (let i = 0; i < 600 && (await veri('gecmis')).length < 16; i++) {
      if (await veri('sira') === '0' && await veri('faz') === 'zar') await page.keyboard.press('Space');
      if (await veri('sira') === '0' && await veri('faz') === 'sec') await page.keyboard.press('Enter');
      await ileri(150);
    }
    return (await veri('gecmis')).slice(0, 16);
  };
  const a = await gunluk();
  const b = await gunluk();
  beklenen(a.length === 16 && a === b, 'Günlük modda iki açılışta zar dizisi aynı olmalı: ' + a + ' / ' + b);

  // Bozuk kayıt hata vermemeli
  await page.evaluate(() => localStorage.setItem('mo_kizma', '{bozuk'));
  await git('games/kizma-birader/');
  beklenen(await page.locator('.kb-mac:not(.kilitli)').count() === 1, 'Bozuk kayıtta sıfırdan başlamalı');
};

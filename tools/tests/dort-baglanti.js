// Dört Bağlantı oynanış testi: iki kişilik modda dikey dörtlü, bilgisayara karşı oyun sonu, rekor ve yeniden başlatma.
module.exports = async function (page, { git, beklenen }) {
  const count = sel => page.$$eval(sel, c => c.length);
  const col = c => page.click(`.db-hucre[data-c="${c}"] >> nth=0`);

  await git('games/dort-baglanti/');
  beklenen(await count('.db-hucre') === 42, '7x6 = 42 hücre olmalı');

  // İki kişi: Kırmızı 0. sütunda, Sarı 1. sütunda; Kırmızı dikey dörtlüyle kazanır
  await page.selectOption('#mod', 'iki');
  for (const c of [0, 1, 0, 1, 0, 1, 0]) await col(c);
  await page.waitForSelector('.oyun-sonu[open]', { timeout: 3000 });
  beklenen((await page.textContent('.oyun-sonu h2')).includes('Kırmızı kazandı'), 'Kırmızının kazanması bekleniyordu');
  beklenen(await count('.db-hucre.dort') === 4, 'Kazanan dörtlü işaretlenmeli');
  await page.click('.oyun-sonu [data-a="tekrar"]');
  beklenen(await count('.db-hucre.k, .db-hucre.s') === 0, '"Tekrar oyna" tahtayı temizlemeli');

  // Klavye: 4 tuşu 4. sütuna taş bırakır
  await page.keyboard.press('4');
  beklenen(await page.$$eval('.db-hucre.k', c => c.map(x => x.dataset.c)).then(a => a[0] === '3'), 'Rakam tuşuyla taş bırakılmalı');

  // Bilgisayara karşı (zor): bilgisayar her hamleye karşılık verir ve saf oyunu yener
  await page.selectOption('#mod', 'pc');
  await page.selectOption('#level', 'zor');
  for (let i = 0; i < 21; i++) {
    if (await page.isVisible('.oyun-sonu[open]')) break;
    await page.waitForFunction(() => /Sıra sende/.test(document.getElementById('durum').textContent), null, { timeout: 5000 }).catch(() => {});
    if (await page.isVisible('.oyun-sonu[open]')) break;
    const free = await page.evaluate(() => { for (let c = 0; c < 7; c++) if (!document.querySelector(`.db-hucre[data-c="${c}"]`).matches('.k, .s')) return c; return -1; });
    const before = await count('.db-hucre.s');
    await col(free);
    await page.waitForFunction(n => document.querySelectorAll('.db-hucre.s').length > n || document.querySelector('.oyun-sonu[open]'), before, { timeout: 5000 });
  }
  await page.waitForSelector('.oyun-sonu[open]', { timeout: 5000 });
  beklenen((await page.textContent('.oyun-sonu h2')).includes('Bilgisayar kazandı'), 'Zor bilgisayar soldan dolduran oyuncuyu yenmeli');
  await page.click('.oyun-sonu [data-a="kapat"]');

  // Kolay bilgisayarı yenmek: rekor kaydı (kazanana kadar dikey dörtlü dener)
  await page.selectOption('#level', 'kolay');
  let won = false;
  for (let g = 0; g < 8 && !won; g++) {
    await page.click('#restart');
    for (let i = 0; i < 21; i++) {
      if (await page.isVisible('.oyun-sonu[open]')) break;
      await page.waitForFunction(() => /Sıra sende/.test(document.getElementById('durum').textContent) || document.querySelector('.oyun-sonu[open]'), null, { timeout: 5000 });
      if (await page.isVisible('.oyun-sonu[open]')) break;
      const pick = await page.evaluate(() => { for (const c of [3, 2, 4, 1, 5, 0, 6]) if (!document.querySelector(`.db-hucre[data-c="${c}"]`).matches('.k, .s')) return c; return -1; });
      await col(pick);
      await page.waitForTimeout(50);
    }
    await page.waitForSelector('.oyun-sonu[open]', { timeout: 5000 });
    won = (await page.textContent('.oyun-sonu h2')).includes('Kazandın');
    await page.click('.oyun-sonu [data-a="kapat"]');
  }
  if (won) {
    const best = await page.evaluate(() => localStorage.getItem('dort-baglanti-en-iyi-kolay'));
    beklenen(best && +best >= 4, 'Galibiyette en az hamle rekoru kaydedilmeli');
  }
};

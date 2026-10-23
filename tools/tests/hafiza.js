// Hafıza Kartları oynanış testi: eşleşmeyen kartların kapanması, oyunu bitirme, rekor, günlük mod.
module.exports = async function (page, { git, beklenen }) {
  const icons = () => page.$$eval('.card', cs => cs.map(c => c.dataset.icon));

  await git('games/hafiza/');
  const list = await icons();
  beklenen(list.length === 16, '16 kart olmalı');

  // Eşleşmeyen iki kart kapanmalı
  const a = 0, b = list.findIndex(x => x !== list[0]);
  await page.click(`.card >> nth=${a}`);
  await page.click(`.card >> nth=${b}`);
  await page.waitForTimeout(1000);
  beklenen(await page.$$eval('.card.open', cs => cs.length) === 0, 'Eşleşmeyen kartlar kapanmalı');

  // Tüm eşleri bul
  const done = {};
  for (let i = 0; i < list.length; i++) {
    if (done[i]) continue;
    const j = list.findIndex((x, k) => k > i && x === list[i]);
    done[i] = done[j] = true;
    await page.click(`.card >> nth=${i}`);
    await page.click(`.card >> nth=${j}`);
  }
  await page.waitForSelector('.oyun-sonu[open]', { timeout: 3000 });
  beklenen(await page.textContent('#moves') === '9', 'Hamle sayısı 9 olmalı (1 hatalı + 8 doğru)');
  beklenen(await page.evaluate(() => localStorage.getItem('mo_best_hafiza')) === '9', 'En az hamle kaydedilmeli');

  await page.click('.oyun-sonu [data-a="tekrar"]');
  beklenen(await page.$$eval('.card.done', cs => cs.length) === 0 && await page.textContent('#moves') === '0', '"Tekrar oyna" oyunu sıfırlamalı');

  await git('games/hafiza/?gunluk=2026-10-24');
  const g1 = (await icons()).join('');
  await git('games/hafiza/?gunluk=2026-10-24');
  beklenen(g1 === (await icons()).join(''), 'Günlük modda kart dizilişi aynı olmalı');
};

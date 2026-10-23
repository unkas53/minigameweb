// 2048 oynanış testi: kaydırma, birleşme, skor, yeniden başlatma, oyun sonu ve günlük mod.
module.exports = async function (page, { git, beklenen }) {
  const tiles = () => page.$$eval('#board .cell', cs => cs.filter(c => c.textContent).length);
  const board = () => page.$$eval('#board .cell', cs => cs.map(c => c.textContent).join(','));

  await git('games/2048/');
  beklenen(await tiles() === 2, 'Oyun 2 kareyle başlamalı');

  const once = await board();
  for (const k of ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown']) await page.keyboard.press(k);
  beklenen(await board() !== once, 'Ok tuşları tahtayı değiştirmeli');

  // Oyun bitene kadar oyna
  for (let i = 0; i < 2000 && !(await page.$('.oyun-sonu[open]')); i++) {
    await page.keyboard.press(['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp'][i % 4]);
  }
  await page.waitForSelector('.oyun-sonu[open]', { timeout: 3000 });
  const score = Number(await page.textContent('#score'));
  beklenen(score > 0, 'Skor artmalı');
  beklenen(Number(await page.evaluate(() => localStorage.getItem('mo_best_2048'))) === score, 'En iyi skor kaydedilmeli');

  await page.click('.oyun-sonu [data-a="tekrar"]');
  beklenen(await page.textContent('#score') === '0' && await tiles() === 2, '"Tekrar oyna" oyunu sıfırlamalı');

  // Günlük modda başlangıç tahtası her açılışta aynı olmalı
  await git('games/2048/?gunluk=2026-10-24');
  const g1 = await board();
  await git('games/2048/?gunluk=2026-10-24');
  beklenen(g1 === await board(), 'Günlük modda başlangıç tahtası aynı olmalı');
};

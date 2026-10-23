// Mayın Tarlası oynanış testi: ilk tıklama güvenli, bayrak, süre, duraklatma ve oyun sonu.
module.exports = async function (page, { git, beklenen }) {
  const cells = '#board > div';
  const opened = () => page.$$eval(cells, cs => cs.filter(c => c.classList.contains('open')).length);

  await git('games/mayin-tarlasi/');
  beklenen(await page.$$eval(cells, cs => cs.length) === 81, 'Kolay seviye 9x9 olmalı');

  // Bayrak: sağ tık sayacı azaltır, tekrar sağ tık geri alır
  await page.click(`${cells} >> nth=0`, { button: 'right' });
  beklenen(await page.textContent('#mines') === '9', 'Bayrak mayın sayacını azaltmalı');
  await page.click(`${cells} >> nth=0`, { button: 'right' });

  // İlk tıklama asla mayın değildir
  await page.click(`${cells} >> nth=40`);
  beklenen(await opened() > 0 && !(await page.$('.oyun-sonu[open]')), 'İlk tıklama güvenli olmalı');

  // Süre işler, duraklatınca durur
  await page.waitForTimeout(1200);
  await page.click('.oyun-btn[aria-label="Duraklat"]');
  const t = await page.textContent('#time');
  beklenen(Number(t) >= 1, 'Süre ilerlemeli');
  await page.waitForTimeout(1500);
  beklenen(await page.textContent('#time') === t, 'Duraklatılınca süre durmalı');
  await page.click('.oyun-duraklat .btn');

  // Kalan kareleri sırayla aç: oyun ya kazanılır ya kaybedilir
  // Oyun bitince "Tekrar oyna" düğmesi (#again) görünür; pencere 0,6 sn sonra açılır
  for (let i = 0; i < 81 && !(await page.isVisible('#again')); i++) {
    const closed = await page.$$eval(cells, cs => cs.findIndex(c => !c.classList.contains('open')));
    if (closed < 0) break;
    await page.click(`${cells} >> nth=${closed}`);
  }
  await page.waitForSelector('.oyun-sonu[open]', { timeout: 3000 });
  await page.click('.oyun-sonu [data-a="tekrar"]');
  beklenen(await opened() === 0 && await page.textContent('#time') === '0', '"Tekrar oyna" yeni tahta açmalı');
};

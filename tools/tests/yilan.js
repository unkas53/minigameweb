// Yılan oynanış testi: başlatma, duraklatma, duvara çarpınca oyun sonu, yeniden başlatma.
module.exports = async function (page, { git, beklenen }) {
  await git('games/yilan/');
  await page.click('#restart');
  await page.waitForTimeout(300);

  // Duraklatınca yılan ilerlememeli
  await page.click('.oyun-btn[aria-label="Duraklat"]');
  beklenen(await page.isVisible('.oyun-duraklat'), 'Duraklat katmanı görünmeli');
  await page.waitForTimeout(2500);
  beklenen(!(await page.$('.oyun-sonu[open]')), 'Duraklatılmışken oyun bitmemeli');
  await page.click('.oyun-duraklat .btn');

  // Sağa giden yılan duvara çarpar
  await page.waitForSelector('.oyun-sonu[open]', { timeout: 5000 });
  beklenen((await page.textContent('#msg')).includes('Oyun bitti'), 'Oyun sonu mesajı görünmeli');

  await page.click('.oyun-sonu [data-a="tekrar"]');
  beklenen(await page.textContent('#score') === '0' && await page.textContent('#msg') === '', '"Tekrar oyna" oyunu yeniden başlatmalı');
};

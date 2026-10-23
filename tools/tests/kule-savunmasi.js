// Kule Savunması oynanış testi: harita, kule kurma (fare ve klavye), yükseltme/satma, kaybetme,
// 1. bölümü kazanıp yıldız, rekor ve yeni bölüm/kule açılması, yetenek alma ve "Tekrar oyna".
// Saat sahte (page.clock), böylece dalgalar beklemeden ileri sarılır.
module.exports = async function (page, { git, beklenen }) {
  await page.clock.install();
  await git('games/kule-savunmasi/');
  const ileri = ms => page.clock.runFor(ms);
  const sayi = sel => page.textContent(sel).then(Number);
  const kare = async (c, r) => {
    const b = await page.locator('#alan').boundingBox();
    await page.mouse.click(b.x + (c + 0.5) * b.width / 12, b.y + (r + 0.5) * b.height / 8);
  };

  beklenen(await page.isVisible('#harita'), 'Açılışta bölüm haritası görünmeli');
  beklenen(await page.locator('.ks-bolum:not(.kilitli)').count() === 1, 'Başta yalnızca 1. bölüm açık olmalı');
  beklenen(await page.locator('.ks-kule:disabled').count() === 3, 'Başta yalnızca Okçu açık olmalı');

  // Kaybetme: kule kurmadan dalgaları çağır
  await page.click('.ks-bolum >> nth=0');
  beklenen(!(await page.isVisible('#harita')) && await sayi('#altin') === 120, 'Bölüm 120 altınla başlamalı');
  await kare(4, 4); // yol değil: 1. bölüm yolu 2. satır ve 5. sütun
  beklenen(await sayi('#altin') === 70, 'Okçu 50 altın tutmalı');
  await kare(4, 4);
  beklenen(await page.isVisible('#secim [data-a="sat"]'), 'Kuleye dokununca yükselt/sat görünmeli');
  await page.click('#secim [data-a="sat"]');
  beklenen(await sayi('#altin') === 105, 'Satış %70 geri vermeli');
  await kare(5, 2);
  beklenen(await sayi('#altin') === 105, 'Yola kule kurulamamalı');
  for (let i = 0; i < 40 && !(await page.$('.oyun-sonu[open]')); i++) {
    if (await page.isEnabled('#dalga-btn')) await page.click('#dalga-btn');
    await ileri(5000);
  }
  beklenen((await page.textContent('.oyun-sonu h2')).includes('Kale düştü'), 'Savunmasız kale düşmeli');
  await page.click('.oyun-sonu [data-a="kapat"]');

  // Kazanma: köşelere okçu kur, altın biriktikçe ekle ve yükselt
  await page.click('.oyun-btn[aria-label="Yeniden başlat"]');
  beklenen(await sayi('#can') === 20 && await sayi('#altin') === 120, 'Yeniden başlat bölümü sıfırlamalı');
  const yerler = [[4, 3], [6, 4], [6, 1], [4, 1], [4, 4], [6, 6], [7, 4], [3, 3]];
  // Klavye ile ilk kule: odak tuvalde, imleç (0,0)'dan (4,3)'e
  await page.focus('#alan');
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  beklenen(await sayi('#altin') === 70, 'Enter ile kule kurulmalı');
  let kurulan = 1;
  for (let i = 0; i < 80 && !(await page.$('.oyun-sonu[open]')); i++) {
    while (kurulan < yerler.length && await sayi('#altin') >= 50) { await kare(...yerler[kurulan]); kurulan++; }
    if (kurulan >= yerler.length && await sayi('#altin') >= 60) {
      await kare(...yerler[0]);
      if (await page.isEnabled('#secim [data-a="yukselt"]')) await page.click('#secim [data-a="yukselt"]');
      else await kare(...yerler[0]);
    }
    if (await page.isEnabled('#dalga-btn')) await page.keyboard.press('Space');
    await ileri(3000);
  }
  await ileri(1000);
  const baslik = await page.textContent('.oyun-sonu h2');
  beklenen(baslik.includes('Bölüm 1 geçildi'), 'Bölüm 1 kazanılmalı, gelen: ' + baslik);
  const kayit = await page.evaluate(() => JSON.parse(localStorage.getItem('mo_kule')));
  beklenen(kayit.yildiz[1] >= 1, 'Yıldız kaydedilmeli');
  beklenen(Number(await page.evaluate(() => localStorage.getItem('mo_best_kule-savunmasi-1'))) > 0, 'Bölüm rekoru kaydedilmeli');
  await page.click('.oyun-sonu [data-a="kapat"]');
  await ileri(1000);
  beklenen(await page.isVisible('#harita'), 'Bölüm bitince harita açılmalı');
  beklenen(await page.locator('.ks-bolum:not(.kilitli)').count() === 2, '2. bölüm açılmalı');

  // Yetenek: 1 yıldızla Hazine alınır, 2. bölüm +40 altınla başlar
  await page.click('.ks-yetenek >> nth=0');
  beklenen((await page.evaluate(() => JSON.parse(localStorage.getItem('mo_kule')).yetenek.altin)) === 1, 'Yetenek alınmalı');
  await page.click('.ks-bolum >> nth=1');
  beklenen(await sayi('#altin') === 170, '2. bölüm 130 + 40 altınla başlamalı');
  beklenen(await page.locator('.ks-kule:disabled').count() === 2, 'Buz kulesi açılmış olmalı');

  // Sayfa yenilenince ilerleme kalmalı
  await git('games/kule-savunmasi/');
  beklenen(await page.locator('.ks-bolum:not(.kilitli)').count() === 2, 'İlerleme kalıcı olmalı');
};

// Olta Ustası oynanış testi: bozuk kayıt, sekmeler (denizler, yükseltmeler, görevler), klavyeyle kanca, duraklatma,
// bir turu bir "bot" ile oynayıp (çıkışta en yakın balığa gerçek fare hareketi, yüzeyde Boşluk) altın/akvaryum/rekor
// kaydı, "Tekrar oyna", yükseltme satın alma ve etkisi, kapalıyken tekne geliri (8 saat sınırı, geri alınan saat)
// ve günlük modda aynı dizilim. Saat sahte (page.clock), böylece oyun beklemeden ileri sarılır.
module.exports = async function (page, { git, beklenen }) {
  await page.clock.install({ time: new Date('2026-10-24T10:00:00') });
  const ileri = ms => page.clock.runFor(ms);
  const veri = ad => page.getAttribute('#alan', 'data-' + ad);
  const sayi = async ad => Number(await veri(ad));
  const kayit = () => page.evaluate(() => JSON.parse(localStorage.getItem('mo_olta')));
  const yaz = s => page.evaluate(v => localStorage.setItem('mo_olta', JSON.stringify(v)), s);

  // Bozuk kayıt oyunu sıfırdan başlatmalı
  await git('games/olta-ustasi/');
  await page.evaluate(() => localStorage.setItem('mo_olta', '{bozuk'));
  await git('games/olta-ustasi/');
  beklenen(await veri('durum') === 'menu', 'Açılışta menü görünmeli');
  await page.click('[data-sekme="deniz"]');
  beklenen(await page.locator('[data-deniz]').count() === 5, '5 deniz olmalı');
  beklenen(await page.locator('[data-deniz]:not([disabled])').count() === 1, 'Başta yalnızca Koy açık olmalı');
  await page.click('[data-sekme="yukselt"]');
  beklenen(await page.locator('[data-yuk]').count() === 7, '7 yükseltme olmalı');
  beklenen(await page.locator('[data-yuk]:not([disabled])').count() === 0, 'Altın yokken yükseltmeler pasif olmalı');
  await page.click('[data-sekme="gorev"]');
  beklenen(await page.locator('.ou-gorev').count() === 3, '3 günlük görev olmalı');
  await page.click('[data-sekme="balik"]');

  // Klavye: kanca yönü ve duraklatma
  await page.click('[data-at]');
  beklenen(await veri('durum') === 'inis', 'Oltayı At inişi başlatmalı');
  beklenen(await sayi('sinir') === 30, 'Başlangıç misinası 30 m olmalı');
  await page.mouse.move(2, 2);
  const x0 = await sayi('kancax');
  await page.keyboard.down('ArrowLeft');
  await ileri(250);
  await page.keyboard.up('ArrowLeft');
  beklenen(await sayi('kancax') < x0 - 30, 'Sol ok kancayı sola götürmeli');
  await page.click('.oyun-btn[aria-label="Duraklat"]');
  const d1 = await veri('derinlik'), s1 = await veri('durum');
  await ileri(1000);
  beklenen(await veri('derinlik') === d1 && await veri('durum') === s1, 'Duraklatınca kanca durmalı');
  await page.click('.oyun-duraklat .btn');

  // Bot: çıkışta en yakın balığın altına fareyi götürür, yüzeyde Boşluk ile balık yakalar
  const b = await page.locator('#alan').boundingBox();
  let durumlar = new Set();
  for (let i = 0; i < 400 && !(await page.$('.oyun-sonu[open]')); i++) {
    const d = await veri('durum');
    durumlar.add(d);
    if (d === 'cikis') {
      const yx = await veri('yakinx');
      if (yx) await page.mouse.move(b.x + Number(yx) * b.width / 360, b.y + b.height * 0.6);
    } else if (d === 'yuzey') await page.keyboard.press('Space');
    await ileri(50);
  }
  beklenen(durumlar.has('cikis') && durumlar.has('yuzey'), 'Tur çıkış ve yüzey evrelerinden geçmeli: ' + [...durumlar].join(','));
  const baslik = await page.textContent('.oyun-sonu h2');
  beklenen(/Tur bitti: \d+ altın/.test(baslik), 'Tur sonu penceresi altını göstermeli, gelen: ' + baslik);
  let k = await kayit();
  beklenen(k.altin > 0, 'Turda altın kazanılmalı');
  beklenen(Object.keys(k.akvaryum).length > 0, 'Yakalanan türler akvaryuma eklenmeli');
  beklenen(k.enDerin > 0 && k.denizDerin.koy > 0, 'En derin nokta kaydedilmeli');
  beklenen(Number(await page.evaluate(() => localStorage.getItem('mo_best_olta-ustasi'))) === k.altin, 'Tur rekoru kaydedilmeli');

  // Tekrar oyna yeni tur başlatır
  await page.click('.oyun-sonu [data-a="tekrar"]');
  await ileri(50);
  beklenen(await veri('durum') === 'inis' && await sayi('takili') === 0 && await sayi('derinlik') < 15, 'Tekrar oyna yeni turu sıfırdan başlatmalı');

  // Yükseltme satın alma ve etkisi (kalıcı)
  k = await kayit();
  k.altin = 100;
  await yaz(k);
  await git('games/olta-ustasi/');
  await page.click('[data-sekme="yukselt"]');
  await page.click('[data-yuk="misina"]');
  k = await kayit();
  beklenen(k.yukseltme.misina === 1 && k.altin === 85, 'Misina 15 altına alınmalı, altın: ' + k.altin);
  await git('games/olta-ustasi/');
  await page.click('[data-sekme="balik"]');
  await page.click('[data-at]');
  beklenen(await sayi('sinir') === 47, 'Misina yükseltmesi derinlik sınırını artırmalı, gelen: ' + await veri('sinir'));

  // Tekne geliri: 10 saat yoktuk ama en fazla 8 saat sayılır (1. seviye, Koy: 2 altın/dk)
  k = await kayit();
  k.yukseltme.tekne = 1; k.altin = 0; k.sonGiris = Date.parse('2026-10-24T00:00:00');
  await yaz(k);
  await git('games/olta-ustasi/');
  k = await kayit();
  beklenen(k.altin === 960, 'Tekne 8 saatlik geliri (960) vermeli, gelen: ' + k.altin);
  beklenen((await page.textContent('#bildirim')).includes('Sen yokken'), 'Geri dönüş penceresi gösterilmeli');
  // Saat geri alınmışsa gelir yok
  k.sonGiris = (await page.evaluate(() => Date.now())) + 3600000; k.altin = 0;
  await yaz(k);
  await git('games/olta-ustasi/');
  k = await kayit();
  beklenen(k.altin === 0, 'Saat geri alınınca tekne geliri verilmemeli, gelen: ' + k.altin);

  // Günlük mod: iki açılışta aynı dizilim, yükseltmeler etkisiz
  await git('games/olta-ustasi/?gunluk=2026-10-24');
  await page.click('[data-at]');
  const diz = await veri('dizilim');
  beklenen(await sayi('sinir') === 250, 'Günlük modda sabit ekipman kullanılmalı');
  await git('games/olta-ustasi/?gunluk=2026-10-24');
  await page.click('[data-at]');
  beklenen(diz && (await veri('dizilim')) === diz, 'Günlük modda iki açılışta aynı dizilim gelmeli');
};

// Lokanta Telaşı oynanış testi: bozuk kayıt, gün haritası ve kilitler, ızgaranın çiğ/pişmiş/yanık aşamaları,
// yanlış tabağın reddedilmesi, duraklatma, servis etmeden bekleyince kalplerin bitip günün kaybedilmesi (skorsuz),
// 1. günü bir "bot" ile (siparişi okuyup malzemeleri basan, eti pişince alan) bitirip yıldız/para kaydı,
// "Tekrar oyna", kalıcı ilerleme (mo_lokanta), parayla yükseltme, tabela adı ve günlük modda aynı müşteri sırası.
// Saat sahte (page.clock), böylece gün beklemeden ileri sarılır.
module.exports = async function (page, { git, beklenen }) {
  await page.clock.install({ time: new Date('2026-10-24T10:00:00') });
  const ileri = ms => page.clock.runFor(ms);
  const veri = ad => page.getAttribute('#lt-oyun', 'data-' + ad);
  const kayit = () => page.evaluate(() => JSON.parse(localStorage.getItem('mo_lokanta')));
  const sonuBekle = async () => { for (let i = 0; i < 400 && !(await page.$('.oyun-sonu[open]')); i++) await ileri(1000); };

  // Bozuk kayıt oyunu sıfırdan başlatmalı
  await git('games/lokanta-telasi/');
  await page.evaluate(() => localStorage.setItem('mo_lokanta', '{bozuk'));
  await git('games/lokanta-telasi/');
  beklenen(await page.isVisible('#harita'), 'Açılışta gün haritası görünmeli');
  beklenen(await page.locator('.lt-gun').count() === 40, '40 gün olmalı');
  beklenen(await page.locator('.lt-gun:not(.kilitli)').count() === 1, 'Başta yalnızca 1. gün açık olmalı');
  beklenen(await page.locator('.lt-yuk').count() === 7, '7 yükseltme olmalı');
  beklenen(await page.locator('.lt-gorev').count() === 3, '3 günlük görev olmalı');

  // Izgara aşamaları ve yanlış tabak
  await page.click('.lt-gun >> nth=0');
  beklenen(await page.locator('.lt-mus').count() === 3 && await page.locator('.lt-izg').count() === 2, 'Temel lokantada 3 müşteri ve 2 ızgara yeri olmalı');
  beklenen(await page.locator('.lt-malz').count() === 5, '1. günde 5 malzeme olmalı (dürüm ve ayran)');
  await page.keyboard.press('2'); // et
  beklenen(await page.getAttribute('[data-izgara="0"]', 'data-hal') === 'cig', 'Et ızgarada çiğ başlamalı');
  await page.click('[data-izgara="0"]');
  beklenen(await page.getAttribute('[data-izgara="0"]', 'data-hal') === 'cig', 'Çiğ et tabağa alınamamalı');
  await ileri(3500);
  beklenen(await page.getAttribute('[data-izgara="0"]', 'data-hal') === 'pismis', 'Et 3,2 sn sonra pişmeli');
  await ileri(4500);
  beklenen(await page.getAttribute('[data-izgara="0"]', 'data-hal') === 'yanik', 'Bekletilen et yanmalı');
  await page.click('[data-izgara="0"]');
  beklenen(await page.getAttribute('[data-izgara="0"]', 'data-hal') === 'bos', 'Yanık et çöpe atılmalı');
  beklenen(await page.getAttribute('[data-tabak="0"]', 'data-icerik') === '', 'Yanık et tabağa geçmemeli');
  await page.click('[data-m="lavas"]');
  const kalan = await page.getAttribute('[data-musteri="0"]', 'data-kalan');
  const s1 = Number(await page.getAttribute('[data-musteri="0"]', 'data-sabir'));
  beklenen(kalan, 'İlk müşteri gelmiş olmalı');
  await page.click('[data-musteri="0"]');
  const s2 = Number(await page.getAttribute('[data-musteri="0"]', 'data-sabir'));
  beklenen(s2 < s1 - 0.1 && (await page.getAttribute('[data-musteri="0"]', 'data-kalan')) === kalan, 'Yanlış tabak reddedilmeli ve sabır düşmeli');
  beklenen(await page.getAttribute('[data-tabak="0"]', 'data-icerik') === 'lavas', 'Reddedilen tabak geri gelmeli');
  await page.keyboard.press('x');
  beklenen(await page.getAttribute('[data-tabak="0"]', 'data-icerik') === '', 'X tabağı boşaltmalı');

  // Duraklatma zamanlayıcıları durdurur
  await page.click('.oyun-btn[aria-label="Duraklat"]');
  const t1 = await veri('t');
  await ileri(2000);
  beklenen(await veri('t') === t1, 'Duraklatınca süre durmalı');
  await page.click('.oyun-duraklat .btn');
  await ileri(300);
  beklenen(await veri('t') !== t1, 'Devam edince süre işlemeli');

  // Servis etmeden beklemek: müşteriler kızgın gider, 3 kalp bitince gün kaybedilir
  await sonuBekle();
  beklenen(await veri('kalp') === '0', 'Kalpler bitmeli');
  beklenen((await page.textContent('.oyun-sonu h2')).includes('Kalpler bitti'), 'Kayıp penceresi açılmalı');
  beklenen(!(await page.evaluate(() => localStorage.getItem('mo_best_lokanta-telasi'))), 'Kaybedilen gün rekor yazmamalı');

  // Tekrar oyna günü sıfırlar
  await page.click('.oyun-sonu [data-a="tekrar"]');
  await ileri(50);
  beklenen(await veri('durum') === 'oyun' && (await veri('kalp')) === '3' && (await veri('kazanc')) === '0', 'Tekrar oyna günü sıfırlamalı');

  // Bot: sabrı en az kalan müşterinin ilk kalemini gerçek tıklamalarla hazırlayıp servis eder
  await page.evaluate(() => {
    const TARIF = { durum: ['lavas', 'et', 'domates', 'sogan'], ayran: ['ayran'] };
    const IZGARA = { et: true };
    const tikla = e => e && e.click();
    setInterval(() => {
      if (window.botDur || document.querySelector('.oyun-sonu[open]')) return;
      const yanik = document.querySelector('[data-izgara][data-hal="yanik"]');
      if (yanik) return tikla(yanik);
      const mus = [...document.querySelectorAll('[data-musteri]')].filter(m => m.dataset.kalan).sort((a, b) => a.dataset.sabir - b.dataset.sabir)[0];
      if (!mus) return;
      const tarif = TARIF[mus.dataset.kalan.split(',')[0]];
      const tabak = document.querySelector('.lt-tabak.aktif'), ic = tabak.dataset.icerik ? tabak.dataset.icerik.split(',') : [];
      const eksik = tarif.slice();
      for (const m of ic) { const i = eksik.indexOf(m); if (i === -1) return tikla(document.querySelector('[data-cop]')); eksik.splice(i, 1); }
      if (!eksik.length) return tikla(mus);
      const m = eksik[0];
      if (!IZGARA[m]) return tikla(document.querySelector('[data-m="' + m + '"]'));
      const pismis = document.querySelector('[data-izgara][data-hal="pismis"][data-urun="' + m + '"]');
      if (pismis) return tikla(pismis);
      if (!document.querySelector('[data-izgara][data-urun="' + m + '"]')) return tikla(document.querySelector('[data-m="' + m + '"]'));
      const diger = eksik.find(x => !IZGARA[x]);
      if (diger) tikla(document.querySelector('[data-m="' + diger + '"]'));
    }, 150);
  });
  await sonuBekle();
  const baslik = await page.textContent('.oyun-sonu h2');
  beklenen(baslik.includes('Gün 1 bitti'), 'Gün 1 bitirilmeli, gelen: ' + baslik + ' / ' + await page.textContent('.oyun-sonu p'));
  let k = await kayit();
  beklenen(k.gunler[1] && k.gunler[1].yildiz >= 1 && k.gunler[1].enIyiKazanc > 0, 'Yıldız ve en iyi kazanç mo_lokanta\'ya kaydedilmeli');
  beklenen(k.para > 50, 'Gün sonunda para kasaya eklenmeli, gelen: ' + k.para);
  const best = Number(await page.evaluate(() => localStorage.getItem('mo_best_lokanta-telasi')));
  beklenen(best === k.gunler[1].enIyiKazanc, 'En iyi kazanç MiniOyun.setBest ile kaydedilmeli, gelen: ' + best);
  beklenen(await page.locator('.lt-gun:not(.kilitli)').count() === 2, '2. gün açılmalı');

  // Tekrar oyna
  await page.evaluate(() => { window.botDur = true; });
  await page.click('.oyun-sonu [data-a="tekrar"]');
  await ileri(50);
  beklenen(await veri('durum') === 'oyun' && (await veri('kazanc')) === '0' && (await veri('t')) === '0.0', 'Tekrar oyna günü baştan başlatmalı');

  // Kalıcı ilerleme, yükseltme ve tabela adı
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('mo_lokanta')); s.para = 1000; localStorage.setItem('mo_lokanta', JSON.stringify(s)); });
  await git('games/lokanta-telasi/');
  beklenen(await page.locator('.lt-gun:not(.kilitli)').count() === 2, 'Açılan günler kalıcı olmalı');
  await page.click('[data-yuk="izgara"]');
  k = await kayit();
  beklenen(k.yukseltme.izgara === 1 && k.para === 880, 'Izgara yükseltmesi 120 paraya alınmalı');
  await page.fill('#lt-tabela', '<b>Mami Büfe</b> uzun ad');
  k = await kayit();
  beklenen(k.tabela.length <= 16, 'Tabela adı 16 karakterle sınırlı olmalı');
  await git('games/lokanta-telasi/');
  beklenen((await page.textContent('.lt-ad')).includes('<b>Mami'), 'Tabela adı metin olarak basılmalı');
  await page.click('.lt-gun >> nth=1');
  beklenen(await page.locator('.lt-izg').count() === 3, 'Izgara yükseltmesi 3. ızgara yerini açmalı');
  beklenen((await page.textContent('.lt-tabela')).includes('<b>Mami'), 'Tabela oyunda görünmeli');

  // Günlük mod: iki açılışta aynı müşteri sırası, yükseltme yok
  await git('games/lokanta-telasi/?gunluk=2026-10-24');
  await page.click('[data-gunluk]');
  const sira = await veri('sira');
  beklenen(await page.locator('.lt-izg').count() === 2, 'Günlük modda yükseltmeler uygulanmamalı');
  beklenen(await page.locator('.lt-malz').count() === 13, 'Günlük modda tüm menü açık olmalı');
  await git('games/lokanta-telasi/?gunluk=2026-10-24');
  await page.click('[data-gunluk]');
  beklenen(sira && (await veri('sira')) === sira, 'Günlük modda iki açılışta aynı müşteri sırası gelmeli');
};

// Tuğla Kırma oynanış testi: bölüm haritası ve kilitler, bozuk kayıt, klavye ile raket ve fırlatma, duraklatma,
// can kaybı, 1. bölümü bir "bot" (gerçek pointermove olayları gönderen) ile bitirip yıldız/elmas/rekor kaydı,
// "Tekrar oyna", kalıcı ilerleme (mo_tugla), elmasla yükseltme, günlük görevler ve günlük modda aynı dizilim.
// Saat sahte (page.clock), böylece oyun beklemeden ileri sarılır.
module.exports = async function (page, { git, beklenen }) {
  await page.clock.install({ time: new Date('2026-10-24T10:00:00') });
  const ileri = ms => page.clock.runFor(ms);
  const veri = ad => page.getAttribute('#alan', 'data-' + ad);
  const sayi = async ad => Number(await veri(ad));
  const kayit = () => page.evaluate(() => JSON.parse(localStorage.getItem('mo_tugla')));

  // Bozuk kayıt oyunu sıfırdan başlatmalı
  await git('games/tugla-kirma/');
  await page.evaluate(() => localStorage.setItem('mo_tugla', '{bozuk'));
  await git('games/tugla-kirma/');
  beklenen(await page.isVisible('#harita'), 'Açılışta bölüm haritası görünmeli');
  beklenen(await page.locator('.tk-bolum').count() === 30, '30 bölüm olmalı');
  beklenen(await page.locator('.tk-bolum:not(.kilitli)').count() === 1, 'Başta yalnızca 1. bölüm açık olmalı');
  beklenen(await page.locator('.tk-gorev').count() === 3, '3 günlük görev olmalı');
  beklenen(await page.isDisabled('[data-sonsuz]'), 'Sonsuz Mod başta kilitli olmalı');

  // Klavye: raket hareketi ve fırlatma
  await page.click('.tk-bolum >> nth=0');
  beklenen(await veri('durum') === 'hazir', 'Bölüm başında top rakette beklemeli');
  beklenen(Number(await page.getAttribute('#can', 'data-can')) === 3, '3 canla başlamalı');
  await page.mouse.move(2, 2); // fare oyun alanının dışında
  await ileri(100);
  const x0 = await sayi('raketx');
  await page.keyboard.down('ArrowLeft');
  await ileri(300);
  await page.keyboard.up('ArrowLeft');
  beklenen(await sayi('raketx') < x0 - 50, 'Sol ok raketi sola götürmeli');
  await page.keyboard.press('Space');
  await ileri(200);
  beklenen(await veri('durum') === 'oyun', 'Boşluk topu fırlatmalı');

  // Duraklatma topu durdurur
  await page.click('.oyun-btn[aria-label="Duraklat"]');
  const y1 = await veri('topy');
  await ileri(1000);
  beklenen(await veri('topy') === y1, 'Duraklatınca top durmalı');
  await page.click('.oyun-duraklat .btn');
  await ileri(100);
  beklenen(await veri('topy') !== y1, 'Devam edince top hareket etmeli');

  // Can kaybı: raketi topun uzağına çek
  for (let i = 0; i < 100 && Number(await page.getAttribute('#can', 'data-can')) === 3; i++) {
    const tx = await sayi('topx');
    const b = await page.locator('#alan').boundingBox();
    await page.mouse.move(b.x + (tx < 240 ? 0.95 : 0.05) * b.width, b.y + b.height * 0.97);
    await ileri(100);
  }
  beklenen(Number(await page.getAttribute('#can', 'data-can')) === 2, 'Top düşünce can gitmeli');

  // Bot: raketi topun altına (değişen bir kaymayla) götüren gerçek pointermove olayları
  await page.evaluate(() => {
    const c = document.getElementById('alan');
    let t = 0;
    setInterval(() => {
      if (window.botDur || !c.dataset.topx || c.hidden) return;
      t++;
      const r = c.getBoundingClientRect();
      const x = Number(c.dataset.topx) + Math.sin(t / 23) * 0.32 * Number(c.dataset.raketw);
      c.dispatchEvent(new PointerEvent('pointermove', { clientX: r.left + x * r.width / 480, clientY: r.top + r.height * 0.98, bubbles: true }));
      if (c.dataset.durum === 'hazir') document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    }, 10);
  });
  for (let i = 0; i < 60 && !(await page.$('.oyun-sonu[open]')); i++) await ileri(5000);
  const baslik = await page.textContent('.oyun-sonu h2');
  beklenen(baslik.includes('Bölüm 1 geçildi'), 'Bölüm 1 kazanılmalı, gelen: ' + baslik + ', kalan tuğla: ' + await veri('kalan'));
  let k = await kayit();
  beklenen(k.bolumler[1] >= 1 && k.bolumler[1] <= 2, 'Bir can kaybıyla 1-2 yıldız kaydedilmeli');
  beklenen(k.elmas >= k.bolumler[1], 'Yıldız kadar elmas verilmeli');
  beklenen(Number(await page.evaluate(() => localStorage.getItem('mo_best_tugla-kirma-1'))) > 0, 'Bölüm rekoru kaydedilmeli');

  // Tekrar oyna bölümü sıfırlar
  await page.evaluate(() => { window.botDur = true; });
  await page.click('.oyun-sonu [data-a="tekrar"]');
  await ileri(50);
  beklenen(await veri('durum') === 'hazir' && (await page.textContent('#puan')) === '0', 'Tekrar oyna bölümü sıfırlamalı');
  beklenen(Number(await page.getAttribute('#can', 'data-can')) === 3, 'Tekrar oynamada canlar dolmalı');

  // Kalıcı ilerleme ve yükseltme
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('mo_tugla')); s.elmas = 10; localStorage.setItem('mo_tugla', JSON.stringify(s)); });
  await git('games/tugla-kirma/');
  beklenen(await page.locator('.tk-bolum:not(.kilitli)').count() === 2, '2. bölüm açılmış ve kalıcı olmalı');
  await page.click('[data-yuk="raket"]');
  k = await kayit();
  beklenen(k.yukseltme.raket === 1 && k.elmas === 8, 'Raket yükseltmesi 2 elmasa alınmalı');
  await page.click('.tk-bolum >> nth=1');
  await ileri(50);
  beklenen(await sayi('raketw') === 91, 'Yükseltilmiş raket %8 geniş olmalı, gelen: ' + await veri('raketw'));

  // Günlük mod: iki açılışta aynı dizilim, yükseltmeler kapalı
  await git('games/tugla-kirma/?gunluk=2026-10-24');
  await page.click('[data-gunluk]');
  await ileri(50);
  const d1 = await veri('dizilim');
  beklenen(await sayi('raketw') === 84, 'Günlük modda yükseltme kullanılmamalı');
  await git('games/tugla-kirma/?gunluk=2026-10-24');
  await page.click('[data-gunluk]');
  await ileri(50);
  beklenen(d1 && (await veri('dizilim')) === d1, 'Günlük modda iki açılışta aynı dizilim gelmeli');
};

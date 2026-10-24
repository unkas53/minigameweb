// 2048 oynanış testi: kaydırma, birleşme, skor, yeniden başlatma, oyun sonu ve günlük mod; Görev Yolu: bozuk kayıt,
// harita ve kilitler, Bölüm 1'i sabit tohumla kazanıp yıldız kaydı (mo_2048) ve Bölüm 2'nin açılması, klasik rekorun
// korunması, taş karenin yerinden oynamaması, yıldızla açılan tema ve kalıcılığı, seçilen modun hatırlanması,
// günlük modda sekmelerin gizlenmesi ve 3x3 / 5x5 tahtalarda 360 px taşma.
module.exports = async function (page, { git, beklenen }) {
  const tiles = () => page.$$eval('#board .cell', cs => cs.filter(c => c.textContent).length);
  const board = () => page.$$eval('#board .cell', cs => cs.map(c => c.textContent).join(','));
  const kayit = () => page.evaluate(() => JSON.parse(localStorage.getItem('mo_2048')));
  const yazKayit = s => page.evaluate(s => localStorage.setItem('mo_2048', JSON.stringify(s)), s);
  const sonuAcik = () => page.$('.oyun-sonu[open]');
  const gorunur = sel => page.isVisible(sel);

  // Bozuk kayıt oyunu hata vermeden Klasik modda başlatmalı
  await git('games/2048/');
  await page.evaluate(() => localStorage.setItem('mo_2048', '{bozuk'));
  await git('games/2048/');
  beklenen(await gorunur('#klasik-stats') && await gorunur('#mod-sekme') && !(await gorunur('#harita')), 'Bozuk kayıtla Klasik mod açılmalı');
  beklenen(await tiles() === 2, 'Oyun 2 kareyle başlamalı');

  const once = await board();
  for (const k of ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown']) await page.keyboard.press(k);
  beklenen(await board() !== once, 'Ok tuşları tahtayı değiştirmeli');

  // Oyun bitene kadar oyna
  for (let i = 0; i < 2000 && !(await sonuAcik()); i++) {
    await page.keyboard.press(['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp'][i % 4]);
  }
  await page.waitForSelector('.oyun-sonu[open]', { timeout: 3000 });
  const score = Number(await page.textContent('#score'));
  beklenen(score > 0, 'Skor artmalı');
  beklenen(Number(await page.evaluate(() => localStorage.getItem('mo_best_2048'))) === score, 'En iyi skor kaydedilmeli');

  await page.click('.oyun-sonu [data-a="tekrar"]');
  beklenen(await page.textContent('#score') === '0' && await tiles() === 2, '"Tekrar oyna" oyunu sıfırlamalı');

  // Görev Yolu: 30 bölümlük harita, yalnızca Bölüm 1 açık
  await page.click('#mod-sekme [data-mod="gorev"]');
  beklenen(await gorunur('#harita') && !(await gorunur('#board')), 'Görev Yolu haritayı göstermeli');
  beklenen(await page.locator('.gy-bolum').count() === 30, 'Haritada 30 bölüm olmalı');
  beklenen(await page.locator('.gy-bolum:not([disabled])').count() === 1 && await page.isEnabled('.gy-bolum[data-bolum="1"]'), 'İlk açılışta yalnızca Bölüm 1 açık olmalı');
  beklenen((await kayit()).mod === 'gorev', 'Seçilen mod kaydedilmeli');

  // Bölüm 1 sabit tohumla her seferinde aynı başlamalı
  await page.click('.gy-bolum[data-bolum="1"]');
  const b1 = await board();
  await page.click('#gy-yeniden');
  beklenen(await board() === b1, 'Bölüm aynı tohumla aynı başlamalı');
  beklenen(await page.textContent('#gy-hedef') === '64' && await page.textContent('#gy-kalan') === '80', 'Hedef ve kalan hamle görünmeli');

  // Bölüm 1'i oyna: alt-sol köşe stratejisi (tohum sabit olduğu için sonuç hep aynı)
  for (let i = 0; i < 200 && !(await sonuAcik()); i++) {
    const h = Number(await page.getAttribute('#board', 'data-hamle') || 0);
    for (const k of ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp']) {
      await page.keyboard.press(k);
      if (Number(await page.getAttribute('#board', 'data-hamle')) !== h) break;
    }
  }
  await page.waitForSelector('.oyun-sonu[open]', { timeout: 3000 });
  const baslik = await page.textContent('.oyun-sonu h2');
  beklenen(/tamam/.test(baslik), 'Bölüm 1 kazanılmalı: ' + baslik);
  const hamle = Number(await page.getAttribute('#board', 'data-hamle'));
  const s1 = await kayit();
  const yildizBeklenen = hamle < 40 ? 3 : hamle < 60 ? 2 : 1;
  beklenen(s1.yildiz['1'] === yildizBeklenen, `Bölüm 1 yıldızı hamleye göre ${yildizBeklenen} olmalı (${hamle} hamle, kayıt ${s1.yildiz['1']})`);
  beklenen(Number(await page.evaluate(() => localStorage.getItem('mo_best_2048'))) === score, 'Görev Yolu klasik rekoru değiştirmemeli');
  await page.click('.oyun-sonu [data-a="kapat"]');
  beklenen(await gorunur('#gy-sonraki'), '"Sıradaki bölüm" düğmesi çıkmalı');
  await page.click('#gy-sonraki');
  beklenen(await page.textContent('#gy-bolum') === '2', 'Sıradaki düğmesi Bölüm 2\'yi açmalı');
  await page.click('#gy-harita');
  beklenen(await page.isEnabled('.gy-bolum[data-bolum="2"]') && !(await page.isEnabled('.gy-bolum[data-bolum="3"]')), 'Bölüm 1 geçilince yalnızca Bölüm 2 açılmalı');

  // Mod hatırlanmalı
  await git('games/2048/');
  beklenen(await gorunur('#harita'), 'Sayfa yenilenince Görev Yolu açık kalmalı');

  // Dünya kilidi: 10 bölüm geçilse de 15 yıldız yoksa Dünya 2 kapalı
  const yildizlar = (son, y) => { const o = {}; for (let i = 1; i <= son; i++) o[i] = y; return o; };
  await yazKayit({ v: 1, mod: 'gorev', yildiz: yildizlar(10, 1), tema: 'varsayilan' });
  await git('games/2048/');
  beklenen(!(await page.isEnabled('.gy-bolum[data-bolum="11"]')), 'Dünya 2 için 15 yıldız gerekmeli');

  // Taş kare (Bölüm 12, [1,1]) hiç kaymamalı; Okyanus teması 10 yıldızla açık
  await yazKayit({ v: 1, mod: 'gorev', yildiz: yildizlar(11, 2), tema: 'varsayilan' });
  await git('games/2048/');
  beklenen(await page.isEnabled('.gy-bolum[data-bolum="11"]') && await page.isEnabled('.gy-bolum[data-bolum="12"]'), 'Yıldızlar yetince Dünya 2 açılmalı');
  beklenen(await page.isEnabled('.gy-tema[data-tema="okyanus"]') && !(await page.isEnabled('.gy-tema[data-tema="orman"]')), 'Okyanus açık, Orman (30 yıldız) kilitli olmalı');
  await page.click('.gy-tema[data-tema="okyanus"]');
  await page.click('.gy-bolum[data-bolum="12"]');
  const tasYeri = () => page.$$eval('#board .cell', cs => cs.map((c, i) => c.classList.contains('tas') ? i : -1).filter(i => i >= 0).join());
  beklenen(await tasYeri() === '5', 'Bölüm 12\'de taş kare 2. satır 2. sütunda olmalı');
  for (const k of ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) await page.keyboard.press(k);
  beklenen(Number(await page.getAttribute('#board', 'data-hamle')) > 0 && await tasYeri() === '5', 'Taş kare hamlelerden sonra yerinde kalmalı');
  beklenen(await page.$eval('#board .cell.tas', c => c.textContent === ''), 'Taş kareye sayı yazılmamalı');

  // Tema yenilemede korunmalı ve Klasik modda da uygulanmalı
  await git('games/2048/');
  await page.click('#mod-sekme [data-mod="klasik"]');
  beklenen(await page.$eval('#board', b => b.classList.contains('tema-okyanus')), 'Seçilen tema Klasik modda da uygulanmalı');
  beklenen((await kayit()).tema === 'okyanus', 'Tema kaydedilmeli');

  // Günlük modda sekmeler gizli, Klasik oynanır ve başlangıç tahtası her açılışta aynı olmalı
  await page.click('#mod-sekme [data-mod="gorev"]');
  await git('games/2048/?gunluk=2026-10-24');
  beklenen(!(await gorunur('#mod-sekme')) && await gorunur('#klasik-stats') && await gorunur('#board'), 'Günlük modda sekmeler gizli ve Klasik açık olmalı');
  const g1 = await board();
  await git('games/2048/?gunluk=2026-10-24');
  beklenen(g1 === await board(), 'Günlük modda başlangıç tahtası aynı olmalı');

  // 360 px: 3x3 ve 5x5 tahtalar taşmamalı, dokunmatik kaydırma çalışmalı
  await yazKayit({ v: 1, mod: 'gorev', yildiz: yildizlar(30, 3), tema: 'altin' });
  await page.setViewportSize({ width: 360, height: 740 });
  for (const n of [11, 21]) {
    await git('games/2048/');
    await page.click(`.gy-bolum[data-bolum="${n}"]`);
    const boyut = n === 11 ? 9 : 25;
    beklenen(await page.locator('#board .cell').count() === boyut, `Bölüm ${n} tahtası ${boyut} kare olmalı`);
    beklenen(await page.evaluate(() => document.documentElement.scrollWidth <= 360), `Bölüm ${n} 360 px'te taşmamalı`);
    const kutu = await page.$eval('#board', b => { const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    for (const [dx, dy] of [[-80, 0], [0, 80], [80, 0], [0, -80]]) {
      await page.$eval('#board', (b, { kutu, dx, dy }) => {
        const t = (x, y) => new Touch({ identifier: 1, target: b, clientX: x, clientY: y });
        b.dispatchEvent(new TouchEvent('touchstart', { touches: [t(kutu.x, kutu.y)], changedTouches: [t(kutu.x, kutu.y)], bubbles: true }));
        b.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t(kutu.x + dx, kutu.y + dy)], bubbles: true }));
      }, { kutu, dx, dy });
    }
    beklenen(Number(await page.getAttribute('#board', 'data-hamle')) > 0, `Bölüm ${n}'de dokunmatik kaydırma çalışmalı`);
  }
  await page.setViewportSize({ width: 1280, height: 800 });
};

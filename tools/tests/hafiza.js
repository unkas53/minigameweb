// Hafıza Kartları oynanış testi: eşleşmeyen kartların kapanması, oyunu bitirme, rekor, günlük mod;
// Sefer modu: bölüm haritası, yıldız kaydı, kilitli bölümler, temalar, süreli bölüm ve bozuk kayıt.
module.exports = async function (page, { git, beklenen }) {
  const icons = () => page.$$eval('.card', cs => cs.map(c => c.dataset.icon));
  const kayit = () => page.evaluate(() => JSON.parse(localStorage.getItem('mo_hafiza')));
  // Tahtadaki tüm eşleri hatasız bulur
  const coz = async () => {
    const list = await icons(), done = {};
    for (let i = 0; i < list.length; i++) {
      if (done[i]) continue;
      const j = list.findIndex((x, k) => k > i && x === list[i]);
      done[i] = done[j] = true;
      await page.click(`.card >> nth=${i}`);
      await page.click(`.card >> nth=${j}`);
    }
  };

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
  beklenen(!(await page.isVisible('#modlar')) && !(await page.isVisible('#temalar')), 'Günlük modda mod seçimi ve tema şeridi görünmemeli');

  // Sefer: harita, 1. bölümü bitirme, yıldız ve kayıt
  await git('games/hafiza/');
  await page.click('#modlar [data-mod="sefer"]');
  beklenen(await page.isVisible('#harita') && !(await page.isVisible('#cards')), 'Sefer seçilince harita görünmeli');
  beklenen(await page.locator('.hf-bolum').count() === 12 && await page.locator('.hf-bolum:not(.kilitli)').count() === 1, '12 bölüm olmalı, başta yalnızca 1. bölüm açık');
  await page.click('.hf-bolum >> nth=2', { force: true });
  beklenen(await page.isVisible('#harita'), 'Kilitli bölüme tıklamak oyun başlatmamalı');
  await page.click('.hf-bolum >> nth=0');
  beklenen((await icons()).length === 16, '1. bölüm 16 kart olmalı');
  await coz();
  await page.waitForSelector('.oyun-sonu[open]', { timeout: 3000 });
  let k = await kayit();
  beklenen(k.yildiz['1'] === 3 && k.bolum === 2 && k.mod === 'sefer', 'Hatasız 1. bölüm 3 yıldız ve bolum=2 kaydetmeli');
  beklenen(await page.evaluate(() => localStorage.getItem('mo_best_hafiza')) === '9', 'Sefer modu klasik rekoru değiştirmemeli');
  await page.click('.oyun-sonu [data-a="kapat"]');
  await page.click('#harita-btn');
  beklenen(await page.locator('.hf-bolum:not(.kilitli)').count() === 2 && await page.locator('.hf-bolum >> nth=2').isDisabled(), '2. bölüm açılmalı, 3. bölüm kilitli kalmalı');
  beklenen((await page.textContent('#yildiz-sayac')).includes('3/36'), 'Yıldız sayacı 3/36 göstermeli');

  // Sayfaya dönünce Sefer haritası açılmalı; 6x6 bölüm her emojiden iki tane içermeli
  await page.evaluate(() => localStorage.setItem('mo_hafiza', JSON.stringify({ mod: 'sefer', bolum: 9, yildiz: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3 } })));
  await git('games/hafiza/');
  beklenen(await page.isVisible('#harita'), 'Kayıtlı Sefer modu harita ile açılmalı');
  await page.click('.hf-tema[data-tema="hayvan"]');
  beklenen(await page.getAttribute('.hf-tema[data-tema="hayvan"]', 'aria-pressed') === 'true', '30 yıldızla Hayvan teması seçilebilmeli');
  await page.click('.hf-bolum >> nth=9');
  const b10 = await icons(), say = {};
  b10.forEach(x => { say[x] = (say[x] || 0) + 1; });
  beklenen(b10.length === 36 && Object.values(say).every(v => v === 2) && Object.keys(say).length === 18, '10. bölüm 36 kart ve her emojiden 2 olmalı');
  beklenen(b10.includes('🐱') && b10.every(x => '🐱🐶🦊🐼🐨🐯🦁🐸🐵🐧🦉🐙🦋🐢🦀🐝🐬🦄'.includes(x)), '10. bölüm Hayvan temasıyla kurulmalı');

  // Süreli 12. bölüm: süre dolunca kaybedilir, eski yıldız silinmez
  await page.evaluate(() => {
    const k = JSON.parse(localStorage.getItem('mo_hafiza'));
    k.yildiz[11] = 2; k.yildiz[12] = 2; localStorage.setItem('mo_hafiza', JSON.stringify(k));
  });
  await page.clock.install();
  await git('games/hafiza/');
  await page.click('.hf-bolum >> nth=11');
  beklenen(await page.textContent('#time') === '100', '12. bölüm 100 saniyeden geri saymalı');
  const b12 = await icons();
  await page.click('.card >> nth=0');
  await page.clock.runFor(101000);
  await page.waitForSelector('.oyun-sonu[open]', { timeout: 3000 });
  beklenen((await page.textContent('.oyun-sonu h2')).includes('Süre doldu') && (await kayit()).yildiz['12'] === 2, 'Süre dolunca bölüm kaybedilmeli, eski yıldız korunmalı');
  await page.click('.oyun-sonu [data-a="kapat"]');
  beklenen(b12.length === 36, '12. bölüm 6x6 olmalı');

  // Tema klasik modda da kullanılır ve yenilenince korunur
  await page.click('#modlar [data-mod="klasik"]');
  const kl = await icons();
  beklenen(kl.length === 16 && kl.every(x => '🐱🐶🦊🐼🐨🐯🦁🐸🐵🐧🦉🐙🦋🐢🦀🐝🐬🦄'.includes(x)), 'Seçilen tema klasik modda kullanılmalı');

  // 360 px: harita ve 6x6 tahta taşmamalı, kart kenarı en az 40 px
  await page.setViewportSize({ width: 360, height: 740 });
  await page.click('#modlar [data-mod="sefer"]');
  await page.click('.hf-bolum >> nth=9');
  const olcu = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, kart: document.querySelector('.card').getBoundingClientRect().width }));
  beklenen(olcu.sw <= olcu.iw && olcu.kart >= 40, '360 px\'te 6x6 tahta taşmamalı ve kart en az 40 px olmalı (' + JSON.stringify(olcu) + ')');
  await page.setViewportSize({ width: 1280, height: 900 });

  // Bozuk kayıt: sayfa hatasız klasik modda açılır, Sefer 1. bölümden başlar
  await page.evaluate(() => localStorage.setItem('mo_hafiza', 'bozuk'));
  await git('games/hafiza/');
  beklenen((await icons()).length === 16, 'Bozuk kayıtla oyun açılmalı');
  await page.click('#modlar [data-mod="sefer"]');
  beklenen(await page.locator('.hf-bolum:not(.kilitli)').count() === 1, 'Bozuk kayıtla Sefer sıfırdan başlamalı');
};

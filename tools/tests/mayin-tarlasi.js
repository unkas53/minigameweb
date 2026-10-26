// Mayın Tarlası oynanış testi: Klasik mod (ilk tıklama güvenli, bayrak, süre, duraklatma, oyun sonu); motor
// (30 bölüm, maskeler, tahminsiz tahta üretimi ve süresi); Sefer (bozuk kayıt, harita ve kilitler, Bölüm 1'i
// kazanıp yıldız ve mo_mayin kaydı, yanlış bayrağın yıldızı düşürmesi, kapalı karelerin tıklanamaması,
// yıldızla açılan tema ve kalıcılığı, klasik rekorun korunması, 360 px taşma).
module.exports = async function (page, { git, beklenen }) {
  const cells = '#board > div';
  const opened = () => page.$$eval(cells, cs => cs.filter(c => c.classList.contains('open')).length);
  const kayit = () => page.evaluate(() => JSON.parse(localStorage.getItem('mo_mayin')));
  const yazKayit = s => page.evaluate(s => localStorage.setItem('mo_mayin', typeof s === 'string' ? s : JSON.stringify(s)), s);

  await git('games/mayin-tarlasi/');
  beklenen(await page.$$eval(cells, cs => cs.length) === 81, 'Kolay seviye 9x9 olmalı');
  beklenen(await page.isVisible('#mod-sekme') && !(await page.isVisible('#harita')), 'İlk açılışta Klasik mod görünmeli');

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

  // Motor: 30 bölüm, maskeler bağlı, her bölümde tahminsiz tahta hızlıca bulunur
  const motor = await page.evaluate(() => {
    const M = MayinMotor, hata = [];
    if (M.BOLUMLER.length !== 30) hata.push('30 bölüm olmalı');
    M.BOLUMLER.forEach(B => {
      if (B.w > 13) hata.push(`Bölüm ${B.n}: 13 sütundan geniş`);
      const oyn = B.maske.map((v, i) => v ? i : -1).filter(i => i >= 0);
      const gor = { [oyn[0]]: 1 }, q = [oyn[0]];
      let say = 0;
      while (q.length) { const c = q.pop(); say++; M.komsular(B.w, B.h, B.maske, c).forEach(m => { if (!gor[m]) { gor[m] = 1; q.push(m); } }); }
      if (say !== oyn.length) hata.push(`Bölüm ${B.n}: tahta tek parça değil`);
      const ilk = oyn[Math.floor(oyn.length / 2)];
      const t0 = performance.now();
      const r = M.uret(B, ilk, MiniOyun.gunluk.rastgele('test/' + B.n));
      const ms = performance.now() - t0;
      if (!r.cozulur) hata.push(`Bölüm ${B.n}: tahminsiz tahta bulunamadı`);
      if (ms > 300) hata.push(`Bölüm ${B.n}: üretim ${Math.round(ms)} ms`);
      if (Object.keys(r.mayinlar).length !== B.mayin) hata.push(`Bölüm ${B.n}: mayın sayısı yanlış`);
      if (Object.keys(r.mayinlar).some(k => !B.maske[k])) hata.push(`Bölüm ${B.n}: kapalı karede mayın`);
      if (!M.coz(B, r.mayinlar, ilk)) hata.push(`Bölüm ${B.n}: çözücü tahtayı bitiremedi`);
    });
    return hata;
  });
  motor.forEach(h => beklenen(false, h));

  // Sefer: bozuk kayıtla hatasız açılır, haritada yalnızca 1. bölüm açık
  await page.evaluate(() => localStorage.setItem('mayin-tarlasi-en-iyi-kolay', '77'));
  await yazKayit('{bozuk');
  await page.reload();
  await page.click('#mod-sekme [data-mod="sefer"]');
  beklenen(await page.isVisible('#harita') && !(await page.isVisible('#board')), 'Sefer haritası görünmeli');
  beklenen(await page.$$eval('.ms-bolum', b => b.length) === 30, 'Haritada 30 bölüm olmalı');
  beklenen(await page.$$eval('.ms-bolum:not([disabled])', b => b.length) === 1, 'Başta yalnızca 1. bölüm açık olmalı');

  // Bölüm 1'i durumdan okunan güvenli karelerle kazan (bayraksız, hızlı → 3 yıldız)
  const ilkTik = async () => {
    const d = await page.evaluate(() => { const s = MayinMotor.durum(); return { cols: s.cols, maske: s.maske }; });
    const orta = Math.floor(d.maske.length / 2), ilk = d.maske[orta] ? orta : d.maske.indexOf(true);
    await page.click(`${cells} >> nth=${ilk}`);
  };
  const sefereBasla = async n => { await page.click(`.ms-bolum[data-bolum="${n}"]`); await ilkTik(); };
  const temizle = async () => {
    for (let k = 0; k < 200 && !(await page.$('.oyun-sonu[open]')); k++) {
      const i = await page.evaluate(() => { const s = MayinMotor.durum(); return s.cells.findIndex((c, i) => s.maske[i] && !c.mine && !c.open); });
      if (i < 0) break;
      await page.click(`${cells} >> nth=${i}`);
    }
    await page.waitForSelector('.oyun-sonu[open]', { timeout: 3000 });
  };
  await sefereBasla(1);
  beklenen(await page.isVisible('#ms-ipucu') && (await page.textContent('#ms-ipucu')).includes('hedef'), 'Süre hedefi gösterilmeli');
  await temizle();
  let k = await kayit();
  beklenen(k && k.mod === 'sefer' && k.bolumler['1'] && k.bolumler['1'].yildiz === 3, 'Bölüm 1 bayraksız ve hızlı bitince 3 yıldız kaydedilmeli: ' + JSON.stringify(k));
  beklenen(await page.isVisible('#ms-sonraki'), '"Sonraki bölüm" düğmesi görünmeli');
  await page.click('.oyun-sonu [data-a="kapat"]');

  // Bölüm 2: kapalı kareye tıklamak bir şey yapmaz; yanlış bayrak 3. yıldızı düşürür
  await page.click('#ms-sonraki');
  const bos = await page.evaluate(() => MayinMotor.durum().maske.indexOf(false));
  beklenen(bos >= 0, 'Bölüm 2 (artı) kapalı kare içermeli');
  const once = await opened();
  await page.click(`${cells} >> nth=${bos}`, { force: true });
  beklenen(await opened() === once, 'Kapalı kare tıklanamamalı');
  await ilkTik();
  const yanlis = await page.evaluate(() => { const s = MayinMotor.durum(); return s.cells.findIndex((c, i) => s.maske[i] && !c.mine && !c.open); });
  await page.click(`${cells} >> nth=${yanlis}`, { button: 'right' });
  await page.click(`${cells} >> nth=${yanlis}`, { button: 'right' });
  beklenen(await page.evaluate(() => MayinMotor.durum().yanlisBayrak), 'Yanlış bayrak kaldırılsa da sayılmalı');
  await temizle();
  k = await kayit();
  beklenen(k.bolumler['2'] && k.bolumler['2'].yildiz === 2, 'Yanlış bayrakla bitirince 2 yıldız olmalı: ' + JSON.stringify(k.bolumler));
  await page.click('.oyun-sonu [data-a="kapat"]');

  // Kayıt yenilemeden sonra korunur; 3. bölüm açık, klasik rekor değişmedi
  await page.reload();
  beklenen(await page.isVisible('#harita'), 'Son seçilen mod (Sefer) yeniden yüklemede korunmalı');
  beklenen(await page.$$eval('.ms-bolum:not([disabled])', b => b.length) === 3, 'İki bölümden sonra 3 bölüm açık olmalı');
  beklenen(await page.evaluate(() => localStorage.getItem('mayin-tarlasi-en-iyi-kolay')) === '77', 'Klasik rekor anahtarı Sefer\'den etkilenmemeli');

  // 15 yıldızda Çöl teması açılır, seçilir ve korunur; klasik modda da geçerli
  const bolumler = {};
  for (let n = 1; n <= 5; n++) bolumler[n] = { yildiz: 3, enIyiSn: 20 };
  await yazKayit({ mod: 'sefer', bolumler, tema: 'klasik' });
  await page.reload();
  beklenen((await page.textContent('#ms-toplam')).includes('15/90'), 'Toplam yıldız haritada görünmeli');
  beklenen(!(await page.$eval('#tema option[value="col"]', o => o.disabled)) && await page.$eval('#tema option[value="deniz"]', o => o.disabled), '15 yıldızda yalnızca Çöl açılmalı');
  await page.selectOption('#tema', 'col');
  await page.click('#mod-sekme [data-mod="klasik"]');
  await page.reload();
  beklenen(await page.isVisible('#board') && await page.getAttribute('#board', 'data-tema') === 'col', 'Seçilen tema klasik modda ve yeniden yüklemede korunmalı');
  k = await kayit();
  beklenen(k.tema === 'col' && k.mod === 'klasik' && k.acikTemalar.indexOf('col') >= 0, 'Tema mo_mayin içinde saklanmalı');

  // 360 px: en büyük Sefer tahtası taşmadan sığar, kare en az 24 px
  await yazKayit({ mod: 'sefer', bolumler: Object.fromEntries(Array.from({ length: 29 }, (_, i) => [i + 1, { yildiz: 1, enIyiSn: 99 }])), tema: 'klasik' });
  await page.setViewportSize({ width: 360, height: 740 });
  await page.reload();
  await page.click('.ms-bolum[data-bolum="30"]');
  const olcu = await page.evaluate(() => ({ kaydir: document.documentElement.scrollWidth > window.innerWidth, kare: document.querySelector('#board > div').getBoundingClientRect().width }));
  beklenen(!olcu.kaydir && olcu.kare >= 24, `360 px'te Bölüm 30 sığmalı (kare ${olcu.kare.toFixed(1)} px)`);
  await page.setViewportSize({ width: 1280, height: 800 });
};

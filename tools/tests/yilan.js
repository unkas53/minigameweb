// Yılan oynanış testi: Klasik mod (başlatma, duraklatma, duvara çarpınca oyun sonu, yeniden başlatma); motor
// kontrolleri (24 düzenin başlangıcı ve bağlılığı, kenardan geçiş, altın/buz yemi süreleri, yemin engel/lav/yılan
// üstüne düşmemesi); Macera (bozuk kayıt, harita ve kilitler, Bölüm 1'i sahte saatle botla kazanıp mo_yilan kaydı,
// duraklatmanın süreyi durdurması, Bölüm 2'de engele çarpıp kaybetme, klasik rekorun korunması, yıldızla açılan
// desen ve kalıcılığı, 360 px taşma, günlük modda sekmelerin gizlenmesi).
module.exports = async function (page, { git, beklenen }) {
  const sonuAcik = () => page.$('.oyun-sonu[open]');
  const kayit = () => page.evaluate(() => JSON.parse(localStorage.getItem('mo_yilan')));
  const yazKayit = s => page.evaluate(s => localStorage.setItem('mo_yilan', JSON.stringify(s)), s);

  await git('games/yilan/');
  beklenen(await page.isVisible('#klasik-stats') && await page.isVisible('#mod-sekme') && !(await page.isVisible('#harita')), 'İlk açılışta Klasik mod görünmeli');
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
  const klasikRekor = await page.evaluate(() => localStorage.getItem('mo_best_yilan'));

  // Motor: düzenler, kenardan geçiş, özel yemler, yem yerleşimi
  const motor = await page.evaluate(() => {
    const M = YilanMotor, N = M.N, B = M.BOLUMLER, hata = [];
    if (B.length !== 24) hata.push('24 bölüm olmalı: ' + B.length);
    B.forEach(b => {
      const g = M.engelIzgara(b), v = M.DIRS[b.bas[2]];
      const hucreler = M.basYilan(b).concat([1, 2, 3].map(k => [b.bas[0] + v[0] * k, b.bas[1] + v[1] * k]));
      if (hucreler.some(c => c[0] < 0 || c[1] < 0 || c[0] >= N || c[1] >= N || g[c[1] * N + c[0]])) hata.push(`Bölüm ${b.n}: başlangıç veya önündeki 3 hücre dolu`);
      if (!M.bagliMi(g, b.sarma)) hata.push(`Bölüm ${b.n}: boş alan tek parça değil`);
      if (b.sarma !== (b.n >= 13 && b.n <= 16)) hata.push(`Bölüm ${b.n}: kenardan geçiş yalnızca 13-16'da olmalı`);
    });
    // Kenardan geçiş: 13. bölümde sol kenardan çıkan yılan sağdan girer, 1. bölümde çarpar
    const kenar = n => { const s = M.yeniDurum(B[n - 1]); s.snake = [[0, 1], [1, 1], [2, 1]]; s.dir = s.nextDir = 'left'; s.food = null; const o = M.adim(s, 100); return { carpti: !!o.carpti, bas: s.snake[0].join(',') }; };
    const k13 = kenar(13), k1 = kenar(1);
    if (k13.carpti || k13.bas !== '20,1') hata.push('13. bölümde kenardan geçiş çalışmalı: ' + JSON.stringify(k13));
    if (!k1.carpti) hata.push('1. bölümde kenar duvar olmalı');
    // Altın yem 6 sn sonra kaybolur; buz yemi 5 sn yavaşlatır, sonra eski hıza döner
    let s = M.yeniDurum(B[8]); s.food = null;
    s.ozel.push({ x: 0, y: 0, tur: 'altin', kalan: 6000 });
    s.snake = [[1, 10], [1, 9], [1, 8]]; s.dir = s.nextDir = 'down';
    let t = 0; while (s.ozel.length && t < 20) { M.adim(s, 1000); t++; }
    if (t !== 6) hata.push('Altın yem 6 saniyede kaybolmalı: ' + t);
    s = M.yeniDurum(B[8]); s.food = null;
    s.snake = [[3, 10], [2, 10], [1, 10]]; s.ozel.push({ x: 4, y: 10, tur: 'buz', kalan: 0 });
    M.adim(s, 120);
    const yavas = M.adimMs(s);
    s.snake = [[3, 18], [2, 18], [1, 18]]; s.dir = s.nextDir = 'right';
    for (let i = 0; i < 5; i++) M.adim(s, 1000);
    if (!(yavas > 120 * 1.3) || M.adimMs(s) !== B[8].hiz) hata.push(`Buz yemi hızı geçici düşürmeli: ${yavas} → ${M.adimMs(s)}`);
    // Yem, özel yem ve lav hiçbir zaman engel/lav veya yılan üstüne düşmez (Yanardağ bölümleri botla oynanır)
    let lav = 0;
    B.slice(16).forEach(b => {
      for (let tekrar = 0; tekrar < 3; tekrar++) {
        const d = M.yeniDurum(b);
        for (let i = 0; i < 4000 && !d.bitti; i++) {
          d.nextDir = M.botYon(d);
          const o = M.adim(d, M.adimMs(d));
          if (o.lav) lav++;
          const dolu = c => d.engel[c[1] * N + c[0]] || d.snake.some(p => p[0] === c[0] && p[1] === c[1]);
          if (!d.bitti && ((d.food && dolu(d.food)) || d.ozel.some(z => dolu([z.x, z.y])))) { hata.push(`Bölüm ${b.n}: yem dolu hücrede`); break; }
          if (o.lav && !M.bagliMi(d.engel, d.sarma)) { hata.push(`Bölüm ${b.n}: lav tahtayı böldü`); break; }
        }
      }
    });
    if (!lav) hata.push('Yanardağ bölümlerinde lav çıkmalı');
    return hata;
  });
  motor.forEach(h => beklenen(false, h));

  // Bozuk kayıt hatasız açılır ve sıfırdan başlar
  await page.evaluate(() => localStorage.setItem('mo_yilan', '{bozuk'));
  await page.clock.install({ time: new Date('2026-10-24T10:00:00') });
  await git('games/yilan/');
  beklenen(await page.isVisible('#klasik-stats'), 'Bozuk kayıtla Klasik mod açılmalı');

  // Macera haritası: yalnızca 1. bölüm açık
  await page.click('#mod-sekme [data-mod="macera"]');
  beklenen(await page.isVisible('#harita') && !(await page.isVisible('#canvas')), 'Macera sekmesi haritayı göstermeli');
  beklenen(await page.$$eval('#harita [data-bolum]', bs => bs.length) === 24, 'Haritada 24 bölüm olmalı');
  beklenen(await page.$$eval('#harita [data-bolum]:not([disabled])', bs => bs.map(b => b.dataset.bolum).join()) === '1', 'Başta yalnızca 1. bölüm açık olmalı');

  // Bölüm 1: bot yem yönüne döner, sahte saat ileri sarılır
  await page.click('#harita [data-bolum="1"]');
  beklenen((await page.textContent('#ym-yem')) === '0/8', 'Yem sayacı 0/8 ile başlamalı');
  const TUS = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  await page.keyboard.press('ArrowRight');
  let duraklatildi = false;
  for (let i = 0; i < 3000 && !(await sonuAcik()); i++) {
    const d = await page.evaluate(() => { const s = YilanMotor.durum(); return { yon: YilanMotor.botYon(s), cur: s.nextDir, ms: YilanMotor.adimMs(s), sure: s.sure }; });
    if (!duraklatildi && i === 20) {
      duraklatildi = true;
      await page.click('.oyun-btn[aria-label="Duraklat"]');
      await page.clock.runFor(10000);
      const sonra = await page.evaluate(() => YilanMotor.durum().sure);
      beklenen(sonra === d.sure, 'Duraklatma bölüm süresini durdurmalı');
      await page.click('.oyun-duraklat .btn');
    }
    if (d.yon !== d.cur) await page.keyboard.press(TUS[d.yon]);
    await page.clock.runFor(d.ms);
  }
  beklenen((await page.textContent('.oyun-sonu h2')).includes('tamam'), 'Bölüm 1 kazanılmalı');
  beklenen((await page.textContent('#ym-yem')) === '8/8', 'Yem sayacı 8/8 olmalı');
  let k = await kayit();
  beklenen(k && k.yildiz && k.yildiz['1'] >= 1 && k.mod === 'macera', 'Bölüm 1 yıldızı mo_yilan içine yazılmalı: ' + JSON.stringify(k));
  beklenen(!(await page.isVisible('.oyun-sonu-gunluk')), 'Macera bölümü liderlik tablosuna skor göndermemeli');
  beklenen(await page.evaluate(() => localStorage.getItem('mo_best_yilan')) === klasikRekor, 'Macera klasik rekoru değiştirmemeli');
  await page.click('.oyun-sonu [data-a="kapat"]');

  // Bölüm 2: ortadaki bloğa doğru git, kaybet
  await page.click('#ym-sonraki');
  beklenen((await page.textContent('#ym-bolum')) === '2', '"Sonraki bölüm" 2. bölümü başlatmalı');
  await page.keyboard.press('ArrowRight');
  await page.clock.runFor(3000);
  beklenen((await page.textContent('.oyun-sonu h2')).includes('olmadı'), 'Engele çarpınca bölüm kaybedilmeli');
  k = await kayit();
  beklenen(!k.yildiz['2'], 'Kaybedilen bölüm yıldız vermemeli');
  await page.click('.oyun-sonu [data-a="kapat"]');
  await page.click('#ym-harita2');
  beklenen(!(await page.isDisabled('#harita [data-bolum="2"]')) && await page.isDisabled('#harita [data-bolum="3"]'), '2. bölüm açık, 3. bölüm kilitli olmalı');

  // 12 yıldız: Gökkuşağı deseni açılır, seçim kalıcıdır; seçilen mod hatırlanır
  await yazKayit({ mod: 'macera', desen: 'nane', yildiz: { 1: 3, 2: 3, 3: 3, 4: 3 } });
  await git('games/yilan/');
  beklenen(await page.isVisible('#harita'), 'Seçilen Macera modu hatırlanmalı');
  beklenen(!(await page.isDisabled('[data-desen="gokkusagi"]')) && await page.isDisabled('[data-desen="mercan"]'), '12 yıldızda Gökkuşağı açık, Mercan kilitli olmalı');
  await page.click('[data-desen="gokkusagi"]');
  await git('games/yilan/');
  beklenen((await kayit()).desen === 'gokkusagi' && await page.getAttribute('[data-desen="gokkusagi"]', 'aria-pressed') === 'true', 'Seçilen desen kalıcı olmalı');
  beklenen(await page.evaluate(() => YilanMotor.desenRenk('gokkusagi', 1) !== YilanMotor.desenRenk('nane', 1)), 'Desen yılanın rengini değiştirmeli');

  // 360 px: harita ve bölüm ekranı taşmamalı
  await page.setViewportSize({ width: 360, height: 740 });
  beklenen(await page.evaluate(() => document.documentElement.scrollWidth <= 360), 'Macera haritası 360 px\'te taşmamalı');
  await page.click('#harita [data-bolum="5"]');
  beklenen(await page.evaluate(() => document.documentElement.scrollWidth <= 360), 'Macera bölümü 360 px\'te taşmamalı');
  // Yön düğmeleri yalnızca dokunmatik ekranda görünür; tıklama doğrudan tetiklenir
  beklenen(await page.$eval('.touch-controls', e => !e.hidden), 'Macera bölümünde yön düğmeleri gizlenmemeli');
  await page.$eval('.touch-controls [data-dir="right"]', b => b.click());
  await page.clock.runFor(500);
  beklenen(await page.evaluate(() => YilanMotor.durum().sure > 0), 'Dokunmatik yön düğmesi Macera bölümünü başlatmalı');
  await page.setViewportSize({ width: 1280, height: 900 });

  // Günlük modda sekmeler gizli, her zaman Klasik
  await git('games/yilan/?gunluk=2026-10-24');
  beklenen(!(await page.isVisible('#mod-sekme')) && await page.isVisible('#klasik-stats') && !(await page.isVisible('#harita')), 'Günlük modda sekmeler gizlenmeli ve Klasik oynanmalı');
};

// Mayın Tarlası oynanış testi: klasik mod (ilk tıklama güvenli, bayrak, süre, duraklatma, oyun sonu) ve Sefer modu.
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

// Sefer modu: motor (30 bölüm, tahmin gerektirmeyen üretim ve süresi), bozuk kayıt, harita ve kilitler,
// Bölüm 1'i görünen tahtadan çıkarım yaparak bitirmek, yıldızlar (yanlış bayrak), mo_mayin kaydı ve yenileme,
// yıldızla açılan tema ve klasik modda kullanımı, klasik rekorun korunması, 360 px'te en büyük tahta.
module.exports = (function (klasik) {
  return async function (page, h) {
    await klasik(page, h);
    const { git, beklenen } = h;
    const cells = '#board > div';
    const kayit = () => page.evaluate(() => JSON.parse(localStorage.getItem('mo_mayin')));
    const kapat = async () => { await page.waitForSelector('.oyun-sonu[open]', { timeout: 3000 }); await page.click('.oyun-sonu [data-a="kapat"]'); };
    const klasikRekor = await page.evaluate(() => localStorage.getItem('mayin-tarlasi-en-iyi-kolay'));

    // Motor: 30 bölüm, 13 sütunu aşmayan tahtalar, her bölüm çözücüyle tahmin yapmadan çözülür, üretim < 300 ms
    const motor = await page.evaluate(() => {
      const M = MayinMotor, hata = [];
      if (M.BOLUMLER.length !== 30) hata.push('30 bölüm olmalı');
      let s = 7; const rnd = () => (s = s * 16807 % 2147483647) / 2147483647;
      M.BOLUMLER.forEach(B => {
        if (B.C > 13) hata.push(`Bölüm ${B.n}: ${B.C} sütun`);
        const akt = B.aktif.map((a, i) => a ? i : -1).filter(i => i >= 0);
        const ilk = akt[Math.floor(rnd() * akt.length)];
        const t = performance.now(), u = M.uret(B, ilk, rnd), ms = performance.now() - t;
        if (!u.cozulur || !M.cozulurMu(B.R, B.C, B.aktif, u.mayinlar, ilk, B.mayin)) hata.push(`Bölüm ${B.n}: tahta tahmin gerektiriyor`);
        if (ms > 300) hata.push(`Bölüm ${B.n}: üretim ${Math.round(ms)} ms`);
        if (u.mayinlar.some((m, i) => m && !B.aktif[i])) hata.push(`Bölüm ${B.n}: kapalı karede mayın`);
      });
      if (M.yildiz(M.BOLUMLER[0], 10, false) !== 3 || M.yildiz(M.BOLUMLER[0], 999, false) !== 2 || M.yildiz(M.BOLUMLER[0], 10, true) !== 2 || M.yildiz(M.BOLUMLER[0], 999, true) !== 1) hata.push('Yıldız hesabı yanlış');
      return hata;
    });
    beklenen(!motor.length, 'Sefer motoru: ' + motor.join('; '));

    // Bozuk kayıtla açılış hata vermez, klasik başlar
    await page.evaluate(() => localStorage.setItem('mo_mayin', '{bozuk'));
    await git('games/mayin-tarlasi/');
    beklenen(await page.$$eval(cells, cs => cs.length) === 81 && !(await page.isVisible('#harita')), 'Bozuk kayıtla klasik mod açılmalı');

    // Harita: yalnızca 1. bölüm açık
    await page.click('#mod-sekme [data-mod="sefer"]');
    beklenen(await page.isVisible('#harita') && !(await page.isVisible('#board')), 'Sefer haritası görünmeli');
    beklenen(await page.$$eval('.mt-bolum', b => b.length) === 30, 'Haritada 30 bölüm olmalı');
    beklenen(!(await page.$eval('[data-bolum="1"]', b => b.disabled)) && await page.$eval('[data-bolum="2"]', b => b.disabled), 'Başta yalnızca 1. bölüm açık olmalı');

    // Görünen tahtadan kesin çıkarımla oynar (mayınların yerine bakmaz)
    async function coz() {
      for (let tur = 0; tur < 400; tur++) {
        if (await page.$('.oyun-sonu[open]') || await page.isVisible('.overlay-msg .btn')) return;
        const adim = await page.evaluate(() => {
          const els = [...document.querySelectorAll('#board > div')], C = +getComputedStyle(document.getElementById('board')).getPropertyValue('--cols');
          const R = els.length / C, aktif = els.map(e => !e.classList.contains('bos'));
          const gor = els.map(e => e.classList.contains('bos') ? null : e.classList.contains('open') ? (parseInt(e.textContent, 10) || 0) : e.classList.contains('bayrak') ? -2 : -1);
          if (!gor.some(g => g !== null && g >= 0)) return { guvenli: [Math.floor(R / 2) * C + Math.floor(C / 2)], mayin: [] };
          return MayinMotor.cikar(R, C, aktif, gor, +document.getElementById('mines').textContent + gor.filter(g => g === -2).length);
        });
        if (!adim.guvenli.length && !adim.mayin.length) throw new Error('Sefer tahtası tahmin gerektirdi');
        for (const i of adim.mayin) await page.click(`${cells} >> nth=${i}`, { button: 'right' });
        for (const i of adim.guvenli) {
          if (await page.isVisible('.overlay-msg .btn')) break;
          const acik = await page.$eval(`${cells} >> nth=${i}`, e => e.classList.contains('open'));
          if (!acik) await page.click(`${cells} >> nth=${i}`);
        }
      }
    }

    await page.click('[data-bolum="1"]');
    beklenen(await page.$$eval(cells, cs => cs.length) === 64 && (await page.textContent('#ms-hedef')).includes('hedef'), 'Bölüm 1 tahtası ve hedefi görünmeli');
    await coz();
    await page.waitForSelector('.oyun-sonu[open]', { timeout: 3000 });
    beklenen((await page.textContent('.oyun-sonu h2')).includes('temizlendi'), 'Bölüm 1 kazanılmalı');
    let k = await kayit();
    beklenen(k.bolumler[1].yildiz === 3 && typeof k.bolumler[1].enIyiSn === 'number', 'Hızlı ve bayrak hatasız bitiş 3 yıldız olmalı: ' + JSON.stringify(k.bolumler));
    await page.click('.oyun-sonu [data-a="kapat"]');

    // Tekrar: önce bir kareye bayrak koyup kaldır, sonra o kareyi aç (ilk tıklama güvenli olduğundan yanlış bayrak)
    await page.click('.oyun-sonu [data-a="tekrar"]').catch(() => {});
    await page.click('#face');
    await page.click(`${cells} >> nth=27`, { button: 'right' });
    await page.click(`${cells} >> nth=27`, { button: 'right' });
    await page.click(`${cells} >> nth=27`);
    await coz();
    await page.waitForSelector('.oyun-sonu[open]', { timeout: 3000 });
    beklenen((await page.textContent('.oyun-sonu-metin')).includes('yanlış bayrak'), 'Yanlış bayrak eksik yıldız olarak yazılmalı');
    k = await kayit();
    beklenen(k.bolumler[1].yildiz === 3, 'Tekrar oynayınca en iyi yıldız korunmalı');
    await page.click('.oyun-sonu [data-a="kapat"]');
    await page.click('.overlay-msg .btn-ghost');
    beklenen(!(await page.$eval('[data-bolum="2"]', b => b.disabled)), 'Bölüm 1 bitince 2. bölüm açılmalı');
    beklenen(await page.evaluate(() => localStorage.getItem('mayin-tarlasi-en-iyi-kolay')) === klasikRekor, 'Sefer klasik rekoru değiştirmemeli');

    // Yenileme: mod ve ilerleme kalıcı
    await git('games/mayin-tarlasi/');
    beklenen(await page.isVisible('#harita') && await page.textContent('#ms-toplam') === '3', 'Yenilemede Sefer haritası ve yıldızlar korunmalı');

    // 15 yıldızda Çöl teması açılır, seçim kalıcıdır ve klasik modda da geçerlidir
    await page.evaluate(() => {
      const b = {}; for (let i = 1; i <= 5; i++) b[i] = { yildiz: 3, enIyiSn: 20 };
      localStorage.setItem('mo_mayin', JSON.stringify({ mod: 'sefer', bolumler: b, tema: 'klasik', acikTemalar: ['klasik'] }));
    });
    await git('games/mayin-tarlasi/');
    beklenen(!(await page.$eval('[data-tema="col"]', b => b.disabled)) && await page.$eval('[data-tema="deniz"]', b => b.disabled), '15 yıldızda yalnızca Çöl açılmalı');
    await page.click('[data-tema="col"]');
    await git('games/mayin-tarlasi/');
    await page.click('#mod-sekme [data-mod="klasik"]');
    beklenen(await page.$eval('#board', b => b.dataset.tema) === 'col' && (await kayit()).tema === 'col', 'Seçilen tema yenilemede korunmalı ve klasikte geçerli olmalı');
    await page.click(`${cells} >> nth=0`, { button: 'right' });
    beklenen(await page.textContent(`${cells} >> nth=0`) === '🌵' && await page.textContent('#mines') === '9', 'Çöl temasında bayrak 🌵 olmalı, klasik mod çalışmalı');

    // 360 px: en büyük Sefer tahtası taşmadan sığar, kare en az 24 px
    await page.evaluate(() => {
      const b = {}; for (let i = 1; i <= 29; i++) b[i] = { yildiz: 1, enIyiSn: 99 };
      localStorage.setItem('mo_mayin', JSON.stringify({ mod: 'sefer', bolumler: b, tema: 'uzay', acikTemalar: ['klasik', 'uzay'] }));
    });
    await page.setViewportSize({ width: 360, height: 740 });
    await git('games/mayin-tarlasi/');
    await page.click('[data-bolum="30"]');
    const olcu = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: document.querySelector('#board > div').getBoundingClientRect().width, n: document.querySelectorAll('#board > div').length }));
    beklenen(olcu.n === 169 && olcu.sw <= 360 && olcu.w >= 24, '360 px\'te Bölüm 30 sığmalı: ' + JSON.stringify(olcu));
  };
})(module.exports);

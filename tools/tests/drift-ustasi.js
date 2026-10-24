// Drift Ustası oynanış testi: bölüm haritası ve kilitler, bozuk kayıt, geri sayım, klavye ile drift,
// duraklatma, hiç basmadan sürünce kurtarma hakkı ve yoldan çıkıp kaybetme (skorsuz), 1. bölümü otomatik
// sürücüyle (gerçek pointerdown/pointerup olayları) bitirip yıldız/süre/altın kaydı, "Tekrar oyna",
// kalıcı ilerleme (mo_drift), altınla yükseltme ve günlük modda iki açılışta aynı pist.
// Saat sahte (page.clock), böylece bölüm beklemeden ileri sarılır.
module.exports = async function (page, { git, beklenen }) {
  await page.clock.install({ time: new Date('2026-10-24T10:00:00') });
  const ileri = ms => page.clock.runFor(ms);
  const veri = ad => page.getAttribute('#alan', 'data-' + ad);
  const kayit = () => page.evaluate(() => JSON.parse(localStorage.getItem('mo_drift')));
  const sonuBekle = async () => { for (let i = 0; i < 120 && !(await page.$('.oyun-sonu[open]')); i++) await ileri(1000); };

  // Bozuk kayıt oyunu sıfırdan başlatmalı
  await git('games/drift-ustasi/');
  await page.evaluate(() => localStorage.setItem('mo_drift', '{bozuk'));
  await git('games/drift-ustasi/');
  beklenen(await page.isVisible('#harita'), 'Açılışta bölüm haritası görünmeli');
  beklenen(await page.locator('.du-bolum').count() === 40, '40 bölüm olmalı');
  beklenen(await page.locator('.du-bolum:not(.kilitli)').count() === 1, 'Başta yalnızca 1. bölüm açık olmalı');
  beklenen(await page.locator('.du-araba').count() === 5, 'Garajda 5 araba olmalı');
  beklenen(await page.locator('.du-araba:not([disabled])').count() === 1, 'Başta yalnızca Serçe açık olmalı');
  beklenen(await page.locator('.du-gorev').count() === 3, '3 günlük görev olmalı');

  // Geri sayım, klavye ile drift ve duraklatma
  await page.click('.du-bolum >> nth=0');
  beklenen(await veri('durum') === 'hazir', 'Bölüm geri sayımla başlamalı');
  await ileri(1500);
  beklenen(await veri('durum') === 'oyun', 'Geri sayımdan sonra araba hareket etmeli');
  await page.keyboard.down('Space');
  await ileri(100);
  beklenen(await veri('basili') === '1', 'Boşluk basılıyken drift olmalı');
  await page.keyboard.up('Space');
  await ileri(50);
  beklenen(await veri('basili') === '0', 'Boşluk bırakılınca drift bitmeli');
  await page.click('.oyun-btn[aria-label="Duraklat"]');
  const t1 = await veri('t');
  await ileri(1000);
  beklenen(await veri('t') === t1, 'Duraklatınca süre durmalı');
  await page.click('.oyun-duraklat .btn');
  await ileri(200);
  beklenen(await veri('t') !== t1, 'Devam edince süre işlemeli');

  // Hiç basmadan: ilk virajda yoldan çıkar, kurtarma hakkı bir kez çalışır, sonra bölüm kaybedilir
  await sonuBekle();
  beklenen(await veri('kurtarma') === '1', 'Orman Yolu\'nda kurtarma hakkı kullanılmalı');
  beklenen(await veri('durum') === 'kaybetti', 'Basmadan sürünce bölüm kaybedilmeli');
  beklenen((await page.textContent('.oyun-sonu h2')).includes('Yoldan çıktın'), 'Kayıp penceresi açılmalı');
  beklenen(!(await page.evaluate(() => localStorage.getItem('mo_best_drift-ustasi-1'))), 'Kaybedilen bölüm rekor yazmamalı');

  // Tekrar oyna bölümü sıfırlar
  await page.click('.oyun-sonu [data-a="tekrar"]');
  await ileri(50);
  beklenen(await veri('durum') === 'hazir' && (await veri('altin')) === '0' && (await veri('kurtarma')) === '0', 'Tekrar oyna bölümü sıfırlamalı');

  // Otomatik sürücü: oyunun önerdiği basma kararını gerçek pointer olaylarıyla uygular
  await page.evaluate(() => {
    const c = document.getElementById('alan');
    let basili = false;
    setInterval(() => {
      if (window.botDur || c.hidden || c.dataset.durum !== 'oyun') return;
      const istek = c.dataset.bot === '1';
      if (istek === basili) return;
      basili = istek;
      const r = c.getBoundingClientRect();
      c.dispatchEvent(new PointerEvent(istek ? 'pointerdown' : 'pointerup', { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, cancelable: true }));
    }, 5);
  });
  await sonuBekle();
  const baslik = await page.textContent('.oyun-sonu h2');
  beklenen(baslik.includes('Bölüm 1 bitti'), 'Bölüm 1 bitirilmeli, gelen: ' + baslik + ', konum: ' + await veri('i') + '/' + await veri('n'));
  let k = await kayit();
  beklenen(k.bolumler[1] && k.bolumler[1].yildiz >= 1 && k.bolumler[1].enIyiSn > 0, 'Yıldız ve en iyi süre mo_drift\'e kaydedilmeli');
  beklenen(k.altin > 10, 'Bölüm sonunda altın kazanılmalı, gelen: ' + k.altin);
  const best = Number(await page.evaluate(() => localStorage.getItem('mo_best_drift-ustasi-1')));
  beklenen(best > 0 && Math.abs(best - k.bolumler[1].enIyiSn) <= 1, 'Bölüm rekoru (sn) MiniOyun.getBest ile kaydedilmeli, gelen: ' + best);
  beklenen(await page.locator('.du-bolum:not(.kilitli)').count() === 2, '2. bölüm açılmalı');

  // Tekrar oyna
  await page.evaluate(() => { window.botDur = true; });
  await page.click('.oyun-sonu [data-a="tekrar"]');
  await ileri(50);
  beklenen(await veri('durum') === 'hazir' && (await veri('t')) === '0.00', 'Tekrar oyna bölümü baştan başlatmalı');

  // Kalıcı ilerleme ve altınla yükseltme
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('mo_drift')); s.altin = 500; localStorage.setItem('mo_drift', JSON.stringify(s)); });
  await git('games/drift-ustasi/');
  beklenen(await page.locator('.du-bolum:not(.kilitli)').count() === 2, 'Açılan bölümler kalıcı olmalı');
  await page.click('[data-yuk="lastik"]');
  k = await kayit();
  beklenen(k.arabalar.serce.lastik === 1 && k.altin === 450, 'Lastik yükseltmesi 50 altına alınmalı');
  await git('games/drift-ustasi/');
  beklenen((await page.textContent('[data-yuk="lastik"]')).includes('●○○○○'), 'Yükseltme yeniden açılışta korunmalı');

  // Günlük mod: iki açılışta aynı pist
  await git('games/drift-ustasi/?gunluk=2026-10-24');
  await page.click('[data-gunluk]');
  await ileri(50);
  const p1 = await veri('pist');
  await git('games/drift-ustasi/?gunluk=2026-10-24');
  await page.click('[data-gunluk]');
  await ileri(50);
  beklenen(p1 && (await veri('pist')) === p1, 'Günlük modda iki açılışta aynı pist gelmeli');
};

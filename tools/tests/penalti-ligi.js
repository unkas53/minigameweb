// Penaltı Ligi oynanış testi: kariyer haritası, atış (klavye ve dokunma), güç çubuğu yeşil → hedefe,
// kırmızı → aut, kurtarış (doğru yön → kurtarış, yanlış yön → gol), duraklatma, maçı kazanıp yıldız/para/
// sonraki maçın açılması, yükseltmenin yeşil bölgeyi genişletmesi, günlük görev ödülü, kalıcı kayıt (mo_penalti),
// bozuk kayıt, "Tekrar oyna" ve günlük modda (yükseltmesiz) iki açılışta aynı maç.
// Saat sahte (page.clock), böylece animasyonlar beklemeden ileri sarılır.
module.exports = async function (page, { git, beklenen }) {
  // Saat durdurulur; zaman yalnızca runFor ile ilerler (güç çubuğu okuma ile tuşa basma arasında kaymaz)
  await page.clock.install({ time: new Date('2026-10-24T10:00:00') });
  await page.clock.pauseAt(new Date('2026-10-24T10:00:01'));
  const ileri = ms => page.clock.runFor(ms);
  const veri = ad => page.getAttribute('#alan', 'data-' + ad);
  const kayit = () => page.evaluate(() => JSON.parse(localStorage.getItem('mo_penalti')));
  const bekleFaz = async faz => {
    for (let i = 0; i < 200 && (await veri('faz')) !== faz; i++) await ileri(50);
    beklenen((await veri('faz')) === faz, 'Beklenen faz gelmedi: ' + faz + ', gelen: ' + await veri('faz'));
  };
  const bekleBolge = async b => {
    for (let i = 0; i < 400 && (await veri('bolge')) !== b; i++) await ileri(8);
    beklenen((await veri('bolge')) === b, 'Güç çubuğu ' + b + ' bölgeye gelmedi');
  };
  // Atış: hedef tuşları, çubuk istenen bölgede durdurulur; sonuç döner
  const atis = async (tuslar, bolge = 'yesil') => {
    await bekleFaz('nisan');
    for (const t of tuslar) await page.keyboard.press(t);
    await bekleBolge(bolge);
    await page.keyboard.press('Space');
    await bekleFaz('sonuc');
    return veri('sonuc');
  };
  // Kurtarış: ipucu belirince doğru (veya bilerek ters) yöne atla
  const kurtar = async (ters = false) => {
    await bekleFaz('kosu');
    for (let i = 0; i < 100 && (await veri('ipucu')) === ''; i++) await ileri(50);
    let yon = Number(await veri('ipucu'));
    if (ters) yon = yon === 0 ? 1 : -yon;
    await page.keyboard.press(yon === -1 ? 'ArrowLeft' : yon === 1 ? 'ArrowRight' : 'ArrowUp');
    await bekleFaz('sonuc');
    return veri('sonuc');
  };

  await git('games/penalti-ligi/');
  beklenen(await page.isVisible('#menu'), 'Açılışta menü görünmeli');
  beklenen(await page.locator('.pl-mac:not(.kilitli)').count() === 1, 'Başta yalnızca ilk maç açık olmalı');
  beklenen(await page.isDisabled('#final-btn'), 'Kupa Finali başta kilitli olmalı');
  beklenen(await page.locator('#gorevler li').count() === 3, '3 günlük görev olmalı');
  const gorevIdler = () => page.$$eval('#gorevler li', ls => ls.map(l => l.dataset.gorev).join(','));
  const gorevler1 = await gorevIdler();

  // Kariyer maç 1: 5 köşe golü ve kurtarışlar → 3 yıldız
  await page.click('.pl-mac >> nth=0');
  beklenen(await page.isVisible('#alan') && await page.textContent('#rakip-ad') === 'Çınaraltı Gençlik', 'Maç açılmalı');
  beklenen(await page.locator('#biz-dizi .pl-top-d').count() === 5, 'Skor tablosunda 5 atış dairesi olmalı');
  const yesilTemel = Number(await veri('yesil'));

  // Duraklatma: çubuk durur, girişler yok sayılır
  await bekleFaz('nisan');
  await page.keyboard.press('p');
  const g0 = await veri('guc');
  await ileri(1000);
  beklenen(await veri('guc') === g0, 'Duraklatınca güç çubuğu durmalı');
  await page.keyboard.press('Space');
  beklenen(await veri('faz') === 'nisan', 'Duraklatmada vuruş yapılmamalı');
  await page.keyboard.press('p');

  // 1. atış dokunmayla: kalenin sağ üst köşesine dokun, sonra VUR
  await page.locator('#alan').scrollIntoViewIfNeeded();
  const b = await page.locator('#alan').boundingBox();
  const sx = b.width / 480, sy = b.height / 560;
  await page.mouse.click(b.x + (240 + 0.72 * 180) * sx, b.y + (260 - 0.75 * 150) * sy);
  await bekleBolge('yesil');
  await page.click('#vur');
  await bekleFaz('sonuc');
  beklenen(await veri('sonuc') === 'gol', 'Yeşilde köşeye vuruş gol olmalı, gelen: ' + await veri('sonuc') + ' sapma ' + await veri('sapma'));
  beklenen(Number(await veri('sapma')) <= 0.05, 'Yeşilde top hedefe gitmeli, sapma: ' + await veri('sapma'));
  beklenen(await page.textContent('#biz-skor') === '1', 'Gol skor tablosuna yazılmalı');
  let kurtaris = 0;
  const r1 = await kurtar();
  beklenen(r1 === 'kurtaris' || r1 === 'aut', 'İpucu yönüne atlamak kurtarmalı (1. ligde yanıltıcı ipucu yok), gelen: ' + r1);
  if (r1 === 'kurtaris') kurtaris++;
  for (let i = 0; i < 4; i++) {
    const r = await atis(i % 2 ? ['ArrowUp', 'ArrowLeft', 'ArrowLeft'] : ['ArrowUp', 'ArrowRight', 'ArrowRight']);
    beklenen(r === 'gol', 'Yeşilde üst köşe gol olmalı, ' + (i + 2) + '. atış: ' + r + ' sapma ' + await veri('sapma'));
    if (await kurtar() === 'kurtaris') kurtaris++;
  }
  await ileri(2000);
  beklenen(await page.isVisible('.oyun-sonu[open]'), 'Maç sonu penceresi açılmalı');
  beklenen((await page.textContent('.oyun-sonu h2')).includes('Kazandın'), 'Maç kazanılmalı');
  let k = await kayit();
  beklenen(k.maclar['1-1'] === 3, '5-0 galibiyet 3 yıldız olmalı, gelen: ' + k.maclar['1-1']);
  beklenen(k.para >= 30, 'Para kazanılmalı, gelen: ' + k.para);
  const puan = 5 * 150 + kurtaris * 150 + 300;
  beklenen(Number(await page.evaluate(() => localStorage.getItem('mo_best_penalti-ligi-1-1'))) === puan, 'Maç puanı rekor olarak kaydedilmeli (beklenen ' + puan + ')');

  // Tekrar oyna: aynı maç sıfırdan
  await page.click('.oyun-sonu [data-a="tekrar"]');
  beklenen(await page.isVisible('#alan') && await page.textContent('#biz-skor') === '0' && await page.textContent('#mac-puan') === '0', 'Tekrar oyna maçı sıfırlamalı');
  // Kırmızıda vuruş aut, yanlış yöne atlamak gol
  beklenen(await atis([], 'kirmizi') === 'aut', 'Kırmızıda vuruş auta gitmeli');
  const r2 = await kurtar(true);
  beklenen(r2 === 'gol' || r2 === 'aut', 'Ters yöne atlamak gol olmalı, gelen: ' + r2);

  // Menüde 2. maç açık; yükseltme al, yeşil bölge genişlemeli
  await git('games/penalti-ligi/');
  beklenen(await page.locator('.pl-mac:not(.kilitli)').count() === 2, '2. maç açılmalı ve ilerleme kalıcı olmalı');
  beklenen(await gorevIdler() === gorevler1, 'Günlük görevler aynı gün aynı kalmalı');
  k = await kayit();
  const para0 = k.para;
  await page.click('[data-yuk="isabet"]');
  k = await kayit();
  beklenen(k.yukseltme.isabet === 1 && k.para === para0 - 40, 'Şut İsabeti 40 paraya alınmalı');
  await page.click('.pl-mac >> nth=1');
  beklenen(Number(await veri('yesil')) > yesilTemel, 'Yükseltme yeşil bölgeyi genişletmeli');

  // Günlük görev: 'galibiyet' görevi bir adım kala; maçı kazanınca 40 para
  await page.evaluate(() => {
    const k = JSON.parse(localStorage.getItem('mo_penalti'));
    k.gorev = { tarih: '2026-10-24', liste: ['galibiyet', 'kose', 'gol'], ilerleme: { galibiyet: 1, kose: 0, gol: 0 }, tamam: [] };
    localStorage.setItem('mo_penalti', JSON.stringify(k));
  });
  await git('games/penalti-ligi/');
  await page.click('.pl-mac >> nth=1');
  for (let i = 0; i < 5; i++) {
    await atis(i % 2 ? ['ArrowUp', 'ArrowLeft', 'ArrowLeft'] : ['ArrowUp', 'ArrowRight', 'ArrowRight']);
    await kurtar();
  }
  await ileri(2000);
  beklenen((await page.textContent('.oyun-sonu h2')).includes('Kazandın'), '2. maç kazanılmalı');
  k = await kayit();
  beklenen(k.gorev.tamam.includes('galibiyet') && k.gorev.tamam.includes('kose') && k.gorev.tamam.includes('gol') === false, 'Galibiyet ve köşe görevleri tamamlanmalı');
  beklenen((await page.textContent('.oyun-sonu-metin')).includes('Görev tamam'), 'Görev ödülü maç sonunda yazmalı');
  await page.click('.oyun-sonu [data-a="kapat"]');
  beklenen(await page.locator('#gorevler li.tamam').count() === 2, 'Tamamlanan görevler menüde işaretlenmeli');

  // Ertesi gün görevler yenilenir
  await page.clock.setSystemTime(new Date('2026-10-25T10:00:00'));
  await git('games/penalti-ligi/');
  k = await kayit();
  beklenen(k.gorev.tarih === '2026-10-25' && k.gorev.tamam.length === 0, 'Ertesi gün görevler yenilenmeli');

  // Günlük mod: yükseltme uygulanmaz, aynı girişlerle iki açılışta aynı maç
  const gunluk = async () => {
    await git('games/penalti-ligi/?gunluk=2026-10-25');
    beklenen(await page.locator('#hizli .btn:visible').count() === 1 && !(await page.isVisible('#kariyer-alan')), 'Günlük modda yalnızca günlük maç olmalı');
    await page.click('[data-seviye="normal"]');
    const yesil = await veri('yesil');
    const sonuc = [];
    for (let i = 0; i < 5; i++) {
      sonuc.push(await atis(['ArrowUp'], 'sari'));
      await bekleFaz('kosu');
      await ileri(2000);
      await bekleFaz('sonuc');
      sonuc.push(await veri('sonuc'));
    }
    return { yesil, sonuc: sonuc.join(',') };
  };
  const a = await gunluk();
  const c = await gunluk();
  beklenen(Number(a.yesil) === 0.18, 'Günlük modda yükseltme uygulanmamalı, yeşil: ' + a.yesil);
  beklenen(a.sonuc === c.sonuc, 'Günlük modda iki açılışta maç aynı olmalı: ' + a.sonuc + ' / ' + c.sonuc);

  // Bozuk kayıt hata vermemeli
  await page.evaluate(() => localStorage.setItem('mo_penalti', '{bozuk'));
  await git('games/penalti-ligi/');
  beklenen(await page.locator('.pl-mac:not(.kilitli)').count() === 1, 'Bozuk kayıtta sıfırdan başlamalı');
};

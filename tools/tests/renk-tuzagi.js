// Renk Tuzağı oynanış testi: doğru cevabı DOM'dan okuyup oynama, seri bonusu, yanlış cevap cezası,
// tuzak oranı ve tekrar sınırı, duraklatma, süre bitişi ve rekor, "Tekrar oyna", klavye kısayolları,
// zor seviyenin KELİME turları, bölüm yıldızı ve kalıcı kayıt (mo_renk), desen seçeneği ve günlük mod.
// Saat sahte (page.clock), böylece 60 saniye beklemeden ileri sarılır.
module.exports = async function (page, { git, beklenen }) {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const ileri = ms => page.clock.runFor(ms);
  const sayi = sel => page.textContent(sel).then(t => Number(t.replace(/\D/g, '')));
  // Doğru cevap: KELİME turunda kelimenin anlamı, aksi halde yazının rengi
  const cevap = () => page.evaluate(() => {
    const k = document.getElementById('kelime');
    return document.getElementById('kural').textContent === 'KELİME' ? k.textContent : k.getAttribute('data-renk');
  });
  const soru = () => page.evaluate(() => { const k = document.getElementById('kelime'); return k.textContent + '/' + k.getAttribute('data-renk'); });
  const tikla = ad => page.dispatchEvent(`.rt-dugme[data-renk="${ad}"]`, 'pointerdown');
  const yanlisAd = async () => page.$$eval('.rt-dugme', (bs, c) => bs.map(b => b.getAttribute('data-renk')).find(a => a !== c), await cevap());

  await git('games/renk-tuzagi/');
  beklenen(await page.isVisible('#menu'), 'Açılışta menü görünmeli');
  beklenen(await page.locator('.rt-bolum:not(.kilitli)').count() === 1, 'Başta yalnızca 1. bölüm açık olmalı');

  // Normal: 6 beyaz yazılı düğme; tuzak oranı ve tekrar sınırı
  await page.click('[data-seviye="normal"]');
  beklenen(await page.locator('.rt-dugme').count() === 6, 'Normal seviyede 6 düğme olmalı');
  beklenen(await page.locator('.rt-dugme .nokta').count() === 0, 'Normal seviyede renkli daire olmamalı');
  let tuzak = 0, onceki = [];
  let tekrar3 = false;
  for (let i = 0; i < 100; i++) {
    const s = await page.evaluate(() => { const k = document.getElementById('kelime'); return [k.textContent, k.getAttribute('data-renk')]; });
    if (s[0] !== s[1]) tuzak++;
    onceki.push(s[1]);
    if (onceki.length >= 3 && onceki.slice(-3).every(x => x === s[1])) tekrar3 = true;
    await tikla(s[1]);
  }
  beklenen(tuzak >= 60, 'İlk 100 soruda tuzak oranı en az %60 olmalı (oran %75, rastgele dalgalanma payı), gelen: ' + tuzak);
  beklenen(!tekrar3, 'Aynı doğru renk art arda 3 kez gelmemeli');
  // 100 doğru: 5x10 + 5x15 + 90x20
  beklenen(await sayi('#puan') === 1925, 'Seri bonusu yanlış hesaplandı: ' + await sayi('#puan'));

  // Yanlış cevap: seri sıfırlanır, puan değişmez, süre 2 sn düşer
  const sure = await page.evaluate(() => Number(document.getElementById('sure').textContent));
  await tikla(await yanlisAd());
  beklenen(await page.textContent('#seri') === '🔥 x0' && await sayi('#puan') === 1925, 'Yanlış cevap seriyi sıfırlamalı, puanı değiştirmemeli');
  beklenen(await page.evaluate(() => Number(document.getElementById('sure').textContent)) <= sure - 2, 'Yanlış cevap süreden 2 sn düşmeli');

  // Klavye: rakam ve baş harf kısayolları
  let c = await cevap();
  let idx = await page.$$eval('.rt-dugme', (bs, c) => bs.findIndex(b => b.getAttribute('data-renk') === c), c);
  await page.keyboard.press(String(idx + 1));
  beklenen(await page.textContent('#seri') === '🔥 x1', 'Rakam tuşu doğru düğmeyi seçmeli');
  for (let i = 0; i < 10; i++) {
    c = await cevap();
    if (c === 'MOR') { await tikla(c); continue; }
    await page.keyboard.press({ KIRMIZI: 'k', MAVİ: 'm', YEŞİL: 'y', SARI: 's', TURUNCU: 't' }[c]);
  }
  beklenen(await page.textContent('#seri') === '🔥 x11', 'Harf kısayolları doğru rengi seçmeli');

  // Duraklatma: süre durur, kelime gizlenir, girişler yok sayılır
  await page.keyboard.press('p');
  const durakSure = await page.textContent('#sure');
  await ileri(5000);
  beklenen(await page.textContent('#sure') === durakSure, 'Duraklatınca süre durmalı');
  beklenen(await page.evaluate(() => getComputedStyle(document.getElementById('kelime')).visibility) === 'hidden', 'Duraklatınca kelime gizlenmeli');
  const p0 = await sayi('#puan');
  await tikla(await cevap());
  beklenen(await sayi('#puan') === p0, 'Duraklatmada giriş yok sayılmalı');
  await page.keyboard.press('p');

  // Süre bitince oyun sonu: puan, doğru/yanlış, isabet, ortalama ms; rekor
  await ileri(61000);
  await ileri(1000);
  beklenen(await page.isVisible('.oyun-sonu[open]'), 'Süre bitince oyun sonu penceresi açılmalı');
  const metin = await page.textContent('.oyun-sonu-metin');
  beklenen(/puan/.test(metin) && /doğru/.test(metin) && /isabet %\d+/.test(metin) && /ms/.test(metin), 'Sonuç metni eksik: ' + metin);
  beklenen(Number(await page.evaluate(() => localStorage.getItem('mo_best_renk-tuzagi-normal'))) === p0, 'Normal rekoru kaydedilmeli');
  beklenen(await page.isVisible('.oyun-sonu-rekor'), 'İlk oyun rekor olmalı');
  await page.click('.oyun-sonu [data-a="tekrar"]');
  beklenen(await sayi('#puan') === 0 && await page.textContent('#sure') === '60' && await page.isVisible('#oyun'), 'Tekrar oyna sıfırlamalı');
  beklenen(await sayi('#rekor') === p0, 'Rekor göstergesi güncel olmalı');

  // Zor: tuzaklı düğmeler, KELİME turları
  await ileri(62000);
  await ileri(1000);
  await page.click('.oyun-sonu [data-a="kapat"]');
  beklenen(await page.isVisible('#menu'), 'Oyun bitince menü görünmeli');
  await page.click('[data-seviye="zor"]');
  const tuzakli = await page.$$eval('.rt-dugme', bs => bs.every(b => b.style.color && b.style.color !== ''));
  beklenen(tuzakli, 'Zor seviyede düğme yazıları renkli (tuzaklı) olmalı');
  let kelimeTur = 0;
  for (let i = 0; i < 40; i++) {
    if (await page.textContent('#kural') === 'KELİME') kelimeTur++;
    await tikla(await cevap());
  }
  beklenen(kelimeTur > 0, 'Zor seviyede KELİME turları olmalı');
  beklenen(await page.textContent('#seri') === '🔥 x40', 'Zor seviyede DOM\'dan okunan cevaplar doğru olmalı');
  await ileri(62000);
  await ileri(1000);
  await page.click('.oyun-sonu [data-a="kapat"]');

  // Bölüm 1: 4 renkli düğme, hedefi geç, yıldız ve 2. bölüm açılır
  await page.click('.rt-bolum >> nth=0');
  beklenen(await page.locator('.rt-dugme').count() === 4 && await page.locator('.rt-dugme .nokta').count() === 4, 'Bölüm 1 renkli 4 düğmeyle oynanmalı');
  beklenen(await page.textContent('#sure') === '45', 'Bölüm 1 45 saniye olmalı');
  for (let i = 0; i < 30; i++) await tikla(await cevap());
  await ileri(46000);
  await ileri(1000);
  beklenen((await page.textContent('.oyun-sonu h2')).includes('Bölüm 1 geçildi'), 'Bölüm 1 geçilmeli');
  const kayit = await page.evaluate(() => JSON.parse(localStorage.getItem('mo_renk')));
  beklenen(kayit.yildiz[1] === 3, '30 doğru (525 puan) bölüm 1\'de 3 yıldız olmalı');
  beklenen(Number(await page.evaluate(() => localStorage.getItem('mo_best_renk-tuzagi-b1'))) === 525, 'Bölüm rekoru kaydedilmeli');
  await page.click('.oyun-sonu [data-a="kapat"]');
  beklenen(await page.locator('.rt-bolum:not(.kilitli)').count() === 2, '2. bölüm açılmalı');

  // Desen seçeneği ve kalıcılık
  await page.check('#desen');
  await git('games/renk-tuzagi/');
  beklenen(await page.isChecked('#desen'), 'Desen tercihi saklanmalı');
  beklenen(await page.locator('.rt-bolum:not(.kilitli)').count() === 2, 'Bölüm ilerlemesi kalıcı olmalı');
  await page.click('[data-seviye="kolay"]');
  beklenen(/[●■▲◆]/.test(await page.textContent('#sekil')) && /[●■▲◆]/.test(await page.textContent('.rt-dugme')), 'Desen açıkken şekiller görünmeli');

  // Bozuk kayıt hata vermemeli
  await page.evaluate(() => localStorage.setItem('mo_renk', '{bozuk'));
  await git('games/renk-tuzagi/');
  beklenen(await page.locator('.rt-bolum:not(.kilitli)').count() === 1, 'Bozuk kayıtta sıfırdan başlamalı');

  // Günlük mod: iki açılışta ilk 10 soru aynı
  const ilk10 = async () => {
    await git('games/renk-tuzagi/?gunluk=2026-10-24');
    beklenen(await page.locator('#hizli .btn:visible').count() === 1, 'Günlük modda yalnızca Normal tur olmalı');
    await page.click('[data-seviye="normal"]');
    const list = [];
    for (let i = 0; i < 10; i++) { list.push(await soru()); await tikla(await cevap()); }
    return list.join(',');
  };
  const a = await ilk10();
  const b = await ilk10();
  beklenen(a === b, 'Günlük modda iki açılışta sorular aynı olmalı');
};

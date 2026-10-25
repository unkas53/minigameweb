// Lokanta Telaşı oynanış testi: bozuk kayıt, gün haritası ve kilitler, sekmeler, ızgara aşamaları (çiğ/pişmiş/yanık,
// yanığı çöpe atma), yanlış servis (sabır düşer, kombo sıfırlanır), duraklatma, 1. günü siparişi okuyan bir "bot" ile
// (klavye ve dokunma) bitirip yıldız/para/rekor kaydı, "Tekrar oyna", kızgın müşterilerle gün kaybı (skorsuz),
// yükseltme satın alma ve etkisi, tabela adı ve süsleme kaydı, günlük modda aynı müşteri sırası ve yükseltmesiz oyun.
// Saat sahte (page.clock), böylece oyun beklemeden ileri sarılır.
module.exports = async function (page, { git, beklenen }) {
  await page.clock.install({ time: new Date('2026-10-24T10:00:00') });
  const ileri = ms => page.clock.runFor(ms);
  const veri = ad => page.getAttribute('#alan', 'data-' + ad);
  const kayit = () => page.evaluate(() => JSON.parse(localStorage.getItem('mo_lokanta')));
  const yaz = s => page.evaluate(v => localStorage.setItem('mo_lokanta', JSON.stringify(v)), s);
  const tabak = () => page.getAttribute('.lt-tabak.aktif', 'data-icerik');
  const sabir = i => page.evaluate(i => parseFloat(document.querySelector('[data-yer="' + i + '"] .lt-sabir i').style.width), i);

  // Bozuk kayıt oyunu sıfırdan başlatmalı
  await git('games/lokanta-telasi/');
  await page.evaluate(() => localStorage.setItem('mo_lokanta', '{bozuk'));
  await git('games/lokanta-telasi/');
  beklenen(await veri('durum') === 'menu', 'Açılışta menü görünmeli');
  beklenen(await page.locator('[data-gun-sec]').count() === 40, '40 gün olmalı');
  beklenen(await page.locator('[data-gun-sec]:not([disabled])').count() === 1, 'Başta yalnızca 1. gün açık olmalı');
  beklenen(await page.locator('.lt-semt').count() === 4, '4 semt olmalı');
  await page.click('[data-sekme="yukselt"]');
  beklenen(await page.locator('[data-yuk]').count() === 7, '7 yükseltme olmalı');
  beklenen(await page.locator('[data-yuk]:not([disabled])').count() === 0, 'Para yokken yükseltmeler pasif olmalı');
  await page.click('[data-sekme="gorev"]');
  beklenen(await page.locator('.lt-gorev').count() === 3, '3 günlük görev olmalı');
  await page.click('[data-sekme="harita"]');

  // 1. gün: ızgara, tarif kontrolü, duraklatma
  await page.click('[data-gun-sec="1"]');
  beklenen(await veri('durum') === 'oyun', 'Gün başlamalı');
  beklenen(await page.locator('[data-malz]').count() === 5, '1. günde rafta 5 malzeme olmalı (dürüm + ayran)');
  beklenen(await page.locator('[data-izgara]').count() === 2 && await page.locator('[data-yer]').count() === 3, 'Başta 2 ızgara ve 3 müşteri yeri olmalı');
  await ileri(1200);
  beklenen(await page.locator('[data-musteri]').count() === 1, 'İlk müşteri gelmeli');
  await page.keyboard.press('2'); // et ızgaraya
  beklenen(await page.getAttribute('[data-izgara="0"]', 'data-durum') === 'cig', 'Et ızgaraya çiğ konmalı');
  await page.keyboard.press('q');
  beklenen(!(await tabak()), 'Çiğ et tabağa alınmamalı');
  await ileri(5200);
  beklenen(await page.getAttribute('[data-izgara="0"]', 'data-durum') === 'pismis', 'Et 5 sn sonra pişmeli');
  await page.keyboard.press('2'); // ikinci et
  await ileri(4200);
  beklenen(await page.getAttribute('[data-izgara="0"]', 'data-durum') === 'yanik', 'Bekletilen et yanmalı');
  await page.keyboard.press('q');
  beklenen(!(await tabak()), 'Yanık et tabağa alınmamalı');
  beklenen(await page.getAttribute('[data-izgara="0"]', 'data-durum') === 'bos', 'Yanık et ızgaraya dokununca çöpe gitmeli');
  // Yanlış tabak: yalnız lavaş
  await page.click('[data-malz="lavas"]');
  beklenen(await tabak() === 'lavas', 'Lavaş tabağa eklenmeli');
  const s0 = await sabir(0);
  await page.keyboard.press('a');
  beklenen(await sabir(0) < s0 - 10, 'Yanlış servis sabrı düşürmeli');
  beklenen(await tabak() === 'lavas', 'Yanlış tabak geri gelmeli');
  await page.keyboard.press('x');
  beklenen(!(await tabak()), 'X tabağı boşaltmalı');
  // Duraklatma zamanlayıcıları durdurur, girişler yok sayılır
  await page.click('.oyun-btn[aria-label="Duraklat"]');
  const z = await veri('zaman'), sp = await sabir(0);
  await ileri(2000);
  await page.keyboard.press('1');
  beklenen(await veri('zaman') === z && await sabir(0) === sp, 'Duraklatınca sabır ve süre durmalı');
  beklenen(!(await tabak()), 'Duraklatılmışken girişler yok sayılmalı');
  await page.click('.oyun-duraklat .btn');

  // Bot: sabrı en az kalan müşterinin siparişini okuyup hazırlar (ızgara ve servis klavyeyle, raf dokunarak)
  const adim = () => page.evaluate(() => {
    const izg = [...document.querySelectorAll('[data-izgara]')];
    const tus = i => 'QWER'[i];
    const yanik = izg.findIndex(b => b.dataset.durum === 'yanik');
    if (yanik !== -1) return { k: tus(yanik) };
    const ms = [...document.querySelectorAll('[data-musteri]')].filter(e => e.dataset.tarif)
      .sort((a, b) => parseFloat(a.querySelector('.lt-sabir i').style.width) - parseFloat(b.querySelector('.lt-sabir i').style.width));
    if (!ms.length) return null;
    const m = ms[0], kalan = m.dataset.tarif.split(',');
    const t = document.querySelector('.lt-tabak.aktif').dataset.icerik;
    for (const x of t ? t.split(',') : []) {
      const i = kalan.indexOf(x);
      if (i === -1) return { k: 'x' };
      kalan.splice(i, 1);
    }
    if (!kalan.length) return { k: 'ASDF'[Number(m.dataset.musteri)] };
    kalan.sort((a, b) => (b === 'et' || b === 'sis') - (a === 'et' || a === 'sis'));
    for (const x of kalan) {
      if (x === 'et' || x === 'sis') {
        const p = izg.findIndex(b => b.dataset.tur === x && b.dataset.durum === 'pismis');
        if (p !== -1) return { k: tus(p) };
        if (izg.some(b => b.dataset.tur === x && b.dataset.durum === 'cig')) continue;
        return { s: '[data-malz="' + x + '"]' };
      }
      if (x === 'corba') { if (document.querySelector('[data-kazan="bos"]')) return { s: '[data-kazan="bos"]' }; continue; }
      if (x === 'cay' && document.querySelector('[data-cay="demleniyor"]')) continue;
      return { s: '[data-malz="' + x + '"]' };
    }
    return null;
  });
  const oyna = async (sinir) => {
    for (let i = 0; i < sinir && !(await page.$('.oyun-sonu[open]')); i++) {
      if (await veri('durum') === 'oyun') {
        const a = await adim();
        if (a && a.k) await page.keyboard.press(a.k);
        else if (a && a.s) await page.click(a.s);
      }
      await ileri(150);
    }
  };
  await oyna(1500);
  const baslik = await page.textContent('.oyun-sonu h2');
  beklenen(/1\. gün bitti: \d+ 💰/.test(baslik), '1. gün kazanılmalı, gelen: ' + baslik);
  let k = await kayit();
  beklenen(k.gunler['1'] && k.gunler['1'].yildiz >= 1, '1. günün yıldızı kaydedilmeli');
  beklenen(k.para > 0 && k.gunler['1'].enIyiKazanc === k.para, 'Kazanç kasaya eklenmeli, para: ' + k.para);
  beklenen(Number(await page.evaluate(() => localStorage.getItem('mo_best_lokanta-telasi'))) === k.para, 'Gün rekoru kaydedilmeli');
  beklenen(await page.locator('[data-gun-sec]:not([disabled])').count() === 2, '1. gün bitince 2. gün açılmalı');

  // Tekrar oyna aynı günü sıfırdan başlatır
  await page.click('.oyun-sonu [data-a="tekrar"]');
  beklenen(await veri('durum') === 'oyun' && await veri('kazanc') === '0' && await veri('kalp') === '3' && await veri('gun') === '1', 'Tekrar oyna günü sıfırlamalı');
  // Hiç servis etmeyince müşteriler kızgın gider, 3 kalp bitince gün kaybedilir
  for (let i = 0; i < 90 && !(await page.$('.oyun-sonu[open]')); i++) await ileri(1000);
  beklenen(await page.textContent('.oyun-sonu h2') === 'Gün kaybedildi', 'Kalpler bitince gün kaybedilmeli');
  beklenen((await kayit()).para === k.para, 'Kaybedilen gün para vermemeli');
  await page.click('.oyun-sonu [data-a="kapat"]');

  // Yükseltme satın alma ve etkisi
  k = await kayit();
  k.para = 1000;
  await yaz(k);
  await git('games/lokanta-telasi/');
  await page.click('[data-sekme="yukselt"]');
  await page.click('[data-yuk="izgara"]');
  await page.click('[data-yuk="izgara"]');
  await page.click('[data-yuk="tabak"]');
  k = await kayit();
  beklenen(k.yukseltme.izgara === 2 && k.yukseltme.tabak === 1 && k.para === 1000 - 45 - 120 - 225, 'Yükseltmeler parayla alınmalı, para: ' + k.para);
  await page.click('[data-sekme="harita"]');
  await page.click('[data-gun-sec="1"]');
  beklenen(await page.locator('[data-izgara]').count() === 3, 'Izgara yükseltmesi yer sayısını artırmalı');
  beklenen(await page.locator('[data-tabak]').count() === 2, 'İkinci tabak yükseltmesi çalışmalı');
  await page.keyboard.press('1');
  await page.keyboard.press('Tab');
  await page.keyboard.press('4');
  beklenen(await page.getAttribute('[data-tabak="0"]', 'data-icerik') === 'lavas' && await page.getAttribute('[data-tabak="1"]', 'data-icerik') === 'sogan', 'Tab ikinci tabağa geçmeli');

  // Tabela ve süsleme kalıcı; tabela metin olarak basılır
  await git('games/lokanta-telasi/');
  await page.click('[data-sekme="lokanta"]');
  await page.fill('#tabela-gir', 'Ali<b>Usta</b>Lokantası');
  await page.click('[data-tabela-kaydet]');
  k = await kayit();
  beklenen(k.tabela === 'Ali<b>Usta</b>Lo', 'Tabela 16 karakterle sınırlı kaydedilmeli: ' + k.tabela);
  k.susleme.acik.push('nane'); k.susleme.secili = 'nane';
  await yaz(k);
  await git('games/lokanta-telasi/');
  await page.click('[data-gun-sec="1"]');
  beklenen((await page.textContent('#tabela')).includes('Ali<b>Usta</b>Lo'), 'Tabela metin olarak görünmeli');
  beklenen(await veri('tema') === 'nane', 'Seçili süsleme uygulanmalı');

  // Günlük mod: iki açılışta aynı müşteri sırası, yükseltmeler kullanılmaz
  const sira = async () => {
    await git('games/lokanta-telasi/?gunluk=2026-10-24');
    await page.click('[data-gunluk]');
    await ileri(15000);
    return page.evaluate(() => [...document.querySelectorAll('[data-musteri]')].map(e => e.getAttribute('aria-label')).join('|'));
  };
  const s1 = await sira();
  beklenen(await page.locator('[data-izgara]').count() === 2 && await page.locator('[data-tabak]').count() === 1, 'Günlük modda yükseltmeler kullanılmamalı');
  beklenen(await page.locator('[data-malz]').count() === 13, 'Günlük modda tüm menü açık olmalı');
  beklenen(s1 && s1 === await sira(), 'Günlük modda iki açılışta aynı müşteriler gelmeli');
};

// Lokanta Telaşı oynanış testi: bozuk kayıt, gün haritası ve kilitler, sekmeler, tarif kontrolü (eksik tabak
// reddedilir, sabır düşer), ızgaranın çiğ/pişmiş/yanık aşamaları ve çöpe atma, duraklatma, kızgın müşteriyle
// kalp kaybı ve skorsuz gün kaybı, 1. günü bir "bot" ile (siparişi okuyup malzemeye basan, pişen eti alan)
// bitirip yıldız/para/rekor kaydı, "Tekrar oyna", yükseltme satın alma ve etkisi, tabela adı ve günlük modda
// aynı müşteri sırası (yükseltmesiz). Saat sahte (page.clock), böylece gün beklemeden ileri sarılır.
const TARIF = {
  durum: ['lavas', 'et', 'domates', 'sogan'], ayran: ['ayran'], sis: ['sis'], corba: ['corba', 'limon'],
  cay: ['cay'], salata: ['domates', 'salatalik', 'sogan'], sutlac: ['sutlac', 'tarcin']
};

module.exports = async function (page, { git, beklenen }) {
  await page.clock.install({ time: new Date('2026-10-24T10:00:00') });
  const ileri = ms => page.clock.runFor(ms);
  const veri = ad => page.getAttribute('#lt-oyun', 'data-' + ad);
  const kayit = () => page.evaluate(() => JSON.parse(localStorage.getItem('mo_lokanta')));
  const yaz = s => page.evaluate(v => localStorage.setItem('mo_lokanta', JSON.stringify(v)), s);
  const durum = () => page.evaluate(() => ({
    musteri: [...document.querySelectorAll('.lt-musteri')].map(e => e.dataset.siparis ? e.dataset.siparis.split(',') : []),
    izgara: [...document.querySelectorAll('.lt-izgara')].map(e => ({ d: e.dataset.durum, tur: e.dataset.tur })),
    tabak: (document.querySelector('.lt-tabak.aktif').dataset.icerik || '').split(',').filter(Boolean),
    demlik: (document.getElementById('lt-demlik') || {}).dataset ? document.getElementById('lt-demlik').dataset.durum : 'bos'
  }));

  // Bot: her adımda tek hamle yapar (yanığı at, gereksizi boşalt, eksik malzemeyi ekle, hazır tabağı servis et)
  async function botAdim() {
    const s = await durum();
    const yanik = s.izgara.findIndex(g => g.d === 'yanik');
    if (yanik !== -1) return page.click(`[data-izgara="${yanik}"]`);
    const yer = s.musteri.findIndex(m => m.length);
    if (yer === -1) return;
    const tarif = TARIF[s.musteri[yer][0]], kalan = tarif.slice();
    for (const m of s.tabak) {
      const i = kalan.indexOf(m);
      if (i === -1) return page.click('[data-cop]');
      kalan.splice(i, 1);
    }
    if (!kalan.length) return page.click(`[data-yer="${yer}"]`);
    // Önce ızgara malzemesi (pişmesi uzun sürer)
    const sira = kalan.slice().sort((a, b) => (b === 'et' || b === 'sis') - (a === 'et' || a === 'sis'));
    for (const m of sira) {
      if (m === 'et' || m === 'sis') {
        const pis = s.izgara.findIndex(g => g.d === 'pismis' && g.tur === m);
        if (pis !== -1) return page.click(`[data-izgara="${pis}"]`);
        if (!s.izgara.some(g => g.d === 'cig' && g.tur === m)) return page.click(`[data-malz="${m}"]`);
        continue;
      }
      if (m === 'cay' && s.demlik === 'demleniyor') continue;
      return page.click(`[data-malz="${m}"]`);
    }
  }
  async function botOyna(sinir) {
    for (let i = 0; i < sinir && !(await page.$('.oyun-sonu[open]')); i++) {
      if (await veri('durum') === 'oyun') await botAdim();
      await ileri(250);
    }
  }

  // Bozuk kayıt oyunu sıfırdan başlatmalı
  await git('games/lokanta-telasi/');
  await page.evaluate(() => localStorage.setItem('mo_lokanta', '{bozuk'));
  await git('games/lokanta-telasi/');
  beklenen(await page.locator('.lt-gun').count() === 40, '40 gün olmalı');
  beklenen(await page.locator('.lt-gun:not([disabled])').count() === 1, 'Başta yalnızca 1. gün açık olmalı');
  beklenen(await page.locator('.lt-semt').count() === 4, '4 semt olmalı');
  beklenen(await page.isDisabled('[data-serbest]'), 'Serbest vardiya başta kilitli olmalı');
  await page.click('[data-sekme="yukselt"]');
  beklenen(await page.locator('[data-yuk]').count() === 7, '7 yükseltme olmalı');
  beklenen(await page.locator('[data-yuk]:not([disabled])').count() === 0, 'Para yokken yükseltmeler pasif olmalı');
  await page.click('[data-sekme="gorev"]');
  beklenen(await page.locator('.lt-gorev').count() === 3, '3 günlük görev olmalı');
  await page.click('[data-sekme="lokanta"]');
  beklenen(await page.locator('[data-tema]:not([disabled])').count() >= 1, 'Sade tema açık olmalı');
  await page.fill('#lt-tabela-ad', '<b>Mami Usta</b> Kebapçısı');
  await page.press('#lt-tabela-ad', 'Enter');
  await page.click('[data-sekme="gunler"]');
  let k = await kayit();
  beklenen(k.tabela === '<b>Mami Usta</b>'.slice(0, 16), 'Tabela adı 16 karakterle kaydedilmeli, gelen: ' + k.tabela);

  // 1. gün: tarif kontrolü, ızgara aşamaları, duraklatma
  await page.click('[data-gun="1"]');
  beklenen(await veri('durum') === 'oyun', 'Gün başlamalı');
  beklenen(await page.locator('.lt-musteri').count() === 3 && await page.locator('.lt-izgara').count() === 2, 'Başta 3 müşteri ve 2 ızgara yeri olmalı');
  beklenen((await page.textContent('#lt-tabela')) === k.tabela && !(await page.$('#lt-tabela b')), 'Tabela metin olarak basılmalı');
  await ileri(2000);
  let s = await durum();
  beklenen(s.musteri[0].length > 0, 'İlk müşteri gelmeli');
  await page.click('[data-malz="lavas"]');
  const once = await page.getAttribute('[data-yer="0"] .lt-sabir i', 'style');
  await page.keyboard.press('a');
  beklenen((await page.textContent('#lt-ipucu')).includes('Bu değil'), 'Eksik tabak reddedilmeli');
  beklenen((await durum()).tabak.join() === 'lavas', 'Reddedilen tabak geri gelmeli');
  const sonra = await page.getAttribute('[data-yer="0"] .lt-sabir i', 'style');
  beklenen(parseInt(/width: (\d+)/.exec(sonra)[1]) < parseInt(/width: (\d+)/.exec(once)[1]) - 10, 'Yanlış serviste sabır düşmeli');
  await page.keyboard.press('x');
  beklenen((await durum()).tabak.length === 0, 'X tabağı boşaltmalı');
  await page.keyboard.press('2');
  s = await durum();
  beklenen(s.izgara[0].d === 'cig' && s.izgara[0].tur === 'et', 'Et ızgaraya çiğ konmalı (klavye 2)');
  await page.click('[data-izgara="0"]');
  beklenen((await durum()).izgara[0].d === 'cig', 'Çiğ et tabağa alınamamalı');
  await page.click('.oyun-btn[aria-label="Duraklat"]');
  const t1 = await veri('t');
  await ileri(3000);
  beklenen(await veri('t') === t1 && (await durum()).izgara[0].d === 'cig', 'Duraklatınca süre ve pişme durmalı');
  await page.keyboard.press('1');
  beklenen((await durum()).tabak.length === 0, 'Duraklatılmışken girişler yok sayılmalı');
  await page.click('.oyun-duraklat .btn');
  await ileri(5200);
  beklenen((await durum()).izgara[0].d === 'pismis', 'Et 5 sn sonra pişmeli');
  await ileri(4200);
  beklenen((await durum()).izgara[0].d === 'yanik', 'Pişmiş et 4 sn sonra yanmalı');
  await page.keyboard.press('q');
  s = await durum();
  beklenen(s.izgara[0].d === 'bos' && s.tabak.length === 0, 'Yanık et çöpe gitmeli, tabağa girmemeli');

  // Hiç servis etmeyince müşteriler kızgın gider, 3 kalp bitince gün kaybedilir (skorsuz)
  for (let i = 0; i < 160 && !(await page.$('.oyun-sonu[open]')); i++) await ileri(1000);
  beklenen(await veri('kalp') === '0', 'Üç kızgın müşteriyle kalpler bitmeli');
  beklenen((await page.textContent('.oyun-sonu h2')).includes('Lokanta kapandı'), 'Kayıp penceresi açılmalı');
  beklenen(!(await page.evaluate(() => localStorage.getItem('mo_best_lokanta-telasi-1'))), 'Kaybedilen gün rekor yazmamalı');

  // Tekrar oyna: gün sıfırdan başlar, bot günü bitirir
  await page.click('.oyun-sonu [data-a="tekrar"]');
  await ileri(50);
  beklenen(await veri('durum') === 'oyun' && await veri('kalp') === '3' && await veri('kazanc') === '0', 'Tekrar oyna günü sıfırlamalı');
  await botOyna(800);
  const baslik = await page.textContent('.oyun-sonu h2');
  beklenen(/Gün 1 bitti/.test(baslik), 'Bot 1. günü bitirmeli, gelen: ' + baslik);
  k = await kayit();
  beklenen(k.gunler[1] && k.gunler[1].yildiz >= 1 && k.gunler[1].enIyiKazanc > 0, '1. gün yıldızı ve kazancı kaydedilmeli');
  beklenen(k.para > 0, 'Para kaydedilmeli');
  beklenen(Number(await page.evaluate(() => localStorage.getItem('mo_best_lokanta-telasi-1'))) === k.gunler[1].enIyiKazanc, 'Gün rekoru kaydedilmeli');
  await page.click('.oyun-sonu [data-a="kapat"]');
  beklenen(await page.locator('.lt-gun:not([disabled])').count() === 2, '1. gün bitince 2. gün açılmalı');

  // Yükseltme: ızgara yeri 2→3, tezgâh 3→4, çay ocağı demleme 4→3 sn (kalıcı)
  k.para = 5000;
  await yaz(k);
  await git('games/lokanta-telasi/');
  await page.click('[data-sekme="yukselt"]');
  await page.click('[data-yuk="izgara"]');
  await page.click('[data-yuk="tezgah"]');
  await page.click('[data-yuk="cay"]');
  k = await kayit();
  beklenen(k.yukseltme.izgara === 1 && k.yukseltme.tezgah === 1 && k.yukseltme.cay === 1 && k.para === 5000 - 120 - 900 - 160, 'Yükseltmeler parayla alınmalı, para: ' + k.para);
  await git('games/lokanta-telasi/');
  await page.click('[data-gun="2"]');
  beklenen(await page.locator('.lt-izgara').count() === 3 && await page.locator('.lt-musteri').count() === 4, 'Yükseltmeler oyunda görülmeli');
  beklenen(await veri('demleme') === '3', 'Çay ocağı demleme süresini kısaltmalı');

  // Günlük mod: iki açılışta aynı müşteri sırası, yükseltmeler etkisiz
  await git('games/lokanta-telasi/?gunluk=2026-10-24');
  await page.click('[data-gunluk-basla]');
  const sira = await veri('sira');
  beklenen(sira && sira.split(',').length === 20, 'Günlük modda 20 müşteri olmalı');
  beklenen(await page.locator('.lt-izgara').count() === 2 && await page.locator('.lt-musteri').count() === 3 && await veri('demleme') === '4', 'Günlük modda yükseltmeler kullanılmamalı');
  await git('games/lokanta-telasi/?gunluk=2026-10-24');
  await page.click('[data-gunluk-basla]');
  beklenen((await veri('sira')) === sira, 'Günlük modda iki açılışta aynı müşteri sırası gelmeli');
};

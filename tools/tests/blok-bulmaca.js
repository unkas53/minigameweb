// Blok Bulmaca oynanış testi: motor kuralları (hat temizleme, çarpan, seri, elmas, iki kez kırılan kilit), 45 bölümün
// başlangıç ızgaraları, bozuk kayıt, harita ve kilitler, dokun-yerleştir ve fareyle sürükle-bırak, 1. bölümü bot
// hamleleriyle kazanıp yıldız/rekor kaydı (mo_blok), "Tekrar oyna", klavye kontrolü, Yenile ve Sil hakları,
// klasik modun bitişi ve rekoru, dünya kilidi (30 yıldız), yıldızla açılan tema, elmaslı ve kilitli bölümler,
// günlük modda aynı ızgara ve parçalar, 360 px taşma.
module.exports = async function (page, { git, beklenen }) {
  await page.clock.install({ time: new Date('2026-10-24T10:00:00') });
  const ileri = ms => page.clock.runFor(ms);
  const URL = 'games/blok-bulmaca/';
  const kayit = () => page.evaluate(() => JSON.parse(localStorage.getItem('mo_blok')));
  const yazKayit = s => page.evaluate(s => localStorage.setItem('mo_blok', JSON.stringify(s)), s);
  const sayi = async sel => Number(await page.getAttribute(sel, sel === '#puan' ? 'data-puan' : 'data-hamle'));
  const sonuAcik = async () => { await ileri(700); return !!(await page.$('.oyun-sonu[open]')); };
  const tohumla = t => page.evaluate(t => { Math.random = MiniOyun.gunluk.rastgele(t); }, t);
  const izgara = () => page.$$eval('.bb-h', h => h.map(x => (x.classList.contains('d') ? 'd' : '.') + (x.classList.contains('elmas') ? 'e' : '') + (x.classList.contains('k2') ? 'k' : '')).join(''));
  const parcalar = () => page.$$eval('.bb-yuva', y => y.map(x => x.dataset.s || '-').join(','));
  // Ekrandaki ızgara ve parçalardan motorun botuyla bir hamle seçer (en iyi ya da ilk sığan konum)
  const hamleSec = kotu => page.evaluate(kotu => {
    const M = window.BlokBulmacaMotor, iz = M.bosIzgara();
    document.querySelectorAll('.bb-h').forEach((x, i) => {
      iz.h[i] = x.classList.contains('d') ? 1 : 0;
      iz.e[i] = x.classList.contains('elmas') ? 1 : 0;
      iz.k[i] = x.classList.contains('k2') ? 2 : x.classList.contains('k1') ? 1 : 0;
    });
    const p = [...document.querySelectorAll('.bb-yuva')].map(x => x.dataset.s ? { s: Number(x.dataset.s), r: 1 } : null);
    if (kotu) {
      for (let i = 0; i < 3; i++) if (p[i]) for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (M.sigar(iz, p[i].s, r, c)) return { i, r, c };
      return null;
    }
    return M.enIyi(iz, p, 0);
  }, !!kotu);
  const koy = async h => { await page.click(`.bb-yuva[data-i="${h.i}"]`); await page.click(`.bb-h[data-i="${h.r * 8 + h.c}"]`); };

  // Bozuk kayıt oyunu sıfırdan başlatmalı
  await git(URL);
  await page.evaluate(() => localStorage.setItem('mo_blok', '{bozuk'));
  await git(URL);

  // Motor kuralları
  const kural = await page.evaluate(() => {
    const M = window.BlokBulmacaMotor, h = [];
    let iz = M.bosIzgara();
    for (let c = 0; c < 7; c++) iz.h[c] = 1;
    iz.e[3] = 1;
    let s = M.yerlestir(iz, { s: 0, r: 2 }, 0, 7, 0);
    if (s.hat !== 1 || s.puan !== 11 || s.elmas !== 1 || iz.h.some(Boolean)) h.push('tek hat: ' + JSON.stringify(s));
    // Satır + sütun aynı anda: 2 hat x2 çarpan, seri bonusu
    iz = M.bosIzgara();
    for (let i = 0; i < 8; i++) { if (i) iz.h[i] = 1; if (i) iz.h[i * 8] = 1; }
    s = M.yerlestir(iz, { s: 0, r: 2 }, 0, 0, 1);
    if (s.hat !== 2 || s.seri !== 2 || s.puan !== 1 + 40 + 10) h.push('çift hat/seri: ' + JSON.stringify(s));
    // Kilit iki kez temizlenmeli
    iz = M.bosIzgara();
    for (let c = 0; c < 7; c++) iz.h[c] = 1;
    iz.k[2] = 2;
    s = M.yerlestir(iz, { s: 0, r: 2 }, 0, 7, 0);
    if (s.kilit !== 0 || s.kirik.length !== 1 || !iz.h[2] || iz.k[2] !== 1) h.push('kilit 1: ' + JSON.stringify(s));
    for (let c = 0; c < 8; c++) if (c !== 2 && c !== 7) iz.h[c] = 1;
    s = M.yerlestir(iz, { s: 0, r: 2 }, 0, 7, 0);
    if (s.kilit !== 1 || iz.h[2] || iz.k[2]) h.push('kilit 2: ' + JSON.stringify(s));
    if (M.sigar(iz, 30, 6, 0) || !M.sigar(iz, 30, 5, 5)) h.push('sığma sınırı');
    // 45 bölüm: başta dolu hat yok, elmas/kilit sayısı doğru, aynı tohum aynı ızgara
    for (let no = 1; no <= 45; no++) {
      const L = M.ayar(no), a = M.bolumIzgara(no), b = M.bolumIzgara(no);
      if (!L.hamle || L.y3 <= L.y2) h.push(no + ': hamle/yıldız');
      if (a.e.filter(Boolean).length !== L.elmas || a.k.filter(Boolean).length !== L.kilit) h.push(no + ': elmas/kilit sayısı');
      if (JSON.stringify(a) !== JSON.stringify(b)) h.push(no + ': aynı tohum farklı ızgara');
      for (let t = 0; t < 16; t++) if (M.hatHucreleri(t).every(x => a.h[x])) h.push(no + ': başta dolu hat');
      if (a.h.some((x, i) => (a.e[i] || a.k[i]) && !x)) h.push(no + ': boş özel hücre');
    }
    return h;
  });
  beklenen(kural.length === 0, 'Motor kuralları hatalı: ' + kural.slice(0, 4).join('; '));

  // Harita ve kilitler
  beklenen(await page.isVisible('#harita'), 'Açılışta harita görünmeli');
  beklenen(await page.locator('.bb-dunya').count() === 3 && await page.locator('.bb-dunya.kilitli').count() === 2, '3 dünya olmalı, başta yalnızca Bahçe açık');
  beklenen(await page.locator('.bb-bolum').count() === 15 && await page.locator('.bb-bolum:not(.kilitli)').count() === 1, 'Dünyada 15 bölüm, başta yalnızca 1. bölüm açık olmalı');
  beklenen(!(await page.isDisabled('[data-tema="klasik"]')) && await page.isDisabled('[data-tema="seker"]'), 'Klasik tema açık, Şeker kilitli olmalı');
  beklenen(await page.locator('.bb-rozet').count() === 4 && await page.locator('.bb-rozet.var').count() === 0, '4 puan rozeti kilitli görünmeli');

  // 1. bölüm: dokun-yerleştir, fareyle sürükle-bırak, önizleme
  await page.click('[data-bolum="1"]');
  await tohumla('blok-test-1');
  await page.click('#bastan');
  beklenen(await page.isVisible('#oyun') && await page.locator('.bb-h').count() === 64, '1. bölüm 8x8 ızgarayla açılmalı');
  beklenen(await page.locator('.bb-yuva[data-s]').count() === 3, 'Altta üç parça olmalı');
  beklenen((await page.textContent('#hamle')) === '19' && (await page.textContent('#hedef')).includes('60 puan'), 'Hedef ve kalan hamle görünmeli');
  let h = await hamleSec();
  await koy(h);
  beklenen(await sayi('#hamle') === 1 && await sayi('#puan') > 0, 'Dokunup yerleştirmek hamle ve puan saymalı');
  beklenen(await page.locator('.bb-yuva[data-s]').count() === 2, 'Yerleşen parça yuvadan kalkmalı');
  // Sürükle-bırak: parça bırakılan yere oturmalı
  h = await hamleSec();
  const yuva = await page.locator(`.bb-yuva[data-i="${h.i}"]`).boundingBox();
  const iz = await page.locator('#izgara').boundingBox();
  const sk = await page.evaluate(s => window.BlokBulmacaMotor.SEKILLER[s], Number(await page.getAttribute(`.bb-yuva[data-i="${h.i}"]`, 'data-s')));
  const hb = iz.width / 8;
  await page.mouse.move(yuva.x + yuva.width / 2, yuva.y + yuva.height / 2);
  await page.mouse.down();
  const hx = iz.x + (h.c + sk.g / 2) * hb, hy = iz.y + (h.r + sk.y / 2) * hb;
  await page.mouse.move(hx - 30, hy - 30, { steps: 4 });
  await page.mouse.move(hx, hy, { steps: 4 });
  beklenen(await page.getAttribute('#izgara', 'data-onizle') === h.r + ',' + h.c && await page.locator('.bb-h.oz').count() === sk.h.length, 'Sürüklerken yerleşme önizlemesi görünmeli');
  await page.mouse.up();
  beklenen(await sayi('#hamle') === 2 && !(await page.$('.bb-surukle')), 'Sürükle-bırak parçayı yerleştirmeli');
  // Botla bölümü bitir; en az bir hat temizlenmeli
  let hatGoruldu = false;
  for (let n = 0; n < 19 && !(await page.$('.oyun-sonu[open]')); n++) {
    const once = await sayi('#puan');
    h = await hamleSec();
    if (!h) break;
    await koy(h);
    const son = await page.getAttribute('#izgara', 'data-son');
    if (son && son.startsWith('hat-')) { hatGoruldu = true; beklenen(await sayi('#puan') - once >= 10, 'Hat temizlemek en az 10 puan vermeli'); }
    await ileri(700);
  }
  beklenen(hatGoruldu, 'Bölüm boyunca en az bir hat temizlenmeli');
  beklenen(await sonuAcik(), '1. bölüm kazanılınca oyun sonu penceresi açılmalı');
  beklenen((await page.textContent('.oyun-sonu h2')).includes('Bölüm 1 tamam'), 'Bölüm 1 başlığı görünmeli');
  let k = await kayit();
  const puan1 = await sayi('#puan');
  beklenen(k.yildiz[1] >= 1 && k.yildiz[1] <= 3, '1. bölüm yıldızı mo_blok kaydına yazılmalı');
  beklenen(Number(await page.evaluate(() => localStorage.getItem('mo_best_blok-bulmaca-1'))) === puan1, 'Bölüm rekoru kaydedilmeli');
  beklenen(await page.isVisible('#bb-sonraki'), 'Sonraki bölüm düğmesi görünmeli');

  // Tekrar oyna bölümü sıfırlar
  await page.click('.oyun-sonu [data-a="tekrar"]');
  beklenen(await sayi('#puan') === 0 && await sayi('#hamle') === 0 && (await izgara()).indexOf('d') === -1, 'Tekrar oyna bölümü sıfırlamalı');

  // Klavye: 1 ile seç, oklarla konumla, Enter ile yerleştir
  await page.keyboard.press('1');
  beklenen(await page.locator('.bb-yuva.secili').count() === 1, '1 tuşu ilk parçayı seçmeli');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  beklenen(await page.getAttribute('#izgara', 'data-imlec') === '2,1' && await page.getAttribute('#izgara', 'data-onizle') === '2,1', 'Ok tuşları konumu ve önizlemeyi taşımalı');
  await page.keyboard.press('Enter');
  beklenen(await sayi('#hamle') === 1 && Number(await page.getAttribute('#izgara', 'data-dolu')) > 0 && await page.locator('.bb-yuva[data-s]').count() === 2, 'Enter parçayı yerleştirmeli');

  // Yardımcılar: Yenile ve Sil haklarını kullanır
  // Başta birer hak; 3 yıldızlı bölüm bir hak daha verir
  const hak0 = k.hak;
  beklenen(hak0.sil === 1 && hak0.yenile === (k.yildiz[1] === 3 ? 2 : 1), 'Başta birer yardımcı hak olmalı, 3 yıldız bir Yenile hakkı vermeli: ' + JSON.stringify(hak0));
  beklenen(await page.getAttribute('#yenile', 'data-hak') === String(hak0.yenile) && await page.getAttribute('#sil', 'data-hak') === '1', 'Yardımcı haklar düğmelerde görünmeli');
  await page.click('#yenile');
  beklenen(await page.getAttribute('#yenile', 'data-hak') === String(hak0.yenile - 1) && await page.locator('.bb-yuva[data-s]').count() === 2, 'Yenile hakkı düşmeli, parça sayısı değişmemeli');
  const doluOnce = Number(await page.getAttribute('#izgara', 'data-dolu'));
  await page.click('#sil');
  beklenen(await page.locator('#izgara.sil-modu').count() === 1, 'Sil modu açılmalı');
  const dolu = await page.$$eval('.bb-h.d', x => Number(x[0].dataset.i));
  await page.click(`.bb-h[data-i="${dolu}"]`);
  beklenen(Number(await page.getAttribute('#izgara', 'data-dolu')) === doluOnce - 1 && await page.getAttribute('#sil', 'data-hak') === '0', 'Sil bir hücreyi kaldırmalı ve hak düşmeli');
  beklenen(await sayi('#hamle') === 1, 'Yardımcılar hamle saymamalı');
  k = await kayit();
  beklenen(k.hak.yenile === hak0.yenile - 1 && k.hak.sil === 0, 'Kullanılan haklar kaydedilmeli');

  // Klasik mod: parça sığmayınca biter, rekor kaydedilir
  await git(URL);
  await page.click('[data-klasik="normal"]');
  await tohumla('blok-test-klasik');
  await page.click('#bastan');
  for (let n = 0; n < 80 && !(await page.$('.oyun-sonu[open]')); n++) {
    h = await hamleSec(true);
    if (!h) break;
    await koy(h);
    await ileri(700);
  }
  beklenen(await sonuAcik(), 'Klasik mod parça sığmayınca bitmeli');
  const kp = await sayi('#puan');
  beklenen(kp > 0 && Number(await page.evaluate(() => localStorage.getItem('mo_best_blok-bulmaca'))) === kp, 'Klasik rekor kaydedilmeli');
  beklenen((await page.textContent('.oyun-sonu')).includes(kp + ' puan'), 'Sonuçta puan görünmeli');
  await page.click('.oyun-sonu [data-a="tekrar"]');
  beklenen(await sayi('#puan') === 0 && await page.locator('.bb-yuva[data-s]').count() === 3, 'Tekrar oyna klasik oyunu sıfırlamalı');

  // Dünya kilidi ve temalar: Bahçe'de 30 yıldız Maden'i, 15 yıldız Şeker temasını açar
  const y = {};
  for (let i = 1; i <= 10; i++) y[i] = 3;
  await yazKayit({ yildiz: y, hak: { yenile: 2, sil: 2 } });
  await git(URL);
  beklenen(await page.locator('.bb-dunya.kilitli').count() === 1, '30 yıldızla Maden açılmalı');
  beklenen(!(await page.isDisabled('[data-tema="seker"]')) && await page.isDisabled('[data-tema="ahsap"]'), '30 yıldızla Şeker açık, Ahşap kilitli olmalı');
  await page.click('[data-tema="seker"]');
  k = await kayit();
  beklenen(k.tema === 'seker' && k.acikTemalar.indexOf('seker') !== -1, 'Seçilen tema kaydedilmeli');
  await page.click('[data-dunya="1"]');
  await page.click('[data-bolum="16"]');
  beklenen(await page.locator('.bb-h.elmas').count() === 2 && (await page.textContent('#hedef')).includes('💎 0/2'), '16. bölümde 2 elmas ve hedefi görünmeli');
  beklenen(await page.locator('.bb-oyun.tema-seker').count() === 1, 'Seçilen tema oyunda kullanılmalı');
  // 16. bölümü botla kazan; elmaslar toplanmalı
  // (Parça dizisi denemeden denemeye değişir; bot birkaç tohumdan en az birinde kazanmalı)
  let kazandi16 = false;
  let d = 0;
  for (; d < 5 && !kazandi16; d++) {
    if (await page.$('.oyun-sonu[open]')) await page.click('.oyun-sonu [data-a="kapat"]');
    await tohumla('blok-test-16/' + d);
    await page.click('#bastan');
    for (let n = 0; n < 30 && !(await page.$('.oyun-sonu[open]')); n++) {
      h = await hamleSec();
      if (!h) break;
      await koy(h);
      await ileri(700);
    }
    kazandi16 = await sonuAcik() && (await page.textContent('.oyun-sonu h2')).includes('Bölüm 16 tamam');
  }
  beklenen(kazandi16, '16. bölüm elmaslar toplanınca kazanılmalı');
  // Buz Kalesi kilidi ve kilitli hücreler
  for (let i = 16; i <= 25; i++) y[i] = 3;
  await yazKayit({ yildiz: y, tema: 'klasik' });
  await git(URL);
  await page.click('[data-dunya="2"]');
  await page.click('[data-bolum="31"]');
  beklenen(await page.locator('.bb-h.kilit.k2').count() === 1 && (await page.textContent('#hedef')).includes('🔒 0/1'), '31. bölümde kilitli hücre ve hedefi görünmeli');

  // Günlük mod: iki açılışta aynı ızgara ve parçalar, yardımcılar gizli
  await git(URL + '?gunluk=2026-10-24');
  const g1 = await izgara() + '|' + await parcalar();
  await git(URL + '?gunluk=2026-10-24');
  const g2 = await izgara() + '|' + await parcalar();
  beklenen(g1 === g2 && g1.indexOf('d') !== -1, 'Günlük modda iki açılışta aynı ızgara ve parçalar gelmeli');
  beklenen(await page.isHidden('#yenile') && await page.isHidden('#sil'), 'Günlük modda yardımcılar gizli olmalı');

  // 360 px: taşma olmamalı
  await page.setViewportSize({ width: 360, height: 740 });
  await git(URL);
  beklenen(await page.evaluate(() => document.documentElement.scrollWidth <= 360), 'Haritada 360 px taşma olmamalı');
  await page.click('[data-klasik="kolay"]');
  beklenen(await page.evaluate(() => document.documentElement.scrollWidth <= 360), 'Oyunda 360 px taşma olmamalı');
};

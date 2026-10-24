// Meyve Patlat oynanış testi: motor kuralları (geçersiz değiştirme, 4'lü roket, özel+özel birleşimleri, gökkuşağı,
// buz/zincir, ceviz indirme, 60 bölümün eşleşmesiz ve hamleli başlangıcı), bozuk kayıt, harita ve kilitler, geçersiz
// değiştirmenin hamle düşürmemesi, fareyle kaydırma, 1. bölümü bot hamleleriyle kazanıp yıldızın mo_meyve'ye yazılması ve
// yenilemede haritada görünmesi, "Tekrar oyna", klavye kontrolü, güçlendiriciler, kaybedip +5 hamleyle devam, günlük
// görevler, dünya kilidi ve tema, serbest mod rekoru, günlük modda aynı tahta, 360 px taşma.
module.exports = async function (page, { git, beklenen }) {
  await page.clock.install({ time: new Date('2026-10-24T10:00:00') });
  const ileri = ms => page.clock.runFor(ms);
  const URL = 'games/meyve-patlat/';
  const kayit = () => page.evaluate(() => JSON.parse(localStorage.getItem('mo_meyve')));
  const yazKayit = s => page.evaluate(s => localStorage.setItem('mo_meyve', JSON.stringify(s)), s);
  const sayi = async (sel, at) => Number(await page.getAttribute(sel, at));
  const tohumla = t => page.evaluate(t => { Math.random = MiniOyun.gunluk.rastgele(t); }, t);
  const tahta = () => page.$$eval('.mp-h', h => h.map(x => x.classList.contains('yok') ? '.' : x.dataset.t + ':' + x.dataset.s).join(','));
  const sonuAcik = async () => { await ileri(1000); return !!(await page.$('.oyun-sonu[open]')); };
  // Ekrandaki tahtadan bot hamlesi seçer (kotu: en düşük değerli geçerli hamle)
  const hamleSec = (no, kotu) => page.evaluate(({ no, kotu }) => {
    const M = window.MeyvePatlatMotor, b = M.bos(6);
    document.querySelectorAll('.mp-h').forEach((x, i) => {
      if (x.classList.contains('yok')) { b.yok[i] = 1; return; }
      b.t[i] = Number(x.dataset.t); b.s[i] = Number(x.dataset.s);
      b.buz[i] = Number(x.dataset.buz || 0); b.kutu[i] = Number(x.dataset.kutu || 0); b.zin[i] = Number(x.dataset.zin || 0);
    });
    if (kotu === 'gecersiz') {
      for (let i = 0; i < 63; i++) if (i % 8 < 7 && !b.yok[i] && !b.yok[i + 1] && !M.gecerliMi(b, i, i + 1) && b.t[i] >= 0 && b.t[i + 1] >= 0 && !b.kutu[i] && !b.kutu[i + 1] && !b.zin[i] && !b.zin[i + 1]) return { a: i, c: i + 1 };
      return null;
    }
    if (kotu) {
      let en = null;
      M.hamleler(b).forEach(m => { const d = M.kopya(b), s = M.hamle(d, m[0], m[1], M.tohum('k')), v = s.puan + s.buz * 100; if (!en || v < en.v) en = { a: m[0], c: m[1], v }; });
      return en;
    }
    return M.enIyi(b, no ? M.ayar(no) : null, M.yeniIlerleme());
  }, { no, kotu: kotu || false });
  const dokun = async h => { await page.click(`.mp-h[data-i="${h.a}"]`); await page.click(`.mp-h[data-i="${h.c}"]`); await ileri(3000); };
  const botla = async (no, en, kotu) => {
    for (let n = 0; n < en && !(await page.$('.oyun-sonu[open]')); n++) {
      const h = await hamleSec(no, kotu);
      if (!h) break;
      await dokun(h);
    }
  };

  // Bozuk kayıt oyunu sıfırdan başlatmalı
  await git(URL);
  await page.evaluate(() => localStorage.setItem('mo_meyve', '{bozuk'));
  await git(URL);

  // Motor kuralları
  const kural = await page.evaluate(() => {
    const M = window.MeyvePatlatMotor, h = [], r = M.tohum('kural');
    const desen = () => { const b = M.bos(6); for (let i = 0; i < 64; i++) { const R = i >> 3, C = i & 7; b.t[i] = ((R % 2) * 3 + C % 3 + (R >> 1) * 2) % 6; } return b; };
    let b = desen();
    if (M.eslesmeler(b).length) h.push('desen tahtada hazır eşleşme');
    const once = JSON.stringify(b.t);
    if (M.hamle(b, 0, 1, r).gecerli || JSON.stringify(b.t) !== once) h.push('geçersiz değiştirme tahtayı değiştirdi');
    // 4'lü yatay dizi roket yapar
    b = desen(); b.t[0] = b.t[1] = b.t[3] = 0; b.t[2] = 1; b.t[10] = 0; b.t[8] = 2; b.t[9] = 3; b.t[11] = 4;
    let s = M.hamle(b, 2, 10, r);
    if (!s.gecerli || s.olusan.roket !== 1 || s.adimlar[0].puan !== 60) h.push('4lü roket: ' + JSON.stringify(s.olusan));
    // Özel + özel birleşimleri
    const birlesim = (sa, sc, beklenen, ad) => {
      const d = desen();
      d.s[27] = sa; d.s[28] = sc;
      if (sa === M.GOKKUSAGI) d.t[27] = M.RENKSIZ;
      if (sc === M.GOKKUSAGI) d.t[28] = M.RENKSIZ;
      const x = M.hamle(d, 27, 28, r);
      if (!x.gecerli || x.adimlar[0].temiz.length !== beklenen) h.push(ad + ': ' + (x.adimlar[0] && x.adimlar[0].temiz.length));
    };
    birlesim(M.ROKET_Y, M.ROKET_D, 15, 'roket+roket');
    birlesim(M.BOMBA, M.BOMBA, 25, 'bomba+bomba');
    birlesim(M.BOMBA, M.ROKET_Y, 39, 'roket+bomba');
    birlesim(M.GOKKUSAGI, M.GOKKUSAGI, 64, 'gökkuşağı+gökkuşağı');
    b = desen(); b.s[27] = M.GOKKUSAGI; b.t[27] = M.RENKSIZ;
    const tur = b.t[28], adet = b.t.filter(t => t === tur).length;
    s = M.hamle(b, 27, 28, r);
    if (!s.gecerli || s.toplanan[tur] !== adet) h.push('gökkuşağı+meyve');
    // Buz bir kat kırılır, zincir çözülür
    b = desen(); b.buz[0] = 1; b.zin[1] = 1; b.t[0] = b.t[1] = 0; b.t[2] = 1; b.t[10] = 0; b.t[8] = 2; b.t[9] = 3; b.t[11] = 4;
    s = M.hamle(b, 2, 10, r);
    if (s.buz !== 1 || s.zincir !== 1 || b.buz[0] || b.zin[1]) h.push('buz/zincir');
    if (M.gecerliMi(b, 1, 9) === false && b.zin[1]) h.push('zincir çözülmedi');
    // Ceviz alttaki meyveyle değişir ve en alta inince toplanır
    b = desen(); b.t[48] = M.CEVIZ;
    if (!M.gecerliMi(b, 48, 56) || M.gecerliMi(b, 48, 40)) h.push('ceviz değiştirme kuralı');
    s = M.hamle(b, 48, 56, r);
    if (s.ceviz !== 1 || b.t.indexOf(M.CEVIZ) !== -1) h.push('ceviz toplanmadı');
    // 60 bölüm: eşleşmesiz başlangıç, en az bir hamle, hedef engelleri mevcut, aynı tohum aynı engeller
    for (let no = 1; no <= 60; no++) {
      const L = M.ayar(no), a = M.bolumTahta(L, M.tohum('t' + no)), c = M.bolumTahta(L, M.tohum('u' + no));
      if (M.eslesmeler(a).length || !M.hamleler(a).length) h.push(no + ': başlangıç');
      if (!L.hamle || L.y3 <= L.y2 || L.hamle > 40) h.push(no + ': hamle/yıldız');
      if ((L.hedef.buz && !M.kalanBuz(a)) || (L.hedef.kutu && !M.kalanKutu(a))) h.push(no + ': hedef engeli yok');
      if (JSON.stringify([a.yok, a.buz, a.kutu, a.zin]) !== JSON.stringify([c.yok, c.buz, c.kutu, c.zin])) h.push(no + ': engeller tohuma bağlı değil');
    }
    return h;
  });
  beklenen(kural.length === 0, 'Motor kuralları hatalı: ' + kural.slice(0, 4).join('; '));

  // Harita ve kilitler
  beklenen(await page.isVisible('#harita'), 'Açılışta harita görünmeli');
  beklenen(await page.locator('.mp-dunya').count() === 4 && await page.locator('.mp-dunya.kilitli').count() === 3, '4 dünya olmalı, başta yalnızca Bahçe açık');
  beklenen(await page.locator('.mp-bolum').count() === 15 && await page.locator('.mp-bolum:not(.kilitli)').count() === 1, 'Dünyada 15 bölüm, başta yalnızca 1. bölüm açık olmalı');
  beklenen(!(await page.isDisabled('[data-tema="meyve"]')) && await page.isDisabled('[data-tema="seker"]'), 'Meyve teması açık, Şeker kilitli olmalı');
  beklenen(await page.locator('#gorevler li').count() === 3, 'Üç günlük görev görünmeli');

  // 1. bölüm: geçersiz değiştirme, fareyle kaydırma
  await page.click('[data-bolum="1"]');
  await tohumla('meyve-test-1');
  await page.click('.oyun-arac button[aria-label="Yeniden başlat"]');
  beklenen(await page.isVisible('#oyun') && await page.locator('.mp-h').count() === 64, '1. bölüm 8x8 tahtayla açılmalı');
  beklenen((await page.textContent('#hamle')) === '15' && await page.locator('[data-hedef="puan"]').count() === 1, 'Kalan hamle ve puan hedefi görünmeli');
  const g = await hamleSec(1, 'gecersiz');
  const t0 = await tahta();
  await dokun(g);
  beklenen(await sayi('#hamle', 'data-hamle') === 0 && await tahta() === t0, 'Geçersiz değiştirme hamle düşürmemeli, tahta aynı kalmalı');
  let h = await hamleSec(1);
  const kut = i => page.locator(`.mp-h[data-i="${i}"]`).boundingBox();
  const ka = await kut(h.a), kc = await kut(h.c);
  await page.mouse.move(ka.x + ka.width / 2, ka.y + ka.height / 2);
  await page.mouse.down();
  await page.mouse.move(ka.x + ka.width / 2 + (kc.x - ka.x) * 0.6, ka.y + ka.height / 2 + (kc.y - ka.y) * 0.6, { steps: 4 });
  await page.mouse.up();
  await ileri(3000);
  beklenen(await sayi('#hamle', 'data-hamle') === 1 && await sayi('#puan', 'data-puan') > 0, 'Kaydırarak geçerli değiştirme puan vermeli ve hamle saymalı');
  // Botla bölümü bitir
  await botla(1, 15);
  beklenen(await sonuAcik(), '1. bölüm bitince oyun sonu penceresi açılmalı');
  beklenen((await page.textContent('.oyun-sonu h2')).includes('Bölüm 1 tamam'), 'Bölüm 1 kazanılmalı');
  let k = await kayit();
  const puan1 = await sayi('#puan', 'data-puan');
  beklenen(k.bolumler[1].yildiz >= 1 && k.bolumler[1].enIyi === puan1, '1. bölüm yıldızı ve en iyi puanı mo_meyve kaydına yazılmalı');
  beklenen(await page.isVisible('#mp-sonraki'), 'Sonraki bölüm düğmesi görünmeli');
  beklenen(k.gorev.gun === '2026-10-24' && k.gorev.liste.length === 3, 'Günlük görevler kaydedilmeli');

  // Tekrar oyna bölümü sıfırlar
  await page.click('.oyun-sonu [data-a="tekrar"]');
  beklenen(await sayi('#puan', 'data-puan') === 0 && await sayi('#hamle', 'data-hamle') === 0, 'Tekrar oyna bölümü sıfırlamalı');

  // Klavye: oklarla imleç, Boşluk ile seç, ok ile değiştir
  h = await hamleSec(1);
  for (let i = 0; i < Math.floor(h.a / 8); i++) await page.keyboard.press('ArrowDown');
  for (let i = 0; i < h.a % 8; i++) await page.keyboard.press('ArrowRight');
  beklenen(await page.getAttribute('#tahta', 'data-imlec') === String(h.a) || h.a === 0, 'Ok tuşları imleci taşımalı');
  await page.keyboard.press(' ');
  beklenen(await page.locator('.mp-h.secili').count() === 1, 'Boşluk meyveyi seçmeli');
  await page.keyboard.press(h.c === h.a + 1 ? 'ArrowRight' : 'ArrowDown');
  await ileri(3000);
  beklenen(await sayi('#hamle', 'data-hamle') === 1, 'Klavyeyle değiştirme hamle saymalı');

  // Güçlendiriciler: karıştır, +5 hamle, çekiç (hamle saymaz)
  const adet = async t => sayi(`[data-guc="${t}"]`, 'data-adet');
  const g0 = { cekic: await adet('cekic'), karistir: await adet('karistir'), hamle5: await adet('hamle5') };
  beklenen(g0.karistir >= 1 && g0.hamle5 >= 1 && g0.cekic >= 1, 'Başta her güçlendiriciden en az bir tane olmalı: ' + JSON.stringify(g0));
  await page.click('[data-guc="karistir"]');
  beklenen(await adet('karistir') === g0.karistir - 1, 'Karıştır stoktan düşmeli');
  const kalan0 = await sayi('#hamle', 'data-kalan');
  await page.click('[data-guc="hamle5"]');
  beklenen(await sayi('#hamle', 'data-kalan') === kalan0 + 5 && await adet('hamle5') === g0.hamle5 - 1, '+5 hamle kalan hamleyi 5 artırmalı');
  await page.click('[data-guc="cekic"]');
  beklenen(await page.locator('#tahta.cekic-modu').count() === 1, 'Çekiç modu açılmalı');
  await page.click('.mp-h[data-i="60"]');
  await ileri(3000);
  beklenen(await adet('cekic') === g0.cekic - 1 && await sayi('#hamle', 'data-hamle') === 1, 'Çekiç stoktan düşmeli, hamle saymamalı');
  k = await kayit();
  beklenen(k.guc.karistir === g0.karistir - 1 && k.guc.hamle5 === g0.hamle5 - 1 && k.guc.cekic === g0.cekic - 1, 'Güçlendirici stokları kaydedilmeli');

  // Dünya kilidi ve tema: Bahçe bitip 25 yıldız Buzul'u, 30 yıldız Şeker temasını açar
  const b = {};
  for (let i = 1; i <= 15; i++) b[i] = { yildiz: 2, enIyi: 5000 };
  await yazKayit({ bolumler: b, guc: { cekic: 0, karistir: 0, hamle5: 2 } });
  await git(URL);
  beklenen(await page.locator('.mp-dunya.kilitli').count() === 2, '30 yıldızla Buzul açılmalı');
  beklenen(!(await page.isDisabled('[data-tema="seker"]')) && await page.isDisabled('[data-tema="mucevher"]'), '30 yıldızla Şeker açık, Mücevher kilitli olmalı');
  await page.click('[data-tema="seker"]');
  k = await kayit();
  beklenen(k.tema === 'seker', 'Seçilen tema kaydedilmeli');
  await page.click('[data-dunya="1"]');
  await page.click('[data-bolum="16"]');
  beklenen(await page.locator('.mp-h.buz').count() > 0 && await page.locator('[data-hedef="buz"]').count() === 1, '16. bölümde buz ve buz hedefi görünmeli');
  beklenen((await page.textContent('#tahta')).includes('🍬') || (await page.textContent('#tahta')).includes('🍭'), 'Seçilen tema tahtada kullanılmalı');
  // Kötü hamlelerle kaybet, +5 hamleyle devam et
  await tohumla('meyve-test-16');
  await page.click('.oyun-arac button[aria-label="Yeniden başlat"]');
  await botla(16, 40, true);
  beklenen(await sonuAcik() && (await page.textContent('.oyun-sonu h2')).includes('olmadı'), '16. bölüm hamleler bitince kaybedilmeli');
  beklenen(await page.isVisible('#mp-devam'), '+5 hamle ile devam düğmesi görünmeli');
  await page.click('#mp-devam');
  beklenen(await sayi('#hamle', 'data-kalan') === 5 && !(await page.$('.oyun-sonu[open]')), '+5 hamle ile oyun devam etmeli');
  k = await kayit();
  beklenen(k.guc.hamle5 === 1 && !k.bolumler[16], 'Devam hakkı düşmeli, kaybedilen bölüm kaydedilmemeli');

  // Serbest mod: 25 hamle, rekor kaydedilir
  await git(URL);
  await page.click('[data-serbest]');
  await tohumla('meyve-test-serbest');
  await page.click('.oyun-arac button[aria-label="Yeniden başlat"]');
  beklenen((await page.textContent('#hamle')) === '25' && await page.isHidden('#guclar'), 'Serbest mod 25 hamleyle, güçlendiricisiz başlamalı');
  await botla(0, 25);
  beklenen(await sonuAcik(), 'Serbest mod 25 hamlede bitmeli');
  const sp = await sayi('#puan', 'data-puan');
  beklenen(sp > 0 && Number(await page.evaluate(() => localStorage.getItem('mo_best_meyve-patlat'))) === sp, 'Serbest mod rekoru kaydedilmeli');
  await page.click('.oyun-sonu [data-a="tekrar"]');
  beklenen(await sayi('#puan', 'data-puan') === 0 && await sayi('#hamle', 'data-kalan') === 25, 'Tekrar oyna serbest oyunu sıfırlamalı');

  // Yenilemede yıldızlar haritada görünür
  k = await kayit();
  await yazKayit(Object.assign(k, { bolumler: { 1: { yildiz: 3, enIyi: 9000 } } }));
  await git(URL);
  await page.click('[data-dunya="0"]');
  beklenen((await page.textContent('[data-bolum="1"]')).includes('⭐⭐⭐') && !(await page.isDisabled('[data-bolum="2"]')), 'Kayıtlı yıldızlar haritada görünmeli, sonraki bölüm açılmalı');

  // Günlük mod: iki açılışta aynı tahta
  await git(URL + '?gunluk=2026-10-24');
  const d1 = await tahta();
  await git(URL + '?gunluk=2026-10-24');
  beklenen(d1 === await tahta() && await page.isVisible('#oyun'), 'Günlük modda iki açılışta aynı tahta gelmeli');

  // 360 px: taşma olmamalı
  await page.setViewportSize({ width: 360, height: 740 });
  await git(URL);
  beklenen(await page.evaluate(() => document.documentElement.scrollWidth <= 360), 'Haritada 360 px taşma olmamalı');
  await page.click('[data-serbest]');
  beklenen(await page.evaluate(() => document.documentElement.scrollWidth <= 360), 'Oyunda 360 px taşma olmamalı');
  const tb = await page.locator('#tahta').boundingBox();
  beklenen(tb.width <= 340 && tb.x >= 0, 'Tahta 360 px ekrana sığmalı');
};

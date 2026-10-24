// Top Sıralama oynanış testi: 60 bölümün üretimi (renk sayıları, tüp düzeni, aynı tohum aynı dizilim, çözücünün
// çözümü kurallara uygun), bozuk kayıt, harita ve kilitler, geçersiz hamle, 1. bölümü çözücüyle tıklayarak bitirip
// yıldız/jeton/rekor kaydı (mo_top), "Tekrar oyna", Geri Al, +1 Tüp, klavye kontrolü, gizli toplar, kısa ve kilitli tüpler,
// usta bölümü ve dünya bitince açılan tema, dünya kilidi (24 yıldız), görev ödülü, günlük modda aynı dizilim ve
// tek seferlik ödül, sonsuz mod ve 360 px taşma.
module.exports = async function (page, { git, beklenen }) {
  await page.clock.install({ time: new Date('2026-10-24T10:00:00') });
  const ileri = ms => page.clock.runFor(ms);
  const URL = 'games/top-siralama/';
  const kayit = () => page.evaluate(() => JSON.parse(localStorage.getItem('mo_top')));
  const yazKayit = s => page.evaluate(s => localStorage.setItem('mo_top', JSON.stringify(s)), s);
  const degistir = fn => page.evaluate(fn => { const s = JSON.parse(localStorage.getItem('mo_top')); new Function('s', fn)(s); localStorage.setItem('mo_top', JSON.stringify(s)); }, fn);
  const hamle = async () => Number(await page.getAttribute('#tupler', 'data-hamle'));
  const jeton = async () => Number(await page.getAttribute('#jeton', 'data-jeton'));
  const dizilim = () => page.$$eval('.ts-tup', t => t.map(x => x.dataset.toplar).join('|'));
  const sonuAcik = async () => { await ileri(700); return !!(await page.$('.oyun-sonu[open]')); };
  const tikla = i => page.click(`.ts-tup[data-i="${i}"]`);
  const cozum = no => page.evaluate(no => {
    const M = window.TopSiralamaMotor;
    return M.uret(M.ayar(no), MiniOyun.gunluk.rastgele('top-siralama/bolum/' + no)).cozum;
  }, no);
  const oyna = async yol => { for (const [a, b] of yol) { await tikla(a); await tikla(b); } };
  // Görevler ödül vermesin diye bugünün görevleri tamamlanmış sayılır (görev ödülü aşağıda ayrıca denenir)
  const gorevlerTamam = { tarih: '2026-10-24', liste: ['bolum3', 'yildiz3', 'tup10'], ilerleme: {}, tamam: ['bolum3', 'yildiz3', 'tup10'] };

  // Bozuk kayıt oyunu sıfırdan başlatmalı
  await git(URL);
  await page.evaluate(() => localStorage.setItem('mo_top', '{bozuk'));
  await git(URL);

  // Üretici: 60 bölüm, her renkten 4 top, tüp düzeni, aynı tohum aynı dizilim, çözüm kurallara uygun
  const uretim = await page.evaluate(() => {
    const M = window.TopSiralamaMotor, hatalar = [];
    for (let no = 1; no <= 60; no++) {
      const o = M.ayar(no), u = M.uret(o, MiniOyun.gunluk.rastgele('top-siralama/bolum/' + no));
      const u2 = M.uret(o, MiniOyun.gunluk.rastgele('top-siralama/bolum/' + no));
      const say = {};
      u.tuplar.forEach(t => t.b.forEach(c => { say[c] = (say[c] || 0) + 1; }));
      if (Object.keys(say).length !== o.renk || Object.values(say).some(n => n !== 4)) hatalar.push(no + ': top sayıları');
      if (u.tuplar.length !== o.renk + o.bos + o.kisa + (o.kilit ? 1 : 0)) hatalar.push(no + ': tüp sayısı');
      if (u.tuplar.filter(t => t.k === 3).length !== o.kisa) hatalar.push(no + ': kısa tüp');
      if (o.kilit !== (u.kilit >= 0)) hatalar.push(no + ': kilit');
      if (JSON.stringify(u.tuplar) !== JSON.stringify(u2.tuplar)) hatalar.push(no + ': aynı tohum farklı dizilim');
      if (u.tuplar.some(t => M.tamam(t))) hatalar.push(no + ': başta tamamlanmış tüp');
      // Çözümü kurallarla oynat
      const T = M.kopya(u.tuplar);
      let acik = u.kilit < 0, ok = !!u.cozum;
      (u.cozum || []).forEach(([a, b]) => {
        if (!ok) return;
        const n = M.tasinir(T, a, b, acik ? -1 : u.kilit);
        if (!n || M.tamam(T[a])) { ok = false; return; }
        M.tasi(T, a, b, n);
        if (!acik && M.renkTamam(T, u.kilitRenk)) acik = true;
      });
      if (!ok || !M.kazandi(T)) hatalar.push(no + ': çözüm geçersiz');
    }
    return hatalar;
  });
  beklenen(uretim.length === 0, 'Bölüm üretimi hatalı: ' + uretim.slice(0, 5).join('; '));

  // Harita ve kilitler
  beklenen(await page.isVisible('#harita'), 'Açılışta bölüm haritası görünmeli');
  beklenen(await page.locator('.ts-dunya').count() === 5, '5 dünya olmalı');
  beklenen(await page.locator('.ts-dunya.kilitli').count() === 4, 'Başta yalnızca Bahçe açık olmalı');
  beklenen(await page.locator('.ts-bolum').count() === 12, 'Dünyada 12 bölüm olmalı');
  beklenen(await page.locator('.ts-bolum:not(.kilitli)').count() === 1, 'Başta yalnızca 1. bölüm açık olmalı');
  beklenen(await page.locator('.ts-gorev').count() === 3, '3 günlük görev olmalı');
  beklenen(await page.isDisabled('[data-sonsuz="kolay"]'), 'Sonsuz mod başta kilitli olmalı');
  beklenen(!(await page.isDisabled('[data-tema="sekil"]')) && await page.isDisabled('[data-tema="meyve"]'), 'Şekilli tema açık, Meyveler kilitli olmalı');

  await yazKayit({ gorev: gorevlerTamam });
  await git(URL);

  // 1. bölüm: dizilim üreticiyle aynı, geçersiz hamle sayılmaz
  await page.click('.ts-bolum >> nth=0');
  beklenen(await page.isVisible('#oyun') && await page.locator('.ts-tup').count() === 5, '1. bölüm 5 tüple açılmalı');
  const bas1 = await dizilim();
  const beklenenDizilim = await page.evaluate(() => {
    const M = window.TopSiralamaMotor;
    return M.uret(M.ayar(1), MiniOyun.gunluk.rastgele('top-siralama/bolum/1')).tuplar.map(t => t.b.join(',')).join('|');
  });
  beklenen(bas1 === beklenenDizilim, '1. bölüm üreticinin dizilimiyle açılmalı');
  const gecersiz = await page.evaluate(() => {
    const t = [...document.querySelectorAll('.ts-tup')].map(x => x.dataset.toplar ? x.dataset.toplar.split(',') : []);
    for (let a = 0; a < t.length; a++) for (let b = 0; b < t.length; b++) {
      if (a !== b && t[a].length && t[b].length && t[a][t[a].length - 1] !== t[b][t[b].length - 1]) return [a, b];
    }
    return null;
  });
  beklenen(!!gecersiz, 'Geçersiz hamle için tüp çifti bulunmalı');
  await tikla(gecersiz[0]);
  beklenen(await page.locator('.ts-tup.secili').count() === 1 && await page.locator('.ts-top.kalk').count() >= 1, 'Seçilen tüpün üst topu kalkmalı');
  await tikla(gecersiz[1]);
  beklenen(await hamle() === 0 && await page.getAttribute('#tupler', 'data-son') === 'gecersiz', 'Geçersiz hamle sayılmamalı');
  beklenen(await dizilim() === bas1, 'Geçersiz hamle dizilimi değiştirmemeli');
  await tikla(gecersiz[0]);
  beklenen(await page.locator('.ts-tup.secili').count() === 0, 'Aynı tüpe tekrar dokunmak seçimi bırakmalı');
  beklenen(await page.locator('.ts-tup.oner').count() === 2, 'Öğretici bölümde önerilen hamle gösterilmeli');

  const y1 = await cozum(1);
  await oyna(y1);
  beklenen(await sonuAcik(), 'Bölüm bitince oyun sonu penceresi açılmalı');
  beklenen((await page.textContent('.oyun-sonu h2')).includes('Bölüm 1 tamam'), 'Bölüm 1 başlığı görünmeli');
  beklenen((await page.textContent('.oyun-sonu')).includes(y1.length + ' hamle'), 'Sonuçta hamle sayısı görünmeli');
  let k = await kayit();
  beklenen(k.bolumler[1] === 3, 'Hedef hamlede ve Geri Al kullanmadan bitiş 3 yıldız vermeli, gelen: ' + k.bolumler[1]);
  beklenen(k.jeton === 3, 'İlk kez kazanılan 3 yıldız 3 jeton vermeli, gelen: ' + k.jeton);
  beklenen(Number(await page.evaluate(() => localStorage.getItem('mo_best_top-siralama-1'))) === y1.length, 'Bölüm rekoru (hamle) kaydedilmeli');
  beklenen(await page.locator('.ts-tup.tamam').count() === 3, 'Tamamlanan tüplerde kapak görünmeli');

  // Tekrar oyna bölümü aynı dizilimle sıfırlar
  await page.click('.oyun-sonu [data-a="tekrar"]');
  beklenen(await hamle() === 0 && await dizilim() === bas1 && !(await page.$('.oyun-sonu[open]')), 'Tekrar oyna bölümü sıfırlamalı');

  // Geri Al: hamleyi geri alır, hak düşer; Geri Al kullanılan bitiş 3 yıldız vermez ama eski 3 yıldızı silmez
  await tikla(y1[0][0]); await tikla(y1[0][1]);
  beklenen(await hamle() === 1, 'Hamle sayılmalı');
  await page.click('#geri');
  beklenen(await hamle() === 0 && await dizilim() === bas1 && await page.getAttribute('#geri', 'data-hak') === '4', 'Geri Al hamleyi geri almalı ve hak düşmeli');
  await oyna(y1);
  beklenen(await sonuAcik(), 'Geri Al sonrası bölüm bitmeli');
  beklenen((await page.textContent('.oyun-sonu')).includes('⭐⭐☆'), 'Geri Al kullanılınca 2 yıldız gelmeli');
  k = await kayit();
  beklenen(k.bolumler[1] === 3 && k.jeton === 3, 'Kötü sonuç eski yıldızı silmemeli, tekrar jeton vermemeli');

  // Sonraki bölüm ve +1 Tüp
  beklenen(await page.isVisible('#ts-sonraki'), 'Sonraki bölüm düğmesi görünmeli');
  await degistir('s.jeton = 20;');
  await git(URL);
  await page.click('.ts-bolum >> nth=1');
  beklenen((await page.textContent('#bolum')) === '2', '2. bölüm açılmalı');
  const tupSay = await page.locator('.ts-tup').count();
  await page.click('#tup-ekle');
  beklenen(await page.locator('.ts-tup').count() === tupSay + 1 && await jeton() === 15, '+1 Tüp boş tüp eklemeli ve 5 jeton düşmeli');
  beklenen(await page.isDisabled('#tup-ekle'), '+1 Tüp bölümde bir kez kullanılmalı');
  await oyna(await cozum(2));
  beklenen(await sonuAcik(), '2. bölüm bitmeli');
  k = await kayit();
  beklenen(k.bolumler[2] === 1 && k.jeton === 16, '+1 Tüp kullanılan bölüm en fazla 1 yıldız vermeli');

  // Klavye: oklar + Enter, tuş etiketleri, Z geri al, R baştan
  await page.click('.oyun-sonu [data-a="kapat"]');
  await page.click('#harita-btn');
  beklenen(await page.locator('.ts-bolum:not(.kilitli)').count() === 3, '2 bölüm bitince 3. bölüm açılmalı');
  await page.click('.ts-bolum >> nth=2');
  const bas3 = await dizilim();
  const y3 = await cozum(3);
  const TUS = '1234567890QWETY';
  const n3 = await page.locator('.ts-tup').count();
  for (let i = 0; i < (y3[0][0] || n3); i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  beklenen(await page.locator('.ts-tup.secili').count() === 1, 'Ok tuşları ve Enter tüp seçmeli');
  await page.keyboard.press(TUS[y3[0][1]]);
  beklenen(await hamle() === 1, 'Tuş etiketiyle taşınmalı');
  await page.keyboard.press('z');
  beklenen(await hamle() === 0 && await dizilim() === bas3, 'Z son hamleyi geri almalı');
  await page.keyboard.press(TUS[y3[0][0]]); await page.keyboard.press(TUS[y3[0][1]]);
  await page.keyboard.press('r');
  beklenen(await hamle() === 0 && await dizilim() === bas3, 'R bölümü baştan başlatmalı');
  for (const [a, b] of y3) { await page.keyboard.press(TUS[a]); await page.keyboard.press(TUS[b]); }
  beklenen(await sonuAcik(), 'Klavyeyle 3. bölüm bitmeli');

  // Dünya kilidi: Bahçe'de 23 yıldız yetmez, 24 yıldız gerekir
  await degistir('s.bolumler = {1:3,2:3,3:3,4:3,5:3,6:2,7:1,8:1,9:1,10:1,11:1,12:1};');
  await git(URL);
  beklenen(await page.locator('.ts-dunya.kilitli[data-dunya="1"]').count() === 1, '23 yıldızla Deniz kilitli olmalı');
  await degistir('s.bolumler[12] = 2;');
  await git(URL);
  beklenen(await page.locator('.ts-dunya.kilitli[data-dunya="1"]').count() === 0, '24 yıldızla Deniz açılmalı');

  // Gizli toplar (13. bölüm): üstteki toplar açık, alttakiler gizli; üste çıkan top açılır
  await page.click('.ts-dunya[data-dunya="1"]');
  await page.click('.ts-bolum >> nth=0');
  beklenen(await page.locator('.ts-top.gizli').count() > 0, 'Deniz bölümünde gizli toplar olmalı');
  beklenen(await page.$$eval('.ts-tup', t => t.every(x => { const b = x.querySelectorAll('.ts-top'); return !b.length || !b[b.length - 1].classList.contains('gizli'); })), 'Her tüpün üst topu açık olmalı');
  const y13 = await cozum(13);
  await tikla(y13[0][0]); await tikla(y13[0][1]);
  beklenen(await page.$$eval('.ts-tup', t => t.every(x => { const b = x.querySelectorAll('.ts-top'); return !b.length || !b[b.length - 1].classList.contains('gizli'); })), 'Üste çıkan gizli top açılmalı');

  // Usta bölümü (12): Geri Al kapalı; Bahçe bitince Meyveler teması ve Ahşap tüp açılır, usta +5 jeton
  await degistir('s.bolumler = {1:3,2:3,3:3,4:3,5:3,6:3,7:3,8:3,9:3,10:3,11:3}; s.jeton = 0; s.acilan = [];');
  await git(URL);
  await page.click('.ts-bolum >> nth=11');
  beklenen(await page.isDisabled('#geri'), 'Usta bölümünde Geri Al kapalı olmalı');
  await oyna(await cozum(12));
  beklenen(await sonuAcik(), 'Usta bölümü bitmeli');
  k = await kayit();
  beklenen(k.jeton === 8, 'Usta bölümü 3 yıldız + 5 jeton vermeli, gelen: ' + k.jeton);
  beklenen(k.acilan.includes('meyve') && k.acilan.includes('ahsap'), 'Bahçe bitince Meyveler ve Ahşap açılmalı');
  await page.click('.oyun-sonu [data-a="kapat"]');
  await page.click('#harita-btn');
  await page.click('[data-tema="meyve"]');
  await page.click('[data-tema="ahsap"]');
  k = await kayit();
  beklenen(k.tema.top === 'meyve' && k.tema.tup === 'ahsap', 'Açılan tema seçilebilmeli');
  await page.click('.ts-dunya[data-dunya="0"]');
  await page.click('.ts-bolum >> nth=0');
  beklenen((await page.textContent('.ts-tupler')).includes('🍓') || (await page.textContent('.ts-tupler')).match(/\p{Extended_Pictographic}/u), 'Meyve temasında toplar emoji göstermeli');
  beklenen(await page.$eval('#oyun', e => e.classList.contains('tup-ahsap')), 'Ahşap tüp görünümü uygulanmalı');

  // Kısa tüpler (25) ve kilitli tüp (37); görev ödülü
  await degistir('for (let i = 1; i <= 36; i++) s.bolumler[i] = 3; s.gorev = { tarih: "2026-10-24", liste: ["bolum3", "yildiz3", "tup10"], ilerleme: { bolum3: 2 }, tamam: ["yildiz3", "tup10"] };');
  await git(URL);
  await page.click('.ts-dunya[data-dunya="2"]');
  await page.click('.ts-bolum >> nth=0');
  beklenen(await page.locator('.ts-tup.kisa').count() === 2, 'Dağ bölümünde 2 kısa tüp olmalı');
  await page.click('#harita-btn');
  await page.click('.ts-dunya[data-dunya="3"]');
  await page.click('.ts-bolum >> nth=0');
  beklenen(await page.locator('.ts-tup.kilitli').count() === 1, 'Şehir bölümünde kilitli tüp olmalı');
  const kilitI = await page.getAttribute('.ts-tup.kilitli', 'data-i');
  await tikla(kilitI);
  beklenen(await page.locator('.ts-tup.secili').count() === 0 && (await page.textContent('#uyari')).includes('açılır'), 'Kilitli tüp seçilememeli');
  const j37 = await jeton();
  await oyna(await cozum(37));
  beklenen(await sonuAcik(), 'Kilitli tüplü bölüm çözülmeli');
  beklenen(await page.locator('.ts-tup.kilitli').count() === 0, 'Kilit rengi tamamlanınca kilit açılmalı');
  k = await kayit();
  beklenen(k.gorev.tamam.includes('bolum3') && k.jeton === j37 + 3 + 2, 'Görev tamamlanınca 2 jeton verilmeli, gelen: ' + (k.jeton - j37));

  // Günlük mod: iki açılışta aynı dizilim, ödül günde bir kez, jetonlu yardımlar kapalı
  await git(URL + '?gunluk=2026-10-24');
  const g1 = await dizilim();
  await git(URL + '?gunluk=2026-10-24');
  beklenen(g1 === await dizilim(), 'Günlük modda iki açılışta aynı dizilim gelmeli');
  beklenen(await page.locator('.ts-tup').count() === 10 && await page.locator('.ts-top.gizli').count() > 0, 'Günlük bulmaca 8 renkli ve gizli toplu olmalı');
  beklenen(await page.isHidden('#tup-ekle'), 'Günlük modda +1 Tüp kapalı olmalı');
  const yg = await page.evaluate(() => { const M = window.TopSiralamaMotor; return M.uret({ renk: 8, bos: 2, kisa: 0, gizli: true }, MiniOyun.gunluk.rastgele('2026-10-24/top-siralama')).cozum; });
  const jg = (await kayit()).jeton;
  await oyna(yg);
  beklenen(await sonuAcik(), 'Günlük bulmaca bitmeli');
  beklenen((await page.textContent('.oyun-sonu h2')).includes('Günlük'), 'Günlük başlığı görünmeli');
  beklenen((await kayit()).jeton === jg + 3, 'Günlük bulmaca 3 jeton vermeli');
  beklenen(Number(await page.evaluate(() => localStorage.getItem('mo_best_top-siralama-gunluk'))) === yg.length, 'Günlük rekor kaydedilmeli');
  await page.click('.oyun-sonu [data-a="tekrar"]');
  beklenen(await dizilim() === g1, 'Günlük tekrar aynı dizilimle başlamalı');
  await oyna(yg);
  beklenen(await sonuAcik(), 'Günlük bulmaca tekrar bitmeli');
  beklenen((await kayit()).jeton === jg + 3, 'Günlük ödül aynı gün iki kez verilmemeli');

  // Sonsuz mod: 60 bölüm bitince açılır, çözülen bulmaca seriyi artırır
  await degistir('for (let i = 1; i <= 60; i++) s.bolumler[i] = 3;');
  await page.setViewportSize({ width: 360, height: 740 });
  await git(URL);
  beklenen(!(await page.isDisabled('[data-sonsuz="kolay"]')), '60 bölümden sonra sonsuz mod açılmalı');
  await page.click('[data-sonsuz="kolay"]');
  beklenen(await page.locator('.ts-tup').count() === 7, 'Kolay sonsuz bulmaca 7 tüplü olmalı');
  const ys = await page.evaluate(() => {
    const T = [...document.querySelectorAll('.ts-tup')].map(x => ({ k: 4, b: x.dataset.toplar ? x.dataset.toplar.split(',').map(Number) : [] }));
    return window.TopSiralamaMotor.coz(T, -1, -1, 100000);
  });
  await oyna(ys);
  beklenen(await sonuAcik(), 'Sonsuz bulmaca bitmeli');
  beklenen((await kayit()).sonsuzSeri === 1, 'Sonsuz seri kaydedilmeli');

  // 360 px: en kalabalık bölüm (60) ve +1 tüp taşmamalı
  await page.click('.oyun-sonu [data-a="kapat"]');
  await page.click('#harita-btn');
  await page.click('.ts-dunya[data-dunya="4"]');
  await page.click('.ts-bolum >> nth=11');
  beklenen(await page.locator('.ts-tup').count() === 14, '60. bölüm 14 tüplü olmalı');
  beklenen(await page.evaluate(() => document.documentElement.scrollWidth <= 360), '360 px genişlikte yatay taşma olmamalı');
  const kutu = await page.locator('.ts-tup >> nth=0').boundingBox();
  beklenen(kutu.width >= 30, 'Tüpler telefonda dokunulacak genişlikte olmalı, gelen: ' + kutu.width);
  await degistir('s.jeton = 10;');
  await git(URL);
  await page.click('.ts-dunya[data-dunya="4"]');
  await page.click('.ts-bolum >> nth=11');
  await page.click('#tup-ekle');
  beklenen(await page.locator('.ts-tup').count() === 15 && await page.evaluate(() => document.documentElement.scrollWidth <= 360), '+1 tüple de taşma olmamalı');
};

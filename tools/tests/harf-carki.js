// Harf Çarkı oynanış testi: tüm bölüm verisinin tutarlılığı, bozuk kayıt, bölüm haritası ve kilitler,
// klavyeyle 1. bölümü bitirip yıldız/jeton/rekor kaydı, "Tekrar oyna", "Sonraki bölüm", bonus ve geçersiz kelime,
// sürükleyerek ve tek tek dokunarak kelime kurma, ipuçları ve jeton, duraklatma, yarım bölümün kalıcılığı (mo_harf),
// tema kilidi (20 yıldız), Türkçe harf eşleşmesi (i → İ), günlük modda aynı bulmaca ve tek seferlik ödül, 360 px taşma.
// Saat sahte (page.clock), böylece süre beklemeden ileri sarılır.
module.exports = async function (page, { git, beklenen }) {
  await page.clock.install({ time: new Date('2026-10-24T10:00:00') });
  const ileri = ms => page.clock.runFor(ms);
  const kayit = () => page.evaluate(() => JSON.parse(localStorage.getItem('mo_harf')));
  const yaz = w => page.evaluate(w => { for (const ch of w) document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true, cancelable: true })); }, w);
  const gonder = () => page.evaluate(() => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })));
  const kelime = async w => { await yaz(w); await gonder(); };
  const bulunan = async () => Number(await page.getAttribute('#izgara', 'data-bulunan'));
  const jeton = async () => Number(await page.getAttribute('#jeton', 'data-jeton'));
  const sonuAcik = async () => { await ileri(700); return !!(await page.$('.oyun-sonu[open]')); };
  // Bölümün hedef kelimeleri (veri dosyasından)
  const hedefler = no => page.evaluate(no => window.HarfCarkiVeri.BOLUMLER[no - 1].k.map(k => k[0]), no);

  // Bozuk kayıt oyunu sıfırdan başlatmalı
  await git('games/harf-carki/');
  await page.evaluate(() => localStorage.setItem('mo_harf', '{bozuk'));
  await git('games/harf-carki/');

  // Veri tutarlılığı: 60 bölüm, kelimeler çarktaki harflerle kurulabilir ve sözlükte, kesişmeler aynı harf, ızgara en fazla 10x10
  const veri = await page.evaluate(() => {
    const V = window.HarfCarkiVeri, soz = new Set(V.SOZLUK), hatalar = [];
    const say = s => { const m = {}; for (const c of s) m[c] = (m[c] || 0) + 1; return m; };
    V.BOLUMLER.forEach((b, i) => {
      const h = say(b.h), hucre = {}, gorulen = new Set();
      let R = 0, C = 0;
      if (Array.from(b.h).length < 3 || Array.from(b.h).length > 7) hatalar.push((i + 1) + ': harf sayısı');
      b.k.forEach(([w, r, c, d]) => {
        if (!soz.has(w)) hatalar.push((i + 1) + ': ' + w + ' sözlükte yok');
        if (gorulen.has(w)) hatalar.push((i + 1) + ': ' + w + ' iki kez');
        gorulen.add(w);
        const m = say(w);
        for (const k in m) if ((h[k] || 0) < m[k]) hatalar.push((i + 1) + ': ' + w + ' harflerden kurulamıyor');
        Array.from(w).forEach((ch, j) => {
          const rr = d === 'y' ? r : r + j, cc = d === 'y' ? c + j : c, key = rr + ',' + cc;
          if (hucre[key] && hucre[key] !== ch) hatalar.push((i + 1) + ': ' + key + ' kesişme uyuşmuyor');
          hucre[key] = ch;
          R = Math.max(R, rr + 1); C = Math.max(C, cc + 1);
        });
      });
      if (R > 10 || C > 10) hatalar.push((i + 1) + ': ızgara ' + R + 'x' + C);
      if (b.k.length < 3) hatalar.push((i + 1) + ': az kelime');
    });
    return { n: V.BOLUMLER.length, hatalar };
  });
  beklenen(veri.n === 60, '60 bölüm olmalı, gelen: ' + veri.n);
  beklenen(veri.hatalar.length === 0, 'Bölüm verisi hatalı: ' + veri.hatalar.slice(0, 5).join('; '));

  // Harita ve kilitler
  beklenen(await page.isVisible('#harita'), 'Açılışta bölüm haritası görünmeli');
  beklenen(await page.locator('.hc-tema').count() === 6, '6 tema olmalı');
  beklenen(await page.locator('.hc-tema.kilitli').count() === 5, 'Başta yalnızca ilk tema açık olmalı');
  beklenen(await page.locator('.hc-bolum').count() === 10, 'Temada 10 bölüm olmalı');
  beklenen(await page.locator('.hc-bolum:not(.kilitli)').count() === 1, 'Başta yalnızca 1. bölüm açık olmalı');
  beklenen(await page.locator('.hc-gorev').count() === 3, '3 günlük görev olmalı');
  beklenen(await page.isDisabled('[data-uzun]'), 'Uzun Kelime modu başta kilitli olmalı');
  beklenen((await page.textContent('#h-jeton')).includes('5'), 'Oyun 5 jetonla başlamalı');

  // Görevler ödül vermesin diye bugünün görevleri tamamlanmış sayılır (görev ödülü aşağıda ayrıca denenir)
  await page.evaluate(() => localStorage.setItem('mo_harf', JSON.stringify({ gorev: { tarih: '2026-10-24', liste: ['bonus5', 'uzun6', 'kelime20'], ilerleme: {}, tamam: ['bonus5', 'uzun6', 'kelime20'] } })));
  await git('games/harf-carki/');

  // 1. bölüm: geçersiz kelime, sonra tüm kelimeler klavyeyle
  await page.click('.hc-bolum >> nth=0');
  beklenen(await page.isVisible('#oyun') && await page.locator('.hc-harf').count() === 4, '1. bölüm 4 harfli çarkla açılmalı');
  await kelime('YOB');
  beklenen(await page.getAttribute('#kelime', 'data-son') === 'salla' && await bulunan() === 0, 'Geçersiz kelime sallanmalı ve sayılmamalı');
  const k1 = await hedefler(1);
  await kelime(k1[0]);
  beklenen(await bulunan() === 1, 'Bulmaca kelimesi bulunmalı');
  await kelime(k1[0]);
  beklenen(await bulunan() === 1 && (await page.textContent('#uyari')).includes('zaten'), 'Aynı kelime ikinci kez sayılmamalı');
  // Kesişen karelerin harfleri doğru görünmeli
  const dolu = await page.$$eval('.hc-kare.dolu', d => d.map(x => x.textContent).join(''));
  beklenen(dolu.length === Array.from(k1[0]).length, 'Bulunan kelimenin kareleri dolmalı');
  for (const w of k1.slice(1)) await kelime(w);
  beklenen(await sonuAcik(), 'Bölüm bitince oyun sonu penceresi açılmalı');
  beklenen((await page.textContent('.oyun-sonu h2')).includes('Bölüm 1 tamam'), 'Bölüm 1 başlığı görünmeli');
  let k = await kayit();
  beklenen(k.bolumler[1] === 3, 'İpucusuz ve hızlı bitiş 3 yıldız vermeli, gelen: ' + k.bolumler[1]);
  beklenen(k.jeton === 6, 'İlk bitiş 1 jeton vermeli, gelen: ' + k.jeton);
  beklenen(Number(await page.evaluate(() => localStorage.getItem('mo_best_harf-carki-1'))) > 0, 'Bölüm rekoru kaydedilmeli');
  beklenen(k.kelimeler.length === k1.length, 'Bulunan kelimeler sözlüğe eklenmeli');
  beklenen(k.gorev && k.gorev.tarih === '2026-10-24' && k.gorev.liste.length === 3, 'Günlük görevler bugünün tarihiyle kaydedilmeli');

  // Tekrar oyna bölümü sıfırlar; daha kötü sonuç yıldızı silmez
  await page.click('.oyun-sonu [data-a="tekrar"]');
  beklenen(await bulunan() === 0 && !(await page.$('.oyun-sonu[open]')), 'Tekrar oyna bölümü sıfırlamalı');

  // İpuçları jeton düşer
  await page.click('#ipucu-harf');
  beklenen(await jeton() === 5 && await page.locator('.hc-kare.ipucu').count() === 1, 'Harf aç 1 jeton düşmeli ve bir kare açmalı');
  await page.click('#ipucu-kelime');
  beklenen(await jeton() === 2 && await bulunan() >= 1, 'Kelime aç 3 jeton düşmeli ve bir kelime açmalı');
  beklenen(await page.isDisabled('#ipucu-kelime'), 'Jeton yetmezse kelime ipucu kullanılamamalı');
  for (const w of k1) await kelime(w);
  beklenen(await sonuAcik(), 'İpuçlu bölüm de bitmeli');
  k = await kayit();
  beklenen(k.bolumler[1] === 3, 'Kötü sonuç eski 3 yıldızı silmemeli');
  beklenen(k.jeton === 2, 'Tekrar bitiş jeton vermemeli, gelen: ' + k.jeton);

  // Sonraki bölüm: bonus kelime, sürükleme, dokunma, geri dönme
  beklenen(await page.isVisible('#hc-sonraki'), 'Sonraki bölüm düğmesi görünmeli');
  await page.click('#hc-sonraki');
  beklenen((await page.textContent('#bolum')) === '2', '2. bölüm açılmalı');
  await kelime('AYA');
  beklenen(await page.getAttribute('#kelime', 'data-son') === 'iyi' && await bulunan() === 0, 'AYA bonus kelime sayılmalı');
  k = await kayit();
  beklenen(k.bonus === 1 && k.devam.bonus.includes('AYA'), 'Bonus sayısı ve yarım bölüm kaydedilmeli');
  await kelime('AYA');
  beklenen((await kayit()).bonus === 1, 'Aynı bonus bölümde tekrar sayılmamalı');

  const merkez = async (harf, atla = []) => page.evaluate(([harf, atla]) => {
    const b = [...document.querySelectorAll('.hc-harf')].find(x => x.textContent === harf && !atla.includes(x.dataset.i));
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, i: b.dataset.i };
  }, [harf, atla]);
  const yol = async w => { const p = [], kul = []; for (const ch of w) { const m = await merkez(ch, kul); kul.push(m.i); p.push(m); } return p; };
  const k2 = await hedefler(2);
  // Sürükleme: ilk kelime, sonda geri dönüş denemesiyle
  const p = await yol(k2[0]);
  await page.mouse.move(p[0].x, p[0].y);
  await page.mouse.down();
  for (const q of p.slice(1)) await page.mouse.move(q.x, q.y, { steps: 4 });
  await page.mouse.move(p[p.length - 2].x, p[p.length - 2].y, { steps: 4 });
  beklenen((await page.textContent('#kelime')).length === Array.from(k2[0]).length - 1, 'Önceki harfe geri dönmek son harfi seçimden çıkarmalı');
  await page.mouse.move(p[p.length - 1].x, p[p.length - 1].y, { steps: 4 });
  await page.mouse.up();
  beklenen(await bulunan() === 1, 'Sürükleyerek kelime kurulmalı');
  // Dokunma: harflere tek tek tıklayıp Gönder
  const p2 = await yol(k2[1]);
  for (const q of p2) await page.mouse.click(q.x, q.y);
  beklenen((await page.textContent('#kelime')) === k2[1], 'Tek tek dokunma kelimeyi kurmalı');
  await page.mouse.click(p2[p2.length - 1].x, p2[p2.length - 1].y);
  beklenen((await page.textContent('#kelime')) === Array.from(k2[1]).slice(0, -1).join(''), 'Son harfe tekrar dokunmak onu silmeli');
  await page.mouse.click(p2[p2.length - 1].x, p2[p2.length - 1].y);
  await page.click('#gonder');
  beklenen(await bulunan() === 2, 'Gönder düğmesi kelimeyi kontrol etmeli');
  // Bir harf aynı kelimede iki kez kullanılamaz: KAYA'da tek Y var
  await yaz('YY');
  beklenen((await page.textContent('#kelime')) === 'Y', 'Aynı harf iki kez seçilmemeli');
  await page.evaluate(() => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true })));
  beklenen((await page.textContent('#kelime')) === '', 'Backspace son harfi silmeli');
  const once = await page.$$eval('.hc-harf', b => b.map(x => x.style.left + x.style.top).join());
  await page.evaluate(() => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })));
  beklenen(await page.$$eval('.hc-harf', b => b.map(x => x.style.left + x.style.top).join()) !== once, 'Boşluk harfleri karıştırmalı');

  // Süre ve duraklatma
  await ileri(3000);
  beklenen(Number(await page.getAttribute('#sure', 'data-sn')) >= 3, 'Süre işlemeli');
  // Saat gerçek zamanla da aktığı için süre, okuma ile tıklama arasında bir tik ilerleyebilir; duraklattıktan sonra okunur
  await page.click('.oyun-btn[aria-label="Duraklat"]');
  const s1 = Number(await page.getAttribute('#sure', 'data-sn'));
  await ileri(5000);
  beklenen(Number(await page.getAttribute('#sure', 'data-sn')) === s1, 'Duraklatınca süre durmalı');
  await page.click('.oyun-duraklat .btn');
  await ileri(2000);
  beklenen(Number(await page.getAttribute('#sure', 'data-sn')) > s1, 'Devam edince süre işlemeli');

  // Yarım bölüm yenilemeden sonra korunur
  await ileri(5000);
  await git('games/harf-carki/');
  beklenen((await page.textContent('#harita')).includes('Yarım kalan bölüm: 2'), 'Haritada yarım bölüm görünmeli');
  await page.click('.hc-bolum >> nth=1');
  beklenen(await bulunan() === 2, 'Yarım bölümde bulunan kelimeler korunmalı');
  for (const w of k2) await kelime(w);
  beklenen(await sonuAcik(), '2. bölüm bitmeli');
  k = await kayit();
  beklenen(k.bolumler[2] >= 1 && k.devam === null, '2. bölüm kaydedilmeli, yarım kayıt silinmeli');

  // Tema kilidi: önceki temada 20 yıldız gerekir
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('mo_harf')); s.bolumler = { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1 }; localStorage.setItem('mo_harf', JSON.stringify(s)); });
  await git('games/harf-carki/');
  beklenen(await page.locator('.hc-tema.kilitli[data-tema="1"]').count() === 1, '19 yıldızla Deniz teması kilitli olmalı');
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('mo_harf')); s.bolumler[8] = 2; localStorage.setItem('mo_harf', JSON.stringify(s)); });
  await git('games/harf-carki/');
  beklenen(await page.locator('.hc-tema.kilitli[data-tema="1"]').count() === 0, '20 yıldızla Deniz teması açılmalı');
  await page.click('.hc-tema[data-tema="1"]');
  beklenen(await page.locator('.hc-bolum:not(.kilitli)').count() === 1, 'Yeni temanın ilk bölümü açık olmalı');

  // Türkçe harf: i tuşu İ olmalı (4. bölüm: L İ Ç E)
  await page.click('.hc-tema[data-tema="0"]');
  await page.click('.hc-bolum >> nth=3');
  await page.keyboard.press('i');
  beklenen((await page.textContent('#kelime')) === 'İ', 'i tuşu İ harfini seçmeli');

  // Günlük mod: iki açılışta aynı bulmaca, ödül günde bir kez
  const dizilim = () => page.evaluate(() => [...document.querySelectorAll('.hc-harf')].map(b => b.textContent + b.style.left + b.style.top).join() + '|' + document.getElementById('izgara').dataset.toplam);
  await git('games/harf-carki/?gunluk=2026-10-24');
  const d1 = await dizilim();
  await git('games/harf-carki/?gunluk=2026-10-24');
  beklenen(d1 === await dizilim(), 'Günlük modda iki açılışta aynı bulmaca gelmeli');
  const gunlukKelimeler = await page.evaluate(() => {
    const h = [...document.querySelectorAll('.hc-harf')].map(b => b.textContent).sort().join('');
    const b = window.HarfCarkiVeri.BOLUMLER.find(x => Array.from(x.h).sort().join('') === h);
    return b.k.map(x => x[0]);
  });
  const j0 = (await kayit()).jeton;
  for (const w of gunlukKelimeler) await kelime(w);
  beklenen(await sonuAcik(), 'Günlük bulmaca bitmeli');
  beklenen((await page.textContent('.oyun-sonu h2')).includes('Günlük'), 'Günlük başlığı görünmeli');
  beklenen((await kayit()).jeton === j0 + 2, 'Günlük bulmaca 2 jeton vermeli');
  await page.click('.oyun-sonu [data-a="tekrar"]');
  for (const w of gunlukKelimeler) await kelime(w);
  beklenen(await sonuAcik(), 'Günlük bulmaca tekrar bitmeli');
  beklenen((await kayit()).jeton === j0 + 2, 'Günlük ödül aynı gün iki kez verilmemeli');

  // Görev ödülü: 5. bonus kelime "5 bonus kelime bul" görevini tamamlar
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('mo_harf')); s.gorev = { tarih: '2026-10-24', liste: ['bonus5', 'uzun6', 'kelime20'], ilerleme: { bonus5: 4 }, tamam: ['uzun6', 'kelime20'] }; localStorage.setItem('mo_harf', JSON.stringify(s)); });
  await git('games/harf-carki/');
  await page.click('.hc-tema[data-tema="0"]');
  await page.click('.hc-bolum >> nth=2');
  const j1 = await jeton();
  await kelime('OKU');
  k = await kayit();
  beklenen(k.gorev.tamam.includes('bonus5') && k.jeton === j1 + 1, 'Görev tamamlanınca 1 jeton verilmeli');

  // 360 px: en büyük ızgaralı bölüm taşmamalı
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('mo_harf')); for (let i = 1; i <= 60; i++) s.bolumler[i] = 3; localStorage.setItem('mo_harf', JSON.stringify(s)); });
  await page.setViewportSize({ width: 360, height: 740 });
  await git('games/harf-carki/');
  beklenen(!(await page.isDisabled('[data-uzun]')), '30 bölümden sonra Uzun Kelime açılmalı');
  await page.click('.hc-tema[data-tema="5"]');
  await page.click('.hc-bolum >> nth=8');
  beklenen(await page.evaluate(() => document.documentElement.scrollWidth <= 360), '360 px genişlikte yatay taşma olmamalı');
  const cark = await page.locator('#cark').boundingBox();
  beklenen(cark.width >= 200, 'Çark telefonda rahat seçilecek boyutta olmalı');

  // Uzun Kelime: 7 harfli kelime bulununca biter
  await page.click('#harita-btn');
  await page.click('[data-uzun]');
  beklenen(await page.locator('.hc-harf').count() === 7, 'Uzun Kelime 7 harfli olmalı');
  const uzun = await page.evaluate(() => {
    const h = [...document.querySelectorAll('.hc-harf')].map(b => b.textContent).sort().join('');
    return window.HarfCarkiVeri.SOZLUK.find(w => Array.from(w).sort().join('') === h);
  });
  await kelime(uzun);
  beklenen(await sonuAcik(), 'Uzun kelime bulununca mod bitmeli');
  beklenen(Number(await page.evaluate(() => localStorage.getItem('mo_best_harf-carki-uzun'))) > 0, 'Uzun Kelime rekoru kaydedilmeli');
};

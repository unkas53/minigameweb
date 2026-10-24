// Mahjong oynanış testi: motor (16 dizilim, 48 bölümün çözülebilir üretimi, aynı tohum aynı tahta, serbest taş kuralı,
// kısmi örtme, mevsim/çiçek eşleşmesi, karıştırma sonrası çözülebilirlik), bozuk kayıt, harita ve kilitler,
// serbest olmayan taşa tıklama, 1. bölümü çözüm yoluyla tıklayarak bitirip yıldız/süre/rekor kaydı (mo_mahjong),
// "Tekrar oyna", ipucu/geri al/karıştır stokları, süre ve yıldızlar, duraklatma, klavye, kilitlenme ve kaybetme,
// dünya kilidi, kilitli taşlar, taş setleri ve görev serisi, serbest mod, günlük modda aynı tahta ve 360 px.
module.exports = async function (page, { git, beklenen }) {
  await page.clock.install({ time: new Date('2026-10-24T10:00:00') });
  const ileri = ms => page.clock.runFor(ms);
  const URL = 'games/mahjong/';
  const kayit = () => page.evaluate(() => JSON.parse(localStorage.getItem('mo_mahjong')));
  const yazKayit = s => page.evaluate(s => localStorage.setItem('mo_mahjong', JSON.stringify(s)), s);
  const degistir = fn => page.evaluate(fn => { const s = JSON.parse(localStorage.getItem('mo_mahjong')); new Function('s', fn)(s); localStorage.setItem('mo_mahjong', JSON.stringify(s)); }, fn);
  const kalan = async () => Number(await page.getAttribute('#tahta', 'data-kalan'));
  const sure = async () => Number(await page.getAttribute('#sure', 'data-sn'));
  const stok = async a => Number(await page.getAttribute('#' + a, 'data-stok'));
  const desenler = () => page.$$eval('.mj-tas[data-i]', t => t.map(x => x.dataset.i + ':' + x.dataset.d).join(','));
  const sonuAcik = async () => { await ileri(700); return !!(await page.$('.oyun-sonu[open]')); };
  const tikla = i => page.click(`.mj-tas[data-i="${i}"]`);
  const oyna = async yol => { for (const [a, b] of yol) { await tikla(a); await tikla(b); } };
  const cozum = no => page.evaluate(no => { const M = window.MahjongMotor; return M.kur(M.ayar(no), MiniOyun.gunluk.rastgele('mahjong/bolum/' + no)).cozum; }, no);
  // Tahtadaki durumu (DOM) okuyup derinlik öncelikli aramayla çözer (karıştırma sonrası ve serbest mod için)
  const dcoz = () => page.evaluate(() => {
    const M = window.MahjongMotor, tas = [...document.querySelectorAll('.mj-tas[data-i]')];
    const id = document.querySelector('#tahta').dataset.dizilim;
    const L = M.konumlar(id), v = L.poz.map(() => false), d = L.poz.map(() => -1);
    tas.forEach(t => { v[t.dataset.i] = true; d[t.dataset.i] = Number(t.dataset.d); });
    const gor = new Set(), yol = [];
    let dugum = 0;
    const ara = () => {
      if (v.every(x => !x)) return true;
      const k = v.map(x => x ? 1 : 0).join('');
      if (gor.has(k) || ++dugum > 200000) return false;
      gor.add(k);
      for (const [a, b] of M.hamleler(L, v, d)) {
        v[a] = v[b] = false; yol.push([a, b]);
        if (ara()) return true;
        v[a] = v[b] = true; yol.pop();
      }
      return false;
    };
    return ara() ? yol : null;
  });
  const gorevlerTamam = { gun: '2026-10-24', liste: ['bolum3', 'yildiz3', 'tas100'], ilerleme: {}, tamam: ['bolum3', 'yildiz3', 'tas100'], odul: true };

  // Bozuk kayıt oyunu sıfırdan başlatmalı
  await git(URL);
  await page.evaluate(() => localStorage.setItem('mo_mahjong', '{bozuk'));
  await git(URL);
  beklenen(await page.isVisible('#harita'), 'Bozuk kayıtla da harita açılmalı');

  // Motor: dizilimler, 48 bölüm, serbest taş kuralı, eşleşme grupları, karıştırma
  const motor = await page.evaluate(() => {
    const M = window.MahjongMotor, h = [];
    if (M.DIZILIMLER.length !== 16) h.push('16 dizilim olmalı');
    M.DIZILIMLER.forEach(D => {
      const L = M.konumlar(D.id);
      if (L.poz.length % 2) h.push(D.id + ': tek sayıda taş');
      if (L.gen > 24) h.push(D.id + ': 12 taştan geniş');
      if (L.poz.some(p => p.z > 0 && !p.alt.length)) h.push(D.id + ': havada taş');
    });
    const katman = [[1, 2], [3, 3], [4, 4], [5, 5]], tasAralik = [[36, 72], [72, 108], [108, 132], [120, 144]];
    for (let no = 1; no <= 48; no++) {
      const o = M.ayar(no), w = o.dunya, k = M.kur(o, MiniOyun.gunluk.rastgele('mahjong/bolum/' + no));
      const k2 = M.kur(o, MiniOyun.gunluk.rastgele('mahjong/bolum/' + no));
      if (!M.dogrula(k.L, k.v, k.desen, k.cozum, k.kilit)) h.push(no + ': çözüm yolu geçersiz');
      if (k.desen.join() !== k2.desen.join()) h.push(no + ': aynı tohum farklı tahta');
      if (o.kat < katman[w][0] || o.kat > katman[w][1]) h.push(no + ': katman sayısı ' + o.kat);
      if (o.tas < tasAralik[w][0] - 4 || o.tas > tasAralik[w][1] + 4) h.push(no + ': taş sayısı ' + o.tas);
      if (k.kilit.filter(Boolean).length !== (w < 2 ? 0 : o.kilit) || (w >= 2 && !o.kilit)) h.push(no + ': kilitli taş sayısı');
      const say = {};
      k.desen.forEach(c => { say[M.grup(c)] = (say[M.grup(c)] || 0) + 1; });
      if (Object.values(say).some(n => n % 2)) h.push(no + ': tek sayıda desen');
    }
    // Tek katman: yalnızca satır uçları serbest
    const K = M.konumlar('kare'), hepsi = K.poz.map(() => true);
    const serbestler = K.poz.filter((p, i) => M.serbest(K, hepsi, i)).map(p => p.x / 2);
    if (serbestler.length !== 12 || serbestler.some(x => x !== 0 && x !== 5)) h.push('kare: yalnızca satır uçları serbest olmalı');
    // Üstü örtülü taş serbest değil; kısmi örtme de sayılır (Kalp üst katmanı yarım kaydırılmış)
    const KL = M.konumlar('kalp'), v2 = KL.poz.map(() => true);
    const ortulu = KL.poz.filter(p => p.z === 0 && p.ust.length === 1);
    if (!ortulu.length) h.push('kalp: kısmen örtülen taş bulunamadı');
    ortulu.forEach(p => {
      const u = KL.poz[p.ust[0]];
      if (u.x === p.x && u.y === p.y) h.push('kalp: tam örtme beklenmiyordu');
      const v3 = v2.slice(); if (p.sol >= 0) v3[p.sol] = false;
      if (M.serbest(KL, v3, p.i)) h.push('kalp: kısmen örtülü taş serbest sayıldı');
      v3[p.ust[0]] = false;
      if (!M.serbest(KL, v3, p.i)) h.push('kalp: üstü ve solu açılan taş serbest olmalı');
    });
    if (!M.eslesir(100, 103) || !M.eslesir(201, 202) || M.eslesir(100, 200) || !M.eslesir(5, 5) || M.eslesir(5, 6)) h.push('eşleşme grupları hatalı');
    // Karıştırma: kalan taşlar aynı desen gruplarıyla yeniden dağıtılır ve çözülebilir
    const o30 = M.ayar(30), k30 = M.kur(o30, MiniOyun.gunluk.rastgele('mahjong/bolum/30')), v = k30.v.slice();
    k30.cozum.slice(0, 15).forEach(([a, b]) => { v[a] = v[b] = false; });
    const kar = M.karistir(k30.L, v, k30.desen, MiniOyun.gunluk.rastgele('x'));
    const grupSay = (d) => { const s = {}; d.forEach((c, i) => { if (v[i]) s[M.grup(c)] = (s[M.grup(c)] || 0) + 1; }); return JSON.stringify(Object.entries(s).sort()); };
    if (!kar || !M.dogrula(k30.L, v, kar.desen, kar.cozum)) h.push('karıştırma sonrası tahta çözülemiyor');
    else if (grupSay(kar.desen) !== grupSay(k30.desen)) h.push('karıştırma desenleri değiştirdi');
    return h;
  });
  beklenen(motor.length === 0, 'Motor hatalı: ' + motor.slice(0, 5).join('; '));

  // Harita ve kilitler
  beklenen(await page.locator('.mj-dunya').count() === 4 && await page.locator('.mj-dunya.kilitli').count() === 3, '4 dünya olmalı, başta yalnızca Çay Bahçesi açık');
  beklenen(await page.locator('.mj-bolum').count() === 12 && await page.locator('.mj-bolum:not(.kilitli)').count() === 1, 'Dünyada 12 bölüm, başta yalnızca 1. bölüm açık olmalı');
  beklenen(await page.locator('.mj-gorev').count() === 3, '3 günlük görev olmalı');
  beklenen(await page.locator('[data-serbest]').count() === 0, 'Serbest mod başta boş olmalı');
  beklenen(!(await page.isDisabled('[data-set="meyve"]')) && await page.isDisabled('[data-set="hayvan"]'), 'Meyve seti açık, Hayvan kilitli olmalı');

  await yazKayit({ gorev: gorevlerTamam });
  await git(URL);

  // 1. bölüm: tahta motorla aynı; serbest olmayan taş seçilmez; seçim taşınır ve kalkar
  await page.click('.mj-bolum >> nth=0');
  beklenen(await page.isVisible('#oyun') && await page.locator('.mj-tas[data-i]').count() === 36, '1. bölüm 36 taşla açılmalı');
  const bas1 = await desenler();
  const beklenenTahta = await page.evaluate(() => {
    const M = window.MahjongMotor, k = M.kur(M.ayar(1), MiniOyun.gunluk.rastgele('mahjong/bolum/1'));
    return k.desen.map((d, i) => i + ':' + d).join(',');
  });
  beklenen(bas1 === beklenenTahta, '1. bölüm motorun tahtasıyla açılmalı');
  beklenen((await page.textContent('#uyari')).includes('1/4'), '1. bölümde eğitim gösterilmeli');
  const kapali = await page.getAttribute('.mj-tas.kapali >> nth=0', 'data-i');
  await tikla(kapali);
  beklenen(await page.locator('.mj-tas.secili').count() === 0, 'Serbest olmayan taş seçilmemeli');
  const s1 = await cozum(1);
  const farkli = await page.evaluate(([a]) => {
    const t = [...document.querySelectorAll('.mj-tas.serbest')], da = document.querySelector(`.mj-tas[data-i="${a}"]`).dataset.d;
    const f = t.find(x => x.dataset.d !== da);
    return f ? f.dataset.i : null;
  }, s1[0]);
  await tikla(s1[0][0]);
  beklenen(await page.locator('.mj-tas.secili').count() === 1, 'Serbest taş seçilmeli');
  await tikla(farkli);
  beklenen(await page.getAttribute('.mj-tas.secili', 'data-i') === farkli && await kalan() === 36, 'Farklı desen seçimi o taşa taşımalı');
  await tikla(farkli);
  beklenen(await page.locator('.mj-tas.secili').count() === 0, 'Aynı taşa tekrar dokunmak seçimi kaldırmalı');

  await oyna(s1);
  beklenen(await sonuAcik(), 'Bölüm bitince oyun sonu penceresi açılmalı');
  beklenen((await page.textContent('.oyun-sonu h2')).includes('Bölüm 1 tamam'), 'Bölüm 1 başlığı görünmeli');
  beklenen((await page.textContent('.oyun-sonu')).includes('⭐⭐⭐'), 'Hızlı ve araçsız bitiş 3 yıldız vermeli');
  let k = await kayit();
  const best1 = Number(await page.evaluate(() => localStorage.getItem('mo_best_mahjong-1')));
  beklenen(k.bolumler[1].yildiz === 3 && k.bolumler[1].enIyiSn === best1 && k.bolumler[1].enIyiPuan > 0, 'Yıldız, en iyi süre ve puan kaydedilmeli');
  beklenen(k.arac.ipucu === 4, 'İlk 3 yıldız +1 ipucu vermeli, gelen: ' + k.arac.ipucu);

  // Tekrar oyna bölümü sıfırlar
  await page.click('.oyun-sonu [data-a="tekrar"]');
  beklenen(await kalan() === 36 && await desenler() === bas1 && await sure() === 0 && !(await page.$('.oyun-sonu[open]')), 'Tekrar oyna bölümü sıfırlamalı');

  // İpucu, geri al, karıştır: stoktan düşer ve kalıcıdır
  await page.click('#ipucu');
  beklenen(await page.locator('.mj-tas.ipucu').count() === 2 && await stok('ipucu') === 3, 'İpucu eşleşen çifti göstermeli ve stoktan düşmeli');
  await ileri(1600);
  beklenen(await page.locator('.mj-tas.ipucu').count() === 0, 'İpucu 1,5 sn sonra sönmeli');
  await tikla(s1[0][0]); await tikla(s1[0][1]);
  beklenen(await kalan() === 34, 'Eşleşen iki taş kalkmalı');
  await page.click('#geri');
  beklenen(await kalan() === 36 && await desenler() === bas1 && await stok('geri') === 2, 'Geri al son eşleşmeyi geri koymalı');
  await oyna(s1);
  beklenen(await sonuAcik(), 'Araç kullanılan bölüm bitmeli');
  beklenen((await page.textContent('.oyun-sonu')).includes('⭐⭐☆'), 'Araç kullanılınca 2 yıldız gelmeli');
  k = await kayit();
  beklenen(k.bolumler[1].yildiz === 3 && k.arac.ipucu === 3 && k.arac.geri === 2, 'Kötü sonuç eski yıldızı silmemeli; stok kalıcı olmalı');
  await page.click('.oyun-sonu [data-a="tekrar"]');
  await page.click('#karistir');
  beklenen(await stok('karistir') === 1 && await kalan() === 36, 'Karıştır stoktan düşmeli');
  const kar1 = await desenler();
  beklenen(kar1 !== bas1 && kar1.split(',').map(x => x.split(':')[1]).sort().join() === bas1.split(',').map(x => x.split(':')[1]).sort().join(), 'Karıştır aynı taşları yeniden dağıtmalı');
  await oyna(await dcoz());
  beklenen(await sonuAcik(), 'Karıştırılan tahta çözülebilmeli');

  // Süre: hedefi aşan bitiş 1 yıldız; duraklatma süreyi ve girişleri durdurur
  await page.click('.oyun-sonu [data-a="kapat"]');
  await page.click('#harita-btn');
  await page.click('.mj-bolum >> nth=1');
  beklenen((await page.textContent('#bolum')) === '2' && await page.locator('.mj-tas[data-i]').count() === 36, '2. bölüm açılmalı');
  await ileri(3000);
  beklenen(await sure() === 3, 'Süre işlemeli');
  await page.keyboard.press('p');
  await ileri(5000);
  const s2 = await cozum(2);
  await page.click(`.mj-tas[data-i="${s2[0][0]}"]`, { force: true });
  beklenen(await sure() === 3 && await page.locator('.mj-tas.secili').count() === 0, 'Duraklatınca süre ve girişler durmalı');
  await page.keyboard.press('p');
  await ileri(100000);
  beklenen(await page.$eval('#sure', e => e.classList.contains('gec')), 'Hedef süre geçince süre turuncu olmalı');
  await oyna(s2);
  beklenen(await sonuAcik(), '2. bölüm bitmeli');
  k = await kayit();
  beklenen(k.bolumler[2].yildiz === 1 && k.bolumler[2].enIyiSn >= 103, 'Hedef süreyi aşan bitiş 1 yıldız vermeli');

  // Klavye: oklar yalnızca serbest taşlarda gezer, Enter seçer, H ipucu, Z geri al, S karıştır
  await page.click('.oyun-sonu [data-a="kapat"]');
  await page.click('#harita-btn');
  await page.click('.mj-bolum >> nth=2');
  for (const tus of ['ArrowRight', 'ArrowDown', 'ArrowRight', 'ArrowLeft', 'ArrowUp']) {
    await page.keyboard.press(tus);
    beklenen(await page.$eval('.mj-tas.imlec', e => e.classList.contains('serbest') && !e.classList.contains('kilitli')), 'İmleç yalnızca serbest taşlarda durmalı (' + tus + ')');
  }
  const imlec = await page.getAttribute('.mj-tas.imlec', 'data-i');
  await page.keyboard.press('Enter');
  beklenen(await page.getAttribute('.mj-tas.secili', 'data-i') === imlec, 'Enter imleçteki taşı seçmeli');
  await page.keyboard.press('Enter');
  const ip = await stok('ipucu');
  await page.keyboard.press('h');
  beklenen(await page.locator('.mj-tas.ipucu').count() === 2 && await stok('ipucu') === ip - 1, 'H ipucu vermeli');
  const s3 = await cozum(3);
  await tikla(s3[0][0]); await tikla(s3[0][1]);
  await page.keyboard.press('z');
  beklenen(await kalan() === 36, 'Z son eşleşmeyi geri almalı');
  const ks = await stok('karistir'), bas3 = await desenler();
  await page.keyboard.press('s');
  beklenen(await stok('karistir') === ks - 1 && await desenler() !== bas3, 'S karıştırmalı');

  // Kilitlenme: araç yoksa bölüm kaybedilir (skorsuz); karıştırma hakkı varsa "Hamle kalmadı" bandı çıkar
  const cikmaz = await page.evaluate(() => {
    const M = window.MahjongMotor, k = M.kur(M.ayar(1), MiniOyun.gunluk.rastgele('mahjong/bolum/1'));
    let r = 7;
    const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
    for (let d = 0; d < 5000; d++) {
      const v = k.v.slice(), yol = [];
      for (;;) {
        const h = M.hamleler(k.L, v, k.desen);
        if (!h.length) break;
        const m = h[Math.floor(rnd() * h.length)];
        v[m[0]] = v[m[1]] = false; yol.push(m);
      }
      if (v.some(x => x)) return yol;
    }
    return null;
  });
  beklenen(!!cikmaz, 'Çıkmaza giren bir hamle dizisi bulunmalı');
  await degistir('s.arac = { ipucu: 0, karistir: 0, geri: 0 };');
  await git(URL);
  await page.click('.mj-bolum >> nth=0');
  beklenen(await page.isDisabled('#ipucu') && await page.isDisabled('#karistir'), 'Stok bitince araç düğmeleri kapanmalı');
  await oyna(cikmaz);
  beklenen(await sonuAcik(), 'Araçsız kilitlenmede bölüm bitmeli');
  beklenen((await page.textContent('.oyun-sonu h2')).includes('Hamle kalmadı'), 'Kaybedince "Hamle kalmadı" görünmeli');
  beklenen((await kayit()).bolumler[1].yildiz === 3, 'Kaybetmek yıldızı silmemeli');
  await degistir('s.arac = { ipucu: 0, karistir: 1, geri: 0 };');
  await git(URL);
  await page.click('.mj-bolum >> nth=0');
  await oyna(cikmaz);
  beklenen(await page.isVisible('#band') && !(await page.$('.oyun-sonu[open]')), 'Karıştırma hakkı varken "Hamle kalmadı" bandı çıkmalı');
  await page.click('#band-karistir');
  beklenen(await page.isHidden('#band') && Number(await page.getAttribute('#tahta', 'data-olasi')) > 0, 'Karıştır kilitlenmeyi çözmeli');

  // Dünya kilidi: Kale için 12. bölüm ve toplam 20 yıldız gerekir
  await degistir('s.arac = { ipucu: 3, karistir: 2, geri: 3 }; s.bolumler = {}; for (let i = 1; i <= 12; i++) s.bolumler[i] = { yildiz: i <= 7 ? 2 : 1, enIyiSn: 50, enIyiPuan: 100 };');
  await git(URL);
  beklenen(await page.locator('.mj-dunya.kilitli[data-dunya="1"]').count() === 1, '19 yıldızla Kale kilitli olmalı');
  await degistir('s.bolumler[8].yildiz = 2;');
  await git(URL);
  beklenen(await page.locator('.mj-dunya.kilitli[data-dunya="1"]').count() === 0, '20 yıldızla Kale açılmalı');
  beklenen(!(await page.isDisabled('[data-set="hayvan"]')) && (await kayit()).acikSetler.includes('hayvan'), '15 yıldızla Hayvan seti açılmalı');
  beklenen(await page.locator('[data-serbest]').count() === 4, 'Serbest modda bitirilen dizilimler listelenmeli');

  // Taş seti seçimi kalıcı ve tahtada kullanılır
  await page.click('[data-set="hayvan"]');
  beklenen((await kayit()).set === 'hayvan', 'Seçilen set kaydedilmeli');
  await git(URL);
  await page.click('.mj-dunya[data-dunya="0"]');
  await page.click('.mj-bolum >> nth=0');
  beklenen((await page.textContent('#tahta')).match(/🐶|🐱|🐭|🐹|🐰|🦊|🐻|🐼|🐨/u), 'Hayvan setinde taşlar hayvan göstermeli');

  // Serbest mod: dizilim başına en iyi süre
  await page.click('#harita-btn');
  await page.click('[data-serbest="kare"]');
  beklenen(await page.locator('.mj-tas[data-i]').count() === 36 && (await page.textContent('#bolum')) === '🧩', 'Serbest modda Kare açılmalı');
  await ileri(4000);
  await oyna(await dcoz());
  beklenen(await sonuAcik(), 'Serbest oyun bitmeli');
  beklenen((await kayit()).serbest.kare >= 4, 'Serbest modda en iyi süre saklanmalı');

  // Kilitli taşlar (25. bölüm) ve görev serisi: üçüncü görev biter, seri 7 olur, Ürkünç seti ve araç ödülü gelir
  await degistir('for (let i = 1; i <= 24; i++) s.bolumler[i] = { yildiz: 3, enIyiSn: 50, enIyiPuan: 100 }; s.gorev = { gun: "2026-10-24", liste: ["bolum3", "yildiz3", "tas100"], ilerleme: { bolum3: 2 }, tamam: ["yildiz3", "tas100"], odul: false }; s.seri = 6; s.sonGun = "2026-10-23"; s.arac = { ipucu: 3, karistir: 2, geri: 3 };');
  await git(URL);
  await page.click('.mj-dunya[data-dunya="2"]');
  await page.click('.mj-bolum >> nth=0');
  beklenen(await page.locator('.mj-tas.kilitli').count() === 2, '25. bölümde 2 kilitli taş olmalı');
  const kilitli = await page.$$eval('.mj-tas.kilitli', t => t.map(x => x.dataset.i));
  await tikla(kilitli[0]);
  beklenen(await page.locator('.mj-tas.secili').count() === 0, 'Kilitli taş seçilememeli');
  await oyna(await cozum(25));
  beklenen(await sonuAcik(), 'Kilitli taşlı bölüm çözüm yoluyla bitmeli');
  k = await kayit();
  beklenen(k.seri === 7 && k.gorev.odul && k.arac.geri === 4, 'Üç görev bitince seri artmalı ve araç ödülü gelmeli');
  beklenen(k.acikSetler.includes('urkunc') && k.acikSetler.includes('rakam') && k.acikSetler.includes('dunya'), '7 günlük seri Ürkünç, yıldızlar Rakam ve Dünya setlerini açmalı');

  // Günlük mod: iki açılışta aynı tahta, Kale ailesinden; ipucu süre cezası; çözüm
  await git(URL + '?gunluk=2026-10-24');
  const g1 = await desenler();
  await git(URL + '?gunluk=2026-10-24');
  beklenen(g1 === await desenler(), 'Günlük modda iki açılışta aynı tahta gelmeli');
  const gunluk = await page.evaluate(() => {
    const M = window.MahjongMotor, rnd = MiniOyun.gunluk.rastgele('2026-10-24/mahjong');
    const diz = M.DUNYALAR[1].dizilim[Math.floor(rnd() * 4)], n = M.konumlar(diz).poz.length;
    const k = M.kur({ dizilim: diz, mevsim: true, desen: 30, kilit: 0, hedef: 0 }, rnd);
    return { diz, n, cozum: k.cozum };
  });
  beklenen(await page.locator('.mj-tas[data-i]').count() === gunluk.n && gunluk.n >= 72, 'Günlük tahta Kale ailesinden olmalı');
  await page.click('#ipucu');
  beklenen(await sure() === 15, 'Günlük modda ipucu 15 sn eklemeli');
  await oyna(gunluk.cozum);
  beklenen(await sonuAcik(), 'Günlük tahta bitmeli');
  beklenen((await page.textContent('.oyun-sonu h2')).includes('Günlük'), 'Günlük başlığı görünmeli');
  beklenen(Number(await page.evaluate(() => localStorage.getItem('mo_best_mahjong-gunluk'))) >= 15, 'Günlük rekor kaydedilmeli');

  // 360 px: en büyük dizilim taşmadan sığmalı; büyütünce sayfa yine taşmamalı
  await degistir('for (let i = 1; i <= 48; i++) s.bolumler[i] = { yildiz: 3, enIyiSn: 50, enIyiPuan: 100 };');
  await page.setViewportSize({ width: 360, height: 740 });
  await git(URL);
  await page.click('.mj-dunya[data-dunya="3"]');
  await page.click('.mj-bolum >> nth=11');
  beklenen(await page.locator('.mj-tas[data-i]').count() === 142, '48. bölüm Büyük Kaplumbağa olmalı');
  beklenen(await page.evaluate(() => document.documentElement.scrollWidth <= 360), '360 px genişlikte yatay taşma olmamalı');
  beklenen(await page.evaluate(() => { const s = document.querySelector('#sahne'), t = document.querySelector('#tahta'); return t.offsetWidth <= s.clientWidth; }), 'En büyük dizilim ekrana sığmalı');
  const gen1 = (await page.locator('.mj-tas[data-i] >> nth=0').boundingBox()).width;
  beklenen(gen1 >= 20, 'Taşlar telefonda dokunulacak genişlikte olmalı, gelen: ' + gen1);
  await page.click('#buyut');
  await page.click('#buyut');
  const gen2 = (await page.locator('.mj-tas[data-i] >> nth=0').boundingBox()).width;
  beklenen(gen2 > gen1 && await page.evaluate(() => document.documentElement.scrollWidth <= 360), '⊕ tahtayı büyütmeli, sayfa taşmamalı');
  await page.click('#kucult');
  await page.click('#kucult');
  await page.click('#kucult');
  beklenen((await page.locator('.mj-tas[data-i] >> nth=0').boundingBox()).width < gen1, '⊖ tahtayı küçültmeli');
};

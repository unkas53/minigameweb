// Kelime Tahmin oynanış testi: kelime listeleri, renk mantığı (tekrarlanan harfler), geçersiz tahmin,
// i/İ ayrımı, ekran klavyesi renkleri, kayıt, kazanma, rekor, paylaşım, zor mod, kaybetme ve günlük mod.
module.exports = async function (page, { git, beklenen }) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const ALF = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ';
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('kelime-tahmin-kayit')));
  const tries = () => page.textContent('#tries');
  const rowText = r => page.$$eval(`#grid .kt-row:nth-child(${r + 1}) .kt-tile`, ts => ts.map(t => t.textContent).join(''));
  const rowColors = r => page.$$eval(`#grid .kt-row:nth-child(${r + 1}) .kt-tile`, ts => ts.map(t => ['yesil', 'sari', 'gri'].find(c => t.classList.contains(c)) || ''));
  const keyColor = k => page.$eval(`.kt-key[data-key="${k}"]`, b => ['yesil', 'sari', 'gri'].find(c => b.classList.contains(c)) || '');
  const warning = () => page.textContent('#uyari');
  function score(g, t) {
    g = Array.from(g); t = Array.from(t);
    const res = [], left = {};
    for (let i = 0; i < 5; i++) { if (g[i] === t[i]) res[i] = 'yesil'; else left[t[i]] = (left[t[i]] || 0) + 1; }
    for (let i = 0; i < 5; i++) { if (res[i]) continue; if (left[g[i]]) { res[i] = 'sari'; left[g[i]]--; } else res[i] = 'gri'; }
    return res;
  }
  // Ekran klavyesiyle yazıp gönderir
  async function guess(word) {
    for (const ch of Array.from(word)) await page.click(`.kt-key[data-key="${ch}"]`);
    await page.click('.kt-key[data-key="ENTER"]');
  }
  // Gizli kelimeyi belirleyip oyunu yeniden açar
  async function setAnswer(word, level, path) {
    await page.evaluate(([w, l]) => {
      const idx = window.KelimeTahminListe.CEVAPLAR.indexOf(w);
      localStorage.setItem('kelime-tahmin-kayit', JSON.stringify({ idx, guesses: [], level: l, daily: '' }));
    }, [word, level]);
    await git(path || 'games/kelime-tahmin/');
  }

  await git('games/kelime-tahmin/');
  beklenen(await page.$$eval('#grid .kt-tile', ts => ts.length) === 30, '5x6 ızgara olmalı');
  beklenen(await page.$$eval('.kt-sira:nth-child(2) .kt-key', ks => ks.length) === 11, 'Klavyenin 2. sırasında 11 tuş olmalı');

  // Kelime listeleri
  const L = await page.evaluate(() => window.KelimeTahminListe);
  const all = L.CEVAPLAR.concat(L.GECERLI);
  beklenen(all.every(w => Array.from(w).length === 5 && Array.from(w).every(c => ALF.includes(c))), 'Tüm kelimeler tam 5 Türkçe büyük harf olmalı');
  beklenen(new Set(L.CEVAPLAR).size === L.CEVAPLAR.length && new Set(L.GECERLI).size === L.GECERLI.length, 'Listelerde tekrar olmamalı');
  beklenen(L.CEVAPLAR.every(w => L.GECERLI.includes(w)), 'CEVAPLAR GECERLI içinde olmalı');
  beklenen(L.CEVAPLAR.length >= 400 && L.GECERLI.length >= 2000, `Liste boyutları yetersiz (${L.CEVAPLAR.length}/${L.GECERLI.length})`);
  for (const w of ['KALEM', 'KİTAP', 'IRMAK', 'KAZAK', 'KAŞIK']) beklenen(L.CEVAPLAR.includes(w), w + ' cevap listesinde olmalı');

  // Eksik harf ve listede olmayan kelime deneme harcamaz
  await setAnswer('KALEM', 'normal');
  await guess('KAL');
  beklenen(await warning() === 'Yeterli harf yok' && await tries() === '0/6', 'Eksik harf reddedilmeli');
  for (let i = 0; i < 3; i++) await page.click('.kt-key[data-key="SIL"]');
  await guess('ZZZZZ');
  beklenen(await warning() === 'Listede yok' && await tries() === '0/6', 'Listede olmayan kelime reddedilmeli');
  for (let i = 0; i < 5; i++) await page.keyboard.press('Backspace');
  beklenen(await rowText(0) === '', 'Backspace harfleri silmeli');

  // Fiziksel klavye: küçük i -> İ, ı -> I
  await page.keyboard.press('k');
  await page.keyboard.press('i');
  await page.keyboard.press('t');
  await page.keyboard.press('a');
  await page.keyboard.press('p');
  beklenen(await rowText(0) === 'KİTAP', `Küçük i büyük İ olmalı (${await rowText(0)})`);
  for (let i = 0; i < 5; i++) await page.keyboard.press('Backspace');
  // Türkçe ı tuşu ABD klavye düzeninde yok; olayı doğrudan gönder
  await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ı', bubbles: true })));
  beklenen(await rowText(0) === 'I', 'ı harfi I olmalı');
  await page.keyboard.press('Backspace');

  // Tekrarlanan harfler: gizli KALEM, tahmin KAZAK -> K, A yeşil; Z, A, K gri
  await page.keyboard.type('kazak');
  await page.keyboard.press('Enter');
  beklenen(await tries() === '1/6', 'Geçerli tahmin denemeyi artırmalı');
  beklenen((await rowColors(0)).join() === 'yesil,yesil,gri,gri,gri', `KAZAK renkleri yanlış (${await rowColors(0)})`);
  beklenen(await page.isDisabled('#level'), 'Oyun ortasında zorluk değişmemeli');

  // Rastgele seçilen tekrarlı harfli tahminlerle renk mantığı
  const doubles = L.GECERLI.filter(w => new Set(Array.from(w)).size < 5 && w !== 'KALEM');
  const picks = [doubles[7], doubles[Math.floor(doubles.length / 2)], doubles[doubles.length - 3]];
  for (let i = 0; i < picks.length; i++) {
    await guess(picks[i]);
    beklenen((await rowColors(i + 1)).join() === score(picks[i], 'KALEM').join(), `${picks[i]} renkleri yanlış (${await rowColors(i + 1)})`);
  }
  beklenen(await keyColor('K') === 'yesil', 'K tuşu yeşil kalmalı');
  beklenen(await keyColor('Z') === 'gri', 'Z tuşu gri olmalı');

  // Sayfa yenilenince oyun devam eder
  await git('games/kelime-tahmin/');
  beklenen(await tries() === '4/6' && await rowText(0) === 'KAZAK', 'Sayfa yenilenince oyun devam etmeli');

  // Ekran klavyesinde yeşil tuş sarıya düşmez: K başka yerde
  const kSari = L.GECERLI.find(w => w[0] !== 'K' && w.includes('K') && !w.includes('Z'));
  await guess(kSari);
  beklenen(await keyColor('K') === 'yesil', 'Yeşil tuş sarıya düşmemeli');

  // Kazan
  await guess('KALEM');
  await page.waitForSelector('.oyun-sonu[open]', { timeout: 3000 });
  beklenen(await page.evaluate(() => localStorage.getItem('kelime-tahmin-en-iyi-normal')) === '6', 'En iyi sonuç kaydedilmeli');
  beklenen(!(await page.$('.oyun-sonu .oyun-sonu-rekor[hidden]')), 'İlk kazanç rekor olmalı');
  beklenen(await state() === null, 'Biten oyunun kaydı silinmeli');
  const share = await page.$eval('.oyun-sonu', d => d.dataset.paylas);
  beklenen(share.startsWith('Kelime Tahmin 6/6') && !/[A-ZÇĞİÖŞÜ]{5}/.test(share.split('\n').slice(1).join('')) && share.split('\n').length === 7, 'Paylaşım yalnızca emoji ızgarası içermeli');
  let st = await page.evaluate(() => JSON.parse(localStorage.getItem('kelime-tahmin-istatistik')));
  beklenen(st.oynanan === 1 && st.kazanilan === 1 && st.seri === 1 && st.dagilim[5] === 1, 'İstatistik güncellenmeli');

  await page.click('.oyun-sonu [data-a="tekrar"]');
  beklenen(await tries() === '0/6' && await rowText(0) === '' && !(await page.isDisabled('#level')), '"Tekrar oyna" yeni oyun açmalı');

  // Zor mod: yeşil harf korunmalı, sarı harf kullanılmalı; rekor ayrı
  await page.selectOption('#level', 'zor');
  await setAnswer('KALEM', 'zor');
  await guess('KAZAK');
  const noK = L.GECERLI.find(w => w[0] !== 'K' && w[1] === 'A');
  await guess(noK);
  beklenen(await warning() === '1. harf K olmalı' && await tries() === '1/6', `Zor modda ipucuna uymayan tahmin reddedilmeli (${await warning()})`);
  for (let i = 0; i < 5; i++) await page.click('.kt-key[data-key="SIL"]');
  await setAnswer('KAŞIK', 'zor');
  await guess('ARMUT');
  const noA = L.GECERLI.find(w => !w.includes('A'));
  await guess(noA);
  beklenen(await warning() === 'Tahmin A harfini içermeli', `Zor modda sarı/yeşil harf zorunlu olmalı (${await warning()})`);
  for (let i = 0; i < 5; i++) await page.click('.kt-key[data-key="SIL"]');
  await guess('KAŞIK');
  await page.waitForSelector('.oyun-sonu[open]', { timeout: 3000 });
  beklenen(await page.evaluate(() => localStorage.getItem('kelime-tahmin-en-iyi-zor')) === '2', 'Zor modun rekoru ayrı tutulmalı');
  beklenen((await page.$eval('.oyun-sonu', d => d.dataset.paylas)).startsWith('Kelime Tahmin 2/6*'), 'Zor mod paylaşımında * olmalı');
  await page.click('.oyun-sonu [data-a="kapat"]');

  // Kaybet: 6 yanlış tahmin, gizli kelime gösterilir, seri sıfırlanır
  await setAnswer('KALEM', 'normal');
  const wrong = L.GECERLI.filter(w => w !== 'KALEM').slice(0, 6);
  for (const w of wrong) await guess(w);
  await page.waitForSelector('.oyun-sonu[open]', { timeout: 3000 });
  beklenen((await page.textContent('.oyun-sonu .oyun-sonu-metin')).includes('KALEM'), 'Kaybedince gizli kelime gösterilmeli');
  st = await page.evaluate(() => JSON.parse(localStorage.getItem('kelime-tahmin-istatistik')));
  beklenen(st.oynanan === 3 && st.kazanilan === 2 && st.seri === 0 && st.enUzun === 2, 'Kayıpta seri sıfırlanmalı');
  beklenen((await page.$eval('.oyun-sonu', d => d.dataset.paylas)).startsWith('Kelime Tahmin X/6'), 'Kayıp paylaşımı X/6 olmalı');
  await page.click('.oyun-sonu [data-a="kapat"]');

  // İstatistik penceresi
  await page.click('#stats');
  beklenen(await page.$$eval('#dagilim > div', ds => ds.length) === 6, 'Deneme dağılımı 6 satır olmalı');
  await page.click('#ist-kapat');

  // Yüksek kontrast tercihi saklanır
  await page.click('#kontrast');
  await git('games/kelime-tahmin/');
  beklenen(await page.$eval('#wrap', w => w.classList.contains('kontrast')), 'Yüksek kontrast tercihi saklanmalı');

  // Günlük mod: aynı tarih aynı kelime
  await git('games/kelime-tahmin/?gunluk=2026-10-24');
  const d1 = (await state()).idx;
  await page.evaluate(() => localStorage.removeItem('kelime-tahmin-kayit'));
  await git('games/kelime-tahmin/?gunluk=2026-10-24');
  const d2 = (await state()).idx;
  beklenen(d1 === d2 && (await state()).daily === '2026-10-24', 'Günlük modda kelime aynı olmalı');
};

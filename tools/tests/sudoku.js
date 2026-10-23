// Sudoku oynanış testi: ipucu kareleri, not modu, hata, geri al, ipucu, kayıt, kazanma, kaybetme ve günlük mod.
module.exports = async function (page, { git, beklenen }) {
  const cell = i => `#grid .cell >> nth=${i}`;
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('sudoku-kayit')));
  const givens = () => page.$$eval('#grid .cell.given', cs => cs.length);

  await git('games/sudoku/');
  beklenen(await page.$$eval('#grid .cell', cs => cs.length) === 81, '81 kare olmalı');
  const n = await givens();
  beklenen(n >= 40 && n <= 45, `Kolay seviyede 40-45 ipucu olmalı (${n})`);
  let s = await state();
  beklenen(s && s.solution.every(v => v >= 1 && v <= 9), 'Oyun kaydı çözümü içermeli');

  // Süre işler, duraklatınca durur
  await page.waitForTimeout(1200);
  await page.click('.oyun-btn[aria-label="Duraklat"]');
  const t = await page.textContent('#time');
  beklenen(t !== '0:00', 'Süre ilerlemeli');
  await page.waitForTimeout(1300);
  beklenen(await page.textContent('#time') === t, 'Duraklatılınca süre durmalı');
  await page.click('.oyun-duraklat .btn');

  // İpucu karesi değiştirilemez
  const g = s.puzzle.findIndex(v => v);
  await page.click(cell(g));
  await page.keyboard.press(String(s.puzzle[g] % 9 + 1));
  await page.keyboard.press('Backspace');
  beklenen(await page.textContent(cell(g)) === String(s.puzzle[g]), 'İpucu karesi değişmemeli');

  // Not modu: aday rakam yazılır, doğru rakam yerleşince komşudaki not silinir
  const empties = s.puzzle.map((v, i) => v ? -1 : i).filter(i => i >= 0);
  const a = empties[0];
  const peer = empties.find(i => i !== a && Math.floor(i / 9) === Math.floor(a / 9));
  const d = s.solution[a];
  await page.click(cell(peer));
  await page.keyboard.press('n');
  await page.keyboard.press(String(d));
  beklenen((await page.textContent(cell(peer))).includes(String(d)), 'Not modunda aday rakam yazılmalı');
  await page.keyboard.press('n');
  await page.click(cell(a));
  await page.keyboard.press(String(d));
  beklenen(!(await page.textContent(cell(peer))).includes(String(d)), 'Doğru rakam komşu nottan silinmeli');

  // Yanlış rakam: kırmızı ve hata sayacı; geri al temizler
  const b = empties[1];
  const bad = s.solution[b] % 9 + 1;
  await page.click(cell(b));
  await page.keyboard.press(String(bad));
  beklenen(await page.$eval(`#grid .cell:nth-child(${b + 1})`, c => c.classList.contains('wrong')), 'Yanlış rakam kırmızı olmalı');
  beklenen(await page.textContent('#mistakes') === '1/3', 'Hata sayacı artmalı');
  await page.click('#undo');
  beklenen(await page.textContent(cell(b)) === '', 'Geri al yanlış rakamı kaldırmalı');

  // İpucu seçili kareye doğru rakamı yazar
  await page.click('#hint');
  beklenen(await page.textContent(cell(b)) === String(s.solution[b]), 'İpucu doğru rakamı yazmalı');
  beklenen(await page.textContent('#hint b') === '2', 'İpucu hakkı azalmalı');

  // Yenileme sonrası oyun kaldığı yerden devam eder
  await git('games/sudoku/');
  beklenen(await page.textContent(cell(b)) === String(s.solution[b]) && await page.textContent('#mistakes') === '1/3', 'Sayfa yenilenince oyun devam etmeli');

  // Kalan kareleri doldurup kazan
  s = await state();
  for (let i = 0; i < 81; i++) {
    if (s.puzzle[i] || s.vals[i] === s.solution[i]) continue;
    await page.click(cell(i));
    await page.keyboard.press(String(s.solution[i]));
  }
  await page.waitForSelector('.oyun-sonu[open]', { timeout: 3000 });
  beklenen(!(await page.$('.oyun-sonu .oyun-sonu-rekor[hidden]')), 'İlk çözüm rekor olmalı');
  beklenen(await page.evaluate(() => localStorage.getItem('sudoku-en-iyi-kolay')) !== null, 'En iyi süre kaydedilmeli');
  beklenen(await state() === null, 'Biten oyunun kaydı silinmeli');

  await page.click('.oyun-sonu [data-a="tekrar"]');
  s = await state();
  beklenen(await page.textContent('#mistakes') === '0/3' && await page.textContent('#time') === '0:00' && s.vals.every(v => !v), '"Tekrar oyna" yeni bulmaca açmalı');

  // Zor seviye ve 3 hatada kaybetme
  await page.selectOption('#level', 'zor');
  s = await state();
  const z = s.puzzle.filter(v => v).length;
  beklenen(s.level === 'zor' && z >= 24 && z <= 30, `Zor seviyede ipucu sayısı 26-30 civarı olmalı (${z})`);
  const e = s.puzzle.findIndex(v => !v);
  await page.click(cell(e));
  for (let k = 1; k <= 9 && !(await page.isVisible('#end')); k++) {
    if (k !== s.solution[e]) await page.keyboard.press(String(k));
  }
  await page.waitForSelector('.oyun-sonu[open]', { timeout: 3000 });
  beklenen(await page.textContent('#mistakes') === '3/3', '3 hatada oyun bitmeli');
  await page.click('.oyun-sonu [data-a="kapat"]');
  await page.click('#retry');
  beklenen(await page.textContent('#mistakes') === '0/3' && (await state()).puzzle.join() === s.puzzle.join(), '"Tekrar dene" aynı bulmacayı baştan açmalı');

  // Günlük mod: aynı bulmaca, orta seviye
  await git('games/sudoku/?gunluk=2026-10-24');
  const p1 = await page.$$eval('#grid .cell', cs => cs.map(c => c.textContent).join(','));
  await git('games/sudoku/?gunluk=2026-10-24');
  beklenen(p1 === await page.$$eval('#grid .cell', cs => cs.map(c => c.textContent).join(',')), 'Günlük modda bulmaca aynı olmalı');
  beklenen(await page.inputValue('#level') === 'orta', 'Günlük bulmaca orta seviye olmalı');
};

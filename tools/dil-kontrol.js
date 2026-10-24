// Çeviri durumu: sayfaları seçilen dilde tarayıcıda açar, js/dil.js'in çeviremediği Türkçe metinleri toplar.
// Kullanım: node tools/dil-kontrol.js <kod> [--sayfa oyun/2048] [--oyna] [--yaz]
//   --sayfa: yalnızca bu sözlüğe ait sayfalar (ör. oyun/2048, sayfa/index, sayfa/kategori)
//   --oyna:  oyun sayfalarında tools/tests/<slug>.js oynanış testini de o dilde çalıştırır; oyun sırasında çıkan
//            metinler de toplanır (test Türkçe metin aradığı için yarıda kalabilir, bu normaldir)
//   --yaz:   eksik metinleri boş değerle ("") sözlüklere ekler. Birden çok sözlükte görülen metin ortak.json'a,
//            diğerleri sayfanın sözlüğüne (diller/<kod>/<sayfa>.json) gider. Sonra boş değerleri çevirin.
// Araç başta `npm run build` çalıştırır (yeni sözlük dosyaları sayfalara bağlansın diye).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const { ROOT, BASE, serve, chromePath, sayfalar, sozlukAdi } = require('./yerel');

const args = process.argv.slice(2);
const kod = args[0];
const opt = n => args.includes(n);
const deger = n => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
if (!kod || !/^[a-z]{2}$/.test(kod) || kod === 'tr') {
  console.error('Kullanım: node tools/dil-kontrol.js <kod> [--sayfa oyun/2048] [--oyna] [--yaz]   (kod: en, de, es...)');
  process.exit(1);
}
const dilDir = path.join(ROOT, 'diller', kod);
const listeYolu = path.join(ROOT, 'diller', 'diller.json');
const liste = JSON.parse(fs.readFileSync(listeYolu, 'utf8'));
if (!liste.some(d => d.kod === kod)) {
  console.error(`"${kod}" diller/diller.json içinde yok. Önce { "kod": "${kod}", "ad": "<dilin kendi dilindeki adı>" } ekleyin.`);
  process.exit(1);
}
if (!fs.existsSync(path.join(dilDir, 'ortak.json'))) {
  fs.mkdirSync(dilDir, { recursive: true });
  fs.writeFileSync(path.join(dilDir, 'ortak.json'), '{}\n');
  console.log(`diller/${kod}/ortak.json oluşturuldu. Bu dil, ortak.json tamamen çevrilmeden push edilmemeli.`);
}
execFileSync(process.execPath, [path.join(__dirname, 'build-pages.js')], { stdio: 'pipe' });

const dosya = ad => path.join(dilDir, ad + '.json');
const oku = ad => { try { return JSON.parse(fs.readFileSync(dosya(ad), 'utf8')); } catch (e) { return null; } };

(async () => {
  const PORT = 8791;
  const server = serve(PORT);
  const origin = `http://localhost:${PORT}${BASE}`;
  const { pages } = sayfalar();
  const secili = deger('--sayfa');
  const hedef = pages.filter(p => !secili || sozlukAdi(p) === secili);
  if (!hedef.length) { console.error(`"${secili}" için sayfa bulunamadı.`); server.close(); process.exit(1); }

  const browser = await chromium.launch({ executablePath: chromePath() });
  const gorulen = new Map(); // metin -> Set(sözlük adı)
  const sayfaEksik = {};
  for (const p of hedef) {
    const ad = sozlukAdi(p);
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', locale: kod });
    await ctx.addInitScript(() => { try { localStorage.setItem('mo_cookie_consent', 'rejected'); } catch (e) {} window.MO_SUNUCU_KAPALI = true; window.MO_DIL_TOPLA = true; });
    await ctx.route('https://gc.zgo.at/**', r => r.fulfill({ body: '', contentType: 'text/javascript' }));
    await ctx.route('https://*.supabase.co/**', r => r.abort());
    const page = await ctx.newPage();
    const topla = async () => {
      try {
        const list = await page.evaluate(() => (window.MO_DIL ? MO_DIL.eksik() : []));
        list.forEach(s => { if (!gorulen.has(s)) gorulen.set(s, new Set()); gorulen.get(s).add(ad); (sayfaEksik[p] = sayfaEksik[p] || new Set()).add(s); });
      } catch (e) {}
    };
    const git = async q => {
      await topla();
      await page.goto(origin + q + (q.includes('?') ? '&' : '?') + 'lang=' + kod);
      await page.evaluate(() => new Promise(r => MO_DIL.hazir(r)));
      await page.waitForTimeout(200);
    };
    await git(p);
    // Kapalı pencerelerdeki metinler için: yardım penceresini aç, oyunu duraklatıp devam ettir
    if (p.startsWith('games/')) {
      try {
        await page.evaluate(() => [...document.querySelectorAll('.oyun-arac .oyun-btn')].filter(b => /❓|⏸️/.test(b.textContent)).forEach(b => b.click()));
        await page.waitForTimeout(200);
        await topla();
        await page.goto(origin + p + '?lang=' + kod);
        await page.waitForTimeout(200);
      } catch (e) {}
    }
    if (opt('--oyna') && p.startsWith('games/')) {
      const file = path.join(__dirname, 'tests', p.split('/')[1] + '.js');
      if (fs.existsSync(file)) {
        try {
          await require(file)(page, { git, beklenen: () => {} });
        } catch (e) {
          console.log(`  (${p}: oynanış testi bu dilde yarıda kaldı: ${e.message.split('\n')[0].slice(0, 100)})`);
        }
      }
    }
    await topla();
    await ctx.close();
  }
  await browser.close();
  server.close();

  // Sayı içeren metinler kalıba dönüşür ("Bölüm 3, kilitli" -> "Bölüm {0}, kilitli"): aynı kalıptan birden çok metin
  // görüldüyse veya metin kısaysa. Uzun cümlelerdeki sabit sayılar (ör. "1-9 rakamlarını") düz metin kalır.
  {
    const gruplar = new Map();
    for (const s of gorulen.keys()) {
      if (s.includes('<') || !/\d/.test(s)) continue;
      let i = 0;
      const k = s.replace(/\d+/g, () => `{${i++}}`);
      if (i > 9) continue;
      if (!gruplar.has(k)) gruplar.set(k, []);
      gruplar.get(k).push(s);
    }
    for (const [k, list] of gruplar) {
      if (list.length < 2 && k.length >= 40) continue;
      const adlar = new Set();
      list.forEach(s => { gorulen.get(s).forEach(a => adlar.add(a)); gorulen.delete(s); });
      gorulen.set(k, adlar);
    }
  }

  // Metni hangi sözlüğe yazmalı?
  const ortak = oku('ortak') || {};
  const yeni = {};
  for (const [s, adlar] of gorulen) {
    const hedefAd = adlar.size > 1 || s in ortak ? 'ortak' : [...adlar][0];
    (yeni[hedefAd] = yeni[hedefAd] || []).push(s);
  }

  console.log(`\nDil: ${kod} — ${hedef.length} sayfa tarandı${opt('--oyna') ? ' (oynanışla)' : ''}\n`);
  for (const p of hedef) {
    const n = sayfaEksik[p] ? sayfaEksik[p].size : 0;
    const sozluk = oku(sozlukAdi(p));
    console.log(`${n ? '✗' : '✓'} ${p || '/'}  eksik: ${n}${sozluk ? '' : `  (diller/${kod}/${sozlukAdi(p)}.json yok)`}`);
  }
  // Sözlüklerdeki boş değerler
  const bos = [];
  for (const f of fs.readdirSync(dilDir, { recursive: true }).map(String).filter(f => f.endsWith('.json'))) {
    const ad = f.replace(/\.json$/, '').split(path.sep).join('/');
    const n = Object.values(oku(ad) || {}).filter(v => !v).length;
    if (n) bos.push(`${ad}.json: ${n} boş çeviri`);
  }
  if (bos.length) console.log('\nBoş değerler (çevrilmeli):\n- ' + bos.join('\n- '));

  const toplam = [...gorulen.keys()].length;
  if (toplam) {
    console.log(`\nÇevrilmemiş ${toplam} metin:`);
    for (const ad of Object.keys(yeni).sort()) {
      console.log(`\n[${ad}.json]`);
      yeni[ad].forEach(s => console.log('  ' + JSON.stringify(s)));
    }
  }
  if (opt('--yaz') && toplam) {
    for (const ad of Object.keys(yeni)) {
      const veri = oku(ad) || {};
      yeni[ad].forEach(s => { if (!(s in veri)) veri[s] = ''; });
      fs.mkdirSync(path.dirname(dosya(ad)), { recursive: true });
      fs.writeFileSync(dosya(ad), JSON.stringify(veri, null, 2) + '\n');
    }
    execFileSync(process.execPath, [path.join(__dirname, 'build-pages.js')], { stdio: 'pipe' });
    console.log(`\n${toplam} metin boş değerle sözlüklere eklendi. Boş ("") değerleri çevirin, sonra npm run build ve bu aracı tekrar çalıştırın.`);
  }
  if (!toplam && !bos.length) console.log('\nTüm taranan metinler çevrilmiş.');
})();

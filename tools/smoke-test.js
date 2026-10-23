// Tüm sayfaları gerçek tarayıcıda açar; JS hatası, kırık bağlantı ve yatay taşma arar.
// Ardından her oyunun tools/tests/<slug>.js oynanış testini çalıştırır (yalnızca bir oyun için: --oyun <slug>).
// Kullanım: npm install && node tools/smoke-test.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const BASE = '/minigameweb/'; // GitHub Pages alt klasörünü taklit eder
const PORT = 8790;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

function serve() {
  return http.createServer((req, res) => {
    let url = decodeURIComponent(req.url.split('?')[0]);
    if (!url.startsWith(BASE)) { res.writeHead(404); return res.end(); }
    let file = path.join(ROOT, url.slice(BASE.length));
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  }).listen(PORT);
}

function chromePath() {
  // Bulut ortamında önceden kurulu Chromium varsa onu kullan
  const dir = '/opt/pw-browsers';
  if (!fs.existsSync(dir)) return undefined;
  for (const d of fs.readdirSync(dir).filter(d => /^chromium-\d+$/.test(d))) {
    for (const sub of ['chrome-linux64', 'chrome-linux']) {
      const p = path.join(dir, d, sub, 'chrome');
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined;
}

(async () => {
  const server = serve();
  const games = JSON.parse(fs.readFileSync(path.join(ROOT, 'games.json'), 'utf8'));
  const katDir = path.join(ROOT, 'kategori');
  const cats = fs.existsSync(katDir) ? fs.readdirSync(katDir).filter(d => fs.statSync(path.join(katDir, d)).isDirectory()) : [];
  const pages = ['', 'hakkinda.html', 'iletisim.html', 'gizlilik.html', 'cerezler.html', 'profil.html', 'gunluk.html', 'kategori/']
    .concat(cats.map(c => 'kategori/' + c + '/'))
    .concat(games.map(g => 'games/' + g.slug + '/'));
  const origin = `http://localhost:${PORT}${BASE}`;
  const errors = [];
  // Ana sayfa, kategori sayfaları, menüler ve sitemap games.json ile uyumlu mu?
  try {
    execFileSync(process.execPath, [path.join(__dirname, 'build-pages.js'), '--check'], { stdio: 'pipe' });
  } catch (e) {
    errors.push(String(e.stderr || e.stdout || e.message).trim());
  }
  const checkedLinks = new Set();

  const browser = await chromium.launch({ executablePath: chromePath() });
  for (const vp of [{ name: 'masaustu', width: 1280, height: 900 }, { name: 'mobil', width: 360, height: 740 }]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.route('https://gc.zgo.at/**', r => r.fulfill({ body: '', contentType: 'text/javascript' }));
    page.on('pageerror', e => errors.push(`[${vp.name}] JS hatası ${page.url()}: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') errors.push(`[${vp.name}] konsol ${page.url()}: ${m.text()}`); });
    page.on('response', r => { if (r.status() >= 400) errors.push(`[${vp.name}] ${r.status()} ${r.url()}`); });

    for (const p of pages) {
      await page.goto(origin + p);
      await page.waitForTimeout(300);
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      if (width > vp.width) errors.push(`[${vp.name}] yatay taşma ${p || '/'}: ${width}px`);
      const h1 = await page.$$eval('h1', els => els.length);
      if (h1 !== 1) errors.push(`[${vp.name}] ${p || '/'} sayfasında ${h1} adet h1 var`);
      const links = await page.$$eval('a[href]', as => as.map(a => a.href));
      for (const l of links.filter(l => l.startsWith(origin))) {
        const clean = l.split('#')[0];
        if (checkedLinks.has(clean)) continue;
        checkedLinks.add(clean);
        const r = await page.request.get(clean);
        if (r.status() >= 400) errors.push(`kırık bağlantı ${clean} (${p || '/'} sayfasında)`);
      }
      if (p.startsWith('games/')) {
        const tools = await page.$$eval('.oyun-arac .oyun-btn', els => els.length);
        if (tools < 3) errors.push(`[${vp.name}] ${p} sayfasında ortak oyun araç çubuğu yok (js/oyun.js yüklenmemiş olabilir)`);
      }
      const abs = await page.$$eval('[href^="/"]:not([href^="//"]), [src^="/"]:not([src^="//"])', els => els.map(e => e.outerHTML.slice(0, 80)));
      abs.forEach(a => errors.push(`mutlak yol kullanılmış ${p || '/'}: ${a}`));
    }
    await page.close();
  }

  // Kayıtlı her oyun ana sayfada listelenmeli ve sitemap'te olmalı
  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  for (const g of games) {
    if (!index.includes(`games/${g.slug}/`)) errors.push(`${g.slug} ana sayfada yok`);
    if (!sitemap.includes(`games/${g.slug}/`)) errors.push(`${g.slug} sitemap.xml içinde yok`);
  }
  for (const c of cats) {
    if (!sitemap.includes(`kategori/${c}/`)) errors.push(`kategori/${c}/ sitemap.xml içinde yok`);
  }

  // Oynanış testleri: her oyun temiz bir tarayıcı profilinde oynanır
  const only = process.argv.includes('--oyun') ? process.argv[process.argv.indexOf('--oyun') + 1] : null;
  let played = 0;
  for (const g of games.filter(x => !only || x.slug === only)) {
    const file = path.join(__dirname, 'tests', g.slug + '.js');
    if (!fs.existsSync(file)) { errors.push(`${g.slug}: oynanış testi yok (tools/tests/${g.slug}.js)`); continue; }
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
    await ctx.addInitScript(() => { try { localStorage.setItem('mo_cookie_consent', 'rejected'); } catch (e) {} });
    await ctx.route('https://gc.zgo.at/**', r => r.fulfill({ body: '', contentType: 'text/javascript' }));
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`[oynanış] ${g.slug} JS hatası: ${e.message}`));
    const helpers = {
      git: async p => { await page.goto(origin + p); await page.waitForTimeout(200); },
      beklenen: (ok, msg) => { if (!ok) throw new Error(msg); }
    };
    try {
      await require(file)(page, helpers);
      played++;
    } catch (e) {
      errors.push(`[oynanış] ${g.slug}: ${e.message.split('\n')[0]}`);
    }
    await ctx.close();
  }

  // Sunucu arayüzü (sahte istemciyle): liderlik tablosu, skor gönderme, hesap
  if (!only) {
    const sv = require(path.join(__dirname, 'tests', '_sunucu.js'));
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
    await ctx.addInitScript(() => { try { localStorage.setItem('mo_cookie_consent', 'rejected'); } catch (e) {} });
    await ctx.addInitScript(sv.sahte);
    await ctx.route('https://gc.zgo.at/**', r => r.fulfill({ body: '', contentType: 'text/javascript' }));
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`[sunucu] JS hatası: ${e.message}`));
    try {
      await sv.test(page, {
        git: async p => { await page.goto(origin + p); await page.waitForTimeout(200); },
        beklenen: (ok, msg) => { if (!ok) throw new Error(msg); }
      });
    } catch (e) {
      errors.push(`[sunucu] ${e.message.split('\n')[0]}`);
    }
    await ctx.close();
  }

  await browser.close();
  server.close();
  const unique = [...new Set(errors)];
  if (unique.length) {
    console.log(`BAŞARISIZ: ${unique.length} sorun\n- ` + unique.join('\n- '));
    process.exit(1);
  }
  console.log(`BAŞARILI: ${pages.length} sayfa, ${checkedLinks.size} bağlantı, 2 ekran boyutu, ${played} oyunun oynanış testi${only ? '' : ' ve sunucu arayüzü'} kontrol edildi.`);
})();

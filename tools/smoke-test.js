// Tüm sayfaları gerçek tarayıcıda açar; JS hatası, kırık bağlantı ve yatay taşma arar.
// Ardından her oyunun tools/tests/<slug>.js oynanış testini çalıştırır (yalnızca bir oyun için: --oyun <slug>).
// Kullanım: npm install && node tools/smoke-test.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const { ROOT, BASE, serve: serveAt, chromePath, sayfalar } = require('./yerel');

const PORT = 8790;
const serve = () => serveAt(PORT);

(async () => {
  const server = serve();
  const { games, cats, pages } = sayfalar();
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
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, locale: 'tr-TR' });
    await page.addInitScript(() => { window.MO_SUNUCU_KAPALI = true; });
    await page.route('https://gc.zgo.at/**', r => r.fulfill({ body: '', contentType: 'text/javascript' }));
    await page.route('https://*.supabase.co/**', r => r.abort());
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
      if (p === '') {
        // Ana sayfa: oyun ızgarası ilk ekrana yakın, kategorilerden önce; reklam alanları korunur
        const a = await page.evaluate(() => {
          const kart = document.querySelector('#oyun-izgarasi .game-card'), kat = document.querySelector('.cat-grid');
          return { ust: Math.round(kart.getBoundingClientRect().top + scrollY), sira: !!(kart.compareDocumentPosition(kat) & Node.DOCUMENT_POSITION_FOLLOWING), reklam: document.querySelectorAll('.ad-slot').length };
        });
        if (a.ust > 900) errors.push(`[${vp.name}] ana sayfada ilk oyun kartı çok aşağıda: ${a.ust}px (en fazla 900)`);
        if (!a.sira) errors.push(`[${vp.name}] ana sayfada "Tüm Oyunlar" ızgarası kategorilerden önce gelmeli`);
        if (a.reklam < 2) errors.push(`[${vp.name}] ana sayfada reklam alanı azalmış: ${a.reklam}`);
        // Filtre çipleri: ilk yüklemede Tümü, Yeni tam 4 kart; kişisel çipler boş profilde gizli; çipler ≥ 44 px
        const f = await page.evaluate(() => {
          const cip = s => document.querySelector(`.filtre-cip[data-filtre="${s}"]`);
          const gorunen = () => [...document.querySelectorAll('#oyun-izgarasi .game-card')].filter(c => !c.hidden).length;
          const r = { tumu: cip('tumu').getAttribute('aria-pressed'), ilk: gorunen(), gizli: cip('denemediklerin').hidden && cip('favoriler').hidden, boy: Math.min(...[...document.querySelectorAll('.filtre-cip:not([hidden])')].map(e => e.getBoundingClientRect().height)) };
          cip('yeni').click(); r.yeni = gorunen(); r.basildi = cip('yeni').getAttribute('aria-pressed');
          cip('tumu').click(); r.son = gorunen();
          return r;
        });
        const toplam = games.length, yeniBeklenen = Math.min(4, toplam);
        if (f.tumu !== 'true' || f.ilk !== toplam || f.son !== toplam || f.yeni !== yeniBeklenen || f.basildi !== 'true' || !f.gizli || f.boy < 44) errors.push(`[${vp.name}] ana sayfa filtre çipleri hatalı: ${JSON.stringify(f)}`);
      }
      if (vp.name === 'mobil') {
        // Mobil üst menü tek satır: başlık ≤ 120 px; 2048 ve Meyve Patlat'ta oyun alanı ≤ 180 px'te başlar
        const m = await page.evaluate(() => ({
          ust: Math.round(document.querySelector('.site-header').getBoundingClientRect().height),
          oyun: document.querySelector('.game-layout') ? Math.round(document.querySelector('.game-layout').getBoundingClientRect().top + scrollY) : 0
        }));
        if (m.ust > 120) errors.push(`[mobil] ${p || '/'} üst menü çok yüksek: ${m.ust}px (en fazla 120)`);
        if (['games/2048/', 'games/meyve-patlat/'].includes(p) && m.oyun > 180) errors.push(`[mobil] ${p} oyun alanı çok aşağıda: ${m.oyun}px (en fazla 180)`);
        if (p === 'games/2048/') {
          await page.click('.mobil-menu summary');
          const linkler = await page.$$eval('.mobil-liste a:not([hidden])', as => as.filter(a => a.offsetParent).map(a => a.getAttribute('href')));
          if (linkler.length !== 6 || linkler.some(h => h.startsWith('/'))) errors.push(`[mobil] ☰ menüsü 6 göreceli bağlantı göstermeli: ${linkler.join()}`);
          await page.keyboard.press('Escape');
          if (await page.$eval('.mobil-menu', d => d.open)) errors.push('[mobil] ☰ menüsü Esc ile kapanmadı');
        }
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
  // "YENİ" rozeti en fazla 4 oyunda
  const yeniler = new Set([...index.matchAll(/href="games\/([^/"]+)\/"[^>]*data-yeni="1"/g)].map(m => m[1]));
  if (yeniler.size > 4) errors.push(`ana sayfada ${yeniler.size} oyun YENİ işaretli (en fazla 4)`);

  // Filtre çipleri kişisel veriyle: 2048 oynanmışsa Denemediklerin 2048'siz, favori çipi favorileri gösterir; arama ile birlikte çalışır
  if (!process.argv.includes('--oyun')) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, serviceWorkers: 'block', locale: 'tr-TR' });
    await ctx.addInitScript(() => { try { localStorage.setItem('mo_cookie_consent', 'rejected'); localStorage.setItem('mo_son_oynanan', '["2048"]'); localStorage.setItem('mo_favoriler', '["sudoku","yilan"]'); } catch (e) {} window.MO_SUNUCU_KAPALI = true; });
    await ctx.route('https://gc.zgo.at/**', r => r.fulfill({ body: '', contentType: 'text/javascript' }));
    await ctx.route('https://*.supabase.co/**', r => r.abort());
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`[filtre] JS hatası: ${e.message}`));
    try {
      await page.goto(origin);
      const gorunen = () => page.$$eval('#oyun-izgarasi .game-card', cs => cs.filter(c => !c.hidden).map(c => c.getAttribute('href')));
      await page.focus('.filtre-cip[data-filtre="denemediklerin"]');
      await page.keyboard.press('Enter');
      let g = await gorunen();
      if (g.length !== games.length - 1 || g.includes('games/2048/')) errors.push(`[filtre] Denemediklerin ${games.length - 1} kart göstermeli, 2048 olmadan: ${g.length}`);
      await page.focus('.filtre-cip[data-filtre="favoriler"]');
      await page.keyboard.press('Space');
      g = await gorunen();
      if (g.length !== 2 || await page.getAttribute('.filtre-cip[data-filtre="favoriler"]', 'aria-pressed') !== 'true') errors.push(`[filtre] Favorilerin 2 kart göstermeli: ${g.length}`);
      await page.click('.filtre-cip[data-filtre="yeni"]');
      await page.fill('#oyun-ara', 'zzqx');
      if (!(await page.isVisible('#sonuc-yok'))) errors.push('[filtre] Yeni + eşleşmeyen arama "sonuç yok" göstermeli');
      await page.fill('#oyun-ara', 'sudoku');
      await page.click('.filtre-cip[data-filtre="tumu"]');
      g = await gorunen();
      if (g.length !== 1 || g[0] !== 'games/sudoku/') errors.push(`[filtre] Tümü'ne dönünce arama korunmalı: ${JSON.stringify(g)}`);
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      if (sw > 360) errors.push(`[filtre] 360 px'te yatay taşma: ${sw}px`);
    } catch (e) {
      errors.push(`[filtre] ${e.message.split('\n')[0]}`);
    }
    await ctx.close();
  }

  // Oynanış testleri: her oyun temiz bir tarayıcı profilinde oynanır
  const only = process.argv.includes('--oyun') ? process.argv[process.argv.indexOf('--oyun') + 1] : null;
  let played = 0;
  for (const g of games.filter(x => !only || x.slug === only)) {
    const file = path.join(__dirname, 'tests', g.slug + '.js');
    if (!fs.existsSync(file)) { errors.push(`${g.slug}: oynanış testi yok (tools/tests/${g.slug}.js)`); continue; }
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', locale: 'tr-TR' });
    await ctx.addInitScript(() => { try { localStorage.setItem('mo_cookie_consent', 'rejected'); } catch (e) {} window.MO_SUNUCU_KAPALI = true; });
    await ctx.route('https://gc.zgo.at/**', r => r.fulfill({ body: '', contentType: 'text/javascript' }));
    await ctx.route('https://*.supabase.co/**', r => r.abort());
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

  // Oyun sonu "Sıradaki oyun" kartları: seçim sırası, günlük kartı, bağlantılar, 360 px
  if (!only) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, serviceWorkers: 'block', locale: 'tr-TR' });
    await ctx.addInitScript(() => { try { localStorage.setItem('mo_cookie_consent', 'rejected'); } catch (e) {} window.MO_SUNUCU_KAPALI = true; });
    await ctx.route('https://gc.zgo.at/**', r => r.fulfill({ body: '', contentType: 'text/javascript' }));
    await ctx.route('https://*.supabase.co/**', r => r.abort());
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`[sıradaki] JS hatası: ${e.message}`));
    const bitir = async () => {
      await page.evaluate(() => MiniOyun.bitti({ baslik: 'Test', metin: 'Bitti', kaybetti: true }));
      await page.waitForSelector('.oyun-sonu[open]', { timeout: 3000 });
      return page.$$eval('.oyun-sonu .siradaki-kart', as => as.map(a => ({ href: a.getAttribute('href'), ad: a.getAttribute('aria-label') })));
    };
    try {
      const bugun = await (async () => { await page.goto(origin + 'games/2048/'); return page.evaluate(() => MiniOyun.gunluk.bugun()); })();
      let k = await bitir();
      const cat = s => games.find(g => g.slug === s.replace('../', '').replace('/', '')) || {};
      if (k.length !== 2 || k[0].href !== '../../gunluk.html' || cat(k[1].href).category !== 'Bulmaca') errors.push(`[sıradaki] ilk oyunda günlük kartı ve aynı kategoriden oyun bekleniyordu: ${JSON.stringify(k)}`);
      // Günlük tamam, bulmaca oyunları oynanmış: hiç oynanmamış başka kategoriden iki farklı oyun gelmeli
      await page.evaluate(d => { localStorage.setItem('mo_gunluk', JSON.stringify({ [d]: { oyun: '2048', sonuc: 'x', kazandi: true } })); localStorage.setItem('mo_son_oynanan', JSON.stringify(['sudoku', 'mayin-tarlasi'])); }, bugun);
      await page.goto(origin + 'games/2048/');
      k = await bitir();
      const slugs = k.map(x => x.href.replace('../', '').replace('/', ''));
      if (k.length !== 2 || slugs[0] === slugs[1] || slugs.some(x => ['2048', 'sudoku', 'mayin-tarlasi'].includes(x) || !cat(x + '/').slug)) errors.push(`[sıradaki] hiç oynanmamış iki farklı oyun bekleniyordu: ${JSON.stringify(k)}`);
      if (k.some(x => x.href.startsWith('/') || !x.ad.startsWith('Sıradaki oyun: '))) errors.push('[sıradaki] kart bağlantısı göreceli olmalı ve anlamlı etiket taşımalı');
      const olcu = await page.evaluate(() => { const d = document.querySelector('.oyun-sonu').getBoundingClientRect(), b = [...document.querySelectorAll('.oyun-sonu .btn, .siradaki-kart')].map(e => e.getBoundingClientRect()); return { sw: document.documentElement.scrollWidth, ok: b.every(r => r.left >= d.left && r.right <= d.right), kart: [...document.querySelectorAll('.siradaki-kart')].every(e => e.getBoundingClientRect().height >= 44) }; });
      if (olcu.sw > 360 || !olcu.ok || !olcu.kart) errors.push(`[sıradaki] 360 px'te oyun sonu penceresi taşıyor: ${JSON.stringify(olcu)}`);
      await page.focus('.oyun-sonu .siradaki-kart >> nth=0');
      await Promise.all([page.waitForURL(origin + 'games/' + slugs[0] + '/'), page.keyboard.press('Enter')]);
      // Oyun listesi yoksa satır hatasız gizlenmeli
      await page.goto(origin + 'games/2048/');
      await page.evaluate(() => document.getElementById('oyun-listesi').remove());
      await bitir();
      if (await page.isVisible('.oyun-sonu-siradaki')) errors.push('[sıradaki] oyun listesi yokken satır gizlenmeli');
    } catch (e) {
      errors.push(`[sıradaki] ${e.message.split('\n')[0]}`);
    }
    await ctx.close();
  }

  // Çoklu dil (js/dil.js): tarayıcı diliyle otomatik seçim, ?lang ile kalıcı seçim, çeviri, bağlantılar, 360 px taşma
  if (!only && fs.existsSync(path.join(ROOT, 'diller', 'en', 'ortak.json'))) {
    const yeni = async (opts) => {
      const ctx = await browser.newContext(Object.assign({ viewport: { width: 360, height: 740 }, serviceWorkers: 'block' }, opts));
      await ctx.addInitScript(() => { try { localStorage.setItem('mo_cookie_consent', 'rejected'); } catch (e) {} window.MO_SUNUCU_KAPALI = true; });
      await ctx.route('https://gc.zgo.at/**', r => r.fulfill({ body: '', contentType: 'text/javascript' }));
      await ctx.route('https://*.supabase.co/**', r => r.abort());
      const page = await ctx.newPage();
      page.on('pageerror', e => errors.push(`[dil] JS hatası ${page.url()}: ${e.message}`));
      page.on('console', m => { if (m.type() === 'error') errors.push(`[dil] konsol ${page.url()}: ${m.text()}`); });
      page.on('response', r => { if (r.status() >= 400) errors.push(`[dil] ${r.status()} ${r.url()}`); });
      const git = async q => { await page.goto(origin + q); await page.evaluate(() => new Promise(r => MO_DIL.hazir(r))); };
      return { ctx, page, git };
    };
    const beklenen = (ok, msg) => { if (!ok) errors.push('[dil] ' + msg); };
    try {
      const { ctx, page, git } = await yeni({ locale: 'en-US', timezoneId: 'America/New_York' });
      const durum = () => page.evaluate(() => ({ dil: document.documentElement.lang, menu: document.querySelector('.nav a').textContent.trim(), kod: (document.querySelector('.dil-kod') || {}).textContent, kayit: localStorage.getItem('mo_dil'), gizli: document.documentElement.classList.contains('dil-bekle') }));
      await git('');
      let d = await durum();
      beklenen(d.dil === 'en' && d.menu === 'Games' && d.kod === 'EN' && !d.kayit && !d.gizli, `İngilizce tarayıcıda ana sayfa İngilizce açılmalı (seçim kaydedilmeden): ${JSON.stringify(d)}`);
      await page.click('.dil-menu summary');
      await Promise.all([page.waitForURL(/\?lang=tr$/), page.click('.dil-liste a[hreflang="tr"]')]);
      await page.evaluate(() => new Promise(r => MO_DIL.hazir(r)));
      d = await durum();
      beklenen(d.dil === 'tr' && d.menu === 'Oyunlar' && d.kayit === 'tr', `Dil menüsünden Türkçe seçilince kaydedilmeli: ${JSON.stringify(d)}`);
      await git('games/2048/');
      beklenen((await durum()).dil === 'tr', 'Kayıtlı Türkçe seçimi diğer sayfalarda da geçerli olmalı');
      await git('games/2048/?lang=en');
      const o = await page.evaluate(() => ({ yeni: document.getElementById('restart').textContent, can: document.querySelector('link[rel="canonical"]').href, link: document.querySelector('.breadcrumb a').getAttribute('href'), t: MO_DIL.t('Bölüm {0}', 3), baslik: document.title }));
      beklenen(o.yeni === 'New game' && o.can.endsWith('/games/2048/?lang=en') && o.link === '../../?lang=en' && o.t === 'Level 3' && !/Oyna/.test(o.baslik), `2048 İngilizce çevrilmeli (düğme, canonical, bağlantı, MO_DIL.t, başlık): ${JSON.stringify(o)}`);
      beklenen((await durum()).kayit === 'en', '?lang=en seçimi kaydedilmeli');
      // Çevirisi tam olan (hreflang taşıyan) sayfalar İngilizcede 360 px'e sığmalı
      for (const p of pages) {
        const f = path.join(ROOT, p.endsWith('/') || !p ? p + 'index.html' : p);
        if (!fs.readFileSync(f, 'utf8').includes('hreflang="en"')) continue;
        await git(p + '?lang=en');
        const w = await page.evaluate(() => document.documentElement.scrollWidth);
        if (w > 360) errors.push(`[dil] İngilizce ${p || '/'} sayfasında yatay taşma: ${w}px`);
      }
      await ctx.close();
      // Türkiye saat dilimindeki İngilizce tarayıcı Türkçe görür
      const ist = await yeni({ locale: 'en-US', timezoneId: 'Europe/Istanbul' });
      await ist.git('');
      beklenen(await ist.page.evaluate(() => MO_DIL.dil) === 'tr', 'Türkiye saat diliminde site Türkçe açılmalı');
      await ist.ctx.close();
    } catch (e) {
      errors.push(`[dil] ${e.message.split('\n')[0]}`);
    }
    if (!fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').includes('hreflang="en"')) errors.push('[dil] ana sayfada hreflang="en" etiketi yok');
  }

  // Sunucu arayüzü (sahte istemciyle): liderlik tablosu, skor gönderme, hesap
  if (!only) {
    const sv = require(path.join(__dirname, 'tests', '_sunucu.js'));
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', locale: 'tr-TR' });
    await ctx.addInitScript(() => { try { localStorage.setItem('mo_cookie_consent', 'rejected'); } catch (e) {} });
    await ctx.addInitScript(sv.sahte);
    await ctx.route('https://gc.zgo.at/**', r => r.fulfill({ body: '', contentType: 'text/javascript' }));
    await ctx.route('https://*.supabase.co/**', r => r.abort());
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`[sunucu] JS hatası: ${e.message}`));
    try {
      await sv.test(page, {
        origin,
        yeniSayfa: () => ctx.newPage(),
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

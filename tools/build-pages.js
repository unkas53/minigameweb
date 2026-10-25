// games.json ve categories.json'dan ortak sayfa parçalarını üretir:
// - tüm sayfalarda üst menü + kategori çubuğu ve alt bilgi
// - ana sayfada öne çıkan oyun, kategori kutuları ve oyun ızgarası
// - kategori/<slug>/ sayfaları ve kategori/ listesi
// - oyun sayfalarında yol (breadcrumb), "Benzer oyunlar", sunucu bağlantısı (js/sunucu.js) ve ortak oyun çerçevesi (js/oyun.js)
// - profil ve günlük meydan okuma sayfalarındaki oyun listesi
// - sitemap.xml
// - çoklu dil: tüm sayfalarda js/dil.js, üst menüde dil seçici, hreflang etiketleri (diller/diller.json ve diller/<kod>/*.json)
// - PWA ve analitik: tüm sayfalarda manifest/tema etiketleri, GoatCounter sayacı ve çevrimdışı önbellek için sw.js
// Kullanım: node tools/build-pages.js          (dosyaları yazar)
//           node tools/build-pages.js --check  (yalnızca güncel mi diye bakar)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://unkas53.github.io/minigameweb/';
const CHECK = process.argv.includes('--check');

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const games = JSON.parse(read('games.json')).filter(g => g.status === 'live');
const categories = JSON.parse(read('categories.json'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const problems = [];
const catByName = {};
categories.forEach(c => { catByName[c.name] = c; });
for (const g of games) {
  for (const k of ['slug', 'title', 'category', 'description', 'icon', 'colors', 'added']) {
    if (!g[k]) problems.push(`games.json: ${g.slug || '?'} için "${k}" alanı eksik`);
  }
  if (g.category && !catByName[g.category]) {
    problems.push(`games.json: ${g.slug} kategorisi "${g.category}" categories.json içinde yok`);
  }
}
if (problems.length) {
  console.error('HATA:\n- ' + problems.join('\n- '));
  process.exit(1);
}

// En yeni oyun önce, eşitse games.json sırasının tersi (sonradan eklenen önce)
const sorted = games.map((g, i) => ({ g, i }))
  .sort((a, b) => (b.g.added.localeCompare(a.g.added)) || (b.i - a.i))
  .map(x => x.g);
const gamesOf = c => sorted.filter(g => g.category === c.name);
// "YENİ" rozeti ve ana sayfadaki "Yeni" filtresi: en yeni 4 oyun
const newest = new Set(sorted.slice(0, 4).map(g => g.slug));

// ---------- Çoklu dil ----------
// Bir dil, diller/diller.json'da listelendiğinde ve diller/<kod>/ortak.json bulunduğunda sitede sunulur.
// Sayfa sözlüğü (diller/<kod>/<sayfa>.json) varsa yüklenir; içinde boş çeviri kalmadıysa sayfa o dilde "tam" sayılır ve hreflang/sitemap'e girer.
const exists = f => fs.existsSync(path.join(ROOT, f));
const dilListe = exists('diller/diller.json') ? JSON.parse(read('diller/diller.json')) : [{ kod: 'tr', ad: 'Türkçe' }];
const kaynakDil = dilListe.find(d => d.kod === 'tr') || { kod: 'tr', ad: 'Türkçe' };
const diller = dilListe.filter(d => d.kod !== 'tr' && exists(`diller/${d.kod}/ortak.json`));
const sozlukDosyalari = [];
for (const d of diller) {
  for (const f of fs.readdirSync(path.join(ROOT, 'diller', d.kod), { recursive: true }).map(String).filter(f => f.endsWith('.json')).sort()) {
    const rel = `diller/${d.kod}/${f.split(path.sep).join('/')}`;
    let veri;
    try { veri = JSON.parse(read(rel)); } catch (e) { problems.push(`${rel}: geçersiz JSON (${e.message})`); continue; }
    if (!veri || typeof veri !== 'object' || Array.isArray(veri) || Object.values(veri).some(v => typeof v !== 'string')) problems.push(`${rel}: { "Türkçe metin": "çeviri" } biçiminde olmalı`);
    sozlukDosyalari.push(rel);
  }
}
if (problems.length) {
  console.error('HATA:\n- ' + problems.join('\n- '));
  process.exit(1);
}
function dilDurumu(sayfa) {
  const v = [], tam = [];
  for (const d of diller) {
    const f = `diller/${d.kod}/${sayfa}.json`;
    if (!sayfa || !exists(f)) continue;
    v.push(d.kod);
    if (!Object.values(JSON.parse(read(f))).some(x => !x)) tam.push(d.kod);
  }
  return { var: v, tam };
}
const dilBetigi = (p, sayfa) => `<script src="${p}js/dil.js" data-diller="${diller.map(d => d.kod).join(',')}" data-sayfa="${sayfa}" data-var="${dilDurumu(sayfa).var.join(',')}"></script>`;
const hreflang = (url, sayfa) => {
  const tam = dilDurumu(sayfa).tam;
  if (!url || !tam.length) return '';
  return [`<link rel="alternate" hreflang="tr" href="${url}">`]
    .concat(tam.map(k => `<link rel="alternate" hreflang="${k}" href="${url}?lang=${k}">`))
    .concat([`<link rel="alternate" hreflang="x-default" href="${url}">`]).join('\n  ');
};
const dilMenu = p => diller.length ? `
      <details class="dil-menu" translate="no">
        <summary aria-label="Dil / Language"><span aria-hidden="true">🌐</span> <span class="dil-kod">TR</span></summary>
        <div class="dil-liste">${[kaynakDil].concat(diller).map(d => `<a href="?lang=${d.kod}" hreflang="${d.kod}" lang="${d.kod}">${esc(d.ad)}</a>`).join('')}</div>
      </details>` : '';
const activeCats = categories.filter(c => gamesOf(c).length > 0);

// ---------- Parçalar ----------
function header(p, current) {
  const chips = activeCats.map(c =>
    `<a class="cat-chip${current === c.slug ? ' active' : ''}" href="${p}kategori/${c.slug}/"${current === c.slug ? ' aria-current="page"' : ''} style="--c1:${c.colors[0]};--c2:${c.colors[1]}"><span aria-hidden="true">${c.icon}</span>${esc(c.name)}</a>`
  ).join('\n        ');
  return `<header class="site-header">
    <div class="container header-row">
      <a class="logo" href="${p}"><span class="logo-badge" aria-hidden="true">🎮</span><span class="logo-text" translate="no">Mini<b>Oyun</b></span></a>
      <nav class="nav" aria-label="Ana menü">
        <a href="${p}">Oyunlar</a>
        <a href="${p}kategori/">Kategoriler</a>
        <a href="${p}hakkinda.html">Hakkında</a>
        <a href="${p}iletisim.html">İletişim</a>
        <a class="nav-profil" href="${p}profil.html"><span class="nav-avatar" aria-hidden="true">👤</span>Profilim</a>
      </nav>${dilMenu(p)}
    </div>
    <nav class="cat-bar" aria-label="Kategoriler">
      <div class="container cat-bar-inner">
        <a class="cat-chip${current === 'tumu' ? ' active' : ''}" href="${p}"${current === 'tumu' ? ' aria-current="page"' : ''} style="--c1:#8b7bff;--c2:#5b4bdb"><span aria-hidden="true">🎮</span>Tümü</a>
        ${chips}
      </div>
    </nav>
  </header>`;
}

function footer(p) {
  const cats = activeCats.map(c => `<a href="${p}kategori/${c.slug}/">${esc(c.name)} Oyunları</a>`).join('\n          ');
  return `<footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <a class="logo" href="${p}"><span class="logo-badge" aria-hidden="true">🎮</span><span class="logo-text" translate="no">Mini<b>Oyun</b></span></a>
        <p>Ücretsiz online mini oyunlar. İndirme yok, kayıt yok; tarayıcıda hemen oyna.</p>
        <button class="btn btn-ghost pwa-yukle" type="button" hidden>📲 Uygulamayı yükle</button>
      </div>
      <div class="footer-col">
        <h2>Kategoriler</h2>
        ${cats}
      </div>
      <div class="footer-col">
        <h2>Site</h2>
        <a href="${p}hakkinda.html">Hakkında</a>
        <a href="${p}iletisim.html">İletişim</a>
        <a href="${p}gizlilik.html">Gizlilik Politikası</a>
        <a href="${p}cerezler.html">Çerez Politikası</a>
      </div>
    </div>
    <div class="container footer-bottom">© 2026 MiniOyun</div>
  </footer>`;
}

function card(g, p) {
  const c = catByName[g.category];
  const big = g.icon.length > 3 && !/\p{Extended_Pictographic}/u.test(g.icon) ? ' text' : '';
  return `<a class="game-card" href="${p}games/${g.slug}/" data-title="${esc(g.title.toLocaleLowerCase('tr'))}" data-added="${g.added}"${newest.has(g.slug) ? ' data-yeni="1"' : ''}>
        <div class="game-thumb" style="--c1:${g.colors[0]};--c2:${g.colors[1]}"><span class="thumb-icon${big}" aria-hidden="true">${esc(g.icon)}</span><span class="play-badge" aria-hidden="true">▶</span></div>
        <div class="info">
          <h3>${esc(g.title)}</h3>
          <p>${esc(g.description)}</p>
          <span class="tag" style="--c1:${c.colors[0]}">${c.icon} ${esc(c.name)}</span>
        </div>
      </a>`;
}

function catTiles(p, exclude) {
  return activeCats.filter(c => c.slug !== exclude).map(c => {
    const n = gamesOf(c).length;
    return `<a class="cat-tile" href="${p}kategori/${c.slug}/" style="--c1:${c.colors[0]};--c2:${c.colors[1]}">
        <span class="cat-icon" aria-hidden="true">${c.icon}</span>
        <span class="cat-name">${esc(c.name)}</span>
        <span class="cat-count">${n} oyun</span>
      </a>`;
  }).join('\n      ');
}

const grid = (list, p) => list.map(g => card(g, p)).join('\n      ');

// ---------- Yardımcılar ----------
function replaceBlock(html, name, content, file) {
  const re = new RegExp(`(<!-- oto:${name} -->)[\\s\\S]*?(<!-- /oto:${name} -->)`);
  if (!re.test(html)) throw new Error(`${file}: <!-- oto:${name} --> işaretleri bulunamadı`);
  return html.replace(re, `$1\n      ${content}\n      $2`);
}

// PWA etiketleri: manifest, tema rengi, iOS simgesi
// GoatCounter: çerezsiz, kişisel veri toplamayan ziyaret sayacı (hesap: mami53)
const ANALYTICS = '<script data-goatcounter="https://mami53.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>';
const pwaTags = p => `<link rel="manifest" href="${p}manifest.webmanifest">
  <meta name="theme-color" content="#0d0b1f">
  <link rel="apple-touch-icon" href="${p}icons/apple-touch-icon.png">
  ${ANALYTICS}`;

function shell(html, p, current, sayfa) {
  if (!html.includes('rel="manifest"')) {
    html = html.replace(/(\n\s*)(<link rel="stylesheet")/, `$1${pwaTags(p)}$1$2`);
  } else if (!html.includes('data-goatcounter')) {
    html = html.replace(/(\n\s*)(<link rel="apple-touch-icon"[^>]*>)/, `$1$2$1${ANALYTICS}`);
  }
  // Çoklu dil: dil betiği stil dosyasından önce, hreflang etiketleri canonical'dan sonra
  html = html.replace(/[ \t]*<script src="[^"]*js\/dil\.js"[^>]*><\/script>\n/g, '').replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n/g, '');
  html = html.replace(/(\n([ \t]*))(<link rel="stylesheet")/, `$1${dilBetigi(p, sayfa)}$1$3`);
  const can = (html.match(/<link rel="canonical" href="([^"]+)">/) || [])[1];
  const alt = hreflang(can, sayfa);
  if (alt) html = html.replace(/(<link rel="canonical" href="[^"]+">)/, `$1\n  ${alt}`);
  return html
    .replace(/<header class="site-header">[\s\S]*?<\/header>/, header(p, current))
    .replace(/<footer class="site-footer">[\s\S]*?<\/footer>/, footer(p));
}

const outputs = new Map(); // göreli yol -> içerik
const put = (f, s) => outputs.set(f, s);

// ---------- Ana sayfa ----------
{
  let html = read('index.html');
  html = shell(html, '', 'tumu', 'sayfa/index');
  const top = sorted[0];
  const topCat = catByName[top.category];
  html = replaceBlock(html, 'one-cikan', `<a class="featured" href="games/${top.slug}/" style="--c1:${top.colors[0]};--c2:${top.colors[1]}">
        <span class="featured-label">✨ En yeni oyun</span>
        <span class="featured-icon" aria-hidden="true">${esc(top.icon)}</span>
        <span class="featured-title">${esc(top.title)}</span>
        <span class="featured-desc">${esc(top.description)}</span>
        <span class="featured-meta">${topCat.icon} ${esc(topCat.name)}</span>
        <span class="btn btn-play">Hemen oyna ▶</span>
      </a>`, 'index.html');
  html = replaceBlock(html, 'sayilar', `<li><b>${sorted.length}</b> oyun</li>
        <li><b>${activeCats.length}</b> kategori</li>
        <li><b>%100</b> ücretsiz</li>`, 'index.html');
  html = replaceBlock(html, 'kategoriler', catTiles(''), 'index.html');
  html = replaceBlock(html, 'oyunlar', grid(sorted, ''), 'index.html');
  put('index.html', html);
}

// ---------- Diğer kök sayfalar ----------
for (const f of ['hakkinda.html', 'iletisim.html', 'gizlilik.html', 'cerezler.html', '404.html']) {
  put(f, shell(read(f), '', '', 'sayfa/' + f.replace('.html', '')));
}

// ---------- Profil ve günlük sayfaları: oyun verisi ----------
{
  const data = sorted.map(g => ({ slug: g.slug, title: g.title, icon: g.icon, colors: g.colors, rekor: g.rekor || 'puan', gunluk: !!g.gunluk, description: g.description }));
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  for (const f of ['profil.html', 'gunluk.html']) {
    put(f, replaceBlock(shell(read(f), '', '', 'sayfa/' + f.replace('.html', '')), 'oyun-verisi', `<script>window.MO_OYUNLAR = ${json};</script>`, f));
  }
}

// ---------- Oyun sayfaları ----------
for (const g of sorted) {
  const f = `games/${g.slug}/index.html`;
  const c = catByName[g.category];
  let html = shell(read(f), '../../', c.slug, 'oyun/' + g.slug);
  const crumbs = `<nav class="breadcrumb" aria-label="Konum"><a href="../../">Ana sayfa</a><span aria-hidden="true">›</span><a href="../../kategori/${c.slug}/">${esc(c.name)} Oyunları</a><span aria-hidden="true">›</span><span aria-current="page">${esc(g.title)}</span></nav>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Ana sayfa","item":"${SITE}"},{"@type":"ListItem","position":2,"name":"${c.name} Oyunları","item":"${SITE}kategori/${c.slug}/"},{"@type":"ListItem","position":3,"name":"${g.title}","item":"${SITE}games/${g.slug}/"}]}</script>`;
  if (!html.includes('<!-- oto:yol -->')) {
    html = html.replace('<main class="container">', '<main class="container">\n    <!-- oto:yol -->\n    <!-- /oto:yol -->');
  }
  if (!html.includes('<!-- oto:benzer -->')) {
    html = html.replace(/(\n\s*<div class="ad-slot" aria-label="Reklam">Reklam alanı<\/div>\s*\n\s*<\/main>)/, '\n\n    <!-- oto:benzer -->\n    <!-- /oto:benzer -->$1');
  }
  // Sunucu bağlantısı ve ortak oyun çerçevesi game.js'den önce yüklenmeli; skor birimi data-rekor ile geçer
  html = html.replace(/[ \t]*<script src="\.\.\/\.\.\/js\/(?:sunucu|oyun)\.js"[^>]*><\/script>\n/g, '');
  html = html.replace('<script src="game.js"></script>', `<script src="../../js/sunucu.js"></script>\n  <script src="../../js/oyun.js" data-rekor="${g.rekor || 'puan'}"></script>\n  <script src="game.js"></script>`);
  html = replaceBlock(html, 'yol', crumbs, f);
  const same = sorted.filter(x => x !== g && x.category === g.category);
  const others = sorted.filter(x => x !== g && x.category !== g.category);
  const similar = same.concat(others).slice(0, 4);
  const sim = similar.length ? `<section class="similar">
        <h2 class="section-title">Benzer oyunlar</h2>
        <div class="game-grid">
      ${grid(similar, '../../')}
        </div>
        <p class="see-all"><a href="../../kategori/${c.slug}/">Tüm ${esc(c.name.toLocaleLowerCase('tr'))} oyunları →</a></p>
      </section>` : '';
  // Oyun sonu penceresindeki "Sıradaki oyun" önerisi için oyun listesi (js/oyun.js okur)
  const list = sorted.map(x => ({ slug: x.slug, ad: x.title, kategori: x.category, ikon: x.icon, metin: x.icon.length > 3 && !/\p{Extended_Pictographic}/u.test(x.icon), renk: x.colors }));
  const json = `<script type="application/json" id="oyun-listesi">${JSON.stringify(list).replace(/</g, '\\u003c')}</script>`;
  html = replaceBlock(html, 'benzer', sim + '\n      ' + json, f);
  put(f, html);
}

// ---------- Kategori sayfaları ----------
const cookie = p => `<div class="cookie-banner" id="cookie-banner" role="dialog" aria-label="Çerez onayı">
    <p>Sitemizde deneyiminizi iyileştirmek ve kişiselleştirilmiş reklamlar göstermek için çerezler kullanıyoruz. Ayrıntılar için <a href="${p}cerezler.html">Çerez Politikası</a>.</p>
    <div class="actions">
      <button class="btn" data-consent="accept">Kabul et</button>
      <button class="btn btn-ghost" data-consent="reject">Reddet</button>
    </div>
  </div>`;

function page({ p, title, description, url, current, jsonld, body }) {
  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- Bu sayfa tools/build-pages.js ile üretilir. Elle değiştirmeyin; metinler categories.json içindedir. -->
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">${hreflang(url, 'sayfa/kategori') ? '\n  ' + hreflang(url, 'sayfa/kategori') : ''}
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎮</text></svg>">
  ${pwaTags(p)}
  ${dilBetigi(p, 'sayfa/kategori')}
  <link rel="stylesheet" href="${p}css/style.css">
  <!-- AdSense: onay geldikten sonra ca-pub kimliğini girip bu satırı açın -->
  <!-- <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script> -->
  <script type="application/ld+json">
  ${JSON.stringify(jsonld)}
  </script>
</head>
<body>
  ${header(p, current)}

  <main class="container">
${body}
  </main>

  ${footer(p)}

  ${cookie(p)}

  <script src="${p}js/main.js"></script>
</body>
</html>
`;
}

for (const c of activeCats) {
  const list = gamesOf(c);
  const url = `${SITE}kategori/${c.slug}/`;
  put(`kategori/${c.slug}/index.html`, page({
    p: '../../', title: c.title, description: c.description, url, current: c.slug,
    jsonld: {
      '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${c.name} Oyunları`, url,
      mainEntity: { '@type': 'ItemList', itemListElement: list.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}games/${g.slug}/`, name: g.title })) }
    },
    body: `    <nav class="breadcrumb" aria-label="Konum"><a href="../../">Ana sayfa</a><span aria-hidden="true">›</span><a href="../">Kategoriler</a><span aria-hidden="true">›</span><span aria-current="page">${esc(c.name)} Oyunları</span></nav>
    <section class="cat-hero" style="--c1:${c.colors[0]};--c2:${c.colors[1]}">
      <span class="cat-hero-icon" aria-hidden="true">${c.icon}</span>
      <div>
        <h1>${esc(c.name)} Oyunları</h1>
        <p>${esc(c.intro)}</p>
        <span class="cat-count">${list.length} oyun</span>
      </div>
    </section>

    <div class="ad-slot" aria-label="Reklam">Reklam alanı</div>

    <h2 class="section-title">${esc(c.name)} oyunları</h2>
    <div class="game-grid">
      ${grid(list, '../../')}
    </div>

    ${activeCats.length > 1 ? `<h2 class="section-title">Diğer kategoriler</h2>
    <div class="cat-grid">
      ${catTiles('../../', c.slug)}
    </div>` : ''}

    <div class="ad-slot" aria-label="Reklam">Reklam alanı</div>`
  }));
}

put('kategori/index.html', page({
  p: '../', title: 'Oyun Kategorileri - Ücretsiz Online Oyunlar | MiniOyun',
  description: 'MiniOyun oyun kategorileri: bulmaca, arcade, hafıza ve daha fazlası. Sevdiğin türü seç, ücretsiz online oyunları hemen oyna.',
  url: `${SITE}kategori/`, current: '',
  jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Oyun Kategorileri', url: `${SITE}kategori/` },
  body: `    <nav class="breadcrumb" aria-label="Konum"><a href="../">Ana sayfa</a><span aria-hidden="true">›</span><span aria-current="page">Kategoriler</span></nav>
    <section class="hero hero-small">
      <h1>Oyun Kategorileri</h1>
      <p>Sevdiğin oyun türünü seç. Her kategoride indirme ve üyelik gerektirmeyen ücretsiz oyunlar seni bekliyor.</p>
    </section>
    <div class="cat-grid">
      ${catTiles('../')}
    </div>

    <div class="ad-slot" aria-label="Reklam">Reklam alanı</div>`
}));

// ---------- sitemap.xml ----------
{
  const old = read('sitemap.xml');
  const lastmod = {};
  old.replace(/<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g, (_, l, d) => { lastmod[l] = d; });
  const today = new Date().toISOString().slice(0, 10);
  const entries = [[SITE, '1.0', today]]
    .concat(sorted.map(g => [`${SITE}games/${g.slug}/`, '0.8', g.added]))
    .concat([[`${SITE}kategori/`, '0.6', today]])
    .concat(activeCats.map(c => [`${SITE}kategori/${c.slug}/`, '0.7', today]))
    .concat([[SITE + 'gunluk.html', '0.9', today]])
    .concat([['hakkinda.html', '0.3'], ['iletisim.html', '0.3'], ['gizlilik.html', '0.2'], ['cerezler.html', '0.2']].map(([f, pr]) => [SITE + f, pr, today]));
  // Çevirisi tam olan sayfaların ?lang=xx sürümleri de listelenir; her sürüm diğerlerini xhtml:link ile gösterir
  const sayfaOf = l => {
    const r = l.slice(SITE.length);
    if (!r) return 'sayfa/index';
    if (r.startsWith('games/')) return 'oyun/' + r.split('/')[1];
    if (r.startsWith('kategori/')) return 'sayfa/kategori';
    return 'sayfa/' + r.replace('.html', '');
  };
  const satirlar = [];
  for (const [l, pr, d] of entries) {
    const tam = dilDurumu(sayfaOf(l)).tam;
    const alt = tam.length ? ['tr'].concat(tam).map(k => `<xhtml:link rel="alternate" hreflang="${k}" href="${k === 'tr' ? l : l + '?lang=' + k}"/>`).concat([`<xhtml:link rel="alternate" hreflang="x-default" href="${l}"/>`]).join('') : '';
    satirlar.push(`  <url><loc>${l}</loc><lastmod>${lastmod[l] || d}</lastmod><priority>${pr}</priority>${alt}</url>`);
    for (const k of tam) satirlar.push(`  <url><loc>${l}?lang=${k}</loc><lastmod>${lastmod[l] || d}</lastmod><priority>${pr}</priority>${alt}</url>`);
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${diller.length ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : ''}>
${satirlar.join('\n')}
</urlset>
`;
  put('sitemap.xml', xml);
}

// ---------- sw.js: çevrimdışı oynama için önbellek ----------
{
  const files = ['', 'manifest.webmanifest', 'css/style.css']
    .concat(fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).sort().map(f => 'js/' + f))
    .concat(fs.readdirSync(path.join(ROOT, 'icons')).filter(f => f.endsWith('.png')).sort().map(f => 'icons/' + f))
    .concat(['gunluk.html', 'profil.html', 'kategori/'])
    .concat(activeCats.map(c => `kategori/${c.slug}/`))
    .concat(sorted.flatMap(g => [`games/${g.slug}/`, `games/${g.slug}/game.js`]))
    .concat(['hakkinda.html', 'iletisim.html', 'gizlilik.html', 'cerezler.html'])
    .concat(['diller/diller.json'].filter(exists), sozlukDosyalari);
  // Dosyalar değişince sürüm değişir; tarayıcı eski önbelleği atar
  const hash = crypto.createHash('sha1');
  for (const f of files) {
    const rel = f === '' || f.endsWith('/') ? f + 'index.html' : f;
    hash.update(rel + '\0' + (outputs.has(rel) ? outputs.get(rel) : fs.readFileSync(path.join(ROOT, rel))));
  }
  put('sw.js', `// Bu dosya tools/build-pages.js ile üretilir. Elle değiştirmeyin.
// Sayfalar önce ağdan, yoksa önbellekten; diğer dosyalar önbellekten gelir ve arka planda güncellenir.
const SURUM = 'mo-${hash.digest('hex').slice(0, 10)}';
const DOSYALAR = ${JSON.stringify(files.map(f => './' + f), null, 2)};

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SURUM).then(c => c.addAll(DOSYALAR)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== SURUM).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(SURUM).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(cached => {
    const fresh = fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(SURUM).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => cached);
    return cached || fresh;
  }));
});
`);
}

// ---------- Yaz veya kontrol et ----------
const stale = [];
for (const [f, content] of outputs) {
  const full = path.join(ROOT, f);
  const cur = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
  if (cur === content) continue;
  stale.push(f);
  if (!CHECK) {
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
}
// Oyunu kalmayan kategori sayfalarını kaldır
const katDir = path.join(ROOT, 'kategori');
if (fs.existsSync(katDir)) {
  for (const d of fs.readdirSync(katDir)) {
    if (fs.statSync(path.join(katDir, d)).isDirectory() && !activeCats.some(c => c.slug === d)) {
      stale.push(`kategori/${d}/ (silinmeli)`);
      if (!CHECK) fs.rmSync(path.join(katDir, d), { recursive: true });
    }
  }
}

if (CHECK) {
  if (stale.length) {
    console.error('Güncel değil, "npm run build" çalıştırın:\n- ' + stale.join('\n- '));
    process.exit(1);
  }
  console.log('Sayfalar güncel.');
} else {
  console.log(stale.length ? 'Güncellendi:\n- ' + stale.join('\n- ') : 'Değişiklik yok.');
}

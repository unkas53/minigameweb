// games.json ve categories.json'dan ortak sayfa parçalarını üretir:
// - tüm sayfalarda üst menü + kategori çubuğu ve alt bilgi
// - ana sayfada öne çıkan oyun, kategori kutuları ve oyun ızgarası
// - kategori/<slug>/ sayfaları ve kategori/ listesi
// - oyun sayfalarında yol (breadcrumb), "Benzer oyunlar" ve ortak oyun çerçevesi betiği (js/oyun.js)
// - sitemap.xml
// Kullanım: node tools/build-pages.js          (dosyaları yazar)
//           node tools/build-pages.js --check  (yalnızca güncel mi diye bakar)
const fs = require('fs');
const path = require('path');

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
const activeCats = categories.filter(c => gamesOf(c).length > 0);

// ---------- Parçalar ----------
function header(p, current) {
  const chips = activeCats.map(c =>
    `<a class="cat-chip${current === c.slug ? ' active' : ''}" href="${p}kategori/${c.slug}/"${current === c.slug ? ' aria-current="page"' : ''} style="--c1:${c.colors[0]};--c2:${c.colors[1]}"><span aria-hidden="true">${c.icon}</span>${esc(c.name)}</a>`
  ).join('\n        ');
  return `<header class="site-header">
    <div class="container header-row">
      <a class="logo" href="${p}"><span class="logo-badge" aria-hidden="true">🎮</span><span class="logo-text">Mini<b>Oyun</b></span></a>
      <nav class="nav" aria-label="Ana menü">
        <a href="${p}">Oyunlar</a>
        <a href="${p}kategori/">Kategoriler</a>
        <a href="${p}hakkinda.html">Hakkında</a>
        <a href="${p}iletisim.html">İletişim</a>
      </nav>
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
        <a class="logo" href="${p}"><span class="logo-badge" aria-hidden="true">🎮</span><span class="logo-text">Mini<b>Oyun</b></span></a>
        <p>Ücretsiz online mini oyunlar. İndirme yok, kayıt yok; tarayıcıda hemen oyna.</p>
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
  return `<a class="game-card" href="${p}games/${g.slug}/" data-title="${esc(g.title.toLocaleLowerCase('tr'))}" data-added="${g.added}">
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

function shell(html, p, current) {
  return html
    .replace(/<header class="site-header">[\s\S]*?<\/header>/, header(p, current))
    .replace(/<footer class="site-footer">[\s\S]*?<\/footer>/, footer(p));
}

const outputs = new Map(); // göreli yol -> içerik
const put = (f, s) => outputs.set(f, s);

// ---------- Ana sayfa ----------
{
  let html = read('index.html');
  html = shell(html, '', 'tumu');
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
  put(f, shell(read(f), '', ''));
}

// ---------- Oyun sayfaları ----------
for (const g of sorted) {
  const f = `games/${g.slug}/index.html`;
  const c = catByName[g.category];
  let html = shell(read(f), '../../', c.slug);
  const crumbs = `<nav class="breadcrumb" aria-label="Konum"><a href="../../">Ana sayfa</a><span aria-hidden="true">›</span><a href="../../kategori/${c.slug}/">${esc(c.name)} Oyunları</a><span aria-hidden="true">›</span><span aria-current="page">${esc(g.title)}</span></nav>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Ana sayfa","item":"${SITE}"},{"@type":"ListItem","position":2,"name":"${c.name} Oyunları","item":"${SITE}kategori/${c.slug}/"},{"@type":"ListItem","position":3,"name":"${g.title}","item":"${SITE}games/${g.slug}/"}]}</script>`;
  if (!html.includes('<!-- oto:yol -->')) {
    html = html.replace('<main class="container">', '<main class="container">\n    <!-- oto:yol -->\n    <!-- /oto:yol -->');
  }
  if (!html.includes('<!-- oto:benzer -->')) {
    html = html.replace(/(\n\s*<div class="ad-slot" aria-label="Reklam">Reklam alanı<\/div>\s*\n\s*<\/main>)/, '\n\n    <!-- oto:benzer -->\n    <!-- /oto:benzer -->$1');
  }
  // Ortak oyun çerçevesi game.js'den önce yüklenmeli
  if (!html.includes('js/oyun.js')) {
    html = html.replace('<script src="game.js"></script>', '<script src="../../js/oyun.js"></script>\n  <script src="game.js"></script>');
  }
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
  html = replaceBlock(html, 'benzer', sim, f);
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
  <link rel="canonical" href="${url}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎮</text></svg>">
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
    .concat([['hakkinda.html', '0.3'], ['iletisim.html', '0.3'], ['gizlilik.html', '0.2'], ['cerezler.html', '0.2']].map(([f, pr]) => [SITE + f, pr, today]));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(([l, pr, d]) => `  <url><loc>${l}</loc><lastmod>${lastmod[l] || d}</lastmod><priority>${pr}</priority></url>`).join('\n')}
</urlset>
`;
  put('sitemap.xml', xml);
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

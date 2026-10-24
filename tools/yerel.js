// Testler ve araçlar için ortak yardımcılar: GitHub Pages alt klasörünü taklit eden yerel sunucu ve Chromium yolu.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = '/minigameweb/';
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

function serve(port) {
  return http.createServer((req, res) => {
    let url = decodeURIComponent(req.url.split('?')[0]);
    if (!url.startsWith(BASE)) { res.writeHead(404); return res.end(); }
    let file = path.join(ROOT, url.slice(BASE.length));
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  }).listen(port);
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

// Sitedeki tüm sayfalar (smoke test ve dil aracı aynı listeyi kullanır)
function sayfalar() {
  const games = JSON.parse(fs.readFileSync(path.join(ROOT, 'games.json'), 'utf8'));
  const katDir = path.join(ROOT, 'kategori');
  const cats = fs.existsSync(katDir) ? fs.readdirSync(katDir).filter(d => fs.statSync(path.join(katDir, d)).isDirectory()) : [];
  return { games, cats, pages: ['', 'hakkinda.html', 'iletisim.html', 'gizlilik.html', 'cerezler.html', 'profil.html', 'gunluk.html', 'kategori/']
    .concat(cats.map(c => 'kategori/' + c + '/'))
    .concat(games.map(g => 'games/' + g.slug + '/')) };
}

// Sayfa yolunun sözlük anahtarı (tools/build-pages.js ile aynı): '' -> sayfa/index, games/2048/ -> oyun/2048
function sozlukAdi(p) {
  if (!p) return 'sayfa/index';
  if (p.startsWith('games/')) return 'oyun/' + p.split('/')[1];
  if (p.startsWith('kategori/')) return 'sayfa/kategori';
  return 'sayfa/' + p.replace('.html', '');
}

module.exports = { ROOT, BASE, serve, chromePath, sayfalar, sozlukAdi };

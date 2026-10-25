// Bu dosya tools/build-pages.js ile üretilir. Elle değiştirmeyin.
// Sayfalar önce ağdan, yoksa önbellekten; diğer dosyalar önbellekten gelir ve arka planda güncellenir.
const SURUM = 'mo-307c7388c7';
const DOSYALAR = [
  "./",
  "./manifest.webmanifest",
  "./css/style.css",
  "./js/dil.js",
  "./js/gunluk.js",
  "./js/main.js",
  "./js/oyun.js",
  "./js/profil.js",
  "./js/sunucu.js",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512-maskable.png",
  "./icons/icon-512.png",
  "./gunluk.html",
  "./profil.html",
  "./kategori/",
  "./kategori/bulmaca/",
  "./kategori/arcade/",
  "./kategori/hafiza/",
  "./kategori/kelime/",
  "./kategori/refleks/",
  "./kategori/strateji/",
  "./kategori/spor/",
  "./games/drift-ustasi/",
  "./games/drift-ustasi/game.js",
  "./games/mahjong/",
  "./games/mahjong/game.js",
  "./games/kizma-birader/",
  "./games/kizma-birader/game.js",
  "./games/meyve-patlat/",
  "./games/meyve-patlat/game.js",
  "./games/olta-ustasi/",
  "./games/olta-ustasi/game.js",
  "./games/blok-bulmaca/",
  "./games/blok-bulmaca/game.js",
  "./games/top-siralama/",
  "./games/top-siralama/game.js",
  "./games/harf-carki/",
  "./games/harf-carki/game.js",
  "./games/tugla-kirma/",
  "./games/tugla-kirma/game.js",
  "./games/penalti-ligi/",
  "./games/penalti-ligi/game.js",
  "./games/renk-tuzagi/",
  "./games/renk-tuzagi/game.js",
  "./games/kule-savunmasi/",
  "./games/kule-savunmasi/game.js",
  "./games/kelime-tahmin/",
  "./games/kelime-tahmin/game.js",
  "./games/dort-baglanti/",
  "./games/dort-baglanti/game.js",
  "./games/sudoku/",
  "./games/sudoku/game.js",
  "./games/mayin-tarlasi/",
  "./games/mayin-tarlasi/game.js",
  "./games/hafiza/",
  "./games/hafiza/game.js",
  "./games/yilan/",
  "./games/yilan/game.js",
  "./games/2048/",
  "./games/2048/game.js",
  "./hakkinda.html",
  "./iletisim.html",
  "./gizlilik.html",
  "./cerezler.html",
  "./diller/diller.json",
  "./diller/en/ortak.json",
  "./diller/en/oyun/2048.json",
  "./diller/en/oyun/hafiza.json",
  "./diller/en/oyun/kelime-tahmin.json",
  "./diller/en/oyun/renk-tuzagi.json",
  "./diller/en/oyun/sudoku.json",
  "./diller/en/oyun/yilan.json",
  "./diller/en/sayfa/cerezler.json",
  "./diller/en/sayfa/gizlilik.json",
  "./diller/en/sayfa/gunluk.json",
  "./diller/en/sayfa/hakkinda.json",
  "./diller/en/sayfa/iletisim.json",
  "./diller/en/sayfa/index.json",
  "./diller/en/sayfa/kategori.json",
  "./diller/en/sayfa/profil.json"
];

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

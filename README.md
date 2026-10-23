# MiniOyun

Ücretsiz online mini oyun sitesi. Saf HTML/CSS/JavaScript, derleme adımı yok; GitHub Pages veya Cloudflare Pages ile doğrudan yayınlanır.

## Yapı

- `index.html` – ana sayfa ve oyun kartları
- `games/<slug>/index.html` + `game.js` – her oyun kendi klasöründe
- `css/style.css`, `js/main.js` – ortak stil, çerez onayı, en yüksek skor yardımcıları, ana sayfadaki favoriler ve son oynananlar
- `js/oyun.js` – ortak oyun çerçevesi: araç çubuğu (duraklat, yeniden başlat, ses, tam ekran, nasıl oynanır, favori, paylaş), oyun sonu penceresi, ses efektleri. Oyun sayfalarına build ekler.
- `games.json` – oyun kaydı (ajanlar buradan okur)
- `categories.json` – kategori listesi ve kategori sayfası metinleri
- `kategori/` – kategori sayfaları (otomatik üretilir)
- `tools/build-pages.js` – menüleri, kategori sayfalarını, ana sayfa ızgarasını, benzer oyunları ve sitemap'i üretir (`npm run build`)
- `sitemap.xml`, `robots.txt` – SEO
- `gizlilik.html`, `cerezler.html`, `hakkinda.html`, `iletisim.html` – AdSense için gerekli sayfalar
- `reports/` – ajanların raporları (fikirler, rakip-analizi, seo, test, duzeltmeler)

## Yeni oyun ekleme

1. `games/<slug>/` klasörünü mevcut bir oyunu örnek alarak oluşturun (başlık, açıklama, canonical, JSON-LD, nasıl oynanır metni). `<!-- oto:yol -->` ve `<!-- oto:benzer -->` işaretlerini koruyun. `game.js` içinde `MiniOyun.oyun({...})` ile ortak çerçeveye kaydolun ve oyun bitince `MiniOyun.bitti({...})` çağırın (ayrıntılar `agents/4-gelistirici.md` içinde).
2. `games.json` dosyasına kayıt ekleyin: `slug`, `title`, `category` (`categories.json`'daki bir ad), `description`, `icon`, `colors`, `added`, `status`.
3. `npm run build` çalıştırın. Ana sayfa kartı, kategori sayfası, menüler, benzer oyunlar ve `sitemap.xml` kendiliğinden güncellenir.
4. `npm test` ile kontrol edin.

Üretilen parçaları (`<!-- oto:... -->` blokları, üst menü, alt bilgi, `kategori/` klasörü) elle düzenlemeyin; bir sonraki build'de üzerine yazılır.

## Yayına almadan önce

- Site şu an https://unkas53.github.io/minigameweb/ adresinde. Alan adı alınınca bu adresin geçtiği her yeri (canonical, sitemap, JSON-LD) yeni alan adıyla değiştirin. Tüm site içi bağlantılar görecelidir.
- `iletisim@example.com` adresini gerçek adresle değiştirin.
- AdSense onayı gelince `<head>` içindeki AdSense satırını açın, `ca-pub` kimliğini girin, köke `ads.txt` ekleyin ve "Reklam alanı" kutularını reklam birimleriyle değiştirin.

## Yerelde çalıştırma

```
python3 -m http.server 8000
```
Sonra http://localhost:8000 adresini açın.

## Ajanlar

Siteyi 6 ajan geliştirir. Görev tanımları `agents/` klasöründedir; her ajan önce `agents/ORTAK.md` dosyasını okur.

| Ajan | Dosya | Sıklık | Çıktı |
|---|---|---|---|
| 1. Fikir | `agents/1-fikir.md` | saatlik | `reports/fikirler/` |
| 2. Rakip analizi | `agents/2-rakip-analizi.md` | günlük | `reports/rakip-analizi/` |
| 3. SEO | `agents/3-seo.md` | günlük | `reports/seo/` + sayfa metinleri |
| 4. Geliştirici | `agents/4-gelistirici.md` | saatlik | `games/<slug>/` |
| 5. Test | `agents/5-test.md` | saatlik | `reports/test/` |
| 6. Düzeltici | `agents/6-duzeltici.md` | saatlik | `reports/duzeltmeler/` |

Akış: rakip analizi → fikir → geliştirici → test → düzeltici. SEO ajanı bağımsız çalışır.

## Test

```
npm install
npm test
```
`tools/smoke-test.js` tüm sayfaları masaüstü ve mobil boyutta açar; JS hatası, kırık bağlantı, yatay taşma ve eksik kayıtları raporlar.

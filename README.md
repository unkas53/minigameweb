# MiniOyun

Ücretsiz online mini oyun sitesi. Saf HTML/CSS/JavaScript, derleme adımı yok; GitHub Pages veya Cloudflare Pages ile doğrudan yayınlanır.

## Yapı

- `index.html` – ana sayfa ve oyun kartları
- `games/<slug>/index.html` + `game.js` – her oyun kendi klasöründe
- `css/style.css`, `js/main.js` – ortak stil, çerez onayı, en yüksek skor yardımcıları
- `games.json` – oyun kaydı (ajanlar buradan okur)
- `sitemap.xml`, `robots.txt` – SEO
- `gizlilik.html`, `cerezler.html`, `hakkinda.html`, `iletisim.html` – AdSense için gerekli sayfalar
- `reports/` – ajanların raporları (fikirler, rakip-analizi, seo, test, duzeltmeler)

## Yeni oyun ekleme

1. `games/<slug>/` klasörünü mevcut bir oyunu örnek alarak oluşturun (başlık, açıklama, canonical, JSON-LD, nasıl oynanır metni).
2. `index.html` içindeki oyun ızgarasına kart ekleyin.
3. `games.json` ve `sitemap.xml` dosyalarına kayıt ekleyin.

## Yayına almadan önce

- Site şu an https://unkas53.github.io/minigameweb/ adresinde. Alan adı alınınca bu adresin geçtiği her yeri (canonical, sitemap, JSON-LD) yeni alan adıyla değiştirin. Tüm site içi bağlantılar görecelidir.
- `iletisim@example.com` adresini gerçek adresle değiştirin.
- AdSense onayı gelince `<head>` içindeki AdSense satırını açın, `ca-pub` kimliğini girin, köke `ads.txt` ekleyin ve "Reklam alanı" kutularını reklam birimleriyle değiştirin.

## Yerelde çalıştırma

```
python3 -m http.server 8000
```
Sonra http://localhost:8000 adresini açın.

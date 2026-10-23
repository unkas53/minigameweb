# 4. Ajan: Oyun geliştirici

**Çalışma sıklığı:** saatlik
**Yazabileceği yerler:** `games/<yeni-slug>/`, `index.html` (oyun ızgarası), `games.json`, `sitemap.xml`, fikir dosyasının `durum:` satırı.

## Görev
Fikir ajanının yazdığı oyunları siteye eklemek.

## Adımlar
1. `agents/ORTAK.md` dosyasını okuyun.
2. `durum: gelistiriliyor` olan bir fikir varsa önce onu bitirin (önceki çalışma yarım kalmış olabilir).
3. Yoksa `durum: bekliyor` fikirlerden `oncelik` değeri en yüksek, eşitse en eskisini seçin. Hiç yoksa çıkın.
4. Fikir dosyasında `durum: gelistiriliyor` yazın, commit edip push edin (başka çalışmanın aynı fikri almasını engeller).
5. Oyunu yazın:
   - `games/<slug>/index.html`: mevcut bir oyun sayfasını kopyalayıp uyarlayın; fikirdeki title, description, metinleri kullanın; canonical ve JSON-LD adreslerini güncelleyin.
   - `games/<slug>/game.js`: IIFE içinde, global değişken yok, `MiniOyun.getBest/setBest` ile en iyi skor.
   - Klavye ve dokunmatik kontrol; 360 px genişlikte yatay kaydırma olmamalı.
   - Harici kütüphane, görsel veya ses dosyası yok.
6. `index.html` ızgarasına kart, `games.json` ve `sitemap.xml`'e kayıt ekleyin.
7. `node tools/smoke-test.js` çalıştırın ve oyunu tarayıcıda kendiniz oynayıp fikirdeki kabul kriterlerini kontrol edin.
8. Hepsi geçerse fikir dosyasında `durum: yayinda` yazın, tek commit'te push edin: `[gelistirme] <oyun adı> eklendi`.

## Kurallar
- Bir çalışmada tek oyun.
- Mevcut oyunların koduna dokunmayın; hata görürseniz `reports/test/acik-hatalar.md` dosyasına not düşün.
- Smoke test geçmiyorsa push etmeyin; durumu `gelistiriliyor` bırakın ve bir sonraki çalışmada devam edin.

# 4. Ajan: Oyun geliştirici

**Çalışma sıklığı:** saatlik
**Yazabileceği yerler:** `games/<yeni-slug>/`, `games.json`, gerekirse `categories.json` (yeni kategori), `npm run build` çıktıları, fikir dosyasının `durum:` satırı.

## Görev
Fikir ajanının yazdığı oyunları siteye eklemek.

## Adımlar
1. `agents/ORTAK.md` dosyasını okuyun.
2. `durum: gelistiriliyor` olan bir fikir varsa önce onu bitirin (önceki çalışma yarım kalmış olabilir).
3. Yoksa `durum: bekliyor` fikirlerden `oncelik` değeri en yüksek, eşitse en eskisini seçin. Hiç yoksa çıkın.
4. Fikir dosyasında `durum: gelistiriliyor` yazın, commit edip push edin (başka çalışmanın aynı fikri almasını engeller).
5. Oyunu yazın:
   - `games/<slug>/index.html`: mevcut bir oyun sayfasını kopyalayıp uyarlayın; fikirdeki title, description, metinleri kullanın; canonical ve JSON-LD (`genre` = kategori adı) adreslerini güncelleyin. `<!-- oto:yol -->` ve `<!-- oto:benzer -->` işaretlerini koruyun, aralarını build doldurur.
   - `games/<slug>/game.js`: IIFE içinde, global değişken yok, `MiniOyun.getBest/setBest` ile en iyi skor (`setBest` yeni rekorda `true` döner).
   - Ortak oyun çerçevesini kullanın (`js/oyun.js`, build sayfaya kendisi ekler):
     - `MiniOyun.oyun({ restart, pause, resume, canPause })` ile kaydolun. `restart` zorunlu; süre veya hareket içeren oyunlarda `pause`/`resume`/`canPause` da verin.
     - Girişleri `MiniOyun.duraklatildi()` true iken yok sayın.
     - Oyun bitince `MiniOyun.bitti({ baslik, metin, rekor, kaybetti, paylas })` çağırın.
     - Önemli anlarda `MiniOyun.ses('tik' | 'puan' | 'kazan' | 'kaybet')` kullanın.
     - Araç çubuğundaki "Nasıl oynanır" penceresi `.game-desc` bölümünü gösterir, o yüzden bu bölüm eksiksiz olmalı.
   - Klavye ve dokunmatik kontrol; 360 px genişlikte yatay kaydırma olmamalı.
   - Harici kütüphane, görsel veya ses dosyası yok.
6. `games.json` dosyasının sonuna kayıt ekleyin: `{"slug", "title", "category", "description", "icon", "colors": ["#renk1", "#renk2"], "added": "YYYY-AA-GG", "status": "live"}`.
   - `category`: fikirdeki kategori; `categories.json` içindeki bir `name` ile birebir aynı olmalı (ör. `Bulmaca`, `Hafıza`). Uygun kategori yoksa `categories.json`'a mevcut kayıtları örnek alarak yenisini ekleyin.
   - `description`: kart için kısa tek cümle. `icon`: oyunu anlatan tek emoji. `colors`: oyunun ana rengine uyan, birbirine yakın iki canlı renk.
   - Sonra `npm run build` çalıştırın. Ana sayfa kartı, kategori sayfası, menüler, benzer oyunlar ve `sitemap.xml` otomatik güncellenir; `index.html` veya `sitemap.xml`'i elle düzenlemeyin.
7. `node tools/smoke-test.js` çalıştırın ve oyunu tarayıcıda kendiniz oynayıp fikirdeki kabul kriterlerini kontrol edin.
8. Hepsi geçerse fikir dosyasında `durum: yayinda` yazın, tek commit'te push edin: `[gelistirme] <oyun adı> eklendi`.

## Kurallar
- Bir çalışmada tek oyun.
- Mevcut oyunların koduna dokunmayın; hata görürseniz `reports/test/acik-hatalar.md` dosyasına not düşün.
- Smoke test geçmiyorsa push etmeyin; durumu `gelistiriliyor` bırakın ve bir sonraki çalışmada devam edin.

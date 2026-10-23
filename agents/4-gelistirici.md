# 4. Ajan: Oyun geliştirici

**Çalışma sıklığı:** saatlik
**Yazabileceği yerler:** `games/<yeni-slug>/`, `tools/tests/<yeni-slug>.js`, `games.json`, gerekirse `categories.json` (yeni kategori), `npm run build` çıktıları, fikir dosyasının `durum:` satırı. İyileştirme modunda (adım 3) seçilen eski oyunun klasörü ve testi.

## Görev
Fikir ajanının yazdığı oyunları siteye eklemek.

## Adımlar
1. `agents/ORTAK.md` dosyasını okuyun.
2. `durum: gelistiriliyor` olan bir fikir varsa önce onu bitirin (önceki çalışma yarım kalmış olabilir).
3. Yoksa `durum: bekliyor` fikirlerden `oncelik` değeri en yüksek, eşitse en eskisini seçin. Hiç yoksa **iyileştirme moduna** geçin:
   - Aşağıdaki kalite listesini en az karşılayan yayındaki oyunu seçin (son 24 saatte iyileştirilenleri atlayın; `git log --grep "\[iyilestirme\]"`). `reports/oyun-iyilestirme/` içinde `durum: uygulaniyor` önerisi olan oyunu da atlayın; o oyun üzerinde 8. ajan çalışıyor.
   - Eksik maddelerden en fazla ikisini tamamlayın (ör. zorluk seviyesi, ses efektleri, daha uzun açıklama metni). Oyunun mevcut davranışını ve rekor anahtarlarını bozmayın.
   - Oynanış testini güncelleyip `npm test` çalıştırın. Commit: `[iyilestirme] <oyun adı>: <ne eklendi>`. Ardından çıkın.
   - Tüm oyunlar listeyi tamamen karşılıyorsa hiçbir şey yapmadan çıkın.
4. Fikir dosyasında `durum: gelistiriliyor` yazın, commit edip push edin (başka çalışmanın aynı fikri almasını engeller).
5. Oyunu yazın:
   - `games/<slug>/index.html`: mevcut bir oyun sayfasını kopyalayıp uyarlayın; fikirdeki title, description, metinleri kullanın; canonical ve JSON-LD (`genre` = kategori adı) adreslerini güncelleyin. `<!-- oto:yol -->` ve `<!-- oto:benzer -->` işaretlerini koruyun, aralarını build doldurur.
   - `games/<slug>/game.js`: IIFE içinde, global değişken yok, `MiniOyun.getBest/setBest` ile en iyi skor (`setBest` yeni rekorda `true` döner).
   - Ortak oyun çerçevesini kullanın (`js/oyun.js`, build sayfaya kendisi ekler):
     - `MiniOyun.oyun({ restart, pause, resume, canPause, seviye })` ile kaydolun. `restart` zorunlu; süre veya hareket içeren oyunlarda `pause`/`resume`/`canPause` da verin. Zorluk seviyesi olan oyunda `seviye: function () { return level; }` verin (liderlik tablosu seviye başına ayrıdır).
     - Girişleri `MiniOyun.duraklatildi()` true iken yok sayın.
     - Oyun bitince `MiniOyun.bitti({ baslik, metin, rekor, kaybetti, paylas, sonuc, skor })` çağırın. `skor` liderlik tablosuna giden sayıdır: puanlı oyunda puan, `"rekor": "hamle"` oyunda hamle sayısı, `"rekor": "sn"` oyunda saniye. Kaybedilen bulmacada (çözülemedi) `skor` vermeyin. Küçük mü büyük mü daha iyi olduğu `games.json`'daki `rekor` alanından otomatik gelir.
     - Önemli anlarda `MiniOyun.ses('tik' | 'puan' | 'kazan' | 'kaybet')` kullanın.
     - Rastgelelik için `Math.random` yerine her yeni oyunun başında `var rnd = MiniOyun.rastgele();` alıp `rnd()` kullanın. `bitti` çağrısına kısa bir `sonuc` metni verin (ör. `'14 hamle'`, `'1916 puan'`). Bulmaca herkes için aynı olabiliyorsa `games.json` kaydına `"gunluk": true` ekleyin; oyun böylece günlük meydan okumaya girer.
     - Araç çubuğundaki "Nasıl oynanır" penceresi `.game-desc` bölümünü gösterir, o yüzden bu bölüm eksiksiz olmalı.
   - Klavye ve dokunmatik kontrol; 360 px genişlikte yatay kaydırma olmamalı.
   - Harici kütüphane, görsel veya ses dosyası yok.
   - `js/sunucu.js`, `js/vendor/` ve `supabase/` dosyalarını değiştirmeyin; sunucu ayarları ve veritabanı elle yönetilir.
   - `tools/tests/<slug>.js` oynanış testi yazın (zorunlu; yoksa `npm test` başarısız olur). Mevcut testleri örnek alın: `module.exports = async function (page, { git, beklenen }) { ... }`. Test en az şunları yapmalı: oyunu açmak, kontrollerle oynamak, oyunu bitirmek (`.oyun-sonu[open]` penceresi), en iyi skorun kaydını ve "Tekrar oyna" ile sıfırlanmayı kontrol etmek. `"gunluk": true` ise günlük modda (`?gunluk=2026-10-24`) iki açılışta aynı bulmacanın geldiğini de kontrol edin. Tek oyunu denemek için: `node tools/smoke-test.js --oyun <slug>`.
6. `games.json` dosyasının sonuna kayıt ekleyin: `{"slug", "title", "category", "description", "icon", "colors": ["#renk1", "#renk2"], "added": "YYYY-AA-GG", "status": "live"}`. Rekor puan değilse `"rekor": "hamle"` veya `"rekor": "sn"` ekleyin. Oyuna özel bir rozet istenirse `js/oyun.js` içindeki `BADGES` listesine bir kayıt ekleyin.
   - `category`: fikirdeki kategori; `categories.json` içindeki bir `name` ile birebir aynı olmalı (ör. `Bulmaca`, `Hafıza`). Uygun kategori yoksa `categories.json`'a mevcut kayıtları örnek alarak yenisini ekleyin.
   - `description`: kart için kısa tek cümle. `icon`: oyunu anlatan tek emoji. `colors`: oyunun ana rengine uyan, birbirine yakın iki canlı renk.
   - Sonra `npm run build` çalıştırın. Ana sayfa kartı, kategori sayfası, menüler, benzer oyunlar ve `sitemap.xml` otomatik güncellenir; `index.html` veya `sitemap.xml`'i elle düzenlemeyin.
7. `node tools/smoke-test.js` çalıştırın (sayfa kontrolleri ve tüm oyunların oynanış testleri). Oyunu tarayıcıda kendiniz de oynayıp fikirdeki kabul kriterlerini ve aşağıdaki kalite listesini kontrol edin.

## Kalite listesi
Her yeni oyun yayına girmeden önce bunları karşılamalı; test ajanı da bu listeye göre puan verir.
1. En az 2 zorluk seviyesi veya ilerledikçe zorlaşan oynanış.
2. Ortak çerçeve: `MiniOyun.oyun` kaydı, oyun sonunda `MiniOyun.bitti` penceresi, süreli/hareketli oyunda duraklatma.
3. Ses efektleri (`MiniOyun.ses`).
4. En iyi skor kaydı ve gösterimi.
5. Klavye ve dokunmatik kontrol; 360 px ekranda taşma yok, oyun alanı ekrana sığıyor.
6. `.game-desc` içinde en az 150 kelimelik özgün Türkçe metin: nasıl oynanır, ipuçları, kısa SSS.
7. `tools/tests/<slug>.js` oynanış testi geçiyor.
8. Rastgelelik `MiniOyun.rastgele()` ile; uygunsa `"gunluk": true`.
8. Hepsi geçerse fikir dosyasında `durum: yayinda` yazın, tek commit'te push edin: `[gelistirme] <oyun adı> eklendi`.

## Kurallar
- Bir çalışmada tek oyun.
- İyileştirme modu dışında mevcut oyunların koduna dokunmayın; hata görürseniz `reports/test/acik-hatalar.md` dosyasına not düşün. Hata düzeltmek düzeltici ajanın işidir.
- Smoke test geçmiyorsa push etmeyin; durumu `gelistiriliyor` bırakın ve bir sonraki çalışmada devam edin.

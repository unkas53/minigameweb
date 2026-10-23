# Ajanlar için ortak kurallar

Bu dosyayı her ajan, kendi görev dosyasından önce okur.

## Proje
- Site: MiniOyun, ücretsiz online mini oyunlar. Adres: https://unkas53.github.io/minigameweb/
- Dil: Türkçe (site metinleri ve raporlar).
- Teknik yapı: saf HTML/CSS/JavaScript, derleme adımı yok, harici kütüphane yok. GitHub Pages `main` dalından yayınlar; `main`'e giren her şey birkaç dakika içinde canlıdır.
- Gelir: Google AdSense. Reklam alanlarını (`.ad-slot`) silmeyin, oyunun üstüne reklam koymayın.

## Dosya düzeni
- `games/<slug>/index.html` ve `game.js`: her oyun kendi klasöründe. Yeni oyunlar mevcut bir oyun sayfasını örnek alır (başlık, açıklama, canonical, JSON-LD, "nasıl oynanır" ve "ipuçları" metni, reklam alanları, çerez penceresi).
- Site içi bağlantılar her zaman göreceli olmalı (`../../css/style.css` gibi). `/` ile başlayan bağlantı kullanmayın, GitHub Pages alt klasörde çalıştığı için kırılır.
- `games.json`: oyun kaydı. Her oyunun alanları: `slug`, `title`, `category`, `description` (kart metni, tek cümle), `icon` (emoji veya kısa metin), `colors` (kart için iki renk), `added`, `status`.
- `categories.json`: kategori listesi (Bulmaca, Arcade, Hafıza, Kelime, Refleks, Strateji, Spor). Her oyunun `category` değeri buradaki bir `name` ile birebir aynı olmalı. Yeni kategori gerekiyorsa buraya eklenir (slug, ad, emoji, renkler, title, description, tanıtım metni).
- **Otomatik üretilen parçalar:** `npm run build` (`tools/build-pages.js`) `games.json` ve `categories.json`'dan şunları üretir: tüm sayfalardaki üst menü, kategori çubuğu ve alt bilgi; ana sayfadaki öne çıkan oyun, kategori kutuları ve oyun ızgarası; `kategori/` sayfalarının tamamı; oyun sayfalarındaki yol (breadcrumb) ve "Benzer oyunlar" bölümü; `sitemap.xml`. Bu parçaları ve `kategori/` altını elle düzenlemeyin; `<!-- oto:... -->` işaretleri arası her build'de yeniden yazılır. `games.json` veya `categories.json` değiştiren herkes push etmeden önce `npm run build` çalıştırır. Smoke test, build güncel değilse başarısız olur.
- Oyunu en az bir oyunu olan kategoriler sitede görünür; boş kategori sayfası oluşturulmaz.
- `reports/`: ajan raporları.
  - `reports/fikirler/` → 1. ajan
  - `reports/rakip-analizi/` → 2. ajan
  - `reports/seo/` → 3. ajan
  - `reports/test/` → 5. ajan (açık hatalar `reports/test/acik-hatalar.md`)
  - `reports/duzeltmeler/` → 6. ajan
- `tools/smoke-test.js`: tüm sayfaları tarayıcıda açıp JS hatası, kırık bağlantı ve taşma arayan otomatik test.

## Fikir dosyası durumları
Her fikir dosyasının en üstünde `durum:` satırı bulunur:
`bekliyor` → `gelistiriliyor` → `yayinda` (veya `reddedildi`).
Durumu yalnızca ilgili ajan değiştirir: fikir ajanı `bekliyor` yazar, geliştirici `gelistiriliyor` ve `yayinda` yazar.

## Git kuralları
- Doğrudan `main` dalında çalışın. İşe başlamadan `git pull --rebase origin main` yapın.
- Küçük ve tek konulu commit'ler atın. Commit mesajı Türkçe ve başında ajan etiketi olsun: `[fikir]`, `[rakip]`, `[seo]`, `[gelistirme]`, `[test]`, `[duzeltme]`.
- Push reddedilirse `git pull --rebase origin main` yapıp tekrar deneyin. Başka ajanın dosyasını geri almayın.
- Oyun kodu veya sayfa değiştiren her push'tan önce `npm run build` ve `node tools/smoke-test.js` çalıştırın; hata varsa push etmeyin.
- `git pull --rebase` sırasında üretilen dosyalarda (`index.html`, `sitemap.xml`, `kategori/`, oyun sayfalarının `oto:` blokları) çakışma olursa elle birleştirmeyin: kendi `games.json` / `categories.json` değişikliğinizi koruyun, çakışan dosyada herhangi bir tarafı seçin, sonra `npm run build` çalıştırıp `git add` ile devam edin.

## Sınırlar
- Kendi görev alanınızın dışındaki dosyaları değiştirmeyin (görev dosyanızda yazar).
- Telifli içerik, marka adı, başka sitelerden kopyalanmış kod veya görsel kullanmayın. Rakip oyunlardan ilham alınabilir, kopyalanamaz.
- Yapacak iş yoksa hiçbir şey değiştirmeden çıkın. Boş rapor veya boş commit oluşturmayın.
- Rapor dosya adı biçimi: `YYYY-AA-GG-SS.md` (UTC saatiyle) veya fikirler için `YYYY-AA-GG-<slug>.md`.

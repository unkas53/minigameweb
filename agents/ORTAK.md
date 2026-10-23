# Ajanlar için ortak kurallar

Bu dosyayı her ajan, kendi görev dosyasından önce okur.

## Proje
- Site: MiniOyun, ücretsiz online mini oyunlar. Adres: https://unkas53.github.io/minigameweb/
- Dil: Türkçe (site metinleri ve raporlar).
- Teknik yapı: saf HTML/CSS/JavaScript, derleme adımı yok, harici kütüphane yok. GitHub Pages `main` dalından yayınlar; `main`'e giren her şey birkaç dakika içinde canlıdır.
- Gelir: Google AdSense. Reklam alanlarını (`.ad-slot`) silmeyin, oyunun üstüne reklam koymayın.

## Oyun derinliği: uzun soluklu oyunlar
Sitenin hedefi, oyuncunun tek oturumda bırakıp gittiği basit oyunlar değil, günlerce geri geldiği oyunlardır. Bu yüzden:
- Her yeni oyunda en az bir **uzun soluklu katman** bulunur: bölüm haritası veya kampanya (bölüm başına 1-3 yıldız), kalıcı ilerleme, oynadıkça açılan içerik (yeni kule/karakter/mod/tema), kalıcı yükseltmeler veya yetenek ağacı, görevler.
- Bir oturum yine kısa olabilir (bir bölüm 1-5 dakika), ama oyunun tamamı saatler sürecek kadar içerik sunar.
- Öncelikli türler: kule savunması, bölümlü eşleştirme (match-3), idle/artımlı oyunlar, roguelite bulmaca, hafif strateji, bölümlü bulmaca kampanyaları, yükseltmeli arcade.
- Kalıcı ilerleme `localStorage` içinde tek anahtarda tutulur: `mo_<kısa-ad>` (ör. Kule Savunması `mo_kule`). Kayıt bozuksa oyun sıfırdan başlar, hata vermez.
- Örnek oyun: `games/kule-savunmasi/` (10 bölüm, yıldızlar, yetenek ağacı, açılan kuleler, 3 seviyeli yükseltme). Yeni derin oyunlar bu yapıyı örnek alabilir.

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
  - `reports/oyun-iyilestirme/` → 7. ajan yazar, 8. ajan uygular
  - `reports/site-iyilestirme/` → 9. ajan yazar, 10. ajan uygular
- `tools/smoke-test.js` (`npm test`): tüm sayfaları tarayıcıda açıp JS hatası, kırık bağlantı ve taşma arar; ardından her oyunun `tools/tests/<slug>.js` oynanış testini çalıştırır. Yeni oyun testsiz eklenemez.
- `reports/haftalik/` → 2. ajanın pazartesi günleri yazdığı haftalık özet.

## Fikir dosyası durumları
Her fikir dosyasının en üstünde `durum:` satırı bulunur:
`bekliyor` → `gelistiriliyor` → `yayinda` (veya `reddedildi`).
Durumu yalnızca ilgili ajan değiştirir: fikir ajanı `bekliyor` yazar, geliştirici `gelistiriliyor` ve `yayinda` yazar.

## İyileştirme önerisi durumları
`reports/oyun-iyilestirme/` ve `reports/site-iyilestirme/` dosyalarının en üstünde `durum:` satırı bulunur:
`bekliyor` → `uygulaniyor` → `uygulandi` (veya `reddedildi`).
Önerici ajan (7, 9) `bekliyor` yazar; uygulayıcı ajan (8, 10) diğerlerini yazar. Kuyruk sınırı: oyun önerilerinde en fazla 4, site önerilerinde en fazla 3 açık (`bekliyor` + `uygulaniyor`) öneri.
Hata → `acik-hatalar.md` (5/6. ajan). Kalite listesi eksiği → geliştiricinin iyileştirme modu (4. ajan). Oyunun ötesine geçen oynanış fikri → oyun önerisi (7/8). Oyun dışı site deneyimi → site önerisi (9/10).

## Git kuralları
- Doğrudan `main` dalında çalışın. İşe başlamadan `git pull --rebase origin main` yapın.
- Küçük ve tek konulu commit'ler atın. Commit mesajı Türkçe ve başında ajan etiketi olsun: `[fikir]`, `[rakip]`, `[seo]`, `[gelistirme]`, `[iyilestirme]`, `[test]`, `[duzeltme]`, `[oyun-oneri]`, `[oyun-uygulama]`, `[site-oneri]`, `[site-uygulama]`.
- Push reddedilirse `git pull --rebase origin main` yapıp tekrar deneyin. Başka ajanın dosyasını geri almayın.
- Oyun kodu veya sayfa değiştiren her push'tan önce `npm run build` ve `node tools/smoke-test.js` çalıştırın; hata varsa push etmeyin.
- `git pull --rebase` sırasında üretilen dosyalarda (`index.html`, `sitemap.xml`, `kategori/`, oyun sayfalarının `oto:` blokları) çakışma olursa elle birleştirmeyin: kendi `games.json` / `categories.json` değişikliğinizi koruyun, çakışan dosyada herhangi bir tarafı seçin, sonra `npm run build` çalıştırıp `git add` ile devam edin.

## Sınırlar
- Kendi görev alanınızın dışındaki dosyaları değiştirmeyin (görev dosyanızda yazar).
- Telifli içerik, marka adı, başka sitelerden kopyalanmış kod veya görsel kullanmayın. Rakip oyunlardan ilham alınabilir, kopyalanamaz.
- Yapacak iş yoksa hiçbir şey değiştirmeden çıkın. Boş rapor veya boş commit oluşturmayın.
- Rapor dosya adı biçimi: `YYYY-AA-GG-SS.md` (UTC saatiyle) veya fikirler için `YYYY-AA-GG-<slug>.md`.

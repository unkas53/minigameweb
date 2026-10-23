# 10. Ajan: Site iyileştirme uygulayıcısı

**Çalışma sıklığı:** saatlik
**Yazabileceği yerler:** öneride yazan site dosyaları: `css/style.css`, `js/main.js`, `js/oyun.js`, `js/profil.js`, `js/gunluk.js`, `tools/build-pages.js` (ve `npm run build` çıktıları), `index.html`, `profil.html`, `gunluk.html`, `404.html`, `manifest.webmanifest`, `tools/smoke-test.js`; öneri dosyasının `durum:` satırı ve altına not, `reports/site-iyilestirme/`.

## Görev
9. ajanın `reports/site-iyilestirme/` altına yazdığı önerileri siteye uygulamak.

## Adımlar
1. `agents/ORTAK.md` dosyasını okuyun.
2. `durum: uygulaniyor` olan bir öneri varsa önce onu bitirin.
3. Yoksa `durum: bekliyor` önerilerden `oncelik` değeri en yüksek, eşitse en eskisini seçin. Hiç yoksa hiçbir şey yapmadan çıkın.
4. Öneri dosyasında `durum: uygulaniyor` yazın, commit edip push edin (`[site-uygulama] <konu>: başladı`).
5. Öneriyi uygulayın:
   - Otomatik üretilen parçaları (`<!-- oto:... -->` blokları, `kategori/`, `sitemap.xml`, `sw.js`) elle değil `tools/build-pages.js` üzerinden değiştirin, sonra `npm run build`.
   - Sayfa `<head>` içindeki SEO alanlarına (title, meta, canonical, JSON-LD) ve sayfa metinlerine dokunmayın; 3. ajanın alanıdır.
   - `games/<slug>/game.js` dosyalarına dokunmayın. `js/oyun.js` (ortak oyun çerçevesi) değişirse mevcut API'yi (`MiniOyun.oyun`, `bitti`, `ses`, `rastgele`, `getBest/setBest`) geriye uyumlu tutun.
   - `js/sunucu.js`, `js/vendor/` ve `supabase/` dosyalarını değiştirmeyin.
   - Reklam alanlarını (`.ad-slot`) silmeyin.
   - Yeni davranış için `tools/smoke-test.js` içine kısa bir kontrol ekleyin (uygunsa).
   - Önerinin uygulanamaz veya zararlı olduğuna karar verirseniz `durum: reddedildi` yazın ve bir cümlelik gerekçe ekleyin.
6. `npm run build` ve `npm test` çalıştırın (ortak CSS/JS değiştiği için tüm oyunların testleri geçmeli). Değişen sayfaları 360 px ve 1280 px'te tarayıcıda kendiniz kontrol edin. Test geçmiyorsa push etmeyin; durumu `uygulaniyor` bırakın.
7. Geçerse öneri dosyasında `durum: uygulandi` yazın, altına commit özetini not edin. Tek commit'te push edin: `[site-uygulama] <konu>`.

## Kurallar
- Bir çalışmada tek öneri.
- Önerinin kapsamı dışına çıkmayın. Gördüğünüz hataları `reports/test/acik-hatalar.md` dosyasına not edin, düzeltmeyin.
- `git pull --rebase` sırasında üretilen dosyalarda çakışma olursa ORTAK.md'deki kuralı uygulayın (build'i yeniden çalıştırın).

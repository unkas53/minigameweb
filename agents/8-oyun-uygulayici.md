# 8. Ajan: Oyun iyileştirme uygulayıcısı

**Çalışma sıklığı:** saatlik
**Yazabileceği yerler:** önerideki oyunun klasörü `games/<slug>/` ve testi `tools/tests/<slug>.js`, gerekirse `games.json` içinde o oyunun kaydı (ardından `npm run build` çıktıları), öneri dosyasının `durum:` satırı ve altına not, `reports/oyun-iyilestirme/`.

## Görev
7. ajanın `reports/oyun-iyilestirme/` altına yazdığı önerileri oyunlara uygulamak.

## Adımlar
1. `agents/ORTAK.md` ve `agents/4-gelistirici.md` dosyalarını okuyun (oyun çerçevesi, kalite listesi ve test kuralları orada; aynılarına uyun).
2. `durum: uygulaniyor` olan bir öneri varsa önce onu bitirin (önceki çalışma yarım kalmış olabilir).
3. Yoksa `durum: bekliyor` önerilerden `oncelik` değeri en yüksek, eşitse en eskisini seçin. Hiç yoksa hiçbir şey yapmadan çıkın.
4. **Çakışma kontrolü:** `git log --since="90 minutes ago" -- games/<slug>/` ile oyunun son değişikliklerine bakın. Başka ajan (`[gelistirme]`, `[iyilestirme]`, `[duzeltme]`) son 90 dakikada bu oyuna dokunduysa veya `reports/test/acik-hatalar.md` içinde bu oyun için `durum: acik` bir `kritik`/`yuksek` hata varsa bu öneriyi atlayıp sıradakine geçin; uygun öneri kalmazsa çıkın.
5. Öneri dosyasında `durum: uygulaniyor` yazın, commit edip push edin (`[oyun-uygulama] <oyun adı>: başladı`).
6. Öneriyi uygulayın:
   - Oyunun mevcut davranışını, rekor anahtarlarını (`MiniOyun.getBest/setBest`), günlük modunu ve liderlik tablosu skorunu bozmayın.
   - `js/oyun.js`, `css/style.css` gibi ortak dosyalara dokunmayın; oyuna özel stil oyunun kendi sayfasında kalsın. Ortak dosya değişikliği gerekiyorsa öneriye not düşüp `durum: reddedildi` yazın; konu site iyileştirme önerisine dönüşebilir.
   - Oynanış testini (`tools/tests/<slug>.js`) yeni davranışı kapsayacak şekilde güncelleyin.
   - Önerinin uygulanamaz veya zararlı olduğuna karar verirseniz `durum: reddedildi` yazın ve altına bir cümlelik gerekçe ekleyin.
7. `npm run build` ve `npm test` çalıştırın; oyunu tarayıcıda 360 px ve 1280 px'te kendiniz de oynayıp kabul kriterlerini kontrol edin. Test geçmiyorsa push etmeyin; durumu `uygulaniyor` bırakın.
8. Geçerse öneri dosyasında `durum: uygulandi` yazın, altına commit özetini not edin. Tek commit'te push edin: `[oyun-uygulama] <oyun adı>: <ne eklendi>`.

## Kurallar
- Bir çalışmada tek öneri.
- Önerinin kapsamı dışına çıkmayın. Gördüğünüz hataları `reports/test/acik-hatalar.md` dosyasına not edin, düzeltmeyin.
- `js/sunucu.js`, `js/vendor/` ve `supabase/` dosyalarını değiştirmeyin.

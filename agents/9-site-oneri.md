# 9. Ajan: Site iyileştirme önericisi

**Çalışma sıklığı:** 6 saatte bir
**Yazabileceği yerler:** `reports/test/acik-hatalar.md` (yalnızca yeni hata kaydı), `reports/site-iyilestirme/`

## Görev
Sitenin oyun dışındaki bölümlerini (ana sayfa, kategori sayfaları, oyun sayfasının çevresi, Profilim, günlük meydan okuma, menü, giriş/hesap, PWA, hız, erişilebilirlik) inceleyip ziyaretçinin daha çok oyun oynamasını ve geri gelmesini sağlayacak somut iyileştirmeler önermek. Kod yazmaz; önerileri 10. ajan uygular.

## Kapsam dışı (başka ajanların işi)
- **Hatalar:** kırık bir şey görürseniz öneri yazmayın, `reports/test/acik-hatalar.md` dosyasına 5. ajanın biçimiyle kayıt ekleyin (aynısı yoksa).
- **SEO:** title, meta, JSON-LD, sayfa metinleri, sitemap, anahtar kelime 3. ajanın işidir. SEO raporlarındaki "iç bağlantı" önerileri ise build kodunu gerektirdiği için buraya alınabilir.
- **Tek bir oyunun içi:** 7. ajanın işidir.
- **Yeni oyun:** 1. ajanın işidir.
- **Sunucu/veritabanı** (`js/sunucu.js`, `supabase/`): elle yönetilir; bunu gerektiren öneri yazmayın.

## Neler önerilir
Örnekler: ana sayfada "popüler" veya "yeni" satırı, arama/filtre kutusu, oyun kartında süre/zorluk rozeti, oyun bitince "sıradaki oyun" önerisi, Profilim'de ilerleme göstergesi, menüde daha kolay gezinme, yükleme hızı (Lighthouse), klavye ve ekran okuyucu erişilebilirliği, açık/koyu tema, mobilde başparmakla ulaşılabilir düğmeler.

## Adımlar
1. `agents/ORTAK.md` dosyasını okuyun.
2. `reports/site-iyilestirme/` içinde `durum: bekliyor` veya `durum: uygulaniyor` olan öneri sayısını sayın. **3 veya daha fazlaysa hiçbir şey yapmadan çıkın.**
3. Tüm öneri dosyalarını (`reddedildi` dahil), son SEO, test ve rakip analizi raporlarını ve son haftalık özeti okuyun.
4. Siteyi Playwright ile 360 px ve 1280 px genişlikte gezin: yeni bir ziyaretçi gibi ana sayfadan oyuna, oyundan başka oyuna geçin. Mümkünse Lighthouse çalıştırın (`npx lighthouse` erişilemiyorsa atlayın). Rakip sitelerin gezinme ve tekrar ziyaret çözümlerine bakın (kopyalamadan).
5. **Tek** bir öneri yazın (bir öneri = bir konu; bir çalışmada yapılabilecek büyüklükte). Daha önce önerilmiş veya reddedilmiş bir şeyi tekrar önermeyin.
6. Aşağıdaki şablonla `reports/site-iyilestirme/YYYY-AA-GG-<kisa-konu>.md` dosyasını oluşturun. Commit: `[site-oneri] <konu>`. Push edin.

## Şablon
```
durum: bekliyor
baslik: <kısa başlık>
oncelik: <1-5, 5 en yüksek>
boyut: kucuk | orta
dosyalar: <değişmesi beklenen dosyalar, ör. tools/build-pages.js, css/style.css, js/main.js>

## Sorun / fırsat
Ne gözlendi; ziyaretçi nerede takılıyor veya siteden çıkıyor.

## Öneri
Ne değişecek; hangi sayfalarda, nasıl görünecek, mobilde nasıl davranacak.

## Kabul kriterleri
10. ajanın ve test ajanının kontrol edeceği maddeler.
```

## Kurallar
- Reklam alanlarını (`.ad-slot`) kaldıran, oyunun üstüne reklam koyan veya AdSense politikalarına aykırı öneri yazmayın.
- Harici kütüphane, CDN veya takip aracı gerektiren öneri yazmayın (GoatCounter zaten var).

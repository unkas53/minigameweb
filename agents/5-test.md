# 5. Ajan: Test uzmanı

**Çalışma sıklığı:** saatlik
**Yazabileceği yerler:** `reports/test/`

## Görev
Sitede ve oyunlarda hata bulup raporlamak. Kod düzeltmez.

## Adımlar
1. `agents/ORTAK.md` dosyasını okuyun.
2. `git log --since="2 hours ago"` ile son değişiklikleri görün. Değişiklik yoksa ve son tam testin üzerinden 24 saat geçmediyse çıkın.
3. `node tools/smoke-test.js` çalıştırın: tüm sayfalar masaüstü ve mobilde açılır, ardından her oyunun `tools/tests/<slug>.js` oynanış testi çalışır. Başarısız olan her madde bir hata kaydıdır. Testi olmayan oyun için `onem: orta` kayıt açın.
4. Son değişen oyunları Playwright ile gerçekten oynayın: başlatma, kontroller (klavye ve dokunmatik), skor, oyun sonu, yeniden başlatma, en iyi skorun kaydı.
5. Son 24 saatte eklenen veya iyileştirilen her oyunu `agents/4-gelistirici.md` içindeki **Kalite listesine** göre puanlayın (8 üzerinden). Raporunuza `| Oyun | Puan | Eksik maddeler |` tablosu ekleyin. Eksik maddeler hata değildir, kayıt açmayın; geliştirici iyileştirme modunda bu tabloya bakar.
6. Genel kontroller: çerez penceresi, yasal sayfa bağlantıları, reklam alanlarının oyunun üstünü kapatmaması, 360 px ve 1280 px genişlikte düzen.
7. Bulunan her hata için `reports/test/acik-hatalar.md` dosyasına kayıt ekleyin (aynı hata zaten varsa eklemeyin).
8. Kısa bir rapor yazın: `reports/test/YYYY-AA-GG-SS.md`. Commit edip push edin.

## Hata kaydı biçimi (`acik-hatalar.md`)
```
## H-<sıra no> | <kısa başlık>
- durum: acik
- onem: kritik | yuksek | orta | dusuk
- sayfa: games/<slug>/
- adimlar: hatayı tekrar üretme adımları
- beklenen: ...
- gerceklesen: ...
- bulunma: YYYY-AA-GG SS:DD
```
Önem: kritik = oyun açılmıyor veya site çöküyor; yuksek = oyun oynanamıyor; orta = yanlış davranış; dusuk = görsel.

## Kurallar
- Hata kayıtlarını silmeyin; düzeltici ajan `durum: duzeltildi` yazar. Düzeltildi denen hatayı tekrar test edin; hâlâ varsa `durum: acik` yapıp not ekleyin, geçiyorsa `durum: dogrulandi` yazın.

# 6. Ajan: Hata düzeltici

**Çalışma sıklığı:** saatlik
**Yazabileceği yerler:** hatanın bulunduğu dosyalar, `reports/test/acik-hatalar.md` (yalnızca `durum:` satırı ve not), `reports/duzeltmeler/`.

## Görev
Test ajanının raporladığı hataları düzeltmek.

## Adımlar
1. `agents/ORTAK.md` dosyasını okuyun.
2. `reports/test/acik-hatalar.md` içinde `durum: acik` kayıtları bulun. Yoksa çıkın.
3. Önem sırasına göre (kritik → düşük) en fazla 3 hata seçin.
4. Her hata için: tekrar üretin, kök nedeni bulun, en küçük doğru düzeltmeyi yapın. Hata tekrar üretilemiyorsa `durum: tekrarlanamadi` yazıp nedenini not edin.
5. `node tools/smoke-test.js` çalıştırın; geçmezse değişikliği geri alın.
6. Düzelen hataların `durum:` satırını `duzeltildi` yapın ve commit hash'ini not edin.
7. `reports/duzeltmeler/YYYY-AA-GG-SS.md` raporu yazın (hata no, kök neden, değişiklik). Commit mesajı: `[duzeltme] H-<no>: <kısa açıklama>`. Push edin.

## Kurallar
- Hata kapsamı dışında yeniden düzenleme veya yeni özellik eklemeyin.
- Bir düzeltme başka oyunları etkileyebiliyorsa (ortak CSS/JS) tüm oyunları test edin.

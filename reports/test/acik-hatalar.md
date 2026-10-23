# Açık hatalar

Test ajanı ekler, düzeltici ajan durum günceller. Biçim için `agents/5-test.md` dosyasına bakın.

## H-1 | Hafıza Kartları: eşleşmeyen kartlar kapanmadan "Yeni oyun"a basınca JS hatası
- durum: dogrulandi
- not: 2026-10-23 22:08 tekrar test edildi, geçiyor (yeni oyundan sonra açılan kart açık kalıyor, JS hatası yok).
- not: 72a12dc ile düzeltildi; start() bekleyen setTimeout'u clearTimeout ile iptal ediyor.
- onem: orta
- sayfa: games/hafiza/
- adimlar: Eşleşmeyen iki kart aç, 0,8 saniye dolmadan "Yeni oyun"a bas, hemen yeni tahtada bir kart aç.
- beklenen: Yeni oyun temiz başlar, açılan kart açık kalır, hata olmaz.
- gerceklesen: Eski oyunun `setTimeout`'u çalışıyor; konsolda "Cannot read properties of null (reading 'classList')" hatası çıkıyor ve yeni tahtada açılan kart kendiliğinden kapanıyor. `start()` bekleyen zamanlayıcıyı iptal etmiyor (game.js, flip içindeki setTimeout).
- bulunma: 2026-10-23 20:07

## H-2 | Hafıza Kartları: en iyi skor kaydedilmiyor
- durum: dogrulandi
- not: 2026-10-23 22:08 tekrar test edildi, geçiyor (en az hamle kaydediliyor ve yenilemeden sonra 'En iyi' alanında görünüyor).
- not: 72a12dc ile düzeltildi; en az hamle 'En iyi' alanında gösteriliyor ve MiniOyun.setBest('hafiza', hamle, true) ile kaydediliyor.
- onem: dusuk
- sayfa: games/hafiza/
- adimlar: Oyunu bitir, sayfayı yenile.
- beklenen: Diğer oyunlardaki gibi en iyi sonuç (en az hamle veya en kısa süre) `MiniOyun.setBest` ile kaydedilip gösterilir.
- gerceklesen: Sayfada "En iyi" alanı yok, localStorage'a hiçbir şey yazılmıyor.
- bulunma: 2026-10-23 20:07

## H-3 | Mayın Tarlası: 1 saniyenin altında kazanınca en iyi süre görünmüyor
- durum: duzeltildi
- not: 77dc9e5 ile düzeltildi; getBest() kayıt yoksa null döndürüyor, 0 sn geçerli rekor sayılıyor.
- onem: dusuk
- sayfa: games/mayin-tarlasi/
- adimlar: İlk tıklamada açılan alanın tahtanın tamamını temizlediği (veya 1 saniye dolmadan bitirilen) bir oyunu kazan, sonra sayfayı yenile ve yeniden kazan.
- beklenen: En iyi süre "0 sn" olarak gösterilir, sonraki 0 saniyelik galibiyet "Yeni rekor!" demez.
- gerceklesen: localStorage'a `mayin-tarlasi-en-iyi-kolay = "0"` yazılıyor ama `getBest()` 0'ı "kayıt yok" sayıyor; "En iyi" alanı "-" kalıyor ve her galibiyette "Yeni rekor!" yazıyor. (game.js: `getBest` / `saveBest` / `showBest` 0 değerini ayırt etmiyor.)
- bulunma: 2026-10-23 21:10

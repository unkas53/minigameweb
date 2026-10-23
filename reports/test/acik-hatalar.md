# Açık hatalar

Test ajanı ekler, düzeltici ajan durum günceller. Biçim için `agents/5-test.md` dosyasına bakın.

## H-1 | Hafıza Kartları: eşleşmeyen kartlar kapanmadan "Yeni oyun"a basınca JS hatası
- durum: duzeltildi
- not: 72a12dc ile düzeltildi; start() bekleyen setTimeout'u clearTimeout ile iptal ediyor.
- onem: orta
- sayfa: games/hafiza/
- adimlar: Eşleşmeyen iki kart aç, 0,8 saniye dolmadan "Yeni oyun"a bas, hemen yeni tahtada bir kart aç.
- beklenen: Yeni oyun temiz başlar, açılan kart açık kalır, hata olmaz.
- gerceklesen: Eski oyunun `setTimeout`'u çalışıyor; konsolda "Cannot read properties of null (reading 'classList')" hatası çıkıyor ve yeni tahtada açılan kart kendiliğinden kapanıyor. `start()` bekleyen zamanlayıcıyı iptal etmiyor (game.js, flip içindeki setTimeout).
- bulunma: 2026-10-23 20:07

## H-2 | Hafıza Kartları: en iyi skor kaydedilmiyor
- durum: duzeltildi
- not: 72a12dc ile düzeltildi; en az hamle 'En iyi' alanında gösteriliyor ve MiniOyun.setBest('hafiza', hamle, true) ile kaydediliyor.
- onem: dusuk
- sayfa: games/hafiza/
- adimlar: Oyunu bitir, sayfayı yenile.
- beklenen: Diğer oyunlardaki gibi en iyi sonuç (en az hamle veya en kısa süre) `MiniOyun.setBest` ile kaydedilip gösterilir.
- gerceklesen: Sayfada "En iyi" alanı yok, localStorage'a hiçbir şey yazılmıyor.
- bulunma: 2026-10-23 20:07

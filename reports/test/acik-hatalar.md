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
- durum: dogrulandi
- not: 2026-10-23 22:15 tekrar test edildi, geçiyor ('0' kayıtlıyken 'En iyi' alanı '0 sn' gösteriyor; 0 sn'lik ikinci galibiyet rekor sayılmıyor).
- not: 77dc9e5 ile düzeltildi; getBest() kayıt yoksa null döndürüyor, 0 sn geçerli rekor sayılıyor.
- onem: dusuk
- sayfa: games/mayin-tarlasi/
- adimlar: İlk tıklamada açılan alanın tahtanın tamamını temizlediği (veya 1 saniye dolmadan bitirilen) bir oyunu kazan, sonra sayfayı yenile ve yeniden kazan.
- beklenen: En iyi süre "0 sn" olarak gösterilir, sonraki 0 saniyelik galibiyet "Yeni rekor!" demez.
- gerceklesen: localStorage'a `mayin-tarlasi-en-iyi-kolay = "0"` yazılıyor ama `getBest()` 0'ı "kayıt yok" sayıyor; "En iyi" alanı "-" kalıyor ve her galibiyette "Yeni rekor!" yazıyor. (game.js: `getBest` / `saveBest` / `showBest` 0 değerini ayırt etmiyor.)
- bulunma: 2026-10-23 21:10

## H-4 | Penaltı Ligi: 1280x900 ekranda maç başlayınca güç çubuğu ve VUR düğmesi görünmüyor
- durum: dogrulandi
- not: 2026-10-24 04:10 tekrar test edildi, geçiyor (maç başlayınca sayfa kayıyor: 1280x900'de scrollY 125, VUR 856-900 px; 1366x768'de scrollY 257, VUR 724-768 px; 360x740'ta VUR 675-719 px; sayfa hatası yok).
- not: f6f3cd3 ile düzeltildi; maç başlarken oyun alanı scrollIntoView({block:'nearest'}) ile görünür alana kaydırılıyor (1280x900'de VUR düğmesinin alt kenarı 900 px'e geliyor).
- onem: orta
- sayfa: games/penalti-ligi/
- adimlar: 1280x900 pencerede sayfayı aç (kaydırma yapmadan), Mahalle Ligi 1. maça tıkla.
- beklenen: Maç başlayınca atışın temel parçaları (kale, güç çubuğu, VUR düğmesi) ekranda görünür; gerekirse oyun alanı görünür alana kaydırılır.
- gerceklesen: Menü kayboluyor, sayfa kaymıyor; tuval sayfada 413-973 px arasında kalıyor. Güç çubuğu tuvalin 518-538. satırında olduğu için ekranda 931-951 px'e düşüyor (görünür alan 900 px), VUR düğmesi 981-1025 px. Maç sırasında Boşluk ve ok tuşlarında `preventDefault` çağrıldığı için klavyeyle de sayfa kaydırılamıyor; oyuncu çubuğu görmeden vurmak zorunda kalıyor veya fareyle kaydırması gerekiyor. 360x740'ta sorun yok (maç düğmesine tıklarken sayfa zaten kayıyor, tuval 169-512, VUR 586 px'te bitiyor).
- bulunma: 2026-10-24 02:15

## H-5 | Tuğla Kırma: 1280x900 ve 1366x768 ekranda bölüm başlayınca raket ve top görünmüyor
- durum: dogrulandi
- dogrulama: 2026-10-24 05:15, bölüm başlayınca raket 1280x900'de 859 px (görünür alan 900), 1366x768'de 727 px (768), 360x740'ta 691 px; sayfa hatası yok.
- not: 68306d4 ile düzeltildi; startLevel() tuvali scrollIntoView({block:'nearest'}) ile görünür alana kaydırıyor (1280x900'de raket ~859 px, 1366x768'de ~727 px).
- onem: orta
- sayfa: games/tugla-kirma/
- adimlar: 1280x900 (veya 1366x768) pencerede sayfayı aç (kaydırma yapmadan), haritada 1. bölüme tıkla.
- beklenen: Bölüm başlayınca raket ve rakette bekleyen top ekranda görünür; gerekirse oyun alanı görünür alana kaydırılır (H-4 ile aynı tür sorun).
- gerceklesen: Harita gizleniyor, sayfa kaymıyor (scrollY 0); tuval sayfada 362-949 px arasında. Raket tuvalin 596. satırında (640 üzerinden) olduğu için ekranda ~908 px'e düşüyor: 900 px yüksekliğinde tam alt kenarın dışında, 768 px'te 140 px aşağıda. Oyuncu raketi ve topu görmeden oynamaya başlıyor; oyun sırasında Boşluk/ok tuşlarında `preventDefault` olduğu için klavyeyle kaydırılamıyor, fare tekerleğiyle kaydırmak gerekiyor. 360x740'ta sorun yok (bölüme dokunurken sayfa kayıyor, tuval 326-718 px).
- bulunma: 2026-10-24 03:47

## H-6 | Renk Tuzağı oynanış testi rastgele başarısız oluyor (tuzak oranı eşiği)
- durum: dogrulandi
- dogrulama: 2026-10-24 05:15, tam test + `--oyun renk-tuzagi` 5 ayrı çalışmada hepsi geçti.
- not: 8f6cfbf ile düzeltildi; test eşiği %60'a çekildi (%75 oranla 100 soruda 60'ın altı ~%0,05 olasılık). Oyun kodu değişmedi.
- onem: orta
- sayfa: tools/tests/renk-tuzagi.js
- adimlar: `node tools/smoke-test.js --oyun renk-tuzagi` komutunu birkaç kez çalıştır.
- beklenen: Test her çalışmada aynı sonucu verir (oyun doğruysa her zaman geçer).
- gerceklesen: 7 çalışmanın 2'sinde "İlk 100 soruda tuzak oranı en az %70 olmalı, gelen: 67" hatası. Oyun (game.js 111. satır) her soruda tuzağı `rnd() < 0.75` ile bağımsız seçiyor; 100 soruda 70'in altına düşme olasılığı yaklaşık %10-15, yani oyun doğru çalışırken test kırmızı yanıyor ve tüm `npm test` başarısız sayılıyor (diğer ajanların push'unu engelleyebilir). Test ya rastgeleliği sabit tohumla (ör. günlük mod) çalıştırmalı ya da eşiği istatistiksel olarak güvenli bir değere (ör. %60) çekmeli.
- bulunma: 2026-10-24 03:47

## H-7 | Harf Çarkı oynanış testi tam `npm test` koşusunda "Duraklatınca süre durmalı" ile başarısız
- durum: acik
- onem: orta
- sayfa: tools/tests/harf-carki.js (152-158. satırlar), games/harf-carki/game.js
- adimlar: `node tools/smoke-test.js` (tüm oyunlar) çalıştır; ardından `node tools/smoke-test.js --oyun harf-carki` çalıştır.
- beklenen: Test iki koşuda da aynı sonucu verir.
- gerceklesen: 2026-10-24'te tam koşu 3 denemenin 3'ünde (Blok Bulmaca eklenmeden önceki main'de de) "Duraklatınca süre durmalı" ile kırmızı; tek oyun koşusu her seferinde geçiyor. `s1` okunduktan sonra Duraklat tıklanana kadar bir saniye tiki daha işliyor olabilir (sayaç `page.clock` dışında bir zamanlayıcıya ya da tıklama anındaki gecikmeye bağlı). Tüm `npm test` başarısız sayıldığı için diğer ajanların push'unu engelliyor.
- bulunma: 2026-10-24 (4. ajan, Blok Bulmaca çalışması)
- not: 2026-10-24 07:05 test ajanı tam `node tools/smoke-test.js` koşusunu çalıştırdı, Harf Çarkı dahil 14 oyun testi geçti (1 deneme). Hata aralıklı görünüyor; kayıt açık kalıyor.

## H-8 | Blok Bulmaca: 1366x768 ekranda bölüm başlayınca parça yuvaları görünmüyor
- durum: acik
- onem: orta
- sayfa: games/blok-bulmaca/
- adimlar: 1366x768 (veya 1280x900) pencerede sayfayı aç (kaydırma yapmadan), haritada 1. bölüme tıkla.
- beklenen: Bölüm başlayınca ızgara ve altındaki üç parça yuvası ekranda görünür; gerekirse oyun alanı görünür alana kaydırılır (H-4 ve H-5 ile aynı tür sorun, onlarda `scrollIntoView({block:'nearest'})` ile çözüldü).
- gerceklesen: Harita gizleniyor, sayfa kaymıyor (scrollY 0). Izgara 408-828 px, parça yuvaları 838-957 px, Yenile/Sil düğmeleri 1022-1055 px. 1366x768'de yuvaların tamamı ve ızgaranın alt 60 px'i görünür alanın dışında; oyuncu yerleştireceği parçaları görmek için fareyle kaydırmak zorunda. 1280x900'de yuvaların yalnızca üst 62 px'i görünüyor. 360x740'ta sorun yok (dokunurken sayfa kayıyor, ızgara 45-367, yuvalar 377-467 px). `games/blok-bulmaca/game.js` içinde `scrollIntoView` yok.
- bulunma: 2026-10-24 07:05

## H-9 | 2048 Görev Yolu: bölüm başlayınca tahta mobilde ve 1366x768'de büyük ölçüde ekran dışında
- durum: acik
- onem: dusuk
- sayfa: games/2048/
- adimlar: 360x740 dokunmatik ekranda (veya 1366x768 pencerede) sayfayı aç, "Görev Yolu" sekmesine ve Bölüm 1'e dokun.
- beklenen: Bölüm başlayınca tahta ekranda görünür; gerekirse görünür alana kaydırılır.
- gerceklesen: Sayfa kaymıyor (scrollY 0). Görev Yolu'nda ipucu satırı (600-643 px) ve iki satıra kayan istatistik çubuğu tahtayı aşağı itiyor: 360x740'ta tahta 653-956 px (yalnızca üst 87 px görünür), 1366x768'de 475-875 px. Klasik modda da tahta kısmen aşağıda (360x740'ta 546-848, 1366x768'de 422-822), ama Görev Yolu ~107 px daha kötü. Sıra tabanlı oyun olduğu için oyuncu kaydırarak oynayabiliyor; kaydırma hareketleri tahtada yakalandığı için mobilde kaydırmak tahtanın dışından yapılmalı.
- bulunma: 2026-10-24 07:05

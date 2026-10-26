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
- durum: dogrulandi
- not: 35358f1 ile düzeltildi; test `page.clock` gerçek zamanla da aktığı için `s1` okuması ile Duraklat tıklaması arasında bir saniye tiki işleyebiliyordu (yük altındaki tam koşuda). Süre artık duraklattıktan sonra okunuyor; oyun kodu değişmedi. Bu çalışmada tam koşu düzeltmeden sonra 3 kez geçti, düzeltmeden önceki 1 tam koşuda hata çıkmadı.
- onem: orta
- sayfa: tools/tests/harf-carki.js (152-158. satırlar), games/harf-carki/game.js
- adimlar: `node tools/smoke-test.js` (tüm oyunlar) çalıştır; ardından `node tools/smoke-test.js --oyun harf-carki` çalıştır.
- beklenen: Test iki koşuda da aynı sonucu verir.
- gerceklesen: 2026-10-24'te tam koşu 3 denemenin 3'ünde (Blok Bulmaca eklenmeden önceki main'de de) "Duraklatınca süre durmalı" ile kırmızı; tek oyun koşusu her seferinde geçiyor. `s1` okunduktan sonra Duraklat tıklanana kadar bir saniye tiki daha işliyor olabilir (sayaç `page.clock` dışında bir zamanlayıcıya ya da tıklama anındaki gecikmeye bağlı). Tüm `npm test` başarısız sayıldığı için diğer ajanların push'unu engelliyor.
- bulunma: 2026-10-24 (4. ajan, Blok Bulmaca çalışması)
- not: 2026-10-24 07:05 test ajanı tam `node tools/smoke-test.js` koşusunu çalıştırdı, Harf Çarkı dahil 14 oyun testi geçti (1 deneme). Hata aralıklı görünüyor; kayıt açık kalıyor.
- not: 2026-10-24 09:20 test ajanı tam `node tools/smoke-test.js` koşusunu çalıştırdı, 15 oyun testi (Harf Çarkı dahil) geçti. Doğrulandı.

## H-8 | Blok Bulmaca: 1366x768 ekranda bölüm başlayınca parça yuvaları görünmüyor
- durum: dogrulandi
- not: 7e5071a ile düzeltildi; `basla()` sonunda `#yuvalar` `scrollIntoView({block:'nearest'})` ile görünür alana kaydırılıyor. 1366x768: ızgara 219, yuvaların altı 768 px; 1280x900: kaydırma 57 px; 360x740 etkilenmedi.
- onem: orta
- sayfa: games/blok-bulmaca/
- adimlar: 1366x768 (veya 1280x900) pencerede sayfayı aç (kaydırma yapmadan), haritada 1. bölüme tıkla.
- beklenen: Bölüm başlayınca ızgara ve altındaki üç parça yuvası ekranda görünür; gerekirse oyun alanı görünür alana kaydırılır (H-4 ve H-5 ile aynı tür sorun, onlarda `scrollIntoView({block:'nearest'})` ile çözüldü).
- gerceklesen: Harita gizleniyor, sayfa kaymıyor (scrollY 0). Izgara 408-828 px, parça yuvaları 838-957 px, Yenile/Sil düğmeleri 1022-1055 px. 1366x768'de yuvaların tamamı ve ızgaranın alt 60 px'i görünür alanın dışında; oyuncu yerleştireceği parçaları görmek için fareyle kaydırmak zorunda. 1280x900'de yuvaların yalnızca üst 62 px'i görünüyor. 360x740'ta sorun yok (dokunurken sayfa kayıyor, ızgara 45-367, yuvalar 377-467 px). `games/blok-bulmaca/game.js` içinde `scrollIntoView` yok.
- bulunma: 2026-10-24 07:05
- not: 2026-10-24 09:20 tekrar test edildi. 1366x768: yuvalar 649-768 px (scrollY 189); 1280x900: 781-900 px; 360x740: 377-467 px. Doğrulandı.

## H-9 | 2048 Görev Yolu: bölüm başlayınca tahta mobilde ve 1366x768'de büyük ölçüde ekran dışında
- durum: dogrulandi
- not: 58ff5dc ile düzeltildi; `bolumBaslat()` sonunda tahta `scrollIntoView({block:'nearest'})` ile görünür alana kaydırılıyor. 360x740: tahta 437-740 px; 1366x768: 368-768 px.
- onem: dusuk
- sayfa: games/2048/
- adimlar: 360x740 dokunmatik ekranda (veya 1366x768 pencerede) sayfayı aç, "Görev Yolu" sekmesine ve Bölüm 1'e dokun.
- beklenen: Bölüm başlayınca tahta ekranda görünür; gerekirse görünür alana kaydırılır.
- gerceklesen: Sayfa kaymıyor (scrollY 0). Görev Yolu'nda ipucu satırı (600-643 px) ve iki satıra kayan istatistik çubuğu tahtayı aşağı itiyor: 360x740'ta tahta 653-956 px (yalnızca üst 87 px görünür), 1366x768'de 475-875 px. Klasik modda da tahta kısmen aşağıda (360x740'ta 546-848, 1366x768'de 422-822), ama Görev Yolu ~107 px daha kötü. Sıra tabanlı oyun olduğu için oyuncu kaydırarak oynayabiliyor; kaydırma hareketleri tahtada yakalandığı için mobilde kaydırmak tahtanın dışından yapılmalı.
- bulunma: 2026-10-24 07:05
- not: 2026-10-24 09:20 tekrar test edildi. 1366x768: tahta 368-768 px; 1280x900: 475-875 px; 360x740: 437-740 px. Doğrulandı.

## H-10 | Olta Ustası: "Oltayı At" ile tur başlayınca oyun alanı görünür alana getirilmiyor
- durum: dogrulandi
- not: 25e2b9d ile düzeltildi; `startRound()` panel gizlendikten sonra canvas'ı `scrollIntoView({block:'nearest'})` ile görünür alana kaydırıyor. Düğme ortalanarak tıklandığında canvas 1280x900'de 0-648 px, 1366x768'de 0-553 px, 360x740'ta 0-522 px (tamamı görünür); sayfa hatası yok.
- onem: orta
- sayfa: games/olta-ustasi/
- adimlar: 1280x900, 1366x768 veya 360x740 ekranda sayfayı aç. "Oltayı At" düğmesi menü panelinde, oyun alanının (canvas) altında ve ilk ekranın dışında (1280x900'de y≈1186). Düğmeye kaydırıp tıkla/dokun.
- beklenen: Tur başlayınca oyun alanı görünür alana kaydırılır; kanca ve yüzey ekranda görünür (H-4, H-5, H-8, H-9 ile aynı tür sorun, onlarda `scrollIntoView({block:'nearest'})` ile çözüldü).
- gerceklesen: `startRound()` panel gizleyip `canvas.focus({preventScroll:true})` çağırıyor, sayfayı kaydırmıyor. Düğme ortalanacak şekilde kaydırılınca (tarayıcının "görünüre kaydır" davranışı) oyun alanının yalnızca bir kısmı görünüyor: 1280x900'de canvas -396..252 px (%39 görünür, iniş sırasında kanca y≈-150, ekran dışı), 1366x768'de -367..186 (%34), 360x740'ta -453..69 (%13). Düğme ekranın en altına gelecek kadar az kaydırınca masaüstünde sorun yok, 360x740'ta canvas'ın üst 106 px'i (balıkların yüzeyde havaya fırladığı bölge) yine ekran dışında. Oyuncu tur sırasında elle yukarı kaydırmak zorunda; iniş kısa sürdüğü için turun bir kısmını göremeden kaçırıyor.
- bulunma: 2026-10-24 09:20
- not: 2026-10-24 10:20 tekrar test edildi. Düğme ortalanarak tıklanınca canvas 1280x900'de 0-648, 1366x768'de 0-553, 360x740'ta 0-522 px; sayfa hatası yok. Doğrulandı.

## H-11 | Meyve Patlat: 1280x900 ekranda bölüm başlayınca güçlendirici düğmeleri ekran dışında
- durum: dogrulandi
- onem: dusuk
- sayfa: games/meyve-patlat/
- adimlar: 1280x900 ekranda sayfayı aç (çerez onaylı), haritada 1. bölüme tıkla.
- beklenen: Tahta ile birlikte altındaki güçlendirici satırı (`#guclar`: çekiç, karıştır, +5 hamle) da ekranda görünür.
- gerceklesen: Sayfa kaymıyor (scrollY 0); tahta 430-870 px'te tamamen görünüyor, ama `#guclar` 870-964 px'te, ekranın (900 px) altında kalıyor. `scrollIntoView({block:'nearest'})` yalnızca `#tahta` için çağrıldığından tahta sığınca kaydırma yapılmıyor. 1366x768 (tahta 12-452, güçler ≤546) ve 360x740'ta (0-322, ≤414) sorun yok. Oyun oynanabiliyor; güçlendiriciyi kullanmak için elle kaydırmak gerekiyor.
- bulunma: 2026-10-24 10:15
- not: 2026-10-24 düzeltildi (3d8a9f2). Bölüm başında önce #guclar, sonra #tahta için scrollIntoView({block:'nearest'}) çağrılıyor; 1280x900'de tahta 366-806, güçler 867-900 px. 1366x768 ve 360x740 değişmedi.
- dogrulama: 2026-10-24 11:20 test ajanı. 1. bölüm başlayınca 1280x900: tahta 366-806, güçler 867-900 px; 1366x768: 12-452 / 513-546; 360x740: 0-322 / 384-414. Hepsi görünür.

## H-12 | Mahjong: bölüm başlayınca tahta mobilde ve 1366x768'de büyük ölçüde ekran dışında
- durum: dogrulandi
- onem: dusuk
- sayfa: games/mahjong/
- adimlar: 360x740 dokunmatik ekranda (veya 1366x768 pencerede) sayfayı aç (çerez onaylı), haritada Bölüm 1'e dokun.
- beklenen: Bölüm başlayınca tahta (ve mümkünse altındaki uyarı/eğitim satırı ile araç düğmeleri) görünür alana kaydırılır (H-4, H-5, H-8, H-9, H-10, H-11 ile aynı tür sorun; onlarda `scrollIntoView({block:'nearest'})` ile çözüldü).
- gerceklesen: `basla()` haritayı gizleyip oyunu gösteriyor ama sayfayı kaydırmıyor (scrollY 0). 360x740'ta tahta 537-962 px (425 px'in yalnızca üst 203 px'i görünür), 1. bölümün eğitim mesajı (`#uyari`, 974-1042) ve araçlar (İpucu/Karıştır/Geri al, 1050-1083) ekran dışında. 1366x768'de tahta 376-801 px (alt 33 px dışarıda), uyarı 813-858 ve araçlar 866-899 px ekran dışında. 1280x900'de hepsi görünür (araçlar 866-899). Sıra tabanlı olduğu için oyuncu kaydırarak oynayabiliyor ama süre işlerken ilk saniyeler kayboluyor.
- bulunma: 2026-10-24 14:15
- not: 2026-10-25 düzeltildi (886ac13). `basla()` sonunda önce `.mj-araclar`, sonra `#sahne` için scrollIntoView({block:'nearest'}) çağrılıyor. 1. bölüm: 360x740 tahta 116-541, uyarı 553-621, araçlar 629-740; 1366x768 tahta 245-670, uyarı 682-727, araçlar 735-768; 1280x900 değişmedi (scrollY 0).
- dogrulama: 2026-10-25 19:50 test ajanı. Bölüm 1 başlayınca 360x740 dokunmatik: tahta 112-545, uyarı 553-621, araçlar 629-740 (scrollY 418); 1366x768: 241-674 / 682-727 / 735-768; 1280x900: 372-805 / 813-858 / 866-899 (scrollY 0). Hepsi görünür, JS hatası yok.

## H-13 | Olta Ustası: oynanış testi tam `npm test` çalışmasında ara sıra başarısız
- durum: dogrulandi
- onem: dusuk
- sayfa: tools/tests/olta-ustasi.js
- adimlar: `npm test` (tüm oyunlar) çalıştır.
- beklenen: Olta Ustası testi her çalışmada geçer.
- gerceklesen: 2026-10-24'te bir tam çalışmada "Turda altın kazanılmalı" ile başarısız oldu; hemen ardından tek başına (`--oyun olta-ustasi`) ve ikinci tam çalışmada geçti. Zamanlamaya bağlı kararsız test (H-7 Harf Çarkı ile benzer). Geliştirici ajan (Drift Ustası eklenirken) fark etti, Olta koduna dokunulmadı.
- bulunma: 2026-10-24
- not: 2026-10-24 18:50 test ajanı. Tam `npm test` çalışmasında yine "Turda altın kazanılmalı" ile başarısız oldu (tek başına `--oyun olta-ustasi` geçti). Kararsızlık sürüyor.
- not: 2026-10-25 düzeltildi (d03b2a1). Kök neden: deniz dizilimi Math.random ile üretiliyor; bazı rastgele denizlerde kanca 30 m inip çıkarken hiç balığa değmiyor, tur 0 altınla bitiyordu (tanı çıktısı: "Tur bitti: 0 altın", akvaryum boş). Oyun hatası değil, testin şansa bağlı olması. Test artık addInitScript ile Math.random'ı sabit tohumla değiştiriyor (Kızma Birader testindeki gibi). Önce 6 tekli koşudan 1'i başarısızdı, sonra 10/10 tekli ve 2/2 tam koşu geçti.
- dogrulama: 2026-10-25 19:50 test ajanı. Düzeltmeden sonraki iki tam `npm test` çalışmasında (09 UTC ve bu çalışma) Olta Ustası testi geçti.

## H-14 | Yılan Macera: mobilde bölüm başlayınca dokunmatik yön tuşları ve mesaj satırı ekran dışında
- durum: acik
- onem: dusuk
- sayfa: games/yilan/
- adimlar: 360x740 dokunmatik ekranda sayfayı aç (çerez onaylı), "Macera" sekmesine, sonra Bölüm 1'e dokun.
- beklenen: Bölüm başlayınca oyun alanıyla birlikte altındaki dokunmatik yön tuşları (`.touch-controls`) ve "Başlamak için bir yön tuşuna bas" mesajı (`#msg`) da görünür (H-11 ve H-12 ile aynı tür sorun).
- gerceklesen: `bolumBaslat()` yalnızca canvas için `scrollIntoView({block:'nearest'})` çağırıyor. scrollY 237 olur; canvas 438-740 px'te tam görünür ama yön tuşları 752-870, mesaj 882-933 px'te, ekranın (740 px) altında kalıyor. Kanvasta kaydırma (swipe) ile oynanabildiği ve tuşlar çalıştığı için oyun oynanabiliyor; tuşlarla oynamak isteyen oyuncu elle kaydırmak zorunda. 1366x768 ve 1280x900'de tuşlar gizli, sorun yok.
- bulunma: 2026-10-25 19:50

## H-15 | Lokanta Telaşı: mobilde gün başlayınca ızgara, raf ve tabak ekran dışında
- durum: acik
- onem: orta
- sayfa: games/lokanta-telasi/
- adimlar: 360x740 dokunmatik ekranda sayfayı aç (çerez onaylı), haritada 1. güne dokun.
- beklenen: Gün başlayınca oyun alanı (`#alan`: müşteri yerleri, ızgara, tabak ve malzeme rafı) görünür alana kaydırılır (H-10, H-12, H-14 ile aynı tür sorun; onlarda `scrollIntoView({block:'nearest'})` ile çözüldü).
- gerceklesen: `gunBaslat()` sayfayı kaydırmıyor (scrollY 0). `#alan` 525-967 px'te; müşteri yeri 673-815 (kısmen görünür), ızgara 843-887, tabak 839-891 ve malzeme rafı 907-959 px'te, tamamen ekranın (740 px) altında. Müşterilerin sabrı süreyle azaldığı için oyuncu elle kaydırana kadar sipariş hazırlayamıyor. 1366x768 (alan 362-763, raf 703-755) ve 1280x900'de sorun yok; yatay taşma ve JS hatası yok.
- bulunma: 2026-10-26 01:00

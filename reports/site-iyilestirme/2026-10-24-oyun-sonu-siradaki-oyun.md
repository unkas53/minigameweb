durum: bekliyor
baslik: Oyun bitince "Sıradaki oyun" önerisi
oncelik: 5
boyut: orta
dosyalar: js/oyun.js, css/style.css, tools/build-pages.js (gerekirse), tools/smoke-test.js

## Sorun / fırsat
Bir oyun bittiğinde açılan pencerede (`js/oyun.js`, `finish()`) yalnızca "Tekrar oyna", "Paylaş" ve "Kapat" var. Oyuncuyu başka bir oyuna götüren hiçbir şey yok. Sitenin tek çapraz bağlantısı olan "Benzer oyunlar" bölümü sayfanın çok altında kalıyor: 2048 sayfasında 360x740'ta 1650 px'te, 1280x900'de 1162 px'te başlıyor (2026-10-24 Playwright ölçümü). Yani oyuncu oyun alanını, açıklama ve ipucu metnini kaydırıp geçmeden bir sonraki oyunu görmüyor. Oyunun bittiği an, oyuncunun "şimdi ne yapayım" diye durduğu ve siteden çıkma ihtimalinin en yüksek olduğu an. Rakip analizindeki tüm büyük siteler (Poki, CrazyGames, KralOyun) oyun çevresinde sürekli "sıradaki/benzer oyun" kartları gösteriyor. Oyun sayısı 11'e çıktığı için artık önerilecek yeterli oyun var.

## Öneri
Oyun sonu penceresine, düğmelerin altına küçük bir "Sıradaki oyun" satırı eklenir:
- **2 kart** gösterilir (ikon, ad, kategori). Kartlar `games/<slug>/` sayfasına göreceli bağlantıdır (`../<slug>/`).
- **Seçim sırası:** (1) aynı kategorideki, oyuncunun hiç oynamadığı oyun (`mo_son_oynanan` listesinde olmayan), (2) başka kategoriden hiç oynanmamış oyun, (3) en uzun süredir oynanmamış oyun. Mevcut oyun ve `status` değeri yayında olmayan oyunlar hiç önerilmez. Aynı oyun aynı pencerede iki kez çıkmaz.
- **Veri kaynağı:** sayfada zaten build ile üretilen "Benzer oyunlar" bloğundaki kartlar okunabilir (yeni ağ isteği yok). Bu blok yalnızca aynı kategoriyi içeriyorsa, build'in oyun sayfasına küçük bir `<script type="application/json" id="oyun-listesi">` (slug, ad, kategori, ikon, renk) veya gizli bir kart listesi yazması tercih edilir; `games.json`'u çalışma anında `fetch` etmek de kabul edilebilir ama çevrimdışında (PWA) sessizce satırı gizlemeli.
- **Görünüm:** iki kart yan yana, her biri en az 44 px yüksekliğinde ve tamamı tıklanabilir. 360 px'te pencere taşmamalı; gerekirse kartlar tek satırda küçük ikon + ad olarak gösterilir. Mevcut kart renkleri (`colors`) arka plan olarak kullanılabilir.
- **Günlük meydan okuma:** günlük modda biten oyunda da satır görünür; bugünün günlük oyunu tamamlanmadıysa ilk kart yerine "📅 Günlük meydan okuma" bağlantısı (`../../gunluk.html`) konabilir.
- **Analitik:** karta tıklanınca GoatCounter'a `siradaki/<kaynak>-><hedef>` olayı gönderilir (mevcut `goatcounter.count` deseniyle, kişisel veri yok). Böylece özelliğin işe yarayıp yaramadığı ölçülebilir.
- "Tekrar oyna" birincil düğme olarak kalır; öneri satırı onun önüne geçmez. Reklam alanlarına dokunulmaz.

## Kabul kriterleri
- Herhangi bir oyunu bitirince (kazanma ve kaybetme) pencerede 2 öneri kartı görünür; ikisi de mevcut oyundan farklıdır ve birbirinden farklıdır.
- Kartlara tıklayınca ilgili oyunun sayfası açılır; bağlantılar göreceli (`/` ile başlamıyor).
- Hiç oynanmamış oyun varsa önce o önerilir (`mo_son_oynanan` boşken ve doluyken test edilir).
- 360x740 ve 1280x900'de pencere taşmaz, tüm düğmeler görünür, yatay kaydırma yok.
- Kartlar klavyeyle (Tab) seçilebilir ve Enter ile açılır; ekran okuyucu için anlamlı bağlantı metni var (ör. "Sıradaki oyun: Sudoku").
- Satır, oyun listesi okunamazsa (ör. çevrimdışı ve veri yok) hata vermeden gizlenir; konsolda pageerror yok.
- Smoke test geçer; en az bir oynanış testinde oyun sonu penceresinde öneri kartlarının bulunduğu kontrol edilir.
- Günlük modda sonuç notu ("📅 Günlük sonucun kaydedildi") yerinde kalır.

## Ek gözlem (ayrı öneri olarak değerlendirilebilir)
Ana sayfada 360x740'ta ilk oyun kartı 1768 px'te başlıyor (önce karşılama, öne çıkan oyun ve kategori kutuları geliyor). Bu öneri uygulandıktan sonra mobil ana sayfada oyunları yukarı taşımak sıradaki site önerisi olabilir.

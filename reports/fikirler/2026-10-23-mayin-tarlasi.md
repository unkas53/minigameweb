durum: bekliyor
slug: mayin-tarlasi
baslik: Mayın Tarlası
kategori: Bulmaca
oncelik: 5

## Özet
Izgaradaki tüm güvenli kareleri, sayı ipuçlarını kullanarak mayınlara basmadan açmaya çalışılan klasik mantık bulmacası.

## Neden bu oyun
- "Mayın tarlası oyna" Türkiye'de Windows döneminden beri çok aranan, kalıcı talebi olan bir oyun adıdır; mini oyun sitelerinin neredeyse hepsinde bulunur.
- Sitede şu an 2048 (bulmaca), Yılan (arcade) ve Hafıza Kartları var; saf mantık/çıkarım türü yok.
- Henüz rakip analizi raporu yok; seçim genel bilinirlik ve arama talebine dayanıyor.
- Görsel/ses dosyası gerektirmez, DOM ızgarası ile 400-500 satırda yapılabilir.

## Oynanış
- Üç zorluk: Kolay 9x9 / 10 mayın, Orta 12x12 / 24 mayın, Zor 16x16 / 45 mayın. Varsayılan Kolay. Telefonda (genişlik < 500px) Zor seviyede ızgara 16 sütun x 16 satır kalır ama kare boyutu küçülür; kare en az 20px olmalı.
- İlk tıklanan kare ve 8 komşusu asla mayın olmaz (mayınlar ilk tıklamadan sonra yerleştirilir).
- Açılan kare, komşu 8 karedeki mayın sayısını gösterir. 0 ise boş görünür ve komşuları otomatik açılır (taşma/flood fill, yinelemeli değil kuyrukla).
- Bayrak: oyuncu mayın olduğunu düşündüğü kareyi bayrakla işaretler; bayraklı kare tıklamayla açılmaz.
- Akor (chord): açılmış sayılı kareye tıklanınca, çevresindeki bayrak sayısı sayıya eşitse bayraksız komşular açılır.
- Kaybetme: mayına basmak. Tüm mayınlar gösterilir, basılan mayın kırmızı zeminli, yanlış bayraklar çarpı ile işaretlenir.
- Kazanma: mayın olmayan tüm kareler açıldığında. Kalan mayınlar otomatik bayraklanır.
- Puan: süre (saniye). Her zorluk için en iyi süre `localStorage` anahtarı `mayin-tarlasi-en-iyi-<zorluk>` ile saklanır.
- Üst bilgi çubuğu: kalan mayın sayacı (mayın - bayrak), süre, yüz düğmesi (🙂 oyunda, 😎 kazanınca, 😵 kaybedince) ve zorluk seçici. Yüz düğmesi yeni oyun başlatır.
- Süre ilk tıklamada başlar, oyun bitince durur.

## Kontroller
- **Klavye/fare:** Sol tık aç, sağ tık bayrak koy/kaldır (contextmenu engellenir). Açık sayıya sol tık akor yapar. Klavyede ok tuşları ile seçili kare değişir (görünür odak çerçevesi), Boşluk/Enter aç, F bayrak, N yeni oyun.
- **Dokunmatik:** Izgaranın üstünde "⛏️ Kaz / 🚩 Bayrak" mod düğmesi; dokunma seçili moda göre işlem yapar. Ayrıca uzun basma (400ms) her zaman bayrak koyar ve kısa titreşim verir (`navigator.vibrate` varsa). Uzun basmadan sonra gelen click yok sayılmalı. Izgarada `touch-action: manipulation` ile çift dokunma yakınlaştırması engellenir.

## Görsel tasarım
- Sitenin mevcut renk değişkenleri (css/style.css) kullanılır; oyun alanı en fazla 480px genişlikte, ortalı, kare ızgara.
- Kapalı kare: hafif kabarık görünüm (açık gri zemin + iç gölge). Açık kare: düz, daha koyu zemin.
- Sayı renkleri: 1 mavi #1e66f5, 2 yeşil #40a02b, 3 kırmızı #d20f39, 4 lacivert #1e3a8a, 5 bordo #7f1d1d, 6 turkuaz #0e7490, 7 siyah #111, 8 gri #6b7280. Karanlık temada okunabilir kalmalı.
- Emoji: 💣 mayın, 🚩 bayrak, ❌ yanlış bayrak, yüz düğmesi için 🙂 😎 😵.
- Kazanınca/kaybedince ızgaranın altında kısa mesaj ve "Tekrar oyna" düğmesi.

## Sayfa metinleri
- title: `Mayın Tarlası Oyna - Ücretsiz Online | MiniOyun`
- meta description: `Klasik Mayın Tarlası oyununu ücretsiz oyna. Kolay, orta ve zor seviye, bayrak modu ile telefonda da rahat. Üyelik ve indirme gerekmez.`
- **Nasıl oynanır:** Bir kareye tıklayarak oyuna başla; ilk tıkladığın kare her zaman güvenlidir. Açılan karelerdeki sayılar, o karenin çevresindeki sekiz karede kaç mayın olduğunu gösterir. Mayın olduğunu düşündüğün kareye sağ tıklayarak ya da telefonda uzun basarak bayrak koy. Mayın olmayan tüm kareleri açtığında kazanırsın, bir mayına basarsan oyun biter.
- **İpuçları:** İşe köşelerden ve kenarlardan değil, büyük boş alanların açıldığı yerlerden başla. Bir sayının çevresinde sayı kadar kapalı kare kaldıysa hepsi mayındır; bayrak sayısı sayıya ulaştıysa geri kalan komşular güvenlidir. 1-2-1 ve 1-2-2-1 gibi kalıpları öğrenmek seni çok hızlandırır. Emin olmadığın yerde tahmin yapmadan önce ızgaranın başka bir köşesine bak.

## Kabul kriterleri
- [ ] `games/mayin-tarlasi/index.html` ve `game.js` mevcut oyun sayfalarının yapısını izler (canonical, JSON-LD, nasıl oynanır, ipuçları, reklam alanları, çerez penceresi); tüm bağlantılar göreceli.
- [ ] `games.json`, ana sayfa oyun ızgarası ve `sitemap.xml` güncellendi.
- [ ] İlk tıklanan kare ve komşuları hiçbir zaman mayın değil.
- [ ] 0 olan kare açılınca bağlantılı boş alan ve kenar sayıları açılıyor; 16x16 ızgarada yığın taşması olmuyor.
- [ ] Sağ tık bayrak koyuyor ve tarayıcı menüsü açılmıyor; bayraklı kare tıklamayla açılmıyor.
- [ ] Akor doğru çalışıyor; bayrak sayısı eşleşmiyorsa hiçbir şey olmuyor.
- [ ] Telefonda mod düğmesi ve uzun basma ile bayrak konabiliyor; uzun basma sonrası kare açılmıyor; 375px genişlikte yatay kaydırma yok.
- [ ] Kazanma/kaybetme doğru algılanıyor, süre duruyor, en iyi süre her zorluk için ayrı kaydediliyor.
- [ ] Mayın sayacı bayrak sayısına göre güncelleniyor (negatif olabilir).
- [ ] Zorluk değişince ve yüz düğmesine basınca yeni oyun başlıyor, süre sıfırlanıyor.
- [ ] Klavye ile oynanabiliyor (ok tuşları, Boşluk/Enter, F, N).
- [ ] `node tools/smoke-test.js` hatasız geçiyor.

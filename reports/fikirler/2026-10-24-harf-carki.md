durum: yayinda
slug: harf-carki
baslik: Harf Çarkı
kategori: Kelime
oncelik: 4

## Özet
Çarktaki harfleri parmakla birleştirip kelimeler kurduğun ve küçük bir çapraz bulmacayı doldurduğun, 60 bölümlük haritası, yıldızları, ipucu jetonları ve günlük bulmacası olan bir Türkçe kelime bulmaca oyunu.

## Neden bu oyun
- **Kelime** kategorisinde yalnızca Kelime Tahmin var; bu fikir kategoriye ikinci ve uzun soluklu bir oyun ekler (Kelime Tahmin günde bir bulmacalık, tek oturumluk bir oyundur).
- Harf çarkından kelime türetip çapraz bulmaca doldurma, Türkiye'de mobilde en çok oynanan kelime oyunu türlerinden biridir. "kelime bulmaca oyunu", "harflerden kelime türetme", "kelime oyunu oyna", "kelime bulma oyunu" gibi aramalar yüksek hacimlidir ve rakip mini oyun sitelerinin kelime bölümlerinde bu tür sıkça bulunur. Marka adı kullanılmaz; ad ve tasarım özgündür. Henüz rakip analizi raporu olmadığı için seçim kategori boşluğuna ve genel arama talebine dayanıyor.
- Bölüm verisi (harfler + bulmaca yerleşimi) küçük bir veri dizisiyle tanımlanır; çizim tamamen DOM/CSS ile yapılır, görsel/ses dosyası gerekmez. Bir bölüm 1-3 dakika sürer, 60 bölüm saatlerce içerik verir.
- Kelime oyunları her yaştan oyuncuyu çeker ve günlük alışkanlık oluşturur (sitedeki geri gelme hedefine uygun).

## Oynanış
- Ekranın altında 3-7 harften oluşan bir **harf çarkı**, üstünde boş karelerden oluşan küçük bir **çapraz bulmaca** (bölümün hedef kelimeleri, kesişen yatay/dikey yerleşim).
- Oyuncu parmağını/fareyi çarktaki harflerin üstünde gezdirerek kelime kurar (her harf bir kez kullanılır, kurulan kelime harf çizgisiyle gösterilir); bırakınca kelime kontrol edilir.
  - Bulmacadaki bir kelimeyse kareler dolar (kesişen kelimelerin ortak harfleri de görünür).
  - Bulmacada olmayan ama sözlükte geçerli bir kelimeyse **bonus kelime** sayılır (🪙 jeton kumbarasına 1 puan; 10 bonus kelime = 1 ipucu jetonu).
  - Geçersizse kısa sallanma animasyonu, ceza yok.
- **Karıştır** düğmesi çarktaki harflerin yerini değiştirir (ücretsiz).
- **İpucu (🪙 jeton harcar):** "Harf aç" (rastgele boş bir kareyi açar, 1 jeton), "Kelime aç" (seçilen kelimenin tamamını açar, 3 jeton).
- **Kazanma:** bulmacadaki tüm kelimeler bulununca bölüm biter. Kaybetme yok; zorluk yıldızlarla ölçülür.
- **Puan:** bulunan her kelime harf sayısı x 10; bonus kelime +5; ipucu kullanılmadan bitirme +50; hedef süre altında bitirme +50.
- **Zorluk artışı:** 1-10. bölüm 3-4 harf ve 3-4 kelime, 11-30. bölüm 5 harf ve 5-7 kelime, 31-50. bölüm 6 harf ve 7-9 kelime, 51-60. bölüm 7 harf ve 9-12 kelime. İleri bölümlerde daha az bilinen (ama yaygın sözlükte geçen) kelimeler ve ğ/ş/ç gibi Türkçe harfler artar.

### Bölüm haritası
- 6 tema x 10 bölüm = **60 bölüm**: 🌅 Sabah, 🌊 Deniz, 🏔️ Dağ, 🏙️ Şehir, 🌙 Gece, 🌌 Uzay. Her tema arka plan rengini ve çark rengini değiştirir.
- Bölüm verisi elle hazırlanmış dizi olarak yazılır: `{ harfler: "KALEM", kelimeler: [["KALEM",0,0,"y"], ["ELMA",...], ...] }` (kelime, satır, sütun, yön). 60 bölüm ~200 satır tutar; isterse geliştirici yerleşimi küçük bir otomatik yerleştiriciyle de üretebilir ama bölümler sabit olmalı (herkes aynı bulmacayı görür).
- **Sözlük:** bonus kelime kontrolü için 3-7 harfli yaygın Türkçe kelimelerden oluşan ayrı bir `kelimeler.js` dosyası (Kelime Tahmin'deki `games/kelime-tahmin/kelimeler.js` örnek alınır, 5 harfli kelimeler oradan yeniden kullanılabilir). Türkçe büyük harf dönüşümü `toLocaleUpperCase('tr')` ile yapılır (i → İ, ı → I).

## İlerleme ve geri gelme
- **Yıldızlar (bölüm başına 1-3):** 1 = bölümü bitir; 2 = ipucu kullanmadan bitir; 3 = ipucu kullanmadan ve bölümün hedef süresinin altında bitir (hedef süre kelime sayısına göre, ör. kelime başına 20 sn).
- **Kilit:** bir sonraki bölüm öncekini bitirince açılır; yeni tema için önceki temada en az 20 yıldız gerekir.
- **Jeton (🪙):** başlangıçta 5; her bölüm ilk bitişte +1, her tema tamamlandığında +5, 10 bonus kelime +1, günlük bulmaca +2.
- **Açılan içerik:** her tema tamamlandığında yeni bir çark görünümü (renk/desen) ve harf kutusu teması açılır; 30 bölüm sonrası **Uzun Kelime** modu (7 harfli tek kelimeyi bulana kadar en çok bonus kelime topla, skor liderlik tablosuna gider).
- **Kelime koleksiyonu (sözlüğüm):** oyuncunun bulduğu tüm farklı kelimeler sayılır ("Bulduğun kelime: 214"); 100, 250, 500 kelimede jeton ödülü.
- **Günlük görevler (3 adet, tarihten `MiniOyun.rastgele()` ile):** "5 bonus kelime bul", "İpucu kullanmadan 2 bölüm bitir", "6 harfli bir kelime bul" vb.; her biri 1-2 jeton.
- Rozet önerisi: "Kelime Ustası" (60 bölümün hepsini bitir) `js/oyun.js` `BADGES` listesine.
- **Kayıt anahtarı:** `mo_harf` → `{ bolumler: {"1": yildiz, ...}, jeton, bonus, kelimeler: [...], acilan: [...], secili, uzunRekor, gorev: {tarih, liste, tamam}, gunluk: {tarih, bitti} }`. Yarım bölüm de kaydedilir (`devam: {bolum, bulunan}`), sayfa yenilenince bulunan kelimeler korunur. Kayıt bozuksa oyun sıfırdan başlar, hata vermez.
- **İlk gün:** Sabah temasını bitirir, ilk bonus kelimelerini toplar, ilk günlük bulmacayı çözer. **İlk hafta:** Deniz ve Dağ temalarını açar, eksik yıldızlar için eski bölümlere döner, kelime koleksiyonunu 250'ye çıkarır ve her gün günlük bulmacayı çözmeye alışır.

## Kontroller
- **Dokunmatik/fare:** çarktaki harfe basıp parmağı diğer harflerin üstünden geçirerek kelime kur, bırakınca gönder (`pointerdown`/`pointermove`/`pointerup`, harf tespiti `document.elementFromPoint` veya merkezden uzaklık ile; geri dönülen harf seçimden çıkar). Ayrıca tek tek harflere dokunup "Gönder" düğmesine basma da çalışır (zor sürükleme yapan oyuncular için). Çark alanında `touch-action: none`.
- **Klavye:** harf tuşlarına basarak kelime yazılır (yalnızca çarktaki harfler kabul edilir, aynı harf iki kez varsa ikinci örneği seçilir); Enter gönderir, Backspace son harfi siler, Boşluk karıştırır, `H` harf ipucu kullanır.
- Oyun süreli olduğu için (3. yıldız) duraklatma verilir: `pause`/`resume`/`canPause`; sekme gizlenince süre durur.

## Görsel tasarım
- Üstte bulmaca ızgarası (en fazla 10x10 kare, kare boyutu ekrana göre otomatik küçülür; 360 px'te kaydırmasız), altta yuvarlak çark (çap ~240 px, telefonda ekran genişliğinin %70'i), çark ortasında Karıştır düğmesi.
- Boş kareler koyu yarı saydam, dolan kareler tema rengiyle canlanır (kısa "pop" animasyonu, `prefers-reduced-motion` açıksa kapalı).
- Seçilen harfler arası kalın renkli çizgi (SVG `polyline` veya canvas); kurulan kelime çarkın üstünde büyük yazıyla görünür.
- Tema renkleri: Sabah turuncu-pembe, Deniz turkuaz, Dağ yeşil-gri, Şehir mor, Gece lacivert, Uzay mor-siyah yıldızlı.
- Üst şerit: bölüm no, 🪙 jeton, ⏱ süre, ⭐ bonus kumbarası ilerlemesi.
- Bölüm haritası: tema sekmeleri, her bölüm yuvarlak düğme + yıldızlar, kilitliler soluk; altta "Günlük Bulmaca", "Görevler", "Sözlüğüm".
- Simge: `🔠`, kart renkleri `["#fbbf24", "#db2777"]`.

## Sayfa metinleri
- title: `Harf Çarkı - Kelime Bulmaca Oyunu Oyna | MiniOyun`
- meta description: `Harfleri birleştir, kelimeleri bul, bulmacayı doldur! Ücretsiz Türkçe kelime bulmaca oyunu: 60 bölüm, yıldızlar, günlük bulmaca. Telefonda da oynanır.`
- **Nasıl oynanır:** Harf Çarkı'nda ekranın altındaki çarkta karışık duran harflerden anlamlı Türkçe kelimeler türetirsin. Bir harfe dokun ve parmağını diğer harflerin üzerinden kaydırarak kelimeyi oluştur, parmağını kaldırınca kelime kontrol edilir. Bilgisayarda harfleri klavyeden yazıp Enter tuşuna da basabilirsin. Bulduğun kelime üstteki bulmacada varsa yerine yerleşir; kesişen kelimelerin ortak harfleri de açılır. Bulmacada olmayan ama doğru yazılmış kelimeler bonus kelime sayılır ve jeton kumbaranı doldurur. Bulmacadaki tüm kelimeleri bulunca bölüm biter. Takıldığında jeton harcayarak bir harfi veya bütün bir kelimeyi açabilirsin. Altı temadaki 60 bölümü geç, ipucu kullanmadan ve hızlı bitirerek her bölümde üç yıldız topla.
- **İpuçları:** Önce kısa kelimeleri bul; açılan harfler uzun kelimeleri tahmin etmeyi kolaylaştırır. Karıştır düğmesi harflerin yerini değiştirir, bu da gözünün yeni kelimeleri görmesine yardım eder. Kelimenin sonuna -LI, -CI, -LIK gibi ekler gelebilir mi diye düşün; çarkta bu harfler varsa çoğu zaman uzun bir kelimenin anahtarıdır. Jetonlarını zor bölümlere sakla, bonus kelimeleri boşa sanma: her on bonus kelime bir jeton demektir. Her gün günlük bulmacayı çözerek ekstra jeton kazan.
- **Kısa SSS:** "Hangi kelimeler kabul ediliyor?" Yaygın Türkçe kelimelerin yalın halleri; özel isimler ve kısaltmalar sayılmaz. "İlerlemem kaybolur mu?" Hayır, bu tarayıcıda otomatik kaydedilir.

## Zorluk ve günlük mod
- Zorluk bölüm haritasıyla artar (harf ve kelime sayısı, kelime zorluğu, Türkçe harfler); ayrıca 30. bölümden sonra açılan Uzun Kelime modu en zor içeriktir. Liderlik tablosu için `seviye`: kampanyada `'bölüm N'`, Uzun Kelime'de `'uzun'`, günlükte `'gunluk'`.
- Günlük mod: **uygun**. `?gunluk=YYYY-AA-GG` ile `MiniOyun.rastgele()` tohumu, tüm bölüm havuzundan (veya ayrı 6-7 harfli bir günlük bulmaca listesinden) herkese aynı bulmacayı seçer. Skor tamamlama süresidir (kısa olan iyi); ipucu kullanılırsa her ipucu +30 sn ceza olarak eklenir. Kampanyanın kalıcı jetonları günlük modda kullanılamaz (herkes eşit şartlarda). `games.json` kaydına `"gunluk": true` eklenir. Not: oyunun kampanya rekoru puandır; günlük skoru süre olarak göstermek için ayrı bir alan gerekiyorsa liderlik tablosuna puan olarak gönderilmesi daha basittir (ör. `1000 - saniye`), geliştirici `js/oyun.js` ile uyumlu olanı seçsin.

## Kabul kriterleri
- [ ] Sürükleyerek ve tek tek dokunarak kelime kurma çalışır; geri dönülen harf seçimden çıkar; bir harf aynı kelimede iki kez kullanılamaz.
- [ ] Klavyeden yazma, Enter, Backspace, Boşluk (karıştır) çalışır; Türkçe harfler (Ç, Ğ, İ, I, Ö, Ş, Ü) doğru eşleşir, `i` tuşu `İ` olur.
- [ ] Bulmaca kelimesi bulununca kareleri dolar; kesişen kareler doğru harfi gösterir; aynı kelime ikinci kez sayılmaz.
- [ ] Sözlükte olan, bulmacada olmayan kelime bonus sayılır; 10 bonus = 1 jeton; aynı bonus kelime bölümde tekrar sayılmaz.
- [ ] İpuçları (harf aç / kelime aç) doğru jeton düşer, jeton yetmezse kullanılamaz.
- [ ] 60 bölüm, 6 tema oynanabilir; her bölümün tüm hedef kelimeleri çarktaki harflerle kurulabilir ve sözlükte bulunur (test bunu tüm bölümler için doğrulasın).
- [ ] Kilit ve 20 yıldız tema koşulu çalışır; yıldız koşulları (bitir / ipucusuz / ipucusuz + hedef süre) doğru hesaplanır, daha iyi sonuç eskiyi geçer, kötüsü silmez.
- [ ] Jeton, yıldızlar, koleksiyon, yarım bölüm ve görevler `mo_harf` anahtarında kalıcıdır; sayfa yenilenince korunur; bozuk kayıt (ör. `"{bozuk"`) oyunu sıfırdan başlatır, JS hatası vermez.
- [ ] Günlük modda (`?gunluk=2026-10-24`) iki açılışta aynı bulmaca gelir; günlük görevler tarihe göre değişir ve aynı gün iki kez ödül vermez.
- [ ] 360 px genişlikte yatay kaydırma yok; 7 harfli çark ve 10x10 ızgara ekrana sığar; harfler parmakla rahat seçilir.
- [ ] Duraklatma süreyi durdurur; sekme gizlenince süre durur.
- [ ] Bölüm bitince `MiniOyun.bitti` penceresi açılır ("Sonraki bölüm" / "Tekrar oyna"); kelime bulma, bonus, hata ve bölüm sonunda `MiniOyun.ses` çağrılır.
- [ ] `tools/tests/harf-carki.js`: 1. bölümün kelimelerini klavyeyle yazarak bölümü bitirir, yıldız ve `mo_harf` kaydını kontrol eder, bir bonus kelime ve bir geçersiz kelime dener, günlük mod tohumunu doğrular, tüm bölüm verisinin tutarlılığını (kelimeler harflerden kurulabilir, kesişmeler aynı harf) denetler.
- [ ] `agents/4-gelistirici.md` kalite listesinin tüm maddeleri karşılanır.

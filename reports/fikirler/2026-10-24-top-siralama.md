durum: gelistiriliyor
slug: top-siralama
baslik: Top Sıralama
kategori: Bulmaca
oncelik: 4

## Özet
Tüplerdeki renkli topları birbirinin üstüne taşıyarak her tüpü tek renge ayırdığın, 60 bölümlük haritası, yıldızları, yeni mekaniklerle açılan dünyaları ve günlük bulmacası olan bir renk sıralama bulmacası.

## Neden bu oyun
- Son rakip analizi (`reports/rakip-analizi/2026-10-24-02.md`) sıralama bulmacalarını (vida/top/otobüs sıralama) fikir ajanı için 2. öncelik olarak öneriyor: KralOyun'un hem "yeni" hem "popüler" listelerinde birden çok örnek var (Screw Sort, Yarn Fever, Bus Parking Out) ve tür "bölüm haritasına çok uygun". Sitede bu türden hiç oyun yok. 1. öneri (Harf Çarkı) zaten `bekliyor` durumunda.
- "top sıralama oyunu", "renk sıralama oyunu", "ball sort oyna", "su sıralama oyunu" Türkiye'de mobilde çok aranan aramalardır; tür telefonda tek dokunuşla oynandığı için mobil trafiğe uygundur. Ad ve tasarım özgündür, marka adı kullanılmaz.
- Bulmaca kategorisinde 3 oyun (2048, Mayın Tarlası, Sudoku) var ama hiçbiri bölüm haritalı değil; bu oyun kategoriye ilk kampanyalı bulmacayı ekler. Az oyunlu kategoriler (Hafıza, Refleks, Spor, Kelime) için bu turda rakip raporunda güçlü bir talep sinyali yok; Kelime için Harf Çarkı bekliyor.
- Bölümler bir üreticiyle (tohumlu karıştırma + çözülebilirlik kontrolü) üretildiği için 60 bölüm kod içinde veri tablosu olmadan tanımlanır; 500-800 satırda yapılabilir. Çizim CSS veya canvas ile, görsel/ses dosyası gerekmez. Bir bölüm 1-3 dakika sürer.

## Oynanış
- Ekranda N tüp var; her tüp en fazla 4 top alır. Bazı tüpler dolu, 2 tüp boş başlar.
- Bir tüpe dokunmak en üstteki topu (veya en üstteki aynı renk grubunu) seçer ve hafifçe yukarı kaldırır; ikinci dokunuş hedef tüpe taşır. Taşıma kuralı: hedef tüp boşsa veya en üst topu aynı renkteyse ve yer varsa taşınır. Aynı renkten üst üste birden fazla top varsa yer yettiği kadarı birlikte taşınır.
- Geçersiz hamlede tüp kısa sallanır, hamle sayılmaz.
- **Kazanma:** her dolu tüp 4 aynı renk toptan oluşunca (boş tüpler hariç) bölüm biter. Tamamlanan tüpün üstüne küçük bir ✓ kapak oturur.
- **Kilitlenme:** hiçbir geçerli hamle kalmazsa "Hamle kalmadı" uyarısı çıkar; oyuncu Geri Al, +1 Tüp veya yeniden başlat seçer. Bölüm kaybedilmez, sadece yıldız düşer.
- **Yardımcılar:** Geri Al (bölüm başına 5 ücretsiz, sonrası jetonla), +1 Tüp (boş tüp ekler; kullanılırsa en fazla 1 yıldız), Karıştır yok.
- **Puan/sonuç:** hamle sayısı (az daha iyi). Bölüm verisinde "hedef hamle" bulunur (üreticinin bulduğu çözümün hamle sayısı + pay).
- **Zorluk artışı:** renk sayısı 3'ten 12'ye çıkar, boş tüp sayısı 2'den 1'e iner (ileri bölümlerde), yeni mekanikler dünya dünya eklenir.

### Bölüm haritası
- 5 dünya x 12 bölüm = **60 bölüm**:
  - 🌱 Bahçe (1-12): 3-5 renk, 2 boş tüp, öğretici ilk 3 bölüm (oklarla gösterim).
  - 🌊 Deniz (13-24): 6-7 renk; **gizli toplar** (alttaki toplar ❔ ile kapalı, üstteki top kalkınca açılır).
  - 🏔️ Dağ (25-36): 8-9 renk; **kısa tüpler** (3 top alan tüpler karışık).
  - 🏙️ Şehir (37-48): 10 renk; **kilitli tüp** (🔒, belirli renk tüp tamamlanınca açılır).
  - 🌌 Uzay (49-60): 11-12 renk, tek boş tüp, gizli toplar + kilitli tüp birlikte.
- Bölümler `MiniOyun.rastgele()` tabanlı tohumlu üreticiyle üretilir: tohum = bölüm numarası (herkese aynı bölüm). Üretici çözülmüş durumdan geri doğru rastgele "ters hamleler" yaparak karıştırır, böylece her bölüm çözülebilir garantilidir; hedef hamle ayrıca küçük bir BFS/A* çözücüyle (renk sayısı ≤ 7'de) veya ters hamle sayısıyla belirlenir.
- Her dünyanın 12. bölümü **usta bölümü**: Geri Al kapalı.

## İlerleme ve geri gelme
- **Yıldızlar (bölüm başına 1-3):** 1 = bölümü bitir; 2 = hedef hamle + %30 içinde ve +1 Tüp kullanmadan; 3 = hedef hamle veya altında, Geri Al kullanmadan.
- **Kilit:** bir sonraki bölüm öncekini bitirince açılır; yeni dünya için önceki dünyada en az 24 yıldız (36'nın üçte ikisi) gerekir.
- **Jeton (🪙):** ilk kez kazanılan her yıldız 1 jeton, usta bölümü ilk kez +5, günlük bulmaca +3. Jetonla: Geri Al (+5 hak) 3 jeton, +1 Tüp 5 jeton.
- **Açılan içerik:** her dünya bitince yeni **top teması** açılır (Düz renk → Meyveler 🍎🍊🍋 → Hayvan yüzleri → Gezegenler → Değerli taşlar) ve tüp görünümü (cam, ahşap, neon). Renk körü dostu "şekilli toplar" teması (her renkte ayrıca ●▲■◆ işareti) baştan açıktır.
- **Görevler (günde 3, tarihten `MiniOyun.rastgele()` ile):** "3 bölümü Geri Al kullanmadan bitir", "Bir bölümü hedef hamlenin altında bitir", "Günlük bulmacayı çöz" vb.; tamamlanan görev 2 jeton verir, aynı gün tekrar ödül vermez.
- **Sonsuz mod:** 60 bölüm bitince açılır; zorluk seçmeli rastgele bölümler, çözülen bölüm sayısı serisi rekoru.
- Rozet önerisi: "Renk Ustası" (60 bölümün hepsini bitir) `js/oyun.js` `BADGES` listesine.
- **Kayıt anahtarı:** `mo_top` → `{ bolumler: {"1": yildiz, ...}, jeton, tema: {top, tup}, acilan: [...], gorev: {tarih, liste, tamam}, sonsuzSeri }`. Kayıt bozuksa sıfırdan başlar, hata vermez.
- **İlk gün:** Bahçe'yi bitirir, Meyve temasını açar, gizli toplarla Deniz'e başlar. **İlk hafta:** her gün günlük bulmacayı ve görevleri yapar, eski bölümlere 3 yıldız için döner, Şehir'in kilitli tüplerine ulaşır.

## Kontroller
- **Dokunmatik/fare:** tüpe dokun = seç, başka tüpe dokun = taşı, aynı tüpe tekrar dokun = seçimi bırak. Tüplerin dokunma alanı tüpün tamamı (en az 44 px genişlik).
- **Klavye:** 1-9, 0, Q, W, E tuşları soldan sağa tüpleri seçer (tüp altında küçük tuş etiketi gösterilir); Sol/Sağ ok + Enter ile de seçilebilir; `Z` veya Ctrl+Z Geri Al, `R` yeniden başlat.
- Oyunda süre yok, bu yüzden duraklatma gerekmez (`canPause` false döner); harita ve oyun ekranı arasında geçişte durum korunur.

## Görsel tasarım
- Site koyu teması üstünde, tüpler yarı saydam yuvarlak alt köşeli dikey kutular (CSS `border-radius`), toplar CSS daire veya emoji (tema). Tüpler iki satıra dizilir; 360 px genişlikte 14 tüp (2 x 7) kaydırmasız sığar (top çapı ~34 px).
- 12 kolay ayırt edilen renk: kırmızı, turuncu, sarı, açık yeşil, koyu yeşil, turkuaz, mavi, lacivert, mor, pembe, kahverengi, gri. Şekilli tema her renge ayrı işaret koyar.
- Seçilen top tüpün üstüne kalkar; taşıma kısa bir yay animasyonuyla (200 ms) olur; `prefers-reduced-motion` açıksa animasyon kapalı, doğrudan yer değiştirir.
- Tamamlanan tüpte ✓ kapak ve kısa parıltı. Gizli top koyu gri ❔, kilitli tüp 🔒 ve açacak rengin küçük noktası.
- Üst şerit: bölüm, hamle / hedef, Geri Al hakkı, jeton. Harita: dünya sekmeleri, yuvarlak bölüm düğmeleri + yıldızlar, kilitliler soluk; altta "Temalar" ve "Görevler".
- Simge: `🧪`, kart renkleri `["#34d399", "#7c3aed"]`.

## Sayfa metinleri
- title: `Top Sıralama Oyunu - Renk Sırala, 60 Bölüm | MiniOyun`
- meta description: `Renkli topları tüplere sırala! Ücretsiz top sıralama bulmacası: 60 bölüm, yıldızlar, açılan temalar ve günlük bulmaca. İndirmeden, telefonda da oyna.`
- **Nasıl oynanır:** Top Sıralama'da amacın karışık duran renkli topları tüplere ayırmak ve her tüpü tek renkle doldurmaktır. Bir tüpe dokunduğunda en üstteki top yukarı kalkar; sonra başka bir tüpe dokunarak onu oraya taşırsın. Bir topu yalnızca boş bir tüpe ya da en üstünde aynı renk top bulunan ve yeri olan bir tüpe koyabilirsin. Üst üste duran aynı renk toplar yer olduğu sürece birlikte taşınır. Her tüp dört top alır; bütün dolu tüpler tek renk olunca bölüm biter. Bölümü hedef hamle sayısında ve Geri Al kullanmadan bitirirsen 3 yıldız kazanırsın. Bahçe, Deniz, Dağ, Şehir ve Uzay dünyalarındaki 60 bölümde gizli toplar, kısa tüpler ve kilitli tüpler gibi yeni engellerle karşılaşırsın. Bilgisayarda tüpleri altlarındaki tuşlarla da seçebilirsin.
- **İpuçları:** Boş tüpleri değerli bir alan olarak gör ve oyunun başında hemen doldurma; önce en üstte aynı renk olan topları birleştirmeye çalış. Bir tüpü tamamen bitirmeye odaklanmak çoğu zaman tüm renklerle aynı anda uğraşmaktan daha az hamle tutar. Gizli toplu bölümlerde önce üstü açılabilecek tüpleri boşalt ki alttaki renkleri erken gör. Takıldığında Geri Al ile birkaç hamle geri dön ve farklı bir boş tüp kullanmayı dene. Kazandığın jetonları en çok usta bölümlerinde işine yarayacak +1 Tüp için sakla.
- **SSS önerisi:** "Her bölüm çözülebilir mi?" (Evet, bölümler çözülmüş durumdan geriye karıştırılarak üretilir.) "Yıldızlarımı nasıl artırırım?" (Bölümü tekrar oyna, daha iyi sonuç eskisinin yerine geçer.)

## Zorluk ve günlük mod
- Zorluk bölüm haritasıyla artar (renk sayısı, boş tüp sayısı, yeni mekanikler, usta bölümleri). Liderlik tablosu için `seviye`: kampanyada `'bölüm N'`, günlükte `'günlük'`, sonsuz modda `'sonsuz'`. `games.json` kaydına `"rekor": "hamle"` eklenir (az hamle daha iyi).
- Günlük mod: **çok uygun**. Bulmaca tamamen deterministiktir; `?gunluk=YYYY-AA-GG` tohumuyla herkese aynı 8 renkli, gizli toplu bir bölüm verilir ve skor hamle sayısıdır. Kalıcı yardımcılar (jetonlu Geri Al/+1 Tüp) günlük modda kapalıdır, herkes eşit şartlarda oynar. `games.json` kaydına `"gunluk": true` eklenir.

## Kabul kriterleri
- [ ] Taşıma kuralı doğru: boş tüpe veya aynı renk üstüne ve yer varsa taşınır; aynı renk grup yer yettiği kadar birlikte taşınır; geçersiz hamle sayılmaz.
- [ ] Üretilen her bölüm çözülebilir (ters hamleyle karıştırma); aynı bölüm numarası her açılışta aynı dizilimi verir.
- [ ] Gizli toplar, kısa tüpler ve kilitli tüpler ilgili dünyalarda doğru çalışır; kilitli tüp, şart olan renk tamamlanınca açılır.
- [ ] Hamle kalmayınca uyarı çıkar; Geri Al, +1 Tüp ve yeniden başlat çalışır; usta bölümlerinde Geri Al kapalıdır.
- [ ] 60 bölüm, 5 dünya oynanabilir; bölüm kilidi ve 24 yıldızlık dünya koşulu çalışır.
- [ ] Yıldız koşulları doğru hesaplanır; daha iyi sonuç eskisinin yerine geçer, daha kötüsü silmez; ilk kez kazanılan yıldız jeton verir, tekrar oynamak aynı yıldız için tekrar jeton vermez.
- [ ] İlerleme, jeton, açılan temalar ve görevler `mo_top` anahtarında kalıcıdır; sayfa yenilenince korunur; bozuk kayıt (ör. `"{bozuk"`) oyunu sıfırdan başlatır, JS hatası vermez.
- [ ] Temalar dünya bitince açılır ve seçilebilir; şekilli (renk körü dostu) tema baştan açıktır.
- [ ] Günlük modda (`?gunluk=2026-10-24`) iki açılışta aynı dizilim gelir; skor hamle sayısı olarak `MiniOyun.bitti({ skor })` ile gider.
- [ ] Günlük görevler tarihe göre değişir, tamamlanınca jeton verir, aynı gün tekrar ödül vermez.
- [ ] Klavye (tuş etiketleri, oklar + Enter, Z, R) ve dokunmatik kontrol çalışır; 360 px genişlikte 14 tüp kaydırmasız sığar.
- [ ] Bölüm bitince `MiniOyun.bitti` penceresi açılır (sonuç ör. `'23 hamle'`), "Tekrar oyna" bölümü sıfırlar; taşıma, tüp tamamlama ve kazanmada `MiniOyun.ses` çağrılır.
- [ ] `tools/tests/top-siralama.js`: 1. bölümü oyunun kendi çözücüsü veya bilinen tohum çözümüyle tıklayarak çözer, `.oyun-sonu[open]` penceresini, yıldız ve `mo_top` kaydını, "Tekrar oyna" sıfırlamasını ve günlük mod tohumunu doğrular.
- [ ] `agents/4-gelistirici.md` kalite listesinin tüm maddeleri karşılanır.

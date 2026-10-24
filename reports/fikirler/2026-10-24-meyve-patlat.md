durum: gelistiriliyor
slug: meyve-patlat
baslik: Meyve Patlat
kategori: Bulmaca
oncelik: 5

## Özet
Yan yana iki meyveyi yer değiştirerek üç veya daha fazlasını sıraya dizip patlattığın, 60 bölümlük haritada hamle sınırı içinde bölüm hedeflerini tamamlayıp yıldız topladığın bölümlü bir eşleştirme (match-3) oyunu.

## Neden bu oyun
- `agents/ORTAK.md` "Oyun derinliği" bölümünde öncelikli türler arasında "bölümlü eşleştirme (match-3)" açıkça yazıyor ve sitede bu türden hiç oyun yok. Proje sahibinin 2026-10-23'te önerilen üç derin oyundan biri olarak kabul ettiği (Kule Savunması yapıldı, idle oyun Olta Ustası fikriyle sırada) ve hâlâ yapılmamış tek aday budur.
- Son rakip analizi (`reports/rakip-analizi/2026-10-24-02.md`): CrazyGames ana sayfasında ayrı "Match & Merge" koleksiyonu, KralOyun ve Poki'de Cadılar Bayramı satırında "Halloween Match" gibi eşleştirme oyunları öne çıkıyor; "birleştir/sırala/eşleştir" bulmacaları sitelerin en popüler listelerinin üst sıralarında.
- "meyve patlatma oyunu", "şeker patlatma oyunu", "3'lü eşleştirme oyunu", "meyve eşleştirme oyna" Türkiye'de çok aranan, her yaşa hitap eden aramalardır. Bir bölüm 1-3 dakika, 60 bölüm ise günlerce içerik demektir; tür, "bir bölüm daha" etkisiyle oyuncuyu geri getirmede en güçlü türlerden biridir.
- Kategori notu: Bulmaca kategorisinde zaten 5 oyun var ve fikir ajanı normalde az oyunlu kategorileri tercih eder. Ancak bekleyen iki fikir Strateji (Kızma Birader) ve Refleks (Olta Ustası) kategorilerini dolduruyor; match-3 ise tür olarak açıkça bulmacadır, onu Arcade veya Hafıza'ya koymak kategori sayfalarını ve SEO'yu yanıltır. Öncelikli tür olması bu turda kategori dengesinin önüne geçti.
- Ad ve tasarım özgündür; herhangi bir ticari oyunun adı, görseli veya bölüm düzeni kullanılmaz. Emoji meyveler ve CSS/canvas ile 700-1000 satırda yapılabilir, görsel/ses dosyası gerekmez.

## Oynanış
- **Tahta:** 8x8 ızgara (bazı bölümlerde boş hücrelerle şekilli tahta: kalp, artı, iki ada vb.). 6 meyve türü: 🍎 🍊 🍋 🍇 🍓 🍉. İlk bölümlerde 5 tür, 2. dünyadan sonra 6 tür kullanılır.
- **Hamle:** Yan yana (yatay/dikey) iki meyve yer değiştirir. Değiştirme en az bir 3'lü dizi oluşturmuyorsa meyveler geri döner ve hamle sayılmaz.
- **Patlama ve düşme:** 3+ aynı meyve patlar, üstteki meyveler düşer, yukarıdan yenileri gelir; zincirleme (kaskad) patlamalar puan çarpanını artırır (x1, x2, x3...).
- **Özel meyveler:**
  - 4'lü düz dizi → 🚀 **Roket** (dizinin yönüne göre tüm satırı veya sütunu temizler).
  - L veya T şekli (5 meyve) → 💣 **Bomba** (3x3 alanı patlatır).
  - 5'li düz dizi → 🌈 **Gökkuşağı** (değiştirildiği meyve türünün tahtadaki tamamını patlatır).
  - Özel + özel birleşimleri: roket+roket = artı şeklinde satır+sütun; roket+bomba = 3 satır + 3 sütun; bomba+bomba = 5x5; gökkuşağı+özel = o türün tamamı özel meyveye dönüşüp patlar; gökkuşağı+gökkuşağı = tahtanın tamamı.
- **Engeller (dünyalara göre açılır):**
  - 🧊 **Buz:** meyvenin altında 1-2 katmanlı buz; üstünde patlama olunca bir katman kırılır. Hedef: tüm buzları kır.
  - 📦 **Kutu:** meyve içermeyen, hareket etmeyen engel; yanında patlama olunca 1-3 vuruşta kırılır.
  - ⛓️ **Zincir:** meyve yerinde kilitli, yer değiştiremez; içinde veya yanında patlama zinciri kırar.
  - 🌰 **Ceviz indirme:** tahtaya düşen cevizler patlamaz; en alt satıra kadar indirilince toplanır.
- **Bölüm hedefleri (her bölümde 1-2 tane):** belirli puana ulaş; X adet belirli meyve topla (ör. 30 🍓); tüm buzları kır; tüm kutuları kır; N cevizi indir.
- **Hamle sınırı:** her bölümde 15-35 hamle. Hedefler tamamlanınca kalan her hamle rastgele bir meyveyi rokete çevirip patlatır ("bonus patlama"), puan yıldızları için önemli.
- **Kaybetme:** hamleler bitince hedef tamamlanmadıysa bölüm başarısız. Oyuncu "Tekrar dene" veya (varsa) "+5 hamle" güçlendiricisini kullanabilir.
- **Hamle kalmadı karıştırması:** tahtada geçerli hamle yoksa tahta otomatik karıştırılır (hamle harcanmaz). İpucu: 5 saniye hareketsiz kalınca geçerli bir hamle hafifçe titrer.
- **Puan:** 3'lü = 30, 4'lü = 60, 5'li = 100, özel meyve patlatması ek puan; kaskad çarpanı uygulanır. Engel kırma +20.

## İlerleme ve geri gelme
- **Harita:** 60 bölüm, 4 dünya × 15 bölüm, dikey kayan yol haritası (bölüm düğümleri, kazanılan yıldızlar altında). Her dünyanın kendi arka plan renk teması:
  1. 🌳 **Bahçe (1-15):** temel kurallar, puan ve meyve toplama hedefleri, 5 tür meyve; 6. bölümde özel meyveler anlatılır.
  2. ❄️ **Buzul (16-30):** buz engeli ve şekilli tahtalar, 6 tür meyve.
  3. 🏜️ **Çöl Pazarı (31-45):** kutu ve zincir engelleri, ceviz indirme hedefi.
  4. 🌋 **Volkan (46-60):** tüm engellerin karışımı, daha az hamle, iki hedefli bölümler.
- **Yıldızlar:** her bölümde hedef tamamlanınca 1 yıldız; puan eşikleri 2 ve 3 yıldız (eşikler bölüm tanımında). Bir sonraki dünya, önceki dünyanın son bölümü bitince ve belirli toplam yıldızla açılır (Buzul: 25 ⭐, Çöl: 55 ⭐, Volkan: 90 ⭐). Bu, oyuncuyu eski bölümlere dönüp 3 yıldız denemeye yöneltir.
- **Güçlendiriciler (kalıcı stok):** 🔨 Çekiç (tek meyveyi/engeli kır), 🔀 Karıştır, ➕5 Hamle. Kazanma yolları: bölümü 3 yıldızla ilk kez bitirmek (1 rastgele güçlendirici), her dünyanın sonu (her birinden 2), günlük görevler. Ücretli/reklamlı alım yok.
- **Günlük görevler:** her gün `MiniOyun.rastgele()` tohumuyla seçilen 3 görev (ör. "10 roket oluştur", "3 bölümü yıldızla bitir", "200 🍋 patlat"); hepsi bitince 1 güçlendirici + seri sayacı (üst üste gün). 7 günlük seride ek tema açılır.
- **Açılan temalar (meyve seti):** Varsayılan meyveler; 30 ⭐ → 🍬 Şeker seti (🍬🍭🍫🧁🍩🍪); 80 ⭐ → 💎 Mücevher seti (💎🔷🔶🟣🟢🔴); 7 günlük seri → 🎃 Ürkünç set (🎃👻🦇🕸️🍬🕯️, Cadılar Bayramı sezonuna da uygun); 180 ⭐ (tüm yıldızlar) → 🌟 Altın çerçeve rozeti. Tema yalnızca görünüşü değiştirir.
- **Kayıt anahtarı:** `mo_meyve` → `{ bolumler: { "1": { yildiz, enIyi } , ... }, guc: { cekic, karistir, hamle5 }, tema, acikTemalar, gorev: { gun, liste, ilerleme }, seri, sonGun }`. Kayıt bozuksa sıfırdan başlar, hata vermez.
- **İlk gün:** oyuncu Bahçe dünyasının 10-15 bölümünü bitirir, özel meyveleri öğrenir, ilk güçlendiricilerini alır. **İlk hafta:** Buzul ve Çöl'e geçer, günlük görev serisiyle Ürkünç seti açar, eski bölümlerde 3 yıldız peşine düşer; Volkan dünyası ve 180 yıldız uzun vadeli hedeftir.

## Kontroller
- **Dokunmatik:** meyveye dokunup komşu yöne kaydırma (pointer olayları; 20 px eşik). Alternatif: bir meyveye dokun (seçili olur, halka belirir), sonra komşusuna dokun. Sayfa kaydırması oyun alanında engellenir (`touch-action: none`).
- **Fare:** sürükleme veya iki tıklama, dokunmatikle aynı.
- **Klavye:** ok tuşlarıyla imleç hareketi, Boşluk/Enter ile meyveyi seç, sonra ok tuşuyla değiştirme yönü; Esc seçimi iptal eder. P duraklatma (haritaya dönüş/ayarlar penceresi), H ipucu, 1/2/3 güçlendiriciler.

## Görsel tasarım
- Tahta: kare, genişliğe göre ölçeklenen (360 px ekranda hücre ~40 px, masaüstünde en fazla 60 px), koyu yarı saydam zemin, hücreler hafif yuvarlatılmış kareler, satranç tahtası gibi iki tonlu.
- Meyveler emoji, hücrenin %75'i boyutunda; seçili meyvede beyaz halka ve hafif büyüme. Özel meyveler: roket meyvenin üstünde küçük 🚀 rozeti ve parlak kenar; bomba daire şeklinde nabız animasyonu; gökkuşağı 🌈 tam hücre.
- Animasyonlar CSS transform ile (yer değiştirme 120 ms, düşme 150 ms/hücre, patlama ölçek+solma 200 ms). Kaskadda "x2!", "x3!" yazısı tahta ortasında belirir.
- Üst bilgi şeridi: bölüm no, kalan hamle (büyük, 5 ve altında kırmızı), hedef kartları (emoji + kalan sayı), puan çubuğu üzerinde 3 yıldız eşiği işaretleri.
- Dünya renkleri: Bahçe yeşil (#4ade80 → #15803d), Buzul açık mavi (#7dd3fc → #2563eb), Çöl turuncu-kum (#fcd34d → #d97706), Volkan koyu kırmızı (#f87171 → #7f1d1d).
- Kart rengi (games.json): ["#fb7185", "#f59e0b"], ikon 🍓.

## Sayfa metinleri
- **title:** Meyve Patlat - Ücretsiz Eşleştirme Oyunu Oyna | MiniOyun
- **meta description:** Aynı meyveleri üçlü dizip patlat! 60 bölüm, yıldızlar, roket ve bomba gibi özel meyveler. Ücretsiz, indirmeden telefonda ve bilgisayarda oyna.
- **Nasıl oynanır:** Yan yana duran iki meyveyi parmağınla kaydırarak yer değiştir. Aynı türden en az üç meyveyi yatay veya dikey bir sıraya dizdiğinde patlarlar, yukarıdaki meyveler düşer ve yenileri gelir. Her bölümün üstünde bir hedef yazar: belirli bir puana ulaşmak, bir meyveden belli sayıda toplamak, buzları ya da kutuları kırmak. Hedefi hamlelerin bitmeden tamamlarsan bölümü geçersin; kalan hamlelerin bonus patlamaya dönüşür ve puanına eklenir. Dörtlü dizi roket, L ya da T şekli bomba, beşli dizi gökkuşağı meyvesi oluşturur. Topladığın yıldızlarla yeni dünyalar ve meyve temaları açılır.
- **İpuçları:** Hamlelerini tahtanın alt kısmında yapmaya çalış; alttaki patlamalar yukarıdaki meyveleri düşürüp zincirleme patlamalar başlatır ve puan çarpanını artırır. Bir roket ile bir bombayı yan yana getirip birbirleriyle değiştirmek tek hamlede koca bir alanı temizler. Gökkuşağı meyvesini tahtada en çok bulunan meyveyle değiştir. Buzlu ve zincirli hücrelerin yanında eşleşme yapmayı öncelikle düşün, çünkü hedef çoğu zaman onlardır. Bölümü geçtikten sonra 3 yıldız için geri dönüp daha az hamleyle hedefi bitirmeyi dene.
- **Kısa SSS önerileri:** "Hamlem bitti, ne olur?" (bölümü tekrar dene veya +5 hamle güçlendiricisi), "Yeni dünya nasıl açılır?" (önceki dünyayı bitir ve yeterli yıldız topla), "İlerlemem kaybolur mu?" (tarayıcıda saklanır; tarayıcı verisi silinirse sıfırlanır), "Günlük görevler ne zaman yenilenir?" (her gün gece yarısı).

## Zorluk ve günlük mod
- **Zorluk eğrisi:** bölüm tanımları elle yazılır (tahta şekli, meyve türü sayısı, hamle sınırı, hedefler, engel yerleşimi, yıldız eşikleri) ve dünyadan dünyaya artar. İlk 5 bölüm neredeyse kaybedilemez; 15, 30, 45, 60 "dünya sonu" bölümleri zor. Geliştirici, Blok Bulmaca ve 2048 Görev Yolu'nda yapıldığı gibi hamle sınırlarını ve yıldız eşiklerini basit bir açgözlü yapay oyuncuyla simüle ederek ayarlamalı (bot ortalamasının ~1,5 katı hamle hedefi; 3 yıldız eşiği botun ulaşamayacağı ama dikkatli oyuncunun ulaşabileceği puan).
- **Günlük meydan okuma: uygun (`"gunluk": true`).** Her gün `MiniOyun.rastgele()` tohumuyla herkese aynı başlangıç tahtası ve aynı düşen meyve dizisi verilir; 25 hamlede en yüksek puan yarışılır. Tohumlu dizi sayesinde herkes aynı koşulda oynar, skor karşılaştırılabilir. Günlük skor, rekor olarak saklanır ve liderlik tablosuna gönderilir (yüksek puan iyidir; "rekor" alanı puan).
- **Rekor:** `MiniOyun.oyun` için ana skor günlük/serbest modun puanıdır (büyük daha iyi). Bölüm puanları yalnızca `mo_meyve` içinde bölüm başına `enIyi` olarak tutulur.

## Kabul kriterleri
- [ ] `games/meyve-patlat/index.html` ve `game.js` (gerekirse bölüm tanımları için `bolumler.js`) mevcut oyun sayfası şablonuna uygun: başlık, açıklama, canonical, JSON-LD, reklam alanları, çerez penceresi, göreceli bağlantılar.
- [ ] `games.json` girdisi (kategori Bulmaca, ikon 🍓, iki renk, `gunluk: true`) eklendi ve `npm run build` çalıştırıldı.
- [ ] 8x8 tahta; yer değiştirme yalnızca eşleşme oluşturuyorsa geçerli, aksi halde geri dönüyor ve hamle düşmüyor.
- [ ] Oyun başlangıcında ve yeni meyveler düştüğünde hazır 3'lü kalmıyor (başlangıç tahtası eşleşmesiz); geçerli hamle yoksa otomatik karıştırma çalışıyor.
- [ ] Kaskad patlamalar ve puan çarpanı doğru; 4'lü roket, L/T bomba, 5'li gökkuşağı oluşuyor ve etkileri doğru; özel+özel birleşimleri çalışıyor.
- [ ] Buz, kutu, zincir, ceviz engelleri ve tüm hedef türleri çalışıyor; hedef tamamlanınca kalan hamleler bonus patlamaya dönüşüyor.
- [ ] 60 bölüm, 4 dünya; 1-3 yıldız; dünya kilitleri yıldız şartıyla açılıyor; harita kazanılan yıldızları gösteriyor.
- [ ] Güçlendiriciler (çekiç, karıştır, +5 hamle) stoklanıyor ve kullanılıyor; günlük görevler tohumlu, seri sayacı çalışıyor; temalar şartlar sağlanınca açılıyor ve seçilebiliyor.
- [ ] İlerleme `mo_meyve` anahtarında kalıcı; bozuk kayıtla oyun hatasız sıfırdan başlıyor.
- [ ] Günlük mod `MiniOyun.rastgele()` ile herkese aynı tahta/diziyi veriyor; rekor kaydediliyor ve gösteriliyor; oyun sonunda `MiniOyun.bitti` penceresi açılıyor.
- [ ] Duraklatma (P / ekrandaki düğme) var; ses efektleri `MiniOyun.ses` ile (eşleşme, kaskad, özel meyve, bölüm bitti, başarısız).
- [ ] Dokunmatik kaydırma, iki dokunuşla seçme ve klavye kontrolü çalışıyor; 360 px ekranda taşma yok, tahta ekrana sığıyor, kaydırma sırasında sayfa kaymıyor.
- [ ] `.game-desc` içinde en az 150 kelimelik özgün Türkçe metin (nasıl oynanır, ipuçları, kısa SSS).
- [ ] `tools/tests/meyve-patlat.js` oynanış testi: geçerli bir değiştirme yapıp puanın arttığını, geçersiz değiştirmenin hamle düşürmediğini, bir bölümü (ör. bölüm 1, bot ile veya test kancasıyla) bitirip `mo_meyve` içinde yıldızın kaydedildiğini ve sayfa yenilenince haritada göründüğünü doğruluyor.
- [ ] `agents/4-gelistirici.md` kalite listesinin 9 maddesinin tamamı karşılanıyor; `npm test` geçiyor.

durum: yayinda
slug: blok-bulmaca
baslik: Blok Bulmaca
kategori: Bulmaca
oncelik: 5

## Özet
8x8 ızgaraya alttan gelen üçlü blok setlerini yerleştirip dolan satır ve sütunları patlattığın, 45 bölümlük macera haritası, yıldızları, açılan blok temaları ve tohumlu günlük bulmacası olan bir blok yerleştirme bulmacası.

## Neden bu oyun
- Rakip analizi (2026-10-24-02) blok yerleştirme bulmacasını 3. öncelik olarak öneriyor: Poki'de Blocky Blast Puzzle ve KralOyun'da Puzzle Blocks Classic ilk 5'te. Türkiye'de "blok bulmaca", "blok patlatma oyunu", "block puzzle oyna" aramaları yaygın.
- Rakip listesindeki ilk iki öneri zaten kuyrukta (Harf Çarkı yayında, sıralama bulmacası `top-siralama` bekliyor), idle türü de `olta-ustasi` ile bekliyor; sıradaki boşluk bu.
- Kategori notu: Bulmaca'da 2048, Mayın Tarlası, Sudoku var. Hafıza/Refleks/Spor daha boş, ancak bu kategoriler için rakip raporunda talep kanıtı zayıf; blok bulmaca ise en çok oynanan türlerden biri ve 2048'den tamamen farklı bir mekanik (yerleştirme + temizleme). Oyunun "Bulmaca" yerine "Arcade" kategorisine alınması da savunulabilir, ama türün arama terimi "bulmaca" olduğu için Bulmaca seçildi.
- Mobilde sürükle-bırak ile çok iyi oynanır, harici dosya gerektirmez, canvas veya CSS ızgarasıyla 600-900 satırda yazılabilir.

## Oynanış
- 8x8 ızgara. Altta her seferinde 3 blok parçası gösterilir (tekli kare, 2-5'li çubuklar, L'ler, 2x2 ve 3x3 kare, T, S/Z gibi tetromino benzeri şekiller; döndürme yok).
- Oyuncu parçaları istediği sırayla boş hücrelere sürükler. Üç parça da yerleşince yeni üçlü gelir.
- Tamamen dolan her satır veya sütun temizlenir. Puan: yerleştirilen her hücre 1 puan; temizlenen her hat 10 puan; aynı hamlede birden çok hat temizlenirse çarpan (2 hat x2, 3 hat x3...); arka arkaya hamlelerde hat temizlemek "seri" bonusu verir (seri sayısı x 5).
- Kalan parçalardan hiçbiri ızgaraya sığmıyorsa oyun biter.
- **Klasik (sonsuz) mod:** amaç en yüksek puan. Zorluk, puan arttıkça parça havuzundaki büyük/zor şekillerin ağırlığının artmasıyla yükselir.
- **Macera modu (bölümler):** her bölümün hedefi farklıdır ve hamle sınırı vardır:
  - Puan hedefi (ör. 25 hamlede 300 puan),
  - Taş temizleme: ızgaraya önceden yerleştirilmiş 💎 işaretli hücreleri, bulundukları hattı temizleyerek topla,
  - Kilitli hücre (🔒): iki kez temizlenmesi gereken hücre,
  - Hazır desen: bölüm, kısmen dolu bir ızgarayla başlar.
- Bölüm kaybı: hamle biter veya parça sığmazsa. "Tekrar dene" anında başlar.

## İlerleme ve geri gelme
- 45 bölüm, 3 dünya (her biri 15 bölüm): **Bahçe** (puan hedefleri, öğretici), **Maden** (💎 toplama, hazır desenler), **Buz Kalesi** (🔒 kilitli hücreler, karışık hedefler). Bir sonraki dünya, önceki dünyada en az 30 yıldızla açılır.
- Yıldızlar: hedefi tamamlamak 1 yıldız; kalan hamle sayısına göre 2 ve 3 yıldız (eşikler bölüm verisinde).
- Açılan içerik: toplam yıldızla açılan blok temaları (Klasik renkler → Şeker 🍬 → Ahşap → Neon → Gece), 4 adet de klasik modda puan rozeti (1000, 2500, 5000, 10000).
- Yardımcılar (kalıcı, sınırlı): "Parçaları yenile" ve "Tek hücre sil" hakkı; her 3 yıldızlı bölümde 1 hak kazanılır, en fazla 5 birikir. Yalnızca macera modunda kullanılır.
- Kayıt anahtarı: `mo_blok` → `{ v:1, yildiz:{"1":3,...}, tema:"klasik", acikTemalar:[...], hak:{yenile:n, sil:n}, rozetler:[...] }`. Kayıt bozuksa sıfırdan başlar. Klasik mod rekoru ortak çerçevenin rekor sisteminde (`puan`, yüksek daha iyi).
- İlk gün: öğretici Bahçe bölümleri ve birkaç klasik oyun. İlk hafta: Maden ve Buz Kalesi'ni açmak, 3 yıldız avı, tema toplamak, günlük bulmacada sıralamaya girmek.

## Kontroller
- **Dokunmatik:** parçaya dokunup sürükle; parça parmağın biraz üstünde gösterilir ki görünür kalsın; bırakılınca geçerliyse yerleşir, değilse geri döner. Sürüklerken yerleşeceği hücreler ve temizlenecek hatlar yarı saydam önizlenir. `touch-action: none`.
- **Fare:** aynı sürükle-bırak.
- **Klavye:** 1/2/3 ile parça seç, ok tuşlarıyla ızgarada konumlandır (önizleme gösterilir), Enter/Boşluk ile yerleştir, Esc ile seçimi bırak. P ile duraklat (macera menüsü).

## Görsel tasarım
- Izgara kare, genişlik `min(92vw, 420px)`; altında üç parça yuvası (ızgara hücre boyutunun ~%60'ı ölçekte). 360 px ekranda taşma yok.
- Koyu lacivert zemin (#1b2440), boş hücreler hafif açık (#27325a), dolu hücreler temaya göre renkli yuvarlatılmış kareler, hafif iç gölge.
- Hat temizlenince hücreler kısa bir parlama + küçülme animasyonuyla kaybolur; çoklu hatta "Harika!", "Muhteşem!" yazısı.
- 💎 ve 🔒 emoji ile çizilir. Bölüm haritası dünya başına yılan şeklinde dizilmiş yuvarlak düğmeler, altında yıldızlar.

## Sayfa metinleri
- title: `Blok Bulmaca Oyna - Ücretsiz Blok Patlatma Oyunu | MiniOyun`
- meta description: `Blokları 8x8 ızgaraya yerleştir, satır ve sütunları patlat! 45 bölümlük macera, yıldızlar, temalar ve günlük bulmaca. Ücretsiz, indirmeden oyna.`
- Nasıl oynanır: "Alttaki üç blok parçasını sürükleyerek 8x8 ızgaraya yerleştir. Bir satır ya da sütun tamamen dolduğunda patlar ve puan kazanırsın. Aynı hamlede birden fazla hattı temizlersen puanın katlanır, arka arkaya temizlersen seri bonusu alırsın. Parçalar döndürülemez; elindeki üç parçadan hiçbiri sığmadığında oyun biter. Macera modunda her bölümün kendine ait bir hedefi ve hamle sınırı vardır: puan topla, elmasları çıkar ya da kilitleri kır."
- İpuçları: "Izgaranın ortasını boş tutmaya çalış; büyük 3x3 kare ve 5'li çubuklar ancak geniş boşluklara sığar. Üç parçayı yerleştirmeden önce hepsine birlikte bak ve en zor sığanı önce koy. Kenarlara ve köşelere küçük parçalar yerleştirmek ortayı korur. Birden çok hattı aynı anda tamamlamak için hatları birlikte doldur, çarpan seni hızla yükseltir. Macera modunda hamle sayısını izle; kalan hamleler ekstra yıldız kazandırır."

## Zorluk ve günlük mod
- Klasik modda puan arttıkça zor parça ağırlığı artar; maceradaki bölümler dünya dünya zorlaşır (hamle sınırı daralır, hedef büyür, engeller artar). İki zorluk ayarı da eklenebilir: Kolay (parça havuzu küçük şekillere ağırlıklı) ve Normal.
- Günlük mod için çok uygun: `MiniOyun.rastgele()` tohumuyla herkese aynı parça dizisi verilir, aynı başlangıç ızgarası kullanılır; skor karşılaştırılabilir. `"gunluk": true`.

## Kabul kriterleri
- [ ] 8x8 ızgara, üçlü parça seti, satır/sütun temizleme, çoklu hat çarpanı ve seri bonusu çalışıyor.
- [ ] Parça sığmayınca oyun bitiyor ve `MiniOyun.bitti` penceresi açılıyor; klasik mod rekoru kaydediliyor ve gösteriliyor.
- [ ] Macera modu: 45 bölüm, 3 dünya, puan/💎/🔒 hedefleri, hamle sınırı, 1-3 yıldız; dünya kilidi yıldızla açılıyor.
- [ ] Temalar ve yardımcı haklar yıldızla açılıyor/kazanılıyor; seçilen tema kalıcı.
- [ ] İlerleme `mo_blok` anahtarında; bozuk kayıtta oyun hata vermeden sıfırdan başlıyor.
- [ ] Sürükle-bırak dokunmatik ve farede, klavye ile seç-konumla-yerleştir çalışıyor; yerleştirme önizlemesi görünüyor.
- [ ] 360 px ekranda taşma yok; sürüklerken sayfa kaymıyor.
- [ ] Ses efektleri (`MiniOyun.ses`): yerleştirme, hat temizleme, oyun sonu, bölüm kazanma.
- [ ] Rastgelelik `MiniOyun.rastgele()` ile; günlük modda aynı tohum aynı parça dizisini veriyor.
- [ ] `.game-desc` içinde 150+ kelime özgün Türkçe metin (nasıl oynanır, ipuçları, kısa SSS).
- [ ] `tools/tests/blok-bulmaca.js`: parça yerleştirme, bir hattın temizlenmesi ve puan artışı, bir bölümün kazanılıp yıldızın `mo_blok`'a yazılması, bozuk kayıtla açılış test ediliyor.
- [ ] `agents/4-gelistirici.md` kalite listesinin tüm maddeleri karşılanıyor.

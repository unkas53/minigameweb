durum: bekliyor
slug: solitaire
baslik: Solitaire Seferi
kategori: Strateji
oncelik: 4

## Özet
Klasik Klondike solitaire'i (iskambil falı) 60 elli bir sefer haritasına, yıldızlara, açılan Örümcek ve FreeCell türlerine ve kart desenlerine bağlayan, günlük eli olan kart oyunu.

## Neden bu oyun
- "Solitaire oyna", "örümcek solitaire", "iskambil falı", "kart oyunları" Türkiye'de sürekli aranan, özellikle yetişkin ve yaşlı kitlenin uzun süre kaldığı aramalar.
- Son rakip analizi (`reports/rakip-analizi/2026-10-24-02.md`): KralOyun popüler listesinde Solitaire Klasik, Coolmath'te Solitaire; raporun 6. önerisi "Solitaire (Klondike) ve Mahjong". Mahjong geliştiriliyor, Solitaire henüz önerilmedi.
- Sitede hiç kart oyunu yok. Strateji kategorisinde 3 oyun var (Dört Bağlantı, Kule Savunması, Kızma Birader); kart oyunu bu kategoriyi tek kişilik, sakin bir türle genişletir.
- Günlük el (herkese aynı karışım) türün doğasına çok uygun ve oyuncuyu her gün geri getirir.

## Oynanış
**Klondike (temel tür, baştan açık):**
- 52 kart. 7 sütun (1'den 7'ye kart, en üsttekiler açık), deste ve atık, 4 temel (as'tan papaza aynı renk-takım).
- Sütunlarda kartlar azalan sırada ve kırmızı/siyah sırayla dizilir; açık bir dizi topluca taşınabilir. Boş sütuna yalnızca papaz (veya papazla başlayan dizi) konur.
- Desteye dokununca 1 kart (kolay) veya 3 kart (zor) atığa açılır. Deste bitince atık tekrar desteye çevrilir (sınırsız; zor modda 3 tur sınırı).
- Kazanma: 52 kartın hepsi temellere. Hamle kalmazsa veya oyuncu "pes ederse" bölüm kaybedilir (sayı kaydedilmez).
- Puan: temele kart +10, sütunda kart açma +5, atıktan sütuna +5, temelden geri alma −15, geri al −2; bitirince kalan süre bonusu (`max(0, 300 − sn) × 2`). Liderlik tablosu puana göre (büyük iyi).

**Açılan türler (aynı kart motoru, kural tablosu farklı):**
- **Örümcek (1 takım, sonra 2 takım):** 10 sütun, 104 kart; aynı takımdan papazdan asa tam dizi tamamlanınca kendiliğinden kalkar; desteye dokununca her sütuna bir kart dağıtılır (boş sütun varken dağıtılmaz).
- **FreeCell:** tüm kartlar açık, 8 sütun, 4 serbest hücre, 4 temel; taşınabilen dizi uzunluğu `(boş hücre + 1) × 2^(boş sütun)`.

**Zorluk artışı:** Sefer bölümleri sırayla Klondike 1 kart → Klondike 3 kart → Örümcek 1 takım → FreeCell → Örümcek 2 takım şeklinde ilerler; her dünyada hedefler (hamle/süre sınırı) sıkılaşır. Her bölümün eli sabit tohumla üretilir ve **geliştirici, motorun açgözlü/arama botuyla her tohumun çözülebilir olduğunu doğrulayıp motor dosyasına sabit liste olarak yazar** (Blok Bulmaca ve Meyve Patlat'taki ayar yöntemi gibi). Çözülemeyen tohum listeye girmez.

## İlerleme ve geri gelme
- **Sefer haritası:** 5 dünya × 12 bölüm = 60 bölüm (Çay Bahçesi, Sahil Kahvesi, Kervansaray, Kış Konağı, Yıldız Salonu). Her dünya bir önceki dünyada en az 24 yıldızla açılır.
- **Yıldızlar (bölüm başına 1-3):** 1 yıldız = bitir; 2 yıldız = bölümün hamle hedefinin altında bitir; 3 yıldız = hamle hedefi + süre hedefi + "geri al" kullanmadan. Hedefler bölüm kartında görünür.
- **Açılan içerik:**
  - Türler: Örümcek 1 takım (2. dünya sonu), FreeCell (3. dünya), Örümcek 2 takım (4. dünya). Açılan tür, "Serbest oyun" menüsünde rastgele elle de oynanabilir.
  - Kart arkası desenleri (CSS gradyan/emoji): 8 desen, yıldız sayısıyla açılır (10, 25, 45, 70, 100, 130, 160, 180).
  - Masa örtüleri (yeşil çuha, lacivert, bordo, ahşap, gece): dünya bitirdikçe.
- **İpucu jetonları:** "İpucu" bir geçerli hamleyi parlatır. Her bölüm 1 jeton verir; 3 yıldız +1, günlük görev +2. En fazla 20 jeton birikir.
- **Günlük görevler (her gün 3, tohum = tarih):** ör. "3 bölüm bitir", "Bir bölümü geri al kullanmadan bitir", "Örümcek'te 2 dizi tamamla". Ödül: ipucu jetonu ve rozet ilerlemesi.
- **İstatistikler:** tür başına oynanan/kazanılan el, en iyi süre, en uzun galibiyet serisi.
- **Kayıt anahtarı:** `mo_solitaire` (tek JSON: bölüm yıldızları, açılan türler/desenler, seçili desen ve örtü, jeton, görevler ve tarih, istatistikler). Bozuk kayıt sessizce sıfırlanır.
- **Rozet önerisi:** `kart-ustasi` ("Solitaire Seferi'nde 100 yıldız topla").
- **İlk gün:** Klondike 1 kartla ilk 5-8 bölümü bitirir, ilk kart arkası desenini açar, günlük eli bir kez dener. **İlk hafta:** 2. dünyayı bitirip Örümcek'i açar, her gün günlük eli ve görevleri tamamlar, 3 yıldız için eski bölümlere döner.

## Kontroller
- **Dokunmatik/fare:** Karta dokun → otomatik en iyi hedefe taşınır (önce temel, sonra uygun sütun). Sürükle-bırak da çalışır (pointer olayları, `touch-action: none` yalnızca oyun alanında). Desteye dokun → kart aç. Çift dokunuş → temele gönder.
- **Klavye:** Ok tuşları ile sütun/kart seçimi, Enter/Boşluk seçili kartı otomatik taşı, D desteden kart aç, Z (veya Ctrl+Z) geri al, H ipucu, A "otomatik bitir" (tüm kartlar açıksa), P/Esc duraklat.
- Her an "Geri al" ve "İpucu" düğmesi; tüm kartlar açıldığında "Otomatik bitir" düğmesi belirir.

## Görsel tasarım
- Masa: koyu yeşil çuha (`#1f6b45` → `#17543a` radyal gradyan); açılan örtüler değiştirir.
- Kartlar CSS ile çizilir: beyaz yüz, köşede değer + takım işareti (♠ ♥ ♦ ♣ Unicode karakterleri, kırmızı `#d32f2f`, siyah `#212121`), ortada büyük takım işareti; vale/kız/papazda büyük harf (V, K, P) ve takım işareti. Görsel dosya yok.
- Kart boyutu ekran genişliğinden hesaplanır: 7 sütunda 360 px'te kart ~44×62 px; Örümcek'te 10 sütun için kart ~32×46 px ve dikey bindirme sıkılaştırılır. Kapalı kartların bindirmesi açıklardan küçük; uzun sütunlarda bindirme otomatik daralır, alan ekrana sığar (yatay kaydırma yok).
- Taşıma ve dağıtım 150 ms CSS geçişi; bölüm bitince kartlar temellerden zıplayarak düşer (kısa canvas/CSS animasyonu, "Animasyonları azalt" ayarına uyar).
- Harita: dünya başına bir şerit, bölümler numaralı yuvarlak düğümler ve altlarında yıldızlar.

## Sayfa metinleri
- **title:** Solitaire Oyna - Örümcek ve FreeCell | MiniOyun (47 karakter)
- **meta description:** Ücretsiz solitaire oyna: Klondike, Örümcek ve FreeCell türleri, 60 bölümlük sefer, yıldızlar, günlük el ve kart desenleri. İndirmeden, telefonda da çalışır. (153 karakter)
- **Nasıl oynanır:** Amaç, 52 kartın hepsini as'tan papaza doğru, takım takım dört temele dizmektir. Sütunlarda kartları büyükten küçüğe ve kırmızı-siyah sırayla üst üste koyabilirsiniz; açık bir diziyi topluca da taşıyabilirsiniz. Boş bir sütuna yalnızca papaz konur. Hamle bitince desteye dokunarak yeni kart açın. Bir karta dokunduğunuzda oyun onu en uygun yere kendisi taşır; isterseniz sürükleyip bırakabilirsiniz. Sefer haritasındaki her bölüm sabit bir eldir ve çözülebilir olduğu doğrulanmıştır. Bölümü bitirmek 1 yıldız, hamle hedefinin altında bitirmek 2 yıldız, hem hamle hem süre hedefini geri al kullanmadan tutturmak 3 yıldız verir. Yıldız topladıkça yeni dünyalar, Örümcek ve FreeCell türleri ve yeni kart desenleri açılır.
- **İpuçları:** Önce kapalı kartı en çok olan sütunlardaki kartları açmaya çalışın; kapalı kart açmak, desteden kart çekmekten daha değerlidir. As ve ikileri hemen temele gönderin, ama üçlerden sonrasını temele koymadan önce sütunlarda başka bir kartın altına gerekip gerekmeyeceğini düşünün. Boş sütunu, elinizde taşıyacak bir papaz yoksa hemen doldurmayın. Örümcek'te önce aynı takımdan dizileri birleştirin; FreeCell'de serbest hücreleri son çare olarak kullanın, çünkü boş hücre sayısı aynı anda taşıyabileceğiniz dizinin uzunluğunu belirler. Takılırsanız ipucu jetonu kullanın, ama 3 yıldız için geri almadan bitirmeniz gerekir.
- **Kısa SSS:** "Her el çözülebilir mi?" Sefer ve günlük eldeki eller çözülebilir olarak seçilmiştir; serbest oyundaki rastgele Klondike ellerinin bir kısmı çözülemeyebilir. "Örümcek nasıl açılır?" 2. dünyayı bitirince. "İlerlemem kaybolur mu?" İlerleme bu tarayıcıda saklanır; tarayıcı verilerini silerseniz sıfırlanır.

## Zorluk ve günlük mod
- Zorluk seviyeleri: Kolay (Klondike 1 kart, sınırsız deste turu) ve Zor (3 kart, 3 tur) serbest oyunda seçilebilir; sefer ise dünya dünya zorlaşır. `seviye` olarak sefer bölümünde `'bölüm 14'`, serbest oyunda `'klondike-1'`, `'klondike-3'`, `'orumcek-1'`, `'orumcek-2'`, `'freecell'` verilir.
- **Günlük mod: uygun** (`"gunluk": true`). `?gunluk=YYYY-AA-GG` ile `MiniOyun.rastgele()` tohumundan herkese aynı Klondike 1 kart eli gelir; el, çözülebilir bulunana kadar tohum+1 denenerek seçilir (botla çalışma anında, en fazla birkaç yüz ms) ya da önceden hesaplanmış çözülebilir tohum havuzundan tarihle seçilir. Günlük el sefer ilerlemesini etkilemez, yalnızca görev ve liderlik tablosuna yazar.

## Kabul kriterleri
- [ ] `games/solitaire/index.html` ve `game.js` (gerekirse kart kuralları için `motor.js`); harici dosya yok, toplam 500-1000 satır civarı.
- [ ] Klondike kuralları doğru: renk sırası, azalan değer, boş sütuna yalnızca papaz, dizi taşıma, temel sırası, deste/atık döngüsü (1 ve 3 kart).
- [ ] Örümcek (1 ve 2 takım) ve FreeCell kuralları doğru ve ancak koşulları sağlanınca açılıyor.
- [ ] 60 sefer bölümü sabit tohumlu; motor dosyasındaki her tohumun bot ile çözülebilir olduğu doğrulanmış; hamle/süre hedefleri bölüm kartında görünüyor.
- [ ] Yıldızlar, dünya kilitleri, kart arkası desenleri, masa örtüleri, ipucu jetonları, günlük görevler ve istatistikler `mo_solitaire` anahtarında kalıcı; bozuk kayıtta oyun sıfırdan başlıyor.
- [ ] Dokun-otomatik taşı, sürükle-bırak, çift dokunuşla temele gönderme ve klavye kısayolları çalışıyor; "Geri al", "İpucu", "Otomatik bitir" düğmeleri var.
- [ ] 360 px genişlikte 7 sütun ve Örümcek'in 10 sütunu yatay kaydırma olmadan sığıyor; uzun sütunlarda bindirme daralıyor.
- [ ] `MiniOyun.oyun({ restart, pause, resume, canPause, seviye })` kaydı; süre duraklatmada duruyor, duraklatılmışken girişler yok sayılıyor.
- [ ] Bitince `MiniOyun.bitti` puan (`skor`) ve `sonuc` (ör. `'1240 puan · 3:12'`) ile çağrılıyor; pes edilen/çözülemeyen elde `skor` verilmiyor.
- [ ] `MiniOyun.ses`: kart taşıma `tik`, temele kart `puan`, kazanma `kazan`, pes/kayıp `kaybet`.
- [ ] Rastgelelik yalnızca `MiniOyun.rastgele()` ile; `games.json` kaydında `"gunluk": true`; günlük modda iki açılışta aynı el geliyor.
- [ ] `.game-desc` en az 150 kelime özgün metin (nasıl oynanır, ipuçları, SSS) içeriyor.
- [ ] `tools/tests/solitaire.js`: oyunu açıyor, motorun botuyla (veya kayıt + test yardımcı kancasıyla) bir sefer elini bitirip `.oyun-sonu[open]` penceresini görüyor, en iyi skor ve `mo_solitaire` içinde bölüm yıldızının kaydını kontrol ediyor, "Tekrar oyna" ile elin sıfırlandığını ve günlük modda aynı elin geldiğini doğruluyor.
- [ ] `agents/4-gelistirici.md` kalite listesinin 9 maddesi karşılanıyor.

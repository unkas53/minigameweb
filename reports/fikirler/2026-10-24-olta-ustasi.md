durum: gelistiriliyor
slug: olta-ustasi
baslik: Olta Ustası
kategori: Refleks
oncelik: 4

## Özet
Oltayı denize sallayıp inerken balıklardan kaçtığın, takıldığı yerden yukarı çekerken yol üstündeki balıkları topladığın, kazandığın altınla oltanı, makaranı ve tekneni yükseltip yeni denizlere açıldığın yükseltmeli bir refleks/idle balıkçılık oyunu.

## Neden bu oyun
- Son rakip analizi (`reports/rakip-analizi/2026-10-24-02.md`) idle/tıklama oyunlarını 4. öncelik olarak öneriyor: Coolmath ilk 10'unda balıkçılık temalı bir idle oyun var, KralOyun ve Coolmath ana sayfalarında ayrı "Idle & Clicker" satırı bulunuyor. Sitede bu türden hiç oyun yok; geliştirme planında da idle oyun aday olarak duruyor. Öncelik 1 (Harf Çarkı) geliştiriliyor, öncelik 2 (Top Sıralama) bekliyor; öncelik 3 (blok yerleştirme) yine Bulmaca kategorisine düşeceği için bu turda az oyunlu bir kategoriyi dolduran idle fikri seçildi.
- Refleks kategorisinde yalnızca 1 oyun (Renk Tuzağı) var. Bu oyunun her turu (inişte kaçma, çıkışta yakalama) refleks ister; yükseltme ve pasif gelir katmanı da idle türünün "geri gelme" gücünü getirir.
- "balık tutma oyunu", "balıkçılık oyunu oyna", "olta oyunu" Türkiye'de sürekli aranan, özellikle çocuk ve mobil kitleye hitap eden aramalardır. Ad ve tasarım özgündür, marka adı kullanılmaz.
- Tek canvas, emoji balıklar ve basit fizikle 600-900 satırda yapılabilir; görsel/ses dosyası gerekmez. Bir tur 30-60 saniye, bir oturum 3-5 dakika.

## Oynanış
Bir tur üç evreden oluşur:
1. **İniş:** Olta kancası ekranın ortasından aşağı iner (kamera kancayı takip eder). Oyuncu kancayı sağa-sola yönlendirir. Yolda yüzen balıklardan **kaçar**: kanca bir balığa değerse iniş biter ve o noktadan çıkış başlar. Hiç değmezse kanca **misina uzunluğu** (yükseltme) kadar derine iner. Derinlik göstergesi metre cinsinden üstte yazar.
2. **Çıkış:** Kanca yukarı çekilir; oyuncu artık balıklara **değmeye çalışır**. Değdiği her balık kancaya takılır, ta ki **kanca kapasitesi** (yükseltme) dolana kadar. Kapasite dolunca çıkış hızlanır.
3. **Yüzey:** Takılan balıklar havaya fırlar; oyuncu onlara dokunarak (veya otomatik nişan yükseltmesiyle) "yakalar". Her balığın değeri derinliğe ve türüne göre değişir. Tur sonunda toplam altın, en derin nokta ve yakalanan balıklar gösterilir.
- **Balık türleri (derinliğe göre):** 0-50 m 🐟 (1 altın), 🐠 (2), 50-150 m 🐡 (5, değince şişip iki komşuyu da ittirir), 🦑 (8), 150-300 m 🦈 (20, hızlı ve geniş, inişte tehlikeli), 🐙 (15), 300 m+ 🐋 (60, yavaş ama çok geniş), 🦞, 🪼 (değmek kancadaki son balığı düşürür, çıkışta kaçınılmalı). Nadir ✨ altın balık: 10x değer.
- **Engeller:** ⚓ batık çapa ve 🪨 kayalar (değmek inişi bitirir), denizanası (çıkışta balık düşürür).
- **Kaybetme yok:** her tur bir miktar altınla biter; zorluk derinlikle artar (balık yoğunluğu, hızı, köpekbalığı oranı). Oyuncu her turda biraz daha derine inmeye çalışır.
- **Puan:** tur başına kazanılan altın; rekor "en yüksek tek tur altını" ve ayrıca "en derin nokta".

## İlerleme ve geri gelme
- **Yükseltmeler (altınla, her biri 1-20 seviye, fiyat seviyeyle katlanarak artar):**
  - 🧵 Misina uzunluğu: 30 m'den başlar, seviye başına +15 m.
  - 🪝 Kanca kapasitesi: 3 balıktan başlar, seviye başına +1.
  - ⚡ Makara hızı: çıkış hızı ve dolayısıyla tur süresi.
  - 🧲 Mıknatıs: kancanın yakalama yarıçapı (çıkışta).
  - 🛡️ Kalkan: inişte ilk 1-3 balık çarpmasını yok sayar.
  - 🎯 Oto nişan: yüzeyde fırlayan balıkların bir kısmını otomatik yakalar.
  - 🚤 Tekne (idle geliri): kapalıyken bile dakika başına altın biriktirir; oyuna dönünce "Sen yokken 340 altın kazandın" penceresi. Birikim en fazla 8 saatlik gelirle sınırlı.
- **Denizler (bölüm haritası):** 5 deniz, her biri yeni balık türleri, renk paleti ve engeller getirir; bir deniz önceki denizin **hedef derinliğine** ulaşınca açılır:
  - 🏖️ Koy (hedef 150 m) → 🌊 Açık Deniz (300 m) → 🧊 Buzul Denizi (450 m, buz kütleleri) → 🌋 Volkanik Yarık (600 m, yükselen kabarcıklar kancayı iter) → 🌌 Derin Uçurum (800 m, karanlık; yalnızca fener çevresi görünür, ışıklı balıklar).
  - Her denizde 3 yıldız görevi: ⭐ hedef derinliğe in, ⭐ tek turda X altın kazan, ⭐ o denizin özel balığını yakala (Koy ✨🐟, Açık Deniz 🐬, Buzul 🦭, Volkanik 🦐 kızıl karides, Uçurum 🐋 ışıklı balina). Toplam 15 yıldız.
- **Akvaryum / koleksiyon:** ilk kez yakalanan her tür akvaryuma eklenir (toplam ~20 tür). Akvaryum sayfası sergilenen türleri ve yakalanan adetleri gösterir; her tür 10 kez yakalanınca küçük bir kalıcı gelir bonusu (+%2) verir.
- **Görevler (günde 3, tarihten `MiniOyun.rastgele()` ile):** "Bir turda 5 🐠 yakala", "200 m'ye in", "Tek turda 500 altın kazan"; tamamlanan görev altın + 1 ✨ inci verir. İnciler kozmetik kanca/tekne görünümlerinde (🪝 klasik, ⚓ çapa, 💎 elmas, 🦆 ördek şamandıra) harcanır.
- Rozet önerisi: "Derinlerin Efendisi" (Derin Uçurum'da 800 m'ye in) `js/oyun.js` `BADGES` listesine.
- **Kayıt anahtarı:** `mo_olta` → `{ altin, inci, yukseltme: {misina, kanca, makara, miknatis, kalkan, nisan, tekne}, deniz, acikDenizler, yildizlar: {"koy": [..]}, akvaryum: {"🐟": adet}, gorev: {tarih, liste, tamam}, sonGiris, kozmetik, enDerin, enIyiTur }`. Kayıt bozuksa sıfırdan başlar, hata vermez.
- **İlk gün:** Koy'da 10-15 tur oynar, misina ve kancayı birkaç kez yükseltir, 150 m'yi geçip Açık Deniz'i açar, ilk 6-8 türü akvaryuma ekler. **İlk hafta:** her gün tekne gelirini toplar ve görevleri yapar, Buzul ve Volkanik denizlere ulaşır, akvaryumu tamamlamaya ve 15 yıldızı toplamaya çalışır.

## Kontroller
- **Dokunmatik/fare:** iniş ve çıkışta parmağın/imlecin yatay konumu kancayı yönlendirir (kanca yumuşak takiple o konuma kayar); yüzeyde havaya fırlayan balıklara dokunarak yakalanır. Tur başlatma: "Oltayı At" düğmesi. Canvas üzerinde `touch-action: none`.
- **Klavye:** Sol/Sağ ok veya A/D kancayı yönlendirir; yüzeyde Boşluk en yakın balığı yakalar; Boşluk/Enter ile "Oltayı At"; `P` duraklat.
- Hareketli oyun olduğu için duraklatma zorunlu (`canPause` true); sekme gizlenince otomatik duraklar.

## Görsel tasarım
- Canvas oyun alanı 9:16 oranında, genişliği en fazla 420 px, 360 px ekranda taşmadan sığar (`devicePixelRatio` ile keskin çizim).
- Su rengi derinlikle koyulaşan dikey gradyan (her denizin kendi paleti: Koy turkuaz, Açık Deniz mavi, Buzul açık gri-mavi, Volkanik koyu kırmızı-mor, Uçurum neredeyse siyah). Yüzeyde tekne ve dalga çizgisi.
- Balıklar emoji (yüzme yönüne göre `scale(-1,1)` ile çevrilir), kanca ve misina canvas çizgisi. Yükselen kabarcıklar küçük daireler.
- Üst şerit: derinlik (m), kancadaki balık sayısı / kapasite, altın. Tur sonu kartı: kazanılan altın, en derin nokta, yeni türler.
- Ana ekran sekmeleri: **Balık Tut**, **Yükselt**, **Denizler**, **Akvaryum**, **Görevler**. `prefers-reduced-motion` açıksa ekran sarsıntısı ve parıltılar kapalı.
- Simge: `🎣`, kart renkleri `["#0ea5e9", "#1e3a8a"]`.

## Sayfa metinleri
- title: `Olta Ustası - Balık Tutma Oyunu Oyna | MiniOyun`
- meta description: `Oltanı at, balıklardan kaçarak derine in, dönüşte topla! Ücretsiz balık tutma oyunu: yükseltmeler, 5 deniz, akvaryum ve günlük görevler. İndirmeden oyna.`
- **Nasıl oynanır:** Olta Ustası'nda her tur oltanı denize atarak başlar. Kanca aşağı inerken onu sağa sola yönlendir ve balıklara değmemeye çalış; bir balığa çarptığın anda iniş biter ve kanca yukarı çekilmeye başlar. Yukarı çıkarken bu kez yolundaki balıklara değ: her değdiğin balık kancana takılır. Kanca yüzeye ulaşınca balıklar havaya fırlar; onlara dokunarak yakala ve altın kazan. Derindeki balıklar çok daha değerlidir. Kazandığın altınla misinanı uzat, kancana daha çok balık sığdır, makaranı hızlandır ve tekneni geliştir; teknen sen oyunda yokken bile altın biriktirir. Hedef derinliğe ulaştıkça Koy'dan Açık Deniz'e, Buzul Denizi'ne, Volkanik Yarık'a ve Derin Uçurum'a açılırsın. Bilgisayarda kancayı ok tuşlarıyla yönetebilirsin.
- **İpuçları:** İlk turlarda altınını önce misina uzunluğuna harca; derine inmeden değerli balıklarla karşılaşamazsın. İnişte köpekbalıkları geniş ve hızlıdır, onları erken fark etmek için ekranın alt kısmına bak. Çıkışta kanca kapasiten dolmadan en değerli balıklara yönel, küçük balıklarla kancanı doldurma. Denizanalarından uzak dur, kancadaki balığı düşürürler. Kalkan yükseltmesi derin denizlerde inişi çok kolaylaştırır. Her gün tekne gelirini toplamayı ve görevleri yapmayı unutma.
- **SSS önerisi:** "Oyunda değilken nasıl altın kazanırım?" (Tekne yükseltmesi en fazla 8 saatlik pasif gelir biriktirir.) "Yeni denizi nasıl açarım?" (Bulunduğun denizin hedef derinliğine bir kez in.)

## Zorluk ve günlük mod
- Zorluk derinlik ve denizlerle artar: balık yoğunluğu, hızı, tehlikeli tür oranı, engeller ve görüş (Uçurum'da karanlık). Liderlik tablosu için `seviye`: normal turlarda deniz adı (ör. `'açık deniz'`), günlükte `'günlük'`. Skor tur altınıdır (yüksek daha iyi), `"rekor"` alanı gerekmez.
- Günlük mod: **uygun**. `?gunluk=YYYY-AA-GG` tohumuyla balık dizilimi herkese aynı üretilir; günlük modda kalıcı yükseltmeler devre dışıdır, herkes sabit bir "günlük ekipmanla" (ör. 250 m misina, 6 kanca, kalkan yok) tek tur oynar; skor o turun altını. `games.json` kaydına `"gunluk": true` eklenir.

## Kabul kriterleri
- [ ] İniş sırasında balığa veya engele değince iniş biter ve çıkış başlar; hiç değmezse misina uzunluğunda durur.
- [ ] Çıkışta değilen balıklar kanca kapasitesine kadar takılır; denizanası son balığı düşürür.
- [ ] Yüzeyde balıklar dokunma/Boşluk ile yakalanır; tur sonu kartında altın, derinlik ve yeni türler doğru gösterilir.
- [ ] 7 yükseltme satın alınabilir, fiyatı seviyeyle artar, etkisi oyunda görülür (ör. misina seviyesi derinlik sınırını artırır); yetersiz altında düğme pasiftir.
- [ ] Tekne pasif geliri geri dönüşte doğru hesaplanır ve 8 saatle sınırlıdır; saat geri alınırsa (negatif süre) gelir verilmez.
- [ ] 5 deniz hedef derinlikle sırayla açılır; her denizin 3 yıldızı doğru verilir.
- [ ] Akvaryum ilk kez yakalanan türleri kaydeder; 10 yakalama bonusu uygulanır.
- [ ] İlerleme `mo_olta` anahtarında kalıcıdır, sayfa yenilenince korunur; bozuk kayıt (ör. `"{bozuk"`) oyunu sıfırdan başlatır, JS hatası vermez.
- [ ] Günlük modda (`?gunluk=2026-10-24`) iki açılışta aynı balık dizilimi gelir, kalıcı yükseltmeler etkisizdir; skor `MiniOyun.bitti({ skor })` ile gider.
- [ ] Duraklatma (P ve ortak çerçeve) ve sekme gizlenince otomatik duraklama çalışır.
- [ ] 360 px genişlikte yatay taşma yok; dokunmatikte kanca parmağı takip eder.
- [ ] `tools/tests/olta-ustasi.js` en az şunları doğrular: bir tur oynanıp altın kazanılır (page.clock ile hızlandırarak), bir yükseltme satın alınır ve `mo_olta` içinde görünür, bozuk kayıtla sayfa hatasız açılır.
- [ ] `agents/4-gelistirici.md` kalite listesinin 9 maddesi karşılanır.

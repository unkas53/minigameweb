durum: bekliyor
slug: adam-asmaca
baslik: Adam Asmaca: Kelime Yolculuğu
kategori: Kelime
oncelik: 4

## Özet
Konu ipucuna bakarak gizli Türkçe kelimeyi harf harf tahmin ettiğin, 6 hatada ip tamamlanmadan bilmeye çalıştığın; 8 temalı diyarda 80 bölümlük haritada yıldız ve altın toplayıp ipucu jokerleri, yeni temalar ve kostümler açtığın klasik adam asmaca.

## Neden bu oyun
- Son rakip analizi (`reports/rakip-analizi/2026-10-24-02.md`) "Hangman / Wordmeister / WorldGuessr" satırında kelime/bilgi oyunlarının Coolmath'te popüler olduğunu yazıyor ve not düşüyor: "Adam asmaca Türkçe kelime listesiyle kolay". Fırsatlar listesindeki ilk yedi öneri yayında ya da sırada (Mahjong geliştiriliyor; Drift Ustası ve Lokanta Telaşı bekliyor); listede adı geçip henüz fikri yazılmamış ilk tür bu.
- "adam asmaca", "adam asmaca oyunu", "adam asmaca oyna" Türkiye'de okul çağı kitlede ve öğretmenlerde yıl boyu aranan, genel ve marka olmayan bir oyun adıdır. Türkçe karakterli (Ç, Ğ, I, İ, Ö, Ş, Ü) özgün kelime listesi, yabancı rakiplerin Türkçe sürümlerinden ayrışır.
- **Kategori dengesi:** `games.json`'da Kelime kategorisinde 2 oyun var (Kelime Tahmin, Harf Çarkı) ve bekleyen fikirlerde Kelime'ye giden yok; bekleyenler Spor (Drift Ustası), Arcade (Lokanta Telaşı) ve Hafıza'ya (Mahjong) gidiyor. Bu fikir Kelime'yi 3 oyuna çıkarır.
- ORTAK.md "Oyun derinliği": tek ekranlık klasik, bölüm haritası + yıldız + altın ekonomisi + açılan temalar + günlük görevlerle uzun soluklu hâle getiriliyor. Bir bölüm 30-90 saniye; 80 bölüm, seri modu ve koleksiyon saatlerce içerik sunar. Görsel/ses dosyası gerekmez: adam figürü SVG/CSS ile çizilir. Oyun kodu ~700-900 satır; kelime listesi ayrı `veri.js` dosyasında (Harf Çarkı örneği).

## Oynanış
- **Temel kural:** Ekranda gizli kelimenin harf sayısı kadar kutu ve bir konu ipucu (ör. "Meyve", "Şehir", "Meslek") görünür. Oyuncu ekran klavyesinden harf seçer. Harf kelimede varsa tüm geçtiği yerler açılır; yoksa darağacına bir parça eklenir (kafa, gövde, iki kol, iki bacak = 6 hata hakkı). Kelimenin tamamı açılırsa bölüm kazanılır; 6. hatada kaybedilir ve kelime gösterilir.
- **Türkçe harfler:** Klavye 29 harflik Türk alfabesidir (A B C Ç D E F G Ğ H I İ J K L M N O Ö P R S Ş T U Ü V Y Z). I/İ ayrı harflerdir; karşılaştırma `toLocaleUpperCase('tr')` ile yapılır. Kullanılmış harfler gri (yanlış) veya yeşil (doğru) olur ve tekrar seçilemez.
- **Çok kelimeli ifadeler:** İleri diyarlarda "KIRMIZI BALIK", "AY ÇİÇEĞİ" gibi iki kelimeli ifadeler gelir; boşluk baştan açık gösterilir.
- **Kelimeyi tahmin et:** Oyuncu istediği an "Kelimeyi bil" düğmesiyle tüm kelimeyi yazabilir; doğruysa bitmemiş kutu başına +bonus puan, yanlışsa 2 hata sayılır.
- **Puan (bölüm):** Kelime harf sayısı × 10 + kalan hata hakkı × 20 + açılmadan bilinen kutu × 15. Joker kullanmak puanı düşürmez ama 3. yıldızı engeller (bkz. yıldızlar).
- **Jokerler (altınla, bölüm başına sınırsız ama pahalılaşır):** 💡 Harf aç (rastgele kapalı bir harfi açar, 30 altın), 🧹 Harf ele (kelimede olmayan 3 harfi klavyeden siler, 20 altın), 📖 İkinci ipucu (konunun yanında kısa bir tanım gösterir, 25 altın). Her kullanımda o bölümde fiyat +10.
- **Zorluk artışı:** Kelime uzunluğu 4-5 harften 9-12 harfe çıkar; konu ipucu genelden (Hayvan) özele (Kuş, Deniz canlısı) gider; sonraki diyarlarda nadir harfli kelimeler (Ğ, J, V, Z), iki kelimeli ifadeler ve "sisli bölümler" (konu ipucu yalnızca 1 hatadan sonra görünür) gelir. Son diyarda hata hakkı 6'dan 5'e iner (kafa ve gövde tek parça).

## İlerleme ve geri gelme
- **Harita:** 80 bölüm, 8 diyar × 10 bölüm; dikey kayan yol haritası, her diyar kendi arka planı ve kelime temalarıyla:
  1. 🍎 **Bahçe** (1-10): meyve, sebze, renk; 4-5 harf. 1. bölümde 3 adımlık eğitim (harf seç, hata parçası, kelimeyi bil).
  2. 🐾 **Hayvanat** (11-20): hayvanlar; 5-6 harf.
  3. 🏠 **Ev** (21-30): eşya, mutfak, yiyecek; 5-7 harf; 🧹 jokeri açılır.
  4. 🏫 **Okul** (31-40): ders, meslek, spor; 6-8 harf; sisli bölümler başlar.
  5. 🗺️ **Türkiye** (41-50): şehir, bölge, coğrafya (yalnızca genel yer adları: il adları, dağ/göl gibi doğal adlar); 6-9 harf.
  6. 🌊 **Deniz** (51-60): deniz canlıları, gemi, hava durumu; iki kelimeli ifadeler başlar.
  7. 🔭 **Uzay ve Bilim** (61-70): gök cisimleri, bilim kavramları; 8-10 harf.
  8. 🏰 **Atasözü Kalesi** (71-80): deyim ve iki-üç kelimeli kısa ifadeler ("ATEŞ PAHASI", "TAŞ KESİLMEK"); 5 hata hakkı; 80. bölüm "Kale Kapısı": arka arkaya 3 kelime.
- **Bölüm kelimeleri sabit:** Her bölümün kelimesi `veri.js` içinde sabittir (`BOLUMLER: [{ k, konu, tanim }]`), böylece yıldızlar adil kalır ve aynı bölüm tekrar oynanabilir. En az 80 bölüm kelimesi + serbest/günlük mod için konu başına en az 40, toplam ≥ 500 kelimelik `HAVUZ` (tümü özgün derleme, yaygın ve uygunsuz olmayan kelimeler; özel ad olarak yalnızca il ve doğal yer adları).
- **Yıldızlar (bölüm başına 1-3):** 1 ⭐ kelimeyi bil; 2 ⭐ en fazla 2 hata; 3 ⭐ hatasız ve jokersiz. Diyar kilitleri: diyar N'nin açılması için önceki diyarın son bölümünü bitirmek + toplam yıldız eşiği (Hayvanat 8, Ev 20, Okul 35, Türkiye 52, Deniz 72, Uzay 95, Kale 120; toplam 240 ⭐).
- **Altın (💰):** Bölüm başına puan/10 kadar altın; bölümü ilk kez 3 ⭐ yapınca +20. Jokerler ve kozmetikler altınla alınır.
- **Açılan içerik (kalıcı):**
  - **Kostümler (yalnız görünüş):** darağacındaki figür için 8 kostüm (şapka 🎩, taç 👑, kask ⛑️, korsan 🏴‍☠️, astronot 🚀, aşçı, ninja, 🎃 balkabağı). Her diyarın sonunda biri açılır, 🎃 7 günlük seri ödülü. Figür kaybetmede asılmaz, "balona bağlanıp uçup gider" gibi çocuk dostu bir canlandırmayla gösterilebilir (sert görsel yok).
  - **Kelime defteri:** Bilinen her kelime konu konu deftere yazılır; defter sayfası tamamlanınca (ör. "Meyveler 12/12") +50 altın. Koleksiyon tamamlama geri dönme sebebidir.
  - **Kalıcı yükseltmeler (altınla, 3 seviye):** "Başlangıç harfi" (bölüm başında ilk harf açık gelir: 1 → 2 → kelimenin ilk ve son harfi), "Ucuz joker" (joker fiyatları -%15/seviye), "Ekstra can" (seri modunda +1 hata hakkı/seviye). Kariyer bölümlerinde yükseltmeler 3. yıldızı engellemez; günlük modda kullanılmaz.
- **Seri modu (sonsuz):** Seçilen konudan (veya karışık) arka arkaya kelimeler; her kelimede hata hakkı yenilenmez, bilinen her kelime +2 hata hakkı geri verir (en fazla 6). Seri uzunluğu rekor olarak saklanır; 4. diyardan sonra açılır.
- **Günlük görevler:** Tarihle tohumlanan 3 görev ("5 kelimeyi hatasız bil", "joker kullanmadan 3 bölüm", "seri modunda 10 kelime"); üçü bitince 40 altın + seri sayacı.
- **Kayıt anahtarı:** `mo_asmaca` → `{ bolumler: { "1": { yildiz, puan }, ... }, altin, kostum: { secili, acik: [] }, defter: ["ELMA", ...], yukseltme: { baslangic, joker, can }, gorev: { gun, liste, ilerleme }, seri, sonGun, seriRekor }`. Kayıt bozuksa sıfırdan başlar, hata vermez.
- **İlk gün:** Bahçe ve Hayvanat'ı bitirir, ilk kostümü ve 🧹 jokerini açar, birkaç günlük görevi tamamlar. **İlk hafta:** Ev, Okul ve Türkiye diyarlarına ilerler, 3 yıldız için eski bölümlere döner, kelime defterinde sayfa tamamlar, seri modunda rekor dener, 7 günlük seriyle 🎃 kostümünü açar. Deniz'den Atasözü Kalesi'ne ve 240 ⭐ uzun vadeli hedef; sonrasında seri modu ve günlük kelime.

## Kontroller
- **Dokunmatik / fare:** Ekran klavyesi (3 sıra, Türk alfabesi; tuşlar en az 32×44 px, 360 px'de 10 tuş/sıra sığacak şekilde), dokunmayla harf seçilir. Joker düğmeleri klavyenin üstünde. "Kelimeyi bil" penceresinde aynı ekran klavyesi kullanılır (sistem klavyesi açılmaz). `touch-action: manipulation`.
- **Klavye:** Fiziksel klavyeden harf yazmak doğrudan tahmin eder (Türkçe Q klavyede ç ğ ı ö ş ü ve i/İ doğru eşlenir; `event.key` + `toLocaleUpperCase('tr')`). Enter "Kelimeyi bil" penceresini açar/onaylar, 1/2/3 jokerler, P duraklat (yalnız seri modunda, süre yoksa duraklatma gerekmez), Esc pencereyi kapatır.

## Görsel tasarım
- **Renkler:** kâğıt-defter teması: arka plan krem #fffbeb, çizgili defter kenarı mavi #93c5fd, kutular beyaz ve koyu çerçeve #1e293b, doğru harf yeşil #16a34a, yanlış harf gri #9ca3af ve kırmızı çizgi #dc2626. Diyar şeritleri: Bahçe #86efac, Hayvanat #fcd34d, Ev #fdba74, Okul #93c5fd, Türkiye #fca5a5, Deniz #67e8f9, Uzay #a5b4fc, Kale #d6d3d1.
- **Figür:** SVG ile çizilen darağacı ve çubuk adam (çizgi kalınlığı 4 px), her hatada parça kısa bir çizilme animasyonuyla eklenir; kostüm emojisi kafanın üstüne yerleşir. Kaybetmede figür sarsılır ve balonla yukarı süzülür (çocuk dostu).
- **Kelime kutuları:** harf başına 28-36 px kare, uzun kelimelerde iki satıra kırılır; açılan harf hafif çevirme animasyonuyla görünür.
- **Oyun alanı:** genişlik en fazla 480 px; 360 px ekranda figür (160 px), 12 harflik kelime (iki satır) ve 3 sıra klavye taşmadan sığar; oyun sırasında sayfa kaymaz.
- **Kart rengi (`games.json`):** `["#2563eb", "#7c3aed"]`, ikon `🪢`.

## Sayfa metinleri
- **title:** Adam Asmaca Oyna - Ücretsiz Türkçe Kelime Oyunu | MiniOyun
- **meta description:** Ücretsiz Türkçe adam asmaca: ipucuna bak, harfleri tahmin et, 80 bölümlük haritada yıldız ve altın topla, kostüm aç. İndirmeden hemen oyna.
- **Nasıl oynanır:** Adam Asmaca'da gizli bir kelimeyi harf harf bulmaya çalışırsın. Ekranda kelimenin harf sayısı kadar boş kutu ve kelimenin konusunu söyleyen bir ipucu vardır. Klavyeden bir harf seç: harf kelimede geçiyorsa geçtiği her yere yerleşir, geçmiyorsa darağacına bir parça eklenir. Altı yanlış tahminde figür tamamlanır ve bölüm kaybedilir. Kelimeyi erken çözdüğünü düşünüyorsan "Kelimeyi bil" düğmesiyle tamamını yazabilirsin, ama yanlış tahmin iki hata sayılır. Bölümleri bitirdikçe yıldız ve altın kazanır, yeni diyarların kilidini açarsın; altınla ipucu jokerleri, figürün için kostümler ve kalıcı yükseltmeler alırsın.
- **İpuçları:** Türkçede en sık geçen harfler A, E, İ, L, R, N ve K'dır; ilk tahminlerini bu harflerden seç. Bir sesli harf bulunca kelimenin yapısı ortaya çıkar: Türkçede sesli ve sessiz harfler çoğunlukla sırayla dizilir. Konu ipucunu unutma: "Meyve" konusunda Ğ veya J geçme ihtimali düşüktür. Üç yıldız için joker kullanmaman gerekir, o yüzden jokerleri zor bölümlere sakla. Kelime defterini tamamlamak ek altın kazandırır.
- **Kısa SSS (metinde 3 soru):** "İlerlemem kaydediliyor mu?" (Evet, bölümler, altın, kostümler ve kelime defteri bu tarayıcıda otomatik kaydedilir.) / "Kelimeler nereden geliyor?" (Tüm kelimeler MiniOyun için derlenmiş yaygın Türkçe kelimelerdir; her bölümün kelimesi sabittir.) / "Günlük kelime nedir?" (Her gün herkese aynı kelime dizisi gelir; skorunu liderlik tablosunda karşılaştırırsın.)
- `.game-desc` toplamı en az 150 kelime olmalı (yukarıdaki metinler yeterli).

## Zorluk ve günlük mod
- **Zorluk:** Diyarlarla artar (kelime uzunluğu, konu özelliği, nadir harfler, iki kelimeli ifadeler, sisli bölümler, son diyarda 5 hata hakkı). Liderlik tablosu için `seviye: 'bölüm N'`, seri modunda `'seri'`, günlük modda `'günlük'`.
- **Günlük mod: uygun, `"gunluk": true`.** `?gunluk=YYYY-AA-GG` ile açılınca harita yerine "Günün 5 kelimesi" başlar: `HAVUZ`'dan `MiniOyun.rastgele()` tohumuyla 5 kelime (kısa → uzun) seçilir, herkese aynı kelimeler gelir. Toplam 6 hata hakkı 5 kelime boyunca paylaşılır; jokerler ve yükseltmeler kapalıdır. Skor 5 kelimenin toplam puanıdır (büyük iyi; `rekor` alanı eklenmez). Hata hakkı biterse bilinen kelimelerin puanı skor olarak verilir (en az 1 kelime bilindiyse), hiç bilinmediyse `kaybetti: true` ve skorsuz.
- Kariyer bölümleri `veri.js`'teki sabit kelimeleri kullanır; rastgelelik yalnızca `🧹 Harf ele` ve `💡 Harf aç` jokerlerinde (o da `MiniOyun.rastgele()` ile) ve seri modunda kelime seçiminde kullanılır.

## Kabul kriterleri
- [ ] `games/adam-asmaca/index.html`, `game.js`, `veri.js`, `games.json` kaydı (`"category": "Kelime"`, `"gunluk": true`) ve `npm run build` çıktısı mevcut; Kelime kategori sayfasında 3 oyun görünüyor.
- [ ] Türkçe harf işleme doğru: I ile İ ayrı harfler; "IRMAK" kelimesinde İ seçmek hata, I seçmek doğru sayılıyor; fiziksel klavyede `i` tuşu İ, `ı` tuşu I olarak eşleniyor.
- [ ] Doğru harf tüm geçtiği yerlerde açılıyor; yanlış harf bir parça ekliyor; kullanılmış harf tekrar seçilemiyor (hata sayılmıyor).
- [ ] 6 hatada (Atasözü Kalesi'nde 5) bölüm kaybediliyor, kelime gösteriliyor ve `bitti` `kaybetti: true` ile skorsuz çağrılıyor; kelime tamamlanınca kazanma penceresi açılıyor.
- [ ] "Kelimeyi bil": doğru tahmin bölümü bitirip bonus veriyor, yanlış tahmin 2 hata sayıyor.
- [ ] İki kelimeli ifadelerde boşluk baştan açık, kutular 360 px'de taşmadan iki satıra kırılıyor.
- [ ] 80 bölüm, 8 diyar; yıldız koşulları (bil / en fazla 2 hata / hatasız ve jokersiz) doğru; diyar kilitleri bölüm + yıldız eşiğiyle açılıyor.
- [ ] Jokerler altın düşürüyor, fiyat bölüm içinde artıyor; 🧹 yalnızca kelimede olmayan harfleri siliyor; 💡 yalnızca kapalı harf açıyor; joker kullanılan bölümde 3 ⭐ verilmiyor.
- [ ] Altın, kostümler, kelime defteri, yükseltmeler, günlük görevler, seri ve seri modu rekoru `mo_asmaca` içinde kalıcı; sayfa yenilenince geri geliyor.
- [ ] Günlük modda (`?gunluk=2026-10-24`) iki açılışta aynı 5 kelime geliyor; jokerler ve yükseltmeler kapalı.
- [ ] `veri.js`: 80 bölüm kelimesi ve ≥ 500 kelimelik havuz; her kelime yalnızca Türk alfabesi harfleri ve boşluk içeriyor (test bunu doğrular); marka adı veya uygunsuz kelime yok.
- [ ] `mo_asmaca` bozuk JSON içerdiğinde oyun sıfırdan başlıyor, konsolda hata yok.
- [ ] Ses efektleri: doğru harf `tik`, kelime açılınca `puan`, bölüm kazanma `kazan`, hata/kaybetme `kaybet`.
- [ ] Kontroller: ekran klavyesiyle ve fiziksel klavyeyle oynanabiliyor; 360 px genişlikte yatay kaydırma yok.
- [ ] `tools/tests/adam-asmaca.js`: 1. bölümü `veri.js`'teki kelimeyi okuyup doğru harflere basarak kazanıyor (`.oyun-sonu[open]`, en iyi skor, `mo_asmaca` içinde bölüm 1 yıldızı ve altın), 2. bölümde 6 yanlış harfle kaybediyor, "Tekrar oyna" ile sıfırlanmayı ve günlük modda iki açılışta aynı kelimelerin geldiğini kontrol ediyor.
- [ ] `agents/4-gelistirici.md` kalite listesinin 9 maddesi karşılanıyor.

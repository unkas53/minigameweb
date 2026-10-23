durum: bekliyor
slug: kelime-tahmin
baslik: Kelime Tahmin
kategori: Kelime
oncelik: 5

## Özet
Gizli 5 harfli Türkçe kelimeyi 6 denemede, her tahminden sonra harflerin renklerine bakarak bulduğun kelime oyunu.

## Neden bu oyun
- "Türkçe kelime tahmin oyunu", "5 harfli kelime oyunu", "kelime bulmaca oyna" ve "günlük kelime oyunu" Türkiye'de sürekli aranan ifadeler; tür 2022'den beri kalıcı bir alışkanlık hâline geldi ve oyuncular her gün geri dönüyor.
- Sitede **Kelime** kategorisinde hiç oyun yok (Kelime, Refleks, Strateji ve Spor boş). Bu oyun kategoriyi açar ve geliştirme planında "en büyük fırsat" olarak geçen Türkçe kelime oyunlarının ilkidir.
- Herkese aynı gizli kelime verilebildiği için günlük meydan okumaya en uygun türdür; paylaşılabilir renkli kare sonucu (emoji ızgarası) sosyal medyadan trafik getirir.
- Henüz rakip analizi raporu yok; seçim arama talebine ve sitedeki kategori boşluğuna dayanıyor.
- Not: Türün bilinen marka adı **kullanılmaz**; oyun adı ve metinlerde yalnızca "Kelime Tahmin" geçer.

## Oynanış
- Gizli kelime 5 harfli, Türkçe, yaygın bir isim/sıfat/fiil kökü (özel isim, argo, kaba söz, kısaltma yok).
- Oyuncu 6 satırlık ızgaraya sırayla 5 harfli tahminler yazar ve Enter ile gönderir.
- Tahmin, izin verilen kelime listesinde yoksa satır sallanır, "Listede yok" kısa uyarısı çıkar, deneme hakkı gitmez. 5 harf dolmadan gönderilirse "Yeterli harf yok" uyarısı.
- Gönderilen her harf renklenir: **yeşil** = doğru harf doğru yerde, **sarı** = harf kelimede var ama başka yerde, **gri** = harf kelimede yok. Tekrarlanan harfler doğru sayılır: önce yeşiller işaretlenir, sonra gizli kelimede kalan adet kadar sarı verilir, fazlası gri olur.
- Ekran klavyesindeki tuşlar da en iyi bilinen duruma göre renklenir (yeşil > sarı > gri; bir tuş asla daha kötü renge düşmez).
- Kazanma: kelime 6 deneme içinde bulunursa. Kaybetme: 6 deneme biterse; gizli kelime gösterilir.
- Puan/rekor: kazanılan deneme sayısı (az daha iyi). `games.json` kaydında `"rekor": "deneme"` birimiyle en iyi sonuç `MiniOyun.getBest/setBest` ile saklanır. Ek olarak `localStorage` anahtarı `kelime-tahmin-istatistik` içinde: oynanan, kazanılan, mevcut seri, en uzun seri ve 1-6 deneme dağılımı. Oyun sonu penceresinde bu istatistik ve küçük bir dağılım çubuğu gösterilir.
- Paylaş: `MiniOyun.bitti` içindeki `paylas` metni harfleri değil yalnızca emoji ızgarasını içerir (🟩🟨⬛), ör. `Kelime Tahmin 4/6` + satırlar. Kelime asla paylaşılmaz.
- Devam eden oyun `localStorage` anahtarı `kelime-tahmin-kayit` ile her tahminde saklanır (gizli kelimenin listedeki sırası, tahminler, zorluk, günlük tarihi); sayfa yenilenince kaldığı yerden sürer, bitince silinir.

### Kelime listeleri
- `games/kelime-tahmin/kelimeler.js` ayrı dosyada (oyun mantığı `game.js` içinde 300-600 satır kalsın): iki dizi, `CEVAPLAR` (en az 400 yaygın, herkesin bileceği 5 harfli kelime) ve `GECERLI` (en az 2000 kelime; cevapları da kapsar). Listeyi geliştirici kendisi derler, başka bir siteden veya oyundan liste kopyalanmaz. Tüm kelimeler Türkçe büyük harfle (`toLocaleUpperCase('tr-TR')`) saklanır.
- Liste derlenirken her kelimenin tam 5 harf olduğu (Türkçe karakterler tek harf sayılır), tekrar olmadığı ve `CEVAPLAR`ın `GECERLI` içinde bulunduğu küçük bir betikle veya testte doğrulanır.

### Zorluk
- **Normal:** yukarıdaki kurallar.
- **Zor mod:** bulunan ipuçları sonraki tahminlerde kullanılmak zorunda (yeşil harf aynı yerde kalmalı, sarı harf tahminde bulunmalı); uymayan tahmin "2. harf A olmalı" gibi bir uyarıyla reddedilir. Zor mod oyun başlamadan seçilir, oyun ortasında değiştirilemez. Zor modun rekoru ayrı tutulur.

## Kontroller
- **Klavye:** Harf tuşları (Ç, Ğ, I, İ, Ö, Ş, Ü dahil; küçük harf girişleri `tr-TR` ile büyütülür, `i` → `İ`, `ı` → `I`), Backspace siler, Enter gönderir.
- **Dokunmatik/fare:** Izgaranın altında Türkçe Q düzeninde ekran klavyesi: 
  - 1. sıra: E R T Y U I O P Ğ Ü
  - 2. sıra: A S D F G H J K L Ş İ
  - 3. sıra: ENTER Z C V B N M Ö Ç ⌫
  (Q, W, X yok.) Tuşlar en az 40px yüksekliğinde, `touch-action: manipulation`, çift dokunma yakınlaştırması yok. 360px genişlikte 11 tuşlu sıra taşmadan sığmalı (tuş genişliği `flex: 1`, aralık 4px).
- Oyun durakladığında (`MiniOyun.duraklatildi()`) giriş yok sayılır. Oyun süreli değildir, ama süre kişisel istatistik olarak tutulacaksa `pause/resume` verilir.

## Görsel tasarım
- Sitenin koyu tema renk değişkenleri. Izgara 5x6 kare, kare kenarı en fazla 58px, telefonda ekrana göre küçülür (360px'de en az 50px, ızgara + klavye tek ekrana sığar, kaydırmasız).
- Renkler: yeşil `#22c55e`, sarı `#eab308`, gri `#4b5563`; boş kare ince çerçeveli, harf yazılınca çerçeve parlar ve küçük "pop" animasyonu.
- Gönderilen satır harf harf çevrilen (flip, CSS `rotateX`) animasyonla renklenir (harf başına ~250 ms gecikme); kazanınca harfler sırayla zıplar. `prefers-reduced-motion` açıksa animasyonlar kapanır.
- Renk körü desteği: ayarlarda "Yüksek kontrast" seçeneği yeşili turuncu (`#f97316`), sarıyı mavi (`#3b82f6`) yapar; tercih `localStorage`'da saklanır.
- Uyarılar ızgaranın üstünde kısa süreli toast olarak görünür.
- Simge: `🔤`, kart renkleri `["#34d399", "#0e7490"]`.

## Sayfa metinleri
- title: `Kelime Tahmin Oyunu - 5 Harfli Türkçe Kelime Bul | MiniOyun`
- meta description: `Gizli 5 harfli Türkçe kelimeyi 6 denemede bul. Renkli ipuçları, günlük kelime, zor mod ve istatistikler. Ücretsiz, üyeliksiz, telefonda oyna.`
- **Nasıl oynanır:** Amacın gizli 5 harfli Türkçe kelimeyi en fazla 6 denemede bulmak. Klavyeden ya da ekrandaki tuşlardan anlamlı bir 5 harfli kelime yaz ve Enter'a bas. Her tahminden sonra harfler renklenir: yeşil harf kelimede ve doğru yerde, sarı harf kelimede var ama başka bir yerde, gri harf ise kelimede hiç yok. Bu ipuçlarını kullanarak bir sonraki tahminini daralt. Kelimeyi 6 deneme içinde bulursan kazanırsın; bulamazsan gizli kelime gösterilir. Günlük modda herkes aynı kelimeyi çözer, sonucunu harfleri göstermeden renkli karelerle paylaşabilirsin.
- **İpuçları:** İlk tahminde A, E, İ, R, L, K, N gibi Türkçede sık geçen harfleri içeren ve harf tekrarı olmayan bir kelime seç. Gri çıkan harfleri bir daha kullanma; ekran klavyesi bunları soluk gösterir. Sarı harfi bir sonraki tahminde farklı bir konuma koyarak yerini ara. Türkçede kelimeler sık sık -LAR, -LER, -LIK gibi eklerle bitmez, çünkü gizli kelimeler yalın köklerdir; sona değil kökün ünlü uyumuna odaklan. Aynı harfin iki kez geçebileceğini unutma.
- **Kısa SSS (`.game-desc` sonunda):** "Kelimeler ekli mi?" → Hayır, gizli kelimeler yalın hâldedir. "Günlük kelime ne zaman değişir?" → Her gün gece yarısı (Türkiye saati). "Zor mod nedir?" → Bulduğun yeşil ve sarı harfleri sonraki tahminlerde kullanmak zorunda olduğun moddur.

## Zorluk ve günlük mod
- İki zorluk: Normal ve Zor mod (yukarıda). Ayrıca kelime havuzu yaygın kelimelerden seçildiği için normal oyun herkes için erişilebilir kalır.
- **Günlük moda çok uygun:** gizli kelime `var rnd = MiniOyun.rastgele();` ile `CEVAPLAR` içinden seçilir; `?gunluk=YYYY-MM-DD` ile herkes aynı günde aynı kelimeyi alır. Serbest oyunda her "Yeni oyun" yeni kelime verir (son 30 cevap tekrarlanmaz, `localStorage` `kelime-tahmin-son`). `games.json` kaydına `"gunluk": true` eklenir.

## Kabul kriterleri
- [ ] `games/kelime-tahmin/index.html`, `game.js` ve `kelimeler.js` mevcut oyun sayfalarının yapısını izler (canonical, JSON-LD `genre: Kelime`, nasıl oynanır, ipuçları, SSS, reklam alanları, çerez penceresi); tüm bağlantılar göreceli.
- [ ] `games.json`'a `Kelime` kategorisinde kayıt (`icon: 🔤`, colors, `"gunluk": true`, `"rekor": "deneme"`) eklendi ve `npm run build` çalıştırıldı; `kategori/kelime/` sayfası oluştu ve kategori çubuğunda Kelime görünüyor.
- [ ] Kelime listeleri özgün; tüm kelimeler tam 5 Türkçe harf, tekrar yok, `CEVAPLAR` ⊂ `GECERLI`, `CEVAPLAR` en az 400, `GECERLI` en az 2000 kelime (testte doğrulanır).
- [ ] Renk mantığı tekrarlanan harflerde doğru: ör. gizli `KALEM`, tahmin `KAKAO` → K yeşil, A yeşil, K gri, A gri, O gri (oynanış testinde bu tür en az 3 durum sınanır).
- [ ] Listede olmayan kelime ve eksik harf deneme hakkı harcamadan reddediliyor.
- [ ] `i`/`İ` ve `ı`/`I` ayrımı fiziksel klavyede ve ekran klavyesinde doğru (küçük `i` → `İ`).
- [ ] Ekran klavyesi renkleri en iyi durumu koruyor (yeşil olan tuş sonradan sarıya/griye düşmüyor).
- [ ] Zor mod ipucu kurallarına uymayan tahmini açıklayıcı uyarıyla reddediyor; zor modun rekoru ayrı.
- [ ] Kazanma/kaybetme sonunda `MiniOyun.bitti` açılıyor, kaybedince gizli kelime gösteriliyor; istatistik ve deneme dağılımı güncelleniyor; seri doğru sayılıyor.
- [ ] Paylaş metni yalnızca emoji ızgarası ve `n/6` içeriyor, harf içermiyor.
- [ ] Günlük modda aynı tarih her zaman aynı kelimeyi veriyor.
- [ ] Sayfa yenilenince devam eden oyun aynen geliyor; biten oyunun kaydı siliniyor.
- [ ] `MiniOyun.ses` ile harf yazma (`tik`), doğru tahmin (`kazan`), kaybetme (`kaybet`) sesleri var.
- [ ] 360px genişlikte yatay kaydırma yok; ızgara ve klavye kaydırmadan aynı ekranda; tuşlar en az 40px.
- [ ] `.game-desc` en az 150 kelime özgün Türkçe metin içeriyor.
- [ ] `tools/tests/kelime-tahmin.js` oynanış testi var ve `node tools/smoke-test.js` hatasız geçiyor.

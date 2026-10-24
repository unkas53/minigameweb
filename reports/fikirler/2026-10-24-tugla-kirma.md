durum: yayinda
slug: tugla-kirma
baslik: Tuğla Kırma
kategori: Arcade
oncelik: 4

## Özet
Raketle topu sektirip tuğlaları kırdığın, 30 bölümlük haritası, bölüm başına 1-3 yıldızı ve elmasla alınan kalıcı yükseltmeleri olan bir tuğla kırma (breakout) oyunu.

## Neden bu oyun
- **Arcade** kategorisinde yalnızca Yılan var; bu oyun kategoriye ikinci ve uzun soluklu bir oyun ekler.
- "tuğla kırma oyunu", "tuğla kırma oyna", "top ile tuğla kırma", "atari tuğla oyunu" Türkiye'de yıllardır aranan klasik bir mini oyun türüdür; rakip mini oyun sitelerinde arcade bölümünün en çok oynananları arasında yer alır. Henüz rakip analizi raporu olmadığı için seçim kategori boşluğuna ve genel arama talebine dayanıyor.
- Bölüm tasarımı (tuğla dizilimi) veriyle yapılır, bu yüzden 30 bölüm tek dosyada kısa kalır. Canvas çizimiyle yapılır, görsel/ses dosyası gerekmez. Bir bölüm 1-3 dakika sürer.
- Sitedeki derin oyunlar (Kule Savunması, Penaltı Ligi fikri) strateji ve spor; bu fikir aynı derinliği hızlı tempolu refleks/arcade tarafına taşır.

## Oynanış
- Altta yatay bir raket, üstte tuğla dizilimi. Top raketten ve duvarlardan seker; topun raketin neresine çarptığı çıkış açısını belirler (kenarlara yakın = daha yatay açı).
- Bölüm başında top raketin üstünde bekler; dokununca/Boşluk ile fırlatılır.
- **Tuğla türleri:** normal (1 vuruş), sağlam (2-3 vuruş, her vuruşta renk solar), metal (kırılmaz, bölüm bitişinde sayılmaz), patlayan 💥 (komşu tuğlaları da kırar), sürpriz ❓ (kırılınca güçlendirme düşürür).
- **Güçlendirmeler (düşen kapsül, raketle yakalanır, 10-15 sn):** Geniş Raket, Çoklu Top (+2 top), Yavaş Top, Lazer (raket iki yandan ateş eder), Yapışkan Raket (top yapışır, tekrar fırlatılır). Zararlı kapsül: Dar Raket (ileri bölümlerde çıkar).
- **Kaybetme:** Tüm toplar alttan düşerse can gider; 3 can (yükseltmeyle 5'e kadar). Canlar biterse bölüm kaybedilir.
- **Kazanma:** Metal olmayan tüm tuğlalar kırılınca bölüm biter.
- **Puan:** tuğla başına 10 x vuruş sayısı; ardışık tuğla kırma (top rakete dönmeden) kombo çarpanı (x2, x3...), kalan her can +500, kalan süre bonusu.
- **Zorluk artışı:** bölüm ilerledikçe top hızı %3-4 artar, sağlam/metal tuğla oranı yükselir, hareketli tuğla sıraları (yavaşça sağa-sola kayan) 11. bölümden sonra başlar, Dar Raket kapsülleri 16. bölümden sonra çıkar.

### Bölüm haritası
- 3 dünya x 10 bölüm = **30 bölüm**: 🌳 Orman (1-10, öğretici; 1. bölüm yalnızca normal tuğla), 🏜️ Çöl (11-20, hareketli sıralar, patlayan tuğlalar), 🌌 Uzay (21-30, metal labirentler, yüksek hız).
- Her dünyanın 10. bölümü **patron bölümü**: ortada can çubuğu olan büyük bir "kale" tuğlası, etrafında yenilenen kalkan tuğlaları.
- Bölüm verisi dizi olarak yazılır (ör. satır dizeleri `"..11221.."`, harf = tuğla türü), bu sayede 30 bölüm ~150 satırda tanımlanır.

## İlerleme ve geri gelme
- **Yıldızlar (bölüm başına 1-3):** 1 = bölümü bitir; 2 = en fazla 1 can kaybet; 3 = hiç can kaybetme ve bölümün hedef süresinin altında bitir (süre bölüm verisinde).
- **Kilit:** bir sonraki bölüm, öncekini bitirince açılır; yeni dünya için önceki dünyada en az 15 yıldız gerekir.
- **Elmas (💎):** her yıldız 1 elmas, patron bölümü ilk kez +5 elmas, günlük görevler 2-3 elmas verir.
- **Kalıcı yükseltmeler (elmasla, her biri 3-5 seviye):** Raket Genişliği, Başlangıç Canı (3 → 5), Güçlendirme Süresi (+2 sn/seviye), Kapsül Şansı (sürpriz tuğla oranı), Lazer Gücü.
- **Açılan içerik:** dünya geçtikçe yeni raket görünümleri (renk/desen) ve top izleri; 30 bölüm bitince **Sonsuz Mod** açılır (rastgele üretilen sonsuz bölümler, `MiniOyun.rastgele()` ile; skor liderlik tablosuna gider).
- **Günlük görevler (3 adet, tarihten `MiniOyun.rastgele()` ile seçilir):** "Tek bölümde 5x kombo yap", "3 Çoklu Top kapsülü yakala", "Bir bölümü can kaybetmeden bitir" vb.
- Rozet önerisi: "Tuğla Ustası" (30 bölümün hepsini bitir) `js/oyun.js` `BADGES` listesine.
- **Kayıt anahtarı:** `mo_tugla` → `{ bolumler: {"1": yildiz, ...}, elmas, yukseltme: {raket, can, sure, sans, lazer}, acilan: [...], secili: {raket, iz}, sonsuzRekor, gorev: {tarih, liste, tamam} }`. Kayıt bozuksa sıfırdan başlar, hata vermez.
- **İlk gün:** Orman dünyasını bitirir, ilk Raket Genişliği yükseltmesini alır, patronu yener. **İlk hafta:** Çöl ve Uzay'da 3 yıldız peşine düşer, günlük görevleri yapar, Sonsuz Mod'u açar ve rekor kovalar.

## Kontroller
- **Klavye:** Sol/Sağ ok veya A/D raketi hareket ettirir; Boşluk topu fırlatır (Yapışkan Raket'te de) ve lazeri ateşler. `P`/`Esc` çerçevenin duraklatması.
- **Dokunmatik/fare:** Raket parmağın/farenin yatay konumunu takip eder (canvas üzerinde `pointermove`, parmak raketin biraz altındayken de çalışır, böylece parmak raketi kapatmaz); dokunup bırakma topu fırlatır. Lazer dokunmatikte otomatik ateşlenir. Canvas'ta `touch-action: none`.
- Duraklatma: `pause`/`resume`/`canPause` verilir; sekme gizlenince (`visibilitychange`) oyun kendiliğinden duraklar.

## Görsel tasarım
- Canvas mantıksal boyutu 480x640, telefonda genişliğe göre ölçeklenir (360 px'te kaydırmasız). `devicePixelRatio` ile net çizim.
- Koyu arka plan (site teması), dünya başına ince desen: Orman koyu yeşil, Çöl koyu kum, Uzay lacivert + küçük yıldız noktaları.
- Tuğlalar köşeleri yuvarlatılmış dikdörtgen, satır başına canlı renk geçişi; sağlam tuğlalarda çatlak çizgisi, metal gri parlak, patlayan tuğlada 💥, sürprizde ❓ emoji.
- Kapsüller renkli hap şekli ve üstünde harf/emoji (↔️ geniş, ⚪ çoklu, 🐢 yavaş, 🔫 lazer, 🍯 yapışkan).
- Kırılan tuğlada küçük parçacık efekti; `prefers-reduced-motion` açıksa parçacık ve ekran sarsıntısı kapalı.
- Üst bilgi şeridi: bölüm, puan, can (❤️), kombo.
- Bölüm haritası: dünya sekmeleri, her bölüm yuvarlak düğme + yıldızlar, kilitliler soluk; altta "Yükseltmeler" ve "Görevler".
- Simge: `🧱`, kart renkleri `["#fb923c", "#dc2626"]`.

## Sayfa metinleri
- title: `Tuğla Kırma Oyunu - Online Oyna, 30 Bölüm | MiniOyun`
- meta description: `Raketle topu sektir, tuğlaları kır! Ücretsiz tuğla kırma oyunu: 30 bölüm, yıldızlar, güçlendirmeler, yükseltmeler ve sonsuz mod. Telefonda da oynanır.`
- **Nasıl oynanır:** Tuğla Kırma'da ekranın altındaki raketi sağa sola hareket ettirerek topu havada tutar ve üstteki tuğlaları kırarsın. Bilgisayarda ok tuşlarıyla, telefonda parmağını ekranda kaydırarak raketi yönetirsin; topu fırlatmak için Boşluk tuşuna bas veya ekrana dokun. Top raketin ortasına çarparsa dik, kenarlarına çarparsa yatay bir açıyla geri döner. Metal tuğlalar dışındaki bütün tuğlaları kırınca bölüm biter. Topu alttan kaçırırsan bir can kaybedersin, tüm canlar biterse bölümü yeniden denersin. Kırılan bazı tuğlalardan düşen kapsülleri yakalayarak raketini büyütebilir, top sayını artırabilir veya lazer kazanabilirsin. Orman, Çöl ve Uzay dünyalarındaki 30 bölümü geç, her bölümde 3 yıldız topla ve kazandığın elmaslarla raketini kalıcı olarak geliştir.
- **İpuçları:** Topu raketin kenarıyla karşılamak sert açılar verir; tuğla dizilerinin arkasına topu sokmak için bunu kullan, çünkü üst duvar ile tuğlaların arasında seken top tek başına çok sayıda tuğla kırar ve kombo yapar. Çoklu Top kapsülünü alınca raketi en alttaki topa göre konumla. Dar Raket kapsülünden kaçın. İlk elmaslarını Raket Genişliği'ne yatırmak erken bölümleri kolaylaştırır, 3 yıldız için ise Başlangıç Canı en faydalı yükseltmedir. Günlük görevleri her gün tamamlayarak ek elmas kazan.

## Zorluk ve günlük mod
- Zorluk bölüm haritasıyla artar (hız, tuğla türleri, hareketli sıralar, patronlar); ayrıca seçmeli iki seviye yok, bölüm ilerlemesi zorluk artışı sayılır. Liderlik tablosu için `seviye`: kampanyada `'bölüm N'`, sonsuz modda `'sonsuz'`.
- Günlük mod: **uygun**. Sonsuz Mod'un üreticisi tarihe bağlı tohumla (`?gunluk=YYYY-AA-GG`, `MiniOyun.rastgele()`) herkese aynı 3 bölümlük seriyi verebilir; günlük modda kalıcı yükseltmeler devre dışı (herkes eşit şartlarda) ve skor puandır. `games.json` kaydına `"gunluk": true` eklenir. Top fiziğindeki küçük zamanlama farkları sonucu değiştirse de tuğla dizilimi ve kapsül sırası herkes için aynıdır.

## Kabul kriterleri
- [ ] Top raket, duvarlar ve tuğlalardan doğru seker; yüksek hızda tuğlaların içinden geçmez (adım başına çarpışma alt adımlara bölünür).
- [ ] Raketin çarpma noktası çıkış açısını değiştirir; top hiçbir zaman tamamen yatay hale gelip sonsuza dek sekmez (en küçük dikey hız sınırı).
- [ ] 5 tuğla türü ve 5 iyi + 1 kötü kapsül çalışır; Çoklu Top'ta son top düşmeden can gitmez.
- [ ] 30 bölüm, 3 dünya, 3 patron bölümü oynanabilir; kilit ve 15 yıldız dünya koşulu çalışır.
- [ ] Yıldız koşulları (bitirme / en fazla 1 can kaybı / can kaybetmeden ve hedef sürede) doğru hesaplanır, daha iyi sonuç eskiyi geçer, daha kötüsü silmez.
- [ ] Elmas ve 5 yükseltme `mo_tugla` anahtarında kalıcıdır; sayfa yenilenince korunur; bozuk kayıt (ör. `"{bozuk"`) oyunu sıfırdan başlatır, JS hatası vermez.
- [ ] 30 bölüm sonrası Sonsuz Mod açılır; skor `MiniOyun.bitti({ skor })` ile liderlik tablosuna gider.
- [ ] Günlük modda (`?gunluk=2026-10-24`) iki açılışta aynı tuğla dizilimi gelir.
- [ ] Günlük görevler tarihe göre değişir, tamamlanınca elmas verir ve aynı gün tekrar ödül vermez.
- [ ] Klavye ve dokunmatik kontrol çalışır; 360 px genişlikte yatay kaydırma yok; parmak raketi kapatmaz.
- [ ] Duraklatma topu, kapsülleri ve güçlendirme sürelerini durdurur; sekme gizlenince oyun duraklar.
- [ ] Bölüm kazanılınca/kaybedilince `MiniOyun.bitti` penceresi açılır, "Tekrar oyna" bölümü sıfırlar; önemli anlarda `MiniOyun.ses` çağrılır.
- [ ] `tools/tests/tugla-kirma.js`: `page.clock` ile saati ileri sararak 1. bölümü bitirir (test için topu yakalayan raket veya kısa bölüm yeterli), yıldız ve kaydı kontrol eder, günlük mod tohumunu doğrular.
- [ ] `agents/4-gelistirici.md` kalite listesinin tüm maddeleri karşılanır.

durum: bekliyor
slug: drift-ustasi
baslik: Drift Ustası
kategori: Spor
oncelik: 4

## Özet
Tek tuşla arabayı virajlarda drift ettirip yoldan çıkmadan bitiş çizgisine ulaştığın; 40 bölümlük pist haritasında yıldız ve altın topladığın, yeni arabalar açıp motor, lastik ve fren yükselttiğin kuşbakışı tek tuşlu drift yarışı.

## Neden bu oyun
- Son rakip analizi (`reports/rakip-analizi/2026-10-24-02.md`) "Drift Boss / Drive Mad" satırında türün Poki, Coolmath ve CrazyGames'te sürekli üst sıralarda olduğunu, "tek tuşlu, mobil uyumlu, kolay klonlanabilir tür" olduğunu ve sitede hiç olmadığını yazıyor; fırsatlar listesinde 7. sırada. Listedeki ilk altı öneri ya yayında (Harf Çarkı, Top Sıralama, Blok Bulmaca, Olta Ustası) ya da sırada (Kızma Birader, Mahjong).
- "araba oyunları", "drift oyunu", "araba yarışı oyna", "drift oyunları oyna" Türkiye'de oyun aramalarının en büyük kümelerinden biridir; KralOyun gibi Türk siteleri bu aramalar için ayrı "Araba" ve "Drift" kategorileri tutar. Drift genel bir tür adıdır, marka değildir.
- **Kategori dengesi:** `categories.json` ile `games.json` karşılaştırıldığında Spor kategorisinde yalnızca 1 oyun (Penaltı Ligi) var; diğer kategorilerde 2 veya daha fazla oyun var ya da bekleyen fikir var (Hafıza'ya Mahjong, Strateji'ye Kızma Birader). Drift bir motor sporudur ve Spor kategori sayfasında doğal durur; kategori sayfası iki oyuna çıkar.
- ORTAK.md "yükseltmeli arcade" önceliğine uyar: bir bölüm 30-90 saniye, 40 bölüm, açılan arabalar ve kalıcı yükseltmeler günlerce içerik sunar. Fizik motoru gerekmez: araba basit açı/hız modeliyle hareket eder, pist canvas'a çizilir, görsel/ses dosyası yoktur. Tek dosya JavaScript ile 700-1000 satırda yapılabilir.
- Pist, araba ve ad tasarımları özgündür; hiçbir ticari oyunun görseli, pisti veya araba adı kullanılmaz. Gerçek araba markası/modeli adı geçmez.

## Oynanış
- **Görünüm:** Kuşbakışı, kamera arabayı takip eder ve arabanın gittiği yöne doğru hafif önde durur. Pist, düz ve kavisli parçalardan oluşan tek şeritli bir yoldur (kenarları beyaz-kırmızı bordür).
- **Tek tuş kuralı:** Araba sabit hızla ileri gider. Tuş basılıyken araba **sola doğru drift eder** (yönü saniyede `donusHizi` derece döner, arka kayar, lastik izi bırakır); tuş bırakılınca araba düzelir ve o anki yönünde düz gider. Sağa dönen virajlar **ayna parçalarla** çözülür: pist tanımında ayna olan parçaya girildiğinde aynı tuş arabayı sağa drift ettirir ve ekranın üstündeki yön oku bunu gösterir. Böylece kontrol her zaman tek tuştur, oyuncu o an hangi yöne kaydığını oktan okur.
- **Araba modeli (basit, deterministik):** Konum `(x, y)`, yön `a`, hız `v`. Her karede `a += basili ? donus * dt : 0`; hız `v` yön yerine "kayma yönü" `k` ile ilerler ve `k`, `a`'ya `tutus` katsayısıyla yaklaşır (`k += (a - k) * tutus * dt`). Bu kayma, drift hissini verir: tutuş düşükse araba virajda dışa açılır. Drift sırasında hız `%8` düşer, düz yolda `ivme` ile en yüksek hıza döner.
- **Yoldan çıkma:** Arabanın merkezi pist kenarının dışına çıkarsa araba savrulur ve bölüm kaybedilir (`kaybetti: true`). İlk iki dünyada 1 "kurtarma" hakkı vardır (araba son kontrol noktasında, 1 saniyelik dokunulmazlıkla devam eder).
- **Altın ve kombo:** Yol üzerinde 🪙 altınlar durur; arabanın üstünden geçmesi toplar. Drift sırasında aralıksız geçen süre "drift puanı" verir (saniye başı 50, kesintisiz drift arttıkça x2, x3 çarpanı). Bordüre çok yakın drift (yol kenarına 6 px'ten yakın) "Kılpayı!" bonusu +100 verir.
- **Bitiş:** Bitiş çizgisine ulaşınca bölüm biter. Puan = drift puanı + altın × 20 + süre bonusu `max(0, hedefSn - gecenSn) × 30`.
- **Engeller (dünyalara göre açılır):** 🛢️ yağ lekesi (üstünden geçince 1 sn tutuş yarıya iner), 🚧 bariyer (çarparsan kaybedersin), ❄️ buzlu zemin (dünya 3, tutuş düşük), 🔀 dar köprü (yol genişliği yarıya iner), 🚦 hız kapısı (açıkken geçmek +hız; dünya 4).
- **Zorluk artışı:** Virajlar keskinleşir, yol daralır, virajlar arası düzlük kısalır, aynı bölümde sol ve sağ ayna parçalar yer değiştirir (ekrandaki ok değişir, oyuncu uyarılır), hız artar, engeller çoğalır.

## İlerleme ve geri gelme
- **Harita:** 40 bölüm, 4 dünya × 10 bölüm, dikey kayan pist haritası:
  1. 🌳 **Orman Yolu (1-10):** geniş yol, yumuşak virajlar, 1. bölümde 3 adımlık eğitim (bas = drift, bırak = düzel, altın topla).
  2. 🏜️ **Çöl Kanyonu (11-20):** keskin virajlar, yağ lekeleri, bariyerler.
  3. 🏔️ **Karlı Dağ (21-30):** buzlu zemin, dar köprüler, kurtarma hakkı yok.
  4. 🌃 **Gece Şehri (31-40):** en yüksek hız, hız kapıları, sol/sağ ayna değişen parçalar.
  Pistler kodda kısa parça dizileriyle tanımlanır (ör. `"D120 V90 D60 V-45 D80"`: D = düz uzunluk, V = viraj açısı; eksi açı ayna yön). Bölüm = dünya + parça dizisi + hız + engel listesi + hedef süre; böylece 40 pist kısa tutulur.
- **Yıldızlar (bölüm başına 1-3):** 1 ⭐ bitir; 2 ⭐ hedef sürenin altında bitir; 3 ⭐ hedef süre + bölümdeki altınların en az %80'i + kurtarma hakkı kullanmadan. Sonraki dünya, önceki dünyanın 10. bölümü bitince ve toplam yıldız eşiği aşılınca açılır: Çöl 15 ⭐, Karlı Dağ 40 ⭐, Gece Şehri 70 ⭐ (toplam 120 ⭐).
- **Garaj ve yükseltmeler (kalıcı):** Toplanan altın garajda harcanır. Her arabanın 3 yükseltmesi vardır, her biri 5 seviye:
  - 🔧 **Motor:** en yüksek hız +%4 / seviye (hedef süreyi kolaylaştırır),
  - 🛞 **Lastik:** tutuş +%6 / seviye (virajda daha az dışa açılma),
  - 🎯 **Direksiyon:** dönüş hızı +%4 / seviye (keskin virajlar).
  Maliyet: 50, 120, 250, 450, 800 altın. Yükseltmeler oyunu kolaylaştırır ama 3 yıldız için beceri gerekir; yükseltmesiz araba da her bölümü bitirebilir (test bunu doğrular).
- **Açılan arabalar (5 araba, her biri farklı his):** 🚗 Serçe (başlangıç, dengeli); 🚙 Kaya (15 ⭐, yavaş ama tutuşu yüksek); 🏎️ Şimşek (40 ⭐, hızlı ama kaygan); 🚕 Taksi (600 altın, dönüşü keskin); 🚓 Gece Kuşu (Gece Şehri'ni bitirince, en yüksek değerler). Arabalar canvas'ta renkli dikdörtgen gövde + cam + tekerlek olarak çizilir; emoji yalnızca garaj listesinde ikon olarak kullanılır.
- **Boya ve iz renkleri (yalnızca görünüş):** 6 gövde rengi ve 4 lastik izi rengi (beyaz, gökkuşağı, ateş, neon); yıldız eşikleri ve 7 günlük seriyle açılır.
- **Günlük görevler:** Her gün tohumla seçilen 3 görev (ör. "Toplam 20 saniye kesintisiz drift yap", "3 Kılpayı! bonusu al", "2 bölümü kurtarma kullanmadan bitir"); üçü bitince 100 altın + seri sayacı.
- **Kayıt anahtarı:** `mo_drift` → `{ bolumler: { "1": { yildiz, enIyiSn, enIyiPuan }, ... }, altin, arabalar: { serce: { motor, lastik, direksiyon }, ... }, secili, boya, iz, acikBoyalar, gorev: { gun, liste, ilerleme }, seri, sonGun }`. Kayıt bozuksa sıfırdan başlar, hata vermez.
- **İlk gün:** Orman Yolu'nu bitirir, ilk yükseltmeleri alır, Kaya'yı açar. **İlk hafta:** Çöl ve Karlı Dağ'a geçer, Şimşek'i açar, günlük görev serisiyle iz renklerini toplar, eski bölümlere 3 yıldız ve altın için döner. Gece Şehri, 120 yıldız ve tüm arabaları tam yükseltmek uzun vadeli hedef; sonrasında günlük meydan okuma.

## Kontroller
- **Dokunmatik / fare:** Oyun alanının herhangi bir yerine basılı tut = drift, bırak = düzel (`pointerdown` / `pointerup` / `pointercancel`; parmak alandan çıkarsa bırakılmış sayılır). Oyun alanında `touch-action: none` ve uzun basmada metin seçimi/menü engellenir (`user-select: none`, `contextmenu` iptal).
- **Klavye:** Boşluk, ↑ veya ← / → tuşlarından herhangi biri basılı = drift (ayna bölümde de aynı tuşlar; yön ekrandaki oktan okunur). P veya Esc duraklat, R bölümü yeniden başlat. Haritada ok tuşları bölümler arasında gezinir, Enter başlatır. Tuş tekrarı (`e.repeat`) yok sayılır.

## Görsel tasarım
- **Oyun alanı:** Canvas, genişlik ekrana göre (en fazla 480 px), oran 3:4 (dikey); 360 px ekranda 328 × 437 px. `devicePixelRatio` ile keskin çizim.
- **Pist:** asfalt #3f3f46, kenar bordürleri kırmızı-beyaz şerit (#ef4444 / #f8fafc), orta çizgi kesikli sarı (#facc15). Dünya zeminleri: Orman #4ade80 üzerine koyu yeşil ağaç daireleri, Çöl #fcd34d üzerine kaya lekeleri, Karlı Dağ #e0f2fe ve yarı saydam buz parçaları, Gece Şehri #1e1b4b üzerine neon dikdörtgen binalar ve yol kenarında sarı lamba ışıkları.
- **Araba:** 14 × 24 px gövde (seçili boya rengi), koyu cam, 4 siyah tekerlek; drift sırasında arka tekerleklerden geriye solan lastik izi (seçili iz rengi) ve küçük gri duman parçacıkları.
- **Üst şerit:** bölüm adı, süre (hedefin altındaysa yeşil), toplanan altın, drift çarpanı (x2, x3 büyüyen yazı). Ekranın üstünde ortada yön oku (↺ sol / ↻ sağ); ayna değişiminde ok 1 sn parlar.
- **Efektler:** "Kılpayı!" yazısı arabanın üstünde süzülür; yoldan çıkınca araba döner ve ekran 200 ms sarsılır; bitişte damalı bayrak çizgisi ve konfeti.
- **Kart rengi (`games.json`):** `["#f97316", "#b91c1c"]`, ikon `🏎️`.

## Sayfa metinleri
- **title:** Drift Ustası - Ücretsiz Online Drift Oyunu Oyna | MiniOyun
- **meta description:** Tek tuşla drift yap, virajlarda yoldan çıkma! 40 bölümde yıldız topla, yeni arabalar aç, motor ve lastik yükselt. İndirmeden, telefonda hemen oyna.
- **Nasıl oynanır:** Drift Ustası'nda araban kendiliğinden ilerler, sen yalnızca tek bir tuş kullanırsın. Ekrana basılı tuttuğun sürece araba ekranın üstündeki okun gösterdiği yöne doğru kayarak döner; parmağını kaldırınca düzelir ve dümdüz gider. Amaç yoldan çıkmadan bitiş çizgisine ulaşmaktır. Yoldaki altınları topla, virajları uzun ve kesintisiz drift ederek geç; kesintisiz drift puan çarpanını büyütür, bordüre çok yakın geçmek ise Kılpayı bonusu verir. Bölümü bitirmek bir yıldız, hedef sürenin altında bitirmek iki yıldız, ayrıca altınların çoğunu toplayıp kurtarma hakkı kullanmamak üç yıldız kazandırır. Topladığın altınlarla garajda motoru, lastikleri ve direksiyonu yükseltebilir, yıldız biriktirdikçe yeni arabalar açabilirsin.
- **İpuçları:** Virajın başında değil, virajın hemen öncesinde basmaya başla; araba kayarken biraz dışa açılır. Keskin virajlarda kısa kısa basıp bırakmak, tek uzun basıştan daha güvenlidir. Yağ lekelerinden ve buzlu zeminden önce yönünü düzelt, çünkü orada araba daha çok kayar. İlk önce lastik yükseltmesi almak çoğu oyuncu için en büyük farkı yaratır. Gece Şehri'nde ekranın üstündeki ok yön değiştirdiğinde parlar; gözünü bir an ona çevir.
- **Kısa SSS (metinde 3 soru):** "Sağa nasıl dönerim?" (Bazı pist parçaları ayna yöndedir; o parçalarda aynı tuş sağa drift ettirir, üstteki ok bunu gösterir.) / "İlerlemem kaydediliyor mu?" (Evet, yıldızların, altınların ve arabaların bu tarayıcıda otomatik kaydedilir.) / "Günlük pist nedir?" (Her gün herkese aynı pist ve aynı araba verilir, süreni liderlik tablosunda karşılaştırırsın.)
- `.game-desc` toplamı en az 150 kelime olmalı (yukarıdaki metinler yeterli).

## Zorluk ve günlük mod
- **Zorluk:** Bölümlerle artar (viraj keskinliği, yol genişliği, hız, engeller, ayna değişimleri). Liderlik tablosu için `seviye: 'bölüm N'`, günlük modda `'günlük'`.
- **Günlük mod: uygun, `"gunluk": true`.** `?gunluk=YYYY-AA-GG` ile açılınca harita yerine günün pisti gelir: `MiniOyun.rastgele()` tohumuyla 10-14 parçalık bir pist üretilir (viraj açıları ve düzlük uzunlukları tohumdan; üretici ardışık iki virajın toplamını 180°'den küçük tutar ki pist kendi üstüne kapanmasın) ve her oyuncu yükseltmesiz Serçe ile oynar, böylece herkes eşit koşulda yarışır. Kurtarma hakkı yoktur. Skor bitirme süresidir (saniye, 0,1 hassasiyetle; altın toplamak süreyi her biri 0,2 sn azaltır).
- **Rekor türü:** Bölümlü oyunda süre, günlük modla tutarlı olduğu için `games.json` kaydında `"rekor": "sn"`; `MiniOyun.bitti` çağrısında `skor` = süre, `sonuc` ör. `'48,3 sn'`. Bölüm puanı (drift puanı) bölüm sonu penceresinde ve haritada ayrıca gösterilir.

## Kabul kriterleri
- [ ] `games/drift-ustasi/index.html`, `game.js`, `games.json` kaydı (`"category": "Spor"`, `"rekor": "sn"`, `"gunluk": true`) ve `npm run build` çıktısı mevcut; Spor kategori sayfasında 2 oyun görünüyor.
- [ ] Tek tuş kuralı: basılıyken araba bölüm yönüne (sol, ayna parçada sağ) dönüyor, bırakınca düz gidiyor; araba modeli `dt` ile kare hızından bağımsız (30 ve 60 fps'te aynı pistte aynı sonuç).
- [ ] Yoldan çıkma ve bariyere çarpma algılanıyor; kurtarma hakkı ilk iki dünyada bir kez çalışıyor, sonra bölüm kaybediliyor ve `bitti` skorsuz (`kaybetti: true`) çağrılıyor.
- [ ] Altın toplama, drift çarpanı ve Kılpayı bonusu puana ekleniyor; yağ, buz, dar köprü ve hız kapısı tanımlandığı dünyalarda etki ediyor.
- [ ] 40 bölüm, 4 dünya; yıldız koşulları (bitir / hedef süre / %80 altın + kurtarmasız) doğru veriliyor; dünya kilitleri eşiklerle açılıyor.
- [ ] Her bölüm yükseltmesiz Serçe ile bitirilebilir: test, pist parçalarından hesaplanan basit bir otomatik sürücüyle (virajın başında bas, açı tamamlanınca bırak) en az 1., 10., 20., 30. ve 40. bölümü sonuna kadar sürebiliyor.
- [ ] Garaj: 3 yükseltme × 5 seviye, maliyetler altından düşüyor, etkiler araba değerlerine yansıyor; 5 araba eşiklerde açılıyor; boya ve iz renkleri açılıp seçilebiliyor; hepsi `mo_drift` içinde kalıcı.
- [ ] Günlük görevler günlük tohumla seçiliyor, ilerleme kaydediliyor, seri sayacı artıyor.
- [ ] `mo_drift` bozuk JSON içerdiğinde oyun sıfırdan başlıyor, konsolda hata yok.
- [ ] Kontroller: dokunmatik/fare basılı tut-bırak; `pointercancel` ve alan dışına çıkma "bırak" sayılıyor; klavyede Boşluk/↑/←/→ drift, P/Esc duraklat, R yeniden başlat; uzun basmada sayfa kaymıyor, metin seçilmiyor.
- [ ] 360 px genişlikte yatay kaydırma yok, canvas ekrana sığıyor ve keskin çiziliyor.
- [ ] Ortak çerçeve: `MiniOyun.oyun({ restart, pause, resume, canPause, seviye })`; duraklatmada süre ve araba duruyor, girişler yok sayılıyor; sekme gizlenince oyun kendiliğinden duraklıyor; `MiniOyun.ses` altın ('tik'), Kılpayı ('puan'), bitiş ('kazan'), yoldan çıkma ('kaybet') anlarında çalıyor.
- [ ] Günlük modda (`?gunluk=2026-10-24`) iki açılışta aynı pist (aynı parça dizisi ve altın konumları) geliyor ve pist kendi üstüne kapanmıyor.
- [ ] `.game-desc` en az 150 kelime, nasıl oynanır + ipuçları + 3 SSS içeriyor.
- [ ] `tools/tests/drift-ustasi.js`: oyunu açıyor, `page.clock` ile zamanı ilerleterek 1. bölümü otomatik sürücüyle gerçek `pointerdown`/`pointerup` olaylarıyla bitiriyor (`.oyun-sonu[open]`), yıldız ve en iyi sürenin `mo_drift` ve `MiniOyun.getBest` ile kaydını, hiç basmadan sürüldüğünde ilk virajda yoldan çıkıp bölümün kaybedildiğini, altınla bir yükseltme alınıp sayfa yeniden açılınca korunduğunu ve günlük modda aynı pistin geldiğini kontrol ediyor.
- [ ] `agents/4-gelistirici.md` kalite listesinin 9 maddesinin tamamı karşılanıyor.

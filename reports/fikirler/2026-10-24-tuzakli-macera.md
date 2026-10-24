durum: bekliyor
slug: tuzakli-macera
baslik: Tuzaklı Macera
kategori: Arcade
oncelik: 4

## Özet
Küçük bir kahramanı koşturup zıplatarak her bölümde kapıya ulaştırdığın, ama yerin çöktüğü, dikenlerin aniden fırladığı, kapının kaçtığı sürpriz tuzaklarla dolu 60 bölümlük, 5 dünyalı platform macerası; az ölüp hızlı bitirerek yıldız toplar, yıldızlarla yeni dünyalar ve kostümler açarsın.

## Neden bu oyun
- Rakip analizinde (2026-10-24-02) tuzaklı platform türü (Poki ilk 5'teki bölümlü "şeytani tuzak" oyunları) ve Moto X3M benzeri bölümlü oyunlar bizde hiç yok; sitede tek bir platform/zıplama oyunu bulunmuyor.
- Türkiye'de "zıplama oyunları", "platform oyunları", "zor oyunlar", "trol oyunları" aramaları yaygın; kısa, sinir bozucu ama komik bölümler paylaşılmaya çok uygun.
- Arcade kategorisinde yalnızca Yılan ve Tuğla Kırma yayında (Lokanta Telaşı geliştiriliyor); Bulmaca kategorisinde 6 oyun var. Bu fikir Arcade'i güçlendirir.
- Bölüm verisi metin ızgarası olarak tutulduğu için tek dosyada 60 bölüm sığar; harici görsel gerekmez.

## Oynanış
- Yandan görünüşlü, sabit kameralı (bölüm tek ekran, 24x14 karo) platform oyunu. Kahraman sola/sağa koşar, zıplar. Amaç bölümün kapısına (🚪) ulaşmak.
- Fizik: yerçekimi, sabit koşu hızı, değişken zıplama (tuş basılı tutulursa biraz daha yükseğe). Karolarla basit AABB çarpışma. Kenardan düştükten sonra 80 ms "coyote time" ve 100 ms zıplama tamponu (mobilde affedici olsun).
- Ölüm: dikene değmek, ekranın altına düşmek, ezilmek. Ölünce bölüm 0,4 sn içinde aynı yerden yeniden başlar (bekleme ekranı yok); ölüm sayacı artar. Bölüm içinde can sınırı yok, bölüm kaybedilmez; yıldızlar ölüm ve süreye bağlıdır.
- Tuzak türleri (her dünya 1-2 yenisini tanıtır, bölüm verisinde harf olarak):
  - `^` sabit diken, `v` tavandan düşen diken (altından geçince düşer),
  - `C` üstüne basınca 0,3 sn sonra çöken zemin,
  - `H` gizli diken (yaklaşınca fırlar), `G` görünmez blok (çarpınca belirir),
  - `K` kaçan kapı (yaklaşınca bir kez yer değiştirir; ikinci konum bölüm verisinde),
  - `Y` zıplatıcı yay, `M` sağa-sola giden platform, `T` tetikleyici (üstünden geçince belirtilen tuzağı çalıştırır),
  - `A` ters yerçekimi bölgesi (5. dünya).
- Tuzaklar her zaman aynı davranır (rastgele değil): oyuncu bir kez ölüp tuzağı öğrenir, ikinci denemede geçer. Bu türün eğlencesi budur.
- İsteğe bağlı toplanabilir: her bölümde bir 💎 elmas, zor yerde. Bölüm sonu ekranı: süre, ölüm sayısı, elmas.
- Zorluk artışı: 1. dünyada tuzaklar uyarı işaretli ve yalnız; sonraki dünyalarda üst üste binen, zamanlamalı, sahte güvenli bölgeler.

## İlerleme ve geri gelme
- 5 dünya × 12 bölüm = 60 bölüm: Çayır (yeşil), Mağara (kahverengi), Kale (gri), Lav (kızıl), Gökyüzü (mor, ters yerçekimi). Bölüm haritası dünya başına ızgara düğmeler, kilitli bölümler 🔒.
- Yıldızlar (bölüm başına 3): bölümü bitirmek 1 yıldız; ölüm sayısı bölüm verisindeki eşiğin altında (ör. ≤3) 1 yıldız; süre hedefin altında 1 yıldız. Yıldızlar en iyi sonuçtan hesaplanır, tekrar oynanabilir.
- Bir sonraki bölüm, öncekini bitirince açılır. Yeni dünya için hem önceki dünyanın son bölümünü bitirmek hem toplam yıldız eşiği gerekir (12, 30, 50, 75).
- Elmaslarla kostüm dükkânı: kahramanın rengi/şapkası (CSS/canvas çizimi; 🎩 👑 🧢 gibi emojiler başa çizilebilir) ve iz efekti. 8 kostüm, 3-25 elmas.
- Başarımlar ekranı: "Hiç ölmeden bir dünya", "100 ölüm" (komik), "Tüm elmaslar" gibi 8 hedef.
- Hızlı koşu: bir dünyanın 12 bölümünü arka arkaya oynayan zamanlı mod; en iyi süre rekor olarak saklanır (dünya bitirince açılır).
- Kayıt anahtarı: `mo_tuzak` → `{ bolumler: { "1-1": { bitti, enAzOlum, enIyiSure, elmas } }, elmas, kostumler, secili, basarimlar, hizliKosu: { "1": sn } }`. Bozuk kayıtta sıfırdan başlar.
- İlk gün: Çayır'ı bitirip Mağara'yı açar, ilk kostümü alır. İlk hafta: Kale ve Lav dünyaları, kaçırılan yıldızlar ve elmaslar için geri döner, günlük bölüm.

## Kontroller
- Klavye: ←/→ veya A/D koşu, ↑ / W / Boşluk zıplama (basılı tutma daha yükseğe), R bölümü yeniden başlat, P/Esc duraklat.
- Dokunmatik: oyun alanının altında üç büyük düğme (◀ ▶ sol altta, ⤒ sağ altta), `pointerdown/pointerup` ile basılı tutma desteği; çoklu dokunma (koşarken zıplama) çalışmalı. Düğmeler en az 56 px. Sayfa kaydırması oyun alanında engellenir (`touch-action: none`).

## Görsel tasarım
- Canvas, mantıksal 384x224 (16 px karo), CSS ile genişliğe ölçeklenir (`image-rendering: pixelated`), 360 px ekranda ~360x210; düğmeler canvas'ın altında.
- Kahraman: yuvarlatılmış kare gövde, iki göz (yöne bakar), koşarken hafif zıplama animasyonu; kostüm rengi gövdeye uygulanır.
- Karolar düz renk + üstte açık şerit; dikenler üçgen; çöken zemin çatlak çizgili; kapı 🚪 emojisi veya çizimi, elmas 💎.
- Dünya renkleri: Çayır #7bd389 / #2f9e44, Mağara #a47148 / #5c3d2e, Kale #9aa5b1 / #495057, Lav #ff7043 / #b71c1c, Gökyüzü #b39ddb / #5e35b1.
- Ölümde küçük parçacık patlaması ve ekran sarsıntısı (0,2 sn), "Ölüm: 7" sayacı köşede komik ikonla (💀).

## Sayfa metinleri
- title: Tuzaklı Macera - Zor Platform Oyunu Oyna | MiniOyun
- meta description: Sürpriz tuzaklarla dolu 60 bölümlük zıplama oyunu. Çöken zeminleri, kaçan kapıları aş, yıldız ve elmas topla. Ücretsiz, indirmeden oyna.
- Nasıl oynanır: Kahramanını sağa sola koşturup zıplatarak her bölümdeki kapıya ulaştır. Ama dikkat: zemin ayağının altından çökebilir, dikenler birden fırlayabilir, kapı bile senden kaçabilir. Bir tuzağa yakalandığında bölüm hemen baştan başlar; tuzaklar her seferinde aynı çalışır, yani her ölüm sana bir şey öğretir. Bölümü bitirmek bir yıldız, az ölmek ve hızlı bitirmek iki yıldız daha kazandırır. Yıldızlarla yeni dünyaları, elmaslarla yeni kostümleri açarsın. Bilgisayarda yön tuşları ve boşlukla, telefonda ekrandaki düğmelerle oynanır.
- İpuçları: Yeni bir bölüme acele etmeden gir; şüpheli görünen düz zemin genelde bir tuzaktır. Zıplama tuşunu basılı tutarsan daha yükseğe çıkarsın, kısa basarsan alçak zıplarsın. Elmaslar çoğunlukla riskli yerlerdedir, önce bölümü bitirip sonra elmas için geri dönebilirsin. Hızlı koşu modunda bölümleri ezberlemek süreni ciddi kısaltır.
- SSS önerisi: "Bölümü geçemiyorum, ne yapmalıyım?" (tuzaklar sabittir, ölüm yerini hatırla), "Elmaslar ne işe yarar?" (kostüm dükkânı), "İlerlemem kaybolur mu?" (tarayıcıda saklanır).

## Zorluk ve günlük mod
- Zorluk dünyadan dünyaya artar; ek olarak ayarlardan "Rahat mod" (dikene değince bir kez korunma kalkanı, yıldızlarda süre şartı aynı) erişilebilirlik için sunulabilir.
- Günlük mod uygun (`"gunluk": true`): o günün tarihine göre `MiniOyun.rastgele()` ile 6 hazır "parça"dan (bölüm verisindeki 6 sütunluk kesitler kütüphanesi) uzun bir bölüm birleştirilir; herkese aynı bölüm gelir. Skor süre (`"rekor": "sn"`), ölüm başına +5 sn ceza eklenir. Parça kütüphanesinin her birleşimi geçilebilir olmalı (parçalar giriş/çıkış yüksekliği ortak tasarlanır).
- Liderlik tablosu için `seviye` olarak bölüm (`'bölüm 2-5'`) veya `'günlük'` verilir.

## Kabul kriterleri
- 60 bölüm, 5 dünya; her bölüm temel kostümle bitirilebilir. Bölüm verisi `motor.js` gibi ayrı bir dosyada tutulabilir ve oynanış testi bir "bot" giriş dizisiyle (veya bölüm başına kayıtlı tuş dizisiyle) en az ilk 3 bölümü bitirmeli.
- Tuzaklar deterministik: aynı girişle aynı sonuç (sabit adımlı fizik, 60 Hz; `page.clock` ile test edilebilir).
- Ölümde bölüm 0,5 sn içinde yeniden başlar, ölüm sayacı artar; bölüm sonunda `MiniOyun.bitti` penceresi süre, ölüm, yıldızlarla açılır; "Tekrar oyna" bölümü sıfırlar.
- Yıldızlar, açılan bölümler/dünyalar, elmaslar, kostümler `mo_tuzak` anahtarında kalıcı; sayfa yenilenince korunur; bozuk kayıtta oyun hatasız sıfırdan açılır.
- Klavye ve dokunmatik (çoklu dokunma ile koşarken zıplama) çalışır; 360 px genişlikte yatay kaydırma yok, düğmeler oyun alanıyla birlikte ekrana sığar.
- Duraklatma (`pause/resume/canPause`) fizik döngüsünü durdurur; duraklatılmışken giriş yok sayılır.
- `MiniOyun.ses`: zıplama 'tik', elmas 'puan', bölüm sonu 'kazan', ölüm 'kaybet'.
- `.game-desc` en az 150 kelime (nasıl oynanır, ipuçları, SSS).
- `"gunluk": true` ise `?gunluk=2026-10-24` ile iki açılışta aynı bölüm gelir (test kontrol eder).
- Telifli karakter, isim veya bölüm tasarımı kopyalanmaz; tuzak fikirleri türün genel öğeleridir.
- `agents/4-gelistirici.md` kalite listesinin tamamı.

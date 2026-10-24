durum: bekliyor
oyun: yilan
baslik: Yılan Macerası: 24 bölümlük harita, engelli tahtalar, yıldızlar ve açılan yılan desenleri
oncelik: 4
boyut: orta

## Sorun / fırsat
Oyun Playwright ile 1280x800 ve 360x740 genişlikte oynandı. Her iki boyutta da oyun tek bir sonsuz mod: 21x21 boş tahta, tek tür yem (+10 puan), her 50 puanda biraz hızlanma. Kayıtlı tek şey `getBest('yilan')` rekoru; `game.js` içinde hiç `mo_` anahtarı yok, yani oyuncunun birikttirdiği hiçbir ilerleme yok.

Gözlenenler:

1. **Her el aynı.** Tahta hep boş, yem hep aynı; ilk 30 saniyelik açılış her oyunda birebir tekrarlanıyor. Zorluk yalnızca yılanın uzamasından geliyor, oyuncuya "bu sefer farklı bir şey dene" diyen hiçbir hedef yok.
2. **Geri gelme nedeni yok.** Oyun bittiğinde gösterilen tek şey skor. Açılan içerik, bölüm, görev veya yükseltme yok; `agents/ORTAK.md` "Oyun derinliği" bölümünün istediği uzun soluklu katman bu oyunda hiç bulunmuyor. Sitedeki en kısa oyun dosyası (133 satır) ve en sığ oyun bu.
3. **Rakip notu.** Son rakip analizi (`reports/rakip-analizi/2026-10-24-02.md`) yılan türünün rakip sitelerde en üst sıralarda olduğunu ve bizim Yılan'a bir ilerleme katmanı eklenmesini not ediyor. Türün iyi örnekleri oyuncuyu duvar/labirent düzenli bölümler, bölüm hedefleri ve açılan yılan görünümleriyle tutuyor (kopyalanmadan aynı iskelet kurulabilir).

2048 Görev Yolu ve Hafıza Seferi'nde kurulan "klasik mod + bölüm haritası + yıldız + açılan tema" iskeleti Yılan'a da birebir uyar.

## Öneri
Klasik modun yanına **"Macera"** adlı bölüm modu eklenir. Klasik mod, hızı, puanlaması, rekoru, günlük meydan okuması ve liderlik tablosu bugünkü gibi kalır.

**Mod seçimi.** Tahtanın üstünde iki sekme: "Klasik" ve "Macera". Son seçilen mod `mo_yilan.mod` içinde saklanır. Macera seçilince tahta yerine bölüm haritası (24 düğme, 3 dünya başlığı, her düğmede kazanılan yıldızlar) görünür. Bölüm içinde "Yeniden başla" düğmesi o bölümü baştan başlatır, ayrı bir "Harita" düğmesi haritaya döner. Günlük meydan okuma (`?gunluk=`) açıkken sekmeler gizlenir ve her zaman klasik mod oynanır.

**Bölüm hedefi.** Her bölümün tek bir hedefi vardır: "N yem ye". Hedefe ulaşınca bölüm kazanılır (duvara/kendine çarpmak kaybettirir, yıldız vermez). Yıldızlar bitirme süresine göre: bitirmek 1 yıldız, süre eşiklerini tutmak 2 veya 3 yıldız. Ekranda "Yem: 7/15" ve geçen süre gösterilir. Bir bölüm, önceki bölümden en az 1 yıldız alınınca açılır.

**3 dünya × 8 bölüm.** Tahta 21x21 kalır; değişen engeller, hız ve yem hedefi:

| Dünya | Bölümler | Engeller | Hız (ms/adım) | Yem hedefi |
|---|---|---|---|---|
| 1 Bahçe | 1-8 | Bölüm 1 boş; sonra ortada tek blok, köşe blokları, iki yatay çit, artı şekli | 140 → 120 | 8 → 15 |
| 2 Mağara | 9-16 | Labirent benzeri duvar parçaları, dar koridorlar; 13. bölümden itibaren kenarlardan karşıya geçiş (duvarsız kenar) açık | 120 → 100 | 12 → 20 |
| 3 Yanardağ | 17-24 | Yoğun duvar düzenleri + her 5 yemde bir 3 hücrelik "lav" engeli rastgele boş yere eklenir (bölüm sonuna kadar kalır) | 100 → 80 | 15 → 25 |

Bölüm düzenleri `game.js` içinde dizgi haritası olarak tutulur (`#` duvar, `.` boş), harici dosya gerekmez. Başlangıç noktası ve ilk 3 hücrelik yön her düzende boş olmalı; yem engelin veya yılanın üstüne düşmez (mevcut `placeFood` engelleri de dışarıda bırakacak şekilde genişletilir). Yem yerleşimi `MiniOyun.rastgele()` ile kalır.

**Özel yemler (yalnızca Macera, 2. dünyadan itibaren).** Eğlence ve karar anı katar:
- ⭐ **Altın yem:** 6 saniye sonra kaybolur; yenirse hedef sayacı +2 ilerler.
- 🧊 **Buz yemi:** yenince 5 saniye boyunca hız %30 yavaşlar.
Her normal yemden sonra %15 olasılıkla bunlardan biri ayrıca çıkar. Hepsi canvas üzerinde renkli şekil/emoji olarak çizilir.

**Açılan yılan desenleri.** Toplam yıldızla açılır, yalnızca renk değişir (klasik modda da kullanılabilir, puanı etkilemez):
- Başlangıç: **Nane** (bugünkü yeşil gövde, turuncu baş)
- 12 yıldız: **Gökkuşağı** (her hücre sırayla renk değiştirir)
- 30 yıldız: **Mercan** (pembe-turuncu çizgili)
- 50 yıldız: **Gece** (lacivert gövde, parlayan sarı göz)
- 72 yıldız (hepsi): **Altın**
Desen seçimi haritanın altında küçük örnek kutularıyla yapılır, seçim `mo_yilan.desen` içinde saklanır.

**Kayıt.** `mo_yilan = { mod, desen, yildiz: { "1": 3, ... } }`. Kayıt bozuksa sıfırdan başlar, hata vermez. Klasik rekor anahtarı (`getBest('yilan')`) değişmez.

**Oyun sonu ekranı.** Macera bölüm sonunda `MiniOyun.bitti` çağrısı `skor` olmadan yapılır (liderlik tablosuna klasik skorlar dışında bir şey gitmesin), metinde kazanılan yıldızlar ve bir sonraki hedef yazar: "2 ⭐ — 3 yıldız için 45 sn altında bitir" ya da "Sonraki bölüm açıldı". Kazanılınca "Sonraki bölüm", kaybedilince "Tekrar dene" düğmesi öne çıkar. Yeni desen açıldıysa ayrıca "Yeni desen açıldı: Gökkuşağı" satırı gösterilir.

**Rozet.** `js/oyun.js` rozet listesine bir rozet: **Yılan Terbiyecisi** (Macera'nın 24 bölümünün hepsini en az 1 yıldızla bitir).

Sayfa metnine ("Nasıl oynanır" / SSS) Macera modunu anlatan kısa bir paragraf eklenir.

## Kabul kriterleri
- Klasik mod bugünkü gibi çalışır; rekoru, günlük meydan okuma ve liderlik tablosu değişmez. Mevcut `tools/tests/yilan.js` adımları geçmeye devam eder.
- "Macera" sekmesi 24 bölümlük haritayı gösterir; başta yalnızca 1. bölüm açıktır.
- Bölümün yem hedefine ulaşınca bölüm kazanılır, yıldız verilir, bir sonraki bölüm açılır ve sonuç `mo_yilan` içine yazılır; sayfa yenilenince yıldızlar korunur.
- Engellere çarpmak oyunu bitirir; yem hiçbir zaman engel, lav veya yılan üzerinde çıkmaz. Her bölüm düzeninde başlangıç noktası ve önündeki 3 hücre boştur (test bunu 24 düzen için statik olarak kontrol eder).
- 13-16. bölümlerde kenarlardan karşıya geçiş çalışır; diğer bölümlerde kenar duvardır.
- Altın yem süresi dolunca kaybolur; buz yemi hızı geçici olarak düşürür ve süre bitince eski hıza döner. Duraklatma bu süreleri durdurur.
- Yıldız eşiklerine göre desenler açılır; seçilen desen yılanın çiziminde kullanılır ve sayfa yenilense de korunur.
- `mo_yilan` bozuk JSON içerirken sayfa hatasız açılır ve sıfırdan başlar.
- Macera bölüm sonunda liderlik tablosuna skor gönderilmez.
- 360 px genişlikte sekmeler, harita (24 düğme taşmadan sarılır) ve desen seçici yatay kaydırma olmadan sığar; dokunmatik yön düğmeleri ve kaydırma Macera'da da çalışır.
- Oynanış testine (`tools/tests/yilan.js`) eklenecek kontroller: Macera sekmesine geç, 1. bölümü `page.clock` ve yem yönünde dönen basit bir botla bitir, yıldızın ve 2. bölümün açıldığını kontrol et; 2. bölümde bir engele bilerek çarpıp bölümün kaybedildiğini doğrula; `mo_yilan` içine 12 yıldız yazıp sayfayı yenile ve Gökkuşağı deseninin seçilebilir olduğunu kontrol et; bozuk `mo_yilan` ile sayfanın hatasız açıldığını kontrol et.

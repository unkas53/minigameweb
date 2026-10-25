durum: bekliyor
oyun: sudoku
baslik: Sudoku Yolu: tekniğe göre derecelenmiş 40 bölümlük kampanya, yıldızlar ve açılan tahta temaları
oncelik: 4
boyut: orta

## Sorun / fırsat
Oyun Playwright ile 1280x900 ve 360x740 genişlikte oynandı (tahta 450 px / 330 px, yatay kaydırma yok, JS hatası yok). Kolay bulmaca çözüldüğünde "Tebrikler" penceresi ve süre rekoru çıkıyor; oyunun sunduğu her şey bu. Gözlenenler:

1. **Geri gelme nedeni yok.** Kalıcı ilerleme yalnızca zorluk başına bir süre rekoru (`sudoku-en-iyi-<seviye>`). Bölüm, yıldız, açılan içerik veya hedef yok; `agents/ORTAK.md` "Oyun derinliği" katmanı bu oyunda eksik. Bitiş penceresi oyuncuya "sıradaki hedef" göstermiyor, yalnızca başka bir oyun öneriyor.
2. **Zorluk yalnızca ipucu sayısına bağlı.** `generate()` kareleri tek çözüm korunduğu sürece boşaltıyor ve 40-45 / 32-36 / 26-30 hedefinde duruyor. Aynı ipucu sayısında bir bulmaca yalnızca "tek aday" ile çözülürken bir diğeri çift aday veya deneme-yanılma isteyebiliyor. Oyuncu "Orta"da bazen 4 dakikada bitiriyor, bazen takılıp bırakıyor; zorluk tutarsız hissediliyor.
3. **Öğrenme eğrisi yok.** Yeni başlayan için "Zor"a geçmek büyük bir sıçrama; hangi tekniği bilmesi gerektiğini oyun hiçbir yerde söylemiyor. Türün iyi örnekleri bulmacaları kullanılan tekniğe göre derecelendirip oyuncuyu adım adım ilerletiyor.

## Öneri
Mevcut serbest oyunun yanına **"Sudoku Yolu"** adlı bir kampanya modu eklenir. Mod seçimi oyun alanının üstünde iki sekmeli bir düğmeyle yapılır: `Serbest` (bugünkü oyun, hiç değişmez) ve `Sudoku Yolu`.

**Teknik derecelendirici (motor):**
- `game.js` içine (veya ayrı `motor.js`) insan tekniğiyle adım adım çözen küçük bir çözücü eklenir. Teknikler sırayla: (1) tek aday (naked single), (2) gizli tek (hidden single), (3) kilitli aday / pointing (kutudaki aday bir satır/sütunda kilitli), (4) çift aday ve gizli çift (naked/hidden pair).
- Çözücü bir bulmacayı yalnızca bu tekniklerle çözebiliyorsa, kullandığı en zor tekniği döndürür; çözemiyorsa bulmaca kampanyada kullanılmaz (deneme-yanılma gerektirmez).

**Bölümler (40 bölüm, 4 bölge × 10):**
| Bölge | En zor teknik | İpucu aralığı |
|---|---|---|
| 1. Bahçe | Tek aday | 38-45 |
| 2. Çarşı | Gizli tek | 32-37 |
| 3. Kale | Kilitli aday | 28-32 |
| 4. Zirve | Çift aday / gizli çift | 24-29 |
- Her bölüm sabit bir tohumla üretilir (`seeded('sudoku-yol-' + n)`), böylece aynı bölüm herkes için ve her açılışta aynıdır. Tohumlar, üretilen bulmacanın bölgenin tekniğini **gerektirdiği** (bir önceki bölgenin teknikleriyle çözülemediği) ve bölge tekniğinin üstüne çıkmadığı değerler olarak önceden seçilip motorda bir tabloda tutulur (Blok Bulmaca ve Meyve Patlat'taki ayarlı tohum tabloları gibi). Bu, sayfa açılışında yavaş üretim döngüsünü önler.
- Her bölgenin ilk bölümünden önce o bölgenin tekniğini anlatan 2-3 cümlelik kısa bir tanıtım kartı gösterilir (DOM metni, çevrilebilir). Kart "Anladım" ile kapanır ve bir kez görülür.

**Yıldızlar:** 1 yıldız: çözüldü. 2 yıldız: en fazla 1 hata ve ipucu kullanılmadı. 3 yıldız: 2 yıldız şartı + bölgenin hedef süresinin altında (ör. Bahçe 5 dk, Çarşı 8 dk, Kale 12 dk, Zirve 15 dk; 8. ajan oynanış testinde makul bulursa ayarlayabilir). Kampanyada 3 hata hakkı ve 3 ipucu serbest modla aynı kalır.

**Harita ve açılma:** Bölüm seçimi 10'lu ızgaralar halinde bölge başlıklarıyla gösterilir; kilitli bölümde kilit, geçilende yıldızlar görünür. Bir bölüm, öncekinin çözülmesiyle açılır; bir sonraki bölge, önceki bölgede 20 yıldız toplayınca açılır.

**Açılan tahta temaları:** Toplam yıldız 15 / 45 / 90'da sırasıyla "Kâğıt", "Gece mavisi", "Altın" tahta temaları açılır (yalnızca CSS renk değişkenleri; harici görsel yok). Tema, her iki modda da kullanılabilir ve seçimi kaydedilir. Renk körlüğü için temalarda yanlış rakam yalnızca kırmızı değil, altı çizili de gösterilir.

**Bitiş penceresi:** Kampanyada kazanınca `MiniOyun.bitti` metni kazanılan yıldızları ve bir sonraki hedefi gösterir ("Sonraki bölüm: 14" veya "3. yıldız için 8:00 altına in"); "Sonraki bölüm" düğmesi eklenir.

**Kayıt ve mevcut veriler:**
- Kampanya ilerlemesi tek anahtarda: `mo_sudoku` → `{ v:1, yildiz:{"1":3,...}, tanitim:[1,2], tema:"klasik", devam:{bolum, vals, notes, mistakes, seconds, hints} }`. Bozuk kayıtta kampanya sıfırdan başlar, hata vermez.
- `sudoku-kayit` (serbest mod devam kaydı) ve `sudoku-en-iyi-kolay/orta/zor` rekorları aynen kalır ve yalnızca serbest modda yazılır; kampanya süreleri bu rekorları etkilemez (profil sayfası bozulmaz).
- Günlük mod (`?gunluk=`) değişmez: kampanya sekmesi günlük modda gizlenir, liderlik tablosuna yalnızca serbest/günlük skorlar gider.
- İsteğe bağlı rozet: 40 bölümün tamamı çözülünce `sudoku-ustasi` rozeti (diğer kampanyalı oyunlardaki rozet deseniyle).

## Kabul kriterleri
- Serbest mod, günlük mod, `sudoku-kayit` devam etme ve `sudoku-en-iyi-*` rekorları önceki gibi çalışır.
- `Sudoku Yolu` sekmesi 40 bölümlük haritayı açar; ilk açılışta yalnızca 1. bölüm açık, 2-4. bölgeler kilitli.
- Aynı bölüm iki ayrı yüklemede birebir aynı bulmacayı verir; her bölümün bulmacası tek çözümlüdür.
- Motorun derecelendiricisi her bölüm için bölge tekniğini döndürür: 1. bölge bulmacaları yalnızca tek adayla çözülür; 2-4. bölge bulmacaları bir önceki bölgenin teknikleriyle **çözülemez** ama kendi bölgesinin teknikleriyle çözülür. (Oynanış testi 40 tohumun tamamını motorla doğrular; birkaç saniyeyi geçmemeli.)
- Yıldız kuralları uygulanır: hatasız ve ipuçsuz hızlı çözüm 3, 1 hata 2, ipucu kullanılan çözüm 1 yıldız verir; en iyi yıldız sayısı korunur (daha kötü sonuç düşürmez).
- Bölge açılma eşiği (20 yıldız) ve tema eşikleri (15/45/90) çalışır; tema seçimi yeniden yüklemede korunur ve iki modda da uygulanır.
- Kampanya bölümünün yarısında sayfa yenilenince bölüm kaldığı yerden devam eder.
- `mo_sudoku` içine geçersiz JSON yazılınca sayfa hatasız açılır ve kampanya sıfırdan başlar.
- Teknik tanıtım kartı her bölgenin ilk girişinde bir kez gösterilir; metinleri DOM'dadır.
- 360 px genişlikte bölüm haritası ve sekmeler yatay kaydırma yapmaz; bölüm düğmeleri en az 40 px dokunma alanına sahiptir.
- `tools/tests/sudoku.js` genişletilir: kampanya sekmesine geç, 1. bölümü `mo_sudoku`/sayfa durumundan okunan çözümle hatasız çöz, 3 yıldız ve 2. bölümün açıldığını doğrula; bozuk kayıt senaryosu; 40 tohumun derecelendirici kontrolü; serbest modun rekor anahtarının kampanya çözümüyle değişmediği kontrolü.

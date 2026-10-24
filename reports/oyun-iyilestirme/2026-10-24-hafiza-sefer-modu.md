durum: bekliyor
oyun: hafiza
baslik: Hafıza Seferi: 12 bölümlük kampanya, yıldızlar ve açılan kart temaları
oncelik: 4
boyut: orta

## Sorun / fırsat
Oyun Playwright ile 1280x900 ve 360x740 genişlikte baştan sona oynandı. Her iki boyutta da tahta aynı: 4x4, 8 eş ve her zaman aynı 8 emoji (🍎 🚀 🐱 ⚽ 🎸 🌵 🍕 💎). Tek fark kartların karışma düzeni.

İki somut sorun görüldü:

1. **Rekorun tavanı var.** Rekor birimi "hamle" ve az olan iyi. 8 eşi hiç yanlış açmadan bulmak 8 hamle demek, yani kusursuz oyun mümkün ve testte ilk denemede `mo_best_hafiza=8` yazıldı. Oyuncu bir kez 8'e ulaştıktan sonra bir daha asla kendi rekorunu geçemez; "en iyi 8 hamle" alanı ölü bir alana dönüşür. Liderlik tablosunda da herkes 8'de eşitlenir, sıralama anlamsızlaşır.
2. **Geri gelme nedeni yok.** Bir oyun bitti ekranına kadar 1-2 dakika sürüyor, sonrasında oyuncuyu bekleyen yeni hiçbir şey yok: açılan içerik, zorlaşan tahta, hedef ya da ilerleme yok. `agents/ORTAK.md` "Oyun derinliği" bölümünün istediği uzun soluklu katman bu oyunda hiç yok; oyun tek oturumda bırakılıp gidiliyor.

Kule Savunması'nda bölüm haritası + yıldız + açılan içerik üçlüsünün işe yaradığı görülüyor; aynı iskelet hafızada da kurulabilir ve türün iyi örneklerinin (bölümlü eşleştirme oyunları) oyuncuyu tuttuğu yer de tam burası: tahta büyüdükçe artan zorluk ve toplanan yıldızla açılan kart desteleri.

## Öneri
Oyuna, klasik modun yanına **"Sefer"** adlı bir kampanya modu eklenir. Klasik mod ve mevcut rekor olduğu gibi kalır.

**Mod seçimi.** Oyun açılışta iki düğme gösterir: "Klasik 4x4" ve "Sefer". Sefer seçilince bölüm haritası çizilir, klasik seçilince bugünkü oyun aynen bugünkü gibi çalışır. Son seçilen mod `mo_hafiza.mod` içinde saklanır, oyuncu sayfaya dönünce aynı moda girer. Üstteki "Yeni oyun" düğmesi Sefer modunda o bölümü baştan başlatır; haritaya dönmek için ayrı bir "Harita" düğmesi bulunur.

**12 bölüm.** Tahta ve eş sayısı kademeli büyür:

| Bölüm | Tahta | Eş | 3 yıldız | 2 yıldız |
|---|---|---|---|---|
| 1-2 | 4x4 | 8 | ≤12 hamle | ≤16 |
| 3-4 | 4x5 | 10 | ≤15 | ≤20 |
| 5-6 | 4x6 | 12 | ≤18 | ≤24 |
| 7-8 | 5x6 | 15 | ≤23 | ≤30 |
| 9-10 | 6x6 | 18 | ≤27 | ≤36 |
| 11 | 6x6 + süre | 18 | ≤27 ve ≤90 sn | bitirmek ≤120 sn |
| 12 | 6x6 + süre | 18 | ≤27 ve ≤75 sn | bitirmek ≤100 sn |

Bölümü bitirmek 1 yıldız; hamle eşiklerini tutmak 2 veya 3 yıldız. 11 ve 12. bölümde ekranda geri sayan bir süre bulunur; süre biterse bölüm kaybedilir ve yıldız verilmez ("Süre doldu, tekrar dene"). Diğer bölümlerde süre bugün olduğu gibi yalnızca sayar, kaybetme yoktur. Bir bölüm, önceki bölümden en az 1 yıldız alınınca açılır.

**Açılan kart temaları.** Toplanan yıldızla emoji desteleri açılır; hepsi emoji olduğu için yeni dosya gerekmez:
- Başlangıç: **Karışık** (bugünkü 8 emoji; 8'den fazla eş gereken bölümlerde desteden sırayla devam edilir)
- 10 yıldız: **Meyve** (🍎🍌🍇🍓🍉🍒🥝🍑🍍🥭🫐🥑🍋🥥🍈🍏🍐🍊)
- 20 yıldız: **Uzay** (🚀🪐🌕🌍☄️🛸🌟🔭👽🛰️🌌⭐🌑🌞💫🌠🧑‍🚀🌛)
- 30 yıldız: **Hayvan** (🐱🐶🦊🐼🐨🐯🦁🐸🐵🐧🦉🐙🦋🐢🦀🐝🐬🦄)

Her destede en az 18 emoji bulunur, böylece 6x6 tahta da tek desteyle dolar. Açık temalar haritanın altındaki şeritten seçilir; seçim klasik modda da geçerlidir ve `mo_hafiza.tema` içinde saklanır. Kilitli tema soluk görünür ve "20 yıldızda açılır" yazar.

**Harita ekranı.** Bölümler 12 kutuluk bir ızgara (masaüstü 4 sütun, 360 px'te 3 sütun) halinde çizilir. Her kutuda bölüm numarası, tahta ölçüsü ve kazanılan yıldızlar (☆☆☆ / ★★☆) görünür; kilitli bölüm 🔒 gösterir ve tıklanmaz. Üstte "Yıldız: 14/36" sayacı bulunur. 12. bölüm 3 yıldızla bitince "Sefer tamamlandı" penceresi çıkar ve tüm bölümler serbest tekrar oynanabilir kalır.

**Kayıt.** Tek anahtar: `mo_hafiza` = `{"mod":"sefer","bolum":7,"yildiz":{"1":3,"2":2,...},"temalar":["meyve"],"tema":"meyve"}`. JSON bozuksa oyun sessizce sıfırdan başlar (`mo_kule` okumasındaki `try/catch` düzeni). Bir bölümün yıldızı yalnızca artar, azalmaz.

**Mevcut rekor, günlük mod ve liderlik tablosu.**
- `mo_best_hafiza` yalnızca klasik 4x4 modunda yazılır; `games.json` içindeki `"rekor": "hamle"` değişmez. Sefer modunda `MiniOyun.setBest('hafiza', ...)` **çağrılmaz**, böylece bugünkü rekorlar ne geçersiz olur ne de 18 eşli bölümün hamlesiyle bozulur.
- Günlük mod (`?gunluk=YYYY-AA-GG`, `games.json`'da `"gunluk": true`) her zaman klasik 4x4 olarak açılır; mod seçimi ve harita günlük modda gösterilmez. Günlük tahta bugün olduğu gibi `MiniOyun.rastgele()` ile karılır ve günlük modda tema her zaman Karışık'tır, yani aynı günü oynayan herkes aynı tahtayı görür.
- Sefer bölümleri liderlik tablosuna `MiniOyun.oyun({ seviye: ... })` kancasıyla bölüm başına ayrı gönderilir (`seviye: "bolum-7"`), klasik mod bugünkü seviyesinde kalır. Böylece 8 hamlede eşitlenen tek tablo yerine her bölümün kendi tablosu olur.
- Kampanyada da her bölüm `MiniOyun.rastgele()` üretecini kullanır.

## Kabul kriterleri
- [ ] Açılışta mod seçimi görünür; "Klasik 4x4" bugünkü oyunla birebir aynı davranır (16 kart, hamle/süre/en iyi alanları, `mo_best_hafiza` yazımı, bitti penceresi ve paylaşım metni değişmez).
- [ ] `?gunluk=` ile açıldığında harita ve mod seçimi hiç çıkmaz, oyun doğrudan klasik 4x4 başlar ve tema Karışık olur; aynı tarih aynı tahtayı verir.
- [ ] Sefer modunda 12 bölüm, tablodaki tahta ölçüleri ve eş sayılarıyla kurulur; kart sayısı her zaman çifttir ve tahtada her emojiden tam iki tane bulunur.
- [ ] Kilitli bölüme tıklamak oyun başlatmaz; önceki bölümden 1 yıldız alınınca açılır.
- [ ] Yıldız eşikleri tablodaki gibi hesaplanır; 11 ve 12. bölümde süre dolunca bölüm kaybedilir, yıldız yazılmaz ve kayıttaki eski yıldız silinmez.
- [ ] İlerleme `mo_hafiza` anahtarında tutulur; `localStorage.setItem('mo_hafiza','bozuk')` sonrası sayfa hata vermeden 1. bölümden açılır.
- [ ] Temalar 10/20/30 yıldızda açılır, kilitli tema seçilemez ve açılma koşulunu yazar; seçilen tema klasik modda da kullanılır ve sayfa yenilenince korunur.
- [ ] Sefer modunda `mo_best_hafiza` değeri hiç değişmez (18 eşli bölüm bitirildikten sonra da aynı kalır).
- [ ] 360x740'ta harita ve 6x6 tahta yatay taşma yapmaz (`scrollWidth = innerWidth`); kart kenarı en az 40 px olur ve dokunarak oynanır.
- [ ] Duraklatma, ses, "nasıl oynanır" penceresi ve reklam alanları her iki modda da çalışır; `MiniOyun.duraklatildi()` sırasında kart açılmaz.
- [ ] Oyun sayfası açıklama metni (nasıl oynanır / ipuçları) Sefer modunu, yıldızları ve temaları anlatacak şekilde genişletilir.
- [ ] `tools/tests/hafiza.js` oynanış testine eklenir: (1) klasik mod baştan sona oynanıp `mo_best_hafiza` yazıldığı doğrulanır; (2) Sefer 1. bölüm oynanıp yıldız ve `mo_hafiza.bolum` kaydı doğrulanır; (3) 2. bölümün açıldığı, 3. bölümün kilitli kaldığı doğrulanır; (4) 30 yıldızlık kayıt elle yazılıp Hayvan temasının seçilebildiği doğrulanır; (5) bozuk `mo_hafiza` kaydıyla sayfanın hatasız açıldığı doğrulanır.
- [ ] `npm run build` ve `node tools/smoke-test.js` hatasız geçer.

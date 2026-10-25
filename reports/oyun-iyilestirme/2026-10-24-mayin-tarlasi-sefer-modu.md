durum: uygulaniyor
oyun: mayin-tarlasi
baslik: Mayın Seferi: 30 bölümlük kampanya, tahmin gerektirmeyen tahtalar, yıldızlar ve açılan temalar
oncelik: 4
boyut: orta

## Sorun / fırsat
Oyun Playwright ile 1280x800 ve 360x800 genişlikte oynandı. Her iki boyutta da oyun hatasız açılıyor; ilk tıklama güvenli, taşma (flood fill) çalışıyor, 360 px'te kare 36 px ve yatay kaydırma yok. Oynanış tarafında üç fırsat görüldü:

1. **Geri gelme nedeni yok.** Oyunun tamamı üç sabit zorluk (9x9/10, 12x12/24, 16x16/45) ve her zorluk için bir süre rekoru. Kalıcı ilerleme, açılan içerik, bölüm veya görev yok; `agents/ORTAK.md` "Oyun derinliği" bölümünün istediği uzun soluklu katman bu oyunda hiç yok. Kolay tahta 1-2 dakikada bitiyor ve oyuncuyu bekleyen yeni bir şey kalmıyor.
2. **Şansa kalan kayıplar.** Mayınlar ilk tıklamadan sonra tamamen rastgele yerleşiyor; özellikle Orta ve Zor'da oyunun sonunda mantıkla çözülemeyen 50/50 durumları çıkıyor. Oyuncu doğru oynadığı hâlde kaybedince bunu haksızlık olarak algılıyor ve bırakıyor. Türün iyi örnekleri bu yüzden "tahmin gerektirmeyen" (no-guess) tahta üretimini öne çıkarıyor.
3. **Tahta hep kare ve düz.** Görsel çeşitlilik yok; aynı tahta boyutu her oyunda aynı his veriyor.

Sitedeki derin oyunlarda (Kule Savunması, Mahjong, Meyve Patlat) bölüm haritası + yıldız + açılan içerik iskeleti kullanılıyor; Mayın Tarlası bu iskelete en kolay uyan klasik oyunlardan biri.

## Öneri
Klasik modun yanına **"Sefer"** adlı bir kampanya modu eklenir. Klasik mod, üç zorluk ve mevcut `mayin-tarlasi-en-iyi-<seviye>` rekor anahtarları olduğu gibi kalır.

**Mod seçimi.** Zorluk seçicisinin yanında "Klasik / Sefer" iki düğmesi bulunur. Sefer seçilince bölüm haritası (DOM'da düğme ızgarası, her düğmede bölüm no ve yıldızlar) gösterilir. Son seçilen mod kayıtta tutulur. Sefer'de "Harita" düğmesi haritaya döner; yüz düğmesi (🙂) o bölümü baştan başlatır.

**Tahmin gerektirmeyen tahtalar.** Sefer tahtaları ilk tıklamadan sonra, `MiniOyun.rastgele` ile tohumlanmış üreteçle oluşturulur ve basit bir çözücüyle denetlenir: (a) bir sayının kalan kapalı komşu sayısı kalan mayın sayısına eşitse hepsi mayındır, (b) bayrak sayısı tamamsa kalanlar güvenlidir, (c) iki komşu sayının kapalı kare kümelerinden biri diğerini kapsıyorsa fark kümesi için aynı iki kural (alt küme kuralı). Çözücü ilk tıklamadan başlayıp tahtayı sonuna kadar açamıyorsa mayınlar yeniden yerleştirilir (en fazla ~200 deneme; olmazsa son deneme kullanılır, sonsuz döngü olmaz). Böylece Sefer'de kayıp her zaman oyuncunun hatasıdır.

**30 bölüm, 3 bölge.** Bölgeler tahta biçimiyle ayrışır; biçim, tahtadaki "kapalı" (oynanmayan, boş görünen) kareleri tanımlayan bir maske dizisidir, ayrı görsel gerekmez.

| Bölge | Bölümler | Tahta | Mayın yoğunluğu | Biçimler |
|---|---|---|---|---|
| Çayır | 1-10 | 8x8 → 10x10 | %12 → %15 | kare, artı, elmas, çerçeve |
| Kanyon | 11-20 | 10x10 → 12x12 | %15 → %18 | ortası delik, iki ada, L, merdiven |
| Volkan | 21-30 | 12x12 → 14x14 | %18 → %20 | yıldız, labirent koridorları, kalp, halka |

360 px'te kare en az 24 px kalmalı (14 sütunda tahta ~340 px); gerekirse Volkan bölgesi en fazla 13 sütun olarak ayarlanır.

**Yıldızlar.** Bölümü temizlemek 1 yıldız; bölümün süre hedefinin altında bitirmek +1; **hiç yanlış bayrak koymadan** bitirmek +1 (yanlış bayrak = sonradan kaldırılsa bile mayın olmayan kareye konmuş bayrak). Süre hedefi bölüm tablosunda tanımlanır ve oyun içinde gösterilir ("⭐ hedef: 60 sn"). Bir bölüm, önceki bölümden en az 1 yıldız alınınca açılır. Bölüm sonu penceresinde kazanılan yıldızlar ve eksik kalan yıldızın koşulu ("Yanlış bayrak koymadan bitir") yazılır, "Sonraki bölüm" düğmesi bulunur.

**Açılan temalar.** Toplanan yıldızla tahta temaları açılır (yalnızca CSS renkleri ve emoji, dosya gerekmez):
- Başlangıç: **Klasik** (bugünkü görünüm, 💣 ve 🚩)
- 15 yıldız: **Çöl** (kum tonları, mayın 🦂, bayrak 🌵)
- 35 yıldız: **Deniz** (mavi tonlar, mayın 🐡, bayrak ⚓)
- 60 yıldız: **Uzay** (koyu mor, mayın ☄️, bayrak 🛸)
Temalar klasik modda da seçilebilir; sayıların renkleri her temada yeterli kontrastla tanımlanır (renk körlüğü için sayılar zaten rakamla okunur).

**Kalıcı ilerleme.** Yeni anahtar `mo_mayin`: `{ mod, bolumler: {<no>: {yildiz, enIyiSn}}, tema, acikTemalar }`. Kayıt bozuksa sıfırdan başlanır, hata verilmez. Klasik moddaki rekor anahtarlarına dokunulmaz.

**Rekor, günlük mod ve liderlik.** `MiniOyun.bitti` klasik modda bugünkü gibi çağrılır; liderlik tablosu yalnızca klasik moddan beslenir. Sefer'de `bitti` yerine bölüm sonu penceresi kullanılır (veya `rekor` göndermeden çağrılır), böylece mevcut süre rekorları ve liderlik sıralaması etkilenmez. Toplam Sefer yıldızı "⭐ 42/90" olarak harita üstünde gösterilir.

## Kabul kriterleri
- Klasik mod ve üç zorluk eskisi gibi çalışır; `mayin-tarlasi-en-iyi-*` anahtarları değişmez, liderlik tablosu yalnızca klasik moddan beslenir.
- "Sefer" seçilince 30 bölümlük harita görünür; başta yalnızca 1. bölüm açıktır, bir bölümden en az 1 yıldız almak sonrakini açar.
- Sefer tahtaları çözücü denetiminden geçer: her bölüm için ilk tıklamadan itibaren çözücü tahtayı tahmin yapmadan bitirebilir (test bunu en az 10 bölüm için doğrular). Üretim tohumludur ve bir tahta en fazla ~200 denemede bulunur; sayfa donmaz (bölüm başına üretim < 300 ms).
- Maske biçimleri doğru çizilir: kapalı kareler tıklanamaz, mayın içermez, sayılara dahil edilmez, taşma bu karelere yayılmaz.
- Yıldızlar doğru hesaplanır: bitirme 1, süre hedefi +1, yanlış bayraksız +1; bölüm tekrar oynanınca en iyi yıldız sayısı korunur.
- 15/35/60 yıldızda temalar açılır, seçilen tema yeniden yüklemede korunur ve klasik modda da kullanılabilir.
- `mo_mayin` bozuk JSON içerdiğinde oyun hata vermeden sıfırdan başlar.
- 360 px genişlikte en büyük Sefer tahtası yatay kaydırma olmadan sığar ve kare en az 24 px'tir.
- Oyun metinleri DOM'da yazılır (çevrilebilir); oyun mantığı ekrandaki metni okumaz.
- Oynanış testi (`tools/tests/mayin-tarlasi.js`) şunları ekler: Sefer'e geçip 1. bölümü çözücüyle (veya oyun içi test kancasıyla) bitirmek, ≥1 yıldız alıp 2. bölümün açıldığını görmek, `mo_mayin` kaydını sayfa yenilemeden sonra doğrulamak, bozuk kayıtla açılışta JS hatası olmadığını görmek, klasik modun hâlâ çalıştığını doğrulamak.

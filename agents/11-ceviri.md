# 11. Ajan: Çeviri (çoklu dil)

## Görev
Siteyi yabancı ziyaretçiler için çok dilli hale getirmek ve öyle tutmak. Site Türkçe yazılır; sen Türkçe metinlerin diğer dillerdeki karşılıklarını `diller/` altındaki sözlüklere yazarsın. Diğer ajanlar yeni oyun ekledikçe veya metin değiştirdikçe eksikleri sen kapatırsın.

## Altyapı nasıl çalışır
- `js/dil.js` her sayfada yüklenir (`npm run build` ekler). Dil sırası: `?lang=xx` parametresi > ziyaretçinin kayıtlı seçimi (`mo_dil`) > tarayıcı dili. Türkiye saat dilimindeki ziyaretçiler ve arama motoru botları Türkçe görür; desteklenmeyen dildeki yabancı ziyaretçi İngilizce görür.
- Üst menüdeki 🌐 dil seçici ve hreflang etiketleri `tools/build-pages.js` tarafından üretilir.
- Diller: `diller/diller.json` (`kod` + dilin kendi dilindeki `ad`). Bir dil, listede olduğunda **ve** `diller/<kod>/ortak.json` bulunduğunda sitede sunulur.
- Sözlükler (`{ "Türkçe metin": "çeviri" }`):
  - `diller/<kod>/ortak.json`: birden çok sayfada görünen her şey: üst menü, alt bilgi, kategori çubuğu ve kategori adları, oyun kartları (games.json'daki `title` ve `description`), çerez penceresi, ortak oyun araç çubuğu ve oyun sonu penceresi (`js/oyun.js`), giriş/liderlik (`js/sunucu.js`).
  - `diller/<kod>/sayfa/<ad>.json`: `index`, `hakkinda`, `iletisim`, `gizlilik`, `cerezler`, `profil`, `gunluk`, `404`, `kategori` (kategori listesi ve tüm kategori sayfaları).
  - `diller/<kod>/oyun/<slug>.json`: o oyunun sayfası ve oyun içi metinleri (başlık, meta açıklama, nasıl oynanır, ipuçları, düğmeler, bölüm adları, mesajlar).
- Anahtar türleri:
  - Düz metin: `"Yeni oyun": "New game"`. Boşluklar ve satır sonları tek boşluğa indirgenir.
  - Kalıp: `{0}`, `{1}` değişen kısımdır: `"Bölüm {0}": "Level {0}"`, `"{0} oyun": "{0} games"`. Değişen kısım da sözlükte varsa o da çevrilir (`"{0} Oyunları": "{0} Games"` + `"Bulmaca": "Puzzle"` → "Puzzle Games").
  - HTML: içinde yalnızca biçim etiketleri (`a`, `b`, `strong`, `em`, `i`, `br`, `kbd`, `small`) olan paragraf bütün olarak çevrilir; anahtar öğenin innerHTML'idir. Bu anahtarları elle yazma, `tools/dil-kontrol.js` tam olarak üretir. Çeviride etiketleri ve `href` değerlerini aynen koru.
  - Boş değer (`""`) "henüz çevrilmedi" demektir; sayfa Türkçe kalır.
- Bir sayfanın sözlüğünde boş değer kalmadığında sayfa o dilde "tam" sayılır; `npm run build` ona hreflang etiketi ve sitemap'te `?lang=xx` adresi ekler.
- Oyun kodunda DOM'a değil canvas'a çizilen veya `alert`/`confirm` ile gösterilen metinler sözlükle otomatik çevrilmez. Bunlar için oyun kodunda yalnızca metni sarabilirsin: `MO_DIL.t('Bölüm {0}', n)` (Türkçe sayfada aynen Türkçe döner). Mantığı değiştirme.
- Çevrilmemesi gereken içerik (ör. Kelime Tahmin'deki Türkçe kelimeler, harf tahtaları, kullanıcı adları) için o öğeye `translate="no"` ekle.

## Dil sırası
1. **İngilizce (en)**: önce ortak + tüm site sayfaları, sonra oyunlar (en çok oynananlar önce: games.json'da `gunluk: true` olanlar, sonra diğerleri).
2. İngilizce tamamen bitince (tüm sayfalar ✓ ve `--oyna` taraması temiz) sırayla: **Almanca (de)**, **İspanyolca (es)**, **Fransızca (fr)**, **Portekizce (pt)**, **Rusça (ru)**. Bir dile ancak bir önceki dil tamamlanınca başla.
3. Arapça gibi sağdan sola yazılan diller sayfa düzeni değişikliği gerektirir; bunun için önce `reports/site-iyilestirme/` kuyruğuna öneri olarak not düş, kendin ekleme.

## Her çalışmada
1. `git pull --rebase origin main`, sonra `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install`.
2. Önce bakım: tamamlanmış her dil için `node tools/dil-kontrol.js <kod>` çalıştır. Diğer ajanlar yeni oyun eklediyse veya metin değiştirdiyse eksikler burada çıkar; önce bunları kapat (eski, artık kullanılmayan anahtarları silebilirsin).
3. Sonra ilerleme: sıradaki dilde, çevrilmemiş en fazla **5 sayfa sözlüğünü** (veya yeni dil başlıyorsa ortak.json + 2 sayfa) seç.
   - `node tools/dil-kontrol.js <kod> --sayfa <sözlük> --yaz` eksik metinleri boş değerle ekler.
   - Oyunlar için ayrıca `--oyna` ekle: oynanış testi o dilde çalışır ve oyun sırasında çıkan metinler de toplanır (test Türkçe metin aradığından yarıda kalabilir, sorun değil). Testin göstermediği durumlar için `game.js` içinde `textContent`, `innerHTML`, `aria-label`, `title`, `fillText`, `alert` geçen satırlara da bak ve kalıp anahtarları elle ekle.
   - Boş değerleri çevir.
4. `npm run build`, ardından aynı komutu `--yaz` olmadan tekrar çalıştır; seçtiğin sözlükler ✓ olmalı.
5. Çevrilmiş sayfaya göz at: `--oyna` ile çevirinin oyunu bozmadığından emin ol (JS hatası çıkmamalı). 360 px genişlikte uzun çeviriler taşmamalı; taşıyorsa daha kısa bir karşılık seç.
6. `npm run build` ve `node tools/smoke-test.js` geçmeden push etme. Commit: `[ceviri] en: Sudoku ve Yılan çevrildi` gibi.
7. Raporu `reports/ceviri/YYYY-AA-GG-SS.md` olarak yaz (yalnızca bir şey değiştirdiysen):

```markdown
# Çeviri raporu - YYYY-AA-GG SS:00
## Bu çalışmada
- en: oyun/sudoku, oyun/yilan tamamlandı (42 metin)
- Bakım: oyun/kizma-birader'de değişen 3 metin güncellendi
## Durum
| Dil | Tam sayfa | Eksik sayfa |
|---|---|---|
| en | 20/35 | oyun/olta-ustasi, ... |
## Notlar
- (taşma, canvas metni, translate="no" eklenen yerler vb.)
```

## Çeviri kuralları
- Doğal, oyuncuya hitap eden, kısa bir dil kullan; kelimesi kelimesine çevirme. Düğme metinleri kısa kalsın.
- Site adı **MiniOyun** çevrilmez. Oyun adları o dilde doğal bir karşılıkla çevrilir (Yılan → Snake, Mayın Tarlası → Minesweeper, Kızma Birader → Ludo). Marka/telifli adlar kullanma.
- Meta açıklamalar ve sayfa başlıkları (`<title>`) o dilde arama yapan kişinin yazacağı kelimeleri içersin (ör. "Play 2048 Online Free"); başlık 60, açıklama 160 karakteri geçmesin.
- Türkçe kelime oyunlarında (Kelime Tahmin, Harf Çarkı) kelimeler Türkçe kalır; arayüzü çevir ve açıklamada bunun bir Türkçe kelime oyunu olduğunu belirt.
- Sayı, emoji, `{0}` yer tutucuları ve HTML etiketleri aynen kalır.
- Hukuki sayfalarda (gizlilik, çerezler) anlamı değiştirme; çeviri bilgi amaçlıdır.

## Yazabileceğin yerler
- `diller/` (tümü), `reports/ceviri/`.
- Oyun ve site kodunda yalnızca: metni `MO_DIL.t(...)` ile sarmak ve `translate="no"` eklemek. Başka değişiklik gerekiyorsa (ör. metin canvas'ta ve sarılması mantığa dokunuyor, ya da düzen bozuluyor) `reports/test/acik-hatalar.md`'ye hata olarak yaz.
- `js/dil.js`, `tools/dil-kontrol.js` ve `tools/build-pages.js` içindeki çoklu dil kısmında hata bulursan küçük ve kesin düzeltmeleri yapabilirsin; testleri mutlaka çalıştır.

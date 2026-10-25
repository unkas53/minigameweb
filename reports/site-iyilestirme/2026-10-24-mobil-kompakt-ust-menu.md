durum: uygulandi
baslik: Mobilde tek satırlık kompakt üst menü
oncelik: 4
boyut: orta
dosyalar: tools/build-pages.js (header()), css/style.css, js/main.js (gerekirse), tools/smoke-test.js

## Sorun / fırsat
2026-10-24 Playwright ölçümü (yerel sunucu, 19 oyun, 360x740 ve 1280x900):
- 360 px'te `.site-header` **234 px** yüksekliğinde, yani ilk ekranın üçte biri. `.header-row` `flex-wrap` ile 4 satıra bölünüyor: logo (ortada tek başına), "Oyunlar · Kategoriler · Hakkında · İletişim" satırı, "👤 Profilim" tek başına bir satır, "🌐 TR" dil düğmesi tek başına bir satır; altında 54 px'lik kategori çubuğu. 1280 px'te aynı başlık 113 px (sorun yok).
- Bu başlık **her sayfada** tekrar ediyor. Oyun sayfalarında oyun alanı (`.game-layout`) 360 px'te 291 px'te başlıyor; Meyve Patlat'ta araç çubuğu ve görev şeridinden sonra oyun tahtası ilk ekranın altında kalıyor. Mobil ziyaretçi bir oyuna girdiğinde önce kaydırmak zorunda; oyun-oyun geçişlerinde ("Sıradaki oyun", "Benzer oyunlar") bu her seferinde tekrarlanıyor.
- Menüdeki "Hakkında" ve "İletişim" bağlantıları alt bilgide (`footer`) zaten var; mobil başlıkta yer kaplıyorlar ama oyun oynatmıyorlar. Kategori bağlantıları da hemen alttaki `.cat-bar`'da tekrar ediyor.
- Rakip siteler (bkz. `reports/rakip-analizi/2026-10-24-02.md`: Poki, CrazyGames, KralOyun) mobilde tek satırlık ince bir başlık (logo + arama/menü simgesi) kullanıp ilk ekranı oyuna bırakıyor (desen olarak alınır, kopyalanmaz).

## Öneri
Yalnızca **640 px altında** üst menü tek satıra iner; masaüstü görünümü değişmez.
1. **Tek satır (~56 px):** solda logo; sağda sırasıyla `👤` Profilim simge düğmesi (avatar varsa `drawHeaderAvatar` aynen çalışır), `🌐 TR` dil düğmesi ve `☰` menü düğmesi. Satır kaydırılmaz (`flex-wrap: nowrap`); logo metni gerekirse yalnızca rozet + "MiniOyun" olarak kalır.
2. **Menü düğmesi:** JS gerektirmeyen `<details class="mobil-menu">` (dil menüsüyle aynı desen). Açılınca başlığın altında açılır liste: Oyunlar, Kategoriler, Profilim, Günlük meydan okuma (`gunluk.html`), Hakkında, İletişim. Liste dışına tıklanınca veya Esc ile kapanır (küçük bir JS ile; JS yoksa summary'ye tekrar dokunmak yeter). Masaüstünde `.mobil-menu` gizli, mevcut `.nav` görünür; mobilde tersi.
3. **Kategori çubuğu** (`.cat-bar`) olduğu gibi kalır (yatay kaydırılabilir, 54 px). Hedef toplam başlık yüksekliği 360 px'te **≤ 120 px** (şu an 234).
4. Build `header()` fonksiyonu her iki işaretlemeyi de üretir; tüm sayfalar (ana sayfa, kategori, oyun, profil, günlük, statik sayfalar, 404) `npm run build` ile güncellenir. Göreceli bağlantı kuralı (`${p}`) korunur.
5. **Erişilebilirlik:** simge düğmelerinin `aria-label`'ı var ("Profilim", "Menü"); dokunma hedefleri ≥ 44x44 px; `details` açıkken summary `aria-expanded` karşılığını tarayıcı verir. Odak sırası: logo → profil → dil → menü → kategori çubuğu.
6. Çeviri: menü metinleri DOM'da olduğu için `diller/` sözlükleriyle otomatik çevrilir; logo `translate="no"` kalır.
7. Reklam alanlarına dokunulmaz.

## Kabul kriterleri
- 360x740'ta `.site-header` yüksekliği ≤ 120 px (ana sayfa, bir kategori sayfası, 2048 ve Meyve Patlat sayfası, profil.html); 1280x900'de görünüm ve yükseklik (~113 px) değişmemiş. Smoke teste bu ölçüm eklenir.
- 360 px'te oyun sayfasında `.game-layout` üst kenarı ≤ 180 px (şu an 291).
- 360 px'te `☰` düğmesine dokununca menü açılır; içindeki 6 bağlantının hepsi doğru sayfaya gider (göreceli, `/` ile başlamıyor); Esc veya dışarı dokunma menüyü kapatır.
- Profil simgesi `profil.html`'e gider; giriş yapılmışsa avatar gösterimi bozulmamış. Dil menüsü TR/EN geçişi çalışıyor.
- 360 px ve 1280 px'te yatay taşma yok, konsolda pageerror yok; `npm run build` sonrası tüm üretilen sayfalar güncel (smoke test build kontrolü geçer).
- Ana sayfa ölçümü (ilk `.game-card` ≤ 900 px) hâlâ geçer (değer küçülmeli).
- Klavyeyle (Tab/Enter) menü açılıp bağlantılar seçilebiliyor.

## Uygulama notu (2026-10-25)
640 px altında üst menü tek satır: logo, 👤 profil simgesi, 🌐 dil, ☰ `<details class="mobil-menu">` (Oyunlar, Kategoriler, Profilim, Günlük meydan okuma, Hakkında, İletişim; dışarı dokunma/Esc ile kapanır). 360 px'te başlık 234 → 115 px, 2048/Meyve Patlat oyun alanı 172 px'te başlıyor; masaüstü 113 px, değişmedi. Smoke teste mobil başlık ≤ 120 px, oyun alanı ≤ 180 px (2048, Meyve Patlat) ve ☰ menü/Esc kontrolü eklendi. Not: Kule Savunması'nda oyun alanı 201 px'te başlıyor (oyuna özgü üst içerik).

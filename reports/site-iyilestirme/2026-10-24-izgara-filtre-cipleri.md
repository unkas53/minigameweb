durum: uygulaniyor
baslik: Ana sayfa ızgarasında hızlı filtre çipleri ve anlamlı "YENİ" rozeti
oncelik: 4
boyut: orta
dosyalar: tools/build-pages.js, index.html (oto: blokları build ile), js/main.js, css/style.css, tools/smoke-test.js

## Sorun / fırsat
2026-10-24 Playwright gezintisi (yerel sunucu, 19 oyun, çerez onaylı):
- 360x740'ta "Tüm Oyunlar" ızgarası 711 px'te başlıyor ama 2897 px'e kadar sürüyor: 19 kart yaklaşık **3 ekran** boyu. Faz 2 hedefi 25-30 oyun olduğu için bu uzunluk artacak. Ziyaretçinin ızgarayı daraltmasının tek yolu arama kutusu (ne aradığını bilmesi gerekiyor) veya kategori çubuğu (başka sayfaya götürüyor).
- 19 kartın **19'u da "YENİ"** rozeti taşıyor (`js/main.js` `markNewGames`: son 14 gün; site 2026-10-23'te açıldı). Rozet hiçbir şeyi ayırt etmiyor; geri gelen oyuncu bugün eklenen oyunu (ör. Drift Ustası, Mahjong) diğerlerinden ayıramıyor. Bu, önceki iki önerinin "ek gözlem" notunda da kaydedilmişti.
- Geri gelen oyuncu için "henüz denemediğim oyunlar hangileri?" sorusunun cevabı yok; `mo_son_oynanan` verisi yalnızca "Son oynadıkların" satırında kullanılıyor. Profilim'de "farklı oyun" sayacı var ama hangi oyunların kaldığı görünmüyor.
- Rakip siteler (bkz. `reports/rakip-analizi/2026-10-24-02.md`) oyunları ayrı "popüler", "yeni" listeleri ve koleksiyon satırları (KralOyun popüler + yeni, CrazyGames "Match & Merge", Coolmath/KralOyun "Idle & Clicker") ile daraltıyor. Bizde benzer bir daraltma yok (desen olarak alınır, kopyalanmaz).

## Öneri
"Tüm Oyunlar" başlığının hemen altına, ızgaranın üstüne yatay bir **filtre çipi satırı** eklenir (yalnızca ana sayfa):
1. **Çipler:** `Tümü` (varsayılan, seçili) · `✨ Yeni` · `🎯 Denemediklerin` · `❤️ Favorilerin`.
   - `Yeni`: `games.json` `added` tarihine göre **en yeni 4 oyun** (eşit tarihte `games.json` sırasında sonra gelen daha yeni sayılır). Build bu oyunların kartına `data-yeni="1"` yazar; böylece JS'e tarih hesabı gerekmez ve sayfa yeniden üretildiğinde liste kendiliğinden güncellenir.
   - `Denemediklerin`: `mo_son_oynanan` listesinde olmayan oyunlar. Liste boşsa (ilk ziyaret) çip gizlenir, çünkü "Tümü" ile aynı olur.
   - `Favorilerin`: `mo_favoriler` boşsa çip gizlenir.
   - Her çipte küçük sayı gösterilir (ör. `🎯 Denemediklerin 12`).
2. **Davranış:** çip yalnızca kartlara `hidden` verir (yeniden sıralama yok, yeni ağ isteği yok). Arama kutusuyla birlikte çalışır: görünen kart = seçili çip ∩ arama sonucu. Sonuç boşsa mevcut `#sonuc-yok` metni görünür. Seçili çip `sessionStorage` (try/catch) ile sayfa yenilemede korunabilir; kalıcı olması gerekmez.
3. **"YENİ" rozeti:** `markNewGames` 14 gün kuralı yerine build'in `data-yeni` işaretini kullanır; rozet yalnızca en yeni 4 karta (ana sayfa, kategori sayfaları ve kişisel sıralarda aynı kural) düşer. Kategori sayfaları ve oyun sayfasındaki "Benzer oyunlar" kartları da aynı işareti taşır.
4. **Görünüm:** çipler mevcut `.cat-chip` görünümüne benzer, en az 44 px yüksekliğinde; 360 px'te tek satırda yatay kaydırılabilir (sayfa yatay taşmaz), masaüstünde tek satır. Seçili çip `aria-pressed="true"`; çip satırı `role="group"` ve `aria-label="Oyunları filtrele"` taşır.
5. **Analitik:** çipe tıklanınca GoatCounter'a `filtre/<yeni|denemediklerin|favoriler|tumu>` olayı (mevcut `goatcounter.count` deseniyle, kişisel veri yok).
6. Reklam alanlarına, `h1` ve SEO metnine dokunulmaz; JS kapalıyken tüm kartlar görünür kalır (çip satırı JS ile gösterilir veya JS yokken etkisizdir).

## Kabul kriterleri
- Ana sayfada çip satırı ızgaranın üstünde; ilk yüklemede `Tümü` seçili ve 19 (tüm) kart görünür. Ana sayfa ölçümü (ilk `.game-card` ≤ 900 px, 360x740 ve 1280x900) hâlâ geçer.
- `Yeni` seçilince tam olarak 4 kart görünür ve bunlar `added` tarihi en yeni olanlardır.
- Tüm sitede `.game-card.is-new` sayısı en fazla 4 karttır (aynı oyunun farklı bölümlerdeki kopyaları hariç); 19 kartın hepsi artık "YENİ" değildir.
- `mo_son_oynanan` boşken `Denemediklerin`, `mo_favoriler` boşken `Favorilerin` çipi görünmez; doluyken görünür ve doğru kartları gösterir (ör. 2048 oynandıktan sonra `Denemediklerin` 18 kart gösterir, 2048 yok).
- Çip + arama birlikte çalışır (ör. `Yeni` seçiliyken eşleşmeyen bir arama "sonuç yok" metnini gösterir); `Tümü`'ne dönünce arama filtresi korunur.
- Çipler klavyeyle (Tab + Enter/Boşluk) seçilebilir, `aria-pressed` doğru güncellenir; dokunma hedefleri ≥ 44 px.
- 360 px ve 1280 px'te yatay sayfa taşması yok, konsolda pageerror yok; `npm run build` sonrası üretilen dosyalar güncel, `npm test` geçer. Smoke teste çip sayıları ve `is-new` ≤ 4 kontrolü eklenir.
- `.ad-slot` sayısı değişmez; kategori ve oyun sayfalarının düzeni değişmez (yalnızca rozet kuralı).

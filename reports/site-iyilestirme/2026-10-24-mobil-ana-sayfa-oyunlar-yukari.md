durum: uygulandi
baslik: Mobil ana sayfada oyun ızgarasını yukarı taşı
oncelik: 4
boyut: orta
dosyalar: tools/build-pages.js, index.html (oto: blokları build ile), css/style.css, tools/smoke-test.js

## Sorun / fırsat
2026-10-24 Playwright ölçümü (yerel sunucu, 16 oyun): 360x740'ta ana sayfanın ilk oyun kartı **1794 px**'te başlıyor, yani yeni ziyaretçi oyun listesini görmek için yaklaşık 2,5 ekran kaydırmak zorunda. Önünde sırasıyla şunlar var: üst menü + kategori çubuğu (0-191), karşılama bölümü (191-864; başlık, arama, sayaçlar ve öne çıkan oyun kartı birlikte 673 px), günlük meydan okuma afişi (888-1084), reklam alanı (1112-1202) ve 7 kutuluk "Kategoriler" ızgarası (1238-1705, 467 px). Kategori ızgarası mobilde tekrar: aynı kategoriler sayfanın en üstündeki kaydırılabilir kategori çubuğunda (`.cat-bar`) zaten var. 1280x900'de de ilk kart 1123 px'te, ilk ekranın altında.
Rakip siteler (Poki, CrazyGames, KralOyun; bkz. `reports/rakip-analizi/2026-10-24-02.md`) mobilde ilk ekranda doğrudan oyun kartları gösteriyor. Mobil ziyaretçi oyun görmeden çıkarsa hiç oynamıyor; bu, sitenin en büyük kaybı.

## Öneri
Ana sayfanın sırası ve boyutları, özellikle 640 px altında, oyunlara öncelik verecek şekilde değişir:
1. **Karşılama bölümü kısalır:** mobilde başlık + tek satır alt metin + arama kutusu kalır; "16 oyun / 7 kategori / %100 ücretsiz" sayaç satırı mobilde gizlenir veya tek satır küçük metin olur. Öne çıkan oyun kartı mobilde yatay, en fazla ~120 px yüksekliğinde küçük bir şerit olur (ikon solda, ad + "Hemen oyna" sağda); masaüstünde mevcut görünüm kalabilir.
2. **"Tüm Oyunlar" ızgarası "Kategoriler"in önüne alınır** (tüm genişliklerde; build `index.html` üretiminde sırayı değiştirir). "Kategoriler" kutuları ızgaranın altına iner. Kategori çubuğu üstte kaldığı için kategoriye ulaşım kaybolmaz.
3. **Günlük meydan okuma afişi** mobilde tek satırlık kompakt hale gelir (takvim ikonu + "Günün meydan okuması" + "Oyna" düğmesi, ~72 px).
4. **Reklam alanları korunur:** ilk `.ad-slot` yerinde kalabilir ya da ilk iki oyun satırından sonra ızgara içine/altına alınabilir; reklam oyun kartının üstüne binmez, sayısı azaltılmaz.
5. Favoriler/son oynananlar (`#kisisel`) bölümü doluysa ızgaranın hemen önünde kalır (geri gelen oyuncu için doğru yer).
Hedef: 360x740'ta ilk oyun kartının üst kenarı **≤ 900 px** (çerez penceresi kapatılmış hâlde), 1280x900'de ilk oyun satırı ilk ekranda (≤ 900 px) başlar.

## Kabul kriterleri
- 360x740'ta (çerez onaylanmış, `#kisisel` boş) ilk `.game-card` üst kenarı ≤ 900 px; 1280x900'de ≤ 900 px. Smoke teste bu ölçüm eklenir.
- Ana sayfada sıra: karşılama (arama dahil) → günlük afişi → (doluysa) kişisel sıralar → Tüm Oyunlar → Kategoriler → tanıtım metni. Arama kutusu hâlâ ızgarayı filtreliyor, "sonuç yok" metni çalışıyor.
- Öne çıkan oyun ve günlük afişi mobilde tıklanabilir, dokunma hedefleri ≥ 44 px; masaüstü görünümü bozulmuyor.
- `.ad-slot` sayısı ana sayfada azalmıyor; hiçbir reklam alanı oyun kartının veya düğmenin üstünde değil.
- 360 px ve 1280 px'te yatay taşma yok, konsolda pageerror yok; `npm run build` sonrası `index.html` güncel (smoke test build kontrolü geçer).
- Kategori sayfaları (`kategori/`) ve oyun sayfaları değişmiyor.
- SEO metni (`h1`, "MiniOyun nedir?" bölümü) korunuyor; yalnızca sırası/görünümü değişiyor.

## Ek gözlem (ayrı öneri olarak değerlendirilebilir)
`js/main.js` son 14 günde eklenen oyunlara "YENİ" rozeti veriyor; site 2026-10-23'te açıldığı için şu an 16 oyunun **hepsi** "YENİ" görünüyor ve rozet ayırt edici değil. İleride rozet yalnızca en yeni 3 oyuna (veya son 3 günde eklenenlere) verilebilir.

## Uygulama notu (10. ajan, 2026-10-24)
`[site-uygulama] Mobil ana sayfada oyun ızgarasını yukarı taşı`: `index.html`'de sıra karşılama → günlük afişi → kişisel sıralar → Tüm Oyunlar → reklam → Kategoriler → reklam → tanıtım metni oldu (reklam sayısı 2, değişmedi). `css/style.css`'e 640 px altı kuralları eklendi: sayaç satırı gizli, öne çıkan oyun ~111 px yatay şerit (ikon, etiket, ad, 44 px "Hemen oyna"), günlük afişi tek satır ~73 px. Ölçüm (çerez kapalı, `#kisisel` boş): ilk oyun kartı 360x740'ta 1794 → 721 px, 1280x900'de 1123 → 662 px. Smoke teste ana sayfa kontrolü eklendi (ilk kart ≤ 900 px, ızgara kategorilerden önce, en az 2 reklam alanı). "YENİ" rozeti gözlemine dokunulmadı (kapsam dışı).

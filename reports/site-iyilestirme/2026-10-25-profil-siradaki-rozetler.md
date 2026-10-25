durum: bekliyor
baslik: Profilim'de "Sıradaki hedeflerin": rozet ilerleme çubukları ve oyna bağlantısı
oncelik: 3
boyut: orta
dosyalar: js/oyun.js (BADGES'e isteğe bağlı ilerleme/oyun alanı), js/profil.js, profil.html, css/style.css, tools/smoke-test.js

## Sorun / fırsat
2026-10-25 Playwright gezintisi (yerel sunucu, 20 oyun, 2048 ve Meyve Patlat açılmış yeni oyuncu):
- Profilim'de 28 rozetin hepsi kilitli (`0/28`). Rozet ızgarası 360x740'ta **1008-3236 px** (yaklaşık 3 ekran), 1280x900'de 523-1316 px yer kaplıyor. Kilitli rozetler yalnızca 🔒 ve açıklama gösteriyor; oyuncu hangisine ne kadar yakın olduğunu bilmiyor (ör. "Kaşif: 3 farklı oyun oyna" için 2/3'te olduğunu göremiyor) ve rozet kartından ilgili oyuna gidemiyor.
- Rekorlar listesi (360 px'te 3325-4911 px) ancak rozetlerin altında; sayfa toplam 6233 px. Profilim şu an "vitrin": oyuncuyu bir sonraki oyuna veya bir sonraki oturuma çeken bir hedef göstermiyor.
- Rozet koşulları zaten sayısal (`js/oyun.js` `BADGES`: "10 oyun bitir", "Meyve Patlat'ta 60 yıldız", "Tuğla Kırma'da 30 bölüm" ...). İlerleme değeri aynı veriden hesaplanabiliyor; yeni kayıt gerekmiyor.
- Rakip sitelerde ve mobil oyunlarda tekrar ziyaretin en yaygın aracı "yarım kalmış hedef" göstermek (ilerleme çubuğu + tek dokunuşla devam). Desen olarak alınır, kopyalanmaz.

## Öneri
1. **Rozet ilerlemesi (oyun.js):** `BADGES` öğelerine isteğe bağlı iki alan eklenir: `ilerleme: function (s) { return [mevcut, hedef]; }` ve `oyun: '<slug>'` (rozet bir oyuna bağlıysa; genel rozetlerde yok). Mevcut `kosul` ve `MiniOyun.rozetler` API'si değişmez; `ilerleme` olmayan rozetler (ör. Gece kuşu, Paylaşımcı) eskisi gibi çalışır. Sayılabilen tüm rozetlere ilerleme yazılır (farklı oyun sayısı, bitirme/kazanma toplamı, gün serisi, rekor puanı, yıldız/bölüm sayısı, günlük seri). `games/*/game.js` dosyalarına dokunulmaz; değerler zaten okunan `mo_*` kayıtlarından gelir.
2. **"Sıradaki hedeflerin" bölümü (Profilim):** sayaçların (`#sayilar`) hemen altına, "Rozetler"in önüne en fazla **3 kart**: kazanılmamış, ilerlemesi > 0 olan rozetlerden oranı (`mevcut/hedef`) en yüksek olanlar; hiç yoksa (ilk ziyaret) en kolay 3 genel rozet (İlk adım, Kaşif, Gönül verdim gibi sıra `BADGES` sırası). Her kartta ikon, ad, açıklama, ilerleme çubuğu (`<progress>` veya `role="progressbar"` + `aria-valuenow/max`), "2/3" metni ve rozetin `oyun` alanı varsa **"Oyna ▶"** bağlantısı (`games/<slug>/`, göreceli). Genel rozetlerde bağlantı, oyuncunun hiç oynamadığı ilk oyuna gider (Kaşif/Gezgin için anlamlı) veya hiç gösterilmez.
3. **Rozet ızgarası sadeleşir:** kazanılanlar önce (mevcut sıralama); kilitli rozetlerde 🔒 yerine soluk ikon + ince ilerleme çubuğu. 640 px altında ızgara ilk **8 rozeti** gösterir, altında "Tüm rozetleri göster (28)" düğmesi (JS yokken hepsi görünür). Böylece 360 px'te rekorlar listesi yaklaşık 2 ekran yukarı çıkar.
4. **Oyun sonu bağlantısı (isteğe bağlı, küçük):** `checkBadges` yeni rozet kazandırmazsa değişiklik yok; bu öneri oyun sonu penceresine bir şey eklemez (kapsam Profilim ile sınırlı).
5. **Analitik:** "Oyna ▶" tıklamasında GoatCounter'a `hedef/<rozet-id>` olayı (mevcut `goatcounter.count` deseni, kişisel veri yok).
6. Metinler DOM'da kalır (çeviri sözlükleriyle çevrilir); sayı metinleri `translate="no"` gerekmez. Reklam alanlarına, SEO alanlarına dokunulmaz.

## Kabul kriterleri
- Boş `localStorage` ile Profilim'de "Sıradaki hedeflerin" bölümü 3 kart gösterir, hepsi kazanılmamış rozettir; konsolda pageerror yok.
- `mo_istatistik.oynama` içinde 2 oyun varken "Kaşif" kartı görünür ve "2/3" ile çubuk değeri 2 / max 3 gösterir; 3. oyun oynanınca (rozet kazanılınca) kart listeden düşer.
- `mo_meyve` kaydında 12 yıldız varken "Meyve ustası" ilerlemesi 12/60 hesaplanır ve kartındaki "Oyna" bağlantısı `games/meyve-patlat/`'e gider (göreceli, `/` ile başlamıyor).
- `MiniOyun.rozetler` hâlâ 28 öğe, her birinde `id/ikon/ad/aciklama/kosul` var; mevcut rozet kazanma testleri ve tüm oynanış testleri geçer.
- 360x740'ta rozet ızgarası en fazla 8 rozet gösterir ve "Tüm rozetleri göster" düğmesiyle 28'e açılır; `#rekorlar` üst kenarı 360 px'te ≤ 2200 px (şu an 3325). 1280x900'de düzen bozulmaz.
- İlerleme çubukları ekran okuyucuya değer bildirir (`progress` öğesi veya `role="progressbar"` + `aria-valuenow`/`aria-valuemax`); kartlar ve düğme klavyeyle seçilebilir; dokunma hedefleri ≥ 44 px.
- 360 px ve 1280 px'te yatay taşma yok; `npm run build` sonrası üretilen dosyalar güncel, `npm test` geçer. Smoke teste Kaşif 2/3 ve "tümünü göster" kontrolü eklenir.

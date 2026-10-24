durum: yayinda
slug: penalti-ligi
baslik: Penaltı Ligi
kategori: Spor
oncelik: 5

## Özet
Oyuncu hem penaltı atıp hem kurtardığı kısa penaltı atışı maçlarıyla 4 ligden oluşan bir kariyerde yükselir; kazandığı paralarla oyuncusunu ve kalecisini geliştirir.

## Neden bu oyun
- Sitede **Spor** kategorisinde hiç oyun yok; bu oyun kategoriyi açar (diğer tüm kategorilerde en az bir oyun var veya geliştiriliyor).
- "penaltı oyunu", "penaltı atma oyunu", "futbol oyunları", "penaltı çekme oyunu oyna" Türkiye'de futbol ilgisi nedeniyle yıl boyu çok aranır; maç ve turnuva dönemlerinde arama zirve yapar.
- Rakip mini oyun sitelerinde penaltı/serbest vuruş oyunları spor kategorisinin en çok oynananları arasındadır. Henüz rakip analizi raporu olmadığı için seçim kategori boşluğuna ve genel arama talebine dayanıyor.
- Tek maç 1-3 dakika sürer, kariyer modu ise saatlerce içerik sunar (ORTAK.md "Oyun derinliği").
- Canvas çizimi ve emoji ile yapılır, görsel/ses dosyası gerekmez. Marka, kulüp veya gerçek oyuncu adı kullanılmaz; takımlar uydurma isimli (ör. "Boğaziçi Kartalları", "Ege Yıldızları").

## Oynanış
- Bir maç = penaltı atışları serisi. Sırayla oyuncu 5 atış yapar, rakip 5 atış yapar (atış-kurtarış dönüşümlü). Eşitlikte ani ölüm (en fazla 5 tur, sonra hâlâ eşitse "beraberlik" sayılır, maç tekrar oynanır).
- **Atış (oyuncu vurur):** Kale 3x2 bölgeye ayrılmış gibi davranır ama hedef serbesttir. Oyuncu kaleye bir hedef seçer (dokun/tıkla veya kaydır), ardından alttaki **güç çubuğu** salınır; doğru anda dokununca vuruş yapılır. Güç yeşil bölgedeyse top hedefe gider, sarıdaysa hedeften rastgele sapma artar, kırmızıdaysa top auta/üste gider. Köşelere yakın hedefler kalecinin ulaşamayacağı yerlerdir ama sapmayla dışarı gitme riski yüksektir (risk/ödül).
- Rakip kaleci: seviyeye göre bir yöne erken veya geç atlar; refleks değeri kurtarma alanını belirler. Ortaya yavaş vuruşta ("panenka") kaleci erken atladıysa gol, beklediyse kurtarış.
- **Kurtarış (oyuncu kaleci):** Rakip koşuya başlar; vuruştan kısa bir süre önce ayak ve vücut yönü ipucu verir (seviye arttıkça ipucu süresi kısalır ve yanıltıcı ipucu oranı artar). Oyuncu topun gideceği tarafa kaydırır/dokunur; zamanlama doğruysa kaleci atlar. Doğru yön + zamanında = kurtarış.
- Puan/ödül: gol +100, kurtarış +150, köşeye gol +50 bonus, "temiz kale" (rakibe hiç gol yedirmeme) +300. Maç galibiyeti para (🪙) ve yıldız verir.

### Kariyer ve zorluk eğrisi
- 4 lig, her ligde 6 rakip = **24 maç**: Mahalle Ligi → Amatör Lig → 1. Lig → Süper Lig. Ardından **Kupa Finali** (patron maçı: rakip kaleci çok iyi, 7 atışlık seri).
- Lig ilerledikçe: rakip kalecinin refleksi ve okuma isabeti artar, güç çubuğu hızlanır ve yeşil bölge daralır, rakip atıcıların ipucu süresi kısalır, köşeye vurma oranı artar.
- Bir ligdeki maçları bitirince bir sonraki lig açılır; ligi en az 12 yıldızla bitirmek ek ödül (kupa rozeti) verir.

## İlerleme ve geri gelme
- **Yıldızlar (maç başına 1-3):** 1 yıldız = galibiyet; 2 yıldız = galibiyet ve en fazla 1 gol yemek; 3 yıldız = galibiyet ve en az 4 gol atmak ve en fazla 1 gol yemek (ani ölüme gitmeden).
- **Para ile kalıcı yükseltmeler (her biri 5 seviye):**
  - Şut İsabeti: güç çubuğundaki yeşil bölge genişler.
  - Şut Gücü: yüksek güçte sapma azalır, top daha hızlı gider (kalecinin tepki süresi kısalır).
  - Kaleci Refleksi: kurtarış zamanlama penceresi genişler.
  - Kaleci Okuma: rakip ipucunun gösterilme süresi uzar.
- **Açılan içerik:** Lig geçtikçe yeni forma renkleri ve top desenleri (⚽ emoji üzerine renk halkası), Süper Lig'de "Kalecilik Antrenmanı" ve "Serbest Vuruş Duvarı" mini modları açılır (kısa ek bölümler; geliştirici yer kısıtında yalnızca birini yapabilir).
- **Günlük görevler (3 adet, her gün değişir, `MiniOyun.rastgele()` ile tarihten):** "3 köşe golü at", "Bir maçı temiz kale kapat", "Panenka ile gol at" vb. Her görev para verir.
- Rozet önerisi: "Kupa Sahibi" (Kupa Finali'ni kazan) `js/oyun.js` `BADGES` listesine.
- **Kayıt anahtarı:** `mo_penalti` → `{ lig, maclar: {id: yildiz}, para, yukseltme: {isabet, guc, refleks, okuma}, acilan: [...], gorev: {tarih, liste, tamam} }`. Kayıt bozuksa sıfırdan başlar, hata vermez.
- **İlk gün:** Mahalle Ligi'ni bitirir, ilk yükseltmeleri alır. **İlk hafta:** 1. Lig ve Süper Lig'de 3 yıldız peşine düşer, günlük görevleri yapar, Kupa Finali'ni dener.

## Kontroller
- **Klavye:** Atışta ok tuşları hedef imlecini 3x2 ızgarada gezdirir (veya ince ayar), Boşluk/Enter güç çubuğunu durdurur (vuruş). Kurtarışta Sol/Sağ/Yukarı (orta) ok tuşları atlama yönü. `P`/`Esc` çerçevenin duraklatması.
- **Dokunmatik/fare:** Atışta kaleye dokunarak hedef seçilir, ikinci dokunuş (ekranın herhangi bir yeri veya büyük "VUR" düğmesi) güç çubuğunu durdurur. Kurtarışta kaleye sol/sağ/orta dokunma veya kaydırma. `pointerdown` ile, `touch-action: none` canvas üzerinde, çift dokunmada yakınlaştırma yok.
- Maç sırasında duraklatma: `pause`/`resume`/`canPause` verilir; duraklatınca çubuk ve animasyon durur.

## Görsel tasarım
- Canvas, en fazla 480x560 px, ortalı, telefonda genişliğe göre ölçeklenir (360px'te kaydırmasız).
- Çizim: yeşil çim şeritleri (iki ton yeşil), beyaz kale direkleri ve file (ince çizgi ızgara), kaleci ve atıcı basit şekiller (daire kafa + dikdörtgen gövde, forma rengi), top ⚽ emoji veya beyaz daire.
- Top uçuşu kısa parabol animasyonu (300-450 ms); gol olursa file sallanır ve "GOL!" yazısı, kurtarışta "KURTARDI!".
- Üstte skor tablosu: iki takım adı, 5 atışlık daire dizileri (✅ gol, ❌ kaçan, ⚪ bekleyen).
- Bölüm haritası: lig başına 6 maç düğmesi (yıldızlarıyla), kilitli olanlar soluk; altta "Yükseltmeler" ve "Görevler" sekmeleri.
- `prefers-reduced-motion` açıksa file sallanması ve kamera sarsıntısı kapalı.
- Simge: `⚽`, kart renkleri `["#16a34a", "#facc15"]`.

## Sayfa metinleri
- title: `Penaltı Ligi - Online Penaltı Atma Oyunu | MiniOyun`
- meta description: `Penaltı at, kaleyi koru, ligleri tek tek geç! Ücretsiz penaltı oyunu: 24 maçlık kariyer, yıldızlar, yükseltmeler ve günlük görevler.`
- **Nasıl oynanır:** Penaltı Ligi'nde hem penaltı atan oyuncuyu hem de kaleciyi sen yönetirsin. Her maçta sırayla beşer penaltı atılır. Atış sırası sendeyken önce kalede topu göndermek istediğin yere dokun, sonra alttaki güç çubuğunu yeşil bölgede durdur. Çubuk sarıda durursa top hedeften sapar, kırmızıda durursa auta gider. Kaleci sırası sendeyken rakip atıcının koşusunu ve vücut yönünü izle, top vurulmadan hemen önce doğru tarafa dokunarak atla. Daha çok gol atan maçı kazanır; eşitlikte ani ölüm başlar. Mahalle Ligi'nden başlayıp Amatör Lig, 1. Lig ve Süper Lig'i geçerek Kupa Finali'ne ulaşmaya çalış. Kazandığın paralarla şut isabetini, şut gücünü, kaleci refleksini ve okumanı geliştir.
- **İpuçları:** Köşeler kalecinin en zor uzandığı yerlerdir ama güç çubuğunu tam yeşilde durduramazsan top dışarı gider; emin değilsen biraz daha içeriyi hedefle. Rakip kaleci erken atlıyorsa ortaya yavaş bir vuruş onu ters köşeye yatırır. Kurtarışta atıcının kalçasına ve destek ayağına bak, son ana kadar beklemek yanıltıcı ipuçlarından korur. İlk paralarını Şut İsabeti'ne yatırmak erken liglerde en hızlı ilerlemeyi sağlar. Günlük görevleri her gün yaparak yükseltmeler için ek para kazan.
- **Kısa SSS (`.game-desc` sonunda):** "İlerlemem kaybolur mu?" → İlerleme tarayıcıda saklanır; aynı cihazda kaldığın yerden devam edersin. "Kaç maç var?" → 4 ligde 24 maç ve bir Kupa Finali. "Günlük modda ne değişir?" → O gün herkes aynı rakip davranışlarıyla tek bir maç oynar ve skorlar karşılaştırılır.
- `.game-desc` toplamda en az 150 kelime özgün Türkçe metin. Gerçek kulüp, lig veya oyuncu adı kullanılmaz.

## Zorluk ve günlük mod
- Zorluk kariyer boyunca artar (4 lig + final); ek olarak kariyerden bağımsız **Hızlı Maç** modunda Kolay/Normal/Zor seçilir (`MiniOyun.oyun({ seviye })`, rekor seviye başına; liderlik tablosu bunu kullanır).
- **Günlük moda uygun:** `?gunluk=YYYY-MM-DD` ile Normal zorlukta tek maç oynanır; rakip kalecinin atlama kararları ve rakip atıcıların hedef/ipucu dizisi `MiniOyun.rastgele()` ile önceden üretilir, böylece herkes aynı maçı oynar. Skor = maç puanı (gol, kurtarış, köşe ve temiz kale bonusları). Yükseltmeler günlük modda **uygulanmaz** (adil karşılaştırma). `games.json` kaydına `"gunluk": true`.
- Rekor: puan (varsayılan, `rekor` alanı gerekmez).

## Kabul kriterleri
- [ ] `games/penalti-ligi/index.html` ve `game.js` mevcut oyun sayfalarının yapısını izliyor (canonical, JSON-LD `genre: Spor`, nasıl oynanır, ipuçları, SSS, reklam alanları, çerez penceresi); tüm bağlantılar göreceli.
- [ ] `games.json`'a `Spor` kategorisinde kayıt (`icon: ⚽`, colors, `"gunluk": true`) eklendi, `npm run build` çalıştırıldı; `kategori/spor/` sayfası oluştu ve kategori çubuğunda Spor görünüyor.
- [ ] Maç akışı: 5'er atış dönüşümlü, eşitlikte ani ölüm; skor tablosu daireleri doğru güncelleniyor; maç sonunda `MiniOyun.bitti` (sonuç, skor, yıldız, kazanılan para).
- [ ] Güç çubuğu yeşilde → hedefe, kırmızıda → aut; test bunu deterministik olarak (çubuk konumu zorlanarak veya `page.clock` ile) doğruluyor.
- [ ] Kurtarış: doğru yön + zaman penceresi içinde → kurtarış; yanlış yön → gol.
- [ ] Kariyer: 4 lig × 6 maç + Kupa Finali; bir ligi bitirince sonraki açılıyor; yıldız koşulları (1/2/3) doğru.
- [ ] 4 yükseltme × 5 seviye para ile alınıyor ve etkisi oynanışa yansıyor (ör. yeşil bölge genişliği ölçülebilir).
- [ ] Günlük görevler tarihe göre aynı geliyor, tamamlanınca para veriyor ve ertesi gün yenileniyor.
- [ ] İlerleme `mo_penalti` anahtarında; sayfa yenilenince korunuyor; bozuk JSON'da oyun sıfırdan açılıyor (test bunu kontrol ediyor).
- [ ] Günlük modda (`?gunluk=2026-10-25`) iki açılışta rakip atış dizisi ve kaleci kararları birebir aynı; yükseltmeler uygulanmıyor.
- [ ] Duraklatınca animasyon ve güç çubuğu duruyor; duraklatmada girişler yok sayılıyor.
- [ ] Klavye (oklar, Boşluk/Enter) ve dokunmatik (`pointerdown`) çalışıyor.
- [ ] `MiniOyun.ses`: gol (`puan`), kurtarış (`puan`), kaçan/yenen gol (`tik` veya `kaybet`), maç kazanma (`kazan`), kaybetme (`kaybet`).
- [ ] 360px genişlikte yatay kaydırma yok; kale, güç çubuğu ve düğmeler kaydırmadan görünüyor.
- [ ] Hiçbir gerçek kulüp, lig, marka veya oyuncu adı kullanılmıyor.
- [ ] `tools/tests/penalti-ligi.js` oynanış testi var (bir maçı baştan sona oynayıp kazanma ve kayıt kontrolü) ve `node tools/smoke-test.js` hatasız geçiyor.
- [ ] `agents/4-gelistirici.md` kalite listesinin tamamı (9. madde dahil) karşılanıyor.

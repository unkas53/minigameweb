durum: bekliyor
slug: kizma-birader
baslik: Kızma Birader
kategori: Strateji
oncelik: 4

## Özet
Zar atıp dört piyonunu tahtayı dolaştırarak eve sokmaya çalıştığın, rakip piyonları kırıp başa yolladığın klasik Kızma Birader; karakterli bilgisayar rakiplerine karşı 24 maçlık turnuva kampanyası, yıldızlar, açılan tahta ve zar temaları ve günlük görevlerle.

## Neden bu oyun
- Son rakip analizi (`reports/rakip-analizi/2026-10-24-02.md`) Kızmabirader benzeri masa oyununu 5. öncelik olarak öneriyor: KralOyun popüler listesinde var ve Türk sitelerine özgü bir talep. İlk dört önerinin hepsi yayında veya kuyrukta (Harf Çarkı ve Top Sıralama yayında, Blok Bulmaca ve Olta Ustası bekliyor).
- "kızma birader oyna", "kızmabirader online", "ludo oyna" Türkiye'de sürekli aranan, yaş aralığı geniş bir arama ailesi. Oyun adı Türkiye'de genel bir masa oyunu adıdır, marka değildir.
- Sitede masa oyunu olarak yalnızca Dört Bağlantı var; Strateji kategorisinde 2 oyun bulunuyor. Klasik tek ekranlık bir oyun olduğu için `agents/ORTAK.md` gereği aşağıdaki turnuva katmanıyla öneriliyor.

## Oynanış
- 11x11 artı biçimli klasik tahta, 40 karelik ortak yol, her oyuncunun 4 karelik ev yolu ve köşesinde 4 piyonluk başlangıç alanı. 2 veya 4 oyuncu (oyuncu her zaman kırmızı, rakipler bilgisayar). Yerel mod: aynı cihazda 2-4 kişi sırayla.
- Sıra gelen oyuncu zar atar (1-6). 6 gelirse piyon başlangıçtan çıkabilir ve oyuncu bir kez daha atar; üst üste üç 6'da sıra yanar.
- Piyon zar kadar ilerler. Rakip piyonun durduğu kareye gelen piyon onu kırar, kırılan piyon başlangıca döner. Kendi piyonunun üstüne konamazsın. Her oyuncunun çıkış karesi güvenli kare değildir (klasik kural); kampanyanın bazı bölümlerinde yıldızlı "güvenli kareler" kuralı açılır.
- Ev yoluna tam sayıyla girilir; zar fazla gelirse o piyon oynatılamaz. Oynatılabilir piyon yoksa sıra geçer.
- Dört piyonunu ilk eve sokan kazanır. 4 kişilik maçta sıralama 1-4 olarak çıkar.
- Puan (liderlik tablosu için): kazanmada `1000 + kırılan rakip piyonu × 50 − tur sayısı × 5` (alt sınır 100). Kaybedilen maçta skor verilmez.
- Bilgisayar zekâsı kural tabanlıdır: her olası hamleye puan verir (kırma, eve girme, kaçma, güvenli kareye gitme, başlangıçtan çıkma) ve rakip karakterine göre ağırlıkları değişir.

## İlerleme ve geri gelme
- **Turnuva kampanyası:** 4 lig × 6 maç = 24 maç (Mahalle Kahvesi, Semt Turnuvası, Şehir Kupası, Usta Masası). Her ligin son maçı 4 kişilik "final".
- **Rakip karakterleri** (lig ilerledikçe zorlaşır, uydurma isimler): Temkinli Tülay (kırmayı sevmez, kaçar), Saldırgan Selim (her fırsatta kırar), Hesapçı Hikmet (riskleri hesaplar), Usta Ümran (en iyi ağırlıklar + piyonları birlikte ilerletir). Her karakterin kısa bir laf balonu var ("Kızma birader!").
- **Maç başına 1-3 yıldız:** 1★ maçı kazan; 2★ en az 2 rakip piyonu kır; 3★ hiç piyonun kırılmadan kazan (finallerde: ilk 30 turda bitir).
- **Açılan içerik:** yıldızlarla açılan 6 tahta teması (Klasik, Gece, Ahşap, Deniz, Bahçe, Altın), 5 piyon/zar görünümü (emoji: ⚫ 🐱 🚗 ⭐ 👑), lig geçişlerinde kural varyantları serbest modda seçilebilir hale gelir: "Hızlı oyun" (her oyuncu 2 piyonla başlar), "Güvenli kareler", "Çift zar".
- **Günlük görevler:** her gün 3 görev (ör. "Bir maçta 3 piyon kır", "Bir 6 serisi yap", "Usta zorlukta bir maç kazan"); her biri 1 bonus yıldız verir. Görevler tarihten tohumlanır.
- **İstatistik ve rozet:** toplam galibiyet, kırılan piyon, en uzun galibiyet serisi; 24 maç bittiğinde "Masanın Ustası" rozeti.
- **Kayıt:** `mo_kizma` anahtarında `{ yildiz: {maçNo: 0-3}, tema, piyon, gorev: {tarih, tamamlanan}, ist: {...} }`. Bozuk kayıtta sıfırdan başlanır.
- **İlk gün:** Mahalle Kahvesi'nin 6 maçını bitirip Gece temasını açar, ilk günlük görevleri tamamlar. **İlk hafta:** Şehir Kupası'na ulaşır, 3★ için maçları tekrar oynar, kural varyantlarını serbest modda dener.

## Kontroller
- **Dokunmatik/fare:** "Zar at" düğmesine veya zara dokun; oynatılabilir piyonlar parlar, birine dokununca hareket eder. Tek oynatılabilir piyon varsa otomatik oynar (ayarlarla kapatılabilir).
- **Klavye:** Boşluk/Enter zar atar; 1-4 tuşları veya ←/→ ile oynatılabilir piyonlar arasında gezilip Enter ile seçilir. P duraklatır.

## Görsel tasarım
- Kare tahta, `min(92vw, 520px)` genişlikte, CSS grid veya canvas ile çizilir; 360 px ekranda tahta ve zar alanı sığmalı.
- Oyuncu renkleri: kırmızı `#ef4444`, mavi `#3b82f6`, yeşil `#22c55e`, sarı `#eab308`. Ev yolları oyuncu rengiyle hafif boyalı.
- Zar CSS ile çizilen noktalı kare; atışta 400 ms dönme animasyonu. Piyon kare kare zıplayarak ilerler (her adım ~120 ms), kırılan piyon başlangıca kayar.
- Sıradaki oyuncu tahta kenarında vurgulanır; rakip avatarları emoji (🧓 👨 🧔 👩‍🦳).

## Sayfa metinleri
- title: `Kızma Birader Oyna - Ücretsiz Online | MiniOyun`
- meta description: `Kızma Birader'i ücretsiz oyna: zar at, rakip piyonları kır, 4 piyonunu eve ilk sen sok. Bilgisayara karşı 24 maçlık turnuva, yıldızlar ve temalar.`
- Nasıl oynanır: Kızma Birader, 2-4 kişiyle oynanan klasik bir zar ve piyon oyunudur. Sıran geldiğinde zarı at ve piyonlarından birini zar kadar ilerlet. Başlangıçtaki bir piyonu tahtaya çıkarmak için 6 atman gerekir; 6 attığında bir kez daha zar atarsın. Bir rakibin piyonunun durduğu kareye gelirsen onu kırar ve başlangıcına geri yollarsın. Tahtayı tam tur dolaşan piyon kendi renkli ev yoluna girer; eve tam sayıyla girmelisin. Dört piyonunu ilk eve sokan oyuncu kazanır. Turnuva modunda dört ligde 24 maç oynar, her maçta üç yıldıza kadar toplarsın.
- İpuçları: Piyonlarını tek tek değil dengeli ilerlet; tek bir piyonu öne sürmek onu rakiplerin hedefi yapar. Bir rakibin 1-6 kare gerisinde durmak tehlikelidir, mümkünse kırılabileceğin karelerden uzak dur. 6 attığında yeni piyon çıkarmak mı yoksa öndeki piyonu kaçırmak mı daha iyi, rakiplerin konumuna bakarak karar ver. Saldırgan rakiplere karşı temkinli, temkinli rakiplere karşı cesur oyna. Eve yaklaşan piyonu boşuna bekletme; ev yolundaki piyon kırılamaz.
- SSS önerisi: "Üst üste üç 6 atarsam ne olur?" "Kırılan piyon nereye gider?" "Günlük görevler ne zaman yenilenir?"

## Zorluk ve günlük mod
- Zorluk turnuvada rakip karakteriyle artar; serbest modda Kolay / Orta / Usta seçilir (`seviye` olarak verilir; kampanyada `'maç N'`).
- Günlük mod uygundur: zar dizisi `MiniOyun.rastgele()` ile tohumlanır, böylece herkes aynı gün aynı zar dizisiyle aynı rakiplere karşı oynar ve puanlar karşılaştırılabilir. `games.json` kaydına `"gunluk": true` eklenir.
- (İsteğe bağlı, sonraki iyileştirme) Dört Bağlantı'nın çevrim içi oda altyapısıyla arkadaşa karşı oda; bu fikrin kabul kriteri değildir.

## Kabul kriterleri
- [ ] Kurallar doğru: 6 ile çıkış, 6'da tekrar atış, üç 6'da sıra yanması, kırma, kendi piyonunun üstüne konamama, eve tam sayıyla giriş, oynatılabilir piyon yoksa sıra geçmesi.
- [ ] 2 ve 4 oyunculu maç, bilgisayara karşı ve aynı cihazda yerel mod çalışıyor.
- [ ] 4 rakip karakteri farklı davranıyor (en az kırma tercihi ve kaçma ağırlığı farklı).
- [ ] 24 maçlık turnuva haritası, maç başına 1-3 yıldız, kilitli maçlar sırayla açılıyor.
- [ ] Temalar, piyon görünümleri ve kural varyantları yıldızla/lig geçişiyle açılıyor ve seçim kaydediliyor.
- [ ] Günlük 3 görev tarihe göre değişiyor ve tamamlanınca bonus yıldız veriyor.
- [ ] İlerleme `mo_kizma` anahtarında kalıcı; bozuk kayıtta oyun hata vermeden sıfırdan başlıyor.
- [ ] `MiniOyun.oyun` kaydı (pause/resume/canPause, seviye), `MiniOyun.bitti` (skor yalnızca kazanınca), `MiniOyun.ses` (zar: tik, kırma: puan, kazanma: kazan, kaybetme: kaybet), rastgelelik `MiniOyun.rastgele()` ile.
- [ ] Klavye ve dokunmatikle tüm maç oynanabiliyor; 360 px ekranda taşma yok.
- [ ] `.game-desc` en az 150 kelime özgün Türkçe metin (nasıl oynanır, ipuçları, SSS).
- [ ] `tools/tests/kizma-birader.js`: `page.clock` ile hızlandırılmış bir maç oynanıyor, kırma ve eve giriş gerçekleşiyor, maç sonunda yıldız `mo_kizma` içine yazılıyor.
- [ ] `agents/4-gelistirici.md` kalite listesinin 9 maddesi karşılanıyor.

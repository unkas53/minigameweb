durum: bekliyor
slug: renk-tuzagi
baslik: Renk Tuzağı
kategori: Refleks
oncelik: 4

## Özet
Ekranda farklı renkte yazılmış bir renk adı çıkar (ör. kırmızıyla yazılmış "MAVİ"); oyuncu kelimeyi değil yazının rengini 60 saniye içinde olabildiğince hızlı ve doğru seçer.

## Neden bu oyun
- Sitede **Refleks** kategorisinde hiç oyun yok (Spor da boş; Kelime için Kelime Tahmin kuyrukta). Bu oyun Refleks kategorisini açar.
- "refleks oyunu", "renk oyunu", "dikkat oyunu", "beyin oyunları" ve "zeka oyunları" Türkiye'de sürekli aranan ifadeler. Renk-kelime çelişkisi (Stroop etkisi) okul ve kişisel gelişim içeriklerinde yaygın bilinen bir dikkat testi olduğu için "stroop testi online" gibi uzun kuyruk aramalara da girer.
- Rakip mini oyun sitelerinde "beyin egzersizi / dikkat" oyunları kalıcı olarak popüler; kısa (1 dakikalık) tur yapısı tekrar oynatmayı artırır.
- Herkese aynı soru dizisi verilebildiği için günlük meydan okumaya uygun; puan karşılaştırması liderlik tablosuna çok iyi oturur.
- Henüz rakip analizi raporu yok; seçim kategori boşluğuna ve arama talebine dayanıyor.
- Tamamen CSS ve metinle yapılır, görsel/ses dosyası gerekmez.

## Oynanış
- Renk paleti (6 renk, adlarıyla): KIRMIZI `#ef4444`, MAVİ `#3b82f6`, YEŞİL `#22c55e`, SARI `#eab308`, MOR `#a855f7`, TURUNCU `#f97316`. Hepsi koyu zeminde okunur olmalı.
- Ortada büyük bir kelime gösterilir: bir renk adı, başka bir renkle yazılmış. Altında renk düğmeleri vardır. Oyuncu **yazının rengine** karşılık gelen düğmeye basar.
- Doğru cevap: +10 puan, art arda doğrulara seri bonusu (seri 5'ten sonra her doğru +15, 10'dan sonra +20). Ekranda seri sayacı.
- Yanlış cevap: seri sıfırlanır, puan düşmez ama süreden 2 saniye gider; düğme kısa kırmızı titreşim yapar.
- Tur süresi 60 saniye (üstte ilerleme çubuğu). Süre bitince oyun biter.
- Kazanma/kaybetme yok; amaç rekor puan. `MiniOyun.bitti` penceresinde puan, doğru/yanlış sayısı, isabet yüzdesi, ortalama tepki süresi (ms) gösterilir.
- Soru üretimi: kelime ile yazı rengi **en az %75** oranında farklıdır (tuzak), %25 aynı olabilir (oyuncuyu ritimden çıkarır). Art arda aynı doğru renk en fazla 2 kez gelir.
- Rekor: puan (varsayılan, `rekor` alanı gerekmez), `MiniOyun.getBest/setBest` ile zorluk başına ayrı.

### Zorluk seviyeleri (oyun başlamadan seçilir)
- **Kolay:** 4 renk (kırmızı, mavi, yeşil, sarı), düğmeler sabit yerinde ve üzerlerinde renk adı + renkli daire.
- **Normal:** 6 renk, düğmeler sabit, üzerlerinde yalnızca renk adı **beyaz yazıyla** (renkli zemin yok).
- **Zor:** 6 renk, düğme yazıları da tuzaklı (ör. "YEŞİL" yazan düğme mor renkte; doğru cevap düğmenin **adına** göre verilir, çünkü soru "yazının rengi nedir?"), ve her 5 soruda bir düğmelerin sırası karışır. Ayrıca yarısında "Kelimeyi seç" kural değişimi turları: üstte "KELİME" etiketi çıkınca oyuncu yazının rengini değil kelimenin anlamını seçer (etiket belirgin, mor arka planlı).
- `MiniOyun.oyun({ seviye: function () { return level; } })` verilir; liderlik tablosu seviye başına ayrıdır.

## Kontroller
- **Klavye:** Düğmeler soldan sağa 1-6 rakam tuşlarıyla; ayrıca baş harf kısayolları (K, M, Y, S, P=mor için "M" çakıştığı için mor = `P`, turuncu = `T`; kısayollar düğme üstünde küçük harfle gösterilir). Boşluk tuşu oyun bitmişse yeni tur başlatır. `P`/`Esc` çerçevenin duraklatmasına bırakılır (mor kısayolu çakışırsa mor için yalnızca rakam kullanılır; geliştirici çakışmayı çerçevenin tuşlarına göre çözer).
- **Dokunmatik/fare:** Kelimenin altında 2x2 (kolay) veya 3x2 (normal/zor) düğme ızgarası; düğmeler en az 56px yüksek, `touch-action: manipulation`, çift dokunmada yakınlaştırma yok. `pointerdown` ile tetiklenir (tıklama gecikmesi olmasın).
- Oyun süreli olduğu için `pause`/`resume`/`canPause` verilir; duraklatınca süre durur ve kelime gizlenir (duraklatıp düşünmek avantaj olmasın). `MiniOyun.duraklatildi()` iken girişler yok sayılır.

## Görsel tasarım
- Sitenin koyu tema değişkenleri. Oyun alanı en fazla 480px genişlik, ortalı.
- Kelime: kalın, 56-72px (telefonda `clamp`), harfler büyük ve Türkçe karakterlerle (`MAVİ`, `YEŞİL`). Her yeni soruda 120 ms'lik küçük ölçek "pop" animasyonu.
- Doğru cevapta kelimenin çevresinde kısa yeşil parıltı, yanlışta kırmızı titreşim. `prefers-reduced-motion` açıksa animasyonlar kapalı.
- Üstte: puan, seri (🔥 x5), süre çubuğu (son 10 saniyede kırmızıya döner).
- Renk körü desteği: ayarlarda "Desen" seçeneği her renge bir şekil ekler (● ■ ▲ ◆ ★ ✚) hem kelimenin yanında hem düğmede; tercih `localStorage`'da saklanır. Bu açıkken rekor ayrı tutulmaz (zorluğu değiştirmez, sadece erişilebilirlik).
- Simge: `🎨`, kart renkleri `["#f472b6", "#f59e0b"]`.

## Sayfa metinleri
- title: `Renk Tuzağı - Online Refleks ve Dikkat Oyunu | MiniOyun`
- meta description: `Kelimeyi değil rengini seç! 60 saniyede refleksini ve dikkatini ölçen ücretsiz renk oyunu. Üç zorluk, günlük meydan okuma ve liderlik tablosu.`
- **Nasıl oynanır:** Ekranın ortasında bir renk adı belirir, ama bu kelime çoğu zaman başka bir renkle yazılmıştır. Örneğin kırmızı renkle yazılmış "MAVİ" kelimesini görürsen doğru cevap Kırmızı'dır. Kelimeyi okumaya değil, harflerin rengine bak ve alttaki düğmelerden o rengi seç. Her doğru cevap puan kazandırır, art arda doğru cevap verdikçe seri bonusu artar. Yanlış cevap serini sıfırlar ve süreden iki saniye götürür. Tur 60 saniye sürer; süre bitince puanın, isabet oranın ve ortalama tepki süren gösterilir. Zor seviyede düğmeler de karışır ve bazı turlarda kural değişir: "KELİME" etiketi çıktığında bu kez kelimenin anlamını seçmen gerekir.
- **İpuçları:** Beynimiz okumayı otomatik yapar, bu yüzden kelimeye odaklanmak seni yavaşlatır. Gözlerini harflerin tamamına değil, ortadaki bir harfin rengine kilitlemeyi dene. Acele edip yanlış yapmak iki saniye kaybettirdiği için ilk saniyelerde ritmini bulmaya odaklan, sonra hızlan. Klavyede oynuyorsan parmaklarını 1-6 rakam tuşlarının üzerinde tut. Zor seviyede her yeni soruda önce üstteki etikete bak: "RENK" mi, "KELİME" mi?
- **Kısa SSS (`.game-desc` sonunda):** "Bu oyun neyi ölçer?" → Seçici dikkat ve tepki hızını; psikolojide renk-kelime çelişkisi testi olarak bilinen etkiden yararlanır. "Renk körüyüm, oynayabilir miyim?" → Ayarlardaki Desen seçeneği her renge bir şekil ekler. "Günlük modda ne değişir?" → O gün herkes aynı soru dizisini alır, puanlar karşılaştırılabilir.
- `.game-desc` toplamda en az 150 kelime özgün Türkçe metin.

## Zorluk ve günlük mod
- Üç seviye (Kolay, Normal, Zor), yukarıda tanımlı.
- **Günlük moda uygun:** soru dizisi (kelime, yazı rengi, zor seviyede düğme sırası ve kural değişimi zamanları) `var rnd = MiniOyun.rastgele();` ile üretilir. `?gunluk=YYYY-MM-DD` ile herkes aynı diziyi aynı sırayla alır; tepki hızı farkı puanı belirler. Günlük mod Normal seviyede oynanır. Dizinin süreden bağımsız olarak önceden üretilmesi (ör. 200 soru) yeterlidir. `games.json` kaydına `"gunluk": true` eklenir.

## Kabul kriterleri
- [ ] `games/renk-tuzagi/index.html` ve `game.js` mevcut oyun sayfalarının yapısını izliyor (canonical, JSON-LD `genre: Refleks`, nasıl oynanır, ipuçları, SSS, reklam alanları, çerez penceresi); tüm bağlantılar göreceli.
- [ ] `games.json`'a `Refleks` kategorisinde kayıt (`icon: 🎨`, colors, `"gunluk": true`) eklendi, `npm run build` çalıştırıldı; `kategori/refleks/` sayfası oluştu ve kategori çubuğunda Refleks görünüyor.
- [ ] Doğru düğme her zaman yazının rengi (Zor'daki "KELİME" turlarında kelimenin anlamı); oynanış testi en az 10 soruyu DOM'dan doğru cevabı okuyup cevaplıyor ve puanın arttığını doğruluyor.
- [ ] Tuzak oranı: ilk 100 soruda kelime ≠ renk olanların oranı en az %70 (testte sayılır); art arda aynı doğru renk 3 kez gelmiyor.
- [ ] Yanlış cevap seriyi sıfırlıyor ve süreden 2 sn düşüyor; seri bonusu doğru hesaplanıyor.
- [ ] 60 saniye bitince `MiniOyun.bitti` açılıyor (puan, doğru/yanlış, isabet %, ortalama ms); `skor` = puan; rekor seviye başına ayrı kaydediliyor; "Tekrar oyna" sıfırlıyor.
- [ ] Duraklatınca süre duruyor ve kelime gizleniyor; duraklatmada girişler yok sayılıyor.
- [ ] Klavye kısayolları (1-6) ve dokunmatik (`pointerdown`) çalışıyor.
- [ ] Günlük modda (`?gunluk=2026-10-24`) iki açılışta ilk 10 soru birebir aynı.
- [ ] `MiniOyun.ses`: doğru (`puan`), yanlış (`tik` veya `kaybet`), süre bitişi (`kazan` rekor ise, değilse `kaybet`).
- [ ] Desen (renk körü) seçeneği şekilleri gösteriyor ve tercih saklanıyor.
- [ ] 360px genişlikte yatay kaydırma yok; kelime ve tüm düğmeler kaydırmadan aynı ekranda; düğmeler en az 56px.
- [ ] `tools/tests/renk-tuzagi.js` oynanış testi var ve `node tools/smoke-test.js` hatasız geçiyor.
- [ ] `agents/4-gelistirici.md` kalite listesinin tamamı karşılanıyor.

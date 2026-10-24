durum: bekliyor
slug: lokanta-telasi
baslik: Lokanta Telaşı
kategori: Arcade
oncelik: 4

## Özet
Kapıdan giren müşterilerin siparişlerini (dürüm, şiş, çorba, ayran, sütlaç...) sabırları bitmeden hazırlayıp servis ettiğin; 40 günlük kariyer haritasında yıldız ve bahşiş toplayıp tezgâh, ocak ve menü yükselttiğin, küçük bir büfeyi şehrin en ünlü lokantasına çevirdiğin sipariş yetiştirme (restoran) oyunu.

## Neden bu oyun
- Son rakip analizi (`reports/rakip-analizi/2026-10-24-02.md`) "Papa's Pizzeria / Süper Barmen" satırında sipariş yetiştirme türünün Coolmath ve KralOyun'da popüler olduğunu, "bölümlü, yükseltmeli" olduğunu ve sitede hiç olmadığını yazıyor; "Monkey Mart" satırı da işletme + yükseltme karışımının Poki'de güçlü olduğunu gösteriyor. Fırsatlar listesindeki ilk yedi öneri yayında (Harf Çarkı, Top Sıralama, Blok Bulmaca, Olta Ustası, Kızma Birader) ya da sırada (Mahjong, Drift Ustası); bu fikir listedeki sıradaki büyük boşluğu kapatıyor.
- "yemek yapma oyunları", "restoran oyunları", "döner oyunu", "pizza oyunu", "aşçılık oyunları" Türkiye'de çocuk ve genç kitlede sürekli aranan oyun kümeleridir; Türk sitelerinde ayrı "Yemek" ve "Restoran" kategorileri bulunur. Tür adı geneldir, marka değildir. Türk mutfağı teması (dürüm, şiş, mercimek çorbası, ayran, çay, sütlaç) rakiplerdeki yabancı içerikli oyunlardan ayrışır ve yerel aramalara uyar. Hiçbir ticari oyunun adı, karakteri veya görseli kullanılmaz.
- **Kategori dengesi:** `games.json`'da Arcade'de 2 oyun (Yılan, Tuğla Kırma) var, Bulmaca'da 6. Bekleyen fikirler Hafıza (Mahjong) ve Spor'a (Drift Ustası) gidiyor; Arcade, Kelime ve Refleks 2'şer oyunla en az olanlar. Hızlı dokunma ve zaman baskısı Arcade'e oturur.
- ORTAK.md "Oyun derinliği": tür doğası gereği bölümlü ve yükseltmelidir (öncelikli türlerden "yükseltmeli arcade"). Bir gün (bölüm) 90-150 saniye; 40 gün, yükseltmeler, açılan yemekler ve süslemeler saatlerce içerik sunar. Görsel/ses dosyası gerekmez: emoji ve CSS. Tek dosya JavaScript ile 800-1000 satırda yapılabilir.

## Oynanış
- **Ekran düzeni (dikey):** Üstte tezgâh: en fazla 3 (yükseltmeyle 4) müşteri yan yana durur; her müşterinin üstünde sipariş balonu (1-3 kalem) ve altında sabır çubuğu. Ortada hazırlık alanı: 1 tabak (yükseltmeyle 2 tabak) ve pişirme yerleri (ızgara, çorba kazanı). Altta malzeme rafı: büyük dokunma düğmeleri.
- **Yemekler ve tarifleri (malzemeler sırasız, eksiksiz olmalı):**
  - 🥙 **Dürüm:** lavaş + et + 🍅 domates + 🧅 soğan (et ızgarada pişer).
  - 🍢 **Şiş:** şiş ızgaraya konur, pişince tabağa alınır; isteğe göre 🌶️ biber.
  - 🍲 **Mercimek çorbası:** kazandan kâse doldur (dokun-basılı tut, çizgide bırak) + 🍋 limon.
  - 🥗 **Çoban salatası:** 🍅 + 🥒 + 🧅.
  - 🥛 **Ayran**, 🍵 **çay:** tek dokunuşla hazır içecekler (çay demlenir, 4 sn bekleme).
  - 🍮 **Sütlaç:** dolaptan hazır, yalnız üstüne tarçın serpilir.
  - Yemekler günlere göre açılır (bkz. ilerleme).
- **Pişirme:** Izgaraya konan et/şiş üç aşamadan geçer: çiğ (kırmızı) → pişmiş (kahverengi, yeşil halka) → yanık (siyah, 4 sn sonra). Pişmişken alınırsa tam puan, yanığı çöpe atmak gerekir (çöp kutusu düğmesi). Izgara yerleri başta 2, yükseltmeyle 4.
- **Servis:** Tabak hazırlanınca müşteriye dokun (veya tabağı müşteriye sürükle): sipariş eksiksiz ve doğruysa ödeme + bahşiş alınır, yanlışsa müşteri "Bu değil!" der, tabak geri gelir ve sabrı %15 düşer. Çok kalemli siparişte kalemler ayrı ayrı servis edilebilir.
- **Sabır:** Her müşterinin sabır süresi (12-30 sn, müşteri tipine göre) azalır; yeşil → sarı → kırmızı. Bitince müşteri kızgın gider, o gün için bir ❤️ kaybedilir (günde 3 ❤️). Üç kalp biterse gün kaybedilir (`kaybetti: true`).
- **Müşteri tipleri:** 🧑 normal; 👵 sabırlı ama az bahşiş; 🧑‍💼 aceleci (kısa sabır, büyük bahşiş); 🧒 çocuk (yalnız sütlaç/ayran, çok sabırlı); 🧑‍🍳 eleştirmen (8. günden itibaren arada bir; hızlı ve kusursuz servis ister, mutlu giderse gün sonu +1 itibar yıldızı).
- **Puan (gün kazancı):** Yemek fiyatı + bahşiş. Bahşiş kalan sabırla orantılı (`fiyat × kalanSabırOranı × 0.5`); peş peşe hatasız servisler kombo verir (x1.2, x1.5, en fazla x2). Yanık yemek ve yanlış servis kombo'yu sıfırlar.
- **Gün sonu:** Her gün belirli sayıda müşteri gelir (8 → 30) veya süre biter (90-150 sn). Gün bitince kazanılan para (💰) ve yıldızlar gösterilir.
- **Zorluk artışı:** Müşteri sıklığı ve sayısı artar, sabır süresi kısalır, sipariş başına kalem sayısı artar (1 → 3), yeni yemekler ve eleştirmen gelir; sonraki semtlerde yağmurlu gün (müşteriler çorbaya yönelir), akşam yoğunluğu (son 30 sn çift müşteri) gibi gün olayları eklenir.

## İlerleme ve geri gelme
- **Harita:** 40 gün, 4 semt × 10 gün, yatay kayan sokak haritası; her semtte lokanta görünümü değişir.
  1. 🏪 **Mahalle Büfesi (1-10):** dürüm, ayran, şiş; 3 müşteri yeri; 1. gün 5 adımlık eğitim (malzeme koy, pişir, servis et, yanığı at, sabır).
  2. 🌉 **Sahil Lokantası (11-20):** çorba ve çay açılır; aceleci müşteriler sıklaşır; yağmurlu gün olayı.
  3. 🏛️ **Çarşı Lokantası (21-30):** salata ve sütlaç açılır; 3 kalemli siparişler; eleştirmen sıklaşır.
  4. 🌃 **Meydan Restoranı (31-40):** tüm menü, akşam yoğunluğu, 40. gün "Büyük Açılış" (30 müşteri).
- **Yıldızlar (gün başına 1-3):** 1 ⭐ günü bitir (kalp kalırken); 2 ⭐ kazanç hedefi (gün tanımında); 3 ⭐ yüksek hedef ve en fazla 1 kaçan müşteri. Semt kilitleri: Sahil 18 ⭐, Çarşı 42 ⭐, Meydan 70 ⭐ (toplam 120 ⭐).
- **Kalıcı yükseltmeler (💰 ile, her biri 3-5 seviye):** Izgara (yer sayısı 2→4, pişme hızı), Tezgâh (müşteri yeri 3→4), İkinci tabak, Çay ocağı (demleme süresi 4→1 sn), Dekor (tüm müşterilerin sabrı +%8 / seviye), Garson zili (sabrı kırmızıya düşen müşteriye bir kez +3 sn), Kasa (bahşiş +%10 / seviye). Fiyatlar seviye başına artar; 40 günün tamamı için ~%80'i alınabilecek şekilde ayarlanmalı (gün kazançlarının toplamı simülasyonla kontrol edilir).
- **Açılan süslemeler (yalnızca görünüş):** önlük renkleri, tezgâh örtüsü desenleri, tabela adı (oyuncu kendi lokantasına isim verir, en fazla 16 karakter, yalnızca ekranda ve kayıtta). Yıldız eşiklerinde (10/30/60/100 ⭐) ve 7 günlük seride açılır; 🎃 Cadılar Bayramı süslemesi seri ödülü olarak.
- **Günlük görevler:** Her gün tohumla seçilen 3 görev (ör. "20 dürüm servis et", "hiç yanık yapma", "5'li kombo yap"); üçü bitince 💰 ödülü + seri sayacı.
- **Serbest vardiya:** Tüm açılmış menüyle sonsuz akan müşteriler, 3 kalp bitene kadar; en yüksek kazanç saklanır. Kariyer bitince de geri dönme sebebi.
- **Kayıt anahtarı:** `mo_lokanta` → `{ gunler: { "1": { yildiz, enIyiKazanc }, ... }, para, yukseltme: { izgara, tezgah, tabak, cay, dekor, zil, kasa }, susleme: { secili, acik: [] }, tabela, gorev: { gun, liste, ilerleme }, seri, sonGun, serbestRekor }`. Kayıt bozuksa sıfırdan başlar, hata vermez.
- **İlk gün:** Mahalle Büfesi'nin 6-10 gününü bitirir, ızgara ve dekorun ilk seviyelerini alır, lokantasına isim verir. **İlk hafta:** Sahil ve Çarşı'ya geçer, çorba/çay/salata ile çok kalemli siparişleri öğrenir, 3 yıldız için eski günlere döner, görev serisiyle süsleme açar. Meydan Restoranı ve 120 ⭐ uzun vadeli hedef; sonrasında serbest vardiya ve günlük meydan okuma.

## Kontroller
- **Dokunmatik / fare:** Malzeme düğmesine dokun → aktif tabağa eklenir. Izgaraya konacak malzemeler dokununca boş ızgara yerine gider; pişmiş ete dokununca tabağa geçer. Müşteriye dokun → tabak servis edilir. Tabağa uzun bas (veya 🗑️) → tabak boşaltılır. Sürükle-bırak da desteklenir ama zorunlu değildir; tüm işler dokunmayla yapılabilir. Düğmeler en az 44 px, `touch-action: manipulation`.
- **Klavye:** 1-9 tuşları raftaki malzemeler (rafın altında küçük rakam etiketleri), Q/W/E/R ızgara yerleri (pişmişi tabağa al), A/S/D/F müşteri yerlerine servis, Tab aktif tabağı değiştirir, X tabağı boşaltır, P duraklat.

## Görsel tasarım
- **Renkler:** sıcak lokanta paleti: tezgâh ahşap #b45309 → #78350f, duvar krem #fef3c7, raf #fde68a, ızgara koyu gri #374151 ve kor turuncusu #f97316. Semt temaları arka plan şeridiyle: Büfe #fcd34d, Sahil #7dd3fc, Çarşı #fca5a5, Meydan #a78bfa.
- **Müşteriler:** büyük emoji (40 px), sipariş balonu beyaz yuvarlatılmış kutu içinde kalem emojileri; sabır çubuğu 6 px, renk geçişli. Kızgın gidişte müşteri 💢 ile kayar; mutlu gidişte 💰 ve bahşiş rakamı yukarı süzülür.
- **Pişme:** et emojisi (🥩) üstünde dairesel ilerleme halkası; pişince yeşil halka ve hafif zıplama, yanınca 💨 duman ve gri filtre.
- **Oyun alanı:** genişlik en fazla 480 px, 360 px ekranda 3 müşteri yeri (her biri ~110 px) ve 2 sıra raf (5'er düğme) taşmadan sığar; yükseklik ~600 px, oyun sırasında sayfa kaymaz.
- **Kart rengi (`games.json`):** `["#f97316", "#b45309"]`, ikon `🥙`.

## Sayfa metinleri
- **title:** Lokanta Telaşı - Ücretsiz Restoran ve Yemek Oyunu | MiniOyun
- **meta description:** Ücretsiz restoran oyunu: dürüm, şiş ve çorba hazırla, müşterileri bekletmeden servis et, 40 günde lokantanı büyüt. İndirmeden hemen oyna.
- **Nasıl oynanır:** Lokanta Telaşı'nda müşteriler tezgâha gelir ve ne istediklerini balonda gösterir. Raftaki malzemelere dokunarak tabağı hazırla: dürüm için lavaş, ızgarada pişmiş et, domates ve soğan gerekir. Eti ızgaraya koy, kahverengiye dönüp yeşil halka çıkınca tabağa al; fazla bekletirsen yanar ve çöpe atman gerekir. Tabak hazır olunca müşteriye dokunarak servis et. Her müşterinin bir sabır çubuğu vardır; çubuk bitmeden servis edersen ödemeyi ve bahşişi alırsın, biterse müşteri kızgın gider ve bir kalp kaybedersin. Günü kalp bitmeden tamamla, kazanç hedeflerine göre yıldız topla ve kazandığın parayla ızgarayı, tezgâhı ve dekoru yükselt.
- **İpuçları:** Sipariş gelmeden ızgaraya bir et koymak zaman kazandırır, ama yanmasın diye gözünü ızgaradan ayırma. Önce sabrı en az kalan müşteriye bak; aceleci müşteriler büyük bahşiş bırakır ama çabuk gider. Peş peşe hatasız servisler kombo verir, yanlış tabak kombo'yu sıfırlar. İlk paranı ızgaraya ve dekora harcamak sonraki günleri çok kolaylaştırır. Eleştirmeni mutlu gönderirsen gün sonunda ek yıldız kazanırsın.
- **Kısa SSS (metinde 3 soru):** "İlerlemem kaydediliyor mu?" (Evet, günler, para ve yükseltmeler bu tarayıcıda otomatik kaydedilir.) / "Para nasıl kazanılır?" (Her servis yemeğin fiyatını ve kalan sabra göre bahşiş kazandırır; günlük görevler ek para verir.) / "Günlük Lokanta nedir?" (Her gün herkese aynı müşteri sırası gelir, kazancını liderlik tablosunda karşılaştırırsın.)
- `.game-desc` toplamı en az 150 kelime olmalı (yukarıdaki metinler yeterli).

## Zorluk ve günlük mod
- **Zorluk:** Günlerle artar (müşteri sayısı ve sıklığı, sabır, kalem sayısı, yeni yemekler, gün olayları). Liderlik tablosu için `seviye: 'gün N'`; serbest vardiyada `'serbest'`; günlük modda `'günlük'`.
- **Günlük mod: uygun, `"gunluk": true`.** `?gunluk=YYYY-AA-GG` ile açılınca harita yerine doğrudan günün vardiyası başlar: Çarşı düzeyinde bir gün (tüm menü, 20 müşteri, 120 sn), müşteri sırası, tipleri ve siparişleri `MiniOyun.rastgele()` tohumuyla üretilir, böylece herkese aynı sıra gelir. Günlük modda kalıcı yükseltmeler **kullanılmaz** (herkes temel lokantayla oynar, karşılaştırma adil olur). Skor gün kazancıdır (puan, büyük iyi; `rekor` alanı eklenmez).
- Kariyer günleri de tohumlu üretilir (gün numarasından), böylece aynı gün tekrar oynandığında aynı müşteriler gelir ve yıldız hedefleri adil kalır.

## Kabul kriterleri
- [ ] `games/lokanta-telasi/index.html`, `game.js`, `games.json` kaydı (`"category": "Arcade"`, `"gunluk": true`) ve `npm run build` çıktısı mevcut; Arcade kategori sayfasında 3 oyun görünüyor.
- [ ] Tarif kontrolü doğru: eksik veya fazla malzemeli tabak servis edilemiyor (müşteri reddediyor, sabır düşüyor); malzeme sırası önemsiz.
- [ ] Izgara üç aşama (çiğ/pişmiş/yanık) zamanlamayla doğru geçiyor; yanık et tabağa alınamıyor, çöpe atılabiliyor.
- [ ] Sabır çubuğu azalıyor; biten müşteri gidip kalp düşürüyor; 3 kalp bitince gün kaybediliyor ve `bitti` `kaybetti: true` ile skorsuz çağrılıyor.
- [ ] Bahşiş kalan sabırla, kombo hatasız servislerle doğru hesaplanıyor; yanlış servis ve yanık kombo'yu sıfırlıyor.
- [ ] 40 gün, 4 semt; yıldız koşulları (bitir / hedef / yüksek hedef + en fazla 1 kaçan) doğru; semt kilitleri yıldız eşikleriyle açılıyor; yemekler belirtilen semtlerde açılıyor.
- [ ] Yükseltmeler para ile alınıyor, etkileri oyunda görülüyor (ör. ızgara yer sayısı, çay demleme süresi, müşteri yeri), `mo_lokanta` içinde kalıcı.
- [ ] Süslemeler ve tabela adı kaydediliyor, yeniden açılışta görünüyor; tabela adı 16 karakterle sınırlı ve HTML olarak değil metin olarak basılıyor.
- [ ] Günlük görevler tohumla seçiliyor, ilerleme ve seri kaydediliyor; serbest vardiya rekoru saklanıyor.
- [ ] Günlük modda (`?gunluk=2026-10-24`) iki açılışta aynı müşteri sırası geliyor; yükseltmeler uygulanmıyor.
- [ ] Duraklatma (`pause`/`resume`/`canPause`) sabır ve pişme zamanlayıcılarını durduruyor; duraklatılmışken girişler yok sayılıyor.
- [ ] `mo_lokanta` bozuk JSON içerdiğinde oyun sıfırdan başlıyor, konsolda hata yok.
- [ ] Kontroller: dokunmayla tüm işler yapılabiliyor; klavyede 1-9, Q-R, A-F, Tab, X, P çalışıyor. 360 px genişlikte yatay kaydırma yok.
- [ ] Ses efektleri: malzeme ekleme `tik`, servis `puan`, gün kazanma `kazan`, kızgın müşteri/gün kaybı `kaybet`.
- [ ] `tools/tests/lokanta-telasi.js`: `page.clock` ile saati ileri sararak 1. günü bir "bot" ile (siparişi okuyup malzemeleri basan, eti pişince alan) oynayıp bitiriyor, `.oyun-sonu[open]` penceresini, en iyi skoru, `mo_lokanta` kaydını (gün 1 yıldızı ve para) ve "Tekrar oyna" sıfırlanmasını kontrol ediyor.
- [ ] `agents/4-gelistirici.md` kalite listesinin 9 maddesi karşılanıyor.

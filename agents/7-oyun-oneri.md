# 7. Ajan: Oyun iyileştirme önericisi

**Çalışma sıklığı:** 6 saatte bir
**Yazabileceği yerler:** `reports/test/acik-hatalar.md` (yalnızca yeni hata kaydı), `reports/oyun-iyilestirme/`

## Görev
Yayındaki oyunları oyuncu gözüyle inceleyip onları daha eğlenceli, anlaşılır ve tekrar oynanır yapacak somut iyileştirmeler önermek. Kod yazmaz; önerileri 8. ajan uygular.

## Kapsam dışı (başka ajanların işi)
- **Hatalar:** yanlış çalışan bir şey görürseniz öneri yazmayın, `reports/test/acik-hatalar.md` dosyasına 5. ajanın biçimiyle kayıt ekleyin (aynısı yoksa). Düzeltme 6. ajanın işidir.
- **Kalite listesi eksikleri** (`agents/4-gelistirici.md`): zorluk seviyesi, ses efekti, 150 kelime metin, `MiniOyun.rastgele`, oynanış testi gibi maddeleri geliştirici ajan iyileştirme modunda tamamlar. Bunları öneri olarak yazmayın; test raporundaki puan tablosu zaten izler.
- **SEO ve sayfa metinleri:** 3. ajanın işidir.
- **Yeni oyun:** 1. ajanın işidir.

## Neler önerilir
Oynanışı ve deneyimi değiştiren, kalite listesinin ötesindeki şeyler. Örnekler: yeni oyun modu (süreli mod, sonsuz mod), daha iyi geri bildirim (animasyon, birleşme efekti, kombo göstergesi), ilk kez oynayan için kısa ipucu, geri al düğmesi, oyun dengesinin ayarı (çok kolay/zor bölümler), mobilde daha rahat kontroller, renk körlüğüne uygun renkler, oyun sonunda "bir sonraki hedef" gösterimi.

## Adımlar
1. `agents/ORTAK.md` dosyasını okuyun.
2. `reports/oyun-iyilestirme/` içinde `durum: bekliyor` veya `durum: uygulaniyor` olan öneri sayısını sayın. **4 veya daha fazlaysa hiçbir şey yapmadan çıkın.**
3. `games.json`, tüm öneri dosyaları (her durumda, `reddedildi` olanlar dahil), son test raporundaki kalite puanı tablosu ve `reports/rakip-analizi/` son raporu okuyun.
4. Bir oyun seçin: `status: live`, son 3 gündür yeni öneri almamış ve hakkında `bekliyor`/`uygulaniyor` öneri olmayan oyunlar arasından en az öneri almış olanı. Yeni eklenmiş (son 24 saat) oyunları atlayın; önce test ajanı görsün.
5. Oyunu Playwright ile masaüstü (1280 px) ve mobil (360 px) genişlikte gerçekten oynayın. Rakiplerde aynı türün iyi örneklerinin neyi farklı yaptığına bakın (kopyalamadan).
6. **Tek** bir öneri yazın (bir öneri = bir konu; bir çalışmada yarım günlük işten büyük olmasın). Daha önce önerilmiş veya reddedilmiş bir şeyi tekrar önermeyin.
7. Aşağıdaki şablonla `reports/oyun-iyilestirme/YYYY-AA-GG-<slug>-<kisa-konu>.md` dosyasını oluşturun. Commit: `[oyun-oneri] <oyun adı>: <konu>`. Push edin.

## Şablon
```
durum: bekliyor
oyun: <games.json slug>
baslik: <kısa başlık>
oncelik: <1-5, 5 en yüksek>
boyut: kucuk | orta

## Sorun / fırsat
Oynarken ne gözlendi; oyuncu neden sıkılıyor, takılıyor veya geri gelmiyor.

## Öneri
Ne değişecek; kurallar, ekran, kontroller ayrıntılı. Mevcut rekor anahtarları, günlük mod ve liderlik tablosu nasıl etkilenir.

## Kabul kriterleri
8. ajanın ve test ajanının kontrol edeceği maddeler. Oynanış testine eklenmesi gereken kontrol dahil.
```

## Kurallar
- Oyunun temel kurallarını değiştirip başka bir oyuna dönüştürmeyin. Mevcut rekorları geçersiz kılacak öneri yazmayın; gerekiyorsa yeni mod için ayrı rekor önerin.
- Harici kütüphane, görsel veya ses dosyası gerektiren öneri yazmayın.

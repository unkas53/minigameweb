# 1. Ajan: Oyun fikri bulucu

**Çalışma sıklığı:** saatlik
**Yazabileceği yerler:** `reports/fikirler/`

## Görev
Siteye eklenecek yeni mini oyun fikirleri bulmak ve geliştirici ajanın doğrudan uygulayabileceği kadar ayrıntılı yazmak.

## Adımlar
1. `agents/ORTAK.md` dosyasını okuyun.
2. `reports/fikirler/` içinde `durum: bekliyor` olan fikirleri sayın. **3 veya daha fazlaysa hiçbir şey yapmadan çıkın.**
3. `games.json` ve tüm fikir dosyalarını okuyun; mevcut veya önerilmiş bir oyunu tekrar önermeyin.
4. `reports/rakip-analizi/` içindeki en son raporu okuyun ve oradaki popüler türlerden ve boşluklardan yararlanın.
5. Tek bir yeni fikir seçin. Önce sitede oyunu olmayan veya az olan kategorileri (`categories.json` ile `games.json`'ı karşılaştırın) ve herkese aynı bulmacanın verilebildiği, günlük meydan okumaya uygun oyunları tercih edin. Kriterler: tek dosya JavaScript ile 300-600 satırda yapılabilir, telefonda dokunmatikle oynanabilir, harici görsel/ses dosyası gerektirmez (emoji, canvas çizimi veya CSS kullanılabilir), bir oturum 1-5 dakika sürer, Türkiye'de aranan bir oyun adı veya türü var.
6. Aşağıdaki şablonla `reports/fikirler/YYYY-AA-GG-<slug>.md` dosyasını oluşturun, commit edip push edin.

## Şablon
```
durum: bekliyor
slug: <kucuk-harf-tireli>
baslik: <Türkçe oyun adı>
kategori: <categories.json içindeki bir ad: Bulmaca | Arcade | Hafıza | Kelime | Refleks | Strateji | Spor>
oncelik: <1-5, 5 en yüksek>

## Özet
Bir cümlede oyun.

## Neden bu oyun
Arama talebi, rakiplerde popülerlik, sitedeki boşluk.

## Oynanış
Kurallar, kazanma/kaybetme koşulu, puanlama, zorluk artışı.

## Kontroller
Klavye ve dokunmatik ayrı ayrı.

## Görsel tasarım
Renkler, oyun alanı boyutu, kullanılacak emoji veya şekiller.

## Sayfa metinleri
- title (60 karakterden kısa)
- meta description (155 karakterden kısa)
- "Nasıl oynanır" paragrafı
- "İpuçları" paragrafı

## Zorluk ve günlük mod
Zorluk seviyeleri veya zorluk artışı; oyun günlük meydan okumaya uygun mu (herkese aynı bulmaca verilebilir mi), neden.

## Kabul kriterleri
Geliştirici ve test ajanının kontrol edeceği maddeler listesi. `agents/4-gelistirici.md` içindeki kalite listesini de karşılamalı.
```

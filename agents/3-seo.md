# 3. Ajan: SEO uzmanı

**Çalışma sıklığı:** günlük
**Yazabileceği yerler:** `reports/seo/`, tüm `.html` dosyalarında `<head>` içi (title, meta, canonical, JSON-LD) ve metin içerikleri (açıklama, nasıl oynanır, ipuçları, ana sayfa tanıtım metni), `sitemap.xml`, `robots.txt`. **Oyun mantığına (`game.js`) ve ortak JS/CSS'e dokunmaz.**

## Görev
Sitenin arama motorlarında üst sıralara çıkması için teknik ve içerik SEO'sunu iyileştirmek.

## Adımlar
1. `agents/ORTAK.md` dosyasını ve `reports/rakip-analizi/` son raporundaki "SEO gözlemleri" bölümünü okuyun.
2. Teknik kontrol (her sayfa): benzersiz title (≤60 karakter) ve description (≤155), canonical, tek `h1`, JSON-LD geçerli, `sitemap.xml` tüm oyunları içeriyor ve `lastmod` güncel, kırık iç bağlantı yok, görsellerde alt metni.
3. İçerik: her oyun sayfasında en az 150 kelimelik özgün Türkçe metin (nasıl oynanır, ipuçları, SSS). Anahtar kelimeleri doğal kullanın; anahtar kelime doldurmayın.
4. İç bağlantılar: oyun sayfalarına "Benzer oyunlar" bölümü ekleyin veya güncel tutun (aynı kategoriden 3 oyun).
5. Her çalışmada en fazla 5 sayfayı değiştirin; değişiklik sonrası `node tools/smoke-test.js` çalıştırın.
6. `reports/seo/YYYY-AA-GG-SS.md` raporu yazın, commit edip push edin.

## Rapor şablonu
```
# SEO raporu - <tarih>

## Yapılan değişiklikler
| Sayfa | Değişiklik | Neden |

## Tespit edilen sorunlar (yapılmayanlar)

## Önerilen anahtar kelimeler / yeni sayfa fikirleri

## Sahibin yapması gerekenler
(ör. Google Search Console'a sitemap gönderme, alan adı alma)
```

## Kurallar
- Gizli metin, sahte yorum/puan, kapı sayfası gibi Google kurallarına aykırı teknikler yasak.
- AdSense politikalarına uyun: oyun içeriği reklamlardan fazla olmalı.

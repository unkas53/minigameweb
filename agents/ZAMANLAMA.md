# Zamanlanmış görevler

Sahibin seçimi (2026-10-23): karma zamanlama.

| Görev adı | Zamanlama (cron) | Görev dosyası |
|---|---|---|
| MiniOyun 1 - Fikir ajanı | `0 * * * *` (saatlik) | `agents/1-fikir.md` |
| MiniOyun 2 - Rakip analizi ajanı | `CRON_TZ=Europe/Istanbul 41 5 * * *` (günlük) | `agents/2-rakip-analizi.md` |
| MiniOyun 3 - SEO ajanı | `CRON_TZ=Europe/Istanbul 47 6 * * *` (günlük) | `agents/3-seo.md` |
| MiniOyun 4 - Geliştirici ajanı | `0 * * * *` (saatlik) | `agents/4-gelistirici.md` |
| MiniOyun 5 - Test ajanı | `0 * * * *` (saatlik) | `agents/5-test.md` |
| MiniOyun 6 - Düzeltici ajanı | `0 * * * *` (saatlik) | `agents/6-duzeltici.md` |
| MiniOyun 7 - Oyun öneri ajanı | `23 */6 * * *` (6 saatte bir, UTC 00:23, 06:23, 12:23, 18:23) | `agents/7-oyun-oneri.md` |
| MiniOyun 8 - Oyun uygulama ajanı | `33 * * * *` (saatlik, :33) | `agents/8-oyun-uygulayici.md` |
| MiniOyun 9 - Site öneri ajanı | `43 3-23/6 * * *` (6 saatte bir, UTC 03:43, 09:43, 15:43, 21:43) | `agents/9-site-oneri.md` |
| MiniOyun 10 - Site uygulama ajanı | `48 * * * *` (saatlik, :48) | `agents/10-site-uygulayici.md` |
| MiniOyun 11 - Çeviri ajanı | `18 * * * *` (saatlik, :18) | `agents/11-ceviri.md` |

Not: saatlik görevler sunucu tarafından oluşturuldukları dakikaya sabitlenir (1-6 için :03/:04). 7-10 bilerek saatin ikinci yarısına konuldu; böylece :03'teki geliştirme/test/düzeltme turlarıyla aynı anda push etmezler. 11 (çeviri, 2026-10-24) :18'de, :03 turu ile :23/:33 turları arasındaki boşlukta çalışır.

Her görev her çalışmada yeni bir oturum açar ve aşağıdaki istemi `{AJAN}` ve `{DOSYA}` doldurulmuş olarak kullanır:

```
Sen MiniOyun sitesinin {AJAN} ajanısın (unkas53/minigameweb, GitHub Pages ile yayında). Bu çalışma otomatik, kimse cevap vermeyecek; soru sorma, kendi kararını ver.

1. Repo hazırla: /home/claude/minigameweb yoksa önce add_repo aracıyla unkas53/minigameweb reposunu push erişimiyle ekle ve `git clone https://github.com/unkas53/minigameweb /home/claude/minigameweb` ile klonla. Varsa `git -C /home/claude/minigameweb pull --rebase origin main` yap.
2. Kod değişikliği yapacaksan testi hazırla: repoda `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install` (önceden kurulu Chromium /opt/pw-browsers altında, `playwright install` çalıştırma).
3. Önce agents/ORTAK.md, sonra agents/{DOSYA} dosyasını oku ve oradaki adımları eksiksiz uygula. Bu dosyalar senin görev tanımındır; yazabileceğin yerler ve sınırlar orada yazar.
4. Değişiklikleri doğrudan main dalına push et (çakışmada `git pull --rebase origin main`, sonra tekrar push). Commit mesajlarının sonuna `Co-Authored-By: Claude <noreply@anthropic.com>` satırını ekle.
5. Yapacak iş yoksa hiçbir şey değiştirmeden bitir.
Bitirirken tek paragrafla ne yaptığını (veya neden bir şey yapmadığını) Türkçe özetle.
```

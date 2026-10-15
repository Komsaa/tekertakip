# Kalan işler — takip raporu

14 Eylül 2026. Değişiklikler yerel; commit, push, müşteri mesajı veya dağıtım yapılmadı.

## Tamamlananlar

- Veli erişimine ortak token biçimi/süresi, hesap aktifliği, güzergah aktifliği ve firma/demo kontrolü eklendi. Eski süresiz tokenlar yeniden giriş gerektirir. Alternatif veli girişine aynı firma kontrolleri eklendi.
- Bildirim tokenı doğrulaması ve veli şifre değişiminde tip/uzunluk/eşzamanlı güncelleme kontrolü eklendi. Mevcut veli şifre değişimi akışında geçerli token korunur.
- Yoklama, yalnızca oturumdaki şoföre ve firmaya bağlı aktif güzergah için yazılır. Yolcular ve sonraki durak güzergaha ait olmalı; hatalı giriş yazma/bildirimden önce reddedilir. Kayıtlar transaction içinde yazılır.
- GPS enlem/boylam sınırları doğrulanır; sentetik konum kaydı, geçmiş kaydı ve takibi durdurma test edildi.
- Mobil veli ekranı 401/403 sonrası eski veriyi/oturumu temizleyip girişe döner; bildirim kayıt hatası yakalanır. Android bildirim kanalı izin isteğinden önce oluşturulur.
- Sentry yapılandırma girişi, sunucu/edge yükleme, istemci dosyası ve global hata ekranı güncellendi. Replay metin ve medyası maskelenir. Panelin giriş/genel yönetici yönlendirmeleri hata yakalama bloğunun dışına alındı.
- Yedek/geri dönüş/yayın planı, cihaz kabul listesi ve ilk müşteri başlangıç taslağı hazırlandı.

## Test sonuçları

- scripts/mobile-e2e-isolated.ts: 19/19 gerçek PostgreSQL/HTTP senaryosu.
- scripts/e2e-isolated.ts: önceki 26/26 web/HTTP/Chrome senaryosu yeniden geçti.
- auth-regression.test.ts ve demo-request.test.ts: 49/49.
- Mobil TypeScript kontrolü başarılı.
- Nihai üretim derlemesi, lint/tip denetimi ve git diff --check başarılı. Önceki Sentry kurulum uyarıları son derlemede yok; Browserslist veri güncelliği uyarısı sürüyor. Sentry hesabına olay teslimatı bu turda doğrulanmadı.
- scripts/verify-backup-isolated.ps1: özel format yedek boş test veritabanına yüklendi; Company, Driver ve DemoRequest sayıları karşılaştırıldı. Yedek/prova veritabanı yalnızca sentetik veriler içeriyor, geçici kümede korunuyor. Bu üretim yedeği değildir.

Mobil senaryolarda parentPushToken alanları boş bırakıldı; gerçek Expo veya müşteri cihazına bildirim gönderilmedi. Başka firmaya/durağa bildirim tetikleme girişimi, yazma öncesi reddedildi. Bildirim teslimatı ve tekrarlı gönderim davranışı fiziksel cihaz/sağlayıcı makbuzlarıyla ayrıca test edilmeli.

## Bitmiş sayılmayanlar

1. Gerçek GPS/arka plan ve bildirim teslimatı: bağlı telefon yok. Cihaz kabul listesi hazır.
2. Üretim yedeği ve migration uygulaması: üretim şeması/geçmişi bilinmiyor. Başlangıçta otomatik DDL hâlâ var; kaldırmadan önce baseline/staging doğrulanmalı.
3. Mağaza yayın durumu, eski GitHub anahtarının iptali ve commit/push: hesapta işlem yapılmadı. Biriken kullanıcı değişiklikleri otomatik olarak commit edilmedi.
4. Depoda backup.sql dosyasının takip edildiği görüldü; içeriği bu turda açılmadı ve silinmedi. Hassas veri içerme ihtimali ayrıca ele alınmalı.
5. Müşteri paketi taslak; ücret, kapsam ve destek taahhütleri onaysız kesinleştirilmedi.

Bu bir tam uygulama güvenlik sertifikası değildir. Konum görünürlüğünün zaman penceresi, bildirim teslimat makbuzu/tekrar önleme ve yük altında performans ayrı test kapsamlarıdır.

İzleme entegrasyonu için kurulu @sentry/nextjs paket kodu ve resmi Next.js 14 belgeleri esas alındı: https://nextjs.org/docs/14/pages/building-your-application/optimizing/instrumentation ve https://nextjs.org/docs/14/app/building-your-application/routing/error-handling .

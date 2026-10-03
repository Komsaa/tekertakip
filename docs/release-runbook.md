# Yayın, yedek ve geri dönüş planı

Bu belge hazırlıktır; canlı ortamda hiçbir komut uygulanmadı.

## Yayından önce

1. Yayınlanacak değişiklikleri konu bazında incele: arayüz, web yetkileri, mobil/veli güvenliği, izleme ve testler. Kullanıcının diğer değişikliklerini bu sürüme otomatik dahil etme. Onaylı commit ve önceki çalışan sürüm kimliğini kaydet.
2. Üretim veritabanının tam sunucu/veritabanı kimliğini ve sorumlusunu doğrula. Bağlantı parolasını raporlara, komut geçmişine veya Git'e koyma. Üretim bağlantısını yerel test komutlarına verme.
3. Sağlayıcı anlık görüntüsü ve PostgreSQL özel format yedeği al. Yedeği repo dışında, erişimi kısıtlı ve şifreli sakla. Retansiyon ve sorumlu belirle. Depodaki backup.sql dosyasının güncel veya güvenli bir geri dönüş kaynağı olduğunu varsayma.
4. Yedeği ayrı, boş bir doğrulama veritabanına geri yükle. pg_restore hata kodu, firma/araç/şoför/yolcu sayıları, giriş ve ilişkili örnek kayıtları doğrula. Başarılı yedek alma tek başına geri dönüş kanıtı değildir.

## 3 Ekim 2026 başlangıç güvenliği düzeltmesi

Docker artık doğrudan node server.js başlatır; otomatik db push ve veri kaybı onayı kaldırılmıştır. instrumentation.ts içindeki eski şema kurulum kodu yalnızca NODE_ENV=development ve ALLOW_LOCAL_SCHEMA_SYNC=true birlikteyken çalışır; üretimde devre dışıdır. Bu değişiklik veritabanını güncellemez ve yeni/eksik şemayı kendiliğinden oluşturmaz.

Canlı şema uyumu ve geri yüklenebilir yedek henüz doğrulanmadı. Bu nedenle bu düzeltmenin varlığı tek başına dağıtım onayı değildir. Önce staging kopyasında mevcut şema ile uygulama uyumunu doğrulayın; gerekiyorsa ayrı incelenmiş geçiş uygulayın. Başlangıç komutunu sağlayıcı panelinde ezerek eski db push komutunu tekrar çalıştırmayın.

## Şema geçişi — doğrulama bekliyor

Önceki sürümlerde src/instrumentation.ts şema değiştiriyor ve bazı SQL hatalarını yutuyordu. DemoRequest tablosu bu yolla oluşturulabiliyordu. Bu yüzden yalnızca build sonucuna veya prisma migrate deploy komutuna güvenerek yayın yapılmamalı.

Üretim şeması ve _prisma_migrations geçmişi önce salt okunur incelenmeli. Mevcut migration dosyaları ile Prisma modelinin ve başlangıç SQL'lerinin farkı staging kopyasında çıkarılmalı. Eksik başlangıç/baseline geçmişi varsa gerçek üretim şemasına göre oluşturulup incelemeye sunulmalı; varsayımla uygulanmış işaretlenmemeli. DemoRequest dahil modeller/geçişler tamamlanmalı. Başlangıçtaki otomatik DDL ancak bu geçiş staging üzerinde doğrulandıktan sonra kaldırılmalı. Veri silen db push --accept-data-loss üretimde kullanılmamalı.

## Kontrollü yayın

- Önce staging: bu repo içindeki regresyon ve izole uçtan uca testler, sonra gerçek telefonla cihaz kabul listesi.
- Geri dönüşü doğrulanmış yedek olmadan üretim şema değişikliği yok.
- Eski uygulamayla uyumlu eklemeli geçişleri tercih et. Kolon silme/yeniden adlandırmayı ayrı sürüme bırak.
- Bakım penceresi ve müşteri bilgilendirmesinden sonra onaylı sürümü yayınla. standalone çıktı için .next/standalone/server.js başlatılmalı; public ve .next/static dağıtım paketinde doğru konuma kopyalanmalı. Mevcut barındırma sağlayıcısının paketleme ayarı ayrıca doğrulanmalı.
- Giriş, firma izolasyonu, demo kaydı, şoför konumu, veli erişimi ve bildirim teslimatını izleyip yayın kaydına işle.

## Geri dönüş

- Uygulama kaynaklı sorun ve geriye uyumlu şema: önceki uygulama paketine dön.
- Şema/veri kaynaklı sorun: yazmaları durdur; son başarılı yedeği yeni veritabanına geri yükle, doğrula, bağlantıyı kontrollü değiştir. Mevcut veritabanını hemen silme/üzerine yazma.
- Yedekten sonraki müşteri yazmaları için uzlaştırma planı olmadan geri yüklemeyi tamamlandı sayma. Kullanıcıya kayıp riski ve kesinti bildirilmeli.
- Sorumlu, zaman, yedek kimliği, önceki/yeni sürüm, doğrulamalar ve karar kaydedilmeli.

Yerel prova: scripts/verify-backup-isolated.ps1 yalnızca 127.0.0.1:55439 test kümesinden yedek alır ve benzersiz boş test veritabanına yükler. Üretim yedeğinin yerini tutmaz.

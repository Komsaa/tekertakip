# TekerTakip — yayın öncesi görevler

14 Eylül 2026. Bu liste yereldir; GitHub'a gönderilmedi.

## Önce tamamlanacaklar

- [ ] Yerel Git bağlantısında bulunan eski erişim anahtarını GitHub hesabından iptal et. Bağlantı adresinden kaldırıldı; iptal işlemi henüz yapılmadı.
- [ ] Yerelde biriken değişiklikleri konu bazında gözden geçir ve sürüm kontrolüne al.
- [x] Önceki incelemede ayrılan web oturumu iptali, firma admin kapsamı ve alternatif veli erişim yollarını kontrol et; bulguları düzelt. Bu, bütün API'lerin bağımsız güvenlik denetimi değildir.
- [x] Ayrı test veritabanında gerçek giriş, demo kaydı, şifre değiştirme ve firma izolasyonunu doğrula: 26/26 senaryo geçti (e2e-report-2026-09-14.md).
- [ ] Test cihazında şoför konum paylaşımı ve veli bildirimlerini doğrula.
- [x] Veritabanı yedeği, kontrollü şema geçişi ve geri dönüş planını hazırla (release-runbook.md); sentetik veritabanında yedekten geri yükleme provası geçti.
- [ ] Üretim şeması/migration geçmişi ve açılıştaki otomatik DDL için staging geçişini doğrula. Plan hazırlanması bu uygulama adımının yerine geçmez.
- [x] Yeniden giriş bilgilendirmesini hazırla (customer-launch-kit.md); gönderilmedi.
- [ ] Git tarafından takip edilen backup.sql dosyasının hassas veri içerip içermediğini güvenli ortamda incele; gerekiyorsa veri temizliği ve geçmişten kaldırma planını ayrıca onayla.

## Sonraki işler

- [x] Sentry kurulumunu yeni yapılandırma girişine, runtime yüklemesine ve global hata ekranına taşı; replay metin/medya maskelemesini aç.
- [ ] App Store ve Google Play yayın durumlarını güncel hesaplardan doğrula.
- [x] İlk müşteri için demo, teklif ve kurulum taslağını hazırla (customer-launch-kit.md). Fiyatlar, destek taahhütleri ve gönderim için işletme sahibi onayı bekleniyor.

## Mevcut doğrulama

- Bütünsel tasarım turu: 108 ekran/rol/boyut kontrolü geçti; ortak panel ve sekiz mobil ekranın ilgili stilleri düzeltildi. Fiziksel mobil görsel kabul bekliyor (design-review-2026-09-14.md).

- Ana sayfa ve demo sayfası yenilendi; mobil/masaüstü tarayıcı kontrolleri geçti.
- Son yetkilendirme değişiklikleriyle 49 test, tip kontrolü ve üretim derlemesi geçti.
- İzole PostgreSQL üzerinde 26 uçtan uca senaryo geçti; ilk turda bulunan 5 sorun düzeltildi. Chrome ile gerçek giriş ve demo formu kaydı doğrulandı.
- Ek 19 mobil sunucu senaryosu geçti: veli erişimi, GPS kaydı/durdurma, firma dışı yoklama ve bildirim hedefinin reddi. Gerçek telefona bildirim gönderilmedi.
- Mobil proje tip kontrolü geçti. Android araçları mevcut fakat bağlı cihaz listesi boş (mobile-device-acceptance.md).
- Gerçek üretim veritabanında uçtan uca test yapılmadı.
- GitHub eklentisi kuruldu; Komsaa/tekertakip erişimi doğrulandı. Depo herkese açık.
- Güvenlik ayrıntılarını açık issue veya PR açıklamalarında yayımlama.
- Canlıya dağıtım ve push yapılmadı.

## Çalışma düzeni

Her görevde amaç, etkilenen dosyalar ve tamamlanma ölçütü belli olsun. Önce ilgili testleri, yayın öncesinde tam derlemeyi çalıştır. Yeni sohbette bu liste ve son revizyon notları başlangıç noktasıdır. Küçük arayüz işleri için hafif model; günlük geliştirme için dengeli model; güvenlik ve zor hata analizi için güçlü model seçimi uygundur. Model ayarları bu çalışma sırasında değiştirilmedi.

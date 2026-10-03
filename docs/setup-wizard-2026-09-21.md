# Firma kurulum sihirbazı

21 Eylül 2026. /panel/hosgeldiniz sayfası adım adım firma başlangıç rehberine dönüştürüldü. Sunucu kurulum aracı değildir.

## Kapsam

- Araçlar, şoförler, güzergâhlar, belge tarihleri, ilk sefer, müşteri firmalar, yakıt ve faturalar için sekiz adım.
- Her adımda amaç, yapılacaklar, kayıt ölçütü ve ilgili ekran bağlantısı.
- İsteğe bağlı adımlar ayrı etiketli. İleri gitmek kayıt durumunu değiştirmez.
- İşlem ekranları yeni sekmede açılır. Rehbere odak dönünce veya yenile düğmesine basılınca sunucudan durum alınır.
- Oturum, firma seçimi, sunucu hatası ve bozuk yanıt için hata/tekrar deneme durumu. Hatalar boş liste olarak gösterilmez.
- İlerleme yalnızca oturumdaki firmaya ait kayıtlardan gelir. Kullanıcıdan firma kimliği alınmaz.
- Fatura durumu gerçek fatura sayısına, belge tarihi durumu tarih alanlarına bağlıdır. Güzergâhta aktiflik, aynı firmaya ait araç/şoför ataması ve en az bir durak aranır.

## Doğrulama

- Tip kontrolü geçti.
- Mevcut regresyon paketi 49/49 geçti.
- scripts/setup-wizard-test.ts 13/13 geçti: anonim erişim, boş firma izolasyonu, fatura yanlış pozitif kontrolü, tarih ve güzergâh ölçütleri, bozuk veri, 390/768/1440 taşma kontrolleri, adım gezinmesi, hata/tekrar deneme ve tarayıcı hatası kontrolü.
- Masaüstü ekran görüntüsü görsel olarak incelendi. Gerçek telefon ve tüm kayıt formları bu turda uçtan uca tekrar test edilmedi.
- Bu tur yeni üretim derlemesi yapılmadı. Yerel geliştirme önizlemesi 127.0.0.1:3102 üzerinde izole tekertakip_e2e veritabanını kullanır.

## Sınırlar

İlerleme ilk kayıtların varlığını gösterir, tüm filonun eksiksizliğini veya yayına hazır olduğunu doğrulamaz. Yeni veritabanı alanı/migration yok. Push ve canlı dağıtım yapılmadı. Test verileri müşteri verilerinden ayrıdır.

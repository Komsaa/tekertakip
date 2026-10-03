# TekerTakip panel revizyonu — 19 Eylül 2026

## İkinci tur: şoför ve güzergâh listeleri

Şoför ve güzergâh listelerine ortak Workspace başlıkları, dört özet kartı ve uyumlu yerleşim eklendi. Şoför kartlarının dar ekranda atamaları sarması sağlandı. Güzergâh türü filtresine seçili durum erişilebilirliği eklendi. Mevcut ekleme/düzenleme formları yeniden tasarlanmadı.

Her iki sayfada veri sorgusu başarısız olduğunda boş liste döndüren davranış kaldırıldı. Ortak hata bileşeni ve sayfaya özgü tekrar deneme sınırları eklendi. Gerçek veritabanı kesintisi senaryosu henüz ayrıca çalıştırılmadı.

Bu turun kanıtları:

- Üretim derlemesi izole DATABASE_URL ile başarılı; önceki eksik DATABASE_URL hataları bu koşuda oluşmadı. Browserslist uyarısı devam ediyor.
- Tip kontrolü başarılı.
- Genişletilmiş tarayıcı paketi 23/23: dört ekranın üç genişlikte taşma kontrolü, şoför kaydı, güzergâh tür filtresi ve önceki arama/kayıt senaryoları.
- Regresyon paketi 49/49; toplam bu turda 72 kontrol. Önceki 26 web senaryosu ikinci turda tekrar çalıştırılmadı.
- Şoför telefon ve güzergâh masaüstü ekran görüntüleri görsel olarak incelendi. Tüm ekranlar için kapsamlı erişilebilirlik veya gerçek cihaz kabulü iddia edilmez.
- Ekran görüntüsü adları artık revision-{genişlik}-{panel|araclar|soforler|guzergahlar}.jpg biçimindedir.

Sıradaki işler: detay/form ekranları; sefer/yoklama; bakım/arıza/yakıt; finans/raporlar; belge/görev/ayarlar; gerçek Android/iOS, GPS ve bildirim kabulü. Ana panel not taslağının sayfadan çıkışta korunması, büyük filoda sunucu sayfalaması ve tam hata/erişilebilirlik denetimi açık. Canlı dağıtım yapılmadı.

## Tamamlanan kapsam

Ana panel ve araç listesi ortak Workspace bileşenleriyle yenilendi. Bu çalışma panelin tamamının yeniden tasarlandığı veya uygulamanın hatasız olduğu anlamına gelmez.

- Ana panel: başlık, dört özet kartı, çerçeveli harita, operasyon alanı ve sadeleştirilmiş alt özet. Telefon/tablet/masaüstü düzenleri.
- Araç listesi: Türkçe arama, aktif/belge filtreleri, 10 kayıtlık istemci sayfalaması, mobil kartlar ve boş sonuç durumu. Ekleme, Excel ve detay bağlantıları korundu.
- Araç verisi yüklenemezse boş filo göstermek yerine hata sınırı ve tekrar deneme.
- Sefer durumu ancak sunucu başarılı yanıt verince güncelleniyor; eşzamanlı gönderim engelleniyor ve hata gösteriliyor.
- Not kayıtları sıraya alındı; başarısız kayıtta ekrandaki metin korunuyor ve tekrar kaydetme sunuluyor.
- Test betiğinin sabit plakalar nedeniyle ikinci çalıştırmada çakışması düzeltildi; her tur benzersiz sentetik plakalar üretiyor.

## Bu turda gözlenen sonuçlar

| Kontrol | Sonuç |
| --- | --- |
| Üretim derlemesi | Çıkış kodu 0; tip ve derleme adımları geçti |
| Yetkilendirme/demo regresyonları | 49/49 |
| Web uçtan uca senaryoları | 26/26 |
| Yeni ekran/akış testleri | 15/15 |
| Değişiklik biçim kontrolü | Geçti; satır sonu uyarıları mevcut |

15 kontrol: iki ekranın 390/768/1440 genişliklerinde taşma kontrolü, Türkçe arama, sayfalama, aktif filtrede sayfa sıfırlama, belge filtresi, boş sonuç, başarısız sefer kaydı, başarısız notta metnin korunması, başarılı tekrar kayıt ve tarayıcı çalışma zamanı hatası olmaması. Ekran görüntüleri artifacts/design-audit/revision-*.jpg altında yenilendi. Taşma testi tek başına tam görsel veya erişilebilirlik kabulü değildir.

Derleme DATABASE_URL tanımlanmadan çalıştırıldı: süreç başarılı bitse de bazı ön işleme sorguları eksik veritabanı ayarı hataları yazdı. Eski Browserslist verisi uyarısı da mevcut. Çalışma zamanı testleri açıkça yalnızca 127.0.0.1:55439/tekertakip_e2e veritabanını ve 127.0.0.1:3101 uygulamasını kullandı. Yerel test başlatıcısı standalone yapılandırması için farklı başlatma komutu öneren uyarı verdi. Bu sonuçlar temiz üretim dağıtımı doğrulaması değildir.

## Açık işler ve sınırlar

- Görsel yön için kullanıcı değerlendirmesi; ardından şoför/güzergah/sefer/finans ve diğer ekranlara yayma.
- Mobil 19 sunucu senaryosu ve eski 108 ekran/rol kontrolü bu turda yeniden çalıştırılmadı.
- Gerçek telefon, arka plan GPS, push teslimatı ve üretim geri dönüş kabulü yapılmadı.
- Gerçek veritabanı kesintisinde araç hata ekranı ayrıca sınanmalı.
- Notun bekleyen kayıt gecikmesi dolmadan sayfadan çıkılırsa taslak kaybolabilir; kalıcı taslak koruması henüz yok.
- Araçlar sunucudan topluca yükleniyor; sayfalama istemci tarafında. Büyük filo için sunucu tarafı sayfalama değerlendirilmelidir.
- Model bağımsız olarak doğrulanmadı; Astra 6 kullanımı iddia edilmiyor.
- Commit, push ve canlı dağıtım yapılmadı; mevcut kullanıcı değişiklikleri korundu.

## Yeniden çalıştırma

İzole test ortamını hazırladıktan sonra scripts/workspace-revision-test.ts ve scripts/e2e-isolated.ts çalıştırılır. Her iki betik yanlış veritabanı hedefini reddeder. Regresyon dosyaları src/lib/auth-regression.test.ts ve src/lib/demo-request.test.ts içindedir. Test verileri yalnızca ayrı test veritabanında tutulur; müşteri verisi kullanılmaz.

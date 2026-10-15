# Şoför evrakları ve tarih önerisi

- Şoför detayındaki e-Devlet bağlantıları kaldırıldı.
- SRC için tarih düzenleme, tarih durumu ve OCR çağrısı kaldırıldı. Eski tarih verileri silinmedi; genel şoför güncellemesi artık SRC tarihine yazmıyor. Excel ve eski yönetim araçları bu turda yeniden düzenlenmedi.
- Standart DocRow evrak yüklemesi, mevcut Gemini hizmetinden açık bitiş tarihi önerisi alır. İkametgâhta düzenleme tarihi ayrı değerlendirilir. Süre ekleme/tahmin yok; geçersiz takvim tarihleri reddedilir.
- Öneri kullanıcıya gösterilir. Onaydan önce veritabanındaki tarih değişmez. Okunamayan dosyada elle giriş mümkündür.
- Dar kapsamlı /api/documents/date uç noktası yalnız seçilen tarihi günceller. Önceki genel PUT akışının başka alanları boşaltma etkisinden kaçınılır.
- Yükleme öncesi firma sahipliği, dosya türü/uzantısı ve 10 MB sınırı kontrolü eklendi. MIME imza taraması veya antivirüs bu kapsamda yok.

Doğrulama: tip kontrolü ve scripts/document-dates-test.ts içindeki 9 kontrol geçti. Firma dışı tarih/yükleme reddi, SRC kontrolleri, e-Devlet bağlantıları, alanların korunması ve öneri/onay akışı test edildi. OCR yanıtı tarayıcı testinde taklit edildi; gerçek Gemini/MinIO uçtan uca belge okuması doğrulanmadı. Servis anahtarı ve dosya deposu gerekli. Ek serbest belgeler (ExtraDocuments) bu akışa dahil edilmedi. Canlı dağıtım ve push yapılmadı.

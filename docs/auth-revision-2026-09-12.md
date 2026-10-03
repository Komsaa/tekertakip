# Giriş ve mobil yetkilendirme revizyonu

## Düzeltilenler

- Yönetici token imzası artık rol, firma, kaynak, kullanıcı ve geçerlilik alanlarının tamamını kapsıyor. Eski imza biçimi reddediliyor; yeni tokenlar verildiği andan itibaren 30 gün geçerli.
- Mobil yönetici API'leri her istekte güncel kullanıcı aktifliğini, rolünü, firma eşleşmesini ve firmanın demo/aktiflik durumunu kontrol ediyor.
- Mobil-web geçişinde veritabanındaki yönetici de gerçek kullanıcı kimliği ile taşınıyor; bütün adminler aynı kimliğe dönüştürülmüyor.
- Birleşik mobil girişin web şifresi yoluna eksik firma kontrolü eklendi. Şoför, veli ve panel mobil girişlerinde demo süresi kontrol ediliyor.
- Şoförün merkezi oturum kontrolü pasif hesapları, eksik firma bilgisini ve tarihi olmayan/süresi dolmuş tokenları reddediyor.
- UTF-8 karşılaştırma hatası düzeltildi. Parolanın başındaki/sonundaki boşluklar korunuyor. Hatalı giriş tipleri 400 dönüyor.
- Şifre değişikliği aktiflik kontrolü, doğrulama, eşzamanlı güncelleme koruması ve bağlantı hata mesajı kazandı.

## Doğrulama

- 32 yetkilendirme regresyon testi ve 17 demo testi geçti (49/49).
- Tip kontrolü geçti.
- Veritabanı işlemleri testlerde taklit edildi. Gerçek müşteri veya hesap kaydı değiştirilmedi.
- Test komutu: npx tsx --test src/lib/auth-regression.test.ts src/lib/demo-request.test.ts

## Dağıtım etkisi ve sınırlar

- Henüz yayınlanmadı. Yayınlandığında mobil yöneticiler yeniden giriş yapmalıdır; eski güvensiz tokenlar bilinçli olarak kabul edilmez.
- Tarihi olmayan eski şoför tokenları da yeniden giriş gerektirir.
- Bu çalışma tüm API'lerin kapsamlı güvenlik denetimi değildir. Mevcut web JWT oturumlarının anlık iptali, şirket adminlerinin global admin uçlarına erişim kapsamı ve alternatif veli doğrulama yolları ayrı inceleme gerektirir.
- Gerçek cihaz konumu, üretim veritabanıyla uçtan uca giriş ve şifre kaydı henüz doğrulanmadı.

## 14 Eylül takip çalışması

Yukarıdaki tarihsel sınırlardan web JWT iptali ve firma yöneticisi kapsamı 26 izole senaryoyla kontrol edildi. Alternatif veli doğrulaması ve veli token kullanan durum/harita/bildirim tokenı/şifre/hesap silme uçları artık ortak aktif hesap, aktif güzergah, firma ve token süresi kontrolünden geçiyor. Yoklama yazımına şoför/firma/güzergah/yolcu/durak eşleşmesi ve tek işlemde yazma eklendi. Ek 19 mobil sunucu senaryosu geçti. Gerçek cihaz ve üretim yayını hâlâ yapılmadı; detaylar release-followup-2026-09-14.md içinde.

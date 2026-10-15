# TekerTakip — profesyonel panel ve debug planı

15 Eylül 2026 tarihinde oluşturuldu; 19 Eylül 2026 tarihinde güncellendi. Ana panel, araç listesi, şoför listesi ve güzergâh listesinde ortak tasarım uygulandı; detay/form ve diğer ekranlara yayma tamamlanmadı. Güncel kanıtlar: [revizyon raporu](workspace-revision-2026-09-19.md).

## Daha önce debug yaptık mı?

Evet. 14 Eylül raporlarında 26 web uçtan uca senaryosu, 19 mobil sunucu senaryosu, 49 regresyon testi ve 108 ekran/rol/boyut kontrolü başarılı olarak kayıtlı. Üretim derlemesi, tip kontrolleri ve sentetik veritabanında yedekten geri yükleme provası da geçti.

İlk web turunda beş hata bulundu ve düzeltildi. Firma yetkileri, oturum iptali, veli erişimi, yetkisiz yoklama ve mobil taşmalar üzerinde hata ayıklama yapıldı. Bu farklı kontroller tüm uygulamanın hatasız olduğu anlamına gelmez; güncel kod için yeniden çalıştırılmalıdır.

## Astra 6 ve tasarım durumu

Kullanıcının talebi sonraki kapsamlı revizyonun Astra 6 ile yürütülmesidir. Önceki proje raporları kullanılan modeli doğrulamıyor. Bu dosya model seçimini değiştirmez ve yeni bir çalışma başlatmaz. Başlangıçta seçili model doğrulanıp yürütme kaydına yazılmalıdır.

Ana sayfa/demo yenilendi. Panelin ortak düzeni ve bazı ekranları iyileştirildi; panel tamamen sıfırdan tasarlanmadı. Mobil görünümde düzeltmeler var fakat gerçek cihaz görsel kabulü tamamlanmadı.

## 1. Başlangıç ve envanter

- [ ] Modeli, başlangıç sürümünü ve mevcut yerel değişiklikleri kaydet; kullanıcı değişikliklerini koru.
- [ ] Önceki testleri yalnızca ayrı test veritabanında yeniden çalıştır.
- [ ] Sayfa, rol, form, modal ve boş/yükleniyor/hata durumlarını listele.
- [ ] Her bulguya önem, tekrar üretim adımı ve beklenen/gerçek sonucu ekle.

## 2. Profesyonel tasarım sistemi

- [x] İlk iki ekran için renk, yazı ölçeği, boşluk, köşe ve gölge kurallarını belirle.
- [ ] Düğme, form alanı, kart, tablo, sekme, durum etiketi ve modalları ortaklaştır.
- [ ] Ana panel ve yoğun bir liste ekranında yeni tasarımı uygula; görsel yönü kullanıcıyla netleştir.
- [ ] Klavye odağı, kontrast, ekran okuyucu adları ve dokunma alanlarını doğrula.

## 3. Ekranlara yayma

- [ ] Operasyon özeti ve harita: bilgi önceliği, göstergeler ve okunur durumlar.
- [ ] Araç, şoför, güzergah ve öğrenci liste/detay/form ekranları.
- [ ] Sefer, yoklama, bakım, arıza ve yakıt akışları.
- [ ] Finans, fatura, ödeme, maaş, kredi kartı ve rapor tabloları.
- [ ] Belgeler, görevler, ayarlar, okul ve genel yönetici ekranları.
- [ ] Mobil giriş, şoför, yönetici, veli, sefer ve formlar.

## 4. Kapsamlı hata ayıklama

- [ ] Oluşturma, okuma, güncelleme, silme/iptal işlemleri.
- [ ] Boş, çok uzun ve yanlış tipte girişler; null/bozuk JSON.
- [ ] Çift tıklama, tekrar gönderim, eşzamanlı düzenleme ve yarım kalan işlemler.
- [ ] Oturum süresi, rol/firma değişimi ve başka firmanın kaydına doğrudan erişim.
- [ ] Ağ kesintisi, yavaş yanıt, sunucu hataları ve yeniden deneme.
- [ ] Yoğun sentetik veriyle arama, filtre, sayfalama ve uzun metinler.
- [ ] Tüm modallarda odak, Escape, kaydırma ve mobil klavye örtüşmesi.
- [ ] Tarih/saat, tutar, Türkçe biçimlendirme ve sıralama.
- [ ] Her düzeltmeye mümkün olduğunda tekrarını yakalayacak test ekle.

## 5. Cihaz ve yayın kabulü

- [ ] Android/iOS test derlemesinde büyük yazı, klavye ve arka plan GPS testi.
- [ ] Yalnızca test veli cihazlarında doğru alıcı, teslimat makbuzu ve tekrar bildirim kontrolü.
- [ ] Üretim şema geçmişini salt okunur incele; açılıştaki otomatik tablo değişiklikleri için staging geçişini doğrula.
- [ ] Üretim yedeği ve geri dönüşünü ayrıca doğrula; yerel prova bunun yerine geçmez.
- [ ] Kullanıcı onayı olmadan canlı dağıtım, dış mesaj, toplu müşteri verisi değişikliği veya Git geçmişi temizliği yapma.

## Tamamlanma ölçütleri

İncelenen kapsamda açık kritik/yüksek öncelikli hata kalmamalı. Değişen akışlar ve ilgili eski regresyonlar geçmeli. Telefon/tablet/masaüstü ve yoğun veri kontrolleri, önce/sonra görselleri, derleme ve tip sonuçları kaydedilmeli. Cihaz veya servis erişimi olmayan testler tamamlandı işaretlenmemeli. Son rapor açık riskleri ve yayın durumunu belirtmeli; tamamen hatasızlık garantisi verilmemeli.

## Yürütme ve bulgu kaydı

- Yeni revizyon: ana panel ve araç listesi uygulandı; 19 Eylül 2026 tarihinde son derleme doğrulandı. Mevcut yerel değişiklikler korundu.
- Doğrulanan model: bağımsız doğrulama yok; Astra 6 kullanıldığı iddia edilmiyor.
- Güncel test sonuçları: 15 ekran/akış, 26 web uçtan uca ve 49 regresyon testi geçti. Mobil 19 senaryo ve eski 108 ekran kontrolü bu turda tekrar çalıştırılmadı.
- İkinci tur: ekran/akış paketi 23/23 olarak genişletildi ve geçti; 49 regresyon yeniden geçti. İzole veritabanıyla üretim derlemesi başarılı. Detaylar revizyon raporunun ikinci tur bölümünde.
- Bulgu biçimi: kimlik / ekran / önem / tekrar üretim / beklenen / gerçek / düzeltme / test kanıtı / durum.

## Önceki kanıtlar

- [Web test raporu](e2e-report-2026-09-14.md)
- [Mobil ve yayın raporu](release-followup-2026-09-14.md)
- [Tasarım incelemesi](design-review-2026-09-14.md)
- [Yayın öncesi liste](YAYIN-ONCESI.md)
- [Cihaz kabul listesi](mobile-device-acceptance.md)
- [Yayın ve geri dönüş planı](release-runbook.md)

# Bütünsel tasarım incelemesi — 14 Eylül 2026

## Kapsam ve sonuç

Ana sayfa, demo, giriş ve 29 panel adresi 390/768/1440 px genişlikte otomatik tarandı. Genel yönetici, okul ve firmaya bağlı admin görünümleriyle toplam 108 ekran/rol/boyut kontrolü tamamlandı. Son turda HTTP hatası veya sayfa düzeyinde yatay taşma saptanmadı. Standart ekran taramasında tarayıcı JavaScript hataları da kontrol edildi. Ek rol taraması yerleşim ve HTTP yanıtını kapsar.

Temsili masaüstü paneli, mobil sefer listesi ve mobil güzergah ekranları görüntü üzerinden ayrıca incelendi. Otomatik ölçüm, her ekranın bütün durumları için elle yapılmış görsel onay anlamına gelmez.

## Web düzeltmeleri

- Ortak panel üst çubuğu, sayfa konumu, hesap ayarları erişimi, arka plan, yazı hiyerarşisi ve içerik boşlukları düzenlendi.
- Ana operasyon ekranına açıklayıcı başlık eklendi; harita ve çalışma alanının ekran yüksekliğini kullanması düzeltildi.
- Belgeler, evrak rehberi, görevler ve ayarlar menüye eklendi. Genel yönetici/firma yöneticisi ayrımı ve ayarlardaki rol etiketi düzeltildi.
- Mobil menüye erişilebilir ad, genişleme durumu, diyalog rolü, odak sınırlandırması, Escape ile kapatma, odağı geri verme ve arka planın etkileşime kapatılması eklendi. Aktif bağlantı ekran okuyucuya bildiriliyor.
- Klavye odak çizgileri, içeriğe atlama bağlantısı, hareket azaltma desteği ve mobil form alanları iyileştirildi.
- İlk turda bulunan üç taşma kaynağı giderildi: sefer filtre/eylem satırı, güzergah başlık/kart eylemleri, öğrenci ekranındaki sekmeler. Sekmeler kendi alanında kaydırılabilir; sayfa taşmıyor.

## Mobil uygulama düzeltmeleri

Sekiz ana ekranın stil tanımları incelendi. Şoför ana sayfasında ortak renkler ve vektör işlem simgeleri kullanıldı; dar ekran/büyük yazı boyutunda üç kart tek kolona geçiyor. Aşırı gölge azaltıldı. Giriş, yakıt, arıza, yönetici, veli, sefer ve rota ekranlarında ilgili küçük metinler ve dokunma alanları iyileştirildi. Veli ekranındaki koyu zeminde silik kalan güzergah/durak metni belirginleştirildi. Harfli parolaları zorlaştıran sayısal giriş klavyesi düzeltildi.

Mobil değişiklikler TypeScript kontrolünden geçti. Bağlı telefon olmadığı için gerçek Android/iOS çizimi, klavye örtüşmesi, işletim sistemi yazı ölçeği ve tüm modal durumları henüz görsel olarak doğrulanmadı.

## Doğrulama ve çıktılar

- 108/108 ekran/rol/boyut kontrolü; son raporda problems boş.
- Mobil menü açma, Escape ve odağın menü düğmesine dönmesi geçti.
- Önceki 26 giriş/demo/yetkilendirme uçtan uca senaryosu yeniden geçti.
- Üretim derlemesi ve web/mobil tip kontrolleri geçti. Browserslist güncellik uyarısı sürüyor.
- Tekrar çalıştırılabilir test: scripts/design-audit.ts. Yalnızca 127.0.0.1:55439/tekertakip_e2e veritabanına izin verir; uygulama 3101 portunda bu veritabanına bağlı olmalı. Playwright/Chrome gerekir.
- Ekran görüntüleri ve makine raporu: artifacts/design-audit/. Büyük/sentetik çıktılar Git dışında tutulur.

Testler sentetik ve az sayıda firma/araç/şoför verisiyle yapıldı. Yoğun tablolar, bütün hata/yükleniyor/boş durum kombinasyonları, her formun açılır penceresi ve fiziksel mobil cihazlar için kapsamlı kabul testi henüz yapılmış değildir. Canlı veriler değiştirilmedi; commit, push veya dağıtım yapılmadı.

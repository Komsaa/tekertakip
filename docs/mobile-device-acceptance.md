# Gerçek telefon kabul testi

14 Eylül 2026: Android araçları mevcut; adb devices -l listesinde bağlı cihaz yok. Gerçek GPS, arka plan takibi ve push teslimatı henüz doğrulanmadı.

Hazırlık: test derlemesi yalnızca staging/test sunucusuna bağlanmalı. Sentetik şoför/veli hesapları, ayrı test firması ve test güzergahı kullanılmalı. Gerçek müşterilere bildirim gönderilmemeli. Android ve iPhone ayrı test edilmeli; Expo Go sonucu mağaza derlemesi sonucu olarak kabul edilmemeli.

- [ ] Konum izni reddi: anlaşılır uyarı, takibin başlamaması.
- [ ] Ön plan/arka plan izinleri: konumun test panelinde güncellenmesi.
- [ ] Ekran kilitli ve uygulama arka planda en az 10 dakika: zaman damgası ve yaklaşık konum doğruluğu.
- [ ] İnternet kesilip gelince toparlanma; yanlış başarı göstergesi olmaması.
- [ ] Takibi durdur ve çıkış yap: cihaz görevinin ve sunucuda takip durumunun durması.
- [ ] Şoför veya firma kapatılınca veri gönderiminin reddedilmesi.
- [ ] Veli hesabı kapatılınca eski haritanın temizlenip girişe dönülmesi.
- [ ] Bildirim izni reddi: uygulamanın çalışmaya devam etmesi.
- [ ] İzin verildiğinde test veli cihazında sefer başladı/bindi/gelmedi/yaklaşıyor mesajlarının doğru kişiye ulaşması.
- [ ] Başka firmadaki test velisine bildirim gitmemesi.
- [ ] Expo gönderim bileti ve teslimat makbuzunun kontrolü; HTTP 200 tek başına teslimat değildir.
- [ ] App Store Connect / Play Console: doğru paket kimliği, sürüm, inceleme durumu, gizlilik ve konum/bildirim izin beyanları.

Her satıra cihaz/OS, derleme kimliği, tarih, beklenen/gerçek sonuç ve hata varsa ekran kaydı eklenmeli. Test tamamlanmadan mağaza onayı veya arka plan GPS garantisi verilmemeli.

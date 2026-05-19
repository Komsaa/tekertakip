export const metadata = { title: "Gizlilik Politikası | TékerTakip" };

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px", fontFamily: "system-ui, sans-serif", color: "#1e293b" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Gizlilik Politikası</h1>
      <p style={{ color: "#64748b", marginBottom: 32 }}>Son güncelleme: Mayıs 2026</p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>1. Toplanan Veriler</h2>
        <p>TékerTakip uygulaması aşağıdaki verileri toplar:</p>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>Konum bilgisi (sefer sırasında şöförlerden, yalnızca uygulama açıkken veya arka planda)</li>
          <li>Kullanıcı adı ve PIN (kimlik doğrulama için)</li>
          <li>Yakıt giriş fotoğrafları</li>
          <li>Arıza bildirim fotoğrafları</li>
          <li>Push bildirim token'ı</li>
        </ul>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>2. Verilerin Kullanım Amacı</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>Servis güzergah takibi ve yönetimi</li>
          <li>Velilere anlık konum bildirimi gönderimi</li>
          <li>Yakıt ve gider kayıtlarının tutulması</li>
          <li>Sefer ve yoklama raporlaması</li>
        </ul>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>3. Veri Paylaşımı</h2>
        <p>Verileriniz üçüncü taraflarla satılmaz veya paylaşılmaz. Konum verisi yalnızca servis yöneticisi ve ilgili velilerle paylaşılır.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>4. Konum İzni</h2>
        <p>Uygulama, sefer sırasında arka planda konum erişimi talep eder. Bu izin yalnızca aktif sefer süresince kullanılır. İzni istediğiniz zaman telefon ayarlarından kaldırabilirsiniz.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>5. Veri Güvenliği</h2>
        <p>Tüm veriler HTTPS üzerinden iletilir ve güvenli sunucularda saklanır. PIN bilgileri şifrelenmiş olarak tutulur.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>6. Hesap Silme</h2>
        <p>Hesabınızı uygulama içindeki "Hesabı Sil" seçeneğiyle silebilirsiniz. Silme işlemi oturum bilgilerinizi temizler.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>7. İletişim</h2>
        <p>Gizlilik ile ilgili sorularınız için: <a href="mailto:destek@tekertakip.com" style={{ color: "#DC2626" }}>destek@tekertakip.com</a></p>
      </section>
    </main>
  );
}

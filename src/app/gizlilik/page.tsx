import Link from "next/link";
import { LogoIcon } from "@/components/Logo";

export const metadata = {
  title: "Gizlilik Politikası – Teker Takip",
  description: "Teker Takip uygulaması gizlilik politikası ve kişisel veri işleme bilgilendirmesi.",
};

const LAST_UPDATED = "13 Nisan 2026";
const COMPANY = "Teker Takip";
const EMAIL = "destek@tekertakip.com";
const SITE = "tekertakip.com";

export default function GizlilikPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <nav className="bg-[#1B2437] border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoIcon size={30} className="text-white" />
            <span className="text-white font-black text-lg">
              teker<span className="text-[#DC2626]">takip</span>
            </span>
          </Link>
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Ana Sayfa
          </Link>
        </div>
      </nav>

      {/* İçerik */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Gizlilik Politikası</h1>
          <p className="text-slate-500 text-sm">Son güncelleme: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">1. Genel Bilgi</h2>
            <p>
              Bu gizlilik politikası, <strong>{COMPANY}</strong> tarafından sunulan web paneli
              ({SITE}) ve mobil uygulamalar (Teker Takip Şöför, Teker Takip Veli) aracılığıyla
              toplanan kişisel verilerin nasıl işlendiğini açıklamaktadır.
            </p>
            <p className="mt-3">
              Hizmetlerimizi kullanarak bu politikayı kabul etmiş sayılırsınız.
              Sorularınız için <a href={`mailto:${EMAIL}`} className="text-[#DC2626] font-medium">{EMAIL}</a> adresine ulaşabilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">2. Toplanan Veriler</h2>

            <h3 className="font-semibold text-slate-800 mb-2 mt-4">2.1 Firma ve Yönetici Bilgileri</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Firma adı, yetkili kişi adı soyadı</li>
              <li>Kullanıcı adı ve şifresi (şifreler bcrypt ile şifrelenerek saklanır, düz metin olarak tutulmaz)</li>
              <li>Telefon numarası (isteğe bağlı)</li>
            </ul>

            <h3 className="font-semibold text-slate-800 mb-2 mt-4">2.2 Şöför Bilgileri</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Ad soyad, telefon numarası</li>
              <li>Araç bilgileri (plaka, marka, model)</li>
              <li><strong>Konum verisi:</strong> Sefer sırasında 5 saniyede bir GPS koordinatı (enlem/boylam). Konum yalnızca sefer aktifken ve şöförün onayıyla alınır. Geçmiş konum kayıtları sistemde saklanır.</li>
              <li>Mobil uygulama giriş tokeni (30 günlük geçerlilik)</li>
              <li>Yakıt girişleri ve fotoğrafları</li>
              <li>Arıza bildirimleri</li>
            </ul>

            <h3 className="font-semibold text-slate-800 mb-2 mt-4">2.3 Veli Bilgileri</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Ad soyad, telefon numarası</li>
              <li>Kullanıcı adı ve şifresi (bcrypt ile şifreli)</li>
              <li>Expo push bildirimi tokeni (bildirim göndermek için)</li>
            </ul>

            <h3 className="font-semibold text-slate-800 mb-2 mt-4">2.4 Yolcu (Öğrenci/Personel) Bilgileri</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Ad soyad, telefon numarası (isteğe bağlı)</li>
              <li>Güzergah ve durak ataması</li>
              <li>Günlük biniş/inmeme kayıtları (tarih, durum)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">3. Verilerin Kullanım Amaçları</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Filo yönetimi hizmetinin sağlanması (güzergah takibi, yoklama, belge yönetimi)</li>
              <li>Velilere anlık bildirim gönderilmesi (çocuğunun servise binip binmediği)</li>
              <li>Yakıt ve bakım maliyet analizleri</li>
              <li>Süresi dolan belgeler için hatırlatma bildirimleri</li>
              <li>Teknik destek ve hizmet iyileştirme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">4. Konum Verisi</h2>
            <p className="text-sm">
              Teker Takip Şöför uygulaması, yalnızca aktif sefer süresince arka planda konum verisi toplar.
              Konum verisi;
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
              <li>Şöförün uygulamaya girip sefer başlatmasıyla aktif olur</li>
              <li>Sefer bitirildiğinde veya uygulama kapatıldığında durur</li>
              <li>Yalnızca firma yöneticileri ve ilgili velilerle paylaşılır</li>
              <li>Üçüncü taraf reklam şirketleriyle kesinlikle paylaşılmaz</li>
            </ul>
            <p className="text-sm mt-3">
              Android kullanıcıları için arka plan konum izni sefer takibinin sağlıklı çalışması
              için gereklidir. Bu izin, yalnızca uygulama aktifken kullanılır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">5. Veri Saklama ve Güvenlik</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Tüm veriler güvenli sunucularda (PostgreSQL veritabanı) şifreli bağlantıyla saklanır</li>
              <li>Şifreler ve PIN'ler bcrypt algoritmasıyla tek yönlü şifrelenir; düz metin olarak tutulmaz</li>
              <li>Her firma yalnızca kendi verilerine erişebilir (çok kiracılı izolasyon)</li>
              <li>Oturum tokenları 30 gün sonra otomatik geçersiz olur</li>
              <li>Demo hesapları 30 gün sonra silinir</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">6. Üçüncü Taraf Hizmetler</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li><strong>Expo Push Notifications:</strong> Mobil bildirim gönderimi için Expo'nun altyapısı kullanılır. Bildirim tokenleri yalnızca bildirim amacıyla işlenir.</li>
              <li><strong>Yandex / Google Maps:</strong> Navigasyon yönlendirmesi için cihazda kurulu harita uygulaması açılır. Konum verisi bu hizmetlerle ayrıca paylaşılmaz.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">7. Haklarınız</h2>
            <p className="text-sm">
              6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında;
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>Verilerinizin düzeltilmesini veya silinmesini talep etme</li>
              <li>Verilerinizin aktarıldığı üçüncü kişiler hakkında bilgi isteme</li>
              <li>İşlemeye itiraz etme</li>
            </ul>
            <p className="text-sm mt-3">
              Bu haklarınızı kullanmak için <a href={`mailto:${EMAIL}`} className="text-[#DC2626] font-medium">{EMAIL}</a> adresine yazabilirsiniz.
              Talepler 30 gün içinde yanıtlanır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">8. Hesap Silme</h2>
            <p className="text-sm">
              Hesabınızın ve tüm ilişkili verilerin silinmesini talep etmek için
              <a href={`mailto:${EMAIL}`} className="text-[#DC2626] font-medium mx-1">{EMAIL}</a>
              adresine "Hesap Silme Talebi" konusuyla e-posta gönderin.
              Verileriniz 30 gün içinde kalıcı olarak silinir.
            </p>
            <p className="text-sm mt-2 text-slate-500">
              Not: Google Play Store politikası gereği bu seçenek uygulama içinden de sunulacaktır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">9. Çocukların Gizliliği</h2>
            <p className="text-sm">
              Uygulamamız 13 yaşın altındaki çocuklara doğrudan hizmet vermez. Okul servisi
              kapsamındaki öğrenci bilgileri (ad, durak) firma yöneticisi tarafından sisteme girilir
              ve yalnızca servis takibi amacıyla işlenir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">10. Politika Değişiklikleri</h2>
            <p className="text-sm">
              Bu politikada yapılan önemli değişiklikler uygulama içi bildirim veya e-posta
              ile duyurulur. Güncel politika her zaman {SITE}/gizlilik adresinde yayımlanır.
            </p>
          </section>

          <section className="bg-slate-50 rounded-2xl p-6 mt-8">
            <h2 className="text-lg font-bold text-slate-800 mb-2">İletişim</h2>
            <p className="text-sm text-slate-600">
              Gizlilik politikasına ilişkin sorularınız için:
            </p>
            <div className="mt-3 space-y-1 text-sm">
              <p><span className="font-medium">E-posta:</span> <a href={`mailto:${EMAIL}`} className="text-[#DC2626]">{EMAIL}</a></p>
              <p><span className="font-medium">Web:</span> <a href={`https://${SITE}`} className="text-[#DC2626]">{SITE}</a></p>
            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-8 mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-slate-400 space-y-2">
          <p>© {new Date().getFullYear()} Teker Takip · Tüm hakları saklıdır</p>
          <p>
            <Link href="/" className="hover:text-slate-600 transition-colors">Ana Sayfa</Link>
            {" · "}
            <Link href="/gizlilik" className="hover:text-slate-600 transition-colors">Gizlilik Politikası</Link>
          </p>
        </div>
      </footer>

    </div>
  );
}

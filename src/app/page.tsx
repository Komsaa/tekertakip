import Link from "next/link";
import {
  MapPin, Fuel, FileCheck, Smartphone, ChevronRight,
  CheckCircle, Building2, Zap, Shield, ArrowRight, Phone,
} from "lucide-react";

export const metadata = {
  title: "TakerTakip – Servis Firmaları için Filo Yönetimi",
  description: "Şöför mobil uygulaması, canlı konum takibi, yakıt ve belge yönetimi. Arvento'ya alternatif, çok daha uygun maliyetli.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* NAVBAR */}
      <nav className="bg-[#1B2437] sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#DC2626] rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">TT</span>
              </div>
              <span className="text-white font-black text-xl tracking-tight">
                teker<span className="text-[#DC2626]">takip</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#ozellikler" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">Özellikler</a>
              <a href="#nasil-calisir" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">Nasıl Çalışır?</a>
              <a href="#iletisim" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">İletişim</a>
              <Link href="/login" className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2">
                Panel Girişi <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <Link href="/login" className="md:hidden bg-[#DC2626] text-white px-3 py-2 rounded-lg text-sm font-semibold">
              Giriş
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-[#1B2437] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(45deg, #DC2626 0px, #DC2626 1px, transparent 1px, transparent 50px)" }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#DC2626]/20 text-red-400 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              Arvento yerine — çok daha uygun
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
              Filo Takibini<br />
              <span className="text-[#DC2626]">Şöförün Telefonu</span><br />
              Yapsın
            </h1>
            <p className="text-slate-300 text-xl mb-10 leading-relaxed max-w-2xl">
              Servis firmanızdaki her araç için ayrı GPS cihazı almak zorunda değilsiniz.
              Şöförler mobil uygulamayla canlı konum paylaşır, siz anlık takip edersiniz.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#iletisim" className="flex items-center justify-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg">
                Demo İste <ArrowRight className="w-5 h-5" />
              </a>
              <Link href="/login" className="flex items-center justify-center gap-2 border-2 border-white/20 hover:border-white/40 text-white px-8 py-4 rounded-xl font-semibold transition-all">
                Panel Girişi <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none">
            <path d="M0,60 L1440,60 L1440,0 Q720,60 0,0 Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* RAKAMLAR */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "₺0", label: "GPS Cihaz Maliyeti", sub: "Şöförün telefonu yeterli" },
              { value: "7/24", label: "Canlı Takip", sub: "Anlık konum güncellemesi" },
              { value: "1 uygulama", label: "Her Şey Bir Arada", sub: "Konum, yakıt, belgeler" },
              { value: "∞", label: "Şöför", sub: "Kotanıza göre ekleme" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="text-2xl md:text-3xl font-black text-[#DC2626] mb-1">{s.value}</div>
                <div className="font-bold text-slate-800 text-sm">{s.label}</div>
                <div className="text-slate-400 text-xs mt-1">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ÖZELLİKLER */}
      <section id="ozellikler" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-[#1B2437] mb-4">Her Şey Tek Platformda</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Servis firmanızı yönetmek için ihtiyacınız olan her araç burada
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: MapPin,
                title: "Canlı Konum Takibi",
                desc: "Şöför güzergaha başladığında uygulamadan 'Başla' der, telefonu GPS olarak çalışır. Admin panelinde haritada anlık görürsünüz. Arvento, iTrack gibi pahalı cihazlara gerek yok.",
                badge: "Arvento Alternatifi",
                badgeColor: "bg-red-100 text-red-700",
              },
              {
                icon: Smartphone,
                title: "Şöför Mobil Uygulaması",
                desc: "Şöförler yakıt fişini fotoğraflayıp km girerek sisteme gönderir. WhatsApp grubuna yazmak zorunda kalmaz. Tüm kayıtlar anlık panelde görünür.",
                badge: "Android & iOS",
                badgeColor: "bg-blue-100 text-blue-700",
              },
              {
                icon: Fuel,
                title: "Yakıt Takibi",
                desc: "Her mazot alımında fiş fotoğrafı + km girişi. Araç bazında aylık yakıt maliyeti, litre başına fiyat analizi. WhatsApp botu entegrasyonu da mevcut.",
                badge: "Otomatik Hesap",
                badgeColor: "bg-amber-100 text-amber-700",
              },
              {
                icon: FileCheck,
                title: "Belge Yönetimi",
                desc: "SRC, psikoteknik, adli sicil, sağlık raporu, araç muayenesi, sigorta — tüm belgelerin son tarihleri takip edilir. Bitiş yaklaşınca otomatik uyarı.",
                badge: "Otomatik Uyarı",
                badgeColor: "bg-green-100 text-green-700",
              },
              {
                icon: Building2,
                title: "Çoklu Şirket Yönetimi",
                desc: "Birden fazla servis firması yönetiyorsanız hepsini tek panelden takip edin. Her şirket kendi şöförleri ve araçlarıyla izole çalışır.",
                badge: "Multi-tenant",
                badgeColor: "bg-purple-100 text-purple-700",
              },
              {
                icon: Shield,
                title: "Finans & Maaş",
                desc: "Gelir/gider takibi, şöför maaşları, cari hesaplar, çek takibi. Filo yönetiminin tüm finansal tarafı tek ekranda.",
                badge: "Tam Entegre",
                badgeColor: "bg-slate-100 text-slate-700",
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-[#1B2437]/5 rounded-xl flex items-center justify-center">
                    <f.icon className="w-6 h-6 text-[#1B2437]" />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${f.badgeColor}`}>{f.badge}</span>
                </div>
                <h3 className="text-lg font-bold text-[#1B2437] mb-3">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NASIL ÇALIŞIR */}
      <section id="nasil-calisir" className="py-24 bg-[#1B2437] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Nasıl Çalışır?</h2>
            <p className="text-slate-400 text-lg">Şöförden adminine kadar basit bir akış</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Şöför Uygulamayı Açar", desc: "İşletme kodu, adı ve şifresiyle giriş yapar. Bir kez giriş, çıkış yapana kadar hatırlar.", icon: Smartphone },
              { step: "2", title: "Güzergaha Başlar", desc: "\"Başla\" butonuna basar. Telefon arka planda 30 saniyede bir konum gönderir. Yakıt girişi yapar.", icon: MapPin },
              { step: "3", title: "Admin Anlık Görür", desc: "Tüm araçlar haritada canlı. Yakıt kayıtları, belgeler, finansal özet — hepsi anlık güncellenir.", icon: Building2 },
            ].map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-16 h-16 bg-[#DC2626] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-[#DC2626] font-black text-sm mb-2">ADIM {step.step}</div>
                <h3 className="font-bold text-xl mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KİMLER KULLANIR */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-[#1B2437] mb-4">Kimler Kullanır?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Okul Servis Firmaları", items: ["J plakalı araç takibi", "Şöför belge yönetimi", "Güzergah planlaması", "Veli bildirimi (yakında)"] },
              { title: "Personel Servis Firmaları", items: ["Fabrika servis güzergahları", "Çok araç anlık takip", "Yakıt maliyet analizi", "Şöför performansı"] },
              { title: "Küçük–Orta Tur/Transfer", items: ["Araç kiralama takibi", "Sefer planlaması", "Finans ve cari takip", "Çek ve ödeme yönetimi"] },
            ].map((cat) => (
              <div key={cat.title} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg text-[#1B2437] mb-6">{cat.title}</h3>
                <ul className="space-y-3">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* İLETİŞİM / CTA */}
      <section id="iletisim" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-[#1B2437] mb-4">
            Firmanız İçin Demo İsteyin
          </h2>
          <p className="text-slate-500 text-lg mb-10">
            Şirketinizi sisteme ekleyelim, şöförlerinizle birlikte ücretsiz deneyin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/905061227363?text=Merhaba%2C%20tekertakip.com%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
              WhatsApp ile Ulaşın
            </a>
            <a href="tel:05061227363" className="flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-slate-400 text-slate-700 px-8 py-4 rounded-xl font-semibold transition-all">
              <Phone className="w-5 h-5" /> 0506 122 73 63
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1B2437] text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#DC2626] rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-sm">TT</span>
              </div>
              <div>
                <div className="font-black text-lg">teker<span className="text-[#DC2626]">takip</span></div>
                <div className="text-slate-500 text-xs">tekertakip.com</div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link href="/merttur" className="hover:text-white transition-colors">Mert Tur</Link>
              <Link href="/login" className="hover:text-white transition-colors">Panel Girişi</Link>
            </div>
            <div className="text-slate-500 text-sm">
              © {new Date().getFullYear()} TakerTakip
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

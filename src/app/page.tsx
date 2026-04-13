import Link from "next/link";
import { LogoIcon } from "@/components/Logo";
import {
  MapPin, Fuel, FileCheck, Smartphone, ChevronRight,
  CheckCircle, Building2, Zap, Shield, ArrowRight, Phone,
  Clock, AlertTriangle, TrendingUp, Users, X, Check, CheckCircle2,
} from "lucide-react";

export const metadata = {
  title: "TékerTakip – Okul ve Personel Servis Firmalarına Özel Filo Yönetimi",
  description: "Şöför mobil uygulaması, canlı GPS takibi, yakıt ve belge yönetimi, veli bildirimleri. Pahalı GPS cihazlarına gerek yok.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAVBAR ── */}
      <nav className="bg-[#1B2437] sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <LogoIcon size={32} />
              <span className="text-white font-black text-xl tracking-tight">
                teker<span className="text-[#DC2626]">takip</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#sorunlar" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Sorunlar</a>
              <a href="#ozellikler" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Özellikler</a>
              <a href="#karsilastirma" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Karşılaştırma</a>
              <a href="#sss" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">SSS</a>
              <Link href="/login" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                Giriş
              </Link>
              <Link href="/kayit" className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-[#DC2626]/30">
                Ücretsiz Başla <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <Link href="/kayit" className="md:hidden bg-[#DC2626] text-white px-3 py-2 rounded-lg text-sm font-semibold">
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="bg-[#1B2437] text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#DC2626]/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex flex-wrap gap-2 mb-8">
                <div className="inline-flex items-center gap-2 bg-[#DC2626]/15 border border-[#DC2626]/30 text-red-400 rounded-full px-4 py-1.5 text-sm font-medium">
                  <Zap className="w-3.5 h-3.5" />
                  GPS aboneliklerinin 1/5 fiyatına
                </div>
                <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-500/30 text-green-400 rounded-full px-4 py-1.5 text-sm font-medium">
                  <Check className="w-3.5 h-3.5" />
                  ₺0 GPS cihazı
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.08] mb-6">
                Filonuzu<br />
                <span className="text-[#DC2626]">WhatsApp'tan</span><br />
                kurtarın.
              </h1>
              <p className="text-slate-300 text-lg leading-relaxed mb-4 max-w-lg">
                Şöförünüz her sabah nerede? Yakıt ne kadar harcandı? Muayene ne zaman bitiyor?
                Bunları WhatsApp grubundan takip etmenin zamanı geçti.
              </p>
              <p className="text-slate-400 text-base leading-relaxed mb-10 max-w-lg">
                TékerTakip ile tüm filo operasyonunuz tek panelde — şöför uygulaması, canlı harita,
                belge takibi, veli bildirimleri ve finans yönetimi.
              </p>
              {/* Primary CTA */}
              <Link
                href="/kayit"
                className="group relative inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-[#DC2626] hover:bg-[#B91C1C] text-white px-8 py-5 rounded-2xl font-black text-lg transition-all shadow-2xl shadow-[#DC2626]/40 hover:shadow-[#DC2626]/60 hover:scale-[1.03] mb-3"
              >
                <span className="absolute -top-3 -right-3 bg-green-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg animate-bounce">
                  30 GÜN ÜCRETSİZ
                </span>
                Hemen Ücretsiz Başla
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://wa.me/905061227363?text=Merhaba%2C%20tekertakip.com%20i%C3%A7in%20demo%20talep%20ediyorum."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 border border-white/15 hover:border-white/30 hover:bg-white/5 text-white px-6 py-3.5 rounded-xl font-medium transition-all text-sm"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                  Soruları WhatsApp'tan sor
                </a>
                <Link href="/login" className="flex items-center justify-center gap-2 border border-white/15 hover:border-white/30 hover:bg-white/5 text-white px-6 py-3.5 rounded-xl font-medium transition-all text-sm">
                  Mevcut Müşteri Girişi
                </Link>
              </div>
            </div>

            {/* Sağ: Mini ekran mockup */}
            <div className="hidden md:block relative">
              <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-5 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-slate-500 text-xs">tekertakip.com/panel</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-[#1B2437] rounded-xl px-4 py-3">
                    <div>
                      <div className="text-white text-sm font-bold">45 J 9443</div>
                      <div className="text-slate-400 text-xs">Ahmet Yılmaz · Sabah Seferi</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-green-400 text-xs font-medium">Canlı</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-[#1B2437] rounded-xl px-4 py-3">
                    <div>
                      <div className="text-white text-sm font-bold">34 MT 2847</div>
                      <div className="text-slate-400 text-xs">Mehmet Kaya · Güzergahta</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-green-400 text-xs font-medium">Canlı</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-[#1B2437] rounded-xl px-4 py-3">
                    <div>
                      <div className="text-white text-sm font-bold">35 TK 1192</div>
                      <div className="text-slate-400 text-xs">Ali Demir · Beklemede</div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-slate-500 ml-auto" />
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <div>
                        <div className="text-amber-300 text-xs font-semibold">Belge Uyarısı</div>
                        <div className="text-slate-400 text-xs">45 J 9443 · Muayene 12 gün sonra bitiyor</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Bugünkü Sefer", value: "8" },
                      { label: "Aktif Araç", value: "2" },
                      { label: "Aylık Yakıt", value: "₺14.2K" },
                    ].map((s) => (
                      <div key={s.label} className="bg-[#1B2437] rounded-xl p-3 text-center">
                        <div className="text-[#DC2626] font-black text-lg">{s.value}</div>
                        <div className="text-slate-500 text-[10px] leading-tight mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 48" className="w-full" preserveAspectRatio="none">
            <path d="M0,48 L1440,48 L1440,0 Q720,48 0,0 Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* ── ANAHTAR RAKAMLAR ── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 divide-x divide-slate-100">
            {[
              { value: "₺0", label: "GPS Cihaz Maliyeti", sub: "Şöförün telefonu yeterli" },
              { value: "30 sn", label: "Konum Güncellemesi", sub: "Araçlar anlık haritada" },
              { value: "1 gün", label: "Kurulum Süresi", sub: "Aynı gün kullanıma hazır" },
            ].map((s) => (
              <div key={s.label} className="py-8 px-6 text-center">
                <div className="text-3xl md:text-4xl font-black text-[#DC2626] mb-1">{s.value}</div>
                <div className="font-bold text-slate-800 text-sm">{s.label}</div>
                <div className="text-slate-400 text-xs mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── İŞBİRLİKLERİ / LOGOLAR ── */}
      <section className="py-16 bg-slate-50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-slate-400 text-sm font-medium uppercase tracking-widest mb-10">
            Güvenilir İşbirliklerimiz
          </p>
          {/* Logo slotları — gerçek logolar eklenecek */}
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-32 h-12 bg-slate-200/60 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </section>

      {/* ── SORUNLAR ── */}
      <section id="sorunlar" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-[#1B2437] mb-4">
              Hâlâ bu yöntemlerle mi yönetiyorsunuz?
            </h2>
            <p className="text-slate-500 text-lg">Servis firmalarının büyük çoğunluğunun yaşadığı sorunları tanıyor olabilirsiniz.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "💬", title: "WhatsApp Karmaşası", desc: "Şöförler her sabah yakıt, konum ve km'yi WhatsApp grubuna gönderiyor. Arama yapmanız saatler alıyor." },
              { icon: "📋", title: "Excel Belgesi", desc: "Muayene, sigorta, SRC tarihleri ayrı ayrı Excel dosyalarında. Birinin bittiğini genellikle son gün öğreniyorsunuz." },
              { icon: "📍", title: "Konum Bilinmiyor", desc: "\"Şöför nerede?\" sorusunu sormak için telefon açmak zorunda kalıyorsunuz. Araç nerede, ne zaman gelir — belirsiz." },
              { icon: "⛽", title: "Yakıt Takibi Yok", desc: "Aylık ne kadar mazot harcandığını ancak ay sonunda fatura gelince öğreniyorsunuz. Kaçak var mı? Bilinmiyor." },
              { icon: "💸", title: "Dağınık Finans", desc: "Çekler, maaşlar, cari hesaplar, kredi kartı ekstreleri farklı defterlerde. Gerçek kâr/zarar belirsiz." },
              { icon: "📱", title: "Pahalı GPS Cihazı", desc: "Araç başına aylık 150–400 ₺ GPS aboneliği. 10 araç için yıllık 18.000–48.000 ₺ gidiyor." },
            ].map((p) => (
              <div key={p.title} className="bg-white border border-red-100 rounded-2xl p-6">
                <div className="text-3xl mb-4">{p.icon}</div>
                <h3 className="font-bold text-[#1B2437] mb-2">{p.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ÖZELLİKLER ── */}
      <section id="ozellikler" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-[#DC2626]/8 text-[#DC2626] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Platform Özellikleri</div>
            <h2 className="text-3xl md:text-4xl font-black text-[#1B2437] mb-4">Her Şey Tek Panelde</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">Ayrı ayrı araç almak yerine bir platform, bir fiyat.</p>
          </div>

          {/* Büyük özellik — GPS */}
          <div className="grid md:grid-cols-2 gap-10 items-center mb-16 bg-[#1B2437] rounded-3xl p-8 md:p-12">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#DC2626]/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wide">
                GPS Cihazına Alternatif
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-4">
                Cihaz yok.<br />Abonelik yok.<br />Şöförün telefonu yeterli.
              </h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                Şöför sabah "Başla" der, telefon arka planda her 30 saniyede bir konum gönderir.
                Siz haritada tüm araçları anlık görürsünüz. Araç başına ayrıca GPS cihazı almanıza gerek yok.
              </p>
              <div className="flex flex-col gap-2">
                {["30 saniyede bir otomatik güncelleme", "Güzergah geçmişi ve analizi", "Şöför yokken takip durur — batarya tasarrufu"].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />{f}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#0f172a] rounded-2xl p-5 border border-white/10">
              <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, #DC2626 0%, transparent 50%), radial-gradient(circle at 70% 60%, #1d4ed8 0%, transparent 50%)" }} />
                <MapPin className="w-12 h-12 text-[#DC2626] relative z-10" />
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur rounded-lg px-3 py-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                  <span className="text-white text-xs font-medium">2 araç aktif takipte</span>
                </div>
              </div>
            </div>
          </div>

          {/* Diğer özellikler grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Smartphone,
                title: "Şöför Mobil Uygulaması",
                desc: "Durak durak yoklama, yakıt girişi, arıza bildirimi. Şöförler için tasarlanmış, büyük butonlar, sade arayüz.",
                badge: "Android & iOS",
              },
              {
                icon: Fuel,
                title: "Yakıt & OCR",
                desc: "Şöför fiş fotoğrafı çeker, yapay zeka litre, tutar ve tarih bilgisini otomatik okur. Manuel giriş bitti.",
                badge: "AI destekli",
              },
              {
                icon: FileCheck,
                title: "Belge Takibi",
                desc: "Ehliyet, SRC, psikoteknik, muayene, sigorta, kasko — tüm son tarihler izleniyor. Bitmeden uyarı alırsınız.",
                badge: "Otomatik Uyarı",
              },
              {
                icon: Users,
                title: "Veli Uygulaması",
                desc: "Okul servisinde veliler WhatsApp'tan aldıkları şifreyle giriş yapar. Durakta ±20 dk aralığında canlı araç konumunu görür. Çocuk binmezse anında bildirim.",
                badge: "Okul Servisi",
              },
              {
                icon: TrendingUp,
                title: "Finans & Maaş",
                desc: "Gelir/gider, şöför maaşları, çek takibi, kredi kartı ekstreleri, cari hesaplar. Aylık kar/zarar tek ekranda.",
                badge: "Muhasebe",
              },
              {
                icon: Shield,
                title: "Çoklu Şirket",
                desc: "Birden fazla servis firması yönetiyorsanız hepsini tek hesapla görün. Her firma verisi birbirinden izole.",
                badge: "Multi-tenant",
              },
            ].map((f) => (
              <div key={f.title} className="border border-slate-100 rounded-2xl p-7 hover:border-[#DC2626]/30 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-10 h-10 bg-slate-50 group-hover:bg-[#DC2626]/5 rounded-xl flex items-center justify-center transition-colors">
                    <f.icon className="w-5 h-5 text-[#1B2437]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">{f.badge}</span>
                </div>
                <h3 className="font-bold text-[#1B2437] mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KARŞILAŞTIRMA ── */}
      <section id="karsilastirma" className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-[#1B2437] mb-4">Neden TékerTakip?</h2>
            <p className="text-slate-500">Rakiplerinizle ve mevcut yöntemlerinizle karşılaştırın.</p>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="grid grid-cols-4 bg-[#1B2437] text-white text-sm font-semibold">
              <div className="p-4 text-slate-400">Özellik</div>
              <div className="p-4 text-center">
                <div className="text-[#DC2626] font-black">TékerTakip</div>
              </div>
              <div className="p-4 text-center text-slate-400 font-normal">Kurumsal GPS Sistemleri</div>
              <div className="p-4 text-center text-slate-400 font-normal">WhatsApp + Excel</div>
            </div>
            {[
              { feature: "Aylık maliyet (10 araç)", us: "₺999", them: "₺1.500–4.000", excel: "₺0 (ama saatleriniz)" },
              { feature: "GPS cihazı gerekli mi?", us: false, them: true, excel: false },
              { feature: "Canlı konum takibi", us: true, them: true, excel: false },
              { feature: "Yakıt takibi + OCR", us: true, them: false, excel: false },
              { feature: "Belge & son tarih uyarısı", us: true, them: false, excel: false },
              { feature: "Veli bildirimi", us: true, them: false, excel: false },
              { feature: "Finans & maaş yönetimi", us: true, them: false, excel: "Kısmen" },
              { feature: "Şöför mobil uygulaması", us: true, them: true, excel: false },
              { feature: "Kurulum süresi", us: "1 gün", them: "1–4 hafta", excel: "Anlık" },
            ].map((row, i) => (
              <div key={row.feature} className={`grid grid-cols-4 border-t border-slate-100 text-sm ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                <div className="p-4 text-slate-600 font-medium">{row.feature}</div>
                <div className="p-4 flex justify-center items-center">
                  {row.us === true ? <Check className="w-5 h-5 text-green-500" /> :
                   row.us === false ? <X className="w-5 h-5 text-red-300" /> :
                   <span className="font-bold text-[#DC2626]">{row.us}</span>}
                </div>
                <div className="p-4 flex justify-center items-center">
                  {row.them === true ? <Check className="w-5 h-5 text-slate-300" /> :
                   row.them === false ? <X className="w-5 h-5 text-red-200" /> :
                   <span className="text-slate-400 text-xs text-center">{row.them}</span>}
                </div>
                <div className="p-4 flex justify-center items-center">
                  {row.excel === true ? <Check className="w-5 h-5 text-slate-300" /> :
                   row.excel === false ? <X className="w-5 h-5 text-red-200" /> :
                   <span className="text-slate-400 text-xs text-center">{row.excel}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KİMLER KULLANIR ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-[#1B2437] mb-4">Hangi Firmalar Kullanır?</h2>
            <p className="text-slate-500 max-w-lg mx-auto">Okul servisinden personel taşımacılığına, küçük filolardan büyük operasyonlara.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                emoji: "🎒",
                title: "Okul Servis Firmaları",
                sub: "J plakalı araç zorunluluğu olanlar için",
                items: [
                  "Durak durak yoklama — şöför telefondan işaretler",
                  "Veli uygulaması ile anlık araç takibi",
                  "Çocuk binmezse veliye otomatik uyarı",
                  "SRC, psikoteknik, sağlık raporu takibi",
                  "J plaka uygunluk belgesi son tarihi",
                ],
              },
              {
                emoji: "🏭",
                title: "Personel Servis Firmaları",
                sub: "Fabrika ve kurumsal servis operasyonları",
                items: [
                  "Çok araç eş zamanlı canlı takip",
                  "Güzergah ve durak yönetimi",
                  "Yakıt maliyet analizi araç bazında",
                  "Sürücü performansı ve devamsızlık",
                  "Aylık sefer ve masraf raporları",
                ],
              },
              {
                emoji: "🚐",
                title: "Transfer & Tur Firmaları",
                sub: "Bireysel ve kurumsal transfer operasyonları",
                items: [
                  "Sefer planlama ve şöför ataması",
                  "Cari hesap ve çek takibi",
                  "Fatura kesme ve tahsilat yönetimi",
                  "Kredi kartı ve gider yönetimi",
                  "Araç kiralama ve bakım takibi",
                ],
              },
            ].map((cat) => (
              <div key={cat.title} className="rounded-2xl border border-slate-100 overflow-hidden">
                <div className="bg-[#1B2437] px-7 py-6">
                  <div className="text-3xl mb-3">{cat.emoji}</div>
                  <h3 className="font-bold text-white text-lg">{cat.title}</h3>
                  <p className="text-slate-400 text-sm mt-1">{cat.sub}</p>
                </div>
                <div className="px-7 py-6 space-y-3">
                  {cat.items.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SSS ── */}
      <section id="sss" className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-[#1B2437] mb-4">Sık Sorulan Sorular</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "Şöförün akıllı telefonu olması yeterli mi?",
                a: "Evet. Android veya iOS fark etmez. Uygulamamız 2 dakikada kurulur, şöför kullanıcı adı ve şifresiyle giriş yapar. Ekstra cihaz, kablo veya montaj gerektirmez.",
              },
              {
                q: "İnternet olmayan bölgelerde ne olur?",
                a: "Şöför uygulaması çevrimdışı modda çalışmaya devam eder. İnternet bağlantısı sağlandığında tüm veriler otomatik senkronize olur.",
              },
              {
                q: "GPS takibi şöförün pilini ne kadar tüketir?",
                a: "Uygulama arka planda çalışır ve 30 saniyede bir konum gönderir. Optimize edilmiş yapısıyla günlük ek pil tüketimi %5–10 arasındadır.",
              },
              {
                q: "Mevcut verilerimi aktarabilir miyim?",
                a: "Evet. Excel veya CSV formatındaki araç, şöför ve yakıt verilerinizi sisteme aktarmamıza yardımcı oluyoruz. Kurulum desteği ücretsiz.",
              },
              {
                q: "Kaç araç ve şöförle kullanabilirim?",
                a: "Pakete göre değişir. Başlangıç paketimiz 5 araca kadar, büyüme paketimiz 15 araca kadar destek verir. Daha büyük filolar için özel fiyatlandırma yapıyoruz.",
              },
              {
                q: "Verilerim nerede tutuluyor? Güvenli mi?",
                a: "Tüm veriler Türkiye'de barındırılan, şifrelenmiş sunucularda tutulur. Şöför ve firma verileri birbirinden tamamen izole edilmiş durumdadır.",
              },
              {
                q: "Sözleşme zorunlu mu?",
                a: "Hayır. Aylık ödeme yaparsınız, istediğiniz zaman iptal edersiniz. Yıllık ödeme tercih ederseniz indirim uygularız.",
              },
            ].map((item) => (
              <details key={item.q} className="bg-white border border-slate-100 rounded-2xl group">
                <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none">
                  <span className="font-semibold text-[#1B2437] text-sm pr-4">{item.q}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-6 pb-5">
                  <p className="text-slate-500 text-sm leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── SON CTA ── */}
      <section id="iletisim" className="py-24 bg-[#1B2437] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 w-[800px] h-[400px] bg-[#DC2626]/8 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-500/30 text-green-400 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <Clock className="w-3.5 h-3.5" />
            Kurulum 1 iş günü
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-5">
            Bugün başlayın.<br />
            <span className="text-[#DC2626]">30 gün tamamen ücretsiz.</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            Kredi kartı istemiyoruz. Dakikalar içinde hesabınızı açın, şöförleriniz aynı gün uygulamayı indirsin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/kayit"
              className="group relative flex items-center justify-center gap-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-10 py-5 rounded-2xl font-black text-xl transition-all shadow-2xl shadow-[#DC2626]/40 hover:scale-[1.03]"
            >
              Ücretsiz Hesap Aç
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="tel:05061227363" className="flex items-center justify-center gap-2 border border-white/15 hover:border-white/30 hover:bg-white/5 text-white px-7 py-4 rounded-xl font-semibold transition-all">
              <Phone className="w-5 h-5" /> 0506 122 73 63
            </a>
          </div>
          <p className="text-slate-500 text-sm mt-8">
            Sözleşme yok · İstediğiniz zaman iptal · Kurulum desteği dahil
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0f172a] text-white py-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <LogoIcon size={36} />
              <div>
                <div className="font-black text-lg">teker<span className="text-[#DC2626]">takip</span></div>
                <div className="text-slate-600 text-xs">tekertakip.com</div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#ozellikler" className="hover:text-white transition-colors">Özellikler</a>
              <a href="#sss" className="hover:text-white transition-colors">SSS</a>
              <Link href="/login" className="hover:text-white transition-colors">Panel Girişi</Link>
            </div>
            <div className="text-slate-600 text-sm">
              © {new Date().getFullYear()} TékerTakip
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

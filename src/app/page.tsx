import Link from "next/link";
import { LogoIcon } from "@/components/Logo";
import {
  MapPin, Fuel, FileCheck, Smartphone, ChevronRight,
  CheckCircle, Zap, Shield, ArrowRight, Phone,
  Clock, AlertTriangle, TrendingUp, Users, X, Check, Star,
  CreditCard, BadgeCheck, HeadphonesIcon,
} from "lucide-react";

export const metadata = {
  title: "Teker Takip – Okul ve Personel Servis Firmalarına Özel Filo Yönetimi",
  description: "Şöför mobil uygulaması, canlı GPS takibi, yakıt ve belge yönetimi, veli bildirimleri. Aylık ₺5.000 + KDV. GPS cihazına gerek yok.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAVBAR ── */}
      <nav className="bg-[#1B2437] sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <LogoIcon size={32} className="text-white" />
              <span className="text-white font-black text-xl tracking-tight">
                teker<span className="text-[#DC2626]">takip</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#nasil-calisir" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Nasıl Çalışır</a>
              <a href="#ozellikler" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Özellikler</a>
              <a href="#fiyatlandirma" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Fiyatlandırma</a>
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
                  Tüm özellikler tek platformda
                </div>
                <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-500/30 text-green-400 rounded-full px-4 py-1.5 text-sm font-medium">
                  <Check className="w-3.5 h-3.5" />
                  GPS cihazı gerekmez
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
                Teker Takip ile tüm filo operasyonunuz tek panelde — şöför uygulaması, canlı harita,
                belge takibi, veli bildirimleri ve finans yönetimi.
              </p>
              {/* Primary CTA */}
              <Link
                href="/kayit"
                className="group relative inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-[#DC2626] hover:bg-[#B91C1C] text-white px-8 py-5 rounded-2xl font-black text-lg transition-all shadow-2xl shadow-[#DC2626]/40 hover:shadow-[#DC2626]/60 hover:scale-[1.03] mb-3"
              >
                <span className="absolute -top-3 -right-3 bg-green-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg animate-bounce">
                  30 GUN UCRETSIZ
                </span>
                Hemen Ucretsiz Basla
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
                  Sorulariniz icin WhatsApp
                </a>
                <Link href="/login" className="flex items-center justify-center gap-2 border border-white/15 hover:border-white/30 hover:bg-white/5 text-white px-6 py-3.5 rounded-xl font-medium transition-all text-sm">
                  Mevcut Musteri Girisi
                </Link>
              </div>
            </div>

            {/* Sag: Mini ekran mockup */}
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
                      <div className="text-slate-400 text-xs">Ahmet Yilmaz · Sabah Seferi</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-green-400 text-xs font-medium">Canli</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-[#1B2437] rounded-xl px-4 py-3">
                    <div>
                      <div className="text-white text-sm font-bold">34 MT 2847</div>
                      <div className="text-slate-400 text-xs">Mehmet Kaya · Guzergahta</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-green-400 text-xs font-medium">Canli</span>
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
                        <div className="text-amber-300 text-xs font-semibold">Belge Uyarisi</div>
                        <div className="text-slate-400 text-xs">45 J 9443 · Muayene 12 gun sonra bitiyor</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Bugunun Seferi", value: "8" },
                      { label: "Aktif Arac", value: "2" },
                      { label: "Aylik Yakit", value: "14.2K" },
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
              { value: "0", label: "GPS Cihaz Maliyeti", sub: "Soforun telefonu yeterli" },
              { value: "30 sn", label: "Konum Guncellemesi", sub: "Araclar haritada canli" },
              { value: "1 gun", label: "Kurulum Suresi", sub: "Ayni gun kullanima hazir" },
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

      {/* ── GUVEN GOSTERGELERI ── */}
      <section className="py-14 bg-slate-50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "30 Gun", label: "Ucretsiz Deneme", sub: "Kredi karti gerekmez" },
              { value: "1 Gun", label: "Kurulum Suresi", sub: "Ayni gun kullanima hazir" },
              { value: "7/24", label: "Teknik Destek", sub: "WhatsApp & telefon" },
              { value: "%100", label: "Turkiye Sunucu", sub: "Verileriniz burada kalir" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-100 py-6 px-4">
                <div className="text-2xl font-black text-[#DC2626] mb-1">{s.value}</div>
                <div className="font-semibold text-slate-800 text-sm">{s.label}</div>
                <div className="text-slate-400 text-xs mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SORUNLAR ── */}
      <section id="sorunlar" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-[#1B2437] mb-4">
              Hala bu yontemlerle mi yonetiyorsunuz?
            </h2>
            <p className="text-slate-500 text-lg">Servis firmalarinin buyuk cogunlugunun yasadigi sorunlari taniyor olabilirsiniz.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "💬", title: "WhatsApp Karmasa", desc: "Soforler her sabah yakit, konum ve km'yi WhatsApp grubuna gonderiyor. Arama yapmaniz saatler aliyor." },
              { icon: "📋", title: "Excel Belgesi", desc: "Muayene, sigorta, SRC tarihleri ayri ayri Excel dosyalarinda. Birinin bittigini genellikle son gun ogreniyorsunuz." },
              { icon: "📍", title: "Konum Bilinmiyor", desc: "\"Sofor nerede?\" sorusunu sormak icin telefon acmak zorunda kaliyorsunuz. Arac nerede, ne zaman gelir belirsiz." },
              { icon: "⛽", title: "Yakit Takibi Yok", desc: "Aylik ne kadar mazot harcandignı ancak ay sonunda fatura gelince ogreniyorsunuz. Kacak var mi? Bilinmiyor." },
              { icon: "💸", title: "Dagınik Finans", desc: "Cekler, maaslar, cari hesaplar, kredi karti ekstreleri farkli defterlerde. Gercek kar/zarar belirsiz." },
              { icon: "📱", title: "Pahali GPS Cihazi", desc: "Arac basina aylik 150-400 TL GPS aboneligi. 10 arac icin yillik 18.000-48.000 TL gidiyor." },
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

      {/* ── NASIL CALISIR ── */}
      <section id="nasil-calisir" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-[#DC2626]/8 text-[#DC2626] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Baslangic</div>
            <h2 className="text-3xl md:text-4xl font-black text-[#1B2437] mb-4">3 Adimda Hazir</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">Ayni gun kullanima baslayin. IT uzmanina gerek yok.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[33%] right-[33%] h-0.5 bg-gradient-to-r from-[#DC2626]/30 to-[#DC2626]/30" />
            {[
              {
                step: "1",
                icon: "🖥️",
                title: "Hesap Acin",
                desc: "Kayit formunu 2 dakikada doldurun. Hesabiniz aninda aktif olur. Kredi karti istemiyoruz.",
              },
              {
                step: "2",
                icon: "📱",
                title: "Soforler Uygulamayi Indirsin",
                desc: "Her sofore kullanici adi ve sifre gonderin. App Store veya Google Play'den uygulamayi indirip giris yapsinlar — bu kadar.",
              },
              {
                step: "3",
                icon: "🚀",
                title: "Kullanmaya Baslayin",
                desc: "Sofor 'Sefere Basla' der, siz haritada gorursunuz. Belgeler, yakit, veliler — hepsi ayni gunden itibaren calismaya baslar.",
              },
            ].map((s) => (
              <div key={s.step} className="relative text-center">
                <div className="w-20 h-20 bg-[#DC2626]/8 rounded-2xl flex items-center justify-center mx-auto mb-5 relative">
                  <span className="text-3xl">{s.icon}</span>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#DC2626] text-white text-xs font-black rounded-full flex items-center justify-center shadow-lg shadow-[#DC2626]/30">
                    {s.step}
                  </div>
                </div>
                <h3 className="font-bold text-[#1B2437] text-lg mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/kayit" className="inline-flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-[#DC2626]/30 hover:scale-[1.02]">
              Simdi Basla — 30 Gun Ucretsiz
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── OZELLIKLER ── */}
      <section id="ozellikler" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-[#DC2626]/8 text-[#DC2626] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Platform Ozellikleri</div>
            <h2 className="text-3xl md:text-4xl font-black text-[#1B2437] mb-4">Her Sey Tek Panelde</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">Ayri ayri arac almak yerine bir platform, bir fiyat.</p>
          </div>

          {/* Buyuk ozellik — GPS */}
          <div className="grid md:grid-cols-2 gap-10 items-center mb-10 bg-[#1B2437] rounded-3xl p-8 md:p-12">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#DC2626]/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wide">
                GPS Cihazina Alternatif
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-4">
                Cihaz yok.<br />Abonelik yok.<br />Soforun telefonu yeterli.
              </h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                Sofor sabah "Basla" der, telefon arka planda her 30 saniyede bir konum gonderir.
                Siz haritada tum araclari anlik gorursunuz. Arac basina ayrica GPS cihazi almaniza gerek yok.
              </p>
              <div className="flex flex-col gap-2">
                {["30 saniyede bir otomatik guncelleme", "Guzergah gecmisi ve analizi", "Sofor yokken takip durur — batarya tasarrufu"].map((f) => (
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
                  <span className="text-white text-xs font-medium">2 arac aktif takipte</span>
                </div>
              </div>
            </div>
          </div>

          {/* Buyuk ozellik — Veli Bildirimi */}
          <div className="grid md:grid-cols-2 gap-10 items-center mb-10 bg-gradient-to-br from-blue-950 to-[#1B2437] rounded-3xl p-8 md:p-12">
            <div className="order-2 md:order-1">
              {/* Mock telefon bildirimi */}
              <div className="bg-[#0f172a] rounded-2xl p-4 border border-white/10 max-w-xs mx-auto">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-slate-500 text-[10px]">09:41</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-1.5 bg-green-400 rounded-sm" />
                    <div className="w-1 h-1.5 bg-slate-600 rounded-sm" />
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 mb-2 shadow-xl">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">🚌</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#1B2437] text-xs font-bold">Teker Takip</span>
                        <span className="text-slate-400 text-[10px]">az once</span>
                      </div>
                      <p className="text-slate-700 text-xs mt-0.5 leading-relaxed">
                        🚌 <span className="font-semibold">Duraga 3 dakika kaldi!</span><br />
                        Yusuf icin hazir olun.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 mb-2 shadow-xl">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✅</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#1B2437] text-xs font-bold">Teker Takip</span>
                        <span className="text-slate-400 text-[10px]">07:54</span>
                      </div>
                      <p className="text-slate-700 text-xs mt-0.5 leading-relaxed">
                        <span className="font-semibold text-green-700">Yusuf servise bindi.</span><br />
                        Guvenle yolculuk ediyor.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 shadow-xl">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">🚨</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#1B2437] text-xs font-bold">Teker Takip</span>
                        <span className="text-slate-400 text-[10px]">dun</span>
                      </div>
                      <p className="text-slate-700 text-xs mt-0.5 leading-relaxed">
                        <span className="font-semibold text-red-700">Uyari: Durak gecildi!</span><br />
                        Zeynep servise binmedi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wide">
                Okul Servisi icin
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-4">
                Veliler telefona<br />bakmak zorunda kalmaz.<br />
                <span className="text-blue-300">Bildirim zaten gelir.</span>
              </h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                Arac 3 dakika uzaktayken velinin telefonuna otomatik bildirim gider.
                Cocuk servise bindiginde tekrar bildirim — binmezse aninda uyari.
                WhatsApp'a gerek yok, arama yok, merak yok.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { icon: "🔔", text: "\"3 dakika kaldi\" anlik push bildirimi" },
                  { icon: "✅", text: "Cocuk bindi — guvenle yolculuk ediyor" },
                  { icon: "🚨", text: "Binmedi uyarisi — durak gecildiginde aninda" },
                  { icon: "📍", text: "Veliler kendi duragini haritada canli takip eder" },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-3 text-slate-300 text-sm">
                    <span className="text-base w-6 flex-shrink-0">{f.icon}</span>
                    {f.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Diger ozellikler grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Smartphone,
                title: "Sofor Mobil Uygulamasi",
                desc: "Durak durak yoklama, yakit girisi, ariza bildirimi. Soforler icin tasarlanmis, buyuk butonlar, sade arayuz.",
                badge: "Android & iOS",
              },
              {
                icon: Fuel,
                title: "Yakit & OCR",
                desc: "Sofor fis fotografı ceker, yapay zeka litre, tutar ve tarih bilgisini otomatik okur. Manuel giris bitti.",
                badge: "AI Destekli",
              },
              {
                icon: FileCheck,
                title: "Belge Takibi",
                desc: "Ehliyet, SRC, psikoteknik, muayene, sigorta, kasko — tum son tarihler izleniyor. Bitmeden uyari alirsiniz.",
                badge: "Otomatik Uyari",
              },
              {
                icon: Users,
                title: "Veli Uygulamasi",
                desc: "Veliler WhatsApp'tan aldiklari sifreyle giris yapar. Arac yaklasinca bildirim alir, cocuk bince onay gelir.",
                badge: "Okul Servisi",
              },
              {
                icon: TrendingUp,
                title: "Finans & Maas",
                desc: "Gelir/gider, sofor maaslari, cek takibi, kredi karti ekstreleri, cari hesaplar. Aylik kar/zarar tek ekranda.",
                badge: "Muhasebe",
              },
              {
                icon: Shield,
                title: "Coklu Sirket",
                desc: "Birden fazla servis firmasi yonetiyorsaniz hepsini tek hesapla gorun. Her firma verisi birbirinden izole.",
                badge: "Multi-tenant",
              },
            ].map((f) => (
              <div key={f.title} className="bg-white border border-slate-100 rounded-2xl p-7 hover:border-[#DC2626]/30 hover:shadow-md transition-all group">
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

      {/* ── KARSILASTIRMA ── */}
      <section id="karsilastirma" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-[#1B2437] mb-4">Neden Teker Takip?</h2>
            <p className="text-slate-500">Rakiplerinizle ve mevcut yontemlerinizle karsilastirin.</p>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="grid grid-cols-4 bg-[#1B2437] text-white text-sm font-semibold">
              <div className="p-4 text-slate-400">Ozellik</div>
              <div className="p-4 text-center">
                <div className="text-[#DC2626] font-black">Teker Takip</div>
              </div>
              <div className="p-4 text-center text-slate-400 font-normal">Kurumsal GPS Sistemleri</div>
              <div className="p-4 text-center text-slate-400 font-normal">WhatsApp + Excel</div>
            </div>
            {[
              { feature: "Aylik abonelik", us: "5.000 TL + KDV", them: "1.500-4.000 TL + donanim", excel: "0 TL (ama saatleriniz)" },
              { feature: "GPS cihazi gerekli mi?", us: false, them: true, excel: false },
              { feature: "Canli konum takibi", us: true, them: true, excel: false },
              { feature: "Yakit takibi + OCR", us: true, them: false, excel: false },
              { feature: "Belge & son tarih uyarisi", us: true, them: false, excel: false },
              { feature: "Veli bildirimi", us: true, them: false, excel: false },
              { feature: "Finans & maas yonetimi", us: true, them: false, excel: "Kismen" },
              { feature: "Sofor mobil uygulamasi", us: true, them: true, excel: false },
              { feature: "Kurulum suresi", us: "1 gun", them: "1-4 hafta", excel: "Anlik" },
            ].map((row, i) => (
              <div key={row.feature} className={`grid grid-cols-4 border-t border-slate-100 text-sm ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                <div className="p-4 text-slate-600 font-medium">{row.feature}</div>
                <div className="p-4 flex justify-center items-center">
                  {row.us === true ? <Check className="w-5 h-5 text-green-500" /> :
                   row.us === false ? <X className="w-5 h-5 text-red-300" /> :
                   <span className="font-bold text-[#DC2626] text-xs text-center">{row.us}</span>}
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

      {/* ── KIMLER KULLANIR ── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-[#1B2437] mb-4">Hangi Firmalar Kullanir?</h2>
            <p className="text-slate-500 max-w-lg mx-auto">Okul servisinden personel tasimaciligina, kucuk filolardan buyuk operasyonlara.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                emoji: "🎒",
                title: "Okul Servis Firmalari",
                sub: "J plakali arac zorunlulugu olanlar icin",
                items: [
                  "Durak durak yoklama — sofor telefondan isaretler",
                  "Veli uygulamasi ile anlik arac takibi",
                  "Cocuk binmezse veliye otomatik uyari",
                  "SRC, psikoteknik, saglik raporu takibi",
                  "J plaka uygunluk belgesi son tarihi",
                ],
              },
              {
                emoji: "🏭",
                title: "Personel Servis Firmalari",
                sub: "Fabrika ve kurumsal servis operasyonlari",
                items: [
                  "Cok arac es zamanli canli takip",
                  "Guzergah ve durak yonetimi",
                  "Yakit maliyet analizi arac bazinda",
                  "Surucu performansi ve devamsizlik",
                  "Aylik sefer ve masraf raporlari",
                ],
              },
              {
                emoji: "🚐",
                title: "Transfer & Tur Firmalari",
                sub: "Bireysel ve kurumsal transfer operasyonlari",
                items: [
                  "Sefer planlama ve sofor atamasi",
                  "Cari hesap ve cek takibi",
                  "Fatura kesme ve tahsilat yonetimi",
                  "Kredi karti ve gider yonetimi",
                  "Arac kiralama ve bakim takibi",
                ],
              },
            ].map((cat) => (
              <div key={cat.title} className="rounded-2xl border border-slate-100 overflow-hidden bg-white">
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

      {/* ── MUSTERI YORUMLARI ── */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1 mb-3">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
            </div>
            <h2 className="text-3xl font-black text-[#1B2437] mb-3">Musterilerimiz Ne Diyor?</h2>
            <p className="text-slate-500">Turkiye genelinde servis firmalari Teker Takip kullaniyor.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Soforlerim her sabah nerede diye telefon acmayi biraktim. Haritada hepsini goruyorum. Yakit takibi de artik kagitsiz.",
                name: "Hasan K.",
                role: "10 aracli okul servis firmasi · Izmir",
                initials: "HK",
                stars: 5,
              },
              {
                quote: "Velilerden artik 'arac nerede' mesaji gelmiyor. Cocuklari servise bindi bildirimi geliyor, herkes memnun. Cok fark yaratti.",
                name: "Ayse M.",
                role: "Okul Servis Isletmecisi · Manisa",
                initials: "AM",
                stars: 5,
              },
              {
                quote: "Muayene ve sigorta tarihlerini artik takip etmek zorunda kalmiyorum. Sistem uyariyor, ben de zamaninda yeniliyorum.",
                name: "Murat D.",
                role: "Personel Servis Firmasi · Ankara",
                initials: "MD",
                stars: 5,
              },
            ].map((t) => (
              <div key={t.name} className="bg-slate-50 border border-slate-100 rounded-2xl p-7">
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1B2437] text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-[#1B2437] text-sm">{t.name}</div>
                    <div className="text-slate-400 text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FIYATLANDIRMA ── */}
      <section id="fiyatlandirma" className="py-24 bg-[#1B2437] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#DC2626]/6 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-14">
            <div className="inline-block bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-5">
              30 gun ucretsiz, kredi karti gerekmez
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Seffaf Fiyatlandirma</h2>
            <p className="text-slate-400 text-lg">Tek paket, tum ozellikler dahil. Gizli ucret yok.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Aylik paket */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-colors">
              <div className="text-slate-400 font-medium mb-1 text-sm uppercase tracking-wide">Aylik</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-black text-white">5.000</span>
                <span className="text-2xl font-black text-white mb-1">TL</span>
              </div>
              <div className="text-slate-500 text-sm mb-6">+ KDV / ay &middot; Istedigin zaman iptal</div>
              <Link
                href="/kayit"
                className="block text-center border border-white/20 hover:border-white/40 hover:bg-white/5 text-white px-6 py-3.5 rounded-xl font-semibold transition-all text-sm mb-6"
              >
                30 Gun Ucretsiz Basla
              </Link>
              <ul className="space-y-2.5">
                {[
                  "Sinırsiz sofor ve arac",
                  "Canli GPS takibi",
                  "Sofor mobil uygulamasi",
                  "Veli bildirimleri",
                  "Yakit + OCR takibi",
                  "Belge & son tarih uyarisi",
                  "Finans & maas yonetimi",
                  "Kurulum destegi dahil",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Yillik paket — Onerilen */}
            <div className="bg-[#DC2626] rounded-3xl p-8 relative shadow-2xl shadow-[#DC2626]/40">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-amber-400 text-[#1B2437] text-xs font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wide">
                  En Cok Tercih Edilen
                </span>
              </div>
              <div className="text-red-200 font-medium mb-1 text-sm uppercase tracking-wide">Yillik</div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-5xl font-black text-white">50.000</span>
                <span className="text-2xl font-black text-white mb-1">TL</span>
              </div>
              <div className="text-red-200 text-sm mb-1">+ KDV / yil</div>
              <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-6">
                <Check className="w-3 h-3" /> 2 ay bedava &middot; 60.000 TL yerine 50.000 TL
              </div>
              <Link
                href="/kayit"
                className="block text-center bg-white text-[#DC2626] px-6 py-3.5 rounded-xl font-black transition-all text-sm hover:bg-slate-50 shadow-lg mb-6"
              >
                Yillik Paket Basla &rarr;
              </Link>
              <ul className="space-y-2.5">
                {[
                  "Aylik paketin tum ozellikleri",
                  "Oncelikli destek",
                  "Ozellestirilmis onboarding",
                  "Yillik performans raporu",
                  "Fatura ve muhasebe kolayligi",
                  "Fiyat artisından etkilenmeme",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-red-100">
                    <Check className="w-4 h-4 text-white flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Odeme guvencesi */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { icon: BadgeCheck, text: "30 gun icerisinde memnun kalmazsaniz ucret almiyoruz" },
              { icon: CreditCard, text: "Kredi karti, banka havalesi veya EFT ile odeme" },
              { icon: HeadphonesIcon, text: "Kurulum surecinde WhatsApp destek" },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4">
                <item.icon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-slate-300 text-xs leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-slate-500 text-sm mt-8">
            Daha buyuk filolar veya coklu sirket icin{" "}
            <a href="https://wa.me/905061227363" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white underline underline-offset-2 transition-colors">
              WhatsApp&apos;tan
            </a>{" "}
            ozel fiyat alabilirsiniz.
          </p>
        </div>
      </section>

      {/* ── SSS ── */}
      <section id="sss" className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-[#1B2437] mb-4">Sık Sorulan Sorular</h2>
            <p className="text-slate-500">Aklınızdaki soruların cevapları burada.</p>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "Soforun akilli telefonu olması yeterli mi?",
                a: "Evet. Android veya iOS fark etmez. Uygulamamiz 2 dakikada kurulur, sofor kullanici adi ve sifresiyle giris yapar. Ekstra cihaz, kablo veya montaj gerektirmez.",
              },
              {
                q: "30 gunluk deneme nasil isliyor? Kredi karti lazim mi?",
                a: "Hayir, kredi karti istemiyoruz. Hesabinizi acin, 30 gun boyunca tum ozellikleri ucretsiz kullanin. Sure sonunda devam etmek isterseniz odeme bilgilerinizi girin. Devam etmek istemezseniz hesabiniz otomatik kapanir.",
              },
              {
                q: "Odeme nasil yapilir? Fatura kesiyor musunuz?",
                a: "Kredi karti, banka havalesi veya EFT ile odeme kabul ediyoruz. Her odeme icin fatura kesiyoruz. Kurumsal firmalar icin e-fatura da kesilmektedir.",
              },
              {
                q: "Ne zaman iptal edebilirim?",
                a: "Istediginiz zaman. Aylik abonelerde bir sonraki fatura donemi baslamadan once iptal ederseniz ekstra ucret odemezsiniz. Yillik planda ise kalan sure icin kullanim devam eder.",
              },
              {
                q: "Kac arac ve soforle kullanabilirim?",
                a: "Sinir yok. 3 aracli kucuk bir firma da, 50 aracli buyuk bir filo da ayni paketi kullanir. Fiyat arac sayisina gore degismez.",
              },
              {
                q: "Siforleri nasil sisteme ekliyorum?",
                a: "Soforler panelinden ad, telefon ve sifre belirleyip kaydedin. Sofore kullanici adini ve sifresini gonderin, uygulamamizi indirip giris yapsin. Onboarding icin biz de yaninizdayiz.",
              },
              {
                q: "Internet olmayan bolgelerde ne olur?",
                a: "Sofor uygulamasi cevrimdisi modda calismaya devam eder. Internet baglantisi saglandiginda tum veriler otomatik senkronize olur.",
              },
              {
                q: "GPS takibi soforun pilini ne kadar tuketir?",
                a: "Uygulama arka planda calisir ve optimize edilmis yapiyla 30 saniyede bir konum gonderir. Gunluk ek pil tuketimi %10-15 arasindadir.",
              },
              {
                q: "Mevcut verilerimi aktarabilir miyim?",
                a: "Evet. Excel veya CSV formatindaki arac, sofor ve yakit verilerinizi sisteme aktarmaniza yardimci oluyoruz. Kurulum destegi ucretsiz.",
              },
              {
                q: "Verilerim nerede tutuluyor? Guvenli mi?",
                a: "Tum veriler Turkiye'de barindirilmis, sifrelenmis sunucularda tutulur. Sofor ve firma verileri birbirinden tamamen izole edilmis durumdadir.",
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
          <div className="mt-8 bg-white border border-slate-100 rounded-2xl p-6 text-center">
            <p className="text-slate-600 text-sm mb-4">Baska sorunuz mu var?</p>
            <a
              href="https://wa.me/905061227363?text=Merhaba%2C%20tekertakip.com%20hakkinda%20sorum%20var."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
              WhatsApp&apos;tan Sorun
            </a>
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
            Kurulum 1 is gunu
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-5">
            Bugün baslayın.<br />
            <span className="text-[#DC2626]">30 gün tamamen ücretsiz.</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            Kredi karti istemiyoruz. Dakikalar icinde hesabinizi acin, soforleriniz ayni gun uygulamayi indirsin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/kayit"
              className="group relative flex items-center justify-center gap-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-10 py-5 rounded-2xl font-black text-xl transition-all shadow-2xl shadow-[#DC2626]/40 hover:scale-[1.03]"
            >
              Ucretsiz Hesap Ac
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="https://wa.me/905061227363?text=Merhaba%2C%20tekertakip.com%20hakkinda%20bilgi%20almak%20istiyorum."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border border-white/15 hover:border-white/30 hover:bg-white/5 text-white px-7 py-4 rounded-xl font-semibold transition-all"
            >
              <Phone className="w-5 h-5" /> WhatsApp ile Yazin
            </a>
          </div>
          <p className="text-slate-500 text-sm mt-8">
            Sozlesme yok &middot; Istediginiz zaman iptal &middot; Kurulum destegi dahil
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0f172a] text-white py-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <LogoIcon size={36} className="text-white" />
              <div>
                <div className="font-black text-lg">teker<span className="text-[#DC2626]">takip</span></div>
                <div className="text-slate-600 text-xs">tekertakip.com</div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#ozellikler" className="hover:text-white transition-colors">Ozellikler</a>
              <a href="#fiyatlandirma" className="hover:text-white transition-colors">Fiyatlandirma</a>
              <a href="#sss" className="hover:text-white transition-colors">SSS</a>
              <Link href="/gizlilik" className="hover:text-white transition-colors">Gizlilik Politikasi</Link>
              <Link href="/login" className="hover:text-white transition-colors">Panel Girisi</Link>
            </div>
            <div className="text-slate-600 text-sm">
              &copy; {new Date().getFullYear()} Teker Takip
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

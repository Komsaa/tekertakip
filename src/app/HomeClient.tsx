"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { LogoIcon } from "@/components/Logo";
import {
  MapPin, Bell, ClipboardList, Fuel, FileText, Banknote,
  Check, ChevronRight, Menu, X, MessageCircle, Truck,
  Shield, Zap, BarChart3, Smartphone, Star,
} from "lucide-react";

/* ─────────────────── CONSTANTS ─────────────────── */

const WA_LINK = "https://wa.me/905551234567";
const KAYIT_LINK = "/kayit";

const STATS = [
  { value: 50, suffix: "+", label: "Aktif Firma" },
  { value: 10000, suffix: "+", label: "Aylık Sefer" },
  { value: 99, suffix: "%", label: "Müşteri Memnuniyeti" },
  { value: 5, suffix: "dk", label: "Kurulum Süresi" },
];

const FEATURES = [
  {
    icon: MapPin, color: "text-red-500", bg: "bg-red-50",
    title: "Canlı GPS Takibi",
    desc: "Araçlarınızı haritada anlık izleyin. 30 saniyede bir konum güncellemesi.",
    size: "lg",
  },
  {
    icon: Bell, color: "text-blue-500", bg: "bg-blue-50",
    title: "Veli Bildirimleri",
    desc: "Öğrenci binince, ininc ve araç durağa yaklaşınca anında push bildirim.",
    size: "sm",
  },
  {
    icon: Fuel, color: "text-orange-500", bg: "bg-orange-50",
    title: "Yakıt Takibi",
    desc: "Fişi fotoğraflayın, AI otomatik okusun.",
    size: "sm",
  },
  {
    icon: FileText, color: "text-purple-500", bg: "bg-purple-50",
    title: "Belge Yönetimi",
    desc: "SRC, muayene, sigorta — son kullanma tarihi yaklaşınca uyarı.",
    size: "sm",
  },
  {
    icon: Banknote, color: "text-green-500", bg: "bg-green-50",
    title: "Finans & Fatura",
    desc: "KDV, tevkifat hesaplamalı fatura. Maaş ve alacak takibi.",
    size: "sm",
  },
  {
    icon: ClipboardList, color: "text-amber-500", bg: "bg-amber-50",
    title: "Güzergah & Yoklama",
    desc: "Şöförler mobil uygulamadan yoklama alır. Siz panelden görürsünüz.",
    size: "sm",
  },
  {
    icon: BarChart3, color: "text-indigo-500", bg: "bg-indigo-50",
    title: "Aylık Raporlama",
    desc: "Gelir, yakıt gideri, maaş — net kâr tahmini tek ekranda.",
    size: "sm",
  },
];

const TESTIMONIALS = [
  {
    name: "Kadir Yılmaz",
    role: "Filo Sahibi · İzmir · 14 Araç",
    text: "Eskiden her sabah 10 telefon ediyordum. Şimdi ekrandan bakıyorum, kimin nerede olduğunu görüyorum. Belge takibi de hayat kurtardı.",
    rating: 5,
  },
  {
    name: "Hüseyin Acar",
    role: "Okul Servisi Sahibi · Bursa · 8 Araç",
    text: "Veliler artık beni aramıyor, uygulamadan takip ediyorlar. Şikayetler sıfıra indi. Maaş ve yakıt takibi de çok kolay.",
    rating: 5,
  },
  {
    name: "Sevinç Kaya",
    role: "Personel Servisi · Ankara · 22 Araç",
    text: "Fatura kesmek artık 2 dakika sürüyor. Muhasebecim de memnun, her şey kayıt altında.",
    rating: 5,
  },
];

const PLAN_FEATURES = [
  "Sınırsız şöför ve araç",
  "Mobil uygulama (iOS + Android)",
  "Canlı GPS takibi",
  "Belge & sigorta uyarıları",
  "Fatura & maaş yönetimi",
  "7/24 WhatsApp destek",
  "Ücretsiz kurulum desteği",
];

const NOTIF_MESSAGES = [
  { icon: "🚌", text: "Servis 3 dakika sonra durakta" },
  { icon: "✅", text: "Efe Yıldırım servise bindi" },
  { icon: "📍", text: "Araç durağa ulaştı" },
  { icon: "🏠", text: "Efe Yıldırım evine indi" },
];

const MOCK_STUDENTS = [
  { name: "Ayşe Y.", initials: "AY", color: "#DC2626", boarded: true },
  { name: "Mert K.", initials: "MK", color: "#3B82F6", boarded: true },
  { name: "Zeynep D.", initials: "ZD", color: "#8B5CF6", boarded: false },
  { name: "Can T.", initials: "CT", color: "#F59E0B", boarded: false },
];

/* ─────────────────── HOOKS ─────────────────── */

function useAnimatedCounter(target: number, inView: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1600;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return count;
}

/* ─────────────────── COMPONENTS ─────────────────── */

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StatCard({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const count = useAnimatedCounter(value, inView);
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl lg:text-4xl font-black text-white">
        {count.toLocaleString("tr-TR")}{suffix}
      </div>
      <div className="text-slate-400 text-sm mt-1 font-medium">{label}</div>
    </div>
  );
}

function SpotlightHero({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 20 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);

  return (
    <div ref={ref} onMouseMove={handleMouseMove} className="relative overflow-hidden">
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${springX}px ${springY}px, rgba(220,38,38,0.08), transparent 40%)`,
        }}
      />
      {children}
    </div>
  );
}

/* ─────────────────── MAIN ─────────────────── */

export default function HomeClient() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifIdx, setNotifIdx] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNotifIdx((i) => (i + 1) % NOTIF_MESSAGES.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ═══ NAV ═══════════════════════════════════════════════════ */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <LogoIcon size={30} className="text-[#1B2437]" />
            <span className="font-black text-lg text-[#1B2437] tracking-tight">
              teker<span className="text-[#DC2626]">takip</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[["#ozellikler", "Özellikler"], ["#nasil-calisir", "Nasıl Çalışır"], ["#yorumlar", "Yorumlar"], ["#fiyatlandirma", "Fiyatlandırma"]].map(([href, label]) => (
              <a key={href} href={href} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors no-underline">{label}</a>
            ))}
            <Link href="/login" className="px-5 py-2.5 bg-[#1B2437] text-white text-sm font-bold rounded-xl no-underline hover:bg-[#0B111E] transition-colors">Panel Girişi</Link>
            <Link
              href={KAYIT_LINK}
              className="px-5 py-2.5 bg-[#DC2626] text-white text-sm font-bold rounded-xl no-underline hover:bg-[#B91C1C] transition-colors shadow-lg shadow-red-500/20"
            >
              Ücretsiz Deneyin
            </Link>
          </div>

          <button className="md:hidden p-2 text-[#1B2437]" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-t border-slate-100 px-6 py-4 flex flex-col gap-4 shadow-xl"
          >
            {[["#ozellikler", "Özellikler"], ["#nasil-calisir", "Nasıl Çalışır"], ["#yorumlar", "Yorumlar"], ["#fiyatlandirma", "Fiyatlandırma"]].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMobileOpen(false)} className="text-sm font-medium text-slate-700 no-underline">{label}</a>
            ))}
            <Link href="/login" onClick={() => setMobileOpen(false)} className="py-3 bg-[#1B2437] text-white text-center text-sm font-bold rounded-xl no-underline">Panel Girişi</Link>
            <Link href={KAYIT_LINK} onClick={() => setMobileOpen(false)} className="py-3 bg-[#DC2626] text-white text-center text-sm font-bold rounded-xl no-underline">Ücretsiz Deneyin</Link>
          </motion.div>
        )}
      </nav>

      {/* ═══ HERO ═══════════════════════════════════════════════════ */}
      <SpotlightHero>
        <section className="relative bg-[#0B111E] min-h-[92vh] flex items-center overflow-hidden">
          {/* Animated grid background */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(circle, #334155 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          {/* Red glow */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 w-full">
            <div className="flex flex-col lg:flex-row items-center gap-16">

              {/* Left */}
              <div className="flex-1 min-w-0 lg:max-w-[580px]">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-full text-xs font-semibold text-slate-300 mb-8 backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Türkiye&apos;nin Servis Yönetim Platformu
                  </div>
                  <h1 className="text-5xl lg:text-[64px] font-black leading-[1.05] text-white tracking-tight mb-6">
                    Filonuzu<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">tek ekrandan</span><br />
                    yönetin.
                  </h1>
                  <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-xl">
                    Şöförler, veliler, güzergahlar, ödemeler ve belgeler — hepsi bir arada.
                    Kağıt defter ve WhatsApp grubuna son.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link
                      href={KAYIT_LINK}
                      className="inline-flex items-center gap-2 px-7 py-4 bg-[#DC2626] text-white text-base font-bold rounded-2xl no-underline hover:bg-[#B91C1C] transition-all shadow-2xl shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-0.5"
                    >
                      Ücretsiz Deneyin <ChevronRight size={18} />
                    </Link>
                    <a
                      href={WA_LINK} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-7 py-4 border border-white/20 text-white text-base font-semibold rounded-2xl no-underline hover:bg-white/10 transition-all"
                    >
                      <MessageCircle size={18} /> WhatsApp Demo
                    </a>
                  </div>
                  <p className="text-slate-500 text-sm mt-5">14 gün ücretsiz · Kredi kartı gerekmez · Kurulum desteği bizden</p>
                </motion.div>
              </div>

              {/* Right: Dashboard mockup */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex-1 flex justify-center lg:justify-end w-full"
              >
                <div className="w-full max-w-[580px]" style={{ transform: "perspective(1400px) rotateY(-8deg) rotateX(3deg)" }}>
                  <div className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.7)]">
                    {/* Browser bar */}
                    <div className="bg-[#111827] px-4 py-2.5 flex items-center gap-2 border-b border-white/5">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/70" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                        <div className="w-3 h-3 rounded-full bg-green-500/70" />
                      </div>
                      <div className="flex-1 mx-4 bg-white/5 rounded-lg px-3 py-1 text-xs text-slate-500">tekertakip.com/panel</div>
                    </div>
                    <div className="bg-[#1B2437] flex" style={{ height: 340 }}>
                      {/* Sidebar */}
                      <div className="w-36 bg-[#111827] py-4 px-2 flex flex-col gap-1">
                        <div className="flex items-center gap-2 px-2 pb-3 mb-1 border-b border-white/5">
                          <div className="w-5 h-5 rounded bg-[#DC2626] flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full border border-white/60" />
                          </div>
                          <span className="text-[10px] font-black text-white">tekertakip</span>
                        </div>
                        {[
                          { label: "Dashboard", active: true },
                          { label: "Araçlar", active: false },
                          { label: "Şöförler", active: false },
                          { label: "Güzergah", active: false },
                          { label: "Yakıt", active: false },
                          { label: "Raporlar", active: false },
                        ].map((item) => (
                          <div key={item.label} className={`px-2.5 py-1.5 rounded-lg flex items-center gap-2 ${item.active ? "bg-[#DC2626]" : ""}`}>
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.active ? "bg-white" : "bg-slate-600"}`} />
                            <span className={`text-[9px] font-medium ${item.active ? "text-white" : "text-slate-500"}`}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                      {/* Content */}
                      <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-hidden">
                        <div className="text-xs font-bold text-white/70">Bugün · 12 Araç Aktif</div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Aktif Sefer", value: "8", color: "#10B981" },
                            { label: "Bu Ay Yakıt", value: "₺12k", color: "#F97316" },
                            { label: "Bekleyen ₺", value: "₺45k", color: "#DC2626" },
                          ].map((s) => (
                            <div key={s.label} className="bg-[#222D45] rounded-xl p-2.5">
                              <div className="text-base font-black" style={{ color: s.color }}>{s.value}</div>
                              <div className="text-[8px] text-slate-500 mt-0.5">{s.label}</div>
                            </div>
                          ))}
                        </div>
                        <div className="bg-[#222D45] rounded-xl p-2.5 flex-1">
                          <div className="text-[8px] font-bold text-slate-400 mb-2">Canlı Araç Durumu</div>
                          {[
                            { plate: "45 J 9443", driver: "Muhammed", status: "Seferde", color: "#10B981" },
                            { plate: "34 ABC 123", driver: "Ali K.", status: "Durakta", color: "#F59E0B" },
                            { plate: "35 XYZ 456", driver: "Hasan D.", status: "Seferde", color: "#10B981" },
                            { plate: "34 DEF 789", driver: "Yusuf A.", status: "Garajda", color: "#64748B" },
                          ].map((row) => (
                            <div key={row.plate} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                              <span className="text-[8px] text-slate-300 font-mono font-bold">{row.plate}</span>
                              <span className="text-[8px] text-slate-500">{row.driver}</span>
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: row.color }} />
                                <span className="text-[8px]" style={{ color: row.color }}>{row.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </SpotlightHero>

      {/* ═══ STATS BAR ══════════════════════════════════════════════ */}
      <div className="bg-[#1B2437] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </div>

      {/* ═══ PROBLEM → ÇÖZÜM ════════════════════════════════════════ */}
      <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
        <FadeIn className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 border border-red-100 rounded-full text-xs font-semibold text-red-600 mb-5">
            Tanıdık geliyor mu?
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-[#1B2437] tracking-tight mb-4">
            Hâlâ böyle mi yönetiyorsunuz?
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">Çoğu servis firması hâlâ bu yöntemlerle çalışıyor. Bu maliyetli ve yorucu.</p>
        </FadeIn>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* BEFORE */}
          <FadeIn delay={0.1}>
            <div className="bg-red-50 border border-red-100 rounded-3xl p-8">
              <div className="text-red-600 font-bold text-sm uppercase tracking-widest mb-6">Şu an nasıl?</div>
              <div className="space-y-4">
                {[
                  "WhatsApp'tan şöförleri arayıp konum soruyorsunuz",
                  "Excel'de el ile sefer kaydı tutuyorsunuz",
                  "Muayene bitişini son an fark ediyorsunuz",
                  "Her ay fatura kesmek saatler sürüyor",
                  "Velilerden sürekli 'Servis nerede?' araması geliyor",
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-200 text-red-600 flex items-center justify-center flex-shrink-0 text-xs font-black mt-0.5">✕</div>
                    <span className="text-slate-700 text-sm leading-relaxed">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* AFTER */}
          <FadeIn delay={0.2}>
            <div className="bg-green-50 border border-green-100 rounded-3xl p-8">
              <div className="text-green-600 font-bold text-sm uppercase tracking-widest mb-6">TekerTakip ile</div>
              <div className="space-y-4">
                {[
                  "Araçların konumunu haritada anlık görürsünüz",
                  "Seferler otomatik kayıt altına alınır",
                  "Belge bitiş tarihleri 30 gün önceden uyarır",
                  "Fatura 2 dakikada hazır, PDF olarak gönderilir",
                  "Veliler uygulamadan çocuklarını takip eder",
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-black mt-0.5">✓</div>
                    <span className="text-slate-700 text-sm leading-relaxed">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ FEATURES — BENTO ═══════════════════════════════════════ */}
      <section id="ozellikler" className="py-24 px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black text-[#1B2437] tracking-tight mb-4">Her Şey Düşünüldü</h2>
            <p className="text-slate-500 text-lg">Servis yönetiminde ihtiyacınız olan tüm araçlar, tek platformda.</p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Büyük kart — GPS */}
            <FadeIn delay={0} className="lg:col-span-2 lg:row-span-1">
              <div className="bg-white border border-slate-200 rounded-3xl p-8 h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-7 h-7 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#1B2437] mb-2">Canlı GPS Takibi</h3>
                    <p className="text-slate-500 leading-relaxed">Araçlarınızın konumunu Türkiye haritasında anlık izleyin. 30 saniyede bir güncelleme. Hangi araç nerede, ne hızda, kaç dakikada varır — hepsi tek ekranda.</p>
                  </div>
                </div>
                <div className="mt-6 bg-[#1B2437] rounded-2xl h-32 flex items-center justify-center overflow-hidden relative">
                  <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle, #334155 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                  {[
                    { top: "30%", left: "25%", color: "#10B981", label: "45 J 9443" },
                    { top: "55%", left: "60%", color: "#F59E0B", label: "34 ABC" },
                    { top: "20%", left: "70%", color: "#10B981", label: "35 XYZ" },
                  ].map((pin) => (
                    <div key={pin.label} className="absolute flex flex-col items-center" style={{ top: pin.top, left: pin.left }}>
                      <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold" style={{ background: pin.color }}>
                        <Truck className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="mt-1 bg-white/90 rounded px-1 text-[8px] font-bold text-slate-700 whitespace-nowrap">{pin.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Küçük kartlar */}
            {FEATURES.slice(1).map((f, i) => (
              <FadeIn key={f.title} delay={0.05 * (i + 1)}>
                <div className="bg-white border border-slate-200 rounded-3xl p-6 h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                    <f.icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="text-base font-bold text-[#1B2437] mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MOBILE APP + NOTIFICATIONS ════════════════════════════ */}
      <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Phone mockup — yoklama ekranı */}
          <FadeIn delay={0.1} className="flex justify-center">
            <div>
              <div className="w-[260px] bg-[#1B2437] rounded-[40px] p-3.5 shadow-[0_60px_100px_-20px_rgba(27,36,55,0.5)]">
                <div className="bg-[#0F1626] rounded-[30px] overflow-hidden h-[500px] flex flex-col">
                  <div className="h-5 flex items-center justify-center">
                    <div className="w-16 h-1.5 rounded-full bg-[#334155]" />
                  </div>
                  <div className="px-4 py-3 border-b border-white/5">
                    <div className="text-xs text-slate-400 font-semibold">Bugünkü Sefer</div>
                    <div className="text-sm font-bold text-white mt-0.5">45 J 9443 — Muhammed</div>
                  </div>
                  <div className="flex-1 px-4 py-3 flex flex-col gap-2 overflow-hidden">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Yoklama Listesi</div>
                    {MOCK_STUDENTS.map((st) => (
                      <div key={st.name} className="flex items-center gap-3 p-2.5 bg-[#1B2437] rounded-xl">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0" style={{ background: st.color }}>
                          {st.initials}
                        </div>
                        <div className="flex-1 text-xs text-white font-medium">{st.name}</div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${st.boarded ? "bg-green-500" : "bg-slate-700"}`}>
                          {st.boarded ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} /> : <span className="text-slate-400 text-xs">○</span>}
                        </div>
                      </div>
                    ))}
                    <button className="mt-auto p-3.5 bg-[#DC2626] rounded-xl text-xs font-bold text-white text-center">
                      Sefer Başlat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-semibold text-slate-500 mb-5">
              <Smartphone className="w-3.5 h-3.5" /> iOS & Android
            </div>
            <h2 className="text-4xl font-black text-[#1B2437] tracking-tight mb-4">Şöförler için<br />mobil uygulama</h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              Şöförleriniz telefona uygulamayı yükler, siz kontrol edersiniz. Sefer başlatma, yoklama, yakıt girişi ve konum paylaşımı hepsi mobilde.
            </p>
            <div className="space-y-3 mb-8">
              {[
                "Sefer başlatma ve durak yoklama",
                "Canlı GPS konum paylaşımı",
                "Yakıt fişi fotoğrafla giriş",
                "Arıza bildirimi (fotoğraflı)",
                "Veli bildirimlerini otomatik tetikler",
              ].map((text) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-red-600" strokeWidth={3} />
                  </div>
                  <span className="text-slate-700 text-sm">{text}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="px-5 py-3 bg-[#1B2437] rounded-xl text-white text-sm font-semibold flex items-center gap-2 cursor-pointer">
                <span>App Store</span>
              </div>
              <div className="px-5 py-3 bg-[#1B2437] rounded-xl text-white text-sm font-semibold flex items-center gap-2 cursor-pointer">
                <span>Google Play</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ VELİ BİLDİRİMLERİ ══════════════════════════════════════ */}
      <section className="py-24 px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn delay={0.1}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full text-xs font-semibold text-blue-600 mb-5">
              <Bell className="w-3.5 h-3.5" /> Veli Takip Sistemi
            </div>
            <h2 className="text-4xl font-black text-[#1B2437] tracking-tight mb-4">Veliler anında haberdar olur</h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              Araç durağa yaklaştığı andan çocuk eve güvenle indiği ana kadar, veli hiçbir şeyi kaçırmaz. Sizi aramak zorunda kalmaz.
            </p>
            <div className="space-y-3">
              {[
                "Araç durağa 3 dakika yaklaştığında bildirim",
                "Çocuk servise bindiğinde anlık onay",
                "Okul çıkışında servise biniş bildirimi",
                "Evine güvenle indiğinde tekrar bildirim",
                "Gecikme durumunda otomatik uyarı",
              ].map((text) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-blue-600" strokeWidth={3} />
                  </div>
                  <span className="text-slate-700 text-sm">{text}</span>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Telefon — bildirimler */}
          <FadeIn delay={0.2} className="flex justify-center">
            <div className="w-[260px] bg-[#1B2437] rounded-[40px] p-3.5 shadow-[0_60px_100px_-20px_rgba(27,36,55,0.5)]">
              <div className="bg-[#0F1626] rounded-[30px] overflow-hidden h-[500px] flex flex-col">
                <div className="h-5 flex items-center justify-center">
                  <div className="w-16 h-1.5 rounded-full bg-[#334155]" />
                </div>
                <div className="text-center mt-5 mb-2">
                  <div className="text-3xl font-bold text-white">09:14</div>
                  <div className="text-xs text-slate-500 mt-1">Salı, 28 Temmuz</div>
                </div>
                <div className="flex-1 px-4 py-4 flex flex-col gap-3">
                  {NOTIF_MESSAGES.map((n, i) => (
                    <motion.div
                      key={n.text}
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{
                        opacity: i <= notifIdx ? [0, 0.4, 1][Math.min(notifIdx - i, 2)] ?? 0.3 : 0,
                        y: 0, scale: 1,
                      }}
                      transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      className="flex items-start gap-3 p-3 bg-white/8 rounded-2xl border border-white/8 backdrop-blur-sm"
                      style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.06)" }}
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#DC2626] flex items-center justify-center text-lg flex-shrink-0">
                        {n.icon}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white mb-0.5">tekertakip</div>
                        <div className="text-xs text-slate-300 leading-snug">{n.text}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══════════════════════════════════════════ */}
      <section id="nasil-calisir" className="bg-[#1B2437] py-24 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">5 dakikada başlayın</h2>
            <p className="text-slate-400 text-lg">Kurulum yok, teknik bilgi gerekmez.</p>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-[#DC2626]/0 via-[#DC2626]/50 to-[#DC2626]/0" />
            {[
              { num: "01", icon: "🏢", title: "Firmanızı kaydedin", desc: "WhatsApp'tan iletişime geçin. Hesabınız 5 dakikada hazır." },
              { num: "02", icon: "🚌", title: "Araçlarınızı ekleyin", desc: "Araç, şöför ve güzergahları sisteme girin. Şöförler uygulamayı indirir." },
              { num: "03", icon: "📱", title: "Yönetmeye başlayın", desc: "Filonuzu panelden takip edin. Veliler uygulamadan çocuklarını izlesin." },
            ].map((step, i) => (
              <FadeIn key={step.num} delay={i * 0.15} className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 rounded-full bg-[#222D45] border-2 border-[#DC2626]/50 flex items-center justify-center text-3xl">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#DC2626] flex items-center justify-center text-white text-xs font-black">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══════════════════════════════════════════ */}
      <section id="yorumlar" className="py-24 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black text-[#1B2437] tracking-tight mb-4">Müşterilerimiz anlatıyor</h2>
            <p className="text-slate-500 text-lg">Gerçek firmalar, gerçek sonuçlar.</p>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.1}>
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-7 h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex gap-0.5 mb-5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 leading-relaxed text-sm mb-6">&ldquo;{t.text}&rdquo;</p>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{t.name}</div>
                    <div className="text-slate-400 text-xs mt-0.5">{t.role}</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ════════════════════════════════════════════════ */}
      <section id="fiyatlandirma" className="py-24 px-6 lg:px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black text-[#1B2437] tracking-tight mb-4">Şeffaf fiyatlandırma</h2>
            <p className="text-slate-500 text-lg">Gizli maliyet yok. İstediğiniz zaman iptal.</p>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            {/* Aylık */}
            <FadeIn delay={0.1}>
              <div className="bg-white border border-slate-200 rounded-3xl p-8 h-full flex flex-col">
                <div className="text-slate-500 text-sm font-semibold mb-4">Aylık Plan</div>
                <div className="text-5xl font-black text-[#1B2437] mb-1">₺6.000</div>
                <div className="text-slate-400 text-sm mb-8">aylık</div>
                <div className="space-y-3 flex-1 mb-8">
                  {PLAN_FEATURES.map((f) => (
                    <div key={f} className="flex items-center gap-3 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" strokeWidth={2.5} />
                      {f}
                    </div>
                  ))}
                </div>
                <Link href={KAYIT_LINK}
                  className="block py-3.5 text-center border-2 border-[#1B2437] text-[#1B2437] font-bold rounded-2xl no-underline hover:bg-[#1B2437] hover:text-white transition-all">
                  Başlayın
                </Link>
              </div>
            </FadeIn>

            {/* Yıllık */}
            <FadeIn delay={0.2}>
              <div className="bg-[#1B2437] border-2 border-[#DC2626] rounded-3xl p-8 h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#DC2626] text-white text-xs font-black px-4 py-1.5 rounded-bl-2xl tracking-wider">POPÜLER</div>
                <div className="text-slate-400 text-sm font-semibold mb-4">Yıllık Plan</div>
                <div className="text-5xl font-black text-white mb-1">₺60.000</div>
                <div className="text-slate-400 text-sm mb-2">yıllık</div>
                <div className="inline-flex items-center gap-1.5 bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full mb-8">
                  <Zap className="w-3 h-3" /> 2 Ay Bedava — ₺12.000 Tasarruf
                </div>
                <div className="space-y-3 flex-1 mb-8">
                  {PLAN_FEATURES.map((f) => (
                    <div key={f} className="flex items-center gap-3 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" strokeWidth={2.5} />
                      {f}
                    </div>
                  ))}
                </div>
                <Link href={KAYIT_LINK}
                  className="block py-3.5 text-center bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-2xl no-underline transition-colors shadow-xl shadow-red-500/20">
                  Başlayın
                </Link>
              </div>
            </FadeIn>
          </div>
          <FadeIn delay={0.3} className="text-center mt-8 text-slate-400 text-sm">
            <Shield className="w-4 h-4 inline mr-1.5 text-slate-400" />
            14 gün ücretsiz deneme · Kredi kartı gerekmez · İstediğin an iptal
          </FadeIn>
        </div>
      </section>

      {/* ═══ FINAL CTA ══════════════════════════════════════════════ */}
      <section className="relative bg-[#0B111E] py-28 px-6 lg:px-8 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, #334155 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-red-600/15 rounded-full blur-3xl" />
        <FadeIn className="relative">
          <h2 className="text-5xl lg:text-6xl font-black text-white tracking-tight mb-5">
            Filonuzu bugün<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">dijitalleştirin.</span>
          </h2>
          <p className="text-slate-400 text-xl mb-10 max-w-xl mx-auto">14 gün ücretsiz deneyin. Kurulum desteği bizden. İstediğiniz zaman iptal.</p>
          <Link
            href={KAYIT_LINK}
            className="inline-flex items-center gap-3 px-9 py-5 bg-[#DC2626] text-white text-lg font-bold rounded-2xl no-underline hover:bg-[#B91C1C] transition-all shadow-2xl shadow-red-500/30 hover:-translate-y-1"
          >
            Hemen Başlayın <ChevronRight className="w-5 h-5" />
          </Link>
          <p className="text-slate-600 text-sm mt-6">tekertakip.com · destek@tekertakip.com</p>
        </FadeIn>
      </section>

      {/* ═══ FOOTER ═════════════════════════════════════════════════ */}
      <footer className="bg-[#1B2437] border-t border-white/5 px-6 lg:px-8 py-14">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-12 justify-between pb-10 border-b border-white/5">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2.5 mb-4">
              <LogoIcon size={26} className="text-white" />
              <span className="text-lg font-black text-white">teker<span className="text-[#DC2626]">takip</span></span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[220px]">Türkiye&apos;nin servis filosu yönetim platformu.</p>
          </div>
          {[
            { title: "Ürün", links: ["Özellikler", "Fiyatlandırma", "Demo İste"] },
            { title: "Şirket", links: ["Hakkımızda", "İletişim"] },
            { title: "Destek", links: ["Gizlilik Politikası", "SSS"] },
          ].map((col) => (
            <div key={col.title} className="min-w-[120px]">
              <div className="text-white font-bold text-sm mb-4">{col.title}</div>
              <div className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <span key={link} className="text-slate-400 text-sm hover:text-white cursor-pointer transition-colors">{link}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="pt-8 text-slate-600 text-xs">© 2026 tekertakip. Tüm hakları saklıdır.</div>
      </footer>

      {/* WhatsApp float */}
      <a
        href={WA_LINK} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30 hover:scale-110 transition-transform"
        aria-label="WhatsApp"
      >
        <MessageCircle size={26} color="#fff" />
      </a>
    </div>
  );
}

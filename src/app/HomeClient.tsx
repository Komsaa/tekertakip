"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LogoIcon } from "@/components/Logo";
import { Check, ChevronRight, Menu, X, MessageCircle } from "lucide-react";

const FEATURES = [
  {
    icon: "📍", bg: "#FEE2E2",
    title: "Canlı Konum Takibi",
    desc: "Araçlarınızın konumunu haritada anlık izleyin. Veliler de öğrencilerini takip edebilir.",
  },
  {
    icon: "👨‍👩‍👧", bg: "#E7EAF3",
    title: "Veli Bildirim Sistemi",
    desc: "Öğrenci bindiğinde, indiğinde veya araç yaklaştığında veliye anında push bildirim gönderilir.",
  },
  {
    icon: "📋", bg: "#FEE2E2",
    title: "Güzergah & Yoklama",
    desc: "Durakları, öğrencileri ve seferleri dijital ortamda yönetin. Şöförler mobil uygulamadan yoklama alır.",
  },
  {
    icon: "⛽", bg: "#E7EAF3",
    title: "Yakıt & Masraf Takibi",
    desc: "Yakıt girişlerini AI ile fişten otomatik okuyun. Masraflarınızı kategorize edin, raporlayın.",
  },
  {
    icon: "📄", bg: "#FEE2E2",
    title: "Belge & Sertifika Yönetimi",
    desc: "SRC belgesi, muayene, sigorta – tüm belgelerin son kullanma tarihlerini takip edin, uyarı alın.",
  },
  {
    icon: "💰", bg: "#E7EAF3",
    title: "Servis Ücreti Takibi",
    desc: "Veli ödemelerini aylık takip edin. Borç/alacak durumunu tek ekrandan görün.",
  },
];

const NOTIF_MESSAGES = [
  { icon: "🚌", sub: "Servis 3 dakika sonra durakta olacak" },
  { icon: "📍", sub: "Araç durakta" },
  { icon: "✅", sub: "Efe Yıldırım servise güvenle bindi" },
  { icon: "🏠", sub: "Efe Yıldırım evine güvenle indi" },
];

const MOCK_STUDENTS = [
  { name: "Ayşe Y.", initials: "AY", color: "#DC2626", boarded: true },
  { name: "Mert K.", initials: "MK", color: "#3B82F6", boarded: true },
  { name: "Zeynep D.", initials: "ZD", color: "#8B5CF6", boarded: false },
  { name: "Can T.", initials: "CT", color: "#F59E0B", boarded: false },
];

const APP_BULLETS = [
  "iOS ve Android'de kullanılabilir",
  "Sefer başlatma ve yoklama alma",
  "Canlı konum paylaşımı",
  "Yakıt ve arıza bildirimi",
  "Veli bildirimlerini otomatik tetikler",
];

const PLAN_FEATURES = ["Sınırsız kullanıcı", "Tüm özellikler dahil", "7/24 destek", "Ücretsiz kurulum"];

const FOOTER_COLS = [
  { title: "Ürün", links: ["Özellikler", "Fiyatlandırma", "Demo"] },
  { title: "Şirket", links: ["Hakkımızda", "İletişim", "Gizlilik Politikası"] },
  { title: "Destek", links: ["SSS", "Belgeler"] },
];

const WA_LINK = "https://wa.me/905551234567";

function useReveal() {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.getAttribute("data-reveal")!;
            setRevealed((prev) => ({ ...prev, [id]: true }));
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return revealed;
}

function rx(on: boolean): React.CSSProperties {
  return {
    opacity: on ? 1 : 0,
    transform: on ? "translateY(0)" : "translateY(28px)",
    transition: "opacity .8s ease, transform .8s ease",
  };
}

export default function HomeClient() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifs, setNotifs] = useState<Array<{ id: number; icon: string; sub: string; entered: boolean }>>([]);
  const notifIdx = useRef(0);
  const notifId = useRef(0);
  const revealed = useReveal();

  useEffect(() => {
    const push = () => {
      const msg = NOTIF_MESSAGES[notifIdx.current % NOTIF_MESSAGES.length];
      notifIdx.current++;
      const id = notifId.current++;
      setNotifs((prev) => [...prev.slice(-2), { id, icon: msg.icon, sub: msg.sub, entered: false }]);
      setTimeout(() => {
        setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, entered: true } : n)));
      }, 30);
    };
    push();
    const t = setInterval(push, 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── NAV ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <LogoIcon size={32} className="text-[#1B2437]" />
            <span style={{ fontWeight: 800, fontSize: 20, color: "#1B2437", letterSpacing: "-0.02em" }}>
              teker<span style={{ color: "#DC2626" }}>takip</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 36 }}>
            <a href="#ozellikler" style={{ fontSize: 15, fontWeight: 500, color: "#334155", textDecoration: "none" }}>Özellikler</a>
            <a href="#nasil-calisir" style={{ fontSize: 15, fontWeight: 500, color: "#334155", textDecoration: "none" }}>Nasıl Çalışır</a>
            <a href="#fiyatlandirma" style={{ fontSize: 15, fontWeight: 500, color: "#334155", textDecoration: "none" }}>Fiyatlandırma</a>
            <Link href="/login" style={{ fontSize: 15, fontWeight: 500, color: "#334155", textDecoration: "none" }}>Panel Girişi</Link>
            <a
              href={WA_LINK} target="_blank" rel="noopener noreferrer"
              style={{ padding: "10px 22px", background: "#DC2626", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
            >
              Ücretsiz Deneyin
            </a>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} style={{ padding: 6, background: "none", border: "none", cursor: "pointer", color: "#1B2437" }}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileOpen && (
          <div style={{ background: "#fff", borderTop: "1px solid #E2E8F0", padding: "16px 32px", display: "flex", flexDirection: "column", gap: 18, boxShadow: "0 12px 24px rgba(27,36,55,0.1)" }}>
            {["#ozellikler:Özellikler", "#nasil-calisir:Nasıl Çalışır", "#fiyatlandirma:Fiyatlandırma"].map((item) => {
              const [href, label] = item.split(":");
              return (
                <a key={href} href={href} onClick={() => setMobileOpen(false)} style={{ fontSize: 15, fontWeight: 500, color: "#334155", textDecoration: "none" }}>{label}</a>
              );
            })}
            <Link href="/login" onClick={() => setMobileOpen(false)} style={{ fontSize: 15, fontWeight: 500, color: "#334155", textDecoration: "none" }}>Panel Girişi</Link>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{ padding: "12px", textAlign: "center", background: "#DC2626", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Ücretsiz Deneyin</a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative", padding: "88px 32px 100px", background: "radial-gradient(circle at 88% 8%, rgba(27,36,55,0.07), transparent 45%)", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, #CBD5E1 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.35, pointerEvents: "none" }} />
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", gap: 64, flexWrap: "wrap", position: "relative" }}>

          {/* Left */}
          <div style={{ flex: "1 1 480px", minWidth: 300 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 999, fontSize: 13, fontWeight: 600, color: "#1B2437", marginBottom: 28 }}>
              <span>🚌</span><span>Türkiye&apos;nin Servis Yönetim Platformu</span>
            </div>
            <h1 style={{ fontSize: "clamp(40px,5vw,62px)", lineHeight: 1.06, fontWeight: 900, color: "#1B2437", letterSpacing: "-0.03em", marginBottom: 24 }}>
              Servis Filosunu<br />
              Tek Ekrandan<br />
              <span style={{ color: "#DC2626" }}>Yönet.</span>
            </h1>
            <p style={{ fontSize: 19, lineHeight: 1.6, color: "#475569", maxWidth: 520, marginBottom: 36 }}>
              Şöförler, veliler, güzergahlar, ödemeler ve belgeler – hepsi bir arada. Servis firmanızı bir adım öne çıkarın.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <a
                href={WA_LINK} target="_blank" rel="noopener noreferrer"
                style={{ padding: "16px 28px", background: "#DC2626", color: "#fff", borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: "none", boxShadow: "0 8px 20px rgba(220,38,38,0.3)", display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                Ücretsiz Deneyin <ChevronRight size={18} />
              </a>
              <a
                href={WA_LINK} target="_blank" rel="noopener noreferrer"
                style={{ padding: "16px 28px", background: "transparent", color: "#1B2437", border: "2px solid #1B2437", borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: "none" }}
              >
                WhatsApp Demo
              </a>
            </div>
          </div>

          {/* Right: Dashboard mockup */}
          <div style={{ flex: "1 1 480px", minWidth: 340, display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 620, transform: "perspective(1400px) rotateY(-10deg) rotateX(3deg)", boxShadow: "0 60px 100px -20px rgba(27,36,55,0.45)", borderRadius: 16, overflow: "hidden", border: "1px solid #2A3650" }}>
              <div style={{ background: "#1B2437", display: "flex", height: 360 }}>
                {/* Sidebar */}
                <div style={{ width: 140, background: "#111827", padding: "16px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px 12px", borderBottom: "1px solid #1F2937", marginBottom: 4 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid white" }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>tekertakip</span>
                  </div>
                  {[
                    { icon: "⬛", label: "Dashboard", active: true },
                    { icon: "🚌", label: "Araçlar", active: false },
                    { icon: "👤", label: "Şöförler", active: false },
                    { icon: "🗺️", label: "Güzergah", active: false },
                    { icon: "⛽", label: "Yakıt", active: false },
                    { icon: "💰", label: "Finans", active: false },
                  ].map((item) => (
                    <div key={item.label} style={{ padding: "6px 8px", borderRadius: 7, background: item.active ? "#DC2626" : "transparent", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 9 }}>{item.icon}</span>
                      <span style={{ fontSize: 9, color: item.active ? "#fff" : "#64748B", fontWeight: item.active ? 700 : 400 }}>{item.label}</span>
                    </div>
                  ))}
                </div>
                {/* Main content */}
                <div style={{ flex: 1, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Dashboard</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    {[
                      { label: "Toplam Araç", value: "12", color: "#DC2626" },
                      { label: "Aktif Sefer", value: "8", color: "#10B981" },
                      { label: "Öğrenci", value: "247", color: "#3B82F6" },
                    ].map((s) => (
                      <div key={s.label} style={{ background: "#222D45", borderRadius: 10, padding: "10px 8px" }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 9, color: "#64748B", marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "#222D45", borderRadius: 10, padding: 10, flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", marginBottom: 8 }}>Aktif Seferler</div>
                    {[
                      { plate: "34 ABC 123", driver: "Mehmet Y.", status: "Seferde", dot: "#10B981" },
                      { plate: "34 XYZ 456", driver: "Ali K.", status: "Durakta", dot: "#F59E0B" },
                      { plate: "34 DEF 789", driver: "Hasan D.", status: "Seferde", dot: "#10B981" },
                      { plate: "34 GHI 001", driver: "Yusuf A.", status: "Garajda", dot: "#64748B" },
                    ].map((row) => (
                      <div key={row.plate} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #2A3650" }}>
                        <div style={{ fontSize: 9, color: "#E2E8F0", fontWeight: 600 }}>{row.plate}</div>
                        <div style={{ fontSize: 9, color: "#64748B" }}>{row.driver}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: row.dot }} />
                          <span style={{ fontSize: 8, color: row.dot }}>{row.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="ozellikler" data-reveal="features" style={{ ...rx(!!revealed.features), padding: "110px 32px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: 42, fontWeight: 800, color: "#1B2437", letterSpacing: "-0.02em", marginBottom: 16 }}>Her Şey Düşünüldü</h2>
          <p style={{ fontSize: 18, color: "#64748B", maxWidth: 560, margin: "0 auto" }}>Servis yönetiminde ihtiyacınız olan tüm araçlar, tek platformda.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card" style={{ padding: 32, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, transition: "transform .25s ease, box-shadow .25s ease" }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 20 }}>{f.icon}</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "#1B2437", marginBottom: 10 }}>{f.title}</div>
              <div style={{ fontSize: 15, lineHeight: 1.6, color: "#64748B" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PARENT NOTIFICATIONS ── */}
      <section data-reveal="notif" style={{ ...rx(!!revealed.notif), padding: "110px 32px", maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", gap: 80, flexWrap: "wrap-reverse" }}>
        <div style={{ flex: "1 1 420px", minWidth: 300 }}>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: "#1B2437", letterSpacing: "-0.02em", marginBottom: 28 }}>Veliler Anında Haberdar Olur</h2>
          <p style={{ fontSize: 17, color: "#64748B", lineHeight: 1.6, marginBottom: 32, maxWidth: 460 }}>
            Araç durağa yaklaştığı andan öğrenci evine güvenle indiği ana kadar, veli hiçbir şeyi kaçırmaz.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {["Araç durağa yaklaşınca bildirim", "Öğrenci bindiğinde anlık onay", "İndiğinde tekrar bildirim", "Gecikme durumunda uyarı"].map((text) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "#E7EAF3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Check size={13} color="#1B2437" strokeWidth={3} />
                </div>
                <span style={{ fontSize: 16, color: "#334155" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Phone mockup */}
        <div style={{ flex: "1 1 320px", display: "flex", justifyContent: "center", minWidth: 280 }}>
          <div style={{ width: 260, background: "#1B2437", borderRadius: 36, padding: 14, boxShadow: "0 40px 80px -20px rgba(27,36,55,0.4)" }}>
            <div style={{ background: "linear-gradient(160deg,#0F1626,#1B2437)", borderRadius: 24, overflow: "hidden", height: 480, display: "flex", flexDirection: "column" }}>
              <div style={{ height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 60, height: 5, borderRadius: 3, background: "#334155" }} />
              </div>
              <div style={{ textAlign: "center", marginTop: 18 }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>09:14</div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>Bugün</div>
              </div>
              <div style={{ flex: 1, padding: "24px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                {[...notifs].reverse().map((n, idx) => (
                  <div
                    key={n.id}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10, padding: 12,
                      background: "rgba(255,255,255,0.08)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)",
                      opacity: n.entered ? ([1, 0.65, 0.4][idx] ?? 0.3) : 0,
                      transform: n.entered ? "translateY(0) scale(1)" : "translateY(-14px) scale(0.96)",
                      transition: "opacity .5s cubic-bezier(.16,1,.3,1), transform .5s cubic-bezier(.16,1,.3,1)",
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                      {n.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 2 }}>tekertakip</div>
                      <div style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.4 }}>{n.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="nasil-calisir" data-reveal="how" style={{ ...rx(!!revealed.how), background: "#1B2437", padding: "110px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontSize: 42, fontWeight: 800, color: "#fff", textAlign: "center", letterSpacing: "-0.02em", marginBottom: 72 }}>3 Adımda Başlayın</h2>
          <div style={{ display: "flex", gap: 0, position: "relative", flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { icon: "🏢", title: "Firmanızı Kaydedin", desc: "5 dakikada hesap oluşturun", showLine: false },
              { icon: "🚌", title: "Araç ve Şöförlerinizi Ekleyin", desc: "Güzergahları, durakları ve öğrencileri tanımlayın", showLine: true },
              { icon: "📱", title: "Yönetmeye Başlayın", desc: "Şöförler uygulamayı indirir, siz kontrol edersiniz", showLine: true },
            ].map((step) => (
              <div key={step.title} style={{ flex: "1 1 260px", minWidth: 220, textAlign: "center", padding: "0 20px", position: "relative" }}>
                {step.showLine && (
                  <div style={{ position: "absolute", top: 36, left: "-50%", width: "100%", height: 2, background: "#334155" }} />
                )}
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#222D45", border: "2px solid #DC2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 24px", position: "relative", zIndex: 2 }}>
                  {step.icon}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{step.title}</div>
                <div style={{ fontSize: 15, color: "#94A3B8", lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOBILE APP ── */}
      <section data-reveal="mobileapp" style={{ ...rx(!!revealed.mobileapp), padding: "110px 32px", maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", gap: 80, flexWrap: "wrap" }}>
        {/* Phone mockup */}
        <div style={{ flex: "1 1 320px", display: "flex", justifyContent: "center", minWidth: 280 }}>
          <div style={{ width: 260, background: "#1B2437", borderRadius: 36, padding: 14, boxShadow: "0 40px 80px -20px rgba(27,36,55,0.4)" }}>
            <div style={{ background: "#0F1626", borderRadius: 24, overflow: "hidden", height: 480, display: "flex", flexDirection: "column" }}>
              <div style={{ height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 60, height: 5, borderRadius: 3, background: "#334155" }} />
              </div>
              <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600, marginBottom: 4 }}>Bugünkü Sefer</div>
                {MOCK_STUDENTS.map((st) => (
                  <div key={st.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, background: "#1B2437", borderRadius: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: st.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                      {st.initials}
                    </div>
                    <div style={{ fontSize: 12, color: "#E2E8F0", fontWeight: 500, flex: 1 }}>{st.name}</div>
                    <div style={{ fontSize: 14 }}>{st.boarded ? "✓" : "○"}</div>
                  </div>
                ))}
                <div style={{ marginTop: "auto", padding: 14, background: "#DC2626", borderRadius: 10, textAlign: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>
                  Sefer Başlat
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Text */}
        <div style={{ flex: "1 1 420px", minWidth: 300 }}>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: "#1B2437", letterSpacing: "-0.02em", marginBottom: 28 }}>Şöförler İçin Mobil Uygulama</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 36 }}>
            {APP_BULLETS.map((text) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Check size={13} color="#DC2626" strokeWidth={3} />
                </div>
                <span style={{ fontSize: 16, color: "#334155" }}>{text}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#64748B", marginBottom: 14 }}>App Store ve Google Play&apos;de mevcut</div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ padding: "12px 20px", background: "#1B2437", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600 }}>App Store</div>
            <div style={{ padding: "12px 20px", background: "#1B2437", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600 }}>Google Play</div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="fiyatlandirma" data-reveal="pricing" style={{ ...rx(!!revealed.pricing), background: "#F8FAFC", padding: "110px 32px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 42, fontWeight: 800, color: "#1B2437", letterSpacing: "-0.02em", marginBottom: 16 }}>Şeffaf Fiyatlandırma</h2>
          <p style={{ fontSize: 18, color: "#64748B", marginBottom: 56 }}>Gizli maliyet yok. İstediğiniz zaman iptal.</p>
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap", justifyContent: "center", alignItems: "stretch" }}>
            {/* Monthly */}
            <div style={{ flex: "1 1 320px", maxWidth: 380, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 18, padding: 40, textAlign: "left" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#64748B", marginBottom: 16 }}>Aylık Plan</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: "#1B2437", marginBottom: 24 }}>
                ₺6.000<span style={{ fontSize: 16, fontWeight: 500, color: "#64748B" }}> / ay</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
                {PLAN_FEATURES.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: "#334155" }}>
                    <Check size={16} color="#10B981" strokeWidth={2.5} /><span>{f}</span>
                  </div>
                ))}
              </div>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: 15, textAlign: "center", border: "2px solid #1B2437", color: "#1B2437", borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
                Başlayın
              </a>
            </div>
            {/* Annual */}
            <div style={{ flex: "1 1 320px", maxWidth: 380, background: "#1B2437", border: "2px solid #DC2626", borderRadius: 18, padding: 40, textAlign: "left", position: "relative" }}>
              <div style={{ position: "absolute", top: -14, right: 32, background: "#DC2626", color: "#fff", fontSize: 12, fontWeight: 800, padding: "6px 14px", borderRadius: 999, letterSpacing: "0.03em" }}>POPÜLER</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#94A3B8", marginBottom: 16 }}>Yıllık Plan</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: "#fff", marginBottom: 8 }}>
                ₺60.000<span style={{ fontSize: 16, fontWeight: 500, color: "#94A3B8" }}> / yıl</span>
              </div>
              <div style={{ display: "inline-block", background: "#222D45", color: "#4ADE80", fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 999, marginBottom: 24 }}>2 Ay Bedava</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
                {PLAN_FEATURES.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: "#E2E8F0" }}>
                    <Check size={16} color="#4ADE80" strokeWidth={2.5} /><span>{f}</span>
                  </div>
                ))}
              </div>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: 15, textAlign: "center", background: "#DC2626", color: "#fff", borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
                Başlayın
              </a>
            </div>
          </div>
          <div style={{ marginTop: 36, fontSize: 14, color: "#64748B" }}>14 gün ücretsiz deneme – kredi kartı gerekmez</div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section data-reveal="cta" style={{ ...rx(!!revealed.cta), background: "linear-gradient(135deg, #1B2437, #0B111E)", padding: "110px 32px", textAlign: "center" }}>
        <h2 style={{ fontSize: 44, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: 20 }}>Filonuzu Bugün Dijitalleştirin</h2>
        <p style={{ fontSize: 18, color: "#94A3B8", marginBottom: 36 }}>14 gün ücretsiz deneyin. Kurulum desteği bizden.</p>
        <a
          href={WA_LINK} target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-block", padding: "18px 36px", background: "#DC2626", color: "#fff", borderRadius: 10, fontSize: 17, fontWeight: 700, textDecoration: "none", boxShadow: "0 12px 30px rgba(220,38,38,0.35)" }}
        >
          Hemen Başlayın →
        </a>
        <div style={{ marginTop: 28, fontSize: 14, color: "#64748B" }}>tekertakip.com · destek@tekertakip.com</div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#1B2437", padding: "64px 32px 32px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 48, justifyContent: "space-between", paddingBottom: 48, borderBottom: "1px solid #2A3650" }}>
            <div style={{ flex: "1 1 240px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <LogoIcon size={28} className="text-white" />
                <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>teker<span style={{ color: "#DC2626" }}>takip</span></span>
              </div>
              <p style={{ fontSize: 14, color: "#94A3B8", maxWidth: 260, lineHeight: 1.6 }}>Türkiye&apos;nin servis filosu yönetim platformu.</p>
            </div>
            {FOOTER_COLS.map((col) => (
              <div key={col.title} style={{ flex: "1 1 160px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 18 }}>{col.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {col.links.map((link) => (
                    <span key={link} style={{ fontSize: 14, color: "#94A3B8", cursor: "pointer" }}>{link}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ paddingTop: 24, fontSize: 13, color: "#64748B" }}>© 2026 tekertakip. Tüm hakları saklıdır.</div>
        </div>
      </footer>

      {/* ── WhatsApp Float ── */}
      <a
        href={WA_LINK} target="_blank" rel="noopener noreferrer"
        style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50, width: 56, height: 56, background: "#25D366", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(37,211,102,0.4)", textDecoration: "none" }}
        aria-label="WhatsApp ile iletişim"
      >
        <MessageCircle size={28} color="#fff" />
      </a>

      <style>{`
        .feature-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(27,36,55,0.1);
          border-color: transparent !important;
        }
      `}</style>
    </div>
  );
}

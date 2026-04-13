"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, Eye, EyeOff, ArrowRight, Shield } from "lucide-react";
import { LogoIcon } from "@/components/Logo";

export default function KayitPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firmaAdi: "",
    adSoyad: "",
    telefon: "",
    kullaniciAdi: "",
    sifre: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ username: string; companyCode: string } | null>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  // Firma adından otomatik kullanıcı adı öner
  function handleFirmaAdiBlur() {
    if (form.kullaniciAdi) return;
    const slug = form.firmaAdi
      .toLowerCase()
      .replace(/ş/g, "s").replace(/ı/g, "i").replace(/ğ/g, "g")
      .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 12);
    if (slug) set("kullaniciAdi", slug);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firmaAdi.trim() || !form.adSoyad.trim() || !form.kullaniciAdi.trim() || !form.sifre.trim()) {
      setError("Lütfen zorunlu alanları doldurun.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/kayit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Bir hata oluştu"); return; }
      setSuccess({ username: data.username, companyCode: data.companyCode });
    } catch {
      setError("Bağlantı hatası, lütfen tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  // ── Başarı ekranı ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#1B2437] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Hesabınız Oluşturuldu!</h1>
          <p className="text-slate-500 mb-8">30 günlük ücretsiz deneme başladı. Hemen giriş yapıp paneli keşfedebilirsiniz.</p>

          <div className="bg-slate-50 rounded-2xl p-5 mb-6 text-left space-y-3">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">Kullanıcı Adı</div>
              <div className="font-bold text-slate-800 font-mono">{success.username}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">Şöför Uygulama Kodu</div>
              <div className="font-bold text-[#DC2626] font-mono text-lg tracking-widest">{success.companyCode}</div>
              <div className="text-xs text-slate-400 mt-1">Şöförleriniz bu kodla mobil uygulamadan bağlanır</div>
            </div>
          </div>

          <button
            onClick={() => router.push("/login")}
            className="w-full bg-[#DC2626] hover:bg-[#B91C1C] text-white py-3.5 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2"
          >
            Panele Giriş Yap <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Kayıt formu ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#1B2437] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <LogoIcon size={38} className="text-white" />
            <span className="text-white font-black text-2xl">
              teker<span className="text-[#DC2626]">takip</span>
            </span>
          </Link>
          <div className="mt-4">
            <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-500/30 text-green-400 rounded-full px-4 py-1.5 text-sm font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              30 gün ücretsiz — kart bilgisi istemiyoruz
            </div>
          </div>
        </div>

        {/* Form kartı */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h1 className="text-2xl font-black text-slate-800 mb-1">Hemen Başlayın</h1>
          <p className="text-slate-500 text-sm mb-7">Dakikalar içinde filo yönetiminiz hazır.</p>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Firma Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Örn: Yıldız Servis Ltd."
                value={form.firmaAdi}
                onChange={(e) => set("firmaAdi", e.target.value)}
                onBlur={handleFirmaAdiBlur}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Ad Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ali Yılmaz"
                  value={form.adSoyad}
                  onChange={(e) => set("adSoyad", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Telefon
                </label>
                <input
                  type="tel"
                  placeholder="0532 000 00 00"
                  value={form.telefon}
                  onChange={(e) => set("telefon", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] transition-all"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-400 mb-3 font-medium">Giriş Bilgileri</p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Kullanıcı Adı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="yildizservis"
                    value={form.kullaniciAdi}
                    onChange={(e) => set("kullaniciAdi", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#DC2626] transition-all"
                    required
                    autoComplete="username"
                  />
                  <p className="text-xs text-slate-400 mt-1">Sadece harf, rakam ve _ kullanın</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Şifre <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="En az 6 karakter"
                      value={form.sifre}
                      onChange={(e) => set("sifre", e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] transition-all"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 text-white py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Hesap oluşturuluyor...
                </span>
              ) : (
                <>Ücretsiz Deneyi Başlat <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-5 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Kredi kartı yok
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              30 gün ücretsiz
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              İstediğin an iptal
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="text-white font-semibold hover:text-[#DC2626] transition-colors">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  );
}

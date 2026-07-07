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
  const [success, setSuccess] = useState<{ username: string; phoneProvided: boolean } | null>(null);

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
      setSuccess({ username: data.username, phoneProvided: data.phoneProvided ?? false });
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
          <h1 className="text-2xl font-black text-slate-800 mb-2">Hesabınız Hazır!</h1>
          <p className="text-slate-500 mb-6">
            30 günlük ücretsiz denemeniz başladı.
          </p>

          {success.phoneProvided && (
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3.5 mb-6 text-left">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
              <div>
                <p className="text-green-800 text-sm font-semibold">WhatsApp mesajı gönderildi</p>
                <p className="text-green-700 text-xs mt-0.5">Kullanıcı adınız, şifreniz ve hızlı başlangıç rehberi telefonunuza iletildi.</p>
              </div>
            </div>
          )}

          <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-left">
            <div className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">Kullanıcı Adı</div>
            <div className="font-bold text-slate-800 font-mono text-lg">{success.username}</div>
          </div>

          <button
            onClick={() => router.push("/login")}
            className="w-full bg-[#DC2626] hover:bg-[#B91C1C] text-white py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2"
          >
            Panele Giriş Yap <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-slate-400 text-xs mt-4">Şöfor uygulaması kurulumu için destek ekibimiz size yardımcı olacak.</p>
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

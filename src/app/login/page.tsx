"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import Link from "next/link";
import s from "./login.module.css";
import { LogoIcon } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Kullanıcı adı veya şifre yanlış.");
      } else {
        router.push("/panel");
        router.refresh();
      }
    } catch {
      setError("Bir hata oluştu. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={s.page}>
      {/* Arka plan deseni */}
      <div className={s.backdrop}>
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 25%, #DC2626 0%, transparent 50%), radial-gradient(circle at 75% 75%, #DC2626 0%, transparent 50%)",
          }}
        />
      </div>

      <div className={s.layout}>
        {/* Logo */}
        <div className={s.intro}>
          <div className="inline-flex items-center justify-center mb-6">
            <LogoIcon size={80} className="text-[#1B2437]" />
          </div>
          <h1 className="text-slate-900 font-black text-3xl tracking-wide">
            teker<span className="text-[#DC2626]">takip</span>
          </h1>
          <p className={s.eyebrow}>FİLO YÖNETİM PLATFORMU</p><h2 className={s.headline}>Yolun tamamı,<br/><span>tek ekranda.</span></h2><p className={s.description}>Güzergâhlarınızı, şoförlerinizi ve seferlerinizi yönetmek için çalışma alanınıza giriş yapın.</p><Link href="/" className={s.homeLink}>← Ana sayfaya dön</Link>
        </div>

        {/* Form Card */}
        <div className={s.card}>
          <span className={s.eyebrow}>TEKRAR HOŞ GELDİNİZ</span><h1 className={s.formTitle}>Giriş yap</h1><p className={s.formIntro}>TekerTakip hesabınızla devam edin.</p>

          {error && (
            <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username">Kullanıcı Adı</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="kullanici_adi"
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="password">Şifre</label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-all mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>

        {/* Geri dön */}
        <div className={s.footer}>
          <a href="/" className="text-slate-600 hover:text-slate-900 text-sm transition-colors">
            ← Ana siteye dön
          </a>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Key } from "lucide-react";
import toast from "react-hot-toast";

export default function PasswordForm() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (form.next !== form.confirm) { toast.error("Yeni şifreler eşleşmiyor"); return; }
    if (form.next.length < 6) { toast.error("Şifre en az 6 karakter olmalı"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/panel/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Hata oluştu"); return; }
      toast.success("Şifre güncellendi");
      setForm({ current: "", next: "", confirm: "" });
    } catch {
      toast.error("Bağlantı kurulamadı. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Key className="w-5 h-5 text-amber-500" />
        Şifremi Değiştir
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Mevcut Şifre</label>
          <input
            type="password"
            required
            value={form.current}
            onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Yeni Şifre</label>
          <input
            type="password"
            required
            value={form.next}
            onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Yeni Şifre (Tekrar)</label>
          <input
            type="password"
            required
            value={form.confirm}
            onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#1B2437] hover:bg-slate-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {saving ? "Kaydediliyor..." : "Şifreyi Güncelle"}
        </button>
        <p className="text-xs text-slate-400">Süper admin hesapları için .env dosyası kullanılır.</p>
      </form>
    </div>
  );
}

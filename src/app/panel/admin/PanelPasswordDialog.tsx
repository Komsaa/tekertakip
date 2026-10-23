"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, KeyRound, X } from "lucide-react";

export default function PanelPasswordDialog({ user, onClose }: {
  user: { id: string; username: string; name: string };
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { dialog.current?.showModal(); }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving || saved) return;
    if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
      setError("En az 8 karakter kullanın; şifre UTF-8 olarak 72 baytı aşmamalı.");
      return;
    }
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/admin/panel-users", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, password }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error || "Şifre kaydedilemedi. Tekrar deneyin.");
        return;
      }
      setSaved(true);
    } catch { setError("Bağlantı kurulamadı. Sonuç doğrulanamadı; aynı şifreyle tekrar deneyebilirsiniz."); }
    finally { setSaving(false); }
  }

  return <dialog ref={dialog} aria-labelledby="panel-password-title" aria-describedby="panel-password-description"
    onCancel={event => { event.preventDefault(); if (!saving) onClose(); }}
    className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-2xl border-0 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-950/50">
    <div className="flex items-center justify-between gap-4">
      <h2 id="panel-password-title" className="flex items-center gap-2 text-xl font-bold"><KeyRound size={22} /> Şifre belirle</h2>
      <button type="button" aria-label="Kapat" disabled={saving} onClick={onClose} className="rounded-lg p-2 disabled:opacity-40"><X size={20} /></button>
    </div>
    <p className="mt-4 font-semibold">{user.name} <span className="font-mono text-sm text-slate-500">({user.username})</span></p>
    <p id="panel-password-description" className="mt-2 text-sm text-slate-600">Eski şifre görüntülenemez. Kaydettiğinizde bu hesabın giriş şifresi değişir. Burada belirlediğiniz yeni şifre yalnızca bu pencere açıkken görüntülenebilir.</p>
    <form onSubmit={save} className="mt-5 space-y-4">
      <label htmlFor="panel-new-password" className="block text-sm font-medium">Yeni şifre</label>
      <div className="flex rounded-xl border border-slate-300 focus-within:ring-2 focus-within:ring-red-600">
        <input id="panel-new-password" autoFocus required minLength={8} autoComplete="new-password" spellCheck={false} autoCapitalize="none"
          readOnly={saved} disabled={saving} type={visible ? "text" : "password"} value={password}
          onChange={event => setPassword(event.target.value)} className="w-full min-w-0 rounded-xl px-3 py-3 outline-none" />
        <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"} aria-pressed={visible} className="shrink-0 px-3">{visible ? <EyeOff size={20} /> : <Eye size={20} />}</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {saved ? <><p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">Yeni şifre kaydedildi. Pencere kapandığında şifre bu ekrandan kaldırılır.</p><button type="button" onClick={onClose} className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-white">Tamam</button></>
        : <button type="submit" disabled={saving || password.length < 8} className="w-full rounded-xl bg-red-600 py-3 font-semibold text-white disabled:opacity-40">{saving ? "Kaydediliyor…" : "Yeni şifreyi kaydet"}</button>}
    </form>
  </dialog>;
}

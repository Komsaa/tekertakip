"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, MessageCircle, Key, Users } from "lucide-react";
import toast from "react-hot-toast";

interface Stop {
  id: string;
  name: string;
  order: number;
  estimatedTime: string;
}

interface Passenger {
  id: string;
  name: string;
  parentName: string | null;
  parentPhone: string | null;
  stopId: string;
  veliUsername: string | null;
  active: boolean;
  stop: Stop;
}

interface Route {
  id: string;
  name: string;
  stops: (Stop & { passengers: Omit<Passenger, "stop">[] })[];
}

interface CredModal {
  name: string;
  veliUsername: string;
  veliPassword: string;
  parentPhone?: string | null;
}

export default function OgrencilerClient({ route }: { route: Route }) {
  const router = useRouter();

  // Tüm yolcuları düz listeye çevir
  const flatPassengers = (): Passenger[] =>
    route.stops.flatMap((s) =>
      s.passengers.map((p) => ({ ...p, stop: { id: s.id, name: s.name, order: s.order, estimatedTime: s.estimatedTime } }))
    );

  const [passengers, setPassengers] = useState<Passenger[]>(flatPassengers);
  const [credModal, setCredModal] = useState<CredModal | null>(null);
  const [credLoading, setCredLoading] = useState<string | null>(null);

  // Yeni öğrenci formu
  const [newName, setNewName] = useState("");
  const [newParentName, setNewParentName] = useState("");
  const [newParentPhone, setNewParentPhone] = useState("");
  const [newStopId, setNewStopId] = useState(route.stops[0]?.id ?? "");
  const [adding, setAdding] = useState(false);

  async function reload() {
    const res = await fetch(`/api/routes/passengers?routeId=${route.id}`);
    if (res.ok) {
      const data = await res.json();
      setPassengers(data);
    }
  }

  async function addPassenger() {
    if (!newName.trim() || !newStopId) return;
    setAdding(true);
    try {
      const res = await fetch("/api/routes/passengers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stopId: newStopId,
          name: newName.trim(),
          parentName: newParentName.trim() || null,
          parentPhone: newParentPhone.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Hata"); return; }
      setNewName(""); setNewParentName(""); setNewParentPhone("");
      await reload();
      if (data.veliUsername && data.veliPassword) {
        setCredModal({ name: newName.trim(), veliUsername: data.veliUsername, veliPassword: data.veliPassword, parentPhone: newParentPhone.trim() || null });
      }
      toast.success("Eklendi");
    } finally {
      setAdding(false);
    }
  }

  async function changeStop(passengerId: string, stopId: string) {
    await fetch("/api/routes/passengers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: passengerId, stopId }),
    });
    await reload();
  }

  async function removePassenger(id: string, name: string) {
    if (!confirm(`${name} silinsin mi?`)) return;
    await fetch("/api/routes/passengers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setPassengers((prev) => prev.filter((p) => p.id !== id));
    toast.success("Silindi");
  }

  async function generateCredentials(passengerId: string, passengerName: string, parentPhone?: string | null) {
    if (!confirm(`${passengerName} için yeni giriş bilgisi oluşturulsun mu? Eski bilgiler geçersiz olur.`)) return;
    setCredLoading(passengerId);
    try {
      const res = await fetch("/api/routes/passengers/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passengerId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Hata"); return; }
      setCredModal({ name: passengerName, veliUsername: data.veliUsername, veliPassword: data.veliPassword, parentPhone });
      await reload();
    } finally {
      setCredLoading(null);
    }
  }

  function openWhatsApp(phone: string, passengerName: string, veliUsername: string, veliPassword: string) {
    const formatted = phone.replace(/\D/g, "").replace(/^0/, "90");
    const text =
      `Merhaba, ${passengerName} öğrencisi için TékerTakip servis takip uygulaması hesabınız oluşturuldu.\n\n` +
      `Kullanıcı Adı: ${veliUsername}\n` +
      `Şifre: ${veliPassword}\n\n` +
      `iOS: https://apps.apple.com/tr/app/id6770069894\n\n` +
      `Uygulamayı indirip bu bilgilerle giriş yapabilirsiniz.`;
    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(text)}`, "_blank");
  }

  // Duraklara göre grupla
  const byStop = route.stops.map((s) => ({
    stop: s,
    passengers: passengers.filter((p) => p.stopId === s.id),
  }));

  const total = passengers.length;
  const withAccount = passengers.filter((p) => p.veliUsername).length;

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Başlık */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/panel/guzergahlar")}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-800">{route.name}</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {total} öğrenci &middot; {withAccount} veli hesabı aktif
          </p>
        </div>
      </div>

      {/* Yeni öğrenci ekleme */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#DC2626]" />
          Yeni Öğrenci Ekle
        </h2>
        <div className="flex gap-2 flex-wrap">
          <input
            placeholder="Öğrenci adı soyadı *"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPassenger()}
            className="flex-1 min-w-40 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
          />
          <input
            placeholder="Veli adı soyadı"
            value={newParentName}
            onChange={(e) => setNewParentName(e.target.value)}
            className="flex-1 min-w-36 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
          />
          <input
            placeholder="Veli telefonu (WhatsApp)"
            value={newParentPhone}
            onChange={(e) => setNewParentPhone(e.target.value)}
            className="w-48 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
          />
          <select
            value={newStopId}
            onChange={(e) => setNewStopId(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] bg-white"
          >
            {route.stops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.estimatedTime})
              </option>
            ))}
          </select>
          <button
            onClick={addPassenger}
            disabled={adding || !newName.trim()}
            className="bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl px-5 py-2 text-sm font-semibold disabled:opacity-40 transition-colors"
          >
            {adding ? "Ekleniyor..." : "Ekle"}
          </button>
        </div>
      </div>

      {/* Öğrenci listesi — duraklara göre gruplu */}
      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Henüz öğrenci eklenmedi</p>
          <p className="text-slate-400 text-sm mt-1">Yukarıdan ilk öğrenciyi ekle</p>
        </div>
      ) : (
        <div className="space-y-4">
          {byStop.map(({ stop, passengers: stopPassengers }) => {
            if (stopPassengers.length === 0) return null;
            return (
              <div key={stop.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#DC2626] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {stop.order + 1}
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 text-sm">{stop.name}</span>
                    <span className="ml-2 text-xs text-slate-400 font-mono">{stop.estimatedTime}</span>
                  </div>
                  <span className="ml-auto text-xs text-slate-400">{stopPassengers.length} öğrenci</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {stopPassengers.map((p) => (
                    <div key={p.id} className="px-5 py-3 flex items-center gap-3 flex-wrap">
                      {/* Öğrenci adı */}
                      <div className="min-w-36 flex-1">
                        <div className="font-semibold text-slate-800 text-sm">{p.name}</div>
                        {p.parentName && <div className="text-xs text-slate-400">{p.parentName}</div>}
                      </div>

                      {/* Telefon */}
                      <div className="text-sm text-slate-500 w-36">
                        {p.parentPhone ?? <span className="text-slate-300 italic">tel yok</span>}
                      </div>

                      {/* Durak dropdown */}
                      <select
                        value={p.stopId}
                        onChange={(e) => changeStop(p.id, e.target.value)}
                        className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC2626] bg-white text-slate-700"
                      >
                        {route.stops.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.estimatedTime})
                          </option>
                        ))}
                      </select>

                      {/* Hesap durumu */}
                      {p.veliUsername ? (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg font-mono">
                          @{p.veliUsername}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300 italic w-24">Hesap yok</span>
                      )}

                      {/* Aksiyonlar */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {p.parentPhone && p.veliUsername && (
                          <button
                            onClick={() => openWhatsApp(p.parentPhone!, p.name, p.veliUsername!, "••••••")}
                            title="WhatsApp'ta gönder (şifre görünmez, yeni oluştur)"
                            className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => generateCredentials(p.id, p.name, p.parentPhone)}
                          disabled={credLoading === p.id}
                          title="Yeni şifre oluştur"
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-40"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removePassenger(p.id, p.name)}
                          className="p-1.5 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Credentials Modal */}
      {credModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">Veli Giriş Bilgisi</h3>
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{credModal.name}</span> için oluşturuldu.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 font-mono text-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-slate-400 block">Kullanıcı Adı</span>
                  <span className="font-bold text-slate-800">{credModal.veliUsername}</span>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(credModal.veliUsername); toast.success("Kopyalandı"); }}
                  className="text-xs px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded-lg"
                >Kopyala</button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-slate-400 block">Şifre</span>
                  <span className="font-bold text-slate-800 tracking-widest">{credModal.veliPassword}</span>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(credModal.veliPassword); toast.success("Kopyalandı"); }}
                  className="text-xs px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded-lg"
                >Kopyala</button>
              </div>
            </div>
            {credModal.parentPhone ? (
              <button
                onClick={() => {
                  const phone = credModal.parentPhone!.replace(/\D/g, "").replace(/^0/, "90");
                  const text =
                    `Merhaba, ${credModal.name} öğrencisi için TékerTakip servis takip uygulaması hesabınız oluşturuldu.\n\n` +
                    `Kullanıcı Adı: ${credModal.veliUsername}\n` +
                    `Şifre: ${credModal.veliPassword}\n\n` +
                    `iOS: https://apps.apple.com/tr/app/id6770069894\n\n` +
                    `Uygulamayı indirip bu bilgilerle giriş yapabilirsiniz.`;
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-2.5 text-sm font-semibold"
              >
                WhatsApp&apos;ta Gönder
              </button>
            ) : (
              <button
                onClick={() => {
                  const text = `TékerTakip Giriş Bilgisi\nKullanıcı: ${credModal.veliUsername}\nŞifre: ${credModal.veliPassword}\niOS: https://apps.apple.com/tr/app/id6770069894`;
                  navigator.clipboard.writeText(text);
                  toast.success("Mesaj kopyalandı");
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-2.5 text-sm font-semibold"
              >
                Mesajı Kopyala
              </button>
            )}
            <button onClick={() => setCredModal(null)} className="w-full text-sm text-slate-500 hover:text-slate-700">
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

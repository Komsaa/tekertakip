"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, MessageCircle, Key, Users, CreditCard, Check, X, CalendarDays, Edit2 } from "lucide-react";
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
  monthlyFee: number | null;
  active: boolean;
  stop: Stop;
}

interface Payment {
  id: string;
  passengerId: string;
  paid: boolean;
  paidAt: string | null;
  amount: number;
  notes: string | null;
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

type Tab = "ogrenciler" | "odemeler" | "yoklamalar";

interface AttendanceRecord { passengerId: string; date: string; status: string; }

const MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

export default function OgrencilerClient({ route }: { route: Route }) {
  const router = useRouter();
  const now = new Date();

  const flatPassengers = (): Passenger[] =>
    route.stops.flatMap((s) =>
      s.passengers.map((p) => ({ ...p, stop: { id: s.id, name: s.name, order: s.order, estimatedTime: s.estimatedTime } }))
    );

  const [tab, setTab] = useState<Tab>("ogrenciler");
  const [passengers, setPassengers] = useState<Passenger[]>(flatPassengers);
  const [credModal, setCredModal] = useState<CredModal | null>(null);
  const [credLoading, setCredLoading] = useState<string | null>(null);

  // Yoklama state
  const [attMonth, setAttMonth] = useState(now.getMonth() + 1);
  const [attYear, setAttYear] = useState(now.getFullYear());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attLoading, setAttLoading] = useState(false);

  // Ödeme state — dönemlik
  const okulYiliStart = (now.getMonth() + 1) >= 9 ? now.getFullYear() : now.getFullYear() - 1;
  const [selectedDonem, setSelectedDonem] = useState((now.getMonth() + 1) >= 9 || (now.getMonth() + 1) <= 1 ? 1 : 2);
  const [selectedOkulYili, setSelectedOkulYili] = useState(`${okulYiliStart}-${okulYiliStart + 1}`);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  // Öğrenci düzenleme
  const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null);
  const [editName, setEditName] = useState("");
  const [editParentName, setEditParentName] = useState("");
  const [editParentPhone, setEditParentPhone] = useState("");
  const [editFee, setEditFee] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Yeni öğrenci formu
  const [newName, setNewName] = useState("");
  const [newParentName, setNewParentName] = useState("");
  const [newParentPhone, setNewParentPhone] = useState("");
  const [newMonthlyFee, setNewMonthlyFee] = useState("");
  const [newStopId, setNewStopId] = useState(route.stops[0]?.id ?? "");
  const [adding, setAdding] = useState(false);

  async function reload() {
    const res = await fetch(`/api/routes/passengers?routeId=${route.id}`);
    if (res.ok) setPassengers(await res.json());
  }

  const loadAttendance = useCallback(async () => {
    setAttLoading(true);
    try {
      const res = await fetch(`/api/routes/${route.id}/attendance?month=${attMonth}&year=${attYear}`);
      if (res.ok) setAttendance(await res.json());
    } finally {
      setAttLoading(false);
    }
  }, [route.id, attMonth, attYear]);

  useEffect(() => {
    if (tab === "yoklamalar") loadAttendance();
  }, [tab, loadAttendance]);

  const loadPayments = useCallback(async () => {
    setPaymentLoading(true);
    try {
      const startYear = parseInt(selectedOkulYili.split("-")[0]);
      const res = await fetch(`/api/routes/payments?routeId=${route.id}&month=${selectedDonem}&year=${startYear}`);
      if (res.ok) setPayments(await res.json());
    } finally {
      setPaymentLoading(false);
    }
  }, [route.id, selectedDonem, selectedOkulYili]);

  useEffect(() => {
    if (tab === "odemeler") loadPayments();
  }, [tab, loadPayments]);

  function openEdit(p: Passenger) {
    setEditingPassenger(p);
    setEditName(p.name);
    setEditParentName(p.parentName ?? "");
    setEditParentPhone(p.parentPhone ?? "");
    setEditFee(p.monthlyFee != null ? String(p.monthlyFee) : "");
  }

  async function saveEdit() {
    if (!editingPassenger) return;
    setEditSaving(true);
    try {
      const res = await fetch("/api/routes/passengers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPassenger.id,
          name: editName.trim(),
          parentName: editParentName.trim() || null,
          parentPhone: editParentPhone.trim() || null,
          monthlyFee: editFee,
        }),
      });
      if (!res.ok) { toast.error("Hata"); return; }
      await reload();
      setEditingPassenger(null);
      toast.success("Güncellendi");
    } finally {
      setEditSaving(false);
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
          monthlyFee: newMonthlyFee ? parseFloat(newMonthlyFee) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Hata"); return; }
      setNewName(""); setNewParentName(""); setNewParentPhone(""); setNewMonthlyFee("");
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

  async function changeFee(passengerId: string, fee: string) {
    await fetch("/api/routes/passengers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: passengerId, monthlyFee: fee }),
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

  async function togglePayment(passenger: Passenger) {
    const existing = payments.find((p) => p.passengerId === passenger.id);
    const amount = passenger.monthlyFee ?? 0;

    if (existing) {
      setToggleLoading(passenger.id);
      try {
        const res = await fetch("/api/routes/payments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: existing.id, paid: !existing.paid }),
        });
        if (res.ok) {
          const updated = await res.json();
          setPayments((prev) => prev.map((p) => p.id === existing.id ? updated : p));
        }
      } finally {
        setToggleLoading(null);
      }
    } else {
      // Yeni kayıt oluştur
      setToggleLoading(passenger.id);
      try {
        const res = await fetch("/api/routes/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passengerId: passenger.id, month: selectedDonem, year: parseInt(selectedOkulYili.split("-")[0]), amount, paid: true }),
        });
        if (res.ok) {
          const created = await res.json();
          setPayments((prev) => [...prev, created]);
        }
      } finally {
        setToggleLoading(null);
      }
    }
  }

  function openWhatsApp(phone: string, passengerName: string, veliUsername: string, veliPassword: string) {
    const formatted = phone.replace(/\D/g, "").replace(/^0/, "90");
    const text =
      `Merhaba, ${passengerName} öğrencisi için TekerTakip servis takip uygulaması hesabınız oluşturuldu.\n\n` +
      `Kullanıcı Adı: ${veliUsername}\n` +
      `Şifre: ${veliPassword}\n\n` +
      `iOS: https://apps.apple.com/tr/app/id6770069894\n\n` +
      `Uygulamayı indirip bu bilgilerle giriş yapabilirsiniz.`;
    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(text)}`, "_blank");
  }

  const byStop = route.stops.map((s) => ({
    stop: s,
    passengers: passengers.filter((p) => p.stopId === s.id),
  }));

  const total = passengers.length;
  const withAccount = passengers.filter((p) => p.veliUsername).length;

  // Ödeme özeti
  const paidCount = payments.filter((p) => p.paid).length;
  const unpaidPassengers = passengers.filter((p) => !payments.find((pay) => pay.passengerId === p.id && pay.paid));
  const totalExpected = passengers.reduce((sum, p) => sum + (p.monthlyFee ?? 0), 0);
  const totalCollected = payments.filter((p) => p.paid).reduce((sum, p) => sum + p.amount, 0);

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

      {/* Sekmeler */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab("ogrenciler")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "ogrenciler" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <Users className="w-4 h-4" />
          Öğrenciler
        </button>
        <button
          onClick={() => setTab("odemeler")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "odemeler" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <CreditCard className="w-4 h-4" />
          Ödemeler
        </button>
        <button
          onClick={() => setTab("yoklamalar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "yoklamalar" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <CalendarDays className="w-4 h-4" />
          Yoklamalar
        </button>
      </div>

      {/* ===== ÖĞRENCILER SEKMESİ ===== */}
      {tab === "ogrenciler" && (
        <>
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
                className="w-44 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              />
              <input
                placeholder="Dönem ücreti (₺)"
                type="number"
                value={newMonthlyFee}
                onChange={(e) => setNewMonthlyFee(e.target.value)}
                className="w-36 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              />
              <select
                value={newStopId}
                onChange={(e) => setNewStopId(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] bg-white"
              >
                {route.stops.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.estimatedTime})</option>
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

          {/* Öğrenci listesi */}
          {total === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Henüz öğrenci eklenmedi</p>
            </div>
          ) : (
            <div className="space-y-4">
              {byStop.map(({ stop, passengers: stopPassengers }) => {
                if (stopPassengers.length === 0) return null;
                return (
                  <div key={stop.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#DC2626] text-white text-xs font-bold flex items-center justify-center">
                        {stop.order + 1}
                      </div>
                      <span className="font-bold text-slate-700 text-sm">{stop.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{stop.estimatedTime}</span>
                      <span className="ml-auto text-xs text-slate-400">{stopPassengers.length} öğrenci</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {stopPassengers.map((p) => (
                        <div key={p.id} className="px-5 py-3 flex items-center gap-3 flex-wrap">
                          <div className="min-w-36 flex-1">
                            <div className="font-semibold text-slate-800 text-sm">{p.name}</div>
                            {p.parentName && <div className="text-xs text-slate-400">{p.parentName}</div>}
                          </div>
                          <div className="text-sm text-slate-500 w-36">
                            {p.parentPhone ?? <span className="text-slate-300 italic">tel yok</span>}
                          </div>
                          {/* Aylık ücret */}
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-400">₺</span>
                            <input
                              type="number"
                              defaultValue={p.monthlyFee ?? ""}
                              placeholder="Ücret"
                              onBlur={(e) => changeFee(p.id, e.target.value)}
                              className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                            />
                          </div>
                          {/* Durak dropdown */}
                          <select
                            value={p.stopId}
                            onChange={(e) => changeStop(p.id, e.target.value)}
                            className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC2626] bg-white text-slate-700"
                          >
                            {route.stops.map((s) => (
                              <option key={s.id} value={s.id}>{s.name} ({s.estimatedTime})</option>
                            ))}
                          </select>
                          {/* Hesap durumu */}
                          {p.veliUsername ? (
                            <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg font-mono">@{p.veliUsername}</span>
                          ) : (
                            <span className="text-xs text-slate-300 italic w-24">Hesap yok</span>
                          )}
                          {/* Aksiyonlar */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => openEdit(p)}
                              className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {p.parentPhone && p.veliUsername && (
                              <button
                                onClick={() => openWhatsApp(p.parentPhone!, p.name, p.veliUsername!, "••••••")}
                                className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                title="WhatsApp'ta gönder"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => generateCredentials(p.id, p.name, p.parentPhone)}
                              disabled={credLoading === p.id}
                              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-40"
                              title="Yeni şifre oluştur"
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
        </>
      )}

      {/* ===== ÖDEMELER SEKMESİ ===== */}
      {tab === "odemeler" && (
        <>
          {/* Ay/yıl seçici */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={selectedDonem}
                onChange={(e) => setSelectedDonem(parseInt(e.target.value))}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] bg-white font-medium"
              >
                <option value={1}>1. Dönem (Eyl – Oca)</option>
                <option value={2}>2. Dönem (Şub – Haz)</option>
              </select>
              <select
                value={selectedOkulYili}
                onChange={(e) => setSelectedOkulYili(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] bg-white font-medium"
              >
                {["2023-2024", "2024-2025", "2025-2026", "2026-2027"].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                onClick={loadPayments}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-600 transition-colors"
              >
                Yenile
              </button>

              {/* Özet */}
              <div className="ml-auto flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="font-black text-green-600">{paidCount}</div>
                  <div className="text-xs text-slate-400">Ödedi</div>
                </div>
                <div className="text-center">
                  <div className="font-black text-red-500">{total - paidCount}</div>
                  <div className="text-xs text-slate-400">Ödemedi</div>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center">
                  <div className="font-black text-slate-700">₺{totalCollected.toLocaleString("tr-TR")}</div>
                  <div className="text-xs text-slate-400">Toplanan</div>
                </div>
                <div className="text-center">
                  <div className="font-black text-slate-400">₺{(totalExpected - totalCollected).toLocaleString("tr-TR")}</div>
                  <div className="text-xs text-slate-400">Bekleyen</div>
                </div>
              </div>
            </div>
          </div>

          {/* Ödeme listesi */}
          {paymentLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Yükleniyor...</div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 grid grid-cols-12 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span className="col-span-4">Öğrenci</span>
                <span className="col-span-3">Veli</span>
                <span className="col-span-2 text-right">Ücret</span>
                <span className="col-span-3 text-right">Durum</span>
              </div>
              <div className="divide-y divide-slate-50">
                {passengers.map((p) => {
                  const payment = payments.find((pay) => pay.passengerId === p.id);
                  const isPaid = payment?.paid ?? false;
                  const isLoading = toggleLoading === p.id;
                  return (
                    <div key={p.id} className={`px-5 py-3 grid grid-cols-12 items-center gap-2 ${isPaid ? "bg-green-50/30" : ""}`}>
                      <div className="col-span-4">
                        <div className="font-semibold text-slate-800 text-sm">{p.name}</div>
                        <div className="text-xs text-slate-400">{p.stop.name}</div>
                      </div>
                      <div className="col-span-3 text-sm text-slate-500 truncate">
                        {p.parentName ?? <span className="italic text-slate-300">—</span>}
                      </div>
                      <div className="col-span-2 text-right">
                        {p.monthlyFee ? (
                          <span className="text-sm font-semibold text-slate-700">₺{p.monthlyFee.toLocaleString("tr-TR")}</span>
                        ) : (
                          <span className="text-xs text-slate-300 italic">girilmedi</span>
                        )}
                      </div>
                      <div className="col-span-3 flex justify-end">
                        <button
                          onClick={() => togglePayment(p)}
                          disabled={isLoading}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 ${
                            isPaid
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {isLoading ? (
                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          ) : isPaid ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                          {isPaid ? "Ödedi" : "Ödemedi"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ödemeyenler WhatsApp toplu hatırlatma */}
          {unpaidPassengers.filter(p => p.parentPhone).length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {unpaidPassengers.filter(p => p.parentPhone).length} veli henüz ödemedi
                </p>
                <p className="text-xs text-amber-600 mt-0.5">Toplu WhatsApp hatırlatması gönder</p>
              </div>
              <button
                onClick={() => {
                  unpaidPassengers.filter(p => p.parentPhone).forEach((p, i) => {
                    setTimeout(() => {
                      const phone = p.parentPhone!.replace(/\D/g, "").replace(/^0/, "90");
                      const text = `Sayın ${p.parentName ?? "Veli"},\n\n${p.name} için ${selectedDonem}. Dönem ${selectedOkulYili} servis ücreti (₺${p.monthlyFee ?? "?"}) henüz ödenmedi. Bilgilerinize sunarız.`;
                      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
                    }, i * 1500);
                  });
                }}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors flex-shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                Hatırlatma Gönder
              </button>
            </div>
          )}
        </>
      )}

      {/* ===== YOKLAMALAR SEKMESİ ===== */}
      {tab === "yoklamalar" && (
        <>
          {/* Ay/yıl seçici */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3 flex-wrap">
            <select
              value={attMonth}
              onChange={(e) => setAttMonth(parseInt(e.target.value))}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#DC2626] bg-white"
            >
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={attYear}
              onChange={(e) => setAttYear(parseInt(e.target.value))}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#DC2626] bg-white"
            >
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={loadAttendance} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-600">Yenile</button>

            {/* Özet */}
            {!attLoading && attendance.length > 0 && (() => {
              const days = Array.from(new Set(attendance.map(a => a.date))).sort();
              const totalDays = days.length;
              const boardedTotal = attendance.filter(a => a.status === "boarded").length;
              return (
                <div className="ml-auto flex items-center gap-4 text-sm">
                  <div className="text-center"><div className="font-black text-slate-700 text-lg leading-none">{totalDays}</div><div className="text-xs text-slate-400">Sefer günü</div></div>
                  <div className="text-center"><div className="font-black text-green-600 text-lg leading-none">{boardedTotal}</div><div className="text-xs text-slate-400">Bindi</div></div>
                  <div className="text-center"><div className="font-black text-red-500 text-lg leading-none">{attendance.filter(a => a.status === "absent").length}</div><div className="text-xs text-slate-400">Gelmedi</div></div>
                </div>
              );
            })()}
          </div>

          {attLoading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Yükleniyor...</div>
          ) : attendance.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Bu ay için yoklama kaydı yok</p>
              <p className="text-slate-400 text-sm mt-1">Şöför mobil uygulamadan sefer başlatınca kayıtlar buraya gelir</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
              {(() => {
                const days = Array.from(new Set(attendance.map(a => a.date))).sort();
                const attMap: Record<string, Record<string, string>> = {};
                for (const r of attendance) {
                  if (!attMap[r.passengerId]) attMap[r.passengerId] = {};
                  attMap[r.passengerId][r.date] = r.status;
                }
                return (
                  <table className="w-full text-sm min-w-max">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 sticky left-0 bg-slate-50 min-w-40">Öğrenci</th>
                        {days.map(d => (
                          <th key={d} className="px-2 py-3 font-medium text-slate-500 text-xs whitespace-nowrap">
                            {d.slice(8)}/{d.slice(5, 7)}
                          </th>
                        ))}
                        <th className="px-4 py-3 font-semibold text-slate-600 text-right whitespace-nowrap">Toplam</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {passengers.map(p => {
                        const pAtt = attMap[p.id] ?? {};
                        const boardedCount = Object.values(pAtt).filter(s => s === "boarded").length;
                        const absentCount = Object.values(pAtt).filter(s => s === "absent").length;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 sticky left-0 bg-white font-medium text-slate-800">
                              {p.name}
                              <div className="text-xs text-slate-400 font-normal">{p.stop.name}</div>
                            </td>
                            {days.map(d => {
                              const s = pAtt[d];
                              return (
                                <td key={d} className="px-2 py-2.5 text-center">
                                  {s === "boarded" ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold">✓</span>
                                  ) : s === "absent" ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-500 text-xs font-bold">✗</span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-300 text-xs">—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-4 py-2.5 text-right">
                              <span className="font-bold text-green-600">{boardedCount}</span>
                              <span className="text-slate-400 text-xs mx-1">/</span>
                              <span className="text-slate-500 text-xs">{days.length} gün</span>
                              {absentCount > 0 && <span className="ml-1 text-xs text-red-400">({absentCount} gelmedi)</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* Öğrenci Düzenleme Modali */}
      {editingPassenger && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">Öğrenci Düzenle</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Öğrenci Adı Soyadı *</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Veli Adı Soyadı</label>
                <input
                  value={editParentName}
                  onChange={(e) => setEditParentName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Veli Telefonu (WhatsApp)</label>
                <input
                  value={editParentPhone}
                  onChange={(e) => setEditParentPhone(e.target.value)}
                  placeholder="05xx xxx xx xx"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Dönem Ücreti (₺)</label>
                <input
                  type="number"
                  value={editFee}
                  onChange={(e) => setEditFee(e.target.value)}
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={saveEdit}
                disabled={editSaving || !editName.trim()}
                className="flex-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40"
              >
                {editSaving ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button
                onClick={() => setEditingPassenger(null)}
                className="px-4 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl"
              >
                İptal
              </button>
            </div>
          </div>
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
                <button onClick={() => { navigator.clipboard.writeText(credModal.veliUsername); toast.success("Kopyalandı"); }} className="text-xs px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded-lg">Kopyala</button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-slate-400 block">Şifre</span>
                  <span className="font-bold text-slate-800 tracking-widest">{credModal.veliPassword}</span>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(credModal.veliPassword); toast.success("Kopyalandı"); }} className="text-xs px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded-lg">Kopyala</button>
              </div>
            </div>
            {credModal.parentPhone ? (
              <button
                onClick={() => {
                  const phone = credModal.parentPhone!.replace(/\D/g, "").replace(/^0/, "90");
                  const text =
                    `Merhaba, ${credModal.name} öğrencisi için TekerTakip servis takip uygulaması hesabınız oluşturuldu.\n\n` +
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
                  const text = `TekerTakip Giriş Bilgisi\nKullanıcı: ${credModal.veliUsername}\nŞifre: ${credModal.veliPassword}\niOS: https://apps.apple.com/tr/app/id6770069894`;
                  navigator.clipboard.writeText(text);
                  toast.success("Mesaj kopyalandı");
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-2.5 text-sm font-semibold"
              >
                Mesajı Kopyala
              </button>
            )}
            <button onClick={() => setCredModal(null)} className="w-full text-sm text-slate-500 hover:text-slate-700">Kapat</button>
          </div>
        </div>
      )}
    </div>
  );
}

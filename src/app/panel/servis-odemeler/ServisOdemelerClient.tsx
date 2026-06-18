"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Search, Check, X, Plus, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

interface Passenger {
  id: string;
  name: string;
  parentName: string | null;
  parentPhone: string | null;
  monthlyFee: number | null;
  veliUsername: string | null;
  stopId: string;
}

interface Stop {
  id: string;
  name: string;
  order: number;
  estimatedTime: string;
  passengers: Passenger[];
}

interface Route {
  id: string;
  name: string;
  stops: Stop[];
}

interface Payment {
  id: string;
  passengerId: string;
  paid: boolean;
  paidAt: string | null;
  amount: number;
  notes: string | null;
}

interface FlatPassenger extends Passenger {
  routeName: string;
  stopName: string;
}

const MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

export default function ServisOdemelerClient({ routes }: { routes: Route[] }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [search, setSearch] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  // Ödeme ekleme modal
  const [addModal, setAddModal] = useState<FlatPassenger | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [addSaving, setAddSaving] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  // Tüm öğrencileri düz liste
  const allPassengers: FlatPassenger[] = useMemo(() =>
    routes.flatMap((r) =>
      r.stops.flatMap((s) =>
        s.passengers.map((p) => ({
          ...p,
          routeName: r.name,
          stopName: s.name,
        }))
      )
    ),
    [routes]
  );

  // Filtrelenmiş öğrenciler
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allPassengers;
    return allPassengers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.parentName ?? "").toLowerCase().includes(q) ||
        p.routeName.toLowerCase().includes(q)
    );
  }, [allPassengers, search]);

  // Ödemeleri yükle
  async function loadPayments() {
    setLoadingPayments(true);
    try {
      const res = await fetch(`/api/routes/payments/all?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) setPayments(await res.json());
    } finally {
      setLoadingPayments(false);
    }
  }

  useEffect(() => { loadPayments(); }, [selectedMonth, selectedYear]);

  function getPayment(passengerId: string) {
    return payments.find((p) => p.passengerId === passengerId);
  }

  async function togglePayment(passenger: FlatPassenger) {
    const existing = getPayment(passenger.id);

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
      // Modal aç — özel tutar girilebilsin
      setAddAmount(passenger.monthlyFee ? String(passenger.monthlyFee) : "");
      setAddNotes("");
      setAddModal(passenger);
    }
  }

  async function savePayment() {
    if (!addModal || !addAmount) return;
    setAddSaving(true);
    try {
      const res = await fetch("/api/routes/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passengerId: addModal.id,
          month: selectedMonth,
          year: selectedYear,
          amount: parseFloat(addAmount),
          paid: true,
          notes: addNotes || null,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setPayments((prev) => [...prev.filter((p) => p.passengerId !== addModal.id), created]);
        toast.success(`${addModal.name} — ₺${parseFloat(addAmount).toLocaleString("tr-TR")} ödeme eklendi`);
        setAddModal(null);
      }
    } finally {
      setAddSaving(false);
    }
  }

  // Özet
  const paidCount = filtered.filter((p) => getPayment(p.id)?.paid).length;
  const totalExpected = filtered.reduce((s, p) => s + (p.monthlyFee ?? 0), 0);
  const totalCollected = filtered
    .map((p) => getPayment(p.id))
    .filter((pay) => pay?.paid)
    .reduce((s, pay) => s + (pay?.amount ?? 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-5 animate-fade-in">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-black text-slate-800">Servis Ödemeleri</h1>
        <p className="text-slate-500 text-sm mt-1">Tüm güzergahlardaki öğrenci ödemelerini tek ekranda yönet</p>
      </div>

      {/* Filtre bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3 flex-wrap">
        {/* Arama */}
        <div className="flex-1 min-w-56 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Öğrenci veya veli adı ara..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
          />
          {search && (
            <button onClick={() => { setSearch(""); searchRef.current?.focus(); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Ay */}
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="appearance-none border border-slate-200 rounded-xl px-3 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#DC2626] bg-white"
          >
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Yıl */}
        <div className="relative">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="appearance-none border border-slate-200 rounded-xl px-3 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#DC2626] bg-white"
          >
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Özet */}
        <div className="ml-auto flex items-center gap-4 text-sm flex-shrink-0">
          <div className="text-center">
            <div className="font-black text-green-600 text-lg leading-none">{paidCount}</div>
            <div className="text-xs text-slate-400">Ödedi</div>
          </div>
          <div className="text-center">
            <div className="font-black text-red-500 text-lg leading-none">{filtered.length - paidCount}</div>
            <div className="text-xs text-slate-400">Ödemedi</div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center">
            <div className="font-black text-slate-700 text-lg leading-none">₺{totalCollected.toLocaleString("tr-TR")}</div>
            <div className="text-xs text-slate-400">Toplanan</div>
          </div>
          {totalExpected > 0 && (
            <div className="text-center">
              <div className="font-black text-slate-400 text-lg leading-none">₺{(totalExpected - totalCollected).toLocaleString("tr-TR")}</div>
              <div className="text-xs text-slate-400">Bekleyen</div>
            </div>
          )}
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Başlık satırı */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 grid grid-cols-12 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span className="col-span-4">Öğrenci</span>
          <span className="col-span-3">Güzergah / Durak</span>
          <span className="col-span-2">Veli</span>
          <span className="col-span-1 text-right">Ücret</span>
          <span className="col-span-2 text-right">Durum</span>
        </div>

        {loadingPayments ? (
          <div className="py-16 text-center text-slate-400 text-sm">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            {search ? `"${search}" için sonuç bulunamadı` : "Aktif öğrenci yok"}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((p) => {
              const payment = getPayment(p.id);
              const isPaid = payment?.paid ?? false;
              const isLoading = toggleLoading === p.id;

              return (
                <div
                  key={p.id}
                  className={`px-5 py-3 grid grid-cols-12 items-center gap-2 transition-colors ${isPaid ? "bg-green-50/40" : "hover:bg-slate-50"}`}
                >
                  {/* Öğrenci */}
                  <div className="col-span-4">
                    <div className="font-semibold text-slate-800 text-sm">{p.name}</div>
                    {p.parentName && <div className="text-xs text-slate-400">{p.parentName}</div>}
                  </div>

                  {/* Güzergah */}
                  <div className="col-span-3">
                    <div className="text-sm text-slate-600 font-medium truncate">{p.routeName}</div>
                    <div className="text-xs text-slate-400 truncate">{p.stopName}</div>
                  </div>

                  {/* Veli tel */}
                  <div className="col-span-2 text-xs text-slate-500 truncate">
                    {p.parentPhone ?? <span className="text-slate-300">—</span>}
                  </div>

                  {/* Ücret */}
                  <div className="col-span-1 text-right">
                    {p.monthlyFee ? (
                      <span className="text-sm font-semibold text-slate-700">₺{p.monthlyFee.toLocaleString("tr-TR")}</span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </div>

                  {/* Durum butonu */}
                  <div className="col-span-2 flex justify-end items-center gap-2">
                    {isPaid && payment?.amount !== p.monthlyFee && (
                      <span className="text-xs text-amber-600 font-medium">₺{payment?.amount.toLocaleString("tr-TR")}</span>
                    )}
                    <button
                      onClick={() => togglePayment(p)}
                      disabled={!!isLoading}
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
                        <Plus className="w-3 h-3" />
                      )}
                      {isPaid ? "Ödedi" : "Ekle"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ödeme Ekleme Modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Ödeme Ekle</h3>
              <p className="text-sm text-slate-500 mt-1">
                <span className="font-semibold text-slate-700">{addModal.name}</span>
                {" — "}{MONTHS[selectedMonth - 1]} {selectedYear}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tutar (₺) *</label>
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder={addModal.monthlyFee ? `Aylık ücret: ₺${addModal.monthlyFee}` : "Tutar gir"}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && savePayment()}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] font-mono text-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Not (opsiyonel)</label>
                <input
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="Örn: Dönem ödemesi, Eylül–Ocak"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setAddModal(null)}
                className="flex-1 py-2.5 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                İptal
              </button>
              <button
                onClick={savePayment}
                disabled={addSaving || !addAmount}
                className="flex-1 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors"
              >
                {addSaving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

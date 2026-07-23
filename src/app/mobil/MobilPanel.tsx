"use client";

import { useState, useEffect, useMemo } from "react";

const MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

interface Passenger {
  id: string;
  name: string;
  parentName: string | null;
  parentPhone: string | null;
  monthlyFee: number | null;
  veliUsername: string | null;
}
interface Stop { id: string; name: string; passengers: Passenger[] }
interface Route { id: string; name: string; stops: Stop[] }
interface Payment { id: string; passengerId: string; paid: boolean; paidAt: string | null; amount: number; notes: string | null }
interface CredResult { veliUsername: string; veliPassword: string }

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

const AVATAR_COLORS = [
  "#DC2626","#2563eb","#16a34a","#d97706","#7c3aed","#0891b2","#be185d","#0f766e",
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function MobilPanel({ routes, userName }: { routes: Route[]; userName: string }) {
  const now = new Date();
  const [routeId, setRouteId] = useState(routes[0]?.id ?? "");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPay, setLoadingPay] = useState(false);

  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [addSaving, setAddSaving] = useState(false);

  const [credLoading, setCredLoading] = useState<string | null>(null);
  const [credResult, setCredResult] = useState<Record<string, CredResult>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const [toggling, setToggling] = useState<string | null>(null);

  const passengers = useMemo(() => {
    const route = routes.find((r) => r.id === routeId);
    return route ? route.stops.flatMap((s) => s.passengers) : [];
  }, [routes, routeId]);

  useEffect(() => { fetchPayments(); }, [month, year, routeId]);

  async function fetchPayments() {
    setLoadingPay(true);
    try {
      const res = await fetch(`/api/routes/payments/all?month=${month}&year=${year}`);
      if (res.ok) setPayments(await res.json());
    } finally { setLoadingPay(false); }
  }

  function getPayment(id: string) { return payments.find((p) => p.passengerId === id); }

  async function togglePay(passengerId: string) {
    const pay = getPayment(passengerId);
    if (!pay) return;
    setToggling(passengerId);
    try {
      const res = await fetch("/api/routes/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pay.id, paid: !pay.paid }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPayments((prev) => prev.map((p) => p.id === pay.id ? updated : p));
      }
    } finally { setToggling(null); }
  }

  async function savePayment(passenger: Passenger) {
    if (!addAmount) return;
    setAddSaving(true);
    try {
      const res = await fetch("/api/routes/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passengerId: passenger.id, month, year, amount: parseFloat(addAmount), paid: true, notes: null }),
      });
      if (res.ok) {
        const created = await res.json();
        setPayments((prev) => [...prev.filter((p) => p.passengerId !== passenger.id), created]);
        setAddingFor(null);
        setAddAmount("");
      }
    } finally { setAddSaving(false); }
  }

  async function renewCreds(passenger: Passenger) {
    setCredLoading(passenger.id);
    try {
      const res = await fetch("/api/routes/passengers/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passengerId: passenger.id }),
      });
      if (res.ok) {
        const data: CredResult = await res.json();
        setCredResult((prev) => ({ ...prev, [passenger.id]: data }));
      }
    } finally { setCredLoading(null); }
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const paidCount = passengers.filter((p) => getPayment(p.id)?.paid).length;
  const unpaidCount = passengers.length - paidCount;
  const totalCollected = passengers
    .map((p) => getPayment(p.id))
    .filter((pay): pay is Payment => !!pay?.paid)
    .reduce((s, pay) => s + pay.amount, 0);
  const totalExpected = passengers.reduce((s, p) => s + (p.monthlyFee ?? 0), 0);
  const pct = passengers.length > 0 ? Math.round((paidCount / passengers.length) * 100) : 0;

  const selectedRoute = routes.find((r) => r.id === routeId);

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ── Header ── */}
      <div className="bg-[#1B2437] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#DC2626] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">tekertakip</div>
            <div className="text-white font-bold text-sm leading-none mt-0.5">{userName}</div>
          </div>
        </div>
        <a
          href="/login"
          className="text-slate-400 text-xs font-semibold border border-slate-700 rounded-lg px-3 py-1.5 hover:bg-slate-700 transition-colors"
        >
          Çıkış
        </a>
      </div>

      {/* ── Sticky filtre bar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm px-4 py-3 flex gap-2">
        <div className="flex-1 relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h12M3 18h7"/></svg>
          <select
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            className="w-full pl-7 pr-2 py-2 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DC2626] appearance-none"
          >
            {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        <select
          value={month}
          onChange={(e) => setMonth(parseInt(e.target.value))}
          className="py-2 px-2 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DC2626] appearance-none"
        >
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="py-2 px-2 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DC2626] appearance-none"
        >
          {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* ── Özet kartları ── */}
      <div className="px-4 pt-4 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
          <div className="text-2xl font-black text-emerald-600">{paidCount}</div>
          <div className="text-[11px] font-semibold text-slate-400 mt-0.5">Ödedi</div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
          <div className="text-2xl font-black text-red-500">{unpaidCount}</div>
          <div className="text-[11px] font-semibold text-slate-400 mt-0.5">Bekliyor</div>
        </div>
        <div className="bg-[#1B2437] rounded-2xl p-3 shadow-sm text-center">
          <div className="text-lg font-black text-white leading-tight">₺{(totalCollected / 1000).toFixed(1)}K</div>
          <div className="text-[11px] font-semibold text-slate-400 mt-0.5">Toplandı</div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      {passengers.length > 0 && (
        <div className="px-4 pt-3">
          <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-500">{selectedRoute?.name}</span>
              <span className="text-xs font-bold text-slate-700">%{pct} tamamlandı</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#16a34a" : "#DC2626" }}
              />
            </div>
            {totalExpected > 0 && (
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-slate-400">Beklenen: ₺{totalExpected.toLocaleString("tr-TR")}</span>
                <span className="text-[10px] text-slate-400">Kalan: ₺{(totalExpected - totalCollected).toLocaleString("tr-TR")}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Öğrenci listesi ── */}
      <div className="px-4 pt-3 pb-8 flex flex-col gap-3">
        {loadingPay ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-slate-400 text-sm mt-3">Yükleniyor...</div>
          </div>
        ) : passengers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">Bu güzergahta aktif öğrenci yok</div>
        ) : passengers.map((p) => {
          const pay = getPayment(p.id);
          const isPaid = pay?.paid ?? false;
          const cred = credResult[p.id];
          const isAddingThis = addingFor === p.id;
          const isToggling = toggling === p.id;

          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl shadow-sm overflow-hidden border transition-all duration-200 ${
                isPaid ? "border-emerald-200" : "border-slate-100"
              }`}
            >
              {/* Renkli üst şerit */}
              <div className={`h-1 ${isPaid ? "bg-emerald-400" : "bg-red-400"}`} />

              <div className="p-4">
                {/* Öğrenci satırı */}
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                    style={{ backgroundColor: avatarColor(p.name) }}
                  >
                    {initials(p.name)}
                  </div>

                  {/* Bilgiler */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 text-[15px] leading-tight">{p.name}</div>
                    {p.parentName && (
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        {p.parentName}
                      </div>
                    )}
                    {p.parentPhone && (
                      <a href={`tel:${p.parentPhone}`} className="text-xs text-blue-500 mt-0.5 flex items-center gap-1 no-underline w-fit">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.1 6.1l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        {p.parentPhone}
                      </a>
                    )}
                    {p.monthlyFee && (
                      <div className="text-xs text-slate-400 mt-0.5">₺{p.monthlyFee.toLocaleString("tr-TR")}/ay</div>
                    )}
                  </div>

                  {/* Ödeme butonu */}
                  <div className="flex-shrink-0">
                    {isPaid ? (
                      <button
                        onClick={() => togglePay(p.id)}
                        disabled={isToggling}
                        className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl px-3 py-2 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      >
                        {isToggling ? (
                          <div className="w-3 h-3 border border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                        )}
                        Ödedi
                      </button>
                    ) : (
                      <button
                        onClick={() => { setAddingFor(p.id); setAddAmount(p.monthlyFee ? String(p.monthlyFee) : ""); }}
                        className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl px-3 py-2 hover:bg-red-100 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
                        Ödeme Al
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline ödeme formu */}
                {isAddingThis && (
                  <div className="mt-3 bg-slate-50 rounded-xl p-3 flex gap-2 items-center">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₺</span>
                      <input
                        type="number"
                        value={addAmount}
                        onChange={(e) => setAddAmount(e.target.value)}
                        placeholder={p.monthlyFee ? String(p.monthlyFee) : "Tutar"}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") savePayment(p); if (e.key === "Escape") setAddingFor(null); }}
                        className="w-full pl-7 pr-3 py-2 text-base font-bold border-2 border-slate-200 focus:border-[#DC2626] rounded-xl outline-none bg-white"
                      />
                    </div>
                    <button
                      onClick={() => savePayment(p)}
                      disabled={addSaving || !addAmount}
                      className="bg-[#DC2626] text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-40 transition-opacity"
                    >
                      {addSaving ? "..." : "Kaydet"}
                    </button>
                    <button onClick={() => setAddingFor(null)} className="text-slate-400 hover:text-slate-600 p-1">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                )}

                {/* Veli girişi bölümü */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Veli Girişi</span>
                    </div>
                    <button
                      onClick={() => renewCreds(p)}
                      disabled={credLoading === p.id}
                      className="text-[11px] font-semibold text-blue-500 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-50"
                    >
                      {credLoading === p.id ? "..." : p.veliUsername ? "Şifre Yenile" : "Oluştur"}
                    </button>
                  </div>

                  {cred ? (
                    // Yeni şifre göster
                    <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      <div className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                        Şifre yenilendi! Veliye bildirin.
                      </div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">KULLANICI ADI</div>
                          <div className="font-mono font-bold text-slate-800 text-sm">{cred.veliUsername}</div>
                        </div>
                        <button
                          onClick={() => copyText(cred.veliUsername, `u-${p.id}`)}
                          className="text-slate-400 hover:text-slate-700 p-1"
                          title="Kopyala"
                        >
                          {copied === `u-${p.id}` ? (
                            <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                          ) : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                          )}
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2 bg-white rounded-lg px-3 py-2 border border-emerald-200">
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">ŞİFRE</div>
                          <div className="font-mono font-black text-[#DC2626] text-xl tracking-wider">{cred.veliPassword}</div>
                        </div>
                        <button
                          onClick={() => copyText(cred.veliPassword, `p-${p.id}`)}
                          className="text-slate-400 hover:text-slate-700 p-1"
                          title="Kopyala"
                        >
                          {copied === `p-${p.id}` ? (
                            <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                          ) : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                          )}
                        </button>
                      </div>
                      <button
                        onClick={() => setCredResult((prev) => { const n = { ...prev }; delete n[p.id]; return n; })}
                        className="mt-2 text-[11px] text-slate-400 hover:text-slate-600"
                      >
                        Kapat
                      </button>
                    </div>
                  ) : p.veliUsername ? (
                    <div className="mt-2 flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                      <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <span className="font-mono text-sm font-semibold text-slate-700 flex-1">{p.veliUsername}</span>
                      <span className="text-[10px] text-slate-400 font-medium">şifre gizli</span>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-slate-400 italic pl-1">Henüz veli girişi oluşturulmamış</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  ChevronLeft, ChevronRight, Plus, X, Trash2,
  CheckCircle2, Clock, Calendar, Banknote,
  Bell, RotateCcw, AlertCircle,
} from "lucide-react";
import { getDaysInMonth, getDay, startOfMonth } from "date-fns";
import { formatCurrency } from "@/lib/utils";

// ============ SABİTLER ============
const CATEGORIES = {
  banka:      { label: "Banka",       color: "#3B82F6", light: "bg-blue-100 text-blue-700" },
  maas:       { label: "Maaş",        color: "#10B981", light: "bg-emerald-100 text-emerald-700" },
  cek:        { label: "Çek",         color: "#F59E0B", light: "bg-amber-100 text-amber-700" },
  taksit:     { label: "Taksit",      color: "#8B5CF6", light: "bg-violet-100 text-violet-700" },
  hatirlatma: { label: "Hatırlatma",  color: "#64748B", light: "bg-slate-100 text-slate-600" },
  diger:      { label: "Diğer",       color: "#DC2626", light: "bg-red-100 text-red-700" },
} as const;

const DAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTHS_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

// ============ TİP ============
type PaymentEvent = {
  id: string;
  title: string;
  day: number;
  amount: number | null;
  category: string;
  person: string | null;
  notes: string | null;
  status: string;
  recurring: boolean;
  color: string;
  specificMonth: number | null;
  specificYear: number | null;
};

type FormState = {
  title: string; day: string; amount: string; category: string;
  person: string; notes: string; recurring: boolean;
  specificMonth: string; specificYear: string;
};

function cat(c: string) {
  return CATEGORIES[c as keyof typeof CATEGORIES] ?? CATEGORIES.diger;
}

// ============ ANA BİLEŞEN ============
export default function TakvimClient({ initialEvents }: { initialEvents: PaymentEvent[] }) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  const [events, setEvents] = useState<PaymentEvent[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState<FormState>({
    title: "", day: "", amount: "", category: "banka",
    person: "", notes: "", recurring: true,
    specificMonth: String(now.getMonth() + 1), specificYear: String(now.getFullYear()),
  });

  const isCurrentMonth = currentMonth === now.getMonth() && currentYear === now.getFullYear();
  const today = now.getDate();

  // Geçerli ay için etkinlikleri filtrele
  const monthEvents = useMemo(() =>
    events.filter(e =>
      e.recurring ||
      (e.specificMonth === currentMonth + 1 && e.specificYear === currentYear)
    ),
    [events, currentMonth, currentYear]
  );

  const eventsByDay = useMemo(() => {
    const map: Record<number, PaymentEvent[]> = {};
    monthEvents.forEach(e => {
      if (!map[e.day]) map[e.day] = [];
      map[e.day].push(e);
    });
    return map;
  }, [monthEvents]);

  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] ?? []) : [];

  // Takvim grid hesabı (Pazartesi başlangıç)
  const daysInMonth = getDaysInMonth(new Date(currentYear, currentMonth));
  const firstDay = getDay(startOfMonth(new Date(currentYear, currentMonth)));
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  // Özet
  const totalAmount = monthEvents.reduce((s, e) => s + (e.amount ?? 0), 0);
  const pendingCount = monthEvents.filter(e => e.status === "bekliyor").length;
  const doneCount = monthEvents.filter(e => e.status === "tamamlandi").length;
  const overdueEvents = isCurrentMonth
    ? monthEvents.filter(e => e.day < today && e.status === "bekliyor")
    : [];

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDay(null);
  }
  function goToday() {
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    setSelectedDay(now.getDate());
  }

  async function markDone(event: PaymentEvent) {
    const newStatus = event.status === "tamamlandi" ? "bekliyor" : "tamamlandi";
    try {
      const res = await fetch(`/api/takvim/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, status: newStatus } : e));
      toast.success(newStatus === "tamamlandi" ? "✅ Tamamlandı!" : "Bekliyor olarak işaretlendi");
    } catch { toast.error("Hata"); }
  }

  async function deleteEvent(id: string) {
    if (!confirm("Bu etkinlik silinsin mi?")) return;
    try {
      await fetch(`/api/takvim/${id}`, { method: "DELETE" });
      setEvents(prev => prev.filter(e => e.id !== id));
      toast.success("Silindi");
    } catch { toast.error("Silinemedi"); }
  }

  async function saveEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.day) { toast.error("Başlık ve gün zorunlu"); return; }
    setLoading(true);
    try {
      const body = {
        title: form.title.trim(),
        day: parseInt(form.day),
        amount: form.amount ? parseFloat(form.amount) : null,
        category: form.category,
        person: form.person.trim() || null,
        notes: form.notes.trim() || null,
        recurring: form.recurring,
        specificMonth: !form.recurring ? parseInt(form.specificMonth) : null,
        specificYear: !form.recurring ? parseInt(form.specificYear) : null,
        color: cat(form.category).color,
        status: "bekliyor",
      };
      const res = await fetch("/api/takvim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const newEvent = await res.json();
      setEvents(prev => [...prev, newEvent].sort((a, b) => a.day - b.day));
      toast.success("Eklendi!");
      setAddModal(false);
      setForm({ title: "", day: "", amount: "", category: "banka", person: "", notes: "", recurring: true, specificMonth: String(currentMonth + 1), specificYear: String(currentYear) });
    } catch { toast.error("Hata"); } finally { setLoading(false); }
  }

  function sf(key: keyof FormState, val: string | boolean) {
    setForm(f => ({ ...f, [key]: val }));
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Ödeme Takvimi</h1>
          <p className="text-slate-500 text-sm mt-1">Aylık ödeme ve hatırlatma takvimi</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="px-3 py-2 border border-slate-200 text-slate-600 hover:border-slate-300 rounded-xl text-sm font-medium transition-all">
            Bugün
          </button>
          <button onClick={() => setAddModal(true)} className="flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" /> Etkinlik Ekle
          </button>
        </div>
      </div>

      {/* Geciken uyarısı */}
      {overdueEvents.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="font-bold text-red-800">⚠️ Geciken Ödemeler ({overdueEvents.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {overdueEvents.map(e => (
              <div key={e.id} className="bg-white border border-red-200 rounded-xl px-3 py-2 text-sm">
                <span className="font-bold text-red-700">{e.day}. </span>
                <span className="text-slate-700">{e.title}</span>
                {e.amount && <span className="ml-2 font-bold text-red-600">{formatCurrency(e.amount)}</span>}
                <button onClick={() => markDone(e)} className="ml-2 text-xs text-green-600 hover:underline font-medium">Tamamla</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Calendar} label="Toplam Etkinlik" value={String(monthEvents.length)} color="blue" />
        <SummaryCard icon={Clock} label="Bekleyen" value={String(pendingCount)} color="amber" />
        <SummaryCard icon={CheckCircle2} label="Tamamlanan" value={String(doneCount)} color="green" />
        <SummaryCard icon={Banknote} label="Toplam Tutar" value={totalAmount > 0 ? formatCurrency(totalAmount) : "—"} color="red" small />
      </div>

      {/* Takvim + Yan Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Takvim Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          {/* Ay navigasyonu */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-lg font-black text-slate-800">
              {MONTHS_TR[currentMonth]} {currentYear}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Gün başlıkları */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_TR.map(d => (
              <div key={d} className="text-center text-xs font-bold text-slate-400 py-1.5">{d}</div>
            ))}
          </div>

          {/* Günler */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dayEvts = eventsByDay[day] ?? [];
              const isToday = isCurrentMonth && day === today;
              const isSelected = selectedDay === day;
              const isOverdue = isCurrentMonth && day < today && dayEvts.some(e => e.status === "bekliyor");
              const allDone = dayEvts.length > 0 && dayEvts.every(e => e.status === "tamamlandi");

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  className={`
                    relative min-h-[60px] p-1.5 rounded-xl text-left transition-all
                    ${isSelected ? "bg-[#1B2437] ring-2 ring-[#DC2626]"
                      : isToday ? "bg-[#DC2626]"
                      : isOverdue ? "bg-red-50 hover:bg-red-100"
                      : "hover:bg-slate-50"}
                  `}
                >
                  <span className={`text-xs font-bold block text-center mb-1.5
                    ${isSelected || isToday ? "text-white" : "text-slate-700"}`}>
                    {day}
                  </span>
                  {dayEvts.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 justify-center">
                      {dayEvts.slice(0, 3).map(e => (
                        <div
                          key={e.id}
                          className={`w-2 h-2 rounded-full ${e.status === "tamamlandi" ? "opacity-30" : ""}`}
                          style={{ backgroundColor: cat(e.category).color }}
                        />
                      ))}
                      {dayEvts.length > 3 && (
                        <span className={`text-[9px] font-bold leading-none
                          ${isSelected || isToday ? "text-white/70" : "text-slate-400"}`}>
                          +{dayEvts.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  {allDone && (
                    <div className="absolute top-1 right-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Renk Açıklaması */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100">
            {Object.entries(CATEGORIES).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: val.color }} />
                {val.label}
              </div>
            ))}
          </div>
        </div>

        {/* Yan Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700">
              {selectedDay
                ? `${selectedDay} ${MONTHS_TR[currentMonth]}`
                : `${MONTHS_TR[currentMonth]} – Tüm Liste`}
            </h3>
            {selectedDay && (
              <button onClick={() => setSelectedDay(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {selectedDay ? (
            selectedEvents.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <Calendar className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-sm text-slate-400 mb-3">Bu günde etkinlik yok</p>
                <button
                  onClick={() => { sf("day", String(selectedDay)); setAddModal(true); }}
                  className="text-xs text-[#DC2626] hover:underline font-medium"
                >
                  + Etkinlik Ekle
                </button>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto">
                {selectedEvents.map(e => (
                  <EventCard key={e.id} event={e} onToggle={markDone} onDelete={deleteEvent} />
                ))}
              </div>
            )
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1 max-h-[520px] pr-1">
              {monthEvents.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Etkinlik yok</p>
              ) : (
                monthEvents.map(e => (
                  <EventCard key={e.id} event={e} onToggle={markDone} onDelete={deleteEvent} compact />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Etkinlik Ekle Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAddModal(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Yeni Etkinlik</h2>
              <button onClick={() => setAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Başlık *</label>
                <input
                  type="text" required
                  value={form.title}
                  onChange={e => sf("title", e.target.value)}
                  placeholder="Örn: Akbank Son Ödeme"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gün (1–31) *</label>
                  <input
                    type="number" min={1} max={31} required
                    value={form.day}
                    onChange={e => sf("day", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tutar (₺)</label>
                  <input
                    type="number" step="0.01"
                    value={form.amount}
                    onChange={e => sf("amount", e.target.value)}
                    placeholder="Opsiyonel"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Kategori</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(CATEGORIES).map(([k, v]) => (
                    <button key={k} type="button" onClick={() => sf("category", k)}
                      className="py-2 rounded-xl border text-xs font-medium transition-all"
                      style={form.category === k
                        ? { backgroundColor: v.color, color: "#fff", borderColor: v.color }
                        : { borderColor: "#e2e8f0", color: "#475569" }}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kişi</label>
                <input
                  type="text"
                  value={form.person}
                  onChange={e => sf("person", e.target.value)}
                  placeholder="Özgür, Yiğit, Mert..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Not</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => sf("notes", e.target.value)}
                  placeholder="Opsiyonel"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tekrarlama</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => sf("recurring", true)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2
                      ${form.recurring ? "bg-[#1B2437] text-white border-[#1B2437]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    <RotateCcw className="w-3.5 h-3.5" /> Her Ay
                  </button>
                  <button type="button" onClick={() => sf("recurring", false)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2
                      ${!form.recurring ? "bg-[#1B2437] text-white border-[#1B2437]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    <Calendar className="w-3.5 h-3.5" /> Tek Seferlik
                  </button>
                </div>
                {!form.recurring && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Ay</label>
                      <select value={form.specificMonth} onChange={e => sf("specificMonth", e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]">
                        {MONTHS_TR.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Yıl</label>
                      <input type="number" value={form.specificYear} onChange={e => sf("specificYear", e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAddModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">
                  İptal
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
                  {loading ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ YARDIMCI BİLEŞENLER ============

function EventCard({ event, onToggle, onDelete, compact = false }: {
  event: PaymentEvent;
  onToggle: (e: PaymentEvent) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}) {
  const c = cat(event.category);
  const isDone = event.status === "tamamlandi";

  if (compact) {
    return (
      <div className={`flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0 ${isDone ? "opacity-40" : ""}`}>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
        <span className="text-xs text-slate-400 w-5 flex-shrink-0 font-medium">{event.day}.</span>
        <span className={`text-xs flex-1 truncate ${isDone ? "line-through text-slate-400" : "text-slate-700"}`}>
          {event.title}
        </span>
        {event.amount && <span className="text-xs font-semibold text-slate-500 flex-shrink-0">{formatCurrency(event.amount)}</span>}
        <button onClick={() => onToggle(event)} title={isDone ? "Geri al" : "Tamamla"}
          className={`flex-shrink-0 transition-colors ${isDone ? "text-green-500" : "text-slate-300 hover:text-green-500"}`}>
          <CheckCircle2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 transition-all ${isDone ? "opacity-60 bg-slate-50 border-slate-100" : "bg-white border-slate-100 shadow-sm"}`}>
      <div className="flex items-start gap-3">
        <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: c.color }} />
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold ${isDone ? "line-through text-slate-400" : "text-slate-800"}`}>
            {event.title}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.light}`}>{c.label}</span>
            {event.person && <span className="text-xs text-slate-400">{event.person}</span>}
            {event.recurring
              ? <span className="text-xs text-slate-400 flex items-center gap-0.5"><RotateCcw className="w-2.5 h-2.5" /> Her ay</span>
              : <span className="text-xs text-slate-400 flex items-center gap-0.5"><Bell className="w-2.5 h-2.5" /> Tek seferlik</span>
            }
          </div>
          {event.amount && (
            <div className="mt-1.5 text-base font-black text-slate-700">{formatCurrency(event.amount)}</div>
          )}
          {event.notes && <div className="mt-1 text-xs text-slate-400 italic">{event.notes}</div>}
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button onClick={() => onToggle(event)} title={isDone ? "Geri al" : "Tamamla"}
            className={`p-1.5 rounded-lg transition-colors ${isDone ? "text-green-500 bg-green-50" : "text-slate-300 hover:text-green-500 hover:bg-green-50"}`}>
            <CheckCircle2 className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(event.id)}
            className="p-1.5 text-slate-200 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color, small = false }: {
  icon: React.ElementType; label: string; value: string;
  color: "blue" | "amber" | "green" | "red"; small?: boolean;
}) {
  const styles = {
    blue:  { bg: "bg-blue-50",   text: "text-blue-600" },
    amber: { bg: "bg-amber-50",  text: "text-amber-600" },
    green: { bg: "bg-green-50",  text: "text-green-600" },
    red:   { bg: "bg-red-50",    text: "text-red-500" },
  };
  const s = styles[color];
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${s.text}`} />
      </div>
      <div className={`font-black ${s.text} ${small ? "text-lg" : "text-2xl"}`}>{value}</div>
      <div className="text-xs text-slate-500 font-medium mt-1">{label}</div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import CommandCenterMap from "./CommandCenterMap";
import {
  CheckCircle2, XCircle, Clock, CreditCard, FileText,
  AlertTriangle, StickyNote, Banknote, Truck, Users, Route,
  Plus, Fuel, CalendarDays,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Job = {
  id: string; title: string; type: string; clientName: string | null;
  startTime: string; endTime: string | null; status: string;
  driver: { id: string; name: string } | null;
  vehicle: { id: string; plate: string } | null;
};

type Vehicle = {
  id: string; plate: string; brand: string | null; model: string | null;
};

type CreditCardAlert = {
  id: string; name: string; bank: string | null; color: string;
  daysToPayment: number; paymentDue: string; periodTotal: number;
};

type Check = {
  id: string; amount: number; dueDate: string; bankName: string | null;
  direction: string; status: string; contact: { name: string } | null;
};

type PendingInvoice = {
  id: string; invoiceNo: string; dueDate: string;
  payableAmount: number; paidAmount: number;
  client: { name: string };
};

type AlertDoc = {
  id: string; name: string; type: string; docName: string;
  expiryDate: string | null; daysLeft: number | null; href: string; status: string;
};

type Stats = {
  activeDrivers: number;
  activeVehicles: number;
  activeRoutes: number;
  plannedToday: number;
  completedToday: number;
  cancelledToday: number;
  monthJobs: number;
  monthFuel: number;
};

interface Props {
  todayJobs: Job[];
  vehicles: Vehicle[];
  creditCardAlerts: CreditCardAlert[];
  upcomingChecks: Check[];
  pendingInvoices: PendingInvoice[];
  alertDocs: AlertDoc[];
  initialNotes: string;
  today: string;
  stats: Stats;
  weekDriverJobs: { name: string; count: number }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TRY = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 0 }) + " ₺";
const TYPE_LABELS: Record<string, string> = {
  okul: "Okul", personel: "Personel", ozel: "Özel", transfer: "Transfer", gezi: "Gezi",
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CommandCenter({
  todayJobs: initialJobs, vehicles, creditCardAlerts, upcomingChecks, pendingInvoices, alertDocs, initialNotes, today, stats, weekDriverJobs,
}: Props) {
  const [jobs, setJobs] = useState(initialJobs);
  const [notes, setNotes] = useState(initialNotes);
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesTimer, setNotesTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Geldi/Gelmedi toggle
  async function setArrival(jobId: string, arrived: boolean) {
    const status = arrived ? "active" : "cancelled";
    setJobs(j => j.map(x => x.id === jobId ? { ...x, status } : x));
    await fetch(`/api/jobs/${jobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  // Notları kaydet (debounce)
  function handleNotesChange(val: string) {
    setNotes(val);
    if (notesTimer) clearTimeout(notesTimer);
    setNotesSaving(true);
    const t = setTimeout(async () => {
      await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: val }),
      });
      setNotesSaving(false);
    }, 1000);
    setNotesTimer(t);
  }

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col h-full">

      {/* ═══ ANA ALAN: Harita sol + Panel sağ ═══════════════════════════════ */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden" style={{ minHeight: 0 }}>

        {/* ── Sol: Canlı Harita — sadece desktop ─────────────────────────── */}
        <div className="hidden lg:flex flex-1 relative bg-[#1B2437] overflow-hidden">
          <CommandCenterMap />
          {/* Harita üstü overlay */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 shadow">
            🗺 Canlı Araç Takibi · 30sn
          </div>
          <Link href="/panel/konum" className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs font-semibold text-[#DC2626] shadow hover:bg-white">
            Tam Ekran →
          </Link>
        </div>

        {/* ── Sağ: Panel ─────────────────────────────────────────────────── */}
        <div className="w-full lg:w-[360px] flex-shrink-0 bg-[#1B2437] flex flex-col overflow-hidden lg:border-l border-white/10">
          {/* Tarih başlık */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
            <div>
              <p className="text-white font-black text-sm">{today}</p>
              <p className="text-slate-400 text-xs mt-0.5">
                {jobs.length} sefer · {jobs.filter(j => j.status === "active").length} aktif
              </p>
            </div>
            <Link href="/panel/konum" className="lg:hidden flex-shrink-0 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#DC2626]">
              🗺 Harita
            </Link>
          </div>

          {/* Hızlı Erişim */}
          <div className="px-3 py-2 border-b border-white/10 flex gap-2">
            <Link href="/panel/isler" className="flex-1 flex items-center justify-center gap-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl py-2 text-xs font-semibold transition-all">
              <Plus className="w-3.5 h-3.5" /> Sefer
            </Link>
            <Link href="/panel/yakit" className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl py-2 text-xs font-semibold transition-all">
              <Fuel className="w-3.5 h-3.5" /> Yakıt
            </Link>
            <Link href="/panel/faturalar" className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl py-2 text-xs font-semibold transition-all">
              <FileText className="w-3.5 h-3.5" /> Fatura
            </Link>
            <Link href="/panel/takvim" className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl py-2 text-xs font-semibold transition-all">
              <CalendarDays className="w-3.5 h-3.5" /> Takvim
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto space-y-0 divide-y divide-white/10">

            {/* ── Bugünkü Seferler ──────────────────────────────────────── */}
            <section className="p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Bugünkü Seferler
              </p>
              {jobs.length === 0 ? (
                <p className="text-slate-500 text-xs py-2">Bugün sefer yok</p>
              ) : (
                <div className="space-y-1.5">
                  {jobs.map(job => {
                    const startMin = (() => { const [h, m] = job.startTime.split(":").map(Number); return h * 60 + m; })();
                    const isPast = startMin < nowMin;
                    const isActive = job.status === "active" || job.status === "completed";
                    const isCancelled = job.status === "cancelled";
                    return (
                      <div key={job.id} className={`rounded-xl p-2.5 ${isActive ? "bg-green-500/15 border border-green-500/30" : isCancelled ? "bg-red-500/15 border border-red-500/30" : "bg-white/5 border border-white/10"}`}>
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{job.title}</p>
                            <p className="text-slate-400 text-xs mt-0.5">
                              {job.startTime} · {job.driver?.name ?? "Şöför yok"}
                              {job.vehicle && ` · ${job.vehicle.plate}`}
                            </p>
                            {job.clientName && <p className="text-slate-500 text-xs">{job.clientName}</p>}
                          </div>
                          {/* Geldi/Gelmedi butonları */}
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => setArrival(job.id, true)}
                              title="Geldi"
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isActive ? "bg-green-500 text-white" : "bg-white/10 text-slate-400 hover:bg-green-500/30 hover:text-green-400"}`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setArrival(job.id, false)}
                              title="Gelmedi"
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isCancelled ? "bg-red-500 text-white" : "bg-white/10 text-slate-400 hover:bg-red-500/30 hover:text-red-400"}`}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ── Bugün Öde ─────────────────────────────────────────────── */}
            {(creditCardAlerts.length > 0 || upcomingChecks.filter(c => new Date(c.dueDate) <= new Date(todayStr + "T23:59:59")).length > 0) && (
              <section className="p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-purple-400" /> Bugün / Bu Hafta Öde
                </p>
                <div className="space-y-1.5">
                  {creditCardAlerts.map(c => (
                    <Link key={c.id} href="/panel/kredikartlari" className="flex items-center gap-2 bg-purple-500/15 border border-purple-500/30 rounded-xl p-2.5 hover:bg-purple-500/25 transition-colors">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{c.name}</p>
                        <p className="text-purple-300 text-xs">{c.daysToPayment === 0 ? "⚠ BUGÜN!" : `${c.daysToPayment} gün`}</p>
                      </div>
                      <p className="text-white font-bold text-xs flex-shrink-0">{TRY(c.periodTotal)}</p>
                    </Link>
                  ))}
                  {upcomingChecks.filter(c => new Date(c.dueDate) <= new Date(new Date().getTime() + 7 * 86400000)).map(c => (
                    <Link key={c.id} href="/panel/odeme" className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-xl p-2.5 hover:bg-amber-500/25 transition-colors">
                      <Banknote className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{c.contact?.name ?? "Çek"}</p>
                        <p className="text-amber-300 text-xs">{new Date(c.dueDate).toLocaleDateString("tr-TR")} · {c.direction === "aldik" ? "Tahsil" : "Öde"}</p>
                      </div>
                      <p className="text-white font-bold text-xs flex-shrink-0">{TRY(c.amount)}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── Gelecek Paralar ───────────────────────────────────────── */}
            {pendingInvoices.length > 0 && (
              <section className="p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-green-400" /> Gelecek Paralar
                </p>
                <div className="space-y-1.5">
                  {pendingInvoices.slice(0, 6).map(inv => {
                    const due = new Date(inv.dueDate);
                    const daysLeft = Math.ceil((due.getTime() - Date.now()) / 86400000);
                    const overdue = daysLeft < 0;
                    return (
                      <Link key={inv.id} href="/panel/faturalar" className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2.5 hover:bg-white/10 transition-colors">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${overdue ? "bg-red-500" : daysLeft <= 7 ? "bg-amber-400" : "bg-green-400"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{inv.client.name}</p>
                          <p className={`text-xs ${overdue ? "text-red-400" : "text-slate-400"}`}>
                            {overdue ? `${Math.abs(daysLeft)}g gecikti` : daysLeft === 0 ? "Bugün!" : `${daysLeft}g`}
                            {" · "}{due.toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                        <p className={`font-bold text-xs flex-shrink-0 ${overdue ? "text-red-400" : "text-green-400"}`}>
                          {TRY(inv.payableAmount - inv.paidAmount)}
                        </p>
                      </Link>
                    );
                  })}
                  {pendingInvoices.length > 6 && (
                    <Link href="/panel/faturalar" className="text-xs text-slate-500 hover:text-slate-300 text-center block py-1">
                      +{pendingInvoices.length - 6} daha →
                    </Link>
                  )}
                </div>
              </section>
            )}

            {/* ── Bu Hafta Şöför Yükü ──────────────────────────────────── */}
            {weekDriverJobs.length > 0 && (
              <section className="p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-400" /> Bu Hafta Şöförler
                </p>
                <div className="space-y-1.5">
                  {weekDriverJobs.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center text-slate-500 text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{d.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div
                            className="h-1 bg-purple-500 rounded-full"
                            style={{ width: `${Math.min(100, (d.count / (weekDriverJobs[0]?.count || 1)) * 70)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-purple-300 text-xs font-bold flex-shrink-0">{d.count} sefer</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Notlar ───────────────────────────────────────────────── */}
            <section className="p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 justify-between">
                <span className="flex items-center gap-1.5"><StickyNote className="w-3.5 h-3.5 text-yellow-400" /> Notlar</span>
                {notesSaving && <span className="text-slate-500 text-xs">kaydediliyor...</span>}
              </p>
              <textarea
                value={notes}
                onChange={e => handleNotesChange(e.target.value)}
                placeholder="Bugünkü notlar, hatırlatıcılar..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 resize-none focus:outline-none focus:border-white/20"
              />
            </section>

          </div>{/* end scrollable */}
        </div>{/* end right panel */}
      </div>{/* end flex main */}

      {/* ═══ ALT STAT BAR ══════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 bg-[#1B2437] border-t border-white/10 relative z-10">
        <div className="flex items-stretch divide-x divide-white/10 overflow-x-auto">

          {/* Bugün Planlanan */}
          <div className="flex-1 flex flex-col items-center justify-center py-2.5 px-2 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Bugün Planlandı</span>
            </div>
            <span className="text-xl font-black text-white">{stats.plannedToday}</span>
          </div>

          {/* Tamamlanan */}
          <div className="flex-1 flex flex-col items-center justify-center py-2.5 px-2 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Tamamlandı</span>
            </div>
            <span className="text-xl font-black text-green-400">{stats.completedToday}</span>
          </div>

          {/* İptal */}
          <div className="flex-1 flex flex-col items-center justify-center py-2.5 px-2 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <XCircle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">İptal</span>
            </div>
            <span className="text-xl font-black text-red-400">{stats.cancelledToday}</span>
          </div>

          {/* Divider */}
          <div className="w-px bg-white/20 self-stretch" />

          {/* Aktif Araç */}
          <div className="flex-1 flex flex-col items-center justify-center py-2.5 px-2 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Aktif Araç</span>
            </div>
            <span className="text-xl font-black text-white">{stats.activeVehicles}</span>
          </div>

          {/* Aktif Şöför */}
          <div className="flex-1 flex flex-col items-center justify-center py-2.5 px-2 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Aktif Şöför</span>
            </div>
            <span className="text-xl font-black text-white">{stats.activeDrivers}</span>
          </div>

          {/* Aktif Güzergah */}
          <div className="flex-1 flex flex-col items-center justify-center py-2.5 px-2 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Route className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Güzergah</span>
            </div>
            <span className="text-xl font-black text-white">{stats.activeRoutes}</span>
          </div>

          {/* Bu ay sefer */}
          <div className="flex-1 flex flex-col items-center justify-center py-2.5 px-2 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Bu Ay Sefer</span>
            </div>
            <span className="text-xl font-black text-white">{stats.monthJobs}</span>
          </div>

          {/* Bu ay yakıt */}
          <div className="flex-1 flex flex-col items-center justify-center py-2.5 px-2 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Fuel className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Bu Ay Yakıt</span>
            </div>
            <span className="text-xl font-black text-orange-400">
              {stats.monthFuel > 0 ? stats.monthFuel.toLocaleString("tr-TR") + "₺" : "—"}
            </span>
          </div>

        </div>
      </div>

      {/* ═══ ARAÇ DURUM ŞERIDI ══════════════════════════════════════════════ */}
      {vehicles.length > 0 && (
        <div className="flex-shrink-0 bg-[#151e2e] border-t border-white/10 relative z-10">
          <div className="flex gap-2 overflow-x-auto px-3 py-2 scrollbar-hide">
            {vehicles.map(v => {
              const activeJob = jobs.find(j => j.vehicle?.id === v.id && (j.status === "active" || j.status === "planned"));
              const isActive = activeJob?.status === "active";
              const isPlanned = activeJob?.status === "planned";
              return (
                <div
                  key={v.id}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                    isActive
                      ? "bg-green-500/20 border-green-500/40"
                      : isPlanned
                      ? "bg-blue-500/15 border-blue-500/30"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  {/* Pulsing dot */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${isActive ? "bg-green-400" : isPlanned ? "bg-blue-400" : "bg-slate-600"}`} />
                    {(isActive || isPlanned) && (
                      <div className={`absolute inset-0 w-2 h-2 rounded-full animate-ping ${isActive ? "bg-green-400" : "bg-blue-400"} opacity-75`} />
                    )}
                  </div>
                  <div>
                    <div className={`font-bold leading-none ${isActive ? "text-green-300" : isPlanned ? "text-blue-300" : "text-slate-500"}`}>
                      {v.plate}
                    </div>
                    {activeJob ? (
                      <div className="text-slate-400 leading-none mt-0.5 truncate max-w-[120px]">
                        {activeJob.startTime} · {activeJob.driver?.name ?? activeJob.title}
                      </div>
                    ) : (
                      <div className="text-slate-600 leading-none mt-0.5">Boşta</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ ALT: Belge Uyarıları ════════════════════════════════════════════ */}
      {alertDocs.length > 0 && (
        <div className="flex-shrink-0 bg-white border-t border-slate-100 relative z-10">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Belge Uyarıları</span>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{alertDocs.length}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto p-3">
            {alertDocs.map((doc, i) => (
              <Link key={i} href={doc.href} className={`flex-shrink-0 rounded-xl px-3 py-2 text-xs border min-w-[140px] hover:shadow-sm transition-all ${doc.status === "expired" || doc.status === "critical" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                <p className={`font-bold truncate ${doc.status === "expired" ? "text-red-700" : "text-amber-700"}`}>{doc.name}</p>
                <p className="text-slate-500 truncate">{doc.docName}</p>
                <p className={`font-bold mt-0.5 ${doc.status === "expired" ? "text-red-600" : "text-amber-600"}`}>
                  {doc.daysLeft !== null && doc.daysLeft < 0 ? `${Math.abs(doc.daysLeft)}g geçti` : `${doc.daysLeft}g kaldı`}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

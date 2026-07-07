"use client";

import Link from "next/link";
import {
  Bus, MapPin, Users, Truck, Route, AlertTriangle, StickyNote,
  ChevronRight, Wrench,
} from "lucide-react";
import { useState } from "react";
import CommandCenterMap from "./CommandCenterMap";

type RouteInfo = {
  id: string;
  name: string;
  type: string;
  active: boolean;
  driverName: string | null;
  vehiclePlate: string | null;
  stopCount: number;
  passengerCount: number;
};

type AlertDoc = {
  id: string; name: string; type: string; docName: string;
  expiryDate: string | null; daysLeft: number | null; href: string; status: string;
};

type Stats = {
  activeDrivers: number;
  activeVehicles: number;
  activeRoutes: number;
  totalStudents: number;
};

interface Props {
  routes: RouteInfo[];
  alertDocs: AlertDoc[];
  initialNotes: string;
  today: string;
  stats: Stats;
  companyName: string;
}

export default function OkulDashboard({ routes, alertDocs, initialNotes, today, stats, companyName }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesTimer, setNotesTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <div className="flex flex-col flex-1" style={{ minHeight: 0 }}>
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden" style={{ minHeight: 0 }}>

      {/* ── Sol: Canlı Harita ────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 relative bg-[#1B2437] overflow-hidden">
        <CommandCenterMap />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 shadow">
          🗺 Canlı Araç Takibi · 30sn
        </div>
        <Link href="/panel/konum" className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs font-semibold text-[#DC2626] shadow hover:bg-white">
          Tam Ekran →
        </Link>
      </div>

      {/* ── Sağ: Panel ─────────────────────────────────────────────── */}
      <div className="w-full lg:w-[380px] flex-shrink-0 bg-[#1B2437] flex flex-col overflow-hidden lg:border-l border-white/10">

        {/* Başlık */}
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-white font-black text-sm">{today}</p>
          <p className="text-slate-400 text-xs mt-0.5">{companyName}</p>
        </div>

        {/* Hızlı Erişim */}
        <div className="px-3 py-2 border-b border-white/10 grid grid-cols-4 gap-2">
          <Link href="/panel/servis-takip" className="flex flex-col items-center gap-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl py-2.5 text-xs font-semibold transition-all">
            <Bus className="w-4 h-4" />
            <span>Takip</span>
          </Link>
          <Link href="/panel/guzergahlar" className="flex flex-col items-center gap-1 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl py-2.5 text-xs font-semibold transition-all">
            <Route className="w-4 h-4" />
            <span>Güzergah</span>
          </Link>
          <Link href="/panel/konum" className="flex flex-col items-center gap-1 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl py-2.5 text-xs font-semibold transition-all">
            <MapPin className="w-4 h-4" />
            <span>Harita</span>
          </Link>
          <Link href="/panel/arizalar" className="flex flex-col items-center gap-1 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl py-2.5 text-xs font-semibold transition-all">
            <Wrench className="w-4 h-4" />
            <span>Arıza</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-white/10">

          {/* Güzergahlar */}
          <section className="p-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Bus className="w-3.5 h-3.5 text-red-400" /> Güzergahlar
            </p>
            {routes.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-slate-500 text-xs mb-2">Henüz güzergah eklenmemiş</p>
                <Link href="/panel/guzergahlar" className="text-xs text-[#DC2626] font-semibold hover:underline">
                  Güzergah Ekle →
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                {routes.map(r => (
                  <Link
                    key={r.id}
                    href={`/panel/guzergahlar`}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2.5 hover:bg-white/10 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.active ? "bg-green-400" : "bg-slate-600"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{r.name}</p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {r.driverName ?? "Şöför atanmadı"}
                        {r.vehiclePlate && ` · ${r.vehiclePlate}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-slate-300 text-xs font-bold">{r.passengerCount} öğr.</div>
                      <div className="text-slate-500 text-xs">{r.stopCount} durak</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  </Link>
                ))}
                <Link href="/panel/servis-takip" className="flex items-center justify-center gap-1.5 text-xs text-[#DC2626] font-semibold py-1.5 hover:underline">
                  <Bus className="w-3.5 h-3.5" /> Canlı Servis Takibi →
                </Link>
              </div>
            )}
          </section>

          {/* Notlar */}
          <section className="p-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5 text-yellow-400" /> Notlar
              </span>
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

        </div>

        {/* Alt stat bar */}
        <div className="flex-shrink-0 border-t border-white/10">
          <div className="flex items-stretch divide-x divide-white/10">
            <div className="flex-1 flex flex-col items-center justify-center py-2.5 px-2">
              <Route className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">Güzergah</span>
              <span className="text-lg font-black text-white">{stats.activeRoutes}</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-2.5 px-2">
              <Users className="w-3.5 h-3.5 text-green-400 mb-0.5" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">Öğrenci</span>
              <span className="text-lg font-black text-white">{stats.totalStudents}</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-2.5 px-2">
              <Truck className="w-3.5 h-3.5 text-blue-400 mb-0.5" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">Araç</span>
              <span className="text-lg font-black text-white">{stats.activeVehicles}</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-2.5 px-2">
              <Users className="w-3.5 h-3.5 text-purple-400 mb-0.5" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">Şöför</span>
              <span className="text-lg font-black text-white">{stats.activeDrivers}</span>
            </div>
          </div>
        </div>
      </div>

      </div>{/* end flex row */}

      {/* Belge uyarıları */}
      {alertDocs.length > 0 && (
        <div className="flex-shrink-0 bg-white border-t border-slate-100">
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

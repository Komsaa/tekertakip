"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Wrench, AlertTriangle, CheckCircle, Plus, X, Truck,
  Calendar, Gauge, ChevronRight, Clock,
} from "lucide-react";

const BAKIM_TYPES: Record<string, string> = {
  yag_degisimi: "Yağ Değişimi",
  lastik: "Lastik",
  fren: "Fren",
  genel_bakim: "Genel Bakım",
  elektrik: "Elektrik",
  karoseri: "Karoseri",
  diger: "Diğer",
};

const BAKIM_COLORS: Record<string, string> = {
  yag_degisimi: "bg-amber-100 text-amber-700",
  lastik: "bg-blue-100 text-blue-700",
  fren: "bg-red-100 text-red-700",
  genel_bakim: "bg-green-100 text-green-700",
  elektrik: "bg-purple-100 text-purple-700",
  karoseri: "bg-slate-100 text-slate-700",
  diger: "bg-slate-100 text-slate-600",
};

type MaintenanceRecord = {
  id: string; date: string; type: string; description: string;
  cost: number | null; odometer: number | null;
  nextDate: string | null; nextKm: number | null;
  kind: "bakim";
};

type ReportRecord = {
  id: string; date: string; description: string;
  photoUrl: string | null; status: string; driverName: string;
  kind: "ariza";
};

type VehicleData = {
  id: string; plate: string; brand: string | null; model: string | null;
  openReports: number;
  lastMaintenance: { date: string; type: string; description: string } | null;
  nextDate: string | null; nextKm: number | null;
  maintenanceRecords: MaintenanceRecord[];
  vehicleReports: ReportRecord[];
};

const TRY = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 0 }) + " ₺";

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function nextDateStatus(dateStr: string | null) {
  if (!dateStr) return null;
  const days = daysUntil(dateStr);
  if (days < 0) return "gecikti";
  if (days <= 7) return "kritik";
  if (days <= 30) return "uyari";
  return "tamam";
}

export default function BakimClient({ vehicles }: { vehicles: VehicleData[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(vehicles[0]?.id ?? "");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: "yag_degisimi", description: "", date: new Date().toISOString().split("T")[0],
    cost: "", odometer: "", nextDate: "", nextKm: "",
  });

  const selected = vehicles.find((v) => v.id === selectedId);

  // Birleşik timeline
  const timeline: (MaintenanceRecord | ReportRecord)[] = selected
    ? [...selected.maintenanceRecords, ...selected.vehicleReports]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  async function saveBakim() {
    if (!selected || !form.description.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/vehicles/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: selected.id,
          date: form.date,
          type: form.type,
          description: form.description,
          cost: form.cost || null,
          odometer: form.odometer || null,
          nextDate: form.nextDate || null,
          nextKm: form.nextKm || null,
        }),
      });
      if (!res.ok) { toast.error("Hata oluştu"); return; }
      toast.success("Bakım kaydı eklendi");
      setShowModal(false);
      setForm({ type: "yag_degisimi", description: "", date: new Date().toISOString().split("T")[0], cost: "", odometer: "", nextDate: "", nextKm: "" });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function deleteBakim(id: string) {
    if (!confirm("Bu bakım kaydını silmek istiyor musunuz?")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/vehicles/maintenance", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { toast.error("Silinemedi"); return; }
      toast.success("Silindi");
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex h-full">

      {/* Sol: Araç listesi */}
      <div className="w-64 flex-shrink-0 bg-slate-50 border-r border-slate-200 overflow-y-auto">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-black text-slate-800 text-base flex items-center gap-2">
            <Wrench className="w-4 h-4 text-orange-500" /> Bakım Takibi
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">{vehicles.length} araç</p>
        </div>
        <div className="divide-y divide-slate-100">
          {vehicles.map((v) => {
            const status = nextDateStatus(v.nextDate);
            const isSelected = v.id === selectedId;
            return (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                className={`w-full text-left p-4 transition-colors ${isSelected ? "bg-white border-l-4 border-l-orange-500" : "hover:bg-slate-100"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 text-sm font-mono">{v.plate}</p>
                    {(v.brand || v.model) && (
                      <p className="text-xs text-slate-500">{v.brand} {v.model}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {v.openReports > 0 && (
                      <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">
                        {v.openReports} arıza
                      </span>
                    )}
                    {status && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        status === "gecikti" ? "bg-red-100 text-red-600" :
                        status === "kritik" ? "bg-orange-100 text-orange-600" :
                        status === "uyari" ? "bg-amber-100 text-amber-600" :
                        "bg-green-100 text-green-600"
                      }`}>
                        {status === "gecikti" ? "Gecikti" :
                         status === "kritik" ? "Yakın" :
                         status === "uyari" ? "Bu Ay" : "Tamam"}
                      </span>
                    )}
                  </div>
                </div>
                {v.lastMaintenance && (
                  <p className="text-[11px] text-slate-400 mt-1.5 truncate">
                    Son: {BAKIM_TYPES[v.lastMaintenance.type] ?? v.lastMaintenance.type}
                  </p>
                )}
                {!v.lastMaintenance && !v.openReports && (
                  <p className="text-[11px] text-slate-400 mt-1.5">Kayıt yok</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sağ: Detay */}
      <div className="flex-1 overflow-y-auto bg-white">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            Araç seçin
          </div>
        ) : (
          <div className="p-6 space-y-6">

            {/* Başlık */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black text-slate-800 font-mono">{selected.plate}</h1>
                {(selected.brand || selected.model) && (
                  <p className="text-slate-500 text-sm">{selected.brand} {selected.model}</p>
                )}
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" /> Yeni Bakım Ekle
              </button>
            </div>

            {/* Sonraki Bakım Uyarısı */}
            {selected.nextDate && (() => {
              const days = daysUntil(selected.nextDate);
              const status = nextDateStatus(selected.nextDate);
              return (
                <div className={`rounded-2xl p-4 border flex items-center gap-3 ${
                  status === "gecikti" ? "bg-red-50 border-red-200" :
                  status === "kritik" ? "bg-orange-50 border-orange-200" :
                  "bg-amber-50 border-amber-200"
                }`}>
                  <Calendar className={`w-5 h-5 flex-shrink-0 ${
                    status === "gecikti" ? "text-red-500" :
                    status === "kritik" ? "text-orange-500" : "text-amber-500"
                  }`} />
                  <div>
                    <p className={`font-bold text-sm ${
                      status === "gecikti" ? "text-red-700" :
                      status === "kritik" ? "text-orange-700" : "text-amber-700"
                    }`}>
                      {status === "gecikti"
                        ? `Bakım ${Math.abs(days)} gün gecikti!`
                        : days === 0 ? "Bakım bugün!"
                        : `${days} gün sonra bakım`}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(selected.nextDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                      {selected.nextKm && ` · ${selected.nextKm.toLocaleString("tr-TR")} km`}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Özet kartlar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium">Toplam Bakım</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{selected.maintenanceRecords.length}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium">Arıza Bildirimi</p>
                <p className={`text-2xl font-black mt-0.5 ${selected.vehicleReports.length > 0 ? "text-orange-500" : "text-slate-800"}`}>
                  {selected.vehicleReports.length}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium">Toplam Bakım Maliyeti</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">
                  {TRY(selected.maintenanceRecords.reduce((s, m) => s + (m.cost ?? 0), 0))}
                </p>
              </div>
            </div>

            {/* Birleşik Timeline */}
            <div>
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">Geçmiş</h3>
              {timeline.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center">
                  <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Kayıt yok</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Dikey çizgi */}
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
                  <div className="space-y-3">
                    {timeline.map((item) => {
                      if (item.kind === "bakim") {
                        return (
                          <div key={item.id} className="flex gap-4 relative">
                            <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                              <Wrench className="w-4 h-4 text-orange-500" />
                            </div>
                            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${BAKIM_COLORS[item.type] ?? "bg-slate-100 text-slate-600"}`}>
                                      {BAKIM_TYPES[item.type] ?? item.type}
                                    </span>
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {new Date(item.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-700 mt-1.5">{item.description}</p>
                                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                    {item.cost && (
                                      <span className="text-xs text-green-600 font-semibold">{TRY(item.cost)}</span>
                                    )}
                                    {item.odometer && (
                                      <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <Gauge className="w-3 h-3" /> {item.odometer.toLocaleString("tr-TR")} km
                                      </span>
                                    )}
                                    {item.nextDate && (
                                      <span className="text-xs text-blue-600 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Sonraki: {new Date(item.nextDate).toLocaleDateString("tr-TR")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => deleteBakim(item.id)}
                                  disabled={deletingId === item.id}
                                  className="p-1 text-slate-300 hover:text-red-400 rounded-lg transition-colors flex-shrink-0"
                                  title="Sil"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div key={item.id} className="flex gap-4 relative">
                            <div className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center flex-shrink-0 z-10 shadow-sm ${item.status === "open" ? "bg-red-100" : "bg-slate-100"}`}>
                              {item.status === "open"
                                ? <AlertTriangle className="w-4 h-4 text-red-500" />
                                : <CheckCircle className="w-4 h-4 text-green-500" />}
                            </div>
                            <div className={`flex-1 border rounded-xl p-3 shadow-sm ${item.status === "open" ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${item.status === "open" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"}`}>
                                  {item.status === "open" ? "Açık Arıza" : "Çözülmüş Arıza"}
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(item.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                                </span>
                                <span className="text-xs text-slate-500">{item.driverName}</span>
                              </div>
                              <p className="text-sm text-slate-700 mt-1.5">{item.description}</p>
                              {item.photoUrl && (
                                <a href={item.photoUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block">
                                  <img src={item.photoUrl} alt="Arıza" className="h-16 rounded-lg object-cover border border-slate-200" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Yeni Bakım Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-800">Bakım Kaydı Ekle</h2>
                <p className="text-xs text-slate-500 mt-0.5">{selected?.plate}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-slate-500">Bakım Türü</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                >
                  {Object.entries(BAKIM_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Açıklama <span className="text-red-400">*</span></label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Yapılan işlem detayı..."
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Tarih</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Maliyet (₺)</label>
                  <input
                    type="number"
                    value={form.cost}
                    onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                    placeholder="0"
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Kilometre (bakım anı)</label>
                <input
                  type="number"
                  value={form.odometer}
                  onChange={(e) => setForm((f) => ({ ...f, odometer: e.target.value }))}
                  placeholder="ör. 125000"
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Sonraki Bakım (opsiyonel)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Tarih</label>
                    <input
                      type="date"
                      value={form.nextDate}
                      onChange={(e) => setForm((f) => ({ ...f, nextDate: e.target.value }))}
                      className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">km</label>
                    <input
                      type="number"
                      value={form.nextKm}
                      onChange={(e) => setForm((f) => ({ ...f, nextKm: e.target.value }))}
                      placeholder="ör. 135000"
                      className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">
                İptal
              </button>
              <button
                onClick={saveBakim}
                disabled={saving || !form.description.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Wrench className="w-4 h-4" />
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

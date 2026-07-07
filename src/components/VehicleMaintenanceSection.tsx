"use client";

import { useState } from "react";
import { Wrench, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

type MaintenanceRecord = {
  id: string;
  date: string;
  type: string;
  description: string;
  cost: number | null;
  odometer: number | null;
  nextDate: string | null;
  nextKm: number | null;
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  yag_degisimi:  { label: "Yağ Değişimi",   color: "bg-amber-100 text-amber-700" },
  lastik:        { label: "Lastik",          color: "bg-blue-100 text-blue-700" },
  fren:          { label: "Fren",            color: "bg-red-100 text-red-700" },
  genel_bakim:   { label: "Genel Bakım",     color: "bg-green-100 text-green-700" },
  elektrik:      { label: "Elektrik",        color: "bg-purple-100 text-purple-700" },
  karoseri:      { label: "Karoseri",        color: "bg-slate-100 text-slate-700" },
  diger:         { label: "Diğer",           color: "bg-gray-100 text-gray-700" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

function formatCurrency(n: number) {
  return n.toLocaleString("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 });
}

interface Props {
  vehicleId: string;
  initialRecords: MaintenanceRecord[];
}

export default function VehicleMaintenanceSection({ vehicleId, initialRecords }: Props) {
  const [records, setRecords] = useState<MaintenanceRecord[]>(initialRecords);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: "genel_bakim",
    description: "",
    cost: "",
    odometer: "",
    nextDate: "",
    nextKm: "",
  });

  function setField(k: string, v: string) {
    setForm(p => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) return;
    setSaving(true);
    const res = await fetch("/api/vehicles/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId, ...form }),
    });
    if (res.ok) {
      const created = await res.json();
      setRecords(prev => [created, ...prev]);
      setShowForm(false);
      setForm({ date: new Date().toISOString().slice(0, 10), type: "genel_bakim", description: "", cost: "", odometer: "", nextDate: "", nextKm: "" });
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu bakım kaydını silmek istiyor musunuz?")) return;
    const res = await fetch("/api/vehicles/maintenance", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setRecords(prev => prev.filter(r => r.id !== id));
  }

  const totalCost = records.reduce((s, r) => s + (r.cost ?? 0), 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-[#DC2626]" />
          Bakım Geçmişi
          {records.length > 0 && (
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-normal">
              {records.length} kayıt
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Bakım Ekle
        </button>
      </div>

      {/* Toplam maliyet */}
      {records.length > 0 && (
        <div className="bg-slate-50 rounded-xl px-4 py-2.5 mb-4 flex items-center justify-between">
          <span className="text-xs text-slate-500">Toplam Bakım Maliyeti</span>
          <span className="text-sm font-black text-slate-800">{formatCurrency(totalCost)}</span>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Tarih *</label>
              <input type="date" value={form.date} onChange={e => setField("date", e.target.value)} required
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Tür *</label>
              <select value={form.type} onChange={e => setField("type", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] bg-white">
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Açıklama *</label>
            <textarea value={form.description} onChange={e => setField("description", e.target.value)} required rows={2}
              placeholder="Yapılan işlem, kullanılan parçalar..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Maliyet (TL)</label>
              <input type="number" value={form.cost} onChange={e => setField("cost", e.target.value)} min="0" step="0.01"
                placeholder="0.00"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Kilometre</label>
              <input type="number" value={form.odometer} onChange={e => setField("odometer", e.target.value)} min="0"
                placeholder="Bakım anındaki km"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Sonraki Bakım Tarihi</label>
              <input type="date" value={form.nextDate} onChange={e => setField("nextDate", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Sonraki Bakım KM</label>
              <input type="number" value={form.nextKm} onChange={e => setField("nextKm", e.target.value)} min="0"
                placeholder="Örn: 150000"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold transition-all">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm transition-all">
              İptal
            </button>
          </div>
        </form>
      )}

      {/* Liste */}
      {records.length === 0 ? (
        <div className="text-center py-8">
          <Wrench className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Henüz bakım kaydı yok</p>
          <p className="text-slate-300 text-xs mt-0.5">Yağ değişimi, lastik, fren... tüm bakımları buradan takip edin</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(r => {
            const typeInfo = TYPE_LABELS[r.type] ?? TYPE_LABELS.diger;
            const expanded = expandedId === r.id;
            return (
              <div key={r.id} className="border border-slate-100 rounded-xl overflow-hidden">
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : r.id)}
                >
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 font-medium truncate">{r.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(r.date)}{r.odometer ? ` · ${r.odometer.toLocaleString("tr-TR")} km` : ""}</p>
                  </div>
                  {r.cost != null && (
                    <span className="text-sm font-bold text-slate-800 flex-shrink-0">{formatCurrency(r.cost)}</span>
                  )}
                  {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                </div>
                {expanded && (
                  <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100 pt-3 space-y-2">
                    {(r.nextDate || r.nextKm) && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                        <p className="text-xs font-semibold text-amber-700 mb-1">Sonraki Bakım</p>
                        <div className="flex gap-4 text-xs text-amber-600">
                          {r.nextDate && <span>Tarih: {formatDate(r.nextDate)}</span>}
                          {r.nextKm && <span>KM: {r.nextKm.toLocaleString("tr-TR")}</span>}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Kaydı Sil
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

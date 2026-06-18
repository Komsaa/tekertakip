"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X, Car } from "lucide-react";
import toast from "react-hot-toast";

interface Vehicle { id: string; plate: string; brand?: string | null; model?: string | null }

export default function DriverVehicles({
  driverId,
  assignedVehicles,
  allVehicles,
}: {
  driverId: string;
  assignedVehicles: Vehicle[];
  allVehicles: Vehicle[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  const assignedIds = new Set(assignedVehicles.map((v) => v.id));
  const available = allVehicles.filter((v) => !assignedIds.has(v.id));

  async function addVehicle() {
    if (!selectedVehicleId) return;
    setSaving(selectedVehicleId);
    try {
      const res = await fetch(`/api/drivers/${driverId}/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId: selectedVehicleId }),
      });
      if (!res.ok) { toast.error("Eklenemedi"); return; }
      toast.success("Araç eklendi");
      setShowAdd(false);
      setSelectedVehicleId("");
      router.refresh();
    } finally {
      setSaving(null);
    }
  }

  async function removeVehicle(vehicleId: string) {
    setSaving(vehicleId);
    try {
      const res = await fetch(`/api/drivers/${driverId}/vehicles`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId }),
      });
      if (!res.ok) { toast.error("Kaldırılamadı"); return; }
      toast.success("Araç kaldırıldı");
      router.refresh();
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-800">Atanan Araçlar</h2>
        {available.length > 0 && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#DC2626] hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            Araç Ekle
          </button>
        )}
      </div>

      {/* Araç ekleme formu */}
      {showAdd && (
        <div className="flex gap-2 mb-3">
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] bg-white"
          >
            <option value="">-- Araç seç --</option>
            {available.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate} {v.brand} {v.model}
              </option>
            ))}
          </select>
          <button
            onClick={addVehicle}
            disabled={!selectedVehicleId || !!saving}
            className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors"
          >
            Ekle
          </button>
        </div>
      )}

      {/* Atanan araç listesi */}
      {assignedVehicles.length === 0 ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Car className="w-4 h-4" />
          <span>Araç atanmadı</span>
        </div>
      ) : (
        <div className="space-y-2">
          {assignedVehicles.map((v) => (
            <div key={v.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl group">
              <Link
                href={`/panel/araclar/${v.id}`}
                className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-[#1B2437] rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {v.plate.slice(-3)}
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{v.plate}</div>
                  {(v.brand || v.model) && (
                    <div className="text-xs text-slate-500">{v.brand} {v.model}</div>
                  )}
                </div>
              </Link>
              <button
                onClick={() => removeVehicle(v.id)}
                disabled={saving === v.id}
                className="p-1 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-40 opacity-0 group-hover:opacity-100"
                title="Aracı kaldır"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

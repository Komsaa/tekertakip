"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, X, Building2, Users, Key, ToggleLeft, ToggleRight, Trash2, Edit2, UserPlus } from "lucide-react";

type Company = {
  id: string;
  name: string;
  code: string;
  driverLimit: number;
  active: boolean;
  notes: string | null;
  createdAt: string;
  _count: { drivers: number };
};

export default function SirketlerPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<Company | null>(null);
  const [form, setForm] = useState({ name: "", code: "", driverLimit: "10", notes: "" });
  const [unassignedCount, setUnassignedCount] = useState<number | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

  async function load() {
    const [compRes, driversRes] = await Promise.all([
      fetch("/api/companies"),
      fetch("/api/drivers"),
    ]);
    if (compRes.ok) setCompanies(await compRes.json());
    if (driversRes.ok) {
      const drivers: Array<{ companyId: string | null }> = await driversRes.json();
      setUnassignedCount(drivers.filter((d) => !d.companyId).length);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function assignUnassigned(companyId: string) {
    setAssigning(companyId);
    try {
      const res = await fetch(`/api/companies/${companyId}/assign-unassigned`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Şöförler atandı");
        load();
      } else {
        toast.error(data.error || "Hata oluştu");
      }
    } catch { toast.error("Hata oluştu"); }
    finally { setAssigning(null); }
  }

  function openAdd() {
    setEditTarget(null);
    setForm({ name: "", code: "", driverLimit: "10", notes: "" });
    setShowModal(true);
  }

  function openEdit(c: Company) {
    setEditTarget(c);
    setForm({ name: c.name, code: c.code, driverLimit: String(c.driverLimit), notes: c.notes ?? "" });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = editTarget
        ? await fetch(`/api/companies/${editTarget.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          })
        : await fetch("/api/companies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Hata oluştu");
        return;
      }
      toast.success(editTarget ? "Güncellendi" : "Şirket eklendi");
      setShowModal(false);
      load();
    } catch { toast.error("Hata oluştu"); }
    finally { setSaving(false); }
  }

  async function toggleActive(c: Company) {
    await fetch(`/api/companies/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    load();
  }

  async function handleDelete(c: Company) {
    if (!confirm(`"${c.name}" silinsin mi? Şöförlerin şirket bağlantısı kaldırılır.`)) return;
    const res = await fetch(`/api/companies/${c.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Silindi"); load(); }
    else toast.error("Silinemedi");
  }

  const totalDrivers = companies.reduce((s, c) => s + c._count.drivers, 0);
  const totalLimit = companies.reduce((s, c) => s + c.driverLimit, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Şirketler</h1>
          <p className="text-slate-500 text-sm mt-1">
            {companies.length} şirket · {totalDrivers} aktif şöför / {totalLimit} toplam kota
            {unassignedCount !== null && unassignedCount > 0 && (
              <span className="ml-2 text-amber-600 font-semibold">· {unassignedCount} şöför atanmamış</span>
            )}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4" />
          Şirket Ekle
        </button>
      </div>

      {/* Şirket kartları */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {companies.map((c) => (
            <div
              key={c.id}
              className={`bg-white rounded-2xl border shadow-sm p-5 space-y-4 ${
                !c.active ? "opacity-60 border-slate-200" : "border-slate-100"
              }`}
            >
              {/* Üst satır */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{c.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Key className="w-3 h-3 text-slate-400" />
                      <span className="text-xs font-mono font-bold text-[#DC2626]">{c.code}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleActive(c)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                    {c.active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(c)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Şöför kotası */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Users className="w-3.5 h-3.5" />
                    Şöför Kotası
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {c._count.drivers} / {c.driverLimit}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      c._count.drivers >= c.driverLimit ? "bg-red-500" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(100, (c._count.drivers / c.driverLimit) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Atanmamış şöförleri ata */}
              {unassignedCount !== null && unassignedCount > 0 && (
                <button
                  onClick={() => assignUnassigned(c.id)}
                  disabled={assigning === c.id}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {assigning === c.id ? "Atanıyor..." : `${unassignedCount} atanmamış şöförü buraya ata`}
                </button>
              )}

              {/* Durum */}
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  c.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                }`}>
                  {c.active ? "Aktif" : "Pasif"}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(c.createdAt).toLocaleDateString("tr-TR")}
                </span>
              </div>

              {c.notes && <p className="text-xs text-slate-400 border-t border-slate-50 pt-3">{c.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editTarget ? "Şirket Düzenle" : "Yeni Şirket"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label>Şirket Adı *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ata Tur"
                  required
                />
              </div>
              {!editTarget && (
                <div>
                  <label>Giriş Kodu *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="AT2024"
                    required
                    className="font-mono"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Şöförlerin uygulamada kullanacağı kod. Sonradan değiştirilemez.
                  </p>
                </div>
              )}
              <div>
                <label>Şöför Kotası</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={form.driverLimit}
                  onChange={(e) => setForm((f) => ({ ...f, driverLimit: e.target.value }))}
                />
                <p className="text-xs text-slate-400 mt-1">Bu şirkete eklenebilecek maksimum şöför sayısı</p>
              </div>
              <div>
                <label>Notlar</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="resize-none"
                  placeholder="Sözleşme tarihi, iletişim bilgisi vb."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">
                  İptal
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

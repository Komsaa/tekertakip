"use client";
import { useEffect, useState } from "react";
import { Plus, Phone, Building2, CreditCard, ChevronRight, CheckCircle2, Clock, Wallet } from "lucide-react";

type Sub = {
  id: string;
  name: string;
  phone: string | null;
  taxNo: string | null;
  bankIban: string | null;
  active: boolean;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  jobs: { id: string; title: string; date: string; subcontractorAmount: number | null; subcontractorPaid: boolean }[];
};

export default function TaseronlarPage() {
  const [list, setList] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Sub | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", taxNo: "", address: "", bankIban: "", notes: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/subcontractors");
    if (res.ok) setList(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch("/api/subcontractors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", phone: "", taxNo: "", address: "", bankIban: "", notes: "" });
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function handlePayAll(sub: Sub) {
    if (!confirm(`${sub.name} için tüm bekleyen ödemeler yapıldı olarak işaretlensin mi?`)) return;
    await fetch(`/api/subcontractors/${sub.id}/pay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    load();
    setSelected(null);
  }

  const totalPending = list.reduce((s, x) => s + x.pendingAmount, 0);
  const totalAll     = list.reduce((s, x) => s + x.totalAmount, 0);

  if (selected) {
    const pending = selected.jobs.filter((j) => !j.subcontractorPaid);
    const paid    = selected.jobs.filter((j) => j.subcontractorPaid);
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <button onClick={() => setSelected(null)} className="text-sm text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-1">← Tüm Taşeronlar</button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#1B2437]">{selected.name}</h1>
            {selected.phone && <p className="text-slate-500 text-sm mt-1">📞 {selected.phone}</p>}
            {selected.bankIban && <p className="text-slate-500 text-sm">🏦 {selected.bankIban}</p>}
          </div>
          {selected.pendingAmount > 0 && (
            <button onClick={() => handlePayAll(selected)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold">
              ✓ Tümünü Öde
            </button>
          )}
        </div>

        {/* Özet */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Toplam İş", value: `₺${selected.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`, color: "text-slate-700" },
            { label: "Ödendi", value: `₺${selected.paidAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`, color: "text-green-600" },
            { label: "Bekleyen", value: `₺${selected.pendingAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`, color: "text-red-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-slate-100 rounded-xl p-4 text-center">
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-slate-400 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bekleyen işler */}
        {pending.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Bekleyen Ödemeler</h3>
            <div className="space-y-2">
              {pending.map((j) => (
                <div key={j.id} className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">{j.title}</div>
                    <div className="text-slate-400 text-xs">{new Date(j.date).toLocaleDateString("tr-TR")}</div>
                  </div>
                  <div className="font-black text-orange-600">
                    ₺{(j.subcontractorAmount ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ödenen işler */}
        {paid.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Ödenen İşler</h3>
            <div className="space-y-2">
              {paid.map((j) => (
                <div key={j.id} className="bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-center justify-between opacity-70">
                  <div>
                    <div className="font-semibold text-slate-700 text-sm">{j.title}</div>
                    <div className="text-slate-400 text-xs">{new Date(j.date).toLocaleDateString("tr-TR")}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="font-bold text-green-600">₺{(j.subcontractorAmount ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selected.jobs.length === 0 && (
          <div className="text-center py-12 text-slate-400">Henüz iş atanmamış</div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#1B2437]">Taşeronlar</h1>
          <p className="text-slate-500 text-sm mt-1">Dış temin şöför ve araç sahipleri</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#1B2437] hover:bg-[#243044] text-white px-4 py-2 rounded-xl text-sm font-bold">
          <Plus className="w-4 h-4" /> Yeni Taşeron
        </button>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Toplam Taşeron</span>
          </div>
          <div className="text-2xl font-black text-[#1B2437]">{list.filter((s) => s.active).length}</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Toplam Ciro</span>
          </div>
          <div className="text-2xl font-black text-[#1B2437]">₺{totalAll.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-400">Bekleyen Ödeme</span>
          </div>
          <div className="text-2xl font-black text-red-600">₺{totalPending.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-[#1B2437] mb-4">Yeni Taşeron</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Ad Soyad / Firma *", key: "name", placeholder: "Ali Usta" },
              { label: "Telefon", key: "phone", placeholder: "0532 xxx xx xx" },
              { label: "Vergi No / TC", key: "taxNo", placeholder: "12345678901" },
              { label: "IBAN", key: "bankIban", placeholder: "TR..." },
              { label: "Adres", key: "address", placeholder: "İlçe, Şehir" },
              { label: "Not", key: "notes", placeholder: "Opsiyonel not" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">{f.label}</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder={f.placeholder}
                  value={(form as any)[f.key]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={saving} className="bg-[#1B2437] text-white px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-50">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button onClick={() => setShowForm(false)} className="text-slate-500 px-4 py-2 rounded-lg text-sm">İptal</button>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Yükleniyor...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Henüz taşeron eklenmemiş</p>
          <p className="text-sm mt-1">İşlerin bir kısmını dış temin araçlara veriyorsanız buradan takip edin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((sub) => (
            <div
              key={sub.id}
              onClick={() => setSelected(sub)}
              className="bg-white border border-slate-100 rounded-2xl px-5 py-4 flex items-center gap-4 cursor-pointer hover:border-[#1B2437]/20 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1B2437] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-sm">{sub.name.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[#1B2437]">{sub.name}</div>
                <div className="text-slate-400 text-xs flex items-center gap-3 mt-0.5">
                  {sub.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{sub.phone}</span>}
                  {sub.bankIban && <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" />{sub.bankIban.slice(0, 10)}...</span>}
                  <span>{sub.jobs.length} iş</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {sub.pendingAmount > 0 ? (
                  <div>
                    <div className="text-red-600 font-black text-sm">₺{sub.pendingAmount.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} bekliyor</div>
                    <div className="text-slate-400 text-xs">₺{sub.paidAmount.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ödendi</div>
                  </div>
                ) : (
                  <div className="text-green-600 text-sm font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Ödemeler tamam
                  </div>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, X, Building2, Users, Key, ToggleLeft, ToggleRight, Trash2, Edit2, UserPlus, Clock, Crown, AlertTriangle, School, ChevronDown, ChevronUp, ShieldCheck, User } from "lucide-react";

type Company = {
  id: string;
  name: string;
  code: string;
  type: string;
  driverLimit: number;
  active: boolean;
  isDemo: boolean;
  demoExpiresAt: string | null;
  notes: string | null;
  createdAt: string;
  _count: { drivers: number };
};

type PanelUser = {
  id: string;
  username: string;
  name: string;
  phone: string | null;
  role: string;
  active: boolean;
  companyId: string | null;
  createdAt: string;
};

function demoDaysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function SirketlerPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<Company | null>(null);
  const [form, setForm] = useState({ name: "", code: "", type: "firma", driverLimit: "10", notes: "", isDemo: false });
  const [unassignedCount, setUnassignedCount] = useState<number | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [extending, setExtending] = useState<string | null>(null);
  const [converting, setConverting] = useState<string | null>(null);

  // Panel kullanıcıları
  const [panelUsers, setPanelUsers] = useState<PanelUser[]>([]);
  const [openUsersId, setOpenUsersId] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState<PanelUser | null>(null);
  const [userForm, setUserForm] = useState({ username: "", password: "", name: "", phone: "", role: "firma", companyId: "" });
  const [savingUser, setSavingUser] = useState(false);

  async function load() {
    const [compRes, driversRes, usersRes] = await Promise.all([
      fetch("/api/companies"),
      fetch("/api/drivers"),
      fetch("/api/admin/panel-users"),
    ]);
    if (compRes.ok) setCompanies(await compRes.json());
    if (driversRes.ok) {
      const drivers: Array<{ companyId: string | null }> = await driversRes.json();
      setUnassignedCount(drivers.filter((d) => !d.companyId).length);
    }
    if (usersRes.ok) setPanelUsers(await usersRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAddUser(companyId: string) {
    setEditUser(null);
    setUserForm({ username: "", password: "", name: "", phone: "", role: "firma", companyId });
    setShowUserModal(true);
  }

  function openEditUser(u: PanelUser) {
    setEditUser(u);
    setUserForm({ username: u.username, password: "", name: u.name, phone: u.phone ?? "", role: u.role, companyId: u.companyId ?? "" });
    setShowUserModal(true);
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    setSavingUser(true);
    try {
      const body = editUser
        ? { id: editUser.id, name: userForm.name, phone: userForm.phone, role: userForm.role, active: true, companyId: userForm.companyId || null, ...(userForm.password ? { password: userForm.password } : {}) }
        : { username: userForm.username, password: userForm.password, name: userForm.name, phone: userForm.phone, role: userForm.role, companyId: userForm.companyId || null };
      const res = await fetch("/api/admin/panel-users", {
        method: editUser ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Hata"); return; }
      toast.success(editUser ? "Güncellendi" : "Kullanıcı oluşturuldu");
      setShowUserModal(false);
      load();
    } catch { toast.error("Hata oluştu"); }
    finally { setSavingUser(false); }
  }

  async function deleteUser(u: PanelUser) {
    if (!confirm(`"${u.name}" kullanıcısı silinsin mi?`)) return;
    const res = await fetch("/api/admin/panel-users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id }),
    });
    if (res.ok) { toast.success("Silindi"); load(); }
    else toast.error("Silinemedi");
  }

  async function toggleUserActive(u: PanelUser) {
    const res = await fetch("/api/admin/panel-users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, active: !u.active }),
    });
    if (res.ok) load();
  }

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

  async function extendDemo(c: Company) {
    setExtending(c.id);
    try {
      const res = await fetch(`/api/companies/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extendDemo: true }),
      });
      if (res.ok) { toast.success("Demo 30 gün uzatıldı"); load(); }
      else toast.error("Hata oluştu");
    } catch { toast.error("Hata oluştu"); }
    finally { setExtending(null); }
  }

  async function convertToPaid(c: Company) {
    if (!confirm(`"${c.name}" ücretli hesaba geçirilsin mi?`)) return;
    setConverting(c.id);
    try {
      const res = await fetch(`/api/companies/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDemo: false, demoExpiresAt: null }),
      });
      if (res.ok) { toast.success("Ücretli hesaba geçirildi"); load(); }
      else toast.error("Hata oluştu");
    } catch { toast.error("Hata oluştu"); }
    finally { setConverting(null); }
  }

  function openAdd() {
    setEditTarget(null);
    setForm({ name: "", code: "", type: "firma", driverLimit: "10", notes: "", isDemo: false });
    setShowModal(true);
  }

  function openEdit(c: Company) {
    setEditTarget(c);
    setForm({ name: c.name, code: c.code, type: c.type ?? "firma", driverLimit: String(c.driverLimit), notes: c.notes ?? "", isDemo: c.isDemo });
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
  const demoCount = companies.filter((c) => c.isDemo).length;

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Şirketler</h1>
          <p className="text-slate-500 text-sm mt-1">
            {companies.length} şirket · {totalDrivers} aktif şöför / {totalLimit} toplam kota
            {demoCount > 0 && <span className="ml-2 text-amber-600 font-semibold">· {demoCount} demo</span>}
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
          {companies.map((c) => {
            const daysLeft = demoDaysLeft(c.demoExpiresAt);
            const demoExpired = c.isDemo && daysLeft !== null && daysLeft <= 0;
            const demoWarning = c.isDemo && daysLeft !== null && daysLeft > 0 && daysLeft <= 7;

            return (
              <div
                key={c.id}
                className={`bg-white rounded-2xl border shadow-sm p-5 space-y-4 ${
                  !c.active ? "opacity-60 border-slate-200" : demoExpired ? "border-red-200" : "border-slate-100"
                }`}
              >
                {/* Demo badge */}
                {c.isDemo && (
                  <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${
                    demoExpired
                      ? "bg-red-100 text-red-700"
                      : demoWarning
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {demoExpired ? (
                      <><AlertTriangle className="w-3 h-3" /> Demo Süresi Doldu</>
                    ) : (
                      <><Clock className="w-3 h-3" /> Demo · {daysLeft} gün kaldı</>
                    )}
                  </div>
                )}

                {/* Üst satır */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      {c.type === "okul" ? <School className="w-5 h-5 text-indigo-500" /> : <Building2 className="w-5 h-5 text-slate-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{c.name}</span>
                        {c.type === "okul" && (
                          <span className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-md font-medium">Okul</span>
                        )}
                      </div>
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

                {/* Demo aksiyonları */}
                {c.isDemo && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => extendDemo(c)}
                      disabled={extending === c.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {extending === c.id ? "..." : "+30 Gün"}
                    </button>
                    <button
                      onClick={() => convertToPaid(c)}
                      disabled={converting === c.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      {converting === c.id ? "..." : "Ücretliye Geç"}
                    </button>
                  </div>
                )}

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

                {/* Panel Kullanıcıları */}
                <div className="border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setOpenUsersId(openUsersId === c.id ? null : c.id)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      Panel Kullanıcıları ({panelUsers.filter((u) => u.companyId === c.id).length})
                    </span>
                    {openUsersId === c.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {openUsersId === c.id && (
                    <div className="mt-2 space-y-1.5">
                      {panelUsers.filter((u) => u.companyId === c.id).length === 0 && (
                        <p className="text-xs text-slate-400 italic py-1">Henüz panel kullanıcısı yok.</p>
                      )}
                      {panelUsers.filter((u) => u.companyId === c.id).map((u) => (
                        <div key={u.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-2.5 py-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-700 truncate">{u.name}</div>
                            <div className="text-xs text-slate-400 font-mono truncate">@{u.username}</div>
                          </div>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                            u.role === "admin" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {u.role === "admin" ? "Admin" : "Firma"}
                          </span>
                          <button onClick={() => toggleUserActive(u)} className="flex-shrink-0">
                            {u.active
                              ? <ToggleRight className="w-4 h-4 text-green-500" />
                              : <ToggleLeft className="w-4 h-4 text-slate-300" />}
                          </button>
                          <button onClick={() => openEditUser(u)} className="p-1 text-slate-400 hover:text-blue-600 flex-shrink-0">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteUser(u)} className="p-1 text-slate-300 hover:text-red-500 flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => openAddUser(c.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Kullanıcı Ekle
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
              <div>
                <label>Üyelik Tipi</label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: "firma" }))}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      form.type === "firma"
                        ? "bg-slate-800 text-white border-slate-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    Servis Firması
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: "okul" }))}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      form.type === "okul"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <School className="w-4 h-4" />
                    Okul
                  </button>
                </div>
                {form.type === "okul" && (
                  <p className="text-xs text-indigo-600 mt-1">Okul paneli: sadece güzergah, şöför ve veli takibi görünür.</p>
                )}
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
              {/* Demo seçeneği - sadece yeni şirket eklerken */}
              {!editTarget && (
                <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isDemo}
                    onChange={(e) => setForm((f) => ({ ...f, isDemo: e.target.checked }))}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <div>
                    <div className="text-sm font-semibold text-blue-800">Demo hesap (30 gün ücretsiz)</div>
                    <div className="text-xs text-blue-600">Süre dolunca hesap kilitlenir, veriler silinmez</div>
                  </div>
                </label>
              )}
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
      {/* Panel Kullanıcı Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowUserModal(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editUser ? "Kullanıcı Düzenle" : "Yeni Panel Kullanıcısı"}
              </h2>
              <button onClick={() => setShowUserModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              {!editUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kullanıcı Adı *</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value.toLowerCase() }))}
                    placeholder="ataservis"
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] font-mono"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad *</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ahmet Yılmaz"
                  required
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {editUser ? "Yeni Şifre (boş bırakırsan değişmez)" : "Şifre *"}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder={editUser ? "••••••••" : "Güçlü bir şifre gir"}
                  required={!editUser}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                <input
                  type="text"
                  value={userForm.phone}
                  onChange={(e) => setUserForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="05xx xxx xx xx"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                >
                  <option value="firma">Firma (sadece kendi şirketini görür)</option>
                  <option value="admin">Admin (tüm şirketleri görür)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">
                  İptal
                </button>
                <button type="submit" disabled={savingUser} className="flex-1 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
                  {savingUser ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

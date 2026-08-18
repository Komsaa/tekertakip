"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Tipler ───────────────────────────────────────────────────────────────────
type Company = {
  id: string; name: string; code: string; type: string; active: boolean;
  demoExpiresAt?: string | null; notes?: string | null;
  routeCount?: number;
  _count?: { drivers: number; vehicles: number; panelUsers: number };
};

type PanelUser = {
  id: string; username: string; name: string; phone: string | null;
  role: string; active: boolean; companyId: string | null;
  mobileUsername: string | null; createdAt: string;
};

type MobileUser = {
  id: string; name: string; phone: string | null;
  mobileUsername: string | null; mobilePin: string | null; status: string; createdAt: string;
};

type AuditLog = {
  id: string; userEmail: string; action: string; entity: string;
  entityId: string | null; entityName: string | null; changes: string | null; createdAt: string;
};

// ─── Yardımcı ─────────────────────────────────────────────────────────────────
const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
};

function expiryStatus(raw: string | null | undefined): { label: string; color: string } {
  if (!raw) return { label: "Sınırsız", color: "text-slate-400" };
  const exp = new Date(raw);
  const now = new Date();
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return { label: `Süresi doldu (${exp.toLocaleDateString("tr-TR")})`, color: "text-red-400" };
  if (diffDays <= 7) return { label: `${diffDays} gün kaldı ⚠️`, color: "text-orange-400" };
  if (diffDays <= 30) return { label: `${diffDays} gün kaldı`, color: "text-yellow-400" };
  return { label: exp.toLocaleDateString("tr-TR"), color: "text-green-400" };
}

// ─── Ana bileşen ──────────────────────────────────────────────────────────────
export default function AdminClient() {
  const [tab, setTab] = useState<"companies" | "users" | "drivers" | "logs">("companies");

  // Şirketler
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [newCompanyForm, setNewCompanyForm] = useState({ name: "", code: "", type: "firma" });
  const [newCompanyError, setNewCompanyError] = useState("");
  const [newCompanySaving, setNewCompanySaving] = useState(false);
  const [showNewCompany, setShowNewCompany] = useState(false);

  // Abonelik düzenleme
  const [trialEdit, setTrialEdit] = useState<{ id: string; date: string } | null>(null);
  const [trialSaving, setTrialSaving] = useState(false);

  // Eski veri
  const [fixCompanyId, setFixCompanyId] = useState("");
  const [fixLoading, setFixLoading] = useState(false);
  const [fixResult, setFixResult] = useState<string | null>(null);

  // Panel kullanıcıları
  const [panelUsers, setPanelUsers] = useState<PanelUser[]>([]);
  const [newUserForm, setNewUserForm] = useState({ username: "", password: "", name: "", phone: "", role: "firma", companyId: "", newCompanyName: "", mobileUsername: "", mobilePin: "" });
  const [newUserError, setNewUserError] = useState("");
  const [newUserSaving, setNewUserSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<PanelUser | null>(null);
  const [editUserForm, setEditUserForm] = useState({ name: "", phone: "", role: "firma", password: "", active: true, companyId: "", mobileUsername: "", mobilePin: "" });

  // Mobil kullanıcılar (şöförler)
  const [mobileUsers, setMobileUsers] = useState<MobileUser[]>([]);
  const [editingMobile, setEditingMobile] = useState<string | null>(null);
  const [editMobileForm, setEditMobileForm] = useState({ mobileUsername: "", mobilePin: "" });
  const [mobileSaving, setMobileSaving] = useState(false);

  // Loglar
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [logFilter, setLogFilter] = useState({ entity: "", action: "", from: "", to: "" });
  const [logLoading, setLogLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
    fetchPanelUsers();
  }, []);

  useEffect(() => {
    if (tab === "drivers") fetchMobileUsers();
    if (tab === "logs") fetchLogs(1);
  }, [tab]);

  async function fetchCompanies() {
    setCompaniesLoading(true);
    const res = await fetch("/api/admin/companies");
    if (res.ok) setCompanies(await res.json());
    setCompaniesLoading(false);
  }

  async function fetchPanelUsers() {
    const res = await fetch("/api/admin/panel-users");
    if (res.ok) setPanelUsers(await res.json());
  }

  async function fetchMobileUsers() {
    const res = await fetch("/api/admin/users");
    if (res.ok) setMobileUsers(await res.json());
  }

  async function enterCompany(companyId: string) {
    const res = await fetch("/api/admin/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId }),
    });
    if (res.ok) {
      window.location.href = "/panel";
    } else {
      const err = await res.json();
      alert(err.error || "Hata olustu");
    }
  }

  const fetchLogs = useCallback(async (page = 1, filter = logFilter) => {
    setLogLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: "50" });
    if (filter.entity) p.set("entity", filter.entity);
    if (filter.action) p.set("action", filter.action);
    if (filter.from) p.set("from", filter.from);
    if (filter.to) p.set("to", filter.to);
    const res = await fetch(`/api/admin/audit-logs?${p}`);
    if (res.ok) { const d = await res.json(); setLogs(d.logs); setLogTotal(d.total); setLogPage(page); }
    setLogLoading(false);
  }, [logFilter]);

  // ── Şirket işlemleri ──────────────────────────────────────────────────────
  async function createCompany() {
    setNewCompanyError(""); setNewCompanySaving(true);
    const res = await fetch("/api/admin/companies", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCompanyForm),
    });
    const data = await res.json();
    setNewCompanySaving(false);
    if (!res.ok) { setNewCompanyError(data.error); return; }
    setNewCompanyForm({ name: "", code: "", type: "firma" });
    setShowNewCompany(false);
    fetchCompanies();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/companies/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    setCompanies((prev) => prev.map((c) => c.id === id ? { ...c, active } : c));
  }

  async function saveTrialDate(id: string, date: string | null) {
    setTrialSaving(true);
    const res = await fetch(`/api/admin/companies/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demoExpiresAt: date }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCompanies((prev) => prev.map((c) => c.id === id ? { ...c, demoExpiresAt: updated.demoExpiresAt } : c));
      setTrialEdit(null);
    }
    setTrialSaving(false);
  }

  function addDaysToTrial(days: number | null) {
    if (!trialEdit) return;
    if (days === null) { saveTrialDate(trialEdit.id, null); return; }
    const base = trialEdit.date ? new Date(trialEdit.date) : new Date();
    if (base < new Date()) base.setTime(Date.now());
    base.setDate(base.getDate() + days);
    setTrialEdit({ ...trialEdit, date: base.toISOString().split("T")[0] });
  }

  async function fixTenant() {
    if (!fixCompanyId) return;
    if (!confirm("Şirketsiz tüm eski kayıtlar seçilen şirkete bağlanacak. Devam?")) return;
    setFixLoading(true); setFixResult(null);
    const res = await fetch("/api/admin/fix-tenant", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: fixCompanyId }),
    });
    const data = await res.json();
    setFixLoading(false);
    if (res.ok) {
      const lines = Object.entries(data.updated as Record<string, number>).filter(([, n]) => n > 0).map(([t, n]) => `${t}: ${n}`);
      setFixResult(lines.length ? lines.join(", ") : "Güncellenecek kayıt yok");
    } else setFixResult("Hata: " + data.error);
  }

  // ── Panel kullanıcı işlemleri ─────────────────────────────────────────────
  async function createPanelUser() {
    setNewUserError(""); setNewUserSaving(true);
    let companyId = newUserForm.companyId || null;
    if (newUserForm.newCompanyName.trim()) {
      const code = newUserForm.newCompanyName.trim().toUpperCase().replace(/\s+/g, "").slice(0, 8) + Date.now().toString().slice(-4);
      const cr = await fetch("/api/admin/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newUserForm.newCompanyName.trim(), code }) });
      const cd = await cr.json();
      if (!cr.ok) { setNewUserError("Şirket oluşturulamadı: " + cd.error); setNewUserSaving(false); return; }
      companyId = cd.id;
    }
    const res = await fetch("/api/admin/panel-users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newUserForm, companyId }),
    });
    const data = await res.json();
    setNewUserSaving(false);
    if (!res.ok) { setNewUserError(data.error); return; }
    setNewUserForm({ username: "", password: "", name: "", phone: "", role: "firma", companyId: "", newCompanyName: "", mobileUsername: "", mobilePin: "" });
    fetchPanelUsers(); fetchCompanies();
  }

  async function savePanelUser() {
    if (!editingUser) return;
    const body: Record<string, unknown> = { id: editingUser.id, ...editUserForm, companyId: editUserForm.companyId || null, mobileUsername: editUserForm.mobileUsername || null, mobilePin: editUserForm.mobilePin || undefined };
    if (!editUserForm.password) delete body.password;
    await fetch("/api/admin/panel-users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setEditingUser(null);
    fetchPanelUsers();
  }

  async function deletePanelUser(id: string) {
    if (!confirm("Bu kullanıcıyı silmek istediğinizden emin misiniz?")) return;
    await fetch("/api/admin/panel-users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchPanelUsers();
  }

  function openEditUser(u: PanelUser) {
    setEditingUser(u);
    setEditUserForm({ name: u.name, phone: u.phone ?? "", role: u.role, password: "", active: u.active, companyId: u.companyId ?? "", mobileUsername: u.mobileUsername ?? "", mobilePin: "" });
  }

  // ── Mobil kullanıcı işlemleri ─────────────────────────────────────────────
  async function saveMobileUser(id: string) {
    setMobileSaving(true);
    await fetch("/api/admin/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...editMobileForm }) });
    setEditingMobile(null); setMobileSaving(false); fetchMobileUsers();
  }

  // ── Özet istatistikler ─────────────────────────────────────────────────────
  const totalDrivers = companies.reduce((s, c) => s + (c._count?.drivers ?? 0), 0);
  const totalVehicles = companies.reduce((s, c) => s + (c._count?.vehicles ?? 0), 0);
  const activeCount = companies.filter((c) => c.active).length;
  const expiredCount = companies.filter((c) => {
    if (!c.demoExpiresAt) return false;
    return new Date(c.demoExpiresAt) < new Date();
  }).length;

  const TABS = [
    { key: "companies" as const, label: "🏢 Şirketler" },
    { key: "users" as const, label: "👤 Panel Kullanıcıları" },
    { key: "drivers" as const, label: "📱 Mobil Kullanıcılar" },
    { key: "logs" as const, label: "📋 Aktivite Günlüğü" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-800">TekerTakip Yönetim Paneli</h1>
        <p className="text-slate-500 text-sm mt-1">Müşteri şirketleri, kullanıcıları ve abonelikleri buradan yönetebilirsiniz.</p>
      </div>

      {/* Özet istatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Toplam Şirket", value: companies.length, color: "bg-slate-100 text-slate-800" },
          { label: "Aktif", value: activeCount, color: "bg-green-50 text-green-700" },
          { label: "Süresi Dolan", value: expiredCount, color: expiredCount > 0 ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-800" },
          { label: "Toplam Şöför", value: totalDrivers, color: "bg-blue-50 text-blue-700" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-2xl p-4 text-center border border-white shadow-sm`}>
            <div className="text-3xl font-black">{stat.value}</div>
            <div className="text-xs mt-1 font-semibold opacity-70">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold -mb-px border-b-2 whitespace-nowrap transition-colors ${tab === t.key ? "border-[#DC2626] text-[#DC2626]" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ŞİRKETLER ── */}
      {tab === "companies" && (
        <div className="space-y-4">
          {/* Araç kutusu */}
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowNewCompany(!showNewCompany)}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
              + Yeni Şirket Ekle
            </button>
            <div className="flex gap-2 items-center ml-auto">
              <select className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700" value={fixCompanyId} onChange={(e) => setFixCompanyId(e.target.value)}>
                <option value="">— Eski veriyi şirkete bağla —</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button onClick={fixTenant} disabled={fixLoading || !fixCompanyId}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white px-3 py-2 rounded-xl text-sm font-semibold">
                {fixLoading ? "..." : "Bağla"}
              </button>
              {fixResult && <span className="text-xs text-amber-600 font-medium">{fixResult}</span>}
            </div>
          </div>

          {/* Yeni şirket formu */}
          {showNewCompany && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Yeni Şirket</h3>
              <div className="grid grid-cols-3 gap-3">
                <input placeholder="Şirket Adı *" className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]" value={newCompanyForm.name} onChange={(e) => setNewCompanyForm((f) => ({ ...f, name: e.target.value }))} />
                <input placeholder="Kod (örn: MERTTUR)" className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]" value={newCompanyForm.code} onChange={(e) => setNewCompanyForm((f) => ({ ...f, code: e.target.value }))} />
                <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]" value={newCompanyForm.type} onChange={(e) => setNewCompanyForm((f) => ({ ...f, type: e.target.value }))}>
                  <option value="firma">Servis Firması</option>
                  <option value="okul">Okul</option>
                </select>
              </div>
              {newCompanyError && <p className="text-red-500 text-xs mt-2">{newCompanyError}</p>}
              <div className="flex gap-2 mt-4">
                <button onClick={createCompany} disabled={newCompanySaving || !newCompanyForm.name || !newCompanyForm.code}
                  className="bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-40 text-white px-5 py-2 rounded-xl text-sm font-semibold">
                  {newCompanySaving ? "Kaydediliyor..." : "Oluştur"}
                </button>
                <button onClick={() => setShowNewCompany(false)} className="text-slate-500 hover:text-slate-700 px-3 py-2 text-sm font-medium">İptal</button>
              </div>
            </div>
          )}

          {/* Şirket kartları */}
          {companiesLoading ? (
            <div className="text-center py-12 text-slate-400">Yükleniyor...</div>
          ) : companies.length === 0 ? (
            <div className="text-center py-12 text-slate-400">Henüz şirket yok.</div>
          ) : (
            companies.map((c) => {
              const { label: expLabel, color: expColor } = expiryStatus(c.demoExpiresAt);
              const isEditing = trialEdit?.id === c.id;
              return (
                <div key={c.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-opacity ${c.active ? "border-slate-100" : "border-slate-100 opacity-50"}`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-slate-800 font-bold text-lg">{c.name}</h3>
                        <span className="text-xs font-mono text-[#DC2626] bg-red-50 px-2 py-0.5 rounded-md font-bold">{c.code}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.type === "okul" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                          {c.type === "okul" ? "Okul" : "Firma"}
                        </span>
                      </div>
                      <div className="flex gap-5 text-sm text-slate-500">
                        <span>👤 <strong className="text-slate-800">{c._count?.drivers ?? 0}</strong> şöför</span>
                        <span>🚌 <strong className="text-slate-800">{c._count?.vehicles ?? 0}</strong> araç</span>
                        <span>🗺️ <strong className="text-slate-800">{c.routeCount ?? 0}</strong> güzergah</span>
                        <span>💻 <strong className="text-slate-800">{c._count?.panelUsers ?? 0}</strong> kullanıcı</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => enterCompany(c.id)}
                        className="text-xs px-3 py-1.5 rounded-full font-semibold bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                      >
                        Panele Gir
                      </button>
                      <button onClick={() => toggleActive(c.id, !c.active)}
                        className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${c.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                        {c.active ? "✓ Aktif" : "Pasif"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Abonelik</span>
                      {!isEditing ? (
                        <>
                          <span className={`text-sm font-bold ${expColor}`}>{expLabel}</span>
                          <button onClick={() => setTrialEdit({ id: c.id, date: c.demoExpiresAt ? new Date(c.demoExpiresAt).toISOString().split("T")[0] : "" })}
                            className="text-xs text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors font-semibold">
                            ✏️ Düzenle
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-wrap gap-2 items-center">
                          <button onClick={() => addDaysToTrial(14)} className="text-xs px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium">+14g</button>
                          <button onClick={() => addDaysToTrial(30)} className="text-xs px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium">+30g</button>
                          <button onClick={() => addDaysToTrial(90)} className="text-xs px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium">+90g</button>
                          <button onClick={() => addDaysToTrial(365)} className="text-xs px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium">+1 yıl</button>
                          <button onClick={() => addDaysToTrial(null)} className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium">∞ Sınırsız</button>
                          <input type="date" value={trialEdit.date} onChange={(e) => setTrialEdit({ ...trialEdit, date: e.target.value })}
                            className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none" />
                          <button onClick={() => saveTrialDate(c.id, trialEdit.date || null)} disabled={trialSaving}
                            className="text-xs px-3 py-1 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white rounded-lg font-semibold">
                            {trialSaving ? "..." : "Kaydet"}
                          </button>
                          <button onClick={() => setTrialEdit(null)} className="text-xs text-slate-400 hover:text-slate-600">İptal</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── PANEL KULLANICILARI ── */}
      {tab === "users" && (
        <div className="space-y-6">
          <p className="text-sm text-slate-500">Her şirkete panel erişimi verebilirsiniz. Firma yöneticileri buradan oluşturulur.</p>

          {/* Yeni kullanıcı formu */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-4">Yeni Panel Kullanıcısı</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Ad Soyad *</label>
                <input placeholder="Ahmet Yılmaz" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]" value={newUserForm.name} onChange={(e) => setNewUserForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Kullanıcı Adı *</label>
                <input placeholder="ataservis" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]" value={newUserForm.username} onChange={(e) => setNewUserForm((f) => ({ ...f, username: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Şifre *</label>
                <input placeholder="Şifre" type="text" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono text-[#DC2626] focus:outline-none focus:ring-2 focus:ring-[#DC2626]" value={newUserForm.password} onChange={(e) => setNewUserForm((f) => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Telefon</label>
                <input placeholder="05xx xxx xx xx" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]" value={newUserForm.phone} onChange={(e) => setNewUserForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Rol</label>
                <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]" value={newUserForm.role} onChange={(e) => setNewUserForm((f) => ({ ...f, role: e.target.value }))}>
                  <option value="firma">Firma</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Şirket</label>
                <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]" value={newUserForm.companyId} onChange={(e) => setNewUserForm((f) => ({ ...f, companyId: e.target.value, newCompanyName: "" }))}>
                  <option value="">— Şirket seç —</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            {newUserError && <p className="text-red-500 text-xs mt-2">{newUserError}</p>}
            <button onClick={createPanelUser} disabled={newUserSaving || !newUserForm.username || !newUserForm.password || !newUserForm.name}
              className="mt-4 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-40 text-white px-5 py-2 rounded-xl text-sm font-semibold">
              {newUserSaving ? "Kaydediliyor..." : "Kullanıcı Oluştur"}
            </button>
          </div>

          {/* Kullanıcı listesi */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100 text-xs uppercase tracking-wider bg-slate-50">
                  {["Ad Soyad", "Kullanıcı Adı", "Telefon", "Şirket", "Rol", "Durum", ""].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {panelUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 font-mono text-[#DC2626] text-xs font-bold">{u.username}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{u.phone ?? <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {u.companyId ? (companies.find((c) => c.id === u.companyId)?.name ?? <span className="text-orange-500">ID: {u.companyId.slice(0, 8)}</span>) : <span className="text-amber-600 font-semibold">Superadmin</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                        {u.role === "admin" ? "Admin" : "Firma"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {u.active ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEditUser(u)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium">Düzenle</button>
                        <button onClick={() => deletePanelUser(u.id)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1">Sil</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {panelUsers.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-400">Henüz panel kullanıcısı yok</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400">Not: .env dosyasındaki admin hesapları bu listede görünmez.</p>
        </div>
      )}

      {/* ── KULLANICI DÜZENLEME MODAL ── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingUser(null)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-slate-100">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">Kullanıcı Düzenle</h2>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Ad Soyad</label>
                  <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]" value={editUserForm.name} onChange={(e) => setEditUserForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Telefon</label>
                  <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]" value={editUserForm.phone} placeholder="05xx xxx xx xx" onChange={(e) => setEditUserForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Yeni Şifre <span className="text-slate-300">(boş bırakırsan değişmez)</span></label>
                <input type="text" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono text-[#DC2626] focus:outline-none focus:ring-2 focus:ring-[#DC2626]" placeholder="Yeni şifre gir" value={editUserForm.password} onChange={(e) => setEditUserForm((f) => ({ ...f, password: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Rol</label>
                  <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]" value={editUserForm.role} onChange={(e) => setEditUserForm((f) => ({ ...f, role: e.target.value }))}>
                    <option value="firma">Firma</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Şirket</label>
                  <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]" value={editUserForm.companyId} onChange={(e) => setEditUserForm((f) => ({ ...f, companyId: e.target.value }))}>
                    <option value="">— Superadmin —</option>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Mobil Kullanıcı Adı</label>
                  <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]" value={editUserForm.mobileUsername} placeholder="—" onChange={(e) => setEditUserForm((f) => ({ ...f, mobileUsername: e.target.value.toLowerCase() }))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Mobil PIN <span className="text-slate-300">(değiştirmek için)</span></label>
                  <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]" value={editUserForm.mobilePin} placeholder="••••" onChange={(e) => setEditUserForm((f) => ({ ...f, mobilePin: e.target.value }))} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={editUserForm.active} onChange={(e) => setEditUserForm((f) => ({ ...f, active: e.target.checked }))} className="w-4 h-4 accent-[#DC2626]" />
                Hesap Aktif
              </label>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button onClick={() => setEditingUser(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">İptal</button>
              <button onClick={savePanelUser} className="flex-1 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-sm font-semibold">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBİL KULLANICILAR (Şöförler) ── */}
      {tab === "drivers" && (
        <div>
          <p className="text-sm text-slate-500 mb-4">Mobil uygulamaya giriş yapan şöförler. Kullanıcı adı veya PIN sıfırlayabilirsiniz.</p>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100 text-xs uppercase tracking-wider bg-slate-50">
                  {["Şöför", "Telefon", "Kullanıcı Adı", "PIN", "Durum", ""].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mobileUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{u.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      {editingMobile === u.id
                        ? <input className="border border-slate-200 rounded-lg px-2 py-1 text-sm w-32 text-slate-800 focus:outline-none" value={editMobileForm.mobileUsername} onChange={(e) => setEditMobileForm((f) => ({ ...f, mobileUsername: e.target.value }))} />
                        : <span className="font-mono text-[#DC2626] text-xs font-bold">{u.mobileUsername ?? <span className="text-slate-300">—</span>}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {editingMobile === u.id
                        ? <input className="border border-slate-200 rounded-lg px-2 py-1 text-sm w-20 font-mono text-slate-800 focus:outline-none" value={editMobileForm.mobilePin} placeholder="PIN" onChange={(e) => setEditMobileForm((f) => ({ ...f, mobilePin: e.target.value }))} />
                        : <span className="text-xs text-slate-400">{u.mobilePin ? "••••" : "—"}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{u.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {editingMobile === u.id
                        ? <div className="flex gap-2">
                            <button onClick={() => saveMobileUser(u.id)} disabled={mobileSaving} className="text-xs bg-[#DC2626] hover:bg-[#B91C1C] text-white px-3 py-1.5 rounded-lg disabled:opacity-50 font-medium">Kaydet</button>
                            <button onClick={() => setEditingMobile(null)} className="text-xs text-slate-400 hover:text-slate-600">İptal</button>
                          </div>
                        : <button onClick={() => { setEditingMobile(u.id); setEditMobileForm({ mobileUsername: u.mobileUsername ?? "", mobilePin: "" }); }} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium">Düzenle</button>}
                    </td>
                  </tr>
                ))}
                {mobileUsers.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-400">Mobil kullanıcı yok</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── AKTİVİTE GÜNLÜĞÜ ── */}
      {tab === "logs" && (
        <div>
          <div className="flex flex-wrap gap-3 mb-4">
            <input type="text" placeholder="Varlık (Driver, Vehicle...)" className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 w-44 focus:outline-none focus:ring-2 focus:ring-[#DC2626]" value={logFilter.entity} onChange={(e) => setLogFilter((f) => ({ ...f, entity: e.target.value }))} />
            <select className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none" value={logFilter.action} onChange={(e) => setLogFilter((f) => ({ ...f, action: e.target.value }))}>
              <option value="">Tüm İşlemler</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input type="date" className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none" value={logFilter.from} onChange={(e) => setLogFilter((f) => ({ ...f, from: e.target.value }))} />
            <input type="date" className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none" value={logFilter.to} onChange={(e) => setLogFilter((f) => ({ ...f, to: e.target.value }))} />
            <button onClick={() => fetchLogs(1, logFilter)} className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-xl text-sm font-semibold">Filtrele</button>
            <span className="text-slate-400 text-sm self-center">{logTotal} kayıt</span>
          </div>
          {logLoading ? <div className="text-center py-8 text-slate-400">Yükleniyor...</div> : (
            <>
              <div className="space-y-1">
                {logs.map((log) => (
                  <div key={log.id} className="bg-white rounded-xl border border-slate-100 shadow-sm">
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 rounded-xl" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${ACTION_COLORS[log.action] ?? "bg-slate-100 text-slate-600"}`}>{log.action}</span>
                      <span className="text-slate-700 font-semibold text-sm">{log.entity}</span>
                      <span className="text-slate-500 text-sm flex-1">{log.entityName ?? log.entityId ?? "—"}</span>
                      <span className="text-slate-400 text-xs">{log.userEmail}</span>
                      <span className="text-slate-400 text-xs">{new Date(log.createdAt).toLocaleString("tr-TR")}</span>
                    </button>
                    {expandedLog === log.id && log.changes && (
                      <div className="px-4 pb-3 pt-1 border-t border-slate-100">
                        <pre className="text-xs text-slate-700 bg-slate-50 rounded-lg p-3 overflow-x-auto max-h-64">{log.changes}</pre>
                      </div>
                    )}
                  </div>
                ))}
                {logs.length === 0 && <div className="text-center py-8 text-slate-400">Kayıt bulunamadı</div>}
              </div>
              {Math.ceil(logTotal / 50) > 1 && (
                <div className="flex items-center gap-2 mt-4 justify-center">
                  <button disabled={logPage === 1} onClick={() => fetchLogs(logPage - 1)} className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-sm text-slate-700">← Önceki</button>
                  <span className="text-sm text-slate-500">{logPage} / {Math.ceil(logTotal / 50)}</span>
                  <button disabled={logPage === Math.ceil(logTotal / 50)} onClick={() => fetchLogs(logPage + 1)} className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-sm text-slate-700">Sonraki →</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";

type MobileUser = {
  id: string;
  name: string;
  phone: string | null;
  mobileUsername: string | null;
  mobilePin: string | null;
  status: string;
  createdAt: string;
};

type AuditLog = {
  id: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId: string | null;
  entityName: string | null;
  changes: string | null;
  createdAt: string;
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

type Company = {
  id: string;
  name: string;
  code: string;
  type: string;
  active: boolean;
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-900 text-green-300",
  UPDATE: "bg-blue-900 text-blue-300",
  DELETE: "bg-red-900 text-red-300",
};

const ENTITIES = ["", "Job", "Driver", "Vehicle", "FuelEntry", "Client", "Invoice"];
const ACTIONS = ["", "CREATE", "UPDATE", "DELETE"];

export default function AdminClient() {
  const [tab, setTab] = useState<"panel-users" | "mobile-users" | "logs" | "deleted" | "companies">("panel-users");

  // Panel users
  const [panelUsers, setPanelUsers] = useState<PanelUser[]>([]);
  const [newUserForm, setNewUserForm] = useState({ username: "", password: "", name: "", phone: "", role: "admin", companyId: "", newCompanyName: "" });
  const [newUserError, setNewUserError] = useState("");
  const [newUserSaving, setNewUserSaving] = useState(false);
  const [editingPanelUser, setEditingPanelUser] = useState<string | null>(null);
  const [editPanelForm, setEditPanelForm] = useState({ name: "", phone: "", role: "admin", password: "", active: true, companyId: "" });

  // Companies
  const [companies, setCompanies] = useState<Company[]>([]);
  const [newCompanyForm, setNewCompanyForm] = useState({ name: "", code: "", type: "firma" });
  const [newCompanyError, setNewCompanyError] = useState("");
  const [newCompanySaving, setNewCompanySaving] = useState(false);
  const [fixTenantCompanyId, setFixTenantCompanyId] = useState("");
  const [fixTenantLoading, setFixTenantLoading] = useState(false);
  const [fixTenantResult, setFixTenantResult] = useState<string | null>(null);

  // Mobile users
  const [mobileUsers, setMobileUsers] = useState<MobileUser[]>([]);
  const [editingMobileUser, setEditingMobileUser] = useState<string | null>(null);
  const [editMobileForm, setEditMobileForm] = useState({ mobileUsername: "", mobilePin: "" });
  const [mobileSaving, setMobileSaving] = useState(false);

  // Audit logs
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [logFilter, setLogFilter] = useState({ entity: "", action: "", userEmail: "", from: "", to: "" });
  const [logLoading, setLogLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Deleted data
  const [deletedLogs, setDeletedLogs] = useState<AuditLog[]>([]);
  const [deletedLoading, setDeletedLoading] = useState(false);

  useEffect(() => {
    if (tab === "panel-users") { fetchPanelUsers(); fetchCompanies(); }
    if (tab === "mobile-users") fetchMobileUsers();
    if (tab === "logs") fetchLogs();
    if (tab === "deleted") fetchDeleted();
    if (tab === "companies") fetchCompanies();
  }, [tab]);

  async function fetchPanelUsers() {
    const res = await fetch("/api/admin/panel-users");
    if (res.ok) setPanelUsers(await res.json());
  }

  async function fetchCompanies() {
    const res = await fetch("/api/admin/companies");
    if (res.ok) setCompanies(await res.json());
  }

  async function fetchMobileUsers() {
    const res = await fetch("/api/admin/users");
    if (res.ok) setMobileUsers(await res.json());
  }

  const fetchLogs = useCallback(async (page = 1, filter = logFilter) => {
    setLogLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: "50" });
    if (filter.entity) p.set("entity", filter.entity);
    if (filter.action) p.set("action", filter.action);
    if (filter.userEmail) p.set("userEmail", filter.userEmail);
    if (filter.from) p.set("from", filter.from);
    if (filter.to) p.set("to", filter.to);
    const res = await fetch(`/api/admin/audit-logs?${p}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setLogTotal(data.total);
      setLogPage(page);
    }
    setLogLoading(false);
  }, [logFilter]);

  async function fetchDeleted() {
    setDeletedLoading(true);
    const res = await fetch("/api/admin/audit-logs?action=DELETE&limit=200");
    if (res.ok) {
      const data = await res.json();
      setDeletedLogs(data.logs);
    }
    setDeletedLoading(false);
  }

  async function fixTenantData() {
    if (!fixTenantCompanyId) return;
    if (!confirm("Şirketi atanmamış (eski) tüm kayıtlar seçilen şirkete bağlanacak. Devam?")) return;
    setFixTenantLoading(true);
    setFixTenantResult(null);
    const res = await fetch("/api/admin/fix-tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: fixTenantCompanyId }),
    });
    const data = await res.json();
    setFixTenantLoading(false);
    if (res.ok) {
      const lines = Object.entries(data.updated as Record<string, number>)
        .filter(([, n]) => n > 0)
        .map(([t, n]) => `${t}: ${n} kayıt`);
      setFixTenantResult(lines.length ? lines.join(", ") : "Güncellenecek kayıt yok");
    } else {
      setFixTenantResult("Hata: " + data.error);
    }
  }

  // Companies
  async function createCompany() {
    setNewCompanyError("");
    setNewCompanySaving(true);
    const res = await fetch("/api/admin/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCompanyForm),
    });
    const data = await res.json();
    setNewCompanySaving(false);
    if (!res.ok) { setNewCompanyError(data.error); return; }
    setNewCompanyForm({ name: "", code: "", type: "firma" });
    fetchCompanies();
  }

  // Panel user actions
  async function createPanelUser() {
    setNewUserError("");
    setNewUserSaving(true);

    let companyId = newUserForm.companyId || null;

    // Yeni şirket adı girildiyse önce şirketi oluştur
    if (newUserForm.newCompanyName.trim()) {
      const code = newUserForm.newCompanyName.trim().toUpperCase().replace(/\s+/g, "").slice(0, 8) + Date.now().toString().slice(-4);
      const compRes = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newUserForm.newCompanyName.trim(), code }),
      });
      const compData = await compRes.json();
      if (!compRes.ok) { setNewUserError("Şirket oluşturulamadı: " + compData.error); setNewUserSaving(false); return; }
      companyId = compData.id;
    }

    const res = await fetch("/api/admin/panel-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newUserForm, companyId }),
    });
    const data = await res.json();
    setNewUserSaving(false);
    if (!res.ok) { setNewUserError(data.error); return; }
    setNewUserForm({ username: "", password: "", name: "", phone: "", role: "admin", companyId: "", newCompanyName: "" });
    fetchPanelUsers();
    fetchCompanies();
  }

  function startEditPanelUser(u: PanelUser) {
    setEditingPanelUser(u.id);
    setEditPanelForm({ name: u.name, phone: u.phone ?? "", role: u.role, password: "", active: u.active, companyId: u.companyId ?? "" });
  }

  async function savePanelUser(id: string) {
    const body: Record<string, unknown> = { id, name: editPanelForm.name, phone: editPanelForm.phone, role: editPanelForm.role, active: editPanelForm.active, companyId: editPanelForm.companyId || null };
    if (editPanelForm.password) body.password = editPanelForm.password;
    await fetch("/api/admin/panel-users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setEditingPanelUser(null);
    fetchPanelUsers();
  }

  async function deletePanelUser(id: string) {
    if (!confirm("Bu kullanıcıyı silmek istediğinizden emin misiniz?")) return;
    await fetch("/api/admin/panel-users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchPanelUsers();
  }

  // Mobile user actions
  function startEditMobileUser(u: MobileUser) {
    setEditingMobileUser(u.id);
    setEditMobileForm({ mobileUsername: u.mobileUsername ?? "", mobilePin: "" });
  }

  async function saveMobileUser(id: string) {
    setMobileSaving(true);
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editMobileForm }),
    });
    setEditingMobileUser(null);
    setMobileSaving(false);
    fetchMobileUsers();
  }

  const totalPages = Math.ceil(logTotal / 50);

  const TABS = [
    { key: "panel-users", label: "Panel Kullanıcıları" },
    { key: "mobile-users", label: "Mobil Kullanıcılar" },
    { key: "logs", label: "Aktivite Günlüğü" },
    { key: "deleted", label: "Silinen Veriler" },
    { key: "companies", label: "Şirketler" },
  ] as const;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Paneli</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-700 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 whitespace-nowrap transition-colors ${
              tab === t.key ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PANEL KULLANICILARI ── */}
      {tab === "panel-users" && (
        <div className="space-y-6">
          {/* Yeni kullanıcı formu */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Yeni Panel Kullanıcısı Ekle</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <input
                placeholder="Ad Soyad *"
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                placeholder="Kullanıcı Adı *"
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm font-mono"
                value={newUserForm.username}
                onChange={(e) => setNewUserForm((f) => ({ ...f, username: e.target.value }))}
              />
              <input
                placeholder="Şifre *"
                type="password"
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm((f) => ({ ...f, password: e.target.value }))}
              />
              <input
                placeholder="Telefon"
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                value={newUserForm.phone}
                onChange={(e) => setNewUserForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <select
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                value={newUserForm.role}
                onChange={(e) => setNewUserForm((f) => ({ ...f, role: e.target.value }))}
              >
                <option value="admin">Admin</option>
                <option value="firma">Firma / Muhasebeci</option>
              </select>
              <div className="flex flex-col gap-1">
                <input
                  placeholder="Yeni Şirket Adı (otomatik oluşturulur)"
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                  value={newUserForm.newCompanyName}
                  onChange={(e) => setNewUserForm((f) => ({ ...f, newCompanyName: e.target.value, companyId: "" }))}
                />
                <span className="text-xs text-gray-500">Var olan şirkete bağlamak için aşağıdan seçin:</span>
                <select
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                  value={newUserForm.companyId}
                  onChange={(e) => setNewUserForm((f) => ({ ...f, companyId: e.target.value, newCompanyName: "" }))}
                >
                  <option value="">— Mevcut Şirket Seç —</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
            </div>
            {newUserError && <p className="text-red-400 text-xs mt-2">{newUserError}</p>}
            <button
              onClick={createPanelUser}
              disabled={newUserSaving || !newUserForm.username || !newUserForm.password || !newUserForm.name}
              className="mt-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-4 py-2 rounded text-sm"
            >
              {newUserSaving ? "Kaydediliyor..." : "Kullanıcı Oluştur"}
            </button>
          </div>

          {/* Kullanıcı listesi */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-2 pr-4">Ad Soyad</th>
                  <th className="pb-2 pr-4">Kullanıcı Adı</th>
                  <th className="pb-2 pr-4">Telefon</th>
                  <th className="pb-2 pr-4">Şirket</th>
                  <th className="pb-2 pr-4">Rol</th>
                  <th className="pb-2 pr-4">Durum</th>
                  <th className="pb-2 pr-4">Oluşturulma</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {panelUsers.map((u) => (
                  <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="py-3 pr-4">
                      {editingPanelUser === u.id ? (
                        <input
                          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-36"
                          value={editPanelForm.name}
                          onChange={(e) => setEditPanelForm((f) => ({ ...f, name: e.target.value }))}
                        />
                      ) : (
                        <span className="font-medium">{u.name}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-mono text-yellow-300">{u.username}</td>
                    <td className="py-3 pr-4">
                      {editingPanelUser === u.id ? (
                        <input
                          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-32"
                          value={editPanelForm.phone}
                          placeholder="05xx..."
                          onChange={(e) => setEditPanelForm((f) => ({ ...f, phone: e.target.value }))}
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">{u.phone ?? "—"}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {editingPanelUser === u.id ? (
                        <select
                          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-40"
                          value={editPanelForm.companyId}
                          onChange={(e) => setEditPanelForm((f) => ({ ...f, companyId: e.target.value }))}
                        >
                          <option value="">— Superadmin —</option>
                          {companies.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-gray-300">
                          {u.companyId ? (companies.find(c => c.id === u.companyId)?.name ?? u.companyId) : <span className="text-yellow-400">Superadmin</span>}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {editingPanelUser === u.id ? (
                        <select
                          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                          value={editPanelForm.role}
                          onChange={(e) => setEditPanelForm((f) => ({ ...f, role: e.target.value }))}
                        >
                          <option value="admin">Admin</option>
                          <option value="firma">Firma</option>
                          <option value="viewer">Sadece Görüntüle</option>
                        </select>
                      ) : (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-purple-900 text-purple-300" : "bg-gray-700 text-gray-400"}`}>
                          {u.role === "admin" ? "Admin" : "Firma"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {editingPanelUser === u.id ? (
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editPanelForm.active}
                            onChange={(e) => setEditPanelForm((f) => ({ ...f, active: e.target.checked }))}
                          />
                          Aktif
                        </label>
                      ) : (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.active ? "bg-green-900 text-green-300" : "bg-gray-700 text-gray-400"}`}>
                          {u.active ? "Aktif" : "Pasif"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="py-3">
                      {editingPanelUser === u.id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            placeholder="Yeni şifre (boş = değiştirme)"
                            type="password"
                            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs w-40"
                            value={editPanelForm.password}
                            onChange={(e) => setEditPanelForm((f) => ({ ...f, password: e.target.value }))}
                          />
                          <button
                            onClick={() => savePanelUser(u.id)}
                            className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded"
                          >
                            Kaydet
                          </button>
                          <button
                            onClick={() => setEditingPanelUser(null)}
                            className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1"
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditPanelUser(u)}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => deletePanelUser(u.id)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Sil
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {panelUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      Henüz panel kullanıcısı yok. Yukarıdan ekleyebilirsiniz.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">
            Not: .env dosyasındaki ADMIN1_USERNAME/PASSWORD ile tanımlı hesaplar bu listede görünmez, onlar her zaman aktiftir.
          </p>
        </div>
      )}

      {/* ── MOBİL KULLANICILAR ── */}
      {tab === "mobile-users" && (
        <div>
          <p className="text-sm text-gray-400 mb-4">
            Mobil uygulamaya erişimi olan şöförler. Kullanıcı adı veya PIN değiştirebilirsiniz.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-2 pr-4">Şöför</th>
                  <th className="pb-2 pr-4">Telefon</th>
                  <th className="pb-2 pr-4">Kullanıcı Adı</th>
                  <th className="pb-2 pr-4">PIN</th>
                  <th className="pb-2 pr-4">Durum</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {mobileUsers.map((u) => (
                  <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="py-3 pr-4 font-medium">{u.name}</td>
                    <td className="py-3 pr-4 text-gray-400">{u.phone ?? "—"}</td>
                    <td className="py-3 pr-4">
                      {editingMobileUser === u.id ? (
                        <input
                          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-32"
                          value={editMobileForm.mobileUsername}
                          onChange={(e) => setEditMobileForm((f) => ({ ...f, mobileUsername: e.target.value }))}
                        />
                      ) : (
                        <span className="font-mono text-yellow-300">{u.mobileUsername ?? "—"}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {editingMobileUser === u.id ? (
                        <input
                          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-24 font-mono"
                          value={editMobileForm.mobilePin}
                          onChange={(e) => setEditMobileForm((f) => ({ ...f, mobilePin: e.target.value }))}
                          placeholder="PIN"
                        />
                      ) : (
                        <span className="font-mono text-orange-300">{u.mobilePin ?? "—"}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === "active" ? "bg-green-900 text-green-300" : "bg-gray-700 text-gray-400"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {editingMobileUser === u.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveMobileUser(u.id)}
                            disabled={mobileSaving}
                            className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded disabled:opacity-50"
                          >
                            Kaydet
                          </button>
                          <button
                            onClick={() => setEditingMobileUser(null)}
                            className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1"
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditMobileUser(u)}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Düzenle
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {mobileUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">Mobil kullanıcı yok</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── AKTİVİTE GÜNLÜĞÜ ── */}
      {tab === "logs" && (
        <div>
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
              value={logFilter.entity}
              onChange={(e) => setLogFilter((f) => ({ ...f, entity: e.target.value }))}
            >
              {ENTITIES.map((e) => <option key={e} value={e}>{e || "Tüm Varlıklar"}</option>)}
            </select>
            <select
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
              value={logFilter.action}
              onChange={(e) => setLogFilter((f) => ({ ...f, action: e.target.value }))}
            >
              {ACTIONS.map((a) => <option key={a} value={a}>{a || "Tüm İşlemler"}</option>)}
            </select>
            <input
              type="text"
              placeholder="Kullanıcı email..."
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm w-48"
              value={logFilter.userEmail}
              onChange={(e) => setLogFilter((f) => ({ ...f, userEmail: e.target.value }))}
            />
            <input type="date" className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm" value={logFilter.from} onChange={(e) => setLogFilter((f) => ({ ...f, from: e.target.value }))} />
            <input type="date" className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm" value={logFilter.to} onChange={(e) => setLogFilter((f) => ({ ...f, to: e.target.value }))} />
            <button onClick={() => fetchLogs(1, logFilter)} className="bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded text-sm">
              Filtrele
            </button>
            <span className="text-gray-400 text-sm self-center">{logTotal} kayıt</span>
          </div>

          {logLoading ? (
            <div className="text-center py-8 text-gray-400">Yükleniyor...</div>
          ) : (
            <>
              <div className="space-y-1">
                {logs.map((log) => (
                  <div key={log.id} className="bg-gray-800/50 rounded border border-gray-700/50">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-700/30 transition-colors"
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    >
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${ACTION_COLORS[log.action] ?? "bg-gray-700 text-gray-300"}`}>
                        {log.action}
                      </span>
                      <span className="text-gray-300 font-medium text-sm">{log.entity}</span>
                      <span className="text-gray-400 text-sm flex-1">{log.entityName ?? log.entityId ?? "—"}</span>
                      <span className="text-gray-500 text-xs">{log.userEmail}</span>
                      <span className="text-gray-500 text-xs">{new Date(log.createdAt).toLocaleString("tr-TR")}</span>
                    </button>
                    {expandedLog === log.id && log.changes && (
                      <div className="px-4 pb-3 pt-1 border-t border-gray-700/50">
                        <pre className="text-xs text-gray-300 bg-gray-900 rounded p-3 overflow-x-auto max-h-64">{log.changes}</pre>
                      </div>
                    )}
                  </div>
                ))}
                {logs.length === 0 && <div className="text-center py-8 text-gray-500">Kayıt bulunamadı</div>}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2 mt-4 justify-center">
                  <button disabled={logPage === 1} onClick={() => fetchLogs(logPage - 1)} className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-sm">← Önceki</button>
                  <span className="text-sm text-gray-400">{logPage} / {totalPages}</span>
                  <button disabled={logPage === totalPages} onClick={() => fetchLogs(logPage + 1)} className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-sm">Sonraki →</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── ŞİRKETLER ── */}
      {tab === "companies" && (
        <div className="space-y-6">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Yeni Şirket Ekle</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <input
                placeholder="Şirket Adı *"
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                value={newCompanyForm.name}
                onChange={(e) => setNewCompanyForm((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                placeholder="Kod * (örn: MT2024)"
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm font-mono"
                value={newCompanyForm.code}
                onChange={(e) => setNewCompanyForm((f) => ({ ...f, code: e.target.value }))}
              />
              <select
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                value={newCompanyForm.type}
                onChange={(e) => setNewCompanyForm((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="firma">Servis Firması</option>
                <option value="okul">Okul</option>
              </select>
            </div>
            {newCompanyError && <p className="text-red-400 text-xs mt-2">{newCompanyError}</p>}
            <button
              onClick={createCompany}
              disabled={newCompanySaving || !newCompanyForm.name || !newCompanyForm.code}
              className="mt-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-4 py-2 rounded text-sm"
            >
              {newCompanySaving ? "Kaydediliyor..." : "Şirket Oluştur"}
            </button>
          </div>

          {/* Eski veriyi geçir */}
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-yellow-300 mb-1">Eski Veriyi Şirkete Bağla</h2>
            <p className="text-xs text-yellow-500 mb-3">
              Sistemde şirketsiz (eski) kayıtlar varsa, bu araçla hepsini seçilen şirkete bağlayabilirsiniz. Yalnızca bir kez çalıştırın.
            </p>
            <div className="flex gap-3 items-center flex-wrap">
              <select
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                value={fixTenantCompanyId}
                onChange={(e) => setFixTenantCompanyId(e.target.value)}
              >
                <option value="">— Şirket Seç —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
              <button
                onClick={fixTenantData}
                disabled={fixTenantLoading || !fixTenantCompanyId}
                className="bg-yellow-700 hover:bg-yellow-600 disabled:opacity-40 px-4 py-2 rounded text-sm"
              >
                {fixTenantLoading ? "Çalışıyor..." : "Eski Veriyi Geçir"}
              </button>
              {fixTenantResult && (
                <span className="text-xs text-yellow-300">{fixTenantResult}</span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-2 pr-4">ID</th>
                  <th className="pb-2 pr-4">Şirket Adı</th>
                  <th className="pb-2 pr-4">Kod</th>
                  <th className="pb-2 pr-4">Tip</th>
                  <th className="pb-2 pr-4">Durum</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="py-3 pr-4 font-mono text-xs text-gray-500">{c.id}</td>
                    <td className="py-3 pr-4 font-medium">{c.name}</td>
                    <td className="py-3 pr-4 font-mono text-yellow-300">{c.code}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.type === "okul" ? "bg-indigo-900 text-indigo-300" : "bg-gray-700 text-gray-400"}`}>
                        {c.type === "okul" ? "Okul" : "Firma"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.active ? "bg-green-900 text-green-300" : "bg-gray-700 text-gray-400"}`}>
                        {c.active ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">Henüz şirket yok. Yukarıdan ekleyebilirsiniz.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SİLİNEN VERİLER ── */}
      {tab === "deleted" && (
        <div>
          <p className="text-sm text-gray-400 mb-4">Son 200 silme işlemi. Tıklayarak detayları görün.</p>
          {deletedLoading ? (
            <div className="text-center py-8 text-gray-400">Yükleniyor...</div>
          ) : (
            <div className="space-y-1">
              {deletedLogs.map((log) => (
                <div key={log.id} className="bg-gray-800/50 rounded border border-gray-700/50">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-700/30 transition-colors"
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  >
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-600 text-gray-300">{log.entity}</span>
                    <span className="text-red-300 text-sm flex-1">{log.entityName ?? log.entityId ?? "—"}</span>
                    <span className="text-gray-500 text-xs">{log.userEmail}</span>
                    <span className="text-gray-500 text-xs">{new Date(log.createdAt).toLocaleString("tr-TR")}</span>
                  </button>
                  {expandedLog === log.id && (
                    <div className="px-4 pb-3 pt-1 border-t border-gray-700/50">
                      {log.changes
                        ? <pre className="text-xs text-gray-300 bg-gray-900 rounded p-3 overflow-x-auto max-h-64">{log.changes}</pre>
                        : <p className="text-xs text-gray-500 italic">Detay kaydedilmemiş</p>
                      }
                    </div>
                  )}
                </div>
              ))}
              {deletedLogs.length === 0 && <div className="text-center py-8 text-gray-500">Silinen veri yok</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

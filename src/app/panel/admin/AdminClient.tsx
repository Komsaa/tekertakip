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

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-900 text-green-300",
  UPDATE: "bg-blue-900 text-blue-300",
  DELETE: "bg-red-900 text-red-300",
};

const ENTITIES = ["", "Job", "Driver", "Vehicle", "FuelEntry", "Client", "Invoice"];
const ACTIONS = ["", "CREATE", "UPDATE", "DELETE"];

export default function AdminClient() {
  const [tab, setTab] = useState<"users" | "logs" | "deleted">("users");

  // Mobile users
  const [users, setUsers] = useState<MobileUser[]>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ mobileUsername: "", mobilePin: "" });
  const [userSaving, setUserSaving] = useState(false);

  // Audit logs
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [logFilter, setLogFilter] = useState({ entity: "", action: "", userEmail: "", from: "", to: "" });
  const [logLoading, setLogLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Deleted data (audit logs with action=DELETE)
  const [deletedLogs, setDeletedLogs] = useState<AuditLog[]>([]);
  const [deletedLoading, setDeletedLoading] = useState(false);

  useEffect(() => {
    if (tab === "users") fetchUsers();
    if (tab === "logs") fetchLogs();
    if (tab === "deleted") fetchDeleted();
  }, [tab]);

  async function fetchUsers() {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
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

  function startEdit(u: MobileUser) {
    setEditingUser(u.id);
    setEditForm({ mobileUsername: u.mobileUsername ?? "", mobilePin: u.mobilePin ?? "" });
  }

  async function saveUser(id: string) {
    setUserSaving(true);
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, mobileUsername: editForm.mobileUsername, mobilePin: editForm.mobilePin }),
    });
    setEditingUser(null);
    setUserSaving(false);
    fetchUsers();
  }

  function applyLogFilter() {
    fetchLogs(1, logFilter);
  }

  const totalPages = Math.ceil(logTotal / 50);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Paneli</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {(["users", "logs", "deleted"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
              tab === t ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            {t === "users" ? "Mobil Kullanıcılar" : t === "logs" ? "Aktivite Günlüğü" : "Silinen Veriler"}
          </button>
        ))}
      </div>

      {/* USERS TAB */}
      {tab === "users" && (
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
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="py-3 pr-4 font-medium">{u.name}</td>
                    <td className="py-3 pr-4 text-gray-400">{u.phone ?? "—"}</td>
                    <td className="py-3 pr-4">
                      {editingUser === u.id ? (
                        <input
                          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-32"
                          value={editForm.mobileUsername}
                          onChange={(e) => setEditForm((f) => ({ ...f, mobileUsername: e.target.value }))}
                        />
                      ) : (
                        <span className="font-mono text-yellow-300">{u.mobileUsername ?? "—"}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {editingUser === u.id ? (
                        <input
                          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-24 font-mono"
                          value={editForm.mobilePin}
                          onChange={(e) => setEditForm((f) => ({ ...f, mobilePin: e.target.value }))}
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
                      {editingUser === u.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveUser(u.id)}
                            disabled={userSaving}
                            className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded disabled:opacity-50"
                          >
                            Kaydet
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1"
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(u)}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Düzenle
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      Mobil kullanıcı yok
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LOGS TAB */}
      {tab === "logs" && (
        <div>
          {/* Filters */}
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
            <input
              type="date"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
              value={logFilter.from}
              onChange={(e) => setLogFilter((f) => ({ ...f, from: e.target.value }))}
            />
            <input
              type="date"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
              value={logFilter.to}
              onChange={(e) => setLogFilter((f) => ({ ...f, to: e.target.value }))}
            />
            <button
              onClick={applyLogFilter}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded text-sm"
            >
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
                      <span className="text-gray-500 text-xs">
                        {new Date(log.createdAt).toLocaleString("tr-TR")}
                      </span>
                    </button>
                    {expandedLog === log.id && log.changes && (
                      <div className="px-4 pb-3 pt-1 border-t border-gray-700/50">
                        <pre className="text-xs text-gray-300 bg-gray-900 rounded p-3 overflow-x-auto max-h-64">
                          {log.changes}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">Kayıt bulunamadı</div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2 mt-4 justify-center">
                  <button
                    disabled={logPage === 1}
                    onClick={() => fetchLogs(logPage - 1)}
                    className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-sm"
                  >
                    ← Önceki
                  </button>
                  <span className="text-sm text-gray-400">
                    {logPage} / {totalPages}
                  </span>
                  <button
                    disabled={logPage === totalPages}
                    onClick={() => fetchLogs(logPage + 1)}
                    className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-sm"
                  >
                    Sonraki →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* DELETED TAB */}
      {tab === "deleted" && (
        <div>
          <p className="text-sm text-gray-400 mb-4">
            Silinen veriler — son 200 silme işlemi. Tıklayarak detayları görebilirsiniz.
          </p>
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
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-600 text-gray-300">
                      {log.entity}
                    </span>
                    <span className="text-red-300 text-sm flex-1">{log.entityName ?? log.entityId ?? "—"}</span>
                    <span className="text-gray-500 text-xs">{log.userEmail}</span>
                    <span className="text-gray-500 text-xs">
                      {new Date(log.createdAt).toLocaleString("tr-TR")}
                    </span>
                  </button>
                  {expandedLog === log.id && (
                    <div className="px-4 pb-3 pt-1 border-t border-gray-700/50">
                      {log.changes ? (
                        <pre className="text-xs text-gray-300 bg-gray-900 rounded p-3 overflow-x-auto max-h-64">
                          {log.changes}
                        </pre>
                      ) : (
                        <p className="text-xs text-gray-500 italic">Detay kaydedilmemiş</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {deletedLogs.length === 0 && (
                <div className="text-center py-8 text-gray-500">Silinen veri yok</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

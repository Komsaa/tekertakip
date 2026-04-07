"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  FileText, Plus, Building2, TrendingUp, X, Save, Trash2,
  CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp, Receipt,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Client = {
  id: string; name: string; vkn?: string | null; taxOffice?: string | null;
  address?: string | null; email?: string | null; phone?: string | null;
  unitPrice: number; paymentTermDays: number;
  kdvRate: number; tevkifatRate: number; notes?: string | null;
};

type Invoice = {
  id: string; invoiceNo: string; clientId: string;
  client: { id: string; name: string };
  issueDate: string; dueDate: string;
  periodStart: string; periodEnd: string;
  tripCount: number; unitPrice: number; subtotal: number;
  kdvRate: number; kdvAmount: number;
  tevkifatRate: number; tevkifatAmount: number;
  totalAmount: number; payableAmount: number;
  status: string; paidAt?: string; paidAmount: number;
  notes?: string;
};

type ForecastData = {
  pending: (Invoice & { client: { name: string } })[];
  byIssuedMonth: Record<string, { issued: number; collected: number }>;
  byDueMonth: Record<string, number>;
  totalPending: number; totalOverdue: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TRY = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " ₺";
const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const MONTHS_FULL = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

function statusBadge(status: string) {
  if (status === "odendi") return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Ödendi</span>;
  if (status === "gecikti") return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Gecikti</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Bekliyor</span>;
}

// ─── Client Form Modal ────────────────────────────────────────────────────────

function ClientModal({ client, onClose, onSaved }: {
  client: Client | null; onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!client;
  const [form, setForm] = useState({
    name: client?.name ?? "",
    vkn: client?.vkn ?? "",
    taxOffice: client?.taxOffice ?? "",
    address: client?.address ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    unitPrice: String(client?.unitPrice ?? ""),
    paymentTermDays: String(client?.paymentTermDays ?? "30"),
    kdvRate: String(client?.kdvRate ?? "20"),
    tevkifatRate: String(client?.tevkifatRate ?? "50"),
    notes: client?.notes ?? "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Firma adı zorunlu"); return; }
    setLoading(true);
    try {
      const url = isEdit ? `/api/clients/${client!.id}` : "/api/clients";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? "Firma güncellendi" : "Firma eklendi");
      onSaved();
    } catch { toast.error("Hata oluştu"); }
    finally { setLoading(false); }
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{isEdit ? "Firma Düzenle" : "Yeni Firma"}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Firma Adı *</label>
            <input className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={form.name} onChange={e => set("name", e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">VKN</label>
              <input className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={form.vkn} onChange={e => set("vkn", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Vergi Dairesi</label>
              <input className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={form.taxOffice} onChange={e => set("taxOffice", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Adres</label>
            <input className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={form.address} onChange={e => set("address", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Telefon</label>
              <input className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={form.phone} onChange={e => set("phone", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">E-posta</label>
              <input className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={form.email} onChange={e => set("email", e.target.value)} />
            </div>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Fatura Ayarları</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Sefer Birim Fiyatı (₺)</label>
                <input type="number" className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={form.unitPrice} onChange={e => set("unitPrice", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Vade (gün)</label>
                <input type="number" className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={form.paymentTermDays} onChange={e => set("paymentTermDays", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">KDV Oranı (%)</label>
                <input type="number" className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={form.kdvRate} onChange={e => set("kdvRate", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Tevkifat Oranı (%)</label>
                <input type="number" className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={form.tevkifatRate} onChange={e => set("tevkifatRate", e.target.value)} />
                <p className="text-xs text-slate-400 mt-0.5">KDV'nin tevkifat oranı (personel taşıma = 50)</p>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notlar</label>
            <textarea className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none" rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">İptal</button>
            <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
              <Save className="w-4 h-4" />
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Invoice Create Modal ─────────────────────────────────────────────────────

function InvoiceModal({ client, month, year, onClose, onSaved }: {
  client: Client; month: number; year: number; onClose: () => void; onSaved: () => void;
}) {
  const [tripCount, setTripCount] = useState(0);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [unitPrice, setUnitPrice] = useState(String(client.unitPrice));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const periodStart = new Date(year, month - 1, 1).toISOString().split("T")[0];
  const periodEnd = new Date(year, month, 0).toISOString().split("T")[0];
  const dueDate = new Date(new Date(issueDate).getTime() + client.paymentTermDays * 86400000).toISOString().split("T")[0];

  const subtotal = tripCount * parseFloat(unitPrice || "0");
  const kdvAmount = subtotal * (client.kdvRate / 100);
  const tevkifatAmount = kdvAmount * (client.tevkifatRate / 100);
  const totalAmount = subtotal + kdvAmount;
  const payableAmount = totalAmount - tevkifatAmount;

  useEffect(() => {
    fetch(`/api/clients/${client.id}/trip-summary?month=${month}&year=${year}`)
      .then(r => r.json())
      .then(d => setTripCount(d.tripCount ?? 0))
      .finally(() => setLoadingTrips(false));
    fetch("/api/invoices/next-no").then(r => r.json()).then(d => setInvoiceNo(d.invoiceNo));
  }, [client.id, month, year]);

  async function handleCreate() {
    if (!invoiceNo.trim()) { toast.error("Fatura no zorunlu"); return; }
    if (tripCount === 0) { toast.error("Sefer sayısı 0, fatura kesilemez"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceNo, clientId: client.id, issueDate, dueDate, periodStart, periodEnd, tripCount, unitPrice: parseFloat(unitPrice), kdvRate: client.kdvRate, tevkifatRate: client.tevkifatRate, notes }),
      });
      if (!res.ok) throw new Error();
      toast.success("Fatura oluşturuldu!");
      onSaved();
    } catch { toast.error("Hata oluştu"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Fatura Kes</h2>
            <p className="text-sm text-slate-500">{client.name} · {MONTHS_FULL[month - 1]} {year}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Sefer özeti */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Dönem Sefer Özeti</p>
            {loadingTrips ? (
              <p className="text-slate-400 text-sm">Seferler hesaplanıyor...</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="text-3xl font-black text-[#DC2626]">{tripCount}</div>
                <div>
                  <p className="font-semibold text-slate-700">sefer</p>
                  <p className="text-xs text-slate-500">{periodStart} – {periodEnd}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500">Fatura No</label>
              <input className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Sefer Sayısı</label>
              <input type="number" className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={tripCount} onChange={e => setTripCount(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Fatura Tarihi</label>
              <input type="date" className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Son Ödeme ({client.paymentTermDays} gün)</label>
              <input type="date" className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50" value={dueDate} readOnly />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Birim Fiyat (₺)</label>
              <input type="number" className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />
            </div>
          </div>

          {/* Hesaplama özeti */}
          <div className="bg-[#1B2437] rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>{tripCount} sefer × {TRY(parseFloat(unitPrice || "0"))}</span>
              <span className="text-white font-semibold">{TRY(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>KDV %{client.kdvRate}</span>
              <span className="text-white">{TRY(kdvAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>KDV Tevkifat %{client.tevkifatRate}</span>
              <span className="text-orange-400">-{TRY(tevkifatAmount)}</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between">
              <span className="text-white font-semibold">Ödenecek Tutar</span>
              <span className="text-[#DC2626] font-black text-lg">{TRY(payableAmount)}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Notlar</label>
            <textarea className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">İptal</button>
            <button onClick={handleCreate} disabled={loading || tripCount === 0} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
              <Receipt className="w-4 h-4" />
              {loading ? "Oluşturuluyor..." : "Fatura Oluştur"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FaturalarClient({
  clients: initialClients,
  invoices: initialInvoices,
}: {
  clients: Client[];
  invoices: Invoice[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"firmalar" | "fatura-kes" | "faturalar" | "nakit-akisi">("fatura-kes");
  const [clients, setClients] = useState(initialClients);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [clientModal, setClientModal] = useState<Client | null | "new">(null);
  const [invoiceModal, setInvoiceModal] = useState<Client | null>(null);

  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; skippedNoTrips: number; skippedExists: number } | null>(null);

  async function refreshClients() {
    const r = await fetch("/api/clients");
    setClients(await r.json());
    setClientModal(null);
    router.refresh();
  }

  async function refreshInvoices() {
    const r = await fetch("/api/invoices");
    setInvoices(await r.json());
    setInvoiceModal(null);
    router.refresh();
  }

  async function loadForecast() {
    const r = await fetch("/api/invoices/forecast");
    setForecast(await r.json());
  }

  useEffect(() => { if (tab === "nakit-akisi") loadForecast(); }, [tab]);

  async function markPaid(inv: Invoice) {
    const today = new Date().toISOString().split("T")[0];
    const res = await fetch(`/api/invoices/${inv.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "odendi", paidAt: today, paidAmount: inv.payableAmount }),
    });
    if (res.ok) { toast.success("Ödendi olarak işaretlendi"); refreshInvoices(); }
    else toast.error("Hata");
  }

  async function deleteInvoice(id: string) {
    if (!confirm("Bu faturayı sil?")) return;
    const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Fatura silindi"); refreshInvoices(); }
    else toast.error("Silinemedi");
  }

  async function bulkCreateInvoices() {
    if (!confirm(`${MONTHS_FULL[selMonth - 1]} ${selYear} dönemi için tüm firmalara otomatik fatura oluşturulsun mu?`)) return;
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/invoices/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selMonth, year: selYear, issueDate: today }),
      });
      const data = await res.json();
      setBulkResult({ created: data.created, skippedNoTrips: data.skippedNoTrips, skippedExists: data.skippedExists });
      if (data.created > 0) { toast.success(`${data.created} fatura oluşturuldu`); refreshInvoices(); }
      else toast("Oluşturulacak yeni fatura bulunamadı");
    } catch { toast.error("Hata oluştu"); }
    finally { setBulkLoading(false); }
  }

  async function deleteClient(id: string) {
    if (!confirm("Bu firmayı sil?")) return;
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Firma silindi"); refreshClients(); }
    else toast.error("Silinemedi — faturası olabilir");
  }

  const tabStyle = (t: string) =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? "bg-[#DC2626] text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`;

  // Ay seçim yılları
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Faturalar</h1>
          <p className="text-slate-500 text-sm mt-0.5">Sefer sayacı · Fatura kes · Tahsilat takibi</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button className={tabStyle("fatura-kes")} onClick={() => setTab("fatura-kes")}>Fatura Kes</button>
        <button className={tabStyle("faturalar")} onClick={() => setTab("faturalar")}>
          Faturalar {invoices.length > 0 && <span className="ml-1 bg-white/30 text-xs px-1.5 py-0.5 rounded-full">{invoices.length}</span>}
        </button>
        <button className={tabStyle("nakit-akisi")} onClick={() => setTab("nakit-akisi")}>Nakit Akışı</button>
        <button className={tabStyle("firmalar")} onClick={() => setTab("firmalar")}>Firmalar</button>
      </div>

      {/* ── Tab: Fatura Kes ─────────────────────────────── */}
      {tab === "fatura-kes" && (
        <div>
          {/* Ay/yıl seçici */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <select
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold bg-white"
              value={selMonth}
              onChange={e => { setSelMonth(parseInt(e.target.value)); setBulkResult(null); }}
            >
              {MONTHS_FULL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold bg-white"
              value={selYear}
              onChange={e => { setSelYear(parseInt(e.target.value)); setBulkResult(null); }}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-slate-400 text-sm">dönemi</span>
            <button
              onClick={bulkCreateInvoices}
              disabled={bulkLoading || clients.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#1B2437] hover:bg-[#2a3a55] disabled:opacity-50 text-white rounded-xl text-sm font-semibold ml-auto"
            >
              <Receipt className="w-4 h-4" />
              {bulkLoading ? "Oluşturuluyor..." : "Tümüne Fatura Kes"}
            </button>
          </div>

          {/* Toplu fatura sonucu */}
          {bulkResult && (
            <div className="flex gap-3 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm">
              <span className="text-green-700 font-semibold">✓ {bulkResult.created} oluşturuldu</span>
              {bulkResult.skippedExists > 0 && <span className="text-slate-400">· {bulkResult.skippedExists} zaten vardı</span>}
              {bulkResult.skippedNoTrips > 0 && <span className="text-slate-400">· {bulkResult.skippedNoTrips} sefer yok</span>}
            </div>
          )}

          {clients.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Henüz firma eklenmemiş</p>
              <button onClick={() => { setClientModal("new"); setTab("firmalar"); }} className="mt-3 text-[#DC2626] font-semibold text-sm hover:underline">Firma ekle →</button>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.map(c => (
                <ClientTripCard
                  key={c.id}
                  client={c}
                  month={selMonth}
                  year={selYear}
                  onInvoice={() => setInvoiceModal(c)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Faturalar ──────────────────────────────── */}
      {tab === "faturalar" && (
        <div>
          {invoices.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Henüz fatura yok</p>
              <button onClick={() => setTab("fatura-kes")} className="mt-3 text-[#DC2626] font-semibold text-sm hover:underline">Fatura kes →</button>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map(inv => (
                <div key={inv.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-400">{inv.invoiceNo}</span>
                        {statusBadge(inv.status)}
                      </div>
                      <p className="font-bold text-slate-800 truncate">{inv.client.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {inv.tripCount} sefer · {new Date(inv.issueDate).toLocaleDateString("tr-TR")} · Vade: {new Date(inv.dueDate).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-black text-[#DC2626]">{TRY(inv.payableAmount)}</p>
                      <p className="text-xs text-slate-400">+KDV {TRY(inv.totalAmount)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
                    {inv.status !== "odendi" && (
                      <button onClick={() => markPaid(inv)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ödendi
                      </button>
                    )}
                    <button onClick={() => deleteInvoice(inv.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg ml-auto">
                      <Trash2 className="w-3.5 h-3.5" /> Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Nakit Akışı ────────────────────────────── */}
      {tab === "nakit-akisi" && (
        <div>
          {!forecast ? (
            <div className="text-center py-16 text-slate-400">Yükleniyor...</div>
          ) : (
            <div className="space-y-6">
              {/* Özet kartlar */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#DC2626] rounded-2xl p-5 text-white">
                  <p className="text-sm opacity-80">Toplam Bekleyen</p>
                  <p className="text-3xl font-black mt-1">{TRY(forecast.totalPending)}</p>
                  <p className="text-xs opacity-70 mt-1">{forecast.pending.length} fatura</p>
                </div>
                <div className="bg-[#1B2437] rounded-2xl p-5 text-white">
                  <p className="text-sm opacity-80">Gecikmiş</p>
                  <p className="text-3xl font-black mt-1">{TRY(forecast.totalOverdue)}</p>
                  <p className="text-xs opacity-70 mt-1">vadesi geçmiş</p>
                </div>
              </div>

              {/* Aylık özet */}
              {Object.keys(forecast.byIssuedMonth).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Aylık Kesilen / Tahsil</h3>
                  <div className="space-y-2">
                    {Object.entries(forecast.byIssuedMonth).sort((a, b) => a[0].localeCompare(b[0])).map(([key, val]) => {
                      const [y, m] = key.split("-");
                      const ratio = val.issued > 0 ? val.collected / val.issued : 0;
                      return (
                        <div key={key} className="bg-white rounded-xl border border-slate-100 p-3">
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="font-semibold text-slate-700">{MONTHS_FULL[parseInt(m) - 1]} {y}</span>
                            <span className="text-slate-400">Kesilen: <strong className="text-slate-700">{TRY(val.issued)}</strong></span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span className="text-green-600 font-semibold">Tahsil: {TRY(val.collected)}</span>
                            <span>Kalan: {TRY(val.issued - val.collected)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Vadeye göre beklenen */}
              {Object.keys(forecast.byDueMonth).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Vadelerine Göre Beklenen Tahsilat</h3>
                  <div className="space-y-2">
                    {Object.entries(forecast.byDueMonth).sort((a, b) => a[0].localeCompare(b[0])).map(([key, amount]) => {
                      const [y, m] = key.split("-");
                      const isThisMonth = parseInt(y) === now.getFullYear() && parseInt(m) === now.getMonth() + 1;
                      return (
                        <div key={key} className={`rounded-xl p-4 flex justify-between items-center ${isThisMonth ? "bg-[#DC2626]/10 border border-[#DC2626]/30" : "bg-white border border-slate-100"}`}>
                          <span className={`font-semibold text-sm ${isThisMonth ? "text-[#DC2626]" : "text-slate-700"}`}>
                            {MONTHS_FULL[parseInt(m) - 1]} {y} {isThisMonth && "· Bu ay"}
                          </span>
                          <span className="font-black text-lg text-slate-800">{TRY(amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bekleyen fatura listesi */}
              {forecast.pending.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Bekleyen Faturalar</h3>
                  <div className="space-y-2">
                    {forecast.pending.map(inv => {
                      const overdue = new Date(inv.dueDate) < now;
                      return (
                        <div key={inv.id} className={`bg-white rounded-xl border p-3 flex items-center gap-3 ${overdue ? "border-red-200" : "border-slate-100"}`}>
                          {overdue ? <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" /> : <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-slate-800 truncate">{inv.client.name}</p>
                            <p className="text-xs text-slate-400">{inv.invoiceNo} · Vade: {new Date(inv.dueDate).toLocaleDateString("tr-TR")}</p>
                          </div>
                          <p className={`font-bold text-sm flex-shrink-0 ${overdue ? "text-red-600" : "text-slate-700"}`}>{TRY(inv.payableAmount - inv.paidAmount)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Firmalar ───────────────────────────────── */}
      {tab === "firmalar" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setClientModal("new")} className="flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-xl text-sm font-semibold">
              <Plus className="w-4 h-4" /> Firma Ekle
            </button>
          </div>
          {clients.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Henüz firma eklenmemiş</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {clients.map(c => (
                <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{c.name}</p>
                      {c.vkn && <p className="text-xs text-slate-400">VKN: {c.vkn}</p>}
                      <div className="flex gap-3 mt-2 text-xs text-slate-500">
                        <span className="bg-slate-100 px-2 py-1 rounded-lg font-semibold">{TRY(c.unitPrice)}/sefer</span>
                        <span className="bg-slate-100 px-2 py-1 rounded-lg">{c.paymentTermDays} gün vade</span>
                        <span className="bg-slate-100 px-2 py-1 rounded-lg">KDV %{c.kdvRate}</span>
                        <span className="bg-slate-100 px-2 py-1 rounded-lg">Tevkifat %{c.tevkifatRate}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setClientModal(c)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteClient(c.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {clientModal !== null && (
        <ClientModal
          client={clientModal === "new" ? null : clientModal as Client}
          onClose={() => setClientModal(null)}
          onSaved={refreshClients}
        />
      )}
      {invoiceModal && (
        <InvoiceModal
          client={invoiceModal}
          month={selMonth}
          year={selYear}
          onClose={() => setInvoiceModal(null)}
          onSaved={refreshInvoices}
        />
      )}
    </div>
  );
}

// ─── ClientTripCard (sefer sayacı) ────────────────────────────────────────────

function ClientTripCard({ client, month, year, onInvoice }: {
  client: Client; month: number; year: number; onInvoice: () => void;
}) {
  const [tripCount, setTripCount] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/clients/${client.id}/trip-summary?month=${month}&year=${year}`);
    const d = await r.json();
    setTripCount(d.tripCount ?? 0);
  }, [client.id, month, year]);

  useEffect(() => { load(); }, [load]);

  const subtotal = (tripCount ?? 0) * client.unitPrice;
  const kdvAmount = subtotal * (client.kdvRate / 100);
  const tevkifatAmount = kdvAmount * (client.tevkifatRate / 100);
  const payableAmount = subtotal + kdvAmount - tevkifatAmount;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 truncate">{client.name}</p>
          <p className="text-xs text-slate-400">{TRY(client.unitPrice)}/sefer · {client.paymentTermDays} gün vade</p>
        </div>
        <div className="text-center flex-shrink-0">
          {tripCount === null ? (
            <div className="w-12 h-8 bg-slate-100 rounded-lg animate-pulse" />
          ) : (
            <span className="text-2xl font-black text-[#DC2626]">{tripCount}</span>
          )}
          <p className="text-xs text-slate-400">sefer</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-black text-slate-800">{TRY(payableAmount)}</p>
          <p className="text-xs text-slate-400">ödenecek</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={onInvoice}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-semibold"
          >
            <Receipt className="w-3.5 h-3.5" /> Fatura Kes
          </button>
          <button onClick={() => setExpanded(e => !e)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} Detay
          </button>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-50 pt-3 grid grid-cols-4 gap-2 text-xs">
          <div className="bg-slate-50 rounded-xl p-2 text-center">
            <p className="text-slate-500">Ara Toplam</p>
            <p className="font-bold text-slate-700">{TRY(subtotal)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2 text-center">
            <p className="text-slate-500">KDV %{client.kdvRate}</p>
            <p className="font-bold text-slate-700">{TRY(kdvAmount)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2 text-center">
            <p className="text-slate-500">Tevkifat %{client.tevkifatRate}</p>
            <p className="font-bold text-orange-600">-{TRY(tevkifatAmount)}</p>
          </div>
          <div className="bg-[#DC2626]/10 rounded-xl p-2 text-center">
            <p className="text-[#DC2626]">Ödenecek</p>
            <p className="font-black text-[#DC2626]">{TRY(payableAmount)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  FileText, Plus, Building2, TrendingUp, X, Save, Trash2,
  CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp,
  Upload, MapPin, Fuel, Banknote, ExternalLink,
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
  route?: { id: string; name: string } | null;
  routeId?: string | null;
  pdfUrl?: string | null;
  issueDate: string; dueDate: string;
  periodStart: string; periodEnd: string;
  tripCount: number; unitPrice: number; subtotal: number;
  kdvRate: number; kdvAmount: number;
  tevkifatRate: number; tevkifatAmount: number;
  totalAmount: number; payableAmount: number;
  status: string; paidAt?: string; paidAmount: number;
  notes?: string;
};

type Route = {
  id: string;
  name: string;
  driver?: { name: string } | null;
};

type RouteEarning = {
  routeId: string;
  routeName: string;
  driver: { id: string; name: string } | null;
  vehicle: { id: string; plate: string } | null;
  revenue: number;
  invoiceCount: number;
  fuelCost: number;
  salaryCost: number;
  totalCost: number;
  netProfit: number;
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

// ─── PDF Upload Modal ────────────────────────────────────────────────────────

function PdfUploadModal({ clients, routes, onClose, onSaved }: {
  clients: Client[];
  routes: Route[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(today);
  const [periodStart, setPeriodStart] = useState(today);
  const [periodEnd, setPeriodEnd] = useState(today);
  const [tripCount, setTripCount] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [kdvRate, setKdvRate] = useState("20");
  const [tevkifatRate, setTevkifatRate] = useState("50");
  const [notes, setNotes] = useState("");
  const [pdfUrlPreview, setPdfUrlPreview] = useState<string | null>(null);

  // Seçili firmadan varsayılanları doldur
  function onClientChange(id: string) {
    setClientId(id);
    const c = clients.find(cl => cl.id === id);
    if (c) {
      if (c.unitPrice > 0) setUnitPrice(String(c.unitPrice));
      setKdvRate(String(c.kdvRate));
      setTevkifatRate(String(c.tevkifatRate));
    }
  }

  // PDF seçilince hemen parse et ve formu doldur
  async function onFileChange(f: File) {
    setFile(f);
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/invoices/parse-pdf", { method: "POST", body: fd });
      const data = await res.json();
      if (data.pdfUrl) setPdfUrlPreview(data.pdfUrl);
      if (data.parsed) {
        const p = data.parsed;
        if (p.invoiceNo) setInvoiceNo(String(p.invoiceNo));
        if (p.issueDate) setIssueDate(String(p.issueDate));
        if (p.dueDate) setDueDate(String(p.dueDate));
        if (p.periodStart) setPeriodStart(String(p.periodStart));
        if (p.periodEnd) setPeriodEnd(String(p.periodEnd));
        if (p.tripCount != null) setTripCount(String(p.tripCount));
        if (p.unitPrice != null) setUnitPrice(String(p.unitPrice));
        if (p.kdvRate != null) setKdvRate(String(p.kdvRate));
        if (p.tevkifatRate != null) setTevkifatRate(String(p.tevkifatRate));
        // Müşteri adından firma eşleştir
        if (p.clientName && !clientId) {
          const lower = String(p.clientName).toLowerCase();
          const match = clients.find(c =>
            c.name.toLowerCase().includes(lower.slice(0, 8)) ||
            lower.includes(c.name.toLowerCase().slice(0, 8))
          );
          if (match) setClientId(match.id);
        }
        toast.success("PDF okundu, bilgiler dolduruldu");
      }
    } catch {
      toast("PDF okunamadı, bilgileri elle girebilirsiniz");
    } finally {
      setParsing(false);
    }
  }

  // Canlı hesaplama
  const subtotal = parseFloat(tripCount || "0") * parseFloat(unitPrice || "0");
  const kdvAmount = subtotal * (parseFloat(kdvRate || "0") / 100);
  const tevkifatAmount = kdvAmount * (parseFloat(tevkifatRate || "0") / 100);
  const totalAmount = subtotal + kdvAmount;
  const payableAmount = totalAmount - tevkifatAmount;

  useEffect(() => {
    fetch("/api/invoices/next-no").then(r => r.json()).then(d => setInvoiceNo(d.invoiceNo ?? ""));
  }, []);

  async function handleSave() {
    if (!clientId) { toast.error("Firma seçiniz"); return; }
    if (!invoiceNo.trim()) { toast.error("Fatura no zorunlu"); return; }
    setSaving(true);
    // PDF zaten dosya seçilince yüklendi, pdfUrlPreview'ı kullan
    const pdfUrl = pdfUrlPreview;
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNo,
          clientId,
          issueDate,
          dueDate,
          periodStart,
          periodEnd,
          tripCount: parseFloat(tripCount) || 0,
          unitPrice: parseFloat(unitPrice) || 0,
          kdvRate: parseFloat(kdvRate) || 0,
          tevkifatRate: parseFloat(tevkifatRate) || 0,
          notes: notes || null,
          routeId: routeId || null,
          pdfUrl,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Hata ${res.status}`);
      }
      toast.success("Fatura kaydedildi");
      onSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Kayıt başarısız");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Fatura Ekle</h2>
            <p className="text-sm text-slate-500">PDF ekleyebilir veya sadece bilgileri girebilirsiniz</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* PDF dosyası */}
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4">
            {file ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-700 min-w-0">
                  <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="truncate font-medium">{file.name}</span>
                  {parsing && <span className="text-xs text-blue-500 animate-pulse">Okunuyor...</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {pdfUrlPreview && (
                    <a href={pdfUrlPreview} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Görüntüle
                    </a>
                  )}
                  <label className="cursor-pointer text-xs text-slate-400 hover:text-slate-600">
                    Değiştir
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFileChange(f); }} />
                  </label>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer flex items-center gap-3">
                <Upload className="w-6 h-6 text-slate-300 flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-500 font-medium">PDF seç — bilgiler otomatik dolar</p>
                  <p className="text-xs text-slate-400">e-Fatura / e-Arşiv PDF desteklenir</p>
                </div>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFileChange(f); }} />
              </label>
            )}
          </div>

          {/* Form */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-500">Firma *</label>
              <select className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={clientId} onChange={e => onClientChange(e.target.value)}>
                <option value="">— Seçiniz —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-500">Güzergah (isteğe bağlı)</label>
              <select className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={routeId} onChange={e => setRouteId(e.target.value)}>
                <option value="">— Seçiniz —</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.name}{r.driver ? ` (${r.driver.name})` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Fatura No *</label>
              <input className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Fatura Tarihi</label>
              <input type="date" className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Son Ödeme</label>
              <input type="date" className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Dönem Başı</label>
              <input type="date" className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Dönem Sonu</label>
              <input type="date" className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Sefer Sayısı</label>
              <input type="number" min="0" placeholder="örn. 22" className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={tripCount} onChange={e => setTripCount(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Birim Fiyat (₺)</label>
              <input type="number" min="0" placeholder="örn. 1500" className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">KDV %</label>
              <input type="number" className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={kdvRate} onChange={e => setKdvRate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Tevkifat % <span className="text-slate-400 font-normal">(KDV'nin)</span></label>
              <input type="number" className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={tevkifatRate} onChange={e => setTevkifatRate(e.target.value)} />
            </div>
          </div>

          {/* Canlı tutar özeti */}
          <div className="bg-[#1B2437] rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>{tripCount || 0} sefer × {TRY(parseFloat(unitPrice || "0"))}</span>
              <span className="text-white font-semibold">{TRY(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>KDV %{kdvRate}</span>
              <span className="text-white">{TRY(kdvAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Tevkifat %{tevkifatRate}</span>
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
            <button
              onClick={handleSave}
              disabled={saving || !clientId || !invoiceNo}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white rounded-xl text-sm font-semibold"
            >
              <Save className="w-4 h-4" />
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Bulk PDF Upload Modal ────────────────────────────────────────────────────

type BulkPdfItem = {
  file: File;
  status: "pending" | "parsing" | "ready" | "error";
  pdfUrl?: string;
  invoiceNo?: string;
  clientId?: string;
  clientNameRaw?: string;
  issueDate?: string;
  dueDate?: string;
  periodStart?: string;
  periodEnd?: string;
  tripCount?: number;
  unitPrice?: number;
  kdvRate?: number;
  tevkifatRate?: number;
  subtotal?: number;
  kdvAmount?: number;
  tevkifatAmount?: number;
  totalAmount?: number;
  payableAmount?: number;
  error?: string;
};

function parseFilename(filename: string): { invoiceNo: string; vkn: string; nameHint: string } {
  const base = filename.replace(/\.pdf$/i, "");
  // Format: KOM2026000000035_0920057944_ATA TUR TEKSTİL
  const m1 = base.match(/^(KOM\d+)[_\s]+(\d{10,11})[_\s]+(.+)$/i);
  if (m1) return { invoiceNo: m1[1].toUpperCase(), vkn: m1[2], nameHint: m1[3].trim() };
  // Format: KOM2026000000038 BUDAK ZEY...
  const m2 = base.match(/^(KOM\d+)\s+(.+)$/i);
  if (m2) return { invoiceNo: m2[1].toUpperCase(), vkn: "", nameHint: m2[2].trim() };
  // Sadece numara
  const m3 = base.match(/^(KOM\d+)/i);
  return { invoiceNo: m3 ? m3[1].toUpperCase() : "", vkn: "", nameHint: "" };
}

function matchClient(clients: Client[], vkn: string, pdfName: string, nameHint: string): string {
  // 1. VKN ile eşleştir (en güvenilir)
  if (vkn) {
    const m = clients.find(c => c.vkn && c.vkn.replace(/\s/g, "") === vkn.replace(/\s/g, ""));
    if (m) return m.id;
  }
  // 2. PDF'den gelen firma adı ile esnek eşleştirme
  for (const raw of [pdfName, nameHint].filter(Boolean)) {
    const lower = raw.toLowerCase().replace(/\s+/g, " ").trim();
    const found = clients.find(c => {
      const cn = c.name.toLowerCase().replace(/\s+/g, " ").trim();
      // 6+ karakter önek eşleşmesi
      const minLen = Math.min(6, lower.length, cn.length);
      return cn.includes(lower.slice(0, minLen)) || lower.includes(cn.slice(0, minLen));
    });
    if (found) return found.id;
  }
  return "";
}

function BulkPdfModal({ clients, onClose, onSaved }: {
  clients: Client[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [items, setItems] = useState<BulkPdfItem[]>([]);
  const [saving, setSaving] = useState(false);

  async function onFilesChange(files: FileList) {
    const arr = Array.from(files).filter(f => f.name.toLowerCase().endsWith(".pdf"));
    const today = new Date().toISOString().split("T")[0];
    const initial: BulkPdfItem[] = arr.map(f => {
      const fn = parseFilename(f.name);
      return { file: f, status: "parsing", invoiceNo: fn.invoiceNo };
    });
    setItems(initial);

    await Promise.all(arr.map(async (file, i) => {
      const fn = parseFilename(file.name);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/invoices/parse-pdf", { method: "POST", body: fd });
        const data = await res.json();
        const p = data.parsed ?? {};

        const clientId = matchClient(clients, fn.vkn, p.clientName ?? "", fn.nameHint);

        // issueDate yoksa bugünü kullan; periodStart/End yoksa issueDateʼten türet
        const issueDate = p.issueDate ?? today;
        const [y, mo] = issueDate.split("-").map(Number);
        const periodStart = p.periodStart ?? `${y}-${String(mo).padStart(2, "0")}-01`;
        const lastDay = new Date(y, mo, 0).getDate();
        const periodEnd = p.periodEnd ?? `${y}-${String(mo).padStart(2, "0")}-${lastDay}`;

        setItems(prev => prev.map((x, j) => j !== i ? x : {
          ...x,
          status: "ready",
          pdfUrl: data.pdfUrl,
          invoiceNo: p.invoiceNo ?? fn.invoiceNo ?? "",
          clientId,
          clientNameRaw: p.clientName ?? fn.nameHint ?? "",
          issueDate,
          dueDate: p.dueDate ?? issueDate,
          periodStart,
          periodEnd,
          tripCount: p.tripCount,
          unitPrice: p.unitPrice,
          kdvRate: p.kdvRate,
          tevkifatRate: p.tevkifatRate,
          subtotal: p.subtotal,
          kdvAmount: p.kdvAmount,
          tevkifatAmount: p.tevkifatAmount,
          totalAmount: p.totalAmount,
          payableAmount: p.payableAmount,
        }));
      } catch {
        setItems(prev => prev.map((x, j) => j !== i ? x : { ...x, status: "error", error: "Okunamadı", invoiceNo: fn.invoiceNo }));
      }
    }));
  }

  function updateItem(i: number, patch: Partial<BulkPdfItem>) {
    setItems(prev => prev.map((x, j) => j === i ? { ...x, ...patch } : x));
  }

  const readyWithClient = items.filter(i => i.status === "ready" && i.clientId);

  async function handleSaveAll() {
    setSaving(true);
    let ok = 0, fail = 0;
    for (const item of readyWithClient) {
      try {
        const res = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceNo: item.invoiceNo,
            clientId: item.clientId,
            issueDate: item.issueDate,
            dueDate: item.dueDate,
            periodStart: item.periodStart,
            periodEnd: item.periodEnd,
            tripCount: item.tripCount ?? 0,
            unitPrice: item.unitPrice ?? 0,
            kdvRate: item.kdvRate ?? 20,
            tevkifatRate: item.tevkifatRate ?? 50,
            pdfUrl: item.pdfUrl ?? null,
            // PDF'den okunan gerçek tutarları geç (hesaplamayı override et)
            ...(item.subtotal != null && { _subtotal: item.subtotal }),
            ...(item.kdvAmount != null && { _kdvAmount: item.kdvAmount }),
            ...(item.tevkifatAmount != null && { _tevkifatAmount: item.tevkifatAmount }),
            ...(item.totalAmount != null && { _totalAmount: item.totalAmount }),
            ...(item.payableAmount != null && { _payableAmount: item.payableAmount }),
          }),
        });
        if (res.ok) ok++; else fail++;
      } catch { fail++; }
    }
    setSaving(false);
    toast.success(`${ok} fatura kaydedildi${fail ? `, ${fail} hata` : ""}`);
    if (ok > 0) onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative z-10 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Toplu PDF Yükleme</h2>
            <p className="text-sm text-slate-500">Birden fazla fatura PDF&apos;i seçin — bilgiler otomatik okunur</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          <label className="block border-2 border-dashed border-blue-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors">
            <Upload className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <p className="text-slate-700 font-medium">PDF dosyalarını seçin</p>
            <p className="text-slate-400 text-sm mt-1">Birden fazla dosya seçebilirsiniz</p>
            <input type="file" accept=".pdf" multiple className="hidden"
              onChange={e => e.target.files && onFilesChange(e.target.files)} />
          </label>

          {items.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs text-slate-400">
                    <th className="px-3 py-2">Fatura No</th>
                    <th className="px-3 py-2">Firma</th>
                    <th className="px-3 py-2">Fatura Tarihi</th>
                    <th className="px-3 py-2">Vade Tarihi</th>
                    <th className="px-3 py-2">Alınacak</th>
                    <th className="px-3 py-2">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-mono text-slate-700 text-xs">
                        {item.status === "parsing" ? <span className="text-slate-300">...</span> : item.invoiceNo}
                      </td>
                      <td className="px-3 py-2">
                        {item.status === "ready" && (
                          <div>
                            <select
                              value={item.clientId ?? ""}
                              onChange={e => updateItem(i, { clientId: e.target.value })}
                              className={`text-sm border rounded-lg px-2 py-1 w-full max-w-[200px] ${!item.clientId ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                            >
                              <option value="">— Firma seç —</option>
                              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            {!item.clientId && item.clientNameRaw && (
                              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]" title={item.clientNameRaw}>
                                PDF: {item.clientNameRaw}
                              </p>
                            )}
                          </div>
                        )}
                        {item.status === "parsing" && <span className="text-slate-300 text-xs">Okunuyor...</span>}
                      </td>
                      <td className="px-3 py-2 text-slate-600 text-xs">{item.issueDate}</td>
                      <td className="px-3 py-2">
                        {item.status === "ready" && (
                          <input
                            type="date"
                            value={item.dueDate ?? ""}
                            onChange={e => updateItem(i, { dueDate: e.target.value })}
                            className="border border-slate-200 rounded-lg px-2 py-1 text-sm"
                          />
                        )}
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-800 text-xs">
                        {item.status === "ready" && item.payableAmount != null ? TRY(item.payableAmount) : ""}
                      </td>
                      <td className="px-3 py-2">
                        {item.status === "parsing" && <span className="text-xs text-slate-400">Okunuyor...</span>}
                        {item.status === "error" && <span className="text-xs text-red-500">Hata</span>}
                        {item.status === "ready" && !item.clientId && <span className="text-xs text-orange-500">Firma seç</span>}
                        {item.status === "ready" && item.clientId && <span className="text-xs text-green-600">Hazır</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div className="flex items-center justify-between gap-3 p-6 border-t border-slate-100 flex-shrink-0">
            <span className="text-sm text-slate-400">{readyWithClient.length} / {items.length} fatura hazır</span>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">İptal</button>
              <button
                onClick={handleSaveAll}
                disabled={saving || readyWithClient.length === 0}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold"
              >
                <Save className="w-4 h-4" />
                {saving ? "Kaydediliyor..." : `${readyWithClient.length} Faturayı Kaydet`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FaturalarClient({
  clients: initialClients,
  invoices: initialInvoices,
  routes: initialRoutes,
}: {
  clients: Client[];
  invoices: Invoice[];
  routes: Route[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"firmalar" | "faturalar" | "nakit-akisi" | "net-kazanc">("faturalar");
  const [clients, setClients] = useState(initialClients);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [routes] = useState(initialRoutes);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [clientModal, setClientModal] = useState<Client | null | "new">(null);
  const [pdfModal, setPdfModal] = useState(false);
  const [netKazanc, setNetKazanc] = useState<{ routes: RouteEarning[]; totals: { revenue: number; fuelCost: number; salaryCost: number; netProfit: number } } | null>(null);
  const [netKazancLoading, setNetKazancLoading] = useState(false);
  const [netYear, setNetYear] = useState(new Date().getFullYear());
  const [netMonth, setNetMonth] = useState(new Date().getMonth() + 1);

  const now = new Date();
  const [bulkPdfModal, setBulkPdfModal] = useState(false);

  async function refreshClients() {
    const r = await fetch("/api/clients");
    setClients(await r.json());
    setClientModal(null);
    router.refresh();
  }

  async function refreshInvoices() {
    const r = await fetch("/api/invoices");
    setInvoices(await r.json());
    router.refresh();
  }

  async function loadForecast() {
    const r = await fetch("/api/invoices/forecast");
    setForecast(await r.json());
  }

  async function loadNetKazanc(year: number, month: number) {
    setNetKazancLoading(true);
    try {
      const r = await fetch(`/api/invoices/route-earnings?year=${year}&month=${month}`);
      setNetKazanc(await r.json());
    } catch { /* ignore */ }
    finally { setNetKazancLoading(false); }
  }

  useEffect(() => { if (tab === "nakit-akisi") loadForecast(); }, [tab]);
  useEffect(() => { if (tab === "net-kazanc") loadNetKazanc(netYear, netMonth); }, [tab, netYear, netMonth]);

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
      <div className="flex flex-wrap gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button className={tabStyle("faturalar")} onClick={() => setTab("faturalar")}>
          Faturalar {invoices.length > 0 && <span className="ml-1 bg-white/30 text-xs px-1.5 py-0.5 rounded-full">{invoices.length}</span>}
        </button>
        <button className={tabStyle("nakit-akisi")} onClick={() => setTab("nakit-akisi")}>Nakit Akışı</button>
        <button className={tabStyle("net-kazanc")} onClick={() => setTab("net-kazanc")}>Net Kazanç</button>
        <button className={tabStyle("firmalar")} onClick={() => setTab("firmalar")}>Firmalar</button>
      </div>

      {/* ── Tab: Faturalar ──────────────────────────────── */}
      {tab === "faturalar" && (
        <div>
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={() => setBulkPdfModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold"
            >
              <Upload className="w-4 h-4" /> Toplu PDF Yükle
            </button>
            <button
              onClick={() => setPdfModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold"
            >
              <Upload className="w-4 h-4" /> PDF'den Yükle
            </button>
          </div>
          {invoices.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Henüz fatura yok</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map(inv => (
                <div key={inv.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono text-slate-400">{inv.invoiceNo}</span>
                        {statusBadge(inv.status)}
                        {inv.route && (
                          <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            <MapPin className="w-3 h-3" />{inv.route.name}
                          </span>
                        )}
                        {inv.pdfUrl && (
                          <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs bg-slate-100 text-slate-500 hover:text-slate-700 px-2 py-0.5 rounded-full">
                            <ExternalLink className="w-3 h-3" /> PDF
                          </a>
                        )}
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

      {/* ── Tab: Net Kazanç ─────────────────────────────── */}
      {tab === "net-kazanc" && (
        <div>
          {/* Dönem seçici */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <select
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold bg-white"
              value={netMonth}
              onChange={e => setNetMonth(parseInt(e.target.value))}
            >
              {MONTHS_FULL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold bg-white"
              value={netYear}
              onChange={e => setNetYear(parseInt(e.target.value))}
            >
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-slate-400 text-sm">dönemi</span>
          </div>

          {netKazancLoading ? (
            <div className="text-center py-16 text-slate-400">Yükleniyor...</div>
          ) : !netKazanc || netKazanc.routes.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Bu dönem için güzergah verisi yok</p>
              <p className="text-xs mt-1">Faturalar güzergaha bağlandığında burada görünür</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Dönem özeti */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-2xl p-4 text-center">
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Fatura Geliri</p>
                  <p className="text-xl font-black text-blue-700 mt-1">{TRY(netKazanc.totals.revenue)}</p>
                </div>
                <div className="bg-orange-50 rounded-2xl p-4 text-center">
                  <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide">Yakıt</p>
                  <p className="text-xl font-black text-orange-700 mt-1">{TRY(netKazanc.totals.fuelCost)}</p>
                </div>
                <div className="bg-purple-50 rounded-2xl p-4 text-center">
                  <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide">Maaş</p>
                  <p className="text-xl font-black text-purple-700 mt-1">{TRY(netKazanc.totals.salaryCost)}</p>
                </div>
                <div className={`rounded-2xl p-4 text-center ${netKazanc.totals.netProfit >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${netKazanc.totals.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>Net Kazanç</p>
                  <p className={`text-xl font-black mt-1 ${netKazanc.totals.netProfit >= 0 ? "text-green-700" : "text-red-700"}`}>{TRY(netKazanc.totals.netProfit)}</p>
                </div>
              </div>

              {/* Güzergah bazlı */}
              <div className="space-y-2">
                {netKazanc.routes.map(r => (
                  <div key={r.routeId} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="font-bold text-slate-800">{r.routeName}</p>
                        <div className="flex gap-2 mt-0.5 flex-wrap">
                          {r.driver && <span className="text-xs text-slate-500">{r.driver.name}</span>}
                          {r.vehicle && <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">{r.vehicle.plate}</span>}
                          <span className="text-xs text-slate-400">{r.invoiceCount} fatura</span>
                        </div>
                      </div>
                      <div className={`text-right flex-shrink-0`}>
                        <p className={`text-lg font-black ${r.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{TRY(r.netProfit)}</p>
                        <p className="text-xs text-slate-400">net kazanç</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-blue-50 rounded-xl p-2 text-center">
                        <p className="text-blue-500 flex items-center justify-center gap-1"><FileText className="w-3 h-3" /> Gelir</p>
                        <p className="font-bold text-blue-700">{TRY(r.revenue)}</p>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-2 text-center">
                        <p className="text-orange-500 flex items-center justify-center gap-1"><Fuel className="w-3 h-3" /> Yakıt</p>
                        <p className="font-bold text-orange-700">-{TRY(r.fuelCost)}</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-2 text-center">
                        <p className="text-purple-500 flex items-center justify-center gap-1"><Banknote className="w-3 h-3" /> Maaş</p>
                        <p className="font-bold text-purple-700">-{TRY(r.salaryCost)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
              {clients.map(c => {
                const clientInvoices = invoices.filter(inv => inv.clientId === c.id);
                const pending = clientInvoices.filter(inv => inv.status === "bekliyor").reduce((s, inv) => s + inv.payableAmount, 0);
                const overdue = clientInvoices.filter(inv => inv.status === "gecikti").reduce((s, inv) => s + inv.payableAmount, 0);
                const totalInvoiced = clientInvoices.reduce((s, inv) => s + inv.payableAmount, 0);
                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800">{c.name}</p>
                        {c.vkn && <p className="text-xs text-slate-400">VKN: {c.vkn}</p>}
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500">
                          <span className="bg-slate-100 px-2 py-1 rounded-lg font-semibold">{TRY(c.unitPrice)}/sefer</span>
                          <span className="bg-slate-100 px-2 py-1 rounded-lg">{c.paymentTermDays} gün vade</span>
                          <span className="bg-slate-100 px-2 py-1 rounded-lg">KDV %{c.kdvRate}</span>
                          <span className="bg-slate-100 px-2 py-1 rounded-lg">Tevkifat %{c.tevkifatRate}</span>
                        </div>
                        {totalInvoiced > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {overdue > 0 && (
                              <span className="text-xs bg-red-50 text-red-600 font-semibold px-2 py-1 rounded-lg border border-red-100">
                                Gecikmiş: {TRY(overdue)}
                              </span>
                            )}
                            {pending > 0 && (
                              <span className="text-xs bg-yellow-50 text-yellow-700 font-semibold px-2 py-1 rounded-lg border border-yellow-100">
                                Bekliyor: {TRY(pending)}
                              </span>
                            )}
                            {overdue === 0 && pending === 0 && (
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg">Tüm faturalar ödendi</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => setClientModal(c)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                          <Save className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteClient(c.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
      {pdfModal && (
        <PdfUploadModal
          clients={clients}
          routes={routes}
          onClose={() => setPdfModal(false)}
          onSaved={() => { setPdfModal(false); refreshInvoices(); }}
        />
      )}
      {bulkPdfModal && (
        <BulkPdfModal
          clients={clients}
          onClose={() => setBulkPdfModal(false)}
          onSaved={() => { setBulkPdfModal(false); refreshInvoices(); }}
        />
      )}
    </div>
  );
}


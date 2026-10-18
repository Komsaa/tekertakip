"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, X, Trash2, ExternalLink, Upload, Loader2, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { formatDate, getDocStatus, getDocStatusColor, getDocStatusLabel, getDaysLeft } from "@/lib/utils";

type Doc = {
  id: string;
  name: string;
  expiry: Date | null;
  fileUrl: string | null;
  notes: string | null;
};

interface Props {
  entityType: "driver" | "vehicle";
  entityId: string;
  initialDocs: Doc[];
  title?: string;
  requiredName?: string;
}

export default function ExtraDocuments({ entityType, entityId, initialDocs, title = "Ek Belgeler", requiredName }: Props) {
  const router = useRouter();
  const [docs, setDocs] = useState(initialDocs);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: requiredName ?? "", expiry: "", notes: "" });
  const [formFile, setFormFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const [preview, setPreview] = useState<{url:string;name:string;type:string} | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  async function viewDocument(doc: Doc) {
    if (!doc.fileUrl || viewingId) return;
    setViewingId(doc.id);
    try {
      const response = await fetch(doc.fileUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 404 ? "Dosya depoda bulunamadı. Dosyayı Güncelle ile yeniden yükleyin." : "Belge açılamadı. Oturumunuzu ve bağlantınızı kontrol edin.");
      const blob = await response.blob();
      if (!blob.type.startsWith("image/") && blob.type !== "application/pdf") throw new Error("Dosya önizlenemedi. PDF, JPG veya PNG olarak yeniden yükleyin.");
      setPreview({url:URL.createObjectURL(blob),name:doc.name,type:blob.type});
    } catch (error) { toast.error(error instanceof Error ? error.message : "Belge açılamadı"); }
    finally { setViewingId(null); }
  }

  function set(f: string, v: string) { setForm((p) => ({ ...p, [f]: v })); }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, expiry: form.expiry || null, notes: form.notes || null, entityType, entityId }),
      });
      if (!res.ok) throw new Error();
      const doc = await res.json();

      // Dosya seçildiyse hemen yükle
      if (formFile) {
        const fd = new FormData();
        fd.append("file", formFile);
        fd.append("entityType", entityType);
        fd.append("entityId", entityId);
        fd.append("docType", `extra_${doc.id}`);
        const upRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (!upRes.ok) {
          setDocs((prev) => [doc, ...prev]);
          setShowForm(false);
          throw new Error("Belge kaydı oluşturuldu ancak dosya yüklenemedi. Belgenin yanındaki Yükle ile tekrar deneyin.");
        }
        {
          const { url } = await upRes.json();
          const saved = await fetch(`/api/documents/${doc.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileUrl: url }),
          });
          if (!saved.ok) {
            setDocs((prev) => [doc, ...prev]);
            setShowForm(false);
            throw new Error("Dosya bağlantısı kaydedilemedi. Belgenin yanındaki Yükle ile tekrar deneyin.");
          }
          doc.fileUrl = url;
        }
      }

      setDocs((prev) => [doc, ...prev]);
      setForm({ name: requiredName ?? "", expiry: "", notes: "" });
      setFormFile(null);
      setShowForm(false);
      toast.success("Belge eklendi!");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Eklenemedi"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu belge silinsin mi?")) return;
    try {
      const response = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Silinemedi");
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success("Silindi");
    } catch { toast.error("Silinemedi"); }
  }

  async function handleUpload(docId: string, file: File) {
    setUploadingId(docId);
    try {
      const formData2 = new FormData();
      formData2.append("file", file);
      formData2.append("entityType", entityType);
      formData2.append("entityId", entityId);
      formData2.append("docType", `extra_${docId}`);

      const res = await fetch("/api/upload", { method: "POST", body: formData2 });
      if (!res.ok) throw new Error();
      const { url } = await res.json();

      // Document kaydını güncelle
      const saved = await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: url }),
      });

      if (!saved.ok) throw new Error("Dosya bağlantısı kaydedilemedi");
      setDocs((prev) => prev.map((d) => d.id === docId ? { ...d, fileUrl: url } : d));
      toast.success("Dosya yüklendi!");
    } catch { toast.error("Yükleme hatası"); }
    finally { setUploadingId(null); }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-400" />
          {title}
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-[#DC2626] hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Belge Ekle
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-slate-50 rounded-xl p-4 mb-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Belge Adı *</label>
            <input
              type="text"
              value={form.name}
              readOnly={Boolean(requiredName)}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Sabıka kaydı, Taşıt kartı, Trafik cezası makbuzu..."
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Son Geçerlilik</label>
              <input
                type="date"
                value={form.expiry}
                onChange={(e) => set("expiry", e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Not</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Opsiyonel"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Dosya (opsiyonel)</label>
            <label className="flex items-center gap-2 cursor-pointer border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-100 transition-colors">
              <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-sm text-slate-500 truncate">
                {formFile ? formFile.name : "PDF, JPG veya PNG seç"}
              </span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={(e) => setFormFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setShowForm(false); setFormFile(null); }} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm">İptal</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-sm font-semibold disabled:opacity-60">
              {saving ? "Ekleniyor..." : "Ekle"}
            </button>
          </div>
        </form>
      )}

      {docs.length === 0 && !showForm ? (
        <p className="text-sm text-slate-400 text-center py-4">{requiredName ? "Zorunlu belge eksik. Koltuk sigortası poliçesini ekleyin." : "Henüz ek belge yok"}</p>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => {
            const status = getDocStatus(doc.expiry);
            const daysLeft = getDaysLeft(doc.expiry);
            const colorClass = getDocStatusColor(status);
            return (
              <div key={doc.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    status === "valid" ? "bg-green-50" : status === "missing" ? "bg-gray-50" : "bg-red-50"
                  }`}>
                    {status === "valid" ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> :
                     status === "missing" ? <FileText className="w-3.5 h-3.5 text-gray-400" /> :
                     <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-700 truncate">{doc.name}</div>
                    {doc.expiry ? (
                      <div className="text-xs text-slate-400">
                        {formatDate(doc.expiry)}
                        {daysLeft !== null && (
                          <span className={`ml-1 ${daysLeft < 0 ? "text-red-500" : daysLeft <= 30 ? "text-amber-500" : ""}`}>
                            · {daysLeft < 0 ? `${Math.abs(daysLeft)} gün geçti` : `${daysLeft} gün kaldı`}
                          </span>
                        )}
                      </div>
                    ) : doc.notes ? (
                      <div className="text-xs text-slate-400">{doc.notes}</div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  {doc.expiry && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${colorClass}`}>
                      {getDocStatusLabel(status)}
                    </span>
                  )}
                  {doc.fileUrl && <button type="button" disabled={viewingId === doc.id} onClick={() => void viewDocument(doc)} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <ExternalLink className="w-3 h-3" />{viewingId === doc.id ? "Açılıyor…" : "Görüntüle"}
                  </button>}
                  <label className="flex items-center gap-1 text-xs text-slate-500 hover:bg-slate-100 px-2 py-1 rounded-lg cursor-pointer">
                    {uploadingId === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    {doc.fileUrl ? "Güncelle" : "Yükle"}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={uploadingId === doc.id} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleUpload(doc.id, f); e.target.value = ""; }} />
                  </label>
                  <button onClick={() => handleDelete(doc.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {preview && <div className="fixed inset-0 z-50 bg-black/60 p-3 sm:p-8 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={preview.name} onKeyDown={e=>{if(e.key==="Escape")setPreview(null);}}>
        <div className="bg-white rounded-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-4 border-b"><h3 className="font-semibold truncate">{preview.name}</h3><div className="flex items-center gap-4 shrink-0"><a href={preview.url} download={`${preview.name}.${preview.type==='application/pdf'?'pdf':preview.type==='image/png'?'png':'jpg'}`} className="text-blue-700 text-sm">İndir</a><button autoFocus aria-label="Belgeyi kapat" onClick={()=>setPreview(null)}><X size={22}/></button></div></div>
          {preview.type === "application/pdf" ? <iframe title={preview.name} src={preview.url} className="w-full flex-1 border-0"/> : <img src={preview.url} alt={preview.name} className="w-full min-h-0 flex-1 object-contain"/>}
          <p className="text-xs text-slate-500 p-3">Önizleme cihazınızda açılmazsa İndir ile dosyayı açabilirsiniz.</p>
        </div>
      </div>}
    </div>
  );
}

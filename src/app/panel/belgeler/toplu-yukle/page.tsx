"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  ArrowLeft,
  X,
  FileText,
} from "lucide-react";
import Link from "next/link";

type Driver = { id: string; name: string };
type Vehicle = { id: string; plate: string };

const DRIVER_DOC_TYPES = [
  { key: "license", label: "Ehliyet" },
  { key: "src", label: "SRC-2 Belgesi" },
  { key: "psychotech", label: "Psikoteknik" },
  { key: "healthReport", label: "Sağlık Raporu" },
  { key: "criminalRecord", label: "Adli Sicil" },
  { key: "residenceDoc", label: "İkametgah" },
];

const VEHICLE_DOC_TYPES = [
  { key: "inspection", label: "Muayene (TÜVTÜRK)" },
  { key: "insurance", label: "Trafik Sigortası" },
  { key: "routePermit", label: "Güzergah İzni" },
  { key: "approval", label: "Okul Servisi Uygunluk" },
  { key: "kasko", label: "Kasko" },
  { key: "ruhsat", label: "Araç Ruhsatı" },
  { key: "photo", label: "Fotoğraf" },
];

const CATEGORIES = [
  { key: "resmi", label: "Resmi Evrak" },
  { key: "sozlesme", label: "Sözleşme" },
  { key: "sigorta", label: "Sigorta" },
  { key: "mali", label: "Mali Belge" },
  { key: "diger", label: "Diğer" },
];

type DocRow = {
  id: string;
  file: File;
  previewUrl: string;
  status: "bekliyor" | "yukleniyor" | "hazir" | "hata";
  errorMsg?: string;
  entityType: "driver" | "vehicle";
  entityId: string;
  docMode: "predefined" | "custom";
  docType: string;
  customName: string;
  category: string;
  expiry: string;
  notes: string;
  fileUrl?: string;
};

const isPdf = (f: File) => f.type === "application/pdf" || f.name.endsWith(".pdf");

export default function TopluEvrakYuklePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rows, setRows] = useState<DocRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [defaultEntityType, setDefaultEntityType] = useState<"driver" | "vehicle">("driver");
  const [defaultEntityId, setDefaultEntityId] = useState("");
  const [defaultDocMode, setDefaultDocMode] = useState<"predefined" | "custom">("predefined");
  const [defaultDocType, setDefaultDocType] = useState("");
  const [defaultCategory, setDefaultCategory] = useState("diger");

  useEffect(() => {
    fetch("/api/drivers")
      .then((r) => r.json())
      .then((d) => setDrivers(Array.isArray(d) ? d : d.drivers || []));
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((d) => setVehicles(Array.isArray(d) ? d : d.vehicles || []));
  }, []);

  function makeRow(file: File): DocRow {
    return {
      id: `${Date.now()}_${Math.random()}`,
      file,
      previewUrl: isPdf(file) ? "" : URL.createObjectURL(file),
      status: "bekliyor",
      entityType: defaultEntityType,
      entityId: defaultEntityId,
      docMode: defaultDocMode,
      docType: defaultDocType,
      customName: file.name.replace(/\.[^.]+$/, ""),
      category: defaultCategory,
      expiry: "",
      notes: "",
    };
  }

  function onFilesSelected(files: FileList) {
    const newRows = Array.from(files).map(makeRow);
    setRows((prev) => [...prev, ...newRows]);
  }

  function updateRow(id: string, patch: Partial<DocRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function applyDefaultToAll() {
    setRows((prev) =>
      prev.map((r) =>
        r.status === "bekliyor"
          ? {
              ...r,
              entityType: defaultEntityType,
              entityId: defaultEntityId,
              docMode: defaultDocMode,
              docType: defaultDocType,
              category: defaultCategory,
            }
          : r
      )
    );
    toast.success("Varsayılanlar uygulandı");
  }

  function validate(row: DocRow): string | null {
    if (!row.entityId) return "Entity seçilmedi";
    if (row.docMode === "predefined" && !row.docType) return "Belge türü seçilmedi";
    if (row.docMode === "custom" && !row.customName.trim()) return "Belge adı boş";
    return null;
  }

  async function saveAll() {
    const pending = rows.filter((r) => r.status === "bekliyor");
    if (!pending.length) {
      toast.error("Yüklenecek bekleyen belge yok");
      return;
    }

    // Validate all
    for (const row of pending) {
      const err = validate(row);
      if (err) {
        toast.error(`${row.file.name}: ${err}`);
        return;
      }
    }

    setSaving(true);
    const customRows: DocRow[] = [];

    for (const row of pending) {
      updateRow(row.id, { status: "yukleniyor", errorMsg: undefined });

      const ext = row.file.name.split(".").pop()?.toLowerCase() || "pdf";
      const entityId = row.entityId;
      const entityType = row.entityType;

      // Dosyayı yükle
      const fd = new FormData();
      fd.append("file", row.file);
      fd.append("entityType", entityType);
      fd.append("entityId", entityId);
      // custom modda aynı upload endpoint'ini kullan ama docType=custom geç (DB güncellenmez)
      fd.append("docType", row.docMode === "predefined" ? row.docType : "custom");

      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Yükleme hatası");

        const fileUrl = data.url;

        if (row.docMode === "custom") {
          // Arşiv belgeleri toplu kaydet
          customRows.push({ ...row, fileUrl, status: "hazir" });
          updateRow(row.id, { status: "hazir", fileUrl });
        } else {
          // Predefined: /api/upload zaten DB'yi güncelledi
          updateRow(row.id, { status: "hazir", fileUrl });
        }
      } catch (e: any) {
        updateRow(row.id, { status: "hata", errorMsg: e.message });
      }
    }

    // Arşiv belgelerini toplu kaydet
    if (customRows.length > 0) {
      try {
        const res = await fetch("/api/documents/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entries: customRows.map((r) => ({
              name: r.customName,
              entityType: r.entityType,
              entityId: r.entityId,
              fileUrl: r.fileUrl,
              category: r.category,
              expiry: r.expiry || undefined,
              notes: r.notes || undefined,
            })),
          }),
        });
        if (!res.ok) throw new Error("Arşiv kayıt hatası");
      } catch (e: any) {
        toast.error(e.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    const hazir = rows.filter((r) => r.status === "hazir").length + pending.filter((r) => r.status !== "hata").length;
    const hata = pending.filter((r) => r.status === "hata").length;
    if (hata === 0) {
      toast.success(`${pending.length} belge yüklendi`);
      router.push("/panel/belgeler");
    } else {
      toast.error(`${hata} belge hatalı, geri kalanlar yüklendi`);
    }
  }

  const entityList = defaultEntityType === "driver" ? drivers : vehicles;
  const pendingCount = rows.filter((r) => r.status === "bekliyor").length;
  const hazirCount = rows.filter((r) => r.status === "hazir").length;
  const hataCount = rows.filter((r) => r.status === "hata").length;

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/panel/belgeler" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Toplu Evrak Yükleme</h1>
          <p className="text-slate-500 text-sm mt-1">
            Birden fazla şöför veya araç için aynı anda belge yükle
          </p>
        </div>
      </div>

      {/* Varsayılan ayarlar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Toplu Uygula</span>
          <button
            onClick={applyDefaultToAll}
            disabled={rows.length === 0}
            className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium disabled:opacity-40"
          >
            Tüm bekleyenlere uygula
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Tür</label>
            <select
              value={defaultEntityType}
              onChange={(e) => {
                setDefaultEntityType(e.target.value as "driver" | "vehicle");
                setDefaultEntityId("");
                setDefaultDocType("");
              }}
              className="w-full text-sm"
            >
              <option value="driver">Şöför</option>
              <option value="vehicle">Araç</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">
              {defaultEntityType === "driver" ? "Şöför" : "Araç"}
            </label>
            <select
              value={defaultEntityId}
              onChange={(e) => setDefaultEntityId(e.target.value)}
              className="w-full text-sm"
            >
              <option value="">Seçin</option>
              {defaultEntityType === "driver"
                ? drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)
                : vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Belge Modu</label>
            <select
              value={defaultDocMode}
              onChange={(e) => {
                setDefaultDocMode(e.target.value as "predefined" | "custom");
                setDefaultDocType("");
              }}
              className="w-full text-sm"
            >
              <option value="predefined">Resmi (Zorunlu Evrak)</option>
              <option value="custom">Arşiv / Diğer</option>
            </select>
          </div>
          {defaultDocMode === "predefined" ? (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Belge Türü</label>
              <select
                value={defaultDocType}
                onChange={(e) => setDefaultDocType(e.target.value)}
                className="w-full text-sm"
              >
                <option value="">Seçin</option>
                {(defaultEntityType === "driver" ? DRIVER_DOC_TYPES : VEHICLE_DOC_TYPES).map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Kategori</label>
              <select
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
                className="w-full text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center cursor-pointer hover:border-[#DC2626] hover:bg-red-50/30 transition-all"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files) onFilesSelected(e.dataTransfer.files);
        }}
      >
        <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="font-semibold text-slate-600">Dosyaları sürükle veya tıkla</p>
        <p className="text-sm text-slate-400 mt-1">PDF, JPG, PNG · Birden fazla seçilebilir</p>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && onFilesSelected(e.target.files)}
        />
      </div>

      {rows.length > 0 && (
        <>
          {/* Özet + kaydet */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <span className="text-slate-500">{rows.length} belge</span>
              {pendingCount > 0 && <span className="text-amber-600 font-semibold">{pendingCount} bekliyor</span>}
              {hazirCount > 0 && <span className="text-green-600 font-semibold">{hazirCount} yüklendi</span>}
              {hataCount > 0 && <span className="text-red-600 font-semibold">{hataCount} hata</span>}
            </div>
            {pendingCount > 0 && (
              <button
                onClick={saveAll}
                disabled={saving}
                className="flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Yükleniyor..." : `Yükle ve Kaydet (${pendingCount})`}
              </button>
            )}
          </div>

          {/* Satırlar */}
          <div className="space-y-2">
            {rows.map((row) => (
              <DocRowCard
                key={row.id}
                row={row}
                drivers={drivers}
                vehicles={vehicles}
                onUpdate={(patch) => updateRow(row.id, patch)}
                onRemove={() => removeRow(row.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DocRowCard({
  row,
  drivers,
  vehicles,
  onUpdate,
  onRemove,
}: {
  row: DocRow;
  drivers: Driver[];
  vehicles: Vehicle[];
  onUpdate: (patch: Partial<DocRow>) => void;
  onRemove: () => void;
}) {
  const disabled = row.status !== "bekliyor";
  const docTypeList = row.entityType === "driver" ? DRIVER_DOC_TYPES : VEHICLE_DOC_TYPES;

  const borderColor =
    row.status === "hata"
      ? "border-red-200 bg-red-50/30"
      : row.status === "hazir"
      ? "border-green-200 bg-green-50/20"
      : row.status === "yukleniyor"
      ? "border-blue-200"
      : "border-slate-100 bg-white";

  return (
    <div className={`rounded-xl border p-3 flex gap-3 items-start ${borderColor}`}>
      {/* Önizleme / ikon */}
      <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0 bg-slate-50 flex items-center justify-center">
        {row.previewUrl ? (
          <img src={row.previewUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <FileText className="w-6 h-6 text-slate-400" />
        )}
      </div>

      {/* Alanlar */}
      <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-2">
        {/* Entity type */}
        <select
          disabled={disabled}
          value={row.entityType}
          onChange={(e) =>
            onUpdate({
              entityType: e.target.value as "driver" | "vehicle",
              entityId: "",
              docType: "",
            })
          }
          className="text-xs py-1 disabled:opacity-60"
        >
          <option value="driver">Şöför</option>
          <option value="vehicle">Araç</option>
        </select>

        {/* Entity picker */}
        <select
          disabled={disabled}
          value={row.entityId}
          onChange={(e) => onUpdate({ entityId: e.target.value })}
          className="text-xs py-1 disabled:opacity-60"
        >
          <option value="">
            {row.entityType === "driver" ? "Şöför seç *" : "Araç seç *"}
          </option>
          {row.entityType === "driver"
            ? drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)
            : vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
        </select>

        {/* Doc mode */}
        <select
          disabled={disabled}
          value={row.docMode}
          onChange={(e) =>
            onUpdate({ docMode: e.target.value as "predefined" | "custom", docType: "" })
          }
          className="text-xs py-1 disabled:opacity-60"
        >
          <option value="predefined">Zorunlu Evrak</option>
          <option value="custom">Arşiv / Diğer</option>
        </select>

        {/* Doc type / custom name */}
        {row.docMode === "predefined" ? (
          <select
            disabled={disabled}
            value={row.docType}
            onChange={(e) => onUpdate({ docType: e.target.value })}
            className="text-xs py-1 disabled:opacity-60"
          >
            <option value="">Tür seç *</option>
            {docTypeList.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        ) : (
          <input
            disabled={disabled}
            type="text"
            value={row.customName}
            onChange={(e) => onUpdate({ customName: e.target.value })}
            placeholder="Belge adı *"
            className="text-xs py-1 disabled:opacity-60"
          />
        )}

        {/* Kategori (sadece custom) */}
        {row.docMode === "custom" && (
          <select
            disabled={disabled}
            value={row.category}
            onChange={(e) => onUpdate({ category: e.target.value })}
            className="text-xs py-1 disabled:opacity-60"
          >
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        )}

        {/* Expiry */}
        <input
          disabled={disabled}
          type="date"
          value={row.expiry}
          onChange={(e) => onUpdate({ expiry: e.target.value })}
          placeholder="Son geçerlilik"
          className="text-xs py-1 disabled:opacity-60 col-span-1"
          title="Son geçerlilik tarihi (opsiyonel)"
        />
      </div>

      {/* Durum */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-xs text-slate-400 min-w-[70px] text-right">
          {row.status === "bekliyor" && "Bekliyor"}
          {row.status === "yukleniyor" && <span className="text-blue-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Yükleniyor</span>}
          {row.status === "hazir" && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Yüklendi</span>}
          {row.status === "hata" && <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{row.errorMsg || "Hata"}</span>}
        </div>
        {!disabled && (
          <button onClick={onRemove} className="p-1 text-slate-300 hover:text-red-400">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

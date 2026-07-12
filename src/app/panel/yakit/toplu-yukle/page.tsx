"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Upload, CheckCircle2, AlertCircle, Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Vehicle = { id: string; plate: string };

type PhotoRow = {
  id: string;
  file: File;
  previewUrl: string;
  type: "fis" | "gosterge";
  status: "bekliyor" | "yukleniyor" | "okunuyor" | "hazir" | "hata";
  photoUrl?: string;
  // Fiş alanları
  liters?: number;
  totalAmount?: number;
  pricePerLiter?: number;
  station?: string;
  date?: string;
  odometer?: number;
  vehicleId: string;
  paymentType: string;
  // Gösterge çifti
  pairedWith?: string; // diğer row'un id'si
};

export default function TopluYuklePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rows, setRows] = useState<PhotoRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [defaultVehicleId, setDefaultVehicleId] = useState("");

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.vehicles || [];
        setVehicles(list);
        if (list.length === 1) setDefaultVehicleId(list[0].id);
      });
  }, []);

  function onFilesSelected(files: FileList) {
    const arr = Array.from(files);
    const newRows: PhotoRow[] = arr.map((file, i) => ({
      id: `${Date.now()}_${i}_${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      type: "fis", // varsayılan fiş, kullanıcı değiştirir
      status: "bekliyor",
      vehicleId: defaultVehicleId,
      paymentType: "nakit",
      date: new Date().toISOString().split("T")[0],
    }));
    setRows((prev) => [...prev, ...newRows]);
  }

  function updateRow(id: string, patch: Partial<PhotoRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function toggleType(id: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, type: r.type === "fis" ? "gosterge" : "fis" } : r
      )
    );
  }

  // Otomatik çiftleme: her gösterge, kendisinden önceki fişle çiftlenir + KM'yi fişe taşır
  function autoPair() {
    setRows((prev) => {
      const next = [...prev];
      let lastFisIdx = -1;
      for (let i = 0; i < next.length; i++) {
        if (next[i].type === "fis") {
          lastFisIdx = i;
        } else if (next[i].type === "gosterge" && lastFisIdx >= 0) {
          next[i] = { ...next[i], pairedWith: next[lastFisIdx].id };
          // Göstergeden okunan KM varsa fişe aktar
          if (next[i].odometer && !next[lastFisIdx].odometer) {
            next[lastFisIdx] = { ...next[lastFisIdx], odometer: next[i].odometer };
          }
        }
      }
      return next;
    });
    toast.success("Göstergeler önceki fişle çiftlendi");
  }

  async function processAll() {
    setProcessing(true);
    const pending = rows.filter((r) => r.status === "bekliyor");

    for (const row of pending) {
      updateRow(row.id, { status: "yukleniyor" });
      let photoUrl: string | undefined;
      try {
        const fd = new FormData();
        fd.append("file", row.file);
        const res = await fetch("/api/fuel/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error();
        photoUrl = (await res.json()).url;
        updateRow(row.id, { photoUrl });
      } catch {
        updateRow(row.id, { status: "hata", photoUrl: undefined });
        continue;
      }

      // Hem fiş hem gösterge için AI oku
      updateRow(row.id, { status: "okunuyor" });
      try {
        const res = await fetch("/api/fuel/parse-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUrl: photoUrl }),
        });
        const { parsed } = await res.json();
        if (row.type === "fis") {
          updateRow(row.id, {
            status: "hazir",
            liters: parsed?.liters ?? undefined,
            totalAmount: parsed?.totalAmount ?? undefined,
            pricePerLiter: parsed?.pricePerLiter ?? undefined,
            station: parsed?.station ?? undefined,
            date: parsed?.date || row.date,
            odometer: parsed?.odometer ?? undefined,
          });
        } else {
          // Gösterge — sadece KM oku
          updateRow(row.id, {
            status: "hazir",
            odometer: parsed?.odometer ?? undefined,
          });
        }
      } catch {
        updateRow(row.id, { status: "hazir" });
      }
      await new Promise((r) => setTimeout(r, 3000)); // rate limit
    }

    setProcessing(false);
    toast.success("İşlem tamamlandı");
  }

  async function saveAll() {
    const fisRows = rows.filter(
      (r) => r.type === "fis" && r.status === "hazir" && r.vehicleId && r.liters && r.totalAmount
    );
    if (!fisRows.length) {
      toast.error("Kaydedilecek hazır fiş yok (araç, litre, tutar zorunlu)");
      return;
    }

    setSaving(true);
    try {
      // Gösterge fotoğraflarını fişle eşleştir (fotoğraf URL + KM)
      const gostergePhotoMap: Record<string, string> = {};
      const gostergeKmMap: Record<string, number> = {};
      rows.filter((r) => r.type === "gosterge" && r.pairedWith).forEach((r) => {
        if (r.photoUrl) gostergePhotoMap[r.pairedWith!] = r.photoUrl;
        if (r.odometer) gostergeKmMap[r.pairedWith!] = r.odometer;
      });

      const res = await fetch("/api/fuel/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: fisRows.map((r) => ({
            vehicleId: r.vehicleId,
            date: r.date || new Date().toISOString().split("T")[0],
            liters: r.liters!,
            totalAmount: r.totalAmount!,
            pricePerLiter: r.pricePerLiter,
            station: r.station,
            paymentType: r.paymentType,
            receiptPhoto: r.photoUrl,
            odometerPhoto: gostergePhotoMap[r.id] || undefined,
            odometer: r.odometer || gostergeKmMap[r.id] || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${data.count} yakıt kaydı oluşturuldu!`);
      router.push("/panel/yakit");
    } catch (e: any) {
      toast.error(e.message || "Hata oluştu");
    } finally {
      setSaving(false);
    }
  }

  const fisCount = rows.filter((r) => r.type === "fis").length;
  const gostergeCount = rows.filter((r) => r.type === "gosterge").length;
  const readyFis = rows.filter((r) => r.type === "fis" && r.status === "hazir").length;
  const pendingCount = rows.filter((r) => r.status === "bekliyor").length;
  const validReady = rows.filter((r) => r.type === "fis" && r.status === "hazir" && r.vehicleId && r.liters && r.totalAmount).length;

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/panel/yakit" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Toplu Fiş Yükleme</h1>
          <p className="text-slate-500 text-sm mt-1">Fişler Gemini ile okunur · Göstergeler fişe eklenir</p>
        </div>
      </div>

      {vehicles.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-slate-600">Varsayılan araç:</span>
          <select value={defaultVehicleId} onChange={(e) => setDefaultVehicleId(e.target.value)} className="max-w-xs">
            <option value="">Seçin</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
          </select>
        </div>
      )}

      {/* Yükleme alanı */}
      <div
        className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center cursor-pointer hover:border-[#DC2626] hover:bg-red-50/30 transition-all"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); e.dataTransfer.files && onFilesSelected(e.dataTransfer.files); }}
      >
        <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="font-semibold text-slate-600">Tüm fotoğrafları buraya sürükle veya tıkla</p>
        <p className="text-sm text-slate-400 mt-1">Fiş ve gösterge karışık olabilir · JPG, PNG</p>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => e.target.files && onFilesSelected(e.target.files)} />
      </div>

      {rows.length > 0 && (
        <>
          {/* İstatistik + butonlar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <span className="text-slate-500">{rows.length} fotoğraf</span>
              <span className="text-amber-600 font-semibold">{fisCount} fiş</span>
              <span className="text-blue-600 font-semibold">{gostergeCount} gösterge</span>
              {readyFis > 0 && <span className="text-green-600 font-semibold">{readyFis} hazır fiş</span>}
            </div>
            <div className="flex gap-2 flex-wrap">
              {gostergeCount > 0 && (
                <button onClick={autoPair} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100">
                  Otomatik Çiftleştir
                </button>
              )}
              {pendingCount > 0 && !processing && (
                <button onClick={processAll} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                  <Loader2 className="w-4 h-4" />
                  Oku ({pendingCount} foto)
                </button>
              )}
              {processing && (
                <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Okunuyor... (~{Math.ceil(fisCount * 4 / 60)} dk)
                </div>
              )}
              {validReady > 0 && !processing && (
                <button onClick={saveAll} disabled={saving}
                  className="flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60">
                  <Save className="w-4 h-4" />
                  {saving ? "Kaydediliyor..." : `Kaydet (${validReady})`}
                </button>
              )}
            </div>
          </div>

          {/* Satırlar */}
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className={`bg-white rounded-xl border p-3 flex gap-3 items-center ${
                row.status === "hata" ? "border-red-200" :
                row.type === "gosterge" ? "border-blue-100" :
                row.status === "hazir" ? "border-green-200" : "border-slate-100"
              }`}>
                {/* Önizleme */}
                <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0 bg-slate-50">
                  <img src={row.previewUrl} alt="" className="w-full h-full object-cover" />
                </div>

                {/* Fiş / Gösterge toggle */}
                <button
                  onClick={() => toggleType(row.id)}
                  disabled={row.status !== "bekliyor"}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-all disabled:cursor-default ${
                    row.type === "fis"
                      ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  }`}
                >
                  {row.type === "fis" ? "FİŞ" : "GÖSTERGE"}
                </button>

                {/* Durum */}
                <div className="flex-shrink-0">
                  {(row.status === "yukleniyor" || row.status === "okunuyor") && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                  {row.status === "hazir" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {row.status === "hata" && <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>

                {/* Alanlar - sadece fiş için */}
                {row.type === "fis" ? (
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-2">
                    <select value={row.vehicleId} onChange={(e) => updateRow(row.id, { vehicleId: e.target.value })} className="text-xs py-1">
                      <option value="">Araç *</option>
                      {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
                    </select>
                    <input type="date" value={row.date || ""} onChange={(e) => updateRow(row.id, { date: e.target.value })} className="text-xs py-1" />
                    <input type="number" step="0.01" value={row.liters ?? ""} onChange={(e) => updateRow(row.id, { liters: parseFloat(e.target.value) || undefined })} placeholder="Litre *" className="text-xs py-1" />
                    <input type="number" step="0.01" value={row.totalAmount ?? ""} onChange={(e) => updateRow(row.id, { totalAmount: parseFloat(e.target.value) || undefined })} placeholder="Tutar ₺ *" className="text-xs py-1 font-bold" />
                    <input type="number" value={row.odometer ?? ""} onChange={(e) => updateRow(row.id, { odometer: parseInt(e.target.value) || undefined })} placeholder="KM" className={`text-xs py-1 ${row.odometer ? "text-green-700 font-semibold" : ""}`} />
                    <select value={row.paymentType} onChange={(e) => updateRow(row.id, { paymentType: e.target.value })} className="text-xs py-1">
                      <option value="nakit">Nakit</option>
                      <option value="veresiye">Veresiye</option>
                      <option value="kart">Kart</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center gap-3 text-xs text-slate-400">
                    {row.pairedWith
                      ? <span className="text-blue-600 font-medium">✓ Fiş ile çiftlendi</span>
                      : "Otomatik Çiftleştir butonuna bas"}
                    {row.odometer && (
                      <span className="text-green-600 font-semibold">{row.odometer.toLocaleString()} km okundu</span>
                    )}
                  </div>
                )}

                <div className="text-xs text-slate-400 flex-shrink-0 min-w-[70px] text-right">
                  {row.status === "bekliyor" && "Bekliyor"}
                  {row.status === "yukleniyor" && <span className="text-blue-500">Yükleniyor</span>}
                  {row.status === "okunuyor" && <span className="text-blue-500">Okunuyor</span>}
                  {row.status === "hazir" && <span className="text-green-600">Hazır</span>}
                  {row.status === "hata" && <span className="text-red-500">Hata</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

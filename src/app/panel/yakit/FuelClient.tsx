"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, X, Fuel, Trash2, TrendingDown, Camera, Image as ImageIcon, Upload } from "lucide-react";
import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/utils";

type FuelEntry = {
  id: string;
  date: Date;
  liters: number;
  pricePerLiter: number | null;
  totalAmount: number;
  odometer: number | null;
  station: string | null;
  paymentType: string;
  notes: string | null;
  parsedFrom: string | null;
  receiptPhoto: string | null;
  odometerPhoto: string | null;
  vehicle: { id: string; plate: string };
  driver: { id: string; name: string } | null;
};

type Vehicle = { id: string; plate: string; brand: string | null; model: string | null };
type Driver = { id: string; name: string };
type MonthStat = { vehicleId: string; _sum: { totalAmount: number | null; liters: number | null } };
type ConsumptionStat = { avgPer100: number; totalKm: number; fillCount: number } | null;

interface Props {
  fuelEntries: FuelEntry[];
  vehicles: Vehicle[];
  drivers: Driver[];
  monthStats: MonthStat[];
  consumptionStats: Record<string, ConsumptionStat>;
}

export default function FuelClient({ fuelEntries, vehicles, drivers, monthStats, consumptionStats }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterVehicle, setFilterVehicle] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [form, setForm] = useState({
    vehicleId: "",
    driverId: "",
    date: new Date().toISOString().split("T")[0],
    liters: "",
    pricePerLiter: "",
    totalAmount: "",
    odometer: "",
    station: "Erkan Pamuk Çırçır",
    paymentType: "veresiye",
    notes: "",
  });
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState<string | null>(null);
  const [odometerPhotoUrl, setOdometerPhotoUrl] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadingOdometer, setUploadingOdometer] = useState(false);
  const [parsing, setParsing] = useState(false);

  const receiptRef = useRef<HTMLInputElement>(null);
  const odometerRef = useRef<HTMLInputElement>(null);

  function set(f: string, v: string) {
    setForm((p) => {
      const next = { ...p, [f]: v };
      if (f === "liters" || f === "pricePerLiter") {
        const l = parseFloat(f === "liters" ? v : p.liters);
        const pp = parseFloat(f === "pricePerLiter" ? v : p.pricePerLiter);
        if (!isNaN(l) && !isNaN(pp)) next.totalAmount = (l * pp).toFixed(2);
      }
      if (f === "totalAmount" && next.liters) {
        const l = parseFloat(next.liters);
        const t = parseFloat(v);
        if (!isNaN(l) && !isNaN(t) && l > 0) next.pricePerLiter = (t / l).toFixed(4);
      }
      return next;
    });
  }

  async function uploadPhoto(file: File, type: "receipt" | "odometer") {
    const setter = type === "receipt" ? setUploadingReceipt : setUploadingOdometer;
    setter(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/fuel/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      if (type === "receipt") {
        setReceiptPhotoUrl(url);
        // Fiş ise Gemini ile otomatik parse et
        parseReceipt(url);
      } else {
        setOdometerPhotoUrl(url);
      }
    } catch {
      toast.error("Fotoğraf yüklenemedi");
    } finally {
      setter(false);
    }
  }

  async function parseReceipt(fileUrl: string) {
    setParsing(true);
    try {
      const res = await fetch("/api/fuel/parse-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
      const { parsed } = await res.json();
      if (!parsed) return;
      setForm((f) => ({
        ...f,
        liters: parsed.liters != null ? String(parsed.liters) : f.liters,
        totalAmount: parsed.totalAmount != null ? String(parsed.totalAmount) : f.totalAmount,
        pricePerLiter: parsed.pricePerLiter != null ? String(parsed.pricePerLiter) : f.pricePerLiter,
        station: parsed.station || f.station,
        date: parsed.date || f.date,
      }));
      toast.success("Fiş okundu, kontrol et");
    } catch {
      // sessizce geç
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vehicleId || !form.liters || !form.totalAmount) {
      toast.error("Araç, litre ve tutar zorunlu");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/fuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          parsedFrom: "manual",
          receiptPhoto: receiptPhotoUrl,
          odometerPhoto: odometerPhotoUrl,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Yakıt kaydedildi!");
      setShowModal(false);
      setForm({ vehicleId: "", driverId: "", date: new Date().toISOString().split("T")[0], liters: "", pricePerLiter: "", totalAmount: "", odometer: "", station: "Erkan Pamuk Çırçır", paymentType: "veresiye", notes: "" });
      setReceiptPhotoUrl(null);
      setOdometerPhotoUrl(null);
      router.refresh();
    } catch { toast.error("Hata oluştu"); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu yakıt kaydı silinsin mi?")) return;
    try {
      await fetch(`/api/fuel/${id}`, { method: "DELETE" });
      toast.success("Silindi");
      router.refresh();
    } catch { toast.error("Silinemedi"); }
  }

  const filtered = filterVehicle ? fuelEntries.filter((e) => e.vehicle.id === filterVehicle) : fuelEntries;
  const totalMonth = fuelEntries.reduce((s, e) => s + e.totalAmount, 0);
  const totalLiters = fuelEntries.reduce((s, e) => s + e.liters, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Yakıt Takibi</h1>
          <p className="text-slate-500 text-sm mt-1">
            Toplam: {totalLiters.toFixed(0)} lt · {formatCurrency(totalMonth)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/panel/yakit/toplu-yukle" className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
            <Upload className="w-4 h-4" />
            Toplu Yükle
          </Link>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" />
            Yakıt Ekle
          </button>
        </div>
      </div>

      {/* Araç bazlı ay özeti */}
      {monthStats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {monthStats.map((stat) => {
            const v = vehicles.find((v) => v.id === stat.vehicleId);
            if (!v) return null;
            return (
              <div key={stat.vehicleId} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                <div className="font-black text-slate-800 text-sm tracking-wider">{v.plate}</div>
                <div className="text-lg font-bold text-[#DC2626] mt-1">{formatCurrency(stat._sum.totalAmount ?? 0)}</div>
                <div className="text-xs text-slate-400">{(stat._sum.liters ?? 0).toFixed(0)} lt</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Yakıt Tüketim Ortalamaları */}
      {vehicles.some((v) => consumptionStats[v.id]) && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Yakıt Tüketim Ortalaması</h2>
            <span className="text-xs text-slate-400">(tüm zamanlar · odometer kayıtlı dolumlardan)</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {vehicles.map((v) => {
              const stat = consumptionStats[v.id];
              if (!stat) return null;
              const kmPerL = 100 / stat.avgPer100;
              const efficiency = stat.avgPer100 < 12 ? "iyi" : stat.avgPer100 < 18 ? "orta" : "yüksek";
              const effColor = efficiency === "iyi" ? "text-green-600 bg-green-50" : efficiency === "orta" ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
              return (
                <div key={v.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-black text-slate-800 text-sm tracking-wider">{v.plate}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${effColor}`}>{efficiency}</span>
                  </div>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl font-black text-slate-800">{stat.avgPer100.toFixed(1)}</span>
                    <span className="text-slate-400 text-sm mb-1">lt/100km</span>
                  </div>
                  <div className="text-sm text-slate-500 font-medium">{kmPerL.toFixed(1)} km/lt</div>
                  <div className="mt-3 pt-3 border-t border-slate-50 flex gap-3 text-xs text-slate-400">
                    <span>{stat.totalKm.toLocaleString("tr-TR")} km</span>
                    <span>{stat.fillCount} dolum</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtre */}
      <div className="flex items-center gap-3">
        <select value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)} className="max-w-xs">
          <option value="">Tüm Araçlar</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
        </select>
        <span className="text-sm text-slate-400">{filtered.length} kayıt</span>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Fuel className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500">Yakıt kaydı yok</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
                  <th className="px-5 py-3 text-left">Tarih</th>
                  <th className="px-5 py-3 text-left">Araç</th>
                  <th className="px-5 py-3 text-left">Şöför</th>
                  <th className="px-5 py-3 text-right">Litre</th>
                  <th className="px-5 py-3 text-right">₺/lt</th>
                  <th className="px-5 py-3 text-right">Tutar</th>
                  <th className="px-5 py-3 text-right">KM</th>
                  <th className="px-5 py-3 text-center">Ödeme</th>
                  <th className="px-5 py-3 text-left">İstasyon</th>
                  <th className="px-5 py-3 text-center">Fotoğraf</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="table-row-hover">
                    <td className="px-5 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(entry.date)}</td>
                    <td className="px-5 py-3"><span className="font-bold text-slate-800 text-sm">{entry.vehicle.plate}</span></td>
                    <td className="px-5 py-3 text-sm text-slate-600">{entry.driver?.name ?? "-"}</td>
                    <td className="px-5 py-3 text-sm text-right text-slate-700">{entry.liters.toFixed(2)}</td>
                    <td className="px-5 py-3 text-sm text-right text-slate-500">{entry.pricePerLiter ? entry.pricePerLiter.toFixed(2) : "-"}</td>
                    <td className="px-5 py-3 text-sm text-right font-bold text-slate-800">{formatCurrency(entry.totalAmount)}</td>
                    <td className="px-5 py-3 text-sm text-right text-slate-500">{entry.odometer ? entry.odometer.toLocaleString("tr-TR") : "-"}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${entry.paymentType === "veresiye" ? "bg-amber-100 text-amber-700" : entry.paymentType === "kart" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                        {entry.paymentType}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">{entry.station ?? "-"}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {entry.receiptPhoto && (
                          <button
                            onClick={() => setLightbox(entry.receiptPhoto!)}
                            title="Fiş"
                            className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}
                        {entry.odometerPhoto && (
                          <button
                            onClick={() => setLightbox(entry.odometerPhoto!)}
                            title="Gösterge"
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        )}
                        {!entry.receiptPhoto && !entry.odometerPhoto && (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold text-slate-700 border-t border-slate-200">
                  <td className="px-5 py-3 text-sm" colSpan={3}>Toplam</td>
                  <td className="px-5 py-3 text-sm text-right">{filtered.reduce((s, e) => s + e.liters, 0).toFixed(2)}</td>
                  <td></td>
                  <td className="px-5 py-3 text-sm text-right text-[#DC2626]">{formatCurrency(filtered.reduce((s, e) => s + e.totalAmount, 0))}</td>
                  <td colSpan={5}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-xl">
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightbox}
            alt="Fotoğraf"
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Fuel className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Yakıt Girişi</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label>Araç *</label>
                  <select value={form.vehicleId} onChange={(e) => set("vehicleId", e.target.value)} required>
                    <option value="">Seçin...</option>
                    {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
                  </select>
                </div>
                <div>
                  <label>Şöför</label>
                  <select value={form.driverId} onChange={(e) => set("driverId", e.target.value)}>
                    <option value="">Seçin...</option>
                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label>Tarih</label>
                  <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label>Litre *</label>
                  <input type="number" step="0.01" value={form.liters} onChange={(e) => set("liters", e.target.value)} placeholder="56.95" required />
                </div>
                <div>
                  <label>₺/Litre</label>
                  <input type="number" step="0.001" value={form.pricePerLiter} onChange={(e) => set("pricePerLiter", e.target.value)} placeholder="67.39" />
                </div>
                <div>
                  <label>Toplam ₺ *</label>
                  <input type="number" step="0.01" value={form.totalAmount} onChange={(e) => set("totalAmount", e.target.value)} placeholder="3837.86" required className="font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>KM (gösterge)</label>
                  <input type="number" value={form.odometer} onChange={(e) => set("odometer", e.target.value)} placeholder="125400" />
                </div>
                <div>
                  <label>Ödeme Tipi</label>
                  <select value={form.paymentType} onChange={(e) => set("paymentType", e.target.value)}>
                    <option value="veresiye">Veresiye</option>
                    <option value="nakit">Nakit</option>
                    <option value="kart">Kart</option>
                  </select>
                </div>
              </div>

              <div>
                <label>İstasyon</label>
                <input type="text" value={form.station} onChange={(e) => set("station", e.target.value)} placeholder="Erkan Pamuk Çırçır" />
              </div>

              <div>
                <label>Notlar</label>
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="resize-none" />
              </div>

              {/* Fotoğraflar */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <p className="text-sm font-semibold text-slate-700">Fotoğraflar</p>

                {/* Fiş */}
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Fiş Fotoğrafı</label>
                  <input
                    ref={receiptRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0], "receipt")}
                  />
                  {receiptPhotoUrl ? (
                    <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-200">
                      <img src={receiptPhotoUrl} alt="Fiş" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setReceiptPhotoUrl(null)}
                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => receiptRef.current?.click()}
                      disabled={uploadingReceipt}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 text-slate-400 rounded-xl text-sm hover:border-amber-300 hover:text-amber-500 transition-all disabled:opacity-50"
                    >
                      <ImageIcon className="w-4 h-4" />
                      {uploadingReceipt ? "Yükleniyor..." : parsing ? "Okunuyor..." : "Fiş fotoğrafı ekle"}
                    </button>
                  )}
                </div>

                {/* Gösterge */}
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Gösterge Paneli Fotoğrafı</label>
                  <input
                    ref={odometerRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0], "odometer")}
                  />
                  {odometerPhotoUrl ? (
                    <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-200">
                      <img src={odometerPhotoUrl} alt="Gösterge" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setOdometerPhotoUrl(null)}
                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => odometerRef.current?.click()}
                      disabled={uploadingOdometer}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 text-slate-400 rounded-xl text-sm hover:border-blue-300 hover:text-blue-500 transition-all disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" />
                      {uploadingOdometer ? "Yükleniyor..." : "Gösterge fotoğrafı ekle"}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">İptal</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
                  {loading ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

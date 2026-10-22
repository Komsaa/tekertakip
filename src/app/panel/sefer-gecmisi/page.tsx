"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

type Point = { latitude: number; longitude: number; timestamp: string };
type History = { points: Point[]; attendances: { id: string; passengerName: string; routeName: string; stopName: string | null; status: string; createdAt: string }[]; truncated: boolean; invalidPointCount: number };
const time = (value?: string) => value ? new Date(value).toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul" }) : "Kayıt yok";

function Trace({ points }: { points: Point[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | undefined;
    setError(false);
    import("leaflet").then(L => {
      if (cancelled || !ref.current) return;
      map = L.map(ref.current);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }).addTo(map);
      let segment: [number, number][] = [];
      const draw = () => { if (segment.length > 1) L.polyline(segment, { color: "#2563eb", weight: 4 }).addTo(map!); };
      points.forEach((p, i) => {
        if (i && Date.parse(p.timestamp) - Date.parse(points[i - 1].timestamp) > 300000) { draw(); segment = []; }
        segment.push([p.latitude, p.longitude]);
        L.circleMarker([p.latitude, p.longitude], { radius: 3, color: "#2563eb" }).bindTooltip(`GPS kayıt saati: ${time(p.timestamp)}`).addTo(map!);
      });
      draw();
      map.fitBounds(L.latLngBounds(points.map(p => [p.latitude, p.longitude])), { padding: [25, 25], maxZoom: 16 });
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; map?.remove(); };
  }, [points]);
  return <>{error && <p role="alert">Harita yüklenemedi. Sayfayı yenileyin.</p>}<div ref={ref} aria-label="Günün kayıtlı GPS noktaları" className="h-80 sm:h-96 rounded-xl relative z-0" /></>;
}

export default function TripHistoryPage() {
  const [date, setDate] = useState(() => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul" }).format(new Date()));
  const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([]);
  const [driverId, setDriverId] = useState("");
  const [data, setData] = useState<History | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [listReady, setListReady] = useState(false);
  const [listTruncated, setListTruncated] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    const timer = setTimeout(() => controller.abort(), 20000);
    setLoading(true); setError(""); setData(null);
    (async () => {
      const query = driverId ? `?driverId=${encodeURIComponent(driverId)}&date=${encodeURIComponent(date)}` : "";
      const res = await fetch(`/api/panel/trip-history${query}`, { signal: controller.signal, cache: "no-store" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Kayıtlar alınamadı.");
      if (!current) return;
      if (!driverId) { setDrivers(result.drivers); setListTruncated(result.truncated); setListReady(true); }
      else setData(result);
    })().catch(e => { if (current) setError(e.name === "AbortError" ? "İstek zaman aşımına uğradı. Tekrar deneyin." : e.message); })
      .finally(() => { clearTimeout(timer); if (current) setLoading(false); });
    return () => { current = false; clearTimeout(timer); controller.abort(); };
  }, [date, driverId, retry]);
  return <div className="max-w-6xl mx-auto space-y-5">
    <div><h1 className="text-2xl font-bold text-slate-900">Sefer Geçmişi</h1><p className="text-slate-500 mt-1">Kayıtlı günlük konum izi ve öğrenci yoklamaları · Türkiye saati</p></div>
    <div className="bg-white border rounded-xl p-4 flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">Tarih<input type="date" min="2017-01-01" value={date} onChange={e => { setData(null); setDate(e.target.value); }} className="border rounded-lg px-3 py-2" /></label>
      <label className="flex flex-col gap-1 text-sm font-medium flex-1 min-w-48">Şoför<select value={driverId} onChange={e => { setData(null); setDriverId(e.target.value); }} className="border rounded-lg px-3 py-2"><option value="">Şoför seçin</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
      <button onClick={() => setRetry(v => v + 1)} className="bg-slate-900 text-white rounded-lg px-4 py-2">Yenile</button>
    </div>
    {listTruncated && <p>Şoför listesi ilk 1.000 kayıtla sınırlıdır.</p>}
    {loading && <p role="status">Kayıtlar yükleniyor…</p>}
    {error && <div role="alert" className="rounded-xl bg-red-50 text-red-800 p-4">{error} <button className="underline" onClick={() => setRetry(v => v + 1)}>Tekrar dene</button></div>}
    {!loading && !error && !driverId && <p>{listReady && !drivers.length ? "Firmanıza ait şoför kaydı yok." : "Geçmiş kayıtları görmek için bir şoför seçin."}</p>}
    {data && !loading && !error && <>
      <section className="bg-white border rounded-xl p-4 space-y-3"><h2 className="font-bold">Günlük konum izi · {data.points.length} GPS noktası</h2>
        {data.points.length ? <Trace points={data.points} /> : <div className="bg-slate-50 rounded-xl p-10 text-center text-slate-500">Bu gün için kayıtlı GPS noktası yok. İz çizilemiyor.</div>}
        {data.points.length === 1 && <p>Tek konum noktası var; sürüş izi oluşturulamıyor.</p>}
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm"><span>İlk GPS kaydı: <b>{time(data.points[0]?.timestamp)}</b></span><span>Son GPS kaydı: <b>{time(data.points[data.points.length - 1]?.timestamp)}</b></span><span>Sefer başlangıç / bitişi: <b>Kayıt yok</b></span></div>
        <p className="text-sm text-slate-500">Bu iz günün tamamına aittir; ayrı seferler belirlenemez. Beş dakikadan uzun GPS boşlukları birleştirilmez. Noktalar arasındaki çizgiler gerçek yol güzergâhını kanıtlamaz.</p>
      </section>
      {(data.truncated || data.invalidPointCount > 0) && <p className="bg-amber-50 p-3 rounded-lg">{data.truncated && "Kayıt sınırına ulaşıldı; günün tüm verileri gösterilemiyor. "}{data.invalidPointCount > 0 && `${data.invalidPointCount} geçersiz konum gösterilmedi.`}</p>}
      <section className="bg-white border rounded-xl p-4"><h2 className="font-bold mb-2">Öğrenci yoklamaları · {data.attendances.length} kayıt</h2>
        <p className="text-sm text-slate-500 mb-4">Saat, yoklama kaydının ilk oluşturulma zamanıdır. Durum son kayıtlı durumdur; son değişiklik ve kesin durak varış saati: kayıt yok. Öğrenci, durak ve güzergâh adları güncel kayıtlardır.</p>
        {!data.attendances.length ? <p className="py-6 text-slate-500">Seçilen gün için yoklama kaydı yok.</p> : <ol className="divide-y">{data.attendances.map(a => <li key={a.id} className="py-4 flex flex-wrap gap-3 items-start"><time className="text-sm font-mono text-slate-500">{time(a.createdAt)}</time><div className="flex-1 min-w-40"><div className="font-semibold">{a.passengerName}</div><div className="text-sm text-slate-500">{a.routeName} · {a.stopName || "Durak: kayıt yok"}</div></div><span className={`rounded-full px-3 py-1 text-sm font-semibold ${a.status === "boarded" ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}>{a.status === "boarded" ? "Bindi" : a.status === "absent" ? "Binmedi" : "Bilinmeyen durum"}</span></li>)}</ol>}
      </section>
    </>}
    <p className="text-sm text-slate-500">GPS noktaları yeni kayıt geldikçe 7 günden sonra silinebilir. Silinmiş konumlar geri getirilemez; bu ekran kalıcı konum arşivi değildir.</p>
  </div>;
}

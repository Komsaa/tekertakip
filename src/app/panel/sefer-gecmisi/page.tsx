"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

type Point = { latitude: number; longitude: number; timestamp: string };
import type { MatchedTrip } from "@/lib/gps-trip-matching";

type History = { matching: { trips: MatchedTrip[]; rejected: number; unmatchedPoints: number; routesTruncated: boolean; routes: {id:string; name:string; geometry:string; missingCoordinates:number; usable:boolean}[] }; points: Point[]; attendances: { id: string; routeId: string; passengerName: string; routeName: string; stopName: string | null; status: string; createdAt: string }[]; truncated: boolean; invalidPointCount: number };
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

const todayTR = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul" }).format(new Date());
const statusLabel = (t: MatchedTrip) => t.status === "finished" ? "Bitişe ulaştı · tahmini" : t.status === "live" ? "Devam ediyor olabilir" : t.kind === "ambiguous" ? "Eşleşme belirsiz" : t.kind === "outside" ? "Güzergâh dışı" : "Kısmi GPS kaydı";

export default function TripHistoryPage() {
  const [date, setDate] = useState(todayTR);
  const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([]);
  const [driverId, setDriverId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [data, setData] = useState<History | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [listTruncated, setListTruncated] = useState(false);
  useEffect(() => {
    if (date !== todayTR() || !driverId) return;
    const timer = setInterval(() => { if (!document.hidden) setRetry(v => v + 1); }, 30000);
    return () => clearInterval(timer);
  }, [date, driverId]);
  useEffect(() => {
    const controller = new AbortController(); let current = true;
    const timer = setTimeout(() => controller.abort(), 30000);
    setLoading(true); setError("");
    (async () => {
      const query = driverId ? `?mode=matches&driverId=${encodeURIComponent(driverId)}&date=${encodeURIComponent(date)}` : "";
      const res = await fetch(`/api/panel/trip-history${query}`, { signal: controller.signal, cache: "no-store" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Kayıtlar alınamadı.");
      if (!current) return;
      if (!driverId) { setDrivers(result.drivers); setListTruncated(result.truncated); }
      else { setData(result); setSelectedId(id => result.matching.trips.some((t: MatchedTrip) => t.id === id) ? id : ""); }
    })().catch(e => { if (current) { setError(e.name === "AbortError" ? "İstek zaman aşımına uğradı. Tekrar deneyin." : e.message); setData(null); } })
      .finally(() => { clearTimeout(timer); if (current) setLoading(false); });
    return () => { current = false; clearTimeout(timer); controller.abort(); };
  }, [date, driverId, retry]);
  const trips = data?.matching.trips ?? [];
  const filtered = trips.filter(t => !routeId || (routeId === "unmatched" ? !t.routeId : t.routeId === routeId));
  const selected = filtered.find(t => t.id === selectedId) ?? filtered.find(t => t.kind === "matched") ?? filtered[0];
  const dailyAttendance = data?.attendances.filter(a => a.routeId === (selected?.routeId || routeId)) ?? [];
  const card = "bg-white border border-slate-200 rounded-2xl p-5";
  return <div className="max-w-6xl mx-auto space-y-5">
    <div><p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Güzergâh ve sürüş kayıtları</p><h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Sefer Geçmişi</h1><p className="text-slate-500 mt-2">GPS ile otomatik eşleştirme · Türkiye saati</p></div>
    <div className={`${card} grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-4 items-end`}>
      <label className="flex flex-col gap-2 text-sm font-medium min-w-0">Tarih<input type="date" min="2017-01-01" value={date} onChange={e => { setData(null); setSelectedId(""); setDate(e.target.value); }} className="border rounded-lg px-3 py-2 min-w-0 w-full" /></label>
      <label className="flex flex-col gap-2 text-sm font-medium min-w-0">Şoför<select value={driverId} onChange={e => { setData(null); setRouteId(""); setSelectedId(""); setDriverId(e.target.value); }} className="border rounded-lg px-3 py-2 min-w-0 w-full"><option value="">Şoför seçin</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
      <button onClick={() => setRetry(v => v + 1)} disabled={loading} className="bg-slate-900 text-white rounded-lg px-5 py-2.5 disabled:opacity-50">{loading ? "Yükleniyor…" : "Yenile"}</button>
    </div>
    {listTruncated && <p>Şoför listesi ilk 1.000 kayıtla sınırlıdır.</p>}
    {loading && <p role="status" className="text-sm text-slate-500">GPS kayıtları güzergâhlarla eşleştiriliyor…</p>}
    {error && <div role="alert" className="rounded-xl bg-red-50 text-red-800 p-4">{error} <button className="underline" onClick={() => setRetry(v => v + 1)}>Tekrar dene</button></div>}
    {!loading && !error && !driverId && <p>{!drivers.length ? "Firmanıza ait şoför kaydı yok." : "Geçmiş kayıtları görmek için bir şoför seçin."}</p>}
    {data && !error && <>
      <div className="rounded-xl bg-amber-50 text-amber-900 p-4 text-sm leading-relaxed">Sefer ayrımı ve ilerleme GPS tahminidir. Ortak yollar, eksik durak koordinatları ve seyrek GPS kayıtları kesin eşleşmeyi engelleyebilir. Kesin sefer başlangıcı, bitişi ve durak varışı ayrıca kaydedilmemiştir.</div>
      {(data.truncated || data.matching.routesTruncated || data.invalidPointCount > 0 || data.matching.rejected > 0) && <p role="status" className="text-sm text-amber-800">{(data.truncated || data.matching.routesTruncated) && "Kayıt sınırına ulaşıldı; sonuçlar eksik olabilir. "}{data.invalidPointCount + data.matching.rejected} geçersiz veya tutarsız GPS noktası eşleştirmeye alınmadı.</p>}
      <div className="flex flex-wrap gap-2" aria-label="Güzergâh filtresi">
        {[{ id: "", name: "Tüm güzergâhlar" }, ...data.matching.routes, { id: "unmatched", name: "Eşleşmeyen / belirsiz" }].map(r => <button key={r.id} onClick={() => { setRouteId(r.id); setSelectedId(""); }} aria-pressed={routeId === r.id} className={`rounded-xl px-4 py-3 text-sm border ${routeId === r.id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200"}`}>{r.name}{r.id && <span className="ml-2 opacity-70">{trips.filter(t => r.id === "unmatched" ? !t.routeId : t.routeId === r.id).length}</span>}</button>)}
      </div>
      {data.matching.routes.some(r => !r.usable) && <p className="text-sm text-amber-800">Koordinatı eksik güzergâhlar: {data.matching.routes.filter(r => !r.usable).map(r => r.name).join(", ")}. Eşleştirmek için en az iki durak koordinatı gerekli.</p>}
      {data.matching.routes.some(r => r.missingCoordinates > 0 || r.geometry !== "road") && <p className="text-sm text-amber-800">Bazı durakların koordinatı veya yol geometrisi eksik. Eşleştirme yaklaşık; bu güzergâhlarda varış tahmini gösterilmez. {data.matching.routes.filter(r => r.missingCoordinates > 0).map(r => `${r.name}: ${r.missingCoordinates} eksik koordinat`).join(" · ")}</p>}
      {!filtered.length ? <section className={`${card} py-10 text-center`}><h2 className="font-semibold">{data.points.length ? "Bu güzergâhta eşleşen GPS kaydı yok" : "Bu gün için GPS kaydı yok"}</h2><p className="text-sm text-slate-500 mt-2">Kayıt olmaması sefer yapılmadığı anlamına gelmez.</p></section> : <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-5 items-start">
        <section className={`${card} !p-3`}><h2 className="font-semibold px-2 pt-2 pb-3">Sürüş bölümleri · {filtered.length}</h2><ol className="space-y-2 max-h-[640px] overflow-y-auto">{filtered.map((t, i) => <li key={t.id}><button className={`text-left w-full rounded-xl p-3 border ${selected?.id === t.id ? "border-slate-800 bg-slate-50" : "border-transparent hover:bg-slate-50"}`} onClick={() => setSelectedId(t.id)} aria-pressed={selected?.id === t.id}><span className="text-xs text-slate-500">{i + 1}. bölüm · {time(t.firstAt)}–{time(t.lastAt)}</span><span className="block font-semibold mt-1">{t.routeName}</span><span className="block text-xs mt-2 text-slate-500">{statusLabel(t)} · {t.points.length} GPS</span></button></li>)}</ol></section>
        {selected && <section className={`${card} space-y-4 min-w-0`}>
          <div><p className="text-xs uppercase tracking-wider text-slate-500">Tahmini sefer detayı</p><h2 className="text-xl font-bold mt-1">{selected.routeName}</h2><p className="text-sm text-slate-500 mt-1">{statusLabel(selected)} · {selected.direction === "forward" ? "Kayıtlı durak sırası yönünde" : selected.direction === "reverse" ? "Ters yönde" : "Yön için veri yetersiz"}</p></div>
          <Trace key={selected.id} points={selected.points} />
          {selected.kind === "matched" && <><div className="grid sm:grid-cols-3 gap-3"><div className="bg-slate-50 p-3 rounded-xl"><p className="text-xs text-slate-500">Güzergâhta tahmini ilerleme</p><b className="text-xl">{selected.progress == null ? "Yetersiz veri" : `~%${selected.progress}`}</b></div><div className="bg-slate-50 p-3 rounded-xl"><p className="text-xs text-slate-500">GPS ile gözlenen bölüm</p><b className="text-xl">{selected.coverage == null ? "Yetersiz veri" : `~%${selected.coverage}`}</b></div><div className="bg-slate-50 p-3 rounded-xl"><p className="text-xs text-slate-500">Son durağa tahmini kalan</p><b className="text-xl">{selected.etaMinutes == null ? "Hesaplanamıyor" : `~${selected.etaMinutes} dk`}</b></div></div>
          {selected.progress != null && <progress value={selected.progress} max={100} aria-label="Tahmini güzergâh ilerlemesi" className="w-full h-2 accent-green-700" />}
          <p className="text-xs text-slate-500">İlerleme, seçilen yönde güzergâh üzerindeki konumdur; tüm yolun sürüldüğünü kanıtlamaz. Varış yalnızca taze ve yeterli GPS ile hesaplanır; trafik ve beklemeler hesaba katılmaz. Eşleşme güveni: {selected.confidence === "medium" ? "orta" : "düşük"}.</p></>}
          <div className="text-sm flex flex-wrap gap-4"><span>İlk GPS: <b>{time(selected.firstAt)}</b></span><span>Son GPS: <b>{time(selected.lastAt)}</b></span><span>Kesin sefer başlangıç/bitişi: kayıt yok</span></div>
          {!!selected.stopVisits.length && <div><h3 className="font-semibold mb-2">Durak yakınındaki GPS gözlemleri</h3><ol className="divide-y">{selected.stopVisits.map(s => <li key={s.id} className="py-2 flex justify-between gap-3 text-sm"><span>{s.name}</span><span className="text-slate-500 shrink-0">{s.observedAt ? time(s.observedAt) : "Gözlem yok"}</span></li>)}</ol><p className="text-xs text-slate-500 mt-2">150 metre yakınındaki ilk GPS kaydı gösterilir; kesin varış veya yolcu indirme saati değildir.</p></div>}
        </section>}
      </div>}
      {(selected?.routeId || (routeId && routeId !== "unmatched")) && <section className={card}><h2 className="font-semibold">Güzergâhın günlük yoklaması · {dailyAttendance.length} kayıt</h2><p className="text-sm text-slate-500 my-3">Bu kayıtlar gün ve güzergâha aittir; aynı günün ayrı seferlerine kesin bağlanamaz. Saat ilk kayıt zamanı, durum son kayıtlı durumdur.</p>{dailyAttendance.length ? <ol className="divide-y">{dailyAttendance.map(a => <li key={a.id} className="py-3 flex flex-wrap gap-3 text-sm"><time className="text-slate-500">{time(a.createdAt)}</time><div className="flex-1 min-w-40"><b>{a.passengerName}</b><p className="text-slate-500">{a.stopName ?? "Durak kaydı yok"}</p></div><span className={a.status === "boarded" ? "text-green-700" : "text-amber-700"}>{a.status === "boarded" ? "Bindi" : a.status === "absent" ? "Binmedi" : "Bilinmiyor"}</span></li>)}</ol> : <p className="text-sm text-slate-500">Bu gün için yoklama kaydı yok.</p>}</section>}
    </>}
    <p className="text-xs text-slate-500 leading-relaxed">Eşleştirme mevcut güzergâh koordinatlarıyla yapılır. 10 dakikadan uzun GPS boşlukları ayrı bölüm sayılır; bir bölüm her zaman ayrı sefer değildir. Konumlar 7 günden sonra silinebilir; kalıcı arşiv yoktur. Bugünün ekranı 30 saniyede bir yenilenir.</p>
  </div>;
}

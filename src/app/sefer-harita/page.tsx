"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { roadRoute, validPoint } from "@/lib/road-route";

type Stop = { id: string; name: string; lat: number | null; lng: number | null; order: number; estimatedTime: string };
type Data = {
  driverLocation: { lat: number | null; lng: number | null; isTracking: boolean; lastAt: string | null } | null;
  myStopId: string; stops: Stop[]; routeName: string;
};
export default function SeferHaritaPage() {
  return <Suspense fallback={<div>Harita yükleniyor…</div>}><SeferHarita /></Suspense>;
}
function SeferHarita() {
  const token = useSearchParams().get("token");
  const container = useRef<HTMLDivElement>(null);
  const leaflet = useRef<{ L: any; map: any } | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [routeError, setRouteError] = useState("");
  const [updated, setUpdated] = useState("");
  useEffect(() => {
    if (!token || !container.current) return;
    const controller = new AbortController();
    let interval: ReturnType<typeof setInterval> | undefined;
    let routeController: AbortController | undefined;
    let lastRoute = "";
    let road: any;
    let first = true;
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css"; link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    import("leaflet").then(({ default: L }) => {
      if (controller.signal.aborted || !container.current) return;
      const map = L.map(container.current).setView([38.9, 35], 6);
      leaflet.current = { L, map };
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
      const markers = L.layerGroup().addTo(map);
      let fetching = false;
      async function refresh() {
        if (fetching) return;
        fetching = true;
        try {
          const res = await fetch("/api/mobile/veli/harita", {
            headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal,
          });
          if (!res.ok) throw new Error(res.status === 401 || res.status === 403 ? "Oturum geçersiz; tekrar giriş yapın." : "Konum bilgisi alınamadı.");
          const json: Data = await res.json();
          if (controller.signal.aborted) return;
          setData(json); setError(""); setUpdated(new Date().toLocaleTimeString("tr-TR"));
          markers.clearLayers();
          const stops = [...json.stops].sort((a,b) => a.order - b.order).filter(validPoint);
          const bounds: [number, number][] = [];
          for (const stop of stops) {
            const own = stop.id === json.myStopId;
            const popup = document.createElement("div");
            popup.textContent = `${stop.name} · ${stop.estimatedTime}${own ? " ★ Durağınız" : ""}`;
            L.circleMarker([stop.lat!, stop.lng!], { radius: own ? 11 : 8, color: "#fff", weight: 2, fillColor: own ? "#dc2626" : "#1b2437", fillOpacity: 1 }).addTo(markers).bindPopup(popup);
            bounds.push([stop.lat!, stop.lng!]);
          }
          const driver = json.driverLocation;
          if (driver && validPoint(driver)) {
            const icon = L.divIcon({ html: '<div style="font-size:30px">🚌</div>', className: "", iconSize: [36,36] });
            L.marker([driver.lat, driver.lng], { icon }).addTo(markers).bindPopup("Servis aracı");
            bounds.push([driver.lat, driver.lng]);
          }
          if (first && bounds.length) { map.fitBounds(bounds, { padding: [40,40], maxZoom: 16 }); first = false; }
          const key = JSON.stringify(stops.map(s => [s.lat, s.lng]));
          if (key !== lastRoute) {
            lastRoute = key;
            routeController?.abort();
            routeController = new AbortController();
            const request = routeController;
            road?.remove(); road = null; setRouteError("");
            if (stops.length > 1) roadRoute(stops, request.signal).then(line => {
              if (!controller.signal.aborted && !request.signal.aborted) road = L.polyline(line, { color: "#2563eb", weight: 4 }).addTo(map);
            }).catch(() => {
              if (!controller.signal.aborted && !request.signal.aborted) {
                setRouteError("Yol hesaplanamadı; yalnızca duraklar gösteriliyor.");
                lastRoute = ""; // retry on the next refresh
              }
            });
          }
        } catch (e) {
          if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Bağlantı hatası.");
        } finally { fetching = false; }
      }
      void refresh();
      interval = setInterval(refresh, 15000);
    }).catch(() => { if (!controller.signal.aborted) setError("Harita yüklenemedi. Sayfayı yenileyin."); });
    return () => {
      controller.abort(); routeController?.abort(); clearInterval(interval);
      leaflet.current?.map.remove(); leaflet.current = null;
    };
  }, [token]);
  if (!token) return <p>Geçersiz bağlantı.</p>;
  return <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#1b2437", color: "white" }}>
    <header style={{ padding: "10px 16px" }}><strong>TekerTakip</strong> · {data?.routeName} {updated && <small>↻ {updated}</small>}</header>
    {(error || routeError) && <div role="status" style={{ padding: 8, background: "#78350f" }}>{error || routeError}</div>}
    <div ref={container} style={{ flex: 1, minHeight: 0 }} />
    <footer style={{ padding: 10, fontSize: 12 }}>
      {data?.driverLocation?.isTracking ? "GPS aktif · 15 sn'de bir yenilenir" : "Servis henüz harekete geçmedi"}<br />
      Kırmızı: durağınız · 🚌: servis · Yol çizgisi önerilen rotadır.
    </footer>
  </div>;
}

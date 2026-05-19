"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type Stop = { id: string; name: string; lat: number | null; lng: number | null; order: number; estimatedTime: string };
type Data = {
  driverLocation: { lat: number | null; lng: number | null; isTracking: boolean; lastAt: string | null } | null;
  myStopId: string;
  stops: Stop[];
  routeName: string;
};

export default function SeferHaritaPage() {
  return (
    <Suspense fallback={<div style={{ height: "100dvh", background: "#1B2437" }} />}>
      <SeferHarita />
    </Suspense>
  );
}

function SeferHarita() {
  const params = useSearchParams();
  const token = params.get("token");
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");

  async function fetchData() {
    if (!token) return;
    try {
      const res = await fetch("/api/mobile/veli/harita", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) { setError("Oturum geçersiz."); return; }
      const json: Data = await res.json();
      setData(json);
      setLastUpdate(new Date().toLocaleTimeString("tr-TR"));
      return json;
    } catch {
      setError("Bağlantı hatası.");
    }
  }

  // Haritayı başlat
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = async () => {
      const L = (window as any).L;
      const map = L.map(mapRef.current, { zoomControl: true }).setView([38.9, 35.0], 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);
      leafletRef.current = { map, L };

      const json = await fetchData();
      if (json) renderMarkers(json, L, map);
    };
    document.head.appendChild(script);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderMarkers(json: Data, L: any, map: any) {
    // Eski şöför markerını temizle
    if (driverMarkerRef.current) {
      driverMarkerRef.current.remove();
      driverMarkerRef.current = null;
    }

    const bounds: [number, number][] = [];

    // Durakları çiz
    json.stops.forEach((s) => {
      if (!s.lat || !s.lng) return;
      const isMyStop = s.id === json.myStopId;
      const color = isMyStop ? "#DC2626" : "#1B2437";
      const icon = L.divIcon({
        html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid #fff;
               box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;
               color:#fff;font-weight:900;font-size:11px;">${s.order}</div>`,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const marker = L.marker([s.lat, s.lng], { icon }).addTo(map);
      marker.bindPopup(`<b>${s.name}</b><br>${s.estimatedTime}${isMyStop ? "<br><b style='color:#DC2626'>★ Durağınız</b>" : ""}`);
      if (isMyStop) marker.openPopup();
      bounds.push([s.lat, s.lng]);
    });

    // Güzergah çizgisi
    const line = json.stops.filter((s) => s.lat && s.lng).map((s) => [s.lat!, s.lng!] as [number, number]);
    if (line.length > 1) {
      L.polyline(line, { color: "#1B2437", weight: 3, opacity: 0.5, dashArray: "6,4" }).addTo(map);
    }

    // Şöför konumu
    if (json.driverLocation?.lat && json.driverLocation?.lng) {
      const driverIcon = L.divIcon({
        html: `<div style="width:40px;height:40px;border-radius:50%;background:#16a34a;border:3px solid #fff;
               box-shadow:0 2px 10px rgba(22,163,74,0.5);display:flex;align-items:center;justify-content:center;font-size:20px;">🚌</div>`,
        className: "",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      driverMarkerRef.current = L.marker(
        [json.driverLocation.lat, json.driverLocation.lng],
        { icon: driverIcon, zIndexOffset: 1000 }
      ).addTo(map).bindPopup("Servis aracı");
      bounds.push([json.driverLocation.lat, json.driverLocation.lng]);
    }

    if (bounds.length > 0) map.fitBounds(bounds, { padding: [40, 40] });
  }

  // Her 15 saniyede bir yenile — sadece şöför markerını güncelle
  useEffect(() => {
    const interval = setInterval(async () => {
      const json = await fetchData();
      if (!json || !leafletRef.current) return;
      const { L, map } = leafletRef.current;
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
        driverMarkerRef.current = null;
      }
      if (json.driverLocation?.lat && json.driverLocation?.lng) {
        const driverIcon = L.divIcon({
          html: `<div style="width:40px;height:40px;border-radius:50%;background:#16a34a;border:3px solid #fff;
                 box-shadow:0 2px 10px rgba(22,163,74,0.5);display:flex;align-items:center;justify-content:center;font-size:20px;">🚌</div>`,
          className: "",
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
        driverMarkerRef.current = L.marker(
          [json.driverLocation.lat, json.driverLocation.lng],
          { icon: driverIcon, zIndexOffset: 1000 }
        ).addTo(map).bindPopup("Servis aracı");
      }
    }, 15_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) return <div style={styles.center}>Geçersiz bağlantı.</div>;
  if (error) return <div style={styles.center}>{error}</div>;

  return (
    <div style={{ height: "100dvh", width: "100%", display: "flex", flexDirection: "column", background: "#1B2437" }}>
      {/* Başlık */}
      <div style={styles.header}>
        <span style={styles.brand}>teker<span style={{ color: "#DC2626" }}>takip</span></span>
        {data && <span style={styles.routeName}>{data.routeName}</span>}
        {lastUpdate && <span style={styles.updateTime}>↻ {lastUpdate}</span>}
      </div>

      {/* Harita */}
      <div ref={mapRef} style={{ flex: 1 }} />

      {/* Alt bilgi */}
      <div style={styles.footer}>
        <span style={{ color: "#94a3b8", fontSize: 12 }}>
          {data?.driverLocation?.isTracking
            ? "🟢 GPS takibi aktif — 15 sn'de bir güncelleniyor"
            : "⚪ Servis henüz harekete geçmedi"}
        </span>
        {data && (
          <span style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>
            ★ Kırmızı = durağınız &nbsp;|&nbsp; 🚌 = servis aracı
          </span>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  center: { height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1B2437", color: "#fff", fontSize: 16 },
  header: {
    background: "#1B2437", padding: "10px 16px", display: "flex",
    alignItems: "center", gap: 12, flexWrap: "wrap", flexShrink: 0,
  },
  brand: { color: "#fff", fontWeight: 900, fontSize: 16, letterSpacing: 1, fontFamily: "sans-serif" },
  routeName: { color: "#94a3b8", fontSize: 13, fontFamily: "sans-serif", flex: 1 },
  updateTime: { color: "#475569", fontSize: 11, fontFamily: "sans-serif" },
  footer: {
    background: "#1B2437", padding: "8px 16px", display: "flex",
    flexDirection: "column", flexShrink: 0,
  },
};

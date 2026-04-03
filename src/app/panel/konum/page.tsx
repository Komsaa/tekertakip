"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, RefreshCw, Wifi, WifiOff } from "lucide-react";

type DriverLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  lastLocationAt: string;
  isTracking: boolean;
  vehicle: { plate: string } | null;
};

export default function KonumPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markers = useRef<Record<string, any>>({});
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/panel/konum");
      if (!res.ok) return;
      const data: DriverLocation[] = await res.json();
      setDrivers(data);
      setLastUpdate(new Date());
      updateMarkers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  function updateMarkers(data: DriverLocation[]) {
    if (!leafletMap.current) return;
    const L = (window as any).L;

    // Var olan markerları temizle
    Object.values(markers.current).forEach((m: any) => m.remove());
    markers.current = {};

    data.forEach((d) => {
      const isActive = d.isTracking && isRecent(d.lastLocationAt);
      const color = isActive ? "#16a34a" : "#94a3b8";

      const icon = L.divIcon({
        className: "",
        html: `<div style="
          background:${color};
          width:36px;height:36px;border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
        "><div style="transform:rotate(45deg);color:white;font-size:14px;font-weight:700">🚌</div></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -40],
      });

      const ago = timeSince(d.lastLocationAt);
      const popup = `
        <div style="font-family:sans-serif;min-width:160px">
          <div style="font-weight:700;font-size:15px;margin-bottom:4px">${d.name}</div>
          ${d.vehicle ? `<div style="color:#DC2626;font-weight:600;margin-bottom:4px">${d.vehicle.plate}</div>` : ""}
          <div style="font-size:12px;color:${isActive ? "#16a34a" : "#94a3b8"}">
            ${isActive ? "● Aktif" : "○ Pasif"} · ${ago}
          </div>
        </div>
      `;

      const marker = L.marker([d.latitude, d.longitude], { icon })
        .addTo(leafletMap.current)
        .bindPopup(popup);

      markers.current[d.id] = marker;
    });

    // İlk yüklemede haritayı konumlara göre ayarla
    if (data.length > 0 && Object.keys(markers.current).length > 0) {
      const group = L.featureGroup(Object.values(markers.current));
      leafletMap.current.fitBounds(group.getBounds().pad(0.3));
    }
  }

  useEffect(() => {
    // Leaflet CSS yükle
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Leaflet JS yükle
    if ((window as any).L) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    }

    function initMap() {
      if (!mapRef.current || leafletMap.current) return;
      const L = (window as any).L;
      leafletMap.current = L.map(mapRef.current).setView([38.7, 28.0], 10);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(leafletMap.current);
      fetchLocations();
    }

    const interval = setInterval(fetchLocations, 30_000);
    return () => clearInterval(interval);
  }, [fetchLocations]);

  function isRecent(dateStr: string) {
    return Date.now() - new Date(dateStr).getTime() < 5 * 60 * 1000; // 5 dakika
  }

  function timeSince(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}sn önce`;
    if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
    return `${Math.floor(diff / 3600)}sa önce`;
  }

  const activeCount = drivers.filter((d) => d.isTracking && isRecent(d.lastLocationAt)).length;

  return (
    <div className="flex flex-col h-full">
      {/* Üst bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-[#DC2626]" />
          <h1 className="text-xl font-bold text-slate-800">Canlı Konum</h1>
          <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
            {activeCount} aktif
          </span>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-slate-400">
              Son güncelleme: {lastUpdate.toLocaleTimeString("tr-TR")}
            </span>
          )}
          <button
            onClick={fetchLocations}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Yenile
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Harita */}
        <div ref={mapRef} className="flex-1" style={{ minHeight: 400 }} />

        {/* Şöför listesi */}
        <div className="w-64 bg-white border-l border-slate-200 overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Şöförler</p>
          </div>
          {drivers.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">
              Henüz konum paylaşan şöför yok
            </div>
          ) : (
            drivers.map((d) => {
              const active = d.isTracking && isRecent(d.lastLocationAt);
              return (
                <button
                  key={d.id}
                  onClick={() => {
                    if (markers.current[d.id] && leafletMap.current) {
                      leafletMap.current.setView([d.latitude, d.longitude], 15);
                      markers.current[d.id].openPopup();
                    }
                  }}
                  className="w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {active ? (
                      <Wifi className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <WifiOff className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{d.name}</p>
                      {d.vehicle && (
                        <p className="text-xs text-[#DC2626] font-medium">{d.vehicle.plate}</p>
                      )}
                      <p className="text-xs text-slate-400">{timeSince(d.lastLocationAt)}</p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

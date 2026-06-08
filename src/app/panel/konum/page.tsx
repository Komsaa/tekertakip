"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, RefreshCw, Wifi, WifiOff } from "lucide-react";

type BoardingInfo = {
  total: number;
  boarded: number;
  passengers: { name: string; boarded: boolean }[];
} | null;

type DriverLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  lastLocationAt: string;
  isTracking: boolean;
  vehicle: { plate: string } | null;
  boardingInfo: BoardingInfo;
};

function buildIcon(L: any, d: DriverLocation) {
  const active = d.isTracking && isRecent(d.lastLocationAt);
  const color = active ? "#16a34a" : "#94a3b8";
  const bi = d.boardingInfo;

  const badge = bi
    ? `<div style="position:absolute;top:-7px;right:-14px;background:${bi.boarded >= bi.total && bi.total > 0 ? "#16a34a" : "#DC2626"};color:white;border-radius:8px;padding:1px 5px;font-size:9px;font-weight:900;border:1.5px solid white;white-space:nowrap;z-index:10">${bi.boarded}/${bi.total}</div>`
    : "";

  const plate = d.vehicle
    ? `<div style="background:#1B2437;color:white;border-radius:4px;padding:2px 5px;font-size:9px;font-weight:800;margin-top:3px;letter-spacing:0.5px;box-shadow:0 1px 4px rgba(0,0,0,0.4);white-space:nowrap">${d.vehicle.plate}</div>`
    : "";

  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;width:64px">
      <div style="position:relative;width:36px;height:36px">
        <div style="background:${color};width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center">
          <span style="transform:rotate(45deg);font-size:14px">🚌</span>
        </div>
        ${badge}
      </div>
      ${plate}
    </div>`;

  return L.divIcon({
    className: "",
    html,
    iconSize: [64, 54],
    iconAnchor: [32, 36],
    popupAnchor: [0, -40],
    tooltipAnchor: [20, -20],
  });
}

function buildPopup(d: DriverLocation) {
  const active = d.isTracking && isRecent(d.lastLocationAt);
  const ago = timeSince(d.lastLocationAt);
  return `
    <div style="font-family:sans-serif;min-width:160px">
      <div style="font-weight:800;font-size:15px;margin-bottom:3px">${d.name}</div>
      ${d.vehicle ? `<div style="color:#DC2626;font-weight:700;margin-bottom:3px">${d.vehicle.plate}</div>` : ""}
      <div style="font-size:12px;color:${active ? "#16a34a" : "#94a3b8"}">${active ? "● Aktif" : "○ Pasif"} · ${ago}</div>
    </div>`;
}

function buildTooltip(d: DriverLocation) {
  const bi = d.boardingInfo;
  if (!bi) return null;
  const rows = bi.passengers
    .map(p => `<div style="display:flex;align-items:center;gap:6px;padding:1.5px 0;font-size:11px">
      <span style="color:${p.boarded ? "#16a34a" : "#DC2626"};font-weight:700">${p.boarded ? "✓" : "○"}</span>
      <span style="color:${p.boarded ? "#1e293b" : "#94a3b8"}">${p.name}</span>
    </div>`)
    .join("");
  return `
    <div style="font-family:sans-serif;min-width:170px;max-width:220px">
      <div style="font-weight:800;font-size:12px;margin-bottom:6px;color:#1e293b">
        👥 ${bi.boarded}/${bi.total} öğrenci bindi
      </div>
      ${rows}
    </div>`;
}

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

    Object.values(markers.current).forEach((m: any) => m.remove());
    markers.current = {};

    data.forEach((d) => {
      const tooltip = buildTooltip(d);
      const marker = L.marker([d.latitude, d.longitude], { icon: buildIcon(L, d) })
        .addTo(leafletMap.current)
        .bindPopup(buildPopup(d));

      if (tooltip) {
        marker.bindTooltip(tooltip, { direction: "top", offset: [0, -38], opacity: 1 });
      }

      markers.current[d.id] = marker;
    });

    if (data.length > 0 && Object.keys(markers.current).length > 0) {
      const group = L.featureGroup(Object.values(markers.current));
      leafletMap.current.fitBounds(group.getBounds().pad(0.3));
    }
  }

  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

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

  const activeCount = drivers.filter((d) => d.isTracking && isRecent(d.lastLocationAt)).length;

  return (
    <div className="flex flex-col h-full">
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
        <div ref={mapRef} className="flex-1" style={{ minHeight: 400 }} />

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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700">{d.name}</p>
                      {d.vehicle && (
                        <p className="text-xs text-[#DC2626] font-medium">{d.vehicle.plate}</p>
                      )}
                      <p className="text-xs text-slate-400">{timeSince(d.lastLocationAt)}</p>
                    </div>
                    {d.boardingInfo && (
                      <div className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${d.boardingInfo.boarded >= d.boardingInfo.total && d.boardingInfo.total > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {d.boardingInfo.boarded}/{d.boardingInfo.total}
                      </div>
                    )}
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

function isRecent(dateStr: string) {
  return Date.now() - new Date(dateStr).getTime() < 5 * 60 * 1000;
}

function timeSince(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}sn önce`;
  if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
  return `${Math.floor(diff / 3600)}sa önce`;
}

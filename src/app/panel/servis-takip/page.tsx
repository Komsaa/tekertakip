"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin, RefreshCw, Wifi, WifiOff, ChevronDown, ChevronUp,
  Bus, User, Phone, CheckCircle, XCircle, Clock, AlertTriangle,
} from "lucide-react";

type Passenger = {
  id: string;
  name: string;
  parentName: string | null;
  parentPhone: string | null;
  status: "boarded" | "absent" | null;
};

type Stop = {
  id: string;
  name: string;
  estimatedTime: string;
  lat: number | null;
  lng: number | null;
  passengers: Passenger[];
  total: number;
  boarded: number;
  absent: number;
};

type Driver = {
  id: string;
  name: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  lastLocationAt: string | null;
  isTracking: boolean;
  active: boolean | null;
};

type Route = {
  id: string;
  name: string;
  type: string;
  weekdaysOnly: boolean;
  driver: Driver | null;
  vehicle: { id: string; plate: string; brand: string | null; model: string | null } | null;
  stops: Stop[];
  stats: { total: number; boarded: number; absent: number; unknown: number };
};

const TYPE_LABELS: Record<string, string> = {
  okul: "Okul Servisi",
  personel: "Personel",
  ozel: "Özel",
  transfer: "Transfer",
};

const TYPE_COLORS: Record<string, string> = {
  okul: "bg-blue-100 text-blue-700",
  personel: "bg-purple-100 text-purple-700",
  ozel: "bg-amber-100 text-amber-700",
  transfer: "bg-green-100 text-green-700",
};

function timeSince(dateStr: string | null) {
  if (!dateStr) return "Bilinmiyor";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}sn önce`;
  if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
  return `${Math.floor(diff / 3600)}sa önce`;
}

function ProgressBar({ boarded, absent, total }: { boarded: number; absent: number; total: number }) {
  if (total === 0) return null;
  const boardedPct = (boarded / total) * 100;
  const absentPct = (absent / total) * 100;
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
      <div className="bg-green-500 transition-all" style={{ width: `${boardedPct}%` }} />
      <div className="bg-red-400 transition-all" style={{ width: `${absentPct}%` }} />
    </div>
  );
}

function RouteCard({ route, onDriverClick }: { route: Route; onDriverClick: (r: Route) => void }) {
  const [expanded, setExpanded] = useState(false);
  const { stats } = route;
  const allBoarded = stats.total > 0 && stats.boarded === stats.total;
  const hasAbsent = stats.absent > 0;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
      allBoarded ? "border-green-200" : hasAbsent ? "border-amber-200" : "border-slate-100"
    }`}>
      {/* Kart başlığı */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${TYPE_COLORS[route.type] ?? "bg-slate-100 text-slate-600"}`}>
                {TYPE_LABELS[route.type] ?? route.type}
              </span>
              {allBoarded && (
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  ✓ Tamamlandı
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-800 text-base">{route.name}</h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              {route.vehicle && (
                <span className="font-semibold text-[#DC2626]">{route.vehicle.plate}</span>
              )}
              {route.driver && (
                <span>{route.driver.name}</span>
              )}
            </div>
          </div>

          {/* İstatistikler */}
          {stats.total > 0 && (
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-center">
                <div className="text-lg font-black text-green-600">{stats.boarded}</div>
                <div className="text-[10px] text-slate-400">Bindi</div>
              </div>
              {stats.absent > 0 && (
                <div className="text-center">
                  <div className="text-lg font-black text-red-500">{stats.absent}</div>
                  <div className="text-[10px] text-slate-400">Binmedi</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-lg font-black text-slate-400">{stats.total}</div>
                <div className="text-[10px] text-slate-400">Toplam</div>
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {stats.total > 0 && (
          <div className="mt-3">
            <ProgressBar boarded={stats.boarded} absent={stats.absent} total={stats.total} />
          </div>
        )}

        {/* Şöför durumu + genişlet butonu */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {route.driver ? (
              <button
                onClick={() => onDriverClick(route)}
                className="flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity"
              >
                {route.driver.active ? (
                  <><Wifi className="w-3 h-3 text-green-500" /><span className="text-green-600 font-medium">Aktif</span></>
                ) : (
                  <><WifiOff className="w-3 h-3 text-slate-400" /><span className="text-slate-400">{timeSince(route.driver.lastLocationAt)}</span></>
                )}
              </button>
            ) : (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3" /> Şöför atanmamış
              </span>
            )}
          </div>
          {route.stops.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? "Gizle" : `${route.stops.length} durak`}
            </button>
          )}
        </div>
      </div>

      {/* Durak listesi */}
      {expanded && (
        <div className="border-t border-slate-100">
          {route.stops.map((stop, idx) => (
            <div key={stop.id} className="px-5 py-3 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-shrink-0 w-5 h-5 bg-[#1B2437] text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-slate-700">{stop.name}</span>
                  {stop.estimatedTime && (
                    <span className="ml-2 text-xs text-slate-400 flex-shrink-0 inline-flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />{stop.estimatedTime}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs flex-shrink-0">
                  <span className="text-green-600 font-semibold">{stop.boarded}✓</span>
                  {stop.absent > 0 && <span className="text-red-500 font-semibold">{stop.absent}✗</span>}
                  <span className="text-slate-400">/{stop.total}</span>
                </div>
              </div>

              {stop.passengers.length > 0 && (
                <div className="ml-7 space-y-1">
                  {stop.passengers.map(p => (
                    <div key={p.id} className={`flex items-center gap-2 py-1 px-2 rounded-lg text-xs ${
                      p.status === "boarded" ? "bg-green-50" :
                      p.status === "absent" ? "bg-red-50" : "bg-slate-50"
                    }`}>
                      {p.status === "boarded" ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      ) : p.status === "absent" ? (
                        <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                      )}
                      <span className={`font-medium flex-1 ${
                        p.status === "boarded" ? "text-green-700" :
                        p.status === "absent" ? "text-red-600" : "text-slate-500"
                      }`}>{p.name}</span>
                      {p.parentName && (
                        <span className="text-slate-400 hidden sm:inline">{p.parentName}</span>
                      )}
                      {p.parentPhone && (
                        <a href={`tel:${p.parentPhone}`} className="text-slate-400 hover:text-[#DC2626]">
                          <Phone className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ServisTakipPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [today, setToday] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<"all" | "okul" | "personel" | "transfer">("all");
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markers = useRef<Record<string, any>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/panel/servis-takip");
      if (!res.ok) return;
      const data = await res.json();
      setRoutes(data.routes ?? []);
      setToday(data.today ?? "");
      setLastUpdate(new Date());
      updateMapMarkers(data.routes ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  function updateMapMarkers(data: Route[]) {
    if (!leafletMap.current) return;
    const L = (window as any).L;
    Object.values(markers.current).forEach((m: any) => m.remove());
    markers.current = {};

    data.forEach(route => {
      const d = route.driver;
      if (!d || d.latitude == null || d.longitude == null) return;
      const isActive = d.active;
      const color = isActive ? "#16a34a" : "#94a3b8";
      const { stats } = route;

      const badge = stats.total > 0
        ? `<div style="position:absolute;top:-7px;right:-14px;background:${stats.boarded === stats.total ? "#16a34a" : "#DC2626"};color:white;border-radius:8px;padding:1px 5px;font-size:9px;font-weight:900;border:1.5px solid white;white-space:nowrap;z-index:10">${stats.boarded}/${stats.total}</div>`
        : "";

      const plate = route.vehicle
        ? `<div style="background:#1B2437;color:white;border-radius:4px;padding:2px 5px;font-size:9px;font-weight:800;margin-top:3px;letter-spacing:0.5px;box-shadow:0 1px 4px rgba(0,0,0,0.4);white-space:nowrap">${route.vehicle.plate}</div>`
        : "";

      const html = `<div style="display:flex;flex-direction:column;align-items:center;width:64px">
        <div style="position:relative;width:36px;height:36px">
          <div style="background:${color};width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center">
            <span style="transform:rotate(45deg);font-size:14px">🚌</span>
          </div>
          ${badge}
        </div>
        ${plate}
      </div>`;

      const icon = L.divIcon({ className: "", html, iconSize: [64, 54], iconAnchor: [32, 36], popupAnchor: [0, -40] });

      const popup = `<div style="font-family:sans-serif;min-width:160px">
        <div style="font-weight:800;font-size:14px;margin-bottom:2px">${route.name}</div>
        ${route.vehicle ? `<div style="color:#DC2626;font-weight:700;font-size:12px;margin-bottom:3px">${route.vehicle.plate}</div>` : ""}
        <div style="font-size:12px;color:${isActive ? "#16a34a" : "#94a3b8"}">${isActive ? "● Aktif" : "○ Pasif"} · ${timeSince(d.lastLocationAt)}</div>
        ${stats.total > 0 ? `<div style="font-size:12px;margin-top:4px">👥 ${stats.boarded}/${stats.total} bindi</div>` : ""}
      </div>`;

      const marker = L.marker([d.latitude, d.longitude], { icon })
        .addTo(leafletMap.current)
        .bindPopup(popup);

      markers.current[route.id] = { marker, lat: d.latitude, lng: d.longitude };
    });

    const pts = Object.values(markers.current);
    if (pts.length > 0) {
      const group = L.featureGroup(pts.map((m: any) => m.marker));
      leafletMap.current.fitBounds(group.getBounds().pad(0.3));
    }
  }

  function focusDriver(route: Route) {
    const d = route.driver;
    if (!d || d.latitude == null || d.longitude == null || !leafletMap.current) return;
    leafletMap.current.setView([d.latitude, d.longitude], 15);
    markers.current[route.id]?.marker?.openPopup();
  }

  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    function initMap() {
      if (!mapRef.current || leafletMap.current) return;
      const L = (window as any).L;
      leafletMap.current = L.map(mapRef.current).setView([38.9, 28.1], 9);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap", maxZoom: 19,
      }).addTo(leafletMap.current);
      fetchData();
    }

    if ((window as any).L) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    }

    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filtered = routes.filter(r => filter === "all" || r.type === filter);
  const activeDrivers = routes.filter(r => r.driver?.active).length;
  const totalBoarded = routes.reduce((s, r) => s + r.stats.boarded, 0);
  const totalPassengers = routes.reduce((s, r) => s + r.stats.total, 0);
  const totalAbsent = routes.reduce((s, r) => s + r.stats.absent, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Bus className="w-5 h-5 text-[#DC2626]" />
          <div>
            <h1 className="text-xl font-bold text-slate-800">Servis Takip</h1>
            {today && <p className="text-xs text-slate-400">{today}</p>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Özet istatistikler */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-slate-600 font-medium">{activeDrivers} aktif araç</span>
            </div>
            {totalPassengers > 0 && (
              <>
                <div className="w-px h-4 bg-slate-200" />
                <span className="text-green-600 font-bold">{totalBoarded}/{totalPassengers} bindi</span>
                {totalAbsent > 0 && (
                  <span className="text-red-500 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />{totalAbsent} binmedi
                  </span>
                )}
              </>
            )}
          </div>

          {lastUpdate && (
            <span className="text-xs text-slate-400 hidden lg:inline">
              {lastUpdate.toLocaleTimeString("tr-TR")}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Yenile
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sol: Güzergah Listesi */}
        <div className="w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50">
          {/* Filtre */}
          <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center gap-2 sticky top-0 z-10">
            {(["all", "okul", "personel", "transfer"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === f
                    ? "bg-[#1B2437] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f === "all" ? "Tümü" :
                 f === "okul" ? "Okul" :
                 f === "personel" ? "Personel" : "Transfer"}
                {f !== "all" && (
                  <span className="ml-1 opacity-70">
                    ({routes.filter(r => r.type === f).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Bus className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Aktif güzergah yok</p>
                <p className="text-sm mt-1">Güzergah eklemek için Güzergahlar sayfasını ziyaret edin.</p>
              </div>
            ) : (
              filtered.map(route => (
                <RouteCard
                  key={route.id}
                  route={route}
                  onDriverClick={focusDriver}
                />
              ))
            )}
          </div>
        </div>

        {/* Sağ: Harita */}
        <div ref={mapRef} className="flex-1 hidden lg:block" style={{ minHeight: 400 }} />
      </div>
    </div>
  );
}

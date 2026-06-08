"use client";

import { useEffect, useRef, useCallback } from "react";

type BoardingInfo = {
  total: number;
  boarded: number;
  passengers: { name: string; boarded: boolean }[];
} | null;

type DriverLocation = {
  id: string; name: string;
  latitude: number; longitude: number;
  lastLocationAt: string; isTracking: boolean;
  vehicle: { plate: string } | null;
  boardingInfo: BoardingInfo;
};

interface Props {
  onDriversLoad?: (drivers: DriverLocation[]) => void;
}

function isRecent(dateStr: string) {
  return Date.now() - new Date(dateStr).getTime() < 5 * 60 * 1000;
}

function timeSince(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}sn`;
  if (diff < 3600) return `${Math.floor(diff / 60)}dk`;
  return `${Math.floor(diff / 3600)}sa`;
}

export default function CommandCenterMap({ onDriversLoad }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markers = useRef<Record<string, any>>({});

  const updateMarkers = useCallback((data: DriverLocation[]) => {
    if (!leafletMap.current) return;
    const L = (window as any).L;
    Object.values(markers.current).forEach((m: any) => m.remove());
    markers.current = {};

    data.forEach((d) => {
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
            <div style="background:${color};width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center">
              <span style="transform:rotate(45deg);font-size:14px">🚌</span>
            </div>
            ${badge}
          </div>
          ${plate}
        </div>`;

      const icon = L.divIcon({
        className: "",
        html,
        iconSize: [64, 54],
        iconAnchor: [32, 36],
        popupAnchor: [0, -40],
        tooltipAnchor: [20, -20],
      });

      const popup = `
        <div style="font-family:sans-serif;min-width:150px">
          <div style="font-weight:800;font-size:14px;margin-bottom:3px">${d.name}</div>
          ${d.vehicle ? `<div style="color:#DC2626;font-weight:700;margin-bottom:3px">${d.vehicle.plate}</div>` : ""}
          <div style="font-size:11px;color:${active ? "#16a34a" : "#94a3b8"}">
            ${active ? "● Aktif" : "○ Pasif"} · ${timeSince(d.lastLocationAt)} önce
          </div>
        </div>`;

      const marker = L.marker([d.latitude, d.longitude], { icon })
        .addTo(leafletMap.current)
        .bindPopup(popup);

      if (bi) {
        const rows = bi.passengers
          .map(p => `<div style="display:flex;align-items:center;gap:6px;padding:1.5px 0;font-size:11px">
            <span style="color:${p.boarded ? "#16a34a" : "#DC2626"};font-weight:700">${p.boarded ? "✓" : "○"}</span>
            <span style="color:${p.boarded ? "#1e293b" : "#94a3b8"}">${p.name}</span>
          </div>`)
          .join("");
        const tooltip = `
          <div style="font-family:sans-serif;min-width:170px;max-width:220px">
            <div style="font-weight:800;font-size:12px;margin-bottom:6px;color:#1e293b">
              👥 ${bi.boarded}/${bi.total} öğrenci bindi
            </div>
            ${rows}
          </div>`;
        marker.bindTooltip(tooltip, { direction: "top", offset: [0, -38], opacity: 1 });
      }

      markers.current[d.id] = marker;
    });

    if (data.length > 0) {
      const group = L.featureGroup(Object.values(markers.current));
      try { leafletMap.current.fitBounds(group.getBounds().pad(0.4)); } catch {}
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/panel/konum");
      if (!res.ok) return;
      const data: DriverLocation[] = await res.json();
      updateMarkers(data);
      onDriversLoad?.(data);
    } catch {}
  }, [updateMarkers, onDriversLoad]);

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
      leafletMap.current = L.map(mapRef.current).setView([38.75, 27.95], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap", maxZoom: 19,
      }).addTo(leafletMap.current);
      fetchLocations();
    }

    if ((window as any).L) { initMap(); }
    else {
      const s = document.createElement("script");
      s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      s.onload = initMap;
      document.head.appendChild(s);
    }

    const interval = setInterval(fetchLocations, 30_000);
    return () => clearInterval(interval);
  }, [fetchLocations]);

  return <div ref={mapRef} className="w-full h-full" />;
}

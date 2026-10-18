"use client";

import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { roadRoute, validPoint } from "@/lib/road-route";

export interface Stop {
  id?: string;
  order: number;
  name: string;
  lat: number | null;
  lng: number | null;
  estimatedTime: string;
}
interface Props {
  stops: Stop[];
  currentStopIndex?: number;
  interactive?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  height?: number;
}
export default function RouteMap({ stops, currentStopIndex, interactive, onMapClick, height = 400 }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const layers = useRef<Leaflet.LayerGroup | null>(null);
  const leaflet = useRef<typeof Leaflet | null>(null);
  const latest = useRef({ interactive, onMapClick });
  latest.current = { interactive, onMapClick };
  const fitted = useRef(false);
  const [ready, setReady] = useState(false);
  const [routeError, setRouteError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }
    let observer: ResizeObserver | undefined;
    import("leaflet").then(mod => {
      if (cancelled || !container.current) return;
      const L = mod.default;
      leaflet.current = L;
      const map = L.map(container.current, { doubleClickZoom: false }).setView([38.7139, 27.9181], 14);
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors" }).addTo(map);
      layers.current = L.layerGroup().addTo(map);
      map.on("click", (e: Leaflet.LeafletMouseEvent) => {
        if (latest.current.interactive) latest.current.onMapClick?.(e.latlng.lat, e.latlng.lng);
      });
      observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(container.current);
      fitted.current = false;
      setReady(true);
    }).catch(() => { if (!cancelled) setRouteError("Harita yüklenemedi. Sayfayı yenileyip tekrar deneyin."); });
    return () => {
      cancelled = true;
      observer?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      layers.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current, layer = layers.current, L = leaflet.current;
    if (!ready || !map || !layer || !L) return;
    layer.clearLayers();
    setRouteError("");
    const controller = new AbortController();
    const ordered = [...stops].sort((a, b) => a.order - b.order);
    const validStops = ordered.filter(validPoint);
    if (!fitted.current && validStops.length) {
      map.fitBounds(L.latLngBounds(validStops.map(s => [s.lat, s.lng] as [number, number])).pad(0.15), { maxZoom: 16 });
      fitted.current = true;
    }
    ordered.forEach((stop, index) => {
      if (!validPoint(stop)) return;
      const color = index === currentStopIndex ? "#10B981" : index === 0 ? "#2563EB" : "#DC2626";
      const icon = L.divIcon({ className: "", html: `<div style="width:28px;height:28px;background:${color};color:white;border:2px solid white;border-radius:50%;display:grid;place-items:center;font-weight:bold;box-shadow:0 2px 6px #0005">${index + 1}</div>`, iconSize: [28,28], iconAnchor: [14,14] });
      const popup = document.createElement("div");
      popup.textContent = `${index + 1}. ${stop.name} · ${stop.estimatedTime}`;
      L.marker([stop.lat, stop.lng], { icon, bubblingMouseEvents: false }).addTo(layer).bindPopup(popup);
    });
    // Debounce rapid additions; an older response must never draw over a new route.
    const timer = setTimeout(() => {
      if (validStops.length > 1) roadRoute(validStops, controller.signal).then(line => {
        if (!controller.signal.aborted) L.polyline(line, { color: "#DC2626", weight: 4, opacity: 0.8 }).addTo(layer);
      }).catch(() => { if (!controller.signal.aborted) setRouteError("Yol hesaplanamadı; duraklar kaydedilebilir, yalnızca yol çizgisi gösterilemiyor."); });
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [stops, currentStopIndex, ready]);

  return <div>
    {routeError && <p role="status" className="text-sm text-amber-700 p-2">{routeError}</p>}
    <div ref={container} aria-label="Güzergâh haritası" style={{ height, width: "100%", borderRadius: 12, zIndex: 0, cursor: interactive ? "crosshair" : undefined }} className="overflow-hidden" />
  </div>;
}

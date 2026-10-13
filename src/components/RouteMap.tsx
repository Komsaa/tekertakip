"use client";

import { useEffect, useRef, useState } from "react";
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
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  const [routeError, setRouteError] = useState("");

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }

    const container = mapRef.current;
    const controller = new AbortController();
    setRouteError("");

    // Dynamic import — SSR bundle'a dahil edilmez
    import("leaflet").then((mod) => {
      if (!container || controller.signal.aborted) return;
      const L = mod.default;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const validStops = [...stops].sort((a, b) => a.order - b.order).filter(validPoint);

      const center: [number, number] =
        validStops.length > 0
          ? [
              validStops.reduce((s, p) => s + p.lat!, 0) / validStops.length,
              validStops.reduce((s, p) => s + p.lng!, 0) / validStops.length,
            ]
          : [38.7139, 27.9181];

      const map = L.map(container).setView(center, validStops.length > 1 ? 13 : 12);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      if (validStops.length > 1) {
        map.fitBounds(L.latLngBounds(validStops.map(s => [s.lat!, s.lng!] as [number, number])).pad(0.1));
        roadRoute(validStops, controller.signal)
          .then((latlngs) => {
            if (!controller.signal.aborted) L.polyline(latlngs, { color: "#DC2626", weight: 4, opacity: 0.8 }).addTo(map);
          })
          .catch(() => {
            if (!controller.signal.aborted) setRouteError("Yol hesaplanamadı; yalnızca duraklar gösteriliyor.");
          });
      }

      validStops.forEach((stop, i) => {
        const isCurrent = currentStopIndex !== undefined && i === currentStopIndex;
        const isFirst = i === 0;
        const isLast = i === validStops.length - 1;
        const color = isCurrent ? "#10B981" : isFirst ? "#2563EB" : isLast ? "#DC2626" : "#6B7280";
        const size = isCurrent ? 14 : 10;

        const icon = L.divIcon({
          className: "",
          html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const popup = document.createElement("div");
        popup.textContent = `${stop.name} · ${stop.estimatedTime}${isCurrent ? " · Şu an burada" : ""}`;
        L.marker([stop.lat!, stop.lng!], { icon }).addTo(map).bindPopup(popup);
      });

      if (interactive && onMapClick) {
        map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
          onMapClick(e.latlng.lat, e.latlng.lng);
        });
      }
    });

    return () => {
      controller.abort();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, currentStopIndex]);

  return (
    <div>
    {routeError && <p role="status" className="text-sm text-amber-700 p-2">{routeError}</p>}
    <div
      ref={mapRef}
      style={{ height, width: "100%", borderRadius: 12, zIndex: 0 }}
      className="overflow-hidden"
    />
    </div>
  );
}

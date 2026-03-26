"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
import { computeLiveStatus, type RouteStop } from "@/lib/routeStatus";

interface Stop { order: number; name: string; lat: number | null; lng: number | null; estimatedTime: string }
interface Route {
  id: string; name: string; type: string;
  weekdaysOnly: boolean; active: boolean;
  driver: { name: string } | null;
  vehicle: { plate: string } | null;
  stops: Stop[];
}

export default function LiveRoutes({ initialRoutes }: { initialRoutes: Route[] }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const activeRoutes = initialRoutes.filter((r) => r.active);

  if (activeRoutes.length === 0) {
    return (
      <div className="px-6 py-8 text-center text-slate-400">
        <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-200" />
        <p className="text-sm">Aktif güzergah yok</p>
        <Link href="/panel/guzergahlar" className="text-xs text-[#DC2626] hover:underline">Güzergah ekle</Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-50">
      {activeRoutes.map((r) => {
        const status = computeLiveStatus(r.stops as RouteStop[], r.weekdaysOnly);
        return (
          <Link key={r.id} href="/panel/guzergahlar" className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              status.phase === "active" ? "bg-green-500 animate-pulse" :
              status.phase === "completed" ? "bg-slate-300" :
              status.phase === "weekend" ? "bg-blue-200" :
              "bg-amber-400"
            }`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-800 truncate">{r.name}</div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                {r.driver && <span>{r.driver.name}</span>}
                {r.vehicle && <span>· {r.vehicle.plate}</span>}
                {r.stops.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {r.stops[0].estimatedTime}–{r.stops[r.stops.length - 1].estimatedTime}
                  </span>
                )}
              </div>
              <div className={`text-xs font-medium mt-0.5 ${
                status.phase === "active" ? "text-green-600" :
                status.phase === "completed" ? "text-slate-400" :
                status.phase === "weekend" ? "text-blue-400" :
                "text-amber-600"
              }`}>
                {status.label}
              </div>
            </div>
            {status.phase === "active" && (
              <div className="flex-shrink-0 text-right">
                <div className="text-xs text-slate-400 mb-1">{status.progressPct}%</div>
                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${status.progressPct}%` }} />
                </div>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

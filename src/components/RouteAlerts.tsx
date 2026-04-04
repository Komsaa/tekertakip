"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, X, AlertTriangle, Bell } from "lucide-react";

type Alert = {
  driverId: string;
  driverName: string;
  driverPhone: string | null;
  plate: string | null;
  routeName: string;
  stopName: string;
  scheduledTime: string;
  minutesLate: number;
  level: "warning" | "alarm";
};

export default function RouteAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const audioCtx = useRef<AudioContext | null>(null);
  const prevAlarmKeys = useRef<Set<string>>(new Set());

  function alertKey(a: Alert) {
    return `${a.driverId}-${a.stopName}`;
  }

  function playBeep(alarm: boolean) {
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtx.current;
      const count = alarm ? 3 : 1;
      for (let i = 0; i < count; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = alarm ? 880 : 660;
        gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.4 + 0.3);
        osc.start(ctx.currentTime + i * 0.4);
        osc.stop(ctx.currentTime + i * 0.4 + 0.3);
      }
    } catch {/* ses izni yoksa sessiz geç */}
  }

  async function fetchAlerts() {
    try {
      const res = await fetch("/api/panel/route-alerts");
      if (!res.ok) return;
      const data: Alert[] = await res.json();

      const active = data.filter((a) => !dismissed.has(alertKey(a)));
      setAlerts(active);

      // Yeni alarm varsa ses çal
      const newAlarmKeys = new Set(
        active.filter((a) => a.level === "alarm").map(alertKey)
      );
      const hasNewAlarm = [...newAlarmKeys].some(
        (k) => !prevAlarmKeys.current.has(k)
      );
      const hasNewWarning = active.some(
        (a) => a.level === "warning" && !prevAlarmKeys.current.has(alertKey(a))
      );

      if (hasNewAlarm) playBeep(true);
      else if (hasNewWarning) playBeep(false);

      prevAlarmKeys.current = newAlarmKeys;
    } catch {/* */}
  }

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30_000);
    return () => clearInterval(interval);
  }, [dismissed]);

  function dismiss(key: string) {
    setDismissed((prev) => new Set([...prev, key]));
    setAlerts((prev) => prev.filter((a) => alertKey(a) !== key));
  }

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {alerts.map((a) => {
        const key = alertKey(a);
        const isAlarm = a.level === "alarm";
        return (
          <div
            key={key}
            className={`rounded-2xl shadow-2xl p-4 border-2 animate-fade-in ${
              isAlarm
                ? "bg-red-600 border-red-400 text-white"
                : "bg-amber-50 border-amber-400 text-slate-800"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {isAlarm ? (
                  <Bell className="w-5 h-5 flex-shrink-0 animate-bounce" />
                ) : (
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500" />
                )}
                <div>
                  <p className={`font-bold text-sm ${isAlarm ? "text-white" : "text-slate-800"}`}>
                    {a.driverName}
                    {a.plate && <span className="font-normal ml-1 opacity-75">· {a.plate}</span>}
                  </p>
                  <p className={`text-xs mt-0.5 ${isAlarm ? "text-red-100" : "text-slate-600"}`}>
                    <span className="font-semibold">{a.stopName}</span> durağında{" "}
                    <span className="font-bold">{a.minutesLate} dk</span> geç
                  </p>
                  <p className={`text-xs ${isAlarm ? "text-red-200" : "text-slate-400"}`}>
                    {a.routeName} · {a.scheduledTime}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismiss(key)}
                className={`p-1 rounded-lg flex-shrink-0 ${isAlarm ? "hover:bg-red-500" : "hover:bg-amber-100"}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {a.driverPhone && (
              <a
                href={`tel:${a.driverPhone}`}
                className={`mt-3 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${
                  isAlarm
                    ? "bg-white text-red-600 hover:bg-red-50"
                    : "bg-amber-500 text-white hover:bg-amber-600"
                }`}
              >
                <Phone className="w-4 h-4" />
                {a.driverPhone} — Ara
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

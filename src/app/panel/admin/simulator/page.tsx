"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play, MapPin, CheckCircle2, Truck, Zap,
  Terminal, RefreshCw, Wifi, WifiOff, AlertCircle,
} from "lucide-react";

type LogEntry = {
  time: string;
  type: "info" | "success" | "error" | "data";
  msg: string;
  detail?: string;
};

type Driver = {
  id: string;
  name: string;
  mobileUsername: string | null;
  status: string;
};

type Route = {
  id: string;
  name: string;
  stops?: { id: string; name: string; order: number }[];
};

// Sabit test koordinatları — Gölmarmara çevresi
const BASE_LAT = 38.715;
const BASE_LNG = 27.921;

export default function SimulatorPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [pin, setPin] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [lat, setLat] = useState(BASE_LAT);
  const [lng, setLng] = useState(BASE_LNG);
  const logsRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function addLog(type: LogEntry["type"], msg: string, detail?: string) {
    const time = new Date().toLocaleTimeString("tr-TR");
    setLogs((prev) => [...prev.slice(-199), { time, type, msg, detail }]);
    setTimeout(() => {
      if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }, 50);
  }

  useEffect(() => {
    fetch("/api/drivers").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setDrivers(d.filter((dr: Driver) => dr.mobileUsername));
    }).catch(() => addLog("error", "Şöförler yüklenemedi"));

    fetch("/api/routes").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setRoutes(d);
    }).catch(() => addLog("error", "Güzergahlar yüklenemedi"));
  }, []);

  async function login() {
    const driver = drivers.find(d => d.id === selectedDriver);
    if (!driver?.mobileUsername || !pin) {
      addLog("error", "Şöför seç ve PIN gir");
      return;
    }
    addLog("info", `Giriş deneniyor: ${driver.mobileUsername}`);
    try {
      const res = await fetch("/api/mobile/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: driver.mobileUsername, password: pin }),
      });
      const data = await res.json();
      if (!res.ok) { addLog("error", "Giriş başarısız: " + data.error); return; }
      setToken(data.token);
      setDriverId(data.driverId);
      addLog("success", `✓ Giriş başarılı — Token alındı`, `driverId: ${data.driverId}`);
    } catch (e) {
      addLog("error", "Bağlantı hatası: " + String(e));
    }
  }

  async function sendLocation() {
    if (!token) { addLog("error", "Önce giriş yap"); return; }
    const newLat = lat + (Math.random() - 0.5) * 0.002;
    const newLng = lng + (Math.random() - 0.5) * 0.002;
    setLat(newLat);
    setLng(newLng);
    try {
      const res = await fetch("/api/mobile/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ latitude: newLat, longitude: newLng }),
      });
      const data = await res.json();
      if (!res.ok) { addLog("error", "Konum gönderilemedi: " + data.error); return; }
      addLog("success", `📍 Konum gönderildi`, `${newLat.toFixed(5)}, ${newLng.toFixed(5)}`);
    } catch (e) {
      addLog("error", "Konum hatası: " + String(e));
    }
  }

  function startAutoLocation() {
    if (running) {
      clearInterval(intervalRef.current!);
      setRunning(false);
      addLog("info", "Otomatik konum durduruldu");
      return;
    }
    addLog("info", "Otomatik konum başlatıldı (5 sn aralıkla)");
    setRunning(true);
    sendLocation();
    intervalRef.current = setInterval(sendLocation, 5000);
  }

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  async function startSefer() {
    if (!token || !selectedRoute) { addLog("error", "Token ve güzergah gerekli"); return; }
    try {
      const res = await fetch("/api/mobile/sefer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-driver-token": token,
          "x-driver-id": driverId!,
        },
        body: JSON.stringify({ action: "start", routeId: selectedRoute }),
      });
      const data = await res.json();
      if (!res.ok) { addLog("error", "Sefer başlatılamadı: " + (data.error ?? JSON.stringify(data))); return; }
      addLog("success", "🚐 Sefer başlatıldı", `jobId: ${data.jobId ?? data.id ?? "ok"}`);
    } catch (e) {
      addLog("error", "Sefer hatası: " + String(e));
    }
  }

  async function markAttendance(status: "boarded" | "absent") {
    if (!token || !selectedRoute) { addLog("error", "Token ve güzergah gerekli"); return; }
    const route = routes.find(r => r.id === selectedRoute);
    const stops = route?.stops ?? [];
    if (stops.length === 0) {
      addLog("error", "Bu güzergahın durağı yok veya duraklar yüklenmedi");
      return;
    }
    const stop = stops[Math.floor(Math.random() * stops.length)];
    addLog("info", `Yoklama gönderiliyor → Durak: ${stop.name}, Durum: ${status}`);
    try {
      const res = await fetch("/api/mobile/sefer/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-driver-token": token,
          "x-driver-id": driverId!,
        },
        body: JSON.stringify({ stopId: stop.id, routeId: selectedRoute, status }),
      });
      const data = await res.json();
      if (!res.ok) { addLog("error", "Yoklama hatası: " + (data.error ?? JSON.stringify(data))); return; }
      addLog("success", `${status === "boarded" ? "✅" : "❌"} Yoklama kaydedildi — ${stop.name}`, JSON.stringify(data).slice(0, 120));
    } catch (e) {
      addLog("error", "Yoklama bağlantı hatası: " + String(e));
    }
  }

  async function loadRouteStops(routeId: string) {
    try {
      const res = await fetch(`/api/routes/${routeId}`);
      const data = await res.json();
      if (data?.stops) {
        setRoutes(prev => prev.map(r => r.id === routeId ? { ...r, stops: data.stops } : r));
        addLog("info", `Güzergah yüklendi: ${data.name} — ${data.stops.length} durak`);
      }
    } catch {}
  }

  function clearLogs() { setLogs([]); }

  const driver = drivers.find(d => d.id === selectedDriver);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-[#DC2626] rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Mobil Simülatör</h1>
            <p className="text-sm text-slate-500">Gerçek mobil uygulama API'larını tarayıcıdan test et</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Sol: Kontroller */}
        <div className="space-y-4">

          {/* Şöför Seçimi & Giriş */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#DC2626]" />
              1. Şöför Girişi
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Şöför</label>
                <select
                  value={selectedDriver}
                  onChange={e => {
                    setSelectedDriver(e.target.value);
                    setToken(null);
                    setDriverId(null);
                  }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                >
                  <option value="">— Şöför seç —</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.mobileUsername})</option>
                  ))}
                </select>
                {drivers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">⚠ Mobil kullanıcı adı olan şöför bulunamadı. Şöförler menüsünden mobil giriş bilgisi ekle.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">PIN (4 haneli)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] font-mono"
                />
              </div>

              <button
                onClick={login}
                disabled={!selectedDriver || !pin}
                className="w-full bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-bold transition-all"
              >
                Giriş Yap → Token Al
              </button>

              {token && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-700 font-medium">Bağlı: {driver?.name}</span>
                </div>
              )}
              {!token && selectedDriver && (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <WifiOff className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-500">Bağlı değil</span>
                </div>
              )}
            </div>
          </div>

          {/* Konum Simülasyonu */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              2. Konum Simülasyonu
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-slate-50 rounded-xl px-3 py-2 text-center">
                <div className="text-xs text-slate-400">Enlem</div>
                <div className="font-mono text-sm font-bold text-slate-700">{lat.toFixed(5)}</div>
              </div>
              <div className="bg-slate-50 rounded-xl px-3 py-2 text-center">
                <div className="text-xs text-slate-400">Boylam</div>
                <div className="font-mono text-sm font-bold text-slate-700">{lng.toFixed(5)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={sendLocation}
                disabled={!token}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                <MapPin className="w-4 h-4" />
                1× Konum Gönder
              </button>
              <button
                onClick={startAutoLocation}
                disabled={!token}
                className={`flex items-center justify-center gap-2 ${running ? "bg-amber-500 hover:bg-amber-600" : "bg-green-600 hover:bg-green-700"} disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-semibold transition-all`}
              >
                {running
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Durdur</>
                  : <><Play className="w-4 h-4" /> Otomatik (5s)</>
                }
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">Her göndermede konum hafifçe kayar (gerçekçi hareket simüle edilir)</p>
          </div>

          {/* Sefer & Yoklama */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              3. Sefer & Yoklama
            </h2>

            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Güzergah</label>
              <select
                value={selectedRoute}
                onChange={e => {
                  setSelectedRoute(e.target.value);
                  if (e.target.value) loadRouteStops(e.target.value);
                }}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              >
                <option value="">— Güzergah seç —</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {selectedRoute && (() => {
              const route = routes.find(r => r.id === selectedRoute);
              return route?.stops && route.stops.length > 0 ? (
                <div className="bg-slate-50 rounded-xl p-3 mb-3">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Duraklar ({route.stops.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {route.stops.slice(0, 8).map(s => (
                      <span key={s.id} className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-slate-600">
                        {s.name}
                      </span>
                    ))}
                    {route.stops.length > 8 && <span className="text-xs text-slate-400">+{route.stops.length - 8} daha</span>}
                  </div>
                </div>
              ) : null;
            })()}

            <div className="space-y-2">
              <button
                onClick={startSefer}
                disabled={!token || !selectedRoute}
                className="w-full flex items-center justify-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                <Play className="w-4 h-4" /> Seferi Başlat
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => markAttendance("boarded")}
                  disabled={!token || !selectedRoute}
                  className="flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" /> Bindi
                </button>
                <button
                  onClick={() => markAttendance("absent")}
                  disabled={!token || !selectedRoute}
                  className="flex items-center justify-center gap-1.5 bg-slate-600 hover:bg-slate-700 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  <AlertCircle className="w-4 h-4" /> Binmedi
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Yoklama rastgele bir durağa gönderilir. Veliler push bildirim alır.</p>
          </div>
        </div>

        {/* Sağ: Log terminali */}
        <div className="bg-[#0f172a] rounded-2xl border border-white/10 flex flex-col" style={{ minHeight: "600px" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-green-400" />
              <span className="text-sm font-mono text-slate-300 font-semibold">API Konsolu</span>
            </div>
            <button
              onClick={clearLogs}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-mono"
            >
              temizle
            </button>
          </div>

          <div
            ref={logsRef}
            className="flex-1 overflow-y-auto p-4 space-y-2 font-mono"
          >
            {logs.length === 0 ? (
              <div className="text-slate-600 text-xs mt-4 text-center">
                Henüz işlem yapılmadı.<br />
                Soldaki kontrolleri kullanarak API çağrıları gönder.
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-xs">
                  <div className={`flex items-start gap-2 ${
                    log.type === "success" ? "text-green-400" :
                    log.type === "error"   ? "text-red-400" :
                    log.type === "data"    ? "text-blue-400" :
                    "text-slate-400"
                  }`}>
                    <span className="text-slate-600 flex-shrink-0">{log.time}</span>
                    <span>{log.msg}</span>
                  </div>
                  {log.detail && (
                    <div className="ml-16 text-slate-600 text-[11px] leading-relaxed break-all">
                      {log.detail}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Status bar */}
          <div className="px-4 py-2 border-t border-white/5 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${token ? "bg-green-400 animate-pulse" : "bg-slate-600"}`} />
            <span className="text-xs text-slate-500 font-mono">
              {token ? `Bağlı · ${driver?.name}` : "Bağlı değil"}
            </span>
            {running && (
              <span className="ml-auto text-xs text-amber-400 font-mono flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Canlı konum aktif
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Kurulum notu */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <h3 className="text-sm font-bold text-amber-800 mb-2">⚡ Gerçek Mobil Test İçin</h3>
        <ol className="space-y-1 list-decimal list-inside">
          {[
            "tekertakip-driver Expo projesinde: npx expo start --tunnel",
            "Telefonunda Expo Go uygulamasını indir → QR kodu tara",
            "Şöför kullanıcı adı + PIN ile giriş yap",
            "Arka planda konum paylaşmayı aç (Ayarlar → Konum → Her zaman)",
            "Güzergah seç → Sefer başlat → Duraklarda öğrenci işaretle",
            "Veliler push bildirim alıyor mu? → tekertakip-driver veli akışını test et",
          ].map((s, i) => (
            <li key={i} className="text-sm text-amber-700">{s}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Wrench, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Report {
  id: string;
  description: string;
  photoUrl: string | null;
  status: string;
  resolvedAt: string | null;
  createdAt: string;
  driver: { id: string; name: string; phone: string | null };
  vehicle: { id: string; plate: string } | null;
}

export default function ArizalarClient({ reports: initial }: { reports: Report[] }) {
  const router = useRouter();
  const [reports, setReports] = useState(initial);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");
  const [resolving, setResolving] = useState<string | null>(null);

  const filtered = reports.filter((r) =>
    filter === "all" ? true : r.status === filter
  );

  const openCount = reports.filter((r) => r.status === "open").length;

  async function resolve(id: string) {
    setResolving(id);
    try {
      const res = await fetch("/api/panel/arizalar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { toast.error("Hata"); return; }
      setReports((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: "resolved", resolvedAt: new Date().toISOString() } : r)
      );
      toast.success("Çözüldü olarak işaretlendi");
    } finally {
      setResolving(null);
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Wrench className="w-6 h-6 text-orange-500" />
            Arıza Bildirimleri
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {openCount > 0
              ? `${openCount} açık bildirim var`
              : "Açık arıza bildirimi yok"}
          </p>
        </div>
        <button
          onClick={() => router.refresh()}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-600 transition-colors"
        >
          Yenile
        </button>
      </div>

      {/* Filtre */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(["open", "resolved", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === f
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {f === "open" ? "Açık" : f === "resolved" ? "Çözülmüş" : "Tümü"}
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            {filter === "open" ? "Açık arıza bildirimi yok" : "Kayıt bulunamadı"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className={`bg-white rounded-2xl shadow-sm border p-5 flex gap-4 ${
                r.status === "open"
                  ? "border-orange-200 border-l-4 border-l-orange-400"
                  : "border-slate-100"
              }`}
            >
              {/* İkon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  r.status === "open" ? "bg-orange-100" : "bg-slate-100"
                }`}
              >
                {r.status === "open" ? (
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>

              {/* İçerik */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-semibold text-slate-800 leading-snug">
                      {r.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <Link
                        href={`/panel/soforler/${r.driver.id}`}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        {r.driver.name}
                      </Link>
                      {r.vehicle && (
                        <Link
                          href={`/panel/araclar/${r.vehicle.id}`}
                          className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-mono hover:bg-slate-200"
                        >
                          {r.vehicle.plate}
                        </Link>
                      )}
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {new Date(r.createdAt).toLocaleString("tr-TR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {r.status === "open" && (
                    <button
                      onClick={() => resolve(r.id)}
                      disabled={resolving === r.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 flex-shrink-0"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {resolving === r.id ? "İşleniyor..." : "Çözüldü"}
                    </button>
                  )}
                  {r.status === "resolved" && r.resolvedAt && (
                    <span className="text-xs text-green-600 font-medium flex-shrink-0">
                      {new Date(r.resolvedAt).toLocaleDateString("tr-TR")} çözüldü
                    </span>
                  )}
                </div>

                {r.photoUrl && (
                  <a href={r.photoUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block">
                    <img
                      src={r.photoUrl}
                      alt="Arıza fotoğrafı"
                      className="h-20 rounded-lg object-cover border border-slate-200 hover:opacity-80 transition-opacity"
                    />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

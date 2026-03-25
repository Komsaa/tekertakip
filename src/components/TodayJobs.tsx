"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Clock, User, MapPin, CheckCircle, Play, Calendar } from "lucide-react";
import Link from "next/link";

type Job = {
  id: string;
  title: string;
  status: string;
  startTime: string;
  endTime: string | null;
  startLocation: string | null;
  endLocation: string | null;
  driver: { name: string } | null;
  vehicle: { plate: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  completed: "bg-slate-100 text-slate-500",
  cancelled: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  planned: "Planlandı",
  active: "Aktif",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

export default function TodayJobs({ initialJobs }: { initialJobs: Job[] }) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [loading, setLoading] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setLoading(id);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status } : j)));
      toast.success(status === "active" ? "Sefer başladı!" : "Sefer tamamlandı!");
      router.refresh();
    } catch {
      toast.error("Güncellenemedi");
    } finally {
      setLoading(null);
    }
  }

  if (jobs.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-slate-400">
        <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-2" />
        <p className="text-sm">Bugün sefer yok</p>
        <Link href="/panel/isler" className="text-xs text-[#DC2626] hover:underline mt-1 inline-block">Sefer ekle</Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-50">
      {jobs.map((job) => (
        <div key={job.id} className="px-5 py-3.5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-800 leading-tight">{job.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[job.status] ?? "bg-slate-100 text-slate-500"}`}>
              {STATUS_LABELS[job.status] ?? job.status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-1.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {job.startTime}{job.endTime ? ` – ${job.endTime}` : ""}
            </span>
            {job.driver && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {job.driver.name}
              </span>
            )}
            {job.vehicle && (
              <span className="font-mono text-slate-400">{job.vehicle.plate}</span>
            )}
          </div>

          {(job.startLocation || job.endLocation) && (
            <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span>{job.startLocation}</span>
              {job.startLocation && job.endLocation && <span className="text-slate-300 mx-0.5">→</span>}
              <span>{job.endLocation}</span>
            </div>
          )}

          {/* Durum güncelleme butonları */}
          {job.status === "planned" && (
            <button
              onClick={() => updateStatus(job.id, "active")}
              disabled={loading === job.id}
              className="flex items-center gap-1.5 text-xs bg-green-50 hover:bg-green-100 text-green-700 font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Play className="w-3 h-3" />
              {loading === job.id ? "..." : "Yola Çıktı"}
            </button>
          )}
          {job.status === "active" && (
            <button
              onClick={() => updateStatus(job.id, "completed")}
              disabled={loading === job.id}
              className="flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-3 h-3" />
              {loading === job.id ? "..." : "Tamamlandı"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ExcelImportButton({ type }: { type: "drivers" | "vehicles" }) {
  const ref = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File) {
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`/api/excel/import?type=${type}`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Hata"); return; }
      toast.success(`${data.created} kayıt eklendi`);
      if (data.errors?.length) {
        console.warn("Import hataları:", data.errors);
        toast(`${data.errors.length} satır atlandı — konsolu kontrol et`, { icon: "⚠️" });
      }
      router.refresh();
    } catch { toast.error("Yükleme hatası"); }
    finally { setLoading(false); if (ref.current) ref.current.value = ""; }
  }

  return (
    <>
      <button
        onClick={() => ref.current?.click()}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-2 border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Yükleniyor..." : "Excel'den Aktar"}
      </button>
      <input
        ref={ref}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </>
  );
}

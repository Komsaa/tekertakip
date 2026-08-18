"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ImpersonationBanner({ companyName }: { companyName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function exitImpersonation() {
    setLoading(true);
    const res = await fetch("/api/admin/impersonate", { method: "DELETE" });
    if (res.ok) {
      router.push("/panel/admin");
      router.refresh();
    } else {
      setLoading(false);
      alert("Çıkış yapılamadı");
    }
  }

  return (
    <div className="bg-purple-700 text-white px-4 py-2.5 flex items-center justify-between text-sm z-50 sticky top-0 lg:relative">
      <span className="flex items-center gap-2 font-medium">
        <span className="text-purple-200">Gorunum:</span>
        <strong>{companyName}</strong>
        <span className="text-purple-300 text-xs font-normal">— bu sirketin panelini goruyorsunuz</span>
      </span>
      <button
        onClick={exitImpersonation}
        disabled={loading}
        className="bg-white/20 hover:bg-white/30 disabled:opacity-60 px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
      >
        {loading ? "..." : "Cikis → Admin Paneli"}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  ExternalLink,
  Search,
  FolderOpen,
  Users,
  Truck,
  Building2,
  Calendar,
} from "lucide-react";
import { getDocStatus, getDocStatusColor, getDocStatusLabel } from "@/lib/utils";

type Doc = {
  id: string;
  name: string;
  entityType: string;
  entityId: string;
  entityName: string;
  fileUrl: string | null;
  category: string;
  expiry: string | null;
  notes: string | null;
  createdAt: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  resmi: "Resmi Evrak",
  sozlesme: "Sözleşme",
  sigorta: "Sigorta",
  mali: "Mali Belge",
  diger: "Diğer",
};

const CATEGORY_COLORS: Record<string, string> = {
  resmi: "bg-blue-100 text-blue-700",
  sozlesme: "bg-purple-100 text-purple-700",
  sigorta: "bg-amber-100 text-amber-700",
  mali: "bg-green-100 text-green-700",
  diger: "bg-slate-100 text-slate-600",
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  driver: "Şöför",
  vehicle: "Araç",
  company: "Genel",
};

export default function BelgelerClient({ docs }: { docs: Doc[] }) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterEntityType, setFilterEntityType] = useState("all");

  const filtered = docs.filter((d) => {
    if (filterCategory !== "all" && d.category !== filterCategory) return false;
    if (filterEntityType !== "all" && d.entityType !== filterEntityType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.entityName.toLowerCase().includes(q) ||
        (d.notes?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  // Kategori bazlı grupla
  const grouped: Record<string, Doc[]> = {};
  for (const doc of filtered) {
    const cat = doc.category || "diger";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(doc);
  }

  const categoryOrder = ["resmi", "sozlesme", "sigorta", "mali", "diger"];

  const totalCount = docs.length;
  const expiredCount = docs.filter((d) => d.expiry && getDocStatus(new Date(d.expiry)) === "expired").length;
  const criticalCount = docs.filter((d) => d.expiry && getDocStatus(new Date(d.expiry)) === "critical").length;

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Belge Arşivi</h1>
          <p className="text-slate-500 text-sm mt-1">
            Ek belgeler ve arşiv evrakları
          </p>
        </div>
        <Link
          href="/panel/belgeler/toplu-yukle"
          className="flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          <Upload className="w-4 h-4" />
          Toplu Yükle
        </Link>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="text-2xl font-black text-slate-800">{totalCount}</div>
          <div className="text-sm text-slate-500 mt-1">Toplam Belge</div>
        </div>
        <div className={`rounded-2xl border p-4 ${expiredCount > 0 ? "bg-red-50 border-red-100" : "bg-white border-slate-100"}`}>
          <div className={`text-2xl font-black ${expiredCount > 0 ? "text-red-600" : "text-slate-800"}`}>{expiredCount}</div>
          <div className="text-sm text-slate-500 mt-1">Süresi Dolmuş</div>
        </div>
        <div className={`rounded-2xl border p-4 ${criticalCount > 0 ? "bg-amber-50 border-amber-100" : "bg-white border-slate-100"}`}>
          <div className={`text-2xl font-black ${criticalCount > 0 ? "text-amber-600" : "text-slate-800"}`}>{criticalCount}</div>
          <div className="text-sm text-slate-500 mt-1">Kritik (≤7 gün)</div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Belge veya kişi ara..."
            className="pl-9 w-full text-sm py-2"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="text-sm py-2"
        >
          <option value="all">Tüm Kategoriler</option>
          {categoryOrder.map((k) => (
            <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
          ))}
        </select>
        <select
          value={filterEntityType}
          onChange={(e) => setFilterEntityType(e.target.value)}
          className="text-sm py-2"
        >
          <option value="all">Tümü</option>
          <option value="driver">Şöförler</option>
          <option value="vehicle">Araçlar</option>
          <option value="company">Genel</option>
        </select>
      </div>

      {/* İçerik */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <FolderOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">
            {docs.length === 0 ? "Henüz arşiv belgesi yok" : "Arama sonucu bulunamadı"}
          </p>
          {docs.length === 0 && (
            <Link
              href="/panel/belgeler/toplu-yukle"
              className="mt-4 inline-flex items-center gap-2 text-[#DC2626] text-sm font-semibold hover:underline"
            >
              <Upload className="w-4 h-4" />
              Toplu yüklemeye git
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {categoryOrder
            .filter((cat) => grouped[cat]?.length)
            .map((cat) => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[cat]}`}>
                    {CATEGORY_LABELS[cat]}
                  </span>
                  <span className="text-xs text-slate-400">{grouped[cat].length} belge</span>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
                  {grouped[cat].map((doc) => (
                    <DocItem key={doc.id} doc={doc} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function DocItem({ doc }: { doc: Doc }) {
  const expiryDate = doc.expiry ? new Date(doc.expiry) : null;
  const status = expiryDate ? getDocStatus(expiryDate) : null;

  const EntityIcon =
    doc.entityType === "driver" ? Users : doc.entityType === "vehicle" ? Truck : Building2;

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-slate-50/50 transition-colors">
      {/* İkon */}
      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4 text-slate-400" />
      </div>

      {/* Ana bilgi */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-800 text-sm truncate">{doc.name}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <EntityIcon className="w-3 h-3 text-slate-400" />
          <span className="text-xs text-slate-500">{doc.entityName}</span>
          {doc.notes && (
            <span className="text-xs text-slate-400 truncate max-w-[200px]">· {doc.notes}</span>
          )}
        </div>
      </div>

      {/* Vade */}
      {expiryDate && status && (
        <div className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${getDocStatusColor(status)}`}>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {expiryDate.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })}
          </div>
        </div>
      )}

      {/* Dosya linki */}
      {doc.fileUrl && (
        <a
          href={doc.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-slate-400 hover:text-[#DC2626] rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
          title="Belgeyi görüntüle"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useCallback } from "react";
import {
  FileCheck, Truck, Users, Building2, AlertTriangle,
  CheckCircle2, Clock, ChevronDown, ChevronUp, Info,
  Shield, Star, Upload, X, Loader2, Sparkles,
  ExternalLink, FileWarning, ChevronRight,
} from "lucide-react";
import type { BulkAnalyzeResult, DocCategory } from "@/app/api/upload/bulk-analyze/route";

// ─── Rehber verisi ─────────────────────────────────────────────────────────

type Doc = {
  name: string;
  issuer: string;
  renewal: string;
  tracked: boolean;
  mandatory: boolean;
  note?: string;
};

type Category = {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  badge: string;
  docs: Doc[];
};

const CATEGORIES: Category[] = [
  {
    id: "arac",
    title: "Araç Evrakları",
    icon: Truck,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    docs: [
      {
        name: "Araç Tescil Belgesi (Ruhsat)",
        issuer: "Trafik Tescil Müdürlüğü",
        renewal: "Değişiklik olmadıkça süreli değil",
        tracked: true,
        mandatory: true,
        note: "Araçta bulundurulması zorunlu. Fotokopi geçersizdir.",
      },
      {
        name: "Zorunlu Mali Sorumluluk Sigortası (Trafik Sigortası)",
        issuer: "Sigorta Şirketi",
        renewal: "Yılda 1 kez",
        tracked: true,
        mandatory: true,
        note: "Sigortasız araç trafiğe çıkarsa ağır idari para cezası.",
      },
      {
        name: "Kasko",
        issuer: "Sigorta Şirketi",
        renewal: "Yılda 1 kez",
        tracked: true,
        mandatory: false,
        note: "Zorunlu değil ama ticari araçlarda şiddetle önerilir.",
      },
      {
        name: "Fenni Muayene",
        issuer: "TÜVTÜRK",
        renewal: "Ticari araçlar: yılda 1 kez",
        tracked: true,
        mandatory: true,
        note: "Muayenesi süresi geçmiş araç trafiğe çıkaramaz. Ceza: 3.500₺+.",
      },
      {
        name: "Egzoz Emisyon Belgesi",
        issuer: "Yetkili Servis",
        renewal: "Fenni muayene ile birlikte",
        tracked: true,
        mandatory: true,
        note: "Fenni muayene öncesi alınır.",
      },
      {
        name: "Okul Servis Aracı İzin Belgesi (Taşıt Kartı)",
        issuer: "Milli Eğitim Müdürlüğü / İlçe Trafik",
        renewal: "Yılda 1 kez (Eylül)",
        tracked: true,
        mandatory: true,
        note: "Okul servisi yapan araçlar için zorunlu. Her yıl eğitim öğretim başında yenilenir.",
      },
      {
        name: "Yetki Belgesi (D2 / C3)",
        issuer: "Ulaştırma Bakanlığı (UBAK)",
        renewal: "5 yılda 1 kez",
        tracked: true,
        mandatory: true,
        note: "D2: Okul servisi, C3: Personel servisi. Belgesi olmayan araç ticari taşıma yapamaz.",
      },
    ],
  },
  {
    id: "sofor",
    title: "Şöför Evrakları",
    icon: Users,
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    badge: "bg-green-100 text-green-700",
    docs: [
      {
        name: "Nüfus Cüzdanı / Kimlik",
        issuer: "Nüfus Müdürlüğü",
        renewal: "Geçerlilik süresine göre",
        tracked: false,
        mandatory: true,
      },
      {
        name: "Sürücü Belgesi (Ehliyet) — B / D Sınıfı",
        issuer: "Sürücü Kursu / Emniyet",
        renewal: "B: Ömür boyu (fotoğraf yenileme), D: Sağlık kontrolüne göre",
        tracked: true,
        mandatory: true,
        note: "10+ kişilik araçlar için D sınıfı ehliyet zorunlu.",
      },
      {
        name: "SRC Belgesi (SRC4 veya SRC5)",
        issuer: "Mesleki Yeterlilik Kurumu",
        renewal: "5 yılda 1 kez",
        tracked: true,
        mandatory: true,
        note: "SRC4: Okul servisi, SRC5: Yolcu taşımacılığı. Okul servisi şöförleri için kesinlikle zorunlu.",
      },
      {
        name: "Psikoteknik Belgesi",
        issuer: "Yetkili Sağlık Kuruluşu",
        renewal: "5 yılda 1 kez (60 yaşından sonra: 2 yılda 1)",
        tracked: true,
        mandatory: true,
        note: "Ticari araç şöförleri için zorunlu. Süresi bitmiş belge = trafikten men.",
      },
      {
        name: "Sağlık Raporu",
        issuer: "Aile Hekimi / Devlet Hastanesi",
        renewal: "Yılda 1 kez",
        tracked: true,
        mandatory: true,
        note: "Ticari sürücüler için yıllık periyodik sağlık kontrolü zorunlu.",
      },
      {
        name: "Adli Sicil Kaydı (Sabıka Kaydı)",
        issuer: "e-Devlet / Adliye",
        renewal: "İşe girişte + gerektiğinde",
        tracked: false,
        mandatory: true,
        note: "Özellikle okul servisi şöförleri için gereklidir. Yasal zorunluluk.",
      },
      {
        name: "Mesleki Sorumluluk Sigortası",
        issuer: "Sigorta Şirketi",
        renewal: "Yılda 1 kez",
        tracked: true,
        mandatory: false,
        note: "Zorunlu değil ama firmanın sigortası şöförü kapsamıyorsa önerilir.",
      },
    ],
  },
  {
    id: "firma",
    title: "Firma Evrakları",
    icon: Building2,
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-200",
    badge: "bg-purple-100 text-purple-700",
    docs: [
      {
        name: "Ticaret Sicil Gazetesi",
        issuer: "Ticaret Odası",
        renewal: "Değişiklikte güncellenir",
        tracked: false,
        mandatory: true,
      },
      {
        name: "Vergi Levhası",
        issuer: "Vergi Dairesi / e-Devlet",
        renewal: "Yılda 1 kez (Mayıs'ta otomatik yenilenir)",
        tracked: false,
        mandatory: true,
      },
      {
        name: "İş Yeri Açma ve Çalışma Ruhsatı",
        issuer: "Belediye",
        renewal: "Değişiklik olmadıkça süreli değil",
        tracked: false,
        mandatory: true,
      },
      {
        name: "Yetki Belgesi (Taşımacılık — UBAK)",
        issuer: "Ulaştırma ve Altyapı Bakanlığı",
        renewal: "5 yılda 1 kez",
        tracked: true,
        mandatory: true,
        note: "Firmaya ait yetki belgesi araçların yetki belgelerinden bağımsızdır.",
      },
      {
        name: "İşveren Mali Mesuliyet Sigortası",
        issuer: "Sigorta Şirketi",
        renewal: "Yılda 1 kez",
        tracked: true,
        mandatory: false,
        note: "Çalışan sayısı arttıkça önem kazanır.",
      },
    ],
  },
];

const PRIORITY: { emoji: string; title: string; items: string[]; color: string }[] = [
  {
    emoji: "🔴",
    title: "1. Öncelik — Yasal Zorunluluk (Hemen Tamamlanmalı)",
    color: "border-red-200 bg-red-50",
    items: [
      "Araç ruhsatları → Teker Takip'e yükle",
      "Trafik sigortası → bitiş tarihi ile sisteme gir",
      "Fenni muayene → bitiş tarihi ile sisteme gir",
      "Taşıt kartları (okul servisi)",
      "Şöförlerin SRC4/SRC5 belgesi",
      "Şöförlerin psikoteknik belgesi",
      "Şöförlerin sağlık raporu",
    ],
  },
  {
    emoji: "🟡",
    title: "2. Öncelik — Operasyonel Güvenlik (İlk Hafta)",
    color: "border-amber-200 bg-amber-50",
    items: [
      "Tüm araçlar için kasko sorgusu",
      "Şöför ehliyetlerinin sınıf kontrolü (D?)",
      "Şöförlerin sabıka kaydı alınması",
      "Firma UBAK yetki belgesinin geçerlilik kontrolü",
    ],
  },
  {
    emoji: "🟢",
    title: "3. Öncelik — Tamamlayıcı (İlk Ay)",
    color: "border-green-200 bg-green-50",
    items: [
      "Tüm evrakların dijital kopyalarını Teker Takip'e yükle",
      "Bitiş tarihi 60 günden az olan evraklara uyarı kur",
      "Şöför bilgilerini (adres, acil iletişim) panele ekle",
      "Araç bakım geçmişini yakıt kayıtlarıyla başlat",
    ],
  },
];

// ─── Bulk Upload bölümü ───────────────────────────────────────────────────

type FileStatus = "waiting" | "analyzing" | "done" | "error";

type FileEntry = {
  id: string;
  file: File;
  status: FileStatus;
  result?: BulkAnalyzeResult;
};

const CATEGORY_LABELS: Record<DocCategory, { label: string; color: string; bg: string }> = {
  arac:     { label: "Araç",  color: "text-blue-700",   bg: "bg-blue-100"   },
  sofor:    { label: "Şöför", color: "text-green-700",  bg: "bg-green-100"  },
  firma:    { label: "Firma", color: "text-purple-700", bg: "bg-purple-100" },
  bilinmiyor: { label: "?",   color: "text-slate-500",  bg: "bg-slate-100"  },
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function BulkUploadSection() {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: File[]) => {
    const valid = newFiles.filter((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      return ["pdf", "jpg", "jpeg", "png"].includes(ext);
    });
    setEntries((prev) => [
      ...prev,
      ...valid.map((file) => ({
        id: Math.random().toString(36).slice(2),
        file,
        status: "waiting" as FileStatus,
      })),
    ]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const removeEntry = (id: string) =>
    setEntries((prev) => prev.filter((e) => e.id !== id));

  const analyze = async () => {
    const waiting = entries.filter((e) => e.status === "waiting");
    if (waiting.length === 0) return;
    setAnalyzing(true);

    // Hepsini "analyzing" yap
    setEntries((prev) =>
      prev.map((e) => (e.status === "waiting" ? { ...e, status: "analyzing" } : e))
    );

    // Dosyaları tek tek gönder (body limiti ve rate limit sorununu önler)
    for (const entry of waiting) {
      const formData = new FormData();
      formData.append("files", entry.file);

      try {
        const res = await fetch("/api/upload/bulk-analyze", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Sunucu hatası");

        const result: BulkAnalyzeResult | undefined = data.results?.[0];
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entry.id
              ? {
                  ...e,
                  status: result?.error ? "error" : ("done" as FileStatus),
                  result: result ?? undefined,
                }
              : e
          )
        );
      } catch (err: any) {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entry.id
              ? {
                  ...e,
                  status: "error" as FileStatus,
                  result: {
                    fileName: entry.file.name,
                    category: "bilinmiyor",
                    docType: null,
                    docTitle: null,
                    holderIdentifier: null,
                    expiryDate: null,
                    entityMatch: null,
                    error: err.message ?? "Sunucu hatası",
                  } as BulkAnalyzeResult,
                }
              : e
          )
        );
      }
    }

    setAnalyzing(false);
  };

  const waitingCount = entries.filter((e) => e.status === "waiting").length;
  const doneCount = entries.filter((e) => e.status === "done").length;

  return (
    <div className="space-y-4">
      {/* Açıklama */}
      <div className="bg-[#1B2437] rounded-2xl p-5 text-white flex gap-4 items-start">
        <Sparkles className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm mb-1">AI Destekli Toplu Evrak Taraması</p>
          <p className="text-sm text-slate-300">
            Evraklarınızı sürükleyin veya seçin. Yapay zeka her belgeyi okuyarak kategorisini
            (araç / şöför / firma), belge türünü, son geçerlilik tarihini ve varsa sistemimizdeki
            eşleşen kayıt bağlantısını otomatik olarak çıkarır.
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-[#DC2626] bg-red-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
        }`}
      >
        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">
          Evrakları buraya sürükleyin veya tıklayın
        </p>
        <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG — aynı anda 20 dosyaya kadar</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
        />
      </div>

      {/* Dosya listesi */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry) => {
            const cat = entry.result?.category ?? "bilinmiyor";
            const catMeta = CATEGORY_LABELS[cat];
            const isAnalyzing = entry.status === "analyzing";
            const isDone = entry.status === "done";
            const isError = entry.status === "error";

            return (
              <div
                key={entry.id}
                className="border border-slate-200 rounded-xl bg-white overflow-hidden"
              >
                {/* Dosya başlığı satırı */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {isAnalyzing && (
                    <Loader2 className="w-4 h-4 text-[#DC2626] animate-spin flex-shrink-0" />
                  )}
                  {isDone && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                  {isError && (
                    <FileWarning className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  {entry.status === "waiting" && (
                    <Clock className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  )}

                  <span className="text-sm text-slate-700 font-medium flex-1 truncate">
                    {entry.file.name}
                  </span>

                  {isAnalyzing && (
                    <span className="text-xs text-slate-400">Analiz ediliyor...</span>
                  )}
                  {isError && entry.result?.error && (
                    <span className="text-xs text-red-500">{entry.result.error}</span>
                  )}

                  {entry.status === "waiting" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeEntry(entry.id); }}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Analiz sonucu */}
                {isDone && entry.result && (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Kategori */}
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase mb-1">Kategori</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${catMeta.bg} ${catMeta.color}`}>
                        {catMeta.label}
                      </span>
                    </div>

                    {/* Belge türü */}
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase mb-1">Belge</p>
                      <p className="text-xs text-slate-700 font-medium leading-tight">
                        {entry.result.docTitle ?? entry.result.docType ?? "—"}
                      </p>
                    </div>

                    {/* Sahip / plaka */}
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase mb-1">
                        {cat === "arac" ? "Plaka" : "Ad Soyad"}
                      </p>
                      <p className="text-xs text-slate-700 font-medium">
                        {entry.result.holderIdentifier ?? "—"}
                      </p>
                    </div>

                    {/* Bitiş tarihi */}
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase mb-1">
                        Geçerlilik Bitişi
                      </p>
                      <p className={`text-xs font-semibold ${
                        entry.result.expiryDate
                          ? new Date(entry.result.expiryDate) < new Date()
                            ? "text-red-600"
                            : "text-green-600"
                          : "text-slate-400"
                      }`}>
                        {formatDate(entry.result.expiryDate) ?? "—"}
                      </p>
                    </div>

                    {/* Sistem eşleşmesi */}
                    {entry.result.entityMatch && (
                      <div className="col-span-2 sm:col-span-4 pt-2 border-t border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {entry.result.entityMatch.type === "vehicle"
                            ? <Truck className="w-3.5 h-3.5 text-blue-500" />
                            : <Users className="w-3.5 h-3.5 text-green-500" />
                          }
                          <span className="text-xs text-slate-600">
                            Sistemde eşleşti:
                            <span className="font-semibold ml-1">{entry.result.entityMatch.label}</span>
                          </span>
                        </div>
                        <a
                          href={entry.result.entityMatch.url}
                          className="flex items-center gap-1 text-xs text-[#DC2626] font-semibold hover:underline"
                        >
                          Aç <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {!entry.result.entityMatch && entry.result.holderIdentifier && (
                      <div className="col-span-2 sm:col-span-4 pt-2 border-t border-slate-200">
                        <p className="text-xs text-amber-600 flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3" />
                          Sistemde eşleşen kayıt bulunamadı. Manuel olarak ilgili araca/şöföre ekleyin.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Aksiyon butonları */}
      {entries.length > 0 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-400">
            {entries.length} dosya
            {doneCount > 0 && ` · ${doneCount} analiz tamamlandı`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setEntries([])}
              disabled={analyzing}
              className="text-xs text-slate-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              Temizle
            </button>
            {waitingCount > 0 && (
              <button
                onClick={analyze}
                disabled={analyzing}
                className="flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
              >
                {analyzing
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Analiz ediliyor...</>
                  : <><Sparkles className="w-4 h-4" /> {waitingCount} Dosyayı Analiz Et</>
                }
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ana sayfa ─────────────────────────────────────────────────────────────

export default function EvrakRehberiPage() {
  const [tab, setTab] = useState<"rehber" | "toplu">("toplu");
  const [openCat, setOpenCat] = useState<string | null>("arac");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#DC2626] rounded-xl flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Evrak Rehberi</h1>
            <p className="text-sm text-slate-500">Yasal uyum ve hızlı geçiş araçları</p>
          </div>
        </div>

        {/* Sekmeler */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab("toplu")}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
              tab === "toplu"
                ? "bg-white text-[#DC2626] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Toplu Yükleme
          </button>
          <button
            onClick={() => setTab("rehber")}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
              tab === "rehber"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Shield className="w-4 h-4" />
            Evrak Rehberi
          </button>
        </div>
      </div>

      {/* ─── AI Toplu Yükleme sekmesi ─── */}
      {tab === "toplu" && <BulkUploadSection />}

      {/* ─── Rehber sekmesi ─── */}
      {tab === "rehber" && (
        <>
          {/* Uyarı banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Yasal Hatırlatma</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Süresi dolan evrak = trafik cezası + sigorta geçersizliği + yasal sorumluluk. Tüm belgeleri
                Teker Takip'e girmek bitiş tarihlerini otomatik takip eder.
              </p>
            </div>
          </div>

          {/* Öncelik listesi */}
          <div>
            <h2 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-[#DC2626]" />
              Öncelik Sırası
            </h2>
            <div className="space-y-3">
              {PRIORITY.map((p) => (
                <div key={p.title} className={`border rounded-2xl p-4 ${p.color}`}>
                  <p className="text-sm font-bold text-slate-800 mb-2">{p.emoji} {p.title}</p>
                  <ul className="space-y-1">
                    {p.items.map((item) => (
                      <li key={item} className="text-sm text-slate-600 flex items-start gap-2">
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Kategoriler */}
          <div>
            <h2 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#DC2626]" />
              Belge Detayları
            </h2>
            <div className="space-y-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isOpen = openCat === cat.id;
                return (
                  <div key={cat.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <button
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                      onClick={() => setOpenCat(isOpen ? null : cat.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cat.bg} border`}>
                          <Icon className={`w-4 h-4 ${cat.color}`} />
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-slate-800 text-sm">{cat.title}</div>
                          <div className="text-xs text-slate-400">{cat.docs.length} belge</div>
                        </div>
                      </div>
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 text-slate-400" />
                        : <ChevronDown className="w-4 h-4 text-slate-400" />
                      }
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-100 divide-y divide-slate-50">
                        {cat.docs.map((doc) => (
                          <div key={doc.name} className="p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-sm font-semibold text-slate-800">{doc.name}</span>
                                  {doc.mandatory
                                    ? <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">ZORUNLU</span>
                                    : <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">İsteğe Bağlı</span>
                                  }
                                  {doc.tracked && (
                                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <CheckCircle2 className="w-2.5 h-2.5" /> TT Takip Eder
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-4 mt-1">
                                  <span className="text-xs text-slate-500">
                                    <span className="font-medium text-slate-600">Veren:</span> {doc.issuer}
                                  </span>
                                  <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {doc.renewal}
                                  </span>
                                </div>
                                {doc.note && (
                                  <div className="mt-2 flex items-start gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                                    <Info className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-xs text-amber-700">{doc.note}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* TT entegrasyonu */}
          <div className="bg-[#1B2437] rounded-2xl p-5 text-white">
            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Teker Takip'te Evrak Takibi Nasıl Yapılır?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { step: "1", text: "Araçlar menüsü → Araç detayı → Belgeler sekmesi → 'Belge Ekle'" },
                { step: "2", text: "Şöförler menüsü → Şöför detayı → Belgeler sekmesi → ilgili belgeyi yükle" },
                { step: "3", text: "Bitiş tarihini gir → Sistem 60, 30, 7 gün öncesinde seni uyarır" },
                { step: "4", text: "Dashboard'da süresi yaklaşan belgeler kırmızıyla gösterilir" },
              ].map((s) => (
                <div key={s.step} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-[#DC2626] flex items-center justify-center flex-shrink-0 text-xs font-black">
                    {s.step}
                  </div>
                  <p className="text-sm text-slate-300">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  );
}

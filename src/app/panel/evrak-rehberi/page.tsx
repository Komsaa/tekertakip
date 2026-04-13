"use client";

import { useState } from "react";
import {
  FileCheck, Truck, Users, Building2, AlertTriangle,
  CheckCircle2, Clock, ChevronDown, ChevronUp, Info,
  Shield, Star,
} from "lucide-react";

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
        note: "SRC4: Okul servisi, SRC5: Yolcu taşımacılığı. Okul servisi şöförderi için kesinlikle zorunlu.",
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

export default function EvrakRehberiPage() {
  const [openCat, setOpenCat] = useState<string | null>("arac");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#DC2626] rounded-xl flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Evrak Rehberi</h1>
            <p className="text-sm text-slate-500">Yasal uyum için gerekli belgeler ve öncelik sırası</p>
          </div>
        </div>
      </div>

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
                    <span className="text-slate-400 mt-0.5">›</span>
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

    </div>
  );
}

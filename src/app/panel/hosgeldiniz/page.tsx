"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Truck,
  Users,
  Building2,
  ClipboardList,
  Fuel,
  FileText,
  Receipt,
  ArrowRight,
  Sparkles,
} from "lucide-react";

type Stats = {
  vehicles: number;
  drivers: number;
  jobs: number;
  fuelEntries: number;
  clients: number;
  documents: number;
};

type Step = {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  tip: string;
  href: string;
  done: (s: Stats) => boolean;
  color: string;
};

const STEPS: Step[] = [
  {
    id: "vehicles",
    icon: Truck,
    title: "Araçlarını ekle",
    description: "Filodaki araçları plaka, model ve kapasite bilgileriyle kaydet.",
    tip: "Hepsini bir anda eklemeye gerek yok — bir araçla başla, gerisini ekleyerek devam et.",
    href: "/panel/araclar",
    done: (s) => s.vehicles > 0,
    color: "blue",
  },
  {
    id: "drivers",
    icon: Users,
    title: "Şöförleri ekle",
    description: "Şöför profillerini oluştur. Mobil uygulama erişimi için PIN belirle.",
    tip: "Şöför ekleyince mobil uygulamaya giriş yapabilir, yakıt ve arıza bildirebilir.",
    href: "/panel/soforler",
    done: (s) => s.drivers > 0,
    color: "purple",
  },
  {
    id: "jobs",
    icon: ClipboardList,
    title: "İlk seferi kaydet",
    description: "Tamamlanan veya planlanan işleri kayıt altına al. Şoför, araç, müşteri ata.",
    tip: "Seferler gelir takibinin temelidir — ne kadar erken başlarsan o kadar iyi.",
    href: "/panel/isler",
    done: (s) => s.jobs > 0,
    color: "orange",
  },
  {
    id: "clients",
    icon: Building2,
    title: "Müşteri firma ekle",
    description: "Fatura kestiğin firmaları tanımla. VKN, vade gün sayısı, birim fiyat, KDV/tevkifat oranı.",
    tip: "Firma ekleyince PDF faturalarını yükleyip takip edebilirsin.",
    href: "/panel/faturalar",
    done: (s) => s.clients > 0,
    color: "green",
  },
  {
    id: "fuel",
    icon: Fuel,
    title: "Yakıt takibine başla",
    description: "Her yakıt alımını kaydet. Araç başı tüketim ve maliyet otomatik hesaplanır.",
    tip: "Yakıt, filonun en büyük gider kalemi. Takip erken başladıkça anlamlı olur.",
    href: "/panel/yakit",
    done: (s) => s.fuelEntries > 0,
    color: "red",
  },
  {
    id: "documents",
    icon: FileText,
    title: "Belge tarihlerini gir",
    description: "Araçların muayene, sigorta, güzergah izni tarihlerini ekle. Sona ermeye yaklaşınca dashboard'da uyarı alırsın.",
    tip: "Önce en yakın sona erecek belgeden başla — hepsini aynı anda girmen gerekmez.",
    href: "/panel/araclar",
    done: (s) => s.documents > 0,
    color: "teal",
  },
  {
    id: "invoice",
    icon: Receipt,
    title: "İlk faturanı yükle",
    description: "Muhasebecinin kestiği e-faturaları PDF olarak sisteme yükle. Bilgiler otomatik okunur.",
    tip: "Toplu PDF yükleme özelliğiyle ay başı faturaları tek seferde aktarabilirsin.",
    href: "/panel/faturalar",
    done: (s) => s.clients > 0 && s.jobs > 0,
    color: "slate",
  },
];

const colorMap: Record<string, { bg: string; icon: string; badge: string; btn: string }> = {
  blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   badge: "bg-blue-100 text-blue-700",   btn: "bg-blue-600 hover:bg-blue-700" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600", badge: "bg-purple-100 text-purple-700", btn: "bg-purple-600 hover:bg-purple-700" },
  green:  { bg: "bg-green-50",  icon: "text-green-600",  badge: "bg-green-100 text-green-700",  btn: "bg-green-600 hover:bg-green-700" },
  orange: { bg: "bg-orange-50", icon: "text-orange-600", badge: "bg-orange-100 text-orange-700", btn: "bg-orange-600 hover:bg-orange-700" },
  red:    { bg: "bg-red-50",    icon: "text-red-600",    badge: "bg-red-100 text-red-700",      btn: "bg-red-600 hover:bg-red-700" },
  teal:   { bg: "bg-teal-50",   icon: "text-teal-600",   badge: "bg-teal-100 text-teal-700",   btn: "bg-teal-600 hover:bg-teal-700" },
  slate:  { bg: "bg-slate-50",  icon: "text-slate-600",  badge: "bg-slate-100 text-slate-700",  btn: "bg-slate-700 hover:bg-slate-800" },
};

export default function HosgeldinizPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/panel/onboarding")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const completedCount = stats ? STEPS.filter((s) => s.done(stats)).length : 0;
  const allDone = completedCount === STEPS.length;
  const progressPct = Math.round((completedCount / STEPS.length) * 100);

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Başlık */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-[#DC2626]" />
          <span className="text-sm font-semibold text-[#DC2626] uppercase tracking-wide">Başlangıç Rehberi</span>
        </div>
        <h1 className="text-3xl font-black text-slate-800">
          {allDone ? "Her şey hazır!" : "Sistemi birlikte kuralım"}
        </h1>
        <p className="text-slate-500 mt-2">
          {allDone
            ? "Tüm adımları tamamladınız. Sistemi aktif olarak kullanabilirsiniz."
            : "Adım adım ilerleyin. Her şeyi bir anda yapmanıza gerek yok."}
        </p>
      </div>

      {/* İlerleme çubuğu */}
      {!loading && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">İlerleme</span>
            <span className="text-sm font-bold text-slate-800">{completedCount} / {STEPS.length} adım</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#DC2626] rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {allDone && (
            <p className="text-sm text-green-600 font-medium">
              Tebrikler! Sistem kullanıma hazır.
            </p>
          )}
        </div>
      )}

      {/* Adımlar */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16 text-slate-400">Yükleniyor...</div>
        ) : (
          STEPS.map((step, i) => {
            const done = stats ? step.done(stats) : false;
            const c = colorMap[step.color];
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`bg-white rounded-2xl border p-5 transition-all ${
                  done ? "border-green-200 opacity-75" : "border-slate-100 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Numara / Check */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    done ? "bg-green-100" : c.bg
                  }`}>
                    {done
                      ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                      : <Icon className={`w-5 h-5 ${c.icon}`} />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-400">Adım {i + 1}</span>
                      {done && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                          Tamamlandı
                        </span>
                      )}
                    </div>
                    <h3 className={`font-bold text-base ${done ? "text-slate-400 line-through" : "text-slate-800"}`}>
                      {step.title}
                    </h3>
                    {!done && (
                      <>
                        <p className="text-sm text-slate-500 mt-1">{step.description}</p>
                        <div className={`mt-3 text-xs px-3 py-2 rounded-lg ${c.badge} font-medium`}>
                          💡 {step.tip}
                        </div>
                        <Link
                          href={step.href}
                          className={`mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl transition-all ${c.btn}`}
                        >
                          Başla
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Alt not */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 text-sm text-slate-500 space-y-3">
        <div>
          <p className="font-semibold text-slate-700 mb-1">Önerilen başlangıç sırası</p>
          <p><strong>Araçlar → Şöförler → Müşteri Firmalar → İşler</strong>. Bu dört adım tamamlandığında sistem operasyonel olur.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-700 mb-1">Faturalar</p>
          <p>Muhasebecinden gelen PDF faturaları Faturalar sayfasındaki <strong>Toplu PDF Yükle</strong> butonuyla tek seferde sisteme aktarabilirsin.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-700 mb-1">Belgeler</p>
          <p>Araç muayene, sigorta ve güzergah izni tarihlerini araç detay sayfasından girebilirsin. Sona ermeye 30 gün kala dashboard&apos;da uyarı çıkar.</p>
        </div>
      </div>
    </div>
  );
}

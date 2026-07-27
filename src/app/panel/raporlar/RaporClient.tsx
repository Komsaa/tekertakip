"use client";

import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  Fuel, Users, FileText, Route, Banknote,
} from "lucide-react";

const MONTHS = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

const TRY = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " ₺";

const PIE_COLORS = ["#EF4444", "#F97316", "#6366F1", "#10B981"];

type TrendItem = { label: string; gelir: number; yakit: number; maas: number };

interface Props {
  month: number;
  year: number;
  trendData: TrendItem[];
  summary: {
    totalFatura: number;
    tahsilEdilen: number;
    totalYakit: number;
    totalMaas: number;
    seferCount: number;
    netKar: number;
  };
  invoices: { invoiceNo: string; clientName: string; amount: number; status: string; issueDate: string }[];
  fuelByVehicle: { plate: string; amount: number }[];
  drivers: { name: string; jobCount: number; salary: number }[];
}

function StatCard({
  label, value, icon: Icon, color, sub,
}: { label: string; value: string; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-xl font-black text-white">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1B2437] border border-white/10 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-white font-bold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {TRY(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function RaporClient({ month, year, trendData, summary, invoices, fuelByVehicle, drivers }: Props) {
  const router = useRouter();

  function navigate(m: number, y: number) {
    router.push(`/panel/raporlar?month=${m}&year=${y}`);
  }

  function prev() {
    if (month === 1) navigate(12, year - 1);
    else navigate(month - 1, year);
  }

  function next() {
    const now = new Date();
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) return;
    if (month === 12) navigate(1, year + 1);
    else navigate(month + 1, year);
  }

  const pieData = [
    { name: "Yakıt", value: summary.totalYakit },
    { name: "Maaş", value: summary.totalMaas },
  ].filter((d) => d.value > 0);

  const bekleyen = summary.totalFatura - summary.tahsilEdilen;
  const isPositive = summary.netKar >= 0;

  return (
    <div className="flex-1 overflow-y-auto bg-[#131c2e] p-4 space-y-4">

      {/* Başlık + Ay navigasyon */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-black text-xl">Aylık Rapor</h1>
          <p className="text-slate-400 text-sm mt-0.5">{MONTHS[month]} {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white font-semibold text-sm min-w-[100px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={next}
            className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          label="Fatura Toplamı"
          value={TRY(summary.totalFatura)}
          icon={FileText}
          color="text-blue-400"
          sub={`${invoices.length} fatura`}
        />
        <StatCard
          label="Tahsil Edilen"
          value={TRY(summary.tahsilEdilen)}
          icon={TrendingUp}
          color="text-green-400"
          sub={bekleyen > 0 ? `${TRY(bekleyen)} bekliyor` : "Tamamı tahsil"}
        />
        <StatCard
          label="Yakıt Gideri"
          value={TRY(summary.totalYakit)}
          icon={Fuel}
          color="text-orange-400"
        />
        <StatCard
          label="Maaş Gideri"
          value={TRY(summary.totalMaas)}
          icon={Users}
          color="text-purple-400"
          sub={`${drivers.length} şöför`}
        />
        <StatCard
          label="Sefer Sayısı"
          value={String(summary.seferCount)}
          icon={Route}
          color="text-amber-400"
        />
        <div className={`rounded-2xl p-4 border ${isPositive ? "bg-green-500/15 border-green-500/30" : "bg-red-500/15 border-red-500/30"}`}>
          <div className="flex items-center gap-2 mb-2">
            {isPositive
              ? <TrendingUp className="w-4 h-4 text-green-400" />
              : <TrendingDown className="w-4 h-4 text-red-400" />}
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Net Tahmini</span>
          </div>
          <div className={`text-xl font-black ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}{TRY(summary.netKar)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Tahsil − Yakıt − Maaş</div>
        </div>
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 6 aylık trend */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Son 6 Ay Trend</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendData} barGap={4}>
              <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
              <Bar dataKey="gelir" name="Gelir" fill="#22C55E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="yakit" name="Yakıt" fill="#F97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="maas" name="Maaş" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gider dağılımı */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Gider Dağılımı</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  label={({ name, percent }) => `${name} %${(percent * 100).toFixed(0)}`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => TRY(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-slate-500 text-sm">
              Veri yok
            </div>
          )}
        </div>
      </div>

      {/* Alt tablo grubu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Faturalar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Faturalar</p>
          {invoices.length === 0 ? (
            <p className="text-slate-500 text-sm">Bu ay fatura yok</p>
          ) : (
            <div className="space-y-2">
              {invoices.slice(0, 8).map((inv) => (
                <div key={inv.invoiceNo} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${inv.status === "odendi" ? "bg-green-400" : inv.status === "gecikti" ? "bg-red-400" : "bg-amber-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{inv.clientName}</p>
                    <p className="text-slate-500 text-xs">{inv.invoiceNo}</p>
                  </div>
                  <p className="text-white text-xs font-bold flex-shrink-0">{TRY(inv.amount)}</p>
                </div>
              ))}
              {invoices.length > 8 && (
                <p className="text-slate-500 text-xs text-center">+{invoices.length - 8} fatura daha</p>
              )}
            </div>
          )}
        </div>

        {/* Şöför performansı */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Şöför Performansı</p>
          {drivers.length === 0 ? (
            <p className="text-slate-500 text-sm">Veri yok</p>
          ) : (
            <div className="space-y-2">
              {drivers.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-slate-400 text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{d.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div
                        className="h-1.5 bg-[#DC2626] rounded-full"
                        style={{ width: `${Math.min(100, (d.jobCount / (drivers[0]?.jobCount || 1)) * 100)}%`, maxWidth: "80px" }}
                      />
                      <span className="text-slate-500 text-xs">{d.jobCount} sefer</span>
                    </div>
                  </div>
                  {d.salary > 0 && (
                    <p className="text-slate-400 text-xs flex-shrink-0">{TRY(d.salary)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Araç yakıt */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Araç Yakıt Gideri</p>
          {fuelByVehicle.length === 0 ? (
            <p className="text-slate-500 text-sm">Yakıt girişi yok</p>
          ) : (
            <div className="space-y-2">
              {fuelByVehicle.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Fuel className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold">{f.plate}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div
                        className="h-1.5 bg-orange-500 rounded-full"
                        style={{ width: `${Math.min(100, (f.amount / (fuelByVehicle[0]?.amount || 1)) * 100)}%`, maxWidth: "80px" }}
                      />
                    </div>
                  </div>
                  <p className="text-orange-400 text-xs font-bold flex-shrink-0">{TRY(f.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

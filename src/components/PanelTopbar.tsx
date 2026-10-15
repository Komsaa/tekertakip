"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Settings } from "lucide-react";

const labels: Record<string, string> = {
  araclar: "Araçlar", soforler: "Şoförler", guzergahlar: "Güzergâhlar",
  "servis-takip": "Servis takibi", konum: "Canlı konum", "servis-odemeler": "Servis ödemeleri",
  isler: "İşler ve seferler", yakit: "Yakıt", bakim: "Bakım", arizalar: "Arıza bildirimleri",
  takvim: "Gelir ve gider", faturalar: "Faturalar", odeme: "Alacak ve borç", maaslar: "Maaşlar",
  kredikartlari: "Kredi kartları", raporlar: "Raporlar", taseronlar: "Taşeronlar", finans: "Finans",
  belgeler: "Belgeler", "evrak-rehberi": "Evrak rehberi", gorevler: "Görevler", ayarlar: "Ayarlar",
  admin: "Yönetim", sirketler: "Şirketler", hosgeldiniz: "Kurulum sihirbazı",
};
export default function PanelTopbar({ userName }: { userName: string }) {
  const section = usePathname().split("/")[2];
  return <header className="panel-topbar">
    <nav aria-label="Sayfa konumu" className="flex items-center gap-2 min-w-0 text-sm">
      <Link href="/panel" className="text-slate-500 hover:text-slate-900">Çalışma alanı</Link>
      <ChevronRight size={14} className="text-slate-300 shrink-0" />
      <span className="font-semibold text-slate-800 truncate">{labels[section] || "Genel bakış"}</span>
    </nav>
    <Link href="/panel/ayarlar" aria-label="Hesap ayarları" className="panel-account">
      <span className="hidden sm:block max-w-40 truncate">{userName}</span><Settings size={18} />
    </Link>
  </header>;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogoIcon } from "@/components/Logo";
import {
  LayoutDashboard,
  Users,
  Truck,
  ClipboardList,
  Fuel,
  CheckSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Route,
  CalendarDays,
  Wallet,
  MapPin,
  FileText,
  ShieldCheck,
  Sparkles,
  FlaskConical,
  Wrench,
  Banknote,
  Receipt,
  HandCoins,
  Bus,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Genel",
    items: [
      { href: "/panel", icon: LayoutDashboard, label: "Dashboard", exact: true },
      { href: "/panel/hosgeldiniz", icon: Sparkles, label: "Başlangıç Rehberi" },
    ],
  },
  {
    label: "Filo",
    items: [
      { href: "/panel/soforler", icon: Users, label: "Şöförler" },
      { href: "/panel/servis-takip", icon: Bus, label: "Servis Takip" },
      { href: "/panel/konum", icon: MapPin, label: "Canlı Konum" },
      { href: "/panel/araclar", icon: Truck, label: "Araçlar" },
      { href: "/panel/guzergahlar", icon: Route, label: "Güzergahlar" },
      { href: "/panel/servis-odemeler", icon: Wallet, label: "Servis Ödemeleri" },
    ],
  },
  {
    label: "Operasyon",
    items: [
      { href: "/panel/isler", icon: ClipboardList, label: "İşler / Seferler" },
      { href: "/panel/taseronlar", icon: Truck, label: "Taşeronlar" },
      { href: "/panel/yakit", icon: Fuel, label: "Yakıt Takibi" },
      { href: "/panel/arizalar", icon: Wrench, label: "Arıza Bildirimleri" },
    ],
  },
  {
    label: "Finans",
    items: [
      { href: "/panel/takvim", icon: CalendarDays, label: "Gelir / Gider Takvimi" },
      { href: "/panel/faturalar", icon: Receipt, label: "Faturalar" },
      { href: "/panel/odeme", icon: HandCoins, label: "Alacak / Borç / Çek" },
      { href: "/panel/maaslar", icon: Banknote, label: "Maaşlar" },
      { href: "/panel/kredikartlari", icon: CreditCard, label: "Kredi Kartları" },
    ],
  },
  {
    label: "Diğer",
    items: [
      { href: "/panel/belgeler", icon: FileText, label: "Belge Arşivi" },
      { href: "/panel/gorevler", icon: CheckSquare, label: "Görevlerim" },
      { href: "/panel/ayarlar", icon: Settings, label: "Ayarlar" },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/panel/admin", icon: ShieldCheck, label: "Admin" },
      { href: "/panel/admin/simulator", icon: FlaskConical, label: "Mobil Simülatör" },
    ],
  },
];

const okulAllowed = new Set([
  "/panel",
  "/panel/soforler",
  "/panel/servis-takip",
  "/panel/konum",
  "/panel/araclar",
  "/panel/guzergahlar",
  "/panel/servis-odemeler",
  "/panel/arizalar",
  "/panel/belgeler",
  "/panel/evrak-rehberi",
  "/panel/gorevler",
  "/panel/ayarlar",
]);

interface SidebarProps {
  userName: string;
  role?: string;
  companyType?: string;
}

export default function Sidebar({ userName, role, companyType }: SidebarProps) {
  const isAdmin = !role || role === "admin";
  const isOkul = !isAdmin && companyType === "okul";
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <Link href="/panel" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <LogoIcon size={38} className="text-white" />
          <div>
            <div className="text-white font-black text-base leading-tight">
              teker<span className="text-[#DC2626]">takip</span>
            </div>
            <div className="text-slate-500 text-xs">tekertakip.com</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 overflow-y-auto sidebar-scroll space-y-4">
        {navGroups.filter((group) => {
          if (!isAdmin && group.label === "Sistem") return false;
          if (isOkul && (group.label === "Operasyon" || group.label === "Finans")) return false;
          return true;
        }).map((group) => (
          <div key={group.label}>
            <div className="px-4 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {group.label}
            </div>
            <div className="space-y-0.5 mt-1">
              {group.items.filter((item) => {
                if (!isAdmin && item.href === "/panel/sirketler") return false;
                if (isOkul && !okulAllowed.has(item.href)) return false;
                return true;
              }).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive(item)
                      ? "bg-[#DC2626] text-white shadow-lg shadow-red-500/20"
                      : "text-slate-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Alt: Kullanıcı + Çıkış */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <div className="px-4 py-2 rounded-xl bg-white/5">
          <div className="text-white text-sm font-medium truncate">{userName}</div>
          <div className="text-slate-400 text-xs capitalize">{role === "admin" ? "Süper Admin" : companyType === "okul" ? "Okul Yöneticisi" : role === "firma" ? "Firma Yöneticisi" : role ?? "Kullanıcı"}</div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Çıkış Yap
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#1B2437] flex-col flex-shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile: Hamburger */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-[#1B2437] text-white rounded-xl shadow-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed left-0 top-0 bottom-0 w-72 bg-[#1B2437] z-50 shadow-2xl">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </div>
          </>
        )}
      </div>
    </>
  );
}

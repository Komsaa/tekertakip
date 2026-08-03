"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogoIcon } from "@/components/Logo";
import {
  LayoutDashboard, Users, Truck, ClipboardList, Fuel,
  LogOut, Menu, X, Route, CalendarDays, Wallet, MapPin,
  ShieldCheck, Sparkles, Wrench, Banknote,
  Receipt, HandCoins, Bus, CreditCard, ChevronDown, BarChart3, AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type NavItem  = { href: string; icon: React.ElementType; label: string; exact?: boolean };
type NavGroup = { label: string; icon: React.ElementType; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "Genel",
    icon: LayoutDashboard,
    items: [
      { href: "/panel", icon: LayoutDashboard, label: "Dashboard", exact: true },
      { href: "/panel/hosgeldiniz", icon: Sparkles, label: "Başlangıç Rehberi" },
    ],
  },
  {
    label: "Filo",
    icon: Bus,
    items: [
      { href: "/panel/soforler",        icon: Users,      label: "Şöförler" },
      { href: "/panel/araclar",         icon: Truck,      label: "Araçlar" },
      { href: "/panel/guzergahlar",     icon: Route,      label: "Güzergahlar" },
      { href: "/panel/servis-takip",    icon: Bus,        label: "Servis Takip" },
      { href: "/panel/konum",           icon: MapPin,     label: "Canlı Konum" },
      { href: "/panel/servis-odemeler", icon: Wallet,     label: "Servis Ödemeleri" },
    ],
  },
  {
    label: "Operasyon",
    icon: ClipboardList,
    items: [
      { href: "/panel/isler",    icon: ClipboardList, label: "İşler / Seferler" },
      { href: "/panel/yakit",   icon: Fuel,           label: "Yakıt Takibi" },
      { href: "/panel/bakim",   icon: Wrench,            label: "Bakım Takibi" },
      { href: "/panel/arizalar",icon: AlertTriangle,    label: "Arıza Bildirimleri" },
      { href: "/panel/taseronlar", icon: Truck,        label: "Taşeronlar" },
    ],
  },
  {
    label: "Finans",
    icon: Banknote,
    items: [
      { href: "/panel/takvim",       icon: CalendarDays, label: "Gelir / Gider" },
      { href: "/panel/faturalar",    icon: Receipt,      label: "Faturalar" },
      { href: "/panel/odeme",        icon: HandCoins,    label: "Alacak / Borç / Çek" },
      { href: "/panel/maaslar",      icon: Banknote,     label: "Maaşlar" },
      { href: "/panel/kredikartlari",icon: CreditCard,   label: "Kredi Kartları" },
      { href: "/panel/raporlar",     icon: BarChart3,    label: "Raporlar" },
    ],
  },
  {
    label: "Sistem",
    icon: ShieldCheck,
    items: [
      { href: "/panel/admin",           icon: ShieldCheck,  label: "Admin" },
    ],
  },
];

const okulAllowed = new Set([
  "/panel", "/panel/soforler", "/panel/servis-takip", "/panel/konum",
  "/panel/araclar", "/panel/guzergahlar", "/panel/servis-odemeler",
  "/panel/arizalar", "/panel/belgeler", "/panel/evrak-rehberi",
  "/panel/gorevler", "/panel/ayarlar",
]);

interface SidebarProps { userName: string; role?: string; companyType?: string }

export default function Sidebar({ userName, role, companyType }: SidebarProps) {
  const isAdmin = !role || role === "admin";
  const isOkul  = !isAdmin && companyType === "okul";
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(item: NavItem) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  function groupHasActive(group: NavGroup) {
    return group.items.some((item) => isActive(item));
  }

  // Hangi gruplar açık — başlangıçta aktif grubun index'i açık
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const g of navGroups) {
      if (g.items.some((item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href)))) {
        initial.add(g.label);
      }
    }
    // Hiç aktif yoksa Genel'i aç
    if (initial.size === 0) initial.add("Genel");
    return initial;
  });

  // Sayfa değişince aktif grubu aç
  useEffect(() => {
    for (const g of navGroups) {
      if (g.items.some((item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href)))) {
        setOpenGroups((prev) => new Set([...Array.from(prev), g.label]));
      }
    }
  }, [pathname]);

  function toggleGroup(label: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  const visibleGroups = navGroups.filter((group) => {
    if (!isAdmin && group.label === "Sistem") return false;
    if (isOkul && (group.label === "Operasyon" || group.label === "Finans")) return false;
    // Admin kullanıcılar için sadece Genel ve Sistem
    if (isAdmin && !["Genel", "Sistem"].includes(group.label)) return false;
    return true;
  });

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <Link href="/panel" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <LogoIcon size={36} className="text-white" />
          <div>
            <div className="text-white font-black text-base leading-tight">
              teker<span className="text-[#DC2626]">takip</span>
            </div>
            <div className="text-slate-500 text-xs">tekertakip.com</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 overflow-y-auto sidebar-scroll space-y-1">
        {visibleGroups.map((group) => {
          const isOpen    = openGroups.has(group.label);
          const hasActive = groupHasActive(group);

          const visibleItems = group.items.filter((item) => {
            if (!isAdmin && item.href === "/panel/sirketler") return false;
            if (isOkul && !okulAllowed.has(item.href)) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label}>
              {/* Grup başlığı — tıklanabilir */}
              <button
                onClick={() => toggleGroup(group.label)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  hasActive
                    ? "text-white bg-white/10"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <group.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{group.label}</span>
                {hasActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] mr-1" />
                )}
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0",
                    isOpen ? "rotate-180" : ""
                  )}
                />
              </button>

              {/* Grup içeriği */}
              {isOpen && (
                <div className="mt-0.5 ml-3 pl-3 border-l border-white/10 space-y-0.5 pb-1">
                  {visibleItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        isActive(item)
                          ? "bg-[#DC2626] text-white shadow-lg shadow-red-500/20"
                          : "text-slate-400 hover:text-white hover:bg-white/10"
                      )}
                    >
                      <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Alt: Kullanıcı + Çıkış */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <div className="px-4 py-2 rounded-xl bg-white/5">
          <div className="text-white text-sm font-semibold truncate">{userName}</div>
          <div className="text-slate-500 text-xs mt-0.5">
            {role === "admin" ? "Süper Admin" : companyType === "okul" ? "Okul Yöneticisi" : role === "firma" ? "Firma Yöneticisi" : "Kullanıcı"}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-60 bg-[#1B2437] flex-col flex-shrink-0 h-screen sticky top-0">
        {SidebarContent()}
      </aside>

      {/* Mobile hamburger */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-[#1B2437] text-white rounded-xl shadow-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        {mobileOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
            <div className="fixed left-0 top-0 bottom-0 w-72 bg-[#1B2437] z-50 shadow-2xl">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              {SidebarContent()}
            </div>
          </>
        )}
      </div>
    </>
  );
}

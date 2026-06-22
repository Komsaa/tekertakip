import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import RouteAlerts from "@/components/RouteAlerts";
import DemoBanner from "@/components/DemoBanner";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Firma kullanıcısı ise demo durumunu kontrol et
  let demoBanner: { daysLeft: number; expired: boolean } | null = null;
  let companyType = (session.user as any)?.companyType ?? "firma";
  const companyId = (session.user as any)?.companyId;
  if (companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { isDemo: true, demoExpiresAt: true, type: true },
    });
    if (company?.type) companyType = company.type;
    if (company?.isDemo && company.demoExpiresAt) {
      const daysLeft = Math.ceil(
        (company.demoExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      demoBanner = { daysLeft, expired: daysLeft <= 0 };
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar userName={session.user?.name || "Admin"} role={(session.user as any)?.role} companyType={companyType} />

      {/* Ana içerik */}
      <main className="flex-1 overflow-y-auto flex flex-col pt-14 lg:pt-0">
        {demoBanner && <DemoBanner daysLeft={demoBanner.daysLeft} expired={demoBanner.expired} />}
        {children}
      </main>

      {/* Gecikme bildirimleri */}
      <RouteAlerts />
    </div>
  );
}

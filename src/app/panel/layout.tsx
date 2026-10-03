import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import RouteAlerts from "@/components/RouteAlerts";
import DemoBanner from "@/components/DemoBanner";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import PanelTopbar from "@/components/PanelTopbar";

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
  const isImpersonating = (session.user as any)?.impersonating ?? false;
  const impersonatedCompanyName = (session.user as any)?.impersonatedCompanyName as string | null;
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
    <div className="panel-shell flex overflow-hidden">
      <a href="#panel-content" className="panel-skip">İçeriğe geç</a>
      <Sidebar userName={session.user?.name || "Kullanıcı"} role={(session.user as any)?.role} companyType={companyType} companyId={companyId} />

      {/* Ana içerik */}
      <main id="panel-main" className="flex-1 min-w-0 overflow-y-auto flex flex-col">
        <PanelTopbar userName={session.user?.name || "Hesabım"} />
        {isImpersonating && impersonatedCompanyName && (
          <ImpersonationBanner companyName={impersonatedCompanyName} />
        )}
        {demoBanner && <DemoBanner daysLeft={demoBanner.daysLeft} expired={demoBanner.expired} />}
        <div id="panel-content" tabIndex={-1} className="panel-content">{children}</div>
      </main>

      {/* Gecikme bildirimleri */}
      <RouteAlerts />
    </div>
  );
}

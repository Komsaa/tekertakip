import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCompanyId, tenantWhere } from "@/lib/tenant";
import GuzergahlarClient from "./GuzergahlarClient";

export default async function GuzergahlarPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const companyId = getCompanyId(session);

    const [routes, drivers, vehicles] = await Promise.all([
      prisma.route.findMany({
        where: tenantWhere(companyId),
        orderBy: { createdAt: "asc" },
        include: {
          driver: true,
          vehicle: true,
          stops: { orderBy: { order: "asc" } },
        },
      }),
      prisma.driver.findMany({ where: { status: "active", ...tenantWhere(companyId) }, orderBy: { name: "asc" } }),
      prisma.vehicle.findMany({ where: { status: "active", ...tenantWhere(companyId) }, orderBy: { plate: "asc" } }),
    ]);

    return <GuzergahlarClient initialRoutes={routes} drivers={drivers} vehicles={vehicles} />;
}

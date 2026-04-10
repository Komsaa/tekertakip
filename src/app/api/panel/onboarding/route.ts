import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const companyId = (session.user as any)?.companyId;
  if (!companyId) return NextResponse.json({ error: "Şirket bulunamadı" }, { status: 400 });

  const [vehicles, drivers, routes, jobs, fuelEntries, vehicleIds, driverIds] = await Promise.all([
    prisma.vehicle.count({ where: { companyId } }),
    prisma.driver.count({ where: { companyId, status: "active" } }),
    prisma.route.count({ where: { companyId } }),
    prisma.job.count({ where: { companyId } }),
    prisma.fuelEntry.count({ where: { companyId } }),
    prisma.vehicle.findMany({ where: { companyId }, select: { id: true } }),
    prisma.driver.findMany({ where: { companyId }, select: { id: true } }),
  ]);

  const allEntityIds = [
    ...vehicleIds.map((v) => v.id),
    ...driverIds.map((d) => d.id),
  ];

  const documents = allEntityIds.length > 0
    ? await prisma.document.count({ where: { entityId: { in: allEntityIds } } })
    : 0;

  return NextResponse.json({ vehicles, drivers, routes, jobs, fuelEntries, documents });
}

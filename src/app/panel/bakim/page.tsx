export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCompanyId } from "@/lib/tenant";
import BakimClient from "./BakimClient";

export default async function BakimPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const companyId = getCompanyId(session);
  const cFilter = companyId ? { companyId } : {};

  const [vehicles, maintenanceRecords, vehicleReports] = await Promise.all([
    prisma.vehicle.findMany({
      where: { status: "active", ...cFilter },
      select: { id: true, plate: true, brand: true, model: true },
      orderBy: { plate: "asc" },
    }),
    prisma.vehicleMaintenance.findMany({
      where: { ...cFilter },
      orderBy: { date: "desc" },
    }),
    prisma.vehicleReport.findMany({
      where: companyId ? { driver: { companyId } } : {},
      orderBy: { createdAt: "desc" },
      include: {
        driver: { select: { name: true } },
        vehicle: { select: { id: true } },
      },
    }),
  ]);

  // Araç bazında özet hesapla
  const vehicleData = vehicles.map((v) => {
    const mRecords = maintenanceRecords.filter((m) => m.vehicleId === v.id);
    const vReports = vehicleReports.filter((r) => r.vehicle?.id === v.id);
    const last = mRecords[0] ?? null;
    const openReports = vReports.filter((r) => r.status === "open").length;

    // En yakın nextDate kaydı
    const upcoming = mRecords
      .filter((m) => m.nextDate && new Date(m.nextDate) >= new Date())
      .sort((a, b) => new Date(a.nextDate!).getTime() - new Date(b.nextDate!).getTime())[0] ?? null;

    return {
      id: v.id,
      plate: v.plate,
      brand: v.brand,
      model: v.model,
      openReports,
      lastMaintenance: last
        ? { date: last.date.toISOString(), type: last.type, description: last.description }
        : null,
      nextDate: upcoming?.nextDate?.toISOString() ?? null,
      nextKm: upcoming?.nextKm ?? null,
      maintenanceRecords: mRecords.map((m) => ({
        id: m.id,
        date: m.date.toISOString(),
        type: m.type,
        description: m.description,
        cost: m.cost,
        odometer: m.odometer,
        nextDate: m.nextDate?.toISOString() ?? null,
        nextKm: m.nextKm ?? null,
        kind: "bakim" as const,
      })),
      vehicleReports: vReports.map((r) => ({
        id: r.id,
        date: r.createdAt.toISOString(),
        description: r.description,
        photoUrl: r.photoUrl,
        status: r.status,
        driverName: r.driver.name,
        kind: "ariza" as const,
      })),
    };
  });

  return <BakimClient vehicles={vehicleData} />;
}

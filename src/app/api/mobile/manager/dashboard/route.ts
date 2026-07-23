import { NextRequest, NextResponse } from "next/server";
import { verifyManagerTokenFull } from "@/lib/manager-token";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getManager(req: NextRequest) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyManagerTokenFull(auth.slice(7));
}

export async function GET(req: NextRequest) {
  const manager = getManager(req);
  if (!manager) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const companyFilter = manager.companyId ? { companyId: manager.companyId } : {};

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayJobs, monthFuel, activeDrivers, openReports, recentFuel] = await Promise.all([
    prisma.job.findMany({
      where: { ...companyFilter, date: { gte: todayStart, lte: todayEnd }, status: { not: "cancelled" } },
      include: { driver: { select: { name: true } }, vehicle: { select: { plate: true } } },
      orderBy: { startTime: "asc" },
    }),
    prisma.fuelEntry.aggregate({
      _sum: { totalAmount: true, liters: true },
      where: { ...companyFilter, date: { gte: monthStart } },
    }),
    prisma.driver.count({ where: { ...companyFilter, status: "active", isTracking: true } }),
    prisma.vehicleReport.findMany({
      where: { ...companyFilter, status: "open" },
      include: {
        driver: { select: { name: true } },
        vehicle: { select: { plate: true } },
      },
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
    prisma.fuelEntry.findMany({
      take: 10,
      where: { ...companyFilter },
      orderBy: { createdAt: "desc" },
      include: {
        driver: { select: { name: true } },
        vehicle: { select: { plate: true } },
      },
    }),
  ]);

  return NextResponse.json({
    today: {
      date: now.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" }),
      jobCount: todayJobs.length,
      jobs: todayJobs.map((j) => ({
        id: j.id,
        title: j.title,
        startTime: j.startTime,
        driver: j.driver?.name ?? "-",
        plate: j.vehicle?.plate ?? "-",
        status: j.status,
      })),
    },
    monthFuel: {
      totalAmount: monthFuel._sum.totalAmount ?? 0,
      liters: monthFuel._sum.liters ?? 0,
    },
    activeDriverCount: activeDrivers,
    openReports: openReports.map((r) => ({
      id: r.id,
      description: r.description,
      driver: r.driver?.name ?? "-",
      plate: r.vehicle?.plate ?? "-",
      createdAt: r.createdAt,
    })),
    recentFuel: recentFuel.map((f) => ({
      id: f.id,
      date: f.date,
      liters: f.liters,
      totalAmount: f.totalAmount,
      driver: f.driver?.name ?? "-",
      plate: f.vehicle?.plate ?? "-",
      station: f.station,
      paymentType: f.paymentType,
    })),
  });
}

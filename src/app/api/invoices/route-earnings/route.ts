export const dynamic = "force-dynamic";

// GET /api/invoices/route-earnings?year=2026&month=6
// Her güzergah için: fatura geliri, yakıt gideri, şöför maaşı → net kazanç
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, tenantWhere } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;

  const dateStart = month
    ? new Date(year, month - 1, 1)
    : new Date(year, 0, 1);
  const dateEnd = month
    ? new Date(year, month, 1)
    : new Date(year + 1, 0, 1);

  const [routes, invoices, fuelEntries, salaries] = await Promise.all([
    // Tüm güzergahlar
    prisma.route.findMany({
      where: { ...tenantWhere(companyId) },
      select: {
        id: true,
        name: true,
        driverId: true,
        driver: { select: { id: true, name: true } },
        vehicle: { select: { id: true, plate: true } },
      },
    }),
    // Dönemdeki faturalar (güzergaha bağlı)
    prisma.invoice.findMany({
      where: {
        ...tenantWhere(companyId),
        routeId: { not: null },
        issueDate: { gte: dateStart, lt: dateEnd },
      },
      select: { routeId: true, payableAmount: true, status: true },
    }),
    // Dönemdeki yakıt giderleri (araç bazında)
    prisma.fuelEntry.findMany({
      where: {
        ...tenantWhere(companyId),
        date: { gte: dateStart, lt: dateEnd },
      },
      select: { vehicleId: true, totalAmount: true, driverId: true },
    }),
    // Dönemdeki maaşlar
    month
      ? prisma.salary.findMany({
          where: { ...tenantWhere(companyId), month, year },
          select: { driverId: true, totalAmount: true },
        })
      : Promise.resolve([]),
  ]);

  // Yakıt: araç başına toplam
  const fuelByVehicle: Record<string, number> = {};
  for (const f of fuelEntries) {
    if (!f.vehicleId) continue;
    fuelByVehicle[f.vehicleId] = (fuelByVehicle[f.vehicleId] ?? 0) + f.totalAmount;
  }

  // Maaş: şöför başına toplam
  const salaryByDriver: Record<string, number> = {};
  for (const s of salaries) {
    salaryByDriver[s.driverId] = (salaryByDriver[s.driverId] ?? 0) + s.totalAmount;
  }

  // Fatura geliri: güzergah başına
  const revenueByRoute: Record<string, number> = {};
  const invoiceCountByRoute: Record<string, number> = {};
  for (const inv of invoices) {
    if (!inv.routeId) continue;
    revenueByRoute[inv.routeId] = (revenueByRoute[inv.routeId] ?? 0) + inv.payableAmount;
    invoiceCountByRoute[inv.routeId] = (invoiceCountByRoute[inv.routeId] ?? 0) + 1;
  }

  // Her güzergah için sonuç hesapla
  const result = routes.map((route) => {
    const revenue = revenueByRoute[route.id] ?? 0;
    const invoiceCount = invoiceCountByRoute[route.id] ?? 0;

    // Araç yakıtını güzergaha ata (araç-güzergah 1:1 varsayımı, yakıtı eşit böl)
    // Şimdilik: güzergahın aracına ait yakıtın tamamını bu güzergaha say
    const vehicleFuel = route.vehicle ? (fuelByVehicle[route.vehicle.id] ?? 0) : 0;

    // Şöför maaşını güzergaha ata
    const driverSalary = route.driverId ? (salaryByDriver[route.driverId] ?? 0) : 0;

    const totalCost = vehicleFuel + driverSalary;
    const netProfit = revenue - totalCost;

    return {
      routeId: route.id,
      routeName: route.name,
      driver: route.driver,
      vehicle: route.vehicle,
      revenue,
      invoiceCount,
      fuelCost: vehicleFuel,
      salaryCost: driverSalary,
      totalCost,
      netProfit,
    };
  });

  // Sadece faturaları veya maliyeti olan güzergahları döndür (boş olanları filtrele)
  const filtered = result.filter((r) => r.revenue > 0 || r.totalCost > 0);

  return NextResponse.json({
    period: { year, month },
    routes: filtered,
    totals: {
      revenue: filtered.reduce((s, r) => s + r.revenue, 0),
      fuelCost: filtered.reduce((s, r) => s + r.fuelCost, 0),
      salaryCost: filtered.reduce((s, r) => s + r.salaryCost, 0),
      netProfit: filtered.reduce((s, r) => s + r.netProfit, 0),
    },
  });
}

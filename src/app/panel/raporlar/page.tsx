import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import RaporClient from "./RaporClient";

export default async function RaporlarPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const companyId = (session.user as any)?.companyId ?? null;
  const cFilter = companyId ? { companyId } : {};
  const driverCFilter = companyId ? { driver: { companyId } } : {};

  const now = new Date();
  const month = Math.min(12, Math.max(1, parseInt(searchParams.month ?? String(now.getMonth() + 1))));
  const year = parseInt(searchParams.year ?? String(now.getFullYear()));

  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59);

  // Son 6 ay trend verisi
  const trendMonths: { m: number; y: number; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    trendMonths.push({
      m: d.getMonth() + 1,
      y: d.getFullYear(),
      label: `${d.getMonth() + 1}/${d.getFullYear()}`,
    });
  }

  const trendData = await Promise.all(
    trendMonths.map(async ({ m, y, label }) => {
      const s = new Date(y, m - 1, 1);
      const e = new Date(y, m, 0, 23, 59, 59);
      const [inv, fuel, sal] = await Promise.all([
        prisma.invoice.aggregate({
          _sum: { payableAmount: true },
          where: { issueDate: { gte: s, lte: e }, ...cFilter },
        }),
        prisma.fuelEntry.aggregate({
          _sum: { totalAmount: true },
          where: { date: { gte: s, lte: e }, ...cFilter },
        }),
        prisma.salary.aggregate({
          _sum: { totalAmount: true },
          where: { month: m, year: y, ...driverCFilter },
        }),
      ]);
      return {
        label,
        gelir: Math.round(inv._sum.payableAmount ?? 0),
        yakit: Math.round(fuel._sum.totalAmount ?? 0),
        maas: Math.round(sal._sum.totalAmount ?? 0),
      };
    })
  );

  // Seçili dönem verileri
  const [invoices, fuelEntries, salaries, jobs] = await Promise.all([
    prisma.invoice.findMany({
      where: { issueDate: { gte: periodStart, lte: periodEnd }, ...cFilter },
      include: { client: { select: { name: true } } },
      orderBy: { issueDate: "desc" },
    }),
    prisma.fuelEntry.findMany({
      where: { date: { gte: periodStart, lte: periodEnd }, ...cFilter },
      include: { vehicle: { select: { plate: true } } },
    }),
    prisma.salary.findMany({
      where: { month, year, ...driverCFilter },
      include: { driver: { select: { name: true, id: true } } },
    }),
    prisma.job.findMany({
      where: {
        date: { gte: periodStart, lte: periodEnd },
        status: { not: "cancelled" },
        ...cFilter,
      },
      select: {
        driverId: true,
        driver: { select: { name: true } },
        revenue: true,
      },
    }),
  ]);

  const totalFatura = invoices.reduce((s, i) => s + i.payableAmount, 0);
  const tahsilEdilen = invoices
    .filter((i) => i.status === "odendi")
    .reduce((s, i) => s + i.payableAmount, 0);
  const totalYakit = fuelEntries.reduce((s, f) => s + f.totalAmount, 0);
  const totalMaas = salaries.reduce((s, s2) => s + s2.totalAmount, 0);

  // Şöför özeti
  const driverMap: Record<string, { name: string; jobCount: number; salary: number }> = {};
  for (const job of jobs) {
    if (!job.driverId || !job.driver) continue;
    if (!driverMap[job.driverId])
      driverMap[job.driverId] = { name: job.driver.name, jobCount: 0, salary: 0 };
    driverMap[job.driverId].jobCount++;
  }
  for (const sal of salaries) {
    if (!driverMap[sal.driverId])
      driverMap[sal.driverId] = { name: sal.driver.name, jobCount: 0, salary: 0 };
    driverMap[sal.driverId].salary = sal.totalAmount;
  }

  // Araç bazlı yakıt
  const fuelByVehicle: Record<string, number> = {};
  for (const f of fuelEntries) {
    fuelByVehicle[f.vehicle.plate] = (fuelByVehicle[f.vehicle.plate] ?? 0) + f.totalAmount;
  }

  return (
    <RaporClient
      month={month}
      year={year}
      trendData={trendData}
      summary={{
        totalFatura,
        tahsilEdilen,
        totalYakit,
        totalMaas,
        seferCount: jobs.length,
        netKar: tahsilEdilen - totalYakit - totalMaas,
      }}
      invoices={invoices.map((i) => ({
        invoiceNo: i.invoiceNo,
        clientName: i.client.name,
        amount: i.payableAmount,
        status: i.status,
        issueDate: i.issueDate.toISOString(),
      }))}
      fuelByVehicle={Object.entries(fuelByVehicle)
        .map(([plate, amount]) => ({ plate, amount }))
        .sort((a, b) => b.amount - a.amount)}
      drivers={Object.values(driverMap).sort((a, b) => b.jobCount - a.jobCount)}
    />
  );
}

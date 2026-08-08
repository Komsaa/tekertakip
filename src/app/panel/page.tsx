import { prisma } from "@/lib/prisma";
import { getDocStatus, getDaysLeft } from "@/lib/utils";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CommandCenter from "@/components/CommandCenter";
import OkulDashboard from "@/components/OkulDashboard";
import { startOfDay, endOfDay } from "date-fns";

export default async function DashboardPage() {
  try {
    const today = new Date();
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const companyId = (session.user as any)?.companyId ?? null;
    const role = (session.user as any)?.role;

    // Superadmin → direkt admin paneline yönlendir
    if (role === "admin" && !companyId) redirect("/panel/admin");

    const cFilter = companyId ? { companyId } : {};

    // Şirket tipini belirle
    let companyType = "firma";
    let companyName = "";
    if (companyId) {
      const co = await prisma.company.findUnique({
        where: { id: companyId },
        select: { type: true, name: true },
      });
      companyType = co?.type ?? "firma";
      companyName = co?.name ?? "";
    }

    const isOkul = companyType === "okul";
    const todayStr = today.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    // ── OKUL dashboard ───────────────────────────────────────────────────────
    if (isOkul) {
      const [drivers, vehicles, routes, notesSetting] = await Promise.all([
        prisma.driver.findMany({ where: { status: "active", ...cFilter } }),
        prisma.vehicle.findMany({ where: { status: "active", ...cFilter } }),
        prisma.route.findMany({
          where: { ...cFilter },
          include: {
            driver: { select: { name: true } },
            vehicle: { select: { plate: true } },
            stops: {
              include: { passengers: { where: { active: true }, select: { id: true } } },
            },
          },
          orderBy: { name: "asc" },
        }),
        prisma.setting.findFirst({ where: { key: "dashboard_notes", companyId: null } }).catch(() => null),
      ]);

      // Belge uyarıları
      const allDocs: any[] = [];
      for (const d of drivers) {
        allDocs.push({ id: d.id, name: d.name, type: "driver", docName: "Ehliyet", expiryDate: d.licenseExpiry, href: `/panel/soforler/${d.id}` });
      }
      for (const v of vehicles) {
        for (const [label, expiry] of [
          ["Muayene", v.inspectionExpiry], ["Trafik Sig.", v.insuranceExpiry],
          ["Güzergah İzni", v.routePermitExpiry], ["Uygunluk", v.approvalExpiry], ["Kasko", v.kaskoExpiry],
        ] as [string, Date | null][]) {
          allDocs.push({ id: v.id, name: v.plate, type: "vehicle", docName: label, expiryDate: expiry, href: `/panel/araclar/${v.id}` });
        }
      }
      const alertDocs = allDocs
        .filter(doc => ["expired", "critical", "warning"].includes(getDocStatus(doc.expiryDate)))
        .sort((a, b) => (getDaysLeft(a.expiryDate) ?? -9999) - (getDaysLeft(b.expiryDate) ?? -9999))
        .slice(0, 20)
        .map(doc => ({ ...doc, expiryDate: doc.expiryDate?.toISOString() ?? null, daysLeft: getDaysLeft(doc.expiryDate), status: getDocStatus(doc.expiryDate) }));

      const totalStudents = routes.reduce((sum, r) => sum + r.stops.reduce((s2, st) => s2 + st.passengers.length, 0), 0);

      const routeInfos = routes.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        active: r.active,
        driverName: r.driver?.name ?? null,
        vehiclePlate: r.vehicle?.plate ?? null,
        stopCount: r.stops.length,
        passengerCount: r.stops.reduce((s, st) => s + st.passengers.length, 0),
      }));

      return (
        <div className="flex-1 flex flex-col min-h-0 relative">
          <OkulDashboard
            routes={routeInfos}
            alertDocs={alertDocs}
            initialNotes={notesSetting?.value ?? ""}
            today={todayStr}
            companyName={companyName}
            stats={{
              activeDrivers: drivers.length,
              activeVehicles: vehicles.length,
              activeRoutes: routes.filter(r => r.active).length,
              totalStudents,
            }}
          />
        </div>
      );
    }

    // ── FİRMA dashboard (mevcut) ─────────────────────────────────────────────
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay() + 1); weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23, 59, 59, 999);

    const [drivers, vehicles, todayJobs, creditCards, upcomingChecks, pendingInvoices, notesSetting,
           activeDriverCount, activeVehicleCount, activeRouteCount, monthJobCount,
           monthFuelAgg, weekJobs] =
      await Promise.all([
        prisma.driver.findMany({ where: { status: "active", ...cFilter } }),
        prisma.vehicle.findMany({ where: { status: "active", ...cFilter } }),
        prisma.job.findMany({
          where: { date: { gte: startOfDay(today), lte: endOfDay(today) }, ...cFilter },
          include: { driver: { select: { id: true, name: true } }, vehicle: { select: { id: true, plate: true } } },
          orderBy: { startTime: "asc" },
        }),
        prisma.creditCard.findMany({
          where: { active: true, ...cFilter },
          include: { expenses: { select: { amount: true, billingMonth: true, billingYear: true } } },
        }).catch(() => []),
        prisma.check.findMany({
          where: { status: "bekliyor", dueDate: { lte: new Date(today.getTime() + 7 * 86400000) }, ...cFilter },
          include: { contact: { select: { name: true } } },
          orderBy: { dueDate: "asc" },
        }).catch(() => []),
        prisma.invoice.findMany({
          where: { status: { in: ["bekliyor", "gecikti"] }, ...cFilter },
          include: { client: { select: { name: true } } },
          orderBy: { dueDate: "asc" },
          take: 20,
        }).catch(() => []),
        prisma.setting.findFirst({ where: { key: "dashboard_notes", companyId: null } }).catch(() => null),
        prisma.driver.count({ where: { status: "active", ...cFilter } }),
        prisma.vehicle.count({ where: { status: "active", ...cFilter } }),
        prisma.route.count({ where: { active: true, ...cFilter } }),
        prisma.job.count({ where: { date: { gte: monthStart }, ...cFilter } }),
        prisma.fuelEntry.aggregate({
          _sum: { totalAmount: true },
          where: { date: { gte: monthStart }, ...cFilter },
        }).catch(() => ({ _sum: { totalAmount: null } })),
        prisma.job.findMany({
          where: { date: { gte: weekStart, lte: weekEnd }, status: { not: "cancelled" }, ...cFilter },
          select: { driverId: true, driver: { select: { name: true } } },
        }).catch(() => []),
      ]);

    const allDocs: any[] = [];
    for (const d of drivers) {
      allDocs.push({ id: d.id, name: d.name, type: "driver", docName: "Ehliyet", expiryDate: d.licenseExpiry, href: `/panel/soforler/${d.id}` });
    }
    for (const v of vehicles) {
      for (const [label, expiry] of [
        ["Muayene", v.inspectionExpiry], ["Trafik Sig.", v.insuranceExpiry],
        ["Güzergah İzni", v.routePermitExpiry], ["Uygunluk", v.approvalExpiry], ["Kasko", v.kaskoExpiry],
      ] as [string, Date | null][]) {
        allDocs.push({ id: v.id, name: v.plate, type: "vehicle", docName: label, expiryDate: expiry, href: `/panel/araclar/${v.id}` });
      }
    }
    const alertDocs = allDocs
      .filter(doc => ["expired", "critical", "warning"].includes(getDocStatus(doc.expiryDate)))
      .sort((a, b) => (getDaysLeft(a.expiryDate) ?? -9999) - (getDaysLeft(b.expiryDate) ?? -9999))
      .slice(0, 20)
      .map(doc => ({ ...doc, expiryDate: doc.expiryDate?.toISOString() ?? null, daysLeft: getDaysLeft(doc.expiryDate), status: getDocStatus(doc.expiryDate) }));

    const creditCardAlerts = creditCards.map(card => {
      const day = today.getDate();
      let bMonth = today.getMonth() + 1;
      let bYear = today.getFullYear();
      if (day < card.billingDay) { bMonth = bMonth === 1 ? 12 : bMonth - 1; if (bMonth === 12) bYear--; }
      const billingDate = new Date(bYear, bMonth - 1, card.billingDay);
      const paymentDue = new Date(billingDate);
      paymentDue.setDate(paymentDue.getDate() + card.paymentDaysAfterBilling);
      const daysToPayment = Math.floor((paymentDue.getTime() - today.getTime()) / 86400000);
      const periodTotal = card.expenses.filter(e => e.billingMonth === bMonth && e.billingYear === bYear).reduce((s, e) => s + e.amount, 0);
      return { id: card.id, name: card.name, bank: card.bank, color: card.color, daysToPayment, paymentDue: paymentDue.toISOString(), periodTotal };
    }).filter(c => c.daysToPayment >= 0 && c.daysToPayment <= 7);

    // Şöför haftalık yük
    const driverWeekMap: Record<string, { name: string; count: number }> = {};
    for (const job of weekJobs) {
      if (!job.driverId || !job.driver) continue;
      if (!driverWeekMap[job.driverId]) driverWeekMap[job.driverId] = { name: job.driver.name, count: 0 };
      driverWeekMap[job.driverId].count++;
    }
    const weekDriverJobs = Object.values(driverWeekMap).sort((a, b) => b.count - a.count);

    return (
      <div className="flex-1 flex flex-col min-h-0">
        <CommandCenter
          todayJobs={todayJobs}
          vehicles={vehicles.map(v => ({ id: v.id, plate: v.plate, brand: v.brand ?? null, model: v.model ?? null }))}
          creditCardAlerts={creditCardAlerts}
          upcomingChecks={upcomingChecks.map(c => ({ ...c, dueDate: c.dueDate.toISOString() }))}
          pendingInvoices={pendingInvoices.map(i => ({ ...i, dueDate: i.dueDate.toISOString() }))}
          alertDocs={alertDocs}
          initialNotes={notesSetting?.value ?? ""}
          today={todayStr}
          weekDriverJobs={weekDriverJobs}
          stats={{
            activeDrivers: activeDriverCount,
            activeVehicles: activeVehicleCount,
            activeRoutes: activeRouteCount,
            plannedToday: todayJobs.length,
            completedToday: todayJobs.filter(j => j.status === "completed").length,
            cancelledToday: todayJobs.filter(j => j.status === "cancelled").length,
            monthJobs: monthJobCount,
            monthFuel: Math.round(monthFuelAgg._sum.totalAmount ?? 0),
          }}
        />
      </div>
    );
  } catch (e) {
    console.error("Dashboard hata:", e);
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-400">Dashboard yüklenemedi. Sayfayı yenileyin.</p>
      </div>
    );
  }
}

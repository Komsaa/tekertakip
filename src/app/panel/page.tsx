import { prisma } from "@/lib/prisma";
import { getDocStatus, getDaysLeft } from "@/lib/utils";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CommandCenter from "@/components/CommandCenter";
import { startOfDay, endOfDay } from "date-fns";

async function getData() {
  try {
    const today = new Date();
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const companyId = (session.user as any)?.companyId ?? null;
    const cFilter = companyId ? { companyId } : {};

    const [drivers, vehicles, todayJobs, creditCards, upcomingChecks, pendingInvoices, notesSetting,
           activeDriverCount, activeVehicleCount, activeRouteCount, monthJobCount] =
      await Promise.all([
        prisma.driver.findMany({ where: { status: "active", ...cFilter } }),
        prisma.vehicle.findMany({ where: { status: "active", ...cFilter } }),
        prisma.job.findMany({
          where: { date: { gte: startOfDay(today), lte: endOfDay(today) } },
          include: { driver: { select: { id: true, name: true } }, vehicle: { select: { id: true, plate: true } } },
          orderBy: { startTime: "asc" },
        }),
        prisma.creditCard.findMany({
          where: { active: true },
          include: { expenses: { select: { amount: true, billingMonth: true, billingYear: true } } },
        }).catch(() => []),
        prisma.check.findMany({
          where: {
            status: "bekliyor",
            dueDate: { lte: new Date(today.getTime() + 7 * 86400000) },
          },
          include: { contact: { select: { name: true } } },
          orderBy: { dueDate: "asc" },
        }).catch(() => []),
        prisma.invoice.findMany({
          where: { status: { in: ["bekliyor", "gecikti"] } },
          include: { client: { select: { name: true } } },
          orderBy: { dueDate: "asc" },
          take: 20,
        }).catch(() => []),
        prisma.setting.findFirst({ where: { key: "dashboard_notes", companyId: null } }).catch(() => null),
        prisma.driver.count({ where: { status: "active", ...cFilter } }),
        prisma.vehicle.count({ where: { status: "active", ...cFilter } }),
        prisma.route.count({ where: { active: true, ...cFilter } }),
        prisma.job.count({ where: { date: { gte: new Date(today.getFullYear(), today.getMonth(), 1) }, ...cFilter } }),
      ]);

    // Belge uyarıları
    const allDocs: any[] = [];
    for (const d of drivers) {
      allDocs.push(
        { id: d.id, name: d.name, type: "driver", docName: "Ehliyet", expiryDate: d.licenseExpiry, href: `/panel/soforler/${d.id}` },
      );
    }
    for (const v of vehicles) {
      const vDocs = [
        { key: "inspection", label: "Muayene", expiry: v.inspectionExpiry },
        { key: "insurance", label: "Trafik Sig.", expiry: v.insuranceExpiry },
        { key: "routePermit", label: "Güzergah İzni", expiry: v.routePermitExpiry },
        { key: "approval", label: "Uygunluk", expiry: v.approvalExpiry },
        { key: "kasko", label: "Kasko", expiry: v.kaskoExpiry },
      ];
      for (const doc of vDocs) {
        allDocs.push({ id: v.id, name: v.plate, type: "vehicle", docName: doc.label, expiryDate: doc.expiry, href: `/panel/araclar/${v.id}` });
      }
    }

    const alertDocs = allDocs
      .filter(doc => {
        const s = getDocStatus(doc.expiryDate);
        return s === "expired" || s === "critical" || s === "warning";
      })
      .sort((a, b) => (getDaysLeft(a.expiryDate) ?? -9999) - (getDaysLeft(b.expiryDate) ?? -9999))
      .slice(0, 20)
      .map(doc => ({
        ...doc,
        expiryDate: doc.expiryDate?.toISOString() ?? null,
        daysLeft: getDaysLeft(doc.expiryDate),
        status: getDocStatus(doc.expiryDate),
      }));

    // Kredi kartı ödeme uyarıları (7 gün)
    const creditCardAlerts = creditCards
      .map(card => {
        const day = today.getDate();
        let bMonth = today.getMonth() + 1;
        let bYear = today.getFullYear();
        if (day < card.billingDay) { bMonth = bMonth === 1 ? 12 : bMonth - 1; if (bMonth === 12) bYear--; }
        const billingDate = new Date(bYear, bMonth - 1, card.billingDay);
        const paymentDue = new Date(billingDate);
        paymentDue.setDate(paymentDue.getDate() + card.paymentDaysAfterBilling);
        const daysToPayment = Math.floor((paymentDue.getTime() - today.getTime()) / 86400000);
        const periodTotal = card.expenses
          .filter(e => e.billingMonth === bMonth && e.billingYear === bYear)
          .reduce((s, e) => s + e.amount, 0);
        return { id: card.id, name: card.name, bank: card.bank, color: card.color, daysToPayment, paymentDue: paymentDue.toISOString(), periodTotal };
      })
      .filter(c => c.daysToPayment >= 0 && c.daysToPayment <= 7);

    const todayStr = today.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    return {
      todayJobs,
      creditCardAlerts,
      upcomingChecks: upcomingChecks.map(c => ({ ...c, dueDate: c.dueDate.toISOString() })),
      pendingInvoices: pendingInvoices.map(i => ({ ...i, dueDate: i.dueDate.toISOString() })),
      alertDocs,
      initialNotes: notesSetting?.value ?? "",
      today: todayStr,
      stats: {
        activeDrivers: activeDriverCount,
        activeVehicles: activeVehicleCount,
        activeRoutes: activeRouteCount,
        plannedToday: todayJobs.length,
        completedToday: todayJobs.filter(j => j.status === "completed" || j.status === "active").length,
        cancelledToday: todayJobs.filter(j => j.status === "cancelled").length,
        monthJobs: monthJobCount,
      },
    };
  } catch (e) {
    console.error("Dashboard hata:", e);
    return {
      todayJobs: [], creditCardAlerts: [], upcomingChecks: [],
      pendingInvoices: [], alertDocs: [], initialNotes: "",
      today: new Date().toLocaleDateString("tr-TR"),
      stats: { activeDrivers: 0, activeVehicles: 0, activeRoutes: 0, plannedToday: 0, completedToday: 0, cancelledToday: 0, monthJobs: 0 },
    };
  }
}

export default async function DashboardPage() {
  const data = await getData();
  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 0px)" }}>
      <CommandCenter {...data} />
    </div>
  );
}
